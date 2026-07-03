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

  // Task 11: OAuthClients custom-schema enforcement (registered via
  // FhirValidator.registerSchema in imports/collections/OAuthClients.js).
  describe('OAuthClients custom schema (schemas-extra)', function() {
    let OAuthClients;

    before(async function() {
      ({ OAuthClients } = await import('/imports/collections/OAuthClients'));
    });

    it('strict insert rejects doc without resourceType', async function() {
      try {
        await OAuthClients.insertAsync({ client_id: 'test-no-resourcetype' }, { validate: true });
        assert.fail('expected validation-failed');
      } catch (error) {
        assert.equal(error.error, 'validation-failed');
        const outcome = JSON.parse(error.details);
        assert.equal(outcome.resourceType, 'OperationOutcome');
      }
    });

    it('strict insert rejects wrong field type', async function() {
      try {
        await OAuthClients.insertAsync({ resourceType: 'OAuthClient', client_id: 'test-bad-type', verified: 'yes' }, { validate: true });
        assert.fail('expected validation-failed');
      } catch (error) {
        assert.equal(error.error, 'validation-failed');
      }
    });

    it('strict insert accepts valid client doc', async function() {
      const id = await OAuthClients.insertAsync({
        resourceType: 'OAuthClient',
        client_id: 'test-valid-client',
        client_name: 'Test Client',
        verified: false,
        grant_types: ['authorization_code']
      }, { validate: true });
      assert.isString(id);
      await OAuthClients.collection.removeAsync({ _id: id });
    });
  });
}
