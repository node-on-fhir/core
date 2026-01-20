import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { 
  Card,
  CardHeader,
  CardContent,
  Grid,
  TextField,
  Container,
  MenuItem,
  Button
} from '@mui/material';


import { useTracker } from 'meteor/react-meteor-data';

import moment from 'moment';


import { get, set, has, cloneDeep } from 'lodash';

//--------------------------------------------------------------------------------
// Default ServiceRequest

let defaultServiceRequest = {
  "resourceType": "ServiceRequest",
  "text": {
      "div": "<div>An ambulance dispatch notice has been made.</div>"
  },
  "status": "completed",
  "intent": "order",
  "code": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "715542009",
        "display": "Transportation by emergency ambulance"
      }
    ],
    "text": "Transportation by emergency ambulance"
  },
  "orderDetail": [
    {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "715542009",
          "display": "Transportation by emergency ambulance"
        }
      ],
      "text": "Transportation by emergency ambulance"
    },
  ],
  "subject": {
    "reference": "Patient/example"
  },
  "authoredOn": moment().format("YYYY-MM-DD"),
  "requester": {
    "reference": "Practitioner/3ad0687e-f477-468c-afd5-fcc2bf897809",
    "display": "Dr. Beverly Crusher"
  },
  "performer": [
    {
      "reference": "Practitioner/example",
      "display": "Dr Cecil Surgeon"
    }
  ],
  "reasonCode": [
    {
      "text": ""
    }
  ]
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


function ServiceRequestForm(props){

  let {
    showHeader,
    showPrefixSuffix,
    serviceRequest,
    children,
    showSpecies,
    defaultSpecies,
    onChangeServiceRequest,
    defaultLanguage,
    textMessage,
    patientId,
    onSave,
    ...otherProps
  } = props;


  let [localServiceRequest, setLocalServiceRequest] = useState(serviceRequest);




  function changeState(field, event, select){
    console.log('changeState', field, get(event, 'currentTarget.value'), select)

    let newServiceRequest = Object.assign({}, serviceRequest);

    switch (field) {
      case 'identifier':  
        if(!Array.isArray(newServiceRequest.identifier)){
          newServiceRequest.identifier = [];
        }
        if(has(newServiceRequest, 'identifier[0]')){
          let ident = get(newServiceRequest, 'identifier[0]');
          ident.value = get(event, 'currentTarget.value')
          newServiceRequest.identifier[0] = ident;
        }
        break;
      case 'status':
        newServiceRequest.status = select.key;
        break;
      case 'dateTime':
        newServiceRequest.dateTime = get(event, 'currentTarget.value');
        break;        
      case 'given':
        if(!Array.isArray(newServiceRequest.name)){
          newServiceRequest.name = [];
        }
        newServiceRequest.name[0].given = [get(event, 'currentTarget.value')];
        newServiceRequest.name[0].text = get(event, 'currentTarget.value') + " " + newServiceRequest.name[0].family;
        break;        
      case 'legalName':
        newServiceRequest.patient.display = get(event, 'currentTarget.value');
        break;        
      default:
        break;
    }

    console.log('newServiceRequest', newServiceRequest)
    if(typeof onChangeServiceRequest === "function"){
      onChangeServiceRequest(newServiceRequest)
    }
    setLocalServiceRequest(newServiceRequest)
  }
  function openDocumentationLink(){
    logger.verbose('client.app.patient.ServiceRequestForm.openDocumentationLink');

    window.open(get(Meteor, 'settings.public.defaults.serviceRequests.readMoreUrl', 'https://www.symptomatic.io'), '_system')
    logger.info('Open documentation website');
  }
  function handleSaveServiceRequest(){
    console.log('ServiceRequestForm.handleSaveServiceRequest()', localServiceRequest, patientId)

    let newServiceRequest = cloneDeep(localServiceRequest);
    console.log('ServiceRequestForm.newServiceRequest', newServiceRequest)
    if(get(newServiceRequest, 'patient.reference') === ""){
      console.log('ServiceRequestForm.newServiceRequest.patient.reference', get(newServiceRequest, 'patient.reference'))
      set(newServiceRequest, 'patient.reference', 'Patient/' + patientId)
    }
    console.log('ServiceRequestForm.newServiceRequest', newServiceRequest)

    if(typeof onSave === "function"){
      onSave(newServiceRequest)
    }
  }
  


  let email = '';
  let phonenumber = '';

  if(localServiceRequest){
    if(Array.isArray(localServiceRequest.telecom)){
      localServiceRequest.telecom.forEach(function(contactPoint){
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
    <CardContent>
      <Grid container spacing={3}>

        <Grid item xs={12} sm={8}>
          <TextField
            id='categoryInput'                
            name='category'
            label='Category'
            margin='normal'
            InputLabelProps={{ shrink: true }}
            fullWidth
            value={ get(localServiceRequest, 'category[0].coding[0].display', '')}
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
            value={ get(localServiceRequest, 'status', '')}
            onChange={ changeState.bind(this, 'status')}
            >
            {statuss.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField><br/>
        </Grid>
      </Grid>
      <Grid container>
        <Grid item xs={12}>
        <div dangerouslySetInnerHTML={{__html: textMessage}} />
        </Grid>
      </Grid>
      <Grid container>
        <Grid item xs={12}>
          <TextField
            id='policyUrlInput'                
            name='policyUrl'
            label='Policy URL'
            placeholder='http://'
            margin='normal'
            InputLabelProps={{ shrink: true }}
            fullWidth
            value={ get(localServiceRequest, 'policy[0].uri', '')}
            onChange={ changeState.bind(this, 'policyUrl')}
            /><br/>
        </Grid>
      </Grid>
      <Grid container spacing={3}>  
        <Grid item xs={12} xs={8}>
          <TextField
            id='legalNameInput'                
            name='legalName'
            label='Legal Name'
            placeholder='Jane Doe'
            margin='normal'
            InputLabelProps={{ shrink: true }}
            fullWidth
            value={ get(localServiceRequest, 'patient.display', '')}
            helperText={ get(localServiceRequest, 'patient.reference', '')}
            onChange={ changeState.bind(this, 'legalName')}
            /><br/>
        </Grid>
        <Grid item xs={12} md={4} xs={4}>
          <TextField
            id='dateInput'                
            name='date'
            type='date'
            label='Date'
            margin='normal'
            InputLabelProps={{ shrink: true }}
            fullWidth
            value={ get(localServiceRequest, 'dateTime', '')}
            onChange={ changeState.bind(this, 'dateTime')}
            /><br/>
        </Grid>
      </Grid>
      <Grid style={{marginTop: '40px'}}>
        <Button variant="contained" color="primary" type="submit" style={{marginRight: '10px'}} onClick={function(){handleSaveServiceRequest()}} >
          Accept and Save
        </Button>
        <Button variant="contained" style={{marginLeft: '10px'}}>
          Cancel
        </Button>
        <Button style={{float: 'right'}} onClick={function(){ openDocumentationLink()}}>
          Read More
        </Button>
      </Grid>
    </CardContent>
  );
}

  

ServiceRequestForm.propTypes = {
  id: PropTypes.string,
  fhirVersion: PropTypes.string,
  serviceRequestId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  serviceRequest: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  patientId: PropTypes.string,

  showHeader: PropTypes.bool,
  showPrefixSuffix: PropTypes.bool,
  showSpecies: PropTypes.bool,
  defaultSpecies: PropTypes.string,
  
  onChangeServiceRequest: PropTypes.func,
  onDelete: PropTypes.func,
  onUpsert: PropTypes.func,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
  buttons: PropTypes.object,
  textMessage: PropTypes.string
};
ServiceRequestForm.defaultProps = {
  showPrefixSuffix: false,
  showHeader: false,
  showSpecies: false,
  defaultSpecies: "Human",
  defaultLanguage: "English",
  serviceRequest: defaultServiceRequest,
  patientId: ''
}

export default ServiceRequestForm;