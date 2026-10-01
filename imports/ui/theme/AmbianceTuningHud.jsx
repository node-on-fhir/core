// imports/ui/theme/AmbianceTuningHud.jsx
//
// Dev-tool overlay (Cmd/Ctrl+Shift+E) for authoring ambiance curation
// records against the live page: tune focus / scrim / ink / surface /
// accent, then Copy as JSON to paste into themeBackgrounds.js or
// settings.public.theme.backgroundLibrary. Session Inspector posture: no
// PHI, no persistence of its own (clipboard out only), hidden behind the
// hotkey. Spec: docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md

import React from 'react';
import {
  Paper, Typography, Slider, Select, MenuItem, TextField, Button, Stack, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';

import { getBackgroundEntry } from '../themeBackgrounds.js';
import { setPageMode, setCardSurface, setAccentHue } from '../themePresets.js';
import { AMBIANCE_HUD_OPEN, PAGE_MODE, CARD_SURFACE } from '/imports/lib/SessionKeys.js';

export function AmbianceTuningHud() {
  const open = useTracker(function() { return !!Session.get(AMBIANCE_HUD_OPEN); }, []);
  const pageMode = useTracker(function() { return Session.get(PAGE_MODE) || ''; }, []);
  const cardSurface = useTracker(function() { return Session.get(CARD_SURFACE) || 'solid'; }, []);

  const activeBg = get(Meteor, 'settings.public.theme.backgroundImagePath', '');
  const entry = getBackgroundEntry(activeBg);

  const [focus, setFocus] = React.useState(get(entry, 'focus', 'center'));
  const [scrim, setScrim] = React.useState(get(entry, 'scrimStrength', 0.55));
  const [accent, setAccent] = React.useState(get(Meteor, 'settings.public.theme.palette.primaryColor', ''));
  const [copied, setCopied] = React.useState(false);

  // Re-seed the draft when the background changes while open.
  React.useEffect(function() {
    setFocus(get(entry, 'focus', 'center'));
    setScrim(get(entry, 'scrimStrength', 0.55));
    setCopied(false);
  }, [activeBg]);

  if (!open) { return null; }

  function curationRecord() {
    return {
      name: get(entry, 'name', '(unnamed)'),
      src: activeBg,
      focus: focus,
      recommendedPageMode: pageMode || get(entry, 'recommendedPageMode', undefined),
      scrimStrength: Math.round(scrim * 100) / 100
    };
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(curationRecord(), null, 2));
      setCopied(true);
    } catch (error) {
      console.warn('[AmbianceTuningHud] Clipboard write failed:', error && error.message);
      setCopied(false);
    }
  }

  return (
    <Paper elevation={8} sx={{
      position: 'fixed', right: 16, bottom: 80, width: 300, p: 2, zIndex: 1400,
      bgcolor: 'background.paper'
    }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="overline">Ambiance tuning</Typography>
        <IconButton size="small" id="ambianceHudClose" onClick={function() { Session.set(AMBIANCE_HUD_OPEN, false); }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {activeBg ? (get(entry, 'name') || activeBg) : 'No ambiance background active'}
      </Typography>

      <Typography variant="caption">Scrim strength — {Math.round(scrim * 100)}%</Typography>
      <Slider id="ambianceHudScrim" size="small" min={0} max={1} step={0.05} value={scrim}
        onChange={function(e, v) { setScrim(v); }} sx={{ mb: 1 }} />

      <Stack spacing={1} sx={{ mb: 1 }}>
        <Select id="ambianceHudFocus" size="small" value={focus}
          onChange={function(e) { setFocus(e.target.value); }}>
          <MenuItem value="left">Focus: left</MenuItem>
          <MenuItem value="center">Focus: center</MenuItem>
          <MenuItem value="right">Focus: right</MenuItem>
        </Select>
        <Select id="ambianceHudPageMode" size="small" value={pageMode} displayEmpty
          onChange={function(e) { setPageMode(e.target.value || null); }}>
          <MenuItem value="">Ink: auto</MenuItem>
          <MenuItem value="light">Ink: light</MenuItem>
          <MenuItem value="dark">Ink: dark</MenuItem>
        </Select>
        <Select id="ambianceHudSurface" size="small" value={cardSurface}
          onChange={function(e) { setCardSurface(e.target.value); }}>
          <MenuItem value="solid">Surface: solid</MenuItem>
          <MenuItem value="glass">Surface: glass</MenuItem>
          <MenuItem value="flat">Surface: flat</MenuItem>
        </Select>
        <TextField id="ambianceHudAccent" size="small" label="Accent hex" value={accent}
          onChange={function(e) { setAccent(e.target.value); }}
          onBlur={function() { if (/^#[0-9a-fA-F]{6}$/.test(accent)) { setAccentHue(accent); } }} />
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Ink/surface/accent apply live. Focus + scrim land in the copied
        record — paste into the background library to take effect.
      </Typography>
      <Button id="ambianceHudCopy" fullWidth size="small" variant="contained"
        startIcon={<ContentCopyIcon />} onClick={handleCopy} disabled={!activeBg}>
        {copied ? 'Copied' : 'Copy as JSON'}
      </Button>
    </Paper>
  );
}

export default AmbianceTuningHud;
