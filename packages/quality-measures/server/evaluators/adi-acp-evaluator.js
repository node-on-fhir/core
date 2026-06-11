// packages/quality-measures/server/evaluators/adi-acp-evaluator.js
//
// CMS1317v1 Advance Care Planning evaluator — the exploratory PACIO-FHIR
// mapping of the draft eCQM CMS1317v1 (modeled on Quality ID #047) tested at
// the July 2026 CMS Connectathon. The eCQM is QDM-specified; this evaluator
// IS the FHIR mapping. Code lists are parameterized via the measure's
// _pacio metadata (see lib/pacio-measures.js).
//
// Initial population: 18+ at measurement period start, with an inpatient
//   discharge (class IMP/ACUTE, period.end in period).
// Denominator: equals initial population — no exclusions.
// Numerator (ANY of, evaluated against the latest qualifying encounter):
//   1. Non-revoked ACP DocumentReference (ADI type code), dated <= encounter end
//   2. ICD-10-CM Z66 (DNR status) Condition during the hospitalization
//   3. ACP-discussion Procedure (CPT 99497/99498, SNOMED 713603004) during
//      the encounter

import { get } from 'lodash';
import {
  getPatientAge,
  getPatientDocumentReferences,
  getInpatientDischargeEncounters,
  getPatientConditions,
  getPatientProcedures
} from './pacio-data-connector';

const MINIMUM_AGE = 18;

// Fallback code lists if the measure definition isn't supplied
const DEFAULT_ADI_DOCUMENT_CODES = ['42348-3', '81334-5', '89666-0', '89897-1', '75320-2'];
const DEFAULT_DNR_CONDITION_CODES = ['Z66'];
const DEFAULT_ACP_DISCUSSION_CODES = ['99497', '99498', '713603004'];
const DEFAULT_INPATIENT_CLASS_CODES = ['IMP', 'ACUTE'];

function slimDocument(doc) {
  return {
    id: get(doc, '_id', get(doc, 'id')),
    typeCode: get(doc, 'type.coding[0].code'),
    typeDisplay: get(doc, 'type.coding[0].display'),
    // Kept nested for back-compat with the existing ADI checklist UI
    type: { coding: [{ code: get(doc, 'type.coding[0].code'), display: get(doc, 'type.coding[0].display') }] },
    status: get(doc, 'status'),
    date: get(doc, 'date')
  };
}

/**
 * Evaluate CMS1317v1 for a single patient.
 * @param {string} patientId - Patient _id (MongoDB primary key)
 * @param {string} periodStart - Measurement period start (ISO date)
 * @param {string} periodEnd - Measurement period end (ISO date)
 * @param {Object} measure - Measure definition (code lists in _pacio); optional
 * @returns {{ inInitialPopulation, inDenominator, inDenominatorExclusion, inNumerator, details }}
 */
export async function evaluateCMS1317(patientId, periodStart, periodEnd, measure) {
  const adiDocumentCodes = get(measure, '_pacio.adiDocumentLoincCodes', DEFAULT_ADI_DOCUMENT_CODES);
  const dnrConditionCodes = get(measure, '_pacio.dnrConditionCodes', DEFAULT_DNR_CONDITION_CODES);
  const acpDiscussionCodes = get(measure, '_pacio.acpDiscussionCodes', DEFAULT_ACP_DISCUSSION_CODES);
  const inpatientClassCodes = get(measure, '_pacio.inpatientEncounterClassCodes', DEFAULT_INPATIENT_CLASS_CODES);

  const result = {
    inInitialPopulation: false,
    inDenominator: false,
    inDenominatorExclusion: false, // CMS1317v1 has no exclusions
    inNumerator: false,
    details: {
      engine: 'pacio-evaluator',
      patientAge: null,
      qualifyingEncounters: [],
      numeratorPaths: {
        acpDocument: { met: false, documents: [] },
        dnrZ66: { met: false, conditions: [] },
        acpDiscussion: { met: false, procedures: [] }
      },
      matchingDirectives: []
    }
  };

  // Step 1: Age >= 18 at measurement period start
  const age = await getPatientAge(patientId, periodStart);
  result.details.patientAge = age;

  if (age < MINIMUM_AGE) {
    console.log('[cms1317-evaluator] Patient ' + patientId + ': age ' + age + ' < ' + MINIMUM_AGE + ', not in IP');
    return result;
  }

  // Step 2: Inpatient discharge during the measurement period
  const encounters = await getInpatientDischargeEncounters(patientId, inpatientClassCodes, periodStart, periodEnd);
  if (encounters.length === 0) {
    console.log('[cms1317-evaluator] Patient ' + patientId + ': no inpatient discharge in period, not in IP');
    return result;
  }

  result.details.qualifyingEncounters = encounters.map(function(enc) {
    return {
      id: get(enc, '_id', get(enc, 'id')),
      classCode: get(enc, 'class.code'),
      periodStart: get(enc, 'period.start'),
      periodEnd: get(enc, 'period.end')
    };
  });

  result.inInitialPopulation = true;
  result.inDenominator = true; // no exclusions

  // Evaluate the numerator against the latest qualifying encounter
  const latestEncounter = encounters.sort(function(a, b) {
    return new Date(get(b, 'period.end', 0)) - new Date(get(a, 'period.end', 0));
  })[0];
  const encounterId = get(latestEncounter, '_id', get(latestEncounter, 'id'));
  const encounterStart = get(latestEncounter, 'period.start');
  const encounterEnd = get(latestEncounter, 'period.end');

  // Path 1: ACP document (advance directive / healthcare agent / portable
  // medical order) dated on or before the encounter end
  const adiDocuments = await getPatientDocumentReferences(patientId, adiDocumentCodes, null, null);
  const qualifyingDocuments = adiDocuments.filter(function(doc) {
    const status = get(doc, 'status');
    if (['current', 'completed', 'active'].indexOf(status) === -1) {
      return false;
    }
    const docDate = get(doc, 'date');
    return !docDate || !encounterEnd || docDate <= encounterEnd;
  });

  result.details.numeratorPaths.acpDocument.documents = qualifyingDocuments.map(slimDocument);
  result.details.numeratorPaths.acpDocument.met = qualifyingDocuments.length > 0;
  result.details.matchingDirectives = result.details.numeratorPaths.acpDocument.documents;

  // Path 2: Z66 DNR status during the hospitalization
  const dnrConditions = await getPatientConditions(patientId, dnrConditionCodes, encounterStart, encounterEnd, encounterId);
  result.details.numeratorPaths.dnrZ66.conditions = dnrConditions.map(function(condition) {
    return {
      id: get(condition, '_id', get(condition, 'id')),
      code: get(condition, 'code.coding[0].code'),
      recordedDate: get(condition, 'recordedDate', get(condition, 'onsetDateTime'))
    };
  });
  result.details.numeratorPaths.dnrZ66.met = dnrConditions.length > 0;

  // Path 3: ACP discussion with documented decision during the encounter
  // (presence of the coded Procedure during the encounter satisfies the path
  // for Connectathon purposes; the stricter "documented decision" reading is
  // an open mapping question — see guides/cms1317-fhir-mapping.md)
  const acpProcedures = await getPatientProcedures(patientId, acpDiscussionCodes, encounterStart, encounterEnd);
  result.details.numeratorPaths.acpDiscussion.procedures = acpProcedures.map(function(procedure) {
    return {
      id: get(procedure, '_id', get(procedure, 'id')),
      code: get(procedure, 'code.coding[0].code'),
      performedDateTime: get(procedure, 'performedDateTime', get(procedure, 'performedPeriod.start'))
    };
  });
  result.details.numeratorPaths.acpDiscussion.met = acpProcedures.length > 0;

  result.inNumerator =
    result.details.numeratorPaths.acpDocument.met ||
    result.details.numeratorPaths.dnrZ66.met ||
    result.details.numeratorPaths.acpDiscussion.met;

  console.log('[cms1317-evaluator] Patient ' + patientId + ': IP=true, numerator=' + result.inNumerator +
    ' (acpDocument=' + result.details.numeratorPaths.acpDocument.met +
    ', dnrZ66=' + result.details.numeratorPaths.dnrZ66.met +
    ', acpDiscussion=' + result.details.numeratorPaths.acpDiscussion.met + ')');

  return result;
}
