// npmPackages/provider-directory/lib/UsCoreMethods.js
//
// Ported equivalent of the Atmosphere `clinical:uscore` package's UsCoreMethods,
// whose source did not survive the migration. The provider directory's only use
// was `UsCoreMethods.initializeValueSets()` (the on-demand `initUsCore` method),
// which seeds the US Core ValueSets into the app's ValueSets collection so the
// search dialogs (states, specialties, resource types) have data to filter on.
//
// The seed data is the 20 US Core 7.0.0 ValueSets, vendored from the us-core IG
// guide into data/us-core-valuesets.json at migration time.

import { get } from 'lodash';
import { ValueSets } from '/imports/lib/schemas/SimpleSchemas/ValueSets';
import usCoreValueSets from '../data/us-core-valuesets.json';

export const UsCoreMethods = {
  // Upsert the vendored US Core ValueSets into the ValueSets collection.
  // Idempotent — keyed on the FHIR id (used as the Mongo _id).
  async initializeValueSets() {
    if (!Array.isArray(usCoreValueSets)) {
      console.warn('[provider-directory UsCoreMethods] us-core-valuesets.json did not import as an array');
      return { loaded: 0 };
    }

    let loaded = 0;
    for (const valueSet of usCoreValueSets) {
      const id = get(valueSet, 'id');
      if (!id) {
        continue;
      }
      const doc = Object.assign({}, valueSet, { _id: id });
      await ValueSets.upsertAsync({ _id: id }, { $set: doc });
      loaded++;
    }

    console.log('[provider-directory UsCoreMethods] Seeded ' + loaded + ' US Core ValueSets');
    return { loaded: loaded };
  }
};

export default UsCoreMethods;
