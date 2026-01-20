// imports/api/clinicalImpressions/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';

import { ClinicalImpressions } from '/imports/lib/schemas/SimpleSchemas/ClinicalImpressions';

Meteor.methods({
  'clinicalImpressions.insert': async function(clinicalImpressionData) {
    check(clinicalImpressionData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create a clinical impression');
    }

    console.log('[clinicalImpressions.insert] Creating clinical impression...');

    const cleanClinicalImpression = {
      resourceType: 'ClinicalImpression',
      id: Random.id(),
      status: get(clinicalImpressionData, 'status', 'in-progress'),
      description: get(clinicalImpressionData, 'description', ''),
      summary: get(clinicalImpressionData, 'summary', ''),
      subject: get(clinicalImpressionData, 'subject', {}),
      date: get(clinicalImpressionData, 'date', new Date().toISOString()),
      effectiveDateTime: get(clinicalImpressionData, 'effectiveDateTime', '')
    };

    // Set _id to match id
    cleanClinicalImpression._id = cleanClinicalImpression.id;

    // Handle subject reference (patient)
    if (clinicalImpressionData.subject) {
      if (typeof clinicalImpressionData.subject === 'string') {
        cleanClinicalImpression.subject = {
          reference: 'Patient/' + clinicalImpressionData.subject,
          display: get(clinicalImpressionData, 'subjectDisplay', '')
        };
      } else {
        cleanClinicalImpression.subject = clinicalImpressionData.subject;
      }
    }

    // Handle assessor reference (practitioner)
    if (clinicalImpressionData.assessor) {
      if (typeof clinicalImpressionData.assessor === 'string') {
        cleanClinicalImpression.assessor = {
          reference: 'Practitioner/' + clinicalImpressionData.assessor,
          display: get(clinicalImpressionData, 'assessorDisplay', '')
        };
      } else {
        cleanClinicalImpression.assessor = clinicalImpressionData.assessor;
      }
    }

    // Handle encounter reference
    if (clinicalImpressionData.encounter) {
      if (typeof clinicalImpressionData.encounter === 'string') {
        cleanClinicalImpression.encounter = {
          reference: 'Encounter/' + clinicalImpressionData.encounter,
          display: get(clinicalImpressionData, 'encounterDisplay', '')
        };
      } else {
        cleanClinicalImpression.encounter = clinicalImpressionData.encounter;
      }
    }

    // Handle code (CodeableConcept)
    if (clinicalImpressionData.code) {
      if (typeof clinicalImpressionData.code === 'string') {
        cleanClinicalImpression.code = {
          coding: [{
            system: 'http://snomed.info/sct',
            code: clinicalImpressionData.codeCode || '',
            display: clinicalImpressionData.code
          }],
          text: clinicalImpressionData.code
        };
      } else {
        cleanClinicalImpression.code = clinicalImpressionData.code;
      }
    }

    // Handle statusReason (CodeableConcept)
    if (clinicalImpressionData.statusReason) {
      if (typeof clinicalImpressionData.statusReason === 'string') {
        cleanClinicalImpression.statusReason = {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '',
            display: clinicalImpressionData.statusReason
          }],
          text: clinicalImpressionData.statusReason
        };
      } else {
        cleanClinicalImpression.statusReason = clinicalImpressionData.statusReason;
      }
    }

    // Handle problem references
    if (clinicalImpressionData.problem && Array.isArray(clinicalImpressionData.problem)) {
      cleanClinicalImpression.problem = clinicalImpressionData.problem;
    }

    // Handle finding array
    if (clinicalImpressionData.finding && Array.isArray(clinicalImpressionData.finding)) {
      cleanClinicalImpression.finding = clinicalImpressionData.finding;
    }

    // Handle note (Annotation)
    if (clinicalImpressionData.note) {
      if (typeof clinicalImpressionData.note === 'string') {
        cleanClinicalImpression.note = [{
          text: clinicalImpressionData.note,
          time: new Date().toISOString()
        }];
      } else if (Array.isArray(clinicalImpressionData.note)) {
        cleanClinicalImpression.note = clinicalImpressionData.note;
      }
    }

    // Handle protocol
    if (clinicalImpressionData.protocol) {
      if (Array.isArray(clinicalImpressionData.protocol)) {
        cleanClinicalImpression.protocol = clinicalImpressionData.protocol;
      } else {
        cleanClinicalImpression.protocol = [clinicalImpressionData.protocol];
      }
    }

    // Handle prognosis
    if (clinicalImpressionData.prognosisCodeableConcept) {
      cleanClinicalImpression.prognosisCodeableConcept = clinicalImpressionData.prognosisCodeableConcept;
    }

    if (clinicalImpressionData.prognosisReference) {
      cleanClinicalImpression.prognosisReference = clinicalImpressionData.prognosisReference;
    }

    // Handle supportingInfo
    if (clinicalImpressionData.supportingInfo) {
      cleanClinicalImpression.supportingInfo = clinicalImpressionData.supportingInfo;
    }

    console.log('[clinicalImpressions.insert] Inserting:', cleanClinicalImpression._id);

    const result = await ClinicalImpressions.insertAsync(cleanClinicalImpression);
    return result;
  },

  'clinicalImpressions.update': async function(clinicalImpressionId, clinicalImpressionData) {
    check(clinicalImpressionId, String);
    check(clinicalImpressionData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update a clinical impression');
    }

    console.log('[clinicalImpressions.update] Updating:', clinicalImpressionId);

    const existing = await ClinicalImpressions.findOneAsync({ _id: clinicalImpressionId });
    if (!existing) {
      throw new Meteor.Error('not-found', 'Clinical impression not found');
    }

    const updates = {
      status: get(clinicalImpressionData, 'status', existing.status),
      description: get(clinicalImpressionData, 'description', existing.description),
      summary: get(clinicalImpressionData, 'summary', existing.summary)
    };

    // Handle subject reference (patient)
    if (clinicalImpressionData.subject) {
      if (typeof clinicalImpressionData.subject === 'string') {
        updates.subject = {
          reference: 'Patient/' + clinicalImpressionData.subject,
          display: get(clinicalImpressionData, 'subjectDisplay', '')
        };
      } else {
        updates.subject = clinicalImpressionData.subject;
      }
    }

    // Handle assessor reference
    if (clinicalImpressionData.assessor) {
      if (typeof clinicalImpressionData.assessor === 'string') {
        updates.assessor = {
          reference: 'Practitioner/' + clinicalImpressionData.assessor,
          display: get(clinicalImpressionData, 'assessorDisplay', '')
        };
      } else {
        updates.assessor = clinicalImpressionData.assessor;
      }
    }

    // Handle encounter reference
    if (clinicalImpressionData.encounter) {
      if (typeof clinicalImpressionData.encounter === 'string') {
        updates.encounter = {
          reference: 'Encounter/' + clinicalImpressionData.encounter,
          display: get(clinicalImpressionData, 'encounterDisplay', '')
        };
      } else {
        updates.encounter = clinicalImpressionData.encounter;
      }
    }

    // Handle code (CodeableConcept)
    if (clinicalImpressionData.code) {
      if (typeof clinicalImpressionData.code === 'string') {
        updates.code = {
          coding: [{
            system: 'http://snomed.info/sct',
            code: clinicalImpressionData.codeCode || '',
            display: clinicalImpressionData.code
          }],
          text: clinicalImpressionData.code
        };
      } else {
        updates.code = clinicalImpressionData.code;
      }
    }

    // Handle effectiveDateTime
    if (clinicalImpressionData.effectiveDateTime) {
      updates.effectiveDateTime = clinicalImpressionData.effectiveDateTime;
    }

    // Handle date
    if (clinicalImpressionData.date) {
      updates.date = clinicalImpressionData.date;
    }

    // Handle problem references
    if (clinicalImpressionData.problem) {
      updates.problem = clinicalImpressionData.problem;
    }

    // Handle finding
    if (clinicalImpressionData.finding) {
      updates.finding = clinicalImpressionData.finding;
    }

    // Handle note
    if (clinicalImpressionData.note) {
      if (typeof clinicalImpressionData.note === 'string') {
        updates.note = [{
          text: clinicalImpressionData.note,
          time: new Date().toISOString()
        }];
      } else if (Array.isArray(clinicalImpressionData.note)) {
        updates.note = clinicalImpressionData.note;
      }
    }

    // Handle protocol
    if (clinicalImpressionData.protocol) {
      if (Array.isArray(clinicalImpressionData.protocol)) {
        updates.protocol = clinicalImpressionData.protocol;
      } else {
        updates.protocol = [clinicalImpressionData.protocol];
      }
    }

    const result = await ClinicalImpressions.updateAsync(
      { _id: clinicalImpressionId },
      { $set: updates }
    );

    console.log('[clinicalImpressions.update] Updated:', clinicalImpressionId);
    return result;
  },

  'clinicalImpressions.remove': async function(clinicalImpressionId) {
    check(clinicalImpressionId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to delete a clinical impression');
    }

    console.log('[clinicalImpressions.remove] Removing:', clinicalImpressionId);

    const result = await ClinicalImpressions.removeAsync({ _id: clinicalImpressionId });
    return result;
  },

  'clinicalImpressions.findOne': async function(clinicalImpressionId) {
    check(clinicalImpressionId, String);

    const clinicalImpression = await ClinicalImpressions.findOneAsync({ _id: clinicalImpressionId });
    return clinicalImpression;
  }
});
