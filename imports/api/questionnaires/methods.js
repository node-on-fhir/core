// /imports/api/questionnaires/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

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

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('questionnaires.create', {
  description: 'Create a new FHIR Questionnaire definition with version metadata',
  schemaObject: { type: 'object' }   // arbitrary Questionnaire payload
}, async function(params, context) {
  const questionnaireData = params;

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
  context.log.info('Questionnaire created', {
    userId: context.userId,
    questionnaireId: questionnaireId,
    timestamp: new Date()
  });

  return questionnaireId;
});

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('questionnaires.update', {
  description: 'Update an existing Questionnaire definition and bump its version',
  positionalParams: ['questionnaireId', 'questionnaireData'],
  schemaObject: {
    type: 'object',
    properties: { questionnaireId: { type: 'string' }, questionnaireData: { type: 'object' } },
    required: ['questionnaireId', 'questionnaireData']
  }
}, async function(params, context) {
  const questionnaireId = params.questionnaireId;
  const questionnaireData = params.questionnaireData;

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
  context.log.info('Questionnaire updated', {
    userId: context.userId,
    questionnaireId: questionnaireId,
    timestamp: new Date()
  });

  return result;
});

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('questionnaires.remove', {
  description: 'Remove a Questionnaire definition by MongoDB _id',
  positionalParams: ['questionnaireId'],
  schemaObject: {
    type: 'object',
    properties: { questionnaireId: { type: 'string' } },
    required: ['questionnaireId']
  }
}, async function(params, context) {
  const questionnaireId = params.questionnaireId;

  const Questionnaires = getQuestionnaires();

  // Check if questionnaire exists
  const existingQuestionnaire = await Questionnaires.findOneAsync({ _id: questionnaireId });
  if (!existingQuestionnaire) {
    throw new Meteor.Error('not-found', 'Questionnaire not found');
  }

  // Remove the questionnaire
  const result = await Questionnaires.removeAsync({ _id: questionnaireId });

  // Log for HIPAA compliance
  context.log.info('Questionnaire removed', {
    userId: context.userId,
    questionnaireId: questionnaireId,
    timestamp: new Date()
  });

  return result;
});

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('questionnaires.get', {
  description: 'Fetch a single Questionnaire definition by MongoDB _id',
  positionalParams: ['questionnaireId'],
  schemaObject: {
    type: 'object',
    properties: { questionnaireId: { type: 'string' } },
    required: ['questionnaireId']
  }
}, async function(params, context) {
  const questionnaireId = params.questionnaireId;

  const Questionnaires = getQuestionnaires();
  context.log.debug('questionnaires.get called', { questionnaireId: questionnaireId, hasCollection: !!Questionnaires });

  // Try both ways to find the questionnaire
  let questionnaire = await Questionnaires.findOneAsync({ _id: questionnaireId });

  if (!questionnaire) {
    // Also try without the query object
    questionnaire = await Questionnaires.findOneAsync(questionnaireId);
  }

  if (!questionnaire) {
    context.log.warn('Questionnaire not found', {
      questionnaireId: questionnaireId,
      totalInCollection: await Questionnaires.countAsync()
    });

    // Log a few questionnaires to see their ID format
    const sampleQuestionnaires = await Questionnaires.find({}, { limit: 3 }).fetchAsync();
    context.log.debug('Sample questionnaire IDs', { samples: sampleQuestionnaires.map(q => ({ _id: q._id, type: typeof q._id })) });

    throw new Meteor.Error('not-found', 'Questionnaire not found');
  }

  context.log.debug('Found questionnaire', { _id: questionnaire._id });
  return questionnaire;
});
