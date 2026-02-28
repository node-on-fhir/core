// EPIC ENDPOINTS
// https://open.epic.com/Endpoints/R4

// CERNER ENDPOINTS - PATIENT LAUNCH
// https://github.com/oracle-samples/ignite-endpoints/blob/main/millennium_patient_r4_endpoints.json

// CERNER ENDPOINTS - PROVIDER LAUNCH
// https://github.com/oracle-samples/ignite-endpoints/blob/main/millennium_provider_r4_endpoints.json



import React, { useState, useEffect } from 'react';
import { Random } from 'meteor/random'

import { useFormik, FormikErrors } from 'formik';

import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardHeader,
  CardContent,
  CardMedia,
  Container,
  Grid,
  Tab,
  Tabs,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Image,
  Typography,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputAdornment,
  Input,
  InputLabel,
  IconButton
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import ClassIcon from '@mui/icons-material/Class';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import LocalPlayIcon from '@mui/icons-material/LocalPlay';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { get, has } from 'lodash';

import { useTracker } from 'meteor/react-meteor-data';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import jwt from 'jsonwebtoken';

import { Icon } from 'react-icons-kit';
import { home } from 'react-icons-kit/icomoon/home';
import {ic_vpn_key} from 'react-icons-kit/md/ic_vpn_key';

import {keyOutline} from 'react-icons-kit/typicons/keyOutline'
import {key} from 'react-icons-kit/typicons/key'

import "ace-builds";
import 'ace-builds/src-noconflict/mode-json'

import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/theme-monokai";


import { fetch, Headers } from 'meteor/fetch';

import forge from 'node-forge';

let pki = forge.pki;

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import { Endpoints } from '../lib/schemas/SimpleSchemas/Endpoints';
import { SubscriptionsTable } from './SubscriptionsTable';

import { useNavigate, useSearchParams } from "react-router-dom";
import { DynamicSpacer } from '../ui/DynamicSpacer';
import WorkflowRegistry from '/imports/lib/WorkflowRegistry.js';


//----------------------------------------------------------------------
// Helper Components

let useTheme;
Meteor.startup(function(){
  useTheme = Meteor.useTheme;
})


function ServerConfigurationPage(props){
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme, toggleTheme } = useTheme();

  let [ wellKnownUdapUrl, setWellKnownUdapUrl ] = useState(Meteor.absoluteUrl() + ".well-known/udap");
  let [ certificate, setCertificate ] = useState([]);
  let [ publicKey, setPublicKey ] = useState("");
  let [ privateKey, setPrivateKey ] = useState("");
  let [ serverHasPublicKey, setServerHasPublicKey] = useState(false);
  let [ serverHasPrivateKey, setServerHasPrivateKey] = useState(false);
  let [ serverHasPublicCert, setServerHasPublicCert] = useState(false);

  let [ publicKeyText, setPublicKeyText ] = useState("");
  let [ privateKeyText, setPrivateKeyText ] = useState("");
  let [ publicCertPem, setPublicCertPem ] = useState("");

  let [ publicKeyJwk, setPublicKeyJwk ] = useState(null);
  let [ copySuccess, setCopySuccess ] = useState(false);
  let [ copyMessage, setCopyMessage ] = useState("");

  let [checked, setChecked] = React.useState(true);
  let [defaultDirectoryQuery, setDefaultDirectoryQuery] = React.useState(get(Meteor, 'settings.public.interfaces.upstreamDirectory.channel.path', ""));

  let handleChange = (event) => {
    setChecked(event.target.checked);
  };

  // Collect extension tabs with package name metadata
  let extensionTabs = [];
  Object.keys(Package).forEach(function(packageName){
    if(Package[packageName].ServerConfigs){
      extensionTabs.push({
        label: packageName,
        slug: packageName,
        components: Package[packageName].ServerConfigs
      });
    }
  });

  // Also collect server configs from NPM workflow packages via WorkflowRegistry
  WorkflowRegistry.getServerConfigsWithNames().forEach(function(entry){
    extensionTabs.push({
      label: entry.name,
      slug: entry.name,
      components: entry.components
    });
  });

  // Build slug-to-index map for URL param sync
  let coreTabSlugs = ['keys-certs', 'smart-on-fhir', 'upstream', 'tefca', 'init-data'];
  let tabSlugMap = {};
  coreTabSlugs.forEach(function(slug, i){
    tabSlugMap[slug] = i;
  });
  extensionTabs.forEach(function(ext, i){
    tabSlugMap[ext.slug] = 5 + i;
  });

  // Resolve activeTab from URL ?tab= param
  let tabParam = searchParams.get('tab');
  let activeTab = 0;
  if(tabParam && tabSlugMap.hasOwnProperty(tabParam)){
    activeTab = tabSlugMap[tabParam];
  }

  useEffect(function(){
    if(Meteor.isClient){
      Meteor.call('hasServerKeys', function(error, result){
        if(result){
          // console.log('.ServerConfigurationPage.useEffect', result);
          setServerHasPublicKey(get(result, 'x509.publicKey'));
          setServerHasPrivateKey(get(result, 'x509.privateKey'));
          setServerHasPublicCert(get(result, 'x509.publicCertPem'))
          setPublicKeyText(get(result, 'x509.publicKey'))
          setPublicCertPem(get(result, 'x509.publicCertPem'))
          
          // Fetch JWK representation
          if(get(result, 'x509.publicCertPem')){
            Meteor.call('getJwkFromCertificate', function(error, jwkResult){
              if(jwkResult){
                setPublicKeyJwk(jwkResult);
              }
            });
          }
        }
      })  
    }    


  }, []);

  let currentUser = useTracker(function(){
    return Session.get('currentUser');
  }, []);

  let subscriptionChannelResourceType = useTracker(function(){
    return Session.get('SubscriptionChannelResourceType');
  }, []);

  defaultDirectoryQuery = useTracker(function(){
    return Session.get('MainSearch.defaultDirectoryQuery');
  }, []);

  function openExternalPage(url){
    logger.debug('client.app.layout.ServerConfigurationPage.openExternalPage', url);
    window.open(url);
    // navigate(url, { replace: true });
  }


  //----------------------------------------------------------------------
  // Main Render Method  

  

  let tagLineStyle = {
    fontWeight: 'normal',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: '0px',
    marginBottom: '40px'
  }

  let featureRowStyle = {
    height: '52px'
  }

  function openPage(url){
    navigate(url, { replace: true });
  }
  
  function copyToClipboard(text, message){
    navigator.clipboard.writeText(text).then(function() {
      setCopyMessage(message || "Copied to clipboard!");
      setCopySuccess(true);
    }, function(err) {
      console.error('Could not copy text: ', err);
    });
  }

  function handelUpdateWellKnownUdapUrl(event){
    setWellKnownUdapUrl(event.currentTarget.value)
  }
  async function handleFetchWellknownUdap(){
    console.log('wellKnownUdapUrl', wellKnownUdapUrl);

    // HTTP.get(wellKnownUdapUrl, function(error, result){
    //   if(error){
    //     console.log('handleFetchWellknownUdap.error', error)
    //   }
    //   if(result){
    //     console.log('handleFetchWellknownUdap.result.data', get(result, 'data'))

    //     alert(result.data.x5c[0]);
        
    //     if(Array.isArray(get(result, 'data.x5c'))){
    //       console.log('x.509 cert: ' + result.data.x5c[0]);
    //       setCertificate(result.data.x5c);          
    //     }
        
    //   }
    // })

    await fetch(wellKnownUdapUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => response.json())
    .then(result => {
      console.log('Success:', result);
      
      console.log('handleFetchWellknownUdap.result.data', get(result, 'data'))

      alert(result.data.x5c[0]);
      
      if(Array.isArray(get(result, 'data.x5c'))){
        console.log('x.509 cert: ' + result.data.x5c[0]);
        setCertificate(result.data.x5c);          
      }
    }).catch((error) => {
      console.error('Error:', error);
    });
  }
  function generateKeys(){
    let keys = pki.rsa.generateKeyPair(2048);
    console.log('keys', keys)

    var publicKeyText = pki.publicKeyToPem(keys.publicKey);
    console.log('publicKeyText', JSON.stringify(publicKeyText))

    setPublicKeyText(JSON.stringify(publicKeyText))

    var privateKeyText = pki.privateKeyToPem(keys.privateKey);
    console.log('privateKeyText', JSON.stringify(privateKeyText));

    setPrivateKeyText(JSON.stringify(privateKeyText))
  }
  function handleGenerateCert(){
    console.log("Generating certificate...");

    Meteor.call('generateCertificate', function(error, certificatePem){
      if(error){
        console.error('error', error)
      }
      if(certificatePem){
        console.log('certificatePem', certificatePem)

        setPublicCertPem(certificatePem)
      }
    })
  }
  function handleSyncLantern(){
    console.log("Syncing lantern...")

    Meteor.call('syncLantern', function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', result)
      }
    })
  }
  
  function generateResearchStudies(){
    console.log("Generating Research Studies...")

    Meteor.call('generateResearchStudies', 10, function(error, result){
      if(error){
        console.error('error', error)
        alert('Error generating Research Studies: ' + error.message)
      }
      if(result){
        console.log('result', result)
        alert(result.message)
      }
    })
  }
  
  function generateResearchSubjects(){
    console.log("Generating Research Subjects...")

    Meteor.call('generateResearchSubjects', 20, function(error, result){
      if(error){
        console.error('error', error)
        alert('Error generating Research Subjects: ' + error.message)
      }
      if(result){
        console.log('result', result)
        alert(result.message)
      }
    })
  }
  
  function clearResearchData(){
    console.log("Clearing Research Data...")
    
    if(confirm("Are you sure you want to clear all Research Studies and Subjects?")){
      Meteor.call('clearResearchData', function(error, result){
        if(error){
          console.error('error', error)
          alert('Error clearing Research Data: ' + error.message)
        }
        if(result){
          console.log('result', result)
          alert(result.message)
        }
      })
    }
  }
  function handleSyncProviderDirectory(){
    console.log("Syncing provider directory...")

    Meteor.call('syncProviderDirectory', function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', result)
      }
    })
  }
  function fetchTefcaEndpoints(){
    console.log('fetchTefcaEndpoints'); 

    
    Meteor.call('syncTefcaEndpoints', function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', result)
      }
    });

  }
  function handleSyncUpstreamDirectory(){
    console.log("Syncing upstream directory...");

    let options = {};

    Session.get('SubscriptionChannelResourceType');

    if(Session.get('SubscriptionChannelResourceType')){
      options.resourceType = Session.get('SubscriptionChannelResourceType');
    }

    console.log('options', options)

    Meteor.call('syncUpstreamDirectory', options, function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', result)
      }
    })
  }
  function initCodeSystems(){
    console.log("Initializing code systems...");

    Meteor.call('initCodeSystems', function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', result)
      }
    })
  }
  function initUsCore(){
    console.log("Initializing US Core...");

    Meteor.call('initUsCore', function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', result)
      }
    })
  }
  function initSearchParameters(){
    console.log("Initializing search parameters...");

    Meteor.call('initSearchParameters', function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', result)
      }
    })
  }
  function initStructureDefinitions(){
    console.log("Initializing structure definitions...");

    Meteor.call('initStructureDefinitions', function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', result)
      }
    })
  }
  function initValueSets(){
    console.log("Initializing value sets...");

    Meteor.call('initValueSets', function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', result)
      }
    })
  }

  function fetchDefaultQuery(){
    
    let upstreamDirectory = get(Meteor, 'settings.public.interfaces.upstreamDirectory.channel.endpoint', '');
    console.log('------------------------------------------');
    console.log('Fetch Default Query');
    console.log('');
    console.log('FHIR Server Base: ', upstreamDirectory);    
    console.log('Default Query:    ', defaultDirectoryQuery);
    console.log('');

    Meteor.call('fetchDefaultDirectoryQuery', function(error, result){
      if(error){
        alert(error.message)
      }
      if(result){
        console.log('result', result);
      }
    })
  }

  

  function handleOpenResourceTypes(){
    Session.set('mainAppDialogTitle', "Select Resource Types");
    Session.set('mainAppDialogComponent', "SearchResourceTypesDialog");
    Session.set('lastUpdated', new Date());
    Session.set('mainAppDialogMaxWidth', "md");
    Session.set('mainAppDialogOpen', true);
  }

  // let headerHeight = LayoutHelpers.calcHeaderHeight();
  // let formFactor = LayoutHelpers.determineFormFactor();
  // let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  let serverPublicKeyElems = [];
  if(serverHasPublicKey){
    serverPublicKeyElems.push(<Card margin={20} style={{width: '100%', fontSize: '80%'}}  >      
      <CardHeader avatar={<Icon icon={key} size={32} />} title="Public Key Configured!" />    
      <CardContent>
        <TextField
          fullWidth={true}
          id="publicKey"
          type="publicKey"
          value={publicKeyText}
          style={{marginBottom: '10px'}}
          multiline
          InputProps={{
            style: {
              fontSize: '120%',
              fontFamily: 'monospace'
            },
            disableUnderline: true
          }}
          disabled
        />
      </CardContent>
    </Card>);
    serverPublicKeyElems.push(<DynamicSpacer />);
    
    // Add JWK display if available
    if(publicKeyJwk){
      serverPublicKeyElems.push(<Card key="jwk-display" margin={20} style={{width: '100%', fontSize: '80%'}}  >      
        <CardHeader 
          avatar={<Icon icon={key} size={32} />} 
          title="JSON Web Key (JWK)" 
          subheader="Public key in JWK format for SMART on FHIR JWT authentication"
          action={
            <IconButton onClick={() => copyToClipboard(JSON.stringify(publicKeyJwk, null, 2), "JWK copied to clipboard!")}>
              <ContentCopyIcon />
            </IconButton>
          }
        />    
        <CardContent>
          <AceEditor
            mode="json"
            theme={theme === 'light' ? "tomorrow" : "monokai"}
            wrapEnabled={true}
            readOnly={true}
            name="jwkEditor"
            editorProps={{ $blockScrolling: true }}
            value={JSON.stringify(publicKeyJwk, null, 2)}
            style={{width: '100%', height: '200px', borderRadius: '4px'}}
            setOptions={{
              showLineNumbers: true,
              tabSize: 2,
            }}
          />
          <Typography variant="body2" style={{marginTop: '10px', marginBottom: '10px'}}>
            JWK Set URL: <code>{Meteor.absoluteUrl()}.well-known/jwks.json</code>
            <IconButton 
              size="small" 
              onClick={() => copyToClipboard(Meteor.absoluteUrl() + '.well-known/jwks.json', "JWK Set URL copied!")}
              style={{marginLeft: '10px'}}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            style={{marginRight: '10px'}}
            onClick={openExternalPage.bind(this, Meteor.absoluteUrl() + ".well-known/jwks.json")}
          >View JWK Set Endpoint</Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              Meteor.call('generateClientAssertionJwt', 
                get(Meteor, 'settings.public.smartOnFhir[0].client_id', 'test-client'),
                get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + '/oauth2/token',
                null,
                300,
                function(error, result){
                  if(error){
                    alert('Error generating test JWT: ' + error.message);
                  } else {
                    copyToClipboard(result.jwt, "Test JWT copied to clipboard!");
                  }
                }
              );
            }}
          >Generate Test JWT</Button>
        </CardContent>
      </Card>);
      serverPublicKeyElems.push(<DynamicSpacer />);
    }
  }

  let serverPublicCertElems =[];
  if(serverHasPublicCert){
    serverPublicCertElems.push(<Card margin={20} style={{width: '100%', fontSize: '80%'}}  >      
      <CardHeader avatar={<Icon icon={key} size={32} />} title="Public Cert Available!" />    
      <CardContent>
        <TextField
          fullWidth={true}
          id="publicCert"
          type="publicCert"
          value={publicCertPem}
          style={{marginBottom: '10px'}}
          multiline
          InputProps={{
            style: {
              fontSize: '120%',
              fontFamily: 'monospace'
            },
            disableUnderline: true
          }}
          disabled
        />
      </CardContent>
    </Card>);
    serverPublicCertElems.push(<DynamicSpacer />);
  }

  let serverPrivateKeyElems = [];
  if(serverHasPrivateKey){
    serverPrivateKeyElems.push(<Card key={Random.id()} margin={20} style={{width: '100%', fontSize: '80%'}}  >
      <CardHeader avatar={<Icon icon={keyOutline} size={32} />} title="Private Key Configured!" />    
    </Card>)
    serverPrivateKeyElems.push(<DynamicSpacer key={Random.id()} />);
  }


  let smartOnFhirElems = [];
  // if(get(Meteor, 'settings.public.interfaces.smartOnFhir')){
  smartOnFhirElems.push(<Card key={Random.id()} margin={20} style={{width: '100%', fontSize: '80%'}}  >
    <CardHeader title="SMART on FHIR" subheader="This server is configured to support SMART on FHIR applications." />
    <CardContent>
      <AceEditor
        mode="json"
        theme={theme === 'light' ? "tomorrow" : "monokai"}
        wrapEnabled={false}
        // onChange={onUpdateLlmFriendlyNdjsonString}
        name="synthesisEditor"
        editorProps={{ $blockScrolling: true }}
        value={JSON.stringify(get(Meteor, 'settings.public.smartOnFhir'), null, 2)}
        style={{width: '100%', position: 'relative', height: '300px', minHeight: '300px', borderColor: '#ccc', borderRadius: '4px', lineHeight: '16px'}}        
      /> 
      <Button
        variant="contained"
        color="primary"
        style={{marginTop: '10px', marginRight: '20px'}}
        onClick={openExternalPage.bind(this, Meteor.absoluteUrl() + ".well-known/smart-configuration")}
      >View .well-known/smart-configuration</Button>
      <Button
        variant="contained"
        color="primary"
        style={{marginTop: '10px'}}
        onClick={openExternalPage.bind(this, "https://launch.smarthealthit.org/")}
      >SMART Launcher</Button>
    </CardContent>
  </Card>)
  smartOnFhirElems.push(<DynamicSpacer key={Random.id()} />);

  // }

  let generateKeyElems = [];
  if(!serverHasPublicKey && !serverHasPrivateKey){
    generateKeyElems.push(<Card key={Random.id()} margin={20} style={{width: '100%', fontSize: '80%'}}  >
      <CardHeader title="Generate Keys" subheader="No X.509 keys were detected on the server. You will want to generate keys and then copy them to the Meteor settings file.  Be sure to include the /n newline characters!" />
      <CardContent >
        <TextField
          label="Public Key"
          fullWidth={true}
          id="publicKey"
          type="publicKey"
          value={publicKeyText}
          style={{marginBottom: '10px'}}
          multiline
          InputProps={{
            style: {
              fontSize: '120%',
              fontFamily: 'monospace'
            }
          }}
        />
        <TextField
          label="Private Key"
          fullWidth={true}
          id="privateKey"
          type="privateKey"
          value={privateKeyText}
          style={{marginBottom: '10px'}}
          multiline
          InputProps={{
            style: {
              fontSize: '120%',
              fontFamily: 'monospace'
            }
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={generateKeys.bind(this)}
        >Generate Keys</Button>
      </CardContent>
    </Card>)
    generateKeyElems.push(<DynamicSpacer key={Random.id()} />);    
  }

  let generateCertButton;
  let generateCertElems = [];
  let initSampleDataElements;
  let isDisabled = true;

  
  if(!serverHasPublicCert){
    generateCertButton = <Button
      variant="contained"
      color="primary"
      onClick={handleGenerateCert.bind(this)}
      // disabled={currentUser ? false : true}
    >Generate Cert</Button>
  } 

  generateCertElems.push(<Card key={Random.id()} margin={20} style={{width: '100%', fontSize: '80%'}}  >
    <CardHeader title="Generate Cert" subheader="No X.509 certificates were detected on the server. You will want to generate the certificate and then copy it to the Meteor settings file. " />
    <CardContent >
      <TextField
        label="Public Cert"
        fullWidth={true}
        id="publicCert"
        type="publicCert"
        value={JSON.stringify(publicCertPem)}
        style={{marginBottom: '10px'}}
        multiline
        InputProps={{
          style: {
            fontSize: '120%',
            fontFamily: 'monospace'
          }
        }}
        disabled={currentUser ? false : true}
      />
      { generateCertButton }          
    </CardContent>
  </Card>)
  generateCertElems.push(<DynamicSpacer key={Random.id()} />)
  

  if(currentUser){
    isDisabled = false;
  
    initSampleDataElements = <Card key={Random.id()} margin={20} style={{marginBottom: '20px', width: '100%'}}>
      <CardContent>        
        <Button
          variant="contained"
          fullWidth
          onClick={ initUsCore.bind(this) }
        >Init US Core</Button>
        <br />
        <Button
          variant="contained"
          fullWidth
          onClick={ initCodeSystems.bind(this) }
        >Init Code Systems</Button>
        <br />
        <Button
          variant="contained"
          fullWidth
          onClick={ initSearchParameters.bind(this) }
        >Init Search Parameters</Button>
        <br />
        <Button
          variant="contained"
          fullWidth
          onClick={ initStructureDefinitions.bind(this) }
        >Init Structure Definitions</Button>
        <br />
        <Button
          variant="contained"
          fullWidth
          onClick={ initValueSets.bind(this) }
        >Init Value Sets</Button>
        <br />
        <Button
          variant="contained"
          fullWidth
          onClick={ handleSyncLantern.bind(this) }
        >Sync Lantern</Button>
        <br />
        <Button
          variant="contained"
          fullWidth
          onClick={ handleSyncProviderDirectory.bind(this) }
        >Sync Provider Directory</Button>
        
      </CardContent>
    </Card>
  }
  
  // Synthea DB Utils - Research Study/Subject generation
  let syntheaDbUtilsElements;
  if(currentUser && get(Meteor, 'settings.public.enableSyntheaDbUtils')){
    syntheaDbUtilsElements = <Card key={Random.id()} margin={20} style={{marginBottom: '20px', width: '100%'}}>
      <CardHeader 
        title="Synthea Database Utilities" 
        subheader="Generate synthetic Research Studies and Subjects for testing"
      />
      <CardContent>        
        <Button
          variant="contained"
          fullWidth
          size="small"
          color="primary"
          onClick={ generateResearchStudies.bind(this) }
          style={{marginBottom: '5px'}}
        >Generate Research Studies (10)</Button>
        <Button
          variant="contained"
          fullWidth
          size="small"
          color="primary"
          onClick={ generateResearchSubjects.bind(this) }
          style={{marginBottom: '5px'}}
        >Generate Research Subjects (20)</Button>
        <Button
          variant="outlined"
          fullWidth
          size="small"
          color="error"
          onClick={ clearResearchData.bind(this) }
        >Clear All Research Data</Button>
      </CardContent>
    </Card>
  }


  let upstreamServerSyncButton = <Button

    variant="contained"
    fullWidth
    onClick={ handleSyncUpstreamDirectory.bind(this) }
    disabled={isDisabled}
  >Subscribe to Upstream Directory</Button>

  let fetchDefaultDirectoryQueryButton = <Button variant="contained" fullWidth onClick={fetchDefaultQuery.bind(this)} disabled={isDisabled}>Fetch Default Query</Button>

  let tefcaEndpoints = get(Meteor, 'settings.public.interfaces.tefcaEndpoints', [
      "https://open.epic.com/Endpoints/R4",
      "https://raw.githubusercontent.com/oracle-samples/ignite-endpoints/main/millennium_patient_r4_endpoints.json",
      "https://raw.githubusercontent.com/oracle-samples/ignite-endpoints/main/millennium_provider_r4_endpoints.json"
  ])
  let tefcaEndpointsElements = []
  tefcaEndpointsElements.push(<Card key={Random.id()} margin={20} style={{width: '100%'}}  >
    <CardHeader title="Sync TEFCA Endpoints" />
    <CardContent>
          
      <Grid container spacing={3} justify="center" style={{paddingTop: '20px'}}>
        <Grid item xs={12}>
            <TextField
              label="Endpoints Found"
              fullWidth={true}
              id="upstreamDirectory"
              type="upstreamDirectory"
              // value={Endpoints.find().count()}
              value={0}
              style={{marginBottom: '10px'}}
              disabled={true}
            />      
            <TextField
              label="Upstream Directory"
              fullWidth={true}
              id="upstreamDirectory"
              type="upstreamDirectory"
              multiline={true}
              value={tefcaEndpoints.join("\n")}
              style={{marginBottom: '10px'}}
              disabled={true}
            />                                  
        </Grid>
      </Grid>

      <Button variant="contained" fullWidth onClick={fetchTefcaEndpoints.bind(this)} >Fetch TEFCA Endpoints</Button>
      <br />
    </CardContent>
  </Card>)
  tefcaEndpointsElements.push(<DynamicSpacer key={Random.id()} />);

  let upstreamServer = get(Meteor, 'settings.public.interfaces.upstreamDirectory.channel.endpoint', '')
  let upstreamServerElements = [];
  upstreamServerElements.push(<Card key={Random.id()} margin={20} style={{width: '100%'}}  >
    <CardHeader title="Upstream Directory" />
    <CardContent>
          
      <Grid container spacing={3} justify="center" style={{paddingTop: '20px'}}>
        <Grid item xs={12} >
            <TextField
              label="Upstream Directory"
              fullWidth={true}
              id="upstreamDirectory"
              type="upstreamDirectory"
              value={upstreamServer}
              style={{marginBottom: '10px'}}
              disabled={isDisabled}
            />         
            <TextField
              label="Default Query"
              fullWidth={true}
              id="defaultDirectoryQuery"
              type="defaultDirectoryQuery"
              value={defaultDirectoryQuery}
              style={{marginBottom: '10px'}}
              disabled={isDisabled}
            />              
        </Grid>
      </Grid>

      { fetchDefaultDirectoryQueryButton }
      <br />
    </CardContent>
  </Card>);
  upstreamServerElements.push(<DynamicSpacer key={Random.id()} />);

  let subscribeUpstreamCard = [];
  subscribeUpstreamCard.push(<Card key={Random.id()}>
    <CardHeader title="Subscribe Upstream" />
    <CardContent>
      <Grid container>
            <Grid item xs={12}>
              <FormControl style={{width: '100%', marginTop: '40px', marginBottom: '0px'}}>
                <InputLabel shrink={true} >Resource Type</InputLabel>
                <Input
                  id="resourceType"
                  name="resourceType"
                  // className={classes.input}   
                  value={subscriptionChannelResourceType}
                  // value={FhirUtilities.pluckCodeableConcept(get(activeHealthcareService, 'type[0]'))}
                  // onChange={updateField.bind(this, 'type[0].text')}
                  fullWidth    
                  type="text"
                  placeholder="Organization"
                  disabled={isDisabled}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle type select"
                        onClick={ handleOpenResourceTypes.bind(this) }
                      >
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  }           
                />
              </FormControl>  
            </Grid>
          </Grid>

          <Grid container spacing={3} justify="center" style={{paddingTop: '00px'}}>
            <Grid item xs={12} style={{paddingTop: '20px', paddingBottom: '20px'}}>
              <FormControlLabel
                control={<Checkbox checked={true} onChange={handleChange} />}
                label="Realtime"
                disabled={isDisabled}
              />
              <FormControlLabel
                control={<Checkbox checked={false} onChange={handleChange} />}
                label="Daily"
                disabled={true}
                // disabled={isDisabled}
              />
              <FormControlLabel
                control={<Checkbox checked={false} onChange={handleChange} />}
                label="Weekly"
                disabled={true}
                // disabled={isDisabled}
              />
              <FormControlLabel
                control={<Checkbox checked={false} onChange={handleChange} />}
                label="Monthly"
                disabled={true}
                // disabled={isDisabled}
              />
              <FormControlLabel
                control={<Checkbox checked={false} onChange={handleChange} />}
                label="Last Updated"
                disabled={true}
                // disabled={isDisabled}
              />
            </Grid>
          </Grid>


          <br height={40} />

          { upstreamServerSyncButton }
    </CardContent>
  </Card>);
  subscribeUpstreamCard.push(<DynamicSpacer key={Random.id()} />);

  let subscriptionsCard = <Card key={Random.id()} style={{marginBottom: '20px'}}>
      <CardHeader title="Subscriptions" />
      <CardContent>
        SubscriptionsTable disabled...
        {/* <SubscriptionsTable
            hideContact={true}
            hideEnd={true}
        /> */}
      </CardContent>
    </Card>




  // Build tab list dynamically with per-extension tabs
  let tabDefinitions = [
    { label: 'Keys & Certs', slug: 'keys-certs' },
    { label: 'SMART on FHIR', slug: 'smart-on-fhir' },
    { label: 'Upstream', slug: 'upstream' },
    { label: 'TEFCA', slug: 'tefca' },
    { label: 'Init Data', slug: 'init-data' }
  ];

  extensionTabs.forEach(function(ext){
    tabDefinitions.push({ label: ext.label, slug: ext.slug });
  });

  // Build reverse map: index → slug
  let indexToSlug = {};
  tabDefinitions.forEach(function(tab, i){
    indexToSlug[i] = tab.slug;
  });

  function handleTabChange(event, newValue){
    let slug = indexToSlug[newValue] || 'keys-certs';
    navigate('/server-configuration?tab=' + slug, { replace: true });
  }

  return (
    <div id='ServerConfigurationPage' style={{height: window.innerHeight, overflow: "auto", paddingBottom: '128px', paddingTop: '20px'}} >

      <Container maxWidth="lg" style={{paddingBottom: '80px'}}>
        <Grid container spacing={3}>
          <Grid item xs={2}>
            <Tabs
              orientation="vertical"
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                borderRight: 1,
                borderColor: 'divider',
                position: 'sticky',
                top: 20,
                '& .MuiTab-root': {
                  alignItems: 'flex-end',
                  textAlign: 'right',
                  textTransform: 'none',
                  minHeight: 48,
                  fontSize: '0.875rem'
                },
                '& .Mui-selected': {
                  fontWeight: 600
                }
              }}
            >
              {tabDefinitions.map(function(tab, index){
                return <Tab key={index} label={tab.label} />;
              })}
            </Tabs>
          </Grid>
          <Grid item xs={10}>
            {activeTab === 0 && (
              <Box sx={{ minHeight: '60vh' }}>
                { serverPrivateKeyElems }
                { serverPublicKeyElems }
                { serverPublicCertElems }
                { generateKeyElems }
                { generateCertElems }
              </Box>
            )}
            {activeTab === 1 && (
              <Box sx={{ minHeight: '60vh' }}>
                { smartOnFhirElems }
              </Box>
            )}
            {activeTab === 2 && (
              <Box sx={{ minHeight: '60vh' }}>
                { upstreamServerElements }
                { subscribeUpstreamCard }
                { subscriptionsCard }
              </Box>
            )}
            {activeTab === 3 && (
              <Box sx={{ minHeight: '60vh' }}>
                { tefcaEndpointsElements }
              </Box>
            )}
            {activeTab === 4 && (
              <Box sx={{ minHeight: '60vh' }}>
                { initSampleDataElements }
                { syntheaDbUtilsElements }
              </Box>
            )}
            {extensionTabs.map(function(ext, i){
              let tabIndex = 5 + i;
              return activeTab === tabIndex ? (
                <Box key={ext.slug} sx={{ minHeight: '60vh' }}>
                  { ext.components }
                </Box>
              ) : null;
            })}
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={copySuccess}
        autoHideDuration={3000}
        onClose={() => setCopySuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setCopySuccess(false)} severity="success" sx={{ width: '100%' }}>
          {copyMessage}
        </Alert>
      </Snackbar>

    </div>
  );
}

export default ServerConfigurationPage;