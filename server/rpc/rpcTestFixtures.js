// server/rpc/rpcTestFixtures.js
// Live-verification fixture methods for the ServerMethods pipeline — the
// re-anchored integration checks for the JSON-RPC migration (issue #171:
// the meteortesting:mocha harness is broken under the rspack build, so
// pipeline verification runs against a booted app: DDP shim via the browser,
// HTTP via curl/fetch, SSE streaming via EventSource-style readers).
//
// Registered ONLY outside production (Meteor.isDevelopment or TEST_RUN),
// mirroring imports/accounts/server/test-methods.js. The rpcTest.* namespace
// is reserved for these.

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Random } from 'meteor/random';
import ServerMethods from '/imports/lib/ServerMethods.js';
import FhirValidator from '/imports/lib/FhirValidator.js';

if (Meteor.isDevelopment || process.env.TEST_RUN) {

  // Open echo — pipeline pass-through, context surface
  ServerMethods.define('rpcTest.echo', {
    description: 'Echo params and context surface back (dev/test fixture)',
    requireAuth: false
  }, async function(params, context) {
    return { echoed: params, transport: context.transport, userId: context.userId, role: context.role || null, scopes: context.scopes || [] };
  });

  // Auth-guarded
  ServerMethods.define('rpcTest.guarded', {
    description: 'Requires a signed-in user (dev/test fixture)'
  }, async function(params, context) {
    return { secret: true, userId: context.userId };
  });

  // Schema-validated (registered string schema)
  FhirValidator.registerSchema('RpcTestSumParams', {
    type: 'object',
    properties: { a: { type: 'number' }, b: { type: 'number' } },
    required: ['a', 'b'],
    additionalProperties: false
  });
  ServerMethods.define('rpcTest.sum', {
    description: 'Add two numbers with AJV param validation (dev/test fixture)',
    requireAuth: false,
    schema: 'RpcTestSumParams'
  }, async function(params) {
    return params.a + params.b;
  });

  // Role-gated (authorizer path)
  ServerMethods.define('rpcTest.practitionerOnly', {
    description: 'Role-gated via allow.roles (dev/test fixture)',
    allow: { roles: ['healthcare practitioner'] }
  }, async function() {
    return 'admitted';
  });

  // Alias + positional adapter
  ServerMethods.define('rpcTest.concat', {
    description: 'Concat two strings; legacy alias + positional adapter (dev/test fixture)',
    requireAuth: false,
    aliases: ['rpcTestLegacyConcat'],
    positionalParams: ['first', 'second']
  }, async function(params) {
    return String(params.first) + String(params.second);
  });

  // In-process invoke() path (server->server orchestration)
  ServerMethods.define('rpcTest.invokeProxy', {
    description: 'Calls rpcTest.sum via ServerMethods.invoke (dev/test fixture)',
    requireAuth: false
  }, async function(params, context) {
    const sum = await ServerMethods.invoke('rpcTest.sum', { a: 2, b: 40 }, { userId: context.userId });
    return { viaInvoke: sum };
  });

  // Streaming (SSE progress frames over HTTP; progress dropped on DDP)
  ServerMethods.define('rpcTest.countdown', {
    description: 'Emits N progress frames then resolves (dev/test fixture)',
    requireAuth: false,
    streaming: true
  }, async function(params, context) {
    const count = (params && params.count) || 3;
    for (let i = count; i > 0; i--) {
      context.emit({ remaining: i });
    }
    return { done: true, counted: count };
  });

  // Token mint for the CI endpoint smoke test (scripts/endpoint-smoke-test.sh):
  // returns a valid Meteor resume login token for a dedicated smoke user so the
  // positive-auth leg (Bearer <token> → rpcTest.guarded succeeds) can run from
  // curl. Non-production only, like everything in this block.
  ServerMethods.define('rpcTest.mintLoginToken', {
    description: 'Mint a resume login token for a smoke-test user (dev/test fixture). Optional username + roles PIN the user roles — settings.private.accounts.defaultRole varies per deployment profile, so role-gate tests must never rely on creation defaults.',
    requireAuth: false,
    schemaObject: {
      type: 'object',
      properties: {
        username: { type: 'string' },
        roles: { type: 'array', items: { type: 'string' } }
      }
    }
  }, async function(params) {
    const username = (params && params.username) || 'rpc-smoke-user';
    let user = await Meteor.users.findOneAsync({ username: username });
    if (!user) {
      const userId = await Accounts.createUserAsync({ username: username, password: Random.secret() });
      user = await Meteor.users.findOneAsync({ _id: userId });
    }
    const update = { $push: { 'services.resume.loginTokens': null } };
    const stamped = Accounts._generateStampedLoginToken();
    const hashed = Accounts._hashStampedToken(stamped);
    update.$push['services.resume.loginTokens'] = hashed;
    // Pin roles when requested — overrides whatever onCreateUser defaulted.
    if (params && Array.isArray(params.roles)) {
      update.$set = { roles: params.roles };
    }
    await Meteor.users.updateAsync({ _id: user._id }, update);
    return { token: stamped.token, userId: user._id, roles: (params && params.roles) || user.roles || [] };
  });

  const log = (Meteor.Logger ? Meteor.Logger.for('rpcTestFixtures') : console);
  log.info('rpcTest.* fixtures registered (non-production only)');
}
