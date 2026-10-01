// imports/ui/theme/PaletteFieldEditor.jsx
//
// Shared per-field palette editor: accordion-grouped TextField color inputs
// (Main Theme / App Bar / Surfaces / Alerts) on the left, with ONE
// field-bound Wheel + ShadeSlider on the right. Clicking a field's palette
// icon binds the wheel to that field; the wheel defaults to the Accent
// (primaryColor) — this is where the old Basic-controls ACCENT HUE wheel
// lives now. Extracted from ThemingPage's inline ColorField so BOTH the
// Theme & Palette dialog (live adapter) and /theming drive the same fields.
//
// Value-source-agnostic: the caller supplies getValue(fieldKey) / setValue(
// fieldKey, value) where fieldKey is a BARE palette key ('appBarColorDark'),
// not a dotted path — the dialog writes Meteor.settings.public.theme.palette,
// /theming does the same (both adapters are live). One exception: edits to
// primaryColor route through setAccentHue() so accent-tracking presets
// (Tron/Vaporwave app-bar text) keep their behavior.
//
// PALETTE_FIELD_GROUPS is the ONE canonical key list. It targets the keys
// CustomThemeProvider.createDynamicTheme reads FIRST — surfaces use
// backgroundCanvas* / paperColor*Dark / cardColor*, NOT the legacy
// backgroundPageColor* (lower precedence → silently shadowed by presets).

import React from 'react';
import {
  Box, Grid, Typography, TextField, InputAdornment, IconButton,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Wheel from '@uiw/react-color-wheel';
import ShadeSlider from '@uiw/react-color-shade-slider';
import { hsvaToHex, hexToHsva } from '@uiw/color-convert';
import { setAccentHue } from '../themePresets.js';

// Canonical, provider-aligned key set. Do NOT add backgroundPageColor* or the
// unsuffixed canvasColor/paperColor/cardColor here — they lose to these keys
// in createDynamicTheme, so edits would be shadowed by any active preset.
export const PALETTE_FIELD_GROUPS = [
  {
    title: 'Main Theme',
    fields: [
      { key: 'primaryColor', label: 'Accent (Primary)', help: 'Main brand color — desaturate → Limestone, saturate → Tron' },
      { key: 'secondaryColor', label: 'Secondary', help: 'Supporting accent' }
    ]
  },
  {
    title: 'App Bar (Header / Footer)',
    fields: [
      { key: 'appBarColor', label: 'App Bar', help: 'Light mode (defaults to primary)' },
      { key: 'appBarColorDark', label: 'App Bar (Dark)', help: 'Dark mode' },
      { key: 'appBarTextColor', label: 'App Bar Text', help: 'Light mode text' },
      { key: 'appBarTextColorDark', label: 'App Bar Text (Dark)', help: 'Dark mode text' }
    ]
  },
  {
    title: 'Surfaces',
    fields: [
      { key: 'backgroundCanvas', label: 'Canvas', help: 'Light page background' },
      { key: 'backgroundCanvasDark', label: 'Canvas (Dark)', help: 'Dark page background' },
      { key: 'paperColorLight', label: 'Paper', help: 'Light cards / surfaces' },
      { key: 'paperColorDark', label: 'Paper (Dark)', help: 'Dark cards / surfaces' },
      { key: 'cardColorLight', label: 'Card', help: 'Light MuiCard override' },
      { key: 'cardColorDark', label: 'Card (Dark)', help: 'Dark MuiCard override' }
    ]
  },
  {
    title: 'Alerts',
    fields: [
      { key: 'successColor', label: 'Success', help: '' },
      { key: 'infoColor', label: 'Info', help: '' },
      { key: 'warningColor', label: 'Warning', help: '' },
      { key: 'errorColor', label: 'Error', help: '' }
    ]
  }
];

const FALLBACK_HSVA = { h: 214, s: 43, v: 90, a: 1 };

function hsvaFromHex(hex) {
  try {
    if (hex) { return Object.assign({ a: 1 }, hexToHsva(hex)); }
  } catch (e) { /* not a parseable hex — fall through */ }
  return FALLBACK_HSVA;
}

export function PaletteFieldEditor({ getValue, setValue, fields = PALETTE_FIELD_GROUPS }) {
  // The wheel's bound field — Accent by default (the old ACCENT HUE wheel).
  const [activeKey, setActiveKey] = React.useState('primaryColor');
  const [hsva, setHsva] = React.useState(function() { return hsvaFromHex(getValue('primaryColor')); });

  // Local draft of text values so typing doesn't push a theme refresh per
  // keystroke; the caller's setValue (which may refresh/persist) fires on blur.
  const [drafts, setDrafts] = React.useState({});

  const flatFields = fields.reduce(function(acc, group) { return acc.concat(group.fields); }, []);
  const activeField = flatFields.find(function(f) { return f.key === activeKey; }) || flatFields[0] || {};

  function readValue(key) {
    if (key in drafts) { return drafts[key]; }
    return getValue(key) || '';
  }

  function writeValue(key, value) {
    // Accent edits ride setAccentHue so accent-tracking presets stay wired.
    if (key === 'primaryColor') { setAccentHue(value); }
    else { setValue(key, value); }
  }

  function commit(key, value) {
    writeValue(key, value);
    setDrafts(function(prev) {
      const next = Object.assign({}, prev);
      delete next[key];
      return next;
    });
    if (key === activeKey) { setHsva(hsvaFromHex(value)); }
  }

  function bindWheel(key) {
    setActiveKey(key);
    setHsva(hsvaFromHex(getValue(key)));
  }

  function handleWheelChange(nextHsva) {
    const merged = Object.assign({}, hsva, nextHsva);
    setHsva(merged);
    writeValue(activeKey, hsvaToHex(merged));
  }

  const liveHex = hsvaToHex(hsva);

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 220px' }, gap: 3, alignItems: 'start' }}>
      {/* LEFT — accordion field groups */}
      <Box>
        {fields.map(function(group, gi) {
          return (
            <Accordion key={group.title} defaultExpanded={gi === 0} disableGutters elevation={0}
              sx={{ border: '1px solid', borderColor: 'divider', '&:not(:last-of-type)': { borderBottom: 0 }, '&::before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} id={'palette-group-' + group.title.replace(/\W+/g, '-').toLowerCase()}>
                <Typography variant="subtitle2">{group.title}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {group.fields.map(function(field) {
                    const active = field.key === activeKey;
                    return (
                      <Grid item xs={12} sm={6} key={field.key}>
                        <TextField
                          fullWidth
                          size="small"
                          variant="outlined"
                          label={field.label}
                          helperText={field.help}
                          focused={active || undefined}
                          value={readValue(field.key)}
                          onChange={function(e) {
                            const v = e.target.value;
                            setDrafts(function(prev) { return Object.assign({}, prev, { [field.key]: v }); });
                          }}
                          onBlur={function(e) { commit(field.key, e.target.value); }}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Box sx={{ width: 18, height: 18, mr: 0.5, borderRadius: '3px', border: '1px solid', borderColor: 'divider', bgcolor: readValue(field.key) || 'transparent' }} />
                                <IconButton
                                  edge="end" size="small"
                                  aria-label={'Edit ' + field.label + ' with the color wheel'}
                                  color={active ? 'primary' : 'default'}
                                  onClick={function() { bindWheel(field.key); }}
                                >
                                  <PaletteIcon fontSize="small" />
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                        />
                      </Grid>
                    );
                  })}
                </Grid>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>

      {/* RIGHT — the ONE color wheel, bound to the selected field */}
      <Box sx={{ position: { md: 'sticky' }, top: { md: 8 }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ alignSelf: 'flex-start' }}>Color wheel</Typography>
        <Wheel
          color={hsva}
          onChange={function(color) { handleWheelChange(color.hsva); }}
          width={180}
          height={180}
        />
        <ShadeSlider
          hsva={hsva}
          style={{ width: '180px' }}
          onChange={function(shade) { handleWheelChange(shade); }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, alignSelf: 'stretch' }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '4px', bgcolor: liveHex, border: '1px solid', borderColor: 'divider' }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }} noWrap>
              {activeField.label || activeKey}
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{liveHex}</Typography>
          </Box>
        </Box>
        {activeKey === 'primaryColor' ? (
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'flex-start' }}>
            Desaturate → Limestone · saturate → Tron
          </Typography>
        ) : null}
        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'flex-start' }}>
          Click a field's palette icon to edit it here.
        </Typography>
      </Box>
    </Box>
  );
}

export default PaletteFieldEditor;
