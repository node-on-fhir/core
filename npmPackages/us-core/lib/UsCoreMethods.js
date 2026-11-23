// npmPackages/us-core/lib/UsCoreMethods.js
//
// Ported equivalent of the Atmosphere `clinical:uscore` package's UsCoreMethods,
// whose source did not survive the migration. It originally landed in
// provider-directory (its only consumer at the time) and moved home to us-core
// 2026-11-07. `UsCoreMethods.initializeValueSets()` (the on-demand `initUsCore`
// method) seeds the US Core ValueSets into the app's ValueSets collection so
// search dialogs (states, specialties, resource types) have data to filter on.
//
// The seed data is the 20 US Core 7.0.0 ValueSets, vendored from the us-core IG
// guide into data/us-core-valuesets.json at migration time.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { ValueSets } from '/imports/lib/schemas/SimpleSchemas/ValueSets';
import usCoreValueSets from '../data/us-core-valuesets.json';

const IMPORT_RUN_TAG_SYSTEMS = ['urn:honeycomb:import-run', 'urn:honeycomb:import-type'];

// The vendored FHIR ids — exported so usCore.status can census presence.
export const US_CORE_VALUESET_IDS = (Array.isArray(usCoreValueSets) ? usCoreValueSets : [])
  .map(function(valueSet) { return get(valueSet, 'id'); })
  .filter(Boolean);

export const UsCoreMethods = {
  // Seed the vendored US Core ValueSets into the ValueSets collection.
  // Idempotent — keyed on the FHIR id (used as the Mongo _id): existing docs
  // are refreshed in place WITHOUT acquiring the new run tag (import-run
  // provenance marks only what a run actually created — the flush-safety
  // contract), and any import-run tags from the ORIGINAL creating run are
  // preserved across refreshes.
  async initializeValueSets(options) {
    const importRunId = get(options, 'importRunId', null);
    const importType = get(options, 'importType', null);
    if (!Array.isArray(usCoreValueSets)) {
      console.warn('[us-core UsCoreMethods] us-core-valuesets.json did not import as an array');
      return { created: 0, updated: 0, total: 0 };
    }

    let created = 0;
    let updated = 0;
    for (const valueSet of usCoreValueSets) {
      const id = get(valueSet, 'id');
      if (!id) {
        continue;
      }
      const doc = Object.assign({}, valueSet, { _id: id });

      const existing = await ValueSets.findOneAsync({ _id: id });
      if (existing) {
        // Refresh in place; carry forward the creating run's provenance tags
        // (the vendored JSON's meta would otherwise erase them).
        const carriedTags = (get(existing, 'meta.tag', []) || []).filter(function(tag) {
          return IMPORT_RUN_TAG_SYSTEMS.indexOf(get(tag, 'system')) !== -1;
        });
        if (carriedTags.length > 0) {
          doc.meta = Object.assign({}, doc.meta);
          doc.meta.tag = (doc.meta.tag || []).concat(carriedTags);
        }
        await ValueSets.updateAsync({ _id: id }, { $set: doc });
        updated++;
      } else {
        // Created this run — stamp import-run provenance (host facade;
        // null-safe no-op in contexts without the host app).
        if (Meteor.ImportRunTags && importRunId) {
          Meteor.ImportRunTags.applyImportRunTags(doc, {
            importRunId: importRunId,
            importType: importType
          });
        }
        await ValueSets.insertAsync(doc);
        created++;
      }
    }

    console.log('[us-core UsCoreMethods] US Core ValueSets seeded — ' + created + ' created, ' + updated + ' refreshed');
    return { created: created, updated: updated, total: created + updated };
  }
};

export default UsCoreMethods;
