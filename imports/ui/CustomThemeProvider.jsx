// /imports/ui/CustomThemeProvider.jsx
import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import * as ReactRouterDOM from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import StyledCard from './components/StyledCard.jsx';
import StyledContainer from './components/StyledContainer.jsx';
import AmbianceInk from './theme/AmbianceInk.jsx';
import { inkForColor } from './theme/contrastInk.js';
import { saveThemeChoice } from '/imports/lib/themePersistence.js';

//===============================================================================================================
// Theming


const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);
Meteor.useTheme = useTheme;
Meteor.StyledCard = StyledCard;           // surface-aware Card (solid|glass|flat)
Meteor.StyledContainer = StyledContainer; // focus-aware content column
Meteor.AmbianceInk = AmbianceInk;         // page-text ink for on-background content

// Export React Router hooks via Meteor object for use in packages
Meteor.useLocation = ReactRouterDOM.useLocation;
Meteor.useNavigate = ReactRouterDOM.useNavigate;
Meteor.useParams = ReactRouterDOM.useParams;

// Read a theme color from Meteor.settings, sanitizing legacy values.
// Settings files historically carried '!important' flags (e.g.
// "cardColor": "#ffffff !important") which poisoned the MUI palette and
// made tokens like 'background.paper' render wrong in dark mode — the root
// cause of the 2026-06-10 isDark "Golden Rule" workaround. Sanitizing at
// ingestion makes CustomThemeProvider the single palette authority.
// Exported so App.jsx can use it for the <meta name="theme-color"> tag.
export function getThemeSetting(path, defaultValue){
  const rawValue = get(Meteor, path, defaultValue);
  if (typeof rawValue === 'string') {
    const sanitized = rawValue.replace(/\s*!important\s*/gi, '').trim();
    return sanitized || defaultValue;
  }
  return rawValue;
}

// PALETTE slots must only ever receive colors MUI's decomposeColor() can
// parse (#hex / rgb[a] / hsl[a] / color()). A settings file may legitimately
// carry a CSS gradient for a SURFACE (e.g. appBarColor:
// "linear-gradient(...)") — but if that string reaches palette.*.main, any
// MUI component that derives variant styles by mapping palette entries
// through lighten()/darken()/alpha() throws at render ("MUI: Unsupported
// linear-gradient(...) color", live-reported crashing the light-mode
// toggle). This extracts the FIRST color stop from a gradient as the solid
// palette stand-in (keeps the hue family), falling back to `fallback`;
// plain colors pass through untouched. The RAW gradient string should still
// be used for CSS `background` in component styleOverrides — surfaces can
// have gradients, palette math cannot.
export function toPaletteColor(value, fallback){
  if (typeof value !== 'string' || value.indexOf('gradient(') === -1) {
    return value;
  }
  const firstStop = value.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/);
  return (firstStop && firstStop[0]) || fallback;
}

// Build the MUI typography block from theme settings. The app-wide DEFAULT is
// the Roboto/Helvetica stack (unchanged); a theme/preset may set
// settings.public.theme.typography.fontFamily (body/neutral) and .displayFontFamily
// (headings + UI). When a display font is chosen, it drives h1–h6, subtitles,
// and buttons — the "headings + UI, neutral body" mapping — so a squared display
// face like Chakra Petch elevates the chrome without hurting long-text legibility.
const DEFAULT_FONT_STACK = '"Roboto", "Helvetica", "Arial", sans-serif';
export function buildTypography(){
  const bodyFont = getThemeSetting('settings.public.theme.typography.fontFamily', DEFAULT_FONT_STACK) || DEFAULT_FONT_STACK;
  const displayFont = getThemeSetting('settings.public.theme.typography.displayFontFamily', bodyFont) || bodyFont;
  const typography = { fontFamily: bodyFont };
  if (displayFont !== bodyFont) {
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle1', 'subtitle2', 'button'].forEach(function(variant){
      typography[variant] = { fontFamily: displayFont };
    });
  }
  return typography;
}

// this Provider components enables the useTheme() hook in child components
export const CustomThemeProvider = ({ children }) => {
  // Session('theme') is the CANONICAL mode. Boot seeds it from the persisted
  // choice (applyThemeChoiceAtBoot) before this mounts; header toggle, the
  // Theme & Palette MODE control, and presets all write it, and the autorun
  // below mirrors it into React state. Fall back to settings when unset.
  const [theme, setTheme] = useState(function() {
    // A pre-mount Session value (persisted choice restored at boot) wins over
    // the settings-file default.
    const sessionTheme = Meteor.isClient ? Session.get('theme') : '';
    if (sessionTheme === 'light' || sessionTheme === 'dark') { return sessionTheme; }
    const settingsMode = get(Meteor, 'settings.public.theme.darkMode', false);
    const paletteMode = get(Meteor, 'settings.public.theme.palette.mode', '');
    return settingsMode || paletteMode === 'dark' ? 'dark' : 'light';
  });
  const [themeRefreshCounter, setThemeRefreshCounter] = useState(0);

  // Live mirror of the current screen theme + the theme to restore after printing.
  // Paper is white, so we always PRINT in light mode regardless of the on-screen mode.
  const liveThemeRef = useRef(theme);
  liveThemeRef.current = theme;
  const restoreThemeRef = useRef(null);

  // Create themes dynamically based on current Meteor.settings
  const createDynamicTheme = (mode) => {
    const isDark = mode === 'dark';

    // Get core color settings - let MUI handle the dark/light variants
    const primaryColor = getThemeSetting("settings.public.theme.palette.primaryColor", "rgb(158, 158, 158)");
    const secondaryColor = getThemeSetting("settings.public.theme.palette.secondaryColor", "#fdb813");
    const errorColor = getThemeSetting("settings.public.theme.palette.errorColor", "rgb(128,20,60)");

    // Status colors — opt-in: only placed in the palette when a settings file
    // provides them, so MUI defaults are untouched otherwise.
    const successColor = getThemeSetting("settings.public.theme.palette.successColor", "");
    const infoColor = getThemeSetting("settings.public.theme.palette.infoColor", "");
    const warningColor = getThemeSetting("settings.public.theme.palette.warningColor", "");

    // Get AppBar colors with dark mode support
    // Light mode: defaults to primary color if not specified
    const appBarColorLight = getThemeSetting("settings.public.theme.palette.appBarColor", primaryColor);
    const appBarColorDark = getThemeSetting("settings.public.theme.palette.appBarColorDark", appBarColorLight);

    // App-bar TEXT: explicit settings win; otherwise auto-contrast from the
    // bar's own brightness (the ambiance AUTO idea applied to one color) —
    // a bright accent bar gets dark ink, a near-black bar gets light ink.
    // Unparseable bars (low-alpha gradients etc.) keep the legacy defaults.
    const autoInk = function(barColor, fallback) {
      const ink = inkForColor(barColor);
      return ink ? (ink === 'dark' ? 'rgba(0, 0, 0, 0.87)' : '#ffffff') : fallback;
    };
    const appBarTextColorLight = getThemeSetting("settings.public.theme.palette.appBarTextColor", '')
      || autoInk(appBarColorLight, '#ffffff');
    const appBarTextColorDark = getThemeSetting("settings.public.theme.palette.appBarTextColorDark", '')
      || autoInk(appBarColorDark, appBarTextColorLight);

    // Select the appropriate colors based on current mode.
    // appBarColor may be a CSS gradient (surface value, used for the
    // AppBar's `background` below); appBarPaletteColor is its
    // decomposable-solid stand-in for palette.appbar.main (see
    // toPaletteColor — palette math crashes on gradients).
    const appBarColor = isDark ? appBarColorDark : appBarColorLight;
    const appBarTextColor = isDark ? appBarTextColorDark : appBarTextColorLight;
    const appBarPaletteColor = toPaletteColor(appBarColor, primaryColor);
    const appBarIsGradient = appBarColor !== appBarPaletteColor;

    // When settings are dark-oriented (darkMode: true), unsuffixed generic
    // values (canvasColor/paperColor/cardColor) are dark values — don't use
    // them for the opposite mode when the user toggles
    const settingsAreDarkOriented = get(Meteor, 'settings.public.theme.darkMode', false)
      || get(Meteor, 'settings.public.theme.palette.mode', '') === 'dark';

    // Get background colors with dark mode support.
    // canvasColor is the legacy settings key (used by configs/settings.*.json)
    // and belongs to whichever mode the settings file was authored for.
    const canvasColorGeneric = getThemeSetting("settings.public.theme.palette.canvasColor", "");
    const canvasFromGeneric = (isDark === settingsAreDarkOriented) ? canvasColorGeneric : '';
    const backgroundCanvas = getThemeSetting("settings.public.theme.palette.backgroundCanvas", "");
    const backgroundCanvasDark = getThemeSetting("settings.public.theme.palette.backgroundCanvasDark", backgroundCanvas);
    const backgroundPageColorLight = getThemeSetting("settings.public.theme.palette.backgroundPageColor", "");
    const backgroundPageColorDark = getThemeSetting("settings.public.theme.palette.backgroundPageColorDark", backgroundPageColorLight);
    const backgroundPageColor = isDark
      ? (backgroundCanvasDark || backgroundPageColorDark || canvasFromGeneric)
      : (backgroundCanvas || backgroundPageColorLight || canvasFromGeneric);

    const paperColorGeneric = getThemeSetting("settings.public.theme.palette.paperColor", "");
    const paperColorDarkExplicit = getThemeSetting("settings.public.theme.palette.paperColorDark", "");
    const paperColorLightExplicit = getThemeSetting("settings.public.theme.palette.paperColorLight", "");

    let paperColorFromSettings;
    if (isDark) {
      paperColorFromSettings = paperColorDarkExplicit || (settingsAreDarkOriented ? paperColorGeneric : '');
    } else {
      paperColorFromSettings = paperColorLightExplicit || (settingsAreDarkOriented ? '' : paperColorGeneric);
    }

    const cardColorGeneric = getThemeSetting("settings.public.theme.palette.cardColor", "");
    const cardColorDarkExplicit = getThemeSetting("settings.public.theme.palette.cardColorDark", "");
    const cardColorLightExplicit = getThemeSetting("settings.public.theme.palette.cardColorLight", "");

    let cardColorFromSettings;
    if (isDark) {
      cardColorFromSettings = cardColorDarkExplicit || (settingsAreDarkOriented ? cardColorGeneric : '');
    } else {
      cardColorFromSettings = cardColorLightExplicit || (settingsAreDarkOriented ? '' : cardColorGeneric);
    }

    // Resolve final surface colors BEFORE building the theme config so the
    // component styleOverrides below share one source of truth with the
    // palette tokens (background.default / background.paper)
    const backgroundDefault = backgroundPageColor || (isDark ? '#121212' : '#f6f6f6');
    const backgroundPaper = paperColorFromSettings || (isDark ? '#1e1e1e' : '#ffffff');
    const cardBackground = cardColorFromSettings || backgroundPaper;
    const insetBackground = isDark ? '#2a2a2a' : '#f5f5f5';
    const textPrimary = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';

    // Theming Studio dimensions — all opt-in; absent keys reproduce today's
    // rendering exactly (MUI defaults: radius 4, fontSize 14, spacing 8).
    const borderRadius = get(Meteor, 'settings.public.theme.shape.borderRadius', 4);
    const baseSize = get(Meteor, 'settings.public.theme.typography.baseSize', 14);
    const density = get(Meteor, 'settings.public.theme.density', 'standard');
    const spacingUnit = density === 'compact' ? 6 : (density === 'relaxed' ? 10 : 8);

    const themeConfig = {
      palette: {
        mode: mode,
        primary: {
          main: toPaletteColor(primaryColor, 'rgb(158, 158, 158)')
        },
        secondary: {
          main: toPaletteColor(secondaryColor, '#fdb813')
        },
        error: {
          main: toPaletteColor(errorColor, 'rgb(128,20,60)')
        },
        // Custom appbar palette — always a decomposable solid (gradient
        // settings values are represented by their first color stop here;
        // the real gradient renders via the MuiAppBar override below)
        ...(successColor ? { success: { main: toPaletteColor(successColor, '#4caf50') } } : {}),
        ...(infoColor ? { info: { main: toPaletteColor(infoColor, '#2196f3') } } : {}),
        ...(warningColor ? { warning: { main: toPaletteColor(warningColor, '#ff9800') } } : {}),
        appbar: {
          main: appBarPaletteColor,
          contrastText: appBarTextColor
        }
      },
      components: {
        ...(density === 'compact' ? {
          MuiButton: { defaultProps: { size: 'small' } },
          MuiTextField: { defaultProps: { size: 'small' } }
        } : {}),
        MuiAppBar: {
          styleOverrides: {
            root: {
              // `background` (not backgroundColor) so gradient settings
              // values actually render — backgroundColor silently ignores
              // gradients, which also hid this class of bad palette input.
              backgroundColor: appBarPaletteColor,
              ...(appBarIsGradient ? { background: appBarColor } : {}),
              color: appBarTextColor
            },
            colorPrimary: {
              backgroundColor: appBarPaletteColor,
              ...(appBarIsGradient ? { background: appBarColor } : {}),
              color: appBarTextColor
            }
          }
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              backgroundColor: backgroundPaper,
              color: textPrimary
            }
          }
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundColor: cardBackground,
              color: textPrimary
            }
          }
        },
        MuiTableHead: {
          styleOverrides: {
            root: {
              backgroundColor: insetBackground
            }
          }
        },
        MuiTableCell: {
          styleOverrides: {
            head: {
              backgroundColor: insetBackground,
              color: textPrimary,
              fontWeight: 600
            },
            body: {
              color: textPrimary
            }
          }
        },
        MuiTableRow: {
          styleOverrides: {
            head: {
              backgroundColor: insetBackground
            }
          }
        }
      },
      shape: { borderRadius: borderRadius },
      spacing: spacingUnit,
      typography: Object.assign(buildTypography(), { fontSize: baseSize })
    };

    // Palette background tokens share the surface values computed above —
    // sanitization happened at ingestion (getThemeSetting), so no ad-hoc
    // '!important' stripping is needed here anymore
    themeConfig.palette.background = {
      default: backgroundDefault,
      paper: backgroundPaper
    };

    return createTheme(themeConfig);
  };

  // Create theme based on current mode and settings
  const muiTheme = useMemo(() => {
    return createDynamicTheme(theme);
  }, [theme, themeRefreshCounter]);

  const toggleTheme = () => {
    // Write the canonical Session key (the autorun mirrors it into state)
    // and persist the choice so the mode survives reloads.
    const next = liveThemeRef.current === 'light' ? 'dark' : 'light';
    Session.set('theme', next);
    saveThemeChoice({ mode: next });
  };

  // Function to force theme refresh when settings change
  const refreshTheme = () => {
    setThemeRefreshCounter(prev => prev + 1);
  };

  // Two-way sync with Session 'theme' — Session is the cross-package mode bus
  // (ThemeDialog, UserMenu, themePresets all read/write it), while this state
  // drives the actual MUI palette. Equality guards on both directions prevent
  // a feedback loop.
  useEffect(() => {
    if (Meteor.isClient) {
      Session.set('theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    if (!Meteor.isClient) { return; }
    const handle = Tracker.autorun(() => {
      const sessionTheme = Session.get('theme');
      if ((sessionTheme === 'light' || sessionTheme === 'dark') && sessionTheme !== liveThemeRef.current) {
        setTheme(sessionTheme);
      }
    });
    return () => handle.stop();
  }, []);

  // Listen for theme refresh requests via Session. The key is a monotonic
  // counter (see themePresets requestThemeRefresh) — every poke is a real
  // reactive change, so no reset write-back is needed (the old boolean
  // protocol could wedge: a stuck `true` made later set(true) calls silent
  // no-ops, and the theme only rebuilt on mode toggles).
  useEffect(() => {
    if(Meteor.isClient){
      const handle = Tracker.autorun(() => {
        const refreshRequest = Session.get('themeRefreshRequest');
        if (refreshRequest) {
          refreshTheme();
        }
      });

      return () => handle.stop();
    }
  }, []);

  // Mirror the canonical Session('theme') into React state, and make sure the
  // key is populated on first mount (so every Session reader agrees with the
  // provider). The print swap below deliberately bypasses Session — it's a
  // temporary override restored on afterprint, not a mode change.
  useEffect(() => {
    if (!Meteor.isClient) { return; }
    const current = Session.get('theme');
    if (current !== liveThemeRef.current) {
      Session.set('theme', liveThemeRef.current);
    }
    const handle = Tracker.autorun(() => {
      const sessionMode = Session.get('theme');
      if ((sessionMode === 'light' || sessionMode === 'dark') && sessionMode !== liveThemeRef.current) {
        setTheme(sessionMode);
      }
    });
    return () => handle.stop();
  }, []);

  // Always print in the light theme — screens may be dark, but paper is white.
  // Swap to light on beforeprint and restore the user's mode on afterprint.
  // (Paired with the global @media print stylesheet in client/main.css as a
  // reliable fallback for any browser that snapshots before the React re-render.)
  useEffect(() => {
    if (!Meteor.isClient) return;

    const handleBeforePrint = () => {
      restoreThemeRef.current = liveThemeRef.current;
      if (liveThemeRef.current !== 'light') {
        setTheme('light');
      }
    };
    const handleAfterPrint = () => {
      if (restoreThemeRef.current && restoreThemeRef.current !== 'light') {
        setTheme(restoreThemeRef.current);
      }
      restoreThemeRef.current = null;
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, refreshTheme }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
