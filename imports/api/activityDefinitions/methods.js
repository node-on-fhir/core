// /imports/api/activityDefinitions/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import moment from 'moment';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/ActivityDefinitions';

// Get the correct ActivityDefinitions collection reference
function getActivityDefinitions() {
  if (Meteor.isServer) {
    // On server, use the global collection set up in server/main.js
    return Meteor.Collections?.ActivityDefinitions || global.ActivityDefinitions;
  } else {
    // On client, use from Meteor.Collections if available
    return Meteor.Collections?.ActivityDefinitions;
  }
}

Meteor.ServerMethods.define('activityDefinitions.create', {
  description: 'Create a new ActivityDefinition resource',
  schemaObject: { type: 'object' }   // arbitrary FHIR ActivityDefinition shape
}, async function(params, context){
  const activityDefinitionData = params;

  // Add metadata
  const activityDefinition = {
    ...activityDefinitionData,
    resourceType: 'ActivityDefinition',
    meta: {
      lastUpdated: new Date(),
      versionId: '1'
    }
  };

  // Set _id based on environment variable for consistent sorting with Synthea data
  if (process.env.USE_MONGO_OBJECTID) {
    const { Mongo } = Package.mongo;
    const objectId = new Mongo.ObjectID();
    // Convert to hex string for Meteor compatibility
    activityDefinition._id = objectId.toHexString();
    context.log.info('Using MongoDB ObjectID (as hex string)', { _id: activityDefinition._id });
  }
  // Otherwise Meteor will auto-generate a random string ID

  // Insert and return the new activity definition
  const ActivityDefinitions = getActivityDefinitions();
  const activityDefinitionId = await ActivityDefinitions.insertAsync(activityDefinition);

  // Log for HIPAA compliance
  context.log.info('ActivityDefinition created', {
    userId: context.userId,
    activityDefinitionId: activityDefinitionId,
    timestamp: new Date()
  });

  return activityDefinitionId;
});

Meteor.ServerMethods.define('activityDefinitions.update', {
  description: 'Update an existing ActivityDefinition resource by id',
  positionalParams: ['activityDefinitionId', 'activityDefinitionData'],
  schemaObject: {
    type: 'object',
    properties: {
      activityDefinitionId: { type: 'string' },
      activityDefinitionData: { type: 'object' }
    },
    required: ['activityDefinitionId', 'activityDefinitionData']
  }
}, async function(params, context){
  const activityDefinitionId = params.activityDefinitionId;
  const activityDefinitionData = params.activityDefinitionData;

  const ActivityDefinitions = getActivityDefinitions();

  // Check if activity definition exists
  const existingActivityDefinition = await ActivityDefinitions.findOneAsync({ _id: activityDefinitionId });
  if (!existingActivityDefinition) {
    throw new Meteor.Error('not-found', 'ActivityDefinition not found');
  }

  // Update metadata
  const updatedActivityDefinition = {
    ...activityDefinitionData,
    _id: activityDefinitionId,
    resourceType: 'ActivityDefinition',
    meta: {
      ...get(activityDefinitionData, 'meta', {}),
      lastUpdated: new Date(),
      versionId: String(parseInt(get(existingActivityDefinition, 'meta.versionId', '0')) + 1)
    }
  };

  // Update the activity definition
  const result = await ActivityDefinitions.updateAsync(
    { _id: activityDefinitionId },
    { $set: updatedActivityDefinition }
  );

  // Log for HIPAA compliance
  context.log.info('ActivityDefinition updated', {
    userId: context.userId,
    activityDefinitionId: activityDefinitionId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('activityDefinitions.get', {
  description: 'Fetch a single ActivityDefinition resource by id',
  positionalParams: ['activityDefinitionId'],
  schemaObject: {
    type: 'object',
    properties: {
      activityDefinitionId: { type: 'string' }
    },
    required: ['activityDefinitionId']
  }
}, async function(params, context){
  const activityDefinitionId = params.activityDefinitionId;

  const ActivityDefinitions = getActivityDefinitions();
  const activityDefinition = await ActivityDefinitions.findOneAsync({ _id: activityDefinitionId });

  if (!activityDefinition) {
    throw new Meteor.Error('not-found', 'ActivityDefinition not found');
  }

  // Log access for HIPAA compliance
  context.log.info('ActivityDefinition accessed', {
    userId: context.userId,
    activityDefinitionId: activityDefinitionId,
    timestamp: new Date()
  });

  return activityDefinition;
});

Meteor.ServerMethods.define('activityDefinitions.remove', {
  description: 'Delete an ActivityDefinition resource by id',
  positionalParams: ['activityDefinitionId'],
  schemaObject: {
    type: 'object',
    properties: {
      activityDefinitionId: { type: 'string' }
    },
    required: ['activityDefinitionId']
  }
}, async function(params, context){
  const activityDefinitionId = params.activityDefinitionId;

  const ActivityDefinitions = getActivityDefinitions();

  // Check if activity definition exists
  const existingActivityDefinition = await ActivityDefinitions.findOneAsync({ _id: activityDefinitionId });
  if (!existingActivityDefinition) {
    throw new Meteor.Error('not-found', 'ActivityDefinition not found');
  }

  // Remove the activity definition
  const result = await ActivityDefinitions.removeAsync({ _id: activityDefinitionId });

  // Log for HIPAA compliance
  context.log.info('ActivityDefinition deleted', {
    userId: context.userId,
    activityDefinitionId: activityDefinitionId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('activityDefinitions.search', {
  description: 'Search ActivityDefinition resources by name or title',
  schemaObject: { type: 'object' }   // { query, options, name, title } — all optional
}, async function(params, context){
  const searchOptions = params;

  const ActivityDefinitions = getActivityDefinitions();
  const { query = {}, options = {} } = searchOptions;

  // Add any necessary query transformations here
  // For example, searching by name or title
  if (searchOptions.name) {
    query['name'] = { $regex: searchOptions.name, $options: 'i' };
  }
  if (searchOptions.title) {
    query['title'] = { $regex: searchOptions.title, $options: 'i' };
  }

  // Set default options
  const findOptions = {
    limit: options.limit || 20,
    sort: options.sort || { 'meta.lastUpdated': -1 },
    ...options
  };

  const activityDefinitions = await ActivityDefinitions.find(query, findOptions).fetchAsync();

  // Log search for HIPAA compliance
  context.log.info('ActivityDefinitions searched', {
    userId: context.userId,
    query: query,
    resultCount: activityDefinitions.length,
    timestamp: new Date()
  });

  return activityDefinitions;
});
