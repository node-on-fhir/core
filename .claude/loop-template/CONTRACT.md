# Contract: {{LOOP_NAME}}

Written by a human at the keyboard. The loop reads this every iteration and
must not edit it. If the contract is wrong or incomplete, the loop stops and
says so in the receipt.

## Outcome

<!-- One or two sentences: what exists when this is finished. -->

## Inputs

<!-- Things prepared beforehand that the loop works from: design handoffs,
     screenshots, specs, reference files, tickets. Give paths. "None" is fine. -->

## Scope: what may change

<!-- Directories and files the loop may create or edit. Be specific. -->

## Off-limits

<!-- What must not change, even if it looks related. -->

- This contract.
- Anything outside the scope above.

## Checks

Each check is a command with an expected result. Cheapest first. A check the
loop cannot run is reported as unresolved, never assumed to pass.

| # | Requirement | Command | Passes when |
|---|-------------|---------|-------------|
| 1 |             |         |             |

## Budget

- Iterations: <!-- e.g. 20 -->
- Attempts per item before marking it blocked: 3
- Stop if the same failure appears twice with no new information.
- Largest deletion allowed without asking: <!-- e.g. "only files listed in scope" -->

## Needs approval

The loop prepares these and stops; it never does them itself.

- Pushing, opening or merging pull requests, deploying.
- Deleting anything not named in scope.
- <!-- add: schema changes, settings files, dependency upgrades, ... -->

## Workspace

- Branch: <!-- the loop's own branch; never the branch you are developing on -->
- Checkout: <!-- main checkout, or a worktree path for loops that do not need the running app -->
- Commits: one per kept change, staging specific paths only.

## Done signal

`{{PROMISE}}`
