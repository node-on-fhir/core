// /imports/api/locations/methods.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';

import { Locations } from '/imports/lib/schemas/SimpleSchemas/Locations';

// Location is facility/administrative directory data (not patient-scoped) —
// no phi flag on these methods.

Meteor.ServerMethods.define('locations.create', {
  description: 'Create a FHIR Location resource',
  schemaObject: { type: 'object' }
}, async function(params, context){
  const locationData = params;

  context.log.debug('locations.create called', { userId: context.userId, data: locationData });

  // Generate FHIR id if not provided
  const fhirId = locationData.id || Random.id();

  // Add metadata
  const location = {
    ...locationData,
    id: fhirId,
    resourceType: 'Location',
    meta: {
      lastUpdated: new Date(),
      versionId: '1'
    }
  };

  // Insert and return the new location
  const locationId = await Locations._collection.insertAsync(location);
  context.log.info('Successfully inserted location', { _id: locationId });

  // Log for HIPAA compliance
  context.log.info('Location created', {
    userId: context.userId,
    locationId: locationId,
    fhirId: fhirId,
    timestamp: new Date()
  });

  return locationId;
});

Meteor.ServerMethods.define('locations.update', {
  description: 'Update an existing FHIR Location resource',
  positionalParams: ['locationId', 'locationData'],
  schemaObject: {
    type: 'object',
    properties: {
      locationId: { type: 'string' },
      locationData: { type: 'object' }
    },
    required: ['locationId', 'locationData']
  }
}, async function(params, context){
  const locationId = params.locationId;
  const locationData = params.locationData;

  // Check if location exists - try _id first, then id
  let existingLocation = await Locations.findOneAsync({ _id: locationId });
  if (!existingLocation) {
    existingLocation = await Locations.findOneAsync({ id: locationId });
  }
  if (!existingLocation) {
    throw new Meteor.Error('not-found', 'Location not found');
  }

  // Update metadata
  const updatedLocation = {
    ...locationData,
    _id: existingLocation._id,  // Use the actual _id from the found location
    id: existingLocation.id,    // Preserve the FHIR id
    resourceType: 'Location',
    meta: {
      ...get(locationData, 'meta', {}),
      lastUpdated: new Date(),
      versionId: String(parseInt(get(existingLocation, 'meta.versionId', '0')) + 1)
    }
  };

  // Update the location using the actual _id
  const result = await Locations._collection.updateAsync(
    { _id: existingLocation._id },
    { $set: updatedLocation }
  );

  // Log for HIPAA compliance
  context.log.info('Location updated', {
    userId: context.userId,
    locationId: locationId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('locations.remove', {
  description: 'Delete a FHIR Location resource by id',
  positionalParams: ['locationId'],
  schemaObject: {
    type: 'object',
    properties: { locationId: { type: 'string' } },
    required: ['locationId']
  }
}, async function(params, context){
  const locationId = params.locationId;

  // Check if location exists - try _id first, then id
  let existingLocation = await Locations.findOneAsync({ _id: locationId });
  if (!existingLocation) {
    existingLocation = await Locations.findOneAsync({ id: locationId });
  }
  if (!existingLocation) {
    throw new Meteor.Error('not-found', 'Location not found');
  }

  // Remove the location using the actual _id
  const result = await Locations._collection.removeAsync({ _id: existingLocation._id });

  // Log for HIPAA compliance
  context.log.info('Location removed', {
    userId: context.userId,
    locationId: locationId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('locations.get', {
  description: 'Fetch a single FHIR Location resource by MongoDB _id or FHIR id',
  positionalParams: ['locationId'],
  schemaObject: {
    type: 'object',
    properties: { locationId: { type: 'string' } },
    required: ['locationId']
  }
}, async function(params, context){
  const locationId = params.locationId;

  context.log.debug('locations.get called', { locationId: locationId });

  // Try to find by _id first, then by id
  let location = await Locations.findOneAsync({ _id: locationId });

  if (!location) {
    context.log.debug('Not found by _id, trying by FHIR id');
    // Try finding by FHIR id
    location = await Locations.findOneAsync({ id: locationId });
  }

  if (!location) {
    context.log.warn('Location not found with _id or id', { locationId: locationId });
    // Let's also log what locations exist to help debug
    const allLocations = await Locations.find({}, { limit: 5 }).fetchAsync();
    context.log.debug('Sample locations in DB', { sample: allLocations.map(l => ({ _id: l._id, id: l.id })) });
    throw new Meteor.Error('not-found', 'Location not found');
  }

  context.log.debug('Found location', { _id: location._id, id: location.id });
  return location;
});
