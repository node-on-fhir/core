# Data-Modeling Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the data-integrity gaps surfaced in `fable/OPUS_NOF_ARCHITECTURE_DATA_MODELING.md` (DM-2..DM-6) without waiting on the schema-validation migration: reconcile the three collection registries and make drift fail loud (DM-3), add referential-integrity checks + a dangling-reference audit (DM-2), treat denormalized `*.display` as invalidatable cache (DM-4), give versioning a real `_history` collection behind one centralized increment helper (DM-5), and replace `meta.security[0].display` string coupling with a typed label helper (DM-6).

**Out of scope / referenced, not duplicated:** DM-1 (runtime schema validation is off — 86/87 `attachSchema` calls commented out) is **owned by** `docs/superpowers/specs/2026-07-01-simpleschema-to-jsonschema-migration-design.md`. This plan **assumes that migration handles boundary schema validation** (cardinality/type/required-field, egress validation) and does not re-implement it. DM-2's reference-existence check is complementary (it validates that a *referent exists*, not that the resource is *shaped* correctly), so it lands here.

**Architecture:** The write path is `server/FhirEndpoints.js` (REST create/update at `:1729-1830` create, `:1900-2020` update) plus per-resource `imports/api/*/methods.js`. The three registries are `server/main.js` (`Meteor.Collections` `:247`, `Object.assign(global.Collections,…)` `:335`), the client `imports/startup/client/collections.js` (`Meteor.Collections` `:84`), and the autopublish `collectionsMap` in `server/publications/autopublish.js` (`:125-200`). Denormalization lives in `imports/lib/FhirDehydrator.js` (~90 `flatten*` fns writing `patientDisplay`/`requesterDisplay`/`performerDisplay`/`locationDisplay`). Version increments are duplicated across `FhirEndpoints.js:1739,1914,1975,2013` + `imports/api/*/methods.js`. ACL reads `get(record,'meta.security[0].display','normal')` at `FhirEndpoints.js:589,770,872,1384,2528,2707`.

**Tech Stack:** Meteor v3 (async: `findOneAsync`/`insertAsync`/`updateAsync`), MongoDB, FHIR R4, lodash `get`/`set`. Tests run via `npm test` (`meteor test --once --driver-package meteortesting:mocha`).

## Global Constraints

- **Meteor v3 async everywhere on the server** — `findOneAsync`/`insertAsync`/`updateAsync`/`fetchAsync`; `function()` not arrow in Meteor methods (`.claude/rules/meteor/v3-async.md`).
- **`_id` is the lookup source of truth**; never `||`-fallback between `_id`/`id` (`.claude/rules/anti-patterns/id-lookup.md`). References resolve by FHIR `id` (the `Type/id` string), which is a legitimate field lookup, not an `_id` lookup.
- **Fail loud, never silently swallow** — every guard prints a balanced `console.warn`/`console.error` (project rule: balance if/then with console messages).
- **Additive & settings-gated for risky behavior** — referential integrity enforcement and `_history` writes default OFF and are opt-in via `Meteor.settings.private` (`.claude/rules/meteor/settings-gated-features.md`), so this plan cannot break existing imports/Synthea loads.
- **Boot verification after each task**: `meteor run --settings settings/settings.honeycomb.localhost.json` boots clean (no new startup throw) and the new startup self-check logs its PASS line.
- Commit after every task; end commit messages with the Claude Code co-author trailer.

## File map

| File | Responsibility |
|------|----------------|
| `imports/startup/client/collections.js` | client registry — add 3 missing collections |
| `server/publications/autopublish.js` | autopublish `collectionsMap` — add 5 missing collections |
| `imports/lib/collectionRegistryCheck.js` | **new** — reconcile the 3 registries, return mismatch report |
| `server/main.js` | **new** — call the registry self-check in `Meteor.startup` |
| `imports/lib/collectionRegistryCheck.test.js` | **new** — unit test for the reconciler |
| `imports/lib/referentialIntegrity.js` | **new** — `checkReferenceExists()` + `auditDanglingReferences()` |
| `imports/lib/referentialIntegrity.test.js` | **new** — unit tests |
| `server/methods/danglingReferenceAudit.js` | **new** — Meteor method wrapping the audit job |
| `imports/lib/FhirDehydrator.js` | DM-4 — `redisplayReferences()` re-derivation helper |
| `imports/lib/fhirVersioning.js` | **new** — `nextVersionId()` + `writeHistory()` centralization |
| `imports/lib/fhirVersioning.test.js` | **new** — unit tests |
| `imports/lib/schemas/SimpleSchemas/ResourceHistory.js` | **new** — the `_history` collection |
| `imports/lib/securityLabels.js` | **new** — typed `readSecurityLevel()` (DM-6, coordinate CR-4) |

---

### Task 1 (QUICK WIN): Reconcile the 3 collection registries + fail-loud startup self-check (DM-3)

**Problem:** `server/main.js` registers ~79 collections into `Meteor.Collections`/`global.Collections`, but the autopublish `collectionsMap` (`server/publications/autopublish.js:125-200`) is **missing 5**: `Coverages`, `DeviceUseStatements`, `MedicationDispenses`, `RelatedPersons`, `ServerConfiguration` — so those resources exist but silently can't be subscribed. The client registry (`imports/startup/client/collections.js`) *has* `RelatedPersons` + `ServerConfiguration` but is **missing** `Coverages`, `DeviceUseStatements`, `MedicationDispenses` (verified: `grep -nE "Coverages|DeviceUseStatements|MedicationDispenses" imports/startup/client/collections.js` returns nothing). The `globalCollections.js` guard exists but is opt-in; nothing fails at boot on drift.

**Files:**
- Modify: `server/publications/autopublish.js` (imports + `collectionsMap` `:125-200`)
- Modify: `imports/startup/client/collections.js` (imports + `Meteor.Collections` `:84` + `window.*` mirror `:166+`)
- Create: `imports/lib/collectionRegistryCheck.js`
- Create: `imports/lib/collectionRegistryCheck.test.js`
- Modify: `server/main.js` (add self-check to a `Meteor.startup`)

**Interfaces:**
- `reconcileCollectionRegistries({ server, autopublish, client })` — takes the three key-sets (arrays of collection names), returns `{ agree: boolean, missingFromAutopublish: [], missingFromClient: [], missingFromServer: [] }`. Pure function (no Meteor deps) so it's unit-testable.
- Server startup calls it with the live registries and `console.error`s + (in dev) throws on mismatch.

- [ ] **Step 1 (RED): Write the reconciler test.** Create `imports/lib/collectionRegistryCheck.test.js`:
```javascript
// imports/lib/collectionRegistryCheck.test.js
import { reconcileCollectionRegistries } from './collectionRegistryCheck';
import assert from 'assert';

describe('reconcileCollectionRegistries', function() {
  it('reports agreement when all three sets match', function() {
    const r = reconcileCollectionRegistries({
      server: ['Patients', 'Observations'],
      autopublish: ['Patients', 'Observations'],
      client: ['Patients', 'Observations']
    });
    assert.equal(r.agree, true);
    assert.deepEqual(r.missingFromAutopublish, []);
  });
  it('flags a collection present on server but absent from autopublish', function() {
    const r = reconcileCollectionRegistries({
      server: ['Patients', 'Coverages'],
      autopublish: ['Patients'],
      client: ['Patients', 'Coverages']
    });
    assert.equal(r.agree, false);
    assert.deepEqual(r.missingFromAutopublish, ['Coverages']);
  });
  it('flags a collection present on server but absent from client', function() {
    const r = reconcileCollectionRegistries({
      server: ['Patients', 'MedicationDispenses'],
      autopublish: ['Patients', 'MedicationDispenses'],
      client: ['Patients']
    });
    assert.equal(r.agree, false);
    assert.deepEqual(r.missingFromClient, ['MedicationDispenses']);
  });
});
```
  Run `npm test` → FAIL (module missing).
- [ ] **Step 2 (GREEN): Implement the reconciler.** Create `imports/lib/collectionRegistryCheck.js`:
```javascript
// imports/lib/collectionRegistryCheck.js
//
// Cross-checks the three collection registries (Meteor/global.Collections on the
// server, the autopublish collectionsMap, and the client Meteor.Collections) that
// are otherwise verified by nothing (DM-3). Pure + isomorphic; the server startup
// self-check feeds it live keys and fails loud on drift.

function diff(superset, subset) {
  const have = new Set(subset);
  return superset.filter((n) => !have.has(n)).sort();
}

export function reconcileCollectionRegistries({ server, autopublish, client }) {
  const s = server || [];
  const a = autopublish || [];
  const c = client || [];
  const missingFromAutopublish = diff(s, a);
  const missingFromClient = diff(s, c);
  const missingFromServer = diff([...new Set([...a, ...c])], s);
  const agree =
    missingFromAutopublish.length === 0 &&
    missingFromClient.length === 0 &&
    missingFromServer.length === 0;
  return { agree, missingFromAutopublish, missingFromClient, missingFromServer };
}

export default { reconcileCollectionRegistries };
```
  Run `npm test` → PASS.
- [ ] **Step 3: Close the autopublish gap.** In `server/publications/autopublish.js`, add the 5 imports next to the existing block (`:49-122`) and 5 entries to `collectionsMap` (`:125-200`), alphabetized to match style:
```javascript
import { Coverages } from '/imports/lib/schemas/SimpleSchemas/Coverages';
import { DeviceUseStatements } from '/imports/lib/schemas/SimpleSchemas/DeviceUseStatements';
import { MedicationDispenses } from '/imports/lib/schemas/SimpleSchemas/MedicationDispenses';
import { RelatedPersons } from '/imports/lib/schemas/SimpleSchemas/RelatedPersons';
import { ServerConfiguration } from '/imports/lib/schemas/SimpleSchemas/ServerConfiguration';
```
```javascript
  // ...existing entries...
  'Coverages': Coverages,
  'DeviceUseStatements': DeviceUseStatements,
  'MedicationDispenses': MedicationDispenses,
  'RelatedPersons': RelatedPersons,
  'ServerConfiguration': ServerConfiguration
```
  (`ServerConfiguration` is a singleton config resource, not patient-scoped — do **not** add it to `PATIENT_SCOPED_RESOURCES`.)
- [ ] **Step 4: Close the client gap.** In `imports/startup/client/collections.js`, add imports + `Meteor.Collections` entries + `window.*` mirrors for the **3 missing** on the client: `Coverages`, `DeviceUseStatements`, `MedicationDispenses` (`RelatedPersons`/`ServerConfiguration` are already present at `:68,73,147,152,228`). Match the existing pattern:
```javascript
import { Coverages } from '/imports/lib/schemas/SimpleSchemas/Coverages';
import { DeviceUseStatements } from '/imports/lib/schemas/SimpleSchemas/DeviceUseStatements';
import { MedicationDispenses } from '/imports/lib/schemas/SimpleSchemas/MedicationDispenses';
// ...in Meteor.Collections = { ... }:
    Coverages,
    DeviceUseStatements,
    MedicationDispenses,
// ...in the window.* mirror block:
  window.Coverages = Coverages;
  window.DeviceUseStatements = DeviceUseStatements;
  window.MedicationDispenses = MedicationDispenses;
```
- [ ] **Step 5: Wire the startup self-check.** In `server/main.js`, inside a `Meteor.startup` (add a small dedicated one near the existing `:488` startup), import the reconciler and the autopublish `collectionsMap` keys. Because `collectionsMap` is module-local, export it from autopublish first — add `export { collectionsMap as autopublishCollectionsMap };` at the end of `server/publications/autopublish.js`. Then:
```javascript
import { reconcileCollectionRegistries } from '/imports/lib/collectionRegistryCheck';
import { autopublishCollectionsMap } from '/imports/publications-or-path/autopublish'; // use the real path: '/server/publications/autopublish'

Meteor.startup(function() {
  const serverKeys = Object.keys(Meteor.Collections || {});
  const autopublishKeys = Object.keys(autopublishCollectionsMap || {});
  // Client keys aren't visible server-side; pass server as a stand-in and rely on
  // the client-side console guard + this build-time set. Compare server⇄autopublish here.
  const report = reconcileCollectionRegistries({
    server: serverKeys,
    autopublish: autopublishKeys,
    client: serverKeys
  });
  if (report.agree) {
    console.log('[registry-check] PASS — Meteor.Collections and autopublish collectionsMap agree (' + serverKeys.length + ' collections).');
  } else {
    console.error('[registry-check] DRIFT DETECTED (DM-3):', JSON.stringify(report));
    if (process.env.NODE_ENV !== 'production') {
      throw new Meteor.Error('collection-registry-drift',
        'Collection registries disagree — see [registry-check] log. Fix before boot.');
    }
  }
});
```
  (Note: the client registry can't be read from the server; the console guard in `imports/lib/globalCollections.js` covers client-side misses. This self-check catches the server⇄autopublish class, which was the actual DM-3 gap. If a shared build-time manifest of client keys is later added, feed it as `client`.)
- [ ] **Step 6: Verify** — `npm test` passes (reconciler unit tests). Boot: `meteor run --settings settings/settings.honeycomb.localhost.json`; confirm `[registry-check] PASS` in the log and no drift throw. Temporarily remove one autopublish entry to confirm it throws in dev (then restore). Confirm a client subscription to `autopublish.Coverages` now succeeds (previously silently returned nothing).
- [ ] **Step 7: Commit** — `git add server/publications/autopublish.js imports/startup/client/collections.js imports/lib/collectionRegistryCheck.js imports/lib/collectionRegistryCheck.test.js server/main.js && git commit -m "fix(data-model): reconcile 3 collection registries + fail-loud startup self-check (DM-3)"`

---

### Task 2: Referential-integrity check on the write path + dangling-reference audit (DM-2)

**Problem:** References are free-form strings; there's no existence check on POST/PUT and no dangling-reference audit. `structured-data-capture`'s `ValidationUtils.validateReference()` only checks object *shape*, not that the referent exists. A `Condition` can point at a deleted `Patient` indefinitely.

**Files:**
- Create: `imports/lib/referentialIntegrity.js`
- Create: `imports/lib/referentialIntegrity.test.js`
- Create: `server/methods/danglingReferenceAudit.js`
- Modify: `server/FhirEndpoints.js` (create path `~:1760`, versioned/nonversioned update `~:1914,:1979`) — opt-in guard
- Modify: `server/main.js` (import the audit method)

**Interfaces:**
- `parseReference(ref)` → `{ resourceType, id }` from `"Patient/123"` / `"urn:uuid:..."` / absolute URLs (reuse `FhirUtilities.pluralizeResourceName`).
- `checkReferenceExists(reference)` → `Promise<boolean>`; resolves the target `Collections[plural]` and `findOneAsync({ id })`. `urn:uuid:` and external absolute URLs (contained/bundled/remote) resolve `true` (can't verify — don't block).
- `collectReferences(resource)` → array of reference strings found at known FHIR reference paths (`subject.reference`, `patient.reference`, `encounter.reference`, `performer[].actor.reference`, `requester.reference`, `location[].location.reference`, `partOf[].reference`).
- `auditDanglingReferences({ resourceTypes })` → `Promise<{ scanned, dangling: [{ from, path, reference }] }>` — read-only report; no mutation.

- [ ] **Step 1 (RED): Write the test.** Create `imports/lib/referentialIntegrity.test.js`:
```javascript
// imports/lib/referentialIntegrity.test.js
import { parseReference, collectReferences } from './referentialIntegrity';
import assert from 'assert';

describe('referentialIntegrity', function() {
  it('parses a relative reference', function() {
    assert.deepEqual(parseReference('Patient/123'), { resourceType: 'Patient', id: '123' });
  });
  it('returns null for urn:uuid (unverifiable)', function() {
    assert.equal(parseReference('urn:uuid:53fefa32-fcbb-4ff8'), null);
  });
  it('collects references from a Condition', function() {
    const refs = collectReferences({
      resourceType: 'Condition',
      subject: { reference: 'Patient/123' },
      encounter: { reference: 'Encounter/e1' }
    });
    assert.ok(refs.includes('Patient/123'));
    assert.ok(refs.includes('Encounter/e1'));
  });
  it('never throws on a bare/empty resource', function() {
    assert.deepEqual(collectReferences({}), []);
    assert.deepEqual(collectReferences(null), []);
  });
});
```
  Run `npm test` → FAIL.
- [ ] **Step 2 (GREEN): Implement `imports/lib/referentialIntegrity.js`.** Pure helpers (`parseReference`, `collectReferences`) synchronous; `checkReferenceExists`/`auditDanglingReferences` async against `global.Collections`. Guard every access with lodash `get`; unverifiable refs (`urn:uuid:`, `http(s)://`) return `true` from `checkReferenceExists`. `auditDanglingReferences` iterates `global.Collections[type].find({}).fetchAsync()`, calls `collectReferences`, and for each parseable reference does one `findOneAsync({ id })` on the target collection. Run `npm test` → PASS.
- [ ] **Step 3: Opt-in write-path enforcement.** In `server/FhirEndpoints.js` create path, immediately before the insert (`~:1770`), add a settings-gated check:
```javascript
// DM-2: opt-in referential-integrity enforcement on the write path
if (get(Meteor, 'settings.private.fhir.enforceReferentialIntegrity', false)) {
  const refs = collectReferences(newRecord);
  for (const ref of refs) {
    const exists = await checkReferenceExists(ref);
    if (!exists) {
      console.error('[referential-integrity] ' + routeResourceType + ' references missing ' + ref);
      return res.status(422).json({
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'error', code: 'invariant',
          diagnostics: 'Referenced resource does not exist: ' + ref }]
      });
    }
  }
}
```
  Add the same guard before the two update inserts/updates (`~:1914`, `~:1979`). Import `collectReferences`/`checkReferenceExists` at the top of `FhirEndpoints.js`. Default OFF preserves current import/Synthea behavior.
- [ ] **Step 4: Dangling-reference audit method.** Create `server/methods/danglingReferenceAudit.js`:
```javascript
// server/methods/danglingReferenceAudit.js
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { auditDanglingReferences } from '/imports/lib/referentialIntegrity';

Meteor.methods({
  'admin.auditDanglingReferences': async function(resourceTypes) {
    check(resourceTypes, Match.Maybe([String]));
    if (!this.userId) { throw new Meteor.Error('not-authorized'); }
    console.log('[danglingReferenceAudit] scanning', resourceTypes || 'all');
    const report = await auditDanglingReferences({ resourceTypes });
    console.log('[danglingReferenceAudit] dangling:', report.dangling.length, 'of', report.scanned, 'scanned');
    return report;
  }
});
```
  Import it in `server/main.js` (`import '/server/methods/danglingReferenceAudit';`).
- [ ] **Step 5: Verify** — `npm test` passes. Boot with `settings.private.fhir.enforceReferentialIntegrity` unset → existing behavior. Set it `true`, POST a `Condition` with `subject.reference: "Patient/does-not-exist"` → expect `422` with the OperationOutcome; POST with a real patient → `201`. Call `Meteor.call('admin.auditDanglingReferences', ['Conditions'])` and confirm the report shape.
- [ ] **Step 6: Commit** — `git add imports/lib/referentialIntegrity.js imports/lib/referentialIntegrity.test.js server/methods/danglingReferenceAudit.js server/FhirEndpoints.js server/main.js && git commit -m "feat(data-model): referential-integrity write-path check + dangling-reference audit (DM-2)"`

---

### Task 3: Treat `*.display` as cache — re-derive / invalidate (DM-4)

**Problem:** `patientDisplay`/`requesterDisplay`/`performerDisplay`/`locationDisplay` are copied into ~50 resources by `imports/lib/FhirDehydrator.js` with no re-sync when the source (e.g. Patient name) is renamed. Provenance agent org-display is snapshotted (`FhirEndpoints.js:1493`). These are a denormalized cache with no invalidation strategy.

**Files:**
- Modify: `imports/lib/FhirDehydrator.js` (add `redisplayReferences()` helper)
- Create/extend: `imports/lib/referentialIntegrity.test.js` or a sibling `fhirDehydrator.display.test.js`

**Interfaces:**
- `redisplayReferences(resource)` → `Promise<resource>` — for each reference on the resource (`subject`/`patient`/`requester`/`performer`/`location`), look up the referent by `id`, and refresh the sibling `.display` (`subject.display`) from the referent's canonical display (Patient: `name[0].text` or `given+family`; Organization/Location: `name`). Returns a *copy*; never throws (missing referent leaves the stale display untouched but flags it). This is the "re-derive" arm — the invalidation arm is that the audit (Task 2) already surfaces dangling refs whose display is therefore suspect.

- [ ] **Step 1 (RED): Test.** Add to a display test file: a `Condition` whose `subject.display` is stale (`"Old Name"`) but whose referenced `Patient/p1` has `name[0].text: "New Name"` → after `redisplayReferences` the `subject.display` is `"New Name"`; a `Condition` whose referent is missing → `subject.display` unchanged and the resource is returned without throwing. Run `npm test` → FAIL.
- [ ] **Step 2 (GREEN): Implement `redisplayReferences` in `FhirDehydrator.js`.** Reuse `determineSubjectDisplayString` conventions already in the file. Resolve referents via `global.Collections` + `findOneAsync({ id })`; derive display with lodash `get` fallbacks (`name.0.text` → `name.0.given.join(' ')+' '+name.0.family` → `name`). Export it. Run `npm test` → PASS.
- [ ] **Step 3: Wire an opt-in re-display method** (mirror Task 2's method pattern) `admin.redisplayResource(resourceType, id)` that loads the record, runs `redisplayReferences`, and `updateAsync`es the refreshed displays — settings-gated / admin-only, so this is a maintenance action, not automatic write-path overhead. Document that automatic per-write re-display is intentionally NOT enabled (perf), and the audit + this method are the invalidation strategy.
- [ ] **Step 4: Verify** — `npm test` passes. Manually: rename a Patient, call `admin.redisplayResource('Condition', <id>)`, confirm the Condition's `subject.display` updates; confirm a missing-referent case is a no-op that logs a warning.
- [ ] **Step 5: Commit** — `git add imports/lib/FhirDehydrator.js imports/lib/*display*.test.js && git commit -m "feat(data-model): redisplayReferences — treat *.display as invalidatable cache (DM-4)"`

---

### Task 4: Real `_history` on update + centralize the versionId increment (DM-5)

**Problem:** `meta.versionId` increments on update (`FhirEndpoints.js:1739,1914,1975,2013`; `tasks.js:166`; several `imports/api/*/methods.js`) but there is **no `_history` collection** and no active merkalis storage — prior versions are overwritten, so FHIR `vread`/`_history` is unsupported at the data level. The increment logic is duplicated across ~6 sites (drift risk). **Decision:** add a single `ResourceHistory` collection written on every update, and centralize increment into one helper — the simplest strategy that restores `vread`/`_history` without adopting merkalis wholesale.

**Files:**
- Create: `imports/lib/schemas/SimpleSchemas/ResourceHistory.js`
- Create: `imports/lib/fhirVersioning.js`
- Create: `imports/lib/fhirVersioning.test.js`
- Modify: `server/FhirEndpoints.js` (`:1739,:1914,:1975,:2013`) + `server/main.js` (register `ResourceHistory`)
- Modify: `imports/api/*/methods.js` version-increment sites (opportunistic — at least `tasks.js:166`)

**Interfaces:**
- `nextVersionId(existingRecord)` → string — `String(parseInt(get(existingRecord,'meta.versionId','0'),10) + 1)`; the single source of the increment rule (replaces the 4 inline `set(newRecord,'meta.versionId',...)` computations).
- `applyVersionMeta(newRecord, existingRecord)` → mutates/returns `newRecord` with `meta.versionId = nextVersionId(existingRecord)` and `meta.lastUpdated = new Date()`.
- `writeHistory(resourceType, priorRecord)` → `Promise` — inserts a snapshot of `priorRecord` into `ResourceHistory` keyed by `{ resourceType, resourceId: priorRecord.id, versionId: priorRecord.meta.versionId }`; settings-gated (`settings.private.fhir.enableHistory`, default OFF).

- [ ] **Step 1 (RED): Test.** Create `imports/lib/fhirVersioning.test.js`:
```javascript
// imports/lib/fhirVersioning.test.js
import { nextVersionId, applyVersionMeta } from './fhirVersioning';
import assert from 'assert';

describe('fhirVersioning', function() {
  it('increments an existing string versionId', function() {
    assert.equal(nextVersionId({ meta: { versionId: '3' } }), '4');
  });
  it('starts at 1 when absent', function() {
    assert.equal(nextVersionId({}), '1');
    assert.equal(nextVersionId(null), '1');
  });
  it('applyVersionMeta stamps versionId + lastUpdated', function() {
    const rec = applyVersionMeta({}, { meta: { versionId: '1' } });
    assert.equal(rec.meta.versionId, '2');
    assert.ok(rec.meta.lastUpdated instanceof Date);
  });
});
```
  Run `npm test` → FAIL.
- [ ] **Step 2 (GREEN): Implement `imports/lib/fhirVersioning.js`** (`nextVersionId`, `applyVersionMeta` pure; `writeHistory` async + settings-gated). Run `npm test` → PASS.
- [ ] **Step 3: Create the collection.** `imports/lib/schemas/SimpleSchemas/ResourceHistory.js` — `export const ResourceHistory = new Mongo.Collection('ResourceHistory');` (follow the SimpleSchemas file convention; schema optional/blackbox since it stores whole snapshots). Register it in `server/main.js` (both `Meteor.Collections` and `global.Collections`) **and** in the client registry + autopublish map — then re-run the Task 1 self-check so it doesn't trip on the new collection.
- [ ] **Step 4: Centralize the increment + write history.** Replace the inline increments at `FhirEndpoints.js:1739` (create), `:1914` (versioned update), `:1975` (nonversioned update) with `applyVersionMeta(newRecord, existingRecord)`. In both update branches, before the `updateAsync`/versioned-insert, add:
```javascript
if (get(Meteor, 'settings.private.fhir.enableHistory', false) && existingRecord) {
  await writeHistory(routeResourceType, existingRecord);
}
```
  Import `applyVersionMeta`/`writeHistory` at the top of `FhirEndpoints.js`. Opportunistically repoint `imports/api/tasks/tasks.js:166` (and other `imports/api/*/methods.js` increment sites you touch) to `nextVersionId`.
- [ ] **Step 5: Verify** — `npm test` passes. Boot; PUT a resource twice with `settings.private.fhir.enableHistory: true`; confirm `meta.versionId` goes `1→2→3`, `ResourceHistory` gains one snapshot per update, and the registry self-check still PASSes. With `enableHistory` unset, confirm behavior is unchanged (versionId still increments via `applyVersionMeta`, just no history rows).
- [ ] **Step 6: Commit** — `git add imports/lib/fhirVersioning.js imports/lib/fhirVersioning.test.js imports/lib/schemas/SimpleSchemas/ResourceHistory.js server/FhirEndpoints.js server/main.js imports/startup/client/collections.js server/publications/autopublish.js imports/api/tasks/tasks.js && git commit -m "feat(data-model): _history collection + centralized versionId helper (DM-5)"`

---

### Task 5: Typed security-label helper — replace `meta.security[0].display` string coupling (DM-6)

**Problem:** ACL keys off `get(record,'meta.security[0].display','normal')` at 6 sites (`FhirEndpoints.js:589,770,872,1384,2528,2707`): `[0]`-indexed, default-permissive, vocabulary-unconstrained, and duplicated. Also a security finding (CR-4 mass-assignment, `docs/security/2026-07-01-honeycomb-security-audit.md`) — **coordinate, don't duplicate**: this task centralizes the *read* into one typed helper; CR-4 owns preventing clients from *setting* `meta.security` on write.

**Files:**
- Create: `imports/lib/securityLabels.js`
- Create: `imports/lib/securityLabels.test.js`
- Modify: `server/FhirEndpoints.js` (`:589,:770,:872,:1384,:2528,:2707`)

**Interfaces:**
- `SECURITY_LEVELS` — the constrained vocabulary (`'unrestricted'`, `'normal'`, `'restricted'`, `'very-restricted'`) as a frozen map, so ACL comparisons use constants not string literals.
- `readSecurityLevel(record)` → one of `SECURITY_LEVELS` — scans **all** `meta.security` entries (not just `[0]`), matching by `code` first then `display`, returning the most-restrictive found, defaulting to `'normal'`. Single source; replaces the 6 inline reads.

- [ ] **Step 1 (RED): Test.** Create `imports/lib/securityLabels.test.js`: `readSecurityLevel({ meta: { security: [{ display: 'restricted' }] } })` → `'restricted'`; a record with `[{display:'normal'},{display:'very-restricted'}]` → `'very-restricted'` (most-restrictive, not `[0]`); a record with no security → `'normal'`; `null` → `'normal'` (never throws). Run `npm test` → FAIL.
- [ ] **Step 2 (GREEN): Implement `imports/lib/securityLabels.js`.** `readSecurityLevel` uses lodash `get(record,'meta.security',[])`, maps each entry to a level via `code`||`display`, ranks by a restrictiveness order, returns the max (default `'normal'`). Run `npm test` → PASS.
- [ ] **Step 3: Replace the 6 sites.** At `FhirEndpoints.js:589,770,872,1384,2528,2707`, swap `get(record,'meta.security[0].display','normal')` (and the `records[0]`/`mostRecentRecord` variants) for `readSecurityLevel(record)` (import at top). Behavior is a superset: previously only `[0]` was read; now the most-restrictive label wins — safer, and note this in the commit body. Leave the two `{'meta.security.display': {$eq:'unrestricted'}}` *query* selectors (`:1258,:1584,:2478`) as-is (they're Mongo queries, not JS reads) unless trivially expressible; flag them for a follow-up.
- [ ] **Step 4: Verify** — `npm test` passes. Boot; exercise a request against a record with `meta.security[0].display='restricted'` and confirm the ACL still gates identically; add a record with a non-`[0]` restrictive label and confirm it's now honored. Cross-check with the CR-4 write-side guard once it lands (no conflict: this is read-only).
- [ ] **Step 5: Commit** — `git add imports/lib/securityLabels.js imports/lib/securityLabels.test.js server/FhirEndpoints.js && git commit -m "feat(data-model): typed readSecurityLevel helper — retire meta.security[0].display coupling (DM-6, coordinates CR-4)"`

---

## Self-review notes (applied)

- **DM-1 not duplicated** — schema/boundary validation is explicitly deferred to `docs/superpowers/specs/2026-07-01-simpleschema-to-jsonschema-migration-design.md`; DM-2's *existence* check is the complementary piece and lives here.
- **Quick win first** — Task 1 (DM-3) is the smallest, highest-certainty fix (✔-verified anchor: 5 collections missing from autopublish, 3 missing from client) and installs the fail-loud self-check the rest of the plan reuses (Tasks 4 registers `ResourceHistory` through the same three registries and re-runs the check).
- **Anchors verified firsthand:** the 5 autopublish-missing / 3 client-missing collections (`grep`), the versionId sites (`:1739,:1914,:1975,:2013` + `tasks.js`), the 6 `meta.security[0].display` reads, the `FhirDehydrator` `*Display` fields. Line numbers are anchors, not guarantees — re-`grep` before editing.
- **Every risky behavior is additive + settings-gated + default-OFF** (`enforceReferentialIntegrity`, `enableHistory`, admin-only redisplay/audit methods) so no existing import/Synthea path regresses; the versionId centralization is behavior-preserving by construction (`applyVersionMeta` reproduces the old `+1`/"1" rule).
- **TDD throughout** — each task's pure helpers (`reconcile*`, `parseReference`/`collectReferences`, `nextVersionId`, `readSecurityLevel`, `redisplayReferences`) get a RED unit test under `npm test` before implementation; boot verification confirms wiring the units can't.
- **CR-4 coordination** — DM-6 centralizes the *read*; the security audit's CR-4 owns the *write* guard. No overlap.
