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
  InputAdornment
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { get } from 'lodash';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import PatientCard from '../../patient/PatientCard.jsx';
import { Patients } from '../../lib/schemas/SimpleSchemas/Patients';

function MyProfilePage(props) {
  console.info('Rendering the MyProfilePage');
  console.debug('imports.ui.pages.MyProfilePage');

  const { children, staticContext, ...otherProps } = props;

  const [error, setError] = useState();
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  
  // Subscribe to current user data
  useTracker(() => {
    const handle = Meteor.subscribe('accounts.currentUser');
    return handle.ready();
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

  let headerHeight = 64;
  if(get(Meteor, 'settings.public.defaults.prominantHeader')){
    headerHeight = 128;
  }
  
  // Debug current data
  console.log('MyProfilePage render - currentUser:', currentUser);
  console.log('MyProfilePage render - currentUser._id:', get(currentUser, '_id'));
  console.log('MyProfilePage render - currentUser.id:', get(currentUser, 'id'));
  console.log('MyProfilePage render - currentUser.emails:', get(currentUser, 'emails'));
  console.log('MyProfilePage render - accountsAccessToken:', accountsAccessToken);

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
        <Paper elevation={3} sx={{ p: 2, mb: 3, textAlign: 'center', backgroundColor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary">
            No patient record linked to your account. 
            <Button 
              size="small"
              sx={{ ml: 1 }}
              onClick={() => {
                Session.set('selectedPatientId', get(currentUser, 'patientId') || get(currentUser, 'id'));
                navigate('/patients/new');
              }}
            >
              Create Patient Record
            </Button>
          </Typography>
        </Paper>
      )}

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
        </Box>
      </Paper>

      {accountsAccessToken && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            API Usage Example
          </Typography>
          <Box sx={{ backgroundColor: 'grey.100', p: 2, borderRadius: 1, fontFamily: 'monospace' }}>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
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
        </Paper>
      )}

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
    </Container>
  );
}

export default MyProfilePage;