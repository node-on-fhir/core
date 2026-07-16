import React from 'react';

// Register the Directory.* collections (CMS National Directory mirror) into the
// client Collections registry so client-side lookups resolve symmetrically with
// the server. See lib/DirectoryCollections.js.
import { registerDirectoryCollections } from './lib/DirectoryCollections';
registerDirectoryCollections();

// The main provider-directory page. The file is client/ProviderDirectory.jsx;
// its default export is still internally named MainPage. The Atmosphere index.jsx
// imported it as ./client/MainPage — a stale path from before the file rename.
import MainPage from './client/ProviderDirectory';
// NOTE: /baseR4 is owned by the host app (imports/ui/pages/FhirBasePage.jsx).
// The package's FhirBasePage was a fully-commented-out dead stub and has been removed.

// Dialogs (all present in client/). The FAST-security / UDAP cert pages
// (ServerConfiguration, CertificateStorage, OauthClients, UdapRegistration,
// BackendServicesConfig) + About/Privacy/Terms were moved to scratch/ (disabled
// WIP) and are not routed here.
import SearchValueSetsDialog from './client/SearchValueSetsDialog';
import SearchStatesDialog from './client/SearchStatesDialog';
import SearchResourceTypesDialog from './client/SearchResourceTypesDialog';
import PreferencesDialog from './client/PreferencesDialog';
import SearchCodeSystemDialog from './client/SearchCodeSystemDialog';
import SearchLibraryOfMedicineDialog from './client/SearchLibraryOfMedicineDialog';

// ServerConfiguration panel tab (empty placeholder card for now). Discovered off
// the WorkflowRegistry `serverConfigs` default export and rendered as a tab by
// imports/ui-vault-server/ServerConfigurationPage.jsx.
import ServerConfiguration from './client/components/ServerConfiguration';

import {
  CardContent,
  DialogContent
} from '@mui/material';

// Resource detail components, repointed to their homes in the app:
//  - ui-details barrel (the common resources)
import {
  CodeSystemDetail, ValueSetDetail, CareTeamDetail, CommunicationDetail,
  LocationDetail, PractitionerDetail, TaskDetail
} from '/imports/ui-details';
//  - individual ui-fhir modules (directory resources still present in the app)
import OrganizationDetail from '/imports/ui-fhir/organizations/OrganizationDetail';
import EndpointDetail from '/imports/ui-fhir/endpoints/EndpointDetail';
import PractitionerRoleDetail from '/imports/ui-fhir/practitionerRoles/PractitionerRoleDetail';
//  - compat placeholders for Detail views with no home in the current app
//    (and NewCertificateDialog, whose page was moved to scratch/)
import {
  HealthcareServiceDetail, InsurancePlanDetail, NetworkDetail,
  OrganizationAffiliationDetail, ProvenanceDetail, RelatedPersonDetail,
  RestrictionDetail, SearchParameterDetail, StructureDefinitionDetail,
  VerificationResultDetail, CommunicationRequestDetail, NewCertificateDialog,
  AboutNatDirDialog
} from './client/_compat/MissingDetails';


// Routes use `element:` (the host's App.jsx renders route.element; the legacy
// `component:` form is no longer supported). The FAST-security/UDAP cert pages
// (server-configuration, certificate-storage, oauth-clients, udap-registration,
// backend-services-config) + terms/privacy were moved to scratch/ and are not
// routed.
let DynamicRoutes = [{
  name: 'ProviderDirectory',
  path: '/provider-directory',
  element: <MainPage />,
  requireAuth: true
}]

// Sidebar pointed only at the scratch/ FAST-security pages (now disabled), so it
// is reduced to the provider directory itself.
let SidebarWorkflows = [{
  'primaryText': 'Provider Directory',
  'to': '/provider-directory',
  'iconName': 'Business'
}]


import { 
  VhDirFooterButtons,
  CareTeamsFooterButtons,
  CodeSystemsFooterButtons,
  CommunicationsFooterButtons,
  CommunicationRequestsFooterButtons,
  EndpointsFooterButtons,
  HealthcareServicesFooterButtons,
  InsurancePlansFooterButtons,
  LocationsFooterButtons,
  NetworksFooterButtons,
  OrganizationsFooterButtons,
  OrganizationAffiliationsFooterButtons,
  PractitionersFooterButtons,
  PractitionerRolesFooterButtons,
  ProvenancesFooterButtons,
  RelatedPersonsFooterButtons,
  RestrictionsFooterButtons,
  SearchParametersFooterButtons,
  StructureDefinitionsFooterButtons,
  TasksFooterButtons,
  ValueSetsFooterButtons,
  VerificationResultsFooterButtons,
  LibraryOfMedicineButtons,

  CertificatesButtons,
  AddCertificateDialogActions,

  DefaultPostDialogActions
} from './client/FooterButtons';

let FooterButtons = [{
  pathname: '/provider-directory',
  element: <VhDirFooterButtons />
}, {
  pathname: '/careteams',
  element: <CareTeamsFooterButtons />
}, {
  pathname: '/code-systems',
  element: <CodeSystemsFooterButtons />
}, {
  pathname: '/communications',
  element: <CommunicationsFooterButtons />
}, {
  pathname: '/communication-requests',
  element: <CommunicationRequestsFooterButtons />
}, {
  pathname: '/endpoints',
  element: <EndpointsFooterButtons />
}, {
  pathname: '/healthcare-services',
  element: <HealthcareServicesFooterButtons />
}, {
  pathname: '/insurance-plans',
  element: <InsurancePlansFooterButtons />
}, {
  pathname: '/locations',
  element: <LocationsFooterButtons />
}, {
  pathname: '/networks',
  element: <NetworksFooterButtons />
}, {
  pathname: '/organizations',
  element: <OrganizationsFooterButtons />
}, {
  pathname: '/organization-affiliations',
  element: <OrganizationAffiliationsFooterButtons />
}, {
  pathname: '/practitioners',
  element: <PractitionersFooterButtons />
}, {
  pathname: '/practitioner-roles',
  element: <PractitionerRolesFooterButtons />
}, {
  pathname: '/provenances',
  element: <ProvenancesFooterButtons />
}, {
  pathname: '/related-persons',
  element: <RelatedPersonsFooterButtons />
}, {
  pathname: '/restrictions',
  element: <RestrictionsFooterButtons />
}, {
  pathname: '/search-parameters',
  element: <SearchParametersFooterButtons />
}, {
  pathname: '/structure-definitions',
  element: <StructureDefinitionsFooterButtons />
}, {
  pathname: '/tasks',
  element: <TasksFooterButtons />
}, {
  pathname: '/valuesets',
  element: <ValueSetsFooterButtons />
}, {
  pathname: '/verification-results',
  element: <VerificationResultsFooterButtons />
}, {
  pathname: '/certificate-storage-page',
  element: <CertificatesButtons />
}];




let DialogComponents = [{
  name: "AboutNatDirDialog",
  component: <DialogContent><AboutNatDirDialog /></DialogContent>
}, {
  name: "SearchResourceTypesDialog",
  component: <DialogContent><SearchResourceTypesDialog /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="ValueSet" />
}, {
  name: "SearchStatesDialog",
  component: <DialogContent><SearchStatesDialog /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="ValueSet" />
}, {
  name: "PreferencesDialog",
  component: <DialogContent><PreferencesDialog /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="ValueSet" />
}, {
//   name: "SearchCodeSystemDialog",
//   component: <DialogContent><SearchCodeSystemDialog /></DialogContent>,
//   actions: <DefaultPostDialogActions resourceType="ValueSet" />
// }, {
//   name: "SearchValueSetsDialog",
//   component: <DialogContent><SearchValueSetsDialog /></DialogContent>,
//   actions: <DefaultPostDialogActions resourceType="ValueSet" />
// }, {
  name: "CareTeamDetail",
  component: <DialogContent><CareTeamDetail /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="CareTeam" />
}, {
  name: "CodeSystemDetail",
  component: <DialogContent><CodeSystemDetail /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="CodeSystem" />
}, {
  name: "CommunicationDetail",
  component: <DialogContent><CommunicationDetail /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="Communication" />
}, {
  name: "CommunicationRequestDetail",
  component: <DialogContent><CommunicationRequestDetail /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="CommunicationRequest" />
}, {
  name: "EndpointDetail",
  component: <DialogContent><EndpointDetail /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="Endpoint" />
}, {
  name: "HealthcareServiceDetail",
  component: <DialogContent><HealthcareServiceDetail /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="HealthcareService" />
}, {
  name: "InsurancePlanDetail",
  component: <DialogContent><InsurancePlanDetail /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="InsurancePlan" />
}, {
  name: "LocationDetail",
  component: <DialogContent><LocationDetail /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="Location" />
}, {
  name: "NetworkDetail",
  component: <DialogContent><NetworkDetail /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="Network" />
}, {
  name: "OrganizationDetail",
  component: <DialogContent><OrganizationDetail /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="Organization" />
}, {
  name: "OrganizationAffiliationDetail",
  component: <DialogContent><OrganizationAffiliationDetail /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="OrganizationAffiliation" />
}, {
  name: "PractitionerDetail",
  component: <DialogContent><PractitionerDetail /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="Practitioner" />
}, {
  name: "PractitionerRoleDetail",
  component: <DialogContent><PractitionerRoleDetail /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="PractitionerRole" />
}, {
  name: "ProvenanceDetail",
  component: <DialogContent><ProvenanceDetail /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="Provenance" />
}, {
  name: "RelatedPersonDetail",
  component: <DialogContent><RelatedPersonDetail /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="RelatedPerson" />
}, {
  name: "RestrictionDetail",
  component: <DialogContent><RestrictionDetail /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="Restriction" />
}, {
  name: "SearchParameterDetail",
  component: <DialogContent><SearchParameterDetail /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="SearchParameter" />
}, {
  name: "StructureDefinitionDetail",
  component: <DialogContent><StructureDefinitionDetail /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="StructureDefinition" />
}, {
  name: "TaskDetail",
  component: <DialogContent><TaskDetail /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="Task" />
}, {
  name: "ValueSetDetail",
  component: <DialogContent><ValueSetDetail /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="ValueSet" />
}, {
  name: "VerificationResultDetail",
  component: <DialogContent><VerificationResultDetail /></DialogContent>,
  actions: <DefaultPostDialogActions resourceType="VerificationResult" />
}, {
  name: "NewCertificateDialog",
  component: <DialogContent><NewCertificateDialog /></DialogContent>,
  actions: <AddCertificateDialogActions />
}, {
  name: "SearchLibraryOfMedicineDialog",
  component: <DialogContent><SearchLibraryOfMedicineDialog /></DialogContent>,
  actions: <AddCertificateDialogActions />
}];



// Server configuration tabs — rendered in the host's ServerConfiguration panel,
// discovered via WorkflowRegistry.getServerConfigsWithNames(). Empty card for now.
let ServerConfigs = [
  <ServerConfiguration key="provider-directory-server-config" />
];

export {
  FooterButtons,
  DialogComponents,
  DynamicRoutes,
  SidebarWorkflows,
  ServerConfigs,
  MainPage
};

// WorkflowRegistry default export (added for the NPM migration).
export default {
  name: 'provider-directory',
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows,
  footerButtons: FooterButtons,
  serverConfigs: ServerConfigs
};
