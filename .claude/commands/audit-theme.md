# Slash Command: /audit-theme

> **⚠️ GOLDEN RULE OVERRIDE (2026-06-10):** The canonical theming pattern for Honeycomb is **`Meteor.useTheme()` + `isDark` with explicit colors** — NOT MUI theme tokens. Honeycomb's custom theme system does not reliably sync with MUI's palette (settings files inject hardcoded `!important` values into tokens like `background.paper`). Any fix suggestion below that recommends MUI surface tokens (`'background.paper'`, `'text.primary'`, `theme.palette.mode`) is **superseded**: translate it to `isDark ? darkValue : lightValue` conditionals instead. Flag MUI surface-token usage as a violation, not a fix. Brand/status colors (`primary.main`, `error.main`), spacing shorthand (`p: 2`), and Typography variants remain valid. Authoritative reference: `packages/CLAUDE.md` § Dark Theming Pattern and `.claude/rules/ui/theming.md`.

Audit the codebase for theme consistency issues that break light/dark mode support.

## Description

This command scans UI components for hardcoded colors, inline styles, and spacing that won't adapt to theme changes. It validates against Honeycomb's Material-UI v5 theme system with settings-driven palettes.

## Usage

```
/audit-theme
```

Optional: Scan specific directory
```
/audit-theme imports/ui-fhir/observations
/audit-theme packages/clinical-hl7-fhir-ui
```

## What It Does

1. **Scans for theme violations:**
   - Hardcoded hex colors (#fff, #000, #f6f6f6, etc.)
   - Hardcoded RGB/RGBA colors
   - Named colors ('black', 'white')
   - Inline style attributes instead of sx props
   - Hardcoded pixel spacing (padding: '16px')
   - Hardcoded font sizes (fontSize: '14px')

2. **Validates against theme architecture:**
   - Light mode (settings.honeycomb.localhost.json)
   - Dark mode (settings.honeycomb.dicom.localhost.json)
   - Custom palette keys (appbar, default, standard)
   - Theme spacing scale
   - Typography variants

3. **Reports violations** categorized by severity:
   - ❌ CRITICAL: Hardcoded colors (breaks dark mode)
   - ⚠️  WARNING: Inline styles (not theme-aware)
   - 💡 SUGGEST: Hardcoded spacing (inconsistent)

4. **Offers to fix** violations automatically

## Example Output

```markdown
# Theme Consistency Audit Results

Scanned **67 components** across:
- imports/ui/ (12 components)
- imports/ui-fhir/ (30 components)
- packages/*/client/ (25 components)

Found **15 violations** across 8 files:

---

## ❌ CRITICAL - Hardcoded Colors (8 violations)

These will NOT adapt to dark mode!

### imports/ui-fhir/observations/ObservationsPage.jsx

**Line 45:** `backgroundColor: '#f6f6f6'`
```jsx
<Box sx={{ backgroundColor: '#f6f6f6', p: 2 }}>
```

**Fix:**
```jsx
<Box sx={{ backgroundColor: 'background.default', p: 2 }}>
```

**Why:** `background.default` adapts: light #f6f6f6 → dark #121212

---

**Line 67:** `color: 'black'`
```jsx
<Typography sx={{ color: 'black' }}>
```

**Fix:**
```jsx
<Typography sx={{ color: 'text.primary' }}>
```

**Why:** `text.primary` adapts: light black → dark rgba(255,255,255,0.87)

---

### packages/clinical-hl7-fhir-ui/client/PatientTable.jsx

**Line 123:** `borderColor: '#e0e0e0'`
```jsx
<TableCell sx={{ borderColor: '#e0e0e0' }}>
```

**Fix:**
```jsx
<TableCell sx={{ borderColor: 'divider' }}>
```

---

## ⚠️  WARNING - Inline Styles (4 violations)

Using `style` instead of `sx` prevents theme integration.

### imports/ui-fhir/allergyintolerances/AllergyIntolerancesTable.jsx

**Line 156:** `style={{ color: 'black', padding: '16px' }}`
```jsx
<div style={{ color: 'black', padding: '16px' }}>
```

**Fix:**
```jsx
<div sx={{ color: 'text.primary', p: 2 }}>
```

**Why:** `sx` uses theme system, `style` does not

---

## 💡 SUGGEST - Hardcoded Spacing (3 violations)

Use theme.spacing() for consistency.

### packages/clinical-fhir-medications/client/MedicationDetail.jsx

**Line 234:** `padding: '16px'`
```jsx
<Card sx={{ padding: '16px' }}>
```

**Suggest:**
```jsx
<Card sx={{ p: 2 }}>
```

**Why:** `p: 2` = theme.spacing(2) = 16px, consistent with theme scale

---

## ✅ Components with Perfect Theme Compliance

Well done! These components use theme tokens correctly:

- ✅ MedicationAdministrationPage.jsx
- ✅ ImmunizationsTable.jsx
- ✅ CarePlansDetail.jsx
- ✅ PatientsPage.jsx
- ✅ packages/clinical-hl7-fhir-ui/client/ObservationTable.jsx

---

## Summary by Location

| Location | Critical | Warning | Suggest | Total |
|----------|----------|---------|---------|-------|
| imports/ui/ | 2 | 1 | 0 | 3 |
| imports/ui-fhir/ | 4 | 2 | 2 | 8 |
| packages/*/client/ | 2 | 1 | 1 | 4 |
| **Total** | **8** | **4** | **3** | **15** |

---

## Theme System Reference

### Standard Tokens
- `background.default` - Canvas (light: #f6f6f6, dark: #121212)
- `background.paper` - Cards (light: #ffffff, dark: #1e1e1e)
- `text.primary` - Main text (adapts light/dark)
- `text.secondary` - Muted text
- `divider` - Borders/separators
- `primary.main` - Primary color (green/gray-purple)
- `secondary.main` - Secondary color (gold/blue)

### Custom Tokens (Honeycomb)
- `default.main` - Special text (settings-driven)
- `standard.main` - Standard text (settings-driven)
- `appbar.main` - AppBar background (gradient + texture)
- `appbar.contrastText` - AppBar text

### Spacing Scale
- `p: 0` = 0px
- `p: 1` = 8px
- `p: 2` = 16px
- `p: 3` = 24px
- `p: 4` = 32px

---

## Recommendations

1. **Fix all Critical violations immediately** - They break dark mode
2. **Convert inline styles to sx props** - Enables theme integration
3. **Use spacing shorthand for consistency** - Better maintainability
4. **Test in both light and dark modes** - Use DICOM config for dark mode

---

Would you like me to:
1. Fix all violations automatically
2. Fix only Critical violations
3. Show me detailed fixes for manual review
4. Generate a report file (theme-audit-report.md)
5. Skip auto-fix

[1/2/3/4/5]
```

## Search Patterns Used

```bash
# Hardcoded hex colors
grep -rn "color: ['\"]#\|backgroundColor: ['\"]#\|borderColor: ['\"]#" \
  --include="*.jsx" imports/ui imports/ui-fhir packages/*/client

# Hardcoded RGB colors
grep -rn "color: ['\"]rgb\|backgroundColor: ['\"]rgb" \
  --include="*.jsx" imports/ui imports/ui-fhir packages/*/client

# Named colors
grep -rn "color: ['\"]black\|color: ['\"]white\|backgroundColor: ['\"]white" \
  --include="*.jsx" imports/ui imports/ui-fhir packages/*/client

# Inline styles
grep -rn "style={{.*color:\|style={{.*backgroundColor:" \
  --include="*.jsx" imports/ui imports/ui-fhir packages/*/client

# Hardcoded spacing
grep -rn "padding: ['\"][0-9]\|margin: ['\"][0-9]" \
  --include="*.jsx" imports/ui imports/ui-fhir packages/*/client

# Hardcoded font sizes
grep -rn "fontSize: ['\"][0-9]\|fontSize: {.*px" \
  --include="*.jsx" imports/ui imports/ui-fhir packages/*/client
```

## Directories Scanned (Default)

- `imports/ui/` - Core UI components
- `imports/ui-fhir/` - FHIR resource UIs
- `packages/*/client/` - All Atmosphere package client code
- `packages/*/ui/` - Package UI directories (if present)

## Exclusions

- `node_modules/`
- `tests/`
- `.meteor/`
- Comments
- String literals for display text
- className attributes
- Already using theme tokens (e.g., `'primary.main'`)
- Server-side files (`packages/*/server/`)

## Auto-Fix Behavior

If user approves:

1. **Replace hex colors:**
   - `'#ffffff'` → `'background.paper'`
   - `'#000000'` → `'text.primary'`
   - `'#f6f6f6'` → `'background.default'`
   - `'#e0e0e0'` → `'divider'`

2. **Convert inline styles:**
   - `style={{ color: 'black' }}` → `sx={{ color: 'text.primary' }}`

3. **Convert spacing:**
   - `padding: '16px'` → `p: 2`
   - `margin: '8px'` → `m: 1`
   - `marginTop: '24px'` → `mt: 3`

4. **Preserve custom logic:**
   - Conditional theming preserved
   - Mode-specific styles maintained

## Package-Specific Considerations

When scanning packages:
- Some packages may be shared across projects
- Fixes should use theme tokens that work universally
- Avoid hardcoding Honeycomb-specific colors in shared packages
- Use standard Material-UI tokens in packages (`primary.main`, not `appbar.main`)

## Testing Dark Mode

After fixes, test with dark mode config:

```bash
meteor run --settings configs/settings.honeycomb.dicom.localhost.json
```

## When to Use

- Before releases
- After adding new UI components
- When implementing new FHIR resource UIs
- When creating new Atmosphere packages
- When user reports "looks wrong in dark mode"
- During code reviews
- As part of regular maintenance

## Related

- See `.claude/hooks/post-tool-use-theme.md` for automatic detection
- See `.claude/rules/ui/theming.md` for theme system guide
- See `imports/ui/Themes.jsx` for theme definitions
- See `configs/settings.*.json` for palette configuration

---

**Note:** Consistent theming is critical for DICOM viewer mode and accessibility compliance.
