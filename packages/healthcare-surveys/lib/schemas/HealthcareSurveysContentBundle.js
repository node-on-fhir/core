// packages/healthcare-surveys/lib/schemas/HealthcareSurveysContentBundle.js

import SimpleSchema from 'simpl-schema';
import { BaseSchema } from 'meteor/clinical:hl7-resource-datatypes';
import { BundleSchema } from 'meteor/clinical:hl7-fhir-resources';

// Extend the base Bundle schema
HealthcareSurveysContentBundleSchema = new SimpleSchema([
  BundleSchema,
  {
    // Bundle type must be collection
    'type': {
      type: String,
      allowedValues: ['collection'],
      defaultValue: 'collection'
    },
    // Must have at least one entry for the composition
    'entry': {
      type: Array,
      minCount: 1
    },
    'entry.$': {
      type: Object
    },
    'entry.$.fullUrl': {
      type: String,
      optional: true
    },
    'entry.$.resource': {
      type: Object
    }
  }
]);

// Add validation to ensure exactly one HcsComposition
HealthcareSurveysContentBundleSchema.addValidator(function() {
  const entries = this.value.entry || [];
  
  // Count HcsComposition resources
  const compositionCount = entries.filter(entry => {
    const resourceType = entry.resource?.resourceType;
    return resourceType === 'Composition';
  }).length;
  
  if (compositionCount === 0) {
    return 'Bundle must contain exactly one HcsComposition resource';
  }
  
  if (compositionCount > 1) {
    return 'Bundle must contain only one HcsComposition resource';
  }
});

// Create collection
HealthcareSurveysContentBundle = new Mongo.Collection('HealthcareSurveysContentBundle');
HealthcareSurveysContentBundle.attachSchema(HealthcareSurveysContentBundleSchema);

// Export
if (typeof exports === 'object') {
  module.exports = { HealthcareSurveysContentBundle, HealthcareSurveysContentBundleSchema };
}