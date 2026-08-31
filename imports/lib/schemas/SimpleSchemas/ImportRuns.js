// imports/lib/schemas/SimpleSchemas/ImportRuns.js
//
// ImportRuns — the import-run provenance registry (personalized ETL, Phase 1).
// One document per import run (a drop gesture on /import-data, an upload
// session on /dicom/upload, …). NOT a FHIR resource: this is internal
// bookkeeping that pairs with the meta.tag stamps from
// imports/lib/importRunTags.js so test loads can be inspected
// (importRuns.census) and bulk-deleted (importRuns.flush) after the fact.
// Plain collection — no schema attachment (SimpleSchema was retired in the
// 2026-07 JSON-Schema migration, and FhirValidator only covers FHIR types);
// shape is enforced by imports/api/importRuns/methods.js.
//
// Document shape:
//   _id            String  — the importRunId stamped into resource.meta.tag
//   status         String  — 'active' | 'completed' | 'flushed' | 'failed'
//   importType     String  — content-type code (imports/lib/importRunTags.js IMPORT_TYPES)
//   origin         String  — surface that ran it ('import-data', 'dicom-upload', 'warehouse:direct')
//   filenames      [String]
//   userId         String  — who ran the import
//   patientId      String  — selected patient at import time (may be null)
//   attachmentSource String — which patient the import attached to and why
//                            (design v2 §B): 'selected' | 'profile-linked' |
//                            'payload-created' | 'unlinked'. Optional.
//   createdPatientIds [String] — FHIR ids of Patient resources this run created
//                            (payload-created path). Accumulates across chunked
//                            warehouse calls; makes relaxed creation flushable.
//   resourceCounts Object  — { ResourceType: count } accumulated by the warehouse
//   gridfsFileIds  [String]
//   flushResult    Object  — importRuns.flush audit payload
//   createdAt / completedAt / flushedAt   Date

import { Mongo } from 'meteor/mongo';

export const ImportRuns = new Mongo.Collection('ImportRuns');
