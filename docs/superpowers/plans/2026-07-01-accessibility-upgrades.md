# Accessibility Upgrades Implementation Plan (WCAG 2.1 AA / Section 508)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the **global accessibility scaffolding** that clears the systemic WCAG 2.1 AA / Section 508 failures in `fable/OPUS_NOF_ARCHITECTURE_ACCESSIBILITY.md` — findings A-2..A-6 — as a handful of shared, structural fixes, plus a CI gate that locks the gains. These are the app-level primitives (live region, `lang` + per-route title/focus, landmarks + skip link, icon-button lint, status-chip audit) that ~90 resource views inherit, distinct from the per-row/per-table work.

**Architecture:** The failures are **structural, not one-off** — one repeated pattern per finding across the resource views. Remediation is therefore a small set of shared primitives wired once into the layout chrome (`imports/ui/App.jsx` render tree: `CustomThemeProvider > Router > NavigationProvider > {Header, SideDrawer, StyledMainRouter (<main>), Footer}`) plus one ESLint rule and one codemod. The single spot that already has router context and wraps the whole app — `NavigationProvider` (`imports/ui/NavigationContext.jsx`, mounted inside `<Router>` at `App.jsx:1986`) — is where per-route title/focus and the announce plumbing hook in.

**Tech Stack:** React 18, Material-UI v5, Meteor v3 (`useTracker`), react-router-dom v6. Tests: `jest` + `jsdom` + `@testing-library/react` + `jest-axe` (new dev-only harness — the app's runtime tests are Meteor/mocha + Nightwatch; a11y unit tests do not need a Meteor bundle and run in plain jsdom).

## Global Constraints

- **A-1 is out of scope here — do not duplicate it.** Keyboard-operable clickable `TableRow`s (125 files, `onClick` with zero `tabIndex`/`onKeyDown`/`role`) are DELIVERED by the `ResourceTable` behavioral shell in `docs/superpowers/plans/2026-07-01-dynamicfhir-enhancement.md` **Task 4** — the shell's row is keyboard-accessible *by construction*, so migrated tables inherit the fix. This plan REFERENCES that. Task 5 below MAY add an interim shared `ClickableTableRow` wrapper as a **bridging stopgap** for tables not yet migrated to the shell — explicitly a bridge, retired as tables move to `ResourceTable`.
- Follow existing theme rules (`.claude/rules/ui/theming.md` — tokens preferred, `isDark` supported). New chrome must not set page-level bgcolor (`StyledMainRouter` owns `background.default`).
- Do not regress the print path: the skip link / live region must be inside the `@media print` hidden chrome set (`client/main.css`) so they don't print.
- New a11y unit tests live under `imports/**/*.a11y.test.jsx` and run via a **separate** `npm run test:a11y` script (jsdom/jest), NOT the Meteor mocha `npm test` — keep the two harnesses distinct so the Meteor bundle isn't dragged into jest.
- Commit after every task; end commit messages with the Claude Code co-author trailer.
- After code changes, run `graphify update .` per repo convention.

## File map

| File | Responsibility |
|------|----------------|
| `client/main.html` | `lang="en"` on `<html>` (A-3) |
| `imports/ui/a11y/LiveRegionProvider.jsx` | app-level `role="status"` `aria-live` region + `useAnnounce()` (A-2) |
| `imports/ui/a11y/RouteAnnouncer.jsx` | per-route `document.title` + focus-move + route announce (A-3) |
| `imports/ui/a11y/SkipLink.jsx` | "Skip to main content" link (A-5) |
| `imports/ui/NavigationContext.jsx` | mount `RouteAnnouncer` (has router context) |
| `imports/ui/App.jsx` | wrap render in `LiveRegionProvider`; add `SkipLink`; `<nav>` landmark id |
| `imports/ui/Header.jsx` / `imports/ui/SideDrawer.jsx` | `component="nav"` / `aria-label` landmarks (A-5) |
| `.eslintrc.a11y.cjs` + `package.json` | `jsx-a11y` icon-button lint rule (A-4) |
| `scripts/codemod-iconbutton-aria.js` | codemod adding `aria-label` to icon-only IconButtons (A-4) |
| `imports/ui/a11y/*.a11y.test.jsx` | jest-axe unit tests |
| `scripts/a11y-ci.js` + `package.json` | CI gate: jest-axe over sample pages |
| `jest.a11y.config.cjs` + `test/a11y/setup.js` | jsdom/jest harness (dev-only) |

---

### Task 0: Stand up the jsdom/jest + jest-axe harness (dev-only)

**Problem:** There is no jsdom/jest/`jest-axe`/`@testing-library` in the repo today (runtime tests are Meteor-mocha + Nightwatch). Every later task's verification needs a plain-jsdom harness that can render a React tree and run `axe`.

**Files:**
- Create: `jest.a11y.config.cjs`, `test/a11y/setup.js`
- Modify: `package.json` (devDeps + `test:a11y` script)

**Interfaces:** `npm run test:a11y` runs jest against `**/*.a11y.test.jsx` in a jsdom environment with `jest-axe`'s `toHaveNoViolations` matcher registered globally.

- [ ] **Step 1:** Add dev dependencies:
  ```bash
  npm install -D jest@^29 jest-environment-jsdom@^29 @testing-library/react@^15 \
    @testing-library/jest-dom@^6 @testing-library/user-event@^14 jest-axe@^9 \
    @babel/preset-env @babel/preset-react babel-jest
  ```
- [ ] **Step 2:** Create `test/a11y/setup.js`:
  ```js
  // test/a11y/setup.js
  import '@testing-library/jest-dom';
  import { toHaveNoViolations } from 'jest-axe';
  expect.extend(toHaveNoViolations);
  ```
- [ ] **Step 3:** Create `jest.a11y.config.cjs` (scoped to a11y tests so it never touches the Meteor bundle):
  ```js
  // jest.a11y.config.cjs
  module.exports = {
    testEnvironment: 'jsdom',
    testMatch: ['**/*.a11y.test.jsx'],
    setupFilesAfterEnv: ['<rootDir>/test/a11y/setup.js'],
    transform: {
      '^.+\\.(js|jsx)$': ['babel-jest', {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-react', { runtime: 'automatic' }]
        ]
      }]
    },
    // Meteor virtual imports are not resolvable in jsdom; a11y components must not import them.
    moduleNameMapper: {
      '^meteor/(.*)$': '<rootDir>/test/a11y/meteorStub.js'
    }
  };
  ```
- [ ] **Step 4:** Create `test/a11y/meteorStub.js` — a minimal stub so any incidental `meteor/*` import resolves:
  ```js
  // test/a11y/meteorStub.js — jsdom-only stub for meteor virtual packages
  export const Meteor = { isClient: true, settings: { public: {} } };
  export const Session = { get: () => undefined, set: () => {} };
  export const useTracker = (fn) => fn();
  export default {};
  ```
- [ ] **Step 5:** Add to `package.json` scripts: `"test:a11y": "jest --config jest.a11y.config.cjs"`.
- [ ] **Step 6: Verify** — create a throwaway `test/a11y/smoke.a11y.test.jsx` that renders `<button>hi</button>` and asserts `axe` finds no violations; run `npm run test:a11y` → PASS; delete the smoke file.
- [ ] **Step 7: Commit** — `git add jest.a11y.config.cjs test/a11y package.json package-lock.json && git commit -m "test(a11y): jsdom + jest-axe harness (dev-only, separate from meteor mocha)"`

---

### Task 1: A-3 — `lang="en"`, per-route `document.title`, focus-move on navigation

**Problem:** `client/main.html` ships `<title>Meteor App</title>` with **no `lang` attribute** and no runtime `documentElement.lang`; the title never changes across 90+ routes; SPA route changes never move focus to new content. **WCAG 3.1.1 (Language), 2.4.2 (Page Titled), 2.4.3 (Focus Order).**

**Files:**
- Modify: `client/main.html`
- Create: `imports/ui/a11y/RouteAnnouncer.jsx`
- Modify: `imports/ui/NavigationContext.jsx` (mount `RouteAnnouncer` — it already has router context, `App.jsx:1986`)
- Test: `imports/ui/a11y/RouteAnnouncer.a11y.test.jsx`

**Interfaces:** `RouteAnnouncer` renders nothing visible; on every `useLocation()` change it (a) sets `document.title` to a route-derived title, (b) moves focus to the main region, (c) announces the new page name via `useAnnounce()` (wired in Task 2 — until then it just sets title + focus).

- [ ] **Step 1:** In `client/main.html`, add `lang="en"` to the served document. Meteor generates the `<html>` tag, so set it at runtime AND via the `<head>`. Simplest reliable path: keep the `<head>`/`<body>` blocks and add a startup shim. In `client/main.html` update the title and add a script-free head; then in `imports/startup/client/` (or the top of `RouteAnnouncer`) ensure `document.documentElement.setAttribute('lang','en')`. Concretely, edit `client/main.html`:
  ```html
  <head>
    <title>Honeycomb FHIR</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover">
    ...
  </head>
  ```
  (Meteor does not let you put `lang` on `<html>` from `main.html` directly; the runtime `setAttribute` below is authoritative.)
- [ ] **Step 2:** Create `imports/ui/a11y/RouteAnnouncer.jsx`:
  ```jsx
  // imports/ui/a11y/RouteAnnouncer.jsx
  import { useEffect } from 'react';
  import { useLocation } from 'react-router-dom';
  import { get } from 'lodash';

  // Map a pathname to a human page title. First segment, title-cased, else "Home".
  export function deriveTitle(pathname) {
    const seg = get((pathname || '/').split('/').filter(Boolean), '0', '');
    if (!seg) return 'Home';
    return seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
  }

  export function RouteAnnouncer({ announce }) {
    const location = useLocation();
    useEffect(function () {
      document.documentElement.setAttribute('lang', 'en');
      const pageName = deriveTitle(location.pathname);
      document.title = pageName + ' · Honeycomb FHIR';
      // Move focus to main content region on route change (WCAG 2.4.3).
      const main = document.getElementById('mainAppRouter');
      if (main) {
        main.setAttribute('tabindex', '-1');
        main.focus({ preventScroll: false });
      }
      if (typeof announce === 'function') {
        announce('Navigated to ' + pageName);
      }
    }, [location.pathname]);
    return null;
  }
  ```
- [ ] **Step 3:** Mount it in `NavigationContext.jsx` (inside the provider, which sits under `<Router>` so `useLocation` is valid). Import `RouteAnnouncer` and `useAnnounce` (Task 2), and render `<RouteAnnouncer announce={announce} />` alongside `{children}`. Until Task 2 lands, pass no `announce` prop (title + focus still work).
- [ ] **Step 4:** Write `imports/ui/a11y/RouteAnnouncer.a11y.test.jsx` — render inside `MemoryRouter`, assert `deriveTitle('/patients')` === `'Patients'`, `deriveTitle('/')` === `'Home'`; render `<div id="mainAppRouter"/>` + `<RouteAnnouncer/>` and assert `document.title` contains `Home` and `document.documentElement.lang === 'en'`. Run `npm run test:a11y` → PASS.
- [ ] **Step 5: Verify** — boot (`meteor run --settings settings/settings.honeycomb.localhost.json`); navigate between two routes; confirm the browser tab title changes and DOM inspector shows `<html lang="en">`.
- [ ] **Step 6: Commit** — `git add client/main.html imports/ui/a11y/RouteAnnouncer.jsx imports/ui/NavigationContext.jsx imports/ui/a11y/RouteAnnouncer.a11y.test.jsx && git commit -m "feat(a11y): lang=en + per-route document.title and focus-move (WCAG 3.1.1/2.4.2/2.4.3)"`

---

### Task 2: A-2 — one app-level `aria-live` region + `useAnnounce()` hook

**Problem:** `grep -rho aria-live imports/` = **0**. 88 `CircularProgress` spinners have no `role="status"`; loading/save-success/error transitions are silent to assistive tech. **WCAG 4.1.3 (Status Messages).**

**Files:**
- Create: `imports/ui/a11y/LiveRegionProvider.jsx` (provider + `useAnnounce()`)
- Modify: `imports/ui/App.jsx` (wrap render tree just inside `CustomThemeProvider`)
- Modify: `imports/ui/NavigationContext.jsx` (feed `announce` into `RouteAnnouncer` from Task 1)
- Test: `imports/ui/a11y/LiveRegionProvider.a11y.test.jsx`

**Interfaces:** `LiveRegionProvider` renders a single visually-hidden `role="status" aria-live="polite" aria-atomic="true"` node and exposes `useAnnounce()` → `(message, politeness?) => void`. A second `role="alert" aria-live="assertive"` node handles errors. Any component (loading states, snackbars, error boundaries) calls `announce()` instead of wiring its own live region.

- [ ] **Step 1:** Write `imports/ui/a11y/LiveRegionProvider.a11y.test.jsx` FIRST — render `<LiveRegionProvider>` with a child that calls `useAnnounce()('Saved')` on mount; assert the `role="status"` node's text becomes `Saved`; assert `axe` finds no violations. Run → FAIL (module missing).
- [ ] **Step 2:** Implement `imports/ui/a11y/LiveRegionProvider.jsx`:
  ```jsx
  // imports/ui/a11y/LiveRegionProvider.jsx
  import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

  const AnnounceContext = createContext(function () {});

  // Visually-hidden but screen-reader-available (do not use display:none — SRs skip it).
  const srOnly = {
    position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
    overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0
  };

  export function LiveRegionProvider({ children }) {
    const [polite, setPolite] = useState('');
    const [assertive, setAssertive] = useState('');
    const clearTimer = useRef(null);

    const announce = useCallback(function (message, politeness) {
      if (!message) return;
      const setter = politeness === 'assertive' ? setAssertive : setPolite;
      // Clear then set on next tick so identical consecutive messages re-announce.
      setter('');
      window.requestAnimationFrame(function () { setter(String(message)); });
      if (clearTimer.current) clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(function () { setter(''); }, 4000);
    }, []);

    return (
      <AnnounceContext.Provider value={announce}>
        {children}
        {/* class names let the print stylesheet / e2e find these */}
        <div className="a11y-live-status" role="status" aria-live="polite" aria-atomic="true" style={srOnly}>
          {polite}
        </div>
        <div className="a11y-live-alert" role="alert" aria-live="assertive" aria-atomic="true" style={srOnly}>
          {assertive}
        </div>
      </AnnounceContext.Provider>
    );
  }

  export function useAnnounce() {
    return useContext(AnnounceContext);
  }
  ```
- [ ] **Step 3:** Run test → PASS.
- [ ] **Step 4:** Wrap the App render tree. In `imports/ui/App.jsx`, inside `<CustomThemeProvider>` and around `<Router>` (so both router and chrome can announce), add `<LiveRegionProvider>...</LiveRegionProvider>`. Import at top: `import { LiveRegionProvider } from './a11y/LiveRegionProvider.jsx';`
  ```jsx
  <CustomThemeProvider>
    <LiveRegionProvider>
      <Router>
        <NavigationProvider>
          ...
        </NavigationProvider>
      </Router>
    </LiveRegionProvider>
  </CustomThemeProvider>
  ```
- [ ] **Step 5:** In `NavigationContext.jsx`, call `const announce = useAnnounce();` and pass it: `<RouteAnnouncer announce={announce} />` (completes Task 1's route announce).
- [ ] **Step 6:** Wire one real exemplar so the region is exercised: in `StyledMainRouter`'s `isLoading` branch (`App.jsx:2086`), add `role="status"` + a visually-hidden "Loading" text to the spinner: `<CircularProgress aria-label="Loading" role="status" />`. (Broad spinner adoption is opportunistic; one wiring proves the region.)
- [ ] **Step 7:** Add the print-safety rule — in `client/main.css` `@media print` block, add `.a11y-live-status, .a11y-live-alert { display: none !important; }` (they're already offscreen, but keep them out of print snapshots).
- [ ] **Step 8: Verify** — boot; with VoiceOver (or Chrome's Accessibility tree in DevTools) confirm a `status` live region exists in the tree and that navigating routes updates it.
- [ ] **Step 9: Commit** — `git add imports/ui/a11y/LiveRegionProvider.jsx imports/ui/App.jsx imports/ui/NavigationContext.jsx client/main.css imports/ui/a11y/LiveRegionProvider.a11y.test.jsx && git commit -m "feat(a11y): app-level aria-live status/alert region + useAnnounce() (WCAG 4.1.3)"`

---

### Task 3: A-5 — landmarks (`<nav>`/`<main>`) + skip link

**Problem:** `grep <nav / role="navigation"` in `imports/` = **0**; `Header.jsx`/`SideDrawer.jsx` use `AppBar`/`Drawer` with no nav landmark; there is **no skip link**. (`<main id="mainAppRouter">` already exists in `StyledMainRouter` — reuse it as the skip target.) **WCAG 1.3.1 (Info & Relationships), 2.4.1 (Bypass Blocks).**

**Files:**
- Create: `imports/ui/a11y/SkipLink.jsx`
- Modify: `imports/ui/App.jsx` (render `<SkipLink>` first child in the render tree)
- Modify: `imports/ui/Header.jsx` (`AppBar component="nav"` + `aria-label="Primary"`)
- Modify: `imports/ui/SideDrawer.jsx` (`Drawer` inner content wrapped in `component="nav"` + `aria-label="Resource navigation"`)
- Modify: `client/main.css` (skip-link visible-on-focus styles; hide in print)
- Test: `imports/ui/a11y/SkipLink.a11y.test.jsx`

**Interfaces:** `SkipLink` renders an `<a href="#mainAppRouter">Skip to main content</a>` that is offscreen until focused, then visible at top-left; activating it moves focus to `#mainAppRouter`.

- [ ] **Step 1:** Write `imports/ui/a11y/SkipLink.a11y.test.jsx` — render `<SkipLink/>`, assert an anchor with text "Skip to main content" and `href="#mainAppRouter"`; assert `axe` no violations. FAIL first.
- [ ] **Step 2:** Implement `imports/ui/a11y/SkipLink.jsx`:
  ```jsx
  // imports/ui/a11y/SkipLink.jsx
  import React from 'react';

  export function SkipLink() {
    return (
      <a href="#mainAppRouter" className="a11y-skip-link">
        Skip to main content
      </a>
    );
  }
  ```
- [ ] **Step 3:** Add styles to `client/main.css` (visible only on keyboard focus; theme-neutral, high contrast; hidden in print):
  ```css
  .a11y-skip-link {
    position: absolute; left: -9999px; top: 0; z-index: 2000;
    padding: 8px 16px; background: #ffffff; color: #000000;
    border: 2px solid #1976d2; border-radius: 0 0 4px 0; text-decoration: none;
  }
  .a11y-skip-link:focus { left: 0; }
  @media print { .a11y-skip-link { display: none !important; } }
  ```
- [ ] **Step 4:** In `App.jsx`, render `<SkipLink/>` as the FIRST child of `#primaryFlexPanel` (before `<CustomThemeProvider>`), so it's first in tab order. Import at top.
- [ ] **Step 5:** In `Header.jsx`, make the primary `AppBar` a nav landmark: `<AppBar component="nav" aria-label="Primary navigation" ...>` (line ~410). Leave the secondary/prominent AppBar as-is or label it `aria-label="Patient context"`.
- [ ] **Step 6:** In `SideDrawer.jsx`, wrap the drawer's list content in `<Box component="nav" aria-label="Resource navigation">...</Box>` (do not put the role on the `Drawer` root — the portal wrapper is not the nav).
- [ ] **Step 7:** Run `npm run test:a11y` → PASS.
- [ ] **Step 8: Verify** — boot; press Tab once from a fresh page load → the skip link appears top-left; press Enter → focus jumps to main content. In DevTools Accessibility tree confirm `navigation` landmarks for header and drawer and a single `main`.
- [ ] **Step 9: Commit** — `git add imports/ui/a11y/SkipLink.jsx imports/ui/App.jsx imports/ui/Header.jsx imports/ui/SideDrawer.jsx client/main.css imports/ui/a11y/SkipLink.a11y.test.jsx && git commit -m "feat(a11y): nav/main landmarks + skip link (WCAG 1.3.1/2.4.1)"`

---

### Task 4: A-4 — ESLint `jsx-a11y` icon-button rule + codemod

**Problem:** **~455 `aria-label` across ~728 `IconButton`s** — partial, not absent. Pagination, row search/delete, and toolbar icon-only buttons are the likely unlabeled gaps; `Tooltip` does not reliably name the control. A lint rule closes it and prevents regression. **WCAG 4.1.2, 1.1.1.**

**Files:**
- Create: `.eslintrc.a11y.cjs` (scoped lint config)
- Create: `scripts/codemod-iconbutton-aria.js` (jscodeshift transform)
- Modify: `package.json` (devDeps + `lint:a11y` script)

**Interfaces:** `npm run lint:a11y` runs ESLint with `jsx-a11y/control-has-associated-label` (and `jsx-a11y/no-autofocus` off) over `imports/**/*.jsx`, flagging icon-only `IconButton`s lacking an accessible name. The codemod bulk-adds `aria-label` derived from the child icon component name (`<DeleteIcon/>` → `aria-label="Delete"`) to the common toolbar/pagination/row buttons.

- [ ] **Step 1:** Add dev deps: `npm install -D eslint@^8 eslint-plugin-jsx-a11y@^6 jscodeshift@^0.15`.
- [ ] **Step 2:** Create `.eslintrc.a11y.cjs`:
  ```js
  // .eslintrc.a11y.cjs — a11y-only lint pass (separate from any app eslint)
  module.exports = {
    root: true,
    parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
    plugins: ['jsx-a11y'],
    settings: {
      'jsx-a11y': {
        components: { IconButton: 'button' } // treat MUI IconButton as a <button>
      }
    },
    rules: {
      'jsx-a11y/control-has-associated-label': ['warn', {
        labelAttributes: ['aria-label', 'aria-labelledby', 'title'],
        controlComponents: ['IconButton']
      }]
    }
  };
  ```
- [ ] **Step 3:** Add scripts to `package.json`: `"lint:a11y": "eslint --config .eslintrc.a11y.cjs 'imports/**/*.jsx'"` and `"codemod:iconbutton": "jscodeshift -t scripts/codemod-iconbutton-aria.js imports/"`.
- [ ] **Step 4:** Run `npm run lint:a11y` → capture the baseline count of flagged IconButtons (expect roughly `728 - 455 ≈` a few hundred, minus those with `title`/`Tooltip`).
- [ ] **Step 5:** Write `scripts/codemod-iconbutton-aria.js` — jscodeshift transform: for each `<IconButton>` JSX element with **no** `aria-label`/`aria-labelledby`/text child, look at the single icon child (`<XyzIcon/>`), strip the `Icon` suffix, humanize (`ArrowForwardIcon` → `Arrow forward`), and insert `aria-label="..."`. Skip buttons that have textual children or already have a label.
  ```js
  // scripts/codemod-iconbutton-aria.js
  module.exports = function (file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);
    function humanize(name) {
      return name.replace(/Icon$/, '')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/^./, function (c) { return c.toUpperCase(); });
    }
    root.findJSXElements('IconButton').forEach(function (path) {
      const attrs = path.node.openingElement.attributes || [];
      const hasLabel = attrs.some(function (a) {
        return a.type === 'JSXAttribute' &&
          ['aria-label', 'aria-labelledby'].indexOf(a.name && a.name.name) !== -1;
      });
      if (hasLabel) return;
      const iconChild = (path.node.children || []).find(function (c) {
        return c.type === 'JSXElement' &&
          c.openingElement.name.type === 'JSXIdentifier' &&
          /Icon$/.test(c.openingElement.name.name);
      });
      const textChild = (path.node.children || []).some(function (c) {
        return c.type === 'JSXText' && c.value.trim().length > 0;
      });
      if (!iconChild || textChild) return;
      path.node.openingElement.attributes.push(
        j.jsxAttribute(j.jsxIdentifier('aria-label'),
          j.literal(humanize(iconChild.openingElement.name.name)))
      );
    });
    return root.toSource({ quote: 'single' });
  };
  ```
- [ ] **Step 6:** Run `npm run codemod:iconbutton`; then `git diff --stat` to see how many files changed. Spot-check ~5 diffs for sane labels (e.g. `DeleteIcon` → `aria-label="Delete"`); fix any obviously-wrong humanizations by hand.
- [ ] **Step 7:** Re-run `npm run lint:a11y` → the flagged count should drop sharply (residual = IconButtons whose child isn't a single `*Icon`; note these for manual follow-up, do not block).
- [ ] **Step 8: Verify** — boot; open a page with pagination + a data table; DevTools Accessibility tree shows named buttons (no "button" with empty name) for the codemodded controls.
- [ ] **Step 9: Commit** — `git add .eslintrc.a11y.cjs scripts/codemod-iconbutton-aria.js package.json package-lock.json imports/ && git commit -m "feat(a11y): jsx-a11y icon-button lint + aria-label codemod (WCAG 4.1.2/1.1.1)"`

---

### Task 5: A-1 bridge — interim `ClickableTableRow` (stopgap only) + A-6 status-Chip audit

**Problem (A-1 bridge):** Keyboard-operable rows are DELIVERED by `ResourceTable` (dynamicfhir plan Task 4). But 125+ files still put `onClick` on `<TableRow>` with zero keyboard support and won't migrate to the shell immediately. A tiny shared wrapper gives them Enter/Space + focus NOW, retired as each table moves to `ResourceTable`.
**Problem (A-6):** 69 `Chip color=` usages in `ui-fhir` encode FHIR status (active/final/amended/error); most carry a text label already (mitigating), but color-only cases fail **WCAG 1.4.1 (Use of Color)**. Audit for a text/icon backup.

**Files:**
- Create: `imports/ui-tables/ClickableTableRow.jsx` (bridging; note in header comment)
- Test: `imports/ui-tables/ClickableTableRow.a11y.test.jsx`
- Audit output: `fable/a11y-chip-audit.md` (findings list; fixes are follow-ups unless trivial)

**Interfaces:** `ClickableTableRow({ onOpen, children, ...rest })` — an MUI `TableRow` with `tabIndex={0}`, `role="button"`, `onClick={onOpen}`, and `onKeyDown` firing `onOpen` on Enter/Space (with `preventDefault` on Space). Drop-in for `<TableRow hover onClick={...}>`. **Explicitly a bridge**: the durable fix is `ResourceTable`; this exists for un-migrated tables and is deleted per-file as they convert.

- [ ] **Step 1:** Write `imports/ui-tables/ClickableTableRow.a11y.test.jsx` — render inside `<table><tbody>`, assert the row has `tabIndex=0` and `role="button"`; fire `keyDown` Enter and Space and assert `onOpen` called each time; `axe` no violations. FAIL first.
- [ ] **Step 2:** Implement:
  ```jsx
  // imports/ui-tables/ClickableTableRow.jsx
  // BRIDGE: interim keyboard-operable row for tables not yet migrated to
  // imports/ui-tables/ResourceTable.jsx (see docs/superpowers/plans/2026-07-01-dynamicfhir-enhancement.md Task 4).
  // Retire per-file as tables convert to ResourceTable.
  import React from 'react';
  import TableRow from '@mui/material/TableRow';

  export function ClickableTableRow({ onOpen, children, ...rest }) {
    function handleKeyDown(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (typeof onOpen === 'function') onOpen(event);
      }
    }
    return (
      <TableRow
        hover
        tabIndex={0}
        role="button"
        onClick={onOpen}
        onKeyDown={handleKeyDown}
        sx={{ cursor: 'pointer', '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' } }}
        {...rest}
      >
        {children}
      </TableRow>
    );
  }
  ```
- [ ] **Step 3:** Run test → PASS. Convert ONE high-traffic un-migrated table as the exemplar (e.g. a `*Table.jsx` not slated for the shell yet) from `<TableRow hover onClick={...}>` to `<ClickableTableRow onOpen={...}>`; boot and confirm the row is Tab-focusable and Enter/Space opens the record.
- [ ] **Step 4: A-6 audit** — enumerate color-only Chips:
  ```bash
  grep -rn "Chip" imports/ui-fhir --include=*.jsx | grep "color=" > /tmp/chips.txt
  ```
  For each hit, check whether the same `<Chip>` also sets a `label`/`icon`/child text. Record any Chip that conveys status via `color` alone (no text/icon) in `fable/a11y-chip-audit.md` with file:line and the suggested backup (add `label` text or a status `icon`). Fix any trivial one-liners inline; leave the rest as an itemized follow-up list. (Most carry text — expect a short list.)
- [ ] **Step 5: Verify** — `npm run test:a11y` green; boot the exemplar table and one audited Chip page.
- [ ] **Step 6: Commit** — `git add imports/ui-tables/ClickableTableRow.jsx imports/ui-tables/ClickableTableRow.a11y.test.jsx fable/a11y-chip-audit.md && git commit -m "feat(a11y): bridging ClickableTableRow + status-Chip color-only audit (WCAG 2.1.1/1.4.1)"`

---

### Task 6: CI gate — jest-axe over a sample of pages

**Problem:** Without a gate, these structural gains regress silently. Lock them with `jest-axe` over a representative sample of the shared primitives + a couple of real pages, run in CI. **Prevents regression across all findings.**

**Files:**
- Create: `imports/ui/a11y/sampledPages.a11y.test.jsx`
- Create: `scripts/a11y-ci.js` (thin runner + threshold)
- Modify: `package.json` (`a11y:ci` script); CI workflow (`.circleci/config.yml` or equivalent) to call it

**Interfaces:** `npm run a11y:ci` runs the a11y jest suite and exits non-zero on any `axe` violation. The sampled-pages test renders the shared chrome primitives (SkipLink, LiveRegionProvider, ClickableTableRow) and 2–3 leaf views that are jsdom-renderable (mock `meteor/*` via the Task 0 stub) and asserts zero violations.

- [ ] **Step 1:** Write `imports/ui/a11y/sampledPages.a11y.test.jsx` — for each of: `<SkipLink/>`, a `<LiveRegionProvider><button>ok</button></LiveRegionProvider>`, and a `<table><tbody><ClickableTableRow onOpen={()=>{}}><td>x</td></ClickableTableRow></tbody></table>`, run `axe` and assert `toHaveNoViolations`. (Keep to jsdom-renderable trees; full Meteor pages stay in Nightwatch.)
- [ ] **Step 2:** Create `scripts/a11y-ci.js` that shells `jest --config jest.a11y.config.cjs --ci` and propagates the exit code (or just alias the script — the runner exists mainly to be the documented CI entry point).
- [ ] **Step 3:** Add `"a11y:ci": "jest --config jest.a11y.config.cjs --ci"` to `package.json`.
- [ ] **Step 4:** Add a CI step. Find the CI config (`ls .circleci/config.yml .github/workflows/*.yml 2>/dev/null`) and add a job/step running `npm run a11y:ci` (Node-only, no Meteor bundle needed — fast). If no CI config is present, document the command in the plan's follow-up and add it to the repo's test docs.
- [ ] **Step 5: Verify** — run `npm run a11y:ci` locally → exits 0, all sampled trees pass. Temporarily break one (remove `role="button"` from `ClickableTableRow`) and confirm the gate exits non-zero, then revert.
- [ ] **Step 6: Commit** — `git add imports/ui/a11y/sampledPages.a11y.test.jsx scripts/a11y-ci.js package.json .circleci/config.yml && git commit -m "ci(a11y): jest-axe gate over sampled primitives/pages to lock WCAG gains"`

---

## Self-review notes (applied)

- **A-1 not duplicated.** The durable keyboard-row fix is the `ResourceTable` shell in `docs/superpowers/plans/2026-07-01-dynamicfhir-enhancement.md` Task 4 — referenced, not re-implemented. Task 5 adds only a clearly-labelled **bridge** (`ClickableTableRow`) for un-migrated tables, retired as they convert.
- **This plan = global scaffolding only:** A-3 (`lang`/title/focus, Task 1), A-2 (live region + `useAnnounce`, Task 2), A-5 (landmarks + skip link, Task 3), A-4 (lint + codemod, Task 4), A-6 (Chip audit, Task 5), plus the CI gate (Task 6).
- **Anchors verified firsthand:** `client/main.html` = `<title>Meteor App</title>`, no `lang`; `grep -rho aria-live imports/` = 0; IconButton 728 / aria-label 455 (finding's ~708/450); `grep <nav`/`role="navigation"` = 0; `<main id="mainAppRouter">` already exists in `StyledMainRouter` (reused as skip target); `NavigationProvider` sits under `<Router>` (has `useLocation` — correct mount point for the route announcer).
- **Harness isolation:** a11y tests run in a **separate** jsdom/jest harness (`test:a11y` / `a11y:ci`), never the Meteor mocha `npm test`; `meteor/*` imports are stubbed so leaf components render without a bundle.
- **Print-safe:** skip link and live regions are added to the `@media print` hidden set in `client/main.css`.
- **Each task is TDD + boot-verified + committed:** failing test first (Tasks 2/3/5/6), then implement to green, then a manual boot check of the real behavior in the running app.
- **Structural, inheritable wins:** the live region, route announcer, landmarks, and skip link live once in the layout chrome — every one of the ~90 resource views inherits them without per-view edits.
