# Ambiance Experience Zone — Design Spec

**Date**: 2026-08-03
**Branch**: `go-live-ui-polish`
**Status**: Phases 1-3 implemented (Phase 3: 35274b0b..1c401015, 2026-08-04); Phase 3.5/4 pending

## Vision

Honeycomb serves patients who seek very different caring environments — zen
garden, ICU, cyberpunk, refugee camp, desert nomad, eco resort, blue lagoon,
catholic sanctuary. The app expresses this through **ambiance backgrounds**
(full-bleed photos or solid earth tones) with a **glass/AR-style digital
interface** layered over them. Design goals, in priority order:

1. Patient education and trust through aesthetic + cultural framing
2. Calm/peacefulness — the interface reads as a digital layer over an
   environment, not a form over a gray canvas
3. Integration of medical illustration (future)

Not every page participates. Clinical/analytic pages (`/fhir-graph`,
`/clinical-story`, the timeline) own their full-page presentation. A small,
curated set of routes — initially **Provider Directory** and **Vertical
Timeline** — form the *patient-experience zone* where ambiance renders.

## Current state (what exists today)

- **Ambiance leaks everywhere.** `StyledMainRouter` (`imports/ui/App.jsx`
  ~1824) paints `background.default` AND the ambiance `backgroundImage` on the
  same `#mainAppRouter` element; the image layers over the color, so every
  route shows the photo through canvas gaps whether designed for it or not.
- **DirectoryConsole prototype** (uncommitted, `npmPackages/provider-directory/
  client/DirectoryConsole.jsx`): transparent root deferring to the router
  background, `?align=left|center|right` and `?page-theme=light|dark` URL
  params, per-page `createTheme` mode override. Legibility over bright photos
  is poor (washed-out stats, invisible chips/telemetry, naked result rows).
- **ThemeControls** (`imports/ui/theme/ThemeControls.jsx`): shared by the
  Theme & Palette dialog (Ctrl+Shift+T) and `/theming`. Order today: Preset →
  Font/Mode/Accent hue → Ambiance carousel.
- **Persistence**: `saveThemeChoice()`/`loadThemeChoice()`
  (`imports/lib/themePersistence.js`, localStorage) carries `{ presetId,
  accentHue, fontFamily, mode, backgroundImagePath }`.
- **Background library** (`imports/ui/themeBackgrounds.js`): settings-driven
  (`settings.public.theme.backgroundLibrary`), code fallback of 12 images.
- **Flat cards precursor**: Cmd/Ctrl+Shift+L dispatches a `toggleFlatCards`
  CustomEvent consumed locally by `LifeSupportDashboard` and `NotFoundPage`
  (ephemeral, per-page state).
- **Meteor-object distribution precedent**: `Meteor.useTheme`
  (`imports/ui/CustomThemeProvider.jsx:18`), `Meteor.Logger`, `Meteor.rpc`.
- **StyledCard prior art**: a private component inside
  `imports/patient/AutoDashboard.jsx:131` — concept proven, never extracted.
  (A previous extraction attempt via the fhir-starter npm package was judged
  the wrong distribution channel.)

## Core semantics

### Design thesis: constraint puts the best face forward

The ambiance system builds on a decade of background attempts by
*constraining* the existing background functionality: it renders only on
pages that have been vetted for it. When ambiance looks good it looks
great; unvetted it goes wonky and out of alignment fast. Less is more — the
flags below are the constraint mechanism.

### Two capability flags — `enableAmbiance` and `enableFluidInterface`

Route entries declare capabilities (workflow.json → client.js route mapper →
route object → `StyledMainRouter`), riding the exact pipeline
`requireAuth`/`requirePatient` already use. Neither flag turns anything on —
they are developer statements of page competence.

- **`enableFluidInterface: true`** — the Card Surface axis is active on this
  route: Glass/Flat toggles work, the AmbianceZone theme-override net
  applies, shared surface tokens are maintained. The router does **not**
  paint any ambiance background — the page supplies its own backdrop (video,
  animation, canvas render, game engine, or nothing).
- **`enableAmbiance: true`** — everything `enableFluidInterface` grants,
  **plus** the router paints the globally-selected ambiance background
  (image or solid), Page Mode applies, and the background's focus metadata
  is exposed. `enableAmbiance` implies `enableFluidInterface`; declaring
  both is redundant but harmless.

|                          | Background = None | Background = image/solid |
|--------------------------|-------------------|--------------------------|
| **No flags**             | normal page       | normal page — opaque canvas suppresses the ambiance |
| **`enableFluidInterface`** | Card Surface active; page paints its own backdrop | same — global ambiance still suppressed |
| **`enableAmbiance`**     | normal page       | ambiance visible; Page Mode + Card Surface + focus active |

This *tightens* current behavior: unflagged routes stop leaking the photo
through canvas gaps. The user/org choice of background (Theme & Palette
dialog / `settings.public.theme.backgroundImagePath` seed) remains the actual
on-switch and stays global.

Initial flag list: Provider Directory (`/provider-directory`), Vertical
Timeline, and Patient Chart (`/patient-chart` — right components already,
needs the zone to land right-aligned like the directory) — all
`enableAmbiance`. Package-specific pages opt in via their own
workflow.json.

### Focus — curated imagery declares its neutral space

Every ambiance image has a subject and a neutral zone; content must render
in the neutral zone or legibility dies (the yoga shot's neutral space is
left of the figure; the zen stones' is right of the stones). Focus is
therefore **a property of the curated image, not a user preference**:

- Background library entries (`themeBackgrounds.js` /
  `settings.public.theme.backgroundLibrary`) grow from `{ name, src }` into
  **curation records**:

  ```js
  {
    name: 'Yoga Ocean',
    src: '/backgrounds/ambiance/Yoga-Ocean.jpg',
    focus: 'left',                    // neutral-space placement (v1: left|center|right)
    recommendedPageMode: 'light',     // ink that survives this image
    scrimStrength: 0.55,              // 0–1, content-column scrim opacity
    palette: ['#e8a54b', '#c2703e', '#7a5a8c']  // extracted dominant hues (accent candidates)
  }
  ```

  All fields beyond `name`/`src` are optional — uncurated entries behave as
  today (focus `center`, defaults for the rest). Solid colors and None have
  no focus (treated as `center`). Future focus values reserved for
  multi-panel layouts (`'split-2'`, `'split-3'`) — the library shape allows
  them; v1 pages treat unknown values as `center`.
- `AmbianceZone` assembles the **composition object** — the zone's single
  layout contract, resolved from the active curation record + persisted
  axes with defaults filling every gap (a background choice never arrives
  "blank"):

  ```js
  { background, focus, scrimStrength, pageMode, cardSurface }
  ```

  Exposed to pages via a `useAmbiance()` context hook + CSS vars
  (`--ambiance-focus`, `--ambiance-scrim`). This is the "param object"
  every `enableAmbiance` route receives; `Meteor.StyledContainer` is its
  default consumer, so pages currently using vanilla `<Container>` swap one
  import and inherit placement/easement/scrim without bespoke code.
- DirectoryConsole maps focus to its column alignment (the `?align`
  prototype, generalized). The `?align` URL param survives as a dev/demo
  override that wins over library metadata.

### Three persisted theme axes (new + extended)

All global, all through `saveThemeChoice()`:

| Axis | Values | Consumed by |
|------|--------|-------------|
| `pageMode` | `'light'` / `'dark'` / unset | Zone routes only — forces the content-ink palette over ambiance while the chrome (header/footer/dialogs) keeps the app `mode`. Promotes DirectoryConsole's inline `createTheme` override into a shared helper. |
| `cardSurface` | `'solid'` / `'glass'` / `'flat'` | Zone routes now; anywhere later. |
| `backgroundImagePath` (extended) | image `src` **or** solid-color entry | App root. A solid earth tone is just another background choice — mutually exclusive with an image, same axis, same persistence. |

Solid-color entries are stored as a `color:` prefixed string on the existing
axis (e.g. `color:#a67b5b`) — keeps `themePersistence` a flat string shape,
backward compatible with stored image paths. `setThemeBackground()` accepts
both forms; the App.jsx painter branches: image paths set `backgroundImage`,
`color:` values set `backgroundColor` only.

### Card surface — three distinct states, not a toggle

- **Solid** — today's opaque `background.paper`. Default everywhere.
- **Glass** — translucent panel + backdrop blur + hairline border. The
  DirectoryConsole overlay recipe (`--panel` at ~0.72 paper-alpha, hairlines,
  scrims), extracted into shared tokens.
- **Flat** — no surface at all; content melts in from pure negative space
  (the Ctrl+Shift+L effect, graduated).

They are separate effects and both survive: transitions between states are
animated (CSS transitions on background-color / backdrop-filter / border /
opacity), enabling solid→glass fades and the flat melt-in.

Cmd/Ctrl+Shift+L graduates from a per-page CustomEvent to cycling the
persisted `cardSurface` (solid → glass → flat → solid).
`LifeSupportDashboard` and `NotFoundPage` migrate from the event listener to
reading the setting.

### Card ↔ full-height toggle (`onePageLayout` revival)

Heritage: the Meteor-2 app had a per-page toggle (icon button + hotkey)
flipping a list between a bounded Card and a full-height panel. Its fossils
survive — per-page `<Page>.onePageLayout` Session keys (`setDefault(true)`,
read but never flipped) and `LayoutHelpers.getCardLayoutIcon()`
(`ic_filter_1`/`ic_filter_2`, zero callers) — but the trigger stayed behind
in the v2 upstream during the reseed. Phase 3 revives the behavior on the
new axis instead of resurrecting those keys:

- **Flat implies one-page.** On zone routes, `cardSurface: 'flat'` renders
  the page's primary list/panel as the greedy-height treatment
  (`.claude/rules/ui/layout-patterns.md` flex cascade — full height minus
  chrome), with `Meteor.StyledCard` animating the melt between bounded card
  and full-height panel.
- **Cmd/Ctrl+Shift+K** — per-page card ↔ full-height toggle (K is
  unclaimed in `hotkeys.js`). Scoped to the ACTIVE route: flips that page
  between `solid` and `flat` without touching the global `cardSurface`
  choice. Persisted as a per-route override map in the theme choice
  (`pageSurfaceOverrides: { [routePath]: 'solid' | 'flat' }`); route
  override wins over the global axis on that page. Global Ctrl+Shift+L
  cycling remains the app-wide control.
- Legacy `*.onePageLayout` Session keys and `getCardLayoutIcon` retire
  opportunistically as pages adopt StyledCard (no dedicated cleanup PR).

## Architecture

### AmbianceZone route wrapper — correctness by construction

A new wrapper composing exactly like the existing guards:

```
AuthGuard > PatientGuard > AmbianceZone > ErrorBoundary > page
```

On an `enableFluidInterface` route (directly declared, or implied by
`enableAmbiance`), `AmbianceZone`:

1. Wraps the page in a **Page-Mode-derived `ThemeProvider`** (the shared
   helper promoted from DirectoryConsole: rebuild with the app's accent
   palette + typography, flip only mode-dependent tokens). Page Mode applies
   only on `enableAmbiance` routes with an active background; on plain
   `enableFluidInterface` routes the app mode stands.
2. Carries **MuiCard/MuiPaper component overrides** implementing the active
   `cardSurface` — so even a raw MUI `<Card>` in the zone renders legible
   glass/flat treatment with correct ink. Enforcement that depends on
   developer discipline breaks; a theme override at the zone boundary cannot
   be forgotten.
3. Maintains the shared CSS vars (`--panel`, `--panel-hard`, `--ink`,
   `--hairline`, scrim gradients) that bespoke pages consume directly.
4. On `enableAmbiance` routes with an active image background, exposes the
   background's `focus` via context hook + `--ambiance-focus` CSS var.

When the route declares neither flag, AmbianceZone renders children
unchanged (zero cost, zero behavior change).

### StyledMainRouter changes

- Match the active route (`useLocation` + `matchPath` against `allRoutes`)
  and include the ambiance `backgroundImage`/solid `backgroundColor` in
  `mainAppStyle` **only when the active route declares `enableAmbiance`**.
  One decision point, in the file that already owns both the background and
  the route table.
- Compose `AmbianceZone` into the guard chain when either flag is present.

### `Meteor.StyledCard` — the premium surface component

Extracted shared component (`imports/ui/components/StyledCard.jsx`), attached
to the Meteor object at provider setup following the `Meteor.useTheme`
precedent. Workflow packages consume it without import-path coupling:

```javascript
const Card = Meteor.StyledCard || MuiCard;   // graceful degradation
```

StyledCard is surface-aware (`cardSurface`), animates state transitions
(glass fades, flat melt-in from negative space), and inherits zone ink
automatically. It is the **convention** for zone pages — the raw-MUI theme
override above is the **net** underneath it. The private
`AutoDashboard.jsx` StyledCard migrates to (or is superseded by) the shared
one opportunistically.

### `Meteor.StyledContainer` — focus-aware layout primitive

Sibling of StyledCard, same Meteor-object distribution. A Container/Box that
reads `--ambiance-focus` (context hook under the hood) and places its
content column into the image's neutral space — `left | center | right`,
with the `xl`-breakpoint 200px side easement built in and `split-2` /
`split-3` reserved. Pages stop hand-rolling `ml: 'auto'` math;
DirectoryConsole's `?align` logic becomes this component's shared
implementation. "Align with the photo" becomes a prop (auto from the
library's focus metadata; overridable per instance).

## Curation toolkit

The gaps observed while hand-tuning page × background × mode combinations
(inverted ink over bright photos, no palette tweaking, no focus alignment)
are all steps of one **curation loop**. These tools make polishing a layout
repeatable instead of lucky.

### Palette extraction + neutral-space analysis (Phase 1 foundation)

A small client-side analysis module (`imports/ui/theme/ambianceAnalysis.js`):
downsample an image to a canvas, compute dominant colors and a luminance
histogram **per horizontal third**. Outputs a draft curation record:

- lowest-variance third → suggested `focus` (neutral-space detection)
- overall/per-third luminance → suggested `recommendedPageMode`
- dominant hues → `palette` accent candidates
- luminance behind the content column → suggested `scrimStrength`

Deterministic, dependency-free, runs once per image (results cached in the
library entry — curated values always win over computed ones).

### Ambiance Tuning HUD (Cmd/Ctrl+Shift+E)

A dev overlay in the Session Inspector tradition, available on zone routes:
live sliders for **scrim opacity · panel alpha · blur radius · ink mode ·
focus · accent hue**, writing the zone CSS vars in real time so tuning
happens against the actual photo on the actual page. A **Copy as JSON**
button emits the curation record for the background library / settings
file. This replaces the edit-reload-screenshot loop with direct
manipulation; every future theme pack is authored with it. Dev-tool
posture: no PHI, no persistence of its own (clipboard out only), hidden
from end users behind the hotkey.

### Phase 3.5 — runtime net + review harness (deferred, designed-for)

- **Adaptive scrim**: run the analysis module at background load for
  operator-supplied images that arrive uncurated; auto-scale scrim/ink for
  the content column specifically. Curated values always win. This
  structurally prevents the ghost-text failure class (dark-mode ink over a
  light illustration) instead of fixing it per page.
- **Screenshot matrix**: a Playwright script capturing routes × backgrounds
  × mode/pageMode into a contact sheet — one command instead of hand-made
  screenshot sweeps.
- **Contrast auditor**: samples rendered text vs. effective backdrop on
  zone pages, flags WCAG failures — `/audit-theme`'s runtime sibling.

## Theme & Palette dialog restructure

New section order (both dialog and `/theming`, via shared `ThemeControls`):

1. **PRESET** — unchanged (Limestone / Tron / Vaporwave tiles).
2. **AMBIANCE BACKGROUND** — moved directly under Preset.
   - Row 1: None + image thumbnails (existing library).
   - Row 2: 8 solid earth-tone swatches, same selection semantics as
     images. Provisional values (tunable at review, not at implementation
     time): clay `#a67b5b`, sand `#d9c7a7`, terracotta `#b0674b`, moss
     `#6b7d5a`, sage `#a3b18a`, stone `#8d8578`, ochre `#c49a3c`, espresso
     `#4a3728`.
3. **BASIC THEME CONTROLS** (new group label) — Font · Mode · **Page Mode** ·
   Accent hue · **Card Surface**.
   - **Page Mode** renders next to Mode *only when background ≠ None*.
     Light/Dark toggle, persisted as `pageMode`.
   - **Card Surface** — three-button segmented control (Solid / Glass /
     Flat) with a live mini-preview.
4. **Advanced — per-field palette** — unchanged.

## DirectoryConsole polish (zone reference implementation)

- **Padding**: 200px side padding at the `xl` breakpoint (MUI standard
  1536px), stepping down to existing responsive values (`md: 5`, `xs: 2.5`)
  below. Applies in all `?align` placements.
- **Legibility scrim system**: soft column-wide canvas-fade behind the
  content column; stronger `--panel` backing behind census stats, result
  rows, ACTIVE chips, and small telemetry text ("UPLINK NOMINAL",
  "495 CONTACTS", "RETURN IN…") so all of it survives bright photos.
- **Params**: `?align` and `?page-theme` survive as dev/demo overrides; the
  persisted `pageMode` is the real control (URL param wins when present).
- Its overlay recipe is the source of the shared glass tokens (extraction is
  Phase 3; the polish itself must not wait on it).

## Phases / build order

1. **Theme & Palette dialog restructure + persistence axes** — dialog
   reorder, earth-tone row, Page Mode + Card Surface controls, `pageMode` /
   `cardSurface` / solid-background persistence. Includes the
   **curation-record library shape** and the **palette extraction /
   neutral-space analysis module** (used at curation time; its suggestions
   seed the default library's records). No page consumes the new axes yet
   beyond what already exists.
2. **DirectoryConsole polish** — `xl` padding, scrim/legibility pass,
   `pageMode` consumption (replacing its inline override with the shared
   helper when Phase 3 lands, inline until then).
3. **Zone plumbing** — `enableAmbiance` + `enableFluidInterface` flags
   through the route pipeline, StyledMainRouter conditional painting,
   `AmbianceZone` wrapper with theme-override net, `focus` metadata
   context/CSS-var exposure, shared glass/flat tokens extracted from
   DirectoryConsole, `Meteor.StyledCard` + `Meteor.StyledContainer`, the
   **Ambiance Tuning HUD** (Cmd/Ctrl+Shift+E), Ctrl+Shift+L graduation,
   the **card ↔ full-height revival** (flat-implies-one-page +
   Cmd/Ctrl+Shift+K per-route override), flag the two initial routes.
   **Acceptance: Glass and Flat toggles visibly work on cards on the
   `enableAmbiance` routes.**
3.5. **Runtime net + review harness (deferred, designed-for)** — adaptive
   scrim for uncurated images, Playwright screenshot matrix, contrast
   auditor (see Curation toolkit).
4. **Theme packs (future — seams only)** — a pack is a named macro over the
   axes above: `{ preset palette, font, ambiance background, cardSurface
   default, pageMode default }`, delivered via `settings.public.theme.packs`
   (the settings-driven `backgroundLibrary` proves the pattern), selectable
   per patient later. Medical illustration and patient-education content
   integration follow the same seam. Packs are authored with the Tuning
   HUD + analysis module. Nothing in Phases 1–3 blocks this.

## Scope guardrails

- Phase 3 tokens activate **only on flagged routes**; the flag list starts
  at two pages. No app-wide restyling.
- Unflagged routes must render pixel-identical to today (except no longer
  leaking the ambiance photo through canvas gaps).
- No mass migration of existing cards to StyledCard; opportunistic only.
- Printing always uses the light theme (existing rule); ambiance
  images/solids and glass/flat surfaces must not survive into print — the
  existing `@media print` global block plus the zone override deferring to
  `createDynamicTheme('light')` cover this; verify during Phase 3.

## Error handling & testing

- **Graceful degradation**: `Meteor.StyledCard || MuiCard` idiom; zone
  wrapper no-ops when background is None; missing/invalid background values
  fall back to no ambiance (never a broken image over content).
- **Persistence robustness**: unknown `cardSurface`/`pageMode` values in
  localStorage are treated as unset (forward/backward compat).
- **E2E**: existing Nightwatch suites must pass untouched on unflagged
  routes (the pixel-identity guarantee). New coverage: dialog controls
  persist across reload; DirectoryConsole renders legibly with a bright
  ambiance + `pageMode` both ways; Ctrl+Shift+L cycles surfaces.
- **Theme audit**: run `/audit-theme` and `/audit-print` after Phases 2–3.

## Out of scope

- Theme pack authoring/selection UI (Phase 4 seam only)
- Medical illustration assets and patient-education content
- Migrating existing pages beyond the two initial zone routes
- AR/spatial interfaces beyond the glass visual language
