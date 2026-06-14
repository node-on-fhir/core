
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { get, concat } from 'lodash';

let Conditions;
let Encounters;
let Immunizations;
let MedicationRequests;
let Patients;
let Procedures;

Meteor.startup(function(){
  Conditions = Meteor.Collections.Conditions;
  Encounters = Meteor.Collections.Encounters;
  Immunizations = Meteor.Collections.Immunizations;
  MedicationRequests = Meteor.Collections.MedicationRequests;
  Patients = Meteor.Collections.Patients;
  Procedures = Meteor.Collections.Procedures;
});


const Helpers = {
  ingestQuestionnaire: function(record){
    console.log("Ingesting questionnaire...", record);
    
    if(get(record, 'resourceType') === "Bundle"){
      if(Array.isArray(get(record, 'entry'))){
        record.entry.forEach(function(entry){
          if(get(entry, 'resource.resourceType') === "Questionnaire"){
            Questionnaires.upsert({id: get(entry, 'resource.id')}, {$set: get(entry, 'resource')}, {filter: false, validate: false}, function(){});                              
          }
        });
      }

    } else if(get(record, 'resourceType') === "Questionnaire"){
      Questionnaires.upsert({id: get(record, 'id')}, {$set: record}, {filter: false, validate: false}, function(){});                          
    }
  },
  selectMedicalHistory: async function(callback){
    console.log('selectMedicalHistory')

    let medicalHistory = {
      resourceType: "Bundle",
      type: "collection",
      entry: []
    }

    let conditions = await Conditions.find().map(function(condition){
      delete condition._id;
      delete condition._document;

      let result = {
        fullUrl: 'Condition/' + get(condition, 'id'),
        resource: condition
      }
      return result;

      // return get(condition, 'resource');
      // return condition;
    });

    let encounters = await Encounters.find().map(function(encounter){
      delete encounter._id;
      delete encounter._document;
      // return get(encounter, 'resource');
      // return encounter;

      let result = {
        fullUrl: 'Encounter/' + get(encounter, 'id'),
        resource: encounter
      }
      return result;

    });

    let medicationRequests = MedicationRequests.find().map(function(medicationRequest){
      delete medicationRequest._id;
      delete medicationRequest._document;
      // return get(medicationRequest, 'resource');
      // return medicationRequest;

      let result = {
        fullUrl: 'MedicationRequest/' + get(medicationRequest, 'id'),
        resource: medicationRequest
      }
      return result;

    });

    let immunizations = await Immunizations.find().map(function(immunization){
      delete immunization._id;
      delete immunization._document;
      // return get(immunization, 'resource');
      // return immunization;

      let result = {
        fullUrl: 'Immunization/' + get(immunization, 'id'),
        resource: immunization
      }
      return result;
    });      

    let patients = Patients.find().map(function(patient){
      delete patient._id;
      delete patient._document;
      // return get(patient, 'resource');
      // return patient;

      let result = {
        fullUrl: 'Patient/' + get(patient, 'id'),
        resource: patient
      }
      return result;

    });
    let procedures = await Procedures.find().map(function(procedure){
      delete procedure._id;
      delete procedure._document;
      // return get(procedure, 'resource');
      // return procedure;

      let result = {
        fullUrl: 'Procedure/' + get(procedure, 'id'),
        resource: procedure
      }
      return result;
    });


    console.log('conditions', conditions);
    console.log('encounters', encounters);
    console.log('immunizations', immunizations);
    console.log('medicationRequests', medicationRequests);
    console.log('patients', patients);
    console.log('procedures', procedures);

    // medicalHistory.entry = concat(medicalHistory.entry, claims);
    // medicalHistory.entry = concat(medicalHistory.entry, diagnosticReports);
    // medicalHistory.entry = concat(medicalHistory.entry, documentReferences);
    // medicalHistory.entry = concat(medicalHistory.entry, medications);
    // medicalHistory.entry = concat(medicalHistory.entry, medicationAdministrations);

    // medicalHistory.entry = concat(medicalHistory.entry, get(conditions[0], 'resource.entry', []));
    // medicalHistory.entry = concat(medicalHistory.entry, get(encounters[0], 'resource.entry', [])); 
    // medicalHistory.entry = concat(medicalHistory.entry, get(immunizations[0], 'resource.entry', []));
    // medicalHistory.entry = concat(medicalHistory.entry, get(medicationRequests[0], 'resource.entry', []));
    // medicalHistory.entry = concat(medicalHistory.entry, get(patients[0], 'resource.entry', []));
    // medicalHistory.entry = concat(medicalHistory.entry, get(procedures[0], 'resource.entry', []));

    medicalHistory.entry = concat(medicalHistory.entry, conditions);
    medicalHistory.entry = concat(medicalHistory.entry, encounters); 
    medicalHistory.entry = concat(medicalHistory.entry, immunizations);
    medicalHistory.entry = concat(medicalHistory.entry, medicationRequests);
    medicalHistory.entry = concat(medicalHistory.entry, patients);
    medicalHistory.entry = concat(medicalHistory.entry, procedures);

    // kludgy, but it gets the job done
    medicalHistory.total = medicalHistory.entry.length;
    console.log('medicalHistory', medicalHistory)

    Session.set('exportBuffer', medicalHistory);

    if(typeof callback === "function"){
      await callback(medicalHistory);
    } 

    return medicalHistory;
  },
  parseResourcesIntoStrings: async function(bundle){
    let parsedBundle;
    if(typeof bundle === "string"){
      parsedBundle = JSON.parse(bundle);
    } else if (typeof bundle === "object"){
      parsedBundle = bundle;
    }

    let relayUrl = get(Meteor, 'settings.public.interfaces.fhirServer.channel.endpoint', "")

    if(typeof parsedBundle === "object"){
      await Meteor.call('proxyBundleToString', relayUrl, parsedBundle, function(error, result){
        if(error){
          console.error('error', error)
          Session.set('dataFetchError', error);
        }
        if(result){
          console.log('result', result)
  
          Session.set('textNormalForm', get(result, 'data.text'));
  
          // let newResource;
          // if(get(result, 'data.text')){
          //   newResource = get(resource, 'resource')
          //   newResource.text = {
          //     div: get(result, 'data.text')
          //   };
          //   Session.set('textNormalForm', JSON.stringify(newResource, null, 2));
          // } else if(get(result, 'data.text.div')){
          //   newResource = get(resource, 'resource')
          //   newResource.text = {
          //     div: get(result, 'data.text.div')
          //   };
          //   Session.set('textNormalForm', JSON.stringify(newResource, null, 2));
          // }
        }
      })
    } 
  },
  createNarrativeSummary: function(ndjsonString){

    let relayUrl = get(Meteor, 'settings.public.interfaces.fhirServer.channel.endpoint', "")

    relayUrl = "http://tiresias:8081/tostring";

    console.log('Initiating Python pipeline');
    console.log(ndjsonString);
    console.log("Relay URL: " + JSON.stringify(relayUrl))
    
    Meteor.call('proxyToString', relayUrl, ndjsonString, function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', result)

        if(get(result, 'data.text')){
          Session.set('textNormalForm', result.data.text);
        } else if(get(result, 'data.text.div')){
          Session.set('textNormalForm', result.data.text.div);
        }
      }
    })
  }
}

export default Helpers;