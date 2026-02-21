// packages/admin-tools/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';

// List of known FHIR resource types
const FHIR_RESOURCE_TYPES = [
  'Patients', 'Practitioners', 'Organizations', 'Locations',
  'Observations', 'Conditions', 'Procedures', 'Encounters',
  'MedicationRequests', 'Medications', 'AllergyIntolerances',
  'Immunizations', 'DiagnosticReports', 'DocumentReferences',
  'CarePlans', 'CareTeams', 'Goals', 'ServiceRequests',
  'Devices', 'Substances', 'Specimens', 'ImagingStudies',
  'Compositions', 'Lists', 'Questionnaires', 'QuestionnaireResponses',
  'Tasks', 'Consents', 'Provenances', 'AuditEvents',
  'RelatedPersons', 'Persons', 'Groups', 'HealthcareServices',
  'Endpoints', 'Schedules', 'Slots', 'Appointments',
  'NutritionOrders', 'NutritionProducts', 'BodyStructures',
  'Communications', 'CommunicationRequests', 'Measures', 'MeasureReports'
];

Meteor.methods({
  /**
   * Get statistics for all registered collections
   * @returns {Array} Array of collection stats objects
   */
  'adminTools.getCollectionStats': async function() {
    // Optional: Check for admin role
    // if (!this.userId) {
    //   throw new Meteor.Error('not-authorized', 'You must be logged in');
    // }

    const stats = [];

    // Get collections from global.Collections (set in server/main.js)
    const collections = global.Collections || Meteor.Collections || {};

    for (const [name, collection] of Object.entries(collections)) {
      if (collection && typeof collection.find === 'function') {
        try {
          let count = 0;

          // Use async count for Meteor v3
          if (typeof collection.countDocuments === 'function') {
            count = await collection.countDocuments({});
          } else if (typeof collection.find === 'function') {
            const cursor = collection.find({});
            if (typeof cursor.countAsync === 'function') {
              count = await cursor.countAsync();
            } else if (typeof cursor.count === 'function') {
              count = cursor.count();
            }
          }

          stats.push({
            name: name,
            count: count,
            isFhir: FHIR_RESOURCE_TYPES.includes(name)
          });
        } catch (error) {
          console.warn('[adminTools.getCollectionStats] Error counting ' + name + ':', error.message);
          stats.push({
            name: name,
            count: 0,
            isFhir: FHIR_RESOURCE_TYPES.includes(name),
            error: error.message
          });
        }
      }
    }

    // Sort by name
    stats.sort(function(a, b) {
      return a.name.localeCompare(b.name);
    });

    console.log('[adminTools.getCollectionStats] Returning stats for ' + stats.length + ' collections');
    return stats;
  },

  /**
   * Get sample documents from a collection
   * @param {String} collectionName - Name of the collection
   * @param {Object} options - Query options (limit, skip)
   * @returns {Array} Array of documents
   */
  'adminTools.getCollectionDocuments': async function(collectionName, options) {
    check(collectionName, String);
    check(options, Match.Optional({
      limit: Match.Optional(Number),
      skip: Match.Optional(Number)
    }));

    // Optional: Check for admin role
    // if (!this.userId) {
    //   throw new Meteor.Error('not-authorized', 'You must be logged in');
    // }

    const collections = global.Collections || Meteor.Collections || {};
    const collection = collections[collectionName];

    if (!collection) {
      throw new Meteor.Error('collection-not-found', 'Collection not found: ' + collectionName);
    }

    const queryOptions = {
      limit: get(options, 'limit', 5),
      skip: get(options, 'skip', 0),
      sort: { _id: -1 }  // Most recent first
    };

    try {
      let documents = [];
      const cursor = collection.find({}, queryOptions);

      if (typeof cursor.fetchAsync === 'function') {
        documents = await cursor.fetchAsync();
      } else if (typeof cursor.fetch === 'function') {
        documents = cursor.fetch();
      }

      console.log('[adminTools.getCollectionDocuments] Returning ' + documents.length + ' documents from ' + collectionName);
      return documents;
    } catch (error) {
      console.error('[adminTools.getCollectionDocuments] Error:', error);
      throw new Meteor.Error('fetch-error', 'Error fetching documents: ' + error.message);
    }
  },

  /**
   * Get server-side session/connection info
   * @returns {Object} Connection info
   */
  'adminTools.getConnectionInfo': function() {
    return {
      connectionId: this.connection ? this.connection.id : null,
      clientAddress: this.connection ? this.connection.clientAddress : null,
      httpHeaders: this.connection ? this.connection.httpHeaders : null,
      userId: this.userId
    };
  },

  /**
   * Drop all documents from a collection
   * @param {String} collectionName - Name of the collection to drop
   * @returns {Object} Result with count of removed documents
   */
  'adminTools.dropCollection': async function(collectionName) {
    check(collectionName, String);

    // Optional: Check for admin role
    // if (!this.userId) {
    //   throw new Meteor.Error('not-authorized', 'You must be logged in');
    // }

    const collections = global.Collections || Meteor.Collections || {};
    const collection = collections[collectionName];

    if (!collection) {
      throw new Meteor.Error('collection-not-found', 'Collection not found: ' + collectionName);
    }

    try {
      // Get count before dropping
      let countBefore = 0;
      const cursor = collection.find({});
      if (typeof cursor.countAsync === 'function') {
        countBefore = await cursor.countAsync();
      } else if (typeof cursor.count === 'function') {
        countBefore = cursor.count();
      }

      // Remove all documents
      let result;
      if (typeof collection.removeAsync === 'function') {
        result = await collection.removeAsync({});
      } else if (typeof collection.remove === 'function') {
        result = collection.remove({});
      }

      console.log('[adminTools.dropCollection] Dropped ' + countBefore + ' documents from ' + collectionName);

      return {
        success: true,
        collection: collectionName,
        documentsRemoved: countBefore
      };
    } catch (error) {
      console.error('[adminTools.dropCollection] Error:', error);
      throw new Meteor.Error('drop-error', 'Error dropping collection: ' + error.message);
    }
  },

  /**
   * Execute a registered admin method by name
   * This allows packages to define their own admin methods that can be called generically
   * @param {String} methodName - Full method name (e.g., 'patients.initialize')
   * @param {Object} params - Optional parameters to pass to the method
   * @returns {Object} Result from the method
   */
  'adminTools.executeMethod': async function(methodName, params) {
    check(methodName, String);
    check(params, Match.Optional(Object));

    // Optional: Check for admin role
    // if (!this.userId) {
    //   throw new Meteor.Error('not-authorized', 'You must be logged in');
    // }

    console.log('[adminTools.executeMethod] Executing: ' + methodName);

    try {
      // Use Meteor's internal method invocation
      const result = await Meteor.callAsync(methodName, params || {});

      console.log('[adminTools.executeMethod] Completed: ' + methodName);

      return {
        success: true,
        methodName: methodName,
        result: result
      };
    } catch (error) {
      console.error('[adminTools.executeMethod] Error executing ' + methodName + ':', error);
      throw new Meteor.Error('method-error', 'Error executing method: ' + error.message);
    }
  },

  /**
   * Initialize a collection with sample data
   * This is a generic initializer - packages can override with specific implementations
   * @param {String} collectionName - Name of the collection
   * @returns {Object} Result with initialization status
   */
  'adminTools.initializeCollection': async function(collectionName) {
    check(collectionName, String);

    // Optional: Check for admin role
    // if (!this.userId) {
    //   throw new Meteor.Error('not-authorized', 'You must be logged in');
    // }

    const collections = global.Collections || Meteor.Collections || {};
    const collection = collections[collectionName];

    if (!collection) {
      throw new Meteor.Error('collection-not-found', 'Collection not found: ' + collectionName);
    }

    // Check if there's a specific initialize method for this collection
    const specificMethodName = collectionName.toLowerCase() + '.initialize';

    try {
      // Try to call the specific initializer if it exists
      const result = await Meteor.callAsync(specificMethodName);
      console.log('[adminTools.initializeCollection] Called ' + specificMethodName);
      return {
        success: true,
        collection: collectionName,
        method: specificMethodName,
        result: result
      };
    } catch (error) {
      // If specific method doesn't exist, return info
      if (error.error === 404 || error.message.includes('not found')) {
        console.log('[adminTools.initializeCollection] No specific initializer for ' + collectionName);
        return {
          success: false,
          collection: collectionName,
          message: 'No initializer method found for this collection. Expected: ' + specificMethodName
        };
      }
      throw error;
    }
  },

  /**
   * Check whether patient archival is allowed via server-side private settings
   * @returns {Object} { allowPatientArchival: boolean }
   */
  'adminTools.checkArchivalSetting': async function() {
    const allowArchival = get(Meteor, 'settings.private.allowPatientArchival', false);
    console.log('[adminTools.checkArchivalSetting] allowPatientArchival:', allowArchival);
    return { allowPatientArchival: allowArchival };
  }
});
