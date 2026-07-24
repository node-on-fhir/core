# RPC Method Testing

How the 550+ `ServerMethods` registry methods get automated coverage. Two
stages: Stage 1 (SHIPPED) tests methods over the wire against a booted app;
Stage 2 (DESIGNED, below) is true isolated unit testing. Companion history:
issue #171 (meteortesting:mocha runs 0 tests under the rspack build) is what
made both necessary.

## Layered coverage map

| Layer | What | Where it runs |
|---|---|---|
| Registry core unit tests | name rules, collision semantics, error mapping (`test:rpc`, 10 tests) | `lib-unit-tests` CI job, no server |
| Endpoint smoke battery | 11 curl checks: discover/auth/validation/batch/metadata | every `test-group` job + the dedicated job |
| **Conformance sweep** | every registered method called once — must not `-32603` | dedicated `rpc-method-tests` job (FULL) · locally in read-safe mode |
| **Method suites** | hand-written CRUD round-trips, auth matrix, error shapes | dedicated job + locally |
| Nightwatch E2E | full browser flows | test-group jobs |

## Stage 1 (shipped): API-level tests over JSON-RPC

Everything lives in `tests/rpc/` and talks to a **booted server** through
`POST /api/rpc` — real pipeline, real Mongo, no browser, no Meteor test
harness. Pure node (`node --test`), zero npm dependencies.

```bash
# Locally, against any dev server (safe: read-shaped methods only)
npm run test:rpc-methods

# Point elsewhere / open the sweep up (see safety tiers)
RPC_BASE_URL=http://localhost:3000 RPC_SWEEP=write npm run test:rpc-methods
```

### The harness — `tests/rpc/lib/rpcClient.mjs`

`rpcEnvelope(method, params, {token})` (full envelope, never throws on RPC
errors), `rpcCall` (result-or-throw), `mintToken()` (real resume token via the
`rpcTest.mintLoginToken` fixture — non-production only, like all `rpcTest.*`),
`discover()` (the LIVE OpenRPC document — truthier than the committed
`docs/openrpc.json` snapshot).

**Role pinning**: `mintLoginToken` accepts `{ username, roles }`. Role-gate
tests must ALWAYS pin roles — `settings.private.accounts.defaultRole` varies
by deployment profile (the lunar-sim profile grants every new user
`healthcare practitioner`; a test assuming "new user = no roles" passes on one
profile and fails on another).

### The conformance sweep — `tests/rpc/conformance.test.mjs`

Walks the live OpenRPC document and calls **every registered method** with
schema-derived minimal params and an authenticated token, asserting one
property:

> **No method may crash internally (`-32603`) on well-formed input.**

Mapped application errors are *passes* — `not-authorized`, `not-found`,
`validation-failed`, `feature-disabled` are the pipeline doing its job. Only
an internal crash fails. On its first run this property surfaced **17 real
handler bugs** (see the ratchet below) — the same class as the
`context.log`-as-function bug that broke 17 methods across five extensions.

**Safety tiers** (`RPC_SWEEP`): `read` (default — only read-shaped methods,
safe against any dev DB) · `write` (adds create/update-shaped) · `all` (adds
destructive-shaped — only the CI job runs this, against its own boot-fresh
database that dies with the job). Skipped tiers are reported loudly with
names — a bounded sweep must never read as full coverage.

**The ratchet — `tests/rpc/conformance-known-failures.json`**: methods that
`-32603` today are baselined with triage notes; they're reported but don't
fail CI. Any method NOT in the baseline that crashes **fails**. When a
baselined method stops crashing the sweep prints `FIXED — remove from
baseline`. Never add to this file without a note; the burn-down direction is
down. Exemplar of the loop: `encounters.get` was baselined for ten minutes —
its *not-found path* called `Encounters.countAsync()` (not a collection
method), so the error path itself crashed. One-line fix, removed same day.

### Method suites — `tests/rpc/methods/`

Hand-written depth for crown-jewel methods. `medications.test.mjs` is the
pattern file: create → get → update → verify → remove → verify-gone, all over
the wire, self-cleaning, ~300ms total. `pipeline.test.mjs` covers the auth
matrix (exact codes + HTTP statuses), pinned-role gating in both directions,
AJV rejection, alias resolution, and the in-process `invoke()` path.
`compositions.test.mjs` is a standing regression test that core owns
`compositions.insert` (the name whose collision zombie-booted the lunar sim).

### The CI job — `rpc-method-tests`

Boots the app with the default workflow set against a **Mongo sidecar**
(`meteor_rpc_test` — ephemeral, dies with the job), waits, runs the smoke
battery, then `RPC_SWEEP=all npm run test:rpc-methods`. This is also the
named status check for endpoint health in the PR checks list.

## Stage 2 (designed, not built): isolated unit tests

Goal: **sub-second, no-server** tests for individual handlers — the inner
dev loop Stage 1's booted-app requirement can't provide, and the honest fix
for #171.

What the rpc migration already bought us: every handler is
`async (params, context)` — no `this`, context injected, `Meteor.ServerMethods.define`
the only registration path. The remaining blockers are the module graph and
the database:

1. **Module stubs**: handler files import `meteor/meteor`, `meteor/check`,
   `meteor/random`, `meteor/mongo`, and `/imports/...` absolute paths. A
   node `--import` customization hook (module `resolve`/`load`) maps
   `meteor/*` to a stub package (`tests/rpc/stubs/meteor.mjs`: `Meteor.Error`,
   `check` no-op or real, `Random.id`, `Mongo.Collection` backed by...) and
   rewrites `/imports/...` to repo-relative paths.
2. **Database**: an ephemeral `mongod` (the Meteor dev bundle ships one;
   `mongodb-memory-server` is the npm alternative) + a thin async collection
   adapter implementing `findOneAsync/insertAsync/updateAsync/removeAsync/
   find().fetchAsync()` over the raw driver — the surface handlers actually
   use.
3. **Registration capture**: import a method file under the stub loader;
   `ServerMethods.define` calls land in the real registry (it's plain CJS
   with zero Meteor imports already); tests then run handlers via
   `ServerMethods.runPipeline` with a synthetic context — full auth/validate
   semantics, no transport.
4. **Scope control**: do NOT attempt all 166 method files at once. Start
   with files whose only Meteor imports are the big four above (most of
   `imports/api/*`); files importing `Accounts`, `WebApp`, or package code
   stay Stage-1-only. A loader-level allowlist keeps the boundary explicit.

Estimated cost: the loader + stubs + adapter ≈ 1–2 days; each migrated
method file then gets tests at zero marginal infrastructure. Success
criterion: `imports/api/medications/methods.js` fully unit-tested in <1s
with no meteor process. Revisit after Stage 1 has been in CI for a while and
the known-failures baseline is burned down — the sweep tells us which
handlers most need the fine-grained treatment.

## Related

- `scripts/endpoint-smoke-test.sh` — the 11-check battery (every test-group)
- `imports/lib/ServerMethodsCore.test.mjs` — registry core unit tests
- `.claude/rules/meteor/latency-compensation.md` — client call-site patterns
- Issue #171 — the broken meteortesting:mocha harness both stages route around
- Issue #172 — server-internal `callAsync` migration (Stage 1 tests those
  methods' HTTP faces today; `invoke()` faces after #172)
