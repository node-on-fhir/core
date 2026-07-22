// /imports/api/specimens/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/Specimens';

// Get the correct Specimens collection reference
function getSpecimens() {
  if (Meteor.isServer) {
    return Meteor.Collections?.Specimens || global.Specimens;
  } else {
    return Meteor.Collections?.Specimens;
  }
}

Meteor.ServerMethods.define('specimens.create', {
  description: 'Create a new FHIR Specimen resource with version metadata',
  phi: true,
  schemaObject: { type: 'object' }   // the Specimen resource payload itself
}, async function(params, context) {
  const specimenData = params;

  context.log.debug('specimens.create called');

  const cleanSpecimen = {
    ...specimenData,
    resourceType: 'Specimen',
    meta: {
      ...get(specimenData, 'meta', {}),
      lastUpdated: new Date(),
      versionId: '1'
    }
  };

  try {
    const Specimens = getSpecimens();
    const specimenId = await Specimens.insertAsync(cleanSpecimen);

    // Log for HIPAA compliance
    context.log.info('Specimen created', {
      userId: context.userId,
      specimenId: specimenId,
      timestamp: new Date()
    });

    return specimenId;
  } catch (error) {
    context.log.error('specimens.create error', { error: error.message });
    throw error;
  }
});

Meteor.ServerMethods.define('specimens.update', {
  description: 'Update an existing FHIR Specimen resource and increment its version',
  phi: true,
  positionalParams: ['specimenId', 'specimenData'],
  schemaObject: {
    type: 'object',
    properties: {
      specimenId: { type: 'string' },
      specimenData: { type: 'object' }
    },
    required: ['specimenId', 'specimenData']
  }
}, async function(params, context) {
  const specimenId = params.specimenId;
  const specimenData = params.specimenData;

  const Specimens = getSpecimens();

  const existingSpecimen = await Specimens.findOneAsync({ _id: specimenId });
  if (!existingSpecimen) {
    throw new Meteor.Error('not-found', 'Specimen not found');
  }

  const updatedSpecimen = {
    ...specimenData,
    _id: specimenId,
    resourceType: 'Specimen',
    meta: {
      ...get(specimenData, 'meta', {}),
      lastUpdated: new Date(),
      versionId: String(parseInt(get(existingSpecimen, 'meta.versionId', '0')) + 1)
    }
  };

  const result = await Specimens.updateAsync(
    { _id: specimenId },
    { $set: updatedSpecimen }
  );

  // Log for HIPAA compliance
  context.log.info('Specimen updated', {
    userId: context.userId,
    specimenId: specimenId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('specimens.remove', {
  description: 'Delete a FHIR Specimen resource by its MongoDB _id',
  phi: true,
  positionalParams: ['specimenId'],
  schemaObject: {
    type: 'object',
    properties: { specimenId: { type: 'string' } },
    required: ['specimenId']
  }
}, async function(params, context) {
  const specimenId = params.specimenId;

  const Specimens = getSpecimens();

  const existingSpecimen = await Specimens.findOneAsync({ _id: specimenId });
  if (!existingSpecimen) {
    throw new Meteor.Error('not-found', 'Specimen not found');
  }

  const result = await Specimens.removeAsync({ _id: specimenId });

  // Log for HIPAA compliance
  context.log.info('Specimen removed', {
    userId: context.userId,
    specimenId: specimenId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('specimens.get', {
  description: 'Fetch a single FHIR Specimen resource by its MongoDB _id',
  phi: true,
  positionalParams: ['specimenId'],
  schemaObject: {
    type: 'object',
    properties: { specimenId: { type: 'string' } },
    required: ['specimenId']
  }
}, async function(params) {
  const specimenId = params.specimenId;

  const Specimens = getSpecimens();

  let specimen = await Specimens.findOneAsync({ _id: specimenId });

  if (!specimen) {
    specimen = await Specimens.findOneAsync(specimenId);
  }

  if (!specimen) {
    throw new Meteor.Error('not-found', 'Specimen not found');
  }

  return specimen;
});
