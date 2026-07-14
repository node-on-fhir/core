// server/startup/ensureClinicalIndexes.js
//
// MongoDB indexes for patient-scoped clinical collections. Without these,
// every 'subject.reference' query (quality-measure evaluators, patient-scoped
// publications, chart panels) is a full collection scan — in prod-sized
// databases that turns a single CMS1317v1 patient calculation into minutes.
//
// Reads global.Collections inside Meteor.startup (populated by server/main.js
// module body, which runs before startup callbacks fire). createIndexAsync is
// idempotent, so re-running at every boot is safe; collections absent in a
// given deployment are skipped.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import LoggerModule from '/imports/lib/Logger.js';

const log = LoggerModule.Logger.for('EnsureClinicalIndexes');

// Leading 'subject.reference' prefix also serves plain patient-only queries.
const CLINICAL_INDEXES = [
  { collection: 'Encounters', keys: { 'subject.reference': 1, 'period.end': 1 } },
  { collection: 'DocumentReferences', keys: { 'subject.reference': 1, 'type.coding.code': 1 } },
  { collection: 'Observations', keys: { 'subject.reference': 1, 'code.coding.code': 1 } },
  { collection: 'Procedures', keys: { 'subject.reference': 1, 'code.coding.code': 1 } },
  { collection: 'Conditions', keys: { 'subject.reference': 1, 'code.coding.code': 1 } },
  { collection: 'ServiceRequests', keys: { 'subject.reference': 1, 'code.coding.code': 1 } },
  { collection: 'Compositions', keys: { 'subject.reference': 1, 'date': 1 } },
  { collection: 'ValueSets', keys: { 'identifier.value': 1 } }
];

Meteor.startup(async function() {
  let created = 0;
  let skipped = 0;

  for (const spec of CLINICAL_INDEXES) {
    const collection = get(global, 'Collections.' + spec.collection);
    if (!collection || typeof collection.createIndexAsync !== 'function') {
      log.warn('Collection not registered; index skipped', { collection: spec.collection });
      skipped++;
      continue;
    }
    try {
      await collection.createIndexAsync(spec.keys);
      created++;
    } catch (error) {
      log.error('Failed to create index', { collection: spec.collection, keys: spec.keys, error: error.message });
      skipped++;
    }
  }

  log.info('Clinical collection indexes ensured', { created: created, skipped: skipped });
});
