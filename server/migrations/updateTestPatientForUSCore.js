// server/migrations/updateTestPatientForUSCore.js
//
// Migration script to update test patient(s) with US Core must-support elements
// This adds historical name/address data that cannot be fabricated by decorators.
//
// Run this migration to prepare patient data for Inferno US Core testing.
//
// Required elements added:
// - name with use:"old" and period.end (historical name)
// - name.suffix (professional designation)
// - address with use:"old" and period.end (historical address)

import { Meteor } from 'meteor/meteor';
import { get, set } from 'lodash';

/**
 * Update a patient to include US Core must-support structural elements
 * These represent actual historical data that cannot be fabricated.
 *
 * @param {string} patientId - The FHIR id of the patient to update
 * @param {Object} historicalData - Historical name and address data
 */
export async function addUSCoreHistoricalData(patientId, historicalData) {
  console.log('addUSCoreHistoricalData: Updating patient', patientId);

  let Patients = null;

  // Get the Patients collection
  if (global.Collections && global.Collections.Patients) {
    Patients = await global.Collections.Patients;
  } else if (typeof global.Patients !== 'undefined') {
    Patients = global.Patients;
  } else {
    console.error('addUSCoreHistoricalData: Patients collection not found');
    return null;
  }

  // Find the patient
  let patient = await Patients.findOneAsync({ id: patientId });
  if (!patient) {
    console.error('addUSCoreHistoricalData: Patient not found with id', patientId);
    return null;
  }

  console.log('addUSCoreHistoricalData: Found patient', get(patient, 'name[0].family'));

  let updateDoc = {};

  // Build new name array with historical name
  if (historicalData.oldName) {
    let names = get(patient, 'name', []);

    // Check if historical name already exists
    let hasOldName = names.some(function(n) { return n.use === 'old'; });

    if (!hasOldName) {
      // Create historical name entry
      let oldName = {
        use: 'old',
        family: historicalData.oldName.family,
        given: historicalData.oldName.given || [],
        period: {
          start: historicalData.oldName.periodStart,
          end: historicalData.oldName.periodEnd
        }
      };
      names.unshift(oldName);
    }

    // Ensure current name has suffix if provided
    if (historicalData.suffix) {
      let currentName = names.find(function(n) {
        return n.use === 'official' || n.use === 'usual' || !n.use;
      });
      if (currentName && !currentName.suffix) {
        currentName.suffix = [historicalData.suffix];
      }
    }

    updateDoc['name'] = names;
  }

  // Build new address array with historical address
  if (historicalData.oldAddress) {
    let addresses = get(patient, 'address', []);

    // Check if historical address already exists
    let hasOldAddress = addresses.some(function(a) { return a.use === 'old'; });

    if (!hasOldAddress) {
      // Create historical address entry
      let oldAddress = {
        use: 'old',
        line: historicalData.oldAddress.line || [],
        city: historicalData.oldAddress.city,
        state: historicalData.oldAddress.state,
        postalCode: historicalData.oldAddress.postalCode,
        country: historicalData.oldAddress.country || 'US',
        period: {
          start: historicalData.oldAddress.periodStart,
          end: historicalData.oldAddress.periodEnd
        }
      };
      addresses.unshift(oldAddress);
    }

    // Ensure current address has period.start
    let currentAddress = addresses.find(function(a) { return a.use !== 'old'; });
    if (currentAddress && !get(currentAddress, 'period.start')) {
      if (!currentAddress.period) {
        currentAddress.period = {};
      }
      currentAddress.period.start = historicalData.oldAddress.periodEnd;
    }

    updateDoc['address'] = addresses;
  }

  // Add deceasedDateTime if provided
  if (historicalData.deceasedDateTime) {
    updateDoc['deceasedDateTime'] = historicalData.deceasedDateTime;
  }

  // Update the patient
  if (Object.keys(updateDoc).length > 0) {
    let result = await Patients.updateAsync(
      { _id: patient._id },
      { $set: updateDoc }
    );
    console.log('addUSCoreHistoricalData: Updated patient, modified:', result);
    return result;
  } else {
    console.log('addUSCoreHistoricalData: No updates needed for patient');
    return 0;
  }
}

/**
 * Update the primary test patient for Inferno US Core testing
 * This is the patient used in (g)(10) certification tests.
 */
export async function updateInfernoTestPatient() {
  // Default test patient historical data
  // Adjust these values based on your actual test patient
  let historicalData = {
    oldName: {
      family: 'Smith',  // Maiden name / previous name
      given: ['Lemuel'],
      periodStart: '1921-12-29',
      periodEnd: '1950-01-01'
    },
    suffix: 'Sr.',  // Professional suffix for current name
    oldAddress: {
      line: ['123 Old Street'],
      city: 'Boston',
      state: 'MA',
      postalCode: '02101',
      country: 'US',
      periodStart: '1921-12-29',
      periodEnd: '1980-01-01'
    }
    // Uncomment if testing deceased patient
    // deceasedDateTime: '2025-01-15T10:30:00Z'
  };

  // Try to find and update the first test patient
  let Patients = null;
  if (global.Collections && global.Collections.Patients) {
    Patients = await global.Collections.Patients;
  } else if (typeof global.Patients !== 'undefined') {
    Patients = global.Patients;
  }

  if (!Patients) {
    console.error('updateInfernoTestPatient: Patients collection not available');
    return;
  }

  // Find a patient to update (the first one, or specify by ID)
  let testPatient = await Patients.findOneAsync({});
  if (testPatient) {
    console.log('updateInfernoTestPatient: Updating patient', get(testPatient, 'id'));
    await addUSCoreHistoricalData(testPatient.id, historicalData);
  } else {
    console.log('updateInfernoTestPatient: No patients found in database');
  }
}

// Export for use in Meteor shell or methods
export default {
  addUSCoreHistoricalData,
  updateInfernoTestPatient
};
