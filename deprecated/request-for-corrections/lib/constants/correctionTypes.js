// packages/request-for-corrections/lib/constants/correctionTypes.js

// Code system URL for patient correction types
export const CORRECTION_TYPE_SYSTEM = 'http://hl7.org/fhir/uv/patient-corrections/CodeSystem/PatientCorrectionCommunicationTypes';

// Communication types
export const COMMUNICATION_TYPES = {
  CORRECTION_REQUEST: {
    code: 'medRecCxReq',
    display: 'Correction Request',
    definition: 'A request by a patient or their representative to correct their medical record'
  },
  DISAGREEMENT: {
    code: 'medRecCxDenialDisagree', 
    display: 'Disagreement',
    definition: 'A disagreement by a patient or their representative to a denial of a correction request'
  }
};

// Task type system
export const TASK_TYPE_SYSTEM = 'http://hl7.org/fhir/uv/patient-corrections/CodeSystem/PatientCorrectionTaskTypes';

// Task types (same codes as communication types)
export const TASK_TYPES = {
  CORRECTION_REQUEST: {
    code: 'medRecCxReq',
    display: 'Correction Request Task',
    definition: 'A task tracking a correction request'
  },
  DISAGREEMENT: {
    code: 'medRecCxDenialDisagree',
    display: 'Disagreement Task', 
    definition: 'A task tracking a disagreement to a denial'
  }
};

// Output type system
export const OUTPUT_TYPE_SYSTEM = 'http://hl7.org/fhir/uv/patient-corrections/CodeSystem/PatientCorrectionOutputTypes';

// Output types
export const OUTPUT_TYPES = {
  RESOLUTION: {
    code: 'medRecCxReqResolution',
    display: 'Correction Request Resolution',
    definition: 'The formal response to a correction request'
  }
};

// Helper function to get coding for a type
export function getCoding(typeSystem, typeCode) {
  return {
    system: typeSystem,
    code: typeCode
  };
}