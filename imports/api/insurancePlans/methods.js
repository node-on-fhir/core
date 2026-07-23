// /imports/api/insurancePlans/methods.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';

import { InsurancePlans } from '/imports/lib/schemas/SimpleSchemas/InsurancePlans';

// InsurancePlan is payer/administrative directory data (not patient-scoped) —
// no phi flag on these methods.

Meteor.ServerMethods.define('insurancePlans.create', {
  description: 'Create a FHIR InsurancePlan resource',
  schemaObject: { type: 'object' }
}, async function(params, context){
  const insurancePlanData = params;

  // Generate FHIR id if not provided
  const fhirId = insurancePlanData.id || Random.id();

  // Add metadata - set _id to match id for consistent lookups
  const insurancePlan = {
    ...insurancePlanData,
    _id: fhirId,  // Set _id explicitly to match FHIR id
    id: fhirId,
    resourceType: 'InsurancePlan',
    meta: {
      lastUpdated: new Date(),
      versionId: '1'
    }
  };

  context.log.info('Inserting insurance plan', { fhirId: fhirId });
  const insurancePlanId = await InsurancePlans._collection.insertAsync(insurancePlan);

  // Log for HIPAA compliance
  context.log.info('InsurancePlan created', {
    userId: context.userId,
    insurancePlanId: insurancePlanId,
    fhirId: fhirId,
    timestamp: new Date()
  });

  return insurancePlanId;
});

Meteor.ServerMethods.define('insurancePlans.update', {
  description: 'Update an existing FHIR InsurancePlan resource',
  positionalParams: ['insurancePlanId', 'insurancePlanData'],
  schemaObject: {
    type: 'object',
    properties: {
      insurancePlanId: { type: 'string' },
      insurancePlanData: { type: 'object' }
    },
    required: ['insurancePlanId', 'insurancePlanData']
  }
}, async function(params, context){
  const insurancePlanId = params.insurancePlanId;
  const insurancePlanData = params.insurancePlanData;

  // Check if record exists - try _id first, then id
  let existingInsurancePlan = await InsurancePlans.findOneAsync({ _id: insurancePlanId });
  if (!existingInsurancePlan) {
    existingInsurancePlan = await InsurancePlans.findOneAsync({ id: insurancePlanId });
  }
  if (!existingInsurancePlan) {
    throw new Meteor.Error('not-found', 'InsurancePlan not found');
  }

  // Update metadata
  const updatedInsurancePlan = {
    ...insurancePlanData,
    _id: existingInsurancePlan._id,  // Use the actual _id from the found record
    id: existingInsurancePlan.id,    // Preserve the FHIR id
    resourceType: 'InsurancePlan',
    meta: {
      ...get(insurancePlanData, 'meta', {}),
      lastUpdated: new Date(),
      versionId: String(parseInt(get(existingInsurancePlan, 'meta.versionId', '0')) + 1)
    }
  };

  context.log.info('Updating insurance plan', { insurancePlanId: insurancePlanId });
  const result = await InsurancePlans._collection.updateAsync(
    { _id: existingInsurancePlan._id },
    { $set: updatedInsurancePlan }
  );

  return result;
});

Meteor.ServerMethods.define('insurancePlans.remove', {
  description: 'Delete a FHIR InsurancePlan resource by id',
  positionalParams: ['insurancePlanId'],
  schemaObject: {
    type: 'object',
    properties: { insurancePlanId: { type: 'string' } },
    required: ['insurancePlanId']
  }
}, async function(params, context){
  const insurancePlanId = params.insurancePlanId;

  // Check if record exists - try _id first, then id
  let existingInsurancePlan = await InsurancePlans.findOneAsync({ _id: insurancePlanId });
  if (!existingInsurancePlan) {
    existingInsurancePlan = await InsurancePlans.findOneAsync({ id: insurancePlanId });
  }
  if (!existingInsurancePlan) {
    throw new Meteor.Error('not-found', 'InsurancePlan not found');
  }

  context.log.info('Removing insurance plan', { insurancePlanId: insurancePlanId });
  const result = await InsurancePlans._collection.removeAsync({ _id: existingInsurancePlan._id });

  return result;
});

Meteor.ServerMethods.define('insurancePlans.get', {
  description: 'Fetch a single FHIR InsurancePlan resource by MongoDB _id or FHIR id',
  positionalParams: ['insurancePlanId'],
  schemaObject: {
    type: 'object',
    properties: { insurancePlanId: { type: 'string' } },
    required: ['insurancePlanId']
  }
}, async function(params){
  const insurancePlanId = params.insurancePlanId;

  // Try to find by _id first, then by FHIR id
  let insurancePlan = await InsurancePlans.findOneAsync({ _id: insurancePlanId });
  if (!insurancePlan) {
    insurancePlan = await InsurancePlans.findOneAsync({ id: insurancePlanId });
  }
  if (!insurancePlan) {
    throw new Meteor.Error('not-found', 'InsurancePlan not found');
  }

  return insurancePlan;
});
