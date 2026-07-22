// /imports/api/molecularSequences/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/MolecularSequences';

// Get the correct MolecularSequences collection reference
function getMolecularSequences() {
  if (Meteor.isServer) {
    return Meteor.Collections?.MolecularSequences || global.MolecularSequences;
  } else {
    return Meteor.Collections?.MolecularSequences;
  }
}

Meteor.ServerMethods.define('molecularSequences.create', {
  description: 'Create a new MolecularSequence genomic resource',
  phi: true,
  schemaObject: { type: 'object' }   // params IS the MolecularSequence resource
}, async function(params, context){
  context.log.info('molecularSequences.create called');

  const cleanMolecularSequence = {
    ...params,
    resourceType: 'MolecularSequence',
    meta: {
      lastUpdated: new Date(),
      versionId: '1'
    }
  };

  try {
    const MolecularSequences = getMolecularSequences();
    const molecularSequenceId = await MolecularSequences.insertAsync(cleanMolecularSequence);

    // Log for HIPAA compliance
    context.log.info('MolecularSequence created', {
      userId: context.userId,
      molecularSequenceId: molecularSequenceId,
      timestamp: new Date()
    });

    return molecularSequenceId;
  } catch (error) {
    context.log.error('Error creating molecular sequence', { message: error.message });
    throw error;
  }
});

Meteor.ServerMethods.define('molecularSequences.update', {
  description: 'Replace fields of an existing MolecularSequence resource',
  phi: true,
  positionalParams: ['molecularSequenceId', 'molecularSequenceData'],
  schemaObject: {
    type: 'object',
    properties: {
      molecularSequenceId: { type: 'string' },
      molecularSequenceData: { type: 'object' }
    },
    required: ['molecularSequenceId', 'molecularSequenceData']
  }
}, async function(params, context){
  const molecularSequenceId = params.molecularSequenceId;
  const molecularSequenceData = params.molecularSequenceData;

  const MolecularSequences = getMolecularSequences();

  const existingMolecularSequence = await MolecularSequences.findOneAsync({ _id: molecularSequenceId });
  if (!existingMolecularSequence) {
    throw new Meteor.Error('not-found', 'MolecularSequence not found');
  }

  const updatedMolecularSequence = {
    ...molecularSequenceData,
    _id: molecularSequenceId,
    resourceType: 'MolecularSequence',
    meta: {
      ...get(molecularSequenceData, 'meta', {}),
      lastUpdated: new Date(),
      versionId: String(parseInt(get(existingMolecularSequence, 'meta.versionId', '0')) + 1)
    }
  };

  const result = await MolecularSequences.updateAsync(
    { _id: molecularSequenceId },
    { $set: updatedMolecularSequence }
  );

  // Log for HIPAA compliance
  context.log.info('MolecularSequence updated', {
    userId: context.userId,
    molecularSequenceId: molecularSequenceId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('molecularSequences.remove', {
  description: 'Delete a MolecularSequence resource by its MongoDB _id',
  phi: true,
  positionalParams: ['molecularSequenceId'],
  schemaObject: {
    type: 'object',
    properties: { molecularSequenceId: { type: 'string' } },
    required: ['molecularSequenceId']
  }
}, async function(params, context){
  const MolecularSequences = getMolecularSequences();

  const existingMolecularSequence = await MolecularSequences.findOneAsync({ _id: params.molecularSequenceId });
  if (!existingMolecularSequence) {
    throw new Meteor.Error('not-found', 'MolecularSequence not found');
  }

  const result = await MolecularSequences.removeAsync({ _id: params.molecularSequenceId });

  // Log for HIPAA compliance
  context.log.info('MolecularSequence removed', {
    userId: context.userId,
    molecularSequenceId: params.molecularSequenceId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('molecularSequences.get', {
  description: 'Fetch a single MolecularSequence by its MongoDB _id',
  phi: true,
  positionalParams: ['molecularSequenceId'],
  schemaObject: {
    type: 'object',
    properties: { molecularSequenceId: { type: 'string' } },
    required: ['molecularSequenceId']
  }
}, async function(params, context){
  const MolecularSequences = getMolecularSequences();

  let molecularSequence = await MolecularSequences.findOneAsync({ _id: params.molecularSequenceId });

  if (!molecularSequence) {
    molecularSequence = await MolecularSequences.findOneAsync(params.molecularSequenceId);
  }

  if (!molecularSequence) {
    throw new Meteor.Error('not-found', 'MolecularSequence not found');
  }

  return molecularSequence;
});
