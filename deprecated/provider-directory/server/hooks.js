import { HTTP } from 'meteor/http';
import { Meteor } from 'meteor/meteor';

import { get } from 'lodash';

import { 
    CarePlans,
    CareTeams,
    Organizations,
    Patients,
    Subscriptions
} from 'meteor/clinical:hl7-fhir-data-infrastructure';

import base64url from 'base64-url';


// // turn on/off the relay service and ADT feeds
// if(get(Meteor, 'settings.public.interfaces.fhirRelay.status') === "active"){
    // RedHat HIMSS Demo
    Organizations.after.insert(function (userId, doc) {
        //   // HIPAA Audit Log
        //   // Sending to 3rd party event
        //   HipaaLogger.logEvent({eventType: "create", userId: userId, userName: '', collectionName: "CarePlans"});

        console.log('--------------------------------------------------')
        console.log('Organizations.after.insert')
        console.log('')
        console.log('Subscriptions.find().count(): ' + Subscriptions.find({
            'channel.endpoint': {$regex: 'Organization'},
            'channel.type': 'rest-hook'
        }).count())


        let subscriptionUrls = Subscriptions.find({
            'channel.endpoint': {$regex: 'Organization'},
            'channel.type': 'rest-hook'
        }).map(function(record){
            return get(record, 'channel.endpoint')
        })

        console.log('subscriptionUrls', subscriptionUrls)
        console.log('')


        let httpHeaders = { "headers": {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        }};

        if(get(Meteor, 'settings.private.fhir.backendServices.basicAuthToken')){
            httpHeaders["Authorization"] = "Basic " + base64url.encode(get(Meteor, 'settings.private.fhir.backendServices.basicAuthToken')) + "==";
        } else {

            // TODO:  add OAuthClients SMART on FHIR connectivity

            // TODO:  add JWT access

            // TODO:  add UDAP connection
        }

        if(get(doc, 'id')){
            let observationURL = get(Meteor, 'settings.public.interfaces.fhirRelay.channel.endpoint', Meteor.absoluteUrl()) + '/Observation/' + get(doc, 'id');
            process.env.DEBUG && console.log('Hooks.Organizations.after.observationURL', 'PUT ' + observationURL);
            process.env.DEBUG && console.log('Hooks.Organizations.after.subscriptionUrls', subscriptionUrls);
            process.env.DEBUG && console.log('httpHeaders', httpHeaders);

            if(Array.isArray(subscriptionUrls)){
                subscriptionUrls.forEach(function(url){
                    HTTP.put(url, {
                        npmRequestOptions: {
                            rejectUnauthorized: false
                        },
                        headers: httpHeaders,
                        data: doc
                    }, function(error, result){
                        if(error){console.log('Organizations.after.insert.error', error)}
                        if(result){console.log('Organizations.after.insert.result', result)}
                    })
        
                })
            }
    
        }

        return doc;
    });
//}