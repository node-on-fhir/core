// /imports/api/messageHeaders/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import { Random } from 'meteor/random';

import { MessageHeaders } from '/imports/lib/schemas/SimpleSchemas/MessageHeaders';

Meteor.methods({
  createMessageHeader: async function(messageHeaderData) {
    console.log('[createMessageHeader] Creating new message header...');
    check(messageHeaderData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create message headers');
    }

    // Clean and prepare the message header data
    const cleanMessageHeader = {
      resourceType: 'MessageHeader',
      id: Random.id(),
      meta: {
        versionId: '1',
        lastUpdated: new Date()
      }
    };

    // Event
    if (messageHeaderData.eventCoding) {
      cleanMessageHeader.eventCoding = {
        system: get(messageHeaderData, 'eventCoding.system', 'http://hl7.org/fhir/message-events'),
        code: get(messageHeaderData, 'eventCoding.code', ''),
        display: get(messageHeaderData, 'eventCoding.display', '')
      };
    } else if (messageHeaderData.eventUri) {
      cleanMessageHeader.eventUri = messageHeaderData.eventUri;
    }

    // Source - Required
    cleanMessageHeader.source = {
      name: get(messageHeaderData, 'source.name', ''),
      software: get(messageHeaderData, 'source.software', ''),
      version: get(messageHeaderData, 'source.version', ''),
      endpoint: get(messageHeaderData, 'source.endpoint', '') // Required field
    };

    // Destination
    if (messageHeaderData.destination && messageHeaderData.destination.length > 0) {
      cleanMessageHeader.destination = messageHeaderData.destination.map(dest => ({
        name: get(dest, 'name', ''),
        target: {
          reference: get(dest, 'target.reference', ''),
          display: get(dest, 'target.display', '')
        },
        endpoint: get(dest, 'endpoint', ''),
        receiver: get(dest, 'receiver.reference') ? {
          reference: get(dest, 'receiver.reference', ''),
          display: get(dest, 'receiver.display', '')
        } : undefined
      }));
    }

    // Sender
    if (get(messageHeaderData, 'sender.reference') || get(messageHeaderData, 'sender.display')) {
      cleanMessageHeader.sender = {
        reference: get(messageHeaderData, 'sender.reference', ''),
        display: get(messageHeaderData, 'sender.display', '')
      };
    }

    // Responsible
    if (get(messageHeaderData, 'responsible.reference') || get(messageHeaderData, 'responsible.display')) {
      cleanMessageHeader.responsible = {
        reference: get(messageHeaderData, 'responsible.reference', ''),
        display: get(messageHeaderData, 'responsible.display', '')
      };
    }

    // Reason
    if (messageHeaderData.reason && (get(messageHeaderData, 'reason.coding[0].code') || get(messageHeaderData, 'reason.text'))) {
      cleanMessageHeader.reason = {
        coding: get(messageHeaderData, 'reason.coding', []).map(coding => ({
          system: get(coding, 'system', 'http://terminology.hl7.org/CodeSystem/message-reasons-encounter'),
          code: get(coding, 'code', ''),
          display: get(coding, 'display', '')
        })),
        text: get(messageHeaderData, 'reason.text', '')
      };
    }

    // Response
    if (messageHeaderData.response && (get(messageHeaderData, 'response.identifier') || get(messageHeaderData, 'response.code'))) {
      cleanMessageHeader.response = {
        identifier: get(messageHeaderData, 'response.identifier', ''),
        code: get(messageHeaderData, 'response.code', 'ok')
      };
    }

    // Focus
    if (messageHeaderData.focus && messageHeaderData.focus.length > 0) {
      cleanMessageHeader.focus = messageHeaderData.focus.filter(f => f.reference).map(focus => ({
        reference: get(focus, 'reference', ''),
        display: get(focus, 'display', '')
      }));
    }

    // Definition
    if (messageHeaderData.definition) {
      cleanMessageHeader.definition = messageHeaderData.definition;
    }

    // Notes
    if (get(messageHeaderData, 'note[0].text')) {
      cleanMessageHeader.note = [{
        text: get(messageHeaderData, 'note[0].text', ''),
        time: new Date(),
        authorString: this.userId
      }];
    }

    // Set _id based on environment variable or default behavior
    if (process.env.USE_MONGO_OBJECTID) {
      const { Mongo } = Package.mongo;
      const objectId = new Mongo.ObjectID();
      cleanMessageHeader._id = objectId.toHexString();
      console.log('[createMessageHeader] Using MongoDB ObjectID (as hex string):', cleanMessageHeader._id);
    } else {
      cleanMessageHeader._id = cleanMessageHeader.id;
      console.log('[createMessageHeader] Using Meteor string ID:', cleanMessageHeader._id);
    }

    try {
      const messageHeaderId = await MessageHeaders.insertAsync(cleanMessageHeader);
      console.log('[createMessageHeader] Message header created with ID:', messageHeaderId);
      return messageHeaderId;
    } catch (error) {
      console.error('[createMessageHeader] Error:', error);
      throw new Meteor.Error('insert-failed', 'Failed to create message header: ' + error.message);
    }
  },

  updateMessageHeader: async function(messageHeaderId, messageHeaderData) {
    console.log('[updateMessageHeader] Updating message header:', messageHeaderId);
    check(messageHeaderId, String);
    check(messageHeaderData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update message headers');
    }

    // Find existing message header
    const existingMessageHeader = await MessageHeaders.findOneAsync({ _id: messageHeaderId });
    if (!existingMessageHeader) {
      throw new Meteor.Error('not-found', 'Message header not found');
    }

    // Build update object
    const updateData = {
      meta: {
        versionId: String(parseInt(get(existingMessageHeader, 'meta.versionId', '1')) + 1),
        lastUpdated: new Date()
      }
    };

    // Event
    if (messageHeaderData.eventCoding) {
      updateData.eventCoding = {
        system: get(messageHeaderData, 'eventCoding.system', 'http://hl7.org/fhir/message-events'),
        code: get(messageHeaderData, 'eventCoding.code', ''),
        display: get(messageHeaderData, 'eventCoding.display', '')
      };
      updateData.eventUri = null; // Clear eventUri if eventCoding is provided
    } else if (messageHeaderData.eventUri) {
      updateData.eventUri = messageHeaderData.eventUri;
      updateData.eventCoding = null; // Clear eventCoding if eventUri is provided
    }

    // Source - Required
    updateData.source = {
      name: get(messageHeaderData, 'source.name', ''),
      software: get(messageHeaderData, 'source.software', ''),
      version: get(messageHeaderData, 'source.version', ''),
      endpoint: get(messageHeaderData, 'source.endpoint', '')
    };

    // Destination
    if (messageHeaderData.destination) {
      updateData.destination = messageHeaderData.destination.map(dest => ({
        name: get(dest, 'name', ''),
        target: {
          reference: get(dest, 'target.reference', ''),
          display: get(dest, 'target.display', '')
        },
        endpoint: get(dest, 'endpoint', ''),
        receiver: get(dest, 'receiver.reference') ? {
          reference: get(dest, 'receiver.reference', ''),
          display: get(dest, 'receiver.display', '')
        } : undefined
      }));
    }

    // Sender
    if (messageHeaderData.sender) {
      updateData.sender = {
        reference: get(messageHeaderData, 'sender.reference', ''),
        display: get(messageHeaderData, 'sender.display', '')
      };
    }

    // Responsible
    if (messageHeaderData.responsible) {
      updateData.responsible = {
        reference: get(messageHeaderData, 'responsible.reference', ''),
        display: get(messageHeaderData, 'responsible.display', '')
      };
    }

    // Reason
    if (messageHeaderData.reason) {
      updateData.reason = {
        coding: get(messageHeaderData, 'reason.coding', []).map(coding => ({
          system: get(coding, 'system', 'http://terminology.hl7.org/CodeSystem/message-reasons-encounter'),
          code: get(coding, 'code', ''),
          display: get(coding, 'display', '')
        })),
        text: get(messageHeaderData, 'reason.text', '')
      };
    }

    // Response
    if (messageHeaderData.response) {
      updateData.response = {
        identifier: get(messageHeaderData, 'response.identifier', ''),
        code: get(messageHeaderData, 'response.code', 'ok')
      };
    }

    // Focus
    if (messageHeaderData.focus) {
      updateData.focus = messageHeaderData.focus.filter(f => f.reference).map(focus => ({
        reference: get(focus, 'reference', ''),
        display: get(focus, 'display', '')
      }));
    }

    // Definition
    if (messageHeaderData.definition !== undefined) {
      updateData.definition = messageHeaderData.definition;
    }

    // Notes
    if (get(messageHeaderData, 'note[0].text')) {
      updateData.note = [{
        text: get(messageHeaderData, 'note[0].text', ''),
        time: new Date(),
        authorString: this.userId
      }];
    }

    try {
      const result = await MessageHeaders.updateAsync(
        { _id: messageHeaderId },
        { $set: updateData }
      );
      console.log('[updateMessageHeader] Update result:', result);
      return messageHeaderId;
    } catch (error) {
      console.error('[updateMessageHeader] Error:', error);
      throw new Meteor.Error('update-failed', 'Failed to update message header: ' + error.message);
    }
  },

  removeMessageHeader: async function(messageHeaderId) {
    console.log('[removeMessageHeader] Removing message header:', messageHeaderId);
    check(messageHeaderId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to remove message headers');
    }

    // Check if message header exists
    const messageHeader = await MessageHeaders.findOneAsync({ _id: messageHeaderId });
    if (!messageHeader) {
      throw new Meteor.Error('not-found', 'Message header not found');
    }

    try {
      const result = await MessageHeaders.removeAsync({ _id: messageHeaderId });
      console.log('[removeMessageHeader] Remove result:', result);
      return result;
    } catch (error) {
      console.error('[removeMessageHeader] Error:', error);
      throw new Meteor.Error('remove-failed', 'Failed to remove message header: ' + error.message);
    }
  }
});