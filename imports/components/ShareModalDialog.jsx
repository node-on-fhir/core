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
// Layout mirrors MITRE's Pseudo EHR "Share Transition of Care Data" dialog:
//   - document tile (title + date of the resource being shared)
//   - Share Mode radio — 'document' (bundle + DocumentReference on the
//     destination) or 'message' (bundle + discharge-notification Communication)
//   - FHIR Server select fed by settings.public.interfaces, overridden by a
//     Lantern selection (Session SELECTED_ENDPOINT), with a Custom URL escape
//     hatch
//
// The Browse-Lantern round trip: the button navigates to
// /lantern?next=<current-route>&share-document-dialog=true; the Lantern page
// navigates back through ?next= after a row click, and the host page reopens
// this dialog off the share-document-dialog param.

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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
  Chip,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

import SendIcon from '@mui/icons-material/Send';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import ClearIcon from '@mui/icons-material/Clear';
import DescriptionIcon from '@mui/icons-material/Description';

import { get } from 'lodash';
import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';

import { SELECTED_ENDPOINT, SELECTED_ENDPOINT_ID } from '/imports/lib/SessionKeys.js';

const DEFAULT_ENDPOINT = 'http://localhost:3000/baseR4';
const CUSTOM_VALUE = '__custom__';
const LANTERN_VALUE = '__lantern__';

// Destination choices from settings.public.interfaces — every interface with a
// non-empty channel endpoint becomes a select option.
function interfaceOptions() {
  const interfaces = get(Meteor, 'settings.public.interfaces', {});
  return Object.keys(interfaces)
    .map(function(key) {
      const entry = interfaces[key] || {};
      return {
        key: key,
        label: get(entry, 'name', key),
        endpoint: get(entry, 'channel.endpoint', '')
      };
    })
    .filter(function(option) { return !!option.endpoint; });
}

function ShareModalDialog(props) {
  const {
    open = false,
    onClose,
    resource,
    resourceType = 'Composition'
  } = props;

  const navigate = useNavigate();
  const location = useLocation();

  // The Lantern-selected endpoint (reactive — a selection made while this dialog
  // is closed is reflected the next time it opens, and live while open).
  const selectedEndpoint = useTracker(function() {
    return Session.get(SELECTED_ENDPOINT);
  }, []);

  const options = interfaceOptions();

  const [shareMode, setShareMode] = useState('document');
  const [serverChoice, setServerChoice] = useState('');   // endpoint URL | LANTERN_VALUE | CUSTOM_VALUE
  const [customUrl, setCustomUrl] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [message, setMessage] = useState('');

  const lanternAddress = get(selectedEndpoint, 'address', '');

  // Seed / re-seed the server choice whenever the dialog opens or the Lantern
  // selection changes: Lantern wins, then the first configured interface, then
  // the custom field with the last-resort default.
  useEffect(function() {
    if (!open) return;
    if (lanternAddress) {
      setServerChoice(LANTERN_VALUE);
    } else if (options.length > 0) {
      setServerChoice(options[0].endpoint);
    } else {
      setServerChoice(CUSTOM_VALUE);
      setCustomUrl(DEFAULT_ENDPOINT);
    }
    setStatus('idle');
    setMessage('');
  }, [open, lanternAddress]);

  function effectiveEndpointUrl() {
    if (serverChoice === LANTERN_VALUE) return lanternAddress;
    if (serverChoice === CUSTOM_VALUE) return customUrl.trim();
    return serverChoice;
  }

  function handleBrowseLantern() {
    // React Router navigation — never window.location (preserves Session +
    // patient context). Carry the current route as ?next= plus the
    // share-document-dialog flag so the Lantern page can bring the user (and
    // this dialog) back after a row click.
    if (typeof onClose === 'function') onClose();
    const currentRoute = (location.pathname || '/').replace(/^\/+/, '');
    navigate('/lantern?next=' + encodeURIComponent(currentRoute) + '&share-document-dialog=true');
  }

  function handleClearSelected() {
    Session.set(SELECTED_ENDPOINT, null);
    Session.set(SELECTED_ENDPOINT_ID, null);
    if (options.length > 0) {
      setServerChoice(options[0].endpoint);
    } else {
      setServerChoice(CUSTOM_VALUE);
      setCustomUrl(DEFAULT_ENDPOINT);
    }
  }

  function handleSend() {
    const resourceId = get(resource, '_id', get(resource, 'id'));
    const endpointUrl = effectiveEndpointUrl();

    if (!endpointUrl) {
      setStatus('error');
      setMessage('Please select or provide a destination FHIR server.');
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
      resourceType: resourceType,
      mode: shareMode
    }).then(function(result) {
      console.log('[ShareModalDialog] share.send result:', result);
      setStatus('success');
      const secondaryType = get(result, 'secondary.resourceType', '');
      const secondaryError = get(result, 'secondary.error', '');
      let summary = 'Bundle sent (HTTP ' + get(result, 'status', '?') + ')';
      if (secondaryType) {
        summary += secondaryError
          ? ('; ' + secondaryType + ' failed: ' + secondaryError)
          : ('; ' + secondaryType + ' created (HTTP ' + get(result, 'secondary.status', '?') + ').');
      }
      setMessage(summary);
      if (!secondaryError) {
        // Brief success beat, then close.
        setTimeout(function() {
          if (typeof onClose === 'function') onClose();
        }, 1600);
      }
    }).catch(function(error) {
      console.error('[ShareModalDialog] share.send error:', error);
      setStatus('error');
      setMessage(get(error, 'reason', get(error, 'message', 'Share failed.')));
    });
  }

  const sending = status === 'sending';
  const usingLantern = !!lanternAddress;

  const documentTitle = get(resource, 'title', resourceType);
  const documentDate = get(resource, 'date', '');

  return (
    <Dialog id="shareModalDialog" open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share Document</DialogTitle>
      <DialogContent dividers>
        {/* Selected document tile */}
        {resource ? (
          <Box
            id="shareDocumentTile"
            sx={{
              display: 'flex',
              gap: 1.5,
              alignItems: 'flex-start',
              p: 2,
              mb: 2,
              borderRadius: 1,
              bgcolor: 'action.hover',
              border: 1,
              borderColor: 'divider'
            }}
          >
            <DescriptionIcon color="info" fontSize="small" sx={{ mt: '2px' }} />
            <Box>
              <Typography variant="body2">
                <strong>Document:</strong> {documentTitle}
              </Typography>
              {documentDate ? (
                <Typography variant="body2" color="text.secondary">
                  <strong>Date:</strong> {moment(documentDate).format('MMM DD, YYYY')}
                </Typography>
              ) : null}
            </Box>
          </Box>
        ) : null}

        {/* Share mode */}
        <FormControl component="fieldset" sx={{ mb: 2 }} disabled={sending}>
          <FormLabel component="legend" sx={{ fontSize: '0.875rem' }}>Share Mode</FormLabel>
          <RadioGroup
            id="shareModeRadioGroup"
            value={shareMode}
            onChange={function(event) { setShareMode(event.target.value); }}
          >
            <FormControlLabel value="document" control={<Radio size="small" id="shareModeDocumentRadio" />} label="Share Document" />
            <FormControlLabel value="message" control={<Radio size="small" id="shareModeMessageRadio" />} label="Send Message" />
          </RadioGroup>
          <Typography variant="caption" color="text.secondary">
            Share Document creates a document bundle and DocumentReference on the selected
            FHIR server. Send Message creates a document bundle and discharge notification
            message on the selected FHIR server.
          </Typography>
        </FormControl>

        {/* Lantern selection chip */}
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

        {/* Destination FHIR server */}
        <FormControl fullWidth sx={{ mb: 2 }} disabled={sending}>
          <InputLabel id="shareFhirServerLabel">FHIR Server</InputLabel>
          <Select
            labelId="shareFhirServerLabel"
            id="shareFhirServerSelect"
            label="FHIR Server"
            value={serverChoice}
            onChange={function(event) { setServerChoice(event.target.value); }}
          >
            {usingLantern ? (
              <MenuItem value={LANTERN_VALUE}>
                {'Lantern: ' + get(selectedEndpoint, 'name', 'endpoint') + ' (' + lanternAddress + ')'}
              </MenuItem>
            ) : null}
            {options.map(function(option) {
              return (
                <MenuItem key={option.key} value={option.endpoint}>
                  {option.label + ' (' + option.endpoint + ')'}
                </MenuItem>
              );
            })}
            <MenuItem value={CUSTOM_VALUE}>Custom URL…</MenuItem>
          </Select>
        </FormControl>

        {serverChoice === CUSTOM_VALUE ? (
          <TextField
            id="shareEndpointUrlInput"
            fullWidth
            label="Destination endpoint URL"
            value={customUrl}
            onChange={function(event) { setCustomUrl(event.target.value); }}
            disabled={sending}
            sx={{ mb: 2 }}
          />
        ) : null}

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
