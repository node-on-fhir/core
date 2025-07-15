import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import { Medications } from '../lib/schemas/SimpleSchemas/Medications';
import { MedicationAdministrations } from '../lib/schemas/SimpleSchemas/MedicationAdministrations';
import { MedicationRequests } from '../lib/schemas/SimpleSchemas/MedicationRequests';

/**
 * Extracts medication information from a MedicationAdministration or MedicationRequest
 * and creates a Medication resource format
 */
function extractMedicationFromResource(resource, resourceType) {
  let medication = {
    resourceType: 'Medication',
    status: 'active'
  };

  // Handle medication reference vs medicationCodeableConcept
  if (get(resource, 'medicationReference')) {
    // If it's a reference to an existing medication, we might already have it
    return null; // Skip creating a duplicate
  } else if (get(resource, 'medicationCodeableConcept')) {
    // Extract medication details from CodeableConcept
    const medConcept = get(resource, 'medicationCodeableConcept');
    
    medication.code = {
      coding: get(medConcept, 'coding', []),
      text: get(medConcept, 'text', '')
    };

    // Generate an identifier based on the code
    if (get(medConcept, 'coding[0].code')) {
      medication.identifier = [{
        system: 'urn:oid:2.16.840.1.113883.6.88', // RxNorm OID
        value: get(medConcept, 'coding[0].code')
      }];
    }

    // Add source information
    medication.extension = [{
      url: 'http://hl7.org/fhir/StructureDefinition/medication-reconciliation-source',
      valueString: `${resourceType}/${get(resource, 'id', 'unknown')}`
    }];

    return medication;
  }

  return null;
}

/**
 * Extracts unique medications from MedicationAdministrations and MedicationRequests
 * and inserts them into the Medications collection
 */
export function reconcileMedications(patientId = null) {
  console.log('Starting medication reconciliation process...');
  
  let query = {};
  if (patientId) {
    query = {
      $or: [
        { 'subject.reference': `Patient/${patientId}` },
        { 'subject.reference': `urn:uuid:${patientId}` },
        { 'patient.reference': `Patient/${patientId}` },
        { 'patient.reference': `urn:uuid:${patientId}` }
      ]
    };
  }

  const medicationsToInsert = new Map(); // Use Map to avoid duplicates by code

  // Extract from MedicationAdministrations
  const administrations = MedicationAdministrations.find(query).fetch();
  console.log(`Found ${administrations.length} MedicationAdministrations`);
  
  administrations.forEach((admin) => {
    const medication = extractMedicationFromResource(admin, 'MedicationAdministration');
    if (medication && get(medication, 'code.coding[0].code')) {
      const key = get(medication, 'code.coding[0].code');
      if (!medicationsToInsert.has(key)) {
        medicationsToInsert.set(key, medication);
      }
    }
  });

  // Extract from MedicationRequests
  const requests = MedicationRequests.find(query).fetch();
  console.log(`Found ${requests.length} MedicationRequests`);
  
  requests.forEach((request) => {
    const medication = extractMedicationFromResource(request, 'MedicationRequest');
    if (medication && get(medication, 'code.coding[0].code')) {
      const key = get(medication, 'code.coding[0].code');
      if (!medicationsToInsert.has(key)) {
        medicationsToInsert.set(key, medication);
      }
    }
  });

  console.log(`Found ${medicationsToInsert.size} unique medications to reconcile`);

  // Insert medications that don't already exist
  let inserted = 0;
  let updated = 0;

  medicationsToInsert.forEach((medication, code) => {
    // Check if medication already exists
    const existing = Medications.findOne({
      'code.coding.code': code
    });

    if (!existing) {
      // Insert new medication
      try {
        medication.id = Random.id();
        Medications.insert(medication);
        inserted++;
      } catch (error) {
        console.error('Error inserting medication:', error);
      }
    } else {
      // Optionally update existing medication with additional information
      // For now, we'll skip updates
      updated++;
    }
  });

  console.log(`Medication reconciliation complete. Inserted: ${inserted}, Already existed: ${updated}`);
  
  return {
    processed: medicationsToInsert.size,
    inserted: inserted,
    existed: updated
  };
}

/**
 * Reconcile medications for a specific patient
 */
export function reconcileMedicationsForPatient(patientId) {
  if (!patientId) {
    throw new Error('Patient ID is required');
  }
  return reconcileMedications(patientId);
}

/**
 * Reconcile all medications in the system
 */
export function reconcileAllMedications() {
  return reconcileMedications();
}

// Meteor methods for server-side execution
if (Meteor.isServer) {
  Meteor.methods({
    'medications.reconcile': function(patientId = null) {
      return reconcileMedications(patientId);
    },
    'medications.reconcileForPatient': function(patientId) {
      return reconcileMedicationsForPatient(patientId);
    },
    'medications.reconcileAll': function() {
      return reconcileAllMedications();
    }
  });
}

export default {
  reconcileMedications,
  reconcileMedicationsForPatient,
  reconcileAllMedications
};