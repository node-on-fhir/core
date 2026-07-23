// npmPackages/social-determinants/server/methods.js
//
// rpc-migration (Loop 1): converted to Meteor.ServerMethods.define (global
// registry). The legacy names ('social-determinants.screening.submit',
// 'social-determinants.assessment.getRiskFactors') contain a hyphen in the
// first segment, which fails the canonical dotted-name regex, so they are
// re-registered under the camelCase `socialDeterminants.*` namespace with the
// hyphenated names kept as aliases (via aliasIfFree, so no collision with core).
// Guards deleted in favor of requireAuth (default true); check() -> schemaObject;
// positional args -> positionalParams. phi:true — SDOH screening + risk
// assessment are patient clinical data.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Offer a legacy alias only when the name isn't already claimed elsewhere.
function aliasIfFree(legacyName){
  const handlers = (Meteor.server && Meteor.server.method_handlers) || {};
  if (handlers[legacyName]) {
    console.log('[social-determinants] legacy name already defined, no alias:', legacyName);
    return [];
  }
  return [legacyName];
}

Meteor.ServerMethods.define('socialDeterminants.screening.submit', {
  description: 'Submit an SDOH screening as a QuestionnaireResponse + derived Observations',
  phi: true,
  aliases: aliasIfFree('social-determinants.screening.submit'),
  positionalParams: ['screeningData'],
  schemaObject: {
    type: 'object',
    properties: {
      screeningData: {
        type: 'object',
        properties: {
          patientId: { type: 'string' },
          questionnaireId: { type: 'string' },
          responses: { type: 'array' },
          encounterId: { type: 'string' }
        },
        required: ['patientId', 'questionnaireId', 'responses']
      }
    },
    required: ['screeningData']
  }
}, async function(params, context){
  const screeningData = get(params, 'screeningData');

  try {
    const Observations = await global.Collections.Observations;
    const QuestionnaireResponses = await global.Collections.QuestionnaireResponses;

    // Create QuestionnaireResponse first
    const questionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      subject: {
        reference: `Patient/${screeningData.patientId}`
      },
      questionnaire: screeningData.questionnaireId,
      authored: new Date().toISOString(),
      item: screeningData.responses,
      meta: {
        tag: [{
          system: 'http://hl7.org/fhir/us/sdoh-clinicalcare/CodeSystem/SDOHCC-CodeSystemTemporaryCodes',
          code: 'sdoh-category-unspecified'
        }]
      }
    };

    const responseId = await QuestionnaireResponses.insertAsync(questionnaireResponse);

    // Transform responses to SDOH Observations
    const observations = [];
    for (const response of screeningData.responses) {
      if (response.answer && response.answer.length > 0) {
        const observation = {
          resourceType: 'Observation',
          status: 'final',
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'social-history'
            }]
          }, {
            coding: [{
              system: 'http://hl7.org/fhir/us/sdoh-clinicalcare/CodeSystem/SDOHCC-CodeSystemTemporaryCodes',
              code: 'sdoh-category-unspecified'
            }]
          }],
          subject: {
            reference: `Patient/${screeningData.patientId}`
          },
          effectiveDateTime: new Date().toISOString(),
          derivedFrom: [{
            reference: `QuestionnaireResponse/${responseId}`
          }],
          code: response.linkId ? {
            coding: [{
              system: 'http://loinc.org',
              code: response.linkId
            }]
          } : undefined,
          valueCodeableConcept: response.answer[0].valueCoding ? {
            coding: [response.answer[0].valueCoding]
          } : undefined,
          valueString: response.answer[0].valueString || undefined
        };

        const obsId = await Observations.insertAsync(observation);
        observations.push(obsId);
      }
    }

    return {
      questionnaireResponseId: responseId,
      observationIds: observations
    };

  } catch (error) {
    console.error('Error submitting SDOH screening:', error);
    throw new Meteor.Error('submission-failed', 'Failed to submit screening data');
  }
});

Meteor.ServerMethods.define('socialDeterminants.assessment.getRiskFactors', {
  description: 'Derive SDOH risk factors from a patient\'s social-history Observations',
  phi: true,
  aliases: aliasIfFree('social-determinants.assessment.getRiskFactors'),
  positionalParams: ['patientId'],
  schemaObject: {
    type: 'object',
    properties: { patientId: { type: 'string' } },
    required: ['patientId']
  }
}, async function(params, context){
  const patientId = get(params, 'patientId');

  try {
    const Observations = await global.Collections.Observations;

    // Find SDOH-related observations
    const sdohObservations = await Observations.findAsync({
      'subject.reference': `Patient/${patientId}`,
      'category.coding.system': 'http://terminology.hl7.org/CodeSystem/observation-category',
      'category.coding.code': 'social-history'
    }).fetchAsync();

    // Analyze risk patterns
    const riskFactors = [];
    const categories = {};

    for (const obs of sdohObservations) {
      const categoryCode = get(obs, 'category.1.coding.0.code', 'unspecified');
      if (!categories[categoryCode]) {
        categories[categoryCode] = [];
      }
      categories[categoryCode].push(obs);
    }

    // Generate risk assessment
    Object.keys(categories).forEach(category => {
      const observations = categories[category];
      const riskLevel = observations.length > 2 ? 'high' : observations.length > 1 ? 'moderate' : 'low';

      riskFactors.push({
        category: category,
        count: observations.length,
        riskLevel: riskLevel,
        observations: observations.map(obs => obs._id)
      });
    });

    return riskFactors;

  } catch (error) {
    console.error('Error analyzing risk factors:', error);
    throw new Meteor.Error('analysis-failed', 'Failed to analyze risk factors');
  }
});
