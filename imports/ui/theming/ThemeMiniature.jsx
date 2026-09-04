// imports/ui/theming/ThemeMiniature.jsx
//
// The patient-chart miniature from the Theming Studio handoff — the ONE part
// of the design where explicit draft colors are prescriptive (it renders the
// theme UNDER EDIT via a nested ThemeProvider, never the live app theme).
// Static demo data only: no collections, no Session, no subscriptions.
//
// variant='full'  : app bar → patient strip → Encounters / Conditions /
//                   Biomarkers cards → bottom nav   (studio preview pane)
// variant='strip' : app bar → patient strip → Encounters + Conditions
//                   (dialog live strip)

import React, { useMemo } from 'react';
import { Box, Typography, Chip, Alert, Button } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { cssColorToHex, mixHex, nivoAuto, NIVO_SCHEME_SWATCHES } from '../themeAlgorithms.js';
import { DENSITY_FACTORS } from './themeDraft.js';

const DEMO_PATIENT = {
  name: 'Camila Maria Lopez',
  id: 'FHRMMSS76R7GV49',
  birthDate: 'Sep 12, 1987',
  birthSex: 'Female',
  phone: '+1 469-469-4321'
};

const DEMO_ENCOUNTERS = [
  ['2026-08-12', 'Office visit', 'Dr. Osei', 'Completed', '20 min'],
  ['2026-06-03', 'Telehealth', 'Dr. Osei', 'Completed', '15 min'],
  ['2026-03-19', 'Imaging', 'Radiology', 'Completed', '45 min'],
  ['2025-12-08', 'Office visit', 'Dr. Tran', 'Completed', '30 min'],
  ['2025-09-22', 'Lab draw', 'Phlebotomy', 'Completed', '10 min']
];

const DEMO_CONDITIONS = [
  { label: 'Asthma', color: 'primary' },
  { label: 'Seasonal allergies', color: 'secondary' },
  { label: 'Myopia', color: 'info' }
];

const DEMO_BIOMARKERS = [62, 84, 45, 71, 55];

// Build the nested MUI theme from the draft for one mode. Exported for reuse.
export function buildMiniatureTheme(draft, mode) {
  const isDark = mode === 'dark';
  const paper = cssColorToHex(isDark ? draft.paperDark : draft.paperLight, isDark ? '#1e1e1e' : '#ffffff');
  const page = cssColorToHex(isDark ? draft.bgDark : draft.bgLight, isDark ? '#121212' : '#f6f6f6');
  const baseFont = (draft.baseFont || 14) * 0.82;   // handoff: miniature base = baseSize * .82
  return createTheme({
    palette: {
      mode: mode,
      primary: { main: cssColorToHex(draft.primary, '#9e9e9e') },
      secondary: { main: cssColorToHex(draft.secondary, '#fdb813') },
      success: { main: cssColorToHex(draft.success, '#4caf50') },
      info: { main: cssColorToHex(draft.info, '#2196f3') },
      warning: { main: cssColorToHex(draft.warning, '#ff9800') },
      error: { main: cssColorToHex(draft.error, '#80143c') },
      background: { default: page, paper: paper }
    },
    shape: { borderRadius: typeof draft.radius === 'number' ? draft.radius : 4 },
    typography: { fontSize: baseFont, fontFamily: draft.font || undefined }
  });
}

// rgba() form of the draft paper at 88% for ambiance mode.
function ambiancePaper(draft, mode) {
  const hex = cssColorToHex(mode === 'dark' ? draft.paperDark : draft.paperLight,
    mode === 'dark' ? '#1e1e1e' : '#ffffff');
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 'rgba(' + r + ', ' + g + ', ' + b + ', 0.88)';
}

export function ThemeMiniature({ draft, mode, variant }) {
  const isDark = mode === 'dark';
  const density = DENSITY_FACTORS[draft.density] || 1;
  const pad = function(base) { return Math.round(base * density * 10) / 10; };
  const theme = useMemo(function() { return buildMiniatureTheme(draft, mode); }, [draft, mode]);

  const appBarColor = cssColorToHex((isDark ? draft.appBarDark : draft.appBarLight) || draft.primary, '#9e9e9e');
  const appBarText = cssColorToHex(isDark ? draft.appBarTextDark : draft.appBarTextLight, '#ffffff');
  const paperColor = draft.ambiance
    ? ambiancePaper(draft, mode)
    : cssColorToHex(isDark ? draft.paperDark : draft.paperLight, isDark ? '#1e1e1e' : '#ffffff');
  // Handoff: patient strip = mix(appBar, paper, .5) dark / mix(appBar, #fff, .12) light
  const stripColor = isDark
    ? mixHex(appBarColor, cssColorToHex(draft.paperDark, '#1e1e1e'), 0.5)
    : mixHex(appBarColor, '#ffffff', 0.12);
  const nivoColors = draft.nivo === 'auto'
    ? nivoAuto(cssColorToHex(draft.primary, '#9e9e9e'))
    : (NIVO_SCHEME_SWATCHES[draft.nivo] || NIVO_SCHEME_SWATCHES.red_grey);
  const radius = typeof draft.radius === 'number' ? draft.radius : 4;

  function MiniCard({ title, chip, children }) {
    return (
      <Box sx={{ bgcolor: paperColor, borderRadius: radius + 'px', p: pad(1.25), boxShadow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: pad(0.75) }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.85em' }}>{title}</Typography>
          {chip}
        </Box>
        {children}
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box
        className={'themeMiniature themeMiniature-' + mode}
        sx={{
          flex: 1, minWidth: 0, overflow: 'hidden',
          borderRadius: '10px', border: '1px solid', borderColor: 'divider',
          bgcolor: cssColorToHex(isDark ? draft.bgDark : draft.bgLight, isDark ? '#121212' : '#f6f6f6'),
          ...(draft.ambiance ? {
            backgroundImage: 'url(' + draft.ambiance + ')',
            backgroundSize: 'cover', backgroundPosition: 'center'
          } : {}),
          fontFamily: draft.font || 'inherit',
          fontSize: ((draft.baseFont || 14) * 0.82) + 'px',
          color: isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)'
        }}
      >
        {/* App bar */}
        <Box sx={{ background: appBarColor, color: appBarText, px: pad(1.25), py: pad(0.6), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9em', color: 'inherit' }}>Lattice RIS</Typography>
          <Typography sx={{ fontSize: '0.65em', letterSpacing: '0.08em', color: 'inherit', opacity: 0.85 }}>
            CLEAR PATIENT&nbsp;&nbsp;demo&nbsp;&nbsp;LOGOUT
          </Typography>
        </Box>

        {/* Patient strip */}
        <Box sx={{ background: stripColor, color: appBarText, px: pad(1.25), py: pad(0.5), display: 'flex', gap: pad(1.5), alignItems: 'baseline', flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.8em', color: 'inherit' }}>{DEMO_PATIENT.name}</Typography>
          {[['ID', DEMO_PATIENT.id], ['Birth Date', DEMO_PATIENT.birthDate], ['Birth Sex', DEMO_PATIENT.birthSex], ['Phone', DEMO_PATIENT.phone]].map(function(pair) {
            return (
              <Box key={pair[0]} sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography sx={{ fontSize: '0.5em', opacity: 0.7, color: 'inherit', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{pair[0]}</Typography>
                <Typography sx={{ fontSize: '0.65em', color: 'inherit' }}>{pair[1]}</Typography>
              </Box>
            );
          })}
        </Box>

        {/* Body */}
        <Box sx={{ p: pad(1.25), display: 'flex', flexDirection: 'column', gap: pad(1) }}>
          <MiniCard
            title="Encounters"
            chip={<Chip label={DEMO_ENCOUNTERS.length} size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: '0.65em' }} />}
          >
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7em', '& td, & th': { textAlign: 'left', py: pad(0.3), pr: pad(0.5), borderBottom: '1px solid', borderColor: 'divider' } }}>
              <thead>
                <tr>
                  {['Date', 'Type', 'Provider', 'Status', 'Duration'].map(function(h) {
                    return <Box component="th" key={h} sx={{ opacity: 0.6, fontWeight: 600 }}>{h}</Box>;
                  })}
                </tr>
              </thead>
              <tbody>
                {DEMO_ENCOUNTERS.map(function(row) {
                  return (
                    <tr key={row[0]}>
                      {row.map(function(cell, i) { return <td key={i}>{cell}</td>; })}
                    </tr>
                  );
                })}
              </tbody>
            </Box>
            <Typography sx={{ fontSize: '0.6em', opacity: 0.6, mt: pad(0.5), textAlign: 'right' }}>1–5 of 24</Typography>
          </MiniCard>

          <MiniCard title="Conditions">
            <Box sx={{ display: 'flex', gap: pad(0.5), flexWrap: 'wrap', mb: pad(0.75) }}>
              {DEMO_CONDITIONS.map(function(c) {
                return <Chip key={c.label} label={c.label} size="small" color={c.color} variant="outlined" sx={{ height: 20, fontSize: '0.65em' }} />;
              })}
            </Box>
            <Alert severity="success" sx={{ py: 0, mb: pad(0.5), fontSize: '0.7em' }}>Care plan up to date</Alert>
            <Alert severity="warning" sx={{ py: 0, fontSize: '0.7em' }}>Flu vaccine due</Alert>
          </MiniCard>

          {variant !== 'strip' ? (
            <MiniCard title="Biomarkers">
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: pad(0.75), height: 56, mb: pad(0.75) }}>
                {DEMO_BIOMARKERS.map(function(value, i) {
                  return <Box key={i} sx={{ flex: 1, height: value + '%', bgcolor: nivoColors[i % nivoColors.length], borderRadius: Math.min(radius, 4) + 'px' }} />;
                })}
              </Box>
              <Box sx={{ display: 'flex', gap: pad(0.5) }}>
                <Button variant="contained" size="small" sx={{ fontSize: '0.6em', py: 0 }}>Order</Button>
                <Button variant="outlined" size="small" sx={{ fontSize: '0.6em', py: 0 }}>Trend</Button>
                <Button variant="text" size="small" sx={{ fontSize: '0.6em', py: 0 }}>Export</Button>
              </Box>
            </MiniCard>
          ) : null}
        </Box>

        {/* Bottom nav (full only) */}
        {variant !== 'strip' ? (
          <Box sx={{ display: 'flex', borderTop: '1px solid', borderColor: 'divider', bgcolor: paperColor }}>
            {['Chart', 'Meds', 'Labs', 'Imaging'].map(function(tab, i) {
              return (
                <Box key={tab} sx={{
                  flex: 1, textAlign: 'center', py: pad(0.5), fontSize: '0.65em',
                  ...(i === 0 ? { bgcolor: 'primary.main', color: 'primary.contrastText' } : { opacity: 0.7 })
                }}>
                  {tab}
                </Box>
              );
            })}
          </Box>
        ) : null}
      </Box>
    </ThemeProvider>
  );
}

export default ThemeMiniature;
