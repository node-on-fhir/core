# /create-npm-workflow

Create a new NPM workflow package for Honeycomb EHR.

> **Refreshed 2026-06-12** to current doctrine: destination-aware scaffolding
> (`core/` vs `extensions/`), license/visibility prompt, the `serverEntry`
> manifest gotcha, nested-repo git wiring, and theme tokens (NOT the retired
> `isDark` Golden Rule). Aligned with `/migrate-atmosphere-package`.

## Usage

```
/create-npm-workflow {WorkflowName}
```

**Example:** `/create-npm-workflow PatientTimeline`

## Instructions for Claude

### Step 1: Derive Names

From the input `{Name}` (e.g. "PatientTimeline"):
- `packageName`: kebab-case (`patient-timeline`)
- `componentName`: PascalCase + "Page" (`PatientTimelinePage`)
- `methodPrefix`: camelCase (`patientTimeline`)
- `displayName`: Title Case (`Patient Timeline`)

### Step 2: Choose Destination + License (ASK)

Before scaffolding, ask where the package lives (2026-06-11 architecture):

| Destination | Provenance | License | Git posture |
|-------------|-----------|---------|-------------|
| `core/{name}` | ships with the distribution (clinical/ONC/framework) | **Apache-2.0** | tracked in monorepo, NO nested repo |
| `extensions/{name}` | private / user-defined / mission-specific / trade-secret | **UNLICENSED** + `"private": true` | own nested git repo, private remote |

**Do NOT create new packages in `npmPackages/`** — it is legacy-transitional and
draining into `core/`/`extensions/`. See `core/CLAUDE.md` / `extensions/CLAUDE.md`.
When provenance is ambiguous, ASK. Apply the destination's license below.

### Step 3: Create Files

Create these in `{core|extensions}/{packageName}/`:

#### package.json
```json
{
  "name": "@node-on-fhir/{packageName}",
  "version": "0.1.0",
  "description": "{displayName} workflow for Honeycomb EHR",
  "main": "client.js",
  "private": true,
  "exports": {
    ".": "./client.js",
    "./server": "./server.js",
    "./workflow": "./workflow.json"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "@mui/material": "^5.0.0",
    "@mui/icons-material": "^5.0.0",
    "lodash": "^4.17.0"
  },
  "keywords": ["fhir", "healthcare", "honeycomb", "workflow"],
  "author": "Clinical Meteor",
  "license": "Apache-2.0"
}
```
- `license`: `Apache-2.0` for `core/`, `UNLICENSED` for `extensions/`.
- `"private": true` always (blocks accidental `npm publish`).
- Export **`./server`** (NOT `./server/methods`) — see the Step 4 gotcha.
- Add `"type": "module"` only if the package ships a plain-node CLI or wants
  `node --test` lib tests (then point tests at `node --test`).

#### workflow.json
```json
{
  "name": "{packageName}",
  "displayName": "{displayName}",
  "routes": [
    { "name": "{componentName}", "path": "/{packageName}", "component": "{componentName}", "requireAuth": false }
  ],
  "sidebarItems": [
    { "primaryText": "{displayName}", "to": "/{packageName}", "iconName": "Extension", "requireAuth": false }
  ]
}
```
- `iconName` must be a **PascalCase** `@mui/icons-material` export (`Extension`,
  `Map`, `Timeline` — NOT lowercase legacy names). The workflow parser's
  `validateWorkflows()` warns at build time on lowercase/unknown icons.
- Every `route.component` needs a matching `case` in client.js (Step 3) or it
  renders null with a console.warn (also flagged by the parser).

#### client.js
```javascript
// {core|extensions}/{packageName}/client.js
import React from 'react';
import {componentName} from './client/{componentName}.jsx';
import workflowConfig from './workflow.json';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  switch (route.component) {
    case '{componentName}': element = <{componentName} />; break;
    default: console.warn('[{packageName}] Unknown component: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
});

const SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
});

// Footer buttons (optional): array of { pathname, element }. Follow the
// traceability rule — className="footer-buttons-{packageName}",
// ids "{packageName}-{label}-footer-btn".
const FooterButtons = [];

export { DynamicRoutes, SidebarWorkflows, FooterButtons, {componentName} };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows,
  footerButtons: FooterButtons
};
```

#### server.js
```javascript
// {core|extensions}/{packageName}/server.js
// Import EVERYTHING the server needs — collections, methods, publications, cron.
// (server/index.js re-exports/imports them; do NOT import only ./server/methods.)
import './server/index.js';
console.log('[{packageName}] Server entry loaded');
```

#### server/index.js
```javascript
// {core|extensions}/{packageName}/server/index.js
import './methods.js';
// import './collections.js';
// import './publications.js';
// import './cron.js';
```

#### server/methods.js
```javascript
// {core|extensions}/{packageName}/server/methods.js
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
  '{methodPrefix}.getData': async function(id) {     // function(), not arrow — preserves this.userId
    check(id, String);
    if (!this.userId) { throw new Meteor.Error('not-authorized', 'You must be logged in'); }
    console.log('[{methodPrefix}.getData] Fetching:', id);
    // return await SomeCollection.findOneAsync({ _id: id });   // Meteor v3 async
    return { id: id, timestamp: new Date().toISOString() };
  }
});

console.log('[{packageName}] Server methods registered');
```

#### client/{componentName}.jsx
```javascript
// {core|extensions}/{packageName}/client/{componentName}.jsx
import React from 'react';
import { Container, Card, CardHeader, CardContent, Typography } from '@mui/material';
import ExtensionIcon from '@mui/icons-material/Extension';

// Theme tokens (preferred, post-2026-06-11 root fix — mode-agnostic, no isDark
// boilerplate). Do NOT set a page-level bgcolor; StyledMainRouter paints it.
function {componentName}() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }} id="{packageName}Page">
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader avatar={<ExtensionIcon />} title="{displayName}"
          sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }} />
        <CardContent>
          <Typography variant="body1" sx={{ color: 'text.primary' }}>
            {displayName} workflow page. Edit this component to add functionality.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}

export default {componentName};
```

#### README.md
Minimal: name, one-line purpose, the `EXTRA_WORKFLOWS=…` run command, route.

### Step 4: Register in the manifest (THE GOTCHA)

⚠️ A package enabled only via `EXTRA_WORKFLOWS` defaults its `serverEntry` to
`./server/methods`, which **silently skips publications, cron, and collection
init**. ALWAYS add a `workflows/workflows.json` entry:

```json
{
  "package": "@node-on-fhir/{packageName}",
  "entry": "./client.js",
  "serverEntry": "./server",
  "enabled": false,
  "settings": {},
  "comment": "{one-line description}"
}
```

### Step 5: Git Wiring (by destination)

- **`core/{name}`** — tracked in the monorepo, NO nested repo. Just create files;
  `git add core/{name}` in the main repo.
- **`extensions/{name}`** — own nested repo: `git init` inside the package,
  commit, then ASK the user for the remote (convention
  `git@github.com:{owner}/{name}.git`) and **visibility (default private)**.
  Never push without the repo existing and the user confirming visibility.

### Step 6: Install + Verify

1. `npm install` (workspace glob picks up the package; confirm the symlink in
   `node_modules/@node-on-fhir/{packageName}`).
2. Parser barrel + validation:
   `EXTRA_WORKFLOWS=@node-on-fhir/{packageName} node -e "const P=require('./workflows/rspack.workflowParser.js'); new P({manifestPath:'./workflows/workflows.json',outputDir:'./imports/workflows'}).generate()"`
   — confirm it validates clean and server-loader imports `./server`.
3. Boot: `EXTRA_WORKFLOWS=@node-on-fhir/{packageName} meteor run --settings settings/settings.honeycomb.localhost.json`
   — route renders, sidebar item appears, server methods register, no console errors.

### Step 7: Output Summary

```
Created NPM workflow package: @node-on-fhir/{packageName}  →  {core|extensions}/{packageName}
  License:   {Apache-2.0 | UNLICENSED}
  Manifest:  workflows/workflows.json (serverEntry ./server, enabled: false)
  Git:       {tracked in monorepo | nested repo @ remote (visibility)}
Run with:
  EXTRA_WORKFLOWS=@node-on-fhir/{packageName} meteor run --settings settings/settings.honeycomb.localhost.json
```

## Reference

- Pattern docs: `npmPackages/CLAUDE.md`, `core/CLAUDE.md`, `extensions/CLAUDE.md`
- Sibling command: `.claude/commands/migrate-atmosphere-package.md` (shares these conventions)
- Rules: `.claude/rules/npm-packages/migration-pattern.md`, `.claude/rules/ui/theming.md`,
  `.claude/rules/ui/footer-buttons.md`
- Reference packages: `npmPackages/hexgrid/`, `npmPackages/tracss-to-fhir/`,
  `npmPackages/lunar-maps/`, `npmPackages/life-support-systems/`
