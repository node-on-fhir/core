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

  describe('logging.setRuntimeThreshold', function() {
    it('rejects with feature-disabled when allowRuntimeThresholdOverride is absent/false', async function() {
      // The settings gate is checked FIRST (before userId) so this test can assert
      // feature-disabled without needing to log in. See loggingMethods.js guard-order note.
      const originalPrivate = Meteor.settings.private;
      Meteor.settings.private = {};
      try {
        await Meteor.callAsync('logging.setRuntimeThreshold', {});
        assert.fail('expected feature-disabled error');
      } catch (error) {
        assert.equal(error.error, 'feature-disabled', 'should throw feature-disabled when setting is absent');
      } finally {
        Meteor.settings.private = originalPrivate;
      }
    });
  });

  describe('logging.setPhiDebugging', function() {
    it('rejects with feature-disabled when allowPhiDebugging is absent/false', async function() {
      // Settings gate checked FIRST (same guard-order pattern as setRuntimeThreshold) —
      // test can assert feature-disabled without needing a logged-in user.
      const originalPrivate = Meteor.settings.private;
      Meteor.settings.private = {};
      try {
        await Meteor.callAsync('logging.setPhiDebugging', { enabled: true });
        assert.fail('expected feature-disabled error');
      } catch (error) {
        assert.equal(error.error, 'feature-disabled', 'should throw feature-disabled when allowPhiDebugging is absent');
      } finally {
        Meteor.settings.private = originalPrivate;
      }
    });
  });
}
