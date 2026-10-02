// imports/ui/pages/MyProfilePage.jsx
//
// My Profile — Nocturne redesign (workzone/design_handoff_my_profile).
// Three states: 1e patient/scroll (rails + card stack), 1f clinician+admin/
// grid (Masonry, header row), 1g brand-new user (empty on-ramp card +
// checklist rail). Theme-bound via buildProfileVars(theme) — components below
// this file consume var(--pf-*) only.

import React, { useState, useEffect } from 'react';
import {
  Button,
  Typography,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogActions,
  useTheme,
  useMediaQuery
} from '@mui/material';
import Masonry from '@mui/lab/Masonry';

import { get } from 'lodash';
import moment from 'moment';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import PatientCard from '../../patient/PatientCard.jsx';
import PractitionerSearchDialog from '../../components/PractitionerSearchDialog.jsx';
import { Patients } from '../../lib/schemas/SimpleSchemas/Patients';
import { Practitioners } from '../../lib/schemas/SimpleSchemas/Practitioners';
import { PractitionerRoles } from '../../lib/schemas/SimpleSchemas/PractitionerRoles';
import { OAuthClients } from '../../collections/OAuthClients';

import { notify } from '/imports/lib/notify.js';

import { buildProfileVars, PROFILE_STATIC_CSS } from '../profile/profileVars.js';
import { computeProfileCompletion } from '../profile/completionModel.js';
import { LeftRail, RightRail, ChecklistRail, LayoutToggle, StrengthRing, PROFILE_LAYOUT_KEY } from '../profile/ProfileRails.jsx';
import PhotoUploadDialog from '../profile/PhotoUploadDialog.jsx';
import QrIntakeDialog from '../profile/QrIntakeDialog.jsx';
import EmptyPatientCard from '../profile/EmptyPatientCard.jsx';
import LinkedRecordsCard from '../profile/cards/LinkedRecordsCard.jsx';
import RolesIdentityCard, { userHasClinicianRole } from '../profile/cards/RolesIdentityCard.jsx';
import AccountApiCard from '../profile/cards/AccountApiCard.jsx';
import ApiKeysCard from '../profile/cards/ApiKeysCard.jsx';
import KnownDevicesCard from '../profile/cards/KnownDevicesCard.jsx';
import ConsentCard from '../profile/cards/ConsentCard.jsx';
import CareCircleCard from '../profile/cards/CareCircleCard.jsx';
import GenomicsCard from '../profile/cards/GenomicsCard.jsx';
import MedicalImagingCard from '../profile/cards/MedicalImagingCard.jsx';
import SocialMediaCard from '../profile/cards/SocialMediaCard.jsx';
import EnvironmentalDataCard from '../profile/cards/EnvironmentalDataCard.jsx';
import ScannedDocumentsCard from '../profile/cards/ScannedDocumentsCard.jsx';
import AuthorizedAppsCard from '../profile/cards/AuthorizedAppsCard.jsx';
import TerminologyCard from '../profile/cards/TerminologyCard.jsx';
import { PractitionerProfileCard, ProfessionalLicenseCard, PractitionerRoleCard } from '../profile/cards/PractitionerCards.jsx';
import { AdministrationCard, SessionsCard, DangerArea, DebugTools } from '../profile/cards/AdminAndDangerCards.jsx';
import LinkIcon from '@mui/icons-material/Link';
import DevicesIcon from '@mui/icons-material/Devices';

const log = (Meteor.Logger ? Meteor.Logger.for('MyProfilePage') : console);

function MyProfilePage(props) {
  const { children, staticContext, ...otherProps } = props;

  const [openPractitionerSearch, setOpenPractitionerSearch] = useState(false);
  // Authorized Apps state for ONC g(10) 9.3.01 token revocation
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [authToRevoke, setAuthToRevoke] = useState(null);
  const [revokingAuth, setRevokingAuth] = useState(false);

  const [layout, setLayout] = useState(function() {
    try {
      return window.localStorage.getItem(PROFILE_LAYOUT_KEY) === 'grid' ? 'grid' : 'scroll';
    } catch (err) {
      return 'scroll';
    }
  });
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [printingIdCard, setPrintingIdCard] = useState(false);
  const [linkedMembers, setLinkedMembers] = useState([]);
  const [primaryLinkedId, setPrimaryLinkedId] = useState(null);
  const [devicesList, setDevicesList] = useState([]);
  const [consentsList, setConsentsList] = useState([]);
  const [careTeamsList, setCareTeamsList] = useState([]);
  const [imagingStudiesList, setImagingStudiesList] = useState([]);
  const [socialPostsList, setSocialPostsList] = useState([]);
  const [scannedDocumentsList, setScannedDocumentsList] = useState([]);
  const [molecularSequencesList, setMolecularSequencesList] = useState([]);
  const [apiKeysList, setApiKeysList] = useState([]);

  const navigate = useNavigate();
  const theme = useTheme();
  const narrowLeft = useMediaQuery('(max-width:860px)');

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
      Meteor.subscribe('patients.byId', patientId);
    }
  }, []);

  let currentUser = useTracker(function(){
    const meteorUser = Meteor.user();
    // Update session if needed for other components
    if (meteorUser && (!Session.get('currentUser') || Session.get('currentUser')._id !== meteorUser._id)) {
      Session.set('currentUser', meteorUser);
    }
    return meteorUser;
  }, []);

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
    return sessionToken || storedToken;
  }, []);

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
        log.warn('MyProfilePage - Patient not found for _id or id:', { patientId });
      }
      return patient;
    }
    return null;
  }, [currentUser]);

  // Track selected patient from session
  let selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);

  let selectedPatient = useTracker(function(){
    return Session.get('selectedPatient');
  }, []);

  // Get the practitioner record for the current user
  let currentPractitioner = useTracker(function(){
    const practitionerId = get(currentUser, 'practitionerId');
    if(practitionerId){
      const practitioner = Practitioners.findOne({
        $or: [{ _id: practitionerId }, { id: practitionerId }]
      });
      return practitioner;
    }
    return null;
  }, [currentUser]);

  // Get the practitioner role for the current user
  let currentPractitionerRole = useTracker(function(){
    const practitionerRoleId = get(currentUser, 'practitionerRoleId');
    if(practitionerRoleId){
      return PractitionerRoles.findOne({
        $or: [{ _id: practitionerRoleId }, { id: practitionerRoleId }]
      });
    }
    return null;
  }, [currentUser]);

  // Email configuration (enables the Verify email button)
  const [emailConfigured, setEmailConfigured] = useState(false);
  useEffect(function() {
    Meteor.callAsync('accounts.isEmailConfigured')
      .then(function(result) { setEmailConfigured(Boolean(get(result, 'configured', result))); })
      .catch(function() { setEmailConfigured(false); });
  }, []);

  // Deep-link anchors (e.g. /my-profile#section-devices from the add-a-device
  // confirmation): scroll to the hashed section once the cards have rendered.
  useEffect(function() {
    const hash = window.location.hash;
    if (!hash) { return; }
    const timer = setTimeout(function() {
      const target = document.getElementById(hash.substring(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
    return function cleanup() { clearTimeout(timer); };
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────

  function handleLayoutChange(next) {
    setLayout(next);
    try { window.localStorage.setItem(PROFILE_LAYOUT_KEY, next); } catch (err) { /* private mode */ }
  }

  // Handle practitioner selection from search dialog
  async function handlePractitionerSelect(practitionerId, practitioner) {
    try {
      await Meteor.rpc('users.linkPractitionerId', { practitionerId: practitionerId });
      notify({ title: 'Practitioner record linked successfully!', severity: 'success' });
      setOpenPractitionerSearch(false);
    } catch (error) {
      log.error('Error linking practitioner:', { message: error.message });
      notify({ title: 'Link failed', message: error.message || 'Failed to link practitioner record', severity: 'error' });
    }
  }

  // Debug: Link to CMO for testing
  async function handleLinkToCMO() {
    try {
      const result = await Meteor.rpc('debug.linkCurrentUserToCMO', {});
      notify({ title: result.message, severity: 'success' });
    } catch (error) {
      notify({ title: 'Link failed', message: error.message || 'Failed to link to Chief Medical Officer', severity: 'error' });
    }
  }

  async function handleUnlinkPatient() {
    try {
      // rpc-migration: ddp-straggler
      await Meteor.callAsync('users.clearPatientLink');
      notify({ title: 'Patient record unlinked', message: 'The record itself was not deleted.', severity: 'success' });
    } catch (error) {
      notify({ title: 'Unlink failed', message: error.message || 'Failed to unlink patient record', severity: 'error' });
    }
  }

  async function handleUnlinkPractitioner() {
    try {
      await Meteor.rpc('users.unlinkPractitionerRecords', {});
      notify({ title: 'Practitioner records unlinked successfully!', severity: 'success' });
    } catch (error) {
      notify({ title: 'Unlink failed', message: error.message || 'Failed to unlink practitioner records', severity: 'error' });
    }
  }

  async function handleSavePhoto(photoAttachments) {
    const patientId = get(currentPatient, '_id');
    if (!patientId) { return; }
    await Meteor.rpc('patients.updatePhoto', { patientId: patientId, photo: photoAttachments });
    notify({ title: 'Photo saved', severity: 'success' });
  }

  async function handleDeletePhoto() {
    const patientId = get(currentPatient, '_id');
    if (!patientId) { return; }
    try {
      await Meteor.rpc('patients.updatePhoto', { patientId: patientId, photo: null });
      notify({ title: 'Photo removed', severity: 'success' });
    } catch (error) {
      notify({ title: 'Remove failed', message: error.reason || error.message, severity: 'error' });
    }
  }

  async function handleRegenerateToken() {
    try {
      // rpc-migration: ddp-straggler (Accounts internals, matches its neighbors)
      const newToken = await Meteor.callAsync('users.regenerateApiToken');
      if (newToken) {
        Session.set('accountsAccessToken', newToken);
        notify({ title: 'API token regenerated', message: 'Update any scripts using the old token.', severity: 'success' });
      }
    } catch (error) {
      notify({ title: 'Regenerate failed', message: error.reason || error.message, severity: 'error' });
    }
  }

  async function handleVerifyEmail() {
    try {
      await Meteor.callAsync('accounts.sendVerificationEmail', Meteor.userId());
      notify({ title: 'Verification email sent', message: 'Check your inbox.', severity: 'success' });
    } catch (error) {
      notify({ title: 'Send failed', message: error.reason || error.message, severity: 'error' });
    }
  }

  async function handleExportRecord() {
    const patientId = get(currentUser, 'patientId');
    if (!patientId || !accountsAccessToken) { return; }
    try {
      notify({ title: 'Exporting…', message: 'Assembling your record.', severity: 'info', duration: 3000 });
      const response = await fetch(`/baseR4/Patient/${patientId}/$everything`, {
        headers: { session: accountsAccessToken }
      });
      if (!response.ok) {
        throw new Error(`Export failed (${response.status})`);
      }
      const bundle = await response.json();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `my-record-${moment().format('YYYY-MM-DD')}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      notify({ title: 'Record exported', severity: 'success' });
    } catch (error) {
      notify({ title: 'Export failed', message: error.message, severity: 'error' });
    }
  }

  function handlePrintIdCard() {
    setPrintingIdCard(true);
    window.addEventListener('afterprint', function handleAfter() {
      window.removeEventListener('afterprint', handleAfter);
      setPrintingIdCard(false);
    });
    setTimeout(function() { window.print(); }, 60);
  }

  async function handleDeleteAccount(){
    if(confirm("Are you sure that you want to delete this account?")){
      // rpc-migration: ddp-straggler
      Meteor.call('deleteMyAccount', async function(error, result){
        if(error){
          log.error('deleteMyAccount error', { message: error.message });
          notify({ title: 'Delete failed', message: error.message || 'Failed to delete account', severity: 'error' });
        }
        if(result === "User health data deleted, and account deactivated."){
          // Log out using Meteor's built-in method
          Meteor.logout((err) => {
            if (err) {
              log.error('Logout error:', { message: err.message });
              notify({ title: 'Logout failed', message: 'Failed to logout after account deletion', severity: 'error' });
            } else {
              // Navigate to home page
              navigate('/');
            }
          });

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
      log.warn('handleRevokeAuthorization - No authorization selected');
      return;
    }
    setRevokingAuth(true);
    try {
      await Meteor.rpc('oauth.revokePatientAuthorization', { authorizationId: authToRevoke._id });
      notify({ title: 'Application access revoked successfully', severity: 'success' });
      setRevokeDialogOpen(false);
      setAuthToRevoke(null);
    } catch (error) {
      log.error('handleRevokeAuthorization - Error:', { message: error.message });
      notify({ title: 'Revoke failed', message: error.reason || error.message || 'Failed to revoke access', severity: 'error' });
    } finally {
      setRevokingAuth(false);
    }
  }

  // ── Derived state ──────────────────────────────────────────────────────

  const userPatientId = get(currentUser, 'patientId');
  const userPractitionerId = get(currentUser, 'practitionerId');
  const externalMembers = linkedMembers.filter(function(m) {
    return String(get(m, '_id')) !== String(primaryLinkedId);
  });

  const completion = computeProfileCompletion({
    user: currentUser,
    patient: currentPatient,
    linkedRecords: externalMembers,
    devices: devicesList,
    consents: consentsList
  });

  const isClinicianish = userHasClinicianRole(currentUser);
  const isAdmin = ((get(currentUser, 'roles', []) || []).includes('admin'));
  const isEmptyState = currentUser && !userPatientId && !userPractitionerId;

  const terminologyCount = ['snomed', 'loinc', 'icd10'].reduce(function(sum, key) {
    return sum + (get(currentUser, `profile.terminology.${key}`, []) || []).length;
  }, 0);

  const lastUpdated = get(currentPatient, 'meta.lastUpdated');

  const jumpSections = [
    { id: 'section-patient', label: userPractitionerId && !userPatientId ? 'Practitioner' : 'Patient record', hasData: Boolean(currentPatient || currentPractitioner) },
    { id: 'section-linked', label: 'Linked records', count: externalMembers.length, hasData: externalMembers.length > 0 },
    isClinicianish && { id: 'section-license', label: 'Professional license', hasData: Boolean(get(currentPractitioner, 'qualification.length')) },
    { id: 'section-roles', label: 'Roles & identity', hasData: true },
    { id: 'section-account', label: 'Account & API', hasData: true },
    { id: 'section-api-keys', label: 'API keys', count: apiKeysList.length, hasData: apiKeysList.length > 0 },
    { id: 'section-devices', label: 'Known devices', count: devicesList.length, hasData: devicesList.length > 0 },
    { id: 'section-consent', label: 'Consent', count: consentsList.length, hasData: consentsList.length > 0 },
    { id: 'section-care-circle', label: 'Care circle', count: careTeamsList.length, hasData: careTeamsList.length > 0 },
    { id: 'section-imaging', label: 'Medical imaging', count: imagingStudiesList.length, hasData: imagingStudiesList.length > 0 },
    { id: 'section-social', label: 'Social media', count: socialPostsList.length, hasData: socialPostsList.length > 0 },
    { id: 'section-documents', label: 'Scanned documents', count: scannedDocumentsList.length, hasData: scannedDocumentsList.length > 0 },
    { id: 'section-genomics', label: 'Genomics', count: molecularSequencesList.length, hasData: molecularSequencesList.length > 0 },
    { id: 'section-apps', label: 'Authorized apps', count: patientAuthorizations.length, hasData: patientAuthorizations.length > 0 },
    { id: 'section-terminology', label: 'Terminology', count: terminologyCount, hasData: terminologyCount > 0 },
    { id: 'section-danger', label: 'Danger area', danger: true }
  ].filter(Boolean);

  // ── Card blocks (shared between scroll & grid modes) ───────────────────

  function renderIdentityCard() {
    if (currentPractitioner && !userPatientId) {
      return (
        <PractitionerProfileCard
          practitioner={currentPractitioner}
          practitionerRole={currentPractitionerRole}
          onEdit={function() {
            Session.set('selectedPractitionerId', get(currentPractitioner, 'id'));
            navigate('/practitioners/' + get(currentPractitioner, 'id'));
          }}
          onUnlink={handleUnlinkPractitioner}
          onLinkPatientRecord={function() {
            Session.set('selectedPatientId', '');
            navigate('/patients/new');
          }}
        />
      );
    }
    if (currentPatient) {
      return (
        <PatientCard
          patient={currentPatient}
          layout="profile"
          avatarVariant="badge"
          completionScore={completion.score}
          onEdit={function() { navigate('/patients/' + currentPatient._id); }}
          onUnlink={handleUnlinkPatient}
          onPhotoUpload={function() { setPhotoDialogOpen(true); }}
          onPhotoDelete={handleDeletePhoto}
        />
      );
    }
    if (userPractitionerId && !userPatientId) {
      // Stale practitioner link — practitionerId set but record not found
      return (
        <Box className="pf-card" sx={{ p: '12px 14px 14px' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Practitioner record not found. The linked record (ID: {userPractitionerId}) may have been deleted or the database was refreshed.
          </Alert>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={async () => {
                try {
                  // rpc-migration: ddp-straggler
                  await Meteor.callAsync('users.clearPractitionerLink');
                  notify({ title: 'Practitioner link cleared', message: 'You can now link a new practitioner record.', severity: 'success' });
                } catch (error) {
                  notify({ title: 'Clear failed', message: error.message || 'Failed to clear practitioner link', severity: 'error' });
                }
              }}
              sx={{ fontSize: 12, borderRadius: '8px' }}
            >
              Clear stale link
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => { navigate('/practitioners/new?save=my-profile&cancel=my-profile'); }}
              sx={{ fontSize: 12, borderRadius: '8px', color: 'var(--pf-accent)', borderColor: 'var(--pf-accent)' }}
            >
              Create new practitioner record
            </Button>
          </Box>
        </Box>
      );
    }
    if (userPatientId) {
      // Stale link — patientId set but record not found (alert inside the card frame)
      return (
        <Box className="pf-card" sx={{ p: '12px 14px 14px' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Patient record not found. The linked record (ID: {userPatientId}) may have been deleted or the database was refreshed.
          </Alert>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={async () => {
                try {
                  // rpc-migration: ddp-straggler
                  await Meteor.callAsync('users.clearPatientLink');
                  notify({ title: 'Patient link cleared', message: 'You can now link a new patient record.', severity: 'success' });
                } catch (error) {
                  notify({ title: 'Clear failed', message: error.message || 'Failed to clear patient link', severity: 'error' });
                }
              }}
              sx={{ fontSize: 12, borderRadius: '8px' }}
            >
              Clear stale link
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => { navigate('/patients/new'); }}
              sx={{ fontSize: 12, borderRadius: '8px', color: 'var(--pf-accent)', borderColor: 'var(--pf-accent)' }}
            >
              Create new patient record
            </Button>
          </Box>
        </Box>
      );
    }
    return (
      <EmptyPatientCard
        email={get(currentUser, 'emails[0].address', '')}
        onCreate={function() {
          Session.set('selectedPatientId', '');
          navigate('/patients/new');
        }}
        onFind={function() {
          const patientIdToLink = selectedPatientId || get(selectedPatient, '_id');
          if (patientIdToLink) {
            // rpc-migration: ddp-straggler
            Meteor.callAsync('users.linkPatient', patientIdToLink)
              .then(function() { notify({ title: 'Patient record linked successfully!', severity: 'success' }); })
              .catch(function(error) { notify({ title: 'Link failed', message: error.message, severity: 'error' }); });
          } else {
            navigate('/patients');
          }
        }}
      />
    );
  }

  // Returns a keyed array so scroll mode can stack it and grid mode can hand
  // the same cards to Masonry. Cards that fail their visibility rule are
  // simply absent (render nothing, not an empty card).
  function renderCards() {
    const cards = [];

    cards.push(<Box key="patient" id="section-patient">{renderIdentityCard()}</Box>);

    if (userPatientId) {
      cards.push(
        <Box key="linked" id="section-linked">
          <LinkedRecordsCard onMembersChange={function(members, primaryId) {
            setLinkedMembers(members);
            setPrimaryLinkedId(primaryId);
          }} />
        </Box>
      );
    }

    if (isClinicianish) {
      cards.push(
        <Box key="license" id="section-license">
          <ProfessionalLicenseCard
            practitioner={currentPractitioner}
            onCreatePractitioner={function() {
              Session.set('selectedPractitionerId', '');
              navigate('/practitioners/new?save=my-profile&cancel=my-profile');
            }}
            onLinkLicense={function() { setOpenPractitionerSearch(true); }}
            onAddCredential={function() {
              if (currentPractitioner) {
                navigate('/practitioners/' + get(currentPractitioner, 'id'));
              }
            }}
          />
        </Box>
      );
      if (userPractitionerId || get(currentUser, 'practitionerRoleId')) {
        cards.push(<PractitionerRoleCard key="practitionerRole" user={currentUser} practitionerRole={currentPractitionerRole} />);
      }
    }

    cards.push(
      <Box key="roles" id="section-roles">
        <RolesIdentityCard
          user={currentUser}
          onCreatePractitioner={function() {
            Session.set('selectedPractitionerId', '');
            navigate('/practitioners/new?save=my-profile&cancel=my-profile');
          }}
          onLinkLicense={function() { setOpenPractitionerSearch(true); }}
        />
      </Box>
    );

    cards.push(
      <Box key="account" id="section-account">
        <AccountApiCard
          user={currentUser}
          token={accountsAccessToken}
          patientId={userPatientId}
          onRegenerateToken={handleRegenerateToken}
          onVerifyEmail={handleVerifyEmail}
          emailConfigured={emailConfigured}
        />
      </Box>
    );

    cards.push(
      <Box key="apiKeys" id="section-api-keys">
        <ApiKeysCard onKeysChange={setApiKeysList} />
      </Box>
    );

    if (userPatientId) {
      cards.push(
        <Box key="devices" id="section-devices">
          <KnownDevicesCard patientId={userPatientId} onDevicesChange={setDevicesList} />
        </Box>
      );
      cards.push(
        <Box key="consent" id="section-consent">
          <ConsentCard patientId={userPatientId} onConsentsChange={setConsentsList} />
        </Box>
      );
      cards.push(
        <Box key="careCircle" id="section-care-circle">
          <CareCircleCard patientId={userPatientId} onCareTeamsChange={setCareTeamsList} />
        </Box>
      );
      cards.push(
        <Box key="imaging" id="section-imaging">
          <MedicalImagingCard patientId={userPatientId} onImagingChange={setImagingStudiesList} />
        </Box>
      );
      cards.push(
        <Box key="social" id="section-social">
          <SocialMediaCard patientId={userPatientId} onSocialChange={setSocialPostsList} />
        </Box>
      );
      cards.push(
        <Box key="documents" id="section-documents">
          <ScannedDocumentsCard patientId={userPatientId} onDocumentsChange={setScannedDocumentsList} />
        </Box>
      );
      // Environmental data rides the @orbital/greenhouses extension — absent
      // entirely (not an empty masonry slot) when it isn't installed.
      if (globalThis.Package && globalThis.Package['@orbital/greenhouses']) {
        cards.push(
          <Box key="environmental" id="section-environmental">
            <EnvironmentalDataCard patientId={userPatientId} />
          </Box>
        );
      }
      cards.push(
        <Box key="genomics" id="section-genomics">
          <GenomicsCard patientId={userPatientId} onSequencesChange={setMolecularSequencesList} />
        </Box>
      );
    }

    cards.push(
      <Box key="apps" id="section-apps">
        <AuthorizedAppsCard
          authorizations={patientAuthorizations}
          onRevoke={function(auth) {
            setAuthToRevoke(auth);
            setRevokeDialogOpen(true);
          }}
        />
      </Box>
    );

    cards.push(
      <Box key="terminology" id="section-terminology">
        <TerminologyCard user={currentUser} patientId={userPatientId} />
      </Box>
    );

    if (isAdmin) {
      cards.push(<AdministrationCard key="admin" />);
    }
    if (layout === 'grid') {
      cards.push(<SessionsCard key="sessions" user={currentUser} />);
    }

    cards.push(
      <Box key="danger" id="section-danger">
        <DangerArea onDelete={handleDeleteAccount} compact={layout === 'grid'} />
      </Box>
    );

    if (Meteor.isDevelopment) {
      cards.push(<DebugTools key="debug" onLinkToCMO={handleLinkToCMO} />);
    }

    return cards;
  }

  // ── Page header ────────────────────────────────────────────────────────

  function renderPageHeader() {
    const stepsLeft = completion.steps.filter(function(s) { return !s.done; }).length;

    // In scroll (and 1g) mode the header content aligns with the centered
    // card container; in grid mode it spans the full width.
    const railsAligned = layout !== 'grid';

    return (
      <Box
        className={`pf-page-header${railsAligned ? ' pf-page-header--rails' : ''}`}
        sx={{ p: '22px 28px 0' }}
      >
        <Box className="pf-page-header-inner" sx={{ gap: 1.75 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h2" sx={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.015em', color: 'var(--pf-ink)' }}>
              My Profile
            </Typography>
            {lastUpdated && (
              <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-dim)' }}>
                Last updated {moment(lastUpdated).fromNow()}
              </Typography>
            )}
          </Box>
          <Box sx={{ flex: 1 }} />
          {(layout === 'grid' || narrowLeft) && !isEmptyState && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StrengthRing score={completion.score} size={40} fontSize={10} />
              <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-mid)' }}>
                {stepsLeft === 0 ? 'complete' : `${stepsLeft} step${stepsLeft === 1 ? '' : 's'} left`}
              </Typography>
            </Box>
          )}
          {!isEmptyState && (
            <LayoutToggle value={layout} onChange={handleLayoutChange} />
          )}
        </Box>
      </Box>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  const profileVars = buildProfileVars(theme);

  let body;
  if (isEmptyState) {
    // 1g — brand-new user
    body = (
      <Box className="profile-page-grid profile-page-grid--empty pf-layout-fade">
        <Box className="pf-main" sx={{ gap: '12px' }}>
          {renderIdentityCard()}
          <AccountApiCard
            user={currentUser}
            token={accountsAccessToken}
            collapsed
            onVerifyEmail={handleVerifyEmail}
            emailConfigured={emailConfigured}
          />
          <Box className="pf-add-row pf-add-row--disabled" sx={{ p: '10px 14px', display: 'flex', alignItems: 'center', gap: 1, fontSize: 13 }}>
            <LinkIcon sx={{ fontSize: 16, color: 'var(--pf-ink-faint)' }} />
            <Box sx={{ flex: 1 }}>Link records from other hospitals</Box>
            <Box sx={{ fontSize: 12, color: 'var(--pf-ink-faint)' }}>after your record exists</Box>
          </Box>
          <Box
            className="pf-add-row"
            onClick={function() { navigate('/devices/new'); }}
            sx={{ p: '10px 14px', display: 'flex', alignItems: 'center', gap: 1, fontSize: 13, cursor: 'pointer' }}
          >
            <DevicesIcon sx={{ fontSize: 16, color: 'var(--pf-ink-dim)' }} />
            <Box sx={{ flex: 1 }}>Add a wearable or prescribed device →</Box>
          </Box>
          <RolesIdentityCard
            user={currentUser}
            onCreatePractitioner={function() {
              navigate('/practitioners/new?save=my-profile&cancel=my-profile');
            }}
            onLinkLicense={function() { setOpenPractitionerSearch(true); }}
          />
          <Box sx={{ mt: 1 }}>
            <DangerArea onDelete={handleDeleteAccount} compact />
          </Box>
          <DebugTools onLinkToCMO={handleLinkToCMO} />
        </Box>
        <ChecklistRail completion={completion} />
      </Box>
    );
  } else if (layout === 'grid') {
    // 1f — grid mode (Masonry, no rails)
    body = (
      <Box className="profile-page-grid--grid-mode pf-layout-fade" key="grid">
        <Masonry columns={{ xs: 1, sm: 2, lg: 3 }} spacing={1.75} sx={{ m: 0 }}>
          {renderCards()}
        </Masonry>
      </Box>
    );
  } else {
    // 1e — scroll mode with rails
    body = (
      <Box className="profile-page-grid pf-layout-fade" key="scroll">
        <LeftRail completion={completion} sections={jumpSections} />
        <Box className="pf-main">
          {renderCards()}
        </Box>
        <RightRail
          patientId={userPatientId}
          token={accountsAccessToken}
          onPrintIdCard={handlePrintIdCard}
          onShowQr={function() { setQrDialogOpen(true); }}
          onExport={handleExportRecord}
        />
      </Box>
    );
  }

  return (
    <Box className={`profile-page${printingIdCard ? ' pf-printing-idcard' : ''}`} sx={{ bgcolor: 'var(--pf-canvas)' }}>
      <style>{PROFILE_STATIC_CSS}</style>
      <style>{profileVars}</style>

      {renderPageHeader()}
      {body}

      {/* Print-only ID card (stamp variant) */}
      {currentPatient && (
        <Box className="pf-print-idcard" sx={{ p: 2 }}>
          <PatientCard
            patient={currentPatient}
            layout="profile"
            avatarVariant="stamp"
          />
        </Box>
      )}

      {/* Revoke Confirmation Dialog — ONC g(10) 9.3.01 */}
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

      <PhotoUploadDialog
        open={photoDialogOpen}
        onClose={function() { setPhotoDialogOpen(false); }}
        onSave={handleSavePhoto}
      />

      <QrIntakeDialog
        open={qrDialogOpen}
        onClose={function() { setQrDialogOpen(false); }}
        patientId={userPatientId}
      />
    </Box>
  );
}

export default MyProfilePage;
