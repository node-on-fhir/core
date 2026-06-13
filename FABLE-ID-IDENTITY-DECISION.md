# Decision: `_id` / `id` Dual Identity — Structural Fix vs Permanent Mitigation

> Investigation for [FABLE-TECH-DEBT-PAYDOWN.md](FABLE-TECH-DEBT-PAYDOWN.md) § P3
> "`_id`/`id` structural investigation", written 2026-06-12 on branch
> `fable-tech-debt-paydown`. Companion to
> [`.claude/rules/anti-patterns/id-lookup.md`](.claude/rules/anti-patterns/id-lookup.md).

## The problem (recap)

After flattening, every record carries BOTH a MongoDB `_id` (primary key) and a
FHIR `id` (resource identifier). OR-logic lookups
(`p => p.id === x || p._id === x`) can then match the wrong record when one
record's `id` equals another's `_id` — the #1 documented bug class. Today this
is mitigated by a rule, a `post-tool-use-id-lookup` hook, and `/audit-id-lookups`,
but the underlying dual identity is never removed.

## Findings from the survey

1. **Root is uniform and mechanical.** All **82** `flattenX()` functions in
   `imports/lib/FhirDehydrator.js` set both `result._id = get(rec, '_id')` and
   `result.id = get(rec, 'id')`. One pattern, one file — the emission point is
   centralized.

2. **Flatten output is UI-only — it never hits the FHIR wire.** `FhirDehydrator`
   is exposed as `global.FhirDehydrator` (server/main.js:315) and consumed by
   tables/detail pages. The FHIR REST layer (`server/fhir/`, `FhirEndpoints.js`,
   `RestHelpers.js`) does **not** call any `flattenX` — it serializes raw
   resources. **Therefore renaming the flattened `id` field does NOT break FHIR
   `id` wire compliance.** This is the decisive fact: the structural fix is
   *possible* without violating the spec.

3. **Blast radius is wide but bounded and mostly mechanical.**
   - **83** files import `FhirDehydrator`.
   - **~40** OR-logic `id`/`_id` sites in real code (the latent-bug sites).
   - **8** DataGrid `getRowId`/`row.id` sites (these mostly already prefer `_id`).
   The consumers are overwhelmingly display (`row.codeDisplay`) and navigation
   (`navigate('/x/' + row.id)`) — not logic that depends on `id` being the FHIR
   id specifically.

4. **Failure-mode trade is favorable.** Today a missed/again-introduced OR-logic
   site fails *silently with the wrong record* (the Kylee-Leannon bug). After a
   rename, a consumer still reading a now-absent `.id` gets `undefined` — a
   *loud, visible* break (blank cell / bad nav URL) caught immediately in
   testing, never a wrong-patient render.

## Options

### A — Big-bang structural fix
`flattenX` emits `_id` (canonical lookup) + `fhirId` (renamed from `id`); drop
bare `id`. Migrate all ~83 consumers at once.
- **Pro:** eliminates the collision class at the source, immediately.
- **Con:** one large risky changeset; any missed consumer breaks (loudly) at
  once; hard to review/bisect.

### B — Permanent mitigation (status quo)
Keep rule + hook + `/audit-id-lookups`.
- **Pro:** zero blast radius.
- **Con:** the dual identity — and thus the bug class — persists forever; every
  new lookup is a potential reintroduction the hook must keep catching.

### C — Additive canonical key + opportunistic migration  ✅ RECOMMENDED
1. `flattenX` **additively** also emits `fhirId` (= the FHIR `id`) while keeping
   `id` for now — non-breaking, all existing consumers keep working.
2. Add a tiny helper `flattenedLookupId(record)` (always returns `_id`) and
   adopt it in new lookup code; new display/nav code uses `fhirId`.
3. Migrate existing bare-`.id` consumers off → `fhirId` **opportunistically**
   when touching a file (exactly the playbook used to retire the theming
   `isDark` boilerplate after the root fix).
4. Once consumers have drained (audit shows no bare flattened-`.id` reads),
   drop `id` from flattened output — completing Option A safely, incrementally.

- **Pro:** wire-safe (finding #2); zero day-one risk; drains the bug class
  steadily; each step independently reviewable; mirrors a playbook this codebase
  has already executed successfully.
- **Con:** transitional period where `id` and `fhirId` coexist in flattened
  output (slightly redundant) until the drain completes.

## Recommendation

**Adopt Option C.** The survey shows the structural fix is genuinely available
(flatten output is UI-only, so FHIR wire compliance is untouched), but a
big-bang across 83 files is needless risk when the codebase already has a proven
additive-then-opportunistic migration pattern. Sequence:

1. Add `fhirId` to the flatten emit + a `flattenedLookupId()` helper
   (`imports/lib/FhirDehydrator.js`); update `id-lookup.md` to point new code at
   `_id` lookup + `fhirId` display. *(small, safe, do first)*
2. Extend `/audit-id-lookups` to also flag bare flattened `.id` reads, so the
   drain is measurable.
3. Retire bare `.id` consumers opportunistically; when the audit reaches zero,
   drop `id` from flattened output (final structural state).

Until step 1 ships, **mitigation stays in force** — the rule + hook + audit
remain the guardrail and must not be removed.

## Not doing now

This document is the decision; implementation is a follow-up (the backlog item
asked for the investigation + decision, not the code change). The change is
sequenced above and should be its own PR series so each step is reviewable.
