// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/api/communications/methods.js

import { Meteor } from 'meteor/meteor';
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
  Meteor.ServerMethods.define('communications.createInterventionApproval', {
    description: 'Create an intervention-approval Communication addressed to the Chief Medical Officer',
    aliases: ['createInterventionApprovalCommunication'],
    phi: true,
    schemaObject: { type: 'object' }   // arbitrary FHIR Communication shape
  }, async function(params, context){
    const communicationData = params;

    context.log.info('Creating intervention approval communication');
    context.log.debug('Initial recipient and category', {
      recipient: communicationData.recipient,
      category: communicationData.category
    });

    // Set the Chief Medical Officer as recipient from settings
    if (communicationData.category?.[0]?.coding?.[0]?.code === 'intervention-approval') {
      context.log.debug('Detected intervention-approval category');
      const chiefMedicalOfficer = get(Meteor.settings, 'private.pacio.chiefMedicalOfficer', {
        reference: 'Practitioner/chief-medical-officer',
        display: 'Chief Medical Officer'
      });
      context.log.debug('Chief Medical Officer from settings', { chiefMedicalOfficer: chiefMedicalOfficer });
      communicationData.recipient = [chiefMedicalOfficer];
      context.log.debug('Updated recipient', { recipient: communicationData.recipient });
    } else {
      context.log.debug('NOT an intervention-approval category');
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

    context.log.debug('Final communication data', { data: communicationData });

    // Insert directly
    const result = await Communications.insertAsync(communicationData);
    context.log.info('Communication created', { _id: result });

    // Verify it was inserted
    const inserted = await Communications.findOneAsync(result);
    context.log.debug('Verified communication in database', { data: inserted });

    return result;
  });

  Meteor.ServerMethods.define('communications.testChiefMedicalOfficerSettings', {
    description: 'Return the configured Chief Medical Officer reference from server settings'
    // Pre-migration this method had NO auth guard (latent bug — it returns
    // private settings content). requireAuth now applies (default true).
  }, async function(params, context){
    const chiefMedicalOfficer = get(Meteor.settings, 'private.pacio.chiefMedicalOfficer');
    context.log.debug('Chief Medical Officer settings', {
      chiefMedicalOfficer: chiefMedicalOfficer,
      pacio: get(Meteor.settings, 'private.pacio')
    });
    return chiefMedicalOfficer;
  });

  Meteor.ServerMethods.define('communications.countByStatus', {
    description: 'Count Communication resources, optionally filtered by status',
    positionalParams: ['status'],
    schemaObject: {
      type: 'object',
      properties: {
        status: { type: 'string' }
      }
    }
    // Pre-migration this method had NO auth guard. requireAuth now applies
    // (default true) — behavior change noted in the migration report.
  }, async function(params, context){
    const status = params.status;

    try {
      const query = status ? { status: status } : {};
      const count = await Communications.countAsync(query);
      return count;
    } catch (error) {
      context.log.error('Error counting communications', { message: error.message });
      throw new Meteor.Error('count-failed', 'Failed to count communications');
    }
  });

  Meteor.ServerMethods.define('communications.findBySender', {
    description: 'Find Communication resources sent by a given sender reference',
    phi: true,
    positionalParams: ['senderReference'],
    schemaObject: {
      type: 'object',
      properties: {
        senderReference: { type: 'string' }
      },
      required: ['senderReference']
    }
    // Pre-migration this method had NO auth guard (latent bug — it reads
    // patient-scoped data). requireAuth now applies (default true).
  }, async function(params, context){
    try {
      const communications = await Communications.findAsync({
        'sender.reference': params.senderReference
      }, {
        sort: { sent: -1 },
        limit: 100
      }).fetch();

      return communications;
    } catch (error) {
      context.log.error('Error finding communications by sender', { message: error.message });
      throw new Meteor.Error('find-failed', 'Failed to find communications');
    }
  });

  Meteor.ServerMethods.define('communications.findByRecipient', {
    description: 'Find Communication resources received by a given recipient reference',
    phi: true,
    positionalParams: ['recipientReference'],
    schemaObject: {
      type: 'object',
      properties: {
        recipientReference: { type: 'string' }
      },
      required: ['recipientReference']
    }
    // Pre-migration this method had NO auth guard (latent bug — it reads
    // patient-scoped data). requireAuth now applies (default true).
  }, async function(params, context){
    try {
      const communications = await Communications.findAsync({
        'recipient.reference': params.recipientReference
      }, {
        sort: { received: -1 },
        limit: 100
      }).fetch();

      return communications;
    } catch (error) {
      context.log.error('Error finding communications by recipient', { message: error.message });
      throw new Meteor.Error('find-failed', 'Failed to find communications');
    }
  });

  Meteor.ServerMethods.define('communications.findBySubject', {
    description: 'Find Communication resources about a given subject reference',
    phi: true,
    positionalParams: ['subjectReference'],
    schemaObject: {
      type: 'object',
      properties: {
        subjectReference: { type: 'string' }
      },
      required: ['subjectReference']
    }
    // Pre-migration this method had NO auth guard (latent bug — it reads
    // patient-scoped data). requireAuth now applies (default true).
  }, async function(params, context){
    try {
      const communications = await Communications.findAsync({
        'subject.reference': params.subjectReference
      }, {
        sort: { sent: -1 },
        limit: 100
      }).fetch();

      return communications;
    } catch (error) {
      context.log.error('Error finding communications by subject', { message: error.message });
      throw new Meteor.Error('find-failed', 'Failed to find communications');
    }
  });

  Meteor.ServerMethods.define('communications.findConversation', {
    description: 'Fetch the Communication resources belonging to a conversation, sorted by receipt time',
    phi: true,
    positionalParams: ['conversationId', 'sortOrder'],
    schemaObject: {
      type: 'object',
      properties: {
        conversationId: { type: 'string' },
        sortOrder: { type: 'number' }
      },
      required: ['conversationId']
    }
    // Pre-migration this method had NO auth guard (latent bug — it reads
    // patient-scoped data). requireAuth now applies (default true).
  }, async function(params, context){
    const conversationId = params.conversationId;
    const sortOrder = get(params, 'sortOrder', -1);

    try {
      const communications = await Communications.findAsync({
        'partOf.identifier.value': conversationId
      }, {
        sort: { received: sortOrder }
      }).fetch();

      return communications;
    } catch (error) {
      context.log.error('Error finding conversation', { message: error.message });
      throw new Meteor.Error('find-failed', 'Failed to find conversation');
    }
  });

  Meteor.ServerMethods.define('communications.getRecentAlerts', {
    description: 'Find recent alert or urgent Communication resources within a lookback window',
    phi: true,
    positionalParams: ['recipientReference', 'hoursBack'],
    schemaObject: {
      type: 'object',
      properties: {
        recipientReference: { type: ['string', 'null'] },
        hoursBack: { type: 'number' }
      }
    }
    // Pre-migration this method had NO auth guard (latent bug — it reads
    // patient-scoped data). requireAuth now applies (default true).
  }, async function(params, context){
    const recipientReference = params.recipientReference;
    const hoursBack = get(params, 'hoursBack', 24);

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

      context.log.debug('Recent alerts found', { count: recentAlerts.length });

      return recentAlerts;
    } catch (error) {
      context.log.error('Error finding recent alerts', { message: error.message });
      throw new Meteor.Error('find-failed', 'Failed to find recent alerts');
    }
  });
}
