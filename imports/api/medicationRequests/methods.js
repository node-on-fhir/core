// /imports/api/medicationRequests/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';

import { MedicationRequests } from '/imports/lib/schemas/SimpleSchemas/MedicationRequests';

Meteor.methods({
  async 'medicationRequests.get'(medicationRequestId) {
    check(medicationRequestId, String);
    
    try {
      const result = await MedicationRequests.findOneAsync({ _id: medicationRequestId });
      console.log('Found medication request:', result);
      return result;
    } catch (error) {
      console.error('Error getting medication request:', error);
      throw new Meteor.Error('get-failed', error.message);
    }
  },

  async 'medicationRequests.create'(medicationRequest) {
    check(medicationRequest, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create medication requests');
    }

    // Add metadata
    medicationRequest.meta = {
      lastUpdated: new Date()
    };

    // Ensure resourceType is set
    medicationRequest.resourceType = 'MedicationRequest';

    try {
      const result = await MedicationRequests.insertAsync(medicationRequest);
      console.log('Created medication request:', result);
      return result;
    } catch (error) {
      console.error('Error creating medication request:', error);
      throw new Meteor.Error('insert-failed', error.message);
    }
  },

  async 'medicationRequests.update'(medicationRequestId, updates) {
    check(medicationRequestId, String);
    check(updates, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update medication requests');
    }

    // Update metadata
    updates['meta.lastUpdated'] = new Date();

    try {
      const result = await MedicationRequests.updateAsync(
        { _id: medicationRequestId },
        { $set: updates }
      );
      console.log('Updated medication request:', result);
      return result;
    } catch (error) {
      console.error('Error updating medication request:', error);
      throw new Meteor.Error('update-failed', error.message);
    }
  },

  async 'medicationRequests.remove'(medicationRequestId) {
    check(medicationRequestId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to delete medication requests');
    }

    try {
      const result = await MedicationRequests.removeAsync({ _id: medicationRequestId });
      console.log('Removed medication request:', result);
      return result;
    } catch (error) {
      console.error('Error removing medication request:', error);
      throw new Meteor.Error('remove-failed', error.message);
    }
  }
});