// tests/unit/imports/lib/patientSetFanOut.test.mjs
//
// Unit tests for the pure READ fan-out decision helper (design v2 PR8,
// imports/lib/patientSetFanOut.js). Dependency-free — runs in the bare-checkout
// lib-unit-tests tier (node --test --experimental-detect-module, no npm install).
//
// The compliance contract under test: fan-out happens ONLY for an interactive
// (non-token) user, ONLY when the setting is enabled, ONLY when the target is in
// the account's resolved PatientSet. Any failure → single-id path, byte-for-byte
// identical to pre-PR8 behavior.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import patientSetFanOut from '../../../../imports/lib/patientSetFanOut.js';

const { shouldFanOut, isTokenAuthorizedContext } = patientSetFanOut;

// ── shouldFanOut: the happy path ──────────────────────────────────────────
test('fans out for an interactive user with setting on and target in set', () => {
  const result = shouldFanOut({
    isTokenAuthorized: false,
    settingEnabled: true,
    targetPatientId: 'A',
    memberPatientIds: ['A', 'B', 'C']
  });
  assert.equal(result.fanOut, true);
  assert.deepEqual(result.patientIds, ['A', 'B', 'C']);
});

test('fanned patientIds always contain the target (never dropped)', () => {
  const result = shouldFanOut({
    isTokenAuthorized: false,
    settingEnabled: true,
    targetPatientId: 'B',
    memberPatientIds: ['A', 'B', 'C']
  });
  assert.equal(result.fanOut, true);
  assert.ok(result.patientIds.includes('B'));
});

test('dedupes and normalizes member ids', () => {
  const result = shouldFanOut({
    isTokenAuthorized: false,
    settingEnabled: true,
    targetPatientId: 'A',
    memberPatientIds: ['A', 'A', 'B', '', null, 'B', 'C']
  });
  assert.equal(result.fanOut, true);
  assert.deepEqual(result.patientIds, ['A', 'B', 'C']);
});

// ── Gate 1: token-authorized requests are NEVER fanned out ────────────────
test('does NOT fan out for a token-authorized (OAuth/SMART) request', () => {
  const result = shouldFanOut({
    isTokenAuthorized: true,
    settingEnabled: true,
    targetPatientId: 'A',
    memberPatientIds: ['A', 'B', 'C']
  });
  assert.equal(result.fanOut, false);
  assert.deepEqual(result.patientIds, ['A']);
});

// ── Gate 2: setting default-off ───────────────────────────────────────────
test('does NOT fan out when the setting is disabled', () => {
  const result = shouldFanOut({
    isTokenAuthorized: false,
    settingEnabled: false,
    targetPatientId: 'A',
    memberPatientIds: ['A', 'B', 'C']
  });
  assert.equal(result.fanOut, false);
  assert.deepEqual(result.patientIds, ['A']);
});

test('does NOT fan out when settingEnabled is absent (undefined = off)', () => {
  const result = shouldFanOut({
    isTokenAuthorized: false,
    targetPatientId: 'A',
    memberPatientIds: ['A', 'B', 'C']
  });
  assert.equal(result.fanOut, false);
  assert.deepEqual(result.patientIds, ['A']);
});

// ── Gate 3: target must be in the resolved PatientSet ─────────────────────
test('does NOT fan out when target is not in the member set', () => {
  const result = shouldFanOut({
    isTokenAuthorized: false,
    settingEnabled: true,
    targetPatientId: 'Z',
    memberPatientIds: ['A', 'B', 'C']
  });
  assert.equal(result.fanOut, false);
  assert.deepEqual(result.patientIds, ['Z']);
});

test('does NOT fan out with an empty member set', () => {
  const result = shouldFanOut({
    isTokenAuthorized: false,
    settingEnabled: true,
    targetPatientId: 'A',
    memberPatientIds: []
  });
  assert.equal(result.fanOut, false);
  assert.deepEqual(result.patientIds, ['A']);
});

test('does NOT fan out with a single-member (profile-only) set', () => {
  // profile-only: the account owns exactly its own record. No siblings to widen to,
  // but membership holds, so this fans out over the singleton — a no-op widening
  // (byte-identical result set) that keeps the code path uniform.
  const result = shouldFanOut({
    isTokenAuthorized: false,
    settingEnabled: true,
    targetPatientId: 'A',
    memberPatientIds: ['A']
  });
  assert.equal(result.fanOut, true);
  assert.deepEqual(result.patientIds, ['A']);
});

// ── Edge cases: missing / empty target ────────────────────────────────────
test('does NOT fan out with a missing target id', () => {
  const result = shouldFanOut({
    isTokenAuthorized: false,
    settingEnabled: true,
    targetPatientId: null,
    memberPatientIds: ['A', 'B']
  });
  assert.equal(result.fanOut, false);
  assert.deepEqual(result.patientIds, []);
});

test('handles no options object', () => {
  const result = shouldFanOut();
  assert.equal(result.fanOut, false);
  assert.deepEqual(result.patientIds, []);
});

test('numeric ids are normalized to strings for comparison', () => {
  const result = shouldFanOut({
    isTokenAuthorized: false,
    settingEnabled: true,
    targetPatientId: 42,
    memberPatientIds: [42, 43]
  });
  assert.equal(result.fanOut, true);
  assert.deepEqual(result.patientIds, ['42', '43']);
});

// ── isTokenAuthorizedContext: the interactive/token distinction ───────────
test('isTokenAuthorizedContext: OAuth bearer token → true', () => {
  assert.equal(isTokenAuthorizedContext({ isOAuthToken: true, role: 'patient', userId: 'u1' }), true);
});

test('isTokenAuthorizedContext: OAuth client (basic auth) → true', () => {
  assert.equal(isTokenAuthorizedContext({ isOAuthClient: true, role: 'healthcare provider' }), true);
});

test('isTokenAuthorizedContext: SYSTEM / system / noauth → true', () => {
  assert.equal(isTokenAuthorizedContext({ role: 'SYSTEM', isSystemAccount: true }), true);
  assert.equal(isTokenAuthorizedContext({ role: 'system', userId: 'system' }), true);
  assert.equal(isTokenAuthorizedContext({ role: 'noauth', userId: null }), true);
});

test('isTokenAuthorizedContext: interactive resumed-login user → false', () => {
  // The Bearer-fallback / session-header / dev-auto-login shapes: a real Meteor
  // user _id, a patient/practitioner role, and NEITHER OAuth flag set.
  assert.equal(isTokenAuthorizedContext({ role: 'patient', userId: 'meteorUserId', patientId: 'A' }), false);
  assert.equal(isTokenAuthorizedContext({ role: 'healthcare practitioner', userId: 'meteorUserId' }), false);
});

test('isTokenAuthorizedContext: falsy context → false', () => {
  assert.equal(isTokenAuthorizedContext(null), false);
  assert.equal(isTokenAuthorizedContext(undefined), false);
  assert.equal(isTokenAuthorizedContext(false), false);
});
