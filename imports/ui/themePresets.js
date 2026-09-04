// imports/ui/themePresets.js
//
// The three primary theme presets and the runtime apply helpers. A preset is a
// full palette bundle + optional font; applying one writes into
// Meteor.settings.public.theme (the single palette authority CustomThemeProvider
// reads) and pokes Session('themeRefreshRequest') to regenerate the MUI theme —
// the exact mechanism ThemingPage's "Load Theme Into Settings" uses.
//
// Three axes are independent: preset (palette base), accent hue (the sliding
// mono→single-hue control), font, and background image all layer without
// resetting each other. Selections persist via themePersistence.js.
//
// Brand model: 2 degrees of freedom (mode × accent hue) is the norm —
// Limestone (grayscale) and Tron (one hue). Vaporwave is the advanced 3-hue
// look ported from the Provider Directory console.

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get, set } from 'lodash';
import { saveThemeChoice, loadThemeChoice } from '/imports/lib/themePersistence.js';
import { nivoAuto, NIVO_SCHEME_SWATCHES } from './themeAlgorithms.js';

// Self-hosted display pairing (client/main.css @font-face; /fonts/*.woff2).
export const CHAKRA_FONT = "'Chakra Petch', 'Avenir Next Condensed', sans-serif";
export const MARTIAN_FONT = "'Martian Mono', 'SF Mono', ui-monospace, monospace";
export const DEFAULT_FONT = '"Roboto", "Helvetica", "Arial", sans-serif';

// A neutral warm-gray ramp shared by the monochrome presets.
const STONE = {
  canvasDark: '#0d0d0f',
  paperDark: '#18181a',
  ink: '#d8d2c4',
  inkDim: '#8a8579'
};

export const THEME_PRESETS = [
  {
    id: 'limestone',
    name: 'Limestone',
    description: 'Grayscale monochrome. Calm, brand-neutral, the default.',
    mode: 'dark',
    accentHue: '#b9b3a4',            // desaturated stone — effectively "no hue"
    palette: {
      mode: 'dark',
      primaryColor: '#b9b3a4',
      secondaryColor: '#8a8579',
      backgroundCanvasDark: STONE.canvasDark,
      paperColorDark: STONE.paperDark,
      cardColorDark: STONE.paperDark,
      appBarColorDark: '#141416',
      appBarTextColorDark: STONE.ink
    }
  },
  {
    id: 'tron',
    name: 'Tron',
    description: 'Grayscale + one accent hue. Dial the hue below.',
    mode: 'dark',
    accentHue: '#53e6ff',            // default cyan; user dials via HueSelector
    palette: {
      mode: 'dark',
      primaryColor: '#53e6ff',
      secondaryColor: '#2aa5bd',
      backgroundCanvasDark: '#05070a',
      paperColorDark: '#0b1220',
      cardColorDark: '#0b1220',
      appBarColorDark: '#070b12',
      appBarTextColorDark: '#53e6ff'
    }
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    description: 'The Provider Directory look — 3-hue, Chakra Petch. Advanced.',
    advanced: true,
    mode: 'dark',
    accentHue: '#ffb454',            // amber lead; green/cyan/magenta as secondaries
    fontFamily: CHAKRA_FONT,
    displayFontFamily: CHAKRA_FONT,
    palette: {
      mode: 'dark',
      primaryColor: '#ffb454',
      secondaryColor: '#ff5ea8',
      errorColor: '#ff5ea8',
      successColor: '#69f0ae',
      infoColor: '#53e6ff',
      backgroundCanvasDark: '#0a0a0b',
      paperColorDark: '#141416',
      cardColorDark: '#18181a',
      appBarColorDark: '#0a0a0b',
      appBarTextColorDark: '#ffb454'
    }
  }
];

export function getPreset(presetId) {
  return THEME_PRESETS.find(function(p) { return p.id === presetId; }) || null;
}

// Ensure the settings tree exists before we write into it.
function ensureThemeSettings() {
  if (!Meteor.settings) { Meteor.settings = {}; }
  if (!Meteor.settings.public) { Meteor.settings.public = {}; }
  if (!Meteor.settings.public.theme) { Meteor.settings.public.theme = {}; }
  if (!Meteor.settings.public.theme.palette) { Meteor.settings.public.theme.palette = {}; }
  if (!Meteor.settings.public.theme.typography) { Meteor.settings.public.theme.typography = {}; }
  return Meteor.settings.public.theme;
}

// Regenerate the live MUI theme (CustomThemeProvider watches this flag).
function pokeRefresh() {
  Session.set('themeRefreshRequest', true);
}

// Apply a full preset (palette + optional font), honoring live overrides for
// the accent hue and font that the dialog controls carry independently.
export function applyThemePreset(presetId, options) {
  const preset = getPreset(presetId);
  if (!preset) { return; }
  const theme = ensureThemeSettings();

  Object.assign(theme.palette, preset.palette);

  const accentHue = get(options, 'accentHueOverride') || preset.accentHue;
  if (accentHue) {
    theme.palette.primaryColor = accentHue;
  }

  const font = get(options, 'fontOverride') || preset.fontFamily || null;
  theme.typography.fontFamily = font || '';
  theme.typography.displayFontFamily = font ? (preset.displayFontFamily || font) : '';

  if (preset.mode) {
    theme.palette.mode = preset.mode;
    theme.darkMode = preset.mode === 'dark';
    Session.set('theme', preset.mode);
  }

  saveThemeChoice({
    presetId: presetId,
    accentHue: accentHue || null,
    fontFamily: font || null,
    mode: preset.mode || Session.get('theme')
  });
  pokeRefresh();
}

// Live control: set only the accent hue (Tron/Limestone slider).
export function setAccentHue(hex) {
  const theme = ensureThemeSettings();
  theme.palette.primaryColor = hex;
  saveThemeChoice({ accentHue: hex });
  pokeRefresh();
}

// Live control: set only the font (empty string → back to the default stack).
export function setThemeFont(fontFamily) {
  const theme = ensureThemeSettings();
  theme.typography.fontFamily = fontFamily || '';
  theme.typography.displayFontFamily = fontFamily || '';
  saveThemeChoice({ fontFamily: fontFamily || null });
  pokeRefresh();
}

// Live control: set (or clear) the ambiance background image.
export function setThemeBackground(src) {
  const theme = ensureThemeSettings();
  set(theme, 'backgroundImagePath', src || '');
  saveThemeChoice({ backgroundImagePath: src || null });
  pokeRefresh();
}

// Boot: re-apply the persisted choice into Meteor.settings BEFORE the
// CustomThemeProvider mounts, so createDynamicTheme reads correct values on
// first render (no flash). Deliberately does NOT save or poke refresh — the
// provider hasn't mounted yet and will read these fresh.
export function applyThemeChoiceAtBoot() {
  const choice = loadThemeChoice();
  if (!choice) { return; }
  const theme = ensureThemeSettings();

  const preset = getPreset(choice.presetId);
  if (preset) {
    Object.assign(theme.palette, preset.palette);
    if (preset.mode) {
      theme.palette.mode = preset.mode;
      theme.darkMode = preset.mode === 'dark';
    }
  }
  if (choice.accentHue) { theme.palette.primaryColor = choice.accentHue; }
  if (choice.mode) {
    theme.palette.mode = choice.mode;
    theme.darkMode = choice.mode === 'dark';
    Session.set('theme', choice.mode);
  }
  if ('fontFamily' in choice) {
    theme.typography.fontFamily = choice.fontFamily || '';
    theme.typography.displayFontFamily = choice.fontFamily || (preset && preset.displayFontFamily) || '';
  }
  if ('backgroundImagePath' in choice) {
    set(theme, 'backgroundImagePath', choice.backgroundImagePath || '');
  }
}

// The Theming Studio's pure color math lives in themeAlgorithms.js (Meteor-free
// so node --test can load it); re-exported here per the design handoff so
// consumers have one import point.
export * from './themeAlgorithms.js';

// Single read point for Nivo chart palettes. 'auto' derives 5 steps from the
// current primary color; named schemes return their representative swatches.
export function getNivoColors() {
  const scheme = get(Meteor, 'settings.public.theme.palette.nivoTheme', 'red_grey');
  if (scheme === 'auto') {
    const primary = get(Meteor, 'settings.public.theme.palette.primaryColor', '#9e9e9e');
    return nivoAuto(primary);
  }
  return NIVO_SCHEME_SWATCHES[scheme] || NIVO_SCHEME_SWATCHES.red_grey;
}
