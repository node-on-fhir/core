# July Next Five Moves

> Action checklist from the 2026-07-23 architectural assessment (post
> feat/json-rpc merge). Ranked by risk-reduction per hour. Companion context:
> `fable/OPUS_NOF_ARCHITECTURE_ASSESSMENT.md` (2026-07-01 baseline),
> `fable/FABLE-TECH-DEBT-PAYDOWN.md` (June paydown ledger).
>
> **Status 2026-07-24**: moves 1–4 are DONE (verified against main at
> `2815170a`). The codebase has crossed from "convention-enforced" to
> "construction-enforced" on the high-risk surfaces: the endpoint layer is
> CI-gated, the auth holes are closed, and the safety nets fail the build.
> What remains is move 5 (the client-layer structural refactor — now the
> ranked #1) and the move-4 residuals.

---

## 1. ~~Gate the endpoint layer in CI~~ ✅ DONE 2026-07-23

- [x] Curl-based smoke battery against a booted server:
      `scripts/endpoint-smoke-test.sh` covers `/api/rpc` (rpc.discover +
      authed method), `/baseR4/metadata`, and the OAuth bad-credential
      rejection path (commit `23790f01`)
- [x] Wired into `.circleci/config.yml` — runs in the parallel-tests workflow
      and in the dedicated RPC job
- [x] Bonus: full OpenRPC-driven conformance sweep + method suites in
      `tests/rpc/` with a ratchet baseline (`7c1fc913`); all 22 sweep
      internal errors burned down to an empty baseline (`c31496f8`)
- Issue #171 (meteortesting:mocha under rspack) was routed around, not fixed —
  the mocha suites in `tests/mocha/` still run 0 tests, but the endpoint layer
  no longer depends on them for coverage.

## 2. ~~Close the two auth-surface holes~~ ✅ DONE 2026-07-23

- [x] `test.*` methods gated behind
      `Meteor.isDevelopment || process.env.ENABLE_TEST_METHODS === 'true'`
      (`server/main.js:665`, commit `b558ad58`) — production builds log that
      the methods were NOT registered
- [x] The fossil `jwt.decode()` block on the SMART session-token path was
      **deleted** rather than upgraded (`server/lib/FhirAuth.js:339` comment
      documents why — no signing key existed for that path; commit `43996554`)

## 3. ~~Wire the existing safety nets into CI~~ ✅ DONE 2026-07-23

All landed in `bf6a12c4` ("plug in the safety nets"):

- [x] `scripts/audit-global-collections.js` → `npm run audit:collections` in CI
- [x] `imports/lib/WorkflowRegistry.test.mjs` → `npm run test:workflow-registry`
      CI step
- [x] Workflow parser unit test written: `workflows/rspack.workflowParser.test.mjs`
- [x] gitleaks secret-scanning job (dedicated container, `.gitleaks.toml`
      allowlist) on every pipeline; committed UMLS key removed and triaged
      (`e2e29510`)

## 4. ~~Land feat/json-rpc to main~~ ✅ DONE 2026-07-23

Merged (378 commits). Open residuals that ride on it:

- [ ] Sweep remaining raw `Meteor.methods` registrations toward ServerMethods
      (~40 files across `server/`, `imports/`, and package server entries by
      current grep; the original "16" counted `server/` + `imports/api/` only)
- [ ] RPC pipeline residuals: in-memory per-process rate limiting (no-op on
      multi-instance Galaxy, buckets never evicted → slow leak under IP churn);
      `invoke()` bypasses rate limiting and defaults to null identity
      (role-gated methods can't be orchestrated server-to-server); schema
      validation is opt-in per method

## 5. ResourceTable / GenericFhirDetail structural work — **now the #1 move**

The highest-leverage remaining refactor: ~269 copy-paste files
(70 Page / 69 Table / 68 Detail / 62 Preview) in `imports/ui-fhir/`.
Plan already written: `docs/superpowers/plans/2026-07-01-dynamicfhir-enhancement.md`.
The RPC campaign proved the loop-based migration playbook at exactly this scale.

- [ ] Task 1: `GenericFhirDetail` fallback component
- [ ] Task 2: generated component manifest
      (`scripts/generate-fhir-component-manifest.js`)
- [ ] Task 3: `imports/ui-fields/` primitives (1 of 7 built — ReferenceRange)
- [ ] Task 4: `ResourceTable` shell + `Column` + `columnPreferences`
- [ ] While touching files: fix the 26 `Session.get`-in-dep-array offenders
      (list in the 2026-07-04 status note; e.g. `conditions/ConditionsPage.jsx:134`,
      `encounters/EncountersPage.jsx:123`, `procedures/ProceduresPage.jsx:136`)

---

## Parking lot (real, but below the fold)

- Split `server/FhirEndpoints.js` (3,081 lines) / `server/OAuthEndpoints.js`
  (2,433) — includes de-duplicating the shadowed route registrations
  (two `_history/:versionId` GETs, two PATCH, two DELETE). The smoke battery
  now guards the behavior, but the structural split remains.
- Retire `deprecated/` (56 dead Atmosphere packages, 6,519 tracked files, 1.6 GB)
- Delete `imports/components/*\ copy.jsx` (3 stray files)
- Fix stale `--extra-packages 'clinical:pacio-core, clinical:us-core'` in npm
  scripts (`medical-home`, `base-ehr`, `medical-home-autologin`)
- E2E: convert `pause()`-driven timing to explicit waits (patients suite:
  38 pauses vs 23 waits)
- Package data bloat: quality-measures 163 MB, synthea 112 MB, pacio-core
  109 MB inside the repo
- Gradual typing (`checkJs`/JSDoc; TS types from R4B JSON Schemas) — still
  unstarted from the 2026-07-01 recommendations
- Fix issue #171 properly (meteortesting:mocha runs 0 tests under rspack) or
  retire the `tests/mocha/` suites in favor of the `tests/rpc/` harness
