// packages/reference-app/client/G10CertificationPage.jsx

// React and UI components imports
import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';

import {
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
  Chip
} from '@mui/material';

// =============================================================================
// CONSTANTS
// =============================================================================

// FHIR Resources required for (g)(10) certification
const G10_REQUIRED_RESOURCES = [
  'Patient', 'AllergyIntolerance', 'CarePlan', 'CareTeam', 'Condition',
  'Device', 'DiagnosticReport', 'DocumentReference', 'Encounter', 'Goal',
  'Immunization', 'Location', 'Medication', 'MedicationRequest', 'Observation',
  'Organization', 'Practitioner', 'PractitionerRole', 'Procedure', 'Provenance'
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

  // Inferno OAuth client state
  const [infernoClient, setInfernoClient] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    client_name: 'Inferno G10 Certification Suite',
    redirect_uris: 'https://inferno.healthit.gov/suites/custom/smart/redirect',
    launch_uri: 'https://inferno.healthit.gov/suites/custom/smart/launch',
    jwks_uri: 'https://inferno.healthit.gov/suites/custom/g10_certification/.well-known/jwks.json',
    scope: 'launch/patient launch openid fhirUser offline_access patient/Medication.rs patient/AllergyIntolerance.rs patient/CarePlan.rs patient/CareTeam.rs patient/Condition.rs patient/Device.rs patient/DiagnosticReport.rs patient/DocumentReference.rs patient/Encounter.rs patient/Goal.rs patient/Immunization.rs patient/Location.rs patient/MedicationRequest.rs patient/Observation.rs patient/Organization.rs patient/Patient.rs patient/Practitioner.rs patient/Procedure.rs patient/Provenance.rs patient/PractitionerRole.rs user/Medication.rs user/AllergyIntolerance.rs user/CarePlan.rs user/CareTeam.rs user/Condition.rs user/Device.rs user/DiagnosticReport.rs user/DocumentReference.rs user/Encounter.rs user/Goal.rs user/Immunization.rs user/Location.rs user/MedicationRequest.rs user/Observation.rs user/Organization.rs user/Patient.rs user/Practitioner.rs user/Procedure.rs user/Provenance.rs user/PractitionerRole.rs system/*.*'
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
      received_scopes: 'launch/patient patient/Medication.rs patient/AllergyIntolerance.rs patient/CarePlan.rs patient/CareTeam.rs patient/Condition.rs patient/Device.rs patient/DiagnosticReport.rs patient/DocumentReference.rs patient/Encounter.rs patient/Goal.rs patient/Immunization.rs patient/Location.rs patient/MedicationRequest.rs patient/Observation.rs patient/Organization.rs patient/Patient.rs patient/Practitioner.rs patient/Procedure.rs patient/Provenance.rs patient/PractitionerRole.rs'
    },
    // Tab 2: PHR Limited Access App
    phr_limited_access: {
      patient_id: '',
      received_scopes: 'launch/patient patient/Observation.rs'
    },
    // Tab 3: EHR Practitioner Access App
    ehr_practitioner: {
      patient_id: '',
      received_scopes: 'launch openid fhirUser user/Medication.rs user/AllergyIntolerance.rs user/CarePlan.rs user/CareTeam.rs user/Condition.rs user/Device.rs user/DiagnosticReport.rs user/DocumentReference.rs user/Encounter.rs user/Goal.rs user/Immunization.rs user/Location.rs user/MedicationRequest.rs user/Observation.rs user/Organization.rs user/Patient.rs user/Practitioner.rs user/Procedure.rs user/Provenance.rs user/PractitionerRole.rs'
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
      group_id: ''
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

  // Track reactive data from collections
  const {
    currentUser,
    isAuthenticated
  } = useTracker(() => {
    return {
      currentUser: Meteor.user(),
      isAuthenticated: Meteor.userId() !== null
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

        console.log('Loaded saved configuration from localStorage');
      }
    } catch (error) {
      console.error('Error loading saved configuration:', error);
    }

    return () => {
      console.log('G10CertificationPage.unmounted');
    };
  }, []);

  // Auto-save configuration to localStorage whenever testConfig changes
  useEffect(() => {
    try {
      const toSave = {
        testConfig,
        configJson,
        infernoClient,
        serverConfig,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('infernoG10Config', JSON.stringify(toSave));
      console.log('Auto-saved configuration to localStorage');
    } catch (error) {
      console.error('Error auto-saving configuration:', error);
    }
  }, [testConfig, configJson, serverConfig]);

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

  function handleClearAllData() {
    if (confirm('Are you sure you want to clear all configuration data? This cannot be undone.')) {
      // Clear state
      setInfernoClient(null);
      setTestConfig({
        phr_full_access: {
          patient_id: '',
          received_scopes: 'launch/patient patient/Medication.rs patient/AllergyIntolerance.rs patient/CarePlan.rs patient/CareTeam.rs patient/Condition.rs patient/Device.rs patient/DiagnosticReport.rs patient/DocumentReference.rs patient/Encounter.rs patient/Goal.rs patient/Immunization.rs patient/Location.rs patient/MedicationRequest.rs patient/Observation.rs patient/Organization.rs patient/Patient.rs patient/Practitioner.rs patient/Procedure.rs patient/Provenance.rs patient/PractitionerRole.rs'
        },
        phr_limited_access: {
          patient_id: '',
          received_scopes: 'launch/patient patient/Observation.rs'
        },
        ehr_practitioner: {
          patient_id: '',
          received_scopes: 'launch openid fhirUser user/Medication.rs user/AllergyIntolerance.rs user/CarePlan.rs user/CareTeam.rs user/Condition.rs user/Device.rs user/DiagnosticReport.rs user/DocumentReference.rs user/Encounter.rs user/Goal.rs user/Immunization.rs user/Location.rs user/MedicationRequest.rs user/Observation.rs user/Organization.rs user/Patient.rs user/Practitioner.rs user/Procedure.rs user/Provenance.rs user/PractitionerRole.rs'
        },
        patient_chart: {
          patient_id: '',
          received_scopes: 'launch/patient patient/*.rs'
        },
        bulk_data: {
          bulk_server_url: '',
          backend_services_token_endpoint: '',
          bulk_timeout: '600',
          group_id: ''
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
    const baseUrl = serverConfig.url || get(Meteor, 'settings.public.smartOnFhir.fhirServiceUrl', window.location.origin + '/baseR4');
    const clientId = get(infernoClient, 'client_id', '');
    const clientSecret = Session.get('infernoClientSecret') || '';

    // Build Inferno preset configuration array matching their format
    const exportConfig = [
      // FHIR Endpoint URL
      {
        name: "url",
        title: "FHIR Endpoint",
        description: "URL of the FHIR endpoint used by SMART applications",
        type: "text",
        value: baseUrl
      },

      // Standalone Patient Launch (Full Access) - Tab 1
      {
        name: "standalone_smart_auth_info",
        title: "Standalone Launch Credentials",
        type: "auth_info",
        options: {
          mode: "auth",
          components: [
            { name: "auth_type", default: "symmetric", locked: true },
            { name: "auth_request_method", default: "GET", locked: true },
            { name: "use_discovery", locked: true },
            { name: "requested_scopes", default: testConfig.phr_full_access.received_scopes },
            { name: "pkce_support", default: "enabled", locked: true },
            { name: "pkce_code_challenge_method", default: "S256", locked: true },
            { name: "jwks", locked: true }
          ]
        },
        value: {
          pkce_support: "enabled",
          pkce_code_challenge_method: "S256",
          auth_request_method: "GET",
          auth_type: "symmetric",
          use_discovery: "true",
          auth_url: serverConfig.authorization_endpoint,
          token_url: serverConfig.token_endpoint,
          requested_scopes: testConfig.phr_full_access.received_scopes,
          client_id: clientId,
          client_secret: clientSecret
        },
        default: {}
      },

      // Expected Resources for Limited Access - Tab 2
      {
        name: "expected_resources",
        title: "Expected Resource Grant for Limited Access Launch",
        description: "the user will only grant access to the following resources during authorization.",
        type: "text",
        default: "patient, condition, observation",
        value: "patient, condition, observation"
      },

      // EHR Practitioner Launch - Tab 3
      {
        name: "ehr_smart_auth_info",
        title: "EHR Launch Credentials",
        type: "auth_info",
        options: {
          mode: "auth",
          components: [
            { name: "auth_type", default: "symmetric", locked: true },
            { name: "use_discovery", locked: true },
            { name: "requested_scopes", default: testConfig.ehr_practitioner.received_scopes },
            { name: "auth_request_method", default: "POST", locked: true },
            { name: "pkce_support", default: "enabled", locked: true },
            { name: "pkce_code_challenge_method", default: "S256", locked: true }
          ]
        },
        value: {
          pkce_support: "enabled",
          pkce_code_challenge_method: "S256",
          auth_request_method: "POST",
          auth_type: "symmetric",
          use_discovery: "true",
          requested_scopes: testConfig.ehr_practitioner.received_scopes,
          client_id: clientId,
          client_secret: clientSecret
        },
        default: {}
      }
    ];

    // Add optional fields only if they have values
    if (testConfig.bulk_data.bulk_server_url || baseUrl) {
      exportConfig.push({
        name: "bulk_server_url",
        title: "Bulk Data FHIR URL",
        description: "The URL of the Bulk FHIR server.",
        type: "text",
        value: testConfig.bulk_data.bulk_server_url || baseUrl
      });
    }

    if (testConfig.bulk_data.group_id) {
      exportConfig.push({
        name: "group_id",
        title: "Group ID",
        description: "The Group ID associated with the group of patients to be exported.",
        type: "text",
        value: testConfig.bulk_data.group_id
      });
    }

    exportConfig.push({
      name: "bulk_timeout",
      title: "Export Times Out after (1-600)",
      description: "While testing, Inferno waits for the server to complete the exporting task.",
      type: "text",
      default: 180,
      value: testConfig.bulk_data.bulk_timeout || "180"
    });

    // Visual inspection attestations
    if (testConfig.visual_inspection) {
      const vi = testConfig.visual_inspection;

      if (vi.token_revocation_attestation) {
        exportConfig.push({
          name: "token_revocation_attestation",
          title: "The Health IT developer demonstrated a patient's request for revoking the tokens provided during the patient standalone launch within the last hour",
          type: "radio",
          options: {
            list_options: [
              { label: "Yes", value: "true" },
              { label: "No", value: "false" }
            ]
          },
          default: "false",
          value: vi.token_revocation_attestation
        });
      }

      if (vi.token_revocation_notes) {
        exportConfig.push({
          name: "token_revocation_notes",
          title: "Notes, if applicable:",
          type: "textarea",
          optional: true,
          value: vi.token_revocation_notes
        });
      }

      if (vi.single_patient_registration_supported) {
        exportConfig.push({
          name: "single_patient_registration_supported",
          title: "Health IT Module demonstrated support for application registration for single patients.",
          type: "radio",
          options: {
            list_options: [
              { label: "Yes", value: "true" },
              { label: "No", value: "false" }
            ]
          },
          default: "false",
          value: vi.single_patient_registration_supported
        });
      }

      if (vi.resource_authorization_gui_supported) {
        exportConfig.push({
          name: "resource_authorization_gui_supported",
          title: "Health IT Module demonstrated a graphical user interface for user to authorize FHIR resources.",
          type: "radio",
          options: {
            list_options: [
              { label: "Yes", value: "true" },
              { label: "No", value: "false" }
            ]
          },
          default: "false",
          value: vi.resource_authorization_gui_supported
        });
      }
    }

    const jsonString = JSON.stringify(exportConfig, null, 2);
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

              <Box sx={{ mt: 3 }}>
                <Typography variant="body1" fontWeight="bold" gutterBottom>
                  Health IT Module demonstrated support for application registration for single patients.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yes / No - Notes, if applicable:
                </Typography>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="body1" fontWeight="bold" gutterBottom>
                  Health IT Module demonstrated support for application registration for multiple patients.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yes / No - Notes, if applicable:
                </Typography>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="body1" fontWeight="bold" gutterBottom>
                  Health IT Module demonstrated a graphical user interface for user to authorize FHIR resources.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yes / No - Notes, if applicable:
                </Typography>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="body1" fontWeight="bold" gutterBottom>
                  Health IT Module informed patient when "offline_access" scope is being granted during authorization.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yes / No - Notes, if applicable:
                </Typography>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="body1" fontWeight="bold" gutterBottom>
                  Health IT Module attested that it is capable of issuing refresh tokens that are valid for a period of no shorter than three months.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yes / No - Notes, if applicable:
                </Typography>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="body1" fontWeight="bold" gutterBottom>
                  Tester verifies that all information is accurate and without omission.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yes / No - Notes, if applicable:
                </Typography>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="body1" fontWeight="bold" gutterBottom>
                  Information returned no greater than scopes pre-authorized for multi-patient queries.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yes / No - Notes, if applicable:
                </Typography>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="body1" fontWeight="bold" gutterBottom>
                  Health IT developer demonstrated the documentation is available at a publicly accessible URL.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yes / No - Notes, if applicable:
                </Typography>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="body1" fontWeight="bold" gutterBottom>
                  Health IT developer confirms the Health IT Module does not cache the JWK Set received via a TLS-protected URL for longer than the cache-control header indicates.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yes / No - Notes, if applicable:
                </Typography>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="body1" fontWeight="bold" gutterBottom>
                  Health IT developer demonstrates support for issuing refresh tokens to native applications.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yes / No - Notes, if applicable:
                </Typography>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="body1" fontWeight="bold" gutterBottom>
                  Health IT developer demonstrates the public location of its certified API technology service base URLs
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yes / No - Notes, if applicable:
                </Typography>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  TLS Issues
                </Typography>
                <Typography variant="body1" fontWeight="bold" gutterBottom>
                  Health IT developers must document how the Health IT Module enforces TLS version 1.2 or above.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yes / No - Document how TLS version 1.2 or above is enforced, if required:
                </Typography>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="body1" fontWeight="bold" gutterBottom>
                  Health IT developer attested that the Health IT Module is capable of issuing refresh tokens valid for a new period of no shorter than three months without requiring re-authentication and re-authorization when a valid refresh token is supplied by the application.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yes / No - Notes, if applicable:
                </Typography>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="body1" fontWeight="bold" gutterBottom>
                  Health IT developer attested that the Health IT Module meets the requirements for supporting the `_since` parameter for bulk data exports.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yes / No - Notes, if applicable:
                </Typography>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="body1" fontWeight="bold" gutterBottom>
                  Health IT developer attested that the Health IT Module supports granting a sub resource scope for Clinical Test Observations.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yes / No - Notes, if applicable:
                </Typography>
              </Box>
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
