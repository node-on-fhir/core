// tests/unit/imports/lib/contextSidebar/fhirDisplay.test.mjs
//
// Pure-unit coverage for the ContextSidebar display resolvers.
// Runs via `npm run test:context-sidebar` (node --test; imports lodash, so
// it needs node_modules — NOT the bare-checkout lib-unit-tests job).
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isFhirResource,
  deriveLabel,
  deriveSummary,
  deriveBadge,
  byteSize,
  formatBytes
} from '../../../../../imports/lib/contextSidebar/fhirDisplay.js';

test('isFhirResource accepts objects with a string resourceType', function() {
  assert.equal(isFhirResource({ resourceType: 'Patient' }), true);
  assert.equal(isFhirResource({ resourceType: 'Bundle', entry: [] }), true);
});

test('isFhirResource rejects non-resources', function() {
  assert.equal(isFhirResource(null), false);
  assert.equal(isFhirResource('Patient'), false);
  assert.equal(isFhirResource(42), false);
  assert.equal(isFhirResource({}), false);
  assert.equal(isFhirResource({ resourceType: 7 }), false);
  assert.equal(isFhirResource([{ resourceType: 'Patient' }]), false);
});

test('deriveLabel: Patient uses first HumanName as Family, Given', function() {
  const patient = {
    resourceType: 'Patient',
    id: 'p1',
    name: [{ family: 'Gartner', given: ['Violet', 'Rose'] }]
  };
  assert.equal(deriveLabel(patient), 'Gartner, Violet');
});

test('deriveLabel: Condition prefers code.text then coding display', function() {
  assert.equal(deriveLabel({
    resourceType: 'Condition', id: 'c1',
    code: { text: 'Right femur break' }
  }), 'Right femur break');
  assert.equal(deriveLabel({
    resourceType: 'Condition', id: 'c2',
    code: { coding: [{ system: 'http://snomed.info/sct', code: '263225007', display: 'Fracture of femur' }] }
  }), 'Fracture of femur');
});

test('deriveLabel: MedicationRequest uses medicationCodeableConcept', function() {
  assert.equal(deriveLabel({
    resourceType: 'MedicationRequest', id: 'm1',
    medicationCodeableConcept: { text: 'Hydrocodone 5 MG / APAP 325 MG' }
  }), 'Hydrocodone 5 MG / APAP 325 MG');
});

test('deriveLabel: Bundle counts entries; fallback is resourceType/id', function() {
  assert.equal(deriveLabel({
    resourceType: 'Bundle', type: 'collection',
    entry: [{ resource: { resourceType: 'Condition' } }, { resource: { resourceType: 'Observation' } }]
  }), 'Bundle · 2 entries');
  assert.equal(deriveLabel({ resourceType: 'Basic', id: 'xyz' }), 'Basic/xyz');
});

test('deriveSummary: coding renders short system name + code', function() {
  assert.equal(deriveSummary({
    resourceType: 'Condition',
    code: { coding: [{ system: 'http://snomed.info/sct', code: '263225007' }] }
  }), 'SNOMED 263225007');
  assert.equal(deriveSummary({
    resourceType: 'Observation',
    code: { coding: [{ system: 'http://loinc.org', code: '73830-2' }] }
  }), 'LOINC 73830-2');
});

test('deriveSummary: Bundle lists per-type entry counts', function() {
  const summary = deriveSummary({
    resourceType: 'Bundle',
    entry: [
      { resource: { resourceType: 'Condition' } },
      { resource: { resourceType: 'Condition' } },
      { resource: { resourceType: 'Observation' } }
    ]
  });
  assert.equal(summary, 'Condition 2 · Observation 1');
});

test('deriveBadge: status/intent detail and Bundle.type detail', function() {
  assert.deepEqual(deriveBadge({ resourceType: 'MedicationRequest', status: 'active', intent: 'order' }),
    { type: 'MedicationRequest', detail: 'active · order' });
  assert.deepEqual(deriveBadge({ resourceType: 'Bundle', type: 'collection' }),
    { type: 'Bundle', detail: 'collection' });
  assert.deepEqual(deriveBadge({ resourceType: 'Patient' }),
    { type: 'Patient', detail: '' });
});

test('byteSize and formatBytes', function() {
  assert.equal(byteSize({ a: 1 }), JSON.stringify({ a: 1 }).length);
  assert.equal(byteSize('hello'), 5);
  assert.equal(formatBytes(512), '0.5 KB');
  assert.equal(formatBytes(14541), '14.2 KB');
  assert.equal(formatBytes(0), '0 KB');
});
