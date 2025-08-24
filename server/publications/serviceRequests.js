// /Volumes/SonicMagic/Code/honeycomb-public-release/server/publications/serviceRequests.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ServiceRequests } from '../../imports/lib/schemas/SimpleSchemas/ServiceRequests';

// Basic publication for all service requests (with limit)
Meteor.publish('serviceRequests', function(limit = 100) {
  check(limit, Match.Optional(Number));
  
  if (!this.userId) {
    return this.ready();
  }
  
  return ServiceRequests.find({}, {
    limit: limit,
    sort: { authoredOn: -1 }
  });
});

// Publish active interventions (non-approval ServiceRequests)
Meteor.publish('serviceRequests.activeInterventions', async function(practitionerId, limit = 20) {
  check(practitionerId, Match.Maybe(String));
  check(limit, Number);
  
  if (!this.userId) {
    return this.ready();
  }
  
  console.log('Publishing active interventions for user:', this.userId);
  
  // Query for active intervention ServiceRequests
  // These are the initial intervention requests, NOT approval requests
  const query = {
    status: { $in: ['active', 'on-hold'] },
    $and: [
      {
        $or: [
          { 'category.0.coding.0.code': { $ne: 'intervention-approval' } },
          { 'category': { $exists: false } }
        ]
      }
    ]
  };
  
  // For now, show all active interventions regardless of practitioner
  // This allows users to see interventions they created
  console.log('Publishing all active interventions');
  
  return ServiceRequests.find(query, {
    sort: { authoredOn: -1 },
    limit: limit
  });
});

// Publish service requests by patient
Meteor.publish('serviceRequests.byPatient', function(patientId, limit = 100) {
  check(patientId, String);
  check(limit, Match.Optional(Number));
  
  if (!this.userId) {
    return this.ready();
  }
  
  return ServiceRequests.find({
    'subject.reference': `Patient/${patientId}`
  }, {
    limit: limit,
    sort: { authoredOn: -1 }
  });
});

// Publish service requests by status
Meteor.publish('serviceRequests.byStatus', function(status, limit = 100) {
  check(status, String);
  check(limit, Match.Optional(Number));
  
  if (!this.userId) {
    return this.ready();
  }
  
  return ServiceRequests.find({
    status: status
  }, {
    limit: limit,
    sort: { authoredOn: -1 }
  });
});

// Publish a single service request by ID
Meteor.publish('serviceRequest', function(serviceRequestId) {
  check(serviceRequestId, String);
  
  if (!this.userId) {
    return this.ready();
  }
  
  return ServiceRequests.find({ _id: serviceRequestId });
});

// Publish intervention approval requests for a specific approver
Meteor.publish('serviceRequests.approvalRequests', function(approverId, limit = 100) {
  check(approverId, Match.Maybe(String));
  check(limit, Match.Optional(Number));
  
  if (!this.userId) {
    return this.ready();
  }
  
  const query = {
    'category.0.coding.0.code': 'intervention-approval',
    status: { $in: ['active', 'on-hold'] }
  };
  
  // If approver ID provided, filter by performer (the approver)
  if (approverId) {
    query['performer.reference'] = `Practitioner/${approverId}`;
  }
  
  return ServiceRequests.find(query, {
    limit: limit,
    sort: { authoredOn: -1 }
  });
});