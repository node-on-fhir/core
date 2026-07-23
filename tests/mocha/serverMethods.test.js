// tests/mocha/serverMethods.test.js
// Task 2 verification: ServerMethods pipeline, DDP shim, authorizer plumbing.
// Server-only (meteortesting:mocha via `npm test`). Fixtures use the
// `rpcTest.*` namespace to stay clear of real methods.

import assert from 'assert';
import { Meteor } from 'meteor/meteor';

if (Meteor.isServer) {
  const ServerMethods = require('/imports/lib/ServerMethods.js').default;
  const FhirValidator = require('/imports/lib/FhirValidator.js');

  describe('ServerMethods pipeline (Task 2)', function () {

    before(function () {
      // Fixture: open method (no auth) — also the DDP shim target
      ServerMethods.define('rpcTest.echo', {
        description: 'Echo params back (test fixture)',
        requireAuth: false
      }, async function (params, context) {
        return { echoed: params, transport: context.transport, userId: context.userId };
      });

      // Fixture: guarded method
      ServerMethods.define('rpcTest.guarded', {
        description: 'Requires a signed-in user (test fixture)'
      }, async function () {
        return 'secret';
      });

      // Fixture: schema-validated method (registered string schema)
      FhirValidator.registerSchema('RpcTestSumParams', {
        type: 'object',
        properties: { a: { type: 'number' }, b: { type: 'number' } },
        required: ['a', 'b'],
        additionalProperties: false
      });
      ServerMethods.define('rpcTest.sum', {
        description: 'Add two numbers (test fixture)',
        requireAuth: false,
        schema: 'RpcTestSumParams'
      }, async function (params) {
        return params.a + params.b;
      });

      // Fixture: role-gated method
      ServerMethods.define('rpcTest.adminOnly', {
        description: 'Role-gated (test fixture)',
        requireAuth: false,
        allow: { roles: ['healthcare practitioner'] }
      }, async function () {
        return 'admitted';
      });

      // Fixture: alias + positional adapter
      ServerMethods.define('rpcTest.concat', {
        description: 'Concat two strings (test fixture)',
        requireAuth: false,
        aliases: ['rpcTestLegacyConcat'],
        positionalParams: ['first', 'second']
      }, async function (params) {
        return String(params.first) + String(params.second);
      });
    });

    it('requireAuth denies a null userId with not-authorized', async function () {
      try {
        await ServerMethods.invoke('rpcTest.guarded', {});
        assert.fail('should have thrown');
      } catch (error) {
        assert.strictEqual(error.error, 'not-authorized');
      }
    });

    it('invoke returns the handler result and passes context through', async function () {
      const result = await ServerMethods.invoke('rpcTest.echo', { x: 1 }, { userId: 'user-1' });
      assert.deepStrictEqual(result.echoed, { x: 1 });
      assert.strictEqual(result.transport, 'server');
      assert.strictEqual(result.userId, 'user-1');
    });

    it('invoke on an undefined method throws not-found', async function () {
      try {
        await ServerMethods.invoke('rpcTest.doesNotExist', {});
        assert.fail('should have thrown');
      } catch (error) {
        assert.strictEqual(error.error, 'not-found');
      }
    });

    it('schema validation rejects bad params with validation-failed', async function () {
      try {
        await ServerMethods.invoke('rpcTest.sum', { a: 'nope', b: 2 });
        assert.fail('should have thrown');
      } catch (error) {
        assert.strictEqual(error.error, 'validation-failed');
        assert.ok(Array.isArray(error.details.errors));
      }
      const sum = await ServerMethods.invoke('rpcTest.sum', { a: 2, b: 3 });
      assert.strictEqual(sum, 5);
    });

    it('define-time failure for an unregistered string schema', function () {
      assert.throws(function () {
        ServerMethods.define('rpcTest.badSchema', { schema: 'NoSuchSchemaEver' }, async function () {});
      }, /not registered/);
    });

    it('allow with NO authorizer registered denies (fail-closed)', async function () {
      ServerMethods.setAuthorizer(null);
      try {
        await ServerMethods.invoke('rpcTest.adminOnly', {}, { userId: 'user-1' });
        assert.fail('should have thrown');
      } catch (error) {
        assert.strictEqual(error.error, 'not-authorized');
        assert.match(error.reason, /no authorizer/);
      }
    });

    it('after setAuthorizer, allow/deny follows the authorizer decision', async function () {
      ServerMethods.setAuthorizer(async function (context, allow) {
        return { allowed: context.role === 'healthcare practitioner', reason: 'role check' };
      });
      const admitted = await ServerMethods.invoke('rpcTest.adminOnly', {}, { userId: 'u', role: 'healthcare practitioner' });
      assert.strictEqual(admitted, 'admitted');
      try {
        await ServerMethods.invoke('rpcTest.adminOnly', {}, { userId: 'u', role: 'patient' });
        assert.fail('should have thrown');
      } catch (error) {
        assert.strictEqual(error.error, 'not-authorized');
      }
      ServerMethods.setAuthorizer(null);
    });

    it('DDP shim: Meteor.callAsync with a single params object works end-to-end', async function () {
      const result = await Meteor.callAsync('rpcTest.echo', { via: 'ddp-shim' });
      assert.deepStrictEqual(result.echoed, { via: 'ddp-shim' });
      assert.strictEqual(result.transport, 'ddp');
    });

    it('DDP shim: alias is callable', async function () {
      const result = await Meteor.callAsync('rpcTestLegacyConcat', { first: 'a', second: 'b' });
      assert.strictEqual(result, 'ab');
    });

    it('DDP shim: positional args map through positionalParams', async function () {
      const result = await Meteor.callAsync('rpcTest.concat', 'x', 'y');
      assert.strictEqual(result, 'xy');
    });

    it('emit() throws for non-streaming methods', async function () {
      ServerMethods.define('rpcTest.noStream', { description: 'x', requireAuth: false }, async function (params, context) {
        context.emit({ progress: 1 });
      });
      try {
        await ServerMethods.invoke('rpcTest.noStream', {});
        assert.fail('should have thrown');
      } catch (error) {
        assert.strictEqual(error.error, 'streaming-not-supported');
      }
    });

    it('registry list + get + OpenRPC document include fixtures', function () {
      assert.ok(ServerMethods.get('rpcTest.echo'));
      assert.strictEqual(ServerMethods.get('rpcTestLegacyConcat').viaAlias, true);
      const doc = ServerMethods.buildOpenRpcDocument({ title: 't', version: '0' });
      assert.ok(doc.methods.find(m => m.name === 'rpcTest.sum'));
    });
  });
}
