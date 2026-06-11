# CLAUDE.md - Honeycomb Package Development Guide

This file provides guidance to Claude Code (claude.ai/code) when working with Atmosphere.js packages in the Honeycomb3 framework.

## Overview

Honeycomb packages are Atmosphere.js modules that extend the core framework with workflow-specific functionality. They demonstrate best practices for building healthcare applications using FHIR resources and integrating with the Honeycomb UI framework.

## Reference Implementation

The `packages/reference-app` package serves as the canonical example for package development. When in doubt about patterns or implementation details, refer to this package as it is confirmed to compile and work correctly with the latest Honeycomb3 framework.

## Package Structure

### Standard Directory Layout
```
package-name/
├── package.js           # Atmosphere.js package manifest
├── index.jsx           # Main entry point with exports
├── client/             # Client-side React components
├── server/             # Server-side methods and logic
├── lib/                # Shared utilities and collections
├── configs/            # Example settings files
├── data/               # Sample data files
└── assets/             # Images and static resources
```

### Package.js Template
```javascript
Package.describe({
  name: 'namespace:package-name',
  version: '0.1.0',
  summary: 'Brief description',
  git: 'https://github.com/username/repo',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0.4');
  
  // Core dependencies
  api.use([
    'meteor',
    'webapp',
    'ecmascript',
    'react-meteor-data',
    'session',
    'mongo',
    'check',
    'clinical:extended-api@3.0.0',
    'clinical:hl7-resource-datatypes'
  ]);
  
  
  // Server files
  api.addFiles('server/methods.js', 'server');
  
  // Client entry point
  api.mainModule('index.jsx', 'client');
});
```




## Honeycomb Package APIs

### 0. IMPORTANT:  On the server, be sure to use Meteor v3 API, including getTextAsync, findAsync, insertAsync, updateAsync, removeAsync, countAsync, etc. 

### 1. Route Injection

Export routes that will be automatically detected and registered:

```javascript
// index.jsx
let DynamicRoutes = [{
  name: 'DataImporter',
  path: '/data-importer',
  element: <DataImporterPage />,
  requireAuth: true  // Optional: require authentication
}];

// For admin routes
let AdminDynamicRoutes = [{
  name: 'AdminPanel',
  path: '/admin/panel',
  element: <AdminPanel />,
  requireAuth: true
}];

// Override the main landing page
const MainPage = {
  name: 'CustomHome',
  path: '/',
  element: <CustomHomePage />
};

export { DynamicRoutes, AdminDynamicRoutes, MainPage };
```

### 2. Sidebar Integration

Add items to the patient sidebar navigation:

```javascript
// FHIR resource menu items
let SidebarElements = [{
  primaryText: "Lab Results",
  to: '/observations',
  iconName: "laboratory",
  requireAuth: true,
  collectionName: 'Observations'  // For badge count
}];

// Workflow menu items
let SidebarWorkflows = [{
  primaryText: "SPHR Analysis",
  to: '/sphr-analyzer',
  iconName: "analyze"
}];

// Clinician-specific workflows
let ClinicianWorkflows = [{
  primaryText: "Clinical Tools",
  to: '/clinical-tools',
  iconName: "stethoscope"
}];

export { SidebarElements, SidebarWorkflows, ClinicianWorkflows };
```

### 3. Footer Button Injection

Add context-sensitive footer buttons:

```javascript
let FooterButtons = [{
  pathname: '/data-importer',  // Show on this route
  element: <Button onClick={handleImport}>Import Data</Button>
}, {
  pathname: '/observations',
  label: 'New Observation',
  onClick: () => { /* handler */ }
}];

export { FooterButtons };
```

### 4. Header Workflow Tabs

Add tabs to the header for workflow navigation:

```javascript
// Preferred pattern using navigation functions (TODO: fix in reference-app)
let WorkflowTabs = [
  <Tab label="Overview" onClick={() => navigate('/overview')} />,
  <Tab label="Analysis" onClick={() => navigate('/analysis')} />
];

// Current reference-app pattern (needs update to use useNavigate)
// let WorkflowTabs = [
//   { label: "Overview", onClick: () => { window.location = '/overview' }}
// ];

export { WorkflowTabs };
```

**Note:** The reference-app currently uses `window.location` but should be updated to use React Router's `useNavigate` hook for consistency.

## Best Practices

### 1. Collection Access

Access Honeycomb collections through the global namespace:

```javascript
// Client-side initialization
Meteor.startup(async function(){
  // Access FHIR collections
  const Patients = await global.Collections.Patients;
  const Observations = await global.Collections.Observations;
  
  // Access utilities
  const FhirUtilities = Meteor.FhirUtilities;
  const DynamicSpacer = Meteor.DynamicSpacer;
});
```

### 2. Client-Only Collections

For temporary UI state:

```javascript
if(Meteor.isClient){
  ImportCursor = new Mongo.Collection('ImportCursor', {
    connection: null  // Client-only collection
  });
}
```

### 3. Server Methods

Define secure server methods using Meteor v3 async patterns:

```javascript
// server/methods.js
Meteor.methods({
  'package.methodName': async function(args){
    // Validate inputs
    check(args, {
      patientId: String,
      data: Object
    });
    
    // Check authorization
    if(!this.userId){
      throw new Meteor.Error('unauthorized');
    }
    
    // Use Meteor v3 async APIs
    const count = await Collection.countAsync({});
    const records = await Collection.findAsync({}).fetchAsync();  // Note: fetchAsync() for cursor results
    const insertId = await Collection.insertAsync(data);
    const updated = await Collection.updateAsync(id, {$set: data});
    
    // Process and return
    return processData(args);
  }
});
```

**Important:** Always use the async versions of Meteor methods (countAsync, findAsync, insertAsync, updateAsync, removeAsync) and remember to call `.fetchAsync()` on cursors to get the actual results.

### 4. Settings Integration

Include example settings and read from Meteor.settings:

```javascript
// Check for required settings
const apiKey = get(Meteor, 'settings.private.apiKey');
if(!apiKey){
  console.warn('API key not configured in settings');
}

// Inject environment variables into settings
if(process.env.OPENAI_KEY){
  set(Meteor, 'settings.private.openApiKey', process.env.OPENAI_KEY);
}
```

### 5. SMART on FHIR Integration

Implement SMART authentication when needed:

```javascript
// Use the FhirClient for SMART operations
import FhirClient from 'fhir-kit-client';

class SmartDataImporter {
  static async fetchPatientData(patientId){
    const client = new FhirClient({
      baseUrl: get(Meteor, 'settings.public.smartOnFhir.fhirServiceUrl')
    });
    
    return await client.read({
      resourceType: 'Patient',
      id: patientId
    });
  }
}
```

### 6. Component Patterns

Follow Honeycomb UI patterns:

```javascript
import { StyledCard, PageCanvas, DynamicSpacer } from 'honeycomb-ui';

function MyComponent(props){
  return (
    <PageCanvas id="myComponentPage" paddingLeft={20} paddingRight={20}>
      <StyledCard>
        <CardHeader title="Component Title" />
        <CardContent>
          {/* Component content */}
        </CardContent>
      </StyledCard>
      <DynamicSpacer />
    </PageCanvas>
  );
}
```

## Configuration Files

Each package should include example settings:

```javascript
// configs/settings.package-name.json
{
  "public": {
    "title": "Honeycomb with Package Name",
    "defaults": {
      "route": "/package-route"
    }
  },
  "private": {
    // Private settings
  }
}
```

## Dark Theming Pattern

> **⚠️ DOCTRINE UPDATE (2026-06-11):** The root cause that made MUI tokens unreliable was fixed — `CustomThemeProvider` (imports/ui/App.jsx) now sanitizes settings values at ingestion (strips `!important`) and is the single palette authority. **MUI theme tokens (`background.paper`, `text.primary`, `theme.palette.mode`) are reliable and preferred for new code.** The `Meteor.useTheme()` + `isDark` patterns below remain fully supported for existing components — no mass rewrite — and `Meteor.useTheme()` is still how you read/toggle mode state. See `.claude/rules/ui/theming.md` for the current canonical guidance. The recipes below are kept for maintaining the existing isDark-era component footprint.

Honeycomb uses Material-UI's theming system to support both light and dark modes. Follow these patterns for consistent theming:

### 1. Background Colors for Pages

**IMPORTANT:** Root page containers should NOT set bgcolor - let the parent StyledMainRouter handle it.

```javascript
// ✅ CORRECT - For root page containers (follows reference-app pattern)
export default function MyPage() {
  return (
    <Box sx={{ minHeight: '100vh', py: 4 }}>
      {/* Page content */}
    </Box>
  );
}

// ❌ WRONG - Don't set bgcolor on root container (conflicts with StyledMainRouter)
<Box sx={{
  bgcolor: theme => theme.palette.mode === 'light'
    ? theme.palette.grey[50]
    : theme.palette.background.default
}}>

// ✅ CORRECT - Use bgcolor for nested components only
<Box sx={{
  bgcolor: 'primary.main',  // For colored sections
  p: 2
}}>
  <Typography color="primary.contrastText">Highlighted content</Typography>
</Box>
```

**Why:** The `StyledMainRouter` in App.jsx sets inline `style.background` which overrides `sx={{ bgcolor }}` due to CSS specificity. Let the parent handle page backgrounds.

### 2. Using Theme Values in sx Props

When accessing theme values in nested selectors, convert sx to a function:

```javascript
// Instead of this (won't work):
sx={{
  '&::before': {
    background: theme.palette.background.paper  // This becomes a string literal
  }
}}

// Use this:
sx={theme => ({
  '&::before': {
    background: theme.palette.background.paper  // Now properly evaluated
  }
})}
```

### 3. Color Choices

Replace hardcoded colors with theme-aware alternatives:

```javascript
// Instead of:
backgroundColor: '#f0ad4e'
color: 'rgb(25, 118, 210)'

// Use:
color: 'primary'  // For MUI components
bgcolor: theme => theme.palette.primary.main  // In sx props
color: theme => theme.palette.text.primary
```

### 4. Gradients and Complex Backgrounds

Create mode-specific gradients:

```javascript
background: theme => theme.palette.mode === 'dark'
  ? `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`
  : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
```

### 5. Text Contrast

Use appropriate text color variants:

```javascript
// Primary text
color: theme => theme.palette.text.primary

// Secondary/muted text  
color: theme => theme.palette.text.secondary

// Disabled text
color: theme => theme.palette.text.disabled

// Text on colored backgrounds
color: theme => theme.palette.getContrastText(theme.palette.primary.main)
```

### 6. Paper and Card Components

**IMPORTANT:** Cards do NOT automatically adapt to Honeycomb's custom theme. You must explicitly set colors and use the `sx` prop for comprehensive theming.

**Best Practice: Use `sx` prop with nested selectors instead of inline styles on every child component.**

```javascript
import { get } from 'lodash';

// Get theme from Honeycomb's custom hook
let useAppTheme;
Meteor.startup(function(){
  useAppTheme = Meteor.useTheme;
});

function MyPage() {
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Theme-aware colors - use conditional logic, NOT settings file values
  // Settings files often have hardcoded dark mode values
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';

  return (
    <Card sx={{
      bgcolor: cardBgColor,
      color: cardTextColor,
      // Use nested selectors to style all MUI children at once
      '& .MuiTableCell-root': {
        color: cardTextColor,
        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
      },
      '& .MuiInputLabel-root': { color: cardTextColor },
      '& .MuiSelect-root': { color: cardTextColor },
      '& .MuiSelect-icon': { color: cardTextColor },
      '& .MuiCheckbox-root': { color: cardTextColor },
      '& .MuiTablePagination-root': { color: cardTextColor },
      '& .MuiTablePagination-selectLabel': { color: cardTextColor },
      '& .MuiTablePagination-displayedRows': { color: cardTextColor },
      '& .MuiButton-root': { color: cardTextColor }
    }}>
      <CardHeader
        title="My Title"
        sx={{
          '& .MuiCardHeader-title': { color: cardTextColor },
          '& .MuiCardHeader-subheader': {
            color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
          }
        }}
      />
      <CardContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Column 1</TableCell>
              <TableCell>Column 2</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Table rows automatically inherit color from sx */}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

**Why:**
- Honeycomb uses a custom theme system (`Meteor.useTheme`) separate from Material-UI's theme
- Settings files often contain hardcoded dark mode values with `!important` flags
- Using `sx` prop with nested selectors is cleaner than applying inline styles to every child element
- Reduces code from ~50+ inline style attributes to ~3-5 sx declarations

**Common Pitfalls:**
- ❌ Don't read colors from `Meteor.settings.public.theme.palette` - values may be hardcoded for one mode
- ❌ Don't apply `style={{color: textColor}}` to every TableCell, InputLabel, etc.
- ✅ Do use conditional logic based on `isDark` boolean
- ✅ Do use `sx` prop with nested selectors on the Card component
- ✅ Do pass theme colors as props to child components that need them

### 7. Common Theming Props

```javascript
// Borders
borderColor: theme => theme.palette.divider

// Shadows
boxShadow: theme => theme.shadows[2]

// Status colors
bgcolor: theme => theme.palette.success.main
bgcolor: theme => theme.palette.warning.main
bgcolor: theme => theme.palette.error.main

// Alpha/transparency
bgcolor: theme => theme.functions.alpha(theme.palette.primary.main, 0.1)
```

### 8. Theme Pattern History (the former "Golden Rule")

**RESOLVED 2026-06-11.** From 2026-06-10 to 2026-06-11 this section mandated "never rely on `theme.palette.mode` or MUI tokens" because settings files injected `!important`-adorned values into the MUI palette (invalid CSS, silently dropped) and `StyledMainRouter` re-derived colors independently. Both root causes were fixed: `getThemeSetting()` sanitizes at ingestion, and the router consumes the provider's palette.

**Current guidance:**

```javascript
// ✅ PREFERRED for new code - MUI tokens now sync with Honeycomb's theme state
<Paper sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
<Box sx={theme => ({ border: `1px solid ${theme.palette.divider}` })}>
sx={theme => ({ bgcolor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5' })}

// ✅ STILL SUPPORTED - isDark with explicit colors (existing components)
const appTheme = Meteor.useTheme ? Meteor.useTheme() : { theme: 'light' };
const isDark = appTheme.theme === 'dark';
sx={{ bgcolor: isDark ? '#2a2a2a' : '#f5f5f5' }}
```

Don't mass-rewrite working isDark components; retire the boilerplate opportunistically when touching a file. Never add `!important` to settings color values.

#### Alert Component Dark Mode

Alert components require explicit styling for proper dark mode support. Each severity level needs theme-aware colors:

```javascript
// Info Alert
<Alert severity="info" sx={{
  bgcolor: isDark ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)',
  color: cardTextColor,
  '& .MuiAlert-icon': { color: isDark ? '#90caf9' : '#1976d2' },
  '& .MuiAlertTitle-root': { color: cardTextColor }
}}>
  <AlertTitle>Information</AlertTitle>
  Message text here
</Alert>

// Error Alert
<Alert severity="error" sx={{
  bgcolor: isDark ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.1)',
  color: cardTextColor,
  '& .MuiAlert-icon': { color: isDark ? '#f44336' : '#d32f2f' }
}}>
  Error message
</Alert>

// Warning Alert
<Alert severity="warning" sx={{
  bgcolor: isDark ? 'rgba(237, 108, 2, 0.15)' : 'rgba(237, 108, 2, 0.1)',
  color: cardTextColor,
  '& .MuiAlert-icon': { color: isDark ? '#ff9800' : '#ed6c02' },
  '& .MuiAlertTitle-root': { color: cardTextColor }
}}>
  <AlertTitle>Warning</AlertTitle>
  Warning message
</Alert>

// Success Alert
<Alert severity="success" sx={{
  bgcolor: isDark ? 'rgba(46, 125, 50, 0.15)' : 'rgba(46, 125, 50, 0.1)',
  color: cardTextColor,
  '& .MuiAlert-icon': { color: isDark ? '#66bb6a' : '#2e7d32' },
  '& .MuiAlertTitle-root': { color: cardTextColor }
}}>
  Success message
</Alert>
```

#### Paper Component Backgrounds

Paper components need explicit background colors - they don't automatically adapt:

```javascript
// ❌ WRONG - Will render white in dark mode
<Paper variant="outlined" sx={theme => ({
  p: 2,
  bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50]
})}>

// ✅ CORRECT - Explicit colors based on isDark
<Paper variant="outlined" sx={{
  p: 2,
  bgcolor: isDark ? '#2a2a2a' : '#f5f5f5'
}}>
  <Typography sx={{ color: cardTextColor }}>
    Content here
  </Typography>
</Paper>
```

#### Comprehensive TextField Pattern

TextFields inside Cards need nested selectors for all their sub-components:

```javascript
<Card sx={{
  bgcolor: cardBgColor,
  color: cardTextColor,
  // TextField styling - covers all input states
  '& .MuiTextField-root': {
    '& .MuiInputLabel-root': { color: cardTextColor },
    '& .MuiInputBase-root': { color: cardTextColor },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)'
    },
    '& .MuiFormHelperText-root': {
      color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
    }
  },
  // Select styling
  '& .MuiSelect-root': { color: cardTextColor },
  '& .MuiSelect-icon': { color: cardTextColor },
  // FormControlLabel (checkboxes/radios)
  '& .MuiFormControlLabel-label': { color: cardTextColor }
}}>
  <CardContent>
    <TextField label="Example" helperText="Helper text" />
    <Select>
      <MenuItem value="1">Option 1</MenuItem>
    </Select>
  </CardContent>
</Card>
```

#### Common Dark Mode Issues and Solutions

| Issue | Wrong Approach | Correct Approach |
|-------|---------------|------------------|
| White Paper in dark mode | `theme.palette.grey[900]` | `isDark ? '#2a2a2a' : '#f5f5f5'` |
| Unreadable Alert text | No sx prop on Alert | Explicit bgcolor and color in sx |
| Invisible TextField labels | No nested selectors | `'& .MuiInputLabel-root': { color }` |
| Wrong border colors | `theme.palette.divider` | `isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'` |
| White console/code blocks | Using theme function | Direct `isDark` conditional |

## Key Patterns to Follow

- *** IMPORTANT:  On the server, be sure to use Meteor v3 API, including getTextAsync, findAsync, insertAsync, updateAsync, removeAsync, countAsync, etc. *** 

1. **Export Pattern**: Always export APIs through index.jsx using named exports
2. **Route Structure**: Include name, path, element, and optionally requireAuth
3. **Icon Names**: Use consistent icon naming (e.g., "laboratory", "analyze")
4. **Collection Names**: Match FHIR resource names (e.g., "Patients", "Observations")
5. **Startup Pattern**: Use Meteor.startup() for initialization
6. **Error Handling**: Include proper error messages and validation
7. **Settings Check**: Verify required settings before using them
8. **Component IDs**: Add unique IDs to main components for testing
9. **Meteor Object**:  React components need to be passed through the Meteor object, not used via /import/paths
10. **PageCanvas**:  Deprecated; replace <PageCanvas> tags with <div> tags
11. **StyledCard**:  Deprecated; replace <StyledCard> tags with <Card> components
12. **Dark Mode**: Always use theme-aware colors and backgrounds for proper light/dark mode support

## Known Issues to Fix

The following issues have been identified in the reference-app and should be addressed:

1. **WorkflowTabs Navigation**: The reference-app currently uses `window.location` for navigation in WorkflowTabs. This should be updated to use React Router's `useNavigate` hook pattern.

2. **Missing fetchAsync()**: Some server-side cursor operations may be missing the `.fetchAsync()` call. Always ensure cursor results are fetched with `await cursor.fetchAsync()`.

3. **Export Redundancy**: Some components export both named and default exports unnecessarily. Stick to named exports for consistency.

