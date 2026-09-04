// tests/unit/imports/ui/themeDraft.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_DRAFT, DENSITY_FACTORS, settingsToDraft, draftToSettings
} from '../../../../imports/ui/theming/themeDraft.js';

test('DEFAULT_DRAFT carries the spec defaults', function() {
  assert.equal(DEFAULT_DRAFT.radius, 4);
  assert.equal(DEFAULT_DRAFT.baseFont, 14);
  assert.equal(DEFAULT_DRAFT.density, 'standard');
  assert.equal(DEFAULT_DRAFT.nivo, 'red_grey');
  assert.equal(DEFAULT_DRAFT.mode, 'light');
});

test('DENSITY_FACTORS match the handoff scale', function() {
  assert.deepEqual(DENSITY_FACTORS, { compact: 0.7, standard: 1, relaxed: 1.3 });
});

test('settingsToDraft sanitizes !important and reads existing keys', function() {
  const draft = settingsToDraft({
    darkMode: true,
    palette: {
      mode: 'dark',
      primaryColor: '#ffb454',
      secondaryColor: '#ff5ea8 !important',
      paperColorDark: '#141416',
      appBarTextColorDark: '#ffb454',
      backgroundCanvasDark: '#0a0a0b',
      nivoTheme: 'blues'
    },
    typography: { fontFamily: "'Chakra Petch', sans-serif", baseSize: 15 },
    backgroundImagePath: '/backgrounds/ambiance/Zen.jpg',
    shape: { borderRadius: 10 },
    density: 'compact'
  });
  assert.equal(draft.mode, 'dark');
  assert.equal(draft.primary, '#ffb454');
  assert.equal(draft.secondary, '#ff5ea8');           // sanitized
  assert.equal(draft.paperDark, '#141416');
  assert.equal(draft.appBarTextDark, '#ffb454');
  assert.equal(draft.bgDark, '#0a0a0b');
  assert.equal(draft.nivo, 'blues');
  assert.equal(draft.font, "'Chakra Petch', sans-serif");
  assert.equal(draft.baseFont, 15);
  assert.equal(draft.ambiance, '/backgrounds/ambiance/Zen.jpg');
  assert.equal(draft.radius, 10);
  assert.equal(draft.density, 'compact');
});

test('settingsToDraft maps dark-oriented generic paperColor to the dark slot', function() {
  const dark = settingsToDraft({ darkMode: true, palette: { paperColor: '#18181a' } });
  assert.equal(dark.paperDark, '#18181a');
  assert.equal(dark.paperLight, DEFAULT_DRAFT.paperLight);
  const light = settingsToDraft({ palette: { paperColor: '#fffff0' } });
  assert.equal(light.paperLight, '#fffff0');
  assert.equal(light.paperDark, DEFAULT_DRAFT.paperDark);
});

test('draftToSettings writes both modern and legacy background keys', function() {
  const out = draftToSettings(Object.assign({}, DEFAULT_DRAFT, {
    bgLight: '#f0f0f0', bgDark: '#101010'
  }));
  assert.equal(out.palette.backgroundPageColor, '#f0f0f0');
  assert.equal(out.palette.backgroundCanvas, '#f0f0f0');
  assert.equal(out.palette.backgroundPageColorDark, '#101010');
  assert.equal(out.palette.backgroundCanvasDark, '#101010');
});

test('draftToSettings serializes the new dimension keys', function() {
  const out = draftToSettings(Object.assign({}, DEFAULT_DRAFT, {
    name: 'Clinic Blue', base: 'tron', radius: 12, baseFont: 16, density: 'relaxed', nivo: 'auto', mode: 'dark'
  }));
  assert.equal(out.name, 'Clinic Blue');
  assert.equal(out.basePreset, 'tron');
  assert.equal(out.shape.borderRadius, 12);
  assert.equal(out.typography.baseSize, 16);
  assert.equal(out.density, 'relaxed');
  assert.equal(out.palette.nivoTheme, 'auto');
  assert.equal(out.darkMode, true);
  assert.equal(out.palette.mode, 'dark');
});

test('ambiance constraint: paper serializes at 88% opacity when an image is set', function() {
  const out = draftToSettings(Object.assign({}, DEFAULT_DRAFT, {
    ambiance: '/backgrounds/ambiance/Zen.jpg', paperLight: '#ffffff', paperDark: '#1e1e1e'
  }));
  assert.equal(out.palette.paperColorLight, 'rgba(255, 255, 255, 0.88)');
  assert.equal(out.palette.paperColorDark, 'rgba(30, 30, 30, 0.88)');
  assert.equal(out.backgroundImagePath, '/backgrounds/ambiance/Zen.jpg');
});

test('round-trip: settingsToDraft(draftToSettings(d)) preserves the draft (no ambiance)', function() {
  const d = Object.assign({}, DEFAULT_DRAFT, {
    name: 'RT', base: 'limestone', mode: 'dark',
    primary: '#b9b3a4', secondary: '#8a8579', success: '#69f0ae',
    bgLight: '#fafaf7', bgDark: '#0d0d0f', paperLight: '#ffffff', paperDark: '#18181a',
    appBarLight: '#b9b3a4', appBarDark: '#141416',
    appBarTextLight: '#ffffff', appBarTextDark: '#d8d2c4',
    font: "'Chakra Petch', sans-serif", baseFont: 15, radius: 8,
    density: 'compact', ambiance: '', video: '', nivo: 'auto'
  });
  assert.deepEqual(settingsToDraft(draftToSettings(d)), d);
});

test('video maps to showVideoBackground + defaultVideo', function() {
  const off = draftToSettings(Object.assign({}, DEFAULT_DRAFT, { video: '' }));
  assert.equal(off.showVideoBackground, false);
  const on = draftToSettings(Object.assign({}, DEFAULT_DRAFT, { video: '/VideoBackgrounds/GrayWaves.mp4' }));
  assert.equal(on.showVideoBackground, true);
  assert.equal(on.defaultVideo, '/VideoBackgrounds/GrayWaves.mp4');
});
