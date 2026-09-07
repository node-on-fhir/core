# CLAUDE.md — @node-on-fhir/patient-matching

Migrated from Atmosphere `patient-matching` (2026-06-13, MIT preserved). Patient matching + identity assurance (IDI profile / NIST 800-63 AAL2). Routes `/patient-matching`, `/identity-assurance` (both requireAuth). Atmosphere client mainModule was index.jsx; consolidated into self-contained client.js that builds routes/sidebar from workflow.json and re-exports the `PatientMatching` namespace + the two pages. Kept the original self-contained `server/index.js` mainModule (collections/schemas/constants/utils + IDI-match methods, REST endpoint, FHIR IdiPatient/IdiMatchOperation, AAL2 security, audit logging, publications, startup). body-parser dependency (used by REST endpoint; present in app). moment/simpl-schema peers. `guide/` IG tree skipped. `people`→`People`, `security`→`Security`. Monorepo-tracked → fresh git init.

## Deduplicator (entity resolution) — `lib/Deduplicator.js`

Pure-JS, client-safe (lodash + `MatchingAlgorithm`, no Meteor imports). Exported as a
named export AND folded onto the default-export object (so consumers reach it via
`Package['@node-on-fhir/patient-matching'].Deduplicator`), from both `client.js` and
`server.js`, plus the `./lib/Deduplicator` package.json subpath. Two consumer styles:

- **data-importer** feature-detects it via the Package registry (never
  static-imports) to dedup FHIR batches client-side at import time.
- **The core dedup engine** (`imports/api/dedup/engine.js`, added 2026-09-06)
  statically imports the `./lib/Deduplicator` subpath — legitimate because the
  package is monorepo-tracked (symlink always exists) and the lib is pure JS
  with no side effects, so it works even when the patient-matching WORKFLOW is
  disabled in workflows.json. Do not convert that consumer to
  `Npm.require`: require-of-ESM dies in Meteor's patched loader.

- `analyze(resources, opts)` → non-destructive plan: `{ patientClusters, duplicateGroups, idRemap, stats }`. Patients cluster via union-find over pairwise `MatchingAlgorithm` scores; non-Patient resources group by business identifier else content fingerprint (reason `'identifier'|'content'`).
- `reconcile(resources, plan)` → re-points child references onto survivors, collapses duplicates, merges patient composites, emits Provenance; honors per-type `versioning` (stamps `meta.versionId` instead of collapsing identifier-dups when versioned).
- `mergePatients(patients, opts)` → composite with `Patient.link` (`replaces`), unioned non-conflicting datums, conflict fields (telecom/address) resolved newest-by-`meta.lastUpdated` with older kept `use:'old'`, plus a `Provenance` resource.
- `contentFingerprint(resource, idRemap?)` / `identifierKey(resource)` → the identity primitives (exported 2026-09-06 for the core dedup engine + import-time existence checks; previously module-private). `contentFingerprint` = djb2 hash of a stable-stringified clone with `_id`/`id`/`meta.lastUpdated`/`meta.versionId`/`meta.source` stripped; `identifierKey` = sorted `system|value` list, `''` when none.
- **Fingerprint gotcha (important):** `contentFingerprint` does NOT strip `meta.tag`, so identical resources stamped by different import runs (`urn:honeycomb:import-run`) fingerprint DIFFERENTLY. Any cross-run comparison must strip run/type tags first — server-side callers go through `sanitizeForDedup()` in `imports/api/dedup/engine.js` (see `.claude/rules/fhir/dedup.md`). Kept out of this lib deliberately: the tag systems are a host-app convention, not a matching concern.
- **Scoring gotcha (important):** `MatchingAlgorithm.calculateMatchScore` normalizes by the weight of every field it attempts, so fields absent on both patients (identifier/address/telecom) still score 0 and drag identical patients down to ~0.5. The Deduplicator works around this with per-pair `pairWeights()` that zero the weight of any field not present on BOTH patients — it does NOT modify the shared algorithm.
