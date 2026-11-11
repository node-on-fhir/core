// tests/unit/imports/accounts/lib/ageGate.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { MIN_AGE_YEARS, parseBirthDate, ageInYears, meetsMinimumAge } =
  require('../../../../../imports/accounts/lib/ageGate.js');

const NOW = new Date('2026-11-10T12:00:00Z');

test('MIN_AGE_YEARS is 13 (COPPA floor)', function() {
  assert.equal(MIN_AGE_YEARS, 13);
});

test('parseBirthDate accepts YYYY-MM-DD only', function() {
  assert.ok(parseBirthDate('2000-01-31') instanceof Date);
  assert.equal(parseBirthDate('01/31/2000'), null);
  assert.equal(parseBirthDate('2000-1-31'), null);
  assert.equal(parseBirthDate(''), null);
  assert.equal(parseBirthDate(null), null);
  assert.equal(parseBirthDate('2000-13-45'), null); // invalid calendar date
});

test('ageInYears handles birthday-not-yet-reached correctly', function() {
  assert.equal(ageInYears('2013-11-10', NOW), 13); // 13th birthday is today
  assert.equal(ageInYears('2013-11-11', NOW), 12); // 13 tomorrow -> still 12
  assert.equal(ageInYears('2013-11-09', NOW), 13);
  assert.equal(ageInYears('not-a-date', NOW), null);
});

test('meetsMinimumAge: exactly 13 today passes, 13 tomorrow fails', function() {
  assert.equal(meetsMinimumAge('2013-11-10', NOW), true);
  assert.equal(meetsMinimumAge('2013-11-11', NOW), false);
});

test('meetsMinimumAge rejects garbage, future dates, and implausible ages', function() {
  assert.equal(meetsMinimumAge('', NOW), false);
  assert.equal(meetsMinimumAge(undefined, NOW), false);
  assert.equal(meetsMinimumAge('2030-01-01', NOW), false); // future
  assert.equal(meetsMinimumAge('1880-01-01', NOW), false); // > 130 years
  assert.equal(meetsMinimumAge('1950-06-15', NOW), true);
});
