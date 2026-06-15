# CLAUDE.md — @node-on-fhir/accounts-management

Migrated from Atmosphere `clinical:accounts-management` (2026-06-14, MIT). User accounts + access-control management UI. Single route `/accounts-management` (`requireAuth`), no sidebar item (reached by URL / header menu, matching the Atmosphere index.jsx which exported only `DynamicRoutes`).

**Not actually gated.** The `clinical:accounts` dependency the old package.js carried lives in the `Package.onTest` block (test-only, alongside `tinytest`) — NOT `Package.onUse`. Source never ES-imports it. The real onUse deps were all app-level infra (`accounts-base`, `accounts-password`, `clinical:extended-api`, `clinical:hl7-resource-datatypes`) which the host app already provides; source doesn't ES-import the `clinical:*` ones either. Clean migration (same false-gate pattern as consent-generator / vital-signs).

**Structure:** `client/AccountsManagementPage.jsx` (+ `client/AccessControlMatrix.jsx`), `server/{methods,publications}.js` (side-effect imports via `server/index.js`). No external npm deps, no old-MUI, no Atmosphere-isms, no `meteor/http`. Server exposes no Package-registry symbols → `Package['@node-on-fhir/accounts-management'] = {}` (harmless). Monorepo-tracked → fresh git init.
