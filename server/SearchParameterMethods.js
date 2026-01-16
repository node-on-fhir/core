// server/SearchParameterMethods.js
// SearchParameter initialization - uses SearchParametersEngine for compile-time processing
import { get, has } from 'lodash';
import { Meteor } from 'meteor/meteor';

import { SearchParameters } from '../imports/lib/schemas/SimpleSchemas/SearchParameters';
import { SearchParametersEngine } from './SearchParametersEngine.js';

console.log('[SearchParameterMethods] File loaded, INITIALIZE_SEARCH_PARAMETERS:', process.env.INITIALIZE_SEARCH_PARAMETERS);

Meteor.startup(async function(){
  console.log('[SearchParameterMethods] Meteor.startup called, INITIALIZE_SEARCH_PARAMETERS:', process.env.INITIALIZE_SEARCH_PARAMETERS);
  if(process.env.INITIALIZE_SEARCH_PARAMETERS){
    try {
      // Compile the SearchParametersEngine (loads core + package SearchParameters)
      console.log('[SearchParameterMethods] Compiling SearchParametersEngine...');
      await SearchParametersEngine.compile();

      // Insert all SearchParameters to MongoDB for FHIR /SearchParameter endpoint discovery
      const allParams = SearchParametersEngine.getAllSearchParams();
      let insertCount = 0;
      let skipCount = 0;

      for (const sp of allParams) {
        if (get(sp, 'resourceType') === 'SearchParameter') {
          try {
            const existing = await SearchParameters.findOneAsync({id: get(sp, 'id')});
            if (!existing) {
              await SearchParameters.insertAsync(sp);
              insertCount++;
              console.log('[SearchParameterMethods] Inserted:', get(sp, 'id'));
            } else {
              skipCount++;
            }
          } catch (error) {
            console.error('[SearchParameterMethods] Error inserting', get(sp, 'id'), ':', error.message);
          }
        }
      }

      console.log('[SearchParameterMethods] MongoDB insert complete. Inserted: ' + insertCount + ', Skipped: ' + skipCount);
      console.log('[SearchParameterMethods] SearchParametersEngine.isCompiled():', SearchParametersEngine.isCompiled());
    } catch (error) {
      console.error('[SearchParameterMethods] Error during initialization:', error);
    }
  } else {
    console.log('[SearchParameterMethods] INITIALIZE_SEARCH_PARAMETERS not set, skipping engine compilation');
  }

  // Always log the engine state for debugging
  console.log('[SearchParameterMethods] Engine state - enabled:', SearchParametersEngine.isEnabled(), ', compiled:', SearchParametersEngine.isCompiled());
})  


Meteor.methods({
  initSearchParameters: async function(){
      console.log("Initializing search parameters....");
      
      // Check if already initialized
      try {
          const existingCount = await SearchParameters.find({}).countAsync();
          if (existingCount > 0) {
              console.log(`[SearchParameterMethods] SearchParameters already initialized with ${existingCount} parameters`);
          }
      } catch (error) {
          console.log(`[SearchParameterMethods] Could not check existing count, proceeding with initialization:`, error.message);
      }

      let patientAddressCity = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-patient-address-city.json'));
      let patientBirthdate = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-patient-birthdate.json'));
      let patientFamily = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-patient-family.json'));
      let patientGiven = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-patient-given.json'));
      let patientIdentifier = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-patient-identifier.json'));
      let patientLanguage = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-patient-language.json'));
      let patientName = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-patient-name.json'));
      let patientOrganization = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-patient-organization.json'));
      let patientTelecom = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-patient-telecom.json'));
      let patientGender = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-patient-gender.json'));

      // Resource patient search parameters
      let conditionPatient = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-condition-patient.json'));
      let observationPatient = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-observation-patient.json'));
      let procedurePatient = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-procedure-patient.json'));
      let encounterPatient = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-encounter-patient.json'));
      let medicationRequestPatient = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-medicationrequest-patient.json'));
      
      // Additional CRUD-tested resources with patient references
      let allergyIntolerancePatient = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-allergyintolerance-patient.json'));
      let appointmentPatient = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-appointment-patient.json'));
      let carePlanPatient = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-careplan-patient.json'));
      let consentPatient = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-consent-patient.json'));
      let devicePatient = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-device-patient.json'));
      let diagnosticReportPatient = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-diagnosticreport-patient.json'));
      let documentReferencePatient = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-documentreference-patient.json'));
      let imagingStudyPatient = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-imagingstudy-patient.json'));
      let immunizationPatient = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-immunization-patient.json'));
      let mediaPatient = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-media-patient.json'));
      let medicationAdministrationPatient = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-medicationadministration-patient.json'));
      let nutritionOrderPatient = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-nutritionorder-patient.json'));
      let questionnaireResponsePatient = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-questionnaireresponse-patient.json'));
      let researchSubjectPatient = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-researchsubject-patient.json'));
      let serviceRequestPatient = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-servicerequest-patient.json'));
      let supplyDeliveryPatient = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-supplydelivery-patient.json'));

      // Category and status search parameters for ONC certification
      let carePlanCategory = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-careplan-category.json'));
      let careTeamStatus = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-careteam-status.json'));
      let conditionCategory = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-condition-category.json'));
      let diagnosticReportCategory = JSON.parse(await Assets.getTextAsync('SearchParameters/SearchParameter-diagnosticreport-category.json'));

      let searchParametersArray = [
        patientAddressCity,
        patientBirthdate,
        patientFamily,
        patientGiven,
        patientIdentifier,
        patientLanguage,
        patientName,
        patientOrganization,
        patientTelecom,
        patientGender,
        conditionPatient,
        observationPatient,
        procedurePatient,
        encounterPatient,
        medicationRequestPatient,
        allergyIntolerancePatient,
        appointmentPatient,
        carePlanPatient,
        consentPatient,
        devicePatient,
        diagnosticReportPatient,
        documentReferencePatient,
        imagingStudyPatient,
        immunizationPatient,
        mediaPatient,
        medicationAdministrationPatient,
        nutritionOrderPatient,
        questionnaireResponsePatient,
        researchSubjectPatient,
        serviceRequestPatient,
        supplyDeliveryPatient,
        // Category and status search parameters for ONC certification
        carePlanCategory,
        careTeamStatus,
        conditionCategory,
        diagnosticReportCategory
      ];

      let insertCount = 0;
      let skipCount = 0;
      
      for (const searchParameter of searchParametersArray) {
          if(get(searchParameter, 'resourceType') === "SearchParameter"){
              try {
                  const existing = await SearchParameters.findOneAsync({id: get(searchParameter, 'id')});
                  if(!existing){
                      await SearchParameters.insertAsync(searchParameter);
                      insertCount++;
                      console.log(`[SearchParameterMethods] Inserted SearchParameter: ${get(searchParameter, 'id')}`);
                  } else {
                      skipCount++;
                  }
              } catch (error) {
                  console.error(`[SearchParameterMethods] Error processing ${get(searchParameter, 'id')}:`, error);
              }
          }
      }
      
      console.log(`[SearchParameterMethods] Search parameters initialization complete. Inserted ${insertCount} new parameters.`);
      return { inserted: insertCount, total: searchParametersArray.length };
  },
  
  clearSearchParameters: async function(){
      console.log("[SearchParameterMethods] Clearing all search parameters...");
      try {
          const count = await SearchParameters.find({}).countAsync();
          await SearchParameters.removeAsync({});
          console.log(`[SearchParameterMethods] Cleared ${count} search parameters`);
          return { cleared: count };
      } catch (error) {
          console.error(`[SearchParameterMethods] Error clearing search parameters:`, error);
          throw error;
      }
  },
  
  listSearchParameters: async function(){
      const params = await SearchParameters.find({}, { 
          fields: { id: 1, code: 1, base: 1, type: 1 } 
      }).fetchAsync();
      
      console.log(`[SearchParameterMethods] Found ${params.length} search parameters`);
      params.forEach(p => {
          console.log(`  - ${p.id}: code=${p.code}, base=${p.base}, type=${p.type}`);
      });
      
      return params;
  }
})