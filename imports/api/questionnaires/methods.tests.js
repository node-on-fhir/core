// /imports/api/questionnaires/methods.tests.js

/* eslint-env mocha */
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { assert } from 'chai';

if (Meteor.isServer) {
  describe('Questionnaire Methods', function() {
    describe('Method Registration', function() {
      it('should have all questionnaire methods registered', function() {
        const allMethods = Meteor.server.method_handlers || {};
        
        // Check questionnaires methods
        assert.isFunction(allMethods['questionnaires.create'], 'questionnaires.create should be registered');
        assert.isFunction(allMethods['questionnaires.update'], 'questionnaires.update should be registered');
        assert.isFunction(allMethods['questionnaires.remove'], 'questionnaires.remove should be registered');
        assert.isFunction(allMethods['questionnaires.get'], 'questionnaires.get should be registered');
      });
    });

    describe('questionnaires.create', function() {
      it('should reject if not logged in', async function() {
        const questionnaireData = {
          status: 'active',
          title: 'Test Questionnaire'
        };

        try {
          await Meteor.callAsync('questionnaires.create', questionnaireData);
          assert.fail('Expected method to throw');
        } catch (error) {
          assert.equal(error.error, 'not-authorized');
        }
      });
    });

    describe('questionnaires.get', function() {
      it('should reject if not logged in', async function() {
        try {
          await Meteor.callAsync('questionnaires.get', Random.id());
          assert.fail('Expected method to throw');
        } catch (error) {
          assert.equal(error.error, 'not-authorized');
        }
      });
    });
  });
}