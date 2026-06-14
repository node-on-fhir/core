# CLAUDE.md — @node-on-fhir/quality-measures

Migrated from Atmosphere `clinical:quality-measures` (2026-06-14, MIT). Clinical Quality Measures (ONC §170.315(c)(1-4)) + **PACIO** I-CARE and CMS1317v1 Advance Care Planning measure evaluation. Single route `/quality-measures` (`QualityMeasuresPage`, `requireAuth`). **Connectathon-relevant** — PACIO July 2026 (see [[pacio-connectathon-july-2026]]).

**Not actually gated.** package.js `Package.onTest` `api.use('clinical:quality-measures')` is a **self-reference** (the package's own name), test-only — false gate (fifth in the streak: consent-generator / vital-signs / accounts-management / ccda-export / quality-measures). Real onUse deps all app infra (`react-meteor-data`, `mongo`, `session`, `clinical:extended-api@3.0.0`, `clinical:hl7-resource-datatypes`) — present.

**One external dep:** `fqm-execution@^1.8.5` (FHIR Quality Measure engine), already a root dependency — declared in this package's `dependencies`. No `Npm.depends`.

**Structure:** `client/QualityMeasuresPage.jsx` (+ children); `lib/{pacio-measures,toc-sections,collections}.js` (isomorphic — were `addFiles ['client','server']`; `collections.js` ES-exports `QualityMeasureFilterSets`, no host-app collision); `server/evaluators/{pacio-data-connector,icare-evaluator,adi-acp-evaluator}.js`, `server/{measure-calculator,fqm-engine,measure-bundle-methods,methods,startup}.js`. **`specs/cms1317/`** assets ship with the package — `startup.js` imports ValueSet JSON from `specs/cms1317/valuesets/*.json` (Rspack resolves JSON imports); `.cql`/`.html` are reference assets. `guides/` is docs (not imported, not copied).

server/index.js loads the lib files then the server pipeline in package.js addFiles order. client.js preserves the full index.jsx (ClinicianWorkflows / FooterButtons / ModuleConfig / settings gates) + imports `lib/collections.js` for client Minimongo parity. Fixed legacy `iconName: 'assessment'` → `'Assessment'`. No old-MUI, no Atmosphere-isms, no `meteor/http`. No Package-registry symbols → `Package['@node-on-fhir/quality-measures'] = {}` (harmless). Monorepo-tracked → fresh git init (nested repo).
