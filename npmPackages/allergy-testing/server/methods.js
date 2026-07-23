// npmPackages/allergy-testing/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';

import { AllergyIntolerances } from '/imports/lib/schemas/SimpleSchemas/AllergyIntolerances';
import { NO_KNOWN_ALLERGY } from '../lib/allergyPanels.js';

const log = (Meteor.Logger ? Meteor.Logger.for('methods') : console);

// Build a clean FHIR AllergyIntolerance from a panel allergen row. Mirrors the
// field handling in imports/api/allergyIntolerances/methods.js so the documents
// this package writes are shaped identically to the core CRUD path.
function buildAllergyIntolerance(allergen, patientReference, recordedBy, userId) {
  const isProvider = recordedBy === 'provider';

  const verificationStatus = {
    coding: [{
      system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
      code: isProvider ? 'confirmed' : 'unconfirmed',
      display: isProvider ? 'Confirmed' : 'Unconfirmed'
    }]
  };

  const doc = {
    resourceType: 'AllergyIntolerance',
    id: Random.id(),
    meta: { lastUpdated: new Date() },
    clinicalStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
        code: 'active',
        display: 'Active'
      }]
    },
    verificationStatus: verificationStatus,
    code: {
      coding: [{
        system: get(allergen, 'system', 'http://snomed.info/sct'),
        code: get(allergen, 'code', ''),
        display: get(allergen, 'display', '')
      }],
      text: get(allergen, 'display', '')
    },
    patient: patientReference
  };

  // Category, when the panel row carries one.
  const category = get(allergen, 'category');
  if (category) {
    doc.category = [category];
  }

  // The registrar drives recorder (provider) vs asserter (patient self-report).
  const actorReference = { reference: 'Practitioner/' + userId };
  if (isProvider) {
    doc.recorder = actorReference;
  } else {
    doc.asserter = patientReference;
  }

  return doc;
}

// -----------------------------------------------------------------------------
// ServerMethods registry (rpc-migration). Auth guards deleted -> requireAuth
// defaults to true. phi:true — writes patient AllergyIntolerance records.
// recordedBy is constrained to 'provider'|'patient' via schema enum (was
// Match.OneOf). this.userId -> context.userId.

Meteor.ServerMethods.define('allergyTesting.submitPanel', {
  description: 'Bulk-create one AllergyIntolerance per positive allergen from a test panel',
  phi: true,
  positionalParams: ['patientReference', 'positives', 'recordedBy'],
  schemaObject: {
    type: 'object',
    properties: {
      patientReference: { type: 'object' },
      positives: { type: 'array', items: { type: 'object' } },
      recordedBy: { type: 'string', enum: ['provider', 'patient'] }
    },
    required: ['patientReference', 'positives', 'recordedBy']
  }
}, async function(params, context) {
    const patientReference = params.patientReference;
    const positives = params.positives;
    const recordedBy = params.recordedBy;

    if (!get(patientReference, 'reference')) {
      throw new Meteor.Error('invalid-patient', 'A patient reference is required');
    }

    log.debug('allergyTesting.submitPanel Recording ' + positives.length + ' allergen(s) for ' + patientReference.reference + ' as ' + recordedBy);

    const insertedIds = [];
    for (const allergen of positives) {
      const doc = buildAllergyIntolerance(allergen, patientReference, recordedBy, context.userId);
      try {
        const result = await AllergyIntolerances.insertAsync(doc);
        insertedIds.push(result);
      } catch (error) {
        console.error('[allergyTesting.submitPanel] Insert failed for', get(allergen, 'display'), error);
        throw new Meteor.Error('insert-failed', error.message);
      }
    }

    console.log('[allergyTesting.submitPanel] Inserted', insertedIds.length, 'AllergyIntolerance record(s)');
    return insertedIds;
});

// Record the US Core "no known allergy" sentinel (716186003, confirmed).
Meteor.ServerMethods.define('allergyTesting.recordNoKnownAllergies', {
  description: 'Record the US Core no-known-allergy sentinel for a patient',
  phi: true,
  positionalParams: ['patientReference', 'recordedBy'],
  schemaObject: {
    type: 'object',
    properties: {
      patientReference: { type: 'object' },
      recordedBy: { type: 'string', enum: ['provider', 'patient'] }
    },
    required: ['patientReference', 'recordedBy']
  }
}, async function(params, context) {
    const patientReference = params.patientReference;
    const recordedBy = params.recordedBy;

    if (!get(patientReference, 'reference')) {
      throw new Meteor.Error('invalid-patient', 'A patient reference is required');
    }

    const doc = buildAllergyIntolerance(NO_KNOWN_ALLERGY, patientReference, recordedBy, context.userId);
    // "No known allergy" is always confirmed per US Core, regardless of registrar.
    doc.verificationStatus = {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
        code: 'confirmed',
        display: 'Confirmed'
      }]
    };

    log.debug('allergyTesting.recordNoKnownAllergies Recording no-known-allergy for ' + patientReference.reference);
    try {
      const result = await AllergyIntolerances.insertAsync(doc);
      return result;
    } catch (error) {
      console.error('[allergyTesting.recordNoKnownAllergies] Insert failed', error);
      throw new Meteor.Error('insert-failed', error.message);
    }
});

console.log('[allergy-testing] Server methods registered');
