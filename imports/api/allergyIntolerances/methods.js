// /imports/api/allergyIntolerances/methods.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get, set } from 'lodash';

import { AllergyIntolerances } from '/imports/lib/schemas/SimpleSchemas/AllergyIntolerances';

const log = (Meteor.Logger ? Meteor.Logger.for('AllergyIntolerancesMethods') : console);

Meteor.ServerMethods.define('allergyIntolerances.create', {
  description: 'Create a new AllergyIntolerance resource for a patient',
  aliases: ['createAllergyIntolerance'],
  phi: true,
  schemaObject: { type: 'object' }   // arbitrary FHIR AllergyIntolerance shape
}, async function(params, context){
  const allergyIntoleranceData = params;

  context.log.debug('createAllergyIntolerance called', { data: allergyIntoleranceData });

  // Create a clean object for insertion
  let cleanAllergyIntolerance = {
    resourceType: 'AllergyIntolerance',
    meta: {
      lastUpdated: new Date()
    }
  };

  // Set clinical status (handle both string and CodeableConcept formats)
  if (allergyIntoleranceData.clinicalStatus) {
    cleanAllergyIntolerance.clinicalStatus = allergyIntoleranceData.clinicalStatus;
  } else {
    // Default to active
    cleanAllergyIntolerance.clinicalStatus = {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
        code: "active",
        display: "Active"
      }]
    };
  }

  // Set verification status (handle both string and CodeableConcept formats)
  if (allergyIntoleranceData.verificationStatus) {
    cleanAllergyIntolerance.verificationStatus = allergyIntoleranceData.verificationStatus;
  } else {
    // Default to unconfirmed
    cleanAllergyIntolerance.verificationStatus = {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
        code: "unconfirmed",
        display: "Unconfirmed"
      }]
    };
  }

  // Type (allergy or intolerance)
  if (allergyIntoleranceData.type) {
    cleanAllergyIntolerance.type = allergyIntoleranceData.type;
  }

  // Category array
  if (allergyIntoleranceData.category) {
    cleanAllergyIntolerance.category = allergyIntoleranceData.category;
  }

  // Criticality
  if (allergyIntoleranceData.criticality) {
    cleanAllergyIntolerance.criticality = allergyIntoleranceData.criticality;
  }

  // Code (the allergen)
  if (allergyIntoleranceData.code) {
    cleanAllergyIntolerance.code = allergyIntoleranceData.code;
  }

  // Patient reference
  if (allergyIntoleranceData.patient) {
    cleanAllergyIntolerance.patient = allergyIntoleranceData.patient;
    log.phi('[createAllergyIntolerance] Patient reference', { patient: cleanAllergyIntolerance.patient }, { action: 'create' });
  } else {
    context.log.warn('[createAllergyIntolerance] No patient reference provided'); // phi-audit: ok
  }

  // Onset date
  if (allergyIntoleranceData.onsetDateTime) {
    cleanAllergyIntolerance.onsetDateTime = allergyIntoleranceData.onsetDateTime;
  }

  // Recorder reference
  if (allergyIntoleranceData.recorder) {
    cleanAllergyIntolerance.recorder = allergyIntoleranceData.recorder;
  }

  // Asserter reference
  if (allergyIntoleranceData.asserter) {
    cleanAllergyIntolerance.asserter = allergyIntoleranceData.asserter;
  }

  // Reaction details
  if (allergyIntoleranceData.reaction) {
    cleanAllergyIntolerance.reaction = allergyIntoleranceData.reaction;
  }

  // Notes
  if (allergyIntoleranceData.note) {
    cleanAllergyIntolerance.note = allergyIntoleranceData.note;
  }

  // Generate ID if using Meteor string IDs
  cleanAllergyIntolerance.id = Random.id();

  context.log.debug('About to insert cleanAllergyIntolerance', { data: cleanAllergyIntolerance });

  try {
    const result = await AllergyIntolerances.insertAsync(cleanAllergyIntolerance);
    context.log.info('Created allergy intolerance', { _id: result });
    return result;
  } catch (error) {
    context.log.error('Error creating allergy intolerance', { message: error.message });
    throw new Meteor.Error('insert-failed', error.message);
  }
});

Meteor.ServerMethods.define('allergyIntolerances.update', {
  description: 'Update an existing AllergyIntolerance resource by id',
  aliases: ['updateAllergyIntolerance'],
  phi: true,
  positionalParams: ['allergyIntoleranceId', 'allergyIntoleranceData'],
  schemaObject: {
    type: 'object',
    properties: {
      allergyIntoleranceId: { type: 'string' },
      allergyIntoleranceData: { type: 'object' }
    },
    required: ['allergyIntoleranceId', 'allergyIntoleranceData']
  }
}, async function(params, context){
  const allergyIntoleranceId = params.allergyIntoleranceId;
  const allergyIntoleranceData = params.allergyIntoleranceData;

  // Remove _id from update data if present
  delete allergyIntoleranceData._id;

  // Update metadata
  set(allergyIntoleranceData, 'meta.lastUpdated', new Date());

  try {
    const result = await AllergyIntolerances.updateAsync(
      { _id: allergyIntoleranceId },
      { $set: allergyIntoleranceData }
    );
    context.log.info('Updated allergy intolerance', { result: result });
    return result;
  } catch (error) {
    context.log.error('Error updating allergy intolerance', { message: error.message });
    throw new Meteor.Error('update-failed', error.message);
  }
});

Meteor.ServerMethods.define('allergyIntolerances.remove', {
  description: 'Delete an AllergyIntolerance resource by id',
  aliases: ['removeAllergyIntolerance'],
  phi: true,
  positionalParams: ['allergyIntoleranceId'],
  schemaObject: {
    type: 'object',
    properties: {
      allergyIntoleranceId: { type: 'string' }
    },
    required: ['allergyIntoleranceId']
  }
}, async function(params, context){
  try {
    const result = await AllergyIntolerances.removeAsync({ _id: params.allergyIntoleranceId });
    context.log.info('Removed allergy intolerance', { result: result });
    return result;
  } catch (error) {
    context.log.error('Error removing allergy intolerance', { message: error.message });
    throw new Meteor.Error('remove-failed', error.message);
  }
});

Meteor.ServerMethods.define('allergyIntolerances.count', {
  description: 'Count all AllergyIntolerance records'
  // Pre-migration this method had NO auth guard. requireAuth now applies
  // (default true) — behavior change noted in the migration report.
}, async function(params, context){
  try {
    const count = await AllergyIntolerances.find().countAsync();
    context.log.debug('AllergyIntolerances count', { count: count });
    return count;
  } catch (error) {
    context.log.error('Error counting allergy intolerances', { message: error.message });
    throw new Meteor.Error('count-failed', error.message);
  }
});

Meteor.ServerMethods.define('allergyIntolerances.findAll', {
  description: 'Fetch all AllergyIntolerance records',
  phi: true
  // Pre-migration this method had NO auth guard (latent bug — it returns
  // every patient's allergy records). requireAuth now applies (default true).
}, async function(params, context){
  try {
    const records = await AllergyIntolerances.find({}).fetchAsync();
    context.log.debug('AllergyIntolerances findAll', { count: records.length });
    return records;
  } catch (error) {
    context.log.error('Error finding allergy intolerances', { message: error.message });
    throw new Meteor.Error('find-failed', error.message);
  }
});
