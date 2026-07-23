<!-- .claude/ralph/jsonrpc-definitions-prompt.md -->
# Meteor.methods -> ServerMethods.define loop — one FILE per iteration

Cohort order (nightwatch gate between cohorts — see the orchestration plan):
C1 = imports/ + server/ (main app), C2 = npmPackages/. Pick the first file in
the ACTIVE cohort:

    grep -rl "Meteor\.methods(" <cohort dirs> --include="*.js" \
      | grep -v "imports/lib/ServerMethods.js" | grep -v "imports/accounts" | sort | head -1

None left in either cohort -> run ./scripts/verify-rpc-methods.sh; if
files-with-raw = 0, STOP (complete).

## The two committed exemplars (read BOTH before your first file)

- `npmPackages/provider-directory/server/methods.js` — the LARGE-file
  template: bodies stay in the legacy map, each method gets a declarative
  `Meteor.ServerMethods.define()` with an explicit params adapter, and the
  `aliasIfFree()` helper guards legacy-name collisions.
- `imports/api/serverConfiguration/methods.js` — the GUARD-HEAVY inline
  template: bodies move into the define() handler; `if (!this.userId) throw`
  deleted (requireAuth default true); `check()` -> `schemaObject` JSON Schema;
  positional signatures -> `positionalParams`; `this.userId` ->
  `context.userId`; console.log -> `context.log`.

## Per file

1. Inventory every method: name, params (positional?), this.userId guard?,
   check() calls, this.connection/this.unblock/this.setUserId usage,
   PHI-touching?
2. SKIP (append to .claude/ralph/jsonrpc-skipped.md with reason) if: uses
   this.setUserId, is an accounts/login/password method, or you cannot
   determine what it does.
3. Convert each method to Meteor.ServerMethods.define with:
   - dotted canonical name (`resource.action`; regex
     `^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)+$`) + `aliases: ['oldName']`
     when renamed (use aliasIfFree() if the legacy name may be claimed by core);
   - requireAuth semantics per the exemplars: guard deleted -> default true;
     NO guard historically -> `requireAuth: false` ONLY if genuinely public
     (add a comment saying why), else leave the default true and NOTE the
     behavior change in the commit message;
   - `schemaObject` transpiled from the check() calls; positional args become
     named params recorded in `positionalParams` (order matters — it feeds the
     DDP shim's adapter);
   - `phi: true` where patient data flows;
   - `description`: one sentence (REQUIRED — feeds OpenRPC + MCP discovery);
   - `context.userId` / `context.ip` replacing this.*; `this.unblock()` deleted.
4. Grep for internal callers passing positional args to renamed/re-signatured
   methods: `grep -rn "callAsync('<legacy>'\|call('<legacy>'" imports/ server/
   npmPackages/ client/` — leave call sites ALONE (Loop 2), but make sure
   `positionalParams` covers every positional caller's argument order.
5. Verify: `./scripts/verify-rpc-methods.sh <file>` (must print OK).
6. Commit: `refactor(rpc): convert <file> to ServerMethods` (+ behavior-change
   notes; Claude Code co-author trailer).

RULES: one file per iteration; never touch imports/lib/ServerMethods.js,
server/rpc/*, imports/accounts/*, extensions/*; never delete a method;
description is mandatory; NEVER register a method name already registered by
another file (search first — duplicate define() throws at boot).
