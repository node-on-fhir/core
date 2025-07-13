// /imports/api/conditions/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import moment from 'moment';

import { Conditions } from '/imports/lib/schemas/SimpleSchemas/Conditions';

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
    const conditionId = await Conditions._collection.insertAsync(condition);
    
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
    const result = await Conditions._collection.updateAsync(
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
    
    // Check if condition exists
    const existingCondition = await Conditions.findOneAsync({ _id: conditionId });
    if (!existingCondition) {
      throw new Meteor.Error('not-found', 'Condition not found');
    }
    
    // Remove the condition
    const result = await Conditions._collection.removeAsync({ _id: conditionId });
    
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
    
    const condition = await Conditions.findOneAsync({ _id: conditionId });
    
    if (!condition) {
      throw new Meteor.Error('not-found', 'Condition not found');
    }
    
    return condition;
  }
});