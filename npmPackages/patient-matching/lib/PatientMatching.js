// packages/patient-matching/lib/PatientMatching.js

/**
 * Patient Matching Package
 * 
 * Implements the FHIR Identity Matching Implementation Guide
 * for secure, interoperable patient matching across organizations
 */

export const PatientMatching = {
  // Version aligned with FHIR IG
  version: '2.0.0-ballot',
  
  // Identity Assurance Levels
  IdentityLevels: {
    IDIAL1: 'idial1',
    IDIAL1_5: 'idial1.5',
    IDIAL1_8: 'idial1.8',
    IDIAL2: 'idial2'
  },
  
  // Patient profile levels
  PatientLevels: {
    L0: 'L0', // Combined weight >= 9
    L1: 'L1', // Combined weight >= 10
    L2: 'L2'  // Highest identity assurance
  },
  
  // Match confidence thresholds
  MatchConfidence: {
    B2B_THRESHOLD: 0.85,      // 85% confidence for B2B
    CONSUMER_THRESHOLD: 0.95  // 95% confidence for consumer
  },
  
  // Initialize the package
  initialize: function() {
    if (Meteor.isServer) {
      console.log('PatientMatching: Initializing FHIR Identity Matching package v' + this.version); // phi-audit: ok
    }
  }
};

// Auto-initialize on startup
if (Meteor.isServer) {
  Meteor.startup(function() {
    PatientMatching.initialize();
  });
}