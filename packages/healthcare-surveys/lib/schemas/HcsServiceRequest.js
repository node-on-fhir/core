// packages/healthcare-surveys/lib/schemas/HcsServiceRequest.js

import SimpleSchema from 'simpl-schema';
import { BaseSchema } from 'meteor/clinical:hl7-resource-datatypes';
import { ServiceRequestSchema } from 'meteor/clinical:hl7-fhir-resources';

// Note: Based on the IG analysis, there's no specific HcsServiceRequest profile defined
// This is a placeholder that extends the base ServiceRequest schema
// It can be customized if specific requirements are identified

HcsServiceRequestSchema = new SimpleSchema([
  ServiceRequestSchema,
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
    'encounter': {
      type: Object,
      optional: true
    },
    'encounter.reference': {
      type: String,
      optional: true
    }
  }
]);

// Add validation for US Core references
HcsServiceRequestSchema.addValidator(function() {
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
HcsServiceRequest = new Mongo.Collection('HcsServiceRequest');
HcsServiceRequest.attachSchema(HcsServiceRequestSchema);

// Export
if (typeof exports === 'object') {
  module.exports = { HcsServiceRequest, HcsServiceRequestSchema };
}