// packages/patient-matching/lib/constants/identityLevels.js

/**
 * Identity Assurance Levels based on NIST 800-63A
 * and the FHIR Identity Matching Implementation Guide
 */

export const IDENTITY_LEVELS = {
  // Basic identity verification
  IDIAL1: {
    code: 'idial1',
    display: 'Identity Assurance Level 1',
    description: 'Basic identity verification',
    minAttributes: 3,
    minWeight: 6
  },
  
  // Enhanced verification
  IDIAL1_5: {
    code: 'idial1.5',
    display: 'Identity Assurance Level 1.5',
    description: 'Enhanced identity verification',
    minAttributes: 4,
    minWeight: 8
  },
  
  // High assurance - minimum for consumer PHI
  IDIAL1_8: {
    code: 'idial1.8',
    display: 'Identity Assurance Level 1.8',
    description: 'High identity assurance',
    minAttributes: 5,
    minWeight: 10,
    requiresVerifiedEmail: true,
    requiresVerifiedPhone: true
  },
  
  // Highest assurance
  IDIAL2: {
    code: 'idial2',
    display: 'Identity Assurance Level 2',
    description: 'Highest identity assurance with in-person proofing',
    minAttributes: 6,
    minWeight: 12,
    requiresInPersonProofing: true,
    requiresGovernmentId: true
  }
};

// Minimum level for different use cases
export const MINIMUM_LEVELS = {
  B2B: 'idial1',
  CONSUMER_READ: 'idial1.8',
  CONSUMER_WRITE: 'idial2'
};