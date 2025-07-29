// /imports/api/questionnaires/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import moment from 'moment';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/Questionnaires';

// Get the correct Questionnaires collection reference
function getQuestionnaires() {
  if (Meteor.isServer) {
    // On server, use the global collection set up in server/main.js
    return Meteor.Collections?.Questionnaires || global.Questionnaires;
  } else {
    // On client, use from Meteor.Collections if available
    return Meteor.Collections?.Questionnaires;
  }
}

Meteor.methods({
  async 'questionnaires.create'(questionnaireData) {
    check(questionnaireData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create questionnaires');
    }
    
    // Add metadata
    const questionnaire = {
      ...questionnaireData,
      resourceType: 'Questionnaire',
      meta: {
        lastUpdated: new Date(),
        versionId: '1'
      }
    };
    
    // Insert and return the new questionnaire
    const Questionnaires = getQuestionnaires();
    const questionnaireId = await Questionnaires.insertAsync(questionnaire);
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Questionnaire created', {
        userId: this.userId,
        questionnaireId: questionnaireId,
        timestamp: new Date()
      });
    }
    
    return questionnaireId;
  },
  
  async 'questionnaires.update'(questionnaireId, questionnaireData) {
    check(questionnaireId, String);
    check(questionnaireData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update questionnaires');
    }
    
    const Questionnaires = getQuestionnaires();
    
    // Check if questionnaire exists
    const existingQuestionnaire = await Questionnaires.findOneAsync({ _id: questionnaireId });
    if (!existingQuestionnaire) {
      throw new Meteor.Error('not-found', 'Questionnaire not found');
    }
    
    // Update metadata
    const updatedQuestionnaire = {
      ...questionnaireData,
      _id: questionnaireId,
      resourceType: 'Questionnaire',
      meta: {
        ...get(questionnaireData, 'meta', {}),
        lastUpdated: new Date(),
        versionId: String(parseInt(get(existingQuestionnaire, 'meta.versionId', '0')) + 1)
      }
    };
    
    // Update the questionnaire
    const result = await Questionnaires.updateAsync(
      { _id: questionnaireId },
      { $set: updatedQuestionnaire }
    );
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Questionnaire updated', {
        userId: this.userId,
        questionnaireId: questionnaireId,
        timestamp: new Date()
      });
    }
    
    return result;
  },
  
  async 'questionnaires.remove'(questionnaireId) {
    check(questionnaireId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to remove questionnaires');
    }
    
    const Questionnaires = getQuestionnaires();
    
    // Check if questionnaire exists
    const existingQuestionnaire = await Questionnaires.findOneAsync({ _id: questionnaireId });
    if (!existingQuestionnaire) {
      throw new Meteor.Error('not-found', 'Questionnaire not found');
    }
    
    // Remove the questionnaire
    const result = await Questionnaires.removeAsync({ _id: questionnaireId });
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Questionnaire removed', {
        userId: this.userId,
        questionnaireId: questionnaireId,
        timestamp: new Date()
      });
    }
    
    return result;
  },
  
  async 'questionnaires.get'(questionnaireId) {
    check(questionnaireId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view questionnaires');
    }
    
    const Questionnaires = getQuestionnaires();
    console.log('questionnaires.get called with ID:', questionnaireId);
    console.log('Using Questionnaires collection:', !!Questionnaires);
    
    // Try both ways to find the questionnaire
    let questionnaire = await Questionnaires.findOneAsync({ _id: questionnaireId });
    
    if (!questionnaire) {
      // Also try without the query object
      questionnaire = await Questionnaires.findOneAsync(questionnaireId);
    }
    
    if (!questionnaire) {
      console.log('Questionnaire not found for ID:', questionnaireId);
      console.log('Total questionnaires in collection:', await Questionnaires.countAsync());
      
      // Log a few questionnaires to see their ID format
      const sampleQuestionnaires = await Questionnaires.find({}, { limit: 3 }).fetchAsync();
      console.log('Sample questionnaire IDs:', sampleQuestionnaires.map(q => ({ _id: q._id, type: typeof q._id })));
      
      throw new Meteor.Error('not-found', 'Questionnaire not found');
    }
    
    console.log('Found questionnaire:', questionnaire._id);
    return questionnaire;
  }
});