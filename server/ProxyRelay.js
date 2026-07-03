


import { get, set, unset, has, pick, cloneDeep } from 'lodash';
import { Random } from 'meteor/random';
import { Meteor } from 'meteor/meteor';
import { fetch } from 'meteor/fetch';
import { validateOutbound } from '/server/lib/OutboundValidation';

Meteor.methods({
    proxyRelayPut: async function(sendToServerUrl, sendToServerHeaders, sendToServerPayload) {

        console.log('proxyRelayPut', sendToServerUrl, sendToServerHeaders, sendToServerPayload);

        // Outbound schema validation (strict-out). Guard only object payloads
        // with a resourceType - relays can carry non-FHIR bodies.
        if (sendToServerPayload && typeof sendToServerPayload === 'object' && sendToServerPayload.resourceType) {
          const outboundCheck = validateOutbound(sendToServerPayload, 'relay');
          if (outboundCheck.action === 'block') {
            console.error('[ProxyRelay] refusing to relay non-conformant ' + sendToServerPayload.resourceType + ' per egress.relay=block');
            return outboundCheck.operationOutcome;
          }
        }

        if(process.env.PROXY_RELAY_ENABLED){
            return await fetch(sendToServerUrl, {
                method: 'PUT',
                headers: sendToServerHeaders,
                body: JSON.stringify(sendToServerPayload)
            }).then(response => response.json())
            .then(result => {
                console.log('Success:', result);
                return result;
            }).catch((error) => {
                console.warn('Error:', error);
                return error;                
            })
        } else {
            console.log("PROXY_RELAY_ENABLED is not set to true.")
            return "PROXY_RELAY_ENABLED is not set to true."
        }

    },
    proxyRelayPost: async function(sendToServerUrl, sendToServerHeaders, sendToServerPayload) {

        console.log('proxyRelayPost', sendToServerUrl, sendToServerHeaders, sendToServerPayload);

        // Outbound schema validation (strict-out). Guard only object payloads
        // with a resourceType - relays can carry non-FHIR bodies.
        if (sendToServerPayload && typeof sendToServerPayload === 'object' && sendToServerPayload.resourceType) {
          const outboundCheck = validateOutbound(sendToServerPayload, 'relay');
          if (outboundCheck.action === 'block') {
            console.error('[ProxyRelay] refusing to relay non-conformant ' + sendToServerPayload.resourceType + ' per egress.relay=block');
            return outboundCheck.operationOutcome;
          }
        }

        if(process.env.PROXY_RELAY_ENABLED){
            return await fetch(sendToServerUrl, {
                method: 'POST',
                headers: sendToServerHeaders,
                body: JSON.stringify(sendToServerPayload)
            }).then(response => response.json())
            .then(result => {
                console.log('Success:', result);
                return result;
            }).catch((error) => {
                console.warn('Error:', error);
                return error;                
            })
            // return await fetch(sendToServerUrl, {
            //         method: 'POST',
            //         headers: sendToServerHeaders,
            //         body: JSON.stringify(sendToServerPayload)
            //     }).then(response => response.json())
            //     .then(result => {
            //         console.log('Success:', result);
            //         return result;
            //     }).catch((error) => {
            //         console.warn('Error:', error);
                    
            //     })
        } else {
            console.log("PROXY_RELAY_ENABLED is not set to true.")
            return "PROXY_RELAY_ENABLED is not set to true."
        }

    }
})