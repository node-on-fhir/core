// npmPackages/order-catalog/client/components/OrderCatalogConfiguration.jsx
//
// ServerConfiguration panel tab for order-catalog: UMLS terminology access
// (BYOK — UMLS licenses are individual, so each deployment's admin supplies
// their own API key) plus catalog hydration from NLM terminology services:
// RxNorm medications via the keyless RxNav API, CPT procedures via the
// key-gated UMLS REST API. Selected concepts are upserted as catalog
// PlanDefinitions (type: order-set), the same convention the imaging catalog
// uses. The key is stored server-side only; this panel only ever sees
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
  Checkbox,
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
  CheckCircle as CheckCircleIcon,
  Medication as MedicationIcon,
  MedicalServices as ProcedureIcon,
  Search as SearchIcon,
  CloudDownload as HydrateIcon
} from '@mui/icons-material';

const log = (Meteor.Logger ? Meteor.Logger.for('OrderCatalogConfiguration') : console);

const SOURCE_LABELS = {
  'database': 'saved in server configuration',
  'database (shared VSAC key)': 'reusing the VSAC key saved in server configuration',
  'settings': 'from Meteor.settings.private.umls.apiKey',
  'env': 'from UMLS_API_KEY environment variable'
};

// Shared search-and-hydrate card for one terminology source (RxNorm or CPT).
// Search results render with checkboxes (all selected by default); Hydrate
// upserts the checked concepts into the PlanDefinitions catalog.
function SearchHydrateCard(props) {
  const {
    idPrefix,
    icon,
    title,
    subheader,
    helpText,
    searchMethod,
    catalogType,
    conceptKey,          // 'rxcui' or 'code'
    disabled,
    disabledAlert
  } = props;

  const [searchInput, setSearchInput] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [feedback, setFeedback] = useState(null); // { severity, message }
  const [concepts, setConcepts] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState({});

  async function handleSearch() {
    setBusyAction('search');
    setFeedback(null);
    setConcepts(null);
    try {
      const result = await Meteor.callAsync(searchMethod, searchInput);
      const found = get(result, 'concepts', []);
      setConcepts(found);

      // Select everything by default
      const selected = {};
      found.forEach(function(concept) {
        selected[get(concept, conceptKey, '')] = true;
      });
      setSelectedKeys(selected);

      if (found.length === 0) {
        setFeedback({ severity: 'info', message: 'No results for "' + searchInput.trim() + '".' });
      }
    } catch (error) {
      setFeedback({ severity: 'error', message: get(error, 'reason') || get(error, 'message') || 'Search failed' });
    } finally {
      setBusyAction('');
    }
  }

  async function handleHydrate() {
    setBusyAction('hydrate');
    setFeedback(null);
    try {
      const items = (concepts || []).filter(function(concept) {
        return selectedKeys[get(concept, conceptKey, '')];
      });
      const result = await Meteor.callAsync('orderCatalog.hydrateCatalogItems', items, catalogType);
      const errorCount = get(result, 'errors', []).length;
      setFeedback({
        severity: errorCount > 0 ? 'warning' : 'success',
        message: 'Catalog hydrated: ' + get(result, 'inserted', 0) + ' added, ' +
          get(result, 'updated', 0) + ' refreshed' +
          (errorCount > 0 ? ', ' + errorCount + ' failed.' : '.')
      });
    } catch (error) {
      setFeedback({ severity: 'error', message: get(error, 'reason') || get(error, 'message') || 'Hydration failed' });
    } finally {
      setBusyAction('');
    }
  }

  function toggleConcept(key) {
    setSelectedKeys(function(previous) {
      const next = Object.assign({}, previous);
      next[key] = !next[key];
      return next;
    });
  }

  const selectedCount = Object.keys(selectedKeys).filter(function(key) {
    return selectedKeys[key];
  }).length;

  return (
    <Card sx={{ mb: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
      <CardHeader avatar={icon} title={title} subheader={subheader} />
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {helpText}
          </Typography>

          {disabled && disabledAlert}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              id={idPrefix + 'SearchInput'}
              label="Search term"
              size="small"
              fullWidth
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchInput.trim() && !disabled) {
                  handleSearch();
                }
              }}
              disabled={disabled}
            />
            <Button
              id={idPrefix + 'SearchButton'}
              variant="contained"
              onClick={handleSearch}
              disabled={disabled || !searchInput.trim() || busyAction === 'search'}
              startIcon={busyAction === 'search' ? <CircularProgress size={16} /> : <SearchIcon />}
            >
              Search
            </Button>
          </Stack>

          {concepts && concepts.length > 0 && (
            <Box>
              <List dense sx={{ maxHeight: 320, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                {concepts.map(function(concept) {
                  const key = get(concept, conceptKey, '');
                  return (
                    <ListItem
                      key={key}
                      onClick={function() { toggleConcept(key); }}
                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                    >
                      <ListItemIcon>
                        <Checkbox edge="start" checked={!!selectedKeys[key]} tabIndex={-1} disableRipple />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2">{get(concept, 'name', '')}</Typography>
                            {get(concept, 'tty') && (
                              <Chip label={get(concept, 'tty')} size="small" variant="outlined" />
                            )}
                          </Stack>
                        }
                        secondary={key}
                      />
                    </ListItem>
                  );
                })}
              </List>

              <Box sx={{ mt: 1 }}>
                <Button
                  id={idPrefix + 'HydrateButton'}
                  variant="contained"
                  color="success"
                  onClick={handleHydrate}
                  disabled={selectedCount === 0 || busyAction === 'hydrate'}
                  startIcon={busyAction === 'hydrate' ? <CircularProgress size={16} /> : <HydrateIcon />}
                >
                  {busyAction === 'hydrate'
                    ? 'Hydrating…'
                    : 'Hydrate Catalog (' + selectedCount + ' selected)'}
                </Button>
              </Box>
            </Box>
          )}

          {feedback && (
            <Alert severity={feedback.severity}>{feedback.message}</Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function OrderCatalogConfiguration() {
  // Tri-state: null = loading, otherwise { configured, source, keySuffix }
  const [keyStatus, setKeyStatus] = useState(null);
  const [keyInput, setKeyInput] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [feedback, setFeedback] = useState(null); // { severity, message }

  const refreshKeyStatus = useCallback(function() {
    Meteor.call('orderCatalog.checkUmlsSetting', function(error, result) {
      if (error) {
        log.warn('OrderCatalogConfiguration checkUmlsSetting error', { reason: error.reason });
        setKeyStatus({ configured: false, source: null, keySuffix: '' });
      } else {
        setKeyStatus(result);
      }
    });
  }, []);

  useEffect(function() {
    refreshKeyStatus();
  }, [refreshKeyStatus]);

  async function handleSaveKey() {
    setBusyAction('save');
    setFeedback(null);
    try {
      const result = await Meteor.callAsync('orderCatalog.saveUmlsApiKey', keyInput);
      setKeyStatus(result);
      setKeyInput('');
      setFeedback({ severity: 'success', message: 'UMLS API key saved (ending in …' + result.keySuffix + ').' });
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
      const result = await Meteor.callAsync('orderCatalog.clearUmlsApiKey');
      setKeyStatus(result);
      setFeedback({
        severity: 'info',
        message: result.configured
          ? 'Stored key cleared; a key still resolves ' + (SOURCE_LABELS[result.source] || result.source) + '.'
          : 'UMLS API key cleared.'
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
      const result = await Meteor.callAsync('orderCatalog.testUmlsConnection');
      setFeedback({
        severity: 'success',
        message: 'UMLS connection OK using the key ' + (SOURCE_LABELS[result.source] || result.source) + '.'
      });
    } catch (error) {
      setFeedback({ severity: 'error', message: get(error, 'reason') || get(error, 'message') || 'Connection test failed' });
    } finally {
      setBusyAction('');
    }
  }

  const keyConfigured = get(keyStatus, 'configured', false);

  return (
    <Box>
      {/* --- UMLS API key (BYOK) --- */}
      <Card sx={{ mb: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
        <CardHeader
          avatar={<KeyIcon color="primary" />}
          title="UMLS API Key"
          subheader="NLM terminology access for catalog hydration (bring your own key)"
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
                  id="getUmlsApiKeyLink"
                  href="https://uts.nlm.nih.gov/uts/edit-profile"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get your API key…
                </Link>{' '}
                (UTS profile; requires a free UMLS license). The key is stored server-side
                and never sent to the browser. A VSAC key saved on the quality-measures
                Terminology panel is the same credential and is reused automatically.
              </Typography>

              {keyConfigured ? (
                <Alert severity="success" id="umlsKeyConfiguredAlert">
                  API key configured (ending in …{get(keyStatus, 'keySuffix', '')}),{' '}
                  {SOURCE_LABELS[get(keyStatus, 'source')] || get(keyStatus, 'source')}.
                </Alert>
              ) : (
                <Alert severity="warning" id="umlsKeyMissingAlert">
                  <AlertTitle>No UMLS API key configured</AlertTitle>
                  CPT search is disabled (RxNorm search works without a key). Paste your
                  UMLS API key below, or set Meteor.settings.private.umls.apiKey / the
                  UMLS_API_KEY environment variable.
                </Alert>
              )}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  id="umlsApiKeyInput"
                  label="UMLS API Key"
                  type="password"
                  size="small"
                  fullWidth
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  autoComplete="off"
                />
                <Button
                  id="saveUmlsKeyButton"
                  variant="contained"
                  onClick={handleSaveKey}
                  disabled={!keyInput.trim() || busyAction === 'save'}
                  startIcon={busyAction === 'save' ? <CircularProgress size={16} /> : <KeyIcon />}
                >
                  Save
                </Button>
                <Button
                  id="clearUmlsKeyButton"
                  variant="outlined"
                  onClick={handleClearKey}
                  disabled={busyAction === 'clear' || get(keyStatus, 'source') !== 'database'}
                >
                  Clear
                </Button>
                <Button
                  id="testUmlsConnectionButton"
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

      {/* --- RxNorm medications (keyless via RxNav) --- */}
      <SearchHydrateCard
        idPrefix="rxnorm"
        icon={<MedicationIcon color="primary" />}
        title="RxNorm Medications"
        subheader="Search RxNorm via the public RxNav API and hydrate the medication catalog"
        helpText={'Searches rxnav.nlm.nih.gov (public, no key required) for clinical and ' +
          'branded drugs (SCD/SBD term types) matching a drug name — e.g. "metformin" or ' +
          '"lisinopril". Selected concepts are stored as catalog PlanDefinitions with ' +
          'RxNorm codings, ready for CPOE medication ordering.'}
        searchMethod="orderCatalog.searchRxNorm"
        catalogType="medication"
        conceptKey="rxcui"
        disabled={false}
        disabledAlert={null}
      />

      {/* --- CPT procedures (key-gated via UMLS REST) --- */}
      <SearchHydrateCard
        idPrefix="cpt"
        icon={<ProcedureIcon color="primary" />}
        title="CPT Procedures"
        subheader="Search CPT via the UMLS REST API and hydrate the procedure catalog"
        helpText={'Searches uts-ws.nlm.nih.gov for CPT procedure codes matching a term — ' +
          'e.g. "colonoscopy" or "office visit". CPT is AMA-licensed and only available ' +
          'through a UMLS account, so this requires the API key above. Selected codes are ' +
          'stored as catalog PlanDefinitions with CPT codings.'}
        searchMethod="orderCatalog.searchCptCodes"
        catalogType="procedure"
        conceptKey="code"
        disabled={!keyConfigured}
        disabledAlert={
          <Alert severity="warning" id="cptSearchDisabledAlert">
            <AlertTitle>CPT search disabled</AlertTitle>
            No UMLS API key is configured. Contact your administrator, or save your key
            above (Meteor.settings.private.umls.apiKey / UMLS_API_KEY also work).
          </Alert>
        }
      />
    </Box>
  );
}
