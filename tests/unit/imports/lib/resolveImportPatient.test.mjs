// tests/unit/imports/lib/resolveImportPatient.test.mjs
//
// Unit tests for the import-attachment precedence core (design v2 §B):
// resolveImportPatientCore applies selected → profile-linked → payload-created →
// unlinked over an already-resolved PatientSet. Tests the dependency-free CJS
// core (imports/lib/resolveImportPatientCore.js) — runs in the bare-checkout
// lib-unit-tests tier (node --test, no npm install).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import resolveImportPatientCore from '../../../../imports/lib/resolveImportPatientCore.js';

const { resolveImportPatientCore: resolve, payloadPatientIdentity, selectionInSet, displayFor } = resolveImportPatientCore;

// ── Helpers ────────────────────────────────────────────────────────────────
function patientSet(overrides) {
  return Object.assign(
    { primaryPatientId: null, linkedPatientIds: [], memberPatientIds: [], source: 'empty', role: 'patient' },
    overrides || {}
  );
}

// ── 1. Selected (patient-role, in set) ──────────────────────────────────────

test('selected: patient-role user selects a member of their own set', () => {
  const result = resolve({
    patientSet: patientSet({ primaryPatientId: 'A', memberPatientIds: ['A', 'B'], source: 'profile+link', role: 'patient' }),
    clientPatientId: 'B',
    setMemberDisplays: { B: 'Bianca' }
  });
  assert.equal(result.source, 'selected');
  assert.equal(result.patientId, 'B');
  assert.equal(result.display, 'Bianca');
});

test('selected: clinician may select ANY id (unrestricted), even outside a set', () => {
  const result = resolve({
    patientSet: patientSet({ primaryPatientId: null, memberPatientIds: [], source: 'clinician-full', role: 'healthcare practitioner' }),
    clientPatientId: 'stranger-42'
  });
  assert.equal(result.source, 'selected');
  assert.equal(result.patientId, 'stranger-42');
});

test('selected: healthcare provider role is also treated as clinician', () => {
  const result = resolve({
    patientSet: patientSet({ source: 'clinician-full', role: 'healthcare provider' }),
    clientPatientId: 'x'
  });
  assert.equal(result.source, 'selected');
  assert.equal(result.patientId, 'x');
});

// ── 2. Profile-linked (selection absent or foreign) ─────────────────────────

test('profile-linked: no selection falls back to the primary patient', () => {
  const result = resolve({
    patientSet: patientSet({ primaryPatientId: 'A', memberPatientIds: ['A'], source: 'profile-only', role: 'patient' }),
    setMemberDisplays: { A: 'Alice' }
  });
  assert.equal(result.source, 'profile-linked');
  assert.equal(result.patientId, 'A');
  assert.equal(result.display, 'Alice');
});

test('profile-linked: patient-role selecting a FOREIGN id is NOT denied — falls to primary', () => {
  // Anti-hostile-claim guarantee: a foreign selection never authorizes, never
  // leaks; it lands on the account's own primary instead.
  const result = resolve({
    patientSet: patientSet({ primaryPatientId: 'A', memberPatientIds: ['A', 'B'], source: 'profile+link', role: 'patient' }),
    clientPatientId: 'stranger-999'
  });
  assert.equal(result.source, 'profile-linked');
  assert.equal(result.patientId, 'A');
});

// ── 3. Payload-created (no selection, no profile) ───────────────────────────

test('payload-created: no set + a payload Patient is used and created', () => {
  const result = resolve({
    patientSet: patientSet({ role: 'patient', source: 'empty' }),
    payloadPatients: [{ _id: 'newpt', id: 'newpt', name: [{ text: 'DICOM Derived' }] }]
  });
  assert.equal(result.source, 'payload-created');
  assert.equal(result.patientId, 'newpt');
  assert.equal(result.display, 'DICOM Derived');
});

test('payload-created: first usable payload Patient wins; _id preferred over id', () => {
  const result = resolve({
    patientSet: patientSet({ role: 'patient', source: 'empty' }),
    payloadPatients: [
      { display: '' },                                  // no id at all -> skipped
      { _id: 'mongo1', id: 'fhir1', display: 'First' }, // _id is the attach id
      { _id: 'mongo2', id: 'fhir2', display: 'Second' }
    ]
  });
  assert.equal(result.source, 'payload-created');
  assert.equal(result.patientId, 'mongo1');
  assert.equal(result.display, 'First');
});

test('payload-created: falls back to FHIR id when _id absent', () => {
  const result = resolve({
    patientSet: patientSet({ role: 'patient', source: 'empty' }),
    payloadPatients: [{ id: 'fhir-only' }]
  });
  assert.equal(result.source, 'payload-created');
  assert.equal(result.patientId, 'fhir-only');
});

// ── 4. Unlinked (nothing resolvable, no payload) ────────────────────────────

test('unlinked: no selection, no profile, no payload Patient', () => {
  const result = resolve({
    patientSet: patientSet({ role: 'patient', source: 'empty' })
  });
  assert.equal(result.source, 'unlinked');
  assert.equal(result.patientId, null);
  assert.equal(result.display, '');
});

test('unlinked: clinician with no selection and no payload (warehouse-only path)', () => {
  const result = resolve({
    patientSet: patientSet({ source: 'clinician-full', role: 'healthcare practitioner' })
  });
  assert.equal(result.source, 'unlinked');
  assert.equal(result.patientId, null);
});

// ── 5. Stale profile-link (deleted primary) ─────────────────────────────────

test('stale-link: NEVER profile-linked — a deleted primary must not be reported as a healthy link', () => {
  const result = resolve({
    patientSet: patientSet({ primaryPatientId: 'ghost', memberPatientIds: [], source: 'stale-link', primaryExists: false, role: 'patient' })
  });
  assert.notEqual(result.source, 'profile-linked');
  assert.equal(result.source, 'stale-link');
  assert.equal(result.patientId, null);
  assert.equal(result.display, '');
});

test('stale-link detected via primaryExists:false even when source label differs', () => {
  const result = resolve({
    patientSet: patientSet({ primaryPatientId: 'ghost', memberPatientIds: [], source: 'profile-only', primaryExists: false, role: 'patient' })
  });
  assert.equal(result.source, 'stale-link');
  assert.equal(result.patientId, null);
});

test('stale-link: falls through to payload-created when a payload Patient is present', () => {
  const result = resolve({
    patientSet: patientSet({ primaryPatientId: 'ghost', memberPatientIds: [], source: 'stale-link', primaryExists: false, role: 'patient' }),
    payloadPatients: [{ _id: 'newpt', id: 'newpt', name: [{ text: 'Imported' }] }]
  });
  assert.equal(result.source, 'payload-created');
  assert.equal(result.patientId, 'newpt');
});

test('stale-link: an in-set (reverse-linked, real) selection is still honored as selected', () => {
  const result = resolve({
    patientSet: patientSet({ primaryPatientId: 'ghost', memberPatientIds: ['H'], source: 'stale-link', primaryExists: false, role: 'patient' }),
    clientPatientId: 'H',
    setMemberDisplays: { H: 'Hospital Record' }
  });
  assert.equal(result.source, 'selected');
  assert.equal(result.patientId, 'H');
  assert.equal(result.display, 'Hospital Record');
});

// ── Precedence ordering ─────────────────────────────────────────────────────

test('precedence: selection outranks both profile link and payload', () => {
  const result = resolve({
    patientSet: patientSet({ primaryPatientId: 'A', memberPatientIds: ['A', 'B'], source: 'profile+link', role: 'patient' }),
    clientPatientId: 'B',
    payloadPatients: [{ _id: 'payload', id: 'payload' }]
  });
  assert.equal(result.source, 'selected');
  assert.equal(result.patientId, 'B');
});

test('precedence: profile link outranks a payload Patient', () => {
  const result = resolve({
    patientSet: patientSet({ primaryPatientId: 'A', memberPatientIds: ['A'], source: 'profile-only', role: 'patient' }),
    payloadPatients: [{ _id: 'payload', id: 'payload' }]
  });
  assert.equal(result.source, 'profile-linked');
  assert.equal(result.patientId, 'A');
});

// ── Edge: selection matches member by FHIR-id shape ─────────────────────────

test('selected: matches a member listed by its FHIR id (memberPatientIds carries both forms)', () => {
  const result = resolve({
    patientSet: patientSet({ primaryPatientId: 'mongoA', memberPatientIds: ['mongoA', 'fhirA'], source: 'profile-only', role: 'patient' }),
    clientPatientId: 'fhirA'
  });
  assert.equal(result.source, 'selected');
  assert.equal(result.patientId, 'fhirA');
});

// ── _id discipline / helper unit checks ─────────────────────────────────────

test('payloadPatientIdentity: null/empty entries yield null (no OR of id/_id)', () => {
  assert.equal(payloadPatientIdentity(null), null);
  assert.equal(payloadPatientIdentity({}), null);
  assert.equal(payloadPatientIdentity({ _id: '', id: '' }), null);
});

test('selectionInSet: empty selection never matches', () => {
  assert.equal(selectionInSet('', ['A']), false);
  assert.equal(selectionInSet(null, ['A']), false);
  assert.equal(selectionInSet(undefined, ['A']), false);
});

test('displayFor: explicit display wins, then name[0].text, then given+family, else ""', () => {
  assert.equal(displayFor({ display: 'Explicit', name: [{ text: 'Text' }] }), 'Explicit');
  assert.equal(displayFor({ name: [{ text: 'Text Wins' }] }), 'Text Wins');
  assert.equal(displayFor({ name: [{ given: ['Ann'], family: 'Lee' }] }), 'Ann Lee');
  assert.equal(displayFor({}), '');
});
