import { get, has } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { WebApp } from "meteor/webapp";

import moment from 'moment';

let fhirPath = get(Meteor, 'settings.private.fhir.fhirPath', 'baseR4');

import jwt from 'jsonwebtoken';

import forge from 'node-forge';
var pki = forge.pki;

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

const MetadataServerMethods = {
  getJwkSet: function(){
    console.log('getJwkSet()');
    
    // Check if we have JWK configuration in settings
    let jwkConfig = get(Meteor, 'settings.private.jwk');
    
    if (jwkConfig && jwkConfig.keys) {
      // If JWK keys are directly configured
      return {
        keys: jwkConfig.keys
      };
    }
    
    // Generate JWK from X.509 certificate if available
    let x509privateKeyRaw = get(Meteor, 'settings.private.x509.privateKey');
    let x509publicCertRaw = get(Meteor, 'settings.private.x509.publicCertPem');
    
    // Convert \r\n escape sequences to actual line breaks
    let x509privateKey = x509privateKeyRaw ? x509privateKeyRaw.replace(/\\r\\n/g, '\n') : '';
    let x509publicCert = x509publicCertRaw ? x509publicCertRaw.replace(/\\r\\n/g, '\n') : '';
    
    if (x509privateKey && x509publicCert) {
      try {
        // Parse the certificate - handle different line ending formats
        let certPem = x509publicCert
          .replace(/-----BEGIN CERTIFICATE-----/g, '')
          .replace(/-----END CERTIFICATE-----/g, '')
          .replace(/[\r\n]/g, '');
          
        let certDer = forge.util.decode64(certPem);
        let cert = pki.certificateFromAsn1(forge.asn1.fromDer(certDer));
        let publicKey = cert.publicKey;
        
        // Convert RSA public key components to base64url format
        // Get hex representation of modulus and exponent
        let nHex = publicKey.n.toString(16);
        let eHex = publicKey.e.toString(16);
        
        // Ensure even number of hex digits
        if (nHex.length % 2 !== 0) nHex = '0' + nHex;
        if (eHex.length % 2 !== 0) eHex = '0' + eHex;
        
        // Convert to base64url using Node.js Buffer
        let nBuffer = Buffer.from(nHex, 'hex');
        let eBuffer = Buffer.from(eHex, 'hex');
        
        // Base64url encode (base64 with URL-safe characters and no padding)
        let nBase64url = nBuffer.toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
          
        let eBase64url = eBuffer.toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
        
        let jwk = {
          kty: "RSA",
          use: "sig",
          kid: get(Meteor, 'settings.private.jwk.keyId', 'trialx-data-fetch-key-001'),
          alg: "RS384",
          n: nBase64url,
          e: eBase64url
        };
        
        return {
          keys: [jwk]
        };
      } catch (error) {
        console.error('Error converting certificate to JWK:', error);
      }
    }
    
    // Return empty key set if no keys available
    return {
      keys: []
    };
  },
  getCapabilityStatement: function(){
    console.log('getCapabilityStatement()');

    var CapabilityStatement = {
      "resourceType": "CapabilityStatement",
      "url": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.fhirPath'),
      "name": get(Meteor, 'settings.public.title'),
      "version": get(Meteor, 'settings.public.appVersion', "0.1.0"),
      "status": "draft",
      "experimental": true,
      "publisher": "Example Publisher", // QWERTY - Removed Publisher
      "kind": "capability",
      "date": new Date(),
      "contact": get(Meteor, 'settings.public.contact'),
      "software": {
        "version" : "6.1.0",
        "name" : "Vault Server",
        "releaseDate" : new Date()
      },
      "fhirVersion": get(Meteor, 'settings.public.fhirVersion', '4.0.1'),
      "format": [
        "json"
      ],
      "rest": [{
          "mode": "server",
          "resource": []
      }]
    };

    // let oAuthServerRunning = false;
    // if(oAuthServerRunning){
    //   CapabilityStatement.security = {
    //     "service": [],
    //   };
    // }


    if(get(Meteor, 'settings.private.fhir.disableSmartOnFhir') !== true){
      CapabilityStatement.rest[0].security = {
        "service": [],
        "extension": []
      };
      CapabilityStatement.rest[0].security.service.push({
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/restful-security-service",
            "code": "SMART-on-FHIR"
          }
        ],
        "text": "OAuth2 using SMART-on-FHIR profile (see http://docs.smarthealthit.org)"
      }, {
        "coding" : [
          {
            "system" : "http://fhir.udap.org/CodeSystem/capability-rest-security-service",
            "code" : "UDAP"
          }
        ],
        "text" : "OAuth 2 using UDAP profile (see http://www.udap.org)"
      })

      CapabilityStatement.rest[0].security.extension.push({
        "extension": [
          {
            "url": "token",
            "valueUri": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.tokenEndpoint', "oauth/token")
          },
          {
            "url": "authorize",
            "valueUri": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.authorizationEndpoint', "oauth/authorize")
          },
          {
            "url": "register",
            "valueUri": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.registrationEndpoint', "oauth/registration")
          },
          {
            "url": "manage",
            "valueUri": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.manageEndpoint', "authorizations/manage")
          },
          {
            "url": "introspect",
            "valueUri": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.introspectEndpoint', "authorizations/introspect")
          },
          {
            "url": "revoke",
            "valueUri": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.revokeEndpoint', "authorizations/revoke")
          }
        ],
        "url": "http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris"
      })
    }

    if (has(Meteor, 'settings.private.fhir.rest')) {
      Object.keys(Meteor.settings.private.fhir.rest).forEach(function(key){
        let newResourceStatement = {
          "type": key,
          "interaction": defaultInteractions,
          // "versioning": "no-version"
          // "readHistory": false,
          // "updateCreate": false,
          // "conditionalCreate": false,
          // "conditionalUpdate": false,
          // "conditionalDelete": "not-supported"
          // "searchParam": defaultSearchParams
        }

        if (Array.isArray(Meteor.settings.private.fhir.rest[key].operations)) {
          newResourceStatement.operation = [];
          Meteor.settings.private.fhir.rest[key].operations.forEach(function(op){
            newResourceStatement.operation.push(op);
          });
        }

        if (Array.isArray(Meteor.settings.private.fhir.rest[key].interactions)) {
          newResourceStatement.interaction = [];
          Meteor.settings.private.fhir.rest[key].interactions.forEach(function(item){
            newResourceStatement.interaction.push({
              "code": item
            })
            newResourceStatement.versioning = get(Meteor, 'settings.private.fhir.rest[' + key + '].versioning', "no-version")
          })
        }

        if (Array.isArray(Meteor.settings.private.fhir.rest[key].interactions)) {
          newResourceStatement.interaction = [];
          Meteor.settings.private.fhir.rest[key].interactions.forEach(function(item){
            newResourceStatement.interaction.push({
              "code": item
            })
            newResourceStatement.versioning = get(Meteor, 'settings.private.fhir.rest[' + key + '].versioning', "no-version")
          })
        }


        CapabilityStatement.rest[0].resource.push(newResourceStatement);
      })
    }

    if(get(Meteor, 'settings.private.fhir')){
      if (Array.isArray(Meteor.settings.private.fhir.systemOperations)) {
        CapabilityStatement.rest[0].operation = [];
        Meteor.settings.private.fhir.systemOperations.forEach(function(op){
          CapabilityStatement.rest[0].operation.push(op);
        });
      }
    }

    return CapabilityStatement;
  },
  getWellKnownSmartConfiguration: function(){
    let response = {
      "resourceType": "Basic",

      // required fields
      "authorization_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.authorizationEndpoint', "oauth/authorize"),
      "token_endpoint":  Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.tokenEndpoint', "oauth/token") ,
      "capabilities": [],

      // optional fields
      "scopes_supported": "",
      "response_types_supported": "",
      "management_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.revokeEndpoint', "authorizations/manage"),
      "introspection_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.revokeEndpoint', "authorizations/introspect"),
      "registration_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.registrationEndpoint', "oauth/registration"),
      "revocation_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.revokeEndpoint', "authorizations/revoke"),
      
      // JWK Set URL for Epic SMART v2
      "jwks_uri": Meteor.absoluteUrl() + ".well-known/jwks.json",

      // custom fields
      "message": "smart config!"
    }

    response.capabilities.push("http://localhost:3000/");

    return response;
  },
  getWellKnownUdapConfiguration: function(){
    let response = {
      "resourceType": "UdapMetadata",
      "x5c": [],
      "udap_versions_supported": ["1"],
      "udap_certifications_supported": [Meteor.absoluteUrl() + "udap/profiles/example-certification"],
      "udap_certifications_required": [Meteor.absoluteUrl() + "udap/profiles/example-certification"],
      "grant_types_supported": ["authorization_code", "refresh_token",  "client_credentials"],
      "scopes_supported": ["openid", "launch/patient"],
      "authz_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.authorization_endpoint', "oauth/authorize"),
      "authorization": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.authorization_endpoint', "oauth/authorize"),
      "authz": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.authorization_endpoint', "oauth/authorize"),
      "authorization_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.authorization_endpoint', "oauth/authorize"),
      "token": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.tokenEndpoint', "oauth/token"),
      "token_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.tokenEndpoint', "oauth/token"),
      "token_endpoint_auth_methods_supported": ["private_key_jwt"],
      "token_endpoint_auth_signing_alg_values_supported": ["RS256", "ES384"],
      "registration": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.registrationEndpoint', "oauth/registration"),
      "registration_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.registrationEndpoint', "oauth/registration"),
      "registration_endpoint_jwt_signing_alg_values_supported": ["RS256", "ES384"],
      "signed_metadata": null,
      "raw_metadata": {
        "iss": Meteor.absoluteUrl(),
        "sub": Meteor.absoluteUrl(),
        "exp": moment().unix(),
        "iat": moment().unix(),
        "jti": "random-value-" + Random.id(),
        "authorization_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.authorization_endpoint', "oauth/authorize"),
        "token_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.tokenEndpoint', "oauth/token"),
        "registration_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.registrationEndpoint', "oauth/registration")
      },
      "udap_profiles_supported": ["udap_authz", "udap_dcr"],
      "udap_authorization_extensions_supported": [],
      "udap_authorization_extensions_required": [],
      "signed_endpoints": []
    }

    let fhirRestEndpoints = get(Meteor, 'settings.private.fhir.rest');
    if(fhirRestEndpoints){
      Object.keys(fhirRestEndpoints).forEach(function(key){
        response.scopes_supported.push("system/" + key + ".read")
      })
    }

    let x509publicCert = get(Meteor, 'settings.private.x509.publicCertPem');
    console.log('x509publicCert', x509publicCert)
    response.x5c.push(x509publicCert)


    return response;
  }
}

Meteor.methods(MetadataServerMethods);


WebApp.handlers.get("/" + fhirPath + "/metadata", async (req, res) => {

    console.log('GET ' + fhirPath + '/metadata');

    res.setHeader('Content-type', 'application/json');
    res.setHeader("Access-Control-Allow-Origin", "*");

    let returnPayload = MetadataServerMethods.getCapabilityStatement()
    if(process.env.TRACE){
      console.log('return payload', returnPayload);
    }

  res.json(returnPayload);
});

WebApp.handlers.get("/metadata", async (req, res) => {

  console.log('GET /metadata');

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");

  let returnPayload = MetadataServerMethods.getCapabilityStatement()
  if(process.env.TRACE){
    console.log('return payload', returnPayload);
  }

res.json(returnPayload);
});


WebApp.handlers.get( "/.well-known/smart-configuration", async (req, res) => {

  console.log('GET ' +  "/.well-known/smart-configuration");

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");

  let returnPayload = MetadataServerMethods.getWellKnownSmartConfiguration()
  if(process.env.TRACE){
    console.log('return payload', returnPayload);
  }

  res.json(returnPayload);
});

WebApp.handlers.get("/" + fhirPath + "/.well-known/udap", async (req, res) => {

  console.log('GET /' +  fhirPath + "/.well-known/smart-udap");

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");

  let returnPayload = MetadataServerMethods.getWellKnownUdapConfiguration()
  if(process.env.TRACE){
    console.log('return payload', returnPayload);
  }

  res.json(returnPayload);
});

WebApp.handlers.get("/.well-known/udap", async (req, res) => {

  console.log("GET /.well-known/smart-udap");

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");

  let returnPayload = MetadataServerMethods.getWellKnownUdapConfiguration()
  if(process.env.TRACE){
    console.log('return payload', returnPayload);
  }

  res.json(returnPayload);
});

// JWK Set endpoint for Epic SMART v2
WebApp.handlers.get("/.well-known/jwks.json", async (req, res) => {

  console.log("GET /.well-known/jwks.json");

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");

  let returnPayload = MetadataServerMethods.getJwkSet()
  if(process.env.TRACE || process.env.DEBUG_OAUTH){
    console.log('JWK Set return payload:', JSON.stringify(returnPayload, null, 2));
  }

  res.json(returnPayload);
});

