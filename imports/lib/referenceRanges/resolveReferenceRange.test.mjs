import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveReferenceRange } from './resolveReferenceRange.js';
import { EXT } from './qualifiers.js';

function def({ loinc, unit, band, layer, source, version, intervals }) {
  return {
    resourceType: 'ObservationDefinition',
    code: { coding: [{ system: 'http://loinc.org', code: loinc }] },
    quantitativeDetails: { unit: { coding: [{ code: unit }] } },
    qualifiedInterval: intervals,
    extension: [
      { url: EXT.bandProfile, valueCode: band },
      { url: EXT.layer, valueCode: layer },
      { url: EXT.source, valueString: source },
      { url: EXT.version, valueString: version }
    ]
  };
}
function pop(code) { return { url: EXT.population, valueCodeableConcept: { coding: [{ code }] } }; }

const ferritinBase = def({
  loinc: '2276-4', unit: 'ng/mL', band: 'low-normal-high', layer: 'base', source: 'ABIM', version: '2024.1',
  intervals: [
    { category: 'reference', gender: 'female', range: { low: { value: 24 }, high: { value: 307 } } },
    { category: 'reference', gender: 'male', range: { low: { value: 24 }, high: { value: 336 } } }
  ]
});
const ferritinSickle = def({
  loinc: '2276-4', unit: 'ng/mL', band: 'low-normal-high', layer: 'deployment', source: 'WHO-AFRO', version: '2025.1',
  intervals: [
    { category: 'reference', gender: 'female', extension: [pop('sickle-cell-endemic')], range: { low: { value: 20 }, high: { value: 250 } } }
  ]
});

test('returns null on empty candidates', () => {
  assert.equal(resolveReferenceRange({ loinc: 'x', candidates: [], context: {} }), null);
});

test('sex-only selection picks the matching interval', () => {
  const r = resolveReferenceRange({ loinc: '2276-4', candidates: [ferritinBase], context: { sex: 'female' } });
  assert.deepEqual(r.normal, { low: { value: 24 }, high: { value: 307 } });
  assert.equal(r.bandProfile, 'low-normal-high');
  assert.equal(r.matched.source, 'ABIM');
  assert.ok(r.matched.by.includes('sex'));
});

test('population + deployment override beats base', () => {
  const r = resolveReferenceRange({
    loinc: '2276-4', candidates: [ferritinBase, ferritinSickle],
    context: { sex: 'female', population: 'sickle-cell-endemic', overrideSource: 'deployment' }
  });
  assert.deepEqual(r.normal, { low: { value: 20 }, high: { value: 250 } });
  assert.equal(r.matched.source, 'WHO-AFRO');
  assert.ok(r.matched.by.includes('population'));
});

test('falls back to base when population not set', () => {
  const r = resolveReferenceRange({
    loinc: '2276-4', candidates: [ferritinBase, ferritinSickle], context: { sex: 'female' }
  });
  assert.equal(r.matched.source, 'ABIM');
});

test('no eligible interval -> informational, normal null, never throws', () => {
  const r = resolveReferenceRange({ loinc: '2276-4', candidates: [ferritinBase], context: { sex: undefined } });
  assert.equal(r.normal, null);
  assert.equal(r.bandProfile, 'informational');
});

test('graded bands surface for a normal-high analyte', () => {
  const chol = def({
    loinc: '2093-3', unit: 'mg/dL', band: 'normal-high', layer: 'base', source: 'ABIM', version: '2024.1',
    intervals: [
      { category: 'reference', range: { high: { value: 200 } } },
      { category: 'critical', interpretation: [{ coding: [{ code: 'H' }] }], range: { low: { value: 200 }, high: { value: 239 } } },
      { category: 'critical', interpretation: [{ coding: [{ code: 'HH' }] }], range: { low: { value: 239 } } }
    ]
  });
  const r = resolveReferenceRange({ loinc: '2093-3', candidates: [chol], context: {} });
  assert.equal(r.bandProfile, 'normal-high');
  assert.equal(r.bands.length, 3);
});
