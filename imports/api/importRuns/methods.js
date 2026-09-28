// imports/api/importRuns/methods.js
//
// Import-run provenance registry methods (personalized ETL, Phase 1).
// Pairs with imports/lib/importRunTags.js: importers stamp every created
// resource with a run tag; these methods let the operator inspect a run
// (census), and — gated by settings.private.allowImportRunFlush — bulk-delete
// everything a run created (resources by meta.tag, GridFS payload files by
// metadata.importRunId). Modeled on orbital.colonySimData.census/clearMission.

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';

import { ImportRuns } from '/imports/lib/schemas/SimpleSchemas/ImportRuns';
import ImportRunTags from '/imports/lib/importRunTags.js';

const { importRunTagQuery } = ImportRunTags;

const MongoInternals = Package['mongo'].MongoInternals;

// Collections that never hold import-stamped FHIR resources — skip during
// census/flush (ImportRuns itself carries no meta.tag; skipping is belt and
// suspenders plus a shorter census loop).
const NON_FLUSHABLE_COLLECTIONS = ['ImportRuns'];

function isFlushAllowed() {
  return get(Meteor, 'settings.private.allowImportRunFlush', false) === true;
}

// Auxiliary GridFS buckets (beyond dicom.files) that import pipelines stamp
// with metadata.importRunId. The pdf-parser extension stores original PDFs in
// the 'pdfs' bucket and genome-central stores raw genotype files in
// 'genomics'; both are optional (gitignored extensions) so every access is
// probed with try/catch and never fails the whole census/flush.
const AUX_GRIDFS_BUCKETS = ['pdfs', 'genomics'];

// Count GridFS files linked to a run in a single bucket. Returns 0 (and logs)
// if the bucket's files collection doesn't exist on this deployment.
async function countGridfsBucket(bucketName, importRunId, context) {
  try {
    const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
    return await db.collection(bucketName + '.files')
      .countDocuments({ 'metadata.importRunId': importRunId });
  } catch (error) {
    context.log.warn('Census could not count GridFS bucket', { bucket: bucketName, error: error.message });
    return 0;
  }
}

// Delete GridFS files (and their chunks) linked to a run in a single bucket by
// removing directly from <bucket>.files + <bucket>.chunks. Used for auxiliary
// buckets whose owning package (pdf-parser) may not be loaded, so no package
// GridFS manager is available to call. Returns { removed, errors }.
async function deleteGridfsBucket(bucketName, importRunId, context) {
  const result = { removed: 0, errors: [] };
  try {
    const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
    const filesColl = db.collection(bucketName + '.files');
    const chunksColl = db.collection(bucketName + '.chunks');

    const files = await filesColl
      .find({ 'metadata.importRunId': importRunId }, { projection: { _id: 1 } })
      .toArray();

    for (const file of files) {
      try {
        await chunksColl.deleteMany({ files_id: file._id });
        await filesColl.deleteOne({ _id: file._id });
        result.removed++;
      } catch (fileError) {
        result.errors.push(bucketName + ':' + String(file._id) + ' (' + fileError.message + ')');
      }
    }
  } catch (error) {
    context.log.warn('Flush could not process GridFS bucket', { bucket: bucketName, error: error.message });
    result.errors.push(bucketName + ' (' + error.message + ')');
  }
  return result;
}

async function countByRunTag(importRunId) {
  const Collections = global.Collections || {};
  const selector = importRunTagQuery(importRunId);
  const counts = {};
  let total = 0;
  for (const name of Object.keys(Collections)) {
    if (NON_FLUSHABLE_COLLECTIONS.includes(name)) continue;
    const collection = Collections[name];
    if (!collection || typeof collection.find !== 'function') continue;
    const count = await collection.find(selector).countAsync();
    if (count > 0) {
      counts[name] = count;
      total += count;
    }
  }
  return { counts, total };
}

Meteor.ServerMethods.define('importRuns.start', {
  description: 'Create an import-run registry record; returns the run id used for provenance stamping',
  phi: false,
  positionalParams: ['runData'],
  schemaObject: {
    type: 'object',
    properties: {
      runData: {
        type: 'object',
        properties: {
          importRunId: { type: 'string' },
          importType: { type: 'string' },
          origin: { type: 'string' },
          filenames: { type: 'array' },
          patientId: { type: ['string', 'null'] },
          // Attachment provenance (design v2 §B): which patient the import
          // attached to and why, plus the ids of any Patients it created.
          attachmentSource: { type: 'string' },
          createdPatientIds: { type: 'array' }
        }
      }
    }
  }
}, async function(params, context){
  const runData = get(params, 'runData') || {};
  const importRunId = get(runData, 'importRunId') || Random.id();

  const doc = {
    _id: importRunId,
    status: 'active',
    importType: get(runData, 'importType', 'unknown'),
    origin: get(runData, 'origin', 'unknown'),
    filenames: get(runData, 'filenames', []),
    userId: context.userId || null,
    patientId: get(runData, 'patientId', null),
    resourceCounts: {},
    gridfsFileIds: [],
    createdAt: new Date()
  };

  // Attachment provenance (design v2 §B): only set when supplied so a retried
  // start doesn't clobber a source the warehouse already recorded.
  const attachmentSource = get(runData, 'attachmentSource');
  if (attachmentSource) {
    doc.attachmentSource = attachmentSource;
  }
  const createdPatientIds = get(runData, 'createdPatientIds');
  if (Array.isArray(createdPatientIds) && createdPatientIds.length > 0) {
    doc.createdPatientIds = createdPatientIds;
  }

  context.log.info('Starting import run', { importRunId: importRunId, importType: doc.importType, origin: doc.origin });

  // Upsert: a retried start for the same run id refreshes rather than throws
  await ImportRuns.upsertAsync({ _id: importRunId }, { $set: doc });
  return { importRunId: importRunId };
});

Meteor.ServerMethods.define('importRuns.complete', {
  description: 'Mark an import run completed (or failed)',
  phi: false,
  positionalParams: ['importRunId', 'outcome'],
  schemaObject: {
    type: 'object',
    properties: {
      importRunId: { type: 'string' },
      outcome: { type: 'string' }
    },
    required: ['importRunId']
  }
}, async function(params, context){
  const importRunId = params.importRunId;
  const status = params.outcome === 'failed' ? 'failed' : 'completed';

  const updated = await ImportRuns.updateAsync(
    { _id: importRunId, status: { $ne: 'flushed' } },
    { $set: { status: status, completedAt: new Date() } }
  );
  if (updated === 0) {
    context.log.warn('importRuns.complete matched no active run', { importRunId: importRunId });
  } else {
    context.log.info('Import run completed', { importRunId: importRunId, status: status });
  }
  return { importRunId: importRunId, status: status };
});

Meteor.ServerMethods.define('importRuns.list', {
  description: 'List recent import runs (newest first)',
  phi: false,
  positionalParams: ['options'],
  schemaObject: {
    type: 'object',
    properties: {
      options: {
        type: 'object',
        properties: { limit: { type: 'number' } }
      }
    }
  }
}, async function(params, context){
  const limit = Math.min(get(params, 'options.limit', 50), 200);
  const runs = await ImportRuns.find({}, { sort: { createdAt: -1 }, limit: limit }).fetchAsync();
  return { runs: runs };
});

Meteor.ServerMethods.define('importRuns.census', {
  description: 'Count resources stamped with an import-run tag, per collection (read-only)',
  phi: false,
  positionalParams: ['importRunId'],
  schemaObject: {
    type: 'object',
    properties: { importRunId: { type: 'string' } },
    required: ['importRunId']
  }
}, async function(params, context){
  const importRunId = params.importRunId;
  const { counts, total } = await countByRunTag(importRunId);

  // GridFS payload files linked to this run — the primary dicom.files bucket
  // plus any auxiliary buckets (pdfs, …). gridfsCount stays the aggregate
  // total; gridfsByBucket breaks it down for observability.
  const gridfsByBucket = {};
  gridfsByBucket['dicom'] = await countGridfsBucket('dicom', importRunId, context);
  for (const bucket of AUX_GRIDFS_BUCKETS) {
    gridfsByBucket[bucket] = await countGridfsBucket(bucket, importRunId, context);
  }
  const gridfsCount = Object.keys(gridfsByBucket).reduce(function(sum, bucket) {
    return sum + gridfsByBucket[bucket];
  }, 0);

  context.log.info('Import run census', { importRunId: importRunId, total: total, gridfsCount: gridfsCount, gridfsByBucket: gridfsByBucket });
  return { importRunId: importRunId, counts: counts, total: total, gridfsCount: gridfsCount, gridfsByBucket: gridfsByBucket };
});

Meteor.ServerMethods.define('importRuns.checkFlushSetting', {
  description: 'Report whether import-run flushing is enabled on this server',
  phi: false,
  schemaObject: { type: 'object' }
}, async function(params, context){
  return { allowImportRunFlush: isFlushAllowed() };
});

Meteor.ServerMethods.define('importRuns.flush', {
  description: 'Delete every resource and GridFS file created by an import run (settings-gated)',
  phi: true,
  positionalParams: ['importRunId'],
  schemaObject: {
    type: 'object',
    properties: { importRunId: { type: 'string' } },
    required: ['importRunId']
  }
}, async function(params, context){
  const importRunId = params.importRunId;

  if (!isFlushAllowed()) {
    throw new Meteor.Error('feature-disabled',
      'Import-run flushing is disabled. Set Meteor.settings.private.allowImportRunFlush to true.');
  }

  const Collections = global.Collections || {};
  const selector = importRunTagQuery(importRunId);
  const removed = {};
  let total = 0;

  // STALE PROFILE-LINK recurrence killer: before deleting Patients created by
  // this run, collect the _id AND FHIR id of every one, so that AFTER deletion
  // we can unset any user.patientId still pointing at them. Otherwise flushing a
  // run that created a Patient leaves accounts profile-linked to a deleted
  // record — the exact stale-link the resolver now guards against, reintroduced.
  const deletedPatientIds = [];
  // Account-linked Patients are SACRED: a run may have merely enhanced (and
  // tagged) a patient that existed before it. Deleting such a patient destroys
  // the account's entire profile (2026-09-05 facebook-run flush incident), so
  // linked patients are spared — the run tag is stripped instead — and only
  // run-tagged patients no account points at are deleted.
  const sparedPatientMongoIds = [];
  const PatientsCollection = Collections.Patients || null;
  if (PatientsCollection && typeof PatientsCollection.find === 'function') {
    try {
      const doomedPatients = await PatientsCollection
        .find(selector, { fields: { _id: 1, id: 1 } })
        .fetchAsync();
      for (const p of doomedPatients) {
        if (!p) continue;
        const aliases = [];
        if (p._id !== undefined && p._id !== null && p._id !== '') aliases.push(String(p._id));
        if (p.id !== undefined && p.id !== null && p.id !== '' && String(p.id) !== String(p._id)) aliases.push(String(p.id));

        const linkedUser = aliases.length > 0
          ? await Meteor.users.findOneAsync({ patientId: { $in: aliases } }, { fields: { _id: 1 } })
          : null;
        if (linkedUser) {
          sparedPatientMongoIds.push(p._id);
          context.log.warn('Flush sparing account-linked Patient (stripping run tag instead of deleting)', {
            importRunId: importRunId, patientId: String(p._id), linkedUserId: linkedUser._id
          });
        } else {
          deletedPatientIds.push(...aliases);
        }
      }
    } catch (error) {
      context.log.warn('Flush could not pre-collect deleted Patient ids', { importRunId: importRunId, error: error.message });
    }
  }

  // Strip the run tag from spared patients so the run's audit trail closes
  // without destroying the record.
  if (PatientsCollection && sparedPatientMongoIds.length > 0) {
    try {
      await PatientsCollection.updateAsync(
        { _id: { $in: sparedPatientMongoIds } },
        { $pull: { 'meta.tag': { code: importRunId } } },
        { multi: true }
      );
    } catch (error) {
      context.log.warn('Flush could not strip run tag from spared Patients', { importRunId: importRunId, error: error.message });
    }
  }

  for (const name of Object.keys(Collections)) {
    if (NON_FLUSHABLE_COLLECTIONS.includes(name)) continue;
    const collection = Collections[name];
    if (!collection || typeof collection.removeAsync !== 'function') continue;
    const collectionSelector = (name === 'Patients' && sparedPatientMongoIds.length > 0)
      ? { ...selector, _id: { $nin: sparedPatientMongoIds } }
      : selector;
    const count = await collection.removeAsync(collectionSelector);
    if (count > 0) {
      removed[name] = count;
      total += count;
    }
  }

  // Unlink any accounts whose profile still points at a Patient we just deleted
  // (multi: unset user.patientId across all matches). Null-safe — no-op when the
  // run created no Patients or the collection was absent.
  let unlinkedUsers = 0;
  if (deletedPatientIds.length > 0) {
    try {
      unlinkedUsers = await Meteor.users.updateAsync(
        { patientId: { $in: deletedPatientIds } },
        { $unset: { patientId: '' } },
        { multi: true }
      );
    } catch (error) {
      context.log.warn('Flush could not unlink users from deleted Patients', { importRunId: importRunId, error: error.message });
    }
    context.log.info('Flush unlinked users from deleted Patients', { importRunId: importRunId, unlinkedUsers: unlinkedUsers });
  }

  // GridFS payload files (deleteFile removes both the files doc and chunks)
  let gridfsRemoved = 0;
  const gridfsErrors = [];
  try {
    const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
    const files = await db.collection('dicom.files')
      .find({ 'metadata.importRunId': importRunId }, { projection: { _id: 1 } })
      .toArray();

    const GridFSManager = global.GridFSManager;
    for (const file of files) {
      if (GridFSManager && GridFSManager.isInitialized()) {
        const deleted = await GridFSManager.deleteFile(String(file._id));
        if (deleted) {
          gridfsRemoved++;
        } else {
          gridfsErrors.push(String(file._id));
        }
      } else {
        gridfsErrors.push(String(file._id) + ' (GridFS not initialized)');
      }
    }
  } catch (error) {
    context.log.error('Flush could not process GridFS files', { importRunId: importRunId, error: error.message });
    gridfsErrors.push(error.message);
  }

  // Auxiliary GridFS buckets (pdfs, …). Owning packages may not be loaded, so
  // delete files + chunks directly. Fold results into the same aggregate.
  for (const bucket of AUX_GRIDFS_BUCKETS) {
    const auxResult = await deleteGridfsBucket(bucket, importRunId, context);
    gridfsRemoved += auxResult.removed;
    auxResult.errors.forEach(function(err) { gridfsErrors.push(err); });
  }

  const flushResult = {
    removed: removed,
    total: total,
    gridfsRemoved: gridfsRemoved,
    gridfsErrors: gridfsErrors,
    unlinkedUsers: unlinkedUsers,
    flushedBy: context.userId || null
  };

  await ImportRuns.updateAsync(
    { _id: importRunId },
    { $set: { status: 'flushed', flushedAt: new Date(), flushResult: flushResult } }
  );

  context.log.info('Import run flushed', { importRunId: importRunId, total: total, gridfsRemoved: gridfsRemoved, unlinkedUsers: unlinkedUsers });
  return Object.assign({ importRunId: importRunId }, flushResult);
});
