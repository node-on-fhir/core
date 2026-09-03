// tests/unit/imports/lib/resolvePatientDisplayName.test.mjs
//
// npm run test:patient-display-name
// node --experimental-detect-module --test tests/unit/imports/lib/resolvePatientDisplayName.test.mjs
//
// Display-name resolution across every patient shape the app passes around:
// raw FHIR, FhirDehydrator-flattened, display-only picks, and remote-table
// rows where `name` is already a plain string. Returns '' when nothing
// resolves — the caller owns the last-resort presentation.

import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePatientDisplayName } from '../../../../imports/lib/resolvePatientDisplayName.js';

test('raw FHIR patient: prefers name[0].text', function() {
  const patient = {
    resourceType: 'Patient',
    id: 'p1',
    name: [{ text: 'Camila Maria Lopez', family: 'Lopez', given: ['Camila', 'Maria'] }]
  };
  assert.equal(resolvePatientDisplayName(patient), 'Camila Maria Lopez');
});

test('raw FHIR patient without text: assembles given names + family', function() {
  const patient = {
    resourceType: 'Patient',
    name: [{ family: 'Lopez', given: ['Camila', 'Maria'] }]
  };
  assert.equal(resolvePatientDisplayName(patient), 'Camila Maria Lopez');
});

test('raw FHIR patient with family only', function() {
  const patient = { name: [{ family: 'Lopez' }] };
  assert.equal(resolvePatientDisplayName(patient), 'Lopez');
});

test('flattened patient (FhirDehydrator): fullName preferred', function() {
  const patient = { _id: 'abc', fullName: 'Camila Maria Lopez', familyName: 'Lopez', givenName: 'Camila' };
  assert.equal(resolvePatientDisplayName(patient), 'Camila Maria Lopez');
});

test('flattened patient without fullName: givenName + familyName', function() {
  const patient = { givenName: 'Camila', familyName: 'Lopez' };
  assert.equal(resolvePatientDisplayName(patient), 'Camila Lopez');
});

test('display-only shape (reference pick)', function() {
  const patient = { id: 'p1', display: 'Camila Maria Lopez' };
  assert.equal(resolvePatientDisplayName(patient), 'Camila Maria Lopez');
});

test('remote-table row shape: name is a plain string', function() {
  const patient = { id: 'erXuFYUfucBZaryVksYEcMg3', name: 'Camila Maria Lopez', gender: 'female' };
  assert.equal(resolvePatientDisplayName(patient), 'Camila Maria Lopez');
});

test('name array of strings (loosely parsed sources)', function() {
  const patient = { name: ['Camila Maria Lopez'] };
  assert.equal(resolvePatientDisplayName(patient), 'Camila Maria Lopez');
});

test('unresolvable shapes return empty string', function() {
  assert.equal(resolvePatientDisplayName(null), '');
  assert.equal(resolvePatientDisplayName(undefined), '');
  assert.equal(resolvePatientDisplayName({}), '');
  assert.equal(resolvePatientDisplayName({ id: 'p1' }), '');
  assert.equal(resolvePatientDisplayName({ name: [] }), '');
  assert.equal(resolvePatientDisplayName({ name: [{}] }), '');
});

test('whitespace-only assemblies collapse to empty string', function() {
  assert.equal(resolvePatientDisplayName({ name: [{ given: [''] }] }), '');
  assert.equal(resolvePatientDisplayName({ fullName: '   ' }), '');
});
