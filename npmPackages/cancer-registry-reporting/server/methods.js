// packages/cancer-registry-reporting/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('methods') : console);

// rpc-migration (feat/json-rpc): Meteor.methods -> Meteor.ServerMethods.define
// (npmPackages exemplar — GLOBAL registry). Names were already dotted/canonical.
// Cancer registry case data → phi:true. requireAuth default (true) replaces the
// `if (!this.userId)` guards. positionalParams preserve legacy DDP arg order.
Meteor.ServerMethods.define('cancerRegistry.generateReport', {
  description: 'Generate a central cancer registry Composition report for an encounter',
  phi: true,
  positionalParams: ['encounterId', 'cancerType'],
  schemaObject: {
    type: 'object',
    properties: { encounterId: { type: 'string' }, cancerType: { type: 'string' } },
    required: ['encounterId', 'cancerType']
  }
}, async function(params, context) {
    const encounterId = get(params, 'encounterId');
    const cancerType = get(params, 'cancerType');
    check(encounterId, String);
    check(cancerType, String);

    try {
      console.log('Generating cancer registry report for encounter:', encounterId);
      
      // This would implement actual cancer registry report creation
      // using FHIR Composition resource with cancer reporting profile
      const cancerReport = {
        resourceType: 'Composition',
        id: `cancer-report-${encounterId}-${Date.now()}`,
        meta: {
          profile: ['http://hl7.org/fhir/us/central-cancer-registry-reporting/StructureDefinition/central-cancer-registry-reporting-composition']
        },
        status: 'final',
        type: {
          coding: [{
            system: 'http://loinc.org',
            code: '72134-0',
            display: 'Cancer event report'
          }]
        },
        subject: {
          reference: `Patient/${encounterId.split('-')[0]}`
        },
        encounter: {
          reference: `Encounter/${encounterId}`
        },
        date: new Date().toISOString(),
        title: 'Central Cancer Registry Report',
        extension: [{
          url: 'http://hl7.org/fhir/us/central-cancer-registry-reporting/StructureDefinition/cancer-type',
          valueCodeableConcept: {
            coding: [{
              system: 'http://snomed.info/sct',
              code: cancerType,
              display: 'Cancer diagnosis'
            }]
          }
        }]
      };
      
      return {
        success: true,
        reportId: cancerReport.id,
        status: 'generated',
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Cancer registry report generation error:', error);
      throw new Meteor.Error('cancer-report-generation-failed', error.message);
    }
});

Meteor.ServerMethods.define('cancerRegistry.submitToRegistry', {
  description: 'Transmit a cancer registry report to a central registry endpoint',
  phi: true,
  positionalParams: ['reportId', 'registryEndpoint'],
  schemaObject: {
    type: 'object',
    properties: { reportId: { type: 'string' }, registryEndpoint: { type: 'string' } },
    required: ['reportId', 'registryEndpoint']
  }
}, async function(params, context) {
    const reportId = get(params, 'reportId');
    const registryEndpoint = get(params, 'registryEndpoint');
    check(reportId, String);
    check(registryEndpoint, String);

    try {
      console.log('Submitting cancer report to registry:', registryEndpoint);
      
      // This would implement actual FHIR Bundle submission
      // to central cancer registry using secure transmission
      
      return {
        success: true,
        submissionId: `CCRR-${Date.now()}`,
        registry: registryEndpoint,
        status: 'transmitted',
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Cancer registry submission error:', error);
      throw new Meteor.Error('cancer-registry-submission-failed', error.message);
    }
});

Meteor.ServerMethods.define('cancerRegistry.validateCaseData', {
  description: 'Validate cancer case data against central registry requirements',
  phi: true,
  positionalParams: ['patientId', 'conditionData'],
  schemaObject: {
    type: 'object',
    properties: { patientId: { type: 'string' }, conditionData: { type: 'object' } },
    required: ['patientId', 'conditionData']
  }
}, async function(params, context) {
    const patientId = get(params, 'patientId');
    const conditionData = get(params, 'conditionData');
    check(patientId, String);
    check(conditionData, Object);

    try {
      // Validate cancer case data against registry requirements
      log.debug('Validating cancer case data for patient', { patientId });
      
      const validationResults = {
        isValid: true,
        requiredFields: ['primarySite', 'histology', 'dateDiagnosis', 'stage'],
        missingFields: [],
        warnings: [],
        score: 100
      };
      
      // Simulate validation logic
      if (!get(conditionData, 'primarySite')) {
        validationResults.missingFields.push('primarySite');
        validationResults.isValid = false;
      }
      
      if (!get(conditionData, 'histology')) {
        validationResults.missingFields.push('histology');
        validationResults.isValid = false;
      }
      
      validationResults.score = Math.max(0, 100 - (validationResults.missingFields.length * 25));
      
      return validationResults;
      
    } catch (error) {
      console.error('Cancer case validation error:', error);
      throw new Meteor.Error('cancer-validation-failed', error.message);
    }
});