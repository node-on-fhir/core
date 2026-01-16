// /Volumes/SonicMagic/Code/honeycomb-public-release/server/publications/communications.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Communications } from '../../imports/lib/schemas/SimpleSchemas/Communications';

// Basic publication for all communications (with limit)
Meteor.publish('communications', function(limit) {
  // Log the call for debugging
  console.log('Publishing all Communications for', this.userId ? `user ${this.userId}` : 'anonymous', 'with limit:', limit);
  
  // Handle undefined limit with default value
  if (limit === undefined || limit === null) {
    limit = 100;
  }
  
  // Ensure limit is a number
  if (typeof limit !== 'number') {
    console.warn('Communications publication received non-numeric limit:', limit, 'defaulting to 100');
    limit = 100;
  }
  
  check(limit, Number);
  
  if (!this.userId) {
    return this.ready();
  }
  
  return Communications.find({}, {
    limit: limit,
    sort: { sent: -1 }
  });
});

// Publish communications by subject
Meteor.publish('communications.bySubject', function(subjectReference, limit = 100) {
  check(subjectReference, String);
  check(limit, Match.Optional(Number));
  
  if (!this.userId) {
    return this.ready();
  }
  
  return Communications.find({
    'subject.reference': subjectReference
  }, {
    limit: limit,
    sort: { sent: -1 }
  });
});

// Publish communications by sender
Meteor.publish('communications.bySender', function(senderReference, limit = 100) {
  check(senderReference, String);
  check(limit, Match.Optional(Number));
  
  if (!this.userId) {
    return this.ready();
  }
  
  return Communications.find({
    'sender.reference': senderReference
  }, {
    limit: limit,
    sort: { sent: -1 }
  });
});

// Publish communications by recipient
// If no recipientReference provided, looks up the current user's practitionerId
Meteor.publish('communications.byRecipient', async function(recipientReference, limit = 100) {
  check(recipientReference, Match.Maybe(String));
  check(limit, Match.Optional(Number));
  
  if (!this.userId) {
    return this.ready();
  }
  
  // If no recipient reference provided, try to get from current user
  if (!recipientReference) {
    const user = await Meteor.users.findOneAsync(this.userId);
    console.log('Looking up practitionerId for user:', user?.username);
    
    if (user?.practitionerId) {
      recipientReference = `Practitioner/${user.practitionerId}`;
      console.log('Found practitionerId:', user.practitionerId);
    } else if (user?.profile?.isPractitioner) {
      // User is marked as practitioner but no linked ID
      // For intervention approvals, they should still see CMO messages
      console.log('User is practitioner without linked ID, will show intervention approvals');
    } else {
      console.log('User has no practitionerId and is not a practitioner');
      return this.ready();
    }
  }
  
  // Build query based on what we have
  let query;
  
  if (recipientReference) {
    // User has a specific practitioner reference
    query = {
      $or: [
        { 'recipient.0.reference': recipientReference },
        { 
          // Also show intervention approvals for CMO
          'recipient.0.reference': 'Practitioner/chief-medical-officer',
          'category.0.coding.0.code': 'intervention-approval'
        }
      ]
    };
  } else {
    // User is a practitioner without linked ID - show intervention approvals
    const user = await Meteor.users.findOneAsync(this.userId);
    if (user?.profile?.isPractitioner) {
      query = {
        'recipient.0.reference': 'Practitioner/chief-medical-officer',
        'category.0.coding.0.code': 'intervention-approval'
      };
    } else {
      // Not a practitioner, no communications
      return this.ready();
    }
  }
  
  console.log('Publishing communications with query:', query);
  
  return Communications.find(query, {
    limit: limit,
    sort: { received: -1 }
  });
});

// Publish communications for a conversation
Meteor.publish('communications.conversation', function(conversationId) {
  check(conversationId, String);
  
  if (!this.userId) {
    return this.ready();
  }
  
  return Communications.find({
    'partOf.identifier.value': conversationId
  }, {
    sort: { received: 1 }
  });
});

// Publish communications by status
Meteor.publish('communications.byStatus', function(status, limit = 100) {
  check(status, String);
  check(limit, Match.Optional(Number));
  
  if (!this.userId) {
    return this.ready();
  }
  
  return Communications.find({
    status: status
  }, {
    limit: limit,
    sort: { sent: -1 }
  });
});

// Publish a single communication by ID
Meteor.publish('communication', function(communicationId) {
  check(communicationId, String);
  
  if (!this.userId) {
    return this.ready();
  }
  
  return Communications.find({ _id: communicationId });
});

// Publish recent communications (last 24 hours)
Meteor.publish('communications.recent', function(limit = 50) {
  check(limit, Match.Optional(Number));
  
  if (!this.userId) {
    return this.ready();
  }
  
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
  
  return Communications.find({
    $or: [
      { sent: { $gte: twentyFourHoursAgo } },
      { received: { $gte: twentyFourHoursAgo } }
    ]
  }, {
    limit: limit,
    sort: { sent: -1 }
  });
});

// Publish recent alert communications
Meteor.publish('communications.recentAlerts', function(recipientReference, hoursBack = 24) {
  check(recipientReference, Match.Maybe(String));
  check(hoursBack, Number);
  
  if (!this.userId) {
    return this.ready();
  }
  
  console.log('Publishing recent alerts for recipient:', recipientReference);
  
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hoursBack);
  
  // Query for recent alert communications
  const query = {
    $and: [
      {
        $or: [
          { sent: { $gte: cutoffDate } },
          { received: { $gte: cutoffDate } }
        ]
      },
      {
        $or: [
          { 'category.0.coding.0.code': 'alert' },
          { 'category.0.text': { $regex: 'alert', $options: 'i' } },
          { 'priority': 'urgent' },
          { 'priority': 'asap' },
          { 'priority': 'stat' }
        ]
      }
    ]
  };
  
  // If recipient reference provided, filter by recipient
  if (recipientReference) {
    query['recipient.0.reference'] = recipientReference;
  }
  
  return Communications.find(query, {
    sort: { sent: -1 },
    limit: 50
  });
});