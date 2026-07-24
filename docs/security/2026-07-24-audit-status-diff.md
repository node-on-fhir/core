# Security Audit Status Diff — 2026-07-24

> Finding-by-finding re-verification of
> [2026-07-01-honeycomb-security-audit.md](2026-07-01-honeycomb-security-audit.md)
> against main at `2815170a`, in preparation for the remediation campaign.
> Every status below was verified by direct grep/read this session. The
> original audit is preserved unmodified as the analysis record.

## What changed structurally since 2026-07-01 (affects the remediation plan)

1. **The ServerMethods pipeline landed** (the audit's "synergy note"
   architecture is no longer planned — it exists). `server/Methods.js`,
   `SyntheaMethods.js`, `ProxyRelay.js`, `extensions/merkalis/server/methods.js`,
   and `extensions/ipfs-swarm/server/methods.js` have already been migrated
   onto it. Method-auth findings are now remediated by
   `ServerMethods.define(..., {requireAuth: true})`, not hand-rolled
   `this.userId` checks.
2. **The reproduction harness changed.** `tests/mocha/` still runs **0 tests**
   under rspack (issue #171) — do NOT write reproduction tests there. The
   proven, CI-wired paths are `tests/rpc/` (`node --test` conformance/method
   suites) and `scripts/endpoint-smoke-test.sh` (curl battery against a booted
   server, runs in every CI test group).
3. **A gitleaks CI gate exists** (`.gitleaks.toml`, triaged 2026-07-23) — but
   it does NOT cover `extensions/*` (gitignored nested repos, absent from the
   CI checkout) and does not flag the low-entropy committed secrets
   (the pacio account-server token, the default admin password — literals
   quoted only in the 2026-07-01 audit record). CR-5/6/HI-9/10
   are therefore still fully open despite a green secret-scan job.
4. **Structured logging + PHI redaction shipped** (the audit's deferred
   dependency); the July browser-log audit PII-dump tier is fixed.
5. **`server/core-startup.js` no longer exists** — security-header middleware
   moved; all `core-startup.js` line refs in the audit are dead. Re-locate
   before fixing ME-6/CR-2 assertion work.
6. **File/line drift throughout** — updated anchors are in the table below.
7. **The care-commons Galaxy config moved**:
   `npmPackages/care-commons.meteorapp.com/settings/…` (audit) →
   `extensions/care-commons-sandbox/settings/settings.pacio-core.2026.galaxy.json`
   (nested repo). Secret-rotation checklist must point at the new path, and
   fixes there commit to the *nested* repo.

## Finding status table

| ID | Status 2026-07-24 | Evidence / updated anchors |
|----|-------------------|----------------------------|
| CR-1 | **OPEN** | `OAuthEndpoints.js:918` TODO still present; `jwt.decode(client_assertion)` at `:884` |
| CR-2 | **OPEN** | 12 settings files still ship `disableOauth: true`; no startup assertion exists anywhere |
| CR-3 | **OPEN** | `authQuery` built only in search GET (`:1279`) and POST `_search` (`:2503`). Instance GET `:598`, PUT `:1876`, PATCH `:2076`+`:2177`, DELETE `:2188`+`:2232` unfiltered. ⚠️ PATCH and DELETE are **duplicate shadowed registrations** — fix both copies or de-duplicate first |
| CR-4 | **OPEN** | `newRecord = req.body` `:1748`; `cloneDeep(req.body)` `:1897`, `:2096`; `meta.security.display` gating `:1280`, `:1602` |
| CR-5 | **OPEN** | Secret still at `settings/settings.pacio.json:367` + 4 `pacio-core/configs/*.json`. Progress: `*.template.json` files with empty values now exist alongside. Galaxy config moved (see §7 above) |
| CR-6 | **OPEN** | `settings.pacio.json`, `accounts.multiuser.settings.json` still force-tracked (`git ls-files` confirms) |
| CR-7 | **LARGELY REMEDIATED** | `methods.js` migrated to ServerMethods, 22× `requireAuth: true`. **Residual**: `server/import/methods.warehouse.js:69` still accepts caller-controlled `options.relayEndpoint` (SSRF/exfil) — verify its auth + add allowlist |
| CR-8 | **LARGELY REMEDIATED** | 34× `requireAuth: true` in `ipfs-swarm/server/methods.js`. **Residual**: verify the `connectToPeer`/multiaddr SSRF path got host validation, not just auth |
| CR-9 | **RESOLVED** | `server/Methods.js` is now a ServerMethods stub (`certificates.fetch`) that throws `not operational`; no live URL fetch remains outside the registration flow (= CR-10's scope) |
| CR-10 | **OPEN** | Recursive AIA/CRL fetch at `OAuthEndpoints.js:258,:273,:494,:500`; no host allowlist |
| HI-1 | **RESOLVED 2026-07-23** | Fossil `jwt.decode` block *deleted* (`43996554`; see july-fix-now.md #2). **NEW follow-up finding**: FhirAuth login-token hash lookups do NOT enforce token expiry (RpcAuth does) — FHIR REST accepts expired-but-present resume tokens. Mirror RpcAuth's `when` + `Accounts._getTokenLifetimeMs()` check |
| HI-2 | **OPEN** | Default `'change-me-in-production'` + non-constant-time `===` at `FhirAuth.js:222` |
| HI-3 | *reported*, unverified | Re-verify before fixing |
| HI-4 | **RELOCATED** | `simple-auth-methods.js` gone; custom login lives in `imports/startup/server/simple-accounts-startup.js` — re-verify there |
| HI-5 | **OPEN** | `conditions.all` still `Conditions.find({})` for any logged-in user (comment admits it) |
| HI-6 | **RESOLVED** | `WebsocketsAccessControl.js` deleted; zero references remain |
| HI-7 | **OPEN** | `SearchParametersEngine.js:707-716` `buildStringQuery` still `$regex: '^' + searchValue` unescaped (the July "CodeQL ReDoS fixes" were elsewhere) |
| HI-8 | **OPEN** | `rejectUnauthorized: false` at `provider-directory/server/hooks.js:69` |
| HI-9 | **OPEN** | default `adminPassword` literal at `accounts.multiuser.settings.json:72`, still tracked |
| HI-10 | **OPEN** | RSA PRIVATE KEY still at `extensions/timelines/configs/settings.lcars.json:347`; `AIzaSy…` keys in 5 extension files incl. `care-commons-sandbox` galaxy config. NOT covered by CI gitleaks (extensions absent from checkout) |
| HI-11 | **OPEN** | `'default-secret'` fallback at `digitalIdGenerator.js:94,109` |
| HI-12 | **PARTIAL** | `Metadata.js` + `CdsHooksEndpoints.js` wildcard CORS gone (July harmonization). `BulkData.js` still has **5** `Allow-Origin: '*'` sites; `ConsentEngineHttp.js` unverified |
| HI-13 | **OPEN** | `server/Session.js:77` cookie still `Expires` only — no HttpOnly/Secure/SameSite |
| HI-14 | **PARTIAL/OPEN** | ProxyRelay migrated to ServerMethods but still gated only by `PROXY_RELAY_ENABLED`; no URL allowlist, no audit write |
| HI-15 | **OPEN** | `bulkExportOutputStore = new Map()` (`BulkData.js:79`), no TTL sweep; bearer-expiry check added on download path (`:155-161`) is partial progress; `requireAccessToken` conditionality unverified |
| HI-16 | **OPEN** | `MOBILE_JWT_SECRET || Random.secret()` at `middleware-mobile.js:17` |
| ME-1 | **OPEN** | No startup assertion; `core-startup.js` relocated — find the new home first |
| ME-2 | **PARTIAL — synthea portion CLOSED by design decision** | `synthea.clearResearchData`: `requireAuth: false` **blessed 2026-07-24** — the package is sandbox/bootstrap hydration tooling expected to be removed from production builds; the `enableSyntheaDbUtils` settings gate is the operative guard (comment at the define site records this). Related hardening same day: hydration importers (synthea, provider-directory, lantern) now stamp `meta.source` lineage on every insert, and `clearResearchData` accepts an optional `source` param for scoped cleanup. `ConsentEngineMethods.revokeConsent`, data-importer warehouse still unverified |
| ME-3 | **OPEN** | Raw `parseInt(_count)` no clamp at `FhirEndpoints.js:2286,:2721` |
| ME-4 | **OPEN** | `Patients.allow({insert: …})` at `leaderboard-starter/lib/collections.js:21`, still registered in `workflows.json` |
| ME-5 | **PARTIAL** | RPC HTTP path now has per-method rate limiting (in-memory); DDP subs still uncovered |
| ME-6..9 | unverified | Re-verify (ME-6 line refs dead with core-startup.js) |

## Overlap with already-completed July work (do not redo)

- `test.*` methods gating, endpoint smoke battery, safety-net CI wiring,
  console/logging sweep, jwt fossil deletion — all ✅ per
  [july-fix-now.md](../july-fix-now.md).
- HIPAA audit trail: AuditEvent writes exist on the non-patient FHIR read
  path (fire-and-forget); not systematic — the audit's (d)(2)/(d)(3) GAP
  stands, tracked by the audit-trail design doc.

## New findings surfaced since the audit (fold into the campaign)

1. **Expired resume tokens accepted on FHIR REST** (HI-1 follow-up, above).
2. **`invoke()` bypasses rate limiting / null identity** and **in-memory
   per-process rate buckets never evicted** (RPC residuals — see
   july-tech-debt-analysis.md §3).
3. **`rpc.discover` enumerates 440 methods + schemas anonymously** —
   public by design, revisit as information disclosure.
4. **Duplicate shadowed route registrations** in FhirEndpoints (two PATCH,
   two DELETE, two `_history/:versionId` GETs) are now security-relevant:
   CR-3 fixes must land in the copy that actually serves traffic.
