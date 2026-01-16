
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
  import { Consents } from '../imports/lib/schemas/SimpleSchemas/Consents';

  function ConsentEnginePage(props){
  
    let data = {
      currentUser: null,
      consents: [],
      selectedConsent: false
    }
    
    data.currentUser = useTracker(function(){
      return Session.get('currentUser');
    })
  
    data.consents = useTracker(function(){
      return Consents.find().fetch()
    })
    data.selectedConsent = useTracker(function(){
      return Consents.findOne();
    })
  
    return(
    <div id="ConsentEnginePage" paddingLeft={20} paddingRight={20} style={{marginTop: '148px', marginBottom: '84px'}}>
        <Grid container spacing={3}>
          <Grid item md={6}>
            <CardHeader title="Access Control List" />            
            <Card>
              <CardContent>                
                
                
              </CardContent>
            </Card>            

          </Grid>
          <Grid item md={6}>
            <CardHeader title="OAuth Scopes" />
            <Card>
              <CardContent>
                
              </CardContent>
            </Card>            
          </Grid>
        </Grid>
    </div>
    );
}
  
export default ConsentEnginePage;
  
  