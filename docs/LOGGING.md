# Logging

Honeycomb uses a structured logging facade (`imports/lib/Logger.js`) that routes calls to swappable backends — console (dev) or JSON-lines-to-stdout (production / Splunk). The facade replaced a prior winston integration that was built but never adopted at call sites; call sites now bind to a stable in-house API surface, not to a third-party package.

**Background and rationale:** `docs/superpowers/specs/2026-07-01-structured-logging-design.md` (design decisions, migration plan, risk analysis) and `docs/superpowers/specs/2026-07-01-hipaa-audit-trail-design.md` (audit trail pipeline downstream of `log.phi`).

---

## 1. Quick Start

### App code (server files, `imports/`)

```js
import LoggerModule from '/imports/lib/Logger.js';
const { Logger } = LoggerModule;
const log = Logger.for('PatientDetail');

log.info('record loaded', { id: patient._id, resourceType: 'Patient' });
log.phi('accessing patient record', patient, { action: 'read' });
```

### NPM workflow package code (`npmPackages/`, `extensions/`)

Workflow packages cannot use app-absolute imports. Use the `Meteor.Logger` global, which the app registers at startup before any workflow module loads:

```js
const log = (Meteor.Logger ? Meteor.Logger.for('my-package') : console);

log.info('workflow initialized');
log.warn('subscription retry', { attempt: n });
```

The `console` fallback is a circuit-breaker for test environments where `Meteor.Logger` is not wired up. `Logger.for()` returns an object whose method names are a superset of `console` (`log` aliases `info`), so the fallback is drop-in.

---

## 2. API

### `Logger.for(moduleName)` → child logger

Creates a child logger whose records carry `module: moduleName`. `moduleName` is typically the file's component or service name, matching the existing `[ModuleName]` bracket-prefix convention. Pass it once at module scope; re-use the returned object everywhere in the file.

| Method | Signature | Notes |
|--------|-----------|-------|
| `error` | `(msg, data?)` | |
| `warn` | `(msg, data?)` | |
| `info` | `(msg, data?)` | |
| `log` | `(msg, data?)` | Alias for `info`; console drop-in |
| `verbose` | `(msg, data?)` | |
| `debug` | `(msg, data?)` | |
| `trace` | `(msg, data?)` | |
| `group` | `(label)` | Opens a named group; emits at `info` level |
| `groupEnd` | `()` | Closes the most recently opened group |
| `table` | `(rows)` | Structured array; `console.table` in console mode |
| `phi` | `(msg, resourceOrData, context?)` | PHI-safe audit path — see §4 |

### LogRecord shape

Every backend receives a LogRecord object:

```js
{
  ts:     '2026-07-01T12:34:56.789Z',  // ISO timestamp
  level:  'info',                       // error|warn|info|verbose|debug|trace
  module: 'PatientDetail',              // from Logger.for(name)
  msg:    'record loaded',              // static string — never interpolate PHI here
  data:   { id: '...' },               // optional; redacted before write (see §4)
  group:  ['outer', 'inner'],           // group path stack at emit time
  source: 'server',                     // 'server' | 'client'
  phi:    false                         // true only for log.phi() records
}
```

### The `msg` + structured-`data` convention

Put variable data in the second argument (`data`), not in the message string. The redaction net only inspects `data` — PHI interpolated into `msg` is never redacted and flows verbatim to every backend.

```js
// ❌ PHI bypasses the redaction net entirely
log.info('loaded ' + patient.name[0].family);

// ✅ message is static; data is inspected by the redaction net
log.info('patient loaded', { id: patient._id });

// ❌ JSON.stringify produces a string; the redaction net passes strings through untouched
log.debug('patient', JSON.stringify(patient));

// ✅ pass the raw object so the net can walk it
log.debug('patient state', patient);
```

---

## 3. Log Levels

Levels map to numeric priorities (`error: 0` through `trace: 5`). Records below the active threshold are dropped before any backend cost.

| Level | Priority | When to use |
|-------|----------|-------------|
| `error` | 0 | Unrecoverable errors; the operation failed |
| `warn` | 1 | Recoverable problems; degraded behaviour |
| `info` | 2 | Boot telemetry and operational milestones. **Startup output stays visible by design** at the default `info` threshold. |
| `verbose` | 3 | Coarse operational flow between `info` and `debug` |
| `debug` | 4 | Per-request / per-keystroke chatter: publication queries, auth decisions, form field changes |
| `trace` | 5 | Payload dumps — full FHIR resources, wire bytes. Full-body resource logging belongs here, not at `debug`. |

The retired `process.env.DEBUG` / `process.env.TRACE` convention is replaced by threshold-gated levels. Replace `if (process.env.DEBUG)` guards with `debug`-level calls, and `if (process.env.TRACE)` guards with `trace`-level calls. The threshold setting silences them in production.

---

## 4. PHI Logging

### `log.phi(msg, resource, context?)`

The only safe way to log a call that touches Protected Health Information.

```js
log.phi('returning patient bundle', patient, { action: 'read', requestId: ctx.id });
```

**What the operational stream sees:** a stub — `{ redacted: true, resourceType: 'Patient', id: '...' }`. The original resource is never forwarded to any backend.

**Audit routing (server):** the `context` object and resource metadata are forwarded to `HipaaLogger.logEvent()` via a lazy `Package['@node-on-fhir/hipaa-compliance']` lookup (the package-registry convention, see `.claude/rules/fhir/package-registry.md`). When that package is not loaded, the call succeeds but a one-time warning appears and audit routing is inactive. Everything downstream of `logEvent` is Spec 2 (`docs/superpowers/specs/2026-07-01-hipaa-audit-trail-design.md`).

**Client-side `log.phi()`:** audit-inert by design. The phiSink returns immediately on the client. Client code that touches PHI should call a Meteor method that performs and logs the access server-side.

### Redaction net (backstop)

Every `data` argument that reaches a non-phi emit path passes through `redactPhi()` before the backend writes it. The net:

- **Redacts by field name** — `name`, `given`, `family`, `birthDate`, `address`, `telecom`, `photo`, `contact`, `maritalStatus`, `communication`, `identifier` → replaced with `{ redacted: true }`
- **Collapses patient-compartment resources** — any object whose `resourceType` is `Patient`, `RelatedPerson`, `Person`, or `Practitioner` → `{ redacted: true, resourceType, id }`
- **Preserves `Error` objects** as `{ message, stack }`, redacting any enumerable properties that might carry PHI
- **Converts `Date` instances** to ISO strings
- **Handles circular references** — marks with `{ redacted: true, circular: true }`

The redaction net is a safety backstop for payloads that reach `log.info/debug/...` unmarked. Use `log.phi()` as the primary path for data you know contains PHI.

### Two bypasses to avoid

**Bypass A — `JSON.stringify` as the data argument.** Produces a string; the net only walks plain objects.

```js
log.debug('patient', JSON.stringify(patient));  // ❌ net passes strings through
log.debug('patient', patient);                  // ✅
```

**Bypass B — PHI interpolated into the message string.** The `msg` field is never redacted.

```js
log.info(`patient name: ${patient.name[0].family}`);  // ❌ bypasses net entirely
log.info('patient loaded', { id: patient._id });       // ✅
```

Both bypasses are detected by the `/audit-phi-logs` command.

---

## 5. Settings

Full schema with defaults shown:

```json
{
  "public": {
    "loggingThreshold": "info",
    "logging": {
      "shipClientLogs": false
    }
  },
  "private": {
    "logging": {
      "format": "json",
      "captureConsole": true
    }
  }
}
```

### `public.loggingThreshold`

**Type:** `"error" | "warn" | "info" | "verbose" | "debug" | "trace"`  
**Default:** `"info"`

Records below this level are dropped before any backend cost. Applies on both client and server. This key was already present in 14 settings files before the facade was introduced; existing values are honoured.

**Environment override:** `LOGGING_THRESHOLD=debug meteor run ...`  
**Precedence:** `LOGGING_THRESHOLD` env var > `public.loggingThreshold` settings > `"info"` hard default.

### `public.logging.shipClientLogs`

**Type:** `boolean`  
**Default:** `false`

When `true`, client-side `warn` and `error` records are batched client-side (after redaction) and relayed to the server via `logging.clientBatch`. Batching: 5-second window or 20 records, whichever comes first. The server re-runs redaction as defense in depth, stamps `source: 'client'` and `userId`, and writes through the server backend. Rate-limited to 10 DDP calls per 10 seconds per connection. Leave `false` unless you need client errors in the server log stream.

### `private.logging.format`

**Type:** `"json" | "console"`  
**Default:** `"json"` in production (`Meteor.isProduction`); `"console"` in development.

- `"console"` — renders via native `console.*`; real `console.group` nesting in browser devtools; the non-Splunk dev experience.
- `"json"` — one JSON LogRecord per `process.stdout` line. **This is the Splunk integration.** Splunk Universal Forwarder and HEC both ingest container stdout; no SDK coupling required.

### `private.logging.captureConsole`

**Type:** `boolean`  
**Default:** `true` (when `format` is `"json"`)

When `true` (server only, requires `format: "json"`), installs a capture adapter on `console` that routes all `console.*` calls through the Logger facade as structured LogRecords tagged `module: 'console'`. Third-party packages and legacy `console.log` statements land in the JSON stream rather than bypassing it.

The `module: 'console'` tag in Splunk is a burn-down metric — decreasing count over time measures migration progress away from raw console calls.

**Patched methods and their JSON-mode behaviour:**

| `console` method | JSON-mode behaviour |
|---|---|
| `log` `info` `warn` `error` `debug` `trace` `dir` | Routed to the matching Logger level as a structured record. |
| `group` / `groupEnd` | Open / close a Logger group; depth-tracked so spurious `groupEnd` calls are no-ops. |
| `table` | Forwarded to `log.table`. |
| `time(label)` | Records `Date.now()` internally; emits nothing. |
| `timeEnd(label)` | Pops the start time and emits a `debug` record `{ ms: <elapsed> }`. If no matching `time` was called, emits a `debug` record noting the missing start. |
| `timeLog(label, ...rest)` | Emits elapsed ms without popping; extra args appear as `data.data`. |
| `count(label)` | Increments an internal counter and emits a `debug` record `{ count: n }`. |
| `countReset(label)` | Resets the counter to zero; emits nothing. |
| `assert(condition, ...rest)` | When `condition` is falsy, emits an `error` record with `"Assertion failed"` prepended to the message; truthy conditions produce no record. |

All timer and counter state is cleared on `uninstall()`.

**Escape hatch:** `console.__original.log(...)` calls the pre-capture original for the rare situations where you must bypass the capture adapter (test setup, bootstrap code that runs before Logger is initialized).

Set to `false` only if you are debugging the capture adapter itself.

---

## 6. Rendering by Mode

### Console mode (dev, or `private.logging.format: "console"`)

Output goes through native `console.*` with bracket-prefixed module name:

```
[PatientDetail] record loaded { id: 'abc123', resourceType: 'Patient' }
```

Group nesting uses real `console.group` / `console.groupEnd`, giving collapsible sections in browser devtools and indentation in Node terminals.

Level → native console method mapping:

| Logger level | `console` method |
|---|---|
| `error` | `console.error` |
| `warn` | `console.warn` |
| `info`, `verbose` | `console.log` |
| `debug`, `trace` | `console.debug` |

### JSON mode (production, or `private.logging.format: "json"`)

Each record is one line to `process.stdout`:

```json
{"ts":"2026-07-01T12:34:56.789Z","level":"info","module":"PatientDetail","msg":"record loaded","data":{"id":"abc123","resourceType":"Patient"},"group":[],"source":"server","phi":false}
```

Group nesting is represented as the `group` array path field (e.g. `["subscriptions","patient"]`) so Splunk queries can reconstruct hierarchy. GroupEnd sentinel records (`msg: "◂"`) are suppressed; group-open records (`msg` starts with `▸`) appear in the stream at `info` level.

### stdout / stderr contract

- **stdout:** all LogRecords in JSON mode, at every level.
- **stderr:** JSON serialization failures only (rare; written by the backend itself, not by application code).

### Splunk ingest notes

- Splunk Universal Forwarder or HEC ingests `process.stdout` as the sourcetype. Configure `sourcetype = _json` or `INDEXED_EXTRACTIONS = json` in `props.conf`.
- Meteor's own `logging` package emits its own JSON shape on startup. This is distinct from application LogRecords; filter by presence of the `module` field to separate them.
- Do not set `METEOR_PROFILE=1` in production; it generates very high-volume stdout that dilutes the log stream.

---

## 7. Enforcement

### `/audit-phi-logs` command

Scans `imports/`, `server/`, `npmPackages/` for `console.*` statements likely to interpolate PHI. Classifies hits as `phi-payload` / `identifier-only` / `false-positive` and writes `docs/superpowers/plans/phi-log-worklist.txt`. Run before a conversion sprint, after a large merge, or as part of a HIPAA audit trail review.

See `.claude/commands/audit-phi-logs.md` for full heuristics, bypass detection patterns, and output format.

### Post-edit hook

`.claude/hooks/post-tool-use-phi-logging.md` runs after every file edit and flags raw `console.*` statements with patient-shaped payloads in the edited file, suggesting migration to `Meteor.Logger`. The hook warns; it does not block.

### `// phi-audit: ok` annotation

Add this inline comment to exclude a line permanently from `/audit-phi-logs` scans and the post-edit hook:

```js
console.log('[PatientSidebar] No patient in session'); // phi-audit: ok
console.log('[Debug] patientId:', patientId);          // phi-audit: ok
```

Use it for confirmed non-PHI statements: static strings, id-only payloads, and dev-only debugging you have verified is safe.

---

## 7b. MongoDB Backend (HIPAA-tier log storage)

The MongoDB backend writes LogRecords into a `ServerLogs` collection alongside stdout/Splunk, giving **desktop-lattice Electron deployments** queryable, retained, access-controlled logs entirely inside the compliance boundary (embedded MongoDB, no Splunk or network egress required). Server deployments get it as a queryable convenience store for operational debugging.

### Why MongoDB and not just stdout?

Electron / desktop-lattice ships with an embedded MongoDB and no log aggregation service. The stdout/JSON stream is invisible to end users and not retained after process exit. MongoDB gives the on-device app a structured, queryable audit-adjacent store with automatic TTL expiry. Server deployments benefit too — `db.ServerLogs.find({level:'error'})` is faster than grepping log files.

**Audit trail vs operational logs**: this backend stores *operational* logs — verbose, short-lived, threshold-gated. It is **not** a HIPAA audit record. `log.phi()` → `HipaaLogger` owns the 6-year-retention compliance trail. `ServerLogs` has a default 30-day TTL and should never receive un-redacted PHI (the Logger's redaction net applies before any backend write).

### Settings

Backend keys live under `private.logging.mongo`; the runtime-override gate lives directly under `private.logging` because it governs the runtime method for *all* thresholds, not just Mongo's (all private — never readable by the client):

```json
{
  "private": {
    "logging": {
      "allowRuntimeThresholdOverride": false,
      "mongo": {
        "enabled": true,
        "collection": "ServerLogs",
        "retentionDays": 30,
        "threshold": "info",
        "mongoUrl": null
      }
    }
  }
}
```

| Key | Default | Notes |
|-----|---------|-------|
| `enabled` | `false` | Must be explicitly `true` to activate; opt-in. |
| `collection` | `"ServerLogs"` | MongoDB collection name. |
| `retentionDays` | `30` | TTL index on the `ts` field; Mongo expires docs automatically. Operational logs only — HIPAA audit retention (6 yr) is owned by `HipaaLogger`, not this collection. |
| `threshold` | `"info"` | Per-backend threshold; can be lower than the global threshold to capture more detail in Mongo without changing stdout verbosity. |
| `mongoUrl` | _(absent)_ | Optional: connect to a dedicated MongoDB instance. When absent, uses the app's default Mongo connection (embedded for Electron, Atlas/replica-set for production). |
| `allowRuntimeThresholdOverride` | `false` | Path: `private.logging.allowRuntimeThresholdOverride` (NOT under `.mongo`). Unlocks the `logging.setRuntimeThreshold` Meteor method for prod debugging sessions. Re-disable after the session. |

**Environment override**: `LOGGING_MONGO_THRESHOLD=debug` overrides `private.logging.mongo.threshold` at process start (same precedence pattern as `LOGGING_THRESHOLD`).

### Indexes created on startup

| Index | Purpose |
|-------|---------|
| `{ ts: 1 }` with `expireAfterSeconds` | TTL — Mongo deletes docs after `retentionDays * 86400` seconds |
| `{ module: 1, level: 1, ts: -1 }` | Query index for log viewer and admin queries |

### Sample queries (mongosh or Meteor shell)

```js
// Count all logs
db.ServerLogs.countDocuments()

// Recent errors
db.ServerLogs.find({ level: 'error' }).sort({ ts: -1 }).limit(20)

// Logs from a specific module in the last hour
db.ServerLogs.find({
  module: 'FhirEndpoints',
  ts: { $gte: new Date(Date.now() - 3600000) }
}).sort({ ts: -1 })

// List indexes (verify TTL is present)
db.ServerLogs.getIndexes()
```

### Prod debugging session runbook

When you need verbose logs from a live system for a time-boxed investigation:

1. Set `"allowRuntimeThresholdOverride": true` in your server settings and deploy (or set it in the running Meteor settings object — restart not required if already `true`).
2. Open a Meteor shell or call from a trusted client:
   ```js
   await Meteor.callAsync('logging.setRuntimeThreshold', { global: 'debug', mongo: 'debug' });
   ```
3. Reproduce the issue; query `db.ServerLogs.find({...})` as needed.
4. **Reset immediately after the session**:
   ```js
   await Meteor.callAsync('logging.setRuntimeThreshold', { global: 'info', mongo: 'info' });
   ```
5. Re-disable `allowRuntimeThresholdOverride` and re-deploy.

**Important:** Redaction always applies regardless of threshold. Lowering the threshold increases *verbosity* (more records, more `data` fields), but the redaction net always strips PHI field names and collapses patient-compartment resources before any backend write. The override changes what you see — it never changes what is safe to log.

The override itself is logged at `warn` level (`module: 'loggingMethods'`) so every prod session leaves a trace in the log stream.

---

## 8. History

A winston@3.14.2 integration (`server/lib/Logger.js`) was built in 2024 but never adopted — 9,292 `console.*` call sites had no ergonomic migration path, and bundler-hidden filenames made module attribution difficult. The facade was introduced in 2026-07 to keep console ergonomics (`child.log`, `log.group`, `log.table`) while making the backend swappable at a single file. Call sites bind to the facade's stable API surface, never to a third-party package. The JSON-lines-to-stdout backend (~12 lines) is the Splunk integration; a future HEC push backend can be added without touching call sites. See `docs/superpowers/specs/2026-07-01-structured-logging-design.md` for design decisions and `docs/superpowers/specs/2026-07-01-hipaa-audit-trail-design.md` for the audit trail pipeline.
