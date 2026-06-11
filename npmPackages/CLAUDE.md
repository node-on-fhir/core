# NPM Workflow Packages

This directory contains NPM-based workflow packages that replace Atmosphere.js packages. This is part of the ongoing migration from Atmosphere to NPM + Rspack as documented in the [Node-on-FHIR NPM Migration Strategy v2](https://github.com/clinical-meteor/node-on-fhir/docs/npm-migration-strategy.pdf).

## Overview

**Goal**: Replace `.meteor/packages` (Atmosphere) with `npmPackages/` (NPM workspaces) for clinical workflow modules.

**Benefits**:
- Single dependency system (NPM only, not NPM + Atmosphere)
- Full Rspack tree shaking and code splitting
- Faster dev reload via Rspack HMR
- Standard NPM tooling (npm install, npm link, etc.)
- Works with existing Meteor runtime (meteor/* imports still work)

## Quick Start

### Running an npm workflow package

```bash
EXTRA_WORKFLOWS=@node-on-fhir/example-workflow meteor run --settings configs/settings.honeycomb.localhost.json
```

Multiple packages:
```bash
EXTRA_WORKFLOWS=@merkalis/node-on-fhir-merkle-storage,@node-on-fhir/example-workflow meteor run --settings ...
```

### Creating a new workflow package

Use the Claude skill:
```
/create-npm-workflow MyWorkflow
```

Or copy the template:
```bash
cp -r npmPackages/example-workflow npmPackages/my-workflow
# Then update package.json, workflow.json, etc.
```

## Directory Structure

Each npm workflow package follows this structure:

```
npmPackages/{package-name}/
├── package.json           # NPM package config with exports
├── client.js              # Client entry point (routes, sidebar)
├── server.js              # Server entry point
├── server/
│   └── methods.js         # Meteor methods (optional)
├── workflow.json          # Route and sidebar configuration
├── README.md              # Package documentation
└── client/
    └── {Page}.jsx         # React page components
```

## package.json Configuration

```json
{
  "name": "@node-on-fhir/my-workflow",
  "version": "0.1.0",
  "description": "Description of your workflow",
  "main": "client.js",
  "exports": {
    ".": "./client.js",
    "./server": "./server.js",
    "./server/methods": "./server/methods.js",
    "./workflow": "./workflow.json"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "@mui/material": "^5.0.0",
    "@mui/icons-material": "^5.0.0"
  },
  "keywords": ["fhir", "healthcare", "honeycomb"],
  "author": "Clinical Meteor",
  "license": "MIT"
}
```

**Key Points**:
- Use `@node-on-fhir/` scope for new packages
- The `exports` field defines subpath exports for client/server separation
- Use `peerDependencies` for React and Material-UI (already in main app)
- Add package-specific dependencies to `dependencies`

## workflow.json Schema

```json
{
  "name": "my-workflow",
  "displayName": "My Workflow",
  "routes": [
    {
      "name": "MyPage",
      "path": "/my-workflow",
      "component": "MyPage",
      "requireAuth": false
    }
  ],
  "sidebarItems": [
    {
      "primaryText": "My Workflow",
      "to": "/my-workflow",
      "iconName": "Extension",
      "requireAuth": false
    }
  ]
}
```

**Route Fields**:
- `name`: Route identifier
- `path`: URL path
- `component`: Component name (mapped in client.js)
- `requireAuth`: Whether authentication is required

**Sidebar Fields**:
- `primaryText`: Display text in sidebar
- `to`: Navigation path
- `iconName`: Material-UI icon name (from @mui/icons-material)
- `requireAuth`: Whether authentication is required

## client.js Pattern

```javascript
// npmPackages/my-workflow/client.js

import React from 'react';
import MyPage from './client/MyPage.jsx';
import workflowConfig from './workflow.json';

// =============================================================================
// DYNAMIC ROUTES
// =============================================================================

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;

  // Map component name to actual component
  if (route.component === 'MyPage') {
    element = <MyPage />;
  }

  return {
    name: route.name,
    path: route.path,
    element: element,
    requireAuth: route.requireAuth || false
  };
});

// =============================================================================
// SIDEBAR WORKFLOWS
// =============================================================================

const SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return {
    primaryText: item.primaryText,
    to: item.to,
    iconName: item.iconName,
    requireAuth: item.requireAuth || false
  };
});

// =============================================================================
// EXPORTS
// =============================================================================

// Named exports (for direct import)
export { DynamicRoutes, SidebarWorkflows, MyPage };

// Default export (for WorkflowRegistry.registerWorkflow())
export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows
};
```

## server.js and server/methods.js Pattern

**server.js** (entry point):
```javascript
// npmPackages/my-workflow/server.js

// Re-export server methods for discovery
export * from './server/methods.js';
```

**server/methods.js** (Meteor methods):
```javascript
// npmPackages/my-workflow/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
  'myWorkflow.getData': async function(id) {
    check(id, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    console.log('[myWorkflow.getData] Fetching:', id);

    // Use Meteor v3 async methods
    const result = await SomeCollection.findOneAsync({ _id: id });
    return result;
  }
});

console.log('[myWorkflow] Server methods registered');
```

**Key Points**:
- Use `async function` for Meteor v3 compatibility
- Use Meteor v3 async collection methods (`findOneAsync`, `insertAsync`, etc.)
- Use `check()` for input validation
- Use `this.userId` for authentication checks
- Log with `[packageName]` prefix for debugging

## WorkflowRegistry Integration

The main app uses `WorkflowRegistry` (`imports/lib/WorkflowRegistry.js`) to discover workflows:

```javascript
// In main app (e.g., client/main.jsx)
import WorkflowRegistry from '/imports/lib/WorkflowRegistry.js';
import myWorkflow from '@node-on-fhir/my-workflow';

WorkflowRegistry.registerWorkflow(myWorkflow);
```

**WorkflowRegistry API**:
- `registerWorkflow(workflow)` - Register a workflow
- `getRoutes()` - Get all registered routes
- `getSidebarItems()` - Get all registered sidebar items
- `subscribe(callback)` - Subscribe to changes

## EXTRA_WORKFLOWS Environment Variable

The `EXTRA_WORKFLOWS` env var enables workflow packages at runtime:

```bash
# Single package
EXTRA_WORKFLOWS=@node-on-fhir/my-workflow meteor run

# Multiple packages (comma-separated)
EXTRA_WORKFLOWS=@node-on-fhir/my-workflow,@node-on-fhir/other-workflow meteor run
```

**How It Works**:
1. Environment variable is read by Rspack during build
2. Enabled packages are bundled into the app
3. WorkflowRegistry discovers and registers them at startup
4. App.jsx renders routes and sidebar items from WorkflowRegistry

## Adding to Root package.json Workspaces

After creating a new package, add it to the root `package.json`:

```json
{
  "workspaces": [
    "npmPackages/*"
  ]
}
```

The `npmPackages/*` glob automatically includes all packages. If your package has nested workspaces (like kastoria-core in merkalis), add them explicitly:

```json
{
  "workspaces": [
    "npmPackages/*",
    "npmPackages/my-workflow/nested-package"
  ]
}
```

Then run `npm install` to symlink the new package.

## Theme Compliance

NPM workflow packages render inside the same `CustomThemeProvider` as the rest of the app, so the **same Golden Rule applies as everywhere else in Honeycomb**: use `Meteor.useTheme()` + `isDark` with explicit colors. Do NOT use MUI surface tokens (`'background.paper'`, `'text.primary'`) or `theme.palette.mode` — settings files inject hardcoded values into the MUI theme and these render white-on-white in dark mode.

```javascript
// ❌ WRONG - Unconditional hardcoded colors (locked to one mode)
<Box sx={{ backgroundColor: '#ffffff', color: '#000000' }} />

// ❌ WRONG - MUI surface tokens (don't reflect Honeycomb theme state)
<Box sx={{ backgroundColor: 'background.paper', color: 'text.primary' }} />

// ✅ CORRECT - Meteor.useTheme() + isDark
const appTheme = Meteor.useTheme ? Meteor.useTheme() : { theme: 'light' };
const isDark = appTheme.theme === 'dark';

<Box sx={{
  backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
  color: isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)'
}} />
```

Standard color values:

| Surface | Light Mode | Dark Mode |
|---------|------------|-----------|
| Card / paper | `#ffffff` | `#1e1e1e` |
| Page canvas | `#f6f6f6` | `#121212` |
| Primary text | `rgba(0,0,0,0.87)` | `rgba(255,255,255,0.87)` |
| Secondary text | `rgba(0,0,0,0.6)` | `rgba(255,255,255,0.6)` |
| Borders / dividers | `rgba(0,0,0,0.12)` | `rgba(255,255,255,0.12)` |

Brand/status colors (`primary.main`, `error.main`), spacing shorthand (`p: 2`), and Typography variants are mode-independent and still fine.

**Full recipes** (Alerts, Paper, TextFields, nested selectors): see `packages/CLAUDE.md` § Dark Theming Pattern and `.claude/rules/ui/theming.md`.

## Patient Context

For patient-scoped workflows, use Session:

```javascript
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';

function MyPage() {
  const patient = useTracker(() => Session.get('selectedPatient'), []);
  const patientId = useTracker(() => Session.get('selectedPatientId'), []);

  if (!patient) {
    return <Alert severity="warning">No patient selected</Alert>;
  }

  // Use patient data...
}
```

## Examples

### Existing Packages

1. **@merkalis/node-on-fhir-merkle-storage** (`npmPackages/merkalis/`)
   - Merkle tree storage for FHIR resources
   - Uses kastoria-core for content-addressable storage
   - Demonstrates complex submodule integration

2. **@node-on-fhir/example-workflow** (`npmPackages/example-workflow/`)
   - Minimal "hello world" template
   - Copy this to start new packages

### Migration from Atmosphere

When migrating an Atmosphere package:

1. **Create NPM package structure** in `npmPackages/`
2. **Move source files**, replacing Atmosphere APIs:
   - `Package.onUse()` → `package.json` exports
   - `api.addFiles()` → ES module exports
   - `api.export()` → `export const/export default`
   - `Npm.depends()` → `dependencies` in package.json
3. **Create workflow.json** from route/sidebar registrations
4. **Update client.js** with DynamicRoutes/SidebarWorkflows pattern
5. **Update server methods** to use Meteor v3 async
6. **Add to workspaces** in root package.json
7. **Test** with EXTRA_WORKFLOWS
8. **Remove old Atmosphere package** from `packages/` and `.meteor/packages`

## Troubleshooting

### Package not found
```
Error: Cannot find module '@node-on-fhir/my-workflow'
```
**Fix**: Run `npm install` to symlink the workspace package.

### Routes not appearing
**Check**:
1. EXTRA_WORKFLOWS includes the package name
2. workflow.json has routes defined
3. client.js exports DynamicRoutes
4. Component mapping in client.js is correct

### Server methods not working
**Check**:
1. server/methods.js exports methods
2. Methods are imported in main app's server startup
3. Using Meteor v3 async patterns

### Theme issues (dark mode)
**Check**:
1. Using `Meteor.useTheme()` + `isDark` conditionals (not MUI surface tokens, not `theme.palette.mode`)
2. No unconditional hardcoded colors (every color literal should be paired with an `isDark` ternary)
3. Testing in both light and dark mode settings

## Related Files

- `imports/lib/WorkflowRegistry.js` - Workflow discovery
- `imports/ui/App.jsx` - Route rendering
- `imports/ui/PatientSidebar.jsx` - Sidebar rendering
- `.claude/commands/create-npm-workflow.md` - Scaffolding skill
- `.claude/rules/npm-packages/migration-pattern.md` - Pattern rules
