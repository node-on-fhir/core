// imports/lib/DynamicFhirViews.js
//
// Configurable dispatcher that routes FHIR resources to registered
// Honeycomb Preview components.  The registry is populated at app startup
// via registerDynamicFhirViewComponents().

import React from 'react';
import { get } from 'lodash';
import { Box, Typography, Divider } from '@mui/material';

var _componentMap = {};

/**
 * Register Honeycomb Preview components for FHIR resource types.
 *
 * @param {Object} map  e.g. { Patient: PatientPreview, Observation: ObservationPreview }
 */
export function registerDynamicFhirViewComponents(map) {
  Object.assign(_componentMap, map);
}

/**
 * Look up the registered preview component for a given resourceType.
 *
 * @param {string} resourceType  e.g. "Patient"
 * @returns {React.ComponentType|undefined}
 */
export function getDynamicFhirViewComponent(resourceType) {
  return _componentMap[resourceType];
}

/**
 * Generic fallback preview that renders formatted JSON when no
 * dedicated Preview component is registered for a resource type.
 */
function GenericPreview(props) {
  var resource = props.resource || {};
  var resourceType = get(resource, 'resourceType', 'Unknown');
  var resourceId = get(resource, '_id', get(resource, 'id', ''));

  return React.createElement(Box, { sx: { maxWidth: '8.5in', mx: 'auto', py: 2 } },
    React.createElement(Typography, { variant: 'subtitle1', color: 'text.secondary', sx: { mb: 2 } },
      resourceType
    ),
    React.createElement(Divider, null),
    React.createElement(Box, { sx: { py: 3 } },
      React.createElement('pre', {
        style: {
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          lineHeight: 1.6
        }
      }, JSON.stringify(resource, null, 2))
    ),
    React.createElement(Divider, null),
    resourceId && React.createElement(Box, { sx: { pt: 2 } },
      React.createElement(Typography, { variant: 'caption', color: 'text.secondary' },
        'Resource ID: ' + resourceId
      )
    )
  );
}

/**
 * Dispatcher component: given a FHIR resource, renders the matching
 * Honeycomb Preview component in embedded mode.
 *
 * Props:
 *   fhirResource  {Object}    The FHIR resource object
 *   embedded       {Boolean}   Whether to render in embedded mode (omit wrapper)
 *   onEdit         {Function}  Called when user wants to switch to edit mode
 */
export function DynamicFhirViews(props) {
  var fhirResource = props.fhirResource;
  var embedded = props.embedded || false;
  var onEdit = props.onEdit;

  var resourceType = fhirResource ? fhirResource.resourceType : '';
  var Component = _componentMap[resourceType];

  if (!Component) {
    return React.createElement(GenericPreview, {
      resource: fhirResource
    });
  }

  return React.createElement(Component, {
    resource: fhirResource,
    embedded: embedded,
    onEdit: onEdit
  });
}

export default DynamicFhirViews;
