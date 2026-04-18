import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { WebApp } from "meteor/webapp";

import express from 'express';
import bodyParser from 'body-parser';
import querystring from 'querystring';


import RestHelpers from './RestHelpers.js';
import { SearchParametersEngine } from './SearchParametersEngine.js';

import { get, has, set, unset, cloneDeep, capitalize, findIndex, countBy } from 'lodash';
import moment from 'moment';

import { OAuthClients } from '../imports/collections/OAuthClients.js';
import OAuthServerConfig from './OAuthServer.js';



import jwt from 'jsonwebtoken';
import forge from 'node-forge';

import { Bundle } from '../imports/lib/schemas/SimpleSchemas/Bundles'

import { AllergyIntolerances } from '../imports/lib/schemas/SimpleSchemas/AllergyIntolerances';
import { AuditEvents } from '../imports/lib/schemas/SimpleSchemas/AuditEvents';
import { Bundles } from '../imports/lib/schemas/SimpleSchemas/Bundles';
import { CarePlans } from '../imports/lib/schemas/SimpleSchemas/CarePlans';
import { CareTeams } from '../imports/lib/schemas/SimpleSchemas/CareTeams';
import { CodeSystems } from '../imports/lib/schemas/SimpleSchemas/CodeSystems';
import { Communications } from '../imports/lib/schemas/SimpleSchemas/Communications';
import { CommunicationRequests } from '../imports/lib/schemas/SimpleSchemas/CommunicationRequests';
import { Compositions } from '../imports/lib/schemas/SimpleSchemas/Compositions';
import { Consents } from '../imports/lib/schemas/SimpleSchemas/Consents';
import { Conditions } from '../imports/lib/schemas/SimpleSchemas/Conditions';
import { Coverages } from '../imports/lib/schemas/SimpleSchemas/Coverages';
import { Devices } from '../imports/lib/schemas/SimpleSchemas/Devices';
import { DiagnosticReports } from '../imports/lib/schemas/SimpleSchemas/DiagnosticReports';
import { DocumentReferences } from '../imports/lib/schemas/SimpleSchemas/DocumentReferences';
import { Encounters } from '../imports/lib/schemas/SimpleSchemas/Encounters';
import { Endpoints } from '../imports/lib/schemas/SimpleSchemas/Endpoints';
import { Goals } from '../imports/lib/schemas/SimpleSchemas/Goals';
import { Groups } from '../imports/lib/schemas/SimpleSchemas/Groups';
import { HealthcareServices } from '../imports/lib/schemas/SimpleSchemas/HealthcareServices';
import { ImagingStudies } from '../imports/lib/schemas/SimpleSchemas/ImagingStudies';
import { Immunizations } from '../imports/lib/schemas/SimpleSchemas/Immunizations';
import { InsurancePlans } from '../imports/lib/schemas/SimpleSchemas/InsurancePlans';
import { Lists } from '../imports/lib/schemas/SimpleSchemas/Lists';
import { Locations } from '../imports/lib/schemas/SimpleSchemas/Locations';
import { Medications } from '../imports/lib/schemas/SimpleSchemas/Medications';
import { MedicationDispenses } from '../imports/lib/schemas/SimpleSchemas/MedicationDispenses';
import { MedicationOrders } from '../imports/lib/schemas/SimpleSchemas/MedicationOrders';
import { MedicationRequests } from '../imports/lib/schemas/SimpleSchemas/MedicationRequests';
import { Measures } from '../imports/lib/schemas/SimpleSchemas/Measures';
import { MeasureReports } from '../imports/lib/schemas/SimpleSchemas/MeasureReports';
import { Medias } from '../imports/lib/schemas/SimpleSchemas/Medias';
import { NutritionOrders } from '../imports/lib/schemas/SimpleSchemas/NutritionOrders';
import { NutritionIntakes } from '../imports/lib/schemas/SimpleSchemas/NutritionIntakes';
import { Networks } from '../imports/lib/schemas/SimpleSchemas/Networks';
import { Observations } from '../imports/lib/schemas/SimpleSchemas/Observations';
import { OrganizationAffiliations } from '../imports/lib/schemas/SimpleSchemas/OrganizationAffiliations';
import { Organizations } from '../imports/lib/schemas/SimpleSchemas/Organizations';
import { Patients } from '../imports/lib/schemas/SimpleSchemas/Patients';
import { Practitioners } from '../imports/lib/schemas/SimpleSchemas/Practitioners';
import { PractitionerRoles } from '../imports/lib/schemas/SimpleSchemas/PractitionerRoles';
import { Procedures } from '../imports/lib/schemas/SimpleSchemas/Procedures';
import { Provenances } from '../imports/lib/schemas/SimpleSchemas/Provenances';
import { Questionnaires } from '../imports/lib/schemas/SimpleSchemas/Questionnaires';
import { QuestionnaireResponses } from '../imports/lib/schemas/SimpleSchemas/QuestionnaireResponses';
import { Restrictions } from '../imports/lib/schemas/SimpleSchemas/Restrictions';
import { RelatedPersons } from '../imports/lib/schemas/SimpleSchemas/RelatedPersons';
import { RiskAssessments } from '../imports/lib/schemas/SimpleSchemas/RiskAssessments';
import { ResearchSubjects } from '../imports/lib/schemas/SimpleSchemas/ResearchSubjects';
import { ResearchStudies } from '../imports/lib/schemas/SimpleSchemas/ResearchStudies';
import { SearchParameters } from '../imports/lib/schemas/SimpleSchemas/SearchParameters';
import { ServiceRequests } from '../imports/lib/schemas/SimpleSchemas/ServiceRequests';
import { Specimens } from '../imports/lib/schemas/SimpleSchemas/Specimens';
import { StructureDefinitions } from '../imports/lib/schemas/SimpleSchemas/StructureDefinitions';
import { Subscriptions } from '../imports/lib/schemas/SimpleSchemas/Subscriptions';
import { Tasks } from '../imports/lib/schemas/SimpleSchemas/Tasks';
import { ValueSets } from '../imports/lib/schemas/SimpleSchemas/ValueSets';

import FhirUtilities from '../imports/lib/FhirUtilities.js';

//------------------------------------------------------------------------------------------
// Shared Auth Module (rate limiter, ACL, auth functions, granular scopes)
// Extracted to server/lib/FhirAuth.js so DicomEndpoints can share the same security pipeline

import {
  limiter,
  acl, initializeAccessControl, accessControlList, accessControlListsInitialized,
  getAuthorizedRole, parseUserAuthorization, isAuthorized, isResourceScopeAuthorized,
  parseGranularScope, getGranularFiltersForResource, resourceMatchesGranularFilter,
  codeableConceptMatchesValue, applyGranularScopeFilters
} from './lib/FhirAuth.js';

//------------------------------------------------------------------------------------------
// Accounts Subsystem 
// Access the Mongo database directly; 
// we want to fully integrate with @accountsjs
// and that means getting user sessions!

import mongoose from 'mongoose';
import { AccountsServer } from '@accounts/server';
import { Mongo } from '@accounts/mongo';


Meteor.startup(async function(){
  mongoose.connect(process.env.MONGO_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  });

  const db = mongoose.connection;
  let accountsMongo = new Mongo(db, {
    // options
  });

  let accountsServer = new AccountsServer(
    {
      db: accountsMongo,
      tokenSecret: get(Meteor, 'settings.private.accountServerTokenSecret', Random.secret())
    }
  );

  // wrapMeteorServer(Meteor, accountsServer);
});

// ACL, rate limiter, auth functions, and granular scopes are now imported from ./lib/FhirAuth.js
// (see import block above)

//------------------------------------------------------------------------------------------




// console.log("&&&&&&&&&&", OAuthClientComponents.OAuthClients)

// import { create } from 'ipfs-http-client';

// import * as IPFS from 'ipfs-core';
// import { AbortController } from "node-abort-controller";
// import { concat } from 'uint8arrays/concat';
// import { toString } from 'uint8arrays/to-string';

let defaultQuery = {};
let defaultOptions = {
    limit: get(Meteor, 'settings.private.fhir.publicationLimit', 1000)
}
if(get(Meteor, 'settings.private.accessControl.enableHttpAccessRestrictions')){
  defaultOptions.fields = {
      address: 0
  };
}

let ipfsNode;
if(process.env.ENABLE_IPFS){
  // connect to the default API
  ipfsNode = await IPFS.create({ host: 'localhost', port: '3005', protocol: 'http' })
  // ipfsNode = create({ host: 'localhost', port: '3005', protocol: 'http' });
  
  // ipfsNode = create();

  // console.log('ipfs.getEndpointConfig', ipfsNode.getEndpointConfig())
} 

//==========================================================================================
// Collections Namespace  

// These data cursors 

let Collections = {};

if(Meteor.isClient){
  Collections = window;
}
if(Meteor.isServer){
  Collections.AllergyIntolerances = AllergyIntolerances;
  Collections.AuditEvents = AuditEvents;
  Collections.Bundles = Bundles;
  Collections.CarePlans = CarePlans;
  Collections.CareTeams = CareTeams;
  Collections.CodeSystems = CodeSystems;
  Collections.Communications = Communications;
  Collections.CommunicationRequests = CommunicationRequests;
  Collections.Compositions = Compositions;
  Collections.Conditions = Conditions;
  Collections.Consents = Consents;
  Collections.Coverages = Coverages;
  Collections.Devices = Devices;
  Collections.DiagnosticReports = DiagnosticReports;
  Collections.DocumentReferences = DocumentReferences;
  Collections.Encounters = Encounters;
  Collections.Endpoints = Endpoints;
  Collections.Goals = Goals;
  Collections.Groups = Groups;
  Collections.HealthcareServices = HealthcareServices;
  Collections.ImagingStudies = ImagingStudies;
  Collections.Immunizations = Immunizations;
  Collections.InsurancePlans = InsurancePlans;
  Collections.Lists = Lists;
  Collections.Locations = Locations;
  Collections.Networks = Networks;
  Collections.NutritionIntakes = NutritionIntakes;
  Collections.NutritionOrders = NutritionOrders;
  Collections.Observations = Observations;
  Collections.Organizations = Organizations;
  Collections.OrganizationAffiliations = OrganizationAffiliations;
  Collections.OAuthClients = OAuthClients;
  Collections.Medications = Medications;
  Collections.MedicationDispenses = MedicationDispenses;
  Collections.MedicationOrders = MedicationOrders;
  Collections.MedicationRequests = MedicationRequests;
  Collections.Measures = Measures;
  Collections.MeasureReports = MeasureReports;
  Collections.Medias = Medias;
  Collections.Patients = Patients;
  Collections.Practitioners = Practitioners;
  Collections.PractitionerRoles = PractitionerRoles;
  Collections.Provenances = Provenances;
  Collections.Procedures = Procedures;
  Collections.Questionnaires = Questionnaires;
  Collections.QuestionnaireResponses = QuestionnaireResponses;
  Collections.Restrictions = Restrictions;
  Collections.RelatedPersons = RelatedPersons;
  Collections.RiskAssessments = RiskAssessments;
  Collections.ResearchSubjects = ResearchSubjects;
  Collections.ResearchStudies = ResearchStudies;
  Collections.SearchParameters = SearchParameters;
  Collections.ServiceRequests = ServiceRequests;
  Collections.Specimens = Specimens;
  Collections.StructureDefinitions = StructureDefinitions;
  Collections.Subscriptions = Subscriptions;
  Collections.Tasks = Tasks;
  Collections.ValueSets = ValueSets;
  // Collections.VerificationResults = VerificationResults;
}

//==========================================================================================
// _include Field Mappings
// Maps FHIR _include search parameter names to actual field paths in resources
// Format: { ResourceType: { searchParamName: 'fieldPath' } }
// Example: MedicationRequest:medication -> medicationReference field

const includeFieldMappings = {
  'MedicationRequest': {
    'medication': 'medicationReference'
  }
};


//==========================================================================================
// Middleware


let fhirPath = get(Meteor, 'settings.private.fhir.fhirPath', 'baseR4');
let fhirVersion = get(Meteor, 'settings.private.fhir.fhirVersion', 'R4');
let containerAccessTokenOverride = get(Meteor, 'settings.private.fhir.accessToken', false);

// if(typeof OAuthServerConfig === 'object'){
//   // TODO:  double check that this is needed; and that the /api/ route is correct
//   JsonRoutes.Middleware.use(
//     // '/api/*',
//     '/baseR4/*',
//     OAuthServerConfig.oauthserver.authorise()   // OAUTH FLOW - A7.1
//   );
// } else {
//   console.log("No OAuthServerConfig found.")
// }

// WebApp.handlers.use(express.json());
// WebApp.handlers.use(OAuthServerConfig.oauthserver.authorise());

// WebApp.handlers.use(
//   '/baseR4/*', 
//   express.json()
// );

// WebApp.handlers.use(
//   '/oauth/getIdentity',
//   OAuthServerConfig.oauthserver.authorize()
// );
//==========================================================================================
// Helper Methods
// NOTE: getAuthorizedRole, parseUserAuthorization, isAuthorized, isResourceScopeAuthorized,
// and all granular scope functions are now imported from ./lib/FhirAuth.js


async function logToInboundQueue(request){
  process.env.DEBUG && console.log('request.query', request.query)
  process.env.DEBUG && console.log('request.params', request.params)
  process.env.DEBUG && console.log('request.headers', request.headers)

  if(get(Meteor, 'settings.private.fhir.inboundQueue') === true){
    process.env.EXHAUSTIVE && console.log('Inbound request', request)
    if(typeof InboundRequests === "object"){
      await InboundRequests.insertAsync({
        date: new Date(),
        method: get(request, 'method'),
        url: get(request, 'url'),
        body: get(request, 'body'),
        originalUrl: get(request, 'originalUrl'),
        headers: get(request, 'headers')
      });
    }
  }

  return request;
}
async function signProvenance(record){
  let publicKey = get(Meteor, 'settings.private.x509.publicKey');
  let privateKey = get(Meteor, 'settings.private.x509.privateKey');

  if(record){
    delete record._document;
    delete record._id;
  
    process.env.DEBUG && console.log('signProvenance', record)  
  }

  if(privateKey){
    var token = jwt.sign(JSON.stringify(record), privateKey, { algorithm: 'RS256'})

    let provenanceRecord = {
      resourceType: "Provenance",                  
      target: [],
      recorded: new Date(),
      signature: [{
        type: [{
          system: 'urn:iso-astm:E1762-95:2013',
          code: '1.2.840.10065.1.12.1.14',
          display: 'Source Signature'
        }],
        when: new Date(),
        who: {
          display: 'National Directory'
        },
        data: token
      }]
    }
  
    if(Array.isArray(record)){
      record.forEach(function(rec){
        provenanceRecord.target.push({
          display: get(rec, 'name', ''),
          reference: get(rec, 'id'),
          type: get(rec, 'resourceType'),
        });  
      })
    } else {
      provenanceRecord.target.push({
        display: get(record, 'name', ''),
        reference: get(record, 'id'),
        type: get(record, 'resourceType'),
      });  
    }
    
    if(get(Meteor, 'settings.private.fhir.generateProvenanceIndex')){
      await Provenances.insertAsync(provenanceRecord);
    }
  
    return JSON.stringify(provenanceRecord)
  
  } else {
    return null;
  }
}





//==========================================================================================
// Route Manifest

// Configure body-parser middleware for FHIR endpoints
// This needs to be registered before routes are defined
// Using verify callback to preserve raw body for debugging

// Add text body parser for plain text requests
// Note: form-urlencoded should be handled by bodyParser.urlencoded() below
WebApp.handlers.use(bodyParser.text({
  limit: '50mb',
  type: ['text/plain'],
  verify: function(req, res, buf) {
    req.rawBody = buf.toString();
  }
}));

WebApp.handlers.use(bodyParser.json({
  limit: '50mb',
  type: ['application/json', 'application/fhir+json'],
  verify: function(req, res, buf) {
    req.rawBody = buf.toString();
  }
}));
WebApp.handlers.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true,
  verify: function(req, res, buf) {
    req.rawBody = buf.toString();
  }
}));

WebApp.handlers.post("/" + fhirPath + "/ping", async (req, res) => {

  console.log("POST /" + fhirPath + "ping");

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS");

  const gotToken = limiter.tryRemoveTokens(1);
  if (!gotToken) {
    res.status(429).json({message: "Too Many Requests - your IP is being rate limited'"});
  } else {
    let returnPayload = {
      code: 200,
      data: "PONG!!!"
    }
    if(process.env.TRACE){
      console.log('return payload', returnPayload);
    }
    res.json(returnPayload);
  }
});


//==========================================================================================
// Route Manifest  

// If no settings file is provided, we will default to a Public Health Server with no PHI
let serverRouteManifest = get(Meteor, 'settings.private.fhir.rest', {
  "MeasureReport": {
    "interactions": ["read", "create", "update", "delete"]
  },
  "Measure": {
    "interactions": ["read", "create", "update", "delete"]
  },
  "Location": {
    "interactions": ["read", "create", "update", "delete"],
    "search": true
  },
  "Organization": {
    "interactions": ["read", "create", "update", "delete"]
  }
});


// checking if we're in strict validation mode, or if we're promiscuous  
let schemaValidationConfig = get(Meteor, 'settings.private.fhir.schemaValidation', {});

if(typeof serverRouteManifest === "object"){
  console.log('==========================================================================================');
  console.log('Initializing FHIR Server.');
  Object.keys(serverRouteManifest).forEach(async function(routeResourceType){

    let collectionName = FhirUtilities.pluralizeResourceName(routeResourceType);
    console.log('Setting up routes for the ' + collectionName + ' collection.');

    // console.log('FhirServer is initializing search parameters...')
    SearchParameters.find({'base': routeResourceType}).forEach(function(parameter){
      console.log('  SearchParameter: ' + get(parameter, 'id'))
    })

    if(Array.isArray(serverRouteManifest[routeResourceType].interactions)){
      
      // vread 
      // https://www.hl7.org/fhir/http.html#vread
      if(serverRouteManifest[routeResourceType].interactions.includes('vread')){
        

        WebApp.handlers.get("/" + fhirPath + "/" + routeResourceType + "/:id/_history/:versionId", async (req, res) => {
          if(get(Meteor, 'settings.private.debug') === true) { console.log('> GET /' + fhirPath + '/' + routeResourceType + '/' + req.params.id + '/_history/' + + req.params.versionId); }
  
          logToInboundQueue(req);

          res.setHeader("content-type", 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);

          const gotToken = limiter.tryRemoveTokens(1);
          if (!gotToken) {
            res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"});
          } else {
            let authorizationContext = await parseUserAuthorization(req)
            if (await isAuthorized(authorizationContext)){
              if(get(Meteor, 'settings.private.debug') === true) { console.log('Security checks completed'); }
  
              process.env.DEBUG && console.log('req.query', req.query)
              process.env.DEBUG && console.log('req.params', req.params)
  
              let record = await Collections[collectionName].findOneAsync({
                'id': get(req, 'params.id'), 
                'meta.versionId': get(req, 'params.versionId')
              });            
              if(get(Meteor, 'settings.private.trace') === true) { console.log('record', record); }
              
              res.setHeader("Last-Modified", moment(get(record, 'meta.lastUpdated')).toDate());
              
              if(record){
                // Success
                res.status(200).json(RestHelpers.prepForFhirTransfer(record));
              } else {
                // Success
                res.status(404).json();

              }
            }
          }   
        });


      } else {
        WebApp.handlers.get("/" + fhirPath + "/" + routeResourceType + "/:id/_history/:versionId", async (req, res) => {
          res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);
          
          const gotToken = limiter.tryRemoveTokens(1);
          if (!gotToken) {
            res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"});
          } else {
            res.status(501).json();
          }
        });

      }

      // read
      // https://www.hl7.org/fhir/http.html#read
      if(serverRouteManifest[routeResourceType].interactions.includes('read')){
        // read 
        WebApp.handlers.get("/" + fhirPath + "/" + routeResourceType + "/:id", async (req, res) => {
          if(get(Meteor, 'settings.private.debug') === true) { console.log('GET /' + fhirPath + '/' + routeResourceType + '/' + req.params.id); }
  
          logToInboundQueue(req);

          res.setHeader("content-type", 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);

          const gotToken = limiter.tryRemoveTokens(1);
          if (!gotToken) {
            res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"});
          } else {
            // is this person authorized?
            let authorizationContext = await parseUserAuthorization(req)
            if (await isAuthorized(authorizationContext)){
              if(get(Meteor, 'settings.private.debug') === true) { console.log('Security checks completed'); }

              // ONC g(10) DAT-PAT-9: Check if resource type is in authorized scopes
              if (!isResourceScopeAuthorized(authorizationContext, routeResourceType)) {
                res.setHeader("content-type", 'application/fhir+json;charset=utf-8');
                res.status(403).json({
                  resourceType: "OperationOutcome",
                  issue: [{
                    severity: "error",
                    code: "forbidden",
                    diagnostics: `Access to ${routeResourceType} is not authorized by the granted scopes`
                  }]
                });
                return;
              }

              // the person is authorized and known; but do they have permission to access?
              let userRole = get(authorizationContext, 'role', 'PAT');

              // TODO:  if logged in, user role becomes 'healthcare provider' etc.

              let records;
              let lastModified = moment().subtract(100, 'years');
              let hasVersionedLastModified = false;

              process.env.DEBUG && console.log('req.query', req.query)
              process.env.DEBUG && console.log('req.params', req.params)

              // AUTHENTICATION NEEDED:  BULK DATA ACCESS
              if((req.params.id === "$export") && (authorizationContextToExport)){

                console.log(collectionName + " records: " + await Collections[collectionName].find().countAsync());
                
                if(["json", "application/json", "application/fhir+json", "bundle", "Bundle"].includes(get(req, 'query._outputFormat'))){
                  let jsonPayload = [];

                  await Collections[collectionName].find(defaultQuery, defaultOptions).forEach(function(record){

                    // check for security labels; otherwise assume normal access patterns
                    let recordSecurityLevel = get(record, 'meta.security[0].display', 'normal');
                    let accessGranted = false;
                    let permission;
    
                    if (get(Meteor, 'settings.private.fhir.disableAccessControl') === true) {
                      accessGranted = true;
                    } else {
                      permission = acl.can(userRole).execute('access').with({'securityLevel': recordSecurityLevel}).sync().on(routeResourceType);
                      console.log('permission.granted: ' + permission.granted);
    
                      accessGranted = permission.granted;
                    }
    

                    if(accessGranted){
                      jsonPayload.push({
                        fullUrl: routeResourceType + '/' + get(record, 'id'),
                        resource: RestHelpers.prepForFhirTransfer(record)
                      });  
                    } 
                  });
    
                  process.env.DEBUG && console.log('jsonPayload', jsonPayload);

                  res.setHeader('Content-disposition', 'attachment; filename=' + collectionName + ".fhir");
                  res.setHeader("x-provenance", signProvenance(jsonPayload));

                  // Success
                  res.status(200).json(Bundle.generate(jsonPayload));
                  
                } else {

                  // BULK DATA EXPORT 
                  // what are security access patterns for bulk data?  

                  let ndJsonPayload = "[";

                  res.setHeader("content-type", 'application/ndjson');
                  res.setHeader('Content-disposition', 'attachment; filename=' + collectionName + ".ndjson");
                  
                  await Collections[collectionName].find().forEach(function(record, index){
                    res.write( JSON.stringify(RestHelpers.prepForFhirTransfer(record)) + "\n" );                  
                  });  

                  // Success
                  res.status(202).json(Bundle.generate(jsonPayload));
                }
              } else {

                // not exporting; just a regular read

                records = await Collections[collectionName].find({id: req.params.id}, defaultOptions).fetch();

                // plain ol regular approach
                if(get(Meteor, 'settings.private.debug') === true) { console.log('records', records); }

                // ONC g(10): Apply granular scope filtering for reads
                // If the client has granular scopes (e.g., patient/Condition.rs?category=encounter-diagnosis),
                // the read should fail if the resource doesn't match the allowed categories
                const granularFilters = getGranularFiltersForResource(authorizationContext, routeResourceType);
                if (granularFilters.length > 0 && records.length > 0) {
                  console.log('[GranularScope] Checking read access for', routeResourceType, 'with', granularFilters.length, 'filters');
                  records = applyGranularScopeFilters(records, granularFilters);
                  if (records.length === 0) {
                    console.log('[GranularScope] Read denied - resource does not match granular scope filters');
                    res.status(403).json({
                      resourceType: "OperationOutcome",
                      issue: [{
                        severity: "error",
                        code: "forbidden",
                        diagnostics: `Access to this ${routeResourceType} resource is not authorized by the granted granular scopes`
                      }]
                    });
                    return;
                  }
                }

                // could we find it?
                if(Array.isArray(records)){
                  if(records.length === 0){
                    // Special handling for Provenance: generate on-demand if ID matches pattern
                    if(collectionName === "Provenances" && req.params.id && req.params.id.startsWith("provenance-")){
                      // Extract the target resource ID from the Provenance ID
                      let targetResourceId = req.params.id.replace("provenance-", "");
                      console.log("Provenance read: generating on-demand for target ID:", targetResourceId);

                      // Try to find the target resource in any collection
                      let targetResource = null;
                      let targetResourceType = null;

                      // Search through patient-accessible collections for the target resource
                      const searchCollections = ['Patients', 'Observations', 'Conditions', 'Procedures',
                        'Encounters', 'MedicationRequests', 'Immunizations', 'DiagnosticReports',
                        'DocumentReferences', 'CarePlans', 'CareTeams', 'Goals', 'AllergyIntolerances',
                        'Devices', 'ServiceRequests', 'Coverages', 'MedicationDispenses', 'Specimens'];

                      for(let searchCollName of searchCollections){
                        if(Collections[searchCollName]){
                          let found = await Collections[searchCollName].findOneAsync({id: targetResourceId});
                          if(found){
                            targetResource = found;
                            targetResourceType = searchCollName.replace(/s$/, ''); // Remove trailing 's'
                            // Handle special plurals
                            if(searchCollName === 'Coverages') targetResourceType = 'Coverage';
                            if(searchCollName === 'Allergies') targetResourceType = 'AllergyIntolerance';
                            break;
                          }
                        }
                      }

                      if(targetResource){
                        // Find an Organization to reference in Provenance agent
                        // Try to find one with US Core profile for best compatibility
                        let provenanceOrg = await Organizations.findOneAsync({
                          'meta.profile': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-organization'
                        });
                        // Fall back to any Organization if no US Core profile found
                        if(!provenanceOrg){
                          provenanceOrg = await Organizations.findOneAsync({});
                        }

                        let orgReference = provenanceOrg ? {
                          reference: "Organization/" + get(provenanceOrg, 'id'),
                          display: get(provenanceOrg, 'name', get(Meteor, 'settings.public.title', 'Honeycomb EHR'))
                        } : {
                          display: get(Meteor, 'settings.public.title', 'Honeycomb EHR')
                        };

                        // Generate the Provenance dynamically
                        let provenance = {
                          resourceType: "Provenance",
                          id: req.params.id,
                          meta: {
                            profile: ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-provenance"],
                            lastUpdated: get(targetResource, 'meta.lastUpdated') || new Date().toISOString()
                          },
                          target: [{
                            reference: targetResourceType + "/" + targetResourceId
                          }],
                          recorded: get(targetResource, 'meta.lastUpdated') || new Date().toISOString(),
                          agent: [
                            {
                              type: {
                                coding: [{
                                  system: "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
                                  code: "author",
                                  display: "Author"
                                }]
                              },
                              who: orgReference,
                              onBehalfOf: orgReference
                            },
                            {
                              type: {
                                coding: [{
                                  system: "http://hl7.org/fhir/us/core/CodeSystem/us-core-provenance-participant-type",
                                  code: "transmitter",
                                  display: "Transmitter"
                                }]
                              },
                              who: orgReference,
                              onBehalfOf: orgReference
                            }
                          ]
                        };

                        res.setHeader("Content-type", 'application/fhir+json');
                        res.setHeader("Last-Modified", get(targetResource, 'meta.lastUpdated') || new Date().toISOString());
                        res.status(200).json(RestHelpers.prepForFhirTransfer(provenance));
                        return;
                      }
                    }

                    // no content
                    res.status(204).json()
                  } else if (records.length === 1){
                    res.setHeader("Content-type", 'application/fhir+json');
                    res.setHeader("Last-Modified", lastModified);
                    res.setHeader("x-provenance", signProvenance(records[0]));

                    // check for security labels; otherwise assume normal access patterns
                    let recordSecurityLevel = get(records[0], 'meta.security[0].display', 'normal');
                    let accessGranted = false;
                    let permission;
    
                    if (get(Meteor, 'settings.private.fhir.disableAccessControl') === true) {
                      accessGranted = true;
                    } else {
                      console.log('DEBUG - Checking ACL permissions:');
                      console.log('  userRole:', userRole);
                      console.log('  userRole type:', typeof userRole);
                      console.log('  recordSecurityLevel:', recordSecurityLevel);
                      console.log('  routeResourceType:', routeResourceType);
                      console.log('  accessControlList length:', accessControlList.length);
                      
                      try {
                        // Check if role exists first
                        const roles = acl.getRoles();
                        console.log('Available roles:', roles);
                        console.log('Checking if role exists:', roles.includes(userRole));
                        
                        if(roles.includes(userRole)) {
                          permission = acl.can(userRole).execute('access').sync().on(routeResourceType);
                          accessGranted = permission.granted;
                          console.log('Permission check details:');
                          console.log('  - Role:', userRole);
                          console.log('  - Action:', 'access');
                          console.log('  - Resource:', routeResourceType);
                          console.log('  - Permission object:', permission);
                          console.log('  - Granted:', permission.granted);
                          console.log('  - Attributes:', permission.attributes);
                          
                          // Let's also check what permissions this role has
                          const roleGrants = acl.getGrants();
                          console.log('All grants:', JSON.stringify(roleGrants, null, 2));
                        } else {
                          console.log('Role not found in ACL, defaulting to denied');
                          accessGranted = false;
                        }
                      } catch (error) {
                        console.error('ACL Error:', error.message);
                        console.error('ACL Error Stack:', error.stack);
                        accessGranted = false;
                      }
                    }
    
                    console.log('accessGranted: ' + accessGranted);
                    if(accessGranted){
                      res.status(200).json(RestHelpers.prepForFhirTransfer(records[0]));
                    } else {
                      res.status(403).json();
                    }
                  } else if (records.length > 1){
                    // Success
                    res.setHeader("Content-type", 'application/fhir+json');

                    let mostRecentRecord;

                    // TODO: verify the correctness of the following logic
                    // Handle ID collision case: multiple records with same FHIR id but different _id
                    // This can happen when Synthea data (where _id = id) coexists with
                    // app-created records (where _id is ObjectId). Per CLAUDE.md anti-pattern docs,
                    // this is a data integrity issue that should be fixed, but we handle gracefully here.
                    // Log warning and use first record as fallback if versioning is not enabled.
                    if(get(Meteor, 'settings.private.fhir.rest.' + routeResourceType + '.versioning') !== "versioned"){
                      console.warn('[FhirEndpoints] WARNING: Found ' + records.length + ' records with same FHIR id "' + req.params.id + '" but versioning is not enabled for ' + routeResourceType + '. This may indicate ID collision. Using first record.');
                      mostRecentRecord = records[0];
                    }

                    if(get(Meteor, 'settings.private.fhir.rest.' + routeResourceType + '.versioning') === "versioned"){

                      if(get(Meteor, 'settings.private.trace') === true) { console.log('records', records); }

                      // and generate a Bundle payload
                      payload = [];

                      // loop through each matching version
                      records.forEach(function(recordVersion){
                        console.log('recordVersion', recordVersion)

                        // look for a meta.versionId that is equal to the number of records
                        // this should be the most-recent record
                        // NOTE:  this algorithm breaks if we ever delete a version from history
                        if(parseInt(get(recordVersion, 'meta.versionId')) === records.length){
                            mostRecentRecord = recordVersion;

                            if(get(recordVersion, 'meta.lastUpdated')){
                              hasVersionedLastModified = true;
                              if(moment(get(recordVersion, 'meta.lastUpdated')) > moment(lastModified)){
                                lastModified = moment(get(recordVersion, 'meta.lastUpdated')).toDate();
                              }
                            } 
                        }                       
                      });  
                      
                      if(hasVersionedLastModified){
                        res.setHeader("Last-Modified", lastModified);
                      }
                    }

                    // check for security labels on the most recent record
                    let recordSecurityLevel = get(mostRecentRecord, 'meta.security[0].display', 'normal');
                    let accessGranted = false;
                    let permission;
    
                    if (get(Meteor, 'settings.private.fhir.disableAccessControl') === true) {
                      accessGranted = true;
                    } else {
                      // TODO: verify the correctness of the following logic
                      // Wrap ACL check in try/catch to prevent 500 errors when role doesn't exist
                      // This mirrors the error handling pattern used in the single-record case above
                      try {
                        const roles = acl.getRoles();
                        if (roles.includes(userRole)) {
                          permission = acl.can(userRole).execute('access').with({'securityLevel': recordSecurityLevel}).sync().on(routeResourceType);
                          console.log('permission.granted: ' + permission.granted);
                          accessGranted = permission.granted;
                        } else {
                          console.log('Role not found in ACL:', userRole, '- defaulting to denied (versioned read)');
                          accessGranted = false;
                        }
                      } catch (aclError) {
                        console.error('ACL Error at versioned read:', aclError.message);
                        accessGranted = false;
                      }
                    }

                    if(accessGranted){
                      res.setHeader("x-provenance", signProvenance(mostRecentRecord));
                      res.status(200).json(RestHelpers.prepForFhirTransfer(mostRecentRecord));
                    } else {
                      res.status(403).json();
                    }
                  }
                  
                } else {
                  // search didn't find an error; something is broken
                  // Not Found
                  res.status(404).json();
                }
              }
      
            } else {

              // Unauthorized
              res.status(401).json();
            }
          }
        });



        // Search Interaction
        WebApp.handlers.get("/" + fhirPath + "/" + routeResourceType, async (req, res) => {
          if(get(Meteor, 'settings.private.debug') === true) { console.log('-------------------------------------------------------'); }
          if(get(Meteor, 'settings.private.debug') === true) { console.log('>> GET ' + fhirPath + "/" + routeResourceType, req.query); }

          if(get(Meteor, 'settings.private.debug') === true) { 
            console.log('Resource Type: ' + routeResourceType);               
          }

          const gotToken = limiter.tryRemoveTokens(1);
          if (!gotToken) {
            res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"});
          } else {

            let mongoQuery = {}
            let chainedIds;

            // first scan the query for any chained queries
            process.env.DEBUG && console.log('--------------------------------------')
            process.env.DEBUG && console.log('Checking for chained queries (GET)....')
            process.env.DEBUG && console.log('req.query', req.query);

            Object.keys(req.query).forEach(async function(key){
              let queryParts = key.split(".");
              if(Array.isArray(queryParts)){
                let isChained = false;
                process.env.TRACE && console.log("queryParts.length", queryParts.length);
                if(queryParts.length === 2){
                  isChained = true;
                  let newQueryUrl = "";
                  // console.log('queryParts[0]', queryParts[0])
                  let softTarget = capitalize(queryParts[0]);
                  if(queryParts[0] === "providedBy"){
                    softTarget = "Organization";
                  } 
                  let chainedCollectionName = FhirUtilities.pluralizeResourceName(softTarget)
                  newQueryUrl = softTarget + "?" + queryParts[1] + "=" + req.query[key]
                  process.env.DEBUG && console.log('newQueryUrl', newQueryUrl);

                  // look up search parameter for chained query
                  let chainQuery = {code: queryParts[1], target: softTarget};
                  console.log('chainQuery', chainQuery);

                  let chainedSearchParams = await SearchParameters.findOneAsync(chainQuery);
                  if(chainedSearchParams){
                    if(chainedSearchParams){
                      process.env.DEBUG && console.log('chainedSearchParams.expression', chainedSearchParams.expression)
                      process.env.DEBUG && console.log('chainedSearchParams.xpath', chainedSearchParams.xpath)
                      process.env.DEBUG && console.log('chainedCollectionName', chainedCollectionName)
                    }
    
                    if(Collections[chainedCollectionName]){
                      let chainedQuery = {};
                      chainedQuery[chainedSearchParams.xpath] = req.query[key]
                      process.env.DEBUG && console.log('chainedQuery', chainedQuery)
                      
                      // map the ids of any records that are found into an array
                      chainedIds = await Collections[chainedCollectionName].find(chainedQuery).map(function(record){
                        return softTarget + "/" + record.id;
                      })
    
                      // the create the JOIN equivalent by matching the chain reference 
                      // to any of the ids included in the array
                      mongoQuery[queryParts[0] + ".reference"] = {$in: chainedIds}
                    }
    
                  }
                }
              }
            })

            process.env.TRACE && console.log('chainedIds', chainedIds);

            // now search through the query for regular run-of-the-mill queries
            // Use SearchParametersEngine if enabled (default), otherwise fallback to MongoDB
            console.log('========== SearchParametersEngine State ==========');
            console.log('Engine enabled:', SearchParametersEngine.isEnabled());
            console.log('Engine compiled:', SearchParametersEngine.isCompiled());
            console.log('Resource type:', routeResourceType);
            console.log('Params for this resource:', JSON.stringify(SearchParametersEngine.getParamsForResource(routeResourceType)));
            console.log('=================================================');

            if (SearchParametersEngine.isEnabled() && SearchParametersEngine.isCompiled()) {
              // ENGINE-BASED QUERY BUILDING (default)
              process.env.DEBUG && console.log('[FhirEndpoints] Using SearchParametersEngine for query building');

              Object.keys(req.query).forEach(function(queryKey) {
                // Skip special FHIR parameters (handled separately)
                if (queryKey.startsWith('_')) return;

                // Skip empty values
                const queryValue = req.query[queryKey];
                if (!queryValue || queryValue === '') {
                  let fieldExistsQuery = {};
                  fieldExistsQuery[queryKey] = {$exists: true};
                  Object.assign(mongoQuery, fieldExistsQuery);
                  return;
                }

                // Build query using engine
                const newQueryPart = SearchParametersEngine.buildMongoQuery(routeResourceType, queryKey, queryValue);
                console.log('[FhirEndpoints] Query for ' + queryKey + '=' + queryValue + ' →', JSON.stringify(newQueryPart));

                if (newQueryPart) {
                  process.env.DEBUG && console.log('[FhirEndpoints] Engine built query for ' + queryKey + ':', JSON.stringify(newQueryPart));

                  // Smart query combination: properly combine $or clauses with $and
                  if (mongoQuery.$or && newQueryPart.$or) {
                    if (!mongoQuery.$and) {
                      mongoQuery.$and = [{ $or: mongoQuery.$or }];
                      delete mongoQuery.$or;
                    }
                    mongoQuery.$and.push({ $or: newQueryPart.$or });
                    process.env.DEBUG && console.log('Combined two $or clauses with $and');
                  } else if (newQueryPart.$or && Object.keys(mongoQuery).length > 0) {
                    let existingConditions = { ...mongoQuery };
                    Object.keys(existingConditions).forEach(function(k) { delete mongoQuery[k]; });
                    mongoQuery.$and = [existingConditions, { $or: newQueryPart.$or }];
                    process.env.DEBUG && console.log('Wrapped existing conditions with new $or in $and');
                  } else if (mongoQuery.$or && Object.keys(newQueryPart).length > 0 && !newQueryPart.$or) {
                    let existingOr = mongoQuery.$or;
                    delete mongoQuery.$or;
                    mongoQuery.$and = [{ $or: existingOr }, newQueryPart];
                    process.env.DEBUG && console.log('Wrapped existing $or with new conditions in $and');
                  } else {
                    Object.assign(mongoQuery, newQueryPart);
                  }
                } else {
                  process.env.DEBUG && console.log('[FhirEndpoints] No engine param for ' + routeResourceType + '.' + queryKey);
                }
              });

              console.log('========== FINAL ENGINE QUERY ==========');
              console.log('SearchParametersEngine::mongoQuery', JSON.stringify(mongoQuery, null, 2));
              console.log('=========================================');

            } else {
              // FALLBACK: MongoDB-based lookup (when DISABLE_SP_ENGINE=true or engine not compiled)
              console.warn('[FhirEndpoints] Using MongoDB fallback for SearchParameters (engine disabled or not compiled)');

              const searchParametersList = await SearchParameters.find({base: routeResourceType}).fetchAsync();
              searchParametersList.forEach(function(searchParameter){
                process.env.DEBUG && console.log('------------------------------------------------------')
                process.env.DEBUG && console.log('SearchParameter');
                process.env.DEBUG && console.log('id:         ' + get(searchParameter, 'id'));
                process.env.DEBUG && console.log('code:       ' + get(searchParameter, 'code'));
                process.env.DEBUG && console.log('expression: ' + get(searchParameter, 'expression'));
                process.env.DEBUG && console.log('base        ' + get(searchParameter, 'base'));
                process.env.DEBUG && console.log('target      ' + get(searchParameter, 'target[0]'));
                process.env.DEBUG && console.log('xpath:      ' + get(searchParameter, 'xpath'));
                process.env.DEBUG && console.log(' ');

                Object.keys(req.query).forEach(function(queryKey){
                  if(Object.hasOwnProperty(queryKey) && (Object[queryKey] === "")){
                    let fieldExistsQuery = {};
                    fieldExistsQuery[queryKey] = {$exists: true};
                    Object.assign(mongoQuery, fieldExistsQuery);
                  } else if(get(searchParameter, 'code') === queryKey){
                    let newQueryPart = RestHelpers.fhirPathToMongo(searchParameter, queryKey, req);

                    if (mongoQuery.$or && newQueryPart.$or) {
                      if (!mongoQuery.$and) {
                        mongoQuery.$and = [{ $or: mongoQuery.$or }];
                        delete mongoQuery.$or;
                      }
                      mongoQuery.$and.push({ $or: newQueryPart.$or });
                      process.env.DEBUG && console.log('Combined two $or clauses with $and');
                    } else if (newQueryPart.$or && Object.keys(mongoQuery).length > 0) {
                      let existingConditions = { ...mongoQuery };
                      Object.keys(existingConditions).forEach(function(k) { delete mongoQuery[k]; });
                      mongoQuery.$and = [existingConditions, { $or: newQueryPart.$or }];
                      process.env.DEBUG && console.log('Wrapped existing conditions with new $or in $and');
                    } else if (mongoQuery.$or && Object.keys(newQueryPart).length > 0 && !newQueryPart.$or) {
                      let existingOr = mongoQuery.$or;
                      delete mongoQuery.$or;
                      mongoQuery.$and = [{ $or: existingOr }, newQueryPart];
                      process.env.DEBUG && console.log('Wrapped existing $or with new conditions in $and');
                    } else {
                      Object.assign(mongoQuery, newQueryPart);
                    }
                  }
                })

                if(get(Meteor, 'settings.private.debug') === true) { console.log('SearchParameters::mongoQuery', JSON.stringify(mongoQuery)); }
              })
            }

            // Handle built-in FHIR search parameters not in SearchParameters collection
            // _id is a special parameter that exists for all FHIR resources
            if (get(req, 'query._id')) {
              let searchId = get(req, 'query._id').trim();
              // Strip resource type prefix if present (e.g., "Patient/abc" → "abc")
              if (searchId.includes('/')) {
                searchId = searchId.split('/').pop();
              }
              mongoQuery['id'] = searchId;
              console.log('Built-in _id search parameter applied:', searchId);
            }

            // Log the final mongoQuery after ALL SearchParameters have been processed
            console.log('========== AFTER SearchParameters Processing ==========');
            console.log('Final mongoQuery after SearchParameters:', JSON.stringify(mongoQuery, null, 2));
            console.log('mongoQuery keys:', Object.keys(mongoQuery));
            console.log('=====================================================');

            // Fallback: If no SearchParameters matched but we have a patient query param,
            // use the existing FhirUtilities.addPatientFilterToQuery() helper
            // This handles cases where SearchParameters aren't initialized in the database
            if (Object.keys(mongoQuery).length === 0 && get(req, 'query.patient')) {
              let patientId = get(req, 'query.patient').replace(/^Patient\//, '');
              console.log('No SearchParameters matched - using FhirUtilities.addPatientFilterToQuery() fallback');
              console.log('Patient ID:', patientId);
              mongoQuery = FhirUtilities.addPatientFilterToQuery(patientId, mongoQuery);
              console.log('Fallback mongoQuery:', JSON.stringify(mongoQuery, null, 2));
            }

            process.env.DEBUG && console.log('Original Url:  ' + req.originalUrl)
            process.env.DEBUG && console.log('Generated Mongo query: ', mongoQuery);
            process.env.DEBUG && console.log('--------------------------------------')

            logToInboundQueue(req);

            // res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
            res.setHeader("ETag", fhirVersion);
            
            let authorizationContext = await parseUserAuthorization(req);
            
            // If no valid auth context but OAuth is disabled, use default
            if (!authorizationContext && get(Meteor, 'settings.private.fhir.disableOauth') === true) {
              authorizationContext = {
                role: 'noauth',
                userId: null
              };
            } else if (!authorizationContext) {
              // Default to citizen for public access
              authorizationContext = {
                role: 'citizen',
                userId: null
              };
            }

            if (await isAuthorized(authorizationContext)){

              // ONC g(10) DAT-PAT-9: Check if resource type is in authorized scopes
              if (!isResourceScopeAuthorized(authorizationContext, routeResourceType)) {
                res.setHeader("content-type", 'application/fhir+json;charset=utf-8');
                res.status(403).json({
                  resourceType: "OperationOutcome",
                  issue: [{
                    severity: "error",
                    code: "forbidden",
                    diagnostics: `Access to ${routeResourceType} is not authorized by the granted scopes`
                  }]
                });
                return;
              }

              let userRole = get(authorizationContext, 'role', 'PAT');


              if(get(Meteor, 'settings.private.debug') === true) { console.log('authorizationContext', authorizationContext); }
              if(get(Meteor, 'settings.private.debug') === true) { console.log('CollectionName: ' + collectionName); }
              if(get(Meteor, 'settings.private.debug') === true) { console.log('userRole: ' + userRole); }



              if(userRole){
                let hipaaAccess = {};
                
                // Handle noauth, SYSTEM, and citizen roles even when no consent records exist
                if(userRole === "noauth" || userRole === "SYSTEM"){
                  // authorization is disabled or system access; grant access
                  hipaaAccess = {
                    granted: true
                  }
                } else if(userRole === "citizen"){
                  // citizen role - check if resource is public
                  const publicResources = ['Practitioner', 'PractitionerRole', 'Organization', 
                                          'Location', 'HealthcareService', 'Endpoint'];
                  if(publicResources.includes(routeResourceType)){
                    hipaaAccess = {
                      granted: true
                    }
                  } else {
                    hipaaAccess = {
                      granted: false
                    }
                  }
                } else if(accessControlList.length > 0){
                  // For other roles, check ACL permissions
                  hipaaAccess = acl.can(userRole).execute('access').with({securityLabel: 'normal'}).sync().on(routeResourceType);    
                } else {
                  // console.log('acl', acl)
                  // console.log('Access Control List initialized with ' + accessControlList.length + ' records.')
                  res.status(501).json({message: 'Access control lists not initialized.  Have the administrator initialize some Consent records to allow access to the repository.  INITIALIZE_CONSENT_ENGINE environment variable may be of help.'})
                  return;
                }
                
                console.log(routeResourceType + '.publish().permission', hipaaAccess)
                console.log(routeResourceType + '.publish().permission.granted', hipaaAccess.granted)
                
                // Store the search query built from SearchParameters before applying authorization filters
                let searchQuery = Object.assign({}, mongoQuery);
                
                if(get(Meteor, 'settings.private.debug') === true) { 
                  console.log('========== STORING SearchQuery ==========');
                  console.log('searchQuery (copy of mongoQuery):', JSON.stringify(searchQuery, null, 2));
                  console.log('searchQuery keys:', Object.keys(searchQuery));
                  console.log('=========================================');
                }
                
                if(hipaaAccess.granted){
                  // Check if healthcare practitioner/provider with full access
                  const isPractitioner = (userRole === 'healthcare practitioner' || userRole === 'healthcare provider');
                  const practitionerFullAccess = get(Meteor, 'settings.private.accessControl.practitionerFullAccess', true);

                  // Reference resources that don't belong to patient compartment per FHIR R4 spec
                  // These are organizational resources accessible with appropriate scope without patient references
                  const referenceResources = ['Location', 'Practitioner', 'PractitionerRole',
                                              'Organization', 'HealthcareService', 'Endpoint'];
                  const isReferenceResource = referenceResources.includes(routeResourceType);

                  if (isPractitioner && practitionerFullAccess) {
                    // Healthcare practitioner with full access - use search query as-is
                    mongoQuery = searchQuery;
                    console.log('Practitioner full access - no authorization filter applied');
                  } else if (isReferenceResource) {
                    // Reference resources bypass patient compartment filtering
                    // The scope check (isResourceScopeAuthorized) already verified access
                    mongoQuery = searchQuery;
                    console.log('Reference resource - no patient compartment filter applied for:', routeResourceType);
                  } else {
                    // Apply authorization filters
                    let authQuery = {$or: [
                      {'meta.security.display': {$eq: 'unrestricted'}}
                    ]}
                    if(routeResourceType === "Patient"){
                      if(get(authorizationContext, 'patientId')){
                        authQuery.$or.push({'id': get(authorizationContext, 'patientId')})
                      }
                      if(get(authorizationContext, 'practitionerId')){
                        authQuery.$or.push({'generalPractitioner.reference': {$regex: get(authorizationContext, 'practitionerId')}})
                      }
                    } else {
                      // FHIR resources use different reference paths for patients:
                      // - Some use 'subject.reference' (Observation, Condition, Procedure, DiagnosticReport, etc.)
                      // - Some use 'patient.reference' (AllergyIntolerance, CarePlan, CareTeam, Encounter, Immunization, MedicationRequest, etc.)
                      // - Coverage uses 'beneficiary.reference'
                      // We check all to properly filter by patient authorization
                      // References may be stored as: Patient/uuid, urn:uuid:uuid, or just uuid
                      if(get(authorizationContext, 'patientId')){
                        let patientId = get(authorizationContext, 'patientId');
                        let patientRefs = [
                          patientId,
                          'Patient/' + patientId,
                          'urn:uuid:' + patientId
                        ];
                        authQuery.$or.push({'subject.reference': { $in: patientRefs }});
                        authQuery.$or.push({'patient.reference': { $in: patientRefs }});
                        authQuery.$or.push({'beneficiary.reference': { $in: patientRefs }});
                      }
                    }

                    // Merge authorization query with search query
                    if(get(Meteor, 'settings.private.debug') === true) {
                      console.log('========== MERGING AUTH WITH SEARCH ==========');
                      console.log('searchQuery keys:', Object.keys(searchQuery));
                      console.log('searchQuery:', JSON.stringify(searchQuery, null, 2));
                      console.log('authQuery:', JSON.stringify(authQuery, null, 2));
                    }

                    if(Object.keys(searchQuery).length > 0){
                      // If we have search criteria, combine it with auth criteria using $and
                      mongoQuery = {
                        $and: [searchQuery, authQuery]
                      }
                      if(get(Meteor, 'settings.private.debug') === true) {
                        console.log('MERGED with $and - mongoQuery:', JSON.stringify(mongoQuery, null, 2));
                      }
                    } else {
                      // No search criteria, just use auth query
                      mongoQuery = authQuery
                      if(get(Meteor, 'settings.private.debug') === true) {
                        console.log('NO SEARCH QUERY - using authQuery only');
                      }
                    }

                    if(get(Meteor, 'settings.private.debug') === true) {
                      console.log('==============================================');
                    }
                  }
                }    

                if(userRole === "noauth" || userRole === "SYSTEM"){
                  // For noauth/SYSTEM, use the search query as-is (no auth restrictions)
                  mongoQuery = searchQuery
                  console.log('========== NOAUTH/SYSTEM OVERRIDE ==========');
                  console.log('Using searchQuery as-is for noauth/SYSTEM role');
                  console.log('mongoQuery:', JSON.stringify(mongoQuery, null, 2));
                  console.log('============================================');
                }
                
                let databaseOptions = RestHelpers.generateMongoSearchOptions(req.query, routeResourceType);

                let payload = [];
    
                console.log('mongoQuery', JSON.stringify(mongoQuery, null, 2));
                console.log('mongoQuery.compressed', JSON.stringify(mongoQuery));
                console.log('databaseOptions', databaseOptions);
                // time to use the generated mongo query and go fetch actual records
                if(Collections[collectionName]){
    
                  let selectedPatientId = get(authorizationContext, 'userId');
                  // let totalMatches = await Collections[collectionName].find(mongoQuery).countAsync();
                  let records;
                  
                  console.log('========== BEFORE DATABASE QUERY ==========');
                  console.log('Collection:', collectionName);
                  console.log('Final mongoQuery being passed to find():', JSON.stringify(mongoQuery, null, 2));
                  console.log('mongoQuery type:', typeof mongoQuery);
                  console.log('mongoQuery keys:', Object.keys(mongoQuery));
                  if(mongoQuery.$and) {
                    console.log('$and array length:', mongoQuery.$and.length);
                    mongoQuery.$and.forEach((condition, index) => {
                      console.log(`$and[${index}]:`, JSON.stringify(condition));
                    });
                  }
                  console.log('databaseOptions:', JSON.stringify(databaseOptions, null, 2));
                  console.log('==========================================');
                  
                  records = await Collections[collectionName].find(mongoQuery, databaseOptions).fetch();

                  // SMART 2.x Granular Scopes: Filter results based on scope parameters
                  // e.g., patient/Condition.rs?category=health-concern
                  const granularFilters = getGranularFiltersForResource(authorizationContext, routeResourceType);
                  if (granularFilters.length > 0) {
                    console.log('[GranularScope] Applying', granularFilters.length, 'filters to', records.length, routeResourceType, 'records');
                    records = applyGranularScopeFilters(records, granularFilters);
                    console.log('[GranularScope] After filtering:', records.length, 'records remain');
                  }

                  process.env.DEBUG && console.log('records', records)
                  // if(collectionName === "Patients"){
                  //   records = await Collections[collectionName].find(mongoQuery, databaseOptions).fetch();
                  // } else {
                  //   records = await Collections[collectionName].find(FhirUtilities.addPatientFilterToQuery(selectedPatientId, mongoQuery), databaseOptions).fetch();
                  // }
                  
                  // if(get(Meteor, 'settings.private.debug') === true) { console.log('Found ' + records.length + ' records matching the query on the ' + routeResourceType + ' endpoint.'); }
                  process.env.DEBUG && console.log('Found ' + records.length + ' records matching the query on the ' + routeResourceType + ' endpoint.'); 
    
                  process.env.DEBUG && console.log('AccessControlLists - Current userRole: ' + userRole)
                  // payload entries
                  for (let record of records) {
                    // Resolve conditional references for CareTeam (e.g., Practitioner?identifier=...)
                    if (routeResourceType === 'CareTeam') {
                      record = await RestHelpers.resolveConditionalReferences(record);
                    }

                    // check for security labels; otherwise assume normal access patterns
                    let recordSecurityLabel = get(record, 'meta.security[0].display', 'normal');
                    if(process.env.TRACE){
                      console.log('---------------------------------------------------')
                      console.log('routeResourceType:   ' + routeResourceType)
                      console.log('authorization.role:  ' + get(authorizationContext, 'role'))
                      console.log('recordSecurityLabel: ' + recordSecurityLabel)
                    }
    
                    
                    let accessGranted = false;
                    let permission;
    
                    if (get(authorizationContext, 'role') === 'noauth' || get(authorizationContext, 'role') === 'SYSTEM') { 
                      accessGranted = true;
                    } else {
                      permission = acl.can(get(authorizationContext, 'role', 'citizen')).execute('access').with({'securityLabel': recordSecurityLabel}).sync().on(routeResourceType);
                      if(process.env.TRACE){
                        console.log('permission.granted:  ' + permission.granted);
                      }
    
                      accessGranted = permission.granted;
                    }
    
                    if(accessGranted){
                      let newEntry = {
                        fullUrl: routeResourceType + "/" + get(record, 'id'),
                        resource: RestHelpers.prepForFhirTransfer(record),
                        search: {
                          mode: "match"
                        }
                      }
                      payload.push(newEntry);
                    } 
    
                    
                    // Handle _include (similar pattern to _revInclude below)
                    let includeParam = get(req, 'query._include');
                    if(includeParam){
                      let includes = Array.isArray(includeParam) ? includeParam : [includeParam];

                      for(let _includeRef of includes){
                        let includeParts = _includeRef.split(":");

                        if(includeParts.length >= 2){
                          let sourceResource = includeParts[0];  // e.g., "MedicationRequest"
                          let searchParamName = includeParts[1]; // e.g., "medication"

                          // Map search parameter name to actual field path
                          // Example: "medication" -> "medicationReference" for MedicationRequest
                          let fieldPath = searchParamName;
                          if(includeFieldMappings[sourceResource] && includeFieldMappings[sourceResource][searchParamName]){
                            fieldPath = includeFieldMappings[sourceResource][searchParamName];
                          }

                          let referenceValue = get(record, fieldPath + ".reference");
                          if(referenceValue){
                            process.env.DEBUG && console.log("_include reference: ", referenceValue);

                            let includeReferenceParts = referenceValue.split("/");
                            if(includeReferenceParts.length === 2){
                              let referencedResourceType = includeReferenceParts[0];
                              let referencedResourceId = includeReferenceParts[1];

                              let pluralizedResourceType = FhirUtilities.pluralizeResourceName(referencedResourceType);
                              process.env.DEBUG && console.log('_include pluralizedResourceType', pluralizedResourceType);

                              if(Collections[pluralizedResourceType]){
                                let _includeReferenceRecord = await Collections[pluralizedResourceType].findOneAsync({id: referencedResourceId});
                                if(_includeReferenceRecord){
                                  payload.push({
                                    fullUrl: referencedResourceType + "/" + referencedResourceId,
                                    resource: RestHelpers.prepForFhirTransfer(_includeReferenceRecord),
                                    search: {
                                      mode: "include"
                                    }
                                  });
                                } else {
                                  console.warn('_include: Referenced resource not found:', referenceValue);
                                }
                              } else {
                                console.warn('_include: Collection not found for:', pluralizedResourceType);
                              }
                            }
                          }
                        }
                      }
                    }
                  }

                  // Handle _revInclude (reverse include)
                  // For Provenance:target, generate Provenance on-demand using resource metadata
                  let revIncludeParam = get(req, 'query._revinclude') || get(req, 'query._revInclude');
                  if(revIncludeParam){
                    let revIncludes = Array.isArray(revIncludeParam) ? revIncludeParam : [revIncludeParam];

                    for(let _revIncludeRef of revIncludes){
                      let revIncludeParts = _revIncludeRef.split(":");

                      if(revIncludeParts.length >= 2 && revIncludeParts[0] === "Provenance" && revIncludeParts[1] === "target"){
                        // Find an Organization to reference in Provenance agent (lookup once, use for all)
                        let provenanceOrg = await Organizations.findOneAsync({
                          'meta.profile': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-organization'
                        });
                        if(!provenanceOrg){
                          provenanceOrg = await Organizations.findOneAsync({});
                        }

                        let orgReference = provenanceOrg ? {
                          reference: "Organization/" + get(provenanceOrg, 'id'),
                          display: get(provenanceOrg, 'name', get(Meteor, 'settings.public.title', 'Honeycomb EHR'))
                        } : {
                          display: get(Meteor, 'settings.public.title', 'Honeycomb EHR')
                        };

                        // Generate Provenance for each matched record (just-in-time)
                        for(let matchedRecord of records){
                          let provenanceId = "provenance-" + get(matchedRecord, 'id');

                          let provenance = {
                            resourceType: "Provenance",
                            id: provenanceId,
                            meta: {
                              profile: ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-provenance"]
                            },
                            target: [{
                              reference: routeResourceType + "/" + get(matchedRecord, 'id')
                            }],
                            recorded: get(matchedRecord, 'meta.lastUpdated') || new Date().toISOString(),
                            agent: [
                              {
                                type: {
                                  coding: [{
                                    system: "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
                                    code: "author",
                                    display: "Author"
                                  }]
                                },
                                who: orgReference,
                                onBehalfOf: orgReference
                              },
                              {
                                type: {
                                  coding: [{
                                    system: "http://hl7.org/fhir/us/core/CodeSystem/us-core-provenance-participant-type",
                                    code: "transmitter",
                                    display: "Transmitter"
                                  }]
                                },
                                who: orgReference,
                                onBehalfOf: orgReference
                              }
                            ]
                          };

                          payload.push({
                            fullUrl: "Provenance/" + provenanceId,
                            resource: provenance,
                            search: {
                              mode: "include"
                            }
                          });
                        }
                      }
                    }
                  }


                  // add some pagination logic
                  let links = [];
                  links.push({
                    "relation": "self",
                    "url": req.originalUrl
                  });  
    
                  // // if matches are greater than _count?
                  // if(totalMatches > payload.length){
                  //   links.push({
                  //     "relation": "next",
                  //     "url": fhirPath + "/" + '?_skip=' + (parseInt(databaseOptions.skip) + payload.length)
                  //   });  
                  // }
    
                  // Success
                  res.status(200).json(Bundle.generate(payload, "searchset", payload.length, links));                  

                  // res.end(Bundle.generate(payload, "searchset", payload.length, links));
                } else {
                  // Not Implemented
                  res.status(501).json();
                } 
              } else {
                
                // Unauthorized
                res.status(418).json();
              }
            } else {
              console.log('User not authorized...')
              // enable public access unclassified data
              if(get(Meteor, 'settings.private.enablePublicUnrestrictedData')){
                console.log('Providing public unrestricted data instead...')
                let records = await Collections[collectionName].find({'meta.security.display': {$eq: 'unrestricted'}});

                let payload = [];
                records.forEach(function(record){
                  payload.push({
                    fullUrl: routeResourceType + "/" + get(record, 'id'),
                    resource: RestHelpers.prepForFhirTransfer(record),
                    search: {
                      mode: "match"
                    }
                  });
                })      
                let links = [];
                links.push({
                  "relation": "self",
                  "url": req.originalUrl
                });          

                res.status(200).json(Bundle.generate(payload, "searchset", payload.length, links));
              } else {
                // Unauthorized
                res.status(401).json();
              }
            }
          }
        });
      } else {
        // NOT IMPLEMENTED
        WebApp.handlers.get("/" + fhirPath + "/" + routeResourceType + "/:id", async (req, res) => {
          res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);
          
          res.status(501).json();
        });

        // NOT IMPLEMENTED
        WebApp.handlers.get("/" + fhirPath + "/" + routeResourceType, async (req, res) => {
          res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);

          res.status(501).json();
        });
      }

      // History-instance
      // https://www.hl7.org/fhir/http.html#history-instance
      if(serverRouteManifest[routeResourceType].interactions.includes('history-instance')){
        // history-instance
        WebApp.handlers.get("/" + fhirPath + "/" + routeResourceType + "/:id/_history", async (req, res) => {
          if(get(Meteor, 'settings.private.debug') === true) { console.log('GET /' + fhirPath + '/' + routeResourceType + '/' + req.params.id + '/_history'); }
  
          process.env.TRACE && console.log('req', req);
          logToInboundQueue(req);

          res.setHeader("content-type", 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);

          const gotToken = limiter.tryRemoveTokens(1);
          if (!gotToken) {
            res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"});
          } else {
            let authorizationContext = await parseUserAuthorization(req)
            if (await isAuthorized(authorizationContext)){
              if(get(Meteor, 'settings.private.debug') === true) { console.log('Security checks completed'); }
  
              let record;
              let lastModified = moment().subtract(100, 'years');
              let hasVersionedLastModified = false;
  
              process.env.DEBUG && console.log('req.query', req.query)
              process.env.DEBUG && console.log('req.params', req.params)
  
              let records = await Collections[collectionName].find({id: req.params.id});
              if(get(Meteor, 'settings.private.trace') === true) { console.log('records', records); }
  
              // and generate a Bundle payload
              payload = [];
  
              records.forEach(function(recordVersion){
                payload.push({
                  fullUrl: "Organization/" + get(recordVersion, 'id'),
                  resource: RestHelpers.prepForFhirTransfer(recordVersion),
                  request: {
                    method: "GET",
                    url: '/' + fhirPath + '/' + routeResourceType + '/' + req.params.id + '/_history'
                  },
                  response: {
                    status: "200"
                  }
                });
                if(get(recordVersion, 'meta.lastUpdated')){
                  hasVersionedLastModified = true;
                  if(moment(get(recordVersion, 'meta.lastUpdated')) > lastModified){
                    lastModified = moment(get(recordVersion, 'meta.lastUpdated'));
                  }
                } 
              });  
  
              res.setHeader("content-type", 'application/fhir+json');
              if(hasVersionedLastModified){
                res.setHeader("Last-Modified", lastModified.toDate());
              }
              
              // res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
  
              // Success
              res.status(200).json(Bundle.generate(payload, "history"));
            }  
          }
        });      
      }

      // Update-create 
      // https://www.hl7.org/fhir/http.html#create
      if(serverRouteManifest[routeResourceType].interactions.includes('create')){
        WebApp.handlers.post("/" + fhirPath + "/" + routeResourceType, async (req, res) => {
          if(get(Meteor, 'settings.private.debug') === true) { console.log('================================================================'); }
          if(get(Meteor, 'settings.private.debug') === true) { console.log('POST /' + fhirPath + '/' + routeResourceType); }

          process.env.TRACE && console.log('req', req);
          logToInboundQueue(req);
          
          res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);          

          const gotToken = limiter.tryRemoveTokens(1);
          if (!gotToken) {
            res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"});
          } else {
            let accessTokenStr = get(req, 'params.access_token') || get(req, 'params.access_token');

            let authorizationContext = await parseUserAuthorization(req)
            if (await isAuthorized(authorizationContext)){
  
              //------------------------------------------------------------------------------------------------
  
              if(get(req, 'headers.x-provenance')){
                let xProvenance = JSON.parse(get(req, 'headers.x-provenance'));
  
                if(Collections["Provenances"]){
                  console.log("Received an x-provenance record.  Writing it to the Provenances collection....");
                  await Collections["Provenances"].insertAsync(xProvenance);
                }
              }
  
              if (get(req, 'body')) {
                let newRecord = req.body;
                if(get(Meteor, 'settings.private.trace') === true) { console.log('req.body', req.body); }
                
  
                let newlyAssignedId = Random.id();
  
                // https://www.hl7.org/fhir/http.html#create            
  
                if(get(newRecord, 'meta.versionId')){
                  set(newRecord, 'meta.versionId', (parseInt(newRecord.meta.versionId) + 1).toString());
                } else {
                  set(newRecord, 'meta.versionId', "1");
                }
                if(get(newRecord, 'meta.lastUpdated')){
                  set(newRecord, 'meta.lastUpdated', new Date());
                }
  
  
                if(get(newRecord, 'resourceType')){
                  if(get(newRecord, 'resourceType') !== routeResourceType){
                    // Unsupported Media Type
                    res.status(415).json({message: 'Wrong FHIR Resource.  Please check your endpoint.'});
                  } else {
                    newRecord.resourceType = routeResourceType;
                    newRecord._id = newlyAssignedId;

                    // Server MUST assign id on create (ignore client-provided id per FHIR spec)
                    newRecord.id = newlyAssignedId;
                    
      
                    newRecord = RestHelpers.toMongo(newRecord);
                    newRecord = RestHelpers.prepForUpdate(newRecord);
      
                    if(get(Meteor, 'settings.private.debug') === true) { console.log('newRecord', newRecord); }
      
                    
                    if(! await Collections[collectionName].findOneAsync({id: newlyAssignedId})){
                      if(get(Meteor, 'settings.private.debug') === true) { console.log('No ' + routeResourceType + ' found.  Creating one.'); }

                      try {
                        const result = await Collections[collectionName].insertAsync(newRecord);

                        if(get(Meteor, 'settings.private.trace') === true) { console.log('result', result); }
                        res.setHeader("Last-Modified", new Date());
                        res.setHeader("ETag", fhirVersion);

                        // Now that the record is written; if it was a Provenance, lets check the payload
                        if(collectionName === "Provenances"){

                          let xProvenanceData = get(newRecord, 'signature[0].data');

                          let decodedProvenanceData = jwt.decode(xProvenanceData, {complete: true})
                          console.log('decodedProvenanceData', decodedProvenanceData);

                          let provenancePayloadResourceType = get(decodedProvenanceData, 'payload.resourceType');
                          console.log('provenancePayload.resourceType', provenancePayloadResourceType);

                          let provenancePayload = get(decodedProvenanceData, 'payload');
                          console.log('provenancePayload.payload', provenancePayload);

                          if(provenancePayloadResourceType){
                            let provenanceCollectionName = FhirUtilities.pluralizeResourceName(provenancePayloadResourceType)
                            if(Collections[provenanceCollectionName]){
                              console.log('Adding a new ' + provenancePayloadResourceType + ' which was found in the x-provenance header payload.')
                              if(! await Collections[provenanceCollectionName].findOneAsync({id: provenancePayload.id})){
                                await Collections[provenanceCollectionName].insertAsync(provenancePayload)
                              }
                            }
                          }
                        }

                        // Re-enable the following for Abacus & SANER
                        // But document accordingly, and need to include Provenance stamping
                        // res.setHeader("MeasureReport", fhirPath + "/MeasureReport/" + result);
                        // res.setHeader("Location", "/MeasureReport/" + result);

                        // Fetch the created resource (use _id which is always set to newlyAssignedId)
                        const createdRecord = await Collections[collectionName].findOneAsync({_id: newlyAssignedId});

                        if (createdRecord) {
                          // Set Location header per FHIR spec (use record's FHIR id, not MongoDB _id)
                          res.setHeader("Location", `/${fhirPath}/${routeResourceType}/${get(createdRecord, 'id', newlyAssignedId)}`);

                          if(get(Meteor, 'settings.private.trace') === true) {
                            console.log("Created resource:", createdRecord);
                          }

                          // Return the created resource directly (FHIR compliant - all versions)
                          res.status(201).json(RestHelpers.prepForFhirTransfer(createdRecord));
                        } else {
                          // Resource was inserted but couldn't be retrieved - server error
                          console.error(`POST /${fhirPath}/${routeResourceType} - Resource created but not found: ${newlyAssignedId}`);
                          res.status(500).json({
                            resourceType: "OperationOutcome",
                            issue: [{
                              severity: "error",
                              code: "exception",
                              details: { text: "Resource created but could not be retrieved" }
                            }]
                          });
                        }
                      } catch (error) {
                        if(get(Meteor, 'settings.private.trace') === true) { console.log('POST /fhir/' + routeResourceType + ' [error]', error); }
                        console.error('POST /fhir/' + routeResourceType + ' error:', error.message);
                        // Bad Request
                        res.status(400).json({message: error.message});
                      }
                    } else {
                      // Already Exists
                      res.status(412).json();
                    }
                  } 
                }
              } else {
                // No body; Unprocessable Entity
                res.status(422).json();
              }
            } else {
              // Unauthorized
              res.status(401).json();
            }            
          }
        });
      }

      // Update 
      // https://www.hl7.org/fhir/http.html#update
      if(serverRouteManifest[routeResourceType].interactions.includes('update')){
        WebApp.handlers.put("/" + fhirPath + "/" + routeResourceType + "/:id", async (req, res) => {
          if(get(Meteor, 'settings.private.debug') === true) { console.log('================================================================'); }
          if(get(Meteor, 'settings.private.debug') === true) { console.log('PUT /' + fhirPath + '/' + routeResourceType + '/' + req.params.id); }
        
          process.env.TRACE && console.log('req', req);
          logToInboundQueue(req);
          
          res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);

          const gotToken = limiter.tryRemoveTokens(1);
          if (!gotToken) {
            res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"});
          } else {
            let accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
          
            let authorizationContext = await parseUserAuthorization(req)
            
            if (await isAuthorized(authorizationContext)){
        
              if (req.body) {
                let newRecord = cloneDeep(req.body);
        
                if(get(Meteor, 'settings.private.trace') === true) { console.log('req.body', req.body); }
        
                newRecord.resourceType = routeResourceType;
                newRecord = RestHelpers.toMongo(newRecord);
        
        
                newRecord = RestHelpers.prepForUpdate(newRecord);
        
                if(get(Meteor, 'settings.private.debug') === true) { console.log('-----------------------------------------------------------'); }
                if(get(Meteor, 'settings.private.debug') === true) { console.log('Received a new record to PUT into the database', JSON.stringify(newRecord, null, 2));             }
        

                if(typeof Collections[collectionName] === "object"){
                  let numRecordsToUpdate = await Collections[collectionName].find({id: req.params.id}).countAsync();

                  if(get(Meteor, 'settings.private.debug') === true) { console.log('Number of records found matching the id: ', numRecordsToUpdate); } 
                  
                  let newlyAssignedId;
          
                  if(numRecordsToUpdate > 0){
                    if(get(Meteor, 'settings.private.debug') === true) { console.log('Found existing records; this is an update interaction, not a create interaction'); }
                    if(get(Meteor, 'settings.private.debug') === true) { console.log(numRecordsToUpdate + ' records found...'); }
    
                    // don't need to send internal _ids
                    unset(newRecord, '_id');

                    // versioned, means we have prior versions and need to add a new one
                    if(get(Meteor, 'settings.private.fhir.rest.' + routeResourceType + ".versioning") === "versioned"){
                    // if(get(Meteor, 'settings.private.recordVersioningEnabled')){
                      if(get(Meteor, 'settings.private.debug') === true) { console.log('Versioned Collection: Trying to add another versioned record to the main Task collection.') }
    
                      if(get(Meteor, 'settings.private.debug') === true) { console.log("Lets set a new version ID"); }
                      // Server MUST ignore client meta.versionId and assign its own (FHIR spec)
                      set(newRecord, 'meta.versionId', (numRecordsToUpdate + 1).toString());
                      set(newRecord, 'meta.lastUpdated', new Date());
        
                      if(get(Meteor, 'settings.private.debug') === true) { console.log("And add it to the history"); }

                      try {
                        const resultId = await Collections[collectionName].insertAsync(newRecord);

                        if(get(Meteor, 'settings.private.trace') === true) { console.log('resultId', resultId); }

                        // this MeasureReport header was used in the SANER specification, I think
                        // don't remove, but it needs a conditional statement so it's not included on everything else
                        // res.setHeader("MeasureReport", fhirPath + "/" + routeResourceType + "/" + resultId);
                        res.setHeader("Last-Modified", new Date());


                        let updatedRecord = await Collections[collectionName].findOneAsync({_id: resultId});

                        if(get(Meteor, 'settings.private.trace') === true) { console.log("updatedRecord", updatedRecord); }

                        let operationOutcome = {
                          "resourceType": "OperationOutcome",
                          "issue" : [{ // R!  A single issue associated with the action
                            "severity" : "information", // R!  fatal | error | warning | information
                            "code" : "informational", // R!  Error or warning code
                            "details" : {
                              "text": resultId,
                              "coding": [{
                                "system": "http://terminology.hl7.org/CodeSystem/operation-outcome",
                                "code": "MSG_UPDATED",
                                "display": "existing resource updated",
                                "userSelected": false
                              }]
                            }
                          }]
                        }

                        if(updatedRecord){
                          // success!
                          res.status(200).json(RestHelpers.prepForFhirTransfer(updatedRecord));
                        } else {
                          // success!
                          res.status(400).json();
                        }
                      } catch (error) {
                        if(get(Meteor, 'settings.private.trace') === true) { console.log('PUT /fhir/' + routeResourceType + '/' + req.params.id + "[error]", error); }
                        console.error('PUT /fhir/' + routeResourceType + '/' + req.params.id + ' error:', error.message);
                        // Bad Request
                        res.status(400).json({message: error.message});
                      }
                    } else {
                      console.log("There's existing records, but we're not a versioned collection");
                      console.log("So we just need to update the record");

                      if(get(Meteor, 'settings.private.debug') === true) { console.log('Nonversioned Collection: Trying to update the existing record.') }

                      // Get existing record's versionId to increment it
                      const existingRecord = await Collections[collectionName].findOneAsync({id: req.params.id});
                      const currentVersion = parseInt(get(existingRecord, 'meta.versionId', '0'));

                      // Server MUST ignore client meta.versionId and assign its own (FHIR spec)
                      set(newRecord, 'meta.versionId', (currentVersion + 1).toString());
                      set(newRecord, 'meta.lastUpdated', new Date());

                      try {
                        const result = await Collections[collectionName].updateAsync({id: req.params.id}, {$set: newRecord });

                        if(get(Meteor, 'settings.private.trace') === true) { console.log('result', result); }
                        // keep the following; needed for SANER
                        // needs a conditional clause
                        // res.setHeader("MeasureReport", fhirPath + "/" + routeResourceType + "/" + result);
                        res.setHeader("Last-Modified", new Date());
                        res.setHeader("ETag", fhirVersion);

                        // this isn't a versioned collection, so we expect only a single record
                        let updatedRecord = await Collections[collectionName].findOneAsync({id: req.params.id});

                        if(updatedRecord){
                          if(get(Meteor, 'settings.private.trace') === true) { console.log("updatedRecord", updatedRecord); }

                          // success!
                          res.status(200).json(RestHelpers.prepForFhirTransfer(updatedRecord));
                        } else {
                          // record not found after update
                          res.status(500).json({message: 'Record not found after update'});
                        }
                      } catch (error) {
                        if(get(Meteor, 'settings.private.trace') === true) { console.log('PUT /fhir/' + routeResourceType + '/' + req.params.id + "[error]", error); }
                        console.error('PUT /fhir/' + routeResourceType + '/' + req.params.id + ' error:', error.message);
                        // Bad Request
                        res.status(400).json({message: error.message});
                      }
                    }
                    
                  // no existing records found, this is a create interaction
                  } else {        
                    if(get(Meteor, 'settings.private.debug') === true) { console.log('No matching records found.  Creating one.'); }
    
                    if(get(Meteor, 'settings.private.fhir.rest.' + routeResourceType + '.versioning') === "versioned"){
                      set(newRecord, 'meta.versionId', "1")
                    }

                    if(get(Meteor, 'settings.private.debug') === true) { console.log(newRecord); }

                    try {
                      const resultId = await Collections[collectionName].insertAsync(newRecord);

                      if(get(Meteor, 'settings.private.trace') === true) { console.log('resultId', resultId); }
                      res.setHeader("MeasureReport", fhirPath + "/" + routeResourceType + "/" + resultId);
                      res.setHeader("Last-Modified", new Date());
                      res.setHeader("ETag", fhirVersion);

                      let updatedRecord = await Collections[collectionName].findOneAsync({_id: resultId});

                      // Created!
                      res.status(201).json(RestHelpers.prepForFhirTransfer(updatedRecord));
                    } catch (error) {
                      if(get(Meteor, 'settings.private.trace') === true) { console.log('PUT /fhir/' + routeResourceType + '/' + req.params.id + "[error]", error); }
                      console.error('PUT /fhir/' + routeResourceType + '/' + req.params.id + ' error:', error.message);
                      // Bad Request
                      res.status(400).json({message: error.message});
                    }

                  }  
                } else {
                  console.log(collectionName + ' collection not found.')
                }
              } else {
                // no body; Unprocessable Entity
                res.status(422).json();
              }
            } else {
              // Unauthorized
              res.status(401).json();
            }
          }
        });
      }

      // Patch Interaction
      // https://www.hl7.org/fhir/http.html#update
      // https://stackoverflow.com/questions/31683075/how-to-do-a-deep-comparison-between-2-objects-with-lodash  

      if(serverRouteManifest[routeResourceType].interactions.includes('patch')){
        WebApp.handlers.patch("/" + fhirPath + "/" + routeResourceType + "/:id", async (req, res) => {
          process.env.DEBUG && console.log('================================================================'); 
          process.env.DEBUG && console.log('PATCH /' + fhirPath + '/' + routeResourceType + '/' + req.params.id); 
        
          process.env.TRACE && console.log('req', req);
          logToInboundQueue(req);

          res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);

          const gotToken = limiter.tryRemoveTokens(1);
          if (!gotToken) {
            res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"});
          } else {
            let accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
        
            let authorizationContext = await parseUserAuthorization(req)
            if (await isAuthorized(authorizationContext)){
  
              if (req.body) {
                let incomingRecord = cloneDeep(req.body);
        
                process.env.TRACE && console.log('req.body', req.body); 
        
                incomingRecord.resourceType = routeResourceType;
                incomingRecord = RestHelpers.toMongo(incomingRecord);
                incomingRecord = RestHelpers.prepForUpdate(incomingRecord);
        
                process.env.DEBUG && console.log('-----------------------------------------------------------'); 
                process.env.DEBUG && console.log('Received a new record to PATCH into the database', JSON.stringify(newRecord, null, 2));             
        
  
                if(typeof Collections[collectionName] === "object"){
                  let numRecordsToUpdate = await Collections[collectionName].find({id: req.params.id}).countAsync();
  
                  process.env.DEBUG && console.log('Number of records found matching the id: ', numRecordsToUpdate); 
                  
                  let newlyAssignedId;
          
                  if(numRecordsToUpdate > 1){
                    if(get(Meteor, 'settings.private.debug') === true) { console.log('Found existing records; this is an update interaction, not a create interaction'); }
                    if(get(Meteor, 'settings.private.debug') === true) { console.log(numRecordsToUpdate + ' records found...'); }
  
                    if(process.env.DEBUG){
                      console.log('req.query', req.query);
                      console.log('req.params', req.params);
                      console.log('req.body', req.body);  
                    }
                    
                    let setObjectPatch = {};
                    Object.keys(req.query).forEach(function(key){
                      setObjectPatch[key] = get(req.body, key);
                    })
  
                    
                    if(get(Meteor, 'settings.private.debug') === true) { console.log('setObjectPatch', setObjectPatch); }
                    let result = await Collections[collectionName].updateAsync({id: req.params.id}, {$set: setObjectPatch}, {multi: true});
  
                    // Unauthorized
                    res.status(200).json({message: result + " record(s) updated."});
  
                  } else if (numRecordsToUpdate === 1) {
                    if(get(Meteor, 'settings.private.debug') === true) { console.log('Trying to patch an existing record.') }
  
                    let currentRecord = await Collections[collectionName].findOneAsync({id: req.params.id});
  
                    delete currentRecord._document;
  
                    // let patchedRecord = Object.assign(currentRecord, incomingRecord);                  
  
                    let setObjectPatch = {};
                    Object.keys(req.query).forEach(function(key){
                      setObjectPatch[key] = get(req.body, key);
                    })
                    if(get(Meteor, 'settings.private.debug') === true) { console.log('setObjectPatch', setObjectPatch); }
  
                    
                    await Collections[collectionName].updateAsync({_id: setObjectPatch._id}, {$set: setObjectPatch});
  
                    delete setObjectPatch._document;
                    delete setObjectPatch._id;
  
                    res.status(204).json(setObjectPatch);
                  } else if (numRecordsToUpdate === 0){
                    res.status(404).json();
                  }
                } else {
                  console.log(collectionName + ' collection not found.')
                  res.status(500).json({message: collectionName + ' collection not found.'});
                }
              } else {
                // no body; Unprocessable Entity
                res.status(422).json();
              }
            } else {
              // Unauthorized
              res.status(401).json();
            }            
          }
        });
      } else {
        WebApp.handlers.patch("/" + fhirPath + "/" + routeResourceType + "/:id", async (req, res) => {
          res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);
          
          res.status(501).json();
        });
      }

      // Delete Interaction
      // https://www.hl7.org/fhir/http.html#delete
      if(serverRouteManifest[routeResourceType].interactions.includes('delete')){
        WebApp.handlers.delete("/" + fhirPath + "/" + routeResourceType + "/:id", async (req, res) => {
          if(get(Meteor, 'settings.private.debug') === true) { console.log('================================================================'); }
          if(get(Meteor, 'settings.private.debug') === true) { console.log('DELETE /' + fhirPath + '/' + routeResourceType + '/' + req.params.id); }

          process.env.TRACE && console.log('req', req);
          logToInboundQueue(req);
          
          res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);     
          
          const gotToken = limiter.tryRemoveTokens(1);
          if (!gotToken) {
            res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"});
          } else {
            let authorizationContext = await parseUserAuthorization(req)
            if (await isAuthorized(authorizationContext)){
              if(get(Meteor, 'settings.private.trace') === true) { 
                console.log('Searching ' + collectionName + ' for ' + req.params.id, Collections[collectionName].find({_id: req.params.id}).countAsync()); 
              }
  
              if (await Collections[collectionName].find({id: req.params.id}).countAsync() === 0) {
  
                // Not Found
                res.status(404).json();
  
              } else {
                Collections[collectionName].remove({id: req.params.id}, function(error, result){
                  if (result) {
                    // No Content
                    res.status(204).json();
                  }
                  if (error) {
                    // Conflict
                    res.status(409).json();
                  }
                });
              }
            } else {
              // Unauthorized
              res.status(401).json();
            }            
          }
        });
      }  else {
        WebApp.handlers.delete("/" + fhirPath + "/" + routeResourceType + "/:id", async (req, res) => {
          res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);
          
          res.status(501).json();
        });
      }

      // Search Interaction
      // https://www.hl7.org/fhir/http.html#search
      if(serverRouteManifest[routeResourceType].search){
        WebApp.handlers.post("/" + fhirPath + "/" + routeResourceType + "/:param", async (req, res) => {
          // Always log POST requests to debug body parsing issues
          console.log('================================================================');
          console.log('POST /' + fhirPath + '/' + routeResourceType + '/:param');
          console.log('POST req.params.param:', req.params.param);
          console.log('POST req.body:', JSON.stringify(req.body));
          console.log('POST req.body type:', typeof req.body);
          console.log('POST req.rawBody:', req.rawBody);
          console.log('POST content-type:', req.headers['content-type']);

          logToInboundQueue(req);

          process.env.DEBUG && console.log('---------------------------------------')
          process.env.DEBUG && console.log('Checking for chained queries (POST)....')
          process.env.DEBUG && console.log('req.query', req.query);

          const gotToken = limiter.tryRemoveTokens(1);
          if (!gotToken) {
            res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"});
          } else {
            Object.keys(req.query).forEach(function(key){
              let result = 0;
              let queryParts = key.split(".");
              if(Array.isArray(queryParts)){
                result = queryParts.length;
                if(queryParts.length === 2){
                  
                }
              }
  
              return result;
            })
  
            res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
            res.setHeader("ETag", fhirVersion);
  
            let authorizationContext = await parseUserAuthorization(req)
            if (await isAuthorized(authorizationContext)){
              let matchingRecords = [];
              let payload = [];
              let searchLimit = 1000; // Match GET handler default from RestHelpers.generateMongoSearchOptions

              if (get(req, 'query._count') || get(req, 'body._count')) {
                searchLimit = parseInt(get(req, 'query._count') || get(req, 'body._count'));
              }

              if (req.params.param.includes('_search')) {
                // Debug: Log what we're receiving in the POST body
                console.log('================================================================');
                console.log('POST _search DEBUG - routeResourceType:', routeResourceType);
                console.log('POST _search DEBUG - req.body:', JSON.stringify(req.body));
                console.log('POST _search DEBUG - req.body type:', typeof req.body);
                console.log('POST _search DEBUG - req.body length:', typeof req.body === 'string' ? req.body.length : (req.body ? Object.keys(req.body).length : 0));
                console.log('POST _search DEBUG - req.query:', JSON.stringify(req.query));
                console.log('POST _search DEBUG - req.rawBody:', req.rawBody);
                console.log('POST _search DEBUG - content-type:', req.headers['content-type']);
                console.log('POST _search DEBUG - content-length:', req.headers['content-length']);
                console.log('POST _search DEBUG - transfer-encoding:', req.headers['transfer-encoding']);

                // Body parsing for POST _search
                // bodyParser middleware should have already parsed the body, but we add fallbacks
                let parsedBody = {};

                // First, try to use req.body if it was parsed by bodyParser as an object with content
                if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
                  parsedBody = req.body;
                  console.log('POST _search DEBUG - using req.body from bodyParser (object):', JSON.stringify(parsedBody));
                }
                // Second, try to use req.body if it's a string (from bodyParser.text())
                else if (req.body && typeof req.body === 'string' && req.body.length > 0) {
                  try {
                    parsedBody = querystring.parse(req.body);
                    console.log('POST _search DEBUG - parsed req.body string:', JSON.stringify(parsedBody));
                  } catch (parseErr) {
                    console.error('POST _search DEBUG - error parsing req.body string:', parseErr);
                  }
                }
                // Third, try to use rawBody if available (from verify callback)
                // This is the most reliable method since it captures the raw buffer
                if (Object.keys(parsedBody).length === 0 && req.rawBody && req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
                  try {
                    parsedBody = querystring.parse(req.rawBody);
                    console.log('POST _search DEBUG - parsed from rawBody:', JSON.stringify(parsedBody));
                  } catch (parseErr) {
                    console.error('POST _search DEBUG - error parsing rawBody:', parseErr);
                  }
                }
                // Fourth, try to read from stream as last resort
                if (Object.keys(parsedBody).length === 0 && req.readable && req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
                  try {
                    const chunks = [];
                    for await (const chunk of req) {
                      chunks.push(chunk);
                    }
                    const rawBody = Buffer.concat(chunks).toString();
                    if (rawBody) {
                      parsedBody = querystring.parse(rawBody);
                      console.log('POST _search DEBUG - parsed from stream:', JSON.stringify(parsedBody));
                    }
                  } catch (parseErr) {
                    console.error('POST _search DEBUG - error reading stream:', parseErr);
                  }
                }

                // Log if no body params were found
                if (Object.keys(parsedBody).length === 0) {
                  console.warn('POST _search WARNING - No body params found! Check body-parser middleware.');
                  console.warn('POST _search WARNING - req.body:', req.body);
                  console.warn('POST _search WARNING - req.rawBody:', req.rawBody);
                  console.warn('POST _search WARNING - content-type:', req.headers['content-type']);
                }

                // Merge URL query params with POST body params (FHIR allows both for POST _search)
                let searchParams = Object.assign({}, req.query, parsedBody);
                console.log('POST _search DEBUG - merged searchParams:', JSON.stringify(searchParams));

                // Use SearchParametersEngine like GET handler does (instead of legacy generateMongoSearchQuery)
                let searchQuery = {};

                if (SearchParametersEngine.isEnabled() && SearchParametersEngine.isCompiled()) {
                  Object.keys(searchParams).forEach(function(queryKey) {
                    if (queryKey.startsWith('_')) return; // Skip special params like _count

                    const queryValue = searchParams[queryKey];
                    const newQueryPart = SearchParametersEngine.buildMongoQuery(routeResourceType, queryKey, queryValue);

                    if (newQueryPart) {
                      // Smart combination of $or clauses with $and (same logic as GET handler)
                      if (searchQuery.$or && newQueryPart.$or) {
                        if (!searchQuery.$and) {
                          searchQuery.$and = [{ $or: searchQuery.$or }];
                          delete searchQuery.$or;
                        }
                        searchQuery.$and.push({ $or: newQueryPart.$or });
                      } else if (newQueryPart.$or) {
                        searchQuery.$or = newQueryPart.$or;
                      } else {
                        Object.assign(searchQuery, newQueryPart);
                      }
                    }
                  });
                  console.log('POST _search: Using SearchParametersEngine, query:', JSON.stringify(searchQuery));

                  // Handle patient parameter if not handled by SearchParametersEngine
                  // (some resources don't have explicit patient SearchParameter definitions)
                  // Note: Coverage uses beneficiary.reference, so we must check for it too
                  if (get(searchParams, 'patient') && !searchQuery['subject.reference'] && !searchQuery['beneficiary.reference'] && !searchQuery.$or && !searchQuery.$and) {
                    let patientId = get(searchParams, 'patient').replace(/^Patient\//, '');
                    console.log('POST _search: Adding patient filter via FhirUtilities.addPatientFilterToQuery()');
                    searchQuery = FhirUtilities.addPatientFilterToQuery(patientId, searchQuery);
                  } else if (get(searchParams, 'patient')) {
                    // If there's already a query, we need to combine with patient filter using $and
                    let patientId = get(searchParams, 'patient').replace(/^Patient\//, '');
                    let patientQuery = FhirUtilities.addPatientFilterToQuery(patientId, {});
                    if (Object.keys(patientQuery).length > 0) {
                      // Check if patient filter wasn't already handled by the engine
                      // Include beneficiary.reference check for Coverage resources
                      let queryStr = JSON.stringify(searchQuery);
                      if (!queryStr.includes('subject.reference') && !queryStr.includes('patient.reference') && !queryStr.includes('beneficiary.reference')) {
                        console.log('POST _search: Combining existing query with patient filter');
                        searchQuery = { $and: [searchQuery, patientQuery] };
                      }
                    }
                  }

                  // Handle status parameter if not handled by SearchParametersEngine
                  // (many resources have 'status' but may not have explicit SearchParameter definitions)
                  if (get(searchParams, 'status') && !searchQuery['status']) {
                    let statusValue = get(searchParams, 'status');
                    let queryStr = JSON.stringify(searchQuery);
                    if (!queryStr.includes('"status"')) {
                      console.log('POST _search: Adding status filter directly');
                      if (searchQuery.$and) {
                        searchQuery.$and.push({ 'status': statusValue });
                      } else if (Object.keys(searchQuery).length > 0) {
                        searchQuery = { $and: [searchQuery, { 'status': statusValue }] };
                      } else {
                        searchQuery['status'] = statusValue;
                      }
                    }
                  }
                } else {
                  // Fallback to legacy query builder if engine not available
                  searchQuery = RestHelpers.generateMongoSearchQuery(searchParams, routeResourceType);
                  console.log('POST _search: Using legacy generateMongoSearchQuery (engine not ready)');
                }

                console.log('POST _search DEBUG - generated searchQuery:', JSON.stringify(searchQuery));

                // TEMPORARY DIAGNOSTIC - Remove after debugging test 12.43.02
                // Adds diagnostic info to response header for debugging without server logs
                console.log('=== DIAGNOSTIC OUTPUT ===');
                const diagnostic = {
                  timestamp: new Date().toISOString(),
                  resourceType: routeResourceType,
                  body: {
                    reqBody: req.body,
                    reqBodyType: typeof req.body,
                    rawBody: req.rawBody ? req.rawBody.substring(0, 200) : null,  // Truncate for header
                    contentType: req.headers['content-type'],
                    contentLength: req.headers['content-length']
                  },
                  parsing: {
                    parsedBody: parsedBody,
                    parsedBodyKeys: Object.keys(parsedBody),
                    searchParams: searchParams,
                    searchParamsKeys: Object.keys(searchParams)
                  },
                  query: {
                    searchQuery: searchQuery,
                    searchQueryKeys: Object.keys(searchQuery),
                    engineEnabled: SearchParametersEngine.isEnabled(),
                    engineCompiled: SearchParametersEngine.isCompiled()
                  }
                };
                console.log('DIAGNOSTIC:', JSON.stringify(diagnostic, null, 2));
                // Note: Headers can be max ~8KB, so we truncate the diagnostic
                try {
                  res.setHeader('X-Debug-Diagnostic', JSON.stringify(diagnostic));
                } catch (headerErr) {
                  console.error('Could not set diagnostic header:', headerErr.message);
                }

                // Apply authorization filter (same as GET search)
                let userRole = get(authorizationContext, 'role', 'PAT');
                let mongoQuery = searchQuery;

                // Check if healthcare practitioner/provider with full access
                const isPractitioner = (userRole === 'healthcare practitioner' || userRole === 'healthcare provider');
                const practitionerFullAccess = get(Meteor, 'settings.private.accessControl.practitionerFullAccess', true);

                // Reference resources that don't belong to patient compartment per FHIR R4 spec
                // These are organizational resources accessible with appropriate scope without patient references
                const referenceResources = ['Location', 'Practitioner', 'PractitionerRole',
                                            'Organization', 'HealthcareService', 'Endpoint'];
                const isReferenceResource = referenceResources.includes(routeResourceType);

                if (userRole === "noauth" || userRole === "SYSTEM") {
                  // For noauth/SYSTEM, use the search query as-is (no auth restrictions)
                  mongoQuery = searchQuery;
                  console.log('POST _search: NOAUTH/SYSTEM - no auth filter applied');
                } else if (isPractitioner && practitionerFullAccess) {
                  // Healthcare practitioner with full access - use search query as-is
                  mongoQuery = searchQuery;
                  console.log('POST _search: Practitioner full access - no auth filter applied');
                } else if (isReferenceResource) {
                  // Reference resources bypass patient compartment filtering
                  // The scope check (isResourceScopeAuthorized) already verified access
                  mongoQuery = searchQuery;
                  console.log('POST _search: Reference resource - no patient compartment filter applied for:', routeResourceType);
                } else {
                  // Apply authorization filters
                  let authQuery = {$or: [
                    {'meta.security.display': {$eq: 'unrestricted'}}
                  ]};

                  if(routeResourceType === "Patient"){
                    if(get(authorizationContext, 'patientId')){
                      authQuery.$or.push({'id': get(authorizationContext, 'patientId')});
                    }
                  } else {
                    // FHIR resources use different reference paths for patients:
                    // - Some use 'subject.reference' (Observation, Condition, Procedure, DiagnosticReport, etc.)
                    // - Some use 'patient.reference' (AllergyIntolerance, CarePlan, CareTeam, Encounter, Immunization, MedicationRequest, etc.)
                    // - Coverage uses 'beneficiary.reference'
                    // References may be stored as: Patient/uuid, urn:uuid:uuid, or just uuid
                    if(get(authorizationContext, 'patientId')){
                      let patientId = get(authorizationContext, 'patientId');
                      let patientRefs = [
                        patientId,
                        'Patient/' + patientId,
                        'urn:uuid:' + patientId
                      ];
                      authQuery.$or.push({'subject.reference': { $in: patientRefs }});
                      authQuery.$or.push({'patient.reference': { $in: patientRefs }});
                      authQuery.$or.push({'beneficiary.reference': { $in: patientRefs }});
                    }
                  }

                  // Merge authorization query with search query
                  if(Object.keys(searchQuery).length > 0){
                    mongoQuery = { $and: [searchQuery, authQuery] };
                  } else {
                    mongoQuery = authQuery;
                  }

                  if(get(Meteor, 'settings.private.debug') === true) {
                    console.log('POST _search mongoQuery with auth:', JSON.stringify(mongoQuery, null, 2));
                  }
                }

                console.log('POST _search DEBUG - final mongoQuery:', JSON.stringify(mongoQuery));
                matchingRecords = await Collections[collectionName].find(mongoQuery, {limit: searchLimit}).fetch();
                console.log('POST _search DEBUG - matchingRecords count:', matchingRecords.length);
                console.log('matchingRecords', matchingRecords);

                for (let record of matchingRecords) {
                  // Resolve conditional references for CareTeam (e.g., Practitioner?identifier=...)
                  if (routeResourceType === 'CareTeam') {
                    record = await RestHelpers.resolveConditionalReferences(record);
                  }

                  // check for security labels; otherwise assume normal access patterns
                  let recordSecurityLevel = get(record, 'meta.security[0].display', 'normal');
  
                  let accessGranted = false;
                  let permission;
  
                  if (get(Meteor, 'settings.private.fhir.disableAccessControl') === true) {
                    accessGranted = true;
                  } else {
                    permission = acl.can(userRole).execute('access').with({'securityLevel': recordSecurityLevel}).sync().on(routeResourceType);
                    console.log('permission.granted: ' + permission.granted);
  
                    accessGranted = permission.granted;
                  }
  
                  if(accessGranted){                  
                      payload.push({
                      fullUrl: routeResourceType + "/" + get(record, 'id'),
                      resource: RestHelpers.prepForFhirTransfer(record),
                      request: {
                        method: "POST",
                        url: '/' + fhirPath + '/' + routeResourceType + '/' + JSON.stringify(req.query)
                      },
                      response: {
                        status: "200"
                      }
                    });
                  }
                }

                console.log('payload', payload);
  
                // Success
                res.status(200).json(Bundle.generate(payload));
  
              //==============================================================================
              // this is operator logic, and will probably need to go into a switch statement
  
              // post /Organization/$match
              } else if (req.params.param.includes('$match')) {
                console.log("$MATCH!!!!");
  
                console.log('req.body.name', get(req, 'body.name'));
  
                let generatedQuery = {};
                let weighting = 0;
  
                // full name - weighting: .50
                if(typeof get(req, 'body.name') === "string"){
                  weighting = .5;
                  generatedQuery["name"] = {$regex: get(req, 'body.name')}
                }               
  
                // full name - weighting: .50
                if(typeof get(req, 'body.name[0].text') === "string"){
                  weighting = .5;
                  generatedQuery["name.text"] = {$regex: get(req, 'body.name[0].text')}
                }               
  
                // NPI number - weighting: .99
                if(typeof get(req, 'body.identifier[0].value') === "string"){
                  weighting = .99;
                  generatedQuery["identifier.value"] = get(req, 'body.identifier[0].value')
                } 
                
  
                console.log('generatedQuery', generatedQuery);
                matchingRecords = await Collections[collectionName].find(generatedQuery).fetch();
                console.log('matchingRecords.length', matchingRecords.length);
  
                let payload = [];
  
                if(matchingRecords.length === 0 ){
                  res.status(400).json({
                    "resourceType": "OperationOutcome",
                    "severity": "warning",
                    "code": "invalid",
                    "details": {
                      "text": "No Resource found matching the query",
                      "coding": {
                        "system": "http://terminology.hl7.org/CodeSystem/operation-outcome",
                        "value": "MSG_NO_MATCH",
                        "display": "No Resource found matching the query"
                      }
                    }                
                  });
                } else {
                  matchingRecords.forEach(function(record){
                    // console.log('record', get(record, 'name'))
  
                    record.extension = [{
                      url: "https://build.fhir.org/ig/HL7/fhir-directory-attestation/match-quality",
                      valueDecimal: weighting
                    }];
  
                    delete record.text;
  
  
                    payload.push({
                      fullUrl: routeResourceType + "/" + get(record, 'id'),
                      resource: RestHelpers.prepForFhirTransfer(record),
                      request: {
                        method: "POST",
                        url: '/' + fhirPath + '/' + routeResourceType + '/' + JSON.stringify(req.query)
                      },
                      response: {
                        status: "200"
                      }
                    });
                  });
    
                  console.log('payload', payload);
  
                  let payloadBundle = Bundle.generate(payload);
                  
    
                  // Success
                  res.status(200).json(payloadBundle)
                }
              } 

            } else {
              // Unauthorized
              res.status(401).json()
            }            
          }
        });

        // Search Interaction
        WebApp.handlers.get("/" + fhirPath + "/" + routeResourceType + "/:param", async (req, res) => {
          if(get(Meteor, 'settings.private.debug') === true) { console.log('-----------------------------------------------------------------------------'); }
          if(get(Meteor, 'settings.private.debug') === true) { console.log('??? GET /' + fhirPath + '/' + routeResourceType + '?' + JSON.stringify(req.query)); }
          if(get(Meteor, 'settings.private.debug') === true) { console.log('params', req.params); }


          logToInboundQueue(req);
          
          process.env.DEBUG && console.log('--------------------------------------')
          process.env.DEBUG && console.log('Checking for chained queries (GET)....')
          process.env.DEBUG && console.log('req.query', req.query);
          
          const gotToken = limiter.tryRemoveTokens(1);
          if (!gotToken) {
            res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"})
          } else {
            Object.keys(req.query).forEach(function(key){
              let result = 0;
              let queryParts = key.split(".");
              if(Array.isArray(queryParts)){
                result = queryParts.length;
                if(queryParts.length === 2){
                  
                }
              }
  
              return result;
            })
  
            res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
  
            let authorizationContext = await parseUserAuthorization(req)
            if (await isAuthorized(authorizationContext)){
  
              let resourceRecords = [];
  
              if (req.params.param.includes('_search')) {
                let searchLimit = 1;
                if (get(req, 'query._count')) {
                  searchLimit = parseInt(get(req, 'query._count'));
                }
                let databaseQuery = RestHelpers.generateMongoSearchQuery(req.query, routeResourceType);
                if(get(Meteor, 'settings.private.debug') === true) { console.log('Generated the following query for the ' + routeResourceType + ' collection.', databaseQuery); }
  
                resourceRecords = await Collections[collectionName].find(databaseQuery, {limit: searchLimit}).fetch();
  
                let payload = [];
  
                resourceRecords.forEach(function(record){
  
                  // check for security labels; otherwise assume normal access patterns
                  let recordSecurityLevel = get(record, 'meta.security[0].display', 'normal');
                  
                  let accessGranted = false;
                  let permission;
  
                  if (get(Meteor, 'settings.private.fhir.disableAccessControl') === true) {
                    accessGranted = true;
                  } else {
                    permission = acl.can(userRole).execute('access').with({'securityLevel': recordSecurityLevel}).sync().on(routeResourceType);
                    console.log('permission.granted: ' + permission.granted);
  
                    accessGranted = permission.granted;
                  }
  
                  if(accessGranted){
                    payload.push({
                      fullUrl: routeResourceType + "/" + get(record, 'id'),
                      resource: RestHelpers.prepForFhirTransfer(record)
                    });  
                  }                                
                });
              }
  
              // Success
              res.status(200).json(Bundle.generate(payload))

            } else {
              // Unauthorized
              res.status(401).json()
            } 
          }
        });
      }

      
    }
  });

  // Special FHIR Operations
  // Patient/$everything operation
  // https://www.hl7.org/fhir/patient-operation-everything.html
  WebApp.handlers.get("/" + fhirPath + "/Patient/:id/$everything", async (req, res) => {
    if(get(Meteor, 'settings.private.debug') === true) { 
      console.log('> GET /' + fhirPath + '/Patient/' + req.params.id + '/$everything'); 
    }

    logToInboundQueue(req);

    res.setHeader("content-type", 'application/fhir+json;charset=utf-8');
    res.setHeader("ETag", fhirVersion);

    const gotToken = limiter.tryRemoveTokens(1);
    if (!gotToken) {
      res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"});
      return;
    }

    try {
      // Parse authorization
      let authorizationContext = await parseUserAuthorization(req);
      if (!isAuthorized(authorizationContext)) {
        res.status(403).json({
          resourceType: "OperationOutcome",
          issue: [{
            severity: "error",
            code: "forbidden",
            diagnostics: "Access denied"
          }]
        });
        return;
      }

      const patientId = get(req, 'params.id');
      
      // First, verify the patient exists
      const patient = await Collections.Patients.findOneAsync({id: patientId});
      if (!patient) {
        res.status(404).json({
          resourceType: "OperationOutcome",
          issue: [{
            severity: "error",
            code: "not-found",
            diagnostics: `Patient with id ${patientId} not found`
          }]
        });
        return;
      }

      // Check if user has access to this patient
      const userRole = get(authorizationContext, 'role');
      const userId = get(authorizationContext, 'userId');
      const userPatientId = get(authorizationContext, 'patientId');
      
      // Access control: user can only access their own patient record unless they have elevated privileges
      const elevatedRoles = ['noauth', 'healthcare provider', 'healthcare practitioner', 'SYSTEM', 'admin'];
      const hasElevatedAccess = elevatedRoles.includes(userRole);
      
      if (!hasElevatedAccess && userPatientId !== patientId) {
        res.status(403).json({
          resourceType: "OperationOutcome",
          issue: [{
            severity: "error",
            code: "forbidden",
            diagnostics: "You can only access your own patient record"
          }]
        });
        return;
      }
      
      // Log HIPAA audit event for non-patient access
      if (hasElevatedAccess && userPatientId !== patientId) {
        const practitionerId = get(authorizationContext, 'practitionerId');
        console.log(`[HIPAA AUDIT] $everything access: User ${userId} (role: ${userRole}, practitioner: ${practitionerId}) accessed Patient/${patientId}`);
        
        // Create formal AuditEvent record
        try {
          const auditEvent = {
            resourceType: "AuditEvent",
            type: {
              system: "http://terminology.hl7.org/CodeSystem/audit-event-type",
              code: "rest",
              display: "RESTful Operation"
            },
            subtype: [{
              system: "http://hl7.org/fhir/restful-interaction",
              code: "operation",
              display: "$everything"
            }],
            action: "R", // Read
            recorded: new Date().toISOString(),
            outcome: "0", // Success
            agent: [{
              type: {
                coding: [{
                  system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                  code: userRole === 'healthcare practitioner' ? "PROV" : "CST",
                  display: userRole === 'healthcare practitioner' ? "Provider" : "Custodian"
                }]
              },
              who: {
                reference: practitionerId ? `Practitioner/${practitionerId}` : `User/${userId}`,
                display: `${userRole} user`
              },
              requestor: true
            }],
            source: {
              observer: {
                display: "Honeycomb FHIR Server"
              }
            },
            entity: [{
              what: {
                reference: `Patient/${patientId}`
              },
              type: {
                system: "http://terminology.hl7.org/CodeSystem/audit-entity-type",
                code: "1",
                display: "Person"
              },
              role: {
                system: "http://terminology.hl7.org/CodeSystem/object-role",
                code: "1",
                display: "Patient"
              }
            }]
          };
          
          // Store audit event asynchronously (don't block the response)
          if (AuditEvents) {
            AuditEvents.insertAsync(auditEvent).catch(err => {
              console.error('[HIPAA AUDIT] Failed to store AuditEvent:', err);
            });
          }
        } catch (error) {
          console.error('[HIPAA AUDIT] Error creating AuditEvent:', error);
        }
      }

      // Initialize the bundle
      const bundle = {
        resourceType: "Bundle",
        type: "searchset",
        timestamp: new Date().toISOString(),
        total: 0,
        link: [{
          relation: "self",
          url: `${get(Meteor, 'settings.public.fhirUrl', 'http://localhost:3000')}/${fhirPath}/Patient/${patientId}/$everything`
        }],
        entry: []
      };

      // Add the patient resource first
      bundle.entry.push({
        fullUrl: `${get(Meteor, 'settings.public.fhirUrl', 'http://localhost:3000')}/${fhirPath}/Patient/${patientId}`,
        resource: RestHelpers.prepForFhirTransfer(patient),
        search: {
          mode: "match"
        }
      });

      // Define the collections to search and their patient reference paths
      const collectionsToSearch = [
        { collection: 'AllergyIntolerances', paths: ['patient.reference'] },
        { collection: 'Observations', paths: ['subject.reference'] },
        { collection: 'Conditions', paths: ['subject.reference'] },
        { collection: 'Procedures', paths: ['subject.reference'] },
        { collection: 'Encounters', paths: ['subject.reference', 'patient.reference'] },
        { collection: 'MedicationOrders', paths: ['patient.reference'] },
        { collection: 'MedicationStatements', paths: ['subject.reference'] },
        { collection: 'Immunizations', paths: ['patient.reference'] },
        { collection: 'CarePlans', paths: ['subject.reference', 'for.reference'] },
        { collection: 'Goals', paths: ['subject.reference', 'for.reference'] },
        { collection: 'DiagnosticReports', paths: ['subject.reference'] },
        { collection: 'DocumentReferences', paths: ['subject.reference'] },
        { collection: 'CareTeams', paths: ['subject.reference', 'patient.reference'] },
        { collection: 'ServiceRequests', paths: ['subject.reference'] },
        { collection: 'RiskAssessments', paths: ['subject.reference'] },
        { collection: 'ClinicalImpressions', paths: ['subject.reference'] },
        { collection: 'FamilyMemberHistories', paths: ['patient.reference'] },
        { collection: 'DeviceUseStatements', paths: ['subject.reference'] },
        { collection: 'Coverages', paths: ['beneficiary.reference'] },
        { collection: 'ExplanationOfBenefits', paths: ['patient.reference'] }
      ];

      // Search all collections in parallel
      const searchPromises = collectionsToSearch.map(async ({ collection, paths }) => {
        if (!Collections[collection]) {
          console.log(`Collection ${collection} not found, skipping...`);
          return [];
        }

        // Build query for all possible patient reference paths
        const orQueries = paths.map(path => {
          const query = {};
          query[path] = { $in: [
            `Patient/${patientId}`,
            `${get(Meteor, 'settings.public.fhirUrl', 'http://localhost:3000')}/${fhirPath}/Patient/${patientId}`,
            patientId  // Some references might just have the ID
          ]};
          return query;
        });

        try {
          // Use find() with fetch() for now until we confirm the async pattern
          const resources = await Collections[collection].find(
            { $or: orQueries },
            { limit: 100 }  // Limit results per resource type
          ).fetch();

          return resources.map(resource => ({
            fullUrl: `${get(Meteor, 'settings.public.fhirUrl', 'http://localhost:3000')}/${fhirPath}/${resource.resourceType}/${resource.id}`,
            resource: RestHelpers.prepForFhirTransfer(resource),
            search: {
              mode: "include"
            }
          }));
        } catch (error) {
          console.error(`Error searching ${collection}:`, error);
          return [];
        }
      });

      // Wait for all searches to complete
      const searchResults = await Promise.all(searchPromises);
      
      // Flatten and add to bundle
      searchResults.forEach(results => {
        bundle.entry.push(...results);
      });

      // Update total
      bundle.total = bundle.entry.length;

      // Add metadata
      bundle.meta = {
        lastUpdated: new Date().toISOString()
      };

      console.log(`Patient/$everything returned ${bundle.total} resources for patient ${patientId}`);
      
      res.status(200).json(bundle);

    } catch (error) {
      console.error('Error in Patient/$everything:', error);
      res.status(500).json({
        resourceType: "OperationOutcome",
        issue: [{
          severity: "error",
          code: "exception",
          diagnostics: "Internal server error processing $everything operation"
        }]
      });
    }
  });

  // =============================================================================
  // BULK DATA EXPORT OPERATIONS
  // =============================================================================
  // Bulk Data endpoints are implemented in server/BulkData.js
  // See that file for: Group/$export, status polling, file download, cancellation
  // =============================================================================

  // Catch-all handler for unmatched FHIR routes
  // This prevents falling through to the Meteor app HTML
  WebApp.handlers.use("/" + fhirPath + "/", async (req, res, next) => {
    // Check if this request has already been handled
    if (res.headersSent) {
      return next();
    }
    
    // Extract the resource type from the URL
    const urlParts = req.url.split('/').filter(part => part);
    const resourceType = urlParts[0]?.split('?')[0]; // Remove query params
    
    console.log(`Unhandled FHIR request: ${req.method} ${req.url}`);
    
    res.setHeader('Content-Type', 'application/fhir+json;charset=utf-8');
    res.statusCode = 404;
    res.end(JSON.stringify({
      resourceType: "OperationOutcome",
      issue: [{
        severity: "error",
        code: "not-found",
        details: {
          text: resourceType 
            ? `Resource type '${resourceType}' is not supported or not configured on this server`
            : `Invalid FHIR endpoint: ${req.url}`
        },
        diagnostics: "This endpoint is not available. Check the server's CapabilityStatement for supported resources and operations."
      }]
    }, null, 2));
  });

  console.log('FHIR Server is online.');
} else {
  console.log('FHIR Server is offline.  Settings file and route manifest not available.');
  WebApp.handlers.get("/" + fhirPath + "/" + routeResourceType, async (req, res) => {
    res.status(501).json();
  });
}
