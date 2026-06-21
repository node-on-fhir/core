// packages/us-core/lib/ProfileDecorator.js
//
// Base class for FHIR Profile Decorators
// This provides a template method pattern for applying IG-specific
// profile requirements to FHIR resources at egress time.
//
// Each Implementation Guide (US Core, PACIO, etc.) can extend this
// base class for their specific resource types.

import { get, set, cloneDeep } from 'lodash';

/**
 * Base class for profile decorators
 * Subclasses override specific methods to add IG-specific behavior
 */
export class ProfileDecorator {
  /**
   * @param {Object} config - Configuration options
   * @param {string} config.profileUrl - The canonical profile URL
   * @param {string} config.resourceType - FHIR resource type (e.g., 'Patient')
   * @param {Array} config.requiredExtensions - List of required extension short names
   */
  constructor(config) {
    this.profileUrl = get(config, 'profileUrl', '');
    this.resourceType = get(config, 'resourceType', '');
    this.requiredExtensions = get(config, 'requiredExtensions', []);

    if (!this.profileUrl) {
      console.warn('ProfileDecorator: Missing profileUrl in config');
    }
    if (!this.resourceType) {
      console.warn('ProfileDecorator: Missing resourceType in config');
    }
  }

  /**
   * Template method - applies all decorations to a resource
   * Subclasses typically override ensureExtensions() and ensureElements()
   *
   * @param {Object} resource - The FHIR resource to decorate
   * @returns {Object} - The decorated resource (new object, original unchanged)
   */
  decorate(resource) {
    // Don't modify the original
    let decorated = cloneDeep(resource);

    // Verify resource type matches
    if (get(decorated, 'resourceType') !== this.resourceType) {
      console.warn('ProfileDecorator: Resource type mismatch. Expected ' +
        this.resourceType + ', got ' + get(decorated, 'resourceType'));
      return decorated;
    }

    // Apply decorations in order
    decorated = this.ensureMetaProfile(decorated);
    decorated = this.ensureExtensions(decorated);
    decorated = this.ensureElements(decorated);

    return decorated;
  }

  /**
   * Ensure the profile URL is in meta.profile
   * @param {Object} resource
   * @returns {Object}
   */
  ensureMetaProfile(resource) {
    if (!this.profileUrl) {
      return resource;
    }

    let profiles = get(resource, 'meta.profile', []);

    if (!Array.isArray(profiles)) {
      profiles = [];
    }

    if (!profiles.includes(this.profileUrl)) {
      profiles.push(this.profileUrl);
    }

    // Ensure meta object exists
    if (!get(resource, 'meta')) {
      set(resource, 'meta', {});
    }

    set(resource, 'meta.profile', profiles);

    return resource;
  }

  /**
   * Ensure required extensions exist on the resource
   * Subclasses should override this method
   *
   * @param {Object} resource
   * @returns {Object}
   */
  ensureExtensions(resource) {
    // Base implementation does nothing
    // Subclasses add their required extensions
    return resource;
  }

  /**
   * Ensure required structural elements exist
   * Subclasses should override this method for element-specific logic
   *
   * @param {Object} resource
   * @returns {Object}
   */
  ensureElements(resource) {
    // Base implementation does nothing
    // Subclasses add their required elements
    return resource;
  }

  /**
   * Check if the decorator applies to a given resource
   * Can be overridden for conditional application
   *
   * @param {Object} resource
   * @returns {boolean}
   */
  appliesTo(resource) {
    return get(resource, 'resourceType') === this.resourceType;
  }

  /**
   * Get a human-readable description of what this decorator does
   * @returns {string}
   */
  getDescription() {
    return 'Applies ' + this.profileUrl + ' profile to ' + this.resourceType + ' resources';
  }
}

export default ProfileDecorator;
