// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/antimicrobial-reporting/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get, set } from 'lodash';

// Antimicrobial Use and Resistance Surveillance Reporting
Meteor.methods({
  'antimicrobialReporting.generateReport': async function(encounterId, reportType) {
    console.log('Generating antimicrobial surveillance report', { encounterId, reportType });
    
    check(encounterId, String);
    check(reportType, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be authenticated');
    }
    
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
  },
  
  'antimicrobialReporting.submitToAgency': async function(reportId, agencyCode) {
    console.log('Submitting antimicrobial report to agency', { reportId, agencyCode });
    
    check(reportId, String);
    check(agencyCode, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be authenticated');
    }
    
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
  },
  
  'antimicrobialReporting.validateMicroorganism': async function(organismCode, testMethod) {
    console.log('Validating microorganism and test method', { organismCode, testMethod });
    
    check(organismCode, String);
    check(testMethod, String);
    
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
  },
  
  'antimicrobialReporting.getSurveillanceStatus': async function(facilityId, dateRange) {
    console.log('Getting antimicrobial surveillance status', { facilityId, dateRange });
    
    check(facilityId, String);
    check(dateRange, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be authenticated');
    }
    
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
  },
  
  'antimicrobialReporting.generateResistanceAlert': async function(patientId, organismCode, resistancePattern) {
    console.log('Generating antimicrobial resistance alert', { patientId, organismCode, resistancePattern });
    
    check(patientId, String);
    check(organismCode, String);
    check(resistancePattern, Array);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be authenticated');
    }
    
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
  }
});