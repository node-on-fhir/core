// tests/mocha/outboundValidation.test.js
import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';
import { validateOutbound, getEgressPolicy, annotateResource } from '/server/lib/OutboundValidation';

if (Meteor.isServer) {
  describe('OutboundValidation', function() {
    before(function() {
      // `meteor test` runs without --settings; scaffold the path the tests
      // reassign so direct property access below cannot throw.
      if (!Meteor.settings.private) { Meteor.settings.private = {}; }
      if (!Meteor.settings.private.fhir) { Meteor.settings.private.fhir = {}; }
      if (!Meteor.settings.private.fhir.schemaValidation) { Meteor.settings.private.fhir.schemaValidation = {}; }
    });

    it('policy defaults to off for unknown channel/missing settings', function() {
      assert.equal(getEgressPolicy('nonexistentChannel'), 'off');
    });

    it('off policy passes invalid resources untouched', function() {
      // temporarily force settings
      const original = Meteor.settings.private.fhir.schemaValidation.egress;
      Meteor.settings.private.fhir.schemaValidation.egress = { rest: 'off' };
      const result = validateOutbound({ resourceType: 'Patient', gender: 'purple' }, 'rest');
      assert.equal(result.action, 'pass');
      Meteor.settings.private.fhir.schemaValidation.egress = original;
    });

    it('warn passes but includes operationOutcome', function() {
      const original = Meteor.settings.private.fhir.schemaValidation.egress;
      Meteor.settings.private.fhir.schemaValidation.egress = { rest: 'warn' };
      const result = validateOutbound({ resourceType: 'Patient', gender: 'purple' }, 'rest');
      assert.equal(result.action, 'pass');
      assert.equal(result.operationOutcome.resourceType, 'OperationOutcome');
      Meteor.settings.private.fhir.schemaValidation.egress = original;
    });

    it('block returns block action for invalid, pass for valid', function() {
      const original = Meteor.settings.private.fhir.schemaValidation.egress;
      Meteor.settings.private.fhir.schemaValidation.egress = { relay: 'block' };
      assert.equal(validateOutbound({ resourceType: 'Patient', gender: 'purple' }, 'relay').action, 'block');
      assert.equal(validateOutbound({ resourceType: 'Patient', gender: 'male' }, 'relay').action, 'pass');
      Meteor.settings.private.fhir.schemaValidation.egress = original;
    });

    it('annotateResource adds validation-failed meta.tag without mutating input', function() {
      const input = { resourceType: 'Patient', gender: 'purple' };
      const annotated = annotateResource(input);
      assert.isUndefined(input.meta);
      assert.equal(annotated.meta.tag[0].code, 'validation-failed');
    });
  });
}
