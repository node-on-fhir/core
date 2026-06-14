# CLAUDE.md — @node-on-fhir/immunization-registry

Migrated from Atmosphere `clinical:immunization-registry` (2026-06-13). ONC
170.315(f)(1) — immunization registry reporting. Route `/immunization-registry`.

## Notes

- Monorepo-tracked (move = git rm); npm copy got a fresh `git init`.
- The large `guides/who-immunizations/` FHIR IG tree (WHO SMART immunizations —
  FML maps, sushi/IG tooling) was **NOT carried** — authoring tooling, not
  runtime. Stays with the original in `deprecated/`.
- SidebarWorkflows + ClinicianWorkflows → sidebarItems; `vaccines`→`Vaccines`,
  `shield`→`Shield`. methods-only server. `serverEntry: ./server`.
