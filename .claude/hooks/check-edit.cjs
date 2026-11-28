#!/usr/bin/env node
// .claude/hooks/check-edit.cjs
//
// PostToolUse check for Edit / Write. Scans ONLY the text that was just written
// (not the whole file, so legacy code in a touched file stays quiet) for the
// project's recurring bug patterns, and hands any findings back to the agent as
// advisory context. It never blocks an edit.
//
// Checks (each is specified in prose in the sibling .md file):
//   id-lookup    post-tool-use-id-lookup.md    `_id || id` style lookups
//   async        post-tool-use-async.md        sync Mongo calls in server code
//   theme        post-tool-use-theme.md        unconditional hardcoded colors
//   phi-logging  post-tool-use-phi-logging.md  patient data in console.*

'use strict';

const path = require('path');

const JS = /\.(?:js|jsx|mjs|cjs)$/;
const TEST_FILE = /\.(?:test|tests|spec)\.[cm]?jsx?$/;
const SKIP_DIRS = /(?:^|\/)(?:node_modules|deprecated|\.meteor|graphify-out|workzone)\//;

function isComment(line) {
  const t = line.trim();
  return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*');
}

const CHECKS = [
  {
    name: 'id-lookup',
    applies: function(rel) { return JS.test(rel); },
    patterns: [
      /\.id\b\s*\|\|[^|\n]*\._id\b|\._id\b\s*\|\|[^|\n]*\.id\b/,
      /['"]_?id['"]\s*\)\s*\|\|\s*get\([^)]*['"]_?id['"]/,
      /\$or[^\n]*\b_id\b[^\n]*\bid\b|\$or[^\n]*\bid\b[^\n]*\b_id\b/
    ],
    advice: 'ID lookup with OR logic can match two different records. Look up by `_id` only; read the FHIR `id` from the found record afterwards. See .claude/rules/anti-patterns/id-lookup.md'
  },
  {
    name: 'async',
    applies: function(rel) {
      if (!/\.(?:js|mjs|cjs)$/.test(rel) || TEST_FILE.test(rel)) return false;
      if (/(?:^|\/)(?:client|ui|ui-fhir)\//.test(rel)) return false;
      return /(?:^|\/)server\/|(?:^|\/)server\.js$|^imports\/(?:api|methods)\//.test(rel);
    },
    patterns: [
      /\b(?:[A-Z]\w*|Meteor\.users|\w*[cC]ollection\w*)\.(?:findOne|insert|update|upsert|remove)\(/,
      /\.find\([^\n]*\)\.(?:count|fetch|forEach|map)\(/
    ],
    exclude: /Async\(/,
    advice: 'Synchronous Mongo call in server code. Meteor v3 needs the Async variant with await (findOneAsync, insertAsync, updateAsync, removeAsync, countAsync, fetchAsync). See .claude/rules/meteor/v3-async.md'
  },
  {
    name: 'theme',
    applies: function(rel) {
      if (!/\.jsx$/.test(rel) || TEST_FILE.test(rel) || /\.stories\./.test(rel)) return false;
      return path.basename(rel) !== 'CustomThemeProvider.jsx';
    },
    patterns: [
      /\b(?:color|backgroundColor|borderColor|bgcolor|background)\s*:\s*['"](?:#[0-9a-fA-F]{3,8}|rgba?\(|white['"]|black['"])/,
      /settings\.public\.theme\.palette/,
      /['"][^'"\n]*!important[^'"\n]*['"]/
    ],
    exclude: /isDark|palette\.mode|theme-audit: ok/,
    advice: 'Unconditional hardcoded color, direct settings color read, or !important. Prefer theme tokens (`background.paper`, `text.primary`, `divider`) or an `isDark ? dark : light` conditional. See .claude/rules/ui/theming.md'
  },
  {
    name: 'phi-logging',
    applies: function(rel) {
      return /\.jsx?$/.test(rel) && !TEST_FILE.test(rel) && !/(?:^|\/)tests\//.test(rel);
    },
    patterns: [
      /console\.(?:log|warn|error|info|debug)\([^\n]*(?:patient|parsedPatient|selectedPatient)/,
      /console\.(?:log|warn|error|info|debug)\([^\n]*(?:birthDate|familyName|givenName|\.name\[)/
    ],
    exclude: /phi-audit: ok/,
    advice: 'console.* statement that may print patient data. Use the structured Logger (`log.phi(...)`, objects in the data argument) or mark a reviewed line with `// phi-audit: ok`. See docs/LOGGING.md'
  }
];

// Returns [{ check, advice, lines: [text] }] for the given repo-relative path
// and newly written text.
function scan(rel, text) {
  if (!rel || !text || SKIP_DIRS.test(rel)) return [];
  const lines = String(text).split('\n');
  const findings = [];
  CHECKS.forEach(function(check) {
    if (!check.applies(rel)) return;
    const hits = [];
    lines.forEach(function(line) {
      if (isComment(line)) return;
      if (check.exclude && check.exclude.test(line)) return;
      if (check.patterns.some(function(p) { return p.test(line); })) hits.push(line.trim().slice(0, 160));
    });
    if (hits.length) findings.push({ check: check.name, advice: check.advice, lines: hits });
  });
  return findings;
}

function writtenText(toolName, input) {
  if (toolName === 'Write') return input.content || '';
  if (toolName === 'Edit') return input.new_string || '';
  if (toolName === 'MultiEdit' && Array.isArray(input.edits)) {
    return input.edits.map(function(e) { return e.new_string || ''; }).join('\n');
  }
  return '';
}

function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function(chunk) { raw += chunk; });
  process.stdin.on('end', function() {
    let payload;
    try { payload = JSON.parse(raw || '{}'); } catch (err) { process.exit(0); }
    const input = payload.tool_input || {};
    const file = input.file_path || '';
    if (!file) process.exit(0);
    const root = process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd();
    // A session started in the main checkout can edit files inside a worktree;
    // drop that prefix so path-based checks see the repo-relative path.
    const rel = (path.isAbsolute(file) ? path.relative(root, file) : file)
      .split(path.sep).join('/')
      .replace(/^\.claude\/worktrees\/[^/]+\//, '');
    const findings = scan(rel, writtenText(payload.tool_name, input));
    if (!findings.length) process.exit(0);

    const report = ['Project checks flagged the text just written to ' + rel + ':'];
    findings.forEach(function(f) {
      report.push('', '[' + f.check + '] ' + f.advice);
      f.lines.slice(0, 5).forEach(function(l) { report.push('    ' + l); });
      if (f.lines.length > 5) report.push('    ... and ' + (f.lines.length - 5) + ' more line(s)');
    });
    report.push('', 'These are advisory. Fix them, or say why the flagged line is correct.');
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: report.join('\n') }
    }));
    process.exit(0);
  });
}

if (require.main === module) main();
module.exports = { scan };
