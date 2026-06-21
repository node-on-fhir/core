# CLAUDE.md — @node-on-fhir/secure-messaging

Migrated from Atmosphere `clinical:secure-messaging` (2026-06-13). ONC
170.315(e)(2) secure messaging + (h)(1) Direct Project. Settings-gated
(`secureMessaging.enabled` / `.showInWorkflows`).

## Notes

- 3 routes, two rendering `<SecureMessagingPage defaultTab=…/>` (direct, patient)
  — encoded as distinct component keys in workflow.json.
- PatientWorkflows + ClinicianWorkflows → sidebarItems (`message`→`Message`,
  `mail`→`Mail`, `security`→`Security`, `chat`→`Chat`). Inline `FooterButtons`
  (Compose Message) + `ModuleConfig` export preserved.
- 2 server files (methods + direct-protocol) via `server/index.js`. No Assets.
  Monorepo-tracked → fresh `git init`. `serverEntry: ./server`.
