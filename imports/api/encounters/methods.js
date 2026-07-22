// /imports/api/encounters/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import moment from 'moment';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/Encounters';

// Get the correct Encounters collection reference
function getEncounters() {
  if (Meteor.isServer) {
    // On server, use the global collection set up in server/main.js
    return Meteor.Collections?.Encounters || global.Encounters;
  } else {
    // On client, use from Meteor.Collections if available
    return Meteor.Collections?.Encounters;
  }
}

Meteor.ServerMethods.define('encounters.create', {
  description: 'Create a FHIR Encounter record for a patient',
  phi: true,
  schemaObject: { type: 'object' }
}, async function(params, context){
  const encounterData = params;

  // Add metadata
  const encounter = {
    ...encounterData,
    resourceType: 'Encounter',
    meta: {
      lastUpdated: new Date(),
      versionId: '1'
    }
  };

  // Debug logging
  context.log.debug('Creating encounter', {
    hasParticipant: !!(encounter.participant && encounter.participant[0]),
    practitionerDisplay: get(encounter, 'participant.0.individual.display')
  });

  // Insert and return the new encounter
  const Encounters = getEncounters();
  const encounterId = await Encounters.insertAsync(encounter);

  // Log for HIPAA compliance
  context.log.info('Encounter created', {
    userId: context.userId,
    encounterId: encounterId,
    timestamp: new Date()
  });

  return encounterId;
});

Meteor.ServerMethods.define('encounters.update', {
  description: 'Update an existing FHIR Encounter record by MongoDB _id',
  phi: true,
  positionalParams: ['encounterId', 'encounterData'],
  schemaObject: {
    type: 'object',
    properties: {
      encounterId: { type: 'string' },
      encounterData: { type: 'object' }
    },
    required: ['encounterId', 'encounterData']
  }
}, async function(params, context){
  const { encounterId, encounterData } = params;

  const Encounters = getEncounters();

  // Check if encounter exists
  const existingEncounter = await Encounters.findOneAsync({ _id: encounterId });
  if (!existingEncounter) {
    throw new Meteor.Error('not-found', 'Encounter not found');
  }

  // Update metadata
  const updatedEncounter = {
    ...encounterData,
    _id: encounterId,
    resourceType: 'Encounter',
    meta: {
      ...get(encounterData, 'meta', {}),
      lastUpdated: new Date(),
      versionId: String(parseInt(get(existingEncounter, 'meta.versionId', '0')) + 1)
    }
  };

  // Update the encounter
  const result = await Encounters.updateAsync(
    { _id: encounterId },
    { $set: updatedEncounter }
  );

  // Log for HIPAA compliance
  context.log.info('Encounter updated', {
    userId: context.userId,
    encounterId: encounterId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('encounters.remove', {
  description: 'Remove a FHIR Encounter record by MongoDB _id',
  phi: true,
  positionalParams: ['encounterId'],
  schemaObject: {
    type: 'object',
    properties: { encounterId: { type: 'string' } },
    required: ['encounterId']
  }
}, async function(params, context){
  const encounterId = params.encounterId;

  const Encounters = getEncounters();

  // Check if encounter exists
  const existingEncounter = await Encounters.findOneAsync({ _id: encounterId });
  if (!existingEncounter) {
    throw new Meteor.Error('not-found', 'Encounter not found');
  }

  // Remove the encounter
  const result = await Encounters.removeAsync({ _id: encounterId });

  // Log for HIPAA compliance
  context.log.info('Encounter removed', {
    userId: context.userId,
    encounterId: encounterId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('encounters.get', {
  description: 'Fetch a single FHIR Encounter record by id',
  phi: true,
  positionalParams: ['encounterId'],
  schemaObject: {
    type: 'object',
    properties: { encounterId: { type: 'string' } },
    required: ['encounterId']
  }
}, async function(params, context){
  const encounterId = params.encounterId;

  const Encounters = getEncounters();
  context.log.debug('encounters.get called', { encounterId: encounterId, hasCollection: !!Encounters });

  // Try both ways to find the encounter
  let encounter = await Encounters.findOneAsync({ _id: encounterId });

  if (!encounter) {
    // Also try without the query object
    encounter = await Encounters.findOneAsync(encounterId);
  }

  if (!encounter) {
    context.log.warn('Encounter not found', {
      encounterId: encounterId,
      totalEncounters: await Encounters.countAsync()
    });

    throw new Meteor.Error('not-found', 'Encounter not found');
  }

  context.log.debug('Found encounter', { _id: encounter._id });
  return encounter;
});
