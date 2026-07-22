// imports/api/clinicalImpressions/methods.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';

import { ClinicalImpressions } from '/imports/lib/schemas/SimpleSchemas/ClinicalImpressions';

Meteor.ServerMethods.define('clinicalImpressions.insert', {
  description: 'Create a new ClinicalImpression resource for a patient',
  phi: true,
  schemaObject: { type: 'object' }   // arbitrary FHIR ClinicalImpression shape
}, async function(params, context){
  const clinicalImpressionData = params;

  context.log.info('Creating clinical impression...');

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

  context.log.info('Inserting clinical impression', { _id: cleanClinicalImpression._id });

  const result = await ClinicalImpressions.insertAsync(cleanClinicalImpression);
  return result;
});

Meteor.ServerMethods.define('clinicalImpressions.update', {
  description: 'Update an existing ClinicalImpression resource by id',
  phi: true,
  positionalParams: ['clinicalImpressionId', 'clinicalImpressionData'],
  schemaObject: {
    type: 'object',
    properties: {
      clinicalImpressionId: { type: 'string' },
      clinicalImpressionData: { type: 'object' }
    },
    required: ['clinicalImpressionId', 'clinicalImpressionData']
  }
}, async function(params, context){
  const clinicalImpressionId = params.clinicalImpressionId;
  const clinicalImpressionData = params.clinicalImpressionData;

  context.log.info('Updating clinical impression', { clinicalImpressionId: clinicalImpressionId });

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

  context.log.info('Updated clinical impression', { clinicalImpressionId: clinicalImpressionId });
  return result;
});

Meteor.ServerMethods.define('clinicalImpressions.remove', {
  description: 'Delete a ClinicalImpression resource by id',
  phi: true,
  positionalParams: ['clinicalImpressionId'],
  schemaObject: {
    type: 'object',
    properties: {
      clinicalImpressionId: { type: 'string' }
    },
    required: ['clinicalImpressionId']
  }
}, async function(params, context){
  context.log.info('Removing clinical impression', { clinicalImpressionId: params.clinicalImpressionId });

  const result = await ClinicalImpressions.removeAsync({ _id: params.clinicalImpressionId });
  return result;
});

Meteor.ServerMethods.define('clinicalImpressions.findOne', {
  description: 'Fetch a single ClinicalImpression resource by id',
  phi: true,
  positionalParams: ['clinicalImpressionId'],
  schemaObject: {
    type: 'object',
    properties: {
      clinicalImpressionId: { type: 'string' }
    },
    required: ['clinicalImpressionId']
  }
  // Pre-migration this method had NO auth guard (latent bug — it reads
  // patient-scoped data). requireAuth now applies (default true).
}, async function(params){
  const clinicalImpression = await ClinicalImpressions.findOneAsync({ _id: params.clinicalImpressionId });
  return clinicalImpression;
});
