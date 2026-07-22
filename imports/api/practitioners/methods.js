// /imports/api/practitioners/methods.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import { Practitioners } from '../../lib/schemas/SimpleSchemas/Practitioners';

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('practitioners.create', {
  description: 'Create a new FHIR Practitioner from whitelisted fields',
  schemaObject: { type: 'object' }   // arbitrary Practitioner payload; whitelisted field-by-field below
}, async function(params, context) {
  const practitionerData = params;

  // Clean up the practitioner data
  const cleanPractitioner = {
    resourceType: 'Practitioner',
    id: practitionerData.id || Random.id(),
    active: practitionerData.active !== undefined ? practitionerData.active : true
  };

  // Set _id to match id (Meteor string ID)
  cleanPractitioner._id = cleanPractitioner.id;
  context.log.info('[practitioners.create] Using Meteor string ID', { id: cleanPractitioner._id });

  // Handle name - ensure it's an array with at least one entry
  if (practitionerData.name && practitionerData.name.length > 0) {
    cleanPractitioner.name = practitionerData.name.map(n => ({
      use: n.use || 'official',
      text: n.text || '',
      family: n.family || '',
      given: Array.isArray(n.given) ? n.given : [n.given || ''],
      prefix: Array.isArray(n.prefix) ? n.prefix : n.prefix ? [n.prefix] : [],
      suffix: Array.isArray(n.suffix) ? n.suffix : n.suffix ? [n.suffix] : []
    }));
  } else {
    throw new Meteor.Error('invalid-practitioner', 'Practitioner must have a name');
  }

  // Handle single value fields
  if (practitionerData.gender) cleanPractitioner.gender = practitionerData.gender;
  if (practitionerData.birthDate) cleanPractitioner.birthDate = practitionerData.birthDate;

  // Handle telecom array
  if (practitionerData.telecom && practitionerData.telecom.length > 0) {
    cleanPractitioner.telecom = practitionerData.telecom.filter(t => t.value).map(t => ({
      system: t.system || 'phone',
      value: t.value,
      use: t.use || 'work'
    }));
  }

  // Handle address array
  if (practitionerData.address && practitionerData.address.length > 0) {
    cleanPractitioner.address = practitionerData.address.map(a => ({
      use: a.use || 'work',
      type: a.type || 'both',
      line: Array.isArray(a.line) ? a.line.filter(l => l) : a.line ? [a.line] : [],
      city: a.city || '',
      state: a.state || '',
      postalCode: a.postalCode || '',
      country: a.country || ''
    }));
  }

  // Handle identifier array (NPI, etc.)
  if (practitionerData.identifier && practitionerData.identifier.length > 0) {
    cleanPractitioner.identifier = practitionerData.identifier.map(id => ({
      use: id.use || 'official',
      value: id.value || '',
      system: id.system || 'http://hl7.org/fhir/sid/us-npi',
      type: id.type
    })).filter(id => id.value);
  }

  // Handle qualification
  if (practitionerData.qualification && practitionerData.qualification.length > 0) {
    cleanPractitioner.qualification = practitionerData.qualification.filter(q =>
      get(q, 'code.coding[0].code') || get(q, 'code.text')
    );
  }

  // Handle communication
  if (practitionerData.communication && practitionerData.communication.length > 0) {
    cleanPractitioner.communication = practitionerData.communication;
  }

  // Handle practitionerRole (for specialty)
  if (practitionerData.practitionerRole && practitionerData.practitionerRole.length > 0) {
    cleanPractitioner.practitionerRole = practitionerData.practitionerRole;
  }

  // Validate required fields
  if (!get(cleanPractitioner, 'name[0].family') || !get(cleanPractitioner, 'name[0].given[0]')) {
    throw new Meteor.Error('invalid-practitioner', 'Practitioner must have a name');
  }

  try {
    context.log.info('[practitioners.create] Inserting practitioner', { practitioner: cleanPractitioner });
    const result = await Practitioners.insertAsync(cleanPractitioner);
    context.log.info('[practitioners.create] Created practitioner', { id: result });
    return result;
  } catch (error) {
    context.log.error('[practitioners.create] Error', { message: error.message, details: error.details });
    throw new Meteor.Error('insert-failed', error.message);
  }
});

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('practitioners.update', {
  description: 'Update an existing Practitioner record by MongoDB _id',
  positionalParams: ['practitionerId', 'practitionerData'],
  schemaObject: {
    type: 'object',
    properties: { practitionerId: { type: 'string' }, practitionerData: { type: 'object' } },
    required: ['practitionerId', 'practitionerData']
  }
}, async function(params, context) {
  const practitionerId = params.practitionerId;

  // Clean the data similar to create
  const cleanPractitioner = { ...params.practitionerData };

  // Remove _id from update data to prevent conflicts
  delete cleanPractitioner._id;

  try {
    context.log.info('[practitioners.update] Updating practitioner', { id: practitionerId });
    const result = await Practitioners.updateAsync(
      { _id: practitionerId },
      { $set: cleanPractitioner }
    );
    context.log.info('[practitioners.update] Updated practitioner', { result: result });
    return result;
  } catch (error) {
    context.log.error('[practitioners.update] Error', { message: error.message });
    throw new Meteor.Error('update-failed', error.message);
  }
});

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('practitioners.remove', {
  description: 'Remove a Practitioner record by MongoDB _id',
  positionalParams: ['practitionerId'],
  schemaObject: {
    type: 'object',
    properties: { practitionerId: { type: 'string' } },
    required: ['practitionerId']
  }
}, async function(params, context) {
  const practitionerId = params.practitionerId;

  try {
    const result = await Practitioners.removeAsync({ _id: practitionerId });
    context.log.info('[practitioners.remove] Removed practitioner', { result: result });
    return result;
  } catch (error) {
    context.log.error('[practitioners.remove] Error', { message: error.message });
    throw new Meteor.Error('remove-failed', error.message);
  }
});

// BEHAVIOR CHANGE (flagged for review): pre-migration this method had NO auth
// guard (latent gap — it reads provider records, and no pre-login caller was
// found in the codebase). requireAuth now applies (default true).
Meteor.ServerMethods.define('practitioners.findOne', {
  description: 'Fetch a single Practitioner by MongoDB _id with FHIR-id fallback',
  positionalParams: ['practitionerId'],
  schemaObject: {
    type: 'object',
    properties: { practitionerId: { type: 'string' } },
    required: ['practitionerId']
  }
}, async function(params, context) {
  const practitionerId = params.practitionerId;

  try {
    // Try _id first
    let practitioner = await Practitioners.findOneAsync({ _id: practitionerId });

    // If not found, try FHIR id as fallback
    if (!practitioner) {
      practitioner = await Practitioners.findOneAsync({ id: practitionerId });
    }

    return practitioner;
  } catch (error) {
    context.log.error('[practitioners.findOne] Error', { message: error.message });
    throw new Meteor.Error('find-failed', error.message);
  }
});
