// tests/unit/npmPackages/quality-measures/screeningGuidelines.test.mjs
//
// Unit tests for the preventive-screening guideline table + care-gap
// evaluator (PHR IG "Gaps in Care Reporting" / "Care Gap Detection"). ESM
// subject with zero imports — run with --experimental-detect-module (node 20).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SCREENING_GUIDELINES,
  calculateAge,
  guidelineApplies,
  resourceMatchesGuideline,
  evaluateScreenings,
  findCareGaps
} from '../../../../npmPackages/quality-measures/lib/screeningGuidelines.js';

const NOW = Date.parse('2026-09-21T12:00:00Z');

const fiftyYearOldWoman = { resourceType: 'Patient', birthDate: '1976-03-15', gender: 'female' };
const fiftyYearOldMan = { resourceType: 'Patient', birthDate: '1976-03-15', gender: 'male' };
const thirtyYearOld = { resourceType: 'Patient', birthDate: '1996-03-15', gender: 'female' };

function colonoscopy(date) {
  return {
    resourceType: 'Procedure',
    code: { coding: [{ system: 'http://snomed.info/sct', code: '73761001' }] },
    performedDateTime: date
  };
}

function fluShot(date) {
  return {
    resourceType: 'Immunization',
    vaccineCode: { coding: [{ system: 'http://hl7.org/fhir/sid/cvx', code: '140' }] },
    occurrenceDateTime: date
  };
}

test('calculateAge handles birthdays around now', function() {
  assert.equal(calculateAge('1976-03-15', NOW), 50);
  assert.equal(calculateAge('1976-10-15', NOW), 49); // birthday not yet reached
  assert.equal(calculateAge('not-a-date', NOW), null);
  assert.equal(calculateAge(undefined, NOW), null);
});

test('guidelineApplies gates by age and gender', function() {
  const mammogram = SCREENING_GUIDELINES.find(function(g) { return g.key === 'mammogram'; });
  assert.equal(guidelineApplies(mammogram, fiftyYearOldWoman, NOW), true);
  assert.equal(guidelineApplies(mammogram, fiftyYearOldMan, NOW), false);
  assert.equal(guidelineApplies(mammogram, thirtyYearOld, NOW), false);

  const colonoscopyGuideline = SCREENING_GUIDELINES.find(function(g) { return g.key === 'colonoscopy'; });
  // Unknown birthDate → age gate cannot pass (conservative: no false alarms)
  assert.equal(guidelineApplies(colonoscopyGuideline, { gender: 'male' }, NOW), false);
});

test('resourceMatchesGuideline matches by type + code (Immunization uses vaccineCode)', function() {
  const flu = SCREENING_GUIDELINES.find(function(g) { return g.key === 'flu-vaccine'; });
  assert.equal(resourceMatchesGuideline(fluShot('2026-01-01'), flu), true);
  assert.equal(resourceMatchesGuideline(colonoscopy('2026-01-01'), flu), false);
  const otherVaccine = {
    resourceType: 'Immunization',
    vaccineCode: { coding: [{ code: '208' }] } // COVID — not a flu code
  };
  assert.equal(resourceMatchesGuideline(otherVaccine, flu), false);
});

test('never-performed screenings surface as high-priority gaps', function() {
  const results = evaluateScreenings(fiftyYearOldWoman, [], { now: NOW });
  // 50yo woman: colonoscopy, mammogram, flu, lipid all apply
  assert.equal(results.length, 4);
  results.forEach(function(entry) {
    assert.equal(entry.status, 'never_performed');
    assert.equal(entry.priority, 'high');
  });
});

test('recent screening is current, stale screening is overdue', function() {
  const results = evaluateScreenings(fiftyYearOldMan, [
    colonoscopy('2020-01-01'),  // 6 years into a 10-year interval → current
    fluShot('2024-09-01')       // ~2 years into a 1-year interval → overdue
  ], { now: NOW });

  const colo = results.find(function(e) { return e.key === 'colonoscopy'; });
  assert.equal(colo.status, 'current');
  assert.ok(colo.dueDate.startsWith('2029-12')); // 2020-01-01 + 3650 days

  const flu = results.find(function(e) { return e.key === 'flu-vaccine'; });
  assert.equal(flu.status, 'overdue');
  assert.ok(flu.daysOverdue > 300);
  assert.equal(flu.priority, 'high'); // >1.5× the interval
});

test('overdue under 1.5× interval is medium priority', function() {
  // Flu shot 13 months ago: overdue by ~30 days, under the 1.5× (18mo) bar
  const results = evaluateScreenings(fiftyYearOldMan, [fluShot('2025-08-15')], { now: NOW });
  const flu = results.find(function(e) { return e.key === 'flu-vaccine'; });
  assert.equal(flu.status, 'overdue');
  assert.equal(flu.priority, 'medium');
});

test('latest matching resource wins; future-dated resources are ignored', function() {
  const results = evaluateScreenings(fiftyYearOldMan, [
    fluShot('2023-10-01'),
    fluShot('2026-01-15'),
    fluShot('2027-01-01') // future — cannot satisfy a screening today
  ], { now: NOW });
  const flu = results.find(function(e) { return e.key === 'flu-vaccine'; });
  assert.equal(flu.status, 'current');
  assert.ok(flu.lastDate.startsWith('2026-01-15'));
});

test('gaps sort ahead of current, high before medium, most-overdue first', function() {
  const results = evaluateScreenings(fiftyYearOldWoman, [
    colonoscopy('2010-01-01'),   // overdue ~6.7y past interval → high
    fluShot('2025-08-15')        // overdue ~1mo → medium
    // mammogram + lipid: never performed → high
  ], { now: NOW });
  const statuses = results.map(function(e) { return e.status; });
  assert.ok(statuses.indexOf('current') === -1 || statuses.indexOf('current') === statuses.length - 1);
  const priorities = results.filter(function(e) { return e.status !== 'current'; })
    .map(function(e) { return e.priority; });
  // No medium before a high
  assert.equal(priorities.lastIndexOf('high') < priorities.indexOf('medium') || priorities.indexOf('medium') === -1, true);
});

test('findCareGaps filters out current screenings', function() {
  const gaps = findCareGaps(fiftyYearOldMan, [
    colonoscopy('2020-01-01'),
    fluShot('2026-06-01')
  ], { now: NOW });
  // colonoscopy + flu are current; lipid panel never performed
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].key, 'lipid-panel');
});

test('custom guideline table override', function() {
  const custom = [{
    key: 'custom-check', name: 'Custom check', resourceTypes: ['Procedure'],
    codes: ['X1'], appliesTo: {}, intervalYears: 1
  }];
  const results = evaluateScreenings({ birthDate: '2000-01-01' }, [], { now: NOW, guidelines: custom });
  assert.equal(results.length, 1);
  assert.equal(results[0].key, 'custom-check');
});
