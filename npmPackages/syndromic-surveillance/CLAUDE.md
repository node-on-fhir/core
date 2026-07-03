# CLAUDE.md — @node-on-fhir/syndromic-surveillance

Migrated from Atmosphere `clinical:syndromic-surveillance` (2026-06-13). ONC
170.315(f)(2) — transmission to public health agencies. Single route
`/syndromic-surveillance` (`requireAuth: true`).

## Notes

- Was **monorepo-tracked** (not a nested repo); the npm copy got a fresh
  `git init` (original history remains in the monorepo; original moved to
  `deprecated/`).
- `SidebarElements` (Atmosphere) → `sidebarItems` on the default export, keeping
  `collectionName: MeasureReports` (badge count) and `timeline`→`Timeline` icon.
- No Assets, no cross-package deps (core infra only). `serverEntry: ./server`.
- `tests/nightwatch/170.315.f.2.test.js` carried over (Atmosphere-style E2E).
