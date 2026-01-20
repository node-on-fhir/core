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
  Button
} from '@mui/material';

// import { makeStyles } from '@material-ui/styles';
import { useTracker } from 'meteor/react-meteor-data';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import moment from 'moment';

// const useStyles = makeStyles(theme => ({
//   root: {
//     flexGrow: 1
//   }
// }));

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
          "code" : "ICOL",
          "display" : "information collection"
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


function ConsentForm(props){

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

  // let classes = useStyles();
  // let [activeConsent, setLocalConsent] = useState(consent);


  let activeConsent = defaultConsent;

  activeConsent = useTracker(function(){
    return Session.get('activeConsent');
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
    logger.verbose('client.app.patient.ConsentForm.openDocumentationLink');

    window.open(get(Meteor, 'settings.public.defaults.consents.readMoreUrl', 'https://www.symptomatic.io'), '_system')
    logger.info('Open documentation website');
  }
  function handleSaveConsent(){
    console.log('ConsentForm.handleSaveConsent()', activeConsent, patientId)

    let newConsent = cloneDeep(activeConsent);
    console.log('ConsentForm.newConsent', newConsent)
    if(get(newConsent, 'patient.reference') === ""){
      console.log('ConsentForm.newConsent.patient.reference', get(newConsent, 'patient.reference'))
      set(newConsent, 'patient.reference', 'Patient/' + patientId)
    }
    console.log('ConsentForm.newConsent', newConsent)

    if(typeof onSave === "function"){
      onSave(newConsent)
    }
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
            value={ get(activeConsent, 'policy[0].uri', '')}
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
            value={ get(activeConsent, 'patient.display', '')}
            helperText={ get(activeConsent, 'patient.reference', '')}
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
            value={ get(activeConsent, 'dateTime', '')}
            onChange={ changeState.bind(this, 'dateTime')}
            /><br/>
        </Grid>
      </Grid>
      <Grid style={{marginTop: '40px'}}>
        <Button variant="contained" color="primary" type="submit" style={{marginRight: '10px'}} onClick={function(){handleSaveConsent()}} >
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

  

ConsentForm.propTypes = {
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
ConsentForm.defaultProps = {
  showPrefixSuffix: false,
  showHeader: false,
  showSpecies: false,
  defaultSpecies: "Human",
  defaultLanguage: "English",
  consent: defaultConsent,
  patientId: ''
}

export default ConsentForm;