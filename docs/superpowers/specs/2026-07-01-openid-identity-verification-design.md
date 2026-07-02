# OpenID Identity Verification — "Final Mile" (Design)

**Date:** 2026-07-01 · **Author:** Claude Fable 5 (with Abigail Watson)
**Status:** Approved design → ready for implementation plan
**Feature:** Step-up IAL2 identity proofing for honeycomb (Chronicle), surfaced
through the OpenID Connect layer, with a vendor-neutral broker whose first
adapter is Persona and whose first binding strategy mints a `Patient` from
verified attributes.

---

## 1. Goal

One sentence: **when a patient reaches for their own record, honeycomb bounces
them through a real IAL2 identity-proofing event (Persona), records the result,
mints their `Patient` from the verified attributes, and stamps the assurance
into the OpenID tokens it issues.**

This is the "final mile" of an OAuth/SMART stack that is otherwise built: the
identity-**assurance** half — `userinfo`, `acr`/`amr`, and the proofing event
that makes those claims mean something.

## 2. Context — current state (verified 2026-07-01)

honeycomb already has a SMART-2.x / UDAP OAuth2 authorization server and a
*basic* OIDC layer. What exists and what's missing:

**Exists (do not rebuild):**
- OAuth2 authorize/token/registration, PKCE, refresh, client-credentials —
  `server/OAuthEndpoints.js`.
- `id_token` minting (RS256, `fhirUser` claim) at `OAuthEndpoints.js:~1291-1327`.
- `.well-known/openid-configuration`, `.well-known/jwks.json`,
  `.well-known/smart-configuration` — `server/Metadata.js`.
- External **login** IdPs (Google/GitHub/Microsoft/Okta via Meteor
  `Accounts.onExternalLogin`; SAML stub) — `imports/accounts/server/oauth-integration.js`.
- User↔Patient link: bare string field `Meteor.users.patientId` (set manually /
  by admin; read in `server/lib/FhirAuth.js:214-215`).
- The FAST/US-Identity-Matching IG guidance is already vendored as documentation
  in `npmPackages/patient-matching/` — it pins the exact target encoding
  (`acr:…/ial2`, `amr:…/aal2`, HL7 Person Identifier on `Patient.identifier`).

**Missing (this feature):**
- No `userinfo` endpoint; no `acr`/`amr` claims anywhere — every identity is
  implicitly IAL1/AAL1.
- No identity-proofing integration of any kind (no ID.me/CLEAR/Persona/Login.gov).
- No verified, auditable "this human *is* this Patient" event.

**Adjacent gaps that are OUT OF SCOPE here** (belong to the security-remediation
plan): `/authorizations/introspect|revoke|manage` advertised-but-unimplemented,
and the client-credentials JWT-signature `TODO` at `OAuthEndpoints.js:946`.

## 3. Decisions (settled during brainstorming)

| Axis | Decision |
|------|----------|
| honeycomb's role | OpenID **Provider** that brokers out to an external IDV vendor (relying-party leg) and re-asserts the result in its own OIDC layer. |
| Subject (beachhead) | **Patients / consumers** first. Providers/workforce later, same machinery. |
| Trigger model | **Step-up ("progressive assurance").** Login unchanged (IAL1); reaching one's own `Patient` triggers proofing → session/token elevated. Strict-mode flag can move the gate to onboarding. |
| Assurance target | Aim vendor at **IAL2**; record the level actually achieved; gate at a **configurable threshold** (default = FAST IG consumer-PHI minimum, effectively IAL2). |
| Binding strategy (beachhead) | **C — mint a `Patient` from verified attributes** (direct-to-consumer). `A` (confirm a provisioned link — enterprise/MPI) and `B` ($match against a population — HIE) are later pluggable strategies consuming the same result. |
| First vendor adapter | **Persona** (hosted-inquiry + signed webhook archetype; self-serve, no partner contract). Stripe Identity is a drop-in second webhook adapter (not built). |
| Second archetype (next spec) | **Approach 1** — OIDC-federation / Tiered-OAuth adapters (ID.me / CLEAR Verified / Login.gov). Reuses the same broker + core seam. |
| Home | **`extensions/identity-verification/`**, package `@orbital/identity-verification` (private nested repo; registered via `EXTRA_WORKFLOWS`). |
| Proofing record (v1) | A FHIR **`AuditEvent`** (hook point for the record-lifecycle / audit-trail plan). `VerificationResult` deferred. |

## 4. Architecture — thin core seam + fat package

Two things are **OIDC-conformance edits to the core OAuth server** and cannot be
packaged — but they are **vendor-neutral** ("read an assurance field, emit a
claim"), so they stay small and generic in core. Everything vendor- and
product-specific lives in the extension.

```
┌────────────────────────── honeycomb monorepo (core) ──────────────────────────┐
│ server/OAuthEndpoints.js   id_token mint reads user.identityAssurance →        │
│                            adds acr / amr / (hl7_person_identifier if scoped)  │
│ server/UserInfoEndpoint.js NEW /oauth/userinfo → std OIDC claims + acr/amr     │
│ server/Metadata.js         advertise userinfo_endpoint, acr_values_supported,  │
│                            claims_supported (acr, hl7_person_identifier)       │
│ imports/lib/AssuranceVocabulary.js  NEW level→acr/amr URI map (settings-driven)│
│                            "ial2" → http://idmanagement.gov/ns/assurance/ial/2 │
└───────────────▲───────────────────────────────────────────────────────────────┘
                │ core READS  Meteor.users.identityAssurance
                │ package WRITES it (the only coupling)
┌───────────────┴────────── extensions/identity-verification (@orbital) ─────────┐
│ server/IdentityProofingBroker.js  adapter registry + neutral contract          │
│ server/adapters/BaseAdapter.js    interface                                     │
│ server/adapters/PersonaAdapter.js createInquiry / verifyWebhook / parseResult  │
│ server/bindingStrategies/BindingStrategy.js  interface                          │
│ server/bindingStrategies/CreatePatientBinding.js  (strategy C)                  │
│ server/AssuranceStore.js          writes user.identityAssurance + AuditEvent    │
│ server/idvEndpoints.js            WebApp handlers: /idv/webhook/persona, /idv/start│
│ server/methods.js                 idv.start, idv.status (Meteor methods)        │
│ collections/IdentityProofingEvents.js  attempt state + webhook idempotency      │
│ lib/VerifiedIdentityResult.js     shape + validator                             │
│ client/VerifyIdentityPage.jsx     step-up interstitial (route /verify-identity) │
│ client/IdvCallbackPage.jsx        return page (route /idv/callback)             │
│ client/StepUpDialog.jsx  VerifiedBadge.jsx  useIdentityAssurance.js             │
│ client.js  server.js  workflow.json  package.json                              │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Why this seam:** it is the same "core exposes a hook, package fills it" pattern
as `ProfileSet`/`ProfileDecorators` (`.claude/rules/fhir/package-registry.md`).
Core stays vendor-agnostic and shippable without the extension present; the
extension is the only thing that knows the word "Persona."

## 5. Interfaces

### 5.1 `VerifiedIdentityResult` (the neutral currency)

```js
// extensions/identity-verification/lib/VerifiedIdentityResult.js
{
  proofingId:     String,   // our IdentityProofingEvents._id
  status:         String,   // 'completed' | 'failed' | 'pending' | 'expired'
  assuranceLevel: String,   // 'ial2' | 'ial1' | ...  (our normalized level)
  method:         String,   // e.g. 'persona:document+selfie'
  amr:            [String], // auth methods, e.g. ['pwd','http://udap.org/code/auth/aal2']
  attributes: {             // verified attributes (only what the check returned)
    givenName, familyName, birthDate, address:{line,city,state,postalCode,country},
    phone, email
  },
  evidence:  [ { type, issuer, classification } ],  // e.g. drivers_license / passport
  vendorRef:  String        // Persona inquiry id (for support/audit; not PII)
}
```

### 5.2 Adapter contract

```js
// BaseAdapter (interface every vendor adapter implements)
createInquiry(user, opts)      -> { redirectUrl, vendorRef, proofingId }
verifyWebhook(rawBody, headers) -> Boolean         // HMAC signature check
parseResult(webhookPayload)     -> VerifiedIdentityResult
```

`PersonaAdapter` uses `meteor/fetch` (NOT a Node SDK — avoids the rspack/externals
`require` hazards noted in project memory) to call Persona's REST API with
`settings.private.identityProofing.persona.apiKey`; verifies the `Persona-Signature`
HMAC against `webhookSecret` over the **raw** request body.

### 5.3 Binding-strategy contract

```js
// BindingStrategy (interface)
bind(userId, verifiedResult) -> { patientId, personIdentifier, created:Boolean }
```

`CreatePatientBinding` (C): mints a FHIR `Patient` from `verifiedResult.attributes`,
sets `Meteor.users.patientId`, stamps `Patient.identifier` with the HL7 Person
Identifier (v4 UUID), and **guards against duplicates** — if a `Patient` already
carries the same person identifier (repeat proofing), it re-links instead of
minting a second record.

### 5.4 Broker

```js
IdentityProofingBroker.register(name, adapter)
IdentityProofingBroker.startProofing(userId, {adapter}) -> { redirectUrl, proofingId }
IdentityProofingBroker.handleCallback(adapterName, rawBody, headers) -> VerifiedIdentityResult
```

## 6. Data model

**`Meteor.users.identityAssurance`** (written by `AssuranceStore`, read by core):
```js
{ ial:'ial2', aal:'aal2', provider:'persona', method:'persona:document+selfie',
  verifiedAt:Date, evidenceRef:'<proofingId>', personIdentifier:'<uuidv4>',
  status:'verified' }   // status: 'verified' | 'pending' | 'failed'
```

**`IdentityProofingEvents`** (new collection; durable attempt log + idempotency):
```js
{ _id:proofingId, userId, adapter:'persona', status, vendorInquiryId,
  vendorEventIds:[String],  // processed webhook event ids → replay guard
  createdAt, completedAt, resultSummary, error }
```

**FHIR `Patient.identifier`** gains:
```js
{ system:'http://hl7.org/fhir/us/identity-matching/ns/HL7PersonIdentifier',
  value:'<uuidv4>' }
```

**Proofing `AuditEvent`** (v1 record): type = identity verification, `agent` =
the user, `entity` = the `Patient`, `outcome` = success/failure. Emitted through
the record-lifecycle hook so the audit-trail plan can chain it later.

## 7. acr / amr vocabulary

Core `AssuranceVocabulary.js` maps our normalized level → the emitted URI, driven
by settings so adapters can assert their own later:

```
ial2 → http://idmanagement.gov/ns/assurance/ial/2   (default; UDAP alt: http://udap.org/code/id/ial2)
aal2 → http://idmanagement.gov/ns/assurance/aal/2   (UDAP alt: http://udap.org/code/auth/aal2)
```

The package sets `identityAssurance.ial = 'ial2'`; core maps and emits. Nothing
vendor-specific reaches core.

## 8. Step-up flow (authoritative = the webhook, never the browser)

```
1. Client: user opens their own Patient at IAL1.
   useIdentityAssurance() sees ial < required → route to /verify-identity.
2. VerifyIdentityPage → Meteor.call('idv.start')
     → broker.startProofing → PersonaAdapter.createInquiry
     → IdentityProofingEvents doc {status:'created'} → returns Persona hosted URL.
3. Browser redirects to Persona; user completes document + selfie.
4a. Persona → browser redirect back to /idv/callback  (UX only).
4b. Persona → POST /idv/webhook/persona  (SERVER, AUTHORITATIVE).
5. Webhook handler:
     verify HMAC over raw body  → reject if bad
     idempotency: event id already in vendorEventIds? → 200 no-op
     broker.handleCallback → PersonaAdapter.parseResult → VerifiedIdentityResult
     CreatePatientBinding.bind(userId, result)
     AssuranceStore.record(userId, result)  → writes user.identityAssurance
                                             → emits proofing AuditEvent
     respond 200 fast.
6. IdvCallbackPage polls Meteor.call('idv.status', proofingId) until
   status:'verified' → shows VerifiedBadge → resumes original destination.
7. Next id_token / userinfo carries acr=ial2, amr, hl7_person_identifier.
```

**Only step 5 flips assurance.** The `/idv/callback` browser return (step 4a/6)
is presentation only — a client-reported success never elevates anyone.

### 8.1 Gate enforcement (why client-side redirect is enough *for C*)

The client-side redirect in step 1 is **UX, not the security boundary**. For the
C beachhead the gate is largely **self-enforcing**: a DTC user has **no
`patientId` until the proofing event mints their `Patient`** (that *is* the
binding), so at IAL1 pre-proofing there is simply no PHI to reach — the FHIR
`$everything` / patient-compartment access in `FhirAuth.js` already returns
nothing without a linked patient. Proofing is therefore the act that *creates*
access, not merely a screen in front of it.

Server-side **assurance enforcement** in `FhirAuth.js` (require `acr≥ial2` before
serving a linked Patient's PHI) becomes **necessary only when A/B introduce a
pre-existing link** — a user who already has `patientId` set by an MPI/admin
could otherwise read PHI at IAL1. That enforcement check is therefore scoped to
**Phase 3** (with A/B), not v1. v1 records assurance and gates the UX; it does
not yet block a pre-linked read (there are none in the C model).

## 9. Error handling & security

- **Webhook auth:** HMAC verify over the **raw** body (capture raw bytes before
  JSON parse in the `WebApp.connectHandlers` mount). Unsigned/mismatched → 401,
  no state change.
- **Replay:** each Persona event id is recorded in `vendorEventIds`; a repeat is a
  200 no-op.
- **Proofing failure/decline:** `status:'failed'`, no elevation, actionable UI,
  retry allowed with backoff.
- **Vendor down:** broker returns a typed error; the gate stays closed; the
  settings-gated Alert pattern shows a graceful message (never fail *open*).
- **Duplicate `Patient`:** `CreatePatientBinding` dedupes on the HL7 Person
  Identifier so a re-proof re-links rather than forking a second record (a soft
  pre-empt of the B-strategy mismatch hazard).
- **PII discipline:** raw attributes/evidence are **never** logged; the proofing
  log stores references and summaries, not documents. Defers to the
  logging-redaction plan.
- **Feature gating:** 3-layer settings-gated pattern (`.claude/rules/meteor/
  settings-gated-features.md`) — server methods guard on `settings.private`, a
  check method surfaces enabled/disabled, the client shows the disabled Alert.

## 10. Settings

```jsonc
// private
"identityProofing": {
  "persona": {
    "apiKey": "",            // server-only
    "webhookSecret": "",     // HMAC verification
    "inquiryTemplateId": "",
    "environment": "sandbox" // 'sandbox' | 'production'
  }
}
// public
"identityProofing": {
  "enabled": true,
  "gate": { "defaultLevel": "ial2", "strictMode": false }
}
// public (core, optional override of AssuranceVocabulary defaults)
"assuranceVocabulary": { "ial2": "http://idmanagement.gov/ns/assurance/ial/2" }
```

`strictMode:true` moves the same gate to onboarding (the "Approach A-gating"
strict variant) with no new machinery — the gate just fires earlier.

## 11. Testing strategy

- **Unit:** `PersonaAdapter.verifyWebhook` (valid / tampered / replay),
  `parseResult` + evidence→IAL mapping, `CreatePatientBinding` (creates Patient,
  sets identifier, links user, dedupes on re-proof), core `acr`/`amr` claim
  injection into the id_token, `userinfo` response shape, `AssuranceVocabulary`
  mapping.
- **Integration:** full step-up happy path against a **mocked Persona** (inquiry
  create → signed webhook → binding → an issued token that carries `acr=ial2`);
  failure path (no elevation); strict-mode gate at onboarding.
- **E2E (Nightwatch):** DTC signup → reach own `Patient` at IAL1 → redirected to
  `/verify-identity` → (mocked vendor) → `VerifiedBadge` shows; reuse the
  settings-gated + patient-context test patterns.

## 12. File map

**Core (honeycomb monorepo, tracked):**
- Modify `server/OAuthEndpoints.js` — id_token mint adds `acr`/`amr`/
  `hl7_person_identifier`.
- Create `server/UserInfoEndpoint.js` — `/oauth/userinfo` (+ fhirPath-scoped
  variant to match smart-configuration).
- Modify `server/Metadata.js` — advertise `userinfo_endpoint`,
  `acr_values_supported`, `claims_supported`.
- Create `imports/lib/AssuranceVocabulary.js` — level→URI map.

**Extension (`extensions/identity-verification/`, private nested repo):**
- `package.json` (`@orbital/identity-verification`), `workflow.json`, `client.js`,
  `server.js`.
- `server/IdentityProofingBroker.js`, `server/adapters/BaseAdapter.js`,
  `server/adapters/PersonaAdapter.js`.
- `server/bindingStrategies/BindingStrategy.js`,
  `server/bindingStrategies/CreatePatientBinding.js`.
- `server/AssuranceStore.js`, `server/idvEndpoints.js`, `server/methods.js`.
- `collections/IdentityProofingEvents.js`, `lib/VerifiedIdentityResult.js`,
  `lib/evidenceMapping.js`.
- `client/VerifyIdentityPage.jsx`, `client/IdvCallbackPage.jsx`,
  `client/StepUpDialog.jsx`, `client/VerifiedBadge.jsx`,
  `client/useIdentityAssurance.js`.
- `workflow.json` routes: `/verify-identity`, `/idv/callback` (interstitials —
  **not** `defaults.route`; per the navbar/defaults gotcha, IDV must not be the
  app landing page).

## 13. Scope boundary (YAGNI)

**In v1:** Persona adapter + `CreatePatientBinding` (C) + step-up + the core OIDC
assurance seam (`userinfo`, `acr`/`amr`, discovery) + proofing `AuditEvent`.

**Explicitly NOT v1:**
- ID.me / CLEAR / Login.gov OIDC-federation adapters → **Approach 1, next spec**
  (additional adapters on the same broker + core seam).
- `A` (confirm) / `B` ($match) binding strategies → enterprise / HIE phases.
- Provider / workforce subject.
- `VerificationResult` FHIR resource (AuditEvent suffices for v1).
- introspect/revoke/manage endpoints and the client-credentials JWT TODO →
  security-remediation plan, not here.

## 14. Phasing

1. **Phase 1 (this spec):** Persona + C + core seam + step-up. Registered via
   `EXTRA_WORKFLOWS=@orbital/identity-verification`; a full Meteor restart is
   required for the new routes to appear (parser runs once at rspack boot — per
   project memory).
2. **Phase 2 (next spec):** Approach 1 OIDC-federation adapters, reusing the
   broker + core seam; generalizes to UDAP Tiered-OAuth and the provider subject.
3. **Phase 3:** `A`/`B` binding strategies as the enterprise (MPI) and HIE
   go-to-market land.
