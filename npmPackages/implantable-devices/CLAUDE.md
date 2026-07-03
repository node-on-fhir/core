# CLAUDE.md — @node-on-fhir/implantable-devices

Migrated from Atmosphere `clinical:implantable-devices` (2026-06-13). ONC
170.315(g)(7) — implantable device registry (UDI/GUDID). Settings-gated
(`implantableDevices.enabled` / `.showInWorkflows`).

## Notes

- 2 routes: `/implantable-devices` and `/implantable-devices/:id` (renders
  `<ImplantableDevicesPage viewMode="detail"/>` via a distinct component key).
- Clinician + Patient workflows → sidebarItems (`memory`→`Memory`,
  `settings`→`Settings`); inline `FooterButtons` (Register Device) + `ModuleConfig`.
- methods-only server. No external deps, no Assets. Monorepo-tracked → fresh
  `git init`. `serverEntry: ./server`.
