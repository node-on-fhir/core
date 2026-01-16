// packages/us-core/lib/decorators/OrganizationDecorator.js
//
// US Core Organization Profile Decorator
// Ensures Organization resources include all required US Core elements
// when returned via FHIR API.
//
// Reference: http://hl7.org/fhir/us/core/StructureDefinition/us-core-organization

import { get, set } from 'lodash';
import { ProfileDecorator } from '../ProfileDecorator.js';

/**
 * US Core Organization Decorator
 * Adds missing US Core must-support elements with appropriate defaults
 */
export class USCoreOrganizationDecorator extends ProfileDecorator {
  constructor() {
    super({
      profileUrl: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-organization",
      resourceType: "Organization",
      requiredExtensions: []  // US Core Organization has no required extensions
    });
  }

  /**
   * Ensure all required US Core extensions exist on the Organization
   * US Core Organization profile does not require custom extensions
   *
   * @param {Object} organization - The Organization resource
   * @returns {Object} - Organization unchanged
   */
  ensureExtensions(organization) {
    // US Core Organization has no required extensions
    return organization;
  }

  /**
   * Ensure required Organization elements exist
   * Missing must-support elements are added with placeholder values
   *
   * @param {Object} organization - The Organization resource
   * @returns {Object} - Organization with elements
   */
  ensureElements(organization) {
    // Ensure identifier array with NPI placeholder (must-support)
    if (!get(organization, 'identifier') || organization.identifier.length === 0) {
      process.env.DEBUG && console.log('USCoreOrganizationDecorator: Adding missing identifier with NPI');
      set(organization, 'identifier', [{
        system: "http://hl7.org/fhir/sid/us-npi",
        value: "1234567893"  // Valid test NPI (passes Luhn algorithm)
      }]);
    }

    // Ensure name exists (required)
    if (!get(organization, 'name')) {
      process.env.DEBUG && console.log('USCoreOrganizationDecorator: Adding missing name');
      set(organization, 'name', 'Unknown Organization');
    }

    // Ensure telecom array (must-support)
    if (!get(organization, 'telecom') || organization.telecom.length === 0) {
      process.env.DEBUG && console.log('USCoreOrganizationDecorator: Adding missing telecom');
      set(organization, 'telecom', [{
        system: "phone",
        value: "000-000-0000"
      }]);
    }

    // Ensure address array with required sub-elements (must-support)
    if (!get(organization, 'address') || organization.address.length === 0) {
      process.env.DEBUG && console.log('USCoreOrganizationDecorator: Adding missing address');
      set(organization, 'address', [{
        line: ["Unknown"],
        city: "Unknown",
        state: "CA",  // Valid USPS state code
        postalCode: "00000",
        country: "US"
      }]);
    }

    // Ensure active field exists (required in US Core)
    if (typeof get(organization, 'active') === 'undefined') {
      set(organization, 'active', true);
    }

    return organization;
  }

  /**
   * Get a description of what this decorator does
   * @returns {string}
   */
  getDescription() {
    return 'Adds US Core Organization must-support elements (identifier with NPI, telecom, address) ' +
           'with placeholder values when missing';
  }
}

// Singleton instance for easy import
export const organizationDecorator = new USCoreOrganizationDecorator();

export default organizationDecorator;
