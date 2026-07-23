// /imports/api/medicationAdministrations/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import { MedicationAdministrations } from '/imports/lib/schemas/SimpleSchemas/MedicationAdministrations';

// MedicationAdministration is patient-scoped clinical data — PHI-flagged.

Meteor.ServerMethods.define('medicationAdministrations.create', {
  description: 'Create a FHIR MedicationAdministration resource',
  phi: true,
  schemaObject: { type: 'object' }
}, async function(params, context){
  const medicationAdministration = params;

  context.log.debug('medicationAdministrations.create called', { userId: context.userId, data: medicationAdministration });

  // Add metadata
  medicationAdministration.meta = {
    lastUpdated: new Date()
  };

  // Ensure resourceType is set
  medicationAdministration.resourceType = 'MedicationAdministration';

  // Generate FHIR id if not provided
  if (!medicationAdministration.id) {
    const { Random } = require('meteor/random');
    medicationAdministration.id = Random.id();
    context.log.info('Generated FHIR id', { id: medicationAdministration.id });
  }

  try {
    const result = await MedicationAdministrations.insertAsync(medicationAdministration);
    context.log.info('MedicationAdministration created', {
      userId: context.userId,
      medicationAdministrationId: result,
      fhirId: medicationAdministration.id,
      timestamp: new Date()
    });
    return result;
  } catch (error) {
    context.log.error('Error creating medication administration', { message: error.message, stack: error.stack });
    throw new Meteor.Error('insert-failed', error.message);
  }
});

Meteor.ServerMethods.define('medicationAdministrations.update', {
  description: 'Update an existing FHIR MedicationAdministration resource',
  phi: true,
  positionalParams: ['medicationAdministrationId', 'updates'],
  schemaObject: {
    type: 'object',
    properties: {
      medicationAdministrationId: { type: 'string' },
      updates: { type: 'object' }
    },
    required: ['medicationAdministrationId', 'updates']
  }
}, async function(params, context){
  const medicationAdministrationId = params.medicationAdministrationId;
  const updates = params.updates;

  // Update metadata
  updates['meta.lastUpdated'] = new Date();

  context.log.info('Updating medication administration', { medicationAdministrationId: medicationAdministrationId });
  context.log.debug('Update payload', { updates: updates, performer: get(updates, 'performer[0].actor') });

  try {
    const result = await MedicationAdministrations.updateAsync(
      { _id: medicationAdministrationId },
      { $set: updates }
    );

    // Verify the update
    const updated = await MedicationAdministrations.findOneAsync({ _id: medicationAdministrationId });
    context.log.debug('Updated document', { document: updated, performer: get(updated, 'performer[0].actor') });

    return result;
  } catch (error) {
    context.log.error('Error updating medication administration', { message: error.message });
    throw new Meteor.Error('update-failed', error.message);
  }
});

Meteor.ServerMethods.define('medicationAdministrations.get', {
  description: 'Fetch a single FHIR MedicationAdministration resource by id',
  phi: true,
  // Pre-migration this method had NO auth guard; requireAuth now applies
  // (default true) — behavior change, noted in the migration report.
  positionalParams: ['medicationAdministrationId'],
  schemaObject: {
    type: 'object',
    properties: { medicationAdministrationId: { type: 'string' } },
    required: ['medicationAdministrationId']
  }
}, async function(params, context){
  try {
    const result = await MedicationAdministrations.findOneAsync({ _id: params.medicationAdministrationId });
    if (!result) {
      throw new Meteor.Error('not-found', 'Medication administration not found');
    }
    context.log.debug('Retrieved medication administration', { _id: result._id });
    return result;
  } catch (error) {
    context.log.error('Error getting medication administration', { message: error.message });
    throw new Meteor.Error('get-failed', error.message);
  }
});

Meteor.ServerMethods.define('medicationAdministrations.remove', {
  description: 'Delete a FHIR MedicationAdministration resource by id',
  phi: true,
  positionalParams: ['medicationAdministrationId'],
  schemaObject: {
    type: 'object',
    properties: { medicationAdministrationId: { type: 'string' } },
    required: ['medicationAdministrationId']
  }
}, async function(params, context){
  try {
    const result = await MedicationAdministrations.removeAsync({ _id: params.medicationAdministrationId });
    context.log.info('Removed medication administration', { result: result });
    return result;
  } catch (error) {
    context.log.error('Error removing medication administration', { message: error.message });
    throw new Meteor.Error('remove-failed', error.message);
  }
});

Meteor.ServerMethods.define('medicationAdministrations.count', {
  description: 'Count all MedicationAdministration records'
  // Pre-migration this method had NO auth guard; requireAuth now applies
  // (default true) — behavior change, noted in the migration report.
}, async function(params, context){
  try {
    const count = await MedicationAdministrations.find().countAsync();
    context.log.debug('MedicationAdministrations count', { count: count });
    return count;
  } catch (error) {
    context.log.error('Error counting medication administrations', { message: error.message });
    throw new Meteor.Error('count-failed', error.message);
  }
});

Meteor.ServerMethods.define('medicationAdministrations.findAll', {
  description: 'Fetch all MedicationAdministration records',
  phi: true
  // Pre-migration this method had NO auth guard (latent bug — it returns
  // every patient's medication administrations). requireAuth now applies
  // (default true) — behavior change, noted in the migration report.
}, async function(params, context){
  try {
    const records = await MedicationAdministrations.find({}).fetchAsync();
    context.log.debug('MedicationAdministrations findAll', { count: records.length });
    return records;
  } catch (error) {
    context.log.error('Error finding medication administrations', { message: error.message });
    throw new Meteor.Error('find-failed', error.message);
  }
});
