// imports/api/riskAssessments/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';

import { RiskAssessments } from '/imports/lib/schemas/SimpleSchemas/RiskAssessments';

Meteor.methods({
  'riskAssessments.insert': async function(riskAssessmentData) {
    check(riskAssessmentData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create a risk assessment');
    }

    console.log('[riskAssessments.insert] Creating risk assessment...');

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

    console.log('[riskAssessments.insert] Inserting:', cleanRiskAssessment._id);

    const result = await RiskAssessments.insertAsync(cleanRiskAssessment);
    return result;
  },

  'riskAssessments.update': async function(riskAssessmentId, riskAssessmentData) {
    check(riskAssessmentId, String);
    check(riskAssessmentData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update a risk assessment');
    }

    console.log('[riskAssessments.update] Updating:', riskAssessmentId);

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

    console.log('[riskAssessments.update] Updated:', riskAssessmentId);
    return result;
  },

  'riskAssessments.remove': async function(riskAssessmentId) {
    check(riskAssessmentId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to delete a risk assessment');
    }

    console.log('[riskAssessments.remove] Removing:', riskAssessmentId);

    const result = await RiskAssessments.removeAsync({ _id: riskAssessmentId });
    return result;
  },

  'riskAssessments.findOne': async function(riskAssessmentId) {
    check(riskAssessmentId, String);

    const riskAssessment = await RiskAssessments.findOneAsync({ _id: riskAssessmentId });
    return riskAssessment;
  }
});
