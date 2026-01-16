// packages/healthcare-surveys/server/methods/surveyMethods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import { HealthcareSurveysContentBundle } from '../../lib/schemas/HealthcareSurveysContentBundle';
import { HealthcareSurveysReportingBundle } from '../../lib/schemas/HealthcareSurveysReportingBundle';

export const createSurveyComposition = new ValidatedMethod({
  name: 'healthcare-surveys.createComposition',
  validate: new SimpleSchema({
    patientId: { type: String },
    encounterId: { type: String },
    sections: { type: Array },
    'sections.$': { type: Object, blackbox: true }
  }).validator(),
  async run({ patientId, encounterId, sections }) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to create survey composition');
    }
    
    const composition = {
      resourceType: 'Composition',
      status: 'final',
      type: {
        coding: [{
          system: 'http://loinc.org',
          code: '75619-7',
          display: 'Health Care Survey Report'
        }]
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      encounter: {
        reference: `Encounter/${encounterId}`
      },
      date: new Date().toISOString(),
      author: [{
        reference: `Practitioner/${this.userId}`
      }],
      title: 'National Health Care Surveys report',
      section: sections
    };
    
    try {
      const compositionId = await HcsComposition.insertAsync(composition);
      return compositionId;
    } catch (error) {
      console.error('Error creating composition:', error);
      throw new Meteor.Error('creation-failed', 'Failed to create survey composition');
    }
  }
});

export const createSurveyBundle = new ValidatedMethod({
  name: 'healthcare-surveys.createBundle',
  validate: new SimpleSchema({
    compositionId: { type: String },
    includeReferences: { type: Boolean, defaultValue: true }
  }).validator(),
  async run({ compositionId, includeReferences }) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to create survey bundle');
    }
    
    // Fetch the composition
    const composition = await HcsComposition.findOneAsync(compositionId);
    if (!composition) {
      throw new Meteor.Error('not-found', 'Composition not found');
    }
    
    const bundle = {
      resourceType: 'Bundle',
      type: 'collection',
      entry: [{
        fullUrl: `urn:uuid:${composition._id}`,
        resource: composition
      }]
    };
    
    if (includeReferences) {
      // TODO: Add logic to fetch and include all referenced resources
      // This would require access to other collections (Patient, Encounter, etc.)
    }
    
    try {
      const bundleId = await HealthcareSurveysContentBundle.insertAsync(bundle);
      return bundleId;
    } catch (error) {
      console.error('Error creating bundle:', error);
      throw new Meteor.Error('creation-failed', 'Failed to create survey bundle');
    }
  }
});

export const submitSurveyReport = new ValidatedMethod({
  name: 'healthcare-surveys.submitReport',
  validate: new SimpleSchema({
    bundleId: { type: String },
    endpoint: { type: String },
    messageHeader: { type: Object, blackbox: true }
  }).validator(),
  async run({ bundleId, endpoint, messageHeader }) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to submit survey report');
    }
    
    // Fetch the content bundle
    const contentBundle = await HealthcareSurveysContentBundle.findOneAsync(bundleId);
    if (!contentBundle) {
      throw new Meteor.Error('not-found', 'Content bundle not found');
    }
    
    // Create the reporting bundle
    const reportingBundle = {
      resourceType: 'Bundle',
      type: 'message',
      entry: [
        {
          fullUrl: `urn:uuid:${Meteor.uuid()}`,
          resource: {
            resourceType: 'MessageHeader',
            ...messageHeader,
            eventCoding: {
              system: 'http://hl7.org/fhir/us/ph-library/CodeSystem/us-ph-codesystem-message-types',
              code: 'hcs-report'
            },
            destination: [{
              endpoint: endpoint
            }],
            sender: {
              reference: `Organization/${Meteor.settings.private?.organizationId || 'default'}`
            }
          }
        },
        {
          fullUrl: `urn:uuid:${contentBundle._id}`,
          resource: contentBundle
        }
      ]
    };
    
    try {
      // Save the reporting bundle
      const reportingBundleId = await HealthcareSurveysReportingBundle.insertAsync(reportingBundle);
      
      // Submit to endpoint (requires fetch)
      const { fetch } = await import('meteor/fetch');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json',
          'Accept': 'application/fhir+json'
        },
        body: JSON.stringify(reportingBundle)
      });
      
      if (!response.ok) {
        throw new Meteor.Error('submission-failed', `Submission failed with status ${response.status}`);
      }
      
      return {
        success: true,
        reportingBundleId,
        submittedAt: new Date(),
        responseStatus: response.status
      };
    } catch (error) {
      console.error('Error submitting report:', error);
      throw new Meteor.Error('submission-failed', error.message || 'Failed to submit survey report');
    }
  }
});

export const getSurveyCompositions = new ValidatedMethod({
  name: 'healthcare-surveys.getCompositions',
  validate: new SimpleSchema({
    patientId: { type: String, optional: true },
    encounterId: { type: String, optional: true },
    startDate: { type: Date, optional: true },
    endDate: { type: Date, optional: true }
  }).validator(),
  async run({ patientId, encounterId, startDate, endDate }) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    const selector = {};
    
    if (patientId) {
      selector['subject.reference'] = `Patient/${patientId}`;
    }
    
    if (encounterId) {
      selector['encounter.reference'] = `Encounter/${encounterId}`;
    }
    
    if (startDate || endDate) {
      selector.date = {};
      if (startDate) {
        selector.date.$gte = startDate.toISOString();
      }
      if (endDate) {
        selector.date.$lte = endDate.toISOString();
      }
    }
    
    return await HcsComposition.findAsync(selector, {
      sort: { date: -1 },
      limit: 100
    }).fetch();
  }
});

// Initialize methods
Meteor.methods({
  'healthcare-surveys.ping': function() {
    return 'Healthcare Surveys package is active';
  }
});