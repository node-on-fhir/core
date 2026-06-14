// packages/case-reporting/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';

Meteor.methods({
  'caseReporting.generateEcr': async function(encounterId) {
    check(encounterId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to generate eCR');
    }
    
    try {
      // Simulate eCR generation
      console.log('Generating eCR for encounter:', encounterId);
      
      // This would implement actual eCR creation logic
      // using FHIR Composition resource with eCR profile
      const ecrDocument = {
        resourceType: 'Composition',
        id: `ecr-${encounterId}-${Date.now()}`,
        meta: {
          profile: ['http://hl7.org/fhir/us/ecr/StructureDefinition/eicr-composition']
        },
        status: 'final',
        type: {
          coding: [{
            system: 'http://loinc.org',
            code: '55751-2',
            display: 'Public health Case report'
          }]
        },
        subject: {
          reference: `Patient/${encounterId.split('-')[0]}`
        },
        encounter: {
          reference: `Encounter/${encounterId}`
        },
        date: new Date().toISOString(),
        title: 'Electronic Initial Case Report'
      };
      
      return {
        success: true,
        ecrId: ecrDocument.id,
        status: 'generated',
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('eCR generation error:', error);
      throw new Meteor.Error('ecr-generation-failed', error.message);
    }
  },
  
  'caseReporting.submitToPublicHealth': async function(ecrId, jurisdictionCode) {
    check(ecrId, String);
    check(jurisdictionCode, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to submit eCR');
    }
    
    try {
      // Simulate submission to public health authority
      console.log('Submitting eCR to jurisdiction:', jurisdictionCode);
      
      // This would implement actual FHIR $process-message operation
      // to transmit eCR Bundle to public health endpoint
      
      return {
        success: true,
        submissionId: `SUB-${Date.now()}`,
        jurisdiction: jurisdictionCode,
        status: 'transmitted',
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('eCR submission error:', error);
      throw new Meteor.Error('ecr-submission-failed', error.message);
    }
  },
  
  'caseReporting.processRrReceived': async function(rrBundle) {
    check(rrBundle, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to process RR');
    }
    
    try {
      // Process received Reportability Response (RR)
      console.log('Processing Reportability Response');
      
      // This would parse RR Bundle and update case status
      const rrData = {
        id: get(rrBundle, 'id'),
        determination: get(rrBundle, 'entry[0].resource.extension[0].valueString', 'Not Reportable'),
        rules: get(rrBundle, 'entry[0].resource.extension[1].valueString', ''),
        timestamp: new Date()
      };
      
      return {
        success: true,
        rrId: rrData.id,
        determination: rrData.determination,
        timestamp: rrData.timestamp
      };
      
    } catch (error) {
      console.error('RR processing error:', error);
      throw new Meteor.Error('rr-processing-failed', error.message);
    }
  }
});