// tests/unit/npmPackages/patient-matching/normalizeIdentifier.test.mjs
//
// Unit tests for patient-identifier normalization (PHR IG "Normalize Patient
// Identifiers" algorithm). ESM subject with zero imports — run with
// --experimental-detect-module (node 20).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SYSTEM_RULES,
  normalizeIdentifierValue,
  normalizeIdentifier
} from '../../../../npmPackages/patient-matching/lib/normalizeIdentifier.js';

test('rejects empty and non-string input', function() {
  assert.equal(normalizeIdentifierValue('').valid, false);
  assert.equal(normalizeIdentifierValue('   ').valid, false);
  assert.equal(normalizeIdentifierValue(null).valid, false);
  assert.equal(normalizeIdentifierValue(12345).valid, false);
  assert.equal(normalizeIdentifierValue(undefined).valid, false);
  assert.equal(normalizeIdentifierValue('').value, null);
});

test('case folds and strips whitespace + separators', function() {
  assert.equal(normalizeIdentifierValue('  mrn-12 34  ').value, 'MRN1234');
  assert.equal(normalizeIdentifierValue('abc.def/ghi').value, 'ABCDEFGHI');
  assert.equal(normalizeIdentifierValue('a b\tc\nd').value, 'ABCD');
});

test('caseMode option controls folding', function() {
  assert.equal(normalizeIdentifierValue('MrN-99', { caseMode: 'lower' }).value, 'mrn99');
  assert.equal(normalizeIdentifierValue('MrN-99', { caseMode: 'preserve' }).value, 'MrN99');
});

test('stripSeparators can be disabled (separators then invalidate)', function() {
  const result = normalizeIdentifierValue('mrn-1234', { stripSeparators: false });
  assert.equal(result.valid, false);
  assert.ok(result.issues.includes('disallowed-characters'));
});

test('disallowed characters invalidate rather than silently drop', function() {
  // '#' is not a separator — dropping it could collide distinct identifiers
  const result = normalizeIdentifierValue('mrn#1234');
  assert.equal(result.valid, false);
  assert.equal(result.value, null);
  assert.ok(result.issues.includes('disallowed-characters'));
});

test('length bounds enforced', function() {
  assert.equal(normalizeIdentifierValue('ab', { minLength: 3 }).valid, false);
  assert.equal(normalizeIdentifierValue('abcdef', { maxLength: 4 }).valid, false);
  assert.equal(normalizeIdentifierValue('abcd', { minLength: 3, maxLength: 4 }).valid, true);
});

test('SSN system rule: digits only, exactly 9', function() {
  const system = 'http://hl7.org/fhir/sid/us-ssn';
  assert.equal(normalizeIdentifierValue('123-45-6789', { system }).value, '123456789');
  assert.equal(normalizeIdentifierValue('123 45 6789', { system }).value, '123456789');
  assert.equal(normalizeIdentifierValue('123-45-678', { system }).valid, false);
  // Letters are stripped by keep:'digits', then the pattern gate catches shortfall
  assert.equal(normalizeIdentifierValue('12a-45-6789', { system }).valid, false);
});

test('NPI system rule: 10 digits', function() {
  const system = 'http://hl7.org/fhir/sid/us-npi';
  assert.equal(normalizeIdentifierValue('1234567890', { system }).value, '1234567890');
  assert.equal(normalizeIdentifierValue('123456789', { system }).valid, false);
});

test('MBI system rule: canonical 11-char pattern, uppercased, separators stripped', function() {
  const system = 'http://hl7.org/fhir/sid/us-mbi';
  assert.equal(normalizeIdentifierValue('1eg4-te5-mk73', { system }).value, '1EG4TE5MK73');
  assert.equal(normalizeIdentifierValue('bad-mbi', { system }).valid, false);
});

test('normalizeIdentifier wraps FHIR Identifier objects', function() {
  const result = normalizeIdentifier({ system: 'http://hospital.example.org/mrn', value: ' mrn-00 42 ' });
  assert.equal(result.system, 'http://hospital.example.org/mrn');
  assert.equal(result.value, 'MRN0042');
  assert.equal(result.valid, true);

  const missing = normalizeIdentifier({ system: 'urn:x' });
  assert.equal(missing.valid, false);
  assert.equal(missing.value, null);

  const bare = normalizeIdentifier(null);
  assert.equal(bare.valid, false);
  assert.equal(bare.system, '');
});

test('SYSTEM_RULES table shape', function() {
  Object.keys(SYSTEM_RULES).forEach(function(system) {
    const rule = SYSTEM_RULES[system];
    assert.ok(rule.keep === 'digits' || rule.keep === 'alphanumeric');
    assert.ok(rule.pattern instanceof RegExp);
  });
});

test('normalization is idempotent', function() {
  const once = normalizeIdentifierValue('  mrn-12 34  ').value;
  const twice = normalizeIdentifierValue(once).value;
  assert.equal(once, twice);
});
