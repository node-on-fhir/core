// /imports/components/ShareModalDialog.jsx
//
// Default, shared Share dialog. Registered as `Meteor.ShareModalDialog` in
// imports/ui/App.jsx and resolved via imports/components/resolveShareModalDialog.js,
// which lets any workflow package override it by exporting its own
// `ShareModalDialog` from its client entry.
//
// Self-contained: renders its own MUI <Dialog>, controlled by `open`/`onClose`.
// Contract (any override should accept the same props):
//   { open, onClose, resource, resourceType }
//
// Endpoint resolution priority (highest first):
//   1. Session SELECTED_ENDPOINT.address  (a row chosen on /lantern)
//   2. settings.public.interfaces.fhirRelay.channel.endpoint
//   3. http://localhost:3000/baseR4  (last-resort default)
// The user can still freely edit the URL field before sending.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';

import SendIcon from '@mui/icons-material/Send';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import ClearIcon from '@mui/icons-material/Clear';

import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';

import { SELECTED_ENDPOINT, SELECTED_ENDPOINT_ID } from '/imports/lib/SessionKeys.js';

const DEFAULT_ENDPOINT = 'http://localhost:3000/baseR4';

function settingsEndpoint() {
  return get(Meteor, 'settings.public.interfaces.fhirRelay.channel.endpoint', DEFAULT_ENDPOINT);
}

function ShareModalDialog(props) {
  const {
    open = false,
    onClose,
    resource,
    resourceType = 'Composition'
  } = props;

  const navigate = useNavigate();

  // The Lantern-selected endpoint (reactive — a selection made while this dialog
  // is closed is reflected the next time it opens, and live while open).
  const selectedEndpoint = useTracker(function() {
    return Session.get(SELECTED_ENDPOINT);
  }, []);

  const [endpointUrl, setEndpointUrl] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [message, setMessage] = useState('');

  // Seed / re-seed the URL field whenever the dialog opens or the Lantern
  // selection changes, unless the user is mid-send.
  useEffect(function() {
    if (!open) return;
    const fromLantern = get(selectedEndpoint, 'address', '');
    setEndpointUrl(fromLantern || settingsEndpoint());
    setStatus('idle');
    setMessage('');
  }, [open, selectedEndpoint]);

  function handleBrowseLantern() {
    // React Router navigation — never window.location (preserves Session +
    // patient context). Modal can't carry next/back params, so we just close.
    if (typeof onClose === 'function') onClose();
    navigate('/lantern');
  }

  function handleClearSelected() {
    Session.set(SELECTED_ENDPOINT, null);
    Session.set(SELECTED_ENDPOINT_ID, null);
    setEndpointUrl(settingsEndpoint());
  }

  function handleSend() {
    const resourceId = get(resource, '_id', get(resource, 'id'));

    if (!endpointUrl) {
      setStatus('error');
      setMessage('Please provide a destination endpoint URL.');
      return;
    }
    if (!resourceId) {
      setStatus('error');
      setMessage('No document is selected to share.');
      return;
    }

    setStatus('sending');
    setMessage('');

    Meteor.callAsync('share.send', {
      endpointUrl: endpointUrl,
      resourceId: resourceId,
      resourceType: resourceType
    }).then(function(result) {
      console.log('[ShareModalDialog] share.send result:', result);
      setStatus('success');
      setMessage('Sent successfully' + (get(result, 'status') ? ' (HTTP ' + result.status + ').' : '.'));
      // Brief success beat, then close.
      setTimeout(function() {
        if (typeof onClose === 'function') onClose();
      }, 1200);
    }).catch(function(error) {
      console.error('[ShareModalDialog] share.send error:', error);
      setStatus('error');
      setMessage(get(error, 'reason', get(error, 'message', 'Share failed.')));
    });
  }

  const sending = status === 'sending';
  const usingLantern = !!get(selectedEndpoint, 'address');

  return (
    <Dialog id="shareModalDialog" open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share Document</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Send this {resourceType} to a FHIR endpoint. The destination defaults to the
          configured relay; choose a different one from the Lantern directory if needed.
        </Typography>

        {usingLantern ? (
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={'Selected: ' + get(selectedEndpoint, 'name', 'endpoint')}
              color="primary"
              size="small"
              onDelete={handleClearSelected}
              deleteIcon={<ClearIcon />}
            />
            <Typography variant="caption" color="text.secondary">
              from Lantern
            </Typography>
          </Box>
        ) : null}

        <TextField
          id="shareEndpointUrlInput"
          fullWidth
          label="Destination endpoint URL"
          value={endpointUrl}
          onChange={function(event) { setEndpointUrl(event.target.value); }}
          disabled={sending}
          sx={{ mb: 2 }}
        />

        <Button
          id="shareBrowseLanternButton"
          variant="text"
          startIcon={<TravelExploreIcon />}
          onClick={handleBrowseLantern}
          disabled={sending}
        >
          Browse Lantern endpoints
        </Button>

        {status === 'error' ? (
          <Alert severity="error" sx={{ mt: 2 }}>{message}</Alert>
        ) : null}
        {status === 'success' ? (
          <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button id="shareCancelButton" onClick={onClose} disabled={sending}>
          Cancel
        </Button>
        <Button
          id="shareSendButton"
          variant="contained"
          color="primary"
          onClick={handleSend}
          disabled={sending}
          startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
        >
          {sending ? 'Sending…' : 'Send'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ShareModalDialog;
