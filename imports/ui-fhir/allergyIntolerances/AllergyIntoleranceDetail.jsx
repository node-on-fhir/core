// =======================================================================
// Using DSTU2  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//
// https://www.hl7.org/fhir/DSTU2/allergyintolerance.html
//
//
// =======================================================================

import { 
  Button,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Container,
  TextField,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Box
} from '@mui/material';

import { get, set, setWith } from 'lodash';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import React, { Component, Fragment } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';


export class AllergyIntoleranceDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      allergyIntoleranceId: false,
      allergy: {
        resourceType: "AllergyIntolerance",
          identifier: [{
            value: ''
          }],
          clinicalStatus: 'active',
          verificationStatus: 'unconfirmed',
          type: 'allergy',
          category: ['food'],
          code: null,
          patient: {
            display: ''
          },
          recorder: {
            display: ''
          },
          onsetDateTime: null,
          reaction: [{
            description: ''
          }],
          criticality: 'low'
      },
      form: {
        allergyIdentifier: '',
        reactionDescription: '',
        clinicalStatus: 0,
        verificationStatus: 0,
        category: 0,
        type: 0,
        criticality: 0,
        patientDisplay: '',
        recorderDisplay: '',
        substance: ''
      }
    }
  }
  dehydrateFhirResource(allergyIntolerance) {

    let formData = Object.assign({}, this.state.form);

    formData.allergyIdentifier = get(allergyIntolerance, 'identifier[0].value')
    formData.reactionDescription = get(allergyIntolerance, 'reaction[0].description')    
    formData.patientDisplay = get(allergyIntolerance, 'patient.display')
    formData.recorderDisplay = get(allergyIntolerance, 'recorder.display')

    switch (get(allergyIntolerance, 'clinicalStatus')) {
      case 'active':
        formData.clinicalStatus = 0;  
        break;
      case 'inactive':
        formData.clinicalStatus = 1;         
        break;
      case 'resolved':
        formData.clinicalStatus = 2;     
        break;      
    }

    switch (get(allergyIntolerance, 'verificationStatus')) {
      case 'unconfirmed':
        formData.verificationStatus = 0;  
        break;
      case 'confirmed':
        formData.verificationStatus = 1;         
        break;
      case 'refuted':
        formData.verificationStatus = 2;     
        break;      
      case 'entered-in-error':
        formData.verificationStatus = 3;     
        break;      
    }

    switch (get(allergyIntolerance, 'category')) {
      case 'food':
        formData.category = 0;  
        break;
      case 'medication':
        formData.category = 1;         
        break;
      case 'environment':
        formData.category = 2;     
        break;      
      case 'biologic':
        formData.category = 3;     
        break;      
    }

    switch (get(allergyIntolerance, 'type')) {
      case 'allergy':
        formData.type = 0;  
        break;
      case 'intollerance':
        formData.type = 1;         
        break;
    }

    switch (get(allergyIntolerance, 'criticality')) {
      case 'low':
        formData.criticality = 0;  
        break;
      case 'high':
        formData.criticality = 1;         
        break;
      case 'unable-to-assess':
        formData.criticality = 2;     
        break;      
    }
    return formData;
  }
  shouldComponentUpdate(nextProps){
    process.env.NODE_ENV === "test" && console.log('AllergyIntoleranceDetail.shouldComponentUpdate()', nextProps, this.state)
    let shouldUpdate = true;

    // both false; don't take any more updates
    if(nextProps.allergy === this.state.allergy){
      shouldUpdate = false;
    }

    // received an allergie from the table; okay lets update again
    if(nextProps.allergyIntoleranceId !== this.state.allergyIntoleranceId){
      this.setState({allergyIntoleranceId: nextProps.allergyIntoleranceId})     
      this.setState({allergy: nextProps.allergy})     
      this.setState({form: this.dehydrateFhirResource(nextProps.allergy)})     
      shouldUpdate = true;
    }
 
    return shouldUpdate;
  }

  getMeteorData() {
    let data = {
      allergyIntoleranceId: this.props.allergyIntoleranceId,
      allergy: false,
      form: this.state.form,
      showDatePicker: false      
    };

    if(this.props.showDatePicker){
      data.showDatePicker = this.props.showDatePicker
    }
    if(this.props.allergy){
      data.allergy = this.props.allergy;
    }
    
    console.log('AllergyIntoleranceDetail[data]', data);
    return data;
  }
  // renderDatePicker(showDatePicker, datePickerValue){
  //   if (typeof datePickerValue === "string"){
  //     datePickerValue = new Date(datePickerValue);
  //   }
  //   if (showDatePicker) {
  //     return (
  //       <DatePicker 
  //         name='datePicker'
  //         hintText="Onset Date" 
  //         container="inline" 
  //         mode="landscape"
  //         value={ datePickerValue ? datePickerValue : null}    
  //         onChange={ this.changeState.bind(this, 'datePicker')}      
  //         />
  //     );
  //   }
  // }
  render() {
    if(process.env.NODE_ENV === "test") console.log('AllergyIntoleranceDetail.render()', this.state)
    let formData = this.state.form;

    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card sx={{ boxShadow: 3 }}>
          <CardHeader 
            title={this.state.allergyIntoleranceId ? 'Edit Allergy/Intolerance' : 'New Allergy/Intolerance'}
            sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
          />
          <CardContent sx={{ p: 4 }}>
            {/* System ID Barcode */}
            {this.state.allergyIntoleranceId && (
              <Box sx={{ mb: 3, textAlign: 'right' }}>
                <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{this.state.allergyIntoleranceId}</span>
              </Box>
            )}
            
            <Stack spacing={3}>
              {/* Status selects - full width */}
              <FormControl fullWidth>
                <InputLabel>Clinical Status</InputLabel>
                <Select
                  id='clinicalStatusInput'
                  name='clinicalStatus'
                  label="Clinical Status"
                  value={ get(formData, 'clinicalStatus', 0) }
                  onChange={ this.changeState.bind(this, 'clinicalStatus')}
                >
                  <MenuItem value={0}>Active</MenuItem>
                  <MenuItem value={1}>Inactive</MenuItem>
                  <MenuItem value={2}>Resolved</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Verification Status</InputLabel>
                <Select
                  id='verificationStatusInput'
                  name='verificationStatus'
                  label="Verification Status"
                  value={ get(formData, 'verificationStatus', 0) }
                  onChange={ this.changeState.bind(this, 'verificationStatus')}
                >
                  <MenuItem value={0}>Unconfirmed</MenuItem>
                  <MenuItem value={1}>Confirmed</MenuItem>
                  <MenuItem value={2}>Refuted</MenuItem>
                  <MenuItem value={3}>Entered in Error</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  id='categoryInput'
                  name='category'
                  label="Category"
                  value={ get(formData, 'category', 0) }
                  onChange={ this.changeState.bind(this, 'category')}
                >
                  <MenuItem value={0}>Food</MenuItem>
                  <MenuItem value={1}>Medication</MenuItem>
                  <MenuItem value={2}>Environment</MenuItem>
                  <MenuItem value={3}>Biologic</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  id='typeInput'
                  name='type'
                  label="Type"
                  value={ get(formData, 'type', 0) }
                  onChange={ this.changeState.bind(this, 'type')}
                >
                  <MenuItem value={0}>Allergy</MenuItem>
                  <MenuItem value={1}>Intolerance</MenuItem>
                </Select>
              </FormControl>

              {/* Text fields - full width */}
              <TextField
                id='identifierInput'
                name='identifier'
                label='Identifier'
                placeholder="Enter identifier"
                value={ get(formData, 'allergyIdentifier', '') }
                onChange={ this.changeState.bind(this, 'identifier')}
                fullWidth
              />

              <TextField
                id='reactionInput'
                name='reaction'
                label='Reaction Description'
                placeholder="e.g., Hives, Anaphylaxis, Rash"
                value={ get(formData, 'reactionDescription', '') }
                onChange={ this.changeState.bind(this, 'reaction')}
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>Criticality</InputLabel>
                <Select
                  id='criticalityInput'
                  name='criticality'
                  label="Criticality"
                  value={ get(formData, 'criticality', 0) }
                  onChange={ this.changeState.bind(this, 'criticality')}
                >
                  <MenuItem value={0}>Low</MenuItem>
                  <MenuItem value={1}>High</MenuItem>
                  <MenuItem value={2}>Unable to Assess</MenuItem>
                </Select>
              </FormControl>

              <TextField
                id='patientDisplayInput'
                name='patientDisplay'
                label='Patient Name'
                placeholder="Patient's full name"
                value={ get(formData, 'patientDisplay', '') }
                onChange={ this.changeState.bind(this, 'patientDisplay')}
                fullWidth
                helperText="The patient who has the allergy or intolerance"
              />

              <TextField
                id='recorderDisplayInput'
                name='recorderDisplay'
                label='Recorded By'
                placeholder="Healthcare provider's name"
                value={ get(formData, 'recorderDisplay', '') }
                onChange={ this.changeState.bind(this, 'recorderDisplay')}
                fullWidth
                helperText="The person who recorded this allergy"
              />

              <TextField
                id='substanceInput'
                name='substance'
                label='Allergen/Substance'
                placeholder="e.g., Peanuts, Penicillin, Latex"
                value={ get(formData, 'substance', '') }
                onChange={ this.changeState.bind(this, 'substance')}
                fullWidth
                helperText="The specific substance that causes the allergic reaction"
              />
            </Stack>

          {/* <br/>
          { this.renderDatePicker(this.data.showDatePicker, get(this, 'data.allergy.onsetDateTime') ) }
          <br/> */}
        
          </CardContent>
          <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
            { this.determineButtons(this.state.allergyIntoleranceId ) }
          </CardActions>
        </Card>
      </Container>
    );
  }

  determineButtons(allergyId){
    if (allergyId) {
      return (
        <>
          <Button 
            onClick={this.handleCancelButton.bind(this)}
          >
            Cancel
          </Button>
          <Button 
            id="deleteAllergyIntoleranceButton" 
            onClick={this.handleDeleteButton.bind(this)}
            color="error"
          >
            Delete
          </Button>
          <Button 
            id="updateAllergyIntoleranceButton" 
            onClick={this.handleSaveButton.bind(this)}
            variant="contained"
            color="primary"
          >
            Save
          </Button>
        </>
      );
    } else {
      return(
        <>
          <Button 
            onClick={this.handleCancelButton.bind(this)}
          >
            Cancel
          </Button>
          <Button 
            id="saveAllergyIntoleranceButton" 
            onClick={this.handleSaveButton.bind(this)}
            variant="contained"
            color="primary"
          >
            Save
          </Button>
        </>
      );
    }
  }
  updateFormData(formData, field, textValue){
    if(process.env.NODE_ENV === "test") console.log("AllergyIntoleranceDetail.updateFormData", formData, field, textValue);

    switch (field) {
      case "identifier":
        set(formData, 'allergyIdentifier', textValue)
        break;
      case "reaction":
        set(formData, 'reactionDescription', textValue)
        break;        
      case "verificationStatus":
        set(formData, 'verificationStatus', textValue)
        break;
      case "clinicalStatus":
        set(formData, 'clinicalStatus', textValue)
        break;
      case "type":
        set(formData, 'type', textValue)
        break;
      case "category":
        set(formData, 'category', textValue)
        break;
      case "patientDisplay":
        set(formData, 'patientDisplay', textValue)
        break;
      case "recorderDisplay":
        set(formData, 'recorderDisplay', textValue)
        break;
      case "datePicker":
        set(formData, 'onsetDateTime', textValue)
        set(formData, 'onset', textValue)
        break;
      case "criticality":
        set(formData, 'criticality', textValue)
        break;
      case "substance":
        set(formData, 'substance', textValue)
        break;
      default:
    }

    if(process.env.NODE_ENV === "test") console.log("formData", formData);

    return formData;
  }
  updateAllergy(allergyData, field, textValue){
    if(process.env.NODE_ENV === "test") console.log("AllergyIntoleranceDetail.updateAllergy", allergyData, field, textValue);

    switch (field) {
      case "identifier":
        setWith(allergyData, 'identifier[0].value', textValue, Object)
        break;
      case "reaction":
        setWith(allergyData, 'reaction[0].description', textValue, Object)
        break;        
      case "verificationStatus":
        switch (textValue) {
          case 0:
            set(allergyData, 'verificationStatus', 'unconfirmed')
            break;
          case 1:
            set(allergyData, 'verificationStatus', 'confirmed')
            break;
          case 2:
            set(allergyData, 'verificationStatus', 'refuted')
            break;
          case 3:
            set(allergyData, 'verificationStatus', 'entered-in-error')
            break;
        }       
        break;
      case "clinicalStatus":
        switch (textValue) {
          case 0:
            set(allergyData, 'clinicalStatus', 'active')
            break;
          case 1:
            set(allergyData, 'clinicalStatus', 'inactive')
            break;
          case 2:
            set(allergyData, 'clinicalStatus', 'resolved')
            break;
        }        
        break;
      case "type":
        switch (textValue) {
          case 0:
            set(allergyData, 'type', 'allergy')
            break;
          case 1:
            set(allergyData, 'type', 'intolerance')
            break;
        }   
        break;
      case "category":
        switch (textValue) {
          case 0:
            set(allergyData, 'category', ['food'])
            break;
          case 1:
            set(allergyData, 'category', ['medication'])
            break;
          case 2:
            set(allergyData, 'category', ['environment'])
            break;
          case 3:
            set(allergyData, 'category', ['biologic'])
            break;
        }   
        break;
      case "datePicker":
        set(allergyData, 'onsetDateTime', textValue)
        set(allergyData, 'onset', textValue)
        break;
      case "criticality":
        switch (textValue) {
          case 0:
            set(allergyData, 'criticality', 'low')
            break;
          case 1:
            set(allergyData, 'criticality', 'high')
            break;
          case 2:
            set(allergyData, 'criticality', 'unable-to-assess')
            break;
        }   
        break;
      default:
    }

    if(process.env.NODE_ENV === "test") console.log("allergyData", allergyData);

    return allergyData;
  }
  componentDidUpdate(props){
    if(process.env.NODE_ENV === "test") console.log('AllergyIntoleranceDetail.componentDidUpdate()', props, this.state)
  }
  changeState(field, event, textValue){
    if(process.env.NODE_ENV === "test") console.log("AllergyIntoleranceDetail.changeState", field, textValue);
    if(process.env.NODE_ENV === "test") console.log("this.state", this.state);

    let formData = Object.assign({}, this.state.form);
    let allergyData = Object.assign({}, this.state.allergy);

    formData = this.updateFormData(formData, field, textValue);
    allergyData = this.updateAllergy(allergyData, field, textValue);

    if(process.env.NODE_ENV === "test") console.log("allergyData", allergyData);
    if(process.env.NODE_ENV === "test") console.log("formData", formData);

    this.setState({allergy: allergyData})
    this.setState({form: formData})
  }

  handleSaveButton(){
    console.log('Saving a new Allergy...', this.state)

    let self = this;
    let fhirAllergyData = Object.assign({}, this.state.allergy);

    if(process.env.NODE_ENV === "test") console.log('fhirAllergyData', fhirAllergyData);

    let schemaConfig = get(Meteor, 'settings.public.defaults.schemas')
    if(process.env.NODE_ENV === "test") console.log('Meteor.settings.public.defaults.schemas', schemaConfig);

    if (this.state.allergyIntoleranceId) {
      if(process.env.NODE_ENV === "test") console.log("Updating allergyIntolerance...");
      delete fhirAllergyData._id;

      AllergyIntolerances._collection.update(
        {_id: this.state.allergyIntoleranceId}, {$set: fhirAllergyData }, function(error, result) {
          if (error) {
            console.log("error", error);
            // Bert.alert(error.reason, 'danger');
          }
          if (result) {
            HipaaLogger.logEvent({eventType: "update", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "AllergyIntolerances", recordId: self.data.allergyIntoleranceId});
            Session.set('allergyIntolerancePageTabIndex', 1);
            Session.set('selectedAllergyIntolerance', false);
            // Bert.alert('AllergyIntolerance updated!', 'success');
          }
        });
    } else {

      if(process.env.NODE_ENV === "test") console.log("Create a new allergyIntolerance", fhirAllergyData);

      AllergyIntolerances._collection.insert(fhirAllergyData, function(error, result) {
        if (error) {
          console.log("error", error);
          // Bert.alert(error.reason, 'danger');
        }
        if (result) {
          HipaaLogger.logEvent({eventType: "create", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "AllergyIntolerances", recordId: self.data.allergyIntoleranceId});
          Session.set('allergyIntolerancePageTabIndex', 1);
          Session.set('selectedAllergyIntolerance', false);
          // Bert.alert('AllergyIntolerance added!', 'success');
        }
      });
    }
  }

  handleCancelButton(){
    Session.set('allergyIntolerancePageTabIndex', 1);
  }

  handleDeleteButton(){
    let self = this;
    AllergyIntolerances._collection.remove({_id: this.state.allergyIntoleranceId}, function(error, result){
      if (error) {
        // Bert.alert(error.reason, 'danger');
      }
      if (result) {
        HipaaLogger.logEvent({eventType: "delete", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "AllergyIntolerances", recordId: self.data.allergyIntoleranceId});
        Session.set('allergyIntolerancePageTabIndex', 1);
        Session.set('selectedAllergyIntolerance', false);
        // Bert.alert('AllergyIntolerance removed!', 'success');
      }
    });
  }
}

AllergyIntoleranceDetail.propTypes = {
  id: PropTypes.string,
  fhirVersion: PropTypes.string,
  allergyIntoleranceId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  allergyIntolerance: PropTypes.oneOfType([PropTypes.object, PropTypes.bool])
};

export default AllergyIntoleranceDetail;