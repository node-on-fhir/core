// /imports/api/patients/methods.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import { Patients } from '../../lib/schemas/SimpleSchemas/Patients';

const log = (Meteor.Logger ? Meteor.Logger.for('PatientsMethods') : console);

const US_CORE_RACE_URL = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-race';
const US_CORE_ETHNICITY_URL = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity';

// Sanitize a patient's extension array before persistence.
// - Keeps simple-valued extensions (valueCode/valueCodeableConcept) AND complex
//   extensions (nested sub-extensions, e.g. US Core race/ethnicity) — the old
//   filter silently dropped the latter.
// - Race/ethnicity collection is settings-gated and forbidden in some
//   jurisdictions: when the gate is off, us-core-race/us-core-ethnicity
//   extensions are stripped server-side even if a client submits them
//   (defense-in-depth beyond hiding the UI fields).
function sanitizePatientExtensions(extensions) {
  if (!Array.isArray(extensions)) { return extensions; }
  const raceEthnicityEnabled = get(Meteor, 'settings.public.modules.patientDemographics.raceEthnicity', false);
  return extensions.filter(function(ext) {
    if (!ext || !ext.url) { return false; }
    if (!raceEthnicityEnabled && (ext.url === US_CORE_RACE_URL || ext.url === US_CORE_ETHNICITY_URL)) {
      log.debug('[patients] race/ethnicity gate off — dropping extension', { url: ext.url });
      return false;
    }
    return !!(ext.valueCode || ext.valueCodeableConcept || (Array.isArray(ext.extension) && ext.extension.length > 0));
  });
}

// Pre-migration this method required login ('User must be logged in to create
// patients') — requireAuth default (true) preserves that posture.
Meteor.ServerMethods.define('patients.insert', {
  description: 'Create a new FHIR Patient record from sanitized demographic data',
  phi: true,
  schemaObject: { type: 'object' }   // arbitrary Patient payload; whitelisted field-by-field below
}, async function(params, context) {
  const patientData = params;

  // Clean up the patient data to avoid parallel array indexing issues
  const cleanPatient = {
    resourceType: 'Patient',
    active: patientData.active !== undefined ? patientData.active : true
  };

  // Generate unique FHIR id - never accept from client to avoid collisions
  // Only accept ID if it's a non-empty string, otherwise generate
  if (!patientData.id || typeof patientData.id !== 'string' || patientData.id.trim() === '') {
    cleanPatient.id = Random.id();
  } else {
    cleanPatient.id = patientData.id;
  }

  // Set _id based on environment variable
  if (process.env.USE_MONGO_OBJECTID) {
    // Use MongoDB ObjectID for consistency with existing data
    const { Mongo } = Package.mongo;
    const objectId = new Mongo.ObjectID();
    // Convert to hex string for Meteor
    cleanPatient._id = objectId.toHexString();
    context.log.info('[patients.insert] Using MongoDB ObjectID (as hex string)', { id: cleanPatient._id }); // phi-audit: ok
  } else {
    // Default: Set _id to match id (Meteor string ID)
    cleanPatient._id = cleanPatient.id;
    log.debug('[patients.insert] Using Meteor string ID', { id: cleanPatient._id });
  }

  // Handle name - ensure it's an array with at least one entry
  if (patientData.name && patientData.name.length > 0) {
    cleanPatient.name = patientData.name.map(n => ({
      use: n.use || 'official',
      text: n.text || '',
      family: n.family || '',
      given: Array.isArray(n.given) ? n.given : [n.given || '']
    }));
  } else {
    throw new Meteor.Error('invalid-patient', 'Patient must have a name');
  }

  // Handle single value fields
  if (patientData.gender) cleanPatient.gender = patientData.gender;
  if (patientData.birthDate) cleanPatient.birthDate = patientData.birthDate;

  // Handle telecom array
  if (patientData.telecom && patientData.telecom.length > 0) {
    cleanPatient.telecom = patientData.telecom.filter(t => t.value).map(t => ({
      system: t.system || 'phone',
      value: t.value,
      use: t.use || 'home'
    }));
  }

  // Handle address array
  if (patientData.address && patientData.address.length > 0) {
    cleanPatient.address = patientData.address.map(a => ({
      use: a.use || 'home',
      type: a.type || 'both',
      line: Array.isArray(a.line) ? a.line.filter(l => l) : [],
      city: a.city || '',
      state: a.state || '',
      postalCode: a.postalCode || '',
      country: a.country || ''
    }));
  }

  // Handle communication array
  if (patientData.communication && patientData.communication.length > 0) {
    cleanPatient.communication = patientData.communication;
  }

  // Handle maritalStatus
  if (patientData.maritalStatus) {
    cleanPatient.maritalStatus = patientData.maritalStatus;
  }

  // Handle identifier array
  if (patientData.identifier && patientData.identifier.length > 0) {
    cleanPatient.identifier = patientData.identifier.map(id => ({
      use: id.use || 'usual',
      value: id.value || '',
      system: id.system,
      type: id.type
    })).filter(id => id.value);
  }

  // Handle extensions separately to avoid parallel array issues.
  // sanitizePatientExtensions keeps complex (nested) extensions and enforces
  // the race/ethnicity settings gate.
  if (patientData.extension && patientData.extension.length > 0) {
    cleanPatient.extension = sanitizePatientExtensions(patientData.extension);
  }

  // Validate required fields
  if (!get(cleanPatient, 'name[0].family') || !get(cleanPatient, 'name[0].given[0]')) {
    throw new Meteor.Error('invalid-patient', 'Patient must have a name');
  }

  try {
    log.phi('[patients.insert] Inserting patient', cleanPatient, { action: 'create' });
    const result = await Patients.insertAsync(cleanPatient);
    log.debug('[patients.insert] insertAsync returned ID', { id: result });

    // DIAGNOSTIC: Verify the patient was actually inserted
    const verifyPatient = await Patients.findOneAsync({ _id: result });
    if (verifyPatient) {
      log.debug('[patients.insert] Verified patient exists in database with ID', { id: result });
    } else {
      context.log.error('[patients.insert] insertAsync returned ID but patient NOT in database — serious database issue'); // phi-audit: ok
    }

    return result;
  } catch (error) {
    context.log.error('[patients.insert] Error details', { // phi-audit: ok
      message: error.message,
      stack: error.stack,
      details: error.details,
      reason: error.reason
    });
    // If it's a validation error, include more details
    if (error.validationErrors) {
      context.log.error('[patients.insert] Validation errors', { validationErrors: error.validationErrors }); // phi-audit: ok
    }
    throw new Meteor.Error('insert-failed', error.message || 'Failed to insert patient', error.details);
  }
});

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('patients.update', {
  description: 'Update an existing FHIR Patient record with sanitized demographic data',
  phi: true,
  positionalParams: ['selector', 'modifier'],
  schemaObject: {
    type: 'object',
    properties: { selector: { type: 'object' }, modifier: { type: 'object' } },
    required: ['selector', 'modifier']
  }
}, async function(params, context) {
  const selector = params.selector;
  const modifier = params.modifier;

  // If we're doing a $set operation, clean the data
  if (modifier.$set) {
    const patientData = modifier.$set;
    const cleanPatient = {};

    // Copy over simple fields
    ['resourceType', 'id', 'active', 'gender', 'birthDate'].forEach(field => {
      if (patientData[field] !== undefined) {
        cleanPatient[field] = patientData[field];
      }
    });

    // Handle name array
    if (patientData.name) {
      cleanPatient.name = patientData.name.map(n => ({
        use: n.use || 'official',
        text: n.text || '',
        family: n.family || '',
        given: Array.isArray(n.given) ? n.given : [n.given || '']
      }));
    }

    // Handle telecom array - filter out empty values
    if (patientData.telecom) {
      cleanPatient.telecom = patientData.telecom.filter(t => t.value).map(t => ({
        system: t.system || 'phone',
        value: t.value,
        use: t.use || 'home'
      }));
    }

    // Handle address array
    if (patientData.address) {
      cleanPatient.address = patientData.address.map(a => ({
        use: a.use || 'home',
        type: a.type || 'both',
        line: Array.isArray(a.line) ? a.line.filter(l => l) : [],
        city: a.city || '',
        state: a.state || '',
        postalCode: a.postalCode || '',
        country: a.country || ''
      }));
    }

    // Handle other complex fields
    if (patientData.communication) cleanPatient.communication = patientData.communication;
    if (patientData.maritalStatus) cleanPatient.maritalStatus = patientData.maritalStatus;

    // Handle identifier array
    if (patientData.identifier) {
      cleanPatient.identifier = patientData.identifier.map(id => ({
        use: id.use || 'usual',
        value: id.value || '',
        system: id.system,
        type: id.type
      })).filter(id => id.value);
    }

    // Handle extensions (keep complex extensions; enforce race/ethnicity gate)
    if (patientData.extension) {
      cleanPatient.extension = sanitizePatientExtensions(patientData.extension);
    }

    modifier.$set = cleanPatient;
  }

  try {
    log.phi('[patients.update] Updating with', modifier, { action: 'update' });
    const result = await Patients.updateAsync(selector, modifier);
    context.log.info('[patients.update] Updated patient', { result: result }); // phi-audit: ok
    return result;
  } catch (error) {
    context.log.error('[patients.update] Error', { message: error.message }); // phi-audit: ok
    throw new Meteor.Error('update-failed', error.message);
  }
});

// Pre-migration this method required login — requireAuth default (true). The
// TEST_RUN / allowPatientDeletion production gate is preserved verbatim.
Meteor.ServerMethods.define('patients.remove', {
  description: 'Remove a Patient record by MongoDB _id (restricted outside test mode)',
  phi: true,
  positionalParams: ['patientId'],
  schemaObject: {
    type: 'object',
    properties: { patientId: { type: 'string' } },
    required: ['patientId']
  }
}, async function(params, context) {
  const patientId = params.patientId;

  // In production, only allow deletion in test mode or from specific contexts
  // (e.g., MyProfile page would have additional checks)
  if (!process.env.TEST_RUN && !get(Meteor, 'settings.public.defaults.allowPatientDeletion', false)) {
    context.log.info('[patients.remove] Deletion blocked - not in TEST_RUN mode'); // phi-audit: ok
    throw new Meteor.Error('not-allowed', 'Patient deletion is restricted in production mode');
  }

  try {
    // IMPORTANT: Use _id only for lookups per CLAUDE.md anti-pattern guidelines
    // Never use $or logic which can cause ID collisions
    const result = await Patients.removeAsync({ _id: patientId });
    log.debug('[patients.remove] Removed patient with _id', { patientId, result });
    return result;
  } catch (error) {
    context.log.error('[patients.remove] Error', { message: error.message }); // phi-audit: ok
    throw new Meteor.Error('remove-failed', error.message);
  }
});

// Pre-migration this method required login (heavily used by tests AFTER the
// alice login step) — requireAuth default (true) preserves that posture.
Meteor.ServerMethods.define('patients.findOne', {
  description: 'Fetch a single Patient record by MongoDB _id',
  phi: true,
  positionalParams: ['patientId'],
  schemaObject: {
    type: 'object',
    properties: { patientId: { type: 'string' } },
    required: ['patientId']
  }
}, async function(params, context) {
  const patientId = params.patientId;

  try {
    // IMPORTANT: Use _id only for lookups per CLAUDE.md anti-pattern guidelines
    // Never use $or logic which can cause ID collisions
    const patient = await Patients.findOneAsync({ _id: patientId });
    log.debug('[patients.findOne] Found patient with _id', { patientId, exists: !!patient });
    return patient;
  } catch (error) {
    context.log.error('[patients.findOne] Error', { message: error.message }); // phi-audit: ok
    throw new Meteor.Error('find-failed', error.message);
  }
});
