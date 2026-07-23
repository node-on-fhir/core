// packages/admin-tools/server/archivePatientMethods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import { Random } from 'meteor/random';

const log = (Meteor.Logger ? Meteor.Logger.for('archivePatientMethods') : console);

// Patient Compartment: maps collection names to their patient reference field paths.
// Duplicated from deletePatientMethods.js to keep features independent.
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

// -----------------------------------------------------------------------------
// ServerMethods registry (rpc-migration). Each method historically enforced an
// auth guard -> requireAuth defaults to true; the guards were deleted. The
// settings-gated feature check (feature-disabled on
// settings.private.allowPatientArchival) is PRESERVED inside each handler body:
// it must fire regardless of auth. phi:true — patient data flows.

Meteor.ServerMethods.define('adminTools.archivePatient.search', {
  description: 'Search patients by name, MRN, or _id for archival selection',
  phi: true,
  positionalParams: ['searchTerm'],
  schemaObject: {
    type: 'object',
    properties: { searchTerm: { type: 'string' } },
    required: ['searchTerm']
  }
}, async function(params, context) {
    const searchTerm = params.searchTerm;

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

    log.phi('Searching for', { searchTerm: trimmed }, { action: 'search' });

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

    log.debug('Found patients', { count: results.length });
    return results;
});

/**
 * Dry-run: counts all linked resources without deleting anything
 */
Meteor.ServerMethods.define('adminTools.archivePatient.dryRun', {
  description: 'Count all resources linked to a patient without deleting anything',
  phi: true,
  positionalParams: ['patientId'],
  schemaObject: {
    type: 'object',
    properties: { patientId: { type: 'string' } },
    required: ['patientId']
  }
}, async function(params, context) {
    const patientId = params.patientId;

    // Check feature flag (settings-gated feature — must fire regardless of auth)
    const allowArchival = get(Meteor, 'settings.private.allowPatientArchival', false);
    if (!allowArchival) {
      throw new Meteor.Error('feature-disabled', 'Patient archival is disabled. Set Meteor.settings.private.allowPatientArchival to true.');
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

    log.phi('Scanning linked resources for patient', { mongoId, patientName }, { action: 'read' });

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
          log.debug('Collection resource count', { collectionName, count });
        }
      } catch (error) {
        log.warn('Error counting collection', { collectionName, message: error.message });
      }
    }

    log.debug('Total linked resources', { totalLinkedResources });

    return {
      patientId: mongoId,
      fhirId: fhirId,
      patientName: patientName,
      resourceCounts: resourceCounts,
      totalLinkedResources: totalLinkedResources
    };
});

/**
 * Execute archive: build FHIR Bundle (placeholder), then cascade delete.
 * Writes a FHIR R4 AuditEvent after completion.
 */
Meteor.ServerMethods.define('adminTools.archivePatient.execute', {
  description: 'Archive a patient into a FHIR Bundle then cascade-delete all linked resources',
  phi: true,
  positionalParams: ['patientId'],
  schemaObject: {
    type: 'object',
    properties: { patientId: { type: 'string' } },
    required: ['patientId']
  }
}, async function(params, context) {
    const patientId = params.patientId;

    // Check feature flag (settings-gated feature — must fire regardless of auth)
    const allowArchival = get(Meteor, 'settings.private.allowPatientArchival', false);
    if (!allowArchival) {
      throw new Meteor.Error('feature-disabled', 'Patient archival is disabled. Set Meteor.settings.private.allowPatientArchival to true.');
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

    log.phi('Beginning archive for patient', { mongoId, patientName }, { action: 'delete' });

    // =========================================================================
    // STEP 1: Build FHIR Bundle (placeholder — assemble in memory, don't write)
    // =========================================================================

    const bundleEntries = [];

    // Add Patient resource to bundle
    bundleEntries.push({
      fullUrl: 'Patient/' + (fhirId || mongoId),
      resource: patient,
      request: {
        method: 'PUT',
        url: 'Patient/' + (fhirId || mongoId)
      }
    });

    // Gather all linked resources into the bundle
    for (const [collectionName, refField] of Object.entries(PATIENT_COMPARTMENT_MAP)) {
      const collection = collections[collectionName];
      if (!collection || typeof collection.find !== 'function') {
        continue;
      }

      try {
        const query = buildPatientQuery(refField, mongoId, fhirId);
        const resources = await collection.find(query).fetchAsync();

        for (const resource of resources) {
          const resourceType = get(resource, 'resourceType', collectionName.replace(/s$/, ''));
          const resourceId = get(resource, 'id', get(resource, '_id'));
          bundleEntries.push({
            fullUrl: resourceType + '/' + resourceId,
            resource: resource,
            request: {
              method: 'PUT',
              url: resourceType + '/' + resourceId
            }
          });
        }
      } catch (error) {
        log.warn('Error fetching from collection', { collectionName, message: error.message });
      }
    }

    const bundle = {
      resourceType: 'Bundle',
      type: 'collection',
      timestamp: new Date().toISOString(),
      total: bundleEntries.length,
      entry: bundleEntries
    };

    const bundleJson = JSON.stringify(bundle);
    const bundleSizeBytes = Buffer.byteLength(bundleJson, 'utf8');

    log.debug('Archive bundle assembled', { resourceCount: bundleEntries.length, sizeBytes: bundleSizeBytes });

    // TODO: Write bundle to disk / S3 / archive storage
    // For v1, the bundle is assembled in memory but not persisted.
    // Future implementations should write to a configured storage backend.

    const bundleMetadata = {
      resourceCount: bundleEntries.length,
      estimatedSizeBytes: bundleSizeBytes,
      format: 'fhir-bundle',
      exported: false
    };

    // =========================================================================
    // STEP 2: Cascade delete all linked resources + patient
    // =========================================================================

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
          log.debug('Deleted from collection', { count: countBefore, collectionName });
        }
      } catch (error) {
        log.error('Error deleting from collection', { collectionName, message: error.message });
        deletionResults[collectionName] = 'error: ' + error.message;
      }
    }

    // Delete the Patient record last
    try {
      await Patients.removeAsync({ _id: mongoId });
      totalDeleted += 1;
      log.debug('Deleted Patient record', { mongoId });
    } catch (error) {
      log.error('Error deleting patient record', { message: error.message });
      throw new Meteor.Error('archive-patient-error', 'Failed to delete patient record: ' + error.message);
    }

    // =========================================================================
    // STEP 3: Write FHIR R4 AuditEvent
    // =========================================================================

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
              { type: 'summary', valueString: JSON.stringify(deletionResults) },
              { type: 'archiveFormat', valueString: 'fhir-bundle' },
              { type: 'archiveBundleSize', valueString: String(bundleSizeBytes) },
              { type: 'archiveResourceCount', valueString: String(bundleEntries.length) }
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
          subtype: [{
            system: 'http://hl7.org/fhir/restful-interaction',
            code: 'delete',
            display: 'Archive and Delete'
          }],
          action: 'D',
          recorded: new Date().toISOString(),
          outcome: '0',
          agent: [{
            who: { reference: 'User/' + context.userId },
            requestor: true
          }],
          source: {
            observer: { display: 'Honeycomb Admin Tools - Archive' }
          },
          entity: entityEntries
        };

        await AuditEvents.insertAsync(auditEvent);
        log.debug('AuditEvent recorded', { auditEventId });
      } else {
        console.warn('[adminTools.archivePatient.execute] AuditEvents collection not available; skipping audit log'); // phi-audit: ok
      }
    } catch (auditError) {
      log.error('Failed to write AuditEvent (non-blocking)', { message: auditError.message });
    }

    log.debug('Archive complete', { bundleResourceCount: bundleEntries.length, totalDeleted });

    return {
      success: true,
      patientId: mongoId,
      patientName: patientName,
      totalDeleted: totalDeleted,
      deletionResults: deletionResults,
      bundleMetadata: bundleMetadata
    };
});
