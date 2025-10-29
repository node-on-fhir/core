import React, { createContext, useContext, useState, useLayoutEffect, useEffect, useMemo } from 'react';
import { Hello } from './Hello.jsx';

import { get } from 'lodash';

import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';

import { Helmet } from "react-helmet";

import {
  createBrowserRouter,
  RouterProvider,
  useNavigate,
  BrowserRouter as Router, 
  Routes, 
  Route,
  Outlet
} from "react-router-dom";

import { useTracker } from 'meteor/react-meteor-data';
import { Container, Box } from '@mui/material';

// import NotFound from './NotFound.jsx';
// import AppCanvas from './AppCanvas.jsx';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import SideDrawer from './SideDrawer';
// import SettingsPage from './SettingsPage';
// import ContextSlideOut from './ContextSlideOut';


import GettingStartedPage from './GettingStartedPage.jsx';
import MeteorBasic from './MeteorBasic.jsx';
import StaticPatientFileLoaderPage from './StaticPatientFileLoaderPage.jsx';

import SmartLauncher from './SmartLauncher.jsx';
import SmartLaunchDebugger from './SmartLaunchDebugger.jsx';
import SmartAppDebugger from './SmartAppDebugger.jsx';
import SmartSampleApp from './SmartSampleApp.jsx';
import BackendAuthPage from './BackendAuthPage.jsx';
import ThemingPage from './ThemingPage.jsx';

import CdsHooksDebugger from './CdsHooksDebugger.jsx';

import NoDataWrapper from './NoDataWrapper.jsx';
import NotSignedInWrapper from './NotSignedInWrapper.jsx';
import AuthenticatedRoute from './components/AuthenticatedRoute.jsx';

import HomePage from './HomePage.jsx';
import ServerConfigurationPage from '../ui-vault-server/ServerConfigurationPage.jsx';
import UdapRegistrationPage from '../ui-vault-server/UdapRegistrationPage.jsx';
import OAuthClientsPage from '../ui-vault-server/OAuthClientsPage.jsx';
import FhirBasePage from './pages/FhirBasePage.jsx';
import SwaggerPage from '../ui-vault-server/SwaggerPage.jsx';

// Business page components
import { 
  AboutPage, 
  EulaPage, 
  PrivacyPage, 
  SupportPage, 
  TermsPage 
} from './pages/index.business.js';

// Account components (conditionally loaded)
import { LoginPage } from '../accounts/client/pages/LoginPage';
import { RegisterPage } from '../accounts/client/pages/RegisterPage';
import { ForgotPasswordForm } from '../accounts/client/components/ForgotPasswordForm';

import PatientQuickChart from '../patient/PatientQuickChart.jsx';
import PatientChart from '../patient/PatientChart.jsx';
import EnhancedCarePlanDesigner from '../ui-fhir/carePlans/EnhancedCarePlanDesigner.jsx';


//===============================================================================================================
// Modules

import PatientsDirectory from '../ui-modules/PatientsDirectory.jsx';
import BiomarkerChartingPage from '../ui-modules/BiomarkerChartingPage.jsx';

// DICOM Viewer
import StudyListPage from './DICOM/StudyListPage.jsx';
import UploadPage from './DICOM/UploadPage.jsx';

// Optional package imports would go here when packages are added

//===============================================================================================================
// FHIR Page Components

import {
  ActivityDefinitionsPage,
  AllergyIntolerancesPage,
  ArtifactAssessmentsPage,
  BasicsPage,
  BundlesPage,
  CarePlanDesignerPage,
  CarePlanDetailPage,
  CareTeamsPage,
  CarePlansPage,
  ClaimsPage,
  CodeSystemsPage,
  CompositionsPage,
  ConditionsPage,
  ConsentsPage,
  DevicesPage,
  DocumentReferencesPage,
  EncountersPage,
  EvidencesPage,
  GoalsPage,
  GuidanceResponsesPage,
  ImmunizationsPage,
  LibrariesPage,
  LocationsPage,
  MedicationsPage,
  MedicationRequestsPage,
  MedicationAdministrationsPage,
  MedicationStatementsPage,
  NutritionOrdersPage,
  ObservationsPage,
  OperationOutcomesPage,
  PlanDefinitionsPage,
  ProceduresPage,
  QuestionnairesPage,
  QuestionnaireResponsesPage,
  ResearchStudiesPage,
  ResearchSubjectsPage,
  ServiceRequestsPage,
  TasksPage,
  ValueSetsPage,
  PractitionersPage,
  ListsPage,
  CommunicationsPage
} from '../ui-pages';

// ConsentsPage is now in ui-pages export
import DiagnosticReportsPage from '../ui-fhir/diagnosticReports/DiagnosticReportsPage';
import DiagnosticReportDetail from '../ui-fhir/diagnosticReports/DiagnosticReportDetail';
import ImagingStudiesPage from '../ui-fhir/imagingStudies/ImagingStudiesPage';
import ImagingStudyDetail from '../ui-fhir/imagingStudies/ImagingStudyDetail';
import AppointmentsPage from '../ui-fhir/appointments/AppointmentsPage';
import AppointmentDetail from '../ui-fhir/appointments/AppointmentDetail';
import SchedulesPage from '../ui-fhir/schedules/SchedulesPage';
import ScheduleDetail from '../ui-fhir/schedules/ScheduleDetail';
import MediasPage from '../ui-fhir/medias/MediasPage';
import MediaDetail from '../ui-fhir/medias/MediaDetail';
import MeasuresPage from '../ui-fhir/measures/MeasuresPage';
import MeasureDetail from '../ui-fhir/measures/MeasureDetail';
import MeasureReportsPage from '../ui-fhir/measureReports/MeasureReportsPage';
import MeasureReportDetail from '../ui-fhir/measureReports/MeasureReportDetail';
import MessageHeadersPage from '../ui-fhir/messageHeaders/MessageHeadersPage';
import MessageHeaderDetail from '../ui-fhir/messageHeaders/MessageHeaderDetail';
import SupplyDeliveriesPage from '../ui-fhir/supplyDeliveries/SupplyDeliveriesPage';

import {
  ActivityDefinitionDetail,
  AllergyIntoleranceDetail,
  ArtifactAssessmentDetail,
  BasicDetail,
  BundleDetail,
  CarePlanDetail,
  CareTeamDetail,
  ClaimDetail,
  CodeSystemDetail,
  CommunicationDetail,
  CompositionDetail,
  ConditionDetail,
  ConsentDetail,
  DeviceDetail,
  DocumentReferenceDetail,
  EncounterDetail,
  EvidenceDetail,
  GoalDetail,
  GuidanceResponseDetail,
  ImmunizationDetail,
  LibraryDetail,
  ListDetail,
  LocationDetail,
  MedicationAdministrationDetail,
  MedicationRequestDetail,
  MedicationDetail,
  MedicationStatementDetail,
  NutritionOrderDetail,
  ObservationDetail,
  OperationOutcomeDetail,
  PatientDetail,
  PlanDefinitionDetail,
  PractitionerDetail,
  ProcedureDetail,
  QuestionnaireResponseDetail,
  QuestionnaireDetail,
  ResearchStudyDetail,
  ResearchSubjectDetail,
  ServiceRequestDetail,
  TaskDetail,
  ValueSetDetail
} from '../ui-details';

// ConsentDetail is now in ui-details export
// TODO: Create these detail components
// import MediaDetail from '../ui-fhir/medias/MediaDetail';
import SupplyDeliveryDetail from '../ui-fhir/supplyDeliveries/SupplyDeliveryDetail';


//===============================================================================================================
// PACIO Pages

import MyProfilePage from './pages/MyProfilePage.jsx';
import FhirResourcesDashboard from './FhirResourcesDashboard.jsx';
import FhirResourcesIndex from './FhirResourcesIndex.jsx';

//===============================================================================================================


//===============================================================================================================
// Theming

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { createTheme } from '@mui/material/styles';
import { Tracker } from 'meteor/tracker';


//===============================================================================================================
// FHIR UI Components
// 
// Now using centralized virtual indexes for better organization and cross-resource patterns

import '../ui-tables';  // Auto-registers all Tables on Meteor.Tables

//===============================================================================================================
// Data Cursors

import { ActivityDefinitions } from '../lib/schemas/SimpleSchemas/ActivityDefinitions';
import { AllergyIntolerances } from '../lib/schemas/SimpleSchemas/AllergyIntolerances';
import { ArtifactAssessments } from '../lib/schemas/SimpleSchemas/ArtifactAssessments';
import { AuditEvents } from '../lib/schemas/SimpleSchemas/AuditEvents';
import { BodyStructures } from '../lib/schemas/SimpleSchemas/BodyStructures';
import { Bundles } from '../lib/schemas/SimpleSchemas/Bundles';
import { CarePlans } from '../lib/schemas/SimpleSchemas/CarePlans';
import { CareTeams } from '../lib/schemas/SimpleSchemas/CareTeams';
import { Conditions } from '../lib/schemas/SimpleSchemas/Conditions';
import { Claims } from '../lib/schemas/SimpleSchemas/Claims';
import { CodeSystems } from '../lib/schemas/SimpleSchemas/CodeSystems';
import { Communications } from '../lib/schemas/SimpleSchemas/Communications';
import { CommunicationRequests } from '../lib/schemas/SimpleSchemas/CommunicationRequests';
import { Compositions } from '../lib/schemas/SimpleSchemas/Compositions';
import { ConceptMaps } from '../lib/schemas/SimpleSchemas/ConceptMaps';
import { Devices } from '../lib/schemas/SimpleSchemas/Devices';
import { DiagnosticReports } from '../lib/schemas/SimpleSchemas/DiagnosticReports';
import { DocumentReferences } from '../lib/schemas/SimpleSchemas/DocumentReferences';
import { Encounters } from '../lib/schemas/SimpleSchemas/Encounters';
import { Evidences } from '../lib/schemas/SimpleSchemas/Evidences';
import { Endpoints } from '../lib/schemas/SimpleSchemas/Endpoints';
import { ExplanationOfBenefits } from '../lib/schemas/SimpleSchemas/ExplanationOfBenefits';
import { FamilyMemberHistories } from '../lib/schemas/SimpleSchemas/FamilyMemberHistories';
import { Goals } from '../lib/schemas/SimpleSchemas/Goals';
import { Groups } from '../lib/schemas/SimpleSchemas/Groups';
import { GuidanceResponses } from '../lib/schemas/SimpleSchemas/GuidanceResponses';
import { Immunizations } from '../lib/schemas/SimpleSchemas/Immunizations';
import { Libraries } from '../lib/schemas/SimpleSchemas/Libraries';
import { Lists } from '../lib/schemas/SimpleSchemas/Lists';
import { Locations } from '../lib/schemas/SimpleSchemas/Locations';
import { Medications } from '../lib/schemas/SimpleSchemas/Medications';
import { MedicationAdministrations } from '../lib/schemas/SimpleSchemas/MedicationAdministrations';
import { MedicationRequests } from '../lib/schemas/SimpleSchemas/MedicationRequests';
import { MedicationStatements } from '../lib/schemas/SimpleSchemas/MedicationStatements';
import { Measures } from '../lib/schemas/SimpleSchemas/Measures';
import { MeasureReports } from '../lib/schemas/SimpleSchemas/MeasureReports';
import { MessageHeaders } from '../lib/schemas/SimpleSchemas/MessageHeaders';
import { Organizations } from '../lib/schemas/SimpleSchemas/Organizations';
import { Observations } from '../lib/schemas/SimpleSchemas/Observations';
import { OperationOutcomes } from '../lib/schemas/SimpleSchemas/OperationOutcomes';
import { Patients } from '../lib/schemas/SimpleSchemas/Patients';
import { PlanDefinitions } from '../lib/schemas/SimpleSchemas/PlanDefinitions';
import { Practitioners } from '../lib/schemas/SimpleSchemas/Practitioners';
import { Procedures } from '../lib/schemas/SimpleSchemas/Procedures';
import { Questionnaires } from '../lib/schemas/SimpleSchemas/Questionnaires';
import { QuestionnaireResponses } from '../lib/schemas/SimpleSchemas/QuestionnaireResponses';
import { NutritionOrders } from '../lib/schemas/SimpleSchemas/NutritionOrders';
import { ResearchStudies } from '../lib/schemas/SimpleSchemas/ResearchStudies';
import { ResearchSubjects } from '../lib/schemas/SimpleSchemas/ResearchSubjects';
import { ServiceRequests } from '../lib/schemas/SimpleSchemas/ServiceRequests';
import { StructureDefinitions } from '../lib/schemas/SimpleSchemas/StructureDefinitions';
import { Specimens } from '../lib/schemas/SimpleSchemas/Specimens';
import { Tasks } from '../lib/schemas/SimpleSchemas/Tasks';
import { ValueSets } from '../lib/schemas/SimpleSchemas/ValueSets';

import PatientCard from '../patient/PatientCard.jsx'
import { FhirUtilities } from '../lib/FhirUtilities.js'
import { FhirDehydrator } from '../lib/FhirDehydrator.js'
import { LayoutHelpers } from '../lib/LayoutHelpers.js'
import { DynamicSpacer } from './DynamicSpacer'
import MedicalRecordImporter from '../lib/MedicalRecordImporter.js'
import { HipaaLogger } from '../lib/HipaaLogger.js'


Meteor.Collections = {
  ActivityDefinitions,
  AllergyIntolerances,
  ArtifactAssessments,
  AuditEvents,
  Bundles,
  BodyStructures,
  CarePlans,
  CareTeams,
  Claims,
  CodeSystems,
  ConceptMaps,
  Conditions,
  Communications,
  CommunicationRequests,
  Compositions,
  Devices,
  DiagnosticReports,
  DocumentReferences,
  Encounters,
  Evidences,
  Endpoints,
  ExplanationOfBenefits,
  FamilyMemberHistories,
  Goals,
  Groups,
  GuidanceResponses,
  Immunizations,
  Libraries,
  Lists,
  Locations,
  Medications,
  MedicationAdministrations,
  MedicationRequests,
  MedicationStatements,
  MessageHeaders,
  Measures,
  MeasureReports,
  NutritionOrders,
  Organizations,
  Observations,
  OperationOutcomes,
  Patients,
  PlanDefinitions,
  Practitioners,
  Procedures,
  Questionnaires,
  QuestionnaireResponses,
  ResearchStudies,
  ResearchSubjects,
  StructureDefinitions,
  ServiceRequests,
  Specimens,
  Tasks,
  ValueSets
}
Meteor.FhirUtilities = FhirUtilities;
Meteor.FhirDehydrator = FhirDehydrator;
Meteor.LayoutHelpers = LayoutHelpers;
Meteor.DynamicSpacer = DynamicSpacer;
Meteor.NoDataWrapper = NoDataWrapper;
Meteor.NotSignedInWrapper = NotSignedInWrapper;
Meteor.MedicalRecordImporter = MedicalRecordImporter;
Meteor.PatientCard = PatientCard;
Meteor.HipaaLogger = HipaaLogger;
Meteor.React = React;



window.Collections = {
  ActivityDefinitions,
  AllergyIntolerances,
  ArtifactAssessments,
  AuditEvents,
  Bundles,
  BodyStructures,
  CarePlans,
  CareTeams,
  Claims,
  CodeSystems,
  ConceptMaps,
  Conditions,
  Communications,
  CommunicationRequests,
  Compositions,
  Devices,
  DiagnosticReports,
  Encounters,
  Evidences,
  Endpoints,
  FamilyMemberHistories,
  Goals,
  Groups,
  GuidanceResponses,
  Immunizations,
  Lists,
  Locations,
  Libraries,
  Medications,
  MedicationAdministrations,
  MedicationRequests,
  MedicationStatements,
  MessageHeaders,
  Measures,
  MeasureReports,
  NutritionOrders,
  Organizations,
  Observations,
  OperationOutcomes,
  Patients,
  PlanDefinitions,
  Practitioners,
  Procedures,
  Questionnaires,
  QuestionnaireResponses,
  ResearchStudies,
  ResearchSubjects,
  StructureDefinitions,
  ServiceRequests,
  Specimens,
  Tasks,
  ValueSets,
  FhirDehydrator
}

window.FhirUtilities = FhirUtilities;
window.HipaaLogger = HipaaLogger;

// Make AuditEvents directly accessible in console
window.AuditEvents = AuditEvents;

// SECURITY TODO:  maybe best to put a guard around this 
// debug only?  or maybe only in development mode?
window.Session = Session;

window.React = React;

// Export React Router hooks for packages to use shared Router context
import * as ReactRouterDOM from 'react-router-dom';
window.ReactRouter = ReactRouterDOM;

//===============================================================================================================
// Router History

import { unstable_HistoryRouter as HistoryRouter } from 'react-router-dom';
import { createBrowserHistory } from 'history';
export const history = createBrowserHistory();
import { NavigationProvider, useNavigation } from './NavigationContext';

//===============================================================================================================
// Static Routes



let dynamicRoutes = [
  {
    path: "/home",
    element: <HomePage />
  }, {
    path: "/index",
    element: <HomePage />
  }, {
    path: "/getting-started",
    element: <GettingStartedPage />
  }, {
    path: "/getting-started-checklist",
    element: <GettingStartedPage />
  }, {
    path: "/static-files",
    element: <StaticPatientFileLoaderPage />
  }, {
    path: "/smart-launcher",
    element: <SmartLauncher />
  }, {
    path: "/smart-launcher-debugger",
    element: <SmartLaunchDebugger />
  }, {
    path: "/smart-sample-app",
    element: <SmartSampleApp />
  }, {
    path: "/smart-app-debugger",
    element: <SmartAppDebugger />
  }, {
    path: "/backend-auth",
    element: <BackendAuthPage />
  }, {
    path: "/theming",
    element: <ThemingPage />
  }, {
    path: "/cds-hooks-debugger",
    element: <CdsHooksDebugger />
  }, {
    path: "/patient-quickchart",
    element: <PatientQuickChart />
  }, {
    path: "/server-configuration",
    element: <ServerConfigurationPage />
  }, {
    path: "/udap-registration",
    element: <UdapRegistrationPage />
  }, {
    path: "/oauth-clients",
    element: <OAuthClientsPage />
  }, {
    path: "/patient-chart",
    element: <PatientChart />
  }, {
    path: "/biomarkers-charting",
    element: <BiomarkerChartingPage />
  }, {
    path: "/fhir-resources-index",
    element: <FhirResourcesDashboard />,
    requireAuth: true
  }, {
    path: "/fhir-resources-dashboard",
    element: <FhirResourcesIndex />,
    requireAuth: true
  }, {
    path: "/fhir",
    element: <FhirBasePage />
  }, {
    path: "/baseR4",
    element: <FhirBasePage />
  }, {
    path: "/swagger",
    element: <SwaggerPage />
  }  
]

// Business/Legal page routes
if(get(Meteor, 'settings.public.businessPages.privacy.enabled')){
  dynamicRoutes.push({
    path: "/privacy",
    element: <PrivacyPage />
  })
}
if(get(Meteor, 'settings.public.businessPages.terms.enabled')){
  dynamicRoutes.push({
    path: "/terms",
    element: <TermsPage />
  })
  // Also support the legacy route
  dynamicRoutes.push({
    path: "/terms-and-conditions",
    element: <TermsPage />
  })
}
if(get(Meteor, 'settings.public.businessPages.eula.enabled')){
  dynamicRoutes.push({
    path: "/eula",
    element: <EulaPage />
  })
}
if(get(Meteor, 'settings.public.businessPages.support.enabled')){
  dynamicRoutes.push({
    path: "/support",
    element: <SupportPage />
  })
}
if(get(Meteor, 'settings.public.businessPages.about.enabled')){
  dynamicRoutes.push({
    path: "/about",
    element: <AboutPage />
  })
}



// Account routes
if(get(Meteor, 'settings.public.modules.accounts.enabled', true)){
  dynamicRoutes.push({
    path: "/login",
    element: <LoginPage />
  });
  dynamicRoutes.push({
    path: "/signin",
    element: <LoginPage />
  });
  dynamicRoutes.push({
    path: "/sign-in",
    element: <LoginPage />
  });
  dynamicRoutes.push({
    path: "/register", 
    element: <RegisterPage />
  });
  dynamicRoutes.push({
    path: "/signup",
    element: <RegisterPage />
  });
  dynamicRoutes.push({
    path: "/forgot-password",
    element: (
      <Container maxWidth="sm">
        <Box sx={{ pt: 8, pb: 4 }}>
          <ForgotPasswordForm 
            onBackToLogin={() => window.location.href = '/login'}
          />
        </Box>
      </Container>
    )
  });
}

if(get(Meteor, 'settings.public.modules.PatientDirectory')){
  dynamicRoutes.push({
    path: "/patient-directory",
    element: <AuthenticatedRoute><PatientsDirectory /></AuthenticatedRoute>
  })
}
if(get(Meteor, 'settings.public.modules.Theming')){
  dynamicRoutes.push({
    path: "/theming",
    element: <ThemingPage />
  })
}

// DICOM Viewer routes
if(get(Meteor, 'settings.public.modules.DicomViewer')){
  dynamicRoutes.push({
    path: "/dicom/studies",
    element: <AuthenticatedRoute><StudyListPage /></AuthenticatedRoute>
  })
  dynamicRoutes.push({
    path: "/dicom/upload",
    element: <AuthenticatedRoute><UploadPage /></AuthenticatedRoute>
  })
}

// Optional package routes would be registered here dynamically when packages are added









if(get(Meteor, 'settings.public.modules.fhir.AllergyIntolerances')){
  dynamicRoutes.push({
    path: "/allergy-intolerances",
    element: <AllergyIntolerancesPage />
  })
  dynamicRoutes.push({
    path: "/allergy-intolerances/new",
    element: <AllergyIntoleranceDetail />
  })
  dynamicRoutes.push({
    path: "/allergy-intolerances/:id",
    element: <AllergyIntoleranceDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Appointments')){
  dynamicRoutes.push({
    path: "/appointments",
    element: <AppointmentsPage />
  })
  dynamicRoutes.push({
    path: "/appointments/new",
    element: <AppointmentDetail />
  })
  dynamicRoutes.push({
    path: "/appointments/:id",
    element: <AppointmentDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.ArtifactAssessments')){
  dynamicRoutes.push({
    path: "/artifact-assessments",
    element: <ArtifactAssessmentsPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.ActivityDefinitions')){
  dynamicRoutes.push({
    path: "/activity-definitions",
    element: <ActivityDefinitionsPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Bundles')){
  dynamicRoutes.push({
    path: "/bundles",
    element: <BundlesPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.CareTeams')){
  dynamicRoutes.push({
    path: "/care-teams",
    element: <CareTeamsPage />
  })
  dynamicRoutes.push({
    path: "/care-teams/new",
    element: <CareTeamDetail />
  })
  dynamicRoutes.push({
    path: "/care-teams/:id",
    element: <CareTeamDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.CarePlans')){
  dynamicRoutes.push({
    path: "/careplans",
    element: <CarePlansPage />
  })
  dynamicRoutes.push({
    path: "/care-plans",
    element: <CarePlansPage />
  })
  dynamicRoutes.push({
    path: "/careplans/new",
    element: <CarePlanDetail />
  })
  dynamicRoutes.push({
    path: "/careplans/:id",
    element: <CarePlanDetail />
  })
  dynamicRoutes.push({
    path: "/care-plan-designer",
    element: <EnhancedCarePlanDesigner />,
    requireAuth: true
  })
}
if(get(Meteor, 'settings.public.modules.fhir.CodeSystems')){
  dynamicRoutes.push({
    path: "/code-systems",
    element: <CodeSystemsPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Compositions')){
  dynamicRoutes.push({
    path: "/compositions",
    element: <CompositionsPage />
  })
  dynamicRoutes.push({
    path: "/compositions/new",
    element: <CompositionDetail />
  })
  dynamicRoutes.push({
    path: "/compositions/:id",
    element: <CompositionDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Conditions')){
  dynamicRoutes.push({
    path: "/conditions",
    element: <ConditionsPage />
  })
  dynamicRoutes.push({
    path: "/conditions/new",
    element: <ConditionDetail />
  })
  dynamicRoutes.push({
    path: "/conditions/:id",
    element: <ConditionDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.DiagnosticReports')){
  
  dynamicRoutes.push({
    path: "/diagnostic-reports",
    element: <DiagnosticReportsPage />
  })
  dynamicRoutes.push({
    path: "/diagnostic-reports/new",
    element: <DiagnosticReportDetail />
  })
  dynamicRoutes.push({
    path: "/diagnostic-reports/:id",
    element: <DiagnosticReportDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Devices')){
  dynamicRoutes.push({
    path: "/devices",
    element: <DevicesPage />
  })
  dynamicRoutes.push({
    path: "/devices/new",
    element: <DeviceDetail />
  })
  dynamicRoutes.push({
    path: "/devices/:id",
    element: <DeviceDetail />
  })
} else {
  console.log('Devices module is NOT enabled in settings');
  console.log('Setting value:', get(Meteor, 'settings.public.modules.fhir.Devices'));
}
if(get(Meteor, 'settings.public.modules.fhir.DocumentReferences')){
  dynamicRoutes.push({
    path: "/document-references",
    element: <DocumentReferencesPage />
  })
  dynamicRoutes.push({
    path: "/document-references/new",
    element: <DocumentReferenceDetail />
  })
  dynamicRoutes.push({
    path: "/document-references/:id",
    element: <DocumentReferenceDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Encounters')){
  dynamicRoutes.push({
    path: "/encounters",
    element: <EncountersPage />
  })
  dynamicRoutes.push({
    path: "/encounters/new",
    element: <EncounterDetail />
  })
  dynamicRoutes.push({
    path: "/encounters/:id",
    element: <EncounterDetail />
  })
}
// TEMP: Adding ResearchStudies routes directly for testing
// Commented out - routes are now added conditionally above
// dynamicRoutes.push({
//   path: "/research-studies",
//   element: <ResearchStudiesPage />
// })
// dynamicRoutes.push({
//   path: "/research-studies/new",
//   element: <ResearchStudyDetail />
// })
// dynamicRoutes.push({
//   path: "/research-studies/:id",
//   element: <ResearchStudyDetail />
// })
if(get(Meteor, 'settings.public.modules.fhir.Evidences')){
  dynamicRoutes.push({
    path: "/evidences",
    element: <EvidencesPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Goals')){
  dynamicRoutes.push({
    path: "/goals",
    element: <GoalsPage />
  })
  dynamicRoutes.push({
    path: "/goals/new",
    element: <GoalDetail />
  })
  dynamicRoutes.push({
    path: "/goals/:id",
    element: <GoalDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.GuidanceResponses')){
  dynamicRoutes.push({
    path: "/guidance-responses",
    element: <GuidanceResponsesPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Immunizations')){
  dynamicRoutes.push({
    path: "/immunizations",
    element: <ImmunizationsPage />
  })
  dynamicRoutes.push({
    path: "/immunizations/new",
    element: <ImmunizationDetail />
  })
  dynamicRoutes.push({
    path: "/immunizations/:id",
    element: <ImmunizationDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Libraries')){
  dynamicRoutes.push({
    path: "/libraries",
    element: <LibrariesPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Locations')){
  dynamicRoutes.push({
    path: "/locations",
    element: <LocationsPage />
  })
  dynamicRoutes.push({
    path: "/locations/new",
    element: <LocationDetail />
  })
  dynamicRoutes.push({
    path: "/locations/:id",
    element: <LocationDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Observations')){
  dynamicRoutes.push({
    path: "/observations",
    element: <ObservationsPage />
  })
  dynamicRoutes.push({
    path: "/observations/new",
    element: <ObservationDetail />
  })
  dynamicRoutes.push({
    path: "/observations/:id",
    element: <ObservationDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Patients')){
  dynamicRoutes.push({
    path: "/patients",
    element: <AuthenticatedRoute><PatientsDirectory /></AuthenticatedRoute>
  })
  dynamicRoutes.push({
    path: "/patients/new",
    element: <AuthenticatedRoute><PatientDetail /></AuthenticatedRoute>
  })
  dynamicRoutes.push({
    path: "/patients/:id",
    element: <AuthenticatedRoute><PatientDetail /></AuthenticatedRoute>
  })
}
if(get(Meteor, 'settings.public.modules.fhir.OperationOutcomes')){
  dynamicRoutes.push({
    path: "/operation-outcomes",
    element: <OperationOutcomesPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.PlanDefinitions')){
  dynamicRoutes.push({
    path: "/plan-definitions",
    element: <PlanDefinitionsPage />
  })
  dynamicRoutes.push({
    path: "/plan-definitions/new",
    element: <PlanDefinitionDetail />
  })
  dynamicRoutes.push({
    path: "/plan-definitions/:id",
    element: <PlanDefinitionDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Procedures')){
  dynamicRoutes.push({
    path: "/procedures",
    element: <ProceduresPage />
  })
  dynamicRoutes.push({
    path: "/procedures/new",
    element: <ProcedureDetail />
  })
  dynamicRoutes.push({
    path: "/procedures/:id",
    element: <ProcedureDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Questionnaires')){
  dynamicRoutes.push({
    path: "/questionnaires",
    element: <QuestionnairesPage />
  })
  dynamicRoutes.push({
    path: "/questionnaires/new",
    element: <QuestionnaireDetail />
  })
  dynamicRoutes.push({
    path: "/questionnaires/:id",
    element: <QuestionnaireDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.QuestionnaireResponses')){
  dynamicRoutes.push({
    path: "/questionnaire-responses",
    element: <QuestionnaireResponsesPage />
  })
  dynamicRoutes.push({
    path: "/questionnaire-responses/new",
    element: <QuestionnaireResponseDetail />
  })
  dynamicRoutes.push({
    path: "/questionnaire-responses/:id",
    element: <QuestionnaireResponseDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.ResearchSubjects')){
  dynamicRoutes.push({
    path: "/research-subjects",
    element: <ResearchSubjectsPage />
  })
  dynamicRoutes.push({
    path: "/research-subjects/new",
    element: <ResearchSubjectDetail />
  })
  dynamicRoutes.push({
    path: "/research-subjects/:id",
    element: <ResearchSubjectDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.ResearchStudies')){
  dynamicRoutes.push({
    path: "/research-studies",
    element: <ResearchStudiesPage />
  })
  dynamicRoutes.push({
    path: "/research-studies/new",
    element: <ResearchStudyDetail />
  })
  dynamicRoutes.push({
    path: "/research-studies/:id",
    element: <ResearchStudyDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.ServiceRequests')){
  dynamicRoutes.push({
    path: "/service-requests",
    element: <ServiceRequestsPage />
  })
  dynamicRoutes.push({
    path: "/service-requests/new",
    element: <ServiceRequestDetail />
  })
  dynamicRoutes.push({
    path: "/service-requests/:id",
    element: <ServiceRequestDetail />
  })
}
// Always include Tasks route since it's in the pacio-core sidebar
dynamicRoutes.push({
  path: "/tasks",
  element: <TasksPage />
})
dynamicRoutes.push({
  path: "/tasks/new",
  element: <TaskDetail />
})
dynamicRoutes.push({
  path: "/tasks/:id",
  element: <TaskDetail />
})

// Add missing FHIR resource routes
if(get(Meteor, 'settings.public.modules.fhir.Consents')){
  dynamicRoutes.push({
    path: "/consents",
    element: <ConsentsPage />
  })
  dynamicRoutes.push({
    path: "/consents/new",
    element: <ConsentDetail />
  })
  dynamicRoutes.push({
    path: "/consents/:id",
    element: <ConsentDetail />
  })
}

if(get(Meteor, 'settings.public.modules.fhir.ImagingStudies')){
  dynamicRoutes.push({
    path: "/imaging-studies",
    element: <ImagingStudiesPage />
  })
  dynamicRoutes.push({
    path: "/imaging-studies/new",
    element: <ImagingStudyDetail />
  })
  dynamicRoutes.push({
    path: "/imaging-studies/:id",
    element: <ImagingStudyDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Appointments')){
  dynamicRoutes.push({
    path: "/appointments",
    element: <AppointmentsPage />
  })
  dynamicRoutes.push({
    path: "/appointments/new",
    element: <AppointmentDetail />
  })
  dynamicRoutes.push({
    path: "/appointments/:id",
    element: <AppointmentDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Schedules')){
  dynamicRoutes.push({
    path: "/schedules",
    element: <SchedulesPage />
  })
  dynamicRoutes.push({
    path: "/schedules/new",
    element: <ScheduleDetail />
  })
  dynamicRoutes.push({
    path: "/schedules/:id",
    element: <ScheduleDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Medias')){
  dynamicRoutes.push({
    path: "/medias",
    element: <MediasPage />
  })
  dynamicRoutes.push({
    path: "/medias/new",
    element: <MediaDetail />
  })
  dynamicRoutes.push({
    path: "/medias/:id",
    element: <MediaDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.SupplyDeliveries')){
  dynamicRoutes.push({
    path: "/supply-deliveries",
    element: <SupplyDeliveriesPage />
  })
  dynamicRoutes.push({
    path: "/supply-deliveries/new",
    element: <SupplyDeliveryDetail />
  })
  dynamicRoutes.push({
    path: "/supply-deliveries/:id",
    element: <SupplyDeliveryDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.ValueSets')){
  dynamicRoutes.push({
    path: "/value-sets",
    element: <ValueSetsPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.MedicationStatements')){
  dynamicRoutes.push({
    path: "/medication-statements",
    element: <MedicationStatementsPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Medications')){
  dynamicRoutes.push({
    path: "/medications",
    element: <MedicationsPage />
  })
  dynamicRoutes.push({
    path: "/medications/new",
    element: <MedicationDetail />
  })
  dynamicRoutes.push({
    path: "/medications/:id",
    element: <MedicationDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Medias')){
  dynamicRoutes.push({
    path: "/medias",
    element: <MediasPage />
  })
  dynamicRoutes.push({
    path: "/medias/new",
    element: <MediaDetail />
  })
  dynamicRoutes.push({
    path: "/medias/:id",
    element: <MediaDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.MedicationRequests')){
  dynamicRoutes.push({
    path: "/medication-requests",
    element: <MedicationRequestsPage />
  })
  dynamicRoutes.push({
    path: "/medication-requests/new",
    element: <MedicationRequestDetail />
  })
  dynamicRoutes.push({
    path: "/medication-requests/:id",
    element: <MedicationRequestDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.MedicationAdministrations')){
  dynamicRoutes.push({
    path: "/medication-administrations",
    element: <MedicationAdministrationsPage />
  })
  dynamicRoutes.push({
    path: "/medication-administrations/new",
    element: <MedicationAdministrationDetail />
  })
  dynamicRoutes.push({
    path: "/medication-administrations/:id",
    element: <MedicationAdministrationDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.MessageHeaders')){
  dynamicRoutes.push({
    path: "/message-headers",
    element: <MessageHeadersPage />
  })
  dynamicRoutes.push({
    path: "/message-headers/new",
    element: <MessageHeaderDetail />
  })
  dynamicRoutes.push({
    path: "/message-headers/:id",
    element: <MessageHeaderDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Measures')){
  dynamicRoutes.push({
    path: "/measures",
    element: <MeasuresPage />
  })
  dynamicRoutes.push({
    path: "/measures/new",
    element: <MeasureDetail />
  })
  dynamicRoutes.push({
    path: "/measures/:id",
    element: <MeasureDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.MeasureReports')){
  dynamicRoutes.push({
    path: "/measure-reports",
    element: <MeasureReportsPage />
  })
  dynamicRoutes.push({
    path: "/measure-reports/new",
    element: <MeasureReportDetail />
  })
  dynamicRoutes.push({
    path: "/measure-reports/:id",
    element: <MeasureReportDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.NutritionOrders')){
  dynamicRoutes.push({
    path: "/nutrition-orders",
    element: <NutritionOrdersPage />
  })
  dynamicRoutes.push({
    path: "/nutrition-orders/new",
    element: <NutritionOrderDetail />
  })
  dynamicRoutes.push({
    path: "/nutrition-orders/:id",
    element: <NutritionOrderDetail />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.PlanDefinitions')){
  dynamicRoutes.push({
    path: "/plan-definitions",
    element: <PlanDefinitionsPage />
  })
  dynamicRoutes.push({
    path: "/plan-definitions/new",
    element: <PlanDefinitionDetail />
  })
  dynamicRoutes.push({
    path: "/plan-definitions/:id",
    element: <PlanDefinitionDetail />
  })
}
// Always include these routes since they're in the pacio-core sidebar
dynamicRoutes.push({
  path: "/practitioners",
  element: <PractitionersPage />
})
dynamicRoutes.push({
  path: "/practitioners/new",
  element: <PractitionerDetail />
})
dynamicRoutes.push({
  path: "/practitioners/:id",
  element: <PractitionerDetail />
})
dynamicRoutes.push({
  path: "/lists",
  element: <ListsPage />
})
dynamicRoutes.push({
  path: "/lists/new",
  element: <ListDetail />
})
dynamicRoutes.push({
  path: "/lists/:id",
  element: <ListDetail />
})
dynamicRoutes.push({
  path: "/communications",
  element: <CommunicationsPage />
})
dynamicRoutes.push({
  path: "/communications/new",
  element: <CommunicationDetail />
})
dynamicRoutes.push({
  path: "/communications/:id",
  element: <CommunicationDetail />
})




if(get(Meteor, 'settings.public.modules.fhir.Claims')){
  dynamicRoutes.push({
    path: "/claims",
    element: <ClaimsPage />
  })
}

// PACIO Routes are now handled by the pacio-core package
dynamicRoutes.push({
  path: "/my-profile", 
  element: <MyProfilePage />
});

// ==============================================================================
// Dynamic Routes

let homeRoute = {
  path: "/",
  element: <GettingStartedPage />
}

let headerNavigation;
let foundMainPage = false;
Object.keys(Package).forEach(function(packageName){
  if(Package[packageName].DynamicRoutes){
    // we try to build up a route from what's specified in the package
    Package[packageName].DynamicRoutes.forEach(function(route){
      // If route has component instead of element, create the element
      if(route.component && !route.element) {
        route.element = React.createElement(route.component);
      }
      
      // Debug logging for swarm route
      if(route.path === '/swarm') {
        console.log('[APP] Swarm route found:', route);
        console.log('[APP] Swarm route element:', route.element);
        console.log('[APP] Swarm route element type:', typeof route.element);
        if(route.element && route.element.$$typeof) {
          console.log('[APP] Swarm element $$typeof:', route.element.$$typeof.toString());
        }
      }
      
      // Debug logging for routes with requireAuth
      if(route.requireAuth) {
        console.log('[APP] Route requires authentication:', route.path, route);
      }
      
      dynamicRoutes.push(route);      
    });    
    if(Package[packageName].MainPage){
      dynamicRoutes.push(Package[packageName].MainPage);      
      foundMainPage = true;
      // if(typeof homeRoute.element === "undefined"){
      //   homeRoute.element = Package[packageName].MainPage
      // } else {
      //   console.warn("Hmmm.  Appears that a package has already loaded a MainPage.  You'll probably want to check Atmosphere packages for more than one package setting MainPage.")
      // }
    }
  }
});
if(!foundMainPage){
  dynamicRoutes.push(homeRoute);      
}

// ==============================================================================
// Router
console.log('Total dynamic routes:', dynamicRoutes.length);
console.log('All routes:', dynamicRoutes.map(r => r.path));

const router = createBrowserRouter(dynamicRoutes);

// Router debugging - check for problematic routes
if (Meteor.isDevelopment) {
  dynamicRoutes.forEach((route, index) => {
    if (route.element && typeof route.element === 'object' && route.element.$$typeof) {
      // Check if this might be a problematic element
      if (route.element.$$typeof.toString() !== 'Symbol(react.element)') {
        console.warn(`Route ${index}: path="${route.path}" has unusual element type:`, route.element.$$typeof.toString(), route.element);
      }
    }
  });
}

// ==============================================================================
// Security Based Routing

// patient authentication function
const requireAuth = (nextState, replace) => {
  // do we even need to authorize?
  if(get(Meteor, 'settings.public.defaults.requireAuthorization')){
    // yes, this is a restricted page
    if (!Meteor.loggingIn() && !Meteor.currentUser()) {
      // we're in the compiled desktop app that somebody purchased or downloaded
      // so no need to go to the landing page
      // lets just take them to the signin page
      if(Meteor.isDesktop){
        replace({
          pathname: '/signin',
          state: { nextPathname: nextState.location.pathname }
        });  
      } else {

        // we're in the general use case
        // user is trying to access a route that requires authorization, but isn't signed in
        // redirect them to the landing page
        if(get(Meteor, 'settings.public.defaults.landingPage')){
          replace({
            pathname: get(Meteor, 'settings.public.defaults.landingPage'),
            state: { nextPathname: nextState.location.pathname }
          });    
        } else {
          replace({
            pathname: '/landing-page',
            state: { nextPathname: nextState.location.pathname }
          });    
        }

      }
    }

  } else {
  // apparently we don't need to authorize;
  // so lets just continue (i.e. everybody is authorized)
    if(get(Meteor, 'settings.public.defaults.route')){
      // hey, a default route is specified
      // lets go there
      replace({
        pathname: get(Meteor, 'settings.public.defaults.route'),
        state: { nextPathname: nextState.location.pathname }
      });  
    }

    // can't find anywhere else to go to, so lets just go to the root path 
    // ¯\_(ツ)_/¯
  }
};

// practitioner authentication function
const requirePractitioner = (nextState, replace) => {
  if (!Roles.userIsInRole(get(Meteor.currentUser(), '_id'), 'practitioner')) {
    replace({
      pathname: '/need-to-be-practitioner',
      state: { nextPathname: nextState.location.pathname }
    });
  }
};
// practitioner authentication function
const requreSysadmin = (nextState, replace) => {
  if (!Roles.userIsInRole(get(Meteor.currentUser(), '_id'), 'sysadmin')) {
    replace({
      pathname: '/need-to-be-sysadmin',
      state: { nextPathname: nextState.location.pathname }
    });
  }
};



//===============================================================================================================
// Analytics

let analyticsMeasurementId = get(Meteor, 'settings.public.google.analytics.measurementId')

import ReactGA from "react-ga4";
if(analyticsMeasurementId){
  ReactGA.initialize(analyticsMeasurementId, {debug: get(Meteor, 'settings.public.google.analytics.debug', false)});
}

function logPageView() {
  if(analyticsMeasurementId){
    // ReactGA.pageview(window.location.pathname + window.location.search);
    ReactGA.send({ hitType: "pageview", page: window.location.pathname });
  }
};

function usePageViews() {
  // let location = useLocation();
  React.useEffect(() => {
    if(analyticsMeasurementId){
      ReactGA.pageview(window.location.pathname + window.location.search);
      // ReactGA.set({ page: window.location.pathname });  
      ReactGA.send({ hitType: "pageview", page: window.location.pathname });
    }
  }, [window.location]);
}





// ==============================================================================
// Slideout Cards ???


if(Meteor.isClient){
  Session.setDefault('slideOutCardsVisible', true)
}
export function SlideOutCards(props){


  const slideOutCardsVisible = useTracker(function(){
    return Session.get('slideOutCardsVisible')
  }, []);

  console.log('slideOutCardsVisible', slideOutCardsVisible)

  let overlayContainerStyle = {
    position: 'fixed',
    top: '0px',
    left: '0px',
    height: '100%', 
    width: '100%'
  }

  let overlayStyle = {
    position: 'absolute',
    float: 'right',    
    top: '128px',
    right: '73px',
    height: window.innerHeight - 64 + 'px',
    width: '400px',
    transition: '.7s'
  }

  if(slideOutCardsVisible){
    overlayStyle.right = '-473px';
  }


  return <div id='slideoutCardsContainer' style={overlayContainerStyle}>
    <Card id='slideoutCards' style={overlayStyle}>
      <CardHeader title="Slideout" />
    </Card>
  </div>
}



//===============================================================================================================
// Theming


const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);
Meteor.useTheme = useTheme;

// this Provider components enables the useTheme() hook in child components
export const CustomThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(function() {
    const settingsMode = get(Meteor, 'settings.public.theme.darkMode', false);
    const paletteMode = get(Meteor, 'settings.public.theme.palette.mode', '');
    return settingsMode || paletteMode === 'dark' ? 'dark' : 'light';
  });
  const [themeRefreshCounter, setThemeRefreshCounter] = useState(0);

  // Create themes dynamically based on current Meteor.settings
  const createDynamicTheme = (mode) => {
    const isDark = mode === 'dark';
    
    // Get core color settings - let MUI handle the dark/light variants
    const primaryColor = get(Meteor, "settings.public.theme.palette.primaryColor", "rgb(158, 158, 158)");
    const secondaryColor = get(Meteor, "settings.public.theme.palette.secondaryColor", "#fdb813");
    const errorColor = get(Meteor, "settings.public.theme.palette.errorColor", "rgb(128,20,60)");
    
    // Get AppBar colors with dark mode support
    // Light mode: defaults to primary color if not specified
    const appBarColorLight = get(Meteor, "settings.public.theme.palette.appBarColor", primaryColor);
    const appBarTextColorLight = get(Meteor, "settings.public.theme.palette.appBarTextColor", "#ffffff");
    
    // Dark mode: defaults to light mode values if not specified
    const appBarColorDark = get(Meteor, "settings.public.theme.palette.appBarColorDark", appBarColorLight);
    const appBarTextColorDark = get(Meteor, "settings.public.theme.palette.appBarTextColorDark", appBarTextColorLight);
    
    // Select the appropriate colors based on current mode
    const appBarColor = isDark ? appBarColorDark : appBarColorLight;
    const appBarTextColor = isDark ? appBarTextColorDark : appBarTextColorLight;
    
    // Get background colors with dark mode support
    const backgroundCanvas = get(Meteor, "settings.public.theme.palette.backgroundCanvas", "");
    const backgroundCanvasDark = get(Meteor, "settings.public.theme.palette.backgroundCanvasDark", backgroundCanvas);
    const backgroundPageColorLight = get(Meteor, "settings.public.theme.palette.backgroundPageColor", "");
    const backgroundPageColorDark = get(Meteor, "settings.public.theme.palette.backgroundPageColorDark", backgroundPageColorLight);
    const backgroundPageColor = isDark ? (backgroundCanvasDark || backgroundPageColorDark) : (backgroundCanvas || backgroundPageColorLight);

    // Get card/paper colors from settings
    const paperColorFromSettings = get(Meteor, "settings.public.theme.palette.paperColor", "");
    const cardColorFromSettings = get(Meteor, "settings.public.theme.palette.cardColor", "");

    const themeConfig = {
      palette: {
        mode: mode,
        primary: {
          main: primaryColor
        },
        secondary: {
          main: secondaryColor
        },
        error: {
          main: errorColor
        },
        // Custom appbar palette
        appbar: {
          main: appBarColor,
          contrastText: appBarTextColor
        }
      },
      components: {
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: appBarColor,
              color: appBarTextColor
            },
            colorPrimary: {
              backgroundColor: appBarColor,
              color: appBarTextColor
            }
          }
        }
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      }
    };
    
    // Add background colors from settings (handle empty strings)
    const backgroundDefault = backgroundPageColor ? backgroundPageColor : (isDark ? '#121212' : '#fafafa');
    const paperColor = paperColorFromSettings ? paperColorFromSettings.replace(' !important', '').trim() : '';
    const backgroundPaper = paperColor || (isDark ? '#1e1e1e' : '#ffffff');

    themeConfig.palette.background = {
      default: backgroundDefault,
      paper: backgroundPaper
    };
    
    return createTheme(themeConfig);
  };

  // Create theme based on current mode and settings
  const muiTheme = useMemo(() => {
    return createDynamicTheme(theme);
  }, [theme, themeRefreshCounter]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Function to force theme refresh when settings change
  const refreshTheme = () => {
    setThemeRefreshCounter(prev => prev + 1);
  };

  // Listen for theme refresh requests via Session
  useEffect(() => {
    if(Meteor.isClient){
      const handle = Tracker.autorun(() => {
        const refreshRequest = Session.get('themeRefreshRequest');
        if (refreshRequest) {
          refreshTheme();
          Session.set('themeRefreshRequest', false);
        }
      });
      
      return () => handle.stop();
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, refreshTheme }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};



if(Meteor.isClient){
  Session.setDefault('canvasBackgroundColor', "#f2f2f2")
}


const drawerWidth =  get(Meteor, 'settings.public.defaults.drawerWidth', 280);
const defaultCanvasColor =  get(Meteor, 'settings.public.theme.palette.canvasColor', "#f2f2f2");

// custom hook to listen to the resize event
function useWindowSize() {
  const [size, setSize] = useState([0, 0]);

  // useLayoutEffect only works on the client!
  if(Meteor.isClient){
    useLayoutEffect(() => {
      function updateSize() {
        setSize([window.innerWidth, window.innerHeight]);
      }
      window.addEventListener('resize', updateSize);
      updateSize();
      return () => window.removeEventListener('resize', updateSize);
    }, []);  
  }
  return size;
}




// ==============================================================================
// Main App


export function App(props){

  // const { theme, toggleTheme } = useTheme();


  
  // if(typeof logger === "undefined"){
  //   logger = props.logger;
  // }
  
  // logger.debug('Rendering the main App.');
  // logger.verbose('client.app.layout.App');
  // logger.data('App.props', {data: props}, {source: "AppContainer.jsx"});

  // console.info('Rendering the App.');
  // console.debug('client.app.layout.App');
  // console.data('App.props', {data: props}, {source: "AppContainer.jsx"});


  // ------------------------------------------------------------------
  // Props  

  const { staticContext, startAdornment,  ...otherProps } = props;

  // ------------------------------------------------------------------
  // SMART on FHIR Oauth Scope  

  let searchParams = new URLSearchParams(window.location.search);
  if(get(Meteor, 'settings.public.enableEhrLaunchContext')){
    if(searchParams){

      searchParams.forEach(function(value, key){
        console.log(key + ': ' + value); 
      });
  
      if(searchParams.get('iss')){
        Session.set('smartOnFhir_iss', searchParams.get('iss'));
      }
      if(searchParams.get('launch')){
        Session.set('smartOnFhir_launch', searchParams.get('launch'));
      }
      if(searchParams.get('code')){
        Session.set('smartOnFhir_code', searchParams.get('code'));
      }
      if(searchParams.get('scope')){
        Session.set('smartOnFhir_scope', searchParams.get('scope'));
      }
  
      if(searchParams.state){
        Session.set('smartOnFhir_state', searchParams.state);
      }        
    }  
  }

  // forgot why we have this.  I think this is Google Analytics related?
  // usePageViews();


  // ------------------------------------------------------------------
  // App UI State

  const [drawerIsOpen, setDrawerIsOpen] = useState(false);
  const [appWidth, appHeight] = useWindowSize();



  // ------------------------------------------------------------------
  // Pathname Updates

  const navigate = useNavigation();
  useEffect(() => {
    // Storing navigate function globally
    window.globalNavigate = navigate;
  }, [navigate]);

  useEffect(() => {
    if(get(props, 'location.pathname')){
      console.info('Location pathname was changed.  Setting the session variable: ' + props.location.pathname);
      Session.set('pathname', props.location.pathname);  
      logPageView()
    }

    if(document.getElementById("reactCanvas") && !Meteor.isCordova){
      document.getElementById("reactCanvas").setAttribute("style", "bottom: 0px; background: " + defaultCanvasColor + ";");
      document.getElementById("reactCanvas").setAttribute("background", defaultCanvasColor);
    }
  }, [props])


  // ------------------------------------------------------------------
  // User Interface Methods

  function handleDrawerOpen(){
    logger.trace('App.handleDrawerOpen()')
    setDrawerIsOpen(!drawerIsOpen);
  };

  function handleDrawerClose(){
    setDrawerIsOpen(false);
    logger.trace('App.handleDrawerClose()')

  };

  const handleDrawerToggle = () => {
    setDrawerIsOpen(!drawerIsOpen);
  };



  // ------------------------------------------------------------------
  // Social Media Registration  

  let socialmedia = {
    title: get(Meteor, 'settings.public.socialmedia.title', ''),
    type: get(Meteor, 'settings.public.socialmedia.type', ''),
    url: get(Meteor, 'settings.public.socialmedia.url', ''),
    image: get(Meteor, 'settings.public.socialmedia.image', ''),
    description: get(Meteor, 'settings.public.socialmedia.description', ''),
    site_name: get(Meteor, 'settings.public.socialmedia.site_name', ''),
    author: get(Meteor, 'settings.public.socialmedia.author', '')
  }

  let helmet;
  let headerTags = [];
  let themeColor = "";  
  let rawColor = get(Meteor, 'settings.public.theme.palette.appBarColor', "#669f64");

  // all we're doing here is grabing the hex color, and ignoring adornments like !important
  if(rawColor.split(" ")){
    themeColor = rawColor.split(" ")[0];
  } else {
    themeColor = rawColor;
  }

  let initialScale = 1.0; 

  headerTags.push(<meta key='theme' name="theme-color" content={themeColor} />)
  headerTags.push(<meta key='utf-8' charSet="utf-8" />);    
  // headerTags.push(<meta name="viewport" key='viewport' property="viewport" content={"initial-scale=" + initialScale + ", minimal-ui, minimum-scale=" + initialScale + ", maximum-scale=" + initialScale + ", width=device-width, height=device-height, user-scalable=no"} />);
  headerTags.push(<meta name="viewport" key='viewport' property="viewport" content={"initial-scale=" + initialScale + ", minimal-ui, minimum-scale=" + initialScale + ", maximum-scale=" + initialScale + ", width=device-width, height=device-height"} />);
  headerTags.push(<meta name="description" key='description' property="description" content={get(Meteor, 'settings.public.title', "Node on FHIR")} />);
  headerTags.push(<title key='title'>{get(Meteor, 'settings.public.title', "Node on FHIR")}</title>);

  if(get(Meteor, 'settings.public.socialmedia')){
    //headerTags.push(<title>{socialmedia.title}</title>);    
    headerTags.push(<link key='canonical' rel="canonical" href={socialmedia.url} />);    
    headerTags.push(<meta prefix="og: http://ogp.me/ns#" key='og:title' property="og:title" content={socialmedia.title} />);
    headerTags.push(<meta prefix="og: http://ogp.me/ns#" key='og:type' property="og:type" content={socialmedia.type} />);
    headerTags.push(<meta prefix="og: http://ogp.me/ns#" key='og:url' property="og:url" content={socialmedia.url} />);
    headerTags.push(<meta prefix="og: http://ogp.me/ns#" key='og:image' property="og:image" content={socialmedia.image} />);
    headerTags.push(<meta prefix="og: http://ogp.me/ns#" key='og:description' property="og:description" content={socialmedia.description} />);
    headerTags.push(<meta prefix="og: http://ogp.me/ns#" key='og:site_name' property="og:site_name" content={socialmedia.site_name} />);
    headerTags.push(<meta prefix="og: http://ogp.me/ns#" key='og:author' property="og:author" content={socialmedia.author} />);
  }

  helmet = <Helmet>
    { headerTags }
  </Helmet>



  // if(theme === "light"){
  //   mainAppStyle.background = backgroundCanvas;
  // } else {
  //   mainAppStyle.background = backgroundCanvasDark;
  // }


  let renderContents = <div { ...otherProps } style={{height: '100vh', display: 'flex', flexDirection: 'column'}}>
    {/* { helmet } */}
    <div id='primaryFlexPanel' style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
      <CustomThemeProvider>
        <Router>
          <Header 
            drawerIsOpen={drawerIsOpen} 
            handleDrawerOpen={handleDrawerOpen} 
            headerNavigation={headerNavigation} 
            history={window.history}
            { ...otherProps } 
          />
          <SideDrawer 
            drawerIsOpen={drawerIsOpen} 
            onDrawerClose={function(){setDrawerIsOpen(false)}}  
            location={props.location} 
            history={window.history}
            { ...otherProps } />        
          <StyledMainRouter style={{flex: 1}} />
          <Footer 
            drawerIsOpen={drawerIsOpen} 
            location={props.location} 
            history={window.history}
            { ...otherProps } 
          />
        </Router>
      </CustomThemeProvider>      
    </div>
  </div>

  return(renderContents)
};

function StyledMainRouter(props){
  
  const {children, style, ...otherProps} = props;
  const { theme, toggleTheme } = useTheme();

  // Track if prominent header is shown
  const showProminentHeader = useTracker(function(){
    const prominentHeaderSetting = get(Meteor, 'settings.public.defaults.prominentHeader', false);
    const selectedPatient = Session.get("selectedPatient");
    const selectedPatientId = Session.get("selectedPatientId");
    // Check if we have either a selected patient object or ID
    const hasPatient = !!(selectedPatient || selectedPatientId);
    return prominentHeaderSetting && hasPatient;
  }, []);

  // Use theme-aware default backgrounds instead of white
  const backgroundCanvas = get(Meteor, 'settings.public.theme.palette.backgroundCanvas', "#f6f6f6");
  const backgroundCanvasDark = get(Meteor, 'settings.public.theme.palette.backgroundCanvasDark', "#121212");

  // Compute background based on current theme
  const backgroundStyle = theme === "light" ? backgroundCanvas : backgroundCanvasDark;

  let mainAppStyle = {
    position: 'relative',
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    transition: 'padding-top 0.3s ease-in-out',
    background: backgroundStyle, // Set background here so it's part of the object
    ...style // Merge the passed style prop
  }

  // Add padding when prominent header is shown
  // The prominent header Toolbar is 64px, so we add that to the top padding
  if(showProminentHeader){
    mainAppStyle.paddingTop = '64px';
  }

  return (<main id='mainAppRouter' style={mainAppStyle}>
    <Routes>
      {dynamicRoutes.map((route, index) => {
        // Check if route requires authentication
        if (route.requireAuth) {
          return (
            <Route 
              key={index} 
              path={route.path} 
              element={<AuthenticatedRoute>{route.element}</AuthenticatedRoute>} 
            />
          );
        }
        return <Route key={index} path={route.path} element={route.element} />;
      })}
      {/* Fallback route for 404 Not Found */}
      <Route path="*" />
    </Routes>
  </main>)
}