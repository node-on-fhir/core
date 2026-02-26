// =======================================================================
// Using DSTU2  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//
// https://www.hl7.org/fhir/DSTU2/operationOutcomes.html
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


export class OperationOutcomeDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      operationOutcomeId: false,
      operationOutcome: {
        resourceType: "OperationOutcome",
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
        operationOutcome: [],
        onsetDateTime: null
      }, 
      form: {
        patientDisplay: '',
        asserterDisplay: '',
        snomedCode: '',
        snomedDisplay: '',
        clinicalStatus: '',
        verificationStatus: '',
        operationOutcomeDisplay: '',
        onsetDateTime: ''
      }
    }
  }
  dehydrateFhirResource(operationOutcome) {
    let formData = Object.assign({}, this.state.form);

    formData.patientDisplay = get(operationOutcome, 'patient.display')
    formData.asserterDisplay = get(operationOutcome, 'asserter.display')    
    formData.snomedCode = get(operationOutcome, 'code.coding[0].code')
    formData.snomedDisplay = get(operationOutcome, 'code.coding[0].display')
    formData.clinicalStatus = get(operationOutcome, 'clinicalStatus')
    formData.verificationStatus = get(operationOutcome, 'verificationStatus')
    formData.onsetDateTime = get(operationOutcome, 'onsetDateTime')

    return formData;
  }
  shouldComponentUpdate(nextProps){
    get(Meteor, 'settings.public.logging') === "debug" && console.log('OperationOutcomeDetail.shouldComponentUpdate()', nextProps, this.state)
    let shouldUpdate = true;

    // received an operationOutcome from the table; okay lets update again
    if(nextProps.operationOutcomeId !== this.state.operationOutcomeId){
      
      if(nextProps.operationOutcome){
        this.setState({operationOutcome: nextProps.operationOutcome})     
        this.setState({form: this.dehydrateFhirResource(nextProps.operationOutcome)})       
      }

      this.setState({operationOutcomeId: nextProps.operationOutcomeId})
      shouldUpdate = true;
    }

    // both false; don't take any more updates
    if(nextProps.operationOutcome === this.state.operationOutcome){
      shouldUpdate = false;
    }
 
    return shouldUpdate;
  }

  getMeteorData() {
    let data = {
      operationOutcomeId: this.props.operationOutcomeId,
      operationOutcome: false,
      showDatePicker: false,
      form: this.state.form
    };

    if(this.props.showDatePicker){
      data.showDatePicker = this.props.showDatePicker
    }
    if(this.props.operationOutcome){
      data.operationOutcome = this.props.operationOutcome;
      data.form = this.dehydrateFhirResource(this.props.operationOutcome);
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
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('OperationOutcomeDetail.render()', this.state)

    return (
      <div id={this.props.id} className="operationOutcomeDetail">
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
          { this.determineButtons(this.state.operationOutcomeId) }
        </CardActions>
      </div>
    );
  }

  determineButtons(operationOutcomeId){
    if (operationOutcomeId) {
      return (
        <div>
          <Button id="updateOperationOutcomeButton" primary={true} onClick={this.handleSaveButton.bind(this)} style={{marginRight: '20px'}} >Save</Button>
          <Button id="deleteOperationOutcomeButton" onClick={this.handleDeleteButton.bind(this)} >Delete</Button>
        </div>
      );
    } else {
      return(
        <Button id="saveOperationOutcomeButton" primary={true} onClick={this.handleSaveButton.bind(this)} >Save</Button>
      );
    }
  }


  updateFormData(formData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("OperationOutcomeDetail.updateFormData", formData, field, textValue);

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
      case "operationOutcomeDisplay":
        set(formData, 'operationOutcomeDisplay', textValue)
        break;
      case "onsetDateTime":
        set(formData, 'onsetDateTime', textValue)
        break;
      default:
    }

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);
    return formData;
  }
  updateOperationOutcome(operationOutcomeData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("OperationOutcomeDetail.updateOperationOutcome", operationOutcomeData, field, textValue);

    switch (field) {
      case "patientDisplay":
        set(operationOutcomeData, 'patient.display', textValue)
        break;
      case "asserterDisplay":
        set(operationOutcomeData, 'asserter.display', textValue)
        break;
      case "verificationStatus":
        set(operationOutcomeData, 'verificationStatus', textValue)
        break;
      case "clinicalStatus":
        set(operationOutcomeData, 'clinicalStatus', textValue)
        break;
      case "snomedCode":
        set(operationOutcomeData, 'code.coding[0].code', textValue)
        break;
      case "snomedDisplay":
        set(operationOutcomeData, 'code.coding[0].display', textValue)
        break;
      case "operationOutcomeDisplay":
        set(operationOutcomeData, 'operationOutcome[0].detail[0].display', textValue)
        break;  
      case "datePicker":
        set(operationOutcomeData, 'onsetDateTime', textValue)
        break;
      case "onsetDateTime":
        set(operationOutcomeData, 'onsetDateTime', textValue)
        break;
  
    }
    return operationOutcomeData;
  }
  componentDidUpdate(props){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('OperationOutcomeDisplay.componentDidUpdate()', props, this.state)
  }
  // this could be a mixin
  changeState(field, event, textValue){

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("   ");
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("OperationOutcomeDetail.changeState", field, textValue);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("this.state", this.state);

    let formData = Object.assign({}, this.state.form);
    let operationOutcomeData = Object.assign({}, this.state.operationOutcome);

    formData = this.updateFormData(formData, field, textValue);
    operationOutcomeData = this.updateOperationOutcome(operationOutcomeData, field, textValue);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("operationOutcomeData", operationOutcomeData);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);

    this.setState({operationOutcome: operationOutcomeData})
    this.setState({form: formData})

  }

  handleSaveButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^&&')
    console.log('Saving a new OperationOutcome...', this.state)

    let self = this;
    let fhirOperationOutcomeData = Object.assign({}, this.state.operationOutcome);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log('fhirOperationOutcomeData', fhirOperationOutcomeData);


    let operationOutcomeValidator = OperationOutcomeSchema.newContext();
    operationOutcomeValidator.validate(fhirOperationOutcomeData)

    console.log('IsValid: ', operationOutcomeValidator.isValid())
    console.log('ValidationErrors: ', operationOutcomeValidator.validationErrors());

    if (this.state.operationOutcomeId) {
      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Updating OperationOutcome...");
      delete fhirOperationOutcomeData._id;

      OperationOutcomes._collection.update(
        {_id: this.state.operationOutcomeId}, {$set: fhirOperationOutcomeData }, function(error, result) {
          if (error) {
            console.log("error", error);
            // Bert.alert(error.reason, 'danger');
          }
          if (result) {
            if(self.props.onUpdate){
              self.props.onUpdate(self.data.operationOutcomeId);
            }
            // Bert.alert('OperationOutcome updated!', 'success');
          }
        });
    } else {

      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Create a new OperationOutcome", fhirOperationOutcomeData);

      OperationOutcomes._collection.insert(fhirOperationOutcomeData, function(error, result) {
        if (error) {
          console.log("error", error);
          // Bert.alert(error.reason, 'danger');
        }
        if (result) {
          if(self.props.onInsert){
            self.props.onInsert(self.data.operationOutcomeId);
          }
          // Bert.alert('OperationOutcome added!', 'success');
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
    console.log('OperationOutcomeDetail.handleDeleteButton()', this.state.operationOutcomeId)

    let self = this;
    OperationOutcomes._collection.remove({_id: this.state.operationOutcomeId}, function(error, result){
      if (error) {
        // Bert.alert(error.reason, 'danger');
      }
      if (result) {
        if(this.props.onInsert){
          this.props.onInsert(self.data.operationOutcomeId);
        }
        // Bert.alert('OperationOutcome removed!', 'success');
      }
    });
  }
}

OperationOutcomeDetail.propTypes = {
  id: PropTypes.string,
  operationOutcomeId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  operationOutcome: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showDatePicker: PropTypes.bool,
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpdate: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func
};


// Embedded mode wrapper for HoneycombFhirResource dispatcher
function OperationOutcomeDetailEmbeddedWrapper(props) {
  var isEmbedded = props.embedded || false;
  var fhirResource = props.fhirResource;
  var onResourceChange = props.onResourceChange;

  // Pass through to legacy class component
  var classProps = Object.assign({}, props);
  if (isEmbedded && fhirResource) {
    classProps.operationOutcome = fhirResource;
  }

  return React.createElement(OperationOutcomeDetail, classProps);
}

export default OperationOutcomeDetailEmbeddedWrapper;