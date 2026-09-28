// tests/unit/imports/lib/trendDetection.test.mjs
//
// Unit tests for the trend-detection lib (PHR IG "Trend Detection" algorithm).
// Dependency-free CJS subject — runs in the bare-checkout lib-unit-tests tier
// (node --test, no npm install).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import TrendDetection from '../../../../imports/lib/trendDetection.js';

const {
  MS_PER_DAY,
  CLINICAL_THRESHOLDS,
  thresholdForCode,
  twoSidedPValue,
  linearRegression,
  pointsFromObservations,
  removeOutliers,
  detectTrend
} = TrendDetection;

const T0 = Date.parse('2026-01-01T00:00:00Z');

function dailyPoints(values) {
  return values.map(function(value, i) {
    return { time: T0 + i * MS_PER_DAY, value: value };
  });
}

// ---------------------------------------------------------------------------
// t-distribution
// ---------------------------------------------------------------------------

test('twoSidedPValue matches known t-distribution critical values', function() {
  // t = 2.776, df = 4 is the classic 97.5th percentile → two-sided p = 0.05
  assert.ok(Math.abs(twoSidedPValue(2.776, 4) - 0.05) < 0.001);
  // t = 1.96, large df ≈ normal → p ≈ 0.05
  assert.ok(Math.abs(twoSidedPValue(1.96, 1000) - 0.05) < 0.003);
  // Symmetric in t
  assert.ok(Math.abs(twoSidedPValue(-2.776, 4) - twoSidedPValue(2.776, 4)) < 1e-9);
  // t = 0 → p = 1
  assert.ok(Math.abs(twoSidedPValue(0, 10) - 1) < 1e-9);
  // Infinite t → p = 0
  assert.equal(twoSidedPValue(Infinity, 10), 0);
});

// ---------------------------------------------------------------------------
// Regression
// ---------------------------------------------------------------------------

test('linearRegression recovers an exact line', function() {
  const xs = [0, 1, 2, 3, 4];
  const ys = xs.map(function(x) { return 2 * x + 1; });
  const fit = linearRegression(xs, ys);
  assert.ok(Math.abs(fit.slope - 2) < 1e-9);
  assert.ok(Math.abs(fit.intercept - 1) < 1e-9);
  assert.ok(Math.abs(fit.rSquared - 1) < 1e-9);
  assert.ok(fit.pValue < 0.001);
});

test('linearRegression handles noisy data with a real slope', function() {
  const xs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const noise = [0.3, -0.2, 0.1, -0.4, 0.2, 0.4, -0.1, -0.3, 0.15, -0.05];
  const ys = xs.map(function(x, i) { return 3 * x + 5 + noise[i]; });
  const fit = linearRegression(xs, ys);
  assert.ok(Math.abs(fit.slope - 3) < 0.1);
  assert.ok(fit.rSquared > 0.99);
  assert.ok(fit.pValue < 1e-6);
});

test('linearRegression degenerate cases', function() {
  assert.equal(linearRegression([0, 1], [1, 2]).degenerate, true);
  assert.equal(linearRegression([2, 2, 2], [1, 2, 3]).reason, 'zero-time-variance');
  // Constant y → flat fit, p = 1, not degenerate
  const flat = linearRegression([0, 1, 2, 3], [7, 7, 7, 7]);
  assert.equal(flat.slope, 0);
  assert.equal(flat.pValue, 1);
});

// ---------------------------------------------------------------------------
// Outliers
// ---------------------------------------------------------------------------

test('removeOutliers drops points beyond sigma', function() {
  // Note: with n points, a lone outlier's z-score is bounded by √(n-1), so a
  // 3σ filter needs n ≥ 11 to ever catch one — use a longer series.
  const points = dailyPoints([10, 11, 10, 12, 11, 10, 500, 11, 10, 12, 11, 10, 11, 12, 10]);
  const cleaned = removeOutliers(points, 3);
  assert.equal(cleaned.length, 14);
  assert.ok(!cleaned.some(function(p) { return p.value === 500; }));
});

test('removeOutliers is a no-op for tiny or constant series', function() {
  assert.equal(removeOutliers(dailyPoints([1, 100, 1]), 3).length, 3);
  assert.equal(removeOutliers(dailyPoints([5, 5, 5, 5, 5]), 3).length, 5);
});

// ---------------------------------------------------------------------------
// detectTrend
// ---------------------------------------------------------------------------

test('detectTrend flags a strong increasing trend', function() {
  // Weight climbing ~0.5 kg/day for 10 days — way past the 2 kg/week gate
  const points = dailyPoints([70, 70.4, 71.1, 71.4, 72.1, 72.4, 73.0, 73.6, 74.0, 74.5]);
  const result = detectTrend(points, { clinicalThreshold: thresholdForCode('29463-7') });
  assert.equal(result.significant, true);
  assert.equal(result.direction, 'increasing');
  assert.ok(result.slope > 0.4 && result.slope < 0.6);
  assert.ok(result.rSquared > 0.9);
});

test('detectTrend stays quiet below the clinical threshold', function() {
  // Weight climbing 0.05 kg/day (0.35 kg/week) — statistically real, clinically trivial
  const values = [];
  for (let i = 0; i < 14; i++) { values.push(70 + i * 0.05); }
  const result = detectTrend(dailyPoints(values), { clinicalThreshold: thresholdForCode('29463-7') });
  assert.equal(result.significant, false);
  assert.equal(result.direction, 'increasing');
  assert.ok(result.pValue < 0.05); // statistically significant…
  assert.ok(Math.abs(result.slope) < thresholdForCode('29463-7')); // …but under the gate
});

test('detectTrend stays quiet on noise', function() {
  const result = detectTrend(dailyPoints([10, 12, 9, 11, 10, 13, 9, 10, 12, 11]));
  assert.equal(result.significant, false);
});

test('detectTrend detects decreasing direction', function() {
  const result = detectTrend(dailyPoints([100, 96, 93, 88, 85, 81, 78, 74]));
  assert.equal(result.direction, 'decreasing');
  assert.equal(result.significant, true);
});

test('detectTrend window filtering excludes old points', function() {
  const now = T0 + 40 * MS_PER_DAY;
  // 30 old flat points, then a recent run-up inside the window
  const points = [];
  for (let i = 0; i < 30; i++) { points.push({ time: T0 + i * MS_PER_DAY, value: 70 }); }
  for (let i = 33; i < 40; i++) { points.push({ time: T0 + i * MS_PER_DAY, value: 70 + (i - 33) * 2 }); }
  const windowed = detectTrend(points, { windowDays: 7, now: now });
  assert.equal(windowed.n, 7);
  assert.equal(windowed.significant, true);
  const unwindowed = detectTrend(points, { now: now });
  // Without the window every point is considered (some of the run-up tail may
  // be clipped by the 3σ filter — the window, not the filter, is under test).
  assert.equal(unwindowed.n + unwindowed.outliersRemoved, 37);
  assert.ok(unwindowed.n > windowed.n);
});

test('detectTrend survives outliers via 3σ filter', function() {
  // 15 points climbing 0.5/day with one 500 spike (see √(n-1) bound above)
  const values = [70, 70.5, 71, 71.5, 72, 72.5, 500, 73, 73.5, 74, 74.5, 75, 75.5, 76, 76.5];
  const result = detectTrend(dailyPoints(values));
  assert.equal(result.outliersRemoved, 1);
  assert.equal(result.significant, true);
  assert.ok(result.slope < 1); // the 500 spike didn't poison the fit
});

test('detectTrend reports insufficient data', function() {
  const result = detectTrend(dailyPoints([70, 71]));
  assert.equal(result.significant, false);
  assert.equal(result.insufficientData, true);
  assert.equal(result.reason, 'insufficient-points');
});

test('detectTrend tolerates junk points and ISO strings', function() {
  const points = [
    { time: '2026-01-01T00:00:00Z', value: 10 },
    { time: 'not-a-date', value: 11 },
    { time: '2026-01-02T00:00:00Z', value: 'twelve' },
    null,
    { time: '2026-01-02T00:00:00Z', value: 12 },
    { time: '2026-01-03T00:00:00Z', value: 14 }
  ];
  const result = detectTrend(points);
  assert.equal(result.n, 3);
});

// ---------------------------------------------------------------------------
// FHIR adapters + thresholds
// ---------------------------------------------------------------------------

test('pointsFromObservations extracts effective time + valueQuantity', function() {
  const points = pointsFromObservations([
    { effectiveDateTime: '2026-01-01T08:00:00Z', valueQuantity: { value: 120, unit: 'mmHg' } },
    { issued: '2026-01-02T08:00:00Z', valueQuantity: { value: 118 } },
    { effectivePeriod: { start: '2026-01-03T08:00:00Z' }, valueQuantity: { value: 122 } },
    { effectiveDateTime: '2026-01-04T08:00:00Z', valueString: 'normal' }, // not trendable
    { valueQuantity: { value: 99 } } // no time
  ]);
  assert.equal(points.length, 3);
  assert.equal(points[0].value, 120);
});

test('clinical thresholds table', function() {
  assert.ok(Math.abs(thresholdForCode('29463-7') - 2 / 7) < 1e-9);
  assert.ok(Math.abs(thresholdForCode('8480-6') - 10 / 30) < 1e-9);
  assert.equal(thresholdForCode('0000-0'), 0);
  assert.equal(CLINICAL_THRESHOLDS.length, 4);
});
