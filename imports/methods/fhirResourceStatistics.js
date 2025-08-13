// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/methods/fhirResourceStatistics.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

Meteor.methods({
  async 'fhir.getResourceStatistics'() {
    console.log('fhir.getResourceStatistics - Starting resource statistics collection');
    
    if (!Meteor.isServer) {
      throw new Meteor.Error('not-authorized', 'This method can only be called on the server');
    }
    
    const statistics = {};
    
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
          console.log(`Collection ${collectionName} not found in Meteor.Collections, global scope, or Meteor`);
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
          lastModified: null
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

          // Get collection indices if available
          if (Collection.rawCollection) {
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

    console.log('fhir.getResourceStatistics - Completed', Object.keys(statistics).length, 'collections');
    return statistics;
  }
});