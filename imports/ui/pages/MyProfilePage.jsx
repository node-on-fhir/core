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
  Collapse
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import { get } from 'lodash';
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

function MyProfilePage(props) {
  console.info('Rendering the MyProfilePage');
  console.debug('imports.ui.pages.MyProfilePage');

  const { children, staticContext, ...otherProps } = props;

  const [error, setError] = useState();
  const [successMessage, setSuccessMessage] = useState('');
  const [openPractitionerSearch, setOpenPractitionerSearch] = useState(false);
  const [showApiExample, setShowApiExample] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Subscribe to current user data
  useTracker(() => {
    const handles = [
      Meteor.subscribe('accounts.currentUser'),
      Meteor.subscribe('practitioners.current'),
      Meteor.subscribe('practitionerRoles.current')
    ];
    return handles.every(h => h.ready());
  }, []);

  let currentUser = useTracker(function(){
    const sessionUser = Session.get('currentUser');
    const meteorUser = Meteor.user();
    console.log('MyProfilePage - sessionUser:', sessionUser);
    console.log('MyProfilePage - meteorUser:', meteorUser);
    console.log('MyProfilePage - userId:', Meteor.userId());
    
    // Use Meteor.user() if session is not set
    return sessionUser || meteorUser;
  }, [])

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
      // Try both id and _id fields
      return Patients.findOne({
        $or: [
          { id: patientId },
          { _id: patientId }
        ]
      });
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
      // Try both id and _id fields
      return Practitioners.findOne({
        $or: [
          { id: practitionerId },
          { _id: practitionerId }
        ]
      });
    }
    return null;
  }, [currentUser])

  // Get the practitioner role for the current user
  let currentPractitionerRole = useTracker(function(){
    const practitionerRoleId = get(currentUser, 'practitionerRoleId');
    if(practitionerRoleId){
      // Try both id and _id fields
      return PractitionerRoles.findOne({
        $or: [
          { id: practitionerRoleId },
          { _id: practitionerRoleId }
        ]
      });
    }
    return null;
  }, [currentUser])

  let headerHeight = 64;
  if(get(Meteor, 'settings.public.defaults.prominentHeader')){
    headerHeight = 128;
  }
  
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
      
      // No need to reload - the reactive data will update automatically
      // The useTracker hooks will detect the change and re-render
      
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

  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
        <Box sx={{ mb: 3 }}>
          <PatientCard 
            patient={currentPatient}
            showBarcode={false}
            showDetails={false}
            showSummary={true}
            showName={true}
          />
        </Box>
      ) : (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
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
                const patientIdToLink = selectedPatientId || get(selectedPatient, 'id');
                
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
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
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
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            No practitioner record linked to your account. Create one to enable professional communication features.
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {!currentPractitioner && (
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

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
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

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
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


      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          My Consent Records
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No consent records found.
        </Typography>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom color="error">
          Danger Area
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" sx={{ mb: 2 }}>
          Deleting your account will permanently remove all your data and cannot be undone.
        </Typography>
        <Button 
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
        <Paper elevation={3} sx={{ p: 3, mb: 3, border: '2px dashed orange' }}>
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
  );
}

export default MyProfilePage;