# NPM Workflow Packages

This directory contains NPM-based workflow packages that replace Atmosphere.js packages. This is part of the ongoing migration from Atmosphere to NPM + Rspack as documented in the [Node-on-FHIR NPM Migration Strategy v2](https://github.com/clinical-meteor/node-on-fhir/docs/npm-migration-strategy.pdf).

## Package Directory Layout (2026-06-11)

The package FORMAT documented in this file is identical across three directories — only git/licensing posture differs. The workflow parser resolves packages **by name** (node_modules symlinks), so location is purely organizational; moving a package = `mv` + `npm install`.

| Directory | Git | License default | Repo | Purpose |
|-----------|-----|----------------|------|---------|
| `core/*` | tracked in monorepo | **Apache-2.0** | none (monorepo) | Ships with the honeycomb distribution (successor to Atmosphere `packages/*` clinical modules) |
| `extensions/*` | gitignored | **UNLICENSED** + `private: true` | own nested repo, private remote | User-defined / trade-secret / mission-specific |
| `npmPackages/*` | gitignored (legacy) | per package | mixed | **Transitional** — drains into core/ and extensions/ opportunistically |

Licensing posture: main app → AGPL; core packages → Apache-2.0; extensions → UNLICENSED/private. See `core/CLAUDE.md` and `extensions/CLAUDE.md` for the full directory contracts.

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
EXTRA_WORKFLOWS=@node-on-fhir/example-workflow meteor run --settings settings/settings.honeycomb.localhost.json
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

NPM workflow packages render inside the app's `CustomThemeProvider`, which (as of 2026-06-11) sanitizes settings values at ingestion and is the single palette authority — **MUI theme tokens are reliable and preferred**:

```javascript
// ✅ PREFERRED - Theme tokens (mode-agnostic, zero boilerplate)
<Box sx={{ backgroundColor: 'background.paper', color: 'text.primary' }} />
<Card sx={{ borderColor: 'divider' }} />

// ✅ SUPPORTED - Meteor.useTheme() + isDark (legacy pattern; also mode state access)
const isDark = (Meteor.useTheme ? Meteor.useTheme() : { theme: 'light' }).theme === 'dark';
<Box sx={{ backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }} />

// ❌ WRONG - Unconditional hardcoded colors (locked to one mode)
<Box sx={{ backgroundColor: '#ffffff', color: '#000000' }} />

// ❌ WRONG - Reading settings colors directly in components
const color = get(Meteor, 'settings.public.theme.palette.cardColor');
```

Common tokens: `background.paper` (cards/surfaces), `background.default` (page canvas), `text.primary`, `text.secondary`, `divider`, `action.hover`, plus brand/status (`primary.main`, `error.main`...). Spacing shorthand (`p: 2`) and Typography variants as always.

**More details**: `.claude/rules/ui/theming.md` (canonical). Legacy isDark recipes: `packages/CLAUDE.md` § Dark Theming Pattern.

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
1. Using theme tokens (`background.paper`, `text.primary`) or `isDark` conditionals — not unconditional color literals
2. Not reading `settings.public.theme.palette.*` directly in components
3. Testing in both light and dark mode settings (toggle, and both settings files)

## Related Files

- `imports/lib/WorkflowRegistry.js` - Workflow discovery
- `imports/ui/App.jsx` - Route rendering
- `imports/ui/PatientSidebar.jsx` - Sidebar rendering
- `.claude/commands/create-npm-workflow.md` - Scaffolding skill
- `.claude/rules/npm-packages/migration-pattern.md` - Pattern rules
