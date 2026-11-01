// tests/unit/imports/lib/scrubAnalyticsPath.test.mjs
//
// node --test tests/unit/imports/lib/scrubAnalyticsPath.test.mjs
//
// Analytics pageview paths must never carry identifiers: patient/resource
// FHIR ids, Mongo _ids, UUIDs, OAuth codes, unsubscribe tokens. The scrubber
// replaces id-shaped path segments with :id and drops query/hash entirely.

import test from 'node:test';
import assert from 'node:assert/strict';
import { scrubAnalyticsPath } from '../../../../imports/lib/scrubAnalyticsPath.js';

test('static routes pass through unchanged', () => {
  assert.equal(scrubAnalyticsPath('/'), '/');
  assert.equal(scrubAnalyticsPath('/patients'), '/patients');
  assert.equal(scrubAnalyticsPath('/patient-chart'), '/patient-chart');
  assert.equal(scrubAnalyticsPath('/server-configuration'), '/server-configuration');
  assert.equal(scrubAnalyticsPath('/import-data'), '/import-data');
  assert.equal(scrubAnalyticsPath('/provider-directory'), '/provider-directory');
});

test('orbital-homepage landing routes track as distinct pages (not :id)', () => {
  // These are static public marketing slugs with no PHI — every one must
  // reach GA4 as its own route shape, not collapse into the :id bucket.
  assert.equal(scrubAnalyticsPath('/new-lunar-settlers-cookbook'), '/new-lunar-settlers-cookbook');
  assert.equal(scrubAnalyticsPath('/mars-to-table'), '/mars-to-table');
  assert.equal(scrubAnalyticsPath('/lunar-colony-simulator'), '/lunar-colony-simulator');
  // Digit-bearing slug — would be scrubbed to :id without the allowlist.
  assert.equal(scrubAnalyticsPath('/moonbase2026'), '/moonbase2026');
});

test('FHIR and Mongo id segments are replaced with :id', () => {
  // Epic-style FHIR id
  assert.equal(scrubAnalyticsPath('/patients/erXuFYUfucBZaryVksYEcMg3'), '/patients/:id');
  // Mongo ObjectId-shaped hex
  assert.equal(scrubAnalyticsPath('/conditions/5832e8a0ea861706b1857c49'), '/conditions/:id');
  // Meteor Random.id (17 alnum, mixed case)
  assert.equal(scrubAnalyticsPath('/observations/Yqvuwage7hLh82gEb'), '/observations/:id');
  // Synthea/FHIR UUID
  assert.equal(scrubAnalyticsPath('/patients/91f9ab65-1933-2a48-94b1-b6fef00f7335'), '/patients/:id');
  // seed-style ids with digits
  assert.equal(scrubAnalyticsPath('/patients/patient-john-doe-01'), '/patients/:id');
  assert.equal(scrubAnalyticsPath('/encounters/baseehr-a1-1783128628501'), '/encounters/:id');
});

test('multi-id routes scrub every id segment', () => {
  assert.equal(
    scrubAnalyticsPath('/vital-signs/91f9ab65-1933-2a48-94b1-b6fef00f7335/8867-4'),
    '/vital-signs/:id/:id'
  );
  assert.equal(scrubAnalyticsPath('/hipaa/policies/123'), '/hipaa/policies/:id');
});

test('query strings and fragments are dropped entirely (OAuth codes, search terms)', () => {
  assert.equal(
    scrubAnalyticsPath('/patient-fetch?connect-code=abc123secret&connect-state=xyz'),
    '/patient-fetch'
  );
  assert.equal(scrubAnalyticsPath('/patients#section-2'), '/patients');
});

test('token-bearing routes are scrubbed', () => {
  assert.equal(
    scrubAnalyticsPath('/email-list/unsubscribe/eyJhbGciOiJIUzI1NiIsInR5cCI6'),
    '/email-list/unsubscribe/:id'
  );
});

test('handles junk input without throwing', () => {
  assert.equal(scrubAnalyticsPath(''), '/');
  assert.equal(scrubAnalyticsPath(null), '/');
  assert.equal(scrubAnalyticsPath(undefined), '/');
});
