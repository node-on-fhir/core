// imports/lib/FhirValidator.test.mjs
// Run with: npm run test:validator
import test from 'node:test';
import assert from 'node:assert/strict';
import FhirValidator from './FhirValidator.js';

const { validateResource, toOperationOutcome, validateBundle, registerSchema } = FhirValidator;

test('valid Patient passes', function() {
  const result = validateResource({ resourceType: 'Patient', id: 'p1', gender: 'male', name: [{ family: 'Smith', given: ['John'] }] });
  assert.equal(result.valid, true);
  assert.equal(result.resourceType, 'Patient');
});

test('invalid enum fails with error detail', function() {
  const result = validateResource({ resourceType: 'Patient', gender: 'purple' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
  assert.match(result.errors[0].instancePath, /gender/);
});

test('Mongo _id does not cause failure', function() {
  const result = validateResource({ resourceType: 'Patient', _id: 'mongo-key-123', gender: 'female' });
  assert.equal(result.valid, true);
});

test('unknown resourceType passes permissively with warning', function() {
  const result = validateResource({ resourceType: 'Martian', id: 'm1' });
  assert.equal(result.valid, true);
  assert.ok(result.warnings[0].includes('Martian'));
});

test('missing resourceType fails', function() {
  const result = validateResource({ id: 'x' });
  assert.equal(result.valid, false);
});

test('Observation choice types accepted', function() {
  const result = validateResource({ resourceType: 'Observation', status: 'final', code: { text: 'HR' }, valueQuantity: { value: 70, unit: 'bpm' } });
  assert.equal(result.valid, true);
});

test('toOperationOutcome maps ajv errors to issues', function() {
  const result = validateResource({ resourceType: 'Patient', gender: 'purple' });
  const outcome = toOperationOutcome(result.errors, { resourceType: 'Patient' });
  assert.equal(outcome.resourceType, 'OperationOutcome');
  assert.equal(outcome.issue[0].severity, 'error');
  assert.ok(outcome.issue[0].diagnostics.length > 0);
});

test('validateBundle aggregates per-entry results', function() {
  const bundle = { resourceType: 'Bundle', type: 'searchset', entry: [
    { resource: { resourceType: 'Patient', gender: 'male' } },
    { resource: { resourceType: 'Patient', gender: 'purple' } }
  ]};
  const result = validateBundle(bundle);
  assert.equal(result.valid, false);
  assert.equal(result.entries[0].valid, true);
  assert.equal(result.entries[1].valid, false);
});

test('registerSchema enables custom validation', function() {
  registerSchema('AppWidget', { type: 'object', required: ['resourceType', 'name'], properties: { resourceType: { const: 'AppWidget' }, name: { type: 'string' } } });
  assert.equal(validateResource({ resourceType: 'AppWidget', name: 'x' }).valid, true);
  assert.equal(validateResource({ resourceType: 'AppWidget' }).valid, false);
});
