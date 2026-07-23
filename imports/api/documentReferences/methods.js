import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { DocumentReferences } from '../../lib/schemas/SimpleSchemas/DocumentReferences';

Meteor.ServerMethods.define('documentReferences.insert', {
  description: 'Create a FHIR DocumentReference record for an uploaded document',
  phi: true,
  schemaObject: { type: 'object' }
}, async function(params, context){
  const documentReference = params;

  // Validate required fields
  if (!documentReference.type) {
    throw new Meteor.Error('invalid-document', 'Document type is required');
  }

  if (!documentReference.content || !documentReference.content[0] || !documentReference.content[0].attachment) {
    throw new Meteor.Error('invalid-document', 'Document content is required');
  }

  // Add server-side metadata
  documentReference.id = documentReference.id || Random.id();
  documentReference.meta = {
    versionId: '1',
    lastUpdated: new Date()
  };

  // Add author if not present
  if (!documentReference.author) {
    documentReference.author = [{
      reference: `Practitioner/${context.userId}`,
      display: 'Current User' // In production, look up actual user name
    }];
  }

  // Set created date if not present
  if (!documentReference.date) {
    documentReference.date = new Date().toISOString();
  }

  try {
    const result = await DocumentReferences.insertAsync(documentReference);
    context.log.info('DocumentReference created', { documentReferenceId: result });
    return result;
  } catch (error) {
    context.log.error('Error inserting DocumentReference', { message: error.message });
    throw new Meteor.Error('insert-failed', 'Failed to save document: ' + error.message);
  }
});

Meteor.ServerMethods.define('documentReferences.remove', {
  description: 'Remove a FHIR DocumentReference record by MongoDB _id',
  phi: true,
  positionalParams: ['documentReferenceId'],
  schemaObject: {
    type: 'object',
    properties: { documentReferenceId: { type: 'string' } },
    required: ['documentReferenceId']
  }
}, async function(params, context){
  const documentReferenceId = params.documentReferenceId;

  const documentReference = await DocumentReferences.findOneAsync({_id: documentReferenceId});

  if (!documentReference) {
    throw new Meteor.Error('not-found', 'Document not found');
  }

  // Additional authorization check could go here
  // For example, check if user is the author

  try {
    return await DocumentReferences.removeAsync({_id: documentReferenceId});
  } catch (error) {
    context.log.error('Error removing DocumentReference', { message: error.message });
    throw new Meteor.Error('remove-failed', 'Failed to delete document: ' + error.message);
  }
});

Meteor.ServerMethods.define('documentReferences.update', {
  description: 'Update an existing FHIR DocumentReference record by MongoDB _id',
  phi: true,
  positionalParams: ['documentReferenceId', 'updateData'],
  schemaObject: {
    type: 'object',
    properties: {
      documentReferenceId: { type: 'string' },
      updateData: { type: 'object' }
    },
    required: ['documentReferenceId', 'updateData']
  }
}, async function(params, context){
  const { documentReferenceId, updateData } = params;

  const documentReference = await DocumentReferences.findOneAsync({_id: documentReferenceId});

  if (!documentReference) {
    throw new Meteor.Error('not-found', 'Document not found');
  }

  // Additional authorization check could go here
  // For example, check if user is the author

  // Update metadata
  updateData.meta = updateData.meta || {};
  updateData.meta.lastUpdated = new Date();
  updateData.meta.versionId = String(parseInt(updateData.meta.versionId || '1') + 1);

  try {
    return await DocumentReferences.updateAsync({_id: documentReferenceId}, { $set: updateData });
  } catch (error) {
    context.log.error('Error updating DocumentReference', { message: error.message });
    throw new Meteor.Error('update-failed', 'Failed to update document: ' + error.message);
  }
});

Meteor.ServerMethods.define('documentReferences.updateStatus', {
  description: 'Update the status field of a FHIR DocumentReference record',
  phi: true,
  positionalParams: ['documentReferenceId', 'newStatus'],
  schemaObject: {
    type: 'object',
    properties: {
      documentReferenceId: { type: 'string' },
      newStatus: { type: 'string' }
    },
    required: ['documentReferenceId', 'newStatus']
  }
}, async function(params, context){
  const { documentReferenceId, newStatus } = params;

  const validStatuses = ['current', 'superseded', 'entered-in-error'];
  if (!validStatuses.includes(newStatus)) {
    throw new Meteor.Error('invalid-status', 'Invalid status. Must be one of: ' + validStatuses.join(', '));
  }

  try {
    return await DocumentReferences.updateAsync(documentReferenceId, {
      $set: {
        status: newStatus,
        'meta.lastUpdated': new Date()
      }
    });
  } catch (error) {
    context.log.error('Error updating DocumentReference status', { message: error.message });
    throw new Meteor.Error('update-failed', 'Failed to update document status: ' + error.message);
  }
});
