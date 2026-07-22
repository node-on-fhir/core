// /imports/api/endpoints/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import moment from 'moment';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/Endpoints';

// Get the correct Endpoints collection reference
function getEndpoints() {
  if (Meteor.isServer) {
    // On server, use the global collection set up in server/main.js
    return Meteor.Collections?.Endpoints || global.Endpoints;
  } else {
    // On client, use from Meteor.Collections if available
    return Meteor.Collections?.Endpoints;
  }
}

Meteor.ServerMethods.define('endpoints.create', {
  description: 'Create a FHIR Endpoint record',
  schemaObject: { type: 'object' }
}, async function(params, context){
  const endpointData = params;

  // Add metadata
  const endpoint = {
    ...endpointData,
    resourceType: 'Endpoint',
    meta: {
      lastUpdated: new Date(),
      versionId: '1'
    }
  };

  // Set _id based on environment variable for consistent sorting with Synthea data
  if (process.env.USE_MONGO_OBJECTID) {
    const { Mongo } = Package.mongo;
    const objectId = new Mongo.ObjectID();
    endpoint._id = objectId.toHexString();
    context.log.info('Using MongoDB ObjectID (as hex string)', { _id: endpoint._id });
  }
  // Otherwise Meteor will auto-generate a random string ID

  // Insert and return the new endpoint
  const Endpoints = getEndpoints();
  const endpointId = await Endpoints.insertAsync(endpoint);

  // Log for HIPAA compliance
  context.log.info('Endpoint created', {
    userId: context.userId,
    endpointId: endpointId,
    timestamp: new Date()
  });

  return endpointId;
});

Meteor.ServerMethods.define('endpoints.update', {
  description: 'Update an existing FHIR Endpoint record by MongoDB _id',
  positionalParams: ['endpointId', 'endpointData'],
  schemaObject: {
    type: 'object',
    properties: {
      endpointId: { type: 'string' },
      endpointData: { type: 'object' }
    },
    required: ['endpointId', 'endpointData']
  }
}, async function(params, context){
  const { endpointId, endpointData } = params;

  const Endpoints = getEndpoints();

  // Check if endpoint exists
  const existingEndpoint = await Endpoints.findOneAsync({ _id: endpointId });
  if (!existingEndpoint) {
    throw new Meteor.Error('not-found', 'Endpoint not found');
  }

  // Update metadata
  const updatedEndpoint = {
    ...endpointData,
    _id: endpointId,
    resourceType: 'Endpoint',
    meta: {
      ...get(endpointData, 'meta', {}),
      lastUpdated: new Date(),
      versionId: String(parseInt(get(existingEndpoint, 'meta.versionId', '0')) + 1)
    }
  };

  // Update the endpoint
  const result = await Endpoints.updateAsync(
    { _id: endpointId },
    { $set: updatedEndpoint }
  );

  // Log for HIPAA compliance
  context.log.info('Endpoint updated', {
    userId: context.userId,
    endpointId: endpointId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('endpoints.get', {
  description: 'Fetch a single FHIR Endpoint record by MongoDB _id',
  positionalParams: ['endpointId'],
  schemaObject: {
    type: 'object',
    properties: { endpointId: { type: 'string' } },
    required: ['endpointId']
  }
}, async function(params, context){
  const endpointId = params.endpointId;

  const Endpoints = getEndpoints();
  const endpoint = await Endpoints.findOneAsync({ _id: endpointId });

  if (!endpoint) {
    throw new Meteor.Error('not-found', 'Endpoint not found');
  }

  // Log access for HIPAA compliance
  context.log.info('Endpoint accessed', {
    userId: context.userId,
    endpointId: endpointId,
    timestamp: new Date()
  });

  return endpoint;
});

Meteor.ServerMethods.define('endpoints.remove', {
  description: 'Remove a FHIR Endpoint record by MongoDB _id',
  positionalParams: ['endpointId'],
  schemaObject: {
    type: 'object',
    properties: { endpointId: { type: 'string' } },
    required: ['endpointId']
  }
}, async function(params, context){
  const endpointId = params.endpointId;

  const Endpoints = getEndpoints();

  // Check if endpoint exists
  const existingEndpoint = await Endpoints.findOneAsync({ _id: endpointId });
  if (!existingEndpoint) {
    throw new Meteor.Error('not-found', 'Endpoint not found');
  }

  // Remove the endpoint
  const result = await Endpoints.removeAsync({ _id: endpointId });

  // Log for HIPAA compliance
  context.log.info('Endpoint deleted', {
    userId: context.userId,
    endpointId: endpointId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('endpoints.search', {
  description: 'Search FHIR Endpoint records by name, status, or connection type',
  schemaObject: { type: 'object' }
}, async function(params, context){
  const searchOptions = params || {};

  const Endpoints = getEndpoints();
  const { query = {}, options = {} } = searchOptions;

  // Add any necessary query transformations here
  if (searchOptions.name) {
    query['name'] = { $regex: searchOptions.name, $options: 'i' };
  }

  if (searchOptions.status) {
    query['status'] = searchOptions.status;
  }

  if (searchOptions.connectionType) {
    query['connectionType.coding.code'] = searchOptions.connectionType;
  }

  // Set default options
  const findOptions = {
    limit: options.limit || 20,
    sort: options.sort || { 'meta.lastUpdated': -1 },
    ...options
  };

  const endpoints = await Endpoints.find(query, findOptions).fetchAsync();

  // Log search for HIPAA compliance
  context.log.info('Endpoints searched', {
    userId: context.userId,
    query: query,
    resultCount: endpoints.length,
    timestamp: new Date()
  });

  return endpoints;
});
