# Fable Analysis: The Honeycomb / NodeOnFHIR Stack

> A candid framework assessment written by Fable 5 (Claude) on 2026-06-10, after a
> working session in the stack: scanned `packages/orbital`, `packages/lunar-maps`,
> `packages/life-support-systems`, and `npmPackages/hexgrid`; resolved the
> theming doctrine conflict between `packages/CLAUDE.md` and the root rules;
> and designed + shipped `@node-on-fhir/tracss-to-fhir` (TRaCSS space-traffic
> data → FHIR R4) end-to-end in one evening.
>
> Companion backlog: [FABLE-TECH-DEBT-PAYDOWN.md](FABLE-TECH-DEBT-PAYDOWN.md)

**Stack under assessment**: Meteor v3 + React 18 + Material-UI v5 + MongoDB +
FHIR R4, with a dual package system (Atmosphere `packages/` + NPM workspace
`npmPackages/` loaded via Rspack/WorkflowRegistry) and docs-as-code guidance
in `.claude/`.

---

## What Works

### 1. FHIR-as-universal-ontology is the genuinely novel bet — and it pays

On paper, "healthcare interoperability standard for space operations" sounds
like a stretch. In practice, the TRaCSS package almost wrote itself:
spacecraft were already `Device` (orbital's CrewedVehicles convention),
missions were already `EpisodeOfCare`, alerts were already `Communication`
(the SWPC space-weather pattern). Mapping a federal space-traffic feed
required adding exactly **one** new resource type (`DetectedIssue`) to the
entire application.

And the inheritance runs deeper than vocabulary: provenance, audit trails,
consent, and identity are *pre-solved* because healthcare had to solve them
under regulatory pressure. Anyone else building a space-ops data layer has to
invent that. This stack inherits it. That is a real moat.

### 2. The plugin architecture actually plugs

A full vertical slice — UI page, routes, sidebar item, footer buttons,
collections, server methods, publications, cron — shipped without modifying
application code beyond one manifest entry in `workflows/workflows.json`.
Most systems that claim "plugin architecture" cannot do that. The
`workflow.json` → `client.js` → `WorkflowRegistry` contract
(`imports/lib/WorkflowRegistry.js`, `workflows/rspack.workflowParser.js`) is
simple enough that there was never a need to guess.

### 3. Docs-as-code discipline pays for itself

The `.claude/rules/`, hooks, and per-package CLAUDE.md files meant the
`_id||id` collision bug, the Session-key contracts, and the footer button
naming convention were known *before writing a line of code*. Most codebases
this size make you learn their bugs by reproducing them. Here, the #1 bug
class is documented, has a detection hook, and an audit command.

### 4. Permissive-in / strict-out suits FHIR better than rigid typing would

FHIR's optionality is extreme — nearly everything is 0..1 or 0..\*, references
come in at least three formats. TypeScript interfaces for FHIR tend to become
lies. The house pattern (lodash `get()` circuit breakers on input, validation
only on data cursors and outbound elements) is the pragmatic call, and it made
the TRaCSS mappers both robust and short.

### 5. The isomorphic `lib/` pattern is quietly excellent

Pure-JS, Meteor-free business logic (hexgrid's `lib/engine/`, tracss's
`lib/mappers/`) that runs identically in the bundled app, in a plain-node CLI,
and (in hexgrid's case) deterministically enough to replay. This is the
cleanest separation in the codebase and deserves to be the template for all
future packages.

---

## Rough Edges

### 1. The theming system is the roughest edge

The "Golden Rule" (`Meteor.useTheme()` + `isDark` with explicit colors,
codified 2026-06-10) is a **workaround promoted to doctrine**. The root cause
is structural: a custom theme provider layered over MUI's, plus settings files
injecting values like `"#ffffff !important"` into the MUI palette
(`imports/ui/App.jsx` `CustomThemeProvider`, ~line 1425). Every component pays
an `isDark` boilerplate tax forever. Fixing the root cause — sanitize settings
values at ingestion, make `CustomThemeProvider` the single palette authority —
would eliminate an entire bug class and let MUI tokens just work.

### 2. The migration half-state is the biggest ongoing cost

Two package systems, two theming regimes, two doc sets, two registration
mechanisms. The contradictory theming guidance discovered (and resolved) this
session was a symptom, not the disease. Every new contributor — human or AI —
must first learn which side of the fence they are standing on. Finishing the
Atmosphere→NPM migration matters more than any single feature.

### 3. Invisible string contracts are load-bearing

`global.Collections.X`, `Session.get('simulatorMissionId')`,
`iconName: "SatelliteAlt"` — cross-package integration rides on string
contracts checked by nothing. It works because the documentation is
disciplined, but a typo in a Session key fails silently. The system scales
with doc rigor, not tooling. A consciously made trade — but it should at
least be a *visible* one.

### 4. Nested git repos caused two real incidents in one session

`packages/` and `npmPackages/` are gitignored from the main repo; each package
is its own repository. Flexible — but this session produced (a) doc files that
existed on disk yet in *no* repository, and (b) a near-miss on where
trade-secret code would land. There is no manifest of which package belongs to
which remote at which visibility.

### 5. The `_id`/`id` dual identity is structural

The #1 documented bug class (OR-logic ID collisions) exists because records
carry both a MongoDB `_id` and a FHIR `id` after flattening. The rule + hook +
audit command are good mitigation; the cure — a flattening design that
preserves a single lookup identity — has not been explored.

### 6. Meteor is the strategic question mark

Small talent pool, ecosystem momentum elsewhere. The hedges are correct —
Meteor v3 is fiber-free/async, Atmosphere is being routed around via
NPM + Rspack, and DDP reactivity remains genuinely hard to replicate — but a
half-finished hedge is exposure, not protection (see #2).

---

## Net Verdict

This is an **opinionated, coherent** stack — and coherence is worth more than
fashion. The weaknesses are mostly transitional (the migration half-state) or
fixable at the root (theming), not fundamental. The FHIR-everywhere thesis is
the part to bet on: it looked eccentric right up until the moment a federal
space-traffic feed mapped onto it in a single evening.

Priorities, if asked: **(1)** finish the migration, **(2)** fix theming at the
root, **(3)** make the string contracts checkable. Everything else is normal
engineering.
