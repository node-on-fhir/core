// /packages/pacio-core/client/components/FhirFetchPanel.jsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('FhirFetchPanel') : console);

export function FhirFetchPanel(props) {
  // Access useNavigate from Meteor object (packages can't directly import from react-router-dom)
  const useNavigate = Meteor.useNavigate;
  const navigate = useNavigate ? useNavigate() : () => console.warn('useNavigate not available');

  // Get Honeycomb theme for dark mode support
  const useAppTheme = Meteor.useTheme;
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Theme-aware colors for cards
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';

  const [patientId, setPatientId] = useState('patient-betsysmith-johnson01');
  // An explicit ?endpoint= override (props.endpoint from PatientFetchPage)
  // wins; otherwise the configured inbound-fetch interface
  // (settings.public.interfaces.default — see /server-configuration?tab=interfaces)
  const [fhirServerUrl, setFhirServerUrl] = useState(
    get(props, 'endpoint.url') ||
    get(Meteor, 'settings.public.interfaces.default.channel.endpoint', '') ||
    Meteor.absoluteUrl('baseR4')
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [resourceLogs, setResourceLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  // SMART connect state — launchable endpoints from the spider, the settings
  // gate, and the in-flight connection.
  const [connectGate, setConnectGate] = useState(null);   // null = loading (tri-state)
  const [launchableEndpoints, setLaunchableEndpoints] = useState([]);
  const [selectedEndpointId, setSelectedEndpointId] = useState('');
  const [connecting, setConnecting] = useState(false);

  // Build the full URL based on components
  const buildUrl = () => {
    return `${fhirServerUrl}/Patient/${patientId}/$everything`;
  };

  // Add log entry
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setResourceLogs(prev => [...prev, { timestamp, message, type }]);
  };

  // On mount: load the connect gate + launchable endpoints, and complete a
  // returning OAuth callback (?connect-code&connect-state from
  // /connect/callback) — exchange happens server-side, then the pull runs
  // with the opaque sessionToken.
  useEffect(function() {
    let cancelled = false;

    async function loadConnectState() {
      try {
        const gate = await Meteor.rpc('connect.checkEnabled', {});
        if (!cancelled) { setConnectGate(gate || {}); }
      } catch (gateError) {
        if (!cancelled) { setConnectGate({}); }
      }
      try {
        const endpoints = await Meteor.rpc('connect.listLaunchableEndpoints', {});
        if (!cancelled) { setLaunchableEndpoints(endpoints || []); }
      } catch (listError) {
        // not signed in yet, or none probed — leave empty
      }
    }
    loadConnectState();

    const params = new URLSearchParams(window.location.search);
    const connectError = params.get('connect-error');
    const connectCode = params.get('connect-code');
    const connectState = params.get('connect-state');

    function scrubCallbackParams() {
      const clean = new URLSearchParams(window.location.search);
      ['connect-code', 'connect-state', 'connect-error'].forEach(function(key) { clean.delete(key); });
      const next = window.location.pathname + (clean.toString() ? '?' + clean.toString() : '');
      window.history.replaceState(null, '', next);
    }

    if (connectError) {
      setError('EHR connection failed: ' + connectError);
      addLog('EHR connection failed: ' + connectError, 'error');
      scrubCallbackParams();
    } else if (connectCode && connectState) {
      scrubCallbackParams();
      (async function completeAndFetch() {
        setConnecting(true);
        addLog('Completing SMART launch (exchanging code server-side)...', 'info');
        try {
          const session = await Meteor.rpc('connect.completeLaunch', {
            code: connectCode,
            state: connectState
          });
          addLog('Connected to ' + get(session, 'fhirBaseUrl', 'EHR') +
            ' — patient context: ' + (get(session, 'patient') || '(none)'), 'success');
          setConnecting(false);
          await runFetch({ sessionToken: get(session, 'sessionToken') },
            get(session, 'patient', ''));
        } catch (completeError) {
          setConnecting(false);
          setError(get(completeError, 'reason', completeError.message));
          addLog('Launch completion failed: ' + get(completeError, 'reason', completeError.message), 'error');
        }
      })();
    }

    return function() { cancelled = true; };
  }, []);

  // Begin the SMART standalone launch for the selected probed endpoint —
  // server builds the PKCE authorize URL, browser goes to the vendor login.
  async function beginConnect() {
    if (!selectedEndpointId) { return; }
    setError(null);
    setConnecting(true);
    try {
      const result = await Meteor.rpc('connect.beginLaunch', { endpointId: selectedEndpointId });
      addLog('Redirecting to the EHR sign-in page...', 'info');
      window.location.assign(get(result, 'authorizeUrl'));
    } catch (beginError) {
      setConnecting(false);
      setError(get(beginError, 'reason', beginError.message));
    }
  }

  // Handle fetch operation (manual URL path)
  const handleFetch = async () => {
    const url = buildUrl();
    await runFetch({ url: url, patientId: patientId }, patientId);
  };

  // Shared fetch runner — rpcParams is either {url, patientId} (open
  // endpoint) or {sessionToken} (bearer pull after a SMART connect).
  const runFetch = async (rpcParams, displayPatientId) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setResourceLogs([]);
    setProgress(0);

    try {
      addLog(rpcParams.sessionToken
        ? 'Starting authorized fetch via connected EHR session...'
        : `Starting fetch from: ${rpcParams.url}`, 'info');

      // Call server method to fetch patient data
      try {
        const result = await Meteor.rpc('pacio.fetchPatientEverything', rpcParams);
        {
          log.phi('Successfully fetched patient data', { result }, { action: 'read' });

          // Log summary information
          addLog(`Fetch complete! Mode: ${result.mode || '$everything'} · Pages: ${result.pagesFetched}`, 'success');
          addLog(`Total resources: ${result.resourceCount}`, 'success');
          if (result.deniedResourceTypes && result.deniedResourceTypes.length > 0) {
            addLog(`Not granted by this EHR (${result.deniedResourceTypes.length}): ` +
              result.deniedResourceTypes.map(d => `${d.label} (${d.status})`).join(', '), 'info');
          }
          if (result.attachments && result.attachments.downloaded > 0) {
            addLog(`Attachments downloaded to GridFS: ${result.attachments.downloaded}` +
              (result.attachments.skipped ? ` (${result.attachments.skipped} skipped)` : ''), 'success');
          }

          // Log resource breakdown
          if (result.resourceDetails && result.resourceDetails.length > 0) {
            addLog('--- Resource Details ---', 'info');
            result.resourceDetails.forEach(resource => {
              addLog(`${resource.resourceType}: ${resource.id}`, 'resource');
            });
          }

          if (result.resourceCounts) {
            addLog('--- Resource Summary ---', 'info');
            Object.entries(result.resourceCounts).forEach(([type, count]) => {
              addLog(`${type}: ${count} resources`, 'summary');
            });
          }

          const pageInfo = result.pagesFetched > 1 ? ` across ${result.pagesFetched} pages` : '';
          setSuccess(`Successfully fetched ${result.resourceCount || 0} resources${pageInfo} for patient ${result.patientId || displayPatientId}`);

          // Import the bundle if available
          if (result.bundle) {
            setIsImporting(true);
            addLog('Starting import with MedicalRecordImporter...', 'info');

            setTimeout(() => {
              try {
                Meteor.MedicalRecordImporter.importBundle(result.bundle);
                addLog('Import completed successfully!', 'success');
                setIsImporting(false);

                // Set session variables and navigate to patient chart if successful
                if (result.patientId) {
                  Session.set('selectedPatientId', result.patientId);
                  if (result.patientResource) {
                    Session.set('selectedPatient', result.patientResource);
                    addLog(`Set selected patient: ${result.patientResource.name?.[0]?.text || result.patientId}`, 'info');
                  }

                  addLog(`Redirecting to patient chart in 2 seconds...`, 'info');
                  setTimeout(() => {
                    navigate('/patient-chart');
                  }, 2000);
                }
              } catch (importError) {
                console.error('Import error:', importError);
                addLog(`Import error: ${importError.message}`, 'error');
                setIsImporting(false);
              }
            }, 100);
          } else {
            setIsLoading(false);
          }
        }
      } catch (error) {
        setIsLoading(false);
        log.error('Error fetching patient data', error);
        setError(error.message || 'Failed to fetch patient data');
        addLog(`Error: ${error.message}`, 'error');
      }

    } catch (err) {
      setIsLoading(false);
      console.error('Error in runFetch:', err);
      setError(err.message || 'An unexpected error occurred');
      addLog(`Error: ${err.message}`, 'error');
    }
  };

  // Get log color based on type
  const getLogColor = (type) => {
    switch(type) {
      case 'error': return 'error.dark';
      case 'success': return 'success.dark';
      case 'resource': return 'primary.dark';
      case 'summary': return 'secondary.dark';
      default: return 'text.primary';
    }
  };

  const connectEnabled = !!get(connectGate, 'enabled', false);
  const configuredVendors = get(connectGate, 'configuredVendors', []);
  const selectedLaunchable = launchableEndpoints.find(function(ep) {
    return ep.endpointId === selectedEndpointId;
  });
  const selectedVendorConfigured = selectedLaunchable
    ? configuredVendors.indexOf(selectedLaunchable.vendor) >= 0
    : false;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* SMART Connect Card — authorized fetch from a probed hospital endpoint */}
      <Card sx={{ bgcolor: 'background.paper' }}>
        <CardHeader
          title="Connect to your hospital"
          subheader="SMART standalone patient launch against a probed endpoint (sign in at the hospital's own portal)"
        />
        <CardContent>
          {connectGate !== null && !connectEnabled ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Patient Records Connect is disabled. Ask your administrator to enable it
              (Meteor.settings.private.smartConnect.enabled) and configure a vendor client_id.
            </Alert>
          ) : null}
          {connectEnabled && launchableEndpoints.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              No launchable endpoints yet. Hydrate the directory (Server Configuration → Lantern),
              find your hospital at /lantern, and run its conformance probe — endpoints graded
              patient-launchable appear here.
            </Alert>
          ) : null}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { sm: 'center' } }}>
            <FormControl fullWidth size="small" disabled={!connectEnabled || !launchableEndpoints.length}>
              <InputLabel id="connectEndpointLabel">Hospital / endpoint</InputLabel>
              <Select
                labelId="connectEndpointLabel"
                id="connectEndpointSelect"
                label="Hospital / endpoint"
                value={selectedEndpointId}
                onChange={function(event) { setSelectedEndpointId(event.target.value); }}
              >
                {launchableEndpoints.map(function(endpoint) {
                  return (
                    <MenuItem key={endpoint.endpointId} value={endpoint.endpointId}>
                      <Box component="span" sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {endpoint.name || endpoint.address}
                        <Chip label={endpoint.vendor} size="small" variant="outlined" />
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <Button
              id="connectToEhrButton"
              variant="contained"
              startIcon={connecting ? <CircularProgress size={18} color="inherit" /> : <LinkIcon />}
              disabled={!connectEnabled || !selectedEndpointId || !selectedVendorConfigured || connecting || isLoading}
              onClick={beginConnect}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {connecting ? 'Connecting…' : 'Connect & Fetch'}
            </Button>
          </Box>
          {selectedLaunchable && !selectedVendorConfigured ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              No client_id configured for vendor “{selectedLaunchable.vendor}” — ask your
              administrator to set Meteor.settings.private.smartConnect.vendors.{selectedLaunchable.vendor}.clientId.
            </Typography>
          ) : null}
        </CardContent>
      </Card>

      {/* FHIR Server Configuration Card */}
      <Card sx={{
        bgcolor: cardBgColor,
        color: cardTextColor,
        '& .MuiTypography-root': { color: cardTextColor },
        '& .MuiCardHeader-subheader': {
          color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
        },
        '& .MuiInputLabel-root': { color: cardTextColor },
        '& .MuiInputBase-root': { color: cardTextColor },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)'
        },
        '& .MuiFormHelperText-root': {
          color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
        }
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="FHIR Server URL"
              value={fhirServerUrl}
              onChange={(e) => setFhirServerUrl(e.target.value)}
              helperText="Base URL of the FHIR server"
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Patient Identifier"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              helperText="The patient ID to fetch data for"
              variant="outlined"
            />

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: isDark ? '#2a2a2a' : '#f5f5f5'
              }}
            >
              <Typography variant="subtitle2" sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
              }} gutterBottom>
                Generated URL:
              </Typography>
              <Typography variant="body2" sx={{
                wordBreak: 'break-all',
                fontFamily: 'monospace',
                color: cardTextColor
              }}>
                {buildUrl()}
              </Typography>
            </Paper>

            <Divider />

            {(isLoading || isImporting) && (
              <Box sx={{ width: '100%' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {isImporting ? 'Importing resources...' : 'Fetching data...'}
                </Typography>
                <LinearProgress variant="indeterminate" />
              </Box>
            )}

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleFetch}
                disabled={isLoading || isImporting || !patientId || !fhirServerUrl}
                startIcon={(isLoading || isImporting) && <CircularProgress size={20} />}
                size="large"
              >
                {isLoading ? 'Fetching...' : isImporting ? 'Importing...' : 'Fetch Patient Data'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Fetch Console Card */}
      <Card sx={{
        bgcolor: cardBgColor,
        color: cardTextColor,
        '& .MuiTypography-root': { color: cardTextColor },
        '& .MuiCardHeader-subheader': {
          color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
        },
        '& .MuiListItemText-secondary': {
          color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
        }
      }}>
        <CardHeader
          title="Fetch Console"
          subheader="Resource fetch progress and details"
          action={
            resourceLogs.length > 0 && (
              <Button size="small" onClick={() => setResourceLogs([])}>
                Clear
              </Button>
            )
          }
        />
        <CardContent>
          <Box
            sx={{
              p: 2,
              backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
              color: cardTextColor,
              maxHeight: '500px',
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)',
              borderRadius: 1
            }}
          >
            {resourceLogs.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Console output will appear here...
              </Typography>
            ) : (
              <List dense sx={{ p: 0 }}>
                {resourceLogs.map((log, index) => (
                  <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                    <ListItemText
                      primary={
                        <Box component="span" sx={{ color: getLogColor(log.type) }}>
                          [{log.timestamp}] {log.message}
                        </Box>
                      }
                      sx={{ m: 0 }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default FhirFetchPanel;
