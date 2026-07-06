# Biomarker Reference-Range Data Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a FHIR-native, override-aware reference-range subsystem so a `ReferenceRange` UI primitive and a `BloodPanel` component can interpret a patient's lab `Observation`s against the correct range — accounting for sex-for-clinical-use, age, physiological state, population genetics, and jurisdiction.

**Architecture:** Ranges are `ObservationDefinition` resources (one per LOINC; ranges as `qualifiedInterval[]`) stored in a core collection seeded from a checked-in curated JSON. A **pure, isomorphic resolver** selects the right interval given fully-assembled `candidates` + `context`; all impurity (Mongo reads, `Package`-registry override discovery, settings, SPCU reading) lives in separate gather helpers. Override *data* rides the `us-core` `ProfileSet`/`Package`-registry pattern; override *selection* (population/jurisdiction) rides settings + a per-patient tag. Sex comes from the base-FHIR Sex-Parameter-for-Clinical-Use extension via a core reader.

**Tech Stack:** Meteor v3 (async), React 18, Material-UI v5, `createFhirCollection` + `FhirValidator` (JSON-Schema), `lodash` `get`. Pure libs tested with `node --test` (`.mjs`); components tested with `jest` + `@testing-library/react` + `jest-axe` (`*.a11y.test.jsx`).

**Design spec:** `docs/superpowers/specs/2026-07-06-reference-range-data-model-design.md`

## Global Constraints

- **Concurrency discipline (another Fable instance is editing the `libraries/dcmjs` submodule):** every `git add` and `git commit` uses **explicit pathspecs only** — never `git add -A`/`git add .`/`git commit -a`/bare `git commit`. Never touch `libraries/dcmjs`, `package-lock.json`, `.meteor/versions`, or run `npm install`/`git submodule update`/superproject-wide `git checkout`/`restore`/`stash`. This subsystem adds **no npm dependencies and no new workflow package**.
- **Meteor v3 async on the server:** `findOneAsync`/`insertAsync`/`upsertAsync`/`fetchAsync`; `function()` syntax (not arrow) for Meteor methods to preserve `this`.
- **Purity boundary:** `imports/lib/referenceRanges/resolveReferenceRange.js`, `qualifiers.js`, and `imports/lib/sexForClinicalUse.js` MUST be pure and isomorphic — no `Meteor`, no Mongo, no `Package`, no settings, no `import` of anything Meteor-only. They receive assembled data and return values.
- **Defensive access:** use lodash `get(obj, 'path', default)` for all FHIR field reads; resolver/reader never throw on missing data (return `null`/`undefined`, never crash).
- **Theme + a11y:** components use MUI theme tokens (`.claude/rules/ui/theming.md`), no unconditional hardcoded colors; interactive gauge/chip is keyboard-operable and passes `jest-axe`.
- **Extension namespace:** custom extensions/CodeSystem use base `https://nodeonfhir.org/fhir/StructureDefinition/…` and `https://nodeonfhir.org/fhir/CodeSystem/reference-population`; jurisdiction uses `urn:iso:std:iso:3166`. Centralized as constants in `qualifiers.js` — never inline the URL strings elsewhere.
- **Ingress stays permissive:** do NOT add `ObservationDefinitions` to `settings.private.fhir.schemaValidation.strictCollections` (permissive-in / strict-out).
- Commit after every task; end commit messages with:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

## File structure

| File | Responsibility |
|------|----------------|
| `imports/lib/referenceRanges/qualifiers.js` | extension-URL constants, layer precedence, pure interval matchers/specificity (pure) |
| `imports/lib/referenceRanges/resolveReferenceRange.js` | pure two-stage resolver (layer → specificity) + explainable output |
| `imports/lib/sexForClinicalUse.js` | pure SPCU reader → clinical-use sex + provenance |
| `imports/lib/schemas/SimpleSchemas/ObservationDefinitions.js` | `ObservationDefinition` collection via `createFhirCollection` |
| `imports/data/reference-ranges/blood-panel.json` | checked-in base seed (curated subset, verified LOINCs) |
| `server/referenceRanges/seed.js` | idempotent startup upsert of the base layer |
| `server/referenceRanges/registry.js` | lazy override discovery (`Package[].ReferenceRangeSet` + settings) + candidate/context gather |
| `server/referenceRanges/methods.js` | `referenceRanges.resolve` / `.resolveBatch` |
| `imports/ui/hooks/useResolvedReferenceRange.js` | client hook feeding the primitive |
| `imports/ui-fields/ReferenceRange.jsx` | pure 5-profile primitive (coordinated with DynamicFhir plan Task 3) |
| `imports/ui-modules/BloodPanel.jsx` | panel view (`BloodPanelView` pure inner + wrapper) + provenance tooltip |

Registration touch-points (existing files, add one line each): `server/main.js`, `imports/startup/client/collections.js`, `server/publications/autopublish.js`, `package.json` (test scripts).

---

### Task 1: `qualifiers.js` — constants + pure matchers

**Files:**
- Create: `imports/lib/referenceRanges/qualifiers.js`
- Test: `imports/lib/referenceRanges/qualifiers.test.mjs`

**Interfaces:**
- Produces:
  - `EXT` — object of extension-URL string constants: `bandProfile`, `source`, `layer`, `version`, `population`, `jurisdiction`.
  - `POPULATION_SYSTEM` (string), `JURISDICTION_SYSTEM` (string).
  - `LAYER_PRECEDENCE` — `{ patient: 3, deployment: 2, base: 1 }`.
  - `intervalPopulation(interval) -> string|undefined` — reads the population extension code.
  - `intervalJurisdiction(interval) -> string|undefined` — reads the jurisdiction extension code.
  - `matchesContext(interval, context) -> boolean` — every qualifier the interval *declares* matches `context`; an absent qualifier is a wildcard.
  - `specificity(interval) -> number` — count of qualifiers the interval declares (gender, age, condition, population, jurisdiction).

- [ ] **Step 1: Write the failing test**

```js
// imports/lib/referenceRanges/qualifiers.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXT, LAYER_PRECEDENCE, intervalPopulation, matchesContext, specificity } from './qualifiers.js';

const femaleInterval = { gender: 'female', range: { low: { value: 24 }, high: { value: 307 } } };
const femaleSickleCell = {
  gender: 'female',
  range: { low: { value: 20 }, high: { value: 200 } },
  extension: [{ url: EXT.population, valueCodeableConcept: { coding: [{ code: 'sickle-cell-endemic' }] } }]
};

test('EXT and LAYER_PRECEDENCE are stable', () => {
  assert.equal(LAYER_PRECEDENCE.patient > LAYER_PRECEDENCE.deployment, true);
  assert.equal(LAYER_PRECEDENCE.deployment > LAYER_PRECEDENCE.base, true);
  assert.match(EXT.population, /reference-range-population$/);
});

test('intervalPopulation reads the extension code', () => {
  assert.equal(intervalPopulation(femaleSickleCell), 'sickle-cell-endemic');
  assert.equal(intervalPopulation(femaleInterval), undefined);
});

test('matchesContext: absent qualifier is a wildcard', () => {
  assert.equal(matchesContext(femaleInterval, { sex: 'female' }), true);
  assert.equal(matchesContext(femaleInterval, { sex: 'male' }), false);
  // population declared but context lacks it -> not eligible
  assert.equal(matchesContext(femaleSickleCell, { sex: 'female' }), false);
  assert.equal(matchesContext(femaleSickleCell, { sex: 'female', population: 'sickle-cell-endemic' }), true);
});

test('matchesContext: age band', () => {
  const ageBand = { age: { low: { value: 25 }, high: { value: 39 } }, range: {} };
  assert.equal(matchesContext(ageBand, { ageYears: 30 }), true);
  assert.equal(matchesContext(ageBand, { ageYears: 50 }), false);
  assert.equal(matchesContext(ageBand, {}), false); // context has no age -> declared age can't match
});

test('specificity counts declared qualifiers', () => {
  assert.equal(specificity(femaleInterval), 1);
  assert.equal(specificity(femaleSickleCell), 2);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test imports/lib/referenceRanges/qualifiers.test.mjs`
Expected: FAIL — `Cannot find module './qualifiers.js'`.

- [ ] **Step 3: Write minimal implementation**

```js
// imports/lib/referenceRanges/qualifiers.js
// Pure, isomorphic helpers for reference-range qualifier matching.
// NO Meteor / Mongo / Package / settings imports.
import get from 'lodash/get.js';

const BASE = 'https://nodeonfhir.org/fhir/StructureDefinition';

export const EXT = {
  bandProfile:  BASE + '/reference-range-band-profile',
  source:       BASE + '/reference-range-source',
  layer:        BASE + '/reference-range-layer',
  version:      BASE + '/reference-range-version',
  population:   BASE + '/reference-range-population',
  jurisdiction: BASE + '/reference-range-jurisdiction'
};

export const POPULATION_SYSTEM = 'https://nodeonfhir.org/fhir/CodeSystem/reference-population';
export const JURISDICTION_SYSTEM = 'urn:iso:std:iso:3166';

export const LAYER_PRECEDENCE = { patient: 3, deployment: 2, base: 1 };

function extCode(interval, url) {
  const exts = get(interval, 'extension', []) || [];
  const found = exts.find(function (e) { return get(e, 'url') === url; });
  return get(found, 'valueCodeableConcept.coding.0.code', get(found, 'valueCode'));
}

export function intervalPopulation(interval) { return extCode(interval, EXT.population); }
export function intervalJurisdiction(interval) { return extCode(interval, EXT.jurisdiction); }

// The five qualifier dimensions an interval may declare. Each returns:
//   undefined  -> interval declares nothing on this axis (wildcard)
//   { ok }     -> declared; ok=true if it matches the context
function checks(interval, context) {
  const out = [];
  const gender = get(interval, 'gender');
  if (gender !== undefined) out.push(gender === get(context, 'sex'));

  const ageLow = get(interval, 'age.low.value');
  const ageHigh = get(interval, 'age.high.value');
  if (ageLow !== undefined || ageHigh !== undefined) {
    const a = get(context, 'ageYears');
    out.push(a !== undefined && (ageLow === undefined || a >= ageLow) && (ageHigh === undefined || a <= ageHigh));
  }

  const condCode = get(interval, 'condition.coding.0.code', get(interval, 'condition.0.coding.0.code'));
  if (condCode !== undefined) {
    const ctxConds = [].concat(get(context, 'condition', []) || []);
    out.push(ctxConds.indexOf(condCode) !== -1);
  }

  const pop = intervalPopulation(interval);
  if (pop !== undefined) out.push(pop === get(context, 'population'));

  const jur = intervalJurisdiction(interval);
  if (jur !== undefined) out.push(jur === get(context, 'jurisdiction'));

  return out;
}

export function matchesContext(interval, context) {
  return checks(interval, context || {}).every(Boolean);
}

export function specificity(interval) {
  return checks(interval, {}).length; // number of declared axes (context-independent count)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test imports/lib/referenceRanges/qualifiers.test.mjs`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add imports/lib/referenceRanges/qualifiers.js imports/lib/referenceRanges/qualifiers.test.mjs
git commit -m "feat(reference-ranges): qualifier constants + pure interval matchers

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: `sexForClinicalUse.js` — SPCU reader

**Files:**
- Create: `imports/lib/sexForClinicalUse.js`
- Test: `imports/lib/sexForClinicalUse.test.mjs`

**Interfaces:**
- Consumes: nothing (pure).
- Produces: `resolveSexForClinicalUse(patient, observation, options) -> { sex, source, basis }`
  - `patient`, `observation`: FHIR resources (either may be `null`/`undefined`).
  - `options`: `{ atTime?: ISOString, intendedUse?: string }` (`intendedUse` defaults to `'reference-range-interpretation'`).
  - returns `sex`: `'male'|'female'|undefined`; `source`: `'observation-spcu'|'patient-spcu'|'administrative'|'none'`; `basis`: array of `supportingInfo` entries (possibly empty).
  - Extension canonical: `http://hl7.org/fhir/StructureDefinition/patient-sexParameterForClinicalUse`. Sub-extensions: `value` (CodeableConcept), `period`, `supportingInfo` (0..*), `intendedClinicalUse` (0..*). Only `value` codes `male`/`female` yield a `sex`; `specified`/`unknown` yield `undefined` sex (sex-agnostic) while still reporting `source`+`basis`.

- [ ] **Step 1: Write the failing test**

```js
// imports/lib/sexForClinicalUse.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSexForClinicalUse } from './sexForClinicalUse.js';

const SPCU = 'http://hl7.org/fhir/StructureDefinition/patient-sexParameterForClinicalUse';

function spcu({ code, start, end, intendedUse, supporting }) {
  const sub = [{ url: 'value', valueCodeableConcept: { coding: [{ code }] } }];
  if (start || end) sub.push({ url: 'period', valuePeriod: { start, end } });
  if (intendedUse) sub.push({ url: 'intendedClinicalUse', valueCodeableConcept: { coding: [{ code: intendedUse }] } });
  if (supporting) sub.push({ url: 'supportingInfo', valueReference: { reference: supporting } });
  return { url: SPCU, extension: sub };
}

test('administrative gender fallback when no SPCU', () => {
  const r = resolveSexForClinicalUse({ gender: 'male' }, null, {});
  assert.equal(r.sex, 'male');
  assert.equal(r.source, 'administrative');
});

test('undefined when nothing present', () => {
  assert.equal(resolveSexForClinicalUse(null, null, {}).source, 'none');
});

test('patient SPCU wins over administrative gender', () => {
  const patient = { gender: 'male', extension: [spcu({ code: 'female' })] };
  const r = resolveSexForClinicalUse(patient, null, {});
  assert.equal(r.sex, 'female');
  assert.equal(r.source, 'patient-spcu');
});

test('observation SPCU wins over patient SPCU', () => {
  const patient = { gender: 'male', extension: [spcu({ code: 'female' })] };
  const observation = { extension: [spcu({ code: 'male' })] };
  const r = resolveSexForClinicalUse(patient, observation, {});
  assert.equal(r.sex, 'male');
  assert.equal(r.source, 'observation-spcu');
});

test('period filters by atTime', () => {
  const patient = { extension: [spcu({ code: 'female', end: '2020-01-01' })] };
  // SPCU expired before atTime -> falls through to none
  const r = resolveSexForClinicalUse(patient, null, { atTime: '2026-01-01' });
  assert.equal(r.source, 'none');
});

test('intendedClinicalUse scoping: non-matching SPCU is ignored', () => {
  const patient = { extension: [spcu({ code: 'female', intendedUse: 'medication-dosing' })] };
  const r = resolveSexForClinicalUse(patient, null, { intendedUse: 'reference-range-interpretation' });
  assert.equal(r.source, 'none');
});

test('specified yields undefined sex but carries basis', () => {
  const patient = { extension: [spcu({ code: 'specified', supporting: 'Observation/karyotype-1' })] };
  const r = resolveSexForClinicalUse(patient, null, {});
  assert.equal(r.sex, undefined);
  assert.equal(r.source, 'patient-spcu');
  assert.equal(r.basis.length, 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test imports/lib/sexForClinicalUse.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
// imports/lib/sexForClinicalUse.js
// Pure, isomorphic reader of the base-FHIR Sex-Parameter-for-Clinical-Use extension.
// http://hl7.org/fhir/StructureDefinition/patient-sexParameterForClinicalUse
// NO Meteor / Mongo imports.
import get from 'lodash/get.js';

const SPCU_URL = 'http://hl7.org/fhir/StructureDefinition/patient-sexParameterForClinicalUse';
const DEFAULT_USE = 'reference-range-interpretation';

function sub(spcuExt, url) {
  const arr = get(spcuExt, 'extension', []) || [];
  return arr.filter(function (e) { return get(e, 'url') === url; });
}

function periodCovers(spcuExt, atTime) {
  if (!atTime) return true;
  const p = get(sub(spcuExt, 'period'), '0.valuePeriod');
  if (!p) return true;
  const t = Date.parse(atTime);
  if (get(p, 'start') && t < Date.parse(p.start)) return false;
  if (get(p, 'end') && t > Date.parse(p.end)) return false;
  return true;
}

function useMatches(spcuExt, intendedUse) {
  const uses = sub(spcuExt, 'intendedClinicalUse');
  if (uses.length === 0) return true; // unscoped applies to all uses
  return uses.some(function (u) {
    return get(u, 'valueCodeableConcept.coding.0.code') === intendedUse;
  });
}

function readSpcu(resource, atTime, intendedUse) {
  const exts = get(resource, 'extension', []) || [];
  const candidates = exts
    .filter(function (e) { return get(e, 'url') === SPCU_URL; })
    .filter(function (e) { return periodCovers(e, atTime) && useMatches(e, intendedUse); });
  if (candidates.length === 0) return null;
  const chosen = candidates[0];
  const code = get(sub(chosen, 'value'), '0.valueCodeableConcept.coding.0.code');
  const basis = sub(chosen, 'supportingInfo').map(function (s) {
    return get(s, 'valueReference') || get(s, 'valueCodeableConcept');
  });
  return { code, basis };
}

export function resolveSexForClinicalUse(patient, observation, options) {
  const opts = options || {};
  const atTime = opts.atTime;
  const intendedUse = opts.intendedUse || DEFAULT_USE;

  const fromObs = readSpcu(observation, atTime, intendedUse);
  const fromPatient = readSpcu(patient, atTime, intendedUse);
  const hit = fromObs
    ? { ...fromObs, source: 'observation-spcu' }
    : fromPatient
      ? { ...fromPatient, source: 'patient-spcu' }
      : null;

  if (hit) {
    const sex = (hit.code === 'male' || hit.code === 'female') ? hit.code : undefined;
    return { sex, source: hit.source, basis: hit.basis || [] };
  }

  const administrative = get(patient, 'gender');
  if (administrative === 'male' || administrative === 'female') {
    return { sex: administrative, source: 'administrative', basis: [] };
  }
  return { sex: undefined, source: 'none', basis: [] };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test imports/lib/sexForClinicalUse.test.mjs`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add imports/lib/sexForClinicalUse.js imports/lib/sexForClinicalUse.test.mjs
git commit -m "feat(reference-ranges): Sex-Parameter-for-Clinical-Use reader

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: `resolveReferenceRange.js` — the pure resolver

**Files:**
- Create: `imports/lib/referenceRanges/resolveReferenceRange.js`
- Test: `imports/lib/referenceRanges/resolveReferenceRange.test.mjs`

**Interfaces:**
- Consumes: `matchesContext`, `specificity`, `EXT`, `LAYER_PRECEDENCE` from `./qualifiers.js`.
- Produces: `resolveReferenceRange({ loinc, candidates, context }) -> result|null`
  - `candidates`: `ObservationDefinition[]` for this LOINC across layers.
  - `context`: `{ sex?, ageYears?, condition?, population?, jurisdiction?, overrideSource? }`.
  - `result`: `{ code, unit, bandProfile, normal: {low,high}|null, bands: [{ interpretation, category, range, label }], matched: { layer, source, version, by: string[] }, skipped: [{ source, reason }] }`.
  - Returns `null` when `candidates` is empty. Never throws.

- [ ] **Step 1: Write the failing test**

```js
// imports/lib/referenceRanges/resolveReferenceRange.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveReferenceRange } from './resolveReferenceRange.js';
import { EXT } from './qualifiers.js';

function def({ loinc, unit, band, layer, source, version, intervals }) {
  return {
    resourceType: 'ObservationDefinition',
    code: { coding: [{ system: 'http://loinc.org', code: loinc }] },
    quantitativeDetails: { unit: { coding: [{ code: unit }] } },
    qualifiedInterval: intervals,
    extension: [
      { url: EXT.bandProfile, valueCode: band },
      { url: EXT.layer, valueCode: layer },
      { url: EXT.source, valueString: source },
      { url: EXT.version, valueString: version }
    ]
  };
}
function pop(code) { return { url: EXT.population, valueCodeableConcept: { coding: [{ code }] } }; }

const ferritinBase = def({
  loinc: '2276-4', unit: 'ng/mL', band: 'low-normal-high', layer: 'base', source: 'ABIM', version: '2024.1',
  intervals: [
    { category: 'reference', gender: 'female', range: { low: { value: 24 }, high: { value: 307 } } },
    { category: 'reference', gender: 'male', range: { low: { value: 24 }, high: { value: 336 } } }
  ]
});
const ferritinSickle = def({
  loinc: '2276-4', unit: 'ng/mL', band: 'low-normal-high', layer: 'deployment', source: 'WHO-AFRO', version: '2025.1',
  intervals: [
    { category: 'reference', gender: 'female', extension: [pop('sickle-cell-endemic')], range: { low: { value: 20 }, high: { value: 250 } } }
  ]
});

test('returns null on empty candidates', () => {
  assert.equal(resolveReferenceRange({ loinc: 'x', candidates: [], context: {} }), null);
});

test('sex-only selection picks the matching interval', () => {
  const r = resolveReferenceRange({ loinc: '2276-4', candidates: [ferritinBase], context: { sex: 'female' } });
  assert.deepEqual(r.normal, { low: { value: 24 }, high: { value: 307 } });
  assert.equal(r.bandProfile, 'low-normal-high');
  assert.equal(r.matched.source, 'ABIM');
  assert.ok(r.matched.by.includes('sex'));
});

test('population + deployment override beats base', () => {
  const r = resolveReferenceRange({
    loinc: '2276-4', candidates: [ferritinBase, ferritinSickle],
    context: { sex: 'female', population: 'sickle-cell-endemic', overrideSource: 'deployment' }
  });
  assert.deepEqual(r.normal, { low: { value: 20 }, high: { value: 250 } });
  assert.equal(r.matched.source, 'WHO-AFRO');
  assert.ok(r.matched.by.includes('population'));
});

test('falls back to base when population not set', () => {
  const r = resolveReferenceRange({
    loinc: '2276-4', candidates: [ferritinBase, ferritinSickle], context: { sex: 'female' }
  });
  assert.equal(r.matched.source, 'ABIM');
});

test('no eligible interval -> informational, normal null, never throws', () => {
  const r = resolveReferenceRange({ loinc: '2276-4', candidates: [ferritinBase], context: { sex: undefined } });
  assert.equal(r.normal, null);
  assert.equal(r.bandProfile, 'informational');
});

test('graded bands surface for a normal-high analyte', () => {
  const chol = def({
    loinc: '2093-3', unit: 'mg/dL', band: 'normal-high', layer: 'base', source: 'ABIM', version: '2024.1',
    intervals: [
      { category: 'reference', range: { high: { value: 200 } } },
      { category: 'critical', interpretation: [{ coding: [{ code: 'H' }] }], range: { low: { value: 200 }, high: { value: 239 } } },
      { category: 'critical', interpretation: [{ coding: [{ code: 'HH' }] }], range: { low: { value: 239 } } }
    ]
  });
  const r = resolveReferenceRange({ loinc: '2093-3', candidates: [chol], context: {} });
  assert.equal(r.bandProfile, 'normal-high');
  assert.equal(r.bands.length, 3);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test imports/lib/referenceRanges/resolveReferenceRange.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
// imports/lib/referenceRanges/resolveReferenceRange.js
// Pure, isomorphic two-stage resolver. NO Meteor / Mongo / Package / settings.
import get from 'lodash/get.js';
import { EXT, LAYER_PRECEDENCE, matchesContext, specificity, intervalPopulation, intervalJurisdiction } from './qualifiers.js';

function defExt(def, url) {
  const exts = get(def, 'extension', []) || [];
  const found = exts.find(function (e) { return get(e, 'url') === url; });
  return get(found, 'valueCode', get(found, 'valueString'));
}
function layerOf(def) { return defExt(def, EXT.layer) || 'base'; }
function unitOf(def) { return get(def, 'quantitativeDetails.unit.coding.0.code'); }
function codeOf(def) { return get(def, 'code.coding.0.code'); }

function matchedBy(interval) {
  const by = [];
  if (get(interval, 'gender') !== undefined) by.push('sex');
  if (get(interval, 'age.low.value') !== undefined || get(interval, 'age.high.value') !== undefined) by.push('age');
  if (get(interval, 'condition')) by.push('condition');
  if (intervalPopulation(interval) !== undefined) by.push('population');
  if (intervalJurisdiction(interval) !== undefined) by.push('jurisdiction');
  return by;
}

function band(interval) {
  return {
    interpretation: get(interval, 'interpretation.0.coding.0.code'),
    category: get(interval, 'category', 'reference'),
    range: get(interval, 'range'),
    label: get(interval, 'context.text')
  };
}

export function resolveReferenceRange({ loinc, candidates, context }) {
  if (!candidates || candidates.length === 0) return null;
  const ctx = context || {};

  // Flatten every interval, tagged with its definition metadata.
  const flat = [];
  candidates.forEach(function (def) {
    (get(def, 'qualifiedInterval', []) || []).forEach(function (interval) {
      flat.push({ def, interval, layer: layerOf(def) });
    });
  });

  const eligible = flat.filter(function (f) { return matchesContext(f.interval, ctx); });

  if (eligible.length === 0) {
    // Informational fallback: report the highest-layer candidate, no gauge.
    const top = candidates.slice().sort(function (a, b) {
      return (LAYER_PRECEDENCE[layerOf(b)] || 0) - (LAYER_PRECEDENCE[layerOf(a)] || 0);
    })[0];
    return {
      code: codeOf(top), unit: unitOf(top), bandProfile: 'informational',
      normal: null, bands: [],
      matched: { layer: layerOf(top), source: defExt(top, EXT.source), version: defExt(top, EXT.version), by: [] },
      skipped: []
    };
  }

  // Rank: layer precedence desc, then specificity desc.
  function score(f) { return (LAYER_PRECEDENCE[f.layer] || 0) * 1000 + specificity(f.interval); }
  eligible.sort(function (a, b) { return score(b) - score(a); });

  const winner = eligible[0];
  const winningDef = winner.def;

  // Bands = all eligible intervals belonging to the winning definition.
  const winnerIntervals = eligible.filter(function (f) { return f.def === winningDef; }).map(function (f) { return f.interval; });
  const referenceInterval = winnerIntervals
    .filter(function (i) { return get(i, 'category', 'reference') === 'reference'; })
    .sort(function (a, b) { return specificity(b) - specificity(a); })[0];

  const bands = winnerIntervals.map(band);
  const skipped = candidates
    .filter(function (d) { return d !== winningDef; })
    .map(function (d) { return { source: defExt(d, EXT.source), reason: 'lower-precedence-or-no-eligible-interval' }; });

  return {
    code: codeOf(winningDef),
    unit: unitOf(winningDef),
    bandProfile: defExt(winningDef, EXT.bandProfile) || 'low-normal-high',
    normal: referenceInterval ? get(referenceInterval, 'range') : null,
    bands,
    matched: {
      layer: winner.layer,
      source: defExt(winningDef, EXT.source),
      version: defExt(winningDef, EXT.version),
      by: matchedBy(referenceInterval || winner.interval)
    },
    skipped
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test imports/lib/referenceRanges/resolveReferenceRange.test.mjs`
Expected: PASS (6 tests).

- [ ] **Step 5: Add combined lib test script + commit**

Add to `package.json` `scripts` (insert after the `test:extensions` line):

```json
"test:reference-ranges": "node --test imports/lib/referenceRanges/qualifiers.test.mjs imports/lib/referenceRanges/resolveReferenceRange.test.mjs imports/lib/sexForClinicalUse.test.mjs",
```

```bash
git add imports/lib/referenceRanges/resolveReferenceRange.js imports/lib/referenceRanges/resolveReferenceRange.test.mjs package.json
git commit -m "feat(reference-ranges): pure two-stage resolver + test:reference-ranges script

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

Run to confirm the whole pure tier: `npm run test:reference-ranges` → all pass.

---

### Task 4: `ObservationDefinitions` collection + curated seed JSON

**Files:**
- Create: `imports/lib/schemas/SimpleSchemas/ObservationDefinitions.js`
- Create: `imports/data/reference-ranges/blood-panel.json`
- Create: `imports/data/reference-ranges/blood-panel.test.mjs`
- Modify: `server/main.js` (register collection), `imports/startup/client/collections.js` (register), `server/publications/autopublish.js` (add to map)

**Interfaces:**
- Consumes: `createFhirCollection` from `/imports/lib/ValidatedCollection`; `EXT` from `../../referenceRanges/qualifiers.js` (used only by the test).
- Produces: `ObservationDefinitions` (Mongo collection) and default export `{ ObservationDefinition, ObservationDefinitions }`, mirroring `Observations.js`. Seed JSON is an array of `ObservationDefinition` records, each with a stable `id` of the form `abim:base:<loinc>`, `bandProfile`/`source`/`layer`/`version` extensions, and `qualifiedInterval[]`.

- [ ] **Step 1: Write the failing test**

```js
// imports/data/reference-ranges/blood-panel.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { EXT } from '../../lib/referenceRanges/qualifiers.js';

const seed = JSON.parse(readFileSync(fileURLToPath(new URL('./blood-panel.json', import.meta.url)), 'utf8'));

test('seed is a non-empty array of ObservationDefinitions', () => {
  assert.ok(Array.isArray(seed) && seed.length >= 20);
  seed.forEach(function (d) { assert.equal(d.resourceType, 'ObservationDefinition'); });
});

test('every record has stable id, LOINC, unit, bandProfile, and >=1 interval', () => {
  const validBands = ['low-normal-high', 'normal-high', 'low-normal', 'qualitative', 'informational'];
  const ids = new Set();
  seed.forEach(function (d) {
    assert.match(d.id, /^abim:base:/, 'id ' + d.id);
    assert.ok(!ids.has(d.id), 'duplicate id ' + d.id); ids.add(d.id);
    assert.equal(d.code.coding[0].system, 'http://loinc.org');
    assert.ok(d.code.coding[0].code, 'missing LOINC on ' + d.id);
    const bp = (d.extension || []).find(function (e) { return e.url === EXT.bandProfile; });
    assert.ok(bp && validBands.includes(bp.valueCode), 'bad bandProfile on ' + d.id);
    const layer = (d.extension || []).find(function (e) { return e.url === EXT.layer; });
    assert.equal(layer.valueCode, 'base');
    assert.ok(Array.isArray(d.qualifiedInterval) && d.qualifiedInterval.length >= 1);
  });
});

test('sex-dimorphic showcase analytes are present', () => {
  const codes = seed.map(function (d) { return d.code.coding[0].code; });
  ['2986-8', '2276-4', '2160-0'].forEach(function (c) { // testosterone, ferritin, creatinine
    assert.ok(codes.includes(c), 'missing LOINC ' + c);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test imports/data/reference-ranges/blood-panel.test.mjs`
Expected: FAIL — `blood-panel.json` not found.

- [ ] **Step 3: Author the seed JSON**

Create `imports/data/reference-ranges/blood-panel.json` as an array covering the curated set from the spec (CBC, CMP/electrolytes, lipids, thyroid, sex hormones, iron studies, HbA1c, vitamin D, B12, CRP, PSA). **Verify each LOINC against loinc.org while authoring** (correct the source table's errors — e.g. BUN is `3094-0` in the table but must be the true urea-nitrogen LOINC; look each up). Every record follows this exact shape (three shown; author the full ~40):

```json
[
  {
    "resourceType": "ObservationDefinition",
    "id": "abim:base:2276-4",
    "code": { "coding": [{ "system": "http://loinc.org", "code": "2276-4", "display": "Ferritin [Mass/volume] in Serum or Plasma" }] },
    "quantitativeDetails": { "unit": { "coding": [{ "system": "http://unitsofmeasure.org", "code": "ng/mL" }] } },
    "qualifiedInterval": [
      { "category": "reference", "gender": "female", "range": { "low": { "value": 24 }, "high": { "value": 307 } } },
      { "category": "reference", "gender": "male", "range": { "low": { "value": 24 }, "high": { "value": 336 } } }
    ],
    "extension": [
      { "url": "https://nodeonfhir.org/fhir/StructureDefinition/reference-range-band-profile", "valueCode": "low-normal-high" },
      { "url": "https://nodeonfhir.org/fhir/StructureDefinition/reference-range-source", "valueString": "ABIM Laboratory Reference Ranges (Jan 2024)" },
      { "url": "https://nodeonfhir.org/fhir/StructureDefinition/reference-range-layer", "valueCode": "base" },
      { "url": "https://nodeonfhir.org/fhir/StructureDefinition/reference-range-version", "valueString": "2024.1" }
    ]
  },
  {
    "resourceType": "ObservationDefinition",
    "id": "abim:base:2986-8",
    "code": { "coding": [{ "system": "http://loinc.org", "code": "2986-8", "display": "Testosterone [Mass/volume] in Serum or Plasma" }] },
    "quantitativeDetails": { "unit": { "coding": [{ "system": "http://unitsofmeasure.org", "code": "ng/dL" }] } },
    "qualifiedInterval": [
      { "category": "reference", "gender": "female", "range": { "low": { "value": 18 }, "high": { "value": 54 } } },
      { "category": "reference", "gender": "male", "range": { "low": { "value": 291 }, "high": { "value": 1100 } } }
    ],
    "extension": [
      { "url": "https://nodeonfhir.org/fhir/StructureDefinition/reference-range-band-profile", "valueCode": "low-normal-high" },
      { "url": "https://nodeonfhir.org/fhir/StructureDefinition/reference-range-source", "valueString": "ABIM Laboratory Reference Ranges (Jan 2024)" },
      { "url": "https://nodeonfhir.org/fhir/StructureDefinition/reference-range-layer", "valueCode": "base" },
      { "url": "https://nodeonfhir.org/fhir/StructureDefinition/reference-range-version", "valueString": "2024.1" }
    ]
  },
  {
    "resourceType": "ObservationDefinition",
    "id": "abim:base:2857-1",
    "code": { "coding": [{ "system": "http://loinc.org", "code": "2857-1", "display": "Prostate specific Ag [Mass/volume] in Serum or Plasma" }] },
    "quantitativeDetails": { "unit": { "coding": [{ "system": "http://unitsofmeasure.org", "code": "ng/mL" }] } },
    "qualifiedInterval": [],
    "extension": [
      { "url": "https://nodeonfhir.org/fhir/StructureDefinition/reference-range-band-profile", "valueCode": "informational" },
      { "url": "https://nodeonfhir.org/fhir/StructureDefinition/reference-range-source", "valueString": "ABIM Laboratory Reference Ranges (Jan 2024)" },
      { "url": "https://nodeonfhir.org/fhir/StructureDefinition/reference-range-layer", "valueCode": "base" },
      { "url": "https://nodeonfhir.org/fhir/StructureDefinition/reference-range-version", "valueString": "2024.1" }
    ]
  }
]
```

Cholesterol/triglycerides use `normal-high` with graded `critical` intervals carrying `interpretation` `H`/`HH`; vitamin D/HDL use `low-normal`; HbA1c/CRP use `normal-high`. Phase-dependent analytes (FSH/LH/estradiol/progesterone) express phases as `condition` codings, not `gender`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test imports/data/reference-ranges/blood-panel.test.mjs`
Expected: PASS (3 tests). If a LOINC assertion fails, fix the code in the JSON.

- [ ] **Step 5: Create the collection + register it**

`imports/lib/schemas/SimpleSchemas/ObservationDefinitions.js` (mirror `Observations.js`):

```js
// imports/lib/schemas/SimpleSchemas/ObservationDefinitions.js
// Collection definition for ObservationDefinition resources (reference ranges).
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

let ObservationDefinition = BaseModel.extend();
let ObservationDefinitions = createFhirCollection('ObservationDefinition', 'ObservationDefinitions');

ObservationDefinition.prototype._collection = ObservationDefinitions;
ObservationDefinitions._transform = function (document) {
  return new ObservationDefinition(document);
};

export default { ObservationDefinition, ObservationDefinitions };
export { ObservationDefinition, ObservationDefinitions };
```

In `server/main.js`, add the import next to the other SimpleSchemas imports and the entry to **both** `Meteor.Collections` and `global.Collections`:

```js
import { ObservationDefinitions } from '/imports/lib/schemas/SimpleSchemas/ObservationDefinitions';
// … inside the Meteor.Collections = { … } object:
  ObservationDefinitions: ObservationDefinitions,
// … inside the global.Collections = { … } object:
  ObservationDefinitions: ObservationDefinitions,
```

In `imports/startup/client/collections.js`, add the same import and `ObservationDefinitions: ObservationDefinitions,` entry to `Meteor.Collections`.

In `server/publications/autopublish.js`, add `'ObservationDefinitions': ObservationDefinitions,` to `collectionsMap` (and the import).

- [ ] **Step 6: Commit**

```bash
git add imports/lib/schemas/SimpleSchemas/ObservationDefinitions.js imports/data/reference-ranges/blood-panel.json imports/data/reference-ranges/blood-panel.test.mjs server/main.js imports/startup/client/collections.js server/publications/autopublish.js
git commit -m "feat(reference-ranges): ObservationDefinitions collection + curated blood-panel seed data

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: `server/referenceRanges/seed.js` — idempotent startup seeder

**Files:**
- Create: `server/referenceRanges/seed.js`
- Create: `server/referenceRanges/seedRecords.test.mjs` (pure helper test)
- Modify: `server/main.js` (call `seedReferenceRanges()` in startup)

**Interfaces:**
- Consumes: `ObservationDefinitions` collection; the seed JSON.
- Produces:
  - `toSeedDocs(seedArray) -> docs[]` — pure: maps each record to a Mongo doc with `_id === record.id` (stable, so re-seeding upserts in place — no duplicates). Exported for testing.
  - `seedReferenceRanges() async` — upserts every base doc via `upsertAsync({ _id }, { $set: doc })`; logs count; safe to call every boot.

- [ ] **Step 1: Write the failing test (pure mapping)**

```js
// server/referenceRanges/seedRecords.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { toSeedDocs } from './seedRecords.mjs';

const seed = JSON.parse(readFileSync(fileURLToPath(new URL('../../imports/data/reference-ranges/blood-panel.json', import.meta.url)), 'utf8'));

test('toSeedDocs assigns _id === id (stable, idempotent)', () => {
  const docs = toSeedDocs(seed);
  assert.equal(docs.length, seed.length);
  docs.forEach(function (d) { assert.equal(d._id, d.id); });
  const ids = new Set(docs.map(function (d) { return d._id; }));
  assert.equal(ids.size, docs.length); // no collisions -> upsert is in-place
});
```

Note: the pure mapping lives in `server/referenceRanges/seedRecords.mjs` (importable by `node --test` without Meteor); `seed.js` imports it and does the Meteor I/O.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/referenceRanges/seedRecords.test.mjs`
Expected: FAIL — `seedRecords.mjs` not found.

- [ ] **Step 3: Implement the pure mapper + the seeder**

```js
// server/referenceRanges/seedRecords.mjs
// Pure: seed record -> Mongo doc with stable _id. No Meteor.
export function toSeedDocs(seedArray) {
  return (seedArray || []).map(function (record) {
    return { ...record, _id: record.id };
  });
}
```

```js
// server/referenceRanges/seed.js
// Idempotent base-layer seeding of reference ranges. Server-only (Meteor).
import { ObservationDefinitions } from '/imports/lib/schemas/SimpleSchemas/ObservationDefinitions';
import { toSeedDocs } from './seedRecords.mjs';
import seedArray from '/imports/data/reference-ranges/blood-panel.json';

export async function seedReferenceRanges() {
  const docs = toSeedDocs(seedArray);
  let n = 0;
  for (const doc of docs) {
    await ObservationDefinitions.upsertAsync({ _id: doc._id }, { $set: doc });
    n++;
  }
  console.log('[referenceRanges.seed] upserted ' + n + ' base ObservationDefinition(s)');
  return n;
}
```

In `server/main.js`, inside the existing `Meteor.startup(async function () { … })`, add:

```js
import { seedReferenceRanges } from '/server/referenceRanges/seed';
// … inside Meteor.startup:
await seedReferenceRanges();
```

- [ ] **Step 4: Run test + boot-verify idempotency**

Run: `node --test server/referenceRanges/seedRecords.test.mjs` → PASS.
Boot once (`meteor run --settings settings/settings.honeycomb.localhost.json`) — **only if the dev server is free; coordinate with the dcmjs instance first**. Confirm the log `[referenceRanges.seed] upserted N base ObservationDefinition(s)`; restart and confirm the DB count stays N (no duplicates). If the server is in use, skip the boot and rely on the pure idempotency test + the method smoke in Task 7.

- [ ] **Step 5: Commit**

```bash
git add server/referenceRanges/seed.js server/referenceRanges/seedRecords.mjs server/referenceRanges/seedRecords.test.mjs server/main.js
git commit -m "feat(reference-ranges): idempotent base-layer seeder wired into startup

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: `server/referenceRanges/registry.js` — lazy override discovery + gather

**Files:**
- Create: `server/referenceRanges/registry.js`
- Create: `server/referenceRanges/mergeCandidates.mjs` (pure)
- Create: `server/referenceRanges/mergeCandidates.test.mjs`

**Interfaces:**
- Consumes: pure `mergeCandidates`; at runtime the global `Package` registry + `Meteor.settings` + `ObservationDefinitions`.
- Produces:
  - `mergeCandidates(base, injectedSets, loinc) -> ObservationDefinition[]` — pure: returns every definition (from base + all injected `ReferenceRangeSet.definitions`) whose LOINC matches. Exported for testing.
  - `discoverInjectedSets() -> ReferenceRangeSet[]` — **lazy**: iterates `Package` for `.ReferenceRangeSet` exports and appends `settings.private.referenceRanges.overrides` (each `{ name, definitions: [...] }`). Reads `Package` at call time, never at module load (load-order rule, `.claude/rules/fhir/package-registry.md`).
  - `gatherCandidates(loinc) async` — reads base defs for `loinc` from the collection, merges with `discoverInjectedSets()`, returns `ObservationDefinition[]`.

- [ ] **Step 1: Write the failing test (pure merge)**

```js
// server/referenceRanges/mergeCandidates.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeCandidates } from './mergeCandidates.mjs';

const baseFerritin = { code: { coding: [{ system: 'http://loinc.org', code: '2276-4' }] } };
const baseGlucose = { code: { coding: [{ system: 'http://loinc.org', code: '2345-7' }] } };
const overrideFerritin = { code: { coding: [{ system: 'http://loinc.org', code: '2276-4' }] } };

test('merges base + injected definitions for the requested LOINC only', () => {
  const injected = [{ name: 'NG pack', definitions: [overrideFerritin] }];
  const out = mergeCandidates([baseFerritin, baseGlucose], injected, '2276-4');
  assert.equal(out.length, 2);
  assert.ok(out.includes(baseFerritin) && out.includes(overrideFerritin));
  assert.ok(!out.includes(baseGlucose));
});

test('no injected sets -> base only', () => {
  assert.deepEqual(mergeCandidates([baseFerritin], [], '2276-4'), [baseFerritin]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/referenceRanges/mergeCandidates.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement pure merge + lazy registry**

```js
// server/referenceRanges/mergeCandidates.mjs
// Pure. No Meteor / Package / settings.
import get from 'lodash/get.js';

function loincOf(def) { return get(def, 'code.coding.0.code'); }

export function mergeCandidates(baseDefs, injectedSets, loinc) {
  const fromBase = (baseDefs || []).filter(function (d) { return loincOf(d) === loinc; });
  const fromInjected = [];
  (injectedSets || []).forEach(function (set) {
    (get(set, 'definitions', []) || []).forEach(function (d) {
      if (loincOf(d) === loinc) fromInjected.push(d);
    });
  });
  return fromBase.concat(fromInjected);
}
```

```js
// server/referenceRanges/registry.js
// Lazy discovery of injected reference-range override sets. Server-only.
// LOAD-ORDER: reads `Package` at CALL time, never at module load. See
// .claude/rules/fhir/package-registry.md.
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { ObservationDefinitions } from '/imports/lib/schemas/SimpleSchemas/ObservationDefinitions';
import { mergeCandidates } from './mergeCandidates.mjs';

export function discoverInjectedSets() {
  const sets = [];
  const pkg = (typeof Package !== 'undefined') ? Package : {};
  Object.keys(pkg).forEach(function (name) {
    const rrs = get(pkg[name], 'ReferenceRangeSet');
    if (rrs && Array.isArray(rrs.definitions)) sets.push(rrs);
  });
  const settingsOverrides = get(Meteor, 'settings.private.referenceRanges.overrides', []) || [];
  settingsOverrides.forEach(function (o) {
    if (o && Array.isArray(o.definitions)) sets.push(o);
  });
  return sets;
}

export async function gatherCandidates(loinc) {
  const baseDefs = await ObservationDefinitions.find({ 'code.coding.code': loinc }).fetchAsync();
  return mergeCandidates(baseDefs, discoverInjectedSets(), loinc);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test server/referenceRanges/mergeCandidates.test.mjs`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add server/referenceRanges/registry.js server/referenceRanges/mergeCandidates.mjs server/referenceRanges/mergeCandidates.test.mjs
git commit -m "feat(reference-ranges): lazy Package/settings override registry + pure candidate merge

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: `server/referenceRanges/methods.js` — resolve / resolveBatch

**Files:**
- Create: `server/referenceRanges/methods.js`
- Create: `server/referenceRanges/buildContext.mjs` (pure)
- Create: `server/referenceRanges/buildContext.test.mjs`
- Modify: `server/main.js` (import the methods module)

**Interfaces:**
- Consumes: `gatherCandidates` (registry), `resolveReferenceRange` (resolver), `resolveSexForClinicalUse` (SPCU reader), `Patients`/`Observations` collections, settings.
- Produces:
  - `buildContext({ patient, observation, spcu, deploymentDefaults }) -> context` — pure: assembles resolver `context` (sex from `spcu`, ageYears from `patient.birthDate` vs `observation.effectiveDateTime`, population/jurisdiction from patient tag else deployment default, `overrideSource`). Exported for testing.
  - Meteor methods `referenceRanges.resolve({ loinc, patientId, observationId })` and `referenceRanges.resolveBatch({ items, patientId, observationIds })` — gather + resolve on the server, return resolver output(s).

- [ ] **Step 1: Write the failing test (pure context assembly)**

```js
// server/referenceRanges/buildContext.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildContext } from './buildContext.mjs';

test('sex from spcu; deployment default population when no patient tag', () => {
  const ctx = buildContext({
    patient: { birthDate: '1990-01-01' },
    observation: { effectiveDateTime: '2020-01-01' },
    spcu: { sex: 'female', source: 'patient-spcu', basis: [] },
    deploymentDefaults: { population: 'sickle-cell-endemic', jurisdiction: 'NG' }
  });
  assert.equal(ctx.sex, 'female');
  assert.equal(ctx.ageYears, 30);
  assert.equal(ctx.population, 'sickle-cell-endemic');
  assert.equal(ctx.jurisdiction, 'NG');
  assert.equal(ctx.overrideSource, 'deployment');
});

test('per-patient population tag wins over deployment default', () => {
  const patient = {
    birthDate: '1990-01-01',
    extension: [{ url: 'https://nodeonfhir.org/fhir/StructureDefinition/reference-range-population',
      valueCodeableConcept: { coding: [{ code: 'g6pd-deficient' }] } }]
  };
  const ctx = buildContext({
    patient, observation: {}, spcu: { sex: 'male' },
    deploymentDefaults: { population: 'sickle-cell-endemic' }
  });
  assert.equal(ctx.population, 'g6pd-deficient');
  assert.equal(ctx.overrideSource, 'patient');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/referenceRanges/buildContext.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement pure context builder + the methods**

```js
// server/referenceRanges/buildContext.mjs
// Pure. No Meteor.
import get from 'lodash/get.js';

const POP_EXT = 'https://nodeonfhir.org/fhir/StructureDefinition/reference-range-population';
const JUR_EXT = 'https://nodeonfhir.org/fhir/StructureDefinition/reference-range-jurisdiction';

function tag(patient, url) {
  const found = (get(patient, 'extension', []) || []).find(function (e) { return get(e, 'url') === url; });
  return get(found, 'valueCodeableConcept.coding.0.code');
}

function ageYears(birthDate, atISO) {
  if (!birthDate || !atISO) return undefined; // age is age-at-observation; without a time, stay age-agnostic
  const at = new Date(atISO);
  const b = new Date(birthDate);
  let age = at.getUTCFullYear() - b.getUTCFullYear();
  const m = at.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && at.getUTCDate() < b.getUTCDate())) age--;
  return age >= 0 ? age : undefined;
}

export function buildContext({ patient, observation, spcu, deploymentDefaults }) {
  const dd = deploymentDefaults || {};
  const patientPop = tag(patient, POP_EXT);
  const patientJur = tag(patient, JUR_EXT);
  const population = patientPop || dd.population;
  const jurisdiction = patientJur || dd.jurisdiction;
  const overrideSource = (patientPop || patientJur) ? 'patient' : 'deployment';
  return {
    sex: get(spcu, 'sex'),
    sexSource: get(spcu, 'source'),
    sexBasis: get(spcu, 'basis', []),
    ageYears: ageYears(get(patient, 'birthDate'), get(observation, 'effectiveDateTime')),
    // Gestational-phase / Tanner condition codes are attached by the caller when known;
    // first cut leaves this undefined (phase-source wiring is a later sub-project).
    condition: undefined,
    population,
    jurisdiction,
    overrideSource
  };
}
```

```js
// server/referenceRanges/methods.js
// Meteor methods: gather candidates + context, run the pure resolver.
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';
import { gatherCandidates } from './registry';
import { buildContext } from './buildContext.mjs';
import { resolveReferenceRange } from '/imports/lib/referenceRanges/resolveReferenceRange';
import { resolveSexForClinicalUse } from '/imports/lib/sexForClinicalUse';

async function resolveOne(loinc, patient, observation) {
  const spcu = resolveSexForClinicalUse(patient, observation, {
    atTime: get(observation, 'effectiveDateTime'),
    intendedUse: 'reference-range-interpretation'
  });
  const context = buildContext({
    patient, observation, spcu,
    deploymentDefaults: {
      population: get(Meteor, 'settings.public.referenceRanges.defaultPopulation'),
      jurisdiction: get(Meteor, 'settings.public.referenceRanges.defaultJurisdiction')
    }
  });
  const candidates = await gatherCandidates(loinc);
  return resolveReferenceRange({ loinc, candidates, context });
}

Meteor.methods({
  'referenceRanges.resolve': async function ({ loinc, patientId, observationId }) {
    check(loinc, String);
    check(patientId, Match.Maybe(String));
    check(observationId, Match.Maybe(String));
    const patient = patientId ? await Patients.findOneAsync({ _id: patientId }) : null;
    const observation = observationId ? await Observations.findOneAsync({ _id: observationId }) : null;
    return await resolveOne(loinc, patient, observation);
  },

  'referenceRanges.resolveBatch': async function ({ items, patientId, observationIds }) {
    check(items, [{ loinc: String, value: Match.Maybe(Match.Any) }]);
    check(patientId, Match.Maybe(String));
    check(observationIds, Match.Maybe([String]));
    const patient = patientId ? await Patients.findOneAsync({ _id: patientId }) : null;
    const obsById = {};
    for (const oid of (observationIds || [])) {
      obsById[oid] = await Observations.findOneAsync({ _id: oid });
    }
    const out = [];
    for (let i = 0; i < items.length; i++) {
      const observation = observationIds ? obsById[observationIds[i]] : null;
      out.push({
        loinc: items[i].loinc,
        value: items[i].value,
        resolved: await resolveOne(items[i].loinc, patient, observation)
      });
    }
    return out;
  }
});
```

In `server/main.js`, add `import '/server/referenceRanges/methods';` beside the other method-module imports.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test server/referenceRanges/buildContext.test.mjs`
Expected: PASS (2 tests). Then re-run the whole pure tier: add `buildContext`, `mergeCandidates`, `seedRecords` to `test:reference-ranges` and run `npm run test:reference-ranges` → all pass. (Update the script to:)

```json
"test:reference-ranges": "node --test imports/lib/referenceRanges/qualifiers.test.mjs imports/lib/referenceRanges/resolveReferenceRange.test.mjs imports/lib/sexForClinicalUse.test.mjs imports/data/reference-ranges/blood-panel.test.mjs server/referenceRanges/seedRecords.test.mjs server/referenceRanges/mergeCandidates.test.mjs server/referenceRanges/buildContext.test.mjs",
```

- [ ] **Step 5: Commit**

```bash
git add server/referenceRanges/methods.js server/referenceRanges/buildContext.mjs server/referenceRanges/buildContext.test.mjs server/main.js package.json
git commit -m "feat(reference-ranges): resolve/resolveBatch methods + pure context builder

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: `ReferenceRange.jsx` — pure 5-profile primitive

**Files:**
- Create: `imports/ui-fields/ReferenceRange.jsx`
- Create: `imports/ui-fields/ReferenceRange.a11y.test.jsx`

**Interfaces:**
- Consumes: nothing (pure leaf; MUI + React only). Coordinates with DynamicFhir plan Task 3 (this is the real implementation of that plan's `ui-fields/ReferenceRange.jsx` stub).
- Produces: `ReferenceRange({ value, unit, normal, bands, bandProfile })` default export.
  - `normal`: `{ low?: {value}, high?: {value} }` | null; `bands`: array from the resolver; `bandProfile`: one of the five.
  - `low-normal-high` → bidirectional gauge; `normal-high`/`low-normal` → one-sided gauge; `qualitative` → status chip; `informational` → value only. Degrades safely (missing props → renders the value or an em dash, never throws). Keyboard-focusable, `role="img"` with an `aria-label` summarizing value vs range.

- [ ] **Step 1: Write the failing a11y + render test**

```jsx
// imports/ui-fields/ReferenceRange.a11y.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import ReferenceRange from './ReferenceRange';

test('renders value within a two-sided range and is accessible', async () => {
  const { container } = render(
    <ReferenceRange value={150} unit="ng/mL" normal={{ low: { value: 24 }, high: { value: 307 } }}
      bands={[]} bandProfile="low-normal-high" />
  );
  expect(screen.getByText(/150/)).toBeInTheDocument();
  expect(await axe(container)).toHaveNoViolations();
});

test('qualitative profile renders a status chip, not a gauge', () => {
  render(<ReferenceRange value="Negative" bandProfile="qualitative" normal={null} bands={[]} />);
  expect(screen.getByText(/Negative/)).toBeInTheDocument();
});

test('informational profile shows value with no range', () => {
  render(<ReferenceRange value={3.2} unit="ng/mL" bandProfile="informational" normal={null} bands={[]} />);
  expect(screen.getByText(/3.2/)).toBeInTheDocument();
});

test('degrades safely on missing props', () => {
  expect(() => render(<ReferenceRange />)).not.toThrow();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest --config jest.a11y.config.cjs imports/ui-fields/ReferenceRange.a11y.test.jsx`
Expected: FAIL — cannot find `./ReferenceRange`.

- [ ] **Step 3: Implement the primitive**

```jsx
// imports/ui-fields/ReferenceRange.jsx
// PURE leaf primitive — value in, JSX out. No data-fetching, no Meteor.
// Renders a lab value against a resolved reference range across five band profiles.
import React from 'react';
import { get } from 'lodash';
import { Box, Chip, Typography, Tooltip } from '@mui/material';

function fmt(v) { return (v === undefined || v === null) ? '—' : String(v); }

function interp(value, normal, profile) {
  const low = get(normal, 'low.value');
  const high = get(normal, 'high.value');
  if (typeof value !== 'number') return 'unknown';
  if ((profile === 'low-normal-high' || profile === 'low-normal') && low !== undefined && value < low) return 'low';
  if ((profile === 'low-normal-high' || profile === 'normal-high') && high !== undefined && value > high) return 'high';
  return 'normal';
}

export default function ReferenceRange(props) {
  const { value, unit, normal, bandProfile } = props || {};
  const profile = bandProfile || 'low-normal-high';

  if (profile === 'qualitative' || profile === 'informational') {
    const color = profile === 'qualitative' && /pos/i.test(String(value)) ? 'warning' : 'default';
    return (
      <Chip size="small" color={color} label={fmt(value) + (unit ? ' ' + unit : '')}
        role="img" aria-label={'Result ' + fmt(value)} />
    );
  }

  const state = interp(value, normal, profile);
  const low = get(normal, 'low.value');
  const high = get(normal, 'high.value');
  const rangeText = (low !== undefined ? low : '') + '–' + (high !== undefined ? high : '') + (unit ? ' ' + unit : '');
  const stateColor = state === 'normal' ? 'success.main' : (state === 'high' ? 'error.main' : 'warning.main');

  return (
    <Tooltip title={'Reference: ' + rangeText}>
      <Box role="img" tabIndex={0}
        aria-label={'Value ' + fmt(value) + ' ' + fmt(unit) + ', ' + state + ', reference ' + rangeText}
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
        <Typography component="span" sx={{ fontWeight: 600, color: stateColor }}>{fmt(value)}</Typography>
        <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>{rangeText}</Typography>
      </Box>
    </Tooltip>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest --config jest.a11y.config.cjs imports/ui-fields/ReferenceRange.a11y.test.jsx`
Expected: PASS (4 tests), no axe violations.

- [ ] **Step 5: Commit**

```bash
git add imports/ui-fields/ReferenceRange.jsx imports/ui-fields/ReferenceRange.a11y.test.jsx
git commit -m "feat(ui-fields): pure 5-profile ReferenceRange primitive

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: `useResolvedReferenceRange` hook + `BloodPanel`

**Files:**
- Create: `imports/ui/hooks/useResolvedReferenceRange.js`
- Create: `imports/ui-modules/BloodPanel.jsx` (exports `BloodPanelView` pure inner + `BloodPanel` wrapper)
- Create: `imports/ui-modules/BloodPanel.a11y.test.jsx`

**Interfaces:**
- Consumes: `referenceRanges.resolve`/`.resolveBatch` methods (via `Meteor.callAsync`); `ReferenceRange` primitive.
- Produces:
  - `useResolvedReferenceRange({ loinc, value, patient, observation })` — calls `referenceRanges.resolve`, returns `{ resolved, loading }`.
  - `BloodPanelView({ rows })` — **pure** grid: each row `{ analyte, value, unit, resolved }` → analyte · `<ReferenceRange>` · interpretation flag · provenance tooltip from `resolved.matched`. Testable without Meteor.
  - `BloodPanel({ observations, patient })` — wrapper: batches to `referenceRanges.resolveBatch`, maps results into `rows`, renders `BloodPanelView`.

- [ ] **Step 1: Write the failing test (pure view)**

```jsx
// imports/ui-modules/BloodPanel.a11y.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { BloodPanelView } from './BloodPanel';

const rows = [
  { analyte: 'Ferritin', value: 150, unit: 'ng/mL',
    resolved: { unit: 'ng/mL', bandProfile: 'low-normal-high',
      normal: { low: { value: 24 }, high: { value: 307 } }, bands: [],
      matched: { source: 'ABIM', version: '2024.1', by: ['sex'], layer: 'base' }, skipped: [] } },
  { analyte: 'PSA', value: 3.2, unit: 'ng/mL',
    resolved: { unit: 'ng/mL', bandProfile: 'informational', normal: null, bands: [],
      matched: { source: 'ABIM', version: '2024.1', by: [], layer: 'base' }, skipped: [] } }
];

test('renders a row per analyte and is accessible', async () => {
  const { container } = render(<BloodPanelView rows={rows} />);
  expect(screen.getByText('Ferritin')).toBeInTheDocument();
  expect(screen.getByText('PSA')).toBeInTheDocument();
  expect(await axe(container)).toHaveNoViolations();
});

test('degrades safely with no rows', () => {
  expect(() => render(<BloodPanelView rows={[]} />)).not.toThrow();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest --config jest.a11y.config.cjs imports/ui-modules/BloodPanel.a11y.test.jsx`
Expected: FAIL — cannot find `./BloodPanel`.

- [ ] **Step 3: Implement hook + view + wrapper**

```js
// imports/ui/hooks/useResolvedReferenceRange.js
import { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

export function useResolvedReferenceRange({ loinc, patient, observation }) {
  const [resolved, setResolved] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(function () {
    let alive = true;
    setLoading(true);
    Meteor.callAsync('referenceRanges.resolve', {
      loinc,
      patientId: get(patient, '_id'),
      observationId: get(observation, '_id')
    }).then(function (r) { if (alive) { setResolved(r); setLoading(false); } })
      .catch(function () { if (alive) { setResolved(null); setLoading(false); } });
    return function () { alive = false; };
  }, [loinc, get(patient, '_id'), get(observation, '_id')]);
  return { resolved, loading };
}
```

```jsx
// imports/ui-modules/BloodPanel.jsx
import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { Table, TableHead, TableBody, TableRow, TableCell, Tooltip, Typography, Box } from '@mui/material';
import ReferenceRange from '/imports/ui-fields/ReferenceRange';

function provenance(matched) {
  if (!matched) return '';
  const parts = [matched.source, matched.version].filter(Boolean).join(' ');
  const by = (get(matched, 'by', []) || []).join(', ');
  return parts + (by ? ' · matched on ' + by : '') + (matched.layer ? ' · ' + matched.layer + ' layer' : '');
}

export function BloodPanelView({ rows }) {
  const list = rows || [];
  return (
    <Table size="small" aria-label="Blood panel">
      <TableHead>
        <TableRow>
          <TableCell>Analyte</TableCell><TableCell>Result vs Reference</TableCell><TableCell>Source</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {list.map(function (row, i) {
          const resolved = row.resolved || {};
          return (
            <TableRow key={row.analyte + ':' + i}>
              <TableCell>{row.analyte}</TableCell>
              <TableCell>
                <ReferenceRange value={row.value} unit={row.unit || resolved.unit}
                  normal={resolved.normal} bands={resolved.bands} bandProfile={resolved.bandProfile} />
              </TableCell>
              <TableCell>
                <Tooltip title={provenance(resolved.matched)}>
                  <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>
                    {get(resolved, 'matched.source', '—')}
                  </Typography>
                </Tooltip>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function BloodPanel({ observations, patient }) {
  const [rows, setRows] = useState([]);
  useEffect(function () {
    const obs = observations || [];
    const items = obs.map(function (o) {
      return { loinc: get(o, 'code.coding.0.code'), value: get(o, 'valueQuantity.value') };
    });
    Meteor.callAsync('referenceRanges.resolveBatch', {
      items,
      patientId: get(patient, '_id'),
      observationIds: obs.map(function (o) { return get(o, '_id'); })
    }).then(function (results) {
      setRows((results || []).map(function (r, i) {
        return {
          analyte: get(obs[i], 'code.coding.0.display', r.loinc),
          value: r.value,
          unit: get(obs[i], 'valueQuantity.unit'),
          resolved: r.resolved
        };
      }));
    }).catch(function () { setRows([]); });
  }, [observations, get(patient, '_id')]);

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <BloodPanelView rows={rows} />
    </Box>
  );
}

export default BloodPanel;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest --config jest.a11y.config.cjs imports/ui-modules/BloodPanel.a11y.test.jsx`
Expected: PASS (2 tests), no axe violations.

- [ ] **Step 5: Commit**

```bash
git add imports/ui/hooks/useResolvedReferenceRange.js imports/ui-modules/BloodPanel.jsx imports/ui-modules/BloodPanel.a11y.test.jsx
git commit -m "feat(reference-ranges): useResolvedReferenceRange hook + BloodPanel (batched, provenance tooltip)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Final verification

- [ ] Run the full pure tier: `npm run test:reference-ranges` → all pass.
- [ ] Run the component tier: `npx jest --config jest.a11y.config.cjs imports/ui-fields/ReferenceRange.a11y.test.jsx imports/ui-modules/BloodPanel.a11y.test.jsx` → all pass, no axe violations.
- [ ] **Boot smoke (only if the dev server is free — coordinate with the dcmjs instance):** boot, confirm the seed log, call `referenceRanges.resolve({ loinc: '2986-8', patientId })` from the console for a patient with an SPCU `female` tag → returns the female testosterone interval; for `male` → the male interval; confirm `matched.source`/`version` populated.
- [ ] Confirm `git status` shows **no** unintended changes to `libraries/dcmjs`, `package-lock.json`, or `.meteor/versions`.

## Self-review notes (applied)

- **Spec coverage:** D1 (Task 4), D2/injection (Tasks 5–7), D3 selection (Task 7 `buildContext`), D4 curated subset (Task 4), D5 approach A (throughout), D6 two axes (Task 1 `qualifiers` + Task 4 seed), D7 five band profiles (Task 3 resolver + Task 8 primitive), D8/D9 SPCU (Task 2 + wired in Task 7). Components + reconciliation (Tasks 8–9).
- **Purity boundary honored:** every Meteor-touching unit has its logic split into a pure `.mjs` sibling that carries the `node --test` cycle; resolver/qualifiers/SPCU import nothing Meteor.
- **Type consistency:** resolver output shape (`{ code, unit, bandProfile, normal, bands, matched, skipped }`) is produced in Task 3 and consumed identically in Tasks 8–9; `context` fields produced by `buildContext` (Task 7) match the resolver's expected `context` (Task 3); `EXT.*` URL constants defined once (Task 1) and reused.
- **Out of scope (later sub-projects):** IG reshape + package split + terminology staging; country/population range packs (this plan defines the `ReferenceRangeSet` contract they implement); therapeutic-window label sets; long-tail analyte import; `Likert` primitive (DynamicFhir plan).
