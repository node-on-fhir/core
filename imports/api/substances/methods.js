// /imports/api/substances/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/Substances';

// Get the correct Substances collection reference
function getSubstances() {
  if (Meteor.isServer) {
    // On server, use the global collection set up in server/main.js
    return Meteor.Collections?.Substances || global.Substances;
  } else {
    // On client, use from Meteor.Collections if available
    return Meteor.Collections?.Substances;
  }
}

Meteor.ServerMethods.define('substances.create', {
  description: 'Create a new FHIR Substance resource with version metadata',
  schemaObject: { type: 'object' }   // the Substance resource payload itself
}, async function(params, context) {
  const substanceData = params;

  // Add metadata
  const substance = {
    ...substanceData,
    resourceType: 'Substance',
    meta: {
      lastUpdated: new Date(),
      versionId: '1'
    }
  };

  // Set _id based on environment variable for consistent sorting with Synthea data
  // This ensures new substances sort properly with existing ObjectID-based records
  if (process.env.USE_MONGO_OBJECTID) {
    const { Mongo } = Package.mongo;
    const objectId = new Mongo.ObjectID();
    // Convert to hex string for Meteor compatibility
    substance._id = objectId.toHexString();
    context.log.debug('substances.create using MongoDB ObjectID (as hex string)', { _id: substance._id });
  }
  // Otherwise Meteor will auto-generate a random string ID

  // Insert and return the new substance
  const Substances = getSubstances();
  const substanceId = await Substances.insertAsync(substance);

  // Log for HIPAA compliance
  context.log.info('Substance created', {
    userId: context.userId,
    substanceId: substanceId,
    timestamp: new Date()
  });

  return substanceId;
});

Meteor.ServerMethods.define('substances.update', {
  description: 'Update an existing FHIR Substance resource and increment its version',
  positionalParams: ['substanceId', 'substanceData'],
  schemaObject: {
    type: 'object',
    properties: {
      substanceId: { type: 'string' },
      substanceData: { type: 'object' }
    },
    required: ['substanceId', 'substanceData']
  }
}, async function(params, context) {
  const substanceId = params.substanceId;
  const substanceData = params.substanceData;

  const Substances = getSubstances();

  // Check if substance exists
  const existingSubstance = await Substances.findOneAsync({ _id: substanceId });
  if (!existingSubstance) {
    throw new Meteor.Error('not-found', 'Substance not found');
  }

  // Update metadata
  const updatedSubstance = {
    ...substanceData,
    _id: substanceId,
    resourceType: 'Substance',
    meta: {
      ...get(substanceData, 'meta', {}),
      lastUpdated: new Date(),
      versionId: String(parseInt(get(existingSubstance, 'meta.versionId', '0')) + 1)
    }
  };

  // Update the substance
  const result = await Substances.updateAsync(
    { _id: substanceId },
    { $set: updatedSubstance }
  );

  // Log for HIPAA compliance
  context.log.info('Substance updated', {
    userId: context.userId,
    substanceId: substanceId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('substances.get', {
  description: 'Fetch a single FHIR Substance resource by its MongoDB _id',
  positionalParams: ['substanceId'],
  schemaObject: {
    type: 'object',
    properties: { substanceId: { type: 'string' } },
    required: ['substanceId']
  }
}, async function(params, context) {
  const substanceId = params.substanceId;

  const Substances = getSubstances();
  const substance = await Substances.findOneAsync({ _id: substanceId });

  if (!substance) {
    throw new Meteor.Error('not-found', 'Substance not found');
  }

  // Log access for HIPAA compliance
  context.log.info('Substance accessed', {
    userId: context.userId,
    substanceId: substanceId,
    timestamp: new Date()
  });

  return substance;
});

Meteor.ServerMethods.define('substances.remove', {
  description: 'Delete a FHIR Substance resource by its MongoDB _id',
  positionalParams: ['substanceId'],
  schemaObject: {
    type: 'object',
    properties: { substanceId: { type: 'string' } },
    required: ['substanceId']
  }
}, async function(params, context) {
  const substanceId = params.substanceId;

  const Substances = getSubstances();

  // Check if substance exists
  const existingSubstance = await Substances.findOneAsync({ _id: substanceId });
  if (!existingSubstance) {
    throw new Meteor.Error('not-found', 'Substance not found');
  }

  // Remove the substance
  const result = await Substances.removeAsync({ _id: substanceId });

  // Log for HIPAA compliance
  context.log.info('Substance deleted', {
    userId: context.userId,
    substanceId: substanceId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('substances.search', {
  description: 'Search FHIR Substance resources by name, code, or status with sort/limit options',
  schemaObject: { type: 'object' }   // searchOptions: { name?, code?, status?, query?, options? }
}, async function(params, context) {
  const searchOptions = params || {};

  const Substances = getSubstances();
  const { query = {}, options = {} } = searchOptions;

  // Add any necessary query transformations here
  // For example, searching by substance code/name
  if (searchOptions.name) {
    query['code.text'] = { $regex: searchOptions.name, $options: 'i' };
  }

  if (searchOptions.code) {
    query['code.coding.code'] = searchOptions.code;
  }

  if (searchOptions.status) {
    query['status'] = searchOptions.status;
  }

  // Set default options
  const findOptions = {
    limit: options.limit || 20,
    sort: options.sort || { 'meta.lastUpdated': -1 },
    ...options
  };

  // (rpc migration) fixed latent bug: Substances.findAsync() is not a Meteor
  // collection API — use find().fetchAsync().
  const substances = await Substances.find(query, findOptions).fetchAsync();

  // Log search for HIPAA compliance
  context.log.info('Substances searched', {
    userId: context.userId,
    query: query,
    resultCount: substances.length,
    timestamp: new Date()
  });

  return substances;
});
