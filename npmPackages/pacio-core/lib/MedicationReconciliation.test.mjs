// npmPackages/pacio-core/lib/MedicationReconciliation.test.mjs
//
// Plain `node --test` coverage for the pure reconciliation builders.
// Run: node --test npmPackages/pacio-core/lib/MedicationReconciliation.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const MedRec = require('./MedicationReconciliation.js');

const RECORDED = '2026-07-13T12:00:00.000Z';

const ACTIONS = [
  {
    _id: 'medrx-jardiance',
    resourceType: 'MedicationRequest',
    action: 'continue',
    display: 'empagliflozin 10 MG Oral Tablet [Jardiance]',
    code: '1545664'
  },
  {
    _id: 'medrx-sertraline',
    resourceType: 'MedicationRequest',
    action: 'discontinue',
    display: 'sertraline 25 MG Oral Tablet',
    code: '312940'
  },
  {
    _id: 'medstmt-lipitor',
    resourceType: 'MedicationStatement',
    action: 'continue',
    display: 'atorvastatin 40 MG Oral Tablet [Lipitor]',
    code: '617310'
  }
];

function betsyFixtures() {
  const makeMed = (resourceType, _id, code, text) => ({
    _id,
    resourceType,
    medicationCodeableConcept: {
      text,
      coding: [{ system: MedRec.RXNORM_SYSTEM, code, display: text }]
    }
  });
  return {
    statements: [
      makeMed('MedicationStatement', 'stmt-1', '1545664', 'empagliflozin 10 MG Oral Tablet [Jardiance]'),
      makeMed('MedicationStatement', 'stmt-2', '312940', 'sertraline 25 MG Oral Tablet'),
      makeMed('MedicationStatement', 'stmt-3', '617310', 'atorvastatin 40 MG Oral Tablet [Lipitor]')
    ],
    requests: [
      makeMed('MedicationRequest', 'rx-1', '1545664', 'Jardiance 10mg'),
      makeMed('MedicationRequest', 'rx-2', '312940', 'sertraline 25 MG Oral Tablet'),
      makeMed('MedicationRequest', 'rx-3', '617310', 'Lipitor 40mg')
    ]
  };
}

test('buildReconciledList: snapshot mode, LOINC 10160-0, no entry.deleted', () => {
  const list = MedRec.buildReconciledList({
    listId: 'list-1',
    actions: ACTIONS,
    patientReference: 'Patient/patient-betsysmith-johnson01',
    patientDisplay: 'Betsy Smith-Johnson',
    authorReference: 'Practitioner/demo-user',
    note: 'Post-discharge reconciliation',
    recorded: RECORDED
  });

  assert.equal(list.resourceType, 'List');
  assert.equal(list.mode, 'snapshot');
  assert.equal(list.status, 'current');
  assert.equal(list.code.coding[0].code, '10160-0');
  assert.equal(list.subject.reference, 'Patient/patient-betsysmith-johnson01');
  assert.equal(list.entry.length, 3);
  // lst-2: snapshot lists must not carry entry.deleted
  for (const entry of list.entry) {
    assert.equal(Object.prototype.hasOwnProperty.call(entry, 'deleted'), false);
  }
});

test('buildReconciledList: flags map continue->01 Unchanged, discontinue->03 Cancelled', () => {
  const list = MedRec.buildReconciledList({
    listId: 'list-1',
    actions: ACTIONS,
    patientReference: 'Patient/p1',
    recorded: RECORDED
  });

  const continued = list.entry[0];
  assert.equal(continued.flag.coding[0].code, '01');
  assert.equal(continued.flag.text, 'continued');
  assert.equal(continued.item.reference, 'MedicationRequest/medrx-jardiance');

  const discontinued = list.entry[1];
  assert.equal(discontinued.flag.coding[0].code, '03');
  assert.equal(discontinued.flag.text, 'discontinued');

  const statementEntry = list.entry[2];
  assert.equal(statementEntry.item.reference, 'MedicationStatement/medstmt-lipitor');
});

test('buildReconciliationProvenance: targets include List plus every actioned med', () => {
  const provenance = MedRec.buildReconciliationProvenance({
    provenanceId: 'prov-1',
    listId: 'list-1',
    actions: ACTIONS,
    authorReference: 'Practitioner/demo-user',
    recorded: RECORDED
  });

  assert.equal(provenance.resourceType, 'Provenance');
  assert.equal(provenance.target.length, 1 + ACTIONS.length);
  assert.equal(provenance.target[0].reference, 'List/list-1');
  const refs = provenance.target.map((t) => t.reference);
  assert.ok(refs.includes('MedicationRequest/medrx-sertraline'));
  assert.ok(refs.includes('MedicationStatement/medstmt-lipitor'));
  const snomed = provenance.activity.coding.find((c) => c.system === 'http://snomed.info/sct');
  assert.equal(snomed.code, '430193006');
  assert.equal(provenance.agent[0].who.reference, 'Practitioner/demo-user');
});

test('buildReconciliationProcedure: completed Procedure with SNOMED 430193006', () => {
  const procedure = MedRec.buildReconciliationProcedure({
    procedureId: 'proc-1',
    patientReference: 'Patient/p1',
    authorReference: 'Practitioner/demo-user',
    recorded: RECORDED
  });

  assert.equal(procedure.resourceType, 'Procedure');
  assert.equal(procedure.status, 'completed');
  assert.equal(procedure.code.coding[0].code, '430193006');
  assert.equal(procedure.subject.reference, 'Patient/p1');
  assert.equal(procedure.performedDateTime, RECORDED);
  assert.equal(procedure.performer[0].actor.reference, 'Practitioner/demo-user');
});

test('matchMedicationPairs: pairs Betsy fixtures by RxNorm code', () => {
  const { statements, requests } = betsyFixtures();
  const result = MedRec.matchMedicationPairs(statements, requests);

  assert.equal(result.matches.length, 3);
  assert.equal(result.unmatchedStatementIds.length, 0);
  assert.equal(result.unmatchedRequestIds.length, 0);
  const pair = result.matches.find((m) => m.statementId === 'stmt-1');
  assert.equal(pair.requestId, 'rx-1');
  assert.equal(pair.code, '1545664');
});

test('matchMedicationPairs: leaves unmatched meds unmatched, one pair per request', () => {
  const { statements, requests } = betsyFixtures();
  statements.push({
    _id: 'stmt-orphan',
    resourceType: 'MedicationStatement',
    medicationCodeableConcept: {
      text: 'lisinopril 10 MG Oral Tablet',
      coding: [{ system: MedRec.RXNORM_SYSTEM, code: '314076', display: 'lisinopril 10 MG Oral Tablet' }]
    }
  });
  requests.push({
    _id: 'rx-orphan',
    resourceType: 'MedicationRequest',
    medicationCodeableConcept: {
      text: 'metformin 500 MG Oral Tablet',
      coding: [{ system: MedRec.RXNORM_SYSTEM, code: '861007', display: 'metformin 500 MG Oral Tablet' }]
    }
  });

  const result = MedRec.matchMedicationPairs(statements, requests);
  assert.equal(result.matches.length, 3);
  assert.deepEqual(result.unmatchedStatementIds, ['stmt-orphan']);
  assert.deepEqual(result.unmatchedRequestIds, ['rx-orphan']);
});

test('matchMedicationPairs: tolerates missing/empty inputs and reference-only meds', () => {
  assert.deepEqual(MedRec.matchMedicationPairs(null, null), {
    matches: [],
    unmatchedStatementIds: [],
    unmatchedRequestIds: []
  });

  const referenceOnly = [{ _id: 'stmt-ref', medicationReference: { display: 'Jardiance' } }];
  const result = MedRec.matchMedicationPairs(referenceOnly, betsyFixtures().requests);
  assert.equal(result.matches.length, 0);
  assert.deepEqual(result.unmatchedStatementIds, ['stmt-ref']);
});

test('getMedicationDisplay: text -> coding display -> reference display -> fallback', () => {
  assert.equal(MedRec.getMedicationDisplay({
    medicationCodeableConcept: { text: 'Jardiance 10mg' }
  }), 'Jardiance 10mg');
  assert.equal(MedRec.getMedicationDisplay({
    medicationCodeableConcept: { coding: [{ code: 'x', display: 'From Coding' }] }
  }), 'From Coding');
  assert.equal(MedRec.getMedicationDisplay({
    medicationReference: { display: 'From Reference' }
  }), 'From Reference');
  assert.equal(MedRec.getMedicationDisplay({}), 'Unknown Medication');
});
