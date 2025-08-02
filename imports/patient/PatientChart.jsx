import React from "react";
import Dashboard from "./Dashboard";
import AutoDashboard from "./AutoDashboard";
import PatientDemographics from "./PatientDemographics";

import { CardHeader, CardContent, Container } from '@mui/material';
import { useLocation, useParams, useHistory, useNavigate } from "react-router-dom";

import { oauth2 as SMART } from "fhirclient";
import { get } from 'lodash';

import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';

import { useTracker } from 'meteor/react-meteor-data';


import { LayoutHelpers } from '../lib/LayoutHelpers';

import NotSignedInWrapper from "../ui/NotSignedInWrapper";

export default function PatientChart(props) {
    let headerHeight = 64;
    if(get(Meteor, 'settings.public.defaults.prominentHeader')){
      headerHeight = 128;
    }

  
    let currentUser;
    currentUser = useTracker(function(){
      return Session.get('currentUser')
    }, [])


    let fhirServerEndpoint = 'http://localhost:3100/baseR4';
    if(Array.isArray(get(Meteor, 'settings.public.smartOnFhir'))){
      Meteor.settings.public.smartOnFhir.forEach(function(config){
          if(useLocation().search.includes(config.vendorKeyword) && (config.launchContext === "Provider")){
              fhirServerEndpoint = get(config, 'fhirServiceUrl') + get(window, '__PRELOADED_STATE__.url.query.code') + "/fhir/metadata"
          }
      })
    }    


    let searchParams = new URLSearchParams(useLocation().search);
    if(searchParams.get('iss')){
      console.log('PatientChart.iss', searchParams.get('iss'))
      fhirServerEndpoint = searchParams.get('iss');
    }
    if(searchParams.get('patientId')){            
      console.log('PatientChart.selectedPatientId', searchParams.get('patientId'))
      Session.set('selectedPatientId', searchParams.get('patientId'));  
    }

    // 
    if(searchParams.get('clientSecret')){            
      console.log('PatientChart.clientSecretOrBearerToken', searchParams.get('clientSecret'))
      Session.set('clientSecretOrBearerToken', searchParams.get('clientSecret'))  
    }

    let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

    let contentToRender = <div id='patientChart' >
      <AutoDashboard fhirServerEndpoint={fhirServerEndpoint} history={props.history} />
      {/* <NotSignedInWrapper notSignedInImagePath="" dataCount={currentUser}>
        <AutoDashboard fhirServerEndpoint={fhirServerEndpoint} history={props.history} />
      </NotSignedInWrapper> */}
    </div>    


    return (contentToRender);
}
