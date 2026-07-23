// imports/api/supplyRequests/methods.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';

import { SupplyRequests } from '/imports/lib/schemas/SimpleSchemas/SupplyRequests';

Meteor.ServerMethods.define('supplyRequests.insert', {
  description: 'Create a new FHIR SupplyRequest with generated ids and whitelisted optional fields',
  aliases: ['createSupplyRequest'],
  phi: true,
  schemaObject: { type: 'object' }   // the SupplyRequest resource payload itself
}, async function(params, context) {
  const supplyRequestData = params;

  context.log.debug('supplyRequests.insert creating new supply request');

  const cleanSupplyRequest = {
    resourceType: 'SupplyRequest',
    status: get(supplyRequestData, 'status', 'draft'),
    priority: get(supplyRequestData, 'priority', 'routine'),
    authoredOn: get(supplyRequestData, 'authoredOn', new Date().toISOString()),
    quantity: get(supplyRequestData, 'quantity', {})
  };

  // Generate IDs
  cleanSupplyRequest.id = Random.id();
  cleanSupplyRequest._id = cleanSupplyRequest.id;

  // Optional fields
  if (get(supplyRequestData, 'identifier')) {
    cleanSupplyRequest.identifier = supplyRequestData.identifier;
  }

  if (get(supplyRequestData, 'category')) {
    cleanSupplyRequest.category = supplyRequestData.category;
  }

  if (get(supplyRequestData, 'itemCodeableConcept')) {
    cleanSupplyRequest.itemCodeableConcept = supplyRequestData.itemCodeableConcept;
  }

  if (get(supplyRequestData, 'itemReference')) {
    cleanSupplyRequest.itemReference = supplyRequestData.itemReference;
  }

  if (get(supplyRequestData, 'parameter')) {
    cleanSupplyRequest.parameter = supplyRequestData.parameter;
  }

  if (get(supplyRequestData, 'occurrenceDateTime')) {
    cleanSupplyRequest.occurrenceDateTime = supplyRequestData.occurrenceDateTime;
  }

  if (get(supplyRequestData, 'occurrencePeriod')) {
    cleanSupplyRequest.occurrencePeriod = supplyRequestData.occurrencePeriod;
  }

  if (get(supplyRequestData, 'requester')) {
    cleanSupplyRequest.requester = supplyRequestData.requester;
  }

  if (get(supplyRequestData, 'supplier')) {
    cleanSupplyRequest.supplier = supplyRequestData.supplier;
  }

  if (get(supplyRequestData, 'reasonCode')) {
    cleanSupplyRequest.reasonCode = supplyRequestData.reasonCode;
  }

  if (get(supplyRequestData, 'reasonReference')) {
    cleanSupplyRequest.reasonReference = supplyRequestData.reasonReference;
  }

  if (get(supplyRequestData, 'deliverFrom')) {
    cleanSupplyRequest.deliverFrom = supplyRequestData.deliverFrom;
  }

  if (get(supplyRequestData, 'deliverTo')) {
    cleanSupplyRequest.deliverTo = supplyRequestData.deliverTo;
  }

  context.log.info('supplyRequests.insert inserting', { _id: cleanSupplyRequest._id, userId: context.userId });
  const result = await SupplyRequests.insertAsync(cleanSupplyRequest);
  return result;
});

Meteor.ServerMethods.define('supplyRequests.update', {
  description: 'Update whitelisted fields of an existing FHIR SupplyRequest',
  aliases: ['updateSupplyRequest'],
  phi: true,
  positionalParams: ['supplyRequestId', 'supplyRequestData'],
  schemaObject: {
    type: 'object',
    properties: {
      supplyRequestId: { type: 'string' },
      supplyRequestData: { type: 'object' }
    },
    required: ['supplyRequestId', 'supplyRequestData']
  }
}, async function(params, context) {
  const supplyRequestId = params.supplyRequestId;
  const supplyRequestData = params.supplyRequestData;

  context.log.debug('supplyRequests.update updating', { supplyRequestId: supplyRequestId });

  const existing = await SupplyRequests.findOneAsync({ _id: supplyRequestId });
  if (!existing) {
    throw new Meteor.Error('not-found', 'Supply request not found.');
  }

  const updates = {};

  // Update allowed fields
  if (supplyRequestData.status !== undefined) {
    updates.status = supplyRequestData.status;
  }
  if (supplyRequestData.priority !== undefined) {
    updates.priority = supplyRequestData.priority;
  }
  if (supplyRequestData.category !== undefined) {
    updates.category = supplyRequestData.category;
  }
  if (supplyRequestData.itemCodeableConcept !== undefined) {
    updates.itemCodeableConcept = supplyRequestData.itemCodeableConcept;
  }
  if (supplyRequestData.itemReference !== undefined) {
    updates.itemReference = supplyRequestData.itemReference;
  }
  if (supplyRequestData.quantity !== undefined) {
    updates.quantity = supplyRequestData.quantity;
  }
  if (supplyRequestData.occurrenceDateTime !== undefined) {
    updates.occurrenceDateTime = supplyRequestData.occurrenceDateTime;
  }
  if (supplyRequestData.occurrencePeriod !== undefined) {
    updates.occurrencePeriod = supplyRequestData.occurrencePeriod;
  }
  if (supplyRequestData.requester !== undefined) {
    updates.requester = supplyRequestData.requester;
  }
  if (supplyRequestData.supplier !== undefined) {
    updates.supplier = supplyRequestData.supplier;
  }
  if (supplyRequestData.reasonCode !== undefined) {
    updates.reasonCode = supplyRequestData.reasonCode;
  }
  if (supplyRequestData.deliverFrom !== undefined) {
    updates.deliverFrom = supplyRequestData.deliverFrom;
  }
  if (supplyRequestData.deliverTo !== undefined) {
    updates.deliverTo = supplyRequestData.deliverTo;
  }

  const result = await SupplyRequests.updateAsync(
    { _id: supplyRequestId },
    { $set: updates }
  );

  context.log.info('supplyRequests.update updated', { supplyRequestId: supplyRequestId, userId: context.userId });
  return result;
});

Meteor.ServerMethods.define('supplyRequests.remove', {
  description: 'Delete a FHIR SupplyRequest by its MongoDB _id',
  aliases: ['removeSupplyRequest'],
  phi: true,
  positionalParams: ['supplyRequestId'],
  schemaObject: {
    type: 'object',
    properties: { supplyRequestId: { type: 'string' } },
    required: ['supplyRequestId']
  }
}, async function(params, context) {
  const supplyRequestId = params.supplyRequestId;

  context.log.info('supplyRequests.remove removing', { supplyRequestId: supplyRequestId, userId: context.userId });
  const result = await SupplyRequests.removeAsync({ _id: supplyRequestId });
  return result;
});

Meteor.ServerMethods.define('supplyRequests.findOne', {
  description: 'Fetch a single FHIR SupplyRequest by its MongoDB _id',
  // Pre-migration this method had NO auth guard. requireAuth now applies
  // (default true) — behavior change, noted in the migration report.
  phi: true,
  positionalParams: ['supplyRequestId'],
  schemaObject: {
    type: 'object',
    properties: { supplyRequestId: { type: 'string' } },
    required: ['supplyRequestId']
  }
}, async function(params) {
  const supplyRequest = await SupplyRequests.findOneAsync({ _id: params.supplyRequestId });
  return supplyRequest;
});
