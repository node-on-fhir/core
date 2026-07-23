// imports/api/compositions/methods.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Compositions } from '../../lib/schemas/SimpleSchemas/Compositions';

Meteor.ServerMethods.define('compositions.insert', {
  description: 'Create a new Composition document for a patient',
  aliases: ['Compositions.insert'],
  phi: true,
  schemaObject: { type: 'object' }   // arbitrary FHIR Composition shape
}, async function(params, context){
  const composition = params;

  // Validate required fields
  if (!composition.type) {
    throw new Meteor.Error('invalid-composition', 'Composition type is required');
  }

  if (!composition.status) {
    throw new Meteor.Error('invalid-composition', 'Composition status is required');
  }

  if (!composition.subject) {
    throw new Meteor.Error('invalid-composition', 'Composition subject is required');
  }

  // Add server-side metadata
  composition.id = composition.id || Random.id();
  composition.meta = {
    ...(composition.meta || {}),
    versionId: '1',
    lastUpdated: new Date()
  };

  // Add author if not present
  if (!composition.author || composition.author.length === 0) {
    const currentUser = await Meteor.users.findOneAsync({ _id: context.userId });
    composition.author = [{
      reference: `Practitioner/${context.userId}`,
      display: currentUser?.username || 'Current User'
    }];
  }

  // Set date if not present
  if (!composition.date) {
    composition.date = new Date().toISOString();
  }

  try {
    const result = await Compositions.insertAsync(composition);
    context.log.info('Composition created', { _id: result });
    return result;
  } catch (error) {
    context.log.error('Error inserting Composition', { message: error.message });
    throw new Meteor.Error('insert-failed', 'Failed to save composition: ' + error.message);
  }
});

Meteor.ServerMethods.define('compositions.update', {
  description: 'Update Composition documents matching a selector with a Mongo modifier',
  aliases: ['Compositions.update'],
  phi: true,
  positionalParams: ['selector', 'modifier'],
  schemaObject: {
    type: 'object',
    properties: {
      selector: { type: 'object' },
      modifier: { type: 'object' }
    },
    required: ['selector', 'modifier']
  }
}, async function(params, context){
  const selector = params.selector;
  const modifier = params.modifier;

  // Update metadata
  if (!modifier.$set) {
    modifier.$set = {};
  }
  modifier.$set['meta.lastUpdated'] = new Date();
  modifier.$set['meta.versionId'] = String(parseInt(modifier.$set['meta.versionId'] || '1') + 1);

  try {
    const result = await Compositions.updateAsync(selector, modifier);
    context.log.info('Composition updated', { result: result });
    return result;
  } catch (error) {
    context.log.error('Error updating Composition', { message: error.message });
    throw new Meteor.Error('update-failed', 'Failed to update composition: ' + error.message);
  }
});

Meteor.ServerMethods.define('compositions.remove', {
  description: 'Delete a Composition document by id',
  aliases: ['Compositions.remove'],
  phi: true,
  positionalParams: ['compositionId'],
  schemaObject: {
    type: 'object',
    properties: {
      compositionId: { type: 'string' }
    },
    required: ['compositionId']
  }
}, async function(params, context){
  const compositionId = params.compositionId;

  const composition = await Compositions.findOneAsync(compositionId);

  if (!composition) {
    throw new Meteor.Error('not-found', 'Composition not found');
  }

  // Additional authorization check could go here
  // For example, check if user is the author

  try {
    return await Compositions.removeAsync(compositionId);
  } catch (error) {
    context.log.error('Error removing Composition', { message: error.message });
    throw new Meteor.Error('remove-failed', 'Failed to delete composition: ' + error.message);
  }
});

Meteor.ServerMethods.define('compositions.updateStatus', {
  description: 'Set the workflow status of a Composition document',
  aliases: ['Compositions.updateStatus'],
  phi: true,
  positionalParams: ['compositionId', 'newStatus'],
  schemaObject: {
    type: 'object',
    properties: {
      compositionId: { type: 'string' },
      newStatus: { type: 'string' }
    },
    required: ['compositionId', 'newStatus']
  }
}, async function(params, context){
  const compositionId = params.compositionId;
  const newStatus = params.newStatus;

  const validStatuses = ['preliminary', 'final', 'amended', 'entered-in-error'];
  if (!validStatuses.includes(newStatus)) {
    throw new Meteor.Error('invalid-status', 'Invalid status. Must be one of: ' + validStatuses.join(', '));
  }

  try {
    return await Compositions.updateAsync(compositionId, {
      $set: {
        status: newStatus,
        'meta.lastUpdated': new Date()
      }
    });
  } catch (error) {
    context.log.error('Error updating Composition status', { message: error.message });
    throw new Meteor.Error('update-failed', 'Failed to update composition status: ' + error.message);
  }
});

Meteor.ServerMethods.define('compositions.finalizeDocument', {
  description: 'Finalize a Composition document and attest it as the calling practitioner',
  aliases: ['Compositions.finalizeDocument'],
  phi: true,
  positionalParams: ['compositionId'],
  schemaObject: {
    type: 'object',
    properties: {
      compositionId: { type: 'string' }
    },
    required: ['compositionId']
  }
}, async function(params, context){
  const compositionId = params.compositionId;

  const composition = await Compositions.findOneAsync(compositionId);

  if (!composition) {
    throw new Meteor.Error('not-found', 'Composition not found');
  }

  if (composition.status === 'final') {
    throw new Meteor.Error('already-final', 'Composition is already finalized');
  }

  try {
    const currentUser = await Meteor.users.findOneAsync({ _id: context.userId });
    return await Compositions.updateAsync(compositionId, {
      $set: {
        status: 'final',
        'meta.lastUpdated': new Date(),
        'attester': [{
          mode: 'professional',
          time: new Date().toISOString(),
          party: {
            reference: `Practitioner/${context.userId}`,
            display: currentUser?.username || 'Current User'
          }
        }]
      }
    });
  } catch (error) {
    context.log.error('Error finalizing Composition', { message: error.message });
    throw new Meteor.Error('finalize-failed', 'Failed to finalize composition: ' + error.message);
  }
});
