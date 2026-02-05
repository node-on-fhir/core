# Cancel Ralph Loop

Cancels an active Ralph Wiggum loop.

## Usage

```
/cancel-ralph
```

## Procedure

1. Check if `.claude/ralph-loop.local.md` exists:

```bash
test -f .claude/ralph-loop.local.md && echo "Loop active" || echo "No active loop"
```

2. If no loop is active, inform the user that no Ralph loop is currently running.

3. If the file exists:
   - Read the current iteration number from the file's `iteration:` field
   - Delete the state file: `rm .claude/ralph-loop.local.md`
   - Inform the user that the Ralph loop has been cancelled, including which iteration it was on

## Example Output

**No active loop:**
```
No active Ralph loop found.
```

**Loop cancelled:**
```
Ralph loop cancelled at iteration 15.
```

## Note

This command only removes the state file. Any work done during the loop iterations remains in your files and git history.
