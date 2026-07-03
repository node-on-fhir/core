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
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import forge from 'node-forge';
import express from 'express';

import bodyParser from 'body-parser';
import { OAuthClients } from '/imports/collections/OAuthClients';
import OAuthServer from '@node-oauth/express-oauth-server';

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
        }
        // Add line breaks every 64 characters to comply with PEM format
        if (pemString && pemString.length > 0) {
          return pemString.match(/.{1,64}/g).join('\r\n');
        }
        return "";
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
          let softwareStatementCert;
          try {
            softwareStatementCert = forge.pki.certificateFromPem(combinedSoftwareStatementPem);
          } catch (certParseError) {
            console.error('Certificate parsing error:', certParseError.message);
            console.error('combinedSoftwareStatementPem length:', combinedSoftwareStatementPem.length);
            if (!res.headersSent) {
              return res.status(400).json({
                "error": "invalid_software_statement",
                "error_description": "Unable to parse x5c certificate: " + certParseError.message,
                "udap_testscript_step": "IIA3a2"
              }).end();
            }
            return;
          }
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
                  const oauthClientRecord = { ...verifiedJwt, resourceType: 'OAuthClient', verified: true, created_at: new Date() };
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
      // Generate client_secret for confidential clients
      let client_secret = null;
      const authMethod = get(req.body, 'token_endpoint_auth_method', 'client_secret_basic');

      if(['client_secret_basic', 'client_secret_post'].includes(authMethod)){
        // Generate a strong random secret (two Random IDs concatenated)
        client_secret = Random.id() + Random.id();
      }

      const oauthClientRecord = {
        ...req.body,
        resourceType: 'OAuthClient',
        client_secret: client_secret,
        verified: false,
        created_at: new Date()
      };

      const clientId = await OAuthClients.insertAsync(oauthClientRecord);

      console.log('clientId', clientId);
      console.log('Generated client_secret for confidential client:', !!client_secret);

      // Return response with client_secret if generated
      const response = {
        client_id: clientId,
        client_name: get(req.body, 'client_name'),
        scope: get(req.body, 'scope')
      };

      if(client_secret){
        response.client_secret = client_secret;
      }

      if (!res.headersSent){
        res.status(201).json(response).end();
      }
    } else {
      if (!res.headersSent){
        res.status(204).json({ "error": "wasnt_able_to_decode_jwt" }).end();
      }
    }
  }
});


// Shared authorize handler for both GET and POST
// SMART on FHIR 2.x requires support for both methods
async function handleAuthorize(req, res, method) {
  console.log(method + " /oauth/authorize");

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

  // SMART 2.x parameters
  let requestedScope = get(req, 'query.scope') || get(req, 'body.scope');
  let launchContext = get(req, 'query.launch') || get(req, 'body.launch');
  let patientId = get(req, 'query.patient') || get(req, 'body.patient');
  let codeChallenge = get(req, 'query.code_challenge') || get(req, 'body.code_challenge');
  let codeChallengeMethod = get(req, 'query.code_challenge_method') || get(req, 'body.code_challenge_method');
  let aud = get(req, 'query.aud') || get(req, 'body.aud');

  // SMART on FHIR 2.x: Validate aud parameter if provided (ONC 9.4.04)
  // The aud must match the FHIR server base URL
  if (aud) {
    const fhirPath = get(Meteor, 'settings.private.fhir.fhirPath', 'baseR4');
    const expectedAud = Meteor.absoluteUrl() + fhirPath;

    // Normalize both URLs (remove trailing slashes for comparison)
    const normalizedAud = aud.replace(/\/$/, '');
    const normalizedExpected = expectedAud.replace(/\/$/, '');

    if (normalizedAud !== normalizedExpected) {
      console.error('OAuth authorize - Invalid aud parameter. Got:', aud, 'Expected:', expectedAud);

      // Return error per OAuth 2.0 spec
      if (redirectUri) {
        const errorUrl = new URL(redirectUri);
        errorUrl.searchParams.set('error', 'invalid_request');
        errorUrl.searchParams.set('error_description', 'Invalid aud parameter - must match FHIR server base URL');
        if (appState) {
          errorUrl.searchParams.set('state', appState);
        }
        return res.redirect(errorUrl.toString());
      } else {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Invalid aud parameter - must match FHIR server base URL'
        }).end();
      }
    }
    console.log('OAuth authorize - aud parameter validated:', aud);
  }

  if (process.env.DEBUG_OAUTH) {
    console.log("SMART 2.x params - scope:", requestedScope, "launch:", launchContext, "patient:", patientId);
    console.log("PKCE - code_challenge:", codeChallenge, "method:", codeChallengeMethod);
  }

  if (redirectUri && appState.length === 0) {
    res.setHeader("Location", `${redirectUri}?state=unspecified&error=invalid_request`);

    if (!res.headersSent){
      res.status(301).json(returnPayload).end();
    }
  } else {
    if (clientId) {
      const client = await OAuthClients.findOneAsync({ $or: [{ _id: clientId }, { client_id: clientId }] });
      if (client) {
        // Check if this is a standalone launch that requires patient selection
        // If launch/patient scope is requested but no patient ID is provided and no launch context,
        // redirect to the patient picker page
        const needsPatientPicker = requestedScope &&
                                   requestedScope.includes('launch/patient') &&
                                   !patientId &&
                                   !launchContext;

        if (needsPatientPicker) {
          console.log('Standalone launch with launch/patient scope - redirecting to patient picker');

          // Validate redirect_uri before proceeding
          if (redirectUri && Array.isArray(client.redirect_uris) && !client.redirect_uris.includes(redirectUri)) {
            if (!res.headersSent) {
              res.status(412).json({ "error_message": 'Provided redirect did not match registered redirects...' }).end();
            }
            return;
          }

          // Build URL to patient picker page with OAuth params
          const patientPickerUrl = new URL(Meteor.absoluteUrl() + 'oauth-patient-picker');
          patientPickerUrl.searchParams.set('client_id', clientId);
          patientPickerUrl.searchParams.set('state', appState || '');
          patientPickerUrl.searchParams.set('redirect_uri', redirectUri || get(client, 'redirect_uris.0', ''));
          patientPickerUrl.searchParams.set('scope', requestedScope);
          patientPickerUrl.searchParams.set('response_type', responseType || 'code');
          if (codeChallenge) {
            patientPickerUrl.searchParams.set('code_challenge', codeChallenge);
            patientPickerUrl.searchParams.set('code_challenge_method', codeChallengeMethod || 'S256');
          }
          if (aud) {
            patientPickerUrl.searchParams.set('aud', aud);
          }

          console.log('Redirecting to patient picker:', patientPickerUrl.toString());

          res.setHeader('Location', patientPickerUrl.toString());
          if (!res.headersSent) {
            res.status(302).end();
          }
          return;
        }

        const newAuthorizationCode = Random.id();
        client.authorization_code = newAuthorizationCode;

        // Store SMART 2.x context for token exchange
        if (requestedScope) {
          client.requested_scope = requestedScope;
        }
        if (launchContext) {
          client.launch_context = launchContext;
          client.launch_type = 'ehr';
        } else {
          client.launch_type = 'standalone';
        }
        if (patientId) {
          client.patient_id = patientId;
        }
        if (codeChallenge) {
          client.code_challenge = codeChallenge;
          client.code_challenge_method = codeChallengeMethod || 'S256';
        }

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
}

// GET /oauth/authorize - Standard authorize endpoint
WebApp.handlers.get("/oauth/authorize", async (req, res) => {
  await handleAuthorize(req, res, "GET");
});

// POST /oauth/authorize - Required by SMART on FHIR 2.x spec
WebApp.handlers.post("/oauth/authorize", async (req, res) => {
  await handleAuthorize(req, res, "POST");
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
        // Security: Try _id first (original owner wins), then fall back to client_id field
        // This prevents impersonation if attacker registers client_id matching existing _id
        let registeredClient = await OAuthClients.findOneAsync({ _id: clientId });
        if (!registeredClient) {
          registeredClient = await OAuthClients.findOneAsync({ client_id: clientId });
        }
        
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
              scope: scopes,
              requested_scope: scopes  // Also update requested_scope for consistency with BulkData.js
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

  // Handle refresh_token grant type
  if (get(req.body, 'grant_type') === 'refresh_token') {
    console.log('Processing refresh_token grant type');

    let incomingRefreshToken = get(req.body, 'refresh_token');
    if (!incomingRefreshToken) {
      res.status(400).json({
        "error": "invalid_request",
        "error_description": "refresh_token is required"
      });
      return;
    }

    // Find client by refresh token
    let clientWithRefreshToken = await OAuthClients.findOneAsync({ refresh_token: incomingRefreshToken });

    if (!clientWithRefreshToken) {
      console.log('No client found with refresh_token:', incomingRefreshToken);
      res.status(400).json({
        "error": "invalid_grant",
        "error_description": "Invalid refresh token"
      });
      return;
    }

    console.log('Found client for refresh token:', clientWithRefreshToken.client_id);

    // Generate new access token and refresh token
    let newAccessToken = Random.id();
    let newRefreshToken = Random.id();

    // CRITICAL: Use the ORIGINAL scope from when the refresh token was issued
    // Per OAuth 2.0 spec, refresh token response scope MUST be subset of original
    let originalScope = clientWithRefreshToken.requested_scope || clientWithRefreshToken.scope || '';

    // If client requests a subset of scopes, use that instead
    let requestedScope = get(req.body, 'scope', '');
    let effectiveScope = originalScope;

    if (requestedScope) {
      // Only allow scopes that are in the original grant
      let originalScopes = originalScope.split(' ').filter(s => s);
      let requestedScopes = requestedScope.split(' ').filter(s => s);
      let allowedScopes = requestedScopes.filter(s => originalScopes.includes(s));

      if (allowedScopes.length > 0) {
        effectiveScope = allowedScopes.join(' ');
      } else {
        // If none of the requested scopes are valid, use original
        effectiveScope = originalScope;
      }
    }

    console.log('Refresh token - original scope:', originalScope);
    console.log('Refresh token - effective scope:', effectiveScope);

    // Update client with new tokens
    await OAuthClients.updateAsync(
      { _id: clientWithRefreshToken._id },
      {
        $set: {
          access_token: newAccessToken,
          access_token_created_at: new Date(),
          refresh_token: newRefreshToken
        }
      }
    );

    // Build token response
    let tokenResponse = {
      "access_token": newAccessToken,
      "token_type": "Bearer",
      "scope": effectiveScope,
      "expires_in": get(Meteor, 'settings.private.fhir.tokenTimeout', 86400),
      "refresh_token": newRefreshToken
    };

    // Add id_token if openid scope is present
    if (effectiveScope.includes('openid')) {
      let privateKey = get(Meteor, 'settings.private.x509.privateKey', '');
      if (privateKey) {
        privateKey = privateKey.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        let nowInSeconds = Math.floor(Date.now() / 1000);
        let fhirBasePath = get(Meteor, 'settings.private.fhir.fhirPath', 'baseR4');
        let idTokenPayload = {
          iss: Meteor.absoluteUrl() + fhirBasePath,
          sub: clientWithRefreshToken.user_id || clientWithRefreshToken._id,
          aud: clientWithRefreshToken.client_id || clientWithRefreshToken._id,
          exp: nowInSeconds + 3600,
          iat: nowInSeconds
        };

        if (clientWithRefreshToken.patient_id && effectiveScope.includes('fhirUser')) {
          idTokenPayload.fhirUser = Meteor.absoluteUrl() + fhirBasePath + '/Patient/' + clientWithRefreshToken.patient_id;
        }

        try {
          tokenResponse.id_token = jwt.sign(idTokenPayload, privateKey, { algorithm: 'RS256' });
        } catch (idTokenError) {
          console.error('Error signing id_token for refresh:', idTokenError.message);
        }
      }
    }

    console.log('Refresh token response:', JSON.stringify(tokenResponse, null, 2));

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.status(200).json(tokenResponse);
    return;
  }

  // Handle standard authorization_code grant type (user-interactive flow)
  let authCode = get(req.query, 'code') || get(req.body, 'code');
  let authorizedClient = await OAuthClients.findOneAsync({ authorization_code: authCode });
  console.log('authorizedClient', authorizedClient);

  if (authorizedClient) {
    // Client ID Validation (ONC g(10) 9.17.04 / AUT-PAT-18)
    // Validate that the client_id in the request matches the client that owns the authorization code
    let requestClientId = null;

    // Extract client_id from Basic auth header (for confidential clients)
    const authHeader = get(req, 'headers.authorization', '');
    if (authHeader.startsWith('Basic ')) {
      try {
        const base64Credentials = authHeader.substring(6);
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
        const [clientId, clientSecret] = credentials.split(':');
        requestClientId = clientId;
        console.log('Client ID from Basic auth header:', requestClientId);
      } catch (e) {
        console.error('Failed to decode Basic auth header:', e.message);
      }
    }

    // If not in header, check request body (for public clients or client_secret_post)
    if (!requestClientId) {
      requestClientId = get(req.body, 'client_id');
      if (requestClientId) {
        console.log('Client ID from request body:', requestClientId);
      }
    }

    // Validate client_id matches the authorization code owner
    if (requestClientId) {
      // Check if request client_id matches either _id or client_id field of authorized client
      const clientIdMatches = (requestClientId === authorizedClient._id) ||
                              (requestClientId === authorizedClient.client_id);

      if (!clientIdMatches) {
        console.error('Client ID validation failed - request client_id:', requestClientId,
                      'does not match authorized client _id:', authorizedClient._id,
                      'or client_id:', authorizedClient.client_id);
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/json');
          res.status(401).json({
            error: 'invalid_client',
            error_description: 'Client ID does not match the authorization code'
          }).end();
        }
        return;
      }
      console.log('Client ID validation successful');
    } else {
      console.log('Client ID validation skipped - no client_id provided in request');
    }

    // PKCE Validation (RFC 7636 / SMART App Launch 2.x / ONC g(10) 9.18.03)
    // If code_challenge was provided during authorization, code_verifier MUST be validated
    if (authorizedClient.code_challenge) {
      let codeVerifier = get(req.body, 'code_verifier');
      let codeChallengeMethod = authorizedClient.code_challenge_method || 'S256';

      console.log('PKCE validation - code_challenge present, method:', codeChallengeMethod);
      console.log('PKCE validation - code_verifier provided:', !!codeVerifier);

      if (!codeVerifier) {
        // code_verifier is required when code_challenge was used
        console.error('PKCE validation failed - code_verifier missing');
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/json');
          res.status(400).json({
            error: 'invalid_request',
            error_description: 'code_verifier is required when code_challenge was used during authorization'
          }).end();
        }
        return;
      }

      // Validate code_verifier against stored code_challenge
      let computedChallenge;
      if (codeChallengeMethod === 'S256') {
        // S256: BASE64URL(SHA256(code_verifier))
        const hash = crypto.createHash('sha256').update(codeVerifier).digest();
        // BASE64URL encoding: replace + with -, / with _, remove =
        computedChallenge = hash.toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      } else if (codeChallengeMethod === 'plain') {
        // Plain method (not recommended, but must be supported)
        computedChallenge = codeVerifier;
      } else {
        console.error('PKCE validation failed - unsupported code_challenge_method:', codeChallengeMethod);
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/json');
          res.status(400).json({
            error: 'invalid_request',
            error_description: 'Unsupported code_challenge_method'
          }).end();
        }
        return;
      }

      console.log('PKCE validation - computed challenge:', computedChallenge);
      console.log('PKCE validation - stored challenge:', authorizedClient.code_challenge);

      if (computedChallenge !== authorizedClient.code_challenge) {
        console.error('PKCE validation failed - code_verifier does not match code_challenge');
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/json');
          res.status(400).json({
            error: 'invalid_grant',
            error_description: 'code_verifier does not match code_challenge'
          }).end();
        }
        return;
      }

      console.log('PKCE validation successful');
    } else {
      console.log('PKCE validation skipped - no code_challenge was used during authorization');
    }

    let updatedAuthorizedClient = cloneDeep(authorizedClient);
    delete updatedAuthorizedClient._document;
    delete updatedAuthorizedClient._super_;
    updatedAuthorizedClient.access_token = Random.id();
    updatedAuthorizedClient.access_token_created_at = new Date();

    // Use requested_scope from authorization if available, otherwise fall back to registered scope
    let effectiveScope = authorizedClient.requested_scope || authorizedClient.scope || '';

    // Check for offline_access scope to determine if refresh token should be issued
    let hasOfflineAccess = effectiveScope.includes('offline_access') || process.env.REFRESH_TOKEN;
    if (hasOfflineAccess) {
      updatedAuthorizedClient.refresh_token = Random.id();
    }

    await OAuthClients.updateAsync({ _id: updatedAuthorizedClient._id }, { $set: updatedAuthorizedClient });

    // Build token response per SMART App Launch 2.x / 170.315(g)(10) AUT-PAT-35
    let returnPayload = {
      code: 200,
      data: {
        "access_token": updatedAuthorizedClient.access_token,
        "token_type": "Bearer",
        "scope": effectiveScope,
        "expires_in": get(Meteor, 'settings.private.fhir.tokenTimeout', 86400)
      }
    };

    // refresh_token - required when offline_access scope is granted (must be valid 3+ months)
    if (hasOfflineAccess) {
      returnPayload.data.refresh_token = updatedAuthorizedClient.refresh_token;
    }

    // patient context - required for context-ehr-patient and context-standalone-patient
    if (authorizedClient.patient_id) {
      returnPayload.data.patient = authorizedClient.patient_id;
    }

    // encounter context - required for US Core 6.1.0+ (context-ehr-encounter)
    if (authorizedClient.encounter_id) {
      returnPayload.data.encounter = authorizedClient.encounter_id;
    }

    // DICOM context - ImagingStudy and GridFS file for DICOM viewer apps
    if (authorizedClient.imaging_study_id) {
      returnPayload.data.imagingStudy = authorizedClient.imaging_study_id;
    }
    if (authorizedClient.gridfs_file_id) {
      returnPayload.data.gridfsFileId = authorizedClient.gridfs_file_id;
    }

    // EHR launch context fields
    if (authorizedClient.launch_type === 'ehr') {
      returnPayload.data.need_patient_banner = true;
      returnPayload.data.smart_style_url = Meteor.absoluteUrl() + 'smart-style.json';
    }

    // id_token - required when openid scope is requested (sso-openid-connect capability)
    if (effectiveScope.includes('openid')) {
      let privateKey = get(Meteor, 'settings.private.x509.privateKey', '');
      if (privateKey) {
        // Normalize line endings - handle both actual CRLF bytes and escaped strings
        // After JSON parsing, \r\n becomes actual CRLF (0x0D 0x0A)
        privateKey = privateKey.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        let nowInSeconds = Math.floor(Date.now() / 1000);
        let fhirBasePath = get(Meteor, 'settings.private.fhir.fhirPath', 'baseR4');
        let idTokenPayload = {
          iss: Meteor.absoluteUrl() + fhirBasePath,
          sub: authorizedClient.user_id || authorizedClient._id,
          aud: authorizedClient.client_id || authorizedClient._id,
          exp: nowInSeconds + 3600,
          iat: nowInSeconds
        };

        // Add fhirUser claim if patient context is available
        if (authorizedClient.patient_id && effectiveScope.includes('fhirUser')) {
          idTokenPayload.fhirUser = Meteor.absoluteUrl() + fhirBasePath + '/Patient/' + authorizedClient.patient_id;
        }

        try {
          console.log('Signing id_token with RS256 algorithm...');
          console.log('id_token payload:', JSON.stringify(idTokenPayload, null, 2));
          returnPayload.data.id_token = jwt.sign(idTokenPayload, privateKey, { algorithm: 'RS256' });
          console.log('id_token signed successfully, length:', returnPayload.data.id_token.length);
        } catch (idTokenError) {
          console.error('Error signing id_token:', idTokenError.message);
          console.error('Error stack:', idTokenError.stack);
          // Log the key format for debugging (first 50 chars only for security)
          console.error('Private key starts with:', privateKey.substring(0, 50));
        }
      } else {
        console.warn('openid scope requested but no private key configured for id_token signing');
      }
    }


    // Check if this is a JWT-based request (UDAP or SMART asymmetric) vs standard OAuth (Basic auth)
    let client_assertion = get(req.body, 'client_assertion');

    // Handle JWT-based client authentication (UDAP with x5c or SMART asymmetric with kid)
    if(client_assertion){

      let decoded = jwt.decode(client_assertion, { complete: true });

      console.log('JWT client assertion - decoded:', decoded);
      if(!decoded){
        if (!res.headersSent){
          res.setHeader('Content-Type', 'application/json');
          console.log('Response Headers:', res.getHeaders());
          res.status(400).send(Buffer.from(JSON.stringify({"error": "invalid_request", "description": "client assertion could not be decoded"}))).end();
        }
        return;
      }

      if (!get(decoded, 'header.alg')) {
        Object.assign(returnPayload, { code: 400, data: { "error": "invalid_request", "description": "decoded header did not contain an alg", "udap_testscript_step": "IIB4a1" } });
        if (!res.headersSent){
          res.setHeader('content-type', 'application/json');
          console.log('Response Headers:', res.getHeaders());
          res.status(400).send(Buffer.from(JSON.stringify(returnPayload.data))).end();
        }
        return;
      }

      // Check if this is SMART asymmetric (has kid, no x5c) or UDAP (has x5c)
      const hasKid = get(decoded, 'header.kid');
      const hasX5c = get(decoded, 'header.x5c');

      if (hasKid && !hasX5c) {
        // SMART asymmetric client authentication (ONC g(10) 9.21.4)
        // Verify JWT using client's registered JWKS
        console.log('SMART asymmetric flow - kid:', hasKid);

        const clientId = get(decoded, 'payload.iss') || get(decoded, 'payload.sub');
        if (!clientId) {
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json');
            res.status(400).json({
              error: 'invalid_client',
              error_description: 'client_assertion must contain iss or sub claim'
            }).end();
          }
          return;
        }

        // Look up the client to get their JWKS
        let asymmetricClient = await OAuthClients.findOneAsync({ _id: clientId });
        if (!asymmetricClient) {
          asymmetricClient = await OAuthClients.findOneAsync({ client_id: clientId });
        }

        if (!asymmetricClient) {
          console.error('SMART asymmetric - client not found:', clientId);
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401).json({
              error: 'invalid_client',
              error_description: 'Client not registered'
            }).end();
          }
          return;
        }

        // Get JWKS from client record or fetch from jwks_uri
        let jwks = null;
        if (asymmetricClient.jwks) {
          jwks = asymmetricClient.jwks;
          console.log('SMART asymmetric - using inline JWKS');
        } else if (asymmetricClient.jwks_uri) {
          console.log('SMART asymmetric - fetching JWKS from:', asymmetricClient.jwks_uri);
          try {
            const jwksResponse = await fetch(asymmetricClient.jwks_uri);
            if (jwksResponse.ok) {
              jwks = await jwksResponse.json();
            } else {
              console.error('SMART asymmetric - failed to fetch JWKS:', jwksResponse.status);
            }
          } catch (fetchError) {
            console.error('SMART asymmetric - error fetching JWKS:', fetchError.message);
          }
        }

        if (!jwks || !jwks.keys) {
          console.error('SMART asymmetric - no JWKS available for client:', clientId);
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401).json({
              error: 'invalid_client',
              error_description: 'Client has no JWKS configured'
            }).end();
          }
          return;
        }

        // Find the key by kid
        const key = jwks.keys.find(k => k.kid === hasKid);
        if (!key) {
          console.error('SMART asymmetric - key not found with kid:', hasKid);
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401).json({
              error: 'invalid_client',
              error_description: 'Key not found in client JWKS'
            }).end();
          }
          return;
        }

        // Convert JWK to PEM for verification
        try {
          const { createPublicKey } = await import('crypto');
          const publicKey = createPublicKey({ key: key, format: 'jwk' });
          const pem = publicKey.export({ type: 'spki', format: 'pem' });

          // Verify the JWT
          jwt.verify(client_assertion, pem, { algorithms: [decoded.header.alg] }, (error, verifiedJwt) => {
            if (error) {
              console.error('SMART asymmetric - JWT verification failed:', error.message);
              if (!res.headersSent) {
                res.setHeader('Content-Type', 'application/json');
                res.status(401).json({
                  error: 'invalid_client',
                  error_description: 'Client assertion signature verification failed'
                }).end();
              }
            } else {
              console.log('SMART asymmetric - JWT verified successfully');
              // Success - return token response
              if (!res.headersSent) {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Cache-Control', 'no-store');
                res.setHeader('Pragma', 'no-cache');
                res.status(200).send(Buffer.from(JSON.stringify(returnPayload.data))).end();
              }
            }
          });
        } catch (cryptoError) {
          console.error('SMART asymmetric - crypto error:', cryptoError.message);
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401).json({
              error: 'invalid_client',
              error_description: 'Failed to process client key'
            }).end();
          }
        }
        return;

      } else if (hasX5c) {
        // UDAP flow - x5c certificate chain present
        console.log('UDAP flow - x5c present');

        if (!get(decoded, 'payload.jti')) {
          Object.assign(returnPayload, { code: 400, data: { "error": "invalid_request", "description": "decoded payload did not contain an jti", "udap_testscript_step": "IIB4c6" } });
          if (!res.headersSent){
            res.setHeader('Content-Type', 'application/json').status(400).send(Buffer.from(JSON.stringify(returnPayload.data))).end();
          }
          return;
        }
        if (!get(decoded, 'payload.iss')) {
          Object.assign(returnPayload, { code: 400, data: { "error": "invalid_request", "description": "decoded payload did not contain an iss", "udap_testscript_step": "IIB4c1" } });
          delete returnPayload.data.access_token;
          if (!res.headersSent){
            res.setHeader('Content-Type', 'application/json').status(400).send(Buffer.from(JSON.stringify(returnPayload.data))).end();
          }
          return;
        }
        if (!get(decoded, 'payload.sub')) {
          Object.assign(returnPayload, { code: 400, data: { "error": "invalid_request", "description": "decoded payload did not contain an sub", "udap_testscript_step": "IIB4c2" } });
          delete returnPayload.data.access_token;
          if (!res.headersSent){
            res.setHeader('Content-Type', 'application/json').status(400).send(Buffer.from(JSON.stringify(returnPayload.data))).end();
          }
          return;
        }
        if (get(decoded, 'payload.iss') !== get(decoded, 'payload.sub')) {
          Object.assign(returnPayload, { code: 400, data: { "error": "invalid_request", "description": "decoded payload iss did not equal sub", "udap_testscript_step": "IIB4c" } });
          if (!res.headersSent){
            res.setHeader('Content-Type', 'application/json').status(400).send(Buffer.from(JSON.stringify(returnPayload.data))).end();
          }
          return;
        }

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
            // UDAP server success - add required headers per 170.315(g)(10) AUT-PAT-35
            if (!res.headersSent){
              console.log('Response Headers:', res.getHeaders());
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Cache-Control', 'no-store');
              res.setHeader('Pragma', 'no-cache');
              res.status(200).send(Buffer.from(JSON.stringify(returnPayload.data))).end();
            }
          }
        });
        return;

      } else {
        // JWT has neither kid nor x5c - invalid
        Object.assign(returnPayload, { code: 400, data: { "error": "invalid_request", "description": "client_assertion must contain either x5c or kid header" } });
        if (!res.headersSent){
          res.setHeader('Content-Type', 'application/json').status(400).send(Buffer.from(JSON.stringify(returnPayload.data))).end();
        }
        return;
      }
    } else {
      // Standard OAuth/SMART flow (Basic auth or no client_assertion)
      // This handles both non-UDAP servers and UDAP-capable servers with Basic auth clients
      // Required headers per 170.315(g)(10) AUT-PAT-35
      if (!res.headersSent){
        console.log('Standard OAuth flow - returning token response');
        console.log('Response Headers:', res.getHeaders());
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Pragma', 'no-cache');
        res.status(200).send(Buffer.from(JSON.stringify(returnPayload.data))).end();
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


// Token Introspection Endpoint (RFC 7662 / ONC g(10) 9.20.2)
// POST /authorizations/introspect - Introspect an access token or refresh token
WebApp.handlers.post("/authorizations/introspect", async (req, res) => {

  console.log("POST /authorizations/introspect");

  saveToInboundTrafficLog(req);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");

  // Get the token from request body
  const token = get(req.body, 'token');
  const tokenTypeHint = get(req.body, 'token_type_hint'); // optional: 'access_token' or 'refresh_token'

  console.log('Token introspection - token:', token ? token.substring(0, 8) + '...' : 'none');
  console.log('Token introspection - token_type_hint:', tokenTypeHint);

  if (!token) {
    // RFC 7662: If token is missing, return inactive
    console.log('Token introspection - no token provided, returning inactive');
    res.status(200).json({ active: false }).end();
    return;
  }

  // Look up the token in OAuthClients collection
  // Check both access_token and refresh_token fields
  let client = null;
  let tokenType = null;

  // Try access_token first (or if hinted)
  if (!tokenTypeHint || tokenTypeHint === 'access_token') {
    client = await OAuthClients.findOneAsync({ access_token: token });
    if (client) {
      tokenType = 'access_token';
    }
  }

  // If not found as access_token, try refresh_token
  if (!client && (!tokenTypeHint || tokenTypeHint === 'refresh_token')) {
    client = await OAuthClients.findOneAsync({ refresh_token: token });
    if (client) {
      tokenType = 'refresh_token';
    }
  }

  if (!client) {
    // Token not found - return inactive
    console.log('Token introspection - token not found, returning inactive');
    res.status(200).json({ active: false }).end();
    return;
  }

  // Check if token has been revoked
  if (client.revoked_at) {
    console.log('Token introspection - token has been revoked, returning inactive');
    res.status(200).json({ active: false }).end();
    return;
  }

  // Check if access token has expired (for access_token type)
  if (tokenType === 'access_token' && client.access_token_created_at) {
    const tokenTimeout = get(Meteor, 'settings.private.fhir.tokenTimeout', 86400); // default 24 hours
    const expiresAt = moment(client.access_token_created_at).add(tokenTimeout, 'seconds');
    if (moment().isAfter(expiresAt)) {
      console.log('Token introspection - access token has expired, returning inactive');
      res.status(200).json({ active: false }).end();
      return;
    }
  }

  // Token is active - build introspection response per RFC 7662
  console.log('Token introspection - token is active');

  const tokenTimeout = get(Meteor, 'settings.private.fhir.tokenTimeout', 86400);
  const issuedAt = client.access_token_created_at ? Math.floor(new Date(client.access_token_created_at).getTime() / 1000) : null;
  const expiresAt = issuedAt ? issuedAt + tokenTimeout : null;

  const introspectionResponse = {
    active: true,
    scope: client.requested_scope || client.scope || '',
    client_id: client.client_id || client._id,
    token_type: 'Bearer'
  };

  // Add optional claims if available
  if (expiresAt) {
    introspectionResponse.exp = expiresAt;
  }
  if (issuedAt) {
    introspectionResponse.iat = issuedAt;
  }
  // sub should match the ID token's sub claim (which is user_id)
  if (client.user_id) {
    introspectionResponse.sub = client.user_id;
    introspectionResponse.username = client.user_id;
  }

  // Add launch context parameters (SMART on FHIR)
  // When launch/patient scope is present, include patient claim
  const grantedScope = introspectionResponse.scope || '';
  if (grantedScope.includes('launch/patient') && client.patient_id) {
    introspectionResponse.patient = client.patient_id;
    console.log('Token introspection - adding patient launch context:', client.patient_id);
  }
  // Include encounter claim if encounter_id is present
  // (matches token response behavior - encounter is included if present, regardless of scope)
  if (client.encounter_id) {
    introspectionResponse.encounter = client.encounter_id;
    console.log('Token introspection - adding encounter launch context:', client.encounter_id);
  }
  // Include DICOM context if present (ImagingStudy and GridFS file)
  if (client.imaging_study_id) {
    introspectionResponse.imagingStudy = client.imaging_study_id;
    console.log('Token introspection - adding imagingStudy launch context:', client.imaging_study_id);
  }
  if (client.gridfs_file_id) {
    introspectionResponse.gridfsFileId = client.gridfs_file_id;
    console.log('Token introspection - adding gridfsFileId launch context:', client.gridfs_file_id);
  }

  // Add issuer
  const fhirBasePath = get(Meteor, 'settings.private.fhir.fhirPath', 'baseR4');
  introspectionResponse.iss = Meteor.absoluteUrl() + fhirBasePath;

  console.log('Token introspection response:', JSON.stringify(introspectionResponse, null, 2));

  res.status(200).json(introspectionResponse).end();
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


//===========================================================================
// Meteor Methods for OAuth

Meteor.methods({
  /**
   * OAuth.completeWithPatient
   * Complete OAuth authorization with patient selection (for standalone launch with launch/patient scope)
   * Called from OAuthPatientPickerPage after user selects a patient
   */
  'OAuth.completeWithPatient': async function(params) {
    console.log('OAuth.completeWithPatient called with params:', JSON.stringify(params, null, 2));

    const { clientId, patientId, patientFhirId, state, redirectUri, scope, codeChallenge, codeChallengeMethod, sessionDurationMinutes } = params;

    if (!clientId) {
      throw new Meteor.Error('invalid_request', 'Missing client_id');
    }
    if (!patientId && !patientFhirId) {
      throw new Meteor.Error('invalid_request', 'Missing patient ID');
    }
    if (!redirectUri) {
      throw new Meteor.Error('invalid_request', 'Missing redirect_uri');
    }

    // Find the OAuth client record
    const client = await OAuthClients.findOneAsync({
      $or: [{ _id: clientId }, { client_id: clientId }]
    });

    if (!client) {
      console.error('OAuth.completeWithPatient - No client found with client_id:', clientId);
      throw new Meteor.Error('invalid_client', 'No client found with that client_id');
    }

    // Validate redirect_uri matches registered redirects
    if (Array.isArray(client.redirect_uris) && !client.redirect_uris.includes(redirectUri)) {
      console.error('OAuth.completeWithPatient - Redirect URI mismatch. Got:', redirectUri, 'Expected one of:', client.redirect_uris);
      throw new Meteor.Error('invalid_request', 'Redirect URI does not match registered redirects');
    }

    // Generate new authorization code
    const authorizationCode = Random.id();

    // Update client with patient context and authorization code
    const updateFields = {
      authorization_code: authorizationCode,
      patient_id: patientFhirId || patientId,  // Use FHIR ID if available
      launch_type: 'standalone',
      requested_scope: scope || client.scope
    };

    // Store PKCE params if provided
    if (codeChallenge) {
      updateFields.code_challenge = codeChallenge;
      updateFields.code_challenge_method = codeChallengeMethod || 'S256';
    }

    // Store user_id for ownership tracking (token revocation)
    if (this.userId) {
      updateFields.user_id = this.userId;
    }

    // Calculate authorization expiration based on session duration (ONC g(10) 9.3.01)
    if (sessionDurationMinutes && sessionDurationMinutes > 0) {
      updateFields.session_duration_minutes = sessionDurationMinutes;
      updateFields.authorization_expires_at = new Date(Date.now() + (sessionDurationMinutes * 60 * 1000));
      console.log('OAuth.completeWithPatient - Authorization expires at:', updateFields.authorization_expires_at);
    }

    console.log('OAuth.completeWithPatient - Updating client with:', updateFields);

    await OAuthClients.updateAsync(
      { _id: client._id },
      { $set: updateFields }
    );

    // Build redirect URL with authorization code
    const redirectUrl = new URL(redirectUri);
    redirectUrl.searchParams.set('code', authorizationCode);
    if (state) {
      redirectUrl.searchParams.set('state', state);
    }

    console.log('OAuth.completeWithPatient - Redirect URL:', redirectUrl.toString());

    return {
      code: authorizationCode,
      state: state,
      redirectUrl: redirectUrl.toString()
    };
  },

  /**
   * OAuth.createEhrLaunchContext
   * Create a launch context for EHR launch (when launching app from within EHR)
   * Returns a launch token that can be passed to the app's launch URL
   */
  'OAuth.createEhrLaunchContext': async function(params) {
    console.log('OAuth.createEhrLaunchContext called with params:', JSON.stringify(params, null, 2));

    const { clientId, patientId, patientFhirId, encounterId, imagingStudyId, gridfsFileId } = params;

    if (!clientId) {
      throw new Meteor.Error('invalid_request', 'Missing client_id');
    }
    if (!patientId && !patientFhirId) {
      throw new Meteor.Error('invalid_request', 'Missing patient ID');
    }

    // Find the OAuth client record
    const client = await OAuthClients.findOneAsync({
      $or: [{ _id: clientId }, { client_id: clientId }]
    });

    if (!client) {
      console.error('OAuth.createEhrLaunchContext - No client found with client_id:', clientId);
      throw new Meteor.Error('invalid_client', 'No client found with that client_id');
    }

    // Generate launch context token
    const launchToken = Random.id();

    // Update client with launch context
    const updateFields = {
      launch_context: launchToken,
      launch_type: 'ehr',
      patient_id: patientFhirId || patientId
    };

    // Add encounter context for US Core 6.1.0+ compliance (context-ehr-encounter)
    // Uses provided encounterId, or falls back to settings default from defaultEncounter blob
    let effectiveEncounterId = encounterId || get(Meteor, 'settings.private.fhir.defaultEncounter.id');
    if (effectiveEncounterId) {
      updateFields.encounter_id = effectiveEncounterId;
    } else {
      console.warn('OAuth.createEhrLaunchContext - No encounter_id provided and no defaultEncounter.id configured in settings');
    }

    // Add DICOM context if provided (ImagingStudy and/or GridFS file)
    if (imagingStudyId) {
      updateFields.imaging_study_id = imagingStudyId;
    }
    if (gridfsFileId) {
      updateFields.gridfs_file_id = gridfsFileId;
    }

    console.log('OAuth.createEhrLaunchContext - Updating client with:', updateFields);

    await OAuthClients.updateAsync(
      { _id: client._id },
      { $set: updateFields }
    );

    // Build launch URL
    const fhirBaseUrl = Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.fhirPath', 'baseR4');
    const launchUri = client.launch_uri || client.redirect_uris?.[0];

    if (!launchUri) {
      throw new Meteor.Error('invalid_client', 'Client has no launch_uri configured');
    }

    const launchUrl = new URL(launchUri);
    launchUrl.searchParams.set('iss', fhirBaseUrl);
    launchUrl.searchParams.set('launch', launchToken);
    launchUrl.searchParams.set('patient', patientFhirId || patientId);

    if (imagingStudyId) {
      launchUrl.searchParams.set('imagingStudy', imagingStudyId);
    }
    if (gridfsFileId) {
      launchUrl.searchParams.set('gridfsFileId', gridfsFileId);
    }

    console.log('OAuth.createEhrLaunchContext - Launch URL:', launchUrl.toString());

    return {
      launchToken: launchToken,
      launchUrl: launchUrl.toString(),
      iss: fhirBaseUrl
    };
  },

  /**
   * OAuth.getPatientAuthorizations
   * Get all active OAuth authorizations for the current user's linked patient
   * Returns sanitized data (no tokens/secrets) for display in My Profile
   * ONC g(10) 9.3.01 - Patient access to authorized applications
   */
  'OAuth.getPatientAuthorizations': async function() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    // Get user's linked patient ID
    const user = await Meteor.users.findOneAsync({ _id: this.userId });
    const patientId = get(user, 'patientId');

    if (!patientId) {
      console.log('OAuth.getPatientAuthorizations - No linked patient for user:', this.userId);
      return [];
    }

    // Find all active authorizations for this patient
    const authorizations = await OAuthClients.find({
      patient_id: patientId,
      access_token: { $exists: true, $ne: null },
      revoked_at: { $exists: false }
    }).fetchAsync();

    console.log('OAuth.getPatientAuthorizations - Found', authorizations.length, 'authorizations for patient:', patientId);

    // Return sanitized data (no tokens/secrets)
    return authorizations.map(function(auth) {
      return {
        _id: auth._id,
        client_name: auth.client_name || auth.client_id,
        client_id: auth.client_id,
        authorized_at: auth.access_token_created_at || auth.created_at,
        expires_at: auth.authorization_expires_at,
        scope: auth.requested_scope || auth.scope,
        launch_type: auth.launch_type
      };
    });
  },

  /**
   * OAuth.revokePatientAuthorization
   * Revoke an OAuth authorization for the current user's linked patient
   * Verifies ownership before revocation
   * ONC g(10) 9.3.01 - Patient-initiated token revocation within 1 hour
   */
  'OAuth.revokePatientAuthorization': async function(authorizationId) {
    check(authorizationId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    // Get user's linked patient ID
    const user = await Meteor.users.findOneAsync({ _id: this.userId });
    const patientId = get(user, 'patientId');

    if (!patientId) {
      throw new Meteor.Error('no-patient-link', 'No patient record linked to your account');
    }

    // Find the authorization - use _id only (per CLAUDE.md anti-pattern guidance)
    const authorization = await OAuthClients.findOneAsync({ _id: authorizationId });

    if (!authorization) {
      throw new Meteor.Error('not-found', 'Authorization not found');
    }

    // Verify ownership - patient_id must match
    if (authorization.patient_id !== patientId) {
      console.error('OAuth.revokePatientAuthorization - Ownership mismatch. User patient:', patientId, 'Auth patient:', authorization.patient_id);
      throw new Meteor.Error('forbidden', 'You can only revoke your own authorizations');
    }

    // Revoke by clearing tokens and marking revocation time
    const result = await OAuthClients.updateAsync(
      { _id: authorizationId },
      {
        $set: {
          revoked_at: new Date(),
          revoked_by: this.userId
        },
        $unset: {
          access_token: '',
          refresh_token: '',
          authorization_code: ''
        }
      }
    );

    console.log('OAuth.revokePatientAuthorization - Revoked auth:', authorizationId, 'for patient:', patientId);

    return { success: true, revoked_at: new Date() };
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

