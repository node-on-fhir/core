// =======================================================================
// Using DSTU2  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//
// https://www.hl7.org/fhir/DSTU2/artifactAssessmentss.html
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


export class ArtifactAssessmentsDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      artifactAssessmentsId: false,
      artifactAssessments: {
        resourceType: "ArtifactAssessments",
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
        artifactAssessments: [],
        onsetDateTime: null
      }, 
      form: {
        patientDisplay: '',
        asserterDisplay: '',
        snomedCode: '',
        snomedDisplay: '',
        clinicalStatus: '',
        verificationStatus: '',
        artifactAssessmentsDisplay: '',
        onsetDateTime: ''
      }
    }
  }
  dehydrateFhirResource(artifactAssessments) {
    let formData = Object.assign({}, this.state.form);

    formData.patientDisplay = get(artifactAssessments, 'patient.display')
    formData.asserterDisplay = get(artifactAssessments, 'asserter.display')    
    formData.snomedCode = get(artifactAssessments, 'code.coding[0].code')
    formData.snomedDisplay = get(artifactAssessments, 'code.coding[0].display')
    formData.clinicalStatus = get(artifactAssessments, 'clinicalStatus')
    formData.verificationStatus = get(artifactAssessments, 'verificationStatus')
    formData.onsetDateTime = get(artifactAssessments, 'onsetDateTime')

    return formData;
  }
  shouldComponentUpdate(nextProps){
    get(Meteor, 'settings.public.logging') === "debug" && console.log('ArtifactAssessmentsDetail.shouldComponentUpdate()', nextProps, this.state)
    let shouldUpdate = true;

    // received an artifactAssessments from the table; okay lets update again
    if(nextProps.artifactAssessmentsId !== this.state.artifactAssessmentsId){
      
      if(nextProps.artifactAssessments){
        this.setState({artifactAssessments: nextProps.artifactAssessments})     
        this.setState({form: this.dehydrateFhirResource(nextProps.artifactAssessments)})       
      }

      this.setState({artifactAssessmentsId: nextProps.artifactAssessmentsId})
      shouldUpdate = true;
    }

    // both false; don't take any more updates
    if(nextProps.artifactAssessments === this.state.artifactAssessments){
      shouldUpdate = false;
    }
 
    return shouldUpdate;
  }

  getMeteorData() {
    let data = {
      artifactAssessmentsId: this.props.artifactAssessmentsId,
      artifactAssessments: false,
      showDatePicker: false,
      form: this.state.form
    };

    if(this.props.showDatePicker){
      data.showDatePicker = this.props.showDatePicker
    }
    if(this.props.artifactAssessments){
      data.artifactAssessments = this.props.artifactAssessments;
      data.form = this.dehydrateFhirResource(this.props.artifactAssessments);
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
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('ArtifactAssessmentsDetail.render()', this.state)

    return (
      <div id={this.props.id} className="artifactAssessmentsDetail">
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
          { this.determineButtons(this.state.artifactAssessmentsId) }
        </CardActions>
      </div>
    );
  }

  determineButtons(artifactAssessmentsId){
    if (artifactAssessmentsId) {
      return (
        <div>
          <Button id="updateArtifactAssessmentsButton" primary={true} onClick={this.handleSaveButton.bind(this)} style={{marginRight: '20px'}} >Save</Button>
          <Button id="deleteArtifactAssessmentsButton" onClick={this.handleDeleteButton.bind(this)} >Delete</Button>
        </div>
      );
    } else {
      return(
        <Button id="saveArtifactAssessmentsButton" primary={true} onClick={this.handleSaveButton.bind(this)} >Save</Button>
      );
    }
  }


  updateFormData(formData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("ArtifactAssessmentsDetail.updateFormData", formData, field, textValue);

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
      case "artifactAssessmentsDisplay":
        set(formData, 'artifactAssessmentsDisplay', textValue)
        break;
      case "onsetDateTime":
        set(formData, 'onsetDateTime', textValue)
        break;
      default:
    }

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);
    return formData;
  }
  updateArtifactAssessments(artifactAssessmentsData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("ArtifactAssessmentsDetail.updateArtifactAssessments", artifactAssessmentsData, field, textValue);

    switch (field) {
      case "patientDisplay":
        set(artifactAssessmentsData, 'patient.display', textValue)
        break;
      case "asserterDisplay":
        set(artifactAssessmentsData, 'asserter.display', textValue)
        break;
      case "verificationStatus":
        set(artifactAssessmentsData, 'verificationStatus', textValue)
        break;
      case "clinicalStatus":
        set(artifactAssessmentsData, 'clinicalStatus', textValue)
        break;
      case "snomedCode":
        set(artifactAssessmentsData, 'code.coding[0].code', textValue)
        break;
      case "snomedDisplay":
        set(artifactAssessmentsData, 'code.coding[0].display', textValue)
        break;
      case "artifactAssessmentsDisplay":
        set(artifactAssessmentsData, 'artifactAssessments[0].detail[0].display', textValue)
        break;  
      case "datePicker":
        set(artifactAssessmentsData, 'onsetDateTime', textValue)
        break;
      case "onsetDateTime":
        set(artifactAssessmentsData, 'onsetDateTime', textValue)
        break;
  
    }
    return artifactAssessmentsData;
  }
  componentDidUpdate(props){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('ArtifactAssessmentsDisplay.componentDidUpdate()', props, this.state)
  }
  // this could be a mixin
  changeState(field, event, textValue){

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("   ");
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("ArtifactAssessmentsDetail.changeState", field, textValue);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("this.state", this.state);

    let formData = Object.assign({}, this.state.form);
    let artifactAssessmentsData = Object.assign({}, this.state.artifactAssessments);

    formData = this.updateFormData(formData, field, textValue);
    artifactAssessmentsData = this.updateArtifactAssessments(artifactAssessmentsData, field, textValue);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("artifactAssessmentsData", artifactAssessmentsData);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);

    this.setState({artifactAssessments: artifactAssessmentsData})
    this.setState({form: formData})

  }

  handleSaveButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^&&')
    console.log('Saving a new ArtifactAssessments...', this.state)

    let self = this;
    let fhirArtifactAssessmentsData = Object.assign({}, this.state.artifactAssessments);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log('fhirArtifactAssessmentsData', fhirArtifactAssessmentsData);


    let artifactAssessmentsValidator = ArtifactAssessmentsSchema.newContext();
    artifactAssessmentsValidator.validate(fhirArtifactAssessmentsData)

    console.log('IsValid: ', artifactAssessmentsValidator.isValid())
    console.log('ValidationErrors: ', artifactAssessmentsValidator.validationErrors());

    if (this.state.artifactAssessmentsId) {
      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Updating ArtifactAssessments...");
      delete fhirArtifactAssessmentsData._id;

      ArtifactAssessmentss._collection.update(
        {_id: this.state.artifactAssessmentsId}, {$set: fhirArtifactAssessmentsData }, function(error, result) {
          if (error) {
            console.log("error", error);
            // Bert.alert(error.reason, 'danger');
          }
          if (result) {
            if(self.props.onUpdate){
              self.props.onUpdate(self.data.artifactAssessmentsId);
            }
            // Bert.alert('ArtifactAssessments updated!', 'success');
          }
        });
    } else {

      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Create a new ArtifactAssessments", fhirArtifactAssessmentsData);

      ArtifactAssessmentss._collection.insert(fhirArtifactAssessmentsData, function(error, result) {
        if (error) {
          console.log("error", error);
          // Bert.alert(error.reason, 'danger');
        }
        if (result) {
          if(self.props.onInsert){
            self.props.onInsert(self.data.artifactAssessmentsId);
          }
          // Bert.alert('ArtifactAssessments added!', 'success');
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
    console.log('ArtifactAssessmentsDetail.handleDeleteButton()', this.state.artifactAssessmentsId)

    let self = this;
    ArtifactAssessmentss._collection.remove({_id: this.state.artifactAssessmentsId}, function(error, result){
      if (error) {
        // Bert.alert(error.reason, 'danger');
      }
      if (result) {
        if(this.props.onInsert){
          this.props.onInsert(self.data.artifactAssessmentsId);
        }
        // Bert.alert('ArtifactAssessments removed!', 'success');
      }
    });
  }
}

ArtifactAssessmentsDetail.propTypes = {
  id: PropTypes.string,
  artifactAssessmentsId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  artifactAssessments: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showDatePicker: PropTypes.bool,
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpdate: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func
};


// Embedded mode wrapper for HoneycombFhirResource dispatcher
function ArtifactAssessmentsDetailEmbeddedWrapper(props) {
  var isEmbedded = props.embedded || false;
  var fhirResource = props.fhirResource;
  var onResourceChange = props.onResourceChange;

  // Pass through to legacy class component
  var classProps = Object.assign({}, props);
  if (isEmbedded && fhirResource) {
    classProps.artifactAssessments = fhirResource;
  }

  return React.createElement(ArtifactAssessmentsDetail, classProps);
}

export default ArtifactAssessmentsDetailEmbeddedWrapper;