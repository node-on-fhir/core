// packages/us-core/lib/extensions.js
//
// US Core Extension definitions and helper functions
// These extensions are added to resources when returning via FHIR API
// to ensure compliance with US Core profile requirements.
//
// Reference: https://hl7.org/fhir/us/core/STU7/

import { get } from 'lodash';

// Standard system URLs
const DATA_ABSENT_REASON = "http://terminology.hl7.org/CodeSystem/data-absent-reason";
const NULL_FLAVOR = "http://terminology.hl7.org/CodeSystem/v3-NullFlavor";
const CDC_RACE_ETHNICITY = "urn:oid:2.16.840.1.113883.6.238";
const TRIBAL_ENTITY_US = "http://terminology.hl7.org/CodeSystem/v3-TribalEntityUS";

/**
 * US Core Extension definitions with factory methods
 * Each extension has:
 * - url: The canonical extension URL
 * - createUnknown/createDefault: Factory for missing/unknown data
 * - create: Factory for actual data
 */
export const USCoreExtensions = {
  race: {
    url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",

    /**
     * Create race extension when data is unknown
     * Uses NullFlavor UNK per US Core guidance
     */
    createUnknown: function() {
      return {
        url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
        extension: [
          {
            url: "ombCategory",
            valueCoding: {
              system: NULL_FLAVOR,
              code: "UNK",
              display: "Unknown"
            }
          },
          { url: "text", valueString: "Unknown" }
        ]
      };
    },

    /**
     * Create race extension with actual data
     * @param {Array} ombCategories - Array of OMB category codings
     * @param {Array} detailedRaces - Array of detailed race codings (optional)
     * @param {string} text - Display text
     */
    create: function(ombCategories, detailedRaces, text) {
      let extension = {
        url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
        extension: []
      };

      // Add OMB categories
      if (Array.isArray(ombCategories)) {
        ombCategories.forEach(function(cat) {
          extension.extension.push({
            url: "ombCategory",
            valueCoding: {
              system: CDC_RACE_ETHNICITY,
              code: cat.code,
              display: cat.display
            }
          });
        });
      }

      // Add detailed races (optional)
      if (Array.isArray(detailedRaces)) {
        detailedRaces.forEach(function(race) {
          extension.extension.push({
            url: "detailed",
            valueCoding: {
              system: CDC_RACE_ETHNICITY,
              code: race.code,
              display: race.display
            }
          });
        });
      }

      // Text is required
      extension.extension.push({
        url: "text",
        valueString: text || "Unknown"
      });

      return extension;
    }
  },

  ethnicity: {
    url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",

    /**
     * Create ethnicity extension when data is unknown
     */
    createUnknown: function() {
      return {
        url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
        extension: [
          {
            url: "ombCategory",
            valueCoding: {
              system: NULL_FLAVOR,
              code: "UNK",
              display: "Unknown"
            }
          },
          { url: "text", valueString: "Unknown" }
        ]
      };
    },

    /**
     * Create ethnicity extension with actual data
     * @param {Object} ombCategory - OMB category coding (Hispanic/Non-Hispanic)
     * @param {Array} detailedEthnicities - Array of detailed ethnicity codings
     * @param {string} text - Display text
     */
    create: function(ombCategory, detailedEthnicities, text) {
      let extension = {
        url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
        extension: []
      };

      // Add OMB category
      if (ombCategory) {
        extension.extension.push({
          url: "ombCategory",
          valueCoding: {
            system: CDC_RACE_ETHNICITY,
            code: ombCategory.code,
            display: ombCategory.display
          }
        });
      }

      // Add detailed ethnicities
      if (Array.isArray(detailedEthnicities)) {
        detailedEthnicities.forEach(function(eth) {
          extension.extension.push({
            url: "detailed",
            valueCoding: {
              system: CDC_RACE_ETHNICITY,
              code: eth.code,
              display: eth.display
            }
          });
        });
      }

      // Text is required
      extension.extension.push({
        url: "text",
        valueString: text || "Unknown"
      });

      return extension;
    }
  },

  tribalAffiliation: {
    url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-tribal-affiliation",

    /**
     * Create tribal affiliation extension with default "asked but unknown"
     */
    createDefault: function() {
      return {
        url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-tribal-affiliation",
        extension: [
          {
            url: "tribalAffiliation",
            valueCodeableConcept: {
              coding: [{
                system: DATA_ABSENT_REASON,
                code: "asked-unknown",
                display: "Asked But Unknown"
              }]
            }
          },
          { url: "isEnrolled", valueBoolean: false }
        ]
      };
    },

    /**
     * Create tribal affiliation extension with actual data
     * @param {Object} tribe - Tribe coding from v3-TribalEntityUS
     * @param {boolean} isEnrolled - Whether the patient is enrolled
     */
    create: function(tribe, isEnrolled) {
      return {
        url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-tribal-affiliation",
        extension: [
          {
            url: "tribalAffiliation",
            valueCodeableConcept: {
              coding: [{
                system: TRIBAL_ENTITY_US,
                code: tribe.code,
                display: tribe.display
              }],
              text: tribe.text || tribe.display
            }
          },
          { url: "isEnrolled", valueBoolean: isEnrolled === true }
        ]
      };
    }
  },

  individualSex: {
    url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-sex",

    /**
     * Create individual sex extension when unknown
     * Uses data-absent-reason code per US Core guidance
     * Valid codes: female, male, unknown
     */
    createUnknown: function() {
      return {
        url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-sex",
        valueCode: "unknown"
      };
    },

    /**
     * Create individual sex extension with actual data
     * @param {string} code - Valid codes: female, male, unknown
     */
    create: function(code) {
      return {
        url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-sex",
        valueCode: code
      };
    }
  },

  birthsex: {
    url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex",

    /**
     * Create birthsex extension when unknown
     */
    createUnknown: function() {
      return {
        url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex",
        valueCode: "UNK"
      };
    },

    /**
     * Create birthsex extension with actual data
     * @param {string} code - F (Female), M (Male), or UNK (Unknown)
     */
    create: function(code) {
      return {
        url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex",
        valueCode: code
      };
    }
  },

  genderIdentity: {
    url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-genderIdentity",

    /**
     * Create gender identity extension when unknown
     */
    createUnknown: function() {
      return {
        url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-genderIdentity",
        valueCodeableConcept: {
          coding: [{
            system: DATA_ABSENT_REASON,
            code: "unknown",
            display: "Unknown"
          }]
        }
      };
    },

    /**
     * Create gender identity extension with actual data
     * @param {Object} coding - Gender identity coding
     */
    create: function(coding) {
      return {
        url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-genderIdentity",
        valueCodeableConcept: {
          coding: [coding]
        }
      };
    }
  },

  interpreterNeeded: {
    url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-interpreter-needed",

    /**
     * Create interpreter needed extension
     * @param {string} code - SNOMED code (373066001 = yes, 373067005 = no)
     */
    create: function(code) {
      return {
        url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-interpreter-needed",
        valueCoding: {
          system: "http://snomed.info/sct",
          version: "http://snomed.info/sct/731000124108",
          code: code
        }
      };
    }
  }
};

/**
 * Check if an extension exists in an array of extensions
 * @param {Array} extensions - Array of FHIR extensions
 * @param {string} shortName - Short name key from USCoreExtensions (e.g., 'race', 'ethnicity')
 * @returns {boolean}
 */
export function hasExtension(extensions, shortName) {
  const url = get(USCoreExtensions, shortName + '.url');
  if (!url) {
    console.warn('USCoreExtensions: Unknown extension shortName: ' + shortName);
    return false;
  }
  return Array.isArray(extensions) && extensions.some(function(ext) {
    return get(ext, 'url') === url;
  });
}

/**
 * Get an extension from an array of extensions
 * @param {Array} extensions - Array of FHIR extensions
 * @param {string} shortName - Short name key from USCoreExtensions
 * @returns {Object|null}
 */
export function getExtension(extensions, shortName) {
  const url = get(USCoreExtensions, shortName + '.url');
  if (!url) {
    console.warn('USCoreExtensions: Unknown extension shortName: ' + shortName);
    return null;
  }
  return Array.isArray(extensions)
    ? extensions.find(function(ext) { return get(ext, 'url') === url; })
    : null;
}

/**
 * Remove an extension from an array of extensions
 * @param {Array} extensions - Array of FHIR extensions
 * @param {string} shortName - Short name key from USCoreExtensions
 * @returns {Array} - New array without the extension
 */
export function removeExtension(extensions, shortName) {
  const url = get(USCoreExtensions, shortName + '.url');
  if (!url || !Array.isArray(extensions)) {
    return extensions || [];
  }
  return extensions.filter(function(ext) {
    return get(ext, 'url') !== url;
  });
}

export default USCoreExtensions;
