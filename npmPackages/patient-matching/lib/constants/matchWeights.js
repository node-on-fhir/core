// packages/patient-matching/lib/constants/matchWeights.js

/**
 * Demographic attribute weights for patient matching
 * Based on FHIR Identity Matching IG recommendations
 */

export const MATCH_WEIGHTS = {
  // Name attributes
  firstName: {
    weight: 1,
    matchTypes: ['exact', 'phonetic'],
    required: true
  },
  lastName: {
    weight: 2,
    matchTypes: ['exact', 'phonetic'],
    required: true
  },
  middleName: {
    weight: 0.5,
    matchTypes: ['exact', 'initial']
  },
  
  // Demographics
  dateOfBirth: {
    weight: 3,
    matchTypes: ['exact', 'yearMonth'],
    required: true
  },
  gender: {
    weight: 1,
    matchTypes: ['exact']
  },
  
  // Contact information
  address: {
    weight: 2,
    matchTypes: ['exact', 'streetAndCity', 'zipCode']
  },
  phone: {
    weight: 1,
    matchTypes: ['exact', 'lastFour'],
    mustBeVerified: true
  },
  email: {
    weight: 1,
    matchTypes: ['exact'],
    mustBeVerified: true
  },
  
  // Identifiers
  ssnLast4: {
    weight: 3,
    matchTypes: ['exact'],
    sensitive: true
  },
  stateId: {
    weight: 3,
    matchTypes: ['exact'],
    requiresIssuerMatch: true
  },
  insuranceMemberId: {
    weight: 2,
    matchTypes: ['exact'],
    requiresPayerMatch: true
  },
  digitalIdentifier: {
    weight: 5,
    matchTypes: ['exact'],
    requiresAAL2: true
  }
};

// Confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  B2B: 0.85,              // 85% match confidence
  CONSUMER: 0.95,         // 95% match confidence
  UNCERTAIN_MATCH: 0.70,  // Below this is no match
  CERTAIN_MATCH: 0.95     // Above this is certain match
};

// L0, L1, L2 patient level requirements
export const PATIENT_LEVELS = {
  L0: {
    minWeight: 9,
    minAttributes: 4
  },
  L1: {
    minWeight: 10,
    minAttributes: 5
  },
  L2: {
    minWeight: 12,
    minAttributes: 6,
    requiresDigitalId: true
  }
};