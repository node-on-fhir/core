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

// Fallback code lists if the measure definition isn't supplied.
// LOINC-verified document types (see lib/pacio-measures.js for the breakdown);
// 89666-0/89897-1 don't exist in LOINC and are retained only for documents
// created by earlier builds.
const DEFAULT_ADI_DOCUMENT_CODES = [
  '42348-3', '75320-2', '81334-5', '64298-3', '92664-2', '93037-0', '81351-9',
  '89666-0', '89897-1' // legacy, non-LOINC
];
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

// In-memory encounter-window predicates. These mirror the Mongo clauses the
// data connector applies when a (windowStart, windowEnd) pair is supplied,
// including its two edge behaviors: a missing bound means NO window (all
// records match), and Mongo string-range clauses only match string-typed
// values (type bracketing) — hence the typeof check.
function inWindow(value, windowStart, windowEnd) {
  return typeof value === 'string' && value >= windowStart && value <= windowEnd;
}

function filterProceduresByWindow(procedures, windowStart, windowEnd) {
  if (!windowStart || !windowEnd) {
    return procedures;
  }
  return procedures.filter(function(p) {
    return inWindow(get(p, 'performedDateTime'), windowStart, windowEnd) ||
      inWindow(get(p, 'performedPeriod.start'), windowStart, windowEnd);
  });
}

function filterObservationsByWindow(observations, windowStart, windowEnd) {
  if (!windowStart || !windowEnd) {
    return observations;
  }
  return observations.filter(function(o) {
    return inWindow(get(o, 'effectiveDateTime'), windowStart, windowEnd) ||
      inWindow(get(o, 'effectivePeriod.start'), windowStart, windowEnd) ||
      inWindow(get(o, 'issued'), windowStart, windowEnd);
  });
}

function filterServiceRequestsByWindow(serviceRequests, windowStart, windowEnd) {
  if (!windowStart || !windowEnd) {
    return serviceRequests;
  }
  return serviceRequests.filter(function(sr) {
    return inWindow(get(sr, 'authoredOn'), windowStart, windowEnd);
  });
}

function filterConditionsByWindow(conditions, windowStart, windowEnd, encounterId) {
  if (!windowStart || !windowEnd) {
    return conditions;
  }
  return conditions.filter(function(c) {
    return inWindow(get(c, 'recordedDate'), windowStart, windowEnd) ||
      inWindow(get(c, 'onsetDateTime'), windowStart, windowEnd) ||
      (encounterId && get(c, 'encounter.reference') === 'Encounter/' + encounterId);
  });
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
  //
  // Every numerator query is encounter-independent as issued (the encounter
  // window is applied to the results, below), so fetch each resource type
  // ONCE per patient and evaluate the encounter windows against the
  // in-memory arrays — the previous per-encounter query pattern cost ~10
  // collection round-trips per encounter and was the prod hot spot.
  const acpDiscussionProcedureCodes = await getValueSetCodes(acpDiscussionVsOid);
  const documentVsCodes = []
    .concat(await getValueSetCodes(get(measure, '_pacio.valueSetOids.advanceDirectiveDocumentation', '2.16.840.1.113762.1.4.1170.43')))
    .concat(await getValueSetCodes(get(measure, '_pacio.valueSetOids.healthcareAgentAndPowerOfAttorney', '2.16.840.1.113762.1.4.1170.31')))
    .concat(await getValueSetCodes(get(measure, '_pacio.valueSetOids.portableMedicalOrderDocumentation', '2.16.840.1.113762.1.4.1170.48')));

  const adiDocuments = await getPatientDocumentReferences(patientId, adiDocumentCodes, null, null);
  // Path 1 faithful previously queried with (null, encounterEnd), which the
  // connector treats as "no date window" — preserved (date-bounding this
  // path is a correctness follow-up, tracked in guides/cms1317-fhir-mapping.md)
  const docProcedures = documentVsCodes.length > 0
    ? await getPatientProcedures(patientId, documentVsCodes, null, null) : [];
  const docObservations = documentVsCodes.length > 0
    ? await getPatientObservations(patientId, documentVsCodes, null, null) : [];
  const discussionProcedures = acpDiscussionProcedureCodes.length > 0
    ? await getPatientProcedures(patientId, acpDiscussionProcedureCodes, null, null) : [];
  const discussionObservations = await getPatientObservations(patientId, acpAssessmentCodes, null, null);
  const dnrOrders = await getPatientServiceRequests(patientId, dnrOrderCodes, null, null);
  const dnrConditions = await getPatientConditions(patientId, dnrConditionCodes, null, null, null);

  for (const encounter of encounters) {
    const encounterId = get(encounter, '_id', get(encounter, 'id'));
    const encounterStart = get(encounter, 'period.start');
    const encounterEnd = get(encounter, 'period.end');

    // ---- Path 1: ACP document before end of encounter ----
    // PACIO mapping: non-revoked ADI DocumentReference dated <= encounter end
    if (!paths.acpDocument.met) {
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
      if (docProcedures.length > 0 || docObservations.length > 0) {
        paths.acpDocument.faithfulMet = true;
        paths.acpDocument.procedures = docProcedures.map(function(p) { return slimCoded(p); });
      }
    }

    // ---- Path 2: ACP discussion with documented decision during encounter ----
    if (!paths.acpDiscussion.met) {
      const windowedProcedures = filterProceduresByWindow(discussionProcedures, encounterStart, encounterEnd);
      const windowedObservations = filterObservationsByWindow(discussionObservations, encounterStart, encounterEnd);
      if (windowedProcedures.length > 0 || windowedObservations.length > 0) {
        paths.acpDiscussion.met = true;
        paths.acpDiscussion.procedures = windowedProcedures.map(function(p) { return slimCoded(p); });
        paths.acpDiscussion.observations = windowedObservations.map(function(o) { return slimCoded(o); });
      }
    }

    // ---- Path 3: DNR order (Z66) during encounter ----
    // Faithful: Intervention, Order -> ServiceRequest authoredOn during encounter
    if (!paths.dnrZ66.faithfulMet) {
      const windowedOrders = filterServiceRequestsByWindow(dnrOrders, encounterStart, encounterEnd);
      if (windowedOrders.length > 0) {
        paths.dnrZ66.faithfulMet = true;
        paths.dnrZ66.met = true;
        paths.dnrZ66.serviceRequests = windowedOrders.map(function(sr) { return slimCoded(sr, 'authoredOn'); });
      }
    }
    // PACIO extension: Z66 Condition during the hospitalization
    if (!paths.dnrZ66.met) {
      const windowedConditions = filterConditionsByWindow(dnrConditions, encounterStart, encounterEnd, encounterId);
      if (windowedConditions.length > 0) {
        paths.dnrZ66.met = true;
        paths.dnrZ66.conditions = windowedConditions.map(function(c) { return slimCoded(c, 'recordedDate'); });
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
