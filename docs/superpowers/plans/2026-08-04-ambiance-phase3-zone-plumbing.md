# Ambiance Phase 3: Zone Plumbing, Surface System & Curation Tools — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Phase 3 of the Ambiance Experience Zone spec (`docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md`): `enableAmbiance`/`enableFluidInterface` route flags, the AmbianceZone wrapper with composition contract + theme-override net, `Meteor.StyledCard`/`Meteor.StyledContainer`, hotkey graduations (Ctrl+Shift+L cycle, Ctrl+Shift+K per-route card↔full-height), the Ambiance Tuning HUD (Ctrl+Shift+E), Card Surface mini-preview, print hardening, and the three initial zone routes.

**Architecture:** Two new pure modules (`ambianceComposition.js`, `surfaceStyles.js`) carry the testable logic. `AmbianceZone` (a guard like PatientGuard) assembles the composition object, provides it via `useAmbiance()` context + CSS vars, and wraps children in a page-mode theme carrying MuiCard/MuiPaper overrides so raw MUI cards stay legible. `StyledMainRouter` gates ambiance painting per-route and composes the zone into the guard chain. StyledCard/StyledContainer are the premium consumers, Meteor-object-distributed like `Meteor.useTheme`.

**Tech Stack:** Meteor v3 + React 18 + MUI v5, `node --experimental-detect-module --test` for pure modules.

## Global Constraints

- Coding style (root `CLAUDE.md`): `function() {}` declarations, lodash `get()` defensive reads, first line of every new file = its commented path, no `index.js`, camelCase filenames for function modules / PascalCase for components.
- **HANDS OFF the running app**: the user's dev server may be running on :3000 with HMR — never start, stop, restart, or kill any process; never install anything outside the repo. Verification = unit tests, syntax checks (`node --experimental-detect-module --check` for non-JSX; `npx esbuild --loader=jsx` transform for JSX), and careful re-reads. The controller does live browser checks separately.
- Unit tests in `tests/unit/` mirroring source; scripts registered in `package.json` after `"test:ambiance-analysis"`; CI run steps in `.circleci/config.yml` immediately after the "Ambiance image analysis" step (same bare-checkout job — subjects must have ZERO imports).
- Session keys via constants in `imports/lib/SessionKeys.js`; new cross-file keys also join the `chrome` group in `imports/lib/sessionKeyGroups.js`.
- `git add` specific paths only — NEVER `git add -A` (working tree carries an unrelated dirty `libraries/dcmjs` submodule pointer; leave it).
- `extensions/*` are SEPARATE nested git repos (gitignored from the monorepo): edits there are committed IN that extension's repo (plain `git -C extensions/<name> add <file> && git -C extensions/<name> commit`), never pushed, never staged in the monorepo.
- Persisted-choice contract (`imports/lib/themePersistence.js`): flat JSON via merge-writes; unknown values must be treated as unset at boot.
- Existing interfaces consumed here (all shipped in Phases 1-2): `isColorBackground/colorFromBackground` (`imports/ui/theme/backgroundValue.js`), `getBackgroundLibrary/getBackgroundEntry/EARTH_TONES` (`imports/ui/themeBackgrounds.js`), `buildPageModeTheme(appTheme, forcedMode)` (`imports/ui/theme/pageModeTheme.js`), `setPageMode/setCardSurface` (`imports/ui/themePresets.js`), `PAGE_MODE`/`CARD_SURFACE` (`imports/lib/SessionKeys.js`).
- `Meteor.settings.public.theme.backgroundImagePath` is read as a PLAIN render read — NEVER wrapped in useTracker (zero reactive deps; the CustomThemeProvider rebuild re-renders consumers).

---

### Task 1: `ambianceComposition.js` — the composition contract (TDD)

**Files:**
- Create: `imports/ui/theme/ambianceComposition.js`
- Test: `tests/unit/imports/ui/theme/ambianceComposition.test.mjs`
- Modify: `package.json`, `.circleci/config.yml` (script + CI step per Global Constraints)

**Interfaces:**
- Consumes: nothing (pure, zero imports — reimplements the `color:` prefix check locally to stay dependency-free for the bare-checkout CI job).
- Produces: `resolveComposition({ background, entry, pageMode, cardSurface, surfaceOverride })` → `{ background, kind: 'image'|'color'|'none', focus, scrimStrength, pageMode, cardSurface }`. Rules: `kind` from the background string (`''`/falsy → `'none'`, `'color:'` prefix → `'color'`, else `'image'`); `focus` = entry.focus if `'left'|'center'|'right'` else `'center'`; `scrimStrength` = entry.scrimStrength clamped [0,1] else `0.55`; `pageMode` = explicit pageMode if `'light'|'dark'`, else entry.recommendedPageMode if valid, else `null` — **both forced to `null` when kind is `'none'`**; `cardSurface` = surfaceOverride if `'solid'|'glass'|'flat'`, else cardSurface if valid, else `'solid'`. Tasks 3, 8, 9 consume this.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/unit/imports/ui/theme/ambianceComposition.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveComposition } from '../../../../../imports/ui/theme/ambianceComposition.js';

test('no background → kind none, no forced ink, defaults', function() {
  const c = resolveComposition({ background: '', entry: null, pageMode: 'dark', cardSurface: 'glass' });
  assert.deepEqual(c, { background: '', kind: 'none', focus: 'center', scrimStrength: 0.55, pageMode: null, cardSurface: 'glass' });
});

test('image with full curation record resolves verbatim', function() {
  const c = resolveComposition({
    background: '/backgrounds/ambiance/Yoga-Ocean.jpg',
    entry: { focus: 'left', recommendedPageMode: 'dark', scrimStrength: 0.6 },
    pageMode: null, cardSurface: 'flat'
  });
  assert.equal(c.kind, 'image');
  assert.equal(c.focus, 'left');
  assert.equal(c.scrimStrength, 0.6);
  assert.equal(c.pageMode, 'dark');       // curated fallback when user pageMode unset
  assert.equal(c.cardSurface, 'flat');
});

test('explicit pageMode beats curated recommendation', function() {
  const c = resolveComposition({
    background: '/x.jpg', entry: { recommendedPageMode: 'dark' }, pageMode: 'light', cardSurface: 'solid'
  });
  assert.equal(c.pageMode, 'light');
});

test('solid color → kind color, center focus, entry ignored', function() {
  const c = resolveComposition({ background: 'color:#a67b5b', entry: null, pageMode: 'light', cardSurface: 'solid' });
  assert.equal(c.kind, 'color');
  assert.equal(c.focus, 'center');
  assert.equal(c.pageMode, 'light');      // solids still take forced ink
});

test('surfaceOverride wins over global cardSurface; junk values fall back', function() {
  const c = resolveComposition({ background: '/x.jpg', entry: {}, pageMode: 'purple', cardSurface: 'wobbly', surfaceOverride: 'flat' });
  assert.equal(c.cardSurface, 'flat');
  assert.equal(c.pageMode, null);
  const d = resolveComposition({ background: '/x.jpg', entry: {}, pageMode: null, cardSurface: 'wobbly' });
  assert.equal(d.cardSurface, 'solid');
});

test('scrimStrength clamps to [0,1] and defaults to 0.55', function() {
  assert.equal(resolveComposition({ background: '/x.jpg', entry: { scrimStrength: 7 } }).scrimStrength, 1);
  assert.equal(resolveComposition({ background: '/x.jpg', entry: { scrimStrength: -2 } }).scrimStrength, 0);
  assert.equal(resolveComposition({ background: '/x.jpg', entry: {} }).scrimStrength, 0.55);
});
```

- [ ] **Step 2: Run to verify FAIL** — `node --experimental-detect-module --test tests/unit/imports/ui/theme/ambianceComposition.test.mjs` → `Cannot find module`.

- [ ] **Step 3: Implement**

```javascript
// imports/ui/theme/ambianceComposition.js
//
// The zone composition contract: resolve the active background + curation
// record + persisted axes into the single layout object every enableAmbiance
// route receives ("a background choice never arrives blank" — defaults fill
// every gap). Pure and zero-import (bare-checkout node --test safe); the
// 'color:' check is duplicated from backgroundValue.js deliberately to keep
// this module dependency-free. Spec:
// docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md

const FOCUS_VALUES = ['left', 'center', 'right'];
const SURFACE_VALUES = ['solid', 'glass', 'flat'];
const MODE_VALUES = ['light', 'dark'];

function backgroundKind(background) {
  if (!background || typeof background !== 'string') { return 'none'; }
  if (background.indexOf('color:') === 0) { return 'color'; }
  return 'image';
}

export function resolveComposition(options) {
  const opts = options || {};
  const background = (typeof opts.background === 'string') ? opts.background : '';
  const entry = opts.entry || {};
  const kind = backgroundKind(background);

  const focus = FOCUS_VALUES.indexOf(entry.focus) !== -1 ? entry.focus : 'center';

  let scrim = typeof entry.scrimStrength === 'number' ? entry.scrimStrength : 0.55;
  scrim = Math.min(1, Math.max(0, scrim));

  let pageMode = MODE_VALUES.indexOf(opts.pageMode) !== -1 ? opts.pageMode : null;
  if (!pageMode && MODE_VALUES.indexOf(entry.recommendedPageMode) !== -1) {
    pageMode = entry.recommendedPageMode;
  }
  if (kind === 'none') { pageMode = null; }

  let cardSurface = SURFACE_VALUES.indexOf(opts.surfaceOverride) !== -1 ? opts.surfaceOverride
    : (SURFACE_VALUES.indexOf(opts.cardSurface) !== -1 ? opts.cardSurface : 'solid');

  return {
    background: background,
    kind: kind,
    focus: kind === 'image' ? focus : 'center',
    scrimStrength: scrim,
    pageMode: pageMode,
    cardSurface: cardSurface
  };
}
```

- [ ] **Step 4: Run to verify PASS** (6 tests).

- [ ] **Step 5: Wire script + CI step**

`package.json` after `"test:ambiance-analysis"`:
```json
"test:ambiance-composition": "node --experimental-detect-module --test tests/unit/imports/ui/theme/ambianceComposition.test.mjs",
```
`.circleci/config.yml` after the "Ambiance image analysis" run step:
```yaml
      - run:
          name: Ambiance composition contract
          command: npm run test:ambiance-composition
```

- [ ] **Step 6: Commit**
```bash
git add imports/ui/theme/ambianceComposition.js tests/unit/imports/ui/theme/ambianceComposition.test.mjs package.json .circleci/config.yml
git commit -m "feat(theme): composition contract — resolveComposition for ambiance zones"
```

---

### Task 2: `surfaceStyles.js` — shared glass/flat/solid card styles (TDD)

**Files:**
- Create: `imports/ui/theme/surfaceStyles.js`
- Test: `tests/unit/imports/ui/theme/surfaceStyles.test.mjs`
- Modify: `package.json`, `.circleci/config.yml` (same pattern as Task 1)

**Interfaces:**
- Consumes: nothing (pure; local hex-alpha helper instead of @mui `alpha`).
- Produces:
  - `SURFACE_TRANSITION` — string: `'background-color 0.35s ease, backdrop-filter 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease, opacity 0.35s ease'`
  - `hexAlpha(hex, alpha)` → `'rgba(r, g, b, a)'` (accepts `#rgb`/`#rrggbb`; non-hex input returned unchanged)
  - `buildSurfaceStyles({ surface, paperColor, dividerColor })` → `{ root }` where `root` is a plain style object for MuiCard/MuiPaper overrides: `solid` → `{ transition: SURFACE_TRANSITION }`; `glass` → panel at 0.72 alpha + `backdropFilter: 'blur(8px)'` + hairline border + no shadow (the DirectoryConsole `--panel` recipe, generalized); `flat` → fully transparent, no border/shadow (the melt-into-negative-space state). All include the transition so state changes animate.
- Tasks 3 and 5 consume this.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/unit/imports/ui/theme/surfaceStyles.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSurfaceStyles, hexAlpha, SURFACE_TRANSITION } from '../../../../../imports/ui/theme/surfaceStyles.js';

test('hexAlpha converts 6- and 3-digit hex; passes through non-hex', function() {
  assert.equal(hexAlpha('#18181a', 0.72), 'rgba(24, 24, 26, 0.72)');
  assert.equal(hexAlpha('#fff', 0.5), 'rgba(255, 255, 255, 0.5)');
  assert.equal(hexAlpha('teal', 0.5), 'teal');
});

test('solid keeps the surface opaque (only the transition is added)', function() {
  const s = buildSurfaceStyles({ surface: 'solid', paperColor: '#18181a', dividerColor: '#333' });
  assert.deepEqual(Object.keys(s.root), ['transition']);
  assert.equal(s.root.transition, SURFACE_TRANSITION);
});

test('glass is translucent paper + blur + hairline, shadowless', function() {
  const s = buildSurfaceStyles({ surface: 'glass', paperColor: '#18181a', dividerColor: '#333' });
  assert.equal(s.root.backgroundColor, 'rgba(24, 24, 26, 0.72)');
  assert.equal(s.root.backdropFilter, 'blur(8px)');
  assert.equal(s.root.border, '1px solid #333');
  assert.equal(s.root.boxShadow, 'none');
  assert.equal(s.root.transition, SURFACE_TRANSITION);
});

test('flat melts into negative space', function() {
  const s = buildSurfaceStyles({ surface: 'flat', paperColor: '#18181a', dividerColor: '#333' });
  assert.equal(s.root.backgroundColor, 'transparent');
  assert.equal(s.root.border, 'none');
  assert.equal(s.root.boxShadow, 'none');
  assert.equal(s.root.backgroundImage, 'none');
  assert.equal(s.root.transition, SURFACE_TRANSITION);
});

test('unknown surface behaves as solid', function() {
  const s = buildSurfaceStyles({ surface: 'wobbly', paperColor: '#18181a', dividerColor: '#333' });
  assert.deepEqual(Object.keys(s.root), ['transition']);
});
```

- [ ] **Step 2: Run to verify FAIL.**

- [ ] **Step 3: Implement**

```javascript
// imports/ui/theme/surfaceStyles.js
//
// Shared card-surface styles for the three states (solid | glass | flat) —
// the DirectoryConsole overlay recipe generalized so AmbianceZone's
// MuiCard/MuiPaper overrides and Meteor.StyledCard share one source of
// truth. Pure and zero-import (bare-checkout node --test safe); hexAlpha is
// a local helper so we don't pull in @mui utilities. Spec:
// docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md

export const SURFACE_TRANSITION =
  'background-color 0.35s ease, backdrop-filter 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease, opacity 0.35s ease';

export function hexAlpha(hex, alpha) {
  if (typeof hex !== 'string' || hex[0] !== '#') { return hex; }
  let h = hex.slice(1);
  if (h.length === 3) { h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; }
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) { return hex; }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
}

export function buildSurfaceStyles(options) {
  const opts = options || {};
  const surface = opts.surface;

  if (surface === 'glass') {
    return {
      root: {
        backgroundColor: hexAlpha(opts.paperColor, 0.72),
        backgroundImage: 'none',
        backdropFilter: 'blur(8px)',
        border: '1px solid ' + (opts.dividerColor || 'rgba(128,128,128,0.3)'),
        boxShadow: 'none',
        transition: SURFACE_TRANSITION
      }
    };
  }
  if (surface === 'flat') {
    return {
      root: {
        backgroundColor: 'transparent',
        backgroundImage: 'none',
        border: 'none',
        boxShadow: 'none',
        transition: SURFACE_TRANSITION
      }
    };
  }
  return { root: { transition: SURFACE_TRANSITION } };
}
```

- [ ] **Step 4: Run to verify PASS** (5 tests).

- [ ] **Step 5: Wire script + CI step** (`"test:surface-styles"` after `"test:ambiance-composition"`; CI step "Ambiance surface styles" after "Ambiance composition contract").

- [ ] **Step 6: Commit**
```bash
git add imports/ui/theme/surfaceStyles.js tests/unit/imports/ui/theme/surfaceStyles.test.mjs package.json .circleci/config.yml
git commit -m "feat(theme): shared surface styles — solid/glass/flat card recipes with animated transitions"
```

---

### Task 3: AmbianceZone guard + `useAmbiance()` context

**Files:**
- Create: `imports/ui/guards/AmbianceZone.jsx`
- Create: `imports/ui/theme/AmbianceContext.js`
- Modify: `imports/lib/SessionKeys.js` (+ `PAGE_SURFACE_OVERRIDES`), `imports/lib/sessionKeyGroups.js` (chrome group)

**Interfaces:**
- Consumes: `resolveComposition` (Task 1), `buildSurfaceStyles` (Task 2), `buildPageModeTheme`, `getBackgroundEntry`, `PAGE_MODE`/`CARD_SURFACE` SessionKeys, `useLocation`.
- Produces:
  - `AmbianceContext.js`: `export const AmbianceContext = React.createContext(null);` and `export function useAmbiance()` returning the composition object or `null` when outside a zone.
  - `AmbianceZone.jsx`: `<AmbianceZone ambiance={bool} fluid={bool}>{children}</AmbianceZone>` — the guard StyledMainRouter composes. Renders children unchanged when neither flag applies. Otherwise: assembles the composition, provides context, sets `--ambiance-focus`/`--ambiance-scrim` CSS vars on a full-height wrapper div, and wraps children in a ThemeProvider whose theme = `buildPageModeTheme(appTheme, composition.pageMode)` extended with MuiCard/MuiPaper `styleOverrides.root` from `buildSurfaceStyles` (only when surface ≠ solid).
  - New Session key: `PAGE_SURFACE_OVERRIDES = 'pageSurfaceOverrides'` (object map `{ [pathname]: 'solid'|'flat' }`, Task 8 writes it).

- [ ] **Step 1: Create AmbianceContext.js**

```javascript
// imports/ui/theme/AmbianceContext.js
//
// React context carrying the zone composition object (see
// ambianceComposition.js). Provided by AmbianceZone on enableAmbiance /
// enableFluidInterface routes; useAmbiance() returns null everywhere else,
// so shared components (StyledCard/StyledContainer) can fall back to
// Session/global reads outside a zone.

import React from 'react';

export const AmbianceContext = React.createContext(null);

export function useAmbiance() {
  return React.useContext(AmbianceContext);
}
```

- [ ] **Step 2: Add the Session key**

`imports/lib/SessionKeys.js`, next to `CARD_SURFACE` (and add to the default export + `sessionKeyGroups.js` chrome group `exact` list):
```javascript
export const PAGE_SURFACE_OVERRIDES = 'pageSurfaceOverrides'; // { [pathname]: 'solid'|'flat' } — Ctrl+Shift+K per-route card↔full-height
```

- [ ] **Step 3: Create AmbianceZone.jsx**

```jsx
// imports/ui/guards/AmbianceZone.jsx
//
// Router-level zone wrapper (composes like AuthGuard/PatientGuard — see
// App.jsx StyledMainRouter). On routes declaring enableAmbiance or
// enableFluidInterface it: (1) assembles the composition object from the
// active background's curation record + persisted axes, (2) provides it via
// AmbianceContext + --ambiance-* CSS vars, and (3) wraps children in a
// page-mode theme carrying MuiCard/MuiPaper overrides for the active card
// surface — so even raw MUI cards render legibly over ambiance
// (correctness by construction; discipline not required). With neither flag
// it renders children unchanged. Spec:
// docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md

import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme, createTheme } from '@mui/material/styles';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';

import { resolveComposition } from '../theme/ambianceComposition.js';
import { buildSurfaceStyles } from '../theme/surfaceStyles.js';
import { buildPageModeTheme } from '../theme/pageModeTheme.js';
import { getBackgroundEntry } from '../themeBackgrounds.js';
import { AmbianceContext } from '../theme/AmbianceContext.js';
import { PAGE_MODE, CARD_SURFACE, PAGE_SURFACE_OVERRIDES } from '/imports/lib/SessionKeys.js';

export function AmbianceZone(props) {
  const ambiance = !!props.ambiance;
  const fluid = !!props.fluid || ambiance;   // enableAmbiance implies fluid
  const appTheme = useTheme();
  const location = useLocation();

  // Reactive axes (Session); background is a PLAIN read — the provider
  // rebuild re-renders us (never useTracker a bare settings read).
  const pageMode = useTracker(function() { return Session.get(PAGE_MODE); }, []);
  const cardSurface = useTracker(function() { return Session.get(CARD_SURFACE); }, []);
  const surfaceOverride = useTracker(function() {
    const overrides = Session.get(PAGE_SURFACE_OVERRIDES) || {};
    return overrides[location.pathname];
  }, [location.pathname]);

  const activeBg = get(Meteor, 'settings.public.theme.backgroundImagePath', '');

  const composition = resolveComposition({
    background: ambiance ? activeBg : '',   // fluid-only routes paint their own backdrop
    entry: ambiance ? getBackgroundEntry(activeBg) : null,
    pageMode: pageMode,
    cardSurface: cardSurface,
    surfaceOverride: surfaceOverride
  });

  const zoneTheme = useMemo(function() {
    const base = buildPageModeTheme(appTheme, composition.pageMode) || appTheme;
    if (composition.cardSurface === 'solid') { return base; }
    const surface = buildSurfaceStyles({
      surface: composition.cardSurface,
      paperColor: get(base, 'palette.background.paper', '#ffffff'),
      dividerColor: get(base, 'palette.divider', 'rgba(128,128,128,0.3)')
    });
    return createTheme(base, {
      components: {
        MuiCard: { styleOverrides: { root: surface.root } },
        MuiPaper: { styleOverrides: { root: surface.root } }
      }
    });
  }, [appTheme, composition.pageMode, composition.cardSurface]);

  // Early return AFTER all hooks (React hooks-order rule); fluid is a
  // static route capability, but keep the hook order unconditional anyway.
  if (!fluid) { return props.children; }

  return (
    <AmbianceContext.Provider value={composition}>
      <ThemeProvider theme={zoneTheme}>
        <div style={{
          height: '100%',
          '--ambiance-focus': composition.focus,
          '--ambiance-scrim': String(composition.scrimStrength)
        }}>
          {props.children}
        </div>
      </ThemeProvider>
    </AmbianceContext.Provider>
  );
}

export default AmbianceZone;
```

⚠️ React hooks note for the implementer: the `if (!fluid) return children` sits AFTER every hook call (including the `useMemo`) — keep it that way (hooks must run unconditionally).

- [ ] **Step 4: Verify** — `npx esbuild imports/ui/guards/AmbianceZone.jsx --loader=jsx > /dev/null && echo JSX-OK`; `node --experimental-detect-module --check imports/ui/theme/AmbianceContext.js`.

- [ ] **Step 5: Commit**
```bash
git add imports/ui/guards/AmbianceZone.jsx imports/ui/theme/AmbianceContext.js imports/lib/SessionKeys.js imports/lib/sessionKeyGroups.js
git commit -m "feat(theme): AmbianceZone guard + useAmbiance composition context"
```

---

### Task 4: StyledMainRouter — per-route painting + zone composition

**Files:**
- Modify: `imports/ui/App.jsx` (StyledMainRouter, ~lines 1824-1948)

**Interfaces:**
- Consumes: `AmbianceZone` (Task 3), existing `isColorBackground/colorFromBackground` imports, `matchPath`/`useLocation` from react-router-dom (check existing imports — App.jsx already imports from react-router-dom; extend that import if needed).
- Produces: ambiance backgrounds paint ONLY when the active route declares `enableAmbiance`; `AmbianceZone` composes into the guard chain (inside PatientGuard, outside ErrorBoundary): `AuthGuard > PatientGuard > AmbianceZone > ErrorBoundary > page`.

- [ ] **Step 1: Gate the painter on the active route**

In `StyledMainRouter`, after `allRoutes` is computed and before `mainAppStyle`, resolve the active route (add `useLocation`/`matchPath` to the react-router-dom import at the top of App.jsx if absent):

```javascript
  // Active-route capability lookup: ambiance paints ONLY on routes that
  // declare enableAmbiance (the constraint that makes ambiance safe — spec
  // docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md).
  // This also ends the historical leak where every route showed the photo
  // through canvas gaps.
  const routerLocation = useLocation();
  const activeRoute = allRoutes.find(function(r) {
    return r.path && matchPath({ path: r.path, end: true }, routerLocation.pathname);
  }) || null;
  const activeAllowsAmbiance = !!get(activeRoute, 'enableAmbiance');
```

Then wrap the existing ambiance block:

```javascript
  const ambianceBackground = get(Meteor, 'settings.public.theme.backgroundImagePath', '');
  if (ambianceBackground && activeAllowsAmbiance) {
    // ... existing isColorBackground branch, unchanged ...
  }
```

- [ ] **Step 2: Compose the zone into the guard chain**

Add the import near the other guard imports: `import AmbianceZone from './guards/AmbianceZone.jsx';`
In the route-mapping block (the "Guards compose from the inside out" section, ~line 1929), after the ErrorBoundary wrap and BEFORE the `requirePatient` wrap:

```javascript
        if (route.enableAmbiance || route.enableFluidInterface) {
          element = (
            <AmbianceZone ambiance={!!route.enableAmbiance} fluid={!!route.enableFluidInterface}>
              {element}
            </AmbianceZone>
          );
        }
```

(Update the composition comment above it to read `requireAuth > requirePatient > AmbianceZone > ErrorBoundary > page`.)

- [ ] **Step 3: Verify** — `npx esbuild imports/ui/App.jsx --loader=jsx > /dev/null && echo JSX-OK` (App.jsx is large; esbuild transform is the syntax gate).

- [ ] **Step 4: Commit**
```bash
git add imports/ui/App.jsx
git commit -m "feat(theme): route-gated ambiance painting + AmbianceZone in the guard chain"
```

---

### Task 5: `Meteor.StyledCard` + `Meteor.StyledContainer`

**Files:**
- Create: `imports/ui/components/StyledCard.jsx`
- Create: `imports/ui/components/StyledContainer.jsx`
- Modify: `imports/ui/CustomThemeProvider.jsx` (attach both to Meteor next to `Meteor.useTheme = useTheme;` at line 18)

**Interfaces:**
- Consumes: `useAmbiance` (Task 3), `buildSurfaceStyles`/`SURFACE_TRANSITION` (Task 2), `CARD_SURFACE` SessionKey.
- Produces: `Meteor.StyledCard` (surface-aware Card: props `surface` override, else zone composition, else Session, else solid) and `Meteor.StyledContainer` (focus-aware column: props `focus` override, else zone focus; maxWidth default `'lg'`; xl 200px easement; optional `scrim` bool painting the zone scrim behind its content). Consumers use the `Meteor.StyledCard || Card` degradation idiom.

- [ ] **Step 1: Create StyledCard.jsx**

```jsx
// imports/ui/components/StyledCard.jsx
//
// Surface-aware Card, Meteor-object-distributed (Meteor.StyledCard) like
// Meteor.useTheme — workflow packages consume it without import-path
// coupling: `const Card = Meteor.StyledCard || MuiCard;`. Resolves its
// surface from (in order) the `surface` prop, the ambiance zone
// composition, the global Session axis, then 'solid'. Transitions between
// states are animated (glass fades, flat melts into negative space). Spec:
// docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md

import React from 'react';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';

import { useAmbiance } from '../theme/AmbianceContext.js';
import { buildSurfaceStyles } from '../theme/surfaceStyles.js';
import { CARD_SURFACE } from '/imports/lib/SessionKeys.js';

export function StyledCard(props) {
  const { surface, sx, children, ...rest } = props;
  const theme = useTheme();
  const composition = useAmbiance();
  const sessionSurface = useTracker(function() { return Session.get(CARD_SURFACE); }, []);

  const active = surface || get(composition, 'cardSurface') || sessionSurface || 'solid';
  const styles = buildSurfaceStyles({
    surface: active,
    paperColor: get(theme, 'palette.background.paper', '#ffffff'),
    dividerColor: get(theme, 'palette.divider', 'rgba(128,128,128,0.3)')
  });

  return (
    <Card {...rest} sx={Object.assign({}, styles.root, sx)}>
      {children}
    </Card>
  );
}

export default StyledCard;
```

- [ ] **Step 2: Create StyledContainer.jsx**

```jsx
// imports/ui/components/StyledContainer.jsx
//
// Focus-aware content column, Meteor-object-distributed
// (Meteor.StyledContainer). Places its column into the ambiance image's
// neutral space (left | center | right — from the zone composition, or the
// `focus` prop), with the wide-viewport 200px easement at the xl
// breakpoint and an optional scrim backdrop. Pages using vanilla
// <Container> swap one import and inherit placement:
//   const Wrap = Meteor.StyledContainer || Container;
// Spec: docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md

import React from 'react';
import Box from '@mui/material/Box';
import { useTheme, alpha } from '@mui/material/styles';
import { get } from 'lodash';

import { useAmbiance } from '../theme/AmbianceContext.js';

const WIDTHS = { xs: '444px', sm: '600px', md: '900px', lg: '1200px', xl: '1536px' };

export function StyledContainer(props) {
  const { focus, scrim, maxWidth, sx, children, ...rest } = props;
  const theme = useTheme();
  const composition = useAmbiance();

  const activeFocus = focus || get(composition, 'focus') || 'center';
  const align = activeFocus === 'left' ? { ml: 0, mr: 'auto' }
    : activeFocus === 'right' ? { ml: 'auto', mr: 0 }
    : { mx: 'auto' };

  const scrimStrength = get(composition, 'scrimStrength', 0.55);
  const showScrim = !!scrim && !!get(composition, 'background');

  return (
    <Box {...rest} sx={Object.assign({
      width: '100%',
      maxWidth: WIDTHS[maxWidth || 'lg'] || WIDTHS.lg,
      px: { xs: 2, md: 3, xl: '200px' },
      boxSizing: 'content-box'
    }, align, showScrim ? {
      background: alpha(theme.palette.background.default, scrimStrength),
      backdropFilter: 'blur(2px)',
      borderRadius: '4px'
    } : {}, sx)}>
      {children}
    </Box>
  );
}

export default StyledContainer;
```

- [ ] **Step 3: Attach to the Meteor object**

`imports/ui/CustomThemeProvider.jsx`, next to `Meteor.useTheme = useTheme;` (line 18), with imports at top:
```javascript
import StyledCard from './components/StyledCard.jsx';
import StyledContainer from './components/StyledContainer.jsx';
// ...
Meteor.StyledCard = StyledCard;           // surface-aware Card (solid|glass|flat)
Meteor.StyledContainer = StyledContainer; // focus-aware content column
```

- [ ] **Step 4: Verify** — esbuild JSX transform on all three touched files.

- [ ] **Step 5: Commit**
```bash
git add imports/ui/components/StyledCard.jsx imports/ui/components/StyledContainer.jsx imports/ui/CustomThemeProvider.jsx
git commit -m "feat(theme): Meteor.StyledCard + Meteor.StyledContainer surface/focus consumers"
```

---

### Task 6: Flag the tracked-repo zone routes + Patient Chart placement

**Files:**
- Modify: `imports/ui/App.jsx` (`/patient-chart` route literal, ~line 702)
- Modify: `npmPackages/provider-directory/client.js` (route literal, ~line 68)
- Modify: `imports/patient/AutoDashboard.jsx` (root Container, line ~981)

**Interfaces:**
- Consumes: route flags (Task 4 reads them), `Meteor.StyledContainer` (Task 5).
- Produces: `/patient-chart` and `/provider-directory` are live `enableAmbiance` routes; the patient chart column lands in the image's neutral space.

- [ ] **Step 1: Flag the routes**

`imports/ui/App.jsx` (~702):
```javascript
  }, {
    path: "/patient-chart",
    element: <PatientChart />,
    enableAmbiance: true
  }, {
```
`npmPackages/provider-directory/client.js` (~68):
```javascript
let DynamicRoutes = [{
  name: 'ProviderDirectory',
  path: '/provider-directory',
  element: <DirectoryConsole />,
  requireAuth: true,
  enableAmbiance: true
}, {
```

- [ ] **Step 2: Patient Chart placement via StyledContainer**

`imports/patient/AutoDashboard.jsx` line ~981 — swap the root Container with the degradation idiom (add NO new imports; Meteor is already imported in the file — verify, and if not, add `import { Meteor } from 'meteor/meteor';`):

```javascript
            const AmbientColumn = Meteor.StyledContainer || Container;
```
```jsx
            <AmbientColumn maxWidth="lg" sx={{ mt: 4, mb: 10, pb: '100px' }}>
```
(and the matching closing tag at ~line 1579 → `</AmbientColumn>`). Place the `const AmbientColumn` line immediately above the `return` that renders it, inside the component body.

- [ ] **Step 3: Verify** — esbuild JSX transform on all three files.

- [ ] **Step 4: Commit**
```bash
git add imports/ui/App.jsx npmPackages/provider-directory/client.js imports/patient/AutoDashboard.jsx
git commit -m "feat(theme): enableAmbiance on /patient-chart + /provider-directory; chart column lands in neutral space"
```

---

### Task 7: Timelines extension — flag `/timeline-vertical` (NESTED REPO)

**Files:**
- Modify: `extensions/timelines/client.js` (route literal at ~line 54)

**Interfaces:** Produces the third zone route. **This file is in a separate git repo** — commit there, not in the monorepo.

- [ ] **Step 1:** Add `enableAmbiance: true` to the `/timeline-vertical` route object literal in `extensions/timelines/client.js` (same shape as the provider-directory edit; read the surrounding object and match its quoting style — this file uses quoted keys like `'path'`).
- [ ] **Step 2:** Verify with esbuild JSX transform (the file may be .js with JSX — use `--loader=jsx`).
- [ ] **Step 3: Commit IN THE EXTENSION REPO** (never `git add` this path in the monorepo):
```bash
git -C extensions/timelines add client.js
git -C extensions/timelines commit -m "feat(theme): enableAmbiance on /timeline-vertical (honeycomb ambiance zone phase 3)"
```

---

### Task 8: Hotkey graduations — Ctrl+Shift+L cycle + Ctrl+Shift+K per-route toggle

**Files:**
- Modify: `imports/ui/themePresets.js` (new `cycleCardSurface()` + `togglePageSurfaceOverride(pathname)` + boot restore for overrides)
- Modify: `imports/startup/client/hotkeys.js` (L handler replaced; K handler added)
- Modify: `imports/ui/extensible/NotFoundPage.jsx` (migrate off the CustomEvent)
- Modify: `extensions/life-support-systems/client/LifeSupportDashboard.jsx` (migrate off the CustomEvent — NESTED REPO commit)
- Modify: `imports/lib/themePersistence.js` (doc comment: add `pageSurfaceOverrides`)

**Interfaces:**
- Consumes: `CARD_SURFACE`/`PAGE_SURFACE_OVERRIDES` SessionKeys, existing `setCardSurface`.
- Produces: `cycleCardSurface()` → advances solid→glass→flat→solid via `setCardSurface`; `togglePageSurfaceOverride(pathname)` → flips `{ [pathname]: 'flat' }` ↔ absent in the Session map + persists via `saveThemeChoice({ pageSurfaceOverrides })`; boot restore validates the map (object; values `'solid'|'flat'`; junk dropped).

- [ ] **Step 1: themePresets.js additions** (below `setCardSurface`)

```javascript
// Live control: advance the card surface one step (Ctrl+Shift+L).
export function cycleCardSurface() {
  const current = Session.get(CARD_SURFACE) || 'solid';
  const order = ['solid', 'glass', 'flat'];
  const next = order[(order.indexOf(current) + 1) % order.length];
  setCardSurface(next);
}

// Live control: per-route card <-> full-height override (Ctrl+Shift+K).
// Toggles the active pathname between 'flat' (one-page/full-height) and no
// override (global cardSurface stands). Spec: onePageLayout revival.
export function togglePageSurfaceOverride(pathname) {
  if (!pathname) { return; }
  const overrides = Object.assign({}, Session.get(PAGE_SURFACE_OVERRIDES) || {});
  if (overrides[pathname]) {
    delete overrides[pathname];
  } else {
    overrides[pathname] = 'flat';
  }
  Session.set(PAGE_SURFACE_OVERRIDES, overrides);
  saveThemeChoice({ pageSurfaceOverrides: overrides });
  pokeRefresh();
}
```
Import `PAGE_SURFACE_OVERRIDES` alongside the existing SessionKeys import. In `applyThemeChoiceAtBoot()`, after the cardSurface restore:
```javascript
  // Per-route surface overrides — keep only well-formed entries.
  const rawOverrides = choice.pageSurfaceOverrides;
  if (rawOverrides && typeof rawOverrides === 'object' && !Array.isArray(rawOverrides)) {
    const clean = {};
    Object.keys(rawOverrides).forEach(function(path) {
      if (rawOverrides[path] === 'flat' || rawOverrides[path] === 'solid') { clean[path] = rawOverrides[path]; }
    });
    if (Object.keys(clean).length) { Session.set(PAGE_SURFACE_OVERRIDES, clean); }
  }
```
`themePersistence.js` shape comment gains `pageSurfaceOverrides: { <pathname>: 'solid'|'flat' }`.

- [ ] **Step 2: hotkeys.js**

Replace the Ctrl+Shift+L body (keep the comment style):
```javascript
    // Cmd/Ctrl + Shift + L — Cycle card surface (solid → glass → flat)
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'L' || event.key === 'l')) {
      event.preventDefault();
      import('/imports/ui/themePresets.js').then(function(tp) { tp.cycleCardSurface(); });
    }

    // Cmd/Ctrl + Shift + K — Toggle this route between card and full-height (flat) layout
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'K' || event.key === 'k')) {
      event.preventDefault();
      import('/imports/ui/themePresets.js').then(function(tp) { tp.togglePageSurfaceOverride(window.location.pathname); });
    }
```
(Dynamic import keeps hotkeys.js free of a static UI-module dependency at startup, matching its current zero-import-besides-Session posture.)

- [ ] **Step 3: Migrate the two CustomEvent listeners**

`imports/ui/extensible/NotFoundPage.jsx`: replace the `useState(false)` + `toggleFlatCards` listener pair with a Session read (imports: `Session` from meteor/session, `useTracker` from meteor/react-meteor-data, `CARD_SURFACE` from SessionKeys):
```javascript
  const flatCardMode = useTracker(function() { return Session.get(CARD_SURFACE) === 'flat'; }, []);
```
Delete the `handleToggleFlatCards`/addEventListener/removeEventListener block. All downstream `flatCardMode` conditionals stay untouched.

`extensions/life-support-systems/client/LifeSupportDashboard.jsx` (~lines 132, 193-194, and the `flatCardMode` state): same substitution. **Commit in the extension repo:**
```bash
git -C extensions/life-support-systems add client/LifeSupportDashboard.jsx
git -C extensions/life-support-systems commit -m "refactor(cards): read the persisted cardSurface axis instead of the toggleFlatCards event"
```

- [ ] **Step 4: Verify** — esbuild transforms + `node --experimental-detect-module --check imports/ui/themePresets.js` is not possible (imports Meteor) → careful re-read + esbuild; run `npm run test:background-value && npm run test:ambiance-analysis && npm run test:ambiance-composition && npm run test:surface-styles` (regression: all green).

- [ ] **Step 5: Commit (monorepo part)**
```bash
git add imports/ui/themePresets.js imports/startup/client/hotkeys.js imports/ui/extensible/NotFoundPage.jsx imports/lib/themePersistence.js
git commit -m "feat(theme): Ctrl+Shift+L surface cycle + Ctrl+Shift+K per-route flat toggle; retire toggleFlatCards event"
```

---

### Task 9: Ambiance Tuning HUD (Cmd/Ctrl+Shift+E)

**Files:**
- Create: `imports/ui/theme/AmbianceTuningHud.jsx`
- Modify: `imports/lib/SessionKeys.js` (+ `AMBIANCE_HUD_OPEN = 'ambianceHudOpen'`; add to sessionKeyGroups chrome group)
- Modify: `imports/startup/client/hotkeys.js` (E handler)
- Modify: `imports/ui/App.jsx` (render `<AmbianceTuningHud />` next to `<ThemeDialog />`, ~line 1801)

**Interfaces:**
- Consumes: `useAmbiance` is NOT available here (HUD renders at app root, outside zones) — it reads the same inputs the zone does: active background (plain read), `getBackgroundEntry`, Session axes; `setPageMode`/`setCardSurface`/`setAccentHue` for live controls.
- Produces: a dev overlay (MUI Dialog, `hideBackdrop`, positioned bottom-right, non-modal so the page stays interactive) with: scrim-strength slider, focus select, page-mode select, card-surface select, accent-hue text field — each applying live (focus/scrim apply via a Session-held draft the HUD copies from; they affect the copied JSON, and scrim/focus also preview live ONLY on pages reading the curation record fresh — note this honestly in the HUD's caption) — and a **Copy as JSON** button emitting the curation record for the background library. Clipboard out only; no persistence of its own.

- [ ] **Step 1: Create the HUD**

```jsx
// imports/ui/theme/AmbianceTuningHud.jsx
//
// Dev-tool overlay (Cmd/Ctrl+Shift+E) for authoring ambiance curation
// records against the live page: tune focus / scrim / ink / surface /
// accent, then Copy as JSON to paste into themeBackgrounds.js or
// settings.public.theme.backgroundLibrary. Session Inspector posture: no
// PHI, no persistence of its own (clipboard out only), hidden behind the
// hotkey. Spec: docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md

import React from 'react';
import {
  Paper, Typography, Slider, Select, MenuItem, TextField, Button, Stack, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';

import { getBackgroundEntry } from '../themeBackgrounds.js';
import { setPageMode, setCardSurface, setAccentHue } from '../themePresets.js';
import { AMBIANCE_HUD_OPEN, PAGE_MODE, CARD_SURFACE } from '/imports/lib/SessionKeys.js';

export function AmbianceTuningHud() {
  const open = useTracker(function() { return !!Session.get(AMBIANCE_HUD_OPEN); }, []);
  const pageMode = useTracker(function() { return Session.get(PAGE_MODE) || ''; }, []);
  const cardSurface = useTracker(function() { return Session.get(CARD_SURFACE) || 'solid'; }, []);

  const activeBg = get(Meteor, 'settings.public.theme.backgroundImagePath', '');
  const entry = getBackgroundEntry(activeBg);

  const [focus, setFocus] = React.useState(get(entry, 'focus', 'center'));
  const [scrim, setScrim] = React.useState(get(entry, 'scrimStrength', 0.55));
  const [accent, setAccent] = React.useState(get(Meteor, 'settings.public.theme.palette.primaryColor', ''));
  const [copied, setCopied] = React.useState(false);

  // Re-seed the draft when the background changes while open.
  React.useEffect(function() {
    setFocus(get(entry, 'focus', 'center'));
    setScrim(get(entry, 'scrimStrength', 0.55));
    setCopied(false);
  }, [activeBg]);

  if (!open) { return null; }

  function curationRecord() {
    return {
      name: get(entry, 'name', '(unnamed)'),
      src: activeBg,
      focus: focus,
      recommendedPageMode: pageMode || get(entry, 'recommendedPageMode', undefined),
      scrimStrength: Math.round(scrim * 100) / 100
    };
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(curationRecord(), null, 2));
      setCopied(true);
    } catch (error) {
      setCopied(false);
    }
  }

  return (
    <Paper elevation={8} sx={{
      position: 'fixed', right: 16, bottom: 80, width: 300, p: 2, zIndex: 1400,
      bgcolor: 'background.paper'
    }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="overline">Ambiance tuning</Typography>
        <IconButton size="small" id="ambianceHudClose" onClick={function() { Session.set(AMBIANCE_HUD_OPEN, false); }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {activeBg ? (get(entry, 'name') || activeBg) : 'No ambiance background active'}
      </Typography>

      <Typography variant="caption">Scrim strength — {Math.round(scrim * 100)}%</Typography>
      <Slider id="ambianceHudScrim" size="small" min={0} max={1} step={0.05} value={scrim}
        onChange={function(e, v) { setScrim(v); }} sx={{ mb: 1 }} />

      <Stack spacing={1} sx={{ mb: 1 }}>
        <Select id="ambianceHudFocus" size="small" value={focus}
          onChange={function(e) { setFocus(e.target.value); }}>
          <MenuItem value="left">Focus: left</MenuItem>
          <MenuItem value="center">Focus: center</MenuItem>
          <MenuItem value="right">Focus: right</MenuItem>
        </Select>
        <Select id="ambianceHudPageMode" size="small" value={pageMode} displayEmpty
          onChange={function(e) { setPageMode(e.target.value || null); }}>
          <MenuItem value="">Ink: auto</MenuItem>
          <MenuItem value="light">Ink: light</MenuItem>
          <MenuItem value="dark">Ink: dark</MenuItem>
        </Select>
        <Select id="ambianceHudSurface" size="small" value={cardSurface}
          onChange={function(e) { setCardSurface(e.target.value); }}>
          <MenuItem value="solid">Surface: solid</MenuItem>
          <MenuItem value="glass">Surface: glass</MenuItem>
          <MenuItem value="flat">Surface: flat</MenuItem>
        </Select>
        <TextField id="ambianceHudAccent" size="small" label="Accent hex" value={accent}
          onChange={function(e) { setAccent(e.target.value); }}
          onBlur={function() { if (/^#[0-9a-fA-F]{6}$/.test(accent)) { setAccentHue(accent); } }} />
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Ink/surface/accent apply live. Focus + scrim land in the copied
        record — paste into the background library to take effect.
      </Typography>
      <Button id="ambianceHudCopy" fullWidth size="small" variant="contained"
        startIcon={<ContentCopyIcon />} onClick={handleCopy} disabled={!activeBg}>
        {copied ? 'Copied' : 'Copy as JSON'}
      </Button>
    </Paper>
  );
}

export default AmbianceTuningHud;
```

- [ ] **Step 2: Session key + hotkey + mount**

SessionKeys: `export const AMBIANCE_HUD_OPEN = 'ambianceHudOpen'; // Cmd/Ctrl+Shift+E ambiance curation HUD` (+ default export + sessionKeyGroups chrome). hotkeys.js (E is unclaimed — verify by reading the file first):
```javascript
    // Cmd/Ctrl + Shift + E — Toggle Ambiance Tuning HUD (curation dev tool)
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'E' || event.key === 'e')) {
      event.preventDefault();
      Session.set('ambianceHudOpen', !Session.get('ambianceHudOpen'));
    }
```
App.jsx ~1801: `<AmbianceTuningHud />` rendered adjacent to `<ThemeDialog />`, import at top with the other ui/theme imports. Add Escape-close: extend the existing Escape handler in hotkeys.js with `Session.set('ambianceHudOpen', false);`.

- [ ] **Step 3: Verify** — esbuild transforms on the HUD + App.jsx; re-read hotkeys.js diff.

- [ ] **Step 4: Commit**
```bash
git add imports/ui/theme/AmbianceTuningHud.jsx imports/lib/SessionKeys.js imports/lib/sessionKeyGroups.js imports/startup/client/hotkeys.js imports/ui/App.jsx
git commit -m "feat(theme): Ambiance Tuning HUD (Cmd/Ctrl+Shift+E) — live curation authoring with Copy-as-JSON"
```

---

### Task 10: Card Surface mini-preview in ThemeControls

**Files:**
- Modify: `imports/ui/theme/ThemeControls.jsx` (the Card Surface block)

**Interfaces:** Consumes `buildSurfaceStyles` (Task 2). Produces the spec'd "live mini-preview" beside the toggle group.

- [ ] **Step 1:** Under the existing `ToggleButtonGroup` (id `themeCardSurfaceGroup`), add a preview row — three 72×44 chips labeled by state, each styled by `buildSurfaceStyles` against the current theme, the active one ring-highlighted:

```jsx
            <Box id="themeCardSurfacePreview" sx={{ display: 'flex', gap: 1, mt: 1 }}>
              {['solid', 'glass', 'flat'].map(function(s) {
                const preview = buildSurfaceStyles({
                  surface: s,
                  paperColor: muiTheme.palette.background.paper,
                  dividerColor: muiTheme.palette.divider
                });
                return (
                  <Box key={s} sx={Object.assign({
                    width: 72, height: 44, borderRadius: '6px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 10,
                    color: 'text.secondary', bgcolor: 'background.paper',
                    border: '1px solid', borderColor: 'divider',
                    outline: cardSurface === s ? '2px solid' : 'none',
                    outlineColor: 'primary.main'
                  }, preview.root)}>
                    {s}
                  </Box>
                );
              })}
            </Box>
```
Imports to add: `buildSurfaceStyles` from `./surfaceStyles.js`; `const muiTheme = useMuiTheme();` via `import { useTheme as useMuiTheme } from '@mui/material/styles';` (the file's `useTheme` name is taken by the app-mode context import — keep both).

- [ ] **Step 2: Verify** — esbuild transform.
- [ ] **Step 3: Commit**
```bash
git add imports/ui/theme/ThemeControls.jsx
git commit -m "feat(theme): card-surface mini-preview chips in Theme & Palette"
```

---

### Task 11: Print hardening

**Files:**
- Modify: `client/main.css` (the `@media print` block at ~line 129)
- Modify: `npmPackages/provider-directory/client/DirectoryConsole.jsx` (scrim `@media print` off-switch)

**Interfaces:** Closes the final-review deferred finding: ambiance images/solids and the console scrim must not reach paper.

- [ ] **Step 1:** In `client/main.css`'s `@media print` block, add alongside the existing white-forcing rules:
```css
  /* Ambiance never prints: photo/solid canvas and zone scrims stay screen-only */
  #mainAppRouter {
    background-image: none !important;
    background-color: #ffffff !important;
  }
```
- [ ] **Step 2:** In DirectoryConsole's scrim'd column `sx` (the `activeBg ? linear-gradient(...) : 'transparent'` block), add:
```javascript
          '@media print': { background: 'transparent', backdropFilter: 'none' },
```
- [ ] **Step 3: Verify** — esbuild transform on DirectoryConsole; visual CSS re-read.
- [ ] **Step 4: Commit**
```bash
git add client/main.css npmPackages/provider-directory/client/DirectoryConsole.jsx
git commit -m "fix(theme): ambiance backgrounds and scrims never reach print"
```

---

### Task 12: Verification sweep, docs, final review

**Files:** spec status line; ledger; no code unless findings.

- [ ] **Step 1:** Full unit sweep: `npm run test:background-value && npm run test:ambiance-analysis && npm run test:ambiance-composition && npm run test:surface-styles && npm run test:session-key-groups` — all green.
- [ ] **Step 2:** Controller live checks IF the user's app is up (read-only browsing; NEVER touch processes): `/patient-chart` with Zen Rocks → column right + glass/flat toggles visible on cards (the Phase 3 acceptance criterion); `/provider-directory` unchanged behavior; an unflagged route (e.g. `/fhir-graph`) shows NO ambiance photo anymore (the leak is closed — this is an intentional, spec'd behavior change worth flagging to the user); Ctrl+Shift+L cycles surfaces; HUD opens on Ctrl+Shift+E. If the app is down: record a morning checklist in the ledger instead.
- [ ] **Step 3:** Update the spec Status line to `Phases 1-3 implemented; Phase 3.5/4 pending`, commit as `docs(specs): mark ambiance phase 3 implemented`.
- [ ] **Step 4:** Final whole-branch review (most capable model) over the Phase 3 range; fix batch if findings; ledger everything.
