// /imports/api/activityDefinitions/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
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

Meteor.methods({
  async 'activityDefinitions.create'(activityDefinitionData) {
    check(activityDefinitionData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create activity definitions');
    }

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
      console.log('[activityDefinitions.create] Using MongoDB ObjectID (as hex string):', activityDefinition._id);
    }
    // Otherwise Meteor will auto-generate a random string ID

    // Insert and return the new activity definition
    const ActivityDefinitions = getActivityDefinitions();
    const activityDefinitionId = await ActivityDefinitions.insertAsync(activityDefinition);

    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('ActivityDefinition created', {
        userId: this.userId,
        activityDefinitionId: activityDefinitionId,
        timestamp: new Date()
      });
    }

    return activityDefinitionId;
  },

  async 'activityDefinitions.update'(activityDefinitionId, activityDefinitionData) {
    check(activityDefinitionId, String);
    check(activityDefinitionData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update activity definitions');
    }

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
    if (Meteor.isServer) {
      console.log('ActivityDefinition updated', {
        userId: this.userId,
        activityDefinitionId: activityDefinitionId,
        timestamp: new Date()
      });
    }

    return result;
  },

  async 'activityDefinitions.get'(activityDefinitionId) {
    check(activityDefinitionId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view activity definitions');
    }

    const ActivityDefinitions = getActivityDefinitions();
    const activityDefinition = await ActivityDefinitions.findOneAsync({ _id: activityDefinitionId });

    if (!activityDefinition) {
      throw new Meteor.Error('not-found', 'ActivityDefinition not found');
    }

    // Log access for HIPAA compliance
    if (Meteor.isServer) {
      console.log('ActivityDefinition accessed', {
        userId: this.userId,
        activityDefinitionId: activityDefinitionId,
        timestamp: new Date()
      });
    }

    return activityDefinition;
  },

  async 'activityDefinitions.remove'(activityDefinitionId) {
    check(activityDefinitionId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to delete activity definitions');
    }

    const ActivityDefinitions = getActivityDefinitions();

    // Check if activity definition exists
    const existingActivityDefinition = await ActivityDefinitions.findOneAsync({ _id: activityDefinitionId });
    if (!existingActivityDefinition) {
      throw new Meteor.Error('not-found', 'ActivityDefinition not found');
    }

    // Remove the activity definition
    const result = await ActivityDefinitions.removeAsync({ _id: activityDefinitionId });

    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('ActivityDefinition deleted', {
        userId: this.userId,
        activityDefinitionId: activityDefinitionId,
        timestamp: new Date()
      });
    }

    return result;
  },

  async 'activityDefinitions.search'(searchOptions = {}) {
    check(searchOptions, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to search activity definitions');
    }

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

    const activityDefinitions = await ActivityDefinitions.findAsync(query, findOptions).then(cursor => cursor.toArray());

    // Log search for HIPAA compliance
    if (Meteor.isServer) {
      console.log('ActivityDefinitions searched', {
        userId: this.userId,
        query: query,
        resultCount: activityDefinitions.length,
        timestamp: new Date()
      });
    }

    return activityDefinitions;
  }
});
