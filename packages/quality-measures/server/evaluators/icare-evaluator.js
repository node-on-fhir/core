// packages/quality-measures/server/evaluators/icare-evaluator.js
//
// I-CARE Measure Evaluator: Completeness of Transitions of Care Documentation
// Checks whether a patient's TOC Composition has all required sections populated.

import { get } from 'lodash';
import { getPatientCompositions, checkSectionCompleteness, getPatientEncounters } from './pacio-data-connector';
import { REQUIRED_TOC_SECTIONS, REQUIRED_TOC_SECTION_CODES } from '../../lib/toc-sections';

const TOC_COMPOSITION_PROFILE = 'http://hl7.org/fhir/us/pacio-toc/StructureDefinition/TOC-Composition';

/**
 * Evaluate I-CARE measure for a single patient.
 * @param {string} patientId - FHIR patient ID
 * @param {string} periodStart - Measurement period start (ISO date)
 * @param {string} periodEnd - Measurement period end (ISO date)
 * @returns {{ inInitialPopulation, inDenominator, inDenominatorExclusion, inNumerator, details }}
 */
export async function evaluateICARE(patientId, periodStart, periodEnd) {
  const result = {
    inInitialPopulation: false,
    inDenominator: false,
    inDenominatorExclusion: false,
    inNumerator: false,
    details: {
      compositions: [],
      sectionCompleteness: null
    }
  };

  // Step 1: Check if patient has encounters in the measurement period (discharge to PAC)
  const encounters = await getPatientEncounters(patientId, periodStart, periodEnd);

  // Check for discharge encounters
  const dischargeEncounters = encounters.filter(function(enc) {
    const classCode = get(enc, 'class.code', '');
    const dischargeDisposition = get(enc, 'hospitalization.dischargeDisposition.coding[0].code', '');
    // Include inpatient encounters with discharge
    return classCode === 'IMP' || classCode === 'ACUTE' || classCode === 'hosp' ||
      dischargeDisposition !== '';
  });

  if (dischargeEncounters.length === 0) {
    // Also check for any compositions as a proxy for having a discharge
    const compositions = await getPatientCompositions(patientId, null, periodStart, periodEnd);
    if (compositions.length === 0) {
      console.log('[icare-evaluator] Patient ' + patientId + ': No discharge encounters or TOC compositions found');
      return result;
    }
  }

  // Patient is in Initial Population
  result.inInitialPopulation = true;
  result.inDenominator = true;

  // Step 2: Check denominator exclusions (death or AMA discharge)
  const excludedEncounters = encounters.filter(function(enc) {
    const disposition = get(enc, 'hospitalization.dischargeDisposition.coding[0].code', '');
    // Expired or left AMA
    return disposition === 'exp' || disposition === 'expired' ||
      disposition === 'left-against-medical-advice' || disposition === 'aama';
  });

  if (excludedEncounters.length > 0) {
    result.inDenominatorExclusion = true;
    console.log('[icare-evaluator] Patient ' + patientId + ': Excluded (death or AMA)');
    return result;
  }

  // Step 3: Check numerator - TOC Composition completeness
  const compositions = await getPatientCompositions(patientId, TOC_COMPOSITION_PROFILE, periodStart, periodEnd);

  // If no compositions with TOC profile, also search without profile filter
  let allCompositions = compositions;
  if (compositions.length === 0) {
    allCompositions = await getPatientCompositions(patientId, null, periodStart, periodEnd);
  }

  // Slim projections — full resources would bloat the method payload
  result.details.compositions = allCompositions.map(function(composition) {
    return {
      id: get(composition, '_id', get(composition, 'id')),
      title: get(composition, 'title'),
      date: get(composition, 'date'),
      sectionCount: get(composition, 'section', []).length
    };
  });

  if (allCompositions.length === 0) {
    console.log('[icare-evaluator] Patient ' + patientId + ': No TOC compositions, not in numerator');
    return result;
  }

  // Check the most recent composition for section completeness
  const latestComposition = allCompositions.sort(function(a, b) {
    return new Date(get(b, 'date', 0)) - new Date(get(a, 'date', 0));
  })[0];

  const completeness = checkSectionCompleteness(latestComposition, REQUIRED_TOC_SECTION_CODES);
  result.details.sectionCompleteness = completeness;

  // Per-section breakdown for the UI checklist
  result.details.sectionResults = REQUIRED_TOC_SECTIONS.map(function(section) {
    return {
      code: section.code,
      display: section.display,
      hasEntries: completeness.presentSections.includes(section.code)
    };
  });

  if (completeness.complete) {
    result.inNumerator = true;
    console.log('[icare-evaluator] Patient ' + patientId + ': All required sections complete');
  } else {
    console.log('[icare-evaluator] Patient ' + patientId + ': Missing sections: ' +
      completeness.missingSections.join(', '));
  }

  return result;
}

/**
 * Get the list of required section codes for display purposes.
 */
export function getRequiredSectionCodes() {
  return REQUIRED_TOC_SECTION_CODES;
}
