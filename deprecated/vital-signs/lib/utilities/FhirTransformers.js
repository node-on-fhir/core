// packages/vital-signs/lib/utilities/FhirTransformers.js

import { get, set, has } from 'lodash';
import moment from 'moment';

/**
 * Transform between FHIR and internal formats for vital signs
 */

// Transform FHIR Observation to internal vital sign format
export function fhirToVitalSign(observation) {
  if (!observation || observation.resourceType !== 'Observation') {
    return null;
  }
  
  const vitalSign = {
    id: observation.id,
    status: observation.status,
    date: observation.effectiveDateTime || get(observation, 'effectivePeriod.start'),
    patientId: extractReferenceId(observation.subject),
    performerId: observation.performer && observation.performer.length > 0 
      ? extractReferenceId(observation.performer[0])
      : null,
    encounterId: observation.encounter ? extractReferenceId(observation.encounter) : null
  };
  
  // Extract vital sign type and values based on LOINC code
  const loincCode = get(observation, 'code.coding[0].code');
  const displayName = get(observation, 'code.text') || get(observation, 'code.coding[0].display');
  
  vitalSign.type = mapLoincToVitalType(loincCode);
  vitalSign.displayName = displayName;
  
  // Handle different observation structures
  if (observation.valueQuantity) {
    // Simple observation with single value
    vitalSign.value = observation.valueQuantity.value;
    vitalSign.unit = observation.valueQuantity.unit || observation.valueQuantity.code;
  } else if (observation.component && observation.component.length > 0) {
    // Complex observation with multiple components (e.g., blood pressure)
    vitalSign.components = observation.component.map(comp => ({
      code: get(comp, 'code.coding[0].code'),
      display: get(comp, 'code.coding[0].display'),
      value: get(comp, 'valueQuantity.value'),
      unit: get(comp, 'valueQuantity.unit') || get(comp, 'valueQuantity.code')
    }));
    
    // Special handling for blood pressure
    if (loincCode === '85354-9' || loincCode === '55284-4') {
      const systolic = observation.component.find(c => 
        get(c, 'code.coding[0].code') === '8480-6'
      );
      const diastolic = observation.component.find(c => 
        get(c, 'code.coding[0].code') === '8462-4'
      );
      
      if (systolic && diastolic) {
        vitalSign.systolic = get(systolic, 'valueQuantity.value');
        vitalSign.diastolic = get(diastolic, 'valueQuantity.value');
        vitalSign.unit = 'mmHg';
      }
    }
  }
  
  // Extract additional metadata
  if (observation.bodySite) {
    vitalSign.bodySite = {
      code: get(observation, 'bodySite.coding[0].code'),
      display: get(observation, 'bodySite.coding[0].display') || observation.bodySite.text
    };
  }
  
  if (observation.method) {
    vitalSign.method = {
      code: get(observation, 'method.coding[0].code'),
      display: get(observation, 'method.coding[0].display') || observation.method.text
    };
  }
  
  if (observation.device) {
    vitalSign.deviceId = extractReferenceId(observation.device);
  }
  
  if (observation.note && observation.note.length > 0) {
    vitalSign.notes = observation.note.map(n => n.text).join('\n');
  }
  
  // Extract extensions
  if (observation.extension) {
    vitalSign.extensions = {};
    observation.extension.forEach(ext => {
      const url = ext.url;
      if (url.includes('body-position')) {
        vitalSign.extensions.bodyPosition = get(ext, 'valueCodeableConcept.coding[0].code');
      } else if (url.includes('exercise-association')) {
        vitalSign.extensions.exerciseAssociation = get(ext, 'valueCodeableConcept.coding[0].code');
      } else if (url.includes('sleep-status')) {
        vitalSign.extensions.sleepStatus = get(ext, 'valueCodeableConcept.coding[0].code');
      } else if (url.includes('measurement-setting')) {
        vitalSign.extensions.measurementSetting = get(ext, 'valueCodeableConcept.coding[0].code');
      }
    });
  }
  
  if (observation.interpretation && observation.interpretation.length > 0) {
    vitalSign.interpretation = {
      code: get(observation.interpretation[0], 'coding[0].code'),
      display: get(observation.interpretation[0], 'coding[0].display') || observation.interpretation[0].text
    };
  }
  
  return vitalSign;
}

// Transform internal vital sign to FHIR Observation
export function vitalSignToFhir(vitalSign) {
  const observation = {
    resourceType: 'Observation',
    id: vitalSign.id,
    meta: {
      versionId: '1',
      lastUpdated: moment().toISOString()
    },
    status: vitalSign.status || 'final',
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'vital-signs',
        display: 'Vital Signs'
      }]
    }],
    subject: {
      reference: `Patient/${vitalSign.patientId}`,
      type: 'Patient'
    }
  };
  
  // Set effective date
  if (vitalSign.date) {
    observation.effectiveDateTime = moment(vitalSign.date).toISOString();
  }
  
  // Set performer
  if (vitalSign.performerId) {
    observation.performer = [{
      reference: `Practitioner/${vitalSign.performerId}`,
      type: 'Practitioner'
    }];
  }
  
  // Set encounter
  if (vitalSign.encounterId) {
    observation.encounter = {
      reference: `Encounter/${vitalSign.encounterId}`,
      type: 'Encounter'
    };
  }
  
  // Map vital sign type to LOINC code
  const loincMapping = getLoincMapping(vitalSign.type);
  observation.code = {
    coding: [{
      system: 'http://loinc.org',
      code: loincMapping.code,
      display: loincMapping.display
    }],
    text: vitalSign.displayName || loincMapping.display
  };
  
  // Handle different vital sign types
  switch (vitalSign.type) {
    case 'blood-pressure':
      observation.component = [
        {
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '8480-6',
              display: 'Systolic blood pressure'
            }]
          },
          valueQuantity: {
            value: vitalSign.systolic,
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
            value: vitalSign.diastolic,
            unit: 'mmHg',
            system: 'http://unitsofmeasure.org',
            code: 'mm[Hg]'
          }
        }
      ];
      break;
      
    default:
      if (vitalSign.value !== undefined) {
        observation.valueQuantity = {
          value: vitalSign.value,
          unit: vitalSign.unit,
          system: 'http://unitsofmeasure.org',
          code: getUnitCode(vitalSign.unit)
        };
      }
  }
  
  // Add body site if present
  if (vitalSign.bodySite) {
    observation.bodySite = {
      coding: [{
        system: 'http://snomed.info/sct',
        code: vitalSign.bodySite.code || vitalSign.bodySite,
        display: vitalSign.bodySite.display || vitalSign.bodySite
      }]
    };
  }
  
  // Add method if present
  if (vitalSign.method) {
    observation.method = {
      coding: [{
        system: 'http://snomed.info/sct',
        code: vitalSign.method.code || vitalSign.method,
        display: vitalSign.method.display || vitalSign.method
      }]
    };
  }
  
  // Add device reference
  if (vitalSign.deviceId) {
    observation.device = {
      reference: `Device/${vitalSign.deviceId}`,
      type: 'Device'
    };
  }
  
  // Add notes
  if (vitalSign.notes) {
    observation.note = [{
      text: vitalSign.notes,
      time: moment().toISOString()
    }];
  }
  
  // Add extensions
  if (vitalSign.extensions) {
    observation.extension = [];
    
    if (vitalSign.extensions.bodyPosition) {
      observation.extension.push({
        url: 'http://hl7.org/fhir/StructureDefinition/observation-bodyPosition',
        valueCodeableConcept: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: vitalSign.extensions.bodyPosition
          }]
        }
      });
    }
    
    if (vitalSign.extensions.exerciseAssociation) {
      observation.extension.push({
        url: 'http://hl7.org/fhir/us/vitals/StructureDefinition/ExerciseAssociationExt',
        valueCodeableConcept: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: vitalSign.extensions.exerciseAssociation
          }]
        }
      });
    }
    
    if (vitalSign.extensions.sleepStatus) {
      observation.extension.push({
        url: 'http://hl7.org/fhir/us/vitals/StructureDefinition/SleepStatusExt',
        valueCodeableConcept: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: vitalSign.extensions.sleepStatus
          }]
        }
      });
    }
  }
  
  // Add interpretation
  if (vitalSign.interpretation) {
    observation.interpretation = [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
        code: vitalSign.interpretation.code || vitalSign.interpretation,
        display: vitalSign.interpretation.display || vitalSign.interpretation
      }]
    }];
  }
  
  return observation;
}

// Extract reference ID from FHIR reference
function extractReferenceId(reference) {
  if (!reference) return null;
  
  if (typeof reference === 'string') {
    const parts = reference.split('/');
    return parts[parts.length - 1];
  } else if (reference.reference) {
    const parts = reference.reference.split('/');
    return parts[parts.length - 1];
  }
  
  return null;
}

// Map LOINC code to vital sign type
function mapLoincToVitalType(loincCode) {
  const loincTypeMap = {
    '85354-9': 'blood-pressure',
    '55284-4': 'blood-pressure',
    '8867-4': 'heart-rate',
    '8310-5': 'body-temperature',
    '9279-1': 'respiratory-rate',
    '2708-6': 'oxygen-saturation',
    '29463-7': 'body-weight',
    '3141-9': 'body-weight',
    '8302-2': 'body-height',
    '8306-3': 'body-height',
    '39156-5': 'bmi',
    '9843-4': 'head-circumference',
    '85353-1': 'vital-signs-panel'
  };
  
  return loincTypeMap[loincCode] || 'other';
}

// Get LOINC mapping for vital sign type
function getLoincMapping(vitalType) {
  const mappings = {
    'blood-pressure': {
      code: '85354-9',
      display: 'Blood pressure panel with all children optional'
    },
    'heart-rate': {
      code: '8867-4',
      display: 'Heart rate'
    },
    'body-temperature': {
      code: '8310-5',
      display: 'Body temperature'
    },
    'respiratory-rate': {
      code: '9279-1',
      display: 'Respiratory rate'
    },
    'oxygen-saturation': {
      code: '2708-6',
      display: 'Oxygen saturation in Arterial blood'
    },
    'body-weight': {
      code: '29463-7',
      display: 'Body weight'
    },
    'body-height': {
      code: '8302-2',
      display: 'Body height'
    },
    'bmi': {
      code: '39156-5',
      display: 'Body mass index (BMI) [Ratio]'
    },
    'head-circumference': {
      code: '9843-4',
      display: 'Head Occipital-frontal circumference'
    },
    'vital-signs-panel': {
      code: '85353-1',
      display: 'Vital signs, weight, height, head circumference, oxygen saturation & BMI panel'
    }
  };
  
  return mappings[vitalType] || { code: '', display: '' };
}

// Get unit code for FHIR
function getUnitCode(unit) {
  const unitMap = {
    '°C': 'Cel',
    '°F': '[degF]',
    'kg': 'kg',
    'lb': '[lb_av]',
    'g': 'g',
    'cm': 'cm',
    'in': '[in_i]',
    'm': 'm',
    'mmHg': 'mm[Hg]',
    'bpm': '/min',
    'breaths/minute': '/min',
    '%': '%',
    'kg/m²': 'kg/m2',
    'kg/m2': 'kg/m2'
  };
  
  return unitMap[unit] || unit;
}

// Transform array of FHIR observations to vital signs
export function fhirBundleToVitalSigns(bundle) {
  if (!bundle || bundle.resourceType !== 'Bundle') {
    return [];
  }
  
  const vitalSigns = [];
  
  if (bundle.entry && Array.isArray(bundle.entry)) {
    bundle.entry.forEach(entry => {
      if (entry.resource && entry.resource.resourceType === 'Observation') {
        const vitalSign = fhirToVitalSign(entry.resource);
        if (vitalSign) {
          vitalSigns.push(vitalSign);
        }
      }
    });
  }
  
  return vitalSigns;
}

// Transform array of vital signs to FHIR bundle
export function vitalSignsToFhirBundle(vitalSigns) {
  const bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    total: vitalSigns.length,
    entry: []
  };
  
  vitalSigns.forEach(vitalSign => {
    const observation = vitalSignToFhir(vitalSign);
    bundle.entry.push({
      fullUrl: `urn:uuid:${observation.id}`,
      resource: observation
    });
  });
  
  return bundle;
}

// Group vital signs by type for display
export function groupVitalSignsByType(vitalSigns) {
  const grouped = {};
  
  vitalSigns.forEach(vitalSign => {
    const type = vitalSign.type || 'other';
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(vitalSign);
  });
  
  // Sort each group by date (most recent first)
  Object.keys(grouped).forEach(type => {
    grouped[type].sort((a, b) => {
      const dateA = moment(a.date);
      const dateB = moment(b.date);
      return dateB.diff(dateA);
    });
  });
  
  return grouped;
}

// Get the most recent vital signs for each type
export function getMostRecentVitalSigns(vitalSigns) {
  const grouped = groupVitalSignsByType(vitalSigns);
  const mostRecent = {};
  
  Object.keys(grouped).forEach(type => {
    if (grouped[type].length > 0) {
      mostRecent[type] = grouped[type][0];
    }
  });
  
  return mostRecent;
}

// Calculate trends for vital signs
export function calculateVitalSignTrends(vitalSigns, type, days = 7) {
  const cutoffDate = moment().subtract(days, 'days');
  
  const filteredSigns = vitalSigns
    .filter(vs => vs.type === type && moment(vs.date).isAfter(cutoffDate))
    .sort((a, b) => moment(a.date).diff(moment(b.date)));
  
  if (filteredSigns.length < 2) {
    return { trend: 'insufficient-data', values: filteredSigns };
  }
  
  const values = filteredSigns.map(vs => {
    if (type === 'blood-pressure') {
      return {
        date: vs.date,
        systolic: vs.systolic,
        diastolic: vs.diastolic
      };
    } else {
      return {
        date: vs.date,
        value: vs.value
      };
    }
  });
  
  // Calculate simple linear trend
  const firstValue = type === 'blood-pressure' 
    ? (values[0].systolic + values[0].diastolic) / 2
    : values[0].value;
  
  const lastValue = type === 'blood-pressure'
    ? (values[values.length - 1].systolic + values[values.length - 1].diastolic) / 2
    : values[values.length - 1].value;
  
  const change = lastValue - firstValue;
  const percentChange = (change / firstValue) * 100;
  
  let trend = 'stable';
  if (percentChange > 5) {
    trend = 'increasing';
  } else if (percentChange < -5) {
    trend = 'decreasing';
  }
  
  return {
    trend,
    change,
    percentChange,
    values,
    startDate: values[0].date,
    endDate: values[values.length - 1].date
  };
}

// Export all transformer functions
export default {
  fhirToVitalSign,
  vitalSignToFhir,
  fhirBundleToVitalSigns,
  vitalSignsToFhirBundle,
  groupVitalSignsByType,
  getMostRecentVitalSigns,
  calculateVitalSignTrends,
  mapLoincToVitalType,
  getLoincMapping
};