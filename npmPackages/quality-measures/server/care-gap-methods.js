// npmPackages/quality-measures/server/care-gap-methods.js
//
// Preventive-screening care-gap detection (PHR IG "Gaps in Care Reporting").
// The guideline math lives in ../lib/screeningGuidelines.js (pure, unit-tested);
// this method owns what the lib cannot: resolving the patient, loading their
// candidate Procedures/Immunizations/Observations/DiagnosticReports, and
// returning the evaluated screenings. Read-only — no gate needed beyond auth.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { evaluateScreenings } from '../lib/screeningGuidelines.js';

const log = (Meteor.Logger ? Meteor.Logger.for('quality-measures') : console);

const CANDIDATE_COLLECTIONS = ['Procedures', 'Immunizations', 'Observations', 'DiagnosticReports'];
const PER_COLLECTION_LIMIT = 2000;

Meteor.ServerMethods.define('qualityMeasures.findCareGaps', {
  description: 'Evaluate preventive-screening guidelines (guideline-interval table, not CQL) for a patient and report gaps',
  requireAuth: true,
  phi: true,
  schemaObject: {
    type: 'object',
    properties: {
      patientId: { type: 'string' }
    },
    required: ['patientId']
  }
}, async function(params, context) {
  const patientId = get(params, 'patientId');
  const Patients = get(global, 'Collections.Patients');
  if (!Patients) {
    throw new Meteor.Error('collections-unavailable', 'Patients collection is not registered');
  }

  // MongoDB _id first; FHIR id only as an explicit fallback (id-lookup rule —
  // never OR the two).
  let patient = await Patients.findOneAsync({ _id: patientId });
  if (!patient) {
    patient = await Patients.findOneAsync({ id: patientId });
  }
  if (!patient) {
    throw new Meteor.Error('not-found', 'Patient not found: ' + patientId);
  }

  // References may point at either the FHIR id or the Mongo _id depending on
  // the importer; accept both spellings for this patient.
  const refIds = [];
  [get(patient, 'id'), get(patient, '_id')].forEach(function(id) {
    if (id && refIds.indexOf(id) < 0) { refIds.push(id); }
  });
  const refs = refIds.map(function(id) { return 'Patient/' + id; });
  const selector = {
    $or: [
      { 'subject.reference': { $in: refs } },
      { 'patient.reference': { $in: refs } }
    ]
  };

  const resources = [];
  for (const name of CANDIDATE_COLLECTIONS) {
    const collection = get(global, 'Collections.' + name);
    if (!collection || typeof collection.find !== 'function') {
      log.debug('findCareGaps: collection unavailable, skipping', { collection: name });
      continue;
    }
    const docs = await collection.find(selector, { limit: PER_COLLECTION_LIMIT }).fetchAsync();
    docs.forEach(function(doc) { resources.push(doc); });
  }

  const screenings = evaluateScreenings(patient, resources, {});
  const gaps = screenings.filter(function(entry) { return entry.status !== 'current'; });

  context.log.info('Care-gap evaluation complete', {
    patientId: patientId,
    resourcesScanned: resources.length,
    applicableGuidelines: screenings.length,
    gaps: gaps.length
  });

  return { screenings: screenings, gaps: gaps, resourcesScanned: resources.length };
});
