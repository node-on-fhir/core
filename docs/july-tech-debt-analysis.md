# July Tech-Debt Analysis

> Snapshot of remaining technical debt from the 2026-07-23 architectural
> assessment, taken immediately after the feat/json-rpc merge to main.
> This is the *analysis* record — what the debt is, where it lives, and why it
> matters. The ranked action checklist lives in
> [july-next-five-moves.md](july-next-five-moves.md). Baselines:
> `fable/OPUS_NOF_ARCHITECTURE_ASSESSMENT.md` (2026-07-01) and
> `fable/FABLE-TECH-DEBT-PAYDOWN.md` (June ledger, largely completed).
>
> Context: the June–July refactorings genuinely landed — Atmosphere migration
> complete, ServerMethods pipeline shipped and hardened (167 files), structured
> logging + PHI redaction shipped, build reproducibility CI-gated. What follows
> is what those campaigns did *not* reach.
>
> **Update 2026-07-24**: checklist moves 1–3 have since landed (endpoint smoke
> battery + RPC conformance sweep in CI, `test.*` methods gated, fossil
> `jwt.decode` path deleted, contract audit / registry tests / parser tests /
> gitleaks all failing the build now). §4's "endpoint layer runs 0 automated
> tests" and §5's "built but unplugged" are therefore RESOLVED as written;
> §1 (client layer), §2 (server monoliths), §3 (RPC residuals), and §6–7
> remain accurate. This snapshot is kept as the analysis record — current
> status lives in [july-next-five-moves.md](july-next-five-moves.md).

---

## 1. Client/component layer — the un-refactored half

The July 1 component review's cheap wins all landed (dead router deleted,
ErrorBoundary at route seams, CustomThemeProvider extracted from App.jsx, the
ObservationsPage exemplar). The structural work did not.

### 1a. Copy-paste resource UIs (C-5) — untouched, the big one

**70 Page / 69 Table / 68 Detail / 62 Preview files (~269 total)** in
`imports/ui-fhir/`, near-identical triplets per FHIR resource. The DynamicFhir
dispatch registries exist (`imports/lib/DynamicFhirDetail.js`,
`DynamicFhirViews.js`, 62 registered detail + preview components each), but the
`docs/superpowers/plans/2026-07-01-dynamicfhir-enhancement.md` plan is unbuilt:

| Planned piece | Status |
|---|---|
| Task 1 — `GenericFhirDetail` fallback | not built |
| Task 2 — generated component manifest | not built (registries hand-maintained) |
| Task 3 — `imports/ui-fields/` primitives | 1 of 7 built (`ReferenceRange.jsx`) |
| Task 4 — `ResourceTable` shell + `Column` + `columnPreferences` | not built |

**Why it matters**: one table-behavior fix = 69 forks. This is the highest-
leverage remaining refactor, and the RPC call-site campaign proved the
loop-based playbook at exactly this scale (498 sites).

### 1b. `Session.get` in useTracker dep arrays — 26 live correctness bugs

The exact 26-file list from the 2026-07-04 status note remains unremediated
(e.g. `imports/ui-fhir/conditions/ConditionsPage.jsx:134`,
`encounters/EncountersPage.jsx:123`, `procedures/ProceduresPage.jsx:136`,
`allergyIntolerances/AllergyIntolerancesPage.jsx:192`). This is a stale-
subscription-on-patient-switch bug class, not a style issue. ObservationsPage
is the fixed exemplar to copy.

### 1c. God components — persist, one grew

- `imports/ui/GettingStartedPage.jsx` — **6,113 lines** (grew from 6,107)
- `imports/ui-vault-server/ServerConfigurationPage.jsx` — 2,427 (grew from 2,196)
- `imports/ui/App.jsx` — ~1,964 (the only one that shrank, via
  CustomThemeProvider extraction)
- `imports/patient/PatientSidebar.jsx` — 1,743; `imports/patient/AutoDashboard.jsx` — 1,695

### 1d. Session-as-store, code splitting, memoization — flat

- ~2,389 `Session.get/set` calls across `.jsx` (essentially unchanged);
  `imports/lib/SessionKeys.js` imported in only 5 files. Contract is advisory —
  no lint rule forbids raw string keys.
- `React.lazy`: 4 call sites in a ~194K-LOC JSX tree; every FHIR page eagerly
  imported. No route-level splitting.
- Memoization: 19 `useMemo` / 26 `useCallback` / 2 `React.memo` across
  `imports/` — negligible.

---

## 2. Server monoliths

`server/FhirEndpoints.js` (**3,081 lines**) and `server/OAuthEndpoints.js`
(**2,433 lines**) remain single files on raw `WebApp.handlers`:

- Auth preamble (`parseUserAuthorization` → `isAuthorized` →
  `isResourceScopeAuthorized`) copy-pasted inline across ~10 handlers rather
  than factored into middleware.
- **Duplicate route registrations** — two `_history/:versionId` GETs
  (FhirEndpoints.js:537, :580), two PATCH (:2076, :2177), two DELETE (:2188,
  :2232). Shadowed handlers: ambiguous which one actually serves a request.
- Error handling ad-hoc per handler (manual OperationOutcome construction),
  not centralized.

The ServerMethods pipeline is the proven recipe for splitting these; they are
the obvious next patients.

---

## 3. RPC pipeline residuals (small but real)

The pipeline itself is the strongest part of the server (~950 LOC total,
correct auth→authorize→validate→rate-limit→audit→dispatch ordering, alias
hardening landed). Remaining gaps:

- **Rate limiting is in-memory and per-process** (`imports/lib/ServerMethods.js`
  rateBuckets) — a no-op across multi-instance Galaxy deploys, and buckets are
  never evicted → slow memory leak under IP churn.
- **Schema validation is opt-in** — AJV fires only when a method declares
  `schema`/`schemaObject`; unschema'd methods receive unvalidated params. No
  `check()` anywhere in the RPC path.
- **`invoke()` (server→server) bypasses rate limiting and defaults to null
  identity** — role-gated methods silently can't be orchestrated in-process
  without explicit context.
- **`rpc.discover` is public by design** — 440 methods + schemas enumerable
  anonymously. Defensible, but an information-disclosure surface to revisit.
- 16 files still register via raw `Meteor.methods` outside the pipeline —
  including the unauthenticated `test.*` methods in `server/main.js:659-708`
  (tracked as move #2 in the checklist).

---

## 4. Testing posture — inverted by strategy, not by neglect

> Framing corrected 2026-07-24 (originally "the shape is the debt" — wrong).

The **61 Nightwatch E2E files** (48 CRUD resource suites) on a thin **~34-file**
`node --test` unit base is a deliberate rewrite-era posture, and it worked:
the behavioral E2E bank carried the codebase intact through three architectural
rewrites (Meteor v2→v3 async, Atmosphere→NPM workflows, DDP→JSON-RPC) that
would have obsoleted any implementation-coupled unit-test base. The Inferno
(g)(10) suite is the second independent anchor — a third-party integration
harness testing the FHIR/SMART surface against the spec. Two points on the
wall at all times; both attached to behavior contracts that survive interior
rewrites. (The one test-breakage class during the RPC migration — the
`callAsync` monkeypatch pattern — was tests coupling to transport internals,
i.e. the exception proving the behavioral rule.)

The correct sequencing is also already underway: fast deterministic tests are
being backfilled exactly where the architecture has **stabilized** — the
OpenRPC conformance sweep + method suites (`tests/rpc/`), the workflow-parser
test, the `test:lib` tier. Writing those before the surfaces settled would
have been waste.

The residual debt lives *inside* the E2E layer, orthogonal to its size:

- **`pause()`-driven E2E timing**: patients suite has 38 `pause()` vs 23
  explicit waits; observations 27 vs 18. The dominant flake source and
  wall-clock cost — and the CI feedback loop is as slow as its slowest anchor.
- **Keep the bank behavioral**: tests that reach into transport/implementation
  (the monkeypatch class) forfeit the rewrite-survival property; the latent
  `substances` instance is still uncorrected (not in CI).
- ~~Endpoint layer runs 0 automated tests~~ — RESOLVED (smoke battery +
  conformance sweep in CI; see header note). `tests/mocha/` still runs 0 tests
  under rspack (issue #171) and should be fixed or retired.
- Certification artifacts (`certification/`) are primarily a manual evidence
  binder (63 Gherkin features, PDFs, Inferno reports); executable cert tests
  live in `npmPackages/*/tests/nightwatch/` and are partial.
- As further surfaces stabilize post-refactor (next: the ResourceTable /
  GenericFhirDetail shell), backfill fast tests there in the same pattern.

---

## 5. Enforcement gaps — built but unplugged

The recurring theme (same as the 2026-07-01 review's organizing insight —
consistency by convention, not construction):

- `scripts/audit-global-collections.js` exits 1 on contract drift — **not in CI**.
- `imports/lib/WorkflowRegistry.test.mjs` exists — **not in CI**.
- `workflows/rspack.workflowParser.js` (674 load-bearing lines, the spine of
  the plugin system) — **zero tests**; also `generate()` runs twice per build
  (config top-level + beforeCompile hook).
- **No secret-scanning gate** (gitleaks/trufflehog) despite the July 1 audit
  finding force-committed secrets. CodeQL covers SAST only.
- Gradual typing (`checkJs`/JSDoc, TS types generated from the R4B JSON
  Schemas) — unstarted.

---

## 6. Repo and package hygiene

- `deprecated/` — 56 dead Atmosphere packages, **6,519 tracked files, 1.6 GB**
  of repo weight.
- Three stray `* copy.jsx` files in `imports/components/`
  (SearchCodeSystemDialog, SearchResourceTypesDialog, SearchValueSetsDialog).
- Stale npm scripts: `medical-home`, `base-ehr`, `medical-home-autologin` still
  pass `--extra-packages 'clinical:pacio-core, clinical:us-core'` — Atmosphere
  references to now-migrated packages.
- Package data bloat inside the repo: quality-measures **163 MB**, synthea
  **112 MB**, pacio-core **109 MB**, immunization-registry **87 MB** (bundled
  terminology/sample data).
- Dual-mechanism residue: WorkflowRegistry singleton fields duplicated in the
  components map; serverEntry declarable in both manifest and package
  workflow.json (precedence resolves it, but two sources of truth);
  provider-directory registers routes dynamically in client.js while the
  manifest idiom is declarative; `example-workflow` referenced by docs/skills
  as the template but absent from `npmPackages/`.
- `libraries/dcmjs` submodule points at a personal fork
  (`awatson1978/dcmjs#development`) — bus-factor/supply-chain note.

---

## 7. Partial ships from the July 1 spec wave

| Spec | Landed | Remaining |
|---|---|---|
| ServerMethods / JSON-RPC | pipeline + 498 call sites + hardening | residuals in §3 |
| Structured logging + PHI redaction | Logger facade, sinks, PHI-safe passes | `[Module]` adoption still uneven in older files |
| HIPAA audit trail | AuditEvent writes on the non-patient FHIR read path (fire-and-forget) | not systematic across all reads; EventBus tamper-chain design unbuilt |
| SimpleSchema → JSON Schema | `createFhirCollection`, OAuthClients enforced | bulk of collections unmigrated; validation not attached to most writes |
| Security remediation (core + MCP) | CORS harmonization, PHI-safe logging, CodeQL ReDoS fixes, dual-acceptance RPC auth | `test.*` methods, `jwt.decode` path, secret-scanning gate, fail-closed config assertions |

---

## Reading this in six months

If the checklist's moves 1–3 are done and this document's §1a (ResourceTable /
GenericFhirDetail) is underway, the codebase will have crossed from
"convention-enforced" to "construction-enforced" on every high-risk surface.
The rest of this file is normal engineering.
