# Material-UI Theming Patterns

## Core Principle (The Golden Rule)

**Use `Meteor.useTheme()` + `isDark` with explicit colors for all mode-dependent styling.**

**NEVER rely on `theme.palette.mode`, `theme.palette.grey[X]`, or surface tokens like `'background.paper'` / `'text.primary'` for dark-mode adaptation.**

Honeycomb uses a custom theme system (`Meteor.useTheme`, defined in `imports/ui/App.jsx`) layered on top of Material-UI. While `CustomThemeProvider` rebuilds the MUI theme on toggle, settings files inject hardcoded palette values (some with `!important` flags, e.g. `"cardColor": "#ffffff !important"`) into MUI tokens. Components that rely on MUI surface tokens render with white backgrounds and unreadable text in dark mode.

This rule is canonical across the codebase: core UI (`imports/`), Atmosphere packages (`packages/`), and NPM workflow packages (`npmPackages/`). It matches `packages/CLAUDE.md` ("Dark Theming Pattern"), which is the authoritative reference with the full recipe set (Cards, Alerts, Paper, TextFields).

## The Canonical Pattern

```javascript
import { get } from 'lodash';

// Get theme hook from Honeycomb's Meteor object (assigned in App.jsx)
let useAppTheme;
Meteor.startup(function(){
  useAppTheme = Meteor.useTheme;
});

function MyPage() {
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Theme-aware colors via conditional logic
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';

  return (
    <Card sx={{
      bgcolor: cardBgColor,
      color: cardTextColor,
      // Use nested selectors to style MUI children at once
      '& .MuiTableCell-root': {
        color: cardTextColor,
        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
      },
      '& .MuiInputLabel-root': { color: cardTextColor }
    }}>
      Content
    </Card>
  );
}
```

## Standard Color Values

| Surface | Light Mode | Dark Mode |
|---------|------------|-----------|
| Page canvas | `#f6f6f6` | `#121212` |
| Card / paper | `#ffffff` | `#1e1e1e` |
| Inset paper / table head | `#f5f5f5` | `#2a2a2a` |
| Primary text | `rgba(0, 0, 0, 0.87)` | `rgba(255, 255, 255, 0.87)` |
| Secondary text | `rgba(0, 0, 0, 0.6)` | `rgba(255, 255, 255, 0.6)` |
| Borders / dividers | `rgba(0, 0, 0, 0.12)` | `rgba(255, 255, 255, 0.12)` |
| Input outlines | `rgba(0, 0, 0, 0.23)` | `rgba(255, 255, 255, 0.23)` |

## What's Still OK to Use from MUI

These are mode-independent or settings-driven and remain safe:

```javascript
// Brand/status palette colors (set from settings for both modes)
color: 'primary'                  // On MUI components
bgcolor: 'primary.main'
bgcolor: 'error.main'             // Status colors: error, warning, success, info

// Spacing shorthand (unaffected by theme mode)
sx={{ p: 2, m: 3, px: 4, gap: 1 }}   // 8px scale

// Typography variants (instead of hardcoded fontSize)
<Typography variant="h5">Title</Typography>

// Responsive breakpoints
sx={{ width: { xs: '100%', md: '50%' } }}
```

## Root Page Containers: No bgcolor

`StyledMainRouter` in App.jsx sets inline `style.background`, which overrides `sx={{ bgcolor }}` via CSS specificity. Let the parent handle page backgrounds:

```javascript
// ✅ CORRECT - root page container
export default function MyPage() {
  return (
    <Box sx={{ minHeight: '100vh', py: 4 }}>
      {/* content */}
    </Box>
  );
}

// ❌ WRONG - bgcolor on root container (conflicts with StyledMainRouter)
<Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
```

## Anti-Patterns

### ❌ MUI mode detection
```javascript
// WRONG - MUI palette doesn't reliably reflect Honeycomb's theme state
sx={theme => ({
  bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50]
})}
```

### ❌ Surface tokens for mode adaptation
```javascript
// WRONG - settings values (with !important) leak into these tokens
<Box sx={{ backgroundColor: 'background.paper', color: 'text.primary' }} />
```

### ❌ Unconditional hardcoded colors
```javascript
// WRONG - locked to one mode, breaks in the other
<Box sx={{ backgroundColor: '#ffffff', color: '#000000' }} />
<div style={{ color: '#333' }}>Text</div>
```

### ❌ Reading colors from settings on the client
```javascript
// WRONG - settings palette values are hardcoded for one mode
const color = get(Meteor, 'settings.public.theme.palette.cardColor');
```

### ✅ Conditional explicit colors
```javascript
// CORRECT
const isDark = appTheme.theme === 'dark';
<Box sx={{
  backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
  color: isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)'
}} />
```

### ❌ Hardcoded spacing
```javascript
// WRONG
<Box sx={{ padding: '16px', margin: '24px' }} />
```

### ✅ Theme spacing
```javascript
// CORRECT
<Box sx={{ p: 2, m: 3 }} />
```

## Component Recipes

For complete dark-mode recipes (Alert severity colors, Paper backgrounds, TextField nested selectors, CardHeader subheaders, TablePagination), see the **"Dark Theming Pattern"** section of `packages/CLAUDE.md` — it is the authoritative reference.

## Settings-Driven Themes

Themes are configured in settings files; the `CustomThemeProvider` in `imports/ui/App.jsx` reads them at startup:

**Light Mode** (`configs/settings.honeycomb.localhost.json`):
```json
{
  "public": {
    "theme": {
      "palette": {
        "primaryColor": "rgb(108, 183, 110)",
        "canvasColor": "#f6f6f6",
        "cardColor": "#ffffff !important"
      }
    }
  }
}
```

**Dark Mode** (`configs/settings.honeycomb.dicom.localhost.json`):
```json
{
  "public": {
    "theme": {
      "darkMode": true,
      "palette": {
        "mode": "dark",
        "primaryColor": "rgb(163, 153, 163)",
        "canvasColor": "#121212",
        "cardColor": "#1e1e1e !important"
      }
    }
  }
}
```

These values seed the initial mode and brand colors. Do **not** read them directly in components — use the `isDark` pattern instead.

## Automatic Checking

### Hook (Automatic)
`.claude/hooks/post-tool-use-theme.md` - Runs after every file edit; flags *unconditional* hardcoded colors (not paired with `isDark`)

### Command (Manual)
`/audit-theme` - Scan entire codebase

## Related

- **Authoritative recipes**: `packages/CLAUDE.md` § Dark Theming Pattern
- Agent: `theme-auditor` - Theme compliance auditing
- Hook: `.claude/hooks/post-tool-use-theme.md` - Automatic detection
- Command: `.claude/commands/audit-theme.md` - Manual scanning
- File: `imports/ui/App.jsx` - `CustomThemeProvider`, `Meteor.useTheme` assignment (~line 1417)
