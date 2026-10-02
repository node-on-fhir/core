// tests/unit/npmPackages/structured-data-capture/PrefillUtils.test.mjs
//
// Unit tests for the Kill the Clipboard prefill helpers. Imports npm deps
// (lodash via the subject) — runs in a CI job that has node_modules, NOT the
// bare-checkout lib-unit-tests job. `npm run test:sdc-prefill`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PrefillUtils } from '../../../../npmPackages/structured-data-capture/lib/PrefillUtils.js';

const intakeQuestionnaire = {
  resourceType: 'Questionnaire',
  id: 'intake',
  item: [
    {
      linkId: 'demographics', type: 'group', text: 'Demographics',
      item: [
        { linkId: 'fullname', type: 'string', text: 'Full Name', required: true },
        { linkId: 'email', type: 'string', text: 'Email Address', required: true }
      ]
    },
    {
      linkId: 'medical-history', type: 'group', text: 'Medical History',
      item: [
        {
          linkId: 'conditions', type: 'choice', text: 'Do you have any of the following conditions?', repeats: true,
          answerOption: [
            { valueCoding: { code: 'diabetes', display: 'Diabetes' } },
            { valueCoding: { code: 'hypertension', display: 'High Blood Pressure' } }
          ]
        },
        { linkId: 'medications', type: 'text', text: 'List all current medications' },
        { linkId: 'flu-shot', type: 'boolean', text: 'Flu shot this year?' },
        { linkId: 'dob', type: 'date', text: 'Date of Birth' }
      ]
    },
    { linkId: 'intro', type: 'display', text: 'Please answer honestly' }
  ]
};

test('stripNarrativeHtml converts br/tags to newlines and decodes entities', function() {
  const out = PrefillUtils.stripNarrativeHtml('<div xmlns="http://www.w3.org/1999/xhtml">Line one<br/>Tom &amp; Jerry</div>');
  assert.equal(out, 'Line one\nTom & Jerry');
});

test('extractNarrativeFromComposition prefers the Narrative Summary section', function() {
  const composition = {
    resourceType: 'Composition',
    section: [
      { title: 'Problems', text: { div: '<div>problem list</div>' } },
      { title: 'Narrative Summary', text: { status: 'generated', div: '<div>The patient has diabetes.<br/>Takes metformin.</div>' } }
    ]
  };
  assert.equal(PrefillUtils.extractNarrativeFromComposition(composition), 'The patient has diabetes.\nTakes metformin.');
});

test('extractNarrativeFromComposition returns null when no section has text.div', function() {
  assert.equal(PrefillUtils.extractNarrativeFromComposition({ section: [{ title: 'Problems' }] }), null);
  assert.equal(PrefillUtils.extractNarrativeFromComposition({}), null);
});

test('flattenAnswerableItems skips groups/display and captures answerOptions', function() {
  const flat = PrefillUtils.flattenAnswerableItems(intakeQuestionnaire);
  assert.deepEqual(flat.map(function(i){ return i.linkId; }), ['fullname', 'email', 'conditions', 'medications', 'flu-shot', 'dob']);
  const conditions = flat.find(function(i){ return i.linkId === 'conditions'; });
  assert.equal(conditions.repeats, true);
  assert.deepEqual(conditions.answerOptions, [
    { code: 'diabetes', display: 'Diabetes' },
    { code: 'hypertension', display: 'High Blood Pressure' }
  ]);
});

test('buildPrefillPrompt embeds the narrative and the question catalog', function() {
  const prompt = PrefillUtils.buildPrefillPrompt(intakeQuestionnaire, 'The patient has diabetes.');
  assert.match(prompt, /PATIENT SUMMARY:/);
  assert.match(prompt, /The patient has diabetes\./);
  assert.match(prompt, /"linkId": "conditions"/);
  assert.match(prompt, /JSON array/);
});

test('parsePrefillAnswers handles fenced JSON, coerces types, drops unknown linkIds', function() {
  const content = '```json\n' + JSON.stringify([
    { linkId: 'fullname', value: 'Jane Doe' },
    { linkId: 'conditions', value: ['Diabetes', 'hypertension'] },
    { linkId: 'flu-shot', value: 'true' },
    { linkId: 'dob', value: '1980-04-02T00:00:00Z' },
    { linkId: 'not-a-question', value: 'x' },
    { linkId: 'email', value: '' }
  ]) + '\n```';
  const answers = PrefillUtils.parsePrefillAnswers(content, intakeQuestionnaire);
  assert.deepEqual(answers, [
    { linkId: 'fullname', value: 'Jane Doe', type: 'string' },
    { linkId: 'conditions', value: ['diabetes', 'hypertension'], type: 'choice' },
    { linkId: 'flu-shot', value: true, type: 'boolean' },
    { linkId: 'dob', value: '1980-04-02', type: 'date' }
  ]);
});

test('parsePrefillAnswers matches single choice to the full coding object', function() {
  const single = {
    item: [{ linkId: 'q1', type: 'choice', text: 'Pick one', answerOption: [
      { valueCoding: { code: 'a', display: 'Alpha' } }
    ] }]
  };
  const answers = PrefillUtils.parsePrefillAnswers('[{"linkId":"q1","value":"alpha"}]', single);
  assert.deepEqual(answers, [{ linkId: 'q1', value: { code: 'a', display: 'Alpha' }, type: 'choice' }]);
});

test('parsePrefillAnswers throws on non-JSON and non-array content', function() {
  assert.throws(function(){ PrefillUtils.parsePrefillAnswers('I cannot help with that.', intakeQuestionnaire); });
  assert.throws(function(){ PrefillUtils.parsePrefillAnswers('{"linkId":"fullname"}', intakeQuestionnaire); });
  assert.throws(function(){ PrefillUtils.parsePrefillAnswers('', intakeQuestionnaire); });
});
