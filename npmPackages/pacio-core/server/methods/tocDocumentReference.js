// packages/pacio-core/server/methods/tocDocumentReference.js
//
// Server methods for TOCDocumentReference CRUD operations.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { Random } from 'meteor/random';

const TOC_DOC_REF_PROFILE = 'http://hl7.org/fhir/us/pacio-toc/StructureDefinition/TOC-DocumentReference';

/**
 * Create a TOCDocumentReference.
 */
Meteor.ServerMethods.define('pacio.tocDocumentReference.create', {
  description: 'Create a TOC (Transfer of Care) DocumentReference',
  phi: true,
  positionalParams: ['data'],
  schemaObject: {
    type: 'object',
    properties: { data: { type: 'object' } },
    required: ['data']
  }
}, async function(params, context) {
    const data = params.data;

    context.log.info('tocDocumentReference.create Creating TOC DocumentReference');

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
        reference: 'Practitioner/' + context.userId
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
      context.log.info('tocDocumentReference.create Created', { docRefId });
    } else {
      throw new Meteor.Error('not-available', 'DocumentReferences collection not available');
    }

    return docRefId;
});

/**
 * Update a TOCDocumentReference.
 */
Meteor.ServerMethods.define('pacio.tocDocumentReference.update', {
  description: 'Update a TOC (Transfer of Care) DocumentReference',
  phi: true,
  positionalParams: ['docRefId', 'updates'],
  schemaObject: {
    type: 'object',
    properties: { docRefId: { type: 'string' }, updates: { type: 'object' } },
    required: ['docRefId', 'updates']
  }
}, async function(params, context) {
    const docRefId = params.docRefId;
    const updates = params.updates;

    context.log.info('tocDocumentReference.update Updating', { docRefId });

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

    context.log.info('tocDocumentReference.update Updated', { docRefId });
    return 1;
});
