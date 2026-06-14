/**
 * Copyright © 2015-2016 Symptomatic, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */  

import React from 'react';
import PropTypes from 'prop-types';

import { 
  Card,
  CardHeader,  
  CardContent,
  CardMedia,
  Typography, 
  TextField,
  FormControl,
  Input, 
  InputLabel,
  Grid
} from '@mui/material';

import _ from 'lodash';
let get = _.get;
let set = _.set;
let has = _.has;

import moment from 'moment';


function PatientCard(props){

  console.debug('PatientCard v0.10.60', props)


  let { identifier, active, familyName, givenName, fullName, email, birthDate, gender, avatar, patient, zDepth, overflowY, showDetails, showSummary, showName, avatarUrlHostname, squareIcon, ...otherProps } = props;

  


  if(patient){
    fullName = get(patient, 'name[0].text', '');

    if(Array.isArray(get(patient, 'name[0].family'))){
      familyName = get(patient, 'name[0].family[0]', '');        
    } else {
      familyName = get(patient, 'name[0].family', '');        
    }

    givenName = get(patient, 'name[0].given[0]', '');

    email = get(patient, 'contact[0].value', '');
    birthDate = get(patient, 'birthDate', '');
    gender = get(patient, 'gender', '');
    if(avatarUrlHostname){
      avatar = avatarUrlHostname + get(patient, 'photo[0].url', '');
    } else if (has(patient, 'photo[0].url')){
      avatar = get(patient, 'photo[0].url', '');
    }
    identifier = get(patient, 'identifier[0].value', '');
  } 

  const styles = {
    details: {
      display: 'flex',
      flexDirection: 'column',
    },
    content: {
      flex: '1 0 auto',
    },
    cover: {
      width: 151
    },
    patientCardSpace: {
      position: 'relative'
    }
  }

  function handleChange(){ 

  }
     
  let details;
  if(props.showDetails){
      details = <div id='profileDemographicsPane' style={{position: 'relative'}}>
        <Grid container justify="space-evenly" style={ styles.synopsis} >
          <Grid item md={6} style={{paddingRight: '10px', paddingBottom: '20px'}}>
            <TextField
              id='givenNameInput'
              name='given'
              type='text'
              label='Given Name'
              value={ givenName }    
              // helperText="aka First Name"                    
              fullWidth
              /><br/>
          </Grid>
          <Grid item md={6} style={{paddingLeft: '10px', paddingBottom: '20px'}}>
            <TextField
              id='familyNameInput'
              name='family'
              type='text'
              label='Family Name'
              value={ familyName }                        
              fullWidth
              /><br/>
          </Grid>
        </Grid>
        <Grid container style={ styles.synopsis }>
          <Grid item md={4} style={{paddingRight: '10px'}}>
            <TextField
              id='birthDateInput'
              name='birthDate'
              type={ birthDate ? 'date' : 'text' }    
              label='Date of Birth' 
              value={ birthDate ? moment(birthDate).format('YYYY-MM-DD') : '' }                                                  
              InputLabelProps={{ shrink: true }}
              fullWidth
              /><br/>
          </Grid>
          <Grid item md={2} style={{paddingRight: '10px', paddingLeft: '10px'}} >
            <TextField
              id='genderInput'
              name='gender'
              type='text'
              label='Gender'
              value={ gender }                        
              fullWidth
              /><br/>
          </Grid>
          <Grid item md={6} style={{paddingLeft: '10px'}}>
            <TextField
              id='avatarInput'
              name='avatar'
              type='text'
              label='Avatar'
              value={ avatar }                        
              fullWidth
              /><br/>
          </Grid>
        </Grid>
      </div>

  }

  let styledCardStyle = {
    display: 'flex',
    flexGrow: 1
  }


  let showMedia = false;
  let mediaElements;
  let avatarHeight = 220;
  let avatarWidth = 151
  if(avatar){
    console.debug(avatar)
    if(!showName){
      avatarHeight = avatarHeight - 64;
    }
    if(!showDetails){
      avatarHeight = avatarHeight - 156;
    }
    if(squareIcon){
      avatarWidth = avatarHeight;
    }
    mediaElements = <CardMedia      
      image={avatar}      
      style={{height: avatarHeight + 'px', width: avatarWidth + 'px'}}
    />
  }

  let summaryElements;
  if(showSummary){
    summaryElements = <Typography color="textSecondary">
      MRN: { identifier } DOB:  { moment(birthDate).format("MMM DD, YYYY") } Gender: { gender } 
    </Typography>
  }

  let nameElements;
  if(showName){
    nameElements = <CardHeader title={fullName} />
  }

  return(

  <div className='patientCard'>
    <Card style={styledCardStyle} >
      { mediaElements }
      <div style={styles.details}>
        { nameElements }
        <CardContent>
          { showSummary }
          { details }
        </CardContent>
      </div>
    </Card>
  </div>
  );
}


PatientCard.propTypes = {
  patient: PropTypes.object,
  multiline: PropTypes.bool,
  fullName: PropTypes.string,
  familyName: PropTypes.string,
  givenName: PropTypes.string,
  email: PropTypes.string,
  birthDate: PropTypes.string,
  gender: PropTypes.string,
  avatar: PropTypes.string,
  hideDetails: PropTypes.bool,  // deprecated
  showDetails: PropTypes.bool,
  showSummary: PropTypes.bool,
  showName: PropTypes.bool,
  squareIcon: PropTypes.bool,
  overflowY: PropTypes.string,
  style: PropTypes.object,
  defaultAvatar: PropTypes.string,
  avatarUrlHostname: PropTypes.string
};
PatientCard.defaultProps = {
  showDetails: true,
  showSummary: false,
  showName: true,
  squareIcon: false,
  avatarUrlHostname: ''
}

export default PatientCard;
