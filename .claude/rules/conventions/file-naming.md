# File Naming Conventions

## The rule (make the implicit explicit)

This repo has a real, consistent file-naming rule that was never written down —
which meant every new file re-litigated it. It is:

| Style | Use when the module's primary export is… | Examples |
|-------|------------------------------------------|----------|
| **PascalCase** | a class, singleton, or namespace object (a "thing") | `FhirAuth.js`, `Logger.js`, `CaslAccessControl.js`, `BaseModel.js`, `FhirUtilities.js`, `GridFSManager.js` |
| **camelCase** | a bare function or small set of functions (an "action") | `warnOnce.js`, `rpcClient.js`, `loggerRedact.js`, `sexForClinicalUse.js`, `globalCollections.js`, `verifyClientAssertion.js` |
| **PascalCase** | a React component | `PatientSidebar.jsx`, `ObservationsPage.jsx` |

**Test the export, not the topic.** `verifyClientAssertion.js` exports the
function `verifyClientAssertionSignature()` → camelCase. Renaming it to
`VerifyClientAssertion.js` would *mislead*, because PascalCase in this repo
signals "this is a class/namespace you instantiate or reach into," which a
pure function is not.

## Why not "PascalCase everything" or "kebab-case everything"

Both are defensible in the abstract, but this repo already made its choice at
scale (~85% PascalCase modules / a principled camelCase minority for
function-utilities). The camelCase-vs-PascalCase split *carries information*
(thing vs action) that a uniform scheme would erase. kebab-case has almost no
precedent in `server/` (only `verify-methods.js`) and would be the largest
churn for the least signal. Changing the scheme is a repo-wide decision, not a
per-file one — don't half-migrate.

## Scope note

This documents the go-forward rule for NEW files. Existing files that don't fit
are migrated opportunistically when touched, never in a dedicated churn PR.

## Related

- Test files follow their own placement rule: `.claude/rules/testing/test-organization.md`
- File-header convention (path/name as first commented line): root `CLAUDE.md` § Coding Style
