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
