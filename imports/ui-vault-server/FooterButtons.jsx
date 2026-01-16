import React, { useState } from 'react';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { 
    DialogActions,
    Button
} from '@mui/material';

import { get, has, isEqual } from 'lodash';
import JSON5 from 'json5';


import moment from 'moment';

//========================================================================================================

import {
  fade,
  ThemeProvider,
  MuiThemeProvider,
  withStyles,
  makeStyles,
  createMuiTheme,
  useTheme
} from '@mui/material/styles';

  // Global Theming 
  // This is necessary for the Material UI component render layer
  let theme = {
    appBarColor: "#000000",
    appBarTextColor: "#ffffff"
  }

  // if we have a globally defined theme from a settings file
  if(get(Meteor, 'settings.public.theme.palette')){
    theme = Object.assign(theme, get(Meteor, 'settings.public.theme.palette'));
  }

  const muiTheme = createMuiTheme({
    typography: {
      useNextVariants: true,
    },
    palette: {
      appBar: {
        main: theme.appBarColor,
        contrastText: theme.appBarTextColor
      },
      contrastThreshold: 3,
      tonalOffset: 0.2
    }
  });



//============================================================================================================================
// Shared Functions




//============================================================================================================================
// Shared Styles  

let buttonStyles = {
    west_button: {
      cursor: 'pointer',
      justifyContent: 'left',
      color: '#ffffff',
      marginLeft: '20px',
      marginTop: '5px',
      float: 'left',
      position: 'relative'
    },
    east_button: {
      cursor: 'pointer',
      justifyContent: 'right',
      color: '#ffffff',
      right: '20px',
      marginTop: '5px',
      float: 'right',
      position: 'relative'
    }
  }




//============================================================================================================================
// Turntable / Biosignature

export function VhDirFooterButtons(props){
  // const buttonClasses = buttonStyles();

  let { 
    children, 
    jsonContent,
    ...otherProps 
  } = props;

  function togglePreferences(){
    Session.toggle('mainAppDialogOpen');

    Session.set('mainAppDialogComponent', "PreferencesDialog");
    Session.set('mainAppDialogTitle', "Preferences");
    Session.set('mainAppDialogMaxWidth', "sm");
  }
  function toggleSearchNlm(){
    Session.toggle('mainAppDialogOpen');

    Session.set('mainAppDialogComponent', "SearchLibraryOfMedicineDialog");
    Session.set('mainAppDialogTitle', "Search the National Library of Medicine");
    Session.set('mainAppDialogMaxWidth', "md");
  }

  
  return (
    <MuiThemeProvider theme={muiTheme}>
      <Button onClick={ togglePreferences.bind(this) } style={buttonStyles.west_button}>
        Preferences
      </Button>      
      <Button onClick={ toggleSearchNlm.bind(this) } style={buttonStyles.west_button}>
        Search NLM
      </Button>      
    </MuiThemeProvider>
  );
}


//============================================================================================================================
// Shared Functions


function toggleSelect(resourceType){
    Session.toggle(resourceType + 'sTable.hideCheckbox')
}
function toggleLayout(resourceType){
    Session.toggle(resourceType + 'sPage.onePageLayout')
}
function handleClose(){
    Session.set('mainAppDialogOpen', false)
}

//============================================================================================================================
// Shared Components

export function DefaultPostDialogActions(props){

    let { 
        children, 
        resourceType,
        relayUrl,
        ...otherProps 
    } = props;

    function handleSendRecord(){
        console.log('handleSendRecord', props);

        let relayUrl = get(Meteor, 'settings.public.interfaces.fhirRelay.channel.endpoint', 'http://localhost:3000/baseR4')
        if(relayUrl){
            let currentCodeSystem = Session.get('CodeSystem.Current')
            let assembledUrl = relayUrl;
            if(has(currentCodeSystem, 'id')){
                assembledUrl = relayUrl + '/' + resourceType + '/' + get(currentCodeSystem, 'id');
                console.log('PUT ' + assembledUrl)
                // HTTP.put(assembledUrl, {data: currentCodeSystem}, function(error, result){
                //     if(error){
                //         alert(JSON.stringify(error.message));
                //     }
                //     if(result){
                //         Session.set('mainAppDialogOpen', false)
                //     }
                // })

                await fetch(assembledUrl, {
                  method: 'PUT',
                  body: JSON.stringify(currentCodeSystem),
                  headers: {
                    'Content-Type': 'application/json'
                  }
                }).then(response => response.json())
                .then(data => {
                  Session.set('mainAppDialogOpen', false)
                }).catch((error) => {
                  alert(JSON.stringify(error.message));
                });
            } else {
                assembledUrl = relayUrl + '/' + resourceType;
                console.log('POST ' + assembledUrl)
                // HTTP.post(assembledUrl, {data: currentCodeSystem}, function(error, result){
                //     if(error){
                //         alert(JSON.stringify(error.message));
                //     }
                //     if(result){
                //         Session.set('mainAppDialogOpen', false)
                //     }
                // })

                await fetch(assembledUrl, {
                  method: 'PUT',
                  body: JSON.stringify(currentCodeSystem),
                  headers: {
                    'Content-Type': 'application/json'
                  }
                }).then(response => response.json())
                .then(data => {
                  Session.set('mainAppDialogOpen', false)
                }).catch((error) => {
                  alert(JSON.stringify(error.message));
                });
            }    
        }
    }

    let actionsToRender;
    if(Meteor.currentUserId()){
        actionsToRender = <DialogActions >
            <Button onClick={handleClose} color="primary">
                Close
            </Button>
            <Button onClick={handleSendRecord.bind(this)} color="primary" variant="contained">
                Send
            </Button>
        </DialogActions>
    } else {
        actionsToRender = <DialogActions ></DialogActions>
    }
    
    

    return actionsToRender;
}



//============================================================================================================================
// Certificates

export function CertificatesButtons(props){
    // const buttonClasses = buttonStyles();
    
    function toggleNewCertificateDialog(){
      Session.set('mainAppDialogOpen', true);
  
      Session.set('mainAppDialogTitle', "Add Certificate");
      Session.set('mainAppDialogComponent', "NewCertificateDialog");
      Session.set('mainAppDialogMaxWidth', "md");
    }
  
    
    return (
      <MuiThemeProvider theme={muiTheme}  >
        <Button onClick={ toggleNewCertificateDialog.bind(this) } style={buttonStyles.west_button}>
          New Certificate
        </Button>      
        {props.children}
      </MuiThemeProvider>
    );
}

  
export function AddCertificateDialogActions(props){

    let { 
        children, 
        resourceType,
        relayUrl,
        ...otherProps 
    } = props;

    function handleSendRecord(){
        console.log('handleSendRecord', props);

        let newCertificateRecord = {
            resourceType: "UdapCertificate",
            createdAt: new Date(),
            certificateOwner:  Session.get('newUdapCertificateOwner'),
            certificate:  Session.get('newUdapCertificate')
        }

        
        console.log('JSON.stringify(newCertificateRecord)', JSON.stringify(newCertificateRecord))

        // let relayUrl = get(Meteor, 'settings.public.interfaces.fhirRelay.channel.endpoint', 'http://localhost:3000/baseR4')
        // if(relayUrl){
        //     let currentCodeSystem = Session.get('CodeSystem.Current')
        //     let assembledUrl = relayUrl;
        //     if(has(currentCodeSystem, 'id')){
        //         assembledUrl = relayUrl + '/' + resourceType + '/' + get(currentCodeSystem, 'id');
        //         console.log('PUT ' + assembledUrl)
        //         HTTP.put(assembledUrl, {data: currentCodeSystem}, function(error, result){
        //             if(error){
        //                 alert(JSON.stringify(error.message));
        //             }
        //             if(result){
        //                 Session.set('mainAppDialogOpen', false)
        //             }
        //         })
        //     } else {
        //         assembledUrl = relayUrl + '/' + resourceType;
        //         console.log('POST ' + assembledUrl)
        // HTTP.post(Meteor.absoluteUrl() + "/newCertificate", {data: newCertificateRecord}, function(error, result){
        //     if(error){
        //         alert(JSON.stringify(error.message));
        //     }
        //     if(result){
        //         console.log('HTTP.post', result)
        //         Session.set('mainAppDialogOpen', false);
        //     }
        // })


        await fetch(Meteor.absoluteUrl() + "/newCertificate", {
          method: 'PUT',
          body: JSON.stringify(newCertificateRecord),
          headers: {
            'Content-Type': 'application/json'
          }
        }).then(response => response.json())
        .then(data => {
          Session.set('mainAppDialogOpen', false)
        }).catch((error) => {
          alert(JSON.stringify(error.message));
        });



        //     }    
        // }
    }

    let actionsToRender;
    if(Meteor.currentUserId()){
        actionsToRender = <DialogActions >
            <Button onClick={handleClose} color="primary">
                Close
            </Button>
            <Button onClick={handleSendRecord.bind(this)} color="primary" variant="contained">
                Send
            </Button>
        </DialogActions>
    } else {
        actionsToRender = <DialogActions >{props.children}</DialogActions>
    }
    
    

    return actionsToRender;
}

