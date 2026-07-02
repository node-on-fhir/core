# Server-Side Performance Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Every task ends with a `npm test` gate and/or a boot verification — do not mark a task complete without running the stated verification command and reading its output.

**Goal:** Close the four server-side scaling gaps identified in `fable/OPUS_NOF_ARCHITECTURE_PERFORMANCE.md` — no startup indexes (P-1/P-2/P-3), unanchored patient typeahead (P-3), per-request CapabilityStatement with no HTTP conditional caching (P-5), and full-document publications with no field projection (P-4). The headline fix is a **`Meteor.startup` index-creation pass** that indexes every registered FHIR collection's patient-compartment fields plus the two hottest compound query shapes; a `COLLSCAN → IXSCAN` `explain()` assertion is the acceptance test.

**Architecture:** Today `createIndex` runs in exactly two places — `server/SyncedCron.js` (its own bookkeeping collection) and a **manually-invoked admin method** (`imports/methods/fhirResourceStatistics.js:174-192`, the `commonIndices` block). Confirmed: **no `createIndex` in `server/main.js` or any startup path** (`grep -n createIndex server/main.js` → none). So a fresh deploy full-scans every patient-compartment query until an admin happens to open the statistics panel. This plan lifts that index logic into a startup module that iterates the same `collectionsMap` the publications use, and layers memoization + conditional-caching + projection on top. It is **server-side only**; it introduces no new client rendering.

**Tech Stack:** Meteor v3 (async collection ops, `Meteor.startup`), MongoDB (`rawCollection().createIndex`, `explain()`), FHIR R4. Tests run under `meteor test --once --driver-package meteortesting:mocha` (`npm test`).

## Global Constraints

- **Meteor v3 async everywhere on the server** — `createIndexAsync`, `findOneAsync`, `countAsync`, `.fetchAsync()`. No synchronous collection calls (`.claude/rules/meteor/v3-async.md`).
- **Idempotent + best-effort index creation.** Startup must be safe to re-run and must not crash boot: a field that doesn't exist on a collection, or a duplicate index, is logged and skipped, never thrown. Preserve the existing method's `try/catch` "collection may not have this field, which is fine" posture.
- **Do not change query semantics.** Adding an index or a `fields` projection must not change *which* documents a query returns — only its cost and payload. The publication guard order (`PATIENT_SCOPED_RESOURCES` empty-return, `this.userId` gate) is load-bearing; leave it intact.
- **`_id` is the source of truth for lookups** — never introduce `id || _id` OR logic (`.claude/rules/anti-patterns/id-lookup.md`). The ID-only `$or` fast-path in `autopublish.js:381-391` is deliberate; do not "optimize" it away.
- Commit after every task; end commit messages with the Claude Code co-author trailer.
- **Cross-plan boundaries (do NOT duplicate):**
  - **List virtualization (P-6)** is delivered by the `ResourceTable` behavioral shell in `docs/superpowers/plans/2026-07-01-dynamicfhir-enhancement.md` **Task 4** (`react-window`, keyboard rows, column prefs). This plan is server-side; it stops at the `fields` projection (Task 4 here) that *feeds* that shell. Reference it; do not add windowing here.
  - **Route-level code-splitting / bundle / barrel-import work (P-7)** is owned by `docs/superpowers/plans/2026-07-01-build-bundle-offline-upgrades.md`. Out of scope here.

## File map

| File | Responsibility |
|------|----------------|
| `server/startup/ensureFhirIndexes.js` | **NEW** — `Meteor.startup` index-creation pass over every registered FHIR collection (P-1/P-2/P-3) |
| `server/main.js` | import the new startup module (wire it into boot) |
| `imports/methods/fhirResourceStatistics.js` | remove the `commonIndices` write block (:174-192) — it becomes redundant; the method keeps *reporting* indices |
| `server/Metadata.js` | memoize `getCapabilityStatement()` + add `ETag`/`Cache-Control`/`If-None-Match` to `/metadata` handlers (P-5) |
| `server/publications/autopublish.js` | add a `fields` projection to the regular + `.all` publication cursors (P-4) |
| `server/publications/patients.js` | anchor the typeahead `$regex` so the `subject`/name indexes are usable (P-3, live hot path) |
| `imports/lib/fhirIndexSpecs.js` | **NEW** — the shared list of index specs (imported by both the startup pass and the statistics reporter) |

---

### Task 1: Startup index-creation pass (HEADLINE — P-1 / P-2 / P-3)

**Problem:** `createIndex` for the FHIR hot paths lives only inside the manually-invoked `fhir.getResourceStatistics` method (`imports/methods/fhirResourceStatistics.js:174-192`). A fresh deploy has **zero** patient-compartment indexes until an admin opens the statistics panel. Confirmed no `createIndex` in `server/main.js` or startup. Every `subject.reference` / `patient.reference` subscription and REST search is a COLLSCAN, and there are no compound indexes for `Observation?patient=X&category=vital-signs` (`{subject.reference, category.coding.code}`) or date-sorted patient timelines (`{subject.reference, effectiveDateTime}`).

**Files:**
- Create: `imports/lib/fhirIndexSpecs.js` (shared spec list)
- Create: `server/startup/ensureFhirIndexes.js`
- Modify: `server/main.js` (import the startup module)
- Modify: `imports/methods/fhirResourceStatistics.js:174-192` (delete the write block, keep the read/report)
- Test: `server/startup/ensureFhirIndexes.tests.js`

**Interfaces:**
- `fhirIndexSpecs.js` exports `FHIR_INDEX_SPECS` — an array of `{ key, options? }` MongoDB index descriptors: single-field `{ 'subject.reference': 1 }`, `{ 'patient.reference': 1 }`, `{ 'code.coding.code': 1 }`, `{ 'category.coding.code': 1 }`, `{ 'effectiveDateTime': -1 }`, plus **compound** `{ 'subject.reference': 1, 'category.coding.code': 1 }` and `{ 'subject.reference': 1, 'effectiveDateTime': -1 }`. Both the startup pass and the statistics reporter import this so they never drift.
- `ensureFhirIndexes()` — async; iterates the registered FHIR collections, calls `createIndexAsync(spec.key, spec.options)` per spec, best-effort (skips on error), logs a one-line summary. Invoked inside `Meteor.startup`.

- [ ] **Step 1: Write the failing test.** `server/startup/ensureFhirIndexes.tests.js` (mocha, server). Seed one `Observations` doc with a `subject.reference`, run `ensureFhirIndexes()`, then assert the compound patient+category query uses an index — the acceptance criterion from the findings' "Remediation kickoff":

    ```javascript
    // server/startup/ensureFhirIndexes.tests.js
    import { Meteor } from 'meteor/meteor';
    import { assert } from 'chai';
    import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';
    import { ensureFhirIndexes } from '/server/startup/ensureFhirIndexes';

    describe('ensureFhirIndexes', function () {
      it('creates a compound index that turns a patient+category COLLSCAN into an IXSCAN', async function () {
        await Observations.rawCollection().deleteMany({});
        await Observations.insertAsync({
          _id: 'perf-test-obs-1', id: 'perf-test-obs-1', resourceType: 'Observation',
          status: 'final',
          subject: { reference: 'Patient/perf-test-pt-1' },
          category: [{ coding: [{ code: 'vital-signs' }] }]
        });

        await ensureFhirIndexes();

        const plan = await Observations.rawCollection()
          .find({ 'subject.reference': 'Patient/perf-test-pt-1', 'category.coding.code': 'vital-signs' })
          .explain('queryPlanner');

        const stage = plan.queryPlanner.winningPlan.inputStage || plan.queryPlanner.winningPlan;
        const stageName = JSON.stringify(plan.queryPlanner.winningPlan);
        assert.notInclude(stageName, 'COLLSCAN', 'query must not full-scan after indexes exist');
        assert.include(stageName, 'IXSCAN', 'query must use an index scan');

        await Observations.rawCollection().deleteMany({ _id: 'perf-test-obs-1' });
      });
    });
    ```

- [ ] **Step 2: Run → FAIL.** `npm test 2>&1 | tee /tmp/perf-t1.log` — expect the assertion to fail (no `ensureFhirIndexes` module yet / COLLSCAN). Confirm the failure reason is the missing module or COLLSCAN, not a harness error.

- [ ] **Step 3: Write the shared spec list.** `imports/lib/fhirIndexSpecs.js` — lifted from `fhirResourceStatistics.js:174-180`, extended with the two compound shapes:

    ```javascript
    // imports/lib/fhirIndexSpecs.js
    // Shared FHIR hot-path index descriptors — imported by the startup
    // index pass (server/startup/ensureFhirIndexes.js) and the statistics
    // reporter (imports/methods/fhirResourceStatistics.js) so they never drift.
    export const FHIR_INDEX_SPECS = [
      { key: { 'subject.reference': 1 } },
      { key: { 'patient.reference': 1 } },
      { key: { 'code.coding.code': 1 } },
      { key: { 'category.coding.code': 1 } },
      { key: { 'effectiveDateTime': -1 } },
      // Compound — Observation?patient=X&category=vital-signs
      { key: { 'subject.reference': 1, 'category.coding.code': 1 } },
      // Compound — patient timeline sorted by clinical date
      { key: { 'subject.reference': 1, 'effectiveDateTime': -1 } }
    ];
    ```

- [ ] **Step 4: Write the startup pass.** `server/startup/ensureFhirIndexes.js`. Iterate the same registered-collection surface the publications use. `global.Collections` is populated at boot (per `.claude/rules/meteor/collections.md`); iterate its values, guard each with `rawCollection`, and create every spec best-effort. Do **not** filter on populated-only (unlike the stats method) — a fresh deploy is exactly when empty collections need their indexes.

    ```javascript
    // server/startup/ensureFhirIndexes.js
    import { Meteor } from 'meteor/meteor';
    import { FHIR_INDEX_SPECS } from '/imports/lib/fhirIndexSpecs';

    export async function ensureFhirIndexes() {
      const collections = global.Collections || Meteor.Collections || {};
      const names = Object.keys(collections);
      let created = 0;
      let skipped = 0;

      for (const name of names) {
        const collection = collections[name];
        if (!collection || typeof collection.rawCollection !== 'function') { continue; }
        let raw;
        try { raw = collection.rawCollection(); } catch (e) { continue; }

        for (const spec of FHIR_INDEX_SPECS) {
          try {
            await raw.createIndex(spec.key, spec.options || {});
            created++;
          } catch (e) {
            // Best-effort: field absent, index conflict, or empty ns — fine.
            skipped++;
          }
        }
      }
      console.log(`[ensureFhirIndexes] ${names.length} collections, ${created} indexes ensured, ${skipped} skipped`);
    }

    Meteor.startup(async function () {
      try {
        await ensureFhirIndexes();
      } catch (e) {
        console.error('[ensureFhirIndexes] startup pass failed (non-fatal):', e.message);
      }
    });
    ```

- [ ] **Step 5: Wire into boot.** In `server/main.js`, add `import '/server/startup/ensureFhirIndexes';` alongside the other startup imports. Verify the import lands **after** the collections registration (`global.Collections` must be populated before the `Meteor.startup` callback fires — `Meteor.startup` defers until after all module loads, so import order is not load-bearing here, but place it near the other publication/startup imports for readability). Confirm with `grep -n "ensureFhirIndexes" server/main.js`.

- [ ] **Step 6: De-dupe the admin method.** In `imports/methods/fhirResourceStatistics.js`, delete the write loop at `:174-192` (the inline `commonIndices` array and its `createIndex` for-loop). Keep the *reporting* code above it (`:161-169`, `stats.indices = indices.map(...)`). Optionally have the method import `FHIR_INDEX_SPECS` for its "expected vs present" reporting, but do **not** re-add a write path — startup owns writes now. Add a comment: `// Index creation moved to server/startup/ensureFhirIndexes.js (runs at boot).`

- [ ] **Step 7: Run → PASS.** `npm test 2>&1 | tee /tmp/perf-t1.log` — the `ensureFhirIndexes` spec now asserts `IXSCAN`, no `COLLSCAN`. Confirm no other server test regressed.

- [ ] **Step 8: Boot verification.** `meteor run --settings settings/settings.honeycomb.localhost.json` and grep the boot log for `[ensureFhirIndexes] ... indexes ensured`. Then hit a patient sidebar subscription and confirm no COLLSCAN warnings. Stop the server.

- [ ] **Step 9: Commit** — `git add imports/lib/fhirIndexSpecs.js server/startup/ensureFhirIndexes.js server/main.js imports/methods/fhirResourceStatistics.js server/startup/ensureFhirIndexes.tests.js && git commit -m "perf(fhir): create patient-compartment + compound indexes at startup (P-1/P-2/P-3)"`

---

### Task 2: CapabilityStatement memoization + conditional HTTP caching (P-5)

**Problem:** `MetadataServerMethods.getCapabilityStatement()` (`server/Metadata.js:172`) rebuilds the whole statement on every call, and both `/metadata` handlers (`Metadata.js:715` and `:730`) invoke it per request — each hit iterates the `Package` registry to enumerate supported resources. The handlers set a **static** `res.setHeader("ETag", fhirVersion)` in `FhirEndpoints.js` for *reads*, but the `/metadata` handlers set **no** `ETag`, no `Cache-Control`, and honor no `If-None-Match` — so every SMART app launch / conformance probe recomputes and re-downloads the full statement. Note the body embeds `"date": new Date()` (`Metadata.js:186`), so a naive memo would still change every call — the memo must **freeze** that timestamp.

**Files:**
- Modify: `server/Metadata.js` — memoize `getCapabilityStatement()`; add ETag/Cache-Control/If-None-Match to both `/metadata` handlers (`:715`, `:730`)
- Test: `server/Metadata.tests.js`

**Interfaces:**
- `getCapabilityStatement()` returns a **stable** object per process lifetime (or until an explicit `invalidateCapabilityStatementCache()` is called on registry change) — same reference, frozen `date`. A module-level `let cachedStatement = null` memo plus a content ETag (`"W/\"" + sha1(JSON.stringify(cachedStatement)) + "\""`) computed once.
- Both `/metadata` handlers: emit `ETag` + `Cache-Control: public, max-age=<ttl>`; if the request's `If-None-Match` equals the current ETag, respond `304` with an empty body.

- [ ] **Step 1: Write the failing test.** `server/Metadata.tests.js` — assert (a) two calls to `getCapabilityStatement()` return deep-equal objects with an **identical** `date` (proving memoization froze the timestamp), and (b) a helper `computeCapabilityETag()` returns a stable non-empty string across calls:

    ```javascript
    // server/Metadata.tests.js
    import { assert } from 'chai';
    import { MetadataServerMethods, computeCapabilityETag } from '/server/Metadata';

    describe('CapabilityStatement caching', function () {
      it('memoizes with a frozen date across calls', function () {
        const a = MetadataServerMethods.getCapabilityStatement();
        const b = MetadataServerMethods.getCapabilityStatement();
        assert.strictEqual(String(a.date), String(b.date), 'date must be frozen by the memo');
        assert.deepEqual(a, b);
      });
      it('produces a stable ETag', function () {
        assert.equal(computeCapabilityETag(), computeCapabilityETag());
        assert.isNotEmpty(computeCapabilityETag());
      });
    });
    ```

- [ ] **Step 2: Run → FAIL.** `npm test 2>&1 | tee /tmp/perf-t2.log` — expect `computeCapabilityETag` undefined and/or drifting `date`.

- [ ] **Step 3: Memoize.** In `server/Metadata.js`, add a module-level memo. Wrap the existing builder body: on first call build + freeze (assign a fixed `date` once, or move `date` into the memo), cache the object, compute and cache the ETag with Node `crypto`:

    ```javascript
    // near top of server/Metadata.js
    import crypto from 'crypto';
    let _cachedCapability = null;
    let _cachedCapabilityETag = null;

    export function invalidateCapabilityStatementCache() {
      _cachedCapability = null;
      _cachedCapabilityETag = null;
    }
    export function computeCapabilityETag() {
      if (!_cachedCapabilityETag) {
        const body = MetadataServerMethods.getCapabilityStatement();
        _cachedCapabilityETag = 'W/"' + crypto.createHash('sha1')
          .update(JSON.stringify(body)).digest('hex') + '"';
      }
      return _cachedCapabilityETag;
    }
    ```

    In `getCapabilityStatement` (`:172`), guard with `if (_cachedCapability) { return _cachedCapability; }` at the top, build into a local, then `_cachedCapability = CapabilityStatement; return _cachedCapability;` at the end. The `date`/`releaseDate` `new Date()` calls now run **once** and stay frozen in the memo — that is the intended behavior for a conformance resource.

- [ ] **Step 4: Conditional caching on the handlers.** In both `/metadata` handlers (`:715`, `:730`), before `res.json(...)`:

    ```javascript
    const etag = computeCapabilityETag();
    const ttl = get(Meteor, 'settings.public.fhir.metadataCacheSeconds', 300);
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=' + ttl);
    if (req.headers['if-none-match'] === etag) {
      res.statusCode = 304;
      res.end();
      return;
    }
    let returnPayload = MetadataServerMethods.getCapabilityStatement();
    res.json(returnPayload);
    ```

- [ ] **Step 5: Run → PASS.** `npm test 2>&1 | tee /tmp/perf-t2.log`.

- [ ] **Step 6: Boot verification.** Boot; `curl -sD - http://localhost:3000/metadata -o /dev/null` shows an `ETag:` and `Cache-Control:` header. Re-run with `-H 'If-None-Match: <that etag>'` and confirm `HTTP/1.1 304`. Stop the server.

- [ ] **Step 7: Commit** — `git add server/Metadata.js server/Metadata.tests.js && git commit -m "perf(fhir): memoize CapabilityStatement + ETag/Cache-Control/304 on /metadata (P-5)"`

---

### Task 3: Publication field projection (P-4)

**Problem:** the regular autopublish cursor (`server/publications/autopublish.js:461`, `return collection.find(query, options)`) and the `.all` cursor (`:494`, `collection.find({}, {...})`) ship **whole FHIR documents** — up to `subscriptionLimit` (default 1000) per collection — into Minimongo, and reactive `observeChanges` runs over the full payload. There is no `fields` projection anywhere. Well-guarded on *scope* (`PATIENT_SCOPED_RESOURCES` empty-return), not on *payload size*.

**Files:**
- Modify: `server/publications/autopublish.js` (`:396-461` options build → cursor at `:461`; `.all` cursor at `:494`)
- Test: `server/publications/autopublishProjection.tests.js`

**Interfaces:**
- A conservative, opt-in `fields` projection: only apply a projection when the caller passes `options.fields`, OR apply a **safe default** that excludes known-heavy blobs (`text.div` narrative HTML, `contained`, base64 `data` in attachments) while keeping everything a table needs. Projection must **never** drop `_id`, `id`, `resourceType`, or the reference fields the guard checks (`subject.reference`, `patient.reference`) — dropping those would break patient filtering and the ID fast-path.

- [ ] **Step 1: Write the failing test.** `server/publications/autopublishProjection.tests.js` — assert a helper `applyDefaultProjection(options)` (a) preserves any caller-supplied `options.fields` untouched, (b) when none supplied, returns an exclusion projection that excludes `text.div` / `contained` and does **not** touch `_id`/`subject.reference`:

    ```javascript
    // server/publications/autopublishProjection.tests.js
    import { assert } from 'chai';
    import { applyDefaultProjection } from '/server/publications/autopublish';

    describe('autopublish field projection', function () {
      it('respects a caller-supplied projection', function () {
        const opts = applyDefaultProjection({ fields: { status: 1 }, limit: 10 });
        assert.deepEqual(opts.fields, { status: 1 });
      });
      it('applies a safe exclusion default that keeps reference fields', function () {
        const opts = applyDefaultProjection({ limit: 10 });
        assert.equal(opts.fields['text.div'], 0);
        assert.equal(opts.fields['contained'], 0);
        assert.notProperty(opts.fields, '_id');            // never exclude _id
        assert.notProperty(opts.fields, 'subject.reference'); // never exclude the guard field
      });
    });
    ```

- [ ] **Step 2: Run → FAIL.** `npm test 2>&1 | tee /tmp/perf-t3.log` — `applyDefaultProjection` not exported yet.

- [ ] **Step 3: Implement + export the helper** in `autopublish.js` (module scope, near `buildImprovedPatientQuery`):

    ```javascript
    // Safe default projection: strip narrative/contained/attachment blobs the
    // tables never read, keep every field the guards and UI depend on. Excludes
    // only — never touches _id, id, resourceType, subject/patient.reference.
    export function applyDefaultProjection(options) {
      const opts = Object.assign({}, options);
      if (opts.fields) { return opts; } // caller knows best
      opts.fields = {
        'text.div': 0,
        'contained': 0,
        'content.attachment.data': 0
      };
      return opts;
    }
    ```

- [ ] **Step 4: Apply at both cursors.** At `:461`, change `return collection.find(query, options);` → `return collection.find(query, applyDefaultProjection(options));`. At the `.all` cursor (`:494`), wrap its inline options object through `applyDefaultProjection`. **Do not** apply a projection in the ID-fast-path branch differently — the same exclusion is harmless for ID lookups.

- [ ] **Step 5: Run → PASS**, and confirm the scope guard tests (if any) still pass — projection must not alter which docs return. `npm test 2>&1 | tee /tmp/perf-t3.log`.

- [ ] **Step 6: Boot verification.** Boot; open a resource list (e.g. Observations for a selected patient) and confirm rows still render (the projection keeps table fields). In the browser console, `Observations.findOne()` should show `text` without `div` and no `contained`. Stop the server.

- [ ] **Step 7: Commit** — `git add server/publications/autopublish.js server/publications/autopublishProjection.tests.js && git commit -m "perf(pub): safe field projection on autopublish cursors (P-4)"`

---

### Task 4: Anchored / indexable patient typeahead (P-3, live hot path)

**Problem:** the findings anchor P-3 at `buildImprovedPatientQuery` (`autopublish.js:12-46`) — ~20 unanchored `{$regex}` ORs that cannot use an index. **Verify first:** that helper has **no call site in the file** (`grep -n "buildImprovedPatientQuery(" server/publications/autopublish.js` → definition only) — it is dead/parallel. The **live** patient sidebar typeahead is `patients.search` (`server/publications/patients.js:66`), which expands `$or` `{$regex}` conditions the client sends (`:114-149`). Both share the same unanchored-regex pathology; the win is making the regex **prefix-anchored** so the `name.*` indexes created in Task 1 are usable, and pruning the dead helper.

**Files:**
- Modify: `server/publications/patients.js:114-149` (anchor the expanded regex conditions)
- Modify/Delete: `server/publications/autopublish.js:12-46` (`buildImprovedPatientQuery`) — delete if confirmed unused
- Modify: `imports/lib/fhirIndexSpecs.js` — add `Patients` name/identifier field indexes if not already covered
- Test: `server/publications/patientSearchAnchor.tests.js`

**Interfaces:**
- `anchorRegexCondition(condition)` — given a `{ 'name.family': { $regex: 'sm' } }`-style condition, return a prefix-anchored form (`{ $regex: '^sm', $options: 'i' }`) so MongoDB can range-scan the index. Applied to every expanded name/identifier condition in `patients.search`. Substring-in-the-middle matches are traded away for indexability — acceptable for typeahead (users type a prefix).

- [ ] **Step 1: Verify the anchors before touching code.** Run and record:
  - `grep -n "buildImprovedPatientQuery(" server/publications/autopublish.js` → confirm **no call site** (definition only). If a call site exists, do NOT delete; anchor it in place instead and note it.
  - `grep -rn "buildImprovedPatientQuery" server/ imports/` → confirm no external importer.

- [ ] **Step 2: Write the failing test.** `server/publications/patientSearchAnchor.tests.js`:

    ```javascript
    import { assert } from 'chai';
    import { anchorRegexCondition } from '/server/publications/patients';

    describe('patient typeahead anchoring', function () {
      it('prefix-anchors a name regex for index usability', function () {
        const out = anchorRegexCondition({ 'name.family': { $regex: 'sm' } });
        assert.equal(out['name.family'].$regex, '^sm');
        assert.equal(out['name.family'].$options, 'i');
      });
      it('is a no-op for non-regex conditions', function () {
        const passthrough = { _id: 'abc' };
        assert.deepEqual(anchorRegexCondition(passthrough), passthrough);
      });
    });
    ```

- [ ] **Step 3: Run → FAIL.** `npm test 2>&1 | tee /tmp/perf-t4.log`.

- [ ] **Step 4: Implement + apply.** Add `anchorRegexCondition` (exported) to `patients.js`; map it over `expandedConditions` before assigning `query.$or = expandedConditions` (`:148`). Anchor only string-regex values that aren't already anchored (`String(v.$regex).startsWith('^') ? v : { $regex: '^' + v.$regex, $options: v.$options || 'i' }`). Add `Patients` name/identifier index specs (`{ 'name.family': 1 }`, `{ 'name.given': 1 }`, `{ 'identifier.value': 1 }`) to `FHIR_INDEX_SPECS` if absent so the anchored prefix scan has an index to hit.

- [ ] **Step 5: Prune the dead helper.** If Step 1 confirmed no call site, delete `buildImprovedPatientQuery` (`autopublish.js:12-46`) with a commit note; otherwise anchor it and leave a comment.

- [ ] **Step 6: Run → PASS.** `npm test 2>&1 | tee /tmp/perf-t4.log`.

- [ ] **Step 7: Boot + explain verification.** Boot; type in the patient sidebar; confirm results still appear. In a mongo shell (or a throwaway test), `db.Patients.find({'name.family': {$regex:'^Sm', $options:'i'}}).explain()` shows `IXSCAN` on the `name.family` index (vs `COLLSCAN` for the unanchored `/sm/`). Stop the server.

- [ ] **Step 8: Commit** — `git add server/publications/patients.js server/publications/autopublish.js imports/lib/fhirIndexSpecs.js server/publications/patientSearchAnchor.tests.js && git commit -m "perf(patients): prefix-anchor typeahead regex for index usability + prune dead helper (P-3)"`

---

## Self-review notes (applied)

- **Anchors verified against real code, not the findings verbatim:** confirmed `createIndex` exists only in `SyncedCron.js` + `fhirResourceStatistics.js:186` and **not** in `server/main.js`/startup (P-1). Confirmed the `commonIndices` block at `:174-192`. Confirmed `getCapabilityStatement()` is called per-request at `Metadata.js:722`/`:737` and embeds `"date": new Date()` (`:186`) — so the memo must freeze the date (called out in Task 2). Confirmed the two projection-free cursors at `autopublish.js:461`/`:494`. **Corrected a finding imprecision:** P-5 says "no ETag anywhere" but `FhirEndpoints.js` sets a *static* `ETag: fhirVersion` on reads — the real gap is a *content* ETag + `Cache-Control` + `If-None-Match`/304, which Task 2 adds without disturbing the read-path static ETags. **Corrected P-3's anchor:** `buildImprovedPatientQuery` (`autopublish.js:12`) is defined-but-uncalled; the live typeahead is `patients.search` (`patients.js:66`) — Task 4 verifies this in Step 1 before deleting anything.
- **Headline task is the cheapest, highest-leverage fix** and carries the explicit `COLLSCAN → IXSCAN` `explain()` acceptance test the findings' "Remediation kickoff" demanded.
- **No cross-plan duplication:** virtualization (P-6) is referenced to `dynamicfhir-enhancement.md` Task 4; bundle/barrel (P-7) is referenced to `build-bundle-offline-upgrades.md`. This plan stops at the server-side `fields` projection that *feeds* the client shell.
- **Safety posture preserved:** idempotent best-effort index creation that can't crash boot; projection is exclusion-only and never drops `_id`/`resourceType`/reference guard fields; the ID-only `$or` fast-path and `PATIENT_SCOPED_RESOURCES` guard are untouched; no `id||_id` OR logic introduced.
- **Every task is TDD** (write-test → FAIL → implement → PASS) and gated on `npm test` + a boot/`explain`/`curl` verification with the exact command to run.
- **Shared spec module (`fhirIndexSpecs.js`)** prevents the startup pass and the stats reporter from drifting — the drift that let P-1 exist in the first place.
