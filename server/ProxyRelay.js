

import { get, set, unset, has, pick, cloneDeep } from 'lodash';
import { Random } from 'meteor/random';
import { Meteor } from 'meteor/meteor';
import { fetch } from 'meteor/fetch';
import { validateOutbound } from '/server/lib/OutboundValidation';

// Imported directly (not via the Meteor.ServerMethods global) because this
// module is loaded from server/main.js BEFORE server/rpc/rpcSetup.js runs.
import ServerMethods from '/imports/lib/ServerMethods.js';

// Shared relay body — PUT and POST differ only in the HTTP verb.
async function relayRequest(method, params, context){
  const sendToServerUrl = params.sendToServerUrl;
  const sendToServerHeaders = params.sendToServerHeaders;
  const sendToServerPayload = params.sendToServerPayload;

  context.log.info('proxyRelay ' + method, { data: { url: sendToServerUrl } });

  // Outbound schema validation (strict-out). Guard only object payloads
  // with a resourceType - relays can carry non-FHIR bodies.
  if (sendToServerPayload && typeof sendToServerPayload === 'object' && sendToServerPayload.resourceType) {
    const outboundCheck = validateOutbound(sendToServerPayload, 'relay');
    if (outboundCheck.action === 'block') {
      context.log.error('[ProxyRelay] refusing to relay non-conformant ' + sendToServerPayload.resourceType + ' per egress.relay=block');
      return outboundCheck.operationOutcome;
    }
  }

  if(process.env.PROXY_RELAY_ENABLED){
      return await fetch(sendToServerUrl, {
          method: method,
          headers: sendToServerHeaders,
          body: JSON.stringify(sendToServerPayload)
      }).then(response => response.json())
      .then(result => {
          context.log.info('Success', { data: result });
          return result;
      }).catch((error) => {
          context.log.warn('Error relaying request', { message: error.message });
          return error;
      })
  } else {
      context.log.info("PROXY_RELAY_ENABLED is not set to true.")
      return "PROXY_RELAY_ENABLED is not set to true."
  }
}

// requireAuth note: both relay methods historically had NO auth guard (the
// operational gate was/is the PROXY_RELAY_ENABLED env var). They relay
// arbitrary payloads to arbitrary URLs, so requireAuth now applies (the
// default) — behavior change from the pre-migration guard-less state.

const relaySchema = {
  type: 'object',
  properties: {
    sendToServerUrl: { type: 'string' },
    sendToServerHeaders: { type: ['object', 'null'] },
    sendToServerPayload: {}
  },
  required: ['sendToServerUrl']
};

ServerMethods.define('proxyRelay.put', {
  description: 'Relay a PUT request with the supplied headers and payload to a remote server (gated by PROXY_RELAY_ENABLED)',
  aliases: ['proxyRelayPut'],
  phi: true,   // relayed payloads can be FHIR patient resources
  positionalParams: ['sendToServerUrl', 'sendToServerHeaders', 'sendToServerPayload'],
  schemaObject: relaySchema
}, async function(params, context) {
  return await relayRequest('PUT', params, context);
});

ServerMethods.define('proxyRelay.post', {
  description: 'Relay a POST request with the supplied headers and payload to a remote server (gated by PROXY_RELAY_ENABLED)',
  aliases: ['proxyRelayPost'],
  phi: true,   // relayed payloads can be FHIR patient resources
  positionalParams: ['sendToServerUrl', 'sendToServerHeaders', 'sendToServerPayload'],
  schemaObject: relaySchema
}, async function(params, context) {
  return await relayRequest('POST', params, context);
});
