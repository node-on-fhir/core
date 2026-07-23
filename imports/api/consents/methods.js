// /imports/api/consents/methods.js
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { Random } from 'meteor/random';

import { Consents } from '/imports/lib/schemas/SimpleSchemas/Consents';
import { FhirUtilities } from '../../lib/FhirUtilities';
import { HipaaLogger } from '../../lib/HipaaLogger';

const log = (Meteor.Logger ? Meteor.Logger.for('ConsentsMethods') : console);

// NOTE: canonical names use updateById/removeById because consents.update /
// consents.remove are already registered by @node-on-fhir/consent-generator
// (FHIR-id based variants); duplicate method names throw at boot.

Meteor.ServerMethods.define('consents.create', {
  description: 'Create a FHIR Consent record for a patient',
  phi: true,
  aliases: ['createConsent'],
  schemaObject: { type: 'object' }
}, async function(params, context){
  const consentData = params;

  // Clean the data
  const cleanConsent = {
    ...consentData,
    resourceType: 'Consent',
    id: consentData.id || Random.id(),
    meta: {
      versionId: '1',
      lastUpdated: new Date()
    }
  };

  context.log.debug('createConsent payload fields', {
    status: cleanConsent.status,
    hasPolicyRule: !!cleanConsent.policyRule,
    hasNote: !!cleanConsent.note,
    hasCategory: !!cleanConsent.category
  });
  log.phi('patient', cleanConsent.patient, { action: 'create' });

  // Set default status if not provided
  if (!cleanConsent.status) {
    cleanConsent.status = 'draft';
  }

  // Ensure dateTime is set
  if (!cleanConsent.dateTime) {
    cleanConsent.dateTime = new Date();
  }

  // Log the action
  const currentUser = await Meteor.users.findOneAsync({ _id: context.userId });
  HipaaLogger.logEvent({
    eventType: 'create',
    userId: context.userId,
    userName: get(currentUser, 'username', 'Unknown User'),
    collectionName: 'Consents',
    recordId: cleanConsent.id,
    patientId: get(cleanConsent, 'patient.reference'),
    payload: cleanConsent
  });

  try {
    const consentId = await Consents.insertAsync(cleanConsent);
    context.log.info('Created consent', { consentId: consentId });

    // Verify it was saved correctly
    const saved = await Consents.findOneAsync({_id: consentId});
    if (saved) {
      context.log.debug('Verified saved consent', { status: saved.status });
    } else {
      context.log.error('Consent not found immediately after insert', { consentId: consentId });
    }

    return consentId;
  } catch (error) {
    context.log.error('Error creating consent', { message: error.message });
    throw new Meteor.Error('insert-failed', error.message);
  }
});

Meteor.ServerMethods.define('consents.updateById', {
  description: 'Update an existing FHIR Consent record by MongoDB _id',
  phi: true,
  aliases: ['updateConsent'],
  positionalParams: ['consentId', 'consentData'],
  schemaObject: {
    type: 'object',
    properties: {
      consentId: { type: 'string' },
      consentData: { type: 'object' }
    },
    required: ['consentId', 'consentData']
  }
}, async function(params, context){
  const { consentId, consentData } = params;

  // Clean the data
  const cleanConsent = {
    ...consentData,
    meta: {
      ...consentData.meta,
      versionId: String(parseInt(get(consentData, 'meta.versionId', '0')) + 1),
      lastUpdated: new Date()
    }
  };

  // Remove fields that shouldn't be updated
  delete cleanConsent._id;
  delete cleanConsent._document;

  // Log the action
  const currentUser = await Meteor.users.findOneAsync({ _id: context.userId });
  HipaaLogger.logEvent({
    eventType: 'update',
    userId: context.userId,
    userName: get(currentUser, 'username', 'Unknown User'),
    collectionName: 'Consents',
    recordId: consentId,
    patientId: get(cleanConsent, 'patient.reference'),
    payload: cleanConsent
  });

  try {
    // Check if consent exists before update
    const existingConsent = await Consents.findOneAsync({ _id: consentId });
    if (!existingConsent) {
      context.log.error('Consent not found for update', { consentId: consentId });
    }

    const result = await Consents.updateAsync(
      { _id: consentId },
      { $set: cleanConsent }
    );
    context.log.info('Updated consent', { consentId: consentId, updated: result });

    if (result === 0) {
      context.log.warn('Update returned 0 - no documents were updated (schema validation failure or document not found)', { consentId: consentId });
    }

    return consentId;
  } catch (error) {
    context.log.error('Error updating consent', { message: error.message });
    throw new Meteor.Error('update-failed', error.message);
  }
});

Meteor.ServerMethods.define('consents.removeById', {
  description: 'Remove a FHIR Consent record by MongoDB _id',
  phi: true,
  aliases: ['removeConsent'],
  positionalParams: ['consentId'],
  schemaObject: {
    type: 'object',
    properties: { consentId: { type: 'string' } },
    required: ['consentId']
  }
}, async function(params, context){
  const consentId = params.consentId;

  // Get the consent for logging
  const consent = await Consents.findOneAsync({ _id: consentId });
  if (!consent) {
    throw new Meteor.Error('not-found', 'Consent not found');
  }

  // Log the action
  const currentUser = await Meteor.users.findOneAsync({ _id: context.userId });
  HipaaLogger.logEvent({
    eventType: 'delete',
    userId: context.userId,
    userName: get(currentUser, 'username', 'Unknown User'),
    collectionName: 'Consents',
    recordId: consentId,
    patientId: get(consent, 'patient.reference'),
    payload: consent
  });

  try {
    const result = await Consents.removeAsync({ _id: consentId });
    context.log.info('Removed consent', { consentId: consentId, removed: result });
    return result;
  } catch (error) {
    context.log.error('Error removing consent', { message: error.message });
    throw new Meteor.Error('remove-failed', error.message);
  }
});
