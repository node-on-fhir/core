// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/server/methods.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import { ValidationUtils } from '../lib/ValidationUtils';
import { ResponseUtils } from '../lib/ResponseUtils';

// Simple in-memory storage for demo purposes
// In production, this would use the existing QuestionnaireResponses collection
const responseStorage = new Map();

Meteor.methods({
  'QuestionnaireResponse.create': async function(questionnaire, options = {}) {
    check(questionnaire, Object);
    check(options, Match.Maybe(Object));
    
    // Check authentication
    if (!this.userId && !get(options, 'allowAnonymous')) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to create questionnaire response');
    }
    
    // Create new response
    const response = ResponseUtils.initializeResponse(questionnaire, {
      ...options,
      author: options.author || {
        reference: `Practitioner/${this.userId}`
      }
    });
    
    // Store in memory (in production, this would use the database)
    const responseId = response.id || Random.id();
    response.id = responseId;
    responseStorage.set(responseId, response);
    
    // Log activity
    console.log(`Created QuestionnaireResponse ${responseId} for user ${this.userId}`);
    
    return responseId;
  },

  'QuestionnaireResponse.update': async function(responseId, updates) {
    check(responseId, String);
    check(updates, Object);
    
    // Check authentication
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to update questionnaire response');
    }
    
    // Get existing response
    const existingResponse = responseStorage.get(responseId);
    if (!existingResponse) {
      throw new Meteor.Error('not-found', 'QuestionnaireResponse not found');
    }
    
    // Check ownership
    const authorId = get(existingResponse, 'author.reference', '').split('/')[1];
    if (authorId !== this.userId) {
      throw new Meteor.Error('forbidden', 'Not authorized to update this response');
    }
    
    // Update modified timestamp
    updates.meta = updates.meta || {};
    updates.meta.lastUpdated = new Date().toISOString();
    
    // Update response
    const updatedResponse = { ...existingResponse, ...updates };
    responseStorage.set(responseId, updatedResponse);
    
    return 1; // Return 1 to indicate success
  },

  'QuestionnaireResponse.submit': async function(responseId, questionnaire) {
    check(responseId, String);
    check(questionnaire, Object);
    
    // Check authentication
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to submit questionnaire response');
    }
    
    // Get response
    const response = responseStorage.get(responseId);
    if (!response) {
      throw new Meteor.Error('not-found', 'QuestionnaireResponse not found');
    }
    
    // Check ownership
    const authorId = get(response, 'author.reference', '').split('/')[1];
    if (authorId !== this.userId) {
      throw new Meteor.Error('forbidden', 'Not authorized to submit this response');
    }
    
    // Validate response
    const validation = ValidationUtils.validateQuestionnaireResponse(questionnaire, response);
    if (!validation.valid) {
      throw new Meteor.Error('validation-failed', 'Response validation failed', validation.errors);
    }
    
    // Update status to completed
    response.status = 'completed';
    if (!response.meta) response.meta = {};
    response.meta.lastUpdated = new Date().toISOString();
    responseStorage.set(responseId, response);
    const result = 1;
    
    // Trigger any post-submission hooks
    if (Meteor.settings.questionnaire?.onSubmit) {
      Meteor.defer(function() {
        try {
          const hook = eval(Meteor.settings.questionnaire.onSubmit);
          hook(response, questionnaire);
        } catch (error) {
          console.error('Error in questionnaire submit hook:', error);
        }
      });
    }
    
    console.log(`Submitted QuestionnaireResponse ${responseId} for user ${this.userId}`);
    
    return result;
  },

  'QuestionnaireResponse.list': async function(filters = {}) {
    check(filters, Match.Maybe(Object));
    
    // Build query
    const query = {};
    
    // Filter by user
    if (this.userId) {
      query['author.reference'] = `Practitioner/${this.userId}`;
    }
    
    // Apply additional filters
    if (filters.questionnaire) {
      query.questionnaire = filters.questionnaire;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.subject) {
      query['subject.reference'] = filters.subject;
    }
    
    if (filters.authored) {
      query.authored = {
        $gte: filters.authored.start,
        $lte: filters.authored.end
      };
    }
    
    // Filter responses from storage
    const responses = Array.from(responseStorage.values())
      .filter(response => {
        if (query['author.reference'] && get(response, 'author.reference') !== query['author.reference']) {
          return false;
        }
        if (query.questionnaire && response.questionnaire !== query.questionnaire) {
          return false;
        }
        if (query.status && response.status !== query.status) {
          return false;
        }
        if (query['subject.reference'] && get(response, 'subject.reference') !== query['subject.reference']) {
          return false;
        }
        if (query.authored) {
          const authored = new Date(response.authored);
          const start = new Date(query.authored.$gte);
          const end = new Date(query.authored.$lte);
          if (authored < start || authored > end) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => new Date(b.authored) - new Date(a.authored))
      .slice(0, filters.limit || 100);
    
    return responses;
  },

  'QuestionnaireResponse.delete': async function(responseId) {
    check(responseId, String);
    
    // Check authentication
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to delete questionnaire response');
    }
    
    // Get response
    const response = responseStorage.get(responseId);
    if (!response) {
      throw new Meteor.Error('not-found', 'QuestionnaireResponse not found');
    }
    
    // Check ownership
    const authorId = get(response, 'author.reference', '').split('/')[1];
    if (authorId !== this.userId) {
      throw new Meteor.Error('forbidden', 'Not authorized to delete this response');
    }
    
    // Soft delete by updating status
    response.status = 'entered-in-error';
    if (!response.meta) response.meta = {};
    response.meta.lastUpdated = new Date().toISOString();
    responseStorage.set(responseId, response);
    
    console.log(`Deleted QuestionnaireResponse ${responseId} for user ${this.userId}`);
    
    return 1;
  },

  'QuestionnaireResponse.export': async function(responseId, format = 'json') {
    check(responseId, String);
    check(format, Match.OneOf('json', 'csv', 'pdf'));
    
    // Get response
    const response = responseStorage.get(responseId);
    if (!response) {
      throw new Meteor.Error('not-found', 'QuestionnaireResponse not found');
    }
    
    // Check ownership
    const authorId = get(response, 'author.reference', '').split('/')[1];
    if (authorId !== this.userId) {
      throw new Meteor.Error('forbidden', 'Not authorized to export this response');
    }
    
    // Export based on format
    switch (format) {
      case 'json':
        return response;
        
      case 'csv':
        // Extract answers as flat structure
        const answers = ResponseUtils.extractAnswers(response);
        const csv = Object.entries(answers).map(([key, value]) => {
          return `"${key}","${String(value).replace(/"/g, '""')}"`;
        }).join('\n');
        return `LinkId,Answer\n${csv}`;
        
      case 'pdf':
        // This would require a PDF generation library
        throw new Meteor.Error('not-implemented', 'PDF export not yet implemented');
        
      default:
        throw new Meteor.Error('invalid-format', 'Invalid export format');
    }
  }
});