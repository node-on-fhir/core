// /imports/api/organizations/methods.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';

import { Organizations } from '/imports/lib/schemas/SimpleSchemas/Organizations';

Meteor.ServerMethods.define('organizations.create', {
  description: 'Create a new Organization resource',
  phi: false,
  schemaObject: { type: 'object' }   // params IS the Organization resource
}, async function(params, context){
  context.log.info('organizations.create called', { userId: context.userId });

  // Generate FHIR id if not provided
  const fhirId = params.id || Random.id();

  // Add metadata - set _id to match id for consistent lookups
  const organization = {
    ...params,
    _id: fhirId,  // Set _id explicitly to match FHIR id
    id: fhirId,
    resourceType: 'Organization',
    meta: {
      lastUpdated: new Date(),
      versionId: '1'
    }
  };

  // Insert and return the new organization
  const organizationId = await Organizations._collection.insertAsync(organization);
  context.log.info('Successfully inserted organization', { _id: organizationId });

  // Log for HIPAA compliance
  context.log.info('Organization created', {
    userId: context.userId,
    organizationId: organizationId,
    fhirId: fhirId,
    timestamp: new Date()
  });

  return organizationId;
});

Meteor.ServerMethods.define('organizations.update', {
  description: 'Replace fields of an existing Organization resource',
  phi: false,
  positionalParams: ['organizationId', 'organizationData'],
  schemaObject: {
    type: 'object',
    properties: {
      organizationId: { type: 'string' },
      organizationData: { type: 'object' }
    },
    required: ['organizationId', 'organizationData']
  }
}, async function(params, context){
  const organizationId = params.organizationId;
  const organizationData = params.organizationData;

  // Check if organization exists - try _id first, then id
  let existingOrganization = await Organizations.findOneAsync({ _id: organizationId });
  if (!existingOrganization) {
    existingOrganization = await Organizations.findOneAsync({ id: organizationId });
  }
  if (!existingOrganization) {
    throw new Meteor.Error('not-found', 'Organization not found');
  }

  // Update metadata
  const updatedOrganization = {
    ...organizationData,
    _id: existingOrganization._id,  // Use the actual _id from the found organization
    id: existingOrganization.id,    // Preserve the FHIR id
    resourceType: 'Organization',
    meta: {
      ...get(organizationData, 'meta', {}),
      lastUpdated: new Date(),
      versionId: String(parseInt(get(existingOrganization, 'meta.versionId', '0')) + 1)
    }
  };

  // Update the organization using the actual _id
  const result = await Organizations._collection.updateAsync(
    { _id: existingOrganization._id },
    { $set: updatedOrganization }
  );

  // Log for HIPAA compliance
  context.log.info('Organization updated', {
    userId: context.userId,
    organizationId: organizationId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('organizations.remove', {
  description: 'Delete an Organization resource by its MongoDB _id or FHIR id',
  phi: false,
  positionalParams: ['organizationId'],
  schemaObject: {
    type: 'object',
    properties: { organizationId: { type: 'string' } },
    required: ['organizationId']
  }
}, async function(params, context){
  const organizationId = params.organizationId;

  // Check if organization exists - try _id first, then id
  let existingOrganization = await Organizations.findOneAsync({ _id: organizationId });
  if (!existingOrganization) {
    existingOrganization = await Organizations.findOneAsync({ id: organizationId });
  }
  if (!existingOrganization) {
    throw new Meteor.Error('not-found', 'Organization not found');
  }

  // Remove the organization using the actual _id
  const result = await Organizations._collection.removeAsync({ _id: existingOrganization._id });

  // Log for HIPAA compliance
  context.log.info('Organization removed', {
    userId: context.userId,
    organizationId: organizationId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('organizations.get', {
  description: 'Fetch a single Organization by its MongoDB _id or FHIR id',
  phi: false,
  positionalParams: ['organizationId'],
  schemaObject: {
    type: 'object',
    properties: { organizationId: { type: 'string' } },
    required: ['organizationId']
  }
}, async function(params, context){
  const organizationId = params.organizationId;
  context.log.info('organizations.get called', { organizationId: organizationId });

  // Try to find by _id first, then by id
  let organization = await Organizations.findOneAsync({ _id: organizationId });

  if (!organization) {
    context.log.info('Not found by _id, trying by FHIR id');
    // Try finding by FHIR id
    organization = await Organizations.findOneAsync({ id: organizationId });
  }

  if (!organization) {
    context.log.info('Organization not found with _id or id', { organizationId: organizationId });
    // Let's also log what organizations exist to help debug
    const allOrganizations = await Organizations.find({}, { limit: 5 }).fetchAsync();
    context.log.debug('Sample organizations in DB', { samples: allOrganizations.map(o => ({ _id: o._id, id: o.id })) });
    throw new Meteor.Error('not-found', 'Organization not found');
  }

  context.log.info('Found organization', { _id: organization._id, id: organization.id });
  return organization;
});
