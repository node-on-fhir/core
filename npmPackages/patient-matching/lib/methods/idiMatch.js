// packages/patient-matching/lib/methods/idiMatch.js
//
// rpc-migration: Meteor.methods -> Meteor.ServerMethods.define (npmPackages
// exemplar — GLOBAL Meteor.ServerMethods). Legacy 'PatientMatching.idiMatch'
// renamed to 'patientMatching.idiMatch' + alias. Guard-less pre-migration; this
// is the public IDI $match operation (matches a supplied Patient against the DB)
// — kept requireAuth: false to preserve the pre-migration REST/anonymous match
// posture, but it reads the Patients collection so phi: true.
import { Meteor } from 'meteor/meteor';
import { MatchingAlgorithm } from '../utils/matchingAlgorithm';
import { DigitalIdGenerator } from '../utils/digitalIdGenerator';

Meteor.ServerMethods.define('patientMatching.idiMatch', {
  description: 'Run an IDI probabilistic $match against candidate Patient records and return a FHIR searchset Bundle',
  aliases: ['PatientMatching.idiMatch'],
  phi: true,
  // Pre-migration behavior: no auth guard (IDI $match is exposed via the FHIR
  // REST endpoint). Preserved as public; the endpoint itself enforces AAL2.
  requireAuth: false,
  positionalParams: ['options'],
  schemaObject: {
    type: 'object',
    properties: {
      options: {
        type: 'object',
        properties: {
          patient: { type: 'object' },
          onlyCertainMatches: { type: 'boolean' },
          maxResults: { type: 'number' },
          minIAL: { type: 'string' }
        },
        required: ['patient']
      }
    },
    required: ['options']
  }
}, async function(params, context){
  const options = params.options || {};
  context.log.info('patientMatching.idiMatch called');

  const { patient, onlyCertainMatches = false, maxResults = 10, minIAL } = options;

  try {
    // Get Patients collection
    const Patients = Meteor.Collections?.Patients;

    if (!Patients) {
      throw new Meteor.Error(500, 'Patients collection not available');
    }

    // Build query to find potential matches
    const query = { _id: { $exists: true } };

    // Add query conditions based on patient data
    if (patient.identifier?.length > 0) {
      query['$or'] = patient.identifier.map(id => ({
        'identifier': {
          $elemMatch: {
            system: id.system,
            value: id.value
          }
        }
      }));
    }

    // Find candidates
    const candidates = await Patients.find(query, { limit: maxResults * 2 }).fetchAsync();
    context.log.debug('Found candidate patients for matching', { count: candidates.length });

    // Score each candidate
    const matchResults = [];

    for (const candidate of candidates) {
      const matchScore = MatchingAlgorithm.calculateMatchScore(patient, candidate);

      if (onlyCertainMatches && matchScore.confidence !== 'certain') {
        continue;
      }

      matchResults.push({
        patient: candidate,
        score: matchScore.score,
        confidence: matchScore.confidence,
        details: matchScore.details
      });
    }

    // Sort by score
    matchResults.sort((a, b) => b.score - a.score);

    // Limit results
    const limitedResults = matchResults.slice(0, maxResults);

    // Create FHIR Bundle response
    const bundle = {
      resourceType: 'Bundle',
      id: DigitalIdGenerator.generateMatchRequestId(),
      type: 'searchset',
      timestamp: new Date().toISOString(),
      total: limitedResults.length,
      entry: limitedResults.map(result => ({
        fullUrl: `Patient/${result.patient.id || result.patient._id}`,
        resource: result.patient,
        search: {
          mode: 'match',
          score: result.score,
          extension: [{
            url: 'http://hl7.org/fhir/StructureDefinition/match-confidence',
            valueCode: result.confidence
          }]
        }
      }))
    };

    // Log match operation
    if (Meteor.isServer && global.PatientMatchingConfig?.enableAuditLog) {
      context.log.phi('Audit log: Patient match operation', { userId: context.userId, timestamp: new Date(), matchCriteria: patient, resultsCount: limitedResults.length, topMatchScore: limitedResults[0]?.score }, { action: 'search' });
    }

    return {
      success: true,
      bundle,
      matchCount: limitedResults.length,
      timestamp: new Date()
    };
  } catch (error) {
    context.log.error('Error in patientMatching.idiMatch', { error: error?.message });
    throw new Meteor.Error(500, `Match operation failed: ${error.message}`);
  }
});
