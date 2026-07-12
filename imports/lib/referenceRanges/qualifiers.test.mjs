// imports/lib/referenceRanges/qualifiers.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXT, LAYER_PRECEDENCE, intervalPopulation, matchesContext, specificity } from './qualifiers.js';

const femaleInterval = { gender: 'female', range: { low: { value: 24 }, high: { value: 307 } } };
const femaleSickleCell = {
  gender: 'female',
  range: { low: { value: 20 }, high: { value: 200 } },
  extension: [{ url: EXT.population, valueCodeableConcept: { coding: [{ code: 'sickle-cell-endemic' }] } }]
};

test('EXT and LAYER_PRECEDENCE are stable', () => {
  assert.equal(LAYER_PRECEDENCE.patient > LAYER_PRECEDENCE.deployment, true);
  assert.equal(LAYER_PRECEDENCE.deployment > LAYER_PRECEDENCE.base, true);
  assert.match(EXT.population, /reference-range-population$/);
});

test('intervalPopulation reads the extension code', () => {
  assert.equal(intervalPopulation(femaleSickleCell), 'sickle-cell-endemic');
  assert.equal(intervalPopulation(femaleInterval), undefined);
});

test('matchesContext: absent qualifier is a wildcard', () => {
  assert.equal(matchesContext(femaleInterval, { sex: 'female' }), true);
  assert.equal(matchesContext(femaleInterval, { sex: 'male' }), false);
  // population declared but context lacks it -> not eligible
  assert.equal(matchesContext(femaleSickleCell, { sex: 'female' }), false);
  assert.equal(matchesContext(femaleSickleCell, { sex: 'female', population: 'sickle-cell-endemic' }), true);
});

test('matchesContext: age band', () => {
  const ageBand = { age: { low: { value: 25 }, high: { value: 39 } }, range: {} };
  assert.equal(matchesContext(ageBand, { ageYears: 30 }), true);
  assert.equal(matchesContext(ageBand, { ageYears: 50 }), false);
  assert.equal(matchesContext(ageBand, {}), false); // context has no age -> declared age can't match
});

test('specificity counts declared qualifiers', () => {
  assert.equal(specificity(femaleInterval), 1);
  assert.equal(specificity(femaleSickleCell), 2);
});
