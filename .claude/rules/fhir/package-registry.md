# Package Registry — how NPM workflow packages expose server-side capabilities

## Why this exists

The honeycomb server discovers certain capabilities by **iterating the global
`Package` object** — the Atmosphere package registry. Two FHIR-conformance
mechanisms work this way today:

| Capability | Discovered in | Feeds |
|------------|---------------|-------|
| `ProfileSet` | `server/Metadata.js` (`discoverProfileSets()`) | `CapabilityStatement.rest.resource.supportedProfile` (ONC (g)(10)) |
| `ProfileDecorators` | `server/RestHelpers.js` (`Meteor.startup`) | REST egress decoration (apply IG requirements at response time) |

Both do `Object.keys(Package).forEach(name => { if (Package[name].ProfileSet) … })`.

Atmosphere packages land in `Package` automatically via `api.export('ProfileSet')`.
**NPM workflow packages are not Atmosphere packages**, so they are *not* in `Package`
by default — which means a migrated profile provider (e.g. `us-core`) would silently
drop out of the CapabilityStatement and stop decorating responses.

## The convention

**NPM workflow packages register their server module into `Package['<package-name>']`**,
so the existing discovery loops find them with no change to the discovery code and no
per-package boilerplate.

This is done **automatically** by the generated workflow server-loader
(`imports/workflows/server-loader.js`, emitted by `workflows/rspack.workflowParser.js`):

```js
// generated
import * as _serverModule0 from '@node-on-fhir/us-core/server';
globalThis.Package = globalThis.Package || {};
globalThis.Package['@node-on-fhir/us-core'] = _serverModule0;
```

So a package only has to **re-export** its discoverable symbols from its server entry:

```js
// npmPackages/us-core/server.js
export * from './server/index.js';

// npmPackages/us-core/server/index.js
export const ProfileSet = { name: 'US Core', profiles: { Patient: [ /* urls */ ], … } };
export const ProfileDecorators = { Patient: patientDecorator, Organization: organizationDecorator };
```

Packages whose server entry re-exports nothing register as `Package['<pkg>'] = {}` —
harmless (the discovery checks `Package[name].ProfileSet` etc., which is undefined).

## Client-side symmetry

Atmosphere's `Package` global existed on **both** client and server, so some
consumers gate UI on a package's presence client-side — e.g.
`if (Package['@node-on-fhir/pacio-core']) { /* show Advance Directives nav */ }`.
To keep that working for npm packages, the generated **client** loader
(`imports/workflows/loader.js`) also registers each workflow's client module:

```js
// generated (client loader)
globalThis.Package = globalThis.Package || {};
workflowModules.forEach(({ name, module }) => {
  globalThis.Package[name] = module.default || module;
});
```

So `Package['<pkg>']` is truthy on the client too (its value is the client
entry's exports; on the server it's the server entry's exports — same split
Atmosphere had). This registration runs at client loader module-load, before any
component renders, so render-time checks are safe. Consumers migrated off the old
Atmosphere key (`Package['clinical:pacio-core']`) point at the npm key
(`Package['@node-on-fhir/pacio-core']`) uniformly on both sides.

## Discovery must be LAZY (load-order safety)

The server-loader registers packages into `Package` during **module load**. Any
discovery that reads `Package` at **module-load time** may run before the loader and
miss npm packages. Therefore discovery must read `Package` lazily:

- `server/Metadata.js` — `discoverProfileSets()` iterates `Package` **at
  CapabilityStatement-build time** (on demand, post-startup). ✔ load-order safe.
- `server/RestHelpers.js` — discovers in `Meteor.startup`, which runs after all
  module loads. ✔ load-order safe.

If you add a NEW `Package`-registry consumer, read `Package` lazily (in a request
handler or `Meteor.startup`), never at module top level.

## Adding a new server-discoverable capability

1. The npm package `export`s the symbol from its server entry (re-exported through
   `server.js` so the loader's `import * as` captures it).
2. The consumer iterates `Package` **lazily** for `Package[name].YourSymbol`.
3. Document it in the table above.

## Related

- Generator: `workflows/rspack.workflowParser.js` (server-loader emission)
- Consumers: `server/Metadata.js`, `server/RestHelpers.js`
- First npm provider: `npmPackages/us-core` (US Core ProfileSet + ProfileDecorators)
- Atmosphere equivalent: `api.export(...)` in a package's `package.js`
