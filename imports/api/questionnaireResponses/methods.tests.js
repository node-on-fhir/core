// /imports/api/questionnaireResponses/methods.tests.js

/* eslint-env mocha */
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { assert } from 'chai';

if (Meteor.isServer) {
  describe('QuestionnaireResponse Methods', function() {
    describe('Method Registration', function() {
      it('should have all questionnaireResponse methods registered', function() {
        const allMethods = Meteor.server.method_handlers || {};
        
        // Check questionnaireResponses methods
        assert.isFunction(allMethods['questionnaireResponses.create'], 'questionnaireResponses.create should be registered');
        assert.isFunction(allMethods['questionnaireResponses.update'], 'questionnaireResponses.update should be registered');
        assert.isFunction(allMethods['questionnaireResponses.remove'], 'questionnaireResponses.remove should be registered');
        assert.isFunction(allMethods['questionnaireResponses.get'], 'questionnaireResponses.get should be registered');
      });
    });

    describe('questionnaireResponses.create', function() {
      it('should reject if not logged in', async function() {
        const responseData = {
          status: 'completed',
          questionnaire: 'Questionnaire/test-questionnaire'
        };

        try {
          await Meteor.callAsync('questionnaireResponses.create', responseData);
          assert.fail('Expected method to throw');
        } catch (error) {
          assert.equal(error.error, 'not-authorized');
        }
      });
    });

    describe('questionnaireResponses.get', function() {
      it('should reject if not logged in', async function() {
        try {
          await Meteor.callAsync('questionnaireResponses.get', Random.id());
          assert.fail('Expected method to throw');
        } catch (error) {
          assert.equal(error.error, 'not-authorized');
        }
      });
    });
  });
}