import { get, has, set } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';


//---------------------------------------------------------------------------
// Main Application  

MedicalRecordImporter = {
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
  importBundle: async function(dataContent, callback){    
    console.log('----------------------------------------------------');
    // console.log('MedicalRecordImporter.importBundle', typeof dataContent);
    // console.log('MedicalRecordImporter.importBundle.dataContent', dataContent);
    // console.log('MedicalRecordImporter.Collections', Collections);

    let self = this;

    let parsedResults = {};
    let firstPatientRecord;

    if(typeof dataContent === "string"){
      parsedResults = JSON.parse(dataContent);          
    } else if(typeof dataContent === "object"){
      if(has(dataContent, 'content') && !has(dataContent, 'resourceType')){
        if(typeof dataContent.content === "string"){
          parsedResults = JSON.parse(dataContent.content);
        } else {
          parsedResults = dataContent.content;
        }
      } else {
        parsedResults = dataContent;
      }
    } 
     
    console.log('MedicalRecordImporter.importBundle.dataContent', parsedResults);

    console.log('Parsed results:  ', parsedResults);
       

    if(get(parsedResults, 'resourceType') === "Bundle"){
      console.log('Found a FHIR bundle! There appear to be ' + parsedResults.entry.length + ' resources in the bundle.  Attempting import...')


      // as a Bundle, we know it's going to have an entries array
      // so, we're going to loop through each entry, looking for it's resources
      if(Array.isArray(parsedResults.entry)){
        parsedResults.entry.forEach(async function(entry){          
          if(get(entry, 'resource.resourceType')){
            console.debug('Found a ' + get(entry, 'resource.resourceType'), entry.resource);
  
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

            if(get(entry.resource, 'resourceType') === "Patient"){
              console.log(Meteor.FhirUtilities.assembleName(get(entry.resource, 'name[0]')))
              set(newRecord, 'name[0].text', Meteor.FhirUtilities.assembleName(get(entry.resource, 'name[0]')));

              firstPatientRecord = entry.resource;
            }


            // // if there is an issued timestamp
            // if(get(newRecord, 'issued')){
            //   // convert it from a String to Date, so we can sort it
            //   newRecord.issued = Date.parse(newRecord.issued);
            // } else {
            //   // if there is no issued timestamp, but there is an effective timestamp
            //   // use that instead
            //   if(get(newRecord, 'effectiveDateTime')){
            //     newRecord.issued = Date.parse(get(newRecord, 'effectiveDateTime'));
            //   } 
            // }

  
            if(Collections[self.pluralizeResourceName(get(entry, 'resource.resourceType'))]){
  
              // checking if there's a pub/sub
              let subscriptionActivated = false;

              Object.keys( Meteor.connection._subscriptions).forEach(function(key) {
                var record = Meteor.connection._subscriptions[key];
                if(record.name === self.pluralizeResourceName(get(entry, 'resource.resourceType'))){
                  subscriptionActivated = true;
                }
              });
                            
              console.log('Trying to import the following record', newRecord)
              console.debug('Subscription is active: ' + subscriptionActivated)
              if(Meteor.isClient && subscriptionActivated){
                if(proxyUrl){
                  let assembledUrl = proxyUrl;
                  if(has(entry, 'resource.id')){
                      assembledUrl = proxyUrl + '/' + get(entry, 'resource.resourceType') + '/' + get(entry, 'resource.id');
                      console.log('PUT ' + assembledUrl)
                      HTTP.put(assembledUrl, {data: get(entry, 'resource')}, function(error, result){
                          if(error){
                              alert(JSON.stringify(error.message));
                          }
                      })
                  } else {
                      assembledUrl = proxyUrl + '/' + get(entry, 'resource.resourceType');
                      console.log('POST ' + assembledUrl)
                      HTTP.post(assembledUrl, {data: get(entry, 'resource')}, function(error, result){
                          if(error){
                              alert(JSON.stringify(error.message));
                          }
                      })
                  }    
                }
              } else {
                // this should only be run if there's not a pubsub, and the cursors are effectively running offline
                console.debug('Cursor appears to be inactive.')
                if(!Collections[self.pluralizeResourceName(get(entry, 'resource.resourceType'))]._collection.findOne({_id: newRecord._id})){                  
                  console.debug('Couldnt find record; attempting to insert.')
                  await Collections[self.pluralizeResourceName(get(entry, 'resource.resourceType'))]._collection.insertAsync(newRecord, {validate: false, filter: false}, function(error){
                    if(error) {
                      console.error('window(self.pluralizeResourceName(entry.resource.resourceType))._collection.insert.error', error)
                    }
                  });   
                }
              }
            }
          }
        })
      }

      if(typeof callback === "function"){
        if(firstPatientRecord){
          callback(firstPatientRecord)
        }
      }


    // if it's not an array...
    } else {
      if(get(parsedResults, 'resourceType')){
        console.info('Found a ' + get(parsedResults, 'resourceType'));

        if(Meteor.isClient){
          // console.log('parsedResults', parsedResults)
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
  
          
  
          // // if there is an issued timestamp
          // if(get(parsedResults, 'issued')){
          //   // convert it from a String to Date, so we can sort it
          //   parsedResults.issued = Date.parse(parsedResults.issued);
          // } else {
          //   // if there is no issued timestamp, but there is an effective timestamp
          //   // use that instead
          //   if(get(parsedResults, 'effectiveDateTime')){
          //     parsedResults.issued = Date.parse(get(parsedResults, 'effectiveDateTime'));
          //   } 
          // }
  
          let pluralizedCollectionName = self.pluralizeResourceName(get(parsedResults, 'resourceType'));
          // console.debug('pluralizedCollectionName', pluralizedCollectionName)
  
          // This might work better on the client; but needs allow/deny rules to be set
          if(Collections[pluralizedCollectionName]){          
            if(!Collections[pluralizedCollectionName].findOne({id: parsedResults.id})){
              await Collections[pluralizedCollectionName]._collection.insertAsync(parsedResults, function(error){          
                if(error) console.error('Collections[self.pluralizeResourceName(dataContent.resourceType))._collection.insert.error', error);              
              });        
              // Collections[pluralizedCollectionName]._collection.insert(parsedResults, {validate: false, filter: false},  function(error){          
              //   if(error) console.log('Collections[self.pluralizeResourceName(dataContent.resourceType))._collection.insert.error', error);              
              // });        
            } else {
              console.info("Couldnt find any records in the " + pluralizedCollectionName + ' collection.')
            }
          } else {
            console.warn("Couldnt find the " + pluralizedCollectionName + ' collection.  Is it imported?')
          }
  
        } else {
          console.info('Not running on Client.  Skipping.')
        }  
      }
    }    
    return true
  },
  importBundleAsBundle: async function(dataContent, proxyUrl){    
    console.log('----------------------------------------------------');
    console.log('Importing Bundle into Bundle collection...')

    let self = this;

    let parsedResults = {};

    if(typeof dataContent === "string"){
      parsedResults = JSON.parse(dataContent);          
    } else if(typeof dataContent === "object"){
      if(has(dataContent, 'content') && !has(dataContent, 'resourceType')){
        if(typeof dataContent.content === "string"){
          parsedResults = JSON.parse(dataContent.content);
        } else {
          parsedResults = dataContent.content;
        }
      } else {
        parsedResults = dataContent;
      }
    } 
     
    console.log('MedicalRecordImporter.importBundle.dataContent', parsedResults);

    console.log('Parsed results:  ', parsedResults);
       
    if(get(parsedResults, 'resourceType') === "Bundle"){
      console.log('Found a FHIR bundle!  Attempting import...')

      console.debug('Cursor appears to be inactive.')
      if(!Meteor.Collections.Bundles._collection.findOne({_id: parsedResults._id})){                  
        console.debug('Couldnt find record; attempting to insert.')
        await Meteor.Collections.Bundles._collection.insertAsync(parsedResults, {validate: false, filter: false}, function(error){
          if(error) {
            console.error('window(self.pluralizeResourceName(entry.resource.resourceType))._collection.insert.error', error)
          }
        });   
      }
    }
    
    return true
  }
}

export default MedicalRecordImporter;