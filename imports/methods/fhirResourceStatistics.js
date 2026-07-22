// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/methods/fhirResourceStatistics.js

import { Meteor } from 'meteor/meteor';
import ServerMethods from '/imports/lib/ServerMethods.js';
import { get } from 'lodash';

// rpc migration: legacy name was already dotted, so the canonical name is
// unchanged and no alias is needed. Pre-migration this method had NO auth
// guard (latent bug — it also creates indexes as a side effect); requireAuth
// now applies (default true).
ServerMethods.define('fhir.getResourceStatistics', {
  description: 'Collect per-collection record counts, indices, and DDP publication info for all FHIR collections'
}, async function(params, context) {
    context.log.info('fhir.getResourceStatistics - Starting resource statistics collection');

    const statistics = {};
    
    // Get DDP publication info
    const ddpPublications = {};
    const publications = Meteor.server.publish_handlers;
    if (publications) {
      Object.keys(publications).forEach(pubName => {
        // Extract resource name from publication name (handles both patterns)
        // Pattern 1: "patients.search", "conditions.byPatient"
        // Pattern 2: "Patients", "Conditions"
        let resourceName = null;
        
        // Try lowercase pattern first (e.g., "patients.search")
        const lowercaseMatch = pubName.match(/^([a-z]+)\./);
        if (lowercaseMatch) {
          // Capitalize and potentially pluralize
          resourceName = lowercaseMatch[1].charAt(0).toUpperCase() + lowercaseMatch[1].slice(1);
          if (!resourceName.endsWith('s')) {
            resourceName += 's';
          }
        } else {
          // Try uppercase pattern (e.g., "Patients")
          const uppercaseMatch = pubName.match(/^([A-Z][a-z]+(?:[A-Z][a-z]+)*)/);
          if (uppercaseMatch) {
            resourceName = uppercaseMatch[1];
            // Ensure it's plural
            if (!resourceName.endsWith('s')) {
              resourceName += 's';
            }
          }
        }
        
        if (resourceName) {
          if (!ddpPublications[resourceName]) {
            ddpPublications[resourceName] = [];
          }
          ddpPublications[resourceName].push(pubName);
        }
      });
    }
    
    // Define the collections we want to check
    const collectionNames = [
      'ActivityDefinitions',
      'AllergyIntolerances',
      'Appointments',
      'ArtifactAssessments',
      'Bundles',
      'CarePlans',
      'CareTeams',
      'Claims',
      'CodeSystems',
      'Communications',
      'Compositions',
      'Conditions',
      'Consents',
      'Devices',
      'DiagnosticReports',
      'DocumentReferences',
      'Encounters',
      'Evidences',
      'Goals',
      'GuidanceResponses',
      'ImagingStudies',
      'Immunizations',
      'Libraries',
      'Lists',
      'Locations',
      'MedicationAdministrations',
      'MedicationRequests',
      'MedicationStatements',
      'Medications',
      'NutritionOrders',
      'Observations',
      'OperationOutcomes',
      'Patients',
      'PlanDefinitions',
      'Practitioners',
      'Procedures',
      'QuestionnaireResponses',
      'Questionnaires',
      'ResearchStudies',
      'ResearchSubjects',
      'Schedules',
      'ServiceRequests',
      'Tasks',
      'ValueSets'
    ];

    // Try to get each collection dynamically
    for (const collectionName of collectionNames) {
      try {
        // Try to get the collection from various possible locations
        const Collection = get(Meteor, `Collections.${collectionName}`) || 
                         global[collectionName] || 
                         Meteor[collectionName];
        
        if (!Collection) {
          context.log.warn('Collection not found in Meteor.Collections, global scope, or Meteor', { collectionName });
          statistics[collectionName] = {
            serverCount: 0,
            clientCount: 0,
            indices: [],
            hooks: [],
            error: 'Collection not found'
          };
          continue;
        }

        const stats = {
          serverCount: 0,
          clientCount: 0,
          indices: [],
          hooks: [],
          lastModified: null,
          ddpPublications: ddpPublications[collectionName] || [],
          hasRestEndpoint: false
        };

        try {
          // Get server count using the countAsync method for Meteor v3
          if (Collection.countAsync) {
            stats.serverCount = await Collection.countAsync();
          } else if (Collection.find) {
            // Fallback for older API
            stats.serverCount = await Collection.find().countAsync();
          }
          
          // Get the most recent document
          if (Collection.findAsync) {
            const cursor = await Collection.findAsync({}, {
              sort: { 'meta.lastUpdated': -1 },
              limit: 1
            });
            const mostRecent = await cursor.fetch();
            
            if (mostRecent && mostRecent[0]) {
              stats.lastModified = get(mostRecent[0], 'meta.lastUpdated');
            }
          }

          // Get collection indices if available (skip empty collections to avoid "ns does not exist" warnings)
          if (Collection.rawCollection && stats.serverCount > 0) {
            try {
              const rawCollection = Collection.rawCollection();
              if (rawCollection && rawCollection.indexes) {
                const indices = await rawCollection.indexes();
                stats.indices = indices.map(index => ({
                  name: index.name,
                  fields: Object.keys(index.key || {}),
                  type: index.textIndexVersion ? 'text' :
                        index['2dsphereIndexVersion'] ? '2dsphere' :
                        'standard',
                  unique: index.unique || false,
                  sparse: index.sparse || false
                }));

                // Ensure common FHIR indices exist for populated collections
                const existingIndexFields = indices.map(idx => Object.keys(idx.key || {}).join(','));

                const commonIndices = [
                  { 'subject.reference': 1 },
                  { 'patient.reference': 1 },
                  { 'code.coding.code': 1 },
                  { 'category.coding.code': 1 },
                  { 'effectiveDateTime': -1 }
                ];

                for (const indexSpec of commonIndices) {
                  const indexKey = Object.keys(indexSpec).join(',');
                  if (!existingIndexFields.includes(indexKey)) {
                    try {
                      await rawCollection.createIndex(indexSpec);
                      context.log.info('Created index', { indexKey, collectionName });
                    } catch (e) {
                      // Best-effort: collection may not have this field, which is fine
                    }
                  }
                }
              }
            } catch (indexError) {
              console.warn(`Could not get indices for ${collectionName}:`, indexError.message);
            }
          }

        } catch (error) {
          console.error(`Error getting stats for ${collectionName}:`, error);
          stats.error = error.message;
        }

        statistics[collectionName] = stats;

      } catch (error) {
        console.error(`Error processing collection ${collectionName}:`, error);
        statistics[collectionName] = {
          serverCount: 0,
          clientCount: 0,
          indices: [],
          hooks: [],
          error: error.message
        };
      }
    }

    context.log.info('fhir.getResourceStatistics - Completed', { collections: Object.keys(statistics).length });
    return statistics;
});