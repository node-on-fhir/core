# CLAUDE.md — @node-on-fhir/patient-matching

Migrated from Atmosphere `patient-matching` (2026-06-13, MIT preserved). Patient matching + identity assurance (IDI profile / NIST 800-63 AAL2). Routes `/patient-matching`, `/identity-assurance` (both requireAuth). Atmosphere client mainModule was index.jsx; consolidated into self-contained client.js that builds routes/sidebar from workflow.json and re-exports the `PatientMatching` namespace + the two pages. Kept the original self-contained `server/index.js` mainModule (collections/schemas/constants/utils + IDI-match methods, REST endpoint, FHIR IdiPatient/IdiMatchOperation, AAL2 security, audit logging, publications, startup). body-parser dependency (used by REST endpoint; present in app). moment/simpl-schema peers. `guide/` IG tree skipped. `people`→`People`, `security`→`Security`. Monorepo-tracked → fresh git init.

## Deduplicator (entity resolution) — `lib/Deduplicator.js`

Pure-JS, client-safe (lodash + `MatchingAlgorithm`, no Meteor imports). Exported as a
named export AND folded onto the default-export object (so consumers reach it via
`Package['@node-on-fhir/patient-matching'].Deduplicator`), from both `client.js` and
`server.js`, plus the `./lib/Deduplicator` package.json subpath. The data-importer
feature-detects it (never static-imports) to dedup FHIR batches at import time.

- `analyze(resources, opts)` → non-destructive plan: `{ patientClusters, duplicateGroups, idRemap, stats }`. Patients cluster via union-find over pairwise `MatchingAlgorithm` scores; non-Patient resources group by business identifier else content fingerprint (reason `'identifier'|'content'`).
- `reconcile(resources, plan)` → re-points child references onto survivors, collapses duplicates, merges patient composites, emits Provenance; honors per-type `versioning` (stamps `meta.versionId` instead of collapsing identifier-dups when versioned).
- `mergePatients(patients, opts)` → composite with `Patient.link` (`replaces`), unioned non-conflicting datums, conflict fields (telecom/address) resolved newest-by-`meta.lastUpdated` with older kept `use:'old'`, plus a `Provenance` resource.
- **Scoring gotcha (important):** `MatchingAlgorithm.calculateMatchScore` normalizes by the weight of every field it attempts, so fields absent on both patients (identifier/address/telecom) still score 0 and drag identical patients down to ~0.5. The Deduplicator works around this with per-pair `pairWeights()` that zero the weight of any field not present on BOTH patients — it does NOT modify the shared algorithm.
