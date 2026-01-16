// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/healthcare-surveys/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';

Meteor.methods({
  'healthcare-surveys.generateReport': async function(encounterData) {
    check(encounterData, {
      encounterId: String,
      patientId: String,
      surveyType: String
    });

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }

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
  },

  'healthcare-surveys.submitToNCHS': async function(bundleId) {
    check(bundleId, String);

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }

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
  }
});