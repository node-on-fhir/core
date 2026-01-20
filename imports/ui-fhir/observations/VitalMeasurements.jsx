import React from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Grid,
  Card,
  Button,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  TextField,
  DatePicker,
  Tabs,
  Tab,
  Box
} from '@mui/material';

import { Meteor } from 'meteor/meteor';

import { browserHistory } from 'react-router';
import { get } from 'lodash';

import { Icon } from 'react-icons-kit'
import {stethoscope} from 'react-icons-kit/fa/stethoscope'
import {heart} from 'react-icons-kit/fa/heart'
import {thermometer} from 'react-icons-kit/fa/thermometer'
import {pulse} from 'react-icons-kit/iconic/pulse'




//=============================================================================================================================================
// TABS

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      <Box p={3}>{children}</Box>
    </Typography>
  );
}

//=============================================================================================================================================
// COMPONENT


Session.setDefault('healthLogTabIndex', 0);
Session.setDefault('vitalsForm', {
  pulse: '',
  temperature: '',
  respiration: '',
  bloodPressure: '',
  notes: ''
});
export class VitalMeasurements extends React.Component {
  getMeteorData() {
    let data = {
      style: {
        opacity: Session.get('globalOpacity'),
        tab: {
          borderBottom: '1px solid lightgray',
          borderRight: '1px solid white',
          borderTop: '1px solid white',
          borderLeft: '1px solid white'
        }
      },
      tabIndex: Session.get('healthLogTabIndex'),
      state: {
        pulse: '',
        temperature: '',
        respiration: '',
        bloodPressure: '',
        notes: ''
      }
    };

    if (Session.get('vitalsForm')) {
      data.state = Session.get('vitalsForm');
    }

    // data.style = Glass.blur(data.style);
    // data.style.tab = Glass.darkroom(data.style.tab);

    return data;
  }
  handleTabChange(index){
    Session.set('healthLogTabIndex', index);
  }
  onActive(){

  }
  onNewTab(){

  }
  render(){
      var spoonCounter;

      if(get(Meteor, 'settings.public.vitals.showSpoonCounter')){
          spoonCounter = <TextField
            id='temperatureInput'
            ref='temperature'
            name='temperature'
            floatingLabelText="Spoons"
            floatingLabelFixed={true}
            onChange={this.changePost.bind(this, 'temperature')}
            fullWidth
            >
            {/* <div style={{paddingTop: '25px'}}>
                <FontAwesome name="spoon" style={{fontSize: '150%', marginRight: '10px'}} />
                <FontAwesome name="spoon" style={{fontSize: '150%', marginRight: '10px'}} />
                <FontAwesome name="spoon" style={{fontSize: '150%', marginRight: '10px'}} />
                <FontAwesome name="spoon" style={{fontSize: '150%', marginRight: '10px'}} />
                <FontAwesome name="spoon" style={{fontSize: '150%', marginRight: '10px'}} />
                <FontAwesome name="spoon" style={{fontSize: '150%', marginRight: '10px'}} />
                <FontAwesome name="spoon" style={{fontSize: '150%', marginRight: '10px'}} />
                <FontAwesome name="spoon" style={{fontSize: '150%', marginRight: '10px'}} />
                <FontAwesome name="spoon" style={{fontSize: '150%', marginRight: '10px'}} />
                <FontAwesome name="spoon" style={{fontSize: '150%', marginRight: '10px'}} />
                <FontAwesome name="spoon" style={{fontSize: '150%', marginRight: '10px', color: 'lightgray'}} />
                <FontAwesome name="spoon" style={{fontSize: '150%', marginRight: '10px', color: 'lightgray'}} />
            </div> */}
        </TextField>
      }
    return (
      <Card id="addPostCard">
        <CardContent>
          <Tabs id="observationsPageTabs" value={this.data.tabIndex} onChange={this.handleTabChange } aria-label="simple tabs example">
            <Tab label="Vitals" value={0} />
            <Tab label="Notes" value={1} />
            <Tab label="Biomarkers" value={1} />
            <Tab label="Medications" value={1} />
          </Tabs>
          <TabPanel >
            <Icon icon={pulse} style={{position: 'absolute', top: '40px' }} />
            <TextField
              id='puleInput'
              ref='pulse'
              name='pulse'
              floatingLabelText="Pulse"
              value={this.data.state.pulse}
              hintText='60'
              onChange={this.changePost.bind(this, 'pulse')}
              floatingLabelStyle={{marginLeft: '20px'}}
              inputStyle={{marginLeft: '20px'}}
              hintStyle={{marginLeft: '20px'}}
              fullWidth
              /><br/>
            <Icon icon={thermometer} style={{position: 'absolute', top: '40px' }} />
            <TextField
              id='temperatureInput'
              name='temperature'
              floatingLabelText="Temperature"
              hintText='98.6'
              value={this.data.state.temperature}
              onChange={this.changePost.bind(this, 'temperature')}
              floatingLabelStyle={{marginLeft: '20px'}}
              inputStyle={{marginLeft: '20px'}}
              hintStyle={{marginLeft: '20px'}}
              fullWidth
              /><br/>
            <Icon icon={pulse} style={{position: 'absolute', top: '40px' }} />
            <TextField
              id='respirationRate'
              name='respiration'
              hintText='15'
              floatingLabelText="Respiration"
              value={this.data.state.respiration}
              onChange={this.changePost.bind(this, 'respiration')}
              floatingLabelStyle={{marginLeft: '20px'}}
              inputStyle={{marginLeft: '20px'}}
              hintStyle={{marginLeft: '20px'}}
              fullWidth
              /><br/>
            <Icon icon={heart} style={{position: 'absolute', top: '40px' }} />
            <TextField
              id='bloodPressureInput'
              name='bloodPressure'
              floatingLabelText="Blood Pressure"
              hintText='120 / 80'
              value={this.data.state.bloodPressure}
              onChange={this.changePost.bind(this, 'bloodPressure')}
              floatingLabelStyle={{marginLeft: '20px'}}
              inputStyle={{marginLeft: '20px'}}
              hintStyle={{marginLeft: '20px'}}
              fullWidth
              /><br/>
          </TabPanel >
          <TabPanel >
            <TextField
              id='notesInput'
              ref='notesContent'
              name='notesContent'
              floatingLabelText="New clinical impression..."
              value={this.data.state.notes}
              onChange={this.changePost.bind(this, 'notes')}
              multiLine={true}
              rows={4}
              floatingLabelFixed={true}
              fullWidth
              /><br/>
          </TabPanel >
          <TabPanel >

          </TabPanel >
          <TabPanel >

          </TabPanel >          



        </CardContent>
        <Button id="addObservationButton" onMouseUp={ this.handleInsertObservations.bind(this) } primary={true} >New Observation</Button>
      </Card>
    );
  }
  handleInsertObservations(){

    console.log('handleInsertObservations', this.data.state)

    let defaultObservation = {
      meta: {
        lastUpdated: new Date()
      },
      status: 'preliminary',
      category: {
        text: ''
      },
      effectiveDateTime: new Date(),
      subject: {
        display: Meteor.user().fullName(),
        reference: Meteor.userId()
      },
      performer: [{
        display: Meteor.user().fullName(),
        reference: Meteor.userId()
      }],
      device: {
        display: 'Web App',
        reference: 'WebApp'
      },
      valueQuantity: {
        value: '',
        unit: '',
        system: 'http://unitsofmeasure.org'
      },
      valueString: ''
    };



    //---------------------------------------------------------------
    // PULSE

    var pulseObservation = defaultObservation;
    pulseObservation.category = {
      text: 'Pulse'
    };
    pulseObservation.valueQuantity.unit = 'bmp';
    pulseObservation.valueQuantity.value = this.data.state.pulse;
    
    if(process.env.NODE_ENV === "test"){
      console.log('pulseObservation', pulseObservation)
    }
    Observations._collection.insert(pulseObservation, function(error, result){
      if (error) {
        if(process.env.NODE_ENV === "test") console.log("Observations.insert[error]", error);
        // Bert.alert(error.reason, 'danger');
      }
      if (result) {
        //HipaaLogger.logEvent({eventType: "create", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Observations", recordId: result});
        // Bert.alert('Observation added!', 'success');
      }
    });

    //---------------------------------------------------------------
    // RESPIRATION

    var respirationObservation = defaultObservation;
    respirationObservation.category = {
      text: 'Respiration'
    };
    respirationObservation.valueQuantity.unit = 'bmp';
    respirationObservation.valueQuantity.value = this.data.state.respiration;
    
      if(process.env.NODE_ENV === "test"){
        console.log('respirationObservation', respirationObservation)
      }
      Observations._collection.insert(respirationObservation, function(error, result){
      if (error) {
        if(process.env.NODE_ENV === "test") console.log("Observations.insert[error]", error);
        // Bert.alert(error.reason, 'danger');
      }
      if (result) {
        //HipaaLogger.logEvent({eventType: "create", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Observations", recordId: result});
        // Bert.alert('Observation added!', 'success');
      }
    });    


    //---------------------------------------------------------------
    // RESPIRATION

    var temperatureObservation = defaultObservation;
    temperatureObservation.category = {
      text: 'Temperature'
    };
    temperatureObservation.valueQuantity.unit = 'F';
    temperatureObservation.valueQuantity.value = this.data.state.temperature;
    
    if(process.env.NODE_ENV === "test"){
        console.log('temperatureObservation', temperatureObservation)
    }

    Observations._collection.insert(temperatureObservation, function(error, result){
      if (error) {
        if(process.env.NODE_ENV === "test") console.log("Observations.insert[error]", error);
        // Bert.alert(error.reason, 'danger');
      }
      if (result) {
        //HipaaLogger.logEvent({eventType: "create", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Observations", recordId: result});
        // Bert.alert('Observation added!', 'success');
      }
    }); 


    //---------------------------------------------------------------
    // BLOOD PRESSURE

    var bloodPressureObservation = defaultObservation;

    bloodPressureObservation.category = {
      text: 'Blood Pressure'
    };
    bloodPressureObservation.valueString = this.data.state.bloodPressure + ' mmHg';    
    temperatureObservation.valueQuantity = null;
    
    if(process.env.NODE_ENV === "test"){
        console.log('bloodPressureObservation', bloodPressureObservation)
    }

    Observations._collection.insert(bloodPressureObservation, function(error, result){
      if (error) {
        if(process.env.NODE_ENV === "test") console.log("Observations.insert[error]", error);
        // Bert.alert(error.reason, 'danger');
      }
      if (result) {
        //HipaaLogger.logEvent({eventType: "create", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Observations", recordId: result});
        // Bert.alert('Observation added!', 'success');
      }
    });

    browserHistory.push('/observations');
  }




  changePost(field, event, value){
    var vitalsForm = Session.get('vitalsForm');
    vitalsForm[field] = value;
    Session.set('vitalsForm', vitalsForm);
  }
}



export default VitalMeasurements;