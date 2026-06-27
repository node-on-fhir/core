// packages/pacio-core/server/methods/relatedPersons.js
//
// Server method for creating RelatedPerson resources — used by the Advance
// Directives page to add emergency contacts / healthcare agents that the
// advance-directive Consent then references via provision.actor.

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import { Random } from 'meteor/random';

Meteor.methods({
  /**
   * Create a RelatedPerson (emergency contact / healthcare agent).
   * Mirrors the documentReferences.insert pattern: permissive insert
   * (the RelatedPersons schema is not attached), server-assigned id/meta.
   */
  'relatedPersons.insert': async function(relatedPerson) {
    check(relatedPerson, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to add a contact');
    }

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

    console.log('[relatedPersons.insert] Creating RelatedPerson:', id);

    try {
      const result = await RelatedPersons.insertAsync(cleanRelatedPerson);
      console.log('[relatedPersons.insert] Created RelatedPerson:', result);
      return result;
    } catch (error) {
      console.error('[relatedPersons.insert] Error:', error);
      throw new Meteor.Error('insert-failed', 'Failed to save contact: ' + error.message);
    }
  },

  /**
   * Remove a RelatedPerson (emergency contact / healthcare agent).
   */
  'relatedPersons.remove': async function(relatedPersonId) {
    check(relatedPersonId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to remove a contact');
    }

    const RelatedPersons = get(global, 'Collections.RelatedPersons');
    if (!RelatedPersons || typeof RelatedPersons.removeAsync !== 'function') {
      throw new Meteor.Error('not-available', 'RelatedPersons collection not available');
    }

    console.log('[relatedPersons.remove] Removing RelatedPerson:', relatedPersonId);

    try {
      const result = await RelatedPersons.removeAsync({ _id: relatedPersonId });
      console.log('[relatedPersons.remove] Removed RelatedPerson:', relatedPersonId, result);
      return result;
    } catch (error) {
      console.error('[relatedPersons.remove] Error:', error);
      throw new Meteor.Error('remove-failed', 'Failed to remove contact: ' + error.message);
    }
  }
});

console.log('[pacio-core] relatedPersons methods registered');
