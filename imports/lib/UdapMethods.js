

import { Meteor } from 'meteor/meteor';
import ServerMethods from '/imports/lib/ServerMethods.js';
import { Random } from 'meteor/random';
import { fetch } from 'meteor/fetch';
import { get, has, set } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('UdapMethods') : console);

import forge from 'node-forge';
import base64url from 'base64-url';

let pki = forge.pki;

import jwt from 'jsonwebtoken';

import ndjsonParser from 'ndjson-parse';

// Lazy accessor for Endpoints collection
// Collections are populated in server/FhirEndpoints.js
function getEndpoints() {
    if (!global.Collections || !global.Collections.Endpoints) {
        console.warn('Endpoints collection not yet initialized');
        return null;
    }
    return global.Collections.Endpoints;
}

// import {
//     FhirUtilities,
//     AllergyIntolerances,
//     Bundles,
//     CarePlans,
//     CodeSystems,
//     Conditions,
//     Communications,
//     CommunicationRequests,
//     CommunicationResponses,
//     Devices,
//     Encounters,
//     Endpoints,
//     Immunizations,
//     Lists,
//     Locations,
//     Medications,
//     MedicationOrders,
//     MedicationStatements,
//     MessageHeaders,
//     Measures,
//     MeasureReports,
//     Organizations,
//     Observations,
//     Patients,
//     Practitioners,
//     Procedures,
//     Questionnaires,
//     QuestionnaireResponses,
//     SearchParameters,
//     StructureDefinitions,
//     ValueSets,
//     Tasks





// //---------------------------------------------------------------------------
// // Collections

// // this is a little hacky, but it works to access our collections.
// // we use to use Mongo.Collection.get(collectionName), but in Meteor 1.3, it was deprecated
// // we then started using window[collectionName], but that only works on the client
// // so we now take the window and

// let Collections = {};

// if(Meteor.isClient){
//   Collections = window;
// }
// if(Meteor.isServer){
//   Collections.AllergyIntolerances = AllergyIntolerances;
//   Collections.Bundles = Bundles;
//   Collections.CarePlans = CarePlans;
//   Collections.Conditions = Conditions;
//   Collections.Communications = Communications;
//   Collections.CommunicationRequests = CommunicationRequests;
//   Collections.CommunicationResponses = CommunicationResponses;
//   Collections.Devices = Devices;
//   Collections.Encounters = Encounters;
//   Collections.Immunizations = Immunizations;
//   Collections.Lists = Lists;
//   Collections.Locations = Locations;
//   Collections.Medications = Medications;
//   Collections.MedicationOrders = MedicationOrders;
//   Collections.MedicationStatements = MedicationStatements;
//   Collections.MessageHeaders = MessageHeaders;
//   Collections.Measures = Measures;
//   Collections.MeasureReports = MeasureReports;
//   Collections.Organizations = Organizations;
//   Collections.Observations = Observations;
//   Collections.Patients = Patients;
//   Collections.Practitioners = Practitioners;
//   Collections.Procedures = Procedures;
//   Collections.Questionnaires = Questionnaires;
//   Collections.QuestionnaireResponses = QuestionnaireResponses;
//   Collections.Tasks = Tasks;
// }

let UdapUtilities = {
    parseCertAttributes: function(certActor){
        let result = "";
        if(has(certActor, 'attributes')){
          if(Array.isArray(certActor.attributes)){
            certActor.attributes.forEach(function(attribute){
              result = result + "  " + attribute["shortName"] + "=" + attribute["value"]
            })
          }
        }
        return result;
    }
}


// rpc migration (large-file adapter template, cf.
// npmPackages/provider-directory/server/methods.js): bodies stay in the
// legacy map below, each method gets a declarative
// ServerMethods.define() at the bottom of the file.
//
// AUTH POSTURE PRESERVED EXACTLY: pre-migration none of these methods had an
// auth guard. Several are invoked from pre-login / server-side contexts
// (SmartAuthManager calls generateClientAssertionJwt during SMART token
// exchange; UDAP registration flows run without a signed-in user), so every
// method keeps requireAuth: false. Flagged for a dedicated security review
// rather than silently changing behavior.
if(Meteor.isServer){

    const __udapMethods = {
        getJwkFromCertificate: function(){
            // This method converts the server's X.509 certificate to JWK format
            // Used by the ServerConfigurationPage to display the JWK
            
            let x509publicCert = get(Meteor, 'settings.private.x509.publicCertPem');
            
            if (!x509publicCert) {
                return null;
            }
            
            try {
                // Parse the certificate
                let certDer = forge.util.decode64(
                    x509publicCert
                        .replace(/-----BEGIN CERTIFICATE-----/, '')
                        .replace(/-----END CERTIFICATE-----/, '')
                        .replace(/\s/g, '')
                );
                let cert = pki.certificateFromAsn1(forge.asn1.fromDer(certDer));
                let publicKey = cert.publicKey;
                
                // Convert to JWK format
                let jwk = {
                    kty: "RSA",
                    use: "sig",
                    kid: get(Meteor, 'settings.private.jwk.keyId', Random.id()),
                    alg: "RS256",
                    n: forge.util.encode64(publicKey.n.toByteArray(), true),
                    e: forge.util.encode64(publicKey.e.toByteArray(), true)
                };
                
                return jwk;
            } catch (error) {
                console.error('Error converting certificate to JWK:', error);
                return null;
            }
        },
        syncTefcaEndpoints: function(){

            console.log('Synchronizing TEFCA endpoints...')

            // CERNER ENDPOINTS - PATIENT LAUNCH
            // https://github.com/oracle-samples/ignite-endpoints/blob/main/millennium_patient_r4_endpoints.json

            // CERNER ENDPOINTS - PROVIDER LAUNCH
            // https://github.com/oracle-samples/ignite-endpoints/blob/main/millennium_provider_r4_endpoints.json

            // EPIC ENDPOINTS
            // https://open.epic.com/Endpoints/R4

            let tefcaEndpointUrls = [
                "https://open.epic.com/Endpoints/R4",
                "https://raw.githubusercontent.com/oracle-samples/ignite-endpoints/main/millennium_patient_r4_endpoints.json",
                "https://raw.githubusercontent.com/oracle-samples/ignite-endpoints/main/millennium_provider_r4_endpoints.json"
            ]

            tefcaEndpointUrls.forEach(async function(url){

                return await fetch(url, {
                    method: 'GET',
                }).then(response => response.json())
                .then(result => {
                    console.log('Success:', result);

                    // received endpoints; parse them and put them in the Endpoints collection


                    if(Array.isArray(result.entry)){
                        result.entry.forEach(async function(entry){
                            console.log('entry', entry);
                            if(has(entry, 'resource')){
                                log.phi('entry.resource', entry.resource, { action: 'read' });
                                if(get(entry, 'resource.resourceType') === "Endpoint"){

                                    let endpoint = get(entry, 'resource');
                                    if(!get(endpoint, 'managingOrganization.display')){
                                        set(endpoint, 'managingOrganization.reference', "Organization/" + get(endpoint, 'contained[0].id'));
                                        set(endpoint, 'managingOrganization.display', get(endpoint, 'contained[0].name'));

                                        // set(endpoint, 'managingOrganization', {
                                        //     display: get(endpoint, 'contained[0].name'),
                                        //     reference: "Organization/" + get(endpoint, 'contained[0].id')
                                        // })
                                        // set(endpoint, 'address', get(endpoint, 'contained[0].address'))
                                    }

                                    endpoint.environmentType = [{
                                        text: "Production",
                                        coding: [{
                                            system: "http://hl7.org/fhir/endpoint-environment",
                                            code: "prod",
                                            display: "Production"
                                        }]
                                    }]

                                    endpoint.connectionType = [{
                                        text: "HL7 FHIR - R4",
                                        coding: [{
                                            system: "http://terminology.hl7.org/CodeSystem/endpoint-connection-type",
                                            code: "hl7-fhir-rest",
                                            display: "HL7 FHIR"
                                        }, {
                                            system: "http://hl7.org/fhir/FHIR-version",
                                            code: "4.0.1",
                                            display: "R4"
                                        }]
                                    }]

                                    set(endpoint, 'status', 'off');
                                    set(endpoint, 'name', get(endpoint, 'connectionType[0].text'));

                                    console.log('endpoint', endpoint);
                                    const Endpoints = getEndpoints();
                                    if (Endpoints) {
                                        await Endpoints._collection.upsertAsync({id: get(endpoint, 'id')}, {$set: endpoint});
                                    } else {
                                        console.error('Cannot upsert endpoint: Endpoints collection not initialized');
                                    }
                                }
                            }
                        })
                    }

                    return result;
                }).catch((error) => {
                    console.warn('Error:', error);
                    // error checking if we have a corporate firewall
                    if(get(error, 'code') === "UNABLE_TO_GET_ISSUER_CERT_LOCALLY"){
                        console.error('You are likely running from behind a corporate firewall.  Try running with the NODE_CA_EXTRA_CERTS environment variable.  Or in a worst case scenario, try NODE_TLS_REJECT_UNAUTHORIZED=0')
                    }
                    return error;
                })

            });
        },
        sendSoftwareStatement: async function(options){
            console.log('sendSoftwareStatement', options);

            let response;
            try {
                response = await fetch(options.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(options.data),
                });
            } catch (error) {
                // node-fetch throws TypeError on malformed/unreachable URLs
                throw new Meteor.Error('fetch-failed', 'Unable to POST software statement to ' + get(options, 'url') + ': ' + error.message);
            }
            const body = await response.text();

            console.log(body);

            return body;

        },
        fetchPublicX509Key: async function(){
            console.log('fetchPublicX509Key');

            return get(Meteor, 'settings.private.x509.publicKey')
        },
        async fetchWellKnownUdap(wellKnownUdapUrl){
            console.log('fetchWellKnownUdap', wellKnownUdapUrl);


            // await HTTP.get(wellKnownUdapUrl, function(error, result){
            //     if(error){
            //         console.error('error', error)
            //     }
            //     if(result){
            //         console.log('result.data', result.data)
            //         return result.data;
            //     }
            // })

            let response;
            try {
                response = await fetch(wellKnownUdapUrl);
            } catch (error) {
                throw new Meteor.Error('fetch-failed', 'Unable to fetch .well-known/udap from ' + wellKnownUdapUrl + ': ' + error.message);
            }
            const body = await response.text();

            console.log(body);

            return body;
        },
        async generateAndSignJwt(jwtObject){
            console.log("--------------------------------------------------------------")
            console.log("Signing JWT...")
            console.log("")
            console.log('jwtHeader', get(jwtObject, 'jwtHeader'));
            console.log('jwtPayload', get(jwtObject, 'jwtPayload'));
            console.log("")

            let result = {};

            let privateKeyPem = get(Meteor, 'settings.private.x509.privateKey');
            if (!privateKeyPem) {
                throw new Meteor.Error('feature-disabled', 'JWT signing is not configured: set Meteor.settings.private.x509.privateKey');
            }

            await jwt.sign(get(jwtObject, 'jwtPayload'), privateKeyPem.trim(), {
                algorithm: 'RS256',
                header: get(jwtObject, 'jwtHeader')
            }, function(error, token){
                if(error){
                    console.error('error', error)
                }
                if(token){
                    console.log('token', token)
                    result.token = token;
                }
            });
            console.log("--------------------------------------------------------------")
            return result;
        },
        decodeJwt: function(encodedJwt){
            console.log("--------------------------------------------------------------")
            console.log("Decoding JWT...")
            console.log("")
            console.log('encodedJwt', encodedJwt);
            console.log("")

            let decoded = jwt.decode(encodedJwt, {complete: true});
            console.log("decoded", decoded)
            console.log("--------------------------------------------------------------")
            return decoded;
        },
        generateClientAssertionJwt: function(clientId, audience, privateKeyPem, expiresIn = 300){
            // Generates a JWT assertion for OAuth2 client_credentials flow
            // Used when Node On FHIR acts as a client connecting to external FHIR servers (Epic, Cerner, etc.)
            // This is for backend service-to-service authentication without user interaction
            
            console.log("--------------------------------------------------------------")
            console.log("Generating Client Assertion JWT...")
            console.log("Client ID:", clientId);
            console.log("Audience:", audience);
            console.log("Expires In:", expiresIn, "seconds");
            
            const jwtPayload = {
                iss: clientId,        // Issuer is our client ID
                sub: clientId,        // Subject must equal issuer for client_credentials
                aud: audience,        // The token endpoint URL we're authenticating to
                exp: Math.floor(Date.now() / 1000) + expiresIn,  // Expiration (default 5 minutes)
                iat: Math.floor(Date.now() / 1000),              // Issued at
                jti: Random.id()      // JWT ID - unique identifier for this JWT
            };
            
            const jwtOptions = {
                algorithm: 'RS256',
                header: {
                    typ: 'JWT',
                    alg: 'RS256',
                    kid: get(Meteor, 'settings.private.jwk.keyId', Random.id())  // Key ID from our JWK
                }
            };
            
            try {
                // Use the provided private key or fallback to settings
                let privateKey = privateKeyPem || get(Meteor, 'settings.private.x509.privateKey');
                
                if (!privateKey) {
                    throw new Meteor.Error('no-private-key', 'No private key available for JWT signing');
                }
                
                const signedJwt = jwt.sign(jwtPayload, privateKey.trim(), jwtOptions);
                console.log("Generated JWT:", signedJwt);
                console.log("--------------------------------------------------------------")
                
                return {
                    jwt: signedJwt,
                    payload: jwtPayload,
                    header: jwtOptions.header
                };
            } catch (error) {
                console.error('Error generating client assertion JWT:', error);
                throw new Meteor.Error('jwt-generation-failed', 'Failed to generate client assertion JWT: ' + error.message);
            }
        },
        decodeCertificate: function(encodedCertificate){
            console.log("--------------------------------------------------------------")
            console.log("Decoding certificate...")
            console.log("")
            process.env.DEBUG && console.log('encodedCertificate', encodedCertificate);
            process.env.DEBUG && console.log("")


            var cert;
            try {
                cert = pki.certificateFromPem(encodedCertificate);
            } catch (error) {
                // forge throws a raw Error on malformed PEM input
                throw new Meteor.Error('validation-failed', 'Not a valid PEM-encoded x509 certificate: ' + error.message);
            }
            console.log('cert', cert);

            console.log('cert.serialNumber:  ', cert.serialNumber)
            console.log('cert.subject:       ', UdapUtilities.parseCertAttributes(cert.subject))
            console.log('cert.issuer:        ', UdapUtilities.parseCertAttributes(cert.issuer))


            // let caStore = pki.createCaStore([]);
            // console.log('caStore', caStore);

            // caStore.addCertificate(encodedCertificate);
            // console.log('caStore', caStore);


            // // let issuerCert = caStore.getIssuer(encodedCertificate);
            // let issuerCert = caStore.getIssuer(encodedCertificate);
            // console.log('issuerCert', issuerCert);

            // let publicKey = pki.publicKeyFromPem(encodedCertificate);
            // console.log('publicKey', publicKey);

            // let decoded = jwt.decode(encodedJwt, {complete: true});
            // console.log("decoded", decoded)
            console.log("--------------------------------------------------------------")
            // return decoded;
            return cert;
        },
        getCertificateIssuer: function(decodedCertificate){
            console.log("--------------------------------------------------------------")
            console.log("Getting certificate issuer...")
            console.log("")
            console.log('decodedCertificate', decodedCertificate);
            console.log("")

            if (!decodedCertificate) {
                throw new Meteor.Error('validation-failed', 'decodedCertificate is required');
            }



            // let caStore = pki.createCaStore([]);
            // console.log('caStore', caStore);

            // caStore.addCertificate(encodedCertificate);
            // console.log('caStore', caStore);


            // // let issuerCert = caStore.getIssuer(encodedCertificate);
            // let issuerCert = caStore.getIssuer(encodedCertificate);
            // console.log('issuerCert', issuerCert);

            // let publicKey = pki.publicKeyFromPem(encodedCertificate);
            // console.log('publicKey', publicKey);

            // let decoded = jwt.decode(encodedJwt, {complete: true});
            // console.log("decoded", decoded)
            console.log("--------------------------------------------------------------")
            return get(decodedCertificate, 'issuer', null);
        },
        generateCertificate: function(){
            console.log("Generate certificate...")

            let privateKeyPem = get(Meteor, 'settings.private.x509.privateKey');
            let publicKeyPem = get(Meteor, 'settings.private.x509.publicKey');

            if(privateKeyPem){

                let privateKey = pki.privateKeyFromPem(privateKeyPem)
                let publicKey = pki.publicKeyFromPem(publicKeyPem)

                var certificatePem = "";

                console.log('privateKey', privateKey)
                console.log('publicKey', publicKey)

                let cert = pki.createCertificate();

                cert.publicKey = publicKey;
                cert.serialNumber = '01';
                cert.validity.notBefore = new Date();
                cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

                var attrs = [{
                    name: 'commonName',
                    value: 'example.org' // QWERTY - removed domain
                    }, {
                    name: 'countryName',
                    value: 'US'
                    }, {
                    shortName: 'ST',
                    value: 'Illinois'
                    }, {
                    name: 'localityName',
                    value: 'Chicago'
                    }, {
                    name: 'organizationName',
                    value: 'Example Organization' // QWERTY - removed organizationName
                    }, {
                    shortName: 'OU',
                    value: 'EXAMPLE' // QWERTY - removed OU
                }];
                // cert.setSubject(attrs);
                cert.setIssuer(attrs);
                cert.sign(privateKey);

                console.log('cert', cert);

                certificatePem = pki.certificateToPem(cert);
                console.log('certificatePem', certificatePem)
            } else {
                console.error('No private key found in settings.private.x509.privateKey')
            }

            return certificatePem;
        },
    };

    //------------------------------------------------------------------------
    // ServerMethods registry.
    //
    // Canonical names are namespaced udapCore.* because the provider-directory
    // workflow package already owns the udap.* / certificates.* canonical
    // names (udap.signJwt, udap.fetchWellKnown, udap.sendSoftwareStatement,
    // certificates.generate) with DIFFERENT implementations.
    //
    // Legacy-name aliases: this file is imported from server/main.js BEFORE
    // the workflow server-loader, so these defines run first and claim the
    // shared legacy DDP names (generateCertificate, generateAndSignJwt,
    // fetchWellKnownUdap, sendSoftwareStatement); provider-directory's own
    // aliasIfFree() then skips them — exactly the pre-migration "core wins at
    // the DDP level" behavior. aliasIfFree here is a defensive guard against
    // future load-order changes (a claimed name is dropped instead of
    // throwing at boot).
    function aliasIfFree(legacyName){
        const handlers = (Meteor.server && Meteor.server.method_handlers) || {};
        if (handlers[legacyName]) {
            log.warn('legacy method name already defined elsewhere, no alias registered', { legacyName: legacyName });
            return [];
        }
        return [legacyName];
    }

    ServerMethods.define('udapCore.getJwkFromCertificate', {
        description: 'Convert the server x509 certificate to JWK format for display and discovery',
        aliases: aliasIfFree('getJwkFromCertificate'),
        // Public by pre-migration design: read by ServerConfigurationPage; only public key material is returned.
        requireAuth: false
    }, async function(params, context){
        return __udapMethods.getJwkFromCertificate();
    });

    ServerMethods.define('udapCore.syncTefcaEndpoints', {
        description: 'Fetch and upsert TEFCA FHIR endpoint directories (Epic, Cerner) into the Endpoints collection',
        aliases: aliasIfFree('syncTefcaEndpoints'),
        // Public by pre-migration design (no auth guard historically); flagged for security review.
        requireAuth: false
    }, async function(params, context){
        return __udapMethods.syncTefcaEndpoints();
    });

    ServerMethods.define('udapCore.sendSoftwareStatement', {
        description: 'POST a signed UDAP software statement to a remote registration endpoint',
        aliases: aliasIfFree('sendSoftwareStatement'),
        // Public by pre-migration design: part of the UDAP registration flow, which runs without a signed-in user.
        requireAuth: false,
        schemaObject: {
            type: 'object',
            properties: { url: { type: 'string' }, data: {} },
            required: ['url']
        }
    }, async function(params, context){
        return await __udapMethods.sendSoftwareStatement(params);
    });

    ServerMethods.define('udapCore.fetchPublicX509Key', {
        description: 'Return the server public x509 key PEM from settings',
        aliases: aliasIfFree('fetchPublicX509Key'),
        // Public by pre-migration design: returns public key material only.
        requireAuth: false
    }, async function(params, context){
        return await __udapMethods.fetchPublicX509Key();
    });

    ServerMethods.define('udapCore.fetchWellKnown', {
        description: 'Fetch a .well-known/udap document from a remote FHIR server',
        aliases: aliasIfFree('fetchWellKnownUdap'),
        // Public by pre-migration design: UDAP discovery runs pre-auth.
        requireAuth: false,
        positionalParams: ['wellKnownUdapUrl'],
        schemaObject: {
            type: 'object',
            properties: { wellKnownUdapUrl: { type: 'string' } },
            required: ['wellKnownUdapUrl']
        }
    }, async function(params, context){
        return await __udapMethods.fetchWellKnownUdap(get(params, 'wellKnownUdapUrl'));
    });

    ServerMethods.define('udapCore.signJwt', {
        description: 'Sign a JWT payload (with optional header) using the server x509 private key',
        aliases: aliasIfFree('generateAndSignJwt'),
        // Public by pre-migration design: invoked by UDAP flows without a user context; flagged for security review.
        requireAuth: false,
        schemaObject: {
            type: 'object',
            properties: { jwtHeader: { type: 'object' }, jwtPayload: { type: 'object' } }
        }
    }, async function(params, context){
        return await __udapMethods.generateAndSignJwt(params);
    });

    ServerMethods.define('udapCore.decodeJwt', {
        description: 'Decode a JWT (header and payload) without verifying the signature',
        aliases: aliasIfFree('decodeJwt'),
        // Public by pre-migration design: pure decode utility, no secrets involved.
        requireAuth: false,
        positionalParams: ['encodedJwt'],
        schemaObject: {
            type: 'object',
            properties: { encodedJwt: { type: 'string' } },
            required: ['encodedJwt']
        }
    }, async function(params, context){
        return __udapMethods.decodeJwt(get(params, 'encodedJwt'));
    });

    ServerMethods.define('udapCore.generateClientAssertionJwt', {
        description: 'Generate a signed JWT client assertion for OAuth2 client_credentials authentication to external FHIR servers',
        aliases: aliasIfFree('generateClientAssertionJwt'),
        // Public by pre-migration design: called by SmartAuthManager during SMART
        // token exchange, which can run before any user is signed in.
        requireAuth: false,
        positionalParams: ['clientId', 'audience', 'privateKeyPem', 'expiresIn'],
        schemaObject: {
            type: 'object',
            properties: {
                clientId: { type: 'string' },
                audience: { type: 'string' },
                privateKeyPem: { type: ['string', 'null'] },
                expiresIn: { type: 'number' }
            },
            required: ['clientId', 'audience']
        }
    }, async function(params, context){
        return __udapMethods.generateClientAssertionJwt(
            get(params, 'clientId'),
            get(params, 'audience'),
            get(params, 'privateKeyPem', null),
            get(params, 'expiresIn', 300)
        );
    });

    ServerMethods.define('udapCore.decodeCertificate', {
        description: 'Decode a PEM-encoded x509 certificate and log its subject and issuer attributes',
        aliases: aliasIfFree('decodeCertificate'),
        // Public by pre-migration design: pure decode utility.
        requireAuth: false,
        positionalParams: ['encodedCertificate'],
        schemaObject: {
            type: 'object',
            properties: { encodedCertificate: { type: 'string' } },
            required: ['encodedCertificate']
        }
    }, async function(params, context){
        return __udapMethods.decodeCertificate(get(params, 'encodedCertificate'));
    });

    ServerMethods.define('udapCore.getCertificateIssuer', {
        description: 'Inspect a decoded certificate and return its issuer (legacy stub)',
        aliases: aliasIfFree('getCertificateIssuer'),
        // Public by pre-migration design; body is a legacy stub preserved as-is.
        requireAuth: false,
        positionalParams: ['decodedCertificate']
    }, async function(params, context){
        return __udapMethods.getCertificateIssuer(get(params, 'decodedCertificate'));
    });

    ServerMethods.define('udapCore.generateCertificate', {
        description: 'Generate a self-signed x509 certificate from the configured server key pair',
        aliases: aliasIfFree('generateCertificate'),
        // Public by pre-migration design (no auth guard historically); flagged for security review.
        requireAuth: false
    }, async function(params, context){
        return __udapMethods.generateCertificate();
    });
}
