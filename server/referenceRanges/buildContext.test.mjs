// server/referenceRanges/buildContext.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildContext } from './buildContext.mjs';

test('sex from spcu; deployment default population when no patient tag', () => {
  const ctx = buildContext({
    patient: { birthDate: '1990-01-01' },
    observation: { effectiveDateTime: '2020-01-01' },
    spcu: { sex: 'female', source: 'patient-spcu', basis: [] },
    deploymentDefaults: { population: 'sickle-cell-endemic', jurisdiction: 'NG' }
  });
  assert.equal(ctx.sex, 'female');
  assert.equal(ctx.ageYears, 30);
  assert.equal(ctx.population, 'sickle-cell-endemic');
  assert.equal(ctx.jurisdiction, 'NG');
  assert.equal(ctx.overrideSource, 'deployment');
});

test('per-patient population tag wins over deployment default', () => {
  const patient = {
    birthDate: '1990-01-01',
    extension: [{ url: 'https://nodeonfhir.org/fhir/StructureDefinition/reference-range-population',
      valueCodeableConcept: { coding: [{ code: 'g6pd-deficient' }] } }]
  };
  const ctx = buildContext({
    patient, observation: {}, spcu: { sex: 'male' },
    deploymentDefaults: { population: 'sickle-cell-endemic' }
  });
  assert.equal(ctx.population, 'g6pd-deficient');
  assert.equal(ctx.overrideSource, 'patient');
});
