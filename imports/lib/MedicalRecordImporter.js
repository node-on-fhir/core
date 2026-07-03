import { get, has } from 'lodash';
import { Meteor } from 'meteor/meteor';

const log = (Meteor.Logger ? Meteor.Logger.for('MedicalRecordImporter') : console);

import { resolveConditionalReferencesInBundle } from './ConditionalReferenceResolver.js';

import AllergyIntolerances from './schemas/SimpleSchemas/AllergyIntolerances';
import Conditions from './schemas/SimpleSchemas/Conditions';
// import Claims from './schemas/SimpleSchemas/Claims'
import DiagnosticReports from './schemas/SimpleSchemas/DiagnosticReports';
import Encounters from './schemas/SimpleSchemas/Encounters';
// import ExplanationOfBenefits from './schemas/SimpleSchemas/ExplanationOfBenefits';
import HealthcareServices from './schemas/SimpleSchemas/HealthcareServices';
import Immunizations from './schemas/SimpleSchemas/Immunizations';
import Locations from './schemas/SimpleSchemas/Locations';
import Medications from './schemas/SimpleSchemas/Medications';
import MedicationOrders from './schemas/SimpleSchemas/MedicationOrders';
import MedicationStatements from './schemas/SimpleSchemas/MedicationStatements';
import Observations from './schemas/SimpleSchemas/Observations';
import Patients from './schemas/SimpleSchemas/Patients';
import Practitioners from './schemas/SimpleSchemas/Practitioners';
import Procedures from './schemas/SimpleSchemas/Procedures';
import Questionnaires from './schemas/SimpleSchemas/Questionnaires';
import QuestionnaireResponses from './schemas/SimpleSchemas/QuestionnaireResponses';
import Tasks from './schemas/SimpleSchemas/Tasks';
import ValueSets from './schemas/SimpleSchemas/ValueSets';


//---------------------------------------------------------------------------
// Collections

// this is a little hacky, but it works to access our collections.
// we use to use Mongo.Collection.get(collectionName), but in Meteor 1.3, it was deprecated
// we then started using window[collectionName], but that only works on the client
// so we now take the window and 

let Collections;

if(Meteor.isClient){
  Collections = window;
}
if(Meteor.isServer){
  Collections = {};
  Collections.AllergyIntolerances = AllergyIntolerances;
  Collections.Conditions = Conditions;
  // Collections.Claims = Claims;
  Collections.DiagnosticReports = DiagnosticReports;
  Collections.Encounters = Encounters;
  // Collections.ExplanationOfBenefits = ExplanationOfBenefits;
  Collections.HealthcareServices = HealthcareServices;
  Collections.Immunizations = Immunizations;
  Collections.Locations = Locations;
  Collections.Medications = Medications;
  Collections.MedicationOrders = MedicationOrders;
  Collections.MedicationStatements = MedicationStatements;
  Collections.Observations = Observations;
  Collections.Patients = Patients;
  Collections.Practitioners = Practitioners;
  Collections.Procedures = Procedures;
  Collections.Questionnaires = Questionnaires;
  Collections.QuestionnaireResponses = QuestionnaireResponses;
  Collections.Tasks = Tasks;
  Collections.ValueSets = ValueSets;
}



//---------------------------------------------------------------------------
// Main Application

const MedicalRecordImporter = {
  pluralizeResourceName: function(resourceType){
    var pluralized = '';
    switch (resourceType) {
      case 'Binary':          
        pluralized = 'Binaries';
        break;
      case 'Library':      
        pluralized = 'Libraries';
        break;
      case 'SupplyDelivery':      
        pluralized = 'SupplyDeliveries';
        break;
      case 'ImagingStudy':      
        pluralized = 'ImagingStudies';
        break;        
      case 'FamilyMemberHistory':      
        pluralized = 'FamilyMemberHistories';
        break;        
      case 'ResearchStudy':      
        pluralized = 'ResearchStudies';
        break;        
      default:
        pluralized = resourceType + 's';
        break;
    }

    return pluralized;
  },
  importBundle: function(dataContent, collectionRoot){    
    console.log('MedicalRecordImporter.importBundle()'); // phi-audit: ok
    console.debug('dataContent', dataContent);

    let self = this;

    let parsedResults = {};

    if(typeof dataContent === "string"){
      parsedResults = JSON.parse(dataContent);
    } else if(has(dataContent, 'content')){
      if(typeof dataContent.content === "string"){
        parsedResults = JSON.parse(dataContent.content);
      } else {
        parsedResults = dataContent.content;
      }
    } else {
      parsedResults = dataContent;
    }

    
    if(get(parsedResults, 'resourceType') === "Bundle"){
      console.log('Found a FHIR bundle! There appear to be ' + parsedResults.entry.length + ' resources in the bundle.  Attempting import...')

      // Resolve conditional references (e.g., "Organization?identifier=system|value" -> "Organization/id")
      // This is necessary because Synthea generates conditional references that some FHIR clients cannot parse
      console.log('[MedicalRecordImporter] Resolving conditional references in bundle...');
      parsedResults = resolveConditionalReferencesInBundle(parsedResults);

      // // EXPERIMENTAL:  Send the bundle to the bundle service.  Probablly want to disable this.
      // Meteor.call('proxyInsert', parsedResults, function(error, result){
      //   if(error){
      //     console.error('error', error)
      //   }
      //   if(result){
      //     console.log('result', result)
      //   }
      // })

      // as a Bundle, we know it's going to have an entries array
      // so, we're going to loop through each entry, looking for it's resources
      if(Array.isArray(parsedResults.entry)){
        parsedResults.entry.forEach(function(entry){          
          if(get(entry, 'resource.resourceType')){
            // console.log('Found a ' + get(entry, 'resource.resourceType'));

            var newRecord = entry.resource;
            // console.log('newRecord', newRecord)
  
            if(!newRecord.id){
              if(newRecord._id){
                newRecord.id = entry.resource._id;
              } else {
                let newId = Random.id();
                newRecord.id = newId;
                newRecord._id = newId;
              }
            }
            //console.log("Collections", JSON.stringify(Collections))
            let collectionName = self.pluralizeResourceName(get(entry, 'resource.resourceType'))            

            console.log('collectionName', collectionName)
            if(Meteor.isServer){
              // console.log('Collections', JSON.stringify(Object.keys(Collections)));
              if(Collections[collectionName]){
                console.log('Collections[collectionName]', Collections[collectionName])
                if(!Collections[collectionName].findOne({_id: newRecord._id})){                  
                  //console.log('Couldnt find record; attempting to insert.')
                  let newRecordId = Collections[collectionName]._collection.insert(newRecord, {validate: false, filter: false}, function(error){
                    if(error) {
                      log.phi('insert error', error, { action: 'create' });
                    }
                  });
                  log.debug('New record created', { resourceType: get(entry, 'resource.resourceType'), id: newRecordId });
                }  
              }  
            }


            if(Meteor.isClient){
              // checking if there's a pub/sub
              let subscriptionActivated = false;
              if(has(Meteor, 'connection')){
                Object.keys( Meteor.connection._subscriptions).forEach(function(key) {
                  var record = Meteor.connection._subscriptions[key];
                  if(record.name === collectionName){
                    subscriptionActivated = true;
                  }
                });
                              
                console.log('Trying to generically import the following record', newRecord)
                if(subscriptionActivated){
                  // console.log('Subscription for this resource exists; sending to proxy server to import.')
                  Meteor.call('proxyInsert', entry, function(error, result){
                    if(error){
                      console.error('error', error)
                    }
                    if(result){
                      console.log('result', result)
                    }
                  })
                } else {
                  if(Meteor.isClient){
                    if(window[collectionName]){

                      // May 1st, 2023
                      // unable to import Gravity data from EHR
                      // attempting to implement polling
                      // switched from Meteor.default_connection to Meteor.connection
                      // switched from matching on Task._id to matching on Task.id 
                      
                      if(!window[collectionName]._collection.findOne({id: newRecord.id})){                  
                        //console.log('Couldnt find record; attempting to insert.')
                        let newRecordId = window[collectionName]._collection.insert(newRecord, {validate: false, filter: false}, function(error){
                          if(error) {
                            log.phi('insert error', error, { action: 'create' });
                          }
                        });
                        log.debug('New record created', { resourceType: get(entry, 'resource.resourceType'), id: newRecordId });
                      }  
                    }  
                  }
                }
              } else {
                // this should only be run if there's not a pubsub, and the cursors are effectively running offline
                console.warn('Cursor appears to be offline.')                
              }
            }
          }
        })
      }


    // if it's not an array...
    } else {
      if(Meteor.isClient){
        console.log('parsedResults', parsedResults)
        // console.log('parsedResults.resource.resourceType', get(parsedResults, 'resource.resourceType'))
        // console.log('parsedResults.resource.resourceType.pluralized',self.pluralizeResourceName(get(parsedResults, 'resourceType')))
        // console.log('Collections[parsedResults.resource.resourceType.pluralized]', Collections[self.pluralizeResourceName(get(parsedResults, 'resourceType'))])

        // // Maybe works better on server
        // if(self.pluralizeResourceName(get(parsedResults, 'resource.resourceType'))){
        //   Collections[self.pluralizeResourceName(get(parsedResults, 'resourceType'))].upsert({id: parsedResults.id}, {$set: parsedResults}, {validate: false, filter: false},  function(error){          
        //     if(error) console.log('Collections[self.pluralizeResourceName(dataContent.resourceType))._collection.insert.error', error)
        //   });    
        // } else {
        //   console.log("Couldnt find the " + self.pluralizeResourceName(get(entry, 'resource.resourceType')) + ' collection.  Is it imported?')
        // }

        // This might work better on the client; but needs allow/deny rules to be set
        if(self.pluralizeResourceName(get(parsedResults, 'resource.resourceType'))){
          let pluralizedCollectionName = self.pluralizeResourceName(get(parsedResults, 'resourceType'));
          console.log('pluralizedCollectionName', pluralizedCollectionName)
          
          if(!Collections[pluralizedCollectionName].findOne(parsedResults.id)){
            Collections[pluralizedCollectionName].insert(parsedResults, {validate: false, filter: false},  function(error){          
              if(error) console.error('Collections[self.pluralizeResourceName(dataContent.resourceType))._collection.insert.error', error);              
            });      
          }
        } else {
          console.warn("Couldnt find the " + self.pluralizeResourceName(get(entry, 'resource.resourceType')) + ' collection.  Is it imported?') // phi-audit: ok
        }
      }
    }    
    return true
  }
}

export default MedicalRecordImporter;