# Slash Command: /audit-print

> **ℹ️ DOCTRINE NOTE:** The app **always prints in the LIGHT theme** — screens may be
> light or dark, but paper is (nearly) universally white. The authority is two-fold and
> already in place: (1) a `beforeprint`/`afterprint` listener in `CustomThemeProvider`
> (`imports/ui/App.jsx`) swaps the MUI palette to light during printing, and (2) a global
> `@media print` block in `client/main.css` forces white surfaces + dark text and hides
> screen-only chrome (AppBar/Drawer/FAB). This audit finds print hazards that those two
> mechanisms don't already neutralize, and flags pages that fight them.

Audit the codebase for print-theme issues — content that would render dark/illegible on
white paper, or print UI chrome that doesn't belong on a printout.

## Description

This command scans printable pages and shared components for dark-mode color literals,
fixed dark backgrounds, and missing print handling, validating that printed output is the
light theme regardless of the on-screen mode.

## Usage

```
/audit-print
```

Optional: scan a specific directory
```
/audit-print npmPackages/pacio-core/client/pages
/audit-print imports/ui-fhir/observations
```

## What It Does

1. **Identifies print surfaces:**
   - Pages/components that call `window.print()` or render a `PrintIcon` / print button
   - Any document/report/summary view intended to be printed (ToC, IPS, C-CDA, medication
     lists, advance directives)

2. **Scans for print hazards:**
   - `isDark ? '#1e1e1e' : ...` / `isDark ? 'rgba(255,255,255,…)' : ...` surface or text
     colors applied to printable content (would print dark-on-white or white-on-white)
   - Unconditional dark color literals on printable surfaces
   - Inline `style={{ background:'#000'… }}` on printable content
   - Print buttons in components that set fixed dark colors without relying on the global
     print stylesheet / theme swap
   - Components that set `display: none` only for screen but should print, or vice-versa
     (e.g. action toolbars, FABs, nav that should be hidden on paper)

3. **Validates print plumbing:**
   - The global `@media print` block exists in `client/main.css`
   - The `beforeprint`/`afterprint` light-swap exists in `CustomThemeProvider`
   - Page-local `@media print` / print containers don't conflict with the global rules

4. **Reports** by severity:
   - ❌ CRITICAL: dark surface/text literals on printable content that survive to paper
     (white-on-white text, black cards) and aren't covered by the global rules
   - ⚠️ WARNING: print buttons / printable pages relying on `isDark` colors without a
     matching `@media print` override; chrome that prints but shouldn't
   - 💡 SUGGEST: page-local print CSS that duplicates or could defer to the global stylesheet

5. **Offers to fix** — prefer routing fixes through the global mechanisms (theme tokens +
   the `@media print` block); only add page-local print CSS when a page has a genuinely
   special print layout.

## Example Output

```markdown
# Print Theme Audit Results

Scanned **6 print surfaces** across npmPackages/ and imports/.

Found **4 issues** across 3 files:

---

## ❌ CRITICAL — Dark content on white paper (1)

### npmPackages/pacio-core/client/pages/SomePage.jsx
**Line 88:** dark card background hardcoded on printable content
```jsx
<Card sx={{ bgcolor: '#1e1e1e', color: 'rgba(255,255,255,0.87)' }}>
```
**Fix:** use theme tokens so the print light-swap applies, or rely on the global
`@media print` override (which forces `.MuiCard-root` white):
```jsx
<Card sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
```
**Why:** when dark mode is on, the print swap restores light, but unconditional literals
ignore the palette — they'd print dark on paper.

---

## ⚠️ WARNING — Print page without override reliance (2)
...

## 💡 SUGGEST — Page-local print CSS could defer to global (1)
...

## Summary by Location
| Location | Critical | Warning | Suggest | Total |
|----------|----------|---------|---------|-------|
| npmPackages/pacio-core/ | 1 | 2 | 1 | 4 |
| **Total** | **1** | **2** | **1** | **4** |

---

Would you like me to:
1. Fix all issues automatically
2. Fix only Critical issues
3. Show detailed fixes for manual review
4. Generate a report file (print-audit-report.md)
5. Skip auto-fix

[1/2/3/4/5]
```

## Search Patterns Used

```bash
# Print entry points
grep -rn "window\.print\|PrintIcon\|handlePrint" --include="*.jsx" \
  imports npmPackages

# Dark literals on (likely) printable content
grep -rn "isDark ?.*#1e1e1e\|isDark ?.*rgba(255\|bgcolor: ['\"]#1e1e1e\|backgroundColor: ['\"]#1e1e1e" \
  --include="*.jsx" imports npmPackages

# Existing print handling (presence/absence)
grep -rn "@media print\|beforeprint\|afterprint" \
  client imports npmPackages
```

## Directories Scanned (Default)

- `npmPackages/*/client/` — workflow package UIs (the main print surfaces today)
- `imports/ui/` and `imports/ui-fhir/` — core + FHIR UIs
- `client/main.css` — the global print stylesheet (presence/correctness)
- `imports/ui/App.jsx` — the `beforeprint`/`afterprint` light-swap (presence)

## Exclusions

- `node_modules/`, `tests/`, `.meteor/`, `deprecated/`
- Server-side files
- Documentation/IG template CSS (e.g. drug-formulary guides)
- `isDark` conditionals on **screen-only** content that is hidden on print

## When to Use

- Before releases, especially for clinical document / summary views
- After adding a new printable page or a `window.print()` button
- When a user reports "the printout is dark / unreadable / has the sidebar on it"
- During code reviews of report/summary/export UIs

## Related

- Authority: `client/main.css` (`@media print`) + `imports/ui/App.jsx` (`beforeprint`/`afterprint` light-swap)
- Agent: `.claude/agents/print-auditor.md`
- Sibling (screen themes): `.claude/commands/audit-theme.md`, `.claude/rules/ui/theming.md`

---

**Note:** Printed clinical documents are often the artifact of record — legibility on paper
is a correctness/compliance concern, not just cosmetics.
