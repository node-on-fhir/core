// /imports/api/medicationRequests/methods.js

import { Meteor } from 'meteor/meteor';

import { MedicationRequests } from '/imports/lib/schemas/SimpleSchemas/MedicationRequests';

// Pre-migration this method had NO auth guard (latent bug — it returns
// patient-scoped medication orders). requireAuth now applies (default true).
Meteor.ServerMethods.define('medicationRequests.get', {
  description: 'Fetch a single MedicationRequest by its MongoDB _id',
  phi: true,
  positionalParams: ['medicationRequestId'],
  schemaObject: {
    type: 'object',
    properties: { medicationRequestId: { type: 'string' } },
    required: ['medicationRequestId']
  }
}, async function(params, context){
  try {
    const result = await MedicationRequests.findOneAsync({ _id: params.medicationRequestId });
    context.log.info('Found medication request', { _id: params.medicationRequestId });
    return result;
  } catch (error) {
    context.log.error('Error getting medication request', { message: error.message });
    throw new Meteor.Error('get-failed', error.message);
  }
});

Meteor.ServerMethods.define('medicationRequests.create', {
  description: 'Create a new MedicationRequest resource',
  phi: true,
  schemaObject: { type: 'object' }   // params IS the MedicationRequest resource
}, async function(params, context){
  const medicationRequest = { ...params };

  // Add metadata
  medicationRequest.meta = {
    lastUpdated: new Date()
  };

  // Ensure resourceType is set
  medicationRequest.resourceType = 'MedicationRequest';

  try {
    const result = await MedicationRequests.insertAsync(medicationRequest);
    context.log.info('Created medication request', { _id: result });
    return result;
  } catch (error) {
    context.log.error('Error creating medication request', { message: error.message });
    throw new Meteor.Error('insert-failed', error.message);
  }
});

Meteor.ServerMethods.define('medicationRequests.update', {
  description: 'Apply field updates to an existing MedicationRequest',
  phi: true,
  positionalParams: ['medicationRequestId', 'updates'],
  schemaObject: {
    type: 'object',
    properties: {
      medicationRequestId: { type: 'string' },
      updates: { type: 'object' }
    },
    required: ['medicationRequestId', 'updates']
  }
}, async function(params, context){
  const updates = { ...params.updates };

  // Update metadata
  updates['meta.lastUpdated'] = new Date();

  try {
    const result = await MedicationRequests.updateAsync(
      { _id: params.medicationRequestId },
      { $set: updates }
    );
    context.log.info('Updated medication request', { _id: params.medicationRequestId });
    return result;
  } catch (error) {
    context.log.error('Error updating medication request', { message: error.message });
    throw new Meteor.Error('update-failed', error.message);
  }
});

Meteor.ServerMethods.define('medicationRequests.remove', {
  description: 'Delete a MedicationRequest by its MongoDB _id',
  phi: true,
  positionalParams: ['medicationRequestId'],
  schemaObject: {
    type: 'object',
    properties: { medicationRequestId: { type: 'string' } },
    required: ['medicationRequestId']
  }
}, async function(params, context){
  try {
    const result = await MedicationRequests.removeAsync({ _id: params.medicationRequestId });
    context.log.info('Removed medication request', { _id: params.medicationRequestId });
    return result;
  } catch (error) {
    context.log.error('Error removing medication request', { message: error.message });
    throw new Meteor.Error('remove-failed', error.message);
  }
});
