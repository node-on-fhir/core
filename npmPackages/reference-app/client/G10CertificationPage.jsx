// packages/reference-app/client/G10CertificationPage.jsx

// React and UI components imports
import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Tab,
  Tabs,
  Typography,
  Alert,
  Snackbar,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Grid,
  Chip,
  Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// =============================================================================
// CONSTANTS
// =============================================================================

// FHIR Resources required for (g)(10) certification
const G10_REQUIRED_RESOURCES = [
  'Patient', 'AllergyIntolerance', 'CarePlan', 'CareTeam', 'Condition',
  'Coverage', 'Device', 'DiagnosticReport', 'DocumentReference', 'Encounter',
  'Goal', 'Immunization', 'Location', 'Medication', 'MedicationDispense',
  'MedicationRequest', 'Observation', 'Organization', 'Practitioner',
  'PractitionerRole', 'Procedure', 'Provenance', 'ServiceRequest', 'Specimen'
];

// SMART capabilities/scopes
const SMART_CAPABILITIES = [
  { value: 'launch/patient', label: 'Launch (Patient Context)' },
  { value: 'launch', label: 'Launch (EHR)' },
  { value: 'openid', label: 'OpenID Connect' },
  { value: 'fhirUser', label: 'FHIR User' },
  { value: 'offline_access', label: 'Offline Access (Refresh Tokens)' }
];

// =============================================================================
// SCOPE SELECTOR COMPONENT
// =============================================================================

function ScopeSelector({ value, onChange, scopeType = 'patient', resources = G10_REQUIRED_RESOURCES }) {
  // Parse current scope string to get selected resources and capabilities
  const parseScopes = (scopeString) => {
    const scopes = scopeString.split(' ').filter(s => s.trim());
    const selectedResources = [];
    const selectedCapabilities = [];

    scopes.forEach(scope => {
      if (scope.startsWith('patient/') || scope.startsWith('user/') || scope.startsWith('system/')) {
        const resource = scope.split('/')[1].split('.')[0];
        if (resource !== '*' && !selectedResources.includes(resource)) {
          selectedResources.push(resource);
        }
      } else {
        selectedCapabilities.push(scope);
      }
    });

    return { selectedResources, selectedCapabilities };
  };

  const { selectedResources, selectedCapabilities } = parseScopes(value);
  const [useWildcard, setUseWildcard] = useState(value.includes(`${scopeType}/*.`));

  const buildScopeString = (resources, capabilities, wildcard, type) => {
    const resourceScopes = wildcard
      ? [`${type}/*.rs`]
      : resources.map(r => `${type}/${r}.rs`);

    return [...capabilities, ...resourceScopes].join(' ');
  };

  const handleResourceToggle = (resource) => {
    const newResources = selectedResources.includes(resource)
      ? selectedResources.filter(r => r !== resource)
      : [...selectedResources, resource];

    onChange(buildScopeString(newResources, selectedCapabilities, useWildcard, scopeType));
  };

  const handleCapabilityToggle = (capability) => {
    const newCapabilities = selectedCapabilities.includes(capability)
      ? selectedCapabilities.filter(c => c !== capability)
      : [...selectedCapabilities, capability];

    onChange(buildScopeString(selectedResources, newCapabilities, useWildcard, scopeType));
  };

  const handleWildcardChange = (event) => {
    const wildcard = event.target.value === 'wildcard';
    setUseWildcard(wildcard);
    onChange(buildScopeString(selectedResources, selectedCapabilities, wildcard, scopeType));
  };

  return (
    <Box>
      {/* SMART Capabilities */}
      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <FormLabel component="legend">SMART Capabilities</FormLabel>
        <FormGroup row>
          {SMART_CAPABILITIES.map(cap => (
            <FormControlLabel
              key={cap.value}
              control={
                <Checkbox
                  checked={selectedCapabilities.includes(cap.value)}
                  onChange={() => handleCapabilityToggle(cap.value)}
                />
              }
              label={cap.label}
            />
          ))}
        </FormGroup>
      </FormControl>

      {/* Resource Selection Mode */}
      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <FormLabel component="legend">Resource Access</FormLabel>
        <RadioGroup row value={useWildcard ? 'wildcard' : 'specific'} onChange={handleWildcardChange}>
          <FormControlLabel value="specific" control={<Radio />} label="Select specific resources" />
          <FormControlLabel value="wildcard" control={<Radio />} label={`All resources (${scopeType}/*.rs)`} />
        </RadioGroup>
      </FormControl>

      {/* Resource Checkboxes */}
      {!useWildcard && (
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">Select Resources</FormLabel>
          <Grid container spacing={1} sx={{ mt: 1 }}>
            {resources.map(resource => (
              <Grid item xs={6} sm={4} md={3} key={resource}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedResources.includes(resource)}
                      onChange={() => handleResourceToggle(resource)}
                      size="small"
                    />
                  }
                  label={resource}
                />
              </Grid>
            ))}
          </Grid>
        </FormControl>
      )}

      {/* Preview */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Generated Scopes:</strong><br/>
          <code style={{ fontSize: '0.85em', wordBreak: 'break-all' }}>{value || '(none selected)'}</code>
        </Typography>
      </Alert>
    </Box>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function G10CertificationPage(props) {
  console.log('G10CertificationPage.render()', props);

  // State management
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  // Missing references seeding state
  const [missingReferencesUrls, setMissingReferencesUrls] = useState('');

  // Inferno OAuth client state
  const [infernoClient, setInfernoClient] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    client_name: 'Inferno G10 Certification Suite',
    redirect_uris: 'https://inferno.healthit.gov/suites/custom/smart/redirect',
    launch_uri: 'https://inferno.healthit.gov/suites/custom/smart/launch',
    jwks_uri: 'https://inferno.healthit.gov/suites/custom/g10_certification/.well-known/jwks.json',
    scope: 'launch/patient launch openid fhirUser offline_access patient/Medication.rs patient/AllergyIntolerance.rs patient/CarePlan.rs patient/CareTeam.rs patient/Condition.rs patient/Coverage.rs patient/Device.rs patient/DiagnosticReport.rs patient/DocumentReference.rs patient/Encounter.rs patient/Goal.rs patient/Immunization.rs patient/Location.rs patient/MedicationDispense.rs patient/MedicationRequest.rs patient/Observation.rs patient/Organization.rs patient/Patient.rs patient/Practitioner.rs patient/Procedure.rs patient/Provenance.rs patient/PractitionerRole.rs patient/RelatedPerson.rs patient/ServiceRequest.rs patient/Specimen.rs user/Medication.rs user/AllergyIntolerance.rs user/CarePlan.rs user/CareTeam.rs user/Condition.rs user/Coverage.rs user/Device.rs user/DiagnosticReport.rs user/DocumentReference.rs user/Encounter.rs user/Goal.rs user/Immunization.rs user/Location.rs user/MedicationDispense.rs user/MedicationRequest.rs user/Observation.rs user/Organization.rs user/Patient.rs user/Practitioner.rs user/Procedure.rs user/Provenance.rs user/PractitionerRole.rs user/RelatedPerson.rs user/ServiceRequest.rs user/Specimen.rs system/*.*'
  });

  // Inferno configuration JSON state
  const [configJson, setConfigJson] = useState({});

  // Server metadata endpoints (auto-populated from /metadata)
  const [serverConfig, setServerConfig] = useState({
    url: '',
    authorization_endpoint: '',
    token_endpoint: '',
    registration_endpoint: '',
    introspection_endpoint: '',
    revocation_endpoint: '',
    management_endpoint: '',
    jwks_uri: ''
  });

  // Test configuration form state for all tabs
  const [testConfig, setTestConfig] = useState({
    // Tab 1: PHR Full-Access App
    phr_full_access: {
      patient_id: '',
      received_scopes: 'openid fhirUser offline_access launch/patient patient/Medication.rs patient/AllergyIntolerance.rs patient/CarePlan.rs patient/CareTeam.rs patient/Condition.rs patient/Coverage.rs patient/Device.rs patient/DiagnosticReport.rs patient/DocumentReference.rs patient/Encounter.rs patient/Goal.rs patient/Immunization.rs patient/Location.rs patient/MedicationDispense.rs patient/MedicationRequest.rs patient/Observation.rs patient/Organization.rs patient/Patient.rs patient/Practitioner.rs patient/Procedure.rs patient/Provenance.rs patient/PractitionerRole.rs patient/RelatedPerson.rs patient/ServiceRequest.rs patient/Specimen.rs'
    },
    // Tab 2: PHR Limited Access App
    phr_limited_access: {
      patient_id: '',
      received_scopes: 'launch/patient patient/Observation.rs'
    },
    // Tab 3: EHR Practitioner Access App
    ehr_practitioner: {
      patient_id: '',
      received_scopes: 'launch openid fhirUser offline_access user/Medication.rs user/AllergyIntolerance.rs user/CarePlan.rs user/CareTeam.rs user/Condition.rs user/Coverage.rs user/Device.rs user/DiagnosticReport.rs user/DocumentReference.rs user/Encounter.rs user/Goal.rs user/Immunization.rs user/Location.rs user/MedicationDispense.rs user/MedicationRequest.rs user/Observation.rs user/Organization.rs user/Patient.rs user/Practitioner.rs user/Procedure.rs user/Provenance.rs user/PractitionerRole.rs user/RelatedPerson.rs user/ServiceRequest.rs user/Specimen.rs'
    },
    // Tab 4: Patient Chart (Standalone)
    patient_chart: {
      patient_id: '',
      received_scopes: 'launch/patient patient/*.rs'
    },
    // Tab 8: Bulk Data - System Access
    bulk_data: {
      bulk_server_url: '',
      backend_services_token_endpoint: '',
      bulk_timeout: '600',
      group_id: 'inferno-test-group',
      bulk_patient_ids_in_group: ''
    },
    // Tab 9: Additional Authorization
    additional_auth: {
      patient_id: '',
      received_scopes: 'launch/patient patient/Observation.rs?category=http://terminology.hl7.org/CodeSystem/observation-category|laboratory'
    },
    // Tab 11: Visual Inspection
    visual_inspection: {
      single_patient_registration: null,
      multiple_patient_registration: null,
      graphical_authorization_ui: null,
      offline_access_notification: null,
      refresh_token_duration: null,
      accurate_information: null,
      scoped_information: null,
      public_documentation_url: '',
      jwk_cache_control: null,
      native_app_refresh_tokens: null,
      service_base_urls_public: null,
      tls_enforcement_documented: null,
      refresh_token_renewal: null,
      since_parameter_support: null,
      sub_resource_scope_support: null,
      notes: ''
    }
  });

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Attestation state for Visual Inspection tab (exported to Inferno)
  const [attestations, setAttestations] = useState({
    token_revocation_attestation: 'false',
    token_revocation_notes: '',
    single_patient_registration_supported: 'false',
    single_patient_registration_notes: '',
    multiple_patient_registration_supported: 'false',
    multiple_patient_registration_notes: '',
    resource_authorization_gui_supported: 'false',
    resource_authorization_gui_notes: '',
    offline_access_notification_supported: 'false',
    offline_access_notification_notes: '',
    refresh_token_period_attestation: 'false',
    refresh_token_period_notes: '',
    information_accuracy_attestation: 'false',
    information_accuracy_notes: '',
    multi_patient_scopes_attestation: 'false',
    multi_patient_scopes_notes: '',
    developer_documentation_attestation: 'false',
    developer_documentation_notes: '',
    jwks_cache_attestation: 'false',
    jwks_cache_notes: '',
    native_refresh_attestation: 'false',
    native_refresh_notes: '',
    public_url_attestation: 'false',
    public_url_attestation_notes: '',
    tls_version_attestation_notes: '',
    refresh_token_refresh_attestation: 'false',
    refresh_token_refresh_notes: '',
    bulk_v2_since_attestation: 'false',
    bulk_v2_since_attestation_notes: '',
    clinical_test_scope_attestation: 'false',
    clinical_test_scope_attestation_notes: ''
  });

  // Track reactive data from collections
  const {
    currentUser,
    isAuthenticated,
    selectedPatientId,
    selectedPatient
  } = useTracker(() => {
    const patientId = Session.get('selectedPatientId');
    const patient = Session.get('selectedPatient');
    console.log('G10CertificationPage.useTracker - selectedPatientId:', patientId);
    console.log('G10CertificationPage.useTracker - selectedPatient:', patient);
    return {
      currentUser: Meteor.user(),
      isAuthenticated: Meteor.userId() !== null,
      selectedPatientId: patientId,
      selectedPatient: patient
    };
  });

  // Component lifecycle
  useEffect(() => {
    console.log('G10CertificationPage.mounted');

    // Load saved configuration from localStorage on mount
    try {
      const savedConfig = localStorage.getItem('infernoG10Config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setTestConfig(parsed.testConfig || testConfig);
        setConfigJson(parsed.configJson || {});

        // Restore client info if available
        if (parsed.infernoClient) {
          setInfernoClient(parsed.infernoClient);
        }

        // Restore server config if available
        if (parsed.serverConfig) {
          setServerConfig(parsed.serverConfig);
        }

        // Restore attestations if available
        if (parsed.attestations) {
          setAttestations(prev => ({ ...prev, ...parsed.attestations }));
        }

        console.log('Loaded saved configuration from localStorage');
      }
    } catch (error) {
      console.error('Error loading saved configuration:', error);
    }

    return () => {
      console.log('G10CertificationPage.unmounted');
    };
  }, []);

  // Auto-fill patient ID from selected patient (from Patient Directory workflow)
  useEffect(() => {
    // Use FHIR id from selectedPatient, not MongoDB _id from selectedPatientId
    const fhirPatientId = get(selectedPatient, 'id');

    if (fhirPatientId) {
      console.log('G10CertificationPage: Auto-filling patient ID from selectedPatient.id:', fhirPatientId);

      // Only auto-fill empty fields - allows user override
      setTestConfig(prev => {
        const updates = {};

        // Tab 1: PHR Full-Access App
        if (!prev.phr_full_access.patient_id) {
          updates.phr_full_access = { ...prev.phr_full_access, patient_id: fhirPatientId };
        }

        // Tab 2: PHR Limited Access App
        if (!prev.phr_limited_access.patient_id) {
          updates.phr_limited_access = { ...prev.phr_limited_access, patient_id: fhirPatientId };
        }

        // Tab 3: EHR Practitioner Access App
        if (!prev.ehr_practitioner.patient_id) {
          updates.ehr_practitioner = { ...prev.ehr_practitioner, patient_id: fhirPatientId };
        }

        // Tab 4: Patient Chart (Standalone)
        if (!prev.patient_chart.patient_id) {
          updates.patient_chart = { ...prev.patient_chart, patient_id: fhirPatientId };
        }

        // Tab 9: Additional Authorization
        if (!prev.additional_auth.patient_id) {
          updates.additional_auth = { ...prev.additional_auth, patient_id: fhirPatientId };
        }

        // Only update if there are changes
        if (Object.keys(updates).length > 0) {
          console.log('G10CertificationPage: Updating patient IDs for tabs:', Object.keys(updates));
          return { ...prev, ...updates };
        } else {
          console.log('G10CertificationPage: Patient ID fields already have values, not overwriting');
          return prev;
        }
      });
    } else {
      console.log('G10CertificationPage: No selectedPatient.id available. selectedPatient:', selectedPatient);
    }
  }, [selectedPatient]);

  // Auto-save configuration to localStorage whenever testConfig or attestations change
  useEffect(() => {
    try {
      const toSave = {
        testConfig,
        configJson,
        infernoClient,
        serverConfig,
        attestations,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('infernoG10Config', JSON.stringify(toSave));
      console.log('Auto-saved configuration to localStorage');
    } catch (error) {
      console.error('Error auto-saving configuration:', error);
    }
  }, [testConfig, configJson, serverConfig, attestations]);

  // =============================================================================
  // HANDLER FUNCTIONS
  // =============================================================================

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleRegistrationFormChange = (field, value) => {
    setRegistrationForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTestConfigChange = (tab, field, value) => {
    setTestConfig(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [field]: value
      }
    }));
  };

  async function handleFetchServerConfig() {
    try {
      setLoading(true);

      // Get FHIR base URL from settings or current origin
      const fhirBaseUrl = get(Meteor, 'settings.public.smartOnFhir.fhirServiceUrl', window.location.origin + '/baseR4');

      // Fetch CapabilityStatement from /metadata
      const metadataResponse = await fetch(`${fhirBaseUrl}/metadata`);
      const capabilityStatement = await metadataResponse.json();

      console.log('CapabilityStatement:', capabilityStatement);

      // Extract OAuth endpoints from CapabilityStatement
      const securityExtension = get(capabilityStatement, 'rest[0].security.extension', []).find(
        ext => ext.url === 'http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris'
      );

      const endpoints = {};
      if (securityExtension && securityExtension.extension) {
        securityExtension.extension.forEach(ext => {
          if (ext.url && ext.valueUri) {
            endpoints[ext.url] = ext.valueUri;
          }
        });
      }

      // Fetch JWKS for bulk data
      let jwksData = '';
      try {
        const jwksResponse = await fetch(`${window.location.origin}/.well-known/jwks.json`);
        const jwks = await jwksResponse.json();
        jwksData = JSON.stringify(jwks);
      } catch (error) {
        console.warn('Could not fetch JWKS:', error);
      }

      // Update server config state
      setServerConfig({
        url: fhirBaseUrl,
        authorization_endpoint: endpoints.authorize || '',
        token_endpoint: endpoints.token || '',
        registration_endpoint: endpoints.register || '',
        introspection_endpoint: endpoints.introspect || '',
        revocation_endpoint: endpoints.revoke || '',
        management_endpoint: endpoints.manage || '',
        jwks_uri: `${window.location.origin}/.well-known/jwks.json`
      });

      // Update bulk data config with JWKS and endpoints
      setTestConfig(prev => ({
        ...prev,
        bulk_data: {
          ...prev.bulk_data,
          bulk_server_url: fhirBaseUrl,
          backend_services_token_endpoint: endpoints.token || ''
        }
      }));

      // Store JWKS in configJson for export
      setConfigJson(prev => ({
        ...prev,
        bulk_data_jwks: jwksData
      }));

      setSnackbarMessage('Server configuration fetched successfully from /metadata endpoint!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error fetching server config:', error);
      setSnackbarMessage('Error fetching server configuration: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleSeedMustSupportReferences() {
    try {
      setLoading(true);
      console.log('Seeding MustSupport references...');

      // Pass selected patient ID if available, otherwise method will use first patient
      const patientId = get(selectedPatient, 'id') || get(selectedPatient, '_id');
      const result = await Meteor.callAsync('referenceApp.seedMustSupportReferences', patientId);
      console.log('MustSupport references result:', result);

      let message = `MustSupport references seeded for ${result.patientName}:\n`;
      message += `• RelatedPerson created: ${result.relatedPersonId}\n`;
      message += result.careTeamCreated
        ? `• CareTeam created: ${result.careTeamId}\n`
        : `• CareTeam updated: ${result.careTeamId}\n`;

      // Show Organization and Coverage updates
      if (result.organizationsCreated && result.organizationsCreated.length > 0) {
        message += `• Organizations created: ${result.organizationsCreated.length}\n`;
      }
      if (result.coveragesUpdated && result.coveragesUpdated.length > 0) {
        message += `• Coverages updated: ${result.coveragesUpdated.length} (payor refs + identifier:memberid)`;
      } else {
        message += `• Coverages: No updates needed or no coverages found`;
      }

      setSnackbarMessage(message);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error seeding MustSupport references:', error);
      setSnackbarMessage('Error: ' + (error.reason || error.message));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }

  async function handlePatchPatientMustSupport() {
    if (!selectedPatient) {
      setSnackbarMessage('No patient selected. Please select a patient from the Patient Directory first.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    const patientId = get(selectedPatient, 'id') || get(selectedPatient, '_id');
    const patientName = `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', 'Unknown')}`.trim();

    try {
      setLoading(true);
      console.log('Patching patient with MustSupport elements:', patientId, patientName);

      const result = await Meteor.callAsync('referenceApp.patchPatientMustSupport', patientId);
      console.log('Patch MustSupport result:', result);

      if (result.updated) {
        setSnackbarMessage(`Patient "${patientName}" patched with MustSupport elements: ${result.fieldsAdded.join(', ')}`);
        setSnackbarSeverity('success');
      } else {
        setSnackbarMessage(`Patient "${patientName}" already has all MustSupport elements.`);
        setSnackbarSeverity('info');
      }
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error patching patient MustSupport:', error);
      setSnackbarMessage('Error: ' + (error.reason || error.message));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadDaiseyPatient() {
    try {
      setLoading(true);
      console.log('Loading Daisey test patient...');

      const result = await Meteor.callAsync('referenceApp.loadDaiseyPatient');
      console.log('Load Daisey result:', result);

      let message = `Daisey test patient loaded!\n`;
      message += `• Patient ID: ${result.patientId}\n`;
      message += `• Total resources: ${result.total}\n`;
      message += `• Inserted: ${result.inserted}, Updated: ${result.updated}`;
      if (result.errors > 0) {
        message += `\n• Errors: ${result.errors}`;
      }

      setSnackbarMessage(message);
      setSnackbarSeverity(result.errors > 0 ? 'warning' : 'success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error loading Daisey patient:', error);
      setSnackbarMessage('Error: ' + (error.reason || error.message));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveDaiseyPatient() {
    try {
      setLoading(true);
      console.log('Removing Daisey test patient data...');

      const result = await Meteor.callAsync('referenceApp.removeDaiseyPatient');
      console.log('Remove Daisey result:', result);

      let message = `Daisey test patient data removed!\n`;
      message += `• Total in bundle: ${result.total}\n`;
      message += `• Removed: ${result.removed}, Not found: ${result.notFound}`;
      if (result.errors > 0) {
        message += `\n• Errors: ${result.errors}`;
      }

      setSnackbarMessage(message);
      setSnackbarSeverity(result.errors > 0 ? 'warning' : 'success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error removing Daisey patient:', error);
      setSnackbarMessage('Error: ' + (error.reason || error.message));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadDaiseyData() {
    try {
      setLoading(true);
      console.log('Downloading Daisey test patient data...');

      const bundleJson = await Meteor.callAsync('referenceApp.getDaiseyBundleJson');

      // Create blob and trigger download
      const blob = new Blob([bundleJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'daisey-test-patient.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSnackbarMessage('Daisey test patient bundle downloaded!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error downloading Daisey data:', error);
      setSnackbarMessage('Error: ' + (error.reason || error.message));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBulkExportGroup() {
    try {
      setLoading(true);
      const groupId = testConfig.bulk_data.group_id || 'inferno-test-group';
      console.log('Creating bulk export group:', groupId);

      const result = await Meteor.callAsync('referenceApp.createBulkExportGroup', groupId);
      console.log('Create bulk export group result:', result);

      // Auto-populate bulk_patient_ids_in_group field for Inferno config
      if (result.patientIds && result.patientIds.length > 0) {
        const patientIdsCsv = result.patientIds.join(',');
        setTestConfig(function(prev) {
          return {
            ...prev,
            bulk_data: {
              ...prev.bulk_data,
              bulk_patient_ids_in_group: patientIdsCsv
            }
          };
        });
        console.log(`[handleCreateBulkExportGroup] Set bulk_patient_ids_in_group with ${result.patientIds.length} patient IDs`);
      }

      const message = `${result.action === 'created' ? 'Created' : 'Updated'} Group "${groupId}" with ${result.patientCount} patients`;
      setSnackbarMessage(message);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error creating bulk export group:', error);
      setSnackbarMessage('Error: ' + (error.reason || error.message));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Parses FHIR URLs to extract ResourceType and ID
   * Example: https://www.care-commons.app/baseR4/RelatedPerson/n7h275DFkFKD4kPrn
   * Returns: { resourceType: 'RelatedPerson', id: 'n7h275DFkFKD4kPrn' }
   */
  function parseReferenceUrl(url) {
    try {
      // Remove query params and trailing slashes
      const cleanUrl = url.split('?')[0].replace(/\/+$/, '');

      // Split by / and get last two segments (ResourceType/id)
      const segments = cleanUrl.split('/').filter(s => s.trim());
      if (segments.length < 2) {
        console.warn('parseReferenceUrl: Not enough segments in URL:', url);
        return null;
      }

      const id = segments[segments.length - 1];
      const resourceType = segments[segments.length - 2];

      // Validate resourceType looks like a FHIR resource (PascalCase)
      if (!/^[A-Z][a-zA-Z]+$/.test(resourceType)) {
        console.warn('parseReferenceUrl: Invalid resourceType:', resourceType, 'from URL:', url);
        return null;
      }

      return { resourceType, id };
    } catch (error) {
      console.error('parseReferenceUrl: Error parsing URL:', url, error);
      return null;
    }
  }

  async function handleSeedMissingReferences() {
    if (!missingReferencesUrls.trim()) {
      setSnackbarMessage('Please enter one or more URLs to seed.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    try {
      setLoading(true);
      console.log('Seeding missing references from URLs...');

      // Parse URLs (one per line)
      const lines = missingReferencesUrls.split('\n').filter(line => line.trim());
      const references = [];
      const parseErrors = [];

      for (const line of lines) {
        const parsed = parseReferenceUrl(line.trim());
        if (parsed) {
          references.push(parsed);
        } else {
          parseErrors.push(line.trim());
        }
      }

      if (references.length === 0) {
        setSnackbarMessage('Could not parse any valid FHIR URLs. Expected format: .../ResourceType/id');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setLoading(false);
        return;
      }

      console.log('Parsed references:', references);
      if (parseErrors.length > 0) {
        console.warn('Failed to parse URLs:', parseErrors);
      }

      // Get selected patient ID for resources that need patient references
      const patientId = get(selectedPatient, 'id') || get(selectedPatient, '_id');

      // Call server method to create stub resources
      const result = await Meteor.callAsync('referenceApp.seedMissingReferences', {
        references,
        patientId
      });

      console.log('Seed missing references result:', result);

      let message = `Created ${result.created} stub resources`;
      if (result.skipped > 0) {
        message += `, skipped ${result.skipped} (already exist)`;
      }
      if (result.errors > 0) {
        message += `, ${result.errors} errors`;
      }
      if (parseErrors.length > 0) {
        message += `\n${parseErrors.length} URLs could not be parsed`;
      }

      // Clear the input on success
      if (result.created > 0) {
        setMissingReferencesUrls('');
      }

      setSnackbarMessage(message);
      setSnackbarSeverity(result.errors > 0 ? 'warning' : 'success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error seeding missing references:', error);
      setSnackbarMessage('Error: ' + (error.reason || error.message));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }

  function handleClearAllData() {
    if (confirm('Are you sure you want to clear all configuration data? This cannot be undone.')) {
      // Clear state
      setInfernoClient(null);
      setTestConfig({
        phr_full_access: {
          patient_id: '',
          received_scopes: 'openid fhirUser offline_access launch/patient patient/Medication.rs patient/AllergyIntolerance.rs patient/CarePlan.rs patient/CareTeam.rs patient/Condition.rs patient/Coverage.rs patient/Device.rs patient/DiagnosticReport.rs patient/DocumentReference.rs patient/Encounter.rs patient/Goal.rs patient/Immunization.rs patient/Location.rs patient/MedicationDispense.rs patient/MedicationRequest.rs patient/Observation.rs patient/Organization.rs patient/Patient.rs patient/Practitioner.rs patient/Procedure.rs patient/Provenance.rs patient/PractitionerRole.rs patient/ServiceRequest.rs patient/Specimen.rs'
        },
        phr_limited_access: {
          patient_id: '',
          received_scopes: 'launch/patient patient/Observation.rs'
        },
        ehr_practitioner: {
          patient_id: '',
          received_scopes: 'launch openid fhirUser offline_access user/Medication.rs user/AllergyIntolerance.rs user/CarePlan.rs user/CareTeam.rs user/Condition.rs user/Coverage.rs user/Device.rs user/DiagnosticReport.rs user/DocumentReference.rs user/Encounter.rs user/Goal.rs user/Immunization.rs user/Location.rs user/MedicationDispense.rs user/MedicationRequest.rs user/Observation.rs user/Organization.rs user/Patient.rs user/Practitioner.rs user/Procedure.rs user/Provenance.rs user/PractitionerRole.rs user/ServiceRequest.rs user/Specimen.rs'
        },
        patient_chart: {
          patient_id: '',
          received_scopes: 'launch/patient patient/*.rs'
        },
        bulk_data: {
          bulk_server_url: '',
          backend_services_token_endpoint: '',
          bulk_timeout: '600',
          group_id: 'inferno-test-group'
        },
        additional_auth: {
          patient_id: '',
          received_scopes: 'launch/patient patient/Observation.rs?category=http://terminology.hl7.org/CodeSystem/observation-category|laboratory'
        },
        visual_inspection: {
          single_patient_registration: null,
          multiple_patient_registration: null,
          graphical_authorization_ui: null,
          offline_access_notification: null,
          refresh_token_duration: null,
          accurate_information: null,
          scoped_information: null,
          public_documentation_url: '',
          jwk_cache_control: null,
          native_app_refresh_tokens: null,
          service_base_urls_public: null,
          tls_enforcement_documented: null,
          refresh_token_renewal: null,
          since_parameter_support: null,
          sub_resource_scope_support: null,
          notes: ''
        }
      });
      setConfigJson({});
      setShowRegistration(false);

      // Clear Session storage
      Session.set('infernoClientSecret', null);

      // Clear localStorage
      localStorage.removeItem('infernoG10Config');

      setSnackbarMessage('All configuration data has been cleared.');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
    }
  }

  async function handleRegisterInfernoClient() {
    try {
      setLoading(true);

      // Call server method to register client
      const payload = {
        client_name: registrationForm.client_name,
        redirect_uris: registrationForm.redirect_uris.split('\n').filter(uri => uri.trim() !== ''),
        launch_uri: registrationForm.launch_uri,
        jwks_uri: registrationForm.jwks_uri,
        scope: registrationForm.scope,
        grant_types: ['authorization_code', 'refresh_token', 'client_credentials'],
        response_types: ['code'],
        token_endpoint_auth_method: 'client_secret_basic',
        infernoClient: true // Flag this as an Inferno client
      };

      const response = await fetch('/oauth/registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Inferno client registered successfully:', result);

        // Store the full registration response (includes client_secret)
        setInfernoClient(result);

        // IMPORTANT: Store client_secret in Session for JSON export
        // This is the ONLY time we have access to the client_secret
        if (result.client_secret) {
          Session.set('infernoClientSecret', result.client_secret);
        }

        setShowRegistration(false);
        setSnackbarMessage('Inferno OAuth client registered successfully! IMPORTANT: Copy the client secret now - it will not be shown again.');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
      } else {
        console.error('Registration failed:', result);
        setSnackbarMessage('Registration failed: ' + (result.error || result.description || 'Unknown error'));
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error registering Inferno client:', error);
      setSnackbarMessage('Error: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }

  function handleExportJson() {
    // Ensure baseUrl includes /baseR4 path
    let baseUrl = serverConfig.url || get(Meteor, 'settings.public.smartOnFhir.fhirServiceUrl', window.location.origin + '/baseR4');
    if (!baseUrl.includes('/baseR4')) {
      baseUrl = baseUrl.replace(/\/$/, '') + '/baseR4';
    }

    const clientId = get(infernoClient, 'client_id', '');
    const clientSecret = Session.get('infernoClientSecret') || '';
    const authUrl = serverConfig.authorization_endpoint || baseUrl.replace('/baseR4', '/oauth/authorize');
    const tokenUrl = serverConfig.token_endpoint || baseUrl.replace('/baseR4', '/oauth/token');

    // Helper to build auth_info value objects, omitting empty/undefined values
    const buildAuthValue = (obj) => {
      const result = {};
      Object.entries(obj).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          result[key] = value;
        }
      });
      return result;
    };

    // Auth type options for dropdowns
    const authTypeOptions = {
      list_options: [
        { label: "Public", value: "public" },
        { label: "Confidential Symmetric", value: "symmetric" },
        { label: "Confidential Asymmetric", value: "asymmetric" }
      ]
    };

    // Standard patient scopes for standalone launch (includes all g(10) required resources)
    const standaloneScopes = "launch/patient openid fhirUser offline_access patient/Medication.rs patient/AllergyIntolerance.rs patient/CarePlan.rs patient/CareTeam.rs patient/Condition.rs patient/Coverage.rs patient/Device.rs patient/DiagnosticReport.rs patient/DocumentReference.rs patient/Encounter.rs patient/Goal.rs patient/Immunization.rs patient/Location.rs patient/MedicationDispense.rs patient/MedicationRequest.rs patient/Observation.rs patient/Organization.rs patient/Patient.rs patient/Practitioner.rs patient/Procedure.rs patient/Provenance.rs patient/PractitionerRole.rs patient/RelatedPerson.rs patient/ServiceRequest.rs patient/Specimen.rs patient/Media.rs";

    // User scopes for EHR launch (includes all g(10) required resources)
    const ehrScopes = "launch openid fhirUser offline_access user/Medication.rs user/AllergyIntolerance.rs user/CarePlan.rs user/CareTeam.rs user/Condition.rs user/Coverage.rs user/Device.rs user/DiagnosticReport.rs user/DocumentReference.rs user/Encounter.rs user/Goal.rs user/Immunization.rs user/Location.rs user/MedicationDispense.rs user/MedicationRequest.rs user/Observation.rs user/Organization.rs user/Patient.rs user/Practitioner.rs user/Procedure.rs user/Provenance.rs user/PractitionerRole.rs user/RelatedPerson.rs user/ServiceRequest.rs user/Specimen.rs user/Media.rs";

    // v1 scopes (using .read instead of .rs)
    const v1Scopes = "launch/patient openid fhirUser offline_access patient/Medication.read patient/AllergyIntolerance.read patient/CarePlan.read patient/CareTeam.read patient/Condition.read patient/Device.read patient/DiagnosticReport.read patient/DocumentReference.read patient/Encounter.read patient/Goal.read patient/Immunization.read patient/Location.read patient/MedicationRequest.read patient/Observation.read patient/Organization.read patient/Patient.read patient/Practitioner.read patient/Procedure.read patient/Provenance.read patient/PractitionerRole.read patient/RelatedPerson.read patient/Specimen.read patient/Coverage.read patient/MedicationDispense.read patient/ServiceRequest.read patient/Media.read";

    // Granular scopes for testing fine-grained access
    const granularScopes1 = "launch/patient openid fhirUser offline_access patient/Condition.rs?category=http://terminology.hl7.org/CodeSystem/condition-category|encounter-diagnosis patient/Condition.rs?category=http://hl7.org/fhir/us/core/CodeSystem/condition-category|health-concern patient/Observation.rs?category=http://terminology.hl7.org/CodeSystem/observation-category|laboratory patient/Observation.rs?category=http://terminology.hl7.org/CodeSystem/observation-category|social-history";

    const granularScopes2 = "launch/patient openid fhirUser offline_access patient/Condition.rs?category=http://terminology.hl7.org/CodeSystem/condition-category|problem-list-item patient/Observation.rs?category=http://terminology.hl7.org/CodeSystem/observation-category|vital-signs patient/Observation.rs?category=http://terminology.hl7.org/CodeSystem/observation-category|survey patient/Observation.rs?category=http://hl7.org/fhir/us/core/CodeSystem/us-core-category|sdoh patient/Observation.rs?category=http://hl7.org/fhir/us/core/CodeSystem/us-core-category|functional-status patient/Observation.rs?category=http://hl7.org/fhir/us/core/CodeSystem/us-core-category|disability-status patient/Observation.rs?category=http://hl7.org/fhir/us/core/CodeSystem/us-core-category|cognitive-status patient/Observation.rs?category=http://terminology.hl7.org/CodeSystem/observation-category|activity";

    const granularScopesSelection = "launch/patient openid fhirUser offline_access patient/Condition.rs patient/Observation.rs patient/Patient.rs";

    // System scopes for bulk data export (backend services)
    // Note: No OIDC scopes (launch, openid, fhirUser, offline_access) - those are for interactive flows
    const bulkScopes = "system/Patient.rs system/AllergyIntolerance.rs system/CarePlan.rs system/CareTeam.rs system/Condition.rs system/Coverage.rs system/Device.rs system/DiagnosticReport.rs system/DocumentReference.rs system/Encounter.rs system/Goal.rs system/Immunization.rs system/Location.rs system/Medication.rs system/MedicationDispense.rs system/MedicationRequest.rs system/Observation.rs system/Organization.rs system/Practitioner.rs system/PractitionerRole.rs system/Procedure.rs system/Provenance.rs system/RelatedPerson.rs system/ServiceRequest.rs system/Specimen.rs system/Media.rs";

    // Build complete Inferno preset configuration array
    const exportConfig = [
      // FHIR Endpoint URL
      {
        name: "url",
        description: "URL of the FHIR endpoint used by SMART applications",
        title: "FHIR Endpoint",
        type: "text",
        value: baseUrl
      },

      // Standalone Patient Launch (Confidential Symmetric)
      {
        name: "standalone_smart_auth_info",
        options: {
          mode: "auth",
          components: [
            { name: "auth_type", default: "symmetric", options: authTypeOptions, locked: true },
            { name: "auth_request_method", default: "GET", locked: true },
            { name: "use_discovery", locked: true },
            { name: "requested_scopes", default: standaloneScopes },
            { name: "pkce_support", default: "enabled", locked: true },
            { name: "pkce_code_challenge_method", default: "S256", locked: true },
            { name: "jwks", locked: true }
          ]
        },
        title: "Standalone Launch Credentials",
        type: "auth_info",
        value: buildAuthValue({
          pkce_support: "enabled",
          pkce_code_challenge_method: "S256",
          auth_request_method: "GET",
          auth_type: "symmetric",
          use_discovery: "true",
          auth_url: authUrl,
          token_url: tokenUrl,
          requested_scopes: standaloneScopes,
          client_id: clientId,
          client_secret: clientSecret
        }),
        default: {}
      },

      // Expected Resources for Limited Access
      {
        name: "expected_resources",
        default: "patient, condition, observation",
        description: "the user will only grant access to the following resources during authorization.",
        title: "Expected Resource Grant for Limited Access Launch",
        type: "text",
        value: "patient, condition, observation"
      },

      // EHR Launch Credentials
      {
        name: "ehr_smart_auth_info",
        options: {
          mode: "auth",
          components: [
            { name: "auth_type", default: "symmetric", options: authTypeOptions, locked: true },
            { name: "use_discovery", locked: true },
            { name: "requested_scopes", default: ehrScopes },
            { name: "auth_request_method", default: "POST", locked: true },
            { name: "pkce_support", default: "enabled", locked: true },
            { name: "pkce_code_challenge_method", default: "S256", locked: true }
          ]
        },
        title: "EHR Launch Credentials",
        type: "auth_info",
        value: buildAuthValue({
          pkce_support: "enabled",
          pkce_code_challenge_method: "S256",
          auth_request_method: "POST",
          auth_type: "symmetric",
          use_discovery: "true",
          auth_url: authUrl,
          token_url: tokenUrl,
          requested_scopes: ehrScopes,
          client_id: clientId,
          client_secret: clientSecret
        }),
        default: {}
      },

      // Additional Patient IDs
      {
        name: "additional_patient_ids",
        description: "Comma separated list of Patient IDs that together with the Patient ID from the SMART App Launch contain all MUST SUPPORT elements.",
        optional: true,
        title: "Additional Patient IDs",
        type: "text",
        value: ""
      },

      // Implantable Device Codes
      {
        name: "implantable_device_codes",
        description: "Enter the code for an Implantable Device type, or multiple codes separated by commas. If blank, Inferno will validate all Device resources against the Implantable Device profile",
        optional: true,
        title: "Implantable Device Type Code",
        type: "text",
        value: ""
      },

      // Bulk Data FHIR URL
      {
        name: "bulk_server_url",
        description: "The URL of the Bulk FHIR server.",
        title: "Bulk Data FHIR URL",
        type: "text",
        value: baseUrl
      },

      // Group ID
      {
        name: "group_id",
        description: "The Group ID associated with the group of patients to be exported.",
        title: "Group ID",
        type: "text",
        value: testConfig.bulk_data.group_id || "123"
      },

      // Bulk Patient IDs in Group
      {
        name: "bulk_patient_ids_in_group",
        description: "Comma separated list of every Patient ID that is in the specified Group. This information is provided by the system under test to verify that data returned matches expectations. Leave blank to not verify Group inclusion.",
        optional: true,
        title: "Patient IDs in exported Group",
        type: "text",
        value: testConfig.bulk_data.bulk_patient_ids_in_group || ""
      },

      // Bulk Device Types in Group
      {
        name: "bulk_device_types_in_group",
        description: "Comma separated list of every Implantable Device type that is in the specified Group. This information is provided by the system under test to verify that data returned matches expectations. Leave blank to verify all Device resources against the Implantable Device profile.",
        optional: true,
        title: "Implantable Device Type Codes in exported Group",
        type: "text",
        value: ""
      },

      // Lines to Validate
      {
        name: "lines_to_validate",
        description: "To validate all, leave blank.",
        optional: true,
        title: "Limit validation to a maximum resource count",
        type: "text",
        value: ""
      },

      // Bulk Timeout
      {
        name: "bulk_timeout",
        default: 180,
        description: "While testing, Inferno waits for the server to complete the exporting task. If the calculated totalTime is greater than the timeout value specified here, Inferno bulk client stops testing. Please enter an integer for the maximum wait time in seconds. If timeout is less than 1, Inferno uses default value 180. If the   timeout is greater than 600 (10 minutes), Inferno uses the maximum value 600.",
        title: "Export Times Out after (1-600)",
        type: "text",
        value: testConfig.bulk_data.bulk_timeout || "600"
      },

      // Multi-Patient API Credentials (Backend Services)
      {
        name: "bulk_smart_auth_info",
        options: {
          mode: "auth",
          components: [
            { name: "auth_type", default: "backend_services", locked: true },
            { name: "use_discovery", default: false, locked: true },
            { name: "token_url", optional: false },
            { name: "jwks", locked: true }
          ]
        },
        title: "Multi-Patient API Credentials",
        type: "auth_info",
        value: buildAuthValue({
          encryption_algorithm: "ES384",
          auth_type: "backend_services",
          token_url: tokenUrl,
          requested_scopes: bulkScopes,
          client_id: clientId
        }),
        default: {}
      },

      // Since Timestamp
      {
        name: "since_timestamp",
        default: new Date().toISOString(),
        description: "A timestamp formatted as a FHIR instant which will be used to test the server's support for the `_since` query parameter",
        title: "Timestamp for _since parameter",
        type: "text",
        value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week ago
      },

      // Public Launch Credentials (no client_secret for public clients)
      {
        name: "public_smart_auth_info",
        options: {
          mode: "auth",
          components: [
            { name: "auth_type", default: "public", options: authTypeOptions, locked: true },
            { name: "auth_request_method", default: "GET", locked: true },
            { name: "requested_scopes", default: standaloneScopes },
            { name: "pkce_support", default: "enabled", locked: true },
            { name: "pkce_code_challenge_method", default: "S256", locked: true },
            { name: "use_discovery", locked: true }
          ]
        },
        title: "Public Launch Credentials",
        type: "auth_info",
        value: buildAuthValue({
          pkce_support: "enabled",
          pkce_code_challenge_method: "S256",
          auth_request_method: "GET",
          auth_type: "public",
          use_discovery: "true",
          requested_scopes: standaloneScopes,
          client_id: clientId
        }),
        default: {}
      },

      // Token Revocation Attestation
      {
        name: "token_revocation_attestation",
        default: "false",
        options: {
          list_options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" }
          ]
        },
        title: "The Health IT developer demonstrated a patient's request for revoking the tokens provided during the patient standalone launch within the last hour",
        type: "radio",
        value: attestations.token_revocation_attestation
      },
      {
        name: "token_revocation_notes",
        optional: true,
        title: "Notes, if applicable:",
        type: "textarea",
        value: attestations.token_revocation_notes
      },

      // EHR Launch with Patient Scopes
      {
        name: "ehr_patient_smart_auth_info",
        options: {
          mode: "auth",
          components: [
            { name: "auth_type", default: "symmetric", options: authTypeOptions, locked: true },
            { name: "requested_scopes", default: "launch openid fhirUser offline_access patient/Patient.rs", locked: true },
            { name: "use_discovery", locked: true },
            { name: "pkce_support", default: "enabled", locked: true },
            { name: "pkce_code_challenge_method", default: "S256", locked: true },
            { name: "auth_request_method", default: "GET", locked: true }
          ]
        },
        title: "EHR Launch with Patient Scopes Credentials",
        type: "auth_info",
        value: buildAuthValue({
          pkce_support: "enabled",
          pkce_code_challenge_method: "S256",
          auth_request_method: "GET",
          auth_type: "symmetric",
          use_discovery: "true",
          requested_scopes: "launch openid fhirUser offline_access patient/Patient.rs",
          client_id: clientId,
          client_secret: clientSecret
        }),
        default: {}
      },

      // Custom Authorization Header
      {
        name: "custom_authorization_header",
        description: "Add custom headers for the introspection request by adding each header's name and value with a new line between each header. Ex:   <Header 1 Name>: <Value 1>",
        optional: true,
        title: "Custom HTTP Headers for Introspection Request",
        type: "textarea",
        value: ""
      },

      // Optional Introspection Request Params
      {
        name: "optional_introspection_request_params",
        description: "Any additional parameters to append to the request body, separated by &. Example: 'param1=abc&param2=def'",
        optional: true,
        title: "Additional Introspection Request Parameters",
        type: "textarea",
        value: ""
      },

      // Asymmetric Launch Credentials
      {
        name: "asymmetric_smart_auth_info",
        options: {
          mode: "auth",
          components: [
            { name: "auth_type", default: "asymmetric", options: authTypeOptions, locked: true },
            { name: "requested_scopes", default: standaloneScopes },
            { name: "pkce_support", default: "enabled", locked: true },
            { name: "pkce_code_challenge_method", default: "S256", locked: true },
            { name: "jwks", locked: true },
            { name: "use_discovery", locked: true },
            { name: "auth_request_method", default: "GET", locked: true }
          ]
        },
        title: "Asymmetric Launch Credentials",
        type: "auth_info",
        value: buildAuthValue({
          pkce_support: "enabled",
          pkce_code_challenge_method: "S256",
          auth_request_method: "GET",
          encryption_algorithm: "ES384",
          auth_type: "asymmetric",
          use_discovery: "true",
          requested_scopes: standaloneScopes,
          client_id: clientId
        }),
        default: {}
      },

      // v1 Scopes Credentials
      {
        name: "v1_smart_auth_info",
        options: {
          mode: "auth",
          components: [
            { name: "requested_scopes", default: v1Scopes },
            { name: "auth_type", default: "symmetric", options: authTypeOptions, locked: true },
            { name: "auth_request_method", default: "GET", locked: true },
            { name: "use_discovery", locked: true },
            { name: "pkce_support", default: "enabled", locked: true },
            { name: "pkce_code_challenge_method", default: "S256", locked: true }
          ]
        },
        title: "Launch with v1 Scopes Credentials",
        type: "auth_info",
        value: buildAuthValue({
          pkce_support: "enabled",
          pkce_code_challenge_method: "S256",
          auth_request_method: "GET",
          auth_type: "symmetric",
          use_discovery: "true",
          requested_scopes: v1Scopes,
          client_id: clientId,
          client_secret: clientSecret
        }),
        default: {}
      },

      // Granular Scopes 1 Credentials
      {
        name: "granular_scopes_1_auth_info",
        options: {
          mode: "auth",
          components: [
            { name: "auth_type", options: authTypeOptions },
            { name: "jwks", locked: true },
            { name: "requested_scopes", default: granularScopes1 },
            { name: "pkce_support", default: "enabled", locked: true },
            { name: "pkce_code_challenge_method", default: "S256", locked: true },
            { name: "use_discovery", locked: true },
            { name: "auth_request_method", default: "GET", locked: true }
          ]
        },
        title: "Granular Scopes 1 Credentials",
        type: "auth_info",
        value: buildAuthValue({
          pkce_support: "enabled",
          pkce_code_challenge_method: "S256",
          auth_request_method: "GET",
          auth_type: "public",
          use_discovery: "true",
          requested_scopes: granularScopes1,
          client_id: clientId
        }),
        default: {}
      },

      // Granular Scopes 2 Credentials
      {
        name: "granular_scopes_2_auth_info",
        options: {
          mode: "auth",
          components: [
            { name: "auth_type", options: authTypeOptions },
            { name: "jwks", locked: true },
            { name: "requested_scopes", default: granularScopes2 },
            { name: "pkce_support", default: "enabled", locked: true },
            { name: "pkce_code_challenge_method", default: "S256", locked: true },
            { name: "use_discovery", locked: true },
            { name: "auth_request_method", default: "GET", locked: true }
          ]
        },
        title: "Granular Scopes 2 Credentials",
        type: "auth_info",
        value: buildAuthValue({
          pkce_support: "enabled",
          pkce_code_challenge_method: "S256",
          auth_request_method: "GET",
          auth_type: "public",
          use_discovery: "true",
          requested_scopes: granularScopes2,
          client_id: clientId
        }),
        default: {}
      },

      // Granular Scope Selection Credentials
      {
        name: "granular_scopes_selection_smart_auth_info",
        options: {
          mode: "auth",
          components: [
            { name: "auth_type", options: authTypeOptions },
            { name: "use_discovery", locked: true },
            { name: "requested_scopes", default: granularScopesSelection },
            { name: "jwks", locked: true },
            { name: "pkce_support", default: "enabled", locked: true },
            { name: "pkce_code_challenge_method", default: "S256", locked: true },
            { name: "auth_request_method", default: "GET", locked: true }
          ]
        },
        title: "Granular Scope Selection Credentials",
        type: "auth_info",
        value: buildAuthValue({
          pkce_support: "enabled",
          pkce_code_challenge_method: "S256",
          auth_request_method: "GET",
          auth_type: "public",
          use_discovery: "true",
          requested_scopes: granularScopesSelection,
          client_id: clientId
        }),
        default: {}
      },

      // Visual Inspection Attestations
      {
        name: "single_patient_registration_supported",
        default: "false",
        options: { list_options: [{ label: "Yes", value: "true" }, { label: "No", value: "false" }] },
        title: "Health IT Module demonstrated support for application registration for single patients.",
        type: "radio",
        value: attestations.single_patient_registration_supported
      },
      { name: "single_patient_registration_notes", optional: true, title: "Notes, if applicable:", type: "textarea", value: attestations.single_patient_registration_notes },

      {
        name: "multiple_patient_registration_supported",
        default: "false",
        options: { list_options: [{ label: "Yes", value: "true" }, { label: "No", value: "false" }] },
        title: "Health IT Module demonstrated support for application registration for multiple patients.",
        type: "radio",
        value: attestations.multiple_patient_registration_supported
      },
      { name: "multiple_patient_registration_notes", optional: true, title: "Notes, if applicable:", type: "textarea", value: attestations.multiple_patient_registration_notes },

      {
        name: "resource_authorization_gui_supported",
        default: "false",
        options: { list_options: [{ label: "Yes", value: "true" }, { label: "No", value: "false" }] },
        title: "Health IT Module demonstrated a graphical user interface for user to authorize FHIR resources.",
        type: "radio",
        value: attestations.resource_authorization_gui_supported
      },
      { name: "resource_authorization_gui_notes", optional: true, title: "Notes, if applicable:", type: "textarea", value: attestations.resource_authorization_gui_notes },

      {
        name: "offline_access_notification_supported",
        default: "false",
        options: { list_options: [{ label: "Yes", value: "true" }, { label: "No", value: "false" }] },
        title: "Health IT Module informed patient when \"offline_access\" scope is being granted during authorization.",
        type: "radio",
        value: attestations.offline_access_notification_supported
      },
      { name: "offline_access_notification_notes", optional: true, title: "Notes, if applicable:", type: "textarea", value: attestations.offline_access_notification_notes },

      {
        name: "refresh_token_period_attestation",
        default: "false",
        options: { list_options: [{ label: "Yes", value: "true" }, { label: "No", value: "false" }] },
        title: "Health IT Module attested that it is capable of issuing refresh tokens that are valid for a period of no shorter than three months.",
        type: "radio",
        value: attestations.refresh_token_period_attestation
      },
      { name: "refresh_token_period_notes", optional: true, title: "Notes, if applicable:", type: "textarea", value: attestations.refresh_token_period_notes },

      {
        name: "information_accuracy_attestation",
        default: "false",
        options: { list_options: [{ label: "Yes", value: "true" }, { label: "No", value: "false" }] },
        title: "Tester verifies that all information is accurate and without omission.",
        type: "radio",
        value: attestations.information_accuracy_attestation
      },
      { name: "information_accuracy_notes", optional: true, title: "Notes, if applicable:", type: "textarea", value: attestations.information_accuracy_notes },

      {
        name: "multi_patient_scopes_attestation",
        default: "false",
        options: { list_options: [{ label: "Yes", value: "true" }, { label: "No", value: "false" }] },
        title: "Information returned no greater than scopes pre-authorized for multi-patient queries.",
        type: "radio",
        value: attestations.multi_patient_scopes_attestation
      },
      { name: "multi_patient_scopes_notes", optional: true, title: "Notes, if applicable:", type: "textarea", value: attestations.multi_patient_scopes_notes },

      {
        name: "developer_documentation_attestation",
        default: "false",
        options: { list_options: [{ label: "Yes", value: "true" }, { label: "No", value: "false" }] },
        title: "Health IT developer demonstrated the documentation is available at a publicly accessible URL.",
        type: "radio",
        value: attestations.developer_documentation_attestation
      },
      { name: "developer_documentation_notes", optional: true, title: "Notes, if applicable:", type: "textarea", value: attestations.developer_documentation_notes },

      {
        name: "jwks_cache_attestation",
        default: "false",
        options: { list_options: [{ label: "Yes", value: "true" }, { label: "No", value: "false" }] },
        title: "Health IT developer confirms the Health IT Module does not cache the JWK Set received via a TLS-protected URL for longer than the cache-control header indicates.",
        type: "radio",
        value: attestations.jwks_cache_attestation
      },
      { name: "jwks_cache_notes", optional: true, title: "Notes, if applicable:", type: "textarea", value: attestations.jwks_cache_notes },

      {
        name: "native_refresh_attestation",
        default: "false",
        options: { list_options: [{ label: "Yes", value: "true" }, { label: "No", value: "false" }] },
        title: "Health IT developer demonstrates support for issuing refresh tokens to native applications.",
        type: "radio",
        value: attestations.native_refresh_attestation
      },
      { name: "native_refresh_notes", optional: true, title: "Notes, if applicable:", type: "textarea", value: attestations.native_refresh_notes },

      {
        name: "public_url_attestation",
        default: "false",
        options: { list_options: [{ label: "Yes", value: "true" }, { label: "No", value: "false" }] },
        title: "Health IT developer demonstrates the public location of its certified API technology service base URLs",
        type: "radio",
        value: attestations.public_url_attestation
      },
      { name: "public_url_attestation_notes", optional: true, title: "Notes, if applicable:", type: "textarea", value: attestations.public_url_attestation_notes },

      { name: "tls_version_attestation_notes", optional: true, title: "Document how TLS version 1.2 or above is enforced, if required:", type: "textarea", value: attestations.tls_version_attestation_notes },

      {
        name: "refresh_token_refresh_attestation",
        default: "false",
        options: { list_options: [{ label: "Yes", value: "true" }, { label: "No", value: "false" }] },
        title: "Health IT developer attested that the Health IT Module is capable of issuing refresh tokens valid for a new period of no shorter than three months without requiring re-authentication and re-authorization when a valid refresh token is supplied by the application.",
        type: "radio",
        value: attestations.refresh_token_refresh_attestation
      },
      { name: "refresh_token_refresh_notes", optional: true, title: "Notes, if applicable:", type: "textarea", value: attestations.refresh_token_refresh_notes },

      {
        name: "bulk_v2_since_attestation",
        default: "false",
        options: { list_options: [{ label: "Yes", value: "true" }, { label: "No", value: "false" }] },
        title: "Health IT developer attested that the Health IT Module meets the requirements for supporting the `_since` parameter for bulk data exports.",
        type: "radio",
        value: attestations.bulk_v2_since_attestation
      },
      { name: "bulk_v2_since_attestation_notes", optional: true, title: "Notes, if applicable:", type: "textarea", value: attestations.bulk_v2_since_attestation_notes },

      {
        name: "clinical_test_scope_attestation",
        default: "false",
        options: { list_options: [{ label: "Yes", value: "true" }, { label: "No", value: "false" }] },
        title: "Health IT developer attested that the Health IT Module supports granting a sub resource scope for Clinical Test Observations.",
        type: "radio",
        value: attestations.clinical_test_scope_attestation
      },
      { name: "clinical_test_scope_attestation_notes", optional: true, title: "Notes, if applicable:", type: "textarea", value: attestations.clinical_test_scope_attestation_notes }
    ];

    // Final cleanup: remove empty string values from auth_info value objects
    const cleanedConfig = exportConfig.map(item => {
      if (item.type === 'auth_info' && item.value) {
        const cleanedValue = {};
        Object.entries(item.value).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            cleanedValue[key] = val;
          }
        });
        return { ...item, value: cleanedValue };
      }
      return item;
    });

    const jsonString = JSON.stringify(cleanedConfig, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inferno-g10-preset.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSnackbarMessage('Inferno preset configuration exported successfully!');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  }

  function handleImportJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);

        // Store the raw imported JSON
        setConfigJson(imported);

        // Populate test configuration from imported data
        setTestConfig({
          phr_full_access: {
            patient_id: get(imported, 'standalone_patient_app_full_access_patient_id', ''),
            received_scopes: get(imported, 'standalone_patient_app_full_access_received_scopes', testConfig.phr_full_access.received_scopes)
          },
          phr_limited_access: {
            patient_id: get(imported, 'standalone_patient_app_limited_access_patient_id', ''),
            received_scopes: get(imported, 'standalone_patient_app_limited_access_received_scopes', testConfig.phr_limited_access.received_scopes)
          },
          ehr_practitioner: {
            patient_id: get(imported, 'ehr_practitioner_app_patient_id', ''),
            received_scopes: get(imported, 'ehr_practitioner_app_received_scopes', testConfig.ehr_practitioner.received_scopes)
          },
          patient_chart: {
            patient_id: get(imported, 'standalone_patient_chart_patient_id', ''),
            received_scopes: get(imported, 'standalone_patient_chart_received_scopes', testConfig.patient_chart.received_scopes)
          },
          bulk_data: {
            bulk_server_url: get(imported, 'bulk_server_url', ''),
            backend_services_token_endpoint: get(imported, 'backend_services_token_endpoint', ''),
            bulk_timeout: get(imported, 'bulk_timeout', '600'),
            group_id: get(imported, 'group_id', '')
          },
          additional_auth: {
            patient_id: get(imported, 'additional_patient_ids_in_multiple_patients', ''),
            received_scopes: get(imported, 'additional_patient_ids_in_multiple_patients_received_scopes', testConfig.additional_auth.received_scopes)
          },
          visual_inspection: get(imported, 'visual_inspection', testConfig.visual_inspection)
        });

        // Populate client info if present
        if (imported.client_id) {
          setInfernoClient({
            client_id: imported.client_id,
            client_name: get(imported, 'client_name', 'Inferno G10 Certification Suite')
          });
        }

        // Store client_secret if present
        if (imported.client_secret) {
          Session.set('infernoClientSecret', imported.client_secret);
        }

        setSnackbarMessage('Configuration imported successfully! All form fields have been populated.');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (error) {
        console.error('Error importing JSON:', error);
        setSnackbarMessage('Error importing JSON: ' + error.message);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    };
    reader.readAsText(file);
  }

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <Box sx={{ minHeight: '100vh', py: 4, px: 3 }}>
      <Typography variant="h4" sx={{ mb: '20px' }}>
        (g)(10) Certification
      </Typography>

      <Card>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Configure" />
          <Tab label="(1) PHR Full-Access App" />
          <Tab label="(2) PHR Limited Access App" />
          <Tab label="(3) EHR Practitioner Access App" />
          <Tab label="(4) Patient Chart" />
          <Tab label="(8) Bulk Data - System Access" />
          <Tab label="(9) Additional Authorization" />
          <Tab label="(11) Visual Inspection" />
        </Tabs>
        <CardContent>
          {currentTab === 0 && (
            <Box>
              {/* Selected Patient Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Selected Test Patient
                </Typography>
                {selectedPatient ? (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Patient:</strong> {get(selectedPatient, 'name[0].given[0]', '')} {get(selectedPatient, 'name[0].family', 'Unknown')}<br/>
                      <strong>FHIR ID:</strong> {get(selectedPatient, 'id', 'N/A')}<br/>
                      <strong>DOB:</strong> {get(selectedPatient, 'birthDate', 'N/A')}
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    No patient selected. Go to the Patient Directory and click "Certify" on a patient to select them for testing.
                  </Alert>
                )}
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleSeedMustSupportReferences}
                  disabled={loading}
                  sx={{ mr: 2 }}
                >
                  {loading ? 'Seeding...' : 'Seed MustSupport References'}
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Creates RelatedPerson resource and adds as CareTeam participant for test 12.5.06 (CareTeam MustSupport). Uses selected patient or first patient in database.
                </Typography>

                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handlePatchPatientMustSupport}
                  disabled={loading || !selectedPatient}
                  sx={{ mr: 2, mt: 2 }}
                >
                  {loading ? 'Patching...' : 'Patch Patient MustSupport'}
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Adds name.use:"old" with suffix and period.end, address.use:"old" with period.end, and deceasedDateTime for test 12.2.09 (Patient MustSupport elements).
                </Typography>

                {/* Seed Missing References Accordion */}
                <Accordion sx={{ mt: 3 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">Seed Missing References (from 403 URLs)</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Paste URLs that returned 403 errors (one per line). The resource type and ID will be parsed and stub resources will be created.
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="https://server.com/baseR4/Organization/org-123&#10;https://server.com/baseR4/Practitioner/prac-456&#10;https://server.com/baseR4/Location/loc-789"
                      value={missingReferencesUrls}
                      onChange={(e) => setMissingReferencesUrls(e.target.value)}
                      sx={{ mb: 2, fontFamily: 'monospace' }}
                      InputProps={{
                        sx: { fontFamily: 'monospace', fontSize: '0.85rem' }
                      }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSeedMissingReferences}
                      disabled={loading || !missingReferencesUrls.trim()}
                    >
                      {loading ? 'Creating...' : 'Create Stub Resources'}
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Creates minimal stub resources with the specified IDs. Useful for satisfying MustSupport reference requirements.
                    </Typography>
                  </AccordionDetails>
                </Accordion>

                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Daisey Test Patient (Recommended)
                  </Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Daisey Koelpin</strong> is a fully prepared test patient with 367 resources covering all ONC (g)(10) requirements.<br/>
                      <strong>Patient ID:</strong> <code>958c63b0-4a7f-2ee7-ef6a-e04df5931b4c</code>
                    </Typography>
                  </Alert>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleLoadDaiseyPatient}
                    disabled={loading}
                    sx={{ mr: 2 }}
                  >
                    {loading ? 'Loading...' : 'Load Daisey Test Patient'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleDownloadDaiseyData}
                    disabled={loading}
                    sx={{ mr: 2 }}
                  >
                    {loading ? 'Downloading...' : 'Download Daisey Data'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleRemoveDaiseyPatient}
                    disabled={loading}
                    sx={{ mr: 2 }}
                  >
                    {loading ? 'Removing...' : 'Remove Daisey Data'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Load: Inserts/updates all 367 resources with resolved conditional references. Remove: Deletes all Daisey resources by ID.
                  </Typography>
                </Box>
              </Box>

              <Typography variant="h6" gutterBottom>
                Inferno OAuth Client Configuration
              </Typography>

              {/* Server Configuration Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  First, fetch your server's FHIR endpoints and OAuth configuration from the /metadata route.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleFetchServerConfig}
                  disabled={loading}
                  sx={{ mb: 2 }}
                >
                  {loading ? 'Fetching...' : 'Fetch Server Metadata'}
                </Button>

                {serverConfig.url && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>✓ Server Configuration Loaded:</strong><br/>
                      FHIR URL: {serverConfig.url}<br/>
                      Authorization: {serverConfig.authorization_endpoint}<br/>
                      Token: {serverConfig.token_endpoint}
                    </Typography>
                  </Alert>
                )}
              </Box>

              {/* Show registered client info or registration form */}
              {infernoClient ? (
                <Box sx={{ mb: 4 }}>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    ✓ Inferno OAuth Client Registered
                  </Alert>

                  <TextField
                    fullWidth
                    label="Client ID"
                    value={get(infernoClient, 'client_id', '')}
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Client Name"
                    value={get(infernoClient, 'client_name', '')}
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 2 }}
                  />

                  {/* Show client_secret ONLY if it exists in the response (first time only) */}
                  {get(infernoClient, 'client_secret') && (
                    <Box sx={{ mb: 2 }}>
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        <strong>IMPORTANT:</strong> Save this client secret now! It will only be displayed once and cannot be retrieved later.
                      </Alert>
                      <TextField
                        fullWidth
                        label="Client Secret"
                        value={get(infernoClient, 'client_secret', '')}
                        InputProps={{ readOnly: true }}
                        sx={{ mb: 2 }}
                        type="text"
                        multiline
                      />
                    </Box>
                  )}

                  {!get(infernoClient, 'client_secret') && (
                    <Alert severity="info">
                      <strong>Note:</strong> Client secret was securely stored during registration and will be included in the exported JSON configuration.
                    </Alert>
                  )}
                </Box>
              ) : (
                <Box sx={{ mb: 4 }}>
                  {!showRegistration ? (
                    <Box>
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        No Inferno OAuth client registered yet. Register a client to begin configuration.
                      </Alert>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setShowRegistration(true)}
                      >
                        Register Inferno OAuth Client
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Register Inferno as an OAuth client with comprehensive scopes and capabilities for (g)(10) certification testing.
                      </Typography>

                      <TextField
                        fullWidth
                        label="Client Name"
                        value={registrationForm.client_name}
                        onChange={(e) => handleRegistrationFormChange('client_name', e.target.value)}
                        sx={{ mb: 2 }}
                      />

                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Redirect URIs"
                        value={registrationForm.redirect_uris}
                        onChange={(e) => handleRegistrationFormChange('redirect_uris', e.target.value)}
                        helperText="One URL per line"
                        sx={{ mb: 2 }}
                      />

                      <TextField
                        fullWidth
                        label="Launch URI"
                        value={registrationForm.launch_uri}
                        onChange={(e) => handleRegistrationFormChange('launch_uri', e.target.value)}
                        sx={{ mb: 2 }}
                      />

                      <TextField
                        fullWidth
                        label="JWKS URI"
                        value={registrationForm.jwks_uri}
                        onChange={(e) => handleRegistrationFormChange('jwks_uri', e.target.value)}
                        sx={{ mb: 2 }}
                      />

                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Scopes"
                        value={registrationForm.scope}
                        onChange={(e) => handleRegistrationFormChange('scope', e.target.value)}
                        helperText="Space-separated SMART on FHIR scopes (patient/*, user/*, system/*)"
                        sx={{ mb: 2 }}
                      />

                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleRegisterInfernoClient}
                          disabled={loading}
                        >
                          {loading ? 'Registering...' : 'Register Client'}
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => setShowRegistration(false)}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {/* JSON Export/Import Section */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Inferno Test Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Export this configuration as JSON to import into Inferno, or import a previous configuration.
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    onClick={handleExportJson}
                    disabled={!infernoClient}
                  >
                    Export Configuration JSON
                  </Button>
                  <Button
                    variant="outlined"
                    component="label"
                  >
                    Import Configuration JSON
                    <input
                      type="file"
                      hidden
                      accept=".json"
                      onChange={handleImportJson}
                    />
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearAllData}
                  >
                    Clear All Data
                  </Button>
                </Box>

                <Alert severity="info" sx={{ mb: 2 }}>
                  <strong>Auto-save:</strong> Your configuration is automatically saved to browser storage as you type. Data persists across page refreshes.
                </Alert>

                <TextField
                  fullWidth
                  multiline
                  rows={20}
                  label="Configuration JSON Preview"
                  value={JSON.stringify({
                    url: serverConfig.url || get(Meteor, 'settings.public.smartOnFhir.fhirServiceUrl', window.location.origin + '/baseR4'),
                    authorization_endpoint: serverConfig.authorization_endpoint,
                    token_endpoint: serverConfig.token_endpoint,
                    registration_endpoint: serverConfig.registration_endpoint,
                    client_id: get(infernoClient, 'client_id', ''),
                    client_secret: Session.get('infernoClientSecret') ? '****** (secret stored)' : '',
                    standalone_patient_app_full_access_patient_id: testConfig.phr_full_access.patient_id,
                    standalone_patient_app_full_access_requested_scopes: testConfig.phr_full_access.received_scopes,
                    standalone_patient_app_limited_access_patient_id: testConfig.phr_limited_access.patient_id,
                    ehr_practitioner_app_patient_id: testConfig.ehr_practitioner.patient_id,
                    standalone_patient_chart_patient_id: testConfig.patient_chart.patient_id,
                    bulk_server_url: testConfig.bulk_data.bulk_server_url || serverConfig.url,
                    backend_services_token_endpoint: testConfig.bulk_data.backend_services_token_endpoint || serverConfig.token_endpoint,
                    bulk_data_jwks: get(configJson, 'bulk_data_jwks') ? '(JWKS loaded)' : '',
                    bulk_timeout: testConfig.bulk_data.bulk_timeout,
                    group_id: testConfig.bulk_data.group_id
                  }, null, 2)}
                  InputProps={{
                    readOnly: true,
                    sx: { fontFamily: 'monospace', fontSize: '0.85rem' }
                  }}
                  helperText="Client secret and JWKS are masked in preview but will be included in export. Click 'Fetch Server Configuration' to auto-populate endpoints."
                />
              </Box>
            </Box>
          )}

          {currentTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                (1) Standalone Patient App - Full Access
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configuration for testing a standalone patient application with full resource access.
              </Typography>

              <TextField
                fullWidth
                label="Patient ID"
                value={testConfig.phr_full_access.patient_id}
                onChange={(e) => handleTestConfigChange('phr_full_access', 'patient_id', e.target.value)}
                helperText="FHIR Patient ID to use for testing"
                sx={{ mb: 3 }}
              />

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                Scope Configuration
              </Typography>
              <ScopeSelector
                value={testConfig.phr_full_access.received_scopes}
                onChange={(newScopes) => handleTestConfigChange('phr_full_access', 'received_scopes', newScopes)}
                scopeType="patient"
                resources={G10_REQUIRED_RESOURCES}
              />
            </Box>
          )}

          {currentTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                (2) Standalone Patient App - Limited Access
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configuration for testing a standalone patient application with limited resource access (Observation only).
              </Typography>

              <TextField
                fullWidth
                label="Patient ID"
                value={testConfig.phr_limited_access.patient_id}
                onChange={(e) => handleTestConfigChange('phr_limited_access', 'patient_id', e.target.value)}
                helperText="FHIR Patient ID to use for testing"
                sx={{ mb: 3 }}
              />

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                Scope Configuration
              </Typography>
              <ScopeSelector
                value={testConfig.phr_limited_access.received_scopes}
                onChange={(newScopes) => handleTestConfigChange('phr_limited_access', 'received_scopes', newScopes)}
                scopeType="patient"
                resources={G10_REQUIRED_RESOURCES}
              />

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Limited Scope Test:</strong> This test verifies the system respects requested scope limitations and only returns Observation resources.
                </Typography>
              </Alert>
            </Box>
          )}

          {currentTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                (3) EHR Launch - Practitioner Access
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configuration for testing EHR-launched application with practitioner (user/*) scopes.
              </Typography>

              <TextField
                fullWidth
                label="Patient ID"
                value={testConfig.ehr_practitioner.patient_id}
                onChange={(e) => handleTestConfigChange('ehr_practitioner', 'patient_id', e.target.value)}
                helperText="FHIR Patient ID in context for EHR launch"
                sx={{ mb: 3 }}
              />

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                Scope Configuration
              </Typography>
              <ScopeSelector
                value={testConfig.ehr_practitioner.received_scopes}
                onChange={(newScopes) => handleTestConfigChange('ehr_practitioner', 'received_scopes', newScopes)}
                scopeType="user"
                resources={G10_REQUIRED_RESOURCES}
              />

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Practitioner Context:</strong> Tests user-level access scopes (user/*) and requires openid, fhirUser, and launch scopes for EHR launch context.
                </Typography>
              </Alert>
            </Box>
          )}

          {currentTab === 4 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                (4) Patient Chart (Standalone Launch)
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configuration for testing standalone patient chart application.
              </Typography>

              <TextField
                fullWidth
                label="Patient ID"
                value={testConfig.patient_chart.patient_id}
                onChange={(e) => handleTestConfigChange('patient_chart', 'patient_id', e.target.value)}
                helperText="FHIR Patient ID to use for testing"
                sx={{ mb: 3 }}
              />

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                Scope Configuration
              </Typography>
              <ScopeSelector
                value={testConfig.patient_chart.received_scopes}
                onChange={(newScopes) => handleTestConfigChange('patient_chart', 'received_scopes', newScopes)}
                scopeType="patient"
                resources={G10_REQUIRED_RESOURCES}
              />

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Wildcard Scope:</strong> Tests patient/*.rs wildcard scope granting access to all patient-compartment resources.
                </Typography>
              </Alert>
            </Box>
          )}

          {currentTab === 5 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                (8) Bulk Data Export - System Access
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configuration for testing FHIR Bulk Data Export with backend services (system/*) authorization.
              </Typography>

              <TextField
                fullWidth
                label="Bulk Data Server URL"
                value={testConfig.bulk_data.bulk_server_url}
                onChange={(e) => handleTestConfigChange('bulk_data', 'bulk_server_url', e.target.value)}
                helperText="Base URL for FHIR bulk data operations"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Backend Services Token Endpoint"
                value={testConfig.bulk_data.backend_services_token_endpoint}
                onChange={(e) => handleTestConfigChange('bulk_data', 'backend_services_token_endpoint', e.target.value)}
                helperText="OAuth token endpoint for backend services authorization"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Bulk Export Timeout (seconds)"
                type="number"
                value={testConfig.bulk_data.bulk_timeout}
                onChange={(e) => handleTestConfigChange('bulk_data', 'bulk_timeout', e.target.value)}
                helperText="Maximum time to wait for bulk export completion"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Group ID"
                value={testConfig.bulk_data.group_id}
                onChange={(e) => handleTestConfigChange('bulk_data', 'group_id', e.target.value)}
                helperText="Optional: FHIR Group ID for group-level export"
                sx={{ mb: 2 }}
              />

              <Button
                variant="outlined"
                color="primary"
                onClick={handleCreateBulkExportGroup}
                disabled={loading}
                sx={{ mb: 2 }}
              >
                Create Bulk Export Group
              </Button>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Creates a Group resource with all patients in the database for bulk export testing
              </Typography>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Backend Services:</strong> Tests system-level access using SMART Backend Services authorization for bulk data export operations.
                </Typography>
              </Alert>
            </Box>
          )}

          {currentTab === 6 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                (9) Additional Authorization - Scoped Access
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configuration for testing granular authorization with resource-level scopes (e.g., Observation by category).
              </Typography>

              <TextField
                fullWidth
                label="Patient ID"
                value={testConfig.additional_auth.patient_id}
                onChange={(e) => handleTestConfigChange('additional_auth', 'patient_id', e.target.value)}
                helperText="FHIR Patient ID to use for testing"
                sx={{ mb: 3 }}
              />

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                Scope Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Note: For granular scopes with search parameters (e.g., patient/Observation.rs?category=laboratory),
                use the text field below to manually specify the scope string.
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Received Scopes"
                value={testConfig.additional_auth.received_scopes}
                onChange={(e) => handleTestConfigChange('additional_auth', 'received_scopes', e.target.value)}
                helperText="Granular scope with search parameters (e.g., patient/Observation.rs?category=laboratory) to limit data access"
                sx={{ mb: 2 }}
              />

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Granular Scopes:</strong> Tests fine-grained authorization using search parameter-based scope restrictions (170.315(g)(10) optional requirement).
                </Typography>
              </Alert>
            </Box>
          )}

          {currentTab === 7 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Visual Inspection Checklist
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Complete these attestations and they will be included in the exported Inferno configuration.
              </Typography>

              {/* 9.3.01 - Token Revocation Attestation */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  9.3.01 - Token Revocation
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  The Health IT developer demonstrated a patient's request for revoking the tokens provided during the patient standalone launch within the last hour.
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={attestations.token_revocation_attestation}
                    onChange={(e) => setAttestations(prev => ({ ...prev, token_revocation_attestation: e.target.value }))}
                  >
                    <FormControlLabel value="true" control={<Radio size="small" />} label="Yes" />
                    <FormControlLabel value="false" control={<Radio size="small" />} label="No" />
                  </RadioGroup>
                </FormControl>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Notes"
                  placeholder="Patient-initiated token revocation available via My Profile > Authorized Apps section."
                  value={attestations.token_revocation_notes}
                  onChange={(e) => setAttestations(prev => ({ ...prev, token_revocation_notes: e.target.value }))}
                  sx={{ mt: 1 }}
                />
              </Paper>

              {/* Single Patient Registration */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Single Patient Registration
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Health IT Module demonstrated support for application registration for single patients.
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={attestations.single_patient_registration_supported}
                    onChange={(e) => setAttestations(prev => ({ ...prev, single_patient_registration_supported: e.target.value }))}
                  >
                    <FormControlLabel value="true" control={<Radio size="small" />} label="Yes" />
                    <FormControlLabel value="false" control={<Radio size="small" />} label="No" />
                  </RadioGroup>
                </FormControl>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Notes"
                  value={attestations.single_patient_registration_notes}
                  onChange={(e) => setAttestations(prev => ({ ...prev, single_patient_registration_notes: e.target.value }))}
                  sx={{ mt: 1 }}
                />
              </Paper>

              {/* Multiple Patient Registration */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Multiple Patient Registration
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Health IT Module demonstrated support for application registration for multiple patients.
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={attestations.multiple_patient_registration_supported}
                    onChange={(e) => setAttestations(prev => ({ ...prev, multiple_patient_registration_supported: e.target.value }))}
                  >
                    <FormControlLabel value="true" control={<Radio size="small" />} label="Yes" />
                    <FormControlLabel value="false" control={<Radio size="small" />} label="No" />
                  </RadioGroup>
                </FormControl>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Notes"
                  value={attestations.multiple_patient_registration_notes}
                  onChange={(e) => setAttestations(prev => ({ ...prev, multiple_patient_registration_notes: e.target.value }))}
                  sx={{ mt: 1 }}
                />
              </Paper>

              {/* Resource Authorization GUI */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Resource Authorization GUI
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Health IT Module demonstrated a graphical user interface for user to authorize FHIR resources.
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={attestations.resource_authorization_gui_supported}
                    onChange={(e) => setAttestations(prev => ({ ...prev, resource_authorization_gui_supported: e.target.value }))}
                  >
                    <FormControlLabel value="true" control={<Radio size="small" />} label="Yes" />
                    <FormControlLabel value="false" control={<Radio size="small" />} label="No" />
                  </RadioGroup>
                </FormControl>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Notes"
                  value={attestations.resource_authorization_gui_notes}
                  onChange={(e) => setAttestations(prev => ({ ...prev, resource_authorization_gui_notes: e.target.value }))}
                  sx={{ mt: 1 }}
                />
              </Paper>

              {/* Offline Access Notification */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Offline Access Notification
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Health IT Module informed patient when "offline_access" scope is being granted during authorization.
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={attestations.offline_access_notification_supported}
                    onChange={(e) => setAttestations(prev => ({ ...prev, offline_access_notification_supported: e.target.value }))}
                  >
                    <FormControlLabel value="true" control={<Radio size="small" />} label="Yes" />
                    <FormControlLabel value="false" control={<Radio size="small" />} label="No" />
                  </RadioGroup>
                </FormControl>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Notes"
                  value={attestations.offline_access_notification_notes}
                  onChange={(e) => setAttestations(prev => ({ ...prev, offline_access_notification_notes: e.target.value }))}
                  sx={{ mt: 1 }}
                />
              </Paper>

              {/* Refresh Token Period */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Refresh Token Period
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Health IT Module attested that it is capable of issuing refresh tokens that are valid for a period of no shorter than three months.
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={attestations.refresh_token_period_attestation}
                    onChange={(e) => setAttestations(prev => ({ ...prev, refresh_token_period_attestation: e.target.value }))}
                  >
                    <FormControlLabel value="true" control={<Radio size="small" />} label="Yes" />
                    <FormControlLabel value="false" control={<Radio size="small" />} label="No" />
                  </RadioGroup>
                </FormControl>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Notes"
                  value={attestations.refresh_token_period_notes}
                  onChange={(e) => setAttestations(prev => ({ ...prev, refresh_token_period_notes: e.target.value }))}
                  sx={{ mt: 1 }}
                />
              </Paper>

              {/* Information Accuracy */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Information Accuracy
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Tester verifies that all information is accurate and without omission.
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={attestations.information_accuracy_attestation}
                    onChange={(e) => setAttestations(prev => ({ ...prev, information_accuracy_attestation: e.target.value }))}
                  >
                    <FormControlLabel value="true" control={<Radio size="small" />} label="Yes" />
                    <FormControlLabel value="false" control={<Radio size="small" />} label="No" />
                  </RadioGroup>
                </FormControl>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Notes"
                  value={attestations.information_accuracy_notes}
                  onChange={(e) => setAttestations(prev => ({ ...prev, information_accuracy_notes: e.target.value }))}
                  sx={{ mt: 1 }}
                />
              </Paper>

              {/* Multi-Patient Scopes */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Multi-Patient Scope Compliance
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Information returned no greater than scopes pre-authorized for multi-patient queries.
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={attestations.multi_patient_scopes_attestation}
                    onChange={(e) => setAttestations(prev => ({ ...prev, multi_patient_scopes_attestation: e.target.value }))}
                  >
                    <FormControlLabel value="true" control={<Radio size="small" />} label="Yes" />
                    <FormControlLabel value="false" control={<Radio size="small" />} label="No" />
                  </RadioGroup>
                </FormControl>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Notes"
                  value={attestations.multi_patient_scopes_notes}
                  onChange={(e) => setAttestations(prev => ({ ...prev, multi_patient_scopes_notes: e.target.value }))}
                  sx={{ mt: 1 }}
                />
              </Paper>

              {/* Developer Documentation */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Developer Documentation
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Health IT developer demonstrated the documentation is available at a publicly accessible URL.
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={attestations.developer_documentation_attestation}
                    onChange={(e) => setAttestations(prev => ({ ...prev, developer_documentation_attestation: e.target.value }))}
                  >
                    <FormControlLabel value="true" control={<Radio size="small" />} label="Yes" />
                    <FormControlLabel value="false" control={<Radio size="small" />} label="No" />
                  </RadioGroup>
                </FormControl>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Notes"
                  value={attestations.developer_documentation_notes}
                  onChange={(e) => setAttestations(prev => ({ ...prev, developer_documentation_notes: e.target.value }))}
                  sx={{ mt: 1 }}
                />
              </Paper>

              {/* JWKS Cache */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  JWKS Cache Control
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Health IT developer confirms the Health IT Module does not cache the JWK Set received via a TLS-protected URL for longer than the cache-control header indicates.
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={attestations.jwks_cache_attestation}
                    onChange={(e) => setAttestations(prev => ({ ...prev, jwks_cache_attestation: e.target.value }))}
                  >
                    <FormControlLabel value="true" control={<Radio size="small" />} label="Yes" />
                    <FormControlLabel value="false" control={<Radio size="small" />} label="No" />
                  </RadioGroup>
                </FormControl>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Notes"
                  value={attestations.jwks_cache_notes}
                  onChange={(e) => setAttestations(prev => ({ ...prev, jwks_cache_notes: e.target.value }))}
                  sx={{ mt: 1 }}
                />
              </Paper>

              {/* Native Refresh Tokens */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Native App Refresh Tokens
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Health IT developer demonstrates support for issuing refresh tokens to native applications.
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={attestations.native_refresh_attestation}
                    onChange={(e) => setAttestations(prev => ({ ...prev, native_refresh_attestation: e.target.value }))}
                  >
                    <FormControlLabel value="true" control={<Radio size="small" />} label="Yes" />
                    <FormControlLabel value="false" control={<Radio size="small" />} label="No" />
                  </RadioGroup>
                </FormControl>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Notes"
                  value={attestations.native_refresh_notes}
                  onChange={(e) => setAttestations(prev => ({ ...prev, native_refresh_notes: e.target.value }))}
                  sx={{ mt: 1 }}
                />
              </Paper>

              {/* Public URL */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Public Service Base URLs
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Health IT developer demonstrates the public location of its certified API technology service base URLs.
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={attestations.public_url_attestation}
                    onChange={(e) => setAttestations(prev => ({ ...prev, public_url_attestation: e.target.value }))}
                  >
                    <FormControlLabel value="true" control={<Radio size="small" />} label="Yes" />
                    <FormControlLabel value="false" control={<Radio size="small" />} label="No" />
                  </RadioGroup>
                </FormControl>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Notes"
                  value={attestations.public_url_attestation_notes}
                  onChange={(e) => setAttestations(prev => ({ ...prev, public_url_attestation_notes: e.target.value }))}
                  sx={{ mt: 1 }}
                />
              </Paper>

              {/* TLS Version */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  TLS Issues
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  TLS Version Enforcement
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Health IT developers must document how the Health IT Module enforces TLS version 1.2 or above.
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  label="Document how TLS version 1.2 or above is enforced"
                  value={attestations.tls_version_attestation_notes}
                  onChange={(e) => setAttestations(prev => ({ ...prev, tls_version_attestation_notes: e.target.value }))}
                />
              </Paper>

              {/* Refresh Token Renewal */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Refresh Token Renewal
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Health IT developer attested that the Health IT Module is capable of issuing refresh tokens valid for a new period of no shorter than three months without requiring re-authentication and re-authorization when a valid refresh token is supplied by the application.
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={attestations.refresh_token_refresh_attestation}
                    onChange={(e) => setAttestations(prev => ({ ...prev, refresh_token_refresh_attestation: e.target.value }))}
                  >
                    <FormControlLabel value="true" control={<Radio size="small" />} label="Yes" />
                    <FormControlLabel value="false" control={<Radio size="small" />} label="No" />
                  </RadioGroup>
                </FormControl>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Notes"
                  value={attestations.refresh_token_refresh_notes}
                  onChange={(e) => setAttestations(prev => ({ ...prev, refresh_token_refresh_notes: e.target.value }))}
                  sx={{ mt: 1 }}
                />
              </Paper>

              {/* Bulk Data _since Parameter */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Bulk Data _since Parameter
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Health IT developer attested that the Health IT Module meets the requirements for supporting the `_since` parameter for bulk data exports.
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={attestations.bulk_v2_since_attestation}
                    onChange={(e) => setAttestations(prev => ({ ...prev, bulk_v2_since_attestation: e.target.value }))}
                  >
                    <FormControlLabel value="true" control={<Radio size="small" />} label="Yes" />
                    <FormControlLabel value="false" control={<Radio size="small" />} label="No" />
                  </RadioGroup>
                </FormControl>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Notes"
                  value={attestations.bulk_v2_since_attestation_notes}
                  onChange={(e) => setAttestations(prev => ({ ...prev, bulk_v2_since_attestation_notes: e.target.value }))}
                  sx={{ mt: 1 }}
                />
              </Paper>

              {/* Clinical Test Scope */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Clinical Test Observations Scope
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Health IT developer attested that the Health IT Module supports granting a sub resource scope for Clinical Test Observations.
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={attestations.clinical_test_scope_attestation}
                    onChange={(e) => setAttestations(prev => ({ ...prev, clinical_test_scope_attestation: e.target.value }))}
                  >
                    <FormControlLabel value="true" control={<Radio size="small" />} label="Yes" />
                    <FormControlLabel value="false" control={<Radio size="small" />} label="No" />
                  </RadioGroup>
                </FormControl>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Notes"
                  value={attestations.clinical_test_scope_attestation_notes}
                  onChange={(e) => setAttestations(prev => ({ ...prev, clinical_test_scope_attestation_notes: e.target.value }))}
                  sx={{ mt: 1 }}
                />
              </Paper>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default G10CertificationPage;
