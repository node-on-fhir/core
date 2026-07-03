// packages/healthcare-surveys/lib/constants/sectionCodes.js

// LOINC codes for HCS Composition sections
const HCS_SECTION_CODES = {
  // Required sections
  REASON_FOR_VISIT: {
    code: "29299-5",
    display: "Reason for visit",
    system: "http://loinc.org",
    required: true
  },
  PROBLEM: {
    code: "11450-4", 
    display: "Problem List",
    system: "http://loinc.org",
    required: true
  },
  ALLERGIES: {
    code: "48765-2",
    display: "Allergies and Intolerances", 
    system: "http://loinc.org",
    required: true
  },
  
  // Optional sections
  ASSESSMENT_PLAN: {
    code: "51847-2",
    display: "Assessment and Plan of Treatment",
    system: "http://loinc.org",
    required: false
  },
  PLAN_OF_TREATMENT: {
    code: "18776-5",
    display: "Plan of Treatment",
    system: "http://loinc.org",
    required: false
  },
  CARE_TEAM: {
    code: "85847-2",
    display: "Care Team",
    system: "http://loinc.org",
    required: false
  },
  COVERAGE: {
    code: "48768-6",
    display: "Coverage",
    system: "http://loinc.org",
    required: false
  },
  GOALS: {
    code: "61146-7",
    display: "Goals",
    system: "http://loinc.org",
    required: false
  },
  IMMUNIZATIONS: {
    code: "11369-6",
    display: "Immunizations",
    system: "http://loinc.org",
    required: false
  },
  MEDICAL_EQUIPMENT: {
    code: "46264-8",
    display: "Medical Equipment",
    system: "http://loinc.org",
    required: false
  },
  MEDICATIONS: {
    code: "10160-0",
    display: "History of Medication use",
    system: "http://loinc.org",
    required: false
  },
  PREGNANCY: {
    code: "90767-5",
    display: "Pregnancy summary",
    system: "http://loinc.org",
    required: false
  },
  PROCEDURES: {
    code: "47519-4",
    display: "History of Procedures",
    system: "http://loinc.org",
    required: false
  },
  RESULTS: {
    code: "30954-2",
    display: "Results",
    system: "http://loinc.org",
    required: false
  },
  SOCIAL_HISTORY: {
    code: "29762-2",
    display: "Social History",
    system: "http://loinc.org",
    required: false
  },
  NOTES: {
    code: "28650-0",
    display: "Notes",
    system: "http://loinc.org",
    required: false
  },
  VITAL_SIGNS: {
    code: "8716-3",
    display: "Vital Signs",
    system: "http://loinc.org",
    required: false
  }
};

// Helper function to get section by code
function getSectionByCode(code) {
  return Object.values(HCS_SECTION_CODES).find(section => section.code === code);
}

// Helper function to get required sections
function getRequiredSections() {
  return Object.values(HCS_SECTION_CODES).filter(section => section.required);
}

// Helper function to get optional sections
function getOptionalSections() {
  return Object.values(HCS_SECTION_CODES).filter(section => !section.required);
}

// Helper function to create a CodeableConcept for a section
function createSectionCodeableConcept(sectionKey) {
  const section = HCS_SECTION_CODES[sectionKey];
  if (!section) {
    return null;
  }
  
  return {
    coding: [{
      system: section.system,
      code: section.code,
      display: section.display
    }],
    text: section.display
  };
}

// Export
if (typeof exports === 'object') {
  module.exports = { 
    HCS_SECTION_CODES,
    getSectionByCode,
    getRequiredSections,
    getOptionalSections,
    createSectionCodeableConcept
  };
}