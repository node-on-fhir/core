/* xlsx.js (C) 2013-present  SheetJS -- http://sheetjs.com */
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';

const FhirUtilities = Meteor.FhirUtilities;

//---------------------------------------------------------------------------
// Collections

// this is a little hacky, but it works to access our collections.
// we use to use Mongo.Collection.get(collectionName), but in Meteor 1.3, it was deprecated
// we then started using window[collectionName], but that only works on the client
// so we now take the window and 

let Collections = {};

if(Meteor.isClient){
  Collections = window;
}
if(Meteor.isServer){
  if(typeof global !== 'undefined'){
    Collections = global.Collections;
  }
  // Collections.AllergyIntolerances = AllergyIntolerances;
  // Collections.Bundles = Bundles;
  // Collections.CarePlans = CarePlans;
  // Collections.Conditions = Conditions;
  // Collections.Communications = Communications;
  // Collections.CommunicationRequests = CommunicationRequests;
  // Collections.CommunicationResponses = CommunicationResponses;
  // Collections.Devices = Devices;  
  // Collections.Encounters = Encounters;
  // Collections.Immunizations = Immunizations;
  // Collections.Lists = Lists;
  // Collections.Locations = Locations;
  // Collections.Medications = Medications;
  // Collections.MedicationOrders = MedicationOrders;
  // Collections.MedicationStatements = MedicationStatements;
  // Collections.MessageHeaders = MessageHeaders;
  // Collections.Measures = Measures;
  // Collections.MeasureReports = MeasureReports;
  // Collections.Organizations = Organizations;
  // Collections.Observations = Observations;
  // Collections.Patients = Patients;
  // Collections.Procedures = Procedures;
  // Collections.Questionnaires = Questionnaires;
  // Collections.QuestionnaireResponses = QuestionnaireResponses;
  // Collections.Tasks = Tasks;
}

function pluralizeResourceName(resourceType){
  let pluralized = '';
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
};



Meteor.methods({
  saveUnknownResourceType: function(unknownResourceTypeObject){


    console.log('unknownResourceTypeObject', unknownResourceTypeObject)
    let resultId;

    switch (get(unknownResourceTypeObject, 'resourceType')) {

      case "AllergyIntolerance":
        resultId = AllergyIntolerances.insert(unknownResourceTypeObject);
        break;
      case "Condition":
        resultId = Conditions.insert(unknownResourceTypeObject);
        break;
      case "CarePlan":
        resultId = CarePlans.insert(unknownResourceTypeObject);
        break;
      case "Encounter":
        resultId = Encounters.insert(unknownResourceTypeObject);
        break;
      case "Immunization":
        resultId = Immunizations.insert(unknownResourceTypeObject);
        break;
      case "MedicationStatement":
        resultId = MedicationStatements.insert(unknownResourceTypeObject);
        break;
      case "Observation":
        resultId = Observations.insert(unknownResourceTypeObject);
        break;
      case "Patient":
        resultId = Patients.insert(unknownResourceTypeObject);
        break;
      case "Procedure":
        resultId = Procedures.insert(unknownResourceTypeObject);
        break;
    
      default:
        break;
    }
    console.log('resultId', resultId);
  }
//   /* read the data and return the workbook object to the frontend */
//   proxyInsert: function(proxiedInsertRequest){
//     check(proxiedInsertRequest, Object);

//     if(get(proxiedInsertRequest, 'resourceType') === "Bundle"){
//       console.log('Received a Bundle to proxy insert.')
//       if(Array.isArray(proxiedInsertRequest.entry)){
//         // looping through each of the Bundle entries
//         proxiedInsertRequest.entry.forEach(function(proxyInsertEntry){
//           if(get(proxyInsertEntry, 'resource')){
//             // we are running this, assuming that PubSub is in place and synchronizing data cursors
//             console.log('ProxyInsert - Received a proxy request for a ' + get(proxyInsertEntry, 'resource.resourceType'))

//             let response = false;
//             // console.log('Collections', Collections)
            
//             // console.log('pluralizeResourceName: ' + pluralizeResourceName(get(proxyInsertEntry, 'resource.resourceType')))
//             // the cursor appears to exist
//             if(typeof Collections[pluralizeResourceName(get(proxyInsertEntry, 'resource.resourceType'))] === "object"){

//               // there doesnt seem to be a pre-existing record
//               if(!Collections[pluralizeResourceName(get(proxyInsertEntry, 'resource.resourceType'))].findOne({_id: proxyInsertEntry.resource._id})){
//                 console.log('Couldnt find record.  Inserting.')

//                 // lets try to insert the record
//                 response = Collections[pluralizeResourceName(get(proxyInsertEntry, 'resource.resourceType'))].insert(proxyInsertEntry.resource, {validate: false, filter: false}, function(error){
//                   if(error) {
//                     console.log('window(pluralizeResourceName(resource.resourceType)).insert.error', error)
//                   }                    
//                 });   
//               } else {
//                 console.log('Found a pre-existing copy of the record.  Thats weird and probably shouldnt be happening.');
//               }  
//             } else {
//               console.log('Cursor doesnt appear to exist');
//             }

//             return response;  
//           } else {
//             console.log('Received a request for a proxy insert, but no FHIR resource was attached to the received parameters object!');
//           }
//         })
//       } else {
//         console.log("Bundle does not seem to have an array of entries.")
//       }
//     } else {
//       // just a single resource, no need to loop through anything

//       if(typeof Collections[pluralizeResourceName(get(proxiedInsertRequest, 'resource.resourceType'))] === "object"){

//         // there doesnt seem to be a pre-existing record
//         if(!Collections[pluralizeResourceName(get(proxiedInsertRequest, 'resource.resourceType'))].findOne({_id: proxiedInsertRequest.resource._id})){
//           console.log('Couldnt find record; add a ' + pluralizeResourceName(get(proxiedInsertRequest, 'resource.resourceType')) + ' to the database.')

//           // lets try to insert the record
//           response = Collections[pluralizeResourceName(get(proxiedInsertRequest, 'resource.resourceType'))].insert(proxiedInsertRequest.resource, {validate: false, filter: false}, function(error){
//             if(error) {
//               console.log('window(pluralizeResourceName(resource.resourceType)).insert.error', error)
//             }                    
//           });   
//         } else {
//           console.log('Found a pre-existing copy of the record.  Thats weird and probably shouldnt be happening.');
//         }  
//       } else {
//         console.log('Cursor doesnt appear to exist');
//       }
//     }
    
//   },
//   /* read the data and return the workbook object to the frontend */
//   proxyInsertResource: function(proxiedInsertRequest){
//     check(proxiedInsertRequest, Object);

//     if (get(Meteor, 'settings.private.allowUnsafeProxy')) {
//       if(proxiedInsertRequest){
//         // we are running this, assuming that PubSub is in place and synchronizing data cursors
//         console.log('ProxyInsert - Received a proxiedInsertRequest to add to the distributed database.', proxiedInsertRequest)
          
//         let response = false;
//         // console.log('Collections', Collections)

//         // console.log('pluralizeResourceName: ' + pluralizeResourceName(get(proxiedInsertRequest, 'resource.resourceType')))
//         // the cursor appears to exist
//         if(typeof Collections[pluralizeResourceName(get(proxiedInsertRequest, 'resourceType'))] === "object"){

//           // there doesnt seem to be a pre-existing record
//           if(!Collections[pluralizeResourceName(get(proxiedInsertRequest, 'resourceType'))].findOne({_id: proxiedInsertRequest._id})){
//             console.log('Couldnt find record; attempting to add one to the database.')

//             // lets try to insert the record
//             response = Collections[pluralizeResourceName(get(proxiedInsertRequest, 'resourceType'))].insert(proxiedInsertRequest, {validate: false, filter: false}, function(error){
//               if(error) {
//                 console.log('window(pluralizeResourceName(resourceType)).insert.error', error)
//               }                    
//             });   
//           } else {
//             console.log('Found a pre-existing copy of the record.  Thats weird and probably shouldnt be happening.');
//           }  
//         } else {
//           console.log('Cursor doesnt appear to exist');
//         }

//         return response;
//       } else {
//         console.log('Received a request for a proxy insert, but received no FHIR resource!');
//       }
//     } else {
//       console.log('Received a request for a proxy insert, but user was not logged in!');
//       return "User not logged in!"
//     }



    
//   }
});