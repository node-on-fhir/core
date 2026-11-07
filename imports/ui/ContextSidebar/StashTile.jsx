// imports/ui/ContextSidebar/StashTile.jsx
//
// One tile per stashed item (ContextSidebar artboard C): type badge + label
// at rest, quick actions on hover (copy / pin / remove), click to expand
// (JSON preview, Copy JSON, Rename). Text tiles render dashed. Copy always
// writes the full payload to the system clipboard — the escape hatch for
// inputs that don't know about the panel.
import React, { useState } from 'react';
import moment from 'moment';
import lodash from 'lodash';
import {
  Box, Typography, IconButton, Button, Chip, TextField, Tooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import { formatBytes } from '/imports/lib/contextSidebar/fhirDisplay.js';

const get = lodash.get;

function payloadAsText(item) {
  if (item.kind === 'text') return String(item.payload || '');
  try {
    return JSON.stringify(item.payload, null, 2);
  } catch (error) {
    return String(item.payload);
  }
}

export function StashTile({ item, onPin, onRemove, onRename, onCopied }) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(item.label || '');

  const isText = item.kind === 'text';
  const badgeLabel = isText ? 'Text' : (item.resourceType || 'FHIR');

  function handleCopy(event) {
    if (event) event.stopPropagation();
    try {
      navigator.clipboard.writeText(payloadAsText(item));
      if (onCopied) onCopied(item);
    } catch (error) {
      console.warn('[context-sidebar] clipboard copy failed:', error.message);
    }
  }

  function commitRename() {
    setRenaming(false);
    const next = renameValue.trim();
    if (next && next !== item.label) {
      onRename(item, next);
    }
  }

  const provenance = [
    item.summary,
    get(item, 'source.sessionKey') ? 'snapshot of ' + item.source.sessionKey : get(item, 'source.route', ''),
    item.createdAt ? moment(item.createdAt).fromNow() : ''
  ].filter(Boolean).join(' · ');

  return (
    <Box
      id={'stashTile-' + item._id}
      component="button"
      type="button"
      aria-label={badgeLabel + ' ' + (item.label || '')}
      onClick={function() { setExpanded(!expanded); }}
      onMouseEnter={function() { setHovered(true); }}
      onMouseLeave={function() { setHovered(false); }}
      sx={{
        all: 'unset', boxSizing: 'border-box', display: 'block', width: '100%',
        cursor: 'pointer', mb: 1, p: 1.25,
        bgcolor: 'background.paper',
        border: '1px ' + (isText ? 'dashed' : 'solid'), borderColor: 'divider', borderRadius: 1,
        '&:hover': { borderColor: 'text.secondary' },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' }
      }}
    >
      {/* Top row: badge · label · (size | quick actions) */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <Chip size="small" variant="outlined" label={badgeLabel} sx={{ flexShrink: 0, fontFamily: isText ? 'inherit' : 'inherit' }} />
        <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 0, flex: 1 }} noWrap>
          {item.label || '(unnamed)'}
        </Typography>
        {item.pinned && !hovered && (
          <PushPinIcon sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
        )}
        {hovered ? (
          <Box sx={{ display: 'flex', flexShrink: 0 }} onClick={function(e) { e.stopPropagation(); }}>
            <Tooltip title="Copy to clipboard">
              <IconButton size="small" onClick={handleCopy}>
                <ContentCopyIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={item.pinned ? 'Unpin' : 'Pin (survives cap eviction)'}>
              <IconButton size="small" onClick={function() { onPin(item, !item.pinned); }}>
                {item.pinned ? <PushPinIcon sx={{ fontSize: 15 }} /> : <PushPinOutlinedIcon sx={{ fontSize: 15 }} />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove">
              <IconButton size="small" onClick={function() { onRemove(item); }}>
                <DeleteOutlineIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            {formatBytes(item.bytes)}
          </Typography>
        )}
      </Box>

      {/* Provenance line */}
      {provenance && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }} noWrap>
          {provenance}
        </Typography>
      )}

      {/* Expanded: preview + actions */}
      {expanded && (
        <Box sx={{ mt: 1 }} onClick={function(e) { e.stopPropagation(); }}>
          <Box component="pre" sx={{
            m: 0, p: 1, maxHeight: 180, overflow: 'auto',
            fontFamily: 'monospace', fontSize: '0.7rem', lineHeight: 1.5,
            whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            bgcolor: 'action.hover', borderRadius: 1
          }}>
            {payloadAsText(item).substring(0, 2048)}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button size="small" startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />} onClick={handleCopy}>
              Copy JSON
            </Button>
            {renaming ? (
              <TextField
                size="small"
                autoFocus
                value={renameValue}
                onChange={function(e) { setRenameValue(e.target.value); }}
                onKeyDown={function(e) {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') { setRenaming(false); setRenameValue(item.label || ''); }
                }}
                onBlur={commitRename}
                sx={{ flex: 1, minWidth: 140 }}
              />
            ) : (
              <Button
                size="small"
                startIcon={<DriveFileRenameOutlineIcon sx={{ fontSize: 14 }} />}
                onClick={function() { setRenameValue(item.label || ''); setRenaming(true); }}
              >
                Rename
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default StashTile;
