import { 
  Card,
  CardHeader,
  CardContent,
  Button,
  TextField,
  Dialog,
  Grid
} from '@mui/material';

// import AccountCircle from 'material-ui/svg-icons/action/account-circle';

import ActivitiesTable from './ActivitiesTable';
import GoalsTable from '../goals/GoalsTable';
import MedicationsTable from '../medications/MedicationsTable';
import { PatientsTable } from '../../ui-tables';

import CarePlansTable from './CarePlansTable';

import React from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { browserHistory } from 'react-router';

import { get } from 'lodash';
import { DynamicSpacer } from '../../ui/DynamicSpacer';

//---------------------------------------------------------------


Session.setDefault('patientDialogOpen', false);
Session.setDefault('selectedPatient', false);
Session.setDefault('selectedPatientId', '');
Session.setDefault('selectedCarePlanId', '');

//---------------------------------------------------------------



export class CarePlanDesignerPage extends React.Component {
  constructor(props) {
    super(props);
  }
  getMeteorData() {

    

    // data.style = Glass.blur(data.style);
    // data.style.tab = Glass.darkroom(data.style.tab);

    return data;
  }
  changeInput(variable, event, value){
    console.log('changeInput', variable, event, value)
    Session.set(variable, value);
  }  
  handleOpenPatients(){
    console.log('handleOpenPatients.bind(this) ')
    Session.set('patientDialogOpen', true);
  }  
  handleClosePatients(){
    Session.set('patientDialogOpen', false);
  }  
  selectCarePlan(carePlanId){
    console.log('selectCarePlan', carePlanId)
    Session.set('selectedCarePlanId', carePlanId);
    // browserHistory.push(get(Meteor, 'settings.public.defaults.routes.carePlanDesignerNext', '/'))
  }
  render() {
    let style = {
      inactiveIndexCard: {
        opacity: .5,
        width: '50%',
        display: 'inline-block',
        paddingLeft: '20px',
        paddingRight: '20px'
      },
      indexCard: {
        cursor: 'pointer'
      },
      indexCardPadding: {
        width: '100%',
        display: 'inline-block',
        paddingLeft: '20px',
        paddingRight: '20px',
        position: 'relative'
      }
    };
    const patientActions = [
      <Button
        primary={true}
        onClick={handleClosePatients.bind(this)}
      >Clear</Button>,
      <Button
        primary={true}
        keyboardFocused={true}
        onClick={handleClosePatients.bind(this)}
      >Select</Button>
    ];

    let patientPicklist;

    if(!data.selectedPatient){
      patientPicklist = <section id="patientSection" style={style.indexCardPadding} >
      <Card>
        <CardHeader
          title="Patient Pick List"
        />
        <CardContent>

          <TextField
            hintText="Jane Doe"
            errorText="Patient Search"
            onChange={this.changeInput.bind(this, 'patientSearch')}
            value={data.patientDialog.patient.display}
            fullWidth>
              <Button
                label="Patients"
                id="patientSearchButton"
                className="patientsButton"
                primary={true}
                onClick={this.handleOpenPatients.bind(this) }
                // icon={ <AccountCircle /> }
                style={{float: 'right', cursor: 'pointer', zIndex: 200, width: '160px', textAlign: 'right'}}
              />
            </TextField>

          <Dialog
            title="Patient Search"
            actions={patientActions}
            modal={false}
            open={data.patientDialog.open}
            onRequestClose={this.handleClosePatients.bind(this)}
          >
            <CardContent style={{overflowY: "auto"}}>
            <TextField
              hintText="Jane Doe"
              errorText="Patient Search"
              onChange={this.changeInput.bind(this, 'description')}
              value={data.patientDialog.patient.display}
              fullWidth />
              <PatientsTable 
                hideToggle={true}
                hideActions={true}
                hideMaritalStatus={true}
                hideLanguage={true}
                onRowClick={function(patientId){
                  console.log('CarePlanDesigner.PatientsTable.onRowClick()')
                  Session.set('selectedPatientId', patientId);
                  Session.set('selectedPatient', Patients.findOne({id: patientId}));
                  Session.set('patientDialogOpen', false);
                }}
              />
            </CardContent>
          </Dialog>
        </CardContent>
      </Card>
      <DynamicSpacer />
    </section>
    }


    let goalsCard;
    if(get(Meteor, 'settings.public.modules.fhir.CarePlans.displayGoalsCard') !== false){
      goalsCard = <section id="goalsSelection" style={style.indexCardPadding} >
        <Card style={style.indexCard} >
          <CardHeader
            title='Goals'
            subtitle='Select the goals for the patient treatment.'
          />
          <CardContent>
            <GoalsTable 
              hideIdentifier={true} 
              onRemoveRecord={function(goalId){
                Goals._collection.remove({_id: goalId})
              }}  
            />
          </CardContent>
        </Card>
        <DynamicSpacer />          
      </section>
    }
    let medicationsCard;
    if(get(Meteor, 'settings.public.modules.fhir.CarePlans.displayMedicationsCard')){
      medicationsCard = <section id="medicationSection" style={style.indexCardPadding} >
        <Card style={style.indexCard} >
          <CardHeader
            title='Medications'
            subtitle='Select the medications the patient will receive.'
          />
          <CardContent>
            <MedicationsTable 
              hideIdentifier={true}  
              onRemoveRecord={function(medicationId){
                Medications._collection.remove({_id: medicationId})
              }}  
            />
          </CardContent>
        </Card>
        <DynamicSpacer />
      </section>
    }
    let activitesCard;
    if(get(Meteor, 'settings.public.modules.fhir.CarePlans.displayActivitiesCard') !== false){
      activitesCard = <section id="activitiesSection" style={style.indexCardPadding} >
        <Card style={style.indexCard} >
          <CardHeader
            title='Activities'
            subtitle='Select the activities the patient ought to engage in.'
          />
          <CardContent>
            <ActivitiesTable
              hideIdentifier={true} 
              onRemoveRecord={function(activityId){
                Activities._collection.remove({_id: activityId})
              }}  
            />
          </CardContent>
        </Card>
        <DynamicSpacer />
      </section>
    }
    let questionnairesCard;
    if(get(Meteor, 'settings.public.modules.fhir.CarePlans.displayQuestionnairesCard') !== false){
      // Questionnaires feature disabled - QuestionnaireTable component not available
    }

    return (
      <section id='carePlanDesignerPage' style={{paddingTop: "20px"}}>
        <div >
          <Grid container spacing={3}>
            <Grid item md={6}>  
              { patientPicklist } 
              { goalsCard }
              { medicationsCard }
              { activitesCard }            
              { questionnairesCard }
            </Grid>
            <Grid item md={6} style={{position: 'sticky', top: '0px'}}>  
              <CarePlansTable 
                onRowClick={selectCarePlan.bind(this) }
              />
            </Grid>
          </Grid>          
        </div>        
      </section>
    );
  }
  authorCarePlan(){
    console.log('Authoring a CarePlan...')
    //if(process.env.NODE_ENV === "test") console.log("authoring care plan...");

    var currentUser = new User(Meteor.user());

    let careplanData = {
      template: 'sample-template',
      subject: {
        display: Session.get('patientSearchFilter'),
        reference: Session.get('selectedPatientId')
      },
      author: {
        display: currentUser.fullName(),
        reference: Meteor.userId()
      },
      description: 'Basic Treatment Plan',
      medications: Session.get('selectedMedications'),
      goals: Session.get('selectedGoals'),
      deselectedActivities: Session.get('deselectedActivities')
    };

    if(process.env.NODE_ENV === "test") console.log("careplanData", careplanData);

    let newCarePlanId = CarePlans.insert(careplanData);
    // let newCarePlanId = authorCarePlan.call(careplanData);

    Patients.update({_id: Session.get('selectedPatientId')}, {$set: {
      'carePlanId': newCarePlanId
    }});

    Session.set('selectedMedications', []);
    // browserHistory.push('/careplan-history');
  }
}




export default CarePlanDesignerPage;