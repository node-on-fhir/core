# CLAUDE.md — @node-on-fhir/smart-web-messaging

Migrated from Atmosphere `smart-web-messaging` (2026-06-13, MIT). HL7 SMART Web Messaging — the postMessage transport/handlers/scratchpad between an EHR host and embedded SMART apps.

**Library package, not a route workflow.** The Atmosphere package had no `api.mainModule`; it used `api.addFiles` + `api.export` to publish `SmartWebMessaging`, `MessageTypes`, `Activities`, `LaunchStatusCodes`, `UrlValidator` as shared globals, with ~20 consumer files referencing them BARE (no ESM imports — only 2 relative imports exist in the whole package). Because those files contain no ESM syntax, Rspack executes them as non-strict scripts, preserving the Atmosphere window-global semantics (unlike hipaa-compliance, whose files mixed import/export → strict → bare-globals broke).

- `client.js` / `server/index.js` reproduce the `api.addFiles` client/server order as **side-effect imports** so the globals install and the handlers/services/components/methods/publications register. No source edits.
- Default export carries **empty routes/sidebar** (pure infrastructure, no UI nav).
- `package.json` `exports` expose the library subpaths (`SmartWebMessaging`, the constants, `UrlValidator`) for other packages.
- `guide/` (HL7 submodule), `examples/`, `tests/` (tinytest) not copied. Submodule → fresh git init. No Npm.depends.
