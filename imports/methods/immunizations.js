// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/methods/immunizations.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { get, set } from 'lodash';

import { Immunizations, ImmunizationSchema } from '/imports/lib/schemas/SimpleSchemas/Immunizations';
import { Random } from 'meteor/random';

Meteor.methods({
  async createImmunization(immunizationData) {
    console.log('createImmunization', immunizationData);
    check(immunizationData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create immunizations');
    }
    
    // Clean and prepare the immunization data
    let cleanImmunization = {
      resourceType: 'Immunization',
      id: Random.id(),
      status: get(immunizationData, 'status', 'completed'),
      patient: get(immunizationData, 'patient'),
      occurrenceDateTime: get(immunizationData, 'occurrenceDateTime') || new Date(),
      primarySource: get(immunizationData, 'primarySource', true)
    };
    
    // Set the _id for MongoDB (use MongoDB ObjectID if USE_MONGO_OBJECTID is set)
    if (process.env.USE_MONGO_OBJECTID) {
      const objectId = new Mongo.ObjectID();
      cleanImmunization._id = objectId.toHexString();
    } else {
      cleanImmunization._id = cleanImmunization.id;
    }
    
    // Vaccine code - ensure proper CodeableConcept format
    if (immunizationData.vaccineCode) {
      if (typeof immunizationData.vaccineCode === 'string') {
        cleanImmunization.vaccineCode = {
          coding: [{
            system: 'http://hl7.org/fhir/sid/cvx',
            code: immunizationData.vaccineCode,
            display: immunizationData.vaccineCode
          }],
          text: immunizationData.vaccineCode
        };
      } else {
        cleanImmunization.vaccineCode = immunizationData.vaccineCode;
      }
    }
    
    // Optional fields
    if (immunizationData.lotNumber) {
      cleanImmunization.lotNumber = immunizationData.lotNumber;
    }
    
    if (immunizationData.expirationDate) {
      cleanImmunization.expirationDate = new Date(immunizationData.expirationDate);
    }
    
    if (immunizationData.manufacturer) {
      cleanImmunization.manufacturer = immunizationData.manufacturer;
    }
    
    if (immunizationData.site) {
      cleanImmunization.site = immunizationData.site;
    }
    
    if (immunizationData.route) {
      cleanImmunization.route = immunizationData.route;
    }
    
    if (immunizationData.doseQuantity) {
      cleanImmunization.doseQuantity = immunizationData.doseQuantity;
    }
    
    if (immunizationData.performer) {
      cleanImmunization.performer = immunizationData.performer;
    } else {
      // Default performer to current user if not provided
      const user = await Meteor.users.findOneAsync(this.userId);
      if (user) {
        const performerName = get(user, 'profile.name.text', '') ||
                            `${get(user, 'profile.name.given[0]', '')} ${get(user, 'profile.name.family', '')}`.trim() ||
                            get(user, 'username', '');
        cleanImmunization.performer = [{
          actor: {
            reference: `Practitioner/${this.userId}`,
            display: performerName
          }
        }];
      }
    }
    
    if (immunizationData.note) {
      cleanImmunization.note = immunizationData.note;
    }
    
    // Schema validation is handled by the collection's attachSchema
    
    // Insert the immunization
    try {
      const immunizationId = await Immunizations.insertAsync(cleanImmunization);
      console.log('Immunization created with ID:', immunizationId);
      return immunizationId;
    } catch (error) {
      console.error('Error inserting immunization:', error);
      throw new Meteor.Error('insert-failed', 'Failed to create immunization', error.message);
    }
  },
  
  async updateImmunization(immunizationId, immunizationData) {
    console.log('updateImmunization', immunizationId, immunizationData);
    check(immunizationId, String);
    check(immunizationData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update immunizations');
    }
    
    // Remove the _id field if present to avoid update errors
    delete immunizationData._id;
    
    // Ensure vaccine code is proper CodeableConcept if it's a string
    if (immunizationData.vaccineCode && typeof immunizationData.vaccineCode === 'string') {
      immunizationData.vaccineCode = {
        coding: [{
          system: 'http://hl7.org/fhir/sid/cvx',
          code: immunizationData.vaccineCode,
          display: immunizationData.vaccineCode
        }],
        text: immunizationData.vaccineCode
      };
    }
    
    // Convert dates to proper format
    if (immunizationData.occurrenceDateTime && typeof immunizationData.occurrenceDateTime === 'string') {
      immunizationData.occurrenceDateTime = new Date(immunizationData.occurrenceDateTime);
    }
    
    if (immunizationData.expirationDate && typeof immunizationData.expirationDate === 'string') {
      immunizationData.expirationDate = new Date(immunizationData.expirationDate);
    }
    
    // Schema validation is handled by the collection's attachSchema
    
    // Update the immunization
    try {
      const result = await Immunizations.updateAsync(
        { _id: immunizationId },
        { $set: immunizationData }
      );
      
      if (result === 0) {
        throw new Meteor.Error('not-found', 'Immunization not found');
      }
      
      console.log('Immunization updated successfully');
      return result;
    } catch (error) {
      console.error('Error updating immunization:', error);
      throw new Meteor.Error('update-failed', 'Failed to update immunization', error.message);
    }
  },
  
  async removeImmunization(immunizationId) {
    console.log('removeImmunization', immunizationId);
    check(immunizationId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to delete immunizations');
    }
    
    try {
      const result = await Immunizations.removeAsync({ _id: immunizationId });
      
      if (result === 0) {
        throw new Meteor.Error('not-found', 'Immunization not found');
      }
      
      console.log('Immunization removed successfully');
      return result;
    } catch (error) {
      console.error('Error removing immunization:', error);
      throw new Meteor.Error('remove-failed', 'Failed to remove immunization', error.message);
    }
  },
  
  async getImmunization(immunizationId) {
    console.log('getImmunization', immunizationId);
    check(immunizationId, String);
    
    try {
      const immunization = await Immunizations.findOneAsync({ _id: immunizationId });
      
      if (!immunization) {
        throw new Meteor.Error('not-found', 'Immunization not found');
      }
      
      return immunization;
    } catch (error) {
      console.error('Error getting immunization:', error);
      throw new Meteor.Error('get-failed', 'Failed to get immunization', error.message);
    }
  }
});