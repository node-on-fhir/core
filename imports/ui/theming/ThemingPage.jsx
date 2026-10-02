// imports/ui/theming/ThemingPage.jsx
//
// The Theming Studio — full-page theme editor (design handoff:
// workzone/design_handoff_theming_studio/README.md §A; spec:
// fable/superpowers/specs/2026-09-03-theming-studio-design.md).
//
// Greedy-height page (flex cascade per .claude/rules/ui/layout-patterns.md).
// Editor chrome renders under the LIVE app theme (tokens); only the
// ThemeMiniature renders the draft. Draft-then-publish: nothing touches the
// live app until "Publish to clinic".

import React, { useState, Suspense } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Chip, Divider,
  Select, MenuItem, FormControl, InputLabel, Slider, ToggleButton,
  ToggleButtonGroup, ButtonBase, Tooltip, Snackbar, Alert, useMediaQuery,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { get } from 'lodash';
import ErrorBoundary from '../ErrorBoundary.jsx';
import { ThemeMiniature } from './ThemeMiniature.jsx';
import { ContrastPills } from './ContrastPills.jsx';
import { useThemeDraft } from './useThemeDraft.js';
import { DENSITY_FACTORS } from './themeDraft.js';
import {
  THEME_PRESETS, CHAKRA_FONT, MARTIAN_FONT,
  isValidHex, cssColorToHex, hexToHsl, hslToHex,
  setHue, setSaturation, generateFromAccent, makeMono, deriveDark, deriveLight,
  nivoAuto, NIVO_SCHEME_SWATCHES
} from '../themePresets.js';
import { getBackgroundLibrary } from '../themeBackgrounds.js';

// Ace is heavy: lazy-load the editor component; the side-effect mode/theme
// imports stay static (error-handling rule pattern, same as GettingStartedPage).
const AceEditor = React.lazy(function() { return import('react-ace'); });
import 'ace-builds';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-monokai';

const FONT_OPTIONS = [
  { label: 'Default', value: '' },
  { label: 'Chakra Petch', value: CHAKRA_FONT },
  { label: 'Martian Mono', value: MARTIAN_FONT }
];

const NIVO_OPTIONS = ['auto', 'red_grey', 'blues', 'greens', 'purples', 'oranges'];

const HUE_RAIL = 'linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)';

// 10px uppercase overline per the handoff rail style.
function Overline({ children }) {
  return (
    <Typography sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary', fontWeight: 600 }}>
      {children}
    </Typography>
  );
}

// Collapsible rail group: header row (label · summary · +/−), body when open.
function RailGroup({ id, label, summary, open, onToggle, children }) {
  return (
    <Box sx={{ borderTop: '1px solid', borderColor: 'divider', py: 1 }}>
      <ButtonBase id={id + '-toggle'} onClick={onToggle} sx={{ width: '100%', justifyContent: 'space-between', display: 'flex', py: 0.5 }}>
        <Box sx={{ textAlign: 'left' }}>
          <Overline>{label}</Overline>
          {!open && summary ? <Typography variant="caption" color="text.secondary">{summary}</Typography> : null}
        </Box>
        {open ? <RemoveIcon fontSize="small" sx={{ color: 'text.secondary' }} /> : <AddIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
      </ButtonBase>
      {open ? <Box sx={{ mt: 1 }}>{children}</Box> : null}
    </Box>
  );
}

// Hex text field; validates #rgb|#rrggbb before committing to the draft.
function HexField({ id, value, onCommit, width }) {
  const [text, setText] = useState(value);
  const [error, setError] = useState(false);
  React.useEffect(function() { setText(value); setError(false); }, [value]);
  return (
    <TextField
      id={id}
      value={text}
      error={error}
      size="small"
      onChange={function(e) {
        const next = e.target.value;
        setText(next);
        if (isValidHex(next)) { setError(false); onCommit(next); }
        else { setError(next.length > 0); }
      }}
      inputProps={{ style: { fontFamily: 'monospace', fontSize: 12 } }}
      sx={{ width: width || 96 }}
    />
  );
}

// Native color input (56x30 per handoff Surfaces sizing).
function ColorSwatchInput({ id, value, onCommit, width, height }) {
  return (
    <Box
      component="input"
      type="color"
      id={id}
      value={cssColorToHex(value, '#888888') || '#888888'}
      onChange={function(e) { onCommit(e.target.value); }}
      sx={{
        width: width || 56, height: height || 30, p: 0, border: '1px solid',
        borderColor: 'divider', borderRadius: '4px', cursor: 'pointer', bgcolor: 'transparent'
      }}
    />
  );
}

export function ThemingPage() {
  const isLandscape = useMediaQuery('(min-aspect-ratio: 23/20)');
  const studio = useThemeDraft();
  const draft = studio.draft;
  const [previewMode, setPreviewMode] = useState('both');
  const [open, setOpen] = useState({ palette: true, surfaces: false, type: false, ambiance: false, charts: false, json: false });
  const [toast, setToast] = useState('');
  const [jsonDraft, setJsonDraft] = useState(null);   // null = synced with draft
  const [jsonError, setJsonError] = useState(false);

  const accentHsl = hexToHsl(cssColorToHex(draft.primary, '#9e9e9e')) || { h: 0, s: 0, l: 50 };
  const basePreset = THEME_PRESETS.find(function(p) { return p.id === draft.base; });

  function toggleGroup(key) {
    setOpen(function(current) { return Object.assign({}, current, { [key]: !current[key] }); });
  }

  function applyJson(text) {
    setJsonDraft(text);
    try {
      const parsed = JSON.parse(text);
      studio.patch(parsed);
      setJsonError(false);
    } catch (error) {
      setJsonError(true);
    }
  }

  // ---- Top-bar preset strip (horizontal, compact) ----

  const presetStrip = (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
      {THEME_PRESETS.map(function(preset) {
        const selected = draft.base === preset.id;
        const swatches = [
          get(preset, 'palette.primaryColor'),
          get(preset, 'palette.secondaryColor'),
          get(preset, 'palette.paperColorDark', '#18181a')
        ];
        return (
          <ButtonBase
            key={preset.id}
            id={'themingStudio-preset-' + preset.id}
            onClick={function() { studio.loadPreset(preset.id); }}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.6,
              borderRadius: '6px', border: '1px solid',
              borderColor: selected ? 'primary.main' : 'divider',
              '&:hover': { borderColor: 'primary.light' }
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600 }}>{preset.name}</Typography>
            <Box sx={{ display: 'flex', gap: 0.4 }}>
              {swatches.map(function(c, i) {
                return <Box key={i} sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: c, border: '1px solid', borderColor: 'divider' }} />;
              })}
            </Box>
          </ButtonBase>
        );
      })}
    </Box>
  );

  // ---- Rail content blocks (shared by both layouts) ----

  const clinicThemeRows = studio.saved.length ? (
    <Box sx={{ mt: 1 }}>
      {studio.saved.map(function(entry) {
        const d = entry.draft || {};
        return (
          <ButtonBase
            key={entry.id}
            id={'themingStudio-clinicTheme-' + entry.id}
            onClick={function() { studio.loadSaved(entry.id); }}
            sx={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 1, py: 0.75, px: 0.5,
              borderRadius: '4px', textAlign: 'left',
              bgcolor: studio.savedId === entry.id ? 'action.selected' : 'transparent',
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <Box sx={{ display: 'flex', gap: 0.25 }}>
              {[d.primary, d.secondary, d.paperDark, d.bgDark].map(function(c, i) {
                return <Box key={i} sx={{ width: 4, height: 20, borderRadius: '2px', bgcolor: c || 'divider' }} />;
              })}
            </Box>
            <Typography variant="body2" sx={{ flex: 1 }}>{entry.name}</Typography>
            <Typography variant="caption" color="text.secondary">{d.base || 'custom'}</Typography>
          </ButtonBase>
        );
      })}
    </Box>
  ) : null;

  const accentControls = (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <ColorSwatchInput id="themingStudio-accent-color" value={draft.primary} onCommit={function(hex) { studio.patch({ primary: hex }); }} width={40} height={40} />
        <HexField id="themingStudio-accent-hex" value={cssColorToHex(draft.primary, '#9e9e9e')} onCommit={function(hex) { studio.patch({ primary: hex }); }} />
      </Box>
      <Typography variant="caption" color="text.secondary">Hue</Typography>
      <Slider
        id="themingStudio-hue-slider"
        size="small"
        min={0} max={360}
        value={Math.round(accentHsl.h)}
        onChange={function(e, value) { studio.patch(setHue(draft, value)); }}
        sx={{
          '& .MuiSlider-rail': { opacity: 1, background: HUE_RAIL },
          '& .MuiSlider-track': { display: 'none' }
        }}
      />
      <Typography variant="caption" color="text.secondary">Saturation</Typography>
      <Slider
        id="themingStudio-saturation-slider"
        size="small"
        min={0} max={100}
        value={Math.round(accentHsl.s)}
        onChange={function(e, value) { studio.patch(setSaturation(draft, value)); }}
        sx={{
          '& .MuiSlider-rail': {
            opacity: 1,
            background: 'linear-gradient(90deg, #9e9e9e, ' + hslToHex(accentHsl.h, 100, 50) + ')'
          },
          '& .MuiSlider-track': { display: 'none' }
        }}
      />
      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
        <Button id="themingStudio-generate" size="small" variant="outlined" onClick={function() { studio.patch(generateFromAccent(draft)); }}>
          Generate palette from accent
        </Button>
        <Button id="themingStudio-mono" size="small" variant="outlined" onClick={function() { studio.patch(makeMono(draft)); }}>
          Mono
        </Button>
      </Box>
    </Box>
  );

  const paletteRows = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {[
        ['primary', 'Primary', 'Main brand color'],
        ['secondary', 'Secondary', 'Accent'],
        ['success', 'Success', 'Positive states'],
        ['info', 'Info', 'Informational'],
        ['warning', 'Warning', 'Caution states'],
        ['error', 'Error', 'Failure states']
      ].map(function(row) {
        const key = row[0];
        return (
          <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ColorSwatchInput id={'themingStudio-palette-' + key} value={draft[key]} onCommit={function(hex) { studio.patch({ [key]: hex }); }} width={30} height={30} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2">{row[1]}</Typography>
              <Typography variant="caption" color="text.secondary">{row[2]}</Typography>
            </Box>
            <HexField id={'themingStudio-palette-' + key + '-hex'} value={cssColorToHex(draft[key], '#888888')} onCommit={function(hex) { studio.patch({ [key]: hex }); }} />
          </Box>
        );
      })}
    </Box>
  );

  const surfaceRows = (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 56px 56px', gap: 1, alignItems: 'center' }}>
        <Box />
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>Light</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>Dark</Typography>
        {[
          ['Page background', 'bgLight', 'bgDark'],
          ['Paper', 'paperLight', 'paperDark'],
          ['App bar', 'appBarLight', 'appBarDark'],
          ['App-bar text', 'appBarTextLight', 'appBarTextDark']
        ].map(function(row) {
          return (
            <React.Fragment key={row[0]}>
              <Typography variant="body2">{row[0]}</Typography>
              <ColorSwatchInput id={'themingStudio-surface-' + row[1]} value={draft[row[1]] || draft.primary} onCommit={function(hex) { studio.patch({ [row[1]]: hex }); }} />
              <ColorSwatchInput id={'themingStudio-surface-' + row[2]} value={draft[row[2]] || draft.primary} onCommit={function(hex) { studio.patch({ [row[2]]: hex }); }} />
            </React.Fragment>
          );
        })}
      </Box>
      <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
        <Button id="themingStudio-deriveDark" size="small" variant="outlined" onClick={function() { studio.patch(deriveDark(draft)); }}>
          Derive dark ← light
        </Button>
        <Button id="themingStudio-deriveLight" size="small" variant="outlined" onClick={function() { studio.patch(deriveLight(draft)); }}>
          Derive light ← dark
        </Button>
      </Box>
    </Box>
  );

  const typeControls = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="themingStudio-font-label">Font</InputLabel>
        <Select
          labelId="themingStudio-font-label"
          id="themingStudio-font"
          label="Font"
          value={draft.font}
          onChange={function(e) { studio.patch({ font: e.target.value }); }}
        >
          {FONT_OPTIONS.map(function(opt) {
            return <MenuItem key={opt.value} value={opt.value} sx={{ fontFamily: opt.value || 'inherit' }}>{opt.label}</MenuItem>;
          })}
        </Select>
      </FormControl>
      <Box>
        <Typography variant="caption" color="text.secondary">Base size · {draft.baseFont}px</Typography>
        <Slider id="themingStudio-baseSize" size="small" min={12} max={17} step={1} value={draft.baseFont} onChange={function(e, v) { studio.patch({ baseFont: v }); }} />
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">Corner radius · {draft.radius}px</Typography>
        <Slider id="themingStudio-radius" size="small" min={0} max={20} step={1} value={draft.radius} onChange={function(e, v) { studio.patch({ radius: v }); }} />
      </Box>
      <ToggleButtonGroup
        id="themingStudio-density"
        size="small" exclusive fullWidth
        value={draft.density}
        onChange={function(e, v) { if (v) { studio.patch({ density: v }); } }}
      >
        {Object.keys(DENSITY_FACTORS).map(function(k) {
          return <ToggleButton key={k} value={k} sx={{ textTransform: 'capitalize' }}>{k}</ToggleButton>;
        })}
      </ToggleButtonGroup>
    </Box>
  );

  const ambianceControls = (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: isLandscape ? 'repeat(4, 1fr)' : 'repeat(7, 1fr)', gap: 1 }}>
        <ButtonBase
          id="themingStudio-ambiance-none"
          onClick={function() { studio.patch({ ambiance: '' }); }}
          sx={{ height: 44, borderRadius: '6px', border: '2px solid', borderColor: !draft.ambiance ? 'primary.main' : 'divider', fontSize: 11, color: 'text.secondary' }}
        >
          None
        </ButtonBase>
        {getBackgroundLibrary().map(function(bg) {
          return (
            <Tooltip key={bg.src} title={bg.name}>
              <ButtonBase
                onClick={function() { studio.patch({ ambiance: bg.src }); }}
                sx={{
                  height: 44, borderRadius: '6px', overflow: 'hidden', border: '2px solid',
                  borderColor: draft.ambiance === bg.src ? 'primary.main' : 'divider',
                  backgroundImage: 'url(' + bg.src + ')', backgroundSize: 'cover', backgroundPosition: 'center'
                }}
              />
            </Tooltip>
          );
        })}
      </Box>
      {draft.ambiance ? (
        <Alert severity="info" sx={{ mt: 1, py: 0 }}>
          Paper renders at 88% opacity over the image. Dark mode is recommended.
        </Alert>
      ) : null}
      <ToggleButtonGroup
        id="themingStudio-video"
        size="small" exclusive fullWidth sx={{ mt: 1.5 }}
        value={draft.video || 'off'}
        onChange={function(e, v) { if (v !== null) { studio.patch({ video: v === 'off' ? '' : v }); } }}
      >
        <ToggleButton value="off">Video off</ToggleButton>
        <ToggleButton value="/VideoBackgrounds/GrayWaves.mp4">GrayWaves.mp4</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );

  const chartsControls = (
    <Box>
      <FormControl fullWidth size="small">
        <InputLabel id="themingStudio-nivo-label">Nivo palette</InputLabel>
        <Select
          labelId="themingStudio-nivo-label"
          id="themingStudio-nivo"
          label="Nivo palette"
          value={draft.nivo}
          onChange={function(e) { studio.patch({ nivo: e.target.value }); }}
        >
          {NIVO_OPTIONS.map(function(opt) {
            return <MenuItem key={opt} value={opt}>{opt === 'auto' ? 'Auto (from primary)' : opt}</MenuItem>;
          })}
        </Select>
      </FormControl>
      <Box sx={{ display: 'flex', mt: 1, height: 18, borderRadius: '4px', overflow: 'hidden' }}>
        {(draft.nivo === 'auto' ? nivoAuto(cssColorToHex(draft.primary, '#9e9e9e')) : (NIVO_SCHEME_SWATCHES[draft.nivo] || NIVO_SCHEME_SWATCHES.red_grey)).map(function(c, i) {
          return <Box key={i} sx={{ flex: 1, bgcolor: c }} />;
        })}
      </Box>
    </Box>
  );

  const jsonControls = (
    <Box>
      <ErrorBoundary fallback={<Alert severity="warning">The JSON editor failed to load. Try refreshing.</Alert>}>
        <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={20} /></Box>}>
          <AceEditor
            mode="json"
            theme="github"
            name="themingStudio-json"
            value={jsonDraft !== null ? jsonDraft : JSON.stringify(draft, null, 2)}
            onChange={applyJson}
            onBlur={function() { if (!jsonError) { setJsonDraft(null); } }}
            width="100%"
            height="240px"
            showPrintMargin={false}
            setOptions={{ showLineNumbers: true, tabSize: 2, useWorker: false }}
            style={{ fontFamily: 'monospace', fontSize: 12 }}
          />
        </Suspense>
      </ErrorBoundary>
      {jsonError ? <Typography variant="caption" color="error.main">Invalid JSON — not applied</Typography> : null}
    </Box>
  );

  // Portrait rail leads with the handoff's Tools block (darker ground):
  // the four one-click actions + preset segmented control + hue slider.
  const toolsBlock = !isLandscape ? (
    <Box sx={{ bgcolor: 'action.hover', borderRadius: '8px', p: 1.5, mb: 1.5 }}>
      <Overline>Tools</Overline>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, my: 1 }}>
        <Button id="themingStudio-tools-generate" size="small" variant="outlined" onClick={function() { studio.patch(generateFromAccent(draft)); }}>Generate from accent</Button>
        <Button id="themingStudio-tools-mono" size="small" variant="outlined" onClick={function() { studio.patch(makeMono(draft)); }}>Make monochrome</Button>
        <Button id="themingStudio-tools-deriveDark" size="small" variant="outlined" onClick={function() { studio.patch(deriveDark(draft)); }}>Derive dark ← light</Button>
        <Button id="themingStudio-tools-deriveLight" size="small" variant="outlined" onClick={function() { studio.patch(deriveLight(draft)); }}>Derive light ← dark</Button>
      </Box>
      <Slider
        id="themingStudio-tools-hue"
        size="small" min={0} max={360}
        value={Math.round(accentHsl.h)}
        onChange={function(e, value) { studio.patch(setHue(draft, value)); }}
        sx={{
          '& .MuiSlider-rail': { opacity: 1, background: HUE_RAIL },
          '& .MuiSlider-track': { display: 'none' }
        }}
      />
    </Box>
  ) : null;

  const rail = (
    <Box sx={{ overflowY: 'auto', minHeight: 0, px: '18px', py: 2 }}>
      {toolsBlock}
      {clinicThemeRows ? <Box sx={{ mb: 1 }}><Overline>Clinic themes</Overline>{clinicThemeRows}</Box> : null}
      <Divider sx={{ my: 1 }} />
      <Overline>Accent hue</Overline>
      <Box sx={{ mt: 1, mb: 1 }}>{accentControls}</Box>
      <RailGroup id="themingStudio-group-palette" label="Palette" summary="Brand + status colors" open={open.palette} onToggle={function() { toggleGroup('palette'); }}>
        {paletteRows}
      </RailGroup>
      <RailGroup id="themingStudio-group-surfaces" label="Surfaces" summary="Backgrounds, paper, app bar" open={open.surfaces} onToggle={function() { toggleGroup('surfaces'); }}>
        {surfaceRows}
      </RailGroup>
      <RailGroup id="themingStudio-group-type" label="Type, shape & density" summary={draft.baseFont + 'px · r' + draft.radius + ' · ' + draft.density} open={open.type} onToggle={function() { toggleGroup('type'); }}>
        {typeControls}
      </RailGroup>
      <RailGroup id="themingStudio-group-ambiance" label="Ambiance" summary={draft.ambiance ? 'Image set' : 'None'} open={open.ambiance} onToggle={function() { toggleGroup('ambiance'); }}>
        {ambianceControls}
      </RailGroup>
      <RailGroup id="themingStudio-group-charts" label="Charts (Nivo)" summary={draft.nivo} open={open.charts} onToggle={function() { toggleGroup('charts'); }}>
        {chartsControls}
      </RailGroup>
      <RailGroup id="themingStudio-group-json" label="Raw JSON" summary="Advanced" open={open.json} onToggle={function() { toggleGroup('json'); }}>
        {jsonControls}
      </RailGroup>
    </Box>
  );

  const previewModes = previewMode === 'both' ? ['light', 'dark'] : [previewMode];
  const preview = (
    <Box sx={{ overflowY: 'auto', minHeight: 0, p: '22px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Overline>Preview · Patient chart</Overline>
        <ToggleButtonGroup
          id="themingStudio-previewMode"
          size="small" exclusive
          value={previewMode}
          onChange={function(e, v) { if (v) { setPreviewMode(v); } }}
        >
          <ToggleButton value="light">Light</ToggleButton>
          <ToggleButton value="dark">Dark</ToggleButton>
          <ToggleButton value="both">Side by side</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: isLandscape ? 'row' : 'column', gap: 2 }}>
        {previewModes.map(function(mode) {
          return (
            <Box key={mode} sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {(!isLandscape || previewModes.length > 1) ? (
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{mode}</Typography>
              ) : null}
              <ThemeMiniature draft={draft} mode={mode} variant="full" />
              {!isLandscape ? <ContrastPills draft={draft} mode={mode} /> : null}
            </Box>
          );
        })}
      </Box>
      {isLandscape ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {previewModes.map(function(mode) {
            return <ContrastPills key={mode} draft={draft} mode={mode} />;
          })}
        </Box>
      ) : null}
    </Box>
  );

  return (
    <Box id="ThemingPage" sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top bar */}
      <Paper square elevation={0} sx={{ flexShrink: 0, minHeight: 64, display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, flexWrap: 'wrap', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2">Theming</Typography>
        <Divider orientation="vertical" flexItem sx={{ my: 1 }} />
        <TextField
          id="themingStudio-name"
          variant="standard"
          value={draft.name}
          onChange={function(e) { studio.patch({ name: e.target.value }); }}
          InputProps={{ disableUnderline: true, sx: { fontSize: 14, fontWeight: 500 } }}
          sx={{ width: 200 }}
        />
        {basePreset ? <Chip size="small" variant="outlined" label={'Cloned from ' + basePreset.name} /> : null}
        {studio.dirty ? <Typography variant="caption" color="text.secondary">Unsaved changes</Typography> : null}
        <Divider orientation="vertical" flexItem sx={{ my: 1 }} />
        {presetStrip}
        <Box sx={{ flex: 1 }} />
        <Button id="themingStudio-shareLink" size="small" onClick={function() {
          const url = studio.shareLink();
          if (navigator.clipboard) { navigator.clipboard.writeText(url); }
          setToast('Share link copied');
        }}>
          Share link
        </Button>
        <Button id="themingStudio-save" size="small" variant="outlined" onClick={function() { studio.save(); setToast('Theme saved'); }}>
          Save
        </Button>
        <Tooltip title="Applies to this app session (org-wide publish comes with the server round)">
          <Button id="themingStudio-publish" size="small" variant="outlined" color="primary" onClick={function() { studio.publish(); setToast('Theme published to settings'); }}>
            Publish to clinic
          </Button>
        </Tooltip>
      </Paper>

      {/* Rail + preview */}
      <Box sx={{
        flex: 1, minHeight: 0, display: 'grid',
        gridTemplateColumns: isLandscape ? '372px 1fr' : '400px 1fr',
        overflow: 'hidden'
      }}>
        <Paper square elevation={0} sx={{ minHeight: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid', borderColor: 'divider' }}>
          {rail}
        </Paper>
        <Box sx={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {preview}
        </Box>
      </Box>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={function() { setToast(''); }} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={function() { setToast(''); }}>{toast}</Alert>
      </Snackbar>
    </Box>
  );
}

export default ThemingPage;
