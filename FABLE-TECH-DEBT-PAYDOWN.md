# Fable Tech-Debt Paydown Plan

> Actionable backlog derived from [FABLE-ANALYSIS.md](FABLE-ANALYSIS.md)
> (2026-06-10). Each item: problem → checkbox actions → key files → rough
> effort. Priorities: P1 = structural, do first; P2 = guardrails; P3 = nice
> to have / investigations.

---

## P1 — Fix theming at the root (retire the workaround)

**Problem**: The `isDark` Golden Rule is a workaround for `CustomThemeProvider`
ingesting settings values with `!important` flags and fighting MUI's palette.
Every component pays boilerplate tax; MUI surface tokens render white-on-white
in dark mode.

- [x] ~~Sanitize settings palette values at ingestion~~ **DONE 2026-06-11**
      (`getThemeSetting()` in `imports/ui/App.jsx` — all 18 color reads;
      16 live settings files carried `!important`; errorColor/appBarTextColor/
      cardColor were silently dropping as invalid CSS — worse than documented)
- [x] ~~Make CustomThemeProvider the single palette authority~~ **DONE
      2026-06-11** (StyledMainRouter now consumes
      `muiTheme.palette.background.default`; MuiCard/MuiDrawer overrides use
      settings-derived surfaces; legacy canvasColor key wired in)
- [x] ~~Verify MUI tokens track the toggle in both modes~~ **DONE
      2026-06-11** (visual verification after full meteor reset + rebuild)
- [x] ~~Update audit-theme + theme-auditor~~ **DONE 2026-06-11** (override
      preambles replaced with post-fix doctrine notes; their token-based
      bodies are valid again, so full rewrites are no longer needed)
- [x] ~~Update theming docs to post-fix doctrine~~ **DONE 2026-06-11**
      (theming.md rewritten; root CLAUDE.md, packages/CLAUDE.md §8,
      npmPackages/CLAUDE.md, migration-pattern.md, post-tool-use-theme hook,
      migrate-atmosphere-package Step 4 all flipped: tokens preferred,
      isDark supported legacy)
- [ ] Retire per-component `isDark` boilerplate opportunistically (ongoing —
      when touching a file, not as a campaign)
- [ ] Migrate legacy direct settings reads in Header.jsx / Footer.jsx /
      DICOM pages / Styles.js to theme consumption (opportunistic)

**Key files**: `imports/ui/App.jsx` (getThemeSetting ~1430, CustomThemeProvider
~1440-1640), `settings/settings.*.json`, `.claude/rules/ui/theming.md`
**Status**: Root fix + doctrine SHIPPED 2026-06-11; only opportunistic
cleanup remains

---

## P1 — Finish the Atmosphere→NPM migration

**Problem**: Two package systems = two theming regimes, two doc sets, two
registration mechanisms. Every contributor must learn which side of the fence
they're on. The 2026-06-10 theming doctrine conflict was a symptom.

- [x] ~~Inventory remaining `packages/*` — record size, dependencies on other
      Atmosphere packages, and migration blockers~~ **DONE 2026-06-12** — swept
      all 54 Atmosphere packages → `ATMOSPHERE-MIGRATION-INVENTORY.md` (size,
      cross-deps, git posture, recommended order). Surfaced 5 anomalies:
      `email-list` in no repo, `data-exporter` double-homed, stale
      `orbital:lunar-maps` weak ref at orbital/package.js:36,
      `provider-directory`=`mitre:national-directory` name mismatch, `mcp`
      cross-volume header. Confirmed orbital gates: pantry-management, ecg,
      symptom-tracking
- [x] ~~Migrate smallest first to shake out the command: lunar-maps~~
      **DONE 2026-06-11** — proving run passed full boot verification
      alongside the 17-package Atmosphere constellation; original parked in
      `deprecated/`; command updated with lessons (api.addFiles CSS,
      iconName casing, move-don't-delete decommission)
- [x] ~~Migrate **life-support-systems** (client-only collections, clean)~~
      **DONE 2026-06-12** — `npmPackages/life-support-systems`
      (`@node-on-fhir/life-support-systems`, UNLICENSED). client.js/server.js/
      package.json/workflow.json authored; 19 components + 12 lib + 3 server
      files carried over; starfield asset rehomed to the parser's
      `public/workflows/` pipeline; manifest entry added (`serverEntry ./server`).
      Nested repo on `npm-migration` branch (history preserved; not pushed per
      user). BOOT-VERIFIED: clean meteor boot logged `[life-support-systems]
      Server entry loaded` → `Life Support Systems: Server Startup` →
      `Startup complete` → `App running at http://localhost:3000/` (both bundles
      compiled clean; only pre-existing pkijs/fhir-react warnings). Browser
      pixel-check (Step 7.4) left to user. Original decommissioned to
      `deprecated/life-support-systems` (keeps its repo/remote). ⚠️ If your CLI
      run profile passes `orbital:life-support-systems` via `--extra-packages`,
      swap it for `EXTRA_WORKFLOWS=@node-on-fhir/life-support-systems`.
- [ ] Migrate **orbital** last (largest; depends on `clinical:pantry-management`,
      `symptomatic:symptom-tracking`, `clinical:ecg` — those must move first
      or the daily-log tabs need decoupling)
- [ ] Use `/migrate-atmosphere-package {name}` for each (see
      `.claude/commands/migrate-atmosphere-package.md`)
- [ ] After the last migration: consolidate `packages/CLAUDE.md` +
      `npmPackages/CLAUDE.md` into a single package-development doc; retire
      the Atmosphere loader path

**Key files**: `packages/*`, `npmPackages/*`, `workflows/workflows.json`,
`.meteor/packages`
**Effort**: 1 session per small package; orbital is multi-session

---

## P2 — Make the string contracts checkable

**Problem**: `global.Collections.X`, Session keys, and icon names are
load-bearing string contracts verified by nothing. Typos fail silently.

- [x] ~~Create a shared Session-key constants module~~ **DONE 2026-06-12** —
      `imports/lib/SessionKeys.js` (isomorphic, dependency-free). Surveyed all
      685 distinct Session keys; curated the load-bearing / cross-package ones
      into grouped constants (patient context, user/auth, main dialog, app
      chrome, FHIR-id toggles, orbital simulator, hexgrid, timeline,
      MainSearch.*) plus `SELECTED_ID(resourceType)` / `SELECTED_RESOURCE()`
      helpers for the `selectedXId` pattern. Adopt-in-new-code; old literals
      migrate opportunistically. Local UI state (tab indices, form buffers)
      deliberately left inline.
- [x] ~~Add workflow.json schema validation to
      `workflows/rspack.workflowParser.js`~~ **DONE 2026-06-12** —
      `validateWorkflows()` runs in `generate()` over the enabled set (no-op
      when none enabled, so zero risk to normal builds). THROWS on hard errors
      (missing `package`, malformed JSON, routes/sidebarItems missing required
      string fields, path not starting `/`); WARNS on soft issues (serverEntry
      defaulting to `./server/methods` — the publications/cron gotcha; lowercase
      or unknown MUI iconName via `_muiIconExists()` against
      @mui/icons-material; route component not referenced in client.js → renders
      null). Verified: clean pass on life-support-systems, throws+warns on a
      crafted broken workflow.json.
- [x] ~~Startup warning when a package references `global.Collections.{name}`
      that isn't registered (wrap access or audit at boot)~~ **DONE 2026-06-12**
      — both strategies the item offers: (1) `scripts/audit-global-collections.js`
      (build/CI) cross-checks every `global.Collections.X`/`Meteor.Collections.X`
      reference against the registered set (server/main.js blocks + direct
      assigns) UNION the 179 `new Mongo.Collection('X')` definitions (so the
      ~170 dynamically-registered FHIR collections don't false-positive); exits
      1 on drift. (2) `imports/lib/globalCollections.js` — `getCollection(name)`
      / `assertCollectionsRegistered(names)` guarded accessors that warn once
      per missing name at access time. Audit surfaced **7 genuine unknowns**:
      `EpisodesOfCare` (→ `EpisodeOfCares`), `Group` (→ `Groups`), `Sequences`
      (→ `MolecularSequences`), CommunicationResponses, DetectedIssues,
      DeviceUseStatements, InventoryItems. (NB: `EpisodesOfCare` is referenced by
      life-support's server, carried over faithfully from the Atmosphere
      original — pre-existing, guarded, feature silently disabled.)
- [x] ~~Document the Session-key contract table in one place~~ **DONE
      2026-06-12** — `.claude/rules/meteor/session-keys.md` consolidates the
      load-bearing/cross-package keys into one contract table (patient context,
      main dialog, the orbital simulator chain shared across 5 packages, hexgrid,
      timeline, MainSearch.*, per-resource `selectedXId`), each with set-by /
      read-by / meaning, pointing at `imports/lib/SessionKeys.js` as the
      executable source of truth.

**Key files**: `workflows/rspack.workflowParser.js`, new
`imports/lib/SessionKeys.js`, `server/main.js`
**Effort**: ~1 session

---

## P2 — Package registry manifest (repos, visibility, licenses)

> **Largely superseded 2026-06-11** by the directory architecture: `core/*`
> (tracked, Apache-2.0) vs `extensions/*` (gitignored, nested private repos,
> UNLICENSED) encodes visibility/license in the package's LOCATION. Licensing
> decision recorded: AGPL main app / Apache-2.0 core / UNLICENSED extensions.
> What remains of this item: a remote-URL audit for extensions/* packages
> (uncommitted-work / unpushed-branch drift detection).

**Problem**: Each package is its own gitignored nested repo. This session
produced doc files that existed in no repository, and a near-miss on
trade-secret placement. No single source of truth for package → remote →
visibility → license.

- [x] ~~Extend `workflows/workflows.json` (or add `PACKAGES.md`) with repo /
      visibility / license~~ **SUPERSEDED 2026-06-12** — visibility+license are
      encoded by directory LOCATION (`core/*` Apache-2.0 tracked vs
      `extensions/*` UNLICENSED private), per the 2026-06-11 architecture
      decision. A static manifest would immediately go stale; the audit script
      below regenerates the live picture on demand instead.
- [x] ~~Audit current state: every dir in `packages/` and `npmPackages/` —
      repo? remote? visibility correct?~~ **DONE 2026-06-12** — ran
      `scripts/audit-package-repos.sh` across all 69 packages (packages/,
      npmPackages/, core/, extensions/). 16 flagged: 2 orphans
      (`packages/email-list`, `npmPackages/voyager-technologies` — in NO repo),
      1 double-homed (`packages/data-exporter`), plus uncommitted work in 7
      nested repos and no-upstream in 5 npmPackages. See inventory doc anomalies.
- [x] ~~Add a check script that flags drift (no remote, uncommitted, mismatch)~~
      **DONE 2026-06-12** — `scripts/audit-package-repos.sh` classifies each
      package (tracked / nested / orphan / double-homed) and flags no-remote,
      uncommitted, unpushed, no-upstream, and NO-REPOSITORY drift. Modes:
      default table, `--problems`, `--tsv`. Exits 1 on any drift (CI-friendly).

**Key files**: `workflows/workflows.json` or new `PACKAGES.md`, new audit script
**Effort**: ~half session

---

## P3 — Fast unit-test layer for isomorphic lib/ code

**Problem**: Testing is Nightwatch-E2E-heavy (3-second subscription pauses).
The isomorphic libs (hexgrid `lib/engine/`, tracss `lib/mappers/`) are
perfectly unit-testable — pure functions, deterministic, no Meteor — but no
harness exists. (House rule: no vitest.)

- [x] ~~Pick the runner: plain `node --test`~~ **DONE 2026-06-12** — `node --test`
      (zero deps, native to Node 20 in CI). Nightwatch stays for E2E.
- [x] ~~Seed with tracss mapper tests~~ **DONE 2026-06-12** —
      `npmPackages/tracss-to-fhir/tests/mapCdmToBundle.test.js`, 7 tests covering
      the full v0.1 spec (valid transaction Bundle, both Devices, DetectedIssue
      implicates both, Pc→Observation+RiskAssessment, Provenance always present,
      determinism, useful errors on invalid CDM). `npm test` wired. (Committed in
      the tracss nested repo.)
- [x] ~~Add hexgrid turn-engine tests~~ **DONE 2026-06-12** —
      `npmPackages/hexgrid/tests/turnEngine.test.js`, 7 tests: seededRandom/
      hashCode determinism + [-1,1] bound, processTurn replay determinism,
      CONSUMPTION_RATES spec, consumption = crewCount×rate (4 crew → O2 4/H2O 12/
      cal 10000), scoring bounds (each 0-200, total 0-1000, total==sum). Added
      `type:module` (lib was already ESM). (Committed in the hexgrid nested repo.)
- [x] ~~Wire into CI~~ **DONE 2026-06-12** — `scripts/run-lib-tests.sh` discovers
      every package with a `tests/` dir and runs `node --test`; root
      `npm run test:lib`; new `lib-unit-tests` CircleCI job (node-only, no
      browser/Mongo/Meteor) added to the `parallel-tests` workflow. NB: because
      npmPackages/* are gitignored, the job is a no-op in a bare monorepo
      checkout and runs whatever IS present (everything in local dev; core/* in
      CI; each nested repo also runs its own `npm test`).

**Key files**: `npmPackages/tracss-to-fhir/tests/`,
`npmPackages/hexgrid/tests/`, `.circleci/config.yml`
**Effort**: ~1 session

---

## P3 — `_id`/`id` structural investigation

**Problem**: The #1 documented bug class (OR-logic ID collisions) exists
because flattened records carry both MongoDB `_id` and FHIR `id`. Rule + hook
+ `/audit-id-lookups` are mitigation; the cure is unexplored.

- [ ] Investigate: can `flattenX()` functions emit a single canonical lookup
      key (e.g. always `_id`, with `id` renamed to `fhirId` in flattened
      output) without breaking FHIR API compliance on the wire?
- [ ] Survey blast radius: every consumer of flattened `.id`
- [ ] Decision doc: structural fix vs permanent mitigation

**Key files**: `imports/lib/FhirDehydrator.js`,
`.claude/rules/anti-patterns/id-lookup.md`
**Effort**: investigation ~half session; fix TBD by findings

---

## P3 — Refresh /create-npm-workflow command

**Problem**: `.claude/commands/create-npm-workflow.md` predates this session's
learnings — it emits MIT license unconditionally, uses pre-Golden-Rule theme
tokens (`color: 'text.primary'` in the page template), and omits the
`workflows/workflows.json` manifest registration step (whose absence silently
skips publications + cron via the `./server/methods` serverEntry default).

- [ ] Template: `isDark` theming per the Golden Rule
- [ ] Template: ask license + visibility (default `"private": true` +
      UNLICENSED for trade-secret work)
- [ ] Add the `workflows/workflows.json` entry step with
      `"serverEntry": "./server"`
- [ ] Add nested git repo init + remote convention step
- [ ] Align with `/migrate-atmosphere-package` so the two commands share
      conventions

**Key files**: `.claude/commands/create-npm-workflow.md`
**Effort**: ~quarter session

---

## Sequencing Recommendation

```
1. P1 theming root fix          (small code change, big doc ripple — do while
                                 the Golden Rule context is fresh)
2. P1 migration: lunar-maps     (proves /migrate-atmosphere-package)
3. P2 package registry manifest (cheap, prevents repo accidents during the
                                 migration wave)
4. P1 migration: remaining packages
5. P2 contract checking         (best done as packages move — constants module
                                 adopted during migration touch)
6. P3 items                     (as appetite allows)
```
