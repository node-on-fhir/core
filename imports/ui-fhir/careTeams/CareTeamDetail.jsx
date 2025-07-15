import { 
  Grid, 
  Button, 
  Container,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  DatePicker,
  TextField,
  FormControl,
  InputLabel,
  Input,
  InputAdornment,
  FormControlLabel,
  Checkbox
} from '@mui/material';


import React from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import PropTypes from 'prop-types';

import { Meteor } from 'meteor/meteor';

import moment from 'moment';
import { get, set } from 'lodash';
// import { setFlagsFromString } from 'v8';

import { FhirUtilities } from '../../lib/FhirUtilities';
import { lookupReferenceName } from '../../lib/FhirDehydrator';

import {user} from 'react-icons-kit/fa/user';
import {users} from 'react-icons-kit/fa/user';
import { Icon } from 'react-icons-kit';


//====================================================================================
// THEMING


//====================================================================================
// SESSION VARIABLES

let defaultCareTeam = {
  resourceType: 'CareTeam'
}

Session.setDefault('CareTeam.Current', defaultCareTeam)


//====================================================================================
// MAIN COMPONENT

export function CareTeamDetail(props){

  let { 
    children, 
    careTeam,
    ...otherProps 
  } = props;

  let activeCareTeam = defaultCareTeam;

  activeCareTeam = useTracker(function(){
    return Session.get('CareTeam.Current');
  }, [])

  function updateField(path, event){
    console.log('updateField', event.currentTarget.value);

    // setCurrentCodeSystem(set(currentCodeSystem, path, event.currentTarget.value))
    Session.set('CareTeam.Current', set(activeCareTeam, path, event.currentTarget.value))    
  }



  return(
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={activeId ? 'Edit Care Team' : 'New Care Team'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          <Grid container spacing={3}>
          <Grid item xs={6}>
            <TextField
              id="nameInput"
              name="nameInput"
              placeholder="Lorem ipsum."              
              value={get(activeCareTeam, 'name')}
              onChange={updateField.bind(this, 'name')}
              label="Team Name"
              fullWidth    
            />  
          </Grid>
          <Grid item xs={3}>
            <TextField
              label="Version"
              id="versionInput"
              name="versionInput"
              placeholder="2020.2"              
              value={get(activeCareTeam, 'version')}
              onChange={updateField.bind(this, 'version')}
              InputLabelProps={{
                shrink: true
              }}
              fullWidth              
            />    

            {/* <FormControl style={{width: '100%', marginTop: '20px'}}>
              <InputAdornment className={classes.label}>Version</InputAdornment>
              <Input
                id="versionInput"
                name="versionInput"
                placeholder="2020.2"              
                value={get(activeCareTeam, 'version')}
                onChange={updateField.bind(this, 'version')}
                fullWidth              
              />          
            </FormControl> */}
            {/* <FormControl style={{width: '100%', marginTop: '20px'}}>
              <InputAdornment className={classes.label}>Identifier</InputAdornment>
              <Input
                id="identifierInput"
                name="identifierInput"
                placeholder="XYZ.1"              
                value={get(activeCareTeam, 'identifier[0].value')}
                onChange={updateField.bind(this, 'identifier[0].value')}
                fullWidth              
              />
            </FormControl>      */}
          </Grid>
          <Grid item xs={3}>
              <TextField
                label="Status"
                id="statusInput"
                name="statusInput"
                placeholder="active"              
                value={get(activeCareTeam, 'status')}
                onChange={updateField.bind(this, 'status')}
                fullWidth              
              />    
            {/* <FormControl style={{width: '100%', marginTop: '20px'}}>
              <InputAdornment className={classes.label}>Status</InputAdornment>
              <Input
                id="statusInput"
                name="statusInput"
                placeholder="active"              
                value={get(activeCareTeam, 'status')}
                onChange={updateField.bind(this, 'status')}
                fullWidth              
              />    
            </FormControl> */}
          </Grid>
          <Grid item xs={6}>            
              <TextField
                label="Patient"
                id="patientInput"
                name="patientInput"
                value={get(activeCareTeam, 'patient.display')}
                onChange={updateField.bind(this, 'patient.display')}
                InputLabelProps={{
                  shrink: true
                }}
                // InputProps={{
                //   endAdornment: <Icon icon={user} />
                // }}          
                fullWidth              
              />      
            {/* <FormControl style={{width: '100%', marginTop: '20px'}}>
              <InputAdornment className={classes.label}>Patient</InputAdornment>
              <Input
                id="patientInput"
                name="patientInput"
                value={get(activeCareTeam, 'patient.display')}
                onChange={updateField.bind(this, 'patient.display')}
                fullWidth              
              />       
            </FormControl>       */}
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Managing Organization"
              id="managingOrgInput"
              name="managingOrgInput"
              value={get(activeCareTeam, 'managingOrganization.display')}
              onChange={updateField.bind(this, 'managingOrganization.display')}
              InputLabelProps={{
                shrink: true
              }}
              // InputProps={{
              //   endAdornment: <Icon icon={users} />
              // }}          
              fullWidth              
            />    
            {/* <FormControl style={{width: '100%', marginTop: '20px'}}>
              <InputAdornment className={classes.label}>Managing Organization</InputAdornment>
              <Input
                id="managingOrgInput"
                name="managingOrgInput"
                value={get(activeCareTeam, 'managingOrganization.display')}
                onChange={updateField.bind(this, 'managingOrganization.display')}
                fullWidth              
              />        
              
              </FormControl>   
            */}   
          </Grid>

          <Grid item xs={12}>
            {/* <TextField
              label="Address"
              id="addressInput"
              name="addressInput"
              placeholder="http://localhost:3000/baseR4/metadata"              
              value={get(activeCareTeam, 'address')}
              onChange={updateField.bind(this, 'address')}
              fullWidth              
            />    */}
            {/* <FormControl style={{width: '100%', marginTop: '20px'}}>
              <InputAdornment className={classes.label}>Address</InputAdornment>
              <Input
                id="addressInput"
                name="addressInput"
                placeholder="http://localhost:3000/baseR4/metadata"              
                value={get(activeCareTeam, 'address')}
                onChange={updateField.bind(this, 'address')}
                fullWidth              
              />       
            </FormControl>   */}
                             
          </Grid>
        </Grid>
        </CardContent>
        <CardActions>
          {activeId ? (
            <div>
              <Button variant="contained" color="primary" onClick={onUpsert} sx={{ mr: 2 }}>Save</Button>
              <Button variant="outlined" color="error" onClick={onRemove}>Delete</Button>
            </div>
          ) : (
            <Button variant="contained" color="primary" onClick={onInsert}>Create</Button>
          )}
        </CardActions>
      </Card>
    </Container>
  );
}

CareTeamDetail.propTypes = {
  id: PropTypes.string,
  fhirVersion: PropTypes.string,
  careTeamId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  careTeam: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showPatientInputs: PropTypes.bool,
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpsert: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func
};

export default CareTeamDetail;