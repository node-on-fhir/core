import { 
  Grid, 
  Container,
  Divider,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Button,
  Tab, 
  Tabs,
  Typography,
  TextField,
  DatePicker,
  Box
} from '@mui/material';

import React from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get, set } from 'lodash';

import ConditionsTable from '../conditions/ConditionsTable';
import GoalsTable from '../goals/GoalsTable';
import MedicationsTable from '../medications/MedicationsTable';

// Collections will be initialized on Meteor.startup
let CarePlans;
let HipaaLogger;

let defaultCarePlan = {
  "resourceType": "CarePlan",
  "patient": {
    "reference": "",
    "display": ""
  },
  "asserter": {
    "reference": "",
    "display": ""
  },
  "dateRecorded": "",
  "code": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "",
        "display": ""
      }
    ]
  },
  "clinicalStatus": "",
  "verificationStatus": "confirmed",
  "severity": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "",
        "display": ""
      }
    ]
  },
  "onsetDateTime": "",
  "evidence": [
    {
      "detail": [
        {
          "reference": "",
          "display": ""
        }
      ]
    }
  ]
};



//---------------------------------------------------------------

Session.setDefault('carePlanUpsert', false);
Session.setDefault('selectedCarePlan', false);

//---------------------------------------------------------------

Meteor.startup(function(){
  CarePlans = Meteor.Collections.CarePlans;
  HipaaLogger = Meteor.HipaaLogger;
});

//---------------------------------------------------------------


export class CarePlanDetail extends React.Component {
  getMeteorData() {
    let data = {
      carePlanId: false,
      carePlan: defaultCarePlan
    };

    if (Session.get('carePlanUpsert')) {
      data.carePlan = Session.get('carePlanUpsert');
    } else {
      if (Session.get('selectedCarePlan')) {
        data.carePlanId = Session.get('selectedCarePlan');
        console.log("selectedCarePlan", Session.get('selectedCarePlan'));

        let selectedCarePlan = CarePlans.findOne({_id: Session.get('selectedCarePlan')});
        console.log("selectedCarePlan", selectedCarePlan);

        if (selectedCarePlan) {
          data.carePlan = selectedCarePlan;
        }
      } else {
        data.carePlan = defaultCarePlan;
      }

    }

    console.log('CarePlanDetail.data', data)
    return data;
  }

  render() {
    const data = this.getMeteorData();
    
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card sx={{ boxShadow: 3 }}>
          <CardHeader 
            title={data.carePlanId ? 'Edit Care Plan' : 'New Care Plan'}
            sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
          />
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Addresses</Typography>
            {/* <ConditionsTable /> */}
            <Typography color="text.secondary">Conditions table will be displayed here</Typography>
            <Box sx={{ mb: 4 }} />

            <Typography variant="h6" sx={{ mb: 2 }}>Goals</Typography>
            {/* <GoalsTable /> */}
            <Typography color="text.secondary">Goals table will be displayed here</Typography>
            <Box sx={{ mb: 4 }} />

            <Typography variant="h6" sx={{ mb: 2 }}>Medications</Typography>
            {/* <MedicationsTable /> */}
            <Typography color="text.secondary">Medications table will be displayed here</Typography>
            <Box sx={{ mb: 4 }} />
          </CardContent>

          <CardActions>
            { this.determineButtons(data.carePlanId) }
          </CardActions>
        </Card>
      </Container>
    );
  }


  determineButtons(carePlanId){
    if (carePlanId) {
      return (
        <div>
          <Button id="saveCarePlanButton" variant="contained" color="primary" onClick={this.handleSaveButton.bind(this)} sx={{mr: 2}}>Save</Button>
          <Button id="deleteCarePlanButton" variant="outlined" onClick={this.handleDeleteButton.bind(this)}>Delete</Button>
        </div>
      );
    } else {
      return(
        <Button id="saveCarePlanButton" variant="contained" color="primary" onClick={this.handleSaveButton.bind(this)}>Save</Button>
      );
    }
  }



  // this could be a mixin
  changeState(field, event, value){
    let carePlanUpdate;

    if(process.env.NODE_ENV === "test") console.log("CarePlanDetail.changeState", field, event, value);

    // by default, assume there's no other data and we're creating a new carePlan
    if (Session.get('carePlanUpsert')) {
      carePlanUpdate = Session.get('carePlanUpsert');
    } else {
      carePlanUpdate = defaultCarePlan;
    }



    // if there's an existing carePlan, use them
    if (Session.get('selectedCarePlan')) {
      const data = this.getMeteorData();
      carePlanUpdate = data.carePlan;
    }

    switch (field) {
      case "patientDisplay":
        carePlanUpdate.patient.display = value;
        break;
      case "asserterDisplay":
        carePlanUpdate.asserter.display = value;
        break;
      case "clinicalStatus":
        carePlanUpdate.clinicalStatus = value;
        break;
      case "snomedCode":
        carePlanUpdate.code.coding[0].code = value;
        break;
      case "snomedDisplay":
        carePlanUpdate.code.coding[0].display = value;
        break;
      case "evidenceDisplay":
        carePlanUpdate.evidence[0].detail[0].display = value;
        break;
      default:

    }

    if(process.env.NODE_ENV === "test") console.log("carePlanUpdate", carePlanUpdate);
    Session.set('carePlanUpsert', carePlanUpdate);
  }

  handleSaveButton(){
    let carePlanUpdate = Session.get('carePlanUpsert', carePlanUpdate);

    if(process.env.NODE_ENV === "test") console.log("carePlanUpdate", carePlanUpdate);


    if (Session.get('selectedCarePlan')) {
      if(process.env.NODE_ENV === "test") console.log("Updating carePlan...");
      delete carePlanUpdate._id;

      // not sure why we're having to respecify this; fix for a bug elsewhere
      carePlanUpdate.resourceType = 'CarePlan';

      CarePlans._collection.update(
        {_id: Session.get('selectedCarePlan')}, {$set: carePlanUpdate }, function(error, result) {
          if (error) {
            console.log("error", error);

            // Bert.alert(error.reason, 'danger');
          }
          if (result) {
            HipaaLogger.logEvent({eventType: "update", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "CarePlans", recordId: Session.get('selectedCarePlan')});
            Session.set('carePlanPageTabIndex', 1);
            Session.set('selectedCarePlan', false);
            Session.set('carePlanUpsert', false);
            // Bert.alert('CarePlan updated!', 'success');
          }
        });
    } else {

      if(process.env.NODE_ENV === "test") console.log("create a new carePlan", carePlanUpdate);

      CarePlans._collection.insert(carePlanUpdate, function(error, result) {
        if (error) {
          console.log("error", error);
          // Bert.alert(error.reason, 'danger');
        }
        if (result) {
          HipaaLogger.logEvent({eventType: "create", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "CarePlans", recordId: result});
          Session.set('carePlanPageTabIndex', 1);
          Session.set('selectedCarePlan', false);
          Session.set('carePlanUpsert', false);
          // Bert.alert('CarePlan added!', 'success');
        }
      });
    }
  }

  handleCancelButton(){
    Session.set('carePlanPageTabIndex', 1);
  }

  handleDeleteButton(){
    CarePlans._collection.remove({_id: Session.get('selectedCarePlan')}, function(error, result){
      if (error) {
        // Bert.alert(error.reason, 'danger');
      }
      if (result) {
        HipaaLogger.logEvent({eventType: "delete", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "CarePlans", recordId: Session.get('selectedCarePlan')});
        Session.set('carePlanPageTabIndex', 1);
        Session.set('selectedCarePlan', false);
        Session.set('carePlanUpsert', false);
        // Bert.alert('CarePlan removed!', 'success');
      }
    });
  }
}


CarePlanDetail.propTypes = {
  hasUser: PropTypes.object
};

export default CarePlanDetail;