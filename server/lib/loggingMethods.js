// server/lib/loggingMethods.js
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import RedactModule from '/imports/lib/loggerRedact.js';
import LoggerModule from '/imports/lib/Logger.js';
const { redactPhi } = RedactModule;
const { Logger } = LoggerModule;

Meteor.methods({
  'logging.clientBatch': async function(records) {
    check(records, [Match.ObjectIncluding({ ts: String, level: String, module: String, msg: String })]);
    if (get(Meteor, 'settings.public.logging.shipClientLogs', false) !== true) {
      throw new Meteor.Error('feature-disabled', 'Client log shipping is disabled. Set Meteor.settings.public.logging.shipClientLogs to true.');
    }
    const log = Meteor.Logger.for('clientRelay');
    const userId = this.userId || null;   // capture before forEach loses 'this' binding
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
  }
});

DDPRateLimiter.addRule({ type: 'method', name: 'logging.clientBatch', connectionId: function() { return true; } }, 10, 10000);

Meteor.methods({
  'logging.setRuntimeThreshold': async function(params) {
    check(params, Match.ObjectIncluding({
      global: Match.Optional(String),
      mongo:  Match.Optional(String)
    }));
    // Guard 1 (checked FIRST so the mocha test can assert feature-disabled without
    // auth plumbing — acceptable because this error reveals nothing sensitive).
    // Guard order deviation from the usual convention is intentional; see spec note.
    if (get(Meteor, 'settings.private.logging.allowRuntimeThresholdOverride', false) !== true) {
      throw new Meteor.Error('feature-disabled', 'Runtime log threshold override is disabled. Set Meteor.settings.private.logging.allowRuntimeThresholdOverride to true.');
    }
    // Guard 2: authentication.
    if (!this.userId) { throw new Meteor.Error('not-authorized'); }

    const { global: globalLevel, mongo: mongoLevel } = params;
    if (globalLevel != null) { Meteor.Logger.setThreshold(globalLevel); }
    if (mongoLevel != null && Meteor._mongoLogBackend) { Meteor._mongoLogBackend.setThreshold(mongoLevel); }

    // Log the override itself so a prod debugging session leaves a trace.
    Logger.for('loggingMethods').warn('runtime log threshold changed', { global: globalLevel, mongo: mongoLevel, userId: this.userId });

    return {
      global: Meteor.Logger.getThreshold(),
      mongo:  Meteor._mongoLogBackend ? Meteor._mongoLogBackend.stats() : null
    };
  }
});

DDPRateLimiter.addRule({ type: 'method', name: 'logging.setRuntimeThreshold', connectionId: function() { return true; } }, 10, 10000);
