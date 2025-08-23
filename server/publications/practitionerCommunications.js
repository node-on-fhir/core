// server/publications/practitionerCommunications.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';

// Import collections
import { ServiceRequests } from '../../imports/lib/schemas/SimpleSchemas/ServiceRequests';
import { Communications } from '../../imports/lib/schemas/SimpleSchemas/Communications';
import { Tasks } from '../../imports/lib/schemas/SimpleSchemas/Tasks';
import { Practitioners } from '../../imports/lib/schemas/SimpleSchemas/Practitioners';
import { PractitionerRoles } from '../../imports/lib/schemas/SimpleSchemas/PractitionerRoles';

/**
 * Publish practitioner-specific service requests
 */
Meteor.publish('serviceRequests.byPractitioner', async function(practitionerId) {
  check(practitionerId, Match.Maybe(String));
  
  if (!this.userId) {
    return this.ready();
  }
  
  // Use the user's practitionerId if not specified
  const user = await Meteor.users.findOneAsync(this.userId);
  const targetPractitionerId = practitionerId || get(user, 'practitionerId');
  
  if (!targetPractitionerId) {
    return this.ready();
  }
  
  // Find service requests where the practitioner is involved
  return ServiceRequests.find({
    $or: [
      { 'requester.reference': `Practitioner/${targetPractitionerId}` },
      { 'performer.reference': `Practitioner/${targetPractitionerId}` },
      { 'performer.0.reference': `Practitioner/${targetPractitionerId}` },
      { 'supportingInfo.reference': `Practitioner/${targetPractitionerId}` }
    ]
  });
});

/**
 * Publish communications for a practitioner
 */
Meteor.publish('communications.byPractitioner', async function(practitionerId) {
  check(practitionerId, Match.Maybe(String));
  
  if (!this.userId) {
    return this.ready();
  }
  
  // Use the user's practitionerId if not specified
  const user = await Meteor.users.findOneAsync(this.userId);
  const targetPractitionerId = practitionerId || get(user, 'practitionerId');
  
  if (!targetPractitionerId) {
    return this.ready();
  }
  
  // Find communications where the practitioner is sender or recipient
  return Communications.find({
    $or: [
      { 'sender.reference': `Practitioner/${targetPractitionerId}` },
      { 'recipient.reference': `Practitioner/${targetPractitionerId}` },
      { 'recipient.0.reference': `Practitioner/${targetPractitionerId}` }
    ]
  });
});

/**
 * Publish tasks assigned to or by a practitioner
 */
Meteor.publish('tasks.byPractitioner', async function(practitionerId) {
  check(practitionerId, Match.Maybe(String));
  
  if (!this.userId) {
    return this.ready();
  }
  
  // Use the user's practitionerId if not specified
  const user = await Meteor.users.findOneAsync(this.userId);
  const targetPractitionerId = practitionerId || get(user, 'practitionerId');
  
  if (!targetPractitionerId) {
    return this.ready();
  }
  
  // Find tasks where the practitioner is owner, requester, or performer
  return Tasks.find({
    $or: [
      { 'owner.reference': `Practitioner/${targetPractitionerId}` },
      { 'requester.reference': `Practitioner/${targetPractitionerId}` },
      { 'performer.reference': `Practitioner/${targetPractitionerId}` },
      { 'performer.0.reference': `Practitioner/${targetPractitionerId}` }
    ]
  });
});

/**
 * Publish practitioner's own record
 */
Meteor.publish('practitioners.current', async function() {
  if (!this.userId) {
    return this.ready();
  }
  
  const user = await Meteor.users.findOneAsync(this.userId);
  const practitionerId = get(user, 'practitionerId');
  
  if (!practitionerId) {
    return this.ready();
  }
  
  return Practitioners.find({
    $or: [
      { id: practitionerId },
      { _id: practitionerId }
    ]
  });
});

/**
 * Publish practitioner role for current user
 */
Meteor.publish('practitionerRoles.current', async function() {
  if (!this.userId) {
    return this.ready();
  }
  
  const user = await Meteor.users.findOneAsync(this.userId);
  const practitionerRoleId = get(user, 'practitionerRoleId');
  
  if (!practitionerRoleId) {
    return this.ready();
  }
  
  return PractitionerRoles.find({
    $or: [
      { id: practitionerRoleId },
      { _id: practitionerRoleId }
    ]
  });
});

/**
 * Publish all practitioners in the same organization
 */
Meteor.publish('practitioners.inOrganization', async function(organizationId) {
  check(organizationId, Match.Maybe(String));
  
  if (!this.userId) {
    return this.ready();
  }
  
  // If no organization specified, try to get from user's practitioner role
  let targetOrganizationId = organizationId;
  
  if (!targetOrganizationId) {
    const user = await Meteor.users.findOneAsync(this.userId);
    const practitionerRoleId = get(user, 'practitionerRoleId');
    
    if (practitionerRoleId) {
      const practitionerRole = await PractitionerRoles.findOneAsync({
        $or: [
          { id: practitionerRoleId },
          { _id: practitionerRoleId }
        ]
      });
      
      targetOrganizationId = get(practitionerRole, 'organization.reference', '').replace('Organization/', '');
    }
  }
  
  if (!targetOrganizationId) {
    return this.ready();
  }
  
  // Find all practitioner roles in the organization
  const practitionerRoles = await PractitionerRoles.find({
    'organization.reference': `Organization/${targetOrganizationId}`
  }).fetchAsync();
  
  // Extract practitioner IDs
  const practitionerIds = practitionerRoles
    .map(role => get(role, 'practitioner.reference', '').replace('Practitioner/', ''))
    .filter(id => id);
  
  // Return practitioners
  return Practitioners.find({
    $or: [
      { id: { $in: practitionerIds } },
      { _id: { $in: practitionerIds } }
    ]
  });
});

/**
 * Publish inter-practitioner communications
 */
Meteor.publish('communications.interPractitioner', async function(limit = 50) {
  check(limit, Number);
  
  if (!this.userId) {
    return this.ready();
  }
  
  const user = await Meteor.users.findOneAsync(this.userId);
  const practitionerId = get(user, 'practitionerId');
  
  if (!practitionerId) {
    return this.ready();
  }
  
  // Find communications between practitioners
  return Communications.find({
    $and: [
      {
        $or: [
          { 'sender.reference': `Practitioner/${practitionerId}` },
          { 'recipient.reference': `Practitioner/${practitionerId}` },
          { 'recipient.0.reference': `Practitioner/${practitionerId}` }
        ]
      },
      {
        $or: [
          { 'sender.reference': { $regex: /^Practitioner\// } },
          { 'recipient.reference': { $regex: /^Practitioner\// } },
          { 'recipient.0.reference': { $regex: /^Practitioner\// } }
        ]
      }
    ]
  }, {
    sort: { sent: -1 },
    limit: limit
  });
});