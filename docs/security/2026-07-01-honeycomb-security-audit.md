# Honeycomb FHIR EHR — Pre-Certification Security Audit

**Date:** 2026-07-01
**Scope:** Full codebase — `imports/`, `server/`, `settings/`, `npmPackages/`,
and private `extensions/*` (**except `extensions/mcp`**, audited separately in
`2026-07-01-mcp-security-audit.md`).
**Context:** Authorized defensive audit of code we own, ahead of BaseEHR/ONC
certification and MITRE cybersecurity review.
**Method:** 7 parallel dimension auditors + surface recon; findings
de-duplicated and cross-corroborated. **✔ = verified firsthand this session**
(exact line read). Others are single-auditor, evidence-cited, marked *reported*.

**Out of scope (per project direction):**
- **Dependency versions** — handled by GitHub Dependabot.
- **PHI-in-logs remediation** — owned by `2026-07-01-structured-logging-design.md`
  (facade + redaction). Logging findings are summarized as context in §"Deferred",
  not ranked here. *Architectural* egress/data-at-rest issues (un-BAA'd relay,
  bulk-export store) ARE in scope and ranked below.

---

## Executive summary

The findings are not scattered bug classes — they cluster into **one dominant
theme: broken and inconsistently-applied access control** (OWASP A01/A07), which
is precisely what ONC §170.315(d)(1) and HIPAA §164.312(a)/(d) gate
certification on. The authorization *model exists and is often good* (CASL is
real, PKCE/redirect-uri/UDAP-cert validation are correct, the DICOM endpoint is
exemplary) — but it is **applied unevenly**, and several **authentication
primitives are forgeable or disabled by default**.

Three sentences for a reviewer:
1. Authentication can be forged or turned off: an unsigned-JWT `client_credentials`
   path, `jwt.decode` instead of `verify`, a default `systemSecret`, and
   `disableOauth: true` shipped in 12 settings files.
2. Authorization is missing on paths where the model plainly exists elsewhere:
   single-resource **read/DELETE/PATCH lack the patient-compartment filter that
   search applies**, and clients can set their own `meta.security` access labels.
3. The private extensions repeat the pattern at scale — `merkalis` (21 methods)
   and `ipfs-swarm` (33 methods) have **no auth at all**, plus committed live
   secrets (an RSA private key, Google Maps keys, a shared token secret in a
   production Galaxy config).

**Certification posture: NOT READY.** None of this is unfixable — the coherence
of the theme means one remediation spine (centralize + uniformly enforce authZ,
rotate/relocate secrets, default-secure the config) closes most of it, and it
aligns with the `ServerMethods` pipeline and egress chokepoint already specced.

### Severity counts (in-scope)
Critical **10** · High **16** · Medium **9**. Full control coverage matrix at the end.

---

## CRITICAL

### CR-1 ✔ `client_credentials` issues tokens without verifying the JWT signature
`server/OAuthEndpoints.js:912-946` — `jwt.decode(client_assertion)` then issues a
real `access_token`; line 946 is a literal `// TODO: Verify JWT signature against
client's public key`. Other flows *do* call `jwt.verify` (`:1449,:1521`), so this
path is the gap. **Exploit:** forge an unsigned `client_assertion` for any
registered backend-services client → `system/*` bearer token → full record access.
**ONC (d)(1); HIPAA §164.312(d).**

### CR-2 ✔ `disableOauth: true` ships enabled in 12 settings files (incl. primary localhost)
`server/lib/FhirAuth.js` assigns unauthenticated requests `role:'noauth'`
(`:394,:403`); `disableOauth:true` present in `settings.honeycomb.localhost.json`,
`settings.fhir.server.json`, `settings.consent.engine.json`, `settings.blues.json`,
`settings.reds.json`, `settings.synthea.json`, `settings.nodeonfhir*.json`,
`settings.red_grays.json`, `settings.honeycomb.tdd.json`,
`settings.honeycomb.dicom.localhost.json` (12 total). A prod profile inheriting
one of these opens the FHIR API. **ONC (d)(1); HIPAA §164.312(a)(1).**
*Precise gating to confirm during fix:* the blanket `noauth` grant at
`FhirAuth.js:83` is under `SafeNoAuth`/`NOAUTH`; the remediation must confirm what
`noauth` can reach when `disableOauth` is true but `NOAUTH` is not.

### CR-3 ✔ IDOR: instance read / DELETE / PATCH have no patient-compartment filter
`server/FhirEndpoints.js:640` reads `find({id: req.params.id})` with no
authorization filter, while **search** builds a compartment `authQuery`
(`:1257-1284`). Same omission on DELETE (`:2170`) and PATCH (`:2114`,
`{multi:true}`). **Exploit:** a valid `patient`-role token does
`GET /baseR4/Observation/<other-patient-id>` — or DELETEs it — for any patient by
id. The fix is applying the *existing* `authQuery` uniformly. **ONC (d)(1),
(g)(10) patient-compartment; HIPAA §164.312(a)(1).**

### CR-4 ✔ Mass assignment: full `req.body` persisted, including `meta.security` labels
`server/FhirEndpoints.js:1730` (`newRecord = req.body`), `:1879`
(`cloneDeep(req.body)`); server overrides only `id`/`_id`/`versionId`. Access
control keys off `meta.security[0].display` (e.g. public read at `:1584`
`find({'meta.security.display':'unrestricted'})`). **Exploit:** POST/PUT a
resource with `meta.security:[{display:'unrestricted'}]` to self-publish PHI, or
set `subject.reference` to attribute data to another patient. **ONC (d)(1); HIPAA
§164.312(a),(c) integrity.**

### CR-5 ✔ Shared token secret committed — including a production Galaxy config
`accountServerTokenSecret: "pacio-secret-token-change-in-production"` in
`settings/settings.pacio.json` + 4 `npmPackages/pacio-core/configs/*` **and
`npmPackages/care-commons.meteorapp.com/settings/settings.pacio-core.2026.galaxy.json`
(a production deploy config)**. It gates account-server token auth
(`server/FhirEndpoints.js`, `ConsentEngineHttp.js`, `main.js`). Anyone with repo
access forges account-server tokens. **HIPAA §164.312(d),(a)(2)(iv).** Rotate +
purge from history.

### CR-6 ✔ Secret settings force-tracked despite `.gitignore`
`.gitignore` lists `settings.*.json`, but `git ls-files` shows
`settings/settings.pacio.json` and `settings/accounts.multiuser.settings.json`
are committed (force-added — a known gotcha in this repo). The ignore rule is
false assurance; real secrets (CR-5, HI-9) are in history. **HIPAA §164.308(a).**

### CR-7 ✔ `extensions/merkalis` — 21 methods, zero authentication + SSRF/PHI-exfil relay
`extensions/merkalis/server/methods.js`: `grep this.userId` = **0** across all 21
methods (`readPatient`, `writeResource`, `listPatients`, `createPatient`, …) —
only `check()` type guards. Any DDP client reads/writes arbitrary FHIR PHI in
merkle storage. Worse, `import/methods.warehouse.js:119` `insertBundleIntoWarehouse`
(no auth) `HTTP.put`s entire bundles to a **caller-controlled `options.relayEndpoint`**
— an unauthenticated PHI-exfiltration/SSRF primitive. **HIPAA §164.312(a)(1),(e)(1).**

### CR-8 *reported* `extensions/ipfs-swarm` — 33 methods, zero authentication
`extensions/ipfs-swarm/server/methods.js`: no `this.userId` anywhere.
`shares.getContent`/`getAllFileContents` return stored content to any caller;
`network.connectToPeer`/`addBootstrapNode` `fetch()` a caller-supplied multiaddr
against the local IPFS control plane (SSRF). **HIPAA §164.312(a)(1).**

### CR-9 ✔ SSRF: `Methods.js` `fetchCertificate(url)` — no auth, no allowlist
`server/Methods.js:15` `fetchCertificate: async function(url){ fetchCertificate(url); }`
— no `this.userId`, no `check()`, no host validation. **Exploit:**
`Meteor.call('fetchCertificate','http://169.254.169.254/latest/meta-data/...')` →
cloud-metadata/IMDS theft, internal port scan. **ONC (d)(9).**

### CR-10 *reported* SSRF: UDAP recursive cert/CRL fetch follows attacker-supplied URLs
`server/OAuthEndpoints.js:167-288` extracts `authorityInfoAccess`/
`cRLDistributionPoints` URLs verbatim from a caller-supplied software statement
and fetches them recursively, no host validation (also `:528-529`). Crafted cert
→ server fetches internal endpoints. **ONC (d)(9); HIPAA §164.312(e).**

---

## HIGH

- **HI-1 ✔ Session JWT uses `jwt.decode` not `verify`** — `FhirAuth.js:347-355`
  (self-warned at `:355`). Re-hash against `loginTokens` mitigates, but unverified
  claims are trusted as inputs. §164.312(d).
- **HI-2 ✔ Default `systemSecret: 'change-me-in-production'`** — `FhirAuth.js:221`,
  non-constant-time `===`; if unset, `system:change-me-in-production` = SYSTEM role.
  §164.312(d).
- **HI-3 *reported* `enableJwtBackendServices` grants `system` to any request with
  an Authorization header** — `FhirAuth.js:253-261`. Ships `false` (good) but is a
  foot-gun. ONC (d)(1).
- **HI-4 *reported* Account enumeration + no lockout on custom `accounts.login`** —
  `simple-auth-methods.js:94-101` (distinct user/password errors, timing oracle);
  DDPRateLimiter covers only the standard Meteor path. §164.308(a)(5).
- **HI-5 *reported* `conditions.all` publishes every patient's Conditions to any
  logged-in client** — `server/publications/conditions.js:16` `find({})`, only a
  `this.userId` gate. §164.312(a)(1), §164.502 minimum-necessary.
- **HI-6 *reported* `WebsocketsAccessControl.js` blanket `allow{insert/update/remove:
  return userId}` on all FHIR collections** (`imports/lib/WebsocketsAccessControl.js:158-186`).
  Appears **dead** (never imported) — confirm and delete the latent footgun.
- **HI-7 *reported* NoSQL/ReDoS injection in string search** —
  `SearchParametersEngine.buildStringQuery:714` builds `{$regex:'^'+value,$options:'i'}`
  from raw `req.query`, unescaped. `?name=^(a+)+$` → catastrophic backtracking DoS;
  `.*` enumerates all records. (Date/token builders correctly escape.)
- **HI-8 ✔ Outbound PHI PUT with `rejectUnauthorized: false`** —
  `npmPackages/provider-directory/server/hooks.js:69` disables TLS verification on
  `HTTP.put` of Observation/Organization to subscription URLs → MITM. §164.312(e)(1);
  ONC (d)(9).
- **HI-9 ✔ Committed admin password** —
  `settings/accounts.multiuser.settings.json:72` `adminPassword: "changeme123"`
  (tracked, real). §164.308(a)(5).
- **HI-10 ✔ Committed live secrets in extensions** — an **RSA PRIVATE KEY** PEM in
  `extensions/timelines/configs/settings.lcars.json`; **Google Maps API keys**
  (`AIzaSy…`) hardcoded in `extensions/desktop-lunar-colony-sim/*` +
  `extensions/timelines/configs/settings.timelines.json` + a
  `desktop-care-commons/…galaxy.json`; Stripe `sk_test_…` in several `desktop-*`
  settings. Rotate + relocate. §164.312(a)(2)(iv).
- **HI-11 *reported* HMAC keyed to `'default-secret'` fallback** —
  `npmPackages/patient-matching/lib/utils/digitalIdGenerator.js:94,109`
  (`process.env.TOKEN_SECRET || 'default-secret'`) over patient-identity tokens;
  fails open silently. §164.312(a)(2)(iv).
- **HI-12 *reported* Wildcard `Access-Control-Allow-Origin: *`** across
  `Metadata.js` (~26 sites), `BulkData.js` (`:879,995,1122,1216,1271`),
  `CdsHooksEndpoints.js:24,45`, `ConsentEngineHttp.js:119,154`. DICOM's
  settings-gated CORS is the pattern to adopt everywhere. ONC (d)(9).
- **HI-13 *reported* `smart-sid` session cookie has no `HttpOnly`/`Secure`/`SameSite`** —
  `server/Session.js:77` (only `Expires`). XSS-readable, plaintext-sent,
  CSRF-exposed. §164.312(e).
- **HI-14 *reported* Un-BAA'd egress relay to caller-supplied URL** —
  `server/ProxyRelay.js` (`proxyRelayPut/Post`) sends full FHIR payload + auth
  headers to any caller URL, gated only by `PROXY_RELAY_ENABLED`, no audit
  (HipaaLogger import commented out); `ProxyHttpRelay.js:159` authorizes against a
  caller-supplied `iss` with no allowlist. **Architectural** (not a logging fix).
  §164.312(e)(1).
- **HI-15 *reported* Bulk-export NDJSON store: PHI at rest, conditional auth, no TTL** —
  `server/BulkData.js:74` `bulkExportOutputStore = new Map()` holds full-resource
  NDJSON, swept only on explicit cancel (`:1256`); download auth is conditional on
  `job.requireAccessToken` (`:1291`). Jobs without the flag serve PHI unauthenticated.
  §164.312(a),(e).
- **HI-16 *reported* Mobile JWT secret defaults to ephemeral `Random.secret()`** —
  `imports/startup/server/middleware-mobile.js:16`; if env unset, tokens rotate per
  restart and multi-instance deploys diverge. Require the env var. §164.312(d).

---

## MEDIUM

- **ME-1 *reported* `disableAccessControl:true` collapses CASL to `granted:true`** —
  `FhirEndpoints.js:593,774,876,2533,2712`. Add a startup assertion that it (and
  `disableOauth`) are false in cert/prod profiles.
- **ME-2 *reported* Unauthenticated PHI-mutating methods** —
  `server/SyntheaMethods.js:11 clearResearchData` (mass `removeAsync({})`),
  `server/ConsentEngineMethods.js:25 revokeConsent` (no auth/ownership, sync v2
  `.remove`), `npmPackages/data-importer/server/methods.warehouse.js:295
  insertBundleIntoWarehouse`. §164.312(a)(1).
- **ME-3 *reported* Unbounded `_count`** — `FhirEndpoints.js:2268,2695` `parseInt`
  with no ceiling → memory DoS. Clamp (≤1000).
- **ME-4 *reported* `leaderboard-starter` `Patients.allow({insert: true})`** —
  `npmPackages/leaderboard-starter/lib/collections.js:22`, registered in
  `workflows/workflows.json`. Exclude from production bundles.
- **ME-5 *reported* No DDP rate limiting except login** — only accounts methods have
  `DDPRateLimiter.addRule`; expensive subs (`patients.search` regex, `conditions.all`)
  are spammable. Availability.
- **ME-6 *reported* HSTS & CSP off by default** — `core-startup.js:251,257` gate them
  behind settings flags. Ship HSTS on in prod for ONC (d)(9); CSP is sensible but
  inert until enabled.
- **ME-7 *reported* UDAP `client_secret` clients usable while `verified:false`; open
  CORS on all OAuth endpoints** — `OAuthEndpoints.js:127,150,673`.
- **ME-8 *reported* `life-support-systems` — 9 methods, no auth** (lower PHI
  sensitivity; confirm no clinical data flows).
- **ME-9 *reported* DICOM `Content-Disposition` reflects stored filename** —
  `DicomEndpoints.js:310,324`, CRLF-injection risk; sanitize. (FileId lookup is by
  GridFS ObjectId — no traversal.)

---

## Verified CLEAN (certification evidence — what's working)

- **Autopublish is NOT a live risk.** The `autopublish` Atmosphere package is not
  installed; `insecure` absent. The custom `autopublish.*` scheme requires
  `settings.private.fhir.autopublishSubscriptions=true` **AND** `isDevelopment`,
  hard-refused in production, with `this.userId` + patient-scope guards
  (`server/publications/autopublish.js:254,267,412,419`).
- **OAuth/SMART core is largely correct:** PKCE S256 enforced
  (`OAuthEndpoints.js:1166`), `redirect_uri` validated against registered set (no
  open redirect), `aud` validation, auth-code↔client binding, SMART asymmetric
  (kid) flow does real JWKS `jwt.verify`, refresh-token scope narrowing, UDAP x5c
  chain/expiry/revocation + `jwt.verify` with `algorithms:['RS256']` (no alg=none).
- **DICOM endpoint is the security model to copy:** Bearer/session auth + SMART
  scope + ACL + rate-limit + 500MB cap + patient-compartment (`DicomEndpoints.js:280-289`),
  generic error text, settings-driven CORS.
- **Dev auto-login cannot activate in production** — `isDevelopment` startup guard
  + per-method `isProduction` recheck + `isDevelopmentAccount` flag
  (`dev-autologin.js:12,147,172,205`). Defense-in-depth.
- **Global security-header middleware** on all paths (`core-startup.js:243-277`):
  `X-Content-Type-Options`, `X-Frame-Options:DENY`, `Referrer-Policy`,
  `Permissions-Policy`.
- **No PHI in `settings.public.*`; no third-party analytics/telemetry** (no Sentry/
  GA/Segment/Mixpanel). bcrypt password hashing.
- **`extensions/monetization` (Stripe) is clean** — webhook signature verified
  (`constructEvent`), all 8 methods gate on `this.userId`, no metadata-forgery
  escalation. (The earlier unverified Stripe lead is **cleared** with code evidence.)
- **`extensions/care-circles` clean** (`requireUser` on every method); `orbital`
  mostly clean; `lantern`/`tracss` clients use env creds + fixed URLs.
- **No dynamic-code evaluation** in server code; `child_process` confined to
  desktop/electron build tooling (not request-driven).

## Deferred to existing plans (not re-ranked here)
- **PHI in logs** (~1,310 server + ~4,884 client `console.*`, incl. full-patient
  dumps in `ProxyHttpRelay.js`, `PatientDetail.jsx`, geocoding address logs) →
  `2026-07-01-structured-logging-design.md` (facade + redaction net). *Note:* the
  ProxyRelay/BulkData **egress and at-rest** issues (HI-14, HI-15) are ranked above
  because redaction alone won't fix them.
- **Audit-trail coverage of PHI access** (REST reads currently unaudited) →
  `2026-07-01-hipaa-audit-trail-design.md` (EventBus → AuditEvents, (d)(2)/(d)(3)).
- **Dependency versions** → Dependabot.

---

## Control coverage matrix

| Control | Status | Findings |
|---------|--------|----------|
| **ONC §170.315(d)(1)** authentication / access control | ❌ FAIL | CR-1,2,3,4,7,8,9; HI-1,2,3,5 |
| **(d)(2)/(d)(3)/(d)(10)** auditable events / reports / PHI-action audit | ⚠️ GAP | REST reads unaudited → audit-trail spec |
| **(d)(9)** trusted connection | ❌ FAIL | CR-9,10; HI-8,12,13 |
| **(d)(12)/(d)(13)** encryption at rest / integrity | ⚠️ PARTIAL | CR-4 (integrity), CR-5, HI-10,11 |
| **HIPAA §164.312(a)(1)** access control | ❌ FAIL | CR-3,4,7,8; HI-5,15; ME-2 |
| **§164.312(a)(2)(iv)** encryption/decryption | ⚠️ PARTIAL | CR-5; HI-10,11 |
| **§164.312(b)** audit controls | ⚠️ GAP | audit-trail + logging specs |
| **§164.312(c)** integrity | ❌ FAIL | CR-4 (mass assignment); audit-trail tamper chain |
| **§164.312(d)** person/entity authentication | ❌ FAIL | CR-1,5; HI-1,2,16 |
| **§164.312(e)(1)** transmission security | ❌ FAIL | CR-10; HI-8,13,14 |
| **§164.308(a)(5)** password/credential mgmt | ❌ FAIL | HI-4,9 |

## Recommended remediation order
1. **CR-5/CR-6/HI-9/HI-10** — rotate every committed secret (esp. the production
   Galaxy token + RSA key), purge from history, stop force-tracking secret settings.
   Fastest, and a hard certification blocker.
2. **CR-1** (implement the JWT-signature TODO) + **CR-9/CR-10** (auth-gate + SSRF
   allowlist the fetch methods) — forge-a-token and IMDS-exfil are the sharpest.
3. **CR-3/CR-4** — apply the existing `authQuery` compartment filter uniformly to
   read/DELETE/PATCH; strip/whitelist `meta.security` + ownership refs on write.
   This is the core "access control" theme and the biggest cert item.
4. **CR-7/CR-8** — auth-gate every `merkalis`/`ipfs-swarm` method; allowlist the
   warehouse relay endpoint.
5. **CR-2 + config hardening** — default `disableOauth`/`disableAccessControl` to
   false; startup assertion in cert/prod profiles; remove the flags from shipped
   settings.
6. **High tier**: TLS-verify (HI-8), CORS allowlist (HI-12), cookie flags (HI-13),
   egress audit/allowlist (HI-14), bulk-store TTL+auth (HI-15), string-search
   escaping (HI-7), dead-code deletion (HI-6).
7. **Medium tier** in a cleanup pass.

**Synergy note:** CR-3/CR-4/CR-7/CR-8/ME-2 all reduce to "one enforced authZ
chokepoint." The `ServerMethods` pipeline (`2026-07-01-jsonrpc-methods-design.md`)
and the FHIR egress hook (`2026-07-01-simpleschema-to-jsonschema-migration-design.md`)
are the natural homes for that enforcement — remediation and the planned
architecture converge.
