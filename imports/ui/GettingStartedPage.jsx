import React from 'react';

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
  Stack
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
  CloudUpload               // for deployment
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
      id: 'settings',
      label: 'Add a settings file',
      completed: hasTitle,
      icon: Settings,
      action: () => window.open('https://docs.honeycomb.health/configuration', '_blank')
    },
    {
      id: 'theme',
      label: 'Add a theme and color palette',
      completed: hasTheme,
      icon: Palette,
      action: () => navigate('/theming')
    },
    {
      id: 'register',
      label: 'Register new user',
      completed: hasRegisteredUsers,
      icon: AccountCircle,
      action: () => navigate('/register'),
      visible: accountsEnabled
    },
    {
      id: 'workflow',
      label: 'Add workflow module',
      completed: hasWorkflowModule,
      icon: ViewModule,
      action: () => window.open('https://docs.honeycomb.health/modules', '_blank')
    },
    {
      id: 'deploy',
      label: 'Deploy app',
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
    setupChecklistElements = <Grid item xs={12}>
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Setup Checklist" />
        <CardContent>
          <Stack spacing={2}>
            {checklistItems.filter(item => item.visible !== false).map((item) => (
              <Alert 
                key={item.id}
                severity={item.completed ? "success" : "warning"}
                icon={item.completed ? <CheckCircle /> : <Warning />}
                action={
                  !item.completed && (
                    <Button 
                      color="inherit" 
                      size="small"
                      onClick={item.action}
                    >
                      {item.id === 'register' ? 'Register' : 'Learn More'}
                    </Button>
                  )
                }
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <item.icon fontSize="small" />
                  <span>{item.label}</span>
                </Stack>
              </Alert>
            ))}
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
                  onClick={() => navigate('/smart-launch')}
                  sx={{ textTransform: 'none' }}
                >
                  SMART Launch
                </Button>
              </Stack>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <InvisibleCard margin={20} >
                <CardHeader title="Read The Manual" subheader="Don't say that you couldn't find the documentation or you didn't read the manual." style={{marginTop: '20px', marginBottom: '0px'}} />
                <CardContent>

                <Table size="small" >
                  <TableHead>
                    <TableRow >
                      <TableCell style={{fontWeight: 'bold'}} >Icon</TableCell>
                      <TableCell style={{fontWeight: 'bold', minWidth: '320px'}} >Feature</TableCell>
                      <TableCell style={{fontWeight: 'bold'}} >Vendor</TableCell>
                      <TableCell style={{fontWeight: 'bold'}} >Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow style={featureRowStyle} onClick={function(){ window.open("https://www.hl7.org/fhir/", "_blank"); }} hover >
                      <TableCell><LocalFireDepartment /></TableCell>
                      <TableCell>Fast Healthcare Interoperability Resources</TableCell>
                      <TableCell>HL7</TableCell>
                      <TableCell>ANSI Certified Standards.  Required by U.S. federal law, pertaining to MACRA and 21st Century Cures and other federal laws.  Detailed documentation on data schemas and APIs used in healthcare and mandated by the federal government. </TableCell>                  
                    </TableRow>
                    <TableRow style={featureRowStyle} onClick={function(){ window.open("https://docs.smarthealthit.org/client-js/", "_blank"); }} hover >
                      <TableCell><LocalHospital /></TableCell>
                      <TableCell>EHR Interoperability</TableCell>
                      <TableCell>Smart Health IT</TableCell>
                      <TableCell>Uses industry standard libraries for fetching data from Medicare, Medicaid, Apple HealthRecords, and hospitals running a Cerner, Epic, or other FHIR compliant EHR.</TableCell>                  
                    </TableRow>
                    <TableRow style={featureRowStyle} onClick={function(){ window.open("https://www.mongodb.com/basics/mongodb-atlas-tutorial", "_blank"); }} hover >
                      <TableCell><Storage /></TableCell>
                      <TableCell>Document Oriented Database</TableCell>
                      <TableCell>Mongo</TableCell>
                      <TableCell>Ann ultra-scalable JSON database that stores FHIR data as-is in a NoSQL format.  Easily convert a server database into an enterprise grade datalake.</TableCell>                  
                    </TableRow>
                    <TableRow style={featureRowStyle} onClick={function(){ window.open("https://guide.meteor.com/cordova.html", "_blank"); }} hover >
                      <TableCell><PhoneIphone /></TableCell>
                      <TableCell>Multiple Device Pipelines</TableCell>
                      <TableCell>Meteor.js</TableCell>
                      <TableCell>Write once and run anywhere, using the Apache Cordova/PhoneGap bridging libraries; with pipelines for compiling the software to desktops, mobile devices, and webTV.</TableCell>                  
                    </TableRow>
                    <TableRow style={featureRowStyle} onClick={function(){ window.open("https://reactjs.org/", "_blank"); }} hover >
                      <TableCell><Extension /></TableCell>
                      <TableCell>Modular Reusable Components (React.js)</TableCell>
                      <TableCell>Facebook / Meta</TableCell>
                      <TableCell>Built with modular reusable components using React (from Facebook).  Proven web technology used by billions of people.  Components progressively get better with time rather than become a speghetti mess.</TableCell>                  
                    </TableRow>
                    <TableRow style={featureRowStyle} onClick={function(){ window.open("http://web-accessibility.carnegiemuseums.org/foundations/aria/", "_blank"); }} hover >
                      <TableCell><Accessibility /></TableCell>
                      <TableCell>Accessibility</TableCell>
                      <TableCell>Carnegie Museums of Pittsburgh</TableCell>
                      <TableCell>Includes accessibility best practices via Accessible Rich Internet Applications (ARIA) specification.  Supports screen readers, low visibility modes, voice prompts, etc.</TableCell>                  
                    </TableRow>
                    <TableRow style={featureRowStyle} onClick={function(){ window.open("https://mui.com/", "_blank"); }} hover >
                      <TableCell><Apps /></TableCell>
                      <TableCell>Material Design</TableCell>
                      <TableCell>Google</TableCell>
                      <TableCell>Designed with a modern toolkit of user interface components based on the Material Design specification from Google.</TableCell>                  
                    </TableRow>
                    <TableRow style={featureRowStyle} onClick={function(){ window.open("https://react-icons-kit.vercel.app/", "_blank"); }} hover >
                      <TableCell><TextFields /></TableCell>
                      <TableCell>Icons, Fonts, & Typography</TableCell>
                      <TableCell></TableCell>
                      <TableCell>Includes rich typography and fonts and extended icon support to make your applications look beautiful.</TableCell>                  
                    </TableRow>
                    <TableRow style={featureRowStyle} onClick={function(){ window.open("", "_blank"); }} hover >
                      <TableCell><AccountTree /></TableCell>
                      <TableCell>A/B Testing Infrastructure</TableCell>
                      <TableCell></TableCell>
                      <TableCell>Built from the ground up around containerization and an application-wide settings, to allow different containers to run the software with different settings.  Perfect for A/B testing methodologies.</TableCell>                  
                    </TableRow>
                    <TableRow style={featureRowStyle} onClick={function(){ window.open("https://docs.meteor.com/api/email.html", "_blank"); }} hover >
                      <TableCell><Chat /></TableCell>
                      <TableCell>Email, Chat & SMS Integration</TableCell>
                      <TableCell></TableCell>
                      <TableCell>Support inbound and outbound messaging via the FHIR Communication resource and integration with MailChimp, Twilio, and other messaging platforms.</TableCell>                  
                    </TableRow>
                    <TableRow style={featureRowStyle} onClick={function(){ window.open("https://github.com/clinical-meteor/hipaa", "_blank"); }} hover >
                      <TableCell><ShoppingCart /></TableCell>
                      <TableCell>HIPAA Logger</TableCell>
                      <TableCell></TableCell>
                      <TableCell>HIPAA compliant using a HIPAA audit log, user accounts, and encrypted data at rest and over the wire.</TableCell>                  
                    </TableRow>

                    <TableRow style={rowStyle}>
                      <TableCell><Dashboard /></TableCell>
                      <TableCell>Realtime Dashboards</TableCell>
                      <TableCell></TableCell>
                      <TableCell>Build data rich dashboards using D3 charts from Stanford.  Chose Chart.js or Nivo for reusable charts that make creating dashboards a breeze.</TableCell>                  
                    </TableRow>
                    <TableRow style={rowStyle} >
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
                </CardContent>
            </InvisibleCard>
          </Grid>



      </Grid>
    </Box>      
  );
}

export default GettingStartedPage;