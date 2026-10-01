import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseFirstColor, relativeLuminance, inkForColor,
  inverseHueSaturationBrightness, readableAccent
} from '../../../../../imports/ui/theme/contrastInk.js';

test('parses hex, short hex, rgb() and rgba()', function() {
  assert.deepEqual(parseFirstColor('#53e6ff'), { r: 0x53, g: 0xe6, b: 0xff });
  assert.deepEqual(parseFirstColor('#fff'), { r: 255, g: 255, b: 255 });
  assert.deepEqual(parseFirstColor('rgb(185, 179, 164)'), { r: 185, g: 179, b: 164 });
  assert.deepEqual(parseFirstColor('rgba(20, 20, 22, 0.95)'), { r: 20, g: 20, b: 22 });
});

test('gradients resolve to the first color stop', function() {
  assert.deepEqual(
    parseFirstColor('linear-gradient(135deg, rgba(33, 150, 243, 0.9) 0%, rgba(156, 39, 176, 0.9) 100%)'),
    { r: 33, g: 150, b: 243 }
  );
  assert.deepEqual(
    parseFirstColor('linear-gradient(90deg, #070b12, #0b1220)'),
    { r: 0x07, g: 0x0b, b: 0x12 }
  );
});

test('low-alpha and junk values return null (caller falls back)', function() {
  assert.equal(parseFirstColor('rgba(33, 150, 243, 0.3)'), null);
  assert.equal(parseFirstColor('transparent'), null);
  assert.equal(parseFirstColor(''), null);
  assert.equal(parseFirstColor(null), null);
});

test('bright surfaces get dark ink, dark surfaces get light ink', function() {
  assert.equal(inkForColor('#53e6ff'), 'dark');    // Tron cyan bar
  assert.equal(inkForColor('#b9b3a4'), 'dark');    // Limestone stone bar
  assert.equal(inkForColor('#ffb454'), 'dark');    // Vaporwave amber
  assert.equal(inkForColor('#070b12'), 'light');   // Tron dark chrome
  assert.equal(inkForColor('#141416'), 'light');   // near-black
  assert.equal(inkForColor('#ffffff'), 'dark');
  assert.equal(inkForColor('not-a-color'), null);
});

test('inverseHueSaturationBrightness flips lightness, preserves hue', function() {
  // Bright cyan → dark teal-cyan (still readable as "cyan")
  const darkCyan = inverseHueSaturationBrightness('#53e6ff');
  const before = parseFirstColor('#53e6ff');
  const after = parseFirstColor(darkCyan);
  assert.ok(relativeLuminance(after) < relativeLuminance(before), 'brightness inverted downward');
  // Hue preserved: blue channel still dominates, red still smallest
  assert.ok(after.b > after.r && after.g > after.r, 'still a cyan family color');
  // Involution-ish: inverting twice lands near the original lightness
  const twice = parseFirstColor(inverseHueSaturationBrightness(darkCyan));
  assert.ok(Math.abs(relativeLuminance(twice) - relativeLuminance(before)) < 0.1);
  // Unparseable input passes through untouched
  assert.equal(inverseHueSaturationBrightness('not-a-color'), 'not-a-color');
});

test('readableAccent inverts only matching-polarity combinations', function() {
  // Bright accent on light surface → inverted (the washed-out case)
  assert.notEqual(readableAccent('#53e6ff', 'light'), '#53e6ff');
  // Bright accent on dark surface → untouched (looks great already)
  assert.equal(readableAccent('#53e6ff', 'dark'), '#53e6ff');
  // Dark accent on dark surface → inverted (would vanish)
  assert.notEqual(readableAccent('#0b1220', 'dark'), '#0b1220');
  // Dark accent on light surface → untouched
  assert.equal(readableAccent('#0b1220', 'light'), '#0b1220');
  // Mid-range accents are stable on both surfaces
  assert.equal(readableAccent('#2aa5bd', 'light'), '#2aa5bd');
  assert.equal(readableAccent('#2aa5bd', 'dark'), '#2aa5bd');
});

test('relativeLuminance matches Rec. 709 expectations', function() {
  assert.equal(relativeLuminance({ r: 0, g: 0, b: 0 }), 0);
  assert.ok(Math.abs(relativeLuminance({ r: 255, g: 255, b: 255 }) - 1) < 1e-9);
  assert.ok(relativeLuminance({ r: 0, g: 255, b: 0 }) > relativeLuminance({ r: 255, g: 0, b: 0 }));
});
