// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/lab-test-reporting/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get, set } from 'lodash';

// ONC 170.315(f)(3) - Transmission to Public Health Agencies - Reportable Laboratory Tests and Values/Results
Meteor.methods({
  'labTestReporting.generateReport': async function(observationId, targetAgency) {
    console.log('Generating lab test report for transmission to public health agency', { observationId, targetAgency });
    
    check(observationId, String);
    check(targetAgency, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be authenticated');
    }
    
    try {
      // Create FHIR Bundle for lab test reporting
      const labReport = {
        resourceType: 'Bundle',
        id: `lab-report-${observationId}-${Date.now()}`,
        meta: {
          profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-diagnosticreport-lab'],
          lastUpdated: new Date().toISOString(),
          source: 'Honeycomb FHIR Server'
        },
        type: 'message',
        timestamp: new Date().toISOString(),
        entry: []
      };
      
      // Add MessageHeader for public health transmission
      const messageHeader = {
        fullUrl: `urn:uuid:messageheader-${Date.now()}`,
        resource: {
          resourceType: 'MessageHeader',
          id: `lab-report-header-${Date.now()}`,
          meta: {
            profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-messageheader']
          },
          eventCoding: {
            system: 'http://terminology.hl7.org/CodeSystem/v2-0003',
            code: 'ORU^R01^ORU_R01',
            display: 'Unsolicited Observation Message'
          },
          destination: [{
            name: targetAgency,
            endpoint: get(Meteor.settings, `private.publicHealthAgencies.${targetAgency}.endpoint`, 'https://example.gov/fhir')
          }],
          sender: {
            reference: 'Organization/reporting-facility'
          },
          source: {
            name: 'Honeycomb Lab Reporting System',
            software: 'Honeycomb FHIR Server',
            version: '3.0.0',
            endpoint: get(Meteor.settings, 'public.interfaces.fhir.channel.endpoint', 'https://localhost:3000/baseR4')
          },
          focus: [{
            reference: `DiagnosticReport/lab-report-${observationId}`
          }]
        }
      };
      
      labReport.entry.push(messageHeader);
      
      console.log('Lab test report generated successfully');
      return {
        success: true,
        reportId: labReport.id,
        bundle: labReport,
        transmissionStatus: 'ready',
        targetAgency: targetAgency
      };
      
    } catch (error) {
      console.error('Error generating lab test report:', error);
      throw new Meteor.Error('generation-failed', 'Failed to generate lab test report', error.message);
    }
  },
  
  'labTestReporting.submitToAgency': async function(reportId, agencyCode) {
    console.log('Submitting lab test report to public health agency', { reportId, agencyCode });
    
    check(reportId, String);
    check(agencyCode, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be authenticated');
    }
    
    try {
      // Simulate transmission to public health agency
      const transmissionResult = {
        reportId: reportId,
        agencyCode: agencyCode,
        submittedAt: new Date().toISOString(),
        status: 'transmitted',
        acknowledgmentId: `ACK-${Date.now()}`,
        endpoint: get(Meteor.settings, `private.publicHealthAgencies.${agencyCode}.endpoint`),
        messageType: 'ORU^R01',
        responseCode: '200',
        responseMessage: 'Successfully received laboratory test report'
      };
      
      console.log('Lab test report submitted successfully to agency:', agencyCode);
      return transmissionResult;
      
    } catch (error) {
      console.error('Error submitting lab test report:', error);
      throw new Meteor.Error('submission-failed', 'Failed to submit to public health agency', error.message);
    }
  },
  
  'labTestReporting.validateReportableTest': async function(observationCode, jurisdiction) {
    console.log('Validating if lab test is reportable', { observationCode, jurisdiction });
    
    check(observationCode, String);
    check(jurisdiction, String);
    
    try {
      // Check against reportable conditions list
      const reportableTests = [
        // COVID-19 tests
        '94500-6', // SARS-CoV-2 RNA [Presence] in Respiratory specimen by NAA with probe detection
        '94558-4', // SARS-CoV-2 Ag [Presence] in Respiratory specimen by Rapid immunoassay
        '94746-5', // SARS-CoV-2 RNA [Cycle Threshold #] in Respiratory specimen by NAA with probe detection
        
        // Other reportable tests
        '33747-0', // Hepatitis A virus antibody [Presence] in Serum by Immunoassay
        '32018-4', // Hepatitis B virus surface antigen [Presence] in Serum by Immunoassay
        '16128-1', // HIV 1 RNA [Units/volume] in Plasma by NAA with probe detection
        '87903-2', // Chlamydia trachomatis DNA [Presence] in Urine by NAA with probe detection
        '87591-5', // Neisseria gonorrhoeae DNA [Presence] in Urine by NAA with probe detection
        '6349-5',  // Chlamydia trachomatis [Presence] in Specimen by Organism specific culture
        '697-3'    // Neisseria gonorrhoeae [Presence] in Specimen by Organism specific culture
      ];
      
      const isReportable = reportableTests.includes(observationCode);
      
      return {
        isReportable: isReportable,
        observationCode: observationCode,
        jurisdiction: jurisdiction,
        reportingRequired: isReportable,
        reportingTimeframe: isReportable ? '24 hours' : 'N/A',
        validatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error validating reportable test:', error);
      throw new Meteor.Error('validation-failed', 'Failed to validate reportable test', error.message);
    }
  },
  
  'labTestReporting.getReportingStatus': async function(patientId, dateRange) {
    console.log('Getting lab test reporting status', { patientId, dateRange });
    
    check(patientId, String);
    check(dateRange, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be authenticated');
    }
    
    try {
      // Simulate reporting status data
      const reportingStatus = {
        patientId: patientId,
        dateRange: dateRange,
        totalTests: 42,
        reportableTests: 8,
        transmittedTests: 7,
        pendingTests: 1,
        lastTransmission: new Date(Date.now() - 3600000).toISOString(),
        complianceRate: 87.5,
        agencies: {
          'state-doh': {
            name: 'State Department of Health',
            transmitted: 5,
            pending: 1,
            lastSubmission: new Date(Date.now() - 3600000).toISOString()
          },
          'cdc': {
            name: 'Centers for Disease Control',
            transmitted: 2,
            pending: 0,
            lastSubmission: new Date(Date.now() - 7200000).toISOString()
          }
        }
      };
      
      return reportingStatus;
      
    } catch (error) {
      console.error('Error getting reporting status:', error);
      throw new Meteor.Error('status-failed', 'Failed to get reporting status', error.message);
    }
  }
});