
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
  // import { TrafficOutlined } from '@mui/icons-material';
  
  import AcceptConsentForm from './AcceptConsentForm';

  Session.setDefault('masterAccessControlList', [])
  
  function AccessConsentPage(props){
  
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

    let headerHeight = 84;
    if(get(Meteor, 'settings.public.defaults.prominentHeader')){
      headerHeight = 148;
    }  

    let consentText = get(Meteor, 'settings.public.defaults.consents.textMessage', 'lorem ipsum...')
  
    return(
      <div id="AccessConsentPage" headerHeight={headerHeight} paddingLeft={20} paddingRight={20} >
          <Grid container spacing={3} justify="center" style={{ marginBottom: '84px'}}>
            <Grid item lg={6} >
              
              <Card>
                <AcceptConsentForm 
                  textMessage={consentText} 
                  patientId={selectedPatientId}
                  onSave={function(consentRecord){
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

                    console.log('AccessConsentPage.consentRecord', consentRecord);
                    

                    let accessControlRecord = FhirUtilities.consentIntoAccessControl(consentRecord);

                    let accessControlList = Session.get('masterAccessControlList');

                    if(Array.isArray(accessControlList)){
                      accessControlList.push(accessControlRecord);
                    }
                  
                    console.log('AccessConsentPage.accessControlList', accessControlList);

                    // alert(JSON.stringify(accessControlList))
                    Session.set('masterAccessControlList', accessControlList)


                    // await fetch(consentUrl, {
                    //   method: 'PUT',
                    //   // body: JSON.stringify(consentRecord),
                    //   headers: {
                    //     'Content-Type': 'application/json'
                    //   }
                    // }).then(response => response.json())
                    // .then(data => {
                    //   console.log("POST /QuestionnaireResponse", result);
                    // }).catch((error) => {
                    //   console.log("POST /QuestionnaireResponse", error);
                    // });

                    // if(get(Meteor, 'settings.private.accessControl.enableHipaaLogging')){
                    //   let newCareTeamEvent = { 
                    //     "resourceType" : "AuditEvent",
                    //     "type" : { 
                    //       'code': 'ConsentGranted',
                    //       'display': 'Consent Granted'
                    //       }, 
                    //     "action" : 'Consent Granted',
                    //     "recorded" : new Date(), 
                    //     "outcome" : "Success",
                    //     "outcomeDesc" : 'Patient granted consent.',
                    //     "agent" : [{ 
                  
                    //       "who": {
                  
                    //         "reference": "Patient/" + get(selectedPatient, 'id')
                    //       },
                    //       "requestor" : false
                    //     }],
                    //     "source" : { 
                    //       "site" : Meteor.absoluteUrl(),
                    //       "identifier": {
                    //         "value": Meteor.absoluteUrl()
                    //       }
                    //     },
                    //     "entity": [{
                    //       "reference": {
                    //         "reference": ''
                    //       }
                    //     }]
                    //   };

                    //   console.log('Logging a hipaa event...', newCareTeamEvent)
                    //   let hipaaEventId = HipaaLogger.logAuditEvent(newCareTeamEvent);
                    // }
                    
                  }}
                  style={{width: '100%'}}
                  />
              </Card>
            </Grid>
          </Grid>
          
      </div>
    );
}
  
  
  export default AccessConsentPage;
  
  