// /imports/ui-tables/index.js
// Central registry and exports for all FHIR Table components
// This virtual directory provides a component-type-centric view of the codebase

import { Meteor } from 'meteor/meteor';

// Import all table components from their resource-centric locations
export { default as ActivityDefinitionsTable } from '../ui-fhir/activityDefinitions/ActivityDefinitionsTable';
export { default as AllergyIntolerancesTable } from '../ui-fhir/allergyIntolerances/AllergyIntolerancesTable';
export { default as ArtifactAssessmentsTable } from '../ui-fhir/artifactAssessments/ArtifactAssessmentsTable';
export { default as BasicsTable } from '../ui-fhir/basics/BasicsTable';
export { default as BundlesTable } from '../ui-fhir/bundles/BundlesTable';
export { default as ActivitiesTable } from '../ui-fhir/carePlans/ActivitiesTable';
export { default as CarePlansTable } from '../ui-fhir/carePlans/CarePlansTable';
export { default as CareTeamsTable } from '../ui-fhir/careTeams/CareTeamsTable';
export { default as ClaimsTable } from '../ui-fhir/claims/ClaimsTable';
export { default as CodeSystemsTable } from '../ui-fhir/codeSystems/CodeSystemsTable';
export { default as CodeSystemsConceptsTable } from '../ui-fhir/codeSystems/CodeSystemsConceptsTable';
export { default as CommunicationsTable } from '../ui-fhir/communications/CommunicationsTable';
export { default as CompositionsTable } from '../ui-fhir/compositions/CompositionsTable';
export { default as ConditionsTable } from '../ui-fhir/conditions/ConditionsTable';
export { default as ConsentsTable } from './ConsentsTable'; // TODO: Move to ui-fhir
export { default as DevicesTable } from '../ui-fhir/devices/DevicesTable';
export { default as DocumentReferencesTable } from '../ui-fhir/documentReferences/DocumentReferencesTable';
export { default as EncountersTable } from '../ui-fhir/encounters/EncountersTable';
export { default as EndpointsTable } from './EndpointsTable'; // TODO: Move to ui-fhir
export { default as EvidencesTable } from '../ui-fhir/evidences/EvidencesTable';
export { default as GoalsTable } from '../ui-fhir/goals/GoalsTable';
export { default as GuidanceResponsesTable } from '../ui-fhir/guidanceResponses/GuidanceResponsesTable';
export { default as ImmunizationsTable } from '../ui-fhir/immunizations/ImmunizationsTable';
export { default as LibrariesTable } from '../ui-fhir/libraries/LibrariesTable';
export { default as ListsTable } from '../ui-fhir/lists/ListsTable';
export { default as LocationsTable } from '../ui-fhir/locations/LocationsTable';
export { default as MedicationAdministrationsTable } from '../ui-fhir/medicationAdministrations/MedicationAdministrationsTable';
export { default as MedicationRequestsTable } from '../ui-fhir/medicationRequests/MedicationRequestsTable';
export { default as MedicationsTable } from '../ui-fhir/medications/MedicationsTable';
export { default as MedicationStatementsTable } from '../ui-fhir/medicationStatements/MedicationStatementsTable';
export { default as NutritionOrdersTable } from '../ui-fhir/nutritionOrders/NutritionOrdersTable';
export { default as ObservationsTable } from '../ui-fhir/observations/ObservationsTable';
export { default as OperationOutcomesTable } from '../ui-fhir/operationOutcomes/OperationOutcomesTable';
export { default as PatientsTable } from './PatientsTable'; // TODO: Move to ui-fhir
export { default as PersonsTable } from './PersonsTable'; // TODO: Move to ui-fhir
export { default as PlanDefinitionsTable } from '../ui-fhir/planDefinitions/PlanDefinitionsTable';
export { default as PractitionersTable } from '../ui-fhir/practitioners/PractitionersTable';
export { default as ProceduresTable } from '../ui-fhir/procedures/ProceduresTable';
export { default as QuestionnaireResponsesTable } from '../ui-fhir/questionnaireResponses/QuestionnaireResponsesTable';
export { default as QuestionnairesTable } from '../ui-fhir/questionnaires/QuestionnairesTable';
export { default as ResearchStudiesTable } from '../ui-fhir/researchStudies/ResearchStudiesTable';
export { default as ResearchSubjectsTable } from '../ui-fhir/researchSubjects/ResearchSubjectsTable';
export { default as ServiceRequestsTable } from '../ui-fhir/serviceRequests/ServiceRequestsTable';
export { default as TasksTable } from '../ui-fhir/tasks/TasksTable';
export { default as ValueSetsTable } from '../ui-fhir/valuesets/ValueSetsTable';

// Note: Components are automatically registered on Meteor.Tables when imported in App.jsx
// The virtual index exports allow clean imports like:
// import { PatientsTable, ConditionsTable } from '/imports/ui-tables';