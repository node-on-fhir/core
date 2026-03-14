// imports/lib/DynamicFhirDetail.js
//
// Configurable dispatcher that routes FHIR resources to registered
// Honeycomb Detail components.  The registry is populated at app startup
// via registerDynamicFhirComponents().

import React from 'react';

var _componentMap = {};

/**
 * Register Honeycomb Detail components for FHIR resource types.
 *
 * @param {Object} map  e.g. { Patient: PatientDetail, Observation: ObservationDetail }
 */
export function registerDynamicFhirComponents(map) {
  Object.assign(_componentMap, map);
}

/**
 * Look up the registered component for a given resourceType.
 *
 * @param {string} resourceType  e.g. "Patient"
 * @returns {React.ComponentType|undefined}
 */
export function getDynamicFhirComponent(resourceType) {
  return _componentMap[resourceType];
}

/**
 * Dispatcher component: given a FHIR resource, renders the matching
 * Honeycomb Detail component in embedded mode.
 *
 * Props:
 *   fhirResource      {Object}    The FHIR resource object
 *   onResourceChange   {Function}  Called with the updated resource when edited
 */
export function DynamicFhirDetail(props) {
  var fhirResource = props.fhirResource;
  var onResourceChange = props.onResourceChange;

  var resourceType = fhirResource ? fhirResource.resourceType : '';
  var Component = _componentMap[resourceType];

  if (!Component) {
    return React.createElement(
      'div',
      { style: { padding: 16, color: '#888' } },
      'No form editor registered for ' + (resourceType || 'unknown resource type') + '.'
    );
  }

  return React.createElement(Component, {
    fhirResource: fhirResource,
    embedded: true,
    onResourceChange: onResourceChange
  });
}

export default DynamicFhirDetail;
