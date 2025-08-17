import React from 'react';

import "ace-builds";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-monokai";

import { 
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardHeader,
  CardContent,
  CardMedia,
  Container,
  Grid,  
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Image,
  Typography,
  Alert,
  Box,
  Paper,
  Stack,
  Collapse,
  IconButton,
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Divider,
  Checkbox,
  FormGroup,
  Snackbar
} from '@mui/material';

import { get } from 'lodash';
import { useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';

// import { Icon } from 'react-icons-kit';
// import {lightbulbO} from 'react-icons-kit/fa/lightbulbO'
// import {puzzlePiece} from 'react-icons-kit/fa/puzzlePiece'
// import {amazon} from 'react-icons-kit/fa/amazon'
// import {database} from 'react-icons-kit/fa/database'
// import {speech_bubbles} from 'react-icons-kit/ikons/speech_bubbles'
// import {font} from 'react-icons-kit/fa/font'
// import {barcode} from 'react-icons-kit/fa/barcode'
// import {location} from 'react-icons-kit/icomoon/location'
// import {chain} from 'react-icons-kit/fa/chain'
// import {dashboard} from 'react-icons-kit/fa/dashboard'
// import {hospitalO} from 'react-icons-kit/fa/hospitalO'
// import {codeFork} from 'react-icons-kit/fa/codeFork'
// import {cubes} from 'react-icons-kit/fa/cubes'
// import {universalAccess} from 'react-icons-kit/fa/universalAccess'
// import {mobileCombo} from 'react-icons-kit/entypo/mobileCombo'
// import {fire} from 'react-icons-kit/icomoon/fire'


import {
  LightbulbOutlined,         // for lightbulbO
  Extension,                 // for puzzlePiece
  ShoppingCart,             // closest for amazon (MUI doesn't have brand icons)
  Storage,                  // for database
  Chat,                     // for speech_bubbles
  TextFields,               // for font
  QrCode,                   // for barcode
  LocationOn,               // for location
  Link,                     // for chain
  Dashboard,                // for dashboard
  LocalHospital,            // for hospitalO
  AccountTree,              // for codeFork
  Apps,                     // for cubes
  Accessibility,            // for universalAccess
  PhoneIphone,             // for mobileCombo
  LocalFireDepartment,       // for fire
  QrCodeRounded,
  PersonAdd,                // for register
  ListAlt,                  // for site index
  Security,                 // for security
  CheckCircle,              // for completed items
  Warning,                  // for incomplete items
  Settings,                 // for settings
  Palette,                  // for theme
  AccountCircle,            // for user registration
  ViewModule,               // for workflow modules
  CloudUpload,              // for deployment
  MenuBook,                 // for documentation/manual
  ExpandMore,               // for expand/collapse
  ExpandLess,               // for expand/collapse
  Launch,                   // for external links
  Tune,                     // for app configuration
  Api,                      // for server APIs
  Computer,                 // for interfaces
  Dns,                      // for server configuration
  Download,                 // for download settings
  Business,                 // for business pages
  Article,                  // for legal/content pages
  Palette as PaletteIcon    // for color picker buttons
} from '@mui/icons-material';

import InputAdornment from '@mui/material/InputAdornment';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Wheel from '@uiw/react-color-wheel';
import ShadeSlider from '@uiw/react-color-shade-slider';
import { hsvaToHex } from '@uiw/color-convert';

import { styled } from '@mui/material/styles';
const BootstrapButton = styled(Button)({
  boxShadow: 'none',
  textTransform: 'none',
  fontSize: 16,
  padding: '6px 12px',
  border: '1px solid',
});
const InvisibleCard = styled(Card)({
  boxShadow: 'none',
  border: '0px'
});

//----------------------------------------------------------------------
// Helper Components

let DynamicSpacer;
let useTheme;
Meteor.startup(function(){
  DynamicSpacer = Meteor.DynamicSpacer;
  useTheme = Meteor.useTheme;
})



function GettingStartedPage(props){
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  // Track if accounts are enabled
  const accountsEnabled = useTracker(() => {
    return get(Meteor, 'settings.public.modules.accounts.enabled', true);
  });

  // State for collapsible sections
  const [manualExpanded, setManualExpanded] = React.useState(false);
  const [appConfigExpanded, setAppConfigExpanded] = React.useState(false);
  const [themeExpanded, setThemeExpanded] = React.useState(false);
  const [modulesExpanded, setModulesExpanded] = React.useState(false);
  const [settingsFileExpanded, setSettingsFileExpanded] = React.useState(false);
  const [serverApisExpanded, setServerApisExpanded] = React.useState(false);
  const [interfacesExpanded, setInterfacesExpanded] = React.useState(false);
  const [serverConfigExpanded, setServerConfigExpanded] = React.useState(false);
  const [businessPagesExpanded, setBusinessPagesExpanded] = React.useState(false);
  const [sidebarConfigExpanded, setSidebarConfigExpanded] = React.useState(false);
  const [registerExpanded, setRegisterExpanded] = React.useState(false);
  const [upstreamTetherExpanded, setUpstreamTetherExpanded] = React.useState(false);
  const [environmentVarsExpanded, setEnvironmentVarsExpanded] = React.useState(false);
  
  // State for color picker
  const [colorPickerOpen, setColorPickerOpen] = React.useState(false);
  const [colorPickerField, setColorPickerField] = React.useState('');
  const [tempColor, setTempColor] = React.useState({ h: 214, s: 43, v: 90, a: 1 });
  
  // State for success message
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);
  
  // State for shell commands
  const [shellCommand, setShellCommand] = React.useState('meteor run');
  const [moduleCommand, setModuleCommand] = React.useState('meteor add');
  
  // State for download filename
  const [downloadFilename, setDownloadFilename] = React.useState('settings.honeycomb.json');
  
  // State for settings (initialized from Meteor.settings)
  const [settings, setSettings] = React.useState(() => {
    const initialSettings = JSON.parse(JSON.stringify(get(Meteor, 'settings', {})));
    // Ensure private.fhir.rest structure exists
    if (!initialSettings.private) initialSettings.private = {};
    if (!initialSettings.private.fhir) initialSettings.private.fhir = {};
    if (!initialSettings.private.fhir.rest) initialSettings.private.fhir.rest = {};
    
    // Ensure public.defaults.sidebar.menuItems structure exists with HomePage default
    if (!initialSettings.public) initialSettings.public = {};
    if (!initialSettings.public.defaults) initialSettings.public.defaults = {};
    if (!initialSettings.public.defaults.sidebar) initialSettings.public.defaults.sidebar = {};
    if (!initialSettings.public.defaults.sidebar.menuItems) {
      initialSettings.public.defaults.sidebar.menuItems = {};
    }
    // Always ensure HomePage is true by default if not explicitly set
    if (initialSettings.public.defaults.sidebar.menuItems.HomePage === undefined) {
      initialSettings.public.defaults.sidebar.menuItems.HomePage = true;
    }
    
    return initialSettings;
  });
  
  // Package mapping for modules
  const modulePackageMap = {
    // Extended Modules
    'ChecklistManifesto': 'clinical:checklist-manifesto',
    'DataImporter': 'clinical:data-importer',
    'DataExporter': 'clinical:data-exporter',
    'HipaaCompliance': 'clinical:hipaa-compliance',
    'NursingHome': 'clinical:nursing-home',
    'ProviderDirectory': 'clinical:provider-directory',
    'PhrAnalyzer': 'clinical:phr-analyzer',
    'StructuredDataCapture': 'clinical:structured-data-capture',
    'Synthea': 'clinical:synthea'
  };
  
  // Helper function to build shell command with environment variables
  const buildShellCommand = (currentSettings, currentShellCommand = null) => {
    const envVars = [];
    const envSettings = get(currentSettings, 'private.env', {});
    
    // Add defined environment variables
    Object.keys(envSettings).forEach(key => {
      const value = envSettings[key];
      // Only include truthy values and non-default values
      if (value && value !== '' && value !== 'false' && value !== 'No Value') {
        // Skip temp variables and non-standard env vars
        if (!key.startsWith('temp.')) {
          // For boolean flags, only include if true
          if (key.startsWith('ENABLE_') || key === 'NOAUTH' || key === 'DEV_AUTO_LOGIN' || 
              key === 'INITIALIZE_CONSENT_ENGINE' || key === 'PROXY_RELAY_ENABLED' || 
              key === 'FORCE_SSL' || key.endsWith('_TEST') || key === 'TEST_RUN' || 
              key === 'USE_MONGO_OBJECTID') {
            if (value === 'true' || value === 'Enabled') {
              envVars.push(`${key}=true`);
            }
          } else {
            // For non-boolean values, include as-is
            envVars.push(`${key}=${value}`);
          }
        }
      }
    });
    
    // Build meteor command parts
    let meteorCommand = 'meteor run';
    
    // Check for settings file
    const cmdToCheck = currentShellCommand || shellCommand;
    const settingsMatch = cmdToCheck.match(/--settings\s+(\S+)/);
    if (settingsMatch) {
      meteorCommand += ` --settings ${settingsMatch[1]}`;
    }
    
    // Check for extra packages
    const enabledPackages = [];
    Object.keys(modulePackageMap).forEach(moduleName => {
      if (get(currentSettings, `public.modules.${moduleName}`, false)) {
        enabledPackages.push(modulePackageMap[moduleName]);
      }
    });
    
    if (enabledPackages.length > 0) {
      meteorCommand += ` --extra-packages "${enabledPackages.join(', ')}"`;
    }
    
    // Combine env vars with meteor command
    if (envVars.length > 0) {
      return envVars.join(' ') + ' ' + meteorCommand;
    } else {
      return meteorCommand;
    }
  };
  
  // Helper function to update the module command based on selected modules
  const updateModuleCommand = (currentSettings, preserveCommand = true) => {
    const enabledPackages = [];
    
    // Check each module in the package map
    Object.keys(modulePackageMap).forEach(moduleName => {
      if (get(currentSettings, `public.modules.${moduleName}`, false)) {
        enabledPackages.push(modulePackageMap[moduleName]);
      }
    });
    
    // Update module add command
    if (enabledPackages.length > 0) {
      setModuleCommand(`meteor add ${enabledPackages.join(' ')}`);
    } else {
      setModuleCommand('meteor add');
    }
    
    // Update shell command with env vars
    if (preserveCommand) {
      setShellCommand(buildShellCommand(currentSettings));
    }
  };
  
  // Helper function to update capability statement based on enabled FHIR resources
  const updateCapabilityStatement = (currentSettings) => {
    const enabledResourceTypes = [];
    
    // List of all FHIR resources to check
    const fhirResources = [
      'AllergyIntolerance', 'CarePlan', 'CareTeam', 'Condition', 'Consent',
      'Communication', 'Composition', 'DocumentReference', 'Encounter', 'Goal', 
      'Immunization', 'List', 'Location', 'Medication', 'MedicationRequest', 
      'MedicationStatement', 'NutritionOrder', 'Observation', 'Organization', 
      'Patient', 'Practitioner', 'Procedure', 'Questionnaire', 
      'QuestionnaireResponse', 'ResearchStudy', 'ResearchSubject', 'ServiceRequest'
    ];
    
    // Check each resource to see if it has any enabled capabilities
    fhirResources.forEach(resource => {
      const resourceConfig = get(currentSettings, `private.fhir.rest.${resource}`, {});
      const hasInteractions = get(resourceConfig, 'interactions', []).length > 0;
      const hasSearch = get(resourceConfig, 'search', false);
      const hasPublication = get(resourceConfig, 'publication', false);
      
      // If the resource has any capability enabled, add it to the capability statement
      if (hasInteractions || hasSearch || hasPublication) {
        enabledResourceTypes.push(resource);
      }
    });
    
    // Update the capability statement resource types
    if (!currentSettings.public) currentSettings.public = {};
    if (!currentSettings.public.capabilityStatement) {
      currentSettings.public.capabilityStatement = {};
    }
    currentSettings.public.capabilityStatement.resourceTypes = enabledResourceTypes;
    
    // Also update Meteor.settings
    if (!Meteor.settings.public) Meteor.settings.public = {};
    if (!Meteor.settings.public.capabilityStatement) {
      Meteor.settings.public.capabilityStatement = {};
    }
    Meteor.settings.public.capabilityStatement.resourceTypes = enabledResourceTypes;
  };
  
  // Update module command on initial load
  React.useEffect(() => {
    updateModuleCommand(settings);
    updateCapabilityStatement(settings);
  }, []); // Run once on mount
  
  // Check completion status for configuration sections
  // App config is complete when title is set (fhirVersion and loggingThreshold have defaults)
  const hasAppConfig = !!(get(settings, 'public.title') || get(Meteor, 'settings.public.title'));
                      
  const hasModulesConfig = get(Meteor, 'settings.public.modules.fhir') || 
                          get(Meteor, 'settings.public.modules.PatientDirectory');
                          
  const hasServerApisConfig = get(Meteor, 'settings.private.fhir.fhirPath') || 
                             get(Meteor, 'settings.private.fhir.rest') ||
                             get(settings, 'private.fhir.fhirPath') ||
                             get(settings, 'private.fhir.rest');
                             
  const hasInterfacesConfig = get(Meteor, 'settings.public.interfaces.default.channel.endpoint') ||
                             get(Meteor, 'settings.public.interfaces.upstream.channel.endpoint') ||
                             get(Meteor, 'settings.public.interfaces.downstream.channel.endpoint') ||
                             get(settings, 'public.interfaces.upstream.channel.endpoint') ||
                             get(settings, 'public.interfaces.downstream.channel.endpoint');

  // Helper function to update nested settings
  const updateSetting = (path, value) => {
    const newSettings = JSON.parse(JSON.stringify(settings));
    const pathParts = path.split('.');
    let current = newSettings;
    
    // Special handling for businessPages.*.enabled
    if (path.match(/^public\.businessPages\.\w+\.enabled$/) && value === false) {
      // Extract the page name (privacy, terms, etc.)
      const pageName = pathParts[2];
      
      // Ensure the path exists up to businessPages
      if (!newSettings.public) newSettings.public = {};
      if (!newSettings.public.businessPages) newSettings.public.businessPages = {};
      
      // Remove the entire page object when disabled
      delete newSettings.public.businessPages[pageName];
      
      // If businessPages is now empty, remove it too
      if (Object.keys(newSettings.public.businessPages).length === 0) {
        delete newSettings.public.businessPages;
      }
    } else {
      // Normal update path
      // Ensure all nested paths exist
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }
      
      current[pathParts[pathParts.length - 1]] = value;
    }
    
    setSettings(newSettings);
    
    // Update Meteor.settings as well (for client-side settings only)
    if (path.startsWith('public.')) {
      const meteorPath = path.substring(7); // Remove 'public.' prefix
      const meteorPathParts = meteorPath.split('.');
      let meteorCurrent = Meteor.settings.public;
      
      for (let i = 0; i < meteorPathParts.length - 1; i++) {
        if (!meteorCurrent[meteorPathParts[i]]) {
          meteorCurrent[meteorPathParts[i]] = {};
        }
        meteorCurrent = meteorCurrent[meteorPathParts[i]];
      }
      
      meteorCurrent[meteorPathParts[meteorPathParts.length - 1]] = value;
    }
    
    // Update module command if a module was toggled
    if (path.startsWith('public.modules.')) {
      updateModuleCommand(newSettings);
    }
    
    // Update capability statement when FHIR resources are toggled
    if (path.startsWith('private.fhir.rest.')) {
      updateCapabilityStatement(newSettings);
    }
    
    // Update shell command when environment variables change
    if (path.startsWith('private.env.')) {
      setShellCommand(buildShellCommand(newSettings));
    }
    
    // Special handling for Patient Portal
    if (path === 'public.modules.PatientPortal' && value === true) {
      // Enable Patient Chart
      if (!newSettings.public.modules) {
        newSettings.public.modules = {};
      }
      newSettings.public.modules.PatientChart = true;
      
      // Also update Meteor.settings
      if (!Meteor.settings.public.modules) {
        Meteor.settings.public.modules = {};
      }
      Meteor.settings.public.modules.PatientChart = true;
      
      // Update the settings state
      setSettings({...newSettings});
    }
    
    // Special handling for Personal Health Record
    if (path === 'public.modules.PersonalHealthRecord' && value === true) {
      // Enable Patient Chart
      if (!newSettings.public.modules) {
        newSettings.public.modules = {};
      }
      newSettings.public.modules.PatientChart = true;
      
      // Also update Meteor.settings
      if (!Meteor.settings.public.modules) {
        Meteor.settings.public.modules = {};
      }
      Meteor.settings.public.modules.PatientChart = true;
      
      // List of FHIR resources to enable (all except the specified ones)
      const fhirResourcesToEnable = [
        'AllergyIntolerances',
        'CarePlans',
        'Conditions',
        'Consents',
        'Devices',
        'DiagnosticReports',
        'DocumentReferences',
        'Encounters',
        'ImagingStudies',
        'Immunizations',
        'Locations',
        'Medias',
        'MedicationAdministrations',
        'MedicationRequests',
        'Medications',
        'NutritionOrders',
        'Observations',
        'Organizations',
        'Patients',
        'Practitioners',
        'Procedures',
        'QuestionnaireResponses',
        'Questionnaires'
        // Excluding: Appointments, ResearchStudies, ResearchSubjects, Schedules, ServiceRequests, SupplyDeliveries
      ];
      
      // Enable all the specified FHIR resources
      fhirResourcesToEnable.forEach(resource => {
        if (!newSettings.public.modules.fhir) {
          newSettings.public.modules.fhir = {};
        }
        newSettings.public.modules.fhir[resource] = true;
        
        // Also update Meteor.settings
        if (!Meteor.settings.public.modules.fhir) {
          if (!Meteor.settings.public.modules) {
            Meteor.settings.public.modules = {};
          }
          Meteor.settings.public.modules.fhir = {};
        }
        Meteor.settings.public.modules.fhir[resource] = true;
      });
      
      // Update the settings state with all changes
      setSettings({...newSettings});
    }
    
    // Special handling for HIPAA Compliance
    if (path === 'public.modules.HipaaCompliance' && value === true) {
      // Enable AuditEvents when HIPAA Compliance is enabled
      if (!newSettings.public.modules.fhir) {
        newSettings.public.modules.fhir = {};
      }
      newSettings.public.modules.fhir.AuditEvents = true;
      
      // Also update Meteor.settings
      if (!Meteor.settings.public.modules.fhir) {
        if (!Meteor.settings.public.modules) {
          Meteor.settings.public.modules = {};
        }
        Meteor.settings.public.modules.fhir = {};
      }
      Meteor.settings.public.modules.fhir.AuditEvents = true;
      
      // Update the settings state
      setSettings({...newSettings});
    }
    
    // Special handling for Application Router
    if (path === 'public.modules.ApplicationRouter' && value === true) {
      // Set Network Topology to Relay when Application Router is enabled
      if (!newSettings.public.interfaces) {
        newSettings.public.interfaces = {};
      }
      newSettings.public.interfaces.networkTopology = 'relay';
      
      // Enable Data Importer and Data Exporter
      if (!newSettings.public.modules) {
        newSettings.public.modules = {};
      }
      newSettings.public.modules.DataImporter = true;
      newSettings.public.modules.DataExporter = true;
      
      // Also update Meteor.settings
      if (!Meteor.settings.public.interfaces) {
        Meteor.settings.public.interfaces = {};
      }
      Meteor.settings.public.interfaces.networkTopology = 'relay';
      
      if (!Meteor.settings.public.modules) {
        Meteor.settings.public.modules = {};
      }
      Meteor.settings.public.modules.DataImporter = true;
      Meteor.settings.public.modules.DataExporter = true;
      
      // Update the settings state
      setSettings({...newSettings});
      
      // Update module command since we're enabling extended modules
      updateModuleCommand(newSettings);
    }
    
    // Special handling for Medical Home
    if (path === 'public.modules.MedicalHome' && value === true) {
      // Enable NursingHome extended module, Patient Directory and Patient Chart
      if (!newSettings.public.modules) {
        newSettings.public.modules = {};
      }
      newSettings.public.modules.NursingHome = true;
      newSettings.public.modules.PatientDirectory = true;
      newSettings.public.modules.PatientChart = true;
      
      // Also update Meteor.settings
      if (!Meteor.settings.public.modules) {
        Meteor.settings.public.modules = {};
      }
      Meteor.settings.public.modules.NursingHome = true;
      Meteor.settings.public.modules.PatientDirectory = true;
      Meteor.settings.public.modules.PatientChart = true;
      
      // Update the settings state
      setSettings({...newSettings});
      
      // Update module command since we're enabling extended modules
      updateModuleCommand(newSettings);
    }
    
    // Special handling for Nursing Home business model
    if (path === 'public.modules.NursingHomeModel' && value === true) {
      // Enable NursingHome extended module, HIPAA Compliance, Checklist Manifesto, Patient Directory and Patient Chart
      if (!newSettings.public.modules) {
        newSettings.public.modules = {};
      }
      newSettings.public.modules.NursingHome = true;
      newSettings.public.modules.HipaaCompliance = true;
      newSettings.public.modules.ChecklistManifesto = true;
      newSettings.public.modules.PatientDirectory = true;
      newSettings.public.modules.PatientChart = true;
      
      // Also enable AuditEvents for HIPAA Compliance
      if (!newSettings.public.modules.fhir) {
        newSettings.public.modules.fhir = {};
      }
      newSettings.public.modules.fhir.AuditEvents = true;
      
      // Also update Meteor.settings
      if (!Meteor.settings.public.modules) {
        Meteor.settings.public.modules = {};
      }
      Meteor.settings.public.modules.NursingHome = true;
      Meteor.settings.public.modules.HipaaCompliance = true;
      Meteor.settings.public.modules.ChecklistManifesto = true;
      Meteor.settings.public.modules.PatientDirectory = true;
      Meteor.settings.public.modules.PatientChart = true;
      
      if (!Meteor.settings.public.modules.fhir) {
        Meteor.settings.public.modules.fhir = {};
      }
      Meteor.settings.public.modules.fhir.AuditEvents = true;
      
      // Update the settings state
      setSettings({...newSettings});
      
      // Update module command since we're enabling extended modules
      updateModuleCommand(newSettings);
    }
    
    // Special handling for network topology changes
    if (path === 'public.interfaces.networkTopology') {
      const topology = value;
      
      // Clean up interfaces based on topology
      if (topology === 'standalone') {
        // Remove both upstream and downstream interfaces
        if (newSettings.public.interfaces) {
          delete newSettings.public.interfaces.upstream;
          delete newSettings.public.interfaces.downstream;
          
          // Set default to current installation
          const fhirPath = get(newSettings, 'private.fhir.fhirPath', 'baseR4');
          newSettings.public.interfaces.default = {
            status: 'active',
            channel: {
              endpoint: window.location.origin + '/' + fhirPath
            },
            auth: {
              type: 'open'
            }
          };
        }
        if (Meteor.settings.public.interfaces) {
          delete Meteor.settings.public.interfaces.upstream;
          delete Meteor.settings.public.interfaces.downstream;
          
          // Set default to current installation
          const meteorFhirPath = get(Meteor.settings, 'private.fhir.fhirPath', 'baseR4');
          Meteor.settings.public.interfaces.default = {
            status: 'active',
            channel: {
              endpoint: window.location.origin + '/' + meteorFhirPath
            },
            auth: {
              type: 'open'
            }
          };
        }
      } else if (topology === 'dataFetcher') {
        // Data Consumer - remove downstream interface, keep upstream
        if (newSettings.public.interfaces) {
          delete newSettings.public.interfaces.downstream;
          // Copy upstream to default for backward compatibility
          if (newSettings.public.interfaces.upstream) {
            newSettings.public.interfaces.default = JSON.parse(JSON.stringify(newSettings.public.interfaces.upstream));
          }
        }
        if (Meteor.settings.public.interfaces) {
          delete Meteor.settings.public.interfaces.downstream;
          if (Meteor.settings.public.interfaces.upstream) {
            Meteor.settings.public.interfaces.default = JSON.parse(JSON.stringify(Meteor.settings.public.interfaces.upstream));
          }
        }
      } else if (topology === 'dataSource') {
        // Data Producer - remove upstream interface, keep downstream
        if (newSettings.public.interfaces) {
          delete newSettings.public.interfaces.upstream;
          // Copy downstream to default for backward compatibility
          if (newSettings.public.interfaces.downstream) {
            newSettings.public.interfaces.default = JSON.parse(JSON.stringify(newSettings.public.interfaces.downstream));
          }
        }
        if (Meteor.settings.public.interfaces) {
          delete Meteor.settings.public.interfaces.upstream;
          if (Meteor.settings.public.interfaces.downstream) {
            Meteor.settings.public.interfaces.default = JSON.parse(JSON.stringify(Meteor.settings.public.interfaces.downstream));
          }
        }
      } else if (topology === 'relay') {
        // For relay topology, copy upstream to default (prioritize upstream)
        if (newSettings.public.interfaces && newSettings.public.interfaces.upstream) {
          newSettings.public.interfaces.default = JSON.parse(JSON.stringify(newSettings.public.interfaces.upstream));
        }
        if (Meteor.settings.public.interfaces && Meteor.settings.public.interfaces.upstream) {
          Meteor.settings.public.interfaces.default = JSON.parse(JSON.stringify(Meteor.settings.public.interfaces.upstream));
        }
      }
      
      // Update the settings state
      setSettings({...newSettings});
    }
    
    // Special handling for upstream interface changes
    if (path.startsWith('public.interfaces.upstream.')) {
      const topology = get(newSettings, 'public.interfaces.networkTopology', 'standalone');
      // If we're in a topology that uses upstream, update default
      if (topology === 'dataFetcher' || topology === 'relay') {
        if (!newSettings.public.interfaces.default) {
          newSettings.public.interfaces.default = {};
        }
        // Copy the entire upstream interface to default
        newSettings.public.interfaces.default = JSON.parse(JSON.stringify(newSettings.public.interfaces.upstream || {}));
        
        // Also update Meteor.settings
        if (!Meteor.settings.public.interfaces.default) {
          Meteor.settings.public.interfaces.default = {};
        }
        Meteor.settings.public.interfaces.default = JSON.parse(JSON.stringify(newSettings.public.interfaces.upstream || {}));
      }
    }
    
    // Special handling for downstream interface changes
    if (path.startsWith('public.interfaces.downstream.')) {
      const topology = get(newSettings, 'public.interfaces.networkTopology', 'standalone');
      // If we're in a topology that uses downstream and not upstream, update default
      if (topology === 'dataSource') {
        if (!newSettings.public.interfaces.default) {
          newSettings.public.interfaces.default = {};
        }
        // Copy the entire downstream interface to default
        newSettings.public.interfaces.default = JSON.parse(JSON.stringify(newSettings.public.interfaces.downstream || {}));
        
        // Also update Meteor.settings
        if (!Meteor.settings.public.interfaces.default) {
          Meteor.settings.public.interfaces.default = {};
        }
        Meteor.settings.public.interfaces.default = JSON.parse(JSON.stringify(newSettings.public.interfaces.downstream || {}));
      }
    }
    
    // Special handling for Patient Chart
    if (path === 'public.modules.PatientChart') {
      const resourcesToToggle = [
        'AllergyIntolerances',
        'CarePlans',
        'Conditions',
        'Consents',
        'Devices',
        'DiagnosticReports',
        'DocumentReferences',
        'ImagingStudies',
        'Immunizations',
        'Locations',
        'Medias',
        'MedicationAdministrations',
        'MedicationRequests',
        'NutritionOrders',
        'Observations',
        'Organizations',
        'Patients',
        'Practitioners',
        'Procedures',
        'QuestionnaireResponses'
      ];
      
      if (value === true) {
        // Enable specified FHIR resources
        if (!newSettings.public.modules.fhir) {
          newSettings.public.modules.fhir = {};
        }
        resourcesToToggle.forEach(resource => {
          newSettings.public.modules.fhir[resource] = true;
        });
        
        // Also update Meteor.settings
        if (!Meteor.settings.public.modules.fhir) {
          if (!Meteor.settings.public.modules) {
            Meteor.settings.public.modules = {};
          }
          Meteor.settings.public.modules.fhir = {};
        }
        resourcesToToggle.forEach(resource => {
          Meteor.settings.public.modules.fhir[resource] = true;
        });
      } else {
        // Disable specified FHIR resources
        if (newSettings.public.modules.fhir) {
          resourcesToToggle.forEach(resource => {
            newSettings.public.modules.fhir[resource] = false;
          });
        }
        
        // Also update Meteor.settings
        if (Meteor.settings.public.modules && Meteor.settings.public.modules.fhir) {
          resourcesToToggle.forEach(resource => {
            Meteor.settings.public.modules.fhir[resource] = false;
          });
        }
      }
      
      // Update the settings state
      setSettings({...newSettings});
    }
  };

  // Function to download settings as JSON file
  const downloadSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', downloadFilename);
    linkElement.click();
    
    // Update the shell command with the new settings filename
    const newBaseCommand = `meteor run --settings ${downloadFilename}`;
    
    // Rebuild the shell command with environment variables
    setShellCommand(buildShellCommand(settings, newBaseCommand));
  };
  
  // Open color picker for a specific field
  const openColorPicker = (fieldPath, currentValue) => {
    setColorPickerField(fieldPath);
    // Try to parse the current color value
    // For now, we'll just use the default color
    setTempColor({ h: 214, s: 43, v: 90, a: 1 });
    setColorPickerOpen(true);
  };
  
  // Apply the selected color
  const applySelectedColor = () => {
    const hexColor = hsvaToHex(tempColor);
    updateSetting(colorPickerField, hexColor);
    setColorPickerOpen(false);
  };
  
  // Simple color field component
  const ColorField = ({ label, fieldPath, helperText, placeholder }) => {
    const value = get(settings, fieldPath, '');
    return (
      <TextField
        fullWidth
        label={label}
        value={value}
        onChange={(e) => updateSetting(fieldPath, e.target.value)}
        variant="outlined"
        size="small"
        helperText={helperText}
        placeholder={placeholder}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                onClick={() => openColorPicker(fieldPath, value)}
                size="small"
              >
                <PaletteIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    );
  };

  //----------------------------------------------------------------------
  // Page Styling 

  let headerHeight = 64;
  if(get(Meteor, 'settings.public.defaults.prominentHeader')){
    headerHeight = 128;
  }

  let pageStyle = {
    paddingLeft: '100px', 
    paddingRight: '100px',
    position: 'absolute',
    top: '0px'
  }

  //----------------------------------------------------------------------
  // Styling

  let carouselImages = get(Meteor, 'settings.public.projectPage.carouselImages', []);

  let imageItems = [];
  carouselImages.forEach(function(url, index){
    imageItems.push(<img                    
      style={{ width: "100%", height: "100%" }}
      key={"image-" + index}
      src={url}
    />);
  });

  let tagLineStyle = {
    fontWeight: 'normal',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: '0px',
    marginBottom: '40px'
  }

  let featureRowStyle = {
    height: '55px',
    cursor: 'pointer',
  }
  let rowStyle = {
    height: '55px'
  }

  if(Meteor.isCordova){
    pageStyle.width = '100%';
    pageStyle.padding = 20;
    pageStyle.marginLeft = '0px';
    pageStyle.marginRight = '0px';
  }


  let hasTitle = get(settings, 'public.title') || get(Meteor, 'settings.public.title', false);
  let hasTheme = get(settings, 'public.theme') || get(Meteor, 'settings.public.theme', false);
  let hasWorkflowModule = get(settings, 'public.modules.workflow') || get(Meteor, 'settings.public.modules.workflow', false);
  let hasDeployment = get(settings, 'public.deployed') || get(Meteor, 'settings.public.deployed', false);
  
  // Check if there are any registered users
  const hasRegisteredUsers = useTracker(() => {
    return accountsEnabled && Meteor.users && Meteor.users.find().count() > 0;
  });

  // Setup checklist items
  const checklistItems = [
    {
      id: 'appConfig',
      label: 'App Configuration',
      completed: hasAppConfig,
      icon: Tune,
      action: () => setAppConfigExpanded(true)
    },
    {
      id: 'theme',
      label: 'Theme and Color Palette',
      completed: hasTheme,
      icon: Palette,
      action: () => navigate('/theming')
    },
    {
      id: 'settings',
      label: 'Settings File',
      completed: hasTitle,
      icon: Settings,
      action: () => window.open('https://docs.honeycomb.health/configuration', '_blank')
    },
    {
      id: 'register',
      label: 'User Accounts',
      completed: hasRegisteredUsers,
      icon: AccountCircle,
      action: () => navigate('/register'),
      visible: accountsEnabled
    },
    {
      id: 'deploy',
      label: 'Deploy App',
      completed: hasDeployment,
      icon: CloudUpload,
      action: () => window.open('https://docs.honeycomb.health/deployment', '_blank')
    }
  ];

  // Show checklist if any items are incomplete or if we're on the checklist route
  const showChecklist = checklistItems.some(item => !item.completed && item.visible !== false) || 
                       window.location.pathname === '/getting-started-checklist';
  
  let setupChecklistElements;
  if(showChecklist){
    // Build checklist items array
    const checklistItemsArray = [];
    
    // 1. Read The Manual (with collapse)
    checklistItemsArray.push(
      <React.Fragment key="manual-section">
        <Alert 
          severity="info"
          icon={<MenuBook />}
          sx={{ 
            backgroundColor: 'action.hover',
            color: 'text.primary',
            cursor: 'pointer',
            '& .MuiAlert-icon': {
              color: 'text.secondary'
            },
            '&:hover': {
              backgroundColor: 'action.selected'
            }
          }}
          onClick={() => setManualExpanded(!manualExpanded)}
          action={
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setManualExpanded(!manualExpanded);
              }}
            >
              {manualExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          }
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <span>Read The Manual</span>
          </Stack>
        </Alert>
        <Collapse in={manualExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ pl: 2, pr: 2, mt: -1, mb: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Don't say that you couldn't find the documentation or you didn't read the manual.
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{fontWeight: 'bold'}}>Icon</TableCell>
                  <TableCell style={{fontWeight: 'bold', minWidth: '320px'}}>Feature</TableCell>
                  <TableCell style={{fontWeight: 'bold'}}>Vendor</TableCell>
                  <TableCell style={{fontWeight: 'bold'}}>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow style={featureRowStyle} onClick={function(){ window.open("https://www.hl7.org/fhir/", "_blank"); }} hover>
                  <TableCell><LocalFireDepartment /></TableCell>
                  <TableCell>Fast Healthcare Interoperability Resources</TableCell>
                  <TableCell>HL7</TableCell>
                  <TableCell>ANSI Certified Standards. Required by U.S. federal law, pertaining to MACRA and 21st Century Cures and other federal laws. Detailed documentation on data schemas and APIs used in healthcare and mandated by the federal government.</TableCell>
                </TableRow>
                <TableRow style={featureRowStyle} onClick={function(){ window.open("https://docs.smarthealthit.org/client-js/", "_blank"); }} hover>
                  <TableCell><LocalHospital /></TableCell>
                  <TableCell>EHR Interoperability</TableCell>
                  <TableCell>Smart Health IT</TableCell>
                  <TableCell>Uses industry standard libraries for fetching data from Medicare, Medicaid, Apple HealthRecords, and hospitals running a Cerner, Epic, or other FHIR compliant EHR.</TableCell>
                </TableRow>
                <TableRow style={featureRowStyle} onClick={function(){ window.open("https://www.mongodb.com/basics/mongodb-atlas-tutorial", "_blank"); }} hover>
                  <TableCell><Storage /></TableCell>
                  <TableCell>Document Oriented Database</TableCell>
                  <TableCell>Mongo</TableCell>
                  <TableCell>An ultra-scalable JSON database that stores FHIR data as-is in a NoSQL format. Easily convert a server database into an enterprise grade datalake.</TableCell>
                </TableRow>
                <TableRow style={featureRowStyle} onClick={function(){ window.open("https://guide.meteor.com/cordova.html", "_blank"); }} hover>
                  <TableCell><PhoneIphone /></TableCell>
                  <TableCell>Multiple Device Pipelines</TableCell>
                  <TableCell>Meteor.js</TableCell>
                  <TableCell>Write once and run anywhere, using the Apache Cordova/PhoneGap bridging libraries; with pipelines for compiling the software to desktops, mobile devices, and webTV.</TableCell>
                </TableRow>
                <TableRow style={featureRowStyle} onClick={function(){ window.open("https://reactjs.org/", "_blank"); }} hover>
                  <TableCell><Extension /></TableCell>
                  <TableCell>Modular Reusable Components (React.js)</TableCell>
                  <TableCell>Facebook / Meta</TableCell>
                  <TableCell>Built with modular reusable components using React (from Facebook). Proven web technology used by billions of people. Components progressively get better with time rather than become a speghetti mess.</TableCell>
                </TableRow>
                <TableRow style={featureRowStyle} onClick={function(){ window.open("http://web-accessibility.carnegiemuseums.org/foundations/aria/", "_blank"); }} hover>
                  <TableCell><Accessibility /></TableCell>
                  <TableCell>Accessibility</TableCell>
                  <TableCell>Carnegie Museums of Pittsburgh</TableCell>
                  <TableCell>Includes accessibility best practices via Accessible Rich Internet Applications (ARIA) specification. Supports screen readers, low visibility modes, voice prompts, etc.</TableCell>
                </TableRow>
                <TableRow style={featureRowStyle} onClick={function(){ window.open("https://mui.com/", "_blank"); }} hover>
                  <TableCell><Apps /></TableCell>
                  <TableCell>Material Design</TableCell>
                  <TableCell>Google</TableCell>
                  <TableCell>Designed with a modern toolkit of user interface components based on the Material Design specification from Google.</TableCell>
                </TableRow>
                <TableRow style={featureRowStyle} onClick={function(){ window.open("https://react-icons-kit.vercel.app/", "_blank"); }} hover>
                  <TableCell><TextFields /></TableCell>
                  <TableCell>Icons, Fonts, & Typography</TableCell>
                  <TableCell></TableCell>
                  <TableCell>Includes rich typography and fonts and extended icon support to make your applications look beautiful.</TableCell>
                </TableRow>
                <TableRow style={featureRowStyle} onClick={function(){ window.open("", "_blank"); }} hover>
                  <TableCell><AccountTree /></TableCell>
                  <TableCell>A/B Testing Infrastructure</TableCell>
                  <TableCell></TableCell>
                  <TableCell>Built from the ground up around containerization and an application-wide settings, to allow different containers to run the software with different settings. Perfect for A/B testing methodologies.</TableCell>
                </TableRow>
                <TableRow style={featureRowStyle} onClick={function(){ window.open("https://docs.meteor.com/api/email.html", "_blank"); }} hover>
                  <TableCell><Chat /></TableCell>
                  <TableCell>Email, Chat & SMS Integration</TableCell>
                  <TableCell></TableCell>
                  <TableCell>Support inbound and outbound messaging via the FHIR Communication resource and integration with MailChimp, Twilio, and other messaging platforms.</TableCell>
                </TableRow>
                <TableRow style={featureRowStyle} onClick={function(){ window.open("https://github.com/clinical-meteor/hipaa", "_blank"); }} hover>
                  <TableCell><ShoppingCart /></TableCell>
                  <TableCell>HIPAA Logger</TableCell>
                  <TableCell></TableCell>
                  <TableCell>HIPAA compliant using a HIPAA audit log, user accounts, and encrypted data at rest and over the wire.</TableCell>
                </TableRow>
                <TableRow style={rowStyle}>
                  <TableCell><Dashboard /></TableCell>
                  <TableCell>Realtime Dashboards</TableCell>
                  <TableCell></TableCell>
                  <TableCell>Build data rich dashboards using D3 charts from Stanford. Chose Chart.js or Nivo for reusable charts that make creating dashboards a breeze.</TableCell>
                </TableRow>
                <TableRow style={rowStyle}>
                  <TableCell><LocationOn /></TableCell>
                  <TableCell>GPS, Maps, & Location Services</TableCell>
                  <TableCell></TableCell>
                  <TableCell>Support geospatial applications via Google Maps integration.</TableCell>
                </TableRow>
                <TableRow style={rowStyle}>
                  <TableCell><Link /></TableCell>
                  <TableCell>Blockchain Support</TableCell>
                  <TableCell></TableCell>
                  <TableCell>Take advantage of all the blockchain libraries available to the Node/Javascript community, including Hyperledger, Etherium, BigChain, and IPFS.</TableCell>
                </TableRow>
                <TableRow style={rowStyle}>
                  <TableCell><QrCodeRounded /></TableCell>
                  <TableCell>Machine Vision & Learning</TableCell>
                  <TableCell></TableCell>
                  <TableCell>Get fancy and add AI to your project with libraries like Tensorflow. Or keep it simply by adding barcodes and QR codes to let your application read products labels.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Collapse>
      </React.Fragment>
    );
    
    // 2. Initialize Settings File (with collapse)
    const settingsItem = checklistItems.find(item => item.id === 'settings' && item.visible !== false);
    if (settingsItem) {
      checklistItemsArray.push(
        <React.Fragment key="settings-file-section">
          <Alert 
            severity={settingsItem.completed ? "success" : "info"}
            icon={settingsItem.completed ? <CheckCircle /> : <settingsItem.icon />}
            sx={{ 
              backgroundColor: settingsItem.completed ? undefined : 'action.hover',
              color: settingsItem.completed ? undefined : 'text.primary',
              cursor: 'pointer',
              '& .MuiAlert-icon': {
                color: settingsItem.completed ? undefined : 'text.secondary'
              },
              '&:hover': {
                backgroundColor: settingsItem.completed ? undefined : 'action.selected'
              }
            }}
            onClick={() => setSettingsFileExpanded(!settingsFileExpanded)}
            action={
              <IconButton 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setSettingsFileExpanded(!settingsFileExpanded);
                }}
              >
                {settingsFileExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            }
          >
            <span>{settingsItem.label}</span>
          </Alert>
          <Collapse in={settingsFileExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ pl: 2, pr: 2, mt: -1, mb: 0 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, pt: '30px' }}>
                Paste your Meteor settings JSON file here. Only the public settings will be loaded into the configuration.
              </Typography>
              
              <AceEditor
                mode="json"
                theme={theme === 'dark' ? "monokai" : "github"}
                name="settings-editor"
                value={JSON.stringify(settings, null, 2)}
                onChange={(newValue) => {
                  try {
                    const parsedSettings = JSON.parse(newValue);
                    setSettings(parsedSettings);
                    
                    // Update Meteor.settings.public with the new public settings
                    if (parsedSettings.public) {
                      Object.keys(parsedSettings.public).forEach(key => {
                        Meteor.settings.public[key] = parsedSettings.public[key];
                      });
                    }
                  } catch (e) {
                    console.warn('Invalid JSON:', e);
                  }
                }}
                width="100%"
                height="400px"
                fontSize={14}
                showPrintMargin={true}
                showGutter={true}
                highlightActiveLine={true}
                setOptions={{
                  enableBasicAutocompletion: true,
                  enableLiveAutocompletion: true,
                  enableSnippets: false,
                  showLineNumbers: true,
                  tabSize: 2,
                }}
                editorProps={{ $blockScrolling: true }}
              />
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Note: Private settings are shown but cannot be applied to the client environment.
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    size="small"
                    value={downloadFilename}
                    onChange={(e) => setDownloadFilename(e.target.value)}
                    variant="outlined"
                    sx={{ 
                      width: '250px',
                      '& .MuiInputBase-root': {
                        height: '36.5px', // Match button height
                        fontSize: '0.875rem' // Match button font size
                      }
                    }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={downloadSettings}
                    sx={{ textTransform: 'none' }}
                  >
                    Download Settings File
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      // Reset to current Meteor.settings
                      const currentSettings = JSON.parse(JSON.stringify(get(Meteor, 'settings', {})));
                      setSettings(currentSettings);
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    Reset to Current
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Collapse>
        </React.Fragment>
      );
    }
    
    // 3. App Configuration (with collapse)
    const appConfigItem = checklistItems.find(item => item.id === 'appConfig');
    if (appConfigItem) {
      checklistItemsArray.push(
        <React.Fragment key="app-config-section">
          <Alert 
            severity={appConfigItem.completed ? "success" : "info"}
            icon={appConfigItem.completed ? <CheckCircle /> : <appConfigItem.icon />}
            sx={{ 
            backgroundColor: appConfigItem.completed ? undefined : 'action.hover',
            color: appConfigItem.completed ? undefined : 'text.primary',
            cursor: 'pointer',
            '& .MuiAlert-icon': {
              color: appConfigItem.completed ? undefined : 'text.secondary'
            },
            '&:hover': {
              backgroundColor: appConfigItem.completed ? undefined : 'action.selected'
            }
          }}
          onClick={() => setAppConfigExpanded(!appConfigExpanded)}
          action={
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setAppConfigExpanded(!appConfigExpanded);
              }}
            >
              {appConfigExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          }
        >
          <span>{appConfigItem.label}</span>
        </Alert>
        <Collapse in={appConfigExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ pl: 2, pr: 2, mt: -1, mb: 0 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="App Title"
                  value={get(settings, 'public.title', '')}
                  onChange={(e) => updateSetting('public.title', e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>FHIR Version</InputLabel>
                  <Select
                    value={get(settings, 'public.fhirVersion', 'R4')}
                    onChange={(e) => updateSetting('public.fhirVersion', e.target.value)}
                    label="FHIR Version"
                  >
                    <MenuItem value="R4">R4</MenuItem>
                    <MenuItem value="STU3">STU3</MenuItem>
                    <MenuItem value="DSTU2">DSTU2</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Logging Level</InputLabel>
                  <Select
                    value={get(settings, 'public.loggingThreshold', 'info')}
                    onChange={(e) => updateSetting('public.loggingThreshold', e.target.value)}
                    label="Logging Level"
                  >
                    <MenuItem value="trace">Trace</MenuItem>
                    <MenuItem value="debug">Debug</MenuItem>
                    <MenuItem value="info">Info</MenuItem>
                    <MenuItem value="warn">Warn</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Pagination Limit"
                  type="number"
                  value={get(settings, 'public.defaults.paginationLimit', 100)}
                  onChange={(e) => updateSetting('public.defaults.paginationLimit', parseInt(e.target.value))}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Subscription Limit"
                  type="number"
                  value={get(settings, 'public.defaults.subscriptionLimit', 1000)}
                  onChange={(e) => updateSetting('public.defaults.subscriptionLimit', parseInt(e.target.value))}
                  variant="outlined"
                  size="small"
                  helperText="Maximum records per subscription"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Landing Page"
                  value={get(settings, 'public.defaults.landingPage', '/')}
                  onChange={(e) => updateSetting('public.defaults.landingPage', e.target.value)}
                  variant="outlined"
                  size="small"
                  helperText="Initial page users see when visiting"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Home Page"
                  value={get(settings, 'public.defaults.homePage', '/')}
                  onChange={(e) => updateSetting('public.defaults.homePage', e.target.value)}
                  variant="outlined"
                  size="small"
                  helperText="Page shown when clicking home button"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Internal Date Format</InputLabel>
                  <Select
                    value={get(settings, 'public.defaults.internalDateFormat', 'YYYY-MM-DD')}
                    onChange={(e) => updateSetting('public.defaults.internalDateFormat', e.target.value)}
                    label="Internal Date Format"
                  >
                    <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                    <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                    <MenuItem value="YYYY/MM/DD">YYYY/MM/DD</MenuItem>
                    <MenuItem value="DD-MM-YYYY">DD-MM-YYYY</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Units of Measure</InputLabel>
                  <Select
                    value={get(settings, 'public.defaults.unitsOfMeasure', 'imperial')}
                    onChange={(e) => updateSetting('public.defaults.unitsOfMeasure', e.target.value)}
                    label="Units of Measure"
                  >
                    <MenuItem value="imperial">Imperial (lbs, ft, °F)</MenuItem>
                    <MenuItem value="metric">Metric (kg, m, °C)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={get(settings, 'public.defaults.displayNavbars', true)}
                        onChange={(e) => updateSetting('public.defaults.displayNavbars', e.target.checked)}
                      />
                    }
                    label="Display Navigation Bars"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={get(settings, 'public.defaults.disableHeader', false)}
                        onChange={(e) => updateSetting('public.defaults.disableHeader', e.target.checked)}
                      />
                    }
                    label="Disable Header"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={get(settings, 'public.defaults.disableFooter', false)}
                        onChange={(e) => updateSetting('public.defaults.disableFooter', e.target.checked)}
                      />
                    }
                    label="Disable Footer"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ pt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={get(settings, 'public.defaults.prominentHeader', false)}
                        onChange={(e) => updateSetting('public.defaults.prominentHeader', e.target.checked)}
                      />
                    }
                    label="Enable patient selection sub-header"
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </React.Fragment>
      );
    }
    
    // 4. Theme and Color Palette (with collapse)
    const themeItem = checklistItems.find(item => item.id === 'theme' && item.visible !== false);
    if (themeItem) {
      checklistItemsArray.push(
        <React.Fragment key="theme-section">
          <Alert 
            severity={themeItem.completed ? "success" : "info"}
            icon={themeItem.completed ? <CheckCircle /> : <themeItem.icon />}
            sx={{ 
              backgroundColor: themeItem.completed ? undefined : 'action.hover',
              color: themeItem.completed ? undefined : 'text.primary',
              cursor: 'pointer',
              '& .MuiAlert-icon': {
                color: themeItem.completed ? undefined : 'text.secondary'
              },
              '&:hover': {
                backgroundColor: themeItem.completed ? undefined : 'action.selected'
              }
            }}
            onClick={() => setThemeExpanded(!themeExpanded)}
            action={
              <IconButton 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setThemeExpanded(!themeExpanded);
                }}
              >
                {themeExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            }
          >
            <span>{themeItem.label}</span>
          </Alert>
          <Collapse in={themeExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ pl: 2, pr: 2, mt: -1, mb: 0 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Primary Colors</Typography>
                </Grid>
                <Grid item xs={6}>
                  <ColorField
                    label="Primary Color"
                    fieldPath="public.theme.palette.primaryColor"
                    placeholder="rgb(158, 158, 158)"
                    helperText="Main brand color"
                  />
                </Grid>
                <Grid item xs={6}>
                  <ColorField
                    label="Primary Text"
                    fieldPath="public.theme.palette.primaryText"
                    placeholder="#ffffff"
                    helperText="Text on primary color"
                  />
                </Grid>
                <Grid item xs={6}>
                  <ColorField
                    label="Secondary Color"
                    fieldPath="public.theme.palette.secondaryColor"
                    placeholder="#fdb813"
                  />
                </Grid>
                <Grid item xs={6}>
                  <ColorField
                    label="Secondary Text"
                    fieldPath="public.theme.palette.secondaryText"
                    placeholder="#ffffff"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Status Colors</Typography>
                </Grid>
                <Grid item xs={6}>
                  <ColorField
                    label="Success Color"
                    fieldPath="public.theme.palette.successColor"
                    placeholder="#4caf50"
                  />
                </Grid>
                <Grid item xs={6}>
                  <ColorField
                    label="Info Color"
                    fieldPath="public.theme.palette.infoColor"
                    placeholder="#2196f3"
                  />
                </Grid>
                <Grid item xs={6}>
                  <ColorField
                    label="Warning Color"
                    fieldPath="public.theme.palette.warningColor"
                    placeholder="#ff9800"
                  />
                </Grid>
                <Grid item xs={6}>
                  <ColorField
                    label="Error Color"
                    fieldPath="public.theme.palette.errorColor"
                    placeholder="rgb(128,20,60)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <ColorField
                    label="Error Text"
                    fieldPath="public.theme.palette.errorText"
                    placeholder="#ffffff"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Background Colors</Typography>
                </Grid>
                <Grid item xs={6}>
                  <ColorField
                    label="Background Page Color"
                    fieldPath="public.theme.palette.backgroundPageColor"
                    placeholder="#fafafa"
                    helperText="Light mode"
                  />
                </Grid>
                <Grid item xs={6}>
                  <ColorField
                    label="Background Page Color (Dark)"
                    fieldPath="public.theme.palette.backgroundPageColorDark"
                    placeholder="#121212"
                    helperText="Dark mode"
                  />
                </Grid>
                <Grid item xs={6}>
                  <ColorField
                    label="Paper Color"
                    fieldPath="public.theme.palette.paperColor"
                    placeholder="#ffffff"
                    helperText="Light mode"
                  />
                </Grid>
                <Grid item xs={6}>
                  <ColorField
                    label="Paper Color (Dark)"
                    fieldPath="public.theme.palette.paperColorDark"
                    placeholder="#424242"
                    helperText="Dark mode"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>App Bar Colors</Typography>
                </Grid>
                <Grid item xs={6}>
                  <ColorField
                    label="App Bar Color"
                    fieldPath="public.theme.palette.appBarColor"
                    placeholder={get(settings, 'public.theme.palette.primaryColor', 'rgb(158, 158, 158)')}
                    helperText="Light mode (defaults to primary)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <ColorField
                    label="App Bar Color (Dark)"
                    fieldPath="public.theme.palette.appBarColorDark"
                    placeholder={get(settings, 'public.theme.palette.appBarColor', get(settings, 'public.theme.palette.primaryColor', 'rgb(158, 158, 158)'))}
                    helperText="Dark mode"
                  />
                </Grid>
                <Grid item xs={6}>
                  <ColorField
                    label="App Bar Text Color"
                    fieldPath="public.theme.palette.appBarTextColor"
                    placeholder="#ffffff"
                    helperText="Light mode text color"
                  />
                </Grid>
                <Grid item xs={6}>
                  <ColorField
                    label="App Bar Text Color (Dark)"
                    fieldPath="public.theme.palette.appBarTextColorDark"
                    placeholder={get(settings, 'public.theme.palette.appBarTextColor', '#ffffff')}
                    helperText="Dark mode text color"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>Additional Settings</Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Background Image Path"
                    value={get(settings, 'public.theme.backgroundImagePath', '')}
                    onChange={(e) => updateSetting('public.theme.backgroundImagePath', e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Nivo Theme</InputLabel>
                    <Select
                      value={get(settings, 'public.theme.palette.nivoTheme', 'red_grey')}
                      onChange={(e) => updateSetting('public.theme.palette.nivoTheme', e.target.value)}
                      label="Nivo Theme"
                    >
                      <MenuItem value="red_grey">Red Grey</MenuItem>
                      <MenuItem value="blues">Blues</MenuItem>
                      <MenuItem value="greens">Greens</MenuItem>
                      <MenuItem value="purples">Purples</MenuItem>
                      <MenuItem value="oranges">Oranges</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Video Background</InputLabel>
                    <Select
                      value={get(settings, 'public.theme.showVideoBackground', false) ? 'enabled' : 'disabled'}
                      onChange={(e) => updateSetting('public.theme.showVideoBackground', e.target.value === 'enabled')}
                      label="Video Background"
                    >
                      <MenuItem value="disabled">Disabled</MenuItem>
                      <MenuItem value="enabled">Enabled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Default Video"
                    value={get(settings, 'public.theme.defaultVideo', '')}
                    onChange={(e) => updateSetting('public.theme.defaultVideo', e.target.value)}
                    variant="outlined"
                    size="small"
                    disabled={!get(settings, 'public.theme.showVideoBackground', false)}
                  />
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </React.Fragment>
      );
    }
    
    // 5. Sidebar Configuration (with collapse)
    checklistItemsArray.push(
      <React.Fragment key="sidebar-config-section">
        <Alert 
          severity="info"
          icon={<ViewModule />}
          sx={{ 
            backgroundColor: 'action.hover',
            color: 'text.primary',
            cursor: 'pointer',
            '& .MuiAlert-icon': {
              color: 'text.secondary'
            },
            '&:hover': {
              backgroundColor: 'action.selected'
            }
          }}
          onClick={() => setSidebarConfigExpanded(!sidebarConfigExpanded)}
          action={
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setSidebarConfigExpanded(!sidebarConfigExpanded);
              }}
            >
              {sidebarConfigExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          }
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <span>Sidebar Configuration</span>
          </Stack>
        </Alert>
        <Collapse in={sidebarConfigExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ pl: 2, pr: 2, mt: -1, mb: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configure which items appear in the sidebar menu. Changes take effect immediately.
            </Typography>
            
            <Table size="small" sx={{ border: 1, borderColor: 'divider' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'action.hover' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'action.hover' }}>Menu Item</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'action.hover' }}>Description</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: 'action.hover', width: 100 }}>Enabled</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* General */}
                <TableRow>
                  <TableCell rowSpan={5} sx={{ fontWeight: 'bold', verticalAlign: 'top', backgroundColor: 'action.hover' }}>General</TableCell>
                  <TableCell>Home Page</TableCell>
                  <TableCell>Main landing page and dashboard</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.HomePage', true)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.HomePage', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Patient Chart</TableCell>
                  <TableCell>View and manage patient medical records</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.PatientChart', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.PatientChart', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Health Records</TableCell>
                  <TableCell>Access all health records and documents</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.HealthRecords', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.HealthRecords', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Profile</TableCell>
                  <TableCell>User profile information and settings</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.Profile', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.Profile', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Dynamic Modules</TableCell>
                  <TableCell>Dynamically loaded feature modules</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.DynamicModules', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.DynamicModules', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                
                {/* Data Management */}
                <TableRow>
                  <TableCell rowSpan={3} sx={{ fontWeight: 'bold', verticalAlign: 'top', backgroundColor: 'action.hover' }}>Data Management</TableCell>
                  <TableCell>Data Import</TableCell>
                  <TableCell>Import FHIR resources and bulk data</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.DataImport', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.DataImport', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Data Export</TableCell>
                  <TableCell>Export data in various formats</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.DataExport', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.DataExport', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Data Editor</TableCell>
                  <TableCell>Advanced data editing tools</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.DataEditor', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.DataEditor', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                
                {/* FHIR Resources Dashboard */}
                <TableRow>
                  <TableCell rowSpan={3} sx={{ fontWeight: 'bold', verticalAlign: 'top', backgroundColor: 'action.hover' }}>FHIR Resources</TableCell>
                  <TableCell>FHIR Resources Dashboard</TableCell>
                  <TableCell>FHIR resource management dashboard</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.FhirResourcesDashboard', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.FhirResourcesDashboard', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>FHIR Modules</TableCell>
                  <TableCell>Configure FHIR implementation modules</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.FhirModules', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.FhirModules', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>FHIR Auto Links</TableCell>
                  <TableCell>Auto-generate sidebar links for enabled FHIR resources</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.FhirAutoLinks', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.FhirAutoLinks', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                
                {/* Workflows */}
                <TableRow>
                  <TableCell rowSpan={2} sx={{ fontWeight: 'bold', verticalAlign: 'top', backgroundColor: 'action.hover' }}>Workflows</TableCell>
                  <TableCell>Sidebar Workflows</TableCell>
                  <TableCell>Custom workflow management</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.SidebarWorkflows', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.SidebarWorkflows', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Clinician Workflows</TableCell>
                  <TableCell>Clinical workflow templates</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.ClinicianWorkflows', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.ClinicianWorkflows', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                
                {/* System */}
                <TableRow>
                  <TableCell rowSpan={4} sx={{ fontWeight: 'bold', verticalAlign: 'top', backgroundColor: 'action.hover' }}>System</TableCell>
                  <TableCell>Settings</TableCell>
                  <TableCell>Application configuration</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.Settings', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.Settings', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Theming</TableCell>
                  <TableCell>Customize appearance and colors</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.Theming', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.Theming', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>SMART Launcher</TableCell>
                  <TableCell>Launch SMART on FHIR apps</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.SmartLauncher', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.SmartLauncher', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>OAuth Clients</TableCell>
                  <TableCell>Manage OAuth2 client applications</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.OAuthClients', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.OAuthClients', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                
                {/* Account */}
                <TableRow>
                  <TableCell rowSpan={4} sx={{ fontWeight: 'bold', verticalAlign: 'top', backgroundColor: 'action.hover' }}>Account</TableCell>
                  <TableCell>User Profile</TableCell>
                  <TableCell>View and edit user profile</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.UserProfile', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.UserProfile', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Login</TableCell>
                  <TableCell>Sign in to your account</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.Login', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.Login', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Logout</TableCell>
                  <TableCell>Sign out of your account</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.Logout', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.Logout', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Register</TableCell>
                  <TableCell>Create a new account</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.Register', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.Register', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                
                {/* Legal & Info */}
                <TableRow>
                  <TableCell rowSpan={5} sx={{ fontWeight: 'bold', verticalAlign: 'top', backgroundColor: 'action.hover' }}>Legal & Info</TableCell>
                  <TableCell>About</TableCell>
                  <TableCell>Information about the application</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.About', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.About', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Privacy</TableCell>
                  <TableCell>Privacy policy and data handling</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.Privacy', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.Privacy', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Terms & Conditions</TableCell>
                  <TableCell>Terms of service and usage</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.TermsAndConditions', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.TermsAndConditions', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Documentation</TableCell>
                  <TableCell>User guides and API documentation</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.Documentation', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.Documentation', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Marketing</TableCell>
                  <TableCell>Marketing and promotional content</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.Marketing', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.Marketing', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                
                {/* Development */}
                <TableRow>
                  <TableCell rowSpan={2} sx={{ fontWeight: 'bold', verticalAlign: 'top', backgroundColor: 'action.hover' }}>Development</TableCell>
                  <TableCell>Construction Zone</TableCell>
                  <TableCell>Development and testing area</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.ConstructionZone', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.ConstructionZone', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Navbars</TableCell>
                  <TableCell>Navigation bar configuration</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={get(settings, 'public.defaults.sidebar.menuItems.Navbars', false)}
                      onChange={(e) => updateSetting('public.defaults.sidebar.menuItems.Navbars', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Collapse>
      </React.Fragment>
    );
    
    // 6. Default App Modules (with collapse)
    checklistItemsArray.push(
      <React.Fragment key="modules-section">
        <Alert 
          severity={hasModulesConfig ? "success" : "info"}
          icon={hasModulesConfig ? <CheckCircle /> : <ViewModule />}
          sx={{ 
            backgroundColor: hasModulesConfig ? undefined : 'action.hover',
            color: hasModulesConfig ? undefined : 'text.primary',
            cursor: 'pointer',
            '& .MuiAlert-icon': {
              color: hasModulesConfig ? undefined : 'text.secondary'
            },
            '&:hover': {
              backgroundColor: hasModulesConfig ? undefined : 'action.selected'
            }
          }}
          onClick={() => setModulesExpanded(!modulesExpanded)}
          action={
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setModulesExpanded(!modulesExpanded);
              }}
            >
              {modulesExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          }
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <span>Default App Modules</span>
          </Stack>
        </Alert>
        <Collapse in={modulesExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ pl: 2, pr: 2, mt: -1, mb: 0 }}>
            <TextField
              fullWidth
              label="Module Configuration Command"
              value={moduleCommand}
              variant="outlined"
              sx={{ mt: '20px', mb: 3 }}
              InputProps={{
                readOnly: true,
                sx: {
                  fontFamily: 'monospace',
                  backgroundColor: 'action.hover',
                  '& .MuiOutlinedInput-input': {
                    fontSize: '0.9rem',
                    letterSpacing: '0.05em'
                  }
                }
              }}
              helperText="This command will be updated based on selected modules"
            />
            <Grid container spacing={3}>
              {/* Business Model */}
              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>Business Model</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={get(settings, 'public.modules.PatientPortal', false)}
                        onChange={(e) => updateSetting('public.modules.PatientPortal', e.target.checked)}
                      />
                    }
                    label="Patient Portal"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={get(settings, 'public.modules.PersonalHealthRecord', false)}
                        onChange={(e) => updateSetting('public.modules.PersonalHealthRecord', e.target.checked)}
                      />
                    }
                    label="Personal Health Record"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={get(settings, 'public.modules.ApplicationRouter', false)}
                        onChange={(e) => updateSetting('public.modules.ApplicationRouter', e.target.checked)}
                      />
                    }
                    label="Application Router"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={get(settings, 'public.modules.MedicalHome', false)}
                        onChange={(e) => updateSetting('public.modules.MedicalHome', e.target.checked)}
                      />
                    }
                    label="Medical Home"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={get(settings, 'public.modules.NursingHomeModel', false)}
                        onChange={(e) => updateSetting('public.modules.NursingHomeModel', e.target.checked)}
                      />
                    }
                    label="Nursing Home"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        disabled
                        checked={get(settings, 'public.modules.AmbulanceEmt', false)}
                        onChange={(e) => updateSetting('public.modules.AmbulanceEmt', e.target.checked)}
                      />
                    }
                    label="Ambulance / EMT Services"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        disabled
                        checked={get(settings, 'public.modules.RecreationalVehicles', false)}
                        onChange={(e) => updateSetting('public.modules.RecreationalVehicles', e.target.checked)}
                      />
                    }
                    label="Recreational Vehicles"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        disabled
                        checked={get(settings, 'public.modules.ExtremeEnvironmentShelter', false)}
                        onChange={(e) => updateSetting('public.modules.ExtremeEnvironmentShelter', e.target.checked)}
                      />
                    }
                    label="Extreme Environment Shelter"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        disabled
                        checked={get(settings, 'public.modules.MobileHealthClinic', false)}
                        onChange={(e) => updateSetting('public.modules.MobileHealthClinic', e.target.checked)}
                      />
                    }
                    label="Mobile Health Clinic"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        disabled
                        checked={get(settings, 'public.modules.FlightRecorder', false)}
                        onChange={(e) => updateSetting('public.modules.FlightRecorder', e.target.checked)}
                      />
                    }
                    label="Flight Recorder"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        disabled
                        checked={false}
                      />
                    }
                    label="Workflow Orchestrator"
                  />
                </Box>
              </Grid>
              
              {/* Extended Modules */}
              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>Extended Modules</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={get(settings, 'public.modules.ChecklistManifesto', false)}
                        onChange={(e) => updateSetting('public.modules.ChecklistManifesto', e.target.checked)}
                      />
                    }
                    label="Checklist Manifesto"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={get(settings, 'public.modules.DataImporter', false)}
                        onChange={(e) => updateSetting('public.modules.DataImporter', e.target.checked)}
                      />
                    }
                    label="Data Importer"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={get(settings, 'public.modules.DataExporter', false)}
                        onChange={(e) => updateSetting('public.modules.DataExporter', e.target.checked)}
                      />
                    }
                    label="Data Exporter"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={get(settings, 'public.modules.HipaaCompliance', false)}
                        onChange={(e) => updateSetting('public.modules.HipaaCompliance', e.target.checked)}
                      />
                    }
                    label="HIPAA Compliance"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={get(settings, 'public.modules.NursingHome', false)}
                        onChange={(e) => updateSetting('public.modules.NursingHome', e.target.checked)}
                      />
                    }
                    label="Nursing Home"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={get(settings, 'public.modules.ProviderDirectory', false)}
                        onChange={(e) => updateSetting('public.modules.ProviderDirectory', e.target.checked)}
                      />
                    }
                    label="Provider Directory"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={get(settings, 'public.modules.PhrAnalyzer', false)}
                        onChange={(e) => updateSetting('public.modules.PhrAnalyzer', e.target.checked)}
                      />
                    }
                    label="PHR Analyzer"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={get(settings, 'public.modules.StructuredDataCapture', false)}
                        onChange={(e) => updateSetting('public.modules.StructuredDataCapture', e.target.checked)}
                      />
                    }
                    label="Structured Data Capture"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={get(settings, 'public.modules.Synthea', false)}
                        onChange={(e) => updateSetting('public.modules.Synthea', e.target.checked)}
                      />
                    }
                    label="Synthea"
                  />
                  
                  {/* Premium Modules */}
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>Premium Modules</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        disabled
                        checked={false}
                      />
                    }
                    label="Radiology Viewer"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        disabled
                        checked={false}
                      />
                    }
                    label="Medication Reconciliation"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        disabled
                        checked={false}
                      />
                    }
                    label="Symptom Tracker"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        disabled
                        checked={false}
                      />
                    }
                    label="Biomarker Tracking"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        disabled
                        checked={false}
                      />
                    }
                    label="Genomics Module"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        disabled
                        checked={false}
                      />
                    }
                    label="State Laws"
                  />
                </Box>
              </Grid>
              
              {/* Pages */}
              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>Pages</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={get(settings, 'public.modules.PatientDirectory', false)}
                        onChange={(e) => updateSetting('public.modules.PatientDirectory', e.target.checked)}
                      />
                    }
                    label="Patient Directory"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={get(settings, 'public.modules.PatientChart', false)}
                        onChange={(e) => updateSetting('public.modules.PatientChart', e.target.checked)}
                      />
                    }
                    label="Patient Chart"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={get(settings, 'public.modules.MyProfilePage', false)}
                        onChange={(e) => updateSetting('public.modules.MyProfilePage', e.target.checked)}
                      />
                    }
                    label="My Profile Page"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={get(settings, 'public.modules.Theming', false)}
                        onChange={(e) => updateSetting('public.modules.Theming', e.target.checked)}
                      />
                    }
                    label="Theming"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={get(settings, 'public.modules.AccountLogin', false)}
                        onChange={(e) => updateSetting('public.modules.AccountLogin', e.target.checked)}
                      />
                    }
                    label="Account Login"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={get(settings, 'public.modules.AccountRegistration', false)}
                        onChange={(e) => updateSetting('public.modules.AccountRegistration', e.target.checked)}
                      />
                    }
                    label="Account Registration"
                  />
                </Box>
              </Grid>
              
              {/* FHIR Resources */}
              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>FHIR Resources</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[
                    'AllergyIntolerances',
                    'Appointments',
                    'AuditEvents',
                    'CarePlans',
                    'Conditions',
                    'Consents',
                    'Devices',
                    'DiagnosticReports',
                    'DocumentReferences',
                    'Encounters',
                    'ImagingStudies',
                    'Immunizations',
                    'Locations',
                    'Medias',
                    'MedicationAdministrations',
                    'MedicationRequests',
                    'Medications',
                    'NutritionOrders',
                    'Observations',
                    'Organizations',
                    'Patients',
                    'Practitioners',
                    'Procedures',
                    'QuestionnaireResponses',
                    'Questionnaires',
                    'ResearchStudies',
                    'ResearchSubjects',
                    'Schedules',
                    'ServiceRequests',
                    'SupplyDeliveries'
                  ].map((resource) => (
                    <FormControlLabel
                      key={resource}
                      control={
                        <Switch
                          size="small"
                          checked={get(settings, `public.modules.fhir.${resource}`, false)}
                          onChange={(e) => updateSetting(`public.modules.fhir.${resource}`, e.target.checked)}
                        />
                      }
                      label={resource}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </React.Fragment>
    );
    
    // 7. Interfaces (with collapse)
    // Determine severity based on network topology
    const networkTopology = get(settings, 'public.interfaces.networkTopology', 'standalone');
    const interfacesSeverity = networkTopology !== 'standalone' ? "success" : "info";
    const interfacesIcon = networkTopology !== 'standalone' ? <CheckCircle /> : <Computer />;
    
    checklistItemsArray.push(
      <React.Fragment key="interfaces-section">
        <Alert 
          severity={interfacesSeverity}
          icon={interfacesIcon}
          sx={{ 
            backgroundColor: interfacesSeverity === 'success' ? undefined : 'action.hover',
            color: interfacesSeverity === 'success' ? undefined : 'text.primary',
            cursor: 'pointer',
            '& .MuiAlert-icon': {
              color: interfacesSeverity === 'success' ? undefined : 'text.secondary'
            },
            '&:hover': {
              backgroundColor: interfacesSeverity === 'success' ? undefined : 'action.selected'
            }
          }}
          onClick={() => setInterfacesExpanded(!interfacesExpanded)}
          action={
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setInterfacesExpanded(!interfacesExpanded);
              }}
            >
              {interfacesExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          }
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <span>Interfaces</span>
          </Stack>
        </Alert>
        <Collapse in={interfacesExpanded} unmountOnExit timeout="auto">
          <Box sx={{ pl: 2, pr: 2, mt: -1, mb: 0 }}>
            <Box sx={{ mb: 3, pt: '20px' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Network Topology</InputLabel>
                <Select
                  value={get(settings, 'public.interfaces.networkTopology', 'standalone')}
                  onChange={(e) => updateSetting('public.interfaces.networkTopology', e.target.value)}
                  label="Network Topology"
                >
                  <MenuItem value="standalone">Standalone</MenuItem>
                  <MenuItem value="dataFetcher">Data Consumer</MenuItem>
                  <MenuItem value="dataSource">Data Producer</MenuItem>
                  <MenuItem value="relay">Relay</MenuItem>
                  <MenuItem value="serverless" disabled>Serverless</MenuItem>
                  <MenuItem value="proxy" disabled>Proxy</MenuItem>
                  <MenuItem value="aggregator" disabled>Aggregator</MenuItem>
                  <MenuItem value="broadcaster" disabled>Broadcaster</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {get(settings, 'public.interfaces.networkTopology', 'standalone') === 'standalone' && 'System operates independently without external connections'}
                {get(settings, 'public.interfaces.networkTopology') === 'dataFetcher' && 'System consumes data from upstream sources'}
                {get(settings, 'public.interfaces.networkTopology') === 'dataSource' && 'System produces data for downstream consumers'}
                {get(settings, 'public.interfaces.networkTopology') === 'relay' && 'System relays data between upstream and downstream systems'}
              </Typography>
            </Box>
            
            <Grid container spacing={3} sx={{ position: 'relative' }}>
              {/* Calculate enabled states based on topology */}
              {(() => {
                const topology = get(settings, 'public.interfaces.networkTopology', 'standalone');
                const upstreamEnabled = topology === 'relay' || topology === 'dataFetcher';
                const downstreamEnabled = topology === 'relay' || topology === 'dataSource';
                
                return (
                  <>
              {/* Connection Lines SVG Overlay */}
              <Box sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                pointerEvents: 'none',
                zIndex: 0,
                display: { xs: 'none', md: 'block' } // Hide on small screens
              }}>
                <svg width="100%" height="100%" style={{ position: 'absolute' }}>
                  {/* Upstream to Current line */}
                  {upstreamEnabled && (
                    <g transform="translate(-100, 0)">
                      <line
                        x1="33.33%"
                        y1="15%"
                        x2="50%"
                        y2="15%"
                        stroke="#999"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                      />
                    </g>
                  )}
                  {/* Current to Downstream line */}
                  {downstreamEnabled && (
                    <g transform="translate(120, 0)">
                      <line
                        x1="50%"
                        y1="15%"
                        x2="66.66%"
                        y2="15%"
                        stroke="#999"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                      />
                    </g>
                  )}
                </svg>
              </Box>
              
              {/* UPSTREAM */}
              <Grid item xs={12} md={4} sx={{ zIndex: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Storage sx={{ fontSize: 60, color: upstreamEnabled ? 'text.secondary' : 'action.disabled', mb: 2 }} />
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: upstreamEnabled ? 'text.primary' : 'text.disabled' }}>UPSTREAM</Typography>
                </Box>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={get(settings, 'public.interfaces.upstream.status', 'active') === 'active'}
                        onChange={(e) => updateSetting('public.interfaces.upstream.status', e.target.checked ? 'active' : 'inactive')}
                        disabled={!upstreamEnabled}
                      />
                    }
                    label="Enabled"
                  />
                  <TextField
                    fullWidth
                    label="Upstream Interface Endpoint"
                    value={get(settings, 'public.interfaces.upstream.channel.endpoint', '')}
                    onChange={(e) => updateSetting('public.interfaces.upstream.channel.endpoint', e.target.value)}
                    variant="outlined"
                    size="small"
                    disabled={!upstreamEnabled}
                  />
                  <FormControl fullWidth size="small" disabled={!upstreamEnabled}>
                    <InputLabel>Authentication Type</InputLabel>
                    <Select
                      value={get(settings, 'public.interfaces.upstream.auth.type', 'open')}
                      onChange={(e) => updateSetting('public.interfaces.upstream.auth.type', e.target.value)}
                      label="Authentication Type"
                    >
                      <MenuItem value="smart">SMART on FHIR</MenuItem>
                      <MenuItem value="basic">Basic Auth</MenuItem>
                      <MenuItem value="open">Open Endpoint</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {/* Basic Auth fields */}
                  {get(settings, 'public.interfaces.upstream.auth.type', 'open') === 'basic' && (
                    <>
                      <TextField
                        fullWidth
                        label="Upstream Username"
                        value={get(settings, 'public.interfaces.upstream.auth.username', '')}
                        onChange={(e) => updateSetting('public.interfaces.upstream.auth.username', e.target.value)}
                        variant="outlined"
                        size="small"
                        disabled={!upstreamEnabled}
                      />
                      <TextField
                        fullWidth
                        label="Upstream Password"
                        type="password"
                        value={get(settings, 'public.interfaces.upstream.auth.password', '')}
                        onChange={(e) => updateSetting('public.interfaces.upstream.auth.password', e.target.value)}
                        variant="outlined"
                        size="small"
                        disabled={!upstreamEnabled}
                      />
                    </>
                  )}
                  
                  {/* SMART on FHIR button */}
                  {get(settings, 'public.interfaces.upstream.auth.type', 'open') === 'smart' && (
                    <Button 
                      variant="outlined" 
                      color="primary"
                      size="large"
                      startIcon={<Security />}
                      onClick={() => navigate('/smart-launcher-debugger')}
                      disabled={!upstreamEnabled}
                      fullWidth
                    >
                      SMART Launch
                    </Button>
                  )}
                </Stack>
              </Grid>
              
              {/* CURRENT INSTALLATION */}
              <Grid item xs={12} md={4} sx={{ zIndex: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Dns sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>CURRENT INSTALLATION</Typography>
                </Box>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Hostname"
                    value={window.location.hostname}
                    disabled
                    variant="outlined"
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Port"
                    value={window.location.port || (window.location.protocol === 'https:' ? '443' : '80')}
                    disabled
                    variant="outlined"
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Protocol"
                    value={window.location.protocol.replace(':', '')}
                    disabled
                    variant="outlined"
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Full URL"
                    value={window.location.origin}
                    disabled
                    variant="outlined"
                    size="small"
                  />
                </Stack>
              </Grid>
              
              {/* DOWNSTREAM */}
              <Grid item xs={12} md={4} sx={{ zIndex: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Storage sx={{ fontSize: 60, color: downstreamEnabled ? 'text.secondary' : 'action.disabled', mb: 2 }} />
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: downstreamEnabled ? 'text.primary' : 'text.disabled' }}>DOWNSTREAM</Typography>
                </Box>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={get(settings, 'public.interfaces.downstream.status', 'active') === 'active'}
                        onChange={(e) => updateSetting('public.interfaces.downstream.status', e.target.checked ? 'active' : 'inactive')}
                        disabled={!downstreamEnabled}
                      />
                    }
                    label="Enabled"
                  />
                  <TextField
                    fullWidth
                    label="Downstream Interface Endpoint"
                    value={get(settings, 'public.interfaces.downstream.channel.endpoint', '')}
                    onChange={(e) => updateSetting('public.interfaces.downstream.channel.endpoint', e.target.value)}
                    variant="outlined"
                    size="small"
                    disabled={!downstreamEnabled}
                  />
                  <FormControl fullWidth size="small" disabled={!downstreamEnabled}>
                    <InputLabel>Authentication Type</InputLabel>
                    <Select
                      value={get(settings, 'public.interfaces.downstream.auth.type', 'open')}
                      onChange={(e) => updateSetting('public.interfaces.downstream.auth.type', e.target.value)}
                      label="Authentication Type"
                    >
                      <MenuItem value="basic">Basic Auth</MenuItem>
                      <MenuItem value="open">Open Endpoint</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {/* Basic Auth fields */}
                  {get(settings, 'public.interfaces.downstream.auth.type', 'open') === 'basic' && (
                    <>
                      <TextField
                        fullWidth
                        label="Downstream Username"
                        value={get(settings, 'public.interfaces.downstream.auth.username', '')}
                        onChange={(e) => updateSetting('public.interfaces.downstream.auth.username', e.target.value)}
                        variant="outlined"
                        size="small"
                        disabled={!downstreamEnabled}
                      />
                      <TextField
                        fullWidth
                        label="Downstream Password"
                        type="password"
                        value={get(settings, 'public.interfaces.downstream.auth.password', '')}
                        onChange={(e) => updateSetting('public.interfaces.downstream.auth.password', e.target.value)}
                        variant="outlined"
                        size="small"
                        disabled={!downstreamEnabled}
                      />
                    </>
                  )}
                </Stack>
              </Grid>
                  </>
                );
              })()}
            </Grid>
          </Box>
        </Collapse>
      </React.Fragment>
    );
    
    // 8. User Accounts (with collapse)
    const registerItem = checklistItems.find(item => item.id === 'register' && item.visible !== false);
    if (registerItem) {
      checklistItemsArray.push(
        <React.Fragment key="register-section">
          <Alert 
            severity="info"
            icon={<registerItem.icon />}
            sx={{ 
              backgroundColor: 'action.hover',
              color: 'text.primary',
              cursor: 'pointer',
              '& .MuiAlert-icon': {
                color: 'text.secondary'
              },
              '&:hover': {
                backgroundColor: 'action.selected'
              }
            }}
            onClick={() => setRegisterExpanded(!registerExpanded)}
            action={
              <IconButton 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setRegisterExpanded(!registerExpanded);
                }}
              >
                {registerExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            }
          >
            <span>{registerItem.label}</span>
          </Alert>
          <Collapse in={registerExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ pl: 2, pr: 2, mt: -1, mb: 0 }}>
              <Grid container spacing={3}>
                {/* Column 1: Default IDs */}
                <Grid item xs={12} md={3}>
                  <Stack spacing={2}>
                    <div>
                      <Typography variant="subtitle2" gutterBottom>Default Patient</Typography>
                      <TextField
                        fullWidth
                        value={get(settings, 'public.defaults.defaultPatientId', '')}
                        onChange={(e) => updateSetting('public.defaults.defaultPatientId', e.target.value)}
                        variant="outlined"
                        size="small"
                        placeholder="Patient ID"
                      />
                    </div>
                    <div>
                      <Typography variant="subtitle2" gutterBottom>Default Practitioner</Typography>
                      <TextField
                        fullWidth
                        value={get(settings, 'public.defaults.defaultPractitionerId', '')}
                        onChange={(e) => updateSetting('public.defaults.defaultPractitionerId', e.target.value)}
                        variant="outlined"
                        size="small"
                        placeholder="Practitioner ID"
                      />
                    </div>
                  </Stack>
                </Grid>
                
                {/* Column 2: Add User */}
                <Grid item xs={12} md={3}>
                  <Stack spacing={2}>
                    <div>
                      <Typography variant="subtitle2" gutterBottom>Username</Typography>
                      <TextField
                        fullWidth
                        value={get(settings, 'temp.newUsername', '')}
                        onChange={(e) => updateSetting('temp.newUsername', e.target.value)}
                        variant="outlined"
                        size="small"
                        placeholder="Enter username"
                      />
                    </div>
                    <div>
                      <Typography variant="subtitle2" gutterBottom>Password</Typography>
                      <TextField
                        fullWidth
                        type="password"
                        value={get(settings, 'temp.newPassword', '')}
                        onChange={(e) => updateSetting('temp.newPassword', e.target.value)}
                        variant="outlined"
                        size="small"
                        placeholder="Enter password"
                      />
                    </div>
                    <Button 
                      variant="contained"
                      size="small"
                      onClick={() => {
                        // TODO: Implement user creation
                        console.log('Add user:', get(settings, 'temp.newUsername'));
                      }}
                    >
                      Add User
                    </Button>
                  </Stack>
                </Grid>
                
                {/* Column 3: Server User Accounts */}
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" gutterBottom>Server User Accounts</Typography>
                  <TextField
                    fullWidth
                    value={Meteor.users ? Meteor.users.find().count() : 0}
                    disabled
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                
                {/* Column 4: Current User */}
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" gutterBottom>Current Username/ID</Typography>
                  <TextField
                    fullWidth
                    value={Meteor.user() ? (Meteor.user().username || Meteor.user()._id) : 'Not logged in'}
                    disabled
                    variant="outlined"
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </React.Fragment>
      );
    }
    
    // 9. Server FHIR APIs (with collapse)
    // Check if any FHIR resources are enabled
    const fhirResources = [
      'AllergyIntolerance', 'CarePlan', 'CareTeam', 'Condition', 'Consent',
      'Communication', 'DocumentReference', 'Encounter', 'Goal', 'Immunization',
      'List', 'Location', 'Medication', 'MedicationRequest', 'MedicationStatement',
      'NutritionOrder', 'Observation', 'Organization', 'Patient', 'Practitioner',
      'Procedure', 'Questionnaire', 'QuestionnaireResponse', 'ResearchStudy',
      'ResearchSubject', 'ServiceRequest'
    ];
    
    const hasAnyFhirResource = fhirResources.some(resource => {
      const interactions = get(settings, `private.fhir.rest.${resource}.interactions`, []);
      const hasSearch = get(settings, `private.fhir.rest.${resource}.search`, false);
      const hasPublication = get(settings, `private.fhir.rest.${resource}.publication`, false);
      return interactions.length > 0 || hasSearch || hasPublication;
    });
    
    const isOauthDisabled = get(settings, 'private.fhir.disableOauth', false);
    
    // Determine severity: warning if OAuth disabled, success if resources enabled, otherwise info
    const serverApisSeverity = isOauthDisabled ? "warning" : (hasAnyFhirResource ? "success" : "info");
    const serverApisIcon = isOauthDisabled ? <Warning /> : (hasAnyFhirResource ? <CheckCircle /> : <Api />);
    
    checklistItemsArray.push(
      <React.Fragment key="server-apis-section">
        <Alert 
          severity={serverApisSeverity}
          icon={serverApisIcon}
          sx={{ 
            backgroundColor: serverApisSeverity === 'warning' ? undefined : (serverApisSeverity === 'success' ? undefined : 'action.hover'),
            color: serverApisSeverity === 'warning' ? undefined : (serverApisSeverity === 'success' ? undefined : 'text.primary'),
            cursor: 'pointer',
            '& .MuiAlert-icon': {
              color: serverApisSeverity === 'warning' ? undefined : (serverApisSeverity === 'success' ? undefined : 'text.secondary')
            },
            '&:hover': {
              backgroundColor: serverApisSeverity === 'warning' ? 'warning.lighter' : (serverApisSeverity === 'success' ? undefined : 'action.selected')
            }
          }}
          onClick={() => setServerApisExpanded(!serverApisExpanded)}
          action={
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setServerApisExpanded(!serverApisExpanded);
              }}
            >
              {serverApisExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          }
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <span>Server FHIR APIs</span>
          </Stack>
        </Alert>
        <Collapse in={serverApisExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ pl: 2, pr: 2, mt: -1, mb: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configure FHIR resources for your server. These settings will be saved in the private section of your settings file.
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="FHIR Base Path"
                  value={get(settings, 'private.fhir.fhirPath', 'baseR4')}
                  onChange={(e) => updateSetting('private.fhir.fhirPath', e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={get(settings, 'private.fhir.disableOauth', false)}
                      onChange={(e) => updateSetting('private.fhir.disableOauth', e.target.checked)}
                    />
                  }
                  label="Disable OAuth"
                />
              </Grid>
            </Grid>
            
            <Typography variant="subtitle2" sx={{ mt: 3, mb: 2 }}>FHIR Resource Configuration</Typography>
            
            <Table size="small" sx={{ border: 1, borderColor: 'divider' }}>
              <TableHead>
                <TableRow>
                  <TableCell align="center">All</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell align="center">Read</TableCell>
                  <TableCell align="center">Create</TableCell>
                  <TableCell align="center">Update</TableCell>
                  <TableCell align="center">Delete</TableCell>
                  <TableCell align="center">Search</TableCell>
                  <TableCell align="center">Pub/Sub</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  'AllergyIntolerance', 'CarePlan', 'CareTeam', 'Condition', 'Consent',
                  'Communication', 'DocumentReference', 'Encounter', 'Goal', 'Immunization',
                  'List', 'Location', 'Medication', 'MedicationRequest', 'MedicationStatement',
                  'NutritionOrder', 'Observation', 'Organization', 'Patient', 'Practitioner',
                  'Procedure', 'Questionnaire', 'QuestionnaireResponse', 'ResearchStudy',
                  'ResearchSubject', 'ServiceRequest'
                ].map((resource) => {
                  const resourcePath = `private.fhir.rest.${resource}`;
                  const interactions = get(settings, `${resourcePath}.interactions`, []);
                  
                  const updateInteraction = (interaction, checked) => {
                    let newInteractions = [...interactions];
                    if (checked && !newInteractions.includes(interaction)) {
                      newInteractions.push(interaction);
                    } else if (!checked) {
                      newInteractions = newInteractions.filter(i => i !== interaction);
                    }
                    updateSetting(`${resourcePath}.interactions`, newInteractions);
                  };
                  
                  // Check states for master checkbox
                  const hasRead = interactions.includes('read');
                  const hasCreate = interactions.includes('create');
                  const hasUpdate = interactions.includes('update');
                  const hasDelete = interactions.includes('delete');
                  const hasSearch = get(settings, `${resourcePath}.search`, false);
                  const hasPublication = get(settings, `${resourcePath}.publication`, false);
                  
                  const checkedCount = [hasRead, hasCreate, hasUpdate, hasDelete, hasSearch, hasPublication].filter(Boolean).length;
                  const isAllChecked = checkedCount === 6;
                  const isIndeterminate = checkedCount > 0 && checkedCount < 6;
                  
                  const handleMasterToggle = () => {
                    // Create a deep copy of settings
                    const newSettings = JSON.parse(JSON.stringify(settings));
                    
                    // Ensure the entire path structure exists
                    if (!newSettings.private) newSettings.private = {};
                    if (!newSettings.private.fhir) newSettings.private.fhir = {};
                    if (!newSettings.private.fhir.rest) newSettings.private.fhir.rest = {};
                    if (!newSettings.private.fhir.rest[resource]) {
                      newSettings.private.fhir.rest[resource] = {};
                    }
                    
                    if (isAllChecked) {
                      // Uncheck all
                      newSettings.private.fhir.rest[resource].interactions = [];
                      newSettings.private.fhir.rest[resource].search = false;
                      newSettings.private.fhir.rest[resource].publication = false;
                    } else {
                      // Check all (including from indeterminate state)
                      newSettings.private.fhir.rest[resource].interactions = ['read', 'create', 'update', 'delete'];
                      newSettings.private.fhir.rest[resource].search = true;
                      newSettings.private.fhir.rest[resource].publication = true;
                    }
                    
                    // Update state once with all changes
                    setSettings(newSettings);
                    
                    // Update capability statement
                    updateCapabilityStatement(newSettings);
                  };
                  
                  return (
                    <TableRow key={resource}>
                      <TableCell align="center">
                        <Checkbox
                          size="small"
                          checked={isAllChecked}
                          indeterminate={isIndeterminate}
                          onChange={handleMasterToggle}
                          sx={{
                            color: isIndeterminate ? 'warning.main' : undefined,
                            '&.Mui-checked': {
                              color: 'success.main',
                            },
                            '&.MuiCheckbox-indeterminate': {
                              color: 'warning.main',
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell component="th" scope="row">{resource}</TableCell>
                      <TableCell align="center">
                        <Checkbox
                          size="small"
                          checked={interactions.includes('read')}
                          onChange={(e) => updateInteraction('read', e.target.checked)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          size="small"
                          checked={interactions.includes('create')}
                          onChange={(e) => updateInteraction('create', e.target.checked)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          size="small"
                          checked={interactions.includes('update')}
                          onChange={(e) => updateInteraction('update', e.target.checked)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          size="small"
                          checked={interactions.includes('delete')}
                          onChange={(e) => updateInteraction('delete', e.target.checked)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          size="small"
                          checked={get(settings, `${resourcePath}.search`, false)}
                          onChange={(e) => updateSetting(`${resourcePath}.search`, e.target.checked)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          size="small"
                          checked={get(settings, `${resourcePath}.publication`, false)}
                          onChange={(e) => updateSetting(`${resourcePath}.publication`, e.target.checked)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </Collapse>
      </React.Fragment>
    );
    
    // 10. Business/Legal Pages (with collapse)
    checklistItemsArray.push(
      <React.Fragment key="business-pages-section">
        <Alert 
          severity="info"
          icon={<Business />}
          sx={{ 
            backgroundColor: 'action.hover',
            color: 'text.primary',
            cursor: 'pointer',
            '& .MuiAlert-icon': {
              color: 'text.secondary'
            },
            '&:hover': {
              backgroundColor: 'action.selected'
            }
          }}
          onClick={() => setBusinessPagesExpanded(!businessPagesExpanded)}
          action={
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setBusinessPagesExpanded(!businessPagesExpanded);
              }}
            >
              {businessPagesExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          }
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <span>Business & Legal Pages</span>
          </Stack>
        </Alert>
        <Collapse in={businessPagesExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ pl: 2, pr: 2, mt: -1, mb: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configure business and legal pages for your application. Enable pages and customize their content.
            </Typography>
            
            <Grid container spacing={3}>
              {/* Privacy Policy */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={get(settings, 'public.businessPages.privacy.enabled', false)}
                          onChange={(e) => updateSetting('public.businessPages.privacy.enabled', e.target.checked)}
                        />
                      }
                      label="Privacy Policy Page"
                      sx={{ mb: 2 }}
                    />
                    {get(settings, 'public.businessPages.privacy.enabled', false) && (
                      <>
                        <TextField
                          fullWidth
                          label="Page Title"
                          value={get(settings, 'public.businessPages.privacy.title', 'Privacy Policy')}
                          onChange={(e) => updateSetting('public.businessPages.privacy.title', e.target.value)}
                          variant="outlined"
                          size="small"
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          label="Content"
                          value={get(settings, 'public.businessPages.privacy.content', '')}
                          onChange={(e) => updateSetting('public.businessPages.privacy.content', e.target.value)}
                          variant="outlined"
                          helperText="Enter your privacy policy content"
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Terms and Conditions */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={get(settings, 'public.businessPages.terms.enabled', false)}
                          onChange={(e) => updateSetting('public.businessPages.terms.enabled', e.target.checked)}
                        />
                      }
                      label="Terms and Conditions Page"
                      sx={{ mb: 2 }}
                    />
                    {get(settings, 'public.businessPages.terms.enabled', false) && (
                      <>
                        <TextField
                          fullWidth
                          label="Page Title"
                          value={get(settings, 'public.businessPages.terms.title', 'Terms and Conditions')}
                          onChange={(e) => updateSetting('public.businessPages.terms.title', e.target.value)}
                          variant="outlined"
                          size="small"
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          label="Content"
                          value={get(settings, 'public.businessPages.terms.content', '')}
                          onChange={(e) => updateSetting('public.businessPages.terms.content', e.target.value)}
                          variant="outlined"
                          helperText="Enter your terms and conditions"
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              {/* EULA */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={get(settings, 'public.businessPages.eula.enabled', false)}
                          onChange={(e) => updateSetting('public.businessPages.eula.enabled', e.target.checked)}
                        />
                      }
                      label="End User License Agreement (EULA)"
                      sx={{ mb: 2 }}
                    />
                    {get(settings, 'public.businessPages.eula.enabled', false) && (
                      <>
                        <TextField
                          fullWidth
                          label="Page Title"
                          value={get(settings, 'public.businessPages.eula.title', 'End User License Agreement')}
                          onChange={(e) => updateSetting('public.businessPages.eula.title', e.target.value)}
                          variant="outlined"
                          size="small"
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          label="Content"
                          value={get(settings, 'public.businessPages.eula.content', '')}
                          onChange={(e) => updateSetting('public.businessPages.eula.content', e.target.value)}
                          variant="outlined"
                          helperText="Enter your EULA content"
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Support */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={get(settings, 'public.businessPages.support.enabled', false)}
                          onChange={(e) => updateSetting('public.businessPages.support.enabled', e.target.checked)}
                        />
                      }
                      label="Support Page"
                      sx={{ mb: 2 }}
                    />
                    {get(settings, 'public.businessPages.support.enabled', false) && (
                      <>
                        <TextField
                          fullWidth
                          label="Page Title"
                          value={get(settings, 'public.businessPages.support.title', 'Support')}
                          onChange={(e) => updateSetting('public.businessPages.support.title', e.target.value)}
                          variant="outlined"
                          size="small"
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          label="Content"
                          value={get(settings, 'public.businessPages.support.content', '')}
                          onChange={(e) => updateSetting('public.businessPages.support.content', e.target.value)}
                          variant="outlined"
                          sx={{ mb: 2 }}
                        />
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Support Email"
                              value={get(settings, 'public.businessPages.support.email', '')}
                              onChange={(e) => updateSetting('public.businessPages.support.email', e.target.value)}
                              variant="outlined"
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Support Phone"
                              value={get(settings, 'public.businessPages.support.phone', '')}
                              onChange={(e) => updateSetting('public.businessPages.support.phone', e.target.value)}
                              variant="outlined"
                              size="small"
                            />
                          </Grid>
                        </Grid>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              {/* About */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={get(settings, 'public.businessPages.about.enabled', false)}
                          onChange={(e) => updateSetting('public.businessPages.about.enabled', e.target.checked)}
                        />
                      }
                      label="About Page"
                      sx={{ mb: 2 }}
                    />
                    {get(settings, 'public.businessPages.about.enabled', false) && (
                      <>
                        <TextField
                          fullWidth
                          label="Page Title"
                          value={get(settings, 'public.businessPages.about.title', 'About Us')}
                          onChange={(e) => updateSetting('public.businessPages.about.title', e.target.value)}
                          variant="outlined"
                          size="small"
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          label="Content"
                          value={get(settings, 'public.businessPages.about.content', '')}
                          onChange={(e) => updateSetting('public.businessPages.about.content', e.target.value)}
                          variant="outlined"
                          helperText="Enter your about page content"
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </React.Fragment>
    );
    
    // 11. Upstream Tether (SMART on FHIR)
    checklistItemsArray.push(
      <React.Fragment key="upstream-tether-section">
        <Alert 
          severity="info"
          icon={<Security />}
          sx={{ 
            backgroundColor: 'action.hover',
            color: 'text.primary',
            cursor: 'pointer',
            '& .MuiAlert-icon': {
              color: 'text.secondary'
            },
            '&:hover': {
              backgroundColor: 'action.selected'
            }
          }}
          onClick={() => setUpstreamTetherExpanded(!upstreamTetherExpanded)}
          action={
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setUpstreamTetherExpanded(!upstreamTetherExpanded);
              }}
            >
              {upstreamTetherExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          }
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <span>Upstream Tether (SMART on FHIR)</span>
          </Stack>
        </Alert>
        <Collapse in={upstreamTetherExpanded} unmountOnExit timeout="auto">
          <Box sx={{ pl: 2, pr: 2, mt: -1, mb: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configure SMART on FHIR connection to upstream EHR systems
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Array.isArray(get(settings, 'public.smartOnFhir')) && get(settings, 'public.smartOnFhir', []).length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Enable: Create default smartOnFhir configuration
                          const defaultSmartOnFhir = [{
                            vendor: "SmartHealth IT",
                            client_id: "my-client-id",
                            scope: "launch launch/patient patient/read encounter/read procedure/read condition/read observation/read offline_access",
                            fhirServiceUrl: "https://launch.smarthealthit.org/v/r3/sim/",
                            redirect_uri: "./patient-quickchart",
                            iss: "https://launch.smarthealthit.org/v/r3/sim/eyJoIjoiMSIsImIiOiJmMDQ2MjkzNi1lYjRiLTRkYTEtYjQ1YS1mYmQ5NmViZjhjY2IiLCJlIjoic21hcnQtUHJhY3RpdGlvbmVyLTcxNjE0NTAyIn0/fhir"
                          }];
                          updateSetting('public.smartOnFhir', defaultSmartOnFhir);
                        } else {
                          // Disable: Remove smartOnFhir configuration
                          updateSetting('public.smartOnFhir', []);
                        }
                      }}
                    />
                  }
                  label="Enable SMART on FHIR"
                />
              </Grid>
              {Array.isArray(get(settings, 'public.smartOnFhir')) && get(settings, 'public.smartOnFhir', []).length > 0 && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Client ID"
                      value={get(settings, 'public.smartOnFhir[0].client_id', '')}
                      onChange={(e) => {
                        const smartConfig = get(settings, 'public.smartOnFhir', [{}]);
                        smartConfig[0] = { ...smartConfig[0], client_id: e.target.value };
                        updateSetting('public.smartOnFhir', smartConfig);
                      }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Vendor"
                      value={get(settings, 'public.smartOnFhir[0].vendor', '')}
                      onChange={(e) => {
                        const smartConfig = get(settings, 'public.smartOnFhir', [{}]);
                        smartConfig[0] = { ...smartConfig[0], vendor: e.target.value };
                        updateSetting('public.smartOnFhir', smartConfig);
                      }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Scope"
                      value={get(settings, 'public.smartOnFhir[0].scope', '')}
                      onChange={(e) => {
                        const smartConfig = get(settings, 'public.smartOnFhir', [{}]);
                        smartConfig[0] = { ...smartConfig[0], scope: e.target.value };
                        updateSetting('public.smartOnFhir', smartConfig);
                      }}
                      variant="outlined"
                      size="small"
                      helperText="Space-separated list of SMART scopes"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="FHIR Service URL"
                      value={get(settings, 'public.smartOnFhir[0].fhirServiceUrl', '')}
                      onChange={(e) => {
                        const smartConfig = get(settings, 'public.smartOnFhir', [{}]);
                        smartConfig[0] = { ...smartConfig[0], fhirServiceUrl: e.target.value };
                        updateSetting('public.smartOnFhir', smartConfig);
                      }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="ISS (Issuer)"
                      value={get(settings, 'public.smartOnFhir[0].iss', '')}
                      onChange={(e) => {
                        const smartConfig = get(settings, 'public.smartOnFhir', [{}]);
                        smartConfig[0] = { ...smartConfig[0], iss: e.target.value };
                        updateSetting('public.smartOnFhir', smartConfig);
                      }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Redirect URI"
                      value={get(settings, 'public.smartOnFhir[0].redirect_uri', '')}
                      onChange={(e) => {
                        const smartConfig = get(settings, 'public.smartOnFhir', [{}]);
                        smartConfig[0] = { ...smartConfig[0], redirect_uri: e.target.value };
                        updateSetting('public.smartOnFhir', smartConfig);
                      }}
                      variant="outlined"
                      size="small"
                      helperText="Usually ./patient-quickchart or similar"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => navigate('/smart-launcher-debugger')}
                      startIcon={<Launch />}
                      sx={{ mt: 1 }}
                    >
                      Open SMART Launcher Debugger
                    </Button>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </Collapse>
      </React.Fragment>
    );
    
    // 12. Environment Variables
    // Determine alert severity based on feature flags
    let envVarsSeverity = "info";
    if (get(settings, 'private.env.ENABLE_AUTOPUBLISH', 'No Value') === 'Enabled') {
      envVarsSeverity = "warning";
      if (get(settings, 'private.env.ENABLE_HIPAA', 'No Value') === 'Enabled') {
        envVarsSeverity = "error";
      }
    }
    
    checklistItemsArray.push(
      <React.Fragment key="environment-vars-section">
        <Alert 
          severity={envVarsSeverity}
          icon={<Settings />}
          sx={{ 
            backgroundColor: 'action.hover',
            color: 'text.primary',
            cursor: 'pointer',
            '& .MuiAlert-icon': {
              color: 'text.secondary'
            },
            '&:hover': {
              backgroundColor: 'action.selected'
            }
          }}
          onClick={() => setEnvironmentVarsExpanded(!environmentVarsExpanded)}
          action={
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setEnvironmentVarsExpanded(!environmentVarsExpanded);
              }}
            >
              {environmentVarsExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          }
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <span>Environment Variables</span>
          </Stack>
        </Alert>
        <Collapse in={environmentVarsExpanded} unmountOnExit timeout="auto">
          <Box sx={{ pl: 2, pr: 2, mt: -1, mb: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Set environment variables for server configuration. These values will be available as process.env variables.
            </Typography>
            <Grid container spacing={2}>
              {/* Application Configuration */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>Application Configuration</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="NODE_ENV"
                  value={get(settings, 'private.env.NODE_ENV', 'development')}
                  onChange={(e) => updateSetting('private.env.NODE_ENV', e.target.value)}
                  variant="outlined"
                  size="small"
                  helperText="development, production, test"
                  inputProps={{ autoComplete: 'off' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="PORT"
                  value={get(settings, 'private.env.PORT', '3000')}
                  onChange={(e) => updateSetting('private.env.PORT', e.target.value)}
                  variant="outlined"
                  size="small"
                  helperText="Server port"
                  inputProps={{ autoComplete: 'off' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="TZ"
                  value={get(settings, 'private.env.TZ', '')}
                  onChange={(e) => updateSetting('private.env.TZ', e.target.value)}
                  variant="outlined"
                  size="small"
                  placeholder="America/New_York"
                  helperText="Timezone setting"
                  inputProps={{ autoComplete: 'off' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Force SSL</InputLabel>
                  <Select
                    value={get(settings, 'private.env.FORCE_SSL', 'No Value')}
                    onChange={(e) => updateSetting('private.env.FORCE_SSL', e.target.value)}
                    label="Force SSL"
                  >
                    <MenuItem value="No Value">No Value</MenuItem>
                    <MenuItem value="Enabled">Enabled</MenuItem>
                    <MenuItem value="Disabled">Disabled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Use MongoDB ObjectIDs</InputLabel>
                  <Select
                    value={get(settings, 'private.env.USE_MONGO_OBJECTID', 'No Value')}
                    onChange={(e) => updateSetting('private.env.USE_MONGO_OBJECTID', e.target.value)}
                    label="Use MongoDB ObjectIDs"
                  >
                    <MenuItem value="No Value">No Value</MenuItem>
                    <MenuItem value="Enabled">Enabled</MenuItem>
                    <MenuItem value="Disabled">Disabled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Database */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>Database</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="MONGO_URL"
                  value={get(settings, 'private.env.MONGO_URL', '')}
                  onChange={(e) => updateSetting('private.env.MONGO_URL', e.target.value)}
                  variant="outlined"
                  size="small"
                  placeholder="mongodb://localhost:27017/honeycomb"
                  helperText="MongoDB connection string (Required)"
                  required
                  inputProps={{ autoComplete: 'off' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="MONGO_OPLOG_URL"
                  value={get(settings, 'private.env.MONGO_OPLOG_URL', '')}
                  onChange={(e) => updateSetting('private.env.MONGO_OPLOG_URL', e.target.value)}
                  variant="outlined"
                  size="small"
                  helperText="MongoDB oplog URL for real-time"
                  inputProps={{ autoComplete: 'off' }}
                />
              </Grid>
              
              {/* Feature Flags */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>Feature Flags</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Enable Accounts</InputLabel>
                  <Select
                    value={get(settings, 'private.env.ENABLE_ACCOUNTS', 'No Value')}
                    onChange={(e) => updateSetting('private.env.ENABLE_ACCOUNTS', e.target.value)}
                    label="Enable Accounts"
                  >
                    <MenuItem value="No Value">No Value</MenuItem>
                    <MenuItem value="Enabled">Enabled</MenuItem>
                    <MenuItem value="Disabled">Disabled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Enable Autopublish</InputLabel>
                  <Select
                    value={get(settings, 'private.env.ENABLE_AUTOPUBLISH', 'No Value')}
                    onChange={(e) => updateSetting('private.env.ENABLE_AUTOPUBLISH', e.target.value)}
                    label="Enable Autopublish"
                  >
                    <MenuItem value="No Value">No Value</MenuItem>
                    <MenuItem value="Enabled">Enabled</MenuItem>
                    <MenuItem value="Disabled">Disabled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Enable HIPAA</InputLabel>
                  <Select
                    value={get(settings, 'private.env.ENABLE_HIPAA', 'No Value')}
                    onChange={(e) => updateSetting('private.env.ENABLE_HIPAA', e.target.value)}
                    label="Enable HIPAA"
                  >
                    <MenuItem value="No Value">No Value</MenuItem>
                    <MenuItem value="Enabled">Enabled</MenuItem>
                    <MenuItem value="Disabled">Disabled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Enable IPFS</InputLabel>
                  <Select
                    value={get(settings, 'private.env.ENABLE_IPFS', 'No Value')}
                    onChange={(e) => updateSetting('private.env.ENABLE_IPFS', e.target.value)}
                    label="Enable IPFS"
                  >
                    <MenuItem value="No Value">No Value</MenuItem>
                    <MenuItem value="Enabled">Enabled</MenuItem>
                    <MenuItem value="Disabled">Disabled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Initialize Consent Engine</InputLabel>
                  <Select
                    value={get(settings, 'private.env.INITIALIZE_CONSENT_ENGINE', 'No Value')}
                    onChange={(e) => updateSetting('private.env.INITIALIZE_CONSENT_ENGINE', e.target.value)}
                    label="Initialize Consent Engine"
                  >
                    <MenuItem value="No Value">No Value</MenuItem>
                    <MenuItem value="Enabled">Enabled</MenuItem>
                    <MenuItem value="Disabled">Disabled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Proxy Relay Enabled</InputLabel>
                  <Select
                    value={get(settings, 'private.env.PROXY_RELAY_ENABLED', 'No Value')}
                    onChange={(e) => updateSetting('private.env.PROXY_RELAY_ENABLED', e.target.value)}
                    label="Proxy Relay Enabled"
                  >
                    <MenuItem value="No Value">No Value</MenuItem>
                    <MenuItem value="Enabled">Enabled</MenuItem>
                    <MenuItem value="Disabled">Disabled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Authentication & Security */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>Authentication & Security</Typography>
              </Grid>
              
              {/* External Services */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>External Services</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="MAIL_URL"
                  value={get(settings, 'private.env.MAIL_URL', '')}
                  onChange={(e) => updateSetting('private.env.MAIL_URL', e.target.value)}
                  variant="outlined"
                  size="small"
                  placeholder="smtp://username:password@smtp.server.com:587"
                  helperText="SMTP server URL"
                  inputProps={{ autoComplete: 'off' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="EMAIL_FROM"
                  value={get(settings, 'private.env.EMAIL_FROM', '')}
                  onChange={(e) => updateSetting('private.env.EMAIL_FROM', e.target.value)}
                  variant="outlined"
                  size="small"
                  placeholder="noreply@yourdomain.com"
                  helperText="Default from address"
                  inputProps={{ autoComplete: 'off' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="GOOGLE_GEOCODING_API_KEY"
                  value={get(settings, 'private.env.GOOGLE_GEOCODING_API_KEY', '')}
                  onChange={(e) => updateSetting('private.env.GOOGLE_GEOCODING_API_KEY', e.target.value)}
                  variant="outlined"
                  size="small"
                  inputProps={{ autoComplete: 'off' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="GOOGLE_MAPS_API_KEY"
                  value={get(settings, 'private.env.GOOGLE_MAPS_API_KEY', '')}
                  onChange={(e) => updateSetting('private.env.GOOGLE_MAPS_API_KEY', e.target.value)}
                  variant="outlined"
                  size="small"
                  inputProps={{ autoComplete: 'off' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="OPENAI_API_KEY"
                  type="password"
                  value={get(settings, 'private.env.OPENAI_API_KEY', '')}
                  onChange={(e) => updateSetting('private.env.OPENAI_API_KEY', e.target.value)}
                  variant="outlined"
                  size="small"
                  inputProps={{ autoComplete: 'off' }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>Development Settings</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Dev Auto Login</InputLabel>
                  <Select
                    value={get(settings, 'private.env.DEV_AUTO_LOGIN', 'No Value')}
                    onChange={(e) => updateSetting('private.env.DEV_AUTO_LOGIN', e.target.value)}
                    label="Dev Auto Login"
                  >
                    <MenuItem value="No Value">No Value</MenuItem>
                    <MenuItem value="Enabled">Enabled</MenuItem>
                    <MenuItem value="Disabled">Disabled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Disable Authentication (Dev Only)</InputLabel>
                  <Select
                    value={get(settings, 'private.env.NOAUTH', 'No Value')}
                    onChange={(e) => updateSetting('private.env.NOAUTH', e.target.value)}
                    label="Disable Authentication (Dev Only)"
                  >
                    <MenuItem value="No Value">No Value</MenuItem>
                    <MenuItem value="Enabled">Enabled</MenuItem>
                    <MenuItem value="Disabled">Disabled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="DEV_AUTO_USERNAME"
                  value={get(settings, 'private.env.DEV_AUTO_USERNAME', '')}
                  onChange={(e) => updateSetting('private.env.DEV_AUTO_USERNAME', e.target.value)}
                  variant="outlined"
                  size="small"
                  disabled={get(settings, 'private.env.DEV_AUTO_LOGIN', 'No Value') !== 'Enabled'}
                  inputProps={{ autoComplete: 'off' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="DEV_AUTO_PASSWORD"
                  type="password"
                  value={get(settings, 'private.env.DEV_AUTO_PASSWORD', '')}
                  onChange={(e) => updateSetting('private.env.DEV_AUTO_PASSWORD', e.target.value)}
                  variant="outlined"
                  size="small"
                  disabled={get(settings, 'private.env.DEV_AUTO_LOGIN', 'No Value') !== 'Enabled'}
                  inputProps={{ autoComplete: 'off' }}
                />
              </Grid>
              
              {/* Debugging & Logging */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>Debugging & Logging</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Debug</InputLabel>
                  <Select
                    value={get(settings, 'private.env.DEBUG', 'No Value')}
                    onChange={(e) => updateSetting('private.env.DEBUG', e.target.value)}
                    label="Debug"
                  >
                    <MenuItem value="No Value">No Value</MenuItem>
                    <MenuItem value="Enabled">Enabled</MenuItem>
                    <MenuItem value="Disabled">Disabled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Debug Accounts</InputLabel>
                  <Select
                    value={get(settings, 'private.env.DEBUG_ACCOUNTS', 'No Value')}
                    onChange={(e) => updateSetting('private.env.DEBUG_ACCOUNTS', e.target.value)}
                    label="Debug Accounts"
                  >
                    <MenuItem value="No Value">No Value</MenuItem>
                    <MenuItem value="Enabled">Enabled</MenuItem>
                    <MenuItem value="Disabled">Disabled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Trace</InputLabel>
                  <Select
                    value={get(settings, 'private.env.TRACE', 'No Value')}
                    onChange={(e) => updateSetting('private.env.TRACE', e.target.value)}
                    label="Trace"
                  >
                    <MenuItem value="No Value">No Value</MenuItem>
                    <MenuItem value="Enabled">Enabled</MenuItem>
                    <MenuItem value="Disabled">Disabled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Exhaustive</InputLabel>
                  <Select
                    value={get(settings, 'private.env.EXHAUSTIVE', 'No Value')}
                    onChange={(e) => updateSetting('private.env.EXHAUSTIVE', e.target.value)}
                    label="Exhaustive"
                  >
                    <MenuItem value="No Value">No Value</MenuItem>
                    <MenuItem value="Enabled">Enabled</MenuItem>
                    <MenuItem value="Disabled">Disabled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Infrastructure */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>Infrastructure</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="METEOR_SIGTERM_GRACE_PERIOD_SECONDS"
                  type="number"
                  value={get(settings, 'private.env.METEOR_SIGTERM_GRACE_PERIOD_SECONDS', '30')}
                  onChange={(e) => updateSetting('private.env.METEOR_SIGTERM_GRACE_PERIOD_SECONDS', e.target.value)}
                  variant="outlined"
                  size="small"
                  helperText="Grace period for shutdown"
                  inputProps={{ autoComplete: 'off' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="TRUSTED_PROXIES"
                  value={get(settings, 'private.env.TRUSTED_PROXIES', '')}
                  onChange={(e) => updateSetting('private.env.TRUSTED_PROXIES', e.target.value)}
                  variant="outlined"
                  size="small"
                  placeholder="192.168.1.1,10.0.0.0/8"
                  helperText="Comma-separated proxy IPs"
                  inputProps={{ autoComplete: 'off' }}
                />
              </Grid>
              
              {/* Testing */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>Testing</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="CHROMEDRIVER_PATH"
                  value={get(settings, 'private.env.CHROMEDRIVER_PATH', '')}
                  onChange={(e) => updateSetting('private.env.CHROMEDRIVER_PATH', e.target.value)}
                  variant="outlined"
                  size="small"
                  helperText="Path to ChromeDriver"
                  inputProps={{ autoComplete: 'off' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>UDAP Test Mode</InputLabel>
                  <Select
                    value={get(settings, 'private.env.UDAP_TEST', 'No Value')}
                    onChange={(e) => updateSetting('private.env.UDAP_TEST', e.target.value)}
                    label="UDAP Test Mode"
                  >
                    <MenuItem value="No Value">No Value</MenuItem>
                    <MenuItem value="Enabled">Enabled</MenuItem>
                    <MenuItem value="Disabled">Disabled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Test Run Mode</InputLabel>
                  <Select
                    value={get(settings, 'private.env.TEST_RUN', 'No Value')}
                    onChange={(e) => updateSetting('private.env.TEST_RUN', e.target.value)}
                    label="Test Run Mode"
                  >
                    <MenuItem value="No Value">No Value</MenuItem>
                    <MenuItem value="Enabled">Enabled</MenuItem>
                    <MenuItem value="Disabled">Disabled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Custom Environment Variables</Typography>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Add any additional environment variables needed for your deployment
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Variable Name"
                  value={get(settings, 'temp.envVarName', '')}
                  onChange={(e) => updateSetting('temp.envVarName', e.target.value)}
                  variant="outlined"
                  size="small"
                  placeholder="MY_CUSTOM_VAR"
                  inputProps={{ autoComplete: 'off' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Variable Value"
                  value={get(settings, 'temp.envVarValue', '')}
                  onChange={(e) => updateSetting('temp.envVarValue', e.target.value)}
                  variant="outlined"
                  size="small"
                  placeholder="value"
                  inputProps={{ autoComplete: 'off' }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const varName = get(settings, 'temp.envVarName', '');
                    const varValue = get(settings, 'temp.envVarValue', '');
                    if (varName && varValue) {
                      updateSetting(`private.env.${varName}`, varValue);
                      updateSetting('temp.envVarName', '');
                      updateSetting('temp.envVarValue', '');
                    }
                  }}
                  disabled={!get(settings, 'temp.envVarName') || !get(settings, 'temp.envVarValue')}
                >
                  Add Variable
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </React.Fragment>
    );

    // 13. Deploy App (Hosting)
    const deployItem = checklistItems.find(item => item.id === 'deploy' && item.visible !== false);
    if (deployItem) {
      checklistItemsArray.push(
        <Alert 
          key={deployItem.id}
          severity={deployItem.completed ? "success" : "info"}
          icon={deployItem.completed ? <CheckCircle /> : <deployItem.icon />}
          sx={{ 
            backgroundColor: deployItem.completed ? undefined : 'action.hover',
            color: deployItem.completed ? undefined : 'text.primary',
            '& .MuiAlert-icon': {
              color: deployItem.completed ? undefined : 'text.secondary'
            }
          }}
          action={
            !deployItem.completed && (
              <Button 
                color="inherit" 
                size="small"
                onClick={deployItem.action}
              >
                Learn More
              </Button>
            )
          }
        >
          <span>{deployItem.label}</span>
        </Alert>
      );
    }
    
    // Reorganize checklist items according to new structure
    const readManualItem = checklistItemsArray[0]; // Read The Manual
    
    // Public Settings (App)
    const publicSettingsItems = [];
    if (checklistItemsArray[2]) publicSettingsItems.push(checklistItemsArray[2]); // App Configuration
    if (checklistItemsArray[3]) publicSettingsItems.push(checklistItemsArray[3]); // Theme and Color Palette  
    if (checklistItemsArray[5]) publicSettingsItems.push(checklistItemsArray[5]); // Default App Modules
    if (checklistItemsArray[4]) publicSettingsItems.push(checklistItemsArray[4]); // Sidebar Configuration
    if (checklistItemsArray[9]) publicSettingsItems.push(checklistItemsArray[9]); // Business & Legal Pages
    if (checklistItemsArray[10]) publicSettingsItems.push(checklistItemsArray[10]); // Upstream Tether (SMART on FHIR)
    
    // Private Settings (Server)
    const privateSettingsItems = [];
    if (checklistItemsArray[8]) privateSettingsItems.push(checklistItemsArray[8]); // Server FHIR APIs
    if (checklistItemsArray[6]) privateSettingsItems.push(checklistItemsArray[6]); // User Accounts (Register a New User)
    // Security - placeholder for future implementation
    const securityItem = null; // TODO: Add security configuration item
    if (securityItem) privateSettingsItems.push(securityItem);
    // Database - placeholder for future implementation  
    const databaseItem = null; // TODO: Add database configuration item
    if (databaseItem) privateSettingsItems.push(databaseItem);
    if (checklistItemsArray[11]) privateSettingsItems.push(checklistItemsArray[11]); // Environment Variables
    if (checklistItemsArray[7]) privateSettingsItems.push(checklistItemsArray[7]); // Interfaces
    
    // Settings File and Deploy
    const settingsFileItem = checklistItemsArray[1]; // Initialize Settings File
    const deployAppItem = checklistItemsArray[12]; // Deploy App (Hosting)
    
    setupChecklistElements = <Grid item xs={12}>
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Setup Checklist" 
          action={
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                // Apply public settings to Meteor.settings.public
                if (settings.public) {
                  // Ensure Meteor.settings exists
                  if (!Meteor.settings) {
                    Meteor.settings = {};
                  }
                  if (!Meteor.settings.public) {
                    Meteor.settings.public = {};
                  }
                  
                  // Deep merge the public settings
                  Object.keys(settings.public).forEach(key => {
                    Meteor.settings.public[key] = settings.public[key];
                  });
                  
                  // Store the updated settings in Session for reactivity
                  Session.set('Meteor.settings.public', settings.public);
                  
                  // Trigger a refresh
                  Session.set('settingsRefreshRequest', Date.now());
                  
                  // Trigger theme refresh specifically (following ThemingPage pattern)
                  Session.set('themeRefreshRequest', true);
                  
                  // Show success message
                  setShowSuccessMessage(true);
                }
              }}
            >
              Write to Public Settings
            </Button>
          }
        />
        <CardContent>
          <Stack spacing={3}>
            {/* Read The Manual */}
            {readManualItem && (
              <Box>
                {readManualItem}
              </Box>
            )}
            
            {/* Shell Command Display */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Shell Command"
                value={shellCommand}
                variant="outlined"
                InputProps={{
                  readOnly: true,
                  sx: {
                    fontFamily: 'monospace',
                    backgroundColor: 'action.hover',
                    '& .MuiOutlinedInput-input': {
                      fontSize: '0.9rem',
                      letterSpacing: '0.05em'
                    }
                  }
                }}
                helperText="Launch command that will be generated based on your configuration"
              />
            </Box>
            
            {/* Public Settings (App) */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
                Public Settings (App)
              </Typography>
              <Stack spacing={2} sx={{ pl: 2 }}>
                {publicSettingsItems.filter(item => item)}
              </Stack>
            </Box>
            
            {/* Private Settings (Server) */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
                Private Settings (Server)
              </Typography>
              <Stack spacing={2} sx={{ pl: 2 }}>
                {privateSettingsItems.filter(item => item)}
              </Stack>
            </Box>
            
            {/* Settings File */}
            {settingsFileItem && (
              <Box>
                {settingsFileItem}
              </Box>
            )}
            
            {/* Deploy App (Hosting) */}
            {deployAppItem && (
              <Box>
                {deployAppItem}
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  }

  
  //----------------------------------------------------------------------
  // Main Render Method  

  return (
    <Box id='GettingStartedPage' sx={{
      height: '100vh',
      overflow: 'auto',
      px: 5,
      pb: 10,
      bgcolor: 'background.default'
    }}>
      <Grid container spacing={3} justify="center" style={{paddingBottom: '80px'}}>
          <Grid item xs={12} justify="center">
          </Grid>

          { setupChecklistElements }

          {/* Quick Actions */}
          <Grid item xs={12}>
            <Box sx={{ mb: 4 }}>
              <Stack direction="row" spacing={2}>
                <Button 
                  variant="outlined" 
                  color="primary"
                  size="large"
                  startIcon={<ListAlt />}
                  onClick={() => navigate('/index')}
                  sx={{ textTransform: 'none' }}
                >
                  Site Index
                </Button>
              </Stack>
            </Box>
          </Grid>




      </Grid>
      
      {/* Color Picker Dialog */}
      <Dialog open={colorPickerOpen} onClose={() => setColorPickerOpen(false)}>
        <DialogTitle>Choose Color</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, pt: 2 }}>
          <Wheel
            color={tempColor}
            onChange={(color) => setTempColor(color.hsva)}
          />
          <ShadeSlider
            hsva={tempColor}
            onChange={(newShade) => setTempColor({ ...tempColor, ...newShade })}
            style={{ width: '100%' }}
          />
          <TextField
            fullWidth
            label="Color Value"
            value={hsvaToHex(tempColor)}
            disabled
            variant="outlined"
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setColorPickerOpen(false)}>Cancel</Button>
          <Button onClick={applySelectedColor} variant="contained">Apply</Button>
        </DialogActions>
      </Dialog>
      
      {/* Success Snackbar */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={6000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccessMessage(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Settings applied successfully! Theme updated.
        </Alert>
      </Snackbar>
    </Box>      
  );
}

export default GettingStartedPage;