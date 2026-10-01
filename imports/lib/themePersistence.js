// imports/lib/themePersistence.js
//
// Persist the user's theme choice so it survives a reload. v1 = localStorage,
// per-browser, applied at client boot before the theme paints.
//
// Shape (all optional, merge-written):
//   { presetId, accentHue, fontFamily, mode, backgroundImagePath,
//     pageMode, cardSurface,
//     pageSurfaceOverrides: { <pathname>: 'solid'|'flat' },
//     paletteOverrides: { <paletteKey>: <hex> } }
// paletteOverrides are per-field colors set in the PaletteFieldEditor; they
// re-apply at boot AFTER the preset (so they win) and are cleared when a new
// preset is chosen. Passing paletteOverrides: null in a patch clears them.
// pageMode ('light'|'dark') is the ambiance content-ink override; cardSurface
// ('solid'|'glass'|'flat') is the card surface state. Both consumed only by
// ambiance/fluid routes (see the 2026-08-03 ambiance spec).
// pageSurfaceOverrides is the Ctrl+Shift+K per-route card↔full-height map;
// malformed entries are dropped at boot (unknown values treated as unset).
//
// Follow-up (documented, not built): a per-user MongoDB sink so the choice
// follows the account across devices — saveThemeChoice() gains a second write
// and a load-on-login path re-applies it. The shape below is already
// account-portable.

const STORAGE_KEY = 'honeycomb.theme';

function hasStorage() {
  return typeof window !== 'undefined' && !!window.localStorage;
}

// Merge-write: each control saves only the field it owns, so partial saves
// (hue-only, font-only) don't clobber the rest of the choice.
export function saveThemeChoice(patch) {
  if (!hasStorage() || !patch) { return; }
  try {
    const current = loadThemeChoice() || {};
    const next = Object.assign({}, current, patch);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    // storage full / disabled — non-fatal, theme just won't persist
  }
}

export function loadThemeChoice() {
  if (!hasStorage()) { return null; }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

export function clearThemeChoice() {
  if (!hasStorage()) { return; }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // non-fatal
  }
}

// ---- Clinic themes (named saved themes, per-browser) ------------------------
// v1 localStorage list, same posture as the theme choice above: the shape
// ({id, name, draft, updatedAt}) is already account/org-portable for the
// future ClinicThemes collection (see the Theming Studio spec §Follow-ups).

const CLINIC_KEY = 'honeycomb.clinicThemes';
let clinicIdCounter = 0;

export function loadClinicThemes() {
  if (!hasStorage()) { return []; }
  try {
    const raw = window.localStorage.getItem(CLINIC_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

// Upsert by id; generates an id when absent. Returns the updated list.
export function saveClinicTheme(entry) {
  if (!hasStorage() || !entry) { return loadClinicThemes(); }
  const list = loadClinicThemes();
  const record = {
    id: entry.id || ('ct-' + Date.now().toString(36) + '-' + (clinicIdCounter++)),
    name: entry.name || 'Untitled theme',
    draft: entry.draft || {},
    updatedAt: new Date().toISOString()
  };
  const index = list.findIndex(function(item) { return item.id === record.id; });
  if (index >= 0) { list[index] = record; } else { list.push(record); }
  try {
    window.localStorage.setItem(CLINIC_KEY, JSON.stringify(list));
  } catch (error) {
    // storage full / disabled — non-fatal
  }
  return list;
}

export function deleteClinicTheme(id) {
  const list = loadClinicThemes().filter(function(item) { return item.id !== id; });
  try {
    window.localStorage.setItem(CLINIC_KEY, JSON.stringify(list));
  } catch (error) {
    // non-fatal
  }
  return list;
}
