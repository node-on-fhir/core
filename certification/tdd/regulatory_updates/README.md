# certification/tdd/regulatory_updates/

Nightwatch behavioral tests for the § 170.315 criteria touched by the ONC
regulatory-update cycle (HTI-4 and the 2025/2027 developer-action deadlines)
that had **no test under `certification/tdd/`**. Derived from the gap analysis
in `npmPackages/reference-app/HEALTHIT-REGULATORY-UPDATE-ANALYSIS.md`; BDD
sources live in `certification/bdd/`.

Base EHR criteria remain in `../base_ehr/` — nothing here duplicates that
suite. Several packages also carry package-level tests
(`npmPackages/*/tests/nightwatch/170.315.*.test.js`); these certification-level
tests are the canonical ONC evidence path.

## Two groups — read this before "fixing" a red test

**Group A — implemented capability, tests verify behavior (expect green):**

| Test | Criterion |
|------|-----------|
| `170.315.a.12.test.js` | Family health history |
| `170.315.a.15.test.js` | SDOH data |
| `170.315.b.2.test.js`  | Clinical information reconciliation |
| `170.315.b.3.test.js`  | Electronic prescribing (2027 standards update tracked separately) |
| `170.315.b.9.test.js`  | Care plan |
| `170.315.c.4.test.js`  | CQM filter |
| `170.315.f.1.test.js`  | Immunization registries |
| `170.315.f.3.test.js`  | Reportable laboratory results |
| `170.315.f.4.test.js`  | Cancer registries |
| `170.315.f.5.test.js`  | Electronic case reporting (+ conditional transmission GAP) |
| `170.315.g.6.test.js`  | C-CDA creation performance |

**Group B — HTI-4 new criteria, GAP punch-lists (expect red until built):**

| Test | Criterion | Implementation contract encoded in the test |
|------|-----------|---------------------------------------------|
| `170.315.g.31.test.js` | Da Vinci CRD client | `priorAuth.crd.discover / invoke / getInvocations` |
| `170.315.g.32.test.js` | Da Vinci DTR client | `priorAuth.dtr.questionnairePackage / populate` |
| `170.315.g.33.test.js` | Da Vinci PAS client | `priorAuth.pas.submit / inquire` |
| `170.315.j.20.test.js` | CDS Hooks client triggers | `cdsHooks.client.discover / fire / getInvocations` |
| `170.315.j.21.test.js` | Subscriptions client | `fhirSubscriptions.create / list / getStatus` + `POST /fhir-subscriptions/rest-hook` |

Group B failures use `browser.verify.fail('GAP(170.315.x.y): ...')` — they are
the certification punch-list. The ONLY legitimate way to make one green is to
implement the capability named in the message (see `RALPH-LOOP-OPUS.md` in
`npmPackages/reference-app/`). Do not soften assertions.

## Running

Same launcher/env as the base_ehr suite (manual Chapter 0, `sec:cert-config`):

```bash
CHROMEDRIVER_PATH=/path/to/chromedriver \
  npx nightwatch --config nightwatch.circle.conf.js \
  certification/tdd/regulatory_updates/170.315.<x>.<y>.test.js
```

Login assumes the TDD server's `demouser` / `password2025` (DEV_AUTO_LOGIN
compatible), matching `../base_ehr/` conventions.

## Status honesty

No test in this directory has a recorded green run yet (created 2026-07-19,
not yet executed against a live TDD server). Per
`.claude/skills/maintain-certification`: run first, then update the dashboard
(`ReferenceAppPage.jsx`), the manual, and this README — in that order.
