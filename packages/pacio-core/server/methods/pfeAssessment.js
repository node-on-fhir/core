// packages/pacio-core/server/methods/pfeAssessment.js
//
// Server methods for PFE (Personal Functioning and Engagement) assessment
// capture, storage, and derived Observation generation.

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { Random } from 'meteor/random';

const PFE_OBSERVATION_PROFILE = 'http://hl7.org/fhir/us/pacio-pfe/StructureDefinition/pfe-observation-single';
const PFE_COLLECTION_PROFILE = 'http://hl7.org/fhir/us/pacio-pfe/StructureDefinition/pfe-collection';
const PROMIS10_QUESTIONNAIRE_URL = 'http://loinc.org/q/61577-3';

Meteor.methods({
  /**
   * Submit a completed QuestionnaireResponse with PFE profile and generate derived Observations.
   */
  'pacio.pfeAssessment.submitResponse': async function(questionnaireResponse) {
    check(questionnaireResponse, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in to submit PFE assessments');
    }

    console.log('[pacio.pfeAssessment.submitResponse] Submitting PFE assessment');

    // Ensure the QR has required fields
    const qr = {
      resourceType: 'QuestionnaireResponse',
      id: get(questionnaireResponse, 'id', Random.id()),
      status: 'completed',
      questionnaire: get(questionnaireResponse, 'questionnaire', PROMIS10_QUESTIONNAIRE_URL),
      authored: get(questionnaireResponse, 'authored', new Date().toISOString()),
      subject: get(questionnaireResponse, 'subject', {}),
      author: get(questionnaireResponse, 'author', {
        reference: 'Practitioner/' + this.userId
      }),
      meta: {
        profile: ['http://hl7.org/fhir/us/pacio-pfe/StructureDefinition/pfe-questionnaire-response'],
        lastUpdated: new Date().toISOString()
      },
      item: get(questionnaireResponse, 'item', [])
    };

    qr._id = qr.id;

    // Store the QuestionnaireResponse
    const QuestionnaireResponses = get(global, 'Collections.QuestionnaireResponses');
    if (QuestionnaireResponses && typeof QuestionnaireResponses.insertAsync === 'function') {
      await QuestionnaireResponses.insertAsync(qr);
      console.log('[pacio.pfeAssessment.submitResponse] Stored QR:', qr._id);
    } else {
      console.warn('[pacio.pfeAssessment.submitResponse] QuestionnaireResponses collection not available');
    }

    // Generate derived Observations from answers
    const observations = generateDerivedObservations(qr);

    // Store observations
    const ObservationsCollection = get(global, 'Collections.Observations');
    if (ObservationsCollection && typeof ObservationsCollection.insertAsync === 'function') {
      for (let i = 0; i < observations.length; i++) {
        await ObservationsCollection.insertAsync(observations[i]);
      }
      console.log('[pacio.pfeAssessment.submitResponse] Stored ' + observations.length + ' derived observations');
    }

    return {
      questionnaireResponseId: qr._id,
      observationCount: observations.length,
      observationIds: observations.map(function(obs) { return obs._id; })
    };
  },

  /**
   * Get PFE assessments for a patient.
   */
  'pacio.pfeAssessment.getAssessments': async function(patientId) {
    check(patientId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    console.log('[pacio.pfeAssessment.getAssessments] Fetching for patient:', patientId);

    const QuestionnaireResponses = get(global, 'Collections.QuestionnaireResponses');
    if (!QuestionnaireResponses) {
      return [];
    }

    const query = {
      'subject.reference': { $in: ['Patient/' + patientId, 'urn:uuid:' + patientId] }
    };

    return await QuestionnaireResponses.find(query, { sort: { authored: -1 } }).fetchAsync();
  },

  /**
   * Generate a FHIR Bundle with QuestionnaireResponses and derived Observations for export.
   */
  'pacio.pfeAssessment.generateBundle': async function(patientId) {
    check(patientId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    console.log('[pacio.pfeAssessment.generateBundle] Generating bundle for patient:', patientId);

    const patientRef = 'Patient/' + patientId;
    const entries = [];

    // Get QuestionnaireResponses
    const QuestionnaireResponses = get(global, 'Collections.QuestionnaireResponses');
    if (QuestionnaireResponses) {
      const qrs = await QuestionnaireResponses.find({
        'subject.reference': { $in: [patientRef, 'urn:uuid:' + patientId] }
      }).fetchAsync();

      qrs.forEach(function(qr) {
        entries.push({
          fullUrl: 'urn:uuid:' + get(qr, 'id', qr._id),
          resource: qr,
          request: { method: 'POST', url: 'QuestionnaireResponse' }
        });
      });
    }

    // Get PFE Observations
    const Observations = get(global, 'Collections.Observations');
    if (Observations) {
      const obs = await Observations.find({
        'subject.reference': { $in: [patientRef, 'urn:uuid:' + patientId] },
        'meta.profile': { $in: [PFE_OBSERVATION_PROFILE, PFE_COLLECTION_PROFILE] }
      }).fetchAsync();

      obs.forEach(function(ob) {
        entries.push({
          fullUrl: 'urn:uuid:' + get(ob, 'id', ob._id),
          resource: ob,
          request: { method: 'POST', url: 'Observation' }
        });
      });
    }

    const bundle = {
      resourceType: 'Bundle',
      id: Random.id(),
      type: 'transaction',
      timestamp: new Date().toISOString(),
      entry: entries
    };

    return bundle;
  }
});

/**
 * Generate derived FHIR Observations from a QuestionnaireResponse.
 * Creates one Observation per answer item plus a collection Observation.
 */
function generateDerivedObservations(questionnaireResponse) {
  const observations = [];
  const items = get(questionnaireResponse, 'item', []);
  const subject = get(questionnaireResponse, 'subject', {});
  const authored = get(questionnaireResponse, 'authored', new Date().toISOString());

  // Track scores for T-score calculation
  let physicalHealthItems = [];
  let mentalHealthItems = [];

  items.forEach(function(item) {
    const linkId = get(item, 'linkId', '');
    const answerCoding = get(item, 'answer[0].valueCoding', null);
    const answerValue = get(item, 'answer[0]');

    if (!answerValue) return;

    // Extract ordinal value from coding extensions
    let ordinalValue = null;
    if (answerCoding) {
      const extensions = get(answerCoding, 'extension', []);
      const ordinalExt = extensions.find(function(ext) {
        return get(ext, 'url', '').includes('ordinalValue');
      });
      ordinalValue = get(ordinalExt, 'valueDecimal', null);
    }

    // Create individual observation
    const obsId = Random.id();
    const obs = {
      resourceType: 'Observation',
      _id: obsId,
      id: obsId,
      meta: {
        profile: [PFE_OBSERVATION_PROFILE],
        lastUpdated: new Date().toISOString()
      },
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'survey',
          display: 'Survey'
        }]
      }],
      code: {
        coding: get(item, 'code', [{ system: 'http://loinc.org', code: linkId }]),
        text: get(item, 'text', '')
      },
      subject: subject,
      effectiveDateTime: authored,
      derivedFrom: [{
        reference: 'QuestionnaireResponse/' + get(questionnaireResponse, 'id', questionnaireResponse._id)
      }]
    };

    // Set the value based on answer type
    if (answerCoding) {
      obs.valueCodeableConcept = {
        coding: [answerCoding],
        text: get(answerCoding, 'display', '')
      };
    } else if (get(answerValue, 'valueString')) {
      obs.valueString = answerValue.valueString;
    } else if (get(answerValue, 'valueInteger') !== undefined) {
      obs.valueInteger = answerValue.valueInteger;
    }

    observations.push(obs);

    // Categorize for T-score calculation
    // PROMIS-10: items 03, 06, 07, 08 are physical; items 02, 04, 05, 10 are mental
    // Item 01 is global health, 09 is social
    if (['promis10-03', 'promis10-06', 'promis10-07', 'promis10-08'].indexOf(linkId) !== -1) {
      physicalHealthItems.push(ordinalValue);
    }
    if (['promis10-02', 'promis10-04', 'promis10-05', 'promis10-10'].indexOf(linkId) !== -1) {
      mentalHealthItems.push(ordinalValue);
    }
  });

  // Create collection observation (summary with T-scores)
  const physicalRawScore = physicalHealthItems.reduce(function(sum, v) { return sum + (v || 0); }, 0);
  const mentalRawScore = mentalHealthItems.reduce(function(sum, v) { return sum + (v || 0); }, 0);

  const collectionId = Random.id();
  const collectionObs = {
    resourceType: 'Observation',
    _id: collectionId,
    id: collectionId,
    meta: {
      profile: [PFE_COLLECTION_PROFILE],
      lastUpdated: new Date().toISOString()
    },
    status: 'final',
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'survey',
        display: 'Survey'
      }]
    }],
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '61577-3',
        display: 'PROMIS-10 Global Health'
      }],
      text: 'PROMIS-10 Global Health'
    },
    subject: subject,
    effectiveDateTime: authored,
    component: [
      {
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '71969-0',
            display: 'PROMIS-10 Global Physical Health score'
          }],
          text: 'Global Physical Health T-Score'
        },
        valueQuantity: {
          value: physicalRawScore,
          unit: '{score}',
          system: 'http://unitsofmeasure.org',
          code: '{score}'
        }
      },
      {
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '71967-4',
            display: 'PROMIS-10 Global Mental Health score'
          }],
          text: 'Global Mental Health T-Score'
        },
        valueQuantity: {
          value: mentalRawScore,
          unit: '{score}',
          system: 'http://unitsofmeasure.org',
          code: '{score}'
        }
      }
    ],
    hasMember: observations.map(function(obs) {
      return { reference: 'Observation/' + obs.id };
    }),
    derivedFrom: [{
      reference: 'QuestionnaireResponse/' + get(questionnaireResponse, 'id', questionnaireResponse._id)
    }]
  };

  observations.push(collectionObs);

  return observations;
}
