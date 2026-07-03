# SimpleSchema → JSON Schema Migration & Outbound Validation — Design

**Date:** 2026-07-01
**Status:** Approved design, pending implementation plan
**Implementer:** Opus 4.8 (fresh session — this doc must stand alone)

## Problem

Honeycomb has carried "migrate SimpleSchema → JSON Schema" as a backlog item for
two years. The current state (verified by codebase survey, 2026-07-01):

- **96 SimpleSchema definition files** in `imports/lib/schemas/SimpleSchemas/`;
  **93 of their `attachSchema()` calls are commented out**. `aldeed:collection2`
  is not installed. Collection-level validation is structurally OFF.
- **142 R4B JSON Schema files** are staged in
  `imports/lib/schemas/R4B/JsonSchema/` and imported by nothing. Inspection
  (2026-07-01) shows these are **simplified schemas derived from the HL7 R4B
  spec** (see `/fetch-fhir-schemas`), not the raw official artifacts: flat
  inline `properties`, no `definitions`/`$ref`s, recursion truncated (e.g.
  `extension` is `array of object`), `additionalProperties` unset
  (permissive), ~6KB per resource. This validates **structural conformance**,
  not full HL7 fidelity — which suits the strict-out goal and keeps AJV
  compilation trivial (no cross-file refs, no recursion). Swapping in the
  official artifacts later is possible without changing the architecture.
- The house philosophy is **permissive inbound, strict outbound** — but no
  outbound validation exists. Egress (REST, bulk export, relay) sends whatever
  is in Mongo.
- `simpl-schema@3.4.6` remains a dependency, used by the 96 schema files plus
  ~8 satellite modules.

This effort retires SimpleSchema entirely and builds the outbound validation
the philosophy calls for, using the staged HL7 artifacts as the single source
of truth.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Validation engine: AJV** (`ajv@8`, npm) validating directly against the official HL7 R4B JSON Schemas | One engine, one schema source of truth at every layer; AJV handles recursive `$ref`s natively |
| 2 | **Do not adopt `typed:model`** (Atmosphere, Zod) | Hard-pinned to Zod 3 internals; no `z.lazy` support → throws at Model construction on every recursive FHIR schema; Atmosphere-only (no npm dist); always-on ingress validation inverts permissive-in. Verified by source review of copleykj/meteor-typed-model v1.0.0 |
| 3 | **Do not use Zod's `z.fromJSONSchema()`** | Zod-4-only (deadlocks with typed:model's Zod 3 pin) and documented as experimental/unstable API |
| 4 | **Collection layer: native `ValidatedCollection` wrapper** | typed:model's composition pattern with inverted defaults: permissive pass-through by default, opt-in `validate` per operation or per collection |
| 5 | **Egress: per-channel policy** `off \| warn \| annotate \| block` | REST, bulk export, and relay each get an independently configurable failure policy, settings-gated |
| 6 | **Full SimpleSchema removal** | 96 schema files converted; satellites migrated; `simpl-schema` removed from `package.json` |
| 7 | **Sequencing: foundation → egress → ralph loop → satellites → removal** | Egress validation lands first so an interrupted migration still delivers the strict-out capability |

## Architecture

### Component 1: `FhirValidator` — `imports/lib/FhirValidator.js`

Plain-JS module (no Meteor imports; testable with `node --test`). The schema
assets are loaded through a generated index module (`R4B/JsonSchema/index.js`,
emitted once by a small script) so the validator itself stays data-free.
**Server-only in practice**: nothing on the client imports it by default —
pulling 142 JSON schemas into the client bundle is explicitly avoided.
Responsibilities:

- **Load + normalize** the R4B schemas. The HL7 files declare draft-06 and use
  the legacy `id` keyword; AJV 8 speaks draft-07+. Normalization happens
  **in memory at load** (no duplicate committed artifacts): rename `id` → `$id`,
  convert boolean `exclusiveMinimum`/`exclusiveMaximum` if present, set
  `$schema` to draft-07. The delta between drafts is tiny and mechanical.
- **Lazy compile cache**: `getValidatorFor(resourceType)` compiles on first use
  and caches the compiled AJV validator (compilation of recursive FHIR schemas
  is expensive; do it once per resource type per process).
- **API:**
  - `validateResource(resource)` → `{ valid, errors, resourceType }`
    (dispatches on `resource.resourceType`; unknown types → `valid: true`
    with a `warnings` note, per permissive philosophy)
  - `toOperationOutcome(errors, resource)` → FHIR `OperationOutcome` with one
    `issue` per AJV error (`severity: 'error'`, `code: 'invariant'`,
    `expression: [instancePath]`, `diagnostics: message`)
  - `validateBundle(bundle)` → validates the Bundle envelope plus each
    `entry.resource` individually, aggregating per-entry results
- Strips Mongo/Meteor-only fields before validation (`_id`, `_document`,
  anything not in the schema — validation runs on a cleaned copy, never
  mutating the stored document).

### Component 2: `ValidatedCollection` — `imports/lib/ValidatedCollection.js`

Factory `createFhirCollection(resourceType, collectionName, options)` returning
a **JS Proxy around a real `Mongo.Collection`**:

- The `get` trap forwards everything to the underlying collection —
  `find`, `findOne(Async)`, `createIndexAsync`, `rawCollection`, `_transform`,
  attachments of BaseModel prototypes, etc. all work unchanged. Publications
  returning cursors are untouched. **The wrapper is a drop-in: no consumer
  code changes.**
- `insertAsync` / `updateAsync` / `upsertAsync` are intercepted **only** when
  strict mode applies, which is when any of:
  1. the call passes `{ validate: true }` in its options,
  2. the collection is listed in
     `Meteor.settings.private.fhir.schemaValidation.strictCollections`,
  3. `Meteor.settings.private.fhir.schemaValidation.validate === true`
     (the existing global key, currently `false` — honored as a global strict
     switch).
- On strict-mode failure: throw
  `new Meteor.Error('validation-failed', <summary>, <OperationOutcome>)`.
  Never silently drop or mutate.
- Escape hatch: the raw collection is reachable as `wrapped.collection`
  (mirrors typed:model) — though because default mode is pass-through, the
  hatch is rarely needed.
- Client side: the Proxy is isomorphic; strict mode is server-only (settings
  are private), so client Minimongo behavior is unchanged.

### Component 3: Egress validation hooks

One shared helper, `validateOutbound(resource, channel)` (server-only,
`server/lib/OutboundValidation.js`), reads the per-channel policy and returns
`{ action: 'pass' | 'annotate' | 'block', operationOutcome? }`. Wire-in
points (anchors verified 2026-07-01):

| Channel | Anchor | Behavior per policy |
|---------|--------|---------------------|
| **REST** | `RestHelpers.prepForFhirTransfer()` — `server/RestHelpers.js:732`, immediately after `applyProfileDecorators()` at `:868` | `warn`: structured `console.warn`, send unchanged. `annotate`: add `meta.tag` `{system: 'http://hl7.org/fhir/tools/CodeSystem/validation-status', code: 'validation-failed'}`, send. `block`: caller receives the OperationOutcome as the response body instead of the resource (HTTP status handling unchanged in v1 — upgrading blocked responses to 4xx/5xx across FhirEndpoints call sites is deferred) |
| **Bulk export** | `server/BulkData.js` — `resourceToNdjsonLine()` `:391`; job loops `processPatientEhiExportJob()` `:614`, `processExportJob()` `:741` | `warn`: log, include line. `annotate`: include line AND emit an `OperationOutcome.ndjson` error file listed in the status response's `error` array (this is the FHIR bulk-export-native error mechanism). `block`: omit the resource from output, still emit the error-file entry |
| **Relay** | `ProxyRelay.proxyRelayPut()` `server/ProxyRelay.js:10`, `proxyRelayPost()` `:33` | `warn`: log, send. `block`: do not call `fetch`; return the OperationOutcome to the caller. (`annotate` is not meaningful for relay; config validation treats it as `warn`) |

`off` disables the check entirely on that channel (zero AJV cost).

### Settings schema (extends the existing key)

```json
"private": {
  "fhir": {
    "schemaValidation": {
      "validate": false,
      "filter": false,
      "strictCollections": [],
      "egress": {
        "rest": "warn",
        "bulkExport": "annotate",
        "relay": "block"
      }
    }
  }
}
```

Defaults when keys are absent: all egress channels `off`, `strictCollections`
empty — i.e. **absent settings reproduce today's behavior exactly** (features
opt-in, per the settings-gated-feature rule).

### Conversion template (the ralph-loop unit of work)

Each of the 96 files in `imports/lib/schemas/SimpleSchemas/` converts in place
— **same path, same named exports for collections and BaseModel classes** — so
the 100+ import sites never change. Using `Observations.js` (854 lines today)
as the exemplar:

**Keep:** the `BaseModel.extend()` class, `new Mongo.Collection('Observations')`
→ replaced by `createFhirCollection('Observation', 'Observations')`, the
`_transform` assignment, the file-header comment convention.

**Delete:** the three `new SimpleSchema({...})` blocks (Dstu2/Stu3/R4 — the
bulk of every file), the commented-out `attachSchema` line, the
`simpl-schema` import, and the now-unused datatype-schema imports from
`meteor/clinical:hl7-resource-datatypes`.

**Exports:** collection + model class exports keep their names. The schema
object exports (`ObservationSchema`, `ObservationR4`, …) are **removed**, and
each loop iteration greps for external consumers of the removed names and
fixes them. (Survey found only ~2 such consumers repo-wide:
`imports/lib/validatedMethods/observations.validated.js`,
`imports/api/researchSubjects/methods.js`.)

Result: each file shrinks from ~850 lines to ~40.

### Satellite migrations (after the loop)

| Module | Disposition |
|--------|-------------|
| `imports/lib/schemas-extra/OAuthClients.js` | **The one live `attachSchema` today — validation must not lapse.** Hand-write a JSON Schema (no HL7 artifact exists); register it with `FhirValidator` as a custom schema; list the collection in `strictCollections` defaults for the settings files that enable OAuth |
| `imports/lib/schemas-extra/UdapCertificates.js`, `InboundRequests.js` | Same pattern, hand-written JSON Schemas (they're small, app-internal) |
| `imports/lib/BaseModel.js` | Remove `appendSchema()`/schema-context code (unused at runtime); keep the model/transform machinery untouched |
| `imports/lib/WebsocketsAccessControl.js` | Replace SimpleSchema check with AJV against a small inline JSON Schema |
| `imports/lib/validatedMethods/*.js` (5 files) | Legacy `aldeed` pattern; convert to plain Meteor methods with `check()` or AJV |
| `imports/lib/schemas/JsonToSimpleSchemaParser.js` | Delete (its purpose — generating SimpleSchemas from FHIR JSON — is obsolete by construction) |
| `package.json` | Remove `simpl-schema` |

### Out of scope

- The ~55 collections in `npmPackages/*` — they get egress validation for free
  (egress is central) and can adopt `createFhirCollection` opportunistically.
- The `clinical:hl7-resource-datatypes` Atmosphere package itself (the schema
  files' imports of it disappear, but retiring the package is a separate item).
- R4 (non-B) schema staging (`imports/lib/schemas/R4/JsonSchema/` has 3 files;
  R4B's 142 are the working set).
- UI form validation, client-side strict mode, FHIR profile (IG-level)
  validation — `ProfileDecorators` continues to handle IG decoration; this
  effort validates **base R4B conformance** only.

## Testing

1. **Unit (no Meteor):** `imports/lib/FhirValidator.test.mjs` run via
   `node --test` (precedent: `server/lib/CaslAccessControl.parity.test.mjs`,
   `npm run test:acl`). Fixtures: valid/invalid Patient, Observation with
   choice types (`valueQuantity` vs `valueString`), recursive
   Questionnaire.item, Bundle with mixed-validity entries, resource with
   Mongo `_id` (must not fail on it), unknown resourceType (must pass
   permissively). Add script `test:validator`.
2. **Integration (meteortesting:mocha, `npm test`):** ValidatedCollection
   strict/permissive modes; egress policy matrix per channel (off/warn/
   annotate/block); settings-absent default = today's behavior.
3. **Per-loop-iteration verification (ralph loop):** after each file
   conversion — server boot check, `grep -c "new SimpleSchema" <file>` = 0,
   named exports unchanged (import-and-assert script), the resource's
   existing e2e CRUD test still passes if one exists.
4. **Exit criteria:** `grep -rn "simpl-schema" imports/ server/ package.json`
   → zero hits; `npm test` green; nightwatch smoke suite green; bulk export
   produces valid NDJSON + error file under `annotate`.

## Risks

- 🎯 AJV compile cost on 142 recursive schemas — mitigated by lazy per-type
  compilation + cache; measure boot and first-request latency in Phase 1.
- 💥 A schema file in the 96 with non-template quirks (custom indexes, extra
  exports, helpers) — the loop prompt requires a pre-diff inventory of each
  file's exports before rewriting; anything non-template gets flagged, not
  force-fitted.
- 🐛 Draft-06→07 normalization missing an edge (e.g. `$ref` resolution against
  renamed `$id`) — covered by the unit fixture set; validator throws loudly at
  load, not silently.
- 🔒 OAuthClients validation lapsing mid-migration — its conversion is
  explicitly sequenced in the same phase that removes its SimpleSchema.
- 😭 Blocking egress breaking a live demo — defaults are `off`/`warn`;
  `block` is opt-in per channel per settings file.

**But remember:** validation is already off everywhere today. Every phase of
this design strictly adds capability; no phase can make conformance worse than
the status quo.
