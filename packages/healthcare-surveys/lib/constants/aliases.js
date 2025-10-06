// packages/healthcare-surveys/lib/constants/aliases.js

// FHIR Aliases extracted from aliases.fsh
// These constants represent the FHIR terminology and structure definition URLs

// HL7 Terminology CodeSystems
export const V3_PARTICIPATION_FUNCTION = 'http://terminology.hl7.org/CodeSystem/v3-ParticipationFunction|3.0.0';
export const ALLERGYINTOLERANCE_CLINICAL = 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical';
export const ALLERGYINTOLERANCE_VERIFICATION = 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification';
export const CONDITION_CLINICAL = 'http://terminology.hl7.org/CodeSystem/condition-clinical';
export const CONDITION_VER_STATUS = 'http://terminology.hl7.org/CodeSystem/condition-ver-status';
export const CONDITION_CATEGORY = 'http://terminology.hl7.org/CodeSystem/condition-category';
export const V3_ACT_CODE = 'http://terminology.hl7.org/CodeSystem/v3-ActCode|3.0.0';
export const V2_0203 = 'http://terminology.hl7.org/CodeSystem/v2-0203';
export const V3_MARITAL_STATUS = 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus';
export const PLAN_DEFINITION_TYPE = 'http://terminology.hl7.org/CodeSystem/plan-definition-type';
export const ENDPOINT_CONNECTION_TYPE = 'http://terminology.hl7.org/CodeSystem/endpoint-connection-type';
export const RESOURCE_TYPES = 'http://hl7.org/fhir/resource-types';
export const SUBSCRIBER_RELATIONSHIP = 'http://terminology.hl7.org/CodeSystem/subscriber-relationship';
export const COVERAGE_CLASS = 'http://terminology.hl7.org/CodeSystem/coverage-class';
export const V3_TRIBAL_ENTITY_US = 'http://terminology.hl7.org/CodeSystem/v3-TribalEntityUS';

// External Code Systems
export const SCT = 'http://snomed.info/sct';
export const LOINC = 'http://loinc.org';
export const RXNORM = 'http://www.nlm.nih.gov/research/umls/rxnorm';

// US Public Health Library CodeSystems and ValueSets
export const US_PH_PLANDEFINITION_ACTIONS = 'http://hl7.org/fhir/us/ph-library/CodeSystem-us-ph-codesystem-plandefinition-actions';
export const US_PH_PLANDEFINITION_ACTIONS_VALUESET = 'http://hl7.org/fhir/us/ph-library/ValueSet-us-ph-valueset-plandefinition-action.html';
export const US_PH_TRIGGERDEFINITION_NAMEDEVENTS = 'http://hl7.org/fhir/us/ph-library/CodeSystem/us-ph-codesystem-triggerdefinition-namedevents';
export const US_PH_REPORT_INITIATION_TYPES = 'http://hl7.org/fhir/us/ph-library/CodeSystem/us-ph-codesystem-report-initiation-types';
export const US_PH_MESSAGEHEADER_MESSAGE_TYPES = 'http://hl7.org/fhir/us/ph-library/CodeSystem/us-ph-codesystem-message-types';
export const USPH_PLAN_DEF_ACTION = 'http://hl7.org/fhir/us/ph-library/ValueSet/us-ph-valueset-plandefinition-action';

// US Core Structure Definitions (v6.1.0)
export const US_CORE_PATIENT = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient|6.1.0';
export const US_CORE_ENCOUNTER = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-encounter|6.1.0';
export const US_CORE_PRACTITIONERROLE = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-practitionerrole|6.1.0';
export const US_CORE_PRACTITIONER = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-practitioner|6.1.0';
export const US_CORE_ORGANIZATION = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-organization|6.1.0';
export const US_CORE_CONDITION_PROBLEMS_HEALTH_CONCERNS = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-condition-problems-health-concerns|6.1.0';
export const US_CORE_ALLERGYINTOLERANCE = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-allergyintolerance|6.1.0';
export const US_CORE_MEDICATION = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-medication|6.1.0';
export const US_CORE_MEDICATIONDISPENSE = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-medicationdispense|6.1.0';
export const US_CORE_OBSERVATION_LAB = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-lab|6.1.0';
export const US_CORE_DIAGNOSTICREPORT_LAB = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-diagnosticreport-lab|6.1.0';
export const US_CORE_OBSERVATION_CLINICAL_RESULT = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-clinical-result|6.1.0';
export const US_CORE_SIMPLE_OBSERVATION = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-simple-observation|6.1.0';
export const US_CORE_OBSERVATION_SCREENING_ASSESSMENT = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-screening-assessment|6.1.0';
export const US_CORE_QUESTIONNAIRERESPONSE = 'http://hl7.org/fhir/StructureDefinition/QuestionnaireResponse';
export const US_CORE_DOCUMENTREFERENCE = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-documentreference|6.1.0';
export const US_CORE_DIAGNOSTICREPORT_NOTE = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-diagnosticreport-note|6.1.0';
export const US_CORE_MEDICATIONREQUEST = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-medicationrequest|6.1.0';
export const US_CORE_SERVICEREQUEST = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-servicerequest|6.1.0';
export const US_CORE_CAREPLAN = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-careplan|6.1.0';
export const US_CORE_IMMUNIZATION = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-immunization|6.1.0';
export const US_CORE_PROCEDURE = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-procedure|6.1.0';
export const US_CORE_VITAL_SIGNS = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-vital-signs|6.1.0';
export const US_CORE_BLOOD_PRESSURE = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-blood-pressure|6.1.0';
export const US_CORE_BODY_WEIGHT = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-body-weight|6.1.0';
export const US_CORE_BODY_HEIGHT = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-body-height|6.1.0';
export const US_CORE_HEART_RATE = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-heart-rate|6.1.0';
export const US_CORE_PULSE_OXIMETRY = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-pulse-oximetry|6.1.0';
export const US_CORE_BMI = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-bmi|6.1.0';
export const US_CORE_BODY_TEMPERATURE = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-body-temperature|6.1.0';
export const US_CORE_HEAD_CIRCUMFERENCE = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-head-circumference|6.1.0';
export const US_CORE_RESPIRATORY_RATE = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-respiratory-rate|6.1.0';
export const US_CORE_SMOKINGSTATUS = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-smokingstatus|6.1.0';
export const US_CORE_IMPLANTABLE_DEVICE = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-implantable-device|6.1.0';
export const US_CORE_CARETEAM = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-careteam|6.1.0';
export const US_CORE_GOAL = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-goal|6.1.0';
export const US_CORE_ENCOUNTERDIAGNOSIS = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-condition-encounter-diagnosis|6.1.0';
export const US_CORE_OBSERVATION_PREGNANCYSTATUS = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-pregnancystatus|6.1.0';
export const US_CORE_OBSERVATION_PREGNANCYINTENT = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-pregnancyintent|6.1.0';

// US Core ValueSets
export const US_CORE_PROCEDURE_CODE = 'http://hl7.org/fhir/us/core/ValueSet/us-core-procedure-code';

// Pediatric Vital Signs
export const PEDIATRIC_WEIGHT_FOR_HEIGHT = 'http://hl7.org/fhir/us/core/StructureDefinition/pediatric-weight-for-height|6.1.0';
export const HEAD_OCCIPITAL_FRONTAL_CIRCUMFERENCE_PERCENTILE = 'http://hl7.org/fhir/us/core/StructureDefinition/head-occipital-frontal-circumference-percentile|6.1.0';
export const PEDIATRIC_BMI_FOR_AGE = 'http://hl7.org/fhir/us/core/StructureDefinition/pediatric-bmi-for-age|6.1.0';

// FHIR Core Structure Definitions
export const VITALSIGNS = 'http://hl7.org/fhir/StructureDefinition/vitalsigns|6.1.0';
export const SDC_QUESTIONNAIRERESPONSE = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaireresponse';
export const COMPLIES_WITH_PROFILE = 'http://hl7.org/fhir/StructureDefinition/structuredefinition-compliesWithProfile';

// Other URIs
export const RACE_ETHNICITY = 'urn:oid:2.16.840.1.113883.6.238';

// Alias mapping object for convenience
const HCS_ALIASES = {
  // HL7 Terminology CodeSystems
  '$v3-ParticipationFunction': V3_PARTICIPATION_FUNCTION,
  '$allergyintolerance-clinical': ALLERGYINTOLERANCE_CLINICAL,
  '$allergyintolerance-verification': ALLERGYINTOLERANCE_VERIFICATION,
  '$sct': SCT,
  '$condition-clinical': CONDITION_CLINICAL,
  '$condition-ver-status': CONDITION_VER_STATUS,
  '$condition-category': CONDITION_CATEGORY,
  '$v3-ActCode': V3_ACT_CODE,
  '$loinc': LOINC,
  '$rxnorm': RXNORM,
  '$v2-0203': V2_0203,
  '$v3-MaritalStatus': V3_MARITAL_STATUS,
  '$plan-definition-type': PLAN_DEFINITION_TYPE,
  '$us-ph-plandefinition-actions': US_PH_PLANDEFINITION_ACTIONS,
  '$us-ph-plandefinition-actions-valueset': US_PH_PLANDEFINITION_ACTIONS_VALUESET,
  '$us-ph-triggerdefinition-namedevents': US_PH_TRIGGERDEFINITION_NAMEDEVENTS,
  '$endpoint-connection-type': ENDPOINT_CONNECTION_TYPE,
  '$resource-types': RESOURCE_TYPES,
  '$us-ph-report-initiation-types': US_PH_REPORT_INITIATION_TYPES,
  '$us-ph-messageheader-message-types': US_PH_MESSAGEHEADER_MESSAGE_TYPES,
  '$us-core-patient': US_CORE_PATIENT,
  '$us-core-encounter': US_CORE_ENCOUNTER,
  '$us-core-practitionerrole': US_CORE_PRACTITIONERROLE,
  '$us-core-practitioner': US_CORE_PRACTITIONER,
  '$us-core-organization': US_CORE_ORGANIZATION,
  '$us-core-condition-problems-health-concerns': US_CORE_CONDITION_PROBLEMS_HEALTH_CONCERNS,
  '$us-core-allergyintolerance': US_CORE_ALLERGYINTOLERANCE,
  '$us-core-medication': US_CORE_MEDICATION,
  '$us-core-medicationdispense': US_CORE_MEDICATIONDISPENSE,
  '$us-core-observation-lab': US_CORE_OBSERVATION_LAB,
  '$us-core-diagnosticreport-lab': US_CORE_DIAGNOSTICREPORT_LAB,
  '$us-core-observation-clinical-result': US_CORE_OBSERVATION_CLINICAL_RESULT,
  '$us-core-simple-observation': US_CORE_SIMPLE_OBSERVATION,
  '$us-core-observation-screening-assessment': US_CORE_OBSERVATION_SCREENING_ASSESSMENT,
  '$us-core-questionnaireresponse': US_CORE_QUESTIONNAIRERESPONSE,
  '$sdc-questionnaireresponse': SDC_QUESTIONNAIRERESPONSE,
  '$us-core-documentreference': US_CORE_DOCUMENTREFERENCE,
  '$us-core-diagnosticreport-note': US_CORE_DIAGNOSTICREPORT_NOTE,
  '$us-core-medicationrequest': US_CORE_MEDICATIONREQUEST,
  '$us-core-servicerequest': US_CORE_SERVICEREQUEST,
  '$us-core-careplan': US_CORE_CAREPLAN,
  '$us-core-immunization': US_CORE_IMMUNIZATION,
  '$us-core-procedure': US_CORE_PROCEDURE,
  '$us-core-vital-signs': US_CORE_VITAL_SIGNS,
  '$vitalsigns': VITALSIGNS,
  '$us-core-blood-pressure': US_CORE_BLOOD_PRESSURE,
  '$us-core-body-weight': US_CORE_BODY_WEIGHT,
  '$us-core-body-height': US_CORE_BODY_HEIGHT,
  '$us-core-heart-rate': US_CORE_HEART_RATE,
  '$us-core-pulse-oximetry': US_CORE_PULSE_OXIMETRY,
  '$us-core-bmi': US_CORE_BMI,
  '$pediatric-weight-for-height': PEDIATRIC_WEIGHT_FOR_HEIGHT,
  '$head-occipital-frontal-circumference-percentile': HEAD_OCCIPITAL_FRONTAL_CIRCUMFERENCE_PERCENTILE,
  '$pediatric-bmi-for-age': PEDIATRIC_BMI_FOR_AGE,
  '$us-core-body-temperature': US_CORE_BODY_TEMPERATURE,
  '$us-core-head-circumference': US_CORE_HEAD_CIRCUMFERENCE,
  '$us-core-respiratory-rate': US_CORE_RESPIRATORY_RATE,
  '$us-core-smokingstatus': US_CORE_SMOKINGSTATUS,
  '$us-core-implantable-device': US_CORE_IMPLANTABLE_DEVICE,
  '$us-core-careteam': US_CORE_CARETEAM,
  '$us-core-goal': US_CORE_GOAL,
  '$us-core-encounterdiagnosis': US_CORE_ENCOUNTERDIAGNOSIS,
  '$us-core-observation-pregnancystatus': US_CORE_OBSERVATION_PREGNANCYSTATUS,
  '$us-core-observation-pregnancyintent': US_CORE_OBSERVATION_PREGNANCYINTENT,
  '$us-core-procedure-code': US_CORE_PROCEDURE_CODE,
  '$subscriber-relationship': SUBSCRIBER_RELATIONSHIP,
  '$coverage-class': COVERAGE_CLASS,
  '$USPHPlanDefAction': USPH_PLAN_DEF_ACTION,
  '$v3-TribalEntityUS': V3_TRIBAL_ENTITY_US,
  '$compliesWithProfile': COMPLIES_WITH_PROFILE,
  '$raceEthnicity': RACE_ETHNICITY
};

// Export
if (typeof exports === 'object') {
  module.exports = { HCS_ALIASES };
}