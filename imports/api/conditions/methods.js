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

// Helper function to transform FHIR R4 format to SimpleSchema format
function transformConditionForStorage(conditionData) {
  const transformed = { ...conditionData };
  
  // Transform clinicalStatus from CodeableConcept to simple string
  if (transformed.clinicalStatus && transformed.clinicalStatus.coding) {
    transformed.clinicalStatus = get(transformed, 'clinicalStatus.coding[0].code');
  }
  
  // Transform verificationStatus from CodeableConcept to simple string
  if (transformed.verificationStatus && transformed.verificationStatus.coding) {
    transformed.verificationStatus = get(transformed, 'verificationStatus.coding[0].code');
  }
  
  // Transform notes array to single string (R4 to older format)
  if (transformed.note && Array.isArray(transformed.note)) {
    transformed.notes = get(transformed, 'note[0].text', '');
    delete transformed.note;
  }
  
  // Preserve the code field (SNOMED code)
  // The schema expects CodeableConceptSchema, so we keep it as-is
  if (conditionData.code) {
    transformed.code = conditionData.code;
  }
  
  // Preserve category field
  if (conditionData.category) {
    transformed.category = conditionData.category;
  }
  
  return transformed;
}

// Helper function to transform from SimpleSchema format back to FHIR R4
function transformConditionForDisplay(condition) {
  if (!condition) return condition;
  
  console.log('=== transformConditionForDisplay ===');
  console.log('Input condition has code:', !!condition.code);
  console.log('Input code:', JSON.stringify(condition.code, null, 2));
  
  const transformed = { ...condition };
  
  // Transform clinicalStatus from string to CodeableConcept
  if (typeof transformed.clinicalStatus === 'string') {
    const status = transformed.clinicalStatus;
    transformed.clinicalStatus = {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
        code: status,
        display: status.charAt(0).toUpperCase() + status.slice(1)
      }]
    };
  }
  
  // Transform verificationStatus from string to CodeableConcept
  if (typeof transformed.verificationStatus === 'string') {
    const status = transformed.verificationStatus;
    transformed.verificationStatus = {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
        code: status,
        display: status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      }]
    };
  }
  
  // Transform notes string to array (older format to R4)
  if (transformed.notes && !transformed.note) {
    transformed.note = [{
      text: transformed.notes
    }];
    delete transformed.notes;
  }
  
  console.log('=== transformConditionForDisplay output ===');
  console.log('Output condition has code:', !!transformed.code);
  console.log('Output code:', JSON.stringify(transformed.code, null, 2));
  
  return transformed;
}

Meteor.methods({
  async 'conditions.create'(conditionData) {
    check(conditionData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create conditions');
    }
    
    console.log('=== conditions.create called ===');
    console.log('Original data:', JSON.stringify(conditionData, null, 2));
    
    // Transform the data to match the schema
    const transformedData = transformConditionForStorage(conditionData);
    
    console.log('Transformed data:', JSON.stringify(transformedData, null, 2));
    
    // Add metadata
    const condition = {
      ...transformedData,
      resourceType: 'Condition',
      meta: {
        lastUpdated: new Date(),
        versionId: '1'
      }
    };
    
    console.log('Final condition to insert:', JSON.stringify(condition, null, 2));
    
    try {
      // Insert and return the new condition
      const Conditions = getConditions();
      console.log('Got Conditions collection:', !!Conditions);
      
      const conditionId = await Conditions.insertAsync(condition);
      console.log('Successfully inserted condition with ID:', conditionId);
      
      // Log for HIPAA compliance
      if (Meteor.isServer) {
        console.log('Condition created', {
          userId: this.userId,
          conditionId: conditionId,
          timestamp: new Date()
        });
      }
      
      return conditionId;
    } catch (error) {
      console.error('Error inserting condition:', error);
      console.error('Error details:', error.sanitizedError || error);
      throw error;
    }
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
    
    // Transform the data to match the schema
    const transformedData = transformConditionForStorage(conditionData);
    
    // Update metadata
    const updatedCondition = {
      ...transformedData,
      _id: conditionId,
      resourceType: 'Condition',
      meta: {
        ...get(transformedData, 'meta', {}),
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
    
    // Transform the condition back to FHIR R4 format for display
    const transformedCondition = transformConditionForDisplay(condition);
    
    return transformedCondition;
  }
});