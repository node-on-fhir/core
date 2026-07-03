# npmPackages API — the workflow-package contract the host app consumes

This document is the **consumer-side contract**: the specific export surface the
main Honeycomb app looks for in a workflow package. It is *not* an inventory of
everything packages export — a package can export a hundred pages and components;
only the symbols listed here are ones the **host app itself reaches in and reads**.

If you are building or migrating a package, this is the list of names that "do
something" when the app loads your package. Everything else you export is yours
to import explicitly; the host will never look for it by name.

> **How this doc was derived:** by grepping the host (`imports/`, `server/`,
> `client/`) for every place it reads a package symbol — `Package[name].X` and
> `WorkflowRegistry.getX()` — not by reading what packages export. Each entry
> below cites the host file:line that consumes it, so it stays verifiable.

> **This documents the contract as-built (two doors, mixed casing).** For the
> proposed single, PascalCase contract — and the phased plan to get there — see
> [`HARMONIZATION.md`](./HARMONIZATION.md).

---

## Two delivery mechanisms (one package, two doors)

A workflow package reaches the host through **two parallel discovery systems**.
Both are live; most contract symbols can arrive through either door, and for
several the host reads **both and concatenates**.

### 1. `WorkflowRegistry` — the typed default export (preferred)

The build emits `imports/workflows/loader.js`, which calls
`WorkflowRegistry.registerWorkflow(module.default)` for every enabled package
(`imports/workflows/loader.js:26`). The registry copies a **fixed set of keys**
off your default-export object (`imports/lib/WorkflowRegistry.js:32-88`). Anything
not in that key set is ignored by the registry.

```js
// client.js
export default {
  name: 'my-workflow',          // string — dedup key + log label
  routes: DynamicRoutes,        // → getRoutes()
  sidebarItems: SidebarWorkflows,
  footerButtons: [...],
  patientsDirectoryButtons: [...],
  serverConfigs: [...],
  notFoundPage: <MyNotFound />, // singleton — last writer wins
  welcomeComponent: <MyWelcome />
};
```

### 2. `Package[packageName].X` — the named-export registry (legacy, still load-bearing)

The Atmosphere era discovered capabilities by iterating a global `Package`
object. That mechanism is preserved: the generated client loader
(`loader.js:18-21`) and server loader (`server-loader.js:18-28`) register each
workflow module into `globalThis.Package['<pkg-name>']` on **both** client and
server. Host code then does `Object.keys(Package).forEach(...)` and reads
**named exports** off each module.

```js
// client.js — these are read by NAME off the module namespace, so keep them as
// named exports (NOT nested inside default).
export { DynamicRoutes, MainPage, SidebarWorkflows, FooterButtons /* … */ };
```

Because `Package['<pkg>']` is set to `module.default || module` on the client and
to the server namespace on the server, the named exports the host iterates must
be present on whichever object that resolves to. In practice: **export them as
named exports from `client.js` / `server.js`.**

### Which door to use

| | `WorkflowRegistry` (default export) | `Package[...]` named export |
|---|---|---|
| Style | Modern, typed, recommended for new packages | Legacy Atmosphere-compatible |
| Discovery | `registerWorkflow(default)` | `Object.keys(Package)` iteration |
| Client/server | Client routes/UI + (separately) server | Client **and** server symmetric |
| Use it for | New packages, plain route/sidebar/footer needs | Anything with no registry key (see table) — `MainPage`, `WorkflowTabs`, `ConstructionZoneLinks`, `ProfileSet`, `ProfileDecorators`, `SearchParametersRegistry`, `SidebarElements`, `ClinicianWorkflows` |

Several symbols exist in **both** systems and are merged by the host (footer
buttons, sidebar items, patients-directory buttons, server-config tabs, routes).
You do not need to provide both; pick one door per symbol.

---

## The contract — client/UI symbols

Each row: the symbol, the door(s) the host reads it through, the host file:line
that consumes it, the shape, and any settings gate.

### Routes

| Symbol | Door | Consumed by | Shape |
|--------|------|-------------|-------|
| `routes` | registry | `App.jsx:1141` (`getRoutes()`), reactively via `WorkflowRegistry.subscribe` `App.jsx:123` | `[{ name, path, element, requireAuth?, description? }]` |
| `DynamicRoutes` | `Package` | `App.jsx:1152-1154`, also `Index.jsx:510` | same as `routes` |
| `MainPage` | `Package` | `App.jsx:1178-1180` | a **single** route object `{ path: '/', element }` (the `/` landing override) |

**Routes must use `element: <Comp />`, not `component: Comp`.** The host renders
`route.element` directly; the `React.createElement(route.component)` path is
commented out (`App.jsx:1157-1159`) and silently renders nothing. `element`
requires `import React from 'react'` in `client.js`.

> **`MainPage` gotcha:** the host reads `MainPage` *inside* the
> `if (Package[pkg].DynamicRoutes)` guard (`App.jsx:1178`). A package that exports
> `MainPage` but no `DynamicRoutes` is skipped. Export `DynamicRoutes` (an empty
> array is fine) alongside `MainPage`. The root route also competes with
> `settings.public.defaults.route`, which wins if set (`App.jsx:1192-1213`).

### Sidebar

| Symbol | Door | Consumed by | Shape | Settings gate |
|--------|------|-------------|-------|---------------|
| `sidebarItems` | registry | `PatientSidebar.jsx:704` (`getSidebarItems()`) | `[{ primaryText, to, iconName, requireAuth? }]` | `…sidebar.menuItems.SidebarWorkflows` (and **not** `WorkflowsFromSettings`) |
| `SidebarWorkflows` | `Package` | `PatientSidebar.jsx:714-716` | same | same as above |
| `SidebarElements` | `Package` | `PatientSidebar.jsx:684-686` | `[{ primaryText, to, iconName, requireAuth?, collectionName? }]` — `collectionName` drives a badge count | `…sidebar.menuItems.FhirModules` |
| `ClinicianWorkflows` | `Package` | `PatientSidebar.jsx:729-731` | same as `SidebarWorkflows` | `…sidebar.menuItems.ClinicianWorkflows` |
| `ConstructionZoneLinks` | `Package` | `PatientSidebar.jsx:427-428` | `[{ label, icon, to }]` — `icon` is a string parsed by `parseIcon()` (e.g. `'fire'`); rendered in the "construction zone" group | — |

`iconName` is resolved through the sidebar's `parseIcon()` switch; unknown names
fall back to a default icon. (For workflow.json sidebar items, the build also
validates `iconName` against `@mui/icons-material` — see the build section.)

### Footer

| Symbol | Door | Consumed by | Shape |
|--------|------|-------------|-------|
| `footerButtons` | registry | `Footer.jsx:114` (`getFooterButtons()`) | `[{ pathname, element, settings?, onClick?, label? }]` |
| `FooterButtons` | `Package` | `Footer.jsx:105-107` | same |

Footer buttons are **route-scoped**: the host renders a button only when
`location.pathname` matches `buttonConfig.pathname` (a string, or an array of
strings — `Footer.jsx:124-130`). If `settings` is present and that settings path
is `false`, the button is suppressed (`Footer.jsx:134`). If `element` is set it is
cloned with the footer's props; otherwise a `<Button onClick label>` is rendered
(`Footer.jsx:138-150`). See `.claude/rules/ui/footer-buttons.md` for the id/className
traceability convention.

### Header

| Symbol | Door | Consumed by | Shape |
|--------|------|-------------|-------|
| `WorkflowTabs` | `Package` | `Header.jsx:70-72` | `[<Tab … />]` — an array of React elements pushed into the header tab strip |

`WorkflowTabs` has **no `WorkflowRegistry` equivalent** — it is `Package`-only.

### Patients table

| Symbol | Door | Consumed by | Shape |
|--------|------|-------------|-------|
| `patientsDirectoryButtons` | registry | `PatientsTable.jsx:205` (`getPatientsDirectoryButtons()`) | `[{ id, label, icon, color, onClick(patientId, patient) }]` |
| `PatientsDirectoryButtons` | `Package` | `PatientsTable.jsx:197-200` | same |

Per-row action buttons on the patients directory; both sources are concatenated
on mount (`PatientsTable.jsx:188-216`).

### Server configuration page

| Symbol | Door | Consumed by | Shape |
|--------|------|-------------|-------|
| `serverConfigs` | registry | `ServerConfigurationPage.jsx:807` (`getServerConfigsWithNames()`) | `[<ConfigComponent />]` — array of React elements; rendered as a tab labeled by workflow name |
| `ServerConfigs` | `Package` | `ServerConfigurationPage.jsx:797-801` | same; rendered as a tab labeled by package name |

> **Casing mismatch (intentional, historical):** the registry key is
> `serverConfigs` (camelCase, on your default export) but the `Package` named
> export is `ServerConfigs` (PascalCase). They feed the same UI through different
> doors. Use whichever door matches the door you chose for the rest of the package.

### Singletons (last writer wins)

| Symbol | Door | Consumed by | Shape |
|--------|------|-------------|-------|
| `notFoundPage` | registry | `App.jsx:1986` (`getNotFoundPage()`) | a React element — overrides the app's 404 page |
| `welcomeComponent` | registry | `WelcomeDialog.jsx:659-666` | a React element — cloned with `{ open, onClose, dontShowAgain, onDontShowAgainChange }` |

These are **not arrays** — the registry stores a single value
(`WorkflowRegistry.js:74-82`), so the last package to register one wins.

---

## The contract — server symbols (FHIR conformance)

These are read on the **server**, via the `Package` registry only, **lazily**
(after module load) so they survive the loader's registration order. Re-export
them from your package's `server.js`. See `.claude/rules/fhir/package-registry.md`.

| Symbol | Consumed by | Shape | Feeds |
|--------|-------------|-------|-------|
| `ProfileSet` | `server/Metadata.js:46-47` (`discoverProfileSets()`, called at CapabilityStatement-build time) | `{ name, profiles: { ResourceType: [profileUrl, …] } }` | `CapabilityStatement.rest.resource.supportedProfile` (ONC (g)(10)) |
| `ProfileDecorators` | `server/RestHelpers.js:22-30` (in `Meteor.startup`) | `{ ResourceType: function(resource, requestedProfile) { … } }` | REST egress decoration — applies IG requirements at response time |
| `SearchParametersRegistry` | `server/SearchParametersEngine.js:238-251` (during `compile()`) | `{ searchParameters: [ {resourceType:'SearchParameter', …} ] }` (or an async `getSearchParameters()` variant) | adds package-defined FHIR `SearchParameter`s to the search→MongoDB query compiler |

If you add a new server-side `Package`-registry capability, **read `Package`
lazily** (inside a request handler or `Meteor.startup`), never at module top
level — the loader populates `Package` during module load.

---

## Named exports the app does NOT consume

These appear in older docs / inherited Atmosphere `index.jsx` files but have **no
consumer anywhere in the host** (verified by repo-wide grep). Exporting them does
nothing; do not treat them as API:

| Symbol | Status |
|--------|--------|
| `AdminDynamicRoutes` | No consumer — admin routes are not separately discovered |
| `AdminSidebarElements` | No consumer |
| `FooterElements` | No consumer (the live footer symbol is `FooterButtons`) |
| `ModuleConfig` | No consumer — `App.jsx`'s `getFhirModuleConfig` reads **settings**, not a package export |

If you need admin-gated routes or sidebar items, use the normal `routes` /
`SidebarElements` exports plus a `requireAuth` flag or a settings gate — there is
no separate admin discovery channel.

---

## The build manifest contract (how a package gets loaded at all)

Exporting the symbols above does nothing until the package is **enabled** for a
build. Enablement is driven by `workflows/rspack.workflowParser.js`, which reads
two sources and generates the three barrel files in `imports/workflows/`.

### Sources of enablement

1. **`workflows/workflows.json`** — the manifest. Each entry:
   ```json
   {
     "package": "@node-on-fhir/my-workflow",
     "entry": "./client.js",        // client module (default ./client.js)
     "serverEntry": "./server",     // server module — SEE WARNING BELOW
     "hooksEntry": "./server/hooks",// optional; an init* fn is auto-called at startup
     "enabled": false,              // flip true for local dev
     "settings": {}                 // passed through to the workflow module
   }
   ```
2. **`EXTRA_WORKFLOWS` env var** — comma-separated package names, added on top of
   the manifest's enabled set (`rspack.workflowParser.js:51-76`):
   ```bash
   EXTRA_WORKFLOWS=@node-on-fhir/us-core,@node-on-fhir/pacio-core meteor run --settings settings/…json
   ```

Either way, the parser verifies the package actually resolves (`require.resolve`)
before including it, then emits:

- `imports/workflows/index.js` — `import * as` each enabled module → `workflowModules[]`
- `imports/workflows/loader.js` — `registerWorkflows()` (registry) + client `Package` registration
- `imports/workflows/server-loader.js` — server module imports + server `Package` registration + `initializeWorkflowHooks()`

These three files are **auto-generated — do not edit** (they are regenerated on
every build).

> **`serverEntry` gotcha:** if you omit `serverEntry`, it defaults to
> `./server/methods` (`rspack.workflowParser.js:69,367`), which loads only your
> methods file and **silently skips publications, cron, and collection init**.
> Set `"serverEntry": "./server"` and have `server.js` re-export everything
> (methods, publications, `ProfileSet`, `ProfileDecorators`). The parser warns
> about this at build time (`:146-149`).

### `workflow.json` (per-package route/sidebar config)

`client.js` typically derives `DynamicRoutes`/`SidebarWorkflows` from a
`workflow.json`. The build **validates** it (`rspack.workflowParser.js:125-236`)
and will **fail the build** on hard errors:

- `routes[]` require string `name`, `path`, `component`; `path` must start with `/`.
- `sidebarItems[]` require string `primaryText`, `to`, `iconName`.

and **warn** on soft issues (a `route.component` not referenced in `client.js`
→ renders null; a lowercase/unknown MUI `iconName`).

Note the **two route representations**: `workflow.json` uses `component` (a
**string** name), which your `client.js` maps to a real component and emits as
`element` in the runtime route object the host actually renders. The string→element
mapping is your `client.js`'s job.

---

## Quick reference — full consumed surface

```
WorkflowRegistry default-export keys (imports/lib/WorkflowRegistry.js):
  name, routes, sidebarItems, footerButtons,
  patientsDirectoryButtons, serverConfigs, notFoundPage, welcomeComponent

Package[pkg].X named exports the host iterates:
  client: DynamicRoutes, MainPage, SidebarElements, SidebarWorkflows,
          ClinicianWorkflows, ConstructionZoneLinks, FooterButtons,
          WorkflowTabs, PatientsDirectoryButtons, ServerConfigs
  server: ProfileSet, ProfileDecorators, SearchParametersRegistry

NOT consumed (ignore): AdminDynamicRoutes, AdminSidebarElements,
                       FooterElements, ModuleConfig
```

## Related

- `npmPackages/CLAUDE.md` — package authoring guide, structure, migration notes
- `imports/lib/WorkflowRegistry.js` — the typed registry (source of truth for door 1)
- `workflows/rspack.workflowParser.js` — manifest → barrel-file generation
- `.claude/rules/fhir/package-registry.md` — `Package` registry + server discovery (door 2)
- `.claude/rules/ui/footer-buttons.md` — footer button id/className traceability
- `.claude/rules/npm-packages/migration-pattern.md` — package pattern rules
