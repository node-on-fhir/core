// /imports/ui-details/index.js
// Central registry and exports for all FHIR Detail components
// This virtual directory provides a component-type-centric view of the codebase

import { Meteor } from 'meteor/meteor';

// Import all detail components from their resource-centric locations
export { default as ActivityDefinitionDetail } from '../ui-fhir/activityDefinitions/ActivityDefinitionDetail';
export { default as AllergyIntoleranceDetail } from '../ui-fhir/allergyIntolerances/AllergyIntoleranceDetail';
export { default as ArtifactAssessmentDetail } from '../ui-fhir/artifactAssessments/ArtifactAssessmentDetail';
export { default as BasicDetail } from '../ui-fhir/basics/BasicDetail';
export { default as BundleDetail } from '../ui-fhir/bundles/BundleDetail';
export { default as CarePlanDetail } from '../ui-fhir/carePlans/CarePlanDetail';
export { default as CareTeamDetail } from '../ui-fhir/careTeams/CareTeamDetail';
export { default as ClaimDetail } from '../ui-fhir/claims/ClaimDetail';
export { default as CodeSystemDetail } from '../ui-fhir/codeSystems/CodeSystemDetail';
export { default as CommunicationDetail } from '../ui-fhir/communications/CommunicationDetail';
export { default as CompositionDetail } from '../ui-fhir/compositions/CompositionDetail';
export { default as ConditionDetail } from '../ui-fhir/conditions/ConditionDetail';
export { default as ConsentDetail } from '../ui-fhir/consents/ConsentDetail';
export { default as DeviceDetail } from '../ui-fhir/devices/DeviceDetail';
export { default as DiagnosticReportDetail } from '../ui-fhir/diagnosticReports/DiagnosticReportDetail';
export { default as DocumentReferenceDetail } from '../ui-fhir/documentReferences/DocumentReferenceDetail';
export { default as EncounterDetail } from '../ui-fhir/encounters/EncounterDetail';
export { default as EvidenceDetail } from '../ui-fhir/evidences/EvidenceDetail';
export { default as GoalDetail } from '../ui-fhir/goals/GoalDetail';
export { default as GuidanceResponseDetail } from '../ui-fhir/guidanceResponses/GuidanceResponseDetail';
export { default as ImmunizationDetail } from '../ui-fhir/immunizations/ImmunizationDetail';
export { default as LibraryDetail } from '../ui-fhir/libraries/LibraryDetail';
export { default as ListDetail } from '../ui-fhir/lists/ListDetail';
export { default as LocationDetail } from '../ui-fhir/locations/LocationDetail';
export { default as MedicationAdministrationDetail } from '../ui-fhir/medicationAdministrations/MedicationAdministrationDetail';
export { default as MedicationRequestDetail } from '../ui-fhir/medicationRequests/MedicationRequestDetail';
export { default as MedicationDetail } from '../ui-fhir/medications/MedicationDetail';
export { default as MedicationStatementDetail } from '../ui-fhir/medicationStatements/MedicationStatementDetail';
export { default as NutritionOrderDetail } from '../ui-fhir/nutritionOrders/NutritionOrderDetail';
export { default as ObservationDetail } from '../ui-fhir/observations/ObservationDetail';
export { default as OperationOutcomeDetail } from '../ui-fhir/operationOutcomes/OperationOutcomeDetail';
export { default as PatientDetail } from '../ui-fhir/patients/PatientDetail';
export { default as PlanDefinitionDetail } from '../ui-fhir/planDefinitions/PlanDefinitionDetail';
export { default as PractitionerDetail } from '../ui-fhir/practitioners/PractitionerDetail';
export { default as ProcedureDetail } from '../ui-fhir/procedures/ProcedureDetail';
export { default as QuestionnaireResponseDetail } from '../ui-fhir/questionnaireResponses/QuestionnaireResponseDetail';
export { default as QuestionnaireDetail } from '../ui-fhir/questionnaires/QuestionnaireDetail';
export { default as ResearchStudyDetail } from '../ui-fhir/researchStudies/ResearchStudyDetail';
export { default as ResearchSubjectDetail } from '../ui-fhir/researchSubjects/ResearchSubjectDetail';
export { default as ServiceRequestDetail } from '../ui-fhir/serviceRequests/ServiceRequestDetail';
export { default as SupplyDeliveryDetail } from '../ui-fhir/supplyDeliveries/SupplyDeliveryDetail';
export { default as TaskDetail } from '../ui-fhir/tasks/TaskDetail';
export { default as ValueSetDetail } from '../ui-fhir/valuesets/ValueSetDetail';

// Note: Components are automatically available when imported in App.jsx
// The virtual index exports allow clean imports like:
// import { PatientDetail, ConditionDetail } from '/imports/ui-details';