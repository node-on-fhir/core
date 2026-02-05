// /imports/api/substances/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import moment from 'moment';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/Substances';

// Get the correct Substances collection reference
function getSubstances() {
  if (Meteor.isServer) {
    // On server, use the global collection set up in server/main.js
    return Meteor.Collections?.Substances || global.Substances;
  } else {
    // On client, use from Meteor.Collections if available
    return Meteor.Collections?.Substances;
  }
}

Meteor.methods({
  async 'substances.create'(substanceData) {
    check(substanceData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create substances');
    }

    // Add metadata
    const substance = {
      ...substanceData,
      resourceType: 'Substance',
      meta: {
        lastUpdated: new Date(),
        versionId: '1'
      }
    };

    // Set _id based on environment variable for consistent sorting with Synthea data
    // This ensures new substances sort properly with existing ObjectID-based records
    if (process.env.USE_MONGO_OBJECTID) {
      const { Mongo } = Package.mongo;
      const objectId = new Mongo.ObjectID();
      // Convert to hex string for Meteor compatibility
      substance._id = objectId.toHexString();
      console.log('[substances.create] Using MongoDB ObjectID (as hex string):', substance._id);
    }
    // Otherwise Meteor will auto-generate a random string ID

    // Insert and return the new substance
    const Substances = getSubstances();
    const substanceId = await Substances.insertAsync(substance);

    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Substance created', {
        userId: this.userId,
        substanceId: substanceId,
        timestamp: new Date()
      });
    }

    return substanceId;
  },

  async 'substances.update'(substanceId, substanceData) {
    check(substanceId, String);
    check(substanceData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update substances');
    }

    const Substances = getSubstances();

    // Check if substance exists
    const existingSubstance = await Substances.findOneAsync({ _id: substanceId });
    if (!existingSubstance) {
      throw new Meteor.Error('not-found', 'Substance not found');
    }

    // Update metadata
    const updatedSubstance = {
      ...substanceData,
      _id: substanceId,
      resourceType: 'Substance',
      meta: {
        ...get(substanceData, 'meta', {}),
        lastUpdated: new Date(),
        versionId: String(parseInt(get(existingSubstance, 'meta.versionId', '0')) + 1)
      }
    };

    // Update the substance
    const result = await Substances.updateAsync(
      { _id: substanceId },
      { $set: updatedSubstance }
    );

    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Substance updated', {
        userId: this.userId,
        substanceId: substanceId,
        timestamp: new Date()
      });
    }

    return result;
  },

  async 'substances.get'(substanceId) {
    check(substanceId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view substances');
    }

    const Substances = getSubstances();
    const substance = await Substances.findOneAsync({ _id: substanceId });

    if (!substance) {
      throw new Meteor.Error('not-found', 'Substance not found');
    }

    // Log access for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Substance accessed', {
        userId: this.userId,
        substanceId: substanceId,
        timestamp: new Date()
      });
    }

    return substance;
  },

  async 'substances.remove'(substanceId) {
    check(substanceId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to delete substances');
    }

    const Substances = getSubstances();

    // Check if substance exists
    const existingSubstance = await Substances.findOneAsync({ _id: substanceId });
    if (!existingSubstance) {
      throw new Meteor.Error('not-found', 'Substance not found');
    }

    // Remove the substance
    const result = await Substances.removeAsync({ _id: substanceId });

    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Substance deleted', {
        userId: this.userId,
        substanceId: substanceId,
        timestamp: new Date()
      });
    }

    return result;
  },

  async 'substances.search'(searchOptions = {}) {
    check(searchOptions, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to search substances');
    }

    const Substances = getSubstances();
    const { query = {}, options = {} } = searchOptions;

    // Add any necessary query transformations here
    // For example, searching by substance code/name
    if (searchOptions.name) {
      query['code.text'] = { $regex: searchOptions.name, $options: 'i' };
    }

    if (searchOptions.code) {
      query['code.coding.code'] = searchOptions.code;
    }

    if (searchOptions.status) {
      query['status'] = searchOptions.status;
    }

    // Set default options
    const findOptions = {
      limit: options.limit || 20,
      sort: options.sort || { 'meta.lastUpdated': -1 },
      ...options
    };

    const substances = await Substances.findAsync(query, findOptions).then(cursor => cursor.toArray());

    // Log search for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Substances searched', {
        userId: this.userId,
        query: query,
        resultCount: substances.length,
        timestamp: new Date()
      });
    }

    return substances;
  }
});
