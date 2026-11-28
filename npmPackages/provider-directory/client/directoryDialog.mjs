// npmPackages/provider-directory/client/directoryDialog.mjs
//
// Package-local dialog store for the National Directory. Replaces the dead
// Session-key dialog bus (whose host component never existed in this app) with a
// tiny external store that client/DirectoryDialogHost.jsx renders through
// React's useSyncExternalStore.
//
// Deliberately dependency-free (no Meteor / Session / React imports) and named
// .mjs so it loads identically under the app bundler and under `node --test`
// (this package's package.json has no "type": "module", so a .js file with ES
// module syntax would be parsed as CommonJS by the CI node).
//
// HOST OWNERSHIP: the host is mounted from more than one place (every
// footer-button route element, and the classic faceted-search page), so several
// hosts can be mounted at once. Exactly one may render the dialog. Claimants are
// kept in claim order and the OWNER IS THE EARLIEST CLAIMANT STILL MOUNTED.
// Releasing the owner hands ownership to the next claimant in line (nobody, if
// there is none). Every ownership change notifies subscribers, so hosts
// re-render and React mount order does not matter. When the last host releases,
// the dialog is closed, so a dialog left open by a route change cannot reappear
// on whichever host mounts next.

const CLOSED_STATE = Object.freeze({
  open: false,
  component: null,
  title: '',
  maxWidth: 'sm',
  json: null,
  returnKey: null
});

let state = CLOSED_STATE;
let hostClaims = [];
const listeners = new Set();

function notify() {
  Array.from(listeners).forEach(function(listener) {
    listener();
  });
}

function pick(options, key, fallback) {
  if (options && options[key] !== undefined && options[key] !== null) {
    return options[key];
  }
  return fallback;
}

// Current snapshot. The object is frozen and is REPLACED (never mutated) on
// every change, so reference equality is a valid change test.
export function getDirectoryDialog() {
  return state;
}

export function subscribeDirectoryDialog(listener) {
  listeners.add(listener);
  return function unsubscribe() {
    listeners.delete(listener);
  };
}

// openDirectoryDialog({ component, title, maxWidth, json, returnKey })
//   component - name of an entry in the DialogComponents registry (client.js)
//   returnKey - Session key a picker should write its selection to (MainSearch.*)
export function openDirectoryDialog(options) {
  state = Object.freeze({
    open: true,
    component: pick(options, 'component', null),
    title: pick(options, 'title', ''),
    maxWidth: pick(options, 'maxWidth', 'sm'),
    json: pick(options, 'json', null),
    returnKey: pick(options, 'returnKey', null)
  });
  notify();
  return state;
}

// Closes the dialog. Only `open` flips; component/title/returnKey are kept so
// the content stays rendered through the MUI close transition (and a picker
// that closes first and reads returnKey second still finds it).
export function closeDirectoryDialog() {
  if (!state.open) {
    return state;
  }
  state = Object.freeze(Object.assign({}, state, { open: false }));
  notify();
  return state;
}

export function toggleDirectoryDialog(options) {
  if (state.open) {
    return closeDirectoryDialog();
  }
  return openDirectoryDialog(options);
}

// --- host ownership -------------------------------------------------------

export function getDirectoryDialogHostOwner() {
  return hostClaims.length > 0 ? hostClaims[0] : null;
}

export function isDirectoryDialogHostOwner(id) {
  return hostClaims.length > 0 && hostClaims[0] === id;
}

// Idempotent. Returns true when `id` is the owner after the claim.
export function claimDirectoryDialogHost(id) {
  if (hostClaims.indexOf(id) === -1) {
    hostClaims = hostClaims.concat([id]);
    notify();
  }
  return isDirectoryDialogHostOwner(id);
}

export function releaseDirectoryDialogHost(id) {
  if (hostClaims.indexOf(id) === -1) {
    return;
  }
  hostClaims = hostClaims.filter(function(claim) {
    return claim !== id;
  });
  if (hostClaims.length === 0 && state.open) {
    // no host left to render it; don't leave it armed for the next mount
    state = Object.freeze(Object.assign({}, state, { open: false }));
  }
  notify();
}

// Test helper: restore the initial state and drop all claims and listeners.
export function resetDirectoryDialog() {
  state = CLOSED_STATE;
  hostClaims = [];
  listeners.clear();
}
