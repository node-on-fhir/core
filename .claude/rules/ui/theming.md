# Material-UI Theming Patterns

## Core Principle

**NEVER hardcode colors** - Always use theme tokens to ensure light/dark mode compatibility.

## Theme Access

### useTheme Hook

```javascript
import { useTheme } from '@mui/material/styles';

function MyComponent() {
  const theme = useTheme();

  return (
    <Box sx={{
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      padding: theme.spacing(2)
    }}>
      Content
    </Box>
  );
}
```

### sx Prop Shortcuts

```javascript
<Card sx={{
  backgroundColor: 'background.paper',  // Shorthand for theme.palette.background.paper
  color: 'text.primary',
  p: 2  // Shorthand for theme.spacing(2)
}} />
```

## Common Theme Tokens

### Colors

```javascript
// Background
'background.default'    // Page canvas (#f6f6f6 light, #121212 dark)
'background.paper'      // Elevated surfaces (#ffffff light, #1e1e1e dark)

// Text
'text.primary'          // Main text (rgba(0,0,0,0.87) light, #ffffff dark)
'text.secondary'        // Secondary text (rgba(0,0,0,0.54) light, rgba(255,255,255,0.7) dark)
'text.disabled'         // Disabled text

// Primary/Secondary
'primary.main'          // Primary brand color
'primary.light'
'primary.dark'
'secondary.main'

// Status
'error.main'
'warning.main'
'info.main'
'success.main'

// Other
'divider'               // Borders, dividers
'action.hover'          // Hover states
'action.selected'       // Selected states
```

### Spacing

```javascript
theme.spacing(1)  // 8px
theme.spacing(2)  // 16px
theme.spacing(3)  // 24px

// sx prop shortcuts
p: 2     // padding: 16px
m: 3     // margin: 24px
px: 4    // paddingLeft + paddingRight: 32px
py: 2    // paddingTop + paddingBottom: 16px
gap: 1   // gap: 8px (flexbox/grid)
```

## Anti-Patterns

### ❌ Hardcoded Colors
```javascript
// WRONG
<Box sx={{ backgroundColor: '#ffffff', color: '#000000' }} />
<Box sx={{ backgroundColor: 'white' }} />
<div style={{ color: '#333' }}>Text</div>
```

### ✅ Theme Tokens
```javascript
// CORRECT
<Box sx={{ backgroundColor: 'background.paper', color: 'text.primary' }} />
```

### ❌ Hardcoded Spacing
```javascript
// WRONG
<Box sx={{ padding: '16px', margin: '24px' }} />
```

### ✅ Theme Spacing
```javascript
// CORRECT
<Box sx={{ p: 2, m: 3 }} />
<Box sx={{ padding: theme.spacing(2) }} />
```

## Settings-Driven Themes

Themes are configured in settings files:

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

**Theme Definition** (`imports/ui/Themes.jsx`):
```javascript
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: get(Meteor, "settings.public.theme.palette.primaryColor", "rgb(253, 184, 19)")
    },
    background: {
      default: get(Meteor, "settings.public.theme.palette.canvasColor", "#f6f6f6"),
      paper: get(Meteor, "settings.public.theme.palette.cardColor", "#ffffff")
    }
  }
});
```

## Automatic Checking

Use hooks and commands to detect hardcoded colors:

### Hook (Automatic)
`.claude/hooks/post-tool-use-theme.md` - Runs after every file edit

### Command (Manual)
`/audit-theme` - Scan entire codebase

## Related

- Agent: `theme-auditor` - Theme compliance auditing
- Hook: `.claude/hooks/post-tool-use-theme.md` - Automatic detection
- Command: `.claude/commands/audit-theme.md` - Manual scanning
- File: `imports/ui/Themes.jsx` - Theme definitions
