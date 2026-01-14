// packages/healthcare-surveys/lib/schemas/HcsMedicationAdministration.js

import SimpleSchema from 'simpl-schema';
// Note: The following packages don't exist and have been commented out
// import { BaseSchema } from 'meteor/clinical:hl7-resource-datatypes';
// import { MedicationAdministrationSchema } from 'meteor/clinical:hl7-fhir-resources';

// Extend the base MedicationAdministration schema
// Since MedicationAdministrationSchema is not available, defining the schema without extending
HcsMedicationAdministrationSchema = new SimpleSchema([
  // MedicationAdministrationSchema, // Base schema not available
  {
    // Required elements per the profile
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
    'effectiveDateTime': {
      type: Date,
      optional: true // One of effective[x] must be present
    },
    'effectivePeriod': {
      type: Object,
      optional: true // One of effective[x] must be present
    },
    
    // Optional Must Support elements
    'statusReason': {
      type: Object,
      optional: true
    },
    'context': {
      type: Object,
      optional: true
    },
    'context.reference': {
      type: String,
      optional: true
    },
    'performer': {
      type: Array,
      optional: true
    },
    'performer.$': {
      type: Object
    },
    'dosage': {
      type: Object,
      optional: true
    }
  }
]);

// Add custom validation for medication[x]
HcsMedicationAdministrationSchema.addValidator(function() {
  const hasMedicationCode = !!this.value.medicationCodeableConcept;
  const hasMedicationRef = !!this.value.medicationReference;
  
  if (!hasMedicationCode && !hasMedicationRef) {
    return 'Either medicationCodeableConcept or medicationReference must be provided';
  }
});

// Add custom validation for effective[x]
HcsMedicationAdministrationSchema.addValidator(function() {
  const hasEffectiveDateTime = !!this.value.effectiveDateTime;
  const hasEffectivePeriod = !!this.value.effectivePeriod;
  
  if (!hasEffectiveDateTime && !hasEffectivePeriod) {
    return 'Either effectiveDateTime or effectivePeriod must be provided';
  }
});

// Add validation for US Core references
HcsMedicationAdministrationSchema.addValidator(function() {
  // Validate subject reference
  if (this.value.subject?.reference) {
    const subjectRef = this.value.subject.reference;
    if (!subjectRef.includes('Patient/')) {
      return 'Subject must reference a US Core Patient';
    }
  }
  
  // Validate context reference
  if (this.value.context?.reference) {
    const contextRef = this.value.context.reference;
    if (!contextRef.includes('Encounter/')) {
      return 'Context must reference a US Core Encounter';
    }
  }
});

// Create collection
HcsMedicationAdministration = new Mongo.Collection('HcsMedicationAdministration');
HcsMedicationAdministration.attachSchema(HcsMedicationAdministrationSchema);

// Export
if (typeof exports === 'object') {
  module.exports = { HcsMedicationAdministration, HcsMedicationAdministrationSchema };
}