// /imports/api/medicationAdministrations/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';

import { MedicationAdministrations } from '/imports/lib/schemas/SimpleSchemas/MedicationAdministrations';

Meteor.methods({
  async 'medicationAdministrations.create'(medicationAdministration) {
    check(medicationAdministration, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create medication administrations');
    }

    // Add metadata
    medicationAdministration.meta = {
      lastUpdated: new Date()
    };

    // Ensure resourceType is set
    medicationAdministration.resourceType = 'MedicationAdministration';

    try {
      const result = await MedicationAdministrations.insertAsync(medicationAdministration);
      console.log('Created medication administration:', result);
      return result;
    } catch (error) {
      console.error('Error creating medication administration:', error);
      throw new Meteor.Error('insert-failed', error.message);
    }
  },

  async 'medicationAdministrations.update'(medicationAdministrationId, updates) {
    check(medicationAdministrationId, String);
    check(updates, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update medication administrations');
    }

    // Update metadata
    updates['meta.lastUpdated'] = new Date();
    
    // Debug logging
    console.log('Updating medication administration:', medicationAdministrationId);
    console.log('Full updates object:', JSON.stringify(updates, null, 2));
    console.log('Performer data:', get(updates, 'performer[0].actor'));

    try {
      const result = await MedicationAdministrations.updateAsync(
        { _id: medicationAdministrationId },
        { $set: updates }
      );
      console.log('Updated medication administration:', result);
      
      // Verify the update
      const updated = await MedicationAdministrations.findOneAsync({ _id: medicationAdministrationId });
      console.log('Updated document:', JSON.stringify(updated, null, 2));
      console.log('Updated performer:', get(updated, 'performer[0].actor'));
      
      return result;
    } catch (error) {
      console.error('Error updating medication administration:', error);
      throw new Meteor.Error('update-failed', error.message);
    }
  },

  async 'medicationAdministrations.get'(medicationAdministrationId) {
    check(medicationAdministrationId, String);
    
    try {
      const result = await MedicationAdministrations.findOneAsync({ _id: medicationAdministrationId });
      if (!result) {
        throw new Meteor.Error('not-found', 'Medication administration not found');
      }
      console.log('Retrieved medication administration:', result._id);
      return result;
    } catch (error) {
      console.error('Error getting medication administration:', error);
      throw new Meteor.Error('get-failed', error.message);
    }
  },

  async 'medicationAdministrations.remove'(medicationAdministrationId) {
    check(medicationAdministrationId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to delete medication administrations');
    }

    try {
      const result = await MedicationAdministrations.removeAsync({ _id: medicationAdministrationId });
      console.log('Removed medication administration:', result);
      return result;
    } catch (error) {
      console.error('Error removing medication administration:', error);
      throw new Meteor.Error('remove-failed', error.message);
    }
  },

  async 'medicationAdministrations.count'() {
    try {
      const count = await MedicationAdministrations.find().countAsync();
      console.log('MedicationAdministrations count:', count);
      return count;
    } catch (error) {
      console.error('Error counting medication administrations:', error);
      throw new Meteor.Error('count-failed', error.message);
    }
  },

  async 'medicationAdministrations.findAll'() {
    try {
      const records = await MedicationAdministrations.find({}).fetchAsync();
      console.log('MedicationAdministrations findAll found:', records.length, 'records');
      return records;
    } catch (error) {
      console.error('Error finding medication administrations:', error);
      throw new Meteor.Error('find-failed', error.message);
    }
  }
});