// npmPackages/us-core/client/UsCoreServerConfig.jsx
//
// Server-configuration panel for US Core — rendered as the package's own
// vertical tab on /server-configuration (serverConfigs contract, same shape
// as pacio-core's InpatientModeConfig). Shows the conformance-seed census
// and runs the idempotent usCore.initialize, which tags newly created
// resources to an Import Run (visible on the /import-data Runs tab).
import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import moment from 'moment';
import {
  Card, CardHeader, CardContent, Box, Typography, Button, IconButton,
  Tooltip, Alert, CircularProgress
} from '@mui/material';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';

export function UsCoreServerConfig() {
  // Tri-state: null = loading, object = loaded, false = failed.
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState('');
  const [initBusy, setInitBusy] = useState(false);
  const [initResult, setInitResult] = useState(null);
  const [initError, setInitError] = useState('');

  async function refreshStatus() {
    setStatusError('');
    try {
      const result = await Meteor.rpc('usCore.status');
      setStatus(result);
    } catch (error) {
      setStatus(false);
      setStatusError(error.reason || error.message || 'Failed to load US Core status');
    }
  }

  useEffect(function() {
    refreshStatus();
  }, []);

  async function handleInitialize() {
    setInitBusy(true);
    setInitResult(null);
    setInitError('');
    try {
      const result = await Meteor.rpc('usCore.initialize');
      setInitResult(result);
      await refreshStatus();
    } catch (error) {
      setInitError(error.reason || error.message || 'US Core initialization failed');
    }
    setInitBusy(false);
  }

  const present = get(status, 'present', 0);
  const expected = get(status, 'expected', 0);
  const lastRun = get(status, 'lastRun', null);
  const complete = status && expected > 0 && present >= expected;

  return (
    <Card sx={{ mb: 2, width: '100%' }}>
      <CardHeader
        avatar={<LibraryBooksIcon />}
        title="US Core Conformance"
        subheader="Vendored US Core 7.0.0 ValueSets — terminology for search and validation"
        action={
          <Tooltip title="Refresh status">
            <IconButton onClick={refreshStatus}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        {/* Census row */}
        {status === null ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">Checking seeded ValueSets…</Typography>
          </Box>
        ) : status === false ? (
          <Alert severity="warning" sx={{ mb: 2 }}>{statusError}</Alert>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Box sx={{
              width: 10, height: 10, borderRadius: '50%', alignSelf: 'center',
              bgcolor: complete ? 'success.main' : (present > 0 ? 'warning.main' : 'text.disabled')
            }} />
            <Typography variant="body2">
              {present} of {expected} US Core ValueSets present
            </Typography>
            {lastRun && (
              <Typography variant="caption" color="text.secondary">
                · last seeded {moment(get(lastRun, 'at')).fromNow()} ({get(lastRun, 'created', 0)} created, run {String(get(lastRun, 'importRunId', '')).substring(0, 8)}…)
              </Typography>
            )}
          </Box>
        )}

        <Button
          id="usCoreInitValueSetsButton"
          variant="contained"
          fullWidth
          onClick={handleInitialize}
          disabled={initBusy || status === null}
          startIcon={initBusy ? <CircularProgress size={20} color="inherit" /> : <PlaylistAddCheckIcon />}
          sx={{ mb: 1 }}
        >
          {initBusy ? 'Seeding US Core ValueSets…' : 'Init US Core ValueSets'}
        </Button>

        {initResult && (
          <Alert severity="success" sx={{ mb: 1 }} onClose={function() { setInitResult(null); }}>
            {get(initResult, 'created', 0)} created · {get(initResult, 'updated', 0)} refreshed
            {get(initResult, 'importRunId')
              ? ' — created resources tagged to import run ' + String(get(initResult, 'importRunId')).substring(0, 8) + '… (see the Runs tab on /import-data)'
              : ' — nothing new to create, no import run recorded'}
          </Alert>
        )}
        {initError && (
          <Alert severity="error" sx={{ mb: 1 }} onClose={function() { setInitError(''); }}>
            {initError}
          </Alert>
        )}

        <Typography variant="caption" color="text.secondary">
          Idempotent — safe to re-run. Existing ValueSets are refreshed in place and keep
          their original import-run provenance; only newly created resources are tagged
          to a new run.
        </Typography>
      </CardContent>
    </Card>
  );
}

export default UsCoreServerConfig;
