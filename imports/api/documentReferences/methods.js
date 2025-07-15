import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { DocumentReferences } from '../../lib/schemas/SimpleSchemas/DocumentReferences';

Meteor.methods({
  'documentReferences.insert': async function(documentReference) {
    check(documentReference, Object);
    
    // Security check
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to upload documents');
    }

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
        reference: `Practitioner/${this.userId}`,
        display: 'Current User' // In production, look up actual user name
      }];
    }

    // Set created date if not present
    if (!documentReference.date) {
      documentReference.date = new Date().toISOString();
    }

    try {
      const result = await DocumentReferences.insertAsync(documentReference);
      console.log('DocumentReference created:', result);
      return result;
    } catch (error) {
      console.error('Error inserting DocumentReference:', error);
      throw new Meteor.Error('insert-failed', 'Failed to save document: ' + error.message);
    }
  },

  'documentReferences.remove': async function(documentReferenceId) {
    check(documentReferenceId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to delete documents');
    }

    const documentReference = await DocumentReferences.findOneAsync(documentReferenceId);
    
    if (!documentReference) {
      throw new Meteor.Error('not-found', 'Document not found');
    }

    // Additional authorization check could go here
    // For example, check if user is the author

    try {
      return await DocumentReferences.removeAsync(documentReferenceId);
    } catch (error) {
      console.error('Error removing DocumentReference:', error);
      throw new Meteor.Error('remove-failed', 'Failed to delete document: ' + error.message);
    }
  },

  'documentReferences.updateStatus': async function(documentReferenceId, newStatus) {
    check(documentReferenceId, String);
    check(newStatus, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update documents');
    }

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
      console.error('Error updating DocumentReference status:', error);
      throw new Meteor.Error('update-failed', 'Failed to update document status: ' + error.message);
    }
  }
});