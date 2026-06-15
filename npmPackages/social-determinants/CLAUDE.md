# CLAUDE.md — @node-on-fhir/social-determinants

Migrated from Atmosphere `clinical:social-determinants` (2026-06-13). ONC
170.315(a)(15) — SDOH (social, psychological, behavioral) screening + assessment.
Single route `/social-determinants` (`requireAuth: true`).

## Notes

- Was monorepo-tracked (move = git rm); npm copy got a fresh `git init`.
- Two sidebar exports (`SidebarElements` collectionName Observations + `SidebarWorkflows`
  "SDOH Screening") → `sidebarItems`. Icons: `psychology`→`Psychology`,
  `health_and_safety`→`HealthAndSafety`.
- methods-only server. No Assets. core-infra deps only. `serverEntry: ./server`.
- `tests/nightwatch/170.315.a.15.test.js` carried over.
