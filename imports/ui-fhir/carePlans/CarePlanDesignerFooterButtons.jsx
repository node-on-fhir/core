export class CarePlanDesignerFooterButtons extends React.Component {
    constructor(props) {
      super(props);
    }
    createCareplan(){
      console.log('Creating a careplan....');
      console.log('Selected patient', Session.get('selectedPatientId'));
  
      let patient = Patients.findOne(Session.get('selectedPatientId'));
      console.log('patient', patient);
  
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
  
      CarePlans._collection.insert(careplanData);
  
    }
    sendSms(){
      console.log('Sending SMS messages....');
  
      browserHistory.push('/communications');   
    }
    render() {
      return (
        <div>
          <FlatButton label='Create CarePlan' onClick={this.createCareplan} style={ Glass.darkroom({marginLeft: '20px'}) } ></FlatButton>
          <FlatButton label='Send SMS Messages' onClick={this.sendSms} style={ Glass.darkroom({marginLeft: '20px'}) } ></FlatButton>
        </div>
      );
    }
  }
  
  CarePlanDesignerFooterButtons.propTypes = {
    callback: PropTypes.func
  };
  