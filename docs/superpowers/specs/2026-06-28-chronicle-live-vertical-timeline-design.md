# Chronicle Live Vertical Timeline — Design

**Date:** 2026-06-28
**Status:** Approved (design), pending implementation plan

## Goal

On the `/chronicle` page (Chronicle Workstation):

1. Swap the **Patient Directory** and **Vertical Timeline** columns.
2. Replace the **Vertical Timeline** launch card with a **live, interactive timeline** —
   the same timeline shown at `/timeline-vertical`, but **without the filtering and
   sorting controls**.

The full `/timeline-vertical` page must remain visually and behaviorally unchanged.

## Context

- `/chronicle` is rendered by `extensions/chronicle/client/ChronicleWorkstationPage.jsx`
  (package `@orbital/chronicle`). It is a 12-column MUI Grid v2 split `2 / 6 / 2 / 2`
  ("Star Trek medbay layout") of quick-launch cards. Region assignments live in a
  `REGION` map; each region renders one `LAUNCH_CARDS` entry via `renderCard()`.
  Cards are `CardActionArea`s that `navigate()` to their `to` route.
  - Left rail (`md={2}`): Patient Directory → `/patient-directory`
  - Center (`md={6}`, two stacked panels): Clinical Story, Timeline Sidescroll
  - Right rail 1 (`md={2}`): Vertical Timeline → `/timeline-vertical`
  - Right rail 2 (`md={2}`): Filters → `/filters`

- `/timeline-vertical` is rendered by `extensions/timelines/client/TimelinePage.jsx`
  (package `@orbital/timelines`). A single component that:
  - late-binds `FhirUtilities`, `Meteor.useTheme`, and 15 FHIR collections via `Meteor.startup`;
  - fetches all 15 collections for the selected patient with `useTracker`;
  - merges them into `entries`, sorts newest-first, computes per-type counts;
  - renders a **filter panel** (left, `enabledTypes` / `showDateTime` / `transparentAlerts`
    state + per-type toggles + All/None/Glass/Date/DateTime buttons) and the
    **timeline list** (right: vertical line, dots, expandable `Alert` rows). Row expand
    state is stored in the `timelineExpandedEntries` Session key.

- `@orbital/chronicle` does **not** currently depend on `@orbital/timelines`. Both are
  `extensions/*` packages (gitignored nested repos), symlinked into `node_modules` by the
  root workspace and loaded via `EXTRA_WORKFLOWS`. Cross-package import resolves by package
  name through the node_modules symlink.

## Decisions

- **Card behavior:** Live & interactive. The card renders the real timeline list (all
  resource types, newest-first), scrollable, with rows still expandable to JSON. The card
  no longer navigates on click (no `CardActionArea`); only the rows are interactive.
- **Code sharing:** Extract & reuse (DRY). Pull the timeline rendering into shared modules
  exported from `@orbital/timelines`, and refactor `TimelinePage` to consume them so there
  is one source of truth.

## Architecture

### New modules in `@orbital/timelines` (`extensions/timelines/client/`)

1. **`timelineHelpers.js`** — pure functions moved verbatim out of `TimelinePage.jsx`:
   `RESOURCE_TYPES`, `getResourceDate`, `getResourceEmoji`, `getResourceAlertSeverity`,
   `getResourceSummary`. No Meteor dependencies.

2. **`useTimelineEntries.js`** — a hook owning the data layer:
   - late-binds collections + `FhirUtilities` (same `Meteor.startup` pattern as today);
   - runs the 15 `useTracker` collection fetches for the selected patient;
   - merges into `entries`, sorts newest-first, computes `typeCounts`;
   - returns `{ entries, typeCounts, selectedPatient }`.

3. **`VerticalTimelineList.jsx`** — presentational component. Props:
   `entries`, `showDateTime` (default `false`), `transparentAlerts` (default `true`).
   Renders the vertical line, dots, and expandable `Alert` rows — the exact JSX currently
   at `TimelinePage.jsx` lines 587–702. Owns its own `Meteor.useTheme`/`isDark`. Expand
   uses the existing `timelineExpandedEntries` Session key + `toggleEntry`. Renders the
   "no entries match" info alert when `entries` is empty.

4. **`VerticalTimeline.jsx`** — zero-config embeddable wrapper. Calls `useTimelineEntries()`,
   shows all resource types, handles the no-patient and empty-data states, and renders
   `VerticalTimelineList`. This is what the Chronicle card mounts.

### Refactor `TimelinePage.jsx` (behavior unchanged)

- Import helpers from `timelineHelpers.js`, data from `useTimelineEntries()`, and
  `VerticalTimelineList`.
- Keep the filter-panel UI and `enabledTypes` / `showDateTime` / `transparentAlerts` state.
- Derive `filteredEntries` from `entries` + `enabledTypes`.
- Render `<VerticalTimelineList entries={filteredEntries} showDateTime={showDateTime}
  transparentAlerts={transparentAlerts} />` in the right column.
- Preserve the existing no-patient and empty-data early returns.

### Wire-up

- `extensions/timelines/client.js` — export `VerticalTimeline` (and `VerticalTimelineList`,
  `useTimelineEntries` for completeness).
- `extensions/chronicle/package.json` — add `"@orbital/timelines"` to `dependencies`
  (already symlinked via workspaces; run `npm install` to confirm).
- `extensions/chronicle/client/ChronicleWorkstationPage.jsx`:
  - Swap `REGION.leftRail` ↔ `REGION.rightRail1` (Vertical Timeline to left rail, Patient
    Directory to right rail 1; both remain `md={2}`).
  - Special-case the `timeline-vertical` card in rendering: instead of the `CardActionArea`
    launcher, render a plain `Card` with the title/icon header and a scrollable
    `<VerticalTimeline />` in its content area (the content area already has
    `overflow: 'auto'`). No card-level navigation.

## Data flow

```
useTimelineEntries()  ──>  { entries, typeCounts, selectedPatient }
        │                          │
        │                          ├─ TimelinePage: filter panel + filteredEntries
        │                          │     └─ VerticalTimelineList(filteredEntries)
        │
        └─ VerticalTimeline (wrapper): all entries
              └─ VerticalTimelineList(entries)   ←  mounted by Chronicle card
```

## Edge cases / states

- **No patient selected:** `VerticalTimeline` shows a compact "no patient" message in the
  card; `TimelinePage` keeps its existing full-page warning. Patient Directory card retains
  its existing disabled/"select a patient" treatment (it stays a launcher).
- **No clinical data:** wrapper shows the existing "No clinical events found" info alert.
- **Narrow rail:** the left rail is `md={2}` (~16% width); rows are compact and ellipsized,
  consistent with a "chronological event stream". Width is intentionally unchanged.

## Verification

This codebase verifies UI via Nightwatch/manual, not unit tests. Verify by running the app
and confirming:
1. `/chronicle` shows Vertical Timeline in the left rail and Patient Directory in right rail 1.
2. With a patient selected, the left-rail card renders the live timeline; rows expand on click;
   the card itself does not navigate.
3. `/timeline-vertical` is unchanged (filter panel works; list renders identically).

## Out of scope

- Widening or restyling the rail beyond what the swap implies.
- Changing the Patient Directory card (stays a launcher).
- Any change to the filter panel's behavior on the full page.
