# CLAUDE.md — @node-on-fhir/multi-factor-auth

Migrated from Atmosphere `clinical:multi-factor-auth` (2026-06-13). ONC
170.315(d)(13) — MFA (TOTP + backup codes).

## Notes

- 3 routes: `/mfa-setup`, `/mfa-management`, `/account-security` (the last reuses
  MFAManagementPage). `security`→`Security`. Two no-op Atmosphere footers → `[]`.
- The existing `server/index.js` is KEPT as the server entry (imports MFACore +
  methods, sets `Accounts.onLogin` MFA hooks + the `mfa.status` publication);
  `server.js` just delegates to it. `serverEntry: ./server`.
- Dropped the `Package['clinical:multi-factor-auth']` global. `lib/MFACore.js`
  carried. Monorepo-tracked → fresh `git init`.
