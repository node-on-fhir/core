// packages/pacio-core/server/methods/relatedPersons.js
//
// Server method for creating RelatedPerson resources — used by the Advance
// Directives page to add emergency contacts / healthcare agents that the
// advance-directive Consent then references via provision.actor.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { Random } from 'meteor/random';

/**
 * Create a RelatedPerson (emergency contact / healthcare agent).
 * Mirrors the documentReferences.insert pattern: permissive insert
 * (the RelatedPersons schema is not attached), server-assigned id/meta.
 */
Meteor.ServerMethods.define('relatedPersons.insert', {
  description: 'Create a RelatedPerson (emergency contact / healthcare agent)',
  phi: true,
  positionalParams: ['relatedPerson'],
  schemaObject: {
    type: 'object',
    properties: { relatedPerson: { type: 'object' } },
    required: ['relatedPerson']
  }
}, async function(params, context) {
  const relatedPerson = params.relatedPerson;

  if (!get(relatedPerson, 'patient.reference')) {
    throw new Meteor.Error('invalid-related-person', 'patient.reference is required');
  }

  const RelatedPersons = get(global, 'Collections.RelatedPersons');
  if (!RelatedPersons || typeof RelatedPersons.insertAsync !== 'function') {
    throw new Meteor.Error('not-available', 'RelatedPersons collection not available');
  }

  const id = relatedPerson.id || Random.id();
  const cleanRelatedPerson = {
    ...relatedPerson,
    resourceType: 'RelatedPerson',
    id: id,
    _id: id,
    active: relatedPerson.active !== false,
    meta: {
      versionId: '1',
      lastUpdated: new Date()
    }
  };

  context.log.info('Creating RelatedPerson', { id });

  try {
    const result = await RelatedPersons.insertAsync(cleanRelatedPerson);
    context.log.info('Created RelatedPerson', { result });
    return result;
  } catch (error) {
    context.log.error('relatedPersons.insert error', { error: error && error.message });
    throw new Meteor.Error('insert-failed', 'Failed to save contact: ' + error.message);
  }
});

/**
 * Remove a RelatedPerson (emergency contact / healthcare agent).
 */
Meteor.ServerMethods.define('relatedPersons.remove', {
  description: 'Remove a RelatedPerson (emergency contact / healthcare agent)',
  phi: true,
  positionalParams: ['relatedPersonId'],
  schemaObject: {
    type: 'object',
    properties: { relatedPersonId: { type: 'string' } },
    required: ['relatedPersonId']
  }
}, async function(params, context) {
  const relatedPersonId = params.relatedPersonId;

  const RelatedPersons = get(global, 'Collections.RelatedPersons');
  if (!RelatedPersons || typeof RelatedPersons.removeAsync !== 'function') {
    throw new Meteor.Error('not-available', 'RelatedPersons collection not available');
  }

  context.log.info('Removing RelatedPerson', { relatedPersonId });

  try {
    const result = await RelatedPersons.removeAsync({ _id: relatedPersonId });
    context.log.info('Removed RelatedPerson', { relatedPersonId, result });
    return result;
  } catch (error) {
    context.log.error('relatedPersons.remove error', { error: error && error.message });
    throw new Meteor.Error('remove-failed', 'Failed to remove contact: ' + error.message);
  }
});

console.log('[pacio-core] relatedPersons methods registered');
