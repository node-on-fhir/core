// tests/unit/imports/lib/patientLinkCore.test.mjs
//
// Unit tests for the pure reciprocal Patient.link core (design v2 §C, PR3):
// buildReciprocalEntries (mirror-type mapping, reference form, idempotency,
// self-link / invalid-type rejection) and removeLinkEntries (both-direction
// removal by any reference shape). Runs in the bare-checkout lib-unit-tests tier
// (node --test, no npm install) — imports the dependency-free CJS core directly.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import patientLinkCore from '../../../../imports/lib/patientLinkCore.js';

const {
  buildReciprocalEntries,
  removeLinkEntries,
  isAllowedLinkType,
  mirrorType,
  referenceForTarget,
  referenceShapesForTarget,
  hasLinkEntry
} = patientLinkCore;

// ── link-type validity + mirror mapping ───────────────────────────────────

test('isAllowedLinkType accepts seealso and replaces only', () => {
  assert.equal(isAllowedLinkType('seealso'), true);
  assert.equal(isAllowedLinkType('replaces'), true);
  assert.equal(isAllowedLinkType('refer'), false);
  assert.equal(isAllowedLinkType('replaced-by'), false); // derived, never requested
  assert.equal(isAllowedLinkType('bogus'), false);
  assert.equal(isAllowedLinkType(undefined), false);
});

test('mirrorType maps seealso<->seealso and replaces->replaced-by', () => {
  assert.equal(mirrorType('seealso'), 'seealso');
  assert.equal(mirrorType('replaces'), 'replaced-by');
  assert.equal(mirrorType('refer'), null);
});

// ── referenceForTarget: prefer FHIR id, fall back to _id ──────────────────

test('referenceForTarget prefers FHIR id', () => {
  assert.equal(referenceForTarget({ _id: 'mongoA', id: 'fhirA' }), 'Patient/fhirA');
});

test('referenceForTarget falls back to _id when no FHIR id', () => {
  assert.equal(referenceForTarget({ _id: 'mongoA' }), 'Patient/mongoA');
});

test('referenceForTarget returns null for empty doc', () => {
  assert.equal(referenceForTarget(null), null);
  assert.equal(referenceForTarget({}), null);
});

// ── buildReciprocalEntries: seealso ───────────────────────────────────────

test('buildReciprocalEntries writes symmetric seealso by FHIR id', () => {
  const docA = { _id: 'mA', id: 'fA' };
  const docB = { _id: 'mB', id: 'fB' };
  const plan = buildReciprocalEntries(docA, docB, 'seealso');

  assert.equal(plan.valid, true);
  assert.deepEqual(plan.entryOnA, { other: { reference: 'Patient/fB' }, type: 'seealso' });
  assert.deepEqual(plan.entryOnB, { other: { reference: 'Patient/fA' }, type: 'seealso' });
  assert.equal(plan.alreadyOnA, false);
  assert.equal(plan.alreadyOnB, false);
});

test('buildReciprocalEntries defaults to seealso when type omitted', () => {
  const plan = buildReciprocalEntries({ _id: 'A' }, { _id: 'B' });
  assert.equal(plan.valid, true);
  assert.equal(plan.entryOnA.type, 'seealso');
  assert.equal(plan.entryOnB.type, 'seealso');
});

// ── buildReciprocalEntries: replaces -> replaced-by mirror ────────────────

test('buildReciprocalEntries maps replaces on A to replaced-by on B', () => {
  const plan = buildReciprocalEntries({ _id: 'A', id: 'fA' }, { _id: 'B', id: 'fB' }, 'replaces');
  assert.equal(plan.valid, true);
  assert.equal(plan.entryOnA.type, 'replaces');
  assert.equal(plan.entryOnB.type, 'replaced-by');
});

// ── rejection cases ───────────────────────────────────────────────────────

test('buildReciprocalEntries rejects refer', () => {
  const plan = buildReciprocalEntries({ _id: 'A' }, { _id: 'B' }, 'refer');
  assert.equal(plan.valid, false);
  assert.equal(plan.reason, 'invalid-link-type');
});

test('buildReciprocalEntries rejects unknown type', () => {
  const plan = buildReciprocalEntries({ _id: 'A' }, { _id: 'B' }, 'sibling');
  assert.equal(plan.valid, false);
  assert.equal(plan.reason, 'invalid-link-type');
});

test('buildReciprocalEntries rejects self-link by _id', () => {
  const plan = buildReciprocalEntries({ _id: 'A', id: 'fA' }, { _id: 'A', id: 'fA' }, 'seealso');
  assert.equal(plan.valid, false);
  assert.equal(plan.reason, 'self-link');
});

test('buildReciprocalEntries rejects self-link by identical reference', () => {
  // Same FHIR id, different-but-absent _id -> same reference form.
  const plan = buildReciprocalEntries({ id: 'shared' }, { id: 'shared' }, 'seealso');
  assert.equal(plan.valid, false);
  assert.equal(plan.reason, 'self-link');
});

test('buildReciprocalEntries rejects missing doc', () => {
  assert.equal(buildReciprocalEntries(null, { _id: 'B' }, 'seealso').reason, 'missing-doc');
  assert.equal(buildReciprocalEntries({ _id: 'A' }, null, 'seealso').reason, 'missing-doc');
});

// ── idempotency: existing entry not re-pushed ─────────────────────────────

test('buildReciprocalEntries flags existing entry on A (idempotent), matched by _id-form reference', () => {
  // A already links to B via B's _id reference form; B has no back-link yet.
  const docA = { _id: 'mA', id: 'fA', link: [{ other: { reference: 'Patient/mB' }, type: 'seealso' }] };
  const docB = { _id: 'mB' }; // no FHIR id -> reference is Patient/mB
  const plan = buildReciprocalEntries(docA, docB, 'seealso');

  assert.equal(plan.valid, true);
  assert.equal(plan.alreadyOnA, true, 'A already has the entry -> skip push');
  assert.equal(plan.alreadyOnB, false, 'B still needs its mirror');
});

test('buildReciprocalEntries idempotency is type-sensitive', () => {
  // A links to B with seealso; requesting replaces should NOT be considered present.
  const docA = { _id: 'mA', id: 'fA', link: [{ other: { reference: 'Patient/fB' }, type: 'seealso' }] };
  const docB = { _id: 'mB', id: 'fB' };
  const plan = buildReciprocalEntries(docA, docB, 'replaces');
  assert.equal(plan.alreadyOnA, false, 'different type -> not a duplicate');
});

test('buildReciprocalEntries flags existing entries on both sides', () => {
  const docA = { _id: 'mA', id: 'fA', link: [{ other: { reference: 'Patient/fB' }, type: 'seealso' }] };
  const docB = { _id: 'mB', id: 'fB', link: [{ other: { reference: 'Patient/fA' }, type: 'seealso' }] };
  const plan = buildReciprocalEntries(docA, docB, 'seealso');
  assert.equal(plan.alreadyOnA, true);
  assert.equal(plan.alreadyOnB, true);
});

// ── hasLinkEntry helper ───────────────────────────────────────────────────

test('hasLinkEntry matches across reference shapes', () => {
  const links = [{ other: { reference: 'urn:uuid:fB' }, type: 'seealso' }];
  assert.equal(hasLinkEntry(links, referenceShapesForTarget({ id: 'fB' }), 'seealso'), true);
  assert.equal(hasLinkEntry(links, referenceShapesForTarget({ id: 'fB' }), 'replaces'), false);
});

// ── removeLinkEntries: both-direction removal ─────────────────────────────

test('removeLinkEntries removes entries referencing the other in both directions', () => {
  const docA = {
    _id: 'mA', id: 'fA',
    link: [
      { other: { reference: 'Patient/fB' }, type: 'seealso' },
      { other: { reference: 'Patient/fC' }, type: 'seealso' } // unrelated — kept
    ]
  };
  const docB = {
    _id: 'mB', id: 'fB',
    link: [{ other: { reference: 'Patient/fA' }, type: 'seealso' }]
  };

  const plan = removeLinkEntries(docA, docB);

  assert.equal(plan.removedFromA, 1);
  assert.equal(plan.removedFromB, 1);
  assert.deepEqual(plan.newLinkA, [{ other: { reference: 'Patient/fC' }, type: 'seealso' }]);
  assert.deepEqual(plan.newLinkB, []);
});

test('removeLinkEntries matches any reference shape and any type', () => {
  const docA = {
    _id: 'mA', id: 'fA',
    link: [
      { other: { reference: 'urn:uuid:fB' }, type: 'replaces' },   // shape + type variant
      { other: { reference: 'Patient/mB' }, type: 'replaced-by' }  // _id-form reference
    ]
  };
  const docB = { _id: 'mB', id: 'fB' };
  const plan = removeLinkEntries(docA, docB);
  assert.equal(plan.removedFromA, 2, 'both variant entries removed regardless of type/shape');
  assert.deepEqual(plan.newLinkA, []);
});

test('removeLinkEntries reports zero when nothing references the other', () => {
  const docA = { _id: 'mA', id: 'fA', link: [{ other: { reference: 'Patient/fZ' }, type: 'seealso' }] };
  const docB = { _id: 'mB', id: 'fB' };
  const plan = removeLinkEntries(docA, docB);
  assert.equal(plan.removedFromA, 0);
  assert.equal(plan.removedFromB, 0);
  assert.deepEqual(plan.newLinkA, [{ other: { reference: 'Patient/fZ' }, type: 'seealso' }]);
});

test('removeLinkEntries handles docs with no link array', () => {
  const plan = removeLinkEntries({ _id: 'mA' }, { _id: 'mB' });
  assert.equal(plan.removedFromA, 0);
  assert.equal(plan.removedFromB, 0);
  assert.deepEqual(plan.newLinkA, []);
  assert.deepEqual(plan.newLinkB, []);
});
