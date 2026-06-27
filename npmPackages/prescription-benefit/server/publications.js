// npmPackages/prescription-benefit/server/publications.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { PrescriptionBenefitRequest, PrescriptionBenefitResponse } from '../lib/collections.js';

// Recent RTPB transactions, optionally scoped to a patient. Returns both
// collections so the History tab can join request <-> response by requestId.
Meteor.publish('prescriptionBenefit.transactions', function(patientId, limit) {
  check(patientId, Match.Maybe(String));
  check(limit, Match.Maybe(Number));

  if (!this.userId) {
    return this.ready();
  }

  const selector = patientId ? { patientId: patientId } : {};
  const options = { sort: { createdAt: -1 }, limit: limit || 50 };

  return [
    PrescriptionBenefitRequest.find(selector, options),
    PrescriptionBenefitResponse.find(selector, options)
  ];
});

console.log('[prescription-benefit] Publications registered');
