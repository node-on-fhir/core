// tests/unit/imports/api/dedup/engine.test.mjs
//
// Unit tests for the dedup engine's pure-ish surface: sanitizeForDedup and
// findExistingDuplicate. engine.js imports meteor/* (unavailable under plain
// node --test), so the test bundles it with esbuild — a repo dependency — and
// stubs the meteor modules virtually. Runs in the npm-installed CI tier
// (needs node_modules; NOT the bare-checkout lib-unit-tests job).
//
// Run: npm run test:dedup-engine

import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const require_ = createRequire(path.join(repoRoot, 'package.json'));
const esbuild = require_('esbuild');

const METEOR_STUB = `
export const Meteor = {
  Logger: null,
  Error: class MeteorError extends Error {
    constructor(code, reason) { super(reason || code); this.error = code; this.reason = reason; }
  }
};
export const Random = { id: function() { return 'rnd' + Math.random().toString(36).slice(2, 10); } };
`;

const meteorStubPlugin = {
  name: 'meteor-stub',
  setup(build) {
    build.onResolve({ filter: /^meteor\// }, function(args) {
      return { path: args.path, namespace: 'meteor-stub' };
    });
    build.onLoad({ filter: /.*/, namespace: 'meteor-stub' }, function() {
      return { contents: METEOR_STUB, loader: 'js' };
    });
    // Host-root absolute imports ('/imports/...') resolve against the repo
    build.onResolve({ filter: /^\/imports\// }, function(args) {
      return { path: path.join(repoRoot, args.path) };
    });
  }
};

async function loadEngine() {
  const outfile = path.join(os.tmpdir(), 'dedup-engine-test-' + process.pid + '.mjs');
  await esbuild.build({
    entryPoints: [path.join(repoRoot, 'imports/api/dedup/engine.js')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: outfile,
    absWorkingDir: repoRoot,
    plugins: [meteorStubPlugin],
    logLevel: 'silent'
  });
  const engine = await import(pathToFileURL(outfile).href);
  fs.unlinkSync(outfile);
  return engine;
}

const enginePromise = loadEngine();

// Minimal collection double implementing the surface findExistingDuplicate
// uses: find(selector, options).fetchAsync().
function fakeCollection(docs) {
  return {
    find: function(selector, options) {
      return {
        fetchAsync: async function() {
          // Selector fidelity isn't under test — return everything, bounded.
          const limit = (options && options.limit) || docs.length;
          return docs.slice(0, limit);
        }
      };
    }
  };
}

function molecularSequence(runId, overrides) {
  return Object.assign({
    _id: 'seq-' + runId,
    resourceType: 'MolecularSequence',
    type: 'dna',
    patient: { reference: 'Patient/abc' },
    referenceSeq: { genomeBuild: 'GRCh37', referenceSeqId: { text: 'GRCh37 / 23andMe v4' } },
    meta: {
      tag: [
        { system: 'urn:honeycomb:import-run', code: runId, display: 'Import Run ' + runId },
        { system: 'urn:honeycomb:import-type', code: 'genomics', display: 'Import Type: genomics' }
      ]
    }
  }, overrides || {});
}

test('sanitizeForDedup strips run/type tags but keeps other tags', async function() {
  const { sanitizeForDedup } = await enginePromise;
  const doc = molecularSequence('run1');
  doc.meta.tag.push({ system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason', code: 'HTEST' });

  const clean = sanitizeForDedup(doc);
  assert.equal(clean.meta.tag.length, 1);
  assert.equal(clean.meta.tag[0].code, 'HTEST');
  // Original untouched
  assert.equal(doc.meta.tag.length, 3);
});

test('sanitizeForDedup removes empty meta entirely', async function() {
  const { sanitizeForDedup } = await enginePromise;
  const clean = sanitizeForDedup(molecularSequence('run1'));
  assert.equal(clean.meta, undefined);
});

test('findExistingDuplicate matches identical content across different import runs', async function() {
  const { findExistingDuplicate } = await enginePromise;
  const stored = molecularSequence('run1');
  const incoming = molecularSequence('run2', { _id: 'seq-new' });

  const hit = await findExistingDuplicate(fakeCollection([stored]), incoming);
  assert.ok(hit, 'expected a duplicate hit');
  assert.equal(hit._id, 'seq-run1');
});

test('findExistingDuplicate matches by business identifier despite differing content', async function() {
  const { findExistingDuplicate } = await enginePromise;
  const stored = { _id: 'a', resourceType: 'Observation', subject: { reference: 'Patient/abc' },
    identifier: [{ system: 'urn:x', value: 'same' }], valueString: 'v1' };
  const incoming = { _id: 'b', resourceType: 'Observation', subject: { reference: 'Patient/abc' },
    identifier: [{ system: 'urn:x', value: 'same' }], valueString: 'v2' };

  const hit = await findExistingDuplicate(fakeCollection([stored]), incoming);
  assert.ok(hit);
  assert.equal(hit._id, 'a');
});

test('findExistingDuplicate returns null for genuinely different content', async function() {
  const { findExistingDuplicate } = await enginePromise;
  const stored = molecularSequence('run1');
  const incoming = molecularSequence('run2', {
    _id: 'seq-new',
    referenceSeq: { genomeBuild: 'GRCh38', referenceSeqId: { text: 'GRCh38 / WGS' } }
  });

  const hit = await findExistingDuplicate(fakeCollection([stored]), incoming);
  assert.equal(hit, null);
});

test('findExistingDuplicate ignores the same stored document', async function() {
  const { findExistingDuplicate } = await enginePromise;
  const stored = molecularSequence('run1');
  const hit = await findExistingDuplicate(fakeCollection([stored]), stored);
  assert.equal(hit, null);
});

test('findExistingDuplicate degrades to null on collection failure', async function() {
  const { findExistingDuplicate } = await enginePromise;
  const broken = {
    find: function() { return { fetchAsync: async function() { throw new Error('boom'); } }; }
  };
  const hit = await findExistingDuplicate(broken, molecularSequence('run1'));
  assert.equal(hit, null);
});

// ---------------------------------------------------------------------------
// analyzeScope: fuzzy candidates + identifier normalization (opt-in paths)
// ---------------------------------------------------------------------------

function heartRate(id, overrides) {
  return Object.assign({
    _id: id,
    resourceType: 'Observation',
    category: [{ coding: [{ code: 'vital-signs' }] }],
    code: { coding: [{ system: 'http://loinc.org', code: '8867-4' }] },
    subject: { reference: 'Patient/p1' },
    effectiveDateTime: '2026-01-01T08:00:00Z',
    valueQuantity: { value: 72, unit: 'beats/min' }
  }, overrides || {});
}

function withObservations(docs, run) {
  const previous = global.Collections;
  global.Collections = { Observations: fakeCollection(docs) };
  return run().finally(function() { global.Collections = previous; });
}

test('analyzeScope fuzzy mode surfaces near-duplicates, excludes exact groups', async function() {
  const { analyzeScope } = await enginePromise;
  const docs = [
    heartRate('obs-1'),
    // 2 minutes later, one beat different — fingerprints differ, fuzzy ≈ 0.99
    heartRate('obs-2', { effectiveDateTime: '2026-01-01T08:02:00Z', valueQuantity: { value: 73, unit: 'beats/min' } }),
    // 6 hours later — a distinct reading, below the 0.95 vitals threshold
    heartRate('obs-3', { effectiveDateTime: '2026-01-01T14:00:00Z' }),
    // exact copy of obs-1 → deterministic content group, must NOT re-appear as fuzzy
    heartRate('obs-4')
  ];

  await withObservations(docs, async function() {
    const scope = { kind: 'collection', resourceType: 'Observation' };

    const plain = await analyzeScope(scope, {});
    assert.deepEqual(plain.fuzzyCandidates, []);
    assert.equal(plain.stats.fuzzyCandidates, undefined);

    const analyzed = await analyzeScope(scope, { fuzzy: true });
    // obs-1/obs-4 collapse deterministically (exact content)…
    assert.equal(analyzed.duplicateGroups.length, 1);
    assert.equal(analyzed.duplicateGroups[0].reason, 'content');
    // …and the fuzzy pass reports obs-2 against BOTH copies, but never the
    // exact pair itself and never the 6h-distant reading.
    assert.ok(analyzed.fuzzyCandidates.length >= 1);
    analyzed.fuzzyCandidates.forEach(function(candidate) {
      const ids = [candidate.a._id, candidate.b._id].sort();
      assert.ok(ids.includes('obs-2'), 'unexpected fuzzy pair: ' + ids.join(','));
      assert.ok(!ids.includes('obs-3'));
      assert.ok(candidate.score >= 0.95);
      assert.equal(candidate.profileKey, 'Observation:vital-signs');
    });
    assert.equal(analyzed.stats.fuzzyCandidates, analyzed.fuzzyCandidates.length);
    assert.equal(analyzed.stats.fuzzyTruncated, false);
  });
});

test('analyzeScope normalizeIdentifiers groups formatting-variant identifiers', async function() {
  const { analyzeScope } = await enginePromise;
  const docs = [
    heartRate('obs-a', { identifier: [{ system: 'urn:mrn', value: 'mrn-12 34' }], valueQuantity: { value: 70, unit: 'beats/min' } }),
    heartRate('obs-b', { identifier: [{ system: 'urn:mrn', value: 'MRN1234' }], valueQuantity: { value: 75, unit: 'beats/min' } })
  ];

  await withObservations(docs, async function() {
    const scope = { kind: 'collection', resourceType: 'Observation' };

    const raw = await analyzeScope(scope, {});
    assert.equal(raw.duplicateGroups.length, 0); // raw keys differ

    const normalized = await analyzeScope(scope, { normalizeIdentifiers: true });
    assert.equal(normalized.duplicateGroups.length, 1);
    assert.equal(normalized.duplicateGroups[0].reason, 'identifier');
  });
});
