# Material-UI Theming Patterns

## Core Principle (post-fix, 2026-06-11)

**MUI theme tokens are reliable. Use them for new code.**

`CustomThemeProvider` (`imports/ui/App.jsx`) is the **single palette
authority**: it sanitizes all settings color values at ingestion
(`getThemeSetting()` strips legacy `!important` adornments), rebuilds the MUI
theme on every mode toggle, and `StyledMainRouter` consumes
`muiTheme.palette.background.default` rather than re-deriving colors from
settings. Tokens like `'background.paper'`, `'text.primary'`, `'divider'`,
and `theme.palette.mode` now track the toggle correctly in both modes.

> **History**: from 2026-06-10 to 2026-06-11 the codebase carried a "Golden
> Rule" mandating `Meteor.useTheme()` + `isDark` with explicit colors,
> because settings files injected values like `"#ffffff !important"` into the
> palette — invalid CSS that silently dropped. The root cause was fixed at
> ingestion; the workaround is no longer required.

## Preferred Pattern (new code)

```javascript
// Theme tokens — mode-agnostic, no boilerplate
<Card sx={{
  bgcolor: 'background.paper',
  color: 'text.primary',
  borderColor: 'divider'
}} />

// Mode-specific values when genuinely needed
<Paper sx={theme => ({
  bgcolor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5'
})} />
```

## Legacy Pattern (fully supported — no mass rewrite)

A large footprint of components uses `Meteor.useTheme()` + `isDark` with
explicit colors. This continues to work (explicit conditionals are unaffected
by the provider fix) and remains the way to read/toggle **app-level mode
state**:

```javascript
const appTheme = Meteor.useTheme ? Meteor.useTheme() : { theme: 'light' };
const isDark = appTheme.theme === 'dark';
const { toggleTheme } = Meteor.useTheme();   // mode switching
```

Retire `isDark` color boilerplate opportunistically when touching a file —
don't refactor for its own sake.

## Common Theme Tokens

```javascript
// Background
'background.default'    // Page canvas (#f6f6f6 light, #121212 dark, settings-driven via canvasColor)
'background.paper'      // Cards/surfaces (#ffffff light, #1e1e1e dark, settings-driven via paperColor/cardColor)

// Text
'text.primary'
'text.secondary'
'text.disabled'

// Brand / status (settings-driven, mode-independent)
'primary.main'  'secondary.main'
'error.main'  'warning.main'  'info.main'  'success.main'

// Custom Honeycomb palette
'appbar.main'  'appbar.contrastText'

// Other
'divider'  'action.hover'  'action.selected'
```

### Spacing & Typography (unchanged)

```javascript
sx={{ p: 2, m: 3, px: 4, gap: 1 }}        // 8px scale
<Typography variant="h5">Title</Typography> // variants, not fontSize
sx={{ width: { xs: '100%', md: '50%' } }}   // responsive breakpoints
```

## Rules That Still Apply

1. **No `!important` in settings color values.** The sanitizer strips them
   defensively, but do not add new ones.
2. **Don't read `settings.public.theme.palette.*` directly in components.**
   Consume the theme (tokens or `useTheme`). The provider is the only
   legitimate reader. (Legacy direct reads exist in Header/Footer/DICOM
   pages — migrate opportunistically.)
3. **Root page containers should not set page-level bgcolor** —
   `StyledMainRouter` paints `background.default` for every page.
4. **No unconditional hardcoded surface colors** — `bgcolor: '#ffffff'`
   without a mode conditional breaks dark mode exactly like it always did.
   Use a token, or `isDark ? dark : light`.

## Anti-Patterns

### ❌ Unconditional hardcoded colors
```javascript
<Box sx={{ backgroundColor: '#ffffff', color: '#000000' }} />
<div style={{ color: '#333' }}>Text</div>
```

### ❌ Reading settings colors in components
```javascript
const color = get(Meteor, 'settings.public.theme.palette.cardColor');
```

### ❌ Hardcoded spacing
```javascript
<Box sx={{ padding: '16px' }} />   // use p: 2
```

### ✅ Tokens (preferred) or isDark conditionals (supported)
```javascript
<Box sx={{ bgcolor: 'background.paper', color: 'text.primary' }} />
<Box sx={{ bgcolor: isDark ? '#1e1e1e' : '#ffffff' }} />
```

## Settings-Driven Themes

Settings files live in **`settings/`** (e.g.
`settings/settings.honeycomb.localhost.json` — note: some docs historically
said `configs/`). The provider reads these keys, all sanitized:

| Settings key | Feeds |
|--------------|-------|
| `canvasColor` (legacy) / `backgroundCanvas` / `backgroundCanvasDark` / `backgroundPageColor*` | `background.default` |
| `paperColor` / `paperColorDark` / `paperColorLight` | `background.paper`, MuiDrawer |
| `cardColor` / `cardColorDark` / `cardColorLight` | MuiCard override |
| `primaryColor` / `secondaryColor` / `errorColor` | brand palette |
| `appBarColor(*Dark)` / `appBarTextColor(*Dark)` | `appbar.*`, MuiAppBar |
| `darkMode` / `palette.mode` | initial mode + generic-value orientation |

Unsuffixed generic values (`canvasColor`, `paperColor`, `cardColor`) belong
to the mode the settings file was authored for (`darkMode: true` → they are
dark values) and are not applied to the opposite mode on toggle.

## Automatic Checking

### Hook (Automatic)
`.claude/hooks/post-tool-use-theme.md` — flags unconditional hardcoded
colors and direct settings reads after every file edit

### Command (Manual)
`/audit-theme` — scan entire codebase

## Related

- File: `imports/ui/App.jsx` — `getThemeSetting()` (~line 1430),
  `CustomThemeProvider` / `createDynamicTheme` (~1440+), `StyledMainRouter`
- Legacy recipes: `packages/CLAUDE.md` § Dark Theming Pattern (the isDark
  era — still valid for maintaining existing components)
- Agent: `theme-auditor` · Command: `.claude/commands/audit-theme.md`
- Backlog: `FABLE-TECH-DEBT-PAYDOWN.md` § P1 theming (root fix DONE
  2026-06-11; boilerplate retirement remains opportunistic)
