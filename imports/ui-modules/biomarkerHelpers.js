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
// valueInteger → returns the integer.
// valueCodeableConcept → returns the ordinalValue extension when present
//   (PROMIS/survey Likert answers carry ordinal scores on the answer coding).
// component[] → falls back to the first numeric component valueQuantity
//   (e.g. PROMIS-10 summary observations score via components).
// valueString → parsed when purely numeric.
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

  var integerValue = get(obs, 'valueInteger');
  if (typeof integerValue === 'number' && isFinite(integerValue)) {
    return integerValue;
  }

  var codingExtensions = get(obs, 'valueCodeableConcept.coding[0].extension', []);
  var ordinalExt = codingExtensions.find(function(ext) {
    return (get(ext, 'url', '') + '').indexOf('ordinalValue') !== -1;
  });
  var ordinalValue = get(ordinalExt, 'valueDecimal');
  if (typeof ordinalValue === 'number' && isFinite(ordinalValue)) {
    return ordinalValue;
  }

  var components = get(obs, 'component', []);
  for (var i = 0; i < components.length; i++) {
    var componentValue = get(components[i], 'valueQuantity.value');
    if (componentValue !== undefined && componentValue !== null && isFinite(Number(componentValue))) {
      return Number(componentValue);
    }
  }

  var stringValue = get(obs, 'valueString');
  if (typeof stringValue === 'string' && stringValue.trim() !== '' && isFinite(Number(stringValue))) {
    return Number(stringValue);
  }

  return null;
}

// Human-readable label for coded answers ("Good", "Fair", ...); null when the
// observation carries a plain numeric value.
export function getObservationValueLabel(obs) {
  return get(obs, 'valueCodeableConcept.coding[0].display')
    || get(obs, 'valueCodeableConcept.text')
    || null;
}

// Extract unit from valueQuantity, valueSampledData, or the first component.
export function getObservationUnit(obs) {
  return get(obs, 'valueQuantity.unit')
    || get(obs, 'valueSampledData.origin.unit')
    || get(obs, 'component[0].valueQuantity.unit')
    || null;
}

// Extract per-component numeric series definitions from an observation.
// Returns [{ key, label, value, unit }] for numeric components; [] otherwise.
export function getObservationComponents(obs) {
  var components = get(obs, 'component', []);
  var result = [];
  components.forEach(function(component) {
    var value = get(component, 'valueQuantity.value');
    if (value === undefined || value === null || !isFinite(Number(value))) { return; }
    var label = get(component, 'code.text')
      || get(component, 'code.coding[0].display')
      || get(component, 'code.coding[0].code', 'Component');
    var key = get(component, 'code.coding[0].code') || label;
    result.push({
      key: key,
      label: label,
      value: Number(value),
      unit: get(component, 'valueQuantity.unit') || null
    });
  });
  return result;
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
