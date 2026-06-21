# Post Tool Use Hook: Theme Consistency Check

## Trigger
After any Edit or Write operation to `.jsx` files in `/imports/ui/`, `/imports/ui-fhir/`, `/packages/`, or `/npmPackages/`

## Purpose
Ensure consistent light/dark mode theming by detecting **unconditional** hardcoded colors, direct settings reads, inline styles, and spacing that won't adapt to theme changes.

## Theme Architecture (post-fix, 2026-06-11)

`CustomThemeProvider` (`imports/ui/App.jsx`) is the **single palette authority**: `getThemeSetting()` sanitizes all settings color values at ingestion (strips legacy `!important`), the MUI theme rebuilds on toggle, and `StyledMainRouter` consumes `palette.background.default`. **MUI theme tokens are reliable** — `'background.paper'`, `'text.primary'`, `'divider'`, `theme.palette.mode` all track the toggle correctly.

Two acceptable patterns:

```jsx
// PREFERRED for new code — tokens
sx={{ bgcolor: 'background.paper', color: 'text.primary' }}

// SUPPORTED — isDark conditionals (large legacy footprint; also mode-state access)
const isDark = (Meteor.useTheme ? Meteor.useTheme() : { theme: 'light' }).theme === 'dark';
sx={{ bgcolor: isDark ? '#1e1e1e' : '#ffffff' }}
```

**Theme Files:**
- `imports/ui/App.jsx` — `getThemeSetting()` (~line 1430), `CustomThemeProvider`, `StyledMainRouter`
- `settings/settings.honeycomb.localhost.json` — light-oriented palette
- `settings/settings.honeycomb.dicom.localhost.json` — dark-oriented palette (darkMode: true)

**Standard Values** (for isDark conditionals and overrides):

| Surface | Light | Dark |
|---------|-------|------|
| Page canvas | #f6f6f6 | #121212 |
| Card / paper | #ffffff | #1e1e1e |
| Inset / table head | #f5f5f5 | #2a2a2a |
| Primary text | rgba(0,0,0,0.87) | rgba(255,255,255,0.87) |
| Borders | rgba(0,0,0,0.12) | rgba(255,255,255,0.12) |

## Detection Patterns

### 1. Unconditional Hardcoded Colors (the real bug)

```bash
grep -n "color: ['\"]#\|backgroundColor: ['\"]#\|borderColor: ['\"]#\|bgcolor: ['\"]#" "$CHANGED_FILE" | grep -v "isDark\|palette.mode"
```

Catches color literals NOT guarded by a mode conditional:
- `color: '#000000'`
- `backgroundColor: '#ffffff'`

Does NOT catch (both correct):
- `bgcolor: isDark ? '#1e1e1e' : '#ffffff'`
- `bgcolor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5'`

### 2. Unconditional RGB/RGBA and Named Colors

```bash
grep -n "color: ['\"]rgb\|backgroundColor: ['\"]rgb\|bgcolor: ['\"]rgb" "$CHANGED_FILE" | grep -v "isDark\|palette.mode"
grep -n "color: ['\"]black\|color: ['\"]white\|backgroundColor: ['\"]white\|backgroundColor: ['\"]black" "$CHANGED_FILE" | grep -v "isDark\|palette.mode"
```

### 3. Direct Settings Color Reads in Components

```bash
grep -n "settings.public.theme.palette" "$CHANGED_FILE"
```

Only `CustomThemeProvider` (App.jsx) legitimately reads these. Components must consume the theme (tokens or `Meteor.useTheme()`).

### 4. Inline Style Instead of sx

```bash
grep -n "style={{.*color:\|style={{.*backgroundColor:" "$CHANGED_FILE"
```

### 5. Hardcoded Pixel Spacing

```bash
grep -n "padding: ['\"][0-9]\|margin: ['\"][0-9]\|sx={{ p: '[0-9]\|sx={{ m: '[0-9]" "$CHANGED_FILE"
```

### 6. Hardcoded Font Sizes

```bash
grep -n "fontSize: ['\"][0-9]\|fontSize: {.*px" "$CHANGED_FILE"
```

### 7. `!important` in Color Values

```bash
grep -n "!important" "$CHANGED_FILE"
```

Never add these — the sanitizer strips them defensively from settings, but they must not appear in component code or new settings entries.

## Action When Detected

**❌ CRITICAL** — Unconditional hardcoded colors:
```
❌ Theme Violation in ObservationsPage.jsx

Line 45: backgroundColor: '#f5f5f5'
Line 67: color: 'black'

🚨 These colors are locked to one mode!

FIXES (tokens preferred):
  Line 45: backgroundColor: 'background.default'   // or isDark ? '#2a2a2a' : '#f5f5f5'
  Line 67: color: 'text.primary'

Should I fix these? [yes/no]
```

**❌ CRITICAL** — Direct settings read:
```
❌ Settings Read in ConditionsTable.jsx

Line 32: get(Meteor, 'settings.public.theme.palette.cardColor')

🚨 Components must consume the theme, not raw settings (single-authority rule).

FIX: bgcolor: 'background.paper'

Should I fix this? [yes/no]
```

**⚠️ WARNING** — Inline styles: suggest sx with a token.
**💡 SUGGEST** — Pixel spacing → `p: 2` shorthand; fontSize → Typography variant.

## Skip Conditions

Do NOT flag:
- Color literals inside `isDark` or `theme.palette.mode` conditionals
- Variables derived from those conditionals (`cardBgColor`, `textPrimary`, etc.)
- Theme tokens (`'background.paper'`, `'primary.main'`, ...)
- `imports/ui/App.jsx` theme-definition code (`getThemeSetting`, `createDynamicTheme`)
- Comments, display-text string literals, className attributes
- CSS files, test files (.test.jsx/.spec.jsx), Storybook files
- Image paths/URLs mentioning colors

## Auto-Fix Option

If user approves:

1. **Surface colors → tokens**: `'#ffffff'`→`'background.paper'`, `'#f6f6f6'`→`'background.default'`, `'#000000'`/`'black'` text→`'text.primary'`, border rgba→`'divider'`
2. **Mode-specific values with no token equivalent** → `isDark ? darkValue : lightValue` (add the `Meteor.useTheme()` boilerplate if the component lacks it)
3. **Settings reads** → matching token
4. **Inline style → sx**; **pixel spacing → shorthand**; **fontSize → variant**
5. **Strip `!important`** from any color value

## Integration

Runs automatically after Edit/Write to UI files. Zero cost (grep), prevents dark-mode regressions, enforces the single-palette-authority rule.

---

Reference: `.claude/rules/ui/theming.md` (canonical), `imports/ui/App.jsx`, `packages/CLAUDE.md` § Dark Theming Pattern (legacy recipes)
