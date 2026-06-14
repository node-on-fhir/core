# CLAUDE.md — @node-on-fhir/synthea

Migrated from Atmosphere `clinical:synthea` (2026-06-13). Synthea synthetic
patient-data generation configuration. Route `/synthea-configuration`.

## Notes

- 1 route. Sidebar had no iconName in the original; added `Science` for a clean
  sidebar entry. server = startup + methods (methods/generateTrialsResources
  loads transitively). `scripts/` ObjectId-conversion utilities carried.
- No external deps, no Assets. Monorepo-tracked → fresh `git init`.
  `serverEntry: ./server`.
