// imports/ui/OAuthPatientPickerPage.jsx
// OAuth Patient Picker for SMART on FHIR standalone launches with launch/patient scope

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Container,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  Button,
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Grid
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import WarningIcon from '@mui/icons-material/Warning';

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import PatientSearchDialog from '../components/PatientSearchDialog.jsx';
import { LoginForm } from '../accounts/client/components/LoginForm';

//===========================================================================
// MAIN COMPONENT

export function OAuthPatientPickerPage(props) {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Granular scope selection for ONC g(10) AUT-PAT-18 compliance
  const [selectedResourceScopes, setSelectedResourceScopes] = useState([]);
  const [nonResourceScopes, setNonResourceScopes] = useState([]);
  const [allResourceScopes, setAllResourceScopes] = useState([]);

  // Authentication and user role check
  // Determines what patients the user can authorize access to:
  // - practitionerId set: Clinician - can select any patient (full directory)
  // - patientId set: Patient - can only authorize their own record
  // - guardianshipIds set: Guardian/POA - can authorize specific records (future)
  // - None set: Account not linked - cannot authorize any patient access
  const {
    userId,
    isLoggingIn,
    user,
    userPatientId,
    userPractitionerId,
    userGuardianshipIds,
    linkedPatient,
    linkedPatientsLoading
  } = useTracker(function() {
    const currentUser = Meteor.user();
    const patientId = get(currentUser, 'patientId');
    const practitionerId = get(currentUser, 'practitionerId');
    const guardianshipIds = get(currentUser, 'guardianshipIds', []);

    // Subscribe to user's linked patient record(s) if they have patientId
    let patientHandle = { ready: () => true };
    let linkedPatientRecord = null;

    if (patientId) {
      patientHandle = Meteor.subscribe('patients.byId', patientId);
      if (patientHandle.ready()) {
        // Try to find by FHIR id first, then by _id
        linkedPatientRecord = Patients.findOne({ id: patientId }) ||
                              Patients.findOne({ _id: patientId });
      }
    }

    return {
      userId: Meteor.userId(),
      isLoggingIn: Meteor.loggingIn(),
      user: currentUser,
      userPatientId: patientId,
      userPractitionerId: practitionerId,
      userGuardianshipIds: guardianshipIds,
      linkedPatient: linkedPatientRecord,
      linkedPatientsLoading: !patientHandle.ready()
    };
  }, []);

  // Determine user access type
  const isClinician = !!userPractitionerId;
  const isPatient = !!userPatientId;
  const isGuardian = userGuardianshipIds && userGuardianshipIds.length > 0;
  const hasLinkedAccess = isClinician || isPatient || isGuardian;

  // Extract OAuth parameters from URL
  const oauthParams = {
    clientId: searchParams.get('client_id'),
    state: searchParams.get('state'),
    redirectUri: searchParams.get('redirect_uri'),
    scope: searchParams.get('scope'),
    responseType: searchParams.get('response_type') || 'code',
    codeChallenge: searchParams.get('code_challenge'),
    codeChallengeMethod: searchParams.get('code_challenge_method'),
    aud: searchParams.get('aud')
  };

  // Validate required parameters on mount
  useEffect(function() {
    if (!oauthParams.clientId) {
      setError('Missing required parameter: client_id');
    } else if (!oauthParams.redirectUri) {
      setError('Missing required parameter: redirect_uri');
    } else if (!oauthParams.state) {
      setError('Missing required parameter: state');
    }
  }, []);

  // Parse scopes into resource and non-resource categories for granular selection
  // ONC g(10) AUT-PAT-18 requires patients to be able to deny specific resource scopes
  useEffect(function() {
    if (oauthParams.scope) {
      const scopes = oauthParams.scope.split(' ').filter(function(s) { return s.trim(); });
      const resourceScopes = [];
      const otherScopes = [];

      scopes.forEach(function(scope) {
        // Resource scopes follow pattern: patient/Resource.rs or user/Resource.rs
        if (scope.match(/^(patient|user|system)\/[A-Za-z]+\.(rs|read|write|c?r?u?d?s?)$/)) {
          resourceScopes.push(scope);
        } else {
          // Non-resource scopes: launch/patient, openid, fhirUser, offline_access, etc.
          otherScopes.push(scope);
        }
      });

      setAllResourceScopes(resourceScopes);
      setSelectedResourceScopes(resourceScopes); // Default: all selected
      setNonResourceScopes(otherScopes);
    }
  }, [oauthParams.scope]);

  // Toggle a resource scope on/off
  function handleResourceScopeToggle(scope) {
    setSelectedResourceScopes(function(prev) {
      if (prev.includes(scope)) {
        return prev.filter(function(s) { return s !== scope; });
      } else {
        return [...prev, scope];
      }
    });
  }

  // Select all resource scopes
  function handleSelectAllScopes() {
    setSelectedResourceScopes([...allResourceScopes]);
  }

  // Deselect all resource scopes
  function handleDeselectAllScopes() {
    setSelectedResourceScopes([]);
  }

  // Extract resource name from scope string (e.g., "patient/Observation.rs" -> "Observation")
  function getResourceNameFromScope(scope) {
    const match = scope.match(/^(?:patient|user|system)\/([A-Za-z]+)\./);
    return match ? match[1] : scope;
  }

  // Handle patient selection from the picker (clinician flow)
  function handlePatientSelect(patientId, patient) {
    console.log('OAuthPatientPickerPage.handlePatientSelect - patientId:', patientId);
    console.log('OAuthPatientPickerPage.handlePatientSelect - patient:', patient);

    if (patient) {
      setSelectedPatient(patient);
      setConfirmDialogOpen(true);
    } else {
      console.warn('No patient object provided to handlePatientSelect');
    }
  }

  // Handle selection of linked patient (patient/guardian flow)
  function handleLinkedPatientSelect(patient) {
    console.log('OAuthPatientPickerPage.handleLinkedPatientSelect - patient:', patient);
    setSelectedPatient(patient);
    setConfirmDialogOpen(true);
  }

  // Confirm authorization and redirect
  async function handleConfirmAuthorization() {
    if (!selectedPatient) {
      setError('No patient selected');
      return;
    }

    setIsProcessing(true);
    setConfirmDialogOpen(false);

    // Build authorized scope from user selections (ONC g(10) AUT-PAT-18)
    // Combine non-resource scopes (always granted) with user-selected resource scopes
    const authorizedScope = [...nonResourceScopes, ...selectedResourceScopes].join(' ');
    console.log('OAuthPatientPickerPage - authorizedScope:', authorizedScope);

    try {
      // Call server method to complete OAuth with patient selection
      const result = await Meteor.callAsync('OAuth.completeWithPatient', {
        clientId: oauthParams.clientId,
        patientId: selectedPatient._id,
        patientFhirId: selectedPatient.id,
        state: oauthParams.state,
        redirectUri: oauthParams.redirectUri,
        scope: authorizedScope,
        codeChallenge: oauthParams.codeChallenge,
        codeChallengeMethod: oauthParams.codeChallengeMethod
      });

      console.log('OAuth.completeWithPatient result:', result);

      if (result && result.redirectUrl) {
        // Redirect to the client's redirect_uri with the authorization code
        window.location.href = result.redirectUrl;
      } else if (result && result.code) {
        // Build redirect URL manually if not provided
        const redirectUrl = new URL(oauthParams.redirectUri);
        redirectUrl.searchParams.set('code', result.code);
        redirectUrl.searchParams.set('state', oauthParams.state);
        window.location.href = redirectUrl.toString();
      } else {
        setError('Failed to complete authorization: No redirect URL returned');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('OAuth.completeWithPatient error:', err);
      setError('Failed to complete authorization: ' + (err.reason || err.message || 'Unknown error'));
      setIsProcessing(false);
    }
  }

  // Cancel and go back
  function handleCancel() {
    // Redirect back to client with error
    if (oauthParams.redirectUri) {
      const redirectUrl = new URL(oauthParams.redirectUri);
      redirectUrl.searchParams.set('error', 'access_denied');
      redirectUrl.searchParams.set('error_description', 'User denied patient selection');
      if (oauthParams.state) {
        redirectUrl.searchParams.set('state', oauthParams.state);
      }
      window.location.href = redirectUrl.toString();
    } else {
      // Just go back if no redirect URI
      window.history.back();
    }
  }

  // Get patient display name
  function getPatientDisplayName(patient) {
    if (!patient) return 'Unknown';

    const name = get(patient, 'name[0]', {});
    if (name.text) return name.text;

    const given = get(name, 'given[0]', '');
    const family = get(name, 'family', '');
    return `${given} ${family}`.trim() || 'Unknown';
  }

  // Render loading state
  if (isProcessing) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6">
              Completing authorization...
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Render error state
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Card>
          <CardHeader title="Authorization Error" />
          <CardContent>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Typography variant="body2" color="text.secondary">
              The authorization request could not be completed. Please try again or contact support.
            </Typography>
          </CardContent>
          <CardActions>
            <Button onClick={handleCancel} color="primary">
              Cancel
            </Button>
          </CardActions>
        </Card>
      </Container>
    );
  }

  // Render logging in state
  if (isLoggingIn) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6">
              Checking authentication...
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Render login form if not authenticated
  if (!userId) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Authentication Required"
            subheader="Please sign in to select a patient for authorization"
          />
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>Application:</strong> {oauthParams.clientId || 'Unknown'}
            </Typography>
            {oauthParams.scope && (
              <Typography variant="body2" color="text.secondary">
                <strong>Requested access:</strong> {oauthParams.scope}
              </Typography>
            )}
          </CardContent>
        </Card>
        <LoginForm
          onSuccess={function() {
            // Stay on page - useTracker will detect the login and re-render
            console.log('OAuthPatientPickerPage: Login successful, page will re-render');
          }}
        />
      </Container>
    );
  }

  // Render account not linked error
  // Security: Users without patientId or practitionerId cannot authorize any patient access
  if (!hasLinkedAccess) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Card>
          <CardHeader
            title="Account Not Linked"
            avatar={<WarningIcon color="warning" />}
          />
          <CardContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Your account is not linked to any patient or practitioner record.
            </Alert>
            <Typography variant="body1" sx={{ mb: 2 }}>
              To authorize access to patient data, your account must be linked to either:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><PersonIcon /></ListItemIcon>
                <ListItemText
                  primary="A Patient record"
                  secondary="For patients accessing their own health data"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><LocalHospitalIcon /></ListItemIcon>
                <ListItemText
                  primary="A Practitioner record"
                  secondary="For healthcare providers accessing patient data"
                />
              </ListItem>
            </List>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Please contact your administrator to link your account, or visit your profile page to create a patient record.
            </Typography>
          </CardContent>
          <CardActions>
            <Button onClick={handleCancel} color="inherit">
              Cancel
            </Button>
            <Button href="/my-profile" variant="outlined" color="primary">
              Go to My Profile
            </Button>
          </CardActions>
        </Card>
      </Container>
    );
  }

  // Render loading state for linked patient data
  if (isPatient && linkedPatientsLoading) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6">
              Loading your patient record...
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // PATIENT FLOW: Show only the user's own patient record
  if (isPatient && !isClinician) {
    // Patient not found in database
    if (!linkedPatient) {
      return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Card>
            <CardHeader title="Patient Record Not Found" />
            <CardContent>
              <Alert severity="error" sx={{ mb: 2 }}>
                Your linked patient record could not be found in the system.
              </Alert>
              <Typography variant="body2" color="text.secondary">
                Your account is linked to patient ID: <code>{userPatientId}</code>, but this record
                does not exist in the database. Please contact your administrator.
              </Typography>
            </CardContent>
            <CardActions>
              <Button onClick={handleCancel} color="primary">
                Cancel
              </Button>
            </CardActions>
          </Card>
        </Container>
      );
    }

    // Show patient's own record for authorization
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Card>
          <CardHeader
            title="Authorize Access"
            subheader="An application is requesting access to your health data"
          />
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Application:</strong> {oauthParams.clientId}
              </Typography>
              {oauthParams.scope && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <strong>Requested access:</strong> {oauthParams.scope}
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Your Patient Record:
            </Typography>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <ListItemButton onClick={function() { handleLinkedPatientSelect(linkedPatient); }}>
                <ListItemIcon>
                  <PersonIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={getPatientDisplayName(linkedPatient)}
                  secondary={`ID: ${linkedPatient.id || linkedPatient._id}`}
                />
              </ListItemButton>
            </Card>

            <Alert severity="info" sx={{ mt: 2 }}>
              Click on your record above to authorize the application to access your health data.
            </Alert>
          </CardContent>
          <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
            <Button onClick={handleCancel} color="inherit">
              Deny Access
            </Button>
          </CardActions>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialogOpen}
          onClose={function() { setConfirmDialogOpen(false); }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirm Authorization</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              You are about to authorize <strong>{oauthParams.clientId}</strong> to access your health data:
            </Typography>
            <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6">
                {getPatientDisplayName(selectedPatient)}
              </Typography>
              {selectedPatient && (
                <Typography variant="body2" color="text.secondary">
                  ID: {selectedPatient.id || selectedPatient._id}
                </Typography>
              )}
            </Card>

            {/* Granular scope selection - ONC g(10) AUT-PAT-18 compliance */}
            {allResourceScopes.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Select which resources to authorize:
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Button size="small" onClick={handleSelectAllScopes} sx={{ mr: 1 }}>
                    Select All
                  </Button>
                  <Button size="small" onClick={handleDeselectAllScopes}>
                    Deselect All
                  </Button>
                </Box>
                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <FormGroup>
                    <Grid container spacing={1}>
                      {allResourceScopes.map(function(scope) {
                        return (
                          <Grid item xs={6} sm={4} key={scope}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedResourceScopes.includes(scope)}
                                  onChange={function() { handleResourceScopeToggle(scope); }}
                                  size="small"
                                />
                              }
                              label={getResourceNameFromScope(scope)}
                              sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                            />
                          </Grid>
                        );
                      })}
                    </Grid>
                  </FormGroup>
                </FormControl>
              </Box>
            )}

            {nonResourceScopes.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                <strong>Also granting:</strong> {nonResourceScopes.join(', ')}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={function() { setConfirmDialogOpen(false); }} color="inherit">
              Cancel
            </Button>
            <Button onClick={handleConfirmAuthorization} variant="contained" color="primary">
              Authorize Access
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

  // CLINICIAN FLOW: Full patient directory search
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Card>
        <CardHeader
          title="Select Patient"
          subheader="An application is requesting access to patient data. As a clinician, you may select any patient."
          avatar={<LocalHospitalIcon color="primary" />}
        />
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Application:</strong> {oauthParams.clientId}
            </Typography>
            {oauthParams.scope && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>Requested access:</strong> {oauthParams.scope}
              </Typography>
            )}
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            You are signed in as a clinician (Practitioner ID: {userPractitionerId}).
            You may authorize access to any patient in the directory.
          </Alert>

          <PatientSearchDialog
            onSelect={handlePatientSelect}
            hideFhirBarcode={true}
          />
        </CardContent>
        <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
          <Button onClick={handleCancel} color="inherit">
            Cancel
          </Button>
        </CardActions>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={function() { setConfirmDialogOpen(false); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Patient Selection</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You are about to authorize <strong>{oauthParams.clientId}</strong> to access the following patient's data:
          </Typography>
          <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">
              {getPatientDisplayName(selectedPatient)}
            </Typography>
            {selectedPatient && (
              <Typography variant="body2" color="text.secondary">
                ID: {selectedPatient.id || selectedPatient._id}
              </Typography>
            )}
          </Card>

          {/* Granular scope selection - ONC g(10) AUT-PAT-18 compliance */}
          {allResourceScopes.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Select which resources to authorize:
              </Typography>
              <Box sx={{ mb: 1 }}>
                <Button size="small" onClick={handleSelectAllScopes} sx={{ mr: 1 }}>
                  Select All
                </Button>
                <Button size="small" onClick={handleDeselectAllScopes}>
                  Deselect All
                </Button>
              </Box>
              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <FormGroup>
                  <Grid container spacing={1}>
                    {allResourceScopes.map(function(scope) {
                      return (
                        <Grid item xs={6} sm={4} key={scope}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={selectedResourceScopes.includes(scope)}
                                onChange={function() { handleResourceScopeToggle(scope); }}
                                size="small"
                              />
                            }
                            label={getResourceNameFromScope(scope)}
                            sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                          />
                        </Grid>
                      );
                    })}
                  </Grid>
                </FormGroup>
              </FormControl>
            </Box>
          )}

          {nonResourceScopes.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              <strong>Also granting:</strong> {nonResourceScopes.join(', ')}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={function() { setConfirmDialogOpen(false); }} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmAuthorization} variant="contained" color="primary">
            Authorize Access
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default OAuthPatientPickerPage;
