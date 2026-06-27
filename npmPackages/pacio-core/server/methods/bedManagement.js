// /packages/pacio-core/server/methods/bedManagement.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { Beds, BedSchema } from '../../lib/collections/BedsCollection';

Meteor.methods({
  'pacio.searchPatients': async function(searchText) {
    check(searchText, String);

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }

    const Patients = await global.Collections.Patients;
    if (!Patients) {
      console.warn('Patients collection not found');
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
  },

  'pacio.assignPatientToBed': async function(bedId, patientId, additionalInfo) {
    console.log('=== pacio.assignPatientToBed called ===');
    console.log('bedId:', bedId);
    console.log('patientId:', patientId, 'type:', typeof patientId);
    console.log('additionalInfo:', additionalInfo);

    check(bedId, String);
    // Handle both String IDs and MongoDB ObjectIDs
    check(patientId, Match.Where(function(id) {
      // Accept strings
      if (typeof id === 'string') return true;
      // Accept MongoDB ObjectIDs (which have _str property or toHexString method)
      if (typeof id === 'object' && id !== null) {
        return id._str !== undefined || typeof id.toHexString === 'function' || typeof id.toString === 'function';
      }
      return false;
    }));
    check(additionalInfo, Match.Maybe({
      attendingPhysician: Match.Maybe(String),
      primaryNurse: Match.Maybe(String),
      expectedDischargeDate: Match.Maybe(Date),
      admissionDate: Match.Maybe(Date)
    }));

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }

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

    console.log('patientIdString after conversion:', patientIdString);

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
      console.log('ObjectID lookup result:', patient ? 'Found' : 'Not found');
    } catch (e) {
      console.log('ObjectID conversion failed:', e.message);
    }

    // If ObjectID lookup failed, try string lookup
    if (!patient) {
      console.log('Trying string ID lookup...');
      patient = await Patients.findOneAsync({ _id: patientIdString });
      console.log('String lookup result:', patient ? 'Found' : 'Not found');
    }

    if (!patient) {
      console.error('Patient not found with ID:', patientIdString);
      throw new Meteor.Error('patient-not-found', 'Patient not found');
    }

    console.log('✓ Patient found:', patient._id);

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
        const newEncounterId = Random.id();
        const encounter = {
          _id: newEncounterId,
          id: newEncounterId,
          resourceType: 'Encounter',
          status: 'in-progress',
          class: {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: 'AMB',
            display: 'ambulatory'
          },
          subject: {
            reference: 'Patient/' + (patient.id || patientIdString),
            display: patientName
          },
          period: {
            start: admissionDate
          },
          meta: {
            lastUpdated: new Date(),
            versionId: '1'
          }
        };
        await Encounters.insertAsync(encounter);
        encounterId = newEncounterId;
        console.log(`[pacio.assignPatientToBed] Created Encounter ${encounterId} for patient ${patientName}`);
      } else {
        console.warn('[pacio.assignPatientToBed] Encounters collection not found; skipping Encounter creation');
      }
    } catch (encounterError) {
      // Don't block the bed assignment if Encounter creation fails
      console.error('[pacio.assignPatientToBed] Error creating Encounter:', encounterError);
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
        updatedBy: this.userId,
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

      console.log(`Bed ${bed.bedId} assigned to patient ${patientName} (${patientIdString})`);
      return { success: true, bedId: bedId };
      
    } catch (error) {
      console.error('Error updating bed:', error);
      throw new Meteor.Error('update-failed', 'Failed to update bed assignment');
    }
  },

  'pacio.releaseBed': async function(bedId) {
    check(bedId, String);

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }

    try {
      // Close the Encounter associated with this bed (set period.end + finished)
      const bed = await Beds.findOneAsync({ _id: bedId });
      const encounterId = bed && bed.encounterId;
      if (encounterId) {
        const Encounters = global.Collections && global.Collections.Encounters;
        if (Encounters) {
          await Encounters.updateAsync(
            { _id: encounterId },
            { $set: { 'period.end': new Date(), status: 'finished' } }
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
            updatedBy: this.userId,
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
  },

  'pacio.updateBedStatus': async function(bedId, newStatus) {
    check(bedId, String);
    check(newStatus, Match.OneOf('available', 'occupied', 'maintenance', 'cleaning', 'reserved'));

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }

    try {
      await Beds.updateAsync(
        { _id: bedId },
        { 
          $set: {
            status: newStatus,
            updatedBy: this.userId,
            updatedAt: new Date()
          }
        }
      );

      return { success: true };
      
    } catch (error) {
      console.error('Error updating bed status:', error);
      throw new Meteor.Error('update-failed', 'Failed to update bed status');
    }
  },

  'pacio.createBed': async function(bedData) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }

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
      updatedBy: this.userId
    };

    try {
      const bedId = await Beds.insertAsync(bedToInsert);
      console.log(`Created new bed ${bedData.bedId} with ID ${bedId}`);
      return { success: true, bedId };
    } catch (error) {
      console.error('Error creating bed:', error);
      throw new Meteor.Error('insert-failed', 'Failed to create bed');
    }
  },

  'pacio.getGoogleMapsApiKey': async function() {
    // No authentication required - facility location is public information

    // Get Google Maps API key, preferring environment variable over placeholder
    let apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    console.log('Checking for Google Maps API key...');
    console.log('Environment variable GOOGLE_MAPS_API_KEY:', apiKey ? 'Found' : 'Not found');
    
    // If no environment variable, check settings
    if (!apiKey) {
      apiKey = Meteor.settings?.private?.google?.mapsApiKey || 
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
  },

  'pacio.updateFacilityName': async function() {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }

    const facilityName = Meteor.settings?.public?.pacio?.facilityName || "Rainbow's End Medical Home";
    
    try {
      const result = await Beds.updateAsync(
        {},
        { 
          $set: {
            facilityName: facilityName,
            updatedAt: new Date(),
            updatedBy: this.userId
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
  },

  'pacio.checkBeds': async function() {
    // No auth required - for debugging
    const count = await Beds.countAsync();
    console.log(`Total beds in collection: ${count}`);
    
    if (count === 0) {
      console.log('No beds found, triggering initialization...');
      const { initializeSampleBeds } = await import('../sampleData/initializeBeds');
      await initializeSampleBeds();
      const newCount = await Beds.countAsync();
      return { message: `Initialized ${newCount} beds`, count: newCount };
    }
    
    const beds = await Beds.find({}, { limit: 5 }).fetchAsync();
    return { count, sampleBeds: beds };
  }
});