// packages/pacio-core/lib/constants/TocConstants.js
//
// Central source of truth for all ToC v2 LOINC codes, profile URLs, and section definitions.
// Based on the PACIO Transitions of Care Implementation Guide (build.fhir.org/ig/HL7/fhir-transitions-of-care-ig/)

import { get } from 'lodash';

export const TocConstants = {
  // ===== Profile URLs =====
  profiles: {
    TOC_BUNDLE: 'http://hl7.org/fhir/us/pacio-toc/StructureDefinition/TOC-Bundle',
    TOC_COMPOSITION: 'http://hl7.org/fhir/us/pacio-toc/StructureDefinition/TOC-Composition',
    TOC_DOCUMENT_REFERENCE: 'http://hl7.org/fhir/us/pacio-toc/StructureDefinition/TOC-DocumentReference',
    POINT_OF_CONTACT_EXTENSION: 'http://hl7.org/fhir/us/pacio-toc/StructureDefinition/point-of-contact-extension'
  },

  // ===== Code Systems =====
  codeSystems: {
    LOINC: 'http://loinc.org',
    TOC_TEMP_CS: 'http://hl7.org/fhir/us/pacio-toc/CodeSystem/toc-temp-cs'
  },

  // ===== Value Sets =====
  valueSets: {
    TOC_DEL_LOINC: 'http://hl7.org/fhir/us/pacio-toc/ValueSet/toc-del-loinc-vs'
  },

  // ===== Composition Type Code (Transfer Summary Note) =====
  // Note: in the current ToC CI build, 18761-7 is the FIXED category and
  // Composition.type is extensibly bound to HL7 doc type codes (which
  // include 18761-7). Stamping both type and category with 18761-7 conforms.
  compositionType: {
    system: 'http://loinc.org',
    code: '18761-7',
    display: 'Transfer Summary Note'
  },

  // ===== Composition Category (fixed in ToC CI build) =====
  compositionCategory: {
    system: 'http://loinc.org',
    code: '18761-7',
    display: 'Transfer Summary Note'
  },

  // ===== Legacy Composition Query Codes (for backward compatibility) =====
  legacyCompositionCodes: [
    'transition-of-care',
    'continuity-of-care-document',
    '18842-5',   // Discharge Summary
    '34133-9',   // Summarization of Episode Note
    '18776-5'    // Plan of Care Note (legacy)
  ],

  // ===== All Composition Query Codes (legacy + v2) =====
  allCompositionCodes: [
    '18761-7',   // Transfer Summary Note (ToC v2 primary)
    '18842-5',   // Discharge Summary
    '34133-9',   // Summarization of Episode Note
    '18776-5',   // Plan of Care Note (legacy)
    'transition-of-care',
    'continuity-of-care-document'
  ],

  // ===== DocumentReference Type Code =====
  documentReferenceType: {
    system: 'http://loinc.org',
    code: '18761-7',
    display: 'Transfer Summary Note'
  },

  // ===== Temporary Code System Codes =====
  tempCodes: {
    BEHAVIORAL_HEALTH_SUMMARY: {
      system: 'http://hl7.org/fhir/us/pacio-toc/CodeSystem/toc-temp-cs',
      code: 'behavioral_health_summary',
      display: 'Behavioral Health Summary'
    }
  },

  // ===== ToC Required Sections (15 sections, all 1..1 MS in profile) =====
  // Verified 2026-06-11 against the ToC IG CI source
  // (github.com/HL7/fhir-transitions-of-care-ig, input/fsh/TOCComposition.fsh).
  // The CI build replaced patient_information (52460-3), care_team (85847-2),
  // nutrition (61144-2), and follow_up (18776-1) with procedures (47519-4),
  // reason_for_referral (42349-1), clinical_results (30954-2), and
  // social_history (29762-2).
  sections: [
    {
      id: 'advance-directives',
      title: 'Advance Directives',
      loinc: '42348-3',
      display: 'Advance directives',
      required: true,
      component: 'DocumentReferences',
      entryTypes: ['DocumentReference']
    },
    {
      id: 'allergies',
      title: 'Allergies and Adverse Reactions',
      loinc: '48765-2',
      display: 'Allergies and adverse reactions Document',
      required: true,
      component: 'AllergyIntolerances',
      entryTypes: ['AllergyIntolerance']
    },
    {
      id: 'behavioral-health',
      title: 'Behavioral Health',
      loinc: 'behavioral_health_summary',
      loincSystem: 'http://hl7.org/fhir/us/pacio-toc/CodeSystem/toc-temp-cs',
      display: 'Behavioral Health Summary',
      required: true,
      component: 'Observations',
      entryTypes: ['Condition', 'Observation']
    },
    {
      id: 'functional-status',
      title: 'Functional Status',
      loinc: '47420-5',
      display: 'Functional status assessment note',
      required: true,
      component: 'Observations',
      entryTypes: ['Observation', 'Condition']
    },
    {
      id: 'immunizations',
      title: 'Immunizations',
      loinc: '11369-6',
      display: 'History of Immunization Narrative',
      required: true,
      component: 'Immunizations',
      entryTypes: ['Immunization']
    },
    {
      id: 'discharge-instructions',
      title: 'Discharge Instructions',
      loinc: '69730-0',
      display: 'Instructions',
      required: true,
      component: 'DocumentReferences',
      entryTypes: ['DiagnosticReport', 'DocumentReference']
    },
    {
      id: 'medical-devices',
      title: 'Medical Devices',
      loinc: '46264-8',
      display: 'History of medical device use',
      required: true,
      component: 'Devices',
      entryTypes: ['Device']
    },
    {
      id: 'medications',
      title: 'Medications',
      loinc: '10160-0',
      display: 'History of Medication use Narrative',
      required: true,
      component: 'Medications',
      entryTypes: ['List', 'MedicationRequest', 'Medication']
    },
    {
      id: 'plan-of-care',
      title: 'Discharge Care Plan',
      loinc: '18776-5',
      display: 'Plan of care note',
      required: true,
      component: 'CarePlans',
      entryTypes: ['CarePlan']
    },
    {
      id: 'diagnoses',
      title: 'Problems',
      loinc: '11450-4',
      display: 'Problem list - Reported',
      required: true,
      component: 'Conditions',
      entryTypes: ['Condition']
    },
    {
      id: 'procedures',
      title: 'Procedures',
      loinc: '47519-4',
      display: 'History of Procedures Document',
      required: true,
      component: 'Procedures',
      entryTypes: ['Procedure']
    },
    {
      id: 'reason-for-referral',
      title: 'Reason for Transfer',
      loinc: '42349-1',
      display: 'Reason for referral (narrative)',
      required: true,
      component: 'Conditions',
      entryTypes: ['Condition']
    },
    {
      id: 'clinical-results',
      title: 'Clinical Results',
      loinc: '30954-2',
      display: 'Relevant diagnostic tests/laboratory data note',
      required: true,
      component: 'Observations',
      entryTypes: ['Observation', 'DiagnosticReport']
    },
    {
      id: 'social-history',
      title: 'Social History',
      loinc: '29762-2',
      display: 'Social history note',
      required: true,
      component: 'Observations',
      entryTypes: ['Observation']
    },
    {
      id: 'vital-signs',
      title: 'Vital Signs',
      loinc: '8716-3',
      display: 'Vital signs note',
      required: true,
      component: 'Observations',
      entryTypes: ['Observation']
    }
  ],

  // ===== DEL (Data Element Library) LOINC Codes =====
  // These are the 86 LOINC codes from the toc-del-loinc-vs ValueSet
  delLoincCodes: [
    '21112-8',   // Birth date
    '21843-8',   // History of Usual occupation
    '89383-4',   // Walk 150 feet - functional goal
    '89385-9',   // Walk 10 feet - functional goal
    '89390-9',   // Toilet transfer - functional goal
    '89402-2',   // Picking up object - functional goal
    '89409-7',   // Eating - functional goal
    '89412-1',   // Car transfer - functional goal
    '89416-2',   // Go up and down 4 steps - functional goal
    '89418-8',   // Go up and down 12 steps - functional goal
    '89420-4',   // Go up and down a curb/step - functional goal
    '90489-6',   // MDS v3.0 - Type of assessment
    '90543-0',   // Percent intake by artificial route
    '90544-8',   // Therapies during Part A Medicare stay
    '92850-7',   // Range of motion - Upper extremity
    '92851-5',   // Range of motion - Lower extremity
    '93156-8',   // Pain making it hard to sleep
    '93159-2',   // How often feel lonely or isolated
    '93160-0',   // Limited participation in rehab due to pain
    '93181-6',   // Medication list to patient at discharge
    '93182-4',   // Medication list to subsequent provider at discharge
    '93202-0',   // Ventilator weaning status
    '93203-8',   // Spontaneous breathing trial
    '94876-0',   // Self-care priorities
    '94877-8',   // Mobility priorities
    '94878-6',   // IADL priorities
    '95737-3',   // Expression of ideas and wants
    '95738-1',   // Does patient use wheelchair/scooter
    '95739-9',   // Type of wheelchair/scooter
    '95740-7',   // Understanding verbal and non-verbal content
    '95744-9',   // Hearing ability
    '95745-6',   // Vision ability
    '95813-2'    // Acute change in mental status (CAM)
  ],

  // ===== Helper Methods =====

  /**
   * Get the section LOINC code for a given section ID
   */
  getSectionLoinc: function(sectionId) {
    const section = this.sections.find(function(s) { return s.id === sectionId; });
    return section ? section.loinc : null;
  },

  /**
   * Get the list of required section IDs
   */
  getRequiredSectionIds: function() {
    return this.sections
      .filter(function(s) { return s.required; })
      .map(function(s) { return s.id; });
  },

  /**
   * Check if a Composition matches ToC v2 profile
   */
  isToCV2Composition: function(composition) {
    const typeCode = get(composition, 'type.coding[0].code', '');
    return typeCode === '18761-7' ||
      this.allCompositionCodes.indexOf(typeCode) !== -1;
  },

  /**
   * Check if a section has data entries
   */
  sectionHasEntries: function(composition, sectionId) {
    const sections = get(composition, 'section', []);
    const section = sections.find(function(s) {
      const code = get(s, 'code.coding[0].code', '');
      const sectionDef = TocConstants.sections.find(function(def) { return def.id === sectionId; });
      return sectionDef && code === sectionDef.loinc;
    });
    return section && get(section, 'entry', []).length > 0;
  },

  /**
   * Build a MongoDB query for ToC Compositions
   */
  buildCompositionQuery: function(patientId) {
    const query = {
      'type.coding.code': { $in: this.allCompositionCodes }
    };
    if (patientId) {
      query['subject.reference'] = {
        $in: ['Patient/' + patientId, 'urn:uuid:' + patientId]
      };
    }
    return query;
  }
};
