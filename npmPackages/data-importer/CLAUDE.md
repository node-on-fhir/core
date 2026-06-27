# CLAUDE.md — @node-on-fhir/data-importer

Migrated from Atmosphere `clinical:data-importer` (2026-06-14, MIT). Data importer — CSV/XLSX/XML/Apple-Health-zip import, collection management, and an Ace-based data editor. 2 routes (`/import-data` → DataImportPage, `/data-editor` → EditorPage [requireAuth]). Self-contained client.js (routes/sidebar from workflow.json; preserves DynamicRoutes/AdminDynamicRoutes/AdminSidebarElements/FooterButtons + DataImportPage/MedicalRecordImporter/CollectionManagement/ImportAlgorithm exports). server/index.js loads the 3 addFiles server files (methods.xlsx/proxy/warehouse).

- **Bare-global fixes:** `lib/MedicalRecordImporter.js:54` (`MedicalRecordImporter =`) and `lib/ImportAlgorithm.js:7` (`ImportAlgorithm =`) were Atmosphere bare-globals in strict files → `const X = globalThis.X = …` (both also `export default`).
- **meteor/http → fetch-backed HTTP client:** the Atmosphere `api.use('http')` pulled the deprecated http package into the resolved set; as an NPM workflow package there is no api.use, so `import { HTTP } from 'meteor/http'` fails (http isn't self-sufficiently available). Added `lib/httpClient.js` — a small `HTTP` client (get/post/put/del/call) backed by `meteor/fetch` (core, always present) preserving the `HTTP.post/put(url, {data}, cb)` signature — and repointed the 4 importers (server/methods.warehouse.js, lib/MedicalRecordImporter.js, client/EditorPage.jsx [call is commented/dead], client/ImportEditorBindings.jsx). Call sites untouched.
- **Dead PatientCard dropped:** `client/PatientCard.jsx` was 100% commented-out vestigial code (its only `@material-ui/styles` reference was a commented line) and unimported by anything — NOT copied. The live component is the framework's `Meteor.PatientCard` (`imports/patient/PatientCard.jsx`); data-importer references PatientCard nowhere. So **no real old-MUI dependency**.
- **Deps** (all app-level → peers, no install/lockfile churn): xlsx, papaparse, xml2js, sax, jszip, file-dialog, extend, ace-builds. `Npm.depends` was commented out upstream.

## Deduplication at import (optional, feature-detected)

The /import-data page detects `@node-on-fhir/patient-matching` at runtime via the
`Package` registry (never a static import — it's optional) and, when present, runs
its `Deduplicator` over the parsed resource list. `client/useDeduplicator.js` is the
bridge (`getDeduplicator`/`analyzeResources`/`reconcileResources`/`fetchVersioningModes`).

- **State**: `ImportStoreContext` carries `dedupAvailable`, `dedupAnalysis`, `versioningModes`, and `importOptions` (patientStrategy, collapseExact, dedupeChildrenByIdentifier, honorVersioning, clusterStrategies).
- **UI**: `FileDropTab` uses an adaptive grid — 2 columns by default (Resource List | Import & Dedup), 3 columns when a row's `>` selects a resource (Resource List | Resource Preview | Import & Dedup); the Preview card's close (X) clears `selectedResourceIndex` back to 2-col. `client/ImportParamsPanel.jsx` (Import & Dedup: stats, patient clusters with per-cluster strategy, duplicate groups, options, versioning hint) is always the rightmost full-height card. Analysis re-runs on resource-list change (deferred a tick; O(n²) patient clustering guarded at 750).
- **Apply**: `ImportDialog.applyDeduplication()` runs `Deduplicator.reconcile` before insert (both client-Minimongo and warehouse paths); the reconciled flat array replaces `data` (`isNdjson=false`).
- **Versioning**: `server/methods.warehouse.js` `insertBundleIntoWarehouse` now honors `private.fhir.rest.<Type>.versioning` (authoritative server setting, same as FhirEndpoints.js). Versioned types insert same-id-different-content as a new `meta.versionId` (new `_id` via `Random.id()`), identical re-imports are no-ops; no-version types keep the prior upsert-by-`_id`. Client passes `honorVersioning` in the call options.
- `tests/`, `.circleci/` skipped. `fire`→`Whatshot`. Not in `.meteor/packages` (was `--extra-packages`; now `EXTRA_WORKFLOWS=@node-on-fhir/data-importer`). Monorepo-tracked → fresh git init.
