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
export { default as ConsentsTable } from '../ui-fhir/consents/ConsentsTable';
export { default as DevicesTable } from '../ui-fhir/devices/DevicesTable';
export { default as DiagnosticReportsTable } from '../ui-fhir/diagnosticReports/DiagnosticReportsTable';
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
export { default as MessageHeadersTable } from '../ui-fhir/messageHeaders/MessageHeadersTable';
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

// Import all tables to register on Meteor.Tables
import ActivityDefinitionsTable from '../ui-fhir/activityDefinitions/ActivityDefinitionsTable';
import AllergyIntolerancesTable from '../ui-fhir/allergyIntolerances/AllergyIntolerancesTable';
import ArtifactAssessmentsTable from '../ui-fhir/artifactAssessments/ArtifactAssessmentsTable';
import BasicsTable from '../ui-fhir/basics/BasicsTable';
import BundlesTable from '../ui-fhir/bundles/BundlesTable';
import ActivitiesTable from '../ui-fhir/carePlans/ActivitiesTable';
import CarePlansTable from '../ui-fhir/carePlans/CarePlansTable';
import CareTeamsTable from '../ui-fhir/careTeams/CareTeamsTable';
import ClaimsTable from '../ui-fhir/claims/ClaimsTable';
import CodeSystemsTable from '../ui-fhir/codeSystems/CodeSystemsTable';
import CodeSystemsConceptsTable from '../ui-fhir/codeSystems/CodeSystemsConceptsTable';
import CommunicationsTable from '../ui-fhir/communications/CommunicationsTable';
import CompositionsTable from '../ui-fhir/compositions/CompositionsTable';
import ConditionsTable from '../ui-fhir/conditions/ConditionsTable';
import ConsentsTable from '../ui-fhir/consents/ConsentsTable';
import DevicesTable from '../ui-fhir/devices/DevicesTable';
import DiagnosticReportsTable from '../ui-fhir/diagnosticReports/DiagnosticReportsTable';
import DocumentReferencesTable from '../ui-fhir/documentReferences/DocumentReferencesTable';
import EncountersTable from '../ui-fhir/encounters/EncountersTable';
import EndpointsTable from './EndpointsTable';
import EvidencesTable from '../ui-fhir/evidences/EvidencesTable';
import GoalsTable from '../ui-fhir/goals/GoalsTable';
import GuidanceResponsesTable from '../ui-fhir/guidanceResponses/GuidanceResponsesTable';
import ImmunizationsTable from '../ui-fhir/immunizations/ImmunizationsTable';
import LibrariesTable from '../ui-fhir/libraries/LibrariesTable';
import ListsTable from '../ui-fhir/lists/ListsTable';
import LocationsTable from '../ui-fhir/locations/LocationsTable';
import MedicationAdministrationsTable from '../ui-fhir/medicationAdministrations/MedicationAdministrationsTable';
import MedicationRequestsTable from '../ui-fhir/medicationRequests/MedicationRequestsTable';
import MedicationsTable from '../ui-fhir/medications/MedicationsTable';
import MedicationStatementsTable from '../ui-fhir/medicationStatements/MedicationStatementsTable';
import MessageHeadersTable from '../ui-fhir/messageHeaders/MessageHeadersTable';
import NutritionOrdersTable from '../ui-fhir/nutritionOrders/NutritionOrdersTable';
import ObservationsTable from '../ui-fhir/observations/ObservationsTable';
import OperationOutcomesTable from '../ui-fhir/operationOutcomes/OperationOutcomesTable';
import PatientsTable from './PatientsTable';
import PersonsTable from './PersonsTable';
import PlanDefinitionsTable from '../ui-fhir/planDefinitions/PlanDefinitionsTable';
import PractitionersTable from '../ui-fhir/practitioners/PractitionersTable';
import ProceduresTable from '../ui-fhir/procedures/ProceduresTable';
import QuestionnaireResponsesTable from '../ui-fhir/questionnaireResponses/QuestionnaireResponsesTable';
import QuestionnairesTable from '../ui-fhir/questionnaires/QuestionnairesTable';
import ResearchStudiesTable from '../ui-fhir/researchStudies/ResearchStudiesTable';
import ResearchSubjectsTable from '../ui-fhir/researchSubjects/ResearchSubjectsTable';
import ServiceRequestsTable from '../ui-fhir/serviceRequests/ServiceRequestsTable';
import TasksTable from '../ui-fhir/tasks/TasksTable';
import ValueSetsTable from '../ui-fhir/valuesets/ValueSetsTable';

// Auto-registration on Meteor.Tables when client starts up
if (Meteor.isClient) {
  Meteor.startup(function() {
    if (!Meteor.Tables) {
      Meteor.Tables = {};
    }
    
    // Register all tables
    Object.assign(Meteor.Tables, {
      ActivityDefinitionsTable,
      AllergyIntolerancesTable,
      ArtifactAssessmentsTable,
      BasicsTable,
      BundlesTable,
      ActivitiesTable,
      CarePlansTable,
      CareTeamsTable,
      ClaimsTable,
      CodeSystemsTable,
      CodeSystemsConceptsTable,
      CommunicationsTable,
      CompositionsTable,
      ConditionsTable,
      ConsentsTable,
      DevicesTable,
      DiagnosticReportsTable,
      DocumentReferencesTable,
      EncountersTable,
      EndpointsTable,
      EvidencesTable,
      GoalsTable,
      GuidanceResponsesTable,
      ImmunizationsTable,
      LibrariesTable,
      ListsTable,
      LocationsTable,
      MedicationAdministrationsTable,
      MedicationRequestsTable,
      MedicationsTable,
      MedicationStatementsTable,
      MessageHeadersTable,
      NutritionOrdersTable,
      ObservationsTable,
      OperationOutcomesTable,
      PatientsTable,
      PersonsTable,
      PlanDefinitionsTable,
      PractitionersTable,
      ProceduresTable,
      QuestionnaireResponsesTable,
      QuestionnairesTable,
      ResearchStudiesTable,
      ResearchSubjectsTable,
      ServiceRequestsTable,
      TasksTable,
      ValueSetsTable
    });
    
    console.log('Registered ' + Object.keys(Meteor.Tables).length + ' FHIR Table components on Meteor.Tables');
  });
}