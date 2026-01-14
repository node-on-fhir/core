// packages/healthcare-surveys/lib/schemas/HealthcareSurveysReportingBundle.js

import SimpleSchema from 'simpl-schema';
import { BaseSchema } from 'meteor/clinical:hl7-resource-datatypes';
import { BundleSchema } from 'meteor/clinical:hl7-fhir-resources';

// Extend the base Bundle schema
HealthcareSurveysReportingBundleSchema = new SimpleSchema([
  BundleSchema,
  {
    // Bundle type must be message
    'type': {
      type: String,
      allowedValues: ['message'],
      defaultValue: 'message'
    },
    // Must have exactly 2 entries
    'entry': {
      type: Array,
      minCount: 2,
      maxCount: 2
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

// Add validation to ensure correct entry structure
HealthcareSurveysReportingBundleSchema.addValidator(function() {
  const entries = this.value.entry || [];
  
  if (entries.length !== 2) {
    return 'Bundle must contain exactly 2 entries';
  }
  
  // Check for MessageHeader in first entry
  const firstResourceType = entries[0]?.resource?.resourceType;
  if (firstResourceType !== 'MessageHeader') {
    return 'First entry must be a USPublicHealthMessageHeader';
  }
  
  // Check for Bundle (content bundle) in second entry
  const secondResourceType = entries[1]?.resource?.resourceType;
  if (secondResourceType !== 'Bundle') {
    return 'Second entry must be a HealthcareSurveysContentBundle';
  }
  
  // Verify the second bundle is a collection type
  const secondBundleType = entries[1]?.resource?.type;
  if (secondBundleType !== 'collection') {
    return 'Second entry Bundle must be of type collection (HealthcareSurveysContentBundle)';
  }
});

// Create collection
HealthcareSurveysReportingBundle = new Mongo.Collection('HealthcareSurveysReportingBundle');
HealthcareSurveysReportingBundle.attachSchema(HealthcareSurveysReportingBundleSchema);

// Export
if (typeof exports === 'object') {
  module.exports = { HealthcareSurveysReportingBundle, HealthcareSurveysReportingBundleSchema };
}