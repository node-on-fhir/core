// imports/ui/profile/cards/ApiKeysCard.jsx
//
// Saved API keys — LLM providers (Anthropic, OpenAI, Google, xAI) plus
// arbitrary third-party services as custom name/value line items. Backed by
// the userApiKeys.* methods (imports/api/userApiKeys/methods.js); values are
// stored on the user document, never published — the list here is masked and
// full values come back only through userApiKeys.reveal.
//
// Empty state renders as a dashed AddRow ("Add API keys") that expands in
// place; once keys exist it graduates to a full pf-card with per-key rows.

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import {
  Box, Typography, TextField, Button, IconButton, Tooltip, MenuItem, Collapse
} from '@mui/material';

import VpnKeyIcon from '@mui/icons-material/VpnKey';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { ProfileCardHeader, AddRow, Kicker, ConfirmDialog } from '../ProfilePrimitives.jsx';
import { copyWithToast } from '../ProfileBarcode.jsx';
import { notify } from '/imports/lib/notify.js';

export const KNOWN_PROVIDERS = [
  { id: 'anthropic', label: 'Anthropic (Claude)', placeholder: 'sk-ant-...' },
  { id: 'openai', label: 'OpenAI (ChatGPT)', placeholder: 'sk-...' },
  { id: 'google', label: 'Google (Gemini)', placeholder: 'AIza...' },
  { id: 'xai', label: 'xAI (Grok)', placeholder: 'xai-...' },
  { id: 'custom', label: 'Other service…', placeholder: '' }
];

function providerDisplay(providerId) {
  const known = KNOWN_PROVIDERS.find(function(p) { return p.id === providerId; });
  return known ? known.label : providerId;
}

// ── Add-key form ─────────────────────────────────────────────────────────
// Shared by the empty state, the populated card, and the WelcomeDialog
// onboarding step — uses only theme tokens (no --pf-* vars) so it renders
// correctly outside the .profile-page scope.
export function AddKeyForm({ existingKeys = [], onSaved }) {
  const [provider, setProvider] = useState('anthropic');
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [saving, setSaving] = useState(false);

  const isCustom = provider === 'custom';
  const placeholder = get(KNOWN_PROVIDERS.find(function(p) { return p.id === provider; }), 'placeholder', '');
  const replacesExisting = !isCustom && existingKeys.some(function(k) { return k.provider === provider; });
  const canSave = value.trim().length > 0 && (!isCustom || label.trim().length > 0);

  async function handleSave() {
    setSaving(true);
    try {
      await Meteor.rpc('userApiKeys.save', {
        provider: provider,
        label: isCustom ? label.trim() : undefined,
        value: value.trim()
      });
      notify({ title: 'API key saved', severity: 'success' });
      setValue('');
      setLabel('');
      if (onSaved) { onSaved(); }
    } catch (error) {
      notify({ title: 'Save failed', message: error.reason || error.message, severity: 'error' });
    } finally {
      setSaving(false);
    }
  }

  // One row, uniform 40px controls: Service · [Name] · API key · Add
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: '4px 14px 12px' }}>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        <TextField
          select
          size="small"
          label="Service"
          value={provider}
          onChange={function(e) { setProvider(e.target.value); }}
          sx={{ minWidth: 200, flexShrink: 0 }}
        >
          {KNOWN_PROVIDERS.map(function(p) {
            return <MenuItem key={p.id} value={p.id}>{p.label}</MenuItem>;
          })}
        </TextField>
        {isCustom && (
          <TextField
            size="small"
            label="Name"
            value={label}
            onChange={function(e) { setLabel(e.target.value); }}
            placeholder="e.g. UMLS / VSAC"
            sx={{ minWidth: 160, flexShrink: 0 }}
          />
        )}
        <TextField
          size="small"
          type={showValue ? 'text' : 'password'}
          label="API key"
          value={value}
          onChange={function(e) { setValue(e.target.value.trim()); }}
          placeholder={placeholder}
          sx={{ flex: 1, minWidth: 220 }}
          InputProps={{
            endAdornment: (
              <IconButton size="small" onClick={function() { setShowValue(!showValue); }} edge="end">
                {showValue ? <VisibilityOffIcon sx={{ fontSize: 16 }} /> : <VisibilityIcon sx={{ fontSize: 16 }} />}
              </IconButton>
            )
          }}
        />
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          disabled={!canSave || saving}
          onClick={handleSave}
          sx={{ flexShrink: 0, height: 40, px: 2.5 }}
        >
          {saving ? 'Saving…' : replacesExisting ? 'Replace' : 'Add'}
        </Button>
      </Box>
      {replacesExisting && (
        <Typography variant="caption" color="text.secondary">
          You already have a {providerDisplay(provider)} key — saving replaces it.
        </Typography>
      )}
    </Box>
  );
}

// ── One saved-key row ────────────────────────────────────────────────────
function KeyRow({ entry, onDelete, onChanged }) {
  const [revealedValue, setRevealedValue] = useState(null);

  async function fetchValue() {
    const result = await Meteor.rpc('userApiKeys.reveal', { keyId: entry.keyId });
    return get(result, 'value', '');
  }

  async function handleToggleReveal() {
    if (revealedValue !== null) { setRevealedValue(null); return; }
    try {
      setRevealedValue(await fetchValue());
    } catch (error) {
      notify({ title: 'Reveal failed', message: error.reason || error.message, severity: 'error' });
    }
  }

  async function handleCopy() {
    try {
      copyWithToast(revealedValue !== null ? revealedValue : await fetchValue());
    } catch (error) {
      notify({ title: 'Copy failed', message: error.reason || error.message, severity: 'error' });
    }
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: '6px 14px' }}>
      <VpnKeyIcon sx={{ fontSize: 14, color: 'var(--pf-ink-faint)' }} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography noWrap variant="body2" sx={{ fontSize: 13, color: 'var(--pf-ink)' }}>
          {entry.label}
        </Typography>
        <Typography noWrap component="div" className="pf-mono" sx={{ fontSize: 11, color: 'var(--pf-ink-dim)' }}>
          {revealedValue !== null ? revealedValue : entry.maskedValue}
        </Typography>
      </Box>
      <Kicker>{entry.provider === 'custom' ? 'custom' : entry.provider}</Kicker>
      <Tooltip title={revealedValue !== null ? 'Hide' : 'Reveal'}>
        <IconButton size="small" onClick={handleToggleReveal}>
          {revealedValue !== null ? <VisibilityOffIcon sx={{ fontSize: 15 }} /> : <VisibilityIcon sx={{ fontSize: 15 }} />}
        </IconButton>
      </Tooltip>
      <Tooltip title="Copy">
        <IconButton size="small" onClick={handleCopy}>
          <ContentCopyIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Remove">
        <IconButton size="small" onClick={function() { onDelete(entry); }}>
          <DeleteOutlineIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

// ── The card ─────────────────────────────────────────────────────────────
export default function ApiKeysCard({ onKeysChange }) {
  const [keys, setKeys] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function loadKeys() {
    try {
      const result = await Meteor.rpc('userApiKeys.list', {});
      const list = result || [];
      setKeys(list);
      if (onKeysChange) { onKeysChange(list); }
    } catch (error) {
      console.warn('[ApiKeysCard] Failed to load keys:', error.reason || error.message);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(function() { loadKeys(); }, []);

  async function handleConfirmDelete() {
    if (!deleteTarget) { return; }
    try {
      await Meteor.rpc('userApiKeys.remove', { keyId: deleteTarget.keyId });
      notify({ title: 'API key removed', severity: 'success' });
      loadKeys();
    } catch (error) {
      notify({ title: 'Remove failed', message: error.reason || error.message, severity: 'error' });
    }
  }

  if (!loaded) { return null; }

  // Empty state: dashed add-row that expands into the add form in place
  if (keys.length === 0) {
    return (
      <AddRow id="apiKeysAddRow" icon={<VpnKeyIcon />} label="API keys — none yet" rightText="+ Add API keys">
        <Box className="pf-card">
          <ProfileCardHeader icon={<VpnKeyIcon />} title="Add API keys" kicker="stored on your profile" />
          <Typography variant="caption" sx={{ display: 'block', p: '4px 14px 0', color: 'var(--pf-ink-dim)' }}>
            Keys for LLM providers (used by the PDF scanner and AI features) or any third-party
            service. Stored server-side on your account and never published to the browser.
          </Typography>
          <AddKeyForm existingKeys={keys} onSaved={loadKeys} />
        </Box>
      </AddRow>
    );
  }

  return (
    <Box className="pf-card">
      <ProfileCardHeader
        icon={<VpnKeyIcon />}
        title="API keys"
        kicker={keys.length + ' saved'}
        action={
          <Tooltip title={addOpen ? 'Close' : 'Add a key'}>
            <IconButton size="small" onClick={function() { setAddOpen(!addOpen); }}>
              <AddIcon sx={{ fontSize: 16, transform: addOpen ? 'rotate(45deg)' : 'none', transition: 'transform 120ms' }} />
            </IconButton>
          </Tooltip>
        }
      />
      <Box sx={{ py: 0.5 }}>
        {keys.map(function(entry) {
          return (
            <KeyRow
              key={entry.keyId}
              entry={entry}
              onDelete={setDeleteTarget}
              onChanged={loadKeys}
            />
          );
        })}
      </Box>
      <Collapse in={addOpen} timeout={160}>
        <AddKeyForm existingKeys={keys} onSaved={function() { setAddOpen(false); loadKeys(); }} />
      </Collapse>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove API key"
        message={deleteTarget ? 'Remove the saved key "' + deleteTarget.label + '"? Features using it will need the key re-entered.' : ''}
        confirmLabel="Remove"
        destructive
        onConfirm={handleConfirmDelete}
        onClose={function() { setDeleteTarget(null); }}
      />
    </Box>
  );
}
