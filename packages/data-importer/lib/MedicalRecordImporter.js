// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/data-importer/lib/MedicalRecordImporter.js

import { get, has, set } from 'lodash';
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { Random } from 'meteor/random';
import { Session } from 'meteor/session';
import { parseString } from 'xml2js';
import JSZip from 'jszip';
import moment from 'moment';




//---------------------------------------------------------------------------
// Collections

// this is a little hacky, but it works to access our collections.
// we use to use Mongo.Collection.get(collectionName), but in Meteor 1.3, it was deprecated
// we then started using window[collectionName], but that only works on the client
// so we now take the window and 

let Collections;

Meteor.startup(function(){

  // does this work?
  // Collections = Meteor.Collections;
  
  if(Meteor.isClient){
    Collections = window.Collections;
  }
  if(Meteor.isServer){
    Collections = global.Collections;
  }  
})

//---------------------------------------------------------------------------
// Cordova / Healthkit Callback

var callback = function (msg) {
  // wrapping in a timeout because of a possbile native UI element blocking the webview
  setTimeout(function () {
    // alert(JSON.stringify(msg))
    console.log(JSON.stringify(msg))
  }, 0);
};

//---------------------------------------------------------------------------
// Main Application  

MedicalRecordImporter = {
  healthRecord: function(){
    console.log('=====================================================')
    console.log('MedicalRecordImporter.healthRecord()', JSON.stringify(window.plugins));

      window.plugins.healthkit.available(
          callback,
          callback
      );

      // or any of these HKClinicalType for readTypes 

      // 'HKCharacteristicTypeIdentifierFitzpatrickSkinType',
      // 'HKCharacteristicTypeIdentifierWheelchairUse',

      // 'HKCharacteristicTypeIdentifierDateOfBirth',
      // 'HKCharacteristicTypeIdentifierBiologicalSex',
      // 'HKCharacteristicTypeIdentifierBloodType',

      // 'HKFHIRResourceTypeAllergyIntolerance',
      // 'HKFHIRResourceTypeImmunization',
      // 'HKFHIRResourceTypeMedicationDispense',
      // 'HKFHIRResourceTypeMedicationOrder',
      // 'HKFHIRResourceTypeMedicationStatement',
      // 'HKFHIRResourceTypeObservation',
      // 'HKFHIRResourceTypeProcedure'

      window.plugins.healthkit.requestAuthorization(
          {
            readTypes: [
              'HKClinicalTypeIdentifierAllergyRecord',
              'HKClinicalTypeIdentifierConditionRecord',
              'HKClinicalTypeIdentifierImmunizationRecord',
              'HKClinicalTypeIdentifierLabResultRecord',
              'HKClinicalTypeIdentifierMedicationRecord',

              'HKClinicalTypeIdentifierProcedureRecord',
              'HKClinicalTypeIdentifierVitalSignRecord'
            ],
            writeTypes: []
          },
          function(msg){console.log('requestAuthorization.ok', msg)},
          function(msg){console.log('requestAuthorization.nok', msg)}
      );

      // console.log('-------------------------------------------')
      // console.log('queryClinicalSampleType')
      // window.plugins.healthkit.queryClinicalSampleType(
      //   {
      //     'startDate': new Date(new Date().getTime() - 365 * 24 * 60 * 60 * 1000 * 10) , // 365 days ago
      //     'endDate': new Date(), // now
      //     sampleType: 'HKClinicalTypeIdentifierAllergyRecord'
      //     // fhirResourceType: 'HKFHIRResourceTypeAllergyIntolerance'
      //   },
      //   function(results){
      //     console.log('HKFHIRResourceTypeAllergyIntolerance.ok', JSON.stringify(results))
      //     results.forEach(function(record){
      //       if(get(record, 'FHIRResource.data.resourceType') === "AllergyIntolerance"){
      //         AllergyIntolerances._collection.insert(get(record, 'FHIRResource.data'));
      //       }
      //     })
      //   },
      // function(msg){console.log('HKFHIRResourceTypeAllergyIntolerance.nok', msg)}
      // );

      console.log('-------------------------------------------')
      console.log('HKFHIRResourceTypeAllergyIntolerance')
      window.plugins.healthkit.queryForClinicalRecordsWithFHIRResourceType(
        {
          fhirResourceType: 'HKFHIRResourceTypeAllergyIntolerance',
          sampleType: 'HKClinicalTypeIdentifierAllergyRecord'
        },
        function(results){
          console.log('HKFHIRResourceTypeAllergyIntolerance.ok', JSON.stringify(results))
          results.forEach(async function(record){
            if(get(record, 'FHIRResource.data.resourceType') === "AllergyIntolerance"){
              //AllergyIntolerances._collection.insert(get(record, 'FHIRResource.data'));
              await HealthKitImport._collection.insertAsync(get(record, 'FHIRResource.data'));
            }
          })
        },
      function(msg){console.log('HKFHIRResourceTypeAllergyIntolerance.nok', msg)}
      );

      console.log('-------------------------------------------')
      console.log('HKFHIRResourceTypeCondition')
      window.plugins.healthkit.queryForClinicalRecordsWithFHIRResourceType(
        {
          fhirResourceType: 'HKFHIRResourceTypeCondition',
          sampleType: 'HKClinicalTypeIdentifierConditionRecord'
        },
        function(results){
          console.log('HKFHIRResourceTypeCondition.ok', JSON.stringify(results))
          results.forEach(async function(record){
            if(get(record, 'FHIRResource.data.resourceType') === "Condition"){
              // Conditions._collection.insert(get(record, 'FHIRResource.data'));
              await HealthKitImport._collection.insertAsync(get(record, 'FHIRResource.data'));
            }
          })
        },
        function(msg){console.log('HKFHIRResourceTypeCondition.nok', msg)}
      );

      console.log('-------------------------------------------')
      console.log('HKFHIRResourceTypeImmunization')
      window.plugins.healthkit.queryForClinicalRecordsWithFHIRResourceType(
        {
          fhirResourceType: 'HKFHIRResourceTypeImmunization',
          sampleType: 'HKClinicalTypeIdentifierImmunizationRecord'
        },
        function(results){
          console.log('HKFHIRResourceTypeImmunization.ok', JSON.stringify(results))
          results.forEach(async function(record){
            if(get(record, 'FHIRResource.data.resourceType') === "Immunization"){
              // Immunizations._collection.insert(get(record, 'FHIRResource.data'));
              await HealthKitImport._collection.insertAsync(get(record, 'FHIRResource.data'));
            }
          })
        },
        function(msg){console.log('HKFHIRResourceTypeImmunization.nok', msg)}
      );


      console.log('-------------------------------------------')
      console.log('HKFHIRResourceTypeObservation')
      window.plugins.healthkit.queryForClinicalRecordsWithFHIRResourceType(
        {
          'fhirResourceType': 'HKFHIRResourceTypeObservation',
          'sampleType': 'HKClinicalTypeIdentifierLabResultRecord'
          // 'startDate': new Date(new Date().getTime() - 365 * 24 * 60 * 60 * 1000), // 365 days ago
          // 'endDate': new Date(), // now
        },
        function(results){
          console.log('HKClinicalTypeIdentifierLabResultRecord.ok', JSON.stringify(results))
          results.forEach(function(record){
            if(get(record, 'FHIRResource.data.resourceType') === "Observation"){
              // Observations._collection.insert(get(record, 'FHIRResource.data'));
              HealthKitImport._collection.insert(get(record, 'FHIRResource.data'));
            }
          })
        },
        function(){console.log('HKFHIRResourceTypeObservation.nok')}
      );

      console.log('-------------------------------------------')
      console.log('HKFHIRResourceTypeMedicationOrder')
      window.plugins.healthkit.queryForClinicalRecordsWithFHIRResourceType(
        {
          'fhirResourceType': 'HKFHIRResourceTypeMedicationOrder',
          'sampleType': 'HKClinicalTypeIdentifierMedicationRecord'
        },
        function(results){
          console.log('HKFHIRResourceTypeMedicationOrder.ok', JSON.stringify(results))
          results.forEach(async function(record){
            if(get(record, 'FHIRResource.data.resourceType') === "MedicationOrder"){
              // MedicationOrders._collection.insert(get(record, 'FHIRResource.data'));
              await HealthKitImport._collection.insertAsync(get(record, 'FHIRResource.data'));            }
          })
        },
        function(){console.log('HKFHIRResourceTypeMedicationOrder.nok')}
      );

      console.log('-------------------------------------------')
      console.log('HKFHIRResourceTypeMedicationStatement')
      window.plugins.healthkit.queryForClinicalRecordsWithFHIRResourceType(
        {
          'fhirResourceType': 'HKFHIRResourceTypeMedicationStatement',
          'sampleType': 'HKClinicalTypeIdentifierMedicationRecord'
        },
        function(results){
          console.log('HKFHIRResourceTypeMedicationStatement.ok', JSON.stringify(results))
          results.forEach(function(record){
            if(get(record, 'FHIRResource.data.resourceType') === "MedicationStatement"){
              // MedicationStatements._collection.insert(get(record, 'FHIRResource.data'));
              HealthKitImport._collection.insert(get(record, 'FHIRResource.data'));
            }
          })
        },
        function(){console.log('HKFHIRResourceTypeMedicationStatement.nok')}
      );

      console.log('-------------------------------------------')
      console.log('HKFHIRResourceTypeProcedure')
      window.plugins.healthkit.queryForClinicalRecordsWithFHIRResourceType(
        {
          fhirResourceType: 'HKFHIRResourceTypeProcedure',
          sampleType: 'HKClinicalTypeIdentifierProcedureRecord'
        },
        function(results){
          console.log('HKFHIRResourceTypeProcedure.ok', JSON.stringify(results))
          results.forEach(async function(record){
            if(get(record, 'FHIRResource.data.resourceType') === "Procedure"){
              // Procedures._collection.insert(get(record, 'FHIRResource.data'));
              await HealthKitImport._collection.insertAsync(get(record, 'FHIRResource.data'));
            }
          })
        },
        function(){console.log('HKFHIRResourceTypeProcedure.nok')}
      );

      console.log('-------------------------------------------')
      console.log('HKClinicalTypeIdentifierVitalSignRecord')
      window.plugins.healthkit.queryForClinicalRecordsWithFHIRResourceType({
        'fhirResourceType': 'HKFHIRResourceTypeObservation',
        'sampleType': 'HKClinicalTypeIdentifierVitalSignRecord'
        },
        function(results){
          console.log('HKFHIRResourceTypeObservation.ok', JSON.stringify(results))
          results.forEach(async function(record){
            if(get(record, 'FHIRResource.data.resourceType') === "Observation"){
              // Observations._collection.insert(get(record, 'FHIRResource.data'));
              await HealthKitImport._collection.insertAsync(get(record, 'FHIRResource.data'));
            }
          })
        },
        function(){console.log('HKFHIRResourceTypeObservation.nok')}
      );
      
      // // or any of these other HKFHIRResourceType
      // // HKFHIRResourceTypeAllergyIntolerance',
      // // HKFHIRResourceTypeImmunization
      // // HKFHIRResourceTypeMedicationDispense
      // // HKFHIRResourceTypeMedicationOrder
      // // HKFHIRResourceTypeMedicationStatement
      // // HKFHIRResourceTypeObservation
      // // HKFHIRResourceTypeProcedure
      // // or any of these other HKClinicalType
      // // HKClinicalTypeIdentifierImmunizationRecord
      // // HKClinicalTypeIdentifierLabResultRecord
      // // HKClinicalTypeIdentifierMedicationRecord
      // // HKClinicalTypeIdentifierProcedureRecord
      // // HKClinicalTypeIdentifierVitalSignRecord


      // window.plugins.healthkit.readDateOfBirth(
      //   function(data){console.log('readDateOfBirth.ok', JSON.stringify(data))},
      //   function(){console.log('readDateOfBirth.nok')}
      // );
      // window.plugins.healthkit.readGender(
      //   function(data){console.log('readGender.ok', JSON.stringify(data))},
      //   function(){console.log('readGender.nok')}
      // );
      // window.plugins.healthkit.readBloodType(
      //   function(data){console.log('readBloodType.ok', JSON.stringify(data))},
      //   function(){console.log('readBloodType.nok')}
      // );
      // window.plugins.healthkit.readFitzpatrickSkinType(
      //   function(data){console.log('readFitzpatrickSkinType.ok', JSON.stringify(data))},
      //   function(){console.log('readFitzpatrickSkinType.nok')}
      // );
      // window.plugins.healthkit.readWeight({
      //     'requestWritePermission': true, // use if your app doesn't need to write
      //     'unit': 'kg'
      //   },
      //   function(data){console.log('readWeight.ok', JSON.stringify(data))},
      //   function(){console.log('readWeight.nok')}
      // );
      // window.plugins.healthkit.readHeight({
      //     'requestWritePermission': false,
      //     'unit': 'cm' // m|cm|mm|in|ft
      //   },
      //   function(data){console.log('readHeight.ok', JSON.stringify(data))},
      //   function(){console.log('readHeight.nok')}
      // );

      let importRecordEvent = { 
        "resourceType" : "AuditEvent",
        "action" : 'Health Record Importer',
        "recorded" : new Date(), 
        "outcome" : 'Success',
        "outcomeDesc" : 'User imported records from Apple Health Records.',
        "agent" : [{
          "altId" : Meteor.userId() ? Meteor.userId() : '', // Alternative User id e.g. authentication
          "name" : get(Meteor.user(), 'profile.fullName', get(Meteor.user(), 'username', '')), // Human-meaningful name for the agent
          "requestor" : true  
        }],
        "source" : { 
          "site" : Meteor.absoluteUrl(),
          "identifier": {
            "value": 'Accounts Subsystem'
          }
        },
        "entity": []
      }      

      // HipaaLogger.logEvent({eventType: "update", userId: Meteor.userId(), userName: get(Meteor.user(), 'profile.fullName', get(Meteor.user(), 'username', '')), collectionName: "Procedures", recordId: self.state.procedureId });

      if(typeof HipaaLogger === "object"){
        HipaaLogger.logAuditEvent(importRecordEvent, {validate: get(Meteor, 'settings.public.defaults.schemas.validate', false)}, function(error, result){
          if(error) console.error('HipaaLogger.logEvent.error.invalidKeys', error.invalidKeys)
          if(result) console.error(result)
        });   
      }

      if(Meteor.users){
        Meteor.users.update({_id: Meteor.userId()}, {$set: {
          needHealthRecordsAuth: false
        }})  
      }

  },
  coreBiomarkers: function(){
    console.log('=====================================================')
    console.log('MedicalRecordImporter.coreBiomarkers()', window.plugins)

      window.plugins.healthkit.available(
          callback,
          callback
      );
      // or any of these HKClinicalType for readTypes 

      // 'HKCharacteristicTypeIdentifierDateOfBirth',
      // 'HKCharacteristicTypeIdentifierBiologicalSex',
      // 'HKCharacteristicTypeIdentifierBloodType',
      // 'HKCharacteristicTypeIdentifierFitzpatrickSkinType',
      // 'HKCharacteristicTypeIdentifierWheelchairUse',

      // 'HKFHIRResourceTypeAllergyIntolerance',
      // 'HKFHIRResourceTypeImmunization',
      // 'HKFHIRResourceTypeMedicationDispense',
      // 'HKFHIRResourceTypeMedicationOrder',
      // 'HKFHIRResourceTypeMedicationStatement',
      // 'HKFHIRResourceTypeObservation',
      // 'HKFHIRResourceTypeProcedure'

      window.plugins.healthkit.requestAuthorization(
          {
            readTypes: [
              'HKClinicalTypeIdentifierAllergyRecord',
              'HKClinicalTypeIdentifierConditionRecord',
              'HKClinicalTypeIdentifierImmunizationRecord',
              'HKClinicalTypeIdentifierLabResultRecord',
              'HKClinicalTypeIdentifierMedicationRecord',

              'HKClinicalTypeIdentifierProcedureRecord',
              'HKClinicalTypeIdentifierVitalSignRecord',

              'HKCharacteristicTypeIdentifierDateOfBirth',
              'HKCharacteristicTypeIdentifierBiologicalSex',
              'HKCharacteristicTypeIdentifierBloodType',
              'HKCharacteristicTypeIdentifierFitzpatrickSkinType',
              'HKCharacteristicTypeIdentifierWheelchairUse'
            ],
            writeTypes: []
          },
          function(msg){console.log('requestAuthorization.ok', msg)},
          function(msg){console.log('requestAuthorization.nok', msg)}
      );

      // // or any of these other HKFHIRResourceType
      // // HKFHIRResourceTypeAllergyIntolerance',
      // // HKFHIRResourceTypeImmunization
      // // HKFHIRResourceTypeMedicationDispense
      // // HKFHIRResourceTypeMedicationOrder
      // // HKFHIRResourceTypeMedicationStatement
      // // HKFHIRResourceTypeObservation
      // // HKFHIRResourceTypeProcedure
      // // or any of these other HKClinicalType
      // // HKClinicalTypeIdentifierImmunizationRecord
      // // HKClinicalTypeIdentifierLabResultRecord
      // // HKClinicalTypeIdentifierMedicationRecord
      // // HKClinicalTypeIdentifierProcedureRecord
      // // HKClinicalTypeIdentifierVitalSignRecord

      window.plugins.healthkit.readDateOfBirth(
        function(data){
          console.log('readDateOfBirth.ok', JSON.stringify(data));
          Session.set('HKCharacteristicTypeIdentifierDateOfBirth', data)      
        },
        function(){console.log('readDateOfBirth.nok')}
      );
      window.plugins.healthkit.readGender(
        function(data){
          console.log('readGender.ok', JSON.stringify(data))
          Session.set('HKCharacteristicTypeIdentifierBiologicalSex', data)
        },
        function(){console.log('readGender.nok')}
      );
      window.plugins.healthkit.readBloodType(
        function(data){
          console.log('readBloodType.ok', JSON.stringify(data))
          Session.set('HKCharacteristicTypeIdentifierBloodType', data)
        },
        function(){console.log('readBloodType.nok')}
      );
      window.plugins.healthkit.readFitzpatrickSkinType(
        function(data){
          console.log('readFitzpatrickSkinType.ok', JSON.stringify(data))
          Session.set('HKCharacteristicTypeIdentifierFitzpatrickSkinType', data)
          Session.set('selectedFitzpatrick', data)
        },
        function(){console.log('readFitzpatrickSkinType.nok')}
      );
      window.plugins.healthkit.readWheelchairUse(
        function(data){
          console.log('readWheelchairUse.ok', JSON.stringify(data))
          Session.set('HKCharacteristicTypeIdentifierWheelchairUse', data)
        },
        function(){console.log('readWheelchairUse.nok')}
      );

      // window.plugins.healthkit.readWeight({
      //     'requestWritePermission': true, // use if your app doesn't need to write
      //     'unit': 'kg'
      //   },
      //   function(data){console.log('readWeight.ok', JSON.stringify(data))},
      //   function(){console.log('readWeight.nok')}
      // );
      // window.plugins.healthkit.readHeight({
      //     'requestWritePermission': false,
      //     'unit': 'cm' // m|cm|mm|in|ft
      //   },
      //   function(data){console.log('readHeight.ok', JSON.stringify(data))},
      //   function(){console.log('readHeight.nok')}
      // );

      // HipaaLogger.logEvent({eventType: "update", userId: Meteor.userId(), userName: get(Meteor.user(), 'profile.fullName', get(Meteor.user(), 'username', '')), collectionName: "Procedures", recordId: self.state.procedureId });
  },
  isAppleHealthXml: function(content) {
    // Check if content is a string and contains Apple Health XML markers
    if(typeof content !== 'string') {
      return false;
    }
    return content.includes('<!DOCTYPE HealthData') ||
           content.includes('HealthKit Export Version');
  },
  analyzeAppleHealthXML: function(xmlContent) {
    console.log('=====================================================');
    console.log('MedicalRecordImporter.analyzeAppleHealthXML()');
    console.log('XML size:', (xmlContent.length / 1024 / 1024).toFixed(2), 'MB');

    try {
      const healthRecords = {};
      const workouts = {};
      let totalRecords = 0;
      let earliestDate = null;
      let latestDate = null;

      // Use regex to extract Record elements and their attributes
      const recordRegex = /<Record\s+([^>]+)>/g;
      let match;

      while ((match = recordRegex.exec(xmlContent)) !== null) {
        const attributes = match[1];

        // Extract type attribute
        const typeMatch = /type="([^"]+)"/.exec(attributes);
        const startDateMatch = /startDate="([^"]+)"/.exec(attributes);

        if (typeMatch) {
          const type = typeMatch[1];
          const startDate = startDateMatch ? startDateMatch[1] : null;

          // Track record counts by type
          if (!healthRecords[type]) {
            healthRecords[type] = {
              count: 0,
              displayName: type.replace(/HK(Quantity|Category)TypeIdentifier/, '')
            };
          }
          healthRecords[type].count++;
          totalRecords++;

          // Track date range
          if (startDate) {
            const date = new Date(startDate);
            if (!earliestDate || date < earliestDate) {
              earliestDate = date;
            }
            if (!latestDate || date > latestDate) {
              latestDate = date;
            }
          }
        }
      }

      // Extract Workout elements
      const workoutRegex = /<Workout\s+([^>]+)>/g;
      while ((match = workoutRegex.exec(xmlContent)) !== null) {
        const attributes = match[1];
        const typeMatch = /workoutActivityType="([^"]+)"/.exec(attributes);

        if (typeMatch) {
          const type = typeMatch[1];
          if (!workouts[type]) {
            workouts[type] = {
              count: 0,
              displayName: type.replace(/HKWorkoutActivityType/, '')
            };
          }
          workouts[type].count++;
        }
      }

      console.log('Analysis complete');
      console.log('Total records:', totalRecords);
      console.log('Unique types:', Object.keys(healthRecords).length);
      console.log('Workouts:', Object.keys(workouts).length);

      return {
        healthRecords,
        workouts,
        totalRecords,
        dateRange: {
          earliest: earliestDate,
          latest: latestDate
        },
        clinicalRecords: [] // XML files don't have clinical-records folder
      };
    } catch (error) {
      console.error('Error analyzing Apple Health XML:', error);
      return { error: error.message };
    }
  },
  analyzeAppleHealthExport: async function(zipContent, options = {}){
    console.log('=====================================================');
    console.log('MedicalRecordImporter.analyzeAppleHealthExport()');

    try {
      // Load the zip file
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(zipContent);
      
      const analysis = {
        healthRecords: {},
        clinicalRecords: [],
        workouts: {},
        totalRecords: 0,
        dateRange: { earliest: null, latest: null }
      };
      
      // Analyze export.xml (main health data)
      const exportXmlFile = loadedZip.file('apple_health_export/export.xml');
      if (exportXmlFile) {
        const xmlContent = await exportXmlFile.async('string');
        
        // For very large files, use regex extraction
        console.log('Analyzing Apple Health data...');
        
        // Analyze Records (HKQuantityType, HKCategoryType, etc.)
        const recordRegex = /<Record\s+([^>]+)\/>/g;
        let recordMatch;
        
        while ((recordMatch = recordRegex.exec(xmlContent)) !== null) {
          const attributes = this.parseAttributes(recordMatch[1]);
          const type = attributes.type;
          
          if (type) {
            if (!analysis.healthRecords[type]) {
              analysis.healthRecords[type] = {
                count: 0,
                displayName: this.getDisplayName(type),
                fhirResource: this.getFhirResourceType(type),
                loincCode: this.getLoincCode(type),
                earliestDate: null,
                latestDate: null
              };
            }
            
            analysis.healthRecords[type].count++;
            
            // Track date range
            const recordDate = attributes.startDate || attributes.creationDate;
            if (recordDate) {
              const date = new Date(recordDate);
              
              // Update type-specific date range
              if (!analysis.healthRecords[type].earliestDate || date < new Date(analysis.healthRecords[type].earliestDate)) {
                analysis.healthRecords[type].earliestDate = recordDate;
              }
              if (!analysis.healthRecords[type].latestDate || date > new Date(analysis.healthRecords[type].latestDate)) {
                analysis.healthRecords[type].latestDate = recordDate;
              }
              
              // Update overall date range
              if (!analysis.dateRange.earliest || date < new Date(analysis.dateRange.earliest)) {
                analysis.dateRange.earliest = recordDate;
              }
              if (!analysis.dateRange.latest || date > new Date(analysis.dateRange.latest)) {
                analysis.dateRange.latest = recordDate;
              }
            }
            
            analysis.totalRecords++;
          }
        }
        
        // Analyze Correlations (HKCorrelationType - like blood pressure readings)
        const correlationRegex = /<Correlation\s+([^>]+)>/g;
        let correlationMatch;
        
        while ((correlationMatch = correlationRegex.exec(xmlContent)) !== null) {
          const attributes = this.parseAttributes(correlationMatch[1]);
          const type = attributes.type;
          
          if (type) {
            if (!analysis.healthRecords[type]) {
              analysis.healthRecords[type] = {
                count: 0,
                displayName: this.getDisplayName(type),
                fhirResource: this.getFhirResourceType(type),
                loincCode: this.getLoincCode(type),
                earliestDate: null,
                latestDate: null
              };
            }
            
            analysis.healthRecords[type].count++;
            
            // Track date range
            const recordDate = attributes.startDate || attributes.creationDate;
            if (recordDate) {
              const date = new Date(recordDate);
              
              if (!analysis.healthRecords[type].earliestDate || date < new Date(analysis.healthRecords[type].earliestDate)) {
                analysis.healthRecords[type].earliestDate = recordDate;
              }
              if (!analysis.healthRecords[type].latestDate || date > new Date(analysis.healthRecords[type].latestDate)) {
                analysis.healthRecords[type].latestDate = recordDate;
              }
              
              if (!analysis.dateRange.earliest || date < new Date(analysis.dateRange.earliest)) {
                analysis.dateRange.earliest = recordDate;
              }
              if (!analysis.dateRange.latest || date > new Date(analysis.dateRange.latest)) {
                analysis.dateRange.latest = recordDate;
              }
            }
            
            analysis.totalRecords++;
          }
        }
        
        // Note: HKMetadataKey records are typically embedded within Record elements as MetadataEntry
        // We'll count unique metadata keys found
        const metadataRegex = /<MetadataEntry\s+key="([^"]+)"/g;
        const metadataKeys = new Set();
        let metadataMatch;
        
        while ((metadataMatch = metadataRegex.exec(xmlContent)) !== null) {
          metadataKeys.add(metadataMatch[1]);
        }
        
        // Add metadata keys to analysis if found
        if (metadataKeys.size > 0) {
          analysis.metadataKeys = Array.from(metadataKeys).map(key => ({
            key: key,
            displayName: key.replace(/HKMetadataKey/, '').replace(/([A-Z])/g, ' $1').trim()
          }));
        }
        
        // Analyze workouts
        const workoutRegex = /<Workout\s+([^>]+)>/g;
        let workoutMatch;
        
        while ((workoutMatch = workoutRegex.exec(xmlContent)) !== null) {
          const attributes = this.parseAttributes(workoutMatch[1]);
          const type = attributes.workoutActivityType;
          
          if (type) {
            if (!analysis.workouts[type]) {
              analysis.workouts[type] = {
                count: 0,
                displayName: this.getWorkoutDisplayName(type)
              };
            }
            analysis.workouts[type].count++;
          }
        }
      }
      
      // Analyze clinical records folder
      const clinicalRecordsFolder = loadedZip.folder('apple_health_export/clinical-records');
      if (clinicalRecordsFolder) {
        const files = clinicalRecordsFolder.file(/\.json$/);
        for (const file of files) {
          const jsonContent = await file.async('string');
          try {
            const resource = JSON.parse(jsonContent);
            if (resource.resourceType) {
              const existing = analysis.clinicalRecords.find(r => r.type === resource.resourceType);
              if (existing) {
                existing.count++;
              } else {
                analysis.clinicalRecords.push({
                  type: resource.resourceType,
                  count: 1
                });
              }
            }
          } catch (e) {
            console.error('Error parsing clinical record:', e);
          }
        }
      }
      
      return analysis;
      
    } catch (error) {
      console.error('Error analyzing Apple Health data:', error);
      return { error: error.message };
    }
  },
  getDisplayName: function(type) {
    const displayNames = {
      // HKQuantityType records
      'HKQuantityTypeIdentifierHeartRate': 'Heart Rate',
      'HKQuantityTypeIdentifierBloodPressureSystolic': 'Blood Pressure (Systolic)',
      'HKQuantityTypeIdentifierBloodPressureDiastolic': 'Blood Pressure (Diastolic)',
      'HKQuantityTypeIdentifierBodyMass': 'Body Weight',
      'HKQuantityTypeIdentifierHeight': 'Height',
      'HKQuantityTypeIdentifierBodyMassIndex': 'BMI',
      'HKQuantityTypeIdentifierStepCount': 'Step Count',
      'HKQuantityTypeIdentifierDistanceWalkingRunning': 'Walking/Running Distance',
      'HKQuantityTypeIdentifierActiveEnergyBurned': 'Active Calories',
      'HKQuantityTypeIdentifierBasalEnergyBurned': 'Basal Calories',
      'HKQuantityTypeIdentifierFlightsClimbed': 'Flights Climbed',
      'HKQuantityTypeIdentifierOxygenSaturation': 'Blood Oxygen',
      'HKQuantityTypeIdentifierBloodGlucose': 'Blood Glucose',
      'HKQuantityTypeIdentifierBodyTemperature': 'Body Temperature',
      'HKQuantityTypeIdentifierRespiratoryRate': 'Respiratory Rate',
      'HKQuantityTypeIdentifierRestingHeartRate': 'Resting Heart Rate',
      'HKQuantityTypeIdentifierWalkingHeartRateAverage': 'Walking Heart Rate Average',
      'HKQuantityTypeIdentifierAppleExerciseTime': 'Exercise Time',
      'HKQuantityTypeIdentifierAppleStandTime': 'Stand Time',
      'HKQuantityTypeIdentifierEnvironmentalAudioExposure': 'Environmental Audio Exposure',
      'HKQuantityTypeIdentifierHeadphoneAudioExposure': 'Headphone Audio Exposure',
      'HKQuantityTypeIdentifierWalkingSpeed': 'Walking Speed',
      'HKQuantityTypeIdentifierWalkingStepLength': 'Walking Step Length',
      'HKQuantityTypeIdentifierWalkingDoubleSupportPercentage': 'Walking Double Support %',
      // HKCategoryType records
      'HKCategoryTypeIdentifierSleepAnalysis': 'Sleep Analysis',
      'HKCategoryTypeIdentifierAppleStandHour': 'Stand Hours',
      'HKCategoryTypeIdentifierMindfulSession': 'Mindful Sessions',
      // HKCorrelationType records
      'HKCorrelationTypeIdentifierBloodPressure': 'Blood Pressure (Combined)',
      'HKCorrelationTypeIdentifierFood': 'Food Entry'
    };
    
    // Clean up the type name if not in our map
    return displayNames[type] || 
           type.replace(/HK(Quantity|Category|Correlation)TypeIdentifier/, '')
               .replace(/([A-Z])/g, ' $1').trim();
  },
  getFhirResourceType: function(type) {
    // Most health metrics map to Observation
    if (type.includes('HKQuantityTypeIdentifier') || 
        type.includes('HKCategoryTypeIdentifier') ||
        type.includes('HKCorrelationTypeIdentifier')) {
      return 'Observation';
    }
    return 'Unknown';
  },
  getLoincCode: function(type) {
    const typeToLoinc = {
      'HKQuantityTypeIdentifierHeartRate': '8867-4',
      'HKQuantityTypeIdentifierBloodPressureSystolic': '8480-6',
      'HKQuantityTypeIdentifierBloodPressureDiastolic': '8462-4',
      'HKQuantityTypeIdentifierBodyMass': '29463-7',
      'HKQuantityTypeIdentifierHeight': '8302-2',
      'HKQuantityTypeIdentifierBodyMassIndex': '39156-5',
      'HKQuantityTypeIdentifierStepCount': '55423-8',
      'HKQuantityTypeIdentifierDistanceWalkingRunning': '55430-3',
      'HKQuantityTypeIdentifierActiveEnergyBurned': '41981-2',
      'HKQuantityTypeIdentifierBasalEnergyBurned': '41980-4',
      'HKQuantityTypeIdentifierFlightsClimbed': '93828-9',
      'HKQuantityTypeIdentifierOxygenSaturation': '59408-5',
      'HKQuantityTypeIdentifierBloodGlucose': '15074-8',
      'HKQuantityTypeIdentifierBodyTemperature': '8310-5',
      'HKQuantityTypeIdentifierRespiratoryRate': '9279-1'
    };
    return typeToLoinc[type] || null;
  },
  getWorkoutDisplayName: function(type) {
    const workoutNames = {
      'HKWorkoutActivityTypeWalking': 'Walking',
      'HKWorkoutActivityTypeRunning': 'Running',
      'HKWorkoutActivityTypeCycling': 'Cycling',
      'HKWorkoutActivityTypeSwimming': 'Swimming',
      'HKWorkoutActivityTypeYoga': 'Yoga',
      'HKWorkoutActivityTypeStrengthTraining': 'Strength Training',
      'HKWorkoutActivityTypeElliptical': 'Elliptical',
      'HKWorkoutActivityTypeRowing': 'Rowing'
    };
    return workoutNames[type] || type.replace('HKWorkoutActivityType', '');
  },
  importAppleHealthExport: async function(zipContent, options = {}){
    console.log('=====================================================');
    console.log('MedicalRecordImporter.importAppleHealthExport()');
    
    // Default options
    const defaults = {
      timeRange: 'all', // 'all', 'lastDecade', 'lastYear', 'lastMonth'
      includeWorkouts: true,
      includeClinicalRecords: true,
      includeHealthRecords: true,
      selectedTypes: null // Array of types to import, null means all
    };
    const settings = Object.assign({}, defaults, options);
    
    try {
      // Load the zip file
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(zipContent);
      
      // Process export.xml (main health data)
      const exportXmlFile = loadedZip.file('apple_health_export/export.xml');
      if (exportXmlFile) {
        const xmlContent = await exportXmlFile.async('string');
        await this.processAppleHealthXML(xmlContent, settings);
      }
      
      // Process clinical records (FHIR JSON files)
      if (settings.includeClinicalRecords) {
        const clinicalRecordsFolder = loadedZip.folder('apple_health_export/clinical-records');
        if (clinicalRecordsFolder) {
          const files = clinicalRecordsFolder.file(/\.json$/);
          for (const file of files) {
            const jsonContent = await file.async('string');
            const fhirResource = JSON.parse(jsonContent);
            await this.importFhirResource(fhirResource);
          }
        }
      }
      
      // Log import event
      const importRecordEvent = { 
        "resourceType" : "AuditEvent",
        "action" : 'Apple Health Import',
        "recorded" : new Date(), 
        "outcome" : 'Success',
        "outcomeDesc" : 'User imported records from Apple Health Export.',
        "agent" : [{
          "altId" : Meteor.userId() ? Meteor.userId() : '',
          "name" : get(Meteor.user(), 'profile.fullName', get(Meteor.user(), 'username', '')),
          "requestor" : true  
        }],
        "source" : { 
          "site" : Meteor.absoluteUrl(),
          "identifier": {
            "value": 'Apple Health Importer'
          }
        },
        "entity": []
      };
      
      if(typeof HipaaLogger === "object"){
        HipaaLogger.logAuditEvent(importRecordEvent, {validate: get(Meteor, 'settings.public.defaults.schemas.validate', false)}, function(error, result){
          if(error) console.error('HipaaLogger.logEvent.error.invalidKeys', error.invalidKeys);
          if(result) console.log('Audit event logged:', result);
        });   
      }
      
      return { success: true, message: 'Apple Health data imported successfully' };
      
    } catch (error) {
      console.error('Error importing Apple Health data:', error);
      return { success: false, error: error.message };
    }
  },
  processAppleHealthXML: async function(xmlContent, settings = {}) {
    console.log('Processing Apple Health XML data...');
    console.log('XML content size:', (xmlContent.length / 1024 / 1024).toFixed(2), 'MB');
    
    // Default settings
    settings = Object.assign({
      includeWorkouts: true,
      includeRecords: true,
      timeRange: 'all'
    }, settings);
    
    // For very large files (>50MB), use streaming approach
    if (xmlContent.length > 50 * 1024 * 1024) {
      console.log('Large file detected, using optimized chunk-based parser...');
      return this.processAppleHealthXMLChunked(xmlContent, settings);
    }
    
    // Use standard parser for smaller files
    const parserOptions = {
      explicitArray: false,
      mergeAttrs: true,
      normalize: true,
      normalizeTags: true,
      attrValueProcessors: [
        (value) => {
          // Try to parse numbers
          const num = Number(value);
          return isNaN(num) ? value : num;
        }
      ]
    };
    
    return new Promise((resolve, reject) => {
      console.log('Starting XML parse...');
      
      parseString(xmlContent, parserOptions, async (err, result) => {
        if (err) {
          console.error('Error parsing XML:', err);
          reject(err);
          return;
        }
        
        console.log('XML parsed successfully');
        
        // Get time range filter
        const now = moment();
        let startDate;
        switch(settings.timeRange) {
          case 'lastMonth':
            startDate = now.clone().subtract(1, 'month');
            break;
          case 'lastYear':
            startDate = now.clone().subtract(1, 'year');
            break;
          case 'lastDecade':
            startDate = now.clone().subtract(10, 'years');
            break;
          default:
            startDate = moment('1900-01-01'); // All data
        }
        
        console.log(`Filtering data from ${startDate.format('YYYY-MM-DD')} to present`);
        
        // Get patient ID for all observations
        const selectedPatient = Session.get('selectedPatient');
        const patientId = get(selectedPatient, 'id') || get(Meteor.user(), 'patientId', 'unknown');
        const patientDisplay = get(selectedPatient, 'name[0].text') || 
                              get(selectedPatient, 'name[0].given[0]') || 
                              get(Meteor.user(), 'profile.name.text') || 
                              get(Meteor.user(), 'username') || 
                              'Unknown Patient';
        
        // Process Correlations (e.g., Blood Pressure with combined readings)
        if (result.healthdata && result.healthdata.correlation) {
          const correlations = Array.isArray(result.healthdata.correlation) 
            ? result.healthdata.correlation 
            : [result.healthdata.correlation];
          console.log(`Found ${correlations.length} correlations`);
          
          for (const correlation of correlations) {
            const correlationType = correlation.type;
            
            // Skip if type is not selected
            if (settings.selectedTypes && !settings.selectedTypes.includes(correlationType)) {
              console.log(`Skipping correlation type: ${correlationType} (not selected)`);
              continue;
            }
            
            // Check date filter
            const correlationDate = moment(correlation.startdate || correlation.creationdate);
            if (correlationDate.isBefore(startDate)) continue;
            
            // Handle blood pressure correlations specially
            if (correlationType === 'HKCorrelationTypeIdentifierBloodPressure' && correlation.record) {
              const records = Array.isArray(correlation.record) ? correlation.record : [correlation.record];
              let systolic = null;
              let diastolic = null;
              
              for (const record of records) {
                if (record.type === 'HKQuantityTypeIdentifierBloodPressureSystolic') {
                  systolic = parseFloat(record.value);
                }
                if (record.type === 'HKQuantityTypeIdentifierBloodPressureDiastolic') {
                  diastolic = parseFloat(record.value);
                }
              }
              
              if (systolic && diastolic) {
                // Create combined blood pressure observation
                const bpObservation = {
                  id: Random.id(),
                  resourceType: 'Observation',
                  status: 'final',
                  code: {
                    coding: [{
                      system: 'http://loinc.org',
                      code: '85354-9',
                      display: 'Blood pressure panel'
                    }],
                    text: 'Blood Pressure'
                  },
                  subject: {
                    reference: `Patient/${patientId}`,
                    display: patientDisplay
                  },
                  effectiveDateTime: correlationDate.toISOString(),
                  component: [
                    {
                      code: {
                        coding: [{
                          system: 'http://loinc.org',
                          code: '8480-6',
                          display: 'Systolic blood pressure'
                        }]
                      },
                      valueQuantity: {
                        value: systolic,
                        unit: 'mmHg',
                        system: 'http://unitsofmeasure.org',
                        code: 'mm[Hg]'
                      }
                    },
                    {
                      code: {
                        coding: [{
                          system: 'http://loinc.org',
                          code: '8462-4',
                          display: 'Diastolic blood pressure'
                        }]
                      },
                      valueQuantity: {
                        value: diastolic,
                        unit: 'mmHg',
                        system: 'http://unitsofmeasure.org',
                        code: 'mm[Hg]'
                      }
                    }
                  ],
                  meta: {
                    source: 'Apple Health'
                  }
                };
                
                // Check if combined BP observation already exists before inserting
                const existingBP = await Collections.Observations._collection.findOneAsync({_id: bpObservation._id});
                if (!existingBP) {
                  await Collections.Observations._collection.insertAsync(bpObservation);
                  console.log('Inserted combined blood pressure observation');
                } else {
                  console.log('Combined blood pressure observation already exists, skipping');
                }
              }
            }
          }
        }
        
        // Process Records (health data)
        if (result.healthdata && result.healthdata.record) {
          const records = Array.isArray(result.healthdata.record) ? result.healthdata.record : [result.healthdata.record];
          console.log(`Found ${records.length} health records`);
          
          // Process in batches to avoid memory issues
          const BATCH_SIZE = 1000;
          let processedCount = 0;
          
          // Group records by type for batch processing
          const recordsByType = {};
          
          for (let i = 0; i < records.length; i++) {
            const record = records[i];
            const recordDate = moment(record.creationdate || record.startdate);
            
            // Apply time filter
            if (recordDate.isBefore(startDate)) continue;
            
            const type = record.type;
            if (!recordsByType[type]) {
              recordsByType[type] = [];
            }
            recordsByType[type].push(record);
            
            // Process in batches
            if (i > 0 && i % BATCH_SIZE === 0) {
              processedCount = i;
              console.log(`Processed ${processedCount}/${records.length} records...`);
              // Allow UI to update
              await new Promise(resolve => setTimeout(resolve, 10));
            }
          }
          
          // Convert to FHIR Observations
          for (const [type, records] of Object.entries(recordsByType)) {
            // Skip if type is not selected
            if (settings.selectedTypes && !settings.selectedTypes.includes(type)) {
              console.log(`Skipping ${records.length} records of type: ${type} (not selected)`);
              continue;
            }
            console.log(`Processing ${records.length} records of type: ${type}`);
            await this.convertToFhirObservations(type, records);
          }
        }
        
        // Process Workouts
        if (settings.includeWorkouts && result.healthdata && result.healthdata.workout) {
          const workouts = Array.isArray(result.healthdata.workout) ? result.healthdata.workout : [result.healthdata.workout];
          console.log(`Found ${workouts.length} workouts`);
          
          for (const workout of workouts) {
            const workoutDate = moment(workout.creationdate || workout.startdate);
            
            // Apply time filter
            if (workoutDate.isBefore(startDate)) continue;
            
            await this.convertWorkoutToProcedure(workout);
          }
        }
        
        resolve();
      });
    });
  },
  processAppleHealthXMLChunked: async function(xmlContent, settings = {}) {
    console.log('Using optimized chunk-based processing for large XML file...');
    
    // Get time range filter
    const now = moment();
    let startDate;
    switch(settings.timeRange) {
      case 'lastMonth':
        startDate = now.clone().subtract(1, 'month');
        break;
      case 'lastYear':
        startDate = now.clone().subtract(1, 'year');
        break;
      case 'lastDecade':
        startDate = now.clone().subtract(10, 'years');
        break;
      default:
        startDate = moment('1900-01-01'); // All data
    }
    
    console.log(`Filtering data from ${startDate.format('YYYY-MM-DD')} to present`);
    
    // Process XML using regex for better performance on huge files
    let recordCount = 0;
    let workoutCount = 0;
    let processedCount = 0;
    const recordsByType = {};
    const BATCH_SIZE = 500; // Smaller batch for memory efficiency
    
    // Extract records using regex - much faster than full XML parsing
    console.log('Extracting health records...');
    const recordRegex = /<Record\s+([^>]+)\/>/g;
    let recordMatch;
    let lastLogTime = Date.now();
    
    while ((recordMatch = recordRegex.exec(xmlContent)) !== null) {
      const attributes = this.parseAttributes(recordMatch[1]);
      
      // Check date filter
      const recordDate = moment(attributes.creationDate || attributes.startDate);
      if (recordDate.isBefore(startDate)) continue;
      
      const type = attributes.type;
      if (!type) continue;
      
      // Skip if type is not selected
      if (settings.selectedTypes && !settings.selectedTypes.includes(type)) {
        continue;
      }
      
      if (!recordsByType[type]) {
        recordsByType[type] = [];
      }
      
      recordsByType[type].push({
        type: attributes.type,
        value: attributes.value,
        unit: attributes.unit,
        startDate: attributes.startDate,
        endDate: attributes.endDate,
        creationDate: attributes.creationDate,
        sourceName: attributes.sourceName
      });
      
      recordCount++;
      processedCount++;
      
      // Process batch when it reaches size
      if (recordsByType[type].length >= BATCH_SIZE) {
        console.log(`Processing batch of ${BATCH_SIZE} ${type} records...`);
        await this.convertToFhirObservations(type, recordsByType[type]);
        recordsByType[type] = [];
        
        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Log progress every 5 seconds
      if (Date.now() - lastLogTime > 5000) {
        console.log(`Processed ${processedCount} records so far...`);
        lastLogTime = Date.now();
        // Allow UI update
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    // Process any remaining records
    for (const [type, records] of Object.entries(recordsByType)) {
      if (records.length > 0) {
        console.log(`Processing final batch of ${records.length} ${type} records...`);
        await this.convertToFhirObservations(type, records);
      }
    }
    
    // Process workouts if enabled
    if (settings.includeWorkouts) {
      console.log('Extracting workout data...');
      const workoutRegex = /<Workout\s+([^>]+)>/g;
      let workoutMatch;
      
      while ((workoutMatch = workoutRegex.exec(xmlContent)) !== null) {
        const attributes = this.parseAttributes(workoutMatch[1]);
        
        // Check date filter
        const workoutDate = moment(attributes.creationDate || attributes.startDate);
        if (workoutDate.isBefore(startDate)) continue;
        
        await this.convertWorkoutToProcedure({
          workoutActivityType: attributes.workoutActivityType,
          duration: attributes.duration,
          totalEnergyBurned: attributes.totalEnergyBurned,
          totalDistance: attributes.totalDistance,
          startDate: attributes.startDate,
          endDate: attributes.endDate
        });
        
        workoutCount++;
        
        if (workoutCount % 100 === 0) {
          console.log(`Processed ${workoutCount} workouts...`);
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
    }
    
    console.log(`Chunk-based processing complete!`);
    console.log(`Total processed: ${recordCount} health records, ${workoutCount} workouts`);
    console.log(`Records imported to FHIR Observations and Procedures collections`);
  },
  parseAttributes: function(attrString) {
    const attributes = {};
    const attrRegex = /(\w+)="([^"]*)"/g;
    let match;
    
    while ((match = attrRegex.exec(attrString)) !== null) {
      attributes[match[1]] = match[2];
    }
    
    return attributes;
  },
  convertToFhirObservations: async function(type, records) {
    // Map Apple Health types to LOINC codes
    const typeToLoinc = {
      'HKQuantityTypeIdentifierHeartRate': { code: '8867-4', display: 'Heart rate', unit: 'beats/min' },
      'HKQuantityTypeIdentifierBloodPressureSystolic': { code: '8480-6', display: 'Systolic blood pressure', unit: 'mmHg' },
      'HKQuantityTypeIdentifierBloodPressureDiastolic': { code: '8462-4', display: 'Diastolic blood pressure', unit: 'mmHg' },
      'HKQuantityTypeIdentifierBodyMass': { code: '29463-7', display: 'Body weight', unit: 'kg' },
      'HKQuantityTypeIdentifierHeight': { code: '8302-2', display: 'Body height', unit: 'cm' },
      'HKQuantityTypeIdentifierBodyMassIndex': { code: '39156-5', display: 'Body mass index', unit: 'kg/m2' },
      'HKQuantityTypeIdentifierStepCount': { code: '55423-8', display: 'Number of steps', unit: 'steps' },
      'HKQuantityTypeIdentifierDistanceWalkingRunning': { code: '55430-3', display: 'Distance walked', unit: 'm' },
      'HKQuantityTypeIdentifierActiveEnergyBurned': { code: '41981-2', display: 'Calories burned', unit: 'kcal' },
      'HKQuantityTypeIdentifierBasalEnergyBurned': { code: '41980-4', display: 'Basal energy burned', unit: 'kcal' },
      'HKQuantityTypeIdentifierFlightsClimbed': { code: '93828-9', display: 'Flights climbed', unit: 'flights' },
      'HKQuantityTypeIdentifierOxygenSaturation': { code: '59408-5', display: 'Oxygen saturation', unit: '%' },
      'HKQuantityTypeIdentifierBloodGlucose': { code: '15074-8', display: 'Glucose', unit: 'mg/dL' },
      'HKQuantityTypeIdentifierBodyTemperature': { code: '8310-5', display: 'Body temperature', unit: 'Cel' },
      'HKQuantityTypeIdentifierRespiratoryRate': { code: '9279-1', display: 'Respiratory rate', unit: 'breaths/min' },
      'HKQuantityTypeIdentifierRestingHeartRate': { code: '40443-4', display: 'Resting heart rate', unit: 'beats/min' },
      'HKCategoryTypeIdentifierSleepAnalysis': { code: '93832-1', display: 'Sleep duration', unit: 'min' }
    };
    
    const loincInfo = typeToLoinc[type];
    if (!loincInfo) {
      // Skip unknown types silently to avoid spamming console
      return;
    }
    
    // Get current patient ID - prefer selectedPatient, fallback to user's patientId
    const selectedPatient = Session.get('selectedPatient');
    const patientId = get(selectedPatient, 'id') || get(Meteor.user(), 'patientId', 'unknown');
    const patientDisplay = get(selectedPatient, 'name[0].text') || 
                          get(selectedPatient, 'name[0].given[0]') || 
                          get(Meteor.user(), 'profile.name.text') || 
                          get(Meteor.user(), 'username') || 
                          'Unknown Patient';
    
    // Build batch of observations
    const observations = [];
    
    for (const record of records) {
      // Skip invalid records
      if (!record.value) continue;
      
      const observation = {
        resourceType: 'Observation',
        id: Random.id(),
        status: 'final',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: loincInfo.code,
            display: loincInfo.display
          }],
          text: loincInfo.display
        },
        subject: {
          reference: `Patient/${patientId}`,
          display: patientDisplay
        },
        effectiveDateTime: record.startDate || record.creationDate,
        issued: moment(record.creationDate).toISOString(),
        valueQuantity: {
          value: parseFloat(record.value),
          unit: record.unit || loincInfo.unit,
          system: 'http://unitsofmeasure.org',
          code: record.unit || loincInfo.unit
        },
        device: {
          display: record.sourceName || 'Apple Health'
        },
        meta: {
          tag: [{
            system: 'http://honeycomb.health/tags',
            code: 'apple-health-import',
            display: 'Apple Health Import'
          }]
        }
      };
      
      observations.push(observation);
    }
    
    // Batch insert observations
    if (observations.length > 0 && Collections && Collections.Observations) {
      try {
        // Insert in smaller chunks to avoid memory issues
        const CHUNK_SIZE = 100;
        for (let i = 0; i < observations.length; i += CHUNK_SIZE) {
          const chunk = observations.slice(i, i + CHUNK_SIZE);
          for (const obs of chunk) {
            // Check if observation already exists before inserting
            const existing = await Collections.Observations._collection.findOneAsync({_id: obs._id});
            if (!existing) {
              await Collections.Observations._collection.insertAsync(obs);
            }
          }
        }
        console.log(`Inserted ${observations.length} ${loincInfo.display} observations`);
      } catch (error) {
        console.error('Error inserting observations:', error.message);
      }
    }
  },
  convertWorkoutToProcedure: async function(workout) {
    // Map workout types to SNOMED codes
    const workoutTypeToSnomed = {
      'HKWorkoutActivityTypeWalking': { code: '226029000', display: 'Walking' },
      'HKWorkoutActivityTypeRunning': { code: '226034008', display: 'Running' },
      'HKWorkoutActivityTypeCycling': { code: '226027003', display: 'Cycling' },
      'HKWorkoutActivityTypeSwimming': { code: '20461001', display: 'Swimming' },
      'HKWorkoutActivityTypeYoga': { code: '183083006', display: 'Yoga' },
      'HKWorkoutActivityTypeStrengthTraining': { code: '226138002', display: 'Strength training' },
      'HKWorkoutActivityTypeElliptical': { code: '226113002', display: 'Elliptical training' },
      'HKWorkoutActivityTypeRowing': { code: '226123005', display: 'Rowing' }
    };
    
    const snomedInfo = workoutTypeToSnomed[workout.workoutActivityType] || 
                      { code: '228448008', display: 'Physical activity' };
    
    // Get patient ID - prefer selectedPatient, fallback to user's patientId
    const selectedPatient = Session.get('selectedPatient');
    const patientId = get(selectedPatient, 'id') || get(Meteor.user(), 'patientId', 'unknown');
    const patientDisplay = get(selectedPatient, 'name[0].text') || 
                          get(selectedPatient, 'name[0].given[0]') || 
                          get(Meteor.user(), 'profile.name.text') || 
                          get(Meteor.user(), 'username') || 
                          'Unknown Patient';
    
    const procedure = {
      resourceType: 'Procedure',
      id: Random.id(),
      status: 'completed',
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: snomedInfo.code,
          display: snomedInfo.display
        }],
        text: snomedInfo.display
      },
      subject: {
        reference: `Patient/${patientId}`,
        display: patientDisplay
      },
      performedPeriod: {
        start: workout.startDate,
        end: workout.endDate
      },
      note: [{
        text: `Duration: ${workout.duration} minutes, Energy: ${workout.totalEnergyBurned} kcal, Distance: ${workout.totalDistance} km`
      }],
      meta: {
        tag: [{
          system: 'http://honeycomb.health/tags',
          code: 'apple-health-workout',
          display: 'Apple Health Workout'
        }]
      }
    };
    
    // Insert the procedure
    if (Collections && Collections.Procedures) {
      try {
        await Collections.Procedures._collection.insertAsync(procedure);
      } catch (error) {
        console.error('Error inserting workout procedure:', error);
      }
    }
  },
  // Helper function to convert MongoDB Extended JSON dates to JavaScript Date objects
  transformMongoDbDates: function(obj) {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.transformMongoDbDates(item));
    }
    
    // Handle objects
    if (typeof obj === 'object') {
      // Check if this is a MongoDB Extended JSON date
      if (obj.$date) {
        return new Date(obj.$date);
      }
      
      // Recursively transform nested objects
      const transformed = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          transformed[key] = this.transformMongoDbDates(obj[key]);
        }
      }
      return transformed;
    }
    
    // Return primitives as-is
    return obj;
  },
  importFhirResource: async function(resource) {
    if (!resource || !resource.resourceType) {
      console.warn('Invalid FHIR resource:', resource);
      return;
    }
    
    // Transform MongoDB Extended JSON dates to JavaScript Date objects
    resource = this.transformMongoDbDates(resource);
    
    const collectionName = this.pluralizeResourceName(resource.resourceType);
    
    if (Collections && Collections[collectionName]) {
      // Ensure the resource has an ID
      if (!resource.id) {
        resource.id = Random.id();
      }
      if (!resource._id) {
        resource._id = resource.id;
      }
      
      // Add import tag
      if (!resource.meta) {
        resource.meta = {};
      }
      if (!resource.meta.tag) {
        resource.meta.tag = [];
      }
      resource.meta.tag.push({
        system: 'http://honeycomb.health/tags',
        code: 'apple-health-clinical',
        display: 'Apple Health Clinical Record'
      });
      
      try {
        // Check if resource already exists before inserting
        const existing = await Collections[collectionName]._collection.findOneAsync({_id: resource.id});
        if (!existing) {
          await Collections[collectionName]._collection.insertAsync(resource);
          console.log(`Imported ${resource.resourceType} with ID: ${resource.id}`);
        } else {
          console.log(`${resource.resourceType} with ID ${resource.id} already exists, skipping`);
        }
      } catch (error) {
        console.error(`Error importing ${resource.resourceType}:`, error);
      }
    } else {
      console.warn(`Collection not found for resource type: ${resource.resourceType}`);
    }
  },
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
  importNdjson: async function(dataContent){
    console.log('--------------------------------------------------------')
    console.log('MedicalRecordImporter.importNdjson');

    if(typeof dataContent === "string"){
      dataContent = dataContent.split('\n');
    }

    console.log("dataContent.length", dataContent.length)

    if(Array.isArray(dataContent)){
      dataContent.forEach(async function(record){

        let parsedRecord;

        if(typeof record === "object"){
          parsedRecord = record
        } else if (typeof record === "string"){
          try {
            if(JSON.parse(record)){
              parsedRecord = JSON.parse(record);
            }              
          } catch (error) {
            console.log('Doesnt seem that record was a parseable string.  No object found.', error)
          }

        }

        if(get(parsedRecord, 'resourceType')){
          console.log('Found a ' + get(parsedRecord, 'resourceType'));

          var newRecord = parsedRecord;
          // console.log('newRecord', newRecord)


          if(!newRecord.id){
            if(newRecord._id){
              newRecord.id = parsedRecord._id;
            } else {
              let newId = Random.id();
              newRecord.id = newId;
              newRecord._id = newId;
            }
          }

          // if there is an issued timestamp
          if(get(newRecord, 'issued')){
            // convert it from a String to Date, so we can sort it
            newRecord.issued = Date.parse(newRecord.issued);
          } else {
            // if there is no issued timestamp, but there is an effective timestamp
            // use that instead
            if(get(newRecord, 'effectiveDateTime')){
              newRecord.issued = Date.parse(get(newRecord, 'effectiveDateTime'));
            } 
          }


          if(Collections[MedicalRecordImporter.pluralizeResourceName(get(parsedRecord, 'resourceType'))]){
            if(!Collections[MedicalRecordImporter.pluralizeResourceName(get(parsedRecord, 'resourceType'))]._collection.findOne({_id: newRecord._id})){                  
              console.log('Couldnt find parsedRecord; attempting to insert.')
              await Collections[MedicalRecordImporter.pluralizeResourceName(get(parsedRecord, 'resourceType'))]._collection.insertAsync(newRecord, {validate: false, filter: false}, function(error){
                if(error) {
                  console.log('window(self.pluralizeResourceName(entry.resource.resourceType))._collection.insert.error', error)
                }
              });   
            }
          }
        }
      });
    }
  },
  importBundle: async function(dataContent, proxyUrl){    
    console.log('----------------------------------------------------');
    // console.log('MedicalRecordImporter.importBundle', typeof dataContent);
    // console.log('MedicalRecordImporter.importBundle.dataContent', dataContent);
    // console.log('MedicalRecordImporter.Collections', Collections);

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
       
    // Handle arrays of resources (like NDJSON imports)
    if(Array.isArray(parsedResults)){
      console.log('Found an array of ' + parsedResults.length + ' resources. Attempting import...');
      
      for(const resource of parsedResults){
        if(resource.resourceType){
          console.debug('Importing ' + resource.resourceType, resource);
          await self.importFhirResource(resource);
        }
      }
      return true;
    }

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
  },
  parseExcelWorkbook: async function(importBuffer){
    console.log('parseExcelWorkbook', importBuffer);
  
    let results = [];
    let worksheet = [];
    let orgs = [];
  
  
    if(mappingAlgorithm < algorithmCount){
      switch (mappingAlgorithm) {
        case 8:  // FHIR Endpoints
  
          Object.keys(importBuffer).forEach(async function(cell){ 
  
            // remove all non-numeric characters from the string
            let rowIndex = cell.replace(/\D/g,'');
  
            let row = {};
            if(worksheet[rowIndex]){
              row = worksheet[rowIndex];
            }
  
            let newOrganization = {
              resourceType: "Organization",
              active: true,
              name: "",
              telecom: [],
              address: [],
              contact: [],
              endpoint: []
            }
  
            let orgAddress = {
              use: 'work', 
              type: 'both',
              line: '',
              city: '',
              state: '',
              postalCode: '',
              country: ''
            }
            let cmioContact = {
              name: {
                text: ''
              },
              telecom: [{
                value: '',
                system: 'url',
                use: 'work'
              }]
            }
  
            if(orgs[rowIndex]){
              newOrganization = orgs[rowIndex];
  
              if(get(newOrganization, 'address[0]')){
                orgAddress = get(newOrganization, 'address[0]');
                newOrganization.address = [];
              }
              if(get(newOrganization, 'contact[0]')){
                cmioContact = get(newOrganization, 'contact[0]');
                newOrganization.contact = [];
              }
            }
  
  
            if(cell.includes('A')){
              row.organization = importBuffer[cell].v;  // each spreadsheet cell contains v, w, x, y, z properties
              newOrganization.name = importBuffer[cell].v;
            }
            if(cell.includes('B')){
              row.website = importBuffer[cell].v;  
  
              let endpointId = await Endpoints.insertAsync({
                resourceType: "Endpoint",
                url: importBuffer[cell].v
              })
              if(endpointId){
                newOrganization.endpoint.push({
                  display: "Homepage",
                  reference: "Endpoint/" + endpointId
                })  
              }
            }
            if(cell.includes('C')){
              row.state = importBuffer[cell].v; 
              orgAddress.state = importBuffer[cell].v; 
            }
            if(cell.includes('D')){
              row.city = importBuffer[cell].v;  
              orgAddress.city = importBuffer[cell].v; 
            }
            if(cell.includes('E')){
              row.zipcode = importBuffer[cell].v;  
              orgAddress.postalCode = importBuffer[cell].v; 
            }
            if(cell.includes('F')){
              row.street = importBuffer[cell].v;  
              orgAddress.line = importBuffer[cell].v; 
            }
            if(cell.includes('G')){
              row.cmio = importBuffer[cell].v;  
              cmioContact.name.text = importBuffer[cell].v;
            }
            if(cell.includes('H')){
              row.cmio_linkedin = importBuffer[cell].v;  
              cmioContact.telecom[0].value = importBuffer[cell].v;
            }
  
            if(get(cmioContact, 'name.text')){
              newOrganization.contact.push(cmioContact)
            }
            if(orgAddress){
              newOrganization.address.push(orgAddress)
            }
  
            worksheet[rowIndex] = row;
            orgs[rowIndex] = newOrganization;
          });
  
          console.log('worksheet', worksheet)
          console.log('orgs', orgs);
          
  
          let count = 0;
          let orgId;
          let endpointString = '';
          let endpointId;
  
          orgs.forEach(async function(newOrg){
            if(count > 0){
              orgId = await Organizations.insertAsync(newOrg, {validate: false, filter: false});  
              console.log('orgId', orgId);
              if(get(newOrg, 'endpoint[0].reference')){
                endpointString = get(newOrg, 'endpoint[0].reference');
                if(endpointString.includes("/")){
                  endpointId = endpointString.split("/")[1];
                } else {
                  endpointId = endpointString;
                }
                await Endpoints.updateAsync({_id: endpointId}, {$set: {
                  managingOrganization: {
                    display: newOrg.name,
                    reference: "Organization/" + orgId
                  }
                }})
              }         
            }
            count++;
          })
  
          break;     
        default:
          MedicalRecordImporter.importBundle(importBuffer);
          break;
      }
  
    } else {
      // we have a half dozen defaults, and then we drop into dynamicly loaded algorithms
      let packageCardinalityIndex = mappingAlgorithm - algorithmCount + 1;
      console.log('packageCardinalityIndex', packageCardinalityIndex);
  
      // specifically, the mappingAlgorithm is the half-dozen defaults plus the cardinality of the packages with ImportAlgorithms in alphabetical order
        let cardinality = 1;
        // to get the specified import algorithm, we loop through all the packages alphabetically, while counting up from 1
        Object.keys(Package).forEach(function(packageName){
        if(Package[packageName].ImportAlgorithm){
          console.log('Package[packageName]', Package[packageName])
          // if the cardinality of the alphabetical package matches that of the cardinality index
          if(cardinality === packageCardinalityIndex){
            console.log('found a match... ' + cardinality)
            // then we run that particular algorithm
            let importAlgorithm = Package[packageName].ImportAlgorithm;
            importAlgorithm.run(importBuffer, function(){
              browserHistory.push('/questionnaires')
            })
          } else {
            // otherwise, we increment the cardinality counter (but only for those packages exporting an ImportAlgorithm)
            cardinality++;
            console.log('incrementing... ' + cardinality)
          }
        }    
      });
    }
  
    console.log('results', results)           
  },  
  parseExcelWorkbook2: async function(importBuffer){
    console.log('parseExcelWorkbook', importBuffer);
  
    let results = [];
    let worksheet = [];
    let orgs = [];
  
  
    if(mappingAlgorithm < algorithmCount){
      switch (mappingAlgorithm) {
        case 8:  // FHIR Endpoints
  
          Object.keys(importBuffer).forEach(async function(cell){ 
  
            // remove all non-numeric characters from the string
            let rowIndex = cell.replace(/\D/g,'');
  
            let row = {};
            if(worksheet[rowIndex]){
              row = worksheet[rowIndex];
            }
  
            let newOrganization = {
              resourceType: "Organization",
              active: true,
              name: "",
              telecom: [],
              address: [],
              contact: [],
              endpoint: []
            }
  
            let orgAddress = {
              use: 'work', 
              type: 'both',
              line: '',
              city: '',
              state: '',
              postalCode: '',
              country: ''
            }
            let cmioContact = {
              name: {
                text: ''
              },
              telecom: [{
                value: '',
                system: 'url',
                use: 'work'
              }]
            }
  
            if(orgs[rowIndex]){
              newOrganization = orgs[rowIndex];
  
              if(get(newOrganization, 'address[0]')){
                orgAddress = get(newOrganization, 'address[0]');
                newOrganization.address = [];
              }
              if(get(newOrganization, 'contact[0]')){
                cmioContact = get(newOrganization, 'contact[0]');
                newOrganization.contact = [];
              }
            }
  
  
            if(cell.includes('A')){
              row.organization = importBuffer[cell].v;  // each spreadsheet cell contains v, w, x, y, z properties
              newOrganization.name = importBuffer[cell].v;
            }
            if(cell.includes('B')){
              row.website = importBuffer[cell].v;  
  
              let endpointId = await Endpoints.insertAsync({
                resourceType: "Endpoint",
                url: importBuffer[cell].v
              })
              if(endpointId){
                newOrganization.endpoint.push({
                  display: "Homepage",
                  reference: "Endpoint/" + endpointId
                })  
              }
            }
            if(cell.includes('C')){
              row.state = importBuffer[cell].v; 
              orgAddress.state = importBuffer[cell].v; 
            }
            if(cell.includes('D')){
              row.city = importBuffer[cell].v;  
              orgAddress.city = importBuffer[cell].v; 
            }
            if(cell.includes('E')){
              row.zipcode = importBuffer[cell].v;  
              orgAddress.postalCode = importBuffer[cell].v; 
            }
            if(cell.includes('F')){
              row.street = importBuffer[cell].v;  
              orgAddress.line = importBuffer[cell].v; 
            }
            if(cell.includes('G')){
              row.cmio = importBuffer[cell].v;  
              cmioContact.name.text = importBuffer[cell].v;
            }
            if(cell.includes('H')){
              row.cmio_linkedin = importBuffer[cell].v;  
              cmioContact.telecom[0].value = importBuffer[cell].v;
            }
  
            if(get(cmioContact, 'name.text')){
              newOrganization.contact.push(cmioContact)
            }
            if(orgAddress){
              newOrganization.address.push(orgAddress)
            }
  
            worksheet[rowIndex] = row;
            orgs[rowIndex] = newOrganization;
          });
  
          console.log('worksheet', worksheet)
          console.log('orgs', orgs);
          
  
          let count = 0;
          let orgId;
          let endpointString = '';
          let endpointId;
  
          orgs.forEach(async function(newOrg){
            if(count > 0){
              orgId = await Organizations.insertAsync(newOrg, {validate: false, filter: false});  
              console.log('orgId', orgId);
              if(get(newOrg, 'endpoint[0].reference')){
                endpointString = get(newOrg, 'endpoint[0].reference');
                if(endpointString.includes("/")){
                  endpointId = endpointString.split("/")[1];
                } else {
                  endpointId = endpointString;
                }
                await Endpoints.updateAsync({_id: endpointId}, {$set: {
                  managingOrganization: {
                    display: newOrg.name,
                    reference: "Organization/" + orgId
                  }
                }})
              }         
            }
            count++;
          })
  
          break;     
        default:
          MedicalRecordImporter.importBundle(importBuffer);
          break;
      }
  
    } else {
      // we have a half dozen defaults, and then we drop into dynamicly loaded algorithms
      let packageCardinalityIndex = mappingAlgorithm - algorithmCount + 1;
      console.log('packageCardinalityIndex', packageCardinalityIndex);
  
      // specifically, the mappingAlgorithm is the half-dozen defaults plus the cardinality of the packages with ImportAlgorithms in alphabetical order
        let cardinality = 1;
        // to get the specified import algorithm, we loop through all the packages alphabetically, while counting up from 1
        Object.keys(Package).forEach(function(packageName){
        if(Package[packageName].ImportAlgorithm){
          console.log('Package[packageName]', Package[packageName])
          // if the cardinality of the alphabetical package matches that of the cardinality index
          if(cardinality === packageCardinalityIndex){
            console.log('found a match... ' + cardinality)
            // then we run that particular algorithm
            let importAlgorithm = Package[packageName].ImportAlgorithm;
            importAlgorithm.run(importBuffer, function(){
              browserHistory.push('/questionnaires')
            })
          } else {
            // otherwise, we increment the cardinality counter (but only for those packages exporting an ImportAlgorithm)
            cardinality++;
            console.log('incrementing... ' + cardinality)
          }
        }    
      });
    }
  
    console.log('results', results)           
  },
  parseCsvFile: function(importBuffer){
    console.log('parseCsvFile', importBuffer);
    console.log('mappingAlgorithm', mappingAlgorithm);

    let results = [];
    let worksheet = [];
    let orgs = [];

    if(mappingAlgorithm >= algorithmCount){
      // we have a half dozen defaults, and then we drop into dynamicly loaded algorithms
      let packageCardinalityIndex = mappingAlgorithm - algorithmCount + 1;
      console.log('packageCardinalityIndex', packageCardinalityIndex);

      // specifically, the mappingAlgorithm is the half-dozen defaults plus the cardinality of the packages with ImportAlgorithms in alphabetical order
        let cardinality = 1;
        // to get the specified import algorithm, we loop through all the packages alphabetically, while counting up from 1
        Object.keys(Package).forEach(function(packageName){
        if(Package[packageName].ImportAlgorithm){
          console.log('Package[packageName]', Package[packageName])
          // if the cardinality of the alphabetical package matches that of the cardinality index
          if(cardinality === packageCardinalityIndex){
            console.log('found a match... ' + cardinality)
            // then we run that particular algorithm
            let importAlgorithm = Package[packageName].ImportAlgorithm;
            importAlgorithm.run(importBuffer, function(){
              browserHistory.push('/questionnaires')
            })
          } else {
            // otherwise, we increment the cardinality counter (but only for those packages exporting an ImportAlgorithm)
            cardinality++;
            console.log('incrementing... ' + cardinality)
          }
        }    
      });
    }
  }
}

export default MedicalRecordImporter;