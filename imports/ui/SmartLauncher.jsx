
// EPIC ENDPOINTS
// https://open.epic.com/Endpoints/R4

// CERNER ENDPOINTS - PATIENT LAUNCH
// https://github.com/oracle-samples/ignite-endpoints/blob/main/millennium_patient_r4_endpoints.json

// CERNER ENDPOINTS - PROVIDER LAUNCH
// https://github.com/oracle-samples/ignite-endpoints/blob/main/millennium_provider_r4_endpoints.json



import React, { useContext, useState, useEffect } from "react";

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { get, has } from 'lodash';

import { oauth2 as SMART } from "fhirclient";
// import config from "../config"
import { FhirClientContext } from "../FhirClientContext";
import { 
  Grid, 
  Card,
  CardHeader, 
  CardContent, 
  CardActions,
  CardMedia, 
  CardActionArea,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Typography,
  Button,
  Box,
  Tabs,
  Tab
} from '@mui/material';

import { useTracker } from 'meteor/react-meteor-data';


import { Icon } from 'react-icons-kit';
import {star} from 'react-icons-kit/fa/star'
import {ic_people} from 'react-icons-kit/md/ic_people';
import {ic_people_outline} from 'react-icons-kit/md/ic_people_outline';

import { fetch, Headers, Request, Response } from 'meteor/fetch';

import DynamicSpacer from './DynamicSpacer';

let configArray = get(Meteor, 'settings.public.smartOnFhir', []);

let EndpointsTable;
Meteor.startup(function(){
  EndpointsTable = Meteor.Tables.EndpointsTable;
})




//====================================================================================
// SMART on FHIR
// 
// TODO:  Refactor this; duplicated in multiple files


let firstSmartConfig = get(Meteor, 'settings.public.smartOnFhir[0]', []);

function uint8ToBase64(uint8Array) {
  let binary = '';
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

function generateCodeVerifier() {
  const array = new Uint8Array(32); // 32 random bytes
  window.crypto.getRandomValues(array);

  // Convert the Uint8Array to a URL-safe base64 string without using btoa
  return Array.from(array, byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
}

async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return uint8ToBase64(new Uint8Array(hash))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
}


async function verifyCodeChallenge(codeVerifier, expectedCodeChallenge) {

  // Generate the code_challenge from the code_verifier
  const generatedCodeChallenge = await generateCodeChallenge(codeVerifier);

  console.log('Generated code_challenge:', generatedCodeChallenge);
  console.log('Expected code_challenge:', expectedCodeChallenge);

  // Compare the generated code_challenge with the expected one
  if (generatedCodeChallenge === expectedCodeChallenge) {
      console.log('Success: The code_verifier correctly generates the expected code_challenge.');
  } else {
      console.error('Failure: The code_verifier does NOT generate the expected code_challenge.');
  }
}


//------------------------------------------------------------------------
// Main Component

/**
 * Typically the launch page is an empty page with a `SMART.authorize`
 * call in it.
 *
 * This example demonstrates that the call to authorize can be postponed
 * and called manually. In this case we use ReactRouter which will match
 * the `/launch` path and render our component. Then, after our page is
 * rendered we start the auth flow.
 */
export function Launcher(props){
    
    const client = useContext(FhirClientContext);
    let searchParams = new URLSearchParams(window.location.search);

    let [showSettings, setShowSettings] = useState(true);
    let [tabValue, setTabValue] = React.useState(searchParams.get('tab') ? parseInt(searchParams.get('tab')) : 0);
    let [endpoints, setEndpoints] = useState([]);
    let [endpointsPageIndex, setEndpointsPageIndex] = useState(0);

    useEffect(function(){
      async function fetchData() {
        setEndpoints(Meteor.Collections.Endpoints.find().fetch());
      }
      fetchData();
    }, []);

    useTracker(function(){
      setEndpoints(Meteor.Collections.Endpoints.find().fetch());
    }, [])


    async function postSmartAuthConfig (url, data) {
      const response = await fetch(url, {
          method: 'POST', // *GET, POST, PUT, DELETE, etc.
          mode: 'cors', // no-cors, *cors, same-origin
          cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
          credentials: 'same-origin', // include, *same-origin, omit
          headers: new Headers({
              // Authorization: 'Bearer my-secret-key',
              'Content-Type': 'application/json',    
              "x-forwarded-host": "localhost"          
          }),
          redirect: 'follow', // manual, *follow, error
          referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
          body: JSON.stringify(data) // body data type must match "Content-Type" header
      });
      return response.json();
    }

    function handleRowClick(config, event){

        console.log("SMART config:", config)
        console.log("Event.target", event.target.value);


        var searchParams = new URLSearchParams();
        searchParams.set("client_id", config.client_id);
        searchParams.set("scope", config.scope);
        searchParams.set("redirect_uri", config.redirect_uri);
        searchParams.set("iss", config.iss);

        Session.set('smartConfig', config);

        const options = {
          clientId: config.client_id,
          scope: config.scope,
          redirectUri: config.redirect_uri,

          environment: config.environment,
          production: config.production,
          iss: config.iss,
          fhirServiceUrl: config.fhirServiceUrl,

          // WARNING: completeInTarget=true is needed to make this work
          // in the codesandbox frame. It is otherwise not needed if the
          // target is not another frame or window but since the entire
          // example works in a frame here, it gets confused without
          // setting this!
          completeInTarget: true
        }

        if( config.client_id === 'OPEN' ) {
          options.fhirServiceUrl = config.fhirServiceUrl;
          options.patientId = config.patientId;
        } else {
          options.iss = config.fhirServiceUrl;
        }

        if(config.launch_uri){
          let launchUrl = config.launch_uri + '?' + searchParams.toString()
          console.log('SmartLauncher.launchUrl', launchUrl)
  
          if(Meteor.isCordova){
            cordova.InAppBrowser.open(launchUrl, '_self');
          } else {
            window.open(launchUrl, '_self');
          }
        }        
    }

    function a11yProps(index) {
      return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
      };
    }
    function CustomTabPanel(props) {
      const { children, value, index, ...other } = props;
    
      return (
        <div
          role="tabpanel"
          hidden={value !== index}
          id={`simple-tabpanel-${index}`}
          aria-labelledby={`simple-tab-${index}`}
          {...other}
        >
          {value === index && (
            <Box sx={{ p: 3 }} style={{margin: '0px', paddingLeft: '0px', paddingRight: '0px'}}>
              {children}
            </Box>
          )}
        </div>
      );
    }

    function handleSelectDataSource(config){
      console.log('handleSelectDataSource')

      SMART.authorize(config);
    }
    function renderOptions() {
        let configMenu = [];
        console.warn('TODO:  migrate SmartOnFHIR configs from public settings to a private Meteor.methods call.')
        
        configArray.forEach(function(config, index){                
          // configMenu.push(<MenuItem value={index}>{config.vendor}</MenuItem>);
          let isDisabled = false;
          let rowStyle = {cursor: 'pointer', color: "black"};

          // if(config.launchContext === "Provider"){
          //     isDisabled = true;
          //     rowStyle.color = "lightgrey"
          // } 

          let currentEnvironment = "meteor";
          if(Meteor.absoluteUrl() === "http://localhost:3000/"){
            currentEnvironment = "localhost"
          }
          
          if(config.launchContext !== "Provider"){
              configMenu.push(
                <TableRow hover={get(config, 'enabled', true)} key={index} style={rowStyle} onClick={handleRowClick.bind(this, config)}>
                  <TableCell onClick={handleSelectDataSource.bind(this, config)} align="left" style={rowStyle}>{index}</TableCell>
                  <TableCell onClick={handleSelectDataSource.bind(this, config)} align="left" style={rowStyle}>{config.preferred ? <Icon icon={star} size={18} /> : ""}</TableCell>
                  <TableCell onClick={handleSelectDataSource.bind(this, config)} align="left" style={rowStyle}>{config.vendor}</TableCell>
                  <TableCell onClick={handleSelectDataSource.bind(this, config)} align="left" style={rowStyle}>{config.environment}</TableCell>
                  <TableCell onClick={handleSelectDataSource.bind(this, config)} align="left" style={rowStyle}>{config.production ? <Icon icon={ic_people} size={24} /> : <Icon icon={ic_people_outline} size={24} />}</TableCell>
                  {/* <TableCell onClick={handleSelectDataSource.bind(this, config)} align="left" style={rowStyle}>{config.autodownload ? <Icon icon={ic_file_download} size={24} /> : ""}</TableCell> */}
                  <TableCell onClick={handleSelectDataSource.bind(this, config)} align="right" style={rowStyle}>{config.fhirVersion}</TableCell>
              </TableRow>);
            }          
        })

        return configMenu;
    }

    let firstSmartConfig = get(Meteor, 'settings.public.smartOnFhir[0]', []);


    async function handleAuthenticateDefaultServer(smartConfig){
      console.log('smartConfig', smartConfig);
      
      // Generate the code_verifier (for PKCE)
      const codeVerifier = generateCodeVerifier(); // Your function to generate code_verifier
      console.log('codeVerifier', codeVerifier);

      // Save to Local Storage (persistent across tabs and sessions)
      localStorage.setItem('pkce_code_verifier', codeVerifier);

      
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      console.log('codeChallenge', codeChallenge);

      let launchConfig = Object.assign({}, smartConfig); 
      launchConfig.codeChallenge = codeChallenge;
      launchConfig.codeChallengeMethod = "S256";
      launchConfig.redirectUri = get(Meteor, 'settings.public.smartOnFhir[0].redirect_uri');

      // launchConfig.code_challenge = encodeURIComponent(codeChallenge);
      // launchConfig.code_challenge_method = 'S256';
      // launchConfig.client_id = get(Meteor, 'settings.public.smartOnFhir[0].client_id');
      // launchConfig.redirect_uri = encodeURIComponent(get(Meteor, 'settings.public.smartOnFhir[0].redirect_uri'));
      // launchConfig.iss = get(Meteor, 'settings.public.smartOnFhir[0].iss');

      await verifyCodeChallenge(codeVerifier, codeChallenge);


      await fetch(get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/metadata?_format=json", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(response => response.json())
      .then(async function(result){
        console.log('fetch.get /metadata result', result)

        // alert('codeVerifier: ' + codeVerifier + "\n" + 'codeChallenge: ' + codeChallenge);


        if(Array.isArray(result.rest)){
          result.rest.forEach(function(restItem){
            if((get(restItem, 'mode') === "server") && get(restItem, 'security.extension')){
              
              if(Array.isArray(restItem.security.extension)){
                restItem.security.extension.forEach(function(extensionItem){
                  if(extensionItem.url === "http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris"){
                    if(Array.isArray(extensionItem.extension)){
                      extensionItem.extension.forEach(function(extensionItem){
                        if(extensionItem.url === "authorize"){
                          launchConfig.authorizeUri = extensionItem.valueUri;
                        }
                        if(extensionItem.url === "token"){
                          launchConfig.tokenUri = extensionItem.valueUri;
                        }
                      })
                    }
                  }
                })
              }
              
            }
          })
        }

        console.log('launchConfig', launchConfig)

        if(launchConfig.authorizeUri){
          // Construct the authorization URL
          const authorizationUrl = new URL(launchConfig.authorizeUri);
            authorizationUrl.searchParams.append('response_type', 'code');
            authorizationUrl.searchParams.append('client_id', get(Meteor, 'settings.public.smartOnFhir[0].client_id', ''));
            authorizationUrl.searchParams.append('redirect_uri', get(Meteor, 'settings.public.smartOnFhir[0].redirect_uri', ''));
            authorizationUrl.searchParams.append('aud', get(Meteor, 'settings.public.smartOnFhir[0].iss', ''));
            authorizationUrl.searchParams.append('scope', 'launch openid fhirUser patient/*.read');
            authorizationUrl.searchParams.append('state', Random.id()); // Generate a unique state
            authorizationUrl.searchParams.append('code_challenge', codeChallenge);
            authorizationUrl.searchParams.append('code_challenge_method', 'S256');

          console.log('authorizationUrl', authorizationUrl)

          
          window.location.href = authorizationUrl.toString();

        }        
      }).catch((error) => {
        console.error('fetch.get /metadata error', error)
      });

      // SMART.authorize(smartConfig);
    }
    function handleTabChange(event, newValue){
      setTabValue(newValue);
    };
  
    
    let headerHeight = 84;
    if(get(Meteor, 'settings.public.defaults.prominentHeader')){
        headerHeight = 148;
    }  

    let paddingWidth = 20;


    let smartConfigElements;
    if(firstSmartConfig){
      smartConfigElements = <Typography variant="body1" color="textSecondary" component="p">
        {JSON.stringify(firstSmartConfig, null, 2)}
      </Typography>
    }

    return (
        <div id='SmartLauncher' style={{overflow: 'scroll', 'height': window.innerHeight, padding: '20px'}} >
            <Grid container sx={{
              justifyContent: "center",
              alignItems: "center",
              marginBottom: '80px'
            }} spacing={3}>
              <Grid item xs={12} sm={12} md={12} lg={8} >
                <CardHeader title="Default data provider" />
                  <Button fullWidth color="primary" variant="contained" onClick={handleAuthenticateDefaultServer.bind(this, firstSmartConfig)}>
                    <CardHeader title={ get(Meteor, 'settings.public.smartOnFhir[0].vendor')}  />
                  </Button>                     
                  <DynamicSpacer />
                  <DynamicSpacer />
                  <CardHeader title="Other health information data sources" />
                  <Box sx={{ width: '100%', borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="basic tabs example">        
                      <Tab label="TEFCA Directory" {...a11yProps(0)} />
                      <Tab label="Sandboxes" {...a11yProps(1)} />
                    </Tabs>
                  </Box>
                  <CustomTabPanel value={tabValue} index={0} style={{margin: '0px'}}>
                    <Card>
                      <EndpointsTable 
                        endpoints={endpoints}
                        count={endpoints.length}
                        // hideIdentifier={true} 
                        hideCheckbox={true}
                        hideActionIcons={true}
                        hideStatus={false}
                        hideName={false}
                        hideConnectionType={true}
                        hideVersion={true}
                        hideOrganization={false}
                        hideAddress={true}
                        multiline={true}    
                        hideBarcode={true}
                        onRowClick={ handleRowClick.bind(this) }
                        onSetPage={function(index){
                          setEndpointsPageIndex(index)
                        }}     
                        page={endpointsPageIndex}                 
                        rowsPerPage={20}
                        size="medium"
                      />
                    </Card>
                  </CustomTabPanel>
                  <CustomTabPanel value={tabValue} index={1} style={{margin: '0px'}}>
                    <Card>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell align="left">Index</TableCell>
                                    <TableCell align="left">Preferred</TableCell>
                                    <TableCell align="left">Vendor</TableCell>
                                    {/* <TableCell align="left">Type</TableCell> */}
                                    {/* <TableCell align="left">Launch Context</TableCell> */}
                                    <TableCell align="left">Environment</TableCell>
                                    <TableCell align="left">Production</TableCell>
                                    {/* <TableCell align="left">Autodownload</TableCell> */}
                                    <TableCell align="right">FHIR Version</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                { renderOptions()}
                            </TableBody>
                        </Table>
                    </Card>                      
                  </CustomTabPanel>
              </Grid>
            </Grid>
        </div>
    )
    
}

export default Launcher;