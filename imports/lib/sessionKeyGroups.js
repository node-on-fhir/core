// imports/lib/sessionKeyGroups.js
//
// Display grouping for the Session Inspector (Cmd/Ctrl+Shift+D). Classifies
// any Session key into a themed group so the inspector can render the app's
// internal state as an organized dashboard rather than a flat 600-key dump.
//
// The group boundaries mirror the contract families in SessionKeys.js /
// .claude/rules/meteor/session-keys.md — patient context, auth, app chrome,
// simulator, hexgrid, timeline, MainSearch.*, selectedXId — plus catch-all
// buckets for dialog/overlay flags and everything else.
//
// Isomorphic and dependency-free besides SessionKeys.js. Pure functions —
// unit-testable under node --test.

import {
  SELECTED_PATIENT, SELECTED_PATIENT_ID, SELECTED_PATIENT_MONGO_ID,
  SELECTED_PRACTITIONER_ID, SELECTED_PRACTITIONER_ROLE_ID,
  CURRENT_USER, SESSION_ID, ACCOUNTS_ACCESS_TOKEN, ACCOUNTS_REFRESH_TOKEN,
  SELECTED_ENDPOINT, SELECTED_ENDPOINT_ID,
  THEME, DISPLAY_NAVBARS, APP_HEIGHT, APP_WIDTH, VIEWPORT,
  SHOW_SYSTEM_IDS, SHOW_FHIR_IDS, SHOW_EXPERIMENTAL,
  SELECTED_CREWED_VEHICLE, SELECTED_BIOMARKER_CODE
} from './SessionKeys.js';

// Ordered — first match wins. Keep specific families ahead of the
// selectedXId catch-all, and the dialog/overlay heuristic ahead of Other.
export const SESSION_KEY_GROUPS = [
  {
    id: 'patient',
    label: 'Patient Context',
    exact: [SELECTED_PATIENT, SELECTED_PATIENT_ID, SELECTED_PATIENT_MONGO_ID,
            SELECTED_PRACTITIONER_ID, SELECTED_PRACTITIONER_ROLE_ID],
    prefixes: ['selectedPractitioner']
  },
  {
    id: 'auth',
    label: 'User & Auth',
    exact: [CURRENT_USER, SESSION_ID, ACCOUNTS_ACCESS_TOKEN, ACCOUNTS_REFRESH_TOKEN],
    prefixes: ['accounts', 'oauth']
  },
  {
    id: 'mainSearch',
    label: 'Provider Search (MainSearch.*)',
    exact: [],
    prefixes: ['MainSearch.']
  },
  {
    id: 'simulator',
    label: 'Orbital Simulator',
    exact: [SELECTED_CREWED_VEHICLE],
    prefixes: ['simulator']
  },
  {
    id: 'hexgrid',
    label: 'Hexgrid Board',
    exact: [],
    prefixes: ['hexgrid']
  },
  {
    id: 'timeline',
    label: 'Timeline',
    exact: [],
    prefixes: ['timeline', 'activeTimeline']
  },
  {
    id: 'endpoints',
    label: 'Endpoints & Sharing',
    exact: [SELECTED_ENDPOINT, SELECTED_ENDPOINT_ID, 'spiderScanning', 'sandboxEndpoints'],
    prefixes: []
  },
  {
    id: 'biomarkers',
    label: 'Biomarkers',
    exact: [SELECTED_BIOMARKER_CODE],
    prefixes: []
  },
  {
    id: 'chrome',
    label: 'App Chrome & Theme',
    exact: [THEME, DISPLAY_NAVBARS, APP_HEIGHT, APP_WIDTH, VIEWPORT,
            'sessionInspectorOpen', 'quickSearchOpen', 'luxMode', 'pageMode', 'cardSurface',
            'pageSurfaceOverrides', 'ambianceHudOpen'],
    prefixes: ['display']
  },
  {
    id: 'toggles',
    label: 'Display Toggles',
    exact: [SHOW_SYSTEM_IDS, SHOW_FHIR_IDS, SHOW_EXPERIMENTAL],
    prefixes: ['show', 'hide', 'enable', 'disable']
  },
  {
    id: 'selectedResources',
    label: 'Selected Resources',
    exact: [],
    prefixes: [],
    pattern: /^selected[A-Z]/
  },
  {
    id: 'dialogs',
    label: 'Dialogs & Overlays',
    exact: [],
    prefixes: [],
    pattern: /Dialog|Modal|Drawer|(Open|Opened|Visible|Expanded)$/
  },
  {
    id: 'other',
    label: 'Other',
    exact: [],
    prefixes: []
  }
];

// Values that must never render in cleartext, even in a local debug tool.
// accountsAccessToken/accountsRefreshToken match 'token'; anything a package
// stashes under a *secret*/*password*-ish name gets caught too.
const SENSITIVE_KEY_PATTERN = /token|secret|password|passwd|credential|apikey|api[-_]key|privatekey/i;

export function isSensitiveSessionKey(key) {
  return SENSITIVE_KEY_PATTERN.test(String(key || ''));
}

export function classifySessionKey(key) {
  const k = String(key || '');
  for (const group of SESSION_KEY_GROUPS) {
    if (group.exact && group.exact.indexOf(k) !== -1) {
      return group.id;
    }
    if (group.prefixes && group.prefixes.some(function(p) { return k.indexOf(p) === 0; })) {
      return group.id;
    }
    if (group.pattern && group.pattern.test(k)) {
      return group.id;
    }
  }
  return 'other';
}

// Turn a { key: value } snapshot (Session.all()) into ordered groups for
// rendering: [{ id, label, entries: [{ key, value, sensitive }] }], with
// empty groups omitted and entries sorted by key within each group.
export function groupSessionSnapshot(snapshot) {
  const byGroup = {};
  Object.keys(snapshot || {}).forEach(function(key) {
    const groupId = classifySessionKey(key);
    if (!byGroup[groupId]) {
      byGroup[groupId] = [];
    }
    byGroup[groupId].push({
      key: key,
      value: snapshot[key],
      sensitive: isSensitiveSessionKey(key)
    });
  });

  return SESSION_KEY_GROUPS
    .filter(function(group) { return byGroup[group.id] && byGroup[group.id].length > 0; })
    .map(function(group) {
      return {
        id: group.id,
        label: group.label,
        entries: byGroup[group.id].sort(function(a, b) { return a.key.localeCompare(b.key); })
      };
    });
}

export default { SESSION_KEY_GROUPS, classifySessionKey, isSensitiveSessionKey, groupSessionSnapshot };
