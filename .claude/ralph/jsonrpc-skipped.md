## server/OAuthServer.js — `oauth2/authCodeGrant` (skipped 2026-07-22, batch worker)

- Token-minting OAuth infra: mints authorization codes by mocking an express
  app around `@node-oauth/express-oauth-server`'s `authCodeGrant`.
- Fibers-era code: relies on `Async.wrap` plus bare `check`/`Match`/`Async`
  globals that are never imported — almost certainly non-functional under
  Meteor v3 as-is; converting it would change (or first have to fix) behavior
  rather than preserve posture.
- Name `oauth2/authCodeGrant` (slash-namespaced, from OAuthServerConfig.methodNames)
  has no discovered callers in imports/ server/ npmPackages/ client/ tests/.
- Left as a residual `Meteor.methods(methods)` block per the skip rule;
  `./scripts/verify-rpc-methods.sh server/OAuthServer.js` FAILS as expected.

## Batch: imports/lib + imports/methods + imports/startup/server (worker C, 2026-07-22)

### imports/startup/server/middleware-anonymous.js — SKIPPED ENTIRELY (file untouched, residual Meteor.methods)
- `anonymous.login` — login method: calls `Accounts._loginMethod` (login/account-shaped, excluded by rule).
- `anonymous.convertToUser` — account conversion: mutates emails/services, calls `Accounts.setPassword` + `sendVerificationEmail` (password/account-shaped).
- `anonymous.saveData`, `anonymous.getData`, `anonymous.checkAccess` — anonymous-session flow methods that identify the caller via `this.connection.httpHeaders['x-anonymous-id']`; the ServerMethods context (userId/scopes/transport/ip/userAgent) does NOT expose the DDP connection/httpHeaders, so conversion would silently break the anonymous auth flow. Preserving posture exactly per batch instructions.

### imports/startup/server/middleware-vpn.js — SKIPPED ENTIRELY (file untouched, residual Meteor.methods)
- `vpn.login` — login method: calls `Accounts._loginMethod` (login-shaped, excluded by rule).
- `vpn.getCurrentUser` — pre-login VPN auto-login flow; reads `this.connection.httpHeaders[x-remote-user...]`, which the ServerMethods context does not expose. Conversion would break the VPN login handshake.

### imports/startup/server/middleware-mobile.js — PARTIAL (4 methods converted; 1 residual)
- `mobile.enableBiometric` — enrolls biometric credential material (public key) into `Meteor.users` `services.mobile.devices.*.biometric` (account/credential-shaped). Left in a residual Meteor.methods block; verify script FAIL on this file is expected.

## npmPackages/accounts-management/server/methods.js — SKIPPED ENTIRELY (file untouched, residual Meteor.methods) (batch worker, 2026-07-22)

Whole file is ONC 170.315(d)(1) auth / access-control account management; per the
batch special-care rule (anything that creates/modifies users, sets passwords,
mints tokens, or uses setUserId → SKIP). All five methods live in one
Meteor.methods block:
- `accounts.updateUserRoles` — MODIFIES users (`Meteor.users.updateAsync` $set roles). Account mutation → skip.
- `accounts.revokeUserTokens` — clears `services.resume.loginTokens` (token/session lifecycle) → skip.
- `accounts.getUserList`, `accounts.getUserDetails`, `accounts.getAccessControlMatrix` — admin-only reads of user/account records (login tokens, 2FA, oauth services). These are account-management reads tightly coupled in the same block with the two mutating methods; converting only the reads would leave a residual block anyway, and the file as a whole is account management. Left intact.

Left as a residual `Meteor.methods({...})` block; `./scripts/verify-rpc-methods.sh
npmPackages/accounts-management/server/methods.js` FAILS as expected.

## npmPackages/multi-factor-auth/server/methods.js — CONVERTED, but flagged for security review (admin-tools batch worker, 2026-07-22)

ONC 170.315(d)(13) MFA. All 8 methods are post-login SELF-SERVICE MFA (they
operate on the caller's own `this.userId` → `context.userId`), verify TOTP /
backup codes, and enroll/disable MFA credentials. NONE call `this.setUserId`
and NONE mint session tokens, so per the skip rule they were NOT skipped — all
converted to `Meteor.ServerMethods.define`. Auth guards deleted → requireAuth
default true, EXCEPT `mfa.checkStatus` (`requireAuth:false` — historically
returned a not-configured default pre-login; guard preserved as a graceful
early return). `this.connection.clientAddress` → `context.ip ||
context.connection?.clientAddress`.

**FLAGGED for a dedicated security review** (credential verification / enrollment
— confirm the DDP-shim adapter + requireAuth semantics preserve the pre-migration
auth posture exactly):
- `mfa.setupTOTP` — verifies a TOTP code and ENROLLS TOTP + hashed backup codes.
- `mfa.verifyTOTP` — TOTP credential verification.
- `mfa.verifyBackupCode` — one-time backup-code verification + consumption.
- `mfa.generateNewBackupCodes` — regenerates backup-code credentials.
- `mfa.disable` — disables the MFA credential (gated on a TOTP confirmation code).

## Batch: admin-tools + healthcare-surveys + allergy/case/drug/immunization/reference/workqueues (admin-tools batch worker, 2026-07-22)

All 14 batch files converted cleanly (no full-file skips). Notes:
- admin-tools destructive/settings-gated methods (delete/archive/rename/
  anonymize): the `feature-disabled` gate check on
  `settings.private.allowPatient{Archival,Rename,Anonymization}` /
  `settings.public.defaults.allowPatientDeletion` is PRESERVED inside each handler
  body (fires regardless of requireAuth). The `adminTools.check*Setting` probes +
  `adminTools.getConnectionInfo` kept `requireAuth:false` (pre-auth consumers).
- admin-tools/methods.js: the 8 db-admin methods had their auth guards COMMENTED
  OUT pre-migration (guard-less by intent) → now requireAuth default true
  (behavior change: dropCollection/executeMethod etc. previously callable without
  login).
- healthcare-surveys: `healthcare-surveys.*` → camelCase `healthcareSurveys.*`
  with the hyphenated legacy names as aliases (hyphen forbidden by the
  dotted-canonical regex). `server/methods/surveyMethods.js` is DEAD CODE (never
  wired into the loader; ValidatedMethods reference undefined globals) — only its
  residual `Meteor.methods` ping block was converted (public health check).
- referenceApp.createBulkExportGroup + immunizationRegistry.validateVaccineCode:
  were guard-less; validateVaccineCode is genuinely public (static CVX lookup,
  requireAuth:false); createBulkExportGroup mutates data → requireAuth default
  true (behavior change flagged).
