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
  }
}));

//==============================================================================================
// MAIN COMPONENT


function PrivacyPage(props){

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
          <StyledCard height="auto" style={{overflowY: 'scroll'}}>
            <CardHeader 
              title="Privacy Page" 
              style={{fontSize: '100%'}} />
            <CardContent style={{fontWeight: 300, fontSize: '120%'}}>
           

              <h4>U.S. Development</h4>
              <p>National Care Directory is developed by the FHIR At Scale Taskforce and MITRE.</p>

              <h4>Funding Model</h4>
              <p>This project is sponsored and funded by the Office of the National Coordinator and the Centers for Medicare and Medicaid.</p>

              <h4>Google Analytics</h4>
              <p>The National Care Directory uses Google Analytics to track application usage and improve user experience.  We do not use Google Ads or sell user data to advertisers.</p>

              <h4>HIPAA Waiver</h4>
              <p>The National Care Directory does not contain Protected Health Information (PHI).</p>

            </CardContent>
          </StyledCard>          
      </Container>                 
    </PageCanvas>
  );
}

export default PrivacyPage;