// /imports/api/questionnaireResponses/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import moment from 'moment';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/QuestionnaireResponses';

// Get the correct QuestionnaireResponses collection reference
function getQuestionnaireResponses() {
  if (Meteor.isServer) {
    // On server, use the global collection set up in server/main.js
    return Meteor.Collections?.QuestionnaireResponses || global.QuestionnaireResponses;
  } else {
    // On client, use from Meteor.Collections if available
    return Meteor.Collections?.QuestionnaireResponses;
  }
}

Meteor.methods({
  async 'questionnaireResponses.create'(questionnaireResponseData) {
    console.log('questionnaireResponses.create called with:', questionnaireResponseData);
    console.log('Type of data:', typeof questionnaireResponseData);
    console.log('Is it an object?', questionnaireResponseData && typeof questionnaireResponseData === 'object');
    
    check(questionnaireResponseData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create questionnaire responses');
    }
    
    // Add metadata
    const questionnaireResponse = {
      ...questionnaireResponseData,
      resourceType: 'QuestionnaireResponse',
      meta: {
        lastUpdated: new Date(),
        versionId: '1'
      }
    };
    
    // Insert and return the new questionnaire response
    const QuestionnaireResponses = getQuestionnaireResponses();
    const questionnaireResponseId = await QuestionnaireResponses.insertAsync(questionnaireResponse);
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('QuestionnaireResponse created', {
        userId: this.userId,
        questionnaireResponseId: questionnaireResponseId,
        timestamp: new Date()
      });
    }
    
    return questionnaireResponseId;
  },
  
  async 'questionnaireResponses.update'(questionnaireResponseId, questionnaireResponseData) {
    console.log('questionnaireResponses.update called with ID:', questionnaireResponseId);
    console.log('Type of ID:', typeof questionnaireResponseId);
    console.log('ID value:', questionnaireResponseId);
    
    check(questionnaireResponseId, String);
    check(questionnaireResponseData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update questionnaire responses');
    }
    
    const QuestionnaireResponses = getQuestionnaireResponses();
    
    // Check if questionnaire response exists
    const existingQuestionnaireResponse = await QuestionnaireResponses.findOneAsync({ _id: questionnaireResponseId });
    if (!existingQuestionnaireResponse) {
      throw new Meteor.Error('not-found', 'QuestionnaireResponse not found');
    }
    
    // Update metadata
    const updatedQuestionnaireResponse = {
      ...questionnaireResponseData,
      _id: questionnaireResponseId,
      resourceType: 'QuestionnaireResponse',
      meta: {
        ...get(questionnaireResponseData, 'meta', {}),
        lastUpdated: new Date(),
        versionId: String(parseInt(get(existingQuestionnaireResponse, 'meta.versionId', '0')) + 1)
      }
    };
    
    // Update the questionnaire response
    const result = await QuestionnaireResponses.updateAsync(
      { _id: questionnaireResponseId },
      { $set: updatedQuestionnaireResponse }
    );
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('QuestionnaireResponse updated', {
        userId: this.userId,
        questionnaireResponseId: questionnaireResponseId,
        timestamp: new Date()
      });
    }
    
    return result;
  },
  
  async 'questionnaireResponses.remove'(questionnaireResponseId) {
    check(questionnaireResponseId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to remove questionnaire responses');
    }
    
    const QuestionnaireResponses = getQuestionnaireResponses();
    
    // Check if questionnaire response exists
    const existingQuestionnaireResponse = await QuestionnaireResponses.findOneAsync({ _id: questionnaireResponseId });
    if (!existingQuestionnaireResponse) {
      throw new Meteor.Error('not-found', 'QuestionnaireResponse not found');
    }
    
    // Remove the questionnaire response
    const result = await QuestionnaireResponses.removeAsync({ _id: questionnaireResponseId });
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('QuestionnaireResponse removed', {
        userId: this.userId,
        questionnaireResponseId: questionnaireResponseId,
        timestamp: new Date()
      });
    }
    
    return result;
  },
  
  async 'questionnaireResponses.get'(questionnaireResponseId) {
    check(questionnaireResponseId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view questionnaire responses');
    }
    
    const QuestionnaireResponses = getQuestionnaireResponses();
    console.log('getQuestionnaireResponse called with ID:', questionnaireResponseId);
    console.log('Using QuestionnaireResponses collection:', !!QuestionnaireResponses);
    
    // Try multiple ways to find the questionnaire response
    let questionnaireResponse = await QuestionnaireResponses.findOneAsync({ _id: questionnaireResponseId });
    
    if (!questionnaireResponse) {
      // Try with id field
      questionnaireResponse = await QuestionnaireResponses.findOneAsync({ id: questionnaireResponseId });
    }
    
    if (!questionnaireResponse) {
      // Also try without the query object
      questionnaireResponse = await QuestionnaireResponses.findOneAsync(questionnaireResponseId);
    }
    
    if (!questionnaireResponse) {
      console.log('QuestionnaireResponse not found for ID:', questionnaireResponseId);
      console.log('Total questionnaire responses in collection:', await QuestionnaireResponses.countAsync());
      
      // Log a few questionnaire responses to see their ID format
      const sampleResponses = await QuestionnaireResponses.find({}, { limit: 3 }).fetchAsync();
      console.log('Sample questionnaire response IDs:', sampleResponses.map(q => ({ _id: q._id, type: typeof q._id })));
      
      throw new Meteor.Error('not-found', 'QuestionnaireResponse not found');
    }
    
    console.log('Found questionnaire response:', questionnaireResponse._id);
    return questionnaireResponse;
  }
});