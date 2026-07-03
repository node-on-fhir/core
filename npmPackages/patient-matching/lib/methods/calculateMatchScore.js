// packages/patient-matching/lib/methods/calculateMatchScore.js
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { MatchingAlgorithm } from '../utils/matchingAlgorithm';

Meteor.methods({
  async 'PatientMatching.calculateMatchScore'(patient1, patient2, options = {}) {
    console.log('PatientMatching.calculateMatchScore called'); // phi-audit: ok
    
    // Validate input
    check(patient1, Object);
    check(patient2, Object);
    check(options, {
      weights: Match.Optional(Object),
      includeDetails: Match.Optional(Boolean)
    });
    
    try {
      // Use the matching algorithm utility
      const matchResult = MatchingAlgorithm.calculateMatchScore(patient1, patient2, options);
      
      console.log('Match score calculated:', {
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
      console.error('Error calculating match score:', error);
      throw new Meteor.Error(500, `Failed to calculate match score: ${error.message}`);
    }
  }
});