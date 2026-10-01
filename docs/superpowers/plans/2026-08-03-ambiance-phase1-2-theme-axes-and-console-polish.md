# Ambiance Phases 1+2: Theme Axes, Curation Records & Console Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Phases 1+2 of the Ambiance Experience Zone spec (`docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md`): solid-color + curated backgrounds, `pageMode`/`cardSurface` persistence axes, the restructured Theme & Palette dialog, the ambiance analysis module, and the DirectoryConsole legibility/padding polish.

**Architecture:** Pure helper modules (`backgroundValue.js`, `ambianceAnalysis.js`) carry the testable logic; `themePresets.js`/`themePersistence.js` gain two persisted axes surfaced through a reordered `ThemeControls`; `StyledMainRouter` learns to paint `color:`-prefixed backgrounds; DirectoryConsole consumes the persisted `pageMode` and gets its scrim/padding pass. No route flags yet — that is Phase 3.

**Tech Stack:** Meteor v3 + React 18 + MUI v5, `node --test` unit tests (ESM subjects via `--experimental-detect-module`), Nightwatch E2E.

## Global Constraints

- Coding style (root `CLAUDE.md`): `function() {}` over arrow functions where `this`/readability matters; lodash `get()` for defensive reads; first line of every new file is its commented path; no `index.js` files.
- File naming (`.claude/rules/conventions/file-naming.md`): camelCase for function-export modules (`backgroundValue.js`, `ambianceAnalysis.js`, `pageModeTheme.js`).
- Theming (`.claude/rules/ui/theming.md`): no unconditional hardcoded surface colors in components; the modules built here ARE the theme system and may define color constants (earth tones) as data.
- Unit tests live in `tests/unit/` mirroring source (`.claude/rules/testing/test-organization.md`); ESM subjects need `node --experimental-detect-module --test` (precedent: `test:session-key-groups`).
- New unit-test npm scripts get CI steps in the same job that runs `test:logger-redact` (`.circleci/config.yml` ~line 652 — the "ESM-subject unit tests" block; these subjects are dependency-free so the bare checkout is fine).
- Session keys that cross files use constants from `imports/lib/SessionKeys.js` (`.claude/rules/meteor/session-keys.md`).
- Earth-tone palette (from spec): clay `#a67b5b`, sand `#d9c7a7`, terracotta `#b0674b`, moss `#6b7d5a`, sage `#a3b18a`, stone `#8d8578`, ochre `#c49a3c`, espresso `#4a3728`.
- The working tree already carries uncommitted DirectoryConsole changes (`?align`, `?page-theme`, census filter, transparent root). Task 8 builds on and commits them — do NOT revert or stash them.
- `git add` specific paths only — never `git add -A` (concurrent-session safety).

---

### Task 1: `backgroundValue.js` — solid-color background helpers

**Files:**
- Create: `imports/ui/theme/backgroundValue.js`
- Test: `tests/unit/imports/ui/theme/backgroundValue.test.mjs`
- Modify: `package.json` (scripts block, after `"test:session-key-groups"`)
- Modify: `.circleci/config.yml` (add run step after the `test:logger-redact` step, ~line 668)

**Interfaces:**
- Consumes: nothing (pure module, zero imports)
- Produces: `COLOR_BACKGROUND_PREFIX` (string `'color:'`), `isColorBackground(value) → boolean`, `colorFromBackground(value) → string|null` (extracts `'#a67b5b'` from `'color:#a67b5b'`), `makeColorBackground(hex) → string` (`'#a67b5b'` → `'color:#a67b5b'`). Tasks 3, 4, 7 import these.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/unit/imports/ui/theme/backgroundValue.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COLOR_BACKGROUND_PREFIX, isColorBackground, colorFromBackground, makeColorBackground
} from '../../../../../imports/ui/theme/backgroundValue.js';

test('prefix constant is stable (persisted strings depend on it)', function() {
  assert.equal(COLOR_BACKGROUND_PREFIX, 'color:');
});

test('isColorBackground distinguishes color entries from image paths', function() {
  assert.equal(isColorBackground('color:#a67b5b'), true);
  assert.equal(isColorBackground('/backgrounds/ambiance/Zen.jpg'), false);
  assert.equal(isColorBackground(''), false);
  assert.equal(isColorBackground(null), false);
  assert.equal(isColorBackground(undefined), false);
});

test('colorFromBackground extracts the hex, null otherwise', function() {
  assert.equal(colorFromBackground('color:#a67b5b'), '#a67b5b');
  assert.equal(colorFromBackground('/backgrounds/ambiance/Zen.jpg'), null);
  assert.equal(colorFromBackground(null), null);
});

test('makeColorBackground round-trips with colorFromBackground', function() {
  const stored = makeColorBackground('#4a3728');
  assert.equal(stored, 'color:#4a3728');
  assert.equal(colorFromBackground(stored), '#4a3728');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-detect-module --test tests/unit/imports/ui/theme/backgroundValue.test.mjs`
Expected: FAIL — `Cannot find module` for `backgroundValue.js`

- [ ] **Step 3: Write the implementation**

```javascript
// imports/ui/theme/backgroundValue.js
//
// Pure helpers for the extended background axis: an ambiance background is
// either an image path ('/backgrounds/ambiance/Zen.jpg') or a solid color
// stored as a 'color:'-prefixed string ('color:#a67b5b') on the SAME
// persistence axis (themePersistence backgroundImagePath). Spec:
// docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md
// Zero imports — bare-checkout node --test safe.

export const COLOR_BACKGROUND_PREFIX = 'color:';

export function isColorBackground(value) {
  return typeof value === 'string' && value.indexOf(COLOR_BACKGROUND_PREFIX) === 0;
}

export function colorFromBackground(value) {
  if (!isColorBackground(value)) { return null; }
  return value.slice(COLOR_BACKGROUND_PREFIX.length);
}

export function makeColorBackground(hex) {
  return COLOR_BACKGROUND_PREFIX + hex;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-detect-module --test tests/unit/imports/ui/theme/backgroundValue.test.mjs`
Expected: PASS (4 tests)

- [ ] **Step 5: Register the script + CI step**

In `package.json` scripts, after `"test:session-key-groups"`:

```json
"test:background-value": "node --experimental-detect-module --test tests/unit/imports/ui/theme/backgroundValue.test.mjs",
```

In `.circleci/config.yml`, after the `test:logger-redact` run step (keep the surrounding "ESM-subject unit tests" comment block accurate):

```yaml
      - run:
          name: Ambiance background-value helpers
          command: npm run test:background-value
```

- [ ] **Step 6: Commit**

```bash
git add imports/ui/theme/backgroundValue.js tests/unit/imports/ui/theme/backgroundValue.test.mjs package.json .circleci/config.yml
git commit -m "feat(theme): color-prefixed solid backgrounds share the ambiance axis"
```

---

### Task 2: `ambianceAnalysis.js` — palette extraction + neutral-space analysis

**Files:**
- Create: `imports/ui/theme/ambianceAnalysis.js`
- Test: `tests/unit/imports/ui/theme/ambianceAnalysis.test.mjs`
- Modify: `package.json` + `.circleci/config.yml` (same pattern as Task 1)

**Interfaces:**
- Consumes: nothing (pure math + one browser-only wrapper)
- Produces:
  - `analyzeImageData({ data, width, height }) → { focus, recommendedPageMode, scrimStrength, palette }` — `data` is an RGBA byte array (`Uint8ClampedArray` or plain array), `focus ∈ 'left'|'center'|'right'`, `recommendedPageMode ∈ 'light'|'dark'`, `scrimStrength ∈ [0.35, 0.8]`, `palette` = up to 3 hex strings.
  - `analyzeAmbianceImage(src) → Promise<record>` — browser wrapper (Image + canvas downsample to ≤96px wide), NOT unit-tested (DOM), used at curation time and later by the Tuning HUD / adaptive scrim.
- Used by: curation of the default library (Task 3 seed values cite it), Phase 3 HUD, Phase 3.5 adaptive scrim.

- [ ] **Step 1: Write the failing test**

Synthetic-image helper + behavioral assertions (no image fixtures — deterministic arrays):

```javascript
// tests/unit/imports/ui/theme/ambianceAnalysis.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeImageData } from '../../../../../imports/ui/theme/ambianceAnalysis.js';

// Build a width×height RGBA array from a per-column color function.
function makeImage(width, height, colorAt) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = colorAt(x, y);
      const i = (y * width + x) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
    }
  }
  return { data, width, height };
}

test('bright image → light page mode; dark image → dark page mode', function() {
  const bright = analyzeImageData(makeImage(30, 12, function() { return [235, 230, 220]; }));
  assert.equal(bright.recommendedPageMode, 'light');
  const dark = analyzeImageData(makeImage(30, 12, function() { return [18, 20, 24]; }));
  assert.equal(dark.recommendedPageMode, 'dark');
});

test('focus lands on the lowest-variance (calmest) third', function() {
  // Left third: flat gray. Center+right thirds: harsh checkerboard.
  const img = makeImage(30, 12, function(x, y) {
    if (x < 10) { return [128, 128, 128]; }
    return ((x + y) % 2 === 0) ? [255, 255, 255] : [0, 0, 0];
  });
  assert.equal(analyzeImageData(img).focus, 'left');

  const imgRight = makeImage(30, 12, function(x, y) {
    if (x >= 20) { return [128, 128, 128]; }
    return ((x + y) % 2 === 0) ? [255, 255, 255] : [0, 0, 0];
  });
  assert.equal(analyzeImageData(imgRight).focus, 'right');
});

test('scrimStrength is clamped to [0.35, 0.8] and grows with busyness', function() {
  const calm = analyzeImageData(makeImage(30, 12, function() { return [128, 128, 128]; }));
  const busy = analyzeImageData(makeImage(30, 12, function(x, y) {
    return ((x + y) % 2 === 0) ? [255, 255, 255] : [0, 0, 0];
  }));
  assert.ok(calm.scrimStrength >= 0.35 && calm.scrimStrength <= 0.8);
  assert.ok(busy.scrimStrength >= 0.35 && busy.scrimStrength <= 0.8);
  assert.ok(busy.scrimStrength > calm.scrimStrength, 'busy image needs a stronger scrim');
});

test('palette returns up to 3 dominant hex colors', function() {
  // Two dominant colors: warm amber left half, deep blue right half.
  const img = makeImage(30, 12, function(x) {
    return x < 15 ? [232, 165, 75] : [20, 40, 90];
  });
  const palette = analyzeImageData(img).palette;
  assert.ok(Array.isArray(palette) && palette.length >= 2 && palette.length <= 3);
  palette.forEach(function(hex) { assert.match(hex, /^#[0-9a-f]{6}$/); });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-detect-module --test tests/unit/imports/ui/theme/ambianceAnalysis.test.mjs`
Expected: FAIL — `Cannot find module` for `ambianceAnalysis.js`

- [ ] **Step 3: Write the implementation**

```javascript
// imports/ui/theme/ambianceAnalysis.js
//
// Palette extraction + neutral-space analysis for ambiance backgrounds.
// analyzeImageData() is pure math over an RGBA byte array (unit-tested,
// dependency-free); analyzeAmbianceImage() is the browser wrapper that
// downsamples an <img> through a canvas and feeds it in. Outputs a draft
// curation record for the background library. Curated values in the library
// always win over these computed suggestions. Spec:
// docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md

// Rec. 709 relative luminance, 0..1.
function luminance(r, g, b) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

// Mean + variance of luminance for pixels whose x falls in [x0, x1).
function thirdStats(img, x0, x1) {
  const { data, width, height } = img;
  let sum = 0, sumSq = 0, n = 0;
  for (let y = 0; y < height; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
      const l = luminance(data[i], data[i + 1], data[i + 2]);
      sum += l; sumSq += l * l; n++;
    }
  }
  const mean = n ? sum / n : 0;
  return { mean: mean, variance: n ? (sumSq / n) - (mean * mean) : 0 };
}

function toHex(v) {
  const s = Math.round(v).toString(16);
  return s.length === 1 ? '0' + s : s;
}

// Dominant colors: quantize to 4 bits/channel, count buckets, return the top
// 3 distinct buckets as hex (bucket-center color).
function dominantColors(img) {
  const { data, width, height } = img;
  const counts = {};
  for (let p = 0; p < width * height; p++) {
    const i = p * 4;
    const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.keys(counts)
    .sort(function(a, b) { return counts[b] - counts[a]; })
    .slice(0, 3)
    .map(function(key) {
      const k = parseInt(key, 10);
      const r = ((k >> 8) & 0xf) * 16 + 8;
      const g = ((k >> 4) & 0xf) * 16 + 8;
      const b = (k & 0xf) * 16 + 8;
      return '#' + toHex(r) + toHex(g) + toHex(b);
    });
}

export function analyzeImageData(img) {
  const w = img.width;
  const t1 = Math.floor(w / 3);
  const t2 = Math.floor((2 * w) / 3);
  const thirds = [
    { focus: 'left', stats: thirdStats(img, 0, t1) },
    { focus: 'center', stats: thirdStats(img, t1, t2) },
    { focus: 'right', stats: thirdStats(img, t2, w) }
  ];

  // Neutral space = the calmest (lowest-variance) third.
  const calmest = thirds.reduce(function(best, cur) {
    return cur.stats.variance < best.stats.variance ? cur : best;
  });

  // Overall luminance decides which ink family survives the image.
  const overallMean = (thirds[0].stats.mean + thirds[1].stats.mean + thirds[2].stats.mean) / 3;

  // Scrim scales with the busyness of the third content will sit on.
  // Variance of luminance tops out at 0.25 (half-black/half-white).
  const scrim = Math.min(0.8, Math.max(0.35, 0.35 + (calmest.stats.variance / 0.25) * 0.45));

  return {
    focus: calmest.focus,
    recommendedPageMode: overallMean >= 0.5 ? 'light' : 'dark',
    scrimStrength: Math.round(scrim * 100) / 100,
    palette: dominantColors(img)
  };
}

// Browser wrapper: downsample via canvas (≤96px wide keeps this O(10k) pixels)
// and analyze. Resolves null on any failure — callers treat null as
// "no suggestions", never as an error.
export function analyzeAmbianceImage(src) {
  return new Promise(function(resolve) {
    if (typeof document === 'undefined') { resolve(null); return; }
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = function() {
      try {
        const scale = Math.min(1, 96 / image.naturalWidth);
        const w = Math.max(3, Math.round(image.naturalWidth * scale));
        const h = Math.max(3, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, w, h);
        resolve(analyzeImageData(ctx.getImageData(0, 0, w, h)));
      } catch (error) {
        resolve(null); // tainted canvas / decode failure — no suggestions
      }
    };
    image.onerror = function() { resolve(null); };
    image.src = src;
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-detect-module --test tests/unit/imports/ui/theme/ambianceAnalysis.test.mjs`
Expected: PASS (4 tests)

- [ ] **Step 5: Register script + CI step** (same pattern as Task 1)

`package.json`:

```json
"test:ambiance-analysis": "node --experimental-detect-module --test tests/unit/imports/ui/theme/ambianceAnalysis.test.mjs",
```

`.circleci/config.yml` (after the Task 1 step):

```yaml
      - run:
          name: Ambiance image analysis (focus/ink/scrim/palette)
          command: npm run test:ambiance-analysis
```

- [ ] **Step 6: Commit**

```bash
git add imports/ui/theme/ambianceAnalysis.js tests/unit/imports/ui/theme/ambianceAnalysis.test.mjs package.json .circleci/config.yml
git commit -m "feat(theme): ambiance analysis module — neutral-space focus, ink mode, scrim, palette"
```

---

### Task 3: Curation records + earth tones in the background library

**Files:**
- Modify: `imports/ui/themeBackgrounds.js`

**Interfaces:**
- Consumes: `makeColorBackground` from Task 1.
- Produces: `DEFAULT_BACKGROUND_LIBRARY` entries with optional `focus` / `recommendedPageMode` / `scrimStrength` fields; new export `EARTH_TONES` = `[{ name, value }]` where `value` is a `color:`-prefixed string. `getBackgroundLibrary()` unchanged (passes records through, including operator-supplied ones). Task 7 renders `EARTH_TONES`; Task 8 reads the active entry's `scrimStrength`/`focus`.

- [ ] **Step 1: Extend the library with curation records + earth tones**

Replace `DEFAULT_BACKGROUND_LIBRARY` and append `EARTH_TONES` (keep the file header and `getBackgroundLibrary` as-is; update the file's doc comment to mention curation records + the spec path):

```javascript
import { makeColorBackground } from './theme/backgroundValue.js';

// Default library (code fallback). Curated spa / zen / medical / gradient set.
// Entries are CURATION RECORDS: beyond name/src, optional focus (where the
// image's neutral space is: left|center|right), recommendedPageMode (which
// ink family survives it), and scrimStrength (0-1 content-column scrim).
// Seed values below were drafted with ambianceAnalysis.analyzeAmbianceImage()
// and eyeballed; refine with the Tuning HUD (Phase 3). Omitted fields fall
// back to: focus 'center', pageMode unset (app mode stands), scrim 0.55.
export const DEFAULT_BACKGROUND_LIBRARY = [
  { name: 'Zen Rocks',   src: BASE + '/Zen-Rocks.jpg',          focus: 'right',  recommendedPageMode: 'light', scrimStrength: 0.5 },
  { name: 'Zen Garden',  src: BASE + '/Zen.jpg',                focus: 'center', recommendedPageMode: 'light', scrimStrength: 0.5 },
  { name: 'Large Zen',   src: BASE + '/LargeZenRocks.jpg',      focus: 'right',  recommendedPageMode: 'light', scrimStrength: 0.55 },
  { name: 'Bamboo',      src: BASE + '/BambooIllustration.jpg', focus: 'left',   recommendedPageMode: 'light', scrimStrength: 0.45 },
  { name: 'Yoga Ocean',  src: BASE + '/Yoga-Ocean.jpg',         focus: 'left',   recommendedPageMode: 'dark',  scrimStrength: 0.6 },
  { name: 'Spa Candles', src: BASE + '/Candles.jpg',            focus: 'center', recommendedPageMode: 'dark',  scrimStrength: 0.55 },
  { name: 'Spa Beds',    src: BASE + '/SpaBeds.jpg',            focus: 'center', recommendedPageMode: 'light', scrimStrength: 0.55 },
  { name: 'Bath Petals', src: BASE + '/BathPetals.jpg',         focus: 'center', recommendedPageMode: 'light', scrimStrength: 0.55 },
  { name: 'Massage',     src: BASE + '/Massage.jpg',            focus: 'center', recommendedPageMode: 'dark',  scrimStrength: 0.55 },
  { name: 'Med Bay',     src: BASE + '/MedBay.jpg',             focus: 'center', recommendedPageMode: 'dark',  scrimStrength: 0.6 },
  { name: 'Plasmid',     src: BASE + '/PlasmidBlue.jpg',        focus: 'center', recommendedPageMode: 'dark',  scrimStrength: 0.55 },
  { name: 'Gradient',    src: BASE + '/Gradient.jpg',           focus: 'center', recommendedPageMode: 'light', scrimStrength: 0.4 }
];

// Solid earth-tone backgrounds — row 2 of the dialog's Ambiance section.
// Values ride the SAME persistence axis as images ('color:'-prefixed).
export const EARTH_TONES = [
  { name: 'Clay',       value: makeColorBackground('#a67b5b') },
  { name: 'Sand',       value: makeColorBackground('#d9c7a7') },
  { name: 'Terracotta', value: makeColorBackground('#b0674b') },
  { name: 'Moss',       value: makeColorBackground('#6b7d5a') },
  { name: 'Sage',       value: makeColorBackground('#a3b18a') },
  { name: 'Stone',      value: makeColorBackground('#8d8578') },
  { name: 'Ochre',      value: makeColorBackground('#c49a3c') },
  { name: 'Espresso',   value: makeColorBackground('#4a3728') }
];

// Look up the active IMAGE background's curation record. Solid 'color:'
// entries and unknown/operator paths return null — callers fall back to
// defaults (focus 'center', scrim 0.55), which is correct for solids.
export function getBackgroundEntry(activeValue) {
  if (!activeValue) { return null; }
  return getBackgroundLibrary().find(function(entry) { return entry.src === activeValue; }) || null;
}
```

(`getBackgroundEntry` lives below `getBackgroundLibrary` so it can call it.)

- [ ] **Step 2: Verify nothing broke at parse level**

Run: `node --experimental-detect-module --check imports/ui/themeBackgrounds.js && echo PARSE-OK`
Expected: `PARSE-OK` (the file imports Meteor so it can't *execute* under plain node — syntax check only; runtime verification comes with Task 7's dialog work).

- [ ] **Step 3: Commit**

```bash
git add imports/ui/themeBackgrounds.js
git commit -m "feat(theme): curation records + earth-tone solids in the background library"
```

---

### Task 4: StyledMainRouter paints solid-color backgrounds

**Files:**
- Modify: `imports/ui/App.jsx` (the ambiance block inside `StyledMainRouter`, ~lines 1891-1898)

**Interfaces:**
- Consumes: `isColorBackground` / `colorFromBackground` from Task 1.
- Produces: `#mainAppRouter` renders a flat color when the persisted background is `color:`-prefixed, the image otherwise. (Route gating comes in Phase 3 — for now behavior parity: backgrounds still show on all routes.)

- [ ] **Step 1: Add the import and branch the painter**

Add to App.jsx imports (near the other `./theme/` imports):

```javascript
import { isColorBackground, colorFromBackground } from './theme/backgroundValue.js';
```

Replace the ambiance block:

```javascript
  const ambianceBackground = get(Meteor, 'settings.public.theme.backgroundImagePath', '');
  if (ambianceBackground) {
    if (isColorBackground(ambianceBackground)) {
      // Solid ambiance: override the canvas color, no image layer.
      mainAppStyle.backgroundColor = colorFromBackground(ambianceBackground);
    } else {
      mainAppStyle.backgroundImage = 'url(' + ambianceBackground + ')';
      mainAppStyle.backgroundSize = 'cover';
      mainAppStyle.backgroundPosition = 'center';
      mainAppStyle.backgroundAttachment = 'fixed';
    }
  }
```

(Keep the existing explanatory comment above the block; extend its last line with: `Solid 'color:' entries (themeBackgrounds EARTH_TONES) paint backgroundColor instead.`)

- [ ] **Step 2: Manual verify**

Run the app (`meteor run --settings settings/settings.honeycomb.localhost.json`), open DevTools console:

```javascript
require('/imports/ui/themePresets.js').setThemeBackground('color:#a67b5b');
```

Expected: page canvas turns clay; no broken-image artifacts. Then `setThemeBackground('')` restores the theme canvas.

- [ ] **Step 3: Commit**

```bash
git add imports/ui/App.jsx
git commit -m "feat(theme): StyledMainRouter paints color-prefixed solid ambiance backgrounds"
```

---

### Task 5: `pageMode` + `cardSurface` persistence axes

**Files:**
- Modify: `imports/lib/SessionKeys.js` (App chrome / display toggles section)
- Modify: `imports/ui/themePresets.js` (new setters + boot restore)
- Modify: `imports/lib/themePersistence.js` (doc-comment shape only)

**Interfaces:**
- Consumes: existing `saveThemeChoice` / `loadThemeChoice`, `Session`.
- Produces:
  - `SessionKeys.js`: `export const PAGE_MODE = 'pageMode';` and `export const CARD_SURFACE = 'cardSurface';`
  - `themePresets.js`: `setPageMode(mode)` (`'light'|'dark'|null`; null clears) and `setCardSurface(surface)` (`'solid'|'glass'|'flat'`; anything else → `'solid'`). Both write Session (reactive consumers) + `saveThemeChoice` + `pokeRefresh()`.
  - `applyThemeChoiceAtBoot()` restores both into Session, treating unknown persisted values as unset (spec: persistence robustness).
- Task 7 calls the setters; Task 8 reads `Session.get(PAGE_MODE)`; Phase 3 reads `CARD_SURFACE`.

- [ ] **Step 1: Add the Session key constants**

In `imports/lib/SessionKeys.js`, in the app-chrome/display group:

```javascript
export const PAGE_MODE    = 'pageMode';    // ambiance content-ink override: 'light' | 'dark' | undefined
export const CARD_SURFACE = 'cardSurface'; // card surface state: 'solid' | 'glass' | 'flat'
```

- [ ] **Step 2: Add setters to themePresets.js** (below `setThemeBackground`)

```javascript
import { PAGE_MODE, CARD_SURFACE } from '/imports/lib/SessionKeys.js';

const CARD_SURFACES = ['solid', 'glass', 'flat'];

// Live control: content-ink mode for ambiance-enabled pages ('light'|'dark');
// null/undefined clears the override (app mode stands). Chrome keeps Session('theme').
export function setPageMode(mode) {
  const next = (mode === 'light' || mode === 'dark') ? mode : null;
  Session.set(PAGE_MODE, next || undefined);
  saveThemeChoice({ pageMode: next });
  pokeRefresh();
}

// Live control: card surface state. Unknown values coerce to 'solid'.
export function setCardSurface(surface) {
  const next = CARD_SURFACES.indexOf(surface) !== -1 ? surface : 'solid';
  Session.set(CARD_SURFACE, next);
  saveThemeChoice({ cardSurface: next });
  pokeRefresh();
}
```

- [ ] **Step 3: Restore at boot**

In `applyThemeChoiceAtBoot()`, after the `backgroundImagePath` block:

```javascript
  // Ambiance axes — unknown persisted values are treated as unset
  // (forward/backward compat per the ambiance spec).
  if (choice.pageMode === 'light' || choice.pageMode === 'dark') {
    Session.set(PAGE_MODE, choice.pageMode);
  }
  if (['solid', 'glass', 'flat'].indexOf(choice.cardSurface) !== -1) {
    Session.set(CARD_SURFACE, choice.cardSurface);
  }
```

- [ ] **Step 4: Update the persistence doc comment**

In `imports/lib/themePersistence.js`, extend the shape comment:

```javascript
//   { presetId, accentHue, fontFamily, mode, backgroundImagePath,
//     pageMode, cardSurface,
//     paletteOverrides: { <paletteKey>: <hex> } }
// pageMode ('light'|'dark') is the ambiance content-ink override; cardSurface
// ('solid'|'glass'|'flat') is the card surface state. Both consumed only by
// ambiance/fluid routes (see the 2026-08-03 ambiance spec).
```

- [ ] **Step 5: Manual verify**

With the app running, in DevTools:

```javascript
var tp = require('/imports/ui/themePresets.js');
tp.setPageMode('light');
JSON.parse(localStorage.getItem('honeycomb.theme')).pageMode  // → 'light'
tp.setCardSurface('glass');
JSON.parse(localStorage.getItem('honeycomb.theme')).cardSurface  // → 'glass'
Session.get('pageMode')     // → 'light'
Session.get('cardSurface')  // → 'glass'
```

Reload the page; `Session.get('pageMode')` → `'light'` again (boot restore).

- [ ] **Step 6: Commit**

```bash
git add imports/lib/SessionKeys.js imports/ui/themePresets.js imports/lib/themePersistence.js
git commit -m "feat(theme): pageMode + cardSurface persisted axes with boot restore"
```

---

### Task 6: `pageModeTheme.js` — shared content-ink theme helper

**Files:**
- Create: `imports/ui/theme/pageModeTheme.js`

**Interfaces:**
- Consumes: `createTheme` from `@mui/material/styles`.
- Produces: `buildPageModeTheme(appTheme, forcedMode) → muiTheme` — returns `appTheme` unchanged when `forcedMode` is falsy or equals the app mode; otherwise a rebuilt theme with the app's accent palette + typography and only mode-dependent tokens flipped. This is the DirectoryConsole inline override (uncommitted diff, `DirectoryConsole.jsx` ~lines 692-707), promoted verbatim so Task 8 and every future zone page share one implementation.

- [ ] **Step 1: Create the helper**

```javascript
// imports/ui/theme/pageModeTheme.js
//
// Build the "content ink" theme for ambiance pages: same brand accents +
// typography as the app theme, but with the mode-dependent tokens
// (text/background/divider) flipped to the forced mode. The app chrome
// (header/footer/dialogs) keeps the real mode — only zone page content
// consumes this. Promoted from DirectoryConsole's inline override.
// Spec: docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md

import { createTheme } from '@mui/material/styles';

export function buildPageModeTheme(appTheme, forcedMode) {
  if (!forcedMode || !appTheme || forcedMode === appTheme.palette.mode) { return appTheme; }
  return createTheme({
    palette: {
      mode: forcedMode,
      primary: appTheme.palette.primary,
      secondary: appTheme.palette.secondary,
      error: appTheme.palette.error,
      warning: appTheme.palette.warning,
      info: appTheme.palette.info,
      success: appTheme.palette.success
    },
    typography: appTheme.typography
  });
}
```

- [ ] **Step 2: Verify via consumer swap** (done in Task 8 — this file has no standalone runtime; parse-check only)

Run: `node --experimental-detect-module --check imports/ui/theme/pageModeTheme.js && echo PARSE-OK`
Expected: `PARSE-OK`

- [ ] **Step 3: Commit**

```bash
git add imports/ui/theme/pageModeTheme.js
git commit -m "feat(theme): shared buildPageModeTheme helper (ambiance content ink)"
```

---

### Task 7: ThemeControls restructure — Ambiance under Preset, Basic Theme Controls, Page Mode, Card Surface

**Files:**
- Modify: `imports/ui/theme/ThemeControls.jsx`

**Interfaces:**
- Consumes: `EARTH_TONES`, `getBackgroundLibrary` (Task 3); `colorFromBackground`, `isColorBackground` (Task 1); `setPageMode`, `setCardSurface` (Task 5); `PAGE_MODE`, `CARD_SURFACE` from SessionKeys; existing `setThemeBackground`, `applyThemePreset`, `setAccentHue`, `setThemeFont`.
- Produces: the dialog + `/theming` page render the new order. Element ids for tests: `themePageModeToggle`, `themeCardSurfaceGroup`, `themeCardSurface-solid|glass|flat`, `themeEarthTone-<name>` (kebab name), existing `themePreset-*`, `themeModeToggle`, `themeFontSelect` unchanged.

- [ ] **Step 1: Update imports and reactive state**

Add to the imports:

```javascript
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { getBackgroundLibrary, EARTH_TONES } from '../themeBackgrounds.js';
import { colorFromBackground } from './backgroundValue.js';
import { setPageMode, setCardSurface } from '../themePresets.js';
import { PAGE_MODE, CARD_SURFACE } from '/imports/lib/SessionKeys.js';
```

(Remove the now-duplicated `getBackgroundLibrary` import line.) Inside `ThemeControls`, next to the existing `mode` tracker:

```javascript
  const pageMode = useTracker(function() { return Session.get(PAGE_MODE); }, []);
  const cardSurface = useTracker(function() { return Session.get(CARD_SURFACE) || 'solid'; }, []);
```

- [ ] **Step 2: Reorder the JSX**

New render order inside the root `<Box>` (preset tiles block stays first, unchanged). Move the ambiance section directly after the preset grid and extend it with the earth-tone row; then the relabeled controls group:

```jsx
      {/* Ambiance background — images row + earth-tone solids row */}
      <Typography variant="overline" color="text.secondary">Ambiance background</Typography>
      <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, mt: 1 }}>
        <ButtonBase
          onClick={function() { setThemeBackground(''); }}
          sx={{
            flex: '0 0 auto', width: 96, height: 60, borderRadius: '6px',
            border: '2px solid', borderColor: !activeBg ? 'primary.main' : 'divider',
            bgcolor: 'background.default', fontSize: 11, color: 'text.secondary'
          }}
        >
          None
        </ButtonBase>
        {getBackgroundLibrary().map(function(bg) {
          const selected = activeBg === bg.src;
          return (
            <Tooltip key={bg.src} title={bg.name}>
              <ButtonBase
                onClick={function() { setThemeBackground(bg.src); }}
                sx={{
                  flex: '0 0 auto', width: 96, height: 60, borderRadius: '6px', overflow: 'hidden',
                  border: '2px solid', borderColor: selected ? 'primary.main' : 'divider',
                  backgroundImage: 'url(' + bg.src + ')', backgroundSize: 'cover', backgroundPosition: 'center',
                  transition: 'transform 0.15s ease', '&:hover': { transform: 'scale(1.04)' }
                }}
              />
            </Tooltip>
          );
        })}
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, mt: 1, mb: 3 }}>
        {EARTH_TONES.map(function(tone) {
          const selected = activeBg === tone.value;
          return (
            <Tooltip key={tone.value} title={tone.name}>
              <ButtonBase
                id={'themeEarthTone-' + tone.name.toLowerCase()}
                onClick={function() { setThemeBackground(tone.value); }}
                sx={{
                  flex: '0 0 auto', width: 96, height: 36, borderRadius: '6px',
                  border: '2px solid', borderColor: selected ? 'primary.main' : 'divider',
                  bgcolor: colorFromBackground(tone.value)
                }}
              />
            </Tooltip>
          );
        })}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Basic theme controls: font, mode(s), accent hue, card surface */}
      <Typography variant="overline" color="text.secondary">Basic theme controls</Typography>
```

The existing Font/Mode/Accent-hue grid follows (unchanged layout), with two additions inside it. Next to the Mode block, add Page Mode (renders only when a background is active — image or solid):

```jsx
          {activeBg ? (
            <Box>
              <Typography variant="overline" color="text.secondary">Page mode</Typography>
              <Box>
                <Tooltip title="Content ink over the ambiance background (chrome keeps the app mode)">
                  <Button
                    id="themePageModeToggle"
                    variant="outlined" size="small"
                    startIcon={pageMode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
                    onClick={function() { setPageMode(pageMode === 'dark' ? 'light' : 'dark'); }}
                  >
                    {pageMode ? (pageMode === 'dark' ? 'Dark' : 'Light') : 'Auto'}
                  </Button>
                </Tooltip>
              </Box>
            </Box>
          ) : null}
```

After the accent-hue block (still inside the controls grid), the Card Surface control:

```jsx
        <Box>
          <Typography variant="overline" color="text.secondary">Card surface</Typography>
          <Box sx={{ mt: 1 }}>
            <ToggleButtonGroup
              id="themeCardSurfaceGroup"
              exclusive size="small" value={cardSurface}
              onChange={function(event, next) { if (next) { setCardSurface(next); } }}
            >
              <ToggleButton id="themeCardSurface-solid" value="solid">Solid</ToggleButton>
              <ToggleButton id="themeCardSurface-glass" value="glass">Glass</ToggleButton>
              <ToggleButton id="themeCardSurface-flat" value="flat">Flat</ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Applies on ambiance/fluid pages (rolling out per page).
            </Typography>
          </Box>
        </Box>
```

Delete the old trailing ambiance carousel section (it moved up).

- [ ] **Step 3: Manual verify (dialog + page parity)**

App running → Ctrl+Shift+T: order is Preset → Ambiance (2 rows) → Basic theme controls (Font, Mode, [Page mode when bg active], Accent hue, Card surface) → Advanced collapsible. Select Sand: canvas turns sand, Page-mode button appears. Select None: Page-mode button disappears. Toggle Glass: reload, control still shows Glass. Visit `/theming`: identical controls.

- [ ] **Step 4: Commit**

```bash
git add imports/ui/theme/ThemeControls.jsx
git commit -m "feat(theme): dialog restructure — ambiance under preset, earth tones, page mode + card surface controls"
```

---

### Task 8: DirectoryConsole polish — xl padding, persisted pageMode, scrim system

**Files:**
- Modify: `npmPackages/provider-directory/client/DirectoryConsole.jsx` (includes committing the pre-existing uncommitted `?align`/`?page-theme`/census-filter work — do not revert it)

**Interfaces:**
- Consumes: `buildPageModeTheme` (Task 6), `PAGE_MODE` SessionKey + persisted value (Task 5), `getBackgroundEntry` (Task 3).
- Produces: the zone reference implementation — Phase 3 extracts its var recipe.

- [ ] **Step 1: Swap the inline theme override for the shared helper + persisted pageMode**

Replace the `?page-theme` block (the `forcedMode`/`useMemo(createTheme...)` section from the uncommitted diff) with:

```javascript
  // Content-ink override: URL param (dev/demo) wins over the persisted
  // Page Mode choice (Theme & Palette dialog). Falsy → app mode stands.
  const pageThemeParam = (searchParams.get('page-theme') || '').toLowerCase();
  const persistedPageMode = useTracker(function() { return Session.get(PAGE_MODE); }, []);
  const paramMode = (pageThemeParam === 'light' || pageThemeParam === 'dark') ? pageThemeParam : null;
  const forcedMode = paramMode || persistedPageMode || null;
  const theme = useMemo(function() {
    return buildPageModeTheme(appMuiTheme, forcedMode);
  }, [appMuiTheme, forcedMode]);
```

Imports to add: `import { buildPageModeTheme } from '/imports/ui/theme/pageModeTheme.js';`, `import { PAGE_MODE } from '/imports/lib/SessionKeys.js';`, `import { getBackgroundEntry } from '/imports/ui/themeBackgrounds.js';`, plus `useTracker` from `meteor/react-meteor-data` and `Session` from `meteor/session` (check existing imports first — the file already imports Meteor). Remove the now-unused `createTheme` import.

- [ ] **Step 2: Focus + scrim vars from the active background's curation record**

Where `consoleVars` is built (after the theme), resolve the active entry and derive defaults:

```javascript
  // Curation record for the active ambiance (scrim strength + focus).
  const activeBg = useTracker(function() {
    return get(Meteor, 'settings.public.theme.backgroundImagePath', '');
  }, []);
  const bgEntry = getBackgroundEntry(activeBg);
  const scrimStrength = get(bgEntry, 'scrimStrength', 0.55);

  // ?align param wins; otherwise the image's curated focus; otherwise center.
  const alignParam = (searchParams.get('align') || '').toLowerCase();
  const focus = ['left', 'center', 'right'].indexOf(alignParam) !== -1
    ? alignParam
    : (get(bgEntry, 'focus') || 'center');
  const bodyAlign = focus === 'left' ? { ml: 0, mr: 'auto' }
    : focus === 'right' ? { ml: 'auto', mr: 0 }
    : { mx: 'auto' };
```

(This replaces the existing `alignParam`/`bodyAlign` block from the uncommitted diff — same output shape, new default source.)

- [ ] **Step 3: xl padding + column scrim**

On the console body container (currently `maxWidth: '1180px', ...bodyAlign, px: { xs: 2.5, md: 5 }`):

```javascript
        <Box sx={{
          maxWidth: '1180px', ...bodyAlign,
          px: { xs: 2.5, md: 5 },
          pt: { xs: 3, md: 5 }, pb: 8,
          // Column scrim: a soft canvas-tinted backdrop so content survives
          // bright photos. Strength comes from the image's curation record.
          background: `linear-gradient(180deg,
            ${alpha(theme.palette.background.default, scrimStrength)} 0%,
            ${alpha(theme.palette.background.default, scrimStrength * 0.85)} 100%)`,
          backdropFilter: 'blur(2px)',
          borderRadius: '4px'
        }}>
```

And on the outer scroll Box add the wide-viewport easement:

```javascript
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', position: 'relative', zIndex: 2, px: { xl: '200px' } }}>
```

(The 200px rides MUI's standard `xl` = 1536px breakpoint per the spec.)

- [ ] **Step 4: Row/chip/telemetry legibility**

In the module-scope CSS string (the `.grid-console` block at the top of the file):

```css
/* Result rows get a panel backing so org names never sit naked on the photo */
.gc-row { background: color-mix(in srgb, var(--panel-hard) 45%, transparent); }
.gc-row:hover { background: color-mix(in srgb, var(--panel-hard) 70%, transparent); }
```

(Adjust the selector to the actual result-row class in `ResultBand` — the row `ButtonBase`/`Box` carries the border-left hover treatment around line 103; add the class `gc-row` to that element if it lacks one.) Bump the small telemetry text (`RETURN IN`, `UPLINK`, band counts) from `var(--stone)`/`var(--stone-dim)` to `var(--ink)` at their usage sites, and give the ACTIVE chip its panel backing: in the chip style (`.gc-chip-btn` and the status chip in `ResultBand`), add `background: color-mix(in srgb, var(--panel-hard) 60%, transparent);`.

- [ ] **Step 5: Manual verify across the matrix**

App running, Yoga Ocean selected, visit `/provider-directory`:
- Column sits LEFT (curated focus) without any `?align` param; `?align=right` overrides.
- Stats, ACTIVE chips, and telemetry text readable over the sunset (scrim visible behind the column).
- Page-mode toggle in the dialog flips the console ink without touching header/footer.
- At a ≥1600px window the console keeps ~200px side breathing room; at laptop width the old paddings apply.
- Zen Rocks: column sits RIGHT, light ink.
- Background None: page renders like a normal themed page (scrim over plain canvas is invisible-ish; verify no dark band artifact — if the scrim reads as a gray slab on None, gate it: `background: activeBg ? linear-gradient(...) : 'transparent'`).

- [ ] **Step 6: Commit (includes the pre-existing uncommitted console work)**

```bash
git add npmPackages/provider-directory/client/DirectoryConsole.jsx
git commit -m "feat(provider-directory): console-over-ambiance polish — curated focus, scrim system, xl easement, persisted page mode"
```

---

### Task 9: Nightwatch coverage — dialog controls persist

**Files:**
- Create: `tests/nightwatch/honeycomb/theme/ambianceControls.js`

**Interfaces:**
- Consumes: element ids from Task 7 (`themeEarthTone-sand`, `themePageModeToggle`, `themeCardSurface-glass`), Session keys, `honeycomb.theme` localStorage.
- Produces: regression coverage for the spec's "dialog controls persist across reload" requirement.

- [ ] **Step 1: Write the test file**

```javascript
// tests/nightwatch/honeycomb/theme/ambianceControls.js
// E2E: Theme & Palette ambiance controls persist across reload.
// Spec: docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md

module.exports = {
  '01. Open dialog, pick an earth tone': function(browser) {
    browser.url('http://localhost:3000/');
    browser.pause(2000);
    browser.execute(function() { Session.set('themeDialogOpen', true); });
    browser.pause(1000);
    browser.expect.element('#themeEarthTone-sand').to.be.present;
    browser.execute(function() { document.querySelector('#themeEarthTone-sand').click(); });
    browser.pause(500);
    browser.execute(function() {
      return JSON.parse(localStorage.getItem('honeycomb.theme') || '{}').backgroundImagePath;
    }, [], function(result) {
      browser.assert.equal(result.value, 'color:#d9c7a7', 'sand persisted on the background axis');
    });
  },

  '02. Page-mode toggle appears with a background and persists': function(browser) {
    browser.expect.element('#themePageModeToggle').to.be.present;
    browser.execute(function() { document.querySelector('#themePageModeToggle').click(); });
    browser.pause(500);
    browser.execute(function() {
      return JSON.parse(localStorage.getItem('honeycomb.theme') || '{}').pageMode;
    }, [], function(result) {
      browser.assert.ok(result.value === 'light' || result.value === 'dark', 'pageMode persisted');
    });
  },

  '03. Card surface persists across reload': function(browser) {
    browser.execute(function() { document.querySelector('#themeCardSurface-glass').click(); });
    browser.pause(500);
    browser.refresh();
    browser.pause(3000);
    browser.execute(function() { return Session.get('cardSurface'); }, [], function(result) {
      browser.assert.equal(result.value, 'glass', 'cardSurface restored at boot');
    });
  },

  '04. None hides page-mode control and clears the axis': function(browser) {
    browser.execute(function() { Session.set('themeDialogOpen', true); });
    browser.pause(1000);
    browser.execute(function() {
      var buttons = document.querySelectorAll('.MuiDialog-root button');
      for (var i = 0; i < buttons.length; i++) {
        if (buttons[i].textContent.trim() === 'None') { buttons[i].click(); return; }
      }
    });
    browser.pause(500);
    browser.expect.element('#themePageModeToggle').to.not.be.present;
    browser.end();
  }
};
```

- [ ] **Step 2: Run locally**

App running with the localhost settings, then:

Run: `npx nightwatch tests/nightwatch/honeycomb/theme/ambianceControls.js --config nightwatch.conf.js`
Expected: 4 passing tests. (If Chrome/driver versions mismatch locally, use the `CHROMEDRIVER_PATH` recipe from the project memory.)

- [ ] **Step 3: Commit**

```bash
git add tests/nightwatch/honeycomb/theme/ambianceControls.js
git commit -m "test(theme): ambiance dialog controls persist across reload (e2e)"
```

---

### Task 10: Verification sweep

**Files:** none (verification only)

- [ ] **Step 1: Unit suite**

Run: `npm run test:background-value && npm run test:ambiance-analysis`
Expected: all PASS.

- [ ] **Step 2: Theme audits**

Run `/audit-theme` and `/audit-print` (Claude commands) over the touched files — expected: no new unconditional hardcoded surface colors flagged in components (EARTH_TONES data constants are exempt as theme-system data); print path unaffected (scrim/solid backgrounds live behind the global `@media print` white-surface rules — spot-check a print preview of `/provider-directory`).

- [ ] **Step 3: Regression spot-checks**

- Unflagged behavior parity: visit `/fhir-graph` and `/patients` with Yoga Ocean active — rendering identical to before this branch (route gating is Phase 3; nothing should have changed on these pages).
- Preset switching still works (Limestone → Tron → Vaporwave), accent wheel live-tracks, font select applies.
- `localStorage.removeItem('honeycomb.theme')` + reload → clean defaults, no console errors.

- [ ] **Step 4: Update the spec status line**

In `docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md`, change the Status line to `Phases 1-2 implemented (<commit range>); Phase 3 pending`. Commit:

```bash
git add docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md
git commit -m "docs(specs): mark ambiance phases 1-2 implemented"
```
