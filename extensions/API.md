# Extension / Workflow Package API Reference

The complete export surface a workflow package (in `npmPackages/`, `core/`, or
`extensions/`) can expose to the honeycomb host app. All three directories load
identically — packages resolve by name via node_modules symlinks; the directory
is only a git/licensing posture (see `extensions/CLAUDE.md`).

There are three integration surfaces:

1. **The default export of `client.js`** — consumed by
   `WorkflowRegistry.registerWorkflow()` (routes, sidebar, footer, and the
   **components override map**).
2. **Named exports of `client.js`** — scanned at runtime through
   `globalThis.Package['<pkg-name>']` (Atmosphere-compatible discovery).
3. **`workflow.json`** — build-time route/sidebar/server-entry declaration
   parsed by `workflows/rspack.workflowParser.js`.

---

## 1. Default export (`client.js`)

```javascript
// extensions/my-brand/client.js
export default {
  name: 'my-brand',                    // required — registry identity, dedup key
  routes: DynamicRoutes,               // [{ name, path, element, requireAuth, requirePatient }]
  sidebarItems: SidebarWorkflows,      // [{ primaryText, to, iconName, requireAuth }]
  footerButtons: FooterButtons,        // [{ pathname, element }] — additive, not override
  patientsDirectoryButtons: [...],     // buttons for PatientsTable expanded rows
  serverConfigs: [...],                // React elements for /server-configuration
  components: {                        // ⭐ component override map — see § 2
    AboutPage: BrandAboutPage,
    WelcomePage: BrandWelcome,
    Sidebar: BrandSidebar
  }
};
```

### zIndex precedence

Package precedence is the `zIndex` resolved by the workflow parser
(central manifest → the package's own `workflow.json` → default `0`; CSS
mnemonic — higher sits on top):

- **routes / sidebarItems**: sorted DESC (first-match-wins consumers).
- **footerButtons**: sorted ASC (Footer.jsx is last-match-wins).
- **components**: higher zIndex wins the slot; on a tie the earlier
  registration wins. Every conflict logs a console warning naming both
  packages and the winner.

---

## 2. The `components` override map

Lets ONE brand/workflow package replace select terminal components of the host
app — pages and chrome that don't take children — with custom-branded
alternatives. Only a single package per runtime is expected to use this map
(typically the brand package for the compiled app); the registry tolerates
multiples via zIndex, but every duplicate slot logs a warning.

Values may be **component references (preferred)** or JSX elements (legacy
style — wrapped once at registration into a zero-prop component). Unknown keys
log a typo warning but are still stored for forward compatibility.

### Canonical slots (16)

| Key | Default implementation | Rendered by | Props contract |
|-----|------------------------|-------------|----------------|
| `AboutPage` | `imports/ui/extensible/AboutPage.jsx` | `/about` route (settings-gated `businessPages.about.enabled`) | none |
| `PrivacyPage` | `imports/ui/extensible/PrivacyPage.jsx` | `/privacy` | none |
| `SupportPage` | `imports/ui/extensible/SupportPage.jsx` | `/support` | none |
| `TermsPage` | `imports/ui/extensible/TermsPage.jsx` | `/terms`, `/terms-and-conditions` | none |
| `EulaPage` | `imports/ui/extensible/EulaPage.jsx` | `/eula` | none |
| `WelcomePage` | `imports/ui/extensible/WelcomePage.jsx` | root `/` fallback + `/welcome-to-node-on-fhir` | none — the root SPLASH PAGE, not the welcome dialog (see § legacy `welcomeComponent`) |
| `NotFoundPage` | `imports/ui/extensible/NotFoundPage.jsx` | router wildcard `*` (404) | none — keep `id="notFoundPage"` if tests matter to you |
| `NoAuthorizationPage` | `imports/ui/extensible/NoAuthorizationPage.jsx` | `AuthGuard` when signed out | none — keep `id="notAuthorizedPage"` for ONC suites |
| `NoSelectedPatientPage` | `imports/ui/extensible/NoSelectedPatientPage.jsx` | `PatientGuard` when no patient selected | none |
| `NoDataPage` | `imports/ui/extensible/NoDataPage.jsx` | `DataGuard` when `dataCount` is 0 | `{ title, subheader, buttonLabel, noDataImagePath, marginTop, redirectPath, titleVariant }` |
| `ErrorPage` | `imports/ui/extensible/ErrorPage.jsx` | per-route `ErrorBoundary` on render crash | `{ routePath }` |
| `LoadingPage` | `imports/ui/extensible/LoadingPage.jsx` | auth handshake, workflow-loading states | `{ message? }` |
| `Sidebar` | `imports/patient/PatientSidebar.jsx` | `SideDrawer` (replaces drawer CONTENTS; the Drawer shell/toggle stays core) | `{ history, ...drawerProps }` |
| `Header` | `imports/ui/Header.jsx` | app chrome (full replacement) | `{ drawerIsOpen, handleDrawerOpen, headerNavigation, history }` |
| `ProminentHeader` | `imports/ui/extensible/ProminentHeader.jsx` | inside Header's Collapse when `defaults.prominentHeader` + patient selected | `{ patient, lastUpdated }` — self-tracks `Session.get('selectedPatient')` when `patient` absent. **Must stay 64px tall** (`--header-height` math assumes it) |
| `Footer` | `imports/ui/Footer.jsx` | app chrome (full replacement) | `{ drawerIsOpen, location, history }` — a full replacement takes over footer-button rendering; the additive `footerButtons` mechanism lives in the default Footer |

### Guards vs fallback pages

Guard logic is core and NOT overridable — you override the **fallback pages**
guards render:

| Guard (core) | Path | Renders on block |
|--------------|------|------------------|
| `AuthGuard` | `imports/ui/guards/AuthGuard.jsx` | `NoAuthorizationPage` (or `LoadingPage` mid-handshake) |
| `PatientGuard` | `imports/ui/guards/PatientGuard.jsx` | `NoSelectedPatientPage` |
| `DataGuard` | `imports/ui/guards/DataGuard.jsx` | `NoDataPage` (card props pass through) |

Routes opt in via `requireAuth: true` / `requirePatient: true` in
`workflow.json` or route objects.

### Rules of the road

- **Do NOT register a `path: '*'` route** to customize the 404 — use
  `components: { NotFoundPage }`; the router's wildcard goes through the
  components map only.
- Component references over elements: `AboutPage: BrandAboutPage`, not
  `AboutPage: <BrandAboutPage />`. Elements are accepted for legacy parity but
  can't receive props from the render site.
- Consumption is render-time (`useOverridableComponent`), so overrides apply
  whether registered at boot or late.

### Host-side API (for core/consumer code)

```javascript
import WorkflowRegistry from '/imports/lib/WorkflowRegistry.js';
WorkflowRegistry.getComponent('AboutPage');          // component | null
WorkflowRegistry.registerComponent(name, value, { zIndex, workflowName });

import { useOverridableComponent } from '/imports/ui/hooks/useOverridableComponent.js';
const Page = useOverridableComponent('AboutPage', DefaultAboutPage);  // reactive
```

---

## 3. Deprecated surfaces (still work; log warnings)

| Legacy | Replacement | Notes |
|--------|-------------|-------|
| default-export key `notFoundPage` | `components: { NotFoundPage }` | mapped automatically + deprecation warning |
| default-export key `noPatientSelectedPage` | `components: { NoSelectedPatientPage }` | mapped automatically + warning |
| default-export key `welcomeComponent` | none yet — **dialog slot, distinct from `WelcomePage`** | `WelcomeDialog.jsx` clones it with `{ open, onClose, dontShowAgain, onDontShowAgainChange }`. It is deliberately excluded from `getComponent('WelcomePage')` — a dialog must not render at `/` |
| `Meteor.NotSignedInWrapper` | `AuthGuard` (`imports/ui/guards/AuthGuard.jsx`) | global resolves to AuthGuard; old card props ignored; auth source is `Meteor.user()` |
| `Meteor.NoDataWrapper` | `DataGuard` (`imports/ui/guards/DataGuard.jsx`) | global resolves to DataGuard; card overridable via `NoDataPage` |
| import `imports/ui/components/AuthenticatedRoute.jsx` | `imports/ui/guards/AuthGuard.jsx` | alias shim, warns at import |
| import `imports/ui/components/RequirePatientRoute.jsx` | `imports/ui/guards/PatientGuard.jsx` | alias shim |
| import `imports/ui/NoDataWrapper.jsx` / `NotSignedInWrapper.jsx` | `DataGuard` / `AuthGuard` | alias shims |
| import `imports/ui/components/NotAuthorized.jsx` | `imports/ui/extensible/NoAuthorizationPage.jsx` | alias shim |
| import `imports/ui/components/NoPatientSelectedPage.jsx` | `imports/ui/extensible/NoSelectedPatientPage.jsx` | alias shim (note the name normalization) |
| import `imports/ui/pages/index.business.js` | `imports/ui/extensible/*.jsx` | deprecated barrel |

---

## 4. Named exports scanned at runtime

The generated client loader registers each package's client module at
`globalThis.Package['<pkg-name>']`; host code scans these Atmosphere-style.
Check lazily (at render), never at module scope — the loader registers after
sibling modules import.

| Named export | Scanned by | Status |
|--------------|-----------|--------|
| `DynamicRoutes` | `App.jsx` Package scan | live (also via default export `routes`) |
| `FooterButtons` | `Footer.jsx` | live |
| `SidebarWorkflows` | `PatientSidebar.jsx` | live |
| `ConstructionZoneLinks` | `PatientSidebar.jsx` | live |
| `MainPage` | `App.jsx` root resolution | legacy (Atmosphere-era `/` override; prefer `components.WelcomePage` or `defaults.route`) |
| `AdminDynamicRoutes`, `AdminSidebarElements`, `SidebarElements`, `ClinicianWorkflows`, `WorkflowTabs`, `ModuleConfig` | — | **orphaned** — no active consumer; kept for documentation of historical surface |

---

## 5. `workflow.json` (build-time)

```json
{
  "name": "my-brand",
  "displayName": "My Brand",
  "routes": [{ "name": "Landing", "path": "/landing", "component": "LandingPage", "requireAuth": false, "requirePatient": false }],
  "sidebarItems": [{ "primaryText": "Landing", "to": "/landing", "iconName": "Home" }],
  "serverEntry": "./server",
  "hooksEntry": "./server/hooks",
  "zIndex": 10
}
```

- `serverEntry`: **always declare `"./server"`** — the built-in default
  `./server/methods` silently skips publications/cron/collections and breaks
  under exports-gated package.json subpaths (see root `CLAUDE.md`).
- Resolution precedence: central manifest (`workflows/workflows.json`, reserved
  for `@node-on-fhir/*`) → the package's own `workflow.json` → defaults.
- Private extensions activate via `EXTRA_WORKFLOWS=@scope/pkg meteor run ...`
  and stay OUT of the central manifest.

---

## Related

- Package format & server patterns: `npmPackages/CLAUDE.md`
- Directory/licensing contract: `extensions/CLAUDE.md`
- Registry implementation: `imports/lib/WorkflowRegistry.js` (+ unit tests in
  `WorkflowRegistry.test.mjs`, `npm run test:workflow-registry`)
- Parser: `workflows/rspack.workflowParser.js`
