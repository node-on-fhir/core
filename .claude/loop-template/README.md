# Loop template

A loop is a folder with five files. The human writes the contract, the prompt
is generated, and the loop maintains the remaining three.

| File | Who writes it | What it is |
|------|---------------|------------|
| `CONTRACT.md` | human | the job, its limits, and how completion is proven |
| `PROMPT.md` | generated | the instructions repeated every iteration |
| `PROGRESS.md` | loop | baseline, item list, iteration log |
| `DEAD-ENDS.md` | loop | approaches that failed, so they are not retried |
| `RECEIPT.md` | loop | short end-of-run report |

Create one with `/create-loop <name>`. Loop folders live in `fable/<name>-loop/`,
which is not tracked by this repository.

Run one with:

```
/ralph-loop "$(cat fable/<name>-loop/PROMPT.md)" --completion-promise "<done signal>" --max-iterations <budget>
```

`/cancel-ralph` stops it. Read `RECEIPT.md` to see where it got to.
