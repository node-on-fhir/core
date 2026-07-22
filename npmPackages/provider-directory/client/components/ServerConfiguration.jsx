// npmPackages/provider-directory/client/components/ServerConfiguration.jsx
//
// ServerConfiguration panel tab for provider-directory. Discovered off the
// WorkflowRegistry default-export `serverConfigs` key and rendered as an extra
// vertical tab by imports/ui-vault-server/ServerConfigurationPage.jsx.
//
// This panel drives the CMS National Directory (directory.cms.gov) bulk import:
// refresh the release manifest, pick which of the 6 FHIR resource files to pull,
// then Fetch (stream-download the .ndjson.zst) and Install (zstd-decompress +
// bulk-load into the Directory.* collections). All heavy lifting is server-side
// (server/methods.directory.js); this component only calls methods + shows status.
//
// Rendered as a bare element with NO props, so it is fully self-contained:
// local state, local snackbar. Theme tokens only (no hardcoded colors).

import React, { useState, useEffect, useCallback } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Typography,
  Alert,
  AlertTitle,
  Snackbar,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip
} from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import StorageIcon from '@mui/icons-material/Storage';
import RefreshIcon from '@mui/icons-material/Refresh';

export function ServerConfiguration() {
  // Tri-state gate: null = checking, true = enabled, false = disabled.
  const [enabled, setEnabled] = useState(null);
  const [info, setInfo] = useState({});
  const [manifest, setManifest] = useState(null);
  const [counts, setCounts] = useState({});
  const [selected, setSelected] = useState({}); // resourceName -> bool
  const [loadingAction, setLoadingAction] = useState(''); // '', 'manifest', 'fetch', 'install', 'counts'
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'info', message: '' });

  const isElectron = !!get(window, 'electronAPI.isElectron', false);

  function notify(severity, message) {
    setSnackbar({ open: true, severity: severity, message: message });
  }

  const refreshCounts = useCallback(function () {
    (async () => {
      try {
        const result = await Meteor.rpc('providerDirectory.directoryCounts');
        if (result) { setCounts(result); }
      } catch (error) {
        // no-op (original callback ignored errors)
      }
    })();
  }, []);

  const refreshManifest = useCallback(function () {
    setLoadingAction('manifest');
    (async () => {
      try {
        const result = await Meteor.rpc('providerDirectory.directoryManifest');
        setLoadingAction('');
        setManifest(result);
      } catch (error) {
        setLoadingAction('');
        notify('error', 'Manifest fetch failed: ' + (error.reason || error.message));
      }
    })();
  }, []);

  // On mount: check the gate, then load counts + manifest if enabled.
  useEffect(function () {
    (async () => {
      try {
        const result = await Meteor.rpc('providerDirectory.directoryCheckEnabled');
        setInfo(result || {});
        setEnabled(get(result, 'enabled', false));
        if (get(result, 'enabled', false)) {
          refreshCounts();
          refreshManifest();
        }
      } catch (error) {
        console.warn('[ServerConfiguration] directoryCheckEnabled error:', error.reason || error.message);
        setEnabled(false);
        return;
      }
    })();
  }, [refreshCounts, refreshManifest]);

  function toggle(resourceName) {
    setSelected(function (prev) {
      const next = Object.assign({}, prev);
      next[resourceName] = !next[resourceName];
      return next;
    });
  }

  function toggleAll() {
    const files = get(manifest, 'files', []);
    const allOn = files.length > 0 && files.every(function (f) { return selected[f.resource_name]; });
    const next = {};
    files.forEach(function (f) { next[f.resource_name] = !allOn; });
    setSelected(next);
  }

  function selectedNames() {
    return Object.keys(selected).filter(function (k) { return selected[k]; });
  }

  function runFetch() {
    const names = selectedNames();
    if (!names.length) { notify('warning', 'Select at least one resource to fetch.'); return; }
    setLoadingAction('fetch');
    (async () => {
      try {
        const result = await Meteor.rpc('providerDirectory.directoryFetch', { options: { resourceNames: names } });
        setLoadingAction('');
        const ok = get(result, 'results', []).filter(function (r) { return r.ok; });
        const failed = get(result, 'results', []).filter(function (r) { return !r.ok; });
        notify(failed.length ? 'warning' : 'success',
          'Fetched ' + ok.length + ' file(s) to ' + get(result, 'tempDir', 'temp') +
          (failed.length ? (' — ' + failed.length + ' failed') : ''));
      } catch (error) {
        setLoadingAction('');
        notify('error', 'Fetch failed: ' + (error.reason || error.message));
        return;
      }
    })();
  }

  function runInstall() {
    const names = selectedNames();
    if (!names.length) { notify('warning', 'Select at least one resource to install.'); return; }
    setLoadingAction('install');
    (async () => {
      try {
        const result = await Meteor.rpc('providerDirectory.directoryInstall', { options: { resourceNames: names } });
        setLoadingAction('');
        const results = get(result, 'results', []);
        const totalInserted = results.reduce(function (sum, r) {
          return sum + (get(r, 'inserted', 0) + get(r, 'upserted', 0) + get(r, 'modified', 0));
        }, 0);
        const failed = results.filter(function (r) { return !r.ok; });
        notify(failed.length ? 'warning' : 'success',
          'Installed ' + totalInserted.toLocaleString() + ' record(s)' +
          (failed.length ? (' — ' + failed.length + ' failed') : ''));
        refreshCounts();
      } catch (error) {
        setLoadingAction('');
        notify('error', 'Install failed: ' + (error.reason || error.message));
        return;
      }
    })();
  }

  // -------------------------------------------------------------------------
  // Render

  if (enabled === null) {
    return (
      <Card sx={{ mb: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
        <CardHeader avatar={<BusinessIcon color="primary" />} title="National Directory" subheader="Checking configuration…" />
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
        </CardContent>
      </Card>
    );
  }

  if (enabled === false) {
    return (
      <Card sx={{ mb: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
        <CardHeader avatar={<BusinessIcon color="primary" />} title="National Directory" subheader="directory.cms.gov bulk import" />
        <CardContent>
          <Alert severity="error">
            <AlertTitle>National Directory import is disabled</AlertTitle>
            Bulk import of the CMS National Provider Directory is not enabled. Contact your
            administrator to enable it in the server settings
            (<code>Meteor.settings.private.directory.enabled</code>).
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const files = get(manifest, 'files', []);
  const allSelected = files.length > 0 && files.every(function (f) { return selected[f.resource_name]; });
  const busy = !!loadingAction;

  return (
    <Card sx={{ mb: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
      <CardHeader
        avatar={<BusinessIcon color="primary" />}
        title="National Directory"
        subheader={'directory.cms.gov bulk import' + (isElectron ? '  ·  desktop' : '')}
        action={
          <Button
            size="small"
            startIcon={loadingAction === 'manifest' ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={refreshManifest}
            disabled={busy}
          >
            Refresh manifest
          </Button>
        }
      />
      <CardContent>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
          {get(manifest, 'release_date') && (
            <Chip size="small" label={'Release ' + manifest.release_date} color="primary" variant="outlined" />
          )}
          {get(manifest, 'totals.compressed_size') && (
            <Chip size="small" label={'Compressed ' + manifest.totals.compressed_size} variant="outlined" />
          )}
          {get(manifest, 'totals.original_size') && (
            <Chip size="small" label={'Uncompressed ' + manifest.totals.original_size} variant="outlined" />
          )}
          {info.zstdStreaming === false && (
            <Chip size="small" color="warning" label={'No zstd streaming (Node ' + info.nodeVersion + ')'} />
          )}
        </Box>

        {!files.length ? (
          <Typography variant="body2" color="text.secondary">
            No manifest loaded yet. Click “Refresh manifest” to read the current release from {info.baseUrl}.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={!allSelected && selectedNames().length > 0}
                    onChange={toggleAll}
                    disabled={busy}
                  />
                </TableCell>
                <TableCell>Resource</TableCell>
                <TableCell align="right">Compressed</TableCell>
                <TableCell align="right">Uncompressed</TableCell>
                <TableCell align="right">Installed</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {files.map(function (f) {
                const name = f.resource_name;
                return (
                  <TableRow key={name} hover>
                    <TableCell padding="checkbox">
                      <Checkbox checked={!!selected[name]} onChange={function () { toggle(name); }} disabled={busy} />
                    </TableCell>
                    <TableCell>{name}</TableCell>
                    <TableCell align="right">{get(f, 'compressed_size', '—')}</TableCell>
                    <TableCell align="right">{get(f, 'original_size', '—')}</TableCell>
                    <TableCell align="right">{(get(counts, name, 0)).toLocaleString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', gap: 1, px: 2, pb: 2 }}>
        <Button
          variant="outlined"
          startIcon={loadingAction === 'fetch' ? <CircularProgress size={18} /> : <CloudDownloadIcon />}
          onClick={runFetch}
          disabled={busy || !selectedNames().length}
        >
          {loadingAction === 'fetch' ? 'Fetching…' : 'Fetch selected'}
        </Button>
        <Button
          variant="contained"
          startIcon={loadingAction === 'install' ? <CircularProgress size={18} /> : <StorageIcon />}
          onClick={runInstall}
          disabled={busy || !selectedNames().length}
        >
          {loadingAction === 'install' ? 'Installing…' : 'Install selected'}
        </Button>
      </CardActions>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={function () { setSnackbar(function (s) { return Object.assign({}, s, { open: false }); }); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
}

export default ServerConfiguration;
