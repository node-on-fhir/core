// tests/unit/imports/lib/importTimeRange.test.mjs
//
// npm run test:import-time-range
// node --experimental-detect-module --test tests/unit/imports/lib/importTimeRange.test.mjs
//
// Time-range presets + resolver for import filtering (Apple Health today).
// `now` is injected so semantics are pinned: rolling windows for pastNDays /
// lastMonth / lastYear / last5Years / lastDecade, calendar units for
// yesterday and lastQuarter, inclusive date-only bounds for custom.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TIME_RANGE_OPTIONS,
  resolveTimeRange
} from '../../../../imports/lib/importTimeRange.js';

// Wed 2026-09-03 10:30 local
const NOW = new Date(2026, 8, 3, 10, 30, 0);

test('options list covers every preset plus custom, all-data first', function() {
  const values = TIME_RANGE_OPTIONS.map(function(option) { return option.value; });
  assert.equal(values[0], 'all');
  ['all', 'yesterday', 'past7Days', 'past30Days', 'lastQuarter', 'lastMonth',
   'lastYear', 'last5Years', 'lastDecade', 'custom'].forEach(function(value) {
    assert.ok(values.includes(value), 'missing option: ' + value);
  });
  TIME_RANGE_OPTIONS.forEach(function(option) {
    assert.ok(option.label && option.label.length > 0, 'label missing for ' + option.value);
  });
});

test('all returns open bounds', function() {
  const range = resolveTimeRange('all', null, NOW);
  assert.equal(range.start, null);
  assert.equal(range.end, null);
});

test('yesterday is the previous calendar day, inclusive', function() {
  const range = resolveTimeRange('yesterday', null, NOW);
  assert.equal(range.start.getTime(), new Date(2026, 8, 2, 0, 0, 0, 0).getTime());
  assert.equal(range.end.getTime(), new Date(2026, 8, 2, 23, 59, 59, 999).getTime());
});

test('past7Days and past30Days are rolling windows ending now (no end bound)', function() {
  const seven = resolveTimeRange('past7Days', null, NOW);
  assert.equal(seven.start.getTime(), new Date(2026, 7, 27, 10, 30, 0).getTime());
  assert.equal(seven.end, null);

  const thirty = resolveTimeRange('past30Days', null, NOW);
  assert.equal(thirty.start.getTime(), new Date(2026, 7, 4, 10, 30, 0).getTime());
  assert.equal(thirty.end, null);
});

test('lastQuarter is the previous full calendar quarter', function() {
  // NOW is in Q3 2026 → last quarter is Q2: Apr 1 through Jun 30
  const range = resolveTimeRange('lastQuarter', null, NOW);
  assert.equal(range.start.getTime(), new Date(2026, 3, 1, 0, 0, 0, 0).getTime());
  assert.equal(range.end.getTime(), new Date(2026, 5, 30, 23, 59, 59, 999).getTime());
});

test('lastQuarter in Q1 wraps to Q4 of the previous year', function() {
  const febNow = new Date(2026, 1, 15, 9, 0, 0);
  const range = resolveTimeRange('lastQuarter', null, febNow);
  assert.equal(range.start.getTime(), new Date(2025, 9, 1, 0, 0, 0, 0).getTime());
  assert.equal(range.end.getTime(), new Date(2025, 11, 31, 23, 59, 59, 999).getTime());
});

test('rolling month/year presets preserve the legacy semantics', function() {
  assert.equal(resolveTimeRange('lastMonth', null, NOW).start.getTime(), new Date(2026, 7, 3, 10, 30, 0).getTime());
  assert.equal(resolveTimeRange('lastYear', null, NOW).start.getTime(), new Date(2025, 8, 3, 10, 30, 0).getTime());
  assert.equal(resolveTimeRange('last5Years', null, NOW).start.getTime(), new Date(2021, 8, 3, 10, 30, 0).getTime());
  assert.equal(resolveTimeRange('lastDecade', null, NOW).start.getTime(), new Date(2016, 8, 3, 10, 30, 0).getTime());
  assert.equal(resolveTimeRange('lastMonth', null, NOW).end, null);
});

test('custom range: date-only strings, inclusive both ends', function() {
  const range = resolveTimeRange('custom', { start: '2020-01-15', end: '2020-06-30' }, NOW);
  assert.equal(range.start.getTime(), new Date(2020, 0, 15, 0, 0, 0, 0).getTime());
  assert.equal(range.end.getTime(), new Date(2020, 5, 30, 23, 59, 59, 999).getTime());
});

test('custom range: either side may be open', function() {
  const startOnly = resolveTimeRange('custom', { start: '2020-01-15', end: '' }, NOW);
  assert.equal(startOnly.start.getTime(), new Date(2020, 0, 15, 0, 0, 0, 0).getTime());
  assert.equal(startOnly.end, null);

  const endOnly = resolveTimeRange('custom', { start: null, end: '2020-06-30' }, NOW);
  assert.equal(endOnly.start, null);
  assert.equal(endOnly.end.getTime(), new Date(2020, 5, 30, 23, 59, 59, 999).getTime());
});

test('custom range with invalid or missing dates degrades to open bounds', function() {
  const range = resolveTimeRange('custom', { start: 'garbage', end: undefined }, NOW);
  assert.equal(range.start, null);
  assert.equal(range.end, null);
  const noCustom = resolveTimeRange('custom', null, NOW);
  assert.equal(noCustom.start, null);
  assert.equal(noCustom.end, null);
});

test('unknown preset degrades to open bounds (permissive-in)', function() {
  const range = resolveTimeRange('bogus', null, NOW);
  assert.equal(range.start, null);
  assert.equal(range.end, null);
});
