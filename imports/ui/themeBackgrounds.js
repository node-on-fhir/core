// imports/ui/themeBackgrounds.js
//
// The ambiance-background library backing the ThemeDialog carousel. This is a
// SEPARATE axis from the palette/font presets — a background layers over
// whichever preset is active, applied via the theme's existing
// backgroundImagePath key. Entries are curation records (focus, scrim, ink) —
// see docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md.
//
// The list is settings-driven: settings.public.theme.backgroundLibrary = [{name,
// src}] overrides the default set below. That's the seam for a future
// orchestration extension to supply its own asset directory / links without a
// code change. Images ported from the private symptomatic:theming pack into
// public/backgrounds/ambiance/.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { makeColorBackground } from './theme/backgroundValue.js';

const BASE = '/backgrounds/ambiance';

// Default library (code fallback). Curated spa / zen / medical / gradient set.
// Entries are CURATION RECORDS: beyond name/src, optional focus (where the
// image's neutral space is: left|center|right), recommendedPageMode (which
// ink family survives it), and scrimStrength (0-1 content-column scrim).
// Seed values below were drafted with ambianceAnalysis.analyzeAmbianceImage()
// and eyeballed; refine with the Tuning HUD (Phase 3). Omitted fields fall
// back to: focus 'center', pageMode unset (app mode stands), scrim 0.55.
export const DEFAULT_BACKGROUND_LIBRARY = [
  { name: 'Zen Rocks',   src: BASE + '/Zen-Rocks.jpg',          focus: 'right',  recommendedPageMode: 'light', scrimStrength: 0.5 },
  { name: 'Zen Garden',  src: BASE + '/Zen.jpg',                focus: 'center', recommendedPageMode: 'light', scrimStrength: 0.5 },
  { name: 'Large Zen',   src: BASE + '/LargeZenRocks.jpg',      focus: 'right',  recommendedPageMode: 'light', scrimStrength: 0.55 },
  { name: 'Bamboo',      src: BASE + '/BambooIllustration.jpg', focus: 'left',   recommendedPageMode: 'light', scrimStrength: 0.45 },
  { name: 'Yoga Ocean',  src: BASE + '/Yoga-Ocean.jpg',         focus: 'left',   recommendedPageMode: 'dark',  scrimStrength: 0.6 },
  { name: 'Spa Candles', src: BASE + '/Candles.jpg',            focus: 'center', recommendedPageMode: 'dark',  scrimStrength: 0.55 },
  { name: 'Spa Beds',    src: BASE + '/SpaBeds.jpg',            focus: 'center', recommendedPageMode: 'light', scrimStrength: 0.55 },
  { name: 'Bath Petals', src: BASE + '/BathPetals.jpg',         focus: 'center', recommendedPageMode: 'light', scrimStrength: 0.55 },
  { name: 'Massage',     src: BASE + '/Massage.jpg',            focus: 'center', recommendedPageMode: 'dark',  scrimStrength: 0.55 },
  { name: 'Med Bay',     src: BASE + '/MedBay.jpg',             focus: 'center', recommendedPageMode: 'dark',  scrimStrength: 0.6 },
  { name: 'Plasmid',     src: BASE + '/PlasmidBlue.jpg',        focus: 'center', recommendedPageMode: 'dark',  scrimStrength: 0.55 },
  { name: 'Gradient',    src: BASE + '/Gradient.jpg',           focus: 'center', recommendedPageMode: 'light', scrimStrength: 0.4 }
];

// Resolve the active library: operator/extension override, else the default.
export function getBackgroundLibrary() {
  const configured = get(Meteor, 'settings.public.theme.backgroundLibrary', null);
  if (Array.isArray(configured) && configured.length) {
    return configured.filter(function(entry) { return entry && entry.src; });
  }
  return DEFAULT_BACKGROUND_LIBRARY;
}

// Solid earth-tone backgrounds — row 2 of the dialog's Ambiance section.
// Values ride the SAME persistence axis as images ('color:'-prefixed).
export const EARTH_TONES = [
  { name: 'Clay',       value: makeColorBackground('#a67b5b') },
  { name: 'Sand',       value: makeColorBackground('#d9c7a7') },
  { name: 'Terracotta', value: makeColorBackground('#b0674b') },
  { name: 'Moss',       value: makeColorBackground('#6b7d5a') },
  { name: 'Sage',       value: makeColorBackground('#a3b18a') },
  { name: 'Stone',      value: makeColorBackground('#8d8578') },
  { name: 'Ochre',      value: makeColorBackground('#c49a3c') },
  { name: 'Espresso',   value: makeColorBackground('#4a3728') }
];

// Look up the active IMAGE background's curation record. Solid 'color:'
// entries and unknown/operator paths return null — callers fall back to
// defaults (focus 'center', scrim 0.55), which is correct for solids.
export function getBackgroundEntry(activeValue) {
  if (!activeValue) { return null; }
  return getBackgroundLibrary().find(function(entry) { return entry.src === activeValue; }) || null;
}
