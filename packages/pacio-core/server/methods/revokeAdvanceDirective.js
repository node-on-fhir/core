// /packages/pacio-core/server/methods/revokeAdvanceDirective.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import moment from 'moment';

let FhirUtilities;
Meteor.startup(function(){
  FhirUtilities = Meteor.FhirUtilities;
});

Meteor.methods({
  'pacio.revokeAdvanceDirective': async function(directiveId, reason) {
    check(directiveId, String);
    check(reason, Match.Maybe(String));
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    // Get the directive
    const AdvanceDirectives = Meteor.Collections && Meteor.Collections.AdvanceDirectives;
    if (!AdvanceDirectives) {
      throw new Meteor.Error('collection-not-found', 'AdvanceDirectives collection not found');
    }
    
    const directive = await AdvanceDirectives.findOneAsync(directiveId);
    if (!directive) {
      throw new Meteor.Error('not-found', 'Advance Directive not found');
    }
    
    // Check if already revoked
    if (get(directive, 'status') === 'entered-in-error') {
      throw new Meteor.Error('already-revoked', 'This directive has already been revoked');
    }
    
    // Update local database
    const updateResult = await AdvanceDirectives.updateAsync(directiveId, {
      $set: {
        status: 'entered-in-error',
        _lastUpdated: new Date(),
        _revokedAt: new Date(),
        _revokedBy: this.userId,
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
    
    // Log the revocation
    console.log(`Advance Directive ${directiveId} revoked by user ${this.userId}`);
    
    return {
      success: true,
      directiveId,
      revokedAt: new Date()
    };
  },
  
  'pacio.createAdvanceDirective': async function(directiveData) {
    check(directiveData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    const AdvanceDirectives = Meteor.Collections && Meteor.Collections.AdvanceDirectives;
    if (!AdvanceDirectives) {
      throw new Meteor.Error('collection-not-found', 'AdvanceDirectives collection not found');
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
      ...directiveData,
      meta: {
        lastUpdated: now.toISOString(),
        profile: ['http://hl7.org/fhir/StructureDefinition/DocumentReference']
      },
      identifier: [{
        system: 'urn:honeycomb:advance-directives',
        value: `AD-${Date.now()}`
      }],
      author: directiveData.author || [{
        reference: `Practitioner/${this.userId}`,
        display: 'Current User'
      }]
    };
    
    // Insert into local database
    const directiveId = await AdvanceDirectives.insertAsync(directive);
    
    // Try to create on FHIR server
    try {
      const fhirClient = await FhirUtilities.getFhirClient();
      if (fhirClient) {
        const result = await fhirClient.create(directive);
        
        // Update local record with server ID
        if (result && result.id) {
          await AdvanceDirectives.updateAsync(directiveId, {
            $set: { id: result.id }
          });
        }
      }
    } catch (error) {
      console.error('Failed to create on FHIR server:', error);
    }
    
    return {
      success: true,
      directiveId
    };
  },
  
  'pacio.updateAdvanceDirective': async function(directiveId, updates) {
    check(directiveId, String);
    check(updates, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    const AdvanceDirectives = Meteor.Collections && Meteor.Collections.AdvanceDirectives;
    if (!AdvanceDirectives) {
      throw new Meteor.Error('collection-not-found', 'AdvanceDirectives collection not found');
    }
    
    // Get existing directive
    const directive = await AdvanceDirectives.findOneAsync(directiveId);
    if (!directive) {
      throw new Meteor.Error('not-found', 'Advance Directive not found');
    }
    
    // Don't allow updating revoked directives
    if (get(directive, 'status') === 'entered-in-error') {
      throw new Meteor.Error('invalid-operation', 'Cannot update a revoked directive');
    }
    
    // Apply updates
    const updatedDirective = {
      ...directive,
      ...updates,
      meta: {
        ...directive.meta,
        lastUpdated: moment().toISOString()
      }
    };
    
    // Update local database
    await AdvanceDirectives.updateAsync(directiveId, {
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
    
    return {
      success: true,
      directiveId
    };
  },
  
  'pacio.uploadAdvanceDirectiveDocument': async function(directiveId, fileData) {
    check(directiveId, String);
    check(fileData, {
      contentType: String,
      data: String, // base64
      title: String,
      size: Number
    });
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    const AdvanceDirectives = Meteor.Collections && Meteor.Collections.AdvanceDirectives;
    if (!AdvanceDirectives) {
      throw new Meteor.Error('collection-not-found', 'AdvanceDirectives collection not found');
    }
    
    // Validate file
    if (fileData.contentType !== 'application/pdf') {
      throw new Meteor.Error('invalid-file', 'Only PDF files are allowed');
    }
    
    if (fileData.size > 10 * 1024 * 1024) { // 10MB
      throw new Meteor.Error('file-too-large', 'File size must be less than 10MB');
    }
    
    // Get directive
    const directive = await AdvanceDirectives.findOneAsync(directiveId);
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
    await AdvanceDirectives.updateAsync(directiveId, {
      $set: {
        content: directive.content,
        'meta.lastUpdated': moment().toISOString()
      }
    });
    
    return {
      success: true,
      binaryId,
      attachment
    };
  }
});