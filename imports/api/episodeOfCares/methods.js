// /imports/api/episodeOfCares/methods.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
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

Meteor.ServerMethods.define('episodeOfCares.create', {
  description: 'Create a FHIR EpisodeOfCare record for a patient',
  phi: true,
  schemaObject: { type: 'object' }
}, async function(params, context){
  const episodeOfCareData = params;

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

    // Log for HIPAA compliance
    context.log.info('EpisodeOfCare created', {
      userId: context.userId,
      episodeOfCareId: episodeOfCareId,
      timestamp: new Date()
    });

    return episodeOfCareId;
  } catch (error) {
    context.log.error('Error creating EpisodeOfCare', { message: error.message });
    throw error;
  }
});

Meteor.ServerMethods.define('episodeOfCares.update', {
  description: 'Update an existing FHIR EpisodeOfCare record, appending status history on status change',
  phi: true,
  positionalParams: ['episodeOfCareId', 'episodeOfCareData'],
  schemaObject: {
    type: 'object',
    properties: {
      episodeOfCareId: { type: 'string' },
      episodeOfCareData: { type: 'object' }
    },
    required: ['episodeOfCareId', 'episodeOfCareData']
  }
}, async function(params, context){
  const { episodeOfCareId, episodeOfCareData } = params;

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
    context.log.info('Status changed - appended to statusHistory', { oldStatus: oldStatus, newStatus: newStatus });
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
  context.log.info('EpisodeOfCare updated', {
    userId: context.userId,
    episodeOfCareId: episodeOfCareId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('episodeOfCares.remove', {
  description: 'Remove a FHIR EpisodeOfCare record by id',
  phi: true,
  positionalParams: ['episodeOfCareId'],
  schemaObject: {
    type: 'object',
    properties: { episodeOfCareId: { type: 'string' } },
    required: ['episodeOfCareId']
  }
}, async function(params, context){
  const episodeOfCareId = params.episodeOfCareId;

  const EpisodeOfCares = getEpisodeOfCares();

  const existingEpisodeOfCare = await findEpisodeOfCareById(EpisodeOfCares, episodeOfCareId);
  if (!existingEpisodeOfCare) {
    throw new Meteor.Error('not-found', 'EpisodeOfCare not found');
  }

  const result = await EpisodeOfCares.removeAsync({ _id: existingEpisodeOfCare._id });

  // Log for HIPAA compliance
  context.log.info('EpisodeOfCare removed', {
    userId: context.userId,
    episodeOfCareId: episodeOfCareId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('episodeOfCares.get', {
  description: 'Fetch a single FHIR EpisodeOfCare record by id',
  phi: true,
  positionalParams: ['episodeOfCareId'],
  schemaObject: {
    type: 'object',
    properties: { episodeOfCareId: { type: 'string' } },
    required: ['episodeOfCareId']
  }
}, async function(params, context){
  const episodeOfCareId = params.episodeOfCareId;

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
});
