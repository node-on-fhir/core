// /imports/methods/supplyDeliveries.js
//
// rpc migration (inline template): `if (!this.userId) throw` guards deleted in
// favor of requireAuth (the default), check() calls transpiled to params JSON
// Schemas, positional signatures mapped via positionalParams, this.userId ->
// context.userId, console.log -> context.log.
//
// BEHAVIOR CHANGE NOTE: supplyDeliveries.get (legacy getSupplyDelivery) had NO
// auth guard pre-migration (latent bug — it reads patient-linked supply data);
// requireAuth now applies (default true).

import { Meteor } from 'meteor/meteor';
import ServerMethods from '/imports/lib/ServerMethods.js';
import { Mongo } from 'meteor/mongo';
import { get, set } from 'lodash';

import { SupplyDeliveries } from '/imports/lib/schemas/SimpleSchemas/SupplyDeliveries';
import { Random } from 'meteor/random';

ServerMethods.define('supplyDeliveries.create', {
  description: 'Create a FHIR SupplyDelivery record for a patient',
  aliases: ['createSupplyDelivery'],
  phi: true,
  schemaObject: { type: 'object' }
}, async function(params, context) {
    const supplyDeliveryData = params;
    context.log.debug('supplyDeliveries.create called', { supplyDeliveryData });

    // Clean and prepare the supply delivery data
    let cleanSupplyDelivery = {
      resourceType: 'SupplyDelivery',
      id: Random.id(),
      status: get(supplyDeliveryData, 'status', 'in-progress'),
      patient: get(supplyDeliveryData, 'patient'),
      occurrenceDateTime: get(supplyDeliveryData, 'occurrenceDateTime') || new Date()
    };

    // Set the _id for MongoDB (use MongoDB ObjectID if USE_MONGO_OBJECTID is set)
    if (process.env.USE_MONGO_OBJECTID) {
      const objectId = new Mongo.ObjectID();
      cleanSupplyDelivery._id = objectId.toHexString();
    } else {
      cleanSupplyDelivery._id = cleanSupplyDelivery.id;
    }

    // Type - ensure proper CodeableConcept format
    if (supplyDeliveryData.type) {
      if (typeof supplyDeliveryData.type === 'string') {
        cleanSupplyDelivery.type = {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/supply-kind',
            code: supplyDeliveryData.type,
            display: supplyDeliveryData.type
          }],
          text: supplyDeliveryData.type
        };
      } else {
        cleanSupplyDelivery.type = supplyDeliveryData.type;
      }
    }

    // Supplied item
    if (supplyDeliveryData.suppliedItem) {
      cleanSupplyDelivery.suppliedItem = {};

      // Handle quantity
      if (supplyDeliveryData.suppliedItem.quantity) {
        cleanSupplyDelivery.suppliedItem.quantity = supplyDeliveryData.suppliedItem.quantity;
      }

      // Handle item as CodeableConcept or Reference
      if (supplyDeliveryData.suppliedItem.itemCodeableConcept) {
        cleanSupplyDelivery.suppliedItem.itemCodeableConcept = supplyDeliveryData.suppliedItem.itemCodeableConcept;
      } else if (supplyDeliveryData.suppliedItem.itemReference) {
        cleanSupplyDelivery.suppliedItem.itemReference = supplyDeliveryData.suppliedItem.itemReference;
      }
    }

    // Optional fields
    if (supplyDeliveryData.identifier) {
      cleanSupplyDelivery.identifier = supplyDeliveryData.identifier;
    }

    if (supplyDeliveryData.basedOn) {
      cleanSupplyDelivery.basedOn = supplyDeliveryData.basedOn;
    }

    if (supplyDeliveryData.partOf) {
      cleanSupplyDelivery.partOf = supplyDeliveryData.partOf;
    }

    if (supplyDeliveryData.supplier) {
      cleanSupplyDelivery.supplier = supplyDeliveryData.supplier;
    }

    if (supplyDeliveryData.destination) {
      cleanSupplyDelivery.destination = supplyDeliveryData.destination;
    }

    if (supplyDeliveryData.receiver) {
      cleanSupplyDelivery.receiver = supplyDeliveryData.receiver;
    } else {
      // Default receiver to current user if not provided
      const user = await Meteor.users.findOneAsync(context.userId);
      if (user) {
        const receiverName = get(user, 'profile.name.text', '') ||
                            `${get(user, 'profile.name.given[0]', '')} ${get(user, 'profile.name.family', '')}`.trim() ||
                            get(user, 'username', '');
        cleanSupplyDelivery.receiver = [{
          reference: `Practitioner/${context.userId}`,
          display: receiverName
        }];
      }
    }

    // Handle occurrence timing alternatives
    if (supplyDeliveryData.occurrencePeriod) {
      cleanSupplyDelivery.occurrencePeriod = supplyDeliveryData.occurrencePeriod;
      delete cleanSupplyDelivery.occurrenceDateTime;
    } else if (supplyDeliveryData.occurrenceTiming) {
      cleanSupplyDelivery.occurrenceTiming = supplyDeliveryData.occurrenceTiming;
      delete cleanSupplyDelivery.occurrenceDateTime;
    }

    // Schema validation is handled by the collection's attachSchema

    // Insert the supply delivery
    try {
      const supplyDeliveryId = await SupplyDeliveries.insertAsync(cleanSupplyDelivery);
      context.log.info('SupplyDelivery created', { supplyDeliveryId });
      return supplyDeliveryId;
    } catch (error) {
      context.log.error('Error inserting supply delivery', { error: error.message });
      throw new Meteor.Error('insert-failed', 'Failed to create supply delivery', error.message);
    }
});

ServerMethods.define('supplyDeliveries.update', {
  description: 'Update an existing FHIR SupplyDelivery record',
  aliases: ['updateSupplyDelivery'],
  phi: true,
  positionalParams: ['supplyDeliveryId', 'supplyDeliveryData'],
  schemaObject: {
    type: 'object',
    properties: {
      supplyDeliveryId: { type: 'string' },
      supplyDeliveryData: { type: 'object' }
    },
    required: ['supplyDeliveryId', 'supplyDeliveryData']
  }
}, async function(params, context) {
    const supplyDeliveryId = get(params, 'supplyDeliveryId');
    const supplyDeliveryData = get(params, 'supplyDeliveryData');
    context.log.debug('supplyDeliveries.update called', { supplyDeliveryId, supplyDeliveryData });

    // Remove the _id field if present to avoid update errors
    delete supplyDeliveryData._id;

    // Ensure type is proper CodeableConcept if it's a string
    if (supplyDeliveryData.type && typeof supplyDeliveryData.type === 'string') {
      supplyDeliveryData.type = {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/supply-kind',
          code: supplyDeliveryData.type,
          display: supplyDeliveryData.type
        }],
        text: supplyDeliveryData.type
      };
    }

    // Convert dates to proper format
    if (supplyDeliveryData.occurrenceDateTime && typeof supplyDeliveryData.occurrenceDateTime === 'string') {
      supplyDeliveryData.occurrenceDateTime = new Date(supplyDeliveryData.occurrenceDateTime);
    }

    // Schema validation is handled by the collection's attachSchema

    // Update the supply delivery
    try {
      const result = await SupplyDeliveries.updateAsync(
        { _id: supplyDeliveryId },
        { $set: supplyDeliveryData }
      );

      if (result === 0) {
        throw new Meteor.Error('not-found', 'SupplyDelivery not found');
      }

      context.log.info('SupplyDelivery updated successfully', { supplyDeliveryId });
      return result;
    } catch (error) {
      context.log.error('Error updating supply delivery', { error: error.message });
      throw new Meteor.Error('update-failed', 'Failed to update supply delivery', error.message);
    }
});

ServerMethods.define('supplyDeliveries.remove', {
  description: 'Delete a FHIR SupplyDelivery record',
  aliases: ['removeSupplyDelivery'],
  phi: true,
  positionalParams: ['supplyDeliveryId'],
  schemaObject: {
    type: 'object',
    properties: { supplyDeliveryId: { type: 'string' } },
    required: ['supplyDeliveryId']
  }
}, async function(params, context) {
    const supplyDeliveryId = get(params, 'supplyDeliveryId');
    context.log.debug('supplyDeliveries.remove called', { supplyDeliveryId });

    try {
      const result = await SupplyDeliveries.removeAsync({ _id: supplyDeliveryId });

      if (result === 0) {
        throw new Meteor.Error('not-found', 'SupplyDelivery not found');
      }

      context.log.info('SupplyDelivery removed successfully', { supplyDeliveryId });
      return result;
    } catch (error) {
      context.log.error('Error removing supply delivery', { error: error.message });
      throw new Meteor.Error('remove-failed', 'Failed to remove supply delivery', error.message);
    }
});

ServerMethods.define('supplyDeliveries.get', {
  description: 'Fetch a single FHIR SupplyDelivery record by id',
  aliases: ['getSupplyDelivery'],
  phi: true,
  // Pre-migration this read method had NO auth guard (latent bug);
  // requireAuth now applies (default true).
  positionalParams: ['supplyDeliveryId'],
  schemaObject: {
    type: 'object',
    properties: { supplyDeliveryId: { type: 'string' } },
    required: ['supplyDeliveryId']
  }
}, async function(params, context) {
    const supplyDeliveryId = get(params, 'supplyDeliveryId');
    context.log.debug('supplyDeliveries.get called', { supplyDeliveryId });

    try {
      const supplyDelivery = await SupplyDeliveries.findOneAsync({ _id: supplyDeliveryId });

      if (!supplyDelivery) {
        throw new Meteor.Error('not-found', 'SupplyDelivery not found');
      }

      return supplyDelivery;
    } catch (error) {
      context.log.error('Error getting supply delivery', { error: error.message });
      throw new Meteor.Error('get-failed', 'Failed to get supply delivery', error.message);
    }
});
