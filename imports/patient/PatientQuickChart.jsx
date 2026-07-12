import React from "react";
import FhirClientProvider from "../FhirClientProvider";
import AutoDashboard from "./AutoDashboard";
import PatientDemographics from "./PatientDemographics";

import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';

import { CardHeader, CardContent } from '@mui/material';
import { useLocation, useParams, useHistory, useNavigate } from "react-router-dom";

import { oauth2 as SMART } from "fhirclient";
import { get } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('PatientQuickChart') : console);

export default function PatientQuickChart(props) {
    logger.info('Rendering the PatientQuickChart');
    logger.verbose('app.patientPatientQuickChart');
    logger.data('PatientQuickChart.props', {data: props}, {source: "PatientQuickChart.jsx"});

    let headerHeight = 64;
    if(get(Meteor, 'settings.public.defaults.prominentHeader')){
      headerHeight = 128;
    }

    console.log('useLocation()', useLocation())

    let fhirServerEndpoint = 'http://localhost:3000/baseR4';
    if(Array.isArray(get(Meteor, 'settings.public.smartOnFhir'))){
      Meteor.settings.public.smartOnFhir.forEach(function(config){
          if(useLocation().search.includes(config.vendorKeyword) && (config.launchContext === "Provider")){
              fhirServerEndpoint = get(config, 'fhirServiceUrl') + get(window, '__PRELOADED_STATE__.url.query.code');
          }
      })
    }

    let searchParams = new URLSearchParams(useLocation().search);
    console.log('searchParams', searchParams);

    if(searchParams.get('iss')){
      log.debug('PatientQuickChart.iss', { iss: searchParams.get('iss') })
      fhirServerEndpoint = searchParams.get('iss')
    } else if (Session.get('smartOnFhir_iss')){
      fhirServerEndpoint = Session.get('smartOnFhir_iss')
    } 



    logger.debug('PatientQuickChart.searchParams', {data: searchParams}, {source: "PatientQuickChart.jsx"});
    logger.debug('PatientQuickChart.props', {data: props}, {source: "PatientQuickChart.jsx"});
    logger.debug('PatientQuickChart.fhirServerEndpoint', {data: fhirServerEndpoint}, {source: "PatientQuickChart.jsx"});

    // let contentToRender = <FhirClientProvider location={get(props, 'history.location')}>
    let contentToRender;
    if(fhirServerEndpoint){
      contentToRender = <FhirClientProvider location={get(props, 'history.location')}>
        <div id='patientQuickChart' headerHeight={headerHeight} paddingLeft={20} paddingRight={20} >
          <AutoDashboard fhirServerEndpoint={fhirServerEndpoint} />
        </div>
      </FhirClientProvider>
    } else {
      contentToRender = <div id='patientQuickChart' headerHeight={headerHeight} paddingLeft={20} paddingRight={20} >
          <AutoDashboard fhirServerEndpoint={fhirServerEndpoint} />
        </div>
    }
    
    return (contentToRender);
}
