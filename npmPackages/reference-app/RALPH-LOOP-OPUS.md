# Ralph Loop — HTI-4 Regulatory-Update Criteria: TDD-to-green (Opus)

> **STATUS: DRAFTED, NOT STARTED. Do not run this loop without an explicit go
> from the maintainer.** Launch pattern (when authorized): feed this SAME file
> to Opus every iteration, e.g. via the repo's `/ralph-loop` plugin with this
> file as the prompt.

You are running inside a Ralph loop. This SAME instruction set is fed to you
every iteration. You have NO memory of prior iterations except what is on
disk: the repo, git state, and the **Progress ledger at the bottom of THIS
file**. Re-orient from those every iteration; continue prior work, never
restart from scratch.

## Mission

Drive the **Group B gap tests** in `certification/tdd/regulatory_updates/` to
green by **implementing the missing product capability** — the opposite
deliverable of the earlier baseehr-ralph (which wrote tests). Here the tests
already exist and are the spec:

- The BDD features in `certification/bdd/` (b-4, g-31, g-32, g-33, j-20, j-21)
  say WHAT the capability is.
- The TDD tests encode the CONTRACT (exact Meteor method names, endpoints,
  settings keys) in their header comments. **Implement to the contract; never
  edit a `GAP(...)` assertion to make a test pass.** Renaming a contract
  method requires updating test + BDD + this file in the same commit, with a
  ledger note saying why.

Also in scope, before the Group B builds: one verification pass over the
**Group A tests** (implemented capabilities) — run each, fix test-side issues
(selectors, timing, arg shapes) or record a real product gap in the ledger.
Group A failures are fixed by correcting the TEST unless the capability is
genuinely absent; Group B failures are fixed by building the FEATURE.

## Scope (work top to bottom; one item per iteration unless trivial)

| # | Item | Test | What "done" means |
|---|------|------|-------------------|
| 0 | Group A verification sweep | all 11 Group A tests in `certification/tdd/regulatory_updates/` | each run once against a live TDD server; result (green / test-fixed / real-gap) recorded in the ledger |
| 1 | (j)(20) CDS Hooks client | `170.315.j.20.test.js` | extend `npmPackages/decision-support`: `cdsHooks.client.discover` / `fire` / `getInvocations`, in-package mock CDS service, UI firing (chart open → patient-view; order composer → order-select; signing → order-sign), card rendering + suggestion acceptance, invocations persisted; workflow never blocks on service failure |
| 2 | (g)(31) Da Vinci CRD | `170.315.g.31.test.js` | new `npmPackages/prior-auth` (or extend decision-support — decide once, record in ledger): `priorAuth.crd.discover` / `invoke` / `getInvocations`, mock payer CRD service, coverage-information annotation persisted on draft orders, DTR launch link on cards |
| 3 | (g)(32) Da Vinci DTR | `170.315.g.32.test.js` | `priorAuth.dtr.questionnairePackage` / `populate`; reuse `structured-data-capture` rendering; pre-populated QuestionnaireResponse persisted, linked to order + coverage |
| 4 | (g)(33) Da Vinci PAS | `170.315.g.33.test.js` | `priorAuth.pas.submit` / `inquire`; preauthorization Claim Bundle assembly; mock payer with scripted approve/deny/pend dispositions; authorization number surfaced; pended work queue |
| 5 | (j)(21) Subscriptions client | `170.315.j.21.test.js` | new `npmPackages/fhir-subscriptions`: `fhirSubscriptions.create` / `list` / `getStatus`, `POST /fhir-subscriptions/rest-hook` WebApp handler (handshake/heartbeat/event Bundles), id-only resolution, event-gap detection, notification audit |
| 6 | Artifact sync | — | dashboard (`ReferenceAppPage.jsx`: flip `isImplemented`/`isV3`, `testStatus`), analysis + plan docs, `regulatory_updates/README.md` statuses — only AFTER real green runs (see `.claude/skills/maintain-certification`) |

Dependency order matters: j-20's hook plumbing is reused by g-31; g-31 cards
launch g-32; g-32's QuestionnaireResponse feeds g-33.

## Per-iteration protocol

1. Read the Progress ledger below. Pick the earliest non-done item.
2. Run its test against a live TDD server (launcher + env: manual Chapter 0
   `sec:cert-config`; ChromeDriver must match Chrome):
   `CHROMEDRIVER_PATH=... npx nightwatch --config nightwatch.circle.conf.js certification/tdd/regulatory_updates/<file>`
   New packages must be in `EXTRA_WORKFLOWS` (or `workflows/workflows.json`
   for `@node-on-fhir/*`) — remember the FULL meteor restart after adding one.
3. Implement the smallest slice that turns the next red assertion green.
4. Re-run the test. Commit working slices with factual messages
   (`feat(prior-auth): CRD discover + mock payer service — g.31 step 03 green`).
5. Update the Progress ledger (status + one-line note + date). STOP the
   iteration after updating the ledger.

## Repo conventions (do not reinvent)

- Meteor v3 async server methods, `function() {}` syntax, `check()` args,
  `Logger.for('<pkg>')` logging — see root `CLAUDE.md` + `.claude/rules/`.
- NPM workflow package shape: `client.js` / `server.js` / `workflow.json`,
  `serverEntry: "./server"` in workflow.json — see `npmPackages/CLAUDE.md`.
  Routes use `element:`, not `component:`.
- Mock-responder pattern to copy: `npmPackages/prescription-benefit` (mock PBM
  + `settings.private.*` live endpoint override). Certification evidence must
  work with no live payer.
- Never use `_id || id` OR-logic lookups; MongoDB `_id` is the lookup key.
- No hardcoded colors; theme tokens. No `window.location.href`.
- Da Vinci IG references: CRD https://build.fhir.org/ig/HL7/davinci-crd/,
  DTR https://build.fhir.org/ig/HL7/davinci-dtr/,
  PAS https://build.fhir.org/ig/HL7/davinci-pas/,
  backport subscriptions https://build.fhir.org/ig/HL7/fhir-subscriptions-backport-ig/.
- Related but separate: `fable/davinci-ralph/` (unstarted throwaway IG
  scaffolds under `extensions/davinci-*`). This loop is the certification
  path and takes precedence; borrow from those scaffolds only if they exist.

## Guardrails

- **Never weaken a test.** `GAP(...)` messages are the punch-list contract.
- Test truth leads, docs follow: no dashboard/manual/README status flips
  without a real green run in this loop's transcript.
- Secrets via `Meteor.settings.private.*` only; settings files gitignored.
- Sensitive-demographics gating and international posture apply to anything
  touching patient demographics (settings-gated, default off).
- Do not touch `certification/tdd/base_ehr/` or (g)(10)/Inferno scope.
- If genuinely blocked (missing infra, ambiguous IG requirement), record
  `blocked` + the question in the ledger and stop the iteration — do not
  improvise around a blocker.

---

## Progress ledger (the loop's only memory — update every iteration)

Statuses: `pending` → `in-progress` → `green` | `blocked(note)`. Group A rows
use `verified` / `test-fixed` / `real-gap(note)`.

| # | Item | Status | Last-touched | Notes |
|---|------|--------|--------------|-------|
| 0a | A-sweep a.12 | pending | — | |
| 0b | A-sweep a.15 | pending | — | |
| 0c | A-sweep b.2 | pending | — | |
| 0d | A-sweep b.3 | pending | — | |
| 0e | A-sweep b.9 | pending | — | |
| 0f | A-sweep c.4 | pending | — | |
| 0g | A-sweep f.1 | pending | — | |
| 0h | A-sweep f.3 | pending | — | |
| 0i | A-sweep f.4 | pending | — | |
| 0j | A-sweep f.5 | pending | — | expected conditional GAP: transmission simulated |
| 0k | A-sweep g.6 | pending | — | |
| 1 | (j)(20) CDS Hooks client | pending | — | |
| 2 | (g)(31) CRD | pending | — | |
| 3 | (g)(32) DTR | pending | — | |
| 4 | (g)(33) PAS | pending | — | |
| 5 | (j)(21) Subscriptions client | pending | — | |
| 6 | Artifact sync | pending | — | gated on greens above |
