// imports/components/LaunchAppsModal.jsx
// Modal for launching registered SMART apps with EHR launch context

import React, { useState } from 'react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';

import LaunchIcon from '@mui/icons-material/Launch';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';
import { get } from 'lodash';

import { OAuthClients } from '/imports/collections/OAuthClients';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

//===========================================================================
// MAIN COMPONENT

export function LaunchAppsModal(props) {
  const {
    open,
    onClose,
    patient,
    encounterId,
    imagingStudyId,
    gridfsFileId
  } = props;

  const navigate = useNavigate();
  const [launching, setLaunching] = useState(null);
  const [error, setError] = useState(null);

  // Subscribe to OAuth clients and get launchable apps
  const { isLoading, clients } = useTracker(function() {
    const handle = Meteor.subscribe('OAuthClients');

    if (!handle.ready()) {
      return { isLoading: true, clients: [] };
    }

    // Get all clients that have a launch_uri or redirect_uri configured
    const allClients = OAuthClients.find({
      $or: [
        { launch_uri: { $exists: true, $ne: '' } },
        { redirect_uris: { $exists: true, $ne: [] } }
      ]
    }).fetch();

    console.log('LaunchAppsModal - Found clients:', allClients.length);

    return { isLoading: false, clients: allClients };
  }, []);

  // Get patient display info
  function getPatientDisplayName() {
    if (!patient) {
      console.warn('LaunchAppsModal: No patient provided');
      return 'No patient selected';
    }

    // Check if this is a flattened patient (name is a string)
    if (typeof patient.name === 'string' && patient.name.length > 0) {
      return patient.name;
    }

    // Check for FHIR patient with name array - use FhirUtilities.pluckName
    if (Array.isArray(patient.name)) {
      const patientName = FhirUtilities.pluckName(patient);
      if (patientName && patientName.length > 0) {
        return patientName;
      }
    }

    // Fallback to name.text if available
    const nameText = get(patient, 'name[0].text') || get(patient, 'name.text');
    if (nameText) return nameText;

    // Fallback to manual assembly
    const given = get(patient, 'name[0].given[0]', '') || get(patient, 'name.given[0]', '');
    const family = get(patient, 'name[0].family', '') || get(patient, 'name.family', '');
    const assembled = `${given} ${family}`.trim();

    if (assembled.length > 0) {
      return assembled;
    }

    // Last resort - show the patient ID
    const patientId = patient.id || patient._id;
    console.warn('LaunchAppsModal: Could not determine patient name, using ID:', patientId);
    return `Patient ${patientId}`;
  }

  // Handle app launch
  async function handleLaunch(client) {
    console.log('LaunchAppsModal.handleLaunch - client:', client);
    console.log('LaunchAppsModal.handleLaunch - patient:', patient);

    if (!patient) {
      setError('No patient selected');
      return;
    }

    setLaunching(client._id);
    setError(null);

    try {
      // Call server method to create EHR launch context
      const result = await Meteor.callAsync('OAuth.createEhrLaunchContext', {
        clientId: client.client_id || client._id,
        patientId: patient._id,
        patientFhirId: patient.id,
        encounterId: encounterId,
        imagingStudyId: imagingStudyId,
        gridfsFileId: gridfsFileId
      });

      console.log('OAuth.createEhrLaunchContext result:', result);

      if (result && result.launchUrl) {
        // Open the app in a new window
        window.open(result.launchUrl, '_blank', 'noopener,noreferrer');
        onClose();
      } else {
        setError('Failed to create launch context');
      }
    } catch (err) {
      console.error('OAuth.createEhrLaunchContext error:', err);
      setError('Failed to launch app: ' + (err.reason || err.message || 'Unknown error'));
    } finally {
      setLaunching(null);
    }
  }

  // Get client display name
  function getClientDisplayName(client) {
    return client.client_name || client.client_id || client._id;
  }

  // Get client description
  function getClientDescription(client) {
    if (client.description) return client.description;
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LaunchIcon />
          Launch SMART App
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Patient context info */}
        <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Launching for patient:
          </Typography>
          <Typography variant="h6">
            {getPatientDisplayName()}
          </Typography>
          {patient && (
            <Typography variant="body2" color="text.secondary">
              ID: {patient.id || patient._id}
            </Typography>
          )}
        </Box>

        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={function() { setError(null); }}>
            {error}
          </Alert>
        )}

        {/* Loading state */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : clients.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No registered SMART apps found.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Register apps at <Link component="button" onClick={function() { onClose(); navigate('/oauth-clients'); }}>/oauth-clients</Link>
            </Typography>
          </Box>
        ) : (
          <Box>
            {clients.map(function(client) {
              const isLaunching = launching === client._id;
              const description = getClientDescription(client);

              // Build preview URL for this client
              const fhirPath = get(Meteor, 'settings.public.fhir.fhirPath', 'baseR4');
              const iss = Meteor.absoluteUrl() + fhirPath;
              const patientFhirId = patient ? (patient.id || patient._id) : 'none';
              const launchUri = client.launch_uri || get(client, 'redirect_uris.0', '');
              let previewUrl = launchUri + '?iss=' + encodeURIComponent(iss) + '&launch=<token>&patient=' + encodeURIComponent(patientFhirId);
              if (imagingStudyId) {
                previewUrl += '&imagingStudy=' + encodeURIComponent(imagingStudyId);
              }
              if (gridfsFileId) {
                previewUrl += '&gridfsFileId=' + encodeURIComponent(gridfsFileId);
              }

              return (
                <Accordion
                  key={client._id}
                  disableGutters
                  sx={{
                    opacity: isLaunching ? 0.7 : 1,
                    transition: 'opacity 0.2s',
                    '&:before': { display: 'none' }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1 } }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, mr: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          {getClientDisplayName(client)}
                        </Typography>
                        {client.launch_type === 'confidential' && (
                          <Chip size="small" label="Confidential" color="primary" />
                        )}
                      </Box>
                      {description && (
                        <Typography variant="body2" color="text.secondary">
                          {description}
                        </Typography>
                      )}
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={isLaunching ? <CircularProgress size={16} color="inherit" /> : <OpenInNewIcon />}
                      onClick={function(event) { event.stopPropagation(); handleLaunch(client); }}
                      disabled={isLaunching || !patient}
                      sx={{ flexShrink: 0 }}
                    >
                      {isLaunching ? 'Launching...' : 'Launch'}
                    </Button>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        SMART Launch URL
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mt: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.7rem',
                            wordBreak: 'break-all',
                            color: 'text.primary',
                            flex: 1
                          }}
                        >
                          {previewUrl}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={function() { navigator.clipboard.writeText(previewUrl); }}
                          sx={{ flexShrink: 0 }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    {client.client_id && (
                      <Box sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Client ID:
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {client.client_id}
                        </Typography>
                      </Box>
                    )}
                    {launchUri && (
                      <Box sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Launch URI:
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {launchUri}
                        </Typography>
                      </Box>
                    )}
                    {client.redirect_uris && client.redirect_uris.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Redirect URIs:
                        </Typography>
                        {client.redirect_uris.map(function(uri, i) {
                          return (
                            <Typography key={i} variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {uri}
                            </Typography>
                          );
                        })}
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default LaunchAppsModal;
