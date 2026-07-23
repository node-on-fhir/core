// /imports/api/observations/methods.js
//
// AUTH NOTE (rpc migration): pre-migration NONE of these methods had a
// this.userId guard (latent bug — they read/write patient-scoped clinical
// data). requireAuth now applies to all four (the default, true).

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';

import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';

Meteor.ServerMethods.define('observations.create', {
  description: 'Create a new Observation resource for a patient',
  phi: true,
  schemaObject: { type: 'object' }   // params IS the Observation resource
}, async function(params, context){
  context.log.info('observations.create called', { userId: context.userId });

  // Generate FHIR id if not provided
  const fhirId = params.id || Random.id();

  // Add metadata
  const observation = {
    ...params,
    id: fhirId,
    resourceType: 'Observation',
    meta: {
      ...get(params, 'meta', {}),
      lastUpdated: new Date(),
      versionId: '1'
    }
  };

  // Insert and return the new observation
  const observationId = await Observations._collection.insertAsync(observation);
  context.log.info('Successfully inserted observation', { _id: observationId });

  // Log for HIPAA compliance
  context.log.info('Observation created', {
    userId: context.userId,
    observationId: observationId,
    fhirId: fhirId,
    timestamp: new Date()
  });

  return observationId;
});

Meteor.ServerMethods.define('observations.update', {
  description: 'Replace fields of an existing Observation resource',
  phi: true,
  positionalParams: ['observationId', 'observationData'],
  schemaObject: {
    type: 'object',
    properties: {
      observationId: { type: 'string' },
      observationData: { type: 'object' }
    },
    required: ['observationId', 'observationData']
  }
}, async function(params, context){
  const observationId = params.observationId;
  const observationData = params.observationData;

  // Check if observation exists - try _id first, then id
  let existingObservation = await Observations.findOneAsync({ _id: observationId });
  if (!existingObservation) {
    existingObservation = await Observations.findOneAsync({ id: observationId });
  }
  if (!existingObservation) {
    throw new Meteor.Error('not-found', 'Observation not found');
  }

  // Update metadata
  const updatedObservation = {
    ...observationData,
    _id: existingObservation._id,  // Use the actual _id from the found observation
    id: existingObservation.id,    // Preserve the FHIR id
    resourceType: 'Observation',
    meta: {
      ...get(observationData, 'meta', {}),
      lastUpdated: new Date(),
      versionId: String(parseInt(get(existingObservation, 'meta.versionId', '0')) + 1)
    }
  };

  // Update the observation using the actual _id
  const result = await Observations._collection.updateAsync(
    { _id: existingObservation._id },
    { $set: updatedObservation }
  );

  // Log for HIPAA compliance
  context.log.info('Observation updated', {
    userId: context.userId,
    observationId: observationId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('observations.remove', {
  description: 'Delete an Observation resource by its MongoDB _id or FHIR id',
  phi: true,
  positionalParams: ['observationId'],
  schemaObject: {
    type: 'object',
    properties: { observationId: { type: 'string' } },
    required: ['observationId']
  }
}, async function(params, context){
  const observationId = params.observationId;

  // Check if observation exists - try _id first, then id
  let existingObservation = await Observations.findOneAsync({ _id: observationId });
  if (!existingObservation) {
    existingObservation = await Observations.findOneAsync({ id: observationId });
  }
  if (!existingObservation) {
    throw new Meteor.Error('not-found', 'Observation not found');
  }

  // Remove the observation using the actual _id
  const result = await Observations._collection.removeAsync({ _id: existingObservation._id });

  // Log for HIPAA compliance
  context.log.info('Observation removed', {
    userId: context.userId,
    observationId: observationId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('observations.get', {
  description: 'Fetch a single Observation by its MongoDB _id or FHIR id',
  phi: true,
  positionalParams: ['observationId'],
  schemaObject: {
    type: 'object',
    properties: { observationId: { type: 'string' } },
    required: ['observationId']
  }
}, async function(params, context){
  const observationId = params.observationId;
  context.log.info('observations.get called', { observationId: observationId });

  // Try to find by _id first, then by id
  let observation = await Observations.findOneAsync({ _id: observationId });

  if (!observation) {
    context.log.info('Not found by _id, trying by FHIR id');
    // Try finding by FHIR id
    observation = await Observations.findOneAsync({ id: observationId });
  }

  if (!observation) {
    context.log.info('Observation not found with _id or id', { observationId: observationId });
    // Let's also log what observations exist to help debug
    const allObservations = await Observations.find({}, { limit: 5 }).fetchAsync();
    context.log.debug('Sample observations in DB', { samples: allObservations.map(o => ({ _id: o._id, id: o.id })) });
    throw new Meteor.Error('not-found', 'Observation not found');
  }

  context.log.info('Found observation', { _id: observation._id, id: observation.id });
  return observation;
});
