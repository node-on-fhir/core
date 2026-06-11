# Post Tool Use Hook: Theme Consistency Check

## Trigger
After any Edit or Write operation to `.jsx` files in `/imports/ui/`, `/imports/ui-fhir/`, `/packages/`, or `/npmPackages/`

## Purpose
Ensure consistent light/dark mode theming by detecting **unconditional** hardcoded colors (not paired with an `isDark` conditional), MUI surface-token usage, inline styles, and spacing that won't adapt to theme changes.

## Theme Architecture (The Golden Rule)

Honeycomb uses a **custom theme system** (`Meteor.useTheme`, assigned in `imports/ui/App.jsx`) layered on top of Material-UI. Settings files inject hardcoded palette values (some with `!important`) into MUI tokens, so MUI surface tokens (`'background.paper'`, `'text.primary'`) and `theme.palette.mode` do NOT reliably reflect the active mode.

**The correct pattern everywhere** (core UI, `packages/`, `npmPackages/`):

```jsx
const appTheme = Meteor.useTheme ? Meteor.useTheme() : { theme: 'light' };
const isDark = appTheme.theme === 'dark';

sx={{
  bgcolor: isDark ? '#1e1e1e' : '#ffffff',
  color: isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)'
}}
```

**Theme Files:**
- `imports/ui/App.jsx` - `CustomThemeProvider`, `Meteor.useTheme` (~line 1417)
- `configs/settings.honeycomb.localhost.json` - Light mode palette
- `configs/settings.honeycomb.dicom.localhost.json` - Dark mode palette (darkMode: true)

**Standard Values:**

| Surface | Light | Dark |
|---------|-------|------|
| Page canvas | #f6f6f6 | #121212 |
| Card / paper | #ffffff | #1e1e1e |
| Inset / table head | #f5f5f5 | #2a2a2a |
| Primary text | rgba(0,0,0,0.87) | rgba(255,255,255,0.87) |
| Borders | rgba(0,0,0,0.12) | rgba(255,255,255,0.12) |

## Detection Patterns

### 1. Unconditional Hardcoded Colors

```bash
grep -n "color: ['\"]#\|backgroundColor: ['\"]#\|borderColor: ['\"]#\|bgcolor: ['\"]#" "$CHANGED_FILE" | grep -v "isDark"
```

Catches color literals NOT on an `isDark` conditional line:
- `color: '#000000'`
- `backgroundColor: '#ffffff'`

Does NOT catch (correct pattern):
- `bgcolor: isDark ? '#1e1e1e' : '#ffffff'`

### 2. Unconditional RGB/RGBA Colors

```bash
grep -n "color: ['\"]rgb\|backgroundColor: ['\"]rgb\|bgcolor: ['\"]rgb" "$CHANGED_FILE" | grep -v "isDark"
```

### 3. Hardcoded Named Colors

```bash
grep -n "color: ['\"]black\|color: ['\"]white\|backgroundColor: ['\"]white\|backgroundColor: ['\"]black" "$CHANGED_FILE" | grep -v "isDark"
```

### 4. MUI Surface Tokens / Mode Detection (Golden Rule violations)

```bash
grep -n "'background.paper'\|'background.default'\|'text.primary'\|'text.secondary'\|theme.palette.mode\|palette.grey\[" "$CHANGED_FILE"
```

Catches:
- `backgroundColor: 'background.paper'` (renders white in dark mode)
- `theme.palette.mode === 'dark'` (doesn't reflect Honeycomb theme state)
- `theme.palette.grey[900]`

### 5. Inline Style Instead of sx

```bash
grep -n "style={{.*color:\|style={{.*backgroundColor:" "$CHANGED_FILE"
```

### 6. Hardcoded Pixel Spacing

```bash
grep -n "padding: ['\"][0-9]\|margin: ['\"][0-9]\|sx={{ p: '[0-9]\|sx={{ m: '[0-9]" "$CHANGED_FILE"
```

### 7. Hardcoded Font Sizes

```bash
grep -n "fontSize: ['\"][0-9]\|fontSize: {.*px" "$CHANGED_FILE"
```

## Action When Detected

Display warning categorized by severity:

**❌ CRITICAL** - Unconditional hardcoded colors (breaks one of the two modes):
```
❌ Theme Violation in ObservationsPage.jsx

Line 45: backgroundColor: '#f5f5f5'
Line 67: color: 'black'

🚨 These colors are locked to light mode!

FIXES (use Meteor.useTheme() + isDark):
  Line 45: backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5'
  Line 67: color: isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)'

(Component needs: const appTheme = Meteor.useTheme ? Meteor.useTheme() : { theme: 'light' };
                  const isDark = appTheme.theme === 'dark';)

Should I fix these? [yes/no]
```

**❌ CRITICAL** - MUI surface tokens / theme.palette.mode (Golden Rule violation):
```
❌ Golden Rule Violation in ConditionsTable.jsx

Line 32: backgroundColor: 'background.paper'
Line 58: theme.palette.mode === 'dark'

🚨 MUI tokens don't sync with Honeycomb's custom theme — renders white in dark mode!

FIXES:
  Line 32: backgroundColor: isDark ? '#1e1e1e' : '#ffffff'
  Line 58: use isDark from Meteor.useTheme() instead

Should I fix these? [yes/no]
```

**⚠️  WARNING** - Inline styles (not theme-aware):
```
⚠️  Style Warning in ConditionsTable.jsx

Line 89: style={{ color: 'black', padding: '16px' }}

Use sx prop with isDark conditional:

FIX:
  sx={{ color: isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)', p: 2 }}

Should I fix this? [yes/no]
```

**💡 SUGGEST** - Hardcoded spacing (inconsistent):
```
💡 Spacing Suggestion in AllergyIntoleranceDetail.jsx

Line 156: sx={{ padding: '16px' }}

SUGGEST:
  sx={{ p: 2 }}  // 2 * 8px = 16px

Should I update this? [yes/no]
```

## Correct Patterns

### ✅ isDark Conditional Colors (The Golden Rule)

```jsx
const appTheme = Meteor.useTheme ? Meteor.useTheme() : { theme: 'light' };
const isDark = appTheme.theme === 'dark';
const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
const cardTextColor = isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)';

<Card sx={{
  bgcolor: cardBgColor,
  color: cardTextColor,
  '& .MuiTableCell-root': {
    color: cardTextColor,
    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
  }
}}>
```

### ✅ Brand/Status Palette Colors (mode-independent, still OK)

```jsx
sx={{
  bgcolor: 'primary.main',     // Settings-driven brand color
  color: 'error.main'          // Status colors: error, warning, success, info
}}
```

### ✅ No bgcolor on Root Page Containers

```jsx
// StyledMainRouter sets inline style.background — let the parent handle it
<Box sx={{ minHeight: '100vh', py: 4 }}>
```

### ✅ Theme Spacing

```jsx
sx={{ p: 2, m: 1, mt: 3 }}  // padding: 16px, margin: 8px, marginTop: 24px
```

**Spacing Scale:** 0 = 0px, 1 = 8px, 2 = 16px, 3 = 24px, 4 = 32px

### ✅ Typography Variants

```jsx
<Typography variant="h1">Heading</Typography>
<Typography variant="body1">Body text</Typography>
<Typography variant="caption">Small text</Typography>
```

### ✅ Responsive Breakpoints

```jsx
sx={{
  width: { xs: '100%', sm: '50%', md: '33%' },
  fontSize: { xs: '0.875rem', md: '1rem' }
}}
```

## Skip Conditions

Do NOT flag:
- Color literals inside `isDark` conditionals (this is the correct pattern)
- Variables derived from isDark (e.g., `cardBgColor`, `cardTextColor`)
- Brand/status tokens: `'primary.main'`, `'secondary.main'`, `'error.main'`, `'warning.main'`, `'success.main'`, `'info.main'`
- Comments
- String literals for display text
- className attributes
- CSS files (only check .jsx)
- Test files (.test.jsx, .spec.jsx)
- Storybook files (.stories.jsx)
- Image paths or URLs mentioning colors (e.g., "blue-logo.png")
- Theme definition files themselves (`imports/ui/App.jsx` CustomThemeProvider, `imports/ui/Themes.jsx`)

## Auto-Fix Option

If user approves:

1. **Wrap hardcoded colors in isDark conditionals:**
   - `'#ffffff'` (surface) → `isDark ? '#1e1e1e' : '#ffffff'`
   - `'#000000'` / `'black'` (text) → `isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)'`
   - `'#f5f5f5'` (inset) → `isDark ? '#2a2a2a' : '#f5f5f5'`
   - Add the `Meteor.useTheme()` / `isDark` boilerplate to the component if missing

2. **Replace MUI surface tokens:**
   - `'background.paper'` → `isDark ? '#1e1e1e' : '#ffffff'`
   - `'text.primary'` → `isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)'`
   - `theme.palette.mode === 'dark'` → `isDark`

3. **Convert inline style to sx:**
   - `style={{ color: 'black' }}` → `sx={{ color: isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)' }}`

4. **Convert pixel spacing:**
   - `padding: '16px'` → `p: 2`
   - `margin: '8px'` → `m: 1`

5. **Suggest Typography variant:**
   - `fontSize: '14px'` → `variant="body2"` (if applicable)

## Integration

This hook runs automatically after Edit/Write to UI files.
Benefits:
- Enforces the Golden Rule (Meteor.useTheme + isDark)
- Prevents dark mode bugs
- Maintains responsive spacing
- Zero cost (grep is instant)
- Educational feedback

---

Reference: `packages/CLAUDE.md` § Dark Theming Pattern (authoritative), `.claude/rules/ui/theming.md`, `imports/ui/App.jsx`
