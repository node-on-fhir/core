// /imports/api/carePlans/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import moment from 'moment';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/CarePlans';

// Import the CarePlans collection
import { CarePlans } from '/imports/lib/schemas/SimpleSchemas/CarePlans';

// Get the correct CarePlans collection reference
function getCarePlans() {
  return CarePlans;
}

Meteor.methods({
  async 'createCarePlan'(carePlanData) {
    check(carePlanData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create care plans');
    }
    
    // Add metadata
    const carePlan = {
      ...carePlanData,
      resourceType: 'CarePlan',
      meta: {
        lastUpdated: new Date(),
        versionId: '1'
      }
    };
    
    // Insert and return the new care plan
    const CarePlans = getCarePlans();
    const carePlanId = await CarePlans.insertAsync(carePlan);
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('CarePlan created', {
        userId: this.userId,
        carePlanId: carePlanId,
        timestamp: new Date()
      });
    }
    
    return carePlanId;
  },
  
  async 'updateCarePlan'(carePlanId, carePlanData) {
    check(carePlanId, String);
    check(carePlanData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update care plans');
    }
    
    const CarePlans = getCarePlans();
    
    // Check if care plan exists
    const existingCarePlan = await CarePlans.findOneAsync({ _id: carePlanId });
    if (!existingCarePlan) {
      throw new Meteor.Error('not-found', 'Care plan not found');
    }
    
    // Update metadata
    const updatedCarePlan = {
      ...carePlanData,
      _id: carePlanId,
      resourceType: 'CarePlan',
      meta: {
        ...get(carePlanData, 'meta', {}),
        lastUpdated: new Date(),
        versionId: String(parseInt(get(existingCarePlan, 'meta.versionId', '0')) + 1)
      }
    };
    
    // Update the care plan
    const result = await CarePlans.updateAsync(
      { _id: carePlanId },
      { $set: updatedCarePlan }
    );
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('CarePlan updated', {
        userId: this.userId,
        carePlanId: carePlanId,
        timestamp: new Date()
      });
    }
    
    return result;
  },
  
  async 'removeCarePlan'(carePlanId) {
    check(carePlanId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to delete care plans');
    }
    
    const CarePlans = getCarePlans();
    
    // Check if care plan exists
    const existingCarePlan = await CarePlans.findOneAsync({ _id: carePlanId });
    if (!existingCarePlan) {
      throw new Meteor.Error('not-found', 'Care plan not found');
    }
    
    // Remove the care plan
    const result = await CarePlans.removeAsync({ _id: carePlanId });
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('CarePlan deleted', {
        userId: this.userId,
        carePlanId: carePlanId,
        timestamp: new Date()
      });
    }
    
    return result;
  }
});