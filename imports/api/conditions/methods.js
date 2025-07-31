// /imports/api/conditions/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import moment from 'moment';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/Conditions';

// Get the correct Conditions collection reference
function getConditions() {
  if (Meteor.isServer) {
    // On server, use the global collection set up in server/main.js
    return Meteor.Collections?.Conditions || global.Conditions;
  } else {
    // On client, use from Meteor.Collections if available
    return Meteor.Collections?.Conditions;
  }
}

Meteor.methods({
  async 'conditions.create'(conditionData) {
    check(conditionData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create conditions');
    }
    
    // Add metadata
    const condition = {
      ...conditionData,
      resourceType: 'Condition',
      meta: {
        lastUpdated: new Date(),
        versionId: '1'
      }
    };
    
    // Insert and return the new condition
    const Conditions = getConditions();
    const conditionId = await Conditions.insertAsync(condition);
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Condition created', {
        userId: this.userId,
        conditionId: conditionId,
        timestamp: new Date()
      });
    }
    
    return conditionId;
  },
  
  async 'conditions.update'(conditionId, conditionData) {
    check(conditionId, String);
    check(conditionData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update conditions');
    }
    
    const Conditions = getConditions();
    
    // Check if condition exists
    const existingCondition = await Conditions.findOneAsync({ _id: conditionId });
    if (!existingCondition) {
      throw new Meteor.Error('not-found', 'Condition not found');
    }
    
    // Update metadata
    const updatedCondition = {
      ...conditionData,
      _id: conditionId,
      resourceType: 'Condition',
      meta: {
        ...get(conditionData, 'meta', {}),
        lastUpdated: new Date(),
        versionId: String(parseInt(get(existingCondition, 'meta.versionId', '0')) + 1)
      }
    };
    
    // Update the condition
    const result = await Conditions.updateAsync(
      { _id: conditionId },
      { $set: updatedCondition }
    );
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Condition updated', {
        userId: this.userId,
        conditionId: conditionId,
        timestamp: new Date()
      });
    }
    
    return result;
  },
  
  async 'conditions.remove'(conditionId) {
    check(conditionId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to remove conditions');
    }
    
    const Conditions = getConditions();
    
    // Check if condition exists
    const existingCondition = await Conditions.findOneAsync({ _id: conditionId });
    if (!existingCondition) {
      throw new Meteor.Error('not-found', 'Condition not found');
    }
    
    // Remove the condition
    const result = await Conditions.removeAsync({ _id: conditionId });
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Condition removed', {
        userId: this.userId,
        conditionId: conditionId,
        timestamp: new Date()
      });
    }
    
    return result;
  },
  
  async 'conditions.get'(conditionId) {
    check(conditionId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view conditions');
    }
    
    const Conditions = getConditions();
    console.log('conditions.get called with ID:', conditionId);
    console.log('Using Conditions collection:', !!Conditions);
    
    // Try both ways to find the condition
    let condition = await Conditions.findOneAsync({ _id: conditionId });
    
    if (!condition) {
      // Also try without the query object
      condition = await Conditions.findOneAsync(conditionId);
    }
    
    if (!condition) {
      console.log('Condition not found for ID:', conditionId);
      console.log('Total conditions in collection:', await Conditions.countAsync());
      
      // Log a few conditions to see their ID format
      const sampleConditions = await Conditions.find({}, { limit: 3 }).fetchAsync();
      console.log('Sample condition IDs:', sampleConditions.map(c => ({ _id: c._id, type: typeof c._id })));
      
      throw new Meteor.Error('not-found', 'Condition not found');
    }
    
    console.log('Found condition:', condition._id);
    return condition;
  }
});