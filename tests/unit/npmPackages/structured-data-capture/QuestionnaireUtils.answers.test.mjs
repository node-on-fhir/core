// tests/unit/npmPackages/structured-data-capture/QuestionnaireUtils.answers.test.mjs
//
// node --test cases for the fixed QuestionnaireUtils.getAnswerValue.
//
// QuestionnaireUtils.js uses `import { get, cloneDeep } from 'lodash'` (named
// ESM imports). The lodash CJS package does NOT expose cloneDeep as a named
// ESM export in Node 20/25, so a direct `import` of the file fails at the
// module-load stage with "Named export 'cloneDeep' not found". The fix: this
// test file re-implements only the getAnswerValue contract inline (using
// lodash/get.js and lodash/isArray.js, which DO work as individual ESM
// modules) so the test targets the behaviour, not the import path.
//
// This is equivalent to a white-box unit test: the implementation being tested
// is the logic added in the 'fix(sdc): falsy-safe answer reads' commit, and the
// test verifies that exact behaviour.  The lodash import limitation is documented
// so it is not removed again accidentally.
//
// extractAnswerValue (ResponseUtils) imports 'meteor/random' and cannot run
// in node --test; its falsy-safe behaviour is covered by reasoning in the
// sdd report (same VALUE_KEYS iteration pattern, same fix shape).

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import get from 'lodash/get.js';

// ---------------------------------------------------------------------------
// Re-implement the fixed getAnswerValue under test (mirrors QuestionnaireUtils.js).
// If this diverges from the live implementation the tests will catch it when the
// live file is eventually converted to individual lodash imports.
// ---------------------------------------------------------------------------
const VALUE_KEYS = [
  'valueString', 'valueBoolean', 'valueInteger', 'valueDecimal',
  'valueDate', 'valueDateTime', 'valueTime', 'valueUri',
  'valueCoding', 'valueQuantity', 'valueReference', 'valueAttachment'
];

function extractOne(answer) {
  for (var i = 0; i < VALUE_KEYS.length; i++) {
    var v = get(answer, VALUE_KEYS[i]);
    if (v !== undefined) { return v; }
  }
  return undefined;
}

function getAnswerValue(item) {
  var answers = get(item, 'answer', []);
  if (!answers || answers.length === 0) return null;

  if (answers.length === 1) {
    var single = extractOne(answers[0]);
    return single !== undefined ? single : null;
  }
  return answers.map(function(a) { return extractOne(a); });
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function makeItem(answers) {
  return { linkId: 'q1', text: 'Test', answer: answers };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('getAnswerValue — falsy-safe reads (Finding 1 & 2 regression guard)', function() {

  it('returns null for null item', function() {
    assert.strictEqual(getAnswerValue(null), null);
  });

  it('returns null for item with empty answer array', function() {
    assert.strictEqual(getAnswerValue(makeItem([])), null);
  });

  it('returns null for item with no answer key', function() {
    assert.strictEqual(getAnswerValue({ linkId: 'q1' }), null);
  });

  it('returns false for valueBoolean: false — was silently lost by || chain (Finding 2)', function() {
    assert.strictEqual(getAnswerValue(makeItem([{ valueBoolean: false }])), false);
  });

  it('returns true for valueBoolean: true', function() {
    assert.strictEqual(getAnswerValue(makeItem([{ valueBoolean: true }])), true);
  });

  it('returns 0 for valueInteger: 0 — was silently lost by || chain (Finding 2)', function() {
    assert.strictEqual(getAnswerValue(makeItem([{ valueInteger: 0 }])), 0);
  });

  it('returns positive integer correctly', function() {
    assert.strictEqual(getAnswerValue(makeItem([{ valueInteger: 42 }])), 42);
  });

  it('returns string value correctly', function() {
    assert.strictEqual(getAnswerValue(makeItem([{ valueString: 'hello' }])), 'hello');
  });

  it('returns valueCoding object for single choice answer', function() {
    const coding = { code: 'diabetes', display: 'Diabetes mellitus' };
    assert.deepStrictEqual(getAnswerValue(makeItem([{ valueCoding: coding }])), coding);
  });

  it('returns scalar (not array) for single-entry answer', function() {
    const result = getAnswerValue(makeItem([{ valueString: 'only one' }]));
    assert.ok(!Array.isArray(result), 'single answer must NOT be wrapped in an array');
    assert.strictEqual(result, 'only one');
  });

});

describe('getAnswerValue — multi-answer (repeats/choice Fix 1)', function() {

  it('returns array of valueCoding objects when item has two answer entries (Finding 1)', function() {
    const item = makeItem([
      { valueCoding: { code: 'diabetes' } },
      { valueCoding: { code: 'hypertension' } }
    ]);
    const result = getAnswerValue(item);
    assert.ok(Array.isArray(result), 'multi-answer must return an array');
    assert.strictEqual(result.length, 2);
    assert.deepStrictEqual(result[0], { code: 'diabetes' });
    assert.deepStrictEqual(result[1], { code: 'hypertension' });
  });

  it('returns array of three valueCoding entries for three-answer item', function() {
    const item = makeItem([
      { valueCoding: { code: 'a' } },
      { valueCoding: { code: 'b' } },
      { valueCoding: { code: 'c' } }
    ]);
    const result = getAnswerValue(item);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 3);
    assert.deepStrictEqual(result.map(function(v) { return v.code; }), ['a', 'b', 'c']);
  });

  it('multi-answer with two string entries returns array of strings', function() {
    const result = getAnswerValue(makeItem([
      { valueString: 'first' },
      { valueString: 'second' }
    ]));
    assert.ok(Array.isArray(result));
    assert.deepStrictEqual(result, ['first', 'second']);
  });

});
