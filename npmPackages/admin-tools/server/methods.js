// packages/admin-tools/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('methods') : console);

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

// -----------------------------------------------------------------------------
// ServerMethods registry (rpc-migration). Bodies converted inline. These methods
// historically had their auth guards COMMENTED OUT (guard-less by intent — the
// admin dashboard is operator-facing). They are database-admin / destructive
// (dropCollection) operations, so requireAuth now defaults to true (behavior
// change noted: previously callable without login). The checkXSetting methods
// stay requireAuth:false — lightweight settings probes consumed by the gated
// pages before auth resolves, matching the settings-gated-feature pattern.

Meteor.ServerMethods.define('adminTools.getCollectionStats', {
  description: 'Get document counts and FHIR flags for all registered collections'
}, async function(params, context) {
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

    context.log.info('Returning collection stats', { count: stats.length });
    return stats;
});

/**
 * Get sample documents from a collection
 */
Meteor.ServerMethods.define('adminTools.getCollectionDocuments', {
  description: 'Fetch sample documents from a named collection',
  positionalParams: ['collectionName', 'options'],
  schemaObject: {
    type: 'object',
    properties: {
      collectionName: { type: 'string' },
      options: {
        type: 'object',
        properties: { limit: { type: 'number' }, skip: { type: 'number' } }
      }
    },
    required: ['collectionName']
  }
}, async function(params, context) {
    const collectionName = params.collectionName;
    const options = params.options;

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

      context.log.info('Returning documents', { count: documents.length, collectionName });
      return documents;
    } catch (error) {
      context.log.error('getCollectionDocuments error', { message: error.message });
      throw new Meteor.Error('fetch-error', 'Error fetching documents: ' + error.message);
    }
});

/**
 * Get server-side session/connection info. Public: read-only diagnostic that
 * intentionally works pre-login (reports whether a user is attached).
 */
Meteor.ServerMethods.define('adminTools.getConnectionInfo', {
  description: 'Report the caller server-side connection and session info',
  requireAuth: false
}, function(params, context) {
    return {
      connectionId: context.connection ? context.connection.id : null,
      clientAddress: context.ip || (context.connection ? context.connection.clientAddress : null),
      httpHeaders: context.connection ? context.connection.httpHeaders : null,
      userId: context.userId
    };
});

/**
 * Drop all documents from a collection (destructive)
 */
Meteor.ServerMethods.define('adminTools.dropCollection', {
  description: 'Remove every document from a named collection',
  positionalParams: ['collectionName'],
  schemaObject: {
    type: 'object',
    properties: { collectionName: { type: 'string' } },
    required: ['collectionName']
  }
}, async function(params, context) {
    const collectionName = params.collectionName;

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

      context.log.info('Dropped documents', { count: countBefore, collectionName });

      return {
        success: true,
        collection: collectionName,
        documentsRemoved: countBefore
      };
    } catch (error) {
      context.log.error('dropCollection error', { message: error.message });
      throw new Meteor.Error('drop-error', 'Error dropping collection: ' + error.message);
    }
});

/**
 * Execute a registered admin method by name. Allows packages to define their
 * own admin methods that can be called generically.
 */
Meteor.ServerMethods.define('adminTools.executeMethod', {
  description: 'Invoke another registered admin method by name',
  positionalParams: ['methodName', 'params'],
  schemaObject: {
    type: 'object',
    properties: { methodName: { type: 'string' }, params: { type: 'object' } },
    required: ['methodName']
  }
}, async function(params, context) {
    const methodName = params.methodName;
    const methodParams = params.params;

    context.log.info('Executing method', { methodName });

    try {
      // Use Meteor's internal method invocation
      const result = await Meteor.callAsync(methodName, methodParams || {});

      context.log.info('Method completed', { methodName });

      return {
        success: true,
        methodName: methodName,
        result: result
      };
    } catch (error) {
      context.log.error('executeMethod error', { methodName, message: error.message });
      throw new Meteor.Error('method-error', 'Error executing method: ' + error.message);
    }
});

/**
 * Initialize a collection with sample data. Generic initializer — packages can
 * override with specific implementations.
 */
Meteor.ServerMethods.define('adminTools.initializeCollection', {
  description: 'Run the resource-specific initializer for a named collection',
  positionalParams: ['collectionName'],
  schemaObject: {
    type: 'object',
    properties: { collectionName: { type: 'string' } },
    required: ['collectionName']
  }
}, async function(params, context) {
    const collectionName = params.collectionName;

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
      context.log.info('Called initializer', { specificMethodName });
      return {
        success: true,
        collection: collectionName,
        method: specificMethodName,
        result: result
      };
    } catch (error) {
      // If specific method doesn't exist, return info
      if (error.error === 404 || error.message.includes('not found')) {
        context.log.info('No specific initializer', { collectionName });
        return {
          success: false,
          collection: collectionName,
          message: 'No initializer method found for this collection. Expected: ' + specificMethodName
        };
      }
      throw error;
    }
});

/**
 * Check whether patient archival is allowed via server-side private settings.
 * Public: lightweight settings probe consumed by the gated page before auth.
 */
Meteor.ServerMethods.define('adminTools.checkArchivalSetting', {
  description: 'Report whether patient archival is enabled in server settings',
  requireAuth: false
}, async function() {
    const allowArchival = get(Meteor, 'settings.private.allowPatientArchival', false);
    log.debug('adminTools.checkArchivalSetting allowPatientArchival', { allowArchival });
    return { allowPatientArchival: allowArchival };
});

/**
 * Check whether patient renaming is allowed via server-side private settings.
 * Public: lightweight settings probe consumed by the gated page before auth.
 */
Meteor.ServerMethods.define('adminTools.checkRenameSetting', {
  description: 'Report whether patient renaming is enabled in server settings',
  requireAuth: false
}, async function() {
    const allowRename = get(Meteor, 'settings.private.allowPatientRename', false);
    log.debug('adminTools.checkRenameSetting allowPatientRename', { allowRename });
    return { allowPatientRename: allowRename };
});

/**
 * Check whether patient anonymization is allowed via server-side private settings.
 * Public: lightweight settings probe consumed by the gated page before auth.
 */
Meteor.ServerMethods.define('adminTools.checkAnonymizationSetting', {
  description: 'Report whether patient anonymization is enabled in server settings',
  requireAuth: false
}, async function() {
    const allowAnonymization = get(Meteor, 'settings.private.allowPatientAnonymization', false);
    log.debug('adminTools.checkAnonymizationSetting allowPatientAnonymization', { allowAnonymization });
    return { allowPatientAnonymization: allowAnonymization };
});
