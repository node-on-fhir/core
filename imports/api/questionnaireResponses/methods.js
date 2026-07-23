// /imports/api/questionnaireResponses/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

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

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('questionnaireResponses.create', {
  description: 'Create a new FHIR QuestionnaireResponse record with version metadata',
  phi: true,
  schemaObject: { type: 'object' }   // arbitrary QuestionnaireResponse payload
}, async function(params, context) {
  const questionnaireResponseData = params;

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
  context.log.info('QuestionnaireResponse created', {
    userId: context.userId,
    questionnaireResponseId: questionnaireResponseId,
    timestamp: new Date()
  });

  return questionnaireResponseId;
});

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('questionnaireResponses.update', {
  description: 'Update an existing QuestionnaireResponse and bump its version',
  phi: true,
  positionalParams: ['questionnaireResponseId', 'questionnaireResponseData'],
  schemaObject: {
    type: 'object',
    properties: { questionnaireResponseId: { type: 'string' }, questionnaireResponseData: { type: 'object' } },
    required: ['questionnaireResponseId', 'questionnaireResponseData']
  }
}, async function(params, context) {
  const questionnaireResponseId = params.questionnaireResponseId;
  const questionnaireResponseData = params.questionnaireResponseData;

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
  context.log.info('QuestionnaireResponse updated', {
    userId: context.userId,
    questionnaireResponseId: questionnaireResponseId,
    timestamp: new Date()
  });

  return result;
});

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('questionnaireResponses.remove', {
  description: 'Remove a QuestionnaireResponse by MongoDB _id',
  phi: true,
  positionalParams: ['questionnaireResponseId'],
  schemaObject: {
    type: 'object',
    properties: { questionnaireResponseId: { type: 'string' } },
    required: ['questionnaireResponseId']
  }
}, async function(params, context) {
  const questionnaireResponseId = params.questionnaireResponseId;

  const QuestionnaireResponses = getQuestionnaireResponses();

  // Check if questionnaire response exists
  const existingQuestionnaireResponse = await QuestionnaireResponses.findOneAsync({ _id: questionnaireResponseId });
  if (!existingQuestionnaireResponse) {
    throw new Meteor.Error('not-found', 'QuestionnaireResponse not found');
  }

  // Remove the questionnaire response
  const result = await QuestionnaireResponses.removeAsync({ _id: questionnaireResponseId });

  // Log for HIPAA compliance
  context.log.info('QuestionnaireResponse removed', {
    userId: context.userId,
    questionnaireResponseId: questionnaireResponseId,
    timestamp: new Date()
  });

  return result;
});

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('questionnaireResponses.get', {
  description: 'Fetch a single QuestionnaireResponse by MongoDB _id with fallbacks',
  phi: true,
  positionalParams: ['questionnaireResponseId'],
  schemaObject: {
    type: 'object',
    properties: { questionnaireResponseId: { type: 'string' } },
    required: ['questionnaireResponseId']
  }
}, async function(params, context) {
  const questionnaireResponseId = params.questionnaireResponseId;

  const QuestionnaireResponses = getQuestionnaireResponses();
  context.log.debug('questionnaireResponses.get called', { questionnaireResponseId: questionnaireResponseId, hasCollection: !!QuestionnaireResponses });

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
    context.log.warn('QuestionnaireResponse not found', {
      questionnaireResponseId: questionnaireResponseId,
      totalInCollection: await QuestionnaireResponses.countAsync()
    });

    // Log a few questionnaire responses to see their ID format
    const sampleResponses = await QuestionnaireResponses.find({}, { limit: 3 }).fetchAsync();
    context.log.debug('Sample questionnaire response IDs', { samples: sampleResponses.map(q => ({ _id: q._id, type: typeof q._id })) });

    throw new Meteor.Error('not-found', 'QuestionnaireResponse not found');
  }

  context.log.debug('Found questionnaire response', { _id: questionnaireResponse._id });
  return questionnaireResponse;
});
