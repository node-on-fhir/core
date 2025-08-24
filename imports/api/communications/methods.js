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
    'createInterventionApprovalCommunication': async function(communicationData) {
      check(communicationData, Object);
      
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'User must be logged in');
      }
      
      console.log('Server: Creating intervention approval communication');
      console.log('Server: Initial recipient:', JSON.stringify(communicationData.recipient));
      console.log('Server: Category:', JSON.stringify(communicationData.category));
      
      // Set the Chief Medical Officer as recipient from settings
      if (communicationData.category?.[0]?.coding?.[0]?.code === 'intervention-approval') {
        console.log('Server: Detected intervention-approval category');
        const chiefMedicalOfficer = get(Meteor.settings, 'private.pacio.chiefMedicalOfficer', {
          reference: 'Practitioner/chief-medical-officer',
          display: 'Chief Medical Officer'
        });
        console.log('Server: Chief Medical Officer from settings:', JSON.stringify(chiefMedicalOfficer));
        communicationData.recipient = [chiefMedicalOfficer];
        console.log('Server: Updated recipient:', JSON.stringify(communicationData.recipient));
      } else {
        console.log('Server: NOT an intervention-approval category');
      }
      
      // Set test flag
      communicationData.test = process.env.NODE_ENV === "test" ? true : false;
      
      // Ensure resourceType is set
      if (!communicationData.resourceType) {
        communicationData.resourceType = 'Communication';
      }
      
      // Convert date strings to Date objects
      if (communicationData.sent && typeof communicationData.sent === 'string') {
        communicationData.sent = new Date(communicationData.sent);
      }
      
      console.log('Server: Final communication data:', communicationData);
      
      // Insert directly
      const result = await Communications.insertAsync(communicationData);
      console.log('Communication created with ID:', result);
      
      // Verify it was inserted
      const inserted = await Communications.findOneAsync(result);
      console.log('Verified communication in database:', inserted);
      
      return result;
    },
    
    'testChiefMedicalOfficerSettings': function() {
      const chiefMedicalOfficer = get(Meteor.settings, 'private.pacio.chiefMedicalOfficer');
      console.log('Test: Chief Medical Officer settings:', chiefMedicalOfficer);
      console.log('Test: Full private.pacio settings:', get(Meteor.settings, 'private.pacio'));
      return chiefMedicalOfficer;
    },
    
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
    },
    
    'communications.getRecentAlerts': async function(recipientReference, hoursBack = 24) {
      check(recipientReference, Match.Maybe(String));
      check(hoursBack, Number);
      
      try {
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
          query['recipient.reference'] = recipientReference;
        }
        
        const recentAlerts = await Communications.findAsync(query, {
          sort: { sent: -1 },
          limit: 50
        }).fetch();
        
        console.log('Recent alerts found:', recentAlerts.length);
        
        return recentAlerts;
      } catch (error) {
        console.error('Error finding recent alerts:', error);
        throw new Meteor.Error('find-failed', 'Failed to find recent alerts');
      }
    }
  });
}