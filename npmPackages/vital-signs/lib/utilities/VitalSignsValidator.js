// packages/vital-signs/lib/utilities/VitalSignsValidator.js

import { get } from 'lodash';

/**
 * Validation functions for vital signs
 */

// Normal range definitions
const VITAL_SIGN_RANGES = {
  bloodPressure: {
    systolic: {
      adult: { min: 90, max: 140, critical: { low: 70, high: 180 } },
      pediatric: { min: 70, max: 120, critical: { low: 60, high: 140 } }
    },
    diastolic: {
      adult: { min: 60, max: 90, critical: { low: 40, high: 110 } },
      pediatric: { min: 40, max: 80, critical: { low: 30, high: 90 } }
    }
  },
  heartRate: {
    adult: { min: 60, max: 100, critical: { low: 40, high: 150 } },
    pediatric: {
      newborn: { min: 120, max: 160, critical: { low: 100, high: 180 } },
      infant: { min: 100, max: 150, critical: { low: 80, high: 170 } },
      toddler: { min: 90, max: 140, critical: { low: 70, high: 160 } },
      preschool: { min: 80, max: 130, critical: { low: 60, high: 150 } },
      schoolAge: { min: 70, max: 120, critical: { low: 50, high: 140 } },
      adolescent: { min: 60, max: 100, critical: { low: 40, high: 130 } }
    }
  },
  respiratoryRate: {
    adult: { min: 12, max: 20, critical: { low: 10, high: 30 } },
    pediatric: {
      newborn: { min: 30, max: 60, critical: { low: 20, high: 70 } },
      infant: { min: 25, max: 50, critical: { low: 20, high: 60 } },
      toddler: { min: 20, max: 40, critical: { low: 15, high: 50 } },
      preschool: { min: 20, max: 30, critical: { low: 15, high: 40 } },
      schoolAge: { min: 18, max: 25, critical: { low: 12, high: 35 } },
      adolescent: { min: 12, max: 20, critical: { low: 10, high: 30 } }
    }
  },
  temperature: {
    celsius: {
      normal: { min: 36.1, max: 37.2 },
      fever: { min: 37.3, max: 38.9 },
      critical: { low: 35.0, high: 40.0 }
    },
    fahrenheit: {
      normal: { min: 97.0, max: 99.0 },
      fever: { min: 99.1, max: 102.0 },
      critical: { low: 95.0, high: 104.0 }
    }
  },
  oxygenSaturation: {
    normal: { min: 95, max: 100 },
    warning: { min: 90, max: 94 },
    critical: { low: 88, high: 100 }
  },
  bmi: {
    underweight: { min: 0, max: 18.4 },
    normal: { min: 18.5, max: 24.9 },
    overweight: { min: 25.0, max: 29.9 },
    obese: { min: 30.0, max: 100 }
  }
};

// Validate blood pressure
export function validateBloodPressure(systolic, diastolic, ageCategory = 'adult') {
  const errors = [];
  const warnings = [];
  
  if (!systolic || !diastolic) {
    errors.push('Both systolic and diastolic values are required');
    return { isValid: false, errors, warnings };
  }
  
  if (systolic <= diastolic) {
    errors.push('Systolic pressure must be greater than diastolic pressure');
  }
  
  const ranges = VITAL_SIGN_RANGES.bloodPressure;
  const systolicRange = ranges.systolic[ageCategory] || ranges.systolic.adult;
  const diastolicRange = ranges.diastolic[ageCategory] || ranges.diastolic.adult;
  
  // Check critical ranges
  if (systolic < systolicRange.critical.low) {
    errors.push(`Critically low systolic pressure: ${systolic} mmHg`);
  } else if (systolic > systolicRange.critical.high) {
    errors.push(`Critically high systolic pressure: ${systolic} mmHg`);
  }
  
  if (diastolic < diastolicRange.critical.low) {
    errors.push(`Critically low diastolic pressure: ${diastolic} mmHg`);
  } else if (diastolic > diastolicRange.critical.high) {
    errors.push(`Critically high diastolic pressure: ${diastolic} mmHg`);
  }
  
  // Check normal ranges
  if (systolic < systolicRange.min || systolic > systolicRange.max) {
    warnings.push(`Systolic pressure outside normal range: ${systolic} mmHg`);
  }
  
  if (diastolic < diastolicRange.min || diastolic > diastolicRange.max) {
    warnings.push(`Diastolic pressure outside normal range: ${diastolic} mmHg`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    interpretation: interpretBloodPressure(systolic, diastolic)
  };
}

// Validate heart rate
export function validateHeartRate(rate, ageCategory = 'adult', subCategory = null) {
  const errors = [];
  const warnings = [];
  
  if (!rate || rate <= 0) {
    errors.push('Heart rate must be a positive number');
    return { isValid: false, errors, warnings };
  }
  
  let range;
  if (ageCategory === 'adult') {
    range = VITAL_SIGN_RANGES.heartRate.adult;
  } else if (ageCategory === 'pediatric' && subCategory) {
    range = VITAL_SIGN_RANGES.heartRate.pediatric[subCategory];
  } else {
    range = VITAL_SIGN_RANGES.heartRate.adult;
  }
  
  // Check critical ranges
  if (rate < range.critical.low) {
    errors.push(`Critically low heart rate: ${rate} bpm`);
  } else if (rate > range.critical.high) {
    errors.push(`Critically high heart rate: ${rate} bpm`);
  }
  
  // Check normal ranges
  if (rate < range.min) {
    warnings.push(`Bradycardia: ${rate} bpm`);
  } else if (rate > range.max) {
    warnings.push(`Tachycardia: ${rate} bpm`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    interpretation: interpretHeartRate(rate)
  };
}

// Validate temperature
export function validateTemperature(value, unit = 'celsius') {
  const errors = [];
  const warnings = [];
  
  if (!value || value <= 0) {
    errors.push('Temperature must be a positive number');
    return { isValid: false, errors, warnings };
  }
  
  const ranges = unit === 'fahrenheit' 
    ? VITAL_SIGN_RANGES.temperature.fahrenheit 
    : VITAL_SIGN_RANGES.temperature.celsius;
  
  // Check critical ranges
  if (value < ranges.critical.low) {
    errors.push(`Critically low temperature: ${value}° ${unit === 'fahrenheit' ? 'F' : 'C'}`);
  } else if (value > ranges.critical.high) {
    errors.push(`Critically high temperature: ${value}° ${unit === 'fahrenheit' ? 'F' : 'C'}`);
  }
  
  // Check for fever
  if (value >= ranges.fever.min && value <= ranges.fever.max) {
    warnings.push(`Fever detected: ${value}° ${unit === 'fahrenheit' ? 'F' : 'C'}`);
  } else if (value < ranges.normal.min) {
    warnings.push(`Below normal temperature: ${value}° ${unit === 'fahrenheit' ? 'F' : 'C'}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    interpretation: interpretTemperature(value, unit)
  };
}

// Validate respiratory rate
export function validateRespiratoryRate(rate, ageCategory = 'adult', subCategory = null) {
  const errors = [];
  const warnings = [];
  
  if (!rate || rate <= 0) {
    errors.push('Respiratory rate must be a positive number');
    return { isValid: false, errors, warnings };
  }
  
  let range;
  if (ageCategory === 'adult') {
    range = VITAL_SIGN_RANGES.respiratoryRate.adult;
  } else if (ageCategory === 'pediatric' && subCategory) {
    range = VITAL_SIGN_RANGES.respiratoryRate.pediatric[subCategory];
  } else {
    range = VITAL_SIGN_RANGES.respiratoryRate.adult;
  }
  
  // Check critical ranges
  if (rate < range.critical.low) {
    errors.push(`Critically low respiratory rate: ${rate} breaths/min`);
  } else if (rate > range.critical.high) {
    errors.push(`Critically high respiratory rate: ${rate} breaths/min`);
  }
  
  // Check normal ranges
  if (rate < range.min) {
    warnings.push(`Bradypnea: ${rate} breaths/min`);
  } else if (rate > range.max) {
    warnings.push(`Tachypnea: ${rate} breaths/min`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    interpretation: interpretRespiratoryRate(rate)
  };
}

// Validate oxygen saturation
export function validateOxygenSaturation(value) {
  const errors = [];
  const warnings = [];
  
  if (!value || value < 0 || value > 100) {
    errors.push('Oxygen saturation must be between 0 and 100');
    return { isValid: false, errors, warnings };
  }
  
  const ranges = VITAL_SIGN_RANGES.oxygenSaturation;
  
  if (value <= ranges.critical.low) {
    errors.push(`Critical hypoxemia: ${value}%`);
  } else if (value >= ranges.warning.min && value <= ranges.warning.max) {
    warnings.push(`Low oxygen saturation: ${value}%`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    interpretation: interpretOxygenSaturation(value)
  };
}

// Validate BMI
export function validateBMI(value) {
  const errors = [];
  const warnings = [];
  
  if (!value || value <= 0) {
    errors.push('BMI must be a positive number');
    return { isValid: false, errors, warnings };
  }
  
  if (value < 10 || value > 60) {
    warnings.push(`Unusual BMI value: ${value}. Please verify calculation.`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    interpretation: interpretBMI(value)
  };
}

// Validate weight
export function validateWeight(value, unit = 'kg') {
  const errors = [];
  const warnings = [];
  
  if (!value || value <= 0) {
    errors.push('Weight must be a positive number');
    return { isValid: false, errors, warnings };
  }
  
  // Convert to kg for validation
  let weightInKg = value;
  if (unit === '[lb_av]' || unit === 'lb') {
    weightInKg = value * 0.453592;
  } else if (unit === 'g') {
    weightInKg = value / 1000;
  }
  
  if (weightInKg < 0.5 || weightInKg > 500) {
    warnings.push(`Unusual weight value: ${value} ${unit}. Please verify.`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Validate height
export function validateHeight(value, unit = 'cm') {
  const errors = [];
  const warnings = [];
  
  if (!value || value <= 0) {
    errors.push('Height must be a positive number');
    return { isValid: false, errors, warnings };
  }
  
  // Convert to cm for validation
  let heightInCm = value;
  if (unit === '[in_i]' || unit === 'in') {
    heightInCm = value * 2.54;
  } else if (unit === 'm') {
    heightInCm = value * 100;
  }
  
  if (heightInCm < 20 || heightInCm > 250) {
    warnings.push(`Unusual height value: ${value} ${unit}. Please verify.`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Interpretation functions
function interpretBloodPressure(systolic, diastolic) {
  if (systolic < 90 || diastolic < 60) {
    return 'Hypotension';
  } else if (systolic >= 140 || diastolic >= 90) {
    return 'Hypertension';
  } else if (systolic >= 130 || diastolic >= 80) {
    return 'Elevated blood pressure';
  } else if (systolic < 120 && diastolic < 80) {
    return 'Normal';
  } else {
    return 'Elevated';
  }
}

function interpretHeartRate(rate) {
  if (rate < 60) {
    return 'Bradycardia';
  } else if (rate > 100) {
    return 'Tachycardia';
  } else {
    return 'Normal';
  }
}

function interpretTemperature(value, unit = 'celsius') {
  const ranges = unit === 'fahrenheit' 
    ? VITAL_SIGN_RANGES.temperature.fahrenheit 
    : VITAL_SIGN_RANGES.temperature.celsius;
  
  if (value < ranges.normal.min) {
    return 'Hypothermia';
  } else if (value >= ranges.fever.min) {
    return 'Fever';
  } else {
    return 'Normal';
  }
}

function interpretRespiratoryRate(rate) {
  if (rate < 12) {
    return 'Bradypnea';
  } else if (rate > 20) {
    return 'Tachypnea';
  } else {
    return 'Normal';
  }
}

function interpretOxygenSaturation(value) {
  if (value >= 95) {
    return 'Normal';
  } else if (value >= 90) {
    return 'Mild hypoxemia';
  } else if (value >= 85) {
    return 'Moderate hypoxemia';
  } else {
    return 'Severe hypoxemia';
  }
}

function interpretBMI(value) {
  const ranges = VITAL_SIGN_RANGES.bmi;
  
  if (value < ranges.underweight.max) {
    return 'Underweight';
  } else if (value < ranges.normal.max) {
    return 'Normal weight';
  } else if (value < ranges.overweight.max) {
    return 'Overweight';
  } else {
    return 'Obese';
  }
}

// Validate complete observation
export function validateVitalSignObservation(observation) {
  const errors = [];
  const warnings = [];
  
  if (!observation || !observation.resourceType) {
    errors.push('Invalid observation resource');
    return { isValid: false, errors, warnings };
  }
  
  if (observation.resourceType !== 'Observation') {
    errors.push('Resource must be of type Observation');
  }
  
  if (!observation.status) {
    errors.push('Observation must have a status');
  }
  
  if (!observation.code || !observation.code.coding || observation.code.coding.length === 0) {
    errors.push('Observation must have a valid code');
  }
  
  if (!observation.subject || !observation.subject.reference) {
    errors.push('Observation must have a subject reference');
  }
  
  if (!observation.effectiveDateTime && !observation.effectivePeriod) {
    warnings.push('Observation should have an effective date/time');
  }
  
  // Validate based on observation type
  const loincCode = get(observation, 'code.coding[0].code');
  
  switch (loincCode) {
    case '85354-9': // Blood pressure panel
      if (!observation.component || observation.component.length < 2) {
        errors.push('Blood pressure must have systolic and diastolic components');
      } else {
        const systolic = observation.component.find(c => 
          get(c, 'code.coding[0].code') === '8480-6'
        );
        const diastolic = observation.component.find(c => 
          get(c, 'code.coding[0].code') === '8462-4'
        );
        
        if (!systolic || !diastolic) {
          errors.push('Blood pressure must have valid systolic and diastolic components');
        } else {
          const bpValidation = validateBloodPressure(
            get(systolic, 'valueQuantity.value'),
            get(diastolic, 'valueQuantity.value')
          );
          errors.push(...bpValidation.errors);
          warnings.push(...bpValidation.warnings);
        }
      }
      break;
      
    case '8867-4': // Heart rate
      if (!observation.valueQuantity || !observation.valueQuantity.value) {
        errors.push('Heart rate must have a value');
      } else {
        const hrValidation = validateHeartRate(observation.valueQuantity.value);
        errors.push(...hrValidation.errors);
        warnings.push(...hrValidation.warnings);
      }
      break;
      
    case '8310-5': // Body temperature
      if (!observation.valueQuantity || !observation.valueQuantity.value) {
        errors.push('Temperature must have a value');
      } else {
        const unit = observation.valueQuantity.code === '[degF]' ? 'fahrenheit' : 'celsius';
        const tempValidation = validateTemperature(observation.valueQuantity.value, unit);
        errors.push(...tempValidation.errors);
        warnings.push(...tempValidation.warnings);
      }
      break;
      
    // Add more validation for other vital sign types as needed
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Export all validation functions
export default {
  validateBloodPressure,
  validateHeartRate,
  validateTemperature,
  validateRespiratoryRate,
  validateOxygenSaturation,
  validateBMI,
  validateWeight,
  validateHeight,
  validateVitalSignObservation,
  VITAL_SIGN_RANGES
};