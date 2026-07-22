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
import ServerMethods from '/imports/lib/ServerMethods.js';
import FhirValidator from '/imports/lib/FhirValidator.js';

if (Meteor.isDevelopment || process.env.TEST_RUN) {

  // Open echo — pipeline pass-through, context surface
  ServerMethods.define('rpcTest.echo', {
    description: 'Echo params and context surface back (dev/test fixture)',
    requireAuth: false
  }, async function(params, context) {
    return { echoed: params, transport: context.transport, userId: context.userId };
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

  const log = (Meteor.Logger ? Meteor.Logger.for('rpcTestFixtures') : console);
  log.info('rpcTest.* fixtures registered (non-production only)');
}
