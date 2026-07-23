// imports/api/riskAssessments/methods.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';

import { RiskAssessments } from '/imports/lib/schemas/SimpleSchemas/RiskAssessments';

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('riskAssessments.insert', {
  description: 'Create a new FHIR RiskAssessment from whitelisted fields',
  phi: true,
  schemaObject: { type: 'object' }   // arbitrary RiskAssessment payload; whitelisted field-by-field below
}, async function(params, context) {
  const riskAssessmentData = params;

  context.log.info('[riskAssessments.insert] Creating risk assessment...');

  const cleanRiskAssessment = {
    resourceType: 'RiskAssessment',
    id: Random.id(),
    status: get(riskAssessmentData, 'status', 'preliminary'),
    date: get(riskAssessmentData, 'date', new Date().toISOString()),
    occurrenceDateTime: get(riskAssessmentData, 'occurrenceDateTime', ''),
    mitigation: get(riskAssessmentData, 'mitigation', ''),
    note: []
  };

  // Set _id to match id
  cleanRiskAssessment._id = cleanRiskAssessment.id;

  // Handle subject reference (patient) - required
  if (riskAssessmentData.subject) {
    if (typeof riskAssessmentData.subject === 'string') {
      cleanRiskAssessment.subject = {
        reference: 'Patient/' + riskAssessmentData.subject,
        display: get(riskAssessmentData, 'subjectDisplay', '')
      };
    } else {
      cleanRiskAssessment.subject = riskAssessmentData.subject;
    }
  }

  // Handle performer reference (practitioner)
  if (riskAssessmentData.performer) {
    if (typeof riskAssessmentData.performer === 'string') {
      cleanRiskAssessment.performer = {
        reference: 'Practitioner/' + riskAssessmentData.performer,
        display: get(riskAssessmentData, 'performerDisplay', '')
      };
    } else {
      cleanRiskAssessment.performer = riskAssessmentData.performer;
    }
  }

  // Handle encounter reference
  if (riskAssessmentData.encounter) {
    if (typeof riskAssessmentData.encounter === 'string') {
      cleanRiskAssessment.encounter = {
        reference: 'Encounter/' + riskAssessmentData.encounter,
        display: get(riskAssessmentData, 'encounterDisplay', '')
      };
    } else {
      cleanRiskAssessment.encounter = riskAssessmentData.encounter;
    }
  }

  // Handle condition reference (what condition being assessed)
  if (riskAssessmentData.condition) {
    if (typeof riskAssessmentData.condition === 'string') {
      cleanRiskAssessment.condition = {
        reference: 'Condition/' + riskAssessmentData.condition,
        display: get(riskAssessmentData, 'conditionDisplay', '')
      };
    } else {
      cleanRiskAssessment.condition = riskAssessmentData.condition;
    }
  }

  // Handle code (CodeableConcept) - type of assessment
  if (riskAssessmentData.code) {
    if (typeof riskAssessmentData.code === 'string') {
      cleanRiskAssessment.code = {
        coding: [{
          system: 'http://snomed.info/sct',
          code: riskAssessmentData.codeCode || '',
          display: riskAssessmentData.code
        }],
        text: riskAssessmentData.code
      };
    } else {
      cleanRiskAssessment.code = riskAssessmentData.code;
    }
  }

  // Handle method (CodeableConcept) - how the assessment was performed
  if (riskAssessmentData.method) {
    if (typeof riskAssessmentData.method === 'string') {
      cleanRiskAssessment.method = {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '',
          display: riskAssessmentData.method
        }],
        text: riskAssessmentData.method
      };
    } else {
      cleanRiskAssessment.method = riskAssessmentData.method;
    }
  }

  // Handle prediction array
  if (riskAssessmentData.prediction) {
    if (typeof riskAssessmentData.prediction === 'string') {
      cleanRiskAssessment.prediction = [{
        outcome: {
          text: riskAssessmentData.prediction
        }
      }];
    } else if (Array.isArray(riskAssessmentData.prediction)) {
      cleanRiskAssessment.prediction = riskAssessmentData.prediction;
    } else {
      cleanRiskAssessment.prediction = [riskAssessmentData.prediction];
    }
  }

  // Handle basis (references to observations/conditions that form basis of assessment)
  if (riskAssessmentData.basis && Array.isArray(riskAssessmentData.basis)) {
    cleanRiskAssessment.basis = riskAssessmentData.basis;
  }

  // Handle note (Annotation)
  if (riskAssessmentData.note) {
    if (typeof riskAssessmentData.note === 'string') {
      cleanRiskAssessment.note = [{
        text: riskAssessmentData.note,
        time: new Date().toISOString()
      }];
    } else if (Array.isArray(riskAssessmentData.note)) {
      cleanRiskAssessment.note = riskAssessmentData.note;
    }
  }

  // Handle reasonCode (why the assessment was performed)
  if (riskAssessmentData.reasonCode && Array.isArray(riskAssessmentData.reasonCode)) {
    cleanRiskAssessment.reasonCode = riskAssessmentData.reasonCode;
  }

  // Handle reasonReference
  if (riskAssessmentData.reasonReference && Array.isArray(riskAssessmentData.reasonReference)) {
    cleanRiskAssessment.reasonReference = riskAssessmentData.reasonReference;
  }

  context.log.info('[riskAssessments.insert] Inserting', { id: cleanRiskAssessment._id });

  const result = await RiskAssessments.insertAsync(cleanRiskAssessment);
  return result;
});

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('riskAssessments.update', {
  description: 'Update an existing RiskAssessment with whitelisted fields',
  phi: true,
  positionalParams: ['riskAssessmentId', 'riskAssessmentData'],
  schemaObject: {
    type: 'object',
    properties: { riskAssessmentId: { type: 'string' }, riskAssessmentData: { type: 'object' } },
    required: ['riskAssessmentId', 'riskAssessmentData']
  }
}, async function(params, context) {
  const riskAssessmentId = params.riskAssessmentId;
  const riskAssessmentData = params.riskAssessmentData;

  context.log.info('[riskAssessments.update] Updating', { id: riskAssessmentId });

  const existing = await RiskAssessments.findOneAsync({ _id: riskAssessmentId });
  if (!existing) {
    throw new Meteor.Error('not-found', 'Risk assessment not found');
  }

  const updates = {
    status: get(riskAssessmentData, 'status', existing.status),
    mitigation: get(riskAssessmentData, 'mitigation', existing.mitigation)
  };

  // Handle subject reference (patient)
  if (riskAssessmentData.subject) {
    if (typeof riskAssessmentData.subject === 'string') {
      updates.subject = {
        reference: 'Patient/' + riskAssessmentData.subject,
        display: get(riskAssessmentData, 'subjectDisplay', '')
      };
    } else {
      updates.subject = riskAssessmentData.subject;
    }
  }

  // Handle performer reference
  if (riskAssessmentData.performer) {
    if (typeof riskAssessmentData.performer === 'string') {
      updates.performer = {
        reference: 'Practitioner/' + riskAssessmentData.performer,
        display: get(riskAssessmentData, 'performerDisplay', '')
      };
    } else {
      updates.performer = riskAssessmentData.performer;
    }
  }

  // Handle encounter reference
  if (riskAssessmentData.encounter) {
    if (typeof riskAssessmentData.encounter === 'string') {
      updates.encounter = {
        reference: 'Encounter/' + riskAssessmentData.encounter,
        display: get(riskAssessmentData, 'encounterDisplay', '')
      };
    } else {
      updates.encounter = riskAssessmentData.encounter;
    }
  }

  // Handle condition reference
  if (riskAssessmentData.condition) {
    if (typeof riskAssessmentData.condition === 'string') {
      updates.condition = {
        reference: 'Condition/' + riskAssessmentData.condition,
        display: get(riskAssessmentData, 'conditionDisplay', '')
      };
    } else {
      updates.condition = riskAssessmentData.condition;
    }
  }

  // Handle code (CodeableConcept)
  if (riskAssessmentData.code) {
    if (typeof riskAssessmentData.code === 'string') {
      updates.code = {
        coding: [{
          system: 'http://snomed.info/sct',
          code: riskAssessmentData.codeCode || '',
          display: riskAssessmentData.code
        }],
        text: riskAssessmentData.code
      };
    } else {
      updates.code = riskAssessmentData.code;
    }
  }

  // Handle method (CodeableConcept)
  if (riskAssessmentData.method) {
    if (typeof riskAssessmentData.method === 'string') {
      updates.method = {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '',
          display: riskAssessmentData.method
        }],
        text: riskAssessmentData.method
      };
    } else {
      updates.method = riskAssessmentData.method;
    }
  }

  // Handle occurrenceDateTime
  if (riskAssessmentData.occurrenceDateTime) {
    updates.occurrenceDateTime = riskAssessmentData.occurrenceDateTime;
  }

  // Handle date
  if (riskAssessmentData.date) {
    updates.date = riskAssessmentData.date;
  }

  // Handle prediction
  if (riskAssessmentData.prediction) {
    if (typeof riskAssessmentData.prediction === 'string') {
      updates.prediction = [{
        outcome: {
          text: riskAssessmentData.prediction
        }
      }];
    } else if (Array.isArray(riskAssessmentData.prediction)) {
      updates.prediction = riskAssessmentData.prediction;
    } else {
      updates.prediction = [riskAssessmentData.prediction];
    }
  }

  // Handle basis
  if (riskAssessmentData.basis) {
    updates.basis = riskAssessmentData.basis;
  }

  // Handle note
  if (riskAssessmentData.note) {
    if (typeof riskAssessmentData.note === 'string') {
      updates.note = [{
        text: riskAssessmentData.note,
        time: new Date().toISOString()
      }];
    } else if (Array.isArray(riskAssessmentData.note)) {
      updates.note = riskAssessmentData.note;
    }
  }

  const result = await RiskAssessments.updateAsync(
    { _id: riskAssessmentId },
    { $set: updates }
  );

  context.log.info('[riskAssessments.update] Updated', { id: riskAssessmentId });
  return result;
});

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('riskAssessments.remove', {
  description: 'Remove a RiskAssessment by MongoDB _id',
  phi: true,
  positionalParams: ['riskAssessmentId'],
  schemaObject: {
    type: 'object',
    properties: { riskAssessmentId: { type: 'string' } },
    required: ['riskAssessmentId']
  }
}, async function(params, context) {
  const riskAssessmentId = params.riskAssessmentId;

  context.log.info('[riskAssessments.remove] Removing', { id: riskAssessmentId });

  const result = await RiskAssessments.removeAsync({ _id: riskAssessmentId });
  return result;
});

// BEHAVIOR CHANGE (flagged for review): pre-migration this method had NO auth
// guard (latent gap — it reads patient-scoped clinical data, and no pre-login
// caller was found in the codebase). requireAuth now applies (default true).
Meteor.ServerMethods.define('riskAssessments.findOne', {
  description: 'Fetch a single RiskAssessment by MongoDB _id',
  phi: true,
  positionalParams: ['riskAssessmentId'],
  schemaObject: {
    type: 'object',
    properties: { riskAssessmentId: { type: 'string' } },
    required: ['riskAssessmentId']
  }
}, async function(params) {
  const riskAssessment = await RiskAssessments.findOneAsync({ _id: params.riskAssessmentId });
  return riskAssessment;
});
