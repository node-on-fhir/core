// /packages/pacio-core/server/methods/revokeAdvanceDirective.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import moment from 'moment';
import { AdiConstants, isAdiDocument } from '../../lib/constants/AdiConstants';
import { createAdiProvenance } from './adiProvenance';

let FhirUtilities;
Meteor.startup(function(){
  FhirUtilities = Meteor.FhirUtilities;
});

// Advance directives live in the shared DocumentReferences collection,
// distinguished by the ADI profile / directive type codes (see AdiConstants).
function getDirectivesCollection() {
  return Meteor.Collections && Meteor.Collections.DocumentReferences;
}

Meteor.ServerMethods.define('pacio.revokeAdvanceDirective', {
  description: 'Revoke an advance directive (status entered-in-error) and record provenance',
  phi: true,
  positionalParams: ['directiveId', 'reason'],
  schemaObject: {
    type: 'object',
    properties: { directiveId: { type: 'string' }, reason: { type: 'string' } },
    required: ['directiveId']
  }
}, async function(params, context) {
    const directiveId = params.directiveId;
    const reason = params.reason;

    // Get the directive
    const DocumentReferences = getDirectivesCollection();
    if (!DocumentReferences) {
      throw new Meteor.Error('collection-not-found', 'DocumentReferences collection not found');
    }

    const directive = await DocumentReferences.findOneAsync(directiveId);
    if (!directive) {
      throw new Meteor.Error('not-found', 'Advance Directive not found');
    }

    // Only ADI documents may be revoked through this method
    if (!isAdiDocument(directive)) {
      throw new Meteor.Error('not-an-advance-directive', 'Document is not an advance directive');
    }

    // Check if already revoked
    if (get(directive, 'status') === 'entered-in-error') {
      throw new Meteor.Error('already-revoked', 'This directive has already been revoked');
    }

    // Update local database
    const updateResult = await DocumentReferences.updateAsync(directiveId, {
      $set: {
        status: 'entered-in-error',
        _lastUpdated: new Date(),
        _revokedAt: new Date(),
        _revokedBy: context.userId,
        _revocationReason: reason || 'Revoked by patient/authorized representative'
      }
    });
    
    if (updateResult === 0) {
      throw new Meteor.Error('update-failed', 'Failed to update advance directive');
    }
    
    // Try to update on FHIR server
    try {
      const fhirClient = await FhirUtilities.getFhirClient();
      if (fhirClient) {
        // Update the directive on FHIR server
        directive.status = 'entered-in-error';
        directive.meta = directive.meta || {};
        directive.meta.lastUpdated = moment().toISOString();
        
        // Add revocation note
        if (!directive.note) {
          directive.note = [];
        }
        directive.note.push({
          authorString: 'System',
          time: moment().toISOString(),
          text: `Revoked: ${reason || 'Revoked by patient/authorized representative'}`
        });
        
        await fhirClient.update(directive);
        console.log('Successfully updated directive on FHIR server');
      }
    } catch (error) {
      console.error('Failed to update FHIR server:', error);
      // Don't throw - we've already updated locally
    }
    
    // Record lifecycle provenance (NULLIFY = revoke)
    await createAdiProvenance({
      targetId: directiveId,
      targetDisplay: get(directive, 'description', 'Advance Directive'),
      activity: 'NULLIFY',
      userId: context.userId
    });

    // Log the revocation
    context.log.info('Advance Directive revoked', { directiveId, userId: context.userId });

    return {
      success: true,
      directiveId,
      revokedAt: new Date()
    };
});

Meteor.ServerMethods.define('pacio.createAdvanceDirective', {
  description: 'Create an advance-directive DocumentReference and record provenance',
  phi: true,
  positionalParams: ['directiveData'],
  schemaObject: {
    type: 'object',
    properties: { directiveData: { type: 'object' } },
    required: ['directiveData']
  }
}, async function(params, context) {
    const directiveData = params.directiveData;

    const DocumentReferences = getDirectivesCollection();
    if (!DocumentReferences) {
      throw new Meteor.Error('collection-not-found', 'DocumentReferences collection not found');
    }

    // Validate required fields
    if (!get(directiveData, 'subject.reference')) {
      throw new Meteor.Error('invalid-data', 'Patient reference is required');
    }
    
    if (!get(directiveData, 'type.coding[0].code')) {
      throw new Meteor.Error('invalid-data', 'Directive type is required');
    }
    
    // Set defaults
    const now = moment();
    const directive = {
      resourceType: 'DocumentReference',
      status: 'current',
      docStatus: 'final',
      date: now.toISOString(),
      category: [AdiConstants.category],
      ...directiveData,
      meta: {
        lastUpdated: now.toISOString(),
        profile: [AdiConstants.profiles.ADI_DOCUMENT_REFERENCE]
      },
      identifier: [{
        system: 'urn:honeycomb:advance-directives',
        value: `AD-${Date.now()}`
      }],
      author: directiveData.author || [{
        reference: `Practitioner/${context.userId}`,
        display: 'Current User'
      }]
    };
    
    // Insert into local database
    const directiveId = await DocumentReferences.insertAsync(directive);

    // Try to create on FHIR server
    try {
      const fhirClient = await FhirUtilities.getFhirClient();
      if (fhirClient) {
        const result = await fhirClient.create(directive);

        // Update local record with server ID
        if (result && result.id) {
          await DocumentReferences.updateAsync(directiveId, {
            $set: { id: result.id }
          });
        }
      }
    } catch (error) {
      console.error('Failed to create on FHIR server:', error);
    }

    // Record lifecycle provenance
    await createAdiProvenance({
      targetId: directiveId,
      targetDisplay: get(directive, 'description', 'Advance Directive'),
      activity: 'CREATE',
      userId: context.userId
    });

    return {
      success: true,
      directiveId
    };
});

Meteor.ServerMethods.define('pacio.updateAdvanceDirective', {
  description: 'Update an advance-directive DocumentReference and record provenance',
  phi: true,
  positionalParams: ['directiveId', 'updates'],
  schemaObject: {
    type: 'object',
    properties: { directiveId: { type: 'string' }, updates: { type: 'object' } },
    required: ['directiveId', 'updates']
  }
}, async function(params, context) {
    const directiveId = params.directiveId;
    const updates = params.updates;

    const DocumentReferences = getDirectivesCollection();
    if (!DocumentReferences) {
      throw new Meteor.Error('collection-not-found', 'DocumentReferences collection not found');
    }

    // Get existing directive
    const directive = await DocumentReferences.findOneAsync(directiveId);
    if (!directive) {
      throw new Meteor.Error('not-found', 'Advance Directive not found');
    }

    // Only ADI documents may be updated through this method
    if (!isAdiDocument(directive)) {
      throw new Meteor.Error('not-an-advance-directive', 'Document is not an advance directive');
    }

    // Don't allow updating revoked directives
    if (get(directive, 'status') === 'entered-in-error') {
      throw new Meteor.Error('invalid-operation', 'Cannot update a revoked directive');
    }
    
    // Apply updates; ensure the ADI profile is present (idempotent union,
    // preserving any other profiles already stamped on the document)
    const existingProfiles = get(directive, 'meta.profile', []);
    const profiles = existingProfiles.includes(AdiConstants.profiles.ADI_DOCUMENT_REFERENCE)
      ? existingProfiles
      : existingProfiles.concat([AdiConstants.profiles.ADI_DOCUMENT_REFERENCE]);

    const updatedDirective = {
      ...directive,
      ...updates,
      meta: {
        ...directive.meta,
        profile: profiles,
        lastUpdated: moment().toISOString()
      }
    };
    
    // Update local database
    await DocumentReferences.updateAsync(directiveId, {
      $set: updatedDirective
    });
    
    // Try to update on FHIR server
    try {
      const fhirClient = await FhirUtilities.getFhirClient();
      if (fhirClient && directive.id) {
        await fhirClient.update(updatedDirective);
      }
    } catch (error) {
      console.error('Failed to update on FHIR server:', error);
    }

    // Record lifecycle provenance
    await createAdiProvenance({
      targetId: directiveId,
      targetDisplay: get(directive, 'description', 'Advance Directive'),
      activity: 'UPDATE',
      userId: context.userId
    });

    return {
      success: true,
      directiveId
    };
});

Meteor.ServerMethods.define('pacio.uploadAdvanceDirectiveDocument', {
  description: 'Attach an uploaded PDF (Binary) to an advance-directive DocumentReference',
  phi: true,
  positionalParams: ['directiveId', 'fileData'],
  schemaObject: {
    type: 'object',
    properties: {
      directiveId: { type: 'string' },
      fileData: {
        type: 'object',
        properties: {
          contentType: { type: 'string' },
          data: { type: 'string' },
          title: { type: 'string' },
          size: { type: 'number' }
        },
        required: ['contentType', 'data', 'title', 'size']
      }
    },
    required: ['directiveId', 'fileData']
  }
}, async function(params, context) {
    const directiveId = params.directiveId;
    const fileData = params.fileData;

    const DocumentReferences = getDirectivesCollection();
    if (!DocumentReferences) {
      throw new Meteor.Error('collection-not-found', 'DocumentReferences collection not found');
    }

    // Validate file
    if (fileData.contentType !== 'application/pdf') {
      throw new Meteor.Error('invalid-file', 'Only PDF files are allowed');
    }
    
    if (fileData.size > 10 * 1024 * 1024) { // 10MB
      throw new Meteor.Error('file-too-large', 'File size must be less than 10MB');
    }
    
    // Get directive
    const directive = await DocumentReferences.findOneAsync(directiveId);
    if (!directive) {
      throw new Meteor.Error('not-found', 'Advance Directive not found');
    }
    
    // Create Binary resource for the PDF
    const binary = {
      resourceType: 'Binary',
      contentType: fileData.contentType,
      data: fileData.data
    };
    
    let binaryId = null;
    
    try {
      const fhirClient = await FhirUtilities.getFhirClient();
      if (fhirClient) {
        const result = await fhirClient.create(binary);
        binaryId = result.id;
      }
    } catch (error) {
      console.error('Failed to upload binary to FHIR server:', error);
      throw new Meteor.Error('upload-failed', 'Failed to upload document');
    }
    
    // Update directive with attachment
    const attachment = {
      contentType: fileData.contentType,
      url: binaryId ? `Binary/${binaryId}` : null,
      size: fileData.size,
      title: fileData.title,
      creation: moment().toISOString()
    };
    
    if (!directive.content) {
      directive.content = [];
    }
    
    directive.content.push({ attachment });
    
    // Update directive
    await DocumentReferences.updateAsync(directiveId, {
      $set: {
        content: directive.content,
        'meta.lastUpdated': moment().toISOString()
      }
    });

    // Record lifecycle provenance (document content revised)
    await createAdiProvenance({
      targetId: directiveId,
      targetDisplay: get(directive, 'description', fileData.title),
      activity: 'UPDATE',
      userId: context.userId
    });

    return {
      success: true,
      binaryId,
      attachment
    };
});