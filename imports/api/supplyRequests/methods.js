// imports/api/supplyRequests/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { get, set } from 'lodash';

import { SupplyRequests } from '/imports/lib/schemas/SimpleSchemas/SupplyRequests';

Meteor.methods({
  /**
   * Create a new SupplyRequest
   * @param {Object} supplyRequestData - The supply request data
   * @returns {String} - The _id of the created supply request
   */
  'supplyRequests.insert': async function(supplyRequestData) {
    check(supplyRequestData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create a supply request.');
    }

    console.log('[supplyRequests.insert] Creating new supply request');

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

    console.log('[supplyRequests.insert] Inserting:', cleanSupplyRequest._id);
    const result = await SupplyRequests.insertAsync(cleanSupplyRequest);
    return result;
  },

  /**
   * Update an existing SupplyRequest
   * @param {String} supplyRequestId - The _id of the supply request to update
   * @param {Object} supplyRequestData - The updated supply request data
   * @returns {Number} - The number of documents updated
   */
  'supplyRequests.update': async function(supplyRequestId, supplyRequestData) {
    check(supplyRequestId, String);
    check(supplyRequestData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update a supply request.');
    }

    console.log('[supplyRequests.update] Updating supply request:', supplyRequestId);

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

    console.log('[supplyRequests.update] Updated:', supplyRequestId);
    return result;
  },

  /**
   * Remove a SupplyRequest
   * @param {String} supplyRequestId - The _id of the supply request to remove
   * @returns {Number} - The number of documents removed
   */
  'supplyRequests.remove': async function(supplyRequestId) {
    check(supplyRequestId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to remove a supply request.');
    }

    console.log('[supplyRequests.remove] Removing supply request:', supplyRequestId);
    const result = await SupplyRequests.removeAsync({ _id: supplyRequestId });
    return result;
  },

  /**
   * Find a single SupplyRequest by _id
   * @param {String} supplyRequestId - The _id of the supply request to find
   * @returns {Object} - The supply request document
   */
  'supplyRequests.findOne': async function(supplyRequestId) {
    check(supplyRequestId, String);

    const supplyRequest = await SupplyRequests.findOneAsync({ _id: supplyRequestId });
    return supplyRequest;
  },

  // Legacy method names for compatibility
  'createSupplyRequest': async function(supplyRequestData) {
    return Meteor.call('supplyRequests.insert', supplyRequestData);
  },

  'updateSupplyRequest': async function(supplyRequestId, supplyRequestData) {
    return Meteor.call('supplyRequests.update', supplyRequestId, supplyRequestData);
  },

  'removeSupplyRequest': async function(supplyRequestId) {
    return Meteor.call('supplyRequests.remove', supplyRequestId);
  }
});
