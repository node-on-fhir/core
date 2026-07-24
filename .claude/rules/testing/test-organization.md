# Test File Organization

## The tier model — placement is determined by what a test NEEDS to run

| Tier | What it tests | Needs | Location | Runner |
|------|---------------|-------|----------|--------|
| **Unit** | one pure module in isolation | nothing (no server, no Mongo, no browser) | **`tests/unit/` mirroring source** | `node --test` |
| **Integration** | a booted server over its real transport | running app + ephemeral Mongo | `tests/rpc/` (methods/, lib/, conformance) | `node --test tests/rpc/` |
| **E2E** | full browser + UI flows | running app + Chrome | `tests/nightwatch/` | Nightwatch |
| **Certification** | ONC (g)(10) behavioral evidence | per-suite | `certification/tdd/` | node --test |

## Go-forward rule for unit tests: `tests/unit/` mirrors the source tree

A fast, pure `node --test` unit test lives under `tests/unit/` at the path
mirroring its subject:

```
server/lib/verifyClientAssertion.js
  → tests/unit/server/lib/verifyClientAssertion.test.mjs

imports/lib/Logger.js
  → tests/unit/imports/lib/Logger.test.mjs
```

The test imports its subject by relative path across the tree
(`../../../../server/lib/verifyClientAssertion.js`). Bare-specifier deps
(`jsonwebtoken`, etc.) resolve from the root `node_modules` as usual.

**Why separate-tree over colocated** (the decision, 2026-07-24): keeping source
directories free of interleaved `*.test.mjs` files as the fast-test tier grows,
at the cost of the test no longer sitting beside its subject. A deliberate
trade — chosen so `ls server/lib/` stays readable.

## CI wiring

Each unit test gets a `test:<name>` script in `package.json` pointing at its
`tests/unit/...` path, run in a CI job that has `node_modules`:

- **Dependency-free** unit tests (no npm imports, only node builtins) → the
  `lib-unit-tests` job (bare checkout, no `npm install`).
- **Tests importing npm packages** (e.g. `jsonwebtoken`) → a job that has run
  `npm install`, e.g. `rpc-method-tests`. `verifyClientAssertion.test.mjs`
  imports `jsonwebtoken`, so it runs there via `npm run test:oauth-assertion`.

⚠️ Do not add an npm-importing unit test to `lib-unit-tests` — it fails with
"Cannot find module" on the bare checkout (`lib-test-tier` constraint).

## Migration status (honest accounting)

`tests/unit/` is the go-forward home. ~63 existing unit tests are still
**colocated** next to their source (`imports/lib/Logger.test.mjs`,
`server/lib/CaslAccessControl.parity.test.mjs`, …) from the prior convention.
They are migrated into `tests/unit/` opportunistically (updating their
`test:*` script path when moved), NOT in a big-bang PR mixed into feature or
security work. Until migrated, both layouts coexist — the `test:*` scripts in
`package.json` are the source of truth for where each test actually lives.

## Related

- Integration-test harness: `docs/RPC-TESTING.md`, `tests/rpc/lib/rpcClient.mjs`
- E2E patterns: `.claude/rules/testing/crud-patterns.md`, `stability.md`
- File naming: `.claude/rules/conventions/file-naming.md`
- lib-test-tier constraint (bare checkout, no npm install): memory `lib-test-tier-constraints`
