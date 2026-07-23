// workflows/rspack.workflowParser.test.mjs
//
// Smoke-level unit tests for the workflow parser (july-fix-now #4: "674
// load-bearing lines; zero tests"). Bare-checkout safe: no npm install, no
// Meteor — the parser is plain Node CJS and every fixture package here is
// deliberately NOT installed, exercising the skip-uninstalled path and the
// barrel/loader EMITTERS (whose generated output must be valid ESM; a
// template regression in the generated loader is a boot-killer).
//
//   npm run test:workflow-parser
//
// Known behavior documented, not asserted: generate() runs twice per build
// (client + server rspack processes each invoke it) — idempotency IS asserted.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WorkflowParserPlugin = require('./rspack.workflowParser.js');

function sandbox(t, manifest) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wfparser-test-'));
  t.after(function() { fs.rmSync(dir, { recursive: true, force: true }); });
  const manifestPath = path.join(dir, 'workflows.json');
  if (manifest !== undefined) {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }
  const outputDir = path.join(dir, 'out');
  return { dir, manifestPath, outputDir };
}

// Generated barrels are ESM (.js). node --check parses .js as CJS, so copy to
// .mjs for a syntax check that understands import/export.
function assertValidEsm(t, filePath) {
  const tmp = filePath + '.check.mjs';
  fs.copyFileSync(filePath, tmp);
  t.after(function() { fs.rmSync(tmp, { force: true }); });
  execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
}

test('empty manifest: generate() emits valid ESM barrels', function(t) {
  const { manifestPath, outputDir } = sandbox(t, { workflows: [] });
  const plugin = new WorkflowParserPlugin({ manifestPath, outputDir });
  plugin.generate();

  for (const f of ['index.js', 'loader.js', 'server-loader.js']) {
    const p = path.join(outputDir, f);
    assert.ok(fs.existsSync(p), f + ' generated');
    assertValidEsm(t, p);
  }
  const loader = fs.readFileSync(path.join(outputDir, 'loader.js'), 'utf8');
  assert.match(loader, /registerWorkflows/, 'loader exports registerWorkflows');
  const serverLoader = fs.readFileSync(path.join(outputDir, 'server-loader.js'), 'utf8');
  assert.match(serverLoader, /initializeWorkflowHooks/, 'server-loader exports initializeWorkflowHooks');
});

test('missing manifest file: generate() still emits valid empty barrels', function(t) {
  const { manifestPath, outputDir } = sandbox(t, undefined); // no file written
  const plugin = new WorkflowParserPlugin({ manifestPath, outputDir });
  plugin.generate();
  assert.ok(fs.existsSync(path.join(outputDir, 'index.js')));
  assertValidEsm(t, path.join(outputDir, 'index.js'));
});

test('uninstalled manifest package is skipped, barrels stay valid', function(t) {
  const { manifestPath, outputDir } = sandbox(t, {
    workflows: [{ package: '@wfparser-test/not-installed', enabled: true }]
  });
  const plugin = new WorkflowParserPlugin({ manifestPath, outputDir });
  plugin.generate(); // must not throw
  const loader = fs.readFileSync(path.join(outputDir, 'loader.js'), 'utf8');
  assert.doesNotMatch(loader, /not-installed/, 'uninstalled package absent from loader');
  assertValidEsm(t, path.join(outputDir, 'loader.js'));
});

test('EXTRA_WORKFLOWS with an uninstalled package is skipped without throwing', function(t) {
  const prev = process.env.EXTRA_WORKFLOWS;
  process.env.EXTRA_WORKFLOWS = '@wfparser-test/also-not-installed';
  t.after(function() {
    if (prev === undefined) { delete process.env.EXTRA_WORKFLOWS; }
    else { process.env.EXTRA_WORKFLOWS = prev; }
  });
  const { manifestPath, outputDir } = sandbox(t, { workflows: [] });
  const plugin = new WorkflowParserPlugin({ manifestPath, outputDir });
  plugin.generate();
  const loader = fs.readFileSync(path.join(outputDir, 'loader.js'), 'utf8');
  assert.doesNotMatch(loader, /also-not-installed/);
});

test('generate() is idempotent (runs twice per build: client + server rspack)', function(t) {
  const { manifestPath, outputDir } = sandbox(t, { workflows: [] });
  const plugin = new WorkflowParserPlugin({ manifestPath, outputDir });
  plugin.generate();
  const first = fs.readFileSync(path.join(outputDir, 'loader.js'), 'utf8');
  plugin.generate();
  const second = fs.readFileSync(path.join(outputDir, 'loader.js'), 'utf8');
  assert.equal(first, second, 'double generate produces identical output');
});
