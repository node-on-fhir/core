# Meteor.methods → JSON-RPC Method Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. Tasks 8 and 9 are ralph loops (see `.claude/commands/ralph-loop.md`).

**Goal:** Every business method declaratively defined in a `ServerMethods` registry — validated, authorized, audited, streaming-capable — mounted on both `POST /api/rpc` (JSON-RPC 2.0, Streamable HTTP) and a DDP compatibility shim; then convert ~230 method blocks and 227 call sites.

**Architecture:** Pure-CJS core (name rules, error mapping, OpenRPC) + Meteor wiring (pipeline, DDP shim, `Meteor.ServerMethods`). Hand-written dual-acceptance auth middleware reusing `server/lib/FhirAuth.js`. SSE for `streaming: true` methods, MCP-shaped. Two ralph loops: definitions (enforcement pass), then call sites.

**Tech Stack:** Meteor v3 + Express (via `WebApp.handlers`), no new npm deps, `node --test` + `meteortesting:mocha`.

**Spec:** `docs/superpowers/specs/2026-07-01-jsonrpc-methods-design.md` — read first. **Prerequisites:** the structured-logging plan (for `Meteor.Logger`) must be landed; the JSON Schema migration's `FhirValidator` (its Task 2) is required for param validation; the audit-trail plan's EventBus wiring is used if present (audit step no-ops gracefully if absent).

## Global Constraints

- Method names: `/^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)+$/` — enforced by `define()`, no exceptions (legacy names live in `aliases`).
- The auth middleware (Task 3) is hand-written with a full test matrix; loops NEVER touch it.
- Audit + logging steps in the pipeline are fire-and-forget — a failure there must never fail the method call.
- Accounts/login/password methods and any `this.setUserId` user are permanent DDP stragglers — loops skip them.
- `extensions/*` are separate repos: read for reference, never modify.
- Absent `settings.private.rpc.*` keys: endpoint enabled, batchLimit 20, deprecation warnings on.
- Meteor v3 async; `function(){}` for Meteor.methods shims; lodash `get()`; logging via `Meteor.Logger`.
- Commit after every task and every loop iteration; Claude Code co-author trailer.

---

### Task 1: Registry core (pure CJS) — names, aliases, error mapping, OpenRPC

**Files:**
- Create: `imports/lib/ServerMethodsCore.js` (plain CJS, no Meteor imports)
- Test: `imports/lib/ServerMethodsCore.test.mjs`
- Modify: `package.json` (script `"test:rpc": "node --test imports/lib/ServerMethodsCore.test.mjs",`)

**Interfaces (later tasks depend on these exactly):**
- `validateMethodName(name) → { valid, reason? }`
- `createRegistry() → registry` with `registry.define(name, options, handler)`, `registry.get(nameOrAlias) → { name, options, handler, viaAlias: boolean } | null`, `registry.list(filter?) → [{name, options}]` (filter: `{mcp: true}` matches `options.mcp.expose`)
- `meteorErrorToRpcError(error) → { code, message, data: {error, reason, details} }` and `rpcErrorToMeteorErrorArgs(rpcError) → { error, reason, details }`; code table: `not-authorized`→-32001, `feature-disabled`→-32002, `not-found`→-32004, `validation-failed`→-32602, other Meteor.Error→-32000, non-Meteor throw→-32603 (message `'Internal error'`, no detail leak)
- `buildOpenRpcDocument(registry, {title, version}) → OpenRPC 1.3 object` (per method: name, summary=description, params: [{name:'params', schema}], `x-streaming`, `x-phi`)
- `httpStatusForRpcCode(code) → number` (-32001→403, -32602/-32600/-32700→400, -32601→404, else 500)
- CJS export: `module.exports = { validateMethodName, createRegistry, meteorErrorToRpcError, rpcErrorToMeteorErrorArgs, buildOpenRpcDocument, httpStatusForRpcCode }`

- [ ] **Step 1: Write the failing tests**

```js
// imports/lib/ServerMethodsCore.test.mjs  — npm run test:rpc
import test from 'node:test';
import assert from 'node:assert/strict';
import Core from './ServerMethodsCore.js';
const { validateMethodName, createRegistry, meteorErrorToRpcError, buildOpenRpcDocument, httpStatusForRpcCode } = Core;

test('name rules: dotted resource.action only', function() {
  assert.equal(validateMethodName('consents.save').valid, true);
  assert.equal(validateMethodName('observations.vitals.insert').valid, true);
  assert.equal(validateMethodName('saveConsent').valid, false);      // no dot
  assert.equal(validateMethodName('Consents.save').valid, false);    // uppercase start
  assert.equal(validateMethodName('consents.').valid, false);
});

test('define/get with aliases; duplicates rejected', function() {
  const registry = createRegistry();
  const handler = async function() { return 1; };
  registry.define('consents.save', { description: 'x', aliases: ['saveConsent'] }, handler);
  assert.equal(registry.get('consents.save').handler, handler);
  assert.equal(registry.get('saveConsent').viaAlias, true);
  assert.equal(registry.get('nope'), null);
  assert.throws(function() { registry.define('consents.save', {}, handler); }, /already defined/);
  assert.throws(function() { registry.define('badName', {}, handler); }, /name/);
});

test('error mapping is lossless for Meteor.Error shape', function() {
  const fake = { error: 'not-authorized', reason: 'no user', details: 'ctx', isClientSafe: true };
  const rpc = meteorErrorToRpcError(fake);
  assert.equal(rpc.code, -32001);
  assert.equal(rpc.data.error, 'not-authorized');
  assert.equal(rpc.data.reason, 'no user');
  assert.equal(httpStatusForRpcCode(rpc.code), 403);
});

test('non-Meteor errors do not leak internals', function() {
  const rpc = meteorErrorToRpcError(new Error('SELECT * FROM secrets failed'));
  assert.equal(rpc.code, -32603);
  assert.equal(rpc.message, 'Internal error');
  assert.equal(rpc.data, undefined);
});

test('OpenRPC document includes methods with schemas and x- flags', function() {
  const registry = createRegistry();
  registry.define('exports.run', { description: 'Run export', streaming: true, phi: true,
    schemaObject: { type: 'object', properties: { types: { type: 'array' } } } }, async function() {});
  const doc = buildOpenRpcDocument(registry, { title: 'honeycomb', version: '1.0.0' });
  assert.equal(doc.openrpc, '1.3.2');
  const method = doc.methods.find(m => m.name === 'exports.run');
  assert.equal(method['x-streaming'], true);
  assert.equal(method['x-phi'], true);
  assert.equal(method.params[0].schema.type, 'object');
});

test('list filters by mcp exposure', function() {
  const registry = createRegistry();
  registry.define('a.one', { mcp: { expose: true } }, async function() {});
  registry.define('a.two', {}, async function() {});
  assert.deepEqual(registry.list({ mcp: true }).map(m => m.name), ['a.one']);
});
```

- [ ] **Step 2: Run** — `npm run test:rpc` → FAIL (module missing).

- [ ] **Step 3: Implement**

```js
// imports/lib/ServerMethodsCore.js
// Transport-neutral method-registry core. Plain CJS, zero Meteor imports —
// testable with `node --test`. Meteor wiring lives in ServerMethods.js.

const NAME_RE = /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)+$/;
const CODE_FOR_ERROR = { 'not-authorized': -32001, 'feature-disabled': -32002, 'not-found': -32004, 'validation-failed': -32602 };
const STATUS_FOR_CODE = { '-32001': 403, '-32602': 400, '-32600': 400, '-32700': 400, '-32601': 404 };

function validateMethodName(name) {
  if (typeof name !== 'string' || !NAME_RE.test(name)) {
    return { valid: false, reason: 'method name must be dotted lower-camel resource.action, got: ' + name };
  }
  return { valid: true };
}

function createRegistry() {
  const methods = {};   // canonical name -> {name, options, handler}
  const aliases = {};   // alias -> canonical name
  return {
    define: function(name, options, handler) {
      const check = validateMethodName(name);
      if (!check.valid) { throw new Error('[ServerMethods] invalid name: ' + check.reason); }
      if (methods[name] || aliases[name]) { throw new Error('[ServerMethods] ' + name + ' already defined'); }
      const opts = Object.assign({ requireAuth: true, streaming: false, phi: false, aliases: [] }, options);
      methods[name] = { name: name, options: opts, handler: handler };
      opts.aliases.forEach(function(alias) {
        if (methods[alias] || aliases[alias]) { throw new Error('[ServerMethods] alias collision: ' + alias); }
        aliases[alias] = name;
      });
      return methods[name];
    },
    get: function(nameOrAlias) {
      if (methods[nameOrAlias]) { return Object.assign({ viaAlias: false }, methods[nameOrAlias]); }
      if (aliases[nameOrAlias]) { return Object.assign({ viaAlias: true }, methods[aliases[nameOrAlias]]); }
      return null;
    },
    list: function(filter) {
      let all = Object.values(methods);
      if (filter && filter.mcp === true) {
        all = all.filter(function(m) { return m.options.mcp && m.options.mcp.expose === true; });
      }
      return all.map(function(m) { return { name: m.name, options: m.options }; });
    }
  };
}

function meteorErrorToRpcError(error) {
  const isMeteorShaped = error && (error.isClientSafe === true || (typeof error.error === 'string' && 'reason' in error));
  if (!isMeteorShaped) {
    return { code: -32603, message: 'Internal error' };   // never leak internals
  }
  const code = CODE_FOR_ERROR[error.error] !== undefined ? CODE_FOR_ERROR[error.error] : -32000;
  return { code: code, message: error.reason || String(error.error), data: { error: error.error, reason: error.reason, details: error.details } };
}

function rpcErrorToMeteorErrorArgs(rpcError) {
  const data = (rpcError && rpcError.data) || {};
  return { error: data.error !== undefined ? data.error : rpcError.code, reason: data.reason || rpcError.message, details: data.details };
}

function httpStatusForRpcCode(code) { return STATUS_FOR_CODE[String(code)] || 500; }

function buildOpenRpcDocument(registry, info) {
  return {
    openrpc: '1.3.2',
    info: { title: info.title, version: info.version },
    methods: registry.list().map(function(m) {
      return {
        name: m.name,
        summary: m.options.description || '',
        params: [{ name: 'params', required: true, schema: m.options.schemaObject || { type: 'object' } }],
        result: { name: 'result', schema: {} },
        'x-streaming': m.options.streaming === true,
        'x-phi': m.options.phi === true
      };
    })
  };
}

module.exports = { validateMethodName, createRegistry, meteorErrorToRpcError, rpcErrorToMeteorErrorArgs, buildOpenRpcDocument, httpStatusForRpcCode };
```
(Note: `schemaObject` is the resolved JSON Schema; the Meteor layer resolves a string `schema: 'Name'` through `FhirValidator` and stores the object here for OpenRPC.)

- [ ] **Step 4:** `npm run test:rpc` → PASS (6 tests).
- [ ] **Step 5: Commit** — `git add imports/lib/ServerMethodsCore.js imports/lib/ServerMethodsCore.test.mjs package.json && git commit -m "feat(rpc): registry core - names, aliases, error mapping, OpenRPC"`

---

### Task 2: Meteor wiring — pipeline + DDP shim + `Meteor.ServerMethods`

**Files:**
- Create: `imports/lib/ServerMethods.js`
- Modify: `imports/startup/both/loggingSetup.js`-adjacent — create `server/rpc/rpcSetup.js`, imported from `server/main.js` after loggingSetup
- Test: `tests/mocha/serverMethods.test.js`

**Interfaces:**
- `ServerMethods.define(name, options, handler)` — options: `{description, schema?: string, schemaObject?: object, allow?: {roles: string[]}, phi?, streaming?, mcp?, aliases?, requireAuth?, rateLimit?: {calls, intervalMs}}`. Resolving `schema` string: `FhirValidator.getValidatorFor(schema)` must exist (throw at define-time if not — fail at boot, not first call).
- `ServerMethods.invoke(name, params, context) → Promise<result>` — runs the FULL pipeline in-process (server→server orchestration path). `context` minimally `{userId}`; defaults to `{userId: null, transport: 'server'}`.
- `ServerMethods.runPipeline(entry, params, context)` — internal, shared by DDP shim (this task), HTTP (Task 4), and invoke.
- Pluggable authorizer: `ServerMethods.setAuthorizer(async function(context, allow) → {allowed, reason?})`. Default (until Task 2 Step 4 wires CASL): if a method declares `allow` and no authorizer is registered → deny with `'no authorizer registered'` (fail-closed).
- Registered globally at startup: `Meteor.ServerMethods = ServerMethods` (server); client gets it in Task 5.
- DDP shim: every `define()` also calls `Meteor.methods({[name]: fn, ...aliases})` where fn builds `context = {userId: this.userId, transport: 'ddp', ip: get(this, 'connection.clientAddress'), userAgent: get(this, 'connection.httpHeaders.user-agent')}`, calls `this.unblock()`, accepts EITHER a single params object OR legacy positional args (arity: if arguments.length > 1 or first arg isn't a plain object, pass `{__positional: [...arguments]}` and let the handler's legacy signature adapter handle it — see Task 8 loop rules), and runs the pipeline. Alias invocations log one deprecation warning per name when `settings.private.rpc.deprecationWarnings !== false`.

**Pipeline order (exact, from the spec):** auth → authorize → validate params (AJV) → rate limit → PHI audit (fire-and-forget EventBus emission via lazy `Package['@node-on-fhir/record-lifecycle']` lookup; absent → skip) → dispatch (with `Meteor.Logger.for(name)` timing log; `phi: true` → params logged as `{redacted: true}`) → error mapping happens at each transport edge, not here (pipeline throws Meteor.Error-shaped errors).

- [ ] **Step 1: Failing tests** (mocha, server): fixture method with `requireAuth: true` denies null userId with `error === 'not-authorized'`; schema-validated method rejects bad params with `validation-failed`; `invoke()` returns handler result and passes context; `allow` with no authorizer denies; after `setAuthorizer`, allow/deny follows it; DDP shim: `Meteor.callAsync(fixtureName, {a: 1})` works end-to-end in test context; alias callable.
- [ ] **Step 2: Implement** `ServerMethods.js` per the interfaces (compose `createRegistry()` from Task 1; pipeline is ~80 lines; every fire-and-forget wrapped in try/catch → `log.error`).
- [ ] **Step 3: `rpcSetup.js`**: `Meteor.ServerMethods = ServerMethods;` + built-in `ServerMethods.define('rpc.discover', {description: 'OpenRPC document', requireAuth: false}, async () => buildOpenRpcDocument(...))`.
- [ ] **Step 4: CASL authorizer adapter**: read `server/lib/CaslAccessControl.js` exports (`grep -n "export" server/lib/CaslAccessControl.js`) and implement `server/rpc/caslAuthorizer.js` adapting `allow.roles` to its ability check; `ServerMethods.setAuthorizer(caslAuthorizer)` in rpcSetup. If its API doesn't map to role labels, implement the authorizer against whatever user-role source `CaslAccessControl` itself consumes — the adapter is 20 lines either way; do NOT modify CaslAccessControl.
- [ ] **Step 5:** `npm test` → PASS. Commit — `"feat(rpc): ServerMethods pipeline, DDP shim, Meteor.ServerMethods"`

---

### Task 3: Auth middleware (hand-written — loops never touch this)

**Files:**
- Create: `server/rpc/RpcAuth.js`
- Test: `tests/mocha/rpcAuth.test.js`

**Interfaces:**
- `resolveRpcAuth(req) → Promise<{ userId: string|null, scopes: string[], via: 'oauth'|'loginToken'|null }>`
- Order: (1) no/malformed Authorization header → `{userId: null, scopes: [], via: null}`; (2) `FhirAuth.parseUserAuthorization(req)` (read its exact return shape in `server/lib/FhirAuth.js` first and adapt the destructuring — anchor: `grep -n "export\|return" server/lib/FhirAuth.js | head -30`); (3) on OAuth miss, treat bearer value as Meteor login token: `crypto.createHash('sha256').update(token).digest('base64')` compared against `Meteor.users` `services.resume.loginTokens.hashedToken` via `findOneAsync`, honoring `Accounts._getTokenLifetimeMs()` expiry (`when` field). Never mint or refresh tokens here.

- [ ] **Step 1: Failing test matrix** — no header → null user; garbage bearer → null user (NOT an exception); valid login token (create a test user + `Accounts._generateStampedLoginToken` + `Accounts._insertLoginToken`) → correct userId, `via: 'loginToken'`; expired token → null; OAuth path covered by a stubbed `parseUserAuthorization` (spy) asserting it's tried FIRST.
- [ ] **Step 2: Implement.** ~60 lines. Every failure path returns null-user rather than throwing (the pipeline's `requireAuth` produces the 401/403, keeping auth logic in one place).
- [ ] **Step 3:** `npm test` → PASS. Commit — `"feat(rpc): dual-acceptance auth middleware (OAuth + login token)"`

---

### Task 4: HTTP endpoint — unary, batch, SSE streaming

**Files:**
- Create: `server/rpc/JsonRpcEndpoint.js` (imported from `rpcSetup.js`)
- Test: `tests/mocha/jsonRpcEndpoint.test.js` (loopback fetch against `Meteor.absoluteUrl('api/rpc')`)

**Interfaces:**
- `POST /api/rpc` mounted via `WebApp.handlers.use('/api/rpc', ...)` (Express router; confirm the Meteor 3 idiom used elsewhere: `grep -rn "WebApp.handlers\|connectHandlers" server/main.js server/rpc/ | head`). Unmounted entirely when `get(Meteor, 'settings.private.rpc.enabled', true) === false`.
- Request handling: parse JSON (fail → -32700); array → batch (cap `settings.private.rpc.batchLimit` default 20, streaming methods in batch → -32600 per item); single object → validate `{jsonrpc: '2.0', method, params?, id?}` (fail → -32600); unknown method → -32601; notification (no `id`) → run, respond 204 empty.
- Unary flow: `resolveRpcAuth(req)` → context `{userId, scopes, transport: 'http', ip: req.ip, userAgent: req.headers['user-agent']}` → `ServerMethods.runPipeline` → `{jsonrpc:'2.0', id, result}` or error object via `meteorErrorToRpcError` + `httpStatusForRpcCode` (batch: always HTTP 200, per-item errors inside).
- Streaming flow (`entry.options.streaming && req.headers.accept === 'text/event-stream'` match): set `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `X-Accel-Buffering: no`; `context.emit = (progress) => res.write('data: ' + JSON.stringify({jsonrpc:'2.0', method:'rpc.progress', params:{id, progress}}) + '\n\n')` with flush; on handler resolve write final `data: {jsonrpc, id, result}` frame + `res.end()`; on throw write error frame + end.

- [ ] **Step 1: Failing tests** — unary happy path with login-token bearer (reuse Task 3's test-user helper); 403 for `requireAuth` without token; batch of 3 (one invalid method) → 3 responses in order, one -32601; notification → 204; streaming fixture method emitting 2 progress frames → client reads 3 SSE frames (2 progress + result) — use `fetch` + manual reader on the response body.
- [ ] **Step 2: Implement** (~150 lines). **Body size cap**: 1 MB via express.json limit.
- [ ] **Step 3:** `npm test` → PASS. Manual: `curl -s -X POST http://localhost:3000/api/rpc -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"rpc.discover"}' | jq '.result.methods | length'` → a number.
- [ ] **Step 4: Commit** — `"feat(rpc): /api/rpc endpoint - unary, batch, SSE streaming"`

---

### Task 5: Client caller + global registration

**Files:**
- Create: `imports/lib/rpcClient.js`
- Modify: `imports/startup/both/` — client-side registration (`Meteor.ServerMethods` read-only stub is NOT provided client-side; clients get `Meteor.rpc`/`Meteor.rpcStream`)
- Test: `tests/mocha/rpcClient.test.js` (client-context test via meteortesting:mocha client runner if configured; otherwise a server-side fetch-shape unit test of the request builder + error rehydration)

**Interfaces:**
- `rpc(name, params) → Promise<result>` — fetch POST `/api/rpc`, bearer = `Accounts._storedLoginToken()` when present; on JSON-RPC error, throw `new Meteor.Error(...rpcErrorToMeteorErrorArgs(err))` (existing catch blocks keep working).
- `rpcStream(name, params, {onProgress}) → Promise<finalResult>` — same POST with `Accept: text/event-stream`, parse SSE frames, call `onProgress(progress)` per notification, resolve on final frame.
- Registered as `Meteor.rpc` / `Meteor.rpcStream` on the client (and server, where they loop back via `ServerMethods.invoke` — no HTTP self-call).

- [ ] **Step 1–3:** test → implement (~90 lines) → verify. Include one incrementing request-id counter (per-tab uniqueness is sufficient — no Date.now needed, plain counter).
- [ ] **Step 4: Commit** — `"feat(rpc): rpc/rpcStream client with Meteor.Error rehydration"`

---

### Task 6: Loop verification script

**Files:**
- Create: `scripts/verify-rpc-methods.sh`

- [ ] **Step 1:** Write + `chmod +x`:

```bash
#!/usr/bin/env bash
# scripts/verify-rpc-methods.sh [file.js]
# With file: assert the file defines no raw Meteor.methods and parses.
# Without: repo-wide status (raw blocks remaining in scope dirs) + live
# rpc.discover count when the app is running.
set -e
SCOPE="imports server npmPackages"
if [ -n "$1" ]; then
  if grep -q "Meteor\.methods(" "$1"; then echo "FAIL: $1 still calls Meteor.methods"; exit 1; fi
  if ! grep -q "ServerMethods.define\|Meteor.ServerMethods.define" "$1"; then echo "WARN: $1 defines no methods (verify intentional)"; fi
  npx --yes acorn --module --ecma2024 --silent "$1" && echo "OK: $1"
  exit 0
fi
REMAINING=$(grep -rl "Meteor\.methods(" $SCOPE --include="*.js" | grep -v "imports/lib/ServerMethods.js" | grep -v "imports/accounts" | wc -l | tr -d ' ')
CALLS=$(grep -rn "Meteor\.call(\|Meteor\.callAsync(" $SCOPE --include="*.js" --include="*.jsx" | wc -l | tr -d ' ')
echo "files-with-raw-Meteor.methods: $REMAINING   remaining Meteor.call/callAsync sites: $CALLS"
DISCOVER=$(curl -s -X POST http://localhost:3000/api/rpc -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"rpc.discover"}' 2>/dev/null | grep -o '"name"' | wc -l | tr -d ' ')
[ -n "$DISCOVER" ] && echo "rpc.discover methods (app must be running): $DISCOVER"
```
- [ ] **Step 2:** Sanity-run (non-zero counts expected) + commit — `"chore(rpc): migration verification script"`

---

### Task 7: Exemplar conversion (by hand — the Loop 1 template)

**Files:**
- Modify: `npmPackages/provider-directory/server/methods.js` (~16 methods, mid-size, representative: dotted + camelCase names, this.userId guards, check() validation)

- [ ] **Step 1: Inventory** — `grep -n "': async function\|': function\|check(\|this.userId\|this.connection\|this.unblock" <file>` — list every method name, its params, guards.
- [ ] **Step 2: Convert every method** in the block to `Meteor.ServerMethods.define(...)`:
  - camelCase names → dotted canonical + `aliases: ['oldName']` (e.g. `geocodeAddress` → `locations.geocodeAddress` — namespace from the package's domain).
  - `if (!this.userId) throw ...` deleted → `requireAuth: true` (the default). A method with NO guard: decide — genuinely public → `requireAuth: false` + comment why; else it was a latent bug → leave `requireAuth: true` and note in commit message.
  - `check(x, String)`-style validation → a params JSON Schema registered via `FhirValidator.registerSchema('<Method>Params', {...})` and referenced as `schema`; positional args become named params (`{address}` not `(address)`), and the legacy positional adapter comment added if any internal caller uses positional form.
  - Patient-data-touching methods → `phi: true`.
  - `this.connection.clientAddress` → `context.ip`; body's `this.userId` → `context.userId`.
- [ ] **Step 3: Verify** — `./scripts/verify-rpc-methods.sh <file>` OK; boot; `curl` one converted method through `/api/rpc` with a real login token; call one via the app UI (DDP shim path).
- [ ] **Step 4: Commit** — `"refactor(rpc): convert provider-directory methods to ServerMethods (exemplar)"`

---

### Task 8: Ralph loop 1 — definitions (~230 blocks, imports/ server/ npmPackages/)

**Files:** Create `.claude/ralph/jsonrpc-definitions-prompt.md`; modify method files.

- [ ] **Step 1: Loop prompt**

````markdown
<!-- .claude/ralph/jsonrpc-definitions-prompt.md -->
# Meteor.methods -> ServerMethods.define loop — one FILE per iteration

Pick first file: grep -rl "Meteor\.methods(" imports/ server/ npmPackages/ --include="*.js" \
  | grep -v "imports/lib/ServerMethods.js" | grep -v "imports/accounts" | sort | head -1
None left -> run ./scripts/verify-rpc-methods.sh; if files-with-raw = 0, STOP (complete).

Per file, follow the committed exemplar npmPackages/provider-directory/server/methods.js
("refactor(rpc): convert provider-directory methods to ServerMethods (exemplar)"):
1. Inventory every method: name, params (positional?), this.userId guard?, check() calls,
   this.connection/this.unblock/this.setUserId usage, PHI-touching?
2. SKIP (append to .claude/ralph/jsonrpc-skipped.md with reason) if: uses this.setUserId,
   is an accounts/login/password method, or you cannot determine what it does.
3. Convert each method to Meteor.ServerMethods.define with: dotted canonical name
   (+ aliases for renamed), requireAuth semantics per exemplar, params JSON Schema from
   the check() calls (FhirValidator.registerSchema), phi: true where patient data flows,
   description: one sentence (REQUIRED — this feeds OpenRPC and MCP tool discovery),
   context.userId/ip replacing this.*, this.unblock() deleted.
4. Grep for internal callers passing positional args to renamed/re-signatured methods:
   grep -rn "callAsync('<name>'\|call('<name>'" imports/ server/ npmPackages/ — leave call
   sites ALONE (Loop 2) but confirm the DDP shim's positional adapter covers them; if a
   caller passes >1 positional arg, note the mapping in the define() options as
   positionalParams: ['argName1','argName2'] so the shim can adapt.
5. Verify: ./scripts/verify-rpc-methods.sh <file> ; boot check every 10th iteration
   (timeout 300 meteor run ... until "App running at").
6. Commit: "refactor(rpc): convert <file> to ServerMethods".
RULES: one file per iteration; never touch imports/lib/ServerMethods.js, server/rpc/*,
imports/accounts/*, extensions/*; never delete a method; description is mandatory.
````
(The `positionalParams` adapter: add it to the DDP shim in Task 2 NOW if not already — shim maps positional arguments onto the named list before the pipeline. It is ~10 lines; add a mocha test.)

- [ ] **Step 2:** Run the loop via the ralph-loop command. Handle the skip list manually after.
- [ ] **Step 3:** Exit gate: `./scripts/verify-rpc-methods.sh` → files-with-raw 0; `npm test` + boot green; `rpc.discover` count ≈ method inventory. Commit artifacts.

---

### Task 9: Ralph loop 2 — call sites (227)

**Files:** Create `.claude/ralph/jsonrpc-callsites-prompt.md`; modify caller files.

- [ ] **Step 1: Loop prompt**

````markdown
<!-- .claude/ralph/jsonrpc-callsites-prompt.md -->
# Meteor.call/callAsync -> rpc()/invoke() loop — one FILE per iteration

Pick first file: grep -rl "Meteor\.call(\|Meteor\.callAsync(" imports/ server/ npmPackages/ \
  --include="*.js" --include="*.jsx" | grep -v rpcClient.js | sort | head -1
None left -> COMPLETE: run ./scripts/verify-rpc-methods.sh (call sites 0), npm test, STOP.

Per file:
1. For each call site, find the method's define() to learn its canonical name and named
   params (grep the name in rpc.discover output or the defining file).
2. Client-side file (imports/ui*, client/, npmPackages client dirs):
   Meteor.call('x', a, b, cb) -> try { const r = await Meteor.rpc('x.canonical', {p1: a, p2: b}); cb-success-body } catch (error) { cb-error-body }
   (convert the surrounding function to async as needed; Meteor.rpc rehydrates Meteor.Error
   so error.error/error.reason logic is unchanged).
3. Server-side file: Meteor.callAsync('x', a) -> await Meteor.ServerMethods.invoke('x.canonical', {p1: a}, {userId: <preserve the calling context's userId if inside another method: context.userId; else null with a comment>}).
4. Methods on the skip list (accounts etc.): leave their call sites as Meteor.call — annotate `// rpc-migration: ddp-straggler`.
5. Verify: acorn parse; grep the file for remaining Meteor.call( — only annotated stragglers allowed.
6. Commit: "refactor(rpc): migrate call sites in <file>".
RULES: one file per iteration; behavior-preserving (error handling branches unchanged);
if a call site's method has no define() yet, STOP the iteration and flag — Loop 1 missed it.
````

- [ ] **Step 2:** Run; handle flags/skips. Exit gate: remaining `Meteor.call` sites are only annotated stragglers; `npm test` green; nightwatch smoke suite green (UI call paths changed — run it: `npm run validation-tests` or the local nightwatch script).

---

### Task 10: Exit criteria + DevTools verification

- [ ] **Step 1: Sweep**
```bash
./scripts/verify-rpc-methods.sh          # raw blocks 0; straggler call sites only
npm run test:rpc && npm test             # PASS
```
- [ ] **Step 2: DevTools check (manual, the payoff moment):** boot, open the app, perform a UI action (e.g. save a resource); confirm the Network tab shows a `/api/rpc` POST with the method name and JSON payload/response; trigger a streaming method and watch the EventStream tab.
- [ ] **Step 3: OpenRPC artifact:** `curl -s ... rpc.discover | jq .result > docs/openrpc.json`, commit it as the living API document (regenerate in CI later).
- [ ] **Step 4:** `graphify update .`; final commit — `"feat(rpc)!: Meteor.methods migrated to ServerMethods/JSON-RPC (DDP shim retained)"`

## Self-review notes (applied)

- Spec coverage: registry+naming+errors+OpenRPC (T1), pipeline+shim+authorizer+`Meteor.ServerMethods` (T2), hand-written auth (T3), Streamable-HTTP endpoint incl. batch/notifications/SSE (T4), client + `Meteor.rpc` + error rehydration (T5), verification (T6), exemplar (T7), definitions loop with enforcement (T8), call-site loop (T9), kill-switch honored (T4 mount gate), MCP bridge deliberately out of scope per spec.
- Read-then-adapt points are limited to two precisely-anchored seams (FhirAuth return shape in T3; CaslAccessControl API in T2 Step 4) — both hand-written tasks, not loop territory.
- `positionalParams` shim adapter added in T8 Step 1 note — backfills T2 if missed; has its own test requirement.
