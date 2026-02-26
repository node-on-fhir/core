// =======================================================================
// Using DSTU2  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//
// https://www.hl7.org/fhir/DSTU2/guidanceResponses.html
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


export class GuidanceResponseDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      guidanceResponseId: false,
      guidanceResponse: {
        resourceType: "GuidanceResponse",
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
        guidanceResponse: [],
        onsetDateTime: null
      }, 
      form: {
        patientDisplay: '',
        asserterDisplay: '',
        snomedCode: '',
        snomedDisplay: '',
        clinicalStatus: '',
        verificationStatus: '',
        guidanceResponseDisplay: '',
        onsetDateTime: ''
      }
    }
  }
  dehydrateFhirResource(guidanceResponse) {
    let formData = Object.assign({}, this.state.form);

    formData.patientDisplay = get(guidanceResponse, 'patient.display')
    formData.asserterDisplay = get(guidanceResponse, 'asserter.display')    
    formData.snomedCode = get(guidanceResponse, 'code.coding[0].code')
    formData.snomedDisplay = get(guidanceResponse, 'code.coding[0].display')
    formData.clinicalStatus = get(guidanceResponse, 'clinicalStatus')
    formData.verificationStatus = get(guidanceResponse, 'verificationStatus')
    formData.onsetDateTime = get(guidanceResponse, 'onsetDateTime')

    return formData;
  }
  shouldComponentUpdate(nextProps){
    get(Meteor, 'settings.public.logging') === "debug" && console.log('GuidanceResponseDetail.shouldComponentUpdate()', nextProps, this.state)
    let shouldUpdate = true;

    // received an guidanceResponse from the table; okay lets update again
    if(nextProps.guidanceResponseId !== this.state.guidanceResponseId){
      
      if(nextProps.guidanceResponse){
        this.setState({guidanceResponse: nextProps.guidanceResponse})     
        this.setState({form: this.dehydrateFhirResource(nextProps.guidanceResponse)})       
      }

      this.setState({guidanceResponseId: nextProps.guidanceResponseId})
      shouldUpdate = true;
    }

    // both false; don't take any more updates
    if(nextProps.guidanceResponse === this.state.guidanceResponse){
      shouldUpdate = false;
    }
 
    return shouldUpdate;
  }

  getMeteorData() {
    let data = {
      guidanceResponseId: this.props.guidanceResponseId,
      guidanceResponse: false,
      showDatePicker: false,
      form: this.state.form
    };

    if(this.props.showDatePicker){
      data.showDatePicker = this.props.showDatePicker
    }
    if(this.props.guidanceResponse){
      data.guidanceResponse = this.props.guidanceResponse;
      data.form = this.dehydrateFhirResource(this.props.guidanceResponse);
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
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('GuidanceResponseDetail.render()', this.state)

    return (
      <div id={this.props.id} className="guidanceResponseDetail">
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
          { this.determineButtons(this.state.guidanceResponseId) }
        </CardActions>
      </div>
    );
  }

  determineButtons(guidanceResponseId){
    if (guidanceResponseId) {
      return (
        <div>
          <Button id="updateGuidanceResponseButton" primary={true} onClick={this.handleSaveButton.bind(this)} style={{marginRight: '20px'}} >Save</Button>
          <Button id="deleteGuidanceResponseButton" onClick={this.handleDeleteButton.bind(this)} >Delete</Button>
        </div>
      );
    } else {
      return(
        <Button id="saveGuidanceResponseButton" primary={true} onClick={this.handleSaveButton.bind(this)} >Save</Button>
      );
    }
  }


  updateFormData(formData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("GuidanceResponseDetail.updateFormData", formData, field, textValue);

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
      case "guidanceResponseDisplay":
        set(formData, 'guidanceResponseDisplay', textValue)
        break;
      case "onsetDateTime":
        set(formData, 'onsetDateTime', textValue)
        break;
      default:
    }

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);
    return formData;
  }
  updateGuidanceResponse(guidanceResponseData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("GuidanceResponseDetail.updateGuidanceResponse", guidanceResponseData, field, textValue);

    switch (field) {
      case "patientDisplay":
        set(guidanceResponseData, 'patient.display', textValue)
        break;
      case "asserterDisplay":
        set(guidanceResponseData, 'asserter.display', textValue)
        break;
      case "verificationStatus":
        set(guidanceResponseData, 'verificationStatus', textValue)
        break;
      case "clinicalStatus":
        set(guidanceResponseData, 'clinicalStatus', textValue)
        break;
      case "snomedCode":
        set(guidanceResponseData, 'code.coding[0].code', textValue)
        break;
      case "snomedDisplay":
        set(guidanceResponseData, 'code.coding[0].display', textValue)
        break;
      case "guidanceResponseDisplay":
        set(guidanceResponseData, 'guidanceResponse[0].detail[0].display', textValue)
        break;  
      case "datePicker":
        set(guidanceResponseData, 'onsetDateTime', textValue)
        break;
      case "onsetDateTime":
        set(guidanceResponseData, 'onsetDateTime', textValue)
        break;
  
    }
    return guidanceResponseData;
  }
  componentDidUpdate(props){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('GuidanceResponseDisplay.componentDidUpdate()', props, this.state)
  }
  // this could be a mixin
  changeState(field, event, textValue){

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("   ");
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("GuidanceResponseDetail.changeState", field, textValue);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("this.state", this.state);

    let formData = Object.assign({}, this.state.form);
    let guidanceResponseData = Object.assign({}, this.state.guidanceResponse);

    formData = this.updateFormData(formData, field, textValue);
    guidanceResponseData = this.updateGuidanceResponse(guidanceResponseData, field, textValue);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("guidanceResponseData", guidanceResponseData);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);

    this.setState({guidanceResponse: guidanceResponseData})
    this.setState({form: formData})

  }

  handleSaveButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^&&')
    console.log('Saving a new GuidanceResponse...', this.state)

    let self = this;
    let fhirGuidanceResponseData = Object.assign({}, this.state.guidanceResponse);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log('fhirGuidanceResponseData', fhirGuidanceResponseData);


    let guidanceResponseValidator = GuidanceResponseSchema.newContext();
    guidanceResponseValidator.validate(fhirGuidanceResponseData)

    console.log('IsValid: ', guidanceResponseValidator.isValid())
    console.log('ValidationErrors: ', guidanceResponseValidator.validationErrors());

    if (this.state.guidanceResponseId) {
      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Updating GuidanceResponse...");
      delete fhirGuidanceResponseData._id;

      GuidanceResponses._collection.update(
        {_id: this.state.guidanceResponseId}, {$set: fhirGuidanceResponseData }, function(error, result) {
          if (error) {
            console.log("error", error);
            // Bert.alert(error.reason, 'danger');
          }
          if (result) {
            if(self.props.onUpdate){
              self.props.onUpdate(self.data.guidanceResponseId);
            }
            // Bert.alert('GuidanceResponse updated!', 'success');
          }
        });
    } else {

      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Create a new GuidanceResponse", fhirGuidanceResponseData);

      GuidanceResponses._collection.insert(fhirGuidanceResponseData, function(error, result) {
        if (error) {
          console.log("error", error);
          // Bert.alert(error.reason, 'danger');
        }
        if (result) {
          if(self.props.onInsert){
            self.props.onInsert(self.data.guidanceResponseId);
          }
          // Bert.alert('GuidanceResponse added!', 'success');
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
    console.log('GuidanceResponseDetail.handleDeleteButton()', this.state.guidanceResponseId)

    let self = this;
    GuidanceResponses._collection.remove({_id: this.state.guidanceResponseId}, function(error, result){
      if (error) {
        // Bert.alert(error.reason, 'danger');
      }
      if (result) {
        if(this.props.onInsert){
          this.props.onInsert(self.data.guidanceResponseId);
        }
        // Bert.alert('GuidanceResponse removed!', 'success');
      }
    });
  }
}

GuidanceResponseDetail.propTypes = {
  id: PropTypes.string,
  guidanceResponseId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  guidanceResponse: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showDatePicker: PropTypes.bool,
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpdate: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func
};


// Embedded mode wrapper for HoneycombFhirResource dispatcher
function GuidanceResponseDetailEmbeddedWrapper(props) {
  var isEmbedded = props.embedded || false;
  var fhirResource = props.fhirResource;
  var onResourceChange = props.onResourceChange;

  // Pass through to legacy class component
  var classProps = Object.assign({}, props);
  if (isEmbedded && fhirResource) {
    classProps.guidanceResponse = fhirResource;
  }

  return React.createElement(GuidanceResponseDetail, classProps);
}

export default GuidanceResponseDetailEmbeddedWrapper;