// /Volumes/SonicMagic/Code/honeycomb-public-release/server/publications/communications.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Communications } from '../../imports/lib/schemas/SimpleSchemas/Communications';

// Basic publication for all communications (with limit)
Meteor.publish('communications', function(limit = 100) {
  check(limit, Match.Optional(Number));
  
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
Meteor.publish('communications.byRecipient', function(recipientReference, limit = 100) {
  check(recipientReference, String);
  check(limit, Match.Optional(Number));
  
  if (!this.userId) {
    return this.ready();
  }
  
  return Communications.find({
    'recipient.reference': recipientReference
  }, {
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