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
import { get, set, omit } from 'lodash';
import { saveThemeChoice, loadThemeChoice } from '/imports/lib/themePersistence.js';
import { nivoAuto, NIVO_SCHEME_SWATCHES, deriveNavbarFromHue } from './themeAlgorithms.js';
import { PAGE_MODE, CARD_SURFACE, PAGE_SURFACE_OVERRIDES } from '/imports/lib/SessionKeys.js';

// Self-hosted display pairing (client/main.css @font-face; /fonts/*.woff2).
export const CHAKRA_FONT = "'Chakra Petch', 'Avenir Next Condensed', sans-serif";
export const MARTIAN_FONT = "'Martian Mono', 'SF Mono', ui-monospace, monospace";
export const INTER_FONT = "'Inter', 'Helvetica Neue', 'Segoe UI', sans-serif";
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
    appBarTracksAccent: true,        // header + footer text follow the dialed hue
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
    id: 'nocturne',
    name: 'Nocturne',
    description: 'Dark violet monochrome — the My Profile identity.',
    mode: 'dark',
    accentHue: '#9184d9',            // accent-500 from the design handoff token sheet
    fontFamily: INTER_FONT,          // splash-flow handoff: Inter throughout, headings 500
    displayFontFamily: INTER_FONT,
    palette: {
      mode: 'dark',
      primaryColor: '#9184d9',
      secondaryColor: '#75798c',     // neutral-600 — mono palette, no second hue
      backgroundCanvasDark: '#161826',
      paperColorDark: '#232532',
      cardColorDark: '#232532',
      appBarColorDark: '#161826',
      appBarTextColorDark: '#e9e9ed'
    }
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    description: 'The Provider Directory look — 3-hue, Chakra Petch. Advanced.',
    advanced: true,
    mode: 'dark',
    accentHue: '#ff5ea8',            // neon-pink lead; amber/green/cyan as secondaries
    appBarTracksAccent: true,        // header + footer text follow the pink lead
    fontFamily: CHAKRA_FONT,
    displayFontFamily: CHAKRA_FONT,
    palette: {
      mode: 'dark',
      primaryColor: '#ff5ea8',
      secondaryColor: '#ffb454',
      errorColor: '#ff5ea8',
      successColor: '#69f0ae',
      infoColor: '#53e6ff',
      backgroundCanvasDark: '#0a0a0b',
      paperColorDark: '#141416',
      cardColorDark: '#18181a',
      appBarColorDark: '#0a0a0b',
      appBarTextColorDark: '#ff5ea8'
    }
  },
  // ---- Ambiance presets: palette + bundled background image ----------------
  {
    id: 'large-zen',
    name: 'Large Zen',
    description: 'Silver water and black river stones. Spacious, unhurried.',
    mode: 'dark',
    accentHue: '#9aa3a8',
    backgroundImagePath: '/backgrounds/ambiance/LargeZenRocks.jpg',
    palette: {
      mode: 'dark',
      primaryColor: '#9aa3a8',
      secondaryColor: '#6f767a',
      backgroundCanvasDark: '#101112',
      paperColorDark: '#1a1c1d',
      cardColorDark: '#1a1c1d',
      appBarColorDark: '#151718',
      appBarTextColorDark: '#d8dcde'
    }
  },
  {
    id: 'bamboo',
    name: 'Bamboo',
    description: 'Matcha greens and bamboo stalks. Natural, grounded.',
    mode: 'dark',
    accentHue: '#8fb75e',
    backgroundImagePath: '/backgrounds/ambiance/BambooIllustration.jpg',
    palette: {
      mode: 'dark',
      primaryColor: '#8fb75e',
      secondaryColor: '#5f7f3f',
      backgroundCanvasDark: '#0e120c',
      paperColorDark: '#161c13',
      cardColorDark: '#161c13',
      appBarColorDark: '#121810',
      appBarTextColorDark: '#cde3bf'
    }
  },
  {
    id: 'yoga-ocean',
    name: 'Yoga Ocean',
    description: 'Sunset gold over calm water. Warm, meditative.',
    mode: 'dark',
    accentHue: '#e8b264',
    backgroundImagePath: '/backgrounds/ambiance/Yoga-Ocean.jpg',
    palette: {
      mode: 'dark',
      primaryColor: '#e8b264',
      secondaryColor: '#a98548',
      backgroundCanvasDark: '#181410',
      paperColorDark: '#221c15',
      cardColorDark: '#221c15',
      appBarColorDark: '#141110',
      appBarTextColorDark: '#f2dfc2'
    }
  },
  {
    id: 'plasmid',
    name: 'Plasmid',
    description: 'Deep teal helix with GFP green. Lab-bench biotech.',
    advanced: true,
    mode: 'dark',
    accentHue: '#4fc3d9',
    backgroundImagePath: '/backgrounds/ambiance/PlasmidBlue.jpg',
    palette: {
      mode: 'dark',
      primaryColor: '#4fc3d9',
      secondaryColor: '#69f0ae',
      infoColor: '#53e6ff',
      successColor: '#69f0ae',
      backgroundCanvasDark: '#0a1418',
      paperColorDark: '#102028',
      cardColorDark: '#102028',
      appBarColorDark: '#0c1a20',
      appBarTextColorDark: '#c8ecf4'
    }
  },
  {
    id: 'pearl',
    name: 'Pearl',
    description: 'Iridescent blue-to-pink nacre. The classic Honeycomb gradient, now by choice.',
    easterEgg: true,                 // studio strip only — hidden from the quick ThemeDialog grid
    mode: 'light',
    accentHue: '#2196f3',
    palette: {
      mode: 'light',
      primaryColor: 'rgb(33, 150, 243)',
      secondaryColor: '#9c27b0',
      // Translucent by design — the nacre look. Gradients ride the MuiAppBar
      // styleOverride in CustomThemeProvider (appBarIsGradient); palette math
      // sees only the first color stop via toPaletteColor.
      appBarColor: 'linear-gradient(135deg, rgba(33, 150, 243, 0.3) 0%, rgba(156, 39, 176, 0.3) 100%)',
      appBarColorDark: 'linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(156, 39, 176, 0.2) 100%)',
      appBarTextColor: '#ffffff',
      appBarTextColorDark: '#ffffff'
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

// Regenerate the live MUI theme (CustomThemeProvider watches this key).
// Monotonic counter, NOT a boolean: setting `true` over `true` is a silent
// reactive no-op, so a single missed reset would wedge every later refresh.
// An increment is always a change — self-healing by construction.
export function requestThemeRefresh() {
  const current = Session.get('themeRefreshRequest');
  Session.set('themeRefreshRequest', (typeof current === 'number' ? current : 0) + 1);
}

function pokeRefresh() {
  requestThemeRefresh();
}

// Write a preset's palette into the live theme settings. Shared by the
// dialog/studio apply path and the boot path so the two can't drift.
// Presets own the navbar: drop any previous navbar keys (from a navbar-hue
// derivation OR from the clinic settings file) so keys the preset doesn't
// define fall back to the provider defaults rather than leaking through.
// Presets do NOT own the mode — MODE is an independent control (the
// light/dark toggle), so strip `mode` from the palette payload. Presets'
// dark-suffixed keys style dark mode without flipping the app into it.
function applyPresetPalette(theme, preset) {
  ['appBarColor', 'appBarColorDark', 'appBarTextColor', 'appBarTextColorDark'].forEach(function(key) {
    delete theme.palette[key];
  });
  Object.assign(theme.palette, omit(preset.palette, ['mode']));
}

// Apply a full preset (palette + optional font), honoring live overrides for
// the accent hue and font that the dialog controls carry independently.
export function applyThemePreset(presetId, options) {
  const preset = getPreset(presetId);
  if (!preset) { return; }
  const theme = ensureThemeSettings();

  applyPresetPalette(theme, preset);

  // A preset switch is a fresh base — drop any per-field overrides from the
  // previous preset so e.g. a Tron appbar tweak doesn't bleed into Limestone.
  saveThemeChoice({ paletteOverrides: null });

  const accentHue = get(options, 'accentHueOverride') || preset.accentHue;
  if (accentHue) {
    theme.palette.primaryColor = accentHue;
    // Accent presets (Tron/Vaporwave) carry the hue into the DARK app chrome
    // (bar is near-black there, so accent text reads). Light mode leaves the
    // text unset — the provider auto-contrasts it from the bar's brightness.
    if (preset.appBarTracksAccent) {
      theme.palette.appBarTextColorDark = accentHue;
    }
  }

  const font = get(options, 'fontOverride') || preset.fontFamily || null;
  theme.typography.fontFamily = font || '';
  theme.typography.displayFontFamily = font ? (preset.displayFontFamily || font) : '';

  const navbarHue = get(options, 'navbarHueOverride') || null;
  if (navbarHue) {
    Object.assign(theme.palette, deriveNavbarFromHue(navbarHue));
  }

  // Ambiance presets bundle a background image; plain presets clear any
  // previous one — a preset is the whole look.
  set(theme, 'backgroundImagePath', preset.backgroundImagePath || '');

  saveThemeChoice({
    presetId: presetId,
    accentHue: accentHue || null,
    navbarHue: navbarHue,
    fontFamily: font || null,
    backgroundImagePath: preset.backgroundImagePath || null,
    mode: Session.get('theme') || null
  });
  pokeRefresh();
}

// Live control: set only the accent hue (Tron/Limestone slider). When the
// active preset tracks accent in its chrome (Tron/Vaporwave), the appbar text
// follows too so Header + Footer restyle with the dial.
export function setAccentHue(hex) {
  const theme = ensureThemeSettings();
  theme.palette.primaryColor = hex;
  const choice = loadThemeChoice() || {};
  const activePreset = getPreset(choice.presetId);
  if (activePreset && activePreset.appBarTracksAccent) {
    // Dark chrome only — the light-mode bar's background IS the accent
    // (appBarColor defaults to primaryColor), so accent text would vanish.
    theme.palette.appBarTextColorDark = hex;
    delete theme.palette.appBarTextColor;
  }
  saveThemeChoice({ accentHue: hex });
  pokeRefresh();
}

// Live control: navbar (header/footer AppBar) hue. `hex` is the canonical
// hue/saturation/lightness choice; deriveNavbarFromHue expands it into the
// light/dark background analogs and black/white text — the dialog never
// exposes navbar text color, that's full-editor territory.
export function setNavbarHue(hex) {
  const theme = ensureThemeSettings();
  Object.assign(theme.palette, deriveNavbarFromHue(hex));
  saveThemeChoice({ navbarHue: hex });
  pokeRefresh();
}

// Live control: set one per-field palette override (from PaletteFieldEditor).
// Writes the live settings AND persists into the choice's paletteOverrides map
// so it survives reload (re-applied at boot after the preset). Empty value
// clears that key's override.
export function setPaletteOverride(fieldKey, value) {
  const theme = ensureThemeSettings();
  const choice = loadThemeChoice() || {};
  const overrides = Object.assign({}, get(choice, 'paletteOverrides', {}));
  if (value) {
    theme.palette[fieldKey] = value;
    overrides[fieldKey] = value;
  } else {
    delete theme.palette[fieldKey];
    delete overrides[fieldKey];
  }
  saveThemeChoice({ paletteOverrides: overrides });
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

const CARD_SURFACES = ['solid', 'glass', 'flat'];

// Live control: app-wide light/dark mode. Session('theme') is canonical —
// CustomThemeProvider mirrors it into its React state, so the header
// Sun/Moon icon, the Theme & Palette MODE control, and presets all agree.
export function setThemeMode(mode) {
  const next = mode === 'dark' ? 'dark' : 'light';
  Session.set('theme', next);
  saveThemeChoice({ mode: next });
}

// Live control: content-ink mode for ambiance-enabled pages ('light'|'dark');
// null/undefined clears the override (app mode stands). Chrome keeps Session('theme').
export function setPageMode(mode) {
  const next = (mode === 'light' || mode === 'dark') ? mode : null;
  Session.set(PAGE_MODE, next || undefined);
  saveThemeChoice({ pageMode: next });
  pokeRefresh();
}

// Live control: card surface state. Unknown values coerce to 'solid'.
export function setCardSurface(surface) {
  const next = CARD_SURFACES.indexOf(surface) !== -1 ? surface : 'solid';
  Session.set(CARD_SURFACE, next);
  saveThemeChoice({ cardSurface: next });
  pokeRefresh();
}

// Live control: advance the card surface one step (Ctrl+Shift+L).
export function cycleCardSurface() {
  const current = Session.get(CARD_SURFACE) || 'solid';
  const next = CARD_SURFACES[(CARD_SURFACES.indexOf(current) + 1) % CARD_SURFACES.length];
  setCardSurface(next);
}

// Per-route baseline card surface, from route-level `defaultSurface`
// declarations (e.g. /patient-chart is flat-by-default). AmbianceZone
// registers the active route's baseline at render time so the Ctrl+Shift+K
// toggle knows which way to flip.
const routeSurfaceDefaults = {};
export function registerRouteSurfaceDefault(pathname, surface) {
  if (!pathname) { return; }
  if (CARD_SURFACES.indexOf(surface) !== -1) {
    routeSurfaceDefaults[pathname] = surface;
  } else {
    delete routeSurfaceDefaults[pathname];
  }
}

// Live control: per-route card <-> full-height override (Ctrl+Shift+K).
// Toggles the active pathname between its baseline and the opposite surface:
// normal routes flip to 'flat' (one-page/full-height); flat-by-default routes
// (route defaultSurface: 'flat') flip to 'solid' cards. Removing the override
// returns to the baseline. Spec: onePageLayout revival.
export function togglePageSurfaceOverride(pathname) {
  if (!pathname) { return; }
  const overrides = Object.assign({}, Session.get(PAGE_SURFACE_OVERRIDES) || {});
  if (overrides[pathname]) {
    delete overrides[pathname];
  } else {
    overrides[pathname] = routeSurfaceDefaults[pathname] === 'flat' ? 'solid' : 'flat';
  }
  Session.set(PAGE_SURFACE_OVERRIDES, overrides);
  saveThemeChoice({ pageSurfaceOverrides: overrides });
  pokeRefresh();
}

// Boot: re-apply the persisted choice into Meteor.settings BEFORE the
// CustomThemeProvider mounts, so createDynamicTheme reads correct values on
// first render (no flash). Deliberately does NOT save or poke refresh — the
// provider hasn't mounted yet and will read these fresh.
export function applyThemeChoiceAtBoot() {
  const choice = loadThemeChoice();
  if (!choice) {
    // No persisted user choice: fall back to the clinic's declared default
    // preset. A settings file that sets `defaultPreset` is saying "the preset
    // is the intended look" (its own appBar keys are dropped by
    // applyPresetPalette); files wanting a fully bespoke palette omit the key.
    // Mode stays owned by settings darkMode — deliberately not touched here.
    const defaultPresetId = get(Meteor, 'settings.public.theme.defaultPreset', '');
    const defaultPreset = getPreset(defaultPresetId);
    if (defaultPreset) {
      applyPresetPalette(ensureThemeSettings(), defaultPreset);
    }
    return;
  }
  const theme = ensureThemeSettings();

  const preset = getPreset(choice.presetId);
  if (preset) {
    applyPresetPalette(theme, preset);
  }
  if (choice.accentHue) {
    theme.palette.primaryColor = choice.accentHue;
    if (preset && preset.appBarTracksAccent) {
      // Dark chrome only — light-mode bar background defaults to the accent,
      // so accent text there is invisible (matches applyThemePreset).
      theme.palette.appBarTextColorDark = choice.accentHue;
      delete theme.palette.appBarTextColor;
    }
  }
  if (choice.navbarHue) {
    Object.assign(theme.palette, deriveNavbarFromHue(choice.navbarHue));
  }
  if (choice.mode === 'light' || choice.mode === 'dark') {
    // Session only — mutating darkMode/palette.mode here would reorient the
    // clinic settings file's generic (unsuffixed) color values.
    Session.set('theme', choice.mode);
  }
  if ('fontFamily' in choice) {
    theme.typography.fontFamily = choice.fontFamily || '';
    theme.typography.displayFontFamily = choice.fontFamily || (preset && preset.displayFontFamily) || '';
  }
  if ('backgroundImagePath' in choice) {
    set(theme, 'backgroundImagePath', choice.backgroundImagePath || '');
  }

  // Ambiance axes — unknown persisted values are treated as unset
  // (forward/backward compat per the ambiance spec).
  if (choice.pageMode === 'light' || choice.pageMode === 'dark') {
    Session.set(PAGE_MODE, choice.pageMode);
  }
  if (CARD_SURFACES.indexOf(choice.cardSurface) !== -1) {
    Session.set(CARD_SURFACE, choice.cardSurface);
  }

  // Per-route surface overrides — keep only well-formed entries.
  const rawOverrides = choice.pageSurfaceOverrides;
  if (rawOverrides && typeof rawOverrides === 'object' && !Array.isArray(rawOverrides)) {
    const clean = {};
    Object.keys(rawOverrides).forEach(function(path) {
      if (rawOverrides[path] === 'flat' || rawOverrides[path] === 'solid') { clean[path] = rawOverrides[path]; }
    });
    if (Object.keys(clean).length) { Session.set(PAGE_SURFACE_OVERRIDES, clean); }
  }

  // Per-field overrides last, so they win over the preset + accent base
  // (matches createDynamicTheme precedence). Set by PaletteFieldEditor via
  // setPaletteOverride; cleared on preset switch.
  const overrides = get(choice, 'paletteOverrides', null);
  if (overrides && typeof overrides === 'object') {
    Object.assign(theme.palette, overrides);
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
