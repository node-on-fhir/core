// imports/api/rxnorm/collections.js
//
// RxNormConcepts — server-side cache of RxNav lookups. Not published to
// clients; the client only ever sees derived decoration payloads from
// rxnorm.reconciliationAssist.
//
// Shape (hydrator-ready: a future RxNorm full-release RRF loader can populate
// the same rows with source: 'rrf'):
//   {
//     rxcui: String,                 // canonical key
//     name: String, tty: String,     // 'SCD', 'IN', 'BN', ...
//     ingredients: [{ rxcui, name }],           // related?tty=IN+MIN
//     classes: [{ classId, className, classType, relaSource, rela }],
//     sourceQueries: [String],       // normalized free-text strings that resolved here
//     fetchedAt: Date,
//     source: 'rxnav' | 'rrf'
//   }
//
// Staleness: fetchedAt older than settings.private.rxnorm.cacheTtlDays
// triggers a refresh attempt, but stale rows are still served when RxNav is
// unreachable (degrade to cache, then to nothing).

import { Mongo } from 'meteor/mongo';

export const RxNormConcepts = new Mongo.Collection('RxNormConcepts');
