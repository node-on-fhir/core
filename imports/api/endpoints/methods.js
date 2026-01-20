// /imports/api/endpoints/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
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

Meteor.methods({
  async 'endpoints.create'(endpointData) {
    check(endpointData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create endpoints');
    }

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
      console.log('[endpoints.create] Using MongoDB ObjectID (as hex string):', endpoint._id);
    }
    // Otherwise Meteor will auto-generate a random string ID

    // Insert and return the new endpoint
    const Endpoints = getEndpoints();
    const endpointId = await Endpoints.insertAsync(endpoint);

    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Endpoint created', {
        userId: this.userId,
        endpointId: endpointId,
        timestamp: new Date()
      });
    }

    return endpointId;
  },

  async 'endpoints.update'(endpointId, endpointData) {
    check(endpointId, String);
    check(endpointData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update endpoints');
    }

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
    if (Meteor.isServer) {
      console.log('Endpoint updated', {
        userId: this.userId,
        endpointId: endpointId,
        timestamp: new Date()
      });
    }

    return result;
  },

  async 'endpoints.get'(endpointId) {
    check(endpointId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view endpoints');
    }

    const Endpoints = getEndpoints();
    const endpoint = await Endpoints.findOneAsync({ _id: endpointId });

    if (!endpoint) {
      throw new Meteor.Error('not-found', 'Endpoint not found');
    }

    // Log access for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Endpoint accessed', {
        userId: this.userId,
        endpointId: endpointId,
        timestamp: new Date()
      });
    }

    return endpoint;
  },

  async 'endpoints.remove'(endpointId) {
    check(endpointId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to delete endpoints');
    }

    const Endpoints = getEndpoints();

    // Check if endpoint exists
    const existingEndpoint = await Endpoints.findOneAsync({ _id: endpointId });
    if (!existingEndpoint) {
      throw new Meteor.Error('not-found', 'Endpoint not found');
    }

    // Remove the endpoint
    const result = await Endpoints.removeAsync({ _id: endpointId });

    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Endpoint deleted', {
        userId: this.userId,
        endpointId: endpointId,
        timestamp: new Date()
      });
    }

    return result;
  },

  async 'endpoints.search'(searchOptions = {}) {
    check(searchOptions, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to search endpoints');
    }

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
    if (Meteor.isServer) {
      console.log('Endpoints searched', {
        userId: this.userId,
        query: query,
        resultCount: endpoints.length,
        timestamp: new Date()
      });
    }

    return endpoints;
  }
});
