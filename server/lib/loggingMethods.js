// server/lib/loggingMethods.js
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import RedactModule from '/imports/lib/loggerRedact.js';
const { redactPhi } = RedactModule;

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
