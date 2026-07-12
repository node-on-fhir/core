// /packages/pacio-core/client/components/FhirFetchPanel.jsx

import React, { useState } from 'react';
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
  LinearProgress
} from '@mui/material';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('FhirFetchPanel') : console);

export function FhirFetchPanel() {
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
  const [fhirServerUrl, setFhirServerUrl] = useState('https://gw.interop.community/paciosandbox/open');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [resourceLogs, setResourceLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  // Build the full URL based on components
  const buildUrl = () => {
    return `${fhirServerUrl}/Patient/${patientId}/$everything`;
  };

  // Add log entry
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setResourceLogs(prev => [...prev, { timestamp, message, type }]);
  };

  // Handle fetch operation
  const handleFetch = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setResourceLogs([]);
    setProgress(0);

    try {
      const url = buildUrl();
      addLog(`Starting fetch from: ${url}`, 'info');

      // Call server method to fetch patient data
      Meteor.call('pacio.fetchPatientEverything', url, patientId, function(error, result) {

        if (error) {
          setIsLoading(false);
          log.error('Error fetching patient data', error);
          setError(error.message || 'Failed to fetch patient data');
          addLog(`Error: ${error.message}`, 'error');
        } else {
          log.phi('Successfully fetched patient data', { result }, { action: 'read' });

          // Log summary information
          addLog(`Fetch complete! Pages: ${result.pagesFetched}`, 'success');
          addLog(`Total resources: ${result.resourceCount}`, 'success');

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
          setSuccess(`Successfully fetched ${result.resourceCount || 0} resources${pageInfo} for patient ${patientId}`);

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
      });

    } catch (err) {
      setIsLoading(false);
      console.error('Error in handleFetch:', err);
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
