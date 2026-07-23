// /imports/api/schedules/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/Schedules';

// Get the correct Schedules collection reference
function getSchedules() {
  if (Meteor.isServer) {
    // On server, use the global collection set up in server/main.js
    return Meteor.Collections?.Schedules || global.Schedules;
  } else {
    // On client, use from Meteor.Collections if available
    return Meteor.Collections?.Schedules;
  }
}

Meteor.ServerMethods.define('schedules.create', {
  description: 'Create a new FHIR Schedule resource with version metadata',
  aliases: ['createSchedule'],
  schemaObject: { type: 'object' }   // the Schedule resource payload itself
}, async function(params, context) {
  const scheduleData = params;

  context.log.debug('schedules.create called');

  // Add metadata
  const schedule = {
    ...scheduleData,
    resourceType: 'Schedule',
    meta: {
      lastUpdated: new Date(),
      versionId: '1'
    }
  };

  // Ensure required fields have defaults
  if (schedule.active === undefined) {
    schedule.active = true;
  }

  try {
    // Insert and return the new schedule
    const Schedules = getSchedules();

    const scheduleId = await Schedules.insertAsync(schedule);

    // Verify it was saved
    const savedSchedule = await Schedules.findOneAsync({_id: scheduleId});

    // Log for HIPAA compliance
    context.log.info('Schedule created', {
      userId: context.userId,
      scheduleId: scheduleId,
      saved: !!savedSchedule,
      timestamp: new Date()
    });

    return scheduleId;
  } catch (error) {
    context.log.error('Error inserting schedule', { error: error.message });
    throw new Meteor.Error('insert-failed', 'Failed to create schedule: ' + error.message);
  }
});

Meteor.ServerMethods.define('schedules.update', {
  description: 'Update an existing FHIR Schedule resource and increment its version',
  aliases: ['updateSchedule'],
  positionalParams: ['scheduleId', 'updateData'],
  schemaObject: {
    type: 'object',
    properties: {
      scheduleId: { type: 'string' },
      updateData: { type: 'object' }
    },
    required: ['scheduleId', 'updateData']
  }
}, async function(params, context) {
  const scheduleId = params.scheduleId;
  const updateData = params.updateData;

  context.log.debug('schedules.update called', { scheduleId: scheduleId });

  try {
    const Schedules = getSchedules();

    // Get the existing schedule
    const existingSchedule = await Schedules.findOneAsync({ _id: scheduleId });
    if (!existingSchedule) {
      throw new Meteor.Error('not-found', 'Schedule not found');
    }

    // Prepare the update
    const updatedSchedule = {
      ...existingSchedule,
      ...updateData,
      _id: scheduleId, // Preserve the ID
      meta: {
        ...existingSchedule.meta,
        lastUpdated: new Date(),
        versionId: String(parseInt(get(existingSchedule, 'meta.versionId', '0')) + 1)
      }
    };

    // Remove the _id from the update document
    const { _id, ...updateDoc } = updatedSchedule;

    // Update the schedule
    const updateCount = await Schedules.updateAsync(
      { _id: scheduleId },
      { $set: updateDoc }
    );

    // Log for HIPAA compliance
    context.log.info('Schedule updated', {
      userId: context.userId,
      scheduleId: scheduleId,
      updateCount: updateCount,
      timestamp: new Date()
    });

    return updateCount;
  } catch (error) {
    context.log.error('Error updating schedule', { error: error.message });
    throw new Meteor.Error('update-failed', 'Failed to update schedule: ' + error.message);
  }
});

Meteor.ServerMethods.define('schedules.remove', {
  description: 'Delete a FHIR Schedule resource by its MongoDB _id',
  aliases: ['removeSchedule'],
  positionalParams: ['scheduleId'],
  schemaObject: {
    type: 'object',
    properties: { scheduleId: { type: 'string' } },
    required: ['scheduleId']
  }
}, async function(params, context) {
  const scheduleId = params.scheduleId;

  context.log.debug('schedules.remove called', { scheduleId: scheduleId });

  try {
    const Schedules = getSchedules();

    // Check if the schedule exists
    const existingSchedule = await Schedules.findOneAsync({ _id: scheduleId });
    if (!existingSchedule) {
      throw new Meteor.Error('not-found', 'Schedule not found');
    }

    // Remove the schedule
    const removeCount = await Schedules.removeAsync({ _id: scheduleId });

    // Log for HIPAA compliance
    context.log.info('Schedule removed', {
      userId: context.userId,
      scheduleId: scheduleId,
      removeCount: removeCount,
      timestamp: new Date()
    });

    return removeCount;
  } catch (error) {
    context.log.error('Error removing schedule', { error: error.message });
    throw new Meteor.Error('remove-failed', 'Failed to remove schedule: ' + error.message);
  }
});

Meteor.ServerMethods.define('schedules.get', {
  description: 'Fetch a single FHIR Schedule resource by its MongoDB _id',
  // Pre-migration this method had NO auth guard. requireAuth now applies
  // (default true) — behavior change, noted in the migration report.
  aliases: ['getSchedule'],
  positionalParams: ['scheduleId'],
  schemaObject: {
    type: 'object',
    properties: { scheduleId: { type: 'string' } },
    required: ['scheduleId']
  }
}, async function(params, context) {
  const scheduleId = params.scheduleId;

  context.log.debug('schedules.get called', { scheduleId: scheduleId });

  try {
    const Schedules = getSchedules();
    const schedule = await Schedules.findOneAsync({ _id: scheduleId });

    if (!schedule) {
      throw new Meteor.Error('not-found', 'Schedule not found');
    }

    return schedule;
  } catch (error) {
    context.log.error('Error getting schedule', { error: error.message });
    throw new Meteor.Error('get-failed', 'Failed to get schedule: ' + error.message);
  }
});

Meteor.ServerMethods.define('schedules.search', {
  description: 'Search FHIR Schedule resources by active flag, actor, service type, or planning-horizon date',
  // Pre-migration this method had NO auth guard. requireAuth now applies
  // (default true) — behavior change, noted in the migration report.
  aliases: ['searchSchedules'],
  schemaObject: { type: 'object' }   // searchOptions: { active?, actor?, serviceType?, date? }
}, async function(params, context) {
  const searchOptions = params || {};

  context.log.debug('schedules.search called', { searchOptions: searchOptions });

  const query = {};

  // Build query based on search options
  if (searchOptions.active !== undefined) {
    query.active = searchOptions.active;
  }

  if (searchOptions.actor) {
    query['actor.reference'] = searchOptions.actor;
  }

  if (searchOptions.serviceType) {
    query['serviceType.coding.code'] = searchOptions.serviceType;
  }

  if (searchOptions.date) {
    // Search for schedules that include the given date
    query['planningHorizon.start'] = { $lte: searchOptions.date };
    query['planningHorizon.end'] = { $gte: searchOptions.date };
  }

  try {
    const Schedules = getSchedules();
    const schedules = await Schedules.find(query).fetchAsync();

    context.log.debug('Found schedules', { count: schedules.length });

    return schedules;
  } catch (error) {
    context.log.error('Error searching schedules', { error: error.message });
    throw new Meteor.Error('search-failed', 'Failed to search schedules: ' + error.message);
  }
});

Meteor.ServerMethods.define('schedules.debug', {
  description: 'Report Schedules collection availability, counts, and sample documents for debugging',
  // Pre-migration this method had NO auth guard. requireAuth now applies
  // (default true) — behavior change (debug info should not be anonymous anyway).
  aliases: ['debugSchedulesCollection']
}, async function(params, context) {
  context.log.debug('schedules.debug called');

  try {
    const Schedules = getSchedules();
    const count = await Schedules.find({}).countAsync();
    const samples = await Schedules.find({}, { limit: 5 }).fetchAsync();

    const debugInfo = {
      collectionAvailable: !!Schedules,
      collectionName: Schedules?._name || 'unknown',
      totalCount: count,
      sampleSchedules: samples,
      isServer: Meteor.isServer,
      isClient: Meteor.isClient
    };

    context.log.debug('Schedules debug info', { collectionName: debugInfo.collectionName, totalCount: count });

    return debugInfo;
  } catch (error) {
    context.log.error('Error in schedules.debug', { error: error.message });
    throw new Meteor.Error('debug-failed', 'Failed to debug schedules: ' + error.message);
  }
});
