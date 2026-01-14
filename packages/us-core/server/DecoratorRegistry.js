// packages/us-core/server/DecoratorRegistry.js
//
// Profile Decorator Registry
// Discovers and manages profile decorators from installed IG packages.
// Uses the Package Discovery Pattern similar to ProfileSet discovery in Metadata.js.

import { get, cloneDeep } from 'lodash';

// Import the Patient decorator
import { patientDecorator } from '../lib/decorators/PatientDecorator.js';

// Registry of all profile decorators, keyed by resourceType
// Each resourceType can have multiple decorators (from different IGs)
const decoratorRegistry = new Map();

// Track whether discovery has been run
let discoveryComplete = false;

/**
 * Register a decorator for a resource type
 * @param {string} resourceType - FHIR resource type
 * @param {Object} decorator - ProfileDecorator instance
 */
export function registerDecorator(resourceType, decorator) {
  if (!decoratorRegistry.has(resourceType)) {
    decoratorRegistry.set(resourceType, []);
  }

  // Avoid duplicates
  const existing = decoratorRegistry.get(resourceType);
  const alreadyRegistered = existing.some(function(d) {
    return d.profileUrl === decorator.profileUrl;
  });

  if (!alreadyRegistered) {
    existing.push(decorator);
    console.log('DecoratorRegistry: Registered ' + decorator.profileUrl + ' for ' + resourceType);
  }
}

/**
 * Discover decorators from installed Atmosphere packages
 * This runs once at startup and looks for packages that export ProfileDecorators
 */
export function discoverDecorators() {
  if (discoveryComplete) {
    console.log('DecoratorRegistry: Discovery already complete, skipping');
    return;
  }

  console.log('DecoratorRegistry: Starting decorator discovery...');

  // First, register our own decorators
  registerDecorator('Patient', patientDecorator);

  // Then discover decorators from other packages
  // This follows the same pattern as ProfileSet discovery in Metadata.js
  if (typeof Package !== 'undefined') {
    Object.keys(Package).forEach(function(packageName) {
      try {
        const pkg = Package[packageName];

        // Check if package exports ProfileDecorators
        if (pkg && pkg.ProfileDecorators) {
          console.log('DecoratorRegistry: Found ProfileDecorators in ' + packageName);

          const decorators = pkg.ProfileDecorators;
          Object.entries(decorators).forEach(function([resourceType, decorator]) {
            registerDecorator(resourceType, decorator);
          });
        }
      } catch (err) {
        console.error('DecoratorRegistry: Error discovering decorators from ' + packageName, err);
      }
    });
  } else {
    console.log('DecoratorRegistry: Package global not available (non-Meteor context)');
  }

  discoveryComplete = true;
  console.log('DecoratorRegistry: Discovery complete. Registered decorators for: ' +
    Array.from(decoratorRegistry.keys()).join(', '));
}

/**
 * Get decorators for a resource type
 * @param {string} resourceType - FHIR resource type
 * @returns {Array} - Array of decorators
 */
export function getDecorators(resourceType) {
  return decoratorRegistry.get(resourceType) || [];
}

/**
 * Apply all registered decorators for a resource
 * @param {Object} resource - The FHIR resource to decorate
 * @param {string} requestedProfile - Optional specific profile URL to apply
 * @returns {Object} - The decorated resource
 */
export function applyDecorators(resource, requestedProfile) {
  // Ensure discovery has been run
  if (!discoveryComplete) {
    discoverDecorators();
  }

  const resourceType = get(resource, 'resourceType');
  if (!resourceType) {
    console.warn('DecoratorRegistry: Cannot decorate resource without resourceType');
    return resource;
  }

  const decorators = getDecorators(resourceType);
  if (decorators.length === 0) {
    // No decorators for this resource type
    return resource;
  }

  let result = resource;

  for (const decorator of decorators) {
    // If specific profile requested, only apply matching decorator
    if (requestedProfile && decorator.profileUrl !== requestedProfile) {
      continue;
    }

    // Apply the decorator
    try {
      result = decorator.decorate(result);
      process.env.DEBUG && console.log('DecoratorRegistry: Applied ' + decorator.profileUrl);
    } catch (err) {
      console.error('DecoratorRegistry: Error applying decorator ' + decorator.profileUrl, err);
    }
  }

  return result;
}

/**
 * Check if any decorators are registered for a resource type
 * @param {string} resourceType
 * @returns {boolean}
 */
export function hasDecorators(resourceType) {
  return decoratorRegistry.has(resourceType) && decoratorRegistry.get(resourceType).length > 0;
}

/**
 * Get all registered resource types
 * @returns {Array}
 */
export function getDecoratedResourceTypes() {
  return Array.from(decoratorRegistry.keys());
}

/**
 * Clear the registry (useful for testing)
 */
export function clearRegistry() {
  decoratorRegistry.clear();
  discoveryComplete = false;
}

// Export decorators for package discovery by other packages
// This needs to be a global variable for Meteor's api.export() to work
ProfileDecorators = {
  Patient: patientDecorator
};

export { ProfileDecorators };

export default {
  discoverDecorators,
  applyDecorators,
  registerDecorator,
  getDecorators,
  hasDecorators,
  getDecoratedResourceTypes,
  clearRegistry,
  ProfileDecorators
};
