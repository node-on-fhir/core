// imports/startup/client/fhir-resource-registry.js
//
// Registers all Honeycomb Detail components with the HoneycombFhirResource dispatcher.
// This lets HoneycombFhirResource route any FHIR resource to the right
// Detail component in embedded mode (e.g. inside ResourceEditor / Column B).

import { registerHoneycombComponents } from '@merkalis/node-on-fhir-merkle-storage/lib/HoneycombFhirResource';

import ActivityDefinitionDetail from '/imports/ui-fhir/activityDefinitions/ActivityDefinitionDetail';
import AllergyIntoleranceDetail from '/imports/ui-fhir/allergyIntolerances/AllergyIntoleranceDetail';
import AppointmentDetail from '/imports/ui-fhir/appointments/AppointmentDetail';
import ArtifactAssessmentDetail from '/imports/ui-fhir/artifactAssessments/ArtifactAssessmentDetail';
import AuditEventDetail from '/imports/ui-fhir/auditEvents/AuditEventDetail';
import BasicDetail from '/imports/ui-fhir/basics/BasicDetail';
import BodyStructureDetail from '/imports/ui-fhir/bodyStructures/BodyStructureDetail';
import BundleDetail from '/imports/ui-fhir/bundles/BundleDetail';
import CarePlanDetail from '/imports/ui-fhir/carePlans/CarePlanDetail';
import CareTeamDetail from '/imports/ui-fhir/careTeams/CareTeamDetail';
import ClaimDetail from '/imports/ui-fhir/claims/ClaimDetail';
import ClinicalImpressionDetail from '/imports/ui-fhir/clinicalImpressions/ClinicalImpressionDetail';
import CodeSystemDetail from '/imports/ui-fhir/codeSystems/CodeSystemDetail';
import CommunicationDetail from '/imports/ui-fhir/communications/CommunicationDetail';
import CompositionDetail from '/imports/ui-fhir/compositions/CompositionDetail';
import ConditionDetail from '/imports/ui-fhir/conditions/ConditionDetail';
import ConsentDetail from '/imports/ui-fhir/consents/ConsentDetail';
import DeviceDetail from '/imports/ui-fhir/devices/DeviceDetail';
import DiagnosticReportDetail from '/imports/ui-fhir/diagnosticReports/DiagnosticReportDetail';
import DocumentReferenceDetail from '/imports/ui-fhir/documentReferences/DocumentReferenceDetail';
import EncounterDetail from '/imports/ui-fhir/encounters/EncounterDetail';
import EndpointDetail from '/imports/ui-fhir/endpoints/EndpointDetail';
import EvidenceDetail from '/imports/ui-fhir/evidences/EvidenceDetail';
import FamilyMemberHistoryDetail from '/imports/ui-fhir/familyMemberHistories/FamilyMemberHistoryDetail';
import GoalDetail from '/imports/ui-fhir/goals/GoalDetail';
import GuidanceResponseDetail from '/imports/ui-fhir/guidanceResponses/GuidanceResponseDetail';
import ImagingStudyDetail from '/imports/ui-fhir/imagingStudies/ImagingStudyDetail';
import ImmunizationDetail from '/imports/ui-fhir/immunizations/ImmunizationDetail';
import LibraryDetail from '/imports/ui-fhir/libraries/LibraryDetail';
import ListDetail from '/imports/ui-fhir/lists/ListDetail';
import LocationDetail from '/imports/ui-fhir/locations/LocationDetail';
import MeasureDetail from '/imports/ui-fhir/measures/MeasureDetail';
import MeasureReportDetail from '/imports/ui-fhir/measureReports/MeasureReportDetail';
import MediaDetail from '/imports/ui-fhir/medias/MediaDetail';
import MedicationDetail from '/imports/ui-fhir/medications/MedicationDetail';
import MedicationAdministrationDetail from '/imports/ui-fhir/medicationAdministrations/MedicationAdministrationDetail';
import MedicationRequestDetail from '/imports/ui-fhir/medicationRequests/MedicationRequestDetail';
import MedicationStatementDetail from '/imports/ui-fhir/medicationStatements/MedicationStatementDetail';
import MessageHeaderDetail from '/imports/ui-fhir/messageHeaders/MessageHeaderDetail';
import NutritionIntakeDetail from '/imports/ui-fhir/nutritionIntakes/NutritionIntakeDetail';
import NutritionOrderDetail from '/imports/ui-fhir/nutritionOrders/NutritionOrderDetail';
import NutritionProductDetail from '/imports/ui-fhir/nutritionProducts/NutritionProductDetail';
import ObservationDetail from '/imports/ui-fhir/observations/ObservationDetail';
import OperationOutcomeDetail from '/imports/ui-fhir/operationOutcomes/OperationOutcomeDetail';
import OrganizationDetail from '/imports/ui-fhir/organizations/OrganizationDetail';
import PatientDetail from '/imports/ui-fhir/patients/PatientDetail';
import PlanDefinitionDetail from '/imports/ui-fhir/planDefinitions/PlanDefinitionDetail';
import PractitionerDetail from '/imports/ui-fhir/practitioners/PractitionerDetail';
import PractitionerRoleDetail from '/imports/ui-fhir/practitionerRoles/PractitionerRoleDetail';
import ProcedureDetail from '/imports/ui-fhir/procedures/ProcedureDetail';
import QuestionnaireDetail from '/imports/ui-fhir/questionnaires/QuestionnaireDetail';
import QuestionnaireResponseDetail from '/imports/ui-fhir/questionnaireResponses/QuestionnaireResponseDetail';
import ResearchStudyDetail from '/imports/ui-fhir/researchStudies/ResearchStudyDetail';
import ResearchSubjectDetail from '/imports/ui-fhir/researchSubjects/ResearchSubjectDetail';
import RiskAssessmentDetail from '/imports/ui-fhir/riskAssessments/RiskAssessmentDetail';
import ScheduleDetail from '/imports/ui-fhir/schedules/ScheduleDetail';
import ServiceRequestDetail from '/imports/ui-fhir/serviceRequests/ServiceRequestDetail';
import SubstanceDetail from '/imports/ui-fhir/substances/SubstanceDetail';
import SupplyDeliveryDetail from '/imports/ui-fhir/supplyDeliveries/SupplyDeliveryDetail';
import SupplyRequestDetail from '/imports/ui-fhir/supplyRequests/SupplyRequestDetail';
import TaskDetail from '/imports/ui-fhir/tasks/TaskDetail';
import ValueSetDetail from '/imports/ui-fhir/valuesets/ValueSetDetail';

// Keys are FHIR resourceType strings (exact match from resource.resourceType)
registerHoneycombComponents({
  'ActivityDefinition': ActivityDefinitionDetail,
  'AllergyIntolerance': AllergyIntoleranceDetail,
  'Appointment': AppointmentDetail,
  'ArtifactAssessment': ArtifactAssessmentDetail,
  'AuditEvent': AuditEventDetail,
  'Basic': BasicDetail,
  'BodyStructure': BodyStructureDetail,
  'Bundle': BundleDetail,
  'CarePlan': CarePlanDetail,
  'CareTeam': CareTeamDetail,
  'Claim': ClaimDetail,
  'ClinicalImpression': ClinicalImpressionDetail,
  'CodeSystem': CodeSystemDetail,
  'Communication': CommunicationDetail,
  'Composition': CompositionDetail,
  'Condition': ConditionDetail,
  'Consent': ConsentDetail,
  'Device': DeviceDetail,
  'DiagnosticReport': DiagnosticReportDetail,
  'DocumentReference': DocumentReferenceDetail,
  'Encounter': EncounterDetail,
  'Endpoint': EndpointDetail,
  'Evidence': EvidenceDetail,
  'FamilyMemberHistory': FamilyMemberHistoryDetail,
  'Goal': GoalDetail,
  'GuidanceResponse': GuidanceResponseDetail,
  'ImagingStudy': ImagingStudyDetail,
  'Immunization': ImmunizationDetail,
  'Library': LibraryDetail,
  'List': ListDetail,
  'Location': LocationDetail,
  'Measure': MeasureDetail,
  'MeasureReport': MeasureReportDetail,
  'Media': MediaDetail,
  'Medication': MedicationDetail,
  'MedicationAdministration': MedicationAdministrationDetail,
  'MedicationRequest': MedicationRequestDetail,
  'MedicationStatement': MedicationStatementDetail,
  'MessageHeader': MessageHeaderDetail,
  'NutritionIntake': NutritionIntakeDetail,
  'NutritionOrder': NutritionOrderDetail,
  'NutritionProduct': NutritionProductDetail,
  'Observation': ObservationDetail,
  'OperationOutcome': OperationOutcomeDetail,
  'Organization': OrganizationDetail,
  'Patient': PatientDetail,
  'PlanDefinition': PlanDefinitionDetail,
  'Practitioner': PractitionerDetail,
  'PractitionerRole': PractitionerRoleDetail,
  'Procedure': ProcedureDetail,
  'Questionnaire': QuestionnaireDetail,
  'QuestionnaireResponse': QuestionnaireResponseDetail,
  'ResearchStudy': ResearchStudyDetail,
  'ResearchSubject': ResearchSubjectDetail,
  'RiskAssessment': RiskAssessmentDetail,
  'Schedule': ScheduleDetail,
  'ServiceRequest': ServiceRequestDetail,
  'Substance': SubstanceDetail,
  'SupplyDelivery': SupplyDeliveryDetail,
  'SupplyRequest': SupplyRequestDetail,
  'Task': TaskDetail,
  'ValueSet': ValueSetDetail
});

console.log('[fhir-resource-registry] Registered 62 Honeycomb Detail components with HoneycombFhirResource dispatcher');
