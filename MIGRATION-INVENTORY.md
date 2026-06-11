# Migration Inventory: packages/* → npmPackages/*

> Read-only survey of all 55 Atmosphere package directories, performed
> 2026-06-11 by four parallel exploration agents. Companion to
> [FABLE-TECH-DEBT-PAYDOWN.md](FABLE-TECH-DEBT-PAYDOWN.md) § P1 migration and
> the `/migrate-atmosphere-package` command.

## Headline Findings

1. **No packages live in `.meteor/packages`** (only the 4 framework-layer
   ones) — they load **ad hoc via `--extra-packages "ns:name, ..."` on the
   run command**. Migration still can't break a default boot; the real
   verification target is the user's active run profile. The observed
   day-to-day profile (2026-06-11) loads 17: pacio-core, us-core,
   data-importer, data-exporter, structured-data-capture,
   life-support-systems, digital-cloche, greenhouses, orbital:core,
   monetization, symptomatic:timelines, pantry-management, secure-messaging,
   ecg, genome-central-redux, personal-characteristics, symptom-tracking —
   **these are the migration priority, straight from real usage.**
2. **28 packages are Tier A** — zero non-core dependencies, mechanically
   migratable, ideal for a guarded batch/Ralph run after the command is
   proven once.
3. **The dependency graph is tiny**: admin-tools ← data-exporter;
   structured-data-capture ← healthcare-surveys; {pantry-management,
   symptom-tracking, ecg, lunar-maps} ← orbital. Everything else is isolated.
4. **Git topology** (corrected 2026-06-11): 41 packages are **force-added to
   the honeycomb monorepo** (`git add --force` bypassing the `.gitignore` —
   8,600+ tracked files), 13 have their **own nested repos** with remotes
   (awatson1978 / symptomatic / node-on-fhir orgs), and exactly **one is a
   true orphan: email-list** (no monorepo tracking, no own repo). Almost
   **no LICENSE files anywhere**.
5. **Size figures for the big packages are inflated** — file counts included
   `node_modules`/vendored assets inside package dirs (e.g. "5,921 files" for
   ecg). Treat large LOC numbers as upper bounds.

## Tier Summary

| Tier | Count | Meaning | Names |
|------|-------|---------|-------|
| 🟢 A | 28 | No non-core deps — mechanically migratable | see § Tier A |
| 🟡 B | 12 | Mechanical with a twist (core-runtime conversion, schema lib, Blaze, or just big) | see § Tier B |
| 🟠 C | 4 | Local-package sequencing required | admin-tools, data-exporter, healthcare-surveys, orbital |
| 🔴 D | 11 | Design work — not loop material | see § Tier D |

## Recommended Sequence

```
0. Prove /migrate-atmosphere-package on lunar-maps (supervised, one session)
1. Guarded batch/Ralph over remaining Tier A (migrate-only, never decommission,
   enabled:false, no pushes, skip-on-judgment-call, morning review)
2. admin-tools → data-exporter (Tier C chain 1)
3. structured-data-capture → healthcare-surveys (Tier C chain 2)
4. Tier B singles as appetite allows (drug-formulary needs Blaze→React)
5. ecg (Tier D but a dependency target — must precede orbital; preserve
   VitalsTabContent/EcgTabContent export contract)
6. orbital (after pantry-management, symptom-tracking, ecg, lunar-maps)
7. Remaining Tier D one at a time with design discussion
8. reference-app last or never — it weak-deps all 28 clinical packages and
   serves as the certification harness
```

## Dependency Graph (local packages only)

```
admin-tools  ◄── data-exporter
structured-data-capture  ◄── healthcare-surveys
pantry-management   ◄──┐
symptom-tracking    ◄──┼── orbital  (hard)
ecg                 ◄──┘
lunar-maps          ◄────── orbital  (weak)
{all 28 clinical:*} ◄────── reference-app  (all weak)
provider-directory ──► clinical:hl7-fhir-data-infrastructure, clinical:vault-server,
                       clinical:uscore, simple:json-routes
                       ⚠️ NOT PRESENT in tree — already unbuildable.
                       Note naming drift: tree has clinical:us-core, dep says clinical:uscore
```

Shared infrastructure used at runtime (stays Atmosphere for now, consumed by
NPM packages via Meteor globals / `global.Collections`):
`clinical:extended-api`, `clinical:hl7-resource-datatypes`,
`matb33:collection-hooks` (used by smart-web-messaging,
structured-data-capture, vital-signs, workqueues — a future NPM port or
drop-in is a one-time unlock for all four).

---

## 🟢 Tier A — Mechanically Migratable (28)

No non-core Atmosphere dependencies. Mostly small ONC compliance modules with
the identical shape: `index.jsx` + `server/methods.js`, DynamicRoutes +
SidebarWorkflows/ClinicianWorkflows exports.

### ONC compliance modules (~800–2.5k LOC each)

| Package | Atmosphere name | LOC | Server | Notes |
|---------|----------------|-----|--------|-------|
| accounts-management | clinical:accounts-management @1.0.0 | ~1.2k | 1 method, pubs | §170.315(d)(1) auth/access control |
| antimicrobial-reporting | clinical:antimicrobial-reporting @1.0.0 | ~952 | 1 method | CDC NHSN surveillance |
| cancer-registry-reporting | clinical:cancer-registry-reporting @1.0.0 | ~877 | 1 method | §170.315(f)(4) |
| case-reporting | clinical:case-reporting @1.0.0 | ~799 | 1 method | eCR §170.315(f)(5) |
| ccda-export | clinical:ccda-export @1.0.0 | ~2.1k | 1 method, pubs | Collections: ClinicalDocuments, DocumentRevisions; exports ModuleConfig |
| clinical-lists | clinical:clinical-lists @0.1.0 | ~2.2k | 1 method, pubs | §170.315(a)(6-8) problem/med/allergy lists |
| drug-interactions | clinical:drug-interactions @0.1.0 | ~1.2k | 1 method | §170.315(a)(4); ModuleConfig pattern |
| e-prescribing | clinical:e-prescribing @0.1.0 | ~2k | 7 methods | NCPDP SCRIPT |
| family-health-history | clinical:family-health-history @1.0.0 | ~775 | 4 methods, 3 pubs | §170.315(a)(12) family tree |
| immunization-registry | clinical:immunization-registry @1.0.0 | ~977 | 5 methods | §170.315(f)(1); has tests |
| implantable-devices | clinical:implantable-devices @0.1.0 | ~2k | 9 methods | §170.315(g)(7) UDI/GUDID |
| lab-test-reporting | clinical:lab-test-reporting @1.0.0 | ~801 | 4 methods | §170.315(f)(3); has tests |
| request-for-corrections | clinical:request-for-corrections @0.1.0 | ~5.6k | 3 methods, 5 pubs, startup | Collections: CorrectionRequests/Communications/Tasks |

### Lunar / space simulator set

| Package | Atmosphere name | LOC | Notes |
|---------|----------------|-----|-------|
| lunar-maps | orbital:lunar-maps @0.1.0 | ~1.9k | ✅ **MIGRATED 2026-06-11** (proving run) → `npmPackages/lunar-maps`, original parked in `deprecated/`. Lessons: api.addFiles CSS needs explicit import; iconName MUI casing |
| pantry-management | clinical:pantry-management @0.1.0 | ~4.1k | Exports NutritionTabContent (orbital embeds it — preserve contract). Own repo: awatson1978/pantry-management |
| symptom-tracking | symptomatic:symptom-tracking @0.1.0 | ~6.2k | Exports SymptomsTabContent (orbital embeds it). Own repo: symptomatic/symptom-tracking |
| life-support-systems | orbital:life-support-systems @0.1.0 | ~10.8k | 12 methods, 6 pubs; client-state collections (SimulationState, ConsumptionHistory). Own repo: awatson1978/life-support-systems |
| digital-cloche | orbital:digital-cloche @0.1.0 | ~8.7k | Greenhouse/terrashroom sim; terrashroomProxy bridges external systems. Own repo: awatson1978/digital-cloche |

### Misc

| Package | Atmosphere name | LOC | Notes |
|---------|----------------|-----|-------|
| checklist-manifesto | clinical:checklist-manifesto @0.1.0 | ~2.5k | Collections: ChecklistLists, ChecklistTasks |
| email-list | clinical:email-list @0.1.0 | ~787 | EmailList collection; rate-limited subscribe; verify/unsubscribe routes |
| international-patient-summary | clinical:international-patient-summary @0.1.0 | ~5.2k | IPS Composition generator; exports IpsContent via Meteor.startup |
| leaderboard-starter | mitre:leaderboard-starter @0.7.0 | ~3.4k | MainPage override; sidebar label is a copy-paste bug ("International Patient Summary") |
| monetization | orbital:monetization @0.1.0 | ~24k* | Stripe; FeatureGate tier access. Own repo: awatson1978/monetization (*size likely inflated) |
| patient-chart-starter | mitre:patient-chart-starter @0.7.0 | ~3.9k | MainPage override; MITRE reference |
| personal-characteristics | clinical:personal-characteristics @1.0.0 | ~757 | Client-only; 8 dermatome PNGs (light/dark pairs); settings-gated route. Own repo: node-on-fhir/personal-characteristics |
| sphr-analyzer | mitre:sphr-analyzer @0.5.1 | ~1.3k | Client-only analysis pages |
| synthea | clinical:synthea @0.1.0 | ~3.2k | Synthea config UI; 2 methods, startup |
| us-core | clinical:us-core @7.0.1 | ~1.1k | Server-only ProfileSet/ProfileDecorators for CapabilityStatement; client stub |

## 🟡 Tier B — Mechanical With a Twist (12)

Deps only on the always-active framework layer (convert `api.use` to runtime
globals — `Meteor.FhirUtilities`, `global.Collections` — which
`/migrate-atmosphere-package` § Step 3 covers), or a contained mechanical
issue.

| Package | Atmosphere name | LOC | Twist |
|---------|----------------|-----|-------|
| multi-factor-auth | clinical:multi-factor-auth @0.1.0 | ~2k | clinical:extended-api (runtime-global conversion) |
| order-catalog | clinical:order-catalog @0.1.0 | ~3.2k | clinical:extended-api |
| pacio-core | clinical:pacio-core @0.1.0 | ~20.6k | clinical:extended-api; heavy lazy/Suspense; Beds collection (lifesupport reads it) |
| secure-messaging | clinical:secure-messaging @0.1.0 | ~1.6k | extended-api + hl7-resource-datatypes |
| social-determinants | clinical:social-determinants @1.0.0 | ~801 | extended-api + hl7-resource-datatypes |
| syndromic-surveillance | clinical:syndromic-surveillance @1.0.0 | ~588 | extended-api + hl7-resource-datatypes; 3 pubs |
| structured-data-capture | clinical:structured-data-capture @0.1.0 | ~6.5k | hl7-resource-datatypes + collection-hooks; healthcare-surveys depends on it — migrate before |
| workqueues | clinical:workqueues @0.1.0 | ~4.2k | collection-hooks (weak); 9 pubs; REST endpoints; WorkQueues/WorkQueueItems collections |
| patient-matching | clinical:patient-matching @0.1.0 | ~4.5k | mdg:validated-method → port to plain methods. License: MIT (the only one found!) |
| consent-generator | clinical:consent-generator @0.1.0 | ~1.2k | aldeed:collection2 → simpl-schema npm |
| drug-formulary | clinical:drug-formulary @0.1.0 | ~995 | **Blaze/HTML templates** → React conversion needed |
| data-importer | clinical:data-importer @0.17.0 | ~25.7k | No deps — just large (XLSX/HealthKit importers, 3 collections); budget a full session |

## 🟠 Tier C — Sequencing Required (4)

| Package | Atmosphere name | LOC | Blocker |
|---------|----------------|-----|---------|
| admin-tools | clinical:admin-tools @0.1.0 | ~7.3k | None itself — but data-exporter depends on it: **migrate early**. Patient delete/archive/anonymize, AdminToolsState collection |
| data-exporter | clinical:data-exporter @0.12.2 | ~17.3k | Hard dep: clinical:admin-tools. Own repo: symptomatic/data-exporter |
| healthcare-surveys | clinical:healthcare-surveys @1.0.0 | ~6.5k | Hard dep: clinical:structured-data-capture. §170.315(f)(7); has LICENSE file |
| orbital | orbital:core @0.1.0 | ~17k | Hard deps: pantry-management, symptom-tracking, **ecg**; weak: lunar-maps. 20 pubs, cron (Horizons/SWPC/CelesTrak). Own repo: awatson1978/orbital. **Migrate last of the lunar set** |

## 🔴 Tier D — Design Work, Not Loops (11)

| Package | Atmosphere name | Why design work |
|---------|----------------|-----------------|
| ecg | clinical:ecg @0.1.0 | Dependency target (orbital embeds VitalsTabContent/EcgTabContent — export contract must survive); dcmjs-ecg dep; TS files; size badly inflated (~291k incl. vendored). Own repo: node-on-fhir/ecg. **Must precede orbital** |
| genome-central-redux | awatson:genome-central-redux @0.7.0 | ~417k LOC*; ~1,659 TS files; blastjs/ideogram/bionode + @langchain/openai; MainPage override. Own repo: awatson1978/genome-central-redux |
| greenhouses | orbital:greenhouses @0.1.0 | **SyncedCron jobs (~25)** need Meteor.setInterval/cron redesign; AWS Cognito auth; 13 collections (Molekule + AmbientWeather integrations). Own repo: awatson1978/greenhouses |
| hipaa-compliance | clinical:hipaa-compliance @0.1.0 | Infrastructure: collection-hooks auto-audit on writes, alanning:roles, HipaaLogger consumed by other packages. ~22.7k LOC, TS files. Migrating this changes the audit story — design first |
| mcp | symptomatic:mcp @0.1.0 | ~128k LOC*; MCP server + A2A bridge + LangChain vector search; TS-heavy. Own repo: symptomatic/mcp |
| provider-directory | mitre:national-directory @0.13.10 | 4 hard deps **absent from tree** (hl7-fhir-data-infrastructure, vault-server, uscore, simple:json-routes) — already unbuildable; 100+ FHIR conformance assets. Decide: resurrect deps, vendor them, or retire |
| quality-measures | clinical:quality-measures @0.1.0 | cql-execution engine; §170.315(c)(1-4) certification-critical; ~160k LOC*. Own repo: clinical-meteor/quality-measures |
| reference-app | clinical:reference-app @0.2.0 | Weak-deps ALL 28 clinical packages; the (g)(10) certification harness + test patient Daisey. Migrate **last or never** — it is the integration test of everything else |
| smart-web-messaging | clinical:smart-web-messaging @0.0.1 | aldeed:collection2 + collection-hooks + hl7-fhir-resources schema validation woven through; 4 pubs |
| timelines | symptomatic:timelines @0.8.0 | ~673k LOC*; 105 TS files; vis/vis-timeline; 205 HTML files; note says Editor already moved to npmPackages/timelines — partial migration exists, reconcile first. Own repo: symptomatic/timelines |
| vital-signs | clinical:vital-signs @0.1.0 | ~381k LOC*; 398 TS files; recharts + @nivo; 3 methods, 5 pubs. Declared repo (clinical-meteor/clinical-vital-signs) but no .git |

\* = file/LOC counts inflated by node_modules/vendored assets inside the package dir.

## Git / License Audit (feeds P2 registry item)

**Force-added to the honeycomb monorepo** (41 packages, `git add --force`
bypassing `.gitignore` — intentional house pattern): all packages NOT listed
below. Their history lives in the main repo; git URLs declared in package.js
(clinical-meteor org etc.) are provenance pointers, not active remotes.

**Own nested repo + remote** (13): digital-cloche, ecg, genome-central-redux,
greenhouses, life-support-systems, lunar-maps, mcp, monetization, orbital,
pantry-management, personal-characteristics, symptom-tracking, timelines.
(Note: data-exporter and quality-measures report remotes via package metadata
but are monorepo-tracked — verify at migration time.)

**True orphan** (1): **email-list** — not force-added to the monorepo and no
own repo. ~787 LOC. Either force-add it or give it a repo.

**Licenses**: only patient-matching (MIT) and healthcare-surveys +
leaderboard-starter (LICENSE files) declare anything. Everything else is
unlicensed-by-omission — decide deliberately per package during migration
(default for trade-secret work: UNLICENSED + private repo).

**Migration note**: for the 41 monorepo-tracked packages, migrating to
`npmPackages/{name}` means choosing between (a) staying monorepo-tracked via
a new force-add of the npm location, or (b) graduating to a nested repo per
the tracss-to-fhir pattern. The `/migrate-atmosphere-package` command's git
step should ask.

## Known Data-Quality Caveats

- Inventory is from package.js + main-module reads, not builds — `api.use`
  declarations may be stale relative to actual imports (verify per package
  at migration time, per the command's Step 1)
- Size figures with * include vendored content
- The four agents applied classification judgment slightly differently;
  records were normalized to the tier definitions above during synthesis
- "git: node-on-fhir/honeycomb" results in some raw agent output were parent
  repo fall-through (the package itself has no repo) — corrected here
