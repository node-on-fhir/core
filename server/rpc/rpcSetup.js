// server/rpc/rpcSetup.js
// Boot wiring for the ServerMethods registry (imported from server/main.js
// after loggingSetup): the Meteor.ServerMethods global, the default role
// authorizer, and the built-in rpc.discover introspection method.
// The HTTP endpoint (JsonRpcEndpoint.js) is imported here as well (Task 4).

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import ServerMethods from '/imports/lib/ServerMethods.js';
import './caslAuthorizer.js';
import '/imports/startup/both/rpcClientSetup.js';

Meteor.ServerMethods = ServerMethods;

// Built-in introspection: generated OpenRPC document from the registry.
// Public by design — method SCHEMAS are not secret, method DATA is.
ServerMethods.define('rpc.discover', {
  description: 'OpenRPC document describing every registered method',
  requireAuth: false
}, async function() {
  return ServerMethods.buildOpenRpcDocument({
    title: get(Meteor, 'settings.public.title', 'honeycomb'),
    version: String(get(Meteor, 'settings.public.version.major', 1)) + '.' + String(get(Meteor, 'settings.public.version.minor', 0)) + '.' + String(get(Meteor, 'settings.public.version.patch', 0))
  });
});

// HTTP transport (self-gated by settings.private.rpc.enabled)
import './JsonRpcEndpoint.js';

// Live-verification fixtures (self-gated to dev/TEST_RUN)
import './rpcTestFixtures.js';

const log = (Meteor.Logger ? Meteor.Logger.for('rpcSetup') : console);
log.info('ServerMethods registry initialized', { discover: 'rpc.discover' });
