// tests/mocha/rpcAuth.test.js
// Task 3 test matrix for the dual-acceptance auth middleware (RpcAuth).
// NOTE: the meteortesting:mocha harness currently runs 0 tests under the
// rspack build (issue #171) — this matrix was verified LIVE against a booted
// app (curl + browser) on 2026-07-22 and stands ready as regression coverage
// the moment the harness is repaired.

import assert from 'assert';
import { Meteor } from 'meteor/meteor';

if (Meteor.isServer) {
  const { resolveRpcAuth } = require('/server/rpc/RpcAuth.js');
  const { Accounts } = require('meteor/accounts-base');

  function fakeReq(headers) {
    return { headers: headers || {} };
  }

  describe('RpcAuth.resolveRpcAuth (Task 3 matrix)', function () {

    it('no Authorization header -> null user, via null', async function () {
      const auth = await resolveRpcAuth(fakeReq({}));
      assert.strictEqual(auth.userId, null);
      assert.deepStrictEqual(auth.scopes, []);
      assert.strictEqual(auth.via, null);
    });

    it('garbage bearer -> null user, does NOT throw', async function () {
      const auth = await resolveRpcAuth(fakeReq({ authorization: 'Bearer utter-garbage' }));
      assert.strictEqual(auth.userId, null);
      assert.strictEqual(auth.via, null);
    });

    it('malformed (non-Bearer) header -> null user', async function () {
      const auth = await resolveRpcAuth(fakeReq({ authorization: 'Token abc' }));
      assert.strictEqual(auth.userId, null);
    });

    it('OAuth path (FhirAuth) is tried FIRST and wins when it authenticates', async function () {
      let parseCalled = false;
      const auth = await resolveRpcAuth(
        fakeReq({ authorization: 'Bearer some-oauth-token' }),
        { parseAuth: async function () {
            parseCalled = true;
            return { role: 'patient', userId: 'oauth-user-1', scope: 'patient/*.rs launch', isOAuthToken: true };
        } }
      );
      assert.strictEqual(parseCalled, true);
      assert.strictEqual(auth.userId, 'oauth-user-1');
      assert.strictEqual(auth.via, 'oauth');
      assert.deepStrictEqual(auth.scopes, ['patient/*.rs', 'launch']);
    });

    it('parseUserAuthorization throwing is treated as unauthenticated, not an exception', async function () {
      const auth = await resolveRpcAuth(
        fakeReq({ authorization: 'Bearer whatever' }),
        { parseAuth: async function () { throw new Error('oauth backend down'); } }
      );
      assert.strictEqual(auth.userId, null);
    });

    describe('Meteor login-token fallback', function () {
      let userId;
      let validToken;

      before(async function () {
        const username = 'rpcauth-test-' + Math.floor(Math.random() * 100000);
        userId = await Accounts.createUserAsync({ username: username, password: 'rpcauth-test-password' });
        const stamped = Accounts._generateStampedLoginToken();
        validToken = stamped.token;
        await Accounts._insertLoginToken(userId, stamped);
      });

      after(async function () {
        if (userId) { await Meteor.users.removeAsync({ _id: userId }); }
      });

      it('valid login token -> correct userId, via loginToken', async function () {
        const auth = await resolveRpcAuth(
          fakeReq({ authorization: 'Bearer ' + validToken }),
          { parseAuth: async function () { return false; } }   // force OAuth miss
        );
        assert.strictEqual(auth.userId, userId);
        assert.strictEqual(auth.via, 'loginToken');
      });

      it('expired login token -> null user (expiry honored)', async function () {
        const stamped = Accounts._generateStampedLoginToken();
        const ancient = new Date(Date.now() - (400 * 24 * 60 * 60 * 1000));   // 400 days ago
        await Meteor.users.updateAsync({ _id: userId }, {
          $push: { 'services.resume.loginTokens': { hashedToken: Accounts._hashLoginToken(stamped.token), when: ancient } }
        });
        const auth = await resolveRpcAuth(
          fakeReq({ authorization: 'Bearer ' + stamped.token }),
          { parseAuth: async function () { return false; } }
        );
        assert.strictEqual(auth.userId, null);
      });
    });
  });
}
