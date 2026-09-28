# PHR Advanced Algorithms — Incorporation Plan

> Source: algorithms researched for the Personal Health Records IG, removed from
> the guide as Mongo-specific. This doc maps each algorithm to what honeycomb
> already has, and plans the incorporation of the rest. Drafted 2026-09-21.

## Status (2026-09-21)

**DONE — Phase 1 (all) + Phase 2a**, unit-tested (68 tests, all in the
lib-unit-tests CI job):

- 1a `patient-matching/lib/resourceSimilarity.js` + `lib/constants/similarityProfiles.js`
  (`npm run test:resource-similarity`) — wired into the dedup engine as
  `dedup.analyze { fuzzy: true }` → report-only `fuzzyCandidates`.
- 1b `patient-matching/lib/normalizeIdentifier.js`
  (`npm run test:identifier-normalization`) — opt-in via
  `identifierKey(resource, { normalize: true })` / `dedup.analyze { normalizeIdentifiers: true }`.
- 1c `imports/lib/trendDetection.js` (`npm run test:trend-detection`) — consumed
  by `TrendBadge.jsx` in `BiomarkerTrendline.jsx` + `ObservationTrendInstrument.jsx`.
- 2a `quality-measures/lib/screeningGuidelines.js`
  (`npm run test:screening-guidelines`) + `qualityMeasures.findCareGaps` method
  + `CareGapsPanel` on the /quality-measures Dashboard tab.
  ⚠️ Server method + panel need a runtime verify (boot + select patient) —
  unit tests cover the lib, not the Meteor wiring.

**REMAINING**: 2b (reminders), 2c (medication supply monitor), 3a (QC
pipeline + UCUM), 3b (LLM summarization completion).

## Ground rules for incorporation

- **Pure math lives in package `lib/`** (the `Deduplicator.js` precedent):
  isomorphic, no Meteor imports, unit-testable with `node --test`.
- **DB orchestration lives in `imports/api/<feature>/`** (the `imports/api/dedup/`
  precedent): Meteor v3 async, `Meteor.ServerMethods.define` (not plain
  `Meteor.methods`), settings-gated where destructive or automated.
- The IG's raw `db.collection(...)` / `$lookup` snippets get rewritten against
  Meteor collections (`findOneAsync`, `fetchAsync`); use `rawCollection()`
  aggregation only where genuinely needed.
- Cron features ride SyncedCron behind `settings.private.enableCronAutomation`
  plus a per-feature gate (the dedup-cron pattern).
- LLM features are **local-first** (WebLLM / on-device), BYOK cloud keys as
  fallback — matches the existing `narrativeEngine.js` architecture and the
  HIPAA/cost posture.

## Algorithm-by-algorithm status

| # | IG Algorithm | Existing home | Verdict |
|---|--------------|---------------|---------|
| 1 | Quality Control Checks (8-step pipeline) | pieces across dedup engine, referencePaths, VSAC | **Composite — build orchestrator over existing checks** |
| 2 | Normalize Patient Identifiers | `patient-matching/lib/Deduplicator.js` `identifierKey()` (grouping only, case-sensitive, no canonicalization) | **Extend patient-matching** |
| 3 | Longitudinal Chronology | `extensions/timelines/client/timelineHelpers.js` `getResourceDate()` — 15+ resource types mapped; Chronicle workstation | **Shipped — promote helper to shared lib** |
| 4 | Reminders | SyncedCron + `imports/lib/notify.js` + Task/Appointment schemas; no reminder logic | **Build thin feature on existing infra** |
| 5 | Summarize Document | `international-patient-summary/client/lib/narrativeEngine.js` — WebLLM path LIVE; BYOK/Ollama/Azure are RPC stubs; text.div persistence unverified | **Finish existing feature** |
| 6 | Gaps in Care | `npmPackages/quality-measures` — full CQL/eCQM engine, but no screening-interval guideline table | **Add lightweight guideline path to quality-measures** |
| 7 | Smart Agents (SCUBA) | `extensions/life-support-systems/lib/{consumptionRates,calculations}.js` — daysRemaining, alert levels, depletion projection, all shipped (for spacecraft) | **Extract math → apply to medication supply** |
| 8 | Record Deduplication (weighted similarity, θ thresholds) | `imports/api/dedup/` + `patient-matching` — patients probabilistic, non-Patient **deterministic only** (identifier/fingerprint); no per-resource-type date-tolerance fuzzy scoring | **Extend Deduplicator with fuzzy mode** |
| 9 | Trend Detection (regression, R², p-value) | `imports/ui-modules/BiomarkerTrendline.jsx`, `TrendChart.jsx` — charting only, zero statistics | **New pure lib + wire into charts** |
| 10 | Medication Interaction Checker | `npmPackages/drug-interactions` (ONC 170.315(a)(4)) + order-catalog RxNav integration | **Shipped — verify severity ranking only** |

## Phase 1 — Pure-lib extensions (no schema/infra changes)

### 1a. Fuzzy resource similarity in patient-matching
Add `lib/resourceSimilarity.js` to `npmPackages/patient-matching`:
- `similarity(r1, r2, profile)` = w₁·code + w₂·temporalProximity + w₃·value + w₄·context
- Ship the IG's per-resource-type profile table as data
  (`lib/constants/similarityProfiles.js`): Condition ±30d θ=0.85,
  MedicationStatement ±7d θ=0.90, Observation-vitals ±1h θ=0.95,
  Observation-labs ±1d θ=0.90.
- Consume from `imports/api/dedup/engine.js` as an **opt-in analyze mode**
  (`options.fuzzy: true`) that emits *candidate* findings only — fuzzy matches
  are surfaced in DedupFindings for review, never auto-reconciled (same safety
  posture as probabilistic patient clusters).
- Tests alongside `test:dedup-engine` (esbuild-bundled tier — needs node_modules).

### 1b. Identifier normalization primitive
Add `normalizeIdentifier(value, options)` to `patient-matching/lib` per the IG
steps: input validation → case fold → whitespace strip → separator/punctuation
removal → rule table (system-specific formats) → length/format validation.
- Wire into `identifierKey()` behind an option so existing fingerprints don't
  shift silently (fingerprint changes would break stored DedupFindings).
- Reuse in the dedup engine and importers (`data-importer`) at ingest time.

### 1c. Trend-detection lib
New `imports/lib/trendDetection.js` (camelCase — function module), pure JS:
- least-squares slope/intercept, R², t-stat → p-value (small t-CDF approx),
  3σ outlier pre-filter, windowing — straight from the IG pseudocode.
- Clinical-threshold table as data (weight >2 kg/wk, SBP >10 mmHg/mo, etc.).
- Unit tests in `tests/unit/imports/lib/` (dependency-free → lib-unit-tests job).
- Consumers: `BiomarkerTrendline.jsx` / `TrendChart.jsx` add a trend annotation
  (direction arrow + "significant" badge) when `significant === true`.

## Phase 2 — Thin features on existing infrastructure

### 2a. Care-gap guideline table (quality-measures)
The CQL engine is overkill for "colonoscopy every 10 years." Add the IG's
guideline-table approach as a *sibling* to eCQM:
- `quality-measures/lib/screeningGuidelines.js` — data table (appliesTo
  predicate, SNOMED/LOINC/CVX codes, interval) seeded from the IG examples.
- Server method `qualityMeasures.findCareGaps({ patientId })` scanning
  Procedures/Immunizations/Observations for last occurrence vs interval,
  returning `{ guideline, status: never_performed|overdue, daysOverdue, priority }`.
- UI: a "Preventive Care Gaps" card on the quality-measures page (and/or
  PatientChartPage slot).
- Later: express the same gaps as FHIR DetectedIssue or MeasureReport if the IG
  wants conformance language.

### 2b. Reminders
All infrastructure exists; the feature doesn't:
- Reminder = FHIR Task (`restriction.period`/`executionPeriod` for trigger time,
  `code` for reminder type); recurring via Timing on `Task.input` or a small
  extension.
- SyncedCron job (`imports/api/reminders/cron.js`, gated by
  `settings.private.reminders.enableCron` + global cron gates) sweeps due Tasks
  and dispatches.
- Dispatch channel v1 = in-app `notify()` + a reminders inbox page; email/push
  are explicitly out of scope until a channel provider exists.
- Feed 2a into this: care-gap findings can mint reminder Tasks.

### 2c. Medication supply monitor (SCUBA math, medical domain)
`life-support-systems/lib/calculations.js` already implements the whole
algorithm (rate → daysRemaining → graduated alerts → projection). Apply to meds:
- Extract the generic math into a shared pure lib (either
  `patient-matching`-style small package or `imports/lib/depletionMonitor.js`);
  have life-support-systems consume it too, or copy-first and converge later
  (extraction touches an extension with its own repo — coordinate).
- Source data: `MedicationDispense.daysSupply` + `whenHandedOver` + active
  MedicationRequests → projected run-out date, refill-due alerts.
- Surface as a card on the medications page; optionally mint reminder Tasks (2b).

## Phase 3 — Composite features

### 3a. Quality Control pipeline (the 8-step check)
An orchestrator, not new algorithms — `imports/api/recordQuality/`:
1. ~~Extraction/integration~~ — this *is* data-importer + ImportRuns (done).
2. Dedup → existing `dedup.analyze` (+ Phase 1a fuzzy candidates).
3. Resource coherence → generalize `findInboundReferences()` into a
   `recordQuality.checkReferences` sweep reporting dangling/broken references
   (REFERENCE_PATHS is documented non-exhaustive — expand as found).
4. Units standardization → **new**: UCUM normalization pass (add `@lhncbc/ucum-lhc`
   or a minimal conversion table for the vital-sign/lab core set); report
   non-canonical units, optionally rewrite with Provenance.
5. Terminology consistency → report codings whose system/code fail known
   CodeSystems; VSAC-backed validation where a key is configured (BYOK).
6. Formula validation → scope to derived observations we actually compute
   (BMI, eGFR if present); defer otherwise.
7. Social-determinant bias review → **report-only** (flag missing/US-Core-
   inconsistent race/sex-for-clinical-use data); respect the international
   sensitive-demographics gating (collection is settings-gated OFF by default).
8. Patient mapping → existing dedup patient-cluster analysis + a "resources
   referencing nonexistent Patient" check from step 3.
- Deliverable: `recordQuality.runChecks({ scope })` → persisted QC report
  (findings collection, same shape as DedupFindings) + a QC report page.
  Non-destructive by default; any rewrite (units) settings-gated.

### 3b. Finish LLM summarization
`narrativeEngine.js` already matches the IG's two-pass design intent:
- Implement the three stub RPC handlers (`mcp.generateWithAPIKey`, Ollama,
  Azure) server-side against the existing `userApiKeys` store — or explicitly
  cut them and stay WebLLM-only for v1 (local-first preference).
- Wire narrative **persistence** into `{Resource}.text.div` (per-resource pass),
  then the second-pass "gather all text.div → coherent summary" step for the
  IPS/document view.
- Validation guard: the IG's fabrication check is weak (keyword matching);
  implement instead as "every Condition/Medication named in the summary must
  exist in the bundle" using the flattened resources, plus the AI disclaimer
  and `log.phi`-safe audit logging.

## Explicitly not planned

- **Medication interaction checker** — shipped in `drug-interactions` +
  RxNav in order-catalog. Only action: confirm severity ranking parity with the
  IG's `severityRank()`; add if missing.
- **Chronological sorting** — shipped in timelines/chronicle. Optional cleanup:
  promote `getResourceDate()` from `extensions/timelines/client/timelineHelpers.js`
  to a shared core lib so QC (3a) and summarization (3b) reuse the same
  per-resource-type date extraction instead of reimplementing it.

## Suggested sequencing

1. Phase 1c (trend lib) — smallest, pure, immediately visible in charts.
2. Phase 1a + 1b (patient-matching extensions) — extends the freshest code.
3. Phase 2a → 2b (care gaps, then reminders that consume them).
4. Phase 2c (medication supply).
5. Phase 3a (QC pipeline — depends on 1a/1b landing).
6. Phase 3b (LLM summarization completion) — independent, schedule anytime.
