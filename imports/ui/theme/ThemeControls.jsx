// imports/ui/theme/ThemeControls.jsx
//
// Shared theme-control surface: preset tiles (Limestone / Tron / Vaporwave),
// ambiance backgrounds + earth tones, font, mode, page mode, accent hue, and
// card surface. Extracted from ThemeDialog so BOTH the Theme & Palette
// dialog and the /theming page render the identical controls
// (harmonization). Drives the themePresets helpers, which apply live +
// persist (localStorage) — so this component owns no persistence itself.
//
// Prop: compact — denser layout for the dialog; roomier for the page column.

import React from 'react';
import {
  Box, Typography, ButtonBase, Chip, Divider, Select, MenuItem,
  FormControl, InputLabel, Stack, Tooltip
} from '@mui/material';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import {
  THEME_PRESETS, CHAKRA_FONT, MARTIAN_FONT,
  applyThemePreset, setThemeFont, setThemeBackground,
  setThemeMode, setPageMode, setCardSurface
} from '../themePresets.js';
import { getBackgroundLibrary, getBackgroundEntry, EARTH_TONES } from '../themeBackgrounds.js';
import { colorFromBackground } from './backgroundValue.js';
import { PAGE_MODE, CARD_SURFACE } from '/imports/lib/SessionKeys.js';
import { loadThemeChoice } from '/imports/lib/themePersistence.js';

const FONT_OPTIONS = [
  { label: 'Default (Helvetica)', value: '' },
  { label: 'Chakra Petch', value: CHAKRA_FONT },
  { label: 'Martian Mono', value: MARTIAN_FONT }
];

// The palette keys a tile previews, in swatch/hex order.
const SWATCH_KEYS = ['primaryColor', 'secondaryColor', 'successColor', 'infoColor', 'errorColor'];

// The palette keys a tile previews (swatch row + hex list).
const PREVIEW_KEYS = [
  'primaryColor', 'secondaryColor', 'successColor', 'infoColor', 'errorColor',
  'backgroundCanvasDark', 'canvasColor', 'paperColorDark', 'paperColor'
];

// Resolve a preset's preview palette. The ACTIVE tile overlays the LIVE
// settings palette (accent dial, Advanced per-field edits — Vaporwave
// included) so its swatches/hex track what's actually applied; inactive
// tiles show their declared palette.
export function previewPalette(preset, livePalette) {
  const base = Object.assign({}, preset.palette);
  if (livePalette) {
    PREVIEW_KEYS.forEach(function(k) {
      if (livePalette[k]) { base[k] = livePalette[k]; }
    });
  }
  return base;
}

function PresetSwatches({ palette }) {
  return (
    <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
      {SWATCH_KEYS.map(function(k) {
        const c = get(palette, k);
        if (!c) { return null; }
        return <Box key={k} sx={{ width: 20, height: 20, borderRadius: '3px', bgcolor: c, border: '1px solid rgba(255,255,255,0.15)' }} />;
      })}
    </Box>
  );
}

// Vertical hex readout — the tile's actual palette values, legible as color data.
function PresetHexList({ palette }) {
  const rows = [
    ['accent', get(palette, 'primaryColor')],
    ['second', get(palette, 'secondaryColor')],
    ['canvas', get(palette, 'backgroundCanvasDark') || get(palette, 'canvasColor')],
    ['paper', get(palette, 'paperColorDark') || get(palette, 'paperColor')]
  ].filter(function(r) { return !!r[1]; });
  return (
    <Box sx={{ mt: 1.5, display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 0.25, columnGap: 1 }}>
      {rows.map(function(row) {
        return (
          <React.Fragment key={row[0]}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 11, height: 11, borderRadius: '2px', bgcolor: row[1], border: '1px solid rgba(255,255,255,0.15)' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, letterSpacing: '0.06em' }}>{row[0]}</Typography>
            </Box>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.primary' }}>
              {String(row[1]).toLowerCase()}
            </Typography>
          </React.Fragment>
        );
      })}
    </Box>
  );
}

export function ThemeControls({ compact = false }) {
  // Session('theme') is the canonical app mode — CustomThemeProvider mirrors
  // it, so this control and the header Sun/Moon icon always agree.
  const mode = useTracker(function() { return Session.get('theme') || 'light'; }, []);
  const pageMode = useTracker(function() { return Session.get(PAGE_MODE); }, []);
  const cardSurface = useTracker(function() { return Session.get(CARD_SURFACE) || 'solid'; }, []);

  // Subscribe to the live MUI theme: its identity changes on every
  // pokeRefresh (preset apply, accent edit, background change), which is what
  // re-renders this component so the non-reactive reads below — persisted
  // choice, settings palette, tile highlight — stay current. Do not remove:
  // without a theme subscription a preset click that doesn't change
  // mode/pageMode/cardSurface leaves the tiles stale.
  useMuiTheme();

  const choice = loadThemeChoice() || {};
  const activePreset = choice.presetId || get(Meteor, 'settings.public.theme.defaultPreset', 'limestone');
  const activeFont = get(Meteor, 'settings.public.theme.typography.fontFamily', '') || '';
  const activeBg = get(Meteor, 'settings.public.theme.backgroundImagePath', '') || '';

  // The active tile previews the LIVE palette (accent + Advanced edits);
  // settings updates re-render this component via the theme subscription.
  const livePalette = get(Meteor, 'settings.public.theme.palette', null);

  // What PAGE TEXT "Auto" resolves to for the active background (curation).
  const activeEntry = getBackgroundEntry(activeBg);
  const autoResolvedInk = get(activeEntry, 'recommendedPageMode', '');

  return (
    <Box>
      {/* Primary preset tiles */}
      <Typography variant="overline" color="text.secondary">Preset</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mt: 1, mb: 3 }}>
        {THEME_PRESETS.map(function(preset) {
          const selected = preset.id === activePreset;
          return (
            <ButtonBase
              key={preset.id}
              id={'themePreset-' + preset.id}
              onClick={function() { applyThemePreset(preset.id); }}
              sx={{
                display: 'block', textAlign: 'left', p: 2, borderRadius: '8px',
                border: '2px solid', borderColor: selected ? 'primary.main' : 'divider',
                bgcolor: 'background.default',
                transition: 'border-color 0.15s ease, transform 0.15s ease',
                '&:hover': { transform: 'translateY(-2px)', borderColor: 'primary.light' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{preset.name}</Typography>
                {preset.advanced ? <Chip label="Advanced · 3-hue" size="small" color="warning" variant="outlined" /> : null}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, minHeight: 32 }}>
                {preset.description}
              </Typography>
              <PresetSwatches palette={previewPalette(preset, selected ? livePalette : null)} />
              <PresetHexList palette={previewPalette(preset, selected ? livePalette : null)} />
            </ButtonBase>
          );
        })}
      </Box>

      {/* Ambiance background — images row + earth-tone solids row */}
      <Typography variant="overline" color="text.secondary">Ambiance background</Typography>
      <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, mt: 1 }}>
        <ButtonBase
          onClick={function() { setThemeBackground(''); }}
          sx={{
            flex: '0 0 auto', width: 96, height: 60, borderRadius: '6px',
            border: '2px solid', borderColor: !activeBg ? 'primary.main' : 'divider',
            bgcolor: 'background.default', fontSize: 11, color: 'text.secondary'
          }}
        >
          None
        </ButtonBase>
        {getBackgroundLibrary().map(function(bg) {
          const selected = activeBg === bg.src;
          return (
            <Tooltip key={bg.src} title={bg.name}>
              <ButtonBase
                onClick={function() { setThemeBackground(bg.src); }}
                sx={{
                  flex: '0 0 auto', width: 96, height: 60, borderRadius: '6px', overflow: 'hidden',
                  border: '2px solid', borderColor: selected ? 'primary.main' : 'divider',
                  backgroundImage: 'url(' + bg.src + ')', backgroundSize: 'cover', backgroundPosition: 'center',
                  transition: 'transform 0.15s ease', '&:hover': { transform: 'scale(1.04)' }
                }}
              />
            </Tooltip>
          );
        })}
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, mt: 1, mb: 3 }}>
        {EARTH_TONES.map(function(tone) {
          const selected = activeBg === tone.value;
          return (
            <Tooltip key={tone.value} title={tone.name}>
              <ButtonBase
                id={'themeEarthTone-' + tone.name.toLowerCase()}
                onClick={function() { setThemeBackground(tone.value); }}
                sx={{
                  flex: '0 0 auto', width: 96, height: 36, borderRadius: '6px',
                  border: '2px solid', borderColor: selected ? 'primary.main' : 'divider',
                  bgcolor: colorFromBackground(tone.value)
                }}
              />
            </Tooltip>
          );
        })}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Basic theme controls — two columns: MODE + PAGE TEXT left,
          FONT + CARD SURFACE right. (Accent hue lives in Advanced.) */}
      <Typography variant="overline" color="text.secondary">Basic theme controls</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 3, mt: 1 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="overline" color="text.secondary">Mode</Typography>
            <Box sx={{ mt: 1 }}>
              <ToggleButtonGroup
                id="themeModeToggle"
                exclusive size="small" value={mode}
                onChange={function(event, next) { if (next) { setThemeMode(next); } }}
              >
                <ToggleButton id="themeMode-light" value="light">
                  <LightModeIcon sx={{ fontSize: 16, mr: 0.75 }} /> Light
                </ToggleButton>
                <ToggleButton id="themeMode-dark" value="dark">
                  <DarkModeIcon sx={{ fontSize: 16, mr: 0.75 }} /> Dark
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          {activeBg ? (
            <Box>
              <Typography variant="overline" color="text.secondary">Page text</Typography>
              <Box sx={{ mt: 1 }}>
                <Tooltip title="Ink for text sitting on the ambiance background (cards and chrome keep the app mode)">
                  <ToggleButtonGroup
                    id="themePageModeToggle"
                    exclusive size="small" value={pageMode || 'auto'}
                    onChange={function(event, next) {
                      if (next) { setPageMode(next === 'auto' ? null : next); }
                    }}
                  >
                    <ToggleButton id="themePageText-auto" value="auto">
                      <AutoAwesomeIcon sx={{ fontSize: 16, mr: 0.75 }} /> Auto
                    </ToggleButton>
                    <ToggleButton id="themePageText-light" value="light">
                      <LightModeIcon sx={{ fontSize: 16, mr: 0.75 }} /> Light
                    </ToggleButton>
                    <ToggleButton id="themePageText-dark" value="dark">
                      <DarkModeIcon sx={{ fontSize: 16, mr: 0.75 }} /> Dark
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Tooltip>
                {!pageMode && autoResolvedInk ? (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Auto → {autoResolvedInk === 'light' ? 'dark text (bright background)' : 'light text (dark background)'}
                  </Typography>
                ) : null}
              </Box>
            </Box>
          ) : null}
        </Stack>

        <Stack spacing={2}>
          <Box>
            <Typography variant="overline" color="text.secondary">Font</Typography>
            <FormControl fullWidth size="small" sx={{ mt: 1 }}>
              <InputLabel id="themeFontLabel">Font</InputLabel>
              <Select
                labelId="themeFontLabel"
                id="themeFontSelect"
                label="Font"
                value={activeFont}
                onChange={function(e) { setThemeFont(e.target.value); }}
              >
                {FONT_OPTIONS.map(function(opt) {
                  return (
                    <MenuItem key={opt.value} value={opt.value} sx={{ fontFamily: opt.value || 'inherit' }}>
                      {opt.label}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>

          <Box>
            <Typography variant="overline" color="text.secondary">Card surface</Typography>
            <Box sx={{ mt: 1 }}>
              <ToggleButtonGroup
                id="themeCardSurfaceGroup"
                exclusive size="small" value={cardSurface}
                onChange={function(event, next) { if (next) { setCardSurface(next); } }}
              >
                <ToggleButton id="themeCardSurface-solid" value="solid">Solid</ToggleButton>
                <ToggleButton id="themeCardSurface-glass" value="glass">Glass</ToggleButton>
                <ToggleButton id="themeCardSurface-flat" value="flat">Flat</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

export default ThemeControls;
