// imports/ui/theming/useThemeDraft.js
//
// Studio draft state. The draft NEVER touches the live app; only publish()
// writes into Meteor.settings.public.theme and pokes themeRefreshRequest —
// the same authority chain as the presets/dialog helpers.

import { useState, useCallback } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';
import { DEFAULT_DRAFT, settingsToDraft, draftToSettings } from './themeDraft.js';
import { getPreset, deriveLight } from '../themePresets.js';
import { loadClinicThemes, saveClinicTheme } from '/imports/lib/themePersistence.js';

// Build a draft from a preset's (dark-authored) palette, deriving the light
// column from the primary hue so both columns start populated.
export function presetToDraft(presetId) {
  const preset = getPreset(presetId);
  if (!preset) { return Object.assign({}, DEFAULT_DRAFT); }
  const fromPalette = settingsToDraft({
    darkMode: preset.mode === 'dark',
    palette: preset.palette,
    typography: { fontFamily: preset.fontFamily || '' }
  });
  const draft = Object.assign({}, DEFAULT_DRAFT, fromPalette, {
    name: 'Cloned from ' + preset.name,
    base: presetId,
    mode: preset.mode || 'light'
  });
  return Object.assign(draft, deriveLight(draft));
}

// Decode a ?theme= share-link param (base64url JSON). Returns null on any error.
export function decodeShareParam(search) {
  try {
    const params = new URLSearchParams(search || '');
    const encoded = params.get('theme');
    if (!encoded) { return null; }
    const json = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(json);
    return (parsed && typeof parsed === 'object') ? Object.assign({}, DEFAULT_DRAFT, parsed) : null;
  } catch (error) {
    return null;
  }
}

export function useThemeDraft() {
  const [draft, setDraft] = useState(function() {
    const shared = decodeShareParam(typeof window !== 'undefined' ? window.location.search : '');
    if (shared) { return shared; }
    return settingsToDraft(get(Meteor, 'settings.public.theme', {}));
  });
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(function() { return loadClinicThemes(); });
  const [savedId, setSavedId] = useState(null);

  const patch = useCallback(function(partial) {
    setDraft(function(current) { return Object.assign({}, current, partial); });
    setDirty(true);
  }, []);

  const loadPreset = useCallback(function(presetId) {
    setDraft(presetToDraft(presetId));
    setSavedId(null);
    setDirty(true);
  }, []);

  const loadSaved = useCallback(function(id) {
    const entry = loadClinicThemes().find(function(item) { return item.id === id; });
    if (!entry) { return; }
    setDraft(Object.assign({}, DEFAULT_DRAFT, entry.draft));
    setSavedId(id);
    setDirty(false);
  }, []);

  // NOTE: save/publish/shareLink close over `draft` directly (with deps) —
  // reading state via a setDraft updater side effect would NOT run
  // synchronously under React 18 and would return stale values.
  const save = useCallback(function() {
    const list = saveClinicTheme({ id: savedId, name: draft.name, draft: draft });
    const record = savedId
      ? list.find(function(item) { return item.id === savedId; })
      : list[list.length - 1];
    const resultId = record ? record.id : null;
    setSaved(list);
    setSavedId(resultId);
    setDirty(false);
    return resultId;
  }, [draft, savedId]);

  const publish = useCallback(function() {
    save();
    const themeSettings = draftToSettings(draft);
    if (!Meteor.settings) { Meteor.settings = {}; }
    if (!Meteor.settings.public) { Meteor.settings.public = {}; }
    Meteor.settings.public.theme = Object.assign({}, Meteor.settings.public.theme, themeSettings);
    // Deep keys need explicit replacement (Object.assign is shallow).
    Meteor.settings.public.theme.palette = themeSettings.palette;
    Meteor.settings.public.theme.typography = themeSettings.typography;
    Meteor.settings.public.theme.shape = themeSettings.shape;
    Session.set('theme', draft.mode);
    Session.set('themeRefreshRequest', true);
    setDirty(false);
  }, [draft, save]);

  const shareLink = useCallback(function() {
    const json = JSON.stringify(draft);
    const encoded = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return window.location.origin + '/theming?theme=' + encoded;
  }, [draft]);

  return { draft, dirty, saved, savedId, patch, loadPreset, loadSaved, save, publish, shareLink };
}
