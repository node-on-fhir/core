// server/publications/autopublish.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { get } from 'lodash';

// Helper function to build improved regex queries for patient search
function buildImprovedPatientQuery(searchRegex) {
  return {
    $or: [
      // ID fields
      {'id': {$regex: searchRegex}},
      {'_id': {$regex: searchRegex}},
      
      // Name fields - handle both direct and array access
      {'name.text': {$regex: searchRegex}},
      {'name.0.text': {$regex: searchRegex}},
      {'name.family': {$regex: searchRegex}},
      {'name.0.family': {$regex: searchRegex}},
      {'name.given': {$regex: searchRegex}},
      {'name.0.given': {$regex: searchRegex}},
      {'name.0.given.0': {$regex: searchRegex}},
      {'name.given.0': {$regex: searchRegex}},
      
      // Identifier fields
      {'identifier.value': {$regex: searchRegex}},
      {'identifier.0.value': {$regex: searchRegex}},
      
      // Telecom fields
      {'telecom.value': {$regex: searchRegex}},
      {'telecom.0.value': {$regex: searchRegex}},
      
      // Address fields
      {'address.city': {$regex: searchRegex}},
      {'address.0.city': {$regex: searchRegex}},
      {'address.state': {$regex: searchRegex}},
      {'address.0.state': {$regex: searchRegex}},
      {'address.postalCode': {$regex: searchRegex}},
      {'address.0.postalCode': {$regex: searchRegex}}
    ]
  };
}

// Import all collections that might need autopublishing
import { ActivityDefinitions } from '/imports/lib/schemas/SimpleSchemas/ActivityDefinitions';
import { AllergyIntolerances } from '/imports/lib/schemas/SimpleSchemas/AllergyIntolerances';
import { Appointments } from '/imports/lib/schemas/SimpleSchemas/Appointments';
import { ArtifactAssessments } from '/imports/lib/schemas/SimpleSchemas/ArtifactAssessments';
import { AuditEvents } from '/imports/lib/schemas/SimpleSchemas/AuditEvents';
import { Bundles } from '/imports/lib/schemas/SimpleSchemas/Bundles';
import { CarePlans } from '/imports/lib/schemas/SimpleSchemas/CarePlans';
import { CareTeams } from '/imports/lib/schemas/SimpleSchemas/CareTeams';
import { Claims } from '/imports/lib/schemas/SimpleSchemas/Claims';
import { CodeSystems } from '/imports/lib/schemas/SimpleSchemas/CodeSystems';
import { Communications } from '/imports/lib/schemas/SimpleSchemas/Communications';
import { CommunicationRequests } from '/imports/lib/schemas/SimpleSchemas/CommunicationRequests';
import { Compositions } from '/imports/lib/schemas/SimpleSchemas/Compositions';
import { Conditions } from '/imports/lib/schemas/SimpleSchemas/Conditions';
import { Consents } from '/imports/lib/schemas/SimpleSchemas/Consents';
import { Devices } from '/imports/lib/schemas/SimpleSchemas/Devices';
import { DiagnosticReports } from '/imports/lib/schemas/SimpleSchemas/DiagnosticReports';
import { DocumentReferences } from '/imports/lib/schemas/SimpleSchemas/DocumentReferences';
import { Encounters } from '/imports/lib/schemas/SimpleSchemas/Encounters';
import { Endpoints } from '/imports/lib/schemas/SimpleSchemas/Endpoints';
import { Evidences } from '/imports/lib/schemas/SimpleSchemas/Evidences';
import { ExplanationOfBenefits } from '/imports/lib/schemas/SimpleSchemas/ExplanationOfBenefits';
import { Goals } from '/imports/lib/schemas/SimpleSchemas/Goals';
import { GuidanceResponses } from '/imports/lib/schemas/SimpleSchemas/GuidanceResponses';
import { Immunizations } from '/imports/lib/schemas/SimpleSchemas/Immunizations';
import { ImagingStudies } from '/imports/lib/schemas/SimpleSchemas/ImagingStudies';
import { Libraries } from '/imports/lib/schemas/SimpleSchemas/Libraries';
import { Lists } from '/imports/lib/schemas/SimpleSchemas/Lists';
import { Locations } from '/imports/lib/schemas/SimpleSchemas/Locations';
import { Medications } from '/imports/lib/schemas/SimpleSchemas/Medications';
import { MedicationAdministrations } from '/imports/lib/schemas/SimpleSchemas/MedicationAdministrations';
import { MedicationRequests } from '/imports/lib/schemas/SimpleSchemas/MedicationRequests';
import { MedicationStatements } from '/imports/lib/schemas/SimpleSchemas/MedicationStatements';
import { Measures } from '/imports/lib/schemas/SimpleSchemas/Measures';
import { MeasureReports } from '/imports/lib/schemas/SimpleSchemas/MeasureReports';
import { Medias } from '/imports/lib/schemas/SimpleSchemas/Medias';
import { MessageHeaders } from '/imports/lib/schemas/SimpleSchemas/MessageHeaders';
import { NutritionOrders } from '/imports/lib/schemas/SimpleSchemas/NutritionOrders';
import { OperationOutcomes } from '/imports/lib/schemas/SimpleSchemas/OperationOutcomes';
import { Organizations } from '/imports/lib/schemas/SimpleSchemas/Organizations';
import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { PlanDefinitions } from '/imports/lib/schemas/SimpleSchemas/PlanDefinitions';
import { Practitioners } from '/imports/lib/schemas/SimpleSchemas/Practitioners';
import { Procedures } from '/imports/lib/schemas/SimpleSchemas/Procedures';
import { Questionnaires } from '/imports/lib/schemas/SimpleSchemas/Questionnaires';
import { QuestionnaireResponses } from '/imports/lib/schemas/SimpleSchemas/QuestionnaireResponses';
import { ResearchStudies } from '/imports/lib/schemas/SimpleSchemas/ResearchStudies';
import { ResearchSubjects } from '/imports/lib/schemas/SimpleSchemas/ResearchSubjects';
import { Schedules } from '/imports/lib/schemas/SimpleSchemas/Schedules';
import { ServiceRequests } from '/imports/lib/schemas/SimpleSchemas/ServiceRequests';
import { SupplyDeliveries } from '/imports/lib/schemas/SimpleSchemas/SupplyDeliveries';
import { Tasks } from '/imports/lib/schemas/SimpleSchemas/Tasks';
import { ValueSets } from '/imports/lib/schemas/SimpleSchemas/ValueSets';

// Map of collection names to collection objects
const collectionsMap = {
  'ActivityDefinitions': ActivityDefinitions,
  'AllergyIntolerances': AllergyIntolerances,
  'Appointments': Appointments,
  'ArtifactAssessments': ArtifactAssessments,
  'AuditEvents': AuditEvents,
  'Bundles': Bundles,
  'CarePlans': CarePlans,
  'CareTeams': CareTeams,
  'Claims': Claims,
  'CodeSystems': CodeSystems,
  'Communications': Communications,
  'CommunicationRequests': CommunicationRequests,
  'Compositions': Compositions,
  'Conditions': Conditions,
  'Consents': Consents,
  'Devices': Devices,
  'DiagnosticReports': DiagnosticReports,
  'DocumentReferences': DocumentReferences,
  'Encounters': Encounters,
  'Endpoints': Endpoints,
  'Evidences': Evidences,
  'ExplanationOfBenefits': ExplanationOfBenefits,
  'Goals': Goals,
  'GuidanceResponses': GuidanceResponses,
  'Immunizations': Immunizations,
  'ImagingStudies': ImagingStudies,
  'Libraries': Libraries,
  'Lists': Lists,
  'Locations': Locations,
  'Medications': Medications,
  'MedicationAdministrations': MedicationAdministrations,
  'MedicationRequests': MedicationRequests,
  'MedicationStatements': MedicationStatements,
  'Measures': Measures,
  'MeasureReports': MeasureReports,
  'Medias': Medias,
  'MessageHeaders': MessageHeaders,
  'NutritionOrders': NutritionOrders,
  'OperationOutcomes': OperationOutcomes,
  'Organizations': Organizations,
  'Observations': Observations,
  'Patients': Patients,
  'PlanDefinitions': PlanDefinitions,
  'Practitioners': Practitioners,
  'Procedures': Procedures,
  'Questionnaires': Questionnaires,
  'QuestionnaireResponses': QuestionnaireResponses,
  'ResearchStudies': ResearchStudies,
  'ResearchSubjects': ResearchSubjects,
  'Schedules': Schedules,
  'ServiceRequests': ServiceRequests,
  'SupplyDeliveries': SupplyDeliveries,
  'Tasks': Tasks,
  'ValueSets': ValueSets
};

// Check if we're in production
const isProduction = get(Meteor, 'settings.public.environment') === 'production';
const isDevelopment = !isProduction && (get(Meteor, 'settings.public.environment') === 'development' || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !get(Meteor, 'settings.public.environment'));

// Initialize autopublish if enabled AND not in production
const autopublishEnabled = get(Meteor, 'settings.private.fhir.autopublishSubscriptions', false) && isDevelopment;

// Also check for environment variable override for testing
const forceAutopublish = process.env.ENABLE_AUTOPUBLISH === 'true';
const finalAutopublishEnabled = autopublishEnabled || forceAutopublish;

if (finalAutopublishEnabled) {
  console.log('Autopublish is ENABLED for development/testing. Setting up automatic publications...');
  console.log('Environment:', process.env.NODE_ENV, 'Force autopublish:', forceAutopublish);
} else if (get(Meteor, 'settings.private.fhir.autopublishSubscriptions', false) && isProduction) {
  console.error('ERROR: Autopublish is not allowed in production. Ignoring autopublishSubscriptions setting.');
}

if (finalAutopublishEnabled) {

  // Create publications for each collection
  Object.keys(collectionsMap).forEach(function(collectionName) {
    const collection = collectionsMap[collectionName];
    
    if (collection && collection._collection) {
      // Check if this collection should be published based on settings
      const resourceConfig = get(Meteor, `settings.private.fhir.rest.${collectionName.slice(0, -1)}`, {});
      const shouldPublish = get(resourceConfig, 'publication', true);
      
      if (shouldPublish) {
        const publicationName = `autopublish.${collectionName}`;
        
        Meteor.publish(publicationName, function(query, options) {
          // Default empty query and options
          query = query || {};
          options = options || {};
          
          // Handle ObjectID conversion in queries
          if (query.$or && Array.isArray(query.$or)) {
            const expandedConditions = [];
            
            query.$or.forEach(condition => {
              // Always add the original condition
              expandedConditions.push(condition);
              
              // Check if any condition has _id as a string that looks like an ObjectID
              if (condition._id && typeof condition._id === 'string' && /^[a-f\d]{24}$/i.test(condition._id)) {
                // Also search for ObjectID version
                expandedConditions.push({ ...condition, _id: new Mongo.ObjectID(condition._id) });
              }
              
              // Check if searching by id field with an ObjectID-like string
              if (condition.id && typeof condition.id === 'string' && /^[a-f\d]{24}$/i.test(condition.id)) {
                // Also search _id field with both string and ObjectID versions
                expandedConditions.push({ _id: condition.id });
                expandedConditions.push({ _id: new Mongo.ObjectID(condition.id) });
              }
            });
            
            query.$or = expandedConditions;
          }
          
          // Special handling for Appointments - they use participant.actor.reference instead of patient/subject
          if (collectionName === 'Appointments') {
            // Check if this is a patient filter query
            if (query.$or && Array.isArray(query.$or)) {
              const hasPatientOrSubjectFilter = query.$or.some(condition => 
                condition['patient.reference'] || condition['subject.reference']
              );
              
              if (hasPatientOrSubjectFilter) {
                // Transform patient/subject filters to participant filters for appointments
                const transformedConditions = [];
                query.$or.forEach(condition => {
                  if (condition['patient.reference']) {
                    transformedConditions.push({
                      'participant.actor.reference': condition['patient.reference']
                    });
                  } else if (condition['subject.reference']) {
                    transformedConditions.push({
                      'participant.actor.reference': condition['subject.reference']
                    });
                  } else {
                    transformedConditions.push(condition);
                  }
                });
                query.$or = transformedConditions;
              }
            }
          }
          
          // Special handling for Schedules - they use actor.reference instead of patient/subject
          if (collectionName === 'Schedules') {
            // Check if this is a patient filter query
            if (query.$or && Array.isArray(query.$or)) {
              const hasPatientOrSubjectFilter = query.$or.some(condition => 
                condition['patient.reference'] || condition['subject.reference']
              );
              
              if (hasPatientOrSubjectFilter) {
                // Transform patient/subject filters to actor filters for schedules
                const transformedConditions = [];
                query.$or.forEach(condition => {
                  if (condition['patient.reference']) {
                    transformedConditions.push({
                      'actor.0.reference': condition['patient.reference']
                    });
                  } else if (condition['subject.reference']) {
                    transformedConditions.push({
                      'actor.0.reference': condition['subject.reference']
                    });
                  } else {
                    transformedConditions.push(condition);
                  }
                });
                query.$or = transformedConditions;
              }
            }
          }
          
          // In development, we can be more permissive
          // Cap at 100 records per cursor for performance
          options.limit = options.limit || 100;
          // Ensure user can't request more than 100 records
          if (options.limit > 100) {
            options.limit = 100;
          }
          
          // Default sort by most recent for better development experience
          if (!options.sort) {
            options.sort = { 
              '_id': -1  // Most recent first (naive but works with MongoDB ObjectIDs)
            };
          }
          
          // In development with autopublish, allow unauthenticated access for testing
          if (!this.userId && isDevelopment && finalAutopublishEnabled) {
            console.log(`Allowing unauthenticated access to ${collectionName} in development mode (max 100 records)`);
            // Continue with the query
          } else if (!this.userId) {
            // In production or without autopublish, require authentication
            return this.ready();
          } else if (this.userId) {
            // Add user-based filtering if needed
            // TODO: Implement proper PHI filtering in the future
            // if (['Conditions', 'Observations', 'Procedures', 'Immunizations', 'AllergyIntolerances'].includes(collectionName)) {
            //   // Only return records for patients the user has access to
            //   // This is a simplified example - you'd want more sophisticated access control
            //   query['subject.reference'] = { $exists: true };
            // }
          }
          
          // Special handling for Patients collection to debug
          if(collectionName === 'Patients' && query.$or) {
            console.log(`Publishing ${collectionName} with original query:`, JSON.stringify(query));
            
            // Check if we're searching for a specific ID
            const hasIdSearch = query.$or.some(condition => condition._id || condition.id);
            if(hasIdSearch) {
              console.log('ID search detected, checking collection for matches...');
              
              // Try to find by various ID formats
              // Note: Commenting out debug counts to avoid async issues in Meteor v3
              // These were only for debugging and not essential for the publication
              /*
              query.$or.forEach(async (condition) => {
                if(condition._id) {
                  const stringCount = await collection.find({_id: condition._id}).countAsync();
                  const objectIdCount = await collection.find({_id: new Mongo.ObjectID(condition._id)}).countAsync();
                  console.log(`Searching for _id: ${condition._id} - String matches: ${stringCount}, ObjectID matches: ${objectIdCount}`);
                }
                if(condition.id) {
                  const count = await collection.find({id: condition.id}).countAsync();
                  console.log(`Searching for id: ${condition.id} - Matches: ${count}`);
                }
              });
              */
            }
          } else {
            console.log(`Publishing ${collectionName} with query:`, JSON.stringify(query), 'options:', options, '(max 100 records)');
          }
          
          // Don't use count() in publications as it's not needed and causes issues in Meteor v3
          // Just return the cursor
          return collection.find(query, options);
        });
        
        console.log(`Created autopublish publication: ${publicationName}`);
      }
    }
  });
  
  // Also create a simple "all" publication for each collection for development
  Object.keys(collectionsMap).forEach(function(collectionName) {
    const collection = collectionsMap[collectionName];
    
    if (collection && collection._collection) {
      const publicationName = `${collectionName.toLowerCase()}.all`;
      
      Meteor.publish(publicationName, function() {
        if (!this.userId && isDevelopment && finalAutopublishEnabled) {
          console.log(`Publishing all ${collectionName} for development (unauthenticated) - limited to 100 records`);
          return collection.find({}, { 
            limit: 100,
            sort: { 
              '_id': -1  // Most recent first (naive but works with MongoDB ObjectIDs)
            }
          });
        } else if (!this.userId) {
          return this.ready();
        }
        
        console.log(`Publishing all ${collectionName} for development - limited to 100 records`);
        return collection.find({}, { 
          limit: 100,
          sort: { 
            '_id': -1  // Most recent first (naive but works with MongoDB ObjectIDs)
          }
        });
      });
      
      console.log(`Created development publication: ${publicationName}`);
    }
  });
} else {
  console.log('Autopublish is DISABLED. Publications must be set up manually.');
}

// Export the publication status for other modules to check
export { finalAutopublishEnabled as autopublishEnabled };