
import { 
    Grid,
    Card,
    Button,
    CardHeader,
    CardContent,
    CardActions
  } from '@mui/material';

  
  import { Meteor } from 'meteor/meteor';
  import { Random } from 'meteor/random';
  import { Session } from 'meteor/session';
  
  import React, {Component} from 'react'
  import { get, has, sortBy } from 'lodash';
  
  import { useTracker } from 'meteor/react-meteor-data';
  
  import moment from 'moment';
  
  
  import { FhirUtilities } from '../lib/FhirUtilities';
  import { ConsentForm } from './ConsentForm';
  import { TrafficOutlined } from '@mui/icons-material';
  
  import { fetch, Headers } from 'meteor/fetch';
  
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
    <div id="ConsentBuilderPage" paddingLeft={20} paddingRight={20} style={{marginTop: '64px', marginBottom: '84px'}}>
        <Grid container justify="center">
          <Grid item md={6}>
            <CardHeader title="Basic Consent (HIPAA)" />
            <Card>
              <ConsentForm 
                textMessage={consentText} 
                patientId={selectedPatientId}
                onSave={async function(consentRecord){
                  console.log('ConsentDialog.onSave()', consentRecord);
                  // Meteor.call('saveConsent', consentRecord, function(error, result){
                  //     if(error){ console.error('error', error)}
                  //     if(result){ 
                  //       console.log('result', result)
                  //     }
                  //     Session.set('mainAppDialogOpen', false)
                  // })

                  if(!consentRecord.id){
                    consentRecord.id = Random.id()
                  }

                  let consentUrl = "";
                  if(get(Meteor, 'settings.public.interfaces.relay.channel.endpoint')){
                    consentUrl = get(Meteor, 'settings.public.interfaces.relay.channel.endpoint');
                  } else {
                    consentUrl = Meteor.absoluteUrl() +  'baseR4/Consent/' + consentRecord.id;
                  }
              


                  await fetch(consentUrl, {
                    method: 'PUT',
                    body: JSON.stringify(consentRecord),
                    headers: {
                      'Content-Type': 'application/json'
                    }
                  }).then(response => response.json())
                  .then(data => {
                    console.log("POST /QuestionnaireResponse", result);
                  }).catch((error) => {
                    console.error('Error:', error);
                  });


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
            </Card>
          </Grid>
        </Grid>
        
    </div>
    );
}
  
  
  export default ConsentBuilderPage;
  
  