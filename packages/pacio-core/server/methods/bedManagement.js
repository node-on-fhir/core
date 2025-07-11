// /packages/pacio-core/server/methods/bedManagement.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
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

  'pacio.assignPatientToBed': async function(bedId, patientId) {
    check(bedId, String);
    check(patientId, String);

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }

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

    const patient = await Patients.findOneAsync({ _id: patientId });
    if (!patient) {
      throw new Meteor.Error('patient-not-found', 'Patient not found');
    }

    // Extract patient info
    const patientName = patient.name?.[0]?.text || 
                       `${patient.name?.[0]?.given?.[0] || ''} ${patient.name?.[0]?.family || ''}`.trim() ||
                       'Unknown Patient';
    const patientMRN = patient.identifier?.[0]?.value || `MRN-${patient._id.substring(0, 6)}`;
    const patientAge = patient.birthDate ? Math.floor((Date.now() - new Date(patient.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

    // Update the bed
    try {
      await Beds.updateAsync(
        { _id: bedId },
        { 
          $set: {
            status: 'occupied',
            patientId: patientId,
            patientName: patientName,
            patientMRN: patientMRN,
            patientAge: patientAge,
            admissionDate: new Date(),
            updatedBy: this.userId,
            updatedAt: new Date()
          }
        }
      );

      console.log(`Bed ${bed.bedId} assigned to patient ${patientName} (${patientId})`);
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
  }
});