// imports/ui/guards/AmbianceZone.jsx
//
// Router-level zone wrapper (composes like AuthGuard/PatientGuard — see
// App.jsx StyledMainRouter). On routes declaring enableAmbiance or
// enableFluidInterface it: (1) assembles the composition object from the
// active background's curation record + persisted axes, (2) provides it via
// AmbianceContext + --ambiance-* CSS vars, and (3) wraps children in a
// page-mode theme carrying MuiCard/MuiPaper overrides for the active card
// surface — so even raw MUI cards render legibly over ambiance
// (correctness by construction; discipline not required). With neither flag
// it renders children unchanged. Spec:
// docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md

import React, { useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme, createTheme } from '@mui/material/styles';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';

import { resolveComposition } from '../theme/ambianceComposition.js';
import { buildSurfaceStyles } from '../theme/surfaceStyles.js';
import { buildPageModeTheme } from '../theme/pageModeTheme.js';
import { getBackgroundEntry } from '../themeBackgrounds.js';
import { AmbianceContext } from '../theme/AmbianceContext.js';
import { registerRouteSurfaceDefault } from '../themePresets.js';
import { readableAccent } from '../theme/contrastInk.js';
import { PAGE_MODE, CARD_SURFACE, PAGE_SURFACE_OVERRIDES } from '/imports/lib/SessionKeys.js';

export function AmbianceZone(props) {
  const ambiance = !!props.ambiance;
  const fluid = !!props.fluid || ambiance;   // enableAmbiance implies fluid
  const defaultSurface = props.defaultSurface;   // route-declared baseline ('flat' etc.)
  const appTheme = useTheme();
  const location = useLocation();

  // Let the Ctrl+Shift+K toggle know this route's baseline, so it flips
  // flat-by-default routes to solid cards (and back) instead of no-op'ing.
  useEffect(function() {
    registerRouteSurfaceDefault(location.pathname, defaultSurface);
  }, [location.pathname, defaultSurface]);

  // Reactive axes (Session); background is a PLAIN read — the provider
  // rebuild re-renders us (never useTracker a bare settings read).
  const pageMode = useTracker(function() { return Session.get(PAGE_MODE); }, []);
  const cardSurface = useTracker(function() { return Session.get(CARD_SURFACE); }, []);
  const surfaceOverride = useTracker(function() {
    const overrides = Session.get(PAGE_SURFACE_OVERRIDES) || {};
    return overrides[location.pathname];
  }, [location.pathname]);

  const activeBg = get(Meteor, 'settings.public.theme.backgroundImagePath', '');

  const composition = resolveComposition({
    background: ambiance ? activeBg : '',   // fluid-only routes paint their own backdrop
    entry: ambiance ? getBackgroundEntry(activeBg) : null,
    pageMode: pageMode,
    cardSurface: cardSurface,
    surfaceOverride: surfaceOverride,
    surfaceDefault: defaultSurface
  });

  const zoneTheme = useMemo(function() {
    // Cards follow the APP mode: the forced page-mode ink (the AUTO
    // adjust-to-background behavior) applies only to the 'flat' surface,
    // where content sits directly on the ambiance background. Solid and
    // glass cards keep app-mode paper + ink — otherwise app-mode surfaces
    // meet page-mode text and the card interiors read inverted/washed out.
    let base = composition.cardSurface === 'flat'
      ? (buildPageModeTheme(appTheme, composition.pageMode) || appTheme)
      : appTheme;

    // Accent legibility (ambiance pages only): invert an accent's brightness
    // — hue preserved — when it matches the zone's surface polarity, so e.g.
    // Tron cyan reads as deep teal on a light canvas but stays bright cyan on
    // dark. Self-styled consoles that derive CSS vars from palette.primary
    // (DirectoryConsole) pick this up automatically.
    const zoneMode = base.palette.mode;
    const primaryMain = get(base, 'palette.primary.main', '');
    const secondaryMain = get(base, 'palette.secondary.main', '');
    const readablePrimary = readableAccent(primaryMain, zoneMode);
    const readableSecondary = readableAccent(secondaryMain, zoneMode);
    if (readablePrimary !== primaryMain || readableSecondary !== secondaryMain) {
      base = createTheme(base, {
        palette: {
          primary: base.palette.augmentColor({ color: { main: readablePrimary } }),
          secondary: base.palette.augmentColor({ color: { main: readableSecondary } })
        }
      });
    }

    if (composition.cardSurface === 'solid') { return base; }
    const surface = buildSurfaceStyles({
      surface: composition.cardSurface,
      paperColor: get(base, 'palette.background.paper', '#ffffff'),
      dividerColor: get(base, 'palette.divider', 'rgba(128,128,128,0.3)')
    });
    return createTheme(base, {
      components: {
        MuiCard: { styleOverrides: { root: surface.root } },
        MuiPaper: { styleOverrides: { root: surface.root } }
      }
    });
  }, [appTheme, composition.pageMode, composition.cardSurface]);

  // Early return AFTER all hooks (React hooks-order rule); fluid is a
  // static route capability, but keep the hook order unconditional anyway.
  if (!fluid) { return props.children; }

  return (
    <AmbianceContext.Provider value={composition}>
      <ThemeProvider theme={zoneTheme}>
        <div style={{
          height: '100%',
          '--ambiance-focus': composition.focus,
          '--ambiance-scrim': String(composition.scrimStrength)
        }}>
          {props.children}
        </div>
      </ThemeProvider>
    </AmbianceContext.Provider>
  );
}

export default AmbianceZone;
