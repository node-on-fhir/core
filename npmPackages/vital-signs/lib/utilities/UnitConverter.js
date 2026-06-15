// packages/vital-signs/lib/utilities/UnitConverter.js

import { get } from 'lodash';

/**
 * Unit conversion utilities for vital signs
 */

// Conversion factors
const CONVERSIONS = {
  temperature: {
    celsiusToFahrenheit: (c) => (c * 9/5) + 32,
    fahrenheitToCelsius: (f) => (f - 32) * 5/9,
    celsiusToKelvin: (c) => c + 273.15,
    kelvinToCelsius: (k) => k - 273.15
  },
  weight: {
    kgToLb: (kg) => kg * 2.20462,
    lbToKg: (lb) => lb / 2.20462,
    kgToG: (kg) => kg * 1000,
    gToKg: (g) => g / 1000,
    lbToOz: (lb) => lb * 16,
    ozToLb: (oz) => oz / 16,
    kgToOz: (kg) => kg * 35.274,
    ozToKg: (oz) => oz / 35.274
  },
  length: {
    cmToIn: (cm) => cm / 2.54,
    inToCm: (inches) => inches * 2.54,
    mToCm: (m) => m * 100,
    cmToM: (cm) => cm / 100,
    ftToIn: (ft) => ft * 12,
    inToFt: (inches) => inches / 12,
    mToFt: (m) => m * 3.28084,
    ftToM: (ft) => ft / 3.28084
  },
  pressure: {
    mmHgToKPa: (mmHg) => mmHg * 0.133322,
    kPaToMmHg: (kPa) => kPa / 0.133322,
    mmHgToPsi: (mmHg) => mmHg * 0.0193368,
    psiToMmHg: (psi) => psi / 0.0193368
  }
};

// Temperature conversions
export function convertTemperature(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) {
    return value;
  }
  
  // Normalize unit names
  const normalizedFrom = normalizeTemperatureUnit(fromUnit);
  const normalizedTo = normalizeTemperatureUnit(toUnit);
  
  // Convert through Celsius as intermediate
  let celsius = value;
  
  // Convert to Celsius first if needed
  if (normalizedFrom === 'fahrenheit') {
    celsius = CONVERSIONS.temperature.fahrenheitToCelsius(value);
  } else if (normalizedFrom === 'kelvin') {
    celsius = CONVERSIONS.temperature.kelvinToCelsius(value);
  }
  
  // Convert from Celsius to target unit
  if (normalizedTo === 'fahrenheit') {
    return CONVERSIONS.temperature.celsiusToFahrenheit(celsius);
  } else if (normalizedTo === 'kelvin') {
    return CONVERSIONS.temperature.celsiusToKelvin(celsius);
  }
  
  return celsius;
}

// Weight conversions
export function convertWeight(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) {
    return value;
  }
  
  // Normalize unit names
  const normalizedFrom = normalizeWeightUnit(fromUnit);
  const normalizedTo = normalizeWeightUnit(toUnit);
  
  // Convert through kg as intermediate
  let kg = value;
  
  // Convert to kg first if needed
  switch (normalizedFrom) {
    case 'lb':
      kg = CONVERSIONS.weight.lbToKg(value);
      break;
    case 'g':
      kg = CONVERSIONS.weight.gToKg(value);
      break;
    case 'oz':
      kg = CONVERSIONS.weight.ozToKg(value);
      break;
  }
  
  // Convert from kg to target unit
  switch (normalizedTo) {
    case 'lb':
      return CONVERSIONS.weight.kgToLb(kg);
    case 'g':
      return CONVERSIONS.weight.kgToG(kg);
    case 'oz':
      return CONVERSIONS.weight.kgToOz(kg);
    default:
      return kg;
  }
}

// Length conversions
export function convertLength(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) {
    return value;
  }
  
  // Normalize unit names
  const normalizedFrom = normalizeLengthUnit(fromUnit);
  const normalizedTo = normalizeLengthUnit(toUnit);
  
  // Convert through cm as intermediate
  let cm = value;
  
  // Convert to cm first if needed
  switch (normalizedFrom) {
    case 'in':
      cm = CONVERSIONS.length.inToCm(value);
      break;
    case 'm':
      cm = CONVERSIONS.length.mToCm(value);
      break;
    case 'ft':
      cm = CONVERSIONS.length.inToCm(CONVERSIONS.length.ftToIn(value));
      break;
  }
  
  // Convert from cm to target unit
  switch (normalizedTo) {
    case 'in':
      return CONVERSIONS.length.cmToIn(cm);
    case 'm':
      return CONVERSIONS.length.cmToM(cm);
    case 'ft':
      return CONVERSIONS.length.inToFt(CONVERSIONS.length.cmToIn(cm));
    default:
      return cm;
  }
}

// Pressure conversions
export function convertPressure(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) {
    return value;
  }
  
  // Normalize unit names
  const normalizedFrom = normalizePressureUnit(fromUnit);
  const normalizedTo = normalizePressureUnit(toUnit);
  
  // Convert through mmHg as intermediate
  let mmHg = value;
  
  // Convert to mmHg first if needed
  switch (normalizedFrom) {
    case 'kPa':
      mmHg = CONVERSIONS.pressure.kPaToMmHg(value);
      break;
    case 'psi':
      mmHg = CONVERSIONS.pressure.psiToMmHg(value);
      break;
  }
  
  // Convert from mmHg to target unit
  switch (normalizedTo) {
    case 'kPa':
      return CONVERSIONS.pressure.mmHgToKPa(mmHg);
    case 'psi':
      return CONVERSIONS.pressure.mmHgToPsi(mmHg);
    default:
      return mmHg;
  }
}

// BMI calculation
export function calculateBMI(weight, weightUnit, height, heightUnit) {
  // Convert to kg and meters
  const weightKg = convertWeight(weight, weightUnit, 'kg');
  const heightM = convertLength(height, heightUnit, 'm');
  
  // BMI = weight(kg) / height(m)^2
  return weightKg / (heightM * heightM);
}

// Format value with appropriate decimal places
export function formatValue(value, type) {
  switch (type) {
    case 'temperature':
      return Math.round(value * 10) / 10; // 1 decimal place
    case 'weight':
      return Math.round(value * 10) / 10; // 1 decimal place
    case 'height':
      return Math.round(value * 10) / 10; // 1 decimal place
    case 'pressure':
      return Math.round(value); // No decimal places
    case 'bmi':
      return Math.round(value * 10) / 10; // 1 decimal place
    default:
      return Math.round(value * 100) / 100; // 2 decimal places
  }
}

// Unit normalizers
function normalizeTemperatureUnit(unit) {
  const unitMap = {
    'C': 'celsius',
    'Cel': 'celsius',
    '°C': 'celsius',
    'celsius': 'celsius',
    'F': 'fahrenheit',
    '[degF]': 'fahrenheit',
    '°F': 'fahrenheit',
    'fahrenheit': 'fahrenheit',
    'K': 'kelvin',
    'kelvin': 'kelvin'
  };
  
  return unitMap[unit] || 'celsius';
}

function normalizeWeightUnit(unit) {
  const unitMap = {
    'kg': 'kg',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'lb': 'lb',
    '[lb_av]': 'lb',
    'pound': 'lb',
    'pounds': 'lb',
    'g': 'g',
    'gram': 'g',
    'grams': 'g',
    'oz': 'oz',
    'ounce': 'oz',
    'ounces': 'oz'
  };
  
  return unitMap[unit] || 'kg';
}

function normalizeLengthUnit(unit) {
  const unitMap = {
    'cm': 'cm',
    'centimeter': 'cm',
    'centimeters': 'cm',
    'in': 'in',
    '[in_i]': 'in',
    'inch': 'in',
    'inches': 'in',
    'm': 'm',
    'meter': 'm',
    'meters': 'm',
    'ft': 'ft',
    'foot': 'ft',
    'feet': 'ft'
  };
  
  return unitMap[unit] || 'cm';
}

function normalizePressureUnit(unit) {
  const unitMap = {
    'mmHg': 'mmHg',
    'mm[Hg]': 'mmHg',
    'kPa': 'kPa',
    'kilopascal': 'kPa',
    'psi': 'psi'
  };
  
  return unitMap[unit] || 'mmHg';
}

// Convert FHIR unit code to display unit
export function getFhirUnitDisplay(code) {
  const displayMap = {
    'Cel': '°C',
    '[degF]': '°F',
    'kg': 'kg',
    '[lb_av]': 'lb',
    'g': 'g',
    'cm': 'cm',
    '[in_i]': 'in',
    'm': 'm',
    'mm[Hg]': 'mmHg',
    '/min': 'bpm',
    '%': '%',
    'kg/m2': 'kg/m²'
  };
  
  return displayMap[code] || code;
}

// Convert display unit to FHIR unit code
export function getUnitCode(display) {
  const codeMap = {
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
    '%': '%',
    'kg/m²': 'kg/m2'
  };
  
  return codeMap[display] || display;
}

// Convert between imperial and metric systems
export function convertToMetric(value, type) {
  switch (type) {
    case 'temperature':
      // Assume Fahrenheit to Celsius
      return convertTemperature(value, 'fahrenheit', 'celsius');
    case 'weight':
      // Assume pounds to kg
      return convertWeight(value, 'lb', 'kg');
    case 'height':
      // Assume inches to cm
      return convertLength(value, 'in', 'cm');
    default:
      return value;
  }
}

export function convertToImperial(value, type) {
  switch (type) {
    case 'temperature':
      // Assume Celsius to Fahrenheit
      return convertTemperature(value, 'celsius', 'fahrenheit');
    case 'weight':
      // Assume kg to pounds
      return convertWeight(value, 'kg', 'lb');
    case 'height':
      // Assume cm to inches
      return convertLength(value, 'cm', 'in');
    default:
      return value;
  }
}

// Get default units based on system preference
export function getDefaultUnits(system = 'metric') {
  if (system === 'imperial') {
    return {
      temperature: '°F',
      weight: 'lb',
      height: 'in',
      pressure: 'mmHg'
    };
  } else {
    return {
      temperature: '°C',
      weight: 'kg',
      height: 'cm',
      pressure: 'mmHg'
    };
  }
}

// Round to appropriate precision
export function roundToPrecision(value, precision = 2) {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

// Export all conversion functions
export default {
  convertTemperature,
  convertWeight,
  convertLength,
  convertPressure,
  calculateBMI,
  formatValue,
  getFhirUnitDisplay,
  getUnitCode,
  convertToMetric,
  convertToImperial,
  getDefaultUnits,
  roundToPrecision,
  CONVERSIONS
};