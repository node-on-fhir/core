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
- [x] patient-chart-starter — `mitre:patient-chart-starter` →
      `@node-on-fhir/patient-chart-starter` (Apache-2.0) — DONE 2026-06-13,
      boot-verified, decommissioned. Client-only (minimal server.js); 1 route;
      MainPage `/` override preserved as named export; json5/prop-types/jsonwebtoken
      peers present; fresh git init. (No main-app importers — no regression.)
- [x] workqueues — `clinical:workqueues` → `@node-on-fhir/workqueues` — DONE
      2026-06-13, boot-verified, decommissioned. Rich structure (ui/, lib/schemas,
      server rest/hooks/methods/migrations); self-contained client.js re-exporting
      the surface; kept server/index.js; simpl-schema peer (present); `list`→`List`;
      fresh git init. (Non-fatal startup warning: legacy migrate-todos references
      an absent Todos collection — pre-existing, gracefully fails.)
- [x] patient-matching — `clinical:patient-matching` → `@node-on-fhir/patient-matching`
      — DONE 2026-06-13, boot-verified (`PatientMatching package initialized on
      server` + `App running at`), decommissioned. IDI matching + identity
      assurance (NIST 800-63 AAL2); 2 routes (`/patient-matching`,
      `/identity-assurance`, both requireAuth); self-contained client.js
      re-exporting the `PatientMatching` namespace + pages; kept original
      server/index.js mainModule (REST IDI-match, FHIR ops, AAL2 security, audit,
      publications). body-parser dep (present); moment/simpl-schema peers;
      `guide/` skipped; `people`→`People`, `security`→`Security`; fresh git init.
      (No main-app importers — no regression.)
- [x] hipaa-compliance — `clinical:hipaa-compliance` → `@node-on-fhir/hipaa-compliance`
      — DONE 2026-06-13, boot-verified (`HIPAA Compliance package initialized
      successfully` + `App running at`, 3rd attempt), decommissioned. HIPAA audit
      logging + compliance policies (ONC §170.315(d)(2),(3),(10)); 3 routes;
      self-contained client.js preserving SidebarElements/SidebarWorkflows/
      FooterButtons + lib surface; assembled server/index.js (6 server files,
      startup last). **Boot gate caught 3 Atmosphere-isms swc/Rspack reject** —
      all fixed in the npm copy: (1) `lib/Collections.js` duplicate export of
      `HipaaAuditLogHelpers`; (2) `Collections.js` bare implicit-global
      `HipaaAuditLog = …` → `const`; (3) `lib/Constants.js`
      `if (typeof HipaaConstants === 'undefined') { HipaaConstants = … }` guard
      → `export const` (strict-mode ReferenceError). `marked@4.3.0` dep added
      (was missing); `@mui/x-date-pickers` peer aligned `^6`→`^7` (app ships
      7.29.4 — ERESOLVE). `lib/HipaaLogger.js` left as dead/unimported. Atmosphere
      `tests/`+`.npm/` not copied. Already commented out in `.meteor/packages`;
      no real main-app importers (NotAuthorized.jsx has only a GitHub doc URL) —
      no regression. Fresh git init.

> **Staging hygiene (learned on patient-matching 25):** `git add` aborts the
> whole invocation on a pathspec that no longer exists (e.g. an already-moved
> `packages/<name>`), and `2>/dev/null` hides it — silently dropping the
> manifest/lock/queue from the commit. Stage only existing paths
> (`workflows/workflows.json package-lock.json FABLE-MIGRATION-QUEUE.md` +
> `deprecated/<name>`), never silence the staging command, and verify
> `git show --stat HEAD` lists all four artifact types before moving on.
- [x] international-patient-summary — `clinical:international-patient-summary` →
      `@node-on-fhir/international-patient-summary` — DONE 2026-06-13,
      boot-verified (`App running at`, first attempt, no Atmosphere-isms),
      decommissioned. IPS viewer + export; 1 route; self-contained client.js
      (preserves FooterButtons/SidebarWorkflows/SidebarElements/DynamicRoutes/
      IpsContent + the `Meteor.IpsContent` startup side effect); server/index.js
      wraps the single methods.js. No Npm.depends; moment peer; `guide/` IG tree
      skipped (orphaned gitlink, moved with benign warning). web-llm loaded via a
      runtime-injected `<script type=module>` (string import — not bundled).
      `map`→`Map`. Already commented out in `.meteor/packages`; 0 real main-app
      importers — no regression. Fresh git init.
- [x] smart-web-messaging — `clinical:smart-web-messaging` →
      `@node-on-fhir/smart-web-messaging` — DONE 2026-06-13, boot-verified
      (`SmartMessagingServer initialized` + `App running at`, 5th attempt),
      decommissioned. **HARDEST so far — a pervasive-Atmosphere-global LIBRARY
      package** (no `api.mainModule`; `api.addFiles` + `api.export` of
      SmartWebMessaging/MessageTypes/Activities/LaunchStatusCodes/UrlValidator;
      ~20 files reference them BARE with near-zero ES imports). Pattern learned:
      files with **no ESM syntax** stay non-strict scripts under Rspack and keep
      Atmosphere window-global semantics (`X = {…}` installs a global, bare reads
      resolve) — so a LIBRARY package migrates as **dependency-ordered
      side-effect imports** (client.js/server/index.js) with an empty-routes/
      sidebar default export. Files that DO `import`/`export` are strict and
      needed fixes. Boot gate caught a cascade, all fixed in the npm copy:
      (1) simpl-schema **v3 dropped `SimpleSchema.RegEx`** → defined `URL_REGEX`
      in MessageSchema/ActivitySchema; (2) **18 strict-file bare-global decls**
      (`X = {…}` / `X = new Mongo.Collection()`) → `const X = globalThis.X = …`
      across lib/schemas, lib/utilities, server/*, client/handlers,
      client/services, client core; (3) **init load-order** — schemas read
      `LaunchStatusCodes` and SmartWebMessaging reads constants/utilities/schemas
      at construction, so imports are ordered constants→utilities→schemas→
      SmartWebMessaging→modules (NOT the api.addFiles order); (4) **bare lodash
      `get`** in SmartWebMessaging.js → `import { get } from 'lodash'`.
      `guide/` (HL7 submodule, path updated), `examples/`, `tests/` not copied.
      No Npm.depends. 0 real main-app importers; not in `.meteor/packages` — no
      regression. Submodule → fresh git init.

> **Library-package recipe (no `api.mainModule`):** reproduce `api.addFiles` as
> **dependency-ordered** side-effect imports in client.js + server/index.js;
> default export `{ name, routes: [], sidebarItems: [] }`. No-ESM-syntax source
> files keep working as non-strict window-global scripts; only files that already
> `import`/`export` are strict and need `const X = globalThis.X = …` for any bare
> `X = …` top-level decl. Watch for simpl-schema v2→v3 `RegEx` removal and bare
> lodash globals.
- [~] genome-central-redux — `awatson:genome-central-redux` — **DEFERRED
      2026-06-13** (not migrated; original left in `packages/`). See
      Skips/needs-attention below. Not a modest clean-subset package: 8/12
      Npm.depends are missing/abandoned bio-libs + it targets Material-UI v0.x.
- [x] request-for-corrections — `clinical:request-for-corrections` →
      `@node-on-fhir/request-for-corrections` — DONE 2026-06-13, boot-verified
      (`Request for Corrections package initialized successfully` + `App running
      at`, first attempt), decommissioned. Patient amendments (ONC §170.315(d)(4));
      3 routes; index.jsx was already clean ES-module style; self-contained
      client.js re-exports pages/components/collections + CorrectionWorkflow; kept
      server/index.js mainModule **minus its dead `if (typeof Package !==
      'undefined') { this.X = … }` api.export shim** (throws in strict ESM —
      `this` is undefined; the `export {}` already publishes them) — removed
      preemptively, booted first try. No Npm.depends; simpl-schema peer; `guide/`
      (HL7 submodule, path updated), `docs/`, `tests/` skipped. `edit`→`Edit`.
      Already commented out in `.meteor/packages`; 0 real importers — no
      regression. Fresh git init.
- [x] structured-data-capture — `clinical:structured-data-capture` →
      `@node-on-fhir/structured-data-capture` — DONE 2026-06-13, boot-verified
      (`App running at` + Questionnaire/QuestionnaireResponse route setup, first
      attempt), decommissioned. FHIR SDC (forms/builder/library/analytics); 5
      routes (index.jsx used `component:` refs → mapped via workflow.json +
      COMPONENTS map). Self-contained client.js preserves SidebarWorkflows ([]),
      ClinicianWorkflows (4 — used as default sidebarItems), FooterButtons
      (label/onClick style), ModuleConfig + lib utils (all clean `export const`,
      no Atmosphere-isms). server/index.js imports shared utils + methods.js.
      No Npm.depends. icons `notepad`→`Assignment`, `ic_hearing`→`Hearing`,
      `document`→`Description`. `example.jsx`/`tests/` skipped. Commented out in
      `.meteor/packages`; 0 real importers — no regression. Fresh git init.
- [x] healthcare-surveys — `clinical:healthcare-surveys` →
      `@node-on-fhir/healthcare-surveys` — DONE 2026-06-13, boot-verified
      (`App running at`, first attempt), decommissioned. Public-health surveys
      transmission (ONC §170.315(f)(7)); 1 route; index.jsx clean ES style;
      self-contained client.js (SidebarElements + SidebarWorkflows preserved).
      **Server fidelity note:** `api.addFiles('server/methods.js')` was the only
      wired server file (self-contained Meteor.methods); the
      `server/{methods,publications,cron,fhir}/` subtrees + `imports/api/*` were
      present but **never wired into package.js — dead code**, kept but not
      imported (unbundled). The 9 `lib/schemas/*` (also unimported by the loaded
      graph) had Atmosphere bare-globals (`XSchema = new SimpleSchema()` /
      `X = new Mongo.Collection()`) → `const X = globalThis.X = …` and CJS
      `if (typeof exports==='object'){ module.exports=… }` guards → ESM
      `export {…}`, so they're safe if ever imported. No Npm.depends;
      simpl-schema peer. `analytics`→`Analytics`, `publish`→`Publish`. `guide/`
      (HL7 submodule, path updated), `tests/` skipped. Not in `.meteor/packages`;
      0 real importers — no regression. Fresh git init.
- [~] timelines — `symptomatic:timelines` — **DEFERRED 2026-06-13** (not
      migrated; original left in `packages/`). Needs a package-topology decision,
      not a clean migration. See Skips/needs-attention below.
- [x] digital-cloche — `orbital:digital-cloche` → `@node-on-fhir/digital-cloche`
      — DONE 2026-06-13, boot-verified (`Terarrium Life Support Systems: Startup
      complete` + terrashroom proxy registered + `App running at`, first
      attempt), decommissioned. Digital Cloche / Terrarium greenhouse +
      Terrashroom controls (Artemis); 3 routes (settings-gated on
      `lifeSupportSystems.enabled`); self-contained client.js re-exports lib
      (calculations/consumptionRates/missionEvents/collections) + components;
      kept server/index.js (methods/publications/terrashroomProxy + startup).
      **No orbital/life-support/gate code-level imports** (the key gate — clean);
      `clinical:extended-api`/`hl7-resource-datatypes` are api.use'd but not
      ES-imported and remain in `.meteor/packages`. Clean ES modules, no
      Atmosphere-isms, no Npm.depends. `MissionHeader` starfield asset repointed
      `/packages/orbital_life-support-systems/...` → `/workflows/digital-cloche/
      starfield.jpg`. `terrashroom/` (docs/firmware/pwa) + loose stock jpgs
      skipped. **Nested repo — history preserved** (.git copied, 4 prior commits
      + migration on `npm-migration`). Not in `.meteor/packages`; 0 importers —
      no regression.
- [x] greenhouses — `orbital:greenhouses` → `@node-on-fhir/greenhouses` — DONE
      2026-06-13, boot-verified (`Greenhouse: Startup complete` + `App running
      at`, 2nd attempt), decommissioned. Greenhouse ops + Ambient Weather +
      Molekule air-quality (Artemis); 6 settings-gated routes (mixed element/
      component refs → workflow.json + COMPONENTS map); self-contained client.js
      re-exports lib (calculations/consumptionRates/missionEvents/collections incl.
      Molekule + AmbientWeather, ambientWeatherConfig) + components + preserves
      ConstructionZoneLinks/AdminSidebarElements (label/icon shape). server.js
      loads index.js + api-discovery.js + cron-jobs.js (index.js didn't import the
      latter two, but they were separately api.addFiles'd). **No orbital/
      life-support code imports** (gate — clean). **Boot gate caught** a duplicate
      export of 4 AmbientWeather collections in lib/collections.js (`export const`
      + re-export list) → removed from the list. Added
      `amazon-cognito-identity-js`@6.3.7 (used by server/methods.js; missing);
      `@nivo/*` declared+present but not imported. Assets repointed
      (Molekule-Air-Pro_HERO.jpg + starfield.jpg → `/workflows/greenhouses/`).
      Root hardware scripts/docs (`molekule*.js`/`ambient-weather-api/`/
      `python-letpot/`/`references/`/`screenshots/`) skipped. **Nested repo —
      history preserved** (4 prior + migration on `npm-migration`). Not in
      `.meteor/packages`; 0 importers — no regression.

---

## Clean-subset loop COMPLETE — 2026-06-13

All 35 clean-subset slots resolved: **33 migrated + boot-verified +
decommissioned**, **2 deferred** (genome-central-redux, timelines — see
Skips/needs-attention, each needs deliberate non-loop work). Zero faked
checkoffs; every checked box corresponds to a genuine `App running at` boot.
Each migrated package: monorepo commit (manifest/lock/queue + deprecated move)
+ its own `npm-migration` nested-repo commit. Process hygiene held throughout —
ports swept and no zombies between every boot, `.meteor/versions` restored each
time. Remaining Atmosphere `packages/*` are the **Explicitly EXCLUDED** set
below (gated / Connectathon-frozen / huge-multi-session) plus the 2 deferrals.

## Loop extension — 3 clean siblings (not in the original 35) — 2026-06-13

These three weren't in the original queue but inventory clean and are the same
shape as the loop. Same recipe + honesty gate.

- [x] sphr-analyzer — `sphr-analyzer` → `@node-on-fhir/sphr-analyzer` — DONE
      2026-06-13, boot-verified (`App running at`, first attempt), decommissioned.
      SPHR analyzer (PHR file analysis via nivo sunburst + quality checks).
      **Client-only** (no-op server.js). 2 routes (`element:` → workflow.json +
      COMPONENTS map); preserves DynamicRoutes/SidebarWorkflows/SidebarElements +
      page components. **Sidebar items had no iconName upstream** → added
      `Assessment` (Quality Checks) + `Analytics` (File Analysis). `@nivo/sunburst`
      peer (present); no Atmosphere-isms. `data/` (9.1 MB FHIR examples) + configs/
      skipped. Not in `.meteor/packages`; 0 importers — no regression. Fresh git
      init.
- [x] admin-tools — `clinical:admin-tools` → `@node-on-fhir/admin-tools` — DONE
      2026-06-13, boot-verified (`AdminTools: Server startup complete` + `App
      running at`, first attempt), decommissioned. Sessions / db admin /
      settings-gated patient delete/archive/rename/anonymize (reference impl for
      the settings-gated-feature pattern — 3 `checkXSetting` methods read
      `settings.private.allow*`). 8 routes (`element:` → workflow.json + COMPONENTS
      map; `settings.public.modules.adminTools.enabled` gate empties everything);
      self-contained client.js preserves SidebarWorkflows/AdminSidebarElements/
      PatientsDirectoryButtons/CollectionAdminMethods/scanner-utils + 7 components
      + AdminToolsCollections; kept server/index.js mainModule. Clean ES6, no
      Atmosphere-isms, MUI v5, no assets. **Decommission-coupling note
      (order-catalog shape):** added `./lib/{Anonymizer,PatientCompartmentMapper,
      collections,AdminMethodsScanner}` subpath exports so `data-exporter`'s 2
      imports can later repoint to `@node-on-fhir/admin-tools/lib/…`. The repoint
      itself is **DEFERRED to data-exporter's migration** — data-exporter is a
      *separate nested repo* (own `.git`), unmigrated + inactive (not in
      `.meteor/packages`), so editing it from here would couple two repos; the
      dangling `meteor/clinical:admin-tools` import is harmless until data-exporter
      is built. (Recorded in the needs-attention section.) Not in
      `.meteor/packages`. Fresh git init.
- [x] reference-app — `clinical:reference-app` → `@node-on-fhir/reference-app` —
      DONE 2026-06-13, boot-verified (`ReferenceApp: Server startup complete` +
      `App running at`, 2nd attempt), decommissioned. ONC (g)(10) reference app +
      certification tracking. 2 routes; self-contained client.js preserving the
      full export surface (AdminDynamicRoutes/AdminSidebarElements/FooterButtons/
      FooterElements/MainPage `/`-override-as-named-export/ModuleConfig/
      PatientsDirectoryButtons/WorkflowTabs + components + lib); 2 settings gates.
      **Strict-mode fixes:** added the `Meteor` import (index.jsx used it as an
      Atmosphere global) + declared `SidebarElements` (a gate assigns to it).
      **Server-asset gotcha:** the Daisey 367-resource bundle was read via 3×
      `Assets.getTextAsync` → `import daiseyBundle from '../data/Daisy/…json'` +
      `JSON.stringify(daiseyBundle)` (preserves the text contract). **Boot gate
      caught** a dead dynamic `import('../data/sample-data.json')` (file never
      existed, result unused; Rspack resolves dynamic-import targets at build
      time) → removed. 27 `{weak:true}` clinical:* api.use dropped (optional ONC
      integrations); `*.py`/`*.md` + `ReferenceAppPage_backup.jsx` skipped.
      Commented out in `.meteor/packages`; Footer.jsx runtime `Package[].FooterButtons`
      lookup superseded by WorkflowRegistry footerButtons; no hard importer — no
      regression. Fresh git init.

### Loop extension COMPLETE — 3/3 — 2026-06-13

sphr-analyzer + admin-tools + reference-app all migrated + boot-verified +
decommissioned. **Total: 36 migrated + 2 deferred** across the original 35 +
these 3. The boot gate again earned its keep (reference-app's dead sample-data
import; admin-tools' separate-nested-repo data-exporter coupling handled by
deferral). Remaining `packages/*`: the **Explicitly EXCLUDED** set (gated /
Connectathon-frozen / huge-multi-session) + the 2 deferrals + the data-exporter
repoint follow-up.

## Gated-tranche pass — 2026-06-13

Re-inventory of the "5 externally-gated" set corrected the picture: only
**accounts-management** (`clinical:accounts`) and **ccda-export**
(`clinical:clinical-documents`) have a real missing-external-Atmosphere-dep gate;
**provider-directory** is defer-class (MUI v4 across 25 files + IPFS +
4 external api.use); **consent-generator** and **vital-signs** were mislabelled
(their `clinical:*` api.use is an `onTest` self-reference). Migrating the latter
two:

- [x] consent-generator — `consent-generator` → `@node-on-fhir/consent-generator`
      — DONE 2026-06-13, boot-verified (`Consent Generator: Collections
      initialized {Consents:true}` + `App running at`, after 1 fix),
      decommissioned. FHIR consent document generator; 1 route. **Not gated** (the
      `clinical:consent-generator` api.use is an onTest self-ref; hl7 deps are
      `{weak:true}`). Self-contained client.js re-exports ConsentGeneratorPage +
      ConsentTemplates — **avoids index.jsx's latent bugs** (it referenced `React`
      + `ConsentGeneratorPage` as values while only re-exporting them). server/
      index.js loads methods.js + routes.js. **Boot gate caught** a `Consents`
      collection-name collision (the host app owns `Consents`, and
      `global.Collections` isn't populated yet when this startup runs under NPM/
      Rspack load order, so it fell through to `new Mongo.Collection('Consents')`
      → "already a collection named Consents") → fixed with the
      `{ _suppressSameNameError: true }` option on the Consents + ConsentAcls
      fallbacks. No Npm.depends, MUI v5. `shield`→`Shield`. Not in
      `.meteor/packages`; 0 importers. Fresh git init.
- [x] vital-signs — `vital-signs` → `@node-on-fhir/vital-signs` — DONE 2026-06-13,
      boot-verified (`VitalSigns package loaded on server` + `binding by name` +
      `App running at`), decommissioned. HL7 FHIR Vital Signs IG (panels +
      recording/display); 3 routes. **Not gated** (`clinical:vital-signs` is an
      onTest self-ref). client.js (routes/sidebar from workflow.json; `export *
      from lib/index.js`); server.js = the `lib/index.js` server mainModule; added
      the `Meteor` import index.jsx used as a global. **Collection collision fix:**
      `lib/index.js` binds `VitalSigns` to the host `Observations` collection →
      `{ _suppressSameNameError: true }` (the global lookup misses under NPM load
      order, so it bound by name without throwing). **recharts dropped → nivo-only:**
      the package shipped recharts + nivo chart impls (default recharts); recharts
      could NOT be added as an npm dep without an **ERESOLVE that rewrites the whole
      workspace lockfile** (its react-dom peer vs a react-dom@19 in the tree —
      caught + fully reverted), so VitalSignsChartWrapper uses the present
      `@nivo/line` impl only (recharts chart file deleted). **Dead server/ tree**
      (CRUD methods + publications) was never wired into package.js → kept unwired
      (faithful). `guide/` (HL7 cimi-vital-signs submodule, path updated) + tests/
      + configs/ skipped. `favorite`→`Favorite`. Not in `.meteor/packages`; 0
      importers. Fresh git init.

### Gated-tranche pass COMPLETE — 2026-06-13

2 migrated (consent-generator, vital-signs — both mislabelled "gated"; really
clean). **Still genuinely gated / deferred** from this tranche:
**accounts-management** (`clinical:accounts` missing), **ccda-export**
(`clinical:clinical-documents` missing), **provider-directory** (defer-class:
MUI v4 ×25 + IPFS + 4 external api.use). **Total now: 38 migrated + 2 deferred.**
Lesson re-learned (caution): never `npm install --legacy-peer-deps` on the
workspace — it rewrote 2540/1978 lock entries; revert via `git checkout
package-lock.json` + drop the offending dep + normal install.

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

- ~~**data-exporter ← admin-tools repoint**~~ — **RESOLVED 2026-06-13 by migrating
  data-exporter** (below). The "inactive" assumption was wrong: loading
  `clinical:data-exporter` via `--extra-packages` failed at package selection
  (`unknown package: clinical:admin-tools`) once admin-tools moved to deprecated/.
  Migrating data-exporter dropped the `api.use` and repointed the imports.

### us-core migrated + Package-registry mechanism — 2026-06-14

- [x] us-core — `clinical:us-core` → `@node-on-fhir/us-core` — DONE 2026-06-14,
      **boot-verified end-to-end** (`/baseR4/metadata` CapabilityStatement contains
      19 us-core profiles + `ProfileDecorators discovered from package:
      @node-on-fhir/us-core` + `App running at`), decommissioned. US Core 7.0.0
      FHIR **profile provider** (no UI — empty routes/sidebar). Exposes `ProfileSet`
      (→ CapabilityStatement.supportedProfile, ONC (g)(10)) + `ProfileDecorators`
      (Patient/Organization REST egress decoration). Fixed 2 bare-globals
      (ProfileSet, ProfileDecorators → `export const`); `guide/` + dead
      `DecoratorRegistry.js` skipped. Sequencing safe (nothing api.use's
      `clinical:us-core`; provider-directory's `clinical:uscore` is a *different*
      package name). Monorepo-tracked → fresh git init.

> **NEW general mechanism — Package registry (the user's design; freeze lifted).**
> The host app discovers server capabilities by iterating the global `Package`
> registry: `server/Metadata.js` (ProfileSet → CapabilityStatement) +
> `server/RestHelpers.js` (ProfileDecorators → egress). Atmosphere packages land
> there via `api.export`; **npm workflow packages now register into
> `Package['<pkg>']` automatically** — `workflows/rspack.workflowParser.js` was
> changed so the generated `imports/workflows/server-loader.js` namespace-imports
> each server entry and assigns it to `globalThis.Package[name]`. A package only
> re-exports its discoverable symbols from its server entry (`server.js`
> `export *`). `Metadata.js` discovery was made **lazy** (read `Package` at
> CapabilityStatement-build time) for load-order safety; `RestHelpers.js` already
> discovers in `Meteor.startup` (post-load). Generalizes to any future
> profile/capability provider (pacio-core, specialty IGs). Documented in
> **`.claude/rules/fhir/package-registry.md`**.

### data-importer migrated — 2026-06-14

- [x] data-importer — `clinical:data-importer` → `@node-on-fhir/data-importer` —
      DONE 2026-06-14, boot-verified (`App running at`, 2nd attempt; the WorkflowParser
      added it from EXTRA_WORKFLOWS), decommissioned. CSV/XLSX/XML/Apple-Health-zip
      import + collection management + Ace data editor. 2 routes (`/import-data` →
      DataImportPage, `/data-editor` → EditorPage). Self-contained client.js
      (routes/sidebar/footer from workflow.json; preserves DynamicRoutes/
      AdminDynamicRoutes/AdminSidebarElements/FooterButtons + DataImportPage/
      MedicalRecordImporter/CollectionManagement/ImportAlgorithm). server/index.js
      loads the 3 addFiles server files (methods.xlsx/proxy/warehouse).
      **Fixed 2 bare-globals** (`lib/MedicalRecordImporter.js:54`,
      `lib/ImportAlgorithm.js:7` → `const X = globalThis.X = …`). **meteor/http →
      fetch shim:** the Atmosphere `api.use('http')` made http resolvable; as an
      npm pkg it isn't self-sufficient, so `import {HTTP} from 'meteor/http'` fails.
      Added `lib/httpClient.js` (HTTP get/post/put/del/call backed by `meteor/fetch`,
      core) preserving the `HTTP.post/put(url,{data},cb)` signature; repointed the 4
      importers (warehouse/MedicalRecordImporter/EditorPage[dead call]/
      ImportEditorBindings) — call sites untouched. **Dropped dead PatientCard.jsx**
      (100% commented-out, unimported; only `@material-ui/styles` ref was a
      commented line → no real old-MUI dep; framework's `Meteor.PatientCard` is the
      live one). Deps (xlsx/papaparse/xml2js/sax/jszip/file-dialog/extend/ace-builds)
      as peers (app-level). `tests/`/`.circleci/` skipped. `fire`→`Whatshot`.
      Sequencing checked (nothing else api.use's it). Not in `.meteor/packages`
      (was `--extra-packages`; now `EXTRA_WORKFLOWS=@node-on-fhir/data-importer`).
      Monorepo-tracked → fresh git init.

### admin-tools regression fix — data-exporter migrated — 2026-06-13

- [x] data-exporter — `clinical:data-exporter` → `@node-on-fhir/data-exporter` —
      DONE 2026-06-13, boot-verified (with admin-tools: `clinical:data-exporter`
      server proxy + `AdminTools: Server startup complete` + `App running at`,
      2nd attempt), decommissioned. **Migrated to fix the admin-tools decommission
      regression** (hard `api.use('clinical:admin-tools')` broke package selection).
      Route `/export-data` → ExportPageNew. **admin-tools repoint:**
      `lib/MedicalRecordsExporter.js` (reachable on client via CollectionManagement
      + FileSystemContent) imports admin-tools' `Anonymizer` +
      `PATIENT_COMPARTMENT_MAP`/`buildPatientQuery` → repointed to
      `@node-on-fhir/admin-tools/lib/…` (npm subpath; peer). **Bare-global fix**
      (`MedicalRecordsExporter =` → `const … = globalThis.… =`). **Legacy old-MUI
      UI dropped** (`ExportComponent`/`ExportPageLegacy`/`ExportPage` use
      `@material-ui` v4 + `material-ui` v0.x) — client.js routes/exports only the
      modern `ExportPageNew` + `CollectionManagement`; legacy files kept unbundled.
      **Boot gate caught** a dead `import {HTTP} from 'meteor/http'` in
      methods.proxy.js (deprecated pkg not in the app; HTTP unused) → removed.
      papaparse/xml2js/xlsx declared as peers (app-level — no install/lockfile
      churn; cf. the vital-signs `--legacy-peer-deps` lesson). Dropped the
      `clinical:hl7-resource-datatypes` api.use (0 source imports). `certs/`/
      `tests/`/`.circleci/` skipped. `fire`→`Whatshot`. **Nested repo —
      history preserved** (41 prior + migration on `npm-migration`). Sequencing
      checked: nothing else `api.use`s `clinical:data-exporter`.

> **Run-command change:** drop `clinical:data-exporter` from `--extra-packages`;
> add `@node-on-fhir/data-exporter` to `EXTRA_WORKFLOWS`. (Also: in the user's
> command, `@node-on-fhir/clinical:structured-data-capture` is malformed → use
> `@node-on-fhir/structured-data-capture`; and `@node-on-fhir/timelines` is not in
> the manifest — timeline-editor carries that name but isn't registered.)

> **Sequencing lesson:** don't decommission a package while an active package
> (incl. `--extra-packages`-loaded ones) still `api.use`s it. The original
> "no importers" check looked at main-app ES imports, not cross-package
> `api.use`. A full audit of all 44 decommissioned namespaces vs every remaining
> `packages/*` confirms data-exporter→admin-tools was the ONLY such breakage.

- **genome-central-redux** — DEFERRED 2026-06-13 (queue slot 29). Inventory (dep
  + import scan, before any scaffolding) showed this is **not a faithful
  drop-in** — it needs a dependency resurrection + a UI-framework rewrite:
  - **8 of 12 `Npm.depends` are missing from the app** and several are *actually
    imported*: `ideogram`, `bedjs`, `blastjs`, `bionode-sam`,
    `biojs-alg-seqregion` (niche/abandoned bioinformatics libs, some with native
    bindings — uncertain they install on current Node), plus `d3`, `object-path`,
    `onecolor`, `gpt-tokens`. (`xml2js`, `@langchain/core`, `@langchain/openai`
    are present.)
  - **Client targets Material-UI v0.x** — imports `material-ui/Card`,
    `material-ui/RaisedButton`, `material-ui/FloatingActionButton`,
    `material-ui/Tabs`, `material-ui/TextField`. That pre-MUI-v1 package is
    absent and incompatible with the app's `@mui/material` v5 + React 18; the
    components need rewriting to MUI v5.
  - Also heavy: **nested repo** (own git history), `assets/` (parser pipeline),
    `bin/`, `data/`, `workers/`. Original untouched in `packages/`.
  - **To resume (deliberate, multi-session task):** vet/install the bio + AI
    deps (or vendor/stub the unavailable ones), port the v0.x MUI components to
    v5, then follow the standard recipe (preserve `.git` → `npm-migration`
    branch; assets via the parser pipeline).

- **timelines** — DEFERRED 2026-06-13 (queue slot 33). This is a **reconciliation
  / package-topology decision**, not a faithful drop-in, so it should not be done
  blindly in the autonomous loop:
  - The `symptomatic:timelines` Atmosphere package was **already mid-split**:
    its editor (TimelinesEditorPage, `@xzdarcy/react-timeline-editor`,
    RadiationShadowEstimator, `lib/fhirToTimelineEditor.js`) was extracted to an
    existing **`npmPackages/timeline-editor`** whose package name is
    **`@node-on-fhir/timelines`** (a nested repo; not yet in
    `workflows/workflows.json`). index.jsx's "moved to npmPackages/timelines"
    comments confirm this.
  - Migrating the **remaining views** (TimelineSidescrollPage / Rebuild /
    TimelinePage / FiltersPage + footers) as a second `@node-on-fhir/timelines`
    workspace fails with **EDUPLICATEWORKSPACE** (same npm name, two dirs), and
    the two halves have **overlapping files** (both define
    `TimelinesFooterButtons.jsx`). So the open decision is: **merge** the views
    into the existing timeline-editor package (one `@node-on-fhir/timelines`), or
    **coexist** under distinct names — a topology call the package owner should
    make.
  - **Findings from the (clean, no-scaffold-left-behind) analysis** — the views
    ARE otherwise tractable: client-only (no server); the only missing dep in the
    *active* route graph is **`vis`@4.21.0** (on npm; via
    `vis/dist/vis-timeline-graph2d.min`); `nivo` is commented out; the legacy
    `*Original*`/`*Cleaned*`/`*Good*` files that import `@material-ui/core` (MUI
    v4) + `fhir-starter` are **not routed → not bundled**, so those deps aren't
    needed; nested repo (preserve `.git`); 8 routes; `fire`→`Whatshot`. A
    fully-built `client.js`/`workflow.json` draft was made then removed to keep
    the tree clean — re-derive from this note + index.jsx.

### accounts-management migrated — 2026-06-14

- [x] accounts-management — `clinical:accounts-management` →
      `@node-on-fhir/accounts-management` — DONE 2026-06-14, **boot-verified
      end-to-end** (`App running at: http://localhost:3000/` +
      `[accounts-management] Server methods + publications registered` + 0 fatal
      errors; WorkflowParser added it on both client + server), decommissioned to
      `deprecated/`. User accounts + access-control management UI: single route
      `/accounts-management` (`requireAuth`), no sidebar item (matches the
      Atmosphere index.jsx, which exported only `DynamicRoutes`).
      `client/{AccountsManagementPage,AccessControlMatrix}.jsx`,
      `server/{methods,publications}.js`. Clean migration — **NOT actually
      gated**: the `clinical:accounts` dep the old package.js carried is in the
      `Package.onTest` block (test-only, next to `tinytest`), NOT `Package.onUse`,
      and source never ES-imports it (same false-gate pattern as
      consent-generator / vital-signs). Real onUse deps were all app-level infra
      (`accounts-base`, `accounts-password`, `clinical:extended-api@3.0.0`,
      `clinical:hl7-resource-datatypes@4.0.8` — all in `.meteor/versions`; source
      doesn't even ES-import the `clinical:*` ones). No external npm deps, no
      old-MUI, no Atmosphere-isms, no `meteor/http`. Already commented out in
      `.meteor/packages`; nothing api.use's it (sequencing safe). No
      Package-registry symbols (`Package['@node-on-fhir/accounts-management'] = {}`
      — harmless). Monorepo-tracked → fresh git init.

### ccda-export migrated — 2026-06-14

- [x] ccda-export — `clinical:ccda-export` → `@node-on-fhir/ccda-export` — DONE
      2026-06-14, **boot-verified end-to-end** (`App running at` +
      `[ccda-export] Server publications + methods registered` + 0 fatal errors),
      decommissioned to `deprecated/`. C-CDA export + clinical documents / ONC
      §170.315(b)(1). Two routes — `/ccda-export` and `/clinical-documents` (both
      `CCDAExportPage`, second in list view, `requireAuth`).
      `client/pages/{CCDAExportPage,ClinicalDocumentsList,ClinicalDocumentDetail}.jsx`,
      `lib/collections/{ClinicalDocuments,DocumentRevisions}.js` (isomorphic
      `Mongo.Collection`s, already ES-exported — no bare-globals; no host-app
      collision), `server/publications/{clinicalDocuments,documentRevisions}.js`,
      `server/methods.js`.
  - **NOT actually gated** — the false-gate streak continues: package.js's
    `Package.onTest` `api.use('clinical:clinical-documents')` is a **stale
    reference to the package's own former name** (file header still reads
    `packages/clinical-documents/package.js`; renamed to `clinical:ccda-export`).
    Test-only, never ES-imported. Real onUse deps all present (`mongo`,
    `react-meteor-data`, `clinical:hl7-resource-datatypes`, weak
    `matb33:collection-hooks`). (consent-generator / vital-signs /
    accounts-management / ccda-export — four false gates so far.)
  - client.js preserves the full index.jsx (ClinicianWorkflows / SidebarElements /
    FooterButtons / ModuleConfig / settings gates) + re-exports both collections
    (also via `./lib/collections/*` subpath exports). Fixed legacy lowercase
    `iconName`s flagged by the parser (`export`→`FileDownload`,
    `document`→`Description`, `folder`→`Folder`; metadata-only, post-boot-verify).
  - No external npm deps, no old-MUI, no `meteor/http`. Already commented out in
    `.meteor/packages`; no onUse consumers, nothing ES-imports its exports
    (sequencing safe). A stale `guide` gitlink (submodule pointer, no
    `.gitmodules` entry) moved into `deprecated/` as-is. No Package-registry
    symbols. Monorepo-tracked → fresh git init.

### quality-measures migrated — 2026-06-14

- [x] quality-measures — `clinical:quality-measures` →
      `@node-on-fhir/quality-measures` — DONE 2026-06-14, **boot-verified
      end-to-end** (`App running at` + `[quality-measures] Server measure pipeline
      + methods registered` + 0 fatal errors), decommissioned to `deprecated/`.
      Clinical Quality Measures / ONC §170.315(c)(1-4) + **PACIO** I-CARE +
      CMS1317v1 ACP. Single route `/quality-measures` (`requireAuth`).
      **Connectathon-relevant** (PACIO July 2026) — was on the old
      "Connectathon-frozen" list; freeze lifted by the user.
  - **NOT actually gated** (5th false gate): onTest `api.use('clinical:quality-measures')`
    is a self-reference. Real onUse deps all app infra (present).
  - **One external dep `fqm-execution@^1.8.5`** (FHIR Quality Measure engine) —
    already a root dependency, declared in the package's `dependencies`. No
    `Npm.depends`.
  - **`specs/cms1317/` assets ship with the package** — `server/startup.js`
    imports ValueSet JSON from `specs/cms1317/valuesets/*.json` (Rspack resolves
    JSON imports). `.cql`/`.html` are reference assets; `guides/` is docs (not
    imported → not copied). 1 collection `QualityMeasureFilterSets` (ES-exported,
    no host collision).
  - **Fixed a latent runtime crash carried from the original**:
    `client/QMSDashboard.jsx` imported `Trending` from `@mui/icons-material`
    (not a real icon → `undefined` → `React.createElement(undefined)` crash when
    the dashboard renders) → changed to `TrendingUp`. Verified via HMR (client
    recompiled 2 warnings → 1; the `Trending` ESModulesLinkingWarning gone). Also
    fixed legacy `iconName: 'assessment'` → `'Assessment'`.
  - server/index.js loads lib/* then the server pipeline in addFiles order;
    client.js preserves index.jsx + imports `lib/collections.js` for Minimongo
    parity. No old-MUI, no Atmosphere-isms, no `meteor/http`. No onUse consumers,
    nothing ES-imports it (sequencing safe; pacio-core does not depend on it). No
    Package-registry symbols. Monorepo-tracked → fresh git init.

### pacio-core migrated — 2026-06-14

- [x] pacio-core — `clinical:pacio-core` → `@node-on-fhir/pacio-core` — DONE
      2026-06-14, **boot-verified end-to-end** (`App running at` +
      `PACIO Core package server initialized` + **6 PACIO supportedProfiles in
      `/baseR4/metadata`** [TOC-Composition, TOC/ADI-DocumentReference,
      pfe-observation-single, pfe-collection, pfe-questionnaire-response] +
      0 fatal errors), decommissioned to `deprecated/`. PACIO ADI/TOC/PFE
      workflows + connectathon demo data (PACIO July 2026). Largest migration so
      far (68 src files, 25+ lazy routes, client+server mainModules).
      **Connectathon-critical** — was on the lifted Connectathon-freeze; user
      chose "migrate it, repoint consumers".
  - **Not gated** (6th false gate): onTest `clinical:pacio-core` is a
    self-reference. onUse deps all app infra. One external dep
    `google-map-react@^2.2.1` (already a root dep).
  - **Profile provider** (like us-core): `server/index.js` exports `ProfileSet`
    (PACIO TOC/ADI/PFE profiles) → discovered via the Package registry
    (`serverEntry: ./server` → `server.js` `export *`). Bundle/Provenance profiles
    correctly NOT in the CapabilityStatement (not REST-enabled resource types).
  - **Asset conversion (the connectathon sample data):** the Atmosphere package
    loaded `data/connectathon-july-2026-examples/examples.ndjson` (5 MB) via
    `Assets.getTextAsync` — no Assets API for npm packages. Converted to
    `examples.json` (497 resources, array) at migration time and imported directly
    in `server/methods/loadConnectathonData.js` (same Atmosphere-Asset →
    direct-import pattern as reference-app); the loop now iterates the array. The
    curated BSJ fixtures (`data/2026-07-cms-connectathon/*.json`) were already
    direct imports.
  - **Broken app-path imports (removed/deprecated host components)** — the lazy
    patient sub-pages imported host modules that no longer exist; Atmosphere's
    looser lazy resolution tolerated them, Rspack hard-fails. Fixes:
    `TableNoData` repointed to the real `/imports/components/TableNoData`; local
    compat shims added under `client/_compat/` for `StyledCard` (→ MUI Card),
    `PageCanvas` (→ Box), `PdfViewer` (→ renders `Meteor.PdfViewer` else a notice),
    `MedicationListsTable` (→ minimal functional MUI table). (`AdvanceDirectives`
    SimpleSchema import was already commented out — not a build error.)
  - **Consumer repointing (the user's choice) + client-side Package symmetry:**
    consumers gated on the Atmosphere key `Package['clinical:pacio-core']` →
    repointed to `Package['@node-on-fhir/pacio-core']`:
    `extensions/life-support-systems/server/{methods,index}.js` (server — already
    covered by the server-loader registry) and
    `npmPackages/sphr-analyzer/client/QualityChecksPage.jsx` ×2 (**client**).
    Client-side `Package` was previously server-only, so
    `workflows/rspack.workflowParser.js` was extended to also register
    `globalThis.Package[name]` in the generated **client** `loader.js` — making
    the registry symmetric (Atmosphere had `Package` on both sides). Documented in
    `.claude/rules/fhir/package-registry.md` § Client-side symmetry. Stale
    `--extra-packages "clinical:pacio-core"` doc comments in
    `extensions/desktop-{lunar-sim,chronicle}` scripts left as-is (non-functional;
    they also still reference `clinical:us-core` from that earlier migration).
  - Spans 4 repos: pacio-core nested repo, life-support-systems nested repo,
    sphr-analyzer nested repo, and the monorepo (manifest + lock + deprecated move
    + parser + doc + queue). Monorepo-tracked package → fresh git init.

### provider-directory — SCOPED & FEASIBLE, ready to execute (2026-06-14)

`mitre:national-directory`. NOT a mechanical migration — a real port — but
**feasibility is confirmed**: the user noted `clinical:vault-server` +
`clinical:hl7-fhir-data-infrastructure` are now absorbed into core/the app, so the
two big missing onUse deps are **removable by repointing**. Full investigation done;
every symbol the package imports has a home in `imports/` EXCEPT `UsCoreMethods`.

**Symbol → new-home map** (repoint ~20 import sites off
`meteor/clinical:hl7-fhir-data-infrastructure` + `meteor/clinical:vault-server`):

| Symbol(s) | New home |
|-----------|----------|
| `FhirUtilities` | `/imports/FhirUtilities` |
| `LayoutHelpers` | `/imports/lib/LayoutHelpers` |
| `DynamicSpacer` | `/imports/ui/DynamicSpacer` |
| `lookupReferenceName`, `FhirDehydrator` | `/imports/lib/FhirDehydrator` |
| `ValueSetDetail`, `CodeSystemDetail` | `/imports/ui-details` (index barrel) |
| all `*Table` (Organizations/Practitioners/Endpoints/Locations/HealthcareServices/InsurancePlans/ValueSets/CodeSystemsConcepts) | `/imports/ui-tables` (index barrel) |
| `SubscriptionsTable` | `/imports/ui-vault-server/SubscriptionsTable` |
| collections (Organizations/Practitioners/Endpoints/Locations/HealthcareServices/InsurancePlans/Networks/OrganizationAffiliations/PractitionerRoles/ValueSets/CodeSystems) | `/imports/lib/schemas/SimpleSchemas/<Name>` |
| `UdapCertificates` (was vault-server) | `/imports/lib/schemas/SimpleSchemas/UdapCertificates` |

Each Atmosphere import line pulls a *mix* of these, so each splits into several
repointed imports. `scratch/fast-security/*` also imports the infra but is NOT in
package.js `addFiles` → **skip scratch/** (don't copy it).

**The remaining (non-repoint) work — the actual decisions/effort:**
1. **MUI v4 → v5 across ~25 files** (the bulk port): `@material-ui/core` →
   `@mui/material`, `@material-ui/icons` → `@mui/icons-material`, `@material-ui/lab`
   → `@mui/lab`, plus v4→v5 API deltas. This is the real "rewrite."
2. **`UsCoreMethods` (clinical:uscore) — no home anywhere.** Single use:
   `server/methods.js:102 await UsCoreMethods.initializeValueSets();`. Note: this is
   `clinical:uscore` (no hyphen) — DIFFERENT from the migrated `@node-on-fhir/us-core`.
   **DECISION (user, 2026-06-14): PORT AN EQUIVALENT** — recover what
   `initializeValueSets()` did (seed US Core ValueSets) and reimplement it against the
   app's `ValueSets` collection (`/imports/lib/schemas/SimpleSchemas/ValueSets`).
   First step: locate the old `clinical:uscore` source (deprecated/ or git history) to
   see the valueset seed data + logic.
3. **`simple:json-routes` (missing) — 3 REST endpoints in `server/https.js`**:
   `GET /stats`, `POST /generateAndSignJwt`, `POST /newCertificate` (UDAP/FAST cert
   signing). **DECISION (user, 2026-06-14): CONVERT to the app's REST mechanism** —
   reimplement the 3 endpoints with WebApp connect handlers the way the app's FHIR
   endpoints register routes (`server/FhirEndpoints.js` / `WebApp.connectHandlers`),
   preserving the FAST cert-signing feature. Keep the CORS headers + JSON payloads.
4. **IPFS**: appears only in `package.js` (not imported in source) → likely a dead
   `Npm.depends`; drop it.

Then standard recipe: scaffold, repoint per the map, port MUI, resolve (2)+(3),
manifest entry, boot-verify, decommission, commit. ~30 src files; nested? (check).

### provider-directory migrated — 2026-06-14 (DONE — executed the plan above)

- [x] provider-directory — `mitre:national-directory` →
      `@node-on-fhir/provider-directory` — DONE 2026-06-14, **boot-verified
      end-to-end** (`App running at` + `[provider-directory] Server methods + REST
      endpoints + hooks registered` + 0 fatal errors + the converted
      `/provider-directory/stats` REST endpoint returns live counts: 12 orgs / 28
      practitioners / 27 practitioner-roles / 14 locations), decommissioned to
      `deprecated/`. National provider directory (FHIR VhDir) + UDAP/FAST. The
      largest *port* of the migration (vs pacio-core's largest *size*).
  - **Deps removed by repointing (the user's insight):** every symbol from
    `clinical:hl7-fhir-data-infrastructure` (53 symbols) + `clinical:vault-server`
    (`UdapCertificates`) was repointed to its home in the app's own `imports/`
    (per the map above), via a brace-safe script across 17 files. `CommunicationResponses`
    dropped (no such app collection).
  - **MUI v4 → v5** across 14 files (`@material-ui/core`→`@mui/material`,
    `/icons`→`@mui/icons-material`, `/styles`→`@mui/styles`).
  - **UsCoreMethods ported** (user chose "port an equivalent"): `clinical:uscore`
    source was gone, so `lib/UsCoreMethods.js` reimplements `initializeValueSets()`
    by seeding the 20 US Core 7.0.0 ValueSets (vendored from the us-core IG guide
    into `data/us-core-valuesets.json`) into the app's `ValueSets` collection.
  - **simple:json-routes → WebApp.handlers** (user chose "convert"): the 3 endpoints
    in `server/https.js` (`/stats`, `/generateAndSignJwt`, `/newCertificate`)
    reimplemented as `WebApp.handlers.use()` (Meteor v3 async; bodyParser.json is
    already app-wide), namespaced under `/provider-directory/*`; the 2 client call
    sites updated (ProviderDirectory `fetch`, FooterButtons `HTTP.post`).
  - **meteor/http → fetch shim:** reused the data-importer `httpClient.js` (9 HTTP
    calls across 8 client files + hooks.js). **IPFS:** was commented-out in
    `Npm.depends` — dead, dropped.
  - **Broken/disabled index.jsx reconciled:** the Atmosphere index.jsx was
    mid-refactor — imported `./client/MainPage` (the file was renamed to
    `ProviderDirectory.jsx`, whose default export is still internally `MainPage`)
    and routed (via the unsupported `component:` form) to FAST-security/UDAP pages
    that had been moved to `scratch/` (disabled). Rebuilt client.js: MainPage →
    `./client/ProviderDirectory`, routes converted to `element:` (the host renders
    `route.element`), dropped the scratch routes/sidebar, kept FooterButtons +
    DialogComponents. Compat shims under `client/_compat/`: `fhirStarter.js`
    (PageCanvas/StyledCard/DynamicSpacer — `fhir-starter` lib gone), `Carousel.jsx`
    (`react-multi-carousel` — installing it rewrote ~40 unrelated lockfile entries,
    so shimmed instead), `MissingDetails.jsx` (11 resource Detail components +
    NewCertificateDialog + AboutNatDirDialog with no home in the app → placeholders).
    The Details that DO exist were split: 7 from `/imports/ui-details`, 3 from
    individual `/imports/ui-fhir/*` modules.
  - **Method-collision guard:** the package redefines many UDAP / search-param /
    cert methods the app now provides (vault-server + infra in core), which threw
    "method already defined" at startup. `server/methods.js` now registers only
    names not already in `Meteor.server.method_handlers` — 5 skipped at boot
    (generateCertificate, generateAndSignJwt, initSearchParameters,
    fetchWellKnownUdap, sendSoftwareStatement; the core versions win).
  - Deps: node-forge, jsonwebtoken, ndjson-parse (all app-present → `dependencies`).
    Not in `.meteor/packages`; no consumers. Monorepo-tracked → fresh git init.

### genome-central-redux migrated — 2026-06-14 (was DEFERRED slot 29 — now DONE)

- [x] genome-central-redux — `awatson:genome-central-redux` →
      `@node-on-fhir/genome-central-redux` — DONE 2026-06-14, **boot-verified
      end-to-end** (`App running at` + `[genome-central-redux] Server methods
      registered` + 0 fatal errors), decommissioned to `deprecated/`. Chromosome
      ideogram browser + AI genome chart. **Nested repo** (awatson1978/...) —
      migrated on an `npm-migration` branch, `.git` preserved.
  - **The queue's deferral note overestimated the scope.** Reality: **no Redux**
    (despite the name), and only **3 of 12** declared deps are actually imported &
    were missing (`ideogram`, `bedjs`, `gpt-tokens` — installed cleanly, +25/-0
    lockfile). `blastjs` is commented out (dead). The other declared deps
    (bionode-sam, biojs-alg-seqregion, d3, object-path, onecolor) are never imported.
  - **The material-ui v0.x files are DEAD CODE.** `GenomePage.js`, `Karyotype.js`,
    `client/risk-assessments/*` (material-ui v0.x + react-mixin/getMeteorData +
    react-bootstrap + an undefined `RiskAssessments` global) are NOT reachable from
    the entry import graph (client.js → GenomeChart + IdeogramPage →
    IdeogramComponent + FooterButtons), so Rspack never bundles them — **no v0.x→v5
    port was needed.** Left as dormant legacy code. (react-mixin installed since the
    dead files import it; react-bootstrap NOT installed — its react-dom peer
    surfaced the app's pre-existing react 18.3.1 / react-dom 19.2.7 skew; only dead
    files used it anyway.)
  - **meteor/http → fetch shim** (reused data-importer `httpClient.js`) in
    GenomeChart / SmartOnFhir / FooterButtons (GenomeChart relied on the Atmosphere
    `HTTP` global — added the import).
  - **rspack.config.js (app-level):** GenomeChart imports `@langchain/core` +
    `@langchain/openai` client-side (first such consumer); their `'process/browser'`
    (no-ext) imports fail Rspack strict ESM. Added a `fullySpecified:false` module
    rule for `@langchain`/`langsmith`/`openai`, mirroring the existing `@spz-loader`
    rule. The existing `process`→`process/browser` fallback then resolves them.
  - **lib/collections.js load-order guards:** its `Meteor.startup` assumed
    `global.Collections` / `Meteor.Collections` / `Meteor.FhirUtilities` exist —
    the Atmosphere load order guaranteed that, the NPM workflow order does not.
    Guarded all three accesses (+ the `QuestionnaireResponses.allow` and the
    Observations publish) with `lodash.get` + presence checks; this was the boot
    crash. Decommissioned as a gitignored nested repo (like data-exporter).
