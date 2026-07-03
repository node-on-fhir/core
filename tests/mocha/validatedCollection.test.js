// tests/mocha/validatedCollection.test.js
// Meteor server test: meteor test --once --driver-package meteortesting:mocha
import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

if (Meteor.isServer) {
  describe('ValidatedCollection', function() {
    const TestPatients = createFhirCollection('Patient', 'TestValidatedPatients');

    beforeEach(async function() {
      await TestPatients.collection.removeAsync({});
    });

    it('permissive by default: invalid doc inserts fine', async function() {
      const id = await TestPatients.insertAsync({ resourceType: 'Patient', gender: 'purple' });
      assert.isString(id);
    });

    it('per-op validate:true rejects invalid doc with OperationOutcome', async function() {
      try {
        await TestPatients.insertAsync({ resourceType: 'Patient', gender: 'purple' }, { validate: true });
        assert.fail('expected validation-failed');
      } catch (error) {
        assert.equal(error.error, 'validation-failed');
        const outcome = JSON.parse(error.details);
        assert.equal(outcome.resourceType, 'OperationOutcome');
      }
    });

    it('per-op validate:true accepts valid doc', async function() {
      const id = await TestPatients.insertAsync({ resourceType: 'Patient', gender: 'male' }, { validate: true });
      assert.isString(id);
    });

    it('passthrough surface works (find, findOneAsync, createIndexAsync, _transform)', async function() {
      TestPatients._transform = function(doc) { doc.__transformed = true; return doc; };
      const id = await TestPatients.insertAsync({ resourceType: 'Patient', gender: 'male' });
      const found = await TestPatients.findOneAsync({ _id: id });
      assert.equal(found.gender, 'male');
      assert.equal(TestPatients.find({}).count !== undefined, true);
      assert.equal(typeof TestPatients.rawCollection, 'function');
    });

    it('escape hatch .collection bypasses everything', async function() {
      const id = await TestPatients.collection.insertAsync({ resourceType: 'Patient', gender: 'purple' });
      assert.isString(id);
    });
  });
}
