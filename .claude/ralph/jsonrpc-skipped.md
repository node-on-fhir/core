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
