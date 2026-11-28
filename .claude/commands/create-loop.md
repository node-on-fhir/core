# /create-loop

Scaffold a new loop folder from `.claude/loop-template/`.

Usage: `/create-loop <name>` (kebab-case, e.g. `provider-directory-dialog-sweep`).

## Steps

1. **Resolve paths.** The loop folder is `<repo root>/fable/<name>-loop/`, where
   repo root is the main checkout (`git rev-parse --path-format=absolute --git-common-dir`,
   minus the trailing `.git`), not a worktree. Stop if the folder already exists.
2. **Copy the template** files into it, replacing:
   - `{{LOOP_NAME}}` with the name,
   - `{{LOOP_DIR}}` with the folder's absolute path,
   - `{{PROMISE}}` with an upper-case done signal derived from the name
     (e.g. `PROVIDER DIRECTORY DIALOG SWEEP COMPLETE`).
   Do not copy the template's `README.md`.
3. **Fill in `CONTRACT.md` with the user.** Draft every section from what they
   have said and from the code, then show them the draft. Ask only about what
   would change the result: the outcome, what is off-limits, and what needs
   approval. Every requirement needs a check with a command; if you cannot find
   a command that proves a requirement, say so rather than writing a vague one.
4. **Dry-run the checks.** Run each check command once to confirm it runs and
   to see how long it takes. Fix commands that do not run. Do not record this
   as the baseline; the loop records its own on its first iteration.
5. **Confirm the workspace.** The branch must not be one the user is developing
   on. Loops that need the running app use the main checkout on their own
   branch; loops that only edit and run unit tests can use a worktree.
6. **Print the launch command** with the done signal and the iteration budget
   from the contract:

   ```
   /ralph-loop "$(cat fable/<name>-loop/PROMPT.md)" --completion-promise "<done signal>" --max-iterations <n>
   ```

Do not start the loop. The user launches it.
