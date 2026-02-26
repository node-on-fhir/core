// =======================================================================
// Using DSTU2  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//
// https://www.hl7.org/fhir/DSTU2/librarys.html
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


export class LibraryDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      libraryId: false,
      library: {
        resourceType: "Library",
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
        library: [],
        onsetDateTime: null
      }, 
      form: {
        patientDisplay: '',
        asserterDisplay: '',
        snomedCode: '',
        snomedDisplay: '',
        clinicalStatus: '',
        verificationStatus: '',
        libraryDisplay: '',
        onsetDateTime: ''
      }
    }
  }
  dehydrateFhirResource(library) {
    let formData = Object.assign({}, this.state.form);

    formData.patientDisplay = get(library, 'patient.display')
    formData.asserterDisplay = get(library, 'asserter.display')    
    formData.snomedCode = get(library, 'code.coding[0].code')
    formData.snomedDisplay = get(library, 'code.coding[0].display')
    formData.clinicalStatus = get(library, 'clinicalStatus')
    formData.verificationStatus = get(library, 'verificationStatus')
    formData.onsetDateTime = get(library, 'onsetDateTime')

    return formData;
  }
  shouldComponentUpdate(nextProps){
    get(Meteor, 'settings.public.logging') === "debug" && console.log('LibraryDetail.shouldComponentUpdate()', nextProps, this.state)
    let shouldUpdate = true;

    // received an library from the table; okay lets update again
    if(nextProps.libraryId !== this.state.libraryId){
      
      if(nextProps.library){
        this.setState({library: nextProps.library})     
        this.setState({form: this.dehydrateFhirResource(nextProps.library)})       
      }

      this.setState({libraryId: nextProps.libraryId})
      shouldUpdate = true;
    }

    // both false; don't take any more updates
    if(nextProps.library === this.state.library){
      shouldUpdate = false;
    }
 
    return shouldUpdate;
  }

  getMeteorData() {
    let data = {
      libraryId: this.props.libraryId,
      library: false,
      showDatePicker: false,
      form: this.state.form
    };

    if(this.props.showDatePicker){
      data.showDatePicker = this.props.showDatePicker
    }
    if(this.props.library){
      data.library = this.props.library;
      data.form = this.dehydrateFhirResource(this.props.library);
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
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('LibraryDetail.render()', this.state)

    return (
      <div id={this.props.id} className="libraryDetail">
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
          { this.determineButtons(this.state.libraryId) }
        </CardActions>
      </div>
    );
  }

  determineButtons(libraryId){
    if (libraryId) {
      return (
        <div>
          <Button id="updateLibraryButton" primary={true} onClick={this.handleSaveButton.bind(this)} style={{marginRight: '20px'}} >Save</Button>
          <Button id="deleteLibraryButton" onClick={this.handleDeleteButton.bind(this)} >Delete</Button>
        </div>
      );
    } else {
      return(
        <Button id="saveLibraryButton" primary={true} onClick={this.handleSaveButton.bind(this)} >Save</Button>
      );
    }
  }


  updateFormData(formData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("LibraryDetail.updateFormData", formData, field, textValue);

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
      case "libraryDisplay":
        set(formData, 'libraryDisplay', textValue)
        break;
      case "onsetDateTime":
        set(formData, 'onsetDateTime', textValue)
        break;
      default:
    }

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);
    return formData;
  }
  updateLibrary(libraryData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("LibraryDetail.updateLibrary", libraryData, field, textValue);

    switch (field) {
      case "patientDisplay":
        set(libraryData, 'patient.display', textValue)
        break;
      case "asserterDisplay":
        set(libraryData, 'asserter.display', textValue)
        break;
      case "verificationStatus":
        set(libraryData, 'verificationStatus', textValue)
        break;
      case "clinicalStatus":
        set(libraryData, 'clinicalStatus', textValue)
        break;
      case "snomedCode":
        set(libraryData, 'code.coding[0].code', textValue)
        break;
      case "snomedDisplay":
        set(libraryData, 'code.coding[0].display', textValue)
        break;
      case "libraryDisplay":
        set(libraryData, 'library[0].detail[0].display', textValue)
        break;  
      case "datePicker":
        set(libraryData, 'onsetDateTime', textValue)
        break;
      case "onsetDateTime":
        set(libraryData, 'onsetDateTime', textValue)
        break;
  
    }
    return libraryData;
  }
  componentDidUpdate(props){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('LibraryDisplay.componentDidUpdate()', props, this.state)
  }
  // this could be a mixin
  changeState(field, event, textValue){

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("   ");
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("LibraryDetail.changeState", field, textValue);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("this.state", this.state);

    let formData = Object.assign({}, this.state.form);
    let libraryData = Object.assign({}, this.state.library);

    formData = this.updateFormData(formData, field, textValue);
    libraryData = this.updateLibrary(libraryData, field, textValue);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("libraryData", libraryData);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);

    this.setState({library: libraryData})
    this.setState({form: formData})

  }

  handleSaveButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^&&')
    console.log('Saving a new Library...', this.state)

    let self = this;
    let fhirLibraryData = Object.assign({}, this.state.library);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log('fhirLibraryData', fhirLibraryData);


    let libraryValidator = LibrarySchema.newContext();
    libraryValidator.validate(fhirLibraryData)

    console.log('IsValid: ', libraryValidator.isValid())
    console.log('ValidationErrors: ', libraryValidator.validationErrors());

    if (this.state.libraryId) {
      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Updating Library...");
      delete fhirLibraryData._id;

      Libraries._collection.update(
        {_id: this.state.libraryId}, {$set: fhirLibraryData }, function(error, result) {
          if (error) {
            console.log("error", error);
            // Bert.alert(error.reason, 'danger');
          }
          if (result) {
            if(self.props.onUpdate){
              self.props.onUpdate(self.data.libraryId);
            }
            // Bert.alert('Library updated!', 'success');
          }
        });
    } else {

      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Create a new Library", fhirLibraryData);

      Libraries._collection.insert(fhirLibraryData, function(error, result) {
        if (error) {
          console.log("error", error);
          // Bert.alert(error.reason, 'danger');
        }
        if (result) {
          if(self.props.onInsert){
            self.props.onInsert(self.data.libraryId);
          }
          // Bert.alert('Library added!', 'success');
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
    console.log('LibraryDetail.handleDeleteButton()', this.state.libraryId)

    let self = this;
    Libraries._collection.remove({_id: this.state.libraryId}, function(error, result){
      if (error) {
        // Bert.alert(error.reason, 'danger');
      }
      if (result) {
        if(this.props.onInsert){
          this.props.onInsert(self.data.libraryId);
        }
        // Bert.alert('Library removed!', 'success');
      }
    });
  }
}

LibraryDetail.propTypes = {
  id: PropTypes.string,
  libraryId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  library: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showDatePicker: PropTypes.bool,
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpdate: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func
};


// Embedded mode wrapper for HoneycombFhirResource dispatcher
function LibraryDetailEmbeddedWrapper(props) {
  var isEmbedded = props.embedded || false;
  var fhirResource = props.fhirResource;
  var onResourceChange = props.onResourceChange;

  // Pass through to legacy class component
  var classProps = Object.assign({}, props);
  if (isEmbedded && fhirResource) {
    classProps.library = fhirResource;
  }

  return React.createElement(LibraryDetail, classProps);
}

export default LibraryDetailEmbeddedWrapper;