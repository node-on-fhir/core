# FHIR Resource Dedup / Matching

## The system

Dedup runs in three modes, all built on the same two layers:

| Layer | Where | What |
|-------|-------|------|
| Entity-resolution math | `npmPackages/patient-matching/lib/Deduplicator.js` | Pure JS. Patients: union-find clustering over weighted probabilistic scores. Everything else: deterministic grouping by business identifier (`system\|value`), else content fingerprint. `analyze()` (non-destructive plan) / `reconcile()` / `mergePatients()`, plus exported `contentFingerprint` / `identifierKey` primitives. |
| DB orchestration | `imports/api/dedup/` (core) | `engine.js` loads scoped candidate sets, strips import-run tags before fingerprinting, finds/re-points inbound references (`referencePaths.js`), applies deletions with MERGE Provenance, persists findings (`DedupFindings.js`). |

**Trigger modes:**
1. **On-demand** — `Meteor.rpc('dedup.analyze', { scope: 'patient'|'collection'|'importRun', … })` (non-destructive, auth-only) and `dedup.reconcile` (destructive, gated by `settings.private.dedup.allowReconcile`, supports `options.dryRun`). Also `dedup.checkSettings`, `dedup.getFindings`.

**Opt-in analyze flags (2026-09-21, PHR IG algorithms):**
- `fuzzy: true` — additionally runs weighted per-resource-type similarity
  (`patient-matching/lib/resourceSimilarity.js`: w·code + w·date + w·value +
  w·context, tolerances/θ per `lib/constants/similarityProfiles.js`, e.g.
  vitals ±1h θ=0.95, Conditions ±30d θ=0.85). Pairs clearing θ return as
  `fuzzyCandidates` (and persist on the finding). **REPORT-ONLY** —
  `applyReconcile` never acts on them, same posture as probabilistic patient
  clusters. Pairs already grouped deterministically are excluded.
- `normalizeIdentifiers: true` — identifier grouping keys run through
  `patient-matching/lib/normalizeIdentifier.js` (case fold, whitespace/
  separator strip, SYSTEM_RULES for SSN/NPI/MBI) so `mrn-12 34` and `MRN1234`
  group. OFF by default: normalized keys differ from raw keys — enable
  consistently per comparison set, never piecemeal.
2. **Import-time** — `Meteor.DedupEngine.findExistingDuplicate(collection, resource)` pre-insert probe (see below).
3. **Cron** — `imports/api/dedup/cron.js`, nightly analysis persisting DedupFindings; gated by `settings.private.dedup.enableCronAnalysis` AND the global SyncedCron gates (`ENABLE_SYNCED_CRON` / `settings.private.enableCronAutomation`). Optional `settings.private.dedup.cronAutoReconcileExact` collapses exact content-fingerprint groups only.

## The meta.tag fingerprint gotcha (why sanitizeForDedup exists)

`Deduplicator.contentFingerprint` strips `meta.lastUpdated/versionId/source` but
**NOT `meta.tag`** — so two identical resources stamped by different import runs
(`urn:honeycomb:import-run`) fingerprint differently and never group. Any
DB-scope comparison MUST go through `sanitizeForDedup()`
(`imports/api/dedup/engine.js`), which strips the run/type tag systems while
preserving real tags (security labels, merge markers). The engine does this
automatically; don't call `Deduplicator.analyze` on raw stored docs.

## Import-time pattern (for importers)

Before blind-inserting a derived/imported resource, probe for an equivalent
existing record. Feature-detect the engine — importers must work when it's
absent, and the probe itself degrades to null on any error:

```javascript
const dedupEngine = Meteor.DedupEngine;  // core service, registered by imports/api/dedup/engine.js
if (dedupEngine && typeof dedupEngine.findExistingDuplicate === 'function') {
  const duplicate = await dedupEngine.findExistingDuplicate(collection, resource);
  if (duplicate) {
    results.skippedDuplicates++;   // count + log — never silently swallow
    continue;
  }
}
await collection.insertAsync(resource);
```

Reference adoption: `npmPackages/data-importer/server/methods.warehouse.js`
(no-version branch; `options.skipContentDuplicates !== false`, Patients exempt —
patient identity goes through the matching flow, not content collapse).

**Stronger source-level guards beat content fingerprints when available.** The
genomics importer hashes the whole uploaded file
(`urn:honeycomb:genomics:file-sha256` extension) and short-circuits the entire
run — see `extensions/genome-central-redux/server/methods.genomics.js`. Prefer
that shape when an import has a canonical source artifact.

## Safety posture

- `dedup.analyze` is free and non-destructive; **reconcile requires the settings
  gate** and every collapse emits a MERGE Provenance targeting the keeper.
- Keeper policy: newest (`meta.lastUpdated`, tie → most fields), overridden by
  "the member that already has inbound references".
- A doc whose inbound references cannot be re-pointed is never deleted.
- **Probabilistic patient clusters are never auto-merged** — not by reconcile
  defaults, not by cron. They require explicit per-cluster
  `options.clusterStrategies[representativeId] = 'merge'`.

## Settings keys (all default off)

```
settings.private.dedup.allowReconcile
settings.private.dedup.enableCronAnalysis
settings.private.dedup.cronSchedule            ("at 2:30 am" later.js text)
settings.private.dedup.cronResourceTypes       (array of resourceType strings)
settings.private.dedup.cronAutoReconcileExact
```

## Testing

`npm run test:dedup-engine` — bundles the engine with esbuild + meteor stubs
(needs node_modules; NOT the bare-checkout lib-unit-tests job). See
`tests/unit/imports/api/dedup/engine.test.mjs`.

## Related

- `imports/api/dedup/engine.js` — orchestration + `Meteor.DedupEngine` facade
- `imports/api/dedup/methods.js` — RPC surface
- `npmPackages/patient-matching/lib/Deduplicator.js` — the math (+ its CLAUDE.md)
- `imports/lib/importRunTags.js` + `.claude/rules/meteor/settings-gated-features.md`
- Client-side batch dedup at `/import-data`: `npmPackages/data-importer/client/useDeduplicator.js` (unchanged)
