import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveComposition } from '../../../../../imports/ui/theme/ambianceComposition.js';

test('no background → kind none, no forced ink, defaults', function() {
  const c = resolveComposition({ background: '', entry: null, pageMode: 'dark', cardSurface: 'glass' });
  assert.deepEqual(c, { background: '', kind: 'none', focus: 'center', scrimStrength: 0.55, pageMode: null, cardSurface: 'glass' });
});

test('image with full curation record resolves verbatim', function() {
  const c = resolveComposition({
    background: '/backgrounds/ambiance/Yoga-Ocean.jpg',
    entry: { focus: 'left', recommendedPageMode: 'dark', scrimStrength: 0.6 },
    pageMode: null, cardSurface: 'flat'
  });
  assert.equal(c.kind, 'image');
  assert.equal(c.focus, 'left');
  assert.equal(c.scrimStrength, 0.6);
  assert.equal(c.pageMode, 'dark');       // curated fallback when user pageMode unset
  assert.equal(c.cardSurface, 'flat');
});

test('explicit pageMode beats curated recommendation', function() {
  const c = resolveComposition({
    background: '/x.jpg', entry: { recommendedPageMode: 'dark' }, pageMode: 'light', cardSurface: 'solid'
  });
  assert.equal(c.pageMode, 'light');
});

test('solid color → kind color, center focus, entry ignored', function() {
  const c = resolveComposition({ background: 'color:#a67b5b', entry: null, pageMode: 'light', cardSurface: 'solid' });
  assert.equal(c.kind, 'color');
  assert.equal(c.focus, 'center');
  assert.equal(c.pageMode, 'light');      // solids still take forced ink
});

test('surfaceOverride wins over global cardSurface; junk values fall back', function() {
  const c = resolveComposition({ background: '/x.jpg', entry: {}, pageMode: 'purple', cardSurface: 'wobbly', surfaceOverride: 'flat' });
  assert.equal(c.cardSurface, 'flat');
  assert.equal(c.pageMode, null);
  const d = resolveComposition({ background: '/x.jpg', entry: {}, pageMode: null, cardSurface: 'wobbly' });
  assert.equal(d.cardSurface, 'solid');
});

test('route surfaceDefault beats global cardSurface; user surfaceOverride beats both', function() {
  const c = resolveComposition({ background: '/x.jpg', entry: {}, cardSurface: 'solid', surfaceDefault: 'flat' });
  assert.equal(c.cardSurface, 'flat');
  const d = resolveComposition({ background: '/x.jpg', entry: {}, cardSurface: 'solid', surfaceDefault: 'flat', surfaceOverride: 'solid' });
  assert.equal(d.cardSurface, 'solid');
  const e = resolveComposition({ background: '/x.jpg', entry: {}, cardSurface: 'glass', surfaceDefault: 'wobbly' });
  assert.equal(e.cardSurface, 'glass');
});

test('scrimStrength clamps to [0,1] and defaults to 0.55', function() {
  assert.equal(resolveComposition({ background: '/x.jpg', entry: { scrimStrength: 7 } }).scrimStrength, 1);
  assert.equal(resolveComposition({ background: '/x.jpg', entry: { scrimStrength: -2 } }).scrimStrength, 0);
  assert.equal(resolveComposition({ background: '/x.jpg', entry: {} }).scrimStrength, 0.55);
});
