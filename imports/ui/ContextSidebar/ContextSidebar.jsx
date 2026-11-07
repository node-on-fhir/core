// imports/ui/ContextSidebar/ContextSidebar.jsx
//
// The Context stash panel (Ctrl/Cmd+Shift+P) — right-edge mirror of the left
// Sidebar, browse mode (Phase 1). Subscribes to the caller's own stash
// (contextStash.mine), renders filter + type chips + tile list + drop-zone
// footer. Paste mode / session-context section / usePasteTarget land in
// Phase 2 (spec: fable/superpowers/specs/2026-11-07-context-sidebar-design.md).
import React, { useState, useRef } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import lodash from 'lodash';
import {
  Box, Drawer, Typography, IconButton, Button, Chip, TextField,
  InputAdornment, Collapse, Snackbar, Alert, Tooltip
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';

import { CONTEXT_SIDEBAR_OPEN } from '/imports/lib/SessionKeys.js';
import { ContextStash } from '/imports/lib/schemas/SimpleSchemas/ContextStash';
import { contextSidebarStore } from '/imports/lib/contextSidebar/contextSidebarStore.js';
import StashTile from './StashTile.jsx';

const get = lodash.get;

const PANEL_WIDTH = 380;
const STASH_CAP = 50;

export function ContextSidebar() {
  const [filterText, setFilterText] = useState('');
  const [typeFilter, setTypeFilter] = useState(null); // null = All
  const [clipboardExpanded, setClipboardExpanded] = useState(true);
  const [toast, setToast] = useState(null); // { message, undoId } | null
  const dropRef = useRef(null);

  const open = useTracker(function() {
    return !!Session.get(CONTEXT_SIDEBAR_OPEN);
  }, []);

  const { items, ready } = useTracker(function() {
    if (!open) return { items: [], ready: false };
    const handle = Meteor.subscribe('contextStash.mine');
    return {
      items: ContextStash.find({}, { sort: { pinned: -1, createdAt: -1 } }).fetch(),
      ready: handle.ready()
    };
  }, [open]);

  const lastStash = useTracker(function() {
    return Session.get(contextSidebarStore.LAST_STASH_KEY);
  }, []);

  // Surface a toast when something was stashed while the panel is open
  // (in-panel drops) or just opened after a hotkey stash.
  const lastToastAtRef = useRef(null);
  React.useEffect(function() {
    if (!lastStash || !open) return;
    const at = String(get(lastStash, 'at', ''));
    if (at && at !== lastToastAtRef.current) {
      lastToastAtRef.current = at;
      setToast({
        message: 'Stashed ' + get(lastStash, 'resourceType', 'item') + ' — ' + get(lastStash, 'label', ''),
        undoId: get(lastStash, '_id', null)
      });
    }
  }, [lastStash, open]);

  function close() {
    contextSidebarStore.close();
  }

  // --- filtering -----------------------------------------------------------
  const needle = filterText.trim().toLowerCase();
  const filtered = items.filter(function(item) {
    if (typeFilter && (item.resourceType || 'Text') !== typeFilter) return false;
    if (!needle) return true;
    const haystack = [
      item.resourceType, item.label, item.summary, get(item, 'source.route', '')
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.indexOf(needle) !== -1;
  });

  const typeCounts = {};
  items.forEach(function(item) {
    const type = item.resourceType || 'Text';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  // --- tile actions ---------------------------------------------------------
  async function handlePin(item, pinned) {
    try {
      await Meteor.rpc('contextStash.pin', { stashId: item._id, pinned: pinned });
    } catch (error) {
      setToast({ message: 'Pin failed: ' + (error.reason || error.message), undoId: null });
    }
  }
  async function handleRemove(item) {
    try {
      await Meteor.rpc('contextStash.remove', { stashId: item._id });
    } catch (error) {
      setToast({ message: 'Remove failed: ' + (error.reason || error.message), undoId: null });
    }
  }
  async function handleRename(item, label) {
    try {
      await Meteor.rpc('contextStash.rename', { stashId: item._id, label: label });
    } catch (error) {
      setToast({ message: 'Rename failed: ' + (error.reason || error.message), undoId: null });
    }
  }
  async function handleClearUnpinned() {
    try {
      await Meteor.rpc('contextStash.clearUnpinned');
    } catch (error) {
      setToast({ message: 'Clear failed: ' + (error.reason || error.message), undoId: null });
    }
  }
  async function handleUndo() {
    if (toast && toast.undoId) {
      try {
        await Meteor.rpc('contextStash.remove', { stashId: toast.undoId });
      } catch (error) {
        // row already gone — fine
      }
    }
    setToast(null);
  }

  // --- drop zone / paste-into-panel ----------------------------------------
  async function stashRaw(text, meta) {
    try {
      await contextSidebarStore.stashUnknown(text, meta);
    } catch (error) {
      setToast({ message: 'Stash failed: ' + (error.reason || error.message), undoId: null });
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    const files = get(event, 'dataTransfer.files', []);
    if (files && files.length > 0) {
      Array.prototype.slice.call(files, 0, 5).forEach(function(file) {
        const reader = new FileReader();
        reader.onload = function() { stashRaw(String(reader.result), { label: file.name }); };
        reader.readAsText(file);
      });
      return;
    }
    const text = event.dataTransfer.getData('text');
    if (text) stashRaw(text, {});
  }

  function handlePanelPaste(event) {
    const text = event.clipboardData ? event.clipboardData.getData('text') : '';
    if (text) {
      event.preventDefault();
      stashRaw(text, {});
    }
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={close}
      PaperProps={{ sx: { width: { xs: '100%', sm: PANEL_WIDTH }, display: 'flex', flexDirection: 'column' } }}
    >
      <Box
        id="contextSidebar"
        onPaste={handlePanelPaste}
        onDragOver={function(e) { e.preventDefault(); }}
        onDrop={handleDrop}
        sx={{ display: 'flex', flexDirection: 'column', height: '100%', outline: 'none' }}
        tabIndex={-1}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Context</Typography>
          <Chip size="small" variant="outlined" label="^⇧P" sx={{ fontFamily: 'monospace' }} />
          <Box sx={{ flex: 1 }} />
          <IconButton id="contextSidebarCloseButton" size="small" onClick={close} aria-label="Close context panel">
            <ChevronRightIcon />
          </IconButton>
        </Box>

        {/* Filter */}
        <Box sx={{ px: 2, pt: 1.5, flexShrink: 0 }}>
          <TextField
            id="contextSidebarFilter"
            fullWidth
            size="small"
            placeholder="Filter by type, name, id, code…"
            value={filterText}
            onChange={function(e) { setFilterText(e.target.value); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
            <Chip
              size="small"
              label={'All ' + items.length}
              color={typeFilter === null ? 'primary' : 'default'}
              variant={typeFilter === null ? 'filled' : 'outlined'}
              onClick={function() { setTypeFilter(null); }}
            />
            {Object.keys(typeCounts).sort().map(function(type) {
              return (
                <Chip
                  key={type}
                  size="small"
                  label={type + ' ' + typeCounts[type]}
                  color={typeFilter === type ? 'primary' : 'default'}
                  variant={typeFilter === type ? 'filled' : 'outlined'}
                  onClick={function() { setTypeFilter(typeFilter === type ? null : type); }}
                />
              );
            })}
          </Box>
        </Box>

        {/* Clipboard section */}
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', px: 2, pt: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton size="small" onClick={function() { setClipboardExpanded(!clipboardExpanded); }}>
              {clipboardExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
              Clipboard
            </Typography>
            <Typography variant="caption" color="text.secondary">{items.length}</Typography>
            <Box sx={{ flex: 1 }} />
            {items.some(function(i) { return !i.pinned; }) && (
              <Button size="small" onClick={handleClearUnpinned} sx={{ textTransform: 'none' }}>
                Clear unpinned
              </Button>
            )}
          </Box>
          <Collapse in={clipboardExpanded}>
            {!ready && open ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                Loading your stash…
              </Typography>
            ) : filtered.length === 0 ? (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <InventoryIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {items.length === 0
                    ? 'Nothing stashed yet. ⌃⇧X stashes the current selection; drop JSON below.'
                    : 'Nothing matches the filter.'}
                </Typography>
              </Box>
            ) : (
              filtered.map(function(item) {
                return (
                  <StashTile
                    key={item._id}
                    item={item}
                    onPin={handlePin}
                    onRemove={handleRemove}
                    onRename={handleRename}
                    onCopied={function(copied) {
                      setToast({ message: 'Copied ' + (copied.resourceType || 'text') + ' to clipboard', undoId: null });
                    }}
                  />
                );
              })
            )}
          </Collapse>
        </Box>

        {/* Footer: drop zone + counts + expiry */}
        <Box sx={{ flexShrink: 0, borderTop: 1, borderColor: 'divider', px: 2, py: 1.5 }}>
          <Box
            id="stashDropZone"
            ref={dropRef}
            sx={{
              p: 1.25, border: '1px dashed', borderColor: 'divider', borderRadius: 1,
              display: 'flex', alignItems: 'center', gap: 1, mb: 1
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              📋 Drop JSON, or paste here to stash
            </Typography>
            <Chip size="small" variant="outlined" label="⌃⇧X" sx={{ fontFamily: 'monospace' }} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              {items.length} / {STASH_CAP} · saved to your account
            </Typography>
            <Typography variant="caption" color="text.secondary">
              expires on CLEAR PATIENT · logout
            </Typography>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={function() { setToast(null); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={function() { setToast(null); }}
          action={toast && toast.undoId ? (
            <Button color="inherit" size="small" onClick={handleUndo}>Undo</Button>
          ) : undefined}
          sx={{ alignItems: 'center' }}
        >
          {toast ? toast.message : ''}
        </Alert>
      </Snackbar>
    </Drawer>
  );
}

export default ContextSidebar;
