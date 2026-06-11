# core/ — Honeycomb Distribution Packages

NPM workflow packages that **ship with the honeycomb core distribution**.
This directory is the NPM-era successor to the old Atmosphere `packages/*`
clinical modules (the ones historically force-added through `.gitignore`).

## Directory Contract

| Aspect | Convention |
|--------|-----------|
| Git | **Tracked normally in this monorepo** — no force-add, no nested repo |
| License | **Apache-2.0** (the main app is heading to AGPL; core packages stay permissive) |
| npm scope | `@node-on-fhir/` |
| Visibility | Part of the public/core distribution |
| Format | Identical to all package dirs: `package.json` + `workflow.json` + `client.js` + `server.js` (see `npmPackages/CLAUDE.md`) |
| Registration | Entry in `workflows/workflows.json` (`serverEntry: "./server"`); enabled via `EXTRA_WORKFLOWS` or `enabled: true` |
| Workspaces | Covered by the `core/*` glob in root `package.json` — run `npm install` after adding a package |

## What Belongs Here

- Migrated clinical/ONC Atmosphere packages (the Tier A compliance cohort:
  immunization-registry, lab-test-reporting, case-reporting, ...)
- Reference/template packages (e.g. example-workflow when it moves)
- Anything intended for every honeycomb deployment

**Not here**: personal/private/mission-specific packages → `extensions/`
(gitignored, nested repos, UNLICENSED). In-transition legacy packages →
`npmPackages/` (drains over time).

## How Packages Resolve

The workflow parser (`workflows/rspack.workflowParser.js`) resolves packages
**by name** via `require.resolve()` → node_modules symlinks. Directory
location is purely organizational; moving a package between dirs is
`mv` + `npm install` — nothing else changes.

## Related

- Package format & patterns: `npmPackages/CLAUDE.md`
- Migration command: `.claude/commands/migrate-atmosphere-package.md`
- Sibling contract: `extensions/CLAUDE.md`
- Campaign docs: `MIGRATION-INVENTORY.md`, `FABLE-TECH-DEBT-PAYDOWN.md`
