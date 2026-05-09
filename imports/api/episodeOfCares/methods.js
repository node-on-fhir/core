// /imports/api/episodeOfCares/methods.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { get } from 'lodash';
import moment from 'moment';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/EpisodeOfCares';

// Get the correct EpisodeOfCares collection reference
function getEpisodeOfCares() {
  if (Meteor.isServer) {
    return Meteor.Collections?.EpisodeOfCares || global.EpisodeOfCares;
  } else {
    return Meteor.Collections?.EpisodeOfCares;
  }
}

// Helper: find an EpisodeOfCare by _id, with ObjectID fallback for imported data
async function findEpisodeOfCareById(EpisodeOfCares, episodeOfCareId) {
  // Try string _id first (Meteor-created records)
  let episodeOfCare = await EpisodeOfCares.findOneAsync({ _id: episodeOfCareId });

  // If not found, try as MongoDB ObjectID (Synthea/imported data)
  if (!episodeOfCare && /^[0-9a-fA-F]{24}$/.test(episodeOfCareId)) {
    episodeOfCare = await EpisodeOfCares.findOneAsync({ _id: new Mongo.ObjectID(episodeOfCareId) });
  }

  return episodeOfCare;
}

Meteor.methods({
  async 'episodeOfCares.create'(episodeOfCareData) {
    check(episodeOfCareData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create episodes of care');
    }

    console.log('=== episodeOfCares.create called ===');

    const cleanEpisodeOfCare = {
      ...episodeOfCareData,
      resourceType: 'EpisodeOfCare',
      meta: {
        lastUpdated: new Date(),
        versionId: '1'
      }
    };

    try {
      const EpisodeOfCares = getEpisodeOfCares();
      const episodeOfCareId = await EpisodeOfCares.insertAsync(cleanEpisodeOfCare);
      console.log('[episodeOfCares.create] Successfully inserted with ID:', episodeOfCareId);

      // Log for HIPAA compliance
      if (Meteor.isServer) {
        console.log('EpisodeOfCare created', {
          userId: this.userId,
          episodeOfCareId: episodeOfCareId,
          timestamp: new Date()
        });
      }

      return episodeOfCareId;
    } catch (error) {
      console.error('[episodeOfCares.create] Error:', error);
      throw error;
    }
  },

  async 'episodeOfCares.update'(episodeOfCareId, episodeOfCareData) {
    check(episodeOfCareId, String);
    check(episodeOfCareData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update episodes of care');
    }

    const EpisodeOfCares = getEpisodeOfCares();

    const existingEpisodeOfCare = await findEpisodeOfCareById(EpisodeOfCares, episodeOfCareId);
    if (!existingEpisodeOfCare) {
      throw new Meteor.Error('not-found', 'EpisodeOfCare not found');
    }

    // Auto-append to statusHistory on status change
    let statusHistory = get(existingEpisodeOfCare, 'statusHistory', []);
    const oldStatus = get(existingEpisodeOfCare, 'status');
    const newStatus = get(episodeOfCareData, 'status');

    if (oldStatus && newStatus && oldStatus !== newStatus) {
      statusHistory.push({
        status: oldStatus,
        period: {
          start: get(existingEpisodeOfCare, 'period.start', ''),
          end: moment().format('YYYY-MM-DD')
        }
      });
      console.log('[episodeOfCares.update] Status changed from', oldStatus, 'to', newStatus, '- appended to statusHistory');
    }

    const updatedEpisodeOfCare = {
      ...episodeOfCareData,
      _id: existingEpisodeOfCare._id,
      resourceType: 'EpisodeOfCare',
      statusHistory: statusHistory,
      meta: {
        ...get(episodeOfCareData, 'meta', {}),
        lastUpdated: new Date(),
        versionId: String(parseInt(get(existingEpisodeOfCare, 'meta.versionId', '0')) + 1)
      }
    };

    const result = await EpisodeOfCares.updateAsync(
      { _id: existingEpisodeOfCare._id },
      { $set: updatedEpisodeOfCare }
    );

    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('EpisodeOfCare updated', {
        userId: this.userId,
        episodeOfCareId: episodeOfCareId,
        timestamp: new Date()
      });
    }

    return result;
  },

  async 'episodeOfCares.remove'(episodeOfCareId) {
    check(episodeOfCareId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to remove episodes of care');
    }

    const EpisodeOfCares = getEpisodeOfCares();

    const existingEpisodeOfCare = await findEpisodeOfCareById(EpisodeOfCares, episodeOfCareId);
    if (!existingEpisodeOfCare) {
      throw new Meteor.Error('not-found', 'EpisodeOfCare not found');
    }

    const result = await EpisodeOfCares.removeAsync({ _id: existingEpisodeOfCare._id });

    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('EpisodeOfCare removed', {
        userId: this.userId,
        episodeOfCareId: episodeOfCareId,
        timestamp: new Date()
      });
    }

    return result;
  },

  async 'episodeOfCares.get'(episodeOfCareId) {
    check(episodeOfCareId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view episodes of care');
    }

    const EpisodeOfCares = getEpisodeOfCares();

    let episodeOfCare = await findEpisodeOfCareById(EpisodeOfCares, episodeOfCareId);

    // Sequential FHIR id fallback (not OR logic — per CLAUDE.md anti-pattern rules)
    if (!episodeOfCare) {
      episodeOfCare = await EpisodeOfCares.findOneAsync({ id: episodeOfCareId });
    }

    if (!episodeOfCare) {
      throw new Meteor.Error('not-found', 'EpisodeOfCare not found');
    }

    return episodeOfCare;
  }
});
