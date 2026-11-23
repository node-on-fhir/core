// imports/ui/ContextSidebar/PasteFromContextButton.jsx
//
// Interim paste bridge (until the Phase 2 usePasteTarget/paste-mode lands):
// a button that opens a menu of the caller's stash tiles and hands the
// chosen item's payload to onPaste as paste-ready text. Drop it next to any
// textarea/editor that should accept Context content.
//   <PasteFromContextButton onPaste={(text, item) => setValue(text)} />
// Optional `filter(item) => bool` narrows the list (e.g. Bundles only).
import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import {
  Button, Menu, MenuItem, ListItemText, Chip, Typography, Box
} from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';

import { ContextStash } from '/imports/lib/schemas/SimpleSchemas/ContextStash';
import { stashPayloadText, formatBytes } from '/imports/lib/contextSidebar/fhirDisplay.js';

export function PasteFromContextButton({ onPaste, filter, children, size, variant, sx, id }) {
  const [anchor, setAnchor] = useState(null);

  const { items, ready } = useTracker(function() {
    if (!anchor) return { items: [], ready: false };
    const handle = Meteor.subscribe('contextStash.mine');
    return {
      items: ContextStash.find({}, { sort: { pinned: -1, createdAt: -1 } }).fetch(),
      ready: handle.ready()
    };
  }, [anchor]);

  const visible = typeof filter === 'function' ? items.filter(filter) : items;

  function pick(item) {
    setAnchor(null);
    onPaste(stashPayloadText(item), item);
  }

  return (
    <>
      <Button
        id={id || 'pasteFromContextButton'}
        size={size || 'small'}
        variant={variant || 'outlined'}
        startIcon={<Inventory2OutlinedIcon fontSize="small" />}
        onClick={function(e) { setAnchor(e.currentTarget); }}
        sx={sx}
      >
        {children || 'Paste from Context'}
      </Button>
      <Menu anchorEl={anchor} open={!!anchor} onClose={function() { setAnchor(null); }}>
        {!ready ? (
          <MenuItem disabled>Loading your stash…</MenuItem>
        ) : visible.length === 0 ? (
          <MenuItem disabled>
            <ListItemText
              primary="Nothing stashed yet"
              secondary="⌃⇧X stashes the current selection; ⌃⇧P opens the panel"
            />
          </MenuItem>
        ) : (
          visible.map(function(item) {
            return (
              <MenuItem key={item._id} onClick={function() { pick(item); }} sx={{ maxWidth: 420 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, width: '100%' }}>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={item.kind === 'text' ? 'Text' : (item.resourceType || 'FHIR')}
                    sx={{ flexShrink: 0 }}
                  />
                  <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
                    {item.label || '(unnamed)'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                    {formatBytes(item.bytes)}
                  </Typography>
                </Box>
              </MenuItem>
            );
          })
        )}
      </Menu>
    </>
  );
}

export default PasteFromContextButton;
