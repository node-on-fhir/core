# HIPAA Audit Trail Consolidation — Design (Spec 2 of 2)

**Date:** 2026-07-01
**Status:** Approved design, pending implementation plan
**Companion:** `2026-07-01-structured-logging-design.md` (Spec 1 — operational
logging; its `log.phi()` routes into the pipeline defined here)
**Implementer:** Opus 4.8 (fresh session — this doc must stand alone)
**Certification targets:** ONC §170.315(d)(2) auditable events (ASTM E2147),
(d)(3) audit reports, (d)(10) auditing actions on health information; HIPAA
§164.312(b) audit controls.

## Problem

The audit infrastructure exists but is **fragmented across four
non-converging implementations** (survey 2026-07-01):

1. `npmPackages/hipaa-compliance` — the intended home: `HipaaLogger`
   (isomorphic, settings-gated, writes to the core `AuditEvents` collection
   via `global.Collections`), collection hooks over a settings-driven monitor
   list, `AuditLogPage` UI, 20+ policy templates, encryption manager, 7-year
   retention config. **But** it also defines its own parallel
   `HipaaAuditLog` Mongo collection (`lib/Collections.js`, SimpleSchema-based)
   — two stores, one package. README is still Atmosphere-era.
2. `npmPackages/record-lifecycle` — an **EventBus** with a `HipaaSubscriber`
   that maps lifecycle events (`created/accessed/updated/...`) onto
   `HipaaLogger.logEvent()`. The modern spine; partially wired.
3. `npmPackages/patient-matching/server/security/auditLogging.js` — its own
   `AuditLogs` collection (timestamps, AAL2 auth context, match metadata,
   365-day retention).
4. `npmPackages/order-catalog` and `npmPackages/implantable-devices` — write
   raw `{resourceType: 'AuditEvent'}` documents directly.

Critical gap: **no audit middleware on FHIR REST reads**
(`server/FhirEndpoints.js`) — the primary channel by which PHI leaves the
system is not audited, which (d)(2) squarely requires. Publications and
Meteor methods are likewise uncovered outside the hooked collections.
`AuditEvents` schema exists (`imports/lib/schemas/SimpleSchemas/AuditEvents.js`)
with attachment commented out like all core schemas.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **FHIR `AuditEvents` is the single canonical store** | Queryable through honeycomb's own FHIR REST API, exportable, certification-legible. `HipaaAuditLog` is retired (readable during a deprecation window, no new writes) |
| 2 | **`record-lifecycle`'s EventBus is the spine** | All audit producers emit lifecycle events; `HipaaSubscriber → HipaaLogger → AuditEvents` is the single write path. Direct `AuditEvents.insertAsync` outside `HipaaLogger` is an anti-pattern after this effort |
| 3 | **Tamper-evidence: per-entry SHA-256 hash chain, merkalis-ready but not merkalis-dependent** | merkalis isn't ready to ship. `HipaaLogger` maintains `previousHash`/`entryHash` fields; the chain writer is a pluggable EventBus subscriber so merkalis can replace/augment it later via record-lifecycle's before/after hooks, without touching producers |
| 4 | **REST read auditing lands in `prepForFhirTransfer`-adjacent middleware** | Closes the (d)(2) gap at the same response chokepoint the JSON Schema migration effort uses for egress validation (see `2026-07-01-simpleschema-to-jsonschema-migration-design.md`) — one read event per REST retrieval, batched per Bundle |
| 5 | **The three stray producers converge on the EventBus** | patient-matching, order-catalog, implantable-devices emit lifecycle events instead of maintaining private stores/direct writes |
| 6 | **hipaa-compliance drops SimpleSchema while touched** | Its `lib/Collections.js` SimpleSchema goes away with `HipaaAuditLog`; aligns with the JSON Schema migration effort without expanding that plan's scope |

## Architecture

### The single write path

```
producers                      spine                        store
─────────                      ─────                        ─────
REST reads (FhirEndpoints) ─┐
Meteor methods ─────────────┤
collection hooks ───────────┼─▶ record-lifecycle EventBus ─▶ HipaaSubscriber
publications (patient-     ─┤        │                        │
  compartment subscribe)    │        └─▶ chainSubscriber      ▼
log.phi() (Spec 1) ─────────┘            (tamper chain)   HipaaLogger.logEvent()
patient-matching ───────────┘                                │
order-catalog / implantable-devices                          ▼
                                                    AuditEvents (FHIR R4)
```

### Component 1: AuditEvent shape (FHIR R4 + chain extension)

`HipaaLogger.buildAuditEvent()` is upgraded to emit **conformant FHIR R4
AuditEvent** resources: `type`/`subtype` (DICOM/FHIR audit event codes:
`rest`, `read`, `create`, `update`, `delete`, `login`, `logout`, `export`),
`recorded`, `agent[]` (userId, userName, network address, AAL context),
`source.observer`, `entity[]` (what: `Patient/123` reference + patient
compartment entity for patient-scoped events). Tamper-evidence rides a FHIR
extension:

```
extension: [{
  url: 'urn:honeycomb:audit-chain',
  extension: [
    { url: 'previousHash', valueString: '<sha256 of previous entryHash>' },
    { url: 'entryHash',    valueString: '<sha256 of canonical(event minus extension)>' },
    { url: 'sequence',     valuePositiveInt: N }
  ]
}]
```

Chain rules: canonicalization = stable-key-order JSON of the event minus the
chain extension; genesis entry uses `previousHash: 'genesis'`; sequence is a
server-side monotonic counter (Mongo `findOneAndUpdate` on a counters doc —
no race under concurrent writes). A `hipaa.verifyChain` server method walks
the chain and reports the first broken link — this is the (d)(2)
tamper-detection demonstration.

**merkalis future-plug:** the chain writer is `chainSubscriber.js`, a
record-lifecycle EventBus subscriber. When merkalis ships, a
`merkalisSubscriber` replaces or supplements it (anchoring `entryHash` into
the merkle store) via the same subscription API — producers and HipaaLogger
unchanged.

### Component 2: REST read auditing (the (d)(2) gap)

`server/lib/AuditMiddleware.js`, called from `FhirEndpoints.js` at the same
response chokepoints that call `RestHelpers.prepForFhirTransfer()`:

- Single-resource read → one `rest/read` lifecycle event
  (`{ collectionName, resourceId, userId, patientReference }`).
- Search/Bundle → ONE `rest/search` event with `entity[]` listing the
  patient references present in the result set (not one event per entry —
  E2147 wants the access recorded, not 500 rows per page load).
- `$export` (BulkData.js) → `export` events per job with resource-type
  counts and the requesting principal.
- Settings-gated: `settings.private.hipaa.audit.restReads` (default `true`
  when the hipaa-compliance package is loaded, else no-op). Fires
  **after** the response is committed (non-blocking — audit failure must
  never break a clinical read; failures go to the Spec 1 operational log at
  `error`).

### Component 3: Producer convergence

| Producer | Change |
|----------|--------|
| `patient-matching/server/security/auditLogging.js` | Emits `match` lifecycle events on the EventBus carrying its match metadata (scores, AAL2 context) in the event payload; its private `AuditLogs` collection is retired after a deprecation window. Its 365-day retention is superseded by the package-level 7-year policy |
| `order-catalog`, `implantable-devices` direct `AuditEvent` writes | Replaced with EventBus emissions; document shape parity verified by test |
| `imports/lib/HipaaLogger.js` (thin core wrapper) | Becomes a re-export of the hipaa-compliance implementation (one HipaaLogger, not two) |
| `hipaa-compliance/lib/Collections.js` | `HipaaAuditLog` collection + SimpleSchema deleted; existing rows migrated to AuditEvents by a one-time script (`scripts/migrate-hipaaauditlog-to-auditevents.js`) preserving original timestamps |

### Component 4: (d)(3) audit reports

`AuditLogPage` (exists) is extended with the E2147-shaped queries:
by patient (all accesses to Patient/X across a date range), by user (all PHI
accesses by user Y), by event type, sorted/filtered by date — each exportable
as CSV and as a FHIR `Bundle` of AuditEvents (searchset). Server methods
back these with indexed queries (`recorded`, `agent.who.identifier.value`,
`entity.what.reference` — indexes created at startup). Chain-verification
status (`hipaa.verifyChain` result) is surfaced on the page header.

### Settings schema (extends existing `hipaa.*` keys)

```json
"public":  { "hipaa": { "features": { "auditLogging": true } } },
"private": { "hipaa": {
  "audit": { "restReads": true, "publications": false },
  "hooks": { "enableCollectionHooks": true, "monitoredCollections": [] },
  "retentionYears": 7
} }
```
Publication auditing defaults **off** (volume; revisit after REST auditing
is proven). Absent keys keep current behavior.

### Out of scope

- merkalis integration itself (interface prepared; not shipped).
- The 20+ policy templates and encryption manager (already functional).
- Auditing every Meteor method repo-wide (methods that mutate monitored
  collections are covered by hooks; a dedicated method-decorator pass is a
  future item).
- Client-side audit capture beyond what `log.phi()` (Spec 1) relays.

## Testing

1. **Unit (`node --test`):** chain canonicalization stability; hash-chain
   build + verify; broken-link detection (mutate one historical field →
   `verifyChain` flags exactly that sequence number); AuditEvent shape
   conformance via `FhirValidator.validateResource` (AuditEvent has a staged
   R4B schema — the JSON Schema effort's validator is the conformance test).
2. **Integration (meteortesting:mocha):** REST read → exactly one AuditEvent
   with correct agent/entity; search → one event, N entities; EventBus
   producer parity for the three converged packages; migration script
   round-trip on fixture HipaaAuditLog rows; audit write failure does not
   fail the read (non-blocking guarantee).
3. **Manual/certification rehearsal:** the (d)(2)/(d)(3) demo script —
   access a patient via REST, show the AuditEvent appear on AuditLogPage,
   run the by-patient report, export it, run `hipaa.verifyChain`, then
   tamper with a row in mongosh and show verification fail.

## Risks

- 🎯 Audit volume: REST-read auditing on a busy server writes constantly —
  mitigated by Bundle-level (not entry-level) events, indexes up front, and
  the existing retention machinery.
- 💥 Sequence-counter contention under load — single `findOneAndUpdate`
  increment is atomic; if it measures hot, chain writes can batch (the chain
  orders by sequence, not wall-clock).
- 🐛 The chain makes AuditEvents append-only in spirit — any legacy code
  that *updates* an AuditEvent breaks verification. Grep for updates at
  implementation time; the collection gets no update methods.
- 🔒 Non-blocking auditing means a sustained audit-write outage loses
  events — failures alarm loudly through Spec 1's operational stream
  (`error` level, Splunk-visible) rather than silently.
- 😭 Certification reviewer asks for (d)(2) coverage of publications —
  the settings key exists (`audit.publications`), the EventBus accepts the
  events; enabling it is configuration plus one subscriber, documented as
  the known follow-up.

**But remember:** four disconnected audit implementations and unaudited REST
reads is the status quo. Consolidation onto a spine that already half-exists
(EventBus → HipaaLogger → AuditEvents) is mostly connection work, not
invention — and the tamper chain turns "we log accesses" into "we can prove
the log."
