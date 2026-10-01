// tests/unit/imports/ui/theme/ambianceAnalysis.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeImageData } from '../../../../../imports/ui/theme/ambianceAnalysis.js';

// Build a width×height RGBA array from a per-column color function.
function makeImage(width, height, colorAt) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = colorAt(x, y);
      const i = (y * width + x) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
    }
  }
  return { data, width, height };
}

test('bright image → light page mode; dark image → dark page mode', function() {
  const bright = analyzeImageData(makeImage(30, 12, function() { return [235, 230, 220]; }));
  assert.equal(bright.recommendedPageMode, 'light');
  const dark = analyzeImageData(makeImage(30, 12, function() { return [18, 20, 24]; }));
  assert.equal(dark.recommendedPageMode, 'dark');
});

test('focus lands on the lowest-variance (calmest) third', function() {
  // Left third: flat gray. Center+right thirds: harsh checkerboard.
  const img = makeImage(30, 12, function(x, y) {
    if (x < 10) { return [128, 128, 128]; }
    return ((x + y) % 2 === 0) ? [255, 255, 255] : [0, 0, 0];
  });
  assert.equal(analyzeImageData(img).focus, 'left');

  const imgRight = makeImage(30, 12, function(x, y) {
    if (x >= 20) { return [128, 128, 128]; }
    return ((x + y) % 2 === 0) ? [255, 255, 255] : [0, 0, 0];
  });
  assert.equal(analyzeImageData(imgRight).focus, 'right');
});

test('scrimStrength is clamped to [0.35, 0.8] and grows with busyness', function() {
  const calm = analyzeImageData(makeImage(30, 12, function() { return [128, 128, 128]; }));
  const busy = analyzeImageData(makeImage(30, 12, function(x, y) {
    return ((x + y) % 2 === 0) ? [255, 255, 255] : [0, 0, 0];
  }));
  assert.ok(calm.scrimStrength >= 0.35 && calm.scrimStrength <= 0.8);
  assert.ok(busy.scrimStrength >= 0.35 && busy.scrimStrength <= 0.8);
  assert.ok(busy.scrimStrength > calm.scrimStrength, 'busy image needs a stronger scrim');
});

test('palette returns up to 3 dominant hex colors', function() {
  // Two dominant colors: warm amber left half, deep blue right half.
  const img = makeImage(30, 12, function(x) {
    return x < 15 ? [232, 165, 75] : [20, 40, 90];
  });
  const palette = analyzeImageData(img).palette;
  assert.ok(Array.isArray(palette) && palette.length >= 2 && palette.length <= 3);
  palette.forEach(function(hex) { assert.match(hex, /^#[0-9a-f]{6}$/); });
});
