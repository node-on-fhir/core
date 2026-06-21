import React, { useState, useEffect } from 'react';

import { useFormik, FormikErrors } from 'formik';

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
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import SearchIcon from '@material-ui/icons/Search';
import PersonIcon from '@material-ui/icons/Person';
import GroupIcon from '@material-ui/icons/Group';
import AssignmentIndIcon from '@material-ui/icons/AssignmentInd';
import ClassIcon from '@material-ui/icons/Class';
import CollectionsBookmarkIcon from '@material-ui/icons/CollectionsBookmark';
import LocalPlayIcon from '@material-ui/icons/LocalPlay';
import LocationOnIcon from '@material-ui/icons/LocationOn';

import { get, has } from 'lodash';
import { DynamicSpacer, PageCanvas, StyledCard } from 'fhir-starter';

import { useTracker } from 'meteor/react-meteor-data';

import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import jwt from 'jsonwebtoken';

import { Icon } from 'react-icons-kit';
import { home } from 'react-icons-kit/icomoon/home';
import {ic_vpn_key} from 'react-icons-kit/md/ic_vpn_key';

import {keyOutline} from 'react-icons-kit/typicons/keyOutline'
import {key} from 'react-icons-kit/typicons/key'


import forge from 'node-forge';

let pki = forge.pki;

import { SubscriptionsTable } from 'meteor/clinical:hl7-fhir-data-infrastructure';

const useStyles = makeStyles(theme => ({
  root: {
    maxWidth: 345,
  },
  media: {
    minHeight: 400,
  },
  open_stack: {
    minHeight: 1200,
    backgroundSize: 'contain'
  },
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {},
  button: {},
  label: {
    paddingBottom: '10px'
  }
}));




function ServerConfigurationPage(props){
  const classes = useStyles();

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

  let [checked, setChecked] = React.useState(true);
  let [defaultDirectoryQuery, setDefaultDirectoryQuery] = React.useState(get(Meteor, 'settings.public.interfaces.upstreamDirectory.channel.path', ""));
  

  let handleChange = (event) => {
    setChecked(event.target.checked);
  };


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
    // props.history.replace(url)
  }

  //----------------------------------------------------------------------
  // Page Styling 


  let pageStyle = {
    paddingLeft: '0px', 
    paddingRight: '0px',
    position: 'absolute',
    top: '0px'
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
    props.history.replace(url)
  }

  function handelUpdateWellKnownUdapUrl(event){
    setWellKnownUdapUrl(event.currentTarget.value)
  }
  function handleFetchWellknownUdap(){
    console.log('wellKnownUdapUrl', wellKnownUdapUrl);

    HTTP.get(wellKnownUdapUrl, function(error, result){
      if(error){
        console.log('handleFetchWellknownUdap.error', error)
      }
      if(result){
        console.log('handleFetchWellknownUdap.result.data', get(result, 'data'))

        alert(result.data.x5c[0]);
        
        if(Array.isArray(get(result, 'data.x5c'))){
          console.log('x.509 cert: ' + result.data.x5c[0]);
          setCertificate(result.data.x5c);          
        }
        
      }
    })
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

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  let serverPublicKeyElems;
  if(serverHasPublicKey){
    serverPublicKeyElems = <StyledCard margin={20} style={{width: '100%', fontSize: '80%'}}  >      
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
    </StyledCard>
  }

  let serverPublicCertElems;
  if(serverHasPublicCert){
    serverPublicCertElems = <StyledCard margin={20} style={{width: '100%', fontSize: '80%'}}  >      
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
    </StyledCard> 
  }

  let serverPrivateKeyElems;
  if(serverHasPrivateKey){
    serverPrivateKeyElems = <StyledCard margin={20} style={{width: '100%', fontSize: '80%'}}  >
      <CardHeader avatar={<Icon icon={keyOutline} size={32} />} title="Private Key Configured!" />    
    </StyledCard>
  }

  let generateKeyElems;
  if(!serverHasPublicKey && !serverHasPrivateKey){
    generateKeyElems = <StyledCard margin={20} style={{width: '100%', fontSize: '80%'}}  >
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
    </StyledCard>
  }

  let generateCertElems;
  let initSampleDataElements;
  let isDisabled = true;
  if(currentUser){
    isDisabled = false;

    if(!serverHasPublicCert){
      generateCertElems = <StyledCard margin={20} style={{width: '100%', fontSize: '80%'}}  >
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
            disabled={isDisabled}
          />
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateCert.bind(this)}
            disabled={isDisabled}
          >Generate Cert</Button>
        </CardContent>
      </StyledCard>
    }
  
    initSampleDataElements = <StyledCard margin={20} style={{marginBottom: '20px', width: '100%'}}>
      <CardContent>        
        <Button
          variant="contained"
          fullWidth
          onClick={ initUsCore.bind(this) }
        >Init US Core</Button>
        <DynamicSpacer />
        <Button
          variant="contained"
          fullWidth
          onClick={ initCodeSystems.bind(this) }
        >Init Code Systems</Button>
        <DynamicSpacer />
        <Button
          variant="contained"
          fullWidth
          onClick={ initSearchParameters.bind(this) }
        >Init Search Parameters</Button>
        <DynamicSpacer />
        <Button
          variant="contained"
          fullWidth
          onClick={ initStructureDefinitions.bind(this) }
        >Init Structure Definitions</Button>
        <DynamicSpacer />
        <Button
          variant="contained"
          fullWidth
          onClick={ initValueSets.bind(this) }
        >Init Value Sets</Button>
        <DynamicSpacer />
        <Button
          variant="contained"
          fullWidth
          onClick={ handleSyncLantern.bind(this) }
        >Sync Lantern</Button>
        <DynamicSpacer />
        <Button
          variant="contained"
          fullWidth
          onClick={ handleSyncProviderDirectory.bind(this) }
        >Sync Provider Directory</Button>
        
      </CardContent>
    </StyledCard>
  }


  let upstreamServerSyncButton = <Button
    variant="contained"
    fullWidth
    onClick={ handleSyncUpstreamDirectory.bind(this) }
    disabled={isDisabled}
  >Subscribe to Upstream Directory</Button>

  let fetchDefaultDirectoryQueryButton = <Button variant="contained" fullWidth onClick={fetchDefaultQuery.bind(this)} disabled={isDisabled}>Fetch Default Query</Button>

  let upstreamServer = get(Meteor, 'settings.public.interfaces.upstreamDirectory.channel.endpoint', '')
  let upstreamServerElements = <StyledCard margin={20} style={{width: '100%'}}  >
      <CardHeader title="Upstream Directory" />
      <CardContent>
            
        <Grid container spacing={3} justify="center" style={{paddingTop: '20px'}}>
          <Grid item xs={12} spacing={3}>
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
        <DynamicSpacer />
      </CardContent>
    </StyledCard>

  let subscribeUpstreamCard = <StyledCard>
    <CardHeader title="Subscribe Upstream" />
    <CardContent>
      <Grid container>
            <Grid item xs={12}>
              <FormControl style={{width: '100%', marginTop: '40px', marginBottom: '0px'}}>
                <InputLabel shrink={true} className={classes.label}>Resource Type</InputLabel>
                <Input
                  id="resourceType"
                  name="resourceType"
                  className={classes.input}   
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


          <DynamicSpacer height={40} />

          { upstreamServerSyncButton }
    </CardContent>
  </StyledCard>

  let subscriptionsCard = <StyledCard>
      <CardHeader title="Subscriptions" />
      <CardContent>
        <SubscriptionsTable
            hideContact={true}
            hideEnd={true}
        />
      </CardContent>
    </StyledCard>

  return (
    <PageCanvas id='ServerConfigurationPage' headerHeight={headerHeight} paddingLeft={10} paddingRight={10}>
      
      <Container maxWidth="lg" style={{paddingBottom: '80px'}}>
        <Grid container spacing={3} justify="center" style={{marginBottom: '20px'}}>
          <Grid item xs={8} sm={8}>
            { serverPrivateKeyElems }
            { serverPublicKeyElems }
            { serverPublicCertElems }
            { generateKeyElems }
            { generateCertElems }
            { upstreamServerElements }
            <DynamicSpacer />
            { subscribeUpstreamCard }
            <DynamicSpacer />
            { subscriptionsCard }
            { initSampleDataElements }
          </Grid>
        </Grid>
      </Container>

    </PageCanvas>
  );
}

export default ServerConfigurationPage;