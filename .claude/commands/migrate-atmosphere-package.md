# /migrate-atmosphere-package

Convert an Atmosphere.js package (`packages/*`) into an NPM workflow package (`npmPackages/*`).

## Usage

```
/migrate-atmosphere-package {package-name}
```

**Example:**
```
/migrate-atmosphere-package lunar-maps
```

## What This Command Does

1. Inventories the Atmosphere package (`package.js`, exports, server files, deps, git remote, license)
2. Scaffolds the NPM package structure in `npmPackages/{name}/`
3. Converts code: Atmosphere APIs → ES modules, Meteor v3 async verification, Golden Rule theming pass
4. Registers in `workflows/workflows.json` (with the `serverEntry` gotcha handled)
5. Wires the nested git repo and verifies end-to-end
6. Decommissions the Atmosphere original **only after verification and user confirmation**

## Instructions for Claude

### Step 1: Inventory the Source Package

Read and record from `packages/{name}/`:

- **`package.js`**: package name/namespace, version, summary, `api.mainModule` entries (client AND server), `api.addFiles` list (with target arch), `api.use` dependencies, `api.export` symbols
  - ⚠️ **CSS via `api.addFiles`** is auto-bundled by Atmosphere and typically imported by NOTHING — it silently stops loading after migration unless you add an explicit `import './client/{file}.css'` to client.js (found in lunar-maps proving run)
- **`index.jsx`** (or main module): which of the Honeycomb integration exports exist — `DynamicRoutes`, `AdminDynamicRoutes`, `MainPage`, `SidebarElements`, `SidebarWorkflows`, `ClinicianWorkflows`, `ConstructionZoneLinks`, `FooterButtons`, `WorkflowTabs`, collection exports
- **Server files**: methods, publications, cron/startup, collections defined
- **Dependencies on other Atmosphere packages** (e.g. orbital depends on `clinical:pantry-management`, `symptomatic:symptom-tracking`, `clinical:ecg`). ⚠️ If present, STOP and report: those packages must migrate first, or the coupling needs decoupling. Ask the user how to proceed.
- **Git state**: does `packages/{name}/.git` exist? What remote? (`git -C packages/{name} remote -v`)
- **License**: from package.js / package.json / LICENSE file
- **Assets/configs/data**: directories to carry over

### Step 2: Choose Destination + Scaffold

**Destination decision** (directory semantics, 2026-06-11):

| Package provenance | Destination | Defaults |
|--------------------|-------------|----------|
| Clinical/ONC/distribution (ships with honeycomb) | `core/{name}` | Apache-2.0, tracked in monorepo, NO nested repo |
| Personal/private/mission-specific | `extensions/{name}` | UNLICENSED + private:true, own nested repo (private remote) |

Preserve a declared license when the source has one; otherwise apply the
destination default. When provenance is ambiguous, ASK the user.

```
{core|extensions}/{name}/
├── package.json
├── workflow.json
├── client.js
├── server.js
├── CLAUDE.md            # package docs — house pattern
├── README.md
├── client/              # React components (carried over)
├── server/              # methods.js, publications.js, cron.js, collections.js
├── lib/                 # ISOMORPHIC code only — no Meteor imports, no JSX
├── assets/ configs/ data/   # carried over as-is
└── .gitignore           # node_modules/, .DS_Store, settings.*.local.json
```

#### package.json rules

```json
{
  "name": "@node-on-fhir/{name}",
  "version": "{carry over from package.js}",
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
  }
}
```

- **License**: PRESERVE the source package's existing license. If none declared, ask the user (default `UNLICENSED` + keep `"private": true`)
- **`"private": true`** always (blocks accidental `npm publish`; remove only if the user intends to publish)
- **`"type": "module"`** only if the package wants a plain-node CLI; note it in CLAUDE.md
- Add subpath exports for any `lib/` modules other packages import
- Package-specific npm deps (from `Npm.depends()` or undeclared imports) go in `dependencies`

### Step 3: Convert Code

| Atmosphere | NPM |
|-----------|-----|
| `api.mainModule('index.jsx', 'client')` | `client.js` entry |
| `api.addFiles('server/x.js', 'server')` | imported from `server.js` |
| `api.export('Foo')` | `export { Foo }` |
| `Npm.depends({...})` | `dependencies` in package.json |
| `SidebarElements` / `ConstructionZoneLinks` / `ClinicianWorkflows` | `SidebarWorkflows` in workflow.json (note original grouping in CLAUDE.md) |

**workflow.json**: derive routes from `DynamicRoutes` (name/path/component/requireAuth) and sidebar items from the sidebar exports. The `component` field maps to a `case` in client.js — every route component needs a mapping or it renders null with a console.warn. ⚠️ Atmosphere sidebar `iconName`s are often lowercase legacy names (`"map"`, `"laboratory"`) — convert to MUI icon names (`"Map"`) for workflow.json.

**client.js**: follow the component-mapping pattern from `npmPackages/CLAUDE.md`. Export `DynamicRoutes`, `SidebarWorkflows`, `FooterButtons` (array of `{pathname, element}`), plus a default export `{name, routes, sidebarItems, footerButtons}`.

**server.js**: import collections.js, methods.js, publications.js, cron.js — everything, not just methods (see Step 5 gotcha).

**Code-level checks while moving files:**

- ✅ Meteor v3 async on the server: `findOneAsync`, `insertAsync`, `updateAsync`, `removeAsync`, `countAsync`, `fetchAsync`. Flag any sync calls found
- ✅ `function() {}` (not arrow) for Meteor methods — preserves `this.userId`
- ✅ Collections the core app already registers → write/read via `global.Collections.X`; collections unique to this package → define in `server/collections.js` + client-side collection file, with `createIndexAsync` calls in `Meteor.startup`
- ✅ Isomorphic `lib/` code: `import get from 'lodash/get.js'` (per-method form — `import { get } from 'lodash'` breaks under plain-node ESM); zero `meteor/*` imports; no JSX
- ✅ No `window.location.href` for internal navigation → `Meteor.useNavigate`
- ✅ Footer buttons follow traceability: `className="footer-buttons-{name}"`, ids `{name}-{label}-footer-btn`

### Step 4: Theming Pass

Both patterns are valid post-2026-06-11 (MUI tokens are reliable; `isDark` is supported legacy) — so carried-over theming code needs NO conversion. Scan only for actual bugs:

```bash
# Unconditional hardcoded colors (not guarded by isDark/palette.mode)
grep -rn "backgroundColor: ['\"]#\|bgcolor: ['\"]#" npmPackages/{name}/client/ | grep -v "isDark\|palette.mode"
# Direct settings color reads in components (single-authority rule)
grep -rn "settings.public.theme.palette" npmPackages/{name}/client/
# Legacy !important adornments
grep -rn "!important" npmPackages/{name}/client/
```

Fix per `.claude/rules/ui/theming.md` (tokens preferred). Root page containers shouldn't set page-level `bgcolor` (StyledMainRouter paints `background.default`).

### Step 5: Register the Workflow

⚠️ **THE GOTCHA**: packages enabled only via `EXTRA_WORKFLOWS` get a default `serverEntry` of `./server/methods` — which silently skips publications, cron, and collection initialization. ALWAYS add a manifest entry.

Add to `workflows/workflows.json`:

```json
{
  "package": "@node-on-fhir/{name}",
  "entry": "./client.js",
  "serverEntry": "./server",
  "enabled": false,
  "settings": {},
  "comment": "{one-line description} — migrated from packages/{name}"
}
```

Then `npm install` (workspace glob `npmPackages/*` picks it up; verify the symlink in `node_modules/@node-on-fhir/`).

### Step 6: Git Wiring (by destination)

**`core/{name}`** — tracked in the monorepo, NO nested repo:
- If the source had a nested `.git`, do NOT copy it into core/ (embedded-repo
  mess); the original's history stays in `deprecated/{name}` and its remote
- Just `git add core/{name}` in the main repo — done

**`extensions/{name}`** — own nested repo:
- If `packages/{name}/.git` exists: copy the `.git` dir along with the files
  (history preserved) and commit the restructure on an `npm-migration` branch
  with the SAME remote (lunar-maps proving-run pattern)
- If no repo existed: `git init`, commit, then ASK the user for the remote
  (convention: `git@github.com:awatson1978/{name}.git`) and **visibility —
  default private**
- Never push without the repo existing and the user confirming visibility

### Step 7: Verify

1. Parser barrels: `EXTRA_WORKFLOWS=@node-on-fhir/{name} node -e "const P = require('./workflows/rspack.workflowParser.js'); new P({manifestPath:'./workflows/workflows.json', outputDir:'./imports/workflows'}).generate()"` — confirm the package appears in `imports/workflows/index.js` AND `server-loader.js` imports `./server` (not `./server/methods`)
2. `node --check` every plain `.js` file (JSX files are validated by Rspack at boot)
3. Boot: `EXTRA_WORKFLOWS=@node-on-fhir/{name} meteor run --settings configs/settings.honeycomb.localhost.json`
4. In browser: route renders, sidebar item appears, footer buttons appear on the route, no console errors
5. Server: methods callable, publications subscribe, cron logs its startup line
6. Compare against the Atmosphere version side-by-side if feasible (both can't be loaded simultaneously — use the route behavior checklist from Step 1 inventory)

### Step 8: Decommission (ONLY after Step 7 passes + user confirms)

1. Grep for consumers of the Atmosphere namespace first:
   `grep -rn "{namespace}:{name}" .meteor/packages packages/*/package.js imports/ server/ client/`
   — weak deps (`{weak: true}`) tolerate absence; hard deps block decommission
2. **Move, don't delete** (house pattern, established 2026-06-11):
   `mkdir -p deprecated && mv packages/{name} deprecated/{name}`
   — `deprecated/` is .meteorignore'd (excluded from builds) and .gitignore'd;
   each parked package keeps its own nested git repo for recovery
3. Check the user's real run profiles: day-to-day boots use
   `--extra-packages "ns:name, ..."` on the CLI (NOT `.meteor/packages`) —
   make sure the migrated package is removed from those lists and its
   `EXTRA_WORKFLOWS` entry added instead
4. Boot once more without the old package to confirm nothing else depended on it

### Step 9: Output Summary

```
Migrated: packages/{name} → npmPackages/{name} (@node-on-fhir/{name})

  Routes:       {list}
  Sidebar:      {list}
  Footer:       {pathnames}
  Collections:  {own vs global.Collections}
  Methods:      {count}
  Manifest:     workflows/workflows.json (serverEntry ./server, enabled: false)
  Git:          {remote, visibility}
  License:      {license}

Verification:  {checklist results}
Decommission:  {done | pending user confirmation}

Run with:
EXTRA_WORKFLOWS=@node-on-fhir/{name} meteor run --settings configs/settings.honeycomb.localhost.json
```

## Reference

- Pattern documentation: `npmPackages/CLAUDE.md`
- Migration rules: `.claude/rules/npm-packages/migration-pattern.md`
- Reference migrations: `npmPackages/hexgrid/` (game engine + UI), `npmPackages/tracss-to-fhir/` (server pipeline + CLI + cron)
- Theming: `.claude/rules/ui/theming.md` (Golden Rule)
- Scaffold-from-scratch sibling: `.claude/commands/create-npm-workflow.md`
- Backlog context: `FABLE-TECH-DEBT-PAYDOWN.md` § P1 migration
