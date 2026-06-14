# CLAUDE.md — @node-on-fhir/drug-formulary

Migrated from Atmosphere `clinical:drug-formulary` (2026-06-13). ONC
170.315(a)(10) — drug formulary + preferred drug list checks. Route
`/drug-formulary`.

## Notes

- Monorepo-tracked (move = git rm of ~124 files); npm copy got a fresh `git init`.
- The large `guides/emedicinal-product-info/` FHIR IG tree (FSH profiles, IG
  template, pagecontent) was **NOT carried** — authoring tooling, not runtime.
  Stays with the original in `deprecated/`.
- `SidebarElements` (collectionName FormularyDrugs) → `sidebarItems`;
  `pharmacy`→`LocalPharmacy`. server = methods + publications. `serverEntry: ./server`.
