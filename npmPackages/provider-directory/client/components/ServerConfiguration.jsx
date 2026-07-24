// npmPackages/provider-directory/client/components/ServerConfiguration.jsx
//
// ServerConfiguration panel tab for provider-directory. Discovered off the
// WorkflowRegistry default-export `serverConfigs` key and rendered as an extra
// vertical tab by imports/ui-vault-server/ServerConfigurationPage.jsx.
//
// This panel drives the CMS National Directory (directory.cms.gov) bulk import:
// refresh the release manifest, pick which of the 6 FHIR resource files to pull,
// then Fetch (stream-download the .ndjson.zst) and Install (zstd-decompress +
// bulk-load into the Directory.* collections). Fetch/Install are background
// jobs server-side (server/methods.directory.js): the RPC returns immediately
// and this component polls providerDirectory.directoryProgress (~1.5s) to
// render per-resource progress bars, then refreshes counts when the job ends.
//
// Rendered as a bare element with NO props, so it is fully self-contained:
// local state, local snackbar. Theme tokens only (no hardcoded colors).

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  LinearProgress,
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

const POLL_INTERVAL_MS = 1500;
const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

function formatBytes(bytes) {
  if (typeof bytes !== 'number' || !isFinite(bytes) || bytes < 0) { return '—'; }
  if (bytes === 0) { return '0 B'; }
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), SIZE_UNITS.length - 1);
  const value = bytes / Math.pow(1024, exp);
  return (exp === 0 ? Math.round(value) : value.toFixed(1)) + ' ' + SIZE_UNITS[exp];
}

export function ServerConfiguration() {
  // Tri-state gate: null = checking, true = enabled, false = disabled.
  const [enabled, setEnabled] = useState(null);
  const [info, setInfo] = useState({});
  const [manifest, setManifest] = useState(null);
  const [counts, setCounts] = useState({});
  const [selected, setSelected] = useState({}); // resourceName -> bool
  const [loadingAction, setLoadingAction] = useState(''); // '', 'manifest'
  const [jobProgress, setJobProgress] = useState({ active: null, resources: {} });
  const [polling, setPolling] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'info', message: '' });

  // Remembers which job type was running so we can announce completion once.
  const runningJob = useRef(null);

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
        // no-op (read-only status probe; errors surface elsewhere)
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

  function summarizeFinishedJob(job, resources) {
    const entries = Object.keys(resources || {}).map(function (name) { return resources[name]; });
    const failed = entries.filter(function (p) { return p.phase === 'error'; });
    if (job === 'fetch') {
      const done = entries.filter(function (p) { return p.phase === 'downloaded'; });
      notify(failed.length ? 'warning' : 'success',
        'Downloaded ' + done.length + ' file(s)' + (failed.length ? (' — ' + failed.length + ' failed') : ''));
    } else if (job === 'install') {
      const total = entries.reduce(function (sum, p) {
        return p.phase === 'installed'
          ? sum + (get(p, 'inserted', 0) + get(p, 'upserted', 0) + get(p, 'modified', 0))
          : sum;
      }, 0);
      notify(failed.length ? 'warning' : 'success',
        'Installed ' + total.toLocaleString() + ' record(s)' + (failed.length ? (' — ' + failed.length + ' failed') : ''));
    }
  }

  const pollProgress = useCallback(function () {
    (async () => {
      try {
        const result = await Meteor.rpc('providerDirectory.directoryProgress');
        setJobProgress(result || { active: null, resources: {} });
        const active = get(result, 'active', null);
        if (active) {
          runningJob.current = active;
          setPolling(true);
        } else {
          if (runningJob.current) {
            summarizeFinishedJob(runningJob.current, get(result, 'resources', {}));
            runningJob.current = null;
            refreshCounts();
          }
          setPolling(false);
        }
      } catch (error) {
        // Transient poll failure — keep polling; the interval will retry.
      }
    })();
  }, [refreshCounts]);

  // Poll while a job is active (interval owned by this effect).
  useEffect(function () {
    if (!polling) { return undefined; }
    const timer = setInterval(pollProgress, POLL_INTERVAL_MS);
    return function () { clearInterval(timer); };
  }, [polling, pollProgress]);

  // On mount: check the gate, then load counts + manifest if enabled, and
  // probe progress once in case a job is already running from a prior visit.
  useEffect(function () {
    (async () => {
      try {
        const result = await Meteor.rpc('providerDirectory.directoryCheckEnabled');
        setInfo(result || {});
        setEnabled(get(result, 'enabled', false));
        if (get(result, 'enabled', false)) {
          refreshCounts();
          refreshManifest();
          pollProgress();
        }
      } catch (error) {
        console.warn('[ServerConfiguration] directoryCheckEnabled error:', error.reason || error.message);
        setEnabled(false);
        return;
      }
    })();
  }, [refreshCounts, refreshManifest, pollProgress]);

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

  function startJob(job, methodName) {
    const names = selectedNames();
    if (!names.length) { notify('warning', 'Select at least one resource.'); return; }
    (async () => {
      try {
        await Meteor.rpc(methodName, { options: { resourceNames: names } });
        runningJob.current = job;
        setJobProgress(function (prev) { return Object.assign({}, prev, { active: job }); });
        setPolling(true);
        notify('info', (job === 'fetch' ? 'Download' : 'Install') + ' started for ' + names.join(', '));
      } catch (error) {
        notify('error', (job === 'fetch' ? 'Fetch' : 'Install') + ' failed to start: ' + (error.reason || error.message));
      }
    })();
  }

  function runFetch() { startJob('fetch', 'providerDirectory.directoryFetch'); }
  function runInstall() { startJob('install', 'providerDirectory.directoryInstall'); }

  // -------------------------------------------------------------------------
  // Per-resource progress row

  function progressFor(resourceName) {
    return get(jobProgress, ['resources', resourceName]);
  }

  function renderProgressRow(resourceName) {
    const p = progressFor(resourceName);
    if (!p) { return null; }

    let label = null;
    let pct = null;       // null -> indeterminate bar
    let color = 'primary';
    let showBar = true;

    if (p.phase === 'downloading') {
      pct = p.bytesTotal ? Math.min(100, (p.bytesDownloaded / p.bytesTotal) * 100) : null;
      label = 'Downloading… ' + formatBytes(p.bytesDownloaded) +
        (p.bytesTotal ? (' / ' + formatBytes(p.bytesTotal) + '  (' + Math.round(pct) + '%)') : '');
    } else if (p.phase === 'downloaded') {
      pct = 100;
      color = 'success';
      label = 'Downloaded ' + formatBytes(p.bytesDownloaded) + ' — ready to install';
    } else if (p.phase === 'installing') {
      pct = p.compressedBytesTotal ? Math.min(100, (p.compressedBytesRead / p.compressedBytesTotal) * 100) : null;
      label = 'Loading… ' + (p.lines || 0).toLocaleString() + ' records' +
        (pct !== null ? ('  (' + Math.round(pct) + '%)') : '');
    } else if (p.phase === 'installed') {
      pct = 100;
      color = 'success';
      const total = (get(p, 'inserted', 0) + get(p, 'upserted', 0) + get(p, 'modified', 0));
      label = 'Installed ' + total.toLocaleString() + ' record(s)' +
        (get(p, 'errors', 0) ? (' — ' + p.errors.toLocaleString() + ' parse error(s)') : '');
    } else if (p.phase === 'error') {
      pct = 100;
      color = 'error';
      showBar = false;
      label = 'Error: ' + (p.error || 'unknown');
    } else {
      return null;
    }

    return (
      <TableRow key={resourceName + '-progress'}>
        <TableCell colSpan={5} sx={{ borderBottom: 'none', pt: 0, pb: 1 }}>
          <Typography variant="caption" color={color === 'error' ? 'error.main' : 'text.secondary'}>
            {label}
          </Typography>
          {showBar && (
            <LinearProgress
              variant={pct === null ? 'indeterminate' : 'determinate'}
              value={pct === null ? undefined : pct}
              color={color}
              sx={{ mt: 0.5, height: 6, borderRadius: 1 }}
            />
          )}
        </TableCell>
      </TableRow>
    );
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
  const activeJob = get(jobProgress, 'active', null);
  const busy = !!loadingAction || !!activeJob;

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
          {activeJob && (
            <Chip size="small" color="info" label={activeJob === 'fetch' ? 'Downloading…' : 'Installing…'} />
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
                const progressRow = renderProgressRow(name);
                return (
                  <React.Fragment key={name}>
                    <TableRow hover>
                      <TableCell padding="checkbox" sx={progressRow ? { borderBottom: 'none' } : undefined}>
                        <Checkbox checked={!!selected[name]} onChange={function () { toggle(name); }} disabled={busy} />
                      </TableCell>
                      <TableCell sx={progressRow ? { borderBottom: 'none' } : undefined}>{name}</TableCell>
                      <TableCell align="right" sx={progressRow ? { borderBottom: 'none' } : undefined}>{get(f, 'compressed_size', '—')}</TableCell>
                      <TableCell align="right" sx={progressRow ? { borderBottom: 'none' } : undefined}>{get(f, 'original_size', '—')}</TableCell>
                      <TableCell align="right" sx={progressRow ? { borderBottom: 'none' } : undefined}>{(get(counts, name, 0)).toLocaleString()}</TableCell>
                    </TableRow>
                    {progressRow}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', gap: 1, px: 2, pb: 2 }}>
        <Button
          variant="outlined"
          startIcon={activeJob === 'fetch' ? <CircularProgress size={18} /> : <CloudDownloadIcon />}
          onClick={runFetch}
          disabled={busy || !selectedNames().length}
        >
          {activeJob === 'fetch' ? 'Fetching…' : 'Fetch selected'}
        </Button>
        <Button
          variant="contained"
          startIcon={activeJob === 'install' ? <CircularProgress size={18} /> : <StorageIcon />}
          onClick={runInstall}
          disabled={busy || !selectedNames().length}
        >
          {activeJob === 'install' ? 'Installing…' : 'Install selected'}
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
