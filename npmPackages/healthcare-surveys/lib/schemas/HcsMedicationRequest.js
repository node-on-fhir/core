// packages/healthcare-surveys/lib/schemas/HcsMedicationRequest.js

import SimpleSchema from 'simpl-schema';
// Note: The following packages don't exist and have been commented out
// import { MedicationRequestSchema } from 'meteor/clinical:hl7-fhir-resources';

// Extend the base MedicationRequest schema
// Since MedicationRequestSchema is not available, defining the schema without extending
const HcsMedicationRequestSchema = globalThis.HcsMedicationRequestSchema = new SimpleSchema([
  // MedicationRequestSchema, // Base schema not available
  {
    // Required elements per the profile
    'status': {
      type: String,
      allowedValues: ['active', 'on-hold', 'cancelled', 'completed', 'entered-in-error', 'stopped', 'draft', 'unknown'],
      optional: false
    },
    'medicationCodeableConcept': {
      type: Object,
      optional: true // One of medication[x] must be present
    },
    'medicationReference': {
      type: Object,
      optional: true // One of medication[x] must be present
    },
    'subject': {
      type: Object,
      optional: false
    },
    'subject.reference': {
      type: String,
      optional: false
    },
    'authoredOn': {
      type: Date,
      optional: false
    },
    
    // Optional Must Support elements
    'encounter': {
      type: Object,
      optional: true
    },
    'encounter.reference': {
      type: String,
      optional: true
    },
    'dosageInstruction': {
      type: Array,
      optional: true,
      maxCount: 1  // Profile specifies 0..1
    },
    'dosageInstruction.$': {
      type: Object
    }
  }
]);

// Add custom validation for medication[x]
HcsMedicationRequestSchema.addValidator(function() {
  const hasMedicationCode = !!this.value.medicationCodeableConcept;
  const hasMedicationRef = !!this.value.medicationReference;
  
  if (!hasMedicationCode && !hasMedicationRef) {
    return 'Either medicationCodeableConcept or medicationReference must be provided';
  }
});

// Add validation for US Core references
HcsMedicationRequestSchema.addValidator(function() {
  // Validate subject reference
  if (this.value.subject?.reference) {
    const subjectRef = this.value.subject.reference;
    if (!subjectRef.includes('Patient/')) {
      return 'Subject must reference a US Core Patient';
    }
  }
  
  // Validate encounter reference
  if (this.value.encounter?.reference) {
    const encounterRef = this.value.encounter.reference;
    if (!encounterRef.includes('Encounter/')) {
      return 'Encounter must reference a US Core Encounter';
    }
  }
});

// Create collection
const HcsMedicationRequest = globalThis.HcsMedicationRequest = new Mongo.Collection('HcsMedicationRequest');
HcsMedicationRequest.attachSchema(HcsMedicationRequestSchema);

// Export
export { HcsMedicationRequest, HcsMedicationRequestSchema };