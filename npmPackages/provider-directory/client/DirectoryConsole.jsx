// npmPackages/provider-directory/client/DirectoryConsole.jsx
//
// GRID CONTROL — the National Provider Directory as a deep-space traffic
// console. Free-text "hail" search over providerDirectory.omniSearch
// (Directory.* collections: ~2.7M organizations, ~1.4M locations, ~630K
// endpoints), census ticker with live count-up, precision-scan facet drawer,
// stagger-revealed signal-return results.
//
// DESIGN NOTE: this page is now THEME-DRIVEN (advance-theming applied, per the
// /apply-advanced-theming procedure). Its signature console palette is no longer
// hardcoded — the `.grid-console` CSS-var block is generated from the active MUI
// theme (buildConsoleVars(theme)), so a preset selected in the ThemeDialog
// restyles it live: Limestone → grayscale, Tron → single-hue, Vaporwave → the
// original amber/green/cyan look (that preset IS this page's native aesthetic).
// Every tint routes through those vars via color-mix(), so the subcomponents
// stay theme-agnostic and only this top component reads the theme. The display
// face follows the theme's displayFontFamily; Martian Mono stays the structural
// data-readout mono. Fonts are app-wide now (client/main.css @font-face at
// /fonts/*.woff2) but kept here too so the package renders standalone — the
// workflow parser copies only top-level asset files into
// public/workflows/provider-directory/. The classic facet page remains at
// /provider-directory-classic.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Box, Collapse, Button, CircularProgress } from '@mui/material';
import { useTheme, alpha, darken, lighten } from '@mui/material/styles';
import { useSearchParams } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import { SpiderScanLine, useSpiderScanning, withSpiderScanning } from '/imports/ui/components/SpiderScanLine.jsx';
import { buildPageModeTheme } from '/imports/ui/theme/pageModeTheme.js';
import { PAGE_MODE, SANDBOX_ENDPOINTS } from '/imports/lib/SessionKeys.js';
import { getBackgroundEntry } from '/imports/ui/themeBackgrounds.js';

const log = (Meteor.Logger ? Meteor.Logger.for('DirectoryConsole') : console);

// ---------------------------------------------------------------------------
// Console styles — vars, fonts, keyframes. Injected once.
// ---------------------------------------------------------------------------

const FONT_BASE = '/workflows/provider-directory';

// Structural CSS — fonts, keyframes, and class rules. Every color is expressed
// as a CSS var (or a color-mix against one), so this string is theme-agnostic
// and injected once; the vars themselves come from buildConsoleVars(theme).
const CONSOLE_STATIC_CSS = `
@font-face {
  font-family: 'Chakra Petch';
  src: url('${FONT_BASE}/chakra-petch-500.woff2') format('woff2');
  font-weight: 500; font-style: normal; font-display: swap;
}
@font-face {
  font-family: 'Chakra Petch';
  src: url('${FONT_BASE}/chakra-petch-700.woff2') format('woff2');
  font-weight: 700; font-style: normal; font-display: swap;
}
@font-face {
  font-family: 'Martian Mono';
  src: url('${FONT_BASE}/martian-mono-variable.woff2') format('woff2');
  font-weight: 100 800; font-style: normal; font-display: swap;
}

.grid-console *::selection { background: var(--amber-dim); color: var(--void); }

.grid-console ::-webkit-scrollbar { width: 10px; height: 10px; }
.grid-console ::-webkit-scrollbar-track { background: transparent; }
.grid-console ::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--stone) 18%, transparent); border: 2px solid var(--void); border-radius: 6px;
}
.grid-console ::-webkit-scrollbar-thumb:hover { background: var(--amber-dim); }

/* -- atmosphere (traveling sweep line now lives in SpiderScanLine) ------- */
@keyframes gcFlicker {
  0%, 100% { opacity: 0.035; } 50% { opacity: 0.06; }
}
/* -- boot / reveal ------------------------------------------------------- */
@keyframes gcBoot {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes gcDrawIn {
  from { transform: scaleX(0); } to { transform: scaleX(1); }
}
@keyframes gcRowIn {
  from { opacity: 0; transform: translateX(-10px); clip-path: inset(0 100% 0 0); }
  to   { opacity: 1; transform: translateX(0);     clip-path: inset(0 0 0 0); }
}
/* -- live elements ------------------------------------------------------- */
@keyframes gcCaret { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
@keyframes gcScan {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
@keyframes gcPulse {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--green) 40%, transparent); }
  50%      { box-shadow: 0 0 8px 2px color-mix(in srgb, var(--green) 18%, transparent); }
}

.gc-boot   { animation: gcBoot 0.7s cubic-bezier(0.2, 0.9, 0.25, 1) both; }
.gc-row    { animation: gcRowIn 0.45s cubic-bezier(0.2, 0.9, 0.25, 1) both; }
.gc-rule   { transform-origin: left; animation: gcDrawIn 0.8s cubic-bezier(0.2, 0.9, 0.25, 1) both; }

.gc-row-btn {
  display: grid; grid-template-columns: 44px 1fr auto; gap: 14px; align-items: center;
  width: 100%; text-align: left; padding: 13px 18px 13px 14px;
  background: transparent; border: none; border-left: 2px solid transparent;
  cursor: pointer; transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
}
.gc-row-btn:hover {
  transform: translateX(6px);
  background: linear-gradient(90deg, color-mix(in srgb, var(--amber) 7%, transparent), color-mix(in srgb, var(--stone) 3%, transparent) 60%, transparent);
  border-left-color: var(--amber);
}
.gc-row-btn:hover .gc-acquire { opacity: 1; transform: translateX(0); }
.gc-acquire {
  opacity: 0; transform: translateX(-6px); transition: all 0.18s ease;
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.22em; color: var(--amber);
  white-space: nowrap;
}

/* Result rows get a panel backing so org names never sit naked on the photo.
   Combined-class selector (.gc-row-btn.gc-row) beats the plain .gc-row-btn
   background rule above regardless of stylesheet order. */
.gc-row-btn.gc-row { background: color-mix(in srgb, var(--panel-hard) 45%, transparent); }
.gc-row-btn.gc-row:hover {
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--amber) 7%, transparent), color-mix(in srgb, var(--stone) 3%, transparent) 60%, transparent),
    color-mix(in srgb, var(--panel-hard) 70%, transparent);
}

.gc-chip-btn {
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em;
  color: var(--stone); background: color-mix(in srgb, var(--panel-hard) 60%, transparent); border: 1px solid var(--stone-dim);
  padding: 6px 14px; cursor: pointer; transition: all 0.18s ease;
}
.gc-chip-btn:hover { border-color: var(--amber); color: var(--amber); background: color-mix(in srgb, var(--amber) 6%, transparent); }

.gc-facet-input {
  font-family: var(--mono); font-size: 12px; letter-spacing: 0.06em;
  color: var(--ink); background: transparent;
  border: none; border-bottom: 1px solid var(--hairline);
  padding: 8px 2px; outline: none; width: 100%;
  transition: border-color 0.2s ease;
}
.gc-facet-input:focus { border-bottom-color: var(--stone); }
.gc-facet-input::placeholder { color: var(--ink-dim); opacity: 0.7; }

.gc-hail-input {
  font-family: var(--display); font-weight: 500; font-size: clamp(20px, 3vw, 30px);
  letter-spacing: 0.04em; color: var(--ink); background: transparent;
  border: none; outline: none; width: 100%; padding: 0;
}
.gc-hail-input::placeholder { color: var(--ink-dim); opacity: 0.55; font-weight: 500; }
`;

// Generate the `.grid-console` design-token block from the active MUI theme.
// This is the single seam that makes the console theme-driven: every var maps to
// a palette token or the theme's display font, so switching presets in the
// ThemeDialog re-paints the whole page. The three intensity tiers (--ink /
// --stone / --ink-dim) map to text.primary / text.secondary / text.disabled;
// the branded accents (--amber lead, --magenta, --green) map to primary /
// secondary / success. Martian Mono stays fixed — mono is the console's
// structural data-readout face, not a themed axis.
function buildConsoleVars(theme) {
  const p = theme.palette;
  const canvas = p.background.default;
  const displayFont = (theme.typography.h1 && theme.typography.h1.fontFamily) || theme.typography.fontFamily;
  return `.grid-console {
  --void: ${canvas};
  --void-hi: ${lighten(canvas, 0.05)};
  --void-lo: ${darken(canvas, 0.5)};
  --panel: ${alpha(p.background.paper, 0.72)};
  --panel-hard: ${p.background.paper};
  --amber: ${p.primary.main};
  --amber-dim: ${alpha(p.primary.main, 0.42)};
  --stone: ${p.text.secondary};
  --stone-dim: ${alpha(p.text.secondary, 0.30)};
  --magenta: ${(p.secondary && p.secondary.main) || p.error.main};
  --green: ${(p.success && p.success.main) || '#69f0ae'};
  --ink: ${p.text.primary};
  --ink-dim: ${p.text.disabled};
  --hairline: ${p.divider};
  --display: ${displayFont};
  --mono: 'Martian Mono', 'SF Mono', ui-monospace, monospace;
}`;
}

// Layered background: gradients + hex-grid + scanlines + noise.
const NOISE_URI = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

// Corner brackets on a panel — the console's signature framing device.
function Brackets({ color = 'var(--stone-dim)', size = 14 }) {
  const common = { position: 'absolute', width: size, height: size, pointerEvents: 'none' };
  const b = '1px solid ' + color;
  return (
    <>
      <Box sx={{ ...common, top: 0, left: 0, borderTop: b, borderLeft: b }} />
      <Box sx={{ ...common, top: 0, right: 0, borderTop: b, borderRight: b }} />
      <Box sx={{ ...common, bottom: 0, left: 0, borderBottom: b, borderLeft: b }} />
      <Box sx={{ ...common, bottom: 0, right: 0, borderBottom: b, borderRight: b }} />
    </>
  );
}

// Count-up census number — eases out over ~1.6s on first paint.
function TickerNumber({ value, delay = 0 }) {
  const [shown, setShown] = useState(0);
  const started = useRef(false);
  useEffect(function() {
    if (value === null || value === undefined || started.current) { return; }
    started.current = true;
    const target = value;
    const t0 = performance.now() + delay;
    let raf;
    function tick(now) {
      const t = Math.min(Math.max((now - t0) / 1600, 0), 1);
      const eased = 1 - Math.pow(2, -10 * t);   // ease-out-expo
      setShown(Math.round(target * (t >= 1 ? 1 : eased)));
      if (t < 1) { raf = requestAnimationFrame(tick); }
    }
    raf = requestAnimationFrame(tick);
    return function() { cancelAnimationFrame(raf); };
  }, [value, delay]);

  return (
    <Box component="span" sx={{
      fontFamily: 'var(--mono)', fontWeight: 700,
      fontSize: 'clamp(22px, 2.6vw, 32px)', color: 'var(--amber)',
      fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em',
      textShadow: '0 0 18px color-mix(in srgb, var(--amber) 35%, transparent)'
    }}>
      {shown.toLocaleString()}
    </Box>
  );
}

// Elapsed since a timestamp, expressed dynamically: minutes under an hour,
// hours under two days, days beyond that.
function formatElapsed(iso) {
  if (!iso) { return null; }
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) { return null; }
  const mins = Math.max(0, Math.floor((Date.now() - then) / 60000));
  if (mins < 1) { return 'just now'; }
  if (mins < 60) { return mins + 'm ago'; }
  const hours = Math.floor(mins / 60);
  if (hours < 48) { return hours + 'h ago'; }
  return Math.floor(hours / 24) + 'd ago';
}

// Masthead "last updated" — the last time the endpoint directory was synced
// (ServerConfiguration.lanternSync.lastSyncAt), with dynamic elapsed. Re-ticks
// the elapsed label once a minute; no second-by-second clock.
function LastUpdated({ iso }) {
  const [, setTick] = useState(0);
  useEffect(function() {
    const interval = setInterval(function() { setTick(function(n) { return n + 1; }); }, 60000);
    return function() { clearInterval(interval); };
  }, []);
  if (!iso) { return <>UPDATED · UNKNOWN</>; }
  const ymd = new Date(iso).toISOString().slice(0, 10).replace(/-/g, '.');
  return <>UPDATED {ymd} · {formatElapsed(iso)}</>;
}

// ---------------------------------------------------------------------------
// Result presentation
// ---------------------------------------------------------------------------

const BAND_CONFIG = {
  Organization:  { label: 'ORGANIZATIONS', unit: 'CONTACTS',  sigil: '⬡', accent: 'var(--amber)' },
  Practitioner:  { label: 'CLINICIANS',    unit: 'REGISTERED', sigil: '✛', accent: 'var(--stone)' },
  Location:      { label: 'LOCATIONS',     unit: 'SITES',      sigil: '◬', accent: 'var(--magenta)' },
  Endpoint:      { label: 'ENDPOINTS',     unit: 'UPLINKS',    sigil: '⌁', accent: 'var(--green)' }
};

// Seeded vendor-sandbox band (session-fed, not part of the unified search).
// Rendered above ORGANIZATIONS whenever the SANDBOX_ENDPOINTS session array
// holds records — see the SessionKeys contract; @orbital/lantern's config
// panel seeds/clears it.
const SANDBOX_BAND_CONFIG = { label: 'SANDBOXES', unit: 'SEEDED', sigil: '⚗', accent: 'var(--green)' };

// Directory records live in the Directory.* collections, not the core resource
// collections — so there is no detail page to navigate to. Instead each row
// reveals its record inline from the hit we already hold. flattenDetail pulls
// the human-useful fields out of a raw FHIR resource, defensively.
function flattenDetail(resourceName, hit) {
  const addresses = Array.isArray(get(hit, 'address')) ? get(hit, 'address') : (get(hit, 'address') ? [get(hit, 'address')] : []);
  const addressLines = addresses.map(function(addr) {
    if (typeof addr === 'string') { return addr; }
    const street = (get(addr, 'line') || []).join(', ');
    const tail = [get(addr, 'city'), get(addr, 'state'), get(addr, 'postalCode')].filter(Boolean).join(' ');
    return [street, tail].filter(Boolean).join(', ');
  }).filter(Boolean);

  const telecom = (Array.isArray(get(hit, 'telecom')) ? get(hit, 'telecom') : [])
    .map(function(t) { return { system: get(t, 'system', 'contact'), value: get(t, 'value', '') }; })
    .filter(function(t) { return t.value; });

  const rows = [];
  if (get(hit, 'id')) { rows.push(['FHIR ID', String(get(hit, 'id'))]); }
  addressLines.forEach(function(line, i) { rows.push([i === 0 ? 'ADDRESS' : '', line]); });
  telecom.forEach(function(t) { rows.push([t.system.toUpperCase(), t.value]); });

  if (resourceName === 'Endpoint') {
    const ct = get(hit, 'connectionType.0.coding.0.code') || get(hit, 'connectionType.coding.0.code') || get(hit, 'connectionType.code');
    if (ct) { rows.push(['CONNECTION', String(ct)]); }
    const org = get(hit, 'managingOrganization.display') || get(hit, 'managingOrganization.reference');
    if (org) { rows.push(['MANAGED BY', String(org)]); }
  }
  if (resourceName === 'Practitioner') {
    const quals = (Array.isArray(get(hit, 'qualification')) ? get(hit, 'qualification') : [])
      .map(function(q) { return get(q, 'code.text') || get(q, 'code.coding.0.display'); })
      .filter(Boolean);
    if (quals.length) { rows.push(['QUALIFICATION', quals.join(' · ')]); }
  }
  return rows;
}

function RecordDetail({ resourceName, hit, accent }) {
  const rows = flattenDetail(resourceName, hit);
  return (
    <Box sx={{
      ml: '58px', mr: 2, mb: 1, px: 2.5, py: 2,
      borderLeft: '2px solid ' + accent,
      background: 'linear-gradient(90deg, color-mix(in srgb, var(--stone) 4%, transparent), transparent)'
    }}>
      {rows.length === 0 ? (
        <Box sx={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--ink-dim)', letterSpacing: '0.12em' }}>
          NO ADDITIONAL FIELDS ON THIS RECORD
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 0.75, columnGap: 2 }}>
          {rows.map(function(pair, index) {
            return (
              <React.Fragment key={index}>
                <Box sx={{
                  fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.24em',
                  color: 'var(--ink-dim)', pt: '2px', textAlign: 'right'
                }}>
                  {pair[0]}
                </Box>
                <Box sx={{
                  fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '0.04em',
                  color: 'var(--ink)', wordBreak: 'break-word'
                }}>
                  {pair[1]}
                </Box>
              </React.Fragment>
            );
          })}
        </Box>
      )}

      {/* Connectable FHIR endpoint → the Probe & Connect bridge into the
          spider + SMART launch flow. */}
      {resourceName === 'Endpoint' && get(hit, '_connectable') ? (
        <EndpointFetchPanel
          endpointId={get(hit, '_id')}
          address={typeof get(hit, 'address') === 'string' ? get(hit, 'address') : ''}
          name={typeof get(hit, 'name') === 'string' ? get(hit, 'name') : ''}
          accent={accent}
        />
      ) : null}

      {/* Linked organization → the same bridge via its tier-1-linked endpoint
          (methods.linkage.js). Gated on patientLaunchable (user decision:
          every CONNECT VIA chip must be a working connect). Tooltip carries
          the linkage provenance so operators can see why the link exists. */}
      {resourceName === 'Organization' && get(hit, '_linkage.patientLaunchable') ? (
        <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed var(--hairline)' }}>
          <Box sx={{
            fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.24em',
            color: 'var(--ink-dim)', mb: 1
          }}
            title={'linked by ' + get(hit, '_linkage.method', '') +
              ' (' + get(hit, '_linkage.evidence', '') +
              ', confidence ' + get(hit, '_linkage.confidence', '') + ')'}
          >
            CONNECT VIA {String(get(hit, 'endpoint.0.display', get(hit, '_linkage.matchedName', ''))).toUpperCase()}
          </Box>
          <EndpointFetchPanel endpointId={get(hit, '_linkage.endpointId')} accent={accent} />
        </Box>
      ) : null}
    </Box>
  );
}

// Bridges a connectable FHIR endpoint to the spider probe + SMART launch we
// built (lantern.probeEndpoint → connect.beginLaunch). Probe raises the global
// SPIDER_SCANNING signal (the sweep line fires); a launchable result reveals
// Connect & Fetch, which hands off to the vendor login. Settings-gated: an
// unconfigured vendor surfaces the actionable admin message. When pacio-core
// is loaded and the hit carries an address, "Fetch patients ▸" hands off to
// /patient-fetch pre-pointed at this endpoint.
function EndpointFetchPanel({ endpointId, address, name, accent }) {
  const useNavigate = Meteor.useNavigate;
  const navigate = useNavigate ? useNavigate() : function() {};

  // /patient-fetch only exists when pacio-core is loaded — check the client
  // Package registry at render time (module-scope checks miss sibling workflows).
  const registry = (typeof Package !== 'undefined' && Package)
    || (typeof globalThis !== 'undefined' && globalThis.Package) || null;
  const pacioInstalled = !!(registry && registry['@node-on-fhir/pacio-core']);

  const [probing, setProbing] = useState(false);
  const [conformance, setConformance] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  async function handleProbe() {
    setError(null);
    setProbing(true);
    try {
      const result = await withSpiderScanning(function() {
        return Meteor.rpc('lantern.probeEndpoint', { endpointId: endpointId });
      });
      setConformance(result);
    } catch (err) {
      setError(get(err, 'reason', err.message));
    } finally {
      setProbing(false);
    }
  }

  async function handleConnect() {
    setError(null);
    setConnecting(true);
    try {
      const result = await Meteor.rpc('connect.beginLaunch', { endpointId: endpointId });
      window.location.assign(get(result, 'authorizeUrl'));
    } catch (err) {
      setConnecting(false);
      setError(get(err, 'reason', err.message));
    }
  }

  const launchable = conformance && get(conformance, 'patientLaunchable');
  const btnSx = {
    fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.18em',
    color: accent, borderColor: accent,
    '&:hover': { borderColor: accent, background: 'color-mix(in srgb, var(--ink) 4%, transparent)' }
  };

  return (
    <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed var(--hairline)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Button
          variant="outlined" size="small" sx={btnSx}
          disabled={probing || connecting}
          startIcon={probing ? <CircularProgress size={14} color="inherit" /> : null}
          onClick={handleProbe}
        >
          {probing ? 'Probing…' : (conformance ? 'Re-probe' : 'Probe endpoint')}
        </Button>

        {address && pacioInstalled ? (
          <Button
            variant="outlined" size="small" sx={btnSx}
            onClick={function() {
              navigate('/patient-fetch?endpoint=' + encodeURIComponent(address) +
                (name ? '&endpointName=' + encodeURIComponent(name) : ''));
            }}
          >
            Fetch patients ▸
          </Button>
        ) : null}

        {conformance ? (
          <Box component="span" sx={{ display: 'inline-flex', gap: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box component="span" sx={{
              fontFamily: 'var(--mono)', fontSize: '8.5px', letterSpacing: '0.2em', px: 0.9, py: 0.3,
              color: get(conformance, 'healthTag') === 'up' ? 'var(--green)' : (get(conformance, 'healthTag') === 'degraded' ? 'var(--amber)' : 'var(--magenta)'),
              border: '1px solid currentColor', opacity: 0.85
            }}>
              {String(get(conformance, 'healthTag', 'down')).toUpperCase()}
            </Box>
            {get(conformance, 'vendor') && get(conformance, 'vendor') !== 'unknown' ? (
              <Box component="span" sx={{ fontFamily: 'var(--mono)', fontSize: '8.5px', letterSpacing: '0.2em', px: 0.9, py: 0.3, color: 'var(--ink-dim)', border: '1px solid var(--ink-dim)' }}>
                {String(get(conformance, 'vendor')).toUpperCase()}
              </Box>
            ) : null}
            {get(conformance, 'fhirVersion') ? (
              <Box component="span" sx={{ fontFamily: 'var(--mono)', fontSize: '8.5px', letterSpacing: '0.2em', px: 0.9, py: 0.3, color: 'var(--ink-dim)', border: '1px solid var(--ink-dim)' }}>
                FHIR {get(conformance, 'fhirVersion')}
              </Box>
            ) : null}
          </Box>
        ) : null}

        {launchable ? (
          <Button
            variant="contained" size="small"
            sx={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.18em', ml: 'auto' }}
            disabled={connecting}
            startIcon={connecting ? <CircularProgress size={14} color="inherit" /> : null}
            onClick={handleConnect}
          >
            {connecting ? 'Connecting…' : 'Connect & Fetch ▸'}
          </Button>
        ) : null}
      </Box>

      {conformance && !launchable ? (
        <Box sx={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--ink-dim)', mt: 1 }}>
          NOT PATIENT-LAUNCHABLE — {get(conformance, 'healthTag', 'unknown').toUpperCase()}
          {get(conformance, 'fhirVersion') ? ' · FHIR ' + get(conformance, 'fhirVersion') : ''}
        </Box>
      ) : null}

      {error ? (
        <Box sx={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.06em', color: 'var(--magenta)', mt: 1 }}>
          {error}
        </Box>
      ) : null}
    </Box>
  );
}

function flattenHit(resourceName, hit) {
  const address = Array.isArray(get(hit, 'address')) ? get(hit, 'address.0') : get(hit, 'address');
  const cityState = [get(address, 'city'), get(address, 'state')].filter(Boolean).join(', ');
  let name = get(hit, 'name', '');
  if (Array.isArray(name)) {
    name = get(name, '0.text') ||
      [get(name, '0.given.0'), get(name, '0.family')].filter(Boolean).join(' ');
  }
  let meta = cityState;
  if (resourceName === 'Endpoint') {
    meta = typeof get(hit, 'address') === 'string' ? get(hit, 'address') : cityState;
  }
  const status = get(hit, 'status') ||
    (get(hit, 'active') === true ? 'active' : (get(hit, 'active') === false ? 'inactive' : ''));
  return {
    _id: get(hit, '_id'),
    name: name || '(unnamed)',
    meta: meta || '—',
    fhirId: get(hit, 'id', ''),
    status: status,
    // Endpoint-band extras (tagged server-side by the unified search).
    source: get(hit, '_source', null),
    connectable: !!get(hit, '_connectable'),
    fhirBase: resourceName === 'Endpoint' && typeof get(hit, 'address') === 'string'
      ? get(hit, 'address') : null
  };
}

// Source lineage chip for endpoint rows (meta.source discriminator).
const SOURCE_CHIP = {
  epic:    { label: 'EPIC',    color: 'var(--amber)' },
  cerner:  { label: 'CERNER',  color: 'var(--green)' },
  lantern: { label: 'LANTERN', color: 'var(--stone)' },
  nppes:   { label: 'NPPES',   color: 'var(--ink-dim)' },
  other:   { label: 'OTHER',   color: 'var(--ink-dim)' }
};

function SourceChip({ source }) {
  const cfg = SOURCE_CHIP[source];
  if (!cfg) { return null; }
  return (
    <Box component="span" sx={{
      fontFamily: 'var(--mono)', fontSize: '8.5px', letterSpacing: '0.2em',
      px: 0.9, py: 0.3, whiteSpace: 'nowrap', color: cfg.color,
      border: '1px solid ' + cfg.color, opacity: 0.85
    }}>
      {cfg.label}
    </Box>
  );
}

function StatusChip({ status }) {
  if (!status) { return null; }
  const live = status === 'active';
  return (
    <Box component="span" sx={{
      fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.2em',
      px: 1, py: 0.4, whiteSpace: 'nowrap',
      color: live ? 'var(--green)' : 'var(--ink-dim)',
      background: 'color-mix(in srgb, var(--panel-hard) 60%, transparent)',
      border: '1px solid ' + (live ? 'color-mix(in srgb, var(--green) 40%, transparent)' : 'color-mix(in srgb, var(--ink-dim) 40%, transparent)'),
      animation: live ? 'gcPulse 3s ease-in-out infinite' : 'none'
    }}>
      {status.toUpperCase()}
    </Box>
  );
}

function ResultBand({ band, config, revealIndex, onLoadMore, loadingMore }) {
  const [expandedId, setExpandedId] = useState(null);
  const hitsById = {};
  (band.hits || []).forEach(function(hit) { hitsById[get(hit, '_id')] = hit; });
  const rows = (band.hits || []).map(function(hit) { return flattenHit(band.resourceName, hit); });
  const countLabel = band.matchCount >= 1000
    ? '1,000+' : band.matchCount.toLocaleString();
  // Bands fetch 200 by default; the tail beyond the fetched page is reachable
  // via LOAD MORE (single-band skip pages, deduped on append).
  const hasMore = band.matchCount > rows.length;

  return (
    <Box className="gc-boot" sx={{ animationDelay: (revealIndex * 120) + 'ms', mb: 4 }}>
      {/* Band header */}
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 0.5 }}>
        <Box component="span" sx={{ color: config.accent, fontSize: '15px', lineHeight: 1 }}>{config.sigil}</Box>
        <Box component="span" sx={{
          fontFamily: 'var(--display)', fontWeight: 700, fontSize: '15px',
          letterSpacing: '0.28em', color: 'var(--ink)'
        }}>
          {config.label}
        </Box>
        <Box component="span" sx={{
          fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.18em',
          color: band.matchCount ? config.accent : 'var(--ink)'
        }}>
          — {band.matchCount ? (countLabel + ' ' + config.unit) : 'BAND SILENT'}
        </Box>
      </Box>
      <Box className="gc-rule" sx={{
        height: '1px', mb: 1,
        background: 'linear-gradient(90deg, ' + config.accent + ' 0%, var(--hairline) 40%, transparent 90%)',
        animationDelay: (revealIndex * 120 + 150) + 'ms'
      }} />

      {/* Rows */}
      {rows.length === 0 ? (
        <Box sx={{
          fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.14em',
          color: 'var(--ink-dim)', px: 2, py: 1.5, opacity: 0.7
        }}>
          NO RETURNS ON THIS BAND
        </Box>
      ) : rows.map(function(row, index) {
        const isOpen = expandedId === row._id;
        return (
          <Box key={row._id}>
            <button
              className="gc-row gc-row-btn"
              style={{ animationDelay: (revealIndex * 120 + 150 + index * 60) + 'ms' }}
              aria-expanded={isOpen}
              onClick={function() {
                log.info('reveal', { resourceType: band.resourceName, id: row._id, open: !isOpen });
                setExpandedId(isOpen ? null : row._id);
              }}
            >
              <Box component="span" sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34, color: config.accent, fontSize: '16px',
                border: '1px solid var(--hairline)',
                background: isOpen ? 'color-mix(in srgb, var(--amber) 8%, transparent)' : 'color-mix(in srgb, var(--stone) 3%, transparent)',
                transition: 'background 0.2s ease'
              }}>
                {config.sigil}
              </Box>
              <Box component="span" sx={{ minWidth: 0 }}>
                <Box component="span" sx={{
                  display: 'block', fontFamily: 'var(--display)', fontWeight: 500,
                  fontSize: '17px', color: 'var(--ink)', letterSpacing: '0.02em',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {row.name}
                </Box>
                <Box component="span" sx={{
                  display: 'block', fontFamily: 'var(--mono)', fontSize: '10px',
                  letterSpacing: '0.12em', color: 'var(--ink-dim)', mt: 0.4,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {row.meta.toUpperCase()}{row.fhirId ? '  ·  ID ' + String(row.fhirId).slice(0, 18) : ''}
                </Box>
              </Box>
              <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {row.source ? <SourceChip source={row.source} /> : null}
                {row.connectable ? (
                  <Box component="span" sx={{
                    fontFamily: 'var(--mono)', fontSize: '8.5px', letterSpacing: '0.2em',
                    px: 0.9, py: 0.3, color: 'var(--green)', border: '1px solid var(--green)', whiteSpace: 'nowrap'
                  }}>
                    ⌁ FHIR
                  </Box>
                ) : null}
                <StatusChip status={row.status} />
                <span className="gc-acquire" style={isOpen ? { opacity: 1, transform: 'none', color: 'var(--amber)' } : undefined}>
                  {isOpen ? 'CLOSE ▾' : 'INSPECT ▸'}
                </span>
              </Box>
            </button>
            <Collapse in={isOpen} unmountOnExit>
              <RecordDetail resourceName={band.resourceName} hit={hitsById[row._id]} accent={config.accent} />
            </Collapse>
          </Box>
        );
      })}

      {hasMore && onLoadMore ? (
        <button
          type="button"
          onClick={function() { onLoadMore(band.resourceName); }}
          disabled={!!loadingMore}
          style={{
            display: 'block', width: '100%', background: 'transparent',
            border: '1px dashed var(--hairline)', cursor: loadingMore ? 'wait' : 'pointer',
            padding: '10px 0', marginTop: '6px',
            fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.24em',
            color: config.accent, opacity: loadingMore ? 0.5 : 0.9
          }}
        >
          {loadingMore
            ? 'ACQUIRING…'
            : 'LOAD MORE ▸ SHOWING ' + rows.length.toLocaleString() + ' OF ' + countLabel + ' ' + config.unit}
        </button>
      ) : null}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// The console
// ---------------------------------------------------------------------------

export function DirectoryConsole() {
  const appMuiTheme = useTheme();
  const [searchParams] = useSearchParams();

  // Content-ink override: URL param (dev/demo) wins over the persisted
  // Page Mode choice (Theme & Palette dialog). Falsy → app mode stands.
  const pageThemeParam = (searchParams.get('page-theme') || '').toLowerCase();
  const persistedPageMode = useTracker(function() { return Session.get(PAGE_MODE); }, []);

  // Ctrl+Shift+N retracts the app chrome (Session 'displayNavbars'; undefined
  // counts as visible — same convention as Header/Footer/App.jsx). With chrome
  // up the console floats 40px below the header; with chrome retracted the
  // gap collapses and the card runs the full page height.
  const navbarsVisible = useTracker(function() { return Session.get('displayNavbars') !== false; }, []);

  // Seeded vendor sandboxes (lantern config panel writes the session array).
  // Shaped into Endpoint-band hits so ResultBand / RecordDetail /
  // EndpointFetchPanel (probe → Connect & Fetch) work unchanged; the band
  // renders only while records exist (count > 0).
  const sandboxes = useTracker(function() { return Session.get(SANDBOX_ENDPOINTS) || []; }, []);
  const sandboxBand = useMemo(function() {
    if (!sandboxes.length) { return null; }
    return {
      resourceName: 'Endpoint',
      matchCount: sandboxes.length,
      hits: sandboxes.map(function(s) {
        return {
          _id: get(s, 'endpointId'),
          id: get(s, 'endpointId'),
          name: get(s, 'name', '(unnamed sandbox)'),
          address: get(s, 'address', ''),
          status: 'active',
          _source: get(s, 'vendor') === 'cerner' ? 'cerner'
            : (get(s, 'vendor') === 'epic' ? 'epic' : 'other'),
          _connectable: !!get(s, 'patientLaunchable')
        };
      })
    };
  }, [sandboxes]);
  const paramMode = (pageThemeParam === 'light' || pageThemeParam === 'dark') ? pageThemeParam : null;

  // Plain read each render: theme changes rebuild the MUI theme via
  // CustomThemeProvider (themeRefreshRequest), which re-renders us — same
  // access pattern as ThemeControls. Do NOT wrap in useTracker (no reactive deps).
  const activeBg = get(Meteor, 'settings.public.theme.backgroundImagePath', '');

  // Curation record for the active ambiance (scrim strength + focus).
  const bgEntry = getBackgroundEntry(activeBg);
  const scrimStrength = get(bgEntry, 'scrimStrength', 0.55);

  // ?align param wins; otherwise the image's curated focus; otherwise center.
  const alignParam = (searchParams.get('align') || '').toLowerCase();
  const focus = ['left', 'center', 'right'].indexOf(alignParam) !== -1
    ? alignParam
    : (get(bgEntry, 'focus') || 'center');
  const bodyAlign = focus === 'left' ? { ml: 0, mr: 'auto' }
    : focus === 'right' ? { ml: 'auto', mr: 0 }
    : { mx: 'auto' };

  // Content-ink precedence: ?page-theme param (dev override) → the user's
  // persisted Page Mode → the image's curated recommendedPageMode — the
  // latter two only while a background is active (no background, no forced ink).
  const forcedMode = paramMode
    || (activeBg ? persistedPageMode : null)
    || (activeBg ? get(bgEntry, 'recommendedPageMode', null) : null)
    || null;
  const theme = useMemo(function() {
    return buildPageModeTheme(appMuiTheme, forcedMode);
  }, [appMuiTheme, forcedMode]);

  const consoleVars = buildConsoleVars(theme);

  const [query, setQuery] = useState('');
  const [facets, setFacets] = useState({ city: '', state: '', postalCode: '' });
  const [showFacets, setShowFacets] = useState(false);
  const [totals, setTotals] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [bands, setBands] = useState(null);          // null = no search yet
  const [scanning, setScanning] = useState(false);
  const [scanMs, setScanMs] = useState(null);
  const [scanError, setScanError] = useState(null);
  const debounceRef = useRef(null);
  const scanSeq = useRef(0);

  const spiderScanning = useSpiderScanning();

  const gridTotal = totals
    ? Object.values(totals).reduce(function(sum, n) { return sum + n; }, 0)
    : null;

  const runScan = useCallback(async function(q, facetValues) {
    const seq = ++scanSeq.current;
    setScanning(true);
    setScanError(null);
    try {
      const result = await Meteor.rpc('providerDirectory.omniSearch', Object.assign({ q: q }, facetValues));
      if (seq !== scanSeq.current) { return; }   // superseded by a newer scan
      setTotals(result.totals);
      setLastUpdated(get(result, 'lastUpdated', null));
      setBands(q.trim().length >= 2 ? result.results : null);
      setScanMs(result.searchMs);
    } catch (error) {
      if (seq !== scanSeq.current) { return; }
      log.error('omniSearch failed', { error: get(error, 'reason', error.message) });
      setScanError(get(error, 'reason', error.message));
    } finally {
      if (seq === scanSeq.current) { setScanning(false); }
    }
  }, []);

  // LOAD MORE: fetch the next single-band page (skip = rows already shown)
  // and append, deduped by _id (page 0 may have carried wide-band extras).
  const [loadingMoreBand, setLoadingMoreBand] = useState(null);
  const loadMore = useCallback(async function(resourceName) {
    const band = (bands || []).find(function(b) { return b.resourceName === resourceName; });
    if (!band) { return; }
    setLoadingMoreBand(resourceName);
    try {
      const result = await Meteor.rpc('providerDirectory.omniSearch', Object.assign(
        { q: query, resourceName: resourceName, skip: band.hits.length },
        facets
      ));
      const page = get(result, 'results.0', null);
      if (page) {
        setBands(function(current) {
          return (current || []).map(function(b) {
            if (b.resourceName !== resourceName) { return b; }
            const seen = new Set(b.hits.map(function(h) { return String(h._id); }));
            const appended = b.hits.concat(page.hits.filter(function(h) { return !seen.has(String(h._id)); }));
            return Object.assign({}, b, { hits: appended });
          });
        });
      }
    } catch (error) {
      log.error('loadMore failed', { resourceName: resourceName, error: get(error, 'reason', error.message) });
    } finally {
      setLoadingMoreBand(null);
    }
  }, [bands, query, facets]);

  // Census on boot.
  useEffect(function() {
    runScan('', {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced scan as the operator types.
  function handleQueryChange(event) {
    const next = event.target.value;
    setQuery(next);
    if (debounceRef.current) { clearTimeout(debounceRef.current); }
    debounceRef.current = setTimeout(function() { runScan(next, facets); }, 450);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      if (debounceRef.current) { clearTimeout(debounceRef.current); }
      runScan(query, facets);
    }
  }

  function handleFacetChange(key) {
    return function(event) {
      const next = Object.assign({}, facets);
      next[key] = event.target.value;
      setFacets(next);
      if (debounceRef.current) { clearTimeout(debounceRef.current); }
      debounceRef.current = setTimeout(function() { runScan(query, next); }, 450);
    };
  }

  function hailSuggestion(term) {
    return function() {
      setQuery(term);
      runScan(term, facets);
    };
  }

  const hasQuery = query.trim().length >= 2;

  return (
    <Box className="grid-console" sx={{
      height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      // Breathing room below the Header/ProminentHeader while chrome is up;
      // Ctrl+Shift+N collapses it (the flex cascade already reclaims the
      // header/footer rows, so 40px → 0 is the only page-side move). Matches
      // the header's own 0.3s retract animation.
      pt: navbarsVisible ? '40px' : 0,
      transition: 'padding-top 0.3s ease-in-out',
      // Transparent root: defer to StyledMainRouter's background.default + the
      // ambiance image (rules/ui/theming.md — root containers don't paint their
      // own page bgcolor). The translucent panels/overlays below keep content
      // readable over whatever app background shows through.
      background: 'transparent', position: 'relative',
      // atmosphere layers
      '&::before': {
        content: '""', position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(120% 90% at 15% -10%, color-mix(in srgb, var(--ink) 6%, transparent), transparent 55%),
          radial-gradient(90% 70% at 95% 110%, color-mix(in srgb, var(--ink) 3%, transparent), transparent 60%),
          repeating-linear-gradient(0deg, color-mix(in srgb, var(--ink) 2%, transparent) 0px, color-mix(in srgb, var(--ink) 2%, transparent) 1px, transparent 1px, transparent 3px)
        `
      },
      '&::after': {
        content: '""', position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: NOISE_URI, animation: 'gcFlicker 4s ease-in-out infinite'
      }
    }}>
      <style>{CONSOLE_STATIC_CSS}</style>
      <style>{consoleVars}</style>

      {/* Traveling sweep line — now a SIGNAL, not decoration. It runs while a
          SEARCH is in flight OR the conformance spider is probing
          anywhere (SPIDER_SCANNING contract), so the beam means "a scan is
          running." */}
      <SpiderScanLine active={scanning || spiderScanning} zIndex={1} />

      {/* scrollable console body */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', position: 'relative', zIndex: 2, px: { xl: '200px' } }}>
        <Box sx={{
          maxWidth: '1180px', ...bodyAlign,
          px: { xs: 2.5, md: 5 },
          pt: { xs: 3, md: 5 }, pb: 8,
          // Chrome retracted → the card runs the full page height to the
          // (hidden) footer edge; chrome up → content-height floating card.
          minHeight: navbarsVisible ? '0%' : '100%',
          boxSizing: 'border-box',
          transition: 'min-height 0.3s ease-in-out',
          // Column scrim: a soft canvas-tinted backdrop so content survives
          // bright photos. Strength comes from the image's curation record.
          // Gated on an active background — no gray slab over a plain canvas.
          background: activeBg
            ? `linear-gradient(180deg,
                ${alpha(theme.palette.background.default, scrimStrength)} 0%,
                ${alpha(theme.palette.background.default, scrimStrength * 0.85)} 100%)`
            : 'transparent',
          backdropFilter: activeBg ? 'blur(2px)' : 'none',
          borderRadius: '4px',
          '@media print': { background: 'transparent', backdropFilter: 'none' }
        }}>

          {/* ---- masthead ---- */}
          <Box className="gc-boot" sx={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end',
            justifyContent: 'space-between', gap: 2, mb: 4
          }}>
            <Box>
              <Box sx={{
                fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.34em',
                color: 'var(--stone)', mb: 1
              }}>
                NATIONAL PROVIDER <Box component="span" sx={{ color: 'var(--ink-dim)' }}>// NPPES // FHIR R4</Box>
              </Box>
              <Box component="h1" sx={{
                m: 0, fontFamily: 'var(--display)', fontWeight: 700,
                fontSize: 'clamp(40px, 6.5vw, 76px)', lineHeight: 0.95,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: 'var(--ink)'
              }}>
                Directory
              </Box>
            </Box>
            <Box sx={{
              fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.16em',
              color: 'var(--ink)', textAlign: 'right', lineHeight: 2
            }}>
              <Box><LastUpdated iso={lastUpdated} /></Box>
              <Box>
                UPLINK <Box component="span" sx={{ color: 'var(--green)' }}>◉ NOMINAL</Box>
                {'  ·  '}
                {gridTotal === null ? 'CENSUS…' : gridTotal.toLocaleString() + ' RECORDS'}
              </Box>
            </Box>
          </Box>

          {/* ---- census ticker ---- */}
          <Box className="gc-boot" sx={{
            display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)' },
            gap: '1px', background: 'var(--hairline)', border: '1px solid var(--hairline)',
            mb: 5, position: 'relative', animationDelay: '120ms'
          }}>
            <Brackets />
            {/* Practitioner ("Clinicians") is hidden from the census until that
                directory is populated — Practitioners and InsurancePlans return
                in a future update. BAND_CONFIG keeps its definition for the
                search result bands. */}
            {Object.keys(BAND_CONFIG).filter(function(resourceName) {
              return resourceName !== 'Practitioner';
            }).map(function(resourceName, index) {
              const config = BAND_CONFIG[resourceName];
              return (
                <Box key={resourceName} sx={{ background: 'var(--panel)', px: 2.5, py: 2 }}>
                  <TickerNumber value={totals ? get(totals, resourceName, 0) : null} delay={index * 140} />
                  <Box sx={{
                    fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.28em',
                    color: 'var(--ink-dim)', mt: 0.6
                  }}>
                    <Box component="span" sx={{ color: config.accent, mr: 0.8 }}>{config.sigil}</Box>
                    {config.label}
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* ---- the SEARCH bar ---- */}
          <Box className="gc-boot" sx={{ animationDelay: '240ms', mb: 1.5 }}>
            <Box sx={{
              position: 'relative', display: 'flex', alignItems: 'center', gap: 2.5,
              border: '1px solid var(--stone-dim)', background: 'var(--panel-hard)',
              px: { xs: 2, md: 3.5 }, py: { xs: 2, md: 2.8 }, overflow: 'hidden',
              transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
              '&:focus-within': {
                borderColor: 'var(--stone)',
                boxShadow: '0 0 34px color-mix(in srgb, var(--stone) 14%, transparent), inset 0 0 22px color-mix(in srgb, var(--stone) 4%, transparent)'
              }
            }}>
              <Brackets color="var(--amber-dim)" size={18} />
              <Box sx={{
                fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '11px',
                letterSpacing: '0.3em', color: 'var(--amber)', whiteSpace: 'nowrap',
                borderRight: '1px solid var(--hairline)', pr: 2.5, py: 0.5
              }}>
                SEARCH ▸
              </Box>
              <input
                id="gridHailInput"
                className="gc-hail-input"
                value={query}
                onChange={handleQueryChange}
                onKeyDown={handleKeyDown}
                placeholder="organizations · clinicians · sites · uplinks"
                autoComplete="off"
                spellCheck="false"
              />
              {!query ? (
                <Box sx={{
                  width: '12px', height: '26px', background: 'var(--amber)',
                  animation: 'gcCaret 1.1s step-end infinite', flexShrink: 0, opacity: 0.8
                }} />
              ) : null}
              {scanning ? (
                <Box sx={{
                  position: 'absolute', top: 0, bottom: 0, width: '38%', pointerEvents: 'none',
                  background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--stone) 10%, transparent), transparent)',
                  animation: 'gcScan 1.1s linear infinite'
                }} />
              ) : null}
            </Box>

            {/* status line under the bar */}
            <Box sx={{
              display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1,
              fontFamily: 'var(--mono)', fontSize: '9.5px', letterSpacing: '0.2em',
              color: 'var(--ink)', mt: 1, px: 0.5
            }}>
              <Box>
                {scanning
                  ? <Box component="span" sx={{ color: 'var(--stone)' }}>SCANNING {gridTotal === null ? '' : gridTotal.toLocaleString() + ' RECORDS ACROSS 4 BANDS…'}</Box>
                  : scanError
                    ? <Box component="span" sx={{ color: 'var(--magenta)' }}>SCAN FAULT — {String(scanError).toUpperCase()}</Box>
                    : hasQuery && scanMs !== null
                      ? <>RETURN IN <Box component="span" sx={{ color: 'var(--amber)' }}>{scanMs}ms</Box></>
                      : 'AWAITING QUERY'}
              </Box>
              <Box
                component="button"
                onClick={function() { setShowFacets(!showFacets); }}
                sx={{
                  all: 'unset', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: '9.5px',
                  letterSpacing: '0.2em', color: showFacets ? 'var(--amber)' : 'var(--ink-dim)',
                  '&:hover': { color: 'var(--amber)' }
                }}
              >
                <Box component="span" sx={{
                  display: 'inline-block', transition: 'transform 0.2s ease',
                  transform: showFacets ? 'rotate(90deg)' : 'none', mr: 0.8
                }}>▸</Box>
                PRECISION SCAN
              </Box>
            </Box>

            {/* precision-scan drawer */}
            <Collapse in={showFacets}>
              <Box sx={{
                display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 3,
                border: '1px solid var(--hairline)', borderTop: 'none',
                background: 'var(--panel)', px: 3, py: 2.5
              }}>
                {[['city', 'CITY'], ['state', 'STATE'], ['postalCode', 'POSTAL CODE']].map(function(pair) {
                  return (
                    <Box key={pair[0]}>
                      <Box sx={{
                        fontFamily: 'var(--mono)', fontSize: '8.5px', letterSpacing: '0.3em',
                        color: 'var(--ink-dim)', mb: 0.5
                      }}>
                        {pair[1]}
                      </Box>
                      <input
                        className="gc-facet-input"
                        value={facets[pair[0]]}
                        onChange={handleFacetChange(pair[0])}
                        onKeyDown={handleKeyDown}
                        placeholder="—"
                      />
                    </Box>
                  );
                })}
              </Box>
            </Collapse>
          </Box>

          {/* ---- results / idle state ---- */}
          <Box sx={{ mt: 4 }}>
            {/* Seeded sandboxes ride above the search bands (and above the
                idle state) whenever the session array holds records. */}
            {sandboxBand ? (
              <ResultBand
                key={'sandboxes-' + sandboxBand.matchCount}
                band={sandboxBand}
                config={SANDBOX_BAND_CONFIG}
                revealIndex={0}
              />
            ) : null}
            {bands === null ? (
              <Box className="gc-boot" sx={{ animationDelay: '360ms', textAlign: 'center', py: 6 }}>
                <Box sx={{
                  fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.24em',
                  color: 'var(--ink-dim)', mb: 3
                }}>
                  THE GRID HOLDS {gridTotal === null ? '…' : gridTotal.toLocaleString()} REGISTERED CONTACTS
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  {['Mayo', 'Baptist', 'Providence', 'Cardiology'].map(function(term) {
                    return (
                      <button key={term} className="gc-chip-btn" onClick={hailSuggestion(term)}>
                        {term.toUpperCase()}
                      </button>
                    );
                  })}
                </Box>
              </Box>
            ) : (
              bands.map(function(band, index) {
                const config = BAND_CONFIG[band.resourceName];
                if (!config) { return null; }
                return (
                  <ResultBand
                    key={band.resourceName + '-' + query}
                    band={band}
                    config={config}
                    revealIndex={index}
                    onLoadMore={loadMore}
                    loadingMore={loadingMoreBand === band.resourceName}
                  />
                );
              })
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default DirectoryConsole;
