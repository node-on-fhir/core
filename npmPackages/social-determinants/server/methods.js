// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/social-determinants/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get, set } from 'lodash';

Meteor.methods({
  'social-determinants.screening.submit': async function(screeningData) {
    check(screeningData, {
      patientId: String,
      questionnaireId: String,
      responses: Array,
      encounterId: Match.Optional(String)
    });

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }

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
  },

  'social-determinants.assessment.getRiskFactors': async function(patientId) {
    check(patientId, String);

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }

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
  }
});