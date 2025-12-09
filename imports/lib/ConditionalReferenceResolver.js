// imports/lib/ConditionalReferenceResolver.js
//
// Utility to resolve conditional references in FHIR bundles at import time.
// Synthea generates conditional references like:
//   "reference": "Organization?identifier=https://github.com/synthetichealth/synthea|uuid"
//
// These need to be resolved to direct references like:
//   "reference": "Organization/actual-fhir-id"
//
// The Ruby FHIR client (and potentially others) cannot parse conditional references
// that contain URLs with lowercase path segments (e.g., "synthetichealth").

import { get, set, has, cloneDeep } from 'lodash';

/**
 * Build a lookup map from identifiers to resource IDs for all resources in a bundle.
 *
 * @param {Object} bundle - FHIR Bundle resource
 * @returns {Object} - Map of "ResourceType|system|value" -> resourceId
 */
function buildIdentifierLookupMap(bundle) {
  const lookupMap = {};

  if (!bundle || !Array.isArray(bundle.entry)) {
    console.warn('[ConditionalReferenceResolver] No entries in bundle');
    return lookupMap;
  }

  bundle.entry.forEach(function(entry) {
    const resource = get(entry, 'resource');
    if (!resource) {
      return;
    }

    const resourceType = get(resource, 'resourceType');
    const resourceId = get(resource, 'id');
    const fullUrl = get(entry, 'fullUrl');

    // Extract UUID from fullUrl if id not present (Synthea uses urn:uuid:xxx format)
    let effectiveId = resourceId;
    if (!effectiveId && fullUrl && fullUrl.startsWith('urn:uuid:')) {
      effectiveId = fullUrl.replace('urn:uuid:', '');
    }

    if (!resourceType || !effectiveId) {
      return;
    }

    // Index by each identifier
    const identifiers = get(resource, 'identifier', []);
    if (Array.isArray(identifiers)) {
      identifiers.forEach(function(identifier) {
        const system = get(identifier, 'system', '');
        const value = get(identifier, 'value', '');

        if (value) {
          // Key format: "ResourceType|system|value"
          const key = resourceType + '|' + system + '|' + value;
          lookupMap[key] = effectiveId;

          // Also index without system for fallback lookups
          const keyNoSystem = resourceType + '||' + value;
          if (!lookupMap[keyNoSystem]) {
            lookupMap[keyNoSystem] = effectiveId;
          }
        }
      });
    }

    // Also index by fullUrl for urn:uuid references
    if (fullUrl) {
      lookupMap[fullUrl] = { resourceType, id: effectiveId };
    }
  });

  return lookupMap;
}

/**
 * Parse a conditional reference string.
 * Format: "ResourceType?identifier=system|value"
 *
 * @param {string} reference - The reference string
 * @returns {Object|null} - { resourceType, system, value } or null if not conditional
 */
function parseConditionalReference(reference) {
  if (!reference || typeof reference !== 'string') {
    return null;
  }

  // Check if this is a conditional reference
  if (!reference.includes('?identifier=')) {
    return null;
  }

  // Parse: ResourceType?identifier=system|value
  const match = reference.match(/^(\w+)\?identifier=(.+)$/);
  if (!match) {
    return null;
  }

  const resourceType = match[1];
  const identifierParam = match[2];

  // Parse system|value - use lastIndexOf since system URLs contain |
  const pipeIndex = identifierParam.lastIndexOf('|');
  let system = '';
  let value = identifierParam;

  if (pipeIndex > 0) {
    system = identifierParam.substring(0, pipeIndex);
    value = identifierParam.substring(pipeIndex + 1);
  }

  return { resourceType, system, value };
}

/**
 * Resolve a single reference if it's conditional.
 *
 * @param {string} reference - The reference string
 * @param {Object} lookupMap - Identifier lookup map
 * @returns {string} - Resolved reference or original if not resolvable
 */
function resolveReference(reference, lookupMap) {
  const parsed = parseConditionalReference(reference);
  if (!parsed) {
    return reference;
  }

  const { resourceType, system, value } = parsed;

  // Try lookup with system
  let key = resourceType + '|' + system + '|' + value;
  let resolvedId = lookupMap[key];

  // Fallback: try without system
  if (!resolvedId) {
    key = resourceType + '||' + value;
    resolvedId = lookupMap[key];
  }

  if (resolvedId) {
    const resolved = resourceType + '/' + resolvedId;
    process.env.DEBUG && console.log('[ConditionalReferenceResolver] Resolved:', reference, '->', resolved);
    return resolved;
  } else {
    console.warn('[ConditionalReferenceResolver] Could not resolve:', reference);
    return reference;
  }
}

/**
 * Resolve urn:uuid references to direct references.
 *
 * @param {string} reference - The reference string (e.g., "urn:uuid:xxx")
 * @param {Object} lookupMap - Identifier lookup map
 * @returns {string} - Resolved reference or original
 */
function resolveUrnReference(reference, lookupMap) {
  if (!reference || !reference.startsWith('urn:uuid:')) {
    return reference;
  }

  const mapping = lookupMap[reference];
  if (mapping && mapping.resourceType && mapping.id) {
    const resolved = mapping.resourceType + '/' + mapping.id;
    process.env.DEBUG && console.log('[ConditionalReferenceResolver] Resolved URN:', reference, '->', resolved);
    return resolved;
  }

  return reference;
}

/**
 * Recursively walk an object and resolve all reference fields.
 * FHIR references are objects with a "reference" property.
 *
 * @param {any} obj - Object to process
 * @param {Object} lookupMap - Identifier lookup map
 * @param {string} path - Current path (for debugging)
 * @returns {any} - Processed object with resolved references
 */
function resolveReferencesInObject(obj, lookupMap, path) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(function(item, index) {
      return resolveReferencesInObject(item, lookupMap, path + '[' + index + ']');
    });
  }

  if (typeof obj === 'object') {
    const result = {};

    for (const key of Object.keys(obj)) {
      const value = obj[key];
      const newPath = path ? path + '.' + key : key;

      if (key === 'reference' && typeof value === 'string') {
        // This is a reference field - resolve it
        let resolved = resolveReference(value, lookupMap);
        // Also try URN resolution
        if (resolved === value) {
          resolved = resolveUrnReference(value, lookupMap);
        }
        result[key] = resolved;
      } else {
        // Recurse into nested objects
        result[key] = resolveReferencesInObject(value, lookupMap, newPath);
      }
    }

    return result;
  }

  // Primitive value - return as-is
  return obj;
}

/**
 * Resolve all conditional references in a FHIR Bundle.
 * This modifies the bundle in place and also returns it.
 *
 * Two-pass algorithm:
 * 1. Build lookup map from all resource identifiers
 * 2. Resolve all conditional references using the map
 *
 * @param {Object} bundle - FHIR Bundle resource
 * @returns {Object} - Bundle with resolved references
 */
function resolveConditionalReferencesInBundle(bundle) {
  console.log('[ConditionalReferenceResolver] Processing bundle with',
    get(bundle, 'entry.length', 0), 'entries');

  if (!bundle || get(bundle, 'resourceType') !== 'Bundle') {
    console.warn('[ConditionalReferenceResolver] Not a valid Bundle');
    return bundle;
  }

  // Pass 1: Build lookup map
  const lookupMap = buildIdentifierLookupMap(bundle);
  const mapSize = Object.keys(lookupMap).length;
  console.log('[ConditionalReferenceResolver] Built lookup map with', mapSize, 'entries');

  if (mapSize === 0) {
    console.warn('[ConditionalReferenceResolver] Empty lookup map - no identifiers found');
    return bundle;
  }

  // Pass 2: Resolve references in each entry
  let resolvedCount = 0;

  if (Array.isArray(bundle.entry)) {
    bundle.entry = bundle.entry.map(function(entry, index) {
      if (entry.resource) {
        const originalJson = JSON.stringify(entry.resource);
        entry.resource = resolveReferencesInObject(entry.resource, lookupMap, '');
        const newJson = JSON.stringify(entry.resource);

        if (originalJson !== newJson) {
          resolvedCount++;
        }
      }
      return entry;
    });
  }

  console.log('[ConditionalReferenceResolver] Resolved references in', resolvedCount, 'resources');

  return bundle;
}

/**
 * Resolve conditional references in a single resource using a provided lookup map
 * or by looking up in the database.
 *
 * This is useful for resolving references in resources that are already in the database.
 *
 * @param {Object} resource - FHIR resource
 * @param {Object} lookupMap - Optional pre-built lookup map
 * @returns {Object} - Resource with resolved references
 */
function resolveConditionalReferencesInResource(resource, lookupMap) {
  if (!resource || !lookupMap) {
    return resource;
  }

  return resolveReferencesInObject(resource, lookupMap, '');
}

// Export functions
const ConditionalReferenceResolver = {
  resolveConditionalReferencesInBundle,
  resolveConditionalReferencesInResource,
  buildIdentifierLookupMap,
  parseConditionalReference,
  resolveReference,
  resolveUrnReference
};

export default ConditionalReferenceResolver;
export {
  resolveConditionalReferencesInBundle,
  resolveConditionalReferencesInResource,
  buildIdentifierLookupMap,
  parseConditionalReference,
  resolveReference,
  resolveUrnReference
};
