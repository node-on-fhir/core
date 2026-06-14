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

// PACIO sample data depot. Was loaded via Assets.getTextAsync(...examples.ndjson)
// in the Atmosphere package; NPM workflow packages have no Assets API, so the
// depot is vendored as a JSON array (examples.json, generated from the original
// examples.ndjson at migration time) and imported directly — the same
// Atmosphere-Asset → direct-import conversion used by reference-app.
import sampleResources from '../../data/connectathon-july-2026-examples/examples.json';

// Curated demo fixtures (authoritative overrides, loaded last)
import bsjPatient from '../../data/2026-07-cms-connectathon/bsj-patient.json';
import bsjTocComposition from '../../data/2026-07-cms-connectathon/bsj-toc-composition.json';
import bsjAdiDocumentReference from '../../data/2026-07-cms-connectathon/bsj-adi-documentreference.json';
import bsjPromis10QR from '../../data/2026-07-cms-connectathon/bsj-promis10-questionnaireresponse.json';
import bsjInpatientEncounter from '../../data/2026-07-cms-connectathon/bsj-inpatient-encounter.json';
import bsjZ66Condition from '../../data/2026-07-cms-connectathon/bsj-z66-condition.json';
import bsjAcpDiscussionObservation from '../../data/2026-07-cms-connectathon/bsj-acp-discussion-observation.json';
import bsjDnrServiceRequest from '../../data/2026-07-cms-connectathon/bsj-dnr-servicerequest.json';

const CURATED_RESOURCES = [
  bsjPatient,
  bsjTocComposition,
  bsjAdiDocumentReference,
  bsjPromis10QR,
  bsjInpatientEncounter,
  bsjZ66Condition,
  bsjAcpDiscussionObservation,
  bsjDnrServiceRequest
];

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

    // 1. PACIO sample data depot (vendored examples.json — array of FHIR
    //    resources, converted from the original examples.ndjson)
    if (Array.isArray(sampleResources)) {
      for (let i = 0; i < sampleResources.length; i++) {
        const resource = sampleResources[i];
        if (!resource || !resource.resourceType) {
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
    } else {
      const msg = 'Sample data depot (examples.json) did not import as an array';
      console.warn('[pacio.loadConnectathonData]', msg);
      errors.push(msg);
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
