// imports/ui/ThemeDialog.jsx
//
// The theme palette dialog — the PERSONAL layer of the Theming Studio model
// (design handoff option 2b, revised 2026-09-04): PRE-CURATED options only —
// clinic themes and presets, plus mode · accent hue · font. Ambiance images
// and raw values live in /theming (too fickle for a quick-change surface).
// Every control applies LIVE via the themePresets helpers (write settings +
// themeRefreshRequest) and persists via themePersistence. Open state rides
// THEME_DIALOG_OPEN (Ctrl/Cmd+Shift+T), mounted once at App root.

import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Button,
  IconButton, ButtonBase, Divider, Select, MenuItem, FormControl, InputLabel,
  Slider, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import { useTheme } from './CustomThemeProvider.jsx';
import { THEME_DIALOG_OPEN } from '/imports/lib/SessionKeys.js';
import {
  THEME_PRESETS, CHAKRA_FONT, MARTIAN_FONT,
  applyThemePreset, setAccentHue, setThemeFont, setThemeBackground,
  hexToHsl, hslToHex, cssColorToHex
} from './themePresets.js';
import { loadThemeChoice, clearThemeChoice, loadClinicThemes } from '/imports/lib/themePersistence.js';
import { ThemeMiniature } from './theming/ThemeMiniature.jsx';
import { settingsToDraft } from './theming/themeDraft.js';

const FONT_OPTIONS = [
  { label: 'Default (Helvetica)', value: '' },
  { label: 'Chakra Petch', value: CHAKRA_FONT },
  { label: 'Martian Mono', value: MARTIAN_FONT }
];

export function ThemeDialog() {
  const open = useTracker(function() { return !!Session.get(THEME_DIALOG_OPEN); }, []);
  const mode = useTracker(function() { return Session.get('theme') || 'light'; }, []);
  // Re-render the live strip whenever a control pokes the refresh flag.
  useTracker(function() { return Session.get('themeRefreshRequest'); }, []);
  const navigate = useNavigate();
  const themeCtx = useTheme() || {};

  const choice = loadThemeChoice() || {};
  const activePreset = choice.presetId || get(Meteor, 'settings.public.theme.defaultPreset', 'limestone');
  const activeFont = get(Meteor, 'settings.public.theme.typography.fontFamily', '') || '';
  const clinicThemes = loadClinicThemes().slice(0, 8);
  const liveDraft = settingsToDraft(get(Meteor, 'settings.public.theme', {}));
  const accentHsl = hexToHsl(cssColorToHex(liveDraft.primary, '#9e9e9e')) || { h: 0, s: 0, l: 50 };

  function handleClose() {
    Session.set(THEME_DIALOG_OPEN, false);
  }

  function handleMode(nextMode) {
    let resolved = nextMode;
    if (nextMode === 'auto') {
      resolved = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    if (themeCtx.setTheme) { themeCtx.setTheme(resolved); }
    else { Session.set('theme', resolved); }
  }

  function handleReset() {
    clearThemeChoice();
    applyThemePreset(get(Meteor, 'settings.public.theme.defaultPreset', 'limestone'));
  }

  if (!open) { return null; }

  return (
    <Dialog
      id="themeDialog"
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { bgcolor: 'background.paper', backgroundImage: 'none', maxWidth: 720 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
          <Typography variant="h6" component="span">Theme &amp; palette</Typography>
          <Typography variant="caption" color="text.secondary">⌘⇧T</Typography>
        </Box>
        <IconButton onClick={handleClose} aria-label="Close" size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* 1. Live strip */}
        <Box sx={{ mb: 2 }}>
          <ThemeMiniature draft={liveDraft} mode={mode} variant="strip" />
        </Box>

        {/* 2. Clinic themes — the primary pre-curated surface */}
        <Typography variant="overline" color="text.secondary">Clinic themes</Typography>
        {clinicThemes.length ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mt: 0.5, mb: 2 }}>
            {clinicThemes.map(function(entry) {
              const d = entry.draft || {};
              return (
                <ButtonBase
                  key={entry.id}
                  id={'themeDialog-clinicTheme-' + entry.id}
                  onClick={function() {
                    // Apply the saved theme's base preset with its accent + font.
                    applyThemePreset(d.base || activePreset, {
                      accentHueOverride: d.primary || null,
                      fontOverride: d.font || null
                    });
                    if (d.ambiance !== undefined) { setThemeBackground(d.ambiance || ''); }
                  }}
                  sx={{ display: 'block', textAlign: 'left', p: 1.5, borderRadius: '6px', border: '1px solid', borderColor: 'divider', '&:hover': { borderColor: 'primary.light' } }}
                >
                  <Box sx={{ display: 'flex', gap: 0.25, mb: 0.75 }}>
                    {[d.primary, d.secondary, d.paperDark, d.bgDark].map(function(c, i) {
                      return <Box key={i} sx={{ flex: 1, height: 8, borderRadius: '2px', bgcolor: c || 'divider' }} />;
                    })}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, display: 'block' }}>{entry.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{d.base || 'custom'}</Typography>
                </ButtonBase>
              );
            })}
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, mb: 2 }}>
            No clinic themes saved yet — open the full editor to create and save one.
          </Typography>
        )}

        {/* 3. Presets — curated starting points, apply immediately */}
        <Typography variant="overline" color="text.secondary">Presets</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 1.5, mt: 0.5, mb: 2 }}>
          {THEME_PRESETS.map(function(preset) {
            const selected = preset.id === activePreset;
            const swatches = [
              get(preset, 'palette.primaryColor'),
              get(preset, 'palette.secondaryColor'),
              get(preset, 'palette.paperColorDark', '#18181a'),
              get(preset, 'palette.backgroundCanvasDark', '#121212')
            ];
            return (
              <ButtonBase
                key={preset.id}
                id={'themePreset-' + preset.id}
                onClick={function() { applyThemePreset(preset.id); }}
                sx={{
                  display: 'block', textAlign: 'left', p: 1.5, borderRadius: '6px',
                  border: '1px solid', borderColor: selected ? 'primary.main' : 'divider',
                  '&:hover': { borderColor: 'primary.light' }
                }}
              >
                <Box sx={{ display: 'flex', gap: 0.25, mb: 0.75 }}>
                  {swatches.map(function(c, i) {
                    return <Box key={i} sx={{ flex: 1, height: 8, borderRadius: '2px', bgcolor: c || 'divider' }} />;
                  })}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, display: 'block' }}>{preset.name}</Typography>
                <Typography sx={{ fontFamily: preset.fontFamily || 'inherit', fontSize: 13, color: 'text.secondary' }}>
                  Aa Bb Cc 0123
                </Typography>
              </ButtonBase>
            );
          })}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* 4. Mode + font | accent hue + saturation */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">Mode</Typography>
              <ToggleButtonGroup
                id="themeDialog-mode"
                size="small" exclusive fullWidth
                value={mode}
                onChange={function(e, v) { if (v) { handleMode(v); } }}
              >
                <ToggleButton value="light">Light</ToggleButton>
                <ToggleButton value="dark">Dark</ToggleButton>
                <ToggleButton value="auto">Auto</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel id="themeFontLabel">Font</InputLabel>
              <Select
                labelId="themeFontLabel"
                id="themeFontSelect"
                label="Font"
                value={activeFont}
                onChange={function(e) { setThemeFont(e.target.value); }}
              >
                {FONT_OPTIONS.map(function(opt) {
                  return <MenuItem key={opt.value} value={opt.value} sx={{ fontFamily: opt.value || 'inherit' }}>{opt.label}</MenuItem>;
                })}
              </Select>
            </FormControl>
          </Box>

          <Box>
            <Typography variant="overline" color="text.secondary">Accent hue</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: '4px', bgcolor: cssColorToHex(liveDraft.primary, '#9e9e9e'), border: '1px solid', borderColor: 'divider' }} />
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{cssColorToHex(liveDraft.primary, '#9e9e9e')}</Typography>
            </Box>
            <Slider
              id="themeDialog-hue"
              size="small" min={0} max={360}
              value={Math.round(accentHsl.h)}
              onChange={function(e, value) { setAccentHue(hslToHex(value, accentHsl.s, accentHsl.l)); }}
              sx={{
                '& .MuiSlider-rail': { opacity: 1, background: 'linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' },
                '& .MuiSlider-track': { display: 'none' }
              }}
            />
            <Slider
              id="themeDialog-saturation"
              size="small" min={0} max={100}
              value={Math.round(accentHsl.s)}
              onChange={function(e, value) { setAccentHue(hslToHex(accentHsl.h, value, accentHsl.l)); }}
              sx={{
                '& .MuiSlider-rail': { opacity: 1, background: 'linear-gradient(90deg, #9e9e9e, ' + hslToHex(accentHsl.h, 100, 50) + ')' },
                '& .MuiSlider-track': { display: 'none' }
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Desaturate → Limestone · saturate → Tron
            </Typography>
          </Box>
        </Box>

      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
        <Button startIcon={<OpenInFullIcon />} onClick={function() { handleClose(); navigate('/theming'); }}>
          Open full editor
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button id="themeDialog-reset" onClick={handleReset}>Reset to clinic</Button>
          <Button id="themeDialog-done" variant="outlined" color="primary" onClick={handleClose}>Done</Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

export default ThemeDialog;
