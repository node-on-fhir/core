// /imports/api/allergyIntolerances/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { get, set } from 'lodash';

import { AllergyIntolerances } from '/imports/lib/schemas/SimpleSchemas/AllergyIntolerances';

Meteor.methods({
  async 'createAllergyIntolerance'(allergyIntoleranceData) {
    check(allergyIntoleranceData, Object);
    
    console.log('createAllergyIntolerance called with data:', JSON.stringify(allergyIntoleranceData, null, 2));
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create allergy intolerances');
    }

    // Create a clean object for insertion
    let cleanAllergyIntolerance = {
      resourceType: 'AllergyIntolerance',
      meta: {
        lastUpdated: new Date()
      }
    };

    // Set clinical status (handle both string and CodeableConcept formats)
    if (allergyIntoleranceData.clinicalStatus) {
      cleanAllergyIntolerance.clinicalStatus = allergyIntoleranceData.clinicalStatus;
    } else {
      // Default to active
      cleanAllergyIntolerance.clinicalStatus = {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
          code: "active",
          display: "Active"
        }]
      };
    }

    // Set verification status (handle both string and CodeableConcept formats)
    if (allergyIntoleranceData.verificationStatus) {
      cleanAllergyIntolerance.verificationStatus = allergyIntoleranceData.verificationStatus;
    } else {
      // Default to unconfirmed
      cleanAllergyIntolerance.verificationStatus = {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
          code: "unconfirmed",
          display: "Unconfirmed"
        }]
      };
    }

    // Type (allergy or intolerance)
    if (allergyIntoleranceData.type) {
      cleanAllergyIntolerance.type = allergyIntoleranceData.type;
    }

    // Category array
    if (allergyIntoleranceData.category) {
      cleanAllergyIntolerance.category = allergyIntoleranceData.category;
    }

    // Criticality
    if (allergyIntoleranceData.criticality) {
      cleanAllergyIntolerance.criticality = allergyIntoleranceData.criticality;
    }

    // Code (the allergen)
    if (allergyIntoleranceData.code) {
      cleanAllergyIntolerance.code = allergyIntoleranceData.code;
    }

    // Patient reference
    if (allergyIntoleranceData.patient) {
      cleanAllergyIntolerance.patient = allergyIntoleranceData.patient;
      console.log('[createAllergyIntolerance] Patient reference:', cleanAllergyIntolerance.patient);
    } else {
      console.log('[createAllergyIntolerance] WARNING: No patient reference provided!');
    }

    // Onset date
    if (allergyIntoleranceData.onsetDateTime) {
      cleanAllergyIntolerance.onsetDateTime = allergyIntoleranceData.onsetDateTime;
    }

    // Recorder reference
    if (allergyIntoleranceData.recorder) {
      cleanAllergyIntolerance.recorder = allergyIntoleranceData.recorder;
    }

    // Asserter reference
    if (allergyIntoleranceData.asserter) {
      cleanAllergyIntolerance.asserter = allergyIntoleranceData.asserter;
    }

    // Reaction details
    if (allergyIntoleranceData.reaction) {
      cleanAllergyIntolerance.reaction = allergyIntoleranceData.reaction;
    }

    // Notes
    if (allergyIntoleranceData.note) {
      cleanAllergyIntolerance.note = allergyIntoleranceData.note;
    }

    // Generate ID if using Meteor string IDs
    cleanAllergyIntolerance.id = Random.id();

    console.log('About to insert cleanAllergyIntolerance:', JSON.stringify(cleanAllergyIntolerance, null, 2));

    try {
      const result = await AllergyIntolerances.insertAsync(cleanAllergyIntolerance);
      console.log('Created allergy intolerance with _id:', result);
      return result;
    } catch (error) {
      console.error('Error creating allergy intolerance:', error);
      throw new Meteor.Error('insert-failed', error.message);
    }
  },

  async 'updateAllergyIntolerance'(allergyIntoleranceId, allergyIntoleranceData) {
    check(allergyIntoleranceId, String);
    check(allergyIntoleranceData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update allergy intolerances');
    }

    // Remove _id from update data if present
    delete allergyIntoleranceData._id;
    
    // Update metadata
    set(allergyIntoleranceData, 'meta.lastUpdated', new Date());

    try {
      const result = await AllergyIntolerances.updateAsync(
        { _id: allergyIntoleranceId },
        { $set: allergyIntoleranceData }
      );
      console.log('Updated allergy intolerance:', result);
      return result;
    } catch (error) {
      console.error('Error updating allergy intolerance:', error);
      throw new Meteor.Error('update-failed', error.message);
    }
  },

  async 'removeAllergyIntolerance'(allergyIntoleranceId) {
    check(allergyIntoleranceId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to delete allergy intolerances');
    }

    try {
      const result = await AllergyIntolerances.removeAsync({ _id: allergyIntoleranceId });
      console.log('Removed allergy intolerance:', result);
      return result;
    } catch (error) {
      console.error('Error removing allergy intolerance:', error);
      throw new Meteor.Error('remove-failed', error.message);
    }
  },

  async 'allergyIntolerances.count'() {
    try {
      const count = await AllergyIntolerances.find().countAsync();
      console.log('AllergyIntolerances count:', count);
      return count;
    } catch (error) {
      console.error('Error counting allergy intolerances:', error);
      throw new Meteor.Error('count-failed', error.message);
    }
  },

  async 'allergyIntolerances.findAll'() {
    try {
      const records = await AllergyIntolerances.find({}).fetchAsync();
      console.log('AllergyIntolerances findAll found:', records.length, 'records');
      return records;
    } catch (error) {
      console.error('Error finding allergy intolerances:', error);
      throw new Meteor.Error('find-failed', error.message);
    }
  }
});