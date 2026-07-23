// packages/patient-matching/lib/methods/calculateMatchScore.js
//
// rpc-migration: converted Meteor.methods -> Meteor.ServerMethods.define
// (npmPackages exemplar — GLOBAL Meteor.ServerMethods, no import). Legacy name
// 'PatientMatching.calculateMatchScore' starts uppercase (invalid canonical);
// renamed to 'patientMatching.calculateMatchScore' + alias. No auth guard
// historically — kept requireAuth: false (scoring compares two supplied FHIR
// Patient objects; identity comparison is a pure computation, no DB/PHI store
// read). phi: true — patient demographics flow through the params.
import { Meteor } from 'meteor/meteor';
import { MatchingAlgorithm } from '../utils/matchingAlgorithm';

Meteor.ServerMethods.define('patientMatching.calculateMatchScore', {
  description: 'Compute a probabilistic match score/confidence between two FHIR Patient records',
  aliases: ['PatientMatching.calculateMatchScore'],
  phi: true,
  // Guard-less pre-migration and called from an unauthenticated comparison UI;
  // pure computation over supplied objects (no DB read/write). Kept public.
  requireAuth: false,
  positionalParams: ['patient1', 'patient2', 'options'],
  schemaObject: {
    type: 'object',
    properties: {
      patient1: { type: 'object' },
      patient2: { type: 'object' },
      options: {
        type: 'object',
        properties: {
          weights: { type: 'object' },
          includeDetails: { type: 'boolean' }
        }
      }
    },
    required: ['patient1', 'patient2']
  }
}, async function(params, context){
  const patient1 = params.patient1;
  const patient2 = params.patient2;
  const options = params.options || {};

  context.log.info('patientMatching.calculateMatchScore called');

  try {
    // Use the matching algorithm utility
    const matchResult = MatchingAlgorithm.calculateMatchScore(patient1, patient2, options);

    context.log.info('Match score calculated', {
      score: matchResult.score,
      confidence: matchResult.confidence
    });

    if (options.includeDetails) {
      return matchResult;
    } else {
      return {
        score: matchResult.score,
        confidence: matchResult.confidence
      };
    }
  } catch (error) {
    context.log.error('Error calculating match score', { error: error.message });
    throw new Meteor.Error(500, `Failed to calculate match score: ${error.message}`);
  }
});
