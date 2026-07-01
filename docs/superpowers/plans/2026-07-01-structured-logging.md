# Structured Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. Task 6 is a ralph loop (see `.claude/commands/ralph-loop.md`).

**Goal:** Zero-dependency structured `Logger` facade (console ergonomics, JSON-to-stdout for Splunk, PHI-aware) adopted on PHI-risky call sites and server hot paths; winston removed.

**Architecture:** Facade (`imports/lib/Logger.js`, plain CJS) builds LogRecords; swappable backends render them (console in dev/client, JSON lines on prod server). `log.phi()` redacts operationally and routes to the audit pipeline. Registered as `Meteor.Logger` at startup for `npmPackages/*`/`extensions/*` access. Targeted migration enforced by a `/audit-phi-logs` command + post-edit hook.

**Tech Stack:** Meteor v3, no new npm deps (winston *removed*), `node --test` + `meteortesting:mocha`.

**Spec:** `docs/superpowers/specs/2026-07-01-structured-logging-design.md` — read first. Execute this plan BEFORE the audit-trail plan (`2026-07-01-hipaa-audit-trail.md`); `log.phi()` is its plumbing.

## Global Constraints

- No third-party logging libs at call sites, ever. Facade only.
- Absent settings keys reproduce today's behavior: console output, no client shipping, threshold `info`.
- `Meteor.Logger` must be registered on BOTH client and server before workflow packages load.
- `Logger.for()` return object must be console-fallback compatible (`log` aliases `info`; `warn/error/debug/group/groupEnd/table` present).
- Meteor v3 async, `function(){}` for methods, lodash `get()`, `[ModuleName]`-style structure comes from the `module` field (not hand-written prefixes).
- PHI never in the operational stream: `log.phi()` payloads and redaction-net hits are collapsed to `{ redacted: true, resourceType, id }` outside dev.
- Commit after every task; Claude Code co-author trailer.

---

### Task 1: Logger core + redaction net

**Files:**
- Create: `imports/lib/Logger.js` (plain CJS — importable by `node --test`, like `imports/lib/FhirValidator.js`)
- Create: `imports/lib/loggerRedact.js` (plain CJS)
- Test: `imports/lib/Logger.test.mjs`
- Modify: `package.json` (script `"test:logger": "node --test imports/lib/Logger.test.mjs",`)

**Interfaces (everything later tasks rely on):**
- `Logger.for(moduleName) → { error, warn, info, log, verbose, debug, trace, group, groupEnd, table, phi }` — `log` aliases `info`; all `(msg, data?)`; `phi(msg, resourceOrData, context?)`.
- `Logger.init(config)` — `{ threshold, backend: {write(record)}, isDevelopment, source: 'server'|'client', phiSink?: fn }` (Task 2 calls this; tests inject fakes).
- LogRecord: `{ ts: ISOstring, level, module, msg, data?, group: string[], source, phi: boolean }`.
- `redactPhi(value) → value` from `loggerRedact.js` — deep-copies and collapses PHI (Task 3 reuses it client-side).
- CJS exports: `module.exports = { Logger, init: Logger.init }` / `module.exports = { redactPhi }`.

- [ ] **Step 1: Write the failing tests**

```js
// imports/lib/Logger.test.mjs   — run: npm run test:logger
import test from 'node:test';
import assert from 'node:assert/strict';
import LoggerModule from './Logger.js';
import RedactModule from './loggerRedact.js';
const { Logger } = LoggerModule;
const { redactPhi } = RedactModule;

function fakeBackend() { const records = []; return { records, write: function(r){ records.push(r); } }; }

test('threshold filters below-level records', function() {
  const backend = fakeBackend();
  Logger.init({ threshold: 'warn', backend, isDevelopment: false, source: 'server' });
  const log = Logger.for('TestModule');
  log.debug('hidden'); log.warn('shown');
  assert.equal(backend.records.length, 1);
  assert.equal(backend.records[0].level, 'warn');
  assert.equal(backend.records[0].module, 'TestModule');
});

test('log aliases info; record shape is complete', function() {
  const backend = fakeBackend();
  Logger.init({ threshold: 'trace', backend, isDevelopment: false, source: 'client' });
  const log = Logger.for('M');
  log.log('hello', { a: 1 });
  const r = backend.records[0];
  assert.equal(r.level, 'info');
  assert.equal(r.msg, 'hello');
  assert.deepEqual(r.data, { a: 1 });
  assert.equal(r.source, 'client');
  assert.equal(r.phi, false);
  assert.ok(r.ts.includes('T'));
});

test('group/groupEnd builds group path', function() {
  const backend = fakeBackend();
  Logger.init({ threshold: 'trace', backend, isDevelopment: false, source: 'server' });
  const log = Logger.for('M');
  log.group('outer'); log.group('inner'); log.info('x'); log.groupEnd(); log.info('y'); log.groupEnd();
  assert.deepEqual(backend.records.find(r => r.msg === 'x').group, ['outer', 'inner']);
  assert.deepEqual(backend.records.find(r => r.msg === 'y').group, ['outer']);
});

test('redactPhi collapses patient-compartment resources and PHI fields', function() {
  const patient = { resourceType: 'Patient', id: 'p1', name: [{ family: 'Smith' }], birthDate: '1990-01-01' };
  assert.deepEqual(redactPhi(patient), { redacted: true, resourceType: 'Patient', id: 'p1' });
  const mixed = { count: 2, name: [{ family: 'Smith' }], status: 'final' };
  const redacted = redactPhi(mixed);
  assert.equal(redacted.count, 2);
  assert.equal(redacted.status, 'final');
  assert.deepEqual(redacted.name, { redacted: true });
});

test('phi() emits redacted operational record and calls phiSink', function() {
  const backend = fakeBackend();
  const sunk = [];
  Logger.init({ threshold: 'trace', backend, isDevelopment: false, source: 'server',
    phiSink: function(evt){ sunk.push(evt); } });
  const log = Logger.for('Chart');
  log.phi('viewed patient', { resourceType: 'Patient', id: 'p1', name: [{ family: 'S' }] }, { action: 'read' });
  const r = backend.records[0];
  assert.equal(r.phi, true);
  assert.deepEqual(r.data, { redacted: true, resourceType: 'Patient', id: 'p1' });
  assert.equal(JSON.stringify(r).includes('"S"'), false);
  assert.equal(sunk[0].resourceType, 'Patient');
  assert.equal(sunk[0].context.action, 'read');
});

test('phi() with no phiSink does not throw (warns once)', function() {
  Logger.init({ threshold: 'trace', backend: fakeBackend(), isDevelopment: false, source: 'server' });
  Logger.for('M').phi('x', { resourceType: 'Patient', id: 'p1' });
});
```

- [ ] **Step 2: Run to verify failure** — `npm run test:logger` → FAIL, `Cannot find module './Logger.js'`.

- [ ] **Step 3: Write `loggerRedact.js`**

```js
// imports/lib/loggerRedact.js
// PHI redaction net for LogRecords. Plain CJS, no Meteor imports.
const PHI_FIELDS = ['name', 'given', 'family', 'birthDate', 'address', 'telecom', 'photo', 'contact', 'maritalStatus', 'communication'];
const PATIENT_COMPARTMENT = ['Patient', 'RelatedPerson', 'Person', 'Practitioner'];

function redactPhi(value) {
  if (value === null || typeof value !== 'object') { return value; }
  if (PATIENT_COMPARTMENT.includes(value.resourceType)) {
    return { redacted: true, resourceType: value.resourceType, id: value.id };
  }
  if (Array.isArray(value)) { return value.map(redactPhi); }
  const out = {};
  Object.keys(value).forEach(function(key) {
    if (PHI_FIELDS.includes(key)) {
      out[key] = { redacted: true };
    } else if (key === 'identifier') {
      out[key] = { redacted: true };
    } else {
      out[key] = redactPhi(value[key]);
    }
  });
  return out;
}

module.exports = { redactPhi };
```

- [ ] **Step 4: Write `Logger.js`**

```js
// imports/lib/Logger.js
// Structured logging facade. Plain CJS, zero deps, no Meteor imports --
// wired to Meteor via init() at startup (see loggingSetup.js) and testable
// with plain `node --test`. Registered as Meteor.Logger for workflow packages.
const { redactPhi } = require('./loggerRedact.js');

const LEVELS = { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, trace: 5 };

let config = { threshold: 'info', backend: { write: function() {} }, isDevelopment: false, source: 'server', phiSink: null };
let groupPath = [];
let warnedNoSink = false;

function init(options) { config = Object.assign({}, config, options); }

function emit(level, moduleName, msg, data, phi) {
  if (LEVELS[level] > LEVELS[config.threshold]) { return; }
  const record = { ts: new Date().toISOString(), level: level, module: moduleName, msg: msg, group: groupPath.slice(), source: config.source, phi: !!phi };
  if (data !== undefined) { record.data = phi ? data : redactPhi(data); }
  config.backend.write(record);
}

function forModule(moduleName) {
  const child = {};
  ['error', 'warn', 'info', 'verbose', 'debug', 'trace'].forEach(function(level) {
    child[level] = function(msg, data) { emit(level, moduleName, msg, data, false); };
  });
  child.log = child.info;                       // console-fallback compatible
  child.group = function(label) { emit('info', moduleName, '▸ ' + label, undefined, false); groupPath.push(label); };
  child.groupEnd = function() { groupPath.pop(); };
  child.table = function(rows) { emit('info', moduleName, '(table)', rows, false); };
  child.phi = function(msg, resourceOrData, context) {
    const stub = { redacted: true, resourceType: resourceOrData && resourceOrData.resourceType, id: resourceOrData && resourceOrData.id };
    // Dev consoles may show the real payload; the backend decides via record.phi + its own isDevelopment.
    emit('info', moduleName, msg, stub, true);
    if (typeof config.phiSink === 'function') {
      try {
        config.phiSink({ msg: msg, resourceType: stub.resourceType, resourceId: stub.id, context: context || {}, module: moduleName });
      } catch (error) {
        console.error('[Logger] phiSink error:', error && error.message);
      }
    } else if (!warnedNoSink) {
      warnedNoSink = true;
      console.warn('[Logger] log.phi called but no phiSink configured -- audit routing inactive');
    }
  };
  return child;
}

const Logger = { for: forModule, init: init };
module.exports = { Logger, init: init };
```
Note: the console backend (Task 2) receives `record.phi === true` with the stub only; showing real payloads in dev happens by the *caller-visible* rule that dev backends may look up nothing — the stub is what's stored. (Deliberate simplification vs the spec's dev-visibility nicety: the record never carries raw PHI anywhere. Document in Task 2's dev backend that raw payload visibility in dev is achieved by ALSO calling `console.debug` directly while developing, not by the facade.)

- [ ] **Step 5: Run tests** — `npm run test:logger` → PASS (7 tests).
- [ ] **Step 6: Commit** — `git add imports/lib/Logger.js imports/lib/loggerRedact.js imports/lib/Logger.test.mjs package.json && git commit -m "feat(logging): Logger facade core + PHI redaction net"`

---

### Task 2: Backends + startup wiring + `Meteor.Logger` registration

**Files:**
- Create: `imports/lib/loggerBackends/consoleBackend.js`, `imports/lib/loggerBackends/jsonBackend.js`
- Create: `imports/startup/both/loggingSetup.js`
- Modify: the client and server startup entry points to import it FIRST — check `client/main.js`(or `imports/startup/client/index.js`) and `server/main.js` top-of-file import order; the loggingSetup import must precede workflow loader imports so `Meteor.Logger` exists when packages load.

**Interfaces:**
- Consumes: `Logger.init` (Task 1).
- Produces: `Meteor.Logger` set on client AND server. Backend selection: client → console; server dev → console; server prod or `settings.private.logging.format === 'json'` → JSON lines. phiSink wired lazily to hipaa-compliance if present.

- [ ] **Step 1: consoleBackend**

```js
// imports/lib/loggerBackends/consoleBackend.js
// Dev/client backend: renders LogRecords via native console for real
// browser group nesting and formatting. Records marked phi carry only the
// redaction stub by construction (see Logger.js).
const METHOD = { error: 'error', warn: 'warn', info: 'log', verbose: 'log', debug: 'debug', trace: 'debug' };

module.exports = {
  write: function(record) {
    const prefix = '[' + record.module + ']';
    if (record.msg && record.msg.indexOf('▸ ') === 0 && typeof console.group === 'function') {
      console.group(prefix + ' ' + record.msg.slice(2));
      return;
    }
    const args = [prefix + ' ' + record.msg];
    if (record.data !== undefined) { args.push(record.data); }
    (console[METHOD[record.level]] || console.log).apply(console, args);
  }
};
```
(Group closing: the facade pops its path; visual `console.groupEnd` symmetry — have `Logger.for().groupEnd` ALSO emit a sentinel record `{msg:'◂'}` and close here. Implement: in `Logger.js` `child.groupEnd`, call `emit('info', moduleName, '◂', undefined, false)` BEFORE popping, and in this backend call `console.groupEnd()` when `record.msg === '◂'`, printing nothing. Update the Task 1 group test expectation accordingly: the `y` record's group is `['outer']` and sentinel records exist — filter them in assertions with `r.msg !== '◂'`.)

- [ ] **Step 2: jsonBackend**

```js
// imports/lib/loggerBackends/jsonBackend.js
// Production server backend: one JSON line per record to stdout.
// This IS the Splunk integration (UF/HEC ingest container stdout).
module.exports = {
  write: function(record) {
    if (record.msg === '◂') { return; }              // group-close sentinel
    try {
      process.stdout.write(JSON.stringify(record) + '\n');
    } catch (error) {
      console.error('[jsonBackend] serialization failed:', error && error.message);
    }
  }
};
```

- [ ] **Step 3: startup wiring**

```js
// imports/startup/both/loggingSetup.js
// Must be imported before workflow packages load (both client and server)
// so Meteor.Logger is available to npmPackages/* and extensions/*.
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import LoggerModule from '/imports/lib/Logger.js';
import consoleBackend from '/imports/lib/loggerBackends/consoleBackend.js';

const { Logger } = LoggerModule;

let backend = consoleBackend;
if (Meteor.isServer) {
  const wantJson = get(Meteor, 'settings.private.logging.format', Meteor.isProduction ? 'json' : 'console') === 'json';
  if (wantJson) { backend = require('/imports/lib/loggerBackends/jsonBackend.js'); }
}

// PHI sink: lazy hipaa-compliance lookup (Package registry convention --
// .claude/rules/fhir/package-registry.md). Absent package -> facade warns once.
function phiSink(event) {
  if (!Meteor.isServer) { return; }   // client phi() relies on the server-side audit trail via methods
  const pkg = globalThis.Package && globalThis.Package['@node-on-fhir/hipaa-compliance'];
  const hipaaLogger = get(pkg, 'HipaaLogger');
  if (hipaaLogger && typeof hipaaLogger.logEvent === 'function') {
    hipaaLogger.logEvent({
      eventType: get(event, 'context.action', 'access'),
      resourceId: event.resourceId,
      resourceType: event.resourceType,
      message: '[' + event.module + '] ' + event.msg,
      metadata: event.context
    }).catch(function(error) { console.error('[loggingSetup] phiSink audit write failed:', error && error.message); });
  }
}

Logger.init({
  threshold: get(Meteor, 'settings.public.loggingThreshold', 'info'),
  backend: backend,
  isDevelopment: Meteor.isDevelopment,
  source: Meteor.isServer ? 'server' : 'client',
  phiSink: phiSink
});

Meteor.Logger = Logger;
console.log('[loggingSetup] Meteor.Logger registered (' + (Meteor.isServer ? 'server' : 'client') + ', backend: ' + (backend === consoleBackend ? 'console' : 'json') + ')');
```
Then add `import '/imports/startup/both/loggingSetup.js';` as an early import in the client startup index AND `server/main.js` (before the workflow loader imports — verify by booting and confirming the registration line prints before workflow-loading output).

- [ ] **Step 4: Verify**

Boot dev (`meteor run --settings settings/settings.honeycomb.localhost.json`): registration line appears on server log and browser console; `Meteor.Logger.for('smoke').info('hi', {a:1})` in browser console prints `[smoke] hi {a:1}`. Boot once with `"logging": {"format": "json"}` added under `private` in localhost settings: server emits JSON lines; **remove the key after verifying** (localhost stays console).
Run `npm run test:logger` (sentinel-adjusted) → PASS.

- [ ] **Step 5: Commit** — `git add imports/lib/loggerBackends/ imports/startup/both/loggingSetup.js imports/lib/Logger.js imports/lib/Logger.test.mjs client/ server/main.js && git commit -m "feat(logging): backends, startup wiring, Meteor.Logger registration"`

---

### Task 3: Client log shipping (settings-gated, default OFF)

**Files:**
- Create: `imports/lib/loggerBackends/clientRelay.js`
- Create: `server/lib/loggingMethods.js` (import from `server/main.js`)
- Modify: `imports/startup/both/loggingSetup.js` (client: wrap backend), `imports/ui/ErrorBoundary.jsx` (`componentDidCatch` → `Meteor.Logger`)
- Test: `tests/mocha/loggingMethods.test.js`

**Interfaces:**
- Consumes: `redactPhi` (Task 1), backend contract (Task 2).
- Produces: Meteor method `'logging.clientBatch'(records: LogRecord[])`; client relay active only when `get(Meteor, 'settings.public.logging.shipClientLogs', false) === true`.

- [ ] **Step 1: Failing test**

```js
// tests/mocha/loggingMethods.test.js
import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';

if (Meteor.isServer) {
  describe('logging.clientBatch', function() {
    it('rejects when shipClientLogs is off', async function() {
      const original = Meteor.settings.public.logging;
      Meteor.settings.public.logging = { shipClientLogs: false };
      try {
        await Meteor.callAsync('logging.clientBatch', [{ ts: new Date().toISOString(), level: 'error', module: 'X', msg: 'boom', group: [], source: 'client', phi: false }]);
        assert.fail('expected feature-disabled');
      } catch (error) {
        assert.equal(error.error, 'feature-disabled');
      } finally { Meteor.settings.public.logging = original; }
    });

    it('accepts, re-redacts, and stamps source when on', async function() {
      const original = Meteor.settings.public.logging;
      Meteor.settings.public.logging = { shipClientLogs: true };
      try {
        const result = await Meteor.callAsync('logging.clientBatch', [{ ts: new Date().toISOString(), level: 'warn', module: 'X', msg: 'w', data: { name: [{ family: 'S' }] }, group: [], source: 'client', phi: false }]);
        assert.equal(result.accepted, 1);
      } finally { Meteor.settings.public.logging = original; }
    });
  });
}
```

- [ ] **Step 2: Run** — `npm test` → FAIL (method not found; register test import in `tests/main.js`).

- [ ] **Step 3: Implement**

```js
// server/lib/loggingMethods.js
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import RedactModule from '/imports/lib/loggerRedact.js';
const { redactPhi } = RedactModule;

Meteor.methods({
  'logging.clientBatch': async function(records) {
    check(records, [Match.ObjectIncluding({ ts: String, level: String, module: String, msg: String })]);
    if (get(Meteor, 'settings.public.logging.shipClientLogs', false) !== true) {
      throw new Meteor.Error('feature-disabled', 'Client log shipping is disabled. Set Meteor.settings.public.logging.shipClientLogs to true.');
    }
    const log = Meteor.Logger.for('clientRelay');
    let accepted = 0;
    records.slice(0, 20).forEach(function(record) {
      if (!['warn', 'error'].includes(record.level)) { return; }
      accepted = accepted + 1;
      log[record.level]('[client ' + record.module + '] ' + record.msg, {
        clientData: record.data !== undefined ? redactPhi(record.data) : undefined,   // defense in depth
        clientTs: record.ts, userId: this.userId || null, group: record.group
      });
    });
    return { accepted: accepted };
  }
});

DDPRateLimiter.addRule({ type: 'method', name: 'logging.clientBatch' }, 10, 10000);
```
(Confirm `ddp-rate-limiter` is in `.meteor/packages`; add if absent.)

```js
// imports/lib/loggerBackends/clientRelay.js
// Wraps a backend: passes every record through, and (when enabled) batches
// warn/error records to the server. Redaction already happened in the facade.
import { Meteor } from 'meteor/meteor';

export function withClientRelay(innerBackend) {
  let queue = [];
  let timer = null;
  function flush() {
    timer = null;
    if (queue.length === 0) { return; }
    const batch = queue.splice(0, 20);
    Meteor.call('logging.clientBatch', batch, function(error) {
      if (error) { console.warn('[clientRelay] ship failed:', error.reason); }
    });
  }
  return {
    write: function(record) {
      innerBackend.write(record);
      if (record.level === 'warn' || record.level === 'error') {
        queue.push(record);
        if (queue.length >= 20) { flush(); }
        else if (!timer) { timer = setTimeout(flush, 5000); }
      }
    }
  };
}
```
In `loggingSetup.js` (client branch): `if (!Meteor.isServer && get(Meteor, 'settings.public.logging.shipClientLogs', false) === true) { backend = withClientRelay(backend); }` (import at top). In `ErrorBoundary.jsx` `componentDidCatch`: replace the bare `console.error` with `const log = Meteor.Logger ? Meteor.Logger.for('ErrorBoundary') : console; log.error('Error caught in ErrorBoundary: ' + (error && error.message), { componentStack: get(errorInfo, 'componentStack', '').slice(0, 2000) });`

- [ ] **Step 4: Run** — `npm test` → PASS. Manual: flip `shipClientLogs: true` in localhost settings, throw in a component, see `[client ErrorBoundary]` on server log; flip back to `false`.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(logging): settings-gated client warn/error shipping + ErrorBoundary relay"`

---

### Task 4: `/audit-phi-logs` command + post-edit hook + worklist

**Files:**
- Create: `.claude/commands/audit-phi-logs.md`, `.claude/hooks/post-tool-use-phi-logging.md`
- Create (generated): `docs/superpowers/plans/phi-log-worklist.txt`

- [ ] **Step 1: Write the command** (mirror the voice/format of `.claude/commands/audit-theme.md`)

````markdown
<!-- .claude/commands/audit-phi-logs.md -->
# /audit-phi-logs — scan for PHI-risky console statements

Scan imports/ server/ npmPackages/ (exclude node_modules, deprecated, tests) for
console statements likely to interpolate PHI, and emit a worklist.

Heuristics (grep -rinE, one file:line per hit):
1. `console\.(log|warn|error|info|debug)\(.*(patient|parsedPatient|selectedPatient)` — patient objects/urls
2. `console\.(log|warn|error|info|debug)\(.*(Bundle|resource)\b.*\)` where the same file imports FHIR collections
3. `console\.(log|warn|error|info|debug)\(.*(birthDate|familyName|givenName|\.name\[)` — direct demographics

For each hit classify: (a) PHI-payload → convert to `Meteor.Logger.for(...).phi(...)`;
(b) identifier-only (id/reference string) → convert to `.debug(msg, {id})`;
(c) false positive → annotate `// phi-audit: ok` (the scanner skips lines with this marker).
Write all hits with classification to docs/superpowers/plans/phi-log-worklist.txt
(format: `path:line\tclassification\tline-text`), then report counts.
````

- [ ] **Step 2: Write the hook** (mirror `.claude/hooks/post-tool-use-theme.md` format): after Edit/Write on `*.js/jsx`, grep the edited file for heuristic 1/3 patterns on lines without `phi-audit: ok`; if found, remind: "PHI-risky console statement — use `Meteor.Logger.for('<module>').phi(...)` (see /audit-phi-logs). Raw console is fine for non-PHI dev chatter." Warn-only, never block.

- [ ] **Step 3: Run the command once** to generate `phi-log-worklist.txt` (expect ≈1,000 entries; survey estimated 1,048). Commit all three artifacts:
`git add .claude/commands/audit-phi-logs.md .claude/hooks/post-tool-use-phi-logging.md docs/superpowers/plans/phi-log-worklist.txt && git commit -m "chore(logging): PHI log audit command, hook, and worklist"`

---

### Task 5: Server hot-path conversion (by hand — the exemplar for the loop)

**Files:**
- Modify: `server/FhirEndpoints.js` (312 console statements), `server/RestHelpers.js`, `server/BulkData.js`

- [ ] **Step 1:** Top of each file: `const log = Meteor.Logger.for('FhirEndpoints');` (respectively `'RestHelpers'`, `'BulkData'`). Place AFTER imports; these files load after loggingSetup.
- [ ] **Step 2:** Convert mechanically within each file:
  - `console.log('[x] msg', data)` → `log.debug('msg', data)` (drop hand-written brackets — the module field replaces them; keep sub-context in the msg text).
  - `console.warn/error(...)` → `log.warn/error(...)` (same argument folding).
  - `process.env.TRACE && console.log(...)` → `log.trace(...)`; `process.env.DEBUG && console.log(...)` → `log.debug(...)` (threshold now gates them).
  - Statements matching the PHI worklist in these files → `log.phi(msg, resource, { action: '<read|search|export>' })`.
- [ ] **Step 3:** Verify: `grep -c "console\." server/FhirEndpoints.js server/RestHelpers.js server/BulkData.js` → 0 (or only `phi-audit: ok`-annotated survivors); boot + `curl http://localhost:3000/baseR4/metadata` works; server output shows `[FhirEndpoints]`-prefixed lines at `debug` when `loggingThreshold: "debug"`.
- [ ] **Step 4: Commit** — `git add server/ && git commit -m "refactor(logging): convert REST/bulk hot paths to Logger"`

---

### Task 6: Ralph loop — PHI-risky worklist conversion

**Files:**
- Create: `.claude/ralph/phi-logging-prompt.md`
- Modify: every file in `docs/superpowers/plans/phi-log-worklist.txt`

- [ ] **Step 1: Loop prompt**

````markdown
<!-- .claude/ralph/phi-logging-prompt.md -->
# PHI logging migration loop — one FILE per iteration

Pick the first unconverted file from docs/superpowers/plans/phi-log-worklist.txt
(a file is converted when none of its worklist lines still match a raw console call).
If none remain: run the /audit-phi-logs scan again; if it reports 0 unannotated
PHI-risky hits, the loop is COMPLETE — STOP.

Per file:
1. Add `const log = (Meteor.Logger ? Meteor.Logger.for('<ModuleName>') : console);`
   — ModuleName from the file name. For npmPackages/* files ALWAYS use this
   fallback form (packages must not assume the host registered Meteor.Logger).
2. Convert every worklist line in this file per its classification:
   PHI-payload → log.phi(msg, resource, {action}); identifier-only → log.debug;
   false positive → append `// phi-audit: ok`.
3. Non-worklist console lines in the file: leave untouched (out of scope).
4. Verify: worklist patterns no longer match raw console in this file;
   `npx --yes acorn --module --ecma2024 --silent <file>` parses.
5. Commit: "refactor(logging): PHI-safe logging in <file basename>".
RULES: never delete a log statement (convert or annotate); never touch
extensions/* (separate repos); skip-list anything confusing to
.claude/ralph/phi-logging-skipped.md and continue.
````

- [ ] **Step 2:** Run via the ralph-loop command; then convert any skip-list entries manually.
- [ ] **Step 3:** Exit gate: `/audit-phi-logs` reports 0 unannotated hits; `npm test` + `npm run test:logger` green; boot clean. Commit loop artifacts.

---

### Task 7: Retire winston + exit criteria

**Files:**
- Delete: `server/lib/Logger.js` (dead winston config — verify first: `grep -rn "server/lib/Logger" server/ imports/ npmPackages/ --include="*.js"` must return nothing; if a consumer exists, convert it to the facade before deleting)
- Modify: `package.json`

- [ ] **Step 1:** `meteor npm uninstall winston` and delete the file.
- [ ] **Step 2: Exit sweep:**
```bash
grep -rn "winston" imports/ server/ package.json         # → no hits
npm run test:logger && npm test                            # → PASS
```
Boot prod-style locally (`--production` or `format: "json"` temporarily): stdout is one-JSON-line-per-record; pipe through `jq .level` to confirm parseability. `/audit-phi-logs` → 0.
- [ ] **Step 3:** `graphify update .` then commit: `"feat(logging): retire winston -- structured logging complete"`

## Self-review notes (applied)

- Spec coverage: facade+records (T1), backends/stdout-Splunk/Meteor.Logger (T2), client shipping gated default-off (T3), audit tooling (T4), hot paths (T5), targeted ralph loop (T6), winston removal (T7). Settings absent → today's behavior (console, no ship, info).
- Deviation from spec, documented in T1: dev-mode `log.phi` shows the redaction stub, not the raw payload — records never carry raw PHI anywhere; simpler and strictly safer.
- Type consistency: LogRecord shape and `Logger.for` surface defined once in T1 and reused verbatim in T2/T3/T5/T6.
