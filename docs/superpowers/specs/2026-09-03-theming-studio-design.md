# Theming Studio — ThemingPage + ThemeDialog redesign

**Date:** 2026-09-03
**Status:** Approved design, pre-implementation
**Design handoff:** `workzone/design_handoff_theming_studio/` (README.md is the
prescriptive spec for layout/behavior/algorithms; `Theming Studio.dc.html` is the
visual reference)

## Scope (this round)

- Full redesign of the `/theming` page ("Theming Studio") and the Theme & Palette
  dialog (handoff option 2b).
- **No server work.** Clinic themes persist to localStorage only; "Publish to
  clinic" performs today's load-into-settings behavior (write
  `Meteor.settings.public.theme` + poke `Session('themeRefreshRequest')`). A
  per-org Mongo collection is a documented follow-up.
- New theme dimensions (corner radius, density, base font size, Nivo "auto"
  palette) **are wired into CustomThemeProvider** so Publish affects the live
  app — not preview-only.

## Concept (from handoff)

Preset → Clinic theme → Personal layer. Presets (Limestone / Tron / Vaporwave)
are starting points; any edit on the full page forks into a named clinic theme
("Cloned from Tron") saved locally. The dialog is the personal layer: pick a
theme, then mode · accent hue/saturation · font · ambiance — no raw values.
Light and dark are edited together (every surface is a Light | Dark pair;
one-click derive in either direction). Ambiance is a constraint: selecting an
image sets paper to 88% rgba opacity and hints that dark mode is preferred.

## Architecture

```
imports/ui/theming/
  ThemingPage.jsx        studio page: top bar, rail, preview pane; owns useThemeDraft
  ThemeMiniature.jsx     shared patient-chart miniature; props { draft, mode, variant: 'full'|'strip' }
  ContrastPills.jsx      WCAG ratio pills for a given mode
  themeDraft.js          PURE draft⇄settings converters (no Meteor imports)
  useThemeDraft.js       hook: draft state, dirty flag, saved[] themes, wraps themeDraft.js
imports/ui/ThemingPage.jsx      thin re-export (route unchanged)
imports/ui/ThemeDialog.jsx      rewritten to option 2b; imports ThemeMiniature
imports/ui/themeAlgorithms.js   PURE color math (no imports at all)
imports/ui/themePresets.js      re-exports the algorithms; + getNivoColors()
imports/lib/themePersistence.js + saveClinicThemes()/loadClinicThemes()
                                  (localStorage key honeycomb.clinicThemes, merge-write style)
imports/ui/CustomThemeProvider.jsx  consume the new keys (table below)
tests/unit/imports/ui/themeAlgorithms.test.mjs
tests/unit/imports/ui/themeDraft.test.mjs
```

### Data flow (authority chain unchanged)

Draft state exists only in the page/dialog. The live app changes only via the
existing mechanism: write into `Meteor.settings.public.theme`, poke
`Session('themeRefreshRequest')`, CustomThemeProvider regenerates. The dialog
stays live-apply (as today); the full page stays draft-then-publish (as today).

- **Save** → named theme to localStorage; does not touch the live app.
- **Publish to clinic** → load-into-settings + save. Button keeps the handoff
  label but gains a tooltip ("applies to this app session") until the server
  round makes it org-wide.
- **Share link** → `/theming?theme=<base64url JSON draft>`; read once on mount,
  no server.

### Draft shape

Flat working model per handoff §State: `{ name, base, primary, secondary,
success, info, warning, error, bgLight, bgDark, paperLight, paperDark,
appBarLight, appBarDark, appBarTextLight, appBarTextDark, font, baseFont,
radius, density, ambiance, video, nivo }` plus UI state (`savedId`, `saved[]`,
`previewMode`, `open{}`, `dirty`, `jsonDraft`).

`themeDraft.js` exports `draftToSettings()` / `settingsToDraft()` mapping to the
existing settings keys (`primaryColor`, `secondaryColor`, `successColor`,
`infoColor`, `warningColor`, `errorColor`, `backgroundPageColor(*Dark)` /
`backgroundCanvasDark`, `paperColor(*Dark)`, `appBarColor(*Dark)`,
`appBarTextColor(*Dark)`, `backgroundImagePath`, `showVideoBackground`,
`palette.nivoTheme`, `typography.fontFamily`) plus new keys
(`shape.borderRadius`, `density`, `typography.baseSize`, `name`, `basePreset`).
Round-trip fidelity is the tested invariant. Absent new keys default to
radius 4, baseSize 14, density "standard".

## UI

### ThemingPage (studio)

Greedy-height page per `.claude/rules/ui/layout-patterns.md` (flex cascade,
`minHeight: 0`, inner scroll regions; no viewport math). Editor chrome uses
live theme tokens (`background.paper`, `text.secondary`, `divider`); **only the
miniature** renders under the nested draft theme.

Top bar (48px Paper): "Theming" · divider · borderless name TextField
(14px/500) · Chip "Cloned from {preset}" · "Unsaved changes" caption when
dirty · right: `Share link` (text) · `Save` (outlined) · `Publish to clinic`
(outlined primary).

Layout switches on `useMediaQuery('(min-aspect-ratio: 23/20)')` (≈1.15):

**Landscape** — `grid-template-columns: 372px 1fr`. Rail (scrollable, 18px side
padding, 10px uppercase overline labels, letter-spacing .1em):

1. **Start from** — 3 preset tiles (name + 3 swatches: primary, secondary,
   paperDark; selected = 1px primary border). **Clinic themes** — list rows:
   4 thin swatch bars · name · "Default" outlined chip · meta.
2. **Accent hue** — color input + hex; hue slider 0–360 (rainbow track),
   saturation slider 0–100 (neutral→primary track). Buttons: `Generate palette
   from accent`, `Mono`.
3. Collapsible groups (header: label, summary caption, +/−):
   - **Palette** — rows for primary, secondary, success, info, warning, error:
     swatch · label + hint · mono hex TextField (96px).
   - **Surfaces** — 3-col grid (label | Light | Dark) for page background,
     paper, app bar, app-bar text; 56×30 color inputs; footer buttons
     `Derive dark ← light` / `Derive light ← dark`.
   - **Type, shape & density** — font Select (Default / Chakra Petch / Martian
     Mono), base size slider 12–17, radius slider 0–20, density
     ToggleButtonGroup (Compact / Standard / Relaxed).
   - **Ambiance** — 4-col grid of 44px tiles (None + 12 from
     `themeBackgrounds.js`), 88%-paper hint box when set, video
     ToggleButtonGroup (Off / GrayWaves.mp4).
   - **Charts (Nivo)** — Select: Auto (5 steps from primary) / red_grey /
     blues / greens / purples / oranges; 18px color strip.
   - **Raw JSON** — Ace editor (lazy via React.lazy + ErrorBoundary + Suspense
     per `.claude/rules/ui/error-handling.md`); two-way with the draft; invalid
     JSON keeps last good state and shows "Invalid JSON — not applied".

Preview pane (22px padding, subtle radial-gradient ground): overline
"Preview · Patient chart"; ToggleButtonGroup Light / Dark / Side by side; one
miniature per visible mode (flex row, equal widths); below, ContrastPills.

**Portrait** — `grid-template-columns: 400px 1fr`. Rail: **Tools** block on a
darker ground (Generate from accent · Make monochrome · Derive dark ← light ·
Derive light ← dark; preset segmented control; hue slider), **Roles** 3-col
swatch-card grid (34px swatch, label, hex), **Surfaces** 3-col rows,
font/nivo/radius/base-size 2-col, ambiance 7-col strip, Raw JSON group (same
Ace editor as landscape).
Preview: miniatures stacked, each with label + contrast pills in its header row.

All interactive controls carry `id`s (`themingStudio-*`) for Nightwatch.

### ThemeMiniature

One component, both screens; static demo data inlined (Camila Maria Lopez,
encounters/conditions/biomarkers rows) — no collections, no Session. Nested
`<ThemeProvider theme={useMemo(() => createTheme(fromDraft(draft, mode)))}>`.

`variant='full'`: app bar (Lattice RIS · CLEAR PATIENT · demo · LOGOUT) →
patient strip on `mix(appBar, paper, .5)` dark / `mix(appBar, #fff, .12)`
light → Encounters card (tinted count chip, 5-col table, pagination row) →
Conditions card (role-colored outlined chips, success + warning alerts) →
Biomarkers card (5 bars in Nivo colors, contained + outlined + text buttons) →
bottom nav, active tab filled primary. `variant='strip'` (dialog): app bar +
Encounters + Conditions only.

Font = draft font; base font = `baseSize × .82`; paddings scale with density
(.7 / 1 / 1.3); card radius = draft radius; ambiance → background-image on the
miniature with paper as rgba(paper, .88).

### ContrastPills

Pills "{Mode} accent on paper", "{Mode} text on page", "{Mode} app-bar text"
with WCAG ratio and dot: green ≥4.5, amber ≥3, red <3.

### ThemeDialog (option 2b)

`maxWidth 720`. Title "Theme & palette" + ⌘⇧T caption + close.

1. **Live strip** — ThemeMiniature `variant='strip'` from current selection.
2. **Clinic theme** — 4 tiles (4-swatch bar, name, accent dot if default,
   meta) from localStorage clinic themes; last tile "New from preset…" applies
   a preset and navigates to `/theming`.
3. Two columns: left **Mode** (Light / Dark / Auto) + **Font** select; right
   **Accent hue** (swatch + hue slider, "Desaturate → Limestone · saturate →
   Tron") + saturation slider. (Replaces the current hue wheel.)
4. **Ambiance** — two rows of 7 tiles, 52px (None + 12); hint on right when set.
5. Actions: `⤢ Open full editor` (link, left) · `Reset to clinic` (text,
   re-applies selected saved theme / preset default, clears personal overrides)
   · `Done` (outlined primary).

All dialog controls remain live-apply through the existing `themePresets.js`
helpers.

### Input validation

Hex fields validate `#rgb|#rrggbb` before writing to the draft; invalid input
keeps the last good value and shows the field's error state. JSON as above.

## Algorithms (`imports/ui/themeAlgorithms.js`, pure, no imports)

Formulas verbatim from the handoff:

- `setHue(h)`: keep primary S/L, rotate hue; rotate secondary by its existing
  offset; if `appBarTextDark === primary` keep them linked.
- `setSaturation(s)`: primary at new S; keep linked app-bar text.
- `generateFromAccent()`: with S=clamp(s,45,85), L=clamp(l,45,65):
  secondary = hue+35; success = hsl(140, S·.8, L·.85); info = hsl(205,S,L);
  warning = hsl(38,S,L); error = hsl(352,S,L·.9).
- `makeMono()`: primary S=8; secondary S=6, L·.75.
- `deriveDark()`: sat=min(S,30): bgDark=hsl(h, sat·.6, 4%),
  paperDark=hsl(h, sat·.7, 8%), appBarDark=hsl(h, sat·.7, 6%),
  appBarTextDark=primary.
- `deriveLight()`: sat=min(S,40): bgLight=hsl(h, sat·.5, 97%),
  paperLight=#fff, appBarLight=hsl(h, min(S,55), min(L,40)),
  appBarTextLight=#fff.
- `nivoAuto(primary)`: 5 steps `hsl(h, max(S·(1−i·.12), 8), min(L+9i, 90))`.
- `contrastRatio(a, b)`: WCAG relative luminance; thresholds 4.5 / 3.
- `isValidHex(s)`: `#rgb|#rrggbb`.

Plus HSL⇄hex helpers. `themePresets.js` re-exports all of these (the handoff's
"port to themePresets.js" contract holds for consumers).

## CustomThemeProvider wiring (all opt-in; absent keys change nothing)

| Settings key | Effect |
|---|---|
| `theme.shape.borderRadius` | `theme.shape.borderRadius` (default 4) |
| `theme.typography.baseSize` | `theme.typography.fontSize` (default 14) |
| `theme.density` | spacing unit: compact 6 / standard 8 / relaxed 10; compact also sets `size="small"` defaultProps on Button and TextField |
| `theme.palette.nivoTheme: 'auto'` | resolved via `nivoAuto(primaryColor)`; `getNivoColors()` in `themePresets.js` is the single read point for chart consumers (named schemes pass through unchanged) |

Existing sanitization (`getThemeSetting()` `!important` stripping) untouched.

## Testing

- `tests/unit/imports/ui/themeAlgorithms.test.mjs` and
  `themeDraft.test.mjs` — dependency-free `node --test` (eligible for the
  bare-checkout `lib-unit-tests` CI job per
  `.claude/rules/testing/test-organization.md`): derive/generate formulas,
  WCAG ratios against known color pairs, hex validation, draft⇄settings
  round-trip.
- Manual verification against both handoff layouts, plus a regression check:
  boot with current `settings.honeycomb.localhost.json` and confirm the live
  app is pixel-identical until Publish.
- No new Nightwatch this round; ids are in place for a follow-up suite.

## Risks

- Density/baseSize apply app-wide only when a published theme sets them — no
  ambient change for existing deployments.
- Clinic themes are per-browser (localStorage) until the server round; the
  Publish tooltip keeps the label honest.
- The old ThemingPage's raw per-field editing survives via the Palette /
  Surfaces groups + Raw JSON, so no capability is lost in the replacement.

## Follow-ups (documented, not built)

- `ClinicThemes` Mongo collection + methods + publication; "Publish to clinic"
  becomes org-wide; dialog reads org themes with localStorage as personal cache.
- Per-user Mongo sink for `themePersistence.js` (already noted in that file).
- Nightwatch suite for the studio page.
