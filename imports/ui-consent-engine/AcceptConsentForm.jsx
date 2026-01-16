import React from 'react';
import PropTypes from 'prop-types';

import { 
  Card,
  CardHeader,
  CardContent,
  Grid,
  TextField,
  Container,
  MenuItem,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Input,
  InputAdornment,
  IconButton,
  FormGroup
} from '@mui/material';

import { FhirUtilities } from '../lib/FhirUtilities';

import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import ClassIcon from '@mui/icons-material/Class';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import LocalPlayIcon from '@mui/icons-material/LocalPlay';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { useTracker } from 'meteor/react-meteor-data';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';

import moment from 'moment';

import { capitalize } from 'lodash';


import { get, set, has, cloneDeep } from 'lodash';

//--------------------------------------------------------------------------------
// Default Consent

let defaultConsent = {
  "resourceType" : "Consent",
  "status" : "active",
  "scope" : {
    "coding" : [
      {
        "system" : "http://terminology.hl7.org/CodeSystem/consentscope",
        "code" : "patient-privacy",
        "display" : "Privacy Consent"
      }
    ]
  },
  "category" : [
    {
      "coding" : [
        {
          "system" : "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          "code" : "IDSCL",
          "display" : "information disclosure"
        }
      ]
    }
  ],
  "patient" : {
    "display": "",
    "reference" : ""
  },
  "dateTime" : moment().format('YYYY-MM-DD'),
  "policy": [{
    "uri": "https://docs.google.com/document/d/10Y-rEtVQiTWTy7tU-Slw5urAv5RVN38DwSGMVz84Phg/edit?usp=sharing"
  }]
  // "sourceReference" : {
  //   "reference" : "QuestionnaireResponse/589454a1-1bfd-4da4-80df-05ac759ebd04"
  // }
}

//--------------------------------------------------------------------------------
// Main Component

let statuss = [{
  value: 'draft',
  label: "Draft"
}, {
  value: 'proposed',
  label: "Proposed"
}, {
  value: 'active',
  label: "Active"
}, {
  value: 'rejected',
  label: "Rejected"
}, {
  value: 'inactive',
  label: "Inactive"
}, {
  value: 'entered-in-error',
  label: "Entered-In-Error"
}];

let martialStatuses = [{
  value: 'UNK',
  label: "Unknown"
}, {
  value: 'A',
  label: "Annulled"
}, {
  value: 'D',
  label: "Divorced"
}, {
  value: 'I',
  label: "Interlocutory"
}, {
  value: 'L',
  label: "Legally Separated"
}, {
  value: 'M',
  label: "Married"
}, {
  value: 'P',
  label: "Polygamous"
}, {
  value: 'S',
  label: "Never Married"
}, {
  value: 'T',
  label: "Domestic Partner"
}, {
  value: 'U',
  label: "Unmarried"
}, {
  value: 'W',
  label: "Widowed"
}]

//--------------------------------------------------------------------------------
// Main Component


function AcceptConsentForm(props){

  let {
    showHeader,
    showPrefixSuffix,
    consent,
    children,
    showSpecies,
    defaultSpecies,
    onChangeConsent,
    defaultLanguage,
    textMessage,
    patientId,
    onSave,
    ...otherProps
  } = props;

  let currentUser = useTracker(function(){  
    let currentUser = Session.get('currentUser');
    let userName = '';
    // Meteor Accounts
    if(has(currentUser, 'fullLegalName')){
      userName = get(currentUser, 'fullLegalName', '');

    // Patient, R4
    } else if(has(currentUser, 'givenName') || has(currentUser, 'familyName')){
      userName = get(currentUser, 'givenName', '') + ' ' + get(currentUser, 'familyName', '');

    // Patient, R4
    } else if(has(currentUser, 'name[0].text')) {
      userName = get(currentUser, 'name[0].text', '');
    // Patient, R4
    } else if(has(currentUser, 'name[0].given[0]') || has(currentUser, 'name[0].family')) {
      userName = get(currentUser, 'name[0].given[0]', '') + ' ' + get(currentUser, 'name[0].family', '');
    // Patient, DSTU2
    } else if(has(currentUser, 'name[0].given[0]') || has(currentUser, 'name[0].family[0]')) {
      userName = get(currentUser, 'name[0].given[0]', '') + ' ' + get(currentUser, 'name[0].family[0]', '');

      // Practitioner, R4
    } else if(has(currentUser, 'name.text')) {
      userName = get(currentUser, 'name.text', '');
    // Practitioner, R4
    } else if(has(currentUser, 'name.given[0]') || has(currentUser, 'name.family')) {
      userName = get(currentUser, 'name[0].given[0]', '') + ' ' + get(currentUser, 'name[0].family', '');
    // Practitioner, DSTU2
    } else if(has(currentUser, 'name.given[0]') || has(currentUser, 'name.family[0]')) {
      userName = get(currentUser, 'name[0].given[0]', '') + ' ' + get(currentUser, 'name[0].family[0]', '');

    } else {
      userName = 'Anonymous'
    }
    return userName; 
  }, []);  

  let currentPatientId = patientId;
  let activeConsent = defaultConsent;
  
  let selectedPatient = '';
  let selectedPractitioner = '';
  let selectedOrganization = '';

  currentPatientId = useTracker(function(){
    let currentUser = Session.get('currentUser');
    return get(currentUser, 'patientId');
  }, [])

  activeConsent = useTracker(function(){
    let activeConsent = Session.get('activeConsent');
    if(activeConsent){
      if(!get(activeConsent, 'patient')){
        activeConsent.patient = {};
        if(currentUser){
          activeConsent.patient.display = currentUser;
        }
        if(currentPatientId){
          activeConsent.patient.reference = currentPatientId;
        }
      }      
    }

    return activeConsent;
  }, [])


  let searchEndpointType = useTracker(function(){
    return Session.get('MainSearch.resourceType');
  }, [])
  let searchPractitionerRole = useTracker(function(){
    return Session.get('MainSearch.practitionerRole');
  }, [])
  let searchConfidentialityLevel = useTracker(function(){
    return Session.get('MainSearch.confidentialityLevel');
  }, [])

  

  function setLocalConsent(newConsent){
    Session.set('activeConsent', newConsent);
  }
  function changeState(field, event, select){
    console.log('changeState', field, get(event, 'currentTarget.value'), select)

    let newConsent = Object.assign({}, consent);

    switch (field) {
      case 'identifier':  
        if(!Array.isArray(newConsent.identifier)){
          newConsent.identifier = [];
        }
        if(has(newConsent, 'identifier[0]')){
          let ident = get(newConsent, 'identifier[0]');
          ident.value = get(event, 'currentTarget.value')
          newConsent.identifier[0] = ident;
        }
        break;
      case 'status':
        newConsent.status = select.key;
        break;
      case 'dateTime':
        newConsent.dateTime = get(event, 'currentTarget.value');
        break;        
      case 'given':
        if(!Array.isArray(newConsent.name)){
          newConsent.name = [];
        }
        newConsent.name[0].given = [get(event, 'currentTarget.value')];
        newConsent.name[0].text = get(event, 'currentTarget.value') + " " + newConsent.name[0].family;
        break;        
      case 'legalName':
        newConsent.patient.display = get(event, 'currentTarget.value');
        break;        
      default:
        break;
    }

    console.log('newConsent', newConsent)
    if(typeof onChangeConsent === "function"){
      onChangeConsent(newConsent)
    }
    setLocalConsent(newConsent)
  }
  function openDocumentationLink(){
    logger.verbose('client.app.patient.AcceptConsentForm.openDocumentationLink');

    window.open(get(Meteor, 'settings.public.defaults.consents.readMoreUrl', 'https://www.symptomatic.io'), '_system')
    logger.info('Open documentation website');
  }
  function handleSaveConsent(){
    console.log('AcceptConsentForm.handleSaveConsent()', activeConsent, patientId)

    let newConsent = cloneDeep(activeConsent);
    console.log('AcceptConsentForm.newConsent', newConsent);

    if(newConsent){
      if(!get(newConsent, 'id')){
        newConsent.id = Random.id();
      }  

      if(!get(newConsent, 'patient')){
        newConsent.patient = {};
        if(currentPatientId){
          set(newConsent, 'patient.reference', 'Patient/' + currentPatientId)
        }
        if(currentUser){
          set(newConsent, 'patient.display', currentUser)
        }  
      }

      // if has selected resource type
      if(!get(newConsent, 'provision')){
        newConsent.provision = [];
        newConsent.provision.push({
          type: 'deny'
        })
        newConsent.provision[0].provision = [];      
        newConsent.provision[0].provision.push({
          type: 'permit',
          actor: [{
            reference: {
              display: '',  // should be PractitionerRole
              reference: ''  // should be PractitionerRole
            },
            role: {
              text: "",
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/v3-RoleClass',
                code: get(searchPractitionerRole, 'code'),
                display: get(searchPractitionerRole, 'display'),
                userSelected: true
              }]
            }
          }],
          securityLevel: [{
            text: "",
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality',
              code: get(searchConfidentialityLevel, 'code'),
              display: get(searchConfidentialityLevel, 'display'),
              userSelected: true
            
            }]
          }],
          class: [{
            system: '',
            code: get(searchEndpointType, 'code'),
            display: get(searchEndpointType, 'display')
          }]
        })

      }

      console.log('AcceptConsentForm.newConsent', newConsent);

      // HTTP.post('')

      let relayUrl = get(Meteor, 'settings.public.interfaces.fhirRelay.channel.endpoint', 'http://localhost:3000/baseR4')

      let consentUrl = relayUrl + '/Consent';
      console.log('POST ' + consentUrl)
      HTTP.post(consentUrl, {data: newConsent}, function(error, result){
          if(error){
              alert(JSON.stringify(error.message));
          }
          if(result){
              // Session.set('mainAppDialogOpen', false)
          }
      })
      

      // Meteor.call('saveConsent', newConsent, function(error, result){
      //   if(error){console.error('error', error)}
      //   if(result){console.log('result', result)}
      // })
    }
  }
  function createAccessConsent(consent){
    if(!get(consent, 'patient')){
      consent.patient = {};
      if(currentPatientId){
        set(consent, 'patient.reference', 'Patient/' + currentPatientId)
      }
      if(currentUser){
        set(consent, 'patient.display', currentUser)
      }  
    }

    // if has selected resource type
    if(!get(consent, 'provision')){
      consent.provision = [];
      consent.provision.push({
        type: 'deny'
      })
      consent.provision[0].provision = [];      
      consent.provision[0].provision.push({
        type: 'permit',
        actor: [{
          reference: {
            display: '',  // should be PractitionerRole
            reference: ''  // should be PractitionerRole
          },
          role: {
            text: "",
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v3-RoleClass',
              code: get(searchPractitionerRole, 'code'),
              display: get(searchPractitionerRole, 'display'),
              userSelected: false
            }]
          }
        }],
        class: [{
          system: '',
          code: get(searchEndpointType, 'code'),
          display: get(searchEndpointType, 'display')
        }]
      })

    }
    return consent;
  }
  function handleCreateAccessConsent(){
    console.log('AcceptConsentForm.handleCreateAccessConsent()', activeConsent, patientId)

    let newConsent = createAccessConsent(cloneDeep(activeConsent));

    console.log('AcceptConsentForm.newConsent', newConsent);
    if(typeof onSave === "function"){
      onSave(newConsent)
    }
  }
  function handleSelectResourceType(){
    Session.set('selectedCodeSystem', 'resource-types');
    Session.set('mainAppDialogTitle', "Search Resource Types");
    Session.set('mainAppDialogComponent', "SearchCodeSystemDialog");
    Session.set('lastUpdated', new Date());
    Session.set('mainAppDialogMaxWidth', "md");
    Session.set('mainAppDialogOpen', true);
    Session.set('dialogReturnValue', 'MainSearch.resourceType');
  }  
  function handleSelectPractitionerRole(){
    Session.set('selectedCodeSystem', 'v3-RoleClass-flattened');
    Session.set('mainAppDialogTitle', "Search Practitioner Roles");
    Session.set('mainAppDialogComponent', "SearchCodeSystemDialog");
    Session.set('lastUpdated', new Date());
    Session.set('mainAppDialogMaxWidth', "md");
    Session.set('mainAppDialogOpen', true);
    Session.set('dialogReturnValue', 'MainSearch.practitionerRole');
  }  
  function handleSelectConfidentiality(){
    Session.set('selectedCodeSystem', 'v3-Confidentiality');
    Session.set('mainAppDialogTitle', "Select Confidentiality Level");
    Session.set('mainAppDialogComponent', "SearchCodeSystemDialog");
    Session.set('lastUpdated', new Date());
    Session.set('mainAppDialogMaxWidth', "md");
    Session.set('mainAppDialogOpen', true);
    Session.set('dialogReturnValue', 'MainSearch.confidentialityLevel');
  }  
  function handleClearSearch(){
    Session.set('MainSearch.resourceType', {display: '', code: ''});
  }
  


  let email = '';
  let phonenumber = '';

  if(activeConsent){
    if(Array.isArray(activeConsent.telecom)){
      activeConsent.telecom.forEach(function(contactPoint){
        if(get(contactPoint, 'system') === "email"){
          email = get(contactPoint, 'value');
        }
        if(get(contactPoint, 'system') === "phone"){
          phonenumber = get(contactPoint, 'value');
        }
      })
    }  
  }

  return(
    <div>
      <CardHeader title="Consent to Access" subheader={get(activeConsent, 'policy[0].uri', '')} />
      <CardContent>
        <FormGroup style={{padding: '10px', backgroundColor: '#eeeeee', border: 'groove #ddd', borderRadius: '4px' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <TextField
                id='categoryInput'                
                name='category'
                label='Category'
                margin='normal'
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={ get(activeConsent, 'category[0].coding[0].display', '')}
                onChange={ changeState.bind(this, 'category')}
                /><br/>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                id='statusInput'                
                name='status'
                label='Status'
                placeholder='draft | proposed | active | rejected | inactive | entered-in-error'
                margin='normal'
                InputLabelProps={{ shrink: true }}
                fullWidth
                select
                value={ get(activeConsent, 'status', '')}
                onChange={ changeState.bind(this, 'status')}
                >
                {statuss.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField><br/>
            </Grid>
            <Grid item xs={12} sm={4}>        
              <TextField
                id='dateInput'                
                name='date'
                type='date'
                label='Date'
                margin='normal'
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={ get(activeConsent, 'dateTime', '')}
                onChange={ changeState.bind(this, 'dateTime')}
                /><br/>
            </Grid>
          </Grid>
          <Grid container spacing={3}>
            <Grid item xs={4}>
              <TextField
                id='patientNameInput'                
                name='patientName'
                label='Patient Name'
                // placeholder='Jane Doe'
                margin='normal'
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={ currentUser }
                helperText={ get(activeConsent, 'patient.reference', '')}
                onChange={ changeState.bind(this, 'patientName')}
                /><br/>
            </Grid>
            <Grid item xs={4}>
              <TextField
                id='practitionerNameInput'                
                name='practitionerName'
                label='Practitioner Name'
                // placeholder='Jane Doe'
                margin='normal'
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={ selectedPractitioner }
                helperText={ get(activeConsent, 'practitioner.reference', '')}
                onChange={ changeState.bind(this, 'practitionerName')}
                /><br/>
            </Grid>
            <Grid item xs={4}>
              <TextField
                id='organizationNameInput'                
                name='organizationName'
                label='Organization Name'
                // placeholder='Jane Doe'
                margin='normal'
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={ selectedOrganization }
                helperText={ get(activeConsent, 'organization.reference', '')}
                onChange={ changeState.bind(this, 'organizationName')}
                /><br/>
            </Grid>
          </Grid>
        </FormGroup>

        <Grid container>
          <Grid item xs={12} style={{marginTop: '10px', marginBottom: '10px'}}>
            <p>The above named person authorizes and requests the disclosure of the following protected information for the purpose of review and evaluation in connection with a legal claim or medical care.  The following data resources:</p>
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <FormControl style={{width: '100%', marginTop: '0px'}}>
              <InputLabel className={classes.label} shrink={true}>Resource Type</InputLabel>
              <Input
                id="resourceType"
                name="resourceType"
                className={classes.input}   
                value={get(searchEndpointType, 'display')}    
                type="text"
                placeholder="Condition, Procedure, Medication"
                onKeyDown= {(e) => {
                  if (e.key === 'Backspace') {
                    Session.set('MainSearch.resourceType', null);
                  }
                }}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle type select"
                      onClick={ handleSelectResourceType.bind(this) }
                    >
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                }           
              />
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl style={{width: '100%', marginTop: '0px'}}>
              <InputLabel className={classes.label} shrink={true}>Confidentiality</InputLabel>
              <Input
                id="confidentialityLevel"
                name="confidentialityLevel"
                className={classes.input}   
                value={get(searchConfidentialityLevel, 'display')}    
                type="text"
                placeholder="unrestricted | restricted"
                onKeyDown= {(e) => {
                  if (e.key === 'Backspace') {
                    Session.set('MainSearch.confidentialityLevel', null);
                  }
                }}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle type select"
                      onClick={ handleSelectConfidentiality.bind(this) }
                    >
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                }           
              />
            </FormControl>
          </Grid>
        </Grid>


        <Grid container>
          <Grid item xs={12}>
            <p>Be granted to any individual with the following specialty or role:</p>
          </Grid>
        </Grid>
        <Grid container>
          <Grid item xs={12}>
            <FormControl style={{width: '100%', marginTop: '0px'}}>
              <InputLabel className={classes.label} shrink={true}>Role</InputLabel>
              <Input
                id="practitionerRole"
                name="practitionerRole"
                className={classes.input}   
                value={get(searchPractitionerRole, 'display')}    
                type="text"
                placeholder="Healthcare Provider"
                onKeyDown= {(e) => {
                  if (e.key === 'Backspace') {
                    Session.set('MainSearch.practitionerRole', null);
                  }
                }}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle type select"
                      onClick={ handleSelectPractitionerRole.bind(this) }
                    >
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                }           
              />
            </FormControl>
          </Grid>
        </Grid>


        
        
        <Grid style={{marginTop: '40px'}}>
          <Button variant="contained" color="primary" type="submit" style={{marginRight: '10px'}} onClick={function(){handleSaveConsent()}} >
            Save Consent
          </Button>
          <Button variant="contained" color="primary" type="submit" style={{marginRight: '10px'}} onClick={function(){handleCreateAccessConsent()}} >
            Generate Access Control Record
          </Button>
          <Button variant="contained" style={{marginLeft: '10px'}} onClick={ handleClearSearch.bind(this) } >
            Cancel
          </Button>
        </Grid>
      </CardContent>

    </div>
  );
}

  

AcceptConsentForm.propTypes = {
  id: PropTypes.string,
  fhirVersion: PropTypes.string,
  consentId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  consent: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  patientId: PropTypes.string,

  showHeader: PropTypes.bool,
  showPrefixSuffix: PropTypes.bool,
  showSpecies: PropTypes.bool,
  defaultSpecies: PropTypes.string,
  
  onChangeConsent: PropTypes.func,
  onDelete: PropTypes.func,
  onUpsert: PropTypes.func,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
  buttons: PropTypes.object,
  textMessage: PropTypes.string
};
AcceptConsentForm.defaultProps = {
  showPrefixSuffix: false,
  showHeader: false,
  showSpecies: false,
  defaultSpecies: "Human",
  defaultLanguage: "English",
  consent: defaultConsent,
  patientId: ''
}

export default AcceptConsentForm;