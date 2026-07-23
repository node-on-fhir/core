// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/antimicrobial-reporting/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get, set } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('methods') : console);

// rpc-migration: Meteor.methods -> Meteor.ServerMethods.define (npmPackages
// exemplar — GLOBAL Meteor.ServerMethods). Names already dotted-canonical
// (antimicrobialReporting.*), no renames/aliases. Four methods had `this.userId`
// guards -> requireAuth (default true). validateMicroorganism was guard-less and
// only checks codes against SNOMED lookup tables (no patient data) ->
// requireAuth: false, phi: false. phi: true where an encounter/patient
// identifier flows (generateReport, generateResistanceAlert); the
// submit/status/validate methods carry no patient record.

// Antimicrobial Use and Resistance Surveillance Reporting
Meteor.ServerMethods.define('antimicrobialReporting.generateReport', {
  description: 'Generate a FHIR Bundle antimicrobial use/resistance surveillance report for an encounter',
  phi: true,
  positionalParams: ['encounterId', 'reportType'],
  schemaObject: {
    type: 'object',
    properties: { encounterId: { type: 'string' }, reportType: { type: 'string' } },
    required: ['encounterId', 'reportType']
  }
}, async function(params, context){
    const encounterId = params.encounterId;
    const reportType = params.reportType;
    context.log.info('Generating antimicrobial surveillance report', { encounterId, reportType });

    try {
      // Create FHIR Bundle for antimicrobial surveillance reporting
      const antimicrobialReport = {
        resourceType: 'Bundle',
        id: `antimicrobial-report-${encounterId}-${Date.now()}`,
        meta: {
          profile: ['http://hl7.org/fhir/us/ecr/StructureDefinition/eicr-document-bundle'],
          lastUpdated: new Date().toISOString(),
          source: 'Honeycomb Antimicrobial Surveillance System'
        },
        type: 'message',
        timestamp: new Date().toISOString(),
        entry: []
      };
      
      // Add MessageHeader for antimicrobial surveillance transmission
      const messageHeader = {
        fullUrl: `urn:uuid:messageheader-${Date.now()}`,
        resource: {
          resourceType: 'MessageHeader',
          id: `antimicrobial-header-${Date.now()}`,
          meta: {
            profile: ['http://hl7.org/fhir/us/ecr/StructureDefinition/eicr-messageheader']
          },
          eventCoding: {
            system: 'http://terminology.hl7.org/CodeSystem/v2-0003',
            code: 'ORU^R01^ORU_R01',
            display: 'Unsolicited Observation Message'
          },
          destination: [{
            name: reportType === 'nhsn' ? 'CDC National Healthcare Safety Network' :
                  reportType === 'state-health' ? 'State Health Department' :
                  reportType === 'infection-control' ? 'Infection Control Program' : 'Unknown Destination',
            endpoint: get(Meteor.settings, `private.antimicrobialReporting.${reportType}.endpoint`, 'https://nhsn.cdc.gov/fhir')
          }],
          sender: {
            reference: 'Organization/reporting-facility'
          },
          source: {
            name: 'Honeycomb Antimicrobial Surveillance System',
            software: 'Honeycomb FHIR Server',
            version: '3.0.0',
            endpoint: get(Meteor.settings, 'public.interfaces.fhir.channel.endpoint', 'https://localhost:3000/baseR4')
          },
          focus: [{
            reference: `Encounter/${encounterId}`
          }]
        }
      };
      
      antimicrobialReport.entry.push(messageHeader);
      
      console.log('Antimicrobial surveillance report generated successfully');
      return {
        success: true,
        reportId: antimicrobialReport.id,
        bundle: antimicrobialReport,
        transmissionStatus: 'ready',
        reportType: reportType
      };
      
    } catch (error) {
      console.error('Error generating antimicrobial report:', error);
      throw new Meteor.Error('generation-failed', 'Failed to generate antimicrobial surveillance report', error.message);
    }
});

Meteor.ServerMethods.define('antimicrobialReporting.submitToAgency', {
  description: 'Transmit a generated antimicrobial surveillance report to a surveillance agency',
  positionalParams: ['reportId', 'agencyCode'],
  schemaObject: {
    type: 'object',
    properties: { reportId: { type: 'string' }, agencyCode: { type: 'string' } },
    required: ['reportId', 'agencyCode']
  }
}, async function(params, context){
    const reportId = params.reportId;
    const agencyCode = params.agencyCode;
    context.log.info('Submitting antimicrobial report to agency', { reportId, agencyCode });

    try {
      // Simulate transmission to surveillance agency
      const transmissionResult = {
        reportId: reportId,
        agencyCode: agencyCode,
        submittedAt: new Date().toISOString(),
        status: 'transmitted',
        acknowledgmentId: `AMR-ACK-${Date.now()}`,
        endpoint: get(Meteor.settings, `private.antimicrobialReporting.${agencyCode}.endpoint`),
        messageType: 'ORU^R01',
        responseCode: '200',
        responseMessage: 'Successfully received antimicrobial surveillance report'
      };
      
      console.log('Antimicrobial report submitted successfully to agency:', agencyCode);
      return transmissionResult;
      
    } catch (error) {
      console.error('Error submitting antimicrobial report:', error);
      throw new Meteor.Error('submission-failed', 'Failed to submit to surveillance agency', error.message);
    }
});

Meteor.ServerMethods.define('antimicrobialReporting.validateMicroorganism', {
  description: 'Validate a microorganism code and susceptibility test method against reference tables',
  // Guard-less pre-migration; a pure SNOMED/test-method code lookup with no
  // patient data — genuinely public.
  requireAuth: false,
  phi: false,
  positionalParams: ['organismCode', 'testMethod'],
  schemaObject: {
    type: 'object',
    properties: { organismCode: { type: 'string' }, testMethod: { type: 'string' } },
    required: ['organismCode', 'testMethod']
  }
}, async function(params, context){
    const organismCode = params.organismCode;
    const testMethod = params.testMethod;
    context.log.info('Validating microorganism and test method', { organismCode, testMethod });

    try {
      // Microorganism validation against SNOMED CT
      const validMicroorganisms = {
        // Common resistant organisms
        '115329001': 'Methicillin resistant Staphylococcus aureus',
        '113727004': 'Vancomycin resistant Enterococcus',
        '445654009': 'Carbapenem-resistant Enterobacteriaceae',
        '398584003': 'Clostridium difficile',
        '40886007': 'Acinetobacter baumannii',
        '83619000': 'Pseudomonas aeruginosa',
        '56415008': 'Klebsiella pneumoniae',
        '112283007': 'Escherichia coli',
        '54253008': 'Staphylococcus epidermidis',
        '90339007': 'Enterococcus faecalis'
      };
      
      // Test methods
      const validTestMethods = {
        'disk-diffusion': 'Kirby-Bauer disk diffusion',
        'broth-microdilution': 'Broth microdilution',
        'gradient-test': 'Gradient diffusion (E-test)',
        'automated-system': 'Automated antimicrobial susceptibility testing system',
        'molecular': 'Molecular resistance detection'
      };
      
      const isValidOrganism = validMicroorganisms.hasOwnProperty(organismCode);
      const isValidTestMethod = validTestMethods.hasOwnProperty(testMethod);
      
      return {
        isValidOrganism: isValidOrganism,
        isValidTestMethod: isValidTestMethod,
        organismCode: organismCode,
        organismName: validMicroorganisms[organismCode] || 'Unknown organism',
        testMethod: testMethod,
        testMethodName: validTestMethods[testMethod] || 'Unknown test method',
        validatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error validating microorganism:', error);
      throw new Meteor.Error('validation-failed', 'Failed to validate microorganism', error.message);
    }
});

Meteor.ServerMethods.define('antimicrobialReporting.getSurveillanceStatus', {
  description: 'Report antimicrobial surveillance status/aggregates for a facility over a date range',
  positionalParams: ['facilityId', 'dateRange'],
  schemaObject: {
    type: 'object',
    properties: { facilityId: { type: 'string' }, dateRange: { type: 'object' } },
    required: ['facilityId', 'dateRange']
  }
}, async function(params, context){
    const facilityId = params.facilityId;
    const dateRange = params.dateRange;
    context.log.info('Getting antimicrobial surveillance status', { facilityId, dateRange });

    try {
      // Simulate surveillance status data
      const surveillanceStatus = {
        facilityId: facilityId,
        dateRange: dateRange,
        totalCultures: 324,
        resistantOrganisms: 45,
        transmittedReports: 42,
        pendingReports: 3,
        lastTransmission: new Date(Date.now() - 2700000).toISOString(),
        complianceRate: 93.3,
        agencies: {
          'nhsn': {
            name: 'CDC National Healthcare Safety Network',
            transmitted: 35,
            pending: 2,
            lastSubmission: new Date(Date.now() - 2700000).toISOString()
          },
          'state-health': {
            name: 'State Health Department',
            transmitted: 7,
            pending: 1,
            lastSubmission: new Date(Date.now() - 5400000).toISOString()
          }
        },
        resistanceProfile: {
          'MRSA': 12,
          'VRE': 8,
          'CRE': 6,
          'ESBL': 11,
          'C. diff': 8
        },
        antimicrobialClasses: {
          'Beta-lactams': 78,
          'Glycopeptides': 45,
          'Fluoroquinolones': 52,
          'Aminoglycosides': 34,
          'Carbapenems': 23
        }
      };
      
      return surveillanceStatus;
      
    } catch (error) {
      console.error('Error getting surveillance status:', error);
      throw new Meteor.Error('status-failed', 'Failed to get surveillance status', error.message);
    }
});

Meteor.ServerMethods.define('antimicrobialReporting.generateResistanceAlert', {
  description: 'Generate an antimicrobial resistance alert for a patient/organism resistance pattern',
  phi: true,
  positionalParams: ['patientId', 'organismCode', 'resistancePattern'],
  schemaObject: {
    type: 'object',
    properties: {
      patientId: { type: 'string' },
      organismCode: { type: 'string' },
      resistancePattern: { type: 'array' }
    },
    required: ['patientId', 'organismCode', 'resistancePattern']
  }
}, async function(params, context){
    const patientId = params.patientId;
    const organismCode = params.organismCode;
    const resistancePattern = params.resistancePattern;
    context.log.debug('Generating antimicrobial resistance alert', { patientId, organismCode, resistancePattern });

    try {
      // Create resistance alert
      const resistanceAlert = {
        alertId: `AMR-ALERT-${Date.now()}`,
        patientId: patientId,
        organismCode: organismCode,
        resistancePattern: resistancePattern,
        alertLevel: resistancePattern.length > 3 ? 'critical' : 
                   resistancePattern.length > 1 ? 'high' : 'moderate',
        detectedAt: new Date().toISOString(),
        infectionControlNotified: true,
        isolationPrecautions: resistancePattern.includes('carbapenem') ? 'contact-plus' : 'contact',
        reportingRequired: true,
        followUpRequired: true
      };
      
      console.log('Antimicrobial resistance alert generated:', resistanceAlert.alertLevel);
      return resistanceAlert;
      
    } catch (error) {
      console.error('Error generating resistance alert:', error);
      throw new Meteor.Error('alert-failed', 'Failed to generate resistance alert', error.message);
    }
});