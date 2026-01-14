import React, { useContext, useState, useEffect } from "react";

import {
  useLocation, 
  useNavigate
} from "react-router-dom";


import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { fetch, Headers } from 'meteor/fetch';

import { get, has } from 'lodash';

import { oauth2 as SMART } from "fhirclient";
// import config from "../config"
import { FhirClientContext } from "../FhirClientContext";
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
import 'ace-builds/src-noconflict/mode-json'

import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/theme-monokai";
import { DynamicSpacer } from './DynamicSpacer';

//----------------------------------------------------------------------
// Helper Components

let useTheme;
Meteor.startup(function(){
  useTheme = Meteor.useTheme;
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
      console.log('PKCE Success: The code_verifier correctly generates the expected code_challenge.');
  } else {
      console.error('PKCE Failure: The code_verifier does NOT generate the expected code_challenge.');
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

export default function SmartAppDebugger(props){
  console.log('SmartAppDebugger', props)

  const { theme, toggleTheme } = useTheme();

    let searchParams = new URLSearchParams(useLocation().search);
    
    let [smartConfig, setSmartConfig] = useState(null);
    let [showScopes, setShowScopes] = useState(false);
    let [serverCapabilityStatement, setServerCapabilityStatement] = useState("");
    let [wellKnownSmartConfig, setWellKnownSmartConfig] = useState("");
    let [smartAccessToken, setSmartAccessToken] = useState("");
    let [fhirPatient, setFhirPatient] = useState("");
    

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

        fetchCapabilityStatement();
        
    
    }, [])



    async function fetchCapabilityStatement(){
      console.log('fetchCapabilityStatement');

      const capabilityStatementString = await fetch(get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/metadata?_format=json");
      
      const capabilityStatement = await capabilityStatementString.json();

      if(capabilityStatement){
        console.log('HTTP.get /metadata capabilityStatement', capabilityStatement)
        
        // are we getting the resource directly?
        if(get(capabilityStatement, 'resourceType') === "CapabilityStatement"){
          setServerCapabilityStatement(capabilityStatement);
          fetchWellKnownSmartConfig();
        } else{
          // or are we getting an object, with the resource as a payload?
          if(get(capabilityStatement, 'data')){
            setServerCapabilityStatement(capabilityStatement.data);
            fetchWellKnownSmartConfig();
          } else if (get(capabilityStatement, 'content')) {
            setServerCapabilityStatement(JSON.parse(get(capabilityStatement, 'content')));
            fetchWellKnownSmartConfig();
          } 
        }

      }
    }
    async function fetchWellKnownSmartConfig(callback){
      console.log('fetchWellKnownSmartConfig');

      const wellKnownSmartConfigString = await fetch(get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/.well-known/smart-configuration");
      const wellKnownSmartConfig = await wellKnownSmartConfigString.json();

      if(wellKnownSmartConfig){

        if(typeof wellKnownSmartConfig === "object"){
          setWellKnownSmartConfig(wellKnownSmartConfig);
          exchangeCodeForAccessToken(wellKnownSmartConfig); 
        } else{
          console.log('HTTP.get /.well-known/smart-configuration wellKnownSmartConfig', wellKnownSmartConfig)
          setWellKnownSmartConfig(get(wellKnownSmartConfig, 'data'));
          exchangeCodeForAccessToken(get(wellKnownSmartConfig, 'data'));  
        }

      }
    }
    async function exchangeCodeForAccessToken(wellKnownSmartConfig){
      console.log('exchangeCodeForAccessToken.wellKnownSmartConfig',wellKnownSmartConfig)
      console.log('exchangeCodeForAccessToken.wellKnownSmartConfig.url', get(wellKnownSmartConfig, 'token_endpoint'))


          // Save to Local Storage (persistent across tabs and sessions)
      let codeVerifier = localStorage.getItem('pkce_code_verifier');

      const codeChallenge = await generateCodeChallenge(codeVerifier);
      console.log('codeChallenge', codeChallenge);


      var stringEncodedData = new URLSearchParams();

      stringEncodedData.set('code_verifier', codeVerifier);
      stringEncodedData.set('code', searchParams.get('code'));
      stringEncodedData.set('grant_type', 'authorization_code');
      stringEncodedData.set('redirect_uri', get(Meteor, 'settings.public.smartOnFhir[0].redirect_uri', ''));
      stringEncodedData.set('client_id', get(Meteor, 'settings.public.smartOnFhir[0].client_id', ''));


      console.log('exchangeCodeForAccessToken.stringEncodedData', stringEncodedData.toString());


      // let payload = {
      //   code: searchParams.get('code'),
      //   grant_type: 'authorization_code',
      //   redirect_uri: encodeURIComponent(get(Meteor, 'settings.public.smartOnFhir[0].redirect_uri', '')),
      //   client_id: get(Meteor, 'settings.public.smartOnFhir[0].client_id', '')
      // }
      // console.log('exchangeCodeForAccessToken.searchParams.code', searchParams.get('code'))
      // console.log('exchangeCodeForAccessToken.payload', payload)
      
      const tokenEndpointString = await fetch(get(wellKnownSmartConfig, 'token_endpoint'), {
        method: "post",
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: stringEncodedData.toString()
      });
      // const tokenEndpointString = await fetch(get(wellKnownSmartConfig, 'token_endpoint'), {
      //   headers: {
      //     'Content-Type': 'application/json'
      //   }
      // });
      const tokenEndpoint = await tokenEndpointString.json();

      if(tokenEndpoint){
        console.log('HTTP.post /token tokenEndpoint', tokenEndpoint)

        if(get(tokenEndpoint, 'data')){
          // Epic
          setSmartAccessToken(get(tokenEndpoint, 'data'));
          fetchPatient(get(tokenEndpoint, 'data.patient'), get(tokenEndpoint, 'data.access_token'));
        } else {
          // Cerner
          setSmartAccessToken(tokenEndpoint);
          fetchPatient(get(tokenEndpoint, 'patient'), get(tokenEndpoint, 'access_token'));
        }        
      }

      // await fetch(assembledUrl, {
      //   method: 'PUT',
      //   body: JSON.stringify(currentCodeSystem),
      //   headers: {
      //     'Content-Type': 'application/json'
      //   }
      // }).then(response => response.json())
      // .then(data => {
      //   Session.set('mainAppDialogOpen', false)
      // }).catch((error) => {
      //   alert(JSON.stringify(error.message));
      // });

    }
    async function fetchPatient(patientId, accessToken){
      console.log('fetchPatient.patientId', patientId)
      console.log('fetchPatient.url', get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/Patient/" + patientId + "?_format=json")
      console.log('fetchPatient.accessToken', accessToken)
      

      const fetchedPatientString = await fetch(get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/Patient/" + patientId + "?_format=json", {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': "Bearer " + accessToken
        }
      })
      const fetchedPatient = await fetchedPatientString.json();

      if(fetchedPatient){
        console.log('HTTP.get /Patient fetchedPatient', fetchedPatient)

        if(get(fetchedPatient, 'data')){
          setFhirPatient(get(fetchedPatient, 'data'));
        } else if (get(fetchedPatient, 'content')) {
          setFhirPatient(JSON.parse(get(fetchedPatient, 'content')));
        } else {
          setFhirPatient(fetchedPatient);
        }
      }
    }



    async function handleAuthorizeUser(){
      console.log('handleAuthorizeUser');

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


      // // authenticate the user
      // SMART.authorize(launchConfig);
    }

    function ensureRealValue(value){
      if((typeof value !== null) || (typeof value !== "undefined")){
        return value;
      } else {
        return "";
      }
    }
    


    let headerHeight = 84;
    if(get(Meteor, 'settings.public.defaults.prominentHeader')){
        headerHeight = 148;
    }  

    let paddingWidth = 20;

    let authUrl = "https://launch.smarthealthit.org/sample-app?aud=https%3A%2F%2Flaunch.smarthealthit.org%2Fv%2Fr4%2Fsim%2FWzMsIiIsIiIsIkFVVE8iLDAsMCwwLCIiLCIiLCIiLCIiLCIiLCIiLCIiLDAsMV0%2Ffhir"

    let receivedParameterElements = [];
    if(get(window, 'location.search')){
      receivedParameterElements.push(<CardHeader key={5} title="Received Parameters" subheader="Parameters that are pased in via URL during the application redirect process." />)
      receivedParameterElements.push(<Card key={50} >
        <CardContent>
          <Alert severity="info">{window.location.search}</Alert>
          <br />
          <Grid container spacing={3}>
            <Grid item md={4}>
              <TextField 
                id="response_type" 
                label="response_type" 
                variant="standard" 
                fullWidth
                disabled
                defaultValue={ensureRealValue("code")}                
              />
            </Grid>
            <Grid item md={4}>
              <TextField 
                id="client_id" 
                label="client_id" 
                variant="standard" 
                fullWidth
                defaultValue={searchParams.get('client_id') ? ensureRealValue(searchParams.get('client_id')) : ""}
              />
            </Grid>
            <Grid item md={4}>
              <TextField 
                id="client" 
                label="client" 
                variant="standard" 
                fullWidth
                defaultValue={searchParams.get('client') ? ensureRealValue(searchParams.get('client')) : ""}
              />
            </Grid>
            <Grid item md={8}>
              <TextField 
                id="iss" 
                label="iss" 
                variant="standard" 
                fullWidth
                defaultValue={searchParams.get('iss') ? ensureRealValue(searchParams.get('iss')) : ""}
              />
            </Grid>
            <Grid item md={4}>
              <TextField 
                id="launch" 
                label="launch" 
                variant="standard" 
                fullWidth
                defaultValue={searchParams.get('launch') ? ensureRealValue(searchParams.get('launch')) : ""}
              />
            </Grid>
            <Grid item md={8}>
              <TextField 
                id="aud" 
                label="aud" 
                variant="standard" 
                fullWidth
                defaultValue={searchParams.get('aud') ? ensureRealValue(searchParams.get('aud')) : ""}
              />
            </Grid>
            <Grid item md={4}>
              <TextField 
                id="code" 
                label="code" 
                variant="standard" 
                fullWidth
                defaultValue={searchParams.get('code') ? ensureRealValue(searchParams.get('code')) : ""}
              />
            </Grid>
            <Grid item md={8}>
              <TextField 
                id="redirect_uri" 
                label="redirect_uri" 
                variant="standard" 
                fullWidth
                defaultValue={searchParams.get('redirect_uri') ? ensureRealValue(searchParams.get('redirect_uri')) : ""}
              />
            </Grid>
            <Grid item md={4}>
              <TextField 
                id="state" 
                label="state" 
                variant="standard" 
                fullWidth
                defaultValue={searchParams.get('state') ? ensureRealValue(searchParams.get('state')) : ""}
              />
            </Grid>

            <Grid item md={12}>
              <TextField 
                id="scope" 
                label="scope" 
                variant="standard" 
                fullWidth
                defaultValue={searchParams.get('scope') ? ensureRealValue(searchParams.get('scope')) : ""}
              />
            </Grid>
            <Grid item md={12}>
              <TextField 
                id="error_uri" 
                label="error_uri" 
                variant="standard" 
                fullWidth
                defaultValue={searchParams.get('error_uri') ? ensureRealValue(searchParams.get('error_uri')) : ""}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>)
      receivedParameterElements.push(<br key={6} />);
      receivedParameterElements.push(<Card key={60}> 
        <CardContent>
          <AceEditor
            mode="text"
            theme={theme === 'light' ? "tomorrow" : "monokai"}
            wrapEnabled={true}
            style={{width: '100%', position: 'relative', height: '200px', minHeight: '200px', borderColor: '#ccc', borderRadius: '4px', lineHeight: '16px'}}
            defaultValue={searchParams.get('code') ? ensureRealValue(searchParams.get('code')) : ""}
            setOptions={{
              useWorker: false
            }}
          />
          <br />
          <Grid container>
            <Grid item md={12}>
              <TextField 
                id="response_type" 
                label="header" 
                variant="standard" 
                fullWidth
                disabled
                defaultValue={searchParams.get('code') ? ensureRealValue(searchParams.get('code').split('.')[0]) :  ""}
              />
              <br />
              <TextField 
                id="response_type" 
                label="payload" 
                variant="standard" 
                fullWidth
                disabled
                defaultValue={searchParams.get('code') ? ensureRealValue(searchParams.get('code').split('.')[1]) : ""}
              />
              <br />
              <TextField 
                id="response_type" 
                label="signature" 
                variant="standard" 
                fullWidth
                disabled
                defaultValue={searchParams.get('code') ? ensureRealValue(searchParams.get('code').split('.')[2]) : ""}
              />

            </Grid>
          </Grid>
        </CardContent>
      </Card>)
    } else {
      receivedParameterElements.push(<CardHeader key={7} title="Received Parameters" subheader="Parameters that are pased in via URL during the application redirect process." />)
      receivedParameterElements.push(<Card key={70}><Alert severity="info">No search parameters specified in URL.</Alert></Card>);
      receivedParameterElements.push(<br key={700} />);
    }


    let scopesElements = [];
    if(showScopes){
      scopesElements.push(<br key={4} />);
      scopesElements.push(<CardHeader key={40} title="Scopes" />)
      scopesElements.push(
        <Card key={400}>
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



    let fhirServer = get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '')
    if(get(Meteor, 'settings.public.smartOnFhir[0].iss')){
      fhirServer = get(Meteor, 'settings.public.smartOnFhir[0].iss', '')
    }
    fhirServer = fhirServer + "/metadata?_format=json";

    return (
        <div id='SmartLauncher' style={{'height': window.innerHeight, 'overflow': "auto", padding: "20px"}} >
            
            <Grid container spacing={3} style={{width: '100%'}}>
              <Grid item xs={3} sm={3} md={3} lg={3} >
                
                <CardHeader title="Default App Settings" subheader="These are the parameters for the SMART on FHIR protocol, as specified in Meteor.settings.public.smartOnFHIR[0]" />
                <Card>
                  <CardContent>
                    <AceEditor
                      mode="text"
                      theme={theme === 'light' ? "tomorrow" : "monokai"}
                      wrapEnabled={false}
                      // onChange={onUpdateLlmFriendlyNdjsonString}
                      name="smartOnFhirSettings"
                      editorProps={{ $blockScrolling: true }}
                      value={JSON.stringify(get(Meteor, 'settings.public.smartOnFhir'), null, 2)}
                      style={{width: '100%', position: 'relative', height: '200px', minHeight: '200px', borderColor: '#ccc', borderRadius: '4px', lineHeight: '16px'}}        
                      setOptions={{
                        useWorker: false
                      }}
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
                            defaultValue={ensureRealValue("code")}
                          />
                        </Grid>
                        <Grid item md={4}>
                          <TextField 
                            id="client_id" 
                            label="client_id" 
                            variant="standard" 
                            fullWidth
                            defaultValue={ensureRealValue(get(Meteor, 'settings.public.smartOnFhir[0].client_id', ''))}
                          />
                        </Grid>
                        <Grid item md={4}>
                          <TextField 
                            id="client" 
                            label="client" 
                            variant="standard" 
                            fullWidth
                            defaultValue={ensureRealValue(get(Meteor, 'settings.public.smartOnFhir[0].client_name', ''))}
                          />
                        </Grid>
                        <Grid item md={8}>
                          <TextField 
                            id="iss" 
                            label="iss" 
                            variant="standard" 
                            fullWidth
                            defaultValue={ensureRealValue(get(Meteor, 'settings.public.smartOnFhir[0].iss', ''))}
                          />
                        </Grid>
                        <Grid item md={4}>
                          <TextField 
                            id="launch" 
                            label="launch" 
                            variant="standard" 
                            fullWidth
                            defaultValue={ensureRealValue("")}
                          />
                        </Grid>
                        <Grid item md={8}>
                          <TextField 
                            id="fhirServiceUrl" 
                            label="fhirServiceUrl" 
                            variant="standard" 
                            fullWidth
                            defaultValue={ensureRealValue(get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', ''))}
                          />
                        </Grid>
                        <Grid item md={4}>
                          <TextField 
                            id="code" 
                            label="code" 
                            variant="standard" 
                            fullWidth
                            defaultValue={ensureRealValue("")}
                          />
                        </Grid>
                        <Grid item md={8}>
                          <TextField 
                            id="redirect_uri" 
                            label="redirect_uri" 
                            variant="standard" 
                            fullWidth
                            defaultValue={ensureRealValue(get(Meteor, 'settings.public.smartOnFhir[0].redirect_uri', ''))}
                          />
                        </Grid>
                        <Grid item md={4}>
                          <TextField 
                            id="state" 
                            label="state" 
                            variant="standard" 
                            fullWidth
                            defaultValue={ensureRealValue("")}
                          />
                        </Grid>

                        <Grid item md={12}>
                          <TextField 
                            id="scope" 
                            label="scope" 
                            variant="standard" 
                            fullWidth
                            defaultValue={ensureRealValue(get(Meteor, 'settings.public.smartOnFhir[0].scope', ''))}
                          />
                        </Grid>
                      </Grid>
                  </CardContent>
                  <CardActions>
                    <Button color="primary" onClick={() => { setShowScopes(!showScopes) }}> 
                      More
                    </Button>
                  </CardActions>
                </Card>                
                { scopesElements }                  
                <br />
                <Card>
                  <Alert severity="info">{JSON.stringify(smartConfig)}</Alert>
                </Card>                    
                <br />
                <Button fullWidth variant="contained" color="primary" onClick={handleAuthorizeUser}> 
                  Authorize
                </Button>
              </Grid>
              <Grid item xs={3} sm={3} md={3} lg={3} >
                { receivedParameterElements }
              </Grid>
              <Grid item xs={3} sm={3} md={3} lg={3} >
                <CardHeader title="Server Capability Statement" subheader="These values are specified in Meteor.settings.public.smartOnFHIR[0]" />
                <Card>
                  <CardContent>
                    <TextField 
                      id="server_url" 
                      label="server_url" 
                      variant="standard" 
                      fullWidth
                      disabled
                      defaultValue={ensureRealValue(get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/metadata?_format=json")}
                    />
                    <br />
                    <AceEditor
                      mode="text"
                      theme={theme === 'light' ? "tomorrow" : "monokai"}
                      wrapEnabled={false}
                      // onChange={onUpdateLlmFriendlyNdjsonString}
                      name="smartOnFhirSettings"
                      editorProps={{ $blockScrolling: true }}
                      value={JSON.stringify(serverCapabilityStatement, null, 2)}
                      style={{width: '100%', position: 'relative', height: '400px', minHeight: '200px', borderColor: '#ccc', borderRadius: '4px', lineHeight: '16px'}}        
                      setOptions={{
                        useWorker: false
                      }}
                    />                   
                  </CardContent>
                  <CardActions>
                    <Button color="primary" onClick={fetchCapabilityStatement}> 
                      Fetch Server Metadata
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={3} sm={3} md={3} lg={3} >
                <CardHeader title=".well-known/smart-configuration" subheader="These values are specified in Meteor.settings.public.smartOnFHIR[0]" />
                <Card>
                  <CardContent>
                    <TextField 
                      id="server_url" 
                      label="server_url" 
                      variant="standard" 
                      fullWidth
                      disabled
                      defaultValue={ensureRealValue(get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/.well-known/smart-configuration")}
                    />
                    <br />
                    <AceEditor
                      mode="text"
                      theme={theme === 'light' ? "tomorrow" : "monokai"}
                      wrapEnabled={false}
                      // onChange={onUpdateLlmFriendlyNdjsonString}
                      name="smartOnFhirSettings"
                      editorProps={{ $blockScrolling: true }}
                      value={JSON.stringify(wellKnownSmartConfig, null, 2)}
                      style={{width: '100%', position: 'relative', height: '400px', minHeight: '200px', borderColor: '#ccc', borderRadius: '4px', lineHeight: '16px'}}       
                      setOptions={{
                        useWorker: false
                      }}
                    />                   
                  </CardContent>
                  <CardActions>
                    <Button color="primary" onClick={fetchWellKnownSmartConfig}> 
                      Fetch SMART Config
                    </Button>
                  </CardActions>
                </Card>
                <br />
                <Card>
                  <CardContent>
                    <TextField 
                      id="server_url" 
                      label="server_url" 
                      variant="standard" 
                      fullWidth
                      value={ensureRealValue(wellKnownSmartConfig ? get(wellKnownSmartConfig, 'token_endpoint') : '')}
                    />
                    <br />
                    <TextField 
                      id="grant_type" 
                      label="grant_type" 
                      variant="standard" 
                      fullWidth
                      disabled
                      value={ensureRealValue("authorization_code")}
                    />
                    <br />
                    <TextField 
                      id="code" 
                      label="code" 
                      variant="standard" 
                      fullWidth
                      value={searchParams.get('code') ? ensureRealValue(searchParams.get('code')) : ""}
                    />
                    <br />
                    <TextField 
                      id="redirect_uri" 
                      label="redirect_uri" 
                      variant="standard" 
                      fullWidth
                      value={ensureRealValue(encodeURIComponent(get(Meteor, 'settings.public.smartOnFhir[0].redirect_uri', '')))}
                    />
                    <br />
                    <TextField 
                      id="client_id" 
                      label="client_id" 
                      variant="standard" 
                      fullWidth
                      value={ensureRealValue(get(Meteor, 'settings.public.smartOnFhir[0].client_id', ''))}
                    />
                    <br />
                    <TextField 
                      id="payload" 
                      label="payload" 
                      variant="standard" 
                      fullWidth
                      value={ensureRealValue("grant_type=authorization_code&code=" + searchParams.get('code') + '&redirect_uri=' + encodeURIComponent(get(Meteor, 'settings.public.smartOnFhir[0].redirect_uri', '')) + '&client_id=' + get(Meteor, 'settings.public.smartOnFhir[0].client_id', ''))}
                    />
                  </CardContent>
                  <CardActions>
                    <Button color="primary" onClick={exchangeCodeForAccessToken}>Exchange code for access token</Button>
                  </CardActions>
                </Card>
              </Grid>              
            </Grid>
            <br />
            <hr />
            <br />
            <Grid container spacing={3} style={{width: '100%', marginBottom: '200px'}}>
              <Grid item xs={3} sm={3} md={3} lg={3} >
                  <CardHeader title="Access Token Response"  />
                  <Card>
                    <CardContent>
                      <AceEditor
                        mode="text"
                        theme={theme === 'light' ? "tomorrow" : "monokai"}
                        wrapEnabled={false}
                        // onChange={onUpdateLlmFriendlyNdjsonString}
                        name="smartOnFhirSettings"
                        editorProps={{ $blockScrolling: true }}
                        value={JSON.stringify(smartAccessToken, null, 2)}
                        style={{width: '100%', position: 'relative', height: '200px', minHeight: '200px', borderColor: '#ccc', borderRadius: '4px', lineHeight: '16px'}}        
                        setOptions={{
                          useWorker: false
                        }}
                      />                   
                    </CardContent>
                    <CardActions>
                      <Button color="primary" onClick={fetchPatient}> 
                        Fetch Patient
                      </Button>
                    </CardActions>
                  </Card>
              </Grid>
              <Grid item xs={3} sm={3} md={3} lg={3} >
                  <CardHeader title="FHIR Patient"  />
                  <Card>
                    <CardContent>
                      <AceEditor
                        mode="text"
                        theme={theme === 'light' ? "tomorrow" : "monokai"}
                        wrapEnabled={false}
                        // onChange={onUpdateLlmFriendlyNdjsonString}
                        name="smartOnFhirSettings"
                        editorProps={{ $blockScrolling: true }}
                        value={JSON.stringify(fhirPatient, null, 2)}
                        style={{width: '100%', position: 'relative', height: '200px', minHeight: '200px', borderColor: '#ccc', borderRadius: '4px', lineHeight: '16px'}}        
                        setOptions={{
                          useWorker: false
                        }}
                      />                   
                    </CardContent>
                  </Card>
              </Grid>
            </Grid>
        </div>
    )
    
}

