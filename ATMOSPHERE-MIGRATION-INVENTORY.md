# Atmosphere → NPM Migration Inventory

> Backlog item from [FABLE-TECH-DEBT-PAYDOWN.md](FABLE-TECH-DEBT-PAYDOWN.md)
> § "P1 — Finish the Atmosphere→NPM migration". Generated 2026-06-12 on branch
> `fable-tech-debt-paydown` by sweeping every `packages/*/package.js` for size,
> cross-package `api.use` dependencies, and git posture.

## Summary

- **55 directories** in `packages/` (54 Atmosphere packages + shared CLAUDE.md).
- **41 monorepo-tracked** (force-added past the gitignore), **13 nested git
  repos**, and **1 orphan** (see anomalies).
- Already migrated to NPM: **lunar-maps** (original parked in `deprecated/`).
- NPM side has 14 packages in `npmPackages/`. The documented `core/` and
  `extensions/` directories **exist but are scaffolding-only** (each holds just
  a `CLAUDE.md`, no migrated packages yet) — the migration wave will populate
  `core/*` (Apache-2.0, tracked) and `extensions/*` (UNLICENSED, private nested
  repos).
- Nearly every package depends on `clinical:hl7-resource-datatypes` (core
  infra, loaded from `.meteor/packages`); that dep is omitted from the table's
  cross-deps column since it gates nothing until the Atmosphere loader itself
  is retired. Same for `clinical:extended-api` and `clinical:fonts`.

## Anomalies found during sweep (fix during migration wave)

1. **`packages/email-list` exists in NO repository** — not monorepo-tracked, no
   nested `.git`. This is the incident class FABLE-ANALYSIS §4 warned about.
   Adopt (track or init repo) or migrate it early.
2. **`packages/data-exporter` is double-homed** — monorepo-tracked AND a nested
   git repo. Whichever wins, pick one before migrating it.
3. **`packages/orbital/package.js:36`** still has
   `api.use('orbital:lunar-maps', 'client', {weak: true})` — lunar-maps is now
   `@node-on-fhir/lunar-maps` (NPM). The weak ref resolves to nothing; remove
   it when orbital migrates.
4. **`packages/provider-directory`** self-name is `mitre:national-directory`
   (directory name ≠ package name); also carries the heaviest external deps.
5. **`packages/mcp/package.js`** header comment points at a different volume
   (`/Volumes/SonicMagic/.../honeycomb-public-release`) — copied in from
   another checkout; verify its nested repo remote before migrating.
6. **`npmPackages/voyager-technologies` exists in NO repository** — second
   orphan (same class as #1), found by `scripts/audit-package-repos.sh`
   2026-06-12. On the already-migrated NPM side, so adopt/init its repo
   independent of the migration wave.

> Living drift report: run `scripts/audit-package-repos.sh` (table,
> `--problems`, or `--tsv`; exits 1 on drift). As of 2026-06-12 it flags 16
> packages — the 2 orphans above, `data-exporter` double-homed, uncommitted
> work in 7 nested repos, and no-upstream in 5 npmPackages.

## Inventory

Git: **M** = monorepo-tracked · **R** = nested git repo · **—** = orphan.
Cross-deps exclude self + core infra (`hl7-resource-datatypes`, `extended-api`, `fonts`).

| Package dir | Atmosphere name | Files | LOC | Git | Cross-deps / blockers |
|---|---|---|---|---|---|
| accounts-management | clinical:accounts-management | 8 | 1,211 | M | `clinical:accounts` (external Atmosphere — not in packages/) |
| admin-tools | clinical:admin-tools | 19 | 7,253 | M | none |
| antimicrobial-reporting | clinical:antimicrobial-reporting | 5 | 952 | M | none |
| cancer-registry-reporting | clinical:cancer-registry-reporting | 5 | 877 | M | none |
| case-reporting | clinical:case-reporting | 5 | 799 | M | none |
| ccda-export | clinical:ccda-export | 11 | 2,108 | M | `clinical:clinical-documents` (external) |
| checklist-manifesto | clinical:checklist-manifesto | 16 | 2,543 | M | none |
| clinical-lists | clinical:clinical-lists | 8 | 2,155 | M | none |
| consent-generator | clinical:consent-generator | 6 | 1,234 | M | `clinical:hl7-fhir-resources` (external) |
| data-exporter | clinical:data-exporter | 30 | 17,269 | M+R | double-homed (anomaly #2); Npm.depends |
| data-importer | clinical:data-importer | 46 | 25,672 | M | Npm.depends; largest tracked package |
| digital-cloche | orbital:digital-cloche | 36 | 8,670 | R | none |
| drug-formulary | clinical:drug-formulary | 6 | 995 | M | none |
| drug-interactions | clinical:drug-interactions | 6 | 1,164 | M | none |
| e-prescribing | clinical:e-prescribing | 6 | 1,977 | M | none |
| ecg | clinical:ecg | 9 | 1,962 | R | Npm.depends; **orbital gate** |
| email-list | clinical:email-list | 8 | 787 | — | **orphan — in no repository** (anomaly #1) |
| family-health-history | clinical:family-health-history | 6 | 775 | M | none |
| genome-central-redux | awatson:genome-central-redux | 48 | 5,586 | R | Npm.depends |
| greenhouses | orbital:greenhouses | 44 | 14,426 | R | Npm.depends |
| healthcare-surveys | clinical:healthcare-surveys | 36 | 6,581 | M | none |
| hipaa-compliance | clinical:hipaa-compliance | 29 | 4,952 | M | Npm.depends |
| immunization-registry | clinical:immunization-registry | 5 | 977 | M | none |
| implantable-devices | clinical:implantable-devices | 6 | 2,052 | M | none |
| international-patient-summary | clinical:international-patient-summary | 25 | 5,274 | M | none |
| lab-test-reporting | clinical:lab-test-reporting | 5 | 801 | M | none |
| leaderboard-starter | mitre:leaderboard-starter | 13 | 3,399 | M | none |
| life-support-systems | orbital:life-support-systems | 36 | 10,885 | R | none — **next migration target** |
| mcp | symptomatic:mcp | 95 | 31,443 | R | Npm.depends; largest package overall; provenance check (anomaly #5) |
| monetization | orbital:monetization | 9 | 2,555 | R | Npm.depends |
| multi-factor-auth | clinical:multi-factor-auth | 8 | 2,041 | M | core infra only |
| orbital | orbital:core | 52 | 17,146 | R | `clinical:ecg`, `clinical:pantry-management`, `symptomatic:symptom-tracking`, stale weak `orbital:lunar-maps` (anomaly #3) — **migrate last** |
| order-catalog | clinical:order-catalog | 9 | 3,254 | M | none |
| pacio-core | clinical:pacio-core | 73 | 21,277 | M | none; active connectathon work — defer until after July 2026 |
| pantry-management | clinical:pantry-management | 13 | 4,183 | R | **orbital gate** |
| patient-chart-starter | mitre:patient-chart-starter | 11 | 3,960 | M | none |
| patient-matching | clinical:patient-matching | 32 | 4,565 | M | none |
| personal-characteristics | clinical:personal-characteristics | 4 | 757 | R | none; smallest package |
| provider-directory | mitre:national-directory | 30 | 11,605 | M | `clinical:hl7-fhir-data-infrastructure`, `clinical:uscore`, `clinical:vault-server` (all external); name mismatch (anomaly #4) |
| quality-measures | clinical:quality-measures | 21 | 5,070 | M | none; active connectathon work — defer until after July 2026 |
| reference-app | clinical:reference-app | 12 | 9,327 | M | none |
| request-for-corrections | clinical:request-for-corrections | 27 | 5,597 | M | none |
| secure-messaging | clinical:secure-messaging | 6 | 1,573 | M | none |
| smart-web-messaging | clinical:smart-web-messaging | 30 | 5,256 | M | none |
| social-determinants | clinical:social-determinants | 5 | 801 | M | none |
| sphr-analyzer | mitre:sphr-analyzer | 4 | 1,324 | M | none |
| structured-data-capture | clinical:structured-data-capture | 31 | 6,531 | M | none |
| symptom-tracking | symptomatic:symptom-tracking | 18 | 6,190 | R | **orbital gate** |
| syndromic-surveillance | clinical:syndromic-surveillance | 6 | 588 | M | none |
| synthea | clinical:synthea | 11 | 3,245 | M | none |
| timelines | symptomatic:timelines | 21 | 11,252 | R | Npm.depends |
| us-core | clinical:us-core | 9 | 1,137 | M | none; active connectathon work — defer until after July 2026 |
| vital-signs | clinical:vital-signs | 59 | 11,450 | M | `clinical:hl7-fhir-resources` (external); Npm.depends |
| workqueues | clinical:workqueues | 22 | 4,188 | M | none |

## External Atmosphere dependencies (not in `packages/`, gate their consumers)

| External package | Consumers |
|---|---|
| `clinical:accounts` | accounts-management |
| `clinical:clinical-documents` | ccda-export |
| `clinical:hl7-fhir-resources` | consent-generator, vital-signs |
| `clinical:hl7-fhir-data-infrastructure`, `clinical:uscore`, `clinical:vault-server` | provider-directory |
| `clinical:hl7-resource-datatypes`, `clinical:extended-api`, `clinical:fonts` | nearly everything (core infra; stays Atmosphere until the loader retires) |

## Decommission rule (MANDATORY for every migration)

Once `packages/foo` is migrated to `npmPackages/foo` (and boot-verified), **move
the original `packages/foo` to `deprecated/foo`** — never delete it. This is the
lunar-maps precedent (`deprecated/lunar-maps`) and the "move-don't-delete
decommission" lesson already baked into `/migrate-atmosphere-package`. Parking
the original preserves git history and provides a rollback if the NPM port
regresses.

## Recommended migration order

1. **Hygiene first (cheap, prevents repo accidents)**: adopt `email-list`
   orphan; resolve `data-exporter` double-homing; verify `mcp` remote.
2. **life-support-systems** (R, no cross-deps — the backlog's named next target).
3. **Orbital gate, in order**: `pantry-management` → `ecg` → `symptom-tracking`
   (each R, no cross-deps of their own).
4. **orbital** (`orbital:core`) — after its three gates; drop the stale
   `orbital:lunar-maps` weak ref (package.js:36) during migration.
5. **Remaining orbital-family** (digital-cloche, greenhouses, monetization) and
   simple M-tracked packages in ascending size as appetite allows.
6. **Defer**: pacio-core / quality-measures / us-core (July 2026 connectathon
   freeze), provider-directory + vital-signs + ccda-export + consent-generator +
   accounts-management (external-dep gates), mcp (size + provenance).
7. After the last migration: consolidate `packages/CLAUDE.md` +
   `npmPackages/CLAUDE.md`, retire the Atmosphere loader path.
