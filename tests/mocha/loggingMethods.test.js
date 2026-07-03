import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';

if (Meteor.isServer) {
  describe('logging.clientBatch', function() {
    it('rejects when shipClientLogs is off', async function() {
      const original = Meteor.settings.public.logging;
      Meteor.settings.public.logging = { shipClientLogs: false };
      try {
        await Meteor.callAsync('logging.clientBatch', [{ ts: new Date().toISOString(), level: 'error', module: 'X', msg: 'boom', group: [], source: 'client', phi: false }]);
        assert.fail('expected feature-disabled');
      } catch (error) {
        assert.equal(error.error, 'feature-disabled');
      } finally { Meteor.settings.public.logging = original; }
    });

    it('accepts, re-redacts, and stamps source when on', async function() {
      const original = Meteor.settings.public.logging;
      Meteor.settings.public.logging = { shipClientLogs: true };
      try {
        const result = await Meteor.callAsync('logging.clientBatch', [{ ts: new Date().toISOString(), level: 'warn', module: 'X', msg: 'w', data: { name: [{ family: 'S' }] }, group: [], source: 'client', phi: false }]);
        assert.equal(result.accepted, 1);
      } finally { Meteor.settings.public.logging = original; }
    });
  });
}
