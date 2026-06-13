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
