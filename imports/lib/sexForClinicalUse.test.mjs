import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSexForClinicalUse } from './sexForClinicalUse.js';

const SPCU = 'http://hl7.org/fhir/StructureDefinition/patient-sexParameterForClinicalUse';

function spcu({ code, start, end, intendedUse, supporting }) {
  const sub = [{ url: 'value', valueCodeableConcept: { coding: [{ code }] } }];
  if (start || end) sub.push({ url: 'period', valuePeriod: { start, end } });
  if (intendedUse) sub.push({ url: 'intendedClinicalUse', valueCodeableConcept: { coding: [{ code: intendedUse }] } });
  if (supporting) sub.push({ url: 'supportingInfo', valueReference: { reference: supporting } });
  return { url: SPCU, extension: sub };
}

test('administrative gender fallback when no SPCU', () => {
  const r = resolveSexForClinicalUse({ gender: 'male' }, null, {});
  assert.equal(r.sex, 'male');
  assert.equal(r.source, 'administrative');
});

test('undefined when nothing present', () => {
  assert.equal(resolveSexForClinicalUse(null, null, {}).source, 'none');
});

test('patient SPCU wins over administrative gender', () => {
  const patient = { gender: 'male', extension: [spcu({ code: 'female' })] };
  const r = resolveSexForClinicalUse(patient, null, {});
  assert.equal(r.sex, 'female');
  assert.equal(r.source, 'patient-spcu');
});

test('observation SPCU wins over patient SPCU', () => {
  const patient = { gender: 'male', extension: [spcu({ code: 'female' })] };
  const observation = { extension: [spcu({ code: 'male' })] };
  const r = resolveSexForClinicalUse(patient, observation, {});
  assert.equal(r.sex, 'male');
  assert.equal(r.source, 'observation-spcu');
});

test('period filters by atTime', () => {
  const patient = { extension: [spcu({ code: 'female', end: '2020-01-01' })] };
  // SPCU expired before atTime -> falls through to none
  const r = resolveSexForClinicalUse(patient, null, { atTime: '2026-01-01' });
  assert.equal(r.source, 'none');
});

test('intendedClinicalUse scoping: non-matching SPCU is ignored', () => {
  const patient = { extension: [spcu({ code: 'female', intendedUse: 'medication-dosing' })] };
  const r = resolveSexForClinicalUse(patient, null, { intendedUse: 'reference-range-interpretation' });
  assert.equal(r.source, 'none');
});

test('specified yields undefined sex but carries basis', () => {
  const patient = { extension: [spcu({ code: 'specified', supporting: 'Observation/karyotype-1' })] };
  const r = resolveSexForClinicalUse(patient, null, {});
  assert.equal(r.sex, undefined);
  assert.equal(r.source, 'patient-spcu');
  assert.equal(r.basis.length, 1);
});
