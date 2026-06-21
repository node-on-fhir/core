// packages/vital-signs/lib/utilities/VitalSignsFactory.js

import { get } from 'lodash';
import moment from 'moment';
import { Random } from 'meteor/random';

/**
 * Factory functions for creating FHIR Observation resources for vital signs
 */

// Base observation template
function createBaseObservation(patientId, practitionerId = null) {
  const now = moment();
  
  return {
    resourceType: 'Observation',
    id: Random.id(),
    meta: {
      versionId: '1',
      lastUpdated: now.toISOString()
    },
    status: 'final',
    subject: {
      reference: `Patient/${patientId}`,
      type: 'Patient'
    },
    effectiveDateTime: now.toISOString(),
    issued: now.toISOString(),
    performer: practitionerId ? [{
      reference: `Practitioner/${practitionerId}`,
      type: 'Practitioner'
    }] : []
  };
}

// Blood Pressure Factory
export function createBloodPressure(systolic, diastolic, patientId, options = {}) {
  const observation = createBaseObservation(patientId, get(options, 'practitionerId'));
  
  return {
    ...observation,
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'vital-signs',
        display: 'Vital Signs'
      }]
    }],
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '85354-9',
        display: 'Blood pressure panel with all children optional'
      }],
      text: 'Blood pressure'
    },
    component: [
      {
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '8480-6',
            display: 'Systolic blood pressure'
          }]
        },
        valueQuantity: {
          value: systolic,
          unit: 'mmHg',
          system: 'http://unitsofmeasure.org',
          code: 'mm[Hg]'
        }
      },
      {
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '8462-4',
            display: 'Diastolic blood pressure'
          }]
        },
        valueQuantity: {
          value: diastolic,
          unit: 'mmHg',
          system: 'http://unitsofmeasure.org',
          code: 'mm[Hg]'
        }
      }
    ],
    bodySite: get(options, 'bodySite'),
    method: get(options, 'method'),
    device: get(options, 'device') ? {
      reference: `Device/${get(options, 'device')}`,
      type: 'Device'
    } : undefined
  };
}

// Heart Rate Factory
export function createHeartRate(value, patientId, options = {}) {
  const observation = createBaseObservation(patientId, get(options, 'practitionerId'));
  
  return {
    ...observation,
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'vital-signs',
        display: 'Vital Signs'
      }]
    }],
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '8867-4',
        display: 'Heart rate'
      }],
      text: 'Heart rate'
    },
    valueQuantity: {
      value: value,
      unit: 'beats/minute',
      system: 'http://unitsofmeasure.org',
      code: '/min'
    },
    method: get(options, 'method'),
    device: get(options, 'device') ? {
      reference: `Device/${get(options, 'device')}`,
      type: 'Device'
    } : undefined
  };
}

// Body Temperature Factory
export function createBodyTemperature(value, unit, patientId, options = {}) {
  const observation = createBaseObservation(patientId, get(options, 'practitionerId'));
  
  const unitMappings = {
    'Cel': { display: 'degrees C', code: 'Cel' },
    '[degF]': { display: 'degrees F', code: '[degF]' }
  };
  
  const unitInfo = unitMappings[unit] || { display: unit, code: unit };
  
  return {
    ...observation,
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'vital-signs',
        display: 'Vital Signs'
      }]
    }],
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '8310-5',
        display: 'Body temperature'
      }],
      text: 'Body temperature'
    },
    valueQuantity: {
      value: value,
      unit: unitInfo.display,
      system: 'http://unitsofmeasure.org',
      code: unitInfo.code
    },
    bodySite: get(options, 'bodySite'),
    method: get(options, 'method'),
    device: get(options, 'device') ? {
      reference: `Device/${get(options, 'device')}`,
      type: 'Device'
    } : undefined
  };
}

// Respiratory Rate Factory
export function createRespiratoryRate(value, patientId, options = {}) {
  const observation = createBaseObservation(patientId, get(options, 'practitionerId'));
  
  return {
    ...observation,
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'vital-signs',
        display: 'Vital Signs'
      }]
    }],
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '9279-1',
        display: 'Respiratory rate'
      }],
      text: 'Respiratory rate'
    },
    valueQuantity: {
      value: value,
      unit: 'breaths/minute',
      system: 'http://unitsofmeasure.org',
      code: '/min'
    },
    method: get(options, 'method')
  };
}

// Oxygen Saturation Factory
export function createOxygenSaturation(value, patientId, options = {}) {
  const observation = createBaseObservation(patientId, get(options, 'practitionerId'));
  
  return {
    ...observation,
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'vital-signs',
        display: 'Vital Signs'
      }]
    }],
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '2708-6',
        display: 'Oxygen saturation in Arterial blood'
      }],
      text: 'Oxygen saturation'
    },
    valueQuantity: {
      value: value,
      unit: '%',
      system: 'http://unitsofmeasure.org',
      code: '%'
    },
    device: get(options, 'device') ? {
      reference: `Device/${get(options, 'device')}`,
      type: 'Device'
    } : undefined
  };
}

// Body Weight Factory
export function createBodyWeight(value, unit, patientId, options = {}) {
  const observation = createBaseObservation(patientId, get(options, 'practitionerId'));
  
  const unitMappings = {
    'kg': { display: 'kg', code: 'kg' },
    '[lb_av]': { display: 'lb', code: '[lb_av]' },
    'g': { display: 'g', code: 'g' }
  };
  
  const unitInfo = unitMappings[unit] || { display: unit, code: unit };
  
  return {
    ...observation,
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'vital-signs',
        display: 'Vital Signs'
      }]
    }],
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '29463-7',
        display: 'Body weight'
      }],
      text: 'Body weight'
    },
    valueQuantity: {
      value: value,
      unit: unitInfo.display,
      system: 'http://unitsofmeasure.org',
      code: unitInfo.code
    },
    device: get(options, 'device') ? {
      reference: `Device/${get(options, 'device')}`,
      type: 'Device'
    } : undefined
  };
}

// Body Height Factory
export function createBodyHeight(value, unit, patientId, options = {}) {
  const observation = createBaseObservation(patientId, get(options, 'practitionerId'));
  
  const unitMappings = {
    'cm': { display: 'cm', code: 'cm' },
    '[in_i]': { display: 'in', code: '[in_i]' },
    'm': { display: 'm', code: 'm' }
  };
  
  const unitInfo = unitMappings[unit] || { display: unit, code: unit };
  
  return {
    ...observation,
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'vital-signs',
        display: 'Vital Signs'
      }]
    }],
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '8302-2',
        display: 'Body height'
      }],
      text: 'Body height'
    },
    valueQuantity: {
      value: value,
      unit: unitInfo.display,
      system: 'http://unitsofmeasure.org',
      code: unitInfo.code
    }
  };
}

// BMI Factory
export function createBMI(value, patientId, options = {}) {
  const observation = createBaseObservation(patientId, get(options, 'practitionerId'));
  
  return {
    ...observation,
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'vital-signs',
        display: 'Vital Signs'
      }]
    }],
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '39156-5',
        display: 'Body mass index (BMI) [Ratio]'
      }],
      text: 'BMI'
    },
    valueQuantity: {
      value: value,
      unit: 'kg/m2',
      system: 'http://unitsofmeasure.org',
      code: 'kg/m2'
    },
    derivedFrom: get(options, 'derivedFrom', [])
  };
}

// Head Circumference Factory
export function createHeadCircumference(value, unit, patientId, options = {}) {
  const observation = createBaseObservation(patientId, get(options, 'practitionerId'));
  
  const unitMappings = {
    'cm': { display: 'cm', code: 'cm' },
    '[in_i]': { display: 'in', code: '[in_i]' }
  };
  
  const unitInfo = unitMappings[unit] || { display: unit, code: unit };
  
  return {
    ...observation,
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'vital-signs',
        display: 'Vital Signs'
      }]
    }],
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '9843-4',
        display: 'Head Occipital-frontal circumference'
      }],
      text: 'Head circumference'
    },
    valueQuantity: {
      value: value,
      unit: unitInfo.display,
      system: 'http://unitsofmeasure.org',
      code: unitInfo.code
    }
  };
}

// Vital Signs Panel Factory
export function createVitalSignsPanel(vitals, patientId, options = {}) {
  const observation = createBaseObservation(patientId, get(options, 'practitionerId'));
  
  const components = [];
  
  // Add blood pressure components
  if (vitals.systolic && vitals.diastolic) {
    components.push(
      {
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '8480-6',
            display: 'Systolic blood pressure'
          }]
        },
        valueQuantity: {
          value: vitals.systolic,
          unit: 'mmHg',
          system: 'http://unitsofmeasure.org',
          code: 'mm[Hg]'
        }
      },
      {
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '8462-4',
            display: 'Diastolic blood pressure'
          }]
        },
        valueQuantity: {
          value: vitals.diastolic,
          unit: 'mmHg',
          system: 'http://unitsofmeasure.org',
          code: 'mm[Hg]'
        }
      }
    );
  }
  
  // Add other vital signs as components
  if (vitals.heartRate) {
    components.push({
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '8867-4',
          display: 'Heart rate'
        }]
      },
      valueQuantity: {
        value: vitals.heartRate,
        unit: 'beats/minute',
        system: 'http://unitsofmeasure.org',
        code: '/min'
      }
    });
  }
  
  if (vitals.respiratoryRate) {
    components.push({
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '9279-1',
          display: 'Respiratory rate'
        }]
      },
      valueQuantity: {
        value: vitals.respiratoryRate,
        unit: 'breaths/minute',
        system: 'http://unitsofmeasure.org',
        code: '/min'
      }
    });
  }
  
  if (vitals.temperature) {
    components.push({
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '8310-5',
          display: 'Body temperature'
        }]
      },
      valueQuantity: {
        value: vitals.temperature.value,
        unit: vitals.temperature.unit === 'Cel' ? 'degrees C' : 'degrees F',
        system: 'http://unitsofmeasure.org',
        code: vitals.temperature.unit
      }
    });
  }
  
  if (vitals.oxygenSaturation) {
    components.push({
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '2708-6',
          display: 'Oxygen saturation in Arterial blood'
        }]
      },
      valueQuantity: {
        value: vitals.oxygenSaturation,
        unit: '%',
        system: 'http://unitsofmeasure.org',
        code: '%'
      }
    });
  }
  
  return {
    ...observation,
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'vital-signs',
        display: 'Vital Signs'
      }]
    }],
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '85353-1',
        display: 'Vital signs, weight, height, head circumference, oxygen saturation & BMI panel'
      }],
      text: 'Vital signs panel'
    },
    component: components,
    encounter: get(options, 'encounterId') ? {
      reference: `Encounter/${get(options, 'encounterId')}`,
      type: 'Encounter'
    } : undefined
  };
}

// Export all factory functions
export default {
  createBaseObservation,
  createBloodPressure,
  createHeartRate,
  createBodyTemperature,
  createRespiratoryRate,
  createOxygenSaturation,
  createBodyWeight,
  createBodyHeight,
  createBMI,
  createHeadCircumference,
  createVitalSignsPanel
};