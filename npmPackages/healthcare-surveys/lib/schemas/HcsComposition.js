// packages/healthcare-surveys/lib/schemas/HcsComposition.js

import SimpleSchema from 'simpl-schema';
// Note: The following packages don't exist and have been commented out
// import { CompositionSchema } from 'meteor/clinical:hl7-fhir-resources';

// Extend the base Composition schema
// Since CompositionSchema is not available, defining the schema without extending
const HcsCompositionSchema = globalThis.HcsCompositionSchema = new SimpleSchema([
  // CompositionSchema, // Base schema not available
  {
    // Fixed values per the profile
    'status': {
      type: String,
      allowedValues: ['final'],
      defaultValue: 'final'
    },
    'type.coding': {
      type: Array,
      minCount: 1
    },
    'type.coding.$': {
      type: Object
    },
    'type.coding.$.system': {
      type: String,
      defaultValue: "http://loinc.org"
    },
    'type.coding.$.code': {
      type: String,
      defaultValue: "75619-7"
    },
    'type.coding.$.display': {
      type: String,
      defaultValue: "Health Care Survey Report",
      optional: true
    },
    'title': {
      type: String,
      defaultValue: "National Health Care Surveys report"
    },
    
    // Required elements
    'identifier': {
      type: Array,
      minCount: 1
    },
    'subject': {
      type: Object // Reference to US Core Patient
    },
    'encounter': {
      type: Object // Reference to US Core Encounter
    },
    
    // Sections
    'section': {
      type: Array,
      optional: true
    },
    'section.$': {
      type: Object
    },
    'section.$.title': {
      type: String,
      optional: true
    },
    'section.$.code': {
      type: Object
    },
    'section.$.code.coding': {
      type: Array,
      minCount: 1
    },
    'section.$.code.coding.$': {
      type: Object
    },
    'section.$.code.coding.$.system': {
      type: String,
      defaultValue: "http://loinc.org"
    },
    'section.$.code.coding.$.code': {
      type: String
    },
    'section.$.code.coding.$.display': {
      type: String,
      optional: true
    },
    'section.$.text': {
      type: Object
    },
    'section.$.entry': {
      type: Array,
      optional: true
    },
    'section.$.entry.$': {
      type: Object
    }
  }
]);

// Section codes constants
const HCS_COMPOSITION_SECTIONS = {
  REASON_FOR_VISIT: { code: "29299-5", display: "Reason for visit" },
  PROBLEM: { code: "11450-4", display: "Problem List" },
  ALLERGIES: { code: "48765-2", display: "Allergies and Intolerances" },
  ASSESSMENT_PLAN: { code: "51847-2", display: "Assessment and Plan of Treatment" },
  PLAN_OF_TREATMENT: { code: "18776-5", display: "Plan of Treatment" },
  CARE_TEAM: { code: "85847-2", display: "Care Team" },
  COVERAGE: { code: "48768-6", display: "Coverage" },
  GOALS: { code: "61146-7", display: "Goals" },
  IMMUNIZATIONS: { code: "11369-6", display: "Immunizations" },
  MEDICAL_EQUIPMENT: { code: "46264-8", display: "Medical Equipment" },
  MEDICATIONS: { code: "10160-0", display: "History of Medication use" },
  PREGNANCY: { code: "90767-5", display: "Pregnancy summary" },
  PROCEDURES: { code: "47519-4", display: "History of Procedures" },
  RESULTS: { code: "30954-2", display: "Results" },
  SOCIAL_HISTORY: { code: "29762-2", display: "Social History" },
  NOTES: { code: "28650-0", display: "Notes" },
  VITAL_SIGNS: { code: "8716-3", display: "Vital Signs" }
};

// Validation helper to ensure required sections
HcsCompositionSchema.addValidator(function() {
  const sections = this.value.section || [];
  const sectionCodes = sections.map(s => s.code?.coding?.[0]?.code);
  
  // Check for required sections
  const requiredSections = [
    HCS_COMPOSITION_SECTIONS.REASON_FOR_VISIT.code,
    HCS_COMPOSITION_SECTIONS.PROBLEM.code,
    HCS_COMPOSITION_SECTIONS.ALLERGIES.code
  ];
  
  for (const reqCode of requiredSections) {
    if (!sectionCodes.includes(reqCode)) {
      const sectionName = Object.values(HCS_COMPOSITION_SECTIONS)
        .find(s => s.code === reqCode)?.display || reqCode;
      return `Required section missing: ${sectionName}`;
    }
  }
});

// Create collection
const HcsComposition = globalThis.HcsComposition = new Mongo.Collection('HcsComposition');
HcsComposition.attachSchema(HcsCompositionSchema);

// Export
export { HcsComposition, HcsCompositionSchema, HCS_COMPOSITION_SECTIONS };