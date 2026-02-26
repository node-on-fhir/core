// =======================================================================
// Using DSTU2  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//
// https://www.hl7.org/fhir/DSTU2/evidences.html
//
//
// =======================================================================

import React from 'react';
import PropTypes from 'prop-types';

import { useTracker } from 'meteor/react-meteor-data';

import { 
  Button,
  Card,
  Checkbox,
  CardActions,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Select,
  MenuItem,
} from '@mui/material';

import { get, set } from 'lodash';


export class EvidenceDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      evidenceId: false,
      evidence: {
        resourceType: "Evidence",
        patient: {
          reference: "",
          display: ""
        },
        asserter: {
          reference: "",
          display: ""
        },
        dateRecorded: null,
        code: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "",
              display: ""
            }
          ]
        },
        clinicalStatus: "active",
        verificationStatus: "confirmed",
        evidence: [],
        onsetDateTime: null
      }, 
      form: {
        patientDisplay: '',
        asserterDisplay: '',
        snomedCode: '',
        snomedDisplay: '',
        clinicalStatus: '',
        verificationStatus: '',
        evidenceDisplay: '',
        onsetDateTime: ''
      }
    }
  }
  dehydrateFhirResource(evidence) {
    let formData = Object.assign({}, this.state.form);

    formData.patientDisplay = get(evidence, 'patient.display')
    formData.asserterDisplay = get(evidence, 'asserter.display')    
    formData.snomedCode = get(evidence, 'code.coding[0].code')
    formData.snomedDisplay = get(evidence, 'code.coding[0].display')
    formData.clinicalStatus = get(evidence, 'clinicalStatus')
    formData.verificationStatus = get(evidence, 'verificationStatus')
    formData.onsetDateTime = get(evidence, 'onsetDateTime')

    return formData;
  }
  shouldComponentUpdate(nextProps){
    get(Meteor, 'settings.public.logging') === "debug" && console.log('EvidenceDetail.shouldComponentUpdate()', nextProps, this.state)
    let shouldUpdate = true;

    // received an evidence from the table; okay lets update again
    if(nextProps.evidenceId !== this.state.evidenceId){
      
      if(nextProps.evidence){
        this.setState({evidence: nextProps.evidence})     
        this.setState({form: this.dehydrateFhirResource(nextProps.evidence)})       
      }

      this.setState({evidenceId: nextProps.evidenceId})
      shouldUpdate = true;
    }

    // both false; don't take any more updates
    if(nextProps.evidence === this.state.evidence){
      shouldUpdate = false;
    }
 
    return shouldUpdate;
  }

  getMeteorData() {
    let data = {
      evidenceId: this.props.evidenceId,
      evidence: false,
      showDatePicker: false,
      form: this.state.form
    };

    if(this.props.showDatePicker){
      data.showDatePicker = this.props.showDatePicker
    }
    if(this.props.evidence){
      data.evidence = this.props.evidence;
      data.form = this.dehydrateFhirResource(this.props.evidence);
    }

    return data;
  }
  renderDatePicker(showDatePicker, form){
    let datePickerValue;

    if(get(form, 'onsetDateTime')){
      datePickerValue = get(form, 'onsetDateTime');
    }
    if(get(form, 'onsetPeriod.start')){
      datePickerValue = get(form, 'onsetPeriod.start');
    }
    if (typeof datePickerValue === "string"){
      datePickerValue = new Date(datePickerValue);
    }
    if (showDatePicker) {
      return (<div></div>)
      // return (
      //   <DatePicker 
      //     name='onsetDateTime'
      //     hintText="Onset Date" 
      //     container="inline" 
      //     mode="landscape"
      //     value={ datePickerValue ? datePickerValue : null }    
      //     onChange={ this.changeState.bind(this, 'onsetDateTime')}      
      //     />
      // );      
    }
  }
  setHint(text){
    if(this.props.showHints !== false){
      return text;
    } else {
      return '';
    }
  }
  render() {
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('EvidenceDetail.render()', this.state)

    return (
      <div id={this.props.id} className="evidenceDetail">
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={6}>
              <TextField
                id='patientDisplayInput'
                name='patientDisplay'
                label='Patient'
                value={ get(this, 'data.form.patientDisplay', '') }
                onChange={ this.changeState.bind(this, 'patientDisplay')}
                hintText={ this.setHint('Jane Doe') }
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='asserterDisplayInput'
                name='asserterDisplay'
                label='Asserter'
                value={ get(this, 'data.form.asserterDisplay', '') }
                onChange={ this.changeState.bind(this, 'asserterDisplay')}
                hintText={ this.setHint('Nurse Jackie') }
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='snomedCodeInput'
                name='snomedCode'
                label='SNOMED Code'
                value={ get(this, 'data.form.snomedCode', '') }
                hintText={ this.setHint('307343001') }
                onChange={ this.changeState.bind(this, 'snomedCode')}
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='snomedDisplayInput'
                name='snomedDisplay'
                label='SNOMED Display'
                value={ get(this, 'data.form.snomedDisplay', '') }
                onChange={ this.changeState.bind(this, 'snomedDisplay')}
                hintText={ this.setHint('Acquired hemoglobin H disease (disorder)') }
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='clinicalStatusInput'
                name='clinicalStatus'
                label='Clinical Status'
                value={ get(this, 'data.form.clinicalStatus', '') }
                hintText={ this.setHint('active | recurrence | inactive | remission | resolved') }
                onChange={ this.changeState.bind(this, 'clinicalStatus')}
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='verificationStatusInput'
                name='verificationStatus'
                label='Verification Status'
                value={ get(this, 'data.form.verificationStatus', '') }
                hintText={ this.setHint('provisional | differential | confirmed | refuted | entered-in-error | unknown') }
                onChange={ this.changeState.bind(this, 'verificationStatus')}
                //floatingLabelFixed={true}
                fullWidth
                /><br/>
            </Grid>
            <Grid item xs={6}>
            </Grid>
          </Grid>

          <br/>
          { this.renderDatePicker(this.data.showDatePicker, get(this, 'data.form') ) }
          <br/>

          <a href='http://browser.ihtsdotools.org/?perspective=full&conceptId1=404684003&edition=us-edition&release=v20180301&server=https://prod-browser-exten.ihtsdotools.org/api/snomed&langRefset=900000000000509007'>Lookup codes with the SNOMED CT Browser</a>

        </CardContent>
        <CardActions>
          { this.determineButtons(this.state.evidenceId) }
        </CardActions>
      </div>
    );
  }

  determineButtons(evidenceId){
    if (evidenceId) {
      return (
        <div>
          <Button id="updateEvidenceButton" primary={true} onClick={this.handleSaveButton.bind(this)} style={{marginRight: '20px'}} >Save</Button>
          <Button id="deleteEvidenceButton" onClick={this.handleDeleteButton.bind(this)} >Delete</Button>
        </div>
      );
    } else {
      return(
        <Button id="saveEvidenceButton" primary={true} onClick={this.handleSaveButton.bind(this)} >Save</Button>
      );
    }
  }


  updateFormData(formData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("EvidenceDetail.updateFormData", formData, field, textValue);

    switch (field) {
      case "patientDisplay":
        set(formData, 'patientDisplay', textValue)
        break;
      case "asserterDisplay":
        set(formData, 'asserterDisplay', textValue)
        break;        
      case "verificationStatus":
        set(formData, 'verificationStatus', textValue)
        break;
      case "clinicalStatus":
        set(formData, 'clinicalStatus', textValue)
        break;
      case "snomedCode":
        set(formData, 'snomedCode', textValue)
        break;
      case "snomedDisplay":
        set(formData, 'snomedDisplay', textValue)
        break;
      case "evidenceDisplay":
        set(formData, 'evidenceDisplay', textValue)
        break;
      case "onsetDateTime":
        set(formData, 'onsetDateTime', textValue)
        break;
      default:
    }

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);
    return formData;
  }
  updateEvidence(evidenceData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("EvidenceDetail.updateEvidence", evidenceData, field, textValue);

    switch (field) {
      case "patientDisplay":
        set(evidenceData, 'patient.display', textValue)
        break;
      case "asserterDisplay":
        set(evidenceData, 'asserter.display', textValue)
        break;
      case "verificationStatus":
        set(evidenceData, 'verificationStatus', textValue)
        break;
      case "clinicalStatus":
        set(evidenceData, 'clinicalStatus', textValue)
        break;
      case "snomedCode":
        set(evidenceData, 'code.coding[0].code', textValue)
        break;
      case "snomedDisplay":
        set(evidenceData, 'code.coding[0].display', textValue)
        break;
      case "evidenceDisplay":
        set(evidenceData, 'evidence[0].detail[0].display', textValue)
        break;  
      case "datePicker":
        set(evidenceData, 'onsetDateTime', textValue)
        break;
      case "onsetDateTime":
        set(evidenceData, 'onsetDateTime', textValue)
        break;
  
    }
    return evidenceData;
  }
  componentDidUpdate(props){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('EvidenceDisplay.componentDidUpdate()', props, this.state)
  }
  // this could be a mixin
  changeState(field, event, textValue){

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("   ");
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("EvidenceDetail.changeState", field, textValue);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("this.state", this.state);

    let formData = Object.assign({}, this.state.form);
    let evidenceData = Object.assign({}, this.state.evidence);

    formData = this.updateFormData(formData, field, textValue);
    evidenceData = this.updateEvidence(evidenceData, field, textValue);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("evidenceData", evidenceData);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);

    this.setState({evidence: evidenceData})
    this.setState({form: formData})

  }

  handleSaveButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^&&')
    console.log('Saving a new Evidence...', this.state)

    let self = this;
    let fhirEvidenceData = Object.assign({}, this.state.evidence);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log('fhirEvidenceData', fhirEvidenceData);


    let evidenceValidator = EvidenceSchema.newContext();
    evidenceValidator.validate(fhirEvidenceData)

    console.log('IsValid: ', evidenceValidator.isValid())
    console.log('ValidationErrors: ', evidenceValidator.validationErrors());

    if (this.state.evidenceId) {
      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Updating Evidence...");
      delete fhirEvidenceData._id;

      Evidences._collection.update(
        {_id: this.state.evidenceId}, {$set: fhirEvidenceData }, function(error, result) {
          if (error) {
            console.log("error", error);
            // Bert.alert(error.reason, 'danger');
          }
          if (result) {
            if(self.props.onUpdate){
              self.props.onUpdate(self.data.evidenceId);
            }
            // Bert.alert('Evidence updated!', 'success');
          }
        });
    } else {

      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Create a new Evidence", fhirEvidenceData);

      Evidences._collection.insert(fhirEvidenceData, function(error, result) {
        if (error) {
          console.log("error", error);
          // Bert.alert(error.reason, 'danger');
        }
        if (result) {
          if(self.props.onInsert){
            self.props.onInsert(self.data.evidenceId);
          }
          // Bert.alert('Evidence added!', 'success');
        }
      });
    }
  }

  handleCancelButton(){
    if(this.props.onCancel){
      this.props.onCancel();
    }
  }

  handleDeleteButton(){
    console.log('EvidenceDetail.handleDeleteButton()', this.state.evidenceId)

    let self = this;
    Evidences._collection.remove({_id: this.state.evidenceId}, function(error, result){
      if (error) {
        // Bert.alert(error.reason, 'danger');
      }
      if (result) {
        if(this.props.onInsert){
          this.props.onInsert(self.data.evidenceId);
        }
        // Bert.alert('Evidence removed!', 'success');
      }
    });
  }
}

EvidenceDetail.propTypes = {
  id: PropTypes.string,
  evidenceId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  evidence: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showDatePicker: PropTypes.bool,
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpdate: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func
};


// Embedded mode wrapper for HoneycombFhirResource dispatcher
function EvidenceDetailEmbeddedWrapper(props) {
  var isEmbedded = props.embedded || false;
  var fhirResource = props.fhirResource;
  var onResourceChange = props.onResourceChange;

  // Pass through to legacy class component
  var classProps = Object.assign({}, props);
  if (isEmbedded && fhirResource) {
    classProps.evidence = fhirResource;
  }

  return React.createElement(EvidenceDetail, classProps);
}

export default EvidenceDetailEmbeddedWrapper;