// packages/healthcare-surveys/lib/schemas/HcsMedicationStatement.js

import SimpleSchema from 'simpl-schema';
// Note: The following packages don't exist and have been commented out
// import { BaseSchema } from 'meteor/clinical:hl7-resource-datatypes';
// import { MedicationStatementSchema } from 'meteor/clinical:hl7-fhir-resources';

// Note: Based on the IG analysis, there's no specific HcsMedicationStatement profile defined
// This is a placeholder that extends the base MedicationStatement schema
// It can be customized if specific requirements are identified

// Since MedicationStatementSchema is not available, defining the schema without extending
const HcsMedicationStatementSchema = globalThis.HcsMedicationStatementSchema = new SimpleSchema([
  // MedicationStatementSchema, // Base schema not available
  {
    // Add any HCS-specific constraints here
    'subject': {
      type: Object,
      optional: false
    },
    'subject.reference': {
      type: String,
      optional: false
    },
    'medicationCodeableConcept': {
      type: Object,
      optional: true // One of medication[x] must be present
    },
    'medicationReference': {
      type: Object,
      optional: true // One of medication[x] must be present
    }
  }
]);

// Add validation for US Core references
HcsMedicationStatementSchema.addValidator(function() {
  // Validate subject reference
  if (this.value.subject?.reference) {
    const subjectRef = this.value.subject.reference;
    if (!subjectRef.includes('Patient/')) {
      return 'Subject must reference a US Core Patient';
    }
  }
});

// Create collection
const HcsMedicationStatement = globalThis.HcsMedicationStatement = new Mongo.Collection('HcsMedicationStatement');
HcsMedicationStatement.attachSchema(HcsMedicationStatementSchema);

// Export
export { HcsMedicationStatement, HcsMedicationStatementSchema };