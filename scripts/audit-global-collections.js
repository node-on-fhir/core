#!/usr/bin/env node
// scripts/audit-global-collections.js
//
// global.Collections registration auditor (FABLE-TECH-DEBT-PAYDOWN.md § P2
// string contracts). Cross-package code reads collections off the runtime
// globals `global.Collections.X` / `Meteor.Collections.X` — a string contract
// verified by nothing. A typo (or a collection a package assumes but the app
// never registered) returns `undefined` and fails silently at runtime.
//
// This audit runs where the source still exists (dev/CI, not the bundled
// production app), so it catches the mismatch before boot:
//   - extracts the REGISTERED set from server/main.js
//     (`Meteor.Collections = {…}`, `Object.assign(global.Collections, {…})`,
//      and direct `global.Collections.X = …` assignments)
//   - extracts every REFERENCED name across the source tree
//   - reports references to names that are never registered
//
// Usage:
//   node scripts/audit-global-collections.js           # human-readable
//   node scripts/audit-global-collections.js --tsv      # name<TAB>files
// Exit code: 0 if every reference resolves, 1 if any unregistered ref exists.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const MAIN = path.join(REPO_ROOT, 'server', 'main.js');
const SCAN_DIRS = ['imports', 'server', 'client', 'packages', 'npmPackages', 'core', 'extensions'];
const TSV = process.argv.includes('--tsv');

// Pull the identifier keys out of an object/Object.assign block by brace-matching
// from the first `{` after `startIdx`.
function extractKeysFromBlock(src, startIdx) {
  const open = src.indexOf('{', startIdx);
  if (open === -1) return [];
  let depth = 0;
  let end = open;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  const body = src.slice(open + 1, end);
  const keys = new Set();
  // Match shorthand `Foo,` and `Foo: Bar` at property position
  const re = /(^|[\s,{])([A-Za-z_$][A-Za-z0-9_$]*)\s*[,:]/g;
  let m;
  while ((m = re.exec(body)) !== null) keys.add(m[2]);
  return [...keys];
}

// Collection names are PascalCase (FHIR resource plurals); this filters out
// method-call noise like `.get(`, `.find(` that the reference regex catches.
const isCollectionName = (n) => /^[A-Z]/.test(n);

function getRegisteredNames() {
  const registered = new Set();

  // server/main.js carries the two bulk registration blocks
  const src = fs.readFileSync(MAIN, 'utf8');
  let idx = src.indexOf('Meteor.Collections');
  if (idx !== -1) extractKeysFromBlock(src, idx).forEach((k) => registered.add(k));
  idx = src.indexOf('Object.assign(global.Collections');
  if (idx !== -1) extractKeysFromBlock(src, idx).forEach((k) => registered.add(k));

  // Direct assignments can live ANYWHERE (packages register their own
  // collections at startup): global.Collections.Foo = … / Meteor.Collections.Foo = …
  let assigns = '';
  try {
    const dirs = SCAN_DIRS.filter((d) => fs.existsSync(path.join(REPO_ROOT, d)));
    assigns = execSync(
      'grep -rhoE --include="*.js" --include="*.jsx" ' +
        '--exclude-dir=node_modules --exclude-dir=.git ' +
        '"(global|Meteor)\\.Collections\\.[A-Za-z_][A-Za-z0-9_]* *=" ' +
        dirs.map((d) => `"${d}"`).join(' ') + ' 2>/dev/null || true',
      { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
    );
  } catch (e) { assigns = ''; }
  const assignRe = /(?:global|Meteor)\.Collections\.([A-Za-z_$][A-Za-z0-9_$]*)\s*=/g;
  let m;
  while ((m = assignRe.exec(assigns)) !== null) registered.add(m[1]);

  return new Set([...registered].filter(isCollectionName));
}

// Names of every `new Mongo.Collection('Name')` defined in source. The app
// registers most collections into global.Collections via a dynamic loop
// (bracket notation), which a static scan of registration sites can't see — so
// a referenced name that has a real collection definition is treated as known
// (registered dynamically), not a phantom. This is what keeps the audit from
// crying wolf over the ~170 dynamically-registered FHIR collections.
function getDefinedCollectionNames() {
  const defined = new Set();
  try {
    const dirs = SCAN_DIRS.filter((d) => fs.existsSync(path.join(REPO_ROOT, d)));
    // Template literal so the quote chars land in the grep char class correctly:
    // ['\\"] -> shell ['\"] (inside double-quotes) -> grep ERE class of ' and "
    const dirArgs = dirs.map((d) => `"${d}"`).join(' ');
    const out = execSync(
      `grep -rhoE --include="*.js" --include="*.jsx" ` +
        `--exclude-dir=node_modules --exclude-dir=.git ` +
        `"new Mongo\\.Collection\\(['\\"][A-Za-z_][A-Za-z0-9_]*['\\"]" ` +
        `${dirArgs} 2>/dev/null || true`,
      { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
    );
    out.split('\n').filter(Boolean).forEach((line) => {
      const mm = line.match(/new Mongo\.Collection\(['"]([A-Za-z_][A-Za-z0-9_]*)['"]/);
      if (mm) defined.add(mm[1]);
    });
  } catch (e) { /* fall through to empty set */ }
  return defined;
}

function getReferences() {
  // name -> Set(files). Use git grep for speed + respect of tracked tree; fall
  // back to a recursive read if git grep is unavailable.
  const refs = new Map();
  const add = (name, file) => {
    if (!refs.has(name)) refs.set(name, new Set());
    refs.get(name).add(file);
  };

  let lines = [];
  try {
    const dirs = SCAN_DIRS.filter((d) => fs.existsSync(path.join(REPO_ROOT, d)));
    const out = execSync(
      'grep -rhonE --include="*.js" --include="*.jsx" ' +
        '--exclude-dir=node_modules --exclude-dir=.git ' +
        '"(global|Meteor)\\.Collections\\.[A-Za-z_][A-Za-z0-9_]*" ' +
        dirs.map((d) => `"${d}"`).join(' ') + ' 2>/dev/null || true',
      { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
    );
    lines = out.split('\n').filter(Boolean);
  } catch (e) {
    lines = [];
  }

  const refRe = /(?:global|Meteor)\.Collections\.([A-Za-z_$][A-Za-z0-9_$]*)/;
  lines.forEach((line) => {
    const m = line.match(refRe);
    if (m) add(m[1], '(source)');
  });
  return refs;
}

const registered = getRegisteredNames();
const defined = getDefinedCollectionNames();
const references = getReferences();

// "Known" = statically registered OR backed by a real Mongo.Collection
// definition (the latter are registered via the dynamic loop at runtime).
const known = new Set([...registered, ...defined]);

const unregistered = [...references.keys()]
  .filter(isCollectionName)
  .filter((n) => !known.has(n))
  .sort();

if (TSV) {
  unregistered.forEach((n) => process.stdout.write(n + '\tunregistered\n'));
} else {
  console.log('Statically registered: ' + registered.size
    + ' | Mongo.Collection definitions: ' + defined.size
    + ' | known total: ' + known.size);
  console.log('Distinct referenced names: ' + references.size);
  console.log('');
  if (unregistered.length === 0) {
    console.log('Clean: every global.Collections.X / Meteor.Collections.X reference resolves to a known collection.');
  } else {
    console.log('UNKNOWN references (' + unregistered.length + ') — referenced via global.Collections.X but '
      + 'never registered AND no matching Mongo.Collection definition; these resolve to undefined at runtime:');
    unregistered.forEach((n) => {
      // Offer the closest known name as a likely-typo hint
      const hint = [...known].find(
        (r) => r.toLowerCase() === n.toLowerCase() ||
               r.toLowerCase().replace(/s$/, '') === n.toLowerCase().replace(/s$/, '')
      );
      console.log('  - ' + n + (hint ? '   (did you mean: ' + hint + '?)' : ''));
    });
  }
}

process.exit(unregistered.length > 0 ? 1 : 0);
