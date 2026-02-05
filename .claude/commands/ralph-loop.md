# Ralph Loop

Start a Ralph Wiggum loop in your current session.

## Usage

```
/ralph-loop <PROMPT> [--max-iterations <n>] [--completion-promise "<text>"]
```

## Arguments

- `PROMPT`: The task description to work on (required)
- `--max-iterations <n>`: Maximum iterations before auto-stop (default: unlimited)
- `--completion-promise "<text>"`: Promise phrase that signals completion

## Description

Starts a self-referential development loop. The stop hook prevents exit and feeds the SAME PROMPT back to you until completion or iteration limit.

To signal completion, output: `<promise>YOUR_PHRASE</promise>`

Your previous work persists in files and git history. Each iteration sees modified files, creating a self-improving loop.

## Examples

```bash
# Basic loop with iteration limit
/ralph-loop Build a REST API for todos --max-iterations 20

# Loop with completion promise
/ralph-loop "Fix all failing tests" --completion-promise "ALL TESTS PASSING"

# FHIR microservice development (use the FHIR-specific version)
/ralph-fhir-loop
```

## Execution

Execute this bash command to set up the loop:

```bash
bash .claude/scripts/setup-ralph-loop.sh $ARGUMENTS
```

## Critical Rules

If a completion promise is set, you may ONLY output `<promise>PHRASE</promise>` when the statement is completely and unequivocally TRUE. Do NOT lie to exit the loop.

## Monitoring

```bash
# View current iteration
grep '^iteration:' .claude/ralph-loop.local.md

# View full state
head -10 .claude/ralph-loop.local.md
```

## Cancellation

Use `/cancel-ralph` to cancel an active loop.
