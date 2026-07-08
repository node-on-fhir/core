// scripts/postinstall-dcmjs.js
// Runs during `meteor npm install`. On the dcmjs-integration branch, `dcmjs`
// resolves to the libraries/dcmjs git submodule, whose build/ output is
// gitignored and must be built after checkout — otherwise the bundle fails with
// "Can't resolve 'dcmjs'". This guard inits + builds the submodule the first
// time. It is idempotent (skips when the bundle exists) and non-fatal (a build
// failure warns but never fails the whole install).
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const bundle = path.join(root, 'libraries', 'dcmjs', 'build', 'dcmjs.js');
const gitPath = path.join(root, '.git');

if (fs.existsSync(bundle)) {
  console.log('[postinstall-dcmjs] libraries/dcmjs/build/dcmjs.js present — skipping build');
  process.exit(0);
}

if (!fs.existsSync(gitPath)) {
  // Not a git checkout (e.g. a tarball download) — we can't init a submodule.
  console.log('[postinstall-dcmjs] no .git found — skipping submodule build; run `meteor npm run dcmjs:setup` if you need DICOM parsing');
  process.exit(0);
}

console.log('[postinstall-dcmjs] building dcmjs submodule (init + pnpm build)…');
// Fixed argv, no user input — no shell, no injection surface.
const result = spawnSync('npm', ['run', 'dcmjs:setup'], { cwd: root, stdio: 'inherit' });

if (result.status !== 0) {
  console.warn('[postinstall-dcmjs] dcmjs build did not complete; run `meteor npm run dcmjs:setup` manually before starting the app');
  if (result.error) {
    console.warn('[postinstall-dcmjs]', result.error.message);
  }
  // Do not fail the install.
  process.exit(0);
}

console.log('[postinstall-dcmjs] dcmjs submodule built');
