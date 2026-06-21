# CLAUDE.md — @node-on-fhir/e-prescribing

Migrated from Atmosphere `clinical:e-prescribing` (2026-06-13). ONC
170.315(b)(3) — electronic prescribing (NCPDP SCRIPT). Route `/e-prescribing`,
settings-gated (`ePrescribing.enabled` / `.showInWorkflows`).

## Notes

- 1 route, ClinicianWorkflows → sidebarItems (`medication`→`Medication`); inline
  `FooterButtons` (New Prescription) + `ModuleConfig` preserved.
- 2 server files (methods + ncpdp-script) via `server/index.js`. No Assets.
  Monorepo-tracked → fresh `git init`. `serverEntry: ./server`.
