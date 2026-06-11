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

- [ ] Sanitize settings palette values at ingestion in `CustomThemeProvider`
      (strip `!important`, already partially done for paperColor at
      `imports/ui/App.jsx` ~line 1571 — make it universal)
- [ ] Make `CustomThemeProvider` the single palette authority: every
      mode-dependent color flows through `createDynamicTheme()`, nothing reads
      `Meteor.settings.public.theme.palette` directly in components
- [ ] Verify MUI tokens (`background.paper`, `text.primary`,
      `theme.palette.mode`) now track the toggle correctly in both modes
- [ ] THEN: full rewrites of `.claude/commands/audit-theme.md` and
      `.claude/agents/theme-auditor.md` (currently carrying 2026-06-10
      override preambles, bodies still describe token doctrine)
- [ ] THEN: update `.claude/rules/ui/theming.md` + `packages/CLAUDE.md` +
      `npmPackages/CLAUDE.md` to the post-fix doctrine; begin retiring
      per-component `isDark` boilerplate opportunistically

**Key files**: `imports/ui/App.jsx` (CustomThemeProvider ~1425-1620),
`configs/settings.*.json`, `.claude/rules/ui/theming.md`
**Effort**: ~2-3 sessions (the fix is small; the doc/component ripple is the work)

---

## P1 — Finish the Atmosphere→NPM migration

**Problem**: Two package systems = two theming regimes, two doc sets, two
registration mechanisms. Every contributor must learn which side of the fence
they're on. The 2026-06-10 theming doctrine conflict was a symptom.

- [ ] Inventory remaining `packages/*` (orbital, lunar-maps,
      life-support-systems, reference-app, admin-tools, provider-directory,
      international-patient-summary, timelines, + others) — record size,
      dependencies on other Atmosphere packages, and migration blockers
- [ ] Migrate smallest first to shake out the command: candidate
      **lunar-maps** (self-contained, no Atmosphere package dependencies)
- [ ] Migrate **life-support-systems** (client-only collections, clean)
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

- [ ] Create a shared Session-key constants module (e.g.
      `imports/lib/SessionKeys.js` exporting `SIMULATOR_MISSION_ID`,
      `SELECTED_PATIENT`, `HEXGRID_*`, etc.); adopt in new code, migrate old
      opportunistically
- [ ] Add workflow.json schema validation to
      `workflows/rspack.workflowParser.js` (required fields, known iconName
      check, component-mapping completeness) — fail loudly at build time
- [ ] Startup warning when a package references
      `global.Collections.{name}` that isn't registered (wrap access or audit
      at boot)
- [ ] Document the Session-key contract table in one place (currently
      scattered across package CLAUDE.md files)

**Key files**: `workflows/rspack.workflowParser.js`, new
`imports/lib/SessionKeys.js`, `server/main.js`
**Effort**: ~1 session

---

## P2 — Package registry manifest (repos, visibility, licenses)

**Problem**: Each package is its own gitignored nested repo. This session
produced doc files that existed in no repository, and a near-miss on
trade-secret placement. No single source of truth for package → remote →
visibility → license.

- [ ] Extend `workflows/workflows.json` entries (or add a root `PACKAGES.md`)
      with: `repo` (remote URL), `visibility` (private/public), `license`
- [ ] Audit current state: every dir in `packages/` and `npmPackages/` —
      does it have a repo? a remote? is the remote visibility correct for its
      content? (tracss-to-fhir = private/UNLICENSED; hexgrid, orbital,
      lunar-maps = public currently)
- [ ] Add a check script (`scripts/audit-package-repos.sh`?) that compares
      disk state to the manifest and flags drift (no remote, uncommitted
      changes, visibility mismatch)

**Key files**: `workflows/workflows.json` or new `PACKAGES.md`, new audit script
**Effort**: ~half session

---

## P3 — Fast unit-test layer for isomorphic lib/ code

**Problem**: Testing is Nightwatch-E2E-heavy (3-second subscription pauses).
The isomorphic libs (hexgrid `lib/engine/`, tracss `lib/mappers/`) are
perfectly unit-testable — pure functions, deterministic, no Meteor — but no
harness exists. (House rule: no vitest.)

- [ ] Pick the runner: plain `node --test` (zero deps, works with ESM
      `"type": "module"` packages) vs nightwatch-mocha — recommend `node --test`
      for lib/ code, Nightwatch stays for E2E
- [ ] Seed with tracss mapper tests (the v0.1 spec list: CDM fixture → valid
      Bundle, both Devices present, DetectedIssue references both,
      Pc → Observation + RiskAssessment, Provenance always included, invalid
      CDM throws useful error)
- [ ] Add hexgrid turn-engine tests (determinism: same seed → same turn
      output; consumption math; scoring bounds 0-1000)
- [ ] Wire into CI (CircleCI config already exists)

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
