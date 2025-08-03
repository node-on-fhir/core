// =======================================================================
// Using DSTU2  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//
// https://www.hl7.org/fhir/DSTU2/claims.html
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


export class ClaimDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      claimId: false,
      claim: {
        resourceType: "Claim",
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
  dehydrateFhirResource(claim) {
    let formData = Object.assign({}, this.state.form);

    formData.patientDisplay = get(claim, 'patient.display')
    formData.asserterDisplay = get(claim, 'asserter.display')    
    formData.snomedCode = get(claim, 'code.coding[0].code')
    formData.snomedDisplay = get(claim, 'code.coding[0].display')
    formData.clinicalStatus = get(claim, 'clinicalStatus')
    formData.verificationStatus = get(claim, 'verificationStatus')
    formData.onsetDateTime = get(claim, 'onsetDateTime')

    return formData;
  }
  shouldComponentUpdate(nextProps){
    get(Meteor, 'settings.public.logging') === "debug" && console.log('ClaimDetail.shouldComponentUpdate()', nextProps, this.state)
    let shouldUpdate = true;

    // received an claim from the table; okay lets update again
    if(nextProps.claimId !== this.state.claimId){
      
      if(nextProps.claim){
        this.setState({claim: nextProps.claim})     
        this.setState({form: this.dehydrateFhirResource(nextProps.claim)})       
      }

      this.setState({claimId: nextProps.claimId})
      shouldUpdate = true;
    }

    // both false; don't take any more updates
    if(nextProps.claim === this.state.claim){
      shouldUpdate = false;
    }
 
    return shouldUpdate;
  }

  getMeteorData() {
    let data = {
      claimId: this.props.claimId,
      claim: false,
      showDatePicker: false,
      form: this.state.form
    };

    if(this.props.showDatePicker){
      data.showDatePicker = this.props.showDatePicker
    }
    if(this.props.claim){
      data.claim = this.props.claim;
      data.form = this.dehydrateFhirResource(this.props.claim);
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
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('ClaimDetail.render()', this.state)

    return (
      <div id={this.props.id} className="claimDetail">
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
          { this.determineButtons(this.state.claimId) }
        </CardActions>
      </div>
    );
  }

  determineButtons(claimId){
    if (claimId) {
      return (
        <div>
          <Button id="updateClaimButton" primary={true} onClick={this.handleSaveButton.bind(this)} style={{marginRight: '20px'}} >Save</Button>
          <Button id="deleteClaimButton" onClick={this.handleDeleteButton.bind(this)} >Delete</Button>
        </div>
      );
    } else {
      return(
        <Button id="saveClaimButton" primary={true} onClick={this.handleSaveButton.bind(this)} >Save</Button>
      );
    }
  }


  updateFormData(formData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("ClaimDetail.updateFormData", formData, field, textValue);

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
  updateClaim(claimData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("ClaimDetail.updateClaim", claimData, field, textValue);

    switch (field) {
      case "patientDisplay":
        set(claimData, 'patient.display', textValue)
        break;
      case "asserterDisplay":
        set(claimData, 'asserter.display', textValue)
        break;
      case "verificationStatus":
        set(claimData, 'verificationStatus', textValue)
        break;
      case "clinicalStatus":
        set(claimData, 'clinicalStatus', textValue)
        break;
      case "snomedCode":
        set(claimData, 'code.coding[0].code', textValue)
        break;
      case "snomedDisplay":
        set(claimData, 'code.coding[0].display', textValue)
        break;
      case "evidenceDisplay":
        set(claimData, 'evidence[0].detail[0].display', textValue)
        break;  
      case "datePicker":
        set(claimData, 'onsetDateTime', textValue)
        break;
      case "onsetDateTime":
        set(claimData, 'onsetDateTime', textValue)
        break;
  
    }
    return claimData;
  }
  componentDidUpdate(props){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('ClaimDisplay.componentDidUpdate()', props, this.state)
  }
  // this could be a mixin
  changeState(field, event, textValue){

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("   ");
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("ClaimDetail.changeState", field, textValue);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("this.state", this.state);

    let formData = Object.assign({}, this.state.form);
    let claimData = Object.assign({}, this.state.claim);

    formData = this.updateFormData(formData, field, textValue);
    claimData = this.updateClaim(claimData, field, textValue);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("claimData", claimData);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);

    this.setState({claim: claimData})
    this.setState({form: formData})

  }

  handleSaveButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^&&')
    console.log('Saving a new Claim...', this.state)

    let self = this;
    let fhirClaimData = Object.assign({}, this.state.claim);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log('fhirClaimData', fhirClaimData);


    let claimValidator = ClaimSchema.newContext();
    claimValidator.validate(fhirClaimData)

    console.log('IsValid: ', claimValidator.isValid())
    console.log('ValidationErrors: ', claimValidator.validationErrors());

    if (this.state.claimId) {
      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Updating Claim...");
      delete fhirClaimData._id;

      Claims._collection.update(
        {_id: this.state.claimId}, {$set: fhirClaimData }, function(error, result) {
          if (error) {
            console.log("error", error);
            // Bert.alert(error.reason, 'danger');
          }
          if (result) {
            if(self.props.onUpdate){
              self.props.onUpdate(self.data.claimId);
            }
            // Bert.alert('Claim updated!', 'success');
          }
        });
    } else {

      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Create a new Claim", fhirClaimData);

      Claims._collection.insert(fhirClaimData, function(error, result) {
        if (error) {
          console.log("error", error);
          // Bert.alert(error.reason, 'danger');
        }
        if (result) {
          if(self.props.onInsert){
            self.props.onInsert(self.data.claimId);
          }
          // Bert.alert('Claim added!', 'success');
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
    console.log('ClaimDetail.handleDeleteButton()', this.state.claimId)

    let self = this;
    Claims._collection.remove({_id: this.state.claimId}, function(error, result){
      if (error) {
        // Bert.alert(error.reason, 'danger');
      }
      if (result) {
        if(this.props.onInsert){
          this.props.onInsert(self.data.claimId);
        }
        // Bert.alert('Claim removed!', 'success');
      }
    });
  }
}

ClaimDetail.propTypes = {
  id: PropTypes.string,
  claimId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  claim: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showDatePicker: PropTypes.bool,
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpdate: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func
};

export default ClaimDetail;