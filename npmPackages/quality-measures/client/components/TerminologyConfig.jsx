// npmPackages/quality-measures/client/components/TerminologyConfig.jsx
//
// ServerConfiguration panel tab for quality-measures: VSAC/UMLS terminology
// access (BYOK — UMLS licenses are individual, so each deployment's admin
// supplies their own API key) plus best-effort eCQM measure-package fetch
// from the eCQI Resource Center. The key is stored server-side only
// (ServerConfiguration collection); this panel only ever sees
// configured/source/last-4.

import React, { useState, useEffect, useCallback } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Stack,
  TextField,
  Button,
  Chip,
  Alert,
  AlertTitle,
  Typography,
  CircularProgress,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  VpnKey as KeyIcon,
  CloudSync as FetchIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorIcon,
  CollectionsBookmark as ValueSetIcon
} from '@mui/icons-material';

const log = (Meteor.Logger ? Meteor.Logger.for('TerminologyConfig') : console);

// The 4 CMS eCQM placeholders on /quality-measures that need real bundles
const FETCHABLE_CMS_IDS = ['CMS2v13', 'CMS122v12', 'CMS146v11', 'CMS165v12'];

const SOURCE_LABELS = {
  database: 'saved in server configuration',
  settings: 'from Meteor.settings.private.vsac.apiKey',
  env: 'from VSAC_API_KEY environment variable'
};

export default function TerminologyConfig() {
  // Tri-state: null = loading, otherwise { configured, source, keySuffix }
  const [keyStatus, setKeyStatus] = useState(null);
  const [keyInput, setKeyInput] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [feedback, setFeedback] = useState(null); // { severity, message }
  const [fetchResults, setFetchResults] = useState(null);
  const [valueSetResults, setValueSetResults] = useState(null);

  const refreshKeyStatus = useCallback(async function() {
    try {
      const result = await Meteor.rpc('qualityMeasures.checkVsacSetting');
      setKeyStatus(result);
    } catch (error) {
      log.warn('TerminologyConfig checkVsacSetting error', { reason: error.reason });
      setKeyStatus({ configured: false, source: null, keySuffix: '' });
    }
  }, []);

  useEffect(function() {
    refreshKeyStatus();
  }, [refreshKeyStatus]);

  async function handleSaveKey() {
    setBusyAction('save');
    setFeedback(null);
    try {
      const result = await Meteor.rpc('qualityMeasures.saveVsacApiKey', { apiKey: keyInput });
      setKeyStatus(result);
      setKeyInput('');
      setFeedback({ severity: 'success', message: 'VSAC API key saved (ending in …' + result.keySuffix + ').' });
    } catch (error) {
      setFeedback({ severity: 'error', message: get(error, 'reason') || get(error, 'message') || 'Save failed' });
    } finally {
      setBusyAction('');
    }
  }

  async function handleClearKey() {
    setBusyAction('clear');
    setFeedback(null);
    try {
      const result = await Meteor.rpc('qualityMeasures.clearVsacApiKey');
      setKeyStatus(result);
      setFeedback({
        severity: 'info',
        message: result.configured
          ? 'Stored key cleared; a key still resolves ' + (SOURCE_LABELS[result.source] || result.source) + '.'
          : 'VSAC API key cleared.'
      });
    } catch (error) {
      setFeedback({ severity: 'error', message: get(error, 'reason') || get(error, 'message') || 'Clear failed' });
    } finally {
      setBusyAction('');
    }
  }

  async function handleTestConnection() {
    setBusyAction('test');
    setFeedback(null);
    try {
      const result = await Meteor.rpc('qualityMeasures.testVsacConnection');
      setFeedback({
        severity: 'success',
        message: 'VSAC connection OK — fetched "' + get(result, 'testValueSet', 'test value set') + '" using the key ' + (SOURCE_LABELS[result.source] || result.source) + '.'
      });
    } catch (error) {
      setFeedback({ severity: 'error', message: get(error, 'reason') || get(error, 'message') || 'Connection test failed' });
    } finally {
      setBusyAction('');
    }
  }

  async function handleFetchMeasurePackages() {
    setBusyAction('packages');
    setFeedback(null);
    setFetchResults(null);
    try {
      const result = await Meteor.rpc('qualityMeasures.fetchMeasurePackages', { cmsIds: FETCHABLE_CMS_IDS });
      setFetchResults(get(result, 'results', []));
    } catch (error) {
      setFeedback({ severity: 'error', message: get(error, 'reason') || get(error, 'message') || 'Package fetch failed' });
    } finally {
      setBusyAction('');
    }
  }

  async function handleFetchValueSets() {
    setBusyAction('valuesets');
    setFeedback(null);
    setValueSetResults(null);
    try {
      const result = await Meteor.rpc('qualityMeasures.fetchValueSetsFromVsac', {});
      setValueSetResults(result);
    } catch (error) {
      setFeedback({ severity: 'error', message: get(error, 'reason') || get(error, 'message') || 'Value-set fetch failed' });
    } finally {
      setBusyAction('');
    }
  }

  const keyConfigured = get(keyStatus, 'configured', false);

  return (
    <Box>
      {/* --- VSAC API key (BYOK) --- */}
      <Card sx={{ mb: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
        <CardHeader
          avatar={<KeyIcon color="primary" />}
          title="VSAC / UMLS API Key"
          subheader="Value Set Authority Center terminology access (bring your own key)"
        />
        <CardContent>
          {keyStatus === null ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                UMLS licenses are individual — NLM issues one API key per person, so this
                application ships without one.{' '}
                <Link
                  id="getVsacApiKeyLink"
                  href="https://uts.nlm.nih.gov/uts/edit-profile"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get your API key…
                </Link>{' '}
                (UTS profile; requires a free UMLS license). The key is stored server-side and
                never sent to the browser.
              </Typography>

              {keyConfigured ? (
                <Alert severity="success" id="vsacKeyConfiguredAlert">
                  API key configured (ending in …{get(keyStatus, 'keySuffix', '')}),{' '}
                  {SOURCE_LABELS[get(keyStatus, 'source')] || get(keyStatus, 'source')}.
                </Alert>
              ) : (
                <Alert severity="warning" id="vsacKeyMissingAlert">
                  <AlertTitle>No VSAC API key configured</AlertTitle>
                  Value-set fetching is disabled. Paste your UMLS API key below, or set
                  Meteor.settings.private.vsac.apiKey / the VSAC_API_KEY environment variable.
                </Alert>
              )}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  id="vsacApiKeyInput"
                  label="UMLS API Key"
                  type="password"
                  size="small"
                  fullWidth
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  autoComplete="off"
                />
                <Button
                  id="saveVsacKeyButton"
                  variant="contained"
                  onClick={handleSaveKey}
                  disabled={!keyInput.trim() || busyAction === 'save'}
                  startIcon={busyAction === 'save' ? <CircularProgress size={16} /> : <KeyIcon />}
                >
                  Save
                </Button>
                <Button
                  id="clearVsacKeyButton"
                  variant="outlined"
                  onClick={handleClearKey}
                  disabled={busyAction === 'clear' || get(keyStatus, 'source') !== 'database'}
                >
                  Clear
                </Button>
                <Button
                  id="testVsacConnectionButton"
                  variant="outlined"
                  onClick={handleTestConnection}
                  disabled={!keyConfigured || busyAction === 'test'}
                  startIcon={busyAction === 'test' ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                >
                  Test Connection
                </Button>
              </Stack>

              {feedback && (
                <Alert severity={feedback.severity}>{feedback.message}</Alert>
              )}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* --- eCQM measure packages --- */}
      <Card sx={{ mb: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
        <CardHeader
          avatar={<FetchIcon color="primary" />}
          title="eCQM Measure Packages"
          subheader="Fetch published measure packages (CQL + ELM) from the eCQI Resource Center"
        />
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Attempts to download the published measure packages for{' '}
              {FETCHABLE_CMS_IDS.join(', ')} from ecqi.healthit.gov (public downloads, no key
              required) and import any FHIR measure bundle they contain. Note: the classic CMS
              eCQM packages on{' '}
              <Link href="https://ecqi.healthit.gov" target="_blank" rel="noopener noreferrer">
                ecqi.healthit.gov
              </Link>{' '}
              are QDM-based; the FHIR versions are exported from{' '}
              <Link href="https://madie.cms.gov" target="_blank" rel="noopener noreferrer">
                MADiE
              </Link>{' '}
              (HARP login) — drop those exports into the measure-bundles/ directory
              (auto-imported at startup) or use the Import dialog on /quality-measures.
            </Typography>

            <Box>
              <Button
                id="fetchMeasurePackagesButton"
                variant="contained"
                onClick={handleFetchMeasurePackages}
                disabled={busyAction === 'packages'}
                startIcon={busyAction === 'packages' ? <CircularProgress size={16} /> : <FetchIcon />}
              >
                {busyAction === 'packages' ? 'Fetching…' : 'Fetch Measure Packages'}
              </Button>
            </Box>

            {fetchResults && (
              <List dense>
                {fetchResults.map(function(row) {
                  return (
                    <ListItem key={row.cmsId}>
                      <ListItemIcon>
                        {row.ok ? <CheckCircleIcon color="success" /> : <ErrorIcon color="warning" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2">{row.cmsId}</Typography>
                            {row.ok && <Chip label="imported" size="small" color="success" variant="outlined" />}
                          </Stack>
                        }
                        secondary={row.ok
                          ? (get(row, 'imported', []).map(function(item) {
                              return get(item, 'measureId', get(item, 'file', ''));
                            }).join(', ') + ' — from ' + get(row, 'sourceUrl', ''))
                          : get(row, 'error', 'Not found')}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* --- VSAC value sets --- */}
      <Card sx={{ mb: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
        <CardHeader
          avatar={<ValueSetIcon color="primary" />}
          title="Value Sets"
          subheader="Fetch value-set expansions for imported measures from the VSAC FHIR API"
        />
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Scans every imported measure bundle for the value sets its logic depends on and
              fetches fresh expansions from VSAC — codes are refetched from the authority
              instead of going stale. Requires the API key above.
            </Typography>

            <Box>
              <Button
                id="fetchValueSetsButton"
                variant="contained"
                onClick={handleFetchValueSets}
                disabled={!keyConfigured || busyAction === 'valuesets'}
                startIcon={busyAction === 'valuesets' ? <CircularProgress size={16} /> : <ValueSetIcon />}
              >
                {busyAction === 'valuesets' ? 'Fetching…' : 'Fetch Value Sets'}
              </Button>
            </Box>

            {valueSetResults && (
              <Alert severity={get(valueSetResults, 'fetched', 0) > 0 ? 'success' : 'warning'}>
                Fetched {get(valueSetResults, 'fetched', 0)} of {get(valueSetResults, 'total', 0)} value
                sets for {get(valueSetResults, 'measureIds', []).length} measure(s).
              </Alert>
            )}
            {valueSetResults && get(valueSetResults, 'results', []).filter(function(row) { return !row.ok; }).length > 0 && (
              <List dense>
                {get(valueSetResults, 'results', []).filter(function(row) { return !row.ok; }).map(function(row, index) {
                  return (
                    <ListItem key={row.oid + '-' + index}>
                      <ListItemIcon><ErrorIcon color="warning" /></ListItemIcon>
                      <ListItemText primary={row.oid} secondary={get(row, 'error', 'HTTP ' + get(row, 'status', '?'))} />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
