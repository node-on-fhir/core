
import { Meteor } from 'meteor/meteor';
import { WebApp } from "meteor/webapp";

// Imported directly (not via the Meteor.ServerMethods global) because this
// module is loaded from server/main.js BEFORE server/rpc/rpcSetup.js runs.
import ServerMethods from '/imports/lib/ServerMethods.js';

import { Organizations } from '../imports/lib/schemas/SimpleSchemas/Organizations';
import { Practitioners } from '../imports/lib/schemas/SimpleSchemas/Practitioners';
import { Endpoints } from '../imports/lib/schemas/SimpleSchemas/Endpoints';
import { Networks } from '../imports/lib/schemas/SimpleSchemas/Networks';
import { InsurancePlans } from '../imports/lib/schemas/SimpleSchemas/InsurancePlans';
import { Locations } from '../imports/lib/schemas/SimpleSchemas/Locations';
import { HealthcareServices } from '../imports/lib/schemas/SimpleSchemas/HealthcareServices';
import { OrganizationAffiliations } from '../imports/lib/schemas/SimpleSchemas/OrganizationAffiliations';
import { PractitionerRoles } from '../imports/lib/schemas/SimpleSchemas/PractitionerRoles';

import { get } from 'lodash';

WebApp.handlers.get("/cds-services", async (req, res) => {

  console.log('GET ' + '/cds-service');

  console.log("Organizations", Organizations)

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");

  let listOfServices = [];

  let returnPayload = {
    code: 200,
    data: listOfServices
  }

  console.log('Publishing CDS Hooks Services...')
 
  res.json(returnPayload);
});



WebApp.handlers.post("/cds-services/{id}", async (req, res) => {

  console.log('POST /cds-services/{id}');

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*"); 

  console.log("");
  console.log(req);
  console.log(req.body);
  console.log(req.content);
  console.log(req.payload);
  console.log("");

  let returnPayload = {
    code: 200,
    data: {}
  }      
  console.log('Signing software statement...')       
  res.json(returnPayload);
});



// requireAuth note: both proxy methods historically had NO auth guard.
// They proxy outbound requests to the configured CDS Hooks service and are
// invoked from the signed-in CdsHooksDebugger page, so requireAuth now
// applies (the default) — behavior change from the pre-migration guard-less
// state.

ServerMethods.define('cdsHooks.discoverServices', {
  description: 'Proxy a CDS Hooks service discovery request to the configured CDS Hooks server',
  aliases: ['proxyDiscoverCdsServices'],
  positionalParams: ['patientId'],
  schemaObject: {
    type: 'object',
    properties: { patientId: { type: 'string' } }
  }
}, async function(params, context){

  // let cdsHooksServiceUrl = get(Meteor, 'settings.public.smartOnFhir[0].cdsHooksServices', "http://localhost:3000") + "/cds-services";
  let cdsHooksServiceUrl = get(Meteor, 'settings.public.smartOnFhir[0].cdsHooksServices', "http://localhost:3000");

  context.log.info('discovering hooks...', { url: cdsHooksServiceUrl });

  return await fetch(cdsHooksServiceUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(function(response){
    return response.json();
  })
  .then(data => {
    context.log.debug('cdsHooksService.data', { data: data });
    return data;
  }).catch((error) => {
    context.log.error('CDS Hooks discovery failed', { message: error.message });
  });
});

ServerMethods.define('cdsHooks.fetchHook', {
  description: 'Invoke a discovered CDS Hooks service with patient context and prefetch data',
  aliases: ['proxyFetchCdsHook'],
  phi: true,   // forwards the selected Patient resource as prefetch data
  positionalParams: ['hook', 'patientId', 'selectedPatient'],
  schemaObject: {
    type: 'object',
    properties: {
      hook: { type: 'object' },
      // null-tolerant: legacy positional callers may pass undefined/null
      // when no patient is selected (DDP serializes undefined -> null)
      patientId: { type: ['string', 'null'] },
      selectedPatient: { type: ['object', 'null'] }
    },
    required: ['hook']
  }
}, async function(params, context){
  let hook = params.hook;
  let patientId = params.patientId;
  let selectedPatient = params.selectedPatient;

  let cdsHooksServiceUrl = get(Meteor, 'settings.public.smartOnFhir[0].cdsHooksServices', "http://localhost:3000") + "/" + get(hook, 'id');

  context.log.info('posting to hook...', { url: cdsHooksServiceUrl, hookId: get(hook, 'id') });

  let payload = {
    hook: get(hook, "hook"),
    hookInstance: get(hook, "id"),
    // fhirServer: get(hook, "fhirServer"),
    // fhirAuthorization: get(hook, "fhirAuthorization"),
    // patientId: get(hook, "patientId"),
    context: {
      patientId: "Patient/" + patientId
    },
    prefetch: {}
  }


  if(get(hook, 'prefetch')){
    Object.keys(get(hook, 'prefetch')).forEach(function(key) {
      if(hook.prefetch[key] === "Patient/{{context.patientId}}"){
        payload.prefetch.patient = selectedPatient
      }
    });
  }

  context.log.debug('payload assembled', { data: payload });

  return await fetch(cdsHooksServiceUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  }).then(function(response){
    return response.json();
  })
  .then(data => {
    context.log.debug('cdsHooksService.data', { data: data });
    return data;
  }).catch((error) => {
    context.log.error('CDS Hooks invocation failed', { message: error.message });
  });
});
