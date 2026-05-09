// imports/lib/FhirContainedExtractor.js
//
// Reusable, isomorphic utility for extracting contained resources from FHIR
// resource bundles. No Meteor dependencies — only lodash.
//
// Usage:
//   import { extractContainedResources, extractAllContained } from '/imports/lib/FhirContainedExtractor';
//
//   // Single parent resource
//   const items = extractContainedResources(supplyDelivery);
//   // → [{ resourceType: 'NutritionProduct', id: 'artemis-001', ..., _containedIn: {...}, _isContained: true }]
//
//   // Array of parent resources
//   const map = extractAllContained(supplyDeliveries);
//   // → { NutritionProduct: [...], Medication: [...] }

import { get } from 'lodash';

/**
 * Extract contained resources from a single FHIR resource.
 *
 * @param {Object} resource - A FHIR resource that may have a `contained` array.
 * @param {Object} [options]
 * @param {string} [options.filterType] - If provided, only return contained resources of this resourceType.
 * @param {boolean} [options.addProvenance=true] - Attach _containedIn and _isContained metadata.
 * @returns {Array<Object>} Array of extracted contained resources.
 */
export function extractContainedResources(resource, options) {
  const filterType = get(options, 'filterType', null);
  const addProvenance = get(options, 'addProvenance', true);

  const contained = get(resource, 'contained');
  if (!Array.isArray(contained) || contained.length === 0) {
    return [];
  }

  const parentType = get(resource, 'resourceType', 'Unknown');
  const parentId = get(resource, '_id') || get(resource, 'id');

  const results = [];

  for (let i = 0; i < contained.length; i++) {
    const item = contained[i];
    if (!item || !item.resourceType) {
      continue;
    }

    if (filterType && item.resourceType !== filterType) {
      continue;
    }

    // Shallow copy so we don't mutate the original resource
    const extracted = Object.assign({}, item);

    if (addProvenance) {
      extracted._containedIn = {
        resourceType: parentType,
        id: parentId,
        reference: parentType + '/' + parentId
      };
      extracted._isContained = true;
    }

    results.push(extracted);
  }

  return results;
}

/**
 * Extract all contained resources from an array of parent resources.
 * Groups results by resourceType.
 *
 * @param {Array<Object>} resources - Array of FHIR resources to scan.
 * @param {Object} [options]
 * @param {string} [options.filterType] - If provided, only return contained resources of this resourceType.
 * @param {boolean} [options.addProvenance=true] - Attach _containedIn and _isContained metadata.
 * @returns {Object} Map of resourceType → Array<Object>.
 */
export function extractAllContained(resources, options) {
  const result = {};

  if (!Array.isArray(resources)) {
    return result;
  }

  for (let i = 0; i < resources.length; i++) {
    const extracted = extractContainedResources(resources[i], options);

    for (let j = 0; j < extracted.length; j++) {
      const item = extracted[j];
      const type = item.resourceType;

      if (!result[type]) {
        result[type] = [];
      }
      result[type].push(item);
    }
  }

  return result;
}
