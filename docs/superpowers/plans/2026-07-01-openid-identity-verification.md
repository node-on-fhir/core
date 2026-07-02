# OpenID Identity Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add step-up IAL2 identity proofing (Persona) that mints a `Patient` from verified attributes and surfaces the result through honeycomb's OpenID Connect layer (`userinfo`, `acr`/`amr`, discovery).

**Architecture:** A **thin, vendor-neutral core seam** (Part A, in the honeycomb monorepo) reads `Meteor.users.identityAssurance` and emits `acr`/`amr` claims in the `id_token` and a new `userinfo` endpoint. A **private extension** (Part B, `extensions/identity-verification/` = `@orbital/identity-verification`) owns everything vendor-specific: the proofing broker, the Persona adapter, the create-Patient binding strategy, the assurance store (which *writes* the field core reads), the webhook, and the step-up UI. The only coupling is that field.

**Tech Stack:** Meteor v3 (async collections), React 18 + MUI v5, `jsonwebtoken` (RS256, already imported), `meteor/fetch` for HTTP, `crypto` (HMAC), Node's built-in `node:test` runner for pure logic, Nightwatch for E2E.

## Global Constraints

- **Meteor v3 async only** on server: `findOneAsync`/`insertAsync`/`updateAsync`/`removeAsync`/`fetchAsync`. Meteor methods use `function(){}` (not arrow), guard `this.userId`.
- **ID lookups by `_id` only** — never `id || _id` OR-logic (ID-collision anti-pattern).
- **No secrets in source.** Persona `apiKey`/`webhookSecret` come from `Meteor.settings.private.identityProofing.persona.*`. Never log raw PII or evidence.
- **HTTP via `meteor/fetch`**, not a Node SDK (avoids the rspack/externals `require` hazards). Persona is called over REST.
- **Theme tokens** for any UI surface (`background.paper`, `text.primary`); no unconditional hardcoded colors.
- **Testing conventions:** pure/DI logic → co-located `*.test.mjs` run with `node --test <path>`; wiring/endpoints → curl integration against a running dev server (exact commands given); full flow → Nightwatch. Design every module to take a `deps` object so logic is testable without booting Meteor.
- **acr/amr default vocabulary:** `ial2` → `http://idmanagement.gov/ns/assurance/ial/2`, `aal2` → `http://idmanagement.gov/ns/assurance/aal/2`.
- **Person identifier system:** `http://hl7.org/fhir/us/identity-matching/ns/HL7PersonIdentifier`, value = a v4 UUID.
- **The signed webhook is the only thing that flips assurance.** A browser-reported success never elevates anyone.
- Spec: `docs/superpowers/specs/2026-07-01-openid-identity-verification-design.md`.

**Scope note (decomposition):** Part A ships and tests standalone (set `identityAssurance` by hand, watch `acr` appear). Part B is a separable subsystem in its own repo that writes the field Part A reads. They're kept in one plan because they share the coupling field and Part A must land first, but **each Part is independently executable and reviewable** — you may run them as two review streams.

---

# PART A — Core OIDC Assurance Seam (honeycomb monorepo)

## Task A1: `AssuranceVocabulary` — pure claim builder

**Files:**
- Create: `imports/lib/AssuranceVocabulary.js`
- Test: `imports/lib/AssuranceVocabulary.test.mjs`

**Interfaces:**
- Produces:
  - `ACR_BY_LEVEL` — `{ ial1, ial2 }` → URI strings.
  - `AMR_BY_AAL` — `{ aal1, aal2 }` → URI strings.
  - `buildAssuranceClaims(identityAssurance, opts)` → claims object. `identityAssurance` is the `Meteor.users.identityAssurance` sub-document (or `null`/`undefined`). `opts = { includePersonIdentifier?: boolean, vocab?: { acr, amr } }`. Returns `{}` when the argument is falsy or `status !== 'verified'`; otherwise `{ acr, amr, [hl7_person_identifier] }` where `amr` is a **string array** (`identityAssurance.amr` merged with the AAL URI).

- [ ] **Step 1: Write the failing test**

```js
// imports/lib/AssuranceVocabulary.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAssuranceClaims, ACR_BY_LEVEL, AMR_BY_AAL } from './AssuranceVocabulary.js';

test('returns empty object when assurance is missing', () => {
  assert.deepEqual(buildAssuranceClaims(null), {});
  assert.deepEqual(buildAssuranceClaims(undefined), {});
});

test('returns empty object when not verified', () => {
  assert.deepEqual(buildAssuranceClaims({ ial: 'ial2', status: 'pending' }), {});
});

test('emits acr and amr for a verified ial2 identity', () => {
  const claims = buildAssuranceClaims(
    { ial: 'ial2', aal: 'aal2', amr: ['pwd'], status: 'verified' }
  );
  assert.equal(claims.acr, ACR_BY_LEVEL.ial2);
  assert.deepEqual(claims.amr, ['pwd', AMR_BY_AAL.aal2]);
  assert.equal('hl7_person_identifier' in claims, false);
});

test('includes person identifier only when opted in and present', () => {
  const ia = { ial: 'ial2', aal: 'aal2', status: 'verified', personIdentifier: 'uuid-1' };
  assert.equal(buildAssuranceClaims(ia).hl7_person_identifier, undefined);
  assert.equal(
    buildAssuranceClaims(ia, { includePersonIdentifier: true }).hl7_person_identifier,
    'uuid-1'
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test imports/lib/AssuranceVocabulary.test.mjs`
Expected: FAIL — `Cannot find module './AssuranceVocabulary.js'`.

- [ ] **Step 3: Write minimal implementation**

```js
// imports/lib/AssuranceVocabulary.js
// Pure, dependency-free: maps a normalized assurance record to OIDC claims.

export const ACR_BY_LEVEL = {
  ial1: 'http://idmanagement.gov/ns/assurance/ial/1',
  ial2: 'http://idmanagement.gov/ns/assurance/ial/2'
};

export const AMR_BY_AAL = {
  aal1: 'http://idmanagement.gov/ns/assurance/aal/1',
  aal2: 'http://idmanagement.gov/ns/assurance/aal/2'
};

export function buildAssuranceClaims(identityAssurance, opts = {}) {
  if (!identityAssurance || identityAssurance.status !== 'verified') {
    return {};
  }
  const vocab = opts.vocab || { acr: ACR_BY_LEVEL, amr: AMR_BY_AAL };
  const acr = vocab.acr[identityAssurance.ial];
  if (!acr) {
    return {};
  }
  const amrBase = Array.isArray(identityAssurance.amr) ? identityAssurance.amr.slice() : [];
  const aalUri = vocab.amr[identityAssurance.aal];
  if (aalUri && !amrBase.includes(aalUri)) {
    amrBase.push(aalUri);
  }
  const claims = { acr, amr: amrBase };
  if (opts.includePersonIdentifier && identityAssurance.personIdentifier) {
    claims.hl7_person_identifier = identityAssurance.personIdentifier;
  }
  return claims;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test imports/lib/AssuranceVocabulary.test.mjs`
Expected: PASS — `# pass 4`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add imports/lib/AssuranceVocabulary.js imports/lib/AssuranceVocabulary.test.mjs
git commit -m "feat(oidc): AssuranceVocabulary pure claim builder"
```

---

## Task A2: Inject assurance claims into the `id_token` mint

**Files:**
- Modify: `server/OAuthEndpoints.js` (auth-code mint ~1300-1316; refresh mint ~1081-1094)

**Interfaces:**
- Consumes: `buildAssuranceClaims` from `imports/lib/AssuranceVocabulary.js`.
- Behavior: after `idTokenPayload` and the `fhirUser` block, load the acting user (`authorizedClient.user_id`) and `Object.assign` the assurance claims. `includePersonIdentifier` is true when `effectiveScope.includes('fhirUser')`.

- [ ] **Step 1: Add the import**

At the top of `server/OAuthEndpoints.js`, alongside the other imports (near line 19):

```js
import { buildAssuranceClaims } from '/imports/lib/AssuranceVocabulary.js';
```

- [ ] **Step 2: Inject in the authorization-code flow**

In the `if (effectiveScope.includes('openid'))` block, immediately **after** the `fhirUser` block (currently ending ~line 1311, before the `try` that signs), insert:

```js
        // Identity-assurance claims (acr/amr) — vendor-neutral, read from the user
        if (authorizedClient.user_id) {
          const actingUser = await Meteor.users.findOneAsync({ _id: authorizedClient.user_id });
          const assuranceClaims = buildAssuranceClaims(
            actingUser && actingUser.identityAssurance,
            { includePersonIdentifier: effectiveScope.includes('fhirUser') }
          );
          Object.assign(idTokenPayload, assuranceClaims);
        }
```

- [ ] **Step 3: Inject in the refresh flow**

In the refresh-token handler's `if (effectiveScope.includes('openid'))` block (payload built ~1081), after `idTokenPayload` is assembled and before `jwt.sign` (~1094), insert the same block but using `clientWithRefreshToken`:

```js
        if (clientWithRefreshToken.user_id) {
          const actingUser = await Meteor.users.findOneAsync({ _id: clientWithRefreshToken.user_id });
          const assuranceClaims = buildAssuranceClaims(
            actingUser && actingUser.identityAssurance,
            { includePersonIdentifier: effectiveScope.includes('fhirUser') }
          );
          Object.assign(idTokenPayload, assuranceClaims);
        }
```

- [ ] **Step 4: Integration-verify against a running server**

Boot dev (`meteor run --settings settings/settings.honeycomb.localhost.json`). In another shell, set a test user verified, then complete a token exchange (or use an existing test client). Minimal proof that the mint reads the field — run this in `meteor shell`:

```js
// meteor shell
import { buildAssuranceClaims } from '/imports/lib/AssuranceVocabulary.js';
buildAssuranceClaims({ ial:'ial2', aal:'aal2', status:'verified', amr:['pwd'] }, { includePersonIdentifier:true });
// Expected: { acr:'http://idmanagement.gov/ns/assurance/ial/2', amr:['pwd','http://idmanagement.gov/ns/assurance/aal/2'] }
```

Full token-flow verification happens in Task B-final (E2E). The server must **boot without error** with the new import.
Expected: server compiles; no import error in the Meteor console.

- [ ] **Step 5: Commit**

```bash
git add server/OAuthEndpoints.js
git commit -m "feat(oidc): stamp acr/amr into id_token from user identityAssurance"
```

---

## Task A3: `userinfo` endpoint

**Files:**
- Create: `server/UserInfoEndpoint.js`
- Modify: `server/main.js` (add `import '/server/UserInfoEndpoint.js';` beside the other endpoint imports)

**Interfaces:**
- Consumes: `buildAssuranceClaims`; `OAuthClients` collection (`imports/collections/OAuthClients.js`); `Meteor.users`.
- Produces: `GET|POST /oauth/userinfo` and `GET|POST /{fhirPath}/oauth/userinfo`. Bearer-authenticated. Returns `{ sub, fhirUser?, name?, email?, ...assuranceClaims }`. 401 on missing/invalid/expired token.

- [ ] **Step 1: Write the failing test (pure token→claims helper)**

The endpoint's testable core is a pure function that turns a resolved user + token record into the response body. Create `server/UserInfoEndpoint.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildUserInfoBody } from './UserInfoEndpoint.js';

test('builds userinfo body with assurance and fhirUser', () => {
  const body = buildUserInfoBody({
    user: { _id: 'u1', profile: { name: 'Jane Doe' }, emails: [{ address: 'jane@example.com' }],
            patientId: 'p1', identityAssurance: { ial:'ial2', aal:'aal2', status:'verified' } },
    tokenRecord: { user_id: 'u1', scope: 'openid fhirUser profile' },
    fhirBaseUrl: 'https://ex.org/baseR4'
  });
  assert.equal(body.sub, 'u1');
  assert.equal(body.fhirUser, 'https://ex.org/baseR4/Patient/p1');
  assert.equal(body.name, 'Jane Doe');
  assert.equal(body.email, 'jane@example.com');
  assert.equal(body.acr, 'http://idmanagement.gov/ns/assurance/ial/2');
});

test('omits fhirUser when scope lacks it', () => {
  const body = buildUserInfoBody({
    user: { _id: 'u1', patientId: 'p1', identityAssurance: { status:'unverified' } },
    tokenRecord: { user_id: 'u1', scope: 'openid' },
    fhirBaseUrl: 'https://ex.org/baseR4'
  });
  assert.equal('fhirUser' in body, false);
  assert.equal('acr' in body, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/UserInfoEndpoint.test.mjs`
Expected: FAIL — cannot find `buildUserInfoBody`.

- [ ] **Step 3: Implement**

```js
// server/UserInfoEndpoint.js
import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { buildAssuranceClaims } from '/imports/lib/AssuranceVocabulary.js';
import { OAuthClients } from '/imports/collections/OAuthClients.js';

// Pure: assemble the response body. Exported for node --test.
export function buildUserInfoBody({ user, tokenRecord, fhirBaseUrl }) {
  const scope = get(tokenRecord, 'scope', '') || '';
  const body = { sub: get(user, '_id') };
  const name = get(user, 'profile.name');
  if (name) body.name = name;
  const email = get(user, 'emails.0.address');
  if (email) body.email = email;
  if (get(user, 'patientId') && scope.includes('fhirUser')) {
    body.fhirUser = fhirBaseUrl + '/Patient/' + user.patientId;
  }
  Object.assign(body, buildAssuranceClaims(
    get(user, 'identityAssurance'),
    { includePersonIdentifier: scope.includes('fhirUser') }
  ));
  return body;
}

function extractBearer(req) {
  const h = req.headers['authorization'] || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

async function handleUserInfo(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const token = extractBearer(req);
  if (!token) { res.statusCode = 401; res.end(JSON.stringify({ error: 'invalid_token' })); return; }

  const tokenRecord = await OAuthClients.findOneAsync({ access_token: token });
  const expired = tokenRecord && tokenRecord.access_token_expires_at &&
    new Date(tokenRecord.access_token_expires_at).getTime() < Date.now();
  if (!tokenRecord || expired || tokenRecord.revoked) {
    res.statusCode = 401; res.end(JSON.stringify({ error: 'invalid_token' })); return;
  }

  const user = tokenRecord.user_id
    ? await Meteor.users.findOneAsync({ _id: tokenRecord.user_id })
    : null;
  const fhirBasePath = get(Meteor, 'settings.private.fhir.fhirPath', 'baseR4');
  const fhirBaseUrl = Meteor.absoluteUrl() + fhirBasePath;

  res.statusCode = 200;
  res.end(JSON.stringify(buildUserInfoBody({ user, tokenRecord, fhirBaseUrl })));
}

const fhirPath = get(Meteor, 'settings.private.fhir.fhirPath', 'baseR4');
WebApp.connectHandlers.use('/oauth/userinfo', handleUserInfo);
WebApp.connectHandlers.use('/' + fhirPath + '/oauth/userinfo', handleUserInfo);
console.log('[UserInfoEndpoint] mounted /oauth/userinfo');
```

Confirm the token field names against `OAuthEndpoints.js` (grep for `access_token_expires_at` / `revoked`); if the codebase uses different field names for expiry/revocation, match them here.

- [ ] **Step 4: Run test + integration-verify**

Run: `node --test server/UserInfoEndpoint.test.mjs`
Expected: PASS — `# pass 2  # fail 0`.

Integration (server running, with a valid bearer token `$TOK`):
```bash
curl -s http://localhost:3000/oauth/userinfo -H "Authorization: Bearer $TOK"
# Expected: JSON with "sub"; 401 JSON when the header is omitted.
```

- [ ] **Step 5: Commit**

```bash
git add server/UserInfoEndpoint.js server/UserInfoEndpoint.test.mjs server/main.js
git commit -m "feat(oidc): add /oauth/userinfo endpoint with assurance claims"
```

---

## Task A4: Advertise `userinfo` + assurance in discovery

**Files:**
- Modify: `server/Metadata.js` (openid-configuration object ~563-605)

**Interfaces:**
- Adds `userinfo_endpoint`, `acr_values_supported` and extends `claims_supported` in the `.well-known/openid-configuration` response object.

- [ ] **Step 1: Locate the openid-configuration object**

In `server/Metadata.js`, find the object returned by the `openid-configuration` handler (contains `"id_token_signing_alg_values_supported": ["RS256"]` ~line 571 and `"claims_supported"` ~line 591).

- [ ] **Step 2: Add the fields**

Add to that object (next to `token_endpoint`):

```js
      "userinfo_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.userinfoEndpoint', "oauth/userinfo"),
      "acr_values_supported": [
        "http://idmanagement.gov/ns/assurance/ial/2"
      ],
```

And extend `claims_supported` — append `"acr"`, `"amr"`, `"hl7_person_identifier"` to the existing array literal.

- [ ] **Step 3: Integration-verify**

```bash
curl -s http://localhost:3000/.well-known/openid-configuration | python3 -m json.tool | grep -E "userinfo_endpoint|acr_values_supported|hl7_person_identifier"
# Expected: all three present.
```

- [ ] **Step 4: Commit**

```bash
git add server/Metadata.js
git commit -m "feat(oidc): advertise userinfo_endpoint + acr_values in discovery"
```

---

# PART B — `@orbital/identity-verification` Extension

> All Part B files live under `extensions/identity-verification/` (its own private git repo; gitignored from the monorepo). Registered at runtime via `EXTRA_WORKFLOWS=@orbital/identity-verification`. A **full Meteor restart** is required for new routes to appear (the workflow parser runs once at rspack boot).

## Task B1: Scaffold the extension package

**Files:**
- Create: `extensions/identity-verification/package.json`
- Create: `extensions/identity-verification/workflow.json`
- Create: `extensions/identity-verification/client.js`
- Create: `extensions/identity-verification/server.js`
- Create: `extensions/identity-verification/client/VerifyIdentityPage.jsx` (placeholder for now)

**Interfaces:**
- Produces: a loadable workflow package exposing `DynamicRoutes` + a default export, per `.claude/rules/npm-packages/migration-pattern.md`.

- [ ] **Step 1: package.json**

```json
{
  "name": "@orbital/identity-verification",
  "version": "0.1.0",
  "description": "Step-up IAL2 identity proofing broker (Persona) for honeycomb",
  "license": "UNLICENSED",
  "private": true,
  "main": "client.js",
  "meteor": { "mainModule": { "client": "client.js", "server": "server.js" } },
  "peerDependencies": {
    "react": "^18.0.0",
    "@mui/material": "^5.0.0",
    "@mui/icons-material": "^5.0.0"
  }
}
```

- [ ] **Step 2: workflow.json**

```json
{
  "name": "identity-verification",
  "displayName": "Identity Verification",
  "routes": [
    { "name": "VerifyIdentity", "path": "/verify-identity", "component": "VerifyIdentityPage", "requireAuth": true },
    { "name": "IdvCallback", "path": "/idv/callback", "component": "IdvCallbackPage", "requireAuth": true }
  ],
  "sidebarItems": []
}
```

- [ ] **Step 3: Placeholder page + client.js**

```jsx
// extensions/identity-verification/client/VerifyIdentityPage.jsx
import React from 'react';
import { Container, Typography } from '@mui/material';
export default function VerifyIdentityPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ color: 'text.primary' }}>Verify your identity</Typography>
    </Container>
  );
}
```

```js
// extensions/identity-verification/client.js
import React from 'react';
import VerifyIdentityPage from './client/VerifyIdentityPage.jsx';

const componentMap = { VerifyIdentityPage: <VerifyIdentityPage /> };

const DynamicRoutes = [
  { name: 'VerifyIdentity', path: '/verify-identity', element: componentMap.VerifyIdentityPage, requireAuth: true }
];

export { DynamicRoutes };
export default { name: 'identity-verification', routes: DynamicRoutes, sidebarItems: [] };
```

```js
// extensions/identity-verification/server.js
console.log('[identity-verification] server entry loaded');
```

- [ ] **Step 4: Verify it loads**

```bash
cd extensions/identity-verification && git init -q && cd /Volumes/MobileDev/Code/honeycomb
npm install
EXTRA_WORKFLOWS=@orbital/identity-verification meteor run --settings settings/settings.honeycomb.localhost.json
```
Navigate to `/verify-identity`.
Expected: the placeholder "Verify your identity" renders; server console shows `[identity-verification] server entry loaded`. (If it 404s, confirm the node_modules symlink exists and you did a **full** restart — see the workflow-route-404 gotcha.)

- [ ] **Step 5: Commit (in the extension's own repo)**

```bash
cd extensions/identity-verification
git add -A && git commit -m "feat: scaffold @orbital/identity-verification package"
cd /Volumes/MobileDev/Code/honeycomb
```

---

## Task B2: `IdentityProofingEvents` collection

**Files:**
- Create: `extensions/identity-verification/collections/IdentityProofingEvents.js`
- Modify: `extensions/identity-verification/server.js` (import it)

**Interfaces:**
- Produces: `IdentityProofingEvents` = `new Mongo.Collection('IdentityProofingEvents')`. Doc shape: `{ _id (proofingId), userId, adapter, status, vendorInquiryId, vendorEventIds:[], createdAt, completedAt, resultSummary, error }`.

- [ ] **Step 1: Implement**

```js
// extensions/identity-verification/collections/IdentityProofingEvents.js
import { Mongo } from 'meteor/mongo';
export const IdentityProofingEvents = new Mongo.Collection('IdentityProofingEvents');
```

- [ ] **Step 2: Register on the server**

Add to `extensions/identity-verification/server.js`:
```js
import { IdentityProofingEvents } from './collections/IdentityProofingEvents.js';
console.log('[identity-verification] IdentityProofingEvents registered');
```

- [ ] **Step 3: Verify**

Restart with `EXTRA_WORKFLOWS`. In `meteor shell`:
```js
IdentityProofingEvents  // (via global?) — or confirm the console log printed at boot.
```
Expected: boot log `IdentityProofingEvents registered`, no error.

- [ ] **Step 4: Commit**

```bash
cd extensions/identity-verification && git add -A && git commit -m "feat: IdentityProofingEvents collection" && cd /Volumes/MobileDev/Code/honeycomb
```

---

## Task B3: `VerifiedIdentityResult` shape + validator (pure)

**Files:**
- Create: `extensions/identity-verification/lib/VerifiedIdentityResult.js`
- Test: `extensions/identity-verification/lib/VerifiedIdentityResult.test.mjs`

**Interfaces:**
- Produces: `makeVerifiedIdentityResult(fields)` → frozen object; throws on missing required fields. `isVerifiedIdentityResult(obj)` → boolean. Fields: `{ proofingId, status, assuranceLevel, method, amr, attributes, evidence, vendorRef }`.

- [ ] **Step 1: Failing test**

```js
// extensions/identity-verification/lib/VerifiedIdentityResult.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeVerifiedIdentityResult, isVerifiedIdentityResult } from './VerifiedIdentityResult.js';

test('builds a valid result', () => {
  const r = makeVerifiedIdentityResult({
    proofingId: 'e1', status: 'completed', assuranceLevel: 'ial2',
    method: 'persona:doc+selfie', amr: ['pwd'],
    attributes: { givenName: 'Jane', familyName: 'Doe', birthDate: '1979-01-01' },
    evidence: [{ type: 'drivers_license', issuer: 'CA', classification: 'STRONG' }],
    vendorRef: 'inq_123'
  });
  assert.equal(r.assuranceLevel, 'ial2');
  assert.equal(isVerifiedIdentityResult(r), true);
});

test('throws when a required field is missing', () => {
  assert.throws(() => makeVerifiedIdentityResult({ status: 'completed' }));
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `node --test extensions/identity-verification/lib/VerifiedIdentityResult.test.mjs`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```js
// extensions/identity-verification/lib/VerifiedIdentityResult.js
const REQUIRED = ['proofingId', 'status', 'assuranceLevel', 'method', 'attributes', 'vendorRef'];

export function makeVerifiedIdentityResult(fields) {
  for (const key of REQUIRED) {
    if (fields[key] === undefined || fields[key] === null) {
      throw new Error('VerifiedIdentityResult missing required field: ' + key);
    }
  }
  return Object.freeze({
    proofingId: fields.proofingId,
    status: fields.status,
    assuranceLevel: fields.assuranceLevel,
    method: fields.method,
    amr: Array.isArray(fields.amr) ? fields.amr : [],
    attributes: fields.attributes,
    evidence: Array.isArray(fields.evidence) ? fields.evidence : [],
    vendorRef: fields.vendorRef
  });
}

export function isVerifiedIdentityResult(obj) {
  return !!obj && REQUIRED.every((k) => obj[k] !== undefined && obj[k] !== null);
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `node --test extensions/identity-verification/lib/VerifiedIdentityResult.test.mjs`
Expected: PASS — `# pass 2  # fail 0`.

- [ ] **Step 5: Commit**

```bash
cd extensions/identity-verification && git add -A && git commit -m "feat: VerifiedIdentityResult shape + validator" && cd /Volumes/MobileDev/Code/honeycomb
```

---

## Task B4: Persona evidence → assurance mapping (pure)

**Files:**
- Create: `extensions/identity-verification/lib/evidenceMapping.js`
- Test: `extensions/identity-verification/lib/evidenceMapping.test.mjs`

**Interfaces:**
- Produces: `mapPersonaEvidenceToAssurance(inquiryPayload)` → `{ assuranceLevel, method, amr, attributes, evidence }`. IAL2 requires a passed government-ID verification **and** a passed selfie/biometric verification; otherwise IAL1. `attributes` are extracted from Persona's verified fields.

- [ ] **Step 1: Failing test**

```js
// extensions/identity-verification/lib/evidenceMapping.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapPersonaEvidenceToAssurance } from './evidenceMapping.js';

const passedInquiry = {
  data: { attributes: {
    'name-first': 'Jane', 'name-last': 'Doe', birthdate: '1979-01-01',
    'address-street-1': '1234 Hollywood Blvd', 'address-city': 'Los Angeles',
    'address-subdivision': 'CA', 'address-postal-code': '90210',
    'phone-number': '+15557771234', 'email-address': 'jane@example.com'
  }},
  verifications: [
    { type: 'government-id', status: 'passed' },
    { type: 'selfie', status: 'passed' }
  ]
};

test('two passed verifications → ial2 with extracted attributes', () => {
  const r = mapPersonaEvidenceToAssurance(passedInquiry);
  assert.equal(r.assuranceLevel, 'ial2');
  assert.equal(r.attributes.givenName, 'Jane');
  assert.equal(r.attributes.address.state, 'CA');
  assert.equal(r.evidence.length, 2);
});

test('missing selfie → ial1', () => {
  const r = mapPersonaEvidenceToAssurance({
    ...passedInquiry, verifications: [{ type: 'government-id', status: 'passed' }]
  });
  assert.equal(r.assuranceLevel, 'ial1');
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `node --test extensions/identity-verification/lib/evidenceMapping.test.mjs`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```js
// extensions/identity-verification/lib/evidenceMapping.js
function attr(a, k) { return a && a[k] !== undefined ? a[k] : undefined; }

export function mapPersonaEvidenceToAssurance(inquiry) {
  const a = (inquiry && inquiry.data && inquiry.data.attributes) || {};
  const verifications = (inquiry && inquiry.verifications) || [];
  const passed = (type) => verifications.some((v) => v.type === type && v.status === 'passed');

  const hasGovId = passed('government-id');
  const hasSelfie = passed('selfie');
  const assuranceLevel = hasGovId && hasSelfie ? 'ial2' : 'ial1';

  const attributes = {
    givenName: attr(a, 'name-first'),
    familyName: attr(a, 'name-last'),
    birthDate: attr(a, 'birthdate'),
    address: {
      line: attr(a, 'address-street-1'),
      city: attr(a, 'address-city'),
      state: attr(a, 'address-subdivision'),
      postalCode: attr(a, 'address-postal-code'),
      country: attr(a, 'address-country-code') || 'US'
    },
    phone: attr(a, 'phone-number'),
    email: attr(a, 'email-address')
  };

  const evidence = verifications
    .filter((v) => v.status === 'passed')
    .map((v) => ({ type: v.type, issuer: v.issuer || null, classification: v.type === 'government-id' ? 'STRONG' : 'FAIR' }));

  return {
    assuranceLevel,
    method: 'persona:' + verifications.map((v) => v.type).join('+'),
    amr: ['pwd'],
    attributes,
    evidence
  };
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `node --test extensions/identity-verification/lib/evidenceMapping.test.mjs`
Expected: PASS — `# pass 2  # fail 0`.

- [ ] **Step 5: Commit**

```bash
cd extensions/identity-verification && git add -A && git commit -m "feat: Persona evidence → IAL mapping" && cd /Volumes/MobileDev/Code/honeycomb
```

---

## Task B5: `PersonaAdapter` — webhook verification + result parsing (pure core)

**Files:**
- Create: `extensions/identity-verification/server/adapters/PersonaAdapter.js`
- Test: `extensions/identity-verification/server/adapters/PersonaAdapter.test.mjs`

**Interfaces:**
- Consumes: `mapPersonaEvidenceToAssurance`, `makeVerifiedIdentityResult`.
- Produces: `makePersonaAdapter(config)` → `{ createInquiry(user, {referenceId}), verifyWebhook(rawBody, headers), parseResult(payload, proofingId) }`.
  - `config = { apiKey, webhookSecret, inquiryTemplateId, environment, fetchImpl }`.
  - `verifyWebhook(rawBody, headers)` → boolean: parse `Persona-Signature: t=<ts>,v1=<hex>`, recompute `HMAC_SHA256(webhookSecret, "<t>.<rawBody>")`, constant-time compare. Pure given config; `node --test`-able.
  - `parseResult(payload, proofingId)` → `VerifiedIdentityResult`.

- [ ] **Step 1: Failing test (HMAC verify + parse)**

```js
// extensions/identity-verification/server/adapters/PersonaAdapter.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { makePersonaAdapter } from './PersonaAdapter.js';

const secret = 'whsec_test';
const adapter = makePersonaAdapter({ apiKey: 'k', webhookSecret: secret, inquiryTemplateId: 'tmpl', environment: 'sandbox' });

function sign(rawBody, ts) {
  const mac = crypto.createHmac('sha256', secret).update(`${ts}.${rawBody}`).digest('hex');
  return `t=${ts},v1=${mac}`;
}

test('verifyWebhook accepts a correctly signed body', () => {
  const raw = '{"data":{}}';
  const ts = '1719800000';
  assert.equal(adapter.verifyWebhook(raw, { 'persona-signature': sign(raw, ts) }), true);
});

test('verifyWebhook rejects a tampered body', () => {
  const ts = '1719800000';
  const sig = sign('{"data":{}}', ts);
  assert.equal(adapter.verifyWebhook('{"data":{"x":1}}', { 'persona-signature': sig }), false);
});

test('verifyWebhook rejects a missing signature', () => {
  assert.equal(adapter.verifyWebhook('{}', {}), false);
});

test('parseResult produces a VerifiedIdentityResult', () => {
  const payload = { data: { attributes: { 'name-first': 'Jane', 'name-last': 'Doe', birthdate: '1979-01-01' } },
    verifications: [{ type: 'government-id', status: 'passed' }, { type: 'selfie', status: 'passed' }],
    inquiryId: 'inq_1' };
  const r = adapter.parseResult(payload, 'e1');
  assert.equal(r.assuranceLevel, 'ial2');
  assert.equal(r.proofingId, 'e1');
  assert.equal(r.vendorRef, 'inq_1');
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `node --test extensions/identity-verification/server/adapters/PersonaAdapter.test.mjs`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```js
// extensions/identity-verification/server/adapters/PersonaAdapter.js
import crypto from 'node:crypto';
import { mapPersonaEvidenceToAssurance } from '../../lib/evidenceMapping.js';
import { makeVerifiedIdentityResult } from '../../lib/VerifiedIdentityResult.js';

const PERSONA_API = { sandbox: 'https://withpersona.com/api/v1', production: 'https://withpersona.com/api/v1' };

export function makePersonaAdapter(config) {
  const fetchImpl = config.fetchImpl; // injected in production (meteor/fetch); unused in pure tests

  function verifyWebhook(rawBody, headers) {
    const header = headers['persona-signature'] || headers['Persona-Signature'];
    if (!header || !config.webhookSecret) return false;
    const parts = Object.fromEntries(header.split(',').map((kv) => kv.trim().split('=')));
    if (!parts.t || !parts.v1) return false;
    const expected = crypto.createHmac('sha256', config.webhookSecret)
      .update(`${parts.t}.${rawBody}`).digest('hex');
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(parts.v1, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  function parseResult(payload, proofingId) {
    const mapped = mapPersonaEvidenceToAssurance(payload);
    return makeVerifiedIdentityResult({
      proofingId,
      status: mapped.assuranceLevel === 'ial2' ? 'completed' : 'failed',
      assuranceLevel: mapped.assuranceLevel,
      method: mapped.method,
      amr: mapped.amr,
      attributes: mapped.attributes,
      evidence: mapped.evidence,
      vendorRef: payload.inquiryId || (payload.data && payload.data.id) || 'unknown'
    });
  }

  async function createInquiry(user, { referenceId }) {
    const base = PERSONA_API[config.environment] || PERSONA_API.sandbox;
    const resp = await fetchImpl(base + '/inquiries', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + config.apiKey,
        'Content-Type': 'application/json',
        'Persona-Version': '2023-01-05'
      },
      body: JSON.stringify({ data: { attributes: {
        'inquiry-template-id': config.inquiryTemplateId, 'reference-id': referenceId
      }}})
    });
    const json = await resp.json();
    const inquiryId = json.data && json.data.id;
    return {
      vendorRef: inquiryId,
      redirectUrl: 'https://withpersona.com/verify?inquiry-id=' + inquiryId
    };
  }

  return { createInquiry, verifyWebhook, parseResult };
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `node --test extensions/identity-verification/server/adapters/PersonaAdapter.test.mjs`
Expected: PASS — `# pass 4  # fail 0`.

Before shipping, confirm the exact Persona signature scheme and attribute keys against Persona's current webhook docs; adjust `verifyWebhook` parsing and the `evidenceMapping` keys if their payload differs. The HMAC construction (`"<t>.<rawBody>"`) and constant-time compare are the invariant.

- [ ] **Step 5: Commit**

```bash
cd extensions/identity-verification && git add -A && git commit -m "feat: PersonaAdapter (HMAC webhook verify + result parsing)" && cd /Volumes/MobileDev/Code/honeycomb
```

---

## Task B6: `CreatePatientBinding` (strategy C)

**Files:**
- Create: `extensions/identity-verification/server/bindingStrategies/BindingStrategy.js`
- Create: `extensions/identity-verification/server/bindingStrategies/CreatePatientBinding.js`
- Test: `extensions/identity-verification/server/bindingStrategies/CreatePatientBinding.test.mjs`

**Interfaces:**
- Produces:
  - `buildPatientFromAttributes(attributes, personIdentifier)` → FHIR `Patient` (pure).
  - `createPatientBinding(userId, verifiedResult, deps)` → `{ patientId, personIdentifier, created }`. `deps = { Patients, Users, uuid }`. Dedupes on the HL7 Person Identifier.
- `BindingStrategy.js` documents the interface `bind(userId, verifiedResult) -> {patientId, personIdentifier, created}` (a comment-only contract for A/B later).

- [ ] **Step 1: Failing test (with in-memory fakes)**

```js
// extensions/identity-verification/server/bindingStrategies/CreatePatientBinding.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPatientFromAttributes, createPatientBinding } from './CreatePatientBinding.js';

const PERSON_SYS = 'http://hl7.org/fhir/us/identity-matching/ns/HL7PersonIdentifier';

function fakeCollection(seed = []) {
  const docs = seed.slice();
  return {
    docs,
    async findOneAsync(q) {
      return docs.find((d) => {
        if (q._id) return d._id === q._id;
        if (q['identifier.value']) return (d.identifier || []).some((i) => i.value === q['identifier.value']);
        return false;
      }) || null;
    },
    async insertAsync(doc) { docs.push(doc); return doc._id; },
    async updateAsync(q, mod) {
      const d = docs.find((x) => x._id === q._id);
      if (d) Object.assign(d, mod.$set);
      return 1;
    }
  };
}

test('buildPatientFromAttributes stamps the person identifier', () => {
  const p = buildPatientFromAttributes(
    { givenName: 'Jane', familyName: 'Doe', birthDate: '1979-01-01',
      address: { line: '1 A St', city: 'LA', state: 'CA', postalCode: '90210', country: 'US' } },
    'uuid-1'
  );
  assert.equal(p.resourceType, 'Patient');
  assert.equal(p.name[0].family, 'Doe');
  assert.ok(p.identifier.some((i) => i.system === PERSON_SYS && i.value === 'uuid-1'));
});

test('createPatientBinding mints a Patient and links the user', async () => {
  const Patients = fakeCollection();
  const Users = fakeCollection([{ _id: 'u1' }]);
  let n = 0;
  const deps = { Patients, Users, uuid: () => 'uuid-fixed-' + (++n) };
  const result = { attributes: { givenName: 'Jane', familyName: 'Doe', birthDate: '1979-01-01', address: {} } };

  const out = await createPatientBinding('u1', result, deps);
  assert.equal(out.created, true);
  assert.equal(Patients.docs.length, 1);
  const user = await Users.findOneAsync({ _id: 'u1' });
  assert.equal(user.patientId, out.patientId);
});

test('createPatientBinding dedupes on repeat proofing', async () => {
  const existing = { _id: 'pX', resourceType: 'Patient',
    identifier: [{ system: PERSON_SYS, value: 'uuid-dup' }] };
  const Patients = fakeCollection([existing]);
  const Users = fakeCollection([{ _id: 'u1' }]);
  const deps = { Patients, Users, uuid: () => 'uuid-dup' };
  const result = { attributes: { givenName: 'Jane', familyName: 'Doe', birthDate: '1979-01-01', address: {} },
    personIdentifier: 'uuid-dup' };

  const out = await createPatientBinding('u1', result, deps);
  assert.equal(out.created, false);
  assert.equal(out.patientId, 'pX');
  assert.equal(Patients.docs.length, 1);
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `node --test extensions/identity-verification/server/bindingStrategies/CreatePatientBinding.test.mjs`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```js
// extensions/identity-verification/server/bindingStrategies/BindingStrategy.js
// Interface contract (documentation only): a binding strategy maps a
// VerifiedIdentityResult to a Patient linkage.
//   bind(userId, verifiedResult) -> { patientId, personIdentifier, created }
// Strategy C (create) ships first; A (confirm) and B (match) implement the
// same signature later.
export const BINDING_STRATEGY_CONTRACT = 'bind(userId, verifiedResult) -> { patientId, personIdentifier, created }';
```

```js
// extensions/identity-verification/server/bindingStrategies/CreatePatientBinding.js
export const PERSON_IDENTIFIER_SYSTEM =
  'http://hl7.org/fhir/us/identity-matching/ns/HL7PersonIdentifier';

export function buildPatientFromAttributes(attributes, personIdentifier) {
  const a = attributes || {};
  const addr = a.address || {};
  return {
    resourceType: 'Patient',
    identifier: [{ system: PERSON_IDENTIFIER_SYSTEM, value: personIdentifier }],
    name: [{ family: a.familyName, given: [a.givenName].filter(Boolean) }],
    birthDate: a.birthDate,
    telecom: [
      a.phone ? { system: 'phone', value: a.phone } : null,
      a.email ? { system: 'email', value: a.email } : null
    ].filter(Boolean),
    address: (addr.line || addr.city) ? [{
      line: addr.line ? [addr.line] : [],
      city: addr.city, state: addr.state, postalCode: addr.postalCode, country: addr.country
    }] : []
  };
}

export async function createPatientBinding(userId, verifiedResult, deps) {
  const { Patients, Users, uuid } = deps;
  const personIdentifier = verifiedResult.personIdentifier || uuid();

  // Dedupe: repeat proofing must re-link, never fork a second Patient.
  const existing = await Patients.findOneAsync({ 'identifier.value': personIdentifier });
  if (existing) {
    await Users.updateAsync({ _id: userId }, { $set: { patientId: existing._id } });
    return { patientId: existing._id, personIdentifier, created: false };
  }

  const patient = buildPatientFromAttributes(verifiedResult.attributes, personIdentifier);
  patient._id = uuid();
  patient.id = patient._id;
  await Patients.insertAsync(patient);
  await Users.updateAsync({ _id: userId }, { $set: { patientId: patient._id } });
  return { patientId: patient._id, personIdentifier, created: true };
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `node --test extensions/identity-verification/server/bindingStrategies/CreatePatientBinding.test.mjs`
Expected: PASS — `# pass 3  # fail 0`.

- [ ] **Step 5: Commit**

```bash
cd extensions/identity-verification && git add -A && git commit -m "feat: CreatePatientBinding (strategy C) with dedupe" && cd /Volumes/MobileDev/Code/honeycomb
```

---

## Task B7: `AssuranceStore` — write the field + emit AuditEvent

**Files:**
- Create: `extensions/identity-verification/server/AssuranceStore.js`
- Test: `extensions/identity-verification/server/AssuranceStore.test.mjs`

**Interfaces:**
- Produces: `recordAssurance(userId, verifiedResult, bindResult, deps)` → writes `Meteor.users.identityAssurance` and inserts a proofing `AuditEvent`. `deps = { Users, AuditEvents, now }`. Sets `status: 'verified'` when `assuranceLevel === 'ial2'`, else `'failed'`.

- [ ] **Step 1: Failing test**

```js
// extensions/identity-verification/server/AssuranceStore.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordAssurance } from './AssuranceStore.js';

function fakeUsers(seed) {
  const docs = seed.slice();
  return { docs,
    async updateAsync(q, mod) { const d = docs.find((x) => x._id === q._id); if (d) Object.assign(d, mod.$set); return 1; } };
}
function fakeAudit() { const docs = []; return { docs, async insertAsync(d) { docs.push(d); return 'a1'; } }; }

test('records verified assurance and an AuditEvent for ial2', async () => {
  const Users = fakeUsers([{ _id: 'u1' }]);
  const AuditEvents = fakeAudit();
  const result = { proofingId: 'e1', assuranceLevel: 'ial2', method: 'persona:government-id+selfie', vendorRef: 'inq_1' };
  const bind = { patientId: 'p1', personIdentifier: 'uuid-1' };
  await recordAssurance('u1', result, bind, { Users, AuditEvents, now: () => new Date('2026-07-01T00:00:00Z') });

  assert.equal(Users.docs[0].identityAssurance.ial, 'ial2');
  assert.equal(Users.docs[0].identityAssurance.status, 'verified');
  assert.equal(Users.docs[0].identityAssurance.personIdentifier, 'uuid-1');
  assert.equal(AuditEvents.docs.length, 1);
  assert.equal(AuditEvents.docs[0].outcome, '0'); // success
});

test('failed proofing writes status failed and no elevation', async () => {
  const Users = fakeUsers([{ _id: 'u1' }]);
  const AuditEvents = fakeAudit();
  const result = { proofingId: 'e2', assuranceLevel: 'ial1', method: 'persona:government-id', vendorRef: 'inq_2' };
  await recordAssurance('u1', result, { patientId: null, personIdentifier: null },
    { Users, AuditEvents, now: () => new Date() });
  assert.equal(Users.docs[0].identityAssurance.status, 'failed');
  assert.equal(AuditEvents.docs[0].outcome, '4'); // minor failure
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `node --test extensions/identity-verification/server/AssuranceStore.test.mjs`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```js
// extensions/identity-verification/server/AssuranceStore.js
// Writes the ONE field the core OIDC seam reads (Meteor.users.identityAssurance)
// and emits a proofing AuditEvent. No raw PII/evidence is stored here.
export async function recordAssurance(userId, verifiedResult, bindResult, deps) {
  const { Users, AuditEvents, now } = deps;
  const verified = verifiedResult.assuranceLevel === 'ial2';
  const at = now();

  const identityAssurance = {
    ial: verifiedResult.assuranceLevel,
    aal: 'aal2',
    provider: 'persona',
    method: verifiedResult.method,
    verifiedAt: at,
    evidenceRef: verifiedResult.proofingId,
    personIdentifier: bindResult.personIdentifier || null,
    status: verified ? 'verified' : 'failed'
  };
  await Users.updateAsync({ _id: userId }, { $set: { identityAssurance } });

  const auditEvent = {
    resourceType: 'AuditEvent',
    type: { system: 'http://dicom.nema.org/resources/ontology/DCM', code: '110114', display: 'User Authentication' },
    subtype: [{ system: 'http://hl7.org/fhir/us/identity-matching', code: 'identity-verification' }],
    action: 'E',
    recorded: at,
    outcome: verified ? '0' : '4',
    agent: [{ who: { reference: 'user/' + userId }, requestor: true }],
    entity: [
      bindResult.patientId ? { what: { reference: 'Patient/' + bindResult.patientId } } : null,
      { what: { display: 'proofing:' + verifiedResult.proofingId }, detail: [{ type: 'provider', valueString: 'persona' }] }
    ].filter(Boolean)
  };
  await AuditEvents.insertAsync(auditEvent);
  return identityAssurance;
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `node --test extensions/identity-verification/server/AssuranceStore.test.mjs`
Expected: PASS — `# pass 2  # fail 0`.

Confirm the `AuditEvents` collection name/import used elsewhere in the monorepo (grep `new Mongo.Collection('AuditEvent`); wire the real collection in Task B9.

- [ ] **Step 5: Commit**

```bash
cd extensions/identity-verification && git add -A && git commit -m "feat: AssuranceStore writes identityAssurance + AuditEvent" && cd /Volumes/MobileDev/Code/honeycomb
```

---

## Task B8: `IdentityProofingBroker` — registry + orchestration

**Files:**
- Create: `extensions/identity-verification/server/IdentityProofingBroker.js`
- Test: `extensions/identity-verification/server/IdentityProofingBroker.test.mjs`

**Interfaces:**
- Produces a singleton-style factory `makeBroker(deps)` (DI for tests) plus a default instance wired in Task B9.
  - `register(name, adapter)`
  - `startProofing(userId, { adapter })` → `{ redirectUrl, proofingId }`; inserts an `IdentityProofingEvents` doc `{status:'created'}`.
  - `handleCallback(adapterName, rawBody, headers)` → `{ verifiedResult, proofingId }` after HMAC verify + idempotency; throws `Error('invalid_signature')` / returns `{ duplicate: true }` on replay.
  - `deps = { Events, adaptersMap, uuid, now }`.

- [ ] **Step 1: Failing test**

```js
// extensions/identity-verification/server/IdentityProofingBroker.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeBroker } from './IdentityProofingBroker.js';

function fakeEvents(seed = []) {
  const docs = seed.slice();
  return { docs,
    async insertAsync(d) { docs.push(d); return d._id; },
    async findOneAsync(q) { return docs.find((x) => x._id === q._id) || null; },
    async updateAsync(q, mod) { const d = docs.find((x) => x._id === q._id);
      if (d) { if (mod.$set) Object.assign(d, mod.$set); if (mod.$push) (d[Object.keys(mod.$push)[0]] ||= []).push(Object.values(mod.$push)[0]); } return 1; } };
}

const fakeAdapter = {
  async createInquiry() { return { vendorRef: 'inq_1', redirectUrl: 'https://persona/verify' }; },
  verifyWebhook(raw, headers) { return headers['persona-signature'] === 'good'; },
  parseResult(payload, proofingId) { return { proofingId, status: 'completed', assuranceLevel: 'ial2', vendorRef: 'inq_1', eventId: payload.eventId }; }
};

test('startProofing creates an event and returns a redirect', async () => {
  const Events = fakeEvents();
  const broker = makeBroker({ Events, uuid: () => 'e1', now: () => new Date() });
  broker.register('persona', fakeAdapter);
  const out = await broker.startProofing('u1', { adapter: 'persona' });
  assert.equal(out.proofingId, 'e1');
  assert.equal(out.redirectUrl, 'https://persona/verify');
  assert.equal(Events.docs[0].status, 'created');
});

test('handleCallback rejects a bad signature', async () => {
  const Events = fakeEvents([{ _id: 'e1', status: 'created', vendorEventIds: [] }]);
  const broker = makeBroker({ Events, uuid: () => 'x', now: () => new Date() });
  broker.register('persona', fakeAdapter);
  await assert.rejects(() => broker.handleCallback('persona', '{}', { 'persona-signature': 'bad' }), /invalid_signature/);
});

test('handleCallback is idempotent on replay', async () => {
  const Events = fakeEvents([{ _id: 'e1', status: 'completed', vendorEventIds: ['evt_1'] }]);
  const broker = makeBroker({ Events, uuid: () => 'x', now: () => new Date() });
  broker.register('persona', fakeAdapter);
  const payload = JSON.stringify({ eventId: 'evt_1', referenceId: 'e1' });
  const out = await broker.handleCallback('persona', payload, { 'persona-signature': 'good' });
  assert.equal(out.duplicate, true);
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `node --test extensions/identity-verification/server/IdentityProofingBroker.test.mjs`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```js
// extensions/identity-verification/server/IdentityProofingBroker.js
export function makeBroker(deps) {
  const { Events, uuid, now } = deps;
  const adapters = new Map();

  function register(name, adapter) { adapters.set(name, adapter); }
  function get(name) {
    const a = adapters.get(name);
    if (!a) throw new Error('unknown_adapter:' + name);
    return a;
  }

  async function startProofing(userId, { adapter }) {
    const a = get(adapter);
    const proofingId = uuid();
    await Events.insertAsync({
      _id: proofingId, userId, adapter, status: 'created',
      vendorInquiryId: null, vendorEventIds: [], createdAt: now(), completedAt: null,
      resultSummary: null, error: null
    });
    const { vendorRef, redirectUrl } = await a.createInquiry({ _id: userId }, { referenceId: proofingId });
    await Events.updateAsync({ _id: proofingId }, { $set: { vendorInquiryId: vendorRef, status: 'pending' } });
    return { proofingId, redirectUrl };
  }

  async function handleCallback(adapterName, rawBody, headers) {
    const a = get(adapterName);
    if (!a.verifyWebhook(rawBody, headers)) throw new Error('invalid_signature');

    const payload = JSON.parse(rawBody);
    const proofingId = payload.referenceId || payload.reference_id;
    const event = proofingId ? await Events.findOneAsync({ _id: proofingId }) : null;

    const eventId = payload.eventId || payload.id;
    if (event && eventId && (event.vendorEventIds || []).includes(eventId)) {
      return { duplicate: true, proofingId };
    }
    if (event && eventId) {
      await Events.updateAsync({ _id: proofingId }, { $push: { vendorEventIds: eventId } });
    }

    const verifiedResult = a.parseResult(payload, proofingId);
    return { verifiedResult, proofingId };
  }

  return { register, get, startProofing, handleCallback };
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `node --test extensions/identity-verification/server/IdentityProofingBroker.test.mjs`
Expected: PASS — `# pass 3  # fail 0`.

- [ ] **Step 5: Commit**

```bash
cd extensions/identity-verification && git add -A && git commit -m "feat: IdentityProofingBroker (registry + orchestration)" && cd /Volumes/MobileDev/Code/honeycomb
```

---

## Task B9: Wire real deps — the webhook endpoint + broker instance

**Files:**
- Create: `extensions/identity-verification/server/idvRuntime.js` (builds the wired broker + adapter from settings/collections)
- Create: `extensions/identity-verification/server/idvEndpoints.js` (WebApp webhook handler)
- Modify: `extensions/identity-verification/server.js` (import both)

**Interfaces:**
- Consumes: `makeBroker`, `makePersonaAdapter`, `createPatientBinding`, `recordAssurance`, `IdentityProofingEvents`, `Meteor.users`, `Patients`, `AuditEvents`, `meteor/fetch`, `Meteor.settings`, `Random`.
- Produces: `getBroker()` (wired singleton); `finalizeProofing(verifiedResult, proofingId)` (binding + store); `POST /idv/webhook/persona` mounted via `WebApp.connectHandlers` with **raw body** capture.

- [ ] **Step 1: Build the runtime wiring**

```js
// extensions/identity-verification/server/idvRuntime.js
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { fetch } from 'meteor/fetch';
import { get } from 'lodash';
import { makeBroker } from './IdentityProofingBroker.js';
import { makePersonaAdapter } from './adapters/PersonaAdapter.js';
import { createPatientBinding } from './bindingStrategies/CreatePatientBinding.js';
import { recordAssurance } from './AssuranceStore.js';
import { IdentityProofingEvents } from '../collections/IdentityProofingEvents.js';

// Resolve monorepo collections from the global registry (they live in core).
function coreCollection(name) {
  return (global.Collections && global.Collections[name]) ||
         (Meteor.Collections && Meteor.Collections[name]);
}

let broker;
export function getBroker() {
  if (broker) return broker;
  const cfg = get(Meteor, 'settings.private.identityProofing.persona', {});
  const adapter = makePersonaAdapter({
    apiKey: cfg.apiKey, webhookSecret: cfg.webhookSecret,
    inquiryTemplateId: cfg.inquiryTemplateId, environment: cfg.environment || 'sandbox',
    fetchImpl: fetch
  });
  broker = makeBroker({ Events: IdentityProofingEvents, uuid: () => Random.id(), now: () => new Date() });
  broker.register('persona', adapter);
  return broker;
}

export async function finalizeProofing(verifiedResult, proofingId) {
  const Patients = coreCollection('Patients');
  const AuditEvents = coreCollection('AuditEvents') || coreCollection('AuditEvent');
  const bind = await createPatientBinding(verifiedResult.userId || (await eventUser(proofingId)), verifiedResult, {
    Patients, Users: Meteor.users, uuid: () => Random.id()
  });
  await recordAssurance(await eventUser(proofingId), verifiedResult, bind, {
    Users: Meteor.users, AuditEvents, now: () => new Date()
  });
  await IdentityProofingEvents.updateAsync({ _id: proofingId },
    { $set: { status: verifiedResult.assuranceLevel === 'ial2' ? 'completed' : 'failed', completedAt: new Date(),
      resultSummary: { ial: verifiedResult.assuranceLevel, patientId: bind.patientId, created: bind.created } } });
  return bind;
}

async function eventUser(proofingId) {
  const ev = await IdentityProofingEvents.findOneAsync({ _id: proofingId });
  return ev && ev.userId;
}
```

- [ ] **Step 2: The webhook handler (raw body)**

```js
// extensions/identity-verification/server/idvEndpoints.js
import { WebApp } from 'meteor/webapp';
import { getBroker, finalizeProofing } from './idvRuntime.js';

function readRawBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (c) => { data += c; });
    req.on('end', () => resolve(data));
  });
}

WebApp.connectHandlers.use('/idv/webhook/persona', async function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') { res.statusCode = 405; res.end('{}'); return; }
  try {
    const rawBody = await readRawBody(req);
    const broker = getBroker();
    const out = await broker.handleCallback('persona', rawBody, req.headers);
    if (out.duplicate) { res.statusCode = 200; res.end(JSON.stringify({ ok: true, duplicate: true })); return; }
    await finalizeProofing(out.verifiedResult, out.proofingId);
    res.statusCode = 200; res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    if (String(err.message).includes('invalid_signature')) { res.statusCode = 401; res.end(JSON.stringify({ error: 'invalid_signature' })); return; }
    console.error('[identity-verification] webhook error:', err.message);
    res.statusCode = 500; res.end(JSON.stringify({ error: 'server_error' }));
  }
});
console.log('[identity-verification] mounted /idv/webhook/persona');
```

- [ ] **Step 3: Import from server.js**

Add to `extensions/identity-verification/server.js`:
```js
import './server/idvEndpoints.js';
```

- [ ] **Step 4: Integration-verify the signature gate**

Restart with `EXTRA_WORKFLOWS`. Send an unsigned POST:
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/idv/webhook/persona \
  -H "Content-Type: application/json" -d '{"data":{}}'
# Expected: 401
```
(A fully signed happy-path webhook is exercised in Task B12 E2E with a computed HMAC.)

- [ ] **Step 5: Commit**

```bash
cd extensions/identity-verification && git add -A && git commit -m "feat: wired broker runtime + Persona webhook endpoint" && cd /Volumes/MobileDev/Code/honeycomb
```

---

## Task B10: Server methods — `idv.start`, `idv.status`, `idv.checkEnabled`

**Files:**
- Create: `extensions/identity-verification/server/methods.js`
- Modify: `extensions/identity-verification/server.js` (import it)

**Interfaces:**
- `idv.checkEnabled()` → `{ enabled }` (reads `settings.private.identityProofing.persona.apiKey` presence + `settings.public.identityProofing.enabled`).
- `idv.start()` → `{ redirectUrl, proofingId }` (guards `this.userId`; feature-gated).
- `idv.status(proofingId)` → `{ status, patientId }` from `IdentityProofingEvents`.

- [ ] **Step 1: Implement (3-layer settings gate)**

```js
// extensions/identity-verification/server/methods.js
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import { getBroker } from './idvRuntime.js';
import { IdentityProofingEvents } from '../collections/IdentityProofingEvents.js';

function proofingEnabled() {
  const hasKey = !!get(Meteor, 'settings.private.identityProofing.persona.apiKey', '');
  const publicOn = get(Meteor, 'settings.public.identityProofing.enabled', false);
  return hasKey && publicOn;
}

Meteor.methods({
  'idv.checkEnabled': async function () {
    return { enabled: proofingEnabled() };
  },

  'idv.start': async function () {
    if (!this.userId) throw new Meteor.Error('not-authorized');
    if (!proofingEnabled()) {
      throw new Meteor.Error('feature-disabled',
        'Identity proofing is disabled. Set Meteor.settings.private.identityProofing.persona.apiKey and settings.public.identityProofing.enabled.');
    }
    const broker = getBroker();
    return await broker.startProofing(this.userId, { adapter: 'persona' });
  },

  'idv.status': async function (proofingId) {
    check(proofingId, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const ev = await IdentityProofingEvents.findOneAsync({ _id: proofingId });
    if (!ev || ev.userId !== this.userId) throw new Meteor.Error('not-found');
    return { status: ev.status, patientId: get(ev, 'resultSummary.patientId', null) };
  }
});
```

- [ ] **Step 2: Import from server.js**

```js
import './server/methods.js';
```

- [ ] **Step 3: Integration-verify the gate**

With `apiKey` empty in settings, in the browser console (logged in):
```js
Meteor.call('idv.start', (e, r) => console.log(e && e.error, r));
// Expected: 'feature-disabled'
Meteor.call('idv.checkEnabled', (e, r) => console.log(r));
// Expected: { enabled: false }
```

- [ ] **Step 4: Commit**

```bash
cd extensions/identity-verification && git add -A && git commit -m "feat: idv.start/status/checkEnabled methods (settings-gated)" && cd /Volumes/MobileDev/Code/honeycomb
```

---

## Task B11: Client — step-up hook, pages, badge, routes

**Files:**
- Create: `extensions/identity-verification/client/useIdentityAssurance.js`
- Create: `extensions/identity-verification/client/IdvCallbackPage.jsx`
- Create: `extensions/identity-verification/client/VerifiedBadge.jsx`
- Modify: `extensions/identity-verification/client/VerifyIdentityPage.jsx` (real behavior)
- Modify: `extensions/identity-verification/client.js` (register IdvCallbackPage route)

**Interfaces:**
- `useIdentityAssurance()` → `{ ial, status, isVerified }` from `Meteor.user().identityAssurance` (reactive).
- `VerifyIdentityPage` calls `idv.checkEnabled` then `idv.start`, redirects to `redirectUrl`, stashing `proofingId` in `sessionStorage`.
- `IdvCallbackPage` polls `idv.status(proofingId)` until `completed`/`failed`, then navigates home with a `VerifiedBadge`.

- [ ] **Step 1: The hook**

```js
// extensions/identity-verification/client/useIdentityAssurance.js
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

export function useIdentityAssurance() {
  return useTracker(function () {
    const ia = get(Meteor.user(), 'identityAssurance', null);
    return {
      ial: get(ia, 'ial', null),
      status: get(ia, 'status', 'unverified'),
      isVerified: get(ia, 'status', 'unverified') === 'verified'
    };
  }, []);
}
```

- [ ] **Step 2: VerifiedBadge**

```jsx
// extensions/identity-verification/client/VerifiedBadge.jsx
import React from 'react';
import { Chip } from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
export default function VerifiedBadge({ level }) {
  return (
    <Chip icon={<VerifiedUserIcon />} color="success" variant="outlined"
      label={'Identity verified' + (level ? ' (' + level.toUpperCase() + ')' : '')}
      sx={{ color: 'text.primary' }} />
  );
}
```

- [ ] **Step 3: VerifyIdentityPage (real behavior)**

```jsx
// extensions/identity-verification/client/VerifyIdentityPage.jsx
import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Container, Typography, Button, Alert, CircularProgress, Box } from '@mui/material';

export default function VerifyIdentityPage() {
  const [enabled, setEnabled] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(function () {
    Meteor.call('idv.checkEnabled', function (e, r) { setEnabled(e ? false : !!(r && r.enabled)); });
  }, []);

  function start() {
    setBusy(true); setError(null);
    Meteor.call('idv.start', function (e, r) {
      if (e) { setBusy(false); setError(e.reason || e.error); return; }
      sessionStorage.setItem('idvProofingId', r.proofingId);
      window.location.assign(r.redirectUrl); // external vendor URL — full navigation is correct here
    });
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ color: 'text.primary' }}>Verify your identity</Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
        To access your health records, we need to confirm your identity with our verification partner.
      </Typography>
      {enabled === false && (
        <Alert severity="error" sx={{ mb: 2 }}>Identity verification is not currently available. Contact your administrator.</Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{String(error)}</Alert>}
      <Box>
        <Button id="idv-start-btn" variant="contained" disabled={enabled === false || busy} onClick={start}
          startIcon={busy ? <CircularProgress size={18} /> : null}>
          {busy ? 'Starting…' : 'Verify my identity'}
        </Button>
      </Box>
    </Container>
  );
}
```

- [ ] **Step 4: IdvCallbackPage (poll)**

```jsx
// extensions/identity-verification/client/IdvCallbackPage.jsx
import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, CircularProgress, Box, Alert } from '@mui/material';
import VerifiedBadge from './VerifiedBadge.jsx';

export default function IdvCallbackPage() {
  const navigate = useNavigate();
  const [state, setState] = useState('polling');

  useEffect(function () {
    const proofingId = sessionStorage.getItem('idvProofingId');
    if (!proofingId) { setState('error'); return; }
    let tries = 0;
    const timer = setInterval(function () {
      tries += 1;
      Meteor.call('idv.status', proofingId, function (e, r) {
        if (e) return;
        if (r.status === 'completed') { clearInterval(timer); setState('done'); setTimeout(() => navigate('/'), 1500); }
        else if (r.status === 'failed') { clearInterval(timer); setState('failed'); }
        else if (tries > 40) { clearInterval(timer); setState('timeout'); } // ~2 min at 3s
      });
    }, 3000);
    return function () { clearInterval(timer); };
  }, [navigate]);

  return (
    <Container maxWidth="sm" sx={{ py: 6, textAlign: 'center' }}>
      {state === 'polling' && (<Box><CircularProgress /><Typography sx={{ mt: 2, color: 'text.secondary' }}>Confirming your verification…</Typography></Box>)}
      {state === 'done' && (<Box><VerifiedBadge level="ial2" /><Typography sx={{ mt: 2, color: 'text.primary' }}>You're verified. Redirecting…</Typography></Box>)}
      {state === 'failed' && <Alert severity="error">Verification did not pass. You can try again.</Alert>}
      {state === 'timeout' && <Alert severity="warning">Still processing. Check back shortly.</Alert>}
      {state === 'error' && <Alert severity="error">No verification in progress.</Alert>}
    </Container>
  );
}
```

- [ ] **Step 5: Register the callback route in client.js**

Update `extensions/identity-verification/client.js` to import `IdvCallbackPage` and add both routes:

```js
import React from 'react';
import VerifyIdentityPage from './client/VerifyIdentityPage.jsx';
import IdvCallbackPage from './client/IdvCallbackPage.jsx';

const DynamicRoutes = [
  { name: 'VerifyIdentity', path: '/verify-identity', element: <VerifyIdentityPage />, requireAuth: true },
  { name: 'IdvCallback', path: '/idv/callback', element: <IdvCallbackPage />, requireAuth: true }
];

export { DynamicRoutes };
export default { name: 'identity-verification', routes: DynamicRoutes, sidebarItems: [] };
```

- [ ] **Step 6: Verify render + commit**

Restart with `EXTRA_WORKFLOWS`; visit `/verify-identity` (button shows, disabled if not configured) and `/idv/callback` (shows "No verification in progress" with no stashed id).

```bash
cd extensions/identity-verification && git add -A && git commit -m "feat: step-up client (hook, verify page, callback poll, badge)" && cd /Volumes/MobileDev/Code/honeycomb
```

---

## Task B12: Settings + end-to-end happy path (Nightwatch, mocked Persona)

**Files:**
- Modify: a dev settings file (e.g. `settings/settings.honeycomb.localhost.json`) — add the gated keys.
- Create: `tests/nightwatch/honeycomb/identity-verification/stepUp.test.js`
- Create: `extensions/identity-verification/server/test-support/mockPersonaWebhook.js` (test-only signed-webhook sender, gated behind a settings flag)

**Interfaces:**
- E2E: signup/login → `/verify-identity` → (test harness posts a correctly-signed Persona webhook to `/idv/webhook/persona`) → `idv.status` flips to `completed` → user gets `patientId` + `identityAssurance.status==='verified'`.

- [ ] **Step 1: Add settings**

Into the chosen settings file:
```jsonc
"private": {
  "identityProofing": {
    "persona": { "apiKey": "test_key", "webhookSecret": "whsec_test", "inquiryTemplateId": "itmpl_test", "environment": "sandbox" }
  }
},
"public": {
  "identityProofing": { "enabled": true, "gate": { "defaultLevel": "ial2", "strictMode": false } }
}
```

- [ ] **Step 2: Test-only signed-webhook sender**

```js
// extensions/identity-verification/server/test-support/mockPersonaWebhook.js
import { Meteor } from 'meteor/meteor';
import { fetch } from 'meteor/fetch';
import crypto from 'node:crypto';
import { get } from 'lodash';

// Guarded: only registers when TEST_RUN and the feature is enabled.
if (process.env.TEST_RUN) {
  Meteor.methods({
    'idv.test.sendWebhook': async function (proofingId, level) {
      const secret = get(Meteor, 'settings.private.identityProofing.persona.webhookSecret', '');
      const verifications = level === 'ial2'
        ? [{ type: 'government-id', status: 'passed' }, { type: 'selfie', status: 'passed' }]
        : [{ type: 'government-id', status: 'passed' }];
      const body = JSON.stringify({
        eventId: 'evt_' + proofingId, referenceId: proofingId, inquiryId: 'inq_' + proofingId,
        data: { attributes: { 'name-first': 'Test', 'name-last': 'Patient', birthdate: '1990-01-01',
          'address-city': 'Testville', 'address-subdivision': 'CA' } },
        verifications
      });
      const ts = String(Math.floor(Date.now() / 1000));
      const sig = 't=' + ts + ',v1=' + crypto.createHmac('sha256', secret).update(ts + '.' + body).digest('hex');
      const resp = await fetch(Meteor.absoluteUrl() + 'idv/webhook/persona', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Persona-Signature': sig }, body
      });
      return { status: resp.status };
    }
  });
}
```
Import it from `server.js` (the `TEST_RUN` guard keeps it inert in production).

- [ ] **Step 3: Write the E2E test**

```js
// tests/nightwatch/honeycomb/identity-verification/stepUp.test.js
const testUtils = require('../../testUtils');

describe('Identity Verification step-up', function () {
  it('01. verified webhook mints a Patient and elevates the user', function (browser) {
    testUtils.login(browser, 'alice@test.com', 'password', function () {});
    browser.pause(1000);

    // Start proofing, capture proofingId
    browser.executeAsync(function (done) {
      Meteor.call('idv.start', function (e, r) { done(r && r.proofingId); });
    }, [], function (res) { browser.globals.proofingId = res.value; });

    // Fire the signed mock webhook (server-side)
    browser.perform(function () {
      browser.executeAsync(function (proofingId, done) {
        Meteor.call('idv.test.sendWebhook', proofingId, 'ial2', function (e, r) { done(r); });
      }, [browser.globals.proofingId], function () {});
    });
    browser.pause(2000);

    // Assert the user is now verified and linked
    browser.executeAsync(function (done) {
      Meteor.call('idv.status', browser.globals && browser.globals.proofingId, function () {
        const ia = Meteor.user() && Meteor.user().identityAssurance;
        done({ status: ia && ia.status, patientId: Meteor.user() && Meteor.user().patientId });
      });
    }, [], function (res) {
      browser.assert.equal(res.value.status, 'verified');
      browser.assert.ok(res.value.patientId, 'user has a linked patientId');
    });
  });
});
```

- [ ] **Step 4: Run the E2E**

```bash
TEST_RUN=1 EXTRA_WORKFLOWS=@orbital/identity-verification ./scripts/run-nightwatch-local-circleci.sh
# Expected: the stepUp test passes — status 'verified', patientId present.
```

- [ ] **Step 5: Commit (both repos)**

```bash
cd extensions/identity-verification && git add -A && git commit -m "test: mock Persona webhook sender (TEST_RUN-gated)" && cd /Volumes/MobileDev/Code/honeycomb
git add settings/ tests/nightwatch/honeycomb/identity-verification/
git commit -m "test(e2e): identity-verification step-up happy path"
```

---

## Self-Review (completed)

**Spec coverage:** §4 core-seam split → A1–A4 + B7/B9 (the written field). §5 interfaces → B3 (result), B5 (adapter), B6 (binding), B8 (broker). §6 data model → B2 (events), B6 (Patient identifier), B7 (identityAssurance + AuditEvent). §7 vocabulary → A1. §8 step-up flow → B9 (webhook authoritative) + B10 (start/status) + B11 (client). §8.1 gate enforcement → B6 self-enforcing (no proofing → no patientId); server-side `acr≥ial2` deferred to Phase 3 (noted, not built). §9 error handling → B5 (HMAC), B8 (replay), B6 (dedupe), B10 (gate). §10 settings → B10 + B12. §11 testing → node --test throughout + B12 Nightwatch. §13 YAGNI → no ID.me/CLEAR, no A/B strategies, no VerificationResult, no introspect/revoke.

**Placeholder scan:** none — every code step is complete. Two "confirm against upstream" notes (Persona signature scheme in B5; `AuditEvents`/token field names in A3/B7/B9) are verification instructions against real code/vendor docs, not deferred implementation.

**Type consistency:** `identityAssurance` shape ({ial,aal,provider,method,verifiedAt,evidenceRef,personIdentifier,status}) is written in B7 and read in A1/A3. `VerifiedIdentityResult` fields are produced in B5 and consumed in B6/B7/B8. `buildAssuranceClaims` signature matches between A1, A2, A3. Broker `{proofingId, redirectUrl}` / `{verifiedResult, proofingId, duplicate}` consistent B8↔B9↔B10.
