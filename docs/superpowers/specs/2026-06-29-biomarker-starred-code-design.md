# Biomarker Charting — Star/Feature a Code

Date: 2026-06-29
Route: `/biomarkers-charting`
File: `imports/ui-modules/BiomarkerChartingPage.jsx` (single-file change)

## Goal

Let the user "star" exactly one Observation Code in the **Discovered Observation
Codes** table. The starred biomarker's chart is auto-added to the right column,
floated to the top, and visually demarcated.

## Behavior

### State
- `const [starredCode, setStarredCode] = useState(null)` — the starred row's key
  (`code || text`). Local state, not persisted (matches existing `selectedCodes`).
- A single scalar enforces "only one starred at a time".

### Left table — new Star column (leftmost)
- Narrow leading column. Header: small `StarBorderIcon` with tooltip
  ("Feature a biomarker").
- Each row: `IconButton` showing filled `StarIcon` in `primary.main` when starred,
  outline `StarBorderIcon` otherwise.
- Star is **enabled only on chartable rows** (`latestValue !== null && count >= 2`).
  Non-chartable rows show a disabled star + tooltip ("Needs 2+ measurements to
  chart").

### Star toggle (`handleStarToggle(codeKey)`)
- Star a new (unstarred, chartable) row:
  - `setStarredCode(codeKey)`
  - ensure charted: add to `selectedCodes` if absent
  - `userHasCustomizedCodes.current = true` (prevent auto-select clobber)
- Click the already-starred row: unstar (`setStarredCode(null)`). It **remains** in
  `selectedCodes` (chart stays, just no longer featured).

### Right column — promote + demarcate
- `orderedChartData = useMemo(...)`: take `chartData`, move the entry whose
  `code === starredCode` to index 0 (otherwise stable). Deps `[chartData, starredCode]`.
- Render `orderedChartData` instead of `chartData`.
- Starred card (`isStarred = data.code === starredCode`):
  - `2px solid` `primary.main` border
  - filled `StarIcon` (primary color) prepended to the `CardHeader` title
  - chart layout otherwise unchanged.

### Imports
- Add `Star` and `StarBorder` from `@mui/icons-material`.

## Out of scope (YAGNI)
- Persistence across navigation
- Multiple stars
- Reflecting the star into the Settings dialog chips
