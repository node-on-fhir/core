// packages/admin-tools/server/deletePatientMethods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import { Random } from 'meteor/random';

// Patient Compartment: maps collection names to their patient reference field paths.
// Appointments excluded (shared via participant.actor.reference).
// AuditEvents excluded (preserved as historical audit trail).
const PATIENT_COMPARTMENT_MAP = {
  'Observations': 'subject.reference',
  'Conditions': 'subject.reference',
  'Procedures': 'subject.reference',
  'Encounters': 'subject.reference',
  'DiagnosticReports': 'subject.reference',
  'DocumentReferences': 'subject.reference',
  'CarePlans': 'subject.reference',
  'CareTeams': 'subject.reference',
  'Goals': 'subject.reference',
  'ServiceRequests': 'subject.reference',
  'MedicationRequests': 'subject.reference',
  'MedicationAdministrations': 'subject.reference',
  'MedicationStatements': 'subject.reference',
  'AllergyIntolerances': 'patient.reference',
  'Immunizations': 'patient.reference',
  'Claims': 'patient.reference',
  'ClaimResponses': 'patient.reference',
  'ExplanationOfBenefits': 'patient.reference',
  'Coverages': 'subscriber.reference',
  'Communications': 'subject.reference',
  'CommunicationRequests': 'subject.reference',
  'Compositions': 'subject.reference',
  'Consents': 'patient.reference',
  'Devices': 'patient.reference',
  'ImagingStudies': 'subject.reference',
  'Lists': 'subject.reference',
  'NutritionOrders': 'patient.reference',
  'QuestionnaireResponses': 'subject.reference',
  'Specimens': 'subject.reference',
  'Tasks': 'for.reference',
  'RelatedPersons': 'patient.reference',
  'Provenances': 'target.reference',
  'Measures': 'subject.reference',
  'MeasureReports': 'subject.reference',
  'BodyStructures': 'patient.reference'
};

/**
 * Build a query that matches both Patient/{_id} and Patient/{fhirId}
 * when they differ. Uses the correct reference field for each collection.
 */
function buildPatientQuery(refField, mongoId, fhirId) {
  const refs = ['Patient/' + mongoId];
  if (fhirId && fhirId !== mongoId) {
    refs.push('Patient/' + fhirId);
  }

  if (refs.length === 1) {
    return { [refField]: refs[0] };
  }
  return { [refField]: { $in: refs } };
}

Meteor.methods({
  /**
   * Search for patients by name, MRN, or _id
   * Returns up to 10 flattened results for display
   */
  'adminTools.deletePatient.search': async function(searchTerm) {
    check(searchTerm, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    const collections = global.Collections || Meteor.Collections || {};
    const Patients = collections['Patients'];

    if (!Patients) {
      throw new Meteor.Error('collection-not-found', 'Patients collection not registered');
    }

    const trimmed = searchTerm.trim();
    if (!trimmed) {
      return [];
    }

    // Build $or query: match _id exactly, or name fields by regex
    const regexPattern = { $regex: trimmed, $options: 'i' };
    const query = {
      $or: [
        { _id: trimmed },
        { 'name.0.family': regexPattern },
        { 'name.0.given': regexPattern },
        { 'name.0.text': regexPattern },
        { 'identifier.value': regexPattern }
      ]
    };

    console.log('[adminTools.deletePatient.search] Searching for:', trimmed);

    const patients = await Patients.find(query, { limit: 10, sort: { 'name.0.family': 1 } }).fetchAsync();

    // Flatten for display
    const results = patients.map(function(patient) {
      return {
        _id: get(patient, '_id'),
        id: get(patient, 'id'),
        familyName: get(patient, 'name.0.family', ''),
        givenName: get(patient, 'name.0.given.0', ''),
        fullName: get(patient, 'name.0.text', ''),
        gender: get(patient, 'gender', ''),
        birthDate: get(patient, 'birthDate', ''),
        mrn: (get(patient, 'identifier', []).find(function(ident) {
          return get(ident, 'type.coding.0.code') === 'MR';
        }) || {}).value || ''
      };
    });

    console.log('[adminTools.deletePatient.search] Found ' + results.length + ' patients');
    return results;
  },

  /**
   * Dry-run: counts all linked resources without deleting anything
   */
  'adminTools.deletePatient.dryRun': async function(patientId) {
    check(patientId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    // Check feature flag
    const allowDeletion = get(Meteor, 'settings.public.defaults.allowPatientDeletion', false);
    if (!allowDeletion) {
      throw new Meteor.Error('feature-disabled', 'Patient deletion is disabled. Set Meteor.settings.public.defaults.allowPatientDeletion to true.');
    }

    const collections = global.Collections || Meteor.Collections || {};
    const Patients = collections['Patients'];

    if (!Patients) {
      throw new Meteor.Error('collection-not-found', 'Patients collection not registered');
    }

    // Look up patient by _id (anti-pattern compliant)
    const patient = await Patients.findOneAsync({ _id: patientId });
    if (!patient) {
      throw new Meteor.Error('patient-not-found', 'Patient not found with _id: ' + patientId);
    }

    const mongoId = get(patient, '_id');
    const fhirId = get(patient, 'id');
    const patientName = get(patient, 'name.0.text',
      (get(patient, 'name.0.given.0', '') + ' ' + get(patient, 'name.0.family', '')).trim()
    );

    console.log('[adminTools.deletePatient.dryRun] Scanning linked resources for patient:', mongoId, patientName);

    const resourceCounts = {};
    let totalLinkedResources = 0;

    for (const [collectionName, refField] of Object.entries(PATIENT_COMPARTMENT_MAP)) {
      const collection = collections[collectionName];
      if (!collection || typeof collection.find !== 'function') {
        continue;
      }

      try {
        const query = buildPatientQuery(refField, mongoId, fhirId);
        const count = await collection.find(query).countAsync();
        if (count > 0) {
          resourceCounts[collectionName] = count;
          totalLinkedResources += count;
          console.log('[adminTools.deletePatient.dryRun]   ' + collectionName + ': ' + count);
        }
      } catch (error) {
        console.warn('[adminTools.deletePatient.dryRun] Error counting ' + collectionName + ':', error.message);
      }
    }

    console.log('[adminTools.deletePatient.dryRun] Total linked resources: ' + totalLinkedResources);

    return {
      patientId: mongoId,
      fhirId: fhirId,
      patientName: patientName,
      resourceCounts: resourceCounts,
      totalLinkedResources: totalLinkedResources
    };
  },

  /**
   * Execute cascade deletion of a patient and all linked resources.
   * Writes a FHIR R4 AuditEvent after deletion.
   */
  'adminTools.deletePatient.execute': async function(patientId) {
    check(patientId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    // Check feature flag
    const allowDeletion = get(Meteor, 'settings.public.defaults.allowPatientDeletion', false);
    if (!allowDeletion) {
      throw new Meteor.Error('feature-disabled', 'Patient deletion is disabled. Set Meteor.settings.public.defaults.allowPatientDeletion to true.');
    }

    const collections = global.Collections || Meteor.Collections || {};
    const Patients = collections['Patients'];

    if (!Patients) {
      throw new Meteor.Error('collection-not-found', 'Patients collection not registered');
    }

    // Look up patient by _id
    const patient = await Patients.findOneAsync({ _id: patientId });
    if (!patient) {
      throw new Meteor.Error('patient-not-found', 'Patient not found with _id: ' + patientId);
    }

    const mongoId = get(patient, '_id');
    const fhirId = get(patient, 'id');
    const patientName = get(patient, 'name.0.text',
      (get(patient, 'name.0.given.0', '') + ' ' + get(patient, 'name.0.family', '')).trim()
    );

    console.log('[adminTools.deletePatient.execute] Beginning cascade deletion for patient:', mongoId, patientName);

    const deletionResults = {};
    let totalDeleted = 0;

    // Delete linked resources first
    for (const [collectionName, refField] of Object.entries(PATIENT_COMPARTMENT_MAP)) {
      const collection = collections[collectionName];
      if (!collection || typeof collection.removeAsync !== 'function') {
        continue;
      }

      try {
        const query = buildPatientQuery(refField, mongoId, fhirId);
        const countBefore = await collection.find(query).countAsync();

        if (countBefore > 0) {
          await collection.removeAsync(query);
          deletionResults[collectionName] = countBefore;
          totalDeleted += countBefore;
          console.log('[adminTools.deletePatient.execute]   Deleted ' + countBefore + ' from ' + collectionName);
        }
      } catch (error) {
        console.error('[adminTools.deletePatient.execute] Error deleting from ' + collectionName + ':', error.message);
        deletionResults[collectionName] = 'error: ' + error.message;
      }
    }

    // Delete the Patient record last
    try {
      await Patients.removeAsync({ _id: mongoId });
      totalDeleted += 1;
      console.log('[adminTools.deletePatient.execute]   Deleted Patient record:', mongoId);
    } catch (error) {
      console.error('[adminTools.deletePatient.execute] Error deleting patient record:', error.message);
      throw new Meteor.Error('delete-patient-error', 'Failed to delete patient record: ' + error.message);
    }

    // Write FHIR R4 AuditEvent (non-blocking - failure here should not throw)
    try {
      const AuditEvents = collections['AuditEvents'];
      if (AuditEvents && typeof AuditEvents.insertAsync === 'function') {
        const auditEventId = Random.id();

        // Build per-collection entity entries
        const entityEntries = [
          {
            what: {
              reference: 'Patient/' + (fhirId || mongoId),
              display: patientName
            },
            detail: [
              { type: 'totalDeleted', valueString: String(totalDeleted) },
              { type: 'summary', valueString: JSON.stringify(deletionResults) }
            ]
          }
        ];

        for (const [colName, count] of Object.entries(deletionResults)) {
          if (typeof count === 'number') {
            entityEntries.push({
              what: { display: colName },
              detail: [{ type: 'count', valueString: String(count) }]
            });
          }
        }

        const auditEvent = {
          _id: auditEventId,
          id: auditEventId,
          resourceType: 'AuditEvent',
          type: {
            system: 'http://dicom.nema.org/resources/ontology/DCM',
            code: '110110',
            display: 'Patient Record'
          },
          action: 'D',
          recorded: new Date().toISOString(),
          outcome: '0',
          agent: [{
            who: { reference: 'User/' + this.userId },
            requestor: true
          }],
          source: {
            observer: { display: 'Honeycomb Admin Tools' }
          },
          entity: entityEntries
        };

        await AuditEvents.insertAsync(auditEvent);
        console.log('[adminTools.deletePatient.execute] AuditEvent recorded:', auditEventId);
      } else {
        console.warn('[adminTools.deletePatient.execute] AuditEvents collection not available; skipping audit log');
      }
    } catch (auditError) {
      console.error('[adminTools.deletePatient.execute] Failed to write AuditEvent (non-blocking):', auditError.message);
    }

    console.log('[adminTools.deletePatient.execute] Cascade deletion complete. Total deleted: ' + totalDeleted);

    return {
      success: true,
      patientId: mongoId,
      patientName: patientName,
      totalDeleted: totalDeleted,
      deletionResults: deletionResults
    };
  }
});
