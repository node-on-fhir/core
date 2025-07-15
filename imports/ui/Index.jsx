import React from 'react';
import { useFind, useSubscribe } from 'meteor/react-meteor-data';
import { LinksCollection } from '../collections/LinksCollection';

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { useNavigate } from "react-router-dom";
import { get } from 'lodash';


import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';

export const Index = () => {

  const navigate = useNavigate();

  // const isLoading = useSubscribe('links');
  // const links = useFind(() => LinksCollection.find());

  let links = [
    {
      url: "/",
      title: "Root"
    }, {
      url: "/index",
      title: "Index"
    }, {
      url: "/static-files",
      title: "Static File Loader"
    }, {
      url: "/smart-launcher",
      title: "SMART Launcher"
    }, {
      url: "/smart-launcher-debugger",
      title: "SMART Launcher Debugger"
    }, {
      url: "/smart-sample-app",
      title: "TEFCA Network"
    }, {
      url: "/smart-app-debugger",
      title: "SMART App Debugger"
    }, {
      url: "/cds-hooks-debugger",
      title: "CDS Hooks Debugger"
    }, {
    //   url: "/patient-quickchart",
    //   title: "Patient Quickstart"
    // }, {
      url: "/server-configuration",
      title: "Server Configuration"
    }, {
      url: "/udap-registration",
      title: "UDAP Registration"
    }, {
      url: "/oauth-clients",
      title: "OAuth Clients"
    }, {
      url: "/patient-chart",
      title: "Patient Chart"
    }
  ]
  

  let fhirMicroserviceLinks = []

  let securityModuleLinks = [];

  let coreModuleLinks = []

  if(get(Meteor, 'settings.public.modules.PatientsDirectory')){
    links.push({
      url: "/patient-directory",
      title: "Patients Directory"
    })
  }
  if(get(Meteor, 'settings.public.modules.Theming')){
    links.push({
      url: "/theming",
      title: "Theming"
    })
  }


  if(get(Meteor, 'settings.public.modules.fhir.AllergyIntolerances')){
    fhirMicroserviceLinks.push({
      url: "/allergy-intolerances",
      title: "Allergies"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.ArtifactAssessments')){
    fhirMicroserviceLinks.push({
      url: "/artifact-assessments",
      title: "Artifact Assessments"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.ActivityDefinitions')){
    fhirMicroserviceLinks.push({
      url: "/activity-definitions",
      title: "Activity Definitions"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Bundles')){
    fhirMicroserviceLinks.push({
      url: "/bundles",
      title: "Bundles"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.CarePlans')){
    fhirMicroserviceLinks.push({
      url: "/care-plans",
      title: "Care Plans"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.CareTeams')){
    fhirMicroserviceLinks.push({
      url: "/care-teams",
      title: "Care Teams"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.CodeSystems')){
    fhirMicroserviceLinks.push({
      url: "/code-systems",
      title: "Code Systems"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Compositions')){
    fhirMicroserviceLinks.push({
      url: "/compositions",
      title: "Compositions"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Communications')){
    fhirMicroserviceLinks.push({
      url: "/communications",
      title: "Communications"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Conditions')){
    fhirMicroserviceLinks.push({
      url: "/conditions",
      title: "Conditions"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Claims')){
    fhirMicroserviceLinks.push({
      url: "/claims",
      title: "Claims"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Devices')){
    fhirMicroserviceLinks.push({
      url: "/devices",
      title: "Devices"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.DiagnosticReports')){
    fhirMicroserviceLinks.push({
      url: "/diagnostic-reports",
      title: "Diagnostic Reports"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.DocumentReferences')){
    fhirMicroserviceLinks.push({
      url: "/document-references",
      title: "Document References"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Encounters')){
    fhirMicroserviceLinks.push({
      url: "/encounters",
      title: "Encounters"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Evidences')){
    fhirMicroserviceLinks.push({
      url: "/evidences",
      title: "Evidences"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.ExplanationOfBenefits')){
    fhirMicroserviceLinks.push({
      url: "/explanation-of-benefits",
      title: "Explanation Of Benefits"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Goals')){
    fhirMicroserviceLinks.push({
      url: "/goals",
      title: "Goals"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.GuidanceResponses')){
    fhirMicroserviceLinks.push({
      url: "/guidance-responses",
      title: "Guidance Responses"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Immunizations')){
    fhirMicroserviceLinks.push({
      url: "/immunizations",
      title: "Immunizations"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Libraries')){
    fhirMicroserviceLinks.push({
      url: "/libraries",
      title: "Libraries"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Measures')){
    fhirMicroserviceLinks.push({
      url: "/measures",
      title: "Measures"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.MeasureReports')){
    fhirMicroserviceLinks.push({
      url: "/measure-reports",
      title: "Measure Reports"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Medications')){
    fhirMicroserviceLinks.push({
      url: "/medications",
      title: "Medications"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.MedicationStatements')){
    fhirMicroserviceLinks.push({
      url: "/medication-statements",
      title: "MedicationStatements"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.NutritionOrders')){
    fhirMicroserviceLinks.push({
      url: "/nutrition-orders",
      title: "Nutrition Orders"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Observations')){
    fhirMicroserviceLinks.push({
      url: "/observations",
      title: "Observations"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.OperationOutcomes')){
    fhirMicroserviceLinks.push({
      url: "/operation-outcomes",
      title: "OperationOutcomes"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.PlanDefinitions')){
    fhirMicroserviceLinks.push({
      url: "/plan-definitions",
      title: "Plan Definitions"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Procedures')){
    fhirMicroserviceLinks.push({
      url: "/procedures",
      title: "Procedures"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Questionnaires')){
    fhirMicroserviceLinks.push({
      url: "/questionnaires",
      title: "Questionnaires"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.QuestionnaireResponses')){
    fhirMicroserviceLinks.push({
      url: "/questionnaire-responses",
      title: "Questionnaire Responses"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.ResearchStudies')){
    fhirMicroserviceLinks.push({
      url: "/research-studies",
      title: "Research Studies"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.ResearchSubjects')){
    fhirMicroserviceLinks.push({
      url: "/research-subjects",
      title: "Research Subjects"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.ServiceRequests')){
    fhirMicroserviceLinks.push({
      url: "/service-requests",
      title: "Service Requests"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Tasks')){
    fhirMicroserviceLinks.push({
      url: "/tasks",
      title: "Tasks"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.ValueSets')){
    fhirMicroserviceLinks.push({
      url: "/value-sets",
      title: "Value Sets"
    })
  }
  

  
  let dynamicRoutes = [];
  Object.keys(Package).forEach(function(packageName){
    if(Package[packageName].DynamicRoutes){
      // we try to build up a route from what's specified in the package
      Package[packageName].DynamicRoutes.forEach(function(route){
        dynamicRoutes.push(route);      
      });    
    }
  });

  // if(isLoading()) {
  //   return <div>Loading...</div>;
  // }

  // function fetchSampleTefcaSslCertificate() {
  //   Meteor.call("fetchCertificate", "http://certs.emrdirect.com/certs/EMRDirectTestClientSubCA.crt", function(err, res){
  //     if(err){
  //       console.error(err);
  //     }
  //     if(res){
  //       console.log(res);
  //     }
  //   })
  // };

  let dynamicModuleElements = [];
  if(dynamicRoutes.length > 0){
    dynamicModuleElements.push(<hr key="dynamicModulesSeparator" style={{marginBottom: '0px'}}/>);
    dynamicModuleElements.push(<h3 key="dynamicModulesTitle" style={{marginTop: '0px', paddingTop: '0px'}}>Dynamic Modules</h3>)
    dynamicModuleElements.push(<ul key="dynamicModulesList">{dynamicRoutes.map(
      link => <li key={link.name} onClick={navigate.bind(this, link.path)}  style={{cursor: 'pointer'}}>
        <a >{link.name}</a>
      </li>
    )}</ul>)
  }

  let fhirMicroserviceElements = [];
  if(dynamicRoutes.length > 0){
    fhirMicroserviceElements.push(<hr key="fhirMicroserviceSeparator" style={{marginBottom: '0px'}}/>);
    fhirMicroserviceElements.push(<h3 key="fhirMicroserviceTitle" style={{marginTop: '0px', paddingTop: '0px'}}>FHIR Modules</h3>)
    fhirMicroserviceElements.push(<ul key="fhirMicroserviceList">{fhirMicroserviceLinks.map(
      link => <li key={link.title} onClick={navigate.bind(this, link.url)}  style={{cursor: 'pointer'}}>
        <a >{link.title}</a>
      </li>
    )}</ul>)
  }

  let coreElements = <div>
    <hr key="coreElementsSeparator" style={{marginBottom: '0px'}}/>
    <h3 key="coreElementsTitle" style={{marginTop: '0px', paddingTop: '0px'}}>Index</h3>
    <ul key="coreElementsList" >{links.map(
      link => <li key={link.title} onClick={navigate.bind(this, link.url)}  style={{cursor: 'pointer'}}>
        <a >{link.title}</a>
      </li>
    )}</ul>  
  </div>;


  return (
    <div style={{height: window.innerHeight, overflow: 'scroll', paddingBottom: '100px'}}>
      <CardContent>
        <Grid container>
          <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
            { coreElements }
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
            {fhirMicroserviceElements}
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
            {dynamicModuleElements}
          </Grid>
        </Grid>
        

      </CardContent>
    </div>
  );
};
