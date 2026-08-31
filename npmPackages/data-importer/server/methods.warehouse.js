// packages/data-importer/server/methods.warehouse.js
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { get, set } from 'lodash';
import { HTTP } from '../lib/httpClient';
import { resolveBundleReferences } from '../lib/BundleReferenceResolver.js';

const MongoInternals = Package['mongo'].MongoInternals;

// Import-run provenance (host service, registered by importRunTagsSetup.js).
// Null-safe: in test contexts without the host app, stamping is a no-op.
function stampImportRunTags(resource, options) {
  const ImportRunTags = Meteor.ImportRunTags;
  const importRunId = get(options, 'importRunId');
  if (!ImportRunTags || !importRunId) return resource;
  return ImportRunTags.applyImportRunTags(resource, {
    importRunId: importRunId,
    importType: get(options, 'importType')
  });
}

// Update the ImportRuns registry record with this call's results — counts
// accumulate across chunked warehouse calls sharing one run id.
async function recordImportRunResults(options, results) {
  const importRunId = get(options, 'importRunId');
  const ImportRuns = get(global, 'Collections.ImportRuns');
  if (!importRunId || !ImportRuns) return;
  try {
    const inc = {};
    Object.keys(results.resourceTypes || {}).forEach(function(resourceType) {
      inc['resourceCounts.' + resourceType] = results.resourceTypes[resourceType];
    });
    const modifier = {
      $set: { completedAt: new Date(), status: 'completed' },
      // Server-minted run ids (bare callers that skipped importRuns.start)
      // still get a registry record.
      $setOnInsert: {
        importType: get(options, 'importType', 'unknown'),
        origin: 'warehouse:direct',
        createdAt: new Date()
      }
    };
    if (Object.keys(inc).length > 0) modifier.$inc = inc;

    // Attachment provenance (design v2 §B): record which patient the import
    // attached to and every Patient this run created (relaxed creation path),
    // so the run stays flushable. attachmentSource is $set when supplied;
    // createdPatientIds accumulate via $addToSet across chunked warehouse calls.
    const attachmentSource = get(options, 'attachmentSource');
    if (attachmentSource) {
      modifier.$set.attachmentSource = attachmentSource;
    }
    const createdPatientIds = get(results, 'createdPatientIds', []);
    if (Array.isArray(createdPatientIds) && createdPatientIds.length > 0) {
      modifier.$addToSet = { createdPatientIds: { $each: createdPatientIds } };
    }

    await ImportRuns.upsertAsync({ _id: importRunId, status: { $ne: 'flushed' } }, modifier);
  } catch (error) {
    console.warn('[insertBundleIntoWarehouse] Could not record import-run results (non-fatal):', error.message);
  }
}

// A resource type is in versioned mode when the server settings say so. This is the
// same authoritative setting FhirEndpoints.js reads for the REST API, so warehouse
// imports preserve history identically to PUT/POST when versioning is enabled.
function isResourceVersioned(resourceType) {
  return get(Meteor, 'settings.private.fhir.rest.' + resourceType + '.versioning') === 'versioned';
}

// Deterministic JSON (sorted keys) for content comparison.
function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  return '{' + Object.keys(value).sort().map(function(k) {
    return JSON.stringify(k) + ':' + stableStringify(value[k]);
  }).join(',') + '}';
}

// Import-run provenance tag systems — bookkeeping, not clinical content.
// Mirrors imports/lib/importRunTags.js (host lib; literals here keep this
// package self-contained for bare node --test).
const IMPORT_PROVENANCE_TAG_SYSTEMS = ['urn:honeycomb:import-run', 'urn:honeycomb:import-type'];

// Compare two resources ignoring bookkeeping fields (so an identical re-import of an
// already-stored version doesn't spawn a redundant version). Import-run tags are
// bookkeeping too: re-importing identical content under a NEW run id stays a no-op —
// the stored resource keeps its original run tag, so flushing the new run correctly
// leaves pre-existing data alone.
function isSameContent(a, b) {
  function strip(resource) {
    const clone = JSON.parse(JSON.stringify(resource || {}));
    delete clone._id;
    if (clone.meta) {
      delete clone.meta.lastUpdated;
      delete clone.meta.versionId;
      if (Array.isArray(clone.meta.tag)) {
        clone.meta.tag = clone.meta.tag.filter(function(tag) {
          return !tag || IMPORT_PROVENANCE_TAG_SYSTEMS.indexOf(tag.system) === -1;
        });
        if (clone.meta.tag.length === 0) delete clone.meta.tag;
      }
      if (Object.keys(clone.meta).length === 0) delete clone.meta;
    }
    return clone;
  }
  return stableStringify(strip(a)) === stableStringify(strip(b));
}

/**
 * Link GridFS files to an ImagingStudy by setting metadata.imagingStudyId
 * on matching dicom.files entries.
 *
 * Scans the ImagingStudy's series[].instance[].extension[] for gridfsFileId
 * values and updates the corresponding dicom.files documents.
 *
 * @param {object} imagingStudy - The ImagingStudy FHIR resource
 */
async function linkGridFSFilesToImagingStudy(imagingStudy) {
  try {
    const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
    const dicomFiles = db.collection('dicom.files');
    const { ObjectId } = Package['mongo'].MongoInternals.NpmModules.mongodb.module;

    const series = get(imagingStudy, 'series', []);
    let linkedCount = 0;

    for (const s of series) {
      const instances = get(s, 'instance', []);
      for (const inst of instances) {
        const extensions = get(inst, 'extension', []);
        for (const ext of extensions) {
          if (ext.url === 'gridfsFileId' && ext.valueString) {
            let fileId = ext.valueString;
            try {
              fileId = new ObjectId(ext.valueString);
            } catch (e) {
              // keep as string if not a valid ObjectId hex
            }

            const result = await dicomFiles.updateOne(
              { $or: [{ _id: fileId }, { _id: ext.valueString }] },
              { $set: { 'metadata.imagingStudyId': imagingStudy._id } }
            );

            if (result.modifiedCount > 0) {
              linkedCount++;
            }
          }
        }
      }
    }

    if (linkedCount > 0) {
      console.log(`[linkGridFSFilesToImagingStudy] Linked ${linkedCount} GridFS files to ImagingStudy/${imagingStudy._id}`);
    }
  } catch (error) {
    console.error('[linkGridFSFilesToImagingStudy] Error (non-fatal):', error.message);
  }
}

function pluralizeResourceName(resourceType) {
  switch (resourceType) {
    case 'Binary': return 'Binaries';
    case 'Library': return 'Libraries';
    case 'SupplyDelivery': return 'SupplyDeliveries';
    case 'ImagingStudy': return 'ImagingStudies';
    case 'FamilyMemberHistory': return 'FamilyMemberHistories';
    case 'ResearchStudy': return 'ResearchStudies';
    default: return resourceType + 's';
  }
}

// Record a newly-created Patient's FHIR id on results.createdPatientIds (design
// v2 §B): the relaxed-creation path lets any importer mint Patients, so we track
// which ones a run created to keep the run flushable via importRuns. Deduped;
// prefers the FHIR id (what meta.tag flush + link offers reference).
function noteCreatedPatient(results, resource) {
  if (!resource || resource.resourceType !== 'Patient') return;
  if (!Array.isArray(results.createdPatientIds)) results.createdPatientIds = [];
  const patientId = resource.id || resource._id;
  if (patientId && results.createdPatientIds.indexOf(patientId) === -1) {
    results.createdPatientIds.push(patientId);
  }
}

async function insertToLocalDb(bundle, results, options) {
  const Collections = global.Collections;
  const honorVersioning = get(options, 'honorVersioning', true) !== false;

  for (const entry of bundle.entry) {
    const resource = get(entry, 'resource');
    if (!resource || !resource.resourceType) continue;

    // GridFS entries map to the raw dicom.files collection, not a FHIR collection
    if (resource.resourceType === 'GridFS') {
      try {
        const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
        const dicomFiles = db.collection('dicom.files');

        // GridFS stores _id as ObjectId, but the bundle has it as a string.
        // Check both types to avoid creating a duplicate record.
        const { ObjectId } = Package['mongo'].MongoInternals.NpmModules.mongodb.module;
        let lookupId = resource._id;
        try {
          lookupId = new ObjectId(resource._id);
        } catch (e) {
          // keep as string if not a valid ObjectId hex
        }
        const existing = await dicomFiles.findOne({
          $or: [{ _id: lookupId }, { _id: resource._id }]
        });
        if (existing) {
          results.updated++;
          console.log(`[insertBundleIntoWarehouse] GridFS already in dicom.files: ${resource.filename}`);
        } else {
          const gridfsMetadata = { url: resource.url };
          if (get(options, 'importRunId')) {
            gridfsMetadata.importRunId = get(options, 'importRunId');
          }
          await dicomFiles.insertOne({
            _id: resource._id,
            filename: resource.filename,
            contentType: resource.contentType,
            length: resource.size,
            uploadDate: new Date(resource.uploadDate),
            metadata: gridfsMetadata
          });
          results.inserted++;
          console.log(`[insertBundleIntoWarehouse] Inserted GridFS to dicom.files: ${resource.filename}`);
        }
        results.resourceTypes['GridFS'] = (results.resourceTypes['GridFS'] || 0) + 1;
      } catch (error) {
        const errorMsg = `GridFS/${resource.filename}: ${error.message}`;
        results.errors.push(errorMsg);
        console.error('[insertBundleIntoWarehouse] GridFS error:', errorMsg);
      }
      continue;
    }

    const collectionName = pluralizeResourceName(resource.resourceType);
    const collection = Collections[collectionName];

    if (!collection) {
      results.errors.push(`Collection not found: ${collectionName}`);
      continue;
    }

    try {
      // Normalize legacy serialized ids — {_str: ...} from old Mongo.ObjectID
      // exports, {$oid: ...} extended JSON. Mongo requires string _ids here.
      if (resource._id && typeof resource._id !== 'string') {
        resource._id = get(resource, '_id._str', get(resource, '_id.$oid', Random.id()));
      }
      if (resource.id && typeof resource.id !== 'string') {
        resource.id = get(resource, 'id._str', get(resource, 'id.$oid', resource._id || Random.id()));
      }

      // Ensure _id is set
      if (!resource._id && resource.id) {
        resource._id = resource.id;
      }

      // Import-run provenance: stamp run + content-type tags (idempotent).
      // isSameContent ignores these systems, so identical re-imports under a
      // new run id remain no-ops for versioned types.
      stampImportRunTags(resource, options);

      const versioned = honorVersioning && isResourceVersioned(resource.resourceType) && resource.id;

      if (versioned) {
        // Versioned mode: keep history. Each distinct content gets its own MongoDB
        // document sharing the FHIR id, with a monotonically incremented versionId —
        // mirroring server/FhirEndpoints.js. Identical re-imports are no-ops.
        const existingVersions = await collection.find({ id: resource.id }).fetchAsync();

        if (existingVersions.length > 0) {
          const latest = existingVersions
            .slice()
            .sort(function(a, b) {
              return (parseInt(get(b, 'meta.versionId', '1'), 10) || 1) - (parseInt(get(a, 'meta.versionId', '1'), 10) || 1);
            })[0];

          if (isSameContent(latest, resource)) {
            results.updated++;
            console.log(`[insertBundleIntoWarehouse] No change for ${resource.resourceType}/${resource.id} (v${get(latest, 'meta.versionId', '1')})`);
          } else {
            const maxVersion = existingVersions.reduce(function(max, r) {
              return Math.max(max, parseInt(get(r, 'meta.versionId', '1'), 10) || 1);
            }, 0);
            resource._id = Random.id();
            set(resource, 'meta.versionId', String(maxVersion + 1));
            await collection.insertAsync(resource);
            noteCreatedPatient(results, resource);
            results.inserted++;
            console.log(`[insertBundleIntoWarehouse] Inserted version ${maxVersion + 1} of ${resource.resourceType}/${resource.id}`);
          }
        } else {
          if (!get(resource, 'meta.versionId')) set(resource, 'meta.versionId', '1');
          await collection.insertAsync(resource);
          noteCreatedPatient(results, resource);
          results.inserted++;
          console.log(`[insertBundleIntoWarehouse] Inserted ${resource.resourceType}/${resource.id} (v1)`);
        }
      } else {
        // No-version mode: upsert in place by _id (last write wins).
        const existing = await collection.findOneAsync({ _id: resource._id });

        if (existing) {
          await collection.updateAsync({ _id: resource._id }, { $set: resource });
          results.updated++;
          console.log(`[insertBundleIntoWarehouse] Updated ${resource.resourceType}/${resource._id}`);
        } else {
          await collection.insertAsync(resource);
          noteCreatedPatient(results, resource);
          results.inserted++;
          console.log(`[insertBundleIntoWarehouse] Inserted ${resource.resourceType}/${resource._id}`);
        }
      }

      // Track counts by resource type
      results.resourceTypes[resource.resourceType] =
        (results.resourceTypes[resource.resourceType] || 0) + 1;

      // Link GridFS files to the ImagingStudy
      if (resource.resourceType === 'ImagingStudy') {
        await linkGridFSFilesToImagingStudy(resource);
      }

    } catch (error) {
      const errorMsg = `${resource.resourceType}/${resource._id}: ${error.message}`;
      results.errors.push(errorMsg);
      console.error('[insertBundleIntoWarehouse] Error:', errorMsg);
    }
  }

  console.log('[insertBundleIntoWarehouse] Complete:', results);
  return results;
}

async function insertViaRelay(bundle, options, results) {
  const relayEndpoint = options.relayEndpoint ||
    get(Meteor, 'settings.public.interfaces.fhirRelay.channel.endpoint');

  if (!relayEndpoint) {
    throw new Meteor.Error('no-endpoint', 'No fhirRelay endpoint configured in settings');
  }

  console.log('[insertBundleIntoWarehouse] Relay endpoint:', relayEndpoint);

  for (const entry of bundle.entry) {
    const resource = get(entry, 'resource');
    if (!resource || !resource.resourceType) continue;

    // GridFS entries aren't a FHIR resource type — skip relay, already in dicom.files
    if (resource.resourceType === 'GridFS') {
      results.resourceTypes['GridFS'] = (results.resourceTypes['GridFS'] || 0) + 1;
      continue;
    }

    try {
      let url = relayEndpoint.replace(/\/$/, ''); // Remove trailing slash

      if (resource.id) {
        // PUT to update/create with specific ID
        url = `${url}/${resource.resourceType}/${resource.id}`;
        HTTP.put(url, { data: resource });
        results.updated++;
      } else {
        // POST to create new
        url = `${url}/${resource.resourceType}`;
        HTTP.post(url, { data: resource });
        results.inserted++;
      }

      results.resourceTypes[resource.resourceType] =
        (results.resourceTypes[resource.resourceType] || 0) + 1;

    } catch (error) {
      const errorMsg = `${resource.resourceType}: ${error.message}`;
      results.errors.push(errorMsg);
      console.error('[insertBundleIntoWarehouse] Relay error:', errorMsg);
    }
  }

  console.log('[insertBundleIntoWarehouse] Relay complete:', results);
  return results;
}

// ServerMethods registry (rpc migration). This method had NO auth guard
// historically; requireAuth now applies (default true) — it bulk-writes FHIR
// resources to the warehouse (or relays them to an external server) and is only
// invoked from the signed-in /import-data page. Renamed to the canonical dotted
// 'dataImporter.insertBundleIntoWarehouse' with the bare legacy name as an
// alias. positionalParams preserve the (bundleData, options) legacy order.
// phi:true — inserts patient clinical bundles. Uses the global
// Meteor.ServerMethods per the npmPackages exemplar.
Meteor.ServerMethods.define('dataImporter.insertBundleIntoWarehouse', {
  description: 'Insert a FHIR Bundle into the local warehouse or relay it to an external FHIR server',
  aliases: ['insertBundleIntoWarehouse'],
  phi: true,
  positionalParams: ['bundleData', 'options'],
  schemaObject: {
    type: 'object',
    properties: {
      bundleData: { type: ['object', 'string'] },
      options: {
        type: 'object',
        properties: {
          mode: { type: 'string' },
          relayEndpoint: { type: 'string' },
          honorVersioning: { type: 'boolean' },
          importRunId: { type: 'string' },
          importType: { type: 'string' },
          // Attachment provenance (design v2 §B): recorded onto the ImportRuns
          // registry so a run remembers which patient it attached to.
          attachmentSource: { type: 'string' }
        }
      }
    },
    required: ['bundleData']
  }
}, async function(params, context){
    const bundleData = get(params, 'bundleData');
    // Handle undefined options
    let options = get(params, 'options') || {};

    // Parse if string
    let bundle;
    try {
      bundle = typeof bundleData === 'string' ? JSON.parse(bundleData) : bundleData;
    } catch (parseError) {
      throw new Meteor.Error('parse-error', 'Failed to parse bundle: ' + parseError.message);
    }

    // Determine mode from options or settings
    const mode = options.mode || get(Meteor, 'settings.public.dataImporter.warehouseMode', 'local');

    console.log('[insertBundleIntoWarehouse] Mode:', mode);
    console.log('[insertBundleIntoWarehouse] Bundle resourceType:', bundle.resourceType);
    console.log('[insertBundleIntoWarehouse] Bundle entries:', bundle.entry?.length || 0);

    const results = {
      mode: mode,
      inserted: 0,
      updated: 0,
      errors: [],
      resourceTypes: {},
      // Patient resources this call created (relaxed-creation provenance,
      // design v2 §B); folded into ImportRuns.createdPatientIds via $addToSet.
      createdPatientIds: []
    };

    if (bundle.resourceType !== 'Bundle' || !Array.isArray(bundle.entry)) {
      throw new Meteor.Error('invalid-bundle', 'Expected FHIR Bundle with entry array');
    }

    // Safety net for raw self-contained (document) bundles that reach the
    // server with entry.fullUrl intact: rewrite intra-bundle urn:uuid/fullUrl
    // references to relative ResourceType/id form. No-op for bundles
    // synthesized from flat resource arrays (no fullUrls).
    const resolvedRefs = resolveBundleReferences(bundle);
    if (resolvedRefs.resolvedCount > 0) {
      console.log('[insertBundleIntoWarehouse] Resolved ' + resolvedRefs.resolvedCount + ' intra-bundle references via the fullUrl index');
    }

    // Import-run provenance: mint a run id server-side if the caller didn't
    // supply one, so bare/legacy callers still get flushable imports. The
    // client-supplied id (one per drop gesture) takes precedence.
    if (!options.importRunId) {
      options.importRunId = Random.id();
      console.log('[insertBundleIntoWarehouse] Minted import run id:', options.importRunId);
    }
    results.importRunId = options.importRunId;

    if (mode === 'relay') {
      // Proxy to external FHIR server. Resources are stamped so provenance
      // travels, but flush cannot reach a remote server.
      for (const entry of bundle.entry) {
        stampImportRunTags(get(entry, 'resource'), options);
      }
      const relayResults = await insertViaRelay(bundle, options, results);
      await recordImportRunResults(options, relayResults);
      return relayResults;
    } else {
      // Insert directly to local MongoDB
      const localResults = await insertToLocalDb(bundle, results, options);
      await recordImportRunResults(options, localResults);
      return localResults;
    }
});
