// server/publications/autopublish.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { get } from 'lodash';
import LoggerModule from '/imports/lib/Logger.js';

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
import { BiologicallyDerivedProducts } from '/imports/lib/schemas/SimpleSchemas/BiologicallyDerivedProducts';
import { BodyStructures } from '/imports/lib/schemas/SimpleSchemas/BodyStructures';
import { Bundles } from '/imports/lib/schemas/SimpleSchemas/Bundles';
import { ClinicalImpressions } from '/imports/lib/schemas/SimpleSchemas/ClinicalImpressions';
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
import { EpisodeOfCares } from '/imports/lib/schemas/SimpleSchemas/EpisodeOfCares';
import { Endpoints } from '/imports/lib/schemas/SimpleSchemas/Endpoints';
import { Evidences } from '/imports/lib/schemas/SimpleSchemas/Evidences';
import { ExplanationOfBenefits } from '/imports/lib/schemas/SimpleSchemas/ExplanationOfBenefits';
import { Goals } from '/imports/lib/schemas/SimpleSchemas/Goals';
import { Groups } from '/imports/lib/schemas/SimpleSchemas/Groups';
import { GuidanceResponses } from '/imports/lib/schemas/SimpleSchemas/GuidanceResponses';
import { Citations } from '/imports/lib/schemas/SimpleSchemas/Citations';
import { DetectedIssues } from '/imports/lib/schemas/SimpleSchemas/DetectedIssues';
import { EvidenceVariables } from '/imports/lib/schemas/SimpleSchemas/EvidenceVariables';
import { Immunizations } from '/imports/lib/schemas/SimpleSchemas/Immunizations';
import { ImagingStudies } from '/imports/lib/schemas/SimpleSchemas/ImagingStudies';
import { Libraries } from '/imports/lib/schemas/SimpleSchemas/Libraries';
import { Lists } from '/imports/lib/schemas/SimpleSchemas/Lists';
import { Locations } from '/imports/lib/schemas/SimpleSchemas/Locations';
import { Medications } from '/imports/lib/schemas/SimpleSchemas/Medications';
import { MolecularSequences } from '/imports/lib/schemas/SimpleSchemas/MolecularSequences';
import { MedicationAdministrations } from '/imports/lib/schemas/SimpleSchemas/MedicationAdministrations';
import { MedicationRequests } from '/imports/lib/schemas/SimpleSchemas/MedicationRequests';
import { MedicationStatements } from '/imports/lib/schemas/SimpleSchemas/MedicationStatements';
import { Measures } from '/imports/lib/schemas/SimpleSchemas/Measures';
import { MeasureReports } from '/imports/lib/schemas/SimpleSchemas/MeasureReports';
import { Medias } from '/imports/lib/schemas/SimpleSchemas/Medias';
import { MessageHeaders } from '/imports/lib/schemas/SimpleSchemas/MessageHeaders';
import { NutritionIntakes } from '/imports/lib/schemas/SimpleSchemas/NutritionIntakes';
import { NutritionOrders } from '/imports/lib/schemas/SimpleSchemas/NutritionOrders';
import { NutritionProducts } from '/imports/lib/schemas/SimpleSchemas/NutritionProducts';
import { OperationOutcomes } from '/imports/lib/schemas/SimpleSchemas/OperationOutcomes';
import { Organizations } from '/imports/lib/schemas/SimpleSchemas/Organizations';
import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';
import { ObservationDefinitions } from '/imports/lib/schemas/SimpleSchemas/ObservationDefinitions';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { PlanDefinitions } from '/imports/lib/schemas/SimpleSchemas/PlanDefinitions';
import { Practitioners } from '/imports/lib/schemas/SimpleSchemas/Practitioners';
import { PractitionerRoles } from '/imports/lib/schemas/SimpleSchemas/PractitionerRoles';
import { Procedures } from '/imports/lib/schemas/SimpleSchemas/Procedures';
import { Provenances } from '/imports/lib/schemas/SimpleSchemas/Provenances';
import { Questionnaires } from '/imports/lib/schemas/SimpleSchemas/Questionnaires';
import { QuestionnaireResponses } from '/imports/lib/schemas/SimpleSchemas/QuestionnaireResponses';
import { ResearchStudies } from '/imports/lib/schemas/SimpleSchemas/ResearchStudies';
import { ResearchSubjects } from '/imports/lib/schemas/SimpleSchemas/ResearchSubjects';
import { RiskAssessments } from '/imports/lib/schemas/SimpleSchemas/RiskAssessments';
import { Schedules } from '/imports/lib/schemas/SimpleSchemas/Schedules';
import { SearchParameters } from '/imports/lib/schemas/SimpleSchemas/SearchParameters';
import { ServiceRequests } from '/imports/lib/schemas/SimpleSchemas/ServiceRequests';
import { Specimens } from '/imports/lib/schemas/SimpleSchemas/Specimens';
import { Substances } from '/imports/lib/schemas/SimpleSchemas/Substances';
import { SupplyDeliveries } from '/imports/lib/schemas/SimpleSchemas/SupplyDeliveries';
import { SupplyRequests } from '/imports/lib/schemas/SimpleSchemas/SupplyRequests';
import { Tasks } from '/imports/lib/schemas/SimpleSchemas/Tasks';
import { ValueSets } from '/imports/lib/schemas/SimpleSchemas/ValueSets';

const log = LoggerModule.Logger.for('Autopublish');
log.info('FILE IS BEING LOADED');

// Map of collection names to collection objects
const collectionsMap = {
  'ActivityDefinitions': ActivityDefinitions,
  'AllergyIntolerances': AllergyIntolerances,
  'Appointments': Appointments,
  'ArtifactAssessments': ArtifactAssessments,
  'AuditEvents': AuditEvents,
  'BiologicallyDerivedProducts': BiologicallyDerivedProducts,
  'BodyStructures': BodyStructures,
  'Bundles': Bundles,
  'CarePlans': CarePlans,
  'CareTeams': CareTeams,
  'Claims': Claims,
  'ClinicalImpressions': ClinicalImpressions,
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
  'EpisodeOfCares': EpisodeOfCares,
  'Endpoints': Endpoints,
  'Evidences': Evidences,
  'ExplanationOfBenefits': ExplanationOfBenefits,
  'Goals': Goals,
  'Groups': Groups,
  'GuidanceResponses': GuidanceResponses,
  'Citations': Citations,
  'DetectedIssues': DetectedIssues,
  'EvidenceVariables': EvidenceVariables,
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
  'MolecularSequences': MolecularSequences,
  'MessageHeaders': MessageHeaders,
  'NutritionIntakes': NutritionIntakes,
  'NutritionOrders': NutritionOrders,
  'NutritionProducts': NutritionProducts,
  'OperationOutcomes': OperationOutcomes,
  'Organizations': Organizations,
  'Observations': Observations,
  'ObservationDefinitions': ObservationDefinitions,
  'Patients': Patients,
  'PlanDefinitions': PlanDefinitions,
  'Practitioners': Practitioners,
  'PractitionerRoles': PractitionerRoles,
  'Procedures': Procedures,
  'Provenances': Provenances,
  'Questionnaires': Questionnaires,
  'QuestionnaireResponses': QuestionnaireResponses,
  'ResearchStudies': ResearchStudies,
  'ResearchSubjects': ResearchSubjects,
  'RiskAssessments': RiskAssessments,
  'Schedules': Schedules,
  'SearchParameters': SearchParameters,
  'ServiceRequests': ServiceRequests,
  'Specimens': Specimens,
  'Substances': Substances,
  'SupplyDeliveries': SupplyDeliveries,
  'SupplyRequests': SupplyRequests,
  'Tasks': Tasks,
  'ValueSets': ValueSets
};

// Patient-scoped resources that REQUIRE a patient filter in the query.
// If the client subscribes with an empty query (no patient/subject reference),
// these collections will return nothing instead of leaking all records.
const PATIENT_SCOPED_RESOURCES = new Set([
  'AllergyIntolerances',
  'Appointments',
  'BodyStructures',
  'CarePlans',
  'CareTeams',
  'ClinicalImpressions',
  'Communications',
  'Compositions',
  'Conditions',
  'Consents',
  'DetectedIssues',
  'DiagnosticReports',
  'DocumentReferences',
  'Encounters',
  'ExplanationOfBenefits',
  'Goals',
  'Immunizations',
  'ImagingStudies',
  'MedicationAdministrations',
  'MedicationRequests',
  'MedicationStatements',
  'MolecularSequences',
  'NutritionIntakes',
  'NutritionOrders',
  'Observations',
  'Procedures',
  'QuestionnaireResponses',
  'RiskAssessments',
  'Schedules',
  'ServiceRequests',
  'Specimens',
  'SupplyDeliveries',
  'SupplyRequests',
  'Tasks'
]);

// Check if we're in production
const isProduction = get(Meteor, 'settings.public.environment') === 'production';
const isDevelopment = !isProduction && (get(Meteor, 'settings.public.environment') === 'development' || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !get(Meteor, 'settings.public.environment'));

log.info('Environment check', {
  settingsEnvironment: get(Meteor, 'settings.public.environment'),
  nodeEnv: process.env.NODE_ENV,
  isProduction,
  isDevelopment,
  autopublishSubscriptions: get(Meteor, 'settings.private.fhir.autopublishSubscriptions', false)
});

// Initialize autopublish if enabled AND not in production
const autopublishEnabled = get(Meteor, 'settings.private.fhir.autopublishSubscriptions', false) && isDevelopment;

// Also check for environment variable override for testing
const forceAutopublish = process.env.ENABLE_AUTOPUBLISH === 'true';
const finalAutopublishEnabled = autopublishEnabled || forceAutopublish;

log.info('Autopublish configuration', { autopublishEnabled, forceAutopublish, finalAutopublishEnabled });

if (finalAutopublishEnabled) {
  log.info('Autopublish is ENABLED for development/testing. Setting up automatic publications.', { nodeEnv: process.env.NODE_ENV, forceAutopublish });
} else if (get(Meteor, 'settings.private.fhir.autopublishSubscriptions', false) && isProduction) {
  log.error('Autopublish is not allowed in production. Ignoring autopublishSubscriptions setting.');
} else {
  log.info('Autopublish is DISABLED. Publications must be set up manually.', { reason: 'autopublishEnabled=' + autopublishEnabled + ' (needs autopublishSubscriptions=true AND isDevelopment=true)' });
}

if (finalAutopublishEnabled) {

  log.info('Starting autopublish setup, checking Devices');
  // log.debug('Devices in collectionsMap', { devices: collectionsMap['Devices'] });
  log.info('Devices type', { devicesType: typeof collectionsMap['Devices'] });

  // Create publications for each collection
  Object.keys(collectionsMap).forEach(function(collectionName) {
    const collection = collectionsMap[collectionName];

    if (collection && typeof collection.find === 'function') {
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
          
          // Optimize for ID queries - they're much faster and should bypass limits
          const isIdQuery = query.$or && query.$or.length >= 2 &&
                            query.$or.every(condition => condition._id || condition.id);

          // Get configured limit for use in both branches
          const configuredLimit = get(Meteor, 'settings.public.defaults.subscriptionLimit', 1000);

          if (isIdQuery) {
            // ID queries are fast lookups on indexed fields - no need for limits
            log.debug('Publishing - ID query (unlimited)', { collection: collectionName, query });
            // Remove any limit for ID queries
            delete options.limit;
          } else {
            // Regular queries need limits for performance
            // In development, we can be more permissive
            // Cap at configured limit (default 1000) for performance
            options.limit = options.limit || configuredLimit;
            // Ensure user can't request more than configured maximum
            if (options.limit > configuredLimit) {
              options.limit = configuredLimit;
            }
            log.debug('Publishing with query', { collection: collectionName, query, options });
          }
          
          // Default sort by most recent for better development experience
          if (!options.sort) {
            options.sort = { 
              '_id': -1  // Most recent first (naive but works with MongoDB ObjectIDs)
            };
          }
          
          // Always require authentication — no unauthenticated access to PHI
          if (!this.userId) {
            return this.ready();
          }

          // Guard: patient-scoped resources require a patient filter in the
          // query.  An empty query {} means "no patient selected" and would
          // leak every record in the collection to the client.
          if (PATIENT_SCOPED_RESOURCES.has(collectionName)) {
            const hasPatientFilter = query.$or || query.$and ||
              query['subject.reference'] || query['patient.reference'] ||
              query['participant.actor.reference'] || query['actor.0.reference'];
            if (!hasPatientFilter) {
              log.debug('Patient-scoped collection has no patient filter — returning empty', { collectionName });
              return this.ready();
            }
          }

          // Special handling for Patients collection to debug
          if(collectionName === 'Patients' && query.$or) {
            log.debug('Publishing Patients with original query', { query });

            // Check if we're searching for a specific ID
            const hasIdSearch = query.$or.some(condition => condition._id || condition.id);
            if(hasIdSearch) {
              log.debug('ID search detected, checking collection for matches');
              
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
            log.debug('Publishing with query', { collection: collectionName, query, options });
          }
          
          // Don't use count() in publications as it's not needed and causes issues in Meteor v3
          // Just return the cursor
          return collection.find(query, options);
        });
        
        log.info('Created autopublish publication', { publicationName });
      }
    } else {
      log.warn('Skipping collection: not a valid collection', { collectionName });
    }
  });

  // Also create a simple "all" publication for each collection for development
  Object.keys(collectionsMap).forEach(function(collectionName) {
    const collection = collectionsMap[collectionName];

    if (collection && typeof collection.find === 'function') {
      const publicationName = `${collectionName.toLowerCase()}.all`;
      
      Meteor.publish(publicationName, function() {
        const allPublicationLimit = get(Meteor, 'settings.public.defaults.subscriptionLimit', 1000);

        // Always require authentication — no unauthenticated access to PHI
        if (!this.userId) {
          return this.ready();
        }

        // Patient-scoped resources must not be published without a patient
        // filter via the ".all" publication — use selectedPatient.* instead.
        if (PATIENT_SCOPED_RESOURCES.has(collectionName)) {
          log.debug('Collection .all blocked — patient-scoped resource requires patient filter', { collectionName });
          return this.ready();
        }

        log.debug('Publishing all for development', { collection: collectionName, limit: allPublicationLimit });
        return collection.find({}, {
          limit: allPublicationLimit,
          sort: {
            '_id': -1  // Most recent first (naive but works with MongoDB ObjectIDs)
          }
        });
      });
      
      log.info('Created development publication', { publicationName });
    }
  });
} else {
  log.info('Autopublish is DISABLED. Publications must be set up manually.');
}

// Export the publication status for other modules to check
export { finalAutopublishEnabled as autopublishEnabled };