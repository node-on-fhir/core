
import { 
    Grid,
    Card,
    Button,
    CardHeader,
    CardContent,
    CardActions
  } from '@mui/material';

  
  import { Meteor } from 'meteor/meteor';
  import { Session } from 'meteor/session';
  
  import React, {Component} from 'react'
  import { get, has, sortBy } from 'lodash';
  
  import { useTracker } from 'meteor/react-meteor-data';
  
  import moment from 'moment';
  
  
  import { FhirUtilities } from '../lib/FhirUtilities';
  import { ConsentForm } from './ConsentForm';
  
  
  function ConsentBuilderPage(props){
  

    let consents = useTracker(function(){
      return Consents.find().fetch()
    })
  
    let currentUser = useTracker(function(){
      return Session.get('currentUser')
    })
    let selectedPatient = useTracker(function(){
      return Session.get('selectedPatient')
    })
    let selectedPatientId = useTracker(function(){
      return Session.get('selectedPatientId')
    })


    let consentText = get(Meteor, 'settings.public.defaults.consents.textMessage', 'lorem ipsum...')
  
  
    return(
    <div id="ConsentBuilderPage" paddingLeft={20} paddingRight={20} style={{marginTop: '148px', marginBottom: '84px'}}>
        <CardHeader title="Consent Builder" />
        <Grid container>
          <Grid item md={6}>
            <ConsentForm 
              hidePeriodStart={true}
              hidePeriodEnd={true}
              hideOrganization={true}            
              textMessage={consentText} 
              patientId={selectedPatientId}
              onSave={function(consent){
                console.log('ConsentDialog.onSave()', consent);
                Meteor.call('saveConsent', consent, function(error, result){
                    if(error){ console.error('error', error)}
                    if(result){ 
                      console.log('result', result)
                    }
                    Session.set('mainAppDialogOpen', false)
                })
                if(get(Meteor, 'settings.private.accessControl.enableHipaaLogging')){
                  let newCareTeamEvent = { 
                    "resourceType" : "AuditEvent",
                    "type" : { 
                      'code': 'ConsentGranted',
                      'display': 'Consent Granted'
                      }, 
                    "action" : 'Consent Granted',
                    "recorded" : new Date(), 
                    "outcome" : "Success",
                    "outcomeDesc" : 'Patient granted consent.',
                    "agent" : [{ 
                      "name" : FhirUtilities.pluckName(selectedPatient),
                      "who": {
                        "display": FhirUtilities.pluckName(selectedPatient),
                        "reference": "Patient/" + get(selectedPatient, 'id')
                      },
                      "requestor" : false
                    }],
                    "source" : { 
                      "site" : Meteor.absoluteUrl(),
                      "identifier": {
                        "value": Meteor.absoluteUrl()
                      }
                    },
                    "entity": [{
                      "reference": {
                        "reference": ''
                      }
                    }]
                  };

                  console.log('Logging a hipaa event...', newCareTeamEvent)
                  let hipaaEventId = HipaaLogger.logAuditEvent(newCareTeamEvent);
                }
                
              }}
              style={{width: '100%'}}
              />
          </Grid>
        </Grid>
        
    </div>
    );
}
  
  
  export default ConsentBuilderPage;
  
  