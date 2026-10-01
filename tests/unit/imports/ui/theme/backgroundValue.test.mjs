// tests/unit/imports/ui/theme/backgroundValue.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COLOR_BACKGROUND_PREFIX, isColorBackground, colorFromBackground, makeColorBackground
} from '../../../../../imports/ui/theme/backgroundValue.js';

test('prefix constant is stable (persisted strings depend on it)', function() {
  assert.equal(COLOR_BACKGROUND_PREFIX, 'color:');
});

test('isColorBackground distinguishes color entries from image paths', function() {
  assert.equal(isColorBackground('color:#a67b5b'), true);
  assert.equal(isColorBackground('/backgrounds/ambiance/Zen.jpg'), false);
  assert.equal(isColorBackground(''), false);
  assert.equal(isColorBackground(null), false);
  assert.equal(isColorBackground(undefined), false);
});

test('colorFromBackground extracts the hex, null otherwise', function() {
  assert.equal(colorFromBackground('color:#a67b5b'), '#a67b5b');
  assert.equal(colorFromBackground('/backgrounds/ambiance/Zen.jpg'), null);
  assert.equal(colorFromBackground(null), null);
});

test('makeColorBackground round-trips with colorFromBackground', function() {
  const stored = makeColorBackground('#4a3728');
  assert.equal(stored, 'color:#4a3728');
  assert.equal(colorFromBackground(stored), '#4a3728');
});
