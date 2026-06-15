// packages/patient-matching/lib/schemas/IdiMatchBundle.js
import SimpleSchema from 'simpl-schema';

// IDI Match Bundle Schema - Bundle containing match results
export const IdiMatchBundleSchema = new SimpleSchema({
  resourceType: {
    type: String,
    defaultValue: 'Bundle'
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
  type: {
    type: String,
    defaultValue: 'searchset',
    allowedValues: ['searchset', 'collection']
  },
  timestamp: {
    type: Date,
    defaultValue: new Date()
  },
  total: {
    type: SimpleSchema.Integer,
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
  entry: {
    type: Array,
    optional: true
  },
  'entry.$': {
    type: Object
  },
  'entry.$.fullUrl': {
    type: String,
    optional: true
  },
  'entry.$.resource': {
    type: Object,
    blackbox: true
  },
  'entry.$.search': {
    type: Object,
    optional: true
  },
  'entry.$.search.mode': {
    type: String,
    allowedValues: ['match', 'include', 'outcome'],
    optional: true
  },
  'entry.$.search.score': {
    type: Number,
    optional: true,
    min: 0,
    max: 1
  },
  'entry.$.search.extension': {
    type: Array,
    optional: true
  },
  'entry.$.search.extension.$': {
    type: Object,
    blackbox: true
  }
});

// Match confidence levels
export const MatchConfidenceLevels = {
  CERTAIN: 'certain',          // Score >= 0.95
  PROBABLE: 'probable',        // Score >= 0.80
  POSSIBLE: 'possible',        // Score >= 0.60
  CERTAINLY_NOT: 'certainly-not' // Score < 0.60
};

// Match method extensions
export const MatchMethodExtensions = {
  DETERMINISTIC: 'deterministic',
  PROBABILISTIC: 'probabilistic',
  MACHINE_LEARNING: 'machine-learning',
  HYBRID: 'hybrid'
};

export default IdiMatchBundleSchema;