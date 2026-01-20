// packages/healthcare-surveys/server/publications/surveyPublications.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';

// Import collections
import { HcsComposition } from '../../lib/schemas/HcsComposition';
import { HcsMedicationAdministration } from '../../lib/schemas/HcsMedicationAdministration';
import { HcsMedicationRequest } from '../../lib/schemas/HcsMedicationRequest';
import { HcsDiagnosticReport } from '../../lib/schemas/HcsDiagnosticReport';
import { HealthcareSurveysContentBundle } from '../../lib/schemas/HealthcareSurveysContentBundle';
import { HealthcareSurveysReportingBundle } from '../../lib/schemas/HealthcareSurveysReportingBundle';

// Publish survey compositions
Meteor.publish('healthcare-surveys.compositions', async function(options = {}) {
  check(options, {
    patientId: Match.Optional(String),
    encounterId: Match.Optional(String),
    limit: Match.Optional(Number),
    sort: Match.Optional(Object)
  });
  
  if (!this.userId) {
    return this.ready();
  }
  
  const selector = {};
  
  if (options.patientId) {
    selector['subject.reference'] = `Patient/${options.patientId}`;
  }
  
  if (options.encounterId) {
    selector['encounter.reference'] = `Encounter/${options.encounterId}`;
  }
  
  const queryOptions = {
    limit: options.limit || 20,
    sort: options.sort || { date: -1 }
  };
  
  return HcsComposition.find(selector, queryOptions);
});

// Publish medication administrations
Meteor.publish('healthcare-surveys.medicationAdministrations', async function(options = {}) {
  check(options, {
    patientId: Match.Optional(String),
    encounterId: Match.Optional(String),
    status: Match.Optional(String),
    limit: Match.Optional(Number)
  });
  
  if (!this.userId) {
    return this.ready();
  }
  
  const selector = {};
  
  if (options.patientId) {
    selector['subject.reference'] = `Patient/${options.patientId}`;
  }
  
  if (options.encounterId) {
    selector['context.reference'] = `Encounter/${options.encounterId}`;
  }
  
  if (options.status) {
    selector.status = options.status;
  }
  
  return HcsMedicationAdministration.find(selector, {
    limit: options.limit || 50,
    sort: { effectiveDateTime: -1 }
  });
});

// Publish medication requests
Meteor.publish('healthcare-surveys.medicationRequests', async function(options = {}) {
  check(options, {
    patientId: Match.Optional(String),
    encounterId: Match.Optional(String),
    status: Match.Optional(String),
    limit: Match.Optional(Number)
  });
  
  if (!this.userId) {
    return this.ready();
  }
  
  const selector = {};
  
  if (options.patientId) {
    selector['subject.reference'] = `Patient/${options.patientId}`;
  }
  
  if (options.encounterId) {
    selector['encounter.reference'] = `Encounter/${options.encounterId}`;
  }
  
  if (options.status) {
    selector.status = options.status;
  }
  
  return HcsMedicationRequest.find(selector, {
    limit: options.limit || 50,
    sort: { authoredOn: -1 }
  });
});

// Publish diagnostic reports
Meteor.publish('healthcare-surveys.diagnosticReports', async function(options = {}) {
  check(options, {
    patientId: Match.Optional(String),
    encounterId: Match.Optional(String),
    status: Match.Optional(String),
    category: Match.Optional(String),
    limit: Match.Optional(Number)
  });
  
  if (!this.userId) {
    return this.ready();
  }
  
  const selector = {};
  
  if (options.patientId) {
    selector['subject.reference'] = `Patient/${options.patientId}`;
  }
  
  if (options.encounterId) {
    selector['encounter.reference'] = `Encounter/${options.encounterId}`;
  }
  
  if (options.status) {
    selector.status = options.status;
  }
  
  if (options.category) {
    selector['category.coding.code'] = options.category;
  }
  
  return HcsDiagnosticReport.find(selector, {
    limit: options.limit || 50,
    sort: { issued: -1 }
  });
});

// Publish content bundles
Meteor.publish('healthcare-surveys.contentBundles', async function(options = {}) {
  check(options, {
    compositionId: Match.Optional(String),
    limit: Match.Optional(Number)
  });
  
  if (!this.userId) {
    return this.ready();
  }
  
  const selector = {};
  
  if (options.compositionId) {
    selector['entry.resource._id'] = options.compositionId;
  }
  
  return HealthcareSurveysContentBundle.find(selector, {
    limit: options.limit || 20,
    sort: { _id: -1 }
  });
});

// Publish reporting bundles
Meteor.publish('healthcare-surveys.reportingBundles', async function(options = {}) {
  check(options, {
    status: Match.Optional(String),
    startDate: Match.Optional(Date),
    endDate: Match.Optional(Date),
    limit: Match.Optional(Number)
  });
  
  if (!this.userId) {
    return this.ready();
  }
  
  const selector = {};
  
  // Note: You might want to add metadata fields to track submission status and dates
  
  return HealthcareSurveysReportingBundle.find(selector, {
    limit: options.limit || 20,
    sort: { _id: -1 }
  });
});

// Combined publication for a complete survey report
Meteor.publish('healthcare-surveys.completeReport', async function(compositionId) {
  check(compositionId, String);
  
  if (!this.userId) {
    return this.ready();
  }
  
  const cursors = [];
  
  // Get the composition
  const composition = await HcsComposition.findOneAsync(compositionId);
  if (!composition) {
    return this.ready();
  }
  
  cursors.push(HcsComposition.find({ _id: compositionId }));
  
  // Extract references from the composition
  const patientRef = get(composition, 'subject.reference', '').split('/')[1];
  const encounterRef = get(composition, 'encounter.reference', '').split('/')[1];
  
  if (encounterRef) {
    // Get related medications
    cursors.push(HcsMedicationAdministration.find({
      'context.reference': `Encounter/${encounterRef}`
    }, { limit: 100 }));
    
    cursors.push(HcsMedicationRequest.find({
      'encounter.reference': `Encounter/${encounterRef}`
    }, { limit: 100 }));
    
    // Get diagnostic reports
    cursors.push(HcsDiagnosticReport.find({
      'encounter.reference': `Encounter/${encounterRef}`
    }, { limit: 50 }));
  }
  
  // Get bundles containing this composition
  cursors.push(HealthcareSurveysContentBundle.find({
    'entry.resource._id': compositionId
  }, { limit: 10 }));
  
  return cursors;
});

// Publish survey statistics
Meteor.publish('healthcare-surveys.statistics', async function(options = {}) {
  check(options, {
    startDate: Match.Optional(Date),
    endDate: Match.Optional(Date),
    encounterType: Match.Optional(String)
  });
  
  if (!this.userId) {
    return this.ready();
  }
  
  const self = this;
  
  // This is a synthetic publication that calculates and publishes statistics
  const stats = {
    _id: 'survey-stats',
    compositionCount: 0,
    bundleCount: 0,
    reportCount: 0,
    lastUpdated: new Date()
  };
  
  const compositionSelector = {};
  if (options.startDate || options.endDate) {
    compositionSelector.date = {};
    if (options.startDate) {
      compositionSelector.date.$gte = options.startDate.toISOString();
    }
    if (options.endDate) {
      compositionSelector.date.$lte = options.endDate.toISOString();
    }
  }
  
  // Count documents
  stats.compositionCount = await HcsComposition.countAsync(compositionSelector);
  stats.bundleCount = await HealthcareSurveysContentBundle.countAsync();
  stats.reportCount = await HealthcareSurveysReportingBundle.countAsync();
  
  self.added('SurveyStatistics', stats._id, stats);
  self.ready();
  
  // Clean up
  self.onStop(function() {
    self.removed('SurveyStatistics', stats._id);
  });
});