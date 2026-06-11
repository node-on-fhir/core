// packages/quality-measures/lib/pacio-measures.js
//
// PACIO-specific measure definitions for CMS Connectathon 7:
// 1. I-CARE: Completeness of Transitions of Care Documentation
// 2. ADI/ACP: Advance Care Planning Documentation (analogous to Quality ID #047)

export const PacioMeasures = {
  'PACIO-ICARE-v1': {
    resourceType: 'Measure',
    id: 'PACIO-ICARE-v1',
    url: 'http://hl7.org/fhir/us/pacio-toc/Measure/ICARE',
    version: '1.0.0',
    name: 'ICARE',
    title: 'I-CARE: Completeness of Transitions of Care Documentation',
    status: 'draft',
    experimental: true,
    description: 'Measures the completeness of Transitions of Care documentation for patients discharged from hospital to post-acute care (PAC) settings. Evaluates whether the TOC Composition has all required sections populated with entries per the PACIO TOC IG.',
    scoring: 'proportion',
    type: [
      {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/measure-type',
          code: 'process',
          display: 'Process'
        }]
      }
    ],
    improvementNotation: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/measure-improvement-notation',
        code: 'increase',
        display: 'Increased score indicates improvement'
      }]
    },
    group: [{
      population: [
        {
          code: { coding: [{ code: 'initial-population' }] },
          description: 'Patients discharged from hospital to PAC within measurement period',
          criteria: { language: 'text/plain', expression: 'Patients with an encounter of type discharge during the measurement period who have a subsequent PAC encounter.' }
        },
        {
          code: { coding: [{ code: 'denominator' }] },
          description: 'Same as initial population',
          criteria: { language: 'text/plain', expression: 'Same as initial population.' }
        },
        {
          code: { coding: [{ code: 'denominator-exclusion' }] },
          description: 'Patients who died during encounter or were discharged AMA',
          criteria: { language: 'text/plain', expression: 'Patients whose encounter has a discharge disposition of expired or left against medical advice.' }
        },
        {
          code: { coding: [{ code: 'numerator' }] },
          description: 'Patients whose TOC-Composition has all required sections populated with entries',
          criteria: { language: 'text/plain', expression: 'Patients with a Composition conforming to TOC-Composition profile where all required sections have at least one entry reference.' }
        }
      ]
    }],
    // Custom metadata for UI display
    _pacio: {
      scenario: 'Scenario 1 & 3',
      track: 'PACIO',
      connectathon: 'CMS FHIR Connectathon 7 (July 2026)',
      requiredSections: [
        'advance-directives', 'allergies', 'behavioral-health', 'functional-status',
        'immunizations', 'discharge-instructions', 'medical-devices', 'medications',
        'plan-of-care', 'diagnoses', 'procedures', 'reason-for-referral',
        'clinical-results', 'social-history', 'vital-signs'
      ],
      relatedPage: '/transition-of-care'
    }
  },

  'CMS1317v1': {
    resourceType: 'Measure',
    id: 'CMS1317v1',
    url: 'https://ecqi.healthit.gov/ecqm/hosp-inpt/2028/cms1317v1',
    version: '1.0.000',
    name: 'AdvanceCarePlanning',
    title: 'CMS1317v1: Advance Care Planning (PACIO FHIR mapping)',
    status: 'draft',
    experimental: true,
    description: 'Percentage of patients aged 18 and older discharged from an acute care hospital with advance care planning documentation: an ACP document (healthcare agent designation, advance directive, or portable medical order), an ICD-10-CM Z66 DNR status during the hospitalization, or a documented ACP discussion with a documented decision during the encounter. Exploratory PACIO-FHIR mapping of the draft eCQM CMS1317v1 (modeled on Quality ID #047) for the July 2026 CMS Connectathon. The eCQM is QDM-specified; this evaluator IS the FHIR mapping under test.',
    scoring: 'proportion',
    type: [
      {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/measure-type',
          code: 'process',
          display: 'Process'
        }]
      }
    ],
    improvementNotation: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/measure-improvement-notation',
        code: 'increase',
        display: 'Increased score indicates improvement'
      }]
    },
    group: [{
      population: [
        {
          code: { coding: [{ code: 'initial-population' }] },
          description: 'Patients 18+ at the start of the measurement period with an inpatient discharge from an acute or critical access hospital during the measurement period',
          criteria: { language: 'text/plain', expression: 'Age >= 18 at measurement period start AND at least one inpatient encounter (class IMP/ACUTE, status finished) whose period.end falls within the measurement period.' }
        },
        {
          code: { coding: [{ code: 'denominator' }] },
          description: 'Equals initial population (no exclusions)',
          criteria: { language: 'text/plain', expression: 'Same as initial population. CMS1317v1 defines no denominator exclusions.' }
        },
        {
          code: { coding: [{ code: 'numerator' }] },
          description: 'Patients with ANY of: (1) ACP document before encounter end, (2) ICD-10-CM Z66 DNR status during hospitalization, (3) documented ACP discussion with documented decision during the encounter',
          criteria: { language: 'text/plain', expression: 'Path 1: non-revoked DocumentReference with ADI type code, date <= encounter period.end. Path 2: Condition Z66 recorded during the hospitalization or linked to the encounter. Path 3: Procedure with ACP discussion code (CPT 99497/99498, SNOMED 713603004) performed during the encounter.' }
        }
      ]
    }],
    // Custom metadata: parameterized code lists for the evaluator + UI.
    // NOTE: the exact VSAC value sets CMS publishes for CMS1317v1 (healthcare
    // agent designation, portable medical orders, ACP discussion with
    // documented decision) were not retrievable offline — these are
    // defensible placeholders; reconcile with the eCQI value set appendix
    // before the Connectathon.
    _pacio: {
      scenario: 'Scenario 1',
      track: 'PACIO',
      connectathon: 'CMS FHIR Connectathon (July 2026)',
      adiDocumentLoincCodes: ['42348-3', '81334-5', '89666-0', '89897-1', '75320-2'],
      dnrConditionCodes: ['Z66'],
      acpDiscussionCodes: ['99497', '99498', '713603004'],
      inpatientEncounterClassCodes: ['IMP', 'ACUTE'],
      relatedPage: '/advance-directives'
    }
  }
};

/**
 * Get all PACIO measure IDs
 */
export function getPacioMeasureIds() {
  return Object.keys(PacioMeasures);
}

/**
 * Check if a measure ID is an evaluator-backed (PACIO Connectathon) measure.
 * Membership-based, not prefix-based — CMS1317v1 doesn't carry the PACIO- prefix.
 */
export function isPacioMeasure(measureId) {
  return Object.prototype.hasOwnProperty.call(PacioMeasures, measureId);
}

/**
 * Get a PACIO measure definition by ID
 */
export function getPacioMeasure(measureId) {
  return PacioMeasures[measureId] || null;
}
