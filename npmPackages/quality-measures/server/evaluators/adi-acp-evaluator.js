// packages/quality-measures/server/evaluators/adi-acp-evaluator.js
//
// CMS1317v1 Advance Care Planning evaluator — PACIO-FHIR mapping of the
// draft eCQM CMS1317-v1.0.000 (July 2026 CMS Connectathon, Scenario 1).
//
// Logic verified against the OFFICIAL QDM spec package (vendored at
// specs/cms1317/qdm/CMS1317AdvancedCarePlanning-1.0.000.cql):
//
//   IP/Denominator: exists inpatient encounter ("Encounter Inpatient" VS,
//     age >= 18 at MP start, relevantPeriod ends during MP). No exclusions.
//   Numerator (any qualifying encounter may satisfy a path):
//     Path 1 — ACP document: Intervention/Assessment Performed from the
//       Advance Directive Documentation / Healthcare Agent and POA /
//       Portable Medical Order value sets, starting before end of encounter.
//       PACIO extension: non-revoked ADI DocumentReferences also count
//       (in PACIO systems the document IS a DocumentReference).
//     Path 2 — ACP discussion: Intervention Performed from the Advance Care
//       Planning Documentation VS (FHIR Procedure) UNION Assessment
//       Performed LOINC 75773-2 (FHIR Observation), during the encounter.
//     Path 3 — DNR: Intervention Order Z66 (FHIR ServiceRequest, authoredOn
//       during the encounter). PACIO extension: a Z66 Condition during the
//       hospitalization also counts.
//
// Documented deviation: the spec's hospitalization window
// (Global."HospitalizationWithObservationAndOutpatientSurgeryService",
// which extends backward through immediately-prior obs/ED stays) is
// simplified to Encounter.period. See guides/cms1317-fhir-mapping.md.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import {
  getPatientAge,
  getPatientDocumentReferences,
  getInpatientDischargeEncounters,
  getPatientConditions,
  getPatientProcedures,
  getPatientObservations,
  getPatientServiceRequests,
  getValueSetCodes
} from './pacio-data-connector';

const log = (Meteor.Logger ? Meteor.Logger.for('adi-acp-evaluator') : console);

const MINIMUM_AGE = 18;

// Fallback code lists if the measure definition isn't supplied
const DEFAULT_ADI_DOCUMENT_CODES = ['42348-3', '81334-5', '89666-0', '89897-1', '75320-2'];
const DEFAULT_DNR_ORDER_CODES = ['Z66'];
const DEFAULT_DNR_CONDITION_CODES = ['Z66'];
const DEFAULT_ACP_ASSESSMENT_CODES = ['75773-2'];
const DEFAULT_ACP_DISCUSSION_VS_OID = '2.16.840.1.113762.1.4.1170.45';
const DEFAULT_INPATIENT_CLASS_CODES = ['IMP', 'ACUTE'];
const DEFAULT_INPATIENT_TYPE_CODES = ['183452005', '32485007', '8715000'];

function slimDocument(doc) {
  return {
    id: get(doc, '_id', get(doc, 'id')),
    typeCode: get(doc, 'type.coding[0].code'),
    typeDisplay: get(doc, 'type.coding[0].display'),
    // Kept nested for back-compat with the ADI checklist UI
    type: { coding: [{ code: get(doc, 'type.coding[0].code'), display: get(doc, 'type.coding[0].display') }] },
    status: get(doc, 'status'),
    date: get(doc, 'date')
  };
}

function slimCoded(resource, dateField) {
  return {
    id: get(resource, '_id', get(resource, 'id')),
    code: get(resource, 'code.coding[0].code'),
    date: get(resource, dateField) ||
      get(resource, 'effectiveDateTime') ||
      get(resource, 'effectivePeriod.start') ||
      get(resource, 'performedDateTime') ||
      get(resource, 'performedPeriod.start') ||
      get(resource, 'authoredOn') ||
      get(resource, 'recordedDate')
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
  const dnrOrderCodes = get(measure, '_pacio.dnrOrderCodes', DEFAULT_DNR_ORDER_CODES);
  const dnrConditionCodes = get(measure, '_pacio.dnrConditionCodes', DEFAULT_DNR_CONDITION_CODES);
  const acpAssessmentCodes = get(measure, '_pacio.acpDiscussionAssessmentCodes', DEFAULT_ACP_ASSESSMENT_CODES);
  const acpDiscussionVsOid = get(measure, '_pacio.acpDiscussionValueSetOid', DEFAULT_ACP_DISCUSSION_VS_OID);
  const inpatientClassCodes = get(measure, '_pacio.inpatientEncounterClassCodes', DEFAULT_INPATIENT_CLASS_CODES);
  const inpatientTypeCodes = get(measure, '_pacio.inpatientEncounterTypeCodes', DEFAULT_INPATIENT_TYPE_CODES);

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
        acpDocument: { met: false, faithfulMet: false, pacioExtension: true, documents: [], procedures: [] },
        acpDiscussion: { met: false, procedures: [], observations: [] },
        dnrZ66: { met: false, faithfulMet: false, serviceRequests: [], conditions: [] }
      },
      matchingDirectives: []
    }
  };

  // Step 1: Age >= 18 at measurement period start
  const age = await getPatientAge(patientId, periodStart);
  result.details.patientAge = age;

  if (age < MINIMUM_AGE) {
    log.debug('cms1317-evaluator Patient not in IP: age below minimum', { patientId, age, minimumAge: MINIMUM_AGE });
    return result;
  }

  // Step 2: Inpatient discharge during the measurement period
  // (Encounter Inpatient VS type codes — faithful — OR class codes — PACIO)
  const encounters = await getInpatientDischargeEncounters(
    patientId, inpatientClassCodes, periodStart, periodEnd, inpatientTypeCodes);
  if (encounters.length === 0) {
    log.debug('cms1317-evaluator Patient not in IP: no inpatient discharge', { patientId });
    return result;
  }

  result.details.qualifyingEncounters = encounters.map(function(enc) {
    return {
      id: get(enc, '_id', get(enc, 'id')),
      classCode: get(enc, 'class.code'),
      typeCode: get(enc, 'type[0].coding[0].code'),
      periodStart: get(enc, 'period.start'),
      periodEnd: get(enc, 'period.end')
    };
  });

  result.inInitialPopulation = true;
  result.inDenominator = true; // no exclusions

  const paths = result.details.numeratorPaths;

  // Per spec, a numerator event may pair with ANY qualifying encounter
  // ("with ... such that"), so evaluate every encounter's window.
  // ACP discussion Procedure codes come from the 1170.45 expansion when the
  // vendored/VSAC ValueSet is loaded; falls back to the assessment codes.
  const acpDiscussionProcedureCodes = await getValueSetCodes(acpDiscussionVsOid);

  for (const encounter of encounters) {
    const encounterId = get(encounter, '_id', get(encounter, 'id'));
    const encounterStart = get(encounter, 'period.start');
    const encounterEnd = get(encounter, 'period.end');

    // ---- Path 1: ACP document before end of encounter ----
    // PACIO mapping: non-revoked ADI DocumentReference dated <= encounter end
    if (!paths.acpDocument.met) {
      const adiDocuments = await getPatientDocumentReferences(patientId, adiDocumentCodes, null, null);
      const qualifyingDocuments = adiDocuments.filter(function(doc) {
        const status = get(doc, 'status');
        if (['current', 'completed', 'active'].indexOf(status) === -1) {
          return false;
        }
        const docDate = get(doc, 'date');
        return !docDate || !encounterEnd || docDate <= encounterEnd;
      });
      if (qualifyingDocuments.length > 0) {
        paths.acpDocument.met = true;
        paths.acpDocument.documents = qualifyingDocuments.map(slimDocument);
        result.details.matchingDirectives = paths.acpDocument.documents;
      }
    }
    // Faithful reading: Intervention/Assessment Performed from the document
    // value sets (Procedures/Observations) before end of encounter
    if (!paths.acpDocument.faithfulMet) {
      const documentVsCodes = []
        .concat(await getValueSetCodes(get(measure, '_pacio.valueSetOids.advanceDirectiveDocumentation', '2.16.840.1.113762.1.4.1170.43')))
        .concat(await getValueSetCodes(get(measure, '_pacio.valueSetOids.healthcareAgentAndPowerOfAttorney', '2.16.840.1.113762.1.4.1170.31')))
        .concat(await getValueSetCodes(get(measure, '_pacio.valueSetOids.portableMedicalOrderDocumentation', '2.16.840.1.113762.1.4.1170.48')));
      if (documentVsCodes.length > 0) {
        const docProcedures = await getPatientProcedures(patientId, documentVsCodes, null, encounterEnd);
        const docObservations = await getPatientObservations(patientId, documentVsCodes, null, encounterEnd);
        if (docProcedures.length > 0 || docObservations.length > 0) {
          paths.acpDocument.faithfulMet = true;
          paths.acpDocument.procedures = docProcedures.map(function(p) { return slimCoded(p); });
        }
      }
    }

    // ---- Path 2: ACP discussion with documented decision during encounter ----
    if (!paths.acpDiscussion.met) {
      const discussionProcedures = acpDiscussionProcedureCodes.length > 0
        ? await getPatientProcedures(patientId, acpDiscussionProcedureCodes, encounterStart, encounterEnd)
        : [];
      const discussionObservations = await getPatientObservations(patientId, acpAssessmentCodes, encounterStart, encounterEnd);
      if (discussionProcedures.length > 0 || discussionObservations.length > 0) {
        paths.acpDiscussion.met = true;
        paths.acpDiscussion.procedures = discussionProcedures.map(function(p) { return slimCoded(p); });
        paths.acpDiscussion.observations = discussionObservations.map(function(o) { return slimCoded(o); });
      }
    }

    // ---- Path 3: DNR order (Z66) during encounter ----
    // Faithful: Intervention, Order -> ServiceRequest authoredOn during encounter
    if (!paths.dnrZ66.faithfulMet) {
      const dnrOrders = await getPatientServiceRequests(patientId, dnrOrderCodes, encounterStart, encounterEnd);
      if (dnrOrders.length > 0) {
        paths.dnrZ66.faithfulMet = true;
        paths.dnrZ66.met = true;
        paths.dnrZ66.serviceRequests = dnrOrders.map(function(sr) { return slimCoded(sr, 'authoredOn'); });
      }
    }
    // PACIO extension: Z66 Condition during the hospitalization
    if (!paths.dnrZ66.met) {
      const dnrConditions = await getPatientConditions(patientId, dnrConditionCodes, encounterStart, encounterEnd, encounterId);
      if (dnrConditions.length > 0) {
        paths.dnrZ66.met = true;
        paths.dnrZ66.conditions = dnrConditions.map(function(c) { return slimCoded(c, 'recordedDate'); });
      }
    }

    if (paths.acpDocument.met && paths.acpDiscussion.met && paths.dnrZ66.met) {
      break; // every path satisfied; no need to scan further encounters
    }
  }

  result.inNumerator = paths.acpDocument.met || paths.acpDocument.faithfulMet ||
    paths.acpDiscussion.met || paths.dnrZ66.met;

  log.debug('cms1317-evaluator Patient evaluation result', { patientId, inNumerator: result.inNumerator, acpDocumentMet: paths.acpDocument.met, faithfulMet: paths.acpDocument.faithfulMet, acpDiscussionMet: paths.acpDiscussion.met, dnrZ66Met: paths.dnrZ66.met, dnrZ66FaithfulMet: paths.dnrZ66.faithfulMet });

  return result;
}
