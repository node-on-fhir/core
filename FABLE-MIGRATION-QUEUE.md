# Atmosphere→NPM Migration Queue (clean subset)

> Durable ledger for the autonomous overnight ralph loop (2026-06-13). Scope:
> the **clean subset** — ungated, non-frozen, modest-size packages. One package
> per loop iteration. Smallest-first (lunar-maps lesson: shake out issues early).
> Proven 9-step pattern: `.claude/commands/migrate-atmosphere-package.md`.
> Reference migrations: life-support-systems, pantry-management, ecg,
> symptom-tracking, orbital (all in `deprecated/` + `npmPackages/`).

## NON-NEGOTIABLE process hygiene (user is asleep; server is off)

Each iteration, BEFORE booting:
1. **Zombie sweep**: `kill -9` anything on :3000 and :8080; `pkill -9 -f rspack-node`;
   `sleep 2`; verify both ports free AND `pgrep rspack-node` empty. Do NOT boot
   until clean.
2. Boot in background (run_in_background, NO inner `&`), Monitor with a timeout.
3. After boot (success OR fail): TaskStop the boot, zombie-sweep again, restore
   `.meteor/versions` (`git checkout -- .meteor/versions`).

**Honesty gate**: only decommission (move to `deprecated/`) + check the box if
the boot genuinely logged `App running at` with no unresolved-import / build
errors. If a package fails or the boot times out: clean up, leave it in
`packages/`, mark it `SKIP — <reason>` below, and move to the next. NEVER fake a
checkoff. NEVER leave a zombie process when starting a new package.

## Per-package recipe (condensed)

scaffold `npmPackages/{name}` (client/lib/server/data/assets, drop index.jsx/
package.js/.git/.npm/.DS_Store) → convert any `Assets.getText*` NDJSON to JSON
imports → repoint any Atmosphere asset URLs to `/workflows/{name}/` → repoint any
`meteor/<ns>:<pkg>` imports of ALREADY-MIGRATED packages to `@node-on-fhir/*` →
author client.js (routes/sidebar/footer + lib re-exports, PascalCase iconNames),
server.js→server/index.js, package.json (preserve declared license else
UNLICENSED; `Npm.depends`→`dependencies`), workflow.json, .gitignore, CLAUDE.md →
manifest entry (`serverEntry ./server`) → `npm install` → JSON-valid + `node --check`
+ parser `validateWorkflows()` clean → BOOT-VERIFY → nested repo (`npm-migration`
branch; copy `.git` if source has one, else `git init`; do NOT push) → decommission
→ commit (monorepo manifest+lockfile+queue) → boot-verify originals gone (optional
batch).

## Queue (ascending size; check when boot-verified + decommissioned)

- [x] email-list — `clinical:email-list` → `@node-on-fhir/email-list` — DONE
      2026-06-13, boot-verified, decommissioned. Orphan → fresh `git init`
      (npm-migration). meteor/email + ddp-rate-limiter resolve; `mail`→`Mail`.
- [x] syndromic-surveillance — `clinical:syndromic-surveillance` →
      `@node-on-fhir/syndromic-surveillance` — DONE 2026-06-13, boot-verified,
      decommissioned. Was monorepo-tracked (move = git rm); fresh `git init`.
      SidebarElements→sidebarItems (collectionName preserved); `timeline`→`Timeline`.
- [ ] personal-characteristics — `clinical:personal-characteristics`
- [ ] family-health-history — `clinical:family-health-history`
- [ ] case-reporting — `clinical:case-reporting`
- [ ] social-determinants — `clinical:social-determinants`
- [ ] lab-test-reporting — `clinical:lab-test-reporting`
- [ ] cancer-registry-reporting — `clinical:cancer-registry-reporting`
- [ ] antimicrobial-reporting — `clinical:antimicrobial-reporting`
- [ ] immunization-registry — `clinical:immunization-registry`
- [ ] drug-formulary — `clinical:drug-formulary`
- [ ] drug-interactions — `clinical:drug-interactions`
- [ ] secure-messaging — `clinical:secure-messaging`
- [ ] e-prescribing — `clinical:e-prescribing`
- [ ] multi-factor-auth — `clinical:multi-factor-auth`
- [ ] implantable-devices — `clinical:implantable-devices`
- [ ] clinical-lists — `clinical:clinical-lists`
- [ ] checklist-manifesto — `clinical:checklist-manifesto`
- [ ] monetization — `orbital:monetization` (Npm.depends; verify no code-level
      orbital/life-support import)
- [ ] synthea — `clinical:synthea`
- [ ] order-catalog — `clinical:order-catalog`
- [ ] leaderboard-starter — `mitre:leaderboard-starter`
- [ ] patient-chart-starter — `mitre:patient-chart-starter`
- [ ] workqueues — `clinical:workqueues`
- [ ] patient-matching — `clinical:patient-matching`
- [ ] hipaa-compliance — `clinical:hipaa-compliance` (Npm.depends)
- [ ] international-patient-summary — `clinical:international-patient-summary`
- [ ] smart-web-messaging — `clinical:smart-web-messaging`
- [ ] genome-central-redux — `awatson:genome-central-redux` (Npm.depends)
- [ ] request-for-corrections — `clinical:request-for-corrections`
- [ ] structured-data-capture — `clinical:structured-data-capture`
- [ ] healthcare-surveys — `clinical:healthcare-surveys`
- [ ] timelines — `symptomatic:timelines` (Npm.depends; verify no symptom-tracking dep)
- [ ] digital-cloche — `orbital:digital-cloche` (verify no orbital/life-support import)
- [ ] greenhouses — `orbital:greenhouses` (largest clean; Npm.depends; verify no
      life-support import)

## Explicitly EXCLUDED (not this loop)

- **Externally gated** (need non-packages/ Atmosphere deps): accounts-management,
  ccda-export, consent-generator, provider-directory, vital-signs
- **Connectathon-frozen** (active work, defer past 2026-07): pacio-core,
  quality-measures, us-core
- **Huge / multi-session**: mcp (31k), data-importer (25k), data-exporter (17k,
  double-homed)
- **reference-app**: now hard-deps the deprecated `symptomatic:symptom-tracking`
  — defer (repoint when handled)

## Skips / needs-attention (loop appends here)
