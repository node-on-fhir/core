// /imports/api/schedules/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import moment from 'moment';

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

Meteor.methods({
  async createSchedule(scheduleData) {
    check(scheduleData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create schedules');
    }
    
    console.log('=== createSchedule called ===');
    console.log('Original data:', JSON.stringify(scheduleData, null, 2));
    
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
    
    console.log('Final schedule to insert:', JSON.stringify(schedule, null, 2));
    
    try {
      // Insert and return the new schedule
      const Schedules = getSchedules();
      console.log('Got Schedules collection:', !!Schedules);
      
      const scheduleId = await Schedules.insertAsync(schedule);
      console.log('Successfully inserted schedule with ID:', scheduleId);
      
      // Verify it was saved
      const savedSchedule = await Schedules.findOneAsync({_id: scheduleId});
      console.log('Verification - saved schedule found:', !!savedSchedule);
      
      // Log for HIPAA compliance
      if (Meteor.isServer) {
        console.log('Schedule created', {
          userId: this.userId,
          scheduleId: scheduleId,
          timestamp: new Date()
        });
      }
      
      return scheduleId;
    } catch (error) {
      console.error('Error inserting schedule:', error);
      throw new Meteor.Error('insert-failed', 'Failed to create schedule: ' + error.message);
    }
  },

  async updateSchedule(scheduleId, updateData) {
    check(scheduleId, String);
    check(updateData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update schedules');
    }
    
    console.log('=== updateSchedule called ===');
    console.log('Schedule ID:', scheduleId);
    console.log('Update data:', JSON.stringify(updateData, null, 2));
    
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
      
      console.log('Update count:', updateCount);
      
      // Log for HIPAA compliance
      if (Meteor.isServer) {
        console.log('Schedule updated', {
          userId: this.userId,
          scheduleId: scheduleId,
          timestamp: new Date()
        });
      }
      
      return updateCount;
    } catch (error) {
      console.error('Error updating schedule:', error);
      throw new Meteor.Error('update-failed', 'Failed to update schedule: ' + error.message);
    }
  },

  async removeSchedule(scheduleId) {
    check(scheduleId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to delete schedules');
    }
    
    console.log('=== removeSchedule called ===');
    console.log('Schedule ID:', scheduleId);
    
    try {
      const Schedules = getSchedules();
      
      // Check if the schedule exists
      const existingSchedule = await Schedules.findOneAsync({ _id: scheduleId });
      if (!existingSchedule) {
        throw new Meteor.Error('not-found', 'Schedule not found');
      }
      
      // Remove the schedule
      const removeCount = await Schedules.removeAsync({ _id: scheduleId });
      
      console.log('Remove count:', removeCount);
      
      // Log for HIPAA compliance
      if (Meteor.isServer) {
        console.log('Schedule removed', {
          userId: this.userId,
          scheduleId: scheduleId,
          timestamp: new Date()
        });
      }
      
      return removeCount;
    } catch (error) {
      console.error('Error removing schedule:', error);
      throw new Meteor.Error('remove-failed', 'Failed to remove schedule: ' + error.message);
    }
  },

  async getSchedule(scheduleId) {
    check(scheduleId, String);
    
    console.log('=== getSchedule called ===');
    console.log('Schedule ID:', scheduleId);
    
    try {
      const Schedules = getSchedules();
      const schedule = await Schedules.findOneAsync({ _id: scheduleId });
      
      if (!schedule) {
        throw new Meteor.Error('not-found', 'Schedule not found');
      }
      
      return schedule;
    } catch (error) {
      console.error('Error getting schedule:', error);
      throw new Meteor.Error('get-failed', 'Failed to get schedule: ' + error.message);
    }
  },

  async searchSchedules(searchOptions = {}) {
    check(searchOptions, Object);
    
    console.log('=== searchSchedules called ===');
    console.log('Search options:', searchOptions);
    
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
      
      console.log('Found schedules:', schedules.length);
      
      return schedules;
    } catch (error) {
      console.error('Error searching schedules:', error);
      throw new Meteor.Error('search-failed', 'Failed to search schedules: ' + error.message);
    }
  },

  async debugSchedulesCollection() {
    console.log('=== debugSchedulesCollection called ===');
    
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
      
      console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
      
      return debugInfo;
    } catch (error) {
      console.error('Error in debugSchedulesCollection:', error);
      throw new Meteor.Error('debug-failed', 'Failed to debug schedules: ' + error.message);
    }
  }
});