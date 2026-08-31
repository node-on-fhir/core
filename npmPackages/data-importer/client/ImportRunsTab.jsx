// npmPackages/data-importer/client/ImportRunsTab.jsx
//
// Import Runs tab — the provenance registry for /import-data. Lists recent
// import runs (each run's id is stamped into meta.tag on every resource it
// created), lets the operator census a run (read-only per-collection counts)
// and — when settings.private.allowImportRunFlush is enabled — flush it:
// delete every resource and GridFS payload file the run created.

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';

import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import PlagiarismIcon from '@mui/icons-material/Plagiarism';

import { get } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('ImportRunsTab') : console);

function formatWhen(value){
  if(!value) return '—';
  var date = value instanceof Date ? value : new Date(value);
  if(isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function totalOfCounts(counts){
  return Object.keys(counts || {}).reduce(function(sum, key){
    return sum + (counts[key] || 0);
  }, 0);
}

function statusColor(status){
  switch(status){
    case 'completed': return 'success';
    case 'active': return 'info';
    case 'flushed': return 'default';
    case 'failed': return 'error';
    default: return 'default';
  }
}

function ImportRunsTab(){
  var [runs, setRuns] = useState([]);
  var [loading, setLoading] = useState(true);
  // Tri-state: null = checking, true = enabled, false = disabled
  var [flushEnabled, setFlushEnabled] = useState(null);
  var [censusResults, setCensusResults] = useState({});
  var [busyRunId, setBusyRunId] = useState(null);
  var [confirmRun, setConfirmRun] = useState(null);
  var [errorMessage, setErrorMessage] = useState('');

  async function refreshRuns(){
    setLoading(true);
    try {
      var result = await Meteor.rpc('importRuns.list', { options: { limit: 100 } });
      setRuns(get(result, 'runs', []));
    } catch(error){
      log.warn('Could not list import runs', { error: error.message });
      setErrorMessage(error.reason || error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function(){
    refreshRuns();
    Meteor.rpc('importRuns.checkFlushSetting').then(function(result){
      setFlushEnabled(get(result, 'allowImportRunFlush', false));
    }).catch(function(error){
      log.warn('Could not check flush setting', { error: error.message });
      setFlushEnabled(false);
    });
  }, []);

  async function handleCensus(run){
    setBusyRunId(run._id);
    setErrorMessage('');
    try {
      var result = await Meteor.rpc('importRuns.census', { importRunId: run._id });
      setCensusResults(function(current){
        var next = Object.assign({}, current);
        next[run._id] = result;
        return next;
      });
    } catch(error){
      log.warn('Census failed', { importRunId: run._id, error: error.message });
      setErrorMessage(error.reason || error.message);
    } finally {
      setBusyRunId(null);
    }
  }

  async function handleFlushConfirmed(){
    var run = confirmRun;
    setConfirmRun(null);
    if(!run) return;
    setBusyRunId(run._id);
    setErrorMessage('');
    try {
      var result = await Meteor.rpc('importRuns.flush', { importRunId: run._id });
      log.info('Import run flushed', { importRunId: run._id, total: get(result, 'total', 0) });
      setCensusResults(function(current){
        var next = Object.assign({}, current);
        delete next[run._id];
        return next;
      });
      await refreshRuns();
    } catch(error){
      log.warn('Flush failed', { importRunId: run._id, error: error.message });
      setErrorMessage(error.reason || error.message);
    } finally {
      setBusyRunId(null);
    }
  }

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Import Runs</Typography>
        <IconButton id="refreshImportRunsButton" aria-label="Refresh import runs" onClick={refreshRuns}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {flushEnabled === false ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>Import-Run Deletion Disabled</AlertTitle>
          Runs can be inspected but not deleted. Contact your administrator to enable
          deletion in the server settings (Meteor.settings.private.allowImportRunFlush).
        </Alert>
      ) : null}

      {errorMessage ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={function(){ setErrorMessage(''); }}>
          {errorMessage}
        </Alert>
      ) : null}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : runs.length === 0 ? (
        <Alert severity="info">
          No import runs recorded yet. Runs appear here after importing to the
          database from File Drop, FHIR Drop, REST API, or the DICOM upload console.
        </Alert>
      ) : (
        <TableContainer>
          <Table id="importRunsTable" size="small">
            <TableHead>
              <TableRow>
                <TableCell>Started</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Origin</TableCell>
                <TableCell>Files</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell align="right">Resources</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {runs.map(function(run){
                var census = censusResults[run._id];
                var isBusy = busyRunId === run._id;
                var isFlushed = run.status === 'flushed';
                return (
                  <React.Fragment key={run._id}>
                    <TableRow hover>
                      <TableCell>{formatWhen(run.createdAt)}</TableCell>
                      <TableCell>
                        <Chip size="small" label={run.importType || 'unknown'} />
                      </TableCell>
                      <TableCell>{run.origin || '—'}</TableCell>
                      <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(run.filenames || []).join(', ') || '—'}
                      </TableCell>
                      <TableCell>{run.patientId || '—'}</TableCell>
                      <TableCell align="right">{totalOfCounts(run.resourceCounts)}</TableCell>
                      <TableCell>
                        <Chip size="small" color={statusColor(run.status)} label={run.status} variant="outlined" />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <IconButton
                          id={'censusRunButton-' + run._id}
                          aria-label="Census this import run"
                          size="small"
                          disabled={isBusy}
                          onClick={function(){ handleCensus(run); }}
                        >
                          <PlagiarismIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          id={'deleteRunButton-' + run._id}
                          aria-label="Delete this import run"
                          size="small"
                          color="error"
                          disabled={isBusy || isFlushed || flushEnabled !== true}
                          onClick={function(){ setConfirmRun(run); }}
                        >
                          {isBusy ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    {census ? (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ bgcolor: 'action.hover' }}>
                          <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace' }}>
                            {'Run ' + run._id + ' — ' + census.total + ' resources'}
                            {census.gridfsCount > 0 ? ' + ' + census.gridfsCount + ' GridFS files' : ''}
                            {census.total > 0 ? ': ' + Object.keys(census.counts).map(function(name){
                              return name + ' ' + census.counts[name];
                            }).join(', ') : ''}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={!!confirmRun} onClose={function(){ setConfirmRun(null); }}>
        <DialogTitle>Delete Import Run?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            This deletes every resource this run imported
            {confirmRun && totalOfCounts(confirmRun.resourceCounts) > 0
              ? ' (' + totalOfCounts(confirmRun.resourceCounts) + ' recorded at import time)'
              : ''}, plus any uploaded payload files. The run record is kept as an audit trail.
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
            {confirmRun ? confirmRun._id + ' — ' + (confirmRun.importType || 'unknown') : ''}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button id="cancelFlushButton" onClick={function(){ setConfirmRun(null); }}>Cancel</Button>
          <Button id="confirmFlushButton" color="error" variant="contained" onClick={handleFlushConfirmed}>
            Delete Run
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export { ImportRunsTab };
export default ImportRunsTab;
