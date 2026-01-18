// imports/api/bodyStructures/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';

import { BodyStructures } from '/imports/lib/schemas/SimpleSchemas/BodyStructures';

Meteor.methods({
  'bodyStructures.insert': async function(bodyStructureData) {
    check(bodyStructureData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create a body structure');
    }

    console.log('[bodyStructures.insert] Creating body structure...');

    const cleanBodyStructure = {
      resourceType: 'BodyStructure',
      id: Random.id(),
      active: get(bodyStructureData, 'active', true),
      description: get(bodyStructureData, 'description', ''),
      patient: get(bodyStructureData, 'patient', {}),
      morphology: {},
      includedStructure: []
    };

    // Set _id to match id
    cleanBodyStructure._id = cleanBodyStructure.id;

    // Handle morphology (CodeableConcept)
    if (bodyStructureData.morphology) {
      if (typeof bodyStructureData.morphology === 'string') {
        cleanBodyStructure.morphology = {
          coding: [{
            system: 'http://snomed.info/sct',
            code: bodyStructureData.morphologyCode || '',
            display: bodyStructureData.morphology
          }],
          text: bodyStructureData.morphology
        };
      } else {
        cleanBodyStructure.morphology = bodyStructureData.morphology;
      }
    }

    // Handle includedStructure
    if (bodyStructureData.structure) {
      cleanBodyStructure.includedStructure = [{
        structure: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: bodyStructureData.structureCode || '',
            display: bodyStructureData.structure
          }],
          text: bodyStructureData.structure
        }
      }];
    } else if (bodyStructureData.includedStructure) {
      cleanBodyStructure.includedStructure = bodyStructureData.includedStructure;
    }

    // Handle patient reference
    if (bodyStructureData.patient) {
      if (typeof bodyStructureData.patient === 'string') {
        cleanBodyStructure.patient = {
          reference: 'Patient/' + bodyStructureData.patient,
          display: get(bodyStructureData, 'patientDisplay', '')
        };
      } else {
        cleanBodyStructure.patient = bodyStructureData.patient;
      }
    }

    // Handle image (Attachment)
    if (bodyStructureData.image) {
      cleanBodyStructure.image = bodyStructureData.image;
    }

    console.log('[bodyStructures.insert] Inserting:', cleanBodyStructure._id);

    const result = await BodyStructures.insertAsync(cleanBodyStructure);
    return result;
  },

  'bodyStructures.update': async function(bodyStructureId, bodyStructureData) {
    check(bodyStructureId, String);
    check(bodyStructureData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update a body structure');
    }

    console.log('[bodyStructures.update] Updating:', bodyStructureId);

    const existing = await BodyStructures.findOneAsync({ _id: bodyStructureId });
    if (!existing) {
      throw new Meteor.Error('not-found', 'Body structure not found');
    }

    const updates = {
      active: get(bodyStructureData, 'active', existing.active),
      description: get(bodyStructureData, 'description', existing.description)
    };

    // Handle morphology
    if (bodyStructureData.morphology) {
      if (typeof bodyStructureData.morphology === 'string') {
        updates.morphology = {
          coding: [{
            system: 'http://snomed.info/sct',
            code: bodyStructureData.morphologyCode || '',
            display: bodyStructureData.morphology
          }],
          text: bodyStructureData.morphology
        };
      } else {
        updates.morphology = bodyStructureData.morphology;
      }
    }

    // Handle includedStructure
    if (bodyStructureData.structure) {
      updates.includedStructure = [{
        structure: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: bodyStructureData.structureCode || '',
            display: bodyStructureData.structure
          }],
          text: bodyStructureData.structure
        }
      }];
    } else if (bodyStructureData.includedStructure) {
      updates.includedStructure = bodyStructureData.includedStructure;
    }

    // Handle patient
    if (bodyStructureData.patient) {
      if (typeof bodyStructureData.patient === 'string') {
        updates.patient = {
          reference: 'Patient/' + bodyStructureData.patient,
          display: get(bodyStructureData, 'patientDisplay', '')
        };
      } else {
        updates.patient = bodyStructureData.patient;
      }
    }

    // Handle image
    if (bodyStructureData.image) {
      updates.image = bodyStructureData.image;
    }

    const result = await BodyStructures.updateAsync(
      { _id: bodyStructureId },
      { $set: updates }
    );

    console.log('[bodyStructures.update] Updated:', bodyStructureId);
    return result;
  },

  'bodyStructures.remove': async function(bodyStructureId) {
    check(bodyStructureId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to delete a body structure');
    }

    console.log('[bodyStructures.remove] Removing:', bodyStructureId);

    const result = await BodyStructures.removeAsync({ _id: bodyStructureId });
    return result;
  },

  'bodyStructures.findOne': async function(bodyStructureId) {
    check(bodyStructureId, String);

    const bodyStructure = await BodyStructures.findOneAsync({ _id: bodyStructureId });
    return bodyStructure;
  }
});
