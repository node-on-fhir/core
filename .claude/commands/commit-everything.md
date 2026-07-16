# /commit-everything

Commit everything and push to GitHub — the whole workspace, not just the monorepo.
Trigger phrases: "commit everything and push to github", `/commit-everything`.

This workspace is a monorepo (`node-on-fhir/core`) plus nested git repos under
`extensions/*/` (each gitignored by the monorepo and pushed to its own GitHub
remote). "Everything" means all of them.

## Recipe

### 1. Survey

- Main monorepo: `git status --short`, current branch, and unpushed commits
  (`git log --oneline @{u}..HEAD`). `npmPackages/*` are tracked in the monorepo
  and ride along automatically — do NOT treat them as separate repos.
- Nested repos: iterate every `extensions/*/` that contains a `.git`; collect
  dirty files and unpushed-commit counts. Skip clean repos with nothing unpushed.

```bash
for d in extensions/*/; do
  if [ -e "$d/.git" ]; then
    (cd "$d" && s=$(git status --short) && a=$(git log --oneline @{u}..HEAD 2>/dev/null | wc -l) \
      && { [ -n "$s" ] || [ "$a" -gt 0 ]; } && echo "=== $d ===" && echo "$s")
  fi
done
```

### 2. Summarize and get approval — ALWAYS

Present a per-repo summary: repo, remote, branch, files changed, and a one-line
description of what each change is (read the diffs — describe the *feature*,
not the filenames). **Wait for explicit approval before committing, even in
auto-accept / autonomous mode.** This gate is non-negotiable.

### 3. Commit and push (after approval)

For each dirty repo:

- Group changes into logical conventional commits (`feat(scope):`, `fix(scope):`,
  `docs(scope):` …) rather than one blob commit when the changes are unrelated.
- Main monorepo: commit on the current branch and push it. If sitting on `main`,
  create a branch first — never commit directly to the monorepo's `main`.
- Extensions: commit and push to each repo's own remote (usually `main` directly —
  they don't use PR flow). Remotes are **https** (SSH pushes fail on this machine).

Guardrails:

- Never commit `.DS_Store`, secrets, API keys, or credentials. Settings files
  with real credentials must stay gitignored (public GA measurement IDs are fine).
- Respect each repo's `.gitignore`; some settings files are intentionally
  force-tracked (`git ls-files` is the truth, not the ignore patterns).
- Report push results faithfully; if a push is rejected, say so — don't force-push.

### 4. PR handling

- If the monorepo branch has an **open PR** (`gh pr list --head <branch>`):
  refresh its description with an up-to-date summary of the branch
  (`git log main..HEAD` themes, not a raw commit list) via `gh pr edit`.
- If there is **no PR**: just push. Only *create* a PR when explicitly asked
  ("stage a pull request", "open a PR") — then use `gh pr create` with a
  drafted summary.

### 5. Verify

- `git status` clean and `@{u}..HEAD` empty in every touched repo.
- If a PR was updated/created, `gh pr view` shows the new head commit and body.
- Report a final table: repo → commit(s) → pushed-to → PR link (if any).
