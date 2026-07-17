// scripts/postinstall-dcmjs.js
// Runs during `npm install` / `meteor npm install` (postinstall). `dcmjs`
// resolves to the libraries/dcmjs git submodule, whose build/ output is
// gitignored — without it the app cannot compile (client code statically
// imports dcmjs, so rspack fails with "Can't resolve 'dcmjs'"). This guard
// inits the submodule and builds the bundle:
//   1. rollup reified from the root package-lock into
//      libraries/dcmjs/node_modules/.bin — no pnpm required (the same
//      dependency set CI builds with)
//   2. pnpm install + build, when pnpm is on PATH (parser-dev machines,
//      lockfile drift)
// Idempotent (skips when the bundle exists). A build failure FAILS the
// install: a silent skip here only resurfaces later as the opaque rspack
// error on someone else's machine.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const dcmjsDir = path.join(root, 'libraries', 'dcmjs');
const bundle = path.join(dcmjsDir, 'build', 'dcmjs.js');
const gitPath = path.join(root, '.git');

if (fs.existsSync(bundle)) {
  console.log('[postinstall-dcmjs] libraries/dcmjs/build/dcmjs.js present — skipping build');
  process.exit(0);
}

if (!fs.existsSync(gitPath)) {
  // Not a git checkout (e.g. a tarball download or deploy bundle) — we can't
  // init a submodule, and deploy contexts don't compile the client here.
  console.log('[postinstall-dcmjs] no .git found — skipping submodule build; run `meteor npm run dcmjs:setup` if you need DICOM parsing');
  process.exit(0);
}

// Fixed argv, no user input — no shell, no injection surface.
function run(cmd, args, cwd) {
  console.log('[postinstall-dcmjs] $ ' + cmd + ' ' + args.join(' '));
  const result = spawnSync(cmd, args, { cwd: cwd, stdio: 'inherit' });
  if (result.error) {
    console.warn('[postinstall-dcmjs] ' + cmd + ' failed to start: ' + result.error.message);
  }
  return result.status === 0;
}

function pnpmAvailable() {
  const probe = spawnSync('pnpm', ['--version'], { stdio: 'ignore' });
  return !probe.error && probe.status === 0;
}

function failLoudly(reason) {
  const bar = '='.repeat(74);
  console.error([
    '',
    '[postinstall-dcmjs] ' + bar,
    '[postinstall-dcmjs] FAILED: ' + reason,
    '[postinstall-dcmjs]',
    '[postinstall-dcmjs] libraries/dcmjs/build/dcmjs.js is missing. The app CANNOT compile',
    '[postinstall-dcmjs] without it — client code statically imports dcmjs, so the next',
    '[postinstall-dcmjs] `meteor run` dies with: Module not found: Can\'t resolve \'dcmjs\'.',
    '[postinstall-dcmjs]',
    '[postinstall-dcmjs] To fix, run:',
    '[postinstall-dcmjs]     meteor npm run dcmjs:setup',
    '[postinstall-dcmjs] or, equivalently:',
    '[postinstall-dcmjs]     git submodule update --init libraries/dcmjs',
    '[postinstall-dcmjs]     (cd libraries/dcmjs && npx rollup -c)',
    '[postinstall-dcmjs] ' + bar,
    ''
  ].join('\n'));
  process.exit(1);
}

if (!fs.existsSync(path.join(dcmjsDir, 'package.json'))) {
  console.log('[postinstall-dcmjs] libraries/dcmjs is empty — initializing submodule');
  if (!run('git', ['submodule', 'update', '--init', 'libraries/dcmjs'], root)) {
    failLoudly('git submodule update --init libraries/dcmjs did not complete');
  }
} else {
  console.log('[postinstall-dcmjs] submodule present — building bundle');
}

// Attempt 1: the pnpm-free path. npm install reifies the submodule's devDeps
// from the root package-lock (libraries/dcmjs/node_modules/* entries), so
// rollup's bin shim is already on disk. Invoked by absolute path — no npx, no
// PATH assumptions — so it behaves identically under npm and meteor npm.
let built = false;
const rollupBin = path.join(dcmjsDir, 'node_modules', '.bin', 'rollup');
if (fs.existsSync(rollupBin)) {
  console.log('[postinstall-dcmjs] building with lockfile-reified rollup (no pnpm required)');
  built = run(rollupBin, ['-c'], dcmjsDir);
} else {
  console.log('[postinstall-dcmjs] no reified rollup at libraries/dcmjs/node_modules/.bin/rollup');
}

// Attempt 2: pnpm, when present (parser-dev machines; also covers the case
// where the root lockfile has drifted from the submodule's devDeps).
if (!built) {
  if (pnpmAvailable()) {
    console.log('[postinstall-dcmjs] falling back to pnpm install + build');
    built = run('pnpm', ['install'], dcmjsDir) && run('pnpm', ['run', 'build'], dcmjsDir);
  } else {
    console.log('[postinstall-dcmjs] pnpm not on PATH — no fallback build available');
  }
}

// The bundle on disk is the single source of truth, not the exit codes above.
if (!built || !fs.existsSync(bundle)) {
  failLoudly('dcmjs bundle build did not produce build/dcmjs.js');
}

console.log('[postinstall-dcmjs] dcmjs bundle built: ' + path.relative(root, bundle));
