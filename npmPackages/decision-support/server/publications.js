// npmPackages/decision-support/server/publications.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';

import { DecisionSupportFeedback } from '../lib/collections.js';

function col(name) {
  return get(Meteor, 'Collections.' + name) || get(global, 'Collections.' + name);
}

// The DSI catalog (PlanDefinitions of type eca-rule).
Meteor.publish('decisionSupport.interventions', function() {
  if (!this.userId) return this.ready();
  const PlanDefinitions = col('PlanDefinitions');
  if (!PlanDefinitions) return this.ready();
  return PlanDefinitions.find({ 'type.coding.code': 'eca-rule' });
});

// Firings (GuidanceResponse + DetectedIssue), optionally patient-scoped.
Meteor.publish('decisionSupport.firings', function(patientId) {
  check(patientId, Match.Maybe(String));
  if (!this.userId) return this.ready();
  const GuidanceResponses = col('GuidanceResponses');
  const DetectedIssues = col('DetectedIssues');
  const cursors = [];
  const patientRef = patientId ? { reference: 'Patient/' + patientId } : null;
  if (GuidanceResponses) {
    cursors.push(GuidanceResponses.find(patientRef ? { 'subject.reference': patientRef.reference } : {}, { sort: { occurrenceDateTime: -1 }, limit: 100 }));
  }
  if (DetectedIssues) {
    cursors.push(DetectedIssues.find(patientRef ? { 'patient.reference': patientRef.reference } : {}, { sort: { identifiedDateTime: -1 }, limit: 100 }));
  }
  return cursors;
});

// Feedback records.
Meteor.publish('decisionSupport.feedback', function(patientId) {
  check(patientId, Match.Maybe(String));
  if (!this.userId) return this.ready();
  const selector = patientId ? { patientId: patientId } : {};
  return DecisionSupportFeedback.find(selector, { sort: { date: -1 }, limit: 200 });
});

console.log('[decision-support] Publications registered');
