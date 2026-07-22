# ONC Regulatory Update — Project Plan

Built from `HEALTHIT-REGULATORY-UPDATE-ANALYSIS.md` (the gap analysis of
https://healthit.gov/certification-health-it/onc-certification-criteria-health-it-regulatory-update-deadline/
against this repo). This file is the working project plan; the in-app grid at
`/reference-app` carries the same rows with `regStatus` chips.

The implementation loop itself is `RALPH-LOOP-OPUS.md` (**not started — do not
run without an explicit go**).

---

## Phase 0 — Artifacts (DONE by this work session)

- [x] Gap analysis written (`HEALTHIT-REGULATORY-UPDATE-ANALYSIS.md`)
- [x] Reference grid updated: + (g)(31), (g)(32), (g)(33), (j)(20), (j)(21) rows;
      `REGULATORY_UPDATES` deadline/status annotations; (a)(9) marked removed
- [x] 6 new BDD features in `certification/bdd/`:
      b-4, g-31, g-32, g-33, j-20, j-21
- [x] 16 new TDD tests in `certification/tdd/regulatory_updates/` (see below)
- [x] Ralph loop drafted (`RALPH-LOOP-OPUS.md`)

## Phase 1 — Verify Group A tests against a live server (NEXT; human/Opus)

The 11 Group A criteria are implemented; their new TDD tests must be **run**
before any status is asserted anywhere (per `/maintain-certification`: test
truth leads, docs follow). Expect selector/`data-testid` gaps on first run —
fix tests or add selectors, not by weakening assertions.

| Test | Criterion | Implementation surface |
|------|-----------|------------------------|
| `170.315.a.12.test.js` | Family health history | `npmPackages/family-health-history` → `/family-health-history` |
| `170.315.a.15.test.js` | SDOH | `npmPackages/social-determinants` → `/social-determinants` |
| `170.315.b.2.test.js` | Clinical info reconciliation | `/medication-management`, `imports/ui-fhir/medications*` |
| `170.315.b.3.test.js` | Electronic prescribing | `npmPackages/e-prescribing` → `/e-prescribing` |
| `170.315.b.9.test.js` | Care plan | `imports/ui-fhir/carePlans` → `/care-plan-designer` |
| `170.315.c.4.test.js` | CQM filter | `npmPackages/quality-measures` → `/quality-measures` |
| `170.315.f.1.test.js` | Immunization registries | `npmPackages/immunization-registry` |
| `170.315.f.3.test.js` | Reportable labs | `npmPackages/lab-test-reporting` |
| `170.315.f.4.test.js` | Cancer registries | `npmPackages/cancer-registry-reporting` |
| `170.315.f.5.test.js` | Electronic case reporting | `npmPackages/case-reporting` (transmission stubbed → expect GAP steps red) |
| `170.315.g.6.test.js` | C-CDA creation performance | `npmPackages/ccda-export` → `/ccda-export` |

## Phase 2 — Implement Group B via the Ralph loop (Opus; NOT STARTED)

Five criteria, ordered by dependency (CRD → DTR → PAS chain; j-20 unlocks CRD's
hook plumbing, so it goes first):

1. **(j)(20) CDS Hooks client** — extend `npmPackages/decision-support`:
   client-side patient-view / order-select / order-sign firing, real
   `/cds-services` discovery, card rendering + suggestion acceptance, audit.
2. **(g)(31) Da Vinci CRD** — new `npmPackages/prior-auth` (or extend
   decision-support): payer CRD service invocation on order-select/order-sign,
   coverage-information annotation, DTR launch link.
3. **(g)(32) Da Vinci DTR** — `$questionnaire-package` retrieval + CQL
   pre-population, reusing `npmPackages/structured-data-capture` rendering;
   QuestionnaireResponse persistence.
4. **(g)(33) Da Vinci PAS** — preauthorization Claim Bundle assembly,
   `Claim/$submit` + `$inquire`, disposition tracking work queue.
5. **(j)(21) Subscriptions client** — new `npmPackages/fhir-subscriptions`:
   Subscription create on external server, rest-hook receiver endpoint,
   handshake/heartbeat, id-only resolution, event-gap detection + `$status`.

Definition of done per criterion: its `regulatory_updates` TDD test passes with
zero `GAP(...)` failures, against a mock payer/server harness where the
counterparty is external (mock responders in-package, same pattern as
prescription-benefit's mock PBM).

## Phase 3 — Sync the certification artifacts (after tests go green)

Per `.claude/skills/maintain-certification` — for each status change update ALL of:
1. the test outcome (ground truth, from a real run)
2. `ReferenceAppPage.jsx` — flip `isImplemented`/`isV3`, add `testStatus`
3. `certification/care-commons-ehr-software-manual.tex` — `\maturitylabel` + Overview table
4. screenshots → `certification/screenshots/` for UI criteria
5. SBOM/license audit if dependencies changed
6. Rebuild PDF with tectonic and spot-check rendering

## Standing decisions

- (a)(9) is removed (2025-01-01): keep legacy artifacts, build nothing new on it.
- (b)(3)/(b)(11) 2027-12-31 updates are **maintenance items** on live packages
  (NCPDP SCRIPT version bump; predictive-DSI privacy/security attributes) —
  tracked here, not part of the Group B greenfield loop.
- (g)(10) conformance remains external (Inferno).
- New-criterion compliance deadlines: not yet published by ASTP/ONC — recheck
  the source page when HTI-4 timelines land and fill in `REGULATORY_UPDATES`.
