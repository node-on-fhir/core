// packages/reference-app/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { get, set } from 'lodash';

// =============================================================================
// SERVER METHODS
// =============================================================================

Meteor.methods({
  
  // ---------------------------------------------------------------------------
  // GET DATA
  // ---------------------------------------------------------------------------
  
  'referenceApp.getData': async function(patientId) {
    console.log('referenceApp.getData', patientId);
    
    // Check authorization
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    // Validate inputs
    check(patientId, Match.Maybe(String));
    
    try {
      // Get collections using Meteor v3 async API
      const Patients = await global.Collections.Patients;
      const Observations = await global.Collections.Observations;
      
      let result = {
        patient: null,
        observations: [],
        summary: {}
      };
      
      if (patientId && Patients) {
        // Fetch patient data
        result.patient = await Patients.findOneAsync({ id: patientId });
      }
      
      if (patientId && Observations) {
        // Fetch related observations
        result.observations = await Observations.findAsync({
          'subject.reference': `Patient/${patientId}`
        }).fetchAsync();
      }
      
      // Create summary
      result.summary = {
        patientName: get(result.patient, 'name[0].text', 'Unknown'),
        observationCount: result.observations.length,
        lastUpdated: new Date()
      };
      
      return result;
      
    } catch (error) {
      console.error('Error in referenceApp.getData:', error);
      throw new Meteor.Error('server-error', 'Failed to retrieve data');
    }
  },
  
  // ---------------------------------------------------------------------------
  // SAVE DATA
  // ---------------------------------------------------------------------------
  
  'referenceApp.saveData': async function(formData) {
    console.log('referenceApp.saveData', formData);
    
    // Check authorization
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    // Validate inputs
    check(formData, {
      patientId: String,
      resourceType: String,
      status: String,
      code: String,
      value: String,
      notes: Match.Maybe(String)
    });
    
    try {
      // Get the appropriate collection based on resource type
      let collection;
      switch(formData.resourceType) {
        case 'Observation':
          collection = await global.Collections.Observations;
          break;
        case 'Procedure':
          collection = await global.Collections.Procedures;
          break;
        case 'Condition':
          collection = await global.Collections.Conditions;
          break;
        default:
          throw new Meteor.Error('invalid-resource', 'Invalid resource type');
      }
      
      if (!collection) {
        throw new Meteor.Error('collection-not-found', `${formData.resourceType} collection not available`);
      }
      
      // Create FHIR resource
      const resource = {
        resourceType: formData.resourceType,
        id: Random.id(),
        status: formData.status,
        subject: {
          reference: `Patient/${formData.patientId}`
        },
        code: {
          text: formData.code
        },
        effectiveDateTime: new Date().toISOString(),
        issued: new Date().toISOString(),
        performer: [{
          reference: `Practitioner/${this.userId}`
        }]
      };
      
      // Add value based on resource type
      if (formData.resourceType === 'Observation') {
        resource.valueString = formData.value;
      }
      
      // Add notes if provided
      if (formData.notes) {
        resource.note = [{
          text: formData.notes,
          time: new Date().toISOString(),
          authorReference: {
            reference: `Practitioner/${this.userId}`
          }
        }];
      }
      
      // Insert into database
      const insertId = await collection.insertAsync(resource);
      
      console.log('Resource saved successfully:', insertId);
      return {
        success: true,
        id: insertId,
        resourceId: resource.id
      };
      
    } catch (error) {
      console.error('Error in referenceApp.saveData:', error);
      throw new Meteor.Error('save-failed', 'Failed to save data');
    }
  },
  
  // ---------------------------------------------------------------------------
  // SUBMIT DATA
  // ---------------------------------------------------------------------------
  
  'referenceApp.submitData': async function(formData) {
    console.log('referenceApp.submitData', formData);
    
    // Check authorization
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    // Validate inputs
    check(formData, Object);
    
    try {
      // First save the data
      const saveResult = await Meteor.call('referenceApp.saveData', formData);
      
      // Then submit to external FHIR server if configured
      const fhirServerUrl = get(Meteor, 'settings.private.fhirServerUrl');
      if (fhirServerUrl) {
        // Submit to external FHIR server
        console.log('Submitting to external FHIR server:', fhirServerUrl);
        
        // Note: Actual implementation would use fetch or HTTP package
        // This is a placeholder for the submission logic
      }
      
      // Log the submission
      if (global.Collections.AuditEvents) {
        const AuditEvents = await global.Collections.AuditEvents;
        await AuditEvents.insertAsync({
          resourceType: 'AuditEvent',
          type: {
            system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
            code: 'rest',
            display: 'RESTful Operation'
          },
          action: 'C', // Create
          recorded: new Date().toISOString(),
          outcome: '0', // Success
          agent: [{
            who: {
              reference: `Practitioner/${this.userId}`
            },
            requestor: true
          }],
          source: {
            observer: {
              display: 'Reference App'
            }
          },
          entity: [{
            what: {
              reference: `${formData.resourceType}/${saveResult.resourceId}`
            }
          }]
        });
      }
      
      return {
        success: true,
        message: 'Data submitted successfully',
        resourceId: saveResult.resourceId
      };
      
    } catch (error) {
      console.error('Error in referenceApp.submitData:', error);
      throw new Meteor.Error('submit-failed', 'Failed to submit data');
    }
  },
  
  // ---------------------------------------------------------------------------
  // SUBMIT WORKFLOW
  // ---------------------------------------------------------------------------
  
  'referenceApp.submitWorkflow': async function(workflowData) {
    console.log('referenceApp.submitWorkflow', workflowData);
    
    // Check authorization
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    // Validate workflow data
    check(workflowData, {
      patientId: String,
      resourceType: String,
      status: String,
      category: Match.Maybe(String),
      code: String,
      value: String,
      notes: Match.Maybe(String)
    });
    
    try {
      // Process workflow submission
      const result = await Meteor.call('referenceApp.submitData', workflowData);
      
      // Create workflow completion record
      if (global.Collections.Tasks) {
        const Tasks = await global.Collections.Tasks;
        await Tasks.insertAsync({
          resourceType: 'Task',
          status: 'completed',
          intent: 'order',
          priority: 'routine',
          description: 'Reference workflow completed',
          authoredOn: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          requester: {
            reference: `Practitioner/${this.userId}`
          },
          owner: {
            reference: `Practitioner/${this.userId}`
          },
          focus: {
            reference: `${workflowData.resourceType}/${result.resourceId}`
          },
          for: {
            reference: `Patient/${workflowData.patientId}`
          },
          executionPeriod: {
            end: new Date().toISOString()
          },
          output: [{
            type: {
              text: 'Created Resource'
            },
            valueReference: {
              reference: `${workflowData.resourceType}/${result.resourceId}`
            }
          }]
        });
      }
      
      return {
        success: true,
        message: 'Workflow completed successfully',
        result: result
      };
      
    } catch (error) {
      console.error('Error in referenceApp.submitWorkflow:', error);
      throw new Meteor.Error('workflow-failed', 'Failed to complete workflow');
    }
  }
});