// imports/api/dedup/DedupFindings.js
//
// Operational registry of dedup analysis findings — what the on-demand
// methods and the nightly cron persist for later review/reconcile. This is an
// ops artifact (like cronHistory or ImportRuns), NOT a FHIR resource, so it is
// deliberately kept OUT of Meteor.Collections / global.Collections: it must
// never appear in the FHIR REST surface, autopublish, or import-run flushes.
//
// Doc shape:
//   {
//     _id, createdAt,
//     trigger: 'on-demand' | 'cron',
//     scope: { kind: 'patient'|'collection'|'importRun',
//              patientId?, resourceType?, importRunId? },
//     stats: <Deduplicator.analyze stats>,
//     groups: [{ resourceType, reason, memberIds, keepId }],   // capped
//     groupsTruncated: <number dropped beyond the cap>,
//     status: 'open' | 'reconciled' | 'dismissed',
//     reconciledAt?, reconcileSummary?
//   }

import { Mongo } from 'meteor/mongo';

export const DedupFindings = new Mongo.Collection('DedupFindings');

export default DedupFindings;
