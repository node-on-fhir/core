// npmPackages/clinical-lists/server/methods.js
//
// rpc-migration (Loop 1): converted to Meteor.ServerMethods.define (global
// registry — npmPackages use the global). Canonical names keep the pre-existing
// `clinicalLists.*` namespace (deliberately distinct from core lists.*). Guards
// deleted in favor of requireAuth (default true); check() -> schemaObject;
// positional args -> positionalParams. phi:true — these write patient clinical
// resources (Condition / AllergyIntolerance / MedicationStatement).

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

Meteor.ServerMethods.define('clinicalLists.conditions.insert', {
  description: 'Insert a Condition (US Core) for the problem list',
  phi: true,
  positionalParams: ['conditionData'],
  schemaObject: {
    type: 'object',
    properties: { conditionData: { type: 'object' } },
    required: ['conditionData']
  }
}, async function(params, context){
  const conditionData = get(params, 'conditionData');

  const Conditions = global.Collections?.Conditions;
  if (!Conditions) {
    throw new Meteor.Error('not-found', 'Conditions collection not available');
  }

  conditionData.meta = {
    profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-condition'],
    versionId: '1',
    lastUpdated: new Date().toISOString()
  };

  return await Conditions.insertAsync(conditionData);
});

Meteor.ServerMethods.define('clinicalLists.conditions.update', {
  description: 'Update a Condition (US Core) on the problem list',
  phi: true,
  positionalParams: ['conditionId', 'conditionData'],
  schemaObject: {
    type: 'object',
    properties: {
      conditionId: { type: 'string' },
      conditionData: { type: 'object' }
    },
    required: ['conditionId', 'conditionData']
  }
}, async function(params, context){
  const conditionId = get(params, 'conditionId');
  const conditionData = get(params, 'conditionData');

  const Conditions = global.Collections?.Conditions;
  if (!Conditions) {
    throw new Meteor.Error('not-found', 'Conditions collection not available');
  }

  conditionData.meta = {
    ...conditionData.meta,
    versionId: String(parseInt(conditionData.meta?.versionId || '1') + 1),
    lastUpdated: new Date().toISOString()
  };

  return await Conditions.updateAsync(conditionId, { $set: conditionData });
});

Meteor.ServerMethods.define('clinicalLists.conditions.remove', {
  description: 'Remove a Condition from the problem list',
  phi: true,
  positionalParams: ['conditionId'],
  schemaObject: {
    type: 'object',
    properties: { conditionId: { type: 'string' } },
    required: ['conditionId']
  }
}, async function(params, context){
  const conditionId = get(params, 'conditionId');

  const Conditions = global.Collections?.Conditions;
  if (!Conditions) {
    throw new Meteor.Error('not-found', 'Conditions collection not available');
  }

  return await Conditions.removeAsync(conditionId);
});

Meteor.ServerMethods.define('clinicalLists.allergyIntolerances.insert', {
  description: 'Insert an AllergyIntolerance (US Core) for the medication-allergy list',
  phi: true,
  positionalParams: ['allergyData'],
  schemaObject: {
    type: 'object',
    properties: { allergyData: { type: 'object' } },
    required: ['allergyData']
  }
}, async function(params, context){
  const allergyData = get(params, 'allergyData');

  const AllergyIntolerances = global.Collections?.AllergyIntolerances;
  if (!AllergyIntolerances) {
    throw new Meteor.Error('not-found', 'AllergyIntolerances collection not available');
  }

  allergyData.meta = {
    profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-allergyintolerance'],
    versionId: '1',
    lastUpdated: new Date().toISOString()
  };

  return await AllergyIntolerances.insertAsync(allergyData);
});

Meteor.ServerMethods.define('clinicalLists.allergyIntolerances.update', {
  description: 'Update an AllergyIntolerance (US Core) on the medication-allergy list',
  phi: true,
  positionalParams: ['allergyId', 'allergyData'],
  schemaObject: {
    type: 'object',
    properties: {
      allergyId: { type: 'string' },
      allergyData: { type: 'object' }
    },
    required: ['allergyId', 'allergyData']
  }
}, async function(params, context){
  const allergyId = get(params, 'allergyId');
  const allergyData = get(params, 'allergyData');

  const AllergyIntolerances = global.Collections?.AllergyIntolerances;
  if (!AllergyIntolerances) {
    throw new Meteor.Error('not-found', 'AllergyIntolerances collection not available');
  }

  allergyData.meta = {
    ...allergyData.meta,
    versionId: String(parseInt(allergyData.meta?.versionId || '1') + 1),
    lastUpdated: new Date().toISOString()
  };

  return await AllergyIntolerances.updateAsync(allergyId, { $set: allergyData });
});

Meteor.ServerMethods.define('clinicalLists.allergyIntolerances.remove', {
  description: 'Remove an AllergyIntolerance from the medication-allergy list',
  phi: true,
  positionalParams: ['allergyId'],
  schemaObject: {
    type: 'object',
    properties: { allergyId: { type: 'string' } },
    required: ['allergyId']
  }
}, async function(params, context){
  const allergyId = get(params, 'allergyId');

  const AllergyIntolerances = global.Collections?.AllergyIntolerances;
  if (!AllergyIntolerances) {
    throw new Meteor.Error('not-found', 'AllergyIntolerances collection not available');
  }

  return await AllergyIntolerances.removeAsync(allergyId);
});

Meteor.ServerMethods.define('clinicalLists.medicationStatements.insert', {
  description: 'Insert a MedicationStatement (US Core) for the medication list',
  phi: true,
  positionalParams: ['medicationData'],
  schemaObject: {
    type: 'object',
    properties: { medicationData: { type: 'object' } },
    required: ['medicationData']
  }
}, async function(params, context){
  const medicationData = get(params, 'medicationData');

  const MedicationStatements = global.Collections?.MedicationStatements;
  if (!MedicationStatements) {
    throw new Meteor.Error('not-found', 'MedicationStatements collection not available');
  }

  medicationData.meta = {
    profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-medicationstatement'],
    versionId: '1',
    lastUpdated: new Date().toISOString()
  };

  return await MedicationStatements.insertAsync(medicationData);
});

Meteor.ServerMethods.define('clinicalLists.medicationStatements.update', {
  description: 'Update a MedicationStatement (US Core) on the medication list',
  phi: true,
  positionalParams: ['medicationId', 'medicationData'],
  schemaObject: {
    type: 'object',
    properties: {
      medicationId: { type: 'string' },
      medicationData: { type: 'object' }
    },
    required: ['medicationId', 'medicationData']
  }
}, async function(params, context){
  const medicationId = get(params, 'medicationId');
  const medicationData = get(params, 'medicationData');

  const MedicationStatements = global.Collections?.MedicationStatements;
  if (!MedicationStatements) {
    throw new Meteor.Error('not-found', 'MedicationStatements collection not available');
  }

  medicationData.meta = {
    ...medicationData.meta,
    versionId: String(parseInt(medicationData.meta?.versionId || '1') + 1),
    lastUpdated: new Date().toISOString()
  };

  return await MedicationStatements.updateAsync(medicationId, { $set: medicationData });
});

Meteor.ServerMethods.define('clinicalLists.medicationStatements.remove', {
  description: 'Remove a MedicationStatement from the medication list',
  phi: true,
  positionalParams: ['medicationId'],
  schemaObject: {
    type: 'object',
    properties: { medicationId: { type: 'string' } },
    required: ['medicationId']
  }
}, async function(params, context){
  const medicationId = get(params, 'medicationId');

  const MedicationStatements = global.Collections?.MedicationStatements;
  if (!MedicationStatements) {
    throw new Meteor.Error('not-found', 'MedicationStatements collection not available');
  }

  return await MedicationStatements.removeAsync(medicationId);
});
