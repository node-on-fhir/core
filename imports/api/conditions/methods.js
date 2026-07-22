// /imports/api/conditions/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/Conditions';

// Get the correct Conditions collection reference
function getConditions() {
  if (Meteor.isServer) {
    return Meteor.Collections?.Conditions || global.Conditions;
  } else {
    return Meteor.Collections?.Conditions;
  }
}

Meteor.ServerMethods.define('conditions.create', {
  description: 'Create a FHIR Condition record for a patient',
  phi: true,
  schemaObject: { type: 'object' }
}, async function(params, context){
  const conditionData = params;

  // Store in FHIR R4 format as-is, adding metadata
  const condition = {
    ...conditionData,
    resourceType: 'Condition',
    meta: {
      ...get(conditionData, 'meta', {}),
      lastUpdated: new Date(),
      versionId: '1'
    }
  };

  const Conditions = getConditions();
  const conditionId = await Conditions.insertAsync(condition);

  // HIPAA audit log
  context.log.info('Condition created', {
    userId: context.userId,
    conditionId: conditionId,
    timestamp: new Date()
  });

  return conditionId;
});

Meteor.ServerMethods.define('conditions.update', {
  description: 'Update an existing FHIR Condition record by MongoDB _id',
  phi: true,
  positionalParams: ['conditionId', 'conditionData'],
  schemaObject: {
    type: 'object',
    properties: {
      conditionId: { type: 'string' },
      conditionData: { type: 'object' }
    },
    required: ['conditionId', 'conditionData']
  }
}, async function(params, context){
  const { conditionId, conditionData } = params;

  const Conditions = getConditions();

  const existingCondition = await Conditions.findOneAsync({ _id: conditionId });
  if (!existingCondition) {
    throw new Meteor.Error('not-found', 'Condition not found');
  }

  // Update metadata, keep FHIR R4 format as-is
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

  const result = await Conditions.updateAsync(
    { _id: conditionId },
    { $set: updatedCondition }
  );

  // HIPAA audit log
  context.log.info('Condition updated', {
    userId: context.userId,
    conditionId: conditionId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('conditions.remove', {
  description: 'Remove a FHIR Condition record by MongoDB _id',
  phi: true,
  positionalParams: ['conditionId'],
  schemaObject: {
    type: 'object',
    properties: { conditionId: { type: 'string' } },
    required: ['conditionId']
  }
}, async function(params, context){
  const conditionId = params.conditionId;

  const Conditions = getConditions();

  const existingCondition = await Conditions.findOneAsync({ _id: conditionId });
  if (!existingCondition) {
    throw new Meteor.Error('not-found', 'Condition not found');
  }

  const result = await Conditions.removeAsync({ _id: conditionId });

  // HIPAA audit log
  context.log.info('Condition removed', {
    userId: context.userId,
    conditionId: conditionId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('conditions.get', {
  description: 'Fetch a single FHIR Condition record by id',
  phi: true,
  positionalParams: ['conditionId'],
  schemaObject: {
    type: 'object',
    properties: { conditionId: { type: 'string' } },
    required: ['conditionId']
  }
}, async function(params, context){
  const conditionId = params.conditionId;

  const Conditions = getConditions();

  let condition = await Conditions.findOneAsync({ _id: conditionId });

  if (!condition) {
    condition = await Conditions.findOneAsync(conditionId);
  }

  if (!condition) {
    throw new Meteor.Error('not-found', 'Condition not found');
  }

  return condition;
});
