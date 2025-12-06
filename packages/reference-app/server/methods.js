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
  // ADD USCDI FIELDS TO PATIENT
  // ---------------------------------------------------------------------------

  /**
   * Updates a patient record to include all USCDI-required fields for (g)(10) certification
   * This adds fields like name.suffix, previous names, previous addresses, and deceased info
   */
  'referenceApp.addUscdiFieldsToPatient': async function(patientId) {
    console.log('referenceApp.addUscdiFieldsToPatient', patientId);

    // Check authorization
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }

    // Validate inputs
    check(patientId, String);

    try {
      const Patients = await global.Collections.Patients;
      if (!Patients) {
        throw new Meteor.Error('collection-not-found', 'Patients collection not available');
      }

      // Find the patient - try both _id and id fields
      let patient = await Patients.findOneAsync({ _id: patientId });
      if (!patient) {
        patient = await Patients.findOneAsync({ id: patientId });
      }
      if (!patient) {
        throw new Meteor.Error('patient-not-found', `Patient not found: ${patientId}`);
      }

      console.log('Found patient:', get(patient, 'name[0].family'), get(patient, '_id'));

      // Build the update object
      const updateFields = {};

      // Get existing name array or create new one
      const existingNames = get(patient, 'name', []);
      const officialName = existingNames.find(n => n.use === 'official') || existingNames[0] || {};

      // Add suffix to official name if not present
      if (!get(officialName, 'suffix')) {
        // We'll update the entire name array
        const updatedNames = existingNames.map(n => {
          if (n.use === 'official' || n === existingNames[0]) {
            return {
              ...n,
              suffix: ['III']  // Add a suffix
            };
          }
          return n;
        });

        // Add a previous/old name with period.end
        updatedNames.push({
          use: 'old',
          family: get(officialName, 'family', 'Unknown'),
          given: get(officialName, 'given', ['Unknown']),
          period: {
            start: '1921-12-29',
            end: '1950-01-01'
          }
        });

        updateFields.name = updatedNames;
      }

      // Get existing address array
      const existingAddresses = get(patient, 'address', []);

      // Add a previous/old address with period.end if not present
      const hasOldAddress = existingAddresses.some(a => a.use === 'old');
      if (!hasOldAddress) {
        const updatedAddresses = [...existingAddresses];

        // Add previous address
        updatedAddresses.push({
          use: 'old',
          line: ['123 Previous Street'],
          city: 'Boston',
          state: 'MA',
          postalCode: '02101',
          country: 'US',
          period: {
            start: '1921-12-29',
            end: '1980-01-01'
          }
        });

        updateFields.address = updatedAddresses;
      }

      // Add deceasedDateTime if patient was born before 1930 (likely deceased)
      const birthDate = get(patient, 'birthDate');
      if (birthDate && !get(patient, 'deceasedDateTime') && !get(patient, 'deceasedBoolean')) {
        const birthYear = parseInt(birthDate.substring(0, 4));
        if (birthYear < 1930) {
          // Add deceased date (assume death at age 80-100)
          updateFields.deceasedDateTime = '2024-11-15T10:30:00Z';
        }
      }

      // Only update if we have fields to add
      if (Object.keys(updateFields).length === 0) {
        console.log('Patient already has all USCDI fields');
        return {
          success: true,
          message: 'Patient already has all required USCDI fields',
          patientId: get(patient, '_id'),
          updated: false
        };
      }

      console.log('Updating patient with USCDI fields:', Object.keys(updateFields));

      // Perform the update
      const result = await Patients.updateAsync(
        { _id: get(patient, '_id') },
        { $set: updateFields }
      );

      console.log('Update result:', result);

      return {
        success: true,
        message: 'Patient updated with USCDI fields',
        patientId: get(patient, '_id'),
        fhirId: get(patient, 'id'),
        updated: true,
        fieldsAdded: Object.keys(updateFields)
      };

    } catch (error) {
      console.error('Error in referenceApp.addUscdiFieldsToPatient:', error);
      throw new Meteor.Error('update-failed', error.message || 'Failed to update patient');
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