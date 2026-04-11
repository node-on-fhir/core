// /imports/ui-pages/index.js
// Central registry and exports for all FHIR Page components
// This virtual directory provides a component-type-centric view of the codebase

import { Meteor } from 'meteor/meteor';

// Import all page components from their resource-centric locations
export { default as ActivityDefinitionsPage } from '../ui-fhir/activityDefinitions/ActivityDefinitionsPage';
export { default as AllergyIntolerancesPage } from '../ui-fhir/allergyIntolerances/AllergyIntolerancesPage';
export { default as ArtifactAssessmentsPage } from '../ui-fhir/artifactAssessments/ArtifactAssessmentsPage';
export { default as BasicsPage } from '../ui-fhir/basics/BasicsPage';
export { default as BundlesPage } from '../ui-fhir/bundles/BundlesPage';
export { default as CarePlanDesignerPage } from '../ui-fhir/carePlans/CarePlanDesignerPage';
export { default as CarePlanDetailPage } from '../ui-fhir/carePlans/CarePlanDetailPage';
export { default as CarePlansPage } from '../ui-fhir/carePlans/CarePlansPage';
export { default as CareTeamsPage } from '../ui-fhir/careTeams/CareTeamsPage';
export { default as ClaimsPage } from '../ui-fhir/claims/ClaimsPage';
export { default as CodeSystemsPage } from '../ui-fhir/codeSystems/CodeSystemsPage';
export { default as CommunicationsPage } from '../ui-fhir/communications/CommunicationsPage';
export { default as CompositionsPage } from '../ui-fhir/compositions/CompositionsPage';
export { default as ConditionsPage } from '../ui-fhir/conditions/ConditionsPage';
export { default as ConsentsPage } from '../ui-fhir/consents/ConsentsPage';
export { default as DevicesPage } from '../ui-fhir/devices/DevicesPage';
export { default as DiagnosticReportsPage } from '../ui-fhir/diagnosticReports/DiagnosticReportsPage';
export { default as DocumentReferencesPage } from '../ui-fhir/documentReferences/DocumentReferencesPage';
export { default as EncountersPage } from '../ui-fhir/encounters/EncountersPage';
export { default as EpisodeOfCaresPage } from '../ui-fhir/episodeOfCares/EpisodeOfCaresPage';
export { default as EvidencesPage } from '../ui-fhir/evidences/EvidencesPage';
export { default as GoalsPage } from '../ui-fhir/goals/GoalsPage';
export { default as GuidanceResponsesPage } from '../ui-fhir/guidanceResponses/GuidanceResponsesPage';
export { default as ImmunizationsPage } from '../ui-fhir/immunizations/ImmunizationsPage';
export { default as LibrariesPage } from '../ui-fhir/libraries/LibrariesPage';
export { default as ListsPage } from '../ui-fhir/lists/ListsPage';
export { default as LocationsPage } from '../ui-fhir/locations/LocationsPage';
export { default as MedicationAdministrationsPage } from '../ui-fhir/medicationAdministrations/MedicationAdministrationsPage';
export { default as MedicationRequestsPage } from '../ui-fhir/medicationRequests/MedicationRequestsPage';
export { default as MedicationsPage } from '../ui-fhir/medications/MedicationsPage';
export { default as MedicationStatementsPage } from '../ui-fhir/medicationStatements/MedicationStatementsPage';
export { default as MolecularSequencesPage } from '../ui-fhir/molecularSequences/MolecularSequencesPage';
export { default as NutritionOrdersPage } from '../ui-fhir/nutritionOrders/NutritionOrdersPage';
export { default as ObservationsPage } from '../ui-fhir/observations/ObservationsPage';
export { default as OperationOutcomesPage } from '../ui-fhir/operationOutcomes/OperationOutcomesPage';
export { default as PlanDefinitionsPage } from '../ui-fhir/planDefinitions/PlanDefinitionsPage';
export { default as PractitionersPage } from '../ui-fhir/practitioners/PractitionersPage';
export { default as ProceduresPage } from '../ui-fhir/procedures/ProceduresPage';
export { default as QuestionnaireResponsesPage } from '../ui-fhir/questionnaireResponses/QuestionnaireResponsesPage';
export { default as QuestionnairesDesignerPartialPage } from '../ui-fhir/questionnaires/QuestionnairesDesignerPartialPage';
export { default as QuestionnairesPage } from '../ui-fhir/questionnaires/QuestionnairesPage';
export { default as ResearchStudiesPage } from '../ui-fhir/researchStudies/ResearchStudiesPage';
export { default as ResearchSubjectsPage } from '../ui-fhir/researchSubjects/ResearchSubjectsPage';
export { default as ServiceRequestsPage } from '../ui-fhir/serviceRequests/ServiceRequestsPage';
export { default as SupplyDeliveriesPage } from '../ui-fhir/supplyDeliveries/SupplyDeliveriesPage';
export { default as TasksPage } from '../ui-fhir/tasks/TasksPage';
export { default as ValueSetsPage } from '../ui-fhir/valuesets/ValueSetsPage';

// Note: Components are automatically available when imported in App.jsx
// The virtual index exports allow clean imports like:
// import { PatientsPage, ConditionsPage } from '/imports/ui-pages';