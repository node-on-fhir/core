// packages/pacio-core/server/methods/loadConnectathonData.js
//
// Server method to bulk load connectathon sample data into collections.
// Used for demo setup at the July 2026 CMS FHIR Connectathon (PACIO track).
//
// Two data sources, loaded in order:
//   1. The PACIO sample data depot (data/connectathon-july-2026-examples/
//      examples.ndjson, vendored from the connectathon-july-2026 branch of
//      github.com/paciowg/sample-data-fsh; refresh with
//      `npm run refresh-pacio-sample-data`)
//   2. Curated BSJ demo fixtures (data/2026-07-cms-connectathon/*.json) —
//      loaded last so the tuned demo resources win on _id collisions

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Curated demo fixtures (authoritative overrides, loaded last)
import bsjPatient from '../../data/2026-07-cms-connectathon/bsj-patient.json';
import bsjTocComposition from '../../data/2026-07-cms-connectathon/bsj-toc-composition.json';
import bsjAdiDocumentReference from '../../data/2026-07-cms-connectathon/bsj-adi-documentreference.json';
import bsjPromis10QR from '../../data/2026-07-cms-connectathon/bsj-promis10-questionnaireresponse.json';
import bsjInpatientEncounter from '../../data/2026-07-cms-connectathon/bsj-inpatient-encounter.json';
import bsjZ66Condition from '../../data/2026-07-cms-connectathon/bsj-z66-condition.json';

const CURATED_RESOURCES = [
  bsjPatient,
  bsjTocComposition,
  bsjAdiDocumentReference,
  bsjPromis10QR,
  bsjInpatientEncounter,
  bsjZ66Condition
];

const SAMPLE_DATA_ASSET = 'data/connectathon-july-2026-examples/examples.ndjson';

// resourceType -> collection name, where simple pluralization (+'s') is wrong
const PLURAL_OVERRIDES = {
  Library: 'Libraries',
  Binary: 'Binaries'
};

function collectionNameForResourceType(resourceType) {
  return PLURAL_OVERRIDES[resourceType] || (resourceType + 's');
}

// Upsert one FHIR resource into its collection.
// Returns 'loaded', 'skipped', or throws.
async function upsertResource(resource, skippedTypes) {
  const resourceType = resource.resourceType;
  const collectionName = collectionNameForResourceType(resourceType);
  const collection = get(global, 'Collections.' + collectionName);

  if (!collection) {
    skippedTypes[resourceType] = (skippedTypes[resourceType] || 0) + 1;
    return 'skipped';
  }

  if (!resource._id && resource.id) {
    resource._id = resource.id;
  }

  await collection.updateAsync(
    { _id: resource._id },
    { $set: resource },
    { upsert: true }
  );
  return 'loaded';
}

Meteor.methods({
  /**
   * Load all connectathon sample data into collections.
   * Upserts to avoid duplicates on repeated calls.
   */
  'pacio.loadConnectathonData': async function() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    console.log('[pacio.loadConnectathonData] Loading July 2026 CMS Connectathon sample data');

    let loadedCount = 0;
    let skippedCount = 0;
    const errors = [];
    const skippedTypes = {};
    const byResourceType = {};

    // 1. PACIO sample data depot (NDJSON, one resource per line)
    let ndjson = null;
    try {
      ndjson = await Assets.getTextAsync(SAMPLE_DATA_ASSET);
    } catch (error) {
      const msg = 'Sample data asset not found (' + SAMPLE_DATA_ASSET + '): ' + error.message;
      console.warn('[pacio.loadConnectathonData]', msg);
      errors.push(msg);
    }

    if (ndjson) {
      const lines = ndjson.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
          continue;
        }

        let resource;
        try {
          resource = JSON.parse(line);
        } catch (error) {
          errors.push('NDJSON parse error at line ' + (i + 1) + ': ' + error.message);
          continue;
        }

        try {
          const outcome = await upsertResource(resource, skippedTypes);
          if (outcome === 'loaded') {
            loadedCount++;
            byResourceType[resource.resourceType] = (byResourceType[resource.resourceType] || 0) + 1;
          } else {
            skippedCount++;
          }
        } catch (error) {
          errors.push(resource.resourceType + '/' + resource._id + ': ' + error.message);
        }

        if (loadedCount > 0 && loadedCount % 100 === 0) {
          console.log('[pacio.loadConnectathonData] ...', loadedCount, 'resources loaded');
        }
      }
    }

    // 2. Curated demo fixtures — loaded last so they win on _id collisions
    for (const resource of CURATED_RESOURCES) {
      try {
        const outcome = await upsertResource(resource, skippedTypes);
        if (outcome === 'loaded') {
          loadedCount++;
          byResourceType[resource.resourceType] = (byResourceType[resource.resourceType] || 0) + 1;
          console.log('[pacio.loadConnectathonData] Loaded curated', resource.resourceType + '/' + resource._id);
        } else {
          skippedCount++;
        }
      } catch (error) {
        errors.push(resource.resourceType + '/' + resource._id + ': ' + error.message);
      }
    }

    if (Object.keys(skippedTypes).length > 0) {
      console.warn('[pacio.loadConnectathonData] Skipped resource types with no registered collection:', JSON.stringify(skippedTypes));
    }
    console.log('[pacio.loadConnectathonData] Done:', loadedCount, 'loaded,', skippedCount, 'skipped,', errors.length, 'errors');

    return {
      loadedCount: loadedCount,
      skippedCount: skippedCount,
      skippedTypes: skippedTypes,
      byResourceType: byResourceType,
      errors: errors
    };
  }
});
