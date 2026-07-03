// packages/patient-matching/lib/methods/idiMatch.js
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { MatchingAlgorithm } from '../utils/matchingAlgorithm';
import { DigitalIdGenerator } from '../utils/digitalIdGenerator';

const log = (Meteor.Logger ? Meteor.Logger.for('idiMatch') : console);

Meteor.methods({
  async 'PatientMatching.idiMatch'(options = {}) {
    console.log('PatientMatching.idiMatch called'); // phi-audit: ok
    
    // Validate input
    check(options, {
      patient: Object,
      onlyCertainMatches: Match.Optional(Boolean),
      maxResults: Match.Optional(Number),
      minIAL: Match.Optional(String)
    });
    
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
      log.debug('Found candidate patients for matching', { count: candidates.length });
      
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
        log.phi('Audit log: Patient match operation', { userId: this.userId, timestamp: new Date(), matchCriteria: patient, resultsCount: limitedResults.length, topMatchScore: limitedResults[0]?.score }, { action: 'search' });
      }
      
      return {
        success: true,
        bundle,
        matchCount: limitedResults.length,
        timestamp: new Date()
      };
      
    } catch (error) {
      log.error('Error in PatientMatching.idiMatch', { error: error?.message });
      throw new Meteor.Error(500, `Match operation failed: ${error.message}`);
    }
  }
});