// imports/api/bodyStructures/methods.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';

import { BodyStructures } from '/imports/lib/schemas/SimpleSchemas/BodyStructures';

Meteor.ServerMethods.define('bodyStructures.insert', {
  description: 'Create a new BodyStructure resource for a patient',
  phi: true,
  schemaObject: { type: 'object' }   // arbitrary FHIR BodyStructure shape
}, async function(params, context){
  const bodyStructureData = params;

  context.log.info('Creating body structure...');

  const cleanBodyStructure = {
    resourceType: 'BodyStructure',
    id: Random.id(),
    active: get(bodyStructureData, 'active', true),
    description: get(bodyStructureData, 'description', ''),
    patient: get(bodyStructureData, 'patient', {}),
    morphology: {},
    includedStructure: []
  };

  // Set _id to match id
  cleanBodyStructure._id = cleanBodyStructure.id;

  // Handle morphology (CodeableConcept)
  if (bodyStructureData.morphology) {
    if (typeof bodyStructureData.morphology === 'string') {
      cleanBodyStructure.morphology = {
        coding: [{
          system: 'http://snomed.info/sct',
          code: bodyStructureData.morphologyCode || '',
          display: bodyStructureData.morphology
        }],
        text: bodyStructureData.morphology
      };
    } else {
      cleanBodyStructure.morphology = bodyStructureData.morphology;
    }
  }

  // Handle includedStructure
  if (bodyStructureData.structure) {
    cleanBodyStructure.includedStructure = [{
      structure: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: bodyStructureData.structureCode || '',
          display: bodyStructureData.structure
        }],
        text: bodyStructureData.structure
      }
    }];
  } else if (bodyStructureData.includedStructure) {
    cleanBodyStructure.includedStructure = bodyStructureData.includedStructure;
  }

  // Handle patient reference
  if (bodyStructureData.patient) {
    if (typeof bodyStructureData.patient === 'string') {
      cleanBodyStructure.patient = {
        reference: 'Patient/' + bodyStructureData.patient,
        display: get(bodyStructureData, 'patientDisplay', '')
      };
    } else {
      cleanBodyStructure.patient = bodyStructureData.patient;
    }
  }

  // Handle image (Attachment)
  if (bodyStructureData.image) {
    cleanBodyStructure.image = bodyStructureData.image;
  }

  context.log.info('Inserting body structure', { _id: cleanBodyStructure._id });

  const result = await BodyStructures.insertAsync(cleanBodyStructure);
  return result;
});

Meteor.ServerMethods.define('bodyStructures.update', {
  description: 'Update an existing BodyStructure resource by id',
  phi: true,
  positionalParams: ['bodyStructureId', 'bodyStructureData'],
  schemaObject: {
    type: 'object',
    properties: {
      bodyStructureId: { type: 'string' },
      bodyStructureData: { type: 'object' }
    },
    required: ['bodyStructureId', 'bodyStructureData']
  }
}, async function(params, context){
  const bodyStructureId = params.bodyStructureId;
  const bodyStructureData = params.bodyStructureData;

  context.log.info('Updating body structure', { bodyStructureId: bodyStructureId });

  const existing = await BodyStructures.findOneAsync({ _id: bodyStructureId });
  if (!existing) {
    throw new Meteor.Error('not-found', 'Body structure not found');
  }

  const updates = {
    active: get(bodyStructureData, 'active', existing.active),
    description: get(bodyStructureData, 'description', existing.description)
  };

  // Handle morphology
  if (bodyStructureData.morphology) {
    if (typeof bodyStructureData.morphology === 'string') {
      updates.morphology = {
        coding: [{
          system: 'http://snomed.info/sct',
          code: bodyStructureData.morphologyCode || '',
          display: bodyStructureData.morphology
        }],
        text: bodyStructureData.morphology
      };
    } else {
      updates.morphology = bodyStructureData.morphology;
    }
  }

  // Handle includedStructure
  if (bodyStructureData.structure) {
    updates.includedStructure = [{
      structure: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: bodyStructureData.structureCode || '',
          display: bodyStructureData.structure
        }],
        text: bodyStructureData.structure
      }
    }];
  } else if (bodyStructureData.includedStructure) {
    updates.includedStructure = bodyStructureData.includedStructure;
  }

  // Handle patient
  if (bodyStructureData.patient) {
    if (typeof bodyStructureData.patient === 'string') {
      updates.patient = {
        reference: 'Patient/' + bodyStructureData.patient,
        display: get(bodyStructureData, 'patientDisplay', '')
      };
    } else {
      updates.patient = bodyStructureData.patient;
    }
  }

  // Handle image
  if (bodyStructureData.image) {
    updates.image = bodyStructureData.image;
  }

  const result = await BodyStructures.updateAsync(
    { _id: bodyStructureId },
    { $set: updates }
  );

  context.log.info('Updated body structure', { bodyStructureId: bodyStructureId });
  return result;
});

Meteor.ServerMethods.define('bodyStructures.remove', {
  description: 'Delete a BodyStructure resource by id',
  phi: true,
  positionalParams: ['bodyStructureId'],
  schemaObject: {
    type: 'object',
    properties: {
      bodyStructureId: { type: 'string' }
    },
    required: ['bodyStructureId']
  }
}, async function(params, context){
  context.log.info('Removing body structure', { bodyStructureId: params.bodyStructureId });

  const result = await BodyStructures.removeAsync({ _id: params.bodyStructureId });
  return result;
});

Meteor.ServerMethods.define('bodyStructures.findOne', {
  description: 'Fetch a single BodyStructure resource by id',
  phi: true,
  positionalParams: ['bodyStructureId'],
  schemaObject: {
    type: 'object',
    properties: {
      bodyStructureId: { type: 'string' }
    },
    required: ['bodyStructureId']
  }
  // Pre-migration this method had NO auth guard (latent bug — it reads
  // patient-scoped data). requireAuth now applies (default true).
}, async function(params){
  const bodyStructure = await BodyStructures.findOneAsync({ _id: params.bodyStructureId });
  return bodyStructure;
});
