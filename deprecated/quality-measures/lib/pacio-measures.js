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
          description: 'Patients with ANY of: (1) ACP document before encounter end, (2) documented ACP discussion with decision during the encounter, (3) Do Not Resuscitate order (ICD-10-CM Z66) during the hospitalization',
          criteria: { language: 'text/plain', expression: 'Per CMS1317-v1.0.000 CQL. Path 1 (document): Intervention/Assessment Performed from Advance Directive Documentation / Healthcare Agent and POA / Portable Medical Order value sets before end of encounter — PACIO mapping additionally accepts non-revoked ADI DocumentReferences. Path 2 (discussion): Intervention Performed from Advance Care Planning Documentation VS union Assessment Performed LOINC 75773-2 during the encounter. Path 3 (DNR): Intervention Order Z66 (FHIR ServiceRequest) during the encounter — PACIO mapping additionally accepts a Z66 Condition.' }
        }
      ]
    }],
    // Custom metadata: parameterized code lists for the evaluator + UI.
    // Resolved AUTHORITATIVELY 2026-06-11 from the official CMS1317-v1.0.000
    // QDM spec package (vendored at specs/cms1317/qdm/). Value set OIDs are
    // exact; expansions for the 1170.x sets are proxies until fetched from
    // VSAC (scripts/fetch-vsac-valuesets.js + UMLS_API_KEY).
    _pacio: {
      scenario: 'Scenario 1',
      track: 'PACIO',
      connectathon: 'CMS FHIR Connectathon (July 2026)',
      valueSetOids: {
        advanceCarePlanningDocumentation: '2.16.840.1.113762.1.4.1170.45',
        advanceDirectiveDocumentation: '2.16.840.1.113762.1.4.1170.43',
        healthcareAgentAndPowerOfAttorney: '2.16.840.1.113762.1.4.1170.31',
        portableMedicalOrderDocumentation: '2.16.840.1.113762.1.4.1170.48',
        encounterInpatient: '2.16.840.1.113883.3.666.5.307'
      },
      // PACIO mapping: ADI documents live as DocumentReferences (path 1,
      // pacioExtension — the spec's faithful reading is Procedure/Observation
      // from the document value sets)
      adiDocumentLoincCodes: ['42348-3', '81334-5', '89666-0', '89897-1', '75320-2'],
      // Spec: "Intervention, Order": Z66 -> FHIR ServiceRequest (faithful)
      dnrOrderCodes: ['Z66'],
      // PACIO-pragmatic extension: Z66 recorded as a Condition also counts
      dnrConditionCodes: ['Z66'],
      // Spec: "Assessment, Performed" LOINC 75773-2 -> FHIR Observation
      acpDiscussionAssessmentCodes: ['75773-2'],
      // Spec: "Intervention, Performed" from VS 1170.45 -> FHIR Procedure
      // (codes resolved from the vendored/VSAC ValueSet at runtime)
      acpDiscussionValueSetOid: '2.16.840.1.113762.1.4.1170.45',
      // Encounter Inpatient VS expansion (public, cqframework ecqm-content):
      inpatientEncounterTypeCodes: ['183452005', '32485007', '8715000'],
      // PACIO-pragmatic additional match on Encounter.class
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
