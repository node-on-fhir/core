# Layout Patterns: Greedy-Height Panels

## The term

**"Greedy height"** is a term of art in this project. When we say a panel or page
should be "greedy height", we mean **the `/import-data` behavior**: the panel
fills essentially the full viewport height — minus header and footer, with its own
padding — and adapts automatically when the prominent header is showing. The
canonical example is `npmPackages/data-importer/client/DataImportPage.jsx`; load
`/import-data` to see it live.

## How it actually works (flexbox cascade, not viewport math)

There is no `calc(100vh - …)` involved for in-flow pages. The height flows down a
flex chain that starts at the app root:

```jsx
// imports/ui/App.jsx (~1676-1699)
<div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
  <Header />                                   {/* in-flow row: 64px, or 128px prominent */}
  <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
    <StyledMainRouter style={{ flex: 1 }} />   {/* ← your page gets a BOUNDED height */}
  </Box>
  <Footer />                                    {/* in-flow row: 64px */}
</div>
```

Because header/footer are in-flow flex siblings, the router area is already
"viewport minus chrome". A greedy page just claims it:

```jsx
// Page root — claim the router's bounded height
<Box sx={{
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
}}>
  {/* Fixed-size rows (page header, tab bar, toolbars) */}
  <Box sx={{ flexShrink: 0 }}>…</Box>

  {/* The greedy region */}
  <Box sx={{
    flex: 1,        // take all remaining height
    minHeight: 0,   // ← load-bearing! see below
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  }}>
    {/* Innermost scrollable content */}
    <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>…</Box>
  </Box>
</Box>
```

### `minHeight: 0` is load-bearing

Flex items default to `min-height: auto`, which forbids shrinking below content
size — without `minHeight: 0`, a tall child blows the panel out past the viewport
and the whole page scrolls instead of the inner region. Every `flex: 1` level of
the cascade that contains variable-size content needs it.

### Prominent-header awareness is automatic

`settings.public.defaults.prominentHeader` + a selected patient grows the header
from 64px to 128px (`imports/ui/Header.jsx`). Since the header is an in-flow flex
sibling, greedy panels shrink automatically. **No page-side handling needed.**

## When you DO need the CSS variables

`App.jsx` (~1543-1550) maintains CSS vars for elements that are **outside the flex
flow** — MUI Dialog portals, `position: fixed` overlays:

```css
--header-height      /* 64px, 128px prominent, 0 when navbars hidden */
--footer-height      /* 64px, or 0 */
--total-nav-height   /* sum of both */
```

```jsx
// e.g. capping a Dialog under the app chrome
PaperProps={{ sx: { maxHeight: 'calc(100vh - var(--total-nav-height, 128px) - 48px)' } }}
```

Use the vars **only** for out-of-flow elements. For in-flow panels, use the flex
cascade — it handles navbar-hiding and prominent-header changes without calc math.

## Status: not extracted (yet)

There is **no shared `GreedyPanel` component or hook** — the pattern is replicated
ad-hoc in:

- `npmPackages/data-importer/client/DataImportPage.jsx` (canonical; `TabPanel` at ~45-48, root at ~85-92)
- `extensions/data-exporter/client/ExportPageNew.jsx` (~95-162)
- `imports/ui/ExternalContentPage.jsx`
- `extensions/orbital/client/lunar-homepage/LunarHomepage.jsx`

If you're adding another one, follow the recipe above; if the copy count keeps
growing, extracting a shared wrapper is a reasonable refactor (update this doc if
you do).

## Anti-Patterns

```jsx
// ❌ Raw viewport math for an in-flow panel — ignores prominent header,
//    navbar hiding, and future chrome changes
<Box sx={{ height: window.innerHeight - 300 }} />          // EditorPage.jsx legacy
<Box sx={{ height: 'calc(100vh - 128px)' }} />             // hardcoded chrome guess

// ❌ Forgetting minHeight: 0 — page scrolls instead of the inner region
<Box sx={{ flex: 1, overflow: 'hidden' }}>                  // needs minHeight: 0
  <TallContent />
</Box>

// ❌ 100vh inside the router — double-counts the chrome
<Box sx={{ height: '100vh' }} />                            // use height: '100%'
```

## Related

- File: `imports/ui/App.jsx` — root cascade + CSS variable maintenance
- Rule: `rules/ui/responsive.md` — breakpoints & responsive sizing
- Rule: `rules/ui/material-ui.md` — MUI component patterns
- Canonical example: `npmPackages/data-importer/client/DataImportPage.jsx` (`/import-data`)
