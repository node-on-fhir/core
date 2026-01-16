// packages/request-for-corrections/server/methods/correctionOperations.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
  // Implementation of the $correction-request FHIR operation
  'correctionRequest.submit': function(bundle) {
    check(bundle, Object);
    // To be implemented - will process the correction request bundle
  }
});