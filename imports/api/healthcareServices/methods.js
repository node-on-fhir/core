// /imports/api/healthcareServices/methods.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';

import { HealthcareServices } from '/imports/lib/schemas/SimpleSchemas/HealthcareServices';

// HealthcareService is provider-directory/admin data (not patient-scoped) —
// no phi flag on these methods.

Meteor.ServerMethods.define('healthcareServices.create', {
  description: 'Create a FHIR HealthcareService resource',
  schemaObject: { type: 'object' }
}, async function(params, context){
  const healthcareServiceData = params;

  // Generate FHIR id if not provided
  const fhirId = healthcareServiceData.id || Random.id();

  // Add metadata - set _id to match id for consistent lookups
  const healthcareService = {
    ...healthcareServiceData,
    _id: fhirId,  // Set _id explicitly to match FHIR id
    id: fhirId,
    resourceType: 'HealthcareService',
    meta: {
      lastUpdated: new Date(),
      versionId: '1'
    }
  };

  context.log.info('Inserting healthcare service', { fhirId: fhirId });
  const healthcareServiceId = await HealthcareServices._collection.insertAsync(healthcareService);

  // Log for HIPAA compliance
  context.log.info('HealthcareService created', {
    userId: context.userId,
    healthcareServiceId: healthcareServiceId,
    fhirId: fhirId,
    timestamp: new Date()
  });

  return healthcareServiceId;
});

Meteor.ServerMethods.define('healthcareServices.update', {
  description: 'Update an existing FHIR HealthcareService resource',
  positionalParams: ['healthcareServiceId', 'healthcareServiceData'],
  schemaObject: {
    type: 'object',
    properties: {
      healthcareServiceId: { type: 'string' },
      healthcareServiceData: { type: 'object' }
    },
    required: ['healthcareServiceId', 'healthcareServiceData']
  }
}, async function(params, context){
  const healthcareServiceId = params.healthcareServiceId;
  const healthcareServiceData = params.healthcareServiceData;

  // Check if record exists - try _id first, then id
  let existingHealthcareService = await HealthcareServices.findOneAsync({ _id: healthcareServiceId });
  if (!existingHealthcareService) {
    existingHealthcareService = await HealthcareServices.findOneAsync({ id: healthcareServiceId });
  }
  if (!existingHealthcareService) {
    throw new Meteor.Error('not-found', 'HealthcareService not found');
  }

  // Update metadata
  const updatedHealthcareService = {
    ...healthcareServiceData,
    _id: existingHealthcareService._id,  // Use the actual _id from the found record
    id: existingHealthcareService.id,    // Preserve the FHIR id
    resourceType: 'HealthcareService',
    meta: {
      ...get(healthcareServiceData, 'meta', {}),
      lastUpdated: new Date(),
      versionId: String(parseInt(get(existingHealthcareService, 'meta.versionId', '0')) + 1)
    }
  };

  context.log.info('Updating healthcare service', { healthcareServiceId: healthcareServiceId });
  const result = await HealthcareServices._collection.updateAsync(
    { _id: existingHealthcareService._id },
    { $set: updatedHealthcareService }
  );

  return result;
});

Meteor.ServerMethods.define('healthcareServices.remove', {
  description: 'Delete a FHIR HealthcareService resource by id',
  positionalParams: ['healthcareServiceId'],
  schemaObject: {
    type: 'object',
    properties: { healthcareServiceId: { type: 'string' } },
    required: ['healthcareServiceId']
  }
}, async function(params, context){
  const healthcareServiceId = params.healthcareServiceId;

  // Check if record exists - try _id first, then id
  let existingHealthcareService = await HealthcareServices.findOneAsync({ _id: healthcareServiceId });
  if (!existingHealthcareService) {
    existingHealthcareService = await HealthcareServices.findOneAsync({ id: healthcareServiceId });
  }
  if (!existingHealthcareService) {
    throw new Meteor.Error('not-found', 'HealthcareService not found');
  }

  context.log.info('Removing healthcare service', { healthcareServiceId: healthcareServiceId });
  const result = await HealthcareServices._collection.removeAsync({ _id: existingHealthcareService._id });

  return result;
});

Meteor.ServerMethods.define('healthcareServices.get', {
  description: 'Fetch a single FHIR HealthcareService resource by MongoDB _id or FHIR id',
  positionalParams: ['healthcareServiceId'],
  schemaObject: {
    type: 'object',
    properties: { healthcareServiceId: { type: 'string' } },
    required: ['healthcareServiceId']
  }
}, async function(params){
  const healthcareServiceId = params.healthcareServiceId;

  // Try to find by _id first, then by FHIR id
  let healthcareService = await HealthcareServices.findOneAsync({ _id: healthcareServiceId });
  if (!healthcareService) {
    healthcareService = await HealthcareServices.findOneAsync({ id: healthcareServiceId });
  }
  if (!healthcareService) {
    throw new Meteor.Error('not-found', 'HealthcareService not found');
  }

  return healthcareService;
});
