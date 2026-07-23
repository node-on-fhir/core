// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/healthcare-surveys/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';

// -----------------------------------------------------------------------------
// ServerMethods registry (rpc-migration). Legacy names carry a hyphen
// (healthcare-surveys.*) which the dotted-canonical regex forbids, so each is
// renamed to camelCase (healthcareSurveys.*) with the hyphenated legacy name
// as an alias for existing DDP call sites. Auth guards deleted -> requireAuth
// defaults to true. phi:true — patient/encounter identifiers flow through.

Meteor.ServerMethods.define('healthcareSurveys.generateReport', {
  description: 'Generate a National Health Care Survey report bundle for an encounter',
  aliases: ['healthcare-surveys.generateReport'],
  phi: true,
  positionalParams: ['encounterData'],
  schemaObject: {
    type: 'object',
    properties: {
      encounterData: {
        type: 'object',
        properties: {
          encounterId: { type: 'string' },
          patientId: { type: 'string' },
          surveyType: { type: 'string' }
        },
        required: ['encounterId', 'patientId', 'surveyType']
      }
    },
    required: ['encounterData']
  }
}, async function(params, context) {
    const encounterData = params.encounterData;

    try {
      // Simulate survey report generation
      const reportBundle = {
        resourceType: 'Bundle',
        id: `hcs-report-${Date.now()}`,
        type: 'message',
        timestamp: new Date().toISOString(),
        entry: [
          {
            resource: {
              resourceType: 'MessageHeader',
              id: `msg-header-${Date.now()}`,
              source: {
                name: 'Honeycomb EHR',
                software: 'Honeycomb',
                version: '3.0'
              },
              focus: [{
                reference: `Encounter/${encounterData.encounterId}`
              }]
            }
          }
        ]
      };

      return {
        bundleId: reportBundle.id,
        status: 'generated',
        timestamp: reportBundle.timestamp
      };

    } catch (error) {
      console.error('Error generating healthcare survey report:', error);
      throw new Meteor.Error('generation-failed', 'Failed to generate survey report');
    }
});

Meteor.ServerMethods.define('healthcareSurveys.submitToNCHS', {
  description: 'Submit a generated survey report bundle to NCHS',
  aliases: ['healthcare-surveys.submitToNCHS'],
  positionalParams: ['bundleId'],
  schemaObject: {
    type: 'object',
    properties: { bundleId: { type: 'string' } },
    required: ['bundleId']
  }
}, async function(params, context) {
    const bundleId = params.bundleId;

    try {
      // Simulate NCHS submission
      const submissionResult = {
        submissionId: `NCHS-${Date.now()}`,
        status: 'submitted',
        timestamp: new Date().toISOString(),
        bundleId: bundleId
      };

      return submissionResult;

    } catch (error) {
      console.error('Error submitting to NCHS:', error);
      throw new Meteor.Error('submission-failed', 'Failed to submit to NCHS');
    }
});