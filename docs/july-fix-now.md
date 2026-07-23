# July Fix-Now List

> The four sharpest findings from the 2026-07-23 architectural assessment —
> the items that are security- or regression-critical *today*, separated out
> from the broader ledger. Companions:
> [july-next-five-moves.md](july-next-five-moves.md) (ranked checklist),
> [july-tech-debt-analysis.md](july-tech-debt-analysis.md) (full analysis).
>
> Everything here is either an active exposure on deployed instances
> (care-commons.app included) or a silent-regression trap on a
> security-critical surface.

---

## 1. Unauthenticated `test.*` methods ship in production 🔴

**Where**: `server/main.js:659-708`

`test.accounts`, `test.createUser`, `test.checkExistingUser`, `test.listUsers`
are registered unconditionally via raw `Meteor.methods` — no `this.userId`
check, no environment gate. On every deployment this means, over DDP:

- **anonymous account creation** (`test.createUser` → `Accounts.createUser`)
- **user enumeration** (`test.listUsers` returns `_id`, username, email,
  createdAt for every user; `test.checkExistingUser` confirms
  username/email existence)
- accounts-config disclosure (`test.accounts` returns `Accounts._options`)

**Fix** (~15 min): gate the whole `Meteor.methods({...})` block behind
`Meteor.isDevelopment || process.env.ENABLE_TEST_METHODS === 'true'` — or
better, move them into the ServerMethods pipeline with `requireAuth` +
an admin role, since they're also among the 16 raw-`Meteor.methods`
stragglers outside the pipeline.

**Verify**: from an incognito browser console on a production profile,
`Meteor.call('test.listUsers', cb)` must return `Method not found`.

---

## 2. `jwt.decode()` on the SMART session-token path 🔴

**Where**: `server/lib/FhirAuth.js:345`

```js
let decodedSessionToken = jwt.decode(sessionToken, {complete: true});
```

Signature is **not validated** on this path — and the code knows it
(lines 352-353 log "jwt.decode() should be replaced with jwt.verify()").
The subsequent login-token hash lookup mitigates full bypass, but a
self-documented signature-validation gap on an auth path is fragile: any
future change that trusts a claim from `decodedSessionToken` before the
hash lookup becomes a forgeable-token bug.

**Fix — RESOLVED 2026-07-23 (by deletion, not verify)**: investigation showed
the decode block was a fossil from an abandoned SMART session-JWT design —
the extracted `authToken`/`userId` were **never consumed** (only logged), no
`jwt.sign` site anywhere produces the `{data:{token,userId}}` shape, and the
real authentication on this path is the raw header value hashed against
`services.resume.loginTokens`. There is no signing counterpart to verify
against, so the decode (and the now-unused `jsonwebtoken` import) was deleted
outright — which makes the "future change trusts a forgeable claim" failure
mode impossible, and removes 4 warn-level log lines that fired on every FHIR
request.

**Verify**: `grep jwt.decode server/lib/FhirAuth.js` returns nothing; FHIR
REST auth still works (login-token hash path unchanged).

**Flagged follow-up (not done)**: FhirAuth's login-token hash lookups do NOT
enforce token expiry (`RpcAuth.js` does, and says so in its header comment).
`/api/rpc` is covered; the FHIR REST endpoints accept expired-but-present
resume tokens. Mirror RpcAuth's `when` + `Accounts._getTokenLifetimeMs()`
check on FhirAuth's two lookup sites.

---

## 3. Endpoint layer runs ZERO automated tests in CI 🟠

**Where**: `tests/mocha/` (6 files) · issue #171

`tests/mocha/rpcAuth.test.js` and `serverMethods.test.js` target exactly the
right things (RpcAuth, the ServerMethods pipeline) — but the
meteortesting:mocha harness **runs 0 tests under the rspack build**. The file
headers say so themselves; the suite was last verified *manually via curl* on
2026-07-22. Beyond that:

- `server/FhirEndpoints.js` (3,081 lines) — no automated coverage of any kind
- `server/OAuthEndpoints.js` (2,433 lines) — none
- No Nightwatch test hits `/api/rpc`, `/baseR4/metadata`, or any OAuth endpoint

The entire security-critical middleware chain — the thing the July RPC
campaign was built to guarantee — can regress silently. This is the highest
risk-reduction-per-hour item in the codebase; it's #1 in the moves checklist.

**Fix** (either path closes the gap):
- Fix #171 (meteortesting:mocha under rspack), or
- Add a curl-based CI smoke job against a booted server: `rpc.discover` + one
  authed method (expect 401 unauthenticated, 200 authenticated),
  `/baseR4/metadata` returns a CapabilityStatement, token endpoint rejects
  bad credentials. Wire into the `parallel-tests` workflow.

**Verify**: break `RpcAuth.js` deliberately on a branch — CI must go red.

---

## 4. The safety net is built but unplugged 🟠

The enforcement tooling from the June paydown exists and works — and nothing
runs it automatically:

| Guard | State | Fix |
|---|---|---|
| `scripts/audit-global-collections.js` | exits 1 on contract drift; **not in CI** | add CI step |
| `imports/lib/WorkflowRegistry.test.mjs` | exists; **not picked up in CI** | include in `test:lib` discovery |
| `workflows/rspack.workflowParser.js` | 674 load-bearing lines; **zero tests** (also: `generate()` runs twice per build) | dedicated `node --test` unit test |
| Secret scanning | **absent** — July 1 audit found force-committed secrets (Galaxy token, RSA private key); CodeQL covers SAST only | gitleaks/trufflehog CI gate |

One afternoon of `.circleci/config.yml` wiring converts all four from
"caught if someone looks" to "structurally impossible."

**Verify**: introduce a bogus `global.Collections.Nope` reference and a fake
AWS key on a branch — both must fail CI.

---

## 5. Runtime bugs surfaced by the 2026-07-22 browser-log audit 🟠

Reading one lunar-sim session's console front to back exposed three real
defects (not log cosmetics). The PII-dump tier from the same audit is already
fixed (`6124e47e`: PatientSidebar + accounts-startup dumped full user objects
past the Logger redaction net).

### 5a. interstate-interoperability: broken upsert — 52 errors per page mount

**Where**: `extensions/interstate-interoperability/client/InteroperabilityToolkitPage.jsx:541`

```js
await db.Locations.upsert(location, function(error, result) { ... });
```

`upsert(selector, modifier, [options], [callback])` — the callback lands in
the **modifier** slot, so every one of the 52 US-state Location inserts fails
on every visit to `/interstate-toolkit` (and client-side writes without allow
rules would be denied anyway). **Fix**: insert via a proper idempotent path
and collapse the 52 per-record `console.log`s into one summary.

### 5b. interstate-interoperability: raw throw → `-32603 Internal error`

**Where**: the server side of `interstateInteroperability.getGoogleMapsApiKey`

When no Maps key is configured the method throws a raw error, which the RPC
registry maps to `-32603` with no detail (by design — internal errors must not
leak). The client literally documents that it expects `'api-key-not-found'`.
**Fix**: throw `Meteor.Error('api-key-not-found', ...)` per the settings-gated
feature pattern so the client gets the clean, expected shape.

### 5c. timelines: still on deprecated guard wrappers

**Where**: `TimelineSidescrollPage.jsx:63-64` (@orbital/timelines)

Fires the PR #169 deprecation warnings on every load:
`Meteor.NoDataWrapper` → `DataGuard`, `Meteor.NotSignedInWrapper` →
`AuthGuard` (`imports/ui/guards/`). Two-line migration.

### 5d. React DOM-prop leaks (cosmetic tier)

- `headerHeight` prop leaks onto a DOM `<div>` via fhirStarter's `PageCanvas`
  (rendered by provider-directory's `MainPage`)
- `VhDirFooterButtons` passes `className` to MUI `ThemeProvider` (unsupported)
- MUI `Icon`/`SvgIcon` defaultProps warnings — framework-level, tracked only

**Verify**: load `/interstate-toolkit`, `/provider-directory`, and a timelines
page with a clean console — zero errors/warnings from 5a-5c.

---

## 6. Console-logging debt: the mechanical sweep 🟡

The same audit showed the boot path is a census of every logging era —
messages that never hit `Logger.for()` bypass thresholds, structured output,
and the PHI redaction net. Convert to the standard pattern
(`[Module]` brackets, objects in the `data` arg, per-request chatter at
`debug`):

**Boot-path files (monorepo)**: client `core-startup.js`, `collections.js`,
`session-overrides.js`, `patient-subscription-tracker.js`,
`PatientSubscriptionManager.js`, the module-toggle `index.js` lines
(accounts/analytics/chat/notifications), DICOM `index.js` (also **stop dumping
the entire `Meteor.settings.public`**), `cornerstone-setup.js`, pacio client
`startup.js`, the stray raw line in `PacioSubscriptions.js:80`, MCP
`client.js:914` (dumps a 12-route array), `Meteor.Tables` registration
`index.js:184`.

**Special cases**:
- `imports/workflows/loader.js` is **generated** — the fix belongs in the
  emitter template inside `workflows/rspack.workflowParser.js`.
- `imports/lib/WorkflowRegistry.js` mixes Logger and raw console in the same
  file — unify.

Already done (`6124e47e`): PatientSidebar, accounts-startup, Footer,
FhirResourcesDashboard — zero live raw console calls in those four.

**Verify**: reload the app; every boot line in the console carries a
`[Module]` prefix and no message interpolates a data object into the string.

---

## Sequencing

1 and 2 are same-day diffs — do them first, they're live exposure.
3 and 4 are each roughly an afternoon and convert this month's refactoring
gains into guarantees that survive the next contributor.
5a/5b/5c are small, isolated diffs (two nested extension repos + one page);
6 is an hour of mechanical conversion — both slot in anywhere.
