


import { get, set, unset, has, pick, cloneDeep } from 'lodash';
import { Random } from 'meteor/random';
import { Meteor } from 'meteor/meteor';
import { fetch } from 'meteor/fetch';

Meteor.methods({
    proxyRelayPut: async function(sendToServerUrl, sendToServerHeaders, sendToServerPayload) {

        console.log('proxyRelayPut', sendToServerUrl, sendToServerHeaders, sendToServerPayload);

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