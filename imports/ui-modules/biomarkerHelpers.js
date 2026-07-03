// imports/ui-modules/biomarkerHelpers.js
//
// Shared, dependency-light helpers for extracting and normalizing chartable
// values out of FHIR Observation resources. Factored out of BiomarkerChartingPage
// so the page and the reusable <BiomarkerTrendline> component draw identical
// series from the same logic. Only dependency is lodash `get` (isomorphic).

import { get } from 'lodash';

// Extract a chartable numeric value from any Observation type.
// valueQuantity → returns value directly.
// valueSampledData → returns mean of all sample points.
export function getObservationValue(obs) {
  var quantityValue = get(obs, 'valueQuantity.value');
  if (quantityValue !== undefined && quantityValue !== null) {
    return Number(quantityValue);
  }

  var sampledDataStr = get(obs, 'valueSampledData.data');
  if (sampledDataStr && typeof sampledDataStr === 'string') {
    var samples = sampledDataStr.split(' ').map(Number).filter(function(v) {
      return !isNaN(v);
    });
    if (samples.length > 0) {
      var sum = samples.reduce(function(acc, val) { return acc + val; }, 0);
      return sum / samples.length;
    }
  }
  return null;
}

// Extract unit from either valueQuantity or valueSampledData.
export function getObservationUnit(obs) {
  return get(obs, 'valueQuantity.unit') || get(obs, 'valueSampledData.origin.unit') || null;
}

// Extract date from either effectiveDateTime or effectivePeriod.start.
export function getObservationDate(obs) {
  return get(obs, 'effectiveDateTime') || get(obs, 'effectivePeriod.start') || null;
}

// Known unit conversions: key = "fromUnit→toUnit"
export var UNIT_CONVERSIONS = {
  '[lb_av]→kg': function(v) { return v / 2.20462; },
  'lbs→kg': function(v) { return v / 2.20462; },
  'lb→kg': function(v) { return v / 2.20462; },
  'kg→[lb_av]': function(v) { return v * 2.20462; },
  'kg→lbs': function(v) { return v * 2.20462; },
  '[degF]→Cel': function(v) { return (v - 32) * 5 / 9; },
  'Cel→[degF]': function(v) { return v * 9 / 5 + 32; },
  '[in_i]→cm': function(v) { return v * 2.54; },
  'cm→[in_i]': function(v) { return v / 2.54; }
};

// Find the most common unit among observations
export function findPredominantUnit(observations) {
  var unitCounts = {};
  observations.forEach(function(obs) {
    var unit = getObservationUnit(obs);
    if (unit) {
      unitCounts[unit] = (unitCounts[unit] || 0) + 1;
    }
  });
  var predominant = null;
  var maxCount = 0;
  Object.keys(unitCounts).forEach(function(unit) {
    if (unitCounts[unit] > maxCount) {
      maxCount = unitCounts[unit];
      predominant = unit;
    }
  });
  return predominant;
}

// Get observation value normalized to targetUnit
export function getNormalizedValue(obs, targetUnit, isPercentageFraction) {
  var rawValue = getObservationValue(obs);
  if (rawValue === null) return null;

  // Handle percentage values stored as fractions (SpO2: 0.95 → 95%)
  if (isPercentageFraction) {
    return rawValue * 100;
  }

  var obsUnit = getObservationUnit(obs);

  // Same unit or missing unit info — return as-is
  if (!obsUnit || !targetUnit || obsUnit === targetUnit) return rawValue;

  // Try direct conversion
  var key = obsUnit + '→' + targetUnit;
  if (UNIT_CONVERSIONS[key]) {
    return UNIT_CONVERSIONS[key](rawValue);
  }

  // No conversion available — return as-is
  return rawValue;
}
