// /imports/api/medications/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/Medications';

// Get the correct Medications collection reference
function getMedications() {
  if (Meteor.isServer) {
    // On server, use the global collection set up in server/main.js
    return Meteor.Collections?.Medications || global.Medications;
  } else {
    // On client, use from Meteor.Collections if available
    return Meteor.Collections?.Medications;
  }
}

Meteor.ServerMethods.define('medications.create', {
  description: 'Create a new Medication catalog entry',
  phi: false,
  schemaObject: { type: 'object' }   // params IS the Medication resource
}, async function(params, context){
  // Add metadata
  const medication = {
    ...params,
    resourceType: 'Medication',
    meta: {
      lastUpdated: new Date(),
      versionId: '1'
    }
  };

  // Set _id based on environment variable for consistent sorting with Synthea data
  // This ensures new medications sort properly with existing ObjectID-based records
  if (process.env.USE_MONGO_OBJECTID) {
    const { Mongo } = Package.mongo;
    const objectId = new Mongo.ObjectID();
    // Convert to hex string for Meteor compatibility
    medication._id = objectId.toHexString();
    context.log.info('Using MongoDB ObjectID (as hex string)', { _id: medication._id });
  }
  // Otherwise Meteor will auto-generate a random string ID

  // Insert and return the new medication
  const Medications = getMedications();
  const medicationId = await Medications.insertAsync(medication);

  // Log for HIPAA compliance
  context.log.info('Medication created', {
    userId: context.userId,
    medicationId: medicationId,
    timestamp: new Date()
  });

  return medicationId;
});

Meteor.ServerMethods.define('medications.update', {
  description: 'Replace fields of an existing Medication catalog entry',
  phi: false,
  positionalParams: ['medicationId', 'medicationData'],
  schemaObject: {
    type: 'object',
    properties: {
      medicationId: { type: 'string' },
      medicationData: { type: 'object' }
    },
    required: ['medicationId', 'medicationData']
  }
}, async function(params, context){
  const medicationId = params.medicationId;
  const medicationData = params.medicationData;

  const Medications = getMedications();

  // Check if medication exists
  const existingMedication = await Medications.findOneAsync({ _id: medicationId });
  if (!existingMedication) {
    throw new Meteor.Error('not-found', 'Medication not found');
  }

  // Update metadata
  const updatedMedication = {
    ...medicationData,
    _id: medicationId,
    resourceType: 'Medication',
    meta: {
      ...get(medicationData, 'meta', {}),
      lastUpdated: new Date(),
      versionId: String(parseInt(get(existingMedication, 'meta.versionId', '0')) + 1)
    }
  };

  // Update the medication
  const result = await Medications.updateAsync(
    { _id: medicationId },
    { $set: updatedMedication }
  );

  // Log for HIPAA compliance
  context.log.info('Medication updated', {
    userId: context.userId,
    medicationId: medicationId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('medications.get', {
  description: 'Fetch a single Medication catalog entry by its MongoDB _id',
  phi: false,
  positionalParams: ['medicationId'],
  schemaObject: {
    type: 'object',
    properties: { medicationId: { type: 'string' } },
    required: ['medicationId']
  }
}, async function(params, context){
  const Medications = getMedications();
  const medication = await Medications.findOneAsync({ _id: params.medicationId });

  if (!medication) {
    throw new Meteor.Error('not-found', 'Medication not found');
  }

  // Log access for HIPAA compliance
  context.log.info('Medication accessed', {
    userId: context.userId,
    medicationId: params.medicationId,
    timestamp: new Date()
  });

  return medication;
});

Meteor.ServerMethods.define('medications.remove', {
  description: 'Delete a Medication catalog entry by its MongoDB _id',
  phi: false,
  positionalParams: ['medicationId'],
  schemaObject: {
    type: 'object',
    properties: { medicationId: { type: 'string' } },
    required: ['medicationId']
  }
}, async function(params, context){
  const Medications = getMedications();

  // Check if medication exists
  const existingMedication = await Medications.findOneAsync({ _id: params.medicationId });
  if (!existingMedication) {
    throw new Meteor.Error('not-found', 'Medication not found');
  }

  // Remove the medication
  const result = await Medications.removeAsync({ _id: params.medicationId });

  // Log for HIPAA compliance
  context.log.info('Medication deleted', {
    userId: context.userId,
    medicationId: params.medicationId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('medications.search', {
  description: 'Search Medication catalog entries by name and query options',
  phi: false,
  schemaObject: { type: 'object' }   // params IS the legacy searchOptions object
}, async function(params, context){
  const searchOptions = params || {};

  const Medications = getMedications();
  const { query = {}, options = {} } = searchOptions;

  // Add any necessary query transformations here
  // For example, searching by medication name
  if (searchOptions.name) {
    query['code.text'] = { $regex: searchOptions.name, $options: 'i' };
  }

  // Set default options
  const findOptions = {
    limit: options.limit || 20,
    sort: options.sort || { 'meta.lastUpdated': -1 },
    ...options
  };

  const medications = await Medications.findAsync(query, findOptions).then(cursor => cursor.toArray());

  // Log search for HIPAA compliance
  context.log.info('Medications searched', {
    userId: context.userId,
    query: query,
    resultCount: medications.length,
    timestamp: new Date()
  });

  return medications;
});
