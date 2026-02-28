// imports/startup/client/fhir-preview-registry.js
//
// Registers all Honeycomb Preview components with the DynamicFhirViews dispatcher.
// This lets DynamicFhirViews route any FHIR resource to the right
// Preview component in read-only mode (e.g. inside ResourceViewer / Column B).

import { registerDynamicFhirViewComponents } from '/imports/lib/DynamicFhirViews';

import ActivityDefinitionPreview from '/imports/ui-fhir/activityDefinitions/ActivityDefinitionPreview';
import AllergyIntolerancePreview from '/imports/ui-fhir/allergyIntolerances/AllergyIntolerancePreview';
import AppointmentPreview from '/imports/ui-fhir/appointments/AppointmentPreview';
import ArtifactAssessmentPreview from '/imports/ui-fhir/artifactAssessments/ArtifactAssessmentPreview';
import AuditEventPreview from '/imports/ui-fhir/auditEvents/AuditEventPreview';
import BasicPreview from '/imports/ui-fhir/basics/BasicPreview';
import BodyStructurePreview from '/imports/ui-fhir/bodyStructures/BodyStructurePreview';
import BundlePreview from '/imports/ui-fhir/bundles/BundlePreview';
import CarePlanPreview from '/imports/ui-fhir/carePlans/CarePlanPreview';
import CareTeamPreview from '/imports/ui-fhir/careTeams/CareTeamPreview';
import ClaimPreview from '/imports/ui-fhir/claims/ClaimPreview';
import ClinicalImpressionPreview from '/imports/ui-fhir/clinicalImpressions/ClinicalImpressionPreview';
import CodeSystemPreview from '/imports/ui-fhir/codeSystems/CodeSystemPreview';
import CommunicationPreview from '/imports/ui-fhir/communications/CommunicationPreview';
import CompositionPreview from '/imports/ui-fhir/compositions/CompositionPreview';
import ConditionPreview from '/imports/ui-fhir/conditions/ConditionPreview';
import ConsentPreview from '/imports/ui-fhir/consents/ConsentPreview';
import DevicePreview from '/imports/ui-fhir/devices/DevicePreview';
import DiagnosticReportPreview from '/imports/ui-fhir/diagnosticReports/DiagnosticReportPreview';
import DocumentReferencePreview from '/imports/ui-fhir/documentReferences/DocumentReferencePreview';
import EncounterPreview from '/imports/ui-fhir/encounters/EncounterPreview';
import EndpointPreview from '/imports/ui-fhir/endpoints/EndpointPreview';
import EvidencePreview from '/imports/ui-fhir/evidences/EvidencePreview';
import FamilyMemberHistoryPreview from '/imports/ui-fhir/familyMemberHistories/FamilyMemberHistoryPreview';
import GoalPreview from '/imports/ui-fhir/goals/GoalPreview';
import GuidanceResponsePreview from '/imports/ui-fhir/guidanceResponses/GuidanceResponsePreview';
import ImagingStudyPreview from '/imports/ui-fhir/imagingStudies/ImagingStudyPreview';
import ImmunizationPreview from '/imports/ui-fhir/immunizations/ImmunizationPreview';
import LibraryPreview from '/imports/ui-fhir/libraries/LibraryPreview';
import ListPreview from '/imports/ui-fhir/lists/ListPreview';
import LocationPreview from '/imports/ui-fhir/locations/LocationPreview';
import MeasurePreview from '/imports/ui-fhir/measures/MeasurePreview';
import MeasureReportPreview from '/imports/ui-fhir/measureReports/MeasureReportPreview';
import MediaPreview from '/imports/ui-fhir/medias/MediaPreview';
import MedicationPreview from '/imports/ui-fhir/medications/MedicationPreview';
import MedicationAdministrationPreview from '/imports/ui-fhir/medicationAdministrations/MedicationAdministrationPreview';
import MedicationRequestPreview from '/imports/ui-fhir/medicationRequests/MedicationRequestPreview';
import MedicationStatementPreview from '/imports/ui-fhir/medicationStatements/MedicationStatementPreview';
import MessageHeaderPreview from '/imports/ui-fhir/messageHeaders/MessageHeaderPreview';
import NutritionIntakePreview from '/imports/ui-fhir/nutritionIntakes/NutritionIntakePreview';
import NutritionOrderPreview from '/imports/ui-fhir/nutritionOrders/NutritionOrderPreview';
import NutritionProductPreview from '/imports/ui-fhir/nutritionProducts/NutritionProductPreview';
import ObservationPreview from '/imports/ui-fhir/observations/ObservationPreview';
import OperationOutcomePreview from '/imports/ui-fhir/operationOutcomes/OperationOutcomePreview';
import OrganizationPreview from '/imports/ui-fhir/organizations/OrganizationPreview';
import PatientPreview from '/imports/ui-fhir/patients/PatientPreview';
import PlanDefinitionPreview from '/imports/ui-fhir/planDefinitions/PlanDefinitionPreview';
import PractitionerPreview from '/imports/ui-fhir/practitioners/PractitionerPreview';
import PractitionerRolePreview from '/imports/ui-fhir/practitionerRoles/PractitionerRolePreview';
import ProcedurePreview from '/imports/ui-fhir/procedures/ProcedurePreview';
import QuestionnairePreview from '/imports/ui-fhir/questionnaires/QuestionnairePreview';
import QuestionnaireResponsePreview from '/imports/ui-fhir/questionnaireResponses/QuestionnaireResponsePreview';
import ResearchStudyPreview from '/imports/ui-fhir/researchStudies/ResearchStudyPreview';
import ResearchSubjectPreview from '/imports/ui-fhir/researchSubjects/ResearchSubjectPreview';
import RiskAssessmentPreview from '/imports/ui-fhir/riskAssessments/RiskAssessmentPreview';
import SchedulePreview from '/imports/ui-fhir/schedules/SchedulePreview';
import ServiceRequestPreview from '/imports/ui-fhir/serviceRequests/ServiceRequestPreview';
import SubstancePreview from '/imports/ui-fhir/substances/SubstancePreview';
import SupplyDeliveryPreview from '/imports/ui-fhir/supplyDeliveries/SupplyDeliveryPreview';
import SupplyRequestPreview from '/imports/ui-fhir/supplyRequests/SupplyRequestPreview';
import TaskPreview from '/imports/ui-fhir/tasks/TaskPreview';
import ValueSetPreview from '/imports/ui-fhir/valuesets/ValueSetPreview';

// Keys are FHIR resourceType strings (exact match from resource.resourceType)
registerDynamicFhirViewComponents({
  'ActivityDefinition': ActivityDefinitionPreview,
  'AllergyIntolerance': AllergyIntolerancePreview,
  'Appointment': AppointmentPreview,
  'ArtifactAssessment': ArtifactAssessmentPreview,
  'AuditEvent': AuditEventPreview,
  'Basic': BasicPreview,
  'BodyStructure': BodyStructurePreview,
  'Bundle': BundlePreview,
  'CarePlan': CarePlanPreview,
  'CareTeam': CareTeamPreview,
  'Claim': ClaimPreview,
  'ClinicalImpression': ClinicalImpressionPreview,
  'CodeSystem': CodeSystemPreview,
  'Communication': CommunicationPreview,
  'Composition': CompositionPreview,
  'Condition': ConditionPreview,
  'Consent': ConsentPreview,
  'Device': DevicePreview,
  'DiagnosticReport': DiagnosticReportPreview,
  'DocumentReference': DocumentReferencePreview,
  'Encounter': EncounterPreview,
  'Endpoint': EndpointPreview,
  'Evidence': EvidencePreview,
  'FamilyMemberHistory': FamilyMemberHistoryPreview,
  'Goal': GoalPreview,
  'GuidanceResponse': GuidanceResponsePreview,
  'ImagingStudy': ImagingStudyPreview,
  'Immunization': ImmunizationPreview,
  'Library': LibraryPreview,
  'List': ListPreview,
  'Location': LocationPreview,
  'Measure': MeasurePreview,
  'MeasureReport': MeasureReportPreview,
  'Media': MediaPreview,
  'Medication': MedicationPreview,
  'MedicationAdministration': MedicationAdministrationPreview,
  'MedicationRequest': MedicationRequestPreview,
  'MedicationStatement': MedicationStatementPreview,
  'MessageHeader': MessageHeaderPreview,
  'NutritionIntake': NutritionIntakePreview,
  'NutritionOrder': NutritionOrderPreview,
  'NutritionProduct': NutritionProductPreview,
  'Observation': ObservationPreview,
  'OperationOutcome': OperationOutcomePreview,
  'Organization': OrganizationPreview,
  'Patient': PatientPreview,
  'PlanDefinition': PlanDefinitionPreview,
  'Practitioner': PractitionerPreview,
  'PractitionerRole': PractitionerRolePreview,
  'Procedure': ProcedurePreview,
  'Questionnaire': QuestionnairePreview,
  'QuestionnaireResponse': QuestionnaireResponsePreview,
  'ResearchStudy': ResearchStudyPreview,
  'ResearchSubject': ResearchSubjectPreview,
  'RiskAssessment': RiskAssessmentPreview,
  'Schedule': SchedulePreview,
  'ServiceRequest': ServiceRequestPreview,
  'Substance': SubstancePreview,
  'SupplyDelivery': SupplyDeliveryPreview,
  'SupplyRequest': SupplyRequestPreview,
  'Task': TaskPreview,
  'ValueSet': ValueSetPreview
});

console.log('[fhir-preview-registry] Registered 62 Honeycomb Preview components with DynamicFhirViews dispatcher');
