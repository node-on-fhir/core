// packages/admin-tools/server/deletePatientMethods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import { Random } from 'meteor/random';

const log = (Meteor.Logger ? Meteor.Logger.for('deletePatientMethods') : console);

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
  // Also match urn:uuid: format (used by Synthea and other FHIR bundle sources)
  refs.push('urn:uuid:' + mongoId);
  if (fhirId && fhirId !== mongoId) {
    refs.push('urn:uuid:' + fhirId);
  }

  if (refs.length === 1) {
    return { [refField]: refs[0] };
  }
  return { [refField]: { $in: refs } };
}

// GridFS buckets swept during patient deletion. 'dicom' is core; 'pdfs' and
// 'genomics' are optional extension buckets (see imports/api/importRuns/methods.js
// AUX_GRIDFS_BUCKETS) — every access is try/catch'd so a missing bucket never
// fails the scan. Files are matched by explicit metadata.patientId (mongo _id
// and FHIR id), mirroring buildPatientQuery's dual-id philosophy.
const GRIDFS_BUCKETS = ['dicom', 'pdfs', 'genomics'];

function buildGridfsPatientIds(mongoId, fhirId) {
  const ids = [mongoId];
  if (fhirId && fhirId !== mongoId) {
    ids.push(fhirId);
  }
  return ids;
}

/**
 * Enumerate GridFS files owned by a patient across all buckets.
 * Returns { [bucketName]: { files, chunks, fileIds } } — buckets with zero
 * files are omitted. Chunk counts are real countDocuments (the {files_id, n}
 * index makes this cheap, and it reports actual stored chunks).
 */
async function scanGridfsBuckets(mongoId, fhirId) {
  const gridfs = {};
  const GridFSManager = get(global, 'GridFSManager');
  if (!GridFSManager || !GridFSManager.isInitialized()) {
    log.warn('GridFSManager not initialized; skipping GridFS scan');
    return gridfs;
  }
  const db = GridFSManager.getBucket().s.db;
  const patientIds = buildGridfsPatientIds(mongoId, fhirId);

  for (const bucketName of GRIDFS_BUCKETS) {
    try {
      const fileDocs = await db.collection(bucketName + '.files')
        .find({ 'metadata.patientId': { $in: patientIds } }, { projection: { _id: 1 } })
        .toArray();
      if (fileDocs.length === 0) {
        continue;
      }
      const fileIds = fileDocs.map(function(doc) { return doc._id; });
      const chunks = await db.collection(bucketName + '.chunks')
        .countDocuments({ files_id: { $in: fileIds } });
      gridfs[bucketName] = { files: fileDocs.length, chunks: chunks, fileIds: fileIds };
    } catch (error) {
      log.warn('Could not scan GridFS bucket', { bucket: bucketName, message: error.message });
    }
  }
  return gridfs;
}

// -----------------------------------------------------------------------------
// ServerMethods registry (rpc-migration). Auth guards deleted -> requireAuth
// defaults to true. The settings-gated feature check (feature-disabled on
// settings.public.defaults.allowPatientDeletion) is PRESERVED inside each
// handler body: it must fire regardless of auth. phi:true — patient data flows.

Meteor.ServerMethods.define('adminTools.deletePatient.search', {
  description: 'Search patients by name, MRN, or _id for deletion selection',
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
Meteor.ServerMethods.define('adminTools.deletePatient.dryRun', {
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

    // GridFS files/chunks are reported separately — NOT added to
    // totalLinkedResources, which stays FHIR-resources-only.
    const gridfsScan = await scanGridfsBuckets(mongoId, fhirId);
    const gridfs = {};
    for (const [bucketName, info] of Object.entries(gridfsScan)) {
      gridfs[bucketName] = { files: info.files, chunks: info.chunks };
    }

    return {
      patientId: mongoId,
      fhirId: fhirId,
      patientName: patientName,
      resourceCounts: resourceCounts,
      totalLinkedResources: totalLinkedResources,
      gridfs: gridfs
    };
});

/**
 * Execute cascade deletion of a patient and all linked resources.
 * Writes a FHIR R4 AuditEvent after deletion.
 */
Meteor.ServerMethods.define('adminTools.deletePatient.execute', {
  description: 'Cascade-delete a patient and every linked resource across the compartment',
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

    log.phi('Beginning cascade deletion for patient', { mongoId, patientName }, { action: 'delete' });

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

    // Delete GridFS files/chunks owned by the patient (dicom + aux buckets).
    // Chunks-then-file per file (importRuns deleteGridfsBucket pattern) —
    // idempotent, bucket-generic, exact _id match. Counts reported separately;
    // totalDeleted stays FHIR-resources-only.
    const gridfsScan = await scanGridfsBuckets(mongoId, fhirId);
    const gridfsResults = {};
    if (Object.keys(gridfsScan).length > 0) {
      const db = get(global, 'GridFSManager').getBucket().s.db;
      for (const [bucketName, info] of Object.entries(gridfsScan)) {
        let filesDeleted = 0;
        let chunksDeleted = 0;
        const errors = [];
        for (const fileId of info.fileIds) {
          try {
            const chunkResult = await db.collection(bucketName + '.chunks').deleteMany({ files_id: fileId });
            await db.collection(bucketName + '.files').deleteOne({ _id: fileId });
            filesDeleted++;
            chunksDeleted += get(chunkResult, 'deletedCount', 0);
          } catch (error) {
            errors.push(String(fileId) + ': ' + error.message);
          }
        }
        gridfsResults[bucketName] = { files: filesDeleted, chunks: chunksDeleted };
        if (errors.length > 0) {
          gridfsResults[bucketName].errors = errors;
        }
        log.debug('Deleted GridFS bucket files for patient', { bucket: bucketName, files: filesDeleted, chunks: chunksDeleted });
      }
    }

    // Delete the Patient record last
    try {
      await Patients.removeAsync({ _id: mongoId });
      totalDeleted += 1;
      log.debug('Deleted Patient record', { mongoId });
    } catch (error) {
      log.error('Error deleting patient record', { message: error.message });
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

        for (const [bucketName, info] of Object.entries(gridfsResults)) {
          entityEntries.push({
            what: { display: 'GridFS ' + bucketName },
            detail: [
              { type: 'files', valueString: String(get(info, 'files', 0)) },
              { type: 'chunks', valueString: String(get(info, 'chunks', 0)) }
            ]
          });
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
            who: { reference: 'User/' + context.userId },
            requestor: true
          }],
          source: {
            observer: { display: 'Honeycomb Admin Tools' }
          },
          entity: entityEntries
        };

        await AuditEvents.insertAsync(auditEvent);
        log.debug('AuditEvent recorded', { auditEventId });
      } else {
        console.warn('[adminTools.deletePatient.execute] AuditEvents collection not available; skipping audit log'); // phi-audit: ok
      }
    } catch (auditError) {
      log.error('Failed to write AuditEvent (non-blocking)', { message: auditError.message });
    }

    log.debug('Cascade deletion complete', { totalDeleted });

    return {
      success: true,
      patientId: mongoId,
      patientName: patientName,
      totalDeleted: totalDeleted,
      deletionResults: deletionResults,
      gridfsResults: gridfsResults
    };
});
