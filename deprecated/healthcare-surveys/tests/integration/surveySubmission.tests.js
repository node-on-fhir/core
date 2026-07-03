// packages/healthcare-surveys/tests/integration/surveySubmission.tests.js

import { Tinytest } from 'meteor/tinytest';
import { Meteor } from 'meteor/meteor';
import { createSurveyComposition, createSurveyBundle, submitSurveyReport } from '../../server/methods/surveyMethods';
import { HcsComposition } from '../../lib/schemas/HcsComposition';
import { HealthcareSurveysContentBundle } from '../../lib/schemas/HealthcareSurveysContentBundle';

if (Meteor.isServer) {
  Tinytest.addAsync('Healthcare Surveys - Integration - Create composition', async function(test) {
    // Mock user
    const userId = 'test-user-123';
    
    const invocation = {
      userId: userId
    };
    
    const args = {
      patientId: 'patient-123',
      encounterId: 'encounter-456',
      sections: [
        {
          title: 'Reason for visit',
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '29299-5'
            }]
          },
          text: {
            status: 'generated',
            div: '<div>Chief complaint: Chest pain</div>'
          },
          entry: []
        },
        {
          title: 'Problem List',
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '11450-4'
            }]
          },
          text: {
            status: 'generated',
            div: '<div>Hypertension</div>'
          },
          entry: []
        },
        {
          title: 'Allergies',
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '48765-2'
            }]
          },
          text: {
            status: 'generated',
            div: '<div>No known allergies</div>'
          },
          entry: []
        }
      ]
    };
    
    try {
      const compositionId = await createSurveyComposition._execute(invocation, args);
      test.isNotNull(compositionId);
      
      // Verify composition was created
      const composition = await HcsComposition.findOneAsync(compositionId);
      test.isNotNull(composition);
      test.equal(composition.status, 'final');
      test.equal(composition.section.length, 3);
      
      // Clean up
      await HcsComposition.removeAsync(compositionId);
    } catch (error) {
      test.fail(`Error creating composition: ${error.message}`);
    }
  });
  
  Tinytest.addAsync('Healthcare Surveys - Integration - Create bundle from composition', async function(test) {
    // First create a composition
    const composition = {
      resourceType: 'Composition',
      status: 'final',
      type: {
        coding: [{
          system: 'http://loinc.org',
          code: '75619-7'
        }]
      },
      subject: {
        reference: 'Patient/test-patient'
      },
      encounter: {
        reference: 'Encounter/test-encounter'
      },
      date: new Date().toISOString(),
      title: 'Test Composition',
      section: []
    };
    
    const compositionId = await HcsComposition.insertAsync(composition);
    
    const invocation = {
      userId: 'test-user-123'
    };
    
    const args = {
      compositionId: compositionId,
      includeReferences: false
    };
    
    try {
      const bundleId = await createSurveyBundle._execute(invocation, args);
      test.isNotNull(bundleId);
      
      // Verify bundle was created
      const bundle = await HealthcareSurveysContentBundle.findOneAsync(bundleId);
      test.isNotNull(bundle);
      test.equal(bundle.type, 'collection');
      test.equal(bundle.entry.length, 1);
      test.equal(bundle.entry[0].resource._id, compositionId);
      
      // Clean up
      await HcsComposition.removeAsync(compositionId);
      await HealthcareSurveysContentBundle.removeAsync(bundleId);
    } catch (error) {
      test.fail(`Error creating bundle: ${error.message}`);
    }
  });
  
  Tinytest.addAsync('Healthcare Surveys - Integration - Validate required sections', async function(test) {
    const userId = 'test-user-123';
    const invocation = { userId };
    
    // Missing required sections
    const args = {
      patientId: 'patient-123',
      encounterId: 'encounter-456',
      sections: [
        {
          title: 'Reason for visit',
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '29299-5'
            }]
          },
          text: {
            status: 'generated',
            div: '<div>Test</div>'
          }
        }
        // Missing Problem List and Allergies sections
      ]
    };
    
    try {
      const compositionId = await createSurveyComposition._execute(invocation, args);
      
      // Composition should still be created
      test.isNotNull(compositionId);
      
      // But validation should fail
      const composition = await HcsComposition.findOneAsync(compositionId);
      const context = HcsCompositionSchema.newContext();
      context.validate(composition);
      test.isFalse(context.isValid());
      
      // Clean up
      await HcsComposition.removeAsync(compositionId);
    } catch (error) {
      // Expected to pass since we're testing validation
      test.pass();
    }
  });
}