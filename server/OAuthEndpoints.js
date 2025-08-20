import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { WebApp } from "meteor/webapp";
import { fetch, Headers } from 'meteor/fetch';

import { get, set, has, uniq, cloneDeep, toLower } from 'lodash';


import moment from 'moment';
import atob from 'atob';
import btoa from 'btoa';
import axios from 'axios';
import superagent from 'superagent';
import asn1js from 'asn1js';
import pkijs from 'pkijs';
import pvutils from 'pvutils';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import forge from 'node-forge';
import express from 'express';

import bodyParser from 'body-parser';
import { OAuthClients } from '/imports/collections/OAuthClients';
import OAuthServer from 'express-oauth-server';

import { refreshTokensCollection } from '/imports/collections/refreshTokensCollection';
import { authCodesCollection } from '/imports/collections/authCodesCollection';
import { clientsCollection } from '/imports/collections/clientsCollection';

export const OAuthServerConfig = {
  pubSubNames: {
    authCodes: 'oauth2/authCodes',
    refreshTokens: 'oauth2/refreshTokens',
    oauthClients: 'oauth2/oauthClients'
  },
  methodNames: {
    authCodeGrant: 'oauth2/authCodeGrant'
  },
  collections: {
    refreshToken: refreshTokensCollection,
    authCode: authCodesCollection,
    clientsCollection: clientsCollection
  }
};


// configure the server-side collections. The rest of the collections
// exist in common.js and are for both client and server.
export let accessTokenCollection = new Meteor.Collection('OAuth2AccessTokens');

// setup the exported object.
OAuthServerConfig.oauthserver = new OAuthServer({
  model: {},
  grants: ['authorization_code', 'user/*.read'],
  debug: true
});

OAuthServerConfig.collections.accessToken = accessTokenCollection;
OAuthServerConfig.collections.client = clientsCollection;

WebApp.handlers.use(bodyParser.json({
  limit: '1000mb',
  extended: false
}));
WebApp.handlers.use(bodyParser.urlencoded({
  limit: '1000mb',
  extended: false
}));


let fhirPath = get(Meteor, 'settings.private.fhir.fhirPath');

import { InboundRequests } from '/imports/lib/schemas/SimpleSchemas/InboundRequests';


export async function saveToInboundTrafficLog(request) {
  if (get(Meteor, 'settings.private.fhir.inboundQueue') === true) {
    process.env.EXHAUSTIVE && console.log('Inbound request', InboundRequests);
    if (InboundRequests) {
      let resultId = await InboundRequests.insertAsync({
        date: new Date(),
        method: get(request, 'method'),
        url: get(request, 'url'),
        body: get(request, 'body'),
        query: get(request, 'query'),
        headers: get(request, 'headers')
      });
      console.log('Inbound request saved to InboundRequests collection.  resultId: ' + resultId);
    }
  }
  return request;
}

// WebApp.handlers.use(
//   '/baseR4/*',
//   express.json()
// );

// WebApp.handlers.use(
//   '/oauth/getIdentity',
//   OAuthServerConfig.oauthserver.authorize()
// );

// WebApp.handlers.use(OAuthServerConfig.oauthserver.authorize());
// //app.use(bearerToken());

// WebApp.handlers.all('/oauth/token', function(data){
//   OAuthServerConfig.oauthserver.grant()
// });


let emrDirectPem = await Assets.getTextAsync('udap_testing_certs/EMRDirectTestCA.crt');
console.log('emrDirectPem', emrDirectPem);

let caStore = forge.pki.createCaStore([emrDirectPem]);



WebApp.handlers.get("/oauth/registration", async (req, res) => {

  console.log("GET /oauth/registration");

  saveToInboundTrafficLog(req);

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");

  let returnPayload = {
    "message": "This is not the /registration route you are looking for.  You have specified a GET operation.  To register a client, please send a POST operation to /oauth/registration.",
    "sample_payload": {
      "client_id": "12345",
      "client_name": "ACME App",
      "scope": "profile fhirUser */Patient",
      "redirect_uris": ["https://acme.org/redirect"]
    }
  }

  res.json(returnPayload);
});


WebApp.handlers.post("/oauth/registration", async (req, res) => {

  console.log('POST /oauth/registration');

  saveToInboundTrafficLog(req);

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");

  console.log("");
  console.log('req.body', req.body);
  console.log("");

  let responsePayload = { data: {} };

  const softwareStatement = get(req, 'body.software_statement');
  const certificate = get(req, 'body.certifications[0][0]');
  const decoded = jwt.decode(softwareStatement, { complete: true });


  console.log('');
  console.log('========================================================================');
  console.log('Recursive Function');

  async function fetchCertificate(certificateUrl, certificateArray = [], certificateSerialNumbers = []) {
    console.log('fetchCertificate.certificateUrl', certificateUrl);
    try {
      // Fetch the certificate from the URL using meteor/http

      await fetch(certificateUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/x-x509-ca-cert'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        return response.arrayBuffer(); // Fetch the response as an ArrayBuffer
      })
      .then(async function(buffer){
        console.log('buffer:', buffer);
        // console.log('buffer.data:', buffer.data);
        // console.log('buffer.content:', buffer.content);

        // console.log('buffer.data.typeof:', typeof buffer.data);
        // console.log('buffer.content.typeof:', typeof buffer.content);

        // Convert the buffer data into a buffer
        const bodyBuffer = Buffer.from(buffer);
        // console.log('bodyBuffer', bodyBuffer);

        let shortcutAsn1, intermediateCert;

        try {
          // Decode the ASN.1 structure from the DER binary data
          shortcutAsn1 = forge.asn1.fromDer(bodyBuffer.toString('binary'));
          // console.log('shortcutAsn1', shortcutAsn1);
        } catch (error) {
          console.log('shortcutCert.error', error);
        }

        try {
          // Parse the certificate from the ASN.1 structure
          intermediateCert = forge.pki.certificateFromAsn1(shortcutAsn1);
          console.log('---------------------------------------------------')
          console.log('Intermediate Cert')
          console.log(intermediateCert);

          certificateSerialNumbers.push(get(intermediateCert, 'serialNumber'));

          console.log('---------------------------------------------------')
          console.log('Intermediate Cert - Subject Attributes')
          try {
            intermediateCert.subject.attributes.forEach((attr) => {
              console.log(`${attr.name}: ${attr.value}`);

              if(attr.name === 'commonName'){
                if((attr.value === "") || (typeof attr.value === "undefined")){
                  if (!res.headersSent){
                    res.status(400).json({ "error": "invalid_software_statement", "description": "mismatched iss claim", "udap_testscript_step": "IIA4a1" }).end();
                  }
                }
              }
            });
          } catch (error) {
            console.log('error', error)
          }

          console.log('---------------------------------------------------')
          console.log('Intermediate Cert - Issuer Attributes')
          try {
            intermediateCert.issuer.attributes.forEach((attr) => {
              console.log(`${attr.name}: ${attr.value}`);
            });
          } catch (error) {
            console.log('error', error)
          }
          console.log('---------------------------------------------------')


          if (intermediateCert) {
            // Add the certificate to the array and CA store
            certificateArray.push(intermediateCert);
            caStore.addCertificate(intermediateCert);
          }
        } catch (error) {
          console.log('intermediateCert.error', error);
        }

        if (intermediateCert && Array.isArray(intermediateCert.extensions)) {
          for (const extension of intermediateCert.extensions) {
            let recursiveCerts = [];
            if (get(extension, 'name') === "authorityInfoAccess") {
              const httpIndex = extension.value.toString().indexOf('http');
              const recursiveLookupUrl = extension.value.toString().substring(httpIndex);

              // Recursively fetch additional certificates
              await fetchCertificate(recursiveLookupUrl, certificateArray, certificateSerialNumbers);
              if (Array.isArray(recursiveCerts)) {
                recursiveCerts.forEach(cert => certificateArray.push(cert));
              } else {
                certificateArray.push(recursiveCerts);
                caStore.addCertificate(recursiveCerts);
              }
            }

            let revokedSerialNumbers = [];
            if (get(extension, 'name') === "cRLDistributionPoints") {
              const httpRevocationIndex = extension.value.toString().indexOf('http');
              const intermediateCertRevokationUrl = extension.value.toString().substring(httpRevocationIndex);

              // Fetch the revocation list
              revokedSerialNumbers = await fetchRevokationList(intermediateCertRevokationUrl);
              checkRevokedSerialNumbersAgainstCerts(revokedSerialNumbers, certificateSerialNumbers, res);
            }
          }
        }

      }).catch((error) => {
        console.error('Error:', error);
      });

      // Return the unique list of certificates
      return uniq(certificateArray);
    } catch (error) {
      console.error('fetchCertificate.error', error);
      return certificateArray;  // Return the array even if there's an error
    }
  }


  console.log('');
  console.log('========================================================================');
  console.log('Decoding the payload and checking headers...');
  console.log('');
  console.log('decoded', decoded);
  console.log('');

  if (decoded) {
    set(decoded.payload, 'certificate', certificate);

    if (!get(decoded, 'header')) {
      if (!res.headersSent){
        res.status(400).json({ "error": "invalid_software_statement", "description": "", "udap_testscript_step": "IIA3a2" }).end();
      }
    } else if (!get(decoded, 'header.x5c')) {
      if (!res.headersSent){
        res.status(400).json({ "error": "invalid_software_statement", "description": "header.x5c not present...", "udap_testscript_step": "IIA3a2" }).end();
      }
    } else if (!Array.isArray(get(decoded, 'header.x5c'))) {
      if (!res.headersSent){
        res.status(400).json({ "error": "invalid_software_statement", "description": "header.x5c is not an array...", "udap_testscript_step": "IIA3a2" }).end();
      }
    } else if (Array.isArray(get(decoded, 'header.x5c')) && (decoded.header.x5c.length === 0)) {
      if (!res.headersSent){
        res.status(400).json({ "error": "invalid_software_statement", "description": "header.x5c is an empty array...", "udap_testscript_step": "IIA3a2" }).end();
      }

    } else {

      function formatPEM(pemString) {
        if (typeof pemString !== 'string') {
          pemString = String(pemString); // Convert to string if it's not already

          // Add line breaks every 64 characters to comply with PEM format
          return pemString.match(/.{1,64}/g).join('\r\n');
        } else {
          return "";
        }
      }


      let rawSoftwareStatementPem = get(decoded, 'header.x5c[0]', '');
      console.log('rawSoftwareStatementPem', rawSoftwareStatementPem)
      console.log('rawSoftwareStatementPem.typeof', typeof rawSoftwareStatementPem)
      console.log('rawSoftwareStatementPem.isArray ', Array.isArray(rawSoftwareStatementPem))
      console.log('rawSoftwareStatementPem.length', rawSoftwareStatementPem.length)
      console.log('')

      if(Array.isArray(rawSoftwareStatementPem)){
        rawSoftwareStatementPem = rawSoftwareStatementPem[0];
      }

      let softwareStatementPem = "";

      if(rawSoftwareStatementPem.includes("-----BEGIN CERTIFICATE-----")){
        softwareStatementPem = rawSoftwareStatementPem;
      } else {
        softwareStatementPem = "-----BEGIN CERTIFICATE-----\r\n";
        softwareStatementPem += formatPEM(rawSoftwareStatementPem);
        softwareStatementPem += "\r\n-----END CERTIFICATE-----\r\n";
      }

      if(softwareStatementPem){
        let combinedSoftwareStatementPem = softwareStatementPem;

        // if(Array.isArray(softwareStatementPem)){
        //   softwareStatementPem.join('+');
        // } else {
        //   combinedSoftwareStatementPem = softwareStatementPem;
        // }

        console.log('---------------------------------------------------')
        console.log('Payload')

        if(get(decoded, 'payload.iss') !== get(decoded, 'payload.sub')){
          if (!res.headersSent){
            res.status(400).json({ "error": "invalid_software_statement", "description": "mismatched iss and sub claims", "udap_testscript_step": "IIA4a2" }).end();
          }
        } else if((get(decoded, 'payload.aud') === "") || (typeof get(decoded, 'payload.aud') === "undefined")){
          if (!res.headersSent){
            res.status(400).json({ "error": "invalid_software_statement", "description": "missing aud claim", "udap_testscript_step": "IIA4a3" }).end();
          }
        } else if(!get(decoded, 'payload.aud').includes('oauth/registration')){
          if (!res.headersSent){
            res.status(400).json({ "error": "invalid_software_statement", "description": "mismatched aud claim", "udap_testscript_step": "IIA4a3" }).end();
          }
        } else if((get(decoded, 'payload.exp') === "") || (typeof get(decoded, 'payload.exp') === "undefined")){
          if (!res.headersSent){
            res.status(400).json({ "error": "invalid_software_statement", "description": "missing exp claim", "udap_testscript_step": "IIA4a4" }).end();
          }
        }


        console.log('moment() ', moment())

        const iatMoment = moment.unix(get(decoded, 'payload.iat'));
        console.log('iatMoment', iatMoment)

        const expMoment = moment.unix(get(decoded, 'payload.exp'));
        console.log('expMoment', expMoment)
        console.log('')
        console.log('expMoment.diff(iatMoment)', expMoment.diff(iatMoment))
        console.log('(expMoment.diff(iatMoment) > 300000)', (expMoment.diff(iatMoment) > 300000))
        console.log('expMoment.isBefore(moment())', expMoment.isBefore(moment()))
        console.log('((expMoment.diff(iatMoment) > 300000) || (expMoment.isBefore(moment())))', ((expMoment.diff(iatMoment) > 300000) || (expMoment.isBefore(moment()))))


        // 300000 = 5min * 60sec * 1000ms
        if ((expMoment.diff(iatMoment) > 300000) || (expMoment.isBefore(moment()))) {
          if (!res.headersSent) {
            res.status(400).json({
              "error": "invalid_software_statement",
              "description": "exp is more than 5 minutes after iat",
              "udap_testscript_step": "IIA4a4"
            }).end();
          }
        }
        if (!iatMoment.isBefore(moment())) {
          if (!res.headersSent) {
            res.status(400).json({
              "error": "invalid_software_statement",
              "description": "iat is not in the past",
              "udap_testscript_step": "IIA4a5"
            }).end();
          }
        }

        if(!get(decoded, 'payload.client_name')){
          if (!res.headersSent){
            res.status(400).json({ "error": "invalid_client_metadata", "description": "missing client_name", "udap_testscript_step": "IIA4b1" }).end();
          }
        }
        if(!get(decoded, 'payload.grant_types')){
          if (!res.headersSent){
            res.status(400).json({ "error": "invalid_client_metadata", "description": "missing grant_types", "udap_testscript_step": "IIA4b3" }).end();
          }
        }
        if(!get(decoded, 'payload.token_endpoint_auth_method')){
          if (!res.headersSent){
            res.status(400).json({ "error": "invalid_client_metadata", "description": "missing token_endpoint_auth_method", "udap_testscript_step": "IIA4b5" }).end();
          }
        }
        if(process.env.UDAP_TEST === "16"){
          if((!get(decoded, 'payload.redirect_uris') || (get(decoded, 'payload.redirect_uris[0]', []).length === 0))){
              if (!res.headersSent){
              res.status(400).json({ "error": "invalid_client_metadata", "description": "missing redirect_uris", "udap_testscript_step": "IIA4b2" }).end();
            }
          }
          if(!get(decoded, 'payload.response_types')){
            if (!res.headersSent){
              res.status(400).json({ "error": "invalid_client_metadata", "description": "missing response_types", "udap_testscript_step": "IIA4b4" }).end();
            }
          }
        }


        console.log('---------------------------------------------------')
        console.log('Combined Software Statement PEM')
        console.log('')
        console.log(combinedSoftwareStatementPem)
        console.log('')
        console.log('combinedSoftwareStatementPem.typeof', typeof combinedSoftwareStatementPem)
        console.log('combinedSoftwareStatementPem.isArray', Array.isArray(combinedSoftwareStatementPem))
        console.log('combinedSoftwareStatementPem.length', combinedSoftwareStatementPem.length)
        console.log('')

        if(typeof combinedSoftwareStatementPem === 'string'){
          const softwareStatementCert = forge.pki.certificateFromPem(combinedSoftwareStatementPem);
          console.log('---------------------------------------------------')
          console.log('Software Statement Cert', softwareStatementCert)

          let certificateSerialNumbers = [];

          if (softwareStatementCert) {
            caStore.addCertificate(softwareStatementCert);

            certificateSerialNumbers.push(get(softwareStatementCert, 'serialNumber'));

            console.log('---------------------------------------------------')
            console.log('Subject Attributes')
            try {
              softwareStatementCert.subject.attributes.forEach((attr) => {
                console.log(`${attr.name}: ${attr.value}`);

                if(attr.name === 'commonName'){
                  if((attr.value === "") || (typeof attr.value === "undefined") || (attr.value !== get(decoded, 'payload.iss'))){
                    if (!res.headersSent){
                      res.status(400).json({ "error": "invalid_software_statement", "description": "mismatched iss claim", "udap_testscript_step": "IIA4a1" }).end();
                    }
                  }
                }
              });
            } catch (error) {
              console.log('error', error)
            }

            console.log('---------------------------------------------------')
            console.log('Issuer Attributes')
            try {
              softwareStatementCert.issuer.attributes.forEach((attr) => {
                console.log(`${attr.name}: ${attr.value}`);
              });
            } catch (error) {
              console.log('error', error)
            }
            console.log('---------------------------------------------------')

            let revokedSerialNumbers = [];
            if (get(softwareStatementCert, 'extensions') && Array.isArray(softwareStatementCert.extensions)) {
              for (const extension of softwareStatementCert.extensions) {
                let certificateArray = [];
                if (get(extension, 'name') === "authorityInfoAccess") {
                  const httpIndex = extension.value.toString().indexOf('http');
                  const intermediateCertLookupUrl = extension.value.toString().substring(httpIndex);
                  await fetchCertificate(intermediateCertLookupUrl, certificateArray, certificateSerialNumbers);
                }

                if (get(extension, 'name') === "cRLDistributionPoints") {
                  const httpRevocationIndex = extension.value.toString().indexOf('http');
                  const intermediateCertRevokationUrl = extension.value.toString().substring(httpRevocationIndex);
                  revokedSerialNumbers = await fetchRevokationList(intermediateCertRevokationUrl);
                  checkRevokedSerialNumbersAgainstCerts(revokedSerialNumbers, certificateSerialNumbers, res);
                }
                if (get(extension, 'name') === "subjectAltName") {
                  console.log('found an subjectAltName extension')
                  if (extension && extension.altNames) {
                    extension.altNames.forEach((altName) => {
                      if (altName.type === 6) { // 6 is the type for URI
                        console.log('URI Name:', altName.value);
                      }
                    });
                  }
                }
              }
            }

            const isExpired = certificateIsExpired(get(softwareStatementCert, 'validity'));
            const isRevoked = certificateIsRevoked(get(softwareStatementCert, 'serialNumber'), revokedSerialNumbers);

            console.log('isExpired', isExpired)
            console.log('isRevoked', isRevoked)

            if (isExpired || isRevoked) {
              responsePayload.code = 400;
              responsePayload.data.error = "unapproved_software_statement";
              if (isExpired){
                if (!res.headersSent){
                  res.status(400).json({ "error": "unapproved_software_statement", "description": "expired client certificate", "udap_testscript_step": "IIA3b1a" }).end();
                }
              }
              if (isRevoked){
                if (!res.headersSent){
                  res.status(400).json({ "error": "unapproved_software_statement", "description": "revoked client certificate", "udap_testscript_step": "IIA3b1b" }).end();
                }
              }
            } else {
              jwt.verify(softwareStatement, combinedSoftwareStatementPem, { algorithms: ['RS256'] }, async function(error, verifiedJwt){
                if (error) {
                  console.error('error', error);
                  console.error('error.message', error.message);
                  if (!res.headersSent){
                    res.status(400).json({ "error": "invalid_software_statement", "description": error }).end();
                  }
                } else if (verifiedJwt) {
                  const oauthClientRecord = { ...verifiedJwt, verified: true, created_at: new Date() };
                  const clientId = await OAuthClients.insertAsync(oauthClientRecord);

                  verifiedJwt.client_id = clientId;
                  verifiedJwt.software_statement = get(req, 'body.software_statement');

                  console.log('201 Success.  Client registered.  clientId: ' + clientId);
                  if (!res.headersSent){
                    res.status(201).json({ verified: true, ...verifiedJwt }).end();
                  }
                }
              });
            }
          } else {
            if (!res.headersSent){
              res.status(204).json({ "error": "wasnt_able_to_decode_jwt" }).end();
            }
          }

        } else {
          console.log('Software statement X5C is not a string.  It is a ' + typeof softwareStatementPem);
          if (!res.headersSent){
            res.status(204).json({ "error": "wasnt_able_to_decode_jwt" }).end();
          }
        }
      } else {
        console.log('Software statement X5C is not a string.  Likely it was not found in the decoded JWT.');
        if (!res.headersSent){
          res.status(204).json({ "error": "wasnt_able_to_decode_jwt" }).end();
        }
      }

    }
  } else {
    if (req.body) {
      const oauthClientRecord = { ...req.body, verified: false, created_at: new Date() };
      const clientId = await OAuthClients.insertAsync(oauthClientRecord);

      console.log('clientId', clientId)
      if (!res.headersSent){
        res.status(201).json({ client_id: clientId, client_name: get(req.body, 'client_name'), scope: get(req.body, 'scope') }).end();
      }
    } else {
      if (!res.headersSent){
        res.status(204).json({ "error": "wasnt_able_to_decode_jwt" }).end();
      }
    }
  }
});


WebApp.handlers.get("/oauth/authorize", async (req, res) => {

  console.log("GET /oauth/authorize");

  if (process.env.DEBUG_OAUTH) {
    console.log("===================== OAUTH DEBUG START =====================");
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Query Params:", JSON.stringify(req.query, null, 2));
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log("State:", get(req.query, 'state'));
    console.log("Response Type:", get(req.query, 'response_type'));
    console.log("Code Challenge:", get(req.query, 'code_challenge'));
    console.log("Code Challenge Method:", get(req.query, 'code_challenge_method'));
    console.log("===================== OAUTH DEBUG END =====================");
  }

  saveToInboundTrafficLog(req);

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");

  let redirectUri = get(req, 'query.redirect_uri') || get(req, 'body.redirect_uri');
  let clientId = get(req, 'query.client_id') || get(req, 'body.client_id');
  let appState = get(req, 'query.state') || get(req, 'body.state');
  let responseType = get(req, 'query.response_type') || get(req, 'body.response_type');

  if (redirectUri && appState.length === 0) {
    res.setHeader("Location", `${redirectUri}?state=unspecified&error=invalid_request`);

    if (!res.headersSent){
      res.status(301).json(returnPayload).end();
    }
  } else {
    if (clientId) {
      const client = await OAuthClients.findOneAsync({ $or: [{ _id: clientId }, { client_id: clientId }] });
      if (client) {
        const newAuthorizationCode = Random.id();
        client.authorization_code = newAuthorizationCode;

        delete client._document;
        delete client._super_;
        await OAuthClients._collection.updateAsync({ _id: client._id }, { $set: client });

        if (redirectUri) {
          if (Array.isArray(client.redirect_uris) && client.redirect_uris.includes(redirectUri)) {
            setRedirectHeader(res, responseType, redirectUri, appState, newAuthorizationCode);
            if (!res.headersSent){
              res.status(302).json({ code: newAuthorizationCode, state: appState }).end();
            }

          } else {
            if (!res.headersSent){
              res.status(412).json({ "error_message": 'Provided redirect did not match registered redirects...' }).end();
            }
          }
        } else {
          setRedirectHeader(res, responseType, get(client, 'redirect_uris.0', ''), appState, newAuthorizationCode);
          if (!res.headersSent){
            res.status(301).json({ "code": newAuthorizationCode, "state": appState, "message": 'No redirect URI provided. Using what was provided during registration.' }).end();
          }
        }
      } else {
        if (!res.headersSent){
          res.status(401).json({ "error_message": 'No client record found matching that client_id' }).end();
        }
      }
    } else {
      if (!res.headersSent){
        res.status(400).json({ "error_message": 'No client_id in request.  Malformed request.' }).end();
      }
    }
  }
});








WebApp.handlers.post("/oauth/token", async (req, res) => {
  console.log("POST /oauth/token");
  
  if (process.env.DEBUG_OAUTH) {
    console.log("===================== OAUTH DEBUG START =====================");
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Query Params:", JSON.stringify(req.query, null, 2));
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log("Grant Type:", get(req.body, 'grant_type'));
    console.log("Client Assertion Type:", get(req.body, 'client_assertion_type'));
    console.log("Client Assertion present:", !!get(req.body, 'client_assertion'));
    console.log("Authorization Code:", get(req.query, 'code') || get(req.body, 'code'));
    console.log("===================== OAUTH DEBUG END =====================");
  }

  saveToInboundTrafficLog(req);

  // OAuthServerConfig.oauthserver.grant()

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");

  // Handle client_credentials grant type (Epic SMART v2 and other JWT-based OAuth2 flows)
  // 
  // This implementation supports bidirectional OAuth2 flows:
  // 1. When Honeycomb acts as an OAuth CLIENT connecting to Epic:
  //    - Epic requires JWT assertions signed with our private key
  //    - Epic validates the JWT against our public key hosted at /.well-known/jwks.json
  //    - We receive an access token from Epic to make FHIR requests
  //
  // 2. When Honeycomb acts as an OAuth SERVER for other applications:
  //    - External apps send JWT assertions signed with their private keys
  //    - We validate these JWTs against their registered public keys
  //    - We issue access tokens for them to access our FHIR resources
  //
  // The client_credentials flow is used for backend service authentication where
  // no user interaction is required. This is common for system-to-system integrations
  // like data synchronization, bulk data export, or automated workflows.
  //
  // Epic's implementation follows RFC 7523 (JWT Bearer Token Profile) which is
  // becoming the standard for secure OAuth2 backend authentication.
  
  if (get(req.body, 'grant_type') === 'client_credentials') {
    console.log('Processing client_credentials grant type');
    
    // Check for JWT Bearer assertion as specified in RFC 7523
    if (get(req.body, 'client_assertion_type') === 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer') {
      let client_assertion = get(req.body, 'client_assertion');
      
      if (!client_assertion) {
        res.status(400).json({
          "error": "invalid_request",
          "error_description": "client_assertion is required for client_credentials grant"
        });
        return;
      }
      
      try {
        // Decode the JWT to get the client_id and validate structure
        let decoded = jwt.decode(client_assertion, { complete: true });
        
        if (process.env.DEBUG_OAUTH) {
          console.log("Decoded JWT assertion:", JSON.stringify(decoded, null, 2));
        }
        
        let clientId = get(decoded, 'payload.iss');
        let audience = get(decoded, 'payload.aud');
        
        // Validate required JWT claims per RFC 7523
        if (!clientId || clientId !== get(decoded, 'payload.sub')) {
          res.status(400).json({
            "error": "invalid_client",
            "error_description": "iss and sub claims must be present and equal"
          });
          return;
        }
        
        // Check if client is registered in our system
        let registeredClient = await OAuthClients.findOneAsync({ client_id: clientId });
        
        if (!registeredClient) {
          res.status(400).json({
            "error": "invalid_client",
            "error_description": "Client not registered"
          });
          return;
        }
        
        // TODO: Verify JWT signature against client's public key
        // This would involve:
        // 1. Fetching the client's JWK from their jwks_uri (if external client)
        // 2. Or using the registered public key from our database
        // 3. Verifying the JWT signature matches
        // For now, we'll trust the assertion if the client is registered
        
        // Generate access token for the client
        let access_token = Random.id();
        let scopes = get(req.body, 'scope', registeredClient.scope || 'system/*.read');
        
        // Update client record with new access token
        await OAuthClients.updateAsync(
          { _id: registeredClient._id },
          { 
            $set: {
              access_token: access_token,
              access_token_created_at: new Date(),
              scope: scopes
            }
          }
        );
        
        // Return OAuth2 token response
        res.json({
          "access_token": access_token,
          "token_type": "Bearer",
          "expires_in": get(Meteor, 'settings.private.fhir.tokenTimeout', 86400),
          "scope": scopes
        });
        return;
        
      } catch (error) {
        console.error('Error processing JWT assertion:', error);
        res.status(400).json({
          "error": "invalid_client",
          "error_description": "Invalid client assertion"
        });
        return;
      }
    } else {
      res.status(400).json({
        "error": "invalid_request",
        "error_description": "client_assertion_type must be urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
      });
      return;
    }
  }

  // Handle standard authorization_code grant type (user-interactive flow)
  let authorizedClient = await OAuthClients.findOneAsync({ authorization_code: get(req.query, 'code') });
  console.log('authorizedClient', authorizedClient);

  if (authorizedClient) {
    let updatedAuthorizedClient = cloneDeep(authorizedClient);
    delete updatedAuthorizedClient._document;
    delete updatedAuthorizedClient._super_;
    updatedAuthorizedClient.access_token = Random.id();
    updatedAuthorizedClient.access_token_created_at = new Date();

    // todo: check scopes to set this
    let offlineOrOnlineScope = process.env.REFRESH_TOKEN || false;
    if(offlineOrOnlineScope){
      updatedAuthorizedClient.standalone_refresh_token = Random.id();
    }

    await OAuthClients.updateAsync({ _id: updatedAuthorizedClient._id }, { $set: updatedAuthorizedClient });

    let returnPayload = {
      code: 200,
      data: {
        "access_token": updatedAuthorizedClient.access_token,
        "token_type": "Bearer",
        "scope": authorizedClient.scope,
        "expires_in": get(Meteor, 'settings.private.fhir.tokenTimeout', 86400)
      }
    };
    if(offlineOrOnlineScope){
      returnPayload.data.standalone_refresh_token = updatedAuthorizedClient.standalone_refresh_token
    }


    // is this a UDAP server?
    if(get(Meteor, 'settings.private.x509')){

      let client_assertion = get(req.body, 'client_assertion');
      let decoded = jwt.decode(client_assertion, { complete: true });

      console.log('decoded', decoded);
      if(!decoded){
        if (!res.headersSent){
          res.setHeader('Content-Type', 'application/json');
          console.log('Response Headers:', res.getHeaders());
          res.status(400).send(Buffer.from(JSON.stringify({"error": "invalid_request", "description": "client assertion could not be decoded"}))).end();
        }
      } else if (!get(decoded, 'header.alg')) {
        Object.assign(returnPayload, { code: 400, data: { "error": "invalid_request", "description": "decoded header did not contain an alg", "udap_testscript_step": "IIB4a1" } });
        if (!res.headersSent){
          res.setHeader('content-type', 'application/json');
          console.log('Response Headers:', res.getHeaders());
          res.status(400).send(Buffer.from(JSON.stringify(returnPayload.data))).end();
        }
      } else if (!get(decoded, 'header.x5c')) {
        Object.assign(returnPayload, { code: 400, data: { "error": "invalid_request", "description": "decoded header did not contain an x5c field", "udap_testscript_step": "IIB4a2" } });
        if (!res.headersSent){
          res.setHeader('Content-Type', 'application/json').status(400).send(Buffer.from(JSON.stringify(returnPayload.data))).end();
        }
      } else if (!get(decoded, 'payload.jti')) {
        Object.assign(returnPayload, { code: 400, data: { "error": "invalid_request", "description": "decoded payload did not contain an jti", "udap_testscript_step": "IIB4c6" } });
        if (!res.headersSent){
          res.setHeader('Content-Type', 'application/json').status(400).send(Buffer.from(JSON.stringify(returnPayload.data))).end();
        }
      } else if (!get(decoded, 'payload.iss')) {
        Object.assign(returnPayload, { code: 400, data: { "error": "invalid_request", "description": "decoded payload did not contain an iss", "udap_testscript_step": "IIB4c1" } });
        delete returnPayload.data.access_token;
        if (!res.headersSent){
          res.setHeader('Content-Type', 'application/json').status(400).send(Buffer.from(JSON.stringify(returnPayload.data))).end();
        }
      } else if (!get(decoded, 'payload.sub')) {
        Object.assign(returnPayload, { code: 400, data: { "error": "invalid_request", "description": "decoded payload did not contain an sub", "udap_testscript_step": "IIB4c2" } });
        delete returnPayload.data.access_token;
        if (!res.headersSent){
          res.setHeader('Content-Type', 'application/json').status(400).send(Buffer.from(JSON.stringify(returnPayload.data))).end();
        }
      } else if (get(decoded, 'payload.iss') !== get(decoded, 'payload.sub')) {
        Object.assign(returnPayload, { code: 400, data: { "error": "invalid_request", "description": "decoded payload iss did not equal sub", "udap_testscript_step": "IIB4c" } });
        if (!res.headersSent){
          res.setHeader('Content-Type', 'application/json').status(400).send(Buffer.from(JSON.stringify(returnPayload.data))).end();
        }
      } else {
        let softwareStatementPem = "-----BEGIN CERTIFICATE-----\r\n";
        softwareStatementPem += formatPEM(get(decoded, 'header.x5c[0]', ''));
        softwareStatementPem += "\r\n-----END CERTIFICATE-----\r\n";

        jwt.verify(client_assertion, softwareStatementPem, { algorithms: ['RS256'] }, (error, verifiedJwt) => {
          if (error) {
            Object.assign(returnPayload, { code: 400, data: { "error": "invalid_request", "description": "jwt could not be verified", "udap_testscript_step": "IIB4a3" } });
            if (!res.headersSent){
              console.log('Response Headers:', res.getHeaders());
              res.setHeader('Content-Type', 'application/json').status(400).send(Buffer.from(JSON.stringify(returnPayload.data))).end();
            }
          } else {
            if (!res.headersSent){
              console.log('Response Headers:', res.getHeaders());
              res.setHeader('Content-Type', 'application/json').status(200).send(Buffer.from(JSON.stringify(returnPayload.data))).end();
            }
          }
        });
      }
    } else {
      // this is not a UDAP server, so we need to return the access token
      // without verifying the client_assertion and checking security certificates

      // will need to set the following for OpenID:
      // - standalone_id_token
      // - standalone_patient_id
      // - standalone_encounter_id

      // let standalone_id_token = jwt.sign({
      // });
      // returnPayload.data.standalone_id_token = "foo";

      if (!res.headersSent){
        console.log('Response Headers:', res.getHeaders());
        console.log('OAuthServerConfig.clientCollection', OAuthServerConfig.clientsCollection);
        res.setHeader('Content-Type', 'application/json').status(200).send(Buffer.from(JSON.stringify(returnPayload.data))).end();
      }
    }


  } else {
    console.log('No client found with that authorization code');
    if (!res.headersSent){
      res.setHeader('Content-Type', 'application/json').status(400).send(JSON.stringify(returnPayload.data)).end();
    }
  }
});


WebApp.handlers.get("/authorizations/manage", async (req, res) => {

  console.log("GET /authorizations/manage");

  saveToInboundTrafficLog(req);

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.json({
    "message": 'authenticate'
  });
});


WebApp.handlers.get("/authorizations/introspect", async (req, res) => {

  console.log("GET /authorizations/introspect");

  saveToInboundTrafficLog(req);

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.json({
    "message": 'introspect'
  });
});


WebApp.handlers.get("/authorizations/revoke", async (req, res) => {

  console.log("GET /authorizations/revoke");

  saveToInboundTrafficLog(req);

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");

  let searchQuery = {};
    if (get(req, 'query.client_name')) {
      searchQuery.client_name = get(req, 'query.client_name');
    }
    if (get(req, 'query.client_id')) {
      searchQuery.client_id = get(req, 'query.client_id');
    }

    let removeSuccess = await OAuthClients.removeAsync(searchQuery);
    let returnPayload = { code: removeSuccess ? 200 : 410 };

    if(removeSuccess){
      if (!res.headersSent){
        res.status(200).json({
          "message": 'success'
        }).end();
      }
    } else {
      if (!res.headersSent){
        res.status(410).json().end()
      }
    }
});


WebApp.handlers.get("/oauth/getIdentity", async (req, res) => {

  console.log("GET /oauth/getIdentity");

  saveToInboundTrafficLog(req);

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  var accessToken = OAuthServerConfig.collections.accessToken.findOne({
    accessToken: accessTokenStr
  });
  var user = Meteor.users.findOne(accessToken.userId);

  if (!res.headersSent){
    res.status(200).json({
      id: user._id,
      email: user.emails[0].address
    }).end();
  }

});






console.log("-----CERT STORE-----");
caStore.listAllCertificates().forEach(function (cert) {
  console.log('cert.signatureOid: ' + get(cert, 'signatureOid'));
});
console.log("--------------------");

let defaultInteractions = [{
  "code": "read"
}];

let defaultSearchParams = [
  {
    "name": "_id",
    "type": "token",
    "documentation": "_id parameter always supported."
  },
  {
    "name": "identifier",
    "type": "token",
    "documentation": "this should be the medical record number"
  }]


export function formatPEM(pemString) {
  const PEM_STRING_LENGTH = pemString.length, LINE_LENGTH = 64;
  const wrapNeeded = PEM_STRING_LENGTH > LINE_LENGTH;

  if (wrapNeeded) {
    let formattedString = "", wrapIndex = 0;

    for (let i = LINE_LENGTH; i < PEM_STRING_LENGTH; i += LINE_LENGTH) {
      formattedString += pemString.substring(wrapIndex, i) + "\r\n";
      wrapIndex = i;
    }

    formattedString += pemString.substring(wrapIndex, PEM_STRING_LENGTH);
    return formattedString;
  } else {
    return pemString;
  }
}

export function removeTrailingSlash(inputString) {
  return inputString.slice(-1) === "/" ? inputString.slice(0, -1) : inputString;
}

export function parseCertAttributes(certActor) {
  let result = "";
  if (has(certActor, 'attributes') && Array.isArray(certActor.attributes)) {
    certActor.attributes.forEach(function (attribute) {
      result += "  " + attribute["shortName"] + "=" + attribute["value"]
    });
  }
  return result;
}

// export async function fetchCertificate(url, certificateArray = []) {
//   try {
//     const res = await HTTP.get(url);
//     const chunks = [];
//     console.log('fetchCertificate.res', res);

//     res.on('data', chunk => chunks.push(chunk));
//     await new Promise((resolve, reject) => res.on('end', resolve));

//     const bodyBuffer = Buffer.concat(chunks);
//     let shortcutAsn1, intermediateCert;
//     try {
//       shortcutAsn1 = forge.asn1.fromDer(bodyBuffer.toString('binary'));
//     } catch (error) {
//       console.log('shortcutCert.error', error);
//     }

//     try {
//       intermediateCert = forge.pki.certificateFromAsn1(shortcutAsn1);
//       if (intermediateCert) {
//         certificateArray.push(intermediateCert);
//         caStore.addCertificate(intermediateCert);
//       }
//     } catch (error) {
//       console.log('intermediateCert.error', error);
//     }

//     if (intermediateCert && Array.isArray(intermediateCert.extensions)) {
//       for (const extension of intermediateCert.extensions) {
//         if (get(extension, 'name') === "authorityInfoAccess") {
//           const httpIndex = extension.value.toString().indexOf('http');
//           const recursiveLookupUrl = extension.value.toString().substring(httpIndex);
//           const recursiveCerts = await fetchCertificate(recursiveLookupUrl, certificateArray);
//           if (Array.isArray(recursiveCerts)) {
//             recursiveCerts.forEach(cert => certificateArray.push(cert));
//           } else {
//             certificateArray.push(recursiveCerts);
//             caStore.addCertificate(recursiveCerts);
//           }
//         }
//         if (get(extension, 'name') === "cRLDistributionPoints") {
//           const httpRevocationIndex = extension.value.toString().indexOf('http');
//           const intermediateCertRevokationUrl = extension.value.toString().substring(httpRevocationIndex);
//           await fetchRevokationList(intermediateCertRevokationUrl);
//         }
//       }
//     }

//     return uniq(certificateArray);
//   } catch (error) {
//     console.error('fetchCertificate.error', error);
//   }
// }



function checkRevokedSerialNumbersAgainstCerts(revokedSerialNumbers, recursiveCerts, res) {
  console.log('revokedSerialNumbers', revokedSerialNumbers);
  console.log('recursiveCerts', recursiveCerts);
  console.log('')
  if (Array.isArray(revokedSerialNumbers)) {
    revokedSerialNumbers.forEach((serialNumber) => {
      console.log('serialNumber', serialNumber);
      if (Array.isArray(recursiveCerts)) {
        recursiveCerts.forEach((certSerialNumber) => {
          console.log('cert.serialNumber', certSerialNumber);
          if (serialNumber === certSerialNumber) {
            console.log('REVOKED CERTIFICATE:', certSerialNumber);
            if (!res.headersSent) {
              res.status(400).json({ "error": "unapproved_software_statement", "description": "revoked client certificate", "udap_testscript_step": "IIA3b1b" }).end();
            }
          }
        });
      }
    });
  }
}

// export async function fetchRevokationList(revokationUrl) {
//   try {
//     const res = await HTTP.get(revokationUrl);
//     const chunks = [];
//     res.on('data', chunk => chunks.push(chunk));
//     await new Promise((resolve, reject) => res.on('end', resolve));

//     const bodyBuffer = Buffer.concat(chunks);
//     let revokationAsn1, revokationBuffer, revokationAsn1crl, revokationCrl, revokedSerialNumbers = [];

//     try {
//       revokationAsn1 = forge.asn1.fromDer(bodyBuffer.toString('binary'));
//     } catch (error) {
//       console.log('shortcutCert.error', error);
//     }

//     try {
//       revokationBuffer = new Uint8Array(bodyBuffer).buffer;
//     } catch (error) {
//       console.log('revokationBuffer.error', error);
//     }

//     try {
//       revokationAsn1crl = asn1js.fromBER(revokationBuffer);
//     } catch (error) {
//       console.log('revokationAsn1crl.error', error);
//     }

//     try {
//       revokationCrl = new pkijs.CertificateRevocationList({ schema: revokationAsn1crl.result });
//       if (revokationCrl.revokedCertificates) {
//         for (const { userCertificate } of revokationCrl.revokedCertificates) {
//           revokedSerialNumbers.push(toLower(pvutils.bufferToHexCodes(userCertificate.valueBlock.valueHex)));
//         }
//       }
//     } catch (error) {
//       console.log('revokationCrl.error', error);
//     }

//     return revokedSerialNumbers;
//   } catch (error) {
//     console.error('fetchRevokationList.error', error);
//   }
// }

export async function fetchRevokationList(revokationUrl) {
  try {
    // Fetch the revocation list from the URL using meteor/http
    // const res = HTTP.call('GET', revokationUrl, { npmRequestOptions: { encoding: null } });

    let revokedSerialNumbers = [];

    await fetch(revokationUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-x509-ca-cert'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }
      return response.arrayBuffer(); // Fetch the response as an ArrayBuffer
    })
    .then(async function(revocationBuffer){
      console.log('-------------------------------------------------------')
      console.log('revocationBuffer:', revocationBuffer);

      const bodyBuffer = Buffer.from(revocationBuffer);
      let revokationAsn1, revokationBuffer, revokationAsn1crl, revokationCrl;


      try {
        // Decode the ASN.1 structure from the DER binary data
        revokationAsn1 = forge.asn1.fromDer(bodyBuffer.toString('binary'));
        // console.log('revokationAsn1', revokationAsn1);
      } catch (error) {
        console.log('shortcutCert.error', error);
      }

      try {
        // Convert the buffer to the required format for ASN.1 parsing
        revokationBuffer = new Uint8Array(bodyBuffer).buffer;
        console.log('revokationBuffer', revokationBuffer);
      } catch (error) {
        console.log('revokationBuffer.error', error);
      }

      try {
        // Parse the ASN.1 data to obtain the Certificate Revocation List (CRL)
        revokationAsn1crl = asn1js.fromBER(revokationBuffer);
        // console.log('revokationAsn1crl', revokationAsn1);
      } catch (error) {
        console.log('revokationAsn1crl.error', error);
      }

      try {
        // Convert the parsed ASN.1 structure into a PKIjs CertificateRevocationList object
        revokationCrl = new pkijs.CertificateRevocationList({ schema: revokationAsn1crl.result });
        console.log('revokationCrl', revokationCrl);

        if (revokationCrl.revokedCertificates) {
          for (const { userCertificate } of revokationCrl.revokedCertificates) {
            // Collect revoked serial numbers in a lowercase hex format
            revokedSerialNumbers.push(toLower(pvutils.bufferToHexCodes(userCertificate.valueBlock.valueHex)));
            console.log('revokedSerialNumbers', revokedSerialNumbers);
          }
        }
      } catch (error) {
        console.log('revokationCrl.error', error);
      }

    }).catch((error) => {
      console.error('Error:', error);
    });







    return revokedSerialNumbers;
  } catch (error) {
    console.error('fetchRevokationList.error', error);
    return [];  // Return an empty array if there's an error
  }
}

export function certificateIsExpired(validity) {
  return moment() > moment(get(validity, 'notAfter')) || moment() < moment(get(validity, 'notBefore'));
}

export function certificateIsRevoked(serialNumber, revokationList) {
  return revokationList.includes(serialNumber);
}



export function fuzzyMatch(redirect_uris, redirectUri) {
  let fuzzyMatch = false;
  const redirectHostname = new URL(redirectUri).hostname;
  if (Array.isArray(redirect_uris)) {
    redirect_uris.forEach(uri => {
      const uriHostname = new URL(uri).hostname;
      if (uriHostname === redirectHostname) {
        fuzzyMatch = true;
      }
    });
  }
  return fuzzyMatch;
}

export function setRedirectHeader(res, responseType, redirectUri, appState, newAuthorizationCode) {
  if (!responseType) {
    res.setHeader("Location", `${redirectUri}?response_type=unspecified&error=invalid_request&state=${appState}`);
  } else if (responseType !== "code") {
    res.setHeader("Location", `${redirectUri}?response_type=wrong_type&error=invalid_request&state=${appState}`);
  } else {
    res.setHeader("Location", `${redirectUri}?state=${appState}&code=${newAuthorizationCode}`);
  }
}

