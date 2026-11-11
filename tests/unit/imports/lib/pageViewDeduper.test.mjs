import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createPageViewDeduper } = require('../../../../imports/lib/pageViewDeduper.js');

test('first path tracks; immediate repeat (StrictMode double-fire) is suppressed', function() {
  const d = createPageViewDeduper();
  assert.equal(d.shouldTrack('/homepage'), true);
  assert.equal(d.shouldTrack('/homepage'), false);
});

test('route change tracks; returning to a prior path tracks again', function() {
  const d = createPageViewDeduper();
  d.shouldTrack('/homepage');
  assert.equal(d.shouldTrack('/mars-to-table'), true);
  assert.equal(d.shouldTrack('/homepage'), true);
});

test('reset allows re-tracking the current path (post-consent replay)', function() {
  const d = createPageViewDeduper();
  d.shouldTrack('/homepage');
  d.reset();
  assert.equal(d.shouldTrack('/homepage'), true);
});

test('garbage input never tracks', function() {
  const d = createPageViewDeduper();
  assert.equal(d.shouldTrack(''), false);
  assert.equal(d.shouldTrack(null), false);
});
