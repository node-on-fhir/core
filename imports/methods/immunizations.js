// /imports/methods/immunizations.js
//
// rpc migration (inline template): `if (!this.userId) throw` guards deleted in
// favor of requireAuth (the default), check() calls transpiled to params JSON
// Schemas, positional signatures mapped via positionalParams, this.userId ->
// context.userId, console.log -> context.log.
//
// BEHAVIOR CHANGE NOTE: immunizations.get (legacy getImmunization) had NO auth
// guard pre-migration (latent bug — it reads patient immunization data);
// requireAuth now applies (default true).

import { Meteor } from 'meteor/meteor';
import ServerMethods from '/imports/lib/ServerMethods.js';
import { Mongo } from 'meteor/mongo';
import { get, set } from 'lodash';

import { Immunizations } from '/imports/lib/schemas/SimpleSchemas/Immunizations';
import { Random } from 'meteor/random';

ServerMethods.define('immunizations.create', {
  description: 'Create a FHIR Immunization record for a patient',
  aliases: ['createImmunization'],
  phi: true,
  schemaObject: { type: 'object' }
}, async function(params, context) {
    const immunizationData = params;
    context.log.debug('immunizations.create called', { immunizationData });

    // Clean and prepare the immunization data
    let cleanImmunization = {
      resourceType: 'Immunization',
      id: Random.id(),
      status: get(immunizationData, 'status', 'completed'),
      patient: get(immunizationData, 'patient'),
      occurrenceDateTime: get(immunizationData, 'occurrenceDateTime') || new Date(),
      primarySource: get(immunizationData, 'primarySource', true)
    };

    // Set the _id for MongoDB (use MongoDB ObjectID if USE_MONGO_OBJECTID is set)
    if (process.env.USE_MONGO_OBJECTID) {
      const objectId = new Mongo.ObjectID();
      cleanImmunization._id = objectId.toHexString();
    } else {
      cleanImmunization._id = cleanImmunization.id;
    }

    // Vaccine code - ensure proper CodeableConcept format
    if (immunizationData.vaccineCode) {
      if (typeof immunizationData.vaccineCode === 'string') {
        cleanImmunization.vaccineCode = {
          coding: [{
            system: 'http://hl7.org/fhir/sid/cvx',
            code: immunizationData.vaccineCode,
            display: immunizationData.vaccineCode
          }],
          text: immunizationData.vaccineCode
        };
      } else {
        cleanImmunization.vaccineCode = immunizationData.vaccineCode;
      }
    }

    // Optional fields
    if (immunizationData.lotNumber) {
      cleanImmunization.lotNumber = immunizationData.lotNumber;
    }

    if (immunizationData.expirationDate) {
      cleanImmunization.expirationDate = new Date(immunizationData.expirationDate);
    }

    if (immunizationData.manufacturer) {
      cleanImmunization.manufacturer = immunizationData.manufacturer;
    }

    if (immunizationData.site) {
      cleanImmunization.site = immunizationData.site;
    }

    if (immunizationData.route) {
      cleanImmunization.route = immunizationData.route;
    }

    if (immunizationData.doseQuantity) {
      cleanImmunization.doseQuantity = immunizationData.doseQuantity;
    }

    if (immunizationData.performer) {
      cleanImmunization.performer = immunizationData.performer;
    } else {
      // Default performer to current user if not provided
      const user = await Meteor.users.findOneAsync(context.userId);
      if (user) {
        const performerName = get(user, 'profile.name.text', '') ||
                            `${get(user, 'profile.name.given[0]', '')} ${get(user, 'profile.name.family', '')}`.trim() ||
                            get(user, 'username', '');
        cleanImmunization.performer = [{
          actor: {
            reference: `Practitioner/${context.userId}`,
            display: performerName
          }
        }];
      }
    }

    if (immunizationData.note) {
      cleanImmunization.note = immunizationData.note;
    }

    // Schema validation is handled by the collection's attachSchema

    // Insert the immunization
    try {
      const immunizationId = await Immunizations.insertAsync(cleanImmunization);
      context.log.info('Immunization created', { immunizationId });
      return immunizationId;
    } catch (error) {
      context.log.error('Error inserting immunization', { error: error.message });
      throw new Meteor.Error('insert-failed', 'Failed to create immunization', error.message);
    }
});

ServerMethods.define('immunizations.update', {
  description: 'Update an existing FHIR Immunization record',
  aliases: ['updateImmunization'],
  phi: true,
  positionalParams: ['immunizationId', 'immunizationData'],
  schemaObject: {
    type: 'object',
    properties: {
      immunizationId: { type: 'string' },
      immunizationData: { type: 'object' }
    },
    required: ['immunizationId', 'immunizationData']
  }
}, async function(params, context) {
    const immunizationId = get(params, 'immunizationId');
    const immunizationData = get(params, 'immunizationData');
    context.log.debug('immunizations.update called', { immunizationId, immunizationData });

    // Remove the _id field if present to avoid update errors
    delete immunizationData._id;

    // Ensure vaccine code is proper CodeableConcept if it's a string
    if (immunizationData.vaccineCode && typeof immunizationData.vaccineCode === 'string') {
      immunizationData.vaccineCode = {
        coding: [{
          system: 'http://hl7.org/fhir/sid/cvx',
          code: immunizationData.vaccineCode,
          display: immunizationData.vaccineCode
        }],
        text: immunizationData.vaccineCode
      };
    }

    // Convert dates to proper format
    if (immunizationData.occurrenceDateTime && typeof immunizationData.occurrenceDateTime === 'string') {
      immunizationData.occurrenceDateTime = new Date(immunizationData.occurrenceDateTime);
    }

    if (immunizationData.expirationDate && typeof immunizationData.expirationDate === 'string') {
      immunizationData.expirationDate = new Date(immunizationData.expirationDate);
    }

    // Schema validation is handled by the collection's attachSchema

    // Update the immunization
    try {
      const result = await Immunizations.updateAsync(
        { _id: immunizationId },
        { $set: immunizationData }
      );

      if (result === 0) {
        throw new Meteor.Error('not-found', 'Immunization not found');
      }

      context.log.info('Immunization updated successfully', { immunizationId });
      return result;
    } catch (error) {
      context.log.error('Error updating immunization', { error: error.message });
      throw new Meteor.Error('update-failed', 'Failed to update immunization', error.message);
    }
});

ServerMethods.define('immunizations.remove', {
  description: 'Delete a FHIR Immunization record',
  aliases: ['removeImmunization'],
  phi: true,
  positionalParams: ['immunizationId'],
  schemaObject: {
    type: 'object',
    properties: { immunizationId: { type: 'string' } },
    required: ['immunizationId']
  }
}, async function(params, context) {
    const immunizationId = get(params, 'immunizationId');
    context.log.debug('immunizations.remove called', { immunizationId });

    try {
      const result = await Immunizations.removeAsync({ _id: immunizationId });

      if (result === 0) {
        throw new Meteor.Error('not-found', 'Immunization not found');
      }

      context.log.info('Immunization removed successfully', { immunizationId });
      return result;
    } catch (error) {
      context.log.error('Error removing immunization', { error: error.message });
      throw new Meteor.Error('remove-failed', 'Failed to remove immunization', error.message);
    }
});

ServerMethods.define('immunizations.get', {
  description: 'Fetch a single FHIR Immunization record by id',
  aliases: ['getImmunization'],
  phi: true,
  // Pre-migration this read method had NO auth guard (latent bug);
  // requireAuth now applies (default true).
  positionalParams: ['immunizationId'],
  schemaObject: {
    type: 'object',
    properties: { immunizationId: { type: 'string' } },
    required: ['immunizationId']
  }
}, async function(params, context) {
    const immunizationId = get(params, 'immunizationId');
    context.log.debug('immunizations.get called', { immunizationId });

    try {
      const immunization = await Immunizations.findOneAsync({ _id: immunizationId });

      if (!immunization) {
        throw new Meteor.Error('not-found', 'Immunization not found');
      }

      return immunization;
    } catch (error) {
      context.log.error('Error getting immunization', { error: error.message });
      throw new Meteor.Error('get-failed', 'Failed to get immunization', error.message);
    }
});
