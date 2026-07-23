// /imports/api/messageHeaders/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { Random } from 'meteor/random';

import { MessageHeaders } from '/imports/lib/schemas/SimpleSchemas/MessageHeaders';

Meteor.ServerMethods.define('messageHeaders.create', {
  description: 'Create a new MessageHeader routing record',
  aliases: ['createMessageHeader'],
  phi: false,
  schemaObject: { type: 'object' }   // params IS the MessageHeader payload
}, async function(params, context){
  const messageHeaderData = params;
  context.log.info('Creating new message header');

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
      authorString: context.userId
    }];
  }

  // Set _id based on environment variable or default behavior
  if (process.env.USE_MONGO_OBJECTID) {
    const { Mongo } = Package.mongo;
    const objectId = new Mongo.ObjectID();
    cleanMessageHeader._id = objectId.toHexString();
    context.log.info('Using MongoDB ObjectID (as hex string)', { _id: cleanMessageHeader._id });
  } else {
    cleanMessageHeader._id = cleanMessageHeader.id;
    context.log.info('Using Meteor string ID', { _id: cleanMessageHeader._id });
  }

  try {
    const messageHeaderId = await MessageHeaders.insertAsync(cleanMessageHeader);
    context.log.info('Message header created', { _id: messageHeaderId });
    return messageHeaderId;
  } catch (error) {
    context.log.error('Error creating message header', { message: error.message });
    throw new Meteor.Error('insert-failed', 'Failed to create message header: ' + error.message);
  }
});

Meteor.ServerMethods.define('messageHeaders.update', {
  description: 'Update an existing MessageHeader routing record',
  aliases: ['updateMessageHeader'],
  phi: false,
  positionalParams: ['messageHeaderId', 'messageHeaderData'],
  schemaObject: {
    type: 'object',
    properties: {
      messageHeaderId: { type: 'string' },
      messageHeaderData: { type: 'object' }
    },
    required: ['messageHeaderId', 'messageHeaderData']
  }
}, async function(params, context){
  const messageHeaderId = params.messageHeaderId;
  const messageHeaderData = params.messageHeaderData;
  context.log.info('Updating message header', { _id: messageHeaderId });

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
      authorString: context.userId
    }];
  }

  try {
    const result = await MessageHeaders.updateAsync(
      { _id: messageHeaderId },
      { $set: updateData }
    );
    context.log.info('Update result', { result: result });
    return messageHeaderId;
  } catch (error) {
    context.log.error('Error updating message header', { message: error.message });
    throw new Meteor.Error('update-failed', 'Failed to update message header: ' + error.message);
  }
});

Meteor.ServerMethods.define('messageHeaders.remove', {
  description: 'Delete a MessageHeader routing record by its MongoDB _id',
  aliases: ['removeMessageHeader'],
  phi: false,
  positionalParams: ['messageHeaderId'],
  schemaObject: {
    type: 'object',
    properties: { messageHeaderId: { type: 'string' } },
    required: ['messageHeaderId']
  }
}, async function(params, context){
  const messageHeaderId = params.messageHeaderId;
  context.log.info('Removing message header', { _id: messageHeaderId });

  // Check if message header exists
  const messageHeader = await MessageHeaders.findOneAsync({ _id: messageHeaderId });
  if (!messageHeader) {
    throw new Meteor.Error('not-found', 'Message header not found');
  }

  try {
    const result = await MessageHeaders.removeAsync({ _id: messageHeaderId });
    context.log.info('Remove result', { result: result });
    return result;
  } catch (error) {
    context.log.error('Error removing message header', { message: error.message });
    throw new Meteor.Error('remove-failed', 'Failed to remove message header: ' + error.message);
  }
});
