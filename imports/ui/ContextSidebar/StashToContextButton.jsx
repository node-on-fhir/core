// imports/ui/ContextSidebar/StashToContextButton.jsx
//
// Drop-anywhere "Stash to Context" button — the standard way any export (or
// other data-producing surface) feeds the ContextSidebar. The surface
// supplies getPayload(), returning ONE of:
//   { resource }                      — a single FHIR resource
//   { resources, asBundle?, label? }  — a set (wrapped as a collection
//                                       Bundle unless asBundle: false)
//   { text, label? }                  — raw text / NDJSON (JSON with a
//                                       resourceType becomes a fhir tile)
// Shows a toast pointing at ⌃⇧P when the panel is closed.
import React, { useState } from 'react';
import { Session } from 'meteor/session';
import lodash from 'lodash';
import { Button, CircularProgress, Tooltip } from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';

import { CONTEXT_SIDEBAR_OPEN } from '/imports/lib/SessionKeys.js';
import { contextSidebarStore } from '/imports/lib/contextSidebar/contextSidebarStore.js';
import { notify } from '/imports/lib/notify.js';

const get = lodash.get;

export function StashToContextButton({ getPayload, children, disabled, size, variant, sx, id }) {
  const [busy, setBusy] = useState(false);

  async function handleStash() {
    setBusy(true);
    try {
      const payload = (typeof getPayload === 'function') ? getPayload() : null;
      if (!payload) {
        notify({ title: 'Nothing to stash', severity: 'info' });
        return;
      }
      const meta = {
        label: get(payload, 'label', ''),
        source: get(payload, 'source', null)
      };
      if (payload.resource) {
        await contextSidebarStore.stashResource(payload.resource, meta);
      } else if (payload.resources) {
        await contextSidebarStore.stashResources(payload.resources, Object.assign({}, meta, {
          asBundle: get(payload, 'asBundle', true)
        }));
      } else if (payload.text) {
        await contextSidebarStore.stashUnknown(payload.text, meta);
      } else {
        notify({ title: 'Nothing to stash', severity: 'info' });
        return;
      }
      if (!Session.get(CONTEXT_SIDEBAR_OPEN)) {
        notify({ title: 'Stashed to Context', message: '⌃⇧P to open the panel', severity: 'success' });
      }
    } catch (error) {
      notify({ title: 'Stash failed', message: error.reason || error.message, severity: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Tooltip title="Save to the Context panel (⌃⇧P)">
      <span>
        <Button
          id={id || 'stashToContextButton'}
          size={size || 'medium'}
          variant={variant || 'outlined'}
          startIcon={busy ? <CircularProgress size={16} /> : <Inventory2OutlinedIcon />}
          onClick={handleStash}
          disabled={disabled || busy}
          sx={sx}
        >
          {children || 'Stash to Context'}
        </Button>
      </span>
    </Tooltip>
  );
}

export default StashToContextButton;
