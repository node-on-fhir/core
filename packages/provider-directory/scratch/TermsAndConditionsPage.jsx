import React from 'react';

import { makeStyles, withStyles } from '@material-ui/core/styles';

import Grid from '@material-ui/core/Grid';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import CardActions from '@material-ui/core/CardActions';
import Checkbox from '@material-ui/core/Checkbox';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';

import { get, has } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { HTTP } from 'meteor/http';
import JSON5 from 'json5';

import moment from 'moment';

import { PageCanvas, StyledCard } from 'fhir-starter';
import { useTracker } from 'meteor/react-meteor-data';


import { Icon } from 'react-icons-kit';
import { github } from 'react-icons-kit/fa/github';

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
  textField: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1)
  },
  button: {
    margin: theme.spacing(1)
  },
  hero_button: {
    width: '100%', 
    marginTop: '20px', 
    marginBottom: '20px',
    textAlign: 'left'
  }
}));

//==============================================================================================
// MAIN COMPONENT


function TermsAndConditionsPage(props){

  const classes = useStyles();
  
  let containerStyle = {
    paddingLeft: '100px',
    paddingRight: '100px',
    marginBottom: '100px'
  };

  let headerHeight = 84;
  if(get(Meteor, 'settings.public.defaults.prominantHeader')){
    headerHeight = 148;
  }  

  return (
    <PageCanvas id='infoPage' headerHeight={headerHeight} >
      <Container maxWidth="lg" style={{paddingBottom: '80px'}}>
        <StyledCard>
          <CardHeader 
            title="Terms and Conditions" 
            subheader="Copyright 2022, MITRE"
            style={{fontSize: '100%'}} />
          <CardContent style={{fontSize: '120%'}}>
            <h4>End-User License Agreement (EULA) of National Care Directory</h4>
                      
            <p>This End-User License Agreement ("EULA") is a legal agreement between you and MITRE. </p>

            <p>This EULA agreement governs your acquisition and use of the National Care Directory software ("Software") directly from MITRE.</p>

            <p>Please read this EULA agreement carefully before completing the installation process and using the National Care Directory software. It provides a license,  warranty information and liability disclaimers.</p>

            <h4>License Grant</h4>
            <p>MITRE, LLC hereby grants you a personal, non-transferable, non-exclusive licence to use the National Care Directory software on your devices in accordance with the terms of this EULA agreement.</p>

            <p>You are permitted to install the National Care Directory software onto a device under your control (for example a PC, laptop, mobile or tablet). You are responsible for ensuring your device meets the minimum requirements of the Care Directory software.</p>

            <p>You are not permitted to:</p>

            <ul>
              <li>Edit, alter, modify, adapt, translate or otherwise change the whole or any part of the compiled Software.  Shipped binaries have been certified, and changes to them will invalidate the certification.</li>
              <li>Use the Software in any way which breaches any applicable local, national or international law</li>
              <li>use the Software for any purpose that MITRE considers is a breach of this EULA agreement</li>
            </ul>

            <h4>Intellectual Property and Ownership</h4>
            <p>MITRE shall at all times retain copyright of this software.  Source code is available under the Apache 2.0 license.</p>

            <h4>Termination</h4>
            <p>This EULA agreement is effective from the date you first use the Software and shall continue until terminated. You may terminate it at any time upon written notice to MITRE.</p>

            <p>It will also terminate immediately if you fail to comply with any term of this EULA agreement. Upon such termination, the licenses granted by this EULA agreement will immediately terminate and you agree to stop all access and use of the Software. The provisions that by their nature continue and survive will survive any termination of this EULA agreement.</p>

            <h4>Governing Law</h4>
            <p>This EULA agreement, and any dispute arising out of or in connection with this EULA agreement, shall be governed by and construed in accordance with the laws of the United States of America.</p>


          </CardContent>
        </StyledCard>     

        {/* <Button variant="contained" color="primary" className={classes.hero_button} href="https://github.com/symptomatic/node-on-fhir" >
          <Icon icon={github} size={48} /><CardHeader title="Download the Code" />
        </Button> */}

      </Container>
    </PageCanvas>
  );
}

export default TermsAndConditionsPage;