// packages/patient-matching/lib/schemas/IdiPatient.js
import SimpleSchema from 'simpl-schema';

// IDI Patient Schema - Enhanced Patient resource for identity matching
export const IdiPatientSchema = new SimpleSchema({
  resourceType: {
    type: String,
    defaultValue: 'Patient'
  },
  id: {
    type: String,
    optional: true
  },
  meta: {
    type: Object,
    optional: true,
    blackbox: true
  },
  identifier: {
    type: Array,
    optional: true,
    minCount: 1
  },
  'identifier.$': {
    type: Object,
    blackbox: true
  },
  active: {
    type: Boolean,
    defaultValue: true
  },
  name: {
    type: Array,
    optional: true,
    minCount: 1
  },
  'name.$': {
    type: Object,
    blackbox: true
  },
  telecom: {
    type: Array,
    optional: true
  },
  'telecom.$': {
    type: Object,
    blackbox: true
  },
  gender: {
    type: String,
    allowedValues: ['male', 'female', 'other', 'unknown'],
    optional: true
  },
  birthDate: {
    type: String,
    optional: true
  },
  deceasedBoolean: {
    type: Boolean,
    optional: true
  },
  deceasedDateTime: {
    type: String,
    optional: true
  },
  address: {
    type: Array,
    optional: true
  },
  'address.$': {
    type: Object,
    blackbox: true
  },
  maritalStatus: {
    type: Object,
    blackbox: true,
    optional: true
  },
  multipleBirthBoolean: {
    type: Boolean,
    optional: true
  },
  multipleBirthInteger: {
    type: SimpleSchema.Integer,
    optional: true
  },
  photo: {
    type: Array,
    optional: true
  },
  'photo.$': {
    type: Object,
    blackbox: true
  },
  contact: {
    type: Array,
    optional: true
  },
  'contact.$': {
    type: Object,
    blackbox: true
  },
  communication: {
    type: Array,
    optional: true
  },
  'communication.$': {
    type: Object,
    blackbox: true
  },
  generalPractitioner: {
    type: Array,
    optional: true
  },
  'generalPractitioner.$': {
    type: Object,
    blackbox: true
  },
  managingOrganization: {
    type: Object,
    blackbox: true,
    optional: true
  },
  link: {
    type: Array,
    optional: true
  },
  'link.$': {
    type: Object,
    blackbox: true
  },
  
  // IDI-specific extensions
  extension: {
    type: Array,
    optional: true
  },
  'extension.$': {
    type: Object,
    blackbox: true
  }
});

// Identity assurance levels
export const IdentityAssuranceLevels = {
  IAL1: 'ial1', // Self-asserted identity
  IAL2: 'ial2', // Remote or in-person proofed identity
  IAL3: 'ial3'  // In-person proofed identity with biometric
};

// Digital identifier types
export const DigitalIdentifierTypes = {
  DRIVERS_LICENSE: 'DL',
  PASSPORT: 'PPN',
  NATIONAL_ID: 'NI',
  HEALTH_CARD: 'HC',
  SOCIAL_SECURITY: 'SS',
  MEDICAL_RECORD: 'MR',
  ACCOUNT_NUMBER: 'AN',
  TEMPORARY_ID: 'TEMP'
};

// Also make schema available globally for Meteor packages
if (typeof PatientMatching !== 'undefined') {
  PatientMatching.IdiPatientSchema = IdiPatientSchema;
  PatientMatching.IdentityAssuranceLevels = IdentityAssuranceLevels;
  PatientMatching.DigitalIdentifierTypes = DigitalIdentifierTypes;
}

export default IdiPatientSchema;