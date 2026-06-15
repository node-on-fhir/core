// packages/patient-matching/lib/schemas/IdiMatchParameters.js
import SimpleSchema from 'simpl-schema';

// IDI Match Parameters Schema - Parameters for $match operation
export const IdiMatchParametersSchema = new SimpleSchema({
  resourceType: {
    type: String,
    defaultValue: 'Parameters'
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
  parameter: {
    type: Array,
    minCount: 1
  },
  'parameter.$': {
    type: Object
  },
  'parameter.$.name': {
    type: String
  },
  'parameter.$.valueString': {
    type: String,
    optional: true
  },
  'parameter.$.valueCode': {
    type: String,
    optional: true
  },
  'parameter.$.valueBoolean': {
    type: Boolean,
    optional: true
  },
  'parameter.$.valueInteger': {
    type: SimpleSchema.Integer,
    optional: true
  },
  'parameter.$.valueDecimal': {
    type: Number,
    optional: true
  },
  'parameter.$.valueReference': {
    type: Object,
    blackbox: true,
    optional: true
  },
  'parameter.$.resource': {
    type: Object,
    blackbox: true,
    optional: true
  },
  'parameter.$.part': {
    type: Array,
    optional: true
  },
  'parameter.$.part.$': {
    type: Object,
    blackbox: true
  }
});

// Standard match parameters
export const StandardMatchParameters = {
  RESOURCE: 'resource',
  ONLY_CERTAIN_MATCHES: 'onlyCertainMatches',
  COUNT: 'count',
  IDENTITY_ASSURANCE_LEVEL: 'identityAssuranceLevel',
  MATCH_CONFIDENCE_THRESHOLD: 'matchConfidenceThreshold',
  INCLUDE_DECEASED: 'includeDeceased',
  MATCH_ALGORITHM: 'matchAlgorithm'
};

// Match algorithm options
export const MatchAlgorithms = {
  EXACT: 'exact',
  FUZZY: 'fuzzy',
  PHONETIC: 'phonetic',
  WEIGHTED: 'weighted',
  MACHINE_LEARNING: 'ml'
};

export default IdiMatchParametersSchema;