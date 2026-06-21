// packages/patient-matching/lib/schemas/DigitalIdentifier.js
import SimpleSchema from 'simpl-schema';

// Digital Identifier Schema - Enhanced identifier with verification metadata
export const DigitalIdentifierSchema = new SimpleSchema({
  use: {
    type: String,
    allowedValues: ['usual', 'official', 'temp', 'secondary', 'old'],
    optional: true
  },
  type: {
    type: Object,
    optional: true
  },
  'type.coding': {
    type: Array,
    optional: true
  },
  'type.coding.$': {
    type: Object,
    blackbox: true
  },
  'type.text': {
    type: String,
    optional: true
  },
  system: {
    type: String,
    optional: true
  },
  value: {
    type: String,
    optional: true
  },
  period: {
    type: Object,
    optional: true
  },
  'period.start': {
    type: Date,
    optional: true
  },
  'period.end': {
    type: Date,
    optional: true
  },
  assigner: {
    type: Object,
    blackbox: true,
    optional: true
  },
  
  // Digital identity extensions
  extension: {
    type: Array,
    optional: true
  },
  'extension.$': {
    type: Object
  },
  'extension.$.url': {
    type: String
  },
  'extension.$.valueCode': {
    type: String,
    optional: true
  },
  'extension.$.valueString': {
    type: String,
    optional: true
  },
  'extension.$.valueDateTime': {
    type: Date,
    optional: true
  },
  'extension.$.valueReference': {
    type: Object,
    blackbox: true,
    optional: true
  }
});

// Verification status codes
export const VerificationStatus = {
  VERIFIED: 'verified',
  UNVERIFIED: 'unverified',
  PENDING: 'pending',
  FAILED: 'failed',
  EXPIRED: 'expired'
};

// Verification methods
export const VerificationMethods = {
  MANUAL: 'manual',
  AUTOMATED: 'automated',
  IN_PERSON: 'in-person',
  REMOTE: 'remote',
  DOCUMENT_UPLOAD: 'document-upload',
  BIOMETRIC: 'biometric',
  TWO_FACTOR: 'two-factor'
};

// Identity systems
export const IdentitySystems = {
  SSN: 'http://hl7.org/fhir/sid/us-ssn',
  PASSPORT: 'http://hl7.org/fhir/sid/passport',
  DRIVERS_LICENSE: 'http://hl7.org/fhir/sid/us-dl',
  MEDICARE: 'http://hl7.org/fhir/sid/us-medicare',
  MRN: 'http://hospital.org/mrn',
  NATIONAL_ID: 'http://hl7.org/fhir/sid/national-id'
};

export default DigitalIdentifierSchema;