// imports/api/rxnorm/rxnormLogic.test.mjs
//
// Plain `node --test` coverage for the pure RxNorm parsing/matching logic.
// Fixtures below are recorded (trimmed) RxNav/RxClass response shapes — no
// network access in tests.
// Run: node --test imports/api/rxnorm/rxnormLogic.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const RxLogic = require('./rxnormLogic.js');

// --------------------------------------------------------------------------
// Recorded RxNav fixtures (trimmed)

// GET /rxcui.json?name=lisinopril 10 MG Oral Tablet&search=2
const RXCUI_LOOKUP_FIXTURE = {
  idGroup: {
    name: 'lisinopril 10 MG Oral Tablet',
    rxnormId: ['314076']
  }
};

// GET /rxcui/314076/properties.json
const PROPERTIES_FIXTURE = {
  properties: {
    rxcui: '314076',
    name: 'lisinopril 10 MG Oral Tablet',
    synonym: '',
    tty: 'SCD',
    language: 'ENG',
    suppress: 'N',
    umlscui: ''
  }
};

// GET /rxcui/314076/related.json?tty=IN+MIN
const RELATED_FIXTURE = {
  relatedGroup: {
    rxcui: '314076',
    termType: ['IN', 'MIN'],
    conceptGroup: [
      {
        tty: 'IN',
        conceptProperties: [
          { rxcui: '29046', name: 'lisinopril', synonym: '', tty: 'IN', language: 'ENG', suppress: 'N', umlscui: '' }
        ]
      },
      { tty: 'MIN' }
    ]
  }
};

// GET /rxclass/class/byRxcui.json?rxcui=29046
const RXCLASS_FIXTURE = {
  rxclassDrugInfoList: {
    rxclassDrugInfo: [
      {
        minConcept: { rxcui: '29046', name: 'lisinopril', tty: 'IN' },
        rxclassMinConceptItem: {
          classId: 'N0000175561',
          className: 'Angiotensin-converting Enzyme Inhibitor',
          classType: 'EPC'
        },
        rela: 'has_EPC',
        relaSource: 'DAILYMED'
      },
      {
        // duplicate classId+rela from a second source entry — must de-dupe
        minConcept: { rxcui: '29046', name: 'lisinopril', tty: 'IN' },
        rxclassMinConceptItem: {
          classId: 'N0000175561',
          className: 'Angiotensin-converting Enzyme Inhibitor',
          classType: 'EPC'
        },
        rela: 'has_EPC',
        relaSource: 'DAILYMED'
      },
      {
        minConcept: { rxcui: '29046', name: 'lisinopril', tty: 'IN' },
        rxclassMinConceptItem: {
          classId: 'C09AA03',
          className: 'lisinopril',
          classType: 'ATC1-4'
        },
        rela: '',
        relaSource: 'ATC'
      }
    ]
  }
};

// --------------------------------------------------------------------------
// Parsing

test('parseRxcuiLookupResponse extracts first rxnormId', () => {
  assert.equal(RxLogic.parseRxcuiLookupResponse(RXCUI_LOOKUP_FIXTURE), '314076');
  assert.equal(RxLogic.parseRxcuiLookupResponse({ idGroup: {} }), null);
  assert.equal(RxLogic.parseRxcuiLookupResponse(null), null);
});

test('parsePropertiesResponse extracts rxcui/name/tty', () => {
  assert.deepEqual(RxLogic.parsePropertiesResponse(PROPERTIES_FIXTURE), {
    rxcui: '314076',
    name: 'lisinopril 10 MG Oral Tablet',
    tty: 'SCD'
  });
  assert.equal(RxLogic.parsePropertiesResponse({}), null);
});

test('parseRelatedResponse extracts ingredient concepts, skips empty groups', () => {
  assert.deepEqual(RxLogic.parseRelatedResponse(RELATED_FIXTURE), [
    { rxcui: '29046', name: 'lisinopril' }
  ]);
  assert.deepEqual(RxLogic.parseRelatedResponse(null), []);
});

test('parseClassResponse extracts and de-duplicates classes', () => {
  const classes = RxLogic.parseClassResponse(RXCLASS_FIXTURE);
  assert.equal(classes.length, 2);
  assert.deepEqual(classes[0], {
    classId: 'N0000175561',
    className: 'Angiotensin-converting Enzyme Inhibitor',
    classType: 'EPC',
    relaSource: 'DAILYMED',
    rela: 'has_EPC'
  });
});

// --------------------------------------------------------------------------
// Matching

test('matchByRxcuiOrIngredient: rxcui match wins, ingredient match falls back', () => {
  const statements = [
    { resourceId: 'stmt-1', rxcui: '1545664', ingredients: [{ rxcui: '1545653', name: 'empagliflozin' }] },
    { resourceId: 'stmt-2', rxcui: '999999', ingredients: [{ rxcui: '83367', name: 'atorvastatin' }] }
  ];
  const requests = [
    { resourceId: 'rx-1', rxcui: '1545664', ingredients: [{ rxcui: '1545653', name: 'empagliflozin' }] },
    { resourceId: 'rx-2', rxcui: '617310', ingredients: [{ rxcui: '83367', name: 'atorvastatin' }] }
  ];

  const matches = RxLogic.matchByRxcuiOrIngredient(statements, requests);
  assert.equal(matches.length, 2);
  assert.deepEqual(matches[0], { statementId: 'stmt-1', requestId: 'rx-1', via: 'rxcui', ingredientName: '' });
  assert.deepEqual(matches[1], { statementId: 'stmt-2', requestId: 'rx-2', via: 'ingredient', ingredientName: 'atorvastatin' });
});

test('matchByRxcuiOrIngredient: one pair per request, unmatched left out', () => {
  const statements = [
    { resourceId: 'stmt-1', rxcui: '1', ingredients: [] },
    { resourceId: 'stmt-2', rxcui: '1', ingredients: [] },
    { resourceId: 'stmt-3', rxcui: '2', ingredients: [] }
  ];
  const requests = [{ resourceId: 'rx-1', rxcui: '1', ingredients: [] }];

  const matches = RxLogic.matchByRxcuiOrIngredient(statements, requests);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].statementId, 'stmt-1');
  assert.deepEqual(RxLogic.matchByRxcuiOrIngredient(null, null), []);
});

test('findDuplicateIngredients flags ingredients shared by 2+ resources', () => {
  const entries = [
    { resourceId: 'rx-1', ingredients: [{ rxcui: '29046', name: 'lisinopril' }] },
    { resourceId: 'rx-2', ingredients: [{ rxcui: '29046', name: 'lisinopril' }, { rxcui: '5487', name: 'hydrochlorothiazide' }] },
    { resourceId: 'rx-3', ingredients: [{ rxcui: '83367', name: 'atorvastatin' }] }
  ];

  const duplicates = RxLogic.findDuplicateIngredients(entries);
  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0].ingredientRxcui, '29046');
  assert.equal(duplicates[0].ingredientName, 'lisinopril');
  assert.deepEqual(duplicates[0].memberIds, ['rx-1', 'rx-2']);
});

test('findDuplicateIngredients ignores repeats within one resource', () => {
  const entries = [
    { resourceId: 'rx-1', ingredients: [{ rxcui: '29046', name: 'lisinopril' }, { rxcui: '29046', name: 'lisinopril' }] }
  ];
  assert.deepEqual(RxLogic.findDuplicateIngredients(entries), []);
});

// --------------------------------------------------------------------------
// Allergy-class matching (Betsy's ACE inhibitor scenario)

test('matchAllergyClasses flags ACE inhibitor med against ACE class allergy (substring)', () => {
  const concepts = [{
    resourceId: 'rx-lisinopril',
    display: 'lisinopril 10 MG Oral Tablet',
    classes: RxLogic.parseClassResponse(RXCLASS_FIXTURE)
  }];
  const allergies = [{
    resourceId: 'allergy-ace',
    display: 'Substance with angiotensin-converting enzyme inhibitor mechanism of action (substance)'
  }];

  const warnings = RxLogic.matchAllergyClasses(concepts, allergies);
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].resourceId, 'rx-lisinopril');
  assert.equal(warnings[0].className, 'Angiotensin-converting Enzyme Inhibitor');
  assert.match(warnings[0].allergyDisplay, /angiotensin-converting/);
});

test('matchAllergyClasses alias table bridges "ACE inhibitor" phrasing differences', () => {
  const concepts = [{
    resourceId: 'rx-lisinopril',
    display: 'lisinopril 10 MG Oral Tablet',
    classes: [{ classId: 'x', className: 'Angiotensin-converting Enzyme Inhibitor [EPC]', classType: 'EPC', relaSource: 'MEDRT', rela: 'has_EPC' }]
  }];
  const allergies = [{ resourceId: 'allergy-ace', display: 'ACE inhibitor allergy' }];

  const warnings = RxLogic.matchAllergyClasses(concepts, allergies);
  assert.equal(warnings.length, 1);
});

test('matchAllergyClasses stays quiet for unrelated classes, de-dupes per med+allergy', () => {
  const concepts = [{
    resourceId: 'rx-statin',
    display: 'atorvastatin 40 MG Oral Tablet',
    classes: [
      { classId: 'a', className: 'HMG-CoA Reductase Inhibitor', classType: 'EPC', relaSource: 'MEDRT', rela: 'has_EPC' },
      { classId: 'b', className: 'HMG-CoA Reductase Inhibitor [EPC]', classType: 'EPC', relaSource: 'DAILYMED', rela: 'has_EPC' }
    ]
  }];
  const aceAllergy = [{ resourceId: 'allergy-ace', display: 'Substance with angiotensin-converting enzyme inhibitor mechanism of action (substance)' }];
  const statinAllergy = [{ resourceId: 'allergy-statin', display: 'statin intolerance' }];

  assert.deepEqual(RxLogic.matchAllergyClasses(concepts, aceAllergy), []);
  // Two class rows, one med+allergy pair -> exactly one warning
  assert.equal(RxLogic.matchAllergyClasses(concepts, statinAllergy).length, 1);
});
