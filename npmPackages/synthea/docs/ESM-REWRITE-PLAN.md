# Synthea → ECMAScript Rewrite Plan (First Pass)

**Status:** Draft for discussion — 2026-07-02
**Audience:** Opus (eventual implementer), after scope is agreed
**Upstream survey basis:** `workzone/synthea` @ `2b0a55bab` (synthetichealth/synthea master, 2026-06-30)

---

## 1. Goal

Rewrite *enough* of Synthea in modern ESM JavaScript to execute the Generic
Module Framework (GMF) — the JSON state-machine "markov chain" modules — inside
the NodeOnFHIR/honeycomb ecosystem, producing FHIR R4 resources directly into
our collections. Explicitly **not** a full port: no Java, no Gradle, no CSV
config files, no CCDA/CSV/RIF exporters, no filesystem output directory.

Two headline use cases, in priority order:

1. **Digital twin / individual simulation** — simulate one person (possibly
   seeded from a real FHIR Patient record), run Monte Carlo futures, forecast
   disease trajectories. Runs client-side (web worker) or server-side.
2. **Population generation** — the classic Synthea use case, feeding synthetic
   test data straight into honeycomb collections without the
   run-java → mongoimport → convert-ObjectIDs dance the current package
   requires.

### Does individual simulation require generating a whole population?

**No — and this is the key architectural finding.** In upstream Synthea, each
person is an independent i.i.d. sample: `Generator.java` seeds one PRNG per
person and runs each person's modules in isolation from birth to now. The only
*shared* state across a population is the provider/payer/geography context —
which we are stubbing anyway (§4). Nothing in the module state machines reads
another person's state. So a "population" is literally just a `for` loop over
independent single-person simulations, and our engine can be
**person-first**: `simulatePerson(spec, seed) → PersonRecord`, with population
generation as a thin map over it.

---

## 2. What the upstream survey found (key numbers)

Full subsystem survey is summarized in §Appendix A. The numbers that drive
scope decisions:

| Fact | Consequence |
|---|---|
| GMF engine core is **~7,700 LOC Java** (State 2,579 / Transition 775 / Logic 652 / Generator 1,044 / Module 536 / Components 480 / Distribution 127) | The rewrite core is tractable — this is the part we port faithfully |
| **242 module JSONs** ship (127 GMF v1, 115 GMF v2), 4.9 MB, plus 70 lookup-table CSVs (~1.7 MB) | Data migrates verbatim (§5); loader must handle both GMF versions |
| Census of every state in every shipped module: 29 state types used; **`Physiology` appears exactly once**; `AllergyEnd` appears zero times | Physiology/SBML engine (~1,200 LOC + solver deps) is droppable — upstream itself defaults `physiology.state.enabled=false` and falls back to `alt_direct_transition`, so we implement only the fallback |
| Transition census: direct 5,150 / conditional 667 / distributed 541 / complex 318 / lookup_table 69 / **type_of_care 1** | All six transition types needed, but `type_of_care` (telemedicine COVID logic) can be a simplified config-probability implementation |
| **Zero** shipped modules use `expression` (CQL) in any state | The entire CQL `ExpressionProcessor` subsystem is dropped, no loss |
| JSON modules depend on attributes/vital signs set by ~4 hardcoded Java modules (Lifecycle, Encounter, Death, Insurance) | We must port a minimal "framework module" layer (§4.2), not just the JSON interpreter |
| Export subsystem is **17,215 LOC**, of which FhirR4.java is 3,508 | We write one lean R4 emitter targeting our collections; all other exporters dropped |
| Upstream ships **56 GMF test-fixture modules** in `src/test/resources/generic/` (delay, guard, transitions, death-during-delay, time-travel, etc.) | Free conformance test suite — port these fixtures + their assertions first (§7) |
| Determinism: one seeded PRNG per Person, threaded through all module logic | We need a seedable PRNG in JS (`pure-rand` or similar). JS↔Java bit-parity is a **non-goal**; within-JS reproducibility is required |
| `Generator.java` supports population snapshots (serialize persons, reload, `daysToTravelForward`) | This is the "evolve forward" primitive digital twins need — trivial in JS (persons become plain JSON) |

---

## 3. Package layout

**Recommendation: new package `npmPackages/synthea-solver`** (pure ESM engine +
vendored module data), with the existing `npmPackages/synthea` GUI package as
its consumer. Alternative — everything inside `npmPackages/synthea` — works
too, but the split buys us:

- **Isomorphism.** The engine has *zero* Meteor imports (same discipline as
  `npmPackages/merkalis/lib/FhirDiff.js`): plain ESM + lodash only. It then
  runs identically in (a) a browser **web worker** — client-side digital twin
  simulation, no PHI leaves the device, aligned with our local-first
  preference; (b) Node CLI / CI; (c) Meteor server methods.
- **Licensing clarity.** Vendored Synthea modules and data are Apache-2.0
  (carry upstream `LICENSE`/`NOTICE` in the package); the engine can be
  Apache-2.0/MIT cleanly, separate from the GUI package.
- The GUI package keeps its current job (config authoring) and gains "Run"
  (worker or server method) instead of "copy this shell command".

```
npmPackages/synthea-solver/
├── package.json               # @node-on-fhir/synthea-solver, pure ESM, no Meteor deps
├── LICENSE                    # Apache-2.0 + upstream NOTICE for vendored data
├── lib/
│   ├── engine/
│   │   ├── ModuleLoader.js    # parse/validate GMF v1+v2 JSON, resolve submodules
│   │   ├── StateTypes.js      # the 29 state implementations (one export per type)
│   │   ├── Transitions.js     # 6 transition types
│   │   ├── Logic.js           # ~20 condition types
│   │   ├── Distributions.js   # exact/uniform/gaussian/exponential/triangular
│   │   ├── Components.js      # Exact/Range/WithUnit value components
│   │   └── ModuleEngine.js    # per-module state-machine executor (history, rewind)
│   ├── person/
│   │   ├── Person.js          # attributes, vital signs, symptoms, seeded PRNG
│   │   ├── HealthRecord.js    # lean entry hierarchy (encounters/conditions/meds/obs/…)
│   │   └── PersonSeed.js      # spec → newborn person; FHIR Patient → mid-life person
│   ├── framework/             # ports of the hardcoded Java modules (minimal set)
│   │   ├── lifecycle.js       # birth, growth charts, aging, natural death, vitals
│   │   ├── encounters.js      # wellness scheduling + symptom-driven encounters
│   │   ├── death.js           # baseline mortality
│   │   └── immunizations.js   # schedule-driven vaccines (phase 2)
│   ├── simulation/
│   │   ├── Simulator.js       # simulatePerson / simulatePopulation / evolve / monteCarlo
│   │   ├── Clock.js           # 7-day timestep loop, delay rewind semantics
│   │   └── prng.js            # seedable deterministic PRNG wrapper
│   └── output/
│       └── FhirR4Emitter.js   # HealthRecord → R4 resources (arrays / NDJSON / Bundle)
├── data/
│   ├── modules/               # VERBATIM copy of upstream modules tree (242 JSON, same dirs)
│   ├── lookup_tables/         # upstream CSVs converted to JSON at migration time
│   ├── growth_charts.json     # cdc_growth_charts.json + infant/birthweight tables (JSON-ified)
│   ├── immunization_schedule.json
│   └── demographics.default.json  # small replacement for the US-census CSV stack
├── scripts/
│   └── migrate-upstream-data.js   # re-runnable: workzone/synthea resources → data/ (CSV→JSON)
├── tests/
│   ├── fixtures/generic/      # the 56 upstream GMF test modules, vendored
│   └── …                      # conformance + determinism + statistical tests
└── docs/
```

The existing `npmPackages/synthea` gains:
- a runner panel calling `@node-on-fhir/synthea-solver` (worker on client,
  method on server),
- config emission switched from `synthea.properties` to a JSON config object
  consumed directly by `Simulator` (the `generatePropertiesFile.js` →
  `generateConfig.js` rename; **CSV/properties config files are gone**),
- import-to-collections via the `data-importer` warehouse path
  (`insertBundleIntoWarehouse` already handles versioning + dedup), which also
  makes the ObjectID-conversion utilities obsolete for this flow.

---

## 4. Feature triage

### 4.1 Migrate faithfully (the contract)

| Feature | Notes |
|---|---|
| All **29 used state types** | Per-type census in §2; port semantics from `engine/State.java` inner classes, incl. subtleties: Delay **time-rewind** (delay expiring mid-timestep rewinds the clock, reprocesses, then processes again at the real timestep), `CallSubmodule` recursion + rewind propagation, deferred `target_encounter` diagnoses, `assign_to_attribute` everywhere |
| All **6 transition types** | Incl. `NamedDistribution` (probability from a person attribute with default), lookup-table matching with age ranges + time ranges; `type_of_care` simplified (§4.3) |
| All **~20 logic types** | Gender/Age/Date/SES/Race/Symptom/Observation/Attribute/And/Or/Not/AtLeast/AtMost/True/False/PriorState(+since/within)/ActiveCondition/ActiveAllergy/ActiveMedication/ActiveCarePlan/VitalSign |
| **5 distributions** + `round` | exact/uniform/gaussian(min/max clamp)/exponential/triangular |
| GMF **v1 and v2** module parsing | 127 v1 + 115 v2 shipped; v2 mainly = `distribution` objects where v1 had `range`/`exact` |
| **Person**: attributes map, vital-sign value generators, multi-source symptoms (1–100), seeded per-person PRNG | The attribute map is the inter-module bus — JSON modules read/write it freely |
| **HealthRecord**: entry hierarchy (Encounter w/ types, Condition, Allergy, Medication+chronic, Procedure, Observation/MultiObservation, DiagnosticReport, ImagingStudy w/ series/instances, Device, Supply, CarePlan, Immunization), `present` map for active conditions | Lean port — drop Claim/cost fields (§4.4) |
| **Framework modules** (minimal): lifecycle (birth/demographics/growth-charts/aging/natural death + vital-sign generators incl. BP), encounter scheduling (wellness cadence by age + symptom-driven urgent/ER + encounter "blocking"), death module | JSON modules hard-depend on the attributes and wellness encounters these produce; without them most modules stall in Guards/Delays forever |
| **Determinism**: `simulate(spec, seed)` reproducible | Seedable PRNG (`pure-rand` recommended); same seed + same config ⇒ identical output. Java bit-parity is a non-goal |
| **Module data verbatim** | §5 |

### 4.2 Migrate simplified

| Feature | Simplification |
|---|---|
| **Demographics** | Replace the census CSV stack (state/city/SES/income geodata) with a small `demographics.default.json` (age/gender/race distributions + name lists) *and* an explicit person-spec input (`{gender, birthYear, race, ses, …}`). The GUI already collects exactly these fields. Location becomes a config string, not a geospatial lookup |
| **Providers** | One synthetic Organization/Practitioner per encounter class (configurable), no distance search, no bed counts. Modules never read provider internals — they only need encounters to have *a* provider reference for FHIR output |
| **Lookup tables** | CSVs converted to JSON once by `scripts/migrate-upstream-data.js`; runtime never parses CSV |
| **Telemedicine / `type_of_care`** | Config probability (used by 1 transition + `telemedicinePossibility` on Encounter states); no COVID-era time curves initially |
| **Immunizations** | Schedule JSON already exists upstream; port in phase 2 (needed for realistic wellness encounters, not for module correctness) |
| **Growth charts** | Upstream data is already JSON+small CSVs; JSON-ify and keep — lifecycle needs it for pediatric vitals |

### 4.3 Defer (design for, don't build)

| Feature | Why deferred |
|---|---|
| **Insurance / payers / coverage / eligibility** (~2,000 LOC + plan CSVs) | Only needed for financial realism and loss-of-care simulation. **Caveat:** a few modules/lookup-tables condition on insurance attributes — ship a static `coverage: 'private'`-style attribute default so Logic never crashes, and audit modules for insurance-dependent transitions during phase 1 |
| **Costs / claims** (Costs.java + costs CSVs, Claim on every entry) | Zero clinical effect; add later if we want Claim/ExplanationOfBenefit resources |
| **QualityOfLife / disability weights, WeightLoss module** | Set-only attributes (QALY/DALY analytics); nothing shipped breaks without them |
| **`keep_modules` patient filtering, max-attempts retry** | Population-curation feature; revisit with population UI |
| **US Core profile conformance on output** | Emit clean base R4 first; `us-core` package integration (ProfileDecorators) later |

### 4.4 Drop (not ported)

| Feature | Justification |
|---|---|
| **Physiology/SBML ODE engine** (~1,200 LOC + solvers) | Used by exactly 1 module; upstream ships it disabled with `alt_direct_transition` fallback — we implement only the fallback |
| **CQL ExpressionProcessor** | Zero usage in shipped modules (verified by census) |
| **All exporters except R4**: STU3, DSTU2, CCDA, CSV, CPCDS, RIF (6,487 LOC!), CDW, text, clinical notes, flexporter | We target honeycomb collections; `ccda-export` package already exists if CCDA is ever needed |
| **CSV/properties config** | JSON config from the existing GUI; `synthea.properties` semantics mapped to config keys where still meaningful |
| **Java thread pool** | Persons are independent; parallelism = web workers / worker_threads mapped over seeds, added later if needed |
| **`identity/` fixed-record subsystem** | Superseded by FHIR-Patient seeding (§6), which is the honeycomb-native equivalent |
| **Filesystem output tree, run_synthea shell UX** | Output goes to collections / NDJSON download |

---

## 5. Data migration (phase 0 — mostly verbatim)

1. `scripts/migrate-upstream-data.js` copies
   `workzone/synthea/src/main/resources/modules/**` → `data/modules/**`
   **preserving the directory structure exactly** (85 top-level modules +
   submodule dirs: heart/, metabolic_syndrome/, medications/, surgery/, …).
   Module JSONs are byte-identical to upstream — we treat them as a
   conformance target, not editable source.
2. Same script converts `modules/lookup_tables/*.csv` (70 files) →
   `data/lookup_tables/*.json` (papaparse at migration time, never at runtime).
3. Copies + JSON-ifies the framework data files: `cdc_growth_charts.json`,
   `cdc_wtleninf.csv`, `birthweights.csv`, `nhanes_two_year_olds_bmi.csv`,
   `immunization_schedule.json`, `telemedicine_config.json`.
4. Vendors `src/test/resources/generic/*.json` (56 fixtures) → `tests/fixtures/generic/`.
5. Records upstream commit hash in `data/UPSTREAM.md`; script is re-runnable to
   pick up upstream module updates.
6. Carry upstream `LICENSE` (Apache-2.0) + `NOTICE` into the package.

Optionally run `/graphify` over `workzone/synthea/src/main/java` to produce a
navigable map for the implementer (exclude `src/main/resources` — same
schema-noise concern as the honeycomb graph). Nice-to-have; Appendix A already
covers the architecture.

---

## 6. Digital twin design (the interesting part)

Three modes, in ascending difficulty:

**Mode 1 — Synthetic individual, birth-to-now (phase 1, free).**
`simulatePerson({gender:'F', birthYear:1962, seed})`. This is upstream's
single-person mode (`options.singlePersonSeed`) and needs nothing beyond the
core engine.

**Mode 2 — Monte Carlo futures (phase 4, cheap, high payoff).**
Serialize a simulated person mid-stream (persons are plain JSON in our engine —
attributes, vitals, record, and *per-module state-machine positions*), then run
N continuations with N different seeds:
`monteCarlo(snapshot, {years: 10, runs: 500})` → distribution of outcomes
(conditions onset, death, encounters). This is upstream's population-snapshot +
`daysToTravelForward` feature, generalized. Runs are independent → embarrassingly
parallel in web workers. **This does not require population generation** and is
the digital-twin payoff.

**Mode 3 — Twin seeded from a real FHIR Patient (phase 4+, research-y).**
The honest hard problem: module state machines have internal position (which
state each of the 242 modules is in), and a real patient's record doesn't tell
us that. Two strategies, both worth prototyping:
- **Direct injection:** initialize `Person` from Patient/Condition/Medication/
  Observation resources (demographics, active-condition `present` map, vitals,
  meds), then start every module at `Initial` with guards naturally short-
  circuiting (e.g. a diabetes module whose Guard checks `ActiveCondition` will
  fast-path). Imperfect — some modules will re-onset existing conditions;
  mitigate with an onset-suppression shim (skip `ConditionOnset` for codes
  already in the seeded record).
- **Constrained replay:** run birth-to-now repeatedly (different seeds) and
  keep the run whose record best matches the real record (upstream's
  keep-module/retry pattern, scored against the seed record). Expensive but
  principled; viable at JS-worker speeds for one person.

Phase 4 implements Mode 2 fully and Mode 3's direct-injection prototype behind
an experimental flag.

### 6.1 Population cohorts (first-class, not an afterthought)

Cohort generation and digital twins are two callers of the same
`simulatePerson(spec, seed)` — a cohort is a map over N per-person seeds drawn
deterministically from one master seed (exactly `Generator.java`'s model:
`populationRandom.randLong()` per person). Both modes ship; neither constrains
the other. What cohorts *do* need beyond the single-person path:

- **Cohort spec:** `simulatePopulation({count, seed, demographics, spec…})`
  where `demographics` is the sampled distribution (default JSON) and `spec`
  can pin fields for stratified cohorts (e.g. "500 women 50–70" — every
  person-spec field is optionally fixed rather than sampled).
- **Parallel fan-out:** persons are independent → a worker pool (web workers
  client-side, `worker_threads` in Node) maps over seeds. Determinism is
  preserved because seeds are assigned by index before dispatch, so worker
  scheduling order can't change results.
- **Streaming output:** never hold N full bundles in memory. The runner emits
  per-person results as they complete — batched `insertBundleIntoWarehouse`
  calls (or NDJSON append) with progress callbacks for the GUI
  (`{completed, total, alive, dead}`).
- **Cohort curation (deferred, phase 5 candidate):** upstream's
  `keep_modules` filtering + retry-to-N (generate until N patients match a
  criteria module). Post-hoc filtering of a larger run covers most needs
  until then; revisit with the population UI.

The two modes also compose: generate a cohort, then snapshot any member and
run Monte Carlo futures on them — cohort generation becomes a way of
*sampling plausible twins*.

---

## 7. Validation strategy

1. **Conformance fixtures first:** the 56 vendored upstream GMF test modules
   drive the state/transition/logic unit tests (upstream's
   `GeneratorTest`/`StateTest` assertions tell us expected behavior — mine
   `src/test/java/org/mitre/synthea/engine/StateTest.java` while porting).
2. **Determinism tests:** same seed ⇒ deep-equal output; different seed ⇒ different.
3. **Statistical parity with Java:** generate reference populations with the
   Java jar (fixed seeds, `-p 1000`), compare *distributions* (condition
   prevalence, encounter counts per age band, death rates) against the JS
   engine within tolerance. Bit-parity impossible (different PRNG), so this is
   the cross-implementation check.
4. **Full-catalog smoke test:** load all 242 modules, simulate 100 persons,
   assert no module throws / no state machine wedges (infinite loop guard =
   max iterations per timestep, as upstream does).

## 8. Phases

| Phase | Deliverable | Depends on |
|---|---|---|
| **0. Data migration** | `synthea-solver` package scaffold; verbatim modules tree; lookup tables + framework data JSON-ified; upstream test fixtures vendored; licensing carried | — |
| **1. Core engine** | ModuleLoader (v1+v2), all states/transitions/logic/distributions, Person + HealthRecord, clock with delay-rewind, seeded PRNG; conformance fixtures green; `simulatePerson(spec, seed)` runs any single module | 0 |
| **2. Framework modules** | lifecycle (growth charts, vitals, natural death), encounter scheduling, death module, immunizations; full-catalog smoke test green; statistical parity harness | 1 |
| **3. FHIR R4 + honeycomb integration** | FhirR4Emitter; `simulatePopulation` with worker-pool fan-out, streaming batched import + progress reporting; server method + client web-worker runner in `npmPackages/synthea`; GUI "Run" tab emitting JSON config; import via data-importer warehouse path; NDJSON download | 2 |
| **4. Digital twin** | Person snapshot/serialize, `evolve(days)`, `monteCarlo(snapshot, opts)` with worker fan-out, FHIR-Patient direct-injection seeding (experimental); twin panel in GUI (patient-context aware, `requirePatient`) | 3 |
| **5. Cohort curation (optional)** | `keep_modules`-style criteria filtering, retry-to-N stratified cohorts, population UI | 3 |

Each phase ends working and testable; a detailed task-by-task TDD plan (per the
writing-plans discipline) gets authored per phase once this scope is agreed.

## 9. Open questions for discussion

1. **Package name & split** — `synthea-solver` vs `synthea-simulator` vs
   folding into `npmPackages/synthea`? (Plan assumes the split; §3 rationale.)
2. **License of the engine code** — Apache-2.0 to match upstream/`core/*`
   posture, or MIT like most npmPackages? (Data stays Apache-2.0 regardless.)
3. **Module bundling** — 4.9 MB of module JSON in the client bundle is real
   weight. Lazy-load modules over a Meteor method / dynamic import per module
   directory? Matters for the browser-worker path.
4. **How much insurance stubbing** — audit result pending: if many
   lookup-tables key on insurance attributes, the stub needs to be richer.
5. **Prior art check** — before phase 1, search for existing JS GMF
   implementations (synthetichealth's `module-builder` React app parses these
   JSONs for editing and is a useful schema reference even though it doesn't
   execute them; any actual JS *executor* found could change build-vs-borrow).
6. **Where does population output go** — straight `insertBundleIntoWarehouse`,
   or NDJSON-first with the importer UI in the loop (dedup panel etc.)?

---

## Appendix A: Upstream subsystem survey (2026-07-02)

Sizes from `workzone/synthea` @ `2b0a55bab`, paths under
`src/main/java/org/mitre/synthea/`.

| Subsystem | LOC | Port decision |
|---|---|---|
| `engine/` GMF core (State 2,579; Transition 775; Logic 652; Generator 1,044; Module 536; Components 480; Distribution 127; +expression/physiology/editor helpers) | 7,743 | **Port** (minus physiology, expressions) |
| `world/agents/` Person 1,026; Provider ~800; payer/provider behaviors ~1,200 | 3,225 | Person **ported**; providers stubbed; payers deferred |
| `world/concepts/` HealthRecord 1,733; VitalSign ~400; Costs/Claim; healthinsurance 862 | 4,541 | HealthRecord+VitalSign **ported lean**; costs/insurance deferred |
| `modules/` hardcoded: Lifecycle 1,346; Encounter 312; Immunizations 325; Death; HealthInsurance; QoL; WeightLoss; BP generator; CVD; covid 973; calculators 713 | 3,405+ | Lifecycle/Encounter/Death/Immunizations **ported**; rest deferred/dropped |
| `export/` FhirR4 3,508; STU3/DSTU2 ~4,700; CCDA 850; CSV 1,100; CPCDS 600; RIF 6,487; flexporter 2,862; text/JSON/notes | 17,215 | One lean R4 emitter **written new**; everything else dropped |
| `helpers/` Config, Utilities (date math, code comparison), RandomNumberGenerator, TimeSeriesData, ExpressionProcessor, physiology 842 | 5,395 | Small utils ported as needed; CQL + SBML dropped |
| `world/geography/` + `identity/` | 2,631 | Dropped (simplified demographics + FHIR seeding instead) |
| Module resources | 242 JSON modules (127 GMF v1 / 115 v2), 4.9 MB; 70 lookup CSVs 1.7 MB; 56 test fixtures | **Vendored verbatim** (CSV→JSON) |

State-type census across all 242 shipped modules (occurrences):
Simple 1,101 · SetAttribute 785 · Procedure 649 · MedicationOrder 623 ·
Delay 474 · ConditionOnset 409 · Observation 333 · EncounterEnd 332 ·
Encounter 314 · Symptom 309 · CallSubmodule 268 · Initial 241 · Terminal 224 ·
ConditionEnd 171 · DiagnosticReport 142 · MedicationEnd 119 · CarePlanStart 85 ·
Counter 60 · Death 53 · Device 47 · Guard 46 · ImagingStudy 39 · DeviceEnd 33 ·
MultiObservation 30 · CarePlanEnd 26 · AllergyOnset 22 · SupplyList 20 ·
VitalSign 9 · Vaccine 5 · Physiology 1.

Transition census: direct 5,150 · conditional 667 · distributed 541 ·
complex 318 · lookup_table 69 · type_of_care 1.

Key upstream references for the implementer:
- GMF spec: <https://github.com/synthetichealth/synthea/wiki/Generic-Module-Framework>
- `engine/State.java` inner classes — authoritative state semantics (incl. delay rewind)
- `engine/Transition.java`, `engine/Logic.java`, `engine/Distribution.java`
- `modules/LifecycleModule.java`, `modules/EncounterModule.java` — framework layer
- `src/test/java/org/mitre/synthea/engine/StateTest.java` + `src/test/resources/generic/` — conformance suite
- `synthetichealth/module-builder` — React editor for these JSONs (schema reference)
