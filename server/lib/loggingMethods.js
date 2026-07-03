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

// Module-level timer so repeated enable calls replace the previous auto-off schedule.
let phiAutoOffTimer = null;

Meteor.methods({
  'logging.setPhiDebugging': async function(options) {
    check(options, { enabled: Boolean, ttlMinutes: Match.Optional(Number) });
    // Guard 1 (settings gate FIRST — same established order as setRuntimeThreshold, same
    // comment rationale: this error reveals nothing sensitive and lets tests assert
    // feature-disabled without auth plumbing).
    if (get(Meteor, 'settings.private.logging.allowPhiDebugging', false) !== true) {
      throw new Meteor.Error('feature-disabled', 'PHI debugging is disabled. Set Meteor.settings.private.logging.allowPhiDebugging to true.');
    }
    // Guard 2: authentication.
    if (!this.userId) { throw new Meteor.Error('not-authorized'); }
    // Guard 3: Mongo backend is mandatory — raw payloads must only ever land in the HIPAA
    // tier (ServerLogs collection), never on stdout or any other backend.
    if (options.enabled && !Meteor._mongoLogBackend) {
      throw new Meteor.Error('mongo-backend-required', 'PHI debugging requires the Mongo log backend (settings.private.logging.mongo.enabled) — raw payloads are only ever stored in the HIPAA tier, never on stdout.');
    }

    const { enabled } = options;
    const rawTtl = options.ttlMinutes;

    // Clear any prior auto-off timer before applying the new state.
    if (phiAutoOffTimer) { clearTimeout(phiAutoOffTimer); phiAutoOffTimer = null; }

    Logger.setPhiDebugging(enabled);

    let effectiveTtl = null;
    let autoOffAt = null;

    if (enabled) {
      // Cap ttlMinutes to [1, 240]; default 60.
      effectiveTtl = Math.max(1, Math.min(240, rawTtl != null ? rawTtl : 60));
      autoOffAt = new Date(Date.now() + effectiveTtl * 60 * 1000).toISOString();
      phiAutoOffTimer = setTimeout(function() {
        phiAutoOffTimer = null;
        Logger.setPhiDebugging(false);
        Logger.for('loggingMethods').warn('PHI debugging auto-expired', { ttlMinutes: effectiveTtl });
      }, effectiveTtl * 60 * 1000);
    }

    // Log the change at warn so every session leaves a trace with a full audit trail.
    Logger.for('loggingMethods').warn('PHI debugging ' + (enabled ? 'ENABLED' : 'disabled'), { userId: this.userId, ttlMinutes: effectiveTtl, autoOffAt: autoOffAt });

    return { enabled: Logger.getPhiDebugging(), autoOffAt: autoOffAt };
  }
});

DDPRateLimiter.addRule({ type: 'method', name: 'logging.setPhiDebugging', connectionId: function() { return true; } }, 10, 10000);
