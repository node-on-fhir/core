// tests/unit/imports/lib/FhirDeidentify.test.mjs
//
// npm run test:fhir-deidentify
// node --experimental-detect-module --test tests/unit/imports/lib/FhirDeidentify.test.mjs
//
// Pure de-identification transforms for parsed FHIR resources, applied
// client-side before import (Apple Health today; PDF / Data / Social-Media
// importers later). Permissive-in/strict-out: unknown shapes pass through.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_FHIR_DEID_CONTROLS,
  applyFhirDeidentification
} from '../../../../imports/lib/FhirDeidentify.js';

function sampleObservation(overrides) {
  return Object.assign({
    resourceType: 'Observation',
    id: 'obs-1',
    status: 'final',
    code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] },
    subject: { reference: 'Patient/real-patient-1', display: 'Camila Maria Lopez' },
    effectiveDateTime: '2026-03-15T08:30:00Z',
    issued: '2026-03-15T09:00:00Z',
    device: { display: 'Apple Watch Series 9' },
    valueQuantity: { value: 72, unit: 'beats/minute' }
  }, overrides || {});
}

const ANON_CONTEXT = { anonymousPatientRef: { reference: 'Patient/anon-1', display: 'Anonymous Patient' } };

// ---------------------------------------------------------------------------
// Defaults / no-op behavior
// ---------------------------------------------------------------------------

test('disabled controls return resources unchanged (same content)', function() {
  const input = [sampleObservation()];
  const output = applyFhirDeidentification(input, DEFAULT_FHIR_DEID_CONTROLS, {});
  assert.deepEqual(output, input);
});

test('enabled but no transforms selected is a no-op', function() {
  const controls = Object.assign({}, DEFAULT_FHIR_DEID_CONTROLS, { deidentifyEnabled: true });
  const input = [sampleObservation()];
  const output = applyFhirDeidentification(input, controls, {});
  assert.deepEqual(output, input);
});

test('does not mutate the input resources', function() {
  const controls = Object.assign({}, DEFAULT_FHIR_DEID_CONTROLS, {
    deidentifyEnabled: true,
    assignAnonymousPatient: true
  });
  const input = [sampleObservation()];
  const snapshot = JSON.parse(JSON.stringify(input));
  applyFhirDeidentification(input, controls, ANON_CONTEXT);
  assert.deepEqual(input, snapshot);
});

// ---------------------------------------------------------------------------
// Anonymous patient reassignment
// ---------------------------------------------------------------------------

test('assignAnonymousPatient rewrites subject reference and display', function() {
  const controls = Object.assign({}, DEFAULT_FHIR_DEID_CONTROLS, {
    deidentifyEnabled: true,
    assignAnonymousPatient: true
  });
  const output = applyFhirDeidentification([sampleObservation()], controls, ANON_CONTEXT);
  assert.equal(output[0].subject.reference, 'Patient/anon-1');
  assert.equal(output[0].subject.display, 'Anonymous Patient');
});

test('assignAnonymousPatient rewrites patient field (Immunization-style resources)', function() {
  const controls = Object.assign({}, DEFAULT_FHIR_DEID_CONTROLS, {
    deidentifyEnabled: true,
    assignAnonymousPatient: true
  });
  const immunization = {
    resourceType: 'Immunization',
    id: 'imm-1',
    patient: { reference: 'Patient/real-patient-1', display: 'Camila Maria Lopez' }
  };
  const output = applyFhirDeidentification([immunization], controls, ANON_CONTEXT);
  assert.equal(output[0].patient.reference, 'Patient/anon-1');
});

test('assignAnonymousPatient replaces Patient resources with the anonymous identity', function() {
  const controls = Object.assign({}, DEFAULT_FHIR_DEID_CONTROLS, {
    deidentifyEnabled: true,
    assignAnonymousPatient: true
  });
  const patient = {
    resourceType: 'Patient',
    id: 'real-patient-1',
    name: [{ family: 'Lopez', given: ['Camila', 'Maria'] }],
    birthDate: '1987-09-12',
    gender: 'female'
  };
  const output = applyFhirDeidentification([patient], controls, ANON_CONTEXT);
  assert.equal(output[0].id, 'anon-1');
  assert.equal(output[0].resourceType, 'Patient');
  assert.equal(output[0].birthDate, undefined);
  assert.notDeepEqual(output[0].name, patient.name);
});

test('assignAnonymousPatient without context.anonymousPatientRef throws (never silently keeps real identity)', function() {
  const controls = Object.assign({}, DEFAULT_FHIR_DEID_CONTROLS, {
    deidentifyEnabled: true,
    assignAnonymousPatient: true
  });
  assert.throws(function() {
    applyFhirDeidentification([sampleObservation()], controls, {});
  }, /anonymousPatientRef/);
});

// ---------------------------------------------------------------------------
// Demographic / source-metadata stripping
// ---------------------------------------------------------------------------

test('stripDemographics removes device and source-name metadata from observations', function() {
  const controls = Object.assign({}, DEFAULT_FHIR_DEID_CONTROLS, {
    deidentifyEnabled: true,
    stripDemographics: true
  });
  const obs = sampleObservation({
    extension: [{ url: 'http://honeycomb.healthcare/sourceName', valueString: 'Camila’s iPhone' }]
  });
  const output = applyFhirDeidentification([obs], controls, {});
  assert.equal(output[0].device, undefined);
  assert.equal(output[0].extension, undefined);
  // clinical content untouched
  assert.equal(output[0].valueQuantity.value, 72);
  assert.equal(output[0].code.coding[0].code, '8867-4');
});

test('stripDemographics removes birthDate/gender from Patient resources but keeps the record', function() {
  const controls = Object.assign({}, DEFAULT_FHIR_DEID_CONTROLS, {
    deidentifyEnabled: true,
    stripDemographics: true
  });
  const patient = {
    resourceType: 'Patient',
    id: 'p1',
    name: [{ family: 'Lopez', given: ['Camila'] }],
    birthDate: '1987-09-12',
    gender: 'female',
    extension: [{ url: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex', valueCode: 'F' }]
  };
  const output = applyFhirDeidentification([patient], controls, {});
  assert.equal(output[0].birthDate, undefined);
  assert.equal(output[0].gender, undefined);
  assert.equal(output[0].extension, undefined);
  assert.equal(output[0].id, 'p1');
});

// ---------------------------------------------------------------------------
// Date handling
// ---------------------------------------------------------------------------

test('truncateToDate coarsens datetime fields to date precision', function() {
  const controls = Object.assign({}, DEFAULT_FHIR_DEID_CONTROLS, {
    deidentifyEnabled: true,
    dateHandling: 'truncateToDate'
  });
  const obs = sampleObservation({
    effectivePeriod: { start: '2026-03-15T08:30:00Z', end: '2026-03-16T10:00:00Z' },
    effectiveDateTime: undefined
  });
  delete obs.effectiveDateTime;
  const output = applyFhirDeidentification([sampleObservation(), obs], controls, {});
  assert.equal(output[0].effectiveDateTime, '2026-03-15');
  assert.equal(output[0].issued, '2026-03-15');
  assert.equal(output[1].effectivePeriod.start, '2026-03-15');
  assert.equal(output[1].effectivePeriod.end, '2026-03-16');
});

test('shiftRandom shifts all dates by the same provided offset, preserving intervals', function() {
  const controls = Object.assign({}, DEFAULT_FHIR_DEID_CONTROLS, {
    deidentifyEnabled: true,
    dateHandling: 'shiftRandom',
    dateShiftDays: -30
  });
  const output = applyFhirDeidentification([sampleObservation()], controls, {});
  assert.equal(output[0].effectiveDateTime, '2026-02-13T08:30:00.000Z');
  assert.equal(output[0].issued, '2026-02-13T09:00:00.000Z');
  // interval between effective and issued preserved (30 min)
  const delta = new Date(output[0].issued) - new Date(output[0].effectiveDateTime);
  assert.equal(delta, 30 * 60 * 1000);
});

test('malformed dates are left untouched', function() {
  const controls = Object.assign({}, DEFAULT_FHIR_DEID_CONTROLS, {
    deidentifyEnabled: true,
    dateHandling: 'shiftRandom',
    dateShiftDays: 10
  });
  const obs = sampleObservation({ effectiveDateTime: 'not-a-date' });
  const output = applyFhirDeidentification([obs], controls, {});
  assert.equal(output[0].effectiveDateTime, 'not-a-date');
});

// ---------------------------------------------------------------------------
// Robustness
// ---------------------------------------------------------------------------

test('unknown resource types pass through structurally intact aside from requested transforms', function() {
  const controls = Object.assign({}, DEFAULT_FHIR_DEID_CONTROLS, {
    deidentifyEnabled: true,
    assignAnonymousPatient: true
  });
  const custom = { resourceType: 'Basic', id: 'b1', code: { text: 'custom' } };
  const output = applyFhirDeidentification([custom], controls, ANON_CONTEXT);
  assert.deepEqual(output[0], custom);
});

test('non-array and empty input handled gracefully', function() {
  const controls = Object.assign({}, DEFAULT_FHIR_DEID_CONTROLS, { deidentifyEnabled: true });
  assert.deepEqual(applyFhirDeidentification([], controls, {}), []);
  assert.deepEqual(applyFhirDeidentification(null, controls, {}), []);
});

test('applying the same transforms twice is idempotent', function() {
  const controls = Object.assign({}, DEFAULT_FHIR_DEID_CONTROLS, {
    deidentifyEnabled: true,
    assignAnonymousPatient: true,
    stripDemographics: true,
    dateHandling: 'truncateToDate'
  });
  const once = applyFhirDeidentification([sampleObservation()], controls, ANON_CONTEXT);
  const twice = applyFhirDeidentification(once, controls, ANON_CONTEXT);
  assert.deepEqual(twice, once);
});
