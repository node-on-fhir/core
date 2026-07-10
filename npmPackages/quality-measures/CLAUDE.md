# CLAUDE.md — @node-on-fhir/quality-measures

Migrated from Atmosphere `clinical:quality-measures` (2026-06-14, MIT). Clinical Quality Measures (ONC §170.315(c)(1-4)) + **PACIO** I-CARE and CMS1317v1 Advance Care Planning measure evaluation. Single route `/quality-measures` (`QualityMeasuresPage`, `requireAuth`). **Connectathon-relevant** — PACIO July 2026 (see [[pacio-connectathon-july-2026]]).

**Not actually gated.** package.js `Package.onTest` `api.use('clinical:quality-measures')` is a **self-reference** (the package's own name), test-only — false gate (fifth in the streak: consent-generator / vital-signs / accounts-management / ccda-export / quality-measures). Real onUse deps all app infra (`react-meteor-data`, `mongo`, `session`, `clinical:extended-api@3.0.0`, `clinical:hl7-resource-datatypes`) — present.

**One external dep:** `fqm-execution@^1.8.5` (FHIR Quality Measure engine), already a root dependency — declared in this package's `dependencies`. No `Npm.depends`.

**Structure:** `client/QualityMeasuresPage.jsx` (+ children); `lib/{pacio-measures,toc-sections,collections}.js` (isomorphic — were `addFiles ['client','server']`; `collections.js` ES-exports `QualityMeasureFilterSets`, no host-app collision); `server/evaluators/{pacio-data-connector,icare-evaluator,adi-acp-evaluator}.js`, `server/{measure-calculator,fqm-engine,measure-bundle-methods,methods,startup}.js`. **`specs/cms1317/`** assets ship with the package — `startup.js` imports ValueSet JSON from `specs/cms1317/valuesets/*.json` (Rspack resolves JSON imports); `.cql`/`.html` are reference assets. `guides/` is docs (not imported, not copied).

server/index.js loads the lib files then the server pipeline in package.js addFiles order. client.js preserves the index.jsx surface (ClinicianWorkflows / ModuleConfig / settings gates) + imports `lib/collections.js` for client Minimongo parity; the dead "Calculate Measures" footer button was retired 2026-07-09 and replaced by a `serverConfigs` contribution (TerminologyConfig panel on `/server-configuration`). Fixed legacy `iconName: 'assessment'` → `'Assessment'`. No old-MUI, no Atmosphere-isms, no `meteor/http`. No Package-registry symbols → `Package['@node-on-fhir/quality-measures'] = {}` (harmless). Monorepo-tracked → fresh git init (nested repo).

## Data-driven computability (2026-07-09)

The UI catalog (`CMS_MEASURES` in `client/QualityMeasuresPage.jsx`) is static display
metadata; whether a measure can actually CALCULATE is **data-driven**:

- `qualityMeasures.getMeasureComputability(measureIds)` → per-id
  `{ measureId, computable, engine?, resolvedMeasureId?, reason? }`. PACIO measures
  (in-code evaluators) are always computable; everything else needs an imported
  measure bundle with compiled ELM. Non-computable measures render a
  "Bundle required" chip + info Alert, and CALCULATE surfaces the server's
  `not-computable` reason verbatim (no generic error).
- **CMS-number resolver** (`resolveMeasureId` in `server/fqm-engine.js`): placeholder
  `CMS122v12` resolves to an imported `CMS122FHIR` (exact `_id` first, then
  `^CMS<num>(?![0-9])` against Measures `_id`/`name`/`title`). Used by both the
  computability check and `getMeasureDefinition`, so importing a MADiE export flips
  a placeholder to computable with zero UI rework. `isPacioMeasure` is checked first
  everywhere, so the seeded `CMS1317v1` never collides with an imported `CMS1317-FHIR`.

## Getting executable bundles (BYOK — never commit licensed artifacts)

UMLS/VSAC licenses are **per person** (no product keys) and MADiE exports embed
VSAC value-set expansions (non-redistributable). Therefore: **never commit MADiE
exports or VSAC expansions**. Channels, all funneling through
`importMeasureBundleInternal` (`server/measure-bundle-methods.js`):

1. **Import dialog** on `/quality-measures` (file upload, warns when a bundle has no ELM).
2. **Autoload directory**: `*.json` bundles in `settings.private.qualityMeasures.bundleDirectory`
   → `MEASURE_BUNDLES_DIR` env → gitignored repo-root `measure-bundles/` import on every boot.
3. **TerminologyConfig panel** (`/server-configuration` → quality-measures tab,
   `server/vsac-methods.js`): BYOK key entry (stored in ServerConfiguration collection,
   `configType: 'vsac'`; resolution DB → `settings.private.vsac.apiKey` → `VSAC_API_KEY`;
   never sent to the client), Test Connection, **Fetch Value Sets** (VSAC FHIR API
   `$expand`, upserted into ValueSets tagged `_bundleMeasureId`), **Fetch Measure
   Packages** (best-effort eCQI Resource Center public zips via jszip; manual fallback).
   ⚠️ The public eCQI zips for the classic CMS eCQMs (CMS2/122/146/165, verified
   2026-07-09) are **QDM 5.6** packages — QDM ELM cannot execute against FHIR data, so
   the fetch reports this honestly; the FHIR versions must be exported from MADiE
   (madie.cms.gov, HARP login) and dropped into `measure-bundles/` / the Import dialog.
4. Calc-time fallback: `calculateWithFqm` passes the resolved key as `vsAPIKey` to
   fqm-execution for bundles without embedded expansions.

`specs/cms1317/fhir/bundles/cms1317-fhir-bundle.json` is the **CQL-only (no ELM)**
import fixture — it exercises the import + `hasElm:false` warning paths and is
deliberately NOT auto-imported (would duplicate the evaluator-backed CMS1317v1).
Tests: `tests/nightwatch/measure-computability.test.js` (synthetic-bundle flip,
no licensed data).
