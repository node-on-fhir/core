# Meteor.methods → JSON-RPC Method Registry — Design

**Date:** 2026-07-01
**Status:** Approved design (Approach A: registry + dual-mount strangler), pending implementation plan
**Implementer:** Opus 4.8 (fresh session — this doc must stand alone)
**Related:** `2026-07-01-simpleschema-to-jsonschema-migration-design.md` (AJV
param validation), `2026-07-01-structured-logging-design.md` (`Meteor.Logger`,
`log.phi`), `2026-07-01-hipaa-audit-trail-design.md` (EventBus audit).
This effort assumes all three have landed; their components are this design's
middleware stack.

## Problem & Motivation

Survey (2026-07-01): **~378 `Meteor.methods()` blocks in 229 files**
(imports/ 76, server/ 20, npmPackages/ 82, extensions/ 48). Methods are
honeycomb's RPC layer, coupled to DDP: invisible to browser DevTools (opaque
WebSocket frames), uncallable by external services/scripts without a DDP
client, undiscoverable (no schema/doc surface), with auth hand-rolled per
method body (~2,096 `this.userId` refs, 92% of method files) and validation
via `check()` (214 files).

Drivers (all confirmed): MCP/AI-agent access (MCP *is* JSON-RPC 2.0 —
`extensions/mcp` already runs a compliant A2A endpoint at
`extensions/mcp/server/routes/a2aJsonRpcRoute.js`), service-to-service calls,
generated API docs (OpenRPC), curl/CI testability, **browser DevTools
visibility per call**, and **method streaming** (progress/partial results).

Enablers found by survey: **zero client stubs** (`this.isSimulation`: 0 —
latency compensation unused, the hardest DDP feature to replace isn't in
play); only **227 call sites** (126 `Meteor.call`, 101 `Meteor.callAsync`,
0 `Meteor.apply`); centralized REST auth already exists
(`server/lib/FhirAuth.js` — `parseUserAuthorization`: bearer tokens, SMART
2.x scopes, ACL); Express 4.19.2 available; ~65% of method names already
dotted `resource.action`.

**Posture (explicit):** this is not ideological DDP removal. Accounts/login
methods, `this.setUserId` users (2), and any awkward stragglers stay on
Meteor.methods indefinitely. Success = every business method is
*declaratively defined, validated, authorized, audited, and callable over
HTTP* — not "Meteor.methods is gone."

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Approach A: method registry + dual transport mount** | One definition serves both DDP (compat shim — zero call-site breakage during migration, rollback path, straggler home) and HTTP JSON-RPC. Strangler fig, like the Atmosphere exit |
| 2 | **Transport: JSON-RPC 2.0 over Streamable HTTP (MCP-shaped)** at **`POST /api/rpc`** | `POST` with JSON body → `application/json` response (unary) or `text/event-stream` (streaming: progress frames as JSON-RPC notifications, final frame = response). Byte-compatible with MCP's transport; sibling of the existing `/api/a2a` |
| 3 | **Auth: dual-acceptance middleware reusing `FhirAuth`** | `Authorization: Bearer <token>` where token is EITHER an OAuth token (external clients, client-credentials — via `parseUserAuthorization`) OR a Meteor login token (browser — validated against `Meteor.users` hashed token). One resolved `context.userId` + scopes either way |
| 4 | **Declarative per-method metadata is the point of the migration** | `schema` (AJV/JSON Schema params), `roles`/`allow` (pluggable authorizer; default adapter targets the existing `server/lib/CaslAccessControl`), `phi` (audit via EventBus + log redaction), `streaming`, `mcp`, `description`, `aliases`. Ungoverned methods become grep-visible |
| 5 | **Naming enforced at define(): dotted `resource.action`** | Regex-validated. The ~35% non-conforming names get canonical new names + `aliases: ['oldName']` (alias logs a deprecation warning, works on both transports) |
| 6 | **Both loops in scope: definitions (~230 core+npmPackages blocks) then call sites (227)** | Call-site count is small enough to finish the forklift. extensions/ (48 blocks) migrate on their own schedule — registry reachable via `Meteor.ServerMethods` |
| 7 | **Error mapping is fixed and lossless** | `Meteor.Error(error, reason, details)` ↔ JSON-RPC error `{code, message, data:{error, reason, details}}`. Reserved codes per spec (-32700/-32600/-32601/-32602/-32603); app errors -32000..-32099: `not-authorized`→-32001, `feature-disabled`→-32002, `not-found`→-32004, `validation-failed`→-32602, other→-32000 |

## Architecture

### Component 1: `ServerMethods` registry — `imports/lib/ServerMethods.js`

```js
ServerMethods.define('consents.save', {
  description: 'Persist a Consent resource for the active patient',
  schema: 'ConsentSaveParams',       // registered JSON Schema (AJV, FhirValidator.registerSchema)
  allow: { roles: ['clinician'] },   // evaluated by the pluggable authorizer
  phi: true,                         // EventBus audit event per invocation; params/result redacted in logs
  streaming: false,
  mcp: { expose: true },             // visible to the MCP tool bridge
  aliases: ['saveConsent'],          // legacy name, deprecation-warned
  requireAuth: true                  // default true; false only for explicitly public methods
}, async function(params, context) { ... });
```

- `define()` validates the name (`/^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)+$/`),
  rejects duplicates, stores `{options, handler}`.
- **Handler context** (transport-neutral — replaces `this`):
  `{ userId, scopes, transport: 'http'|'ddp', ip, userAgent,
     log: Meteor.Logger.for(name), emit(progress) }`.
  `emit` throws unless `streaming: true`.
- **Registered as `Meteor.ServerMethods`** at startup (both sides for the
  client caller, define() server-only) — same package-accessibility
  convention as `Meteor.Logger`/`Meteor.Collections`, so `npmPackages/*` and
  `extensions/*` define and call without app-absolute imports.
- **DDP shim:** `define()` also registers `Meteor.methods({[name]:...})`
  (and each alias) wrapping the same pipeline: builds context from
  `this.userId`/`this.connection`, runs the identical
  auth→validate→audit→dispatch chain. Behavior is transport-identical by
  construction; streaming methods on DDP run non-streaming (progress dropped,
  final result returned).
- **Introspection:** `rpc.discover` (built-in method) returns a generated
  **OpenRPC** document from the registry (name, description, params schema,
  streaming flag). PHI-flagged methods are included; their schemas are not
  secret, their *data* is.

### Component 2: The middleware pipeline (shared by both transports)

Order, for every invocation:
1. **Resolve auth** → `userId`, `scopes` (HTTP: dual-acceptance below; DDP:
   `this.userId`). If `requireAuth` and no user → `not-authorized` (-32001).
2. **Authorize** → pluggable authorizer, default CASL adapter
   (`server/lib/CaslAccessControl`); `allow: {roles}` evaluated against the
   user. Deny → -32001 with reason.
3. **Validate params** → AJV against `options.schema` (schemas registered via
   `FhirValidator.registerSchema`; params are a single object — JSON-RPC
   named params). Fail → -32602 with OperationOutcome-style detail in
   `error.data`.
4. **Rate limit** → per-method token bucket (HTTP) / DDPRateLimiter rule
   (DDP shim) from `options.rateLimit` (default: none).
5. **Audit (phi methods)** → EventBus lifecycle event
   (`{method, userId, patientReference?, transport}`) — fire-and-forget,
   never blocks (audit-trail spec's non-blocking rule).
6. **Dispatch** handler; **log** start/finish/duration via `Meteor.Logger`
   (params redacted through the logging redaction net; `phi: true` methods
   log params as `{redacted:true}` always).
7. **Map errors** per Decision 7 (HTTP also sets status: 401/403 for -32001,
   400 for -32602/-32600, 404 for -32601, 500 otherwise).

### Component 3: HTTP transport — `server/rpc/JsonRpcEndpoint.js`

- `POST /api/rpc` via `WebApp.handlers` (Express). Body: single JSON-RPC 2.0
  request or batch array (batch cap: 20; streaming methods rejected in
  batches).
- **Unary:** respond `application/json` with the response object.
- **Streaming** (`streaming: true` and client sends
  `Accept: text/event-stream`): respond SSE; `context.emit(progress)` writes
  `{jsonrpc:'2.0', method:'rpc.progress', params:{id, progress}}` notification
  frames; handler return value becomes the final
  `{jsonrpc:'2.0', id, result}` frame; stream closes. (A streaming method
  called without the Accept header runs unary — progress dropped.)
- **Auth middleware** (`server/rpc/RpcAuth.js`): tries
  `FhirAuth.parseUserAuthorization(req)` first (OAuth/SMART); on miss, treats
  the bearer value as a Meteor login token — SHA-256 hash, look up
  `Meteor.users` `services.resume.loginTokens.hashedToken`, honoring token
  expiry. Both yield the same context shape.
- JSON-RPC notifications (no `id`) are accepted, run, and get no response
  body (spec-required).

### Component 4: Client caller — `imports/lib/rpcClient.js`

```js
import { rpc, rpcStream } from '/imports/lib/rpcClient';
const result = await rpc('consents.save', { consent });
await rpcStream('bulkExport.run', { types }, { onProgress: fn });   // SSE
```
- Browser: `fetch('/api/rpc')` with the Meteor login token
  (`Accounts._storedLoginToken()`) as bearer. Server-side callers: loopback
  fetch with a service token, OR — preferred for server→server within the
  same process — `ServerMethods.invoke(name, params, contextOverrides)`
  which runs the pipeline in-process (no HTTP hop; replaces the ~60% of
  `Meteor.callAsync` sites that are internal orchestration).
- Also exposed as `Meteor.rpc` / `Meteor.rpcStream` for packages.
- Errors rehydrate to `Meteor.Error(data.error, message, data.details)` so
  existing `catch (error) { error.error === 'not-authorized' }` code keeps
  working after call-site conversion.

### Component 5: MCP bridge (thin, in `extensions/mcp` — out of monorepo scope, documented contract)

The MCP extension reads `Meteor.ServerMethods.list({mcp: true})` and
registers each as an MCP tool (name, description, params schema →
inputSchema), dispatching through the same pipeline with the MCP session's
auth context. Streaming methods map to MCP's streamable responses. No new
protocol work — both sides are JSON-RPC over Streamable HTTP.

### Migration mechanics (two ralph loops)

**Loop 1 — definitions** (~230 blocks in imports/, server/, npmPackages/;
extensions/ excluded): per file, each `Meteor.methods({...})` block converts
to `ServerMethods.define(...)` calls. The loop is *the enforcement pass*:
- name normalized to dotted form (+ `aliases` for the old name if renamed);
- `if (!this.userId) throw` boilerplate deleted → `requireAuth: true`
  (methods *lacking* the guard get explicit `requireAuth: false` **only** if
  genuinely public, else the guard was a bug — flag it);
- `check()` calls transpiled to a registered JSON Schema (`<Method>Params`);
- patient-data methods marked `phi: true`;
- `this.connection` uses → `context.ip`/`context.userAgent`;
- `this.unblock()` (4 sites) deleted (no-op over HTTP; DDP shim calls it
  automatically before dispatch).
Skip-list rule for anything non-template (accounts methods, `setUserId`).

**Loop 2 — call sites** (227): `Meteor.call/callAsync(name, a, b, cb)` →
`await rpc(name, {..named params})` (client) or
`await ServerMethods.invoke(name, {...})` (server). Positional-arg methods
gain named-params at definition time (Loop 1 records the param names in the
schema), so Loop 2 is mechanical. Callback-style call sites convert to
async/await.

**Retirement criterion:** `Meteor.methods(` appears only in
`ServerMethods.js` (the shim), accounts code, and the skip list.

### Settings

```json
"private": { "rpc": {
  "enabled": true,
  "batchLimit": 20,
  "deprecationWarnings": true
} }
```
`enabled: false` unmounts `/api/rpc` (DDP shim keeps everything working) —
the kill switch during rollout. Absent keys: enabled true, defaults as shown.

### Out of scope

- Removing DDP/publications (subscriptions are untouched; reactivity via
  oplog is write-path-independent).
- Accounts/login/password methods and `this.setUserId` flows (stay DDP).
- extensions/* method conversion (registry is available to them via
  `Meteor.ServerMethods`; they migrate on their own schedule).
- Client offline queueing / retry semantics beyond fetch + error surfacing.
- The MCP extension changes themselves (contract documented above).

## Testing

1. **Unit (`node --test`):** name regex + alias handling; error mapper
   (both directions, all reserved + app codes); OpenRPC generation shape;
   pipeline order with fake transport (auth short-circuits before validation;
   validation before dispatch; audit fire-and-forget).
2. **Integration (meteortesting:mocha):** define a fixture method; call it
   via (a) DDP shim `Meteor.callAsync`, (b) HTTP unary (loopback fetch with
   login token), (c) HTTP batch, (d) SSE streaming (progress frames + final
   result); assert identical results/errors across transports; auth matrix
   (no token / bad token / OAuth token / login token / insufficient role);
   alias deprecation warning fires once.
3. **Loop verification:** per file — `grep -c "Meteor.methods(" <file>` = 0,
   parse check, `rpc.discover` includes the file's methods, one round-trip
   call per converted method name via loopback HTTP (smoke script
   `scripts/verify-rpc-methods.sh`).
4. **Exit:** both loops' criteria; `npm test` green; DevTools manual check —
   a UI action shows a `/api/rpc` entry with named method + JSON payload.

## Risks

- 🔒 **Auth middleware is the security-critical surface** — dual-acceptance
  must not create a confused-deputy path (login-token acceptance is
  hashed-lookup only, no token minting; OAuth path is existing FhirAuth).
  This component is hand-written with its own test matrix, never
  loop-generated.
- 🎯 Methods whose `check()` args were positional lose exact call
  compatibility — mitigated by Loop 1 recording named-param schemas and the
  DDP shim accepting BOTH the legacy positional signature and a single
  params object during the transition (shim inspects arity).
- 💥 In-process `invoke()` skipping HTTP means server-internal calls bypass
  rate limiting — deliberate (they're trusted), documented.
- 🐛 SSE through proxies/load balancers needs `X-Accel-Buffering: no` /
  flush-per-frame — set explicitly; Galaxy/nginx notes in the endpoint file.
- 😭 227 call sites converted but one missed → it still works (DDP shim!).
  The strangler design makes the failure mode "deprecation warning in logs,"
  not "broken feature."

**But remember:** the A2A endpoint proves the transport in this exact stack;
zero client stubs means the hard DDP feature was never used; and the shim
means every intermediate state of this migration is a working app.
