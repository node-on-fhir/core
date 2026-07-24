// /packages/pacio-core/server/methods/bedManagement.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Beds, BedSchema } from '../../lib/collections/BedsCollection';

const log = (Meteor.Logger ? Meteor.Logger.for('bedManagement') : console);

Meteor.ServerMethods.define('pacio.searchPatients', {
  description: 'Search patients by name or identifier for bed assignment',
  phi: true,
  positionalParams: ['searchText'],
  schemaObject: {
    type: 'object',
    properties: { searchText: { type: 'string' } },
    required: ['searchText']
  }
}, async function(params, context) {
    const searchText = params.searchText;

    const Patients = await global.Collections.Patients;
    if (!Patients) {
      console.warn('Patients collection not found'); // phi-audit: ok
      return [];
    }

    const searchRegex = new RegExp(searchText, 'i');
    const query = {
      $or: [
        { 'name.text': searchRegex },
        { 'name.family': searchRegex },
        { 'name.given': searchRegex },
        { 'identifier.value': searchRegex }
      ]
    };

    return await Patients.find(query, {
      limit: 50,
      sort: { 'name.family': 1, 'name.given': 1 }
    }).fetchAsync();
});

Meteor.ServerMethods.define('pacio.assignPatientToBed', {
  description: 'Assign a patient to a bed, opening an inpatient Encounter',
  phi: true,
  positionalParams: ['bedId', 'patientId', 'additionalInfo'],
  // patientId is intentionally loose (accepts string ids and legacy Mongo
  // ObjectID shapes — see the coercion block below).
  schemaObject: {
    type: 'object',
    properties: {
      bedId: { type: 'string' },
      patientId: {},
      additionalInfo: { type: 'object' }
    },
    required: ['bedId', 'patientId']
  }
}, async function(params, context) {
    const bedId = params.bedId;
    const patientId = params.patientId;
    const additionalInfo = params.additionalInfo;

    context.log.debug('assignPatientToBed called', { bedId, patientIdType: typeof patientId });

    // Convert patientId to string if it's a MongoDB ObjectID
    let patientIdString = patientId;
    if (typeof patientId === 'object' && patientId !== null) {
      if (patientId._str) {
        // MongoDB ObjectID from client (has _str property)
        patientIdString = patientId._str;
      } else if (typeof patientId.toHexString === 'function') {
        // MongoDB ObjectID with toHexString method
        patientIdString = patientId.toHexString();
      } else if (typeof patientId.toString === 'function') {
        // Generic object with toString method
        patientIdString = patientId.toString();
      }
    }

    log.debug('patientIdString after conversion:', { patientIdString });

    // Check if bed exists and is available
    const bed = await Beds.findOneAsync({ _id: bedId });
    if (!bed) {
      throw new Meteor.Error('bed-not-found', 'Bed not found');
    }

    if (bed.status !== 'available' && bed.status !== 'vacant') {
      throw new Meteor.Error('bed-not-available', 'Bed is not available');
    }

    // Get patient details
    const Patients = await global.Collections.Patients;
    if (!Patients) {
      throw new Meteor.Error('patients-not-found', 'Patients collection not found');
    }

    // Query for patient - always try ObjectID first, then fall back to string
    let patient;
    const { Mongo } = Package.mongo;

    try {
      // Try ObjectID lookup first (most common case)
      const objectId = new Mongo.ObjectID(patientIdString);
      patient = await Patients.findOneAsync({ _id: objectId });
      console.log('ObjectID lookup result:', patient ? 'Found' : 'Not found'); // phi-audit: ok
    } catch (e) {
      console.log('ObjectID conversion failed:', e.message);
    }

    // If ObjectID lookup failed, try string lookup
    if (!patient) {
      console.log('Trying string ID lookup...');
      patient = await Patients.findOneAsync({ _id: patientIdString });
      console.log('String lookup result:', patient ? 'Found' : 'Not found'); // phi-audit: ok
    }

    if (!patient) {
      log.error('Patient not found with ID:', { patientIdString });
      throw new Meteor.Error('patient-not-found', 'Patient not found');
    }

    log.debug('Patient found:', { id: patient._id });

    // Extract patient info
    const patientName = patient.name?.[0]?.text || 
                       `${patient.name?.[0]?.given?.[0] || ''} ${patient.name?.[0]?.family || ''}`.trim() ||
                       'Unknown Patient';
    const patientMRN = patient.identifier?.[0]?.value || `MRN-${patient._id.substring(0, 6)}`;
    const patientAge = patient.birthDate ? Math.floor((Date.now() - new Date(patient.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

    // Create a FHIR Encounter for this bed assignment so the patient lifecycle
    // on the bed produces a real, closeable Encounter record. The Encounter id
    // is stashed on the bed (encounterId) so discharge can close it later.
    let encounterId = null;
    try {
      const Encounters = global.Collections && global.Collections.Encounters;
      if (Encounters) {
        const admissionDate = additionalInfo?.admissionDate || new Date();
        // FHIR dateTime is a string — store ISO strings (not Date objects) so
        // date-window comparisons against other resources' string dates work
        // (e.g. the CMS1317 evaluator's authoredOn/document-date checks).
        const admissionDateTime = admissionDate instanceof Date ?
          admissionDate.toISOString() : admissionDate;
        const newEncounterId = Random.id();
        const encounter = {
          _id: newEncounterId,
          id: newEncounterId,
          resourceType: 'Encounter',
          status: 'in-progress',
          // Bed assignment is an inpatient admission — class IMP (not AMB).
          // CMS1317's initial-population gate matches Encounter.class IMP/ACUTE.
          class: {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: 'IMP',
            display: 'inpatient encounter'
          },
          subject: {
            reference: 'Patient/' + (patient.id || patientIdString),
            display: patientName
          },
          period: {
            start: admissionDateTime
          },
          meta: {
            lastUpdated: new Date(),
            versionId: '1'
          }
        };
        await Encounters.insertAsync(encounter);
        encounterId = newEncounterId;
        log.phi('Created Encounter for patient', { encounterId, patientName }, { action: 'create' });
      } else {
        console.warn('[pacio.assignPatientToBed] Encounters collection not found; skipping Encounter creation'); // phi-audit: ok
      }
    } catch (encounterError) {
      // Don't block the bed assignment if Encounter creation fails
      console.error('[pacio.assignPatientToBed] Error creating Encounter:', encounterError); // phi-audit: ok
    }

    // Update the bed
    try {
      const updateFields = {
        status: 'occupied',
        patientId: patientIdString,
        patientName: patientName,
        patientMRN: patientMRN,
        patientAge: patientAge,
        admissionDate: additionalInfo?.admissionDate || new Date(),
        updatedBy: context.userId,
        updatedAt: new Date()
      };

      // Link the Encounter created above (if any) to the bed
      if (encounterId) {
        updateFields.encounterId = encounterId;
      }

      // Add optional fields if provided
      if (additionalInfo?.attendingPhysician) {
        updateFields.attendingPhysician = additionalInfo.attendingPhysician;
      }
      if (additionalInfo?.primaryNurse) {
        updateFields.primaryNurse = additionalInfo.primaryNurse;
      }
      if (additionalInfo?.expectedDischargeDate) {
        updateFields.expectedDischargeDate = additionalInfo.expectedDischargeDate;
      }

      await Beds.updateAsync(
        { _id: bedId },
        { $set: updateFields }
      );

      log.phi('Bed assigned to patient', { bedId: bed.bedId, patientName, patientIdString }, { action: 'update' });
      return { success: true, bedId: bedId };

    } catch (error) {
      console.error('Error updating bed:', error);
      throw new Meteor.Error('update-failed', 'Failed to update bed assignment');
    }
});

Meteor.ServerMethods.define('pacio.releaseBed', {
  description: 'Release a bed (set to cleaning) and close its associated Encounter',
  phi: true,
  positionalParams: ['bedId'],
  schemaObject: {
    type: 'object',
    properties: { bedId: { type: 'string' } },
    required: ['bedId']
  }
}, async function(params, context) {
    const bedId = params.bedId;

    try {
      // Close the Encounter associated with this bed (set period.end + finished)
      const bed = await Beds.findOneAsync({ _id: bedId });
      const encounterId = bed && bed.encounterId;
      if (encounterId) {
        const Encounters = global.Collections && global.Collections.Encounters;
        if (Encounters) {
          // FHIR dateTime is a string — ISO string keeps discharge comparable
          // with document/order dates (CMS1317 date-window checks)
          await Encounters.updateAsync(
            { _id: encounterId },
            { $set: { 'period.end': new Date().toISOString(), status: 'finished' } }
          );
          console.log(`[pacio.releaseBed] Closed Encounter ${encounterId} for bed ${bedId}`);
        } else {
          console.warn('[pacio.releaseBed] Encounters collection not found; cannot close Encounter');
        }
      } else {
        console.log(`[pacio.releaseBed] No encounterId on bed ${bedId}; nothing to close`);
      }

      await Beds.updateAsync(
        { _id: bedId },
        {
          $set: {
            status: 'cleaning',
            updatedBy: context.userId,
            updatedAt: new Date()
          },
          $unset: {
            patientId: 1,
            encounterId: 1,
            patientName: 1,
            patientMRN: 1,
            patientAge: 1,
            admissionDate: 1,
            expectedDischargeDate: 1,
            attendingPhysician: 1,
            primaryNurse: 1,
            primaryCondition: 1,
            acuityLevel: 1,
            vitals: 1,
            medications: 1,
            labs: 1,
            tasks: 1,
            fallRisk: 1,
            isolation: 1,
            dietRestrictions: 1
          }
        }
      );

      console.log(`Bed ${bedId} released and set to cleaning status`);
      return { success: true };

    } catch (error) {
      console.error('Error releasing bed:', error);
      throw new Meteor.Error('release-failed', 'Failed to release bed');
    }
});

Meteor.ServerMethods.define('pacio.updateBedStatus', {
  description: 'Update a bed\'s status flag',
  phi: false,
  positionalParams: ['bedId', 'newStatus'],
  schemaObject: {
    type: 'object',
    properties: {
      bedId: { type: 'string' },
      newStatus: { type: 'string', enum: ['available', 'occupied', 'maintenance', 'cleaning', 'reserved'] }
    },
    required: ['bedId', 'newStatus']
  }
}, async function(params, context) {
    const bedId = params.bedId;
    const newStatus = params.newStatus;

    try {
      await Beds.updateAsync(
        { _id: bedId },
        {
          $set: {
            status: newStatus,
            updatedBy: context.userId,
            updatedAt: new Date()
          }
        }
      );

      return { success: true };

    } catch (error) {
      console.error('Error updating bed status:', error);
      throw new Meteor.Error('update-failed', 'Failed to update bed status');
    }
});

Meteor.ServerMethods.define('pacio.createBed', {
  description: 'Create a new bed record',
  phi: false,
  positionalParams: ['bedData'],
  schemaObject: {
    type: 'object',
    properties: { bedData: { type: 'object' } },
    required: ['bedData']
  }
}, async function(params, context) {
    const bedData = params.bedData;

    // Validate the data against our schema
    try {
      BedSchema.validate(bedData);
    } catch (error) {
      throw new Meteor.Error('validation-failed', error.message);
    }

    // Add metadata
    const bedToInsert = {
      ...bedData,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: context.userId
    };

    try {
      const bedId = await Beds.insertAsync(bedToInsert);
      console.log(`Created new bed ${bedData.bedId} with ID ${bedId}`);
      return { success: true, bedId };
    } catch (error) {
      console.error('Error creating bed:', error);
      throw new Meteor.Error('insert-failed', 'Failed to create bed');
    }
});

Meteor.ServerMethods.define('pacio.getGoogleMapsApiKey', {
  description: 'Return the configured Google Maps API key for the facility map',
  // Public by pre-migration design: facility location is public information and
  // the method explicitly required no authentication.
  requireAuth: false,
  phi: false
}, async function() {
    // Get Google Maps API key, preferring environment variable over placeholder
    let apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    console.log('Checking for Google Maps API key...');
    console.log('Environment variable GOOGLE_MAPS_API_KEY:', apiKey ? 'Found' : 'Not found');
    
    // If no environment variable, check settings
    if (!apiKey) {
      apiKey = Meteor.settings?.private?.google?.maps?.apiKey ||
               Meteor.settings?.private?.google?.mapsApiKey ||
               Meteor.settings?.private?.googleMapsApiKey || 
               Meteor.settings?.google?.mapsApiKey;
               
      console.log('Settings value:', apiKey ? apiKey.substring(0, 10) + '...' : 'Not found');
               
      // If the settings value is the placeholder, ignore it
      if (apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        console.log('Ignoring placeholder value from settings');
        apiKey = null;
      }
    }

    if (!apiKey) {
      console.warn('Google Maps API key not found in settings or environment variables');
      throw new Meteor.Error('api-key-not-found', 'Google Maps API key is not configured');
    }

    console.log('Google Maps API key retrieved successfully');
    return apiKey;
});

Meteor.ServerMethods.define('pacio.updateFacilityName', {
  description: 'Stamp the configured facility name onto every bed record',
  phi: false
}, async function(params, context) {
    const facilityName = Meteor.settings?.public?.pacio?.facilityName || "Rainbow's End Medical Home";

    try {
      const result = await Beds.updateAsync(
        {},
        {
          $set: {
            facilityName: facilityName,
            updatedAt: new Date(),
            updatedBy: context.userId
          }
        },
        { multi: true }
      );

      console.log(`Updated facility name to "${facilityName}" for ${result} beds`);
      return { success: true, bedsUpdated: result };
    } catch (error) {
      console.error('Error updating facility name:', error);
      throw new Meteor.Error('update-failed', 'Failed to update facility name');
    }
});

Meteor.ServerMethods.define('pacio.checkBeds', {
  description: 'Report the bed count, seeding sample beds when the collection is empty',
  // Public by pre-migration design: explicitly no-auth debugging/bootstrap helper.
  requireAuth: false,
  phi: false
}, async function() {
    const count = await Beds.find({}).countAsync();
    console.log(`Total beds in collection: ${count}`);

    if (count === 0) {
      console.log('No beds found, triggering initialization...');
      const { initializeSampleBeds } = await import('../sampleData/initializeBeds');
      await initializeSampleBeds();
      const newCount = await Beds.find({}).countAsync();
      return { message: `Initialized ${newCount} beds`, count: newCount };
    }
    
    const beds = await Beds.find({}, { limit: 5 }).fetchAsync();
    return { count, sampleBeds: beds };
});