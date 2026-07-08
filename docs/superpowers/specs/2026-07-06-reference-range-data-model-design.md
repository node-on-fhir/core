# Biomarker Reference-Range Data Model — Design

**Date:** 2026-07-06
**Status:** Approved design (pre-plan)
**Sub-project:** #3 of 4 in the "Human Development & Sexual Health" effort (see *Context & decomposition* below)

> **For agentic workers:** the terminal state of this spec is an implementation plan
> written via `superpowers:writing-plans`. Do not begin implementation from this
> document directly.

## Purpose

Turn the free-text biomarker reference-range tables in the *Sex for Clinical Use
Terminology Guide* IG (`workzone/modern-concepts-of-intersex`) into a structured,
FHIR-native data model that the NodeOnFHIR app can resolve at runtime, so that a
`ReferenceRange` UI primitive and a future `BloodPanel` component can interpret a
patient's lab `Observation`s against the **correct** range for that patient —
where "correct" accounts for sex-for-clinical-use, age, physiological state,
population genetics, and jurisdiction.

The source tables (`input/pagecontent/andrology.md`, `gynecology.md`) are today an
identical ~290-row superset with sex/age/phase encoded as prose inside a single
"Reference Range" cell (e.g. `Female: 24–307 ng/mL<br>Male: 24–336 ng/mL`). That is
human-readable, not machine-actionable. This subsystem makes it machine-actionable.

## Context & decomposition

The user's two stated goals (reshape the IG into a *Human Development & Sexual
Health* IG; migrate its content into NodeOnFHIR packages) span **four independent
subsystems**, each with its own spec → plan → implementation cycle:

1. **IG content/authoring** — reshape + fill the lifespan narrative.
2. **Package split + terminology staging** — `modern-concepts-of-intersex` /
   `sexual-health` / `obstetrics` extensions; decide where ValueSets/CodeSystems land.
3. **Reference-range data model** — ← **this spec**.
4. **`ReferenceRange` + `BloodPanel` components** — largely delivered *by* this spec
   (the data model and the components are tightly coupled), coordinated with the
   existing DynamicFhir enhancement plan.

This spec is the linchpin: (1) will *cite* the structured ranges, (2) needs to know
whether ranges are core data or a shipped artifact, and (4) is a view over whatever
shape this defines.

## Locked decisions

| # | Decision | Choice |
|---|----------|--------|
| D1 | FHIR shape | `ObservationDefinition` (R4), one per LOINC; ranges as `qualifiedInterval[]` |
| D2 | Authority model | **Core defaults + injectable overrides** (layered resolution) |
| D3 | Selection input | **Deployment default + per-patient override** (never silently inferred from PHI) |
| D4 | First-cut scope | **Curated blood-panel subset, LOINCs verified**; esoteric long tail bulk-imported later against the same schema |
| D5 | Storage approach | **Approach A** — FHIR-native `ObservationDefinition` collection + pure resolver (chosen over a custom flat table or Observation-embedded ranges) |
| D6 | Qualifier axes | **Two separate axes**: `population` (biological/genetic) + `jurisdiction` (geospatial/legal, ISO-3166) |
| D7 | Band profiles | **Five** topologies: `low-normal-high`, `normal-high`, `low-normal`, `qualitative`, `informational` |
| D8 | Sex source | **Sex Parameter for Clinical Use (SPCU)**, not administrative `Patient.gender` |
| D9 | SPCU reader home | **Core lib** (`imports/lib/sexForClinicalUse.js`) — base-FHIR, reusable |

## Architecture

Everything lives in **core** (this is a default that ships with the base app), with
a well-defined injection seam that packages and settings plug into. The core units,
each independently testable:

```
imports/lib/schemas/SimpleSchemas/ObservationDefinitions.js  — collection + schema (FHIR ObservationDefinition, R4)
imports/data/reference-ranges/blood-panel.json              — checked-in seed: curated subset, LOINCs verified
server/referenceRanges/seed.js                              — idempotent startup seed (base layer only)
server/referenceRanges/registry.js                          — lazily collects injected override sets (Package registry + settings)
imports/lib/referenceRanges/resolveReferenceRange.js        — isomorphic PURE resolver (inputs → chosen interval[])
imports/lib/referenceRanges/qualifiers.js                   — population/jurisdiction qualifier constants + matchers
imports/lib/sexForClinicalUse.js                            — SPCU reader (Observation→Patient SPCU → clinical-use sex)
```

Server method + client hook (thin I/O over the pure core):

```
server/referenceRanges/methods.js   — referenceRanges.resolve / referenceRanges.resolveBatch
imports/ui/hooks/useResolvedReferenceRange.js — client hook feeding the primitive
```

Components (see *Component layer*):

```
imports/ui-fields/ReferenceRange.jsx  — PURE leaf primitive (coordinated with DynamicFhir plan Task 3)
imports/ui-modules/BloodPanel.jsx     — panel view, batched resolution + provenance tooltip
```

**The load-bearing boundary:** *data-gathering* (seed + registry + SPCU read, all
impure) is separate from *data-selection* (the pure resolver). The resolver knows
nothing about Mongo, packages, settings, or SPCU — it receives fully-assembled
`candidates` + `context` and returns a selection + provenance. This makes it
identical on client and server and trivially unit-testable.

## Data model

### ObservationDefinition seed record

One analyte → one `ObservationDefinition`, keyed by LOINC. Each distinct range → one
`qualifiedInterval`. Example (Ferritin, abbreviated):

```json
{
  "resourceType": "ObservationDefinition",
  "id": "abim:base:2276-4",
  "code": { "coding": [{ "system": "http://loinc.org", "code": "2276-4",
    "display": "Ferritin [Mass/volume] in Serum or Plasma" }] },
  "quantitativeDetails": { "unit": { "coding": [{ "system": "http://unitsofmeasure.org", "code": "ng/mL" }] } },
  "qualifiedInterval": [
    { "category": "reference", "gender": "female", "range": { "low": {"value": 24}, "high": {"value": 307} } },
    { "category": "reference", "gender": "male",   "range": { "low": {"value": 24}, "high": {"value": 336} } }
  ],
  "extension": [
    { "url": "https://nodeonfhir.org/fhir/StructureDefinition/reference-range-band-profile", "valueCode": "low-normal-high" },
    { "url": "https://nodeonfhir.org/fhir/StructureDefinition/reference-range-source",  "valueString": "ABIM Laboratory Reference Ranges (Jan 2024)" },
    { "url": "https://nodeonfhir.org/fhir/StructureDefinition/reference-range-layer",   "valueCode": "base" },
    { "url": "https://nodeonfhir.org/fhir/StructureDefinition/reference-range-version", "valueString": "2024.1" }
  ]
}
```

Definition-level fields: `code (LOINC)`, `unit`, `bandProfile`, `source`, `layer`,
`version`, `effectiveDate` (for the "ranges change over time" durability
requirement). Interval-level fields: `range`, `category`, `interpretation?`,
`gender?`, `age?`, `condition?`, plus the two override extensions below.

### Parsing rules (source cell → intervals)

The seed-builder converts the source prose:

- `Female: … Male: …` → two intervals with `gender` (`male`/`female`).
- Age bands (`Ages 25–39`) → `age: { low, high }`.
- Pregnancy/menstrual phase (`follicular`/`luteal`/`postmenopausal`) → `condition`
  SNOMED coding — **not** `gender` (these are physiological states).
- Tanner stages → `condition` coding.
- Interpretation bands (cholesterol `Desirable`/`Borderline`/`High`) → separate
  intervals with `category` + a v3-`ObservationInterpretation` code (see band model).

### Two override qualifier axes

`qualifiedInterval` has native `gender`/`age`/`gestationalAge`/`condition` but **no**
population/jurisdiction concept, so each is added as an interval-level extension. They
are **separate** because they are different kinds of thing and resolve independently:

- **`population`** — biological/genetic health-population. Core-defined CodeSystem
  `https://nodeonfhir.org/fhir/CodeSystem/reference-population`, initial codes:
  `sickle-cell-endemic`, `g6pd-deficient`, `hiv-high-prevalence`, `high-altitude`.
  ```json
  { "url": "https://nodeonfhir.org/fhir/StructureDefinition/reference-range-population",
    "valueCodeableConcept": { "coding": [{ "system": "https://nodeonfhir.org/fhir/CodeSystem/reference-population",
      "code": "sickle-cell-endemic" }] } }
  ```
- **`jurisdiction`** — geospatial/legal boundary, **standard `urn:iso:std:iso:3166`
  (country) / `urn:iso:std:iso:3166:-2` (subdivision) codes**. The
  `@orbital/interstate-interoperability` extension's bare state codes (`CA`, `AR`) are
  a subset of ISO-3166-2:US. **Core owns only the vocabulary (ISO codes); it does not
  import the extension.** The extension owns geography→jurisdiction and plugs in as a
  jurisdiction *resolver* (writing a patient's jurisdiction tag from address/geocode).
  When the extension is absent, jurisdiction falls back to the deployment default.

**Base-layer intervals carry neither extension** — they are the universal default and
match everyone. Only override intervals carry `population`/`jurisdiction`.

### Band-profile model (D7)

`bandProfile` (definition-level extension) captures the **topology** — which
directions are pathological — kept orthogonal to **grading** (how many named bands
within a direction, via interval `interpretation` codes).

| `bandProfile` | Pathological direction | Physiology | Examples | Render |
|---|---|---|---|---|
| `low-normal-high` | both | tight homeostasis; both extremes harm | Na, K, Ca, glucose, TSH | bidirectional gauge |
| `normal-high` | high only | 0 ideal, cleared continuously; excess is pathological | troponin, CRP, LDL, triglycerides, bilirubin, PSA | one-sided (upper) gauge |
| `low-normal` | low only | a minimum is needed, excess benignly excreted | vitamin D, HDL, water-soluble vitamins (C, B) | one-sided (lower) gauge |
| `qualitative` | cutoff | no continuous normal window — threshold splits negative/positive (or titer) | ANA, HIV, anti-dsDNA, drug screens | pass/fail (or titer) **chip**, not a gauge |
| `informational` | none | no defined normal | PSA "no specific normal level" | value only, no gauge |

The **NORMAL** band is the `reference`-category interval. Graded abnormal bands become
additional intervals tagged `category` + `interpretation` (`N`/`H`/`HH`/`L`/`LL` from
`http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation`) — exactly the
data a color-coded gauge consumes.

**Therapeutic window** (digoxin, lithium, INR) is *not* a sixth topology — it is
topologically `low-normal-high` with a distinct interpretation-**label set**
(subtherapeutic/therapeutic/toxic). Handle via labels on a two-sided profile.

## Resolver (pure selection)

`imports/lib/referenceRanges/resolveReferenceRange.js` — pure, isomorphic, never
touches Mongo/settings/packages.

```js
resolveReferenceRange({
  loinc,                    // "2276-4"
  candidates,               // ObservationDefinition[] for this LOINC, across all layers
  context: {
    sex,                    // 'male' | 'female' | undefined  (from SPCU chain — see below)
    ageYears,               // number | undefined
    condition,              // SNOMED code(s) — gestational phase, Tanner | undefined
    population,             // 'sickle-cell-endemic' | undefined
    jurisdiction,           // ISO-3166 code | undefined
    overrideSource,         // 'patient' | 'deployment'  (drives layer precedence + provenance)
  }
}) => {
  code, unit, bandProfile,
  normal: { low, high } | null,             // the reference-category interval
  bands: [{ interpretation, category, range, label }],  // graded bands for the gauge
  matched: { layer, source, version, by: ['sex','population'] },  // WHY this won
  skipped: [{ source, reason }]             // what lost — for transparency
}
```

**Two-stage, deterministic:**

1. **Layer precedence** (which *definition* wins among several for one LOINC):
   `per-patient override > deployment-default override > base`. `overrideSource`
   disambiguates when the same population/jurisdiction match is sourced from the
   patient tag vs the deployment default.
2. **Interval specificity** (which `qualifiedInterval` applies): an interval is
   *eligible* only if every qualifier it declares matches the context
   (`gender`/`age`/`condition`/`population`/`jurisdiction`); an **absent qualifier is a
   wildcard**. Among eligible intervals, **most-specific wins** (most qualifiers
   matched — CSS-specificity style). So `female + sickle-cell-endemic` beats plain
   `female` for a matching patient, and falls back to plain `female` when no
   population is set.

**Explainability is a first-class output** (`matched` + `skipped`), serving the two
durability concerns: ranges change over time (`version`/`source` visible) and differ
by country (clinician can see "sickle-cell-endemic range because deployment defaults
to NG"). The BloodPanel surfaces this as a tooltip.

**Never throws.** No candidates → `null` (UI shows "no reference range"). No eligible
interval → definition with `normal: null`, `bandProfile: 'informational'`.

## Sex Parameter for Clinical Use (D8/D9)

`context.sex` is resolved by `imports/lib/sexForClinicalUse.js` — a core, isomorphic
reader of the base-FHIR **Sex Parameter for Clinical Use** extension
(`http://hl7.org/fhir/StructureDefinition/patient-sexParameterForClinicalUse`).
Sub-extensions used: `value` (1..1 CodeableConcept, bound to
`http://terminology.hl7.org/ValueSet/sex-parameter-for-clinical-use`:
`male`/`female`/`specified`/`unknown`), `period` (0..1), `supportingInfo` (0..*), and
`intendedClinicalUse` (0..*). The extension applies to **any Resource**, so it can sit
on the Observation or the Patient.

Resolution chain (`resolveSexForClinicalUse(patient, observation, { atTime, intendedUse })`):

1. **SPCU on the Observation**, `intendedClinicalUse` matching lab/reference-range
   interpretation (or unscoped), `period` covering the observation's
   `effectiveDateTime` → its `value`.
2. else **SPCU on the Patient**, same filtering, active at the relevant time.
3. else administrative **`Patient.gender`** — explicit last-resort fallback, flagged.
4. else **undefined** → only sex-agnostic intervals eligible.

Payoffs (surfaced in resolver provenance): `period` lets clinical-use sex change over
time (pre/post-transition, DSD diagnosis) so old and new results on one patient
resolve against different ranges; `supportingInfo` (karyotype, hormone panels) is the
*provenance* for the sex determination (`matched.by` = "sex-for-clinical-use =
specified, supported by 46,XY karyotype"); `intendedClinicalUse` prevents collision
with a medication-dosing SPCU. This makes the reference-range subsystem a direct
downstream consumer of the parent IG's central concept.

## Injection & override mechanism

Two different kinds of input flow into the resolver:

**(a) Definitions/intervals — the *data* being selected.** Gathered lazily per LOINC
into `candidates` from three sources:
1. **Base** — the seeded collection.
2. **Package-shipped sets** — a package exports `ReferenceRangeSet` from its server
   entry, discovered through the **`Package` registry exactly like `us-core` ships
   `ProfileSet`** (see `.claude/rules/fhir/package-registry.md`). A country/population
   pack (`@node-on-fhir/reference-ranges-ng`) exports `ObservationDefinition`s whose
   intervals carry `population`/`jurisdiction`. Enabling via `EXTRA_WORKFLOWS` makes
   its ranges available; disabling removes them. No core change.
3. **Settings overrides** — `settings.private.referenceRanges.overrides[]`.

Discovery is **lazy** (read in `Meteor.startup`/at gather-time, never at module load)
— the load-order rule from `package-registry.md`.

**(b) Population/jurisdiction values — the *context* that selects.**
- **Deployment default** — `settings.public.referenceRanges.defaultPopulation` /
  `defaultJurisdiction`.
- **Per-patient override** — an extension tag on the Patient; wins when present
  (`overrideSource: 'patient'`). This is where `@orbital/interstate-interoperability`
  plugs in: it owns geography→jurisdiction and computes/writes a patient's jurisdiction
  from address/geocode. Core never imports the extension; absent → deployment default.

Impure gather helpers (`gatherCandidates(loinc)`, `gatherReferenceRangeContext(patient,
observation)`) assemble data and hand it to the pure resolver. Components never touch
the registry directly.

## Component layer

**Pure primitive** — `imports/ui-fields/ReferenceRange.jsx`,
`ReferenceRange({ value, unit, normal, bands, bandProfile })`. Value in, JSX out; no
fetching (honors the DynamicFhir plan's `ui-fields` rule). Renders all five profiles:
bidirectional gauge / one-sided (upper|lower) gauge / qualitative chip / informational
value. **This spec owns the primitive's real implementation**; the DynamicFhir plan
(Task 3) only sketched a bare low–high renderer — coordination note: this spec creates
`ui-fields/ReferenceRange.jsx` to the richer contract, and Task 3 adopts it rather than
the stub.

**Resolution hook/method** — `useResolvedReferenceRange({ loinc, value, patient,
observation })` (client) → `referenceRanges.resolve` (server: gather + pure resolve) →
`{ normal, bands, bandProfile, unit, matched, skipped }` → `<ReferenceRange>`.

**BloodPanel** — `imports/ui-modules/BloodPanel.jsx`, `BloodPanel({ observations,
patient })`, sibling to the existing `BiomarkerChartingPage.jsx`. Calls **one batched**
method `referenceRanges.resolveBatch({ items: [{loinc, value}], patientId,
observationIds })` (one round-trip), renders a grid: analyte · value · unit ·
`<ReferenceRange>` gauge · interpretation flag · **provenance tooltip** (from `matched`
— range source/version + SPCU basis). The tooltip is the clinical-trust payoff.

**Likert stays separate.** The DynamicFhir plan's `Likert.jsx` (ordinal survey/PROMIS)
and this `ReferenceRange` gauge may share a small internal scale-drawing helper but
remain distinct primitives. This spec delivers `ReferenceRange` + `BloodPanel`; `Likert`
remains the DynamicFhir plan's.

Server methods follow Meteor v3 async + `function()` syntax; components follow theme
tokens and accessibility rules (keyboard-operable gauge/chip). Collection registered in
the three standard places (`Meteor.Collections`, client collections, autopublish).

## Curated first-cut analyte set (D4)

Common-panel + sex-dimorphic analytes; each LOINC **verified against the official LOINC
database at seed-authoring time** (the source table's `TODO: Verify LOINC codes` banner
and at least one known error — BUN mislabeled `3094-0`, actually 5-HIAA — are corrected
here, not carried):

- **CBC** — hemoglobin, hematocrit, RBC, WBC, platelets, MCV, MCH, MCHC, RDW
- **CMP / electrolytes** — Na, K, Cl, CO2/bicarbonate, BUN, creatinine, glucose,
  calcium, total protein, albumin, ALT, AST, ALP, bilirubin (total/direct)
- **Lipids** — total cholesterol, LDL, HDL, triglycerides *(graded bands)*
- **Thyroid** — TSH, free T4, free T3
- **Sex hormones** — testosterone (total/free/bioavailable), estradiol, FSH, LH, SHBG,
  progesterone, DHEA-S *(sex- and phase-dimorphic — the SPCU showcase)*
- **Iron studies** — ferritin, iron, TIBC, transferrin saturation
- **Other common** — HbA1c *(normal-high)*, vitamin D *(low-normal)*, vitamin B12,
  CRP *(normal-high)*, PSA *(informational)*

The esoteric long tail (antibody titers, 24-hr urine studies, coagulation esoterica)
is bulk-imported later against this same schema and is **out of scope** here.

## Testing strategy

- **Resolver (pure)** — unit tests are the core coverage. Cases: sex-only selection;
  population override beats base; per-patient jurisdiction beats deployment default;
  most-specific interval wins; wildcard fallback; each of the five `bandProfile`s;
  no-candidates → `null`; no-eligible-interval → informational; `matched`/`skipped`
  provenance correctness.
- **SPCU reader** — Observation SPCU preferred over Patient SPCU; `period` filtering by
  effective time; `intendedClinicalUse` scoping; fallback to `Patient.gender`; `specified`
  with `supportingInfo`.
- **Seed** — idempotent (re-seed does not duplicate; stable `source:layer:loinc` ids);
  every seeded record validates against the `ObservationDefinition` schema; parsing
  round-trips the curated rows correctly.
- **Registry** — lazy discovery finds a `ReferenceRangeSet`-exporting package and a
  settings override; absent sources degrade to base only.
- **Components** — `ReferenceRange` renders each profile and degrades safely
  (`null`/missing → empty, never throws); `jest-axe` clean on gauge + chip; `BloodPanel`
  batches (one `resolveBatch` call) and renders the provenance tooltip.

## Out of scope / forward dependencies

- **IG reshape (sub-project #1)** and **package split / terminology staging (#2)** — the
  IG will *document/profile/example* SPCU and *cite* these structured ranges, and decide
  which ValueSets/CodeSystems (incl. the `population` CodeSystem) ship in which extension.
  The IG's `VariationsOfSexualDevopment` misspelling is an IG-terminology concern flagged
  for #2, not touched here.
- **Country/population range packs** (e.g. `@node-on-fhir/reference-ranges-ng`) — this
  spec defines the injection contract they implement; authoring specific packs is later.
- **Therapeutic-window label sets** — modeled as label variants; authoring drug-level
  therapeutic ranges is later.
- **Long-tail analyte import** — bulk import of the ~200 esoteric rows against this schema.
- **`Likert` primitive** — owned by the DynamicFhir enhancement plan.

## File map

| File | Responsibility |
|------|----------------|
| `imports/lib/schemas/SimpleSchemas/ObservationDefinitions.js` | collection + R4 schema |
| `imports/data/reference-ranges/blood-panel.json` | checked-in base seed (curated, verified LOINCs) |
| `server/referenceRanges/seed.js` | idempotent startup seed (base layer) |
| `server/referenceRanges/registry.js` | lazy override discovery (Package registry + settings) |
| `server/referenceRanges/methods.js` | `referenceRanges.resolve` / `.resolveBatch` |
| `imports/lib/referenceRanges/resolveReferenceRange.js` | pure resolver |
| `imports/lib/referenceRanges/qualifiers.js` | population/jurisdiction constants + matchers |
| `imports/lib/sexForClinicalUse.js` | SPCU reader |
| `imports/ui/hooks/useResolvedReferenceRange.js` | client resolution hook |
| `imports/ui-fields/ReferenceRange.jsx` | pure 5-profile primitive (coord. DynamicFhir T3) |
| `imports/ui-modules/BloodPanel.jsx` | panel view + provenance tooltip |
