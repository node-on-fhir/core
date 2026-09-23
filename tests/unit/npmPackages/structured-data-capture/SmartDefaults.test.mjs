// tests/unit/npmPackages/structured-data-capture/SmartDefaults.test.mjs
//
// Unit tests for the SDC contextual-defaults resolver. Imports npm deps
// (lodash via the subject) — runs in a CI job that has node_modules, NOT the
// bare-checkout lib-unit-tests job. `npm run test:sdc-smart-defaults`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SmartDefaults } from '../../../../npmPackages/structured-data-capture/lib/SmartDefaults.js';

const INITIAL_EXPRESSION_URL = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-initialExpression';

function expressionItem(linkId, type, expression) {
  return {
    linkId: linkId,
    type: type,
    text: linkId,
    extension: [{ url: INITIAL_EXPRESSION_URL, valueExpression: { language: 'text/fhirpath', expression: expression } }]
  };
}

const FIXED_NOW = new Date('2026-09-23T14:30:00.000Z');

const patient = {
  resourceType: 'Patient',
  birthDate: '1985-04-12',
  gender: 'female',
  name: [{ family: 'Watson', given: ['Abigail', 'Q'], text: 'Abigail Q Watson' }]
};

test('applies FHIR item.initial values across types', function() {
  const questionnaire = {
    resourceType: 'Questionnaire',
    item: [
      { linkId: 'q-string', type: 'string', initial: [{ valueString: 'hello' }] },
      { linkId: 'q-bool', type: 'boolean', initial: [{ valueBoolean: false }] },
      { linkId: 'q-int', type: 'integer', initial: [{ valueInteger: 42 }] },
      { linkId: 'q-dec', type: 'decimal', initial: [{ valueDecimal: 98.6 }] },
      { linkId: 'q-date', type: 'date', initial: [{ valueDate: '2026-01-01' }] },
      { linkId: 'q-dt', type: 'dateTime', initial: [{ valueDateTime: '2026-01-01T08:00:00Z' }] },
      { linkId: 'q-choice', type: 'choice', initial: [{ valueCoding: { code: 'a', display: 'Alpha' } }] }
    ]
  };

  const answers = SmartDefaults.computeDefaults(questionnaire, { now: FIXED_NOW });
  const byLinkId = Object.fromEntries(answers.map(function(a) { return [a.linkId, a]; }));

  assert.equal(byLinkId['q-string'].value, 'hello');
  assert.equal(byLinkId['q-bool'].value, false);
  assert.equal(byLinkId['q-int'].value, 42);
  assert.equal(byLinkId['q-dec'].value, 98.6);
  assert.equal(byLinkId['q-date'].value, '2026-01-01');
  assert.equal(byLinkId['q-dt'].value, '2026-01-01T08:00:00Z');
  assert.deepEqual(byLinkId['q-choice'].value, { code: 'a', display: 'Alpha' });
  assert.equal(byLinkId['q-choice'].type, 'choice');
});

test('walks nested groups', function() {
  const questionnaire = {
    item: [
      {
        linkId: 'grp', type: 'group', item: [
          { linkId: 'inner', type: 'string', initial: [{ valueString: 'nested' }] }
        ]
      }
    ]
  };
  const answers = SmartDefaults.computeDefaults(questionnaire, {});
  assert.equal(answers.length, 1);
  assert.equal(answers[0].linkId, 'inner');
  assert.equal(answers[0].value, 'nested');
});

test('skips items already answered in existingResponse', function() {
  const questionnaire = {
    item: [
      { linkId: 'q1', type: 'string', initial: [{ valueString: 'default' }] },
      { linkId: 'q2', type: 'string', initial: [{ valueString: 'default2' }] }
    ]
  };
  const existingResponse = {
    resourceType: 'QuestionnaireResponse',
    item: [
      { linkId: 'q1', answer: [{ valueString: 'user typed this' }] },
      { linkId: 'q2', answer: [] }
    ]
  };
  const answers = SmartDefaults.computeDefaults(questionnaire, { existingResponse: existingResponse });
  assert.equal(answers.length, 1);
  assert.equal(answers[0].linkId, 'q2');
});

test('resolves today() and now() with injected clock', function() {
  const questionnaire = {
    item: [
      expressionItem('q-today', 'date', 'today()'),
      expressionItem('q-now', 'dateTime', 'now()')
    ]
  };
  const answers = SmartDefaults.computeDefaults(questionnaire, { now: FIXED_NOW });
  const byLinkId = Object.fromEntries(answers.map(function(a) { return [a.linkId, a]; }));
  assert.equal(byLinkId['q-today'].value, '2026-09-23');
  assert.equal(byLinkId['q-now'].value, FIXED_NOW.toISOString());
});

test('resolves patient demographics expressions', function() {
  const questionnaire = {
    item: [
      expressionItem('q-dob', 'date', '%patient.birthDate'),
      expressionItem('q-gender', 'string', '%patient.gender'),
      expressionItem('q-family', 'string', '%patient.name.family'),
      expressionItem('q-given', 'string', '%patient.name.given.first()'),
      expressionItem('q-name', 'string', '%patient.name')
    ]
  };
  const answers = SmartDefaults.computeDefaults(questionnaire, { patient: patient, now: FIXED_NOW });
  const byLinkId = Object.fromEntries(answers.map(function(a) { return [a.linkId, a]; }));
  assert.equal(byLinkId['q-dob'].value, '1985-04-12');
  assert.equal(byLinkId['q-gender'].value, 'female');
  assert.equal(byLinkId['q-family'].value, 'Watson');
  assert.equal(byLinkId['q-given'].value, 'Abigail');
  assert.equal(byLinkId['q-name'].value, 'Abigail Q Watson');
});

test('gender matches a choice answerOption when item is a choice', function() {
  const questionnaire = {
    item: [
      {
        linkId: 'q-gender-choice', type: 'choice', text: 'Gender',
        extension: [{ url: INITIAL_EXPRESSION_URL, valueExpression: { language: 'text/fhirpath', expression: '%patient.gender' } }],
        answerOption: [
          { valueCoding: { code: 'male', display: 'Male' } },
          { valueCoding: { code: 'female', display: 'Female' } }
        ]
      }
    ]
  };
  const answers = SmartDefaults.computeDefaults(questionnaire, { patient: patient });
  assert.equal(answers.length, 1);
  assert.deepEqual(answers[0].value, { code: 'female', display: 'Female' });
});

test('skips unknown expressions and choice values with no matching option', function() {
  const questionnaire = {
    item: [
      expressionItem('q-weird', 'string', "Observation.where(code='8867-4').valueQuantity"),
      {
        linkId: 'q-no-match', type: 'choice',
        extension: [{ url: INITIAL_EXPRESSION_URL, valueExpression: { language: 'text/fhirpath', expression: '%patient.gender' } }],
        answerOption: [{ valueCoding: { code: 'x', display: 'X' } }]
      }
    ]
  };
  const answers = SmartDefaults.computeDefaults(questionnaire, { patient: patient });
  assert.equal(answers.length, 0);
});

test('patient expressions without a patient are skipped', function() {
  const questionnaire = { item: [expressionItem('q-dob', 'date', '%patient.birthDate')] };
  const answers = SmartDefaults.computeDefaults(questionnaire, {});
  assert.equal(answers.length, 0);
});

test('empty questionnaire yields empty answers', function() {
  assert.deepEqual(SmartDefaults.computeDefaults({}, {}), []);
  assert.deepEqual(SmartDefaults.computeDefaults(null, {}), []);
});
