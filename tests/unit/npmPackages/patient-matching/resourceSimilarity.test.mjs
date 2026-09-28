// tests/unit/npmPackages/patient-matching/resourceSimilarity.test.mjs
//
// Unit tests for fuzzy resource similarity (PHR IG weighted similarity with
// per-resource-type tolerances/thresholds). ESM subjects with zero external
// imports — run with --experimental-detect-module (node 20).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  similarity,
  findSimilarPairs,
  resolveProfile,
  primaryDate
} from '../../../../npmPackages/patient-matching/lib/resourceSimilarity.js';
import {
  SIMILARITY_PROFILES,
  DEFAULT_WEIGHTS
} from '../../../../npmPackages/patient-matching/lib/constants/similarityProfiles.js';

const HOUR = 3600000;
const DAY = 86400000;

function vitalObs(overrides) {
  return Object.assign({
    resourceType: 'Observation',
    category: [{ coding: [{ code: 'vital-signs' }] }],
    code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] },
    subject: { reference: 'Patient/p1' },
    effectiveDateTime: '2026-01-01T08:00:00Z',
    valueQuantity: { value: 72, unit: 'beats/min' }
  }, overrides || {});
}

function condition(overrides) {
  return Object.assign({
    resourceType: 'Condition',
    code: { coding: [{ system: 'http://snomed.info/sct', code: '44054006', display: 'Diabetes' }] },
    subject: { reference: 'Patient/p1' },
    onsetDateTime: '2025-06-01T00:00:00Z'
  }, overrides || {});
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

test('profile resolution: Observation splits by category', function() {
  assert.equal(resolveProfile(vitalObs()).key, 'Observation:vital-signs');
  assert.equal(resolveProfile(vitalObs()).dateToleranceMs, HOUR);
  assert.equal(resolveProfile(vitalObs()).threshold, 0.95);

  const lab = vitalObs({ category: [{ coding: [{ code: 'laboratory' }] }] });
  assert.equal(resolveProfile(lab).key, 'Observation:laboratory');
  assert.equal(resolveProfile(lab).dateToleranceMs, DAY);

  const uncategorized = vitalObs({ category: undefined });
  assert.equal(resolveProfile(uncategorized).key, 'Observation');

  assert.equal(resolveProfile(condition()).threshold, 0.85);
  assert.equal(resolveProfile(condition()).dateToleranceMs, 30 * DAY);
  assert.equal(resolveProfile({ resourceType: 'Goal' }).key, 'Goal'); // → default values
  assert.equal(resolveProfile({ resourceType: 'Goal' }).threshold, SIMILARITY_PROFILES.default.threshold);
});

test('primaryDate per resource type', function() {
  assert.equal(primaryDate(condition()), Date.parse('2025-06-01T00:00:00Z'));
  assert.equal(primaryDate({ resourceType: 'Condition', recordedDate: '2025-07-01T00:00:00Z' }),
    Date.parse('2025-07-01T00:00:00Z'));
  assert.equal(primaryDate({ resourceType: 'MedicationRequest', authoredOn: '2025-01-15T00:00:00Z' }),
    Date.parse('2025-01-15T00:00:00Z'));
  assert.equal(primaryDate({ resourceType: 'Procedure', performedPeriod: { start: '2025-02-01T00:00:00Z' } }),
    Date.parse('2025-02-01T00:00:00Z'));
  assert.equal(primaryDate({ resourceType: 'Observation' }), null);
});

// ---------------------------------------------------------------------------
// similarity()
// ---------------------------------------------------------------------------

test('identical vitals score 1.0', function() {
  const result = similarity(vitalObs(), vitalObs());
  assert.equal(result.comparable, true);
  assert.ok(Math.abs(result.score - 1) < 1e-9);
  assert.equal(result.components.code, 1);
  assert.equal(result.components.date, 1);
  assert.equal(result.components.value, 1);
  assert.equal(result.components.context, 1);
});

test('same vital 30 minutes apart lands below the strict vitals threshold', function() {
  const later = vitalObs({ effectiveDateTime: '2026-01-01T08:30:00Z' });
  const result = similarity(vitalObs(), later);
  // date component = 1 - 30min/1h = 0.5 → 0.4·1 + 0.3·0.5 + 0.2·1 + 0.1·1 = 0.85
  assert.ok(Math.abs(result.score - 0.85) < 1e-9);
  assert.ok(result.score < resolveProfile(vitalObs()).threshold); // 0.85 < 0.95 — not a candidate
});

test('same vital 2 hours apart: date component floors at 0', function() {
  const later = vitalObs({ effectiveDateTime: '2026-01-01T10:00:00Z' });
  const result = similarity(vitalObs(), later);
  assert.equal(result.components.date, 0);
  assert.ok(Math.abs(result.score - 0.7) < 1e-9); // 0.4 + 0 + 0.2 + 0.1
});

test('different codes are comparable but score toward 0', function() {
  const bp = vitalObs({ code: { coding: [{ system: 'http://loinc.org', code: '8480-6' }] } });
  const result = similarity(vitalObs(), bp);
  assert.equal(result.comparable, true);
  assert.equal(result.components.code, 0);
  assert.ok(result.score < 0.7);
});

test('no codings at all → not comparable', function() {
  const bare1 = { resourceType: 'Observation', effectiveDateTime: '2026-01-01T08:00:00Z' };
  const result = similarity(bare1, vitalObs());
  assert.equal(result.comparable, false);
  assert.equal(result.score, 0);
});

test('cross-type and Patient pairs are not comparable', function() {
  assert.equal(similarity(condition(), vitalObs()).comparable, false);
  assert.equal(similarity({ resourceType: 'Patient' }, { resourceType: 'Patient' }).comparable, false);
});

test('missing components drop out of the weight rather than penalizing', function() {
  // Conditions have no value[x]; both carry code+date+subject
  const c1 = condition();
  const c2 = condition({ onsetDateTime: '2025-06-10T00:00:00Z' }); // 9 days into 30-day tolerance
  const result = similarity(c1, c2);
  assert.equal(result.components.value, null);
  // weights renormalize over code 0.4 + date 0.3 + context 0.1 = 0.8
  const expectedDate = 1 - (9 * DAY) / (30 * DAY);
  const expected = (0.4 * 1 + 0.3 * expectedDate + 0.1 * 1) / 0.8;
  assert.ok(Math.abs(result.score - expected) < 1e-9);
  assert.ok(result.score >= 0.85); // clears the Condition θ → candidate
});

test('mismatched units score value 0 (different measurements until UCUM says otherwise)', function() {
  const kg = vitalObs({ code: { coding: [{ code: '29463-7' }] }, valueQuantity: { value: 70, unit: 'kg' } });
  const lb = vitalObs({ code: { coding: [{ code: '29463-7' }] }, valueQuantity: { value: 154, unit: 'lb' } });
  const result = similarity(kg, lb);
  assert.equal(result.components.value, 0);
});

test('numeric values compare by relative difference', function() {
  const a = vitalObs({ valueQuantity: { value: 100, unit: 'beats/min' } });
  const b = vitalObs({ valueQuantity: { value: 90, unit: 'beats/min' } });
  const result = similarity(a, b);
  assert.ok(Math.abs(result.components.value - 0.9) < 1e-9);
});

test('different subjects zero the context component', function() {
  const other = vitalObs({ subject: { reference: 'Patient/p2' } });
  const result = similarity(vitalObs(), other);
  assert.equal(result.components.context, 0);
  assert.ok(Math.abs(result.score - 0.9) < 1e-9); // 0.4 + 0.3 + 0.2 + 0
});

// ---------------------------------------------------------------------------
// findSimilarPairs()
// ---------------------------------------------------------------------------

test('findSimilarPairs surfaces near-duplicate vitals above θ', function() {
  const resources = [
    vitalObs(),                                                        // 0
    vitalObs({ effectiveDateTime: '2026-01-01T08:02:00Z' }),           // 1 — 2 min later ≈ certain dup
    vitalObs({ effectiveDateTime: '2026-01-01T14:00:00Z' }),           // 2 — 6h later, distinct reading
    condition(),                                                       // 3
    { resourceType: 'Patient', id: 'p1' }                              // 4 — skipped
  ];
  const result = findSimilarPairs(resources);
  assert.equal(result.truncated, false);
  assert.equal(result.pairs.length, 1);
  assert.deepEqual([result.pairs[0].aIndex, result.pairs[0].bIndex].sort(), [0, 1]);
  assert.equal(result.pairs[0].profileKey, 'Observation:vital-signs');
  assert.ok(result.pairs[0].score >= 0.95);
});

test('findSimilarPairs blocks by coding: disjoint codes are never compared', function() {
  const resources = [
    vitalObs(),
    vitalObs({ code: { coding: [{ system: 'http://loinc.org', code: '8480-6' }] } })
  ];
  const result = findSimilarPairs(resources);
  assert.equal(result.comparisons, 0);
  assert.equal(result.pairs.length, 0);
});

test('findSimilarPairs finds Condition candidates within the 30-day window', function() {
  const resources = [
    condition(),
    condition({ onsetDateTime: '2025-06-05T00:00:00Z' }),  // 4 days apart
    condition({ onsetDateTime: '2026-01-01T00:00:00Z' })   // 7 months apart
  ];
  const result = findSimilarPairs(resources);
  const pairIndexSets = result.pairs.map(function(p) { return [p.aIndex, p.bIndex].sort().join(','); });
  assert.ok(pairIndexSets.includes('0,1'));
  assert.ok(!pairIndexSets.includes('0,2'));
});

test('findSimilarPairs threshold override and truncation guard', function() {
  const resources = [
    vitalObs(),
    vitalObs({ effectiveDateTime: '2026-01-01T08:30:00Z' }) // scores 0.85
  ];
  assert.equal(findSimilarPairs(resources).pairs.length, 0);                       // 0.85 < θ 0.95
  assert.equal(findSimilarPairs(resources, { threshold: 0.8 }).pairs.length, 1);   // override

  const truncated = findSimilarPairs([vitalObs(), vitalObs(), vitalObs()], { maxComparisons: 1 });
  assert.equal(truncated.truncated, true);
  assert.equal(truncated.comparisons, 1);
});

test('weights are overridable and default weights sum to 1', function() {
  const total = Object.keys(DEFAULT_WEIGHTS).reduce(function(sum, k) { return sum + DEFAULT_WEIGHTS[k]; }, 0);
  assert.ok(Math.abs(total - 1) < 1e-9);
  const later = vitalObs({ effectiveDateTime: '2026-01-01T08:30:00Z' });
  const dateHeavy = similarity(vitalObs(), later, { weights: { code: 0.1, date: 0.7, value: 0.1, context: 0.1 } });
  assert.ok(dateHeavy.score < 0.85); // date dominates and date is only 0.5
});
