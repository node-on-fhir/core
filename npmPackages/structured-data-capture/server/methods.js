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

// ServerMethods registry (rpc migration). The legacy names were capitalized
// resource-style ('QuestionnaireResponse.*') which the canonical dotted regex
// forbids AND which are distinct from the host app's registered
// 'questionnaireResponses.*' CRUD methods — this SDC package keeps its own
// in-memory response store. Renamed to canonical 'sdc.*' names with the legacy
// names as aliases (README call sites keep working; no live-code callers).
// phi:true — QuestionnaireResponses carry patient answers. positionalParams
// preserve the legacy (arg0, arg1) signatures. this.userId -> context.userId.
//
// createResponse keeps requireAuth:false because it explicitly supports the
// allowAnonymous option (public survey submission); the conditional in-body
// guard is preserved. The other five had hard `if (!this.userId) throw` guards
// → deleted in favor of the requireAuth default (true), EXCEPT listResponses/
// exportResponse which were guard-less (list self-scopes by userId, export
// checks per-record ownership) → left at default true (behavior change noted:
// previously callable pre-auth).
Meteor.ServerMethods.define('sdc.createResponse', {
  description: 'Initialize and store a QuestionnaireResponse (supports anonymous survey submission)',
  aliases: ['QuestionnaireResponse.create'],
  phi: true,
  // Public by design: supports the allowAnonymous option for public surveys;
  // the conditional auth check is preserved in the body below.
  requireAuth: false,
  positionalParams: ['questionnaire', 'options'],
  schemaObject: {
    type: 'object',
    properties: { questionnaire: { type: 'object' }, options: { type: 'object' } },
    required: ['questionnaire']
  }
}, async function(params, context){
    const questionnaire = get(params, 'questionnaire');
    const options = get(params, 'options') || {};

    // Check authentication (anonymous allowed only when opted in)
    if (!context.userId && !get(options, 'allowAnonymous')) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to create questionnaire response');
    }

    // Create new response
    const response = ResponseUtils.initializeResponse(questionnaire, {
      ...options,
      author: options.author || {
        reference: `Practitioner/${context.userId}`
      }
    });

    // Store in memory (in production, this would use the database)
    const responseId = response.id || Random.id();
    response.id = responseId;
    responseStorage.set(responseId, response);

    // Log activity
    console.log(`Created QuestionnaireResponse ${responseId} for user ${context.userId}`);

    return responseId;
});

Meteor.ServerMethods.define('sdc.updateResponse', {
  description: 'Update an owned QuestionnaireResponse in the SDC store',
  aliases: ['QuestionnaireResponse.update'],
  phi: true,
  positionalParams: ['responseId', 'updates'],
  schemaObject: {
    type: 'object',
    properties: { responseId: { type: 'string' }, updates: { type: 'object' } },
    required: ['responseId', 'updates']
  }
}, async function(params, context){
    const responseId = get(params, 'responseId');
    const updates = get(params, 'updates');

    // Get existing response
    const existingResponse = responseStorage.get(responseId);
    if (!existingResponse) {
      throw new Meteor.Error('not-found', 'QuestionnaireResponse not found');
    }

    // Check ownership
    const authorId = get(existingResponse, 'author.reference', '').split('/')[1];
    if (authorId !== context.userId) {
      throw new Meteor.Error('forbidden', 'Not authorized to update this response');
    }
    
    // Update modified timestamp
    updates.meta = updates.meta || {};
    updates.meta.lastUpdated = new Date().toISOString();
    
    // Update response
    const updatedResponse = { ...existingResponse, ...updates };
    responseStorage.set(responseId, updatedResponse);

    return 1; // Return 1 to indicate success
});

Meteor.ServerMethods.define('sdc.submitResponse', {
  description: 'Validate and mark an owned QuestionnaireResponse as completed',
  aliases: ['QuestionnaireResponse.submit'],
  phi: true,
  positionalParams: ['responseId', 'questionnaire'],
  schemaObject: {
    type: 'object',
    properties: { responseId: { type: 'string' }, questionnaire: { type: 'object' } },
    required: ['responseId', 'questionnaire']
  }
}, async function(params, context){
    const responseId = get(params, 'responseId');
    const questionnaire = get(params, 'questionnaire');

    // Get response
    const response = responseStorage.get(responseId);
    if (!response) {
      throw new Meteor.Error('not-found', 'QuestionnaireResponse not found');
    }

    // Check ownership
    const authorId = get(response, 'author.reference', '').split('/')[1];
    if (authorId !== context.userId) {
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
    
    console.log(`Submitted QuestionnaireResponse ${responseId} for user ${context.userId}`);

    return result;
});

Meteor.ServerMethods.define('sdc.listResponses', {
  description: 'List the current user QuestionnaireResponses from the SDC store with optional filters',
  aliases: ['QuestionnaireResponse.list'],
  phi: true,
  // Was guard-less pre-migration; requireAuth now applies (default true). The
  // result self-scopes to context.userId when present.
  positionalParams: ['filters'],
  schemaObject: {
    type: 'object',
    properties: { filters: { type: 'object' } }
  }
}, async function(params, context){
    const filters = get(params, 'filters') || {};

    // Build query
    const query = {};

    // Filter by user
    if (context.userId) {
      query['author.reference'] = `Practitioner/${context.userId}`;
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
});

Meteor.ServerMethods.define('sdc.deleteResponse', {
  description: 'Soft-delete an owned QuestionnaireResponse (status entered-in-error)',
  aliases: ['QuestionnaireResponse.delete'],
  phi: true,
  positionalParams: ['responseId'],
  schemaObject: {
    type: 'object',
    properties: { responseId: { type: 'string' } },
    required: ['responseId']
  }
}, async function(params, context){
    const responseId = get(params, 'responseId');

    // Get response
    const response = responseStorage.get(responseId);
    if (!response) {
      throw new Meteor.Error('not-found', 'QuestionnaireResponse not found');
    }

    // Check ownership
    const authorId = get(response, 'author.reference', '').split('/')[1];
    if (authorId !== context.userId) {
      throw new Meteor.Error('forbidden', 'Not authorized to delete this response');
    }
    
    // Soft delete by updating status
    response.status = 'entered-in-error';
    if (!response.meta) response.meta = {};
    response.meta.lastUpdated = new Date().toISOString();
    responseStorage.set(responseId, response);
    
    console.log(`Deleted QuestionnaireResponse ${responseId} for user ${context.userId}`);

    return 1;
});

Meteor.ServerMethods.define('sdc.exportResponse', {
  description: 'Export an owned QuestionnaireResponse as json or csv (pdf not yet implemented)',
  aliases: ['QuestionnaireResponse.export'],
  phi: true,
  // Was guard-less pre-migration; requireAuth now applies (default true).
  // Per-record ownership is still enforced in the body.
  positionalParams: ['responseId', 'format'],
  schemaObject: {
    type: 'object',
    properties: {
      responseId: { type: 'string' },
      format: { type: 'string', enum: ['json', 'csv', 'pdf'] }
    },
    required: ['responseId']
  }
}, async function(params, context){
    const responseId = get(params, 'responseId');
    const format = get(params, 'format') || 'json';

    // Get response
    const response = responseStorage.get(responseId);
    if (!response) {
      throw new Meteor.Error('not-found', 'QuestionnaireResponse not found');
    }

    // Check ownership
    const authorId = get(response, 'author.reference', '').split('/')[1];
    if (authorId !== context.userId) {
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
});