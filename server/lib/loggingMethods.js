// server/lib/loggingMethods.js
//
// rpc-migration note: both methods are feature-gated and their settings gate
// MUST fire before any auth error (tests/mocha/loggingMethods.test.js asserts
// 'feature-disabled' surfaces without auth plumbing). The ServerMethods
// pipeline checks requireAuth BEFORE the handler runs, so both methods keep
// requireAuth: false and preserve their guards inline, in the original order
// (settings gate first, then userId where applicable).
import { Meteor } from 'meteor/meteor';
import ServerMethods from '/imports/lib/ServerMethods.js';
import { get } from 'lodash';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import RedactModule from '/imports/lib/loggerRedact.js';
import LoggerModule from '/imports/lib/Logger.js';
const { redactPhi } = RedactModule;
const { Logger } = LoggerModule;

ServerMethods.define('logging.clientBatch', {
  description: 'Relay a batch of client-side warn/error log records to the server log',
  // Public by PRE-MIGRATION design: clients ship warn/error records even
  // before login (the relay captures pre-auth boot errors); the
  // settings.public.logging.shipClientLogs gate below is the guard.
  requireAuth: false,
  positionalParams: ['records'],
  schemaObject: {
    type: 'object',
    properties: {
      records: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            ts: { type: 'string' },
            level: { type: 'string' },
            module: { type: 'string' },
            msg: { type: 'string' }
          },
          required: ['ts', 'level', 'module', 'msg']
        }
      }
    },
    required: ['records']
  }
}, async function(params, context) {
  const records = params.records;
  // Guard order preserved from pre-migration: settings gate first.
  if (get(Meteor, 'settings.public.logging.shipClientLogs', false) !== true) {
    throw new Meteor.Error('feature-disabled', 'Client log shipping is disabled. Set Meteor.settings.public.logging.shipClientLogs to true.');
  }
  const log = Meteor.Logger.for('clientRelay');
  const userId = context.userId || null;
  let accepted = 0;
  records.slice(0, 20).forEach(function(record) {
    if (!['warn', 'error'].includes(record.level)) { return; }
    accepted = accepted + 1;
    log[record.level]('[client ' + record.module + '] ' + record.msg, {
      clientData: record.data !== undefined ? redactPhi(record.data) : undefined,   // defense in depth
      clientTs: record.ts, userId: userId, group: record.group
    });
  });
  return { accepted: accepted };
});

DDPRateLimiter.addRule({ type: 'method', name: 'logging.clientBatch', connectionId: function() { return true; } }, 10, 10000);

ServerMethods.define('logging.setRuntimeThreshold', {
  description: 'Override the runtime log thresholds (global and mongo backends) when the settings flag allows it',
  // requireAuth stays false so the settings gate fires BEFORE not-authorized
  // (guard ORDER is load-bearing — asserted by tests/mocha/loggingMethods.test.js).
  // The userId check is preserved inline as guard 2 below.
  requireAuth: false,
  schemaObject: {
    type: 'object',
    properties: {
      global: { type: 'string' },
      mongo: { type: 'string' }
    }
  }
}, async function(params, context) {
  // Guard 1 (checked FIRST so the mocha test can assert feature-disabled without
  // auth plumbing — acceptable because this error reveals nothing sensitive).
  // Guard order deviation from the usual convention is intentional; see spec note.
  if (get(Meteor, 'settings.private.logging.allowRuntimeThresholdOverride', false) !== true) {
    throw new Meteor.Error('feature-disabled', 'Runtime log threshold override is disabled. Set Meteor.settings.private.logging.allowRuntimeThresholdOverride to true.');
  }
  // Guard 2: authentication.
  if (!context.userId) { throw new Meteor.Error('not-authorized'); }

  const { global: globalLevel, mongo: mongoLevel } = params;
  if (globalLevel != null) { Meteor.Logger.setThreshold(globalLevel); }
  if (mongoLevel != null && Meteor._mongoLogBackend) { Meteor._mongoLogBackend.setThreshold(mongoLevel); }

  // Log the override itself so a prod debugging session leaves a trace.
  Logger.for('loggingMethods').warn('runtime log threshold changed', { global: globalLevel, mongo: mongoLevel, userId: context.userId });

  return {
    global: Meteor.Logger.getThreshold(),
    mongo:  Meteor._mongoLogBackend ? Meteor._mongoLogBackend.stats() : null
  };
});

DDPRateLimiter.addRule({ type: 'method', name: 'logging.setRuntimeThreshold', connectionId: function() { return true; } }, 10, 10000);
