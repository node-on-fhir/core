// imports/components/LaunchAppsModal.jsx
// Modal for launching registered SMART apps with EHR launch context

import React, { useState } from 'react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Divider,
  Chip
} from '@mui/material';

import LaunchIcon from '@mui/icons-material/Launch';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
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
    encounterId
  } = props;

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
        encounterId: encounterId
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
        <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
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
              Register apps at <a href="/oauth-clients">/oauth-clients</a>
            </Typography>
          </Box>
        ) : (
          <List>
            {clients.map(function(client, index) {
              const isLaunching = launching === client._id;
              const description = getClientDescription(client);

              return (
                <React.Fragment key={client._id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    sx={{
                      opacity: isLaunching ? 0.7 : 1,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getClientDisplayName(client)}
                          {client.launch_type === 'confidential' && (
                            <Chip size="small" label="Confidential" color="primary" />
                          )}
                        </Box>
                      }
                      secondary={description}
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={isLaunching ? <CircularProgress size={16} color="inherit" /> : <OpenInNewIcon />}
                        onClick={function() { handleLaunch(client); }}
                        disabled={isLaunching || !patient}
                      >
                        {isLaunching ? 'Launching...' : 'Launch'}
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
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
