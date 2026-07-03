# DynamicFhir Table & Detail Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden and de-duplicate the existing FHIR component-dispatch system (`DynamicFhirDetail` + `DynamicFhirViews`) and their bespoke leaf components — WITHOUT replacing bespoke details with a generic renderer — via four targeted improvements: symmetric fallback + coverage, a generated registry manifest, a shared field-primitives library, and a behavioral table shell.

**Architecture:** The codebase already has the correct pattern — a registry dispatches a `resourceType` to a **bespoke** Detail/Preview component (`imports/lib/DynamicFhirDetail.js`, `DynamicFhirViews.js`, populated by `imports/startup/client/fhir-resource-registry.js` / `fhir-preview-registry.js`). This plan enhances that spine; it does **not** introduce a config-driven form DSL. Bespoke detail components stay bespoke (GoogleMaps in `LocationDetail`, Cornerstone3D in `ImagingStudyDetail`, etc.). Reuse is extracted only as (a) a generic *fallback* for unregistered types, (b) a *generated* wiring manifest, (c) leaf *field primitives* components compose à la carte, and (d) a table *behavioral shell* whose only config is runtime/user-driven (column prefs, form factor).

**Tech Stack:** React 18, Material-UI v5, Meteor v3 (`useTracker`), rspack/SWC codegen (mirror `workflows/rspack.workflowParser.js`).

## Global Constraints

- **No form/rendering DSL.** Per-resource *rendering* stays as React in bespoke components. The only config introduced is runtime/user-driven (table column prefs in `Meteor.user().profile`, form-factor layout) — data because a user sets it at runtime, distinct from author-time rendering.
- Do not regress the existing embedded-mode contract: dispatched components receive `{ fhirResource, embedded: true, onResourceChange }` (see `DynamicFhirDetail.js:53`).
- Follow existing theme rules (`.claude/rules/ui/theming.md` — tokens / `isDark`), accessibility for new interactive elements (keyboard-operable rows), and `footer-buttons.md` if adding footer controls.
- Field primitives are leaf widgets (like MUI `<Chip>`) — no data-fetching, no business logic; pure presentation of a FHIR datatype value.
- Commit after every task; end commit messages with the Claude Code co-author trailer.
- **Package dissolution rides alongside:** the `hl7-resource-datatypes` residual (`Annotation`, `Code`, `Period`) from `docs/superpowers/plans/2026-07-01-atmosphere-package-dissolution.md` lands in the `ui-fields` library (Task 3) — coordinate, don't duplicate.

## File map

| File | Responsibility |
|------|----------------|
| `imports/lib/GenericFhirDetail.jsx` | read-only fallback Detail (mirrors `GenericPreview`) |
| `imports/lib/DynamicFhirDetail.js` | wire the fallback into the dispatcher |
| `scripts/generate-fhir-component-manifest.js` | codegen the registry from `ui-fhir/` dirs |
| `imports/startup/client/fhir-component-manifest.js` | generated import+register manifest (replaces the 2 hand-registries) |
| `imports/ui-fields/*` | field-primitive components + index |
| `imports/ui-tables/ResourceTable.jsx` | behavioral table shell |
| `imports/lib/columnPreferences.js` | read/write user column prefs (profile) |

---

### Task 1: Symmetric fallback + close the coverage gap

**Problem:** `DynamicFhirViews` degrades gracefully to `GenericPreview` (formatted JSON) for unregistered types, but `DynamicFhirDetail` returns a bare gray `"No form editor registered for X"` div (`DynamicFhirDetail.js:45-51`). And 61–62 components are registered vs ~70 `ui-fhir/` dirs — the unregistered fall through.

**Files:**
- Create: `imports/lib/GenericFhirDetail.jsx`
- Modify: `imports/lib/DynamicFhirDetail.js:38-58`
- Test: `imports/lib/GenericFhirDetail.test.jsx` (or a smoke assertion via the existing client test harness)

**Interfaces:**
- Produces `GenericFhirDetail({ fhirResource, embedded })` — a read-only, theme-aware rendering of any resource (labeled field list + collapsible raw JSON), mirroring `GenericPreview`'s role. `DynamicFhirDetail` renders it instead of the gray div when no component is registered.

- [ ] **Step 1:** Read `DynamicFhirViews.js`'s `GenericPreview` (it's the template) and write `GenericFhirDetail.jsx` — same theme handling (`isDark`), a `Typography` header with `resourceType`, and a `<pre>` JSON block; read-only (no edit affordances). Keep it under ~80 lines.
- [ ] **Step 2:** In `DynamicFhirDetail.js`, replace the gray-div branch (`:45-51`) with `return React.createElement(GenericFhirDetail, { fhirResource, embedded: true });` and add the import.
- [ ] **Step 3: Close the coverage gap.** Run `comm -23 <(ls -d imports/ui-fhir/*/ | xargs -n1 basename | sort) <(grep -oE "'[A-Z][A-Za-z]+':" imports/startup/client/fhir-resource-registry.js | tr -d "':" | sort)` (adjust to map dir→resourceType) to list resources with a `*Detail.jsx` but no registration; register each in both registries. (Task 2 makes this automatic — but register now so the fallback isn't masking real components.)
- [ ] **Step 4: Verify** — boot; open the fhir-graph sidebar / timeline on a previously-unregistered resource type and confirm it now renders the fallback (not a gray stub), and any newly-registered real component renders.
- [ ] **Step 5: Commit** — `git add imports/lib/GenericFhirDetail.jsx imports/lib/DynamicFhirDetail.js imports/startup/client/ && git commit -m "feat(fhir-ui): GenericFhirDetail fallback + close detail-registry coverage gap"`

---

### Task 2: Generated component-registry manifest (kill the triple hand-maintained list)

**Problem:** the same ~62 components are hand-imported in three places — `App.jsx` (routes), `fhir-resource-registry.js` (detail dispatch), `fhir-preview-registry.js` (preview dispatch) — and they already drift (the log claims 62; grep counts 61). This is a *wiring manifest* (data: which component serves which type), not rendering logic, so generating it is legitimate config, not a DSL.

**Files:**
- Create: `scripts/generate-fhir-component-manifest.js`
- Create (generated): `imports/startup/client/fhir-component-manifest.js`
- Modify: `fhir-resource-registry.js` / `fhir-preview-registry.js` to consume the manifest (or be replaced by it); update `App.jsx` route wiring to read from it
- Modify: `package.json` (script `"generate:fhir-manifest"`)

**Interfaces:**
- Produces a generated module exporting `{ details: {ResourceType: Component}, previews: {ResourceType: Component} }`, derived by scanning `imports/ui-fhir/*/` for `*Detail.jsx` and `*Preview.jsx` files and mapping directory/file → `resourceType` (singularize the dir name per the existing convention — `observations` → `Observation`).

- [ ] **Step 1:** Write `scripts/generate-fhir-component-manifest.js` — glob `imports/ui-fhir/*/*Detail.jsx` and `*Preview.jsx`, derive the `resourceType` key, emit an `import` + a `{ details, previews }` map. Emit a header comment `// GENERATED — do not edit`. Model it on the existing `workflows/rspack.workflowParser.js` barrel emission and the JSON-schema-index generator (`scripts/generate-fhir-schema-index.js` if present).
- [ ] **Step 2:** Run it; verify the generated manifest lists ≥62 details and ≥62 previews and includes the stragglers Task 1 registered. `node -e "..."` count check.
- [ ] **Step 3:** Repoint `fhir-resource-registry.js` → `registerDynamicFhirComponents(manifest.details)` and `fhir-preview-registry.js` → `registerDynamicFhirViewComponents(manifest.previews)`; delete the hand-maintained import lists. If `App.jsx` route generation can consume `manifest.details`, wire it (this retires part of the God-`App.jsx` finding); if too entangled, leave App.jsx routes for a follow-up and note it.
- [ ] **Step 4: Verify** — boot; detail/preview dispatch still works across resources; the "Registered N" logs now match reality. Add `generate:fhir-manifest` to `package.json` and document regenerating it when adding a resource.
- [ ] **Step 5: Commit** — `git commit -m "feat(fhir-ui): generate component-registry manifest from ui-fhir/ dirs"`

---

### Task 3: `ui-fields` field-primitives library

**Problem:** FHIR datatype rendering (references, codeable-concepts, quantities, reference ranges, human names) is re-implemented ad hoc across the 62 bespoke Detail/Preview components. These are leaf widgets — extract them so components compose them à la carte (no constraint on the bespoke components).

**Files:**
- Create: `imports/ui-fields/` — `ReferenceChip.jsx`, `CodeableConceptDisplay.jsx`, `HumanNameDisplay.jsx`, `QuantityDisplay.jsx`, `PeriodDisplay.jsx`, `ReferenceRange.jsx`, `Likert.jsx`, `index.js`
- Test: `imports/ui-fields/uiFields.test.jsx`

**Interfaces (each a pure presentational leaf — value in, JSX out; no data fetching):**
- `ReferenceChip({ reference })` — renders `{display}` (or the `Type/id`) as an MUI `<Chip>`, optional click-through.
- `CodeableConceptDisplay({ value })` — `value.text` ?? `value.coding[0].display` ?? `code`.
- `HumanNameDisplay({ name })` — `name.text` ?? `given.join(' ') + ' ' + family`.
- `QuantityDisplay({ value })` — `{value} {unit}`.
- `PeriodDisplay({ value })` — `{start} – {end}` (moment-formatted).
- `ReferenceRange({ range })` — Observation `referenceRange` low–high with units (dedupes logic across the Observation family).
- `Likert({ value, min, max, labels })` — a scale widget (survey/PROMIS scores in QuestionnaireResponse views).
- `index.js` re-exports all.

- [ ] **Step 1:** Write `uiFields.test.jsx` — for each primitive, assert it renders the expected text for a representative value and degrades safely (`null`/missing → empty, never throws). Use the project's client test harness (mirror an existing `*.test.jsx` if present; else `@testing-library/react` + `jest-axe` for a11y on `Likert`/`ReferenceRange`).
- [ ] **Step 2:** Run → FAIL (components missing).
- [ ] **Step 3:** Implement each primitive (theme tokens per theming rules; lodash `get()` for defensive access). Keep each < ~50 lines. Absorb the `hl7-resource-datatypes` residual here if display-oriented: if `Annotation`/`Code`/`Period` from the dissolution plan are display helpers, express them as `AnnotationDisplay`/`PeriodDisplay` primitives (coordinate with that plan's Task 5 Step 2).
- [ ] **Step 4:** Run → PASS. Then **adopt in one exemplar**: refactor `ObservationDetail`/`ObservationPreview` to use `ReferenceRange`/`QuantityDisplay`/`CodeableConceptDisplay`, proving the à-la-carte composition and deleting that view's inline duplicates. Verify the Observation view renders identically.
- [ ] **Step 5: Commit** — `git commit -m "feat(ui-fields): field-primitives library + adopt in Observation views"`

(Broader adoption across the other 61 components is opportunistic/out-of-scope for this task — the library exists and one exemplar proves it; a later ralph loop can migrate the rest view-by-view.)

---

### Task 4: `ResourceTable` behavioral shell (+ user column prefs / form factor)

**Problem:** the `*Table.jsx` family (69 forks) has no dispatcher and duplicates all table *behavior* — and per the accessibility + performance reviews, that behavior is where the bugs live (125 files put `onClick` on `TableRow` with **zero** keyboard support; zero virtualization anywhere). Extract the behavioral shell; columns stay as JSX in per-resource files (no column DSL). This is where runtime/user config legitimately lives.

**Files:**
- Create: `imports/ui-tables/ResourceTable.jsx`, `imports/ui-tables/Column.jsx`
- Create: `imports/lib/columnPreferences.js`
- Test: `imports/ui-tables/resourceTable.test.jsx`
- Modify (exemplar): `imports/ui-fhir/conditions/ConditionsTable.jsx`

**Interfaces:**
- `ResourceTable({ rows, onRowOpen, resourceType, children })` — owns sort, pagination, search, empty/loading states, **keyboard-operable rows** (`tabIndex=0`, `role="button"`, Enter/Space → `onRowOpen`), **virtualization** for large `rows`, theme compliance, and reads the current form-factor + the user's saved column preferences to decide which `<Column>`s to show. Columns are passed as JSX `<Column header cell={row => ...} />` children — full React, no spec object.
- `Column({ header, cell, key })` — a declarative-but-JSX column: `cell` is a render function `(row) => ReactNode`.
- `columnPreferences.get(resourceType)` / `.set(resourceType, columnKeys[])` — read/write `Meteor.user().profile.columnPrefs[resourceType]` via a Meteor method; falls back to the resource's default column set. **This is the legitimate runtime/user config axis** (persisted, user-set), distinct from author-time rendering.

- [ ] **Step 1:** Write `resourceTable.test.jsx` — assert: rows render via `cell` functions; a row is focusable (`tabIndex=0`) and Enter/Space fires `onRowOpen` (jsdom keyboard event); `jest-axe` finds no violations on a sample table; hidden columns (per a prefs stub) don't render. FAIL first.
- [ ] **Step 2:** Implement `ResourceTable.jsx` + `Column.jsx` — MUI `Table` shell; a keyboard-accessible row wrapper (fixes the a11y finding by construction); virtualization via `react-window` (add the dep) for `rows.length > ~100`; sort/paginate; consume `columnPreferences.get(resourceType)` to filter visible columns + a form-factor hook (`useMediaQuery`) for responsive column sets.
- [ ] **Step 3:** Implement `imports/lib/columnPreferences.js` + a `userProfile.setColumnPrefs` Meteor method (server, `this.userId`-gated, writes `profile.columnPrefs`). Client reads from `Meteor.user()`.
- [ ] **Step 4:** Run tests → PASS. Then **convert one exemplar**: rewrite `ConditionsTable.jsx` to render `<ResourceTable resourceType="Condition" rows={conditions} onRowOpen={...}>` with `<Column>` children for its existing columns; delete its inline table/pagination/row-click code. Boot and verify the Conditions list looks and behaves identically — now keyboard-navigable.
- [ ] **Step 5: Commit** — `git add imports/ui-tables/ imports/lib/columnPreferences.js && git commit -m "feat(ui-tables): ResourceTable behavioral shell (a11y rows, virtualization, column prefs) + Conditions exemplar"`

(Converting the remaining 68 `*Table.jsx` forks to the shell is a follow-up ralph loop — one file per iteration, reduce each to its `<Column>` set — not in scope here. The shell + one exemplar prove the pattern and deliver the a11y/perf win on the highest-traffic view.)

---

## Self-review notes (applied)

- **No form DSL introduced** — columns are JSX `<Column cell={fn}>`, details stay bespoke; the only config is runtime/user (column prefs, form factor). Directly honors the AutoForm-scar constraint.
- **Coverage of the four improvements:** symmetric fallback + gap (T1), generated manifest (T2), field primitives (T3), behavioral table shell + user config (T4).
- **Dissolution coordination:** the `hl7-resource-datatypes` residual absorption is cross-referenced in T3 Step 3, not duplicated.
- **Each task ends with a working exemplar** (Observation for fields, Conditions for tables) and defers bulk migration to explicit follow-up loops — avoids a big-bang rewrite of 137 files.
- **A11y + perf wins are structural:** the keyboard row and virtualization live in the shell (T4), so adopting components inherit them and can't regress.
