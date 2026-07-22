# ONC Certification Criteria — Regulatory Update Gap Analysis

**Source:** https://healthit.gov/certification-health-it/onc-certification-criteria-health-it-regulatory-update-deadline/
(fetched 2026-07-17). The page enumerates every § 170.315 criterion touched by a
regulatory update, grouped by deadline. New criteria come from the **HTI-4 final
rule**; the page publishes no compliance dates for them yet (the (b)(4) 1/1/2028
and (b)(11) 12/31/2027 dates below come from the Base EHR definition timeline
already tracked in this repo).

**Companion documents:**
- `HEALTHIT-REGULATORY-UPDATE-PLAN.md` — the phased project plan built from this analysis
- `RALPH-LOOP-OPUS.md` — the (not yet started) implementation loop for Opus
- In-app grid: `client/ReferenceAppPage.jsx` (`/reference-app`) — carries the same
  criteria with `regStatus` / `deadline` annotations

---

## 1. The criteria on the page (24), reconciled against this repo

Legend — **Impl**: implementation exists in this repo (per 2026-07-17 codebase scan) ·
**BDD**: `certification/bdd/*.feature` exists · **TDD**: `certification/tdd/**/170.315.x.y.test.js` exists.

### 1a. Updated criteria — developer action required by **Dec 31, 2027**

| Cite | Name | Update type | Impl | Package / surface | BDD | TDD |
|------|------|-------------|------|-------------------|-----|-----|
| (b)(3) | Electronic prescribing | Standards update (NCPDP SCRIPT) + new dependency on (b)(4) | ✅ real (NCPDP SCRIPT logic, 565-LOC methods + ncpdp-script.js) | `npmPackages/e-prescribing` → `/e-prescribing` | ✅ | ❌ **→ write** |
| (b)(11) | Decision support interventions (DSI) | Privacy & security requirements for predictive DSI | ✅ real (PlanDefinition-driven DSI, server hooks, GuidanceResponse/DetectedIssue) | `npmPackages/decision-support` → `/decision-support` | ✅ | ✅ (base_ehr, green) |

### 1b. **New** criteria (HTI-4) — no deadline published on the page

| Cite | Name | Impl | What exists / what's missing | BDD | TDD |
|------|------|------|------------------------------|-----|-----|
| (b)(4) | Real-time prescription benefit | ✅ real (NCPDP RTPB responder logic, mock PBM + configurable live endpoint) | `npmPackages/prescription-benefit` → `/prescription-benefit`; already Base-EHR green | ❌ **→ write** | ✅ (base_ehr, green) |
| (g)(31) | Provider prior auth API — coverage requirements discovery (Da Vinci **CRD**) | ❌ not implemented | Only a stub `/cds-services` discovery endpoint (`server/CdsHooksEndpoints.js`, returns empty list) + proxy methods. No CRD client firing, no coverage-information handling | ❌ **→ write** | ❌ **→ write (gap test)** |
| (g)(32) | Provider prior auth API — documentation templates and rules (Da Vinci **DTR**) | ❌ not implemented | Generic SDC Questionnaire rendering exists (`npmPackages/structured-data-capture`) but no `$questionnaire-package`, no CQL pre-population | ❌ **→ write** | ❌ **→ write (gap test)** |
| (g)(33) | Provider prior auth API — prior authorization support (Da Vinci **PAS**) | ❌ not implemented | Claim/ClaimResponse schemas exist (`imports/lib/schemas/SimpleSchemas/Claims.js`) but no REST routes, no `Claim/$submit`/`$inquire` | ❌ **→ write** | ❌ **→ write (gap test)** |
| (j)(20) | Workflow triggers for DSI — clients (CDS Hooks **client**) | ⚠️ partial | Server-side DSI hook firing exists (`npmPackages/decision-support/server/hooks.js` — fires on ServiceRequest insert / ToC import). **Missing:** client-side patient-view / order-select / order-sign hook invocation from the UI, card rendering, suggestion acceptance | ❌ **→ write** | ❌ **→ write (gap test)** |
| (j)(21) | Subscriptions — client (FHIR R5-backport topic subscriptions) | ❌ not implemented | Only a Subscription schema skeleton (`imports/lib/schemas/SimpleSchemas/Subscriptions.js`); no REST ops, no rest-hook receiver, no SubscriptionTopic | ❌ **→ write** | ❌ **→ write (gap test)** |

### 1c. Updated criteria — deadline **passed Dec 31, 2025** (must be maintained at updated standard)

| Cite | Name | Update type | Impl | Package / surface | BDD | TDD |
|------|------|-------------|------|-------------------|-----|-----|
| (a)(5) | Patient demographics and observations | Min. std. code sets | ✅ (incl. CDCREC race/ethnicity, settings-gated) | `imports/ui-fhir/patients` + `imports/patient` | ✅ | ✅ (base_ehr, green) |
| (a)(12) | Family health history | Min. std. code sets | ✅ | `npmPackages/family-health-history` → `/family-health-history` | ✅ | ❌ **→ write** |
| (a)(15) | Social, psychological, behavioral data | Min. std. code sets | ✅ | `npmPackages/social-determinants` → `/social-determinants` | ✅ | ❌ **→ write** |
| (b)(1) | Transitions of care | Code sets + standards | ✅ (C-CDA outbound + inbound receiveCCDA) | pacio transitions-of-care → `/transitions-of-care` | ✅ | ✅ (base_ehr, green) |
| (b)(2) | Clinical information reconciliation | Standards updates | ✅ (UI-level: `imports/ui-fhir/medications*`, med-management) | `/medication-management` | ✅ | ❌ **→ write** |
| (b)(9) | Care plan | Standards updates | ✅ (EnhancedCarePlanDesigner) | `imports/ui-fhir/carePlans` → `/care-plan-designer` | ✅ | ❌ **→ write** |
| (c)(4) | CQM — filter | Min. std. code sets | ✅ (CQMFilterPanel, fqm-execution) | `npmPackages/quality-measures` → `/quality-measures` | ✅ | ❌ **→ write** |
| (e)(1) | View, download, transmit to 3rd party | Standards + functionality | ✅ | patient portal surfaces (secure-messaging patient route, ui-fhir) | ✅ | ✅ (base_ehr, green) |
| (f)(1) | Transmission to immunization registries | Min. std. code sets | ✅ | `npmPackages/immunization-registry` → `/immunization-registry` | ✅ | ❌ **→ write** |
| (f)(3) | Public health — reportable lab tests/results | Min. std. code sets | ✅ | `npmPackages/lab-test-reporting` → `/lab-test-reporting` | ✅ | ❌ **→ write** |
| (f)(4) | Transmission to cancer registries | Min. std. code sets | ✅ | `npmPackages/cancer-registry-reporting` → `/cancer-registry-reporting` | ✅ | ❌ **→ write** |
| (f)(5) | Public health — electronic case reporting | Standards updates | ⚠️ framework (eICR Composition generation; transmission stubbed) | `npmPackages/case-reporting` → `/case-reporting` | ✅ | ❌ **→ write** |
| (g)(6) | Consolidated CDA creation performance | Standards updates | ✅ | `npmPackages/ccda-export` → `/ccda-export` | ✅ | ❌ **→ write** |
| (g)(9) | Application access — all data request | Standards updates | ✅ | smart-on-fhir + REST server | ✅ | ✅ (base_ehr, green) |
| (g)(10) | Standardized API (patient & population) | Standards updates | ✅ | FHIR REST server + SMART 2.x | ✅ | ✅ smoke (authoritative validation external — Inferno) |

### 1d. Removed criterion

| Cite | Name | Removal date | Repo posture |
|------|------|--------------|--------------|
| (a)(9) | Clinical decision support | Jan 1, 2025 (superseded by (b)(11)) | Implementation + BDD + TDD retained as legacy; grid row now annotated `removed`. No new work — do **not** build against (a)(9) |

---

## 2. Differentials (the actionable deltas)

### 2a. BDD scripts needed → `certification/bdd/`

Six features, all HTI-4-new criteria (every other page criterion already has a feature file):

1. `170.315-b-4-real-time-prescription-benefit.feature`
2. `170.315-g-31-prior-auth-coverage-requirements-discovery.feature`
3. `170.315-g-32-prior-auth-documentation-templates-rules.feature`
4. `170.315-g-33-prior-auth-support.feature`
5. `170.315-j-20-workflow-triggers-dsi-clients.feature`
6. `170.315-j-21-subscriptions-client.feature`

### 2b. TDD tests needed → `certification/tdd/`

Sixteen criteria from the page have **no** Nightwatch test anywhere under
`certification/tdd/` (base_ehr covers a.1–a.5, a.9, a.14, b.1, b.4, b.11, c.1,
e.1, g.7, g.9, g.10-smoke, h.1). New tests live in
`certification/tdd/regulatory_updates/`:

**Group A — implemented, tests should verify behavior (expected mostly green):**
a.12, a.15, b.2, b.3, b.9, c.4, f.1, f.3, f.4, f.5, g.6

**Group B — unimplemented/partial, tests are documented-gap punch lists
(expected red until Opus implements; `GAP(170.315.x.y): ...` failure messages):**
g.31, g.32, g.33, j.20, j.21

### 2c. Explicitly NOT in scope

- (g)(10) full conformance — external (Inferno), smoke test already exists.
- Criteria not on the page (a)(1)–(a)(4), (a)(14), (b)(10), (d)(*), (e)(2)/(3),
  (f)(2)/(6)/(7), (g)(1)–(g)(5), (g)(7)/(8), (h)(*) — unchanged by this
  regulatory update cycle; existing coverage stands.

---

## 3. Honesty guardrails (per `/maintain-certification`)

- Test truth leads, docs follow: none of the new TDD tests may be reported green
  until actually run against a live TDD server.
- The Group B tests are **intentionally red** — they are the certification
  punch-list Opus implements against. Do not soften a `GAP(...)` assertion to
  make a test pass without the underlying capability.
- The base_ehr statuses quoted above (green/gap/external) are the ones already
  recorded in `BASE_EHR_TEST_STATUS` (ReferenceAppPage.jsx) from real CY2026
  runs; this document does not re-assert them.
