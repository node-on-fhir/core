import React, { useContext, useState, useEffect } from "react";

import {
  useLocation, 
  useNavigate
} from "react-router-dom";


import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';
import { fetch } from 'meteor/fetch';

import { get, has } from 'lodash';

import { oauth2 as SMART } from "fhirclient";
// import config from "../config"
// import { FhirClientContext } from "../FhirClientContext";

import {
  Grid, 
  Card,
  CardHeader, 
  CardContent, 
  CardMedia, 
  CardActionArea,
  CardActions,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Alert
} from '@mui/material';


import "ace-builds";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/theme-monokai";



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
      console.log('PKCE Success: The code_verifier correctly generates the expected code_challenge.');
  } else {
      console.error('PKCE Failure: The code_verifier does NOT generate the expected code_challenge.');
  }
}

//----------------------------------------------------------------------
// Helper Components

let DynamicSpacer;
let useTheme;
Meteor.startup(function(){
  DynamicSpacer = Meteor.DynamicSpacer;
  useTheme = Meteor.useTheme;
})

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
export default function SmartLaunchDebugger(props){
  console.log('SmartLaunchDebugger', props)

  const { theme, toggleTheme } = useTheme();

    let searchParams = new URLSearchParams(useLocation().search);
    
    let [smartConfig, setSmartConfig] = useState(null);
    let [showScopes, setShowScopes] = useState(false);

    let [authorizationUrlString, setAuthorizationUrl] = useState(false);

    

    useEffect(function(){

      // let searchParams = new URLSearchParams(useLocation().search);

      let fhirconfig = get(Meteor, 'settings.public.smartOnFhir[0]', {})

        const options = {
            clientId: get(fhirconfig, 'client_id'),
            scope: get(fhirconfig, 'scope'),
            redirectUri: get(fhirconfig, 'redirect_uri'),
            fhirServerUrl: get(fhirconfig, 'fhirServerUrl'),
            iss: get(fhirconfig, 'iss'),

            // WARNING: completeInTarget=true is needed to make this work
            // in the codesandbox frame. It is otherwise not needed if the
            // target is not another frame or window but since the entire
            // example works in a frame here, it gets confused without
            // setting this!
            //completeInTarget: true
        }
        // if(get(fhirconfig, 'client_secret')){
        //     options.clientSecret = get(fhirconfig, 'client_secret');
        // }

        // if(fhirconfig.patientId) {
        //     context.setPatientId(fhirconfig.patientId)
        // }

        setSmartConfig(options);

        async function setAuthString(){
          // Generate the code_verifier (for PKCE)
          const codeVerifier = generateCodeVerifier(); // Your function to generate code_verifier
          console.log('codeVerifier', codeVerifier);

          // Save to Local Storage (persistent across tabs and sessions)
          localStorage.setItem('pkce_code_verifier', codeVerifier);

          // // OR Save to Session Storage (only available in the current tab)
          // sessionStorage.setItem('pkce_code_verifier', codeVerifier);

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
              
                // authorizationUrl.searchParams = searchParams;
          
                authorizationUrl.searchParams.append('response_type',  'code');
                authorizationUrl.searchParams.append('client_id', get(Meteor, 'settings.public.smartOnFhir[0].client_id', ''));
                authorizationUrl.searchParams.append('redirect_uri', get(Meteor, 'settings.public.smartOnFhir[0].redirect_uri', ''));
                authorizationUrl.searchParams.append('aud', get(Meteor, 'settings.public.smartOnFhir[0].iss', ''));
                authorizationUrl.searchParams.append('scope', get(Meteor, 'settings.public.smartOnFhir[0].scope', 'launch openid fhirUser patient/*.read'));
                authorizationUrl.searchParams.append('state', Random.id()); // Generate a unique state
                authorizationUrl.searchParams.append('code_challenge', codeChallenge);
                authorizationUrl.searchParams.append('code_challenge_method', 'S256');
                authorizationUrl.searchParams.append('launch', searchParams.get('launch'));

              console.log('authorizationUrl', authorizationUrl)

              setAuthorizationUrl(authorizationUrl.toString());
              
              // window.location.href = authorizationUrl.toString();

            }        
          }).catch((error) => {
            console.error('fetch.get /metadata error', error)
          });
        }

        setAuthString()
    }, [])

    // // /**
    // //  * This is configured to make a Standalone Launch, just in case it
    // //  * is loaded directly. An EHR can still launch it by passing `iss`
    // //  * and `launch` url parameters
    // //  */
    // function onChangeProvider(event,context) {
    //     console.log(event.target.value);
    //     const providerKey = event.target.value
    //     const fhirconfig = config[event.target.value]

    //     // // put your client id in .env.local (ignored by .gitignore)
    //     // const secret_client_id = "REACT_APP_CLIENT_ID_" + providerKey
    //     // if( secret_client_id in process.env ) {
    //     //     fhirconfig.client_id = process.env[secret_client_id]
    //     // }

    //     const options = {
    //         clientId: fhirconfig.client_id,
    //         scope: fhirconfig.scope,
    //         redirectUri: fhirconfig.redirectUri,

    //         // WARNING: completeInTarget=true is needed to make this work
    //         // in the codesandbox frame. It is otherwise not needed if the
    //         // target is not another frame or window but since the entire
    //         // example works in a frame here, it gets confused without
    //         // setting this!
    //         //completeInTarget: true
    //     }
    //     if(fhirconfig.client_secret){
    //         options.clientSecret = fhirconfig.client_secret;
    //     }
    //     if( fhirconfig.client_id === 'OPEN' ) {
    //         options.fhirServiceUrl = fhirconfig.url
    //         options.patientId = fhirconfig.patientId
    //     } else {
    //         options.iss = fhirconfig.url
    //     }

    //     if(fhirconfig.patientId) {
    //         context.setPatientId(fhirconfig.patientId)
    //     }

    //     // alert(`options:  ${JSON.stringify(options)}`)
    //     // SMART.authorize(options);
    // }


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


    async function handleAuthorizeUser(){
      console.log('handleAuthorizeUser');

    
      window.location.href = authorizationUrlString;
      // // authenticate the user
      // SMART.authorize(launchConfig);
    }



    let headerHeight = 84;
    if(get(Meteor, 'settings.public.defaults.prominentHeader')){
        headerHeight = 148;
    }  

    let paddingWidth = 20;

    let authUrl = "https://launch.smarthealthit.org/sample-app?aud=https%3A%2F%2Flaunch.smarthealthit.org%2Fv%2Fr4%2Fsim%2FWzMsIiIsIiIsIkFVVE8iLDAsMCwwLCIiLCIiLCIiLCIiLCIiLCIiLCIiLDAsMV0%2Ffhir"

    let receivedParameterElements = [];
    if(get(window, 'location.search')){
      receivedParameterElements.push(<CardHeader key={Random.id()} title="Received Parameters" />)
      receivedParameterElements.push(<Card key={Random.id()}>
        <CardContent>
          {/* <Alert severity="info">{window.location.search}</Alert> */}
          {/* <br /> */}
          <br key={0} />
          <br key={1} />
          <Grid container spacing={3}>
            <Grid item md={4}>
              <TextField 
                id="response_type" 
                label="response_type" 
                variant="standard" 
                fullWidth
                disabled
                defaultValue="code"
              />
            </Grid>
            <Grid item md={4}>
              <TextField 
                id="client_id" 
                label="client_id" 
                variant="standard" 
                fullWidth
                defaultValue={searchParams.get('client_id')}
              />
            </Grid>
            <Grid item md={4}>
              <TextField 
                id="client" 
                label="client" 
                variant="standard" 
                fullWidth
                defaultValue={searchParams.get('client')}
              />
            </Grid>
            <Grid item md={8}>
              <TextField 
                id="iss" 
                label="iss" 
                variant="standard" 
                fullWidth
                defaultValue={searchParams.get('iss')}
              />
            </Grid>
            <Grid item md={4}>
              <TextField 
                id="launch" 
                label="launch" 
                variant="standard" 
                fullWidth
                defaultValue={searchParams.get('launch')}
              />
            </Grid>
            <Grid item md={8}>
              <TextField 
                id="aud" 
                label="aud" 
                variant="standard" 
                fullWidth
                defaultValue={searchParams.get('aud')}
              />
            </Grid>
            <Grid item md={4}>
              <TextField 
                id="code" 
                label="code" 
                variant="standard" 
                fullWidth
                defaultValue={searchParams.get('code')}
              />
            </Grid>
            <Grid item md={8}>
              <TextField 
                id="redirect_uri" 
                label="redirect_uri" 
                variant="standard" 
                fullWidth
                defaultValue={searchParams.get('redirect_uri')}
              />
            </Grid>
            <Grid item md={4}>
              <TextField 
                id="state" 
                label="state" 
                variant="standard" 
                fullWidth
                defaultValue={searchParams.get('state')}
              />
            </Grid>

            <Grid item md={12}>
              <TextField 
                id="scope" 
                label="scope" 
                variant="standard" 
                fullWidth
                defaultValue={searchParams.get('scope')}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>)
      receivedParameterElements.push(<br  key={3} />);
    } else {
      receivedParameterElements.push(<br  key={4} />);
      // receivedParameterElements.push(<Card><Alert severity="info">No search parameters specified in URL.</Alert></Card>);
      // receivedParameterElements.push(<br />);
    }


    let scopesElements = [];
    if(showScopes){
      scopesElements.push(<br />);
      scopesElements.push(<CardHeader key={Random.id()} title="Scopes" />)
      scopesElements.push(
        <Card key={Random.id()}>
          <CardContent>
            <FormControlLabel
              control={
                <Checkbox color="primary" inputProps={{ 'aria-label': 'secondary checkbox' }} checked={get(Meteor, 'settings.public.smartOnFhir[0].scope', '').includes("launch/patient")} />
              }
              label="launch/patient"
              // classes={{label: classes.label}}
            />
            <Typography variant="body1" style={{marginLeft: '30px'}}>
              Use this to obtain patient context in apps that use a standalone launch sequence.
            </Typography>
            <br />
            <FormControlLabel
              control={
                <Checkbox color="primary" inputProps={{ 'aria-label': 'secondary checkbox' }} checked={get(Meteor, 'settings.public.smartOnFhir[0].scope', '').includes("launch/encounter")} />
              }
              label="launch/encounter"
              // classes={{label: classes.label}}
            />
            <Typography variant="body1" style={{marginLeft: '30px'}}>
              Use this to obtain encounter context in apps that use a standalone launch sequence.
            </Typography>
            <br />
            <FormControlLabel
              control={
                <Checkbox color="primary" inputProps={{ 'aria-label': 'secondary checkbox' }} checked={get(Meteor, 'settings.public.smartOnFhir[0].scope', '').includes("patient/*.*")} />
              }
              label="patient/*.*"
              // classes={{label: classes.label}}
            />
            <Typography variant="body1" style={{marginLeft: '30px'}}>
              Use this to get full access to patient information.
            </Typography>
            <br />
            <FormControlLabel
              control={
                <Checkbox color="primary" inputProps={{ 'aria-label': 'secondary checkbox' }} checked={get(Meteor, 'settings.public.smartOnFhir[0].scope', '').includes("user/*.*")} />
              }
              label="user/*.*"
              // classes={{label: classes.label}}
            />
            <Typography variant="body1" style={{marginLeft: '30px'}}>
              Use this to get full access to information that the user can access.
            </Typography>
            <br />
            <FormControlLabel
              control={
                <Checkbox color="primary" inputProps={{ 'aria-label': 'secondary checkbox' }}checked={get(Meteor, 'settings.public.smartOnFhir[0].scope', '').includes("openid")} />
              }
              label="openid"
              // classes={{label: classes.label}}
            />
            <Typography variant="body1" style={{marginLeft: '30px'}}>
              Combine this with fhirUser or profile to get an ID Token and to be able to query information about the current user.
            </Typography>
            <br />
            <FormControlLabel
              control={
                <Checkbox color="primary" inputProps={{ 'aria-label': 'secondary checkbox' }} checked={get(Meteor, 'settings.public.smartOnFhir[0].scope', '').includes("profile")} />
              }
              label="profile"
              // classes={{label: classes.label}}
            />
            <Typography variant="body1" style={{marginLeft: '30px'}}>
              Combine this with openid to get an ID Token and to be able to query information about the current user.
            </Typography>
            <br />
            <FormControlLabel
              control={
                <Checkbox color="primary" inputProps={{ 'aria-label': 'secondary checkbox' }} checked={get(Meteor, 'settings.public.smartOnFhir[0].scope', '').includes("offline_access")} />
              }
              label="offline_access"
              // classes={{label: classes.label}}
            />
            <Typography variant="body1" style={{marginLeft: '30px'}}>
              Use this to get a Refresh Token and to be able to use the app for long periods of time without having to re-launch it.
            </Typography>
            <br />
            <FormControlLabel
              control={
                <Checkbox color="primary" inputProps={{ 'aria-label': 'secondary checkbox' }} checked={get(Meteor, 'settings.public.smartOnFhir[0].scope', '').includes("online_access")} />
              }
              label="online_access"
              // classes={{label: classes.label}}
            />
            <Typography variant="body1" style={{marginLeft: '30px'}}>
              Use this to get a Refresh Token and to be able to use the app for long periods of time without having to re-launch it, as long as the app is not closed.
            </Typography>
            <br />                        
            <FormControlLabel
              control={
                <Checkbox color="primary" inputProps={{ 'aria-label': 'secondary checkbox' }} checked={get(Meteor, 'settings.public.smartOnFhir[0].scope', '').includes("fhirUser")} />
              }
              label="fhirUser"
              // classes={{label: classes.label}}
            />
            <Typography variant="body1" style={{marginLeft: '30px'}}>
              Combine this with openid to get an ID Token and to be able to query information about the current user.
            </Typography>
            <br />                        
            <FormControlLabel
              control={
                <Checkbox color="primary" inputProps={{ 'aria-label': 'secondary checkbox' }} checked={get(Meteor, 'settings.public.smartOnFhir[0].scope', '').includes("smart/orchestrate_launch")} />
              }
              label="smart/orchestrate_launch"
              // classes={{label: classes.label}}
            />
            <Typography variant="body1" style={{marginLeft: '30px'}}>
              Use this if your app needs to be able to launch other SMART apps.
            </Typography>
            <br />                        
          </CardContent>
        </Card>
      );
    }



    return (
        <div id='SmartLauncher' style={{paddingBottom: '200px', height: window.innerHeight + "px", overflow: 'scroll'}} >
            
            <Grid container justifyContent="center" spacing={3}>
                <Grid item xs={12} sm={12} md={6} lg={6} >
                  { receivedParameterElements }
                  <CardHeader title="SMART on FHIR App Settings" subheader="These values are specified in Meteor.settings.public.smartOnFHIR[0]" />
                  <Card>
                    <CardContent>
                      <AceEditor
                        mode="json"
                        theme={theme === 'light' ? "tomorrow" : "monokai"}
                        wrapEnabled={false}
                        // onChange={onUpdateLlmFriendlyNdjsonString}
                        name="smartOnFhirSettings"
                        editorProps={{ $blockScrolling: true }}
                        value={JSON.stringify(get(Meteor, 'settings.public.smartOnFhir'), null, 2)}
                        style={{width: '100%', position: 'relative', height: '200px', minHeight: '200px', borderColor: '#ccc', borderRadius: '4px', lineHeight: '16px'}}        
                      /> 
                      <br />                        
                      <Grid container spacing={3}>
                          <Grid item md={4}>
                            <TextField 
                              id="response_type" 
                              label="response_type" 
                              variant="standard" 
                              fullWidth
                              disabled
                              defaultValue="code"
                            />
                          </Grid>
                          <Grid item md={4}>
                            <TextField 
                              id="client_id" 
                              label="client_id" 
                              variant="standard" 
                              fullWidth
                              defaultValue={get(Meteor, 'settings.public.smartOnFhir[0].client_id', '')}
                            />
                          </Grid>
                          <Grid item md={4}>
                            <TextField 
                              id="client" 
                              label="client" 
                              variant="standard" 
                              fullWidth
                              defaultValue={get(Meteor, 'settings.public.smartOnFhir[0].client_name', '')}
                            />
                          </Grid>
                          <Grid item md={8}>
                            <TextField 
                              id="iss" 
                              label="iss" 
                              variant="standard" 
                              fullWidth
                              defaultValue={get(Meteor, 'settings.public.smartOnFhir[0].iss', '')}
                            />
                          </Grid>
                          <Grid item md={4}>
                            <TextField 
                              id="launch" 
                              label="launch" 
                              variant="standard" 
                              fullWidth
                              defaultValue=""
                            />
                          </Grid>
                          <Grid item md={8}>
                            <TextField 
                              id="fhirServiceUrl" 
                              label="fhirServiceUrl" 
                              variant="standard" 
                              fullWidth
                              defaultValue={get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '')}
                            />
                          </Grid>
                          <Grid item md={4}>
                            <TextField 
                              id="code" 
                              label="code" 
                              variant="standard" 
                              fullWidth
                              defaultValue=""
                            />
                          </Grid>
                          <Grid item md={8}>
                            <TextField 
                              id="redirect_uri" 
                              label="redirect_uri" 
                              variant="standard" 
                              fullWidth
                              defaultValue={get(Meteor, 'settings.public.smartOnFhir[0].redirect_uri', '')}
                            />
                          </Grid>
                          <Grid item md={4}>
                            <TextField 
                              id="state" 
                              label="state" 
                              variant="standard" 
                              fullWidth
                              defaultValue=""
                            />
                          </Grid>

                          <Grid item md={12}>
                            <TextField 
                              id="scope" 
                              label="scope" 
                              variant="standard" 
                              fullWidth
                              defaultValue={get(Meteor, 'settings.public.smartOnFhir[0].scope', '')}
                            />
                          </Grid>
                        </Grid>
                    </CardContent>
                    <CardActions>
                      <Button color="info" onClick={() => { setShowScopes(!showScopes) }}> 
                        More
                      </Button>
                    </CardActions>
                  </Card>

                    { scopesElements }                  
                    <br />
                    <Card>
                      <Alert severity="info">{authorizationUrlString}</Alert>
                    </Card>                    
                    <br />
                    <Button fullWidth variant="contained" color="primary" onClick={handleAuthorizeUser}> 
                      Authorize
                    </Button>
                </Grid>
            </Grid>
        </div>
    )
    
}

