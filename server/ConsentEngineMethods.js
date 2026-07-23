import { get, has } from 'lodash';
import { Meteor } from 'meteor/meteor';

import { Consents } from '../imports/lib/schemas/SimpleSchemas/Consents';
import { ValueSets } from '../imports/lib/schemas/SimpleSchemas/ValueSets';
import { CodeSystems } from '../imports/lib/schemas/SimpleSchemas/CodeSystems';

import { initializeAccessControl } from './lib/FhirAuth.js';

// Imported directly (not via the Meteor.ServerMethods global) because this
// module is loaded from server/main.js BEFORE server/rpc/rpcSetup.js runs.
import ServerMethods from '/imports/lib/ServerMethods.js';

const log = (Meteor.Logger ? Meteor.Logger.for('ConsentEngine') : console);

// ---------------------------------------------------------------------------
// Seeding bodies live in plain functions so the Meteor.startup boot path can
// invoke them DIRECTLY (no user context at startup — routing through the RPC
// pipeline would trip the requireAuth check).

async function initConsentEngineCodeSystems(){
  log.info('Initializing consent engine code systems....');

  let contractsignertypecodes = JSON.parse(await Assets.getTextAsync('CodeSystems/CodeSystem-contractsignertypecodes.json'));
  let practitionerRoles = JSON.parse(await Assets.getTextAsync('CodeSystems/CodeSystem-practitioner-role.json'));
  let resourceTypes = JSON.parse(await Assets.getTextAsync('CodeSystems/CodeSystem-resource-types.json'));
  let actCode = JSON.parse(await Assets.getTextAsync('CodeSystems/CodeSystem-v3-ActCode.json'));
  let confidentiality = JSON.parse(await Assets.getTextAsync('CodeSystems/CodeSystem-v3-Confidentiality-flattened.json'));
  let observationValue = JSON.parse(await Assets.getTextAsync('CodeSystems/CodeSystem-v3-ObservationValue.json'));
  let participationType = JSON.parse(await Assets.getTextAsync('CodeSystems/CodeSystem-v3-ParticipationType.json'));
  let roleClass = JSON.parse(await Assets.getTextAsync('CodeSystems/CodeSystem-v3-RoleClass-flattened.json'));
  let roleCode = JSON.parse(await Assets.getTextAsync('CodeSystems/CodeSystem-v3-RoleCode.json'));

  let codeSystemsArray = [
    contractsignertypecodes,
    practitionerRoles,
    resourceTypes,
    actCode,
    confidentiality,
    observationValue,
    participationType,
    roleClass,
    roleCode
  ];

  for (const codeSystem of codeSystemsArray) {
    if(get(codeSystem, 'resourceType') === "CodeSystem"){
      if(! await CodeSystems.findOneAsync({id: get(codeSystem, 'id')})){
        await CodeSystems.insertAsync(codeSystem)
      }
    }
  }
}

async function initConsentEngineAccessControlList(){
  log.info('Init access control list....');

  let ConsentAnonOrg = JSON.parse(await Assets.getTextAsync('AccessControlListDefaults/ConsentAnonOrg.json'));
  let ConsentAnonPatient = JSON.parse(await Assets.getTextAsync('AccessControlListDefaults/ConsentAnonPatient.json'));
  let ConsentAnonPractitioner = JSON.parse(await Assets.getTextAsync('AccessControlListDefaults/ConsentAnonPractitioner.json'));
  let ConsentClinicianOrg = JSON.parse(await Assets.getTextAsync('AccessControlListDefaults/ConsentClinicianOrg.json'));
  let ConsentClinicianPatient = JSON.parse(await Assets.getTextAsync('AccessControlListDefaults/ConsentClinicianPatient.json'));
  let ConsentPatientOwner = JSON.parse(await Assets.getTextAsync('AccessControlListDefaults/ConsentPatientOwner.json'));
  let ConsentSystemPatient = JSON.parse(await Assets.getTextAsync('AccessControlListDefaults/ConsentSystemPatient.json'));
  let ConsentCitizenPublic = JSON.parse(await Assets.getTextAsync('AccessControlListDefaults/ConsentCitizenPublic.json'));

  let consentsArray = [
      ConsentAnonOrg,
      ConsentAnonPatient,
      ConsentAnonPractitioner,
      ConsentClinicianOrg,
      ConsentClinicianPatient,
      ConsentPatientOwner,
      ConsentSystemPatient,
      ConsentCitizenPublic
  ];

  for (const consent of consentsArray) {
      if(get(consent, 'resourceType') === "Consent"){
        await Consents.upsertAsync({id: get(consent, 'id')}, {$set: consent}, {filter: false, validate: false})
      }
  }

  // Re-initialize ACL now that consent records are in the database
  log.info('Consent records loaded, re-initializing access control...');
  initializeAccessControl();
}

async function initConsentEngineValueSets(){
  log.info('Init consent engine value sets....');

  let valueSetAccessibility = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-accessibility.json'));

  let valueSetsArray = [
      valueSetAccessibility
  ];

  for (const valueSet of valueSetsArray) {
      if(get(valueSet, 'resourceType') === "ValueSet"){
          if(! await ValueSets.findOneAsync({id: get(valueSet, 'id')})){
              await ValueSets.insertAsync(valueSet, {filter: false, validate: false})
          }
      }
  }
}

async function initConsentInfrastructure(){
  log.warn('Initializing consent engine infrastructure....');

  await initConsentEngineCodeSystems();
  await initConsentEngineAccessControlList();

  // await initConsentEngineValueSets();
}

Meteor.startup(async function(){
  if(process.env.INITIALIZE_CONSENT_ENGINE){
      await initConsentInfrastructure();
  }
})

// ---------------------------------------------------------------------------
// ServerMethods registry
//
// requireAuth note: every method here historically had NO auth guard. They
// all mutate server data (consent records / seed data), so requireAuth now
// applies (the default) — behavior change from the pre-migration guard-less
// state. The startup seeding path above calls the plain functions directly
// and is unaffected.

ServerMethods.define('consents.save', {
  description: 'Insert a FHIR Consent resource into the Consents collection',
  aliases: ['saveConsent'],
  phi: true,   // patient consent records
  // Legacy callers pass the Consent resource as a single positional object,
  // which the DDP shim hands through as the params object itself.
  schemaObject: { type: 'object' }
}, async function(params, context){
  const updatedConsent = params;
  context.log.info('consents.save', { data: { id: get(updatedConsent, 'id') } });
  if(updatedConsent && Object.keys(updatedConsent).length > 0){
    // Meteor v3: async insert (the legacy sync Consents.insert no longer
    // exists on the server)
    return await Consents.insertAsync(updatedConsent);
  }
});

ServerMethods.define('consents.revoke', {
  description: 'Remove a Consent record by its MongoDB _id (revocation)',
  aliases: ['revokeConsent'],
  phi: true,   // patient consent records
  positionalParams: ['consentId'],
  schemaObject: {
    type: 'object',
    properties: { consentId: { type: 'string' } },
    required: ['consentId']
  }
}, async function(params, context){
  context.log.info('consents.revoke', { data: { consentId: params.consentId } });
  if(params.consentId){
    // Meteor v3: async remove (the legacy sync Consents.remove no longer
    // exists on the server)
    return await Consents.removeAsync({_id: params.consentId});
  }
});

ServerMethods.define('consentEngine.initInfrastructure', {
  description: 'Seed the consent engine code systems and access control list defaults',
  aliases: ['initConsentInfrastructure']
}, async function(params, context){
  return await initConsentInfrastructure();
});

ServerMethods.define('consentEngine.initCodeSystems', {
  description: 'Load the bundled consent engine CodeSystem resources into the database',
  aliases: ['initConsentEngineCodeSystems']
}, async function(params, context){
  return await initConsentEngineCodeSystems();
});

ServerMethods.define('consentEngine.initAccessControlList', {
  description: 'Load the default access control Consent records and re-initialize the ACL',
  aliases: ['initConsentEngineAccessControlList']
}, async function(params, context){
  return await initConsentEngineAccessControlList();
});

ServerMethods.define('consentEngine.initValueSets', {
  description: 'Load the bundled consent engine ValueSet resources into the database',
  aliases: ['initConsentEngineValueSets']
}, async function(params, context){
  return await initConsentEngineValueSets();
});

Meteor.startup(async function(){
  await initConsentEngineCodeSystems();
})
