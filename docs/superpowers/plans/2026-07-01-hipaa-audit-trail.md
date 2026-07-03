# HIPAA Audit Trail Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** One audit write path — producers → record-lifecycle EventBus → HipaaSubscriber → HipaaLogger → FHIR `AuditEvents` — with REST-read coverage, a SHA-256 tamper chain (merkalis-ready), and (d)(3) reports.

**Architecture:** `record-lifecycle`'s existing EventBus (`emitLifecycleEvent`/`subscribe`) is the spine. `HipaaLogger` (hipaa-compliance package) becomes the only writer to `AuditEvents`, emitting conformant FHIR R4 AuditEvents with a hash-chain extension maintained by a chain subscriber. FhirEndpoints/BulkData emit read/export events non-blockingly. Three stray producers converge; `HipaaAuditLog` retires.

**Tech Stack:** Meteor v3, existing packages `@node-on-fhir/record-lifecycle` + `@node-on-fhir/hipaa-compliance`, node `crypto` (SHA-256), `node --test` + `meteortesting:mocha`.

**Specs:** `docs/superpowers/specs/2026-07-01-hipaa-audit-trail-design.md` (this plan) and `2026-07-01-structured-logging-design.md`. **Execute the structured-logging plan FIRST** — this plan uses `Meteor.Logger` for its own operational logging and assumes `log.phi()`'s phiSink exists.

## Global Constraints

- Audit writes must NEVER fail or block a clinical read — every audit call site is wrapped so errors go to `Meteor.Logger.for(...).error(...)` and the request proceeds.
- `AuditEvents` documents are append-only: no update/remove methods, ever (chain integrity).
- Absent settings keys keep current behavior; new keys default per spec (`audit.restReads` true only when hipaa-compliance is loaded, `audit.publications` false).
- Package lookups use the npm key `Package['@node-on-fhir/hipaa-compliance']` (the Atmosphere key `clinical:hipaa-compliance` is stale — fix on sight).
- Meteor v3 async; `function(){}` methods; lodash `get()`; `[Module]` logging via `Meteor.Logger`.
- Real event names come from `npmPackages/record-lifecycle/lib/RecordLifecycleEvents.js` (`RecordLifecycleEvent` enum, `LifecycleToHipaa` map) — do not invent event strings.
- Commit after every task; Claude Code co-author trailer.

---

### Task 1: Conformant AuditEvent builder + chain fields in HipaaLogger

**Files:**
- Create: `npmPackages/hipaa-compliance/lib/AuditEventBuilder.js` (plain CJS — `node --test`-able)
- Create: `npmPackages/hipaa-compliance/lib/AuditChain.js` (plain CJS)
- Modify: `npmPackages/hipaa-compliance/lib/HipaaLogger.js` (`buildAuditEvent` delegates to the builder; insert path adds chain fields via Task 2's sequencer)
- Test: `npmPackages/hipaa-compliance/tests/AuditEventBuilder.test.mjs`
- Modify: `package.json` (script `"test:audit": "node --test npmPackages/hipaa-compliance/tests/AuditEventBuilder.test.mjs",`)

**Interfaces:**
- `buildAuditEvent(eventData) → FHIR R4 AuditEvent` where `eventData = { eventType, userId?, userName?, resourceId?, resourceType?, patientReference?, message?, metadata?, sourceIp? }`. `eventType` ∈ values of `LifecycleToHipaa` (`access|create|update|delete|login|logout|export|match`...) → mapped to AuditEvent `type`/`subtype`/`action` codings.
- `AuditChain.canonicalize(auditEvent) → string` (stable-key-order JSON, chain extension excluded); `AuditChain.hashEntry(auditEvent, previousHash) → { entryHash, previousHash }`; `AuditChain.attachChainExtension(auditEvent, {previousHash, entryHash, sequence}) → auditEvent`; `AuditChain.verifySequence(events[]) → { valid, brokenAt: number|null }`. Extension url: `urn:honeycomb:audit-chain` (sub-extensions `previousHash`, `entryHash` valueString; `sequence` valuePositiveInt). Genesis `previousHash: 'genesis'`.

- [ ] **Step 1: Write the failing tests**

```js
// npmPackages/hipaa-compliance/tests/AuditEventBuilder.test.mjs  — npm run test:audit
import test from 'node:test';
import assert from 'node:assert/strict';
import BuilderModule from '../lib/AuditEventBuilder.js';
import ChainModule from '../lib/AuditChain.js';
const { buildAuditEvent } = BuilderModule;
const { canonicalize, hashEntry, attachChainExtension, verifySequence } = ChainModule;

const sample = { eventType: 'access', userId: 'u1', userName: 'alice', resourceId: 'p1', resourceType: 'Patient', patientReference: 'Patient/p1', message: 'read via REST' };

test('builds R4-shaped AuditEvent', function() {
  const evt = buildAuditEvent(sample);
  assert.equal(evt.resourceType, 'AuditEvent');
  assert.equal(evt.action, 'R');
  assert.ok(evt.recorded);
  assert.equal(evt.agent[0].who.identifier.value, 'u1');
  assert.equal(evt.entity[0].what.reference, 'Patient/p1');
  assert.equal(evt.type.system, 'http://dicom.nema.org/resources/ontology/DCM');
});

test('canonicalize is stable under key order and excludes chain extension', function() {
  const a = buildAuditEvent(sample);
  const b = JSON.parse(JSON.stringify(a));
  b.extension = [{ url: 'urn:honeycomb:audit-chain', extension: [] }];
  assert.equal(canonicalize(a), canonicalize(b));
});

test('hash chain links and verifies; tamper detected at exact sequence', function() {
  const e1 = attachChainExtension(buildAuditEvent(sample), Object.assign({ sequence: 1 }, hashEntry(buildAuditEvent(sample), 'genesis')));
  // NOTE: build each event ONCE and reuse (recorded timestamps differ otherwise)
  const evt2 = buildAuditEvent(Object.assign({}, sample, { message: 'second' }));
  const h1 = e1.extension[0].extension.find(x => x.url === 'entryHash').valueString;
  const e2 = attachChainExtension(evt2, Object.assign({ sequence: 2 }, hashEntry(evt2, h1)));
  assert.deepEqual(verifySequence([e1, e2]), { valid: true, brokenAt: null });
  e1.agent[0].who.identifier.value = 'tampered';
  assert.deepEqual(verifySequence([e1, e2]), { valid: false, brokenAt: 1 });
});
```
(Adjust the first test's fixture construction so `e1` is built once — the code above shows intent; make it `const evt1 = buildAuditEvent(sample); const e1 = attachChainExtension(evt1, {...hashEntry(evt1,'genesis'), sequence: 1});`.)

- [ ] **Step 2: Run** — `npm run test:audit` → FAIL (modules missing).

- [ ] **Step 3: Implement**

```js
// npmPackages/hipaa-compliance/lib/AuditEventBuilder.js
// Conformant FHIR R4 AuditEvent construction. Plain CJS, no Meteor imports.
const ACTION = { create: 'C', access: 'R', read: 'R', update: 'U', delete: 'D', export: 'R', login: 'E', logout: 'E', match: 'E' };
const SUBTYPE = { access: 'read', read: 'read', create: 'create', update: 'update', delete: 'delete', export: 'export', login: 'login', logout: 'logout', match: 'match' };

function buildAuditEvent(eventData) {
  const d = eventData || {};
  const evt = {
    resourceType: 'AuditEvent',
    type: { system: 'http://dicom.nema.org/resources/ontology/DCM', code: '110100', display: 'Application Activity' },
    subtype: [{ system: 'http://hl7.org/fhir/restful-interaction', code: SUBTYPE[d.eventType] || 'read' }],
    action: ACTION[d.eventType] || 'R',
    recorded: new Date().toISOString(),
    outcome: '0',
    agent: [{
      who: { identifier: { value: d.userId || 'system' }, display: d.userName || 'system' },
      requestor: true,
      network: d.sourceIp ? { address: d.sourceIp, type: '2' } : undefined
    }],
    source: { observer: { display: 'honeycomb' } },
    entity: []
  };
  if (d.patientReference) {
    evt.entity.push({ what: { reference: d.patientReference }, type: { system: 'http://terminology.hl7.org/CodeSystem/audit-entity-type', code: '1', display: 'Person' } });
  }
  if (d.resourceId && d.resourceType && ('' + d.resourceType + '/' + d.resourceId) !== d.patientReference) {
    evt.entity.push({ what: { reference: d.resourceType + '/' + d.resourceId }, type: { system: 'http://terminology.hl7.org/CodeSystem/audit-entity-type', code: '2', display: 'System Object' } });
  }
  if (d.message) { evt.entity.push({ description: d.message }); }
  if (d.metadata) { evt.entity.push({ description: JSON.stringify(d.metadata).slice(0, 4000) }); }
  return JSON.parse(JSON.stringify(evt));   // drop undefined fields
}

module.exports = { buildAuditEvent };
```

```js
// npmPackages/hipaa-compliance/lib/AuditChain.js
// SHA-256 hash chain over AuditEvents. Plain CJS. The chain writer is
// deliberately pluggable: merkalis can replace/augment it later as another
// record-lifecycle EventBus subscriber without touching producers.
const crypto = require('crypto');
const CHAIN_URL = 'urn:honeycomb:audit-chain';

function stableStringify(value) {
  if (value === null || typeof value !== 'object') { return JSON.stringify(value); }
  if (Array.isArray(value)) { return '[' + value.map(stableStringify).join(',') + ']'; }
  return '{' + Object.keys(value).sort().map(function(k) { return JSON.stringify(k) + ':' + stableStringify(value[k]); }).join(',') + '}';
}

function canonicalize(auditEvent) {
  const clone = JSON.parse(JSON.stringify(auditEvent));
  delete clone._id;
  if (Array.isArray(clone.extension)) {
    clone.extension = clone.extension.filter(function(ext) { return ext.url !== CHAIN_URL; });
    if (clone.extension.length === 0) { delete clone.extension; }
  }
  return stableStringify(clone);
}

function hashEntry(auditEvent, previousHash) {
  const entryHash = crypto.createHash('sha256').update(previousHash + '|' + canonicalize(auditEvent)).digest('hex');
  return { entryHash: entryHash, previousHash: previousHash };
}

function attachChainExtension(auditEvent, chain) {
  if (!Array.isArray(auditEvent.extension)) { auditEvent.extension = []; }
  auditEvent.extension.push({ url: CHAIN_URL, extension: [
    { url: 'previousHash', valueString: chain.previousHash },
    { url: 'entryHash', valueString: chain.entryHash },
    { url: 'sequence', valuePositiveInt: chain.sequence }
  ]});
  return auditEvent;
}

function getChain(auditEvent) {
  const ext = (auditEvent.extension || []).find(function(e) { return e.url === CHAIN_URL; });
  if (!ext) { return null; }
  const read = function(url) { const sub = ext.extension.find(function(s) { return s.url === url; }); return sub && (sub.valueString !== undefined ? sub.valueString : sub.valuePositiveInt); };
  return { previousHash: read('previousHash'), entryHash: read('entryHash'), sequence: read('sequence') };
}

function verifySequence(events) {
  let previousHash = 'genesis';
  for (let i = 0; i < events.length; i++) {
    const chain = getChain(events[i]);
    if (!chain) { return { valid: false, brokenAt: i + 1 }; }
    const expected = hashEntry(events[i], previousHash).entryHash;
    if (chain.previousHash !== previousHash || chain.entryHash !== expected) {
      return { valid: false, brokenAt: chain.sequence || i + 1 };
    }
    previousHash = chain.entryHash;
  }
  return { valid: true, brokenAt: null };
}

module.exports = { canonicalize, hashEntry, attachChainExtension, getChain, verifySequence, CHAIN_URL };
```

- [ ] **Step 4:** `npm run test:audit` → PASS. Also validate builder output against the staged schema: `node -e "const {buildAuditEvent}=require('./npmPackages/hipaa-compliance/lib/AuditEventBuilder.js'); const v=require('./imports/lib/FhirValidator.js'); console.log(v.validateResource(buildAuditEvent({eventType:'access',userId:'u1',patientReference:'Patient/p1'})))"` → `valid: true` (requires the JSON Schema migration plan's Task 2; if not yet landed, note and skip this check).
- [ ] **Step 5: Commit** — `git add npmPackages/hipaa-compliance/ package.json && git commit -m "feat(audit): conformant AuditEvent builder + SHA-256 chain primitives"`

---

### Task 2: Chain sequencer + single write path in HipaaLogger + verifyChain method

**Files:**
- Modify: `npmPackages/hipaa-compliance/lib/HipaaLogger.js` — `buildAuditEvent()` delegates to `AuditEventBuilder`; `logEvent()` (server branch) acquires `{sequence, previousHash}` then inserts with chain extension
- Create: `npmPackages/hipaa-compliance/server/auditChainState.js` (sequencer)
- Modify: `npmPackages/hipaa-compliance/server/methods.js` — add `hipaa.verifyChain`
- Test: `tests/mocha/auditChain.test.js`

**Interfaces:**
- `nextChainSlot() → Promise<{ sequence, previousHash }>` — atomic (single `findOneAndUpdate` on a `HipaaChainState` counters doc storing `{ _id: 'audit-chain', sequence, lastHash }`); updates `lastHash` after insert via `commitChainSlot(entryHash)`.
- `Meteor.callAsync('hipaa.verifyChain', {limit?}) → { valid, brokenAt, checked }` — admin-gated (reuse the package's existing role check pattern from `server/methods.js`).
- After this task, **HipaaLogger is the only AuditEvents writer**; direct `AuditEvents.insertAsync` elsewhere is converged in Task 4/5.

- [ ] **Step 1: Failing test** (`tests/mocha/auditChain.test.js`, server-only, mirroring Task 3 patterns from the logging plan): log three events via `HipaaLogger.logEvent`, fetch them ordered by sequence, assert `verifySequence` valid; tamper one field via `rawCollection().updateOne`, assert `hipaa.verifyChain` reports that sequence.
- [ ] **Step 2: Implement the sequencer** (concurrency-safe: `rawCollection().findOneAndUpdate({_id:'audit-chain'}, {$inc:{sequence:1}}, {upsert:true, returnDocument:'after'})`; `previousHash` from the state doc's `lastHash` or `'genesis'`; `commitChainSlot` writes `lastHash`). Wire into `logEvent()` server branch: build → slot → `hashEntry(evt, previousHash)` → `attachChainExtension` → `AuditEvents.insertAsync` → `commitChainSlot(entryHash)`. Wrap the whole thing so failures log to `Meteor.Logger.for('HipaaLogger').error` and return null (non-blocking guarantee).
- [ ] **Step 3: `hipaa.verifyChain`** — fetch AuditEvents that HAVE the chain extension sorted by sequence (`fetchAsync`), run `verifySequence`, return `{valid, brokenAt, checked: events.length}`.
- [ ] **Step 4:** `npm test` → PASS (register test import in `tests/main.js`). **Sequence-gap note:** if insert succeeds but `commitChainSlot` fails, the next event's `previousHash` is stale and verification flags it — acceptable (fail-loud beats fail-silent); document in code comment.
- [ ] **Step 5: Commit** — `"feat(audit): chained AuditEvent writes + hipaa.verifyChain"`

---

### Task 3: Consolidation — one HipaaLogger, one store

**Files:**
- Modify: `imports/lib/HipaaLogger.js` (core thin wrapper) → re-export the package implementation via lazy `Package['@node-on-fhir/hipaa-compliance']` lookup with a console-warn no-op fallback (keeps core code working when the package isn't loaded)
- Modify: `npmPackages/record-lifecycle/server/HipaaSubscriber.js:43` — replace the stale `Package['clinical:hipaa-compliance']` lookup with `Package['@node-on-fhir/hipaa-compliance']` (keep the global fallback)
- Modify: `npmPackages/hipaa-compliance/lib/Collections.js` — delete the `HipaaAuditLog` collection + its SimpleSchema (grep consumers first: `grep -rn "HipaaAuditLog" npmPackages/ imports/ server/` — update `AuditLogPage.jsx`/publications/methods that read it to query `AuditEvents` instead)
- Create: `scripts/migrate-hipaaauditlog-to-auditevents.js` (one-time: reads `HipaaAuditLog` rows, maps `{eventType, eventDate, userId, userName, message, ...}` through `buildAuditEvent` **preserving original timestamps** (`recorded: row.eventDate`), inserts WITHOUT chain extension — pre-chain history is explicitly unchained; chain verification starts at the first chained event)
- Modify: `npmPackages/hipaa-compliance/package.json` — remove `simpl-schema` from peerDependencies; update README's Atmosphere-era install section to npm-workflow instructions

- [ ] **Step 1:** Make the four modifications; run the migration script against a dev database (`node scripts/... ` won't have Meteor — write it as a `meteor node` shell script OR a server method `hipaa.migrateLegacyAuditLog` gated by `settings.private.hipaa.allowLegacyMigration`; prefer the method — it reuses the running app's collections).
- [ ] **Step 2:** Verify: `grep -rn "HipaaAuditLog\|clinical:hipaa-compliance" npmPackages/ imports/ server/ --include="*.js" --include="*.jsx"` → only the migration method + README history notes; `npm test` green; AuditLogPage renders from AuditEvents.
- [ ] **Step 3: Commit** — `"refactor(audit): single store (AuditEvents) + single HipaaLogger; retire HipaaAuditLog"`

---

### Task 4: REST read + export auditing (the (d)(2) gap)

**Files:**
- Create: `server/lib/AuditMiddleware.js`
- Modify: `server/FhirEndpoints.js` — at each response site that calls `RestHelpers.prepForFhirTransfer()` (anchors: `:505, :606, :630, :1410, :1590, :1818, :1953` — re-grep before editing: `grep -n "prepForFhirTransfer" server/FhirEndpoints.js`)
- Modify: `server/BulkData.js` — in both job processors (`processPatientEhiExportJob` `:614`, `processExportJob` `:741`), after job completion
- Test: `tests/mocha/auditMiddleware.test.js`

**Interfaces:**
- `auditRestRead({ req, resource }) → void` (single resource) and `auditRestSearch({ req, resourceType, bundle }) → void` (one event per Bundle, entities = unique patient references in results, capped at 50 entities) — both fire-and-forget (`.catch` → operational error log), both no-ops unless `get(Meteor, 'settings.private.hipaa.audit.restReads', <hipaa package loaded>)` is true.
- Emission goes through the EventBus: `EventBus.emitLifecycleEvent(buildEventPayload({...}))` using `RecordLifecycleEvent` codes (`ACCESS` for reads; the enum's transmit/export member for $export — read the exact names in `npmPackages/record-lifecycle/lib/RecordLifecycleEvents.js:13-47` and use them verbatim), so FHIRcast and future merkalis subscribers see the same stream. User identity from the request's parsed authorization (FhirEndpoints' `parseUserAuthorization` result is in scope at the call sites — pass its userId/display through).

- [ ] **Step 1: Failing test** — with `audit.restReads: true`, calling `auditRestRead` with a fake req + Patient resource yields (after a short poll) one AuditEvent whose entity references `Patient/<id>`; with the flag false, none.
- [ ] **Step 2: Implement + wire.** In `AuditMiddleware.js`, import EventBus + payload builder from `@node-on-fhir/record-lifecycle` package exports (`./server/hooks` and lib paths are exported — check its package.json `exports` map and import accordingly). Wire the two helpers into FhirEndpoints response sites (read → `auditRestRead`, search/Bundle → `auditRestSearch`) and BulkData completion (`export` event with `{resourceTypes, counts, jobId}` metadata).
- [ ] **Step 3:** `npm test` green. Manual: `curl` a Patient read → AuditEvent appears (mongosh `db.AuditEvents.find().sort({recorded:-1}).limit(1)`); response latency unchanged (audit is post-response).
- [ ] **Step 4: Commit** — `"feat(audit): REST read/search + bulk export auditing via EventBus"`

---

### Task 5: Producer convergence

**Files:**
- Modify: `npmPackages/patient-matching/server/security/auditLogging.js` — its `AuditLogs`-collection writes become `EventBus.emitLifecycleEvent` emissions (event type: the enum's closest match to `match`/`ACCESS`; match metadata — scores, AAL2 context, response times — rides `metadata`). Keep its exported function signatures so its callers don't change. `AuditLogs` collection: stop writing; leave reads for a deprecation window with a `console.warn` deprecation notice.
- Modify: `npmPackages/order-catalog/server/methods.js` and `npmPackages/implantable-devices/server/methods.js` — replace direct `{resourceType:'AuditEvent'}` inserts with EventBus emissions carrying equivalent fields.

- [ ] **Step 1:** Convert each producer (grep first: `grep -n "AuditEvent\|AuditLogs" <file>` to find every write site).
- [ ] **Step 2:** Parity test (mocha): trigger one operation per package (or call the emitting function directly); assert an AuditEvent lands with the expected entity/agent fields.
- [ ] **Step 3:** `npm test` green. Commit — `"refactor(audit): converge patient-matching/order-catalog/implantable-devices on EventBus"`

---

### Task 6: (d)(3) reports on AuditLogPage

**Files:**
- Modify: `npmPackages/hipaa-compliance/client/AuditLogPage.jsx`, `npmPackages/hipaa-compliance/server/methods.js`, `npmPackages/hipaa-compliance/server/startup.js` (indexes)

**Interfaces:**
- Methods (admin-gated like existing package methods): `hipaa.auditReport.byPatient({patientReference, start, end}) → AuditEvent[]`, `hipaa.auditReport.byUser({userId, start, end}) → AuditEvent[]`, `hipaa.auditReport.export({...same, format: 'csv'|'bundle'}) → string|Bundle` (Bundle: `{resourceType:'Bundle', type:'searchset', entry: [...]}`).
- Indexes at startup: `{ recorded: -1 }`, `{ 'agent.who.identifier.value': 1, recorded: -1 }`, `{ 'entity.what.reference': 1, recorded: -1 }` via `createIndexAsync`.

- [ ] **Step 1:** Implement methods + indexes (queries: `entity.what.reference` for by-patient; `agent.who.identifier.value` for by-user; `recorded` range both). CSV columns: `recorded,eventType(subtype code),action,userId,userName,entities(;-joined refs),description`.
- [ ] **Step 2:** AuditLogPage additions: filter bar (patient reference, user, date range — MUI, theme tokens per `.claude/rules/ui/theming.md`), export buttons (CSV download, Bundle JSON download), and a chain-status chip in the header calling `hipaa.verifyChain` on mount (tri-state loading per the settings-gated-features rule: null=checking, valid=green `Chain verified (N entries)`, invalid=red `TAMPER at #<seq>`; footer buttons follow `.claude/rules/ui/footer-buttons.md` if any are added).
- [ ] **Step 3:** mocha tests for both report methods (seed 3 events across 2 patients/2 users; assert filter correctness). `npm test` green.
- [ ] **Step 4: Commit** — `"feat(audit): (d)(3) audit reports + chain status on AuditLogPage"`

---

### Task 7: Exit criteria + certification rehearsal

- [ ] **Step 1: Sweep**
```bash
grep -rn "AuditEvents.insertAsync" --include="*.js" imports/ server/ npmPackages/ | grep -v HipaaLogger   # → no hits (single write path)
grep -rn "clinical:hipaa-compliance" npmPackages/ imports/ server/ --include="*.js"                        # → no hits
npm run test:audit && npm test                                                                             # → PASS
```
- [ ] **Step 2: Rehearsal script** — create `docs/superpowers/specs/2026-07-01-audit-rehearsal.md` documenting the demo, then EXECUTE it once locally: (1) REST-read a patient → (2) event visible on AuditLogPage → (3) by-patient report → (4) CSV + Bundle export → (5) `hipaa.verifyChain` valid → (6) tamper one historical row in mongosh → (7) verifyChain reports that exact sequence. Record actual outputs in the doc.
- [ ] **Step 3:** `graphify update .`; final commit — `"feat(audit): HIPAA audit trail consolidation complete -- (d)(2)/(d)(3) rehearsed"`

## Self-review notes (applied)

- Spec coverage: builder+chain (T1), sequencer/single-writer/verify (T2), consolidation incl. HipaaAuditLog retirement + simpl-schema drop + stale-Package-key fix (T3), REST/(d)(2) gap + export events (T4), producer convergence (T5), (d)(3) reports (T6), rehearsal (T7).
- Pre-chain history is explicitly unchained (T3 migration) — verifyChain checks only chained events; documented.
- Non-blocking guarantee enforced at every producer call site (Global Constraints + T2/T4 wrappers).
- Exact enum/event names deferred to `RecordLifecycleEvents.js:13-47` by instruction rather than guessed — the one intentional read-then-adapt point, precisely anchored.
