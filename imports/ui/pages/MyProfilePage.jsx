// imports/ui/pages/MyProfilePage.jsx

import React, { memo, useState, useEffect, useCallback } from 'react';
import { 
  Button, 
  Container, 
  Snackbar, 
  TextField, 
  Typography, 
  Box,
  Paper,
  Divider,
  Alert,
  IconButton,
  InputAdornment,
  useTheme,
  Dialog,
  DialogTitle,
  DialogActions,
  Collapse,
  Chip,
  Stack,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ScannerIcon from '@mui/icons-material/Scanner';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';

import { get } from 'lodash';
import moment from 'moment';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import PatientCard from '../../patient/PatientCard.jsx';
import PractitionerCard from '../../practitioner/PractitionerCard.jsx';
import PractitionerSearchDialog from '../../components/PractitionerSearchDialog.jsx';
import { Patients } from '../../lib/schemas/SimpleSchemas/Patients';
import { Practitioners } from '../../lib/schemas/SimpleSchemas/Practitioners';
import { PractitionerRoles } from '../../lib/schemas/SimpleSchemas/PractitionerRoles';
import { OAuthClients } from '../../collections/OAuthClients';

function MyProfilePage(props) {
  console.info('Rendering the MyProfilePage');
  console.debug('imports.ui.pages.MyProfilePage');

  const { children, staticContext, ...otherProps } = props;

  const [error, setError] = useState();
  const [successMessage, setSuccessMessage] = useState('');
  const [openPractitionerSearch, setOpenPractitionerSearch] = useState(false);
  const [showApiExample, setShowApiExample] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showGrokKey, setShowGrokKey] = useState(false);
  const [openAIKey, setOpenAIKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [grokKey, setGrokKey] = useState('');
  const [savingKeys, setSavingKeys] = useState(false);
  const [scanningRecords, setScanningRecords] = useState(false);
  const [terminologyCodes, setTerminologyCodes] = useState({
    snomed: [],
    loinc: [],
    icd10: []
  });
  // Authorized Apps state for ONC g(10) 9.3.01 token revocation
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [authToRevoke, setAuthToRevoke] = useState(null);
  const [revokingAuth, setRevokingAuth] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Subscribe to current user data
  useTracker(() => {
    const handles = [
      Meteor.subscribe('accounts.currentUser'),
      Meteor.subscribe('practitioners.current'),
      Meteor.subscribe('practitionerRoles.current'),
      Meteor.subscribe('OAuthClients.forPatient')  // ONC g(10) 9.3.01 - Patient's authorized apps
    ];
    return handles.every(h => h.ready());
  }, []);

  // Subscribe to linked patient record when patientId is set
  useTracker(() => {
    const user = Meteor.user();
    const patientId = get(user, 'patientId');
    if (patientId) {
      console.log('MyProfilePage - Subscribing to patients.byId:', patientId);
      Meteor.subscribe('patients.byId', patientId);
    }
  }, []);

  let currentUser = useTracker(function(){
    // Always get fresh data from Meteor.user() for reactivity
    const meteorUser = Meteor.user();
    console.log('MyProfilePage - meteorUser:', meteorUser);
    console.log('MyProfilePage - userId:', Meteor.userId());
    console.log('MyProfilePage - practitionerId:', get(meteorUser, 'practitionerId'));
    
    // Update session if needed for other components
    if (meteorUser && (!Session.get('currentUser') || Session.get('currentUser')._id !== meteorUser._id)) {
      Session.set('currentUser', meteorUser);
    }
    
    // Always return Meteor.user() for proper reactivity
    return meteorUser;
  }, []);

  // Load terminology from user profile
  useEffect(() => {
    if (currentUser?.profile?.terminology) {
      setTerminologyCodes({
        snomed: get(currentUser, 'profile.terminology.snomed', []),
        loinc: get(currentUser, 'profile.terminology.loinc', []),
        icd10: get(currentUser, 'profile.terminology.icd10', [])
      });
    }
  }, [currentUser]);

  // Get patient's authorized applications - ONC g(10) 9.3.01
  const patientAuthorizations = useTracker(function() {
    const user = Meteor.user();
    const patientId = get(user, 'patientId');

    if (!patientId) {
      return [];
    }

    return OAuthClients.find(
      {
        patient_id: patientId,
        revoked_at: { $exists: false }
      },
      { sort: { access_token_created_at: -1 } }
    ).fetch();
  }, []);

  let accountsAccessToken = useTracker(function(){
    const sessionToken = Session.get('accountsAccessToken');
    const storedToken = Accounts._storedLoginToken();
    console.log('MyProfilePage - sessionToken:', sessionToken);
    console.log('MyProfilePage - storedToken:', storedToken);
    
    // Use stored token if session is not set
    return sessionToken || storedToken;
  }, [])

  // Get the patient record for the current user
  let currentPatient = useTracker(function(){
    const patientId = get(currentUser, 'patientId');
    if(patientId){
      // Search both _id and id fields to handle both MongoDB and FHIR identifier formats
      // This matches the server publication query in patients.byId
      const patient = Patients.findOne({
        $or: [{ _id: patientId }, { id: patientId }]
      });
      if (!patient) {
        console.warn('MyProfilePage - Patient not found for _id or id:', patientId);
      }
      return patient;
    }
    return null;
  }, [currentUser])
  
  // Track selected patient from session
  let selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, [])
  
  let selectedPatient = useTracker(function(){
    return Session.get('selectedPatient');
  }, [])

  // Get the practitioner record for the current user
  let currentPractitioner = useTracker(function(){
    const practitionerId = get(currentUser, 'practitionerId');
    if(practitionerId){
      // Search both _id and id fields to handle both MongoDB and FHIR identifier formats
      // This matches the server publication query in practitioners.current
      const practitioner = Practitioners.findOne({
        $or: [{ _id: practitionerId }, { id: practitionerId }]
      });
      if (!practitioner) {
        console.warn('MyProfilePage - Practitioner not found for _id or id:', practitionerId);
      }
      return practitioner;
    }
    return null;
  }, [currentUser])

  // Get the practitioner role for the current user
  let currentPractitionerRole = useTracker(function(){
    const practitionerRoleId = get(currentUser, 'practitionerRoleId');
    if(practitionerRoleId){
      // Search both _id and id fields to handle both MongoDB and FHIR identifier formats
      // This matches the server publication query in practitionerRoles.current
      const practitionerRole = PractitionerRoles.findOne({
        $or: [{ _id: practitionerRoleId }, { id: practitionerRoleId }]
      });
      if (!practitionerRole) {
        console.warn('MyProfilePage - PractitionerRole not found for _id or id:', practitionerRoleId);
      }
      return practitionerRole;
    }
    return null;
  }, [currentUser])

  let headerHeight = 64;
  if(get(Meteor, 'settings.public.defaults.prominentHeader')){
    headerHeight = 128;
  }
  
  // Load existing API keys from user profile
  useEffect(() => {
    if(currentUser) {
      const llmConfig = get(currentUser, 'profile.externalServices.llmConfig', {});
      // Load the actual keys from the profile
      const savedOpenAIKey = get(llmConfig, 'openaiApiKey', '');
      const savedAnthropicKey = get(llmConfig, 'claudeApiKey', '');
      
      // Set the keys in state
      setOpenAIKey(savedOpenAIKey);
      setAnthropicKey(savedAnthropicKey);
    }
  }, [currentUser]);
  
  // Debug current data
  console.log('MyProfilePage render - currentUser:', currentUser);
  console.log('MyProfilePage render - currentUser._id:', get(currentUser, '_id'));
  console.log('MyProfilePage render - currentUser.id:', get(currentUser, 'id'));
  console.log('MyProfilePage render - currentUser.emails:', get(currentUser, 'emails'));
  console.log('MyProfilePage render - accountsAccessToken:', accountsAccessToken);

  // Handle practitioner selection from search dialog
  async function handlePractitionerSelect(practitionerId, practitioner) {
    console.log('Selected practitioner:', practitionerId, practitioner);
    
    try {
      await Meteor.callAsync('users.linkPractitionerId', practitionerId);
      setSuccessMessage('Practitioner record linked successfully!');
      setOpenPractitionerSearch(false);
      
      // The useTracker hooks will detect the change automatically
      // via Meteor's reactivity system. The currentUser and currentPractitioner
      // will update when the user document changes on the server.
      console.log('Practitioner linked. UI will update via reactivity.');
      
    } catch (error) {
      console.error('Error linking practitioner:', error);
      setError(error.message || 'Failed to link practitioner record');
    }
  }
  
  // Debug: Link to CMO for testing
  async function handleLinkToCMO() {
    try {
      const result = await Meteor.callAsync('debug.linkCurrentUserToCMO');
      setSuccessMessage(result.message);
    } catch (error) {
      console.error('Error linking to CMO:', error);
      setError(error.message || 'Failed to link to Chief Medical Officer');
    }
  }

  // Handle saving API keys
  async function handleSaveApiKeys() {
    setSavingKeys(true);
    try {
      const config = {
        llmMode: 'cloud',
        cloudProvider: openAIKey ? 'openai' : 'anthropic',
        claudeApiKey: anthropicKey || '',
        openaiApiKey: openAIKey || '',
        grokApiKey: grokKey || '',
        selectedLocalModel: '',
        systemPrompt: 'You are a helpful medical assistant with expertise in clinical decision support.',
        temperature: 0.7,
        topP: 0.95,
        maxTokens: 2048,
        showSystemPrompt: true
      };
      
      await Meteor.callAsync('llm.saveConfig', config);
      setSuccessMessage('API keys saved successfully!');
    } catch (error) {
      console.error('Error saving API keys:', error);
      setError(error.message || 'Failed to save API keys');
    } finally {
      setSavingKeys(false);
    }
  }

  async function handleDeleteAccount(){
    console.log('Deleting account...');

    if(confirm("Are you sure that you want to delete this account?")){
      Meteor.call('deleteMyAccount', async function(error, result){
        if(error){
          console.error('error', error)
          setError(error.message || 'Failed to delete account');
        }
        if(result === "User health data deleted, and account deactivated."){
          // Log out using Meteor's built-in method
          Meteor.logout((err) => {
            if (err) {
              console.error('Logout error:', err);
              setError('Failed to logout after account deletion');
            } else {
              console.log('Logged out successfully after account deletion');
              
              // Navigate to home page
              navigate('/');
            }
          });

          // close dialog
          Session.set('mainAppDialogOpen', false);

          // clear current user 
          Session.set('currentUser', false);

          // clear session data
          Session.set('sessionId', false);
          Session.set('accountsAccessToken', '')
          Session.set('accountsRefreshToken', '')
          Session.set('sessionRefreshToken', false);    

          // clear selections which may contain user data
          Session.set('selectedAffiliations', []);
          Session.set('selectedAllergyIntolerance', false);
          Session.set('selectedAllergyIntoleranceId', "");
          Session.set('selectedAuditEventId', false);
          Session.set('selectedBundleId', "");
          Session.set('selectedCarePlan', false);
          Session.set('selectedCarePlanId', "");
          Session.set('selectedCarePlans', []);
          Session.set('selectedCareTeam', false);
          Session.set('selectedCareTeamId', "");
          Session.set('selectedCodeSystem', false);
          Session.set('selectedCodeSystemId', "");
          Session.set('selectedCodeSystems', []);
          Session.set('selectedCommunication', false);
          Session.set('selectedCommunicationId', "");
          Session.set('selectedCommunicationRequest', false);
          Session.set('selectedCommunicationRequests', []);
          Session.set('selectedCommunications', false);
          Session.set('selectedComposition', false);
          Session.set('selectedCompositionId', "");
          Session.set('selectedCondition', false);
          Session.set('selectedConditionId', "");
          Session.set('selectedConsent', false);
          Session.set('selectedConsentId', "");
          Session.set('selectedDevice', false);
          Session.set('selectedDeviceId', "");
          Session.set('selectedDefinitions', []);
          Session.set('selectedDiagnosticReport', false);
          Session.set('selectedDiagnosticReportId', "");
          Session.set('selectedDocumentReference', false);
          Session.set('selectedDocumentReferenceId', "");
          Session.set('selectedDocumentSource', false);
          Session.set('selectedEncounter', false);
          Session.set('selectedEncounterId', "");
          Session.set('selectedEndpoint', false);
          Session.set('selectedEndpointId', "");
          Session.set('selectedEndpoints', []);
          Session.set('selectedExplanationOfBenefit', false);
          Session.set('selectedExplanationOfBenefitId', "");
          Session.set('selectedGoal', false);
          Session.set('selectedGoalId', "");
          Session.set('selectedHealthcareService', false);
          Session.set('selectedHealthcareServiceId', "");
          Session.set('selectedInsurancePlan', false);
          Session.set('selectedInsurancePlanId', "");
          Session.set('selectedInsurancePlans', []);
          Session.set('selectedList', false);
          Session.set('selectedListId', "");
          Session.set('selectedLocation', false);
          Session.set('selectedLocationId', "");
          Session.set('selectedLocations', []);
          Session.set('selectedMeasure', false);
          Session.set('selectedMeasureId', "");
          Session.set('selectedMeasureReport', false);
          Session.set('selectedMeasureReportId', "");
          Session.set('selectedMeasureReports', []);
          Session.set('selectedMedication', false);
          Session.set('selectedMedicationId', "");
          Session.set('selectedMedicationOrder', false);
          Session.set('selectedMedicationOrderId', "");
          Session.set('selectedMedicationStatement', false);
          Session.set('selectedMedicationStatementId', "");
          Session.set('selectedMedications', []);
          Session.set('selectedMessageHeader', false);
          Session.set('selectedMessageHeaderId', "");
          Session.set('selectedNetwork', false);
          Session.set('selectedNetworkId', "");
          Session.set('selectedNetworks', []);
          Session.set('selectedObservation', false);
          Session.set('selectedObservationCode', false);
          Session.set('selectedObservationId', "");
          Session.set('selectedObservationType', false);
          Session.set('selectedOrganization', false);
          Session.set('selectedOrganizationAffiliation', false);
          Session.set('selectedOrganizationAffiliationId', "");
          Session.set('selectedOrganizationId', "");
          Session.set('selectedOrganizations', []);
          Session.set('selectedParameters', false);
          Session.set('selectedPatient', false);
          Session.set('selectedPatientId', "");
          Session.set('selectedPerson', false);
          Session.set('selectedPersonId', "");
          Session.set('selectedPersons', []);
          Session.set('selectedPractitionerId', "");
          Session.set('selectedPractitionerRole', false);
          Session.set('selectedPractitionerRoleId', "");
          Session.set('selectedPractitioners', []);
          Session.set('selectedProcedure', false);
          Session.set('selectedProcedureId', "");
          Session.set('selectedProvenanceId', "");
          Session.set('selectedProvenances', []);
          Session.set('selectedQuestionnaire', false);
          Session.set('selectedQuestionnaireId', "");
          Session.set('selectedQuestionnaireResponse', false);
          Session.set('selectedQuestionnaireResponseId', "");
          Session.set('selectedResponse', false);
          Session.set('selectedRestriction', false);
          Session.set('selectedRestrictionId', "");
          Session.set('selectedRestrictions', []);
          Session.set('selectedResults', false);
          Session.set('selectedRiskAssessment', false);
          Session.set('selectedRiskAssessmentId', "");
          Session.set('selectedRoles', false);
          Session.set('selectedSearchParameter', false);
          Session.set('selectedSearchParameterId', "");
          Session.set('selectedServiceRequestId', "");
          Session.set('selectedServices', []);
          Session.set('selectedStructureDefinition', false);
          Session.set('selectedStructureDefinitionId', "");
          Session.set('selectedSubscription', false);
          Session.set('selectedSubscriptionId', "");
          Session.set('selectedSubscriptions', []);
          Session.set('selectedTask', false);
          Session.set('selectedTaskId', "");
          Session.set('selectedTasks', []);
          Session.set('selectedTeams', []);
          Session.set('selectedValueSet', false);
          Session.set('selectedValueSetId', "");
          Session.set('selectedValueSets', []);
          Session.set('selectedVerificationResult', false);
          Session.set('selectedVerificationResultId', "");

          // clear form data
          Session.set('CareTeam.Current', "{\"resourceType\":\"CareTeam\"}")
          Session.set('CodeSystem.Current', "{\"resourceType\":\"CodeSystem\"}")
          Session.set('Communication.Current', "{\"resourceType\":\"Communication\"}")
          Session.set('CommunicationRequest.Current', "{\"resourceType\":\"CommunicationRequest\"}")
          Session.set('Endpoint.Current', "{\"resourceType\":\"Endpoint\"}")
          Session.set('HealthcareService.Current', "{\"resourceType\":\"HealthcareService\"}")
          Session.set('InsurancePlan.Current', "{\"resourceType\":\"InsurancePlan\"}")
          Session.set('Location.Current', "{\"resourceType\":\"Location\"}")
          Session.set('Network.Current', "{\"resourceType\":\"Network\"}")
          Session.set('Organization.Current', "{\"resourceType\":\"Organization\"}")
          Session.set('OrganizationAffiliation.Current', "{\"resourceType\":\"OrganizationAffiliation\"}")
          Session.set('Practitioner.Current', "{\"resourceType\":\"Practitioner\"}")
          Session.set('PractitionerRole.Current', "{\"resourceType\":\"PractitionerRole\"}")
          Session.set('Provenance.Current', "{\"resourceType\":\"Provenance\"}")
          Session.set('RelatedPerson.Current', "{\"resourceType\":\"RelatedPerson\"}")
          Session.set('Restriction.Current', "{\"resourceType\":\"Restriction\"}")
          Session.set('SearchParameter.Current', "{\"resourceType\":\"SearchParameter\"}")
          Session.set('StructureDefinition.Current', "{\"resourceType\":\"StructureDefinition\"}")
          Session.set('Subscription.Current', "{\"resourceType\":\"Subscription\"}")
          Session.set('Task.Current', "{\"resourceType\":\"Task\"}")
          Session.set('ValueSet.Current', "{\"resourceType\":\"ValueSet\"}")
          Session.set('VerificationResult.Current', "{\"resourceType\":\"VerificationResult\"}")

          // trigger refresh on UI elements
          Session.set('lastUpdated', new Date());
        }
      })
    }
  }

  // Handle token revocation - ONC g(10) 9.3.01
  async function handleRevokeAuthorization() {
    if (!authToRevoke) {
      console.warn('handleRevokeAuthorization - No authorization selected');
      return;
    }

    setRevokingAuth(true);
    try {
      await Meteor.callAsync('OAuth.revokePatientAuthorization', authToRevoke._id);
      setSuccessMessage('Application access revoked successfully');
      setRevokeDialogOpen(false);
      setAuthToRevoke(null);
      console.log('handleRevokeAuthorization - Successfully revoked:', authToRevoke._id);
    } catch (error) {
      console.error('handleRevokeAuthorization - Error:', error);
      setError(error.reason || error.message || 'Failed to revoke access');
    } finally {
      setRevokingAuth(false);
    }
  }


  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.grey[50],
      pt: 2
    }}>
    <Container maxWidth="lg" sx={{ pb: 4 }}>
      <Snackbar
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
        open={!!error}
        autoHideDuration={6000}
        onClose={function(){
          setError(undefined)
        }}
      >
        <Alert onClose={() => setError(undefined)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Typography variant="h4" gutterBottom component="h1" sx={{ mb: 3 }}>
        My Profile
      </Typography>

      {/* Patient Record Link Card - Swap entire card when patient is linked */}
      {currentPatient ? (
        <Box sx={{ mb: 3, position: 'relative' }}>
          <PatientCard
            patient={currentPatient}
            showBarcode={false}
            showDetails={false}
            showSummary={true}
            showName={true}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={function() { navigate('/patients/' + currentPatient._id); }}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16
            }}
          >
            Edit
          </Button>
        </Box>
      ) : get(currentUser, 'patientId') ? (
        /* Stale link - patientId is set but record not found */
        <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            Patient Record Link
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            Patient record not found. The linked record (ID: {get(currentUser, 'patientId')}) may have been deleted or the database was refreshed.
          </Alert>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="error"
              onClick={async () => {
                try {
                  await Meteor.callAsync('users.clearPatientLink');
                  setSuccessMessage('Patient link cleared successfully. You can now link a new patient record.');
                } catch (error) {
                  console.error('Error clearing patient link:', error);
                  setError(error.message || 'Failed to clear patient link');
                }
              }}
            >
              Clear Stale Link
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                navigate('/patients/new');
              }}
            >
              Create New Patient Record
            </Button>
          </Box>
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            Patient Record Link
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Link your patient record to access personal health information, medical history, and enable patient-specific features.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            No patient record linked to your account. Create one to access patient-specific features and health records.
          </Alert>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                Session.set('selectedPatientId', get(currentUser, 'patientId') || get(currentUser, 'id'));
                navigate('/patients/new');
              }}
            >
              Create Patient Record
            </Button>
            {Package['clinical:data-importer'] && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  navigate('/import-data?next=my-profile');
                }}
              >
                Load Personal Health Record
              </Button>
            )}
            <Button
              variant="outlined"
              color="primary"
              onClick={async () => {
                const patientIdToLink = selectedPatientId || get(selectedPatient, '_id');

                if (patientIdToLink) {
                  try {
                    await Meteor.callAsync('users.linkPatient', patientIdToLink);
                    setSuccessMessage('Patient record linked successfully!');
                    // The reactive data will update automatically
                  } catch (error) {
                    console.error('Error linking patient:', error);
                    setError(error.message || 'Failed to link patient record');
                  }
                } else {
                  setError('No patient selected. Please select a patient first.');
                }
              }}
              disabled={!selectedPatientId && !selectedPatient}
            >
              Link Selected Patient
            </Button>
          </Box>
        </Paper>
      )}

      {/* Practitioner Record Link Card */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          Professional License
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Link your professional credentials such as physician license, nursing license, commercial driver's license, pilot's license, or other professional certifications.
        </Typography>

        {currentPractitioner ? (
          <Box sx={{ mb: 2 }}>
            <PractitionerCard
              practitioner={currentPractitioner}
              practitionerRole={currentPractitionerRole}
              showBarcode={false}
              showDetails={true}
              showSummary={false}
              showHeader={false}
              showName={false}
              showAvatar={false}
              showActiveStatus={false}
              showLanguages={false}
              showLicenses={true}
            />
          </Box>
        ) : get(currentUser, 'practitionerId') ? (
          /* Stale link - practitionerId is set but record not found */
          <Alert severity="error" sx={{ mb: 2 }}>
            Practitioner record not found. The linked record (ID: {get(currentUser, 'practitionerId')}) may have been deleted or the database was refreshed.
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            No practitioner record linked to your account. Create one to enable professional communication features.
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Show stale link clear button */}
          {!currentPractitioner && get(currentUser, 'practitionerId') && (
            <>
              <Button
                variant="contained"
                color="error"
                onClick={async () => {
                  try {
                    await Meteor.callAsync('users.clearPractitionerLink');
                    setSuccessMessage('Practitioner link cleared successfully. You can now link a new practitioner record.');
                  } catch (error) {
                    console.error('Error clearing practitioner link:', error);
                    setError(error.message || 'Failed to clear practitioner link');
                  }
                }}
              >
                Clear Stale Link
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  navigate('/practitioners/new?save=my-profile&cancel=my-profile');
                }}
              >
                Create New Practitioner Record
              </Button>
            </>
          )}
          {/* Show create/link buttons when no practitionerId is set */}
          {!currentPractitioner && !get(currentUser, 'practitionerId') && (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  Session.set('selectedPractitionerId', get(currentUser, 'practitionerId') || get(currentUser, 'id'));
                  // Navigate with return URL
                  navigate('/practitioners/new?save=my-profile&cancel=my-profile');
                }}
              >
                Create Practitioner Record
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setOpenPractitionerSearch(true);
                }}
              >
                Link Existing License
              </Button>
            </>
          )}
          {currentPractitioner && (
            <>
              <Button
                variant="outlined"
                onClick={() => {
                  Session.set('selectedPractitionerId', get(currentPractitioner, 'id'));
                  navigate('/practitioners/' + get(currentPractitioner, 'id'));
                }}
              >
                Edit Practitioner Details
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={async () => {
                  if (confirm('Are you sure you want to unlink your practitioner records?')) {
                    try {
                      await Meteor.callAsync('users.unlinkPractitionerRecords');
                      setSuccessMessage('Practitioner records unlinked successfully!');
                      // No need to reload - the reactive data will update automatically
                    } catch (error) {
                      setError(error.message || 'Failed to unlink practitioner records');
                    }
                  }
                }}
              >
                Unlink License
              </Button>
            </>
          )}
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          Profile Information
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField 
            fullWidth
            type="text"
            label="User ID"
            value={get(currentUser, '_id', get(currentUser, 'id', ''))}
            InputLabelProps={{shrink: true}}
            InputProps={{
              readOnly: true,
            }}
          />
          <TextField 
            fullWidth
            type="text"
            label="Primary Email"
            value={get(currentUser, 'emails[0].address', '')}
            InputLabelProps={{shrink: true}}
            InputProps={{
              readOnly: true,
            }}
          />
          <TextField 
            fullWidth
            type="text"
            label="Session Access Token (API Key)"
            value={accountsAccessToken}
            InputLabelProps={{shrink: true}}
            InputProps={{
              readOnly: true,
              endAdornment: accountsAccessToken && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => {
                      navigator.clipboard.writeText(accountsAccessToken);
                      setSuccessMessage('API token copied to clipboard!');
                    }}
                    edge="end"
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            multiline
            rows={2}
            helperText="Use this token as your API key by including it in the 'session' header when making API requests"
          />
          {accountsAccessToken && (
            <>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setShowApiExample(!showApiExample)}
                  endIcon={showApiExample ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                >
                  API Usage Example
                </Button>
              </Box>
              <Collapse in={showApiExample} timeout="auto" unmountOnExit>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100', p: 2, borderRadius: 1, fontFamily: 'monospace' }}>
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: theme.palette.mode === 'dark' ? 'grey.100' : 'inherit' }}>
{`# Get a specific Patient record:
curl -H "session:${accountsAccessToken}" \\
  http://localhost:3000/baseR4/Patient/${get(currentUser, 'patientId', 'patient-id')}

# Search for Patients:
curl -H "session:${accountsAccessToken}" \\
  http://localhost:3000/baseR4/Patient?name=smith

# Get Observations for a Patient:
curl -H "session:${accountsAccessToken}" \\
  http://localhost:3000/baseR4/Observation?patient=${get(currentUser, 'patientId', 'patient-id')}`}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Your User ID is: <strong>{get(currentUser, '_id', 'not available')}</strong><br/>
                    Your linked Patient ID is: <strong>{get(currentUser, 'patientId', 'not linked')}</strong><br/>
                    Use your session token to authenticate API requests to access FHIR resources.
                  </Typography>
                </Box>
              </Collapse>
            </>
          )}
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          Roles and Linked Records
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField 
            fullWidth
            type="text"
            label="Role"
            value={get(currentUser, 'roles.0', '')}
            InputLabelProps={{shrink: true}}
            InputProps={{
              readOnly: true,
            }}
          />
          <TextField 
            fullWidth
            type="text"
            label="Patient ID"
            value={get(currentUser, 'patientId', '')}
            InputLabelProps={{shrink: true}}
            InputProps={{
              readOnly: true,
            }}
          />
          <TextField 
            fullWidth
            type="text"
            label="Practitioner ID"
            value={get(currentUser, 'practitionerId', '')}
            InputLabelProps={{shrink: true}}
            InputProps={{
              readOnly: true,
            }}
          />
          <TextField 
            fullWidth
            type="text"
            label="Practitioner Role ID"
            value={get(currentUser, 'practitionerRoleId', '')}
            InputLabelProps={{shrink: true}}
            InputProps={{
              readOnly: true,
            }}
          />
          {currentPractitionerRole && (
            <TextField 
              fullWidth
              type="text"
              label="Professional Role"
              value={get(currentPractitionerRole, 'code[0].text', get(currentPractitionerRole, 'code[0].coding[0].display', ''))}
              InputLabelProps={{shrink: true}}
              InputProps={{
                readOnly: true,
              }}
            />
          )}
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          Large Language Models
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Configure API keys for external AI services
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            type={showOpenAIKey ? 'text' : 'password'}
            label="OpenAI API Key"
            value={openAIKey}
            onChange={(e) => setOpenAIKey(e.target.value)}
            placeholder="sk-..."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                    edge="end"
                  >
                    {showOpenAIKey ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            type={showAnthropicKey ? 'text' : 'password'}
            label="Anthropic API Key"
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
            placeholder="sk-ant-..."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                    edge="end"
                  >
                    {showAnthropicKey ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            type={showGrokKey ? 'text' : 'password'}
            label="Grok API Key"
            value={grokKey}
            onChange={(e) => setGrokKey(e.target.value)}
            placeholder="xai-..."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowGrokKey(!showGrokKey)}
                    edge="end"
                  >
                    {showGrokKey ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            onClick={handleSaveApiKeys}
            disabled={savingKeys || (!openAIKey && !anthropicKey && !grokKey)}
            sx={{ alignSelf: 'flex-start' }}
          >
            {savingKeys ? 'Saving...' : 'Save API Keys'}
          </Button>
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          My Consent Records
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No consent records found.
        </Typography>
      </Paper>

      {/* Authorized Applications - ONC 170.315(g)(10) 9.3.01 Token Revocation */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SecurityIcon sx={{ mr: 1 }} color="primary" />
          <Typography variant="h6">
            Authorized Apps
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Third-party applications that have been granted access to your health data.
          You can revoke access at any time - revocation takes effect immediately.
        </Typography>

        {patientAuthorizations.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No applications currently have access to your health data.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {patientAuthorizations.map(function(auth) {
              const authorizedDate = get(auth, 'access_token_created_at') || get(auth, 'created_at');
              const expiresDate = get(auth, 'authorization_expires_at');
              const isExpired = expiresDate && moment(expiresDate).isBefore(moment());

              return (
                <Card key={auth._id} variant="outlined" sx={{ opacity: isExpired ? 0.6 : 1 }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {get(auth, 'client_name') || get(auth, 'client_id', 'Unknown Application')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Authorized: {authorizedDate ? moment(authorizedDate).format('MMM D, YYYY h:mm A') : 'Unknown'}
                        </Typography>
                        {expiresDate && (
                          <Typography variant="body2" color={isExpired ? 'error' : 'text.secondary'}>
                            {isExpired ? 'Expired: ' : 'Expires: '}
                            {moment(expiresDate).format('MMM D, YYYY h:mm A')}
                          </Typography>
                        )}
                      </Box>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={function() {
                          setAuthToRevoke(auth);
                          setRevokeDialogOpen(true);
                        }}
                        disabled={isExpired}
                      >
                        Revoke
                      </Button>
                    </Box>

                    {/* Scopes granted */}
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Access granted to:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {(get(auth, 'requested_scope') || get(auth, 'scope', '')).split(' ')
                          .filter(function(s) { return s && s.includes('/'); })
                          .slice(0, 5)
                          .map(function(scope) {
                            const resourceName = scope.split('/').pop().split('.')[0];
                            return (
                              <Chip
                                key={scope}
                                label={resourceName}
                                size="small"
                                variant="outlined"
                              />
                            );
                          })}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}
      </Paper>

      {/* Revoke Confirmation Dialog */}
      <Dialog
        open={revokeDialogOpen}
        onClose={function() { setRevokeDialogOpen(false); }}
      >
        <DialogTitle>Revoke Application Access</DialogTitle>
        <Box sx={{ px: 3, pb: 2 }}>
          <Typography>
            Are you sure you want to revoke access for <strong>{get(authToRevoke, 'client_name') || get(authToRevoke, 'client_id', 'this application')}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This application will immediately lose access to your health data.
          </Typography>
        </Box>
        <DialogActions>
          <Button onClick={function() { setRevokeDialogOpen(false); }} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleRevokeAuthorization}
            color="error"
            variant="contained"
            disabled={revokingAuth}
          >
            {revokingAuth ? 'Revoking...' : 'Revoke Access'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Terminology Relevant to My Care */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          Terminology Relevant to My Care
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Medical codes and terminology found in your health records
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            startIcon={scanningRecords ? <CircularProgress size={20} color="inherit" /> : <ScannerIcon />}
            onClick={async () => {
              setScanningRecords(true);
              try {
                // Initialize collections - try multiple ways to access them
                let Conditions, Observations, Procedures;
                
                // Try window.Collections first (client-side)
                if (typeof window !== 'undefined' && window.Collections) {
                  Conditions = window.Collections.Conditions;
                  Observations = window.Collections.Observations;
                  Procedures = window.Collections.Procedures;
                } else if (Meteor.Collections) {
                  Conditions = Meteor.Collections.Conditions;
                  Observations = Meteor.Collections.Observations;
                  Procedures = Meteor.Collections.Procedures;
                }
                
                // If still not found, try importing directly
                if (!Conditions) {
                  try {
                    const { Conditions: ConditionsImport } = await import('../../lib/schemas/SimpleSchemas/Conditions');
                    const { Observations: ObservationsImport } = await import('../../lib/schemas/SimpleSchemas/Observations');
                    const { Procedures: ProceduresImport } = await import('../../lib/schemas/SimpleSchemas/Procedures');
                    
                    Conditions = ConditionsImport;
                    Observations = ObservationsImport;
                    Procedures = ProceduresImport;
                  } catch (importError) {
                    console.warn('Could not import collections:', importError);
                  }
                }
                
                console.log('Collections found:', { 
                  Conditions: !!Conditions, 
                  Observations: !!Observations, 
                  Procedures: !!Procedures 
                });

                const codes = {
                  snomed: new Map(),
                  loinc: new Map(),
                  icd10: new Map()
                };

                // Helper function to extract codes
                const extractCodes = (coding) => {
                  if (Array.isArray(coding)) {
                    coding.forEach(code => {
                      if (code.system && code.code) {
                        const codeKey = `${code.code}|${code.display || ''}`;
                        if (code.system.includes('snomed')) {
                          codes.snomed.set(codeKey, {
                            code: code.code,
                            display: code.display || code.code,
                            system: 'SNOMED'
                          });
                        } else if (code.system.includes('loinc')) {
                          codes.loinc.set(codeKey, {
                            code: code.code,
                            display: code.display || code.code,
                            system: 'LOINC'
                          });
                        } else if (code.system.includes('icd-10') || code.system.includes('icd10')) {
                          codes.icd10.set(codeKey, {
                            code: code.code,
                            display: code.display || code.code,
                            system: 'ICD-10'
                          });
                        }
                      }
                    });
                  }
                };

                // Get patient ID
                const patientId = get(currentUser, 'patientId');
                console.log('Scanning for patient ID:', patientId);
                
                // Scan Conditions
                if (Conditions && patientId) {
                  const query = {
                    $or: [
                      { 'subject.reference': `Patient/${patientId}` },
                      { 'subject.reference': { $regex: `Patient/${patientId}` } }
                    ]
                  };
                  
                  const conditions = await Conditions.find(query).fetch();
                  console.log('Found conditions:', conditions.length);
                  
                  conditions.forEach(condition => {
                    if (condition.code?.coding) {
                      extractCodes(condition.code.coding);
                    }
                  });
                }

                // Scan Observations
                if (Observations && patientId) {
                  const query = {
                    $or: [
                      { 'subject.reference': `Patient/${patientId}` },
                      { 'subject.reference': { $regex: `Patient/${patientId}` } }
                    ]
                  };
                  
                  const observations = await Observations.find(query).fetch();
                  console.log('Found observations:', observations.length);
                  
                  observations.forEach(observation => {
                    if (observation.code?.coding) {
                      extractCodes(observation.code.coding);
                    }
                  });
                }

                // Scan Procedures
                if (Procedures && patientId) {
                  const query = {
                    $or: [
                      { 'subject.reference': `Patient/${patientId}` },
                      { 'subject.reference': { $regex: `Patient/${patientId}` } }
                    ]
                  };
                  
                  const procedures = await Procedures.find(query).fetch();
                  console.log('Found procedures:', procedures.length);
                  
                  procedures.forEach(procedure => {
                    if (procedure.code?.coding) {
                      extractCodes(procedure.code.coding);
                    }
                  });
                }

                // Convert maps to arrays
                const newTerminology = {
                  snomed: Array.from(codes.snomed.values()),
                  loinc: Array.from(codes.loinc.values()),
                  icd10: Array.from(codes.icd10.values())
                };
                
                console.log('Terminology found:', {
                  snomed: newTerminology.snomed.length,
                  loinc: newTerminology.loinc.length,
                  icd10: newTerminology.icd10.length,
                  sample: newTerminology
                });

                setTerminologyCodes(newTerminology);

                // Save to user profile (check if method exists)
                try {
                  await Meteor.callAsync('users.updateTerminology', newTerminology);
                } catch (methodError) {
                  console.warn('Could not save to profile:', methodError.message);
                  // Continue anyway - we still have the codes in state
                }
                
                setSuccessMessage(`Found ${newTerminology.snomed.length} SNOMED, ${newTerminology.loinc.length} LOINC, and ${newTerminology.icd10.length} ICD-10 codes`);
              } catch (error) {
                console.error('Error scanning records:', error);
                setError('Failed to scan medical records');
              } finally {
                setScanningRecords(false);
              }
            }}
            disabled={scanningRecords || !currentUser?.patientId}
          >
            {scanningRecords ? 'Scanning...' : 'Scan Records'}
          </Button>
          {!currentUser?.patientId && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
              Link a patient record first
            </Typography>
          )}
        </Box>

        {/* Display terminology codes */}
        <Stack spacing={2}>
          {terminologyCodes.snomed.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                SNOMED CT Codes
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {terminologyCodes.snomed.map((term, index) => (
                  <Chip
                    key={index}
                    label={`${term.code}: ${term.display}`}
                    variant="outlined"
                    sx={{ 
                      borderColor: 'primary.main',
                      mb: 1
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {terminologyCodes.loinc.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                LOINC Codes
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {terminologyCodes.loinc.map((term, index) => (
                  <Chip
                    key={index}
                    label={`${term.code}: ${term.display}`}
                    variant="outlined"
                    sx={{ 
                      borderColor: 'success.main',
                      mb: 1
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {terminologyCodes.icd10.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                ICD-10 Codes
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {terminologyCodes.icd10.map((term, index) => (
                  <Chip
                    key={index}
                    label={`${term.code}: ${term.display}`}
                    variant="outlined"
                    sx={{ 
                      borderColor: 'warning.main',
                      mb: 1
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {terminologyCodes.snomed.length === 0 && terminologyCodes.loinc.length === 0 && terminologyCodes.icd10.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No terminology codes found. Click "Scan Records" to analyze your medical records.
            </Typography>
          )}
        </Stack>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default' }}>
        <Typography variant="h6" gutterBottom color="error">
          Danger Area
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" sx={{ mb: 2 }}>
          Deleting your account will permanently remove all your data and cannot be undone.
        </Typography>
        <Button
          id="deleteUserButton"
          fullWidth
          variant="contained"
          color="error"
          onClick={handleDeleteAccount}
        >
          Delete Account
        </Button>
      </Paper>
      
      {/* Debug section - remove in production */}
      {Meteor.isDevelopment && !currentPractitioner && (
        <Paper elevation={3} sx={{ p: 3, mb: 3, border: '2px dashed orange', backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            Debug Tools (Dev Only)
          </Typography>
          <Button 
            variant="outlined" 
            color="warning"
            onClick={handleLinkToCMO}
          >
            Link to Chief Medical Officer (Testing)
          </Button>
        </Paper>
      )}
      
      {/* Practitioner Search Dialog */}
      <Dialog
        open={openPractitionerSearch}
        onClose={() => setOpenPractitionerSearch(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Search for Practitioner License</DialogTitle>
        <PractitionerSearchDialog
          onSelect={handlePractitionerSelect}
          hideFhirBarcode={true}
        />
        <DialogActions>
          <Button onClick={() => setOpenPractitionerSearch(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    </Box>
  );
}

export default MyProfilePage;