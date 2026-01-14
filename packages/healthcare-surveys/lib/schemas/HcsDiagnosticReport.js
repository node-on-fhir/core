// packages/healthcare-surveys/lib/schemas/HcsDiagnosticReport.js

import SimpleSchema from 'simpl-schema';
// Note: The following packages don't exist and have been commented out
// import { BaseSchema } from 'meteor/clinical:hl7-resource-datatypes';
// import { DiagnosticReportSchema } from 'meteor/clinical:hl7-fhir-resources';

// Extend the base DiagnosticReport schema
// Since DiagnosticReportSchema is not available, defining the schema without extending
HcsDiagnosticReportSchema = new SimpleSchema([
  // DiagnosticReportSchema, // Base schema not available
  {
    // Required elements per the profile
    'status': {
      type: String,
      allowedValues: ['registered', 'partial', 'preliminary', 'final', 'amended', 'corrected', 'appended', 'cancelled', 'entered-in-error', 'unknown'],
      optional: false
    },
    'code': {
      type: Object,
      optional: false
    },
    'subject': {
      type: Object,
      optional: false
    },
    'subject.reference': {
      type: String,
      optional: false
    },
    
    // Must Support elements
    'category': {
      type: Array,
      optional: true
    },
    'category.$': {
      type: Object
    },
    'encounter': {
      type: Object,
      optional: true
    },
    'encounter.reference': {
      type: String,
      optional: true
    },
    'effectiveDateTime': {
      type: Date,
      optional: true // One of effective[x]
    },
    'effectivePeriod': {
      type: Object,
      optional: true // One of effective[x]
    },
    'issued': {
      type: Date,
      optional: true
    },
    'performer': {
      type: Array,
      optional: true
    },
    'performer.$': {
      type: Object
    },
    'performer.$.reference': {
      type: String
    },
    'result': {
      type: Array,
      optional: true
    },
    'result.$': {
      type: Object
    },
    'result.$.reference': {
      type: String
    },
    'presentedForm': {
      type: Array,
      optional: true
    },
    'presentedForm.$': {
      type: Object
    }
  }
]);

// Add validation for US Core references
HcsDiagnosticReportSchema.addValidator(function() {
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
HcsDiagnosticReport = new Mongo.Collection('HcsDiagnosticReport');
HcsDiagnosticReport.attachSchema(HcsDiagnosticReportSchema);

// Export
if (typeof exports === 'object') {
  module.exports = { HcsDiagnosticReport, HcsDiagnosticReportSchema };
}