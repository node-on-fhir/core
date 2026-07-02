# Core-App Security Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for every task (reproduce → fix → prove-closed) and superpowers:executing-plans / superpowers:subagent-driven-development to work task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **This is authorized defensive work on code we own, pre-certification.** Two tasks (Task 2 = CR-1 JWT crypto; Task 1 = secret rotation/history purge) contain **STOP-for-human** gates — obey them; do not perform the destructive/crypto-final steps yourself.

**Goal:** Close the Critical and High findings in `docs/security/2026-07-01-honeycomb-security-audit.md` for code we own, in the audit's own recommended remediation order. The dominant theme is **broken/inconsistently-applied access control** (OWASP A01/A07, ONC §170.315(d)(1), HIPAA §164.312(a)/(d)); the spine of the fix is: rotate/relocate secrets, make authentication un-forgeable, and apply the *existing* patient-compartment `authQuery` uniformly to the read/DELETE/PATCH handlers that skip it. Each finding is one reproduce→fix→prove-closed→commit cycle so each Critical is independently reviewable.

**Architecture:** The authorization model already exists and is often correct — CASL is real, PKCE/redirect-uri/UDAP validation are correct, the DICOM endpoint (`server/DicomEndpoints.js:280-289`) is the exemplary pattern to copy. The failures are *omissions*: the compartment filter built at `FhirEndpoints.js:1257-1284` for **search** is not applied to instance **read** (`:640`), **DELETE** (`:2196`), or **PATCH** (`:2114`); the `client_credentials` JWT path (`OAuthEndpoints.js:946`) has a literal `// TODO: Verify JWT signature`; `disableOauth:true` ships in 12 settings files; and live secrets are force-committed. These fixes align with the planned `ServerMethods` JSON-RPC chokepoint (`docs/superpowers/specs/2026-07-01-jsonrpc-methods-design.md`) — but this plan does the **direct** fix now and references, not waits for, that pipeline.

**Tech Stack:** Meteor v3 (server async: `findOneAsync`/`updateAsync`/`removeAsync`), Node `jsonwebtoken` + `jwks-rsa` (already used at `OAuthEndpoints.js:1449,1521` for the correct flows), `lodash` `get`/`set`/`omit`, mocha (`meteor test --once --driver-package meteortesting:mocha`) + `node --test` for isomorphic lib tests, Nightwatch for E2E.

## Global Constraints

- **One finding per commit.** Each task = a failing test proving the hole → the fix → the test passing → the legitimate path still working → commit. End every commit message with the Claude Code co-author trailer.
- **Meteor v3 async only** on the server — `findOneAsync`/`updateAsync`/`removeAsync`/`fetchAsync`; `function()` not arrow (preserves `this.userId`). The DELETE handler at `FhirEndpoints.js:2196` still uses a legacy sync `.remove(...)` callback — the fix migrates it to `removeAsync` as a side effect.
- **Do not regress the legitimate path.** Every "prove-closed" step must include a positive assertion: the patient reading their OWN record, a correctly-signed `client_assertion`, a search that still returns compartment-scoped data.
- **No placeholder fixes.** No `// TODO`, no `catch {}` swallow. Balance every new `if` with a `console.warn`/`console.error` per house style, and use lodash `get()` circuit-breakers.
- **HUMAN-ONLY steps are marked `🛑 HUMAN`.** Opus replaces committed secret *files* with templates, switches code to `settings.private`/env, and `git rm --cached` force-tracked files — but the **actual secret-value rotation** (new keys/passwords in the real deployments) and the **git-history purge** (`git filter-repo`/BFG force-push) are destructive and NOT Opus's to execute. List them; do not run them.
- **Out of scope** (do not touch here): dependency versions (Dependabot), PHI-in-logs redaction (`docs/superpowers/specs/2026-07-01-structured-logging-design.md`) — EXCEPT the architectural egress/at-rest items HI-14 (ProxyRelay) and HI-15 (bulk-export store), which are in scope (Tasks 10-11). Medium findings (ME-*) are a later cleanup pass, EXCEPT the CR-2/ME-1 startup assertion (Task 8).
- **Verification harness:** `npm test` (mocha, server); boot with `meteor run --settings settings/settings.honeycomb.localhost.json` and exercise the REST API with `curl` for the endpoint tasks; `node --test` for isomorphic-lib tests.

## File map

| File | Findings | Responsibility |
|------|----------|----------------|
| `settings/settings.pacio.json`, `settings/accounts.multiuser.settings.json` | CR-5, CR-6, HI-9 | force-tracked secret files → `git rm --cached` + `*.template.json` |
| `server/OAuthEndpoints.js:912-968` | CR-1 | implement the JWT-signature TODO (crypto — human review gate) |
| `server/Methods.js:15` | CR-9 | auth-gate + SSRF allowlist `fetchCertificate` |
| `server/OAuthEndpoints.js:167-288,528` | CR-10 | SSRF host-allowlist for UDAP cert/CRL fetch |
| `server/FhirEndpoints.js:640,2114,2196` | CR-3 | apply `authQuery` to read/DELETE/PATCH |
| `server/FhirEndpoints.js:1730,1879,2107-2135` | CR-4 | strip client-supplied `meta.security` + ownership refs on write |
| `extensions/merkalis/server/methods.js` (+ `import/methods.warehouse.js`) | CR-7 | `this.userId` gate on 21 methods + relay-endpoint allowlist |
| `extensions/ipfs-swarm/server/methods.js` | CR-8 | `this.userId` gate on 33 methods + multiaddr allowlist |
| `imports/startup/server/core-startup.js` | CR-2, ME-1 | boot-refuse prod profile with `disableOauth`/`disableAccessControl` true |
| `server/lib/FhirAuth.js:221,347` | HI-2, HI-1 | fail-closed `systemSecret`, constant-time compare; verify session JWT |
| `npmPackages/provider-directory/server/hooks.js:69` | HI-8 | remove `rejectUnauthorized:false` |
| `server/SearchParametersEngine.js:707-715` | HI-7 | escape regex in string search |
| `server/ProxyRelay.js`, `server/ProxyHttpRelay.js:159` | HI-14 | egress allowlist + audit |
| `server/BulkData.js:74,1291` | HI-15 | store TTL + unconditional download auth |

---

### Task 1 — CR-5 / CR-6 / HI-9 / HI-10: stop force-tracking secret files (code-side only; rotation is 🛑 HUMAN)

**Finding (verified):** `git ls-files` shows `settings/settings.pacio.json` and `settings/accounts.multiuser.settings.json` are committed despite `.gitignore` `settings.*.json` (force-added — the repo's known gotcha; `.gitignore` line 47 already whitelists `!settings.*.template.json`). Real secrets are inside: `accountServerTokenSecret: "pacio-secret-token-change-in-production"` (CR-5, also in `npmPackages/pacio-core/configs/*` and the **production** `npmPackages/care-commons.meteorapp.com/settings/settings.pacio-core.2026.galaxy.json`) and `adminPassword: "changeme123"` (HI-9, `accounts.multiuser.settings.json:72`). HI-10 adds an RSA private key + Google Maps/Stripe keys in `extensions/*` (nested private repos — list for the human, do not edit here).

**Files:**
- Modify (git index): `settings/settings.pacio.json`, `settings/accounts.multiuser.settings.json`
- Create: `settings/settings.pacio.template.json`, `settings/accounts.multiuser.settings.template.json`
- Modify (readers): confirm `server/FhirEndpoints.js`, `server/ConsentEngineHttp.js`, `server/main.js` read the token secret from `settings.private` (they already do; this task removes the *committed value*, not the read path)

- [ ] **Step 1 — reproduce (prove the leak is tracked):**
  ```bash
  git ls-files | grep -E 'settings\.pacio\.json|accounts\.multiuser\.settings\.json'
  grep -n 'accountServerTokenSecret\|adminPassword' settings/settings.pacio.json settings/accounts.multiuser.settings.json
  ```
  Both files list; both secrets grep-hit. That is the finding.
- [ ] **Step 2 — create sanitized templates** (empty-string secret values, same shape). E.g. `settings/settings.pacio.template.json` mirrors `settings.pacio.json` with `"accountServerTokenSecret": ""`; `accounts.multiuser.settings.template.json` mirrors its source with `"adminPassword": ""`. Templates are the whitelisted `!settings.*.template.json` pattern → they stay tracked, contain no secret.
- [ ] **Step 3 — untrack the real files (keep them on disk for local dev):**
  ```bash
  git rm --cached settings/settings.pacio.json settings/accounts.multiuser.settings.json
  ```
  Now `.gitignore`'s `settings.*.json` rule actually applies going forward.
- [ ] **Step 4 — prove-closed:** `git ls-files | grep -E 'settings\.pacio\.json|accounts\.multiuser\.settings\.json'` returns **empty**; `git ls-files | grep template` shows the two new templates. Boot still works because the on-disk (now-ignored) real files remain: `meteor run --settings settings/settings.honeycomb.localhost.json` starts clean.
- [ ] **Step 5 — 🛑 HUMAN follow-ups (list in the commit body; DO NOT execute):**
  - Rotate `accountServerTokenSecret` in every real deployment (esp. the Galaxy prod config) to a fresh random value delivered via env/`settings.private`.
  - Rotate `adminPassword`.
  - Rotate the RSA private key in `extensions/timelines/configs/settings.lcars.json`, the Google Maps keys (`extensions/desktop-lunar-colony-sim/*`, `extensions/timelines/configs/settings.timelines.json`), and the Stripe `sk_test_*` keys in `desktop-*` settings (nested private repos).
  - **Purge all of the above from git history** (`git filter-repo` / BFG) and force-push — destructive, coordinate with the team.
- [ ] **Step 6 — commit:**
  ```bash
  git add settings/settings.pacio.template.json settings/accounts.multiuser.settings.template.json .gitignore
  git commit  # message: "security(secrets): untrack force-committed secret settings, add sanitized templates (CR-5/CR-6/HI-9)\n\n🛑 HUMAN: rotate accountServerTokenSecret + adminPassword + extension keys and purge git history — see plan Task 1 Step 5."
  ```

---

### Task 2 — CR-1: `client_credentials` issues tokens without verifying the JWT signature (🛑 crypto — STOP after tests pass)

**Finding (verified):** `server/OAuthEndpoints.js:912` does `jwt.decode(client_assertion, {complete:true})`, matches the registered client (`:933-944`), then `:946` is a literal `// TODO: Verify JWT signature against client's public key` and `:951` "we'll trust the assertion if the client is registered" before minting a real `access_token` (`:954`). The correct flows already call `jwt.verify` (`:1449,:1521`) with JWKS — this path is the gap. **Exploit:** forge an unsigned `client_assertion` (`iss==sub==<registered client_id>`) → `system/*` bearer token → full record access.

**Files:**
- Test: `server/OAuthEndpoints.clientCredentials.test.mjs`
- Modify: `server/OAuthEndpoints.js:910-968`

- [ ] **Step 1 — reproduce (failing test):** write `server/OAuthEndpoints.clientCredentials.test.mjs` asserting the *intended* behavior so it fails against current code. Two cases:
  ```javascript
  // node --test — pure verification-logic unit test of the signature gate.
  import { test } from 'node:test';
  import assert from 'node:assert';
  import jwt from 'jsonwebtoken';
  import { generateKeyPairSync } from 'node:crypto';
  import { verifyClientAssertion } from './OAuthEndpoints.js';

  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const registeredClient = { _id: 'client-abc', jwks: { keys: [] }, publicKey: publicKey.export({ type:'spki', format:'pem' }) };

  test('rejects an unsigned / alg=none assertion', async () => {
    const forged = jwt.sign({ iss:'client-abc', sub:'client-abc', aud:'https://token' }, '', { algorithm:'none' });
    await assert.rejects(() => verifyClientAssertion(forged, registeredClient), /signature|algorithm|none/i);
  });
  test('accepts a correctly RS256-signed assertion', async () => {
    const good = jwt.sign({ iss:'client-abc', sub:'client-abc', aud:'https://token' }, privateKey, { algorithm:'RS256' });
    const payload = await verifyClientAssertion(good, registeredClient);
    assert.equal(payload.iss, 'client-abc');
  });
  ```
- [ ] **Step 2 — run → FAIL:** `node --test server/OAuthEndpoints.clientCredentials.test.mjs` (no `verifyClientAssertion` export yet).
- [ ] **Step 3 — implement the TODO.** Extract a testable `verifyClientAssertion(client_assertion, registeredClient)` and export it; replace the `:946-951` TODO block. Mirror the correct flow at `:1449`: pin algorithms to `['RS256']` (rejects `alg:none`), resolve the key from the client's registered JWKS/`jwks_uri` (reuse the existing `jwks-rsa` client used at `:1449,:1521`) or the stored `publicKey`, and `jwt.verify`:
  ```javascript
  // server/OAuthEndpoints.js — replaces the "TODO: Verify JWT signature" block (~:946)
  export async function verifyClientAssertion(client_assertion, registeredClient) {
    const header = get(jwt.decode(client_assertion, { complete: true }), 'header', {});
    if (header.alg === 'none' || !header.alg) {
      throw new Error('invalid_client: client_assertion algorithm "none" is not allowed');
    }
    let signingKey;
    if (get(registeredClient, 'jwks_uri')) {
      const client = jwksClient({ jwksUri: registeredClient.jwks_uri });   // same lib as :1449
      signingKey = (await client.getSigningKey(header.kid)).getPublicKey();
    } else if (get(registeredClient, 'publicKey')) {
      signingKey = registeredClient.publicKey;
    } else if (get(registeredClient, 'jwks.keys.length')) {
      signingKey = jwkToPem(registeredClient.jwks.keys.find(k => k.kid === header.kid) || registeredClient.jwks.keys[0]);
    } else {
      throw new Error('invalid_client: no registered key to verify client_assertion');
    }
    return jwt.verify(client_assertion, signingKey, { algorithms: ['RS256'] });
  }
  ```
  In the handler, wrap the call: on throw, `console.error('[client_credentials] assertion verification failed:', err.message)` and `res.status(401).json({ error:'invalid_client', error_description:'client_assertion signature verification failed' })`; only mint the token after it resolves.
- [ ] **Step 4 — run → PASS:** `node --test server/OAuthEndpoints.clientCredentials.test.mjs` green (forged rejected, signed accepted). Then boot and prove the legitimate backend-services flow still mints a token with a correctly-signed assertion (`curl` the token endpoint with an RS256 `client_assertion`).
- [ ] **Step 5 — 🛑 STOP for human review.** This is security-critical crypto. Do NOT commit-and-move-on autonomously: surface the diff, the passing tests, and the key-resolution choices (JWKS vs stored `publicKey`) for a human to review before the commit lands. After sign-off:
  ```bash
  git commit  # "security(oauth): verify client_assertion signature in client_credentials (CR-1)"
  ```

---

### Task 3 — CR-9: SSRF via `fetchCertificate(url)` (no auth, no allowlist)

**Finding (verified):** `server/Methods.js:15` `fetchCertificate: async function (url) { fetchCertificate(url); }` — no `this.userId`, no `check()`, no host validation; it delegates to the import from `./OAuthEndpoints`. **Exploit:** `Meteor.call('fetchCertificate','http://169.254.169.254/latest/meta-data/...')` → IMDS/cloud-metadata theft + internal port scan.

**Files:**
- Create: `server/lib/urlAllowlist.js` (shared SSRF guard, reused by Task 4)
- Test: `server/lib/urlAllowlist.test.mjs`
- Modify: `server/Methods.js:11-18`

- [ ] **Step 1 — reproduce:** write `server/lib/urlAllowlist.test.mjs` asserting `assertPublicHttpUrl()` throws for the IMDS/localhost/private ranges and passes for an allowlisted public host:
  ```javascript
  import { test } from 'node:test'; import assert from 'node:assert';
  import { assertPublicHttpUrl } from './urlAllowlist.js';
  for (const bad of ['http://169.254.169.254/latest/meta-data/','http://localhost/x','http://10.0.0.5/','http://[::1]/','file:///etc/passwd','http://metadata.google.internal/'])
    test('rejects '+bad, () => assert.throws(() => assertPublicHttpUrl(bad), /not allowed|blocked|private/i));
  test('allows a public host', () => assert.doesNotThrow(() => assertPublicHttpUrl('https://example.org/cert.pem')));
  ```
- [ ] **Step 2 — run → FAIL** (module missing).
- [ ] **Step 3 — implement `server/lib/urlAllowlist.js`:** parse with `new URL()`, require `http:`/`https:`, reject literal IPs in RFC1918/loopback/link-local (`127.0.0.0/8`, `10/8`, `172.16/12`, `192.168/16`, `169.254/16`, `::1`, `fc00::/7`) and the metadata hostnames (`metadata.google.internal`, `169.254.169.254`); optionally honor an explicit `settings.private.security.certFetchAllowlist` host list. Throw `Error('SSRF blocked: <host> is not an allowed egress target')` otherwise.
- [ ] **Step 4 — gate the method** in `server/Methods.js`:
  ```javascript
  import { assertPublicHttpUrl } from './lib/urlAllowlist.js';
  Meteor.methods({
    fetchCertificate: async function (url) {
      check(url, String);
      if (!this.userId) { console.warn('[fetchCertificate] unauthenticated call blocked'); throw new Meteor.Error('not-authorized'); }
      assertPublicHttpUrl(url);
      return await fetchCertificate(url);   // note: also add the missing `return`
    }
  });
  ```
- [ ] **Step 5 — prove-closed + commit:** `node --test server/lib/urlAllowlist.test.mjs` green; boot and confirm a legitimate authenticated `fetchCertificate('https://<allowed>')` still works. `git commit  # "security(ssrf): auth-gate + allowlist fetchCertificate (CR-9)"`

---

### Task 4 — CR-10: SSRF in UDAP recursive cert/CRL fetch

**Finding (verified via §):** `server/OAuthEndpoints.js:167-288` extracts `authorityInfoAccess`/`cRLDistributionPoints` URLs verbatim from a caller-supplied software statement and fetches them recursively with no host validation (also `:528-529`). Crafted cert → server fetches internal endpoints.

**Files:**
- Modify: `server/OAuthEndpoints.js:167-288,528-529`
- Test: `server/OAuthEndpoints.udapFetch.test.mjs`
- Reuse: `server/lib/urlAllowlist.js` (Task 3)

- [ ] **Step 1 — reproduce:** unit-test the extracted `fetchAiaOrCrl(url)` helper (or the loop) asserting it refuses an AIA/CRL URL pointing at `http://169.254.169.254/...` and at `http://localhost/...`, and accepts a public CA URL. FAIL first.
- [ ] **Step 2 — implement:** before every recursive `fetch`/HTTP call in the AIA/CRL walk (`:167-288`, `:528-529`), call `assertPublicHttpUrl(candidateUrl)`; on throw, `console.warn('[UDAP] blocked non-public cert/CRL URL:', candidateUrl)` and skip that URL (do not abort the whole chain — a poisoned AIA shouldn't DoS a valid cert). Cap recursion depth (≤5) to stop fetch-amplification loops.
- [ ] **Step 3 — prove-closed + commit:** test green; boot and confirm a normal UDAP software-statement registration (public AIA/CRL) still verifies. `git commit  # "security(ssrf): allowlist UDAP recursive cert/CRL fetch (CR-10)"`

---

### Task 5 — CR-3: IDOR — apply the existing `authQuery` compartment filter to read / DELETE / PATCH

**Finding (verified):** **search** builds a patient-compartment `authQuery` at `FhirEndpoints.js:1257-1284`, but instance **read** at `:640` (`find({id: req.params.id})`), **DELETE** at `:2196` (`Collections[collectionName].remove({id: req.params.id}, ...)` — legacy sync), and **PATCH** at `:2114` (`updateAsync({id: req.params.id}, {$set:...}, {multi:true})`) apply **no** authorization filter. All three already have `authorizationContext` in scope (read handler `:548`, PATCH `:2074/:2075`, DELETE `:2184/:2185`). **Exploit:** a valid `patient`-role token does `GET`/`DELETE /baseR4/Observation/<other-patient-id>` for any patient by id.

**Files:**
- Create: `server/lib/compartmentQuery.js` — factor the `:1257-1284` `authQuery` builder into a reusable pure function
- Test: `server/lib/compartmentQuery.test.mjs`
- Modify: `server/FhirEndpoints.js:640` (read), `:2114`+`:2135` (PATCH), `:2190-2206` (DELETE)

- [ ] **Step 1 — factor + unit-test the filter.** Extract the exact logic at `:1257-1284` into `buildCompartmentQuery(authorizationContext, routeResourceType)` returning the `{$or:[...]}` (unrestricted-label OR the patient/subject/patient/beneficiary refs, Patient-special-cased). Write `server/lib/compartmentQuery.test.mjs`: for `{patientId:'P1'}` + `'Observation'`, the query contains `subject.reference: {$in:['P1','Patient/P1','urn:uuid:P1']}`; for a different `authorizationContext.patientId` it does NOT match `P2`'s refs. FAIL first, then implement the factor so search (`:1257`) and the three handlers share one builder.
- [ ] **Step 2 — reproduce the IDOR (integration).** Add a Nightwatch/`curl` scenario (or a server mocha test hitting the handler): patient P1's token `GET /baseR4/Observation/<P2-observation-id>` currently returns 200 with P2's data. Assert it *should* be 404/403. FAIL against current code.
- [ ] **Step 3 — fix read (`:640`):** intersect the id lookup with the compartment filter:
  ```javascript
  // was: records = await Collections[collectionName].find({id: req.params.id}, defaultOptions).fetch();
  const compartment = isReferenceResource ? {} : buildCompartmentQuery(authorizationContext, routeResourceType);
  records = await Collections[collectionName].find({ $and: [ { id: req.params.id }, compartment ] }, defaultOptions).fetch();
  if (records.length === 0) { console.log('[read] no compartment-authorized record for', req.params.id); /* falls through to existing 404 */ }
  ```
  (Reference/patient-agnostic resources bypass, mirroring search's `isReferenceResource` branch at `:1250`.)
- [ ] **Step 4 — fix DELETE (`:2190-2206`):** migrate the legacy sync `.remove(...)` to async AND scope it — first fetch under the compartment, delete only if found:
  ```javascript
  const compartment = buildCompartmentQuery(authorizationContext, routeResourceType);
  const target = await Collections[collectionName].findOneAsync({ $and: [ { id: req.params.id }, compartment ] });
  if (!target) { res.status(404).json(); return; }
  await Collections[collectionName].removeAsync({ _id: target._id });
  res.status(204).json();
  ```
- [ ] **Step 5 — fix PATCH (`:2114` and `:2135`):** kill the `{multi:true}` mass update; require a single compartment-authorized target, patch by its `_id`:
  ```javascript
  const compartment = buildCompartmentQuery(authorizationContext, routeResourceType);
  const target = await Collections[collectionName].findOneAsync({ $and: [ { id: req.params.id }, compartment ] });
  if (!target) { res.status(404).json(); return; }
  await Collections[collectionName].updateAsync({ _id: target._id }, { $set: setObjectPatch });   // no {multi:true}
  ```
- [ ] **Step 6 — prove-closed:** the Step 2 cross-patient read/DELETE/PATCH now returns 404; **positive path:** P1 reading/patching P1's OWN record still 200/204, and compartment-scoped search still returns P1's data. `npm test` green.
- [ ] **Step 7 — commit:** `git commit  # "security(authz): apply patient-compartment authQuery to instance read/DELETE/PATCH (CR-3)"` (Note in the body: this is the direct fix; the `ServerMethods` chokepoint in 2026-07-01-jsonrpc-methods-design.md is the eventual home.)

---

### Task 6 — CR-4: mass assignment — strip client-supplied `meta.security` + ownership refs on write

**Finding (verified):** `FhirEndpoints.js:1730` `let newRecord = req.body;` (POST) and `:1879` `cloneDeep(req.body)` (PUT) persist the *entire* client body; the server overrides only `id`/`_id`/`versionId`/`lastUpdated`. Access control keys off `meta.security[0].display` (public read at `:1584` `find({'meta.security.display':'unrestricted'})`, and the compartment `authQuery` grants on `meta.security.display:'unrestricted'` at `:1258`). **Exploit:** POST/PUT a resource with `meta.security:[{display:'unrestricted'}]` to self-publish PHI, or set `subject.reference` to attribute data to another patient.

**Files:**
- Create: `server/lib/sanitizeWrite.js` — strip/whitelist server-controlled fields
- Test: `server/lib/sanitizeWrite.test.mjs`
- Modify: `server/FhirEndpoints.js:1729-1745` (POST), the `:1879` PUT block

- [ ] **Step 1 — reproduce:** `server/lib/sanitizeWrite.test.mjs` asserts `sanitizeIncomingResource(body, authorizationContext)`:
  - removes client-supplied `meta.security` entirely (server assigns labels, never the client);
  - for a `patient`-role writer, forces `subject.reference`/`patient.reference` to the writer's own compartment (`Patient/<authorizationContext.patientId>`) rather than trusting the body;
  - leaves clinical fields untouched.
  ```javascript
  import { test } from 'node:test'; import assert from 'node:assert';
  import { sanitizeIncomingResource } from './sanitizeWrite.js';
  test('strips client meta.security', () => {
    const out = sanitizeIncomingResource({ resourceType:'Observation', meta:{ security:[{display:'unrestricted'}] } }, { role:'patient', patientId:'P1' });
    assert.equal(out.meta?.security, undefined);
  });
  test('pins subject to the writing patient', () => {
    const out = sanitizeIncomingResource({ resourceType:'Observation', subject:{ reference:'Patient/P2' } }, { role:'patient', patientId:'P1' });
    assert.equal(out.subject.reference, 'Patient/P1');
  });
  ```
  FAIL first.
- [ ] **Step 2 — implement `sanitizeWrite.js`:** `lodash.omit` the client `meta.security` (and `meta.tag` if it drives access); if `get(authorizationContext,'role')==='patient'` and `authorizationContext.patientId`, overwrite `subject.reference`/`patient.reference`/`beneficiary.reference` to that patient. SYSTEM/practitioner roles may retain explicit refs (they legitimately write cross-patient) but STILL cannot set `meta.security` — the server assigns it. Log every override: `console.warn('[write] overrode client-supplied', field)`.
- [ ] **Step 3 — wire into POST/PUT:** at `:1730` `let newRecord = sanitizeIncomingResource(req.body, authorizationContext);` and the equivalent at `:1879` (replace the raw `cloneDeep(req.body)`). Keep the existing server-side `id`/`_id`/`versionId`/`lastUpdated` assignment after sanitization.
- [ ] **Step 4 — prove-closed:** the self-publish exploit (POST with `meta.security:[{display:'unrestricted'}]`) now stores the record WITHOUT that label (verify it is NOT returned by the `:1584` public-read query); a cross-patient `subject.reference` is rewritten to the writer's own compartment. **Positive path:** a normal Observation POST for the writer's own patient still succeeds and reads back. `npm test` green.
- [ ] **Step 5 — commit:** `git commit  # "security(integrity): strip client meta.security + pin ownership refs on write (CR-4)"`

---

### Task 7 — CR-7 / CR-8: auth-gate the private extension methods (merkalis, ipfs-swarm) + relay allowlist

**Finding (verified):** `extensions/merkalis/server/methods.js` — `grep this.userId` = **0** across all 21 methods (`readPatient`/`writeResource`/`listPatients`/`createPatient`/…, `Meteor.methods({...})` at `:879`, only `check()` type-guards). `extensions/merkalis/server/import/methods.warehouse.js` `insertBundleIntoWarehouse` `HTTP.put`s whole bundles to a **caller-controlled `options.relayEndpoint`** (SSRF/PHI-exfil). `extensions/ipfs-swarm/server/methods.js` — `this.userId` count = **0** across 33 methods; `network.connectToPeer`/`addBootstrapNode` `fetch()` a caller-supplied multiaddr (SSRF). *(These are nested private repos — gitignored from the monorepo; commit within each nested repo.)*

**Files:**
- Modify: `extensions/merkalis/server/methods.js` (21 methods), `extensions/merkalis/server/import/methods.warehouse.js`
- Modify: `extensions/ipfs-swarm/server/methods.js` (33 methods)
- Reuse: the allowlist idea from Task 3 (host allowlist for relay/multiaddr)

- [ ] **Step 1 — reproduce:** confirm the holes mechanically — `grep -c this.userId extensions/merkalis/server/methods.js` → `0`; same for ipfs-swarm. Add one server test (or a `curl`/DDP script) showing an *unauthenticated* `Meteor.call('merkalis.readPatient', someId)` currently returns PHI. FAIL (returns data) → should throw `not-authorized`.
- [ ] **Step 2 — gate every method.** Add at the top of each of the 21 merkalis + 33 ipfs-swarm methods (they use `function()`, so `this` is bound):
  ```javascript
  if (!this.userId) { console.warn('[merkalis.<method>] unauthenticated call blocked'); throw new Meteor.Error('not-authorized'); }
  ```
  Do this for ALL methods; do not exempt read-only ones (they return PHI / stored content).
- [ ] **Step 3 — allowlist the egress:** in `methods.warehouse.js insertBundleIntoWarehouse`, validate `options.relayEndpoint` against `settings.private.merkalis.relayAllowlist` (reject if absent/not listed) before the `HTTP.put`; in ipfs-swarm `connectToPeer`/`addBootstrapNode`, validate the multiaddr host against a configured peer allowlist. On rejection, `console.error` + throw.
- [ ] **Step 4 — prove-closed:** unauthenticated call now throws; an *authenticated* call still works; relay to a non-allowlisted endpoint throws, to an allowlisted one succeeds. Run each nested repo's own `npm test`.
- [ ] **Step 5 — commit (inside each nested repo):** `extensions/merkalis` → `git commit  # "security(authz): require this.userId on all 21 methods + relay-endpoint allowlist (CR-7)"`; `extensions/ipfs-swarm` → `git commit  # "security(authz): require this.userId on all 33 methods + multiaddr allowlist (CR-8)"`.

---

### Task 8 — CR-2 / ME-1: default-secure config + boot-refuse an unsafe prod profile

**Finding (verified):** `FhirAuth.js:391` grants unauthenticated requests `role:'noauth'` when `settings.private.fhir.disableOauth === true`; that flag ships `true` in 12 settings files (incl. `settings.honeycomb.localhost.json`). ME-1: `disableAccessControl:true` collapses CASL to `granted:true` at `FhirEndpoints.js:593,774,876,2533,2712`. A prod profile inheriting either opens the FHIR API.

**Files:**
- Create: `imports/startup/server/assertSecureConfig.js`
- Test: `imports/startup/server/assertSecureConfig.test.mjs`
- Modify: `imports/startup/server/core-startup.js` (add the top-level invocation among the existing `injectEnvironmentVariables(); … initializeCoreServices();` calls)

- [ ] **Step 1 — reproduce (failing test):** `assertSecureConfig.test.mjs` asserts `assertSecureConfig({ NODE_ENV:'production', settings })` **throws** when `settings.private.fhir.disableOauth===true` OR `settings.private.accessControl.disableAccessControl===true`, and does NOT throw for a dev profile or a hardened prod profile:
  ```javascript
  import { test } from 'node:test'; import assert from 'node:assert';
  import { assertSecureConfig } from './assertSecureConfig.js';
  const prod = env => ({ NODE_ENV:env });
  test('prod + disableOauth → throws', () => assert.throws(() => assertSecureConfig(prod('production'), { private:{ fhir:{ disableOauth:true } } }), /disableOauth/));
  test('prod + disableAccessControl → throws', () => assert.throws(() => assertSecureConfig(prod('production'), { private:{ accessControl:{ disableAccessControl:true } } }), /disableAccessControl/));
  test('prod hardened → ok', () => assert.doesNotThrow(() => assertSecureConfig(prod('production'), { private:{ fhir:{ disableOauth:false } } })));
  test('development → ok even if disabled', () => assert.doesNotThrow(() => assertSecureConfig(prod('development'), { private:{ fhir:{ disableOauth:true } } })));
  ```
  FAIL (module missing).
- [ ] **Step 2 — implement `assertSecureConfig(processEnv, settings)`:** treat "prod/cert profile" as `processEnv.NODE_ENV === 'production'` OR `get(settings,'public.environment')` in `('production','certification')`. If prod AND (`get(settings,'private.fhir.disableOauth')===true` OR `get(settings,'private.accessControl.disableAccessControl')===true`), `throw new Error('Refusing to boot: disableOauth/disableAccessControl must be false in production/certification profiles')`. Otherwise, if dev with a flag on, `console.warn` a loud reminder.
- [ ] **Step 3 — wire into startup:** call it in `imports/startup/server/core-startup.js` alongside the other top-level calls:
  ```javascript
  import { assertSecureConfig } from './assertSecureConfig.js';
  assertSecureConfig(process.env, get(Meteor, 'settings', {}));   // add near injectEnvironmentVariables()
  ```
- [ ] **Step 4 — 🛑 HUMAN note + code-side cleanup:** remove `disableOauth`/`disableAccessControl` from the shipped *localhost/dev* settings where safe, and leave a comment that any real prod profile MUST omit them. (Flipping the value in real deployment configs is a HUMAN op.)
- [ ] **Step 5 — prove-closed + commit:** `node --test imports/startup/server/assertSecureConfig.test.mjs` green; boot with `settings/settings.honeycomb.localhost.json` (dev) still starts (warns, does not throw). `git commit  # "security(config): boot-refuse prod profile with disableOauth/disableAccessControl (CR-2/ME-1)"`

---

### Task 9 — HI-1 / HI-2: fail-closed `systemSecret`, constant-time compare, verify session JWT

**Finding (verified):** `FhirAuth.js:221` `authParts[1] === get(Meteor,'settings.private.accessControl.systemSecret','change-me-in-production')` — default secret + non-constant-time `===`; if unset, `system:change-me-in-production` = SYSTEM role. HI-1: `FhirAuth.js:347-355` uses `jwt.decode` (self-warned at `:355`) for the session JWT instead of `verify`.

**Files:**
- Test: `server/lib/FhirAuth.systemSecret.test.mjs`
- Modify: `server/lib/FhirAuth.js:221` (HI-2), `:347-355` (HI-1)

- [ ] **Step 1 — reproduce (HI-2):** unit-test an extracted `matchesSystemSecret(presented, settings)` asserting it returns **false** when `settings.private.accessControl.systemSecret` is unset (fail-closed — no default grant) and uses a constant-time compare. FAIL against current code (which returns true for the baked-in default).
- [ ] **Step 2 — fix HI-2:** remove the `'change-me-in-production'` default; if `systemSecret` is unset/empty, refuse (return false + `console.error('[FhirAuth] systemSecret not configured — refusing Basic system auth')`). Compare with `crypto.timingSafeEqual` over equal-length buffers.
- [ ] **Step 3 — fix HI-1:** replace the session-JWT `jwt.decode` at `:347-355` with `jwt.verify` against the signing secret used to mint session tokens (pin `algorithms`), keeping the existing `loginTokens` re-hash as defense-in-depth. On verify failure, deny (do not fall through to trusting decoded claims).
- [ ] **Step 4 — prove-closed:** test green; boot and confirm a legitimately-configured `systemSecret` still authenticates a system call and a valid session token still authorizes. `git commit  # "security(auth): fail-closed systemSecret + constant-time compare + verify session JWT (HI-1/HI-2)"`

---

### Task 10 — HI-8 + HI-7: TLS-verify outbound PHI PUT + escape regex in string search

**Finding (verified):** `npmPackages/provider-directory/server/hooks.js:69` sets `rejectUnauthorized:false` on the `HTTP.put` of Observation/Organization to subscription URLs → MITM (HI-8). `server/SearchParametersEngine.js:714` builds `{ $regex:'^'+searchValue, $options:'i' }` from raw `req.query`, unescaped → `?name=^(a+)+$` catastrophic backtracking DoS (HI-7).

**Files:**
- Modify: `npmPackages/provider-directory/server/hooks.js:69`
- Modify: `server/SearchParametersEngine.js:707-715`
- Test: `server/SearchParametersEngine.stringQuery.test.mjs`

- [ ] **Step 1 — HI-8:** remove the `rejectUnauthorized:false` option (or gate it behind an explicit dev-only `settings.private` flag with a loud warning). Boot provider-directory and confirm the outbound PUT to an HTTPS subscription URL still succeeds against a valid cert.
- [ ] **Step 2 — HI-7 reproduce:** test asserting `buildStringQuery('name','^(a+)+$')` produces a query whose regex source is **escaped** (the literal `(a+)+` metacharacters neutralized), not a live catastrophic-backtracking pattern. FAIL first.
- [ ] **Step 3 — HI-7 fix:** escape the value before interpolation — `const escaped = searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); query[baseField] = { $regex: '^' + escaped, $options: 'i' };`. (Matches how the date/token builders already escape.)
- [ ] **Step 4 — prove-closed + commit:** test green; a normal `?name=Smith` search still returns matches. `git commit  # "security(egress+dos): TLS-verify outbound PUT + escape string-search regex (HI-8/HI-7)"`

---

### Task 11 — HI-14 + HI-15: egress allowlist/audit for ProxyRelay + bulk-export store TTL & unconditional auth

**Finding (verified):** `server/ProxyRelay.js` `proxyRelayPut/Post` send full FHIR payload + auth headers to any caller URL, gated only by `process.env.PROXY_RELAY_ENABLED`, no audit (HipaaLogger commented out); `ProxyHttpRelay.js:159` authorizes against a caller-supplied `iss` with no allowlist (HI-14). `server/BulkData.js:74` `bulkExportOutputStore = new Map()` holds full-resource NDJSON, swept only on explicit cancel (`:1256`); download auth is conditional on `job.requireAccessToken` (`:1291`) → jobs without the flag serve PHI unauthenticated (HI-15).

**Files:**
- Modify: `server/ProxyRelay.js` (`proxyRelayPut`/`proxyRelayPost`), `server/ProxyHttpRelay.js:159`
- Modify: `server/BulkData.js:74`, the download handler around `:1291`
- Reuse: `server/lib/urlAllowlist.js` (Task 3)

- [ ] **Step 1 — HI-14:** before each outbound relay call, `assertPublicHttpUrl(targetUrl)` AND check the host against `settings.private.proxyRelay.allowlist` (the relay ships to *named partner endpoints*, not arbitrary URLs); at `ProxyHttpRelay.js:159`, validate the caller-supplied `iss` against a registered-issuer allowlist. Emit an audit line for every relay (uncomment/replace the HipaaLogger call with a structured `console.info('[ProxyRelay] egress', { target, userId, resourceType })` — full audit-trail wiring is the audit-trail spec's job, but a record must exist). On rejection, throw.
- [ ] **Step 2 — HI-15:** make bulk-download auth **unconditional** — require a valid access token regardless of `job.requireAccessToken` (default the missing flag to `true`; never serve NDJSON unauthenticated). Add a TTL sweep: store `{ ndjson, createdAt }` and a `Meteor.setInterval` (or lazy check on read) that evicts entries older than `settings.private.bulkData.ttlMinutes` (default 60), independent of explicit cancel.
- [ ] **Step 3 — prove-closed:** relay to a non-allowlisted host throws + is audited; a bulk-download without a token now 401s even for a flag-less job; an expired file key is gone after TTL. Legitimate: allowlisted relay + authenticated in-TTL download still succeed. `npm test` green.
- [ ] **Step 4 — commit:** `git commit  # "security(egress+at-rest): ProxyRelay allowlist+audit + bulk-store TTL/unconditional auth (HI-14/HI-15)"`

---

## Self-review notes (applied)

- **Every anchor re-verified firsthand this session** before a step was built on it: CR-1 `OAuthEndpoints.js:946` (literal TODO), CR-3 `FhirEndpoints.js:640` read / `:2114` PATCH `{multi:true}` / `:2196` legacy sync DELETE, the `authQuery` source `:1257-1284`, CR-4 `:1730` `newRecord = req.body`, HI-2 `FhirAuth.js:221` `systemSecret` default, HI-7 `SearchParametersEngine.js:714`, HI-8 `provider-directory/server/hooks.js:69`, CR-7 merkalis `this.userId`=0 + `relayEndpoint`, CR-9 `Methods.js:15`. The startup-invocation site (`core-startup.js` top-level calls) and the mocha/`node --test` harnesses were confirmed against `package.json` and `server/main.tests.js`.
- **Audit remediation order honored:** T1 secrets (CR-5/6/HI-9/10) → T2 CR-1 + T3/T4 CR-9/10 → T5/T6 CR-3/CR-4 → T7 CR-7/CR-8 → T8 CR-2/ME-1 → T9-T11 highs. Each Critical is its own task with its own reproduce→fix→prove→commit, independently reviewable.
- **One-finding-per-commit** with the audit ID in every message; the legitimate path is asserted in every prove-closed step (own-record read, correctly-signed assertion, allowlisted egress).
- **Human/crypto gates are explicit:** T2 STOPs after tests for human crypto review; T1 lists secret-value rotation + git-history purge as 🛑 HUMAN and does NOT execute them; T8 leaves real-deployment flag flips to a human.
- **Reuse over duplication:** one `urlAllowlist.js` serves CR-9/CR-10/CR-7/HI-14; one `buildCompartmentQuery` (factored from `:1257`) serves search + read + DELETE + PATCH; one `sanitizeWrite.js` serves POST + PUT.
- **Scope discipline:** dependency versions and PHI-in-logs deferred to their owning specs; only the architectural HI-14/HI-15 egress/at-rest items are pulled in. The `ServerMethods` JSON-RPC chokepoint is referenced (T5/T7) as the eventual home, but the direct fix lands now — remediation and the planned architecture converge rather than block on each other.
