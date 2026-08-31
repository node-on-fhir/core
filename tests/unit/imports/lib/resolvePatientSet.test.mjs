// tests/unit/imports/lib/resolvePatientSet.test.mjs
//
// Unit tests for the link-aware patient-set resolver core (design v2 §A) and
// the FhirUtilities.addPatientFilterToQuery single/array overload. Tests the
// dependency-free CJS core (imports/lib/patientSetCore.js) with in-memory fake
// collections — runs in the bare-checkout lib-unit-tests tier (node --test, no
// npm install).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import patientSetCore from '../../../../imports/lib/patientSetCore.js';
import { FhirUtilities } from '../../../../imports/lib/FhirUtilities.js';

const { resolvePatientSetCore, MAX_MEMBERS } = patientSetCore;

// ── In-memory Patients adapter over an array of docs ──────────────────────
// Mirrors the resolvePatientSet.js adapter contract:
//   findOneByMongoId / findOneByFhirId (SEPARATE queries — no _id/id mix)
//   findByLinkReferences(refs, types)
function makeFakePatients(docs) {
  return {
    async findOneByMongoId(mongoId) {
      return docs.find((d) => String(d._id) === String(mongoId)) || null;
    },
    async findOneByFhirId(fhirId) {
      return docs.find((d) => d.id !== undefined && String(d.id) === String(fhirId)) || null;
    },
    async findByLinkReferences(refs, types) {
      const refSet = new Set(refs);
      const typeSet = new Set(types);
      return docs.filter((d) => {
        const links = Array.isArray(d.link) ? d.link : [];
        return links.some((l) => l && typeSet.has(l.type) && l.other && refSet.has(l.other.reference));
      });
    }
  };
}

function patientUser(patientId, roles) {
  return { _id: 'user1', patientId, roles: roles || ['patient'] };
}

// ── Traversal matrix ──────────────────────────────────────────────────────

test('seealso link traverses in both directions (outbound)', async () => {
  // A --seealso--> B (link written on A, our record)
  const docs = [
    { _id: 'A', link: [{ other: { reference: 'Patient/B' }, type: 'seealso' }] },
    { _id: 'B' }
  ];
  const result = await resolvePatientSetCore(patientUser('A'), makeFakePatients(docs));
  assert.equal(result.primaryPatientId, 'A');
  assert.deepEqual(result.memberPatientIds.sort(), ['A', 'B']);
  assert.deepEqual(result.linkedPatientIds, ['B']);
  assert.equal(result.source, 'profile+link');
});

test('reverse-link discovery: hospital record points at ours, no outbound link back', async () => {
  // Our record A has NO link. Hospital record H --seealso--> A.
  const docs = [
    { _id: 'A' },
    { _id: 'H', link: [{ other: { reference: 'Patient/A' }, type: 'seealso' }] }
  ];
  const result = await resolvePatientSetCore(patientUser('A'), makeFakePatients(docs));
  assert.deepEqual(result.memberPatientIds.sort(), ['A', 'H']);
  assert.deepEqual(result.linkedPatientIds, ['H']);
});

test('replaces / replaced-by lineage traverses both directions', async () => {
  // Old --replaced-by--> Survivor ; Survivor --replaces--> Old. Seed from Old.
  const docs = [
    { _id: 'Old', link: [{ other: { reference: 'Patient/Survivor' }, type: 'replaced-by' }] },
    { _id: 'Survivor', link: [{ other: { reference: 'Patient/Old' }, type: 'replaces' }] }
  ];
  const result = await resolvePatientSetCore(patientUser('Old'), makeFakePatients(docs));
  assert.deepEqual(result.memberPatientIds.sort(), ['Old', 'Survivor']);
});

test('refer links are EXCLUDED from the set (both outbound and reverse)', async () => {
  const docs = [
    { _id: 'Mother', link: [{ other: { reference: 'Patient/Newborn' }, type: 'refer' }] },
    { _id: 'Newborn', link: [{ other: { reference: 'Patient/Mother' }, type: 'refer' }] }
  ];
  const result = await resolvePatientSetCore(patientUser('Mother'), makeFakePatients(docs));
  assert.deepEqual(result.memberPatientIds, ['Mother']);
  assert.deepEqual(result.linkedPatientIds, []);
  assert.equal(result.source, 'profile-only');
});

test('cycles do not loop (A<->B<->C<->A)', async () => {
  const docs = [
    { _id: 'A', link: [{ other: { reference: 'Patient/B' }, type: 'seealso' }] },
    { _id: 'B', link: [{ other: { reference: 'Patient/C' }, type: 'seealso' }] },
    { _id: 'C', link: [{ other: { reference: 'Patient/A' }, type: 'seealso' }] }
  ];
  const result = await resolvePatientSetCore(patientUser('A'), makeFakePatients(docs));
  assert.deepEqual(result.memberPatientIds.sort(), ['A', 'B', 'C']);
});

test('multi-hop transitive closure (A->B->C->D)', async () => {
  const docs = [
    { _id: 'A', link: [{ other: { reference: 'Patient/B' }, type: 'seealso' }] },
    { _id: 'B', link: [{ other: { reference: 'Patient/C' }, type: 'seealso' }] },
    { _id: 'C', link: [{ other: { reference: 'Patient/D' }, type: 'seealso' }] },
    { _id: 'D' }
  ];
  const result = await resolvePatientSetCore(patientUser('A'), makeFakePatients(docs));
  assert.deepEqual(result.memberPatientIds.sort(), ['A', 'B', 'C', 'D']);
});

test('member cap trips -> partial set returned (no throw)', async () => {
  // Build a long chain longer than MAX_MEMBERS.
  const n = MAX_MEMBERS + 20;
  const docs = [];
  for (let i = 0; i < n; i++) {
    const doc = { _id: 'P' + i };
    if (i < n - 1) {
      doc.link = [{ other: { reference: 'Patient/P' + (i + 1) }, type: 'seealso' }];
    }
    docs.push(doc);
  }
  let warned = false;
  const logger = { warn: () => { warned = true; }, debug: () => {} };
  const result = await resolvePatientSetCore(patientUser('P0'), makeFakePatients(docs), logger);
  // Members should be capped, not the full chain.
  assert.ok(result.memberPatientIds.length <= MAX_MEMBERS, 'members capped at MAX_MEMBERS');
  assert.equal(warned, true, 'cap trip logged a warning');
  assert.ok(result.memberPatientIds.includes('P0'), 'primary still present in partial set');
});

// ── _id vs id normalization ───────────────────────────────────────────────

test('_id vs id normalization: link reference by FHIR id resolves to record _id, both emitted', async () => {
  // A links to B by B's FHIR id (not its _id). B: { _id: 'mongoB', id: 'fhirB' }.
  const docs = [
    { _id: 'mongoA', id: 'fhirA', link: [{ other: { reference: 'Patient/fhirB' }, type: 'seealso' }] },
    { _id: 'mongoB', id: 'fhirB' }
  ];
  const result = await resolvePatientSetCore(patientUser('mongoA'), makeFakePatients(docs));
  // Primary expressed as the record _id.
  assert.equal(result.primaryPatientId, 'mongoA');
  // memberPatientIds carries BOTH _id and FHIR id for each member (distinct).
  assert.ok(result.memberPatientIds.includes('mongoA'));
  assert.ok(result.memberPatientIds.includes('fhirA'));
  assert.ok(result.memberPatientIds.includes('mongoB'));
  assert.ok(result.memberPatientIds.includes('fhirB'));
  // B reached by fhir id but deduped by _id — B appears once as a member.
  assert.deepEqual(result.linkedPatientIds.sort(), ['fhirB', 'mongoB']);
});

test('user primary given as FHIR id resolves to owning record _id', async () => {
  const docs = [{ _id: 'mongoA', id: 'fhirA' }];
  const result = await resolvePatientSetCore(patientUser('fhirA'), makeFakePatients(docs));
  assert.equal(result.primaryPatientId, 'mongoA');
  assert.deepEqual(result.memberPatientIds.sort(), ['fhirA', 'mongoA']);
});

// ── Empty / role cases ────────────────────────────────────────────────────

test('patient-role user without patientId -> empty set', async () => {
  const result = await resolvePatientSetCore({ _id: 'u', roles: ['patient'] }, makeFakePatients([]));
  assert.equal(result.source, 'empty');
  assert.equal(result.primaryPatientId, null);
  assert.deepEqual(result.memberPatientIds, []);
});

test('null user -> empty set', async () => {
  const result = await resolvePatientSetCore(null, makeFakePatients([]));
  assert.equal(result.source, 'empty');
  assert.deepEqual(result.memberPatientIds, []);
});

test('clinician role -> source clinician-full, set still computed from own patientId', async () => {
  const docs = [
    { _id: 'A', link: [{ other: { reference: 'Patient/B' }, type: 'seealso' }] },
    { _id: 'B' }
  ];
  const result = await resolvePatientSetCore(
    { _id: 'doc1', patientId: 'A', roles: ['healthcare practitioner'] },
    makeFakePatients(docs)
  );
  assert.equal(result.source, 'clinician-full');
  assert.equal(result.role, 'healthcare practitioner');
  // Set still computed (A + linked B), even though callers treat clinicians as unrestricted.
  assert.deepEqual(result.memberPatientIds.sort(), ['A', 'B']);
});

test('clinician role with no patientId -> clinician-full, empty member set', async () => {
  const result = await resolvePatientSetCore(
    { _id: 'doc1', roles: ['healthcare provider'] },
    makeFakePatients([])
  );
  assert.equal(result.source, 'clinician-full');
  assert.deepEqual(result.memberPatientIds, []);
});

// ── Stale profile-link (deleted primary) ──────────────────────────────────

test('stale primary (no matching Patient doc) -> source stale-link, primaryExists false, NO synthesized member', async () => {
  const result = await resolvePatientSetCore(patientUser('ghost'), makeFakePatients([]));
  assert.equal(result.source, 'stale-link');
  assert.equal(result.primaryExists, false);
  // primaryPatientId keeps the raw stale id (callers need it for messaging)...
  assert.equal(result.primaryPatientId, 'ghost');
  // ...but the phantom single-member set is NOT synthesized.
  assert.deepEqual(result.memberPatientIds, []);
  assert.deepEqual(result.linkedPatientIds, []);
});

test('stale primary WITH a reverse-linked REAL member: stale id filtered out, real member kept', async () => {
  // The stale-link path keeps ONLY real members the closure reached, filtering
  // the stale raw id's identity out. We exercise that filter by injecting a
  // patients adapter whose reverse lookup surfaces a live record H even though
  // the primary 'ghost' does not resolve. (The production closure only runs
  // reverse lookups off a RESOLVED seed, so a truly-deleted primary usually
  // yields no members — see the sibling test — but the filter must keep any
  // real members that ARE found and never let the phantom 'ghost' id through.)
  const ghostVariants = new Set(['ghost', 'Patient/ghost', 'urn:uuid:ghost']);
  const patients = {
    async findOneByMongoId(mongoId) {
      // 'ghost' does not resolve (deleted); H does.
      if (String(mongoId) === 'H') return { _id: 'H' };
      return null;
    },
    async findOneByFhirId() { return null; },
    async findByLinkReferences(refs) {
      // Reverse lookup matches H whenever the ghost's reference variants are queried.
      const hit = refs.some((r) => ghostVariants.has(r));
      return hit ? [{ _id: 'H' }] : [];
    }
  };
  // Seed the closure with BOTH ids so the reverse lookup fires (mimics a
  // deployment where the deleted record's edges are still discoverable).
  const closure = await patientSetCore.traverseLinkClosure(patients, ['ghost', 'H']);
  assert.ok(closure.memberPatientIds.includes('H'), 'closure reaches the real member H');

  // And the full resolver: the stale raw id is never a member.
  const result = await resolvePatientSetCore(patientUser('ghost'), patients);
  assert.equal(result.source, 'stale-link');
  assert.equal(result.primaryExists, false);
  assert.equal(result.primaryPatientId, 'ghost');
  assert.ok(!result.memberPatientIds.includes('ghost'), 'phantom ghost id filtered out');
  assert.ok(!result.memberPatientIds.includes('Patient/ghost'));
});

test('healthy paths carry primaryExists: true', async () => {
  const docs = [{ _id: 'A' }];
  const profileOnly = await resolvePatientSetCore(patientUser('A'), makeFakePatients(docs));
  assert.equal(profileOnly.source, 'profile-only');
  assert.equal(profileOnly.primaryExists, true);

  const empty = await resolvePatientSetCore({ _id: 'u', roles: ['patient'] }, makeFakePatients([]));
  assert.equal(empty.source, 'empty');
  assert.equal(empty.primaryExists, true);

  const clinician = await resolvePatientSetCore(
    { _id: 'doc1', patientId: 'A', roles: ['healthcare practitioner'] },
    makeFakePatients(docs)
  );
  assert.equal(clinician.source, 'clinician-full');
  assert.equal(clinician.primaryExists, true);
});

test('clinician with a stale primary is still clinician-full (unrestricted), primaryExists false', async () => {
  const result = await resolvePatientSetCore(
    { _id: 'doc1', patientId: 'ghost', roles: ['healthcare practitioner'] },
    makeFakePatients([])
  );
  assert.equal(result.source, 'clinician-full');
  assert.equal(result.primaryExists, false);
  assert.deepEqual(result.memberPatientIds, []);
});

// ── FhirUtilities.addPatientFilterToQuery overload ────────────────────────

test('addPatientFilterToQuery single id — backward-compatible output', () => {
  const q = FhirUtilities.addPatientFilterToQuery('123');
  assert.deepEqual(q, {
    $or: [
      { 'patient.reference': 'Patient/123' },
      { 'patient.reference': 'urn:uuid:123' },
      { 'subject.reference': 'Patient/123' },
      { 'subject.reference': 'urn:uuid:123' },
      { 'for.reference': 'Patient/123' },
      { 'for.reference': 'urn:uuid:123' },
      { 'beneficiary.reference': 'Patient/123' },
      { 'beneficiary.reference': 'urn:uuid:123' },
      { 'agent.who.reference': 'Patient/123' }
    ]
  });
});

test('addPatientFilterToQuery array — fans variants across all ids', () => {
  const q = FhirUtilities.addPatientFilterToQuery(['A', 'B']);
  // 9 clauses per id, in order.
  assert.equal(q.$or.length, 18);
  assert.deepEqual(q.$or[0], { 'patient.reference': 'Patient/A' });
  assert.deepEqual(q.$or[9], { 'patient.reference': 'Patient/B' });
  assert.deepEqual(q.$or[17], { 'agent.who.reference': 'Patient/B' });
});

test('addPatientFilterToQuery single-element array equals single-id output', () => {
  const single = FhirUtilities.addPatientFilterToQuery('123');
  const arr = FhirUtilities.addPatientFilterToQuery(['123']);
  assert.deepEqual(arr, single);
});

test('addPatientFilterToQuery array filters empty/null ids', () => {
  const q = FhirUtilities.addPatientFilterToQuery(['A', null, '', 'B']);
  assert.equal(q.$or.length, 18);
});

test('addPatientFilterToQuery empty array -> public fallback', () => {
  const q = FhirUtilities.addPatientFilterToQuery([]);
  assert.deepEqual(q, {
    $or: [
      { 'patient.reference': 'Patient/public' },
      { 'patient.reference': 'urn:uuid:Patient/public' }
    ]
  });
});

test('addPatientFilterToQuery preserves currentQuery merge for empty/public', () => {
  // practitionerId short-circuits to {} (unchanged behavior).
  const q = FhirUtilities.addPatientFilterToQuery('123', {}, 'prac1');
  assert.deepEqual(q, {});
});
