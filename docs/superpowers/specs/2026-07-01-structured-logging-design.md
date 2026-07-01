# Structured Logging Upgrade — Design (Spec 1 of 2)

**Date:** 2026-07-01
**Status:** Approved design, pending implementation plan
**Companion:** `2026-07-01-hipaa-audit-trail-design.md` (Spec 2 — the compliance
audit trail; this spec provides the PHI-routing plumbing Spec 2 consumes)
**Implementer:** Opus 4.8 (fresh session — this doc must stand alone)

## Problem

Codebase survey (2026-07-01):

- **9,292 `console.*` statements** (imports/ 4,840, server/ 1,310,
  npmPackages/ 3,142). ~17% use the `[ModuleName]` bracket-prefix convention;
  the rest are unstructured. No `console.group` usage yet (desired).
- **A prior winston integration exists and failed at adoption**:
  `server/lib/Logger.js` configures winston@3.14.2 with levels wired to the
  `loggingThreshold` settings key (present in 14 settings files) — and **zero
  other files import it**. The engine was built; 9,292 call sites had no
  migration path. Bundler-hidden filenames were a second pain point.
- **~1,048 console statements interpolate patient-shaped data** (e.g.
  `imports/FhirClientProvider.jsx:392` logs a full parsed Patient Bundle) —
  a PHI exposure in browser devtools and any captured server stdout.
- No log gating conventions (near-zero `process.env.DEBUG` guards), no
  client→server error shipping, `ErrorBoundary` logs to console only.
- Goal state: structured logs, Splunk-integrable, PHI-aware, BaseEHR/HIPAA
  defensible, `console.group`-friendly.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **In-house `Logger` facade; no third-party logging API at call sites** | The winston attempt failed because the third-party API was the interface. The facade keeps console ergonomics; the backend is an implementation detail in one file |
| 2 | **No winston, no pino — zero-dependency backends** | Server prod backend is JSON-lines-to-stdout (~50 lines); winston adds nothing over that and is removed from `package.json`. pino's worker-thread transports are a known Meteor-bundle hazard |
| 3 | **JSON lines to stdout IS the Splunk integration** | 12-factor: Splunk UF/HEC, Datadog, CloudWatch all ingest container stdout. No SDK coupling. A direct HEC push stream can be added later inside the backend file (~30 lines, fetch-based) |
| 4 | **Bundler filename problem: solved by child loggers, not stack parsing** | `Logger.for('ModuleName')` formalizes the existing bracket-prefix convention. Dev mode may additionally capture call sites; production never stack-parses |
| 5 | **PHI never enters the operational stream** | `log.phi(...)` exists so marking PHI gives safety by default: redacted from operational output, routed to the audit pipeline (Spec 2). A field-level redaction list is the safety net for unmarked payloads |
| 6 | **Targeted migration, enforced forward** | Ralph loop converts the ~1,048 PHI-risky statements + server hot paths (`FhirEndpoints.js` alone has 312). The rest converts opportunistically; a post-edit hook + `/audit-phi-logs` command guard new code |
| 7 | **Client warn/error shipping, settings-gated, default OFF** | Batched relay of client warn/error/ErrorBoundary reports to the server stream, redacted client-side before transmission. Controlled by `Meteor.settings.public.logging.shipClientLogs` (absent → off) |
| 8 | **Honor the existing `loggingThreshold` settings key** | Already present in 14 settings files (`error|warn|info|verbose|debug|trace`); the facade's level filter reads it (public key — applies client and server) |

## Architecture

### Component 1: `Logger` facade — `imports/lib/Logger.js`

Isomorphic, zero-dependency. API surface (exact — consumers depend on it):

```js
import { Logger } from '/imports/lib/Logger';
const log = Logger.for('Observations');          // child logger, module tag

log.error(msg, data?)   log.warn(msg, data?)   log.info(msg, data?)
log.verbose(msg, data?) log.debug(msg, data?)  log.trace(msg, data?)

log.group(label)  log.groupEnd()                // maps to console.group in
                                                // browser; indentation/span
                                                // fields in JSON backend
log.table(rows)                                 // console.table in browser;
                                                // structured array in JSON
log.phi(msg, resourceOrData, context?)          // see PHI semantics below
```

Every emission produces a **LogRecord**:
`{ ts, level, module, msg, data?, group?, source: 'server'|'client', phi: false }`
— the facade builds the record; the active backend renders it.

Level filtering: `loggingThreshold` from `Meteor.settings.public.loggingThreshold`
(default `'info'`). Below-threshold records are dropped before backend cost.

### Component 2: Backends — `imports/lib/loggerBackends/`

One file each, selected once at startup:

- **`consoleBackend.js`** (client always; server in dev): renders via native
  `console.*` — real `console.group` nesting, `console.table`, browser
  formatting. Keeps the devtools experience the team likes.
- **`jsonBackend.js`** (server in production, or when
  `settings.private.logging.format === 'json'`): one JSON line per record to
  `process.stdout.write`. Group state becomes a `group: ['outer','inner']`
  path field so Splunk queries can reconstruct nesting.
- Future (out of scope, interface-ready): `splunkHecBackend.js` — fetch-based
  HEC push; a backend is any `{ write(record) }` object.

### Component 3: PHI semantics — `log.phi()` and the redaction net

`log.phi(msg, resourceOrData, context?)`:

1. **Operational stream:** emits the record with `phi: true` and
   `data` replaced by `{ redacted: true, resourceType, id }` — enough to
   correlate, never enough to expose. In dev
   (`Meteor.isDevelopment`), the console backend shows the real payload
   (devs need it; dev machines are not the compliance boundary).
2. **Audit routing (server):** forwards
   `{ msg, resourceType, resourceId, context }` to the audit pipeline —
   `HipaaLogger.logEvent()` when the hipaa-compliance package is loaded
   (lazy `Package['@node-on-fhir/hipaa-compliance']` lookup per the
   package-registry rule; absent package → operational log only, warn once).
   Spec 2 owns everything downstream of `logEvent`.

**Redaction net** (`imports/lib/loggerRedact.js`): every record's `data` is
passed through a field-path redactor before the JSON backend writes it.
Redacted paths (FHIR PHI surface): `name`, `given`, `family`, `birthDate`,
`address`, `telecom`, `photo`, `identifier[].value`, `contact`, plus any
object whose `resourceType` is in the patient compartment → collapsed to
`{ redacted: true, resourceType, id }`. This is the safety net for PHI that
reaches `log.info(...)` unmarked; `log.phi()` is the intended path.

### Component 4: Client log shipping — settings-gated, default OFF

- `imports/lib/loggerBackends/clientRelay.js`: when
  `get(Meteor, 'settings.public.logging.shipClientLogs', false) === true`,
  client `warn`/`error` records (post-redaction — the redaction net runs
  client-side before transmission) are batched (5s window / 20 records max)
  and sent via `Meteor.call('logging.clientBatch', records)`.
- Server method `logging.clientBatch` (`server/lib/loggingMethods.js`):
  re-runs redaction server-side (defense in depth), stamps
  `source: 'client'`, `userId: this.userId`, forwards to the server backend.
  Rate-limited per connection (Meteor's DDPRateLimiter, 10 calls/10s).
- `ErrorBoundary.jsx` (`componentDidCatch`) reports through `log.error` so
  boundary crashes ride the same relay when enabled.

### Settings schema

```json
"public": {
  "loggingThreshold": "info",
  "logging": { "shipClientLogs": false }
},
"private": {
  "logging": { "format": "json" }
}
```
Absent keys reproduce current behavior (console output, no shipping).
`loggingThreshold` keeps its existing key and semantics.

### Migration & enforcement (targeted + enforced)

1. **Ralph loop over PHI-risky call sites** (~1,048, list generated by the
   audit command below): each becomes `log.phi(...)` or, where the payload is
   genuinely non-PHI, a structured `log.debug(...)`. One file per iteration.
2. **Server hot paths converted wholesale**: `server/FhirEndpoints.js` (312
   statements), `server/RestHelpers.js`, `server/BulkData.js` — these feed
   production stdout and must be structured for Splunk from day one.
3. **`/audit-phi-logs` command** (`.claude/commands/audit-phi-logs.md`):
   scans for console statements interpolating patient-shaped identifiers
   (same grep heuristics the survey used); emits the worklist. Run-once for
   cleanup, then periodically.
4. **Post-edit hook** (`.claude/hooks/post-tool-use-phi-logging.md`): flags
   raw `console.*` with patient-shaped payloads in edited files and suggests
   `Logger`. Raw console is still *permitted* for dev-only UI chatter — the
   hook warns, it does not block.
5. `server/lib/Logger.js` (the dead winston config) is deleted;
   `winston` leaves `package.json`. The `request-for-corrections` and
   `accounts` local loggers migrate opportunistically (out of scope).

### Out of scope

- Spec 2 (audit trail pipeline, AuditEvents consolidation, tamper evidence).
- Splunk HEC push backend (interface-ready; stdout suffices for ingestion).
- Full 9,292-statement conversion; npmPackages/ call sites beyond the
  PHI-risky list.
- OpenTelemetry traces/metrics (revisit if distributed tracing becomes real).

## Testing

1. **Unit (`node --test`, precedent `npm run test:validator`):**
   `imports/lib/Logger.test.mjs` — level filtering vs threshold; child-logger
   module tags; group path construction; redaction net on nested FHIR
   payloads (Patient with name/birthDate → collapsed); `log.phi` operational
   record contains no payload fields; JSON backend emits parseable lines.
   (Logger core must therefore be import-safe without Meteor — settings are
   injected via an `init(config)` seam, mirroring FhirValidator's pattern.)
2. **Integration (meteortesting:mocha):** `logging.clientBatch` respects the
   `shipClientLogs` gate (off → method rejects), rate limit, server-side
   re-redaction.
3. **Manual:** boot with `format: "json"`; verify one-line-per-record stdout;
   pipe a sample into `jq` to confirm Splunk-shape.

## Risks

- 🎯 Redaction-net false negatives (PHI in unanticipated shapes) — mitigated
  by `log.phi` being the primary path, the net being a backstop, and the
  audit command re-run periodically.
- 🐛 Console-group semantics differ between browser and JSON backends —
  group path field is the contract; tests pin it.
- 💥 Client relay becoming a PHI channel — dual redaction (client before
  send, server on receipt), default-off gate, warn/error only.
- 😭 9,292-site inconsistency lingering for years — accepted deliberately:
  the enforced boundary is *new code + PHI-risky + production hot paths*,
  which is what certification actually inspects.

**But remember:** today PHI flows to devtools and stdout unredacted and
winston ships dead weight in the bundle. Every phase strictly improves on
that floor.
