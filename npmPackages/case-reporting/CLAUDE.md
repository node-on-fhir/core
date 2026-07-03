# CLAUDE.md — @node-on-fhir/case-reporting

Migrated from Atmosphere `clinical:case-reporting` (2026-06-13). ONC
170.315(f)(5) — electronic case reporting (eCR) for automated public-health
reporting. Single route `/case-reporting` (`requireAuth: true`).

## Notes

- Was monorepo-tracked (move = git rm); npm copy got a fresh `git init`.
- Two Atmosphere sidebar exports (`SidebarWorkflows` "Case Reporting" +
  `ClinicianWorkflows` "Electronic Case Reports") consolidated into
  `sidebarItems`. Icons: `report`→`Report`, `publicHealth`→`HealthAndSafety`
  (no MUI `publicHealth` icon).
- Server is `methods.js` only (no publications). `serverEntry: ./server`.
- No Assets, core-infra deps only. `tests/nightwatch/170.315.f.5.test.js` carried.
