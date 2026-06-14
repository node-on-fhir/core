import React from 'react';

import { makeStyles, withStyles } from '@material-ui/core/styles';

import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CardHeader,
  CardContent
} from '@material-ui/core';

import Grid from '@material-ui/core/Grid';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';


import { get, has } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { HTTP } from 'meteor/http';
import JSON5 from 'json5';

import moment from 'moment';

import {github} from 'react-icons-kit/icomoon/github'
import { Icon } from 'react-icons-kit'

import { PageCanvas, StyledCard } from 'fhir-starter';
import { useTracker } from 'meteor/react-meteor-data';

function DynamicSpacer(props){
  return <br className="dynamicSpacer" style={{height: '40px'}}/>;
}

//==============================================================================================
// THEMING

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  githubIcon: {
    margin: '0px'
  },
}));

//==============================================================================================
// MAIN COMPONENT

function AboutNatDirDialog(props){

  const classes = useStyles();

  return (
    <DialogContent dividers={scroll === 'paper'} style={{minWidth: '600px', fontSize: '120%'}}>
      
      <h4>About</h4>
      The FHIR At Scale Taskforce (FAST) is pleased to present the following directory of healthcare services and practitioners.  The following 'phone book' includes data from the National Plan and Provider Enumeration System (NPPES), along with datasets from the Lantern project, and other supporting datasets.
            
      <br /><br />

      <hr />
      <div style={{width: '100%', textAlign: 'center'}}>
        <h4>Please use ⌘+ and ⌘- to zoom in and out.</h4>
      </div>
      <hr />

      <h4 style={{marginBottom: '0px'}}>Observers & System Integrators</h4>
      <div >        
        <p>If you don't have an app or server to the Connectathon, but would still like to participate; you can download the <a href="https://www.postman.com/">Postman</a> utility to test the APIs with.  Be sure to <a href="https://build.fhir.org/ig/HL7/fhir-directory-attestation/NationalDirectory.PostmanCollection.json.zip">download the collection of Postman API calls here.</a></p>
      </div>


      <hr />
      <h4 style={{marginBottom: '0px'}}>Implementors</h4>
      <div style={{width: '100%', marginBottom: '20px'}}>
          This server implements the <a href="https://build.fhir.org/ig/HL7/fhir-directory-exchange/index.html" target="_blank">National Directory Implementation Guide</a>.  It is best viewed in Chrome or Safari, and on mobile devices.  
        <a href="https://github.com/symptomatic/covid19-geomapping"></a>
      </div>

      <hr />
      <h4 style={{marginBottom: '0px'}}>Team / Acknowledgements</h4>
      <br />
      This project was sponsored by Office of the National Coordinator and Centers for Medicaid/Medicare.
    
        <p>
        </p>
        <h4 style={{marginBottom: '0px'}}>Copyright</h4>
        This work is copywrite MITRE, and the software is Apache license.  

        <h4>Contact Us</h4>
        <p>
            To request an account to the system, email: <a href="mailto://awatson@mitre.org">awatson@mitre.org</a>
        </p>

      
    </DialogContent>

      /* <Table size="small" >
        <TableHead>
          <TableCell>Contributor</TableCell>
          <TableCell>Role</TableCell>
          <TableCell>Association</TableCell>
        </TableHead>
        <TableBody>          
          <TableRow>
            <TableCell>aaaa</TableCell>
            <TableCell>bbbb</TableCell>
            <TableCell>cccc</TableCell>
          </TableRow>
        </TableBody>
      </Table> */
  );
}




export default AboutNatDirDialog;