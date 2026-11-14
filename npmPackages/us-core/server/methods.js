// npmPackages/us-core/server/methods.js
//
// US Core server methods — moved home from provider-directory 2026-11-07.
//
//   usCore.initialize  (+ legacy initUsCore alias)
//     Idempotent conformance seed: upserts the vendored US Core 7.0.0
//     ValueSets. Rides the Import Runs infrastructure — newly CREATED
//     resources are meta.tagged to a fresh import run (urn:honeycomb:
//     import-run) and the run is recorded in the ImportRuns registry, so
//     the Runs tab / census / gated flush all see it. Refreshed-in-place
//     resources are never re-tagged (flush-safety contract), and a fully
//     idempotent re-run (0 created) records no run at all.
//
//   usCore.status
//     Read-only census for the server-config panel: how many of the
//     vendored ValueSets are present, plus the most recent init run.
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import { ValueSets } from '/imports/lib/schemas/SimpleSchemas/ValueSets';
import { UsCoreMethods, US_CORE_VALUESET_IDS } from '../lib/UsCoreMethods.js';

const log = (Meteor.Logger ? Meteor.Logger.for('us-core') : console);

const IMPORT_RUN_ORIGIN = 'us-core:init';
// IMPORT_TYPES.FHIR_BUNDLE from imports/lib/importRunTags.js — literal here
// so the package stays loadable without the host lib (same convention as
// data-importer's methods.warehouse.js).
const IMPORT_TYPE_CODE = 'fhir-bundle';

// Only claim the legacy alias if nothing else (core or another package)
// already owns it — a canonical duplicate is a fatal boot error, and the
// legacy names predate the namespaced ones.
function aliasIfFree(legacyName) {
  const handlers = (Meteor.server && Meteor.server.method_handlers) || {};
  if (handlers[legacyName]) {
    log.info('legacy method name already defined elsewhere, no alias', { legacyName });
    return [];
  }
  return [legacyName];
}

function importRunsCollection() {
  // Host registry collection, feature-detected (host globals are not
  // guaranteed at package load under npm-workflow load order).
  return get(global, 'Collections.ImportRuns', null);
}

Meteor.ServerMethods.define('usCore.initialize', {
  description: 'Seed the vendored US Core 7.0.0 ValueSets (idempotent; created resources are tagged to an import run)',
  aliases: aliasIfFree('initUsCore'),
  requireAuth: true
}, async function(params, context) {
  // Pre-mint the run id so created resources can be tagged as we go; the
  // run record is only written if the run actually created something.
  const importRunId = Random.id();

  const result = await UsCoreMethods.initializeValueSets({
    importRunId: importRunId,
    importType: IMPORT_TYPE_CODE
  });

  const ImportRuns = importRunsCollection();
  if (result.created > 0 && ImportRuns) {
    const now = new Date();
    await ImportRuns.upsertAsync({ _id: importRunId }, { $set: {
      status: 'completed',
      importType: IMPORT_TYPE_CODE,
      origin: IMPORT_RUN_ORIGIN,
      filenames: ['us-core-valuesets.json'],
      userId: get(context, 'userId', null),
      resourceCounts: { ValueSet: result.created },
      createdAt: now,
      completedAt: now
    } });
    log.info('US Core init recorded as import run', { importRunId, created: result.created, updated: result.updated });
  } else if (result.created === 0) {
    log.info('US Core init was a no-op refresh — no import run recorded', { updated: result.updated });
  } else {
    log.warn('ImportRuns registry unavailable — created resources are tagged but the run is unrecorded', { importRunId });
  }

  return {
    created: result.created,
    updated: result.updated,
    total: result.total,
    importRunId: result.created > 0 ? importRunId : null
  };
});

Meteor.ServerMethods.define('usCore.status', {
  description: 'Census of the vendored US Core ValueSets (present vs expected) and the most recent init run',
  requireAuth: true
}, async function(params, context) {
  const present = await ValueSets.find({ _id: { $in: US_CORE_VALUESET_IDS } }).countAsync();

  let lastRun = null;
  const ImportRuns = importRunsCollection();
  if (ImportRuns) {
    const runDoc = await ImportRuns.findOneAsync(
      { origin: IMPORT_RUN_ORIGIN },
      { sort: { createdAt: -1 }, fields: { _id: 1, createdAt: 1, resourceCounts: 1, userId: 1 } }
    );
    if (runDoc) {
      lastRun = {
        importRunId: runDoc._id,
        at: runDoc.createdAt,
        created: get(runDoc, 'resourceCounts.ValueSet', 0)
      };
    }
  }

  return {
    expected: US_CORE_VALUESET_IDS.length,
    present: present,
    lastRun: lastRun
  };
});
