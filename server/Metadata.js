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

// =============================================================================
// ProfileSet Discovery
// Discover ProfileSet exports from packages (similar to DynamicRoutes pattern)
// Supports multiple IGs: US Core, PACIO ADI, specialty profiles, etc.

let discoveredProfileSets = [];
Object.keys(Package).forEach(function(packageName){
  if(Package[packageName].ProfileSet){
    console.log('ProfileSet discovered from package:', packageName);
    discoveredProfileSets.push(Package[packageName].ProfileSet);
  }
});

// Helper: Get all profiles for a resource type across all ProfileSets
function getProfilesForResource(resourceType) {
  let profiles = [];
  discoveredProfileSets.forEach(function(profileSet){
    if(profileSet.profiles && profileSet.profiles[resourceType]){
      profiles = profiles.concat(profileSet.profiles[resourceType]);
    }
  });
  return profiles;
}

// =============================================================================

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

    // Generate JWK from X.509 certificate or private key
    let x509privateKeyRaw = get(Meteor, 'settings.private.x509.privateKey');
    let x509publicCertRaw = get(Meteor, 'settings.private.x509.publicCertPem');

    // Convert \r\n escape sequences to actual line breaks
    let x509privateKey = x509privateKeyRaw ? x509privateKeyRaw.replace(/\\r\\n/g, '\n').replace(/\r\n/g, '\n').replace(/\r/g, '\n') : '';
    let x509publicCert = x509publicCertRaw ? x509publicCertRaw.replace(/\\r\\n/g, '\n').replace(/\r\n/g, '\n').replace(/\r/g, '\n') : '';

    let publicKey = null;

    // Try to get public key from certificate first
    if (x509publicCert) {
      try {
        let certPem = x509publicCert
          .replace(/-----BEGIN CERTIFICATE-----/g, '')
          .replace(/-----END CERTIFICATE-----/g, '')
          .replace(/[\r\n]/g, '');

        let certDer = forge.util.decode64(certPem);
        let cert = pki.certificateFromAsn1(forge.asn1.fromDer(certDer));
        publicKey = cert.publicKey;
        console.log('getJwkSet: Extracted public key from certificate');
      } catch (certError) {
        console.error('Error parsing certificate:', certError.message);
      }
    }

    // If no public key from cert, try to derive from private key
    if (!publicKey && x509privateKey) {
      try {
        let privateKeyObj = pki.privateKeyFromPem(x509privateKey);
        // RSA private key contains the public key components (n and e)
        publicKey = {
          n: privateKeyObj.n,
          e: privateKeyObj.e
        };
        console.log('getJwkSet: Derived public key from private key');
      } catch (keyError) {
        console.error('Error parsing private key:', keyError.message);
      }
    }

    if (publicKey && publicKey.n && publicKey.e) {
      try {
        // Convert RSA public key components to base64url format
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
          kid: get(Meteor, 'settings.private.jwk.keyId', 'honeycomb-signing-key-001'),
          alg: "RS256",
          n: nBase64url,
          e: eBase64url
        };

        console.log('getJwkSet: Generated JWK successfully');
        return {
          keys: [jwk]
        };
      } catch (error) {
        console.error('Error converting to JWK:', error);
      }
    } else {
      console.warn('getJwkSet: No x509.privateKey or x509.publicCertPem configured in settings');
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
      "instantiates": [
        "http://hl7.org/fhir/uv/bulkdata/CapabilityStatement/bulk-data"
      ],
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

        // Add supportedProfile from all discovered ProfileSets (US Core, PACIO, etc.)
        let resourceProfiles = getProfilesForResource(key);
        if (resourceProfiles.length > 0) {
          newResourceStatement.supportedProfile = resourceProfiles;
        }

        // Add searchParam declarations for resources that support search
        // This is required for ONC (g)(10) certification test 12.50.01 (Screening and Assessments)
        if (key === 'Observation') {
          newResourceStatement.searchParam = [
            {
              "name": "patient",
              "type": "reference",
              "documentation": "The subject that the observation is about (if patient)"
            },
            {
              "name": "category",
              "type": "token",
              "documentation": "The classification of the type of observation"
            },
            {
              "name": "code",
              "type": "token",
              "documentation": "The code of the observation type"
            },
            {
              "name": "date",
              "type": "date",
              "documentation": "Obtained date/time. If the obtained element is a period, a date that falls in the period"
            },
            {
              "name": "status",
              "type": "token",
              "documentation": "The status of the observation"
            }
          ];
        } else if (key === 'Condition') {
          newResourceStatement.searchParam = [
            {
              "name": "patient",
              "type": "reference",
              "documentation": "Who has the condition?"
            },
            {
              "name": "category",
              "type": "token",
              "documentation": "The category of the condition"
            },
            {
              "name": "clinical-status",
              "type": "token",
              "documentation": "The clinical status of the condition"
            },
            {
              "name": "code",
              "type": "token",
              "documentation": "Code for the condition"
            },
            {
              "name": "onset-date",
              "type": "date",
              "documentation": "Date related onsets (dateTime and Period)"
            }
          ];
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

    // =============================================================================
    // BULK DATA EXPORT SUPPORT
    // =============================================================================
    // This section adds Group resource with $export operation to comply with:
    // - FHIR Bulk Data Access IG (http://hl7.org/fhir/uv/bulkdata/)
    // - ONC 21st Century Cures Act certification requirements (170.315(g)(10))
    //
    // OPEN QUESTIONS / TODO:
    // 1. Settings Configuration: Should bulk data be toggle-able via settings file?
    //    e.g., Meteor.settings.private.fhir.enableBulkData: true
    //
    // 2. Getting Started: Should this be documented in a Getting Started guide?
    //    Users need to understand Group/$export workflow.
    //
    // 3. Group Auto-Selection: Should we auto-select Group resource in UI?
    //    Or require explicit patient group membership management?
    //
    // 4. Additional Endpoints Required:
    //    - POST/GET Group/[id]/$export (kick off export)
    //    - GET [polling location] (check export status)
    //    - GET [file location] (download NDJSON files)
    //    - DELETE [polling location] (cancel export)
    //
    // 5. Dynamic Groups: Can we dynamically generate Groups like Provenance?
    //    e.g., virtual groups based on Condition, Location, Practitioner, etc.
    //    Similar pattern to how Provenance is auto-generated for audit trail.
    //
    // 6. Patient Export: Also support Patient/$export for all patients?
    //
    // Reference: http://hl7.org/fhir/uv/bulkdata/OperationDefinition/group-export
    // =============================================================================

    // Add Group resource with $export operation for Bulk Data IG compliance
    // Check if Group is already declared, if not add it
    let groupResourceExists = CapabilityStatement.rest[0].resource.some(function(r){
      return r.type === 'Group';
    });

    if (!groupResourceExists) {
      CapabilityStatement.rest[0].resource.push({
        "type": "Group",
        "interaction": [
          { "code": "read" },
          { "code": "search-type" }
        ],
        "versioning": "no-version",
        "operation": [
          {
            "name": "export",
            "definition": "http://hl7.org/fhir/uv/bulkdata/OperationDefinition/group-export"
          }
        ]
      });
    } else {
      // Group exists but may not have the $export operation - add it if missing
      let groupResource = CapabilityStatement.rest[0].resource.find(function(r){
        return r.type === 'Group';
      });
      if (!groupResource.operation) {
        groupResource.operation = [];
      }
      let hasExportOp = groupResource.operation.some(function(op){
        return op.name === 'export';
      });
      if (!hasExportOp) {
        groupResource.operation.push({
          "name": "export",
          "definition": "http://hl7.org/fhir/uv/bulkdata/OperationDefinition/group-export"
        });
      }
    }

    return CapabilityStatement;
  },
  getWellKnownSmartConfiguration: function(){
    console.log('getWellKnownSmartConfiguration()');

    return {
      // Required endpoints per 170.315(g)(10)
      // Issuer must match the FHIR base URL per SMART App Launch 2.0
      "issuer": Meteor.absoluteUrl() + fhirPath,
      "authorization_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.authorizationEndpoint', "oauth/authorize"),
      "token_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.tokenEndpoint', "oauth/token"),
      "jwks_uri": Meteor.absoluteUrl() + ".well-known/jwks.json",

      // Full g(10) required capabilities per AUT-PAT-25
      "capabilities": [
        "launch-ehr",
        "launch-standalone",
        "authorize-post",
        "client-public",
        "client-confidential-symmetric",
        "client-confidential-asymmetric",
        "sso-openid-connect",
        "context-banner",
        "context-style",
        "context-ehr-patient",
        "context-ehr-encounter",
        "context-standalone-patient",
        "permission-offline",
        "permission-patient",
        "permission-user",
        "permission-v1",
        "permission-v2"
      ],

      // Required grant types per 170.315(g)(10)
      "grant_types_supported": [
        "authorization_code",
        "client_credentials"
      ],

      // Required code challenge methods - S256 only, NO plain
      "code_challenge_methods_supported": [
        "S256"
      ],

      "response_types_supported": [
        "code"
      ],

      // Supported scopes
      "scopes_supported": [
        "openid",
        "fhirUser",
        "launch",
        "launch/patient",
        "launch/encounter",
        "offline_access",
        "patient/*.read",
        "patient/*.rs",
        "user/*.read",
        "user/*.rs",
        "system/*.read",
        "system/*.rs"
      ],

      // Optional but useful endpoints
      "management_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.manageEndpoint', "authorizations/manage"),
      "introspection_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.introspectEndpoint', "authorizations/introspect"),
      "registration_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.registrationEndpoint', "oauth/registration"),
      "revocation_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.revokeEndpoint', "authorizations/revoke")
    };
  },
  getWellKnownOpenIdConfiguration: function(){
    console.log('getWellKnownOpenIdConfiguration()');

    return {
      // Required per § 170.215(e)(1) and OpenID Connect Discovery 1.0
      "issuer": Meteor.absoluteUrl() + fhirPath,
      "authorization_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.authorizationEndpoint', "oauth/authorize"),
      "token_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.tokenEndpoint', "oauth/token"),
      "jwks_uri": Meteor.absoluteUrl() + ".well-known/jwks.json",

      // Required OpenID Connect claims
      "response_types_supported": ["code"],
      "subject_types_supported": ["public"],
      "id_token_signing_alg_values_supported": ["RS256"],

      // SMART on FHIR specific
      "scopes_supported": [
        "openid",
        "fhirUser",
        "profile",
        "launch",
        "launch/patient",
        "offline_access"
      ],

      // Token endpoint auth methods
      "token_endpoint_auth_methods_supported": [
        "client_secret_basic",
        "client_secret_post",
        "private_key_jwt"
      ],

      // Claims supported
      "claims_supported": [
        "sub",
        "iss",
        "fhirUser"
      ]
    };
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

// Also serve at FHIR base URL per SMART App Launch spec
WebApp.handlers.get("/" + fhirPath + "/.well-known/smart-configuration", async (req, res) => {

  console.log('GET /' + fhirPath + "/.well-known/smart-configuration");

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
// Available at both base route and FHIR path route
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

// Also expose at FHIR base path for spec compliance
WebApp.handlers.get("/" + fhirPath + "/.well-known/jwks.json", async (req, res) => {

  console.log("GET /" + fhirPath + "/.well-known/jwks.json");

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");

  let returnPayload = MetadataServerMethods.getJwkSet()
  if(process.env.TRACE || process.env.DEBUG_OAUTH){
    console.log('JWK Set return payload:', JSON.stringify(returnPayload, null, 2));
  }

  res.json(returnPayload);
});

// OpenID Connect Discovery endpoint per § 170.215(e)(1)
// Available at both base route and FHIR path route
WebApp.handlers.get("/.well-known/openid-configuration", async (req, res) => {

  console.log("GET /.well-known/openid-configuration");

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");

  let returnPayload = MetadataServerMethods.getWellKnownOpenIdConfiguration()
  if(process.env.TRACE){
    console.log('return payload', returnPayload);
  }

  res.json(returnPayload);
});

// Also expose at FHIR base path for spec compliance
WebApp.handlers.get("/" + fhirPath + "/.well-known/openid-configuration", async (req, res) => {

  console.log("GET /" + fhirPath + "/.well-known/openid-configuration");

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");

  let returnPayload = MetadataServerMethods.getWellKnownOpenIdConfiguration()
  if(process.env.TRACE){
    console.log('return payload', returnPayload);
  }

  res.json(returnPayload);
});

// SMART Style endpoint per SMART App Launch spec
// Returns styling information that apps can use to match EHR look-and-feel
// https://build.fhir.org/ig/HL7/smart-app-launch/scopes-and-launch-context.html#styling
function getSmartStyle() {
  return {
    color_background: "#edeae3",
    color_error: "#9e2d2d",
    color_highlight: "#69b5ce",
    color_modal_backdrop: "",
    color_success: "#498e49",
    color_text: "#303030",
    dim_border_radius: "6px",
    dim_font_size: "13px",
    dim_spacing_size: "20px",
    font_family_body: "Georgia, Times, 'Times New Roman', serif",
    font_family_heading: "'HelveticaNeue-Light', Helvetica, Arial, 'Lucida Grande', sans-serif"
  };
}

WebApp.handlers.get("/smart-style.json", async (req, res) => {

  console.log("GET /smart-style.json");

  res.setHeader('Content-Type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.status(200).json(getSmartStyle());
});

// Also expose at FHIR base path for spec compliance
WebApp.handlers.get("/" + fhirPath + "/smart-style.json", async (req, res) => {

  console.log("GET /" + fhirPath + "/smart-style.json");

  res.setHeader('Content-Type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.status(200).json(getSmartStyle());
});
