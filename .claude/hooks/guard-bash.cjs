#!/usr/bin/env node
// .claude/hooks/guard-bash.cjs
//
// PreToolUse guard for the Bash tool. Enforces the handful of rules that must
// not depend on the agent remembering them. Reads the hook payload on stdin and
// prints a permission decision; prints nothing when the command is fine.
//
//   deny — never run, whoever asks:
//     - killing processes by pattern or by port (shared dev machine: the match
//       can be someone else's dev server)
//     - blanket staging (`git add -A` / `--all` / `.`), which sweeps up files
//       belonging to other concurrent work
//   ask  — always confirm with the human first:
//     - deploying (`meteor deploy`)
//     - force-pushing
//
// The permission rules in .claude/settings.json cover the simple spellings;
// this script also catches the same commands behind env-var prefixes, `sudo`,
// `xargs`, or in the middle of a compound command.

'use strict';

// A command "position": start of line, or after ; & | ( { or `xargs`, then any
// leading VAR=value assignments and an optional sudo.
const AT = String.raw`(?:^|[;&|({]|\bxargs\s+(?:-\S+\s+)*)\s*(?:\w+=\S*\s+)*(?:sudo\s+)?`;
const GIT = String.raw`git\s+(?:-[cC]\s+\S+\s+)*`;
// Zero or more arguments of the same simple command (never crosses ; & | or a newline).
const ARGS = String.raw`(?:[ \t]+[^\s;&|]+)*?`;

const RULES = [
  {
    decision: 'deny',
    test: new RegExp(AT + String.raw`(?:pkill|killall)\b`, 'm'),
    reason: 'Killing processes by name or pattern is not allowed on this machine: the match can be another session\'s dev server. Kill only an exact PID that this session started (`kill <pid>`).'
  },
  {
    decision: 'deny',
    test: /\b(?:lsof|pgrep|fuser)\b[^\n]*\|\s*(?:xargs\s+(?:-\S+\s+)*)?(?:sudo\s+)?kill\b|\bkill\b[^\n]*(?:\$\(|`)\s*(?:lsof|pgrep)\b/m,
    reason: 'Killing whatever holds a port or matches a name is not allowed on this machine. Identify the exact PID, confirm it belongs to this session, then `kill <pid>`.'
  },
  {
    decision: 'deny',
    test: new RegExp(AT + GIT + 'add' + ARGS + String.raw`[ \t]+(?:-A|-u|--all|--update|\.)(?=\s|$|[;&|)])`, 'm'),
    reason: 'Blanket staging is not allowed: it sweeps up files from other concurrent work. Stage the specific paths you changed (`git add path/one path/two`).'
  },
  {
    // Only flags that appear before the message, so message text is never scanned.
    decision: 'deny',
    test: new RegExp(AT + GIT + 'commit' + String.raw`(?:[ \t]+(?!-m\b|-F\b|--message\b|--file\b)--?[\w-]+)*?[ \t]+-(?!-)\w*a\w*(?=\s|$)`, 'm'),
    reason: '`git commit -a` stages every modified tracked file, including other concurrent work. Stage specific paths, then commit.'
  },
  {
    decision: 'ask',
    test: new RegExp(AT + String.raw`meteor\s+deploy\b` + '|' + String.raw`\bdeploy-to-galaxy\.sh\b`, 'm'),
    reason: 'Deploying needs explicit approval in the current exchange.'
  },
  {
    decision: 'ask',
    test: new RegExp(AT + GIT + String.raw`push\b[^\n;&|]*(?:\s--force(?:-with-lease|-if-includes)?\b|\s-\w*f\w*\b|\s\+\S)`, 'm'),
    reason: 'Force-pushing rewrites remote history and needs explicit approval.'
  }
];

function evaluate(command) {
  for (const rule of RULES) {
    if (rule.test.test(command)) return { decision: rule.decision, reason: rule.reason };
  }
  return null;
}

function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function(chunk) { raw += chunk; });
  process.stdin.on('end', function() {
    let command = '';
    try {
      const payload = JSON.parse(raw || '{}');
      command = (payload.tool_input && payload.tool_input.command) || '';
    } catch (err) {
      // Unreadable payload: stay out of the way rather than block all Bash.
      process.exit(0);
    }
    const verdict = evaluate(String(command));
    if (verdict) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: verdict.decision,
          permissionDecisionReason: verdict.reason
        }
      }));
    }
    process.exit(0);
  });
}

if (require.main === module) main();
module.exports = { evaluate };
