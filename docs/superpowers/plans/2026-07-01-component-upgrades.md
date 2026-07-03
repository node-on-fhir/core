# React Component-Layer Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the "quick, safe wins" and the first bounded state-discipline slice from the React component-layer review (`fable/OPUS_NOF_ARCHITECTURE_COMPONENTS.md`, findings C-1..C-4, C-6) — WITHOUT touching the forked `*Table.jsx`/`*Detail.jsx` families, the `ResourceTable` shell, or the field-primitives library (those are owned by the sibling DynamicFhir plan). Every task is a bounded, independently-shippable change with an exemplar and a boot check.

**Architecture:** `imports/ui/App.jsx` is a 2,162-line god-file (verified: `wc -l` = 2162) that carries 190 imports, an **orphaned** `createBrowserRouter` data-router (`:1263`) next to the live `<Routes>`/`<Route>` map in `StyledMainRouter` (`:2095-2110`), the entire `CustomThemeProvider`/`createDynamicTheme`/`getThemeSetting` palette authority (`:1453-1703`), and the top-level `App` layout (`:1742`, renders `<CustomThemeProvider>` at `:1984`). Page components (exemplar `imports/ui-fhir/observations/ObservationsPage.jsx`) fire 8+ single-key `useTracker`s (`:80-157`) and read `Session.get()` **inside a `useTracker` dependency array** (`:141`) — a correctness bug, not a style nit. This plan retires small, verified slices of that debt.

**Tech Stack:** React 18, Material-UI v5, Meteor v3 (`useTracker` / `Tracker`). Test harness is **Mocha + chai** via `meteor test --once --driver-package meteortesting:mocha` (`package.json:24`); existing suites are `*.tests.js` (chai `assert`/`expect`, and enzyme+sinon for components — see `imports/lib/validatedMethods/observations.tests.js`, `npmPackages/vital-signs/tests/VitalSignsComponents.tests.js`).

## Global Constraints

- **Do NOT touch table/forked-UI work.** The `ResourceTable` behavioral shell, the `*Table.jsx`/`*Detail.jsx` forks (finding C-5), and the `imports/ui-fields/*` field-primitives library are owned by `docs/superpowers/plans/2026-07-01-dynamicfhir-enhancement.md`. Reference it; never duplicate it here. This plan is the **non-table** component fixes only.
- **No full App.jsx rewrite.** Task 3 extracts *only* the theme provider as one bounded split. Route defs, `StyledMainRouter`, layout, and the other god-file mass stay in App.jsx for later loops.
- **Preserve the theme contract.** `CustomThemeProvider` is the single palette authority (settings sanitization via `getThemeSetting`, `beforeprint`/`afterprint` light-swap). The extraction (Task 3) must be behavior-identical — same exports (`CustomThemeProvider`, `useTheme`, `Meteor.useTheme`), same `ThemeContext` value shape `{ theme, setTheme, toggleTheme, refreshTheme }`. See `.claude/rules/ui/theming.md`.
- **Follow theme + navigation rules.** Theme tokens / `isDark` per `.claude/rules/ui/theming.md`; `useNavigate` not `window.location` per `.claude/rules/anti-patterns/navigation.md`; async patterns per `.claude/rules/meteor/v3-async.md` (the column-prefs method is NOT in this plan — no server methods here).
- **`SessionKeys.js` adoption is opportunistic** — adopt constants where you already touch a literal (Task 4), do not run a rename campaign.
- Commit after every task; end commit messages with the Claude Code co-author trailer:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- **Boot verification is mandatory** on Tasks 2, 3, 4: `meteor run --settings settings/settings.honeycomb.localhost.json`, confirm the app renders (no white-screen), the console prints the route logs, and the target view still works.

## File map

| File | Responsibility |
|------|----------------|
| `imports/ui/App.jsx` | delete orphan router (T1); wrap route `.map` in ErrorBoundary (T2); import theme provider from new module (T3) |
| `imports/ui/CustomThemeProvider.jsx` | **new** — extracted `CustomThemeProvider` + `createDynamicTheme` + `getThemeSetting` + `ThemeContext` + `useTheme` (T3) |
| `imports/ui/ErrorBoundary.jsx` | existing class boundary, consumed by T2 (unchanged) |
| `imports/ui-fhir/observations/ObservationsPage.jsx` | fix `Session.get()`-in-deps (T4a); consolidate single-key trackers (T4b) |
| `imports/ui/customThemeProvider.tests.js` | **new** — smoke test for the extracted provider (T3) |

---

### Task 1: Delete the orphaned `createBrowserRouter` dead code (C-3)

**Problem:** `imports/ui/App.jsx:1263` builds `const router = createBrowserRouter(dynamicRoutes)` and there's a dev-only validation loop right after it, but `RouterProvider` is only *imported* (`:13`) and **never rendered** — the live routing runs through `<Routes>`/`<Route>` in `StyledMainRouter` (`:2095`). The data-router result is dead code sitting next to the live path, a trap for the next maintainer. Verified: `grep -n RouterProvider imports/ui/App.jsx` returns only the import at `:13`.

**Files:**
- Modify: `imports/ui/App.jsx` — remove the `const router = ...` line (`:1263`), the dev-only `if (Meteor.isDevelopment) { dynamicRoutes.forEach(...) }` validation block that only exists to sanity-check that dead `router`, and drop `RouterProvider` from the `react-router-dom` import (`:13`) since nothing else uses it.

**Interfaces:** Pure deletion. No new exports. `dynamicRoutes` itself stays (it's consumed by `StyledMainRouter`); only the `createBrowserRouter` product and its now-orphaned validator go.

- [ ] **Step 1: Confirm the router product is unused.** Run:
  ```bash
  grep -n "RouterProvider\|\brouter\b" imports/ui/App.jsx
  ```
  Expect: `RouterProvider` only at the import (`:13`); the identifier `router` only at the `const router = createBrowserRouter(...)` assignment (`:1263`) — no consumer. If any consumer of `router` shows up, STOP and re-scope (it means the data-router is partially live). Also confirm `createBrowserRouter` is used nowhere else: `grep -c createBrowserRouter imports/ui/App.jsx` should be 2 (import + the one assignment).
- [ ] **Step 2: Delete the dead block.** In `imports/ui/App.jsx`, remove line `:1263` (`const router = createBrowserRouter(dynamicRoutes);`) and the immediately-following `if (Meteor.isDevelopment) { dynamicRoutes.forEach((route, index) => { ... }) }` block whose sole purpose was validating that `router`'s routes. Keep the two `console.log('Total dynamic routes'...)` / `console.log('All routes'...)` lines (`:1260-1261`) — they log `dynamicRoutes`, which is still live and is one of the boot-verification signals other tasks rely on.
- [ ] **Step 3: Drop the unused import.** Edit the `react-router-dom` import (`:11-18`) to remove `RouterProvider` and `createBrowserRouter`. Leave `useNavigate`, `BrowserRouter as Router`, `Routes`, `Route`, `Outlet` — all still used.
- [ ] **Step 4: Verify — lint + boot.** Run:
  ```bash
  grep -n "createBrowserRouter\|RouterProvider" imports/ui/App.jsx   # expect: no matches
  npm test 2>&1 | tail -30
  ```
  `npm test` must not regress (this is a pure deletion of unreachable code). Then boot (`meteor run --settings settings/settings.honeycomb.localhost.json`), open `/`, click into a couple of routes (e.g. `/patients`, an FHIR resource list) — routing still works because it never went through the deleted router. Confirm the console still prints `Total dynamic routes: N`.
- [ ] **Step 5: Commit** — `git add imports/ui/App.jsx && git commit -m "refactor(app): delete orphaned createBrowserRouter dead code (C-3)"`

---

### Task 2: Wrap the route `.map` in an `ErrorBoundary` so a throwing page can't white-screen the app (C-6)

**Problem:** Only 5 files reference `ErrorBoundary` (`imports/ui/ErrorBoundary.jsx`, `GettingStartedPage.jsx`, `StaticPatientFileLoaderPage.jsx`, `DICOM/DicomViewerPage.jsx`, `ui-fhir/imagingStudies/ImagingStudyPreview.jsx`) and **none wrap the route table** (verified: `grep -n ErrorBoundary imports/ui/App.jsx` = no matches). A single throwing resource page white-screens the whole SPA. The existing `imports/ui/ErrorBoundary.jsx` is a textbook class boundary with a `fallback` prop — reuse it at the route seam.

**Files:**
- Modify: `imports/ui/App.jsx` — import `ErrorBoundary`, wrap the rendered route element inside the `allRoutes.map(...)` in `StyledMainRouter` (`:2095-2110`) with `<ErrorBoundary key=... fallback=...>`.

**Interfaces:** Each route's `element` is wrapped per-route so a crash in one page shows a recoverable MUI `Alert` fallback for *that route only*, not a global blank screen. A **per-route** boundary (inside the `.map`, keyed by route) is required over one boundary around `<Routes>` because React error boundaries do not reset on navigation by themselves — keying per route lets navigating away remount a fresh boundary.

- [ ] **Step 1: Import the boundary.** Add near the other `./` imports at the top of `imports/ui/App.jsx`:
  ```javascript
  import ErrorBoundary from './ErrorBoundary.jsx';
  import { Alert, AlertTitle } from '@mui/material';
  ```
  (`Container`/`Box`/`CircularProgress` are already imported at `:22`; add `Alert`/`AlertTitle` to that MUI import or a new line — check first with `grep -n "from '@mui/material'" imports/ui/App.jsx`.)
- [ ] **Step 2: Wrap the route element.** In `StyledMainRouter`'s route map (`:2096-2110`), the current code computes `routeElement` then returns a `<Route ... element={routeElement} />` (or an `<AuthenticatedRoute>`-wrapped one). Wrap `routeElement` in an ErrorBoundary before it's handed to `<Route>`:
  ```javascript
  {allRoutes.map((route, index) => {
    const routeElement = route.element || (route.component ? React.createElement(route.component) : null);

    // Per-route boundary: a throwing page shows a recoverable Alert instead of
    // white-screening the whole app. Keyed per route so navigating away remounts
    // a fresh boundary (error boundaries don't self-reset on route change).
    const guardedElement = (
      <ErrorBoundary
        key={'eb-' + (route.path || index)}
        fallback={
          <Container maxWidth="md" sx={{ py: 4 }}>
            <Alert severity="error">
              <AlertTitle>This page failed to load</AlertTitle>
              An error occurred rendering <code>{route.path || 'this route'}</code>.
              Try navigating elsewhere and back, or reload the app.
            </Alert>
          </Container>
        }
      >
        {routeElement}
      </ErrorBoundary>
    );

    if (route.requireAuth) {
      return (
        <Route
          key={index}
          path={route.path}
          element={<AuthenticatedRoute>{guardedElement}</AuthenticatedRoute>}
        />
      );
    }
    return <Route key={index} path={route.path} element={guardedElement} />;
  })}
  ```
  Leave the `<Route path="*" element={workflowNotFoundPage || <NotFoundPage />} />` fallback route as-is.
- [ ] **Step 3: Verify — boundary catches a synthetic throw.** Boot the app. Temporarily add `throw new Error('boundary smoke test');` at the top of one page component's render (e.g. `imports/ui-fhir/observations/ObservationsPage.jsx`'s `ObservationsPage` body), navigate to `/observations`, and confirm you see the MUI `Alert` fallback — NOT a blank white screen, and other routes (Header/Footer/SideDrawer chrome) still render. Then **remove the synthetic throw**. Also confirm `console.error("Error caught in ErrorBoundary:"...)` fired (the existing `componentDidCatch` logs it).
- [ ] **Step 4: Verify — no regression.** With the synthetic throw removed, `npm test 2>&1 | tail -30` and a normal boot: every route renders as before, no fallback shown in the happy path.
- [ ] **Step 5: Commit** — `git add imports/ui/App.jsx && git commit -m "feat(app): wrap route map in per-route ErrorBoundary (C-6)"`

---

### Task 3: Extract `CustomThemeProvider` into its own module (bounded first split of god-App.jsx) (C-4)

**Problem:** `App.jsx` is 2,162 lines and carries the whole palette authority — `getThemeSetting` (`:1454`), `CustomThemeProvider` + nested `createDynamicTheme` (`:1464-1703`), the `ThemeContext` (`:1438`), the `useTheme` hook + `Meteor.useTheme`/`Meteor.useLocation`/... assignments (`:1440-1446`), and the `beforeprint`/`afterprint` print-swap listeners (`:1670-1694`). This is ~250 self-contained lines that many components consume via `Meteor.useTheme()`. Extract it as a first, bounded split — do **not** attempt to move routes/layout/`StyledMainRouter` (out of scope).

**Files:**
- Create: `imports/ui/CustomThemeProvider.jsx` — the moved code + its imports.
- Modify: `imports/ui/App.jsx` — delete the moved block, `import { CustomThemeProvider, useTheme } from './CustomThemeProvider.jsx';`, delete the now-duplicate `ThemeContext`/`getThemeSetting` local defs.
- Create: `imports/ui/customThemeProvider.tests.js` — smoke test.

**Interfaces:** New module exports **exactly** what App.jsx exported before: `export const CustomThemeProvider`, `export const useTheme`, and the side effects `Meteor.useTheme = useTheme` plus the `Meteor.useLocation/useNavigate/useParams` assignments (these are load-bearing — packages call `Meteor.useTheme()`; verified `Meteor.useTheme` at `:1441`). `ThemeContext` and `getThemeSetting` become module-private (they were not exported before — confirm with `grep -n "export.*ThemeContext\|export.*getThemeSetting" imports/ui/App.jsx`, expect none). Context value shape unchanged: `{ theme, setTheme, toggleTheme, refreshTheme }`.

- [ ] **Step 1: Write the smoke test FIRST.** Create `imports/ui/customThemeProvider.tests.js` (Mocha + chai + enzyme, mirroring `npmPackages/vital-signs/tests/VitalSignsComponents.tests.js`). It should (client-only) mount a child that consumes `useTheme()` and assert the context value has the four keys and a default `theme` of `'light'` or `'dark'`:
  ```javascript
  /* eslint-env mocha */
  import React from 'react';
  import { expect } from 'chai';
  import { mount } from 'enzyme';
  import { Meteor } from 'meteor/meteor';
  import { CustomThemeProvider, useTheme } from './CustomThemeProvider.jsx';

  if (Meteor.isClient) {
    describe('CustomThemeProvider', function () {
      it('provides a theme context with toggle/refresh handles', function () {
        let captured = null;
        function Probe() {
          captured = useTheme();
          return null;
        }
        mount(
          <CustomThemeProvider>
            <Probe />
          </CustomThemeProvider>
        );
        expect(captured).to.be.an('object');
        expect(captured).to.have.all.keys('theme', 'setTheme', 'toggleTheme', 'refreshTheme');
        expect(['light', 'dark']).to.include(captured.theme);
      });

      it('exposes useTheme on the Meteor object for package consumers', function () {
        expect(Meteor.useTheme).to.be.a('function');
      });
    });
  }
  ```
- [ ] **Step 2: Run → FAIL.** `npm test 2>&1 | tail -30` — the test fails because `./CustomThemeProvider.jsx` does not exist yet.
- [ ] **Step 3: Create the module.** Create `imports/ui/CustomThemeProvider.jsx`. Move — verbatim — from `App.jsx`: `getThemeSetting` (`:1454-1462`), the `CustomThemeProvider` component (`:1464-1703`) including nested `createDynamicTheme`, the `ThemeContext = createContext()` (`:1438`) and `useTheme`/`Meteor.useTheme` (`:1440-1441`), and the `Meteor.useLocation/useNavigate/useParams` assignments (`:1444-1446`). Add the imports the block needs at the top of the new file:
  ```javascript
  // /imports/ui/CustomThemeProvider.jsx
  import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
  import { get } from 'lodash';
  import { Meteor } from 'meteor/meteor';
  import { Session } from 'meteor/session';
  import { Tracker } from 'meteor/tracker';
  import * as ReactRouterDOM from 'react-router-dom';
  import { ThemeProvider, createTheme } from '@mui/material/styles';
  import CssBaseline from '@mui/material/CssBaseline';
  ```
  Keep `ThemeContext` and `getThemeSetting` **un-exported** (module-private, matching prior visibility). Export `CustomThemeProvider` and `useTheme`.
- [ ] **Step 4: Repoint App.jsx.** In `imports/ui/App.jsx`: delete the moved definitions (`:1438-1446` context/hook block, `:1453-1703` provider+helpers). Add `import { CustomThemeProvider, useTheme } from './CustomThemeProvider.jsx';` near the other `./` imports. Then de-duplicate imports that are now only used by the moved code — run `grep -n "createTheme\|ThemeProvider\|CssBaseline\|Tracker" imports/ui/App.jsx` and remove any import that has zero remaining references (leave any still used, e.g. `useMuiTheme`/`ThemeProvider` if `StyledMainRouter` still consumes them at `:2062`). Keep `useTheme` imported because App.jsx / children reference `Meteor.useTheme` and the export must stay reachable.
- [ ] **Step 5: Run → PASS + boot.** `npm test 2>&1 | tail -30` (the smoke test now passes). Then boot: confirm (a) the app renders with correct colors in the configured mode, (b) the header dark/light toggle still flips the theme (exercises `toggleTheme`), (c) **print** shows the light theme — open the browser print preview on a dark-mode boot and confirm white paper (exercises the `beforeprint` listener). If any package errors with `Meteor.useTheme is not a function`, the `Meteor.useTheme = useTheme` side-effect line did not move — fix it.
- [ ] **Step 6: Commit** — `git add imports/ui/CustomThemeProvider.jsx imports/ui/customThemeProvider.tests.js imports/ui/App.jsx && git commit -m "refactor(app): extract CustomThemeProvider into its own module (C-4)"`

---

### Task 4: Fix the `Session.get()`-in-deps bug and consolidate ObservationsPage trackers (C-2 + measured C-1 first step)

**Problem (C-2 — correctness bug):** `ObservationsPage.jsx:141` ends its subscription `useTracker` with `}, [Session.get('selectedPatientId'), searchFilter]);`. Dependency arrays evaluate **at render, not reactively** — the reactive read belongs inside the tracker body (which already re-runs reactively). The body *does* already `Session.get('selectedPatientId')` internally, so the dep-array read is both wrong and redundant; on a patient switch the tracker can fail to re-subscribe because the dep didn't change reactively. This pattern recurs across resource pages.

**Problem (C-1 — measured first step):** the same page fires 8+ single-key `useTracker`s (`:80-157`), each subscribing to one `Session` key. Consolidate the pure Session-mirror reads into ONE tracker as a measured exemplar; full Session→context migration is a later loop.

**Files:**
- Modify: `imports/ui-fhir/observations/ObservationsPage.jsx` (`:80-157`).
- (Reference only — do not edit) `imports/lib/SessionKeys.js`: `SELECTED_PATIENT_ID`, `SHOW_SYSTEM_IDS`, `SHOW_FHIR_IDS`, `SELECTED_ID('Observation')`.

**Interfaces:** No prop/API change — `ObservationsPage` renders identically; only its reactivity wiring changes. This is a behavior-preserving fix + consolidation, verified by the page behaving correctly across a patient switch.

- [ ] **Step 1 (C-2 fix): Move the reactive read into the tracker body.** Change the subscription tracker's dependency array (`:141`) from `[Session.get('selectedPatientId'), searchFilter]` to `[searchFilter]`. The body already reads `Session.get('selectedPatientId')`/`Session.get('selectedPatient')` internally (`:94-95`), so the tracker re-runs reactively when either changes — the dep-array Session read was redundant and non-reactive. Corrected pattern:
  ```javascript
  const isLoading = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');   // reactive read (in body)
    const selectedPatient = Session.get('selectedPatient');        // reactive read (in body)
    // ...existing query build + Meteor.subscribe...
  }, [searchFilter]);   // <-- only true React state belongs here
  ```
- [ ] **Step 2 (C-2 audit): grep for siblings, list them (do not fix here).** The finding says this recurs. Enumerate the other offenders so a follow-up loop can fix them one file at a time:
  ```bash
  grep -rn "Session\.get([^)]*)[^]]*\]" imports/ui-fhir imports/ui-modules imports/patient \
    | grep "useTracker\|}, \[" \
    || grep -rn "}, \[Session\.get" imports/
  ```
  Record the matching files at the top of the commit body (or in `fable/OPUS_NOF_ARCHITECTURE_COMPONENTS.md` under "Remediation kickoff") as the C-2 backlog. The corrected pattern (Step 1) is the template each should follow.
- [ ] **Step 3 (C-1 exemplar): Consolidate the single-key Session-mirror trackers.** The reads at `:80-88`, `:151-157` (`ObservationsPage.onePageLayout`, `ObservationsTable.hideCheckbox`, `selectedObservationId`, `ObservationsTable.observationsIndex`, `showSystemIds`, `showFhirIds`) are pure Session mirrors with empty dep arrays. Fold them into ONE tracker returning an object, and adopt `SessionKeys.js` constants for the load-bearing keys. Add the import and replace the cluster:
  ```javascript
  import { SELECTED_ID, SHOW_SYSTEM_IDS, SHOW_FHIR_IDS } from '/imports/lib/SessionKeys.js';
  // ...
  const sessionState = useTracker(function(){
    return {
      onePageLayout:      Session.get('ObservationsPage.onePageLayout'),
      hideCheckbox:       Session.get('ObservationsTable.hideCheckbox'),
      selectedObservationId: Session.get(SELECTED_ID('Observation')),   // 'selectedObservationId'
      observationsIndex:  Session.get('ObservationsTable.observationsIndex'),
      showSystemIds:      Session.get(SHOW_SYSTEM_IDS),
      showFhirIds:        Session.get(SHOW_FHIR_IDS)
    };
  }, []);
  Object.assign(data, sessionState);
  ```
  Keep `data.selectedObservation` (`:89-91`) as its own tracker — it does a Minimongo `findOne`, not a plain Session mirror, and merging a collection query into the mirror tracker would over-invalidate. Leave the subscription tracker (Step 1) and the `data.observations` sort tracker (`:143-150`) separate too — they have real non-`[]` deps.
- [ ] **Step 4: Verify — behavior across a patient switch (the C-2 payoff).** Boot; select Patient A from the sidebar → confirm `/observations` shows A's observations. Switch to Patient B → confirm the list **updates to B's** (pre-fix, the non-reactive dep could leave it stale). Toggle the one-page/two-page layout and the show-system-ids control → confirm they still reflect (proves the consolidated `sessionState` tracker is reactive). Run `npm test 2>&1 | tail -30` — no regression.
- [ ] **Step 5: Commit** — `git add imports/ui-fhir/observations/ObservationsPage.jsx && git commit -m "fix(observations): move Session read out of useTracker deps + consolidate Session mirrors (C-2/C-1)"`

---

## Self-review notes (applied)

- **Scope boundaries honored** — NO `*Table.jsx`/`*Detail.jsx`, `ResourceTable`, or `ui-fields` work here; those belong to `docs/superpowers/plans/2026-07-01-dynamicfhir-enhancement.md`, referenced not duplicated. NO server methods (the column-prefs `userProfile.setColumnPrefs` method lives in that sibling plan, not here).
- **Anchors verified firsthand** — `App.jsx` = 2162 lines; `createBrowserRouter` at `:1263` with `RouterProvider` imported (`:13`) but never rendered; live route map in `StyledMainRouter` `:2095`; `CustomThemeProvider`/`createDynamicTheme`/`getThemeSetting` at `:1453-1703`, `ThemeContext` `:1438`; `ObservationsPage.jsx:141` `Session.get('selectedPatientId')` in the dep array; ErrorBoundary referenced in exactly 5 files and NOT in App.jsx.
- **Test harness matched** — Mocha + chai (+ enzyme for components) via `meteor test --once --driver-package meteortesting:mocha`, `*.tests.js` naming, `Meteor.isClient` guard for client-mount tests — mirrors existing `observations.tests.js` / `VitalSignsComponents.tests.js`. No jest/`@testing-library` invented.
- **God-file split is bounded** — Task 3 moves ONLY the theme provider (~250 verified lines) with a behavior-identical export contract (`CustomThemeProvider`, `useTheme`, `Meteor.useTheme` side-effect, print-swap listeners), not the routes/layout mass. Explicitly refuses the full rewrite.
- **C-2 fix is framed as correctness, not style** — verification is a patient-switch that must re-subscribe (the actual bug), plus a grep to surface the recurring siblings for a follow-up loop rather than fixing all of them big-bang.
- **C-1 is a measured single-page exemplar** — one page's pure Session-mirror trackers consolidated into one tracker + `SessionKeys.js` constants adopted where literals were already being touched; the collection-query and real-dep trackers are deliberately left separate to avoid over-invalidation. Full Session→context migration is called out as a later loop.
- **Boot verification woven in** — Tasks 2/3/4 each require a real boot with a specific behavioral check (synthetic throw caught by boundary; theme toggle + print light-swap; patient switch re-subscribe), and `npm test` runs on every task.
