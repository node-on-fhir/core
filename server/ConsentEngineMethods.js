import { get, has } from 'lodash';
import { Meteor } from 'meteor/meteor';

import { Consents } from '../imports/lib/schemas/SimpleSchemas/Consents';
import { ValueSets } from '../imports/lib/schemas/SimpleSchemas/ValueSets';
import { CodeSystems } from '../imports/lib/schemas/SimpleSchemas/CodeSystems';


Meteor.startup(function(){
  if(process.env.INITIALIZE_CONSENT_ENGINE){
      Meteor.call('initConsentInfrastructure')
  }
}, [])  


Meteor.methods({
  saveConsent: function(updatedConsent){
    console.log('Meteor.methods.saveConsent', updatedConsent)
    if(updatedConsent){
      Consents.insert(updatedConsent)
    }
  },
  revokeConsent: function(consentId){
    console.log('Meteor.methods.revokeConsent', consentId)
    if(consentId){
      Consents.remove({_id: consentId})
    }
  },
  initConsentInfrastructure: function(){
    console.warn('Initializing consent engine infrastructure....')

    Meteor.call('initConsentEngineCodeSystems');
    Meteor.call('initConsentEngineAccessControlList');

    // Meteor.call('initConsentEngineValueSets');
  },
  initConsentEngineCodeSystems: async function(){
      console.log("Initializing code systems....");

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

      codeSystemsArray.forEach(async function(codeSystem){
          if(get(codeSystem, 'resourceType') === "CodeSystem"){
              if(! await CodeSystems.findOneAsync({id: get(codeSystem, 'id')})){
                  await CodeSystems.insertAsync(codeSystem)
              }
          }
      })

  },
  initConsentEngineAccessControlList: async function(){
    console.log("Init access control list....");
    

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
      
      consentsArray.forEach(async function(consent){
          if(get(consent, 'resourceType') === "Consent"){
            await Consents.upsertAsync({id: get(consent, 'id')}, {$set: consent}, {filter: false, validate: false})
              // if(! await Consents.findOneAsync({id: get(consent, 'id')})){
              //     await Consents.insertAsync(consent, {filter: false, validate: false})
              // }
          }
      })
  },
  initConsentEngineValueSets: async function(){
    console.log("Init value sets....");

    let valueSetAccessibility = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-accessibility.json'));

    let valueSetsArray = [
        valueSetAccessibility   
    ];
    
    valueSetsArray.forEach(async function(valueSet){
        if(get(valueSet, 'resourceType') === "ValueSet"){
            if(! await ValueSets.findOneAsync({id: get(valueSet, 'id')})){
                await ValueSets.insertAsync(valueSet, {filter: false, validate: false})
            }
        }
    })
  }
})

Meteor.startup(function(){
  Meteor.call('initConsentEngineCodeSystems')
})