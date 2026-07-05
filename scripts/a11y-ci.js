#!/usr/bin/env node
// scripts/a11y-ci.js — documented CI entry point for the a11y gate.
// Thin wrapper: runs the jsdom/jest a11y suite in CI mode and propagates
// the exit code, so CI fails on any axe violation or a11y test failure.
const { spawnSync } = require('child_process');

const result = spawnSync(
  'npx',
  ['jest', '--config', 'jest.a11y.config.cjs', '--ci'],
  { stdio: 'inherit' }
);

process.exit(result.status === null ? 1 : result.status);
