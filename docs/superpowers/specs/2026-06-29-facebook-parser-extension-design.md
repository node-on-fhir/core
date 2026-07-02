# Facebook Parser — Extension Migration Design

**Date:** 2026-06-29
**Package:** `@orbital/facebook-parser`
**Source prototype:** `workzone/personal-health-record/meteor-v3/` (`facebook-fhir-timeline`)
**Target:** `extensions/facebook-parser/`
**Status:** Implemented

## Goal

Migrate a standalone Meteor 3 prototype that converts a Facebook "Download Your
Information" export into FHIR resources, into a NodeOnFHIR **extension** workflow
package — following the `@orbital/interstate-interoperability` precedent. Unlike
that self-contained SPA, this one **integrates with the host**: imported FHIR is
written into honeycomb's existing global collections, tagged to the selected
patient. Routes are namespaced `/facebook-*`.

The legacy `workzone/personal-health-record/webapp/` (2016 Blaze app) is out of
scope.

## Source analysis

- Modern app under `meteor-v3/`: Meteor 3 + React 18 + MUI 5 + react-router 6;
  ~7k lines of pages, ~3k lines of server methods, a 1,081-line `FacebookImporter`,
  a 262-line keyword/SNOMED `ClinicalDetector`, a 251-line `DirectoryScanner`.
- The prototype defined its **own** FHIR collections (`patients`,
  `communications`, `clinicalImpressions`, `media`, `persons`, `careTeams`) +
  `importJobs`/`processingQueues`, used `accounts-password`, and namespaced every
  document by `userId`.
- Mapping: posts → `ClinicalImpression` (optional SNOMED findings), friends →
  `Person` + a `CareTeam`, messages → `Communication`, photos → `Media`, profile →
  `Patient`.

## Decisions (confirmed with user)

1. **Data model — integrate with host.** Drop the prototype's own FHIR collections
   and accounts. Resolve host collections (`Meteor.Collections?.X ||
   global.Collections?.X`; irregular plurals **`Medias`**, **`Persons`**), tag
   imports to the selected patient via `subject.reference` + a source tag, and keep
   only `ImportJobs`/`ProcessingQueues` package-owned.
2. **Page scope — full app**, all under `/facebook-*` routes; drop Login/Register
   (host owns auth). Some routes are expected to fold into host routes later
   (`/facebook-import` → `/data-importer`, `/facebook-profile` → `/my-profile`).
3. **Refactor depth — decompose to conventions.** Theme tokens, patient-context via
   Session, an injected repository in the importer, lazy-loaded heavy deps,
   `[facebook-parser]` log prefixes.
4. **Clinical NLP — keep but gated.** Runs only when
   `settings.private.facebookParser.enableClinicalNlp` is true (default off); the
   Import page shows an info Alert disclosing this. Candidate for future MCP rework.

## Package structure

```
extensions/facebook-parser/
├── package.json · workflow.json · client.js · server.js · README · CLAUDE · .gitignore
├── lib/
│   ├── collections.js        # ImportJobs, ProcessingQueues, FACEBOOK_SOURCE_TAG
│   ├── importer.js           # FacebookImporter — injected repository, no Meteor/collection imports
│   ├── clinical-detector.js  # pure; gated by caller
│   ├── directory-scanner.js  # server-only (fs/yauzl), de-Meteored
│   └── excluded-files.js
├── server/
│   ├── repository.js         # resolve host collections + subject.reference + source tag + idempotent writes
│   ├── methods.js            # facebookParser.* (import, job mgmt, getStats/getTimeline/getPersons/generateExport, getSettings)
│   └── publications.js       # facebookParser.importJobs (live progress) + facebookParser.resources
└── client/
    ├── components/shared.jsx  # useSelectedPatient, NoPatientSelected, StatCard
    └── pages/Facebook{Dashboard,Timeline,Import,ExportPreview,Persons,Profile,Settings}.jsx
```

## Host integration details

- **Collections:** `server/repository.js` maps resourceType → host collection
  (`COLLECTION_FOR`), stamps `meta.tag` (`FACEBOOK_SOURCE_TAG`) and a patient
  `subject.reference`, writes with `_id === FHIR id` (honeycomb convention so the
  importer's `Person/{id}` / `Media/{id}` cross-references resolve).
- **Patient scoping:** `patientFacebookSelector(resourceType, patientId)` — `Person`
  filters on `link.target.reference`, everything else on `subject.reference`, both
  AND the source tag. Used by reads, the publications, and cleanup.
- **Patient context:** client reads `Session.get('selectedPatientId')`
  (`SELECTED_PATIENT_ID`) and passes `patientId` into every method; methods gate on
  `this.userId` and never read Session. Pages show the standard "No patient
  selected" prompt when none is chosen.
- **Profile enhancement** is conservative: core demographics
  (name/birthDate/gender/maritalStatus) are only filled when **absent** on the host
  patient; telecom/address/extension are merged — never clobbering the real chart.

## Method namespacing

All methods are `facebookParser.*` (the prototype's generic `fhir.*`/`timeline.*`/
`dashboard.*`/`export.*` would collide with host methods). Meteor v3 async,
`function(){}`, `check()`, `this.userId` gate.

## Conventions applied

- Routes use `element: <Comp/>` (COMPONENTS map in `client.js`); `import React`.
- Theme tokens throughout; the prototype's own `ThemeProvider` + `localStorage`
  theme dropped (host owns theme; prints light).
- `react-ace` lazy-loaded with `ErrorBoundary` (outer, `/imports/ui/ErrorBoundary.jsx`)
  + `Suspense` (inner) on the Export page.
- `[facebook-parser]` console prefixes; `lodash get` defensive reads.

## Dependencies

- `dependencies`: `yauzl`, `node-stream-zip`, `uuid`, `validator`.
- `peerDependencies`: `react`, `react-dom`, `@mui/material`, `@mui/icons-material`,
  `@mui/lab`, `@mui/x-date-pickers`, `@emotion/*`, `lodash`, `moment`, `recharts`,
  `react-ace`, `ace-builds`.
- Dropped: `accounts-password`/`bcrypt`/`multer` coupling, the prototype's own
  collections, the `meteor.mainModule` block, and the legacy `webapp/`.

## Registration & git

- Lives under the `extensions/*` workspace glob → `npm install` symlinks it to
  `node_modules/@orbital/facebook-parser`.
- Enable via `EXTRA_WORKFLOWS=@orbital/facebook-parser` (the de-facto mechanism for
  `@orbital/*` siblings; not added to the committed `workflows.json`).
- Nested private git repo: `git init`, remote
  `git@github.com:orbital-health-systems/facebook-parser.git`, UNLICENSED +
  `private`.

## Verification

1. `npm install` → `node_modules/@orbital/facebook-parser` symlink exists and
   `require.resolve('@orbital/facebook-parser')` succeeds.
2. `EXTRA_WORKFLOWS=@orbital/facebook-parser meteor run --settings
   settings/settings.honeycomb.localhost.json` → app boots, sidebar shows the
   Facebook group, `/facebook-*` routes render.
3. Select a patient → `/facebook-import` → upload a Facebook export → resources land
   in host `ClinicalImpressions/Communications/Medias/Persons/CareTeams`, tagged to
   that patient; job progress updates live.
4. `/facebook-timeline` + `/facebook-dashboard` show the imported records;
   `/facebook-export` produces a Bundle/NDJSON.
5. Clinical NLP off by default (info Alert shown); enabling the settings flag and
   re-importing attaches SNOMED findings.
6. `/facebook-settings` → "Clear Facebook data" removes only Facebook-sourced
   resources for the patient.

## Out of scope

- The legacy `webapp/` (Blaze) app; standalone accounts/login.
- Actually folding `/facebook-import` into `/data-importer` or `/facebook-profile`
  into `/my-profile` (future).
- MCP rework of the clinical-NLP detector (future).
