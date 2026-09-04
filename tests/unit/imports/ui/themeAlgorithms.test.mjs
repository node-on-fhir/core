// tests/unit/imports/ui/themeAlgorithms.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidHex, normalizeHex, hexToHsl, hslToHex, cssColorToHex, mixHex,
  contrastRatio, setHue, setSaturation, generateFromAccent, makeMono,
  deriveDark, deriveLight, nivoAuto, NIVO_SCHEME_SWATCHES
} from '../../../../imports/ui/themeAlgorithms.js';

test('isValidHex accepts #rgb and #rrggbb only', function() {
  assert.equal(isValidHex('#abc'), true);
  assert.equal(isValidHex('#AABBCC'), true);
  assert.equal(isValidHex('#abcd'), false);
  assert.equal(isValidHex('abc'), false);
  assert.equal(isValidHex('rgb(1,2,3)'), false);
  assert.equal(isValidHex(null), false);
});

test('normalizeHex expands shorthand and lowercases', function() {
  assert.equal(normalizeHex('#AbC'), '#aabbcc');
  assert.equal(normalizeHex('#FF0000'), '#ff0000');
  assert.equal(normalizeHex('nope'), null);
});

test('hexToHsl / hslToHex round-trip on primaries', function() {
  assert.deepEqual(hexToHsl('#ff0000'), { h: 0, s: 100, l: 50 });
  assert.equal(hslToHex(0, 100, 50), '#ff0000');
  assert.equal(hslToHex(120, 100, 50), '#00ff00');
  assert.equal(hslToHex(480, 100, 50), '#00ff00'); // hue wraps
  const hsl = hexToHsl('#53e6ff');
  const back = hexToHsl(hslToHex(hsl.h, hsl.s, hsl.l));
  assert.ok(Math.abs(back.h - hsl.h) < 1.5);
  assert.ok(Math.abs(back.s - hsl.s) < 1.5);
  assert.ok(Math.abs(back.l - hsl.l) < 1.5);
});

test('cssColorToHex handles hex, rgb() and fallback', function() {
  assert.equal(cssColorToHex('#abc'), '#aabbcc');
  assert.equal(cssColorToHex('rgb(255, 0, 0)'), '#ff0000');
  assert.equal(cssColorToHex('rgba(0, 128, 255, 0.5)'), '#0080ff');
  assert.equal(cssColorToHex('linear-gradient(x)', '#123456'), '#123456');
});

test('mixHex blends linearly in RGB', function() {
  assert.equal(mixHex('#000000', '#ffffff', 0.5), '#808080');
  assert.equal(mixHex('#000000', '#ffffff', 0), '#000000');
  assert.equal(mixHex('#000000', '#ffffff', 1), '#ffffff');
});

test('contrastRatio matches WCAG anchors', function() {
  assert.ok(Math.abs(contrastRatio('#000000', '#ffffff') - 21) < 0.01);
  assert.ok(Math.abs(contrastRatio('#777777', '#777777') - 1) < 0.01);
  // symmetric
  assert.equal(contrastRatio('#123456', '#fedcba'), contrastRatio('#fedcba', '#123456'));
});

test('setHue keeps S/L, rotates secondary by its offset, keeps linked app-bar text', function() {
  const draft = { primary: hslToHex(200, 60, 50), secondary: hslToHex(235, 40, 40), appBarTextDark: hslToHex(200, 60, 50) };
  const next = setHue(draft, 20);
  const p = hexToHsl(next.primary);
  assert.ok(Math.abs(p.h - 20) < 1.5);
  assert.ok(Math.abs(p.s - 60) < 1.5);
  assert.ok(Math.abs(p.l - 50) < 1.5);
  const s = hexToHsl(next.secondary);
  assert.ok(Math.abs(s.h - 55) < 1.5); // offset of +35 preserved
  assert.equal(next.appBarTextDark, next.primary); // linked
});

test('setHue leaves unlinked app-bar text alone', function() {
  const draft = { primary: hslToHex(200, 60, 50), secondary: hslToHex(235, 40, 40), appBarTextDark: '#ffffff' };
  const next = setHue(draft, 20);
  assert.equal('appBarTextDark' in next, false);
});

test('setSaturation moves primary S only, keeps linked app-bar text', function() {
  const draft = { primary: hslToHex(200, 60, 50), appBarTextDark: hslToHex(200, 60, 50) };
  const next = setSaturation(draft, 10);
  const p = hexToHsl(next.primary);
  assert.ok(Math.abs(p.s - 10) < 1.5);
  assert.ok(Math.abs(p.h - 200) < 1.5);
  assert.equal(next.appBarTextDark, next.primary);
});

test('generateFromAccent follows the handoff formulas', function() {
  const draft = { primary: hslToHex(100, 90, 70) }; // S clamps to 85, L clamps to 65
  const next = generateFromAccent(draft);
  const sec = hexToHsl(next.secondary);
  assert.ok(Math.abs(sec.h - 135) < 1.5);          // hue + 35
  const info = hexToHsl(next.info);
  assert.ok(Math.abs(info.h - 205) < 1.5);
  assert.ok(Math.abs(info.s - 85) < 1.5);          // clamped S
  assert.ok(Math.abs(info.l - 65) < 1.5);          // clamped L
  const warn = hexToHsl(next.warning);
  assert.ok(Math.abs(warn.h - 38) < 1.5);
  const err = hexToHsl(next.error);
  assert.ok(Math.abs(err.h - 352) < 1.5);
  assert.ok(Math.abs(err.l - 65 * 0.9) < 1.5);
  const suc = hexToHsl(next.success);
  assert.ok(Math.abs(suc.h - 140) < 1.5);
  assert.ok(Math.abs(suc.s - 85 * 0.8) < 1.5);
});

test('makeMono desaturates primary to 8, secondary to 6 with L*0.75', function() {
  const draft = { primary: hslToHex(200, 60, 50), secondary: hslToHex(235, 40, 40) };
  const next = makeMono(draft);
  assert.ok(Math.abs(hexToHsl(next.primary).s - 8) < 1.5);
  const s = hexToHsl(next.secondary);
  assert.ok(Math.abs(s.s - 6) < 1.5);
  assert.ok(Math.abs(s.l - 30) < 1.5);
});

test('deriveDark builds the dark column from primary hue', function() {
  const draft = { primary: hslToHex(200, 60, 50) };
  const next = deriveDark(draft);
  const bg = hexToHsl(next.bgDark);
  // At 4% lightness the RGB channels quantize hard (values ~8-12), so hue and
  // saturation drift several points on round-trip — loose tolerances are correct.
  assert.ok(Math.abs(bg.h - 200) < 8);
  assert.ok(Math.abs(bg.s - 18) < 4);              // min(60,30)*0.6
  assert.ok(Math.abs(bg.l - 4) < 1.5);
  assert.ok(Math.abs(hexToHsl(next.paperDark).l - 8) < 1.5);
  assert.ok(Math.abs(hexToHsl(next.appBarDark).l - 6) < 1.5);
  assert.equal(next.appBarTextDark, normalizeHex(draft.primary));
});

test('deriveLight builds the light column from primary hue', function() {
  const draft = { primary: hslToHex(200, 60, 50) };
  const next = deriveLight(draft);
  assert.ok(Math.abs(hexToHsl(next.bgLight).l - 97) < 1.5);
  assert.equal(next.paperLight, '#ffffff');
  const ab = hexToHsl(next.appBarLight);
  assert.ok(Math.abs(ab.s - 55) < 1.5);            // min(60,55)
  assert.ok(Math.abs(ab.l - 40) < 1.5);            // min(50,40)
  assert.equal(next.appBarTextLight, '#ffffff');
});

test('nivoAuto yields 5 steps with rising lightness', function() {
  const steps = nivoAuto('#2196f3');
  assert.equal(steps.length, 5);
  const ls = steps.map(function(hex) { return hexToHsl(hex).l; });
  for (let i = 1; i < 5; i++) { assert.ok(ls[i] > ls[i - 1]); }
});

test('NIVO_SCHEME_SWATCHES covers the 5 named schemes with 5 colors each', function() {
  ['red_grey', 'blues', 'greens', 'purples', 'oranges'].forEach(function(k) {
    assert.equal(NIVO_SCHEME_SWATCHES[k].length, 5);
    NIVO_SCHEME_SWATCHES[k].forEach(function(c) { assert.equal(isValidHex(c), true); });
  });
});
