# NPM Workflow Packages

This directory contains NPM-based workflow packages that replace Atmosphere.js packages. This is part of the ongoing migration from Atmosphere to NPM + Rspack as documented in the [Node-on-FHIR NPM Migration Strategy v2](https://github.com/clinical-meteor/node-on-fhir/docs/npm-migration-strategy.pdf).

## Package Directory Layout (updated 2026-06-14)

The package FORMAT documented in this file is identical across all three directories — only git/licensing posture differs. The workflow parser resolves packages **by name** (node_modules symlinks), so location is purely organizational and does not affect loading; moving a package = `mv` + `npm install`.

| Directory | Git | License default | Repo | Purpose |
|-----------|-----|----------------|------|---------|
| `npmPackages/*` | **tracked in this monorepo** | per package (mostly MIT) | none (monorepo) | The workflow-package home — successor to the Atmosphere `packages/*` clinical modules; ships with the distribution |
| `core/*` | tracked in monorepo | **Apache-2.0** | none (monorepo) | Reserved for an Apache-licensed core subset (currently just a `CLAUDE.md` stub) |
| `extensions/*` | **gitignored** | **UNLICENSED** + `private: true` | own nested repo, private remote | User-defined / trade-secret / mission-specific; nothing here is checked into the monorepo (only the directory `CLAUDE.md` stub) |

Licensing posture: main app → AGPL; workflow packages → MIT/Apache-2.0; extensions → UNLICENSED/private. See `extensions/CLAUDE.md` for the private-package contract.

**History (2026-06-14):** the Atmosphere `packages/*` estate (55 packages) was fully migrated to NPM workflow packages and retired to `deprecated/`. `npmPackages/*` — formerly gitignored/transitional — is now the monorepo-tracked home. Packages with active private upstreams (symptomatic/* etc.) live in `extensions/` as nested repos; everything else is checked into this monorepo. The full per-package migration record is in the git history (the per-package "Migrate … to NPM workflow package" commits).

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

## Full workflow export contract

`DynamicRoutes` + `SidebarWorkflows` are the minimum, but the host (App.jsx,
Header, Footer, PatientSidebar, PatientsTable) reads a **larger named-export
surface** — the same one the Atmosphere `index.jsx` exposed. A migrated package
keeps whatever subset it used; these are all still live as of the 2026-06-14
migration:

| Export | Shape | Consumed by |
|--------|-------|-------------|
| `DynamicRoutes` | `[{ name, path, element, requireAuth, description }]` | App.jsx route table |
| `MainPage` | `{ name, path: '/', element }` | `/` landing-page override (named export, **not** in `DynamicRoutes`) |
| `AdminDynamicRoutes` | same as DynamicRoutes | admin-gated routes |
| `SidebarWorkflows` | `[{ primaryText, to, iconName, requireAuth }]` | workflow sidebar group |
| `SidebarElements` | `[{ primaryText, to, iconName, requireAuth, collectionName? }]` | FHIR-resource sidebar items (badge count via `collectionName`) |
| `ClinicianWorkflows` | same as SidebarWorkflows | clinician sidebar group |
| `AdminSidebarElements` | same | admin sidebar group |
| `FooterButtons` | `[{ pathname, element }]` | route-scoped footer (rendered when `location.pathname` matches) |
| `FooterElements` | `[{ label, className, style, onClick }]` | legacy footer-button objects |
| `PatientsDirectoryButtons` | `[{ id, label, icon, color, onClick(patientId, patient) }]` | per-row action buttons on the patients table |
| `WorkflowTabs` | `[<Tab .../>]` | header workflow tabs |
| `ModuleConfig` | `{ name, version, fhirResources, settings, ... }` | metadata (informational) |

**Routes MUST use `element: <Comp />`, not `component: Comp`.** App.jsx renders
`route.element`; the legacy `component:` form is no longer supported (the
`React.createElement(route.component)` path is commented out) and silently fails
to render. Atmosphere packages that used `component:` were converted on migration
(pacio-core, provider-directory, mcp). `element` requires `React` in module scope
— `import React from 'react'` at the top of `client.js`.

Default export is what `WorkflowRegistry.registerWorkflow()` consumes:
`{ name, routes, sidebarItems, footerButtons? }`. Anything beyond that (MainPage,
PatientsDirectoryButtons, etc.) is read by name, so **keep them as named exports**.

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

### Migration gotchas (learned migrating the full estate, 2026-06-14)

The traps that recurred across ~55 package migrations:

- **`component:` → `element:`** on routes (see the export-contract section). The
  single most common silent failure.
- **Rspack only bundles the import graph from `client.js`.** Atmosphere
  `api.addFiles` loaded *every* listed file; npm/Rspack loads only what's
  transitively imported. So **unrouted legacy/WIP files are dead — they aren't
  bundled and don't need porting** (the material-ui v0.x/v4 files in genome,
  timelines, provider-directory; the `electron` HuggingFace downloader in mcp).
  Verify with a reachability grep before porting anything heavy.
- **Dead `Npm.depends`.** Many declared deps were never imported (mcp's
  `@a2a-js/sdk`, timelines' `vis-timeline`/`react-event-timeline`, genome's
  `bionode-sam` et al.). Only declare deps that are actually imported by live
  code — and watch peer ranges (react-event-timeline pinned React <17, blocking
  install). Run a real `from`/`require(` scan, don't trust `Npm.depends`.
- **"False gates."** An `onTest` `api.use('clinical:X')` is almost always a
  self-reference or test-only dep, **not** a real external dependency. Six
  packages were mislabeled "externally gated" when the dep was just in the
  `Package.onTest` block.
- **`meteor/http` is not self-sufficient** outside Atmosphere. Replace
  `import { HTTP } from 'meteor/http'` with the fetch-backed shim
  (`npmPackages/data-importer/lib/httpClient.js` is the canonical copy). Some
  files used `HTTP` as an Atmosphere global without importing it — add the import.
- **Atmosphere bare-globals break strict ESM.** `X = {}` at module top level →
  `const X = globalThis.X = {}`. Same for `api.export`'d symbols → `export const`.
- **Load-order: don't assume the host globals exist at your `Meteor.startup`.**
  `global.Collections` / `Meteor.Collections` / `Meteor.FhirUtilities` were
  guaranteed-present under Atmosphere's load order; under npm-workflow load order
  they may be undefined when your startup runs. Guard with `lodash.get` (this was
  genome-central-redux's boot crash).
- **Method-collision guard.** If your package redefines a Meteor method the host
  app now provides (e.g. UDAP / search-parameter methods absorbed into core),
  registration throws *"method already defined"*. Register only names not already
  in `Meteor.server.method_handlers` (see provider-directory's `server/methods.js`).
- **Client-side AI/ML ESM deps + `process/browser`.** `@langchain/*`, `openai`,
  `@mlc-ai/web-llm`, `@xenova/transformers`, `onnxruntime-web` import
  `'process/browser'` without a `.js` extension, which Rspack strict ESM rejects.
  Add the package to the `fullySpecified: false` rule in `rspack.config.js`
  (the `process` resolve.fallback then handles it).
- **Server capabilities (ProfileSet, ProfileDecorators) ride the `Package`
  registry** — re-export them from the server entry. See
  `.claude/rules/fhir/package-registry.md` (client + server symmetric).
- **Carry the full footprint.** `configs/` (settings), `assets/`, `design/`,
  `tests/`, `data/` belong with the package, not stranded in the old location.
- **Nested-repo packages** (their own `.git`) migrate on an `npm-migration`
  branch with history preserved; monorepo-tracked ones get a fresh `git init`.
  Boot-verify on a real `App running at`, then restore `.meteor/versions`.

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
