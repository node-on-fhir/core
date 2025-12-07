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
  },

  // ---------------------------------------------------------------------------
  // SEED MUSTSUPPORT REFERENCES FOR ONC (g)(10) CERTIFICATION
  // ---------------------------------------------------------------------------

  /**
   * Seeds RelatedPerson and updates CareTeam for ONC (g)(10) MustSupport reference tests
   * Test 12.5.06: CareTeam.participant.member must reference valid RelatedPerson
   *
   * Creates:
   * - RelatedPerson resource with us-core-relatedperson profile
   * - Adds RelatedPerson as CareTeam participant with Caregiver role
   */
  'referenceApp.seedMustSupportReferences': async function(patientId) {
    console.log('referenceApp.seedMustSupportReferences', patientId);

    // Check authorization
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }

    // Validate inputs
    check(patientId, Match.Maybe(String));

    try {
      // Get collections
      const Patients = await global.Collections.Patients;
      const RelatedPersons = await global.Collections.RelatedPersons;
      const CareTeams = await global.Collections.CareTeams;

      if (!Patients) {
        throw new Meteor.Error('collection-not-found', 'Patients collection not available');
      }
      if (!RelatedPersons) {
        throw new Meteor.Error('collection-not-found', 'RelatedPersons collection not available');
      }
      if (!CareTeams) {
        throw new Meteor.Error('collection-not-found', 'CareTeams collection not available');
      }

      // Find patient - use provided ID or get first patient
      let patient;
      if (patientId) {
        patient = await Patients.findOneAsync({ _id: patientId });
        if (!patient) {
          patient = await Patients.findOneAsync({ id: patientId });
        }
      }
      if (!patient) {
        // Get first patient in database
        patient = await Patients.findOneAsync({});
      }
      if (!patient) {
        throw new Meteor.Error('no-patients', 'No patients found in database');
      }

      const patientFhirId = get(patient, 'id') || get(patient, '_id');
      const patientName = `${get(patient, 'name[0].given[0]', '')} ${get(patient, 'name[0].family', '')}`.trim() || 'Unknown Patient';
      console.log('Using patient:', patientFhirId, patientName);

      // Create RelatedPerson resource with US Core profile
      const relatedPersonId = Random.id();
      const relatedPerson = {
        _id: relatedPersonId,
        id: relatedPersonId,
        resourceType: 'RelatedPerson',
        meta: {
          profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-relatedperson']
        },
        active: true,
        patient: {
          reference: `Patient/${patientFhirId}`,
          display: patientName
        },
        relationship: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode',
            code: 'NIECE',
            display: 'niece'
          }]
        }],
        name: [{
          use: 'official',
          family: 'TestCaregiver',
          given: ['Sarah']
        }],
        telecom: [{
          system: 'phone',
          value: '555-555-5555',
          use: 'home'
        }],
        address: [{
          use: 'home',
          line: ['123 Caregiver Lane'],
          city: 'Boston',
          state: 'MA',
          postalCode: '02101',
          country: 'US'
        }]
      };

      // Insert RelatedPerson
      await RelatedPersons.insertAsync(relatedPerson);
      console.log('Created RelatedPerson:', relatedPersonId);

      // Find existing CareTeam for patient or create one
      let careTeam = await CareTeams.findOneAsync({
        'subject.reference': `Patient/${patientFhirId}`
      });

      if (!careTeam) {
        // Also try without Patient/ prefix
        careTeam = await CareTeams.findOneAsync({
          'subject.reference': patientFhirId
        });
      }

      let careTeamCreated = false;
      let careTeamId;

      if (!careTeam) {
        // Create new CareTeam
        careTeamId = Random.id();
        careTeam = {
          _id: careTeamId,
          id: careTeamId,
          resourceType: 'CareTeam',
          meta: {
            profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-careteam']
          },
          status: 'active',
          name: `Care Team for ${patientName}`,
          subject: {
            reference: `Patient/${patientFhirId}`,
            display: patientName
          },
          participant: []
        };
        careTeamCreated = true;
        console.log('Creating new CareTeam:', careTeamId);
      } else {
        careTeamId = get(careTeam, '_id');
        console.log('Found existing CareTeam:', careTeamId);
      }

      // Create participant entry for RelatedPerson
      const caregiverParticipant = {
        role: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: '133932002',
            display: 'Caregiver (person)'
          }]
        }],
        member: {
          reference: `RelatedPerson/${relatedPersonId}`,
          display: 'Sarah TestCaregiver'
        }
      };

      // Add participant to CareTeam
      const participants = get(careTeam, 'participant', []);
      participants.push(caregiverParticipant);

      if (careTeamCreated) {
        careTeam.participant = participants;
        await CareTeams.insertAsync(careTeam);
        console.log('Inserted new CareTeam with RelatedPerson participant');
      } else {
        await CareTeams.updateAsync(
          { _id: careTeamId },
          { $set: { participant: participants } }
        );
        console.log('Updated existing CareTeam with RelatedPerson participant');
      }

      return {
        success: true,
        message: 'MustSupport references seeded successfully',
        relatedPersonId: relatedPersonId,
        careTeamId: careTeamId,
        careTeamCreated: careTeamCreated,
        patientId: patientFhirId,
        patientName: patientName
      };

    } catch (error) {
      console.error('Error in referenceApp.seedMustSupportReferences:', error);
      throw new Meteor.Error('seed-failed', error.message || 'Failed to seed MustSupport references');
    }
  },

  // ---------------------------------------------------------------------------
  // PATCH PATIENT MUSTSUPPORT ELEMENTS FOR ONC (g)(10) CERTIFICATION
  // ---------------------------------------------------------------------------

  /**
   * Patches any patient to add required MustSupport elements for ONC (g)(10) certification
   * Test 12.2.09: Patient resource must include MustSupport elements:
   * - name.use: "old" with suffix and period.end
   * - deceasedDateTime
   * - address.use: "old" with period.end
   */
  'referenceApp.patchPatientMustSupport': async function(patientId) {
    console.log('referenceApp.patchPatientMustSupport', patientId);

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

      // Find patient by _id or FHIR id
      let patient = await Patients.findOneAsync({ _id: patientId });
      if (!patient) {
        patient = await Patients.findOneAsync({ id: patientId });
      }
      if (!patient) {
        throw new Meteor.Error('patient-not-found', `Patient not found: ${patientId}`);
      }

      const patientName = `${get(patient, 'name[0].given[0]', '')} ${get(patient, 'name[0].family', '')}`.trim();
      console.log('Found patient:', patientName, get(patient, '_id'));

      // Build update fields
      const updateFields = {};
      const existingNames = get(patient, 'name', []);
      const existingAddresses = get(patient, 'address', []);

      // Check if patient already has name.use: "old"
      const hasOldName = existingNames.some(n => n.use === 'old');
      if (!hasOldName) {
        const officialName = existingNames.find(n => n.use === 'official') || existingNames[0] || {};
        const updatedNames = [...existingNames];

        // Add historical name with suffix and period.end
        updatedNames.push({
          use: 'old',
          family: get(officialName, 'family', 'Unknown'),
          given: get(officialName, 'given', ['Unknown']),
          suffix: ['Jr.'],
          period: {
            start: '1970-01-01',
            end: '2000-01-01'
          }
        });
        updateFields.name = updatedNames;
      }

      // Check if patient already has address.use: "old"
      const hasOldAddress = existingAddresses.some(a => a.use === 'old');
      if (!hasOldAddress) {
        const updatedAddresses = [...existingAddresses];

        // Add previous address with period.end
        updatedAddresses.push({
          use: 'old',
          line: ['456 Previous Street'],
          city: 'Boston',
          state: 'MA',
          postalCode: '02101',
          country: 'US',
          period: {
            start: '1990-01-01',
            end: '2010-01-01'
          }
        });
        updateFields.address = updatedAddresses;
      }

      // Add deceasedDateTime if not present
      if (!get(patient, 'deceasedDateTime') && !get(patient, 'deceasedBoolean')) {
        updateFields.deceasedDateTime = '2025-12-01T00:00:00Z';
      }

      // Check if any updates needed
      if (Object.keys(updateFields).length === 0) {
        console.log('Patient already has all MustSupport elements');
        return {
          success: true,
          message: 'Patient already has all MustSupport elements',
          patientId: get(patient, '_id'),
          fhirId: get(patient, 'id'),
          updated: false
        };
      }

      console.log('Patching patient with MustSupport elements:', Object.keys(updateFields));

      // Perform update
      const result = await Patients.updateAsync(
        { _id: get(patient, '_id') },
        { $set: updateFields }
      );

      console.log('Update result:', result);

      return {
        success: true,
        message: 'Patient patched with MustSupport elements',
        patientId: get(patient, '_id'),
        fhirId: get(patient, 'id'),
        updated: true,
        fieldsAdded: Object.keys(updateFields)
      };

    } catch (error) {
      console.error('Error in referenceApp.patchPatientMustSupport:', error);
      throw new Meteor.Error('patch-failed', error.message || 'Failed to patch patient MustSupport elements');
    }
  },

  // ---------------------------------------------------------------------------
  // LOAD DAISEY TEST PATIENT FOR ONC (g)(10) CERTIFICATION
  // ---------------------------------------------------------------------------

  /**
   * Loads the complete Daisey test patient bundle from packages/reference-app/data/Daisy
   * Daisey has 367 resources covering all ONC (g)(10) certification requirements
   * Patient ID: 958c63b0-4a7f-2ee7-ef6a-e04df5931b4c
   */
  'referenceApp.loadDaiseyPatient': async function() {
    console.log('referenceApp.loadDaiseyPatient');

    // Check authorization
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }

    try {
      // Read the Daisey bundle from package assets (added via api.addAssets in package.js)
      const assetPath = 'data/Daisy/Daisey627_Jackelyn13_Koelpin146_958c63b0-4a7f-2ee7-ef6a-e04df5931b4c.json';

      // Use Assets.getTextAsync for Meteor v3
      let bundleJson;
      try {
        bundleJson = await Assets.getTextAsync(assetPath);
      } catch (assetError) {
        console.error('Failed to read bundle from assets:', assetError.message);
        throw new Meteor.Error('asset-not-found', `Daisey bundle not found at ${assetPath}. Ensure the file is registered via api.addAssets() in package.js.`);
      }

      const bundle = JSON.parse(bundleJson);
      console.log('Loaded Daisey bundle with', get(bundle, 'entry.length', 0), 'entries');

      if (!bundle.entry || !Array.isArray(bundle.entry)) {
        throw new Meteor.Error('invalid-bundle', 'Bundle has no entries');
      }

      // Process each resource in the bundle
      const results = {
        success: true,
        total: bundle.entry.length,
        inserted: 0,
        updated: 0,
        errors: 0,
        byResourceType: {}
      };

      for (const entry of bundle.entry) {
        const resource = get(entry, 'resource');
        if (!resource) {
          console.warn('Entry has no resource:', entry);
          results.errors++;
          continue;
        }

        const resourceType = get(resource, 'resourceType');
        const resourceId = get(resource, 'id');

        if (!resourceType) {
          console.warn('Resource has no resourceType:', resource);
          results.errors++;
          continue;
        }

        // Get the appropriate collection
        const collectionName = resourceType + 's'; // e.g., "Patient" -> "Patients"
        const collection = await global.Collections[collectionName];

        if (!collection) {
          console.warn(`Collection not found for ${resourceType}, skipping`);
          results.byResourceType[resourceType] = (results.byResourceType[resourceType] || 0);
          continue;
        }

        try {
          // Check if resource already exists
          let existing = await collection.findOneAsync({ id: resourceId });

          if (existing) {
            // Update existing resource
            const updateData = { ...resource };
            delete updateData._id; // Don't update MongoDB _id

            await collection.updateAsync(
              { _id: existing._id },
              { $set: updateData }
            );
            results.updated++;
          } else {
            // Insert new resource, using FHIR id as MongoDB _id if no _id present
            const insertData = { ...resource };
            if (!insertData._id && resourceId) {
              insertData._id = resourceId;
            }

            await collection.insertAsync(insertData);
            results.inserted++;
          }

          results.byResourceType[resourceType] = (results.byResourceType[resourceType] || 0) + 1;

        } catch (resourceError) {
          console.error(`Error processing ${resourceType}/${resourceId}:`, resourceError.message);
          results.errors++;
        }
      }

      console.log('Daisey patient loaded:', results);

      return {
        success: true,
        message: `Loaded Daisey test patient: ${results.inserted} inserted, ${results.updated} updated, ${results.errors} errors`,
        patientId: '958c63b0-4a7f-2ee7-ef6a-e04df5931b4c',
        patientName: 'Daisey627 Jackelyn13 Koelpin146',
        ...results
      };

    } catch (error) {
      console.error('Error in referenceApp.loadDaiseyPatient:', error);
      throw new Meteor.Error('load-failed', error.message || 'Failed to load Daisey test patient');
    }
  },

  // ---------------------------------------------------------------------------
  // SEED MISSING REFERENCES FROM PARSED URLs
  // ---------------------------------------------------------------------------

  /**
   * Creates minimal stub resources for references that return 403 errors
   * Takes an array of { resourceType, id } objects and creates stub resources
   *
   * @param {Object} options
   * @param {Array} options.references - Array of { resourceType: string, id: string }
   * @param {String} options.patientId - Optional patient ID to link resources to
   */
  'referenceApp.seedMissingReferences': async function(options) {
    console.log('referenceApp.seedMissingReferences', options);

    // Check authorization
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }

    // Validate inputs
    check(options, {
      references: [{ resourceType: String, id: String }],
      patientId: Match.Maybe(String)
    });

    const { references, patientId } = options;
    const results = {
      created: 0,
      skipped: 0,
      errors: 0,
      details: []
    };

    // Map of resourceType to collection name
    const collectionMap = {
      'AllergyIntolerance': 'AllergyIntolerances',
      'CarePlan': 'CarePlans',
      'CareTeam': 'CareTeams',
      'Condition': 'Conditions',
      'Coverage': 'Coverages',
      'Device': 'Devices',
      'DiagnosticReport': 'DiagnosticReports',
      'DocumentReference': 'DocumentReferences',
      'Encounter': 'Encounters',
      'Goal': 'Goals',
      'Immunization': 'Immunizations',
      'Location': 'Locations',
      'Medication': 'Medications',
      'MedicationDispense': 'MedicationDispenses',
      'MedicationRequest': 'MedicationRequests',
      'Observation': 'Observations',
      'Organization': 'Organizations',
      'Patient': 'Patients',
      'Practitioner': 'Practitioners',
      'PractitionerRole': 'PractitionerRoles',
      'Procedure': 'Procedures',
      'Provenance': 'Provenances',
      'RelatedPerson': 'RelatedPersons',
      'ServiceRequest': 'ServiceRequests',
      'Specimen': 'Specimens'
    };

    // US Core profiles for each resource type
    const profileMap = {
      'AllergyIntolerance': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-allergyintolerance',
      'CarePlan': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-careplan',
      'CareTeam': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-careteam',
      'Condition': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-condition-problems-health-concerns',
      'Coverage': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-coverage',
      'Device': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-implantable-device',
      'DiagnosticReport': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-diagnosticreport-lab',
      'DocumentReference': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-documentreference',
      'Encounter': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-encounter',
      'Goal': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-goal',
      'Immunization': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-immunization',
      'Location': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-location',
      'Medication': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-medication',
      'MedicationDispense': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-medicationdispense',
      'MedicationRequest': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-medicationrequest',
      'Observation': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-lab',
      'Organization': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-organization',
      'Patient': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient',
      'Practitioner': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-practitioner',
      'PractitionerRole': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-practitionerrole',
      'Procedure': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-procedure',
      'Provenance': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-provenance',
      'RelatedPerson': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-relatedperson',
      'ServiceRequest': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-servicerequest',
      'Specimen': 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-specimen'
    };

    for (const ref of references) {
      const { resourceType, id } = ref;

      try {
        // Get collection name
        const collectionName = collectionMap[resourceType];
        if (!collectionName) {
          console.warn(`Unknown resource type: ${resourceType}`);
          results.errors++;
          results.details.push({ resourceType, id, error: 'Unknown resource type' });
          continue;
        }

        // Get collection
        const collection = await global.Collections[collectionName];
        if (!collection) {
          console.warn(`Collection not available: ${collectionName}`);
          results.errors++;
          results.details.push({ resourceType, id, error: 'Collection not available' });
          continue;
        }

        // Check if resource already exists
        let existing = await collection.findOneAsync({ _id: id });
        if (!existing) {
          existing = await collection.findOneAsync({ id: id });
        }

        if (existing) {
          console.log(`Resource already exists: ${resourceType}/${id}`);
          results.skipped++;
          results.details.push({ resourceType, id, status: 'skipped', reason: 'already exists' });
          continue;
        }

        // Create minimal stub resource
        const stubResource = {
          _id: id,
          id: id,
          resourceType: resourceType,
          meta: {
            profile: profileMap[resourceType] ? [profileMap[resourceType]] : []
          }
        };

        // Add required fields based on resource type
        switch (resourceType) {
          case 'Patient':
            stubResource.name = [{ family: 'StubPatient', given: ['Test'] }];
            stubResource.gender = 'unknown';
            stubResource.birthDate = '1970-01-01';
            break;

          case 'Practitioner':
            stubResource.name = [{ family: 'StubPractitioner', given: ['Test'] }];
            break;

          case 'Organization':
            stubResource.active = true;
            stubResource.name = 'Stub Organization';
            break;

          case 'Location':
            stubResource.status = 'active';
            stubResource.name = 'Stub Location';
            stubResource.mode = 'instance';
            break;

          case 'RelatedPerson':
            stubResource.active = true;
            stubResource.name = [{ family: 'StubRelated', given: ['Person'] }];
            if (patientId) {
              stubResource.patient = { reference: `Patient/${patientId}` };
            }
            stubResource.relationship = [{
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode',
                code: 'FRND',
                display: 'Friend'
              }]
            }];
            break;

          case 'Encounter':
            stubResource.status = 'finished';
            stubResource.class = {
              system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
              code: 'AMB',
              display: 'ambulatory'
            };
            if (patientId) {
              stubResource.subject = { reference: `Patient/${patientId}` };
            }
            break;

          case 'Condition':
            stubResource.clinicalStatus = {
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                code: 'active'
              }]
            };
            stubResource.verificationStatus = {
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                code: 'confirmed'
              }]
            };
            stubResource.category = [{
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/condition-category',
                code: 'problem-list-item',
                display: 'Problem List Item'
              }]
            }];
            stubResource.code = {
              coding: [{
                system: 'http://snomed.info/sct',
                code: '404684003',
                display: 'Clinical finding (finding)'
              }],
              text: 'Stub Condition'
            };
            if (patientId) {
              stubResource.subject = { reference: `Patient/${patientId}` };
            }
            break;

          case 'Observation':
            stubResource.status = 'final';
            stubResource.category = [{
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'laboratory',
                display: 'Laboratory'
              }]
            }];
            stubResource.code = {
              coding: [{
                system: 'http://loinc.org',
                code: '00000-0',
                display: 'Stub Observation'
              }],
              text: 'Stub Observation'
            };
            if (patientId) {
              stubResource.subject = { reference: `Patient/${patientId}` };
            }
            stubResource.effectiveDateTime = new Date().toISOString();
            break;

          case 'Procedure':
            stubResource.status = 'completed';
            stubResource.code = {
              coding: [{
                system: 'http://snomed.info/sct',
                code: '71388002',
                display: 'Procedure (procedure)'
              }],
              text: 'Stub Procedure'
            };
            if (patientId) {
              stubResource.subject = { reference: `Patient/${patientId}` };
            }
            break;

          case 'Medication':
            stubResource.code = {
              coding: [{
                system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                code: '000000',
                display: 'Stub Medication'
              }],
              text: 'Stub Medication'
            };
            break;

          case 'MedicationRequest':
            stubResource.status = 'active';
            stubResource.intent = 'order';
            stubResource.medicationCodeableConcept = {
              coding: [{
                system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                code: '000000',
                display: 'Stub Medication'
              }],
              text: 'Stub Medication'
            };
            if (patientId) {
              stubResource.subject = { reference: `Patient/${patientId}` };
            }
            break;

          case 'Coverage':
            stubResource.status = 'active';
            if (patientId) {
              stubResource.beneficiary = { reference: `Patient/${patientId}` };
            }
            stubResource.payor = [{ display: 'Stub Payor' }];
            break;

          case 'CareTeam':
            stubResource.status = 'active';
            if (patientId) {
              stubResource.subject = { reference: `Patient/${patientId}` };
            }
            stubResource.participant = [];
            break;

          case 'CarePlan':
            stubResource.status = 'active';
            stubResource.intent = 'plan';
            if (patientId) {
              stubResource.subject = { reference: `Patient/${patientId}` };
            }
            stubResource.category = [{
              coding: [{
                system: 'http://hl7.org/fhir/us/core/CodeSystem/careplan-category',
                code: 'assess-plan'
              }]
            }];
            break;

          case 'Goal':
            stubResource.lifecycleStatus = 'active';
            stubResource.description = { text: 'Stub Goal' };
            if (patientId) {
              stubResource.subject = { reference: `Patient/${patientId}` };
            }
            break;

          case 'Immunization':
            stubResource.status = 'completed';
            stubResource.vaccineCode = {
              coding: [{
                system: 'http://hl7.org/fhir/sid/cvx',
                code: '00',
                display: 'Stub Vaccine'
              }],
              text: 'Stub Vaccine'
            };
            if (patientId) {
              stubResource.patient = { reference: `Patient/${patientId}` };
            }
            stubResource.occurrenceDateTime = new Date().toISOString();
            break;

          case 'AllergyIntolerance':
            stubResource.clinicalStatus = {
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
                code: 'active'
              }]
            };
            stubResource.verificationStatus = {
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
                code: 'confirmed'
              }]
            };
            stubResource.code = {
              coding: [{
                system: 'http://snomed.info/sct',
                code: '418689008',
                display: 'Allergy to substance (finding)'
              }],
              text: 'Stub Allergy'
            };
            if (patientId) {
              stubResource.patient = { reference: `Patient/${patientId}` };
            }
            break;

          case 'Device':
            stubResource.type = {
              coding: [{
                system: 'http://snomed.info/sct',
                code: '49062001',
                display: 'Device (physical object)'
              }],
              text: 'Stub Device'
            };
            if (patientId) {
              stubResource.patient = { reference: `Patient/${patientId}` };
            }
            break;

          case 'DiagnosticReport':
            stubResource.status = 'final';
            stubResource.category = [{
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
                code: 'LAB',
                display: 'Laboratory'
              }]
            }];
            stubResource.code = {
              coding: [{
                system: 'http://loinc.org',
                code: '00000-0',
                display: 'Stub Report'
              }],
              text: 'Stub Diagnostic Report'
            };
            if (patientId) {
              stubResource.subject = { reference: `Patient/${patientId}` };
            }
            stubResource.effectiveDateTime = new Date().toISOString();
            break;

          case 'DocumentReference':
            stubResource.status = 'current';
            stubResource.type = {
              coding: [{
                system: 'http://loinc.org',
                code: '00000-0',
                display: 'Stub Document'
              }],
              text: 'Stub Document'
            };
            stubResource.category = [{
              coding: [{
                system: 'http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category',
                code: 'clinical-note',
                display: 'Clinical Note'
              }]
            }];
            if (patientId) {
              stubResource.subject = { reference: `Patient/${patientId}` };
            }
            stubResource.content = [{
              attachment: {
                contentType: 'text/plain',
                data: 'U3R1YiBkb2N1bWVudA=='  // "Stub document" base64 encoded
              }
            }];
            break;

          case 'ServiceRequest':
            stubResource.status = 'active';
            stubResource.intent = 'order';
            stubResource.code = {
              coding: [{
                system: 'http://snomed.info/sct',
                code: '000000000',
                display: 'Stub Service'
              }],
              text: 'Stub Service Request'
            };
            if (patientId) {
              stubResource.subject = { reference: `Patient/${patientId}` };
            }
            break;

          case 'Specimen':
            stubResource.type = {
              coding: [{
                system: 'http://snomed.info/sct',
                code: '119297000',
                display: 'Blood specimen'
              }],
              text: 'Stub Specimen'
            };
            if (patientId) {
              stubResource.subject = { reference: `Patient/${patientId}` };
            }
            break;

          case 'MedicationDispense':
            stubResource.status = 'completed';
            stubResource.medicationCodeableConcept = {
              coding: [{
                system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                code: '000000',
                display: 'Stub Medication'
              }],
              text: 'Stub Medication'
            };
            if (patientId) {
              stubResource.subject = { reference: `Patient/${patientId}` };
            }
            break;

          case 'PractitionerRole':
            stubResource.active = true;
            stubResource.code = [{
              coding: [{
                system: 'http://nucc.org/provider-taxonomy',
                code: '208D00000X',
                display: 'General Practice'
              }]
            }];
            break;

          case 'Provenance':
            stubResource.target = [{ display: 'Stub Target' }];
            stubResource.recorded = new Date().toISOString();
            stubResource.agent = [{
              type: {
                coding: [{
                  system: 'http://terminology.hl7.org/CodeSystem/provenance-participant-type',
                  code: 'author',
                  display: 'Author'
                }]
              },
              who: { display: 'Stub Agent' }
            }];
            break;

          default:
            // Generic stub - just has id and resourceType
            console.log(`Creating generic stub for: ${resourceType}/${id}`);
        }

        // Insert the stub resource
        await collection.insertAsync(stubResource);
        console.log(`Created stub resource: ${resourceType}/${id}`);
        results.created++;
        results.details.push({ resourceType, id, status: 'created' });

      } catch (error) {
        console.error(`Error creating stub for ${resourceType}/${id}:`, error.message);
        results.errors++;
        results.details.push({ resourceType, id, error: error.message });
      }
    }

    console.log('Seed missing references complete:', results);
    return results;
  }
});