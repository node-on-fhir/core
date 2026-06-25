# Harmonizing the workflow-package API onto a single PascalCase contract

**Status:** proposal / plan. The as-built contract (two doors, mixed casing) is
documented in [`API.md`](./API.md). This doc defines the **target** and the
phased path to it.

## The goal

Today a workflow package reaches the host through **two parallel doors**:

1. **`WorkflowRegistry`** — a typed default-export object, **camelCase** keys
   (`routes`, `sidebarItems`, `footerButtons`, …), read via `getX()` getters.
2. **`Package[pkg].X`** — Atmosphere-style **PascalCase** named exports
   (`DynamicRoutes`, `FooterButtons`, `ProfileSet`, …), discovered by host code
   iterating `Object.keys(Package)`.

The target is **one discovery API**: `WorkflowRegistry` is the sole channel for
npm workflow capabilities, and its contract keys are **PascalCase**.

> **`Package` does not go away.** It is Meteor's own Atmosphere registry and the
> app still legitimately uses it for genuine Atmosphere deps (`clinical:autopublish`
> across the `SimpleSchemas`, `alanning:roles`). "Single API" means *workflow
> packages* stop using `Package` as a discovery channel — not that the global is
> deleted. See [What stays on `Package`](#what-stays-on-package).

## Why PascalCase (the elegant part)

The legacy named exports are **already PascalCase**. If the registry adopts
PascalCase keys, the two doors collapse onto the **same token**: a package writes
`FooterButtons` once, and it means the same thing whether the host reads it off
the default export or off the module namespace. camelCase would keep
`footerButtons` (registry) and `FooterButtons` (named export) divergent forever.

Concretely: **9 of the 16 canonical keys are already the exact `Package` named-export
spelling, and no package that used named exports has to rename anything.** Only the
camelCase default-export users rename — and even they get an alias grace period.

## The canonical contract

A package declares capabilities with PascalCase keys, on its default export
(client + server). Arrays accumulate across packages; singletons are last-writer-wins.

| Concept | Canonical key | Kind | Today: registry key | Today: `Package` export |
|---------|---------------|------|---------------------|-------------------------|
| Identity | `Name` | string | `name` | — |
| Routes | `DynamicRoutes` | array | `routes` | `DynamicRoutes` |
| Landing (`/`) override | `MainPage` | singleton | — | `MainPage` |
| Workflow sidebar group | `SidebarWorkflows` | array | `sidebarItems` | `SidebarWorkflows` |
| FHIR-module sidebar | `SidebarElements` | array | — | `SidebarElements` |
| Clinician sidebar group | `ClinicianWorkflows` | array | — | `ClinicianWorkflows` |
| Construction-zone links | `ConstructionZoneLinks` | array | — | `ConstructionZoneLinks` |
| Footer buttons | `FooterButtons` | array | `footerButtons` | `FooterButtons` |
| Header tabs | `WorkflowTabs` | array | — | `WorkflowTabs` |
| Patients-table row buttons | `PatientsDirectoryButtons` | array | `patientsDirectoryButtons` | `PatientsDirectoryButtons` |
| Server-config tabs | `ServerConfigs` | array | `serverConfigs` | `ServerConfigs` |
| Custom 404 | `NotFoundPage` | singleton | `notFoundPage` | — |
| Welcome dialog | `WelcomeComponent` | singleton | `welcomeComponent` | — |
| Profiles → CapabilityStatement | `ProfileSet` | object | — | `ProfileSet` |
| REST egress decorators | `ProfileDecorators` | object | — | `ProfileDecorators` |
| FHIR SearchParameters | `SearchParametersRegistry` | object | — | `SearchParametersRegistry` |

Target package shape:

```js
// client.js
export default {
  Name: 'my-workflow',
  DynamicRoutes: [{ name, path, element, requireAuth }],
  SidebarWorkflows: [{ primaryText, to, iconName }],
  FooterButtons: [{ pathname, element }],
  // …only the keys this package needs
};

// server.js
export default {
  Name: 'my-workflow',
  ProfileSet: { name, profiles: { Patient: [/* urls */] } },
  ProfileDecorators: { Patient: decoratePatient },
  SearchParametersRegistry: { searchParameters: [/* SearchParameter[] */] },
};
```

### Aliases (non-breaking transition)

`registerWorkflow()` normalizes legacy keys so **nothing breaks on day one**:

```js
const KEY_ALIASES = {
  name: 'Name',
  routes: 'DynamicRoutes',
  sidebarItems: 'SidebarWorkflows',
  footerButtons: 'FooterButtons',
  patientsDirectoryButtons: 'PatientsDirectoryButtons',
  serverConfigs: 'ServerConfigs',
  notFoundPage: 'NotFoundPage',
  welcomeComponent: 'WelcomeComponent',
};
```

Aliases are accepted indefinitely during migration and can be dropped once all
packages and the template emit PascalCase. The other 8 canonical keys already
*are* their legacy spelling, so they need no alias.

## Design of the harmonized registry

### 1. `WorkflowRegistry` accepts PascalCase + aliases

```js
function canonicalize(workflow) {
  const out = {};
  Object.keys(workflow || {}).forEach(function(k) {
    out[KEY_ALIASES[k] || k] = workflow[k];
  });
  return out;
}
// registerWorkflow() reads out.DynamicRoutes, out.SidebarWorkflows, … and
// pushes arrays into per-bucket stores; assigns singletons.
```

New buckets to add (the registry already has Routes/Sidebar/Footer/PatientsButtons/
ServerConfigs/NotFound/Welcome equivalents): `MainPage`, `SidebarElements`,
`ClinicianWorkflows`, `ConstructionZoneLinks`, `WorkflowTabs`, plus the three
server buckets `ProfileSet`, `ProfileDecorators`, `SearchParametersRegistry`,
plus a `has(name)` helper (replaces `Package[x]` presence checks).

> **Getter method names stay camelCase** (JS idiom): `getRoutes()`,
> `getSidebarWorkflows()`, etc. PascalCase is the *input contract* (what packages
> export), not the JS method surface. Keeping existing getter names
> (`getRoutes()`, `getSidebarItems()`, …) returning the renamed buckets means
> **zero churn at consumer call sites** — the rename is contained to the registry.
> Renaming getters for symmetry is optional polish, deferred.

### 2. The loader adapter — why packages don't have to change

The generated loader does `import * as module` per package, so it sees the **whole
namespace**. Make the codegen in `workflows/rspack.workflowParser.js`
(`generateLoader` / `generateServerLoader`) fold **both doors** into one registry
call:

```js
function toWorkflow(module) {
  return Object.assign(
    canonicalize(module.default || {}),     // default export (camel or Pascal)
    pickNamed(module, CANONICAL_KEYS)        // top-level named exports (PascalCase)
  );
}
WorkflowRegistry.registerWorkflow(toWorkflow(module));
```

Because the adapter reads named exports too, **a package that still uses the old
`export { DynamicRoutes, FooterButtons }` form is fully supported** — it just flows
through the registry now instead of `Package`. Per-package migration to a clean
PascalCase default export becomes **opportunistic, never required**.

### 3. Server-side registry

`WorkflowRegistry` is a plain object literal with no imports — it is **isomorphic**
and is not currently imported on the server. The server loader can import the same
module and populate `ProfileSet` / `ProfileDecorators` / `SearchParametersRegistry`.
Client and server are separate runtimes, so each populates its own singleton — which
is exactly what we want.

## Migrating the consumers

Rewrite each host site that iterates `Package` **for a workflow symbol** to read the
registry getter instead. Preserve each site's settings gate verbatim — the gates
live in the consumer, not the package.

| Host site | Symbol | Becomes |
|-----------|--------|---------|
| `App.jsx:1151` | `DynamicRoutes`, `MainPage` | `getRoutes()` / `getMainPage()` |
| `Index.jsx:509` | `DynamicRoutes` | `getRoutes()` |
| `Header.jsx:69` | `WorkflowTabs` | `getWorkflowTabs()` |
| `Footer.jsx:104` | `FooterButtons` | `getFooterButtons()` *(already dual — drop the Package half)* |
| `PatientSidebar.jsx:426` | `ConstructionZoneLinks` | `getConstructionZoneLinks()` |
| `PatientSidebar.jsx:683` | `SidebarElements` | `getSidebarElements()` |
| `PatientSidebar.jsx:713` | `SidebarWorkflows` | `getSidebarWorkflows()` *(already dual)* |
| `PatientSidebar.jsx:728` | `ClinicianWorkflows` | `getClinicianWorkflows()` |
| `PatientsTable.jsx:193` | `PatientsDirectoryButtons` | `getPatientsDirectoryButtons()` *(already dual)* |
| `ServerConfigurationPage.jsx:796` | `ServerConfigs` | `getServerConfigsWithNames()` *(already dual)* |
| `server/Metadata.js:46` | `ProfileSet` | `getProfileSets()` ⚠️ certification |
| `server/RestHelpers.js:21` | `ProfileDecorators` | `getProfileDecorators()` ⚠️ certification |
| `server/SearchParametersEngine.js:235` | `SearchParametersRegistry` | `getSearchParameters()` |

⚠️ = `ProfileSet`/`ProfileDecorators` feed the CapabilityStatement and REST egress —
these are ONC (g)(10) conformance paths and need a metadata + egress regression
check, not just a smoke test.

## What stays on `Package`

Leave these alone — they are genuine Atmosphere or out of scope:

- `Package['clinical:autopublish']` (dozens of `SimpleSchemas/*.js`), `alanning:roles`
  — real Atmosphere packages.

And fix these as a **separate, prior bug-fix** (independent of harmonization):

- Presence checks against **pre-migration names** that are now almost certainly
  dead: `Package['clinical:ecg']` (`DicomViewerPage.jsx:61`),
  `Package['clinical:data-importer']` (`MyProfilePage.jsx:592`),
  `Package['symptomatic:mcp']` (`WelcomeDialog.jsx:611`, `MyProfilePage.jsx:904`),
  `Package['clinical:patient-characteristics']` (`PatientSidebar.jsx:1238`),
  `Package['clinical:hipaa-compliance']` incl. the `.HipaaLogger` **named-export
  read** (`HipaaLogger.js:33-34,71-72`). These should move to
  `WorkflowRegistry.has('@node-on-fhir/…')`. The `HipaaLogger` case reads a *module
  export*, so it needs either a registry module-accessor or to stay on `Package` —
  the one genuinely messy spot.

## Phased plan & effort

| Phase | Work | Effort | Risk |
|-------|------|--------|------|
| **0. Pre-fix (optional, independent)** | Repoint the stale pre-migration presence checks to `WorkflowRegistry.has()`. Likely fixes currently-dead features. | ~0.5 day | Low |
| **1. Registry + adapter + docs** | PascalCase keys + alias map + new buckets + `has()` in `WorkflowRegistry.js`; teach loader/server-loader codegen to fold both doors; update `example-workflow` template, `create-npm-workflow` skill, and `npmPackages/CLAUDE.md` to PascalCase. | ~2 days | Low — nothing observable changes; both doors still feed the registry. |
| **2. Flip consumers to registry-only** | Rewrite the 13 sites above; delete the `Package` iteration for workflow symbols; keep settings gates. | ~1.5 days | **Medium-high** — the two ⚠️ certification paths. |
| **3. Retire `Package` as the workflow channel** | Stop `globalThis.Package[name] = …` for workflow modules in both generated loaders. | ~0.5 day | Medium — depends on Phase 0 + 2 fully landing first. |

**~4.5 days total.** Phases 1–2 (~3.5 days) deliver the actual goal (one PascalCase
read API); Phase 3 is the final cleanup. **Per-package rewrites cost $0** — the
adapter accepts the legacy named-export shape, so packages converge to the
PascalCase default export opportunistically.

The PascalCase choice (vs. camelCase) adds cost **only in Phase 1** (alias map +
template/skill/doc updates) — it does **not** touch the Phase 2 consumer rewrites,
because those read through getters whose method names don't change.

## Acceptance checklist

- [ ] `registerWorkflow()` reads PascalCase canonical keys; `KEY_ALIASES` maps the 8 legacy camelCase keys.
- [ ] New buckets + getters: `MainPage`, `SidebarElements`, `ClinicianWorkflows`, `ConstructionZoneLinks`, `WorkflowTabs`, `ProfileSet`, `ProfileDecorators`, `SearchParametersRegistry`; plus `has(name)`.
- [ ] Loader codegen folds default-export **and** named exports into one `registerWorkflow` call (client + server).
- [ ] All 13 consumer sites read the registry; no `Object.keys(Package)` loop reads a workflow symbol.
- [ ] CapabilityStatement `supportedProfile` and REST egress decoration verified unchanged (US Core / PACIO).
- [ ] `example-workflow`, `create-npm-workflow`, and `npmPackages/CLAUDE.md` emit/teach PascalCase.
- [ ] `globalThis.Package[name]` no longer set for workflow modules; genuine Atmosphere (`autopublish`, `alanning:roles`) untouched.

## Related

- [`API.md`](./API.md) — the as-built contract (two doors, mixed casing)
- `imports/lib/WorkflowRegistry.js` — door 1
- `workflows/rspack.workflowParser.js` — loader codegen (where the adapter lives)
- `.claude/rules/fhir/package-registry.md` — door 2 (server `Package` discovery)
- `npmPackages/CLAUDE.md` — package authoring guide (update target in Phase 1)
