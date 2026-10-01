// imports/ui/theme/AmbianceInk.jsx
//
// Ink wrapper for content that sits DIRECTLY on the ambiance background
// (section headers, toolbars — anything outside a card). AmbianceZone gives
// solid/glass pages the plain app theme so cards follow the app mode; this
// wrapper re-applies the zone's resolved page-text mode (the PAGE TEXT
// control / per-background AUTO curation) to just its children, so
// on-background text stays legible against the backdrop regardless of the
// card surface. No-op passthrough outside a zone, when no page mode is
// resolved, or when it already matches the app mode.
// Spec: docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md

import React, { useMemo } from 'react';
import { ThemeProvider, useTheme } from '@mui/material/styles';
import { Meteor } from 'meteor/meteor';

import { useAmbiance } from './AmbianceContext.js';
import { buildPageModeTheme } from './pageModeTheme.js';

export function AmbianceInk(props) {
  const appTheme = useTheme();
  const composition = useAmbiance();
  const pageMode = composition ? composition.pageMode : null;

  const inkTheme = useMemo(function() {
    return buildPageModeTheme(appTheme, pageMode) || appTheme;
  }, [appTheme, pageMode]);

  if (inkTheme === appTheme) { return props.children; }

  return (
    <ThemeProvider theme={inkTheme}>
      {props.children}
    </ThemeProvider>
  );
}

// Packages can't import app paths — expose alongside Meteor.StyledCard etc.
Meteor.AmbianceInk = AmbianceInk;

export default AmbianceInk;
