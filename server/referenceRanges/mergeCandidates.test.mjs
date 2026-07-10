import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeCandidates } from './mergeCandidates.mjs';

const baseFerritin = { code: { coding: [{ system: 'http://loinc.org', code: '2276-4' }] } };
const baseGlucose = { code: { coding: [{ system: 'http://loinc.org', code: '2345-7' }] } };
const overrideFerritin = { code: { coding: [{ system: 'http://loinc.org', code: '2276-4' }] } };

test('merges base + injected definitions for the requested LOINC only', () => {
  const injected = [{ name: 'NG pack', definitions: [overrideFerritin] }];
  const out = mergeCandidates([baseFerritin, baseGlucose], injected, '2276-4');
  assert.equal(out.length, 2);
  assert.ok(out.includes(baseFerritin) && out.includes(overrideFerritin));
  assert.ok(!out.includes(baseGlucose));
});

test('no injected sets -> base only', () => {
  assert.deepEqual(mergeCandidates([baseFerritin], [], '2276-4'), [baseFerritin]);
});
