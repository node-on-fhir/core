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
  FormGroup
} from '@mui/material';

import { get } from 'lodash';
import { useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
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
  Tune,                     // for app configuration
  Api,                      // for server APIs
  Computer,                 // for interfaces
  Dns,                      // for server configuration
  Download                  // for download settings
} from '@mui/icons-material';


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
Meteor.startup(function(){
  DynamicSpacer = Meteor.DynamicSpacer;
})



function GettingStartedPage(props){
  const navigate = useNavigate();
  
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
  
  // State for settings (initialized from Meteor.settings)
  const [settings, setSettings] = React.useState(() => {
    const initialSettings = JSON.parse(JSON.stringify(get(Meteor, 'settings', {})));
    // Ensure private.fhir.rest structure exists
    if (!initialSettings.private) initialSettings.private = {};
    if (!initialSettings.private.fhir) initialSettings.private.fhir = {};
    if (!initialSettings.private.fhir.rest) initialSettings.private.fhir.rest = {};
    return initialSettings;
  });
  
  // Check completion status for configuration sections
  const hasAppConfig = get(Meteor, 'settings.public.title') && 
                      get(Meteor, 'settings.public.fhirVersion') && 
                      get(Meteor, 'settings.public.loggingThreshold');
                      
  const hasModulesConfig = get(Meteor, 'settings.public.modules.fhir') || 
                          get(Meteor, 'settings.public.modules.PatientDirectory');
                          
  const hasServerApisConfig = get(Meteor, 'settings.private.fhir.fhirPath') || 
                             get(Meteor, 'settings.private.fhir.rest') ||
                             get(settings, 'private.fhir.fhirPath') ||
                             get(settings, 'private.fhir.rest');
                             
  const hasInterfacesConfig = get(Meteor, 'settings.public.interfaces.default.channel.endpoint');

  // Helper function to update nested settings
  const updateSetting = (path, value) => {
    const newSettings = JSON.parse(JSON.stringify(settings));
    const pathParts = path.split('.');
    let current = newSettings;
    
    // Ensure all nested paths exist
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }
    
    current[pathParts[pathParts.length - 1]] = value;
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
  };

  // Function to download settings as JSON file
  const downloadSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'settings.honeycomb.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
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


  let hasTitle = get(Meteor, 'settings.public.title', false);
  let hasTheme = get(Meteor, 'settings.public.theme', false);
  let hasWorkflowModule = get(Meteor, 'settings.public.modules.workflow', false);
  let hasDeployment = get(Meteor, 'settings.public.deployed', false);
  
  // Check if there are any registered users
  const hasRegisteredUsers = useTracker(() => {
    return accountsEnabled && Meteor.users && Meteor.users.find().count() > 0;
  });

  // Setup checklist items
  const checklistItems = [
    {
      id: 'theme',
      label: 'Theme and Color Palette',
      completed: hasTheme,
      icon: Palette,
      action: () => navigate('/theming')
    },
    {
      id: 'settings',
      label: 'Initialize Settings File',
      completed: hasTitle,
      icon: Settings,
      action: () => window.open('https://docs.honeycomb.health/configuration', '_blank')
    },
    {
      id: 'register',
      label: 'Register a New User',
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
            severity={settingsItem.completed ? "success" : "warning"}
            icon={settingsItem.completed ? <CheckCircle /> : <Warning />}
            sx={{ 
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: settingsItem.completed ? undefined : 'warning.lighter'
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
            <Stack direction="row" alignItems="center" spacing={1}>
              <settingsItem.icon fontSize="small" />
              <span>{settingsItem.label}</span>
            </Stack>
          </Alert>
          <Collapse in={settingsFileExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ pl: 2, pr: 2, mt: -1, mb: 0 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Paste your Meteor settings JSON file here. Only the public settings will be loaded into the configuration.
              </Typography>
              
              <AceEditor
                mode="json"
                theme={get(Meteor, 'settings.public.defaults.darkroom', false) ? "monokai" : "github"}
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
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  Note: Private settings are shown but cannot be applied to the client environment.
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    // Reset to current Meteor.settings
                    const currentSettings = JSON.parse(JSON.stringify(get(Meteor, 'settings', {})));
                    setSettings(currentSettings);
                  }}
                >
                  Reset to Current
                </Button>
              </Box>
            </Box>
          </Collapse>
        </React.Fragment>
      );
    }
    
    // 3. App Configuration (with collapse)
    checklistItemsArray.push(
      <React.Fragment key="app-config-section">
        <Alert 
          severity={hasAppConfig ? "success" : "info"}
          icon={hasAppConfig ? <CheckCircle /> : <Tune />}
          sx={{ 
            backgroundColor: hasAppConfig ? undefined : 'action.hover',
            color: hasAppConfig ? undefined : 'text.primary',
            cursor: 'pointer',
            '& .MuiAlert-icon': {
              color: hasAppConfig ? undefined : 'text.secondary'
            },
            '&:hover': {
              backgroundColor: hasAppConfig ? undefined : 'action.selected'
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
          <Stack direction="row" alignItems="center" spacing={1}>
            <span>App Configuration</span>
          </Stack>
        </Alert>
        <Collapse in={appConfigExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ pl: 2, pr: 2, mt: -1, mb: 0 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
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
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={get(settings, 'public.defaults.displayNavbars', true)}
                      onChange={(e) => updateSetting('public.defaults.displayNavbars', e.target.checked)}
                    />
                  }
                  label="Display Navigation Bars"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={get(settings, 'public.defaults.prominentHeader', false)}
                      onChange={(e) => updateSetting('public.defaults.prominentHeader', e.target.checked)}
                    />
                  }
                  label="Prominent Header"
                />
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </React.Fragment>
    );
    
    // 4. Theme and Color Palette (with collapse)
    const themeItem = checklistItems.find(item => item.id === 'theme' && item.visible !== false);
    if (themeItem) {
      checklistItemsArray.push(
        <React.Fragment key="theme-section">
          <Alert 
            severity={themeItem.completed ? "success" : "warning"}
            icon={themeItem.completed ? <CheckCircle /> : <Warning />}
            sx={{ 
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: themeItem.completed ? undefined : 'warning.lighter'
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
            <Stack direction="row" alignItems="center" spacing={1}>
              <themeItem.icon fontSize="small" />
              <span>{themeItem.label}</span>
            </Stack>
          </Alert>
          <Collapse in={themeExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ pl: 2, pr: 2, mt: -1, mb: 0 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Color Palette</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Primary Color"
                    value={get(settings, 'public.theme.palette.primaryColor', '')}
                    onChange={(e) => updateSetting('public.theme.palette.primaryColor', e.target.value)}
                    variant="outlined"
                    size="small"
                    helperText="Main brand color (e.g., rgb(30,150,240))"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Primary Text"
                    value={get(settings, 'public.theme.palette.primaryText', '')}
                    onChange={(e) => updateSetting('public.theme.palette.primaryText', e.target.value)}
                    variant="outlined"
                    size="small"
                    helperText="Text color on primary background"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Secondary Color"
                    value={get(settings, 'public.theme.palette.secondaryColor', '')}
                    onChange={(e) => updateSetting('public.theme.palette.secondaryColor', e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Secondary Text"
                    value={get(settings, 'public.theme.palette.secondaryText', '')}
                    onChange={(e) => updateSetting('public.theme.palette.secondaryText', e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="App Bar Color"
                    value={get(settings, 'public.theme.palette.appBarColor', '')}
                    onChange={(e) => updateSetting('public.theme.palette.appBarColor', e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="App Bar Text Color"
                    value={get(settings, 'public.theme.palette.appBarTextColor', '')}
                    onChange={(e) => updateSetting('public.theme.palette.appBarTextColor', e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Card Color"
                    value={get(settings, 'public.theme.palette.cardColor', '')}
                    onChange={(e) => updateSetting('public.theme.palette.cardColor', e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Card Text Color"
                    value={get(settings, 'public.theme.palette.cardTextColor', '')}
                    onChange={(e) => updateSetting('public.theme.palette.cardTextColor', e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Paper Color"
                    value={get(settings, 'public.theme.palette.paperColor', '')}
                    onChange={(e) => updateSetting('public.theme.palette.paperColor', e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Paper Text Color"
                    value={get(settings, 'public.theme.palette.paperTextColor', '')}
                    onChange={(e) => updateSetting('public.theme.palette.paperTextColor', e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Error Color"
                    value={get(settings, 'public.theme.palette.errorColor', '')}
                    onChange={(e) => updateSetting('public.theme.palette.errorColor', e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Error Text"
                    value={get(settings, 'public.theme.palette.errorText', '')}
                    onChange={(e) => updateSetting('public.theme.palette.errorText', e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Background Canvas"
                    value={get(settings, 'public.theme.palette.backgroundCanvas', '')}
                    onChange={(e) => updateSetting('public.theme.palette.backgroundCanvas', e.target.value)}
                    variant="outlined"
                    size="small"
                    helperText="Main background color"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>Theme Settings</Typography>
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
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={get(settings, 'public.theme.showVideoBackground', false)}
                        onChange={(e) => updateSetting('public.theme.showVideoBackground', e.target.checked)}
                      />
                    }
                    label="Show Video Background"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
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
                <Grid item xs={12} md={6}>
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
              </Grid>
            </Box>
          </Collapse>
        </React.Fragment>
      );
    }
    
    // 5. Default App Modules (with collapse)
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
            <Typography variant="subtitle2" gutterBottom>FHIR Resources</Typography>
            <Grid container spacing={2}>
              {['Patients', 'Practitioners', 'Organizations', 'Encounters', 'Conditions', 'Procedures', 'Observations', 'Medications'].map((resource) => (
                <Grid item xs={6} md={3} key={resource}>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={get(settings, `public.modules.fhir.${resource}`, true)}
                        onChange={(e) => updateSetting(`public.modules.fhir.${resource}`, e.target.checked)}
                      />
                    }
                    label={resource}
                  />
                </Grid>
              ))}
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>Other Modules</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={get(settings, 'public.modules.PatientDirectory', true)}
                      onChange={(e) => updateSetting('public.modules.PatientDirectory', e.target.checked)}
                    />
                  }
                  label="Patient Directory"
                />
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </React.Fragment>
    );
    
    // (This section moved to position 2)
    
    // 6. Register a New User
    const registerItem = checklistItems.find(item => item.id === 'register' && item.visible !== false);
    if (registerItem) {
      checklistItemsArray.push(
        <Alert 
          key={registerItem.id}
          severity={registerItem.completed ? "success" : "warning"}
          icon={registerItem.completed ? <CheckCircle /> : <Warning />}
          action={
            !registerItem.completed && (
              <Button 
                color="inherit" 
                size="small"
                onClick={registerItem.action}
              >
                Register
              </Button>
            )
          }
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <registerItem.icon fontSize="small" />
            <span>{registerItem.label}</span>
          </Stack>
        </Alert>
      );
    }
    
    // 7. Interfaces (with collapse)
    checklistItemsArray.push(
      <React.Fragment key="interfaces-section">
        <Alert 
          severity={hasInterfacesConfig ? "success" : "info"}
          icon={hasInterfacesConfig ? <CheckCircle /> : <Computer />}
          sx={{ 
            backgroundColor: hasInterfacesConfig ? undefined : 'action.hover',
            color: hasInterfacesConfig ? undefined : 'text.primary',
            cursor: 'pointer',
            '& .MuiAlert-icon': {
              color: hasInterfacesConfig ? undefined : 'text.secondary'
            },
            '&:hover': {
              backgroundColor: hasInterfacesConfig ? undefined : 'action.selected'
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
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Default Interface Endpoint"
                  value={get(settings, 'public.interfaces.default.channel.endpoint', '')}
                  onChange={(e) => updateSetting('public.interfaces.default.channel.endpoint', e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Interface Username"
                  value={get(settings, 'public.interfaces.default.auth.username', '')}
                  onChange={(e) => updateSetting('public.interfaces.default.auth.username', e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Interface Password"
                  type="password"
                  value={get(settings, 'public.interfaces.default.auth.password', '')}
                  onChange={(e) => updateSetting('public.interfaces.default.auth.password', e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </React.Fragment>
    );
    
    // 8. Server FHIR APIs (with collapse)
    checklistItemsArray.push(
      <React.Fragment key="server-apis-section">
        <Alert 
          severity={hasServerApisConfig ? "success" : "info"}
          icon={hasServerApisConfig ? <CheckCircle /> : <Api />}
          sx={{ 
            backgroundColor: hasServerApisConfig ? undefined : 'action.hover',
            color: hasServerApisConfig ? undefined : 'text.primary',
            cursor: 'pointer',
            '& .MuiAlert-icon': {
              color: hasServerApisConfig ? undefined : 'text.secondary'
            },
            '&:hover': {
              backgroundColor: hasServerApisConfig ? undefined : 'action.selected'
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
    
    // 9. Deploy App
    const deployItem = checklistItems.find(item => item.id === 'deploy' && item.visible !== false);
    if (deployItem) {
      checklistItemsArray.push(
        <Alert 
          key={deployItem.id}
          severity={deployItem.completed ? "success" : "warning"}
          icon={deployItem.completed ? <CheckCircle /> : <Warning />}
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
          <Stack direction="row" alignItems="center" spacing={1}>
            <deployItem.icon fontSize="small" />
            <span>{deployItem.label}</span>
          </Stack>
        </Alert>
      );
    }
    
    setupChecklistElements = <Grid item xs={12}>
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Setup Checklist" />
        <CardContent>
          <Stack spacing={2.5}>
            {checklistItemsArray}
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
            <br />
            <h2 >
              Welcome!  Let's get building some sort of space-aged healthcare app.
            </h2>
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
                <Button 
                  variant="outlined" 
                  color="primary"
                  size="large"
                  startIcon={<Security />}
                  onClick={() => navigate('/smart-launcher-debugger')}
                  sx={{ textTransform: 'none' }}
                >
                  SMART Launch
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary"
                  size="large"
                  startIcon={<Download />}
                  onClick={downloadSettings}
                  sx={{ textTransform: 'none' }}
                >
                  Download Settings File
                </Button>
              </Stack>
            </Box>
          </Grid>




      </Grid>
    </Box>      
  );
}

export default GettingStartedPage;