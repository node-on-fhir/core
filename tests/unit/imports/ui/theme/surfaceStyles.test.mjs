import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSurfaceStyles, hexAlpha, SURFACE_TRANSITION } from '../../../../../imports/ui/theme/surfaceStyles.js';

test('hexAlpha converts 6- and 3-digit hex; passes through non-hex', function() {
  assert.equal(hexAlpha('#18181a', 0.72), 'rgba(24, 24, 26, 0.72)');
  assert.equal(hexAlpha('#fff', 0.5), 'rgba(255, 255, 255, 0.5)');
  assert.equal(hexAlpha('teal', 0.5), 'teal');
});

test('solid keeps the surface opaque (only the transition is added)', function() {
  const s = buildSurfaceStyles({ surface: 'solid', paperColor: '#18181a', dividerColor: '#333' });
  assert.deepEqual(Object.keys(s.root), ['transition']);
  assert.equal(s.root.transition, SURFACE_TRANSITION);
});

test('glass is translucent paper + blur + hairline, shadowless', function() {
  const s = buildSurfaceStyles({ surface: 'glass', paperColor: '#18181a', dividerColor: '#333' });
  assert.equal(s.root.backgroundColor, 'rgba(24, 24, 26, 0.72)');
  assert.equal(s.root.backdropFilter, 'blur(8px)');
  assert.equal(s.root.border, '1px solid #333');
  assert.equal(s.root.boxShadow, 'none');
  assert.equal(s.root.transition, SURFACE_TRANSITION);
});

test('flat melts into negative space', function() {
  const s = buildSurfaceStyles({ surface: 'flat', paperColor: '#18181a', dividerColor: '#333' });
  assert.equal(s.root.backgroundColor, 'transparent');
  assert.equal(s.root.border, 'none');
  assert.equal(s.root.boxShadow, 'none');
  assert.equal(s.root.backgroundImage, 'none');
  assert.equal(s.root.transition, SURFACE_TRANSITION);
});

test('unknown surface behaves as solid', function() {
  const s = buildSurfaceStyles({ surface: 'wobbly', paperColor: '#18181a', dividerColor: '#333' });
  assert.deepEqual(Object.keys(s.root), ['transition']);
});
