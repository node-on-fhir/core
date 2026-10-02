// imports/ui/theme/AmbianceQuickControls.jsx
//
// The quick-change ambiance axes: curated earth-tone solid backgrounds,
// PAGE TEXT ink, and CARD SURFACE. Extracted from ThemeControls.jsx so the
// pre-curated ThemeDialog (and later the Theming Studio) can mount just this
// section without the preset/mode/font duplication. Ambiance IMAGES stay out
// of the dialog by design (2026-09-04 option 2b — too fickle for a
// quick-change surface); earth tones are curated solids, so they qualify.
// Element IDs are a test contract: tests/nightwatch/honeycomb/theme/ambianceControls.js.

import React from 'react';
import { Box, Typography, ButtonBase, Tooltip } from '@mui/material';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import { setThemeBackground, setPageMode, setCardSurface } from '../themePresets.js';
import { EARTH_TONES, getBackgroundEntry } from '../themeBackgrounds.js';
import { colorFromBackground } from './backgroundValue.js';
import { PAGE_MODE, CARD_SURFACE } from '/imports/lib/SessionKeys.js';

export function AmbianceQuickControls() {
  const pageMode = useTracker(function() { return Session.get(PAGE_MODE); }, []);
  const cardSurface = useTracker(function() { return Session.get(CARD_SURFACE) || 'solid'; }, []);

  // Plain render read — the host dialog re-renders on every pokeRefresh via
  // its own MUI-theme subscription, which keeps this current.
  const activeBg = get(Meteor, 'settings.public.theme.backgroundImagePath', '') || '';

  // What PAGE TEXT "Auto" resolves to for the active background (curation).
  const activeEntry = getBackgroundEntry(activeBg);
  const autoResolvedInk = get(activeEntry, 'recommendedPageMode', '');

  return (
    <Box>
      {/* Earth-tone solid backgrounds (None clears the axis) */}
      <Typography variant="overline" color="text.secondary">Ambiance</Typography>
      <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, mt: 1, mb: 2 }}>
        <ButtonBase
          id="themeEarthTone-none"
          onClick={function() { setThemeBackground(''); }}
          sx={{
            flex: '0 0 auto', width: 72, height: 36, borderRadius: '6px',
            border: '2px solid', borderColor: !activeBg ? 'primary.main' : 'divider',
            bgcolor: 'background.default', fontSize: 11, color: 'text.secondary'
          }}
        >
          None
        </ButtonBase>
        {EARTH_TONES.map(function(tone) {
          const selected = activeBg === tone.value;
          return (
            <Tooltip key={tone.value} title={tone.name}>
              <ButtonBase
                id={'themeEarthTone-' + tone.name.toLowerCase()}
                onClick={function() { setThemeBackground(tone.value); }}
                sx={{
                  flex: '0 0 auto', width: 72, height: 36, borderRadius: '6px',
                  border: '2px solid', borderColor: selected ? 'primary.main' : 'divider',
                  bgcolor: colorFromBackground(tone.value)
                }}
              />
            </Tooltip>
          );
        })}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
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
      </Box>
    </Box>
  );
}

export default AmbianceQuickControls;
