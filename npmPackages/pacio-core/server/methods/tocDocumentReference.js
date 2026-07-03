// packages/pacio-core/server/methods/tocDocumentReference.js
//
// Server methods for TOCDocumentReference CRUD operations.

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { Random } from 'meteor/random';

const TOC_DOC_REF_PROFILE = 'http://hl7.org/fhir/us/pacio-toc/StructureDefinition/TOC-DocumentReference';

Meteor.methods({
  /**
   * Create a TOCDocumentReference.
   */
  'pacio.tocDocumentReference.create': async function(data) {
    check(data, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    console.log('[pacio.tocDocumentReference.create] Creating TOC DocumentReference');

    const docRefId = Random.id();
    const docRef = {
      resourceType: 'DocumentReference',
      _id: docRefId,
      id: docRefId,
      meta: {
        profile: [TOC_DOC_REF_PROFILE],
        lastUpdated: new Date().toISOString()
      },
      status: get(data, 'status', 'current'),
      type: {
        coding: [{
          system: 'http://loinc.org',
          code: '18761-7',
          display: 'Transfer Summary Note'
        }]
      },
      category: get(data, 'category', [{
        coding: [{
          system: 'http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category',
          code: 'clinical-note',
          display: 'Clinical Note'
        }]
      }]),
      subject: get(data, 'subject', {}),
      date: get(data, 'date', new Date().toISOString()),
      author: get(data, 'author', [{
        reference: 'Practitioner/' + this.userId
      }]),
      description: get(data, 'description', ''),
      content: get(data, 'content', [{
        attachment: {
          contentType: 'application/fhir+json',
          creation: new Date().toISOString()
        }
      }]),
      context: get(data, 'context', {})
    };

    // Link to Composition if provided
    if (data.compositionId) {
      docRef.content[0].attachment.url = 'Composition/' + data.compositionId;
      docRef.context.related = [{
        reference: 'Composition/' + data.compositionId
      }];
    }

    const DocumentReferences = get(global, 'Collections.DocumentReferences');
    if (DocumentReferences && typeof DocumentReferences.insertAsync === 'function') {
      await DocumentReferences.insertAsync(docRef);
      console.log('[pacio.tocDocumentReference.create] Created:', docRefId);
    } else {
      throw new Meteor.Error('not-available', 'DocumentReferences collection not available');
    }

    return docRefId;
  },

  /**
   * Update a TOCDocumentReference.
   */
  'pacio.tocDocumentReference.update': async function(docRefId, updates) {
    check(docRefId, String);
    check(updates, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    console.log('[pacio.tocDocumentReference.update] Updating:', docRefId);

    const DocumentReferences = get(global, 'Collections.DocumentReferences');
    if (!DocumentReferences) {
      throw new Meteor.Error('not-available', 'DocumentReferences collection not available');
    }

    const existing = await DocumentReferences.findOneAsync({ _id: docRefId });
    if (!existing) {
      throw new Meteor.Error('not-found', 'DocumentReference not found: ' + docRefId);
    }

    const updateFields = {};
    if (updates.status) updateFields.status = updates.status;
    if (updates.description) updateFields.description = updates.description;
    if (updates.content) updateFields.content = updates.content;
    if (updates.category) updateFields.category = updates.category;
    updateFields['meta.lastUpdated'] = new Date().toISOString();

    await DocumentReferences.updateAsync(
      { _id: docRefId },
      { $set: updateFields }
    );

    console.log('[pacio.tocDocumentReference.update] Updated:', docRefId);
    return 1;
  }
});
