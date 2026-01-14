# Post Tool Use Hook: Theme Consistency Check

## Trigger
After any Edit or Write operation to `.jsx` files in `/imports/ui/` or `/imports/ui-fhir/`

## Purpose
Ensure consistent light/dark mode theming by detecting hardcoded colors, inline styles, and spacing that won't adapt to theme changes.

## Theme Architecture

Honeycomb uses Material-UI v5 with Meteor.settings-driven themes:

**Theme Files:**
- `imports/ui/Themes.jsx` - Theme definitions (lightTheme, darkTheme)
- `configs/settings.honeycomb.localhost.json` - Light mode palette
- `configs/settings.honeycomb.dicom.localhost.json` - Dark mode palette (darkMode: true)

**Light Mode:**
- Primary: rgb(108, 183, 110) - green
- Background: #f6f6f6, Cards: #ffffff
- Text: rgba(0, 0, 0, 1)

**Dark Mode:**
- Primary: rgb(163, 153, 163) - gray/purple
- Background: #121212/#1e1e1e, Cards: #1e1e1e
- Text: rgba(255, 255, 255, 0.87)

## Detection Patterns

### 1. Hardcoded Hex Colors

```bash
grep -n "color: ['\"]#\|backgroundColor: ['\"]#\|borderColor: ['\"]#" "$CHANGED_FILE"
```

Catches:
- `color: '#000000'`
- `backgroundColor: '#ffffff'`
- `borderColor: '#e0e0e0'`

### 2. Hardcoded RGB/RGBA Colors

```bash
grep -n "color: ['\"]rgb\|backgroundColor: ['\"]rgb" "$CHANGED_FILE"
```

Catches:
- `color: 'rgb(0, 0, 0)'`
- `backgroundColor: 'rgba(255, 255, 255, 0.8)'`

### 3. Hardcoded Named Colors

```bash
grep -n "color: ['\"]black\|color: ['\"]white\|backgroundColor: ['\"]white\|backgroundColor: ['\"]black" "$CHANGED_FILE"
```

Catches:
- `color: 'black'`
- `color: 'white'`
- `backgroundColor: 'white'`

### 4. Inline Style Instead of sx

```bash
grep -n "style={{.*color:\|style={{.*backgroundColor:" "$CHANGED_FILE"
```

Catches:
- `style={{ color: 'black', padding: '16px' }}`
- `<Box style={{ backgroundColor: '#fff' }} />`

### 5. Hardcoded Pixel Spacing

```bash
grep -n "padding: ['\"][0-9]\|margin: ['\"][0-9]\|sx={{ p: '[0-9]\|sx={{ m: '[0-9]" "$CHANGED_FILE"
```

Catches:
- `padding: '16px'`
- `margin: '8px'`
- `sx={{ p: '16px' }}` (should be `p: 2`)

### 6. Hardcoded Font Sizes

```bash
grep -n "fontSize: ['\"][0-9]\|fontSize: {.*px" "$CHANGED_FILE"
```

Catches:
- `fontSize: '14px'`
- `sx={{ fontSize: '1rem' }}` (should use Typography variant)

## Action When Detected

Display warning categorized by severity:

**❌ CRITICAL** - Hardcoded colors (breaks dark mode):
```
❌ Theme Violation in ObservationsPage.jsx

Line 45: backgroundColor: '#f5f5f5'
Line 67: color: 'black'

🚨 These hardcoded colors won't adapt to dark mode!

FIXES:
  Line 45: backgroundColor: 'background.default'
  Line 67: color: 'text.primary'

Should I fix these? [yes/no]
```

**⚠️  WARNING** - Inline styles (not theme-aware):
```
⚠️  Style Warning in ConditionsTable.jsx

Line 89: style={{ color: 'black', padding: '16px' }}

Use sx prop instead of style for theme integration:

FIX:
  sx={{ color: 'text.primary', p: 2 }}

Should I fix this? [yes/no]
```

**💡 SUGGEST** - Hardcoded spacing (inconsistent):
```
💡 Spacing Suggestion in AllergyIntoleranceDetail.jsx

Line 156: sx={{ padding: '16px' }}

Use theme.spacing() shorthand for consistency:

SUGGEST:
  sx={{ p: 2 }}  // 2 * 8px = 16px

Should I update this? [yes/no]
```

## Correct Patterns

### ✅ Theme-Aware Colors

```jsx
// Use theme palette tokens
sx={{
  backgroundColor: 'background.paper',  // Auto-adapts to light/dark
  color: 'text.primary',
  borderColor: 'divider'
}}
```

### ✅ Custom Palette Keys

Honeycomb defines custom keys in Themes.jsx:

```jsx
sx={{
  backgroundColor: 'appbar.main',        // Custom gradient + texture
  color: 'appbar.contrastText',
  borderColor: 'default.main'            // Settings-driven
}}
```

### ✅ Conditional Theming

For mode-specific styling:

```jsx
sx={{
  backgroundColor: (theme) =>
    theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100'
}}
```

### ✅ Theme Spacing

```jsx
// Use shorthand
sx={{ p: 2, m: 1, mt: 3 }}  // padding: 16px, margin: 8px, marginTop: 24px

// Or explicit
sx={{
  padding: (theme) => theme.spacing(2),
  margin: (theme) => theme.spacing(1)
}}
```

**Spacing Scale:**
- 0 = 0px
- 1 = 8px
- 2 = 16px
- 3 = 24px
- 4 = 32px

### ✅ Typography Variants

```jsx
// Use variants instead of hardcoded fontSize
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

## Theme Token Reference

### Standard Tokens

- `background.default` - Main canvas (light: #f6f6f6, dark: #121212)
- `background.paper` - Cards/surfaces (light: #ffffff, dark: #1e1e1e)
- `text.primary` - Main text (light: black, dark: white 0.87)
- `text.secondary` - Muted text
- `text.disabled` - Disabled state
- `primary.main` - Primary brand color
- `secondary.main` - Secondary brand color
- `error.main`, `warning.main`, `success.main`, `info.main`
- `divider` - Border/separator color

### Custom Tokens (Honeycomb)

- `default.main` - Special text color from settings
- `standard.main` - Standard text color from settings
- `appbar.main` - AppBar background (gradient + texture)
- `appbar.contrastText` - AppBar text color

## Skip Conditions

Do NOT flag:
- Comments
- String literals for display text
- className attributes
- CSS files (only check .jsx)
- Test files (.test.jsx, .spec.jsx)
- Storybook files (.stories.jsx)
- Image paths or URLs mentioning colors (e.g., "blue-logo.png")
- Already using theme tokens (e.g., `'primary.main'`)

## Auto-Fix Option

If user approves:

1. **Replace hex colors:**
   - `'#ffffff'` → `'background.paper'`
   - `'#000000'` → `'text.primary'`
   - `'#f6f6f6'` → `'background.default'`

2. **Convert inline style to sx:**
   - `style={{ color: 'black' }}` → `sx={{ color: 'text.primary' }}`

3. **Convert pixel spacing:**
   - `padding: '16px'` → `p: 2`
   - `margin: '8px'` → `m: 1`

4. **Suggest Typography variant:**
   - `fontSize: '14px'` → `variant="body2"` (if applicable)

## Integration

This hook runs automatically after Edit/Write to UI files.
Benefits:
- Enforces theme consistency
- Prevents dark mode bugs
- Maintains responsive spacing
- Zero cost (grep is instant)
- Educational feedback

---

Reference: imports/ui/Themes.jsx, configs/settings.*.json
