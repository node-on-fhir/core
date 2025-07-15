// =======================================================================
// Using FHIR R4
//
// https://www.hl7.org/fhir/medicationstatement.html
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

  
export class MedicationStatementDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      medicationStatementId: false,
      medicationStatement: {
        resourceType: "MedicationStatement",
        status: "active",
        category: {
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/medication-statement-category",
            code: "inpatient",
            display: "Inpatient"
          }]
        },
        subject: {
          reference: "",
          display: ""
        },
        effectiveDateTime: null,
        dateAsserted: null,
        informationSource: {
          reference: "",
          display: ""
        },
        medicationCodeableConcept: {
          coding: [
            {
              system: "http://www.nlm.nih.gov/research/umls/rxnorm",
              code: "",
              display: ""
            }
          ],
          text: ""
        },
        reasonCode: [{
          coding: [{
            system: "http://snomed.info/sct",
            code: "",
            display: ""
          }],
          text: ""
        }],
        dosage: [{
          text: "",
          timing: {
            repeat: {
              frequency: 1,
              period: 1,
              periodUnit: "d"
            }
          },
          route: {
            coding: [{
              system: "http://snomed.info/sct",
              code: "",
              display: ""
            }]
          },
          doseAndRate: [{
            doseQuantity: {
              value: null,
              unit: "",
              system: "http://unitsofmeasure.org",
              code: ""
            }
          }]
        }]
      }, 
      form: {
        subjectDisplay: '',
        status: 'active',
        category: 'inpatient',
        medicationDisplay: '',
        medicationCode: '',
        effectiveDateTime: '',
        dateAsserted: '',
        informationSourceDisplay: '',
        reasonText: '',
        reasonCode: '',
        dosageText: '',
        dosageValue: '',
        dosageUnit: '',
        frequency: '',
        period: '',
        periodUnit: 'd',
        routeDisplay: ''
      }
    }
  }
  dehydrateFhirResource(medicationStatement) {
    let formData = Object.assign({}, this.state.form);

    formData.subjectDisplay = get(medicationStatement, 'subject.display', '')
    formData.status = get(medicationStatement, 'status', 'active')
    formData.category = get(medicationStatement, 'category.coding[0].code', 'inpatient')
    formData.medicationDisplay = get(medicationStatement, 'medicationCodeableConcept.text', get(medicationStatement, 'medicationCodeableConcept.coding[0].display', ''))
    formData.medicationCode = get(medicationStatement, 'medicationCodeableConcept.coding[0].code', '')
    formData.effectiveDateTime = get(medicationStatement, 'effectiveDateTime', '')
    formData.dateAsserted = get(medicationStatement, 'dateAsserted', '')
    formData.informationSourceDisplay = get(medicationStatement, 'informationSource.display', '')
    formData.reasonText = get(medicationStatement, 'reasonCode[0].text', '')
    formData.reasonCode = get(medicationStatement, 'reasonCode[0].coding[0].code', '')
    formData.dosageText = get(medicationStatement, 'dosage[0].text', '')
    formData.dosageValue = get(medicationStatement, 'dosage[0].doseAndRate[0].doseQuantity.value', '')
    formData.dosageUnit = get(medicationStatement, 'dosage[0].doseAndRate[0].doseQuantity.unit', '')
    formData.frequency = get(medicationStatement, 'dosage[0].timing.repeat.frequency', '')
    formData.period = get(medicationStatement, 'dosage[0].timing.repeat.period', '')
    formData.periodUnit = get(medicationStatement, 'dosage[0].timing.repeat.periodUnit', 'd')
    formData.routeDisplay = get(medicationStatement, 'dosage[0].route.coding[0].display', '')

    return formData;
  }
  shouldComponentUpdate(nextProps){
    get(Meteor, 'settings.public.logging') === "debug" && console.log('MedicationStatementDetail.shouldComponentUpdate()', nextProps, this.state)
    let shouldUpdate = true;

    // received a medication statement from the table; okay lets update again
    if(nextProps.medicationStatementId !== this.state.medicationStatementId){
      
      if(nextProps.medicationStatement){
        this.setState({medicationStatement: nextProps.medicationStatement})     
        this.setState({form: this.dehydrateFhirResource(nextProps.medicationStatement)})       
      }

      this.setState({medicationStatementId: nextProps.medicationStatementId})
      shouldUpdate = true;
    }

    // both false; don't take any more updates
    if(nextProps.medicationStatement === this.state.medicationStatement){
      shouldUpdate = false;
    }
 
    return shouldUpdate;
  }

  getMeteorData() {
    let data = {
      medicationStatementId: this.props.medicationStatementId,
      medicationStatement: false,
      form: this.state.form
    };

    if(this.props.medicationStatement){
      data.medicationStatement = this.props.medicationStatement;
      data.form = this.dehydrateFhirResource(this.props.medicationStatement);
    }

    return data;
  }

  setHint(text){
    if(this.props.showHints !== false){
      return text;
    } else {
      return '';
    }
  }

  render() {
    get(Meteor, 'settings.public.logging') === "debug" && console.log('MedicationStatementDetail.render()', this.state)
    let formData = this.state.form;

    return (
      <div id={this.props.id} className="medicationStatementDetail">
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  id='subjectDisplayInput'
                  name='subjectDisplay'
                  label='Patient'
                  value={formData.subjectDisplay}
                  onChange={this.changeState.bind(this, 'subjectDisplay')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  id='medicationDisplayInput'
                  name='medicationDisplay'
                  label='Medication'
                  value={formData.medicationDisplay}
                  onChange={this.changeState.bind(this, 'medicationDisplay')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  id='medicationCodeInput'
                  name='medicationCode'
                  label='Medication Code'
                  value={formData.medicationCode}
                  onChange={this.changeState.bind(this, 'medicationCode')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={3}>
                <Select
                  id='statusInput'
                  name='status'
                  label='Status'
                  value={formData.status}
                  onChange={this.changeState.bind(this, 'status')}
                  fullWidth
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="entered-in-error">Entered in Error</MenuItem>
                  <MenuItem value="intended">Intended</MenuItem>
                  <MenuItem value="stopped">Stopped</MenuItem>
                  <MenuItem value="on-hold">On Hold</MenuItem>
                  <MenuItem value="unknown">Unknown</MenuItem>
                  <MenuItem value="not-taken">Not Taken</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={3}>
                <Select
                  id='categoryInput'
                  name='category'
                  label='Category'
                  value={formData.category}
                  onChange={this.changeState.bind(this, 'category')}
                  fullWidth
                >
                  <MenuItem value="inpatient">Inpatient</MenuItem>
                  <MenuItem value="outpatient">Outpatient</MenuItem>
                  <MenuItem value="community">Community</MenuItem>
                  <MenuItem value="patientspecified">Patient Specified</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={3}>
                <TextField
                  id='effectiveDateTimeInput'
                  name='effectiveDateTime'
                  label='Effective Date'
                  type='date'
                  value={formData.effectiveDateTime}
                  onChange={this.changeState.bind(this, 'effectiveDateTime')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  id='dateAssertedInput'
                  name='dateAsserted'
                  label='Date Asserted'
                  type='date'
                  value={formData.dateAsserted}
                  onChange={this.changeState.bind(this, 'dateAsserted')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id='informationSourceDisplayInput'
                  name='informationSourceDisplay'
                  label='Information Source'
                  value={formData.informationSourceDisplay}
                  onChange={this.changeState.bind(this, 'informationSourceDisplay')}
                  placeholder={this.setHint("Who provided this information")}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={8}>
                <TextField
                  id='reasonTextInput'
                  name='reasonText'
                  label='Reason for Taking'
                  value={formData.reasonText}
                  onChange={this.changeState.bind(this, 'reasonText')}
                  placeholder={this.setHint("Hypertension, diabetes, etc.")}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  id='reasonCodeInput'
                  name='reasonCode'
                  label='Reason Code'
                  value={formData.reasonCode}
                  onChange={this.changeState.bind(this, 'reasonCode')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id='dosageTextInput'
                  name='dosageText'
                  label='Dosage Instructions'
                  value={formData.dosageText}
                  onChange={this.changeState.bind(this, 'dosageText')}
                  placeholder={this.setHint("Take 2 tablets by mouth every 6 hours")}
                  fullWidth
                  multiline
                  rows={2}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  id='dosageValueInput'
                  name='dosageValue'
                  label='Dose Amount'
                  type='number'
                  value={formData.dosageValue}
                  onChange={this.changeState.bind(this, 'dosageValue')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  id='dosageUnitInput'
                  name='dosageUnit'
                  label='Dose Unit'
                  value={formData.dosageUnit}
                  onChange={this.changeState.bind(this, 'dosageUnit')}
                  placeholder={this.setHint("mg, mL, tablets, etc.")}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  id='frequencyInput'
                  name='frequency'
                  label='Frequency'
                  type='number'
                  value={formData.frequency}
                  onChange={this.changeState.bind(this, 'frequency')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  id='periodInput'
                  name='period'
                  label='Period'
                  type='number'
                  value={formData.period}
                  onChange={this.changeState.bind(this, 'period')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={2}>
                <Select
                  id='periodUnitInput'
                  name='periodUnit'
                  label='Period Unit'
                  value={formData.periodUnit}
                  onChange={this.changeState.bind(this, 'periodUnit')}
                  fullWidth
                >
                  <MenuItem value="s">Second</MenuItem>
                  <MenuItem value="min">Minute</MenuItem>
                  <MenuItem value="h">Hour</MenuItem>
                  <MenuItem value="d">Day</MenuItem>
                  <MenuItem value="wk">Week</MenuItem>
                  <MenuItem value="mo">Month</MenuItem>
                  <MenuItem value="a">Year</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={3}>
                <TextField
                  id='routeDisplayInput'
                  name='routeDisplay'
                  label='Route'
                  value={formData.routeDisplay}
                  onChange={this.changeState.bind(this, 'routeDisplay')}
                  placeholder={this.setHint("oral, IV, IM, etc.")}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
          <CardActions>
            { this.determineButtons(formData) }
          </CardActions>
        </Card>
      </div>
    );
  }

  determineButtons(formData){
    if (this.props.medicationStatementId) {
      return (
        <div>
          <Button 
            id="updateMedicationStatementButton"
            color="primary" 
            variant="contained" 
            onClick={this.handleSaveButton.bind(this)}
            style={{marginRight: '20px'}}
          >
            Save
          </Button>
          <Button 
            id="deleteMedicationStatementButton"
            onClick={this.handleDeleteButton.bind(this)}
          >
            Delete
          </Button>
        </div>
      );
    } else {
      return(
        <Button 
          id="saveMedicationStatementButton" 
          color="primary" 
          variant="contained" 
          onClick={this.handleSaveButton.bind(this)}
        >
          Save
        </Button>
      );
    }
  }

  updateFormData(formData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("MedicationStatementDetail.updateFormData", formData, field, textValue);

    switch (field) {
      case "subjectDisplay":
        set(formData, 'subjectDisplay', textValue)
        break;
      case "status":
        set(formData, 'status', textValue)
        break;
      case "category":
        set(formData, 'category', textValue)
        break;
      case "medicationDisplay":
        set(formData, 'medicationDisplay', textValue)
        break;
      case "medicationCode":
        set(formData, 'medicationCode', textValue)
        break;        
      case "effectiveDateTime":
        set(formData, 'effectiveDateTime', textValue)
        break;
      case "dateAsserted":
        set(formData, 'dateAsserted', textValue)
        break;
      case "informationSourceDisplay":
        set(formData, 'informationSourceDisplay', textValue)
        break;
      case "reasonText":
        set(formData, 'reasonText', textValue)
        break;
      case "reasonCode":
        set(formData, 'reasonCode', textValue)
        break;
      case "dosageText":
        set(formData, 'dosageText', textValue)
        break;
      case "dosageValue":
        set(formData, 'dosageValue', textValue)
        break;
      case "dosageUnit":
        set(formData, 'dosageUnit', textValue)
        break;
      case "frequency":
        set(formData, 'frequency', textValue)
        break;
      case "period":
        set(formData, 'period', textValue)
        break;
      case "periodUnit":
        set(formData, 'periodUnit', textValue)
        break;
      case "routeDisplay":
        set(formData, 'routeDisplay', textValue)
        break;
      default:
    }

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);
    return formData;
  }
  updateMedicationStatement(medicationStatementData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("MedicationStatementDetail.updateMedicationStatement", medicationStatementData, field, textValue);

    switch (field) {
      case "subjectDisplay":
        set(medicationStatementData, 'subject.display', textValue)
        break;
      case "status":
        set(medicationStatementData, 'status', textValue)
        break;
      case "category":
        set(medicationStatementData, 'category.coding[0].code', textValue)
        set(medicationStatementData, 'category.coding[0].display', textValue.charAt(0).toUpperCase() + textValue.slice(1))
        break;
      case "medicationDisplay":
        set(medicationStatementData, 'medicationCodeableConcept.text', textValue)
        break;
      case "medicationCode":
        set(medicationStatementData, 'medicationCodeableConcept.coding[0].code', textValue)
        break;        
      case "effectiveDateTime":
        set(medicationStatementData, 'effectiveDateTime', textValue)
        break;
      case "dateAsserted":
        set(medicationStatementData, 'dateAsserted', textValue)
        break;
      case "informationSourceDisplay":
        set(medicationStatementData, 'informationSource.display', textValue)
        break;
      case "reasonText":
        set(medicationStatementData, 'reasonCode[0].text', textValue)
        break;
      case "reasonCode":
        set(medicationStatementData, 'reasonCode[0].coding[0].code', textValue)
        break;
      case "dosageText":
        set(medicationStatementData, 'dosage[0].text', textValue)
        break;
      case "dosageValue":
        set(medicationStatementData, 'dosage[0].doseAndRate[0].doseQuantity.value', parseFloat(textValue))
        break;
      case "dosageUnit":
        set(medicationStatementData, 'dosage[0].doseAndRate[0].doseQuantity.unit', textValue)
        break;
      case "frequency":
        set(medicationStatementData, 'dosage[0].timing.repeat.frequency', parseInt(textValue))
        break;
      case "period":
        set(medicationStatementData, 'dosage[0].timing.repeat.period', parseInt(textValue))
        break;
      case "periodUnit":
        set(medicationStatementData, 'dosage[0].timing.repeat.periodUnit', textValue)
        break;
      case "routeDisplay":
        set(medicationStatementData, 'dosage[0].route.coding[0].display', textValue)
        break;
    }
    return medicationStatementData;
  }

  changeState(field, event, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("   ");
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("MedicationStatementDetail.changeState", field, textValue);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("this.state", this.state);

    let formData = Object.assign({}, this.state.form);
    let medicationStatementData = Object.assign({}, this.state.medicationStatement);

    formData = this.updateFormData(formData, field, textValue);
    medicationStatementData = this.updateMedicationStatement(medicationStatementData, field, textValue);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("medicationStatementData", medicationStatementData);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);

    this.setState({form: formData})
    this.setState({medicationStatement: medicationStatementData})
  }

  handleSaveButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('MedicationStatementDetail.handleSaveButton()');
    let self = this;
    if(this.props.onUpsert){
      this.props.onUpsert(self);
    }
  }

  handleCancelButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('MedicationStatementDetail.handleCancelButton()');
  }

  handleDeleteButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('MedicationStatementDetail.handleDeleteButton()');
    let self = this;
    if(this.props.onDelete){
      this.props.onDelete(self);
    }
  }
}

MedicationStatementDetail.propTypes = {
  id: PropTypes.string,
  medicationStatementId: PropTypes.string,
  medicationStatement: PropTypes.object,
  showHints: PropTypes.bool,
  onDelete: PropTypes.func,
  onUpsert: PropTypes.func,
  onCancel: PropTypes.func
};

export default MedicationStatementDetail;