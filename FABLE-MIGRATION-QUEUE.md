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
- [x] personal-characteristics — `clinical:personal-characteristics` →
      `@node-on-fhir/personal-characteristics` — DONE 2026-06-13, boot-verified,
      decommissioned. Orphan → fresh `git init`. Client-only (minimal server.js);
      8 dermatome assets via parser pipeline; `user`→`Person`; design/ skipped.
- [x] family-health-history — `clinical:family-health-history` →
      `@node-on-fhir/family-health-history` — DONE 2026-06-13, boot-verified,
      decommissioned. Monorepo-tracked (git rm); fresh `git init`. 2 sidebar
      exports → sidebarItems; `family_restroom`→`FamilyRestroom`, `account_tree`→`AccountTree`.
- [x] case-reporting — `clinical:case-reporting` → `@node-on-fhir/case-reporting`
      — DONE 2026-06-13, boot-verified, decommissioned. Monorepo-tracked (git rm);
      fresh `git init`. 2 sidebar exports → sidebarItems; `report`→`Report`,
      `publicHealth`→`HealthAndSafety`. methods-only server.
- [x] social-determinants — `clinical:social-determinants` →
      `@node-on-fhir/social-determinants` — DONE 2026-06-13, boot-verified,
      decommissioned. Monorepo-tracked (git rm); fresh `git init`. 2 sidebar
      exports → sidebarItems; `psychology`→`Psychology`, `health_and_safety`→`HealthAndSafety`.
- [x] lab-test-reporting — `clinical:lab-test-reporting` →
      `@node-on-fhir/lab-test-reporting` — DONE 2026-06-13, boot-verified,
      decommissioned. Monorepo-tracked (git rm); fresh `git init`.
      `biotech`→`Biotech`, `science`→`Science`; methods-only server.
- [x] cancer-registry-reporting — `clinical:cancer-registry-reporting` →
      `@node-on-fhir/cancer-registry-reporting` — DONE 2026-06-13, boot-verified,
      decommissioned. Monorepo-tracked (git rm); fresh `git init`. Twin of
      lab-test-reporting (`biotech`/`science`); methods-only server.
- [x] antimicrobial-reporting — `clinical:antimicrobial-reporting` →
      `@node-on-fhir/antimicrobial-reporting` — DONE 2026-06-13, boot-verified,
      decommissioned. Monorepo-tracked (git rm ~75 files); fresh `git init`.
      guide/ IG-authoring tree NOT carried (stays in deprecated/);
      `biotech`→`Biotech`, `coronavirus`→`Coronavirus`; methods-only.
- [x] immunization-registry — `clinical:immunization-registry` →
      `@node-on-fhir/immunization-registry` — DONE 2026-06-13, boot-verified,
      decommissioned. Monorepo-tracked (git rm); fresh `git init`. WHO
      `guides/` IG tree NOT carried; `vaccines`→`Vaccines`, `shield`→`Shield`.
- [x] drug-formulary — `clinical:drug-formulary` → `@node-on-fhir/drug-formulary`
      — DONE 2026-06-13, boot-verified, decommissioned. Monorepo-tracked (git rm
      ~124 files); fresh `git init`. emedicinal-product-info `guides/` IG tree NOT
      carried; `pharmacy`→`LocalPharmacy`; methods+publications.
- [x] drug-interactions — `clinical:drug-interactions` →
      `@node-on-fhir/drug-interactions` — DONE 2026-06-13, boot-verified,
      decommissioned. 3 routes (2 prop-variants via distinct component keys),
      inline FooterButtons + ModuleConfig preserved; settings-gated;
      `medication`/`alert`→Warning/`allergies`→MedicalInformation; fresh git init.
- [x] secure-messaging — `clinical:secure-messaging` →
      `@node-on-fhir/secure-messaging` — DONE 2026-06-13, boot-verified,
      decommissioned. 3 routes (2 defaultTab variants), Patient+Clinician
      workflows → sidebarItems, inline footer + ModuleConfig, settings-gated;
      2 server files (methods + direct-protocol); fresh git init.
- [x] e-prescribing — `clinical:e-prescribing` → `@node-on-fhir/e-prescribing`
      — DONE 2026-06-13, boot-verified, decommissioned. 1 route, inline footer +
      ModuleConfig, settings-gated; 2 server files (methods + ncpdp-script);
      `medication`→`Medication`; fresh git init.
- [x] multi-factor-auth — `clinical:multi-factor-auth` →
      `@node-on-fhir/multi-factor-auth` — DONE 2026-06-13, boot-verified,
      decommissioned. ⚠️ Needed `speakeasy` dep (TOTP — undeclared external
      import; first boot failed Cannot-find-module, added to dependencies +
      reinstalled → clean). Kept existing server/index.js (Accounts.onLogin +
      mfa.status pub); dropped Package[] global; no-op footers → []; fresh git init.
      LESSON: grep external npm imports during inventory.
- [x] implantable-devices — `clinical:implantable-devices` →
      `@node-on-fhir/implantable-devices` — DONE 2026-06-13, boot-verified,
      decommissioned. 2 routes (:id viewMode variant), Clinician+Patient
      workflows → sidebarItems, inline footer + ModuleConfig, settings-gated;
      `memory`→`Memory`, `settings`→`Settings`; fresh git init.
- [x] clinical-lists — `clinical:clinical-lists` → `@node-on-fhir/clinical-lists`
      — DONE 2026-06-13, boot-verified, decommissioned. 3 routes (problem/
      med-allergy/medication); SidebarElements (collectionName badges) →
      sidebarItems; `problem`→`Assignment`, `allergy`→`MedicalInformation`;
      methods+publications; fresh git init.
- [x] checklist-manifesto — `clinical:checklist-manifesto` →
      `@node-on-fhir/checklist-manifesto` — DONE 2026-06-13, boot-verified
      (startup seeding ran), decommissioned. Richer structure (ui/, lib/collections/,
      server/methods+publications/); self-contained client.js; kept server/index.js;
      `checklist`→`Checklist`; fresh git init.
- [x] monetization — `orbital:monetization` → `@node-on-fhir/monetization` —
      DONE 2026-06-13, boot-verified, decommissioned. NESTED repo (history
      preserved on npm-migration). Added `stripe@17.5.0` dep (@stripe/* client
      libs already present); no orbital/life-support cross-imports (flag cleared).
      2 routes, ConstructionZoneLinks → sidebarItems (Storefront/Payment),
      FeatureGate/TierFeatures exports preserved; methods+webhooks server.
- [x] synthea — `clinical:synthea` → `@node-on-fhir/synthea` — DONE 2026-06-13,
      boot-verified, decommissioned. 1 route; sidebar icon added (`Science`);
      server = startup + methods; scripts/ carried; fresh git init.
- [x] order-catalog — `clinical:order-catalog` → `@node-on-fhir/order-catalog`
      — DONE 2026-06-13, boot-verified, decommissioned. 4 routes (3 defaultType
      CPOE variants); ClinicianWorkflows → sidebarItems (Assignment/Medication/
      Science/Scanner); inline footer + ModuleConfig; kept server/index.js
      (startup); fresh git init.
- [x] leaderboard-starter — `mitre:leaderboard-starter` →
      `@node-on-fhir/leaderboard-starter` (**Apache-2.0** preserved) — DONE
      2026-06-13, boot-verified, decommissioned. 1 route; MainPage `/` override
      preserved as named export (not in routes); mislabeled sidebar → "Leaderboard"
      (Leaderboard icon); fresh git init. ⚠️ Its boot surfaced an order-catalog
      decommission regression (server/RadiologyCatalogInitializer.js relative
      import) — FIXED by repointing to the NPM subpath. LESSON: grep main-app for
      `../packages/<name>` imports during each decommission.
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
