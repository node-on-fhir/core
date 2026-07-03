# CLAUDE.md — @node-on-fhir/family-health-history

Migrated from Atmosphere `clinical:family-health-history` (2026-06-13). ONC
170.315(a)(12) — family health history with family-tree visualization + genetic
risk analysis. Single route `/family-health-history` (`requireAuth: true`).

## Notes

- Was monorepo-tracked (move = git rm); npm copy got a fresh `git init`.
- Two Atmosphere sidebar exports (`SidebarElements` with `collectionName:
  FamilyMemberHistories` badge, + `SidebarWorkflows` "Family Tree") consolidated
  into `sidebarItems`. Icons: `family_restroom`→`FamilyRestroom`,
  `account_tree`→`AccountTree`.
- No Assets, core-infra deps only. `serverEntry: ./server` (methods + publications).
- `tests/nightwatch/170.315.a.12.test.js` carried over (Atmosphere-style E2E).
