<!-- .claude/ralph/jsonrpc-callsites-prompt.md -->
# Loop 2 — CLIENT-UI call sites: Meteor.call/callAsync -> Meteor.rpc

Scope: client-side UI files only (imports/ui*, imports/components, imports/patient,
imports/ui-fhir, imports/ui-vault-server, imports/ui-modules, imports/ui-tables,
imports/ui-consent-engine, npmPackages/*/client). Server-internal callAsync sites
are DEFERRED (issue #172) — do NOT touch server/ or npmPackages/*/server.

## The method map

`/tmp/rpc-method-map.json` maps every callable name (canonical AND legacy alias) ->
`{ canonical, params }` where `params` is the ordered positionalParams array (or
null = the method takes a single object). ALWAYS look up the name you're converting:

```
node -e "const m=require('/tmp/rpc-method-map.json'); console.log(JSON.stringify(m['<name>']))"
```

## Committed exemplar (read it)

`imports/ui-fhir/conditions/ConditionDetail.jsx` — commit "refactor(rpc): migrate
ConditionDetail call sites to Meteor.rpc (Loop 2 exemplar)".

## Transform per call site

Look up the called name in the map to get `canonical` + `params`.

- **Single-object method** (`params` null): `Meteor.callAsync('x', obj)` ->
  `Meteor.rpc('x.canonical', obj)`. (Usually the arg is already the params object.)
- **Positional method** (`params: ['p1','p2']`): `Meteor.callAsync('x', a, b)` ->
  `Meteor.rpc('x.canonical', { p1: a, p2: b })` in the map's param order.
- Use the CANONICAL name (not the legacy alias) at the call site.
- **Callback style** `Meteor.call('x', a, cb)`: convert to async/await —
  `try { const r = await Meteor.rpc('x.canonical', {..}); /* cb success body, s/result/r/ */ } catch (error) { /* cb error body */ }`. Make the enclosing function `async` if needed. Meteor.rpc REHYDRATES Meteor.Error, so `error.error`/`error.reason`/`error.message` branches are unchanged.
- **Already `await Meteor.callAsync`**: just swap to `Meteor.rpc` + named params; error handling is already correct.

## Rules

1. One file per iteration; parse-check after (`node -e "require('@babel/parser').parse(require('fs').readFileSync('<f>','utf8'),{sourceType:'module',plugins:['jsx']})"`).
2. If a called name is NOT in the map: it's either a DDP straggler (accounts/login: `Meteor.loginWithPassword`, `logging.*` before conversion, anonymous.*/vpn.*/mobile.enableBiometric, oauth2/authCodeGrant, accounts-management, updateUserRoles, revokeUserTokens) or a Loop-1 miss. Leave it as `Meteor.call`, add `// rpc-migration: ddp-straggler` above it, and note it in your report. Do NOT guess a canonical name.
3. Behavior-preserving ONLY: never change error branches, navigation, state updates, or success logic — just the transport call + param shape.
4. `Meteor.call` vs `Meteor.callAsync` both become `Meteor.rpc` (always returns a promise).
5. Publications (`Meteor.subscribe`) are NOT methods — leave them.
6. Never touch server files, extensions/, or the ServerMethods/rpc infra.

RETURN a terse table: file | #sites converted | #stragglers left | any flags.
