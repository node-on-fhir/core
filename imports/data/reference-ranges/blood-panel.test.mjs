// imports/data/reference-ranges/blood-panel.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { EXT } from '../../lib/referenceRanges/qualifiers.js';

const seed = JSON.parse(readFileSync(fileURLToPath(new URL('./blood-panel.json', import.meta.url)), 'utf8'));

test('seed is a non-empty array of ObservationDefinitions', () => {
  assert.ok(Array.isArray(seed) && seed.length >= 20);
  seed.forEach(function (d) { assert.equal(d.resourceType, 'ObservationDefinition'); });
});

test('every record has stable id, LOINC, unit, bandProfile, and >=1 interval', () => {
  const validBands = ['low-normal-high', 'normal-high', 'low-normal', 'qualitative', 'informational'];
  const ids = new Set();
  seed.forEach(function (d) {
    assert.match(d.id, /^abim:base:/, 'id ' + d.id);
    assert.ok(!ids.has(d.id), 'duplicate id ' + d.id); ids.add(d.id);
    assert.equal(d.code.coding[0].system, 'http://loinc.org');
    assert.ok(d.code.coding[0].code, 'missing LOINC on ' + d.id);
    const bp = (d.extension || []).find(function (e) { return e.url === EXT.bandProfile; });
    assert.ok(bp && validBands.includes(bp.valueCode), 'bad bandProfile on ' + d.id);
    const layer = (d.extension || []).find(function (e) { return e.url === EXT.layer; });
    assert.equal(layer.valueCode, 'base');
    assert.ok(Array.isArray(d.qualifiedInterval) && d.qualifiedInterval.length >= 1);
  });
});

test('sex-dimorphic showcase analytes are present', () => {
  const codes = seed.map(function (d) { return d.code.coding[0].code; });
  ['2986-8', '2276-4', '2160-0'].forEach(function (c) { // testosterone, ferritin, creatinine
    assert.ok(codes.includes(c), 'missing LOINC ' + c);
  });
});
