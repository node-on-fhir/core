// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/api/communications/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { Communications } from '../../lib/schemas/SimpleSchemas/Communications';

// Import the validated methods
import { 
  insertCommunication, 
  updateCommunication, 
  removeCommunicationById,
  getCommunication,
  searchCommunications
} from '../../lib/validatedMethods/communications.js';

// Re-export the methods for easier importing
export { 
  insertCommunication, 
  updateCommunication, 
  removeCommunicationById,
  getCommunication,
  searchCommunications
};

// Additional server-only methods can be added here if needed
if (Meteor.isServer) {
  Meteor.methods({
    'communications.countByStatus': async function(status) {
      check(status, Match.Optional(String));
      
      try {
        const query = status ? { status: status } : {};
        const count = await Communications.countAsync(query);
        return count;
      } catch (error) {
        console.error('Error counting communications:', error);
        throw new Meteor.Error('count-failed', 'Failed to count communications');
      }
    },
    
    'communications.findBySender': async function(senderReference) {
      check(senderReference, String);
      
      try {
        const communications = await Communications.findAsync({
          'sender.reference': senderReference
        }, {
          sort: { sent: -1 },
          limit: 100
        }).fetch();
        
        return communications;
      } catch (error) {
        console.error('Error finding communications by sender:', error);
        throw new Meteor.Error('find-failed', 'Failed to find communications');
      }
    },
    
    'communications.findByRecipient': async function(recipientReference) {
      check(recipientReference, String);
      
      try {
        const communications = await Communications.findAsync({
          'recipient.reference': recipientReference
        }, {
          sort: { received: -1 },
          limit: 100
        }).fetch();
        
        return communications;
      } catch (error) {
        console.error('Error finding communications by recipient:', error);
        throw new Meteor.Error('find-failed', 'Failed to find communications');
      }
    },
    
    'communications.findBySubject': async function(subjectReference) {
      check(subjectReference, String);
      
      try {
        const communications = await Communications.findAsync({
          'subject.reference': subjectReference
        }, {
          sort: { sent: -1 },
          limit: 100
        }).fetch();
        
        return communications;
      } catch (error) {
        console.error('Error finding communications by subject:', error);
        throw new Meteor.Error('find-failed', 'Failed to find communications');
      }
    },
    
    'communications.findConversation': async function(conversationId, sortOrder = -1) {
      check(conversationId, String);
      check(sortOrder, Number);
      
      try {
        const communications = await Communications.findAsync({
          'partOf.identifier.value': conversationId
        }, {
          sort: { received: sortOrder }
        }).fetch();
        
        return communications;
      } catch (error) {
        console.error('Error finding conversation:', error);
        throw new Meteor.Error('find-failed', 'Failed to find conversation');
      }
    }
  });
}