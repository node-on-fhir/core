# Interstate Interoperability Toolkit — Extension Migration Design

**Date:** 2026-06-29
**Package:** `@orbital/interstate-interoperability`
**Source prototype:** `workzone/us-interstate-interoperability-profiles/interstate-interoperability-toolkit/src`
**Status:** Approved

## Goal

Migrate a standalone webpack/React prototype (a tabbed map-based "interstate
interoperability toolkit") into a NodeOnFHIR **extension** workflow package
following honeycomb patterns and best practices. Default route:
`/interstate-toolkit`.

## Source analysis

- Single monolithic `App.js` (~3,272 lines): one `App()` component + a
  `CustomTabPanel` helper, with **51 `useState` hooks** and ~40 handler/helper
  functions.
- **Five active tabs** (CustomTabPanel index 0–4): *View Topic Maps*,
  *Search Location*, *Compare Locations*, *Create National Map*,
  *Create State Consent*. A sixth tab, *Scan Health Record*, is **disabled**.
- Mapping via `google-map-react` + the Google Geocoding REST API. The Maps API
  key is currently typed into a text field and held in component state.
- `langchain` and `@xenova/transformers` are declared in `package.json` but
  **never imported** in `App.js` (only the disabled tab would use them).
- Geodata: 69 MB total, but only **~4.7 MB is actually imported** — 12
  `Locations.US.States.*.js` topic layers + 45 `Consent-*.json` + `us_states.json`.
  The remaining **64 MB is orphaned** (`Locations.HSA.json` 56 MB,
  `Hospitals.geojson` 6.8 MB, several geojsons) and is not referenced anywhere.
- `App.scss` is 7 lines of hardcoded `body{background:#ddd}` / `h1{color:red}`.

## Decisions (confirmed with user)

1. **Maps key:** settings + manual-field fallback, mirroring `pacio-core`.
   `GOOGLE_MAPS_API_KEY` env var or `Meteor.settings(.private).google.mapsApiKey`.
2. **Geodata:** copy the **used set only (~4.7 MB)** into `data/`, direct ES
   import. Drop the 64 MB of orphans.
3. **Refactor depth:** **decompose** the monolith into per-tab components.
4. **Drop** `langchain`, `@xenova/transformers`, the disabled *Scan Health
   Record* tab, and the webpack/babel/sass toolchain.
5. **Scope** stays `@orbital/` as written (sibling `lantern` uses `@orbital/`).

## Package structure

```
extensions/interstate-interoperability/
├── package.json            # @orbital/interstate-interoperability, private, UNLICENSED
├── workflow.json           # one route /interstate-toolkit, one sidebar item
├── client.js               # DynamicRoutes + SidebarWorkflows (element:, import React)
├── server.js               # re-export ./server/methods
├── server/methods.js       # interstateInteroperability.getGoogleMapsApiKey
├── client/
│   ├── InteroperabilityToolkitPage.jsx   # container: shared state, map, tab switch
│   ├── components/
│   │   ├── MapCanvas.jsx                  # GoogleMapReact wrapper + key fetch
│   │   ├── TopicMapsTab.jsx               # tab 0
│   │   ├── SearchLocationTab.jsx          # tab 1
│   │   ├── CompareLocationsTab.jsx        # tab 2
│   │   ├── NationalMapTab.jsx             # tab 3
│   │   └── StateConsentTab.jsx            # tab 4 (AceEditor lazy + ErrorBoundary/Suspense)
│   └── lib/topicLayers.js                # config-driven replacement for 13 handleToggle* fns
├── data/                   # ~4.7 MB used geodata only
│   ├── us_states.json
│   ├── Locations.US.States.*.js   (12 topic layers)
│   └── Consent-*.json             (45 states)
├── README.md · CLAUDE.md · .gitignore
```

## Component architecture

- **`InteroperabilityToolkitPage.jsx`** (container) owns: the grouped shared
  state, `generateMap(index)`, the geocode + `fetchConsent` handlers, tab index,
  and the Maps key. Renders MUI `Tabs` + the five tab panels, passing
  state/handlers down as props. No patient context (not patient-scoped).
- **Tab components** are presentational: receive props, render their panel JSX.
- **`MapCanvas.jsx`** wraps `GoogleMapReact`, fetches the key via the server
  method on mount, and renders the manual-key fallback field when no key is
  configured.
- **`topicLayers.js`** replaces the 13 near-identical `handleToggle*` functions
  with a config array (`{ key, label, layer, color }`) + one
  `toggleTopicLayer(key)` reducer in the container.

## Server method (mirrors pacio-core)

```js
'interstateInteroperability.getGoogleMapsApiKey': async function() {
  let apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    apiKey = Meteor.settings?.private?.google?.mapsApiKey
          || Meteor.settings?.google?.mapsApiKey;
    if (apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') apiKey = null;
  }
  if (!apiKey) throw new Meteor.Error('api-key-not-found', 'Google Maps API key is not configured');
  return apiKey;
}
```
Client: `Meteor.callAsync('interstateInteroperability.getGoogleMapsApiKey')` on
mount; on success use the key, on `api-key-not-found` keep the manual field active.

## NodeOnFHIR conventions applied

- Routes use `element: <Comp/>`, `import React from 'react'` in `client.js`.
- `react-ace` lazy-loaded with `ErrorBoundary` (outer) + `Suspense` (inner).
- Theme tokens (`background.paper`, `text.primary`, `divider`) — drop `App.scss`.
- `lodash get/set` retained; `function(){}` syntax for the Meteor method;
  `[interstateInteroperability]` console prefixes.

## Dependencies

- `dependencies`: `google-map-react`, `react-ace`, `ace-builds`
- `peerDependencies`: `react`, `@mui/material`, `@mui/icons-material`,
  `@emotion/react`, `@emotion/styled`, `lodash`
- Dropped: `langchain`, `@xenova/transformers`, webpack/babel/sass/*-loader.

## Registration & git

- Add to `workflows/workflows.json` (`serverEntry: "./server"`).
- `extensions/*` workspace glob → `npm install` symlinks it.
- Nested git repo: `git init`, private remote convention
  `git@github.com:awatson1978/interstate-interoperability.git`.

## Verification

`npm install` → `EXTRA_WORKFLOWS=@orbital/interstate-interoperability meteor run
--settings settings/settings.honeycomb.localhost.json` → load
`/interstate-toolkit`; confirm all 5 tabs render, topic toggles repaint the
map, the map appears when a key is configured (and the manual field appears when
not), and the AceEditor lazy-loads on the State Consent tab.

## Out of scope

- The disabled *Scan Health Record* tab and its ML pipeline.
- The 64 MB of orphaned geodata.
- Any FHIR server / collection wiring (the toolkit is a self-contained SPA).
