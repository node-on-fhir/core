// imports/ui/theming/themeDraft.js
//
// Pure draft ⇄ settings converters for the Theming Studio. The draft is the
// flat working model from the design handoff; the settings shape is exactly
// what CustomThemeProvider reads from Meteor.settings.public.theme.
// ZERO imports — loadable by bare `node --test`.
//
// draftToSettings writes BOTH the modern background keys (backgroundCanvas*)
// and the legacy ones (backgroundPageColor*) because the provider's precedence
// chain prefers backgroundCanvasDark — writing both guarantees the draft wins
// regardless of what a legacy settings file carried.

export const DENSITY_FACTORS = { compact: 0.7, standard: 1, relaxed: 1.3 };

export const DEFAULT_DRAFT = {
  name: 'Untitled theme',
  base: null,
  mode: 'light',
  primary: '#9e9e9e',
  secondary: '#fdb813',
  success: '#4caf50',
  info: '#2196f3',
  warning: '#ff9800',
  error: '#80143c',
  bgLight: '#f6f6f6',
  bgDark: '#121212',
  paperLight: '#ffffff',
  paperDark: '#1e1e1e',
  appBarLight: '',            // '' → provider defaults to primary
  appBarDark: '',
  appBarTextLight: '#ffffff',
  appBarTextDark: '#ffffff',
  font: '',
  baseFont: 14,
  radius: 4,
  density: 'standard',
  ambiance: '',
  video: '',
  nivo: 'red_grey'
};

function sanitize(value, fallback) {
  if (typeof value === 'string') {
    const cleaned = value.replace(/\s*!important\s*/gi, '').trim();
    return cleaned || fallback;
  }
  return value === undefined || value === null ? fallback : value;
}

// '#rrggbb' or '#rgb' → 'rgba(r, g, b, 0.88)'; non-hex passes through
// unchanged (already-rgba legacy values keep their form).
function hexToRgba88(value) {
  if (typeof value !== 'string' || !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) { return value; }
  let hex = value.slice(1);
  if (hex.length === 3) {
    hex = hex.split('').map(function(c) { return c + c; }).join('');
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return 'rgba(' + r + ', ' + g + ', ' + b + ', 0.88)';
}

export function settingsToDraft(themeSettings) {
  const t = themeSettings || {};
  const p = t.palette || {};
  const ty = t.typography || {};
  const darkOriented = !!t.darkMode || p.mode === 'dark';
  const d = Object.assign({}, DEFAULT_DRAFT);

  d.name = sanitize(t.name, d.name);
  d.base = t.basePreset || null;
  d.mode = darkOriented ? 'dark' : 'light';

  d.primary = sanitize(p.primaryColor, d.primary);
  d.secondary = sanitize(p.secondaryColor, d.secondary);
  d.success = sanitize(p.successColor, d.success);
  d.info = sanitize(p.infoColor, d.info);
  d.warning = sanitize(p.warningColor, d.warning);
  d.error = sanitize(p.errorColor, d.error);

  const canvasGeneric = sanitize(p.canvasColor, '');
  d.bgLight = sanitize(p.backgroundCanvas, '') || sanitize(p.backgroundPageColor, '')
    || (!darkOriented ? canvasGeneric : '') || d.bgLight;
  d.bgDark = sanitize(p.backgroundCanvasDark, '') || sanitize(p.backgroundPageColorDark, '')
    || (darkOriented ? canvasGeneric : '') || d.bgDark;

  const paperGeneric = sanitize(p.paperColor, '');
  d.paperLight = sanitize(p.paperColorLight, '') || (!darkOriented ? paperGeneric : '') || d.paperLight;
  d.paperDark = sanitize(p.paperColorDark, '') || (darkOriented ? paperGeneric : '') || d.paperDark;

  d.appBarLight = sanitize(p.appBarColor, '') || d.appBarLight;
  d.appBarDark = sanitize(p.appBarColorDark, '') || d.appBarDark;
  d.appBarTextLight = sanitize(p.appBarTextColor, '') || d.appBarTextLight;
  d.appBarTextDark = sanitize(p.appBarTextColorDark, '') || sanitize(p.appBarTextColor, '') || d.appBarTextDark;

  d.font = sanitize(ty.fontFamily, '') || '';
  d.baseFont = typeof ty.baseSize === 'number' ? ty.baseSize : d.baseFont;
  d.radius = (t.shape && typeof t.shape.borderRadius === 'number') ? t.shape.borderRadius : d.radius;
  d.density = DENSITY_FACTORS[t.density] ? t.density : d.density;
  d.ambiance = sanitize(t.backgroundImagePath, '') || '';
  d.video = t.showVideoBackground ? (sanitize(t.defaultVideo, '') || '/VideoBackgrounds/GrayWaves.mp4') : '';
  d.nivo = sanitize(p.nivoTheme, d.nivo);
  return d;
}

export function draftToSettings(draft) {
  const d = Object.assign({}, DEFAULT_DRAFT, draft);
  const hasAmbiance = !!d.ambiance;
  return {
    name: d.name,
    basePreset: d.base,
    darkMode: d.mode === 'dark',
    density: d.density,
    shape: { borderRadius: d.radius },
    backgroundImagePath: d.ambiance || '',
    showVideoBackground: !!d.video,
    defaultVideo: d.video || '',
    palette: {
      mode: d.mode,
      primaryColor: d.primary,
      secondaryColor: d.secondary,
      successColor: d.success,
      infoColor: d.info,
      warningColor: d.warning,
      errorColor: d.error,
      backgroundPageColor: d.bgLight,
      backgroundCanvas: d.bgLight,
      backgroundPageColorDark: d.bgDark,
      backgroundCanvasDark: d.bgDark,
      paperColorLight: hasAmbiance ? hexToRgba88(d.paperLight) : d.paperLight,
      paperColorDark: hasAmbiance ? hexToRgba88(d.paperDark) : d.paperDark,
      appBarColor: d.appBarLight || '',
      appBarColorDark: d.appBarDark || '',
      appBarTextColor: d.appBarTextLight,
      appBarTextColorDark: d.appBarTextDark,
      nivoTheme: d.nivo
    },
    typography: {
      fontFamily: d.font || '',
      displayFontFamily: d.font || '',
      baseSize: d.baseFont
    }
  };
}
