# Slash Command: /merge-dependabot

Process the **next open Dependabot pull request**: pick it, get it green and
conflict-free against `main`, re-sync the lockfile(s), and enable auto-merge so
CircleCI gates the actual merge. Handles **one PR per invocation**, then reports.

This is an ongoing chore — invoke it repeatedly ("check the Dependabot PRs and
help merge the next one in"). Each run advances the queue by one.

## Usage

```
/merge-dependabot            # next PR (oldest open Dependabot PR)
/merge-dependabot 114        # a specific PR number
```

## Owner-approved policy (do not deviate without asking)

1. **Never merge a PR whose CI is red or still pending.** This is the hard rule.
   The mechanism depends on repo config (see "CRITICAL: how merging gates" below) —
   on this repo, `--auto` does **not** gate, so the skill must **poll CircleCI to
   green and only then merge**.
2. **Auto-handle low-risk bumps only:** patch/minor version bumps, transitive
   deps, and dev-dependencies. **PAUSE and ask the owner first** before touching:
   - any **major** version bump (e.g. `X.Y.Z → (X+1).0.0`), or
   - any **direct runtime dependency** (a key in `dependencies` of the root
     `package.json` — e.g. `lodash`, `axios`, `mongoose`, `ws`).
   When pausing, summarize the bump, the changelog highlights, and the risk, then
   wait for a yes/no.
3. **One PR per run.** Do the next one fully, report, stop. Do not batch.
4. **Stay focused on Dependabot → `main`.** Do NOT reason about or modify the
   `security-patches` overrides branch. If a PR's target already appears
   satisfied on `main`, **flag it to the owner** (suggest closing) — do not
   auto-close.

## CRITICAL: how merging gates on this repo

**`gh pr merge --auto` does NOT gate on CircleCI here. Do not use it to "wait for
CI".** Verified 2026-06-20 the hard way (PR #102 merged instantly, before CI):

- The repo has **`allow_auto_merge: false`** (`gh api repos/node-on-fhir/honeycomb
  --jq .allow_auto_merge`).
- CircleCI jobs are **not configured as required status checks** on `main`'s branch
  protection.

GitHub's `--auto` only *queues* a merge when a **required** check is pending. With
no required checks, the PR already counts as mergeable, so `--auto` (or any merge
call) executes **immediately** — `exit 0`, no output — regardless of CircleCI.

Therefore the skill **polls CI to green itself, then merges**:
1. Wait until the **combined commit status** is `success` (CircleCI lives there):
   ```bash
   gh api repos/node-on-fhir/honeycomb/commits/<headRefOid>/status \
     --jq '{state, failed:[.statuses[]|select(.state=="failure" or .state=="error")|.context]}'
   ```
   `state == "success"` with empty `failed` = all CircleCI jobs passed. **This is
   the authoritative test gate** — NOT the check-runs API.
2. **Ignore the check-runs API for the test verdict.** `commits/<sha>/check-runs`
   shows GitHub-native checks only; the `Dependabot` (github-actions) entries there
   routinely show `failure` and are **metadata, not tests** — ignore them. CodeQL
   `Analyze (...)` runs there and should pass.
3. Only once combined status is `success` → `gh pr merge N --squash`.

If the repo is later reconfigured (`allow_auto_merge: true` **and** CircleCI marked
required), `gh pr merge N --auto --squash` becomes genuinely safe and is preferred.
Re-check the two settings each run rather than assuming.

## Environment quirks (this repo — important)

- **Push/fetch over HTTPS, not SSH.** `origin` is an SSH URL but this machine has
  no SSH key (`git@github.com: Permission denied (publickey)`). Use gh's token
  credential helper for any remote git op:
  ```bash
  git -c credential.helper='!gh auth git-credential' \
      push https://github.com/node-on-fhir/honeycomb.git HEAD:<headRefName>
  git -c credential.helper='!gh auth git-credential' \
      fetch https://github.com/node-on-fhir/honeycomb.git main:refs/remotes/origin/main
  ```
  (`gh pr` commands use the HTTPS API and work fine; only raw `git push`/`fetch`
  need the helper.)
- **Mergeability reads are lazy.** `gh pr view N --json mergeable,mergeStateStatus`
  often returns `UNKNOWN` until GitHub recomputes. Don't trust one read — re-check,
  or nudge with `@dependabot rebase`.
- **CircleCI is a large suite** (dozens of parallel jobs: accounts, actors,
  base-ehr, …). That's the real gate — let auto-merge wait on it.
- **`npm install` runs a postinstall** (`copy-cesium-assets.js`) and the repo uses
  npm **workspaces**. Always finish with an `npm ls` consistency check.
- **Serial lockfile conflicts:** every Dependabot PR edits `package-lock.json`.
  Once one merges, the rest go stale and must be rebased. This is *expected* —
  it's why we go one at a time and rebase the next on each run.
- **Two lockfile scopes:** the root `package-lock.json`, and a nested one under
  `packages/immunization-registry/guides/who-immunizations`. If that nested path
  no longer exists on `main` (the `packages/` era was retired to `deprecated/`),
  the nested PR is moot → flag for closing.

## Procedure

### 0. Survey and select
```bash
gh pr list --author "app/dependabot" --state open --limit 200 \
  --json number,title,headRefName,baseRefName,mergeable,mergeStateStatus \
  --jq '.[] | "#\(.number)\t\(.mergeable)/\(.mergeStateStatus)\t\(.title)"'
```
- Pick the target PR (arg, else **lowest open number** = oldest).
- Read its diff/files: `gh pr view N --json files,additions,deletions` and
  `gh pr diff N`.

### 1. Classify + risk gate
- Determine: direct vs transitive, patch/minor/major, runtime vs dev, root vs
  nested lockfile. Direct check:
  ```bash
  git show origin/main:package.json | jq -r '.dependencies["<pkg>"] // "not-direct-runtime"'
  ```
- If **major bump** or **direct runtime dep** → STOP, summarize, ask the owner.
  Otherwise proceed.
- **Known-blocked / pinned (do NOT attempt — confirmed breaking):**
  - **rspack family** (`@rspack/*`, `@meteorjs/rspack`, `@rsdoctor/*`) is **pinned
    to 1.x**. rspack 2 requires Node ≥20.19/22.12 but Meteor 3.4's dev bundle ships
    Node 20.11, AND `@meteorjs/rspack@2.x` has an `ERR_REQUIRE_ESM` bug loading the
    now-ESM `@rspack/cli@2`. Verified blocked 2026-06-20 (PR #128). Revisit only
    after Meteor ships Node ≥20.19 and `@meteorjs/rspack` fixes ESM loading.
  - **Build-tooling / bundler bumps in general** (anything the Meteor build invokes:
    rspack, swc, babel toolchain, webpack-likes): a clean `npm install` is **not**
    sufficient proof — these resolve fine yet break at *build* time. Treat as
    major-class: escalate, and never merge without a **build smoke-test** (step 4
    requires CircleCI green, which exercises the real build — do not bypass it).

### 2. Get it mergeable
```bash
gh pr checks N
gh pr view N --json mergeable,mergeStateStatus
```
- **Green + mergeable** → go to step 4.
- **Conflicting or stale** → re-sync, cheapest first:
  1. **GitHub-native (preferred):** `gh pr comment N --body "@dependabot rebase"`.
     Wait ~30–90s, then re-check. Dependabot regenerates the lockfile itself and
     this clears most conflicts with zero local work.
  2. If still conflicting after a rebase (or Dependabot comments it can't) →
     **local resolution** (step 3).

### 3. Local conflict resolution (fallback only)
```bash
# clean tree first; stash/branch off if needed
git -c credential.helper='!gh auth git-credential' \
    fetch https://github.com/node-on-fhir/honeycomb.git main:refs/remotes/origin/main
gh pr checkout N
git merge origin/main          # expect conflict in package-lock.json (± package.json)
```
Resolve:
- **package.json** (direct-dep bumps): keep main's content + the PR's bumped
  version. On conflict, take the **higher** version.
- **package-lock.json**: don't hand-edit — regenerate.
  ```bash
  git checkout origin/main -- package-lock.json     # start from main's lock
  # then re-apply the bump:
  #   direct dep   → version is already in package.json:
  npm install
  #   transitive   → force the target from the PR title:
  npm install <pkg>@<target> --package-lock-only && npm install
  ```
- **Nested lockfile** (`.../who-immunizations`): `cd` into that dir and
  regenerate there. If the path is gone on `main`, the PR is moot → flag, skip.

**Verify before pushing:**
```bash
npm ls 2>&1 | grep -iE "missing|UNMET" | grep -vi optional   # must be empty (no missing REQUIRED deps)
git diff --stat                                                # scoped to lock/pkg only
# confirm the bumped package is at the target version in package-lock.json
```
If `npm ls` shows new missing deps, or the diff balloons unexpectedly → STOP and
escalate (this is the "abort on breaking risk" line).

**Commit + push to the PR branch:**
```bash
git commit --no-edit    # keep Dependabot's message; or a short "chore(deps): resync lockfile"
git -c credential.helper='!gh auth git-credential' \
    push https://github.com/node-on-fhir/honeycomb.git HEAD:<headRefName>
git switch -            # return off the PR branch; leave the tree clean
```

### 4. Merge — gated on CI (read "CRITICAL: how merging gates" above first)

**Pre-flight the gate** (don't assume):
```bash
gh api repos/node-on-fhir/honeycomb --jq '{autoMerge:.allow_auto_merge}'
# + check whether CircleCI jobs are required on main's branch protection
```

- **If `allow_auto_merge:true` AND CircleCI is a required check** → safe to queue:
  `gh pr merge N --auto --squash`.
- **Otherwise (current repo state)** → **poll-then-merge**. Capture the PR's
  `headRefOid`, then poll the **combined status** until `success`, then merge:
  ```bash
  SHA=$(gh pr view N --json headRefOid --jq .headRefOid)
  # poll until state==success (no failure/error/pending); abort if any failure
  gh api repos/node-on-fhir/honeycomb/commits/$SHA/status \
    --jq '{state, failed:[.statuses[]|select(.state=="failure" or .state=="error")|.context]}'
  # only when state == "success":
  gh pr merge N --squash
  ```
  If any CircleCI context is `failure`/`error` → **do not merge**; report the failed
  job(s) and stop. If the rebase pushed a new commit, re-capture `headRefOid` first
  (CI restarts on the new SHA).

> ⚠️ Never call any `gh pr merge` variant before combined status is `success` —
> on this repo it merges instantly. Polling is the gate, not `--auto`.

### 5. Report and stop
State concisely:
- PR #, package, bump (old → new), direct/transitive, patch/minor/major.
- How it was re-synced: already clean / `@dependabot rebase` / local regen.
- Auto-merge enabled (or merged), and whether CI is still running.
- Reminder: the remaining lockfile PRs are now stale; the **next** `/merge-dependabot`
  will rebase the next one.
- Any flags: already-satisfied-on-main (suggest close), nested-path-gone, or a
  bump that was escalated for owner review.

## Guardrails (summary)
- Never merge red/pending-required-check PRs (auto-merge enforces this).
- Never change `package.json` deps beyond the single Dependabot bump.
- Always `npm ls`-verify lockfile consistency before pushing a local resync.
- Escalate, don't decide: major bumps, direct runtime deps, new missing deps, or
  an unexpectedly large regenerated diff.
- Don't auto-close PRs; flag redundant/superseded ones for the owner.

## Related
- Memory: `dependabot-override-gotchas` — bundled `qs` and `hono` peer can't be
  overridden; safe-override heuristics.
- `security-patches` branch — parallel npm-overrides effort; out of scope here.
