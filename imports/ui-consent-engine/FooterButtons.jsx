import React, { useState } from 'react';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { 
    DialogActions,
    Button
} from '@mui/material';

import { get, has, isEqual } from 'lodash';
import JSON5 from 'json5';

import { fetch, Headers } from 'meteor/fetch';


import { FhirUtilities } from '../lib/FhirUtilities';
import { Consents } from '../imports/lib/schemas/SimpleSchemas/Consents';

import moment from 'moment';

//========================================================================================================

import {
  fade,
  ThemeProvider,
  MuiThemeProvider,
  withStyles,
  makeStyles,
  createTheme,
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

  const muiTheme = createTheme({
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
                  method: 'POST',
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
// Access Control List

export function AccessControlListsButtons(props){
    // const buttonClasses = buttonStyles();
  
    console.log('LibraryOfMedicineButtons')
  
    function generateAccessControlList(){
      console.log("Generating ACL from Consent records...")

      let accessControlList = [];
      Consents.find({'category.coding.code': 'IDSCL'}).forEach(function(consentRecord){
        accessControlList.push(FhirUtilities.consentIntoAccessControl(consentRecord));
      })

      Session.set('masterAccessControlList', accessControlList)
    }


    function downloadExportFile(){
      let jsonFile = Session.get('masterAccessControlList')
      console.log('downloadExportFile', jsonFile)

      let dataBlob = new Blob([JSON.stringify(jsonFile)], { type: 'application/json;charset=utf-8;' })
      console.log('dataBlob', dataBlob)

      let downloadAnchorElement = document.getElementById('downloadAnchorElement');
      let downloadFilenameString = "access-control-list.json";
      let downloadUrl = URL.createObjectURL(dataBlob);
      console.log('downloadUrl', downloadUrl)

      downloadAnchorElement.setAttribute("href", downloadUrl);
      downloadAnchorElement.setAttribute("download", downloadFilenameString);
      downloadAnchorElement.style.visibility = 'hidden';
      document.body.appendChild(downloadAnchorElement);
      downloadAnchorElement.click();
    }

  
    
    return (
      <MuiThemeProvider theme={muiTheme}  >
        <a id="downloadAnchorElement" style={{display: "none"}} ></a>   
        <Button onClick={ generateAccessControlList.bind(this) } style={buttonStyles.west_button}>
          Generate Access Control List 
        </Button>      
        <Button onClick={ downloadExportFile.bind(this) } style={buttonStyles.west_button}>
          Download 
        </Button>      
        {props.children}
      </MuiThemeProvider>
    );
}