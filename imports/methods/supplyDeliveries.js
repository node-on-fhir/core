// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/methods/supplyDeliveries.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { get, set } from 'lodash';

import { SupplyDeliveries } from '/imports/lib/schemas/SimpleSchemas/SupplyDeliveries';
import { Random } from 'meteor/random';

Meteor.methods({
  async createSupplyDelivery(supplyDeliveryData) {
    console.log('createSupplyDelivery', supplyDeliveryData);
    check(supplyDeliveryData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create supply deliveries');
    }
    
    // Clean and prepare the supply delivery data
    let cleanSupplyDelivery = {
      resourceType: 'SupplyDelivery',
      id: Random.id(),
      status: get(supplyDeliveryData, 'status', 'in-progress'),
      patient: get(supplyDeliveryData, 'patient'),
      occurrenceDateTime: get(supplyDeliveryData, 'occurrenceDateTime') || new Date()
    };
    
    // Set the _id for MongoDB (use MongoDB ObjectID if USE_MONGO_OBJECTID is set)
    if (process.env.USE_MONGO_OBJECTID) {
      const objectId = new Mongo.ObjectID();
      cleanSupplyDelivery._id = objectId.toHexString();
    } else {
      cleanSupplyDelivery._id = cleanSupplyDelivery.id;
    }
    
    // Type - ensure proper CodeableConcept format
    if (supplyDeliveryData.type) {
      if (typeof supplyDeliveryData.type === 'string') {
        cleanSupplyDelivery.type = {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/supply-kind',
            code: supplyDeliveryData.type,
            display: supplyDeliveryData.type
          }],
          text: supplyDeliveryData.type
        };
      } else {
        cleanSupplyDelivery.type = supplyDeliveryData.type;
      }
    }
    
    // Supplied item
    if (supplyDeliveryData.suppliedItem) {
      cleanSupplyDelivery.suppliedItem = {};
      
      // Handle quantity
      if (supplyDeliveryData.suppliedItem.quantity) {
        cleanSupplyDelivery.suppliedItem.quantity = supplyDeliveryData.suppliedItem.quantity;
      }
      
      // Handle item as CodeableConcept or Reference
      if (supplyDeliveryData.suppliedItem.itemCodeableConcept) {
        cleanSupplyDelivery.suppliedItem.itemCodeableConcept = supplyDeliveryData.suppliedItem.itemCodeableConcept;
      } else if (supplyDeliveryData.suppliedItem.itemReference) {
        cleanSupplyDelivery.suppliedItem.itemReference = supplyDeliveryData.suppliedItem.itemReference;
      }
    }
    
    // Optional fields
    if (supplyDeliveryData.identifier) {
      cleanSupplyDelivery.identifier = supplyDeliveryData.identifier;
    }
    
    if (supplyDeliveryData.basedOn) {
      cleanSupplyDelivery.basedOn = supplyDeliveryData.basedOn;
    }
    
    if (supplyDeliveryData.partOf) {
      cleanSupplyDelivery.partOf = supplyDeliveryData.partOf;
    }
    
    if (supplyDeliveryData.supplier) {
      cleanSupplyDelivery.supplier = supplyDeliveryData.supplier;
    }
    
    if (supplyDeliveryData.destination) {
      cleanSupplyDelivery.destination = supplyDeliveryData.destination;
    }
    
    if (supplyDeliveryData.receiver) {
      cleanSupplyDelivery.receiver = supplyDeliveryData.receiver;
    } else {
      // Default receiver to current user if not provided
      const user = await Meteor.users.findOneAsync(this.userId);
      if (user) {
        const receiverName = get(user, 'profile.name.text', '') ||
                            `${get(user, 'profile.name.given[0]', '')} ${get(user, 'profile.name.family', '')}`.trim() ||
                            get(user, 'username', '');
        cleanSupplyDelivery.receiver = [{
          reference: `Practitioner/${this.userId}`,
          display: receiverName
        }];
      }
    }
    
    // Handle occurrence timing alternatives
    if (supplyDeliveryData.occurrencePeriod) {
      cleanSupplyDelivery.occurrencePeriod = supplyDeliveryData.occurrencePeriod;
      delete cleanSupplyDelivery.occurrenceDateTime;
    } else if (supplyDeliveryData.occurrenceTiming) {
      cleanSupplyDelivery.occurrenceTiming = supplyDeliveryData.occurrenceTiming;
      delete cleanSupplyDelivery.occurrenceDateTime;
    }
    
    // Schema validation is handled by the collection's attachSchema
    
    // Insert the supply delivery
    try {
      const supplyDeliveryId = await SupplyDeliveries.insertAsync(cleanSupplyDelivery);
      console.log('SupplyDelivery created with ID:', supplyDeliveryId);
      return supplyDeliveryId;
    } catch (error) {
      console.error('Error inserting supply delivery:', error);
      throw new Meteor.Error('insert-failed', 'Failed to create supply delivery', error.message);
    }
  },
  
  async updateSupplyDelivery(supplyDeliveryId, supplyDeliveryData) {
    console.log('updateSupplyDelivery', supplyDeliveryId, supplyDeliveryData);
    check(supplyDeliveryId, String);
    check(supplyDeliveryData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update supply deliveries');
    }
    
    // Remove the _id field if present to avoid update errors
    delete supplyDeliveryData._id;
    
    // Ensure type is proper CodeableConcept if it's a string
    if (supplyDeliveryData.type && typeof supplyDeliveryData.type === 'string') {
      supplyDeliveryData.type = {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/supply-kind',
          code: supplyDeliveryData.type,
          display: supplyDeliveryData.type
        }],
        text: supplyDeliveryData.type
      };
    }
    
    // Convert dates to proper format
    if (supplyDeliveryData.occurrenceDateTime && typeof supplyDeliveryData.occurrenceDateTime === 'string') {
      supplyDeliveryData.occurrenceDateTime = new Date(supplyDeliveryData.occurrenceDateTime);
    }
    
    // Schema validation is handled by the collection's attachSchema
    
    // Update the supply delivery
    try {
      const result = await SupplyDeliveries.updateAsync(
        { _id: supplyDeliveryId },
        { $set: supplyDeliveryData }
      );
      
      if (result === 0) {
        throw new Meteor.Error('not-found', 'SupplyDelivery not found');
      }
      
      console.log('SupplyDelivery updated successfully');
      return result;
    } catch (error) {
      console.error('Error updating supply delivery:', error);
      throw new Meteor.Error('update-failed', 'Failed to update supply delivery', error.message);
    }
  },
  
  async removeSupplyDelivery(supplyDeliveryId) {
    console.log('removeSupplyDelivery', supplyDeliveryId);
    check(supplyDeliveryId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to delete supply deliveries');
    }
    
    try {
      const result = await SupplyDeliveries.removeAsync({ _id: supplyDeliveryId });
      
      if (result === 0) {
        throw new Meteor.Error('not-found', 'SupplyDelivery not found');
      }
      
      console.log('SupplyDelivery removed successfully');
      return result;
    } catch (error) {
      console.error('Error removing supply delivery:', error);
      throw new Meteor.Error('remove-failed', 'Failed to remove supply delivery', error.message);
    }
  },
  
  async getSupplyDelivery(supplyDeliveryId) {
    console.log('getSupplyDelivery', supplyDeliveryId);
    check(supplyDeliveryId, String);
    
    try {
      const supplyDelivery = await SupplyDeliveries.findOneAsync({ _id: supplyDeliveryId });
      
      if (!supplyDelivery) {
        throw new Meteor.Error('not-found', 'SupplyDelivery not found');
      }
      
      return supplyDelivery;
    } catch (error) {
      console.error('Error getting supply delivery:', error);
      throw new Meteor.Error('get-failed', 'Failed to get supply delivery', error.message);
    }
  }
});