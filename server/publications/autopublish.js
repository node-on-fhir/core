// server/publications/autopublish.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Import all collections that might need autopublishing
import { ActivityDefinitions } from '/imports/lib/schemas/SimpleSchemas/ActivityDefinitions';
import { AllergyIntolerances } from '/imports/lib/schemas/SimpleSchemas/AllergyIntolerances';
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
import { Devices } from '/imports/lib/schemas/SimpleSchemas/Devices';
import { DocumentReferences } from '/imports/lib/schemas/SimpleSchemas/DocumentReferences';
import { Encounters } from '/imports/lib/schemas/SimpleSchemas/Encounters';
import { Endpoints } from '/imports/lib/schemas/SimpleSchemas/Endpoints';
import { Evidences } from '/imports/lib/schemas/SimpleSchemas/Evidences';
import { ExplanationOfBenefits } from '/imports/lib/schemas/SimpleSchemas/ExplanationOfBenefits';
import { Goals } from '/imports/lib/schemas/SimpleSchemas/Goals';
import { GuidanceResponses } from '/imports/lib/schemas/SimpleSchemas/GuidanceResponses';
import { Immunizations } from '/imports/lib/schemas/SimpleSchemas/Immunizations';
import { Libraries } from '/imports/lib/schemas/SimpleSchemas/Libraries';
import { Lists } from '/imports/lib/schemas/SimpleSchemas/Lists';
import { Locations } from '/imports/lib/schemas/SimpleSchemas/Locations';
import { Medications } from '/imports/lib/schemas/SimpleSchemas/Medications';
import { MedicationAdministrations } from '/imports/lib/schemas/SimpleSchemas/MedicationAdministrations';
import { MedicationRequests } from '/imports/lib/schemas/SimpleSchemas/MedicationRequests';
import { MedicationStatements } from '/imports/lib/schemas/SimpleSchemas/MedicationStatements';
import { Measures } from '/imports/lib/schemas/SimpleSchemas/Measures';
import { MeasureReports } from '/imports/lib/schemas/SimpleSchemas/MeasureReports';
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
import { ServiceRequests } from '/imports/lib/schemas/SimpleSchemas/ServiceRequests';
import { Tasks } from '/imports/lib/schemas/SimpleSchemas/Tasks';
import { ValueSets } from '/imports/lib/schemas/SimpleSchemas/ValueSets';

// Map of collection names to collection objects
const collectionsMap = {
  'ActivityDefinitions': ActivityDefinitions,
  'AllergyIntolerances': AllergyIntolerances,
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
  'Devices': Devices,
  'DocumentReferences': DocumentReferences,
  'Encounters': Encounters,
  'Endpoints': Endpoints,
  'Evidences': Evidences,
  'ExplanationOfBenefits': ExplanationOfBenefits,
  'Goals': Goals,
  'GuidanceResponses': GuidanceResponses,
  'Immunizations': Immunizations,
  'Libraries': Libraries,
  'Lists': Lists,
  'Locations': Locations,
  'Medications': Medications,
  'MedicationAdministrations': MedicationAdministrations,
  'MedicationRequests': MedicationRequests,
  'MedicationStatements': MedicationStatements,
  'Measures': Measures,
  'MeasureReports': MeasureReports,
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
  'ServiceRequests': ServiceRequests,
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
          
          // In development, we can be more permissive
          options.limit = options.limit || 1000;
          
          // In development with autopublish, allow unauthenticated access for testing
          if (!this.userId && isDevelopment && finalAutopublishEnabled) {
            console.log(`Allowing unauthenticated access to ${collectionName} in development mode`);
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
          
          console.log(`Publishing ${collectionName} with query:`, query, 'options:', options);
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
          console.log(`Publishing all ${collectionName} for development (unauthenticated)`);
          return collection.find({});
        } else if (!this.userId) {
          return this.ready();
        }
        
        console.log(`Publishing all ${collectionName} for development`);
        return collection.find({});
      });
      
      console.log(`Created development publication: ${publicationName}`);
    }
  });
} else {
  console.log('Autopublish is DISABLED. Publications must be set up manually.');
}

// Export the publication status for other modules to check
export { finalAutopublishEnabled as autopublishEnabled };