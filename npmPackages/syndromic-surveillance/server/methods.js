// npmPackages/syndromic-surveillance/server/methods.js
//
// rpc-migration (feat/json-rpc): Meteor.methods -> Meteor.ServerMethods.define
// (npmPackages exemplar — GLOBAL registry, no import). Names were already
// dotted/canonical. ONC 170.315(f)(2) syndromic surveillance CASE DATA →
// phi:true throughout (per batch instructions). requireAuth default (true)
// replaces the `if (!this.userId)` guards. this.userId -> context.userId.
// generateMeasureReport's single object arg is named `reportParams` to avoid
// shadowing the ServerMethods `params`/`context`; positionalParams maps the
// legacy single positional object to it.

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';

// Generate syndromic surveillance measure report
Meteor.ServerMethods.define('surveillance.generateMeasureReport', {
  description: 'Generate a syndromic-surveillance FHIR MeasureReport for a facility/period',
  phi: true,
  positionalParams: ['reportParams'],
  schemaObject: {
    type: 'object',
    properties: {
      reportParams: {
        type: 'object',
        properties: {
          facilityId: { type: 'string' },
          reportingPeriod: { type: 'object' },
          measureType: { type: 'string' }
        },
        required: ['facilityId', 'reportingPeriod', 'measureType']
      }
    },
    required: ['reportParams']
  }
}, async function(params, context) {
    const reportParams = get(params, 'reportParams');
    check(reportParams, {
      facilityId: String,
      reportingPeriod: Object,
      measureType: String
    });

    // In production, this would generate FHIR MeasureReport resources
    // based on CDC/NHSN reporting requirements
    const measureReport = {
      resourceType: 'MeasureReport',
      id: `surveillance-${Date.now()}`,
      status: 'complete',
      type: 'summary',
      measure: `Measure/${reportParams.measureType}`,
      subject: {
        reference: `Organization/${reportParams.facilityId}`
      },
      date: new Date().toISOString(),
      reporter: {
        reference: `Organization/${reportParams.facilityId}`
      },
      period: reportParams.reportingPeriod,
      group: []
    };

    return measureReport;
});

// Submit surveillance data to public health agencies
Meteor.ServerMethods.define('surveillance.submitToPublicHealth', {
  description: 'Transmit a surveillance MeasureReport to a public health agency endpoint',
  phi: true,
  positionalParams: ['measureReportId', 'agencyEndpoint'],
  schemaObject: {
    type: 'object',
    properties: { measureReportId: { type: 'string' }, agencyEndpoint: { type: 'string' } },
    required: ['measureReportId', 'agencyEndpoint']
  }
}, async function(params, context) {
    const measureReportId = get(params, 'measureReportId');
    const agencyEndpoint = get(params, 'agencyEndpoint');
    check(measureReportId, String);
    check(agencyEndpoint, String);

    // In production, this would transmit data via FHIR REST API
    // or HL7 v2 messaging to public health agencies
    console.log(`Submitting surveillance report ${measureReportId} to ${agencyEndpoint}`);

    return {
      status: 'submitted',
      timestamp: new Date(),
      endpoint: agencyEndpoint,
      reportId: measureReportId
    };
});

// Validate syndromic surveillance data
Meteor.ServerMethods.define('surveillance.validateData', {
  description: 'Validate syndromic-surveillance data against CDC/NHSN requirements',
  phi: true,
  positionalParams: ['surveillanceData'],
  schemaObject: { type: 'object', properties: { surveillanceData: { type: 'object' } }, required: ['surveillanceData'] }
}, async function(params, context) {
    const surveillanceData = get(params, 'surveillanceData');
    check(surveillanceData, Object);

    // Validate against CDC/NHSN requirements
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check required fields
    if (!surveillanceData.facilityId) {
      validation.errors.push('Facility ID is required');
      validation.isValid = false;
    }

    if (!surveillanceData.reportingPeriod) {
      validation.errors.push('Reporting period is required');
      validation.isValid = false;
    }

    return validation;
});

// Convert surveillance data to CSV format
Meteor.ServerMethods.define('surveillance.exportToCSV', {
  description: 'Export a surveillance report as CSV for public health agency submission',
  phi: true,
  positionalParams: ['measureReportId'],
  schemaObject: { type: 'object', properties: { measureReportId: { type: 'string' } }, required: ['measureReportId'] }
}, async function(params, context) {
    const measureReportId = get(params, 'measureReportId');
    check(measureReportId, String);

    // Generate CSV export for public health agency submission
    const csvData = [
      ['Facility_ID', 'Report_Date', 'Measure_Type', 'Count', 'Notes'],
      ['FAC001', '2024-10-04', 'COVID_Patients', '15', 'Active cases'],
      ['FAC001', '2024-10-04', 'ICU_Capacity', '8', 'Available beds']
    ];

    return {
      filename: `surveillance_report_${measureReportId}.csv`,
      data: csvData,
      mimeType: 'text/csv'
    };
});
