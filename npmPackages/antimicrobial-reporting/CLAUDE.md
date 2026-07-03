# CLAUDE.md — @node-on-fhir/antimicrobial-reporting

Migrated from Atmosphere `clinical:antimicrobial-reporting` (2026-06-13). ONC
170.315(f)(6) — antimicrobial use + resistance reporting. Route
`/antimicrobial-reporting` (`requireAuth: true`).

## Notes

- Was monorepo-tracked (move = git rm of ~75 files); npm copy got a fresh `git init`.
- The Atmosphere package's large `guide/` FHIR IG-authoring tree (FSH source, CQL
  files, sushi/IG build scripts, images) was **NOT carried over** — it's
  authoring tooling, not runtime workflow code. It stays with the original in
  `deprecated/`.
- SidebarWorkflows + ClinicianWorkflows → sidebarItems; `biotech`→`Biotech`,
  `coronavirus`→`Coronavirus`. methods-only server. `serverEntry: ./server`.
