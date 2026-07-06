// server/referenceRanges/seed.js
// Idempotent base-layer seeding of reference ranges. Server-only (Meteor).

import { ObservationDefinitions } from '/imports/lib/schemas/SimpleSchemas/ObservationDefinitions';
import { toSeedDocs } from './seedRecords.mjs';
import seedArray from '/imports/data/reference-ranges/blood-panel.json' assert { type: 'json' };

export async function seedReferenceRanges() {
  const docs = toSeedDocs(seedArray);
  let n = 0;
  for (const doc of docs) {
    await ObservationDefinitions.upsertAsync({ _id: doc._id }, { $set: doc });
    n++;
  }
  console.log('[referenceRanges.seed] upserted ' + n + ' base ObservationDefinition(s)');
  return n;
}
