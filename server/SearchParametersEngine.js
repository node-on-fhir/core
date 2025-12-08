// server/SearchParametersEngine.js
// SearchParametersEngine - Compile-time search parameter processing for FHIR queries
// Replaces runtime MongoDB lookups with in-memory compiled lookup table

// =============================================================================
// BEST PRACTICE: ONC (g)(10) Certification Test Requirements
// =============================================================================
//
// For each (g)(10) test (12.x.xx), ensure a SearchParameter file exists for
// EVERY search parameter used in that test. Without these files, the engine
// returns null for queries and search parameters are silently ignored.
//
// CHECKLIST for adding support for a new resource type:
//
// 1. Create SearchParameter JSON files in private/SearchParameters/:
//    - SearchParameter-{resource}-patient.json   (for patient compartment)
//    - SearchParameter-{resource}-status.json    (if status search is needed)
//    - SearchParameter-{resource}-category.json  (if category search is needed)
//    - SearchParameter-{resource}-code.json      (if code search is needed)
//
// 2. Add filenames to the searchParameterFiles array in loadCoreSearchParameters()
//
// 3. Restart server with INITIALIZE_SEARCH_PARAMETERS=true to compile
//
// 4. Verify in logs: "[SearchParametersEngine] Compiled: {ResourceType}.{param}"
//
// Common (g)(10) test search parameters by resource:
//   - Patient: identifier, name, birthdate, gender, address, telecom
//   - Condition: patient, category, clinical-status, code
//   - Observation: patient, category, code, date
//   - Procedure: patient, date, code
//   - CarePlan: patient, category, status
//   - CareTeam: patient, status
//   - AllergyIntolerance: patient, clinical-status
//   - Immunization: patient, date, status
//   - MedicationRequest: patient, status, intent
//   - DiagnosticReport: patient, category, code, date
//   - DocumentReference: patient, category, type, date
//
// =============================================================================

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import fhirpath from 'fhirpath';

// Import type handlers from RestHelpers
import { RestHelpers } from './RestHelpers.js';

// =============================================================================
// SearchParametersEngine
// =============================================================================

const SearchParametersEngine = {
  // In-memory compiled lookup table
  // Structure: { Patient: { identifier: {...}, name: {...} }, Observation: { code: {...} }, ... }
  _compiledParams: {},

  // All loaded SearchParameter resources (for MongoDB insert)
  _allSearchParams: [],

  // Flag to track if engine is compiled
  _isCompiled: false,

  // ==========================================================================
  // Configuration
  // ==========================================================================

  /**
   * Check if the engine is enabled
   * Engine is enabled by default, can be disabled with DISABLE_SP_ENGINE=true
   * @returns {boolean}
   */
  isEnabled: function() {
    if (process.env.DISABLE_SP_ENGINE === 'true') {
      return false;
    }
    if (get(Meteor, 'settings.private.searchParameters.disableEngine') === true) {
      return false;
    }
    return true;
  },

  /**
   * Check if the engine is compiled
   * @returns {boolean}
   */
  isCompiled: function() {
    return this._isCompiled;
  },

  // ==========================================================================
  // FHIRPath Expression Parsing
  // ==========================================================================

  /**
   * Derive baseField from FHIRPath expression
   * Uses regex parsing (fhirpath.js parser can be added for complex cases)
   *
   * Examples:
   * - "Patient.identifier" -> "identifier"
   * - "Patient.name.given | Patient.name.family" -> "name"
   * - "Observation.subject.where(resolve() is Patient)" -> "subject"
   * - "CarePlan.category" -> "category"
   *
   * @param {string} resourceType - e.g., "Patient", "Observation"
   * @param {string} expression - FHIRPath expression
   * @returns {string|null} - Top-level field name or null
   */
  deriveBaseField: function(resourceType, expression) {
    if (!expression || !resourceType) {
      console.warn('[SearchParametersEngine] deriveBaseField: Missing expression or resourceType');
      return null;
    }

    // Handle union expressions - take first path
    const first = expression.split('|')[0].trim();

    // Strip .where() clauses - use greedy .* to handle nested parentheses like .where(resolve() is Patient)
    const cleanPath = first.replace(/\.where\(.*\)$/g, '');

    // Must start with ResourceType.
    const prefix = resourceType + '.';
    if (!cleanPath.startsWith(prefix)) {
      console.warn('[SearchParametersEngine] deriveBaseField: Expression does not start with ' + prefix + ': ' + expression);
      return null;
    }

    // Get the path after ResourceType.
    const path = cleanPath.substring(prefix.length);

    // Return the top-level field (first segment)
    const segments = path.split('.');
    return segments[0] || null;
  },

  /**
   * Detect the FHIR datatype for a field based on patterns
   * This replaces the hardcoded lists in isCodeableConceptField(), isIdentifierField(), etc.
   *
   * @param {string} baseField - e.g., "identifier", "category", "name"
   * @param {string} searchParamType - e.g., "token", "string", "date", "reference"
   * @param {string} expression - Original FHIRPath expression
   * @returns {string} - Field type: "Identifier", "CodeableConcept", "HumanName", "Reference", "code", "string", "date"
   */
  detectFieldType: function(baseField, searchParamType, expression) {
    if (!baseField) {
      console.warn('[SearchParametersEngine] detectFieldType: Missing baseField');
      return 'unknown';
    }

    // Reference type search parameters always target Reference fields
    if (searchParamType === 'reference') {
      return 'Reference';
    }

    // Token type can be: Identifier, CodeableConcept, Coding, code, boolean
    if (searchParamType === 'token') {
      // Identifier fields
      if (baseField === 'identifier') {
        return 'Identifier';
      }

      // Simple code fields (status, gender, intent, etc.)
      const simpleCodeFields = [
        'status', 'intent', 'gender', 'priority', 'use', 'mode',
        'lifecycleStatus', 'active', 'experimental', 'doNotPerform'
      ];
      if (simpleCodeFields.includes(baseField)) {
        return 'code';
      }

      // CodeableConcept fields
      const codeableConceptFields = [
        'category', 'code', 'type', 'specialty', 'role', 'class',
        'clinicalStatus', 'verificationStatus', 'vaccineCode',
        'route', 'site', 'method', 'bodySite', 'severity', 'criticality',
        'dischargeDisposition', 'serviceType', 'reasonCode',
        'interpretation', 'dataAbsentReason', 'reaction', 'substance'
      ];
      if (codeableConceptFields.includes(baseField)) {
        return 'CodeableConcept';
      }

      // Default for unknown token fields - treat as simple code
      return 'code';
    }

    // String type can be: HumanName, Address, string
    if (searchParamType === 'string') {
      if (baseField === 'name') {
        return 'HumanName';
      }
      if (baseField === 'address') {
        return 'Address';
      }
      return 'string';
    }

    // Date type
    if (searchParamType === 'date') {
      return 'date';
    }

    // Number, quantity, uri types
    return searchParamType;
  },

  // ==========================================================================
  // Package Discovery
  // ==========================================================================

  /**
   * Discover SearchParameters from packages
   * Follows the ProfileSet/ProfileDecorators pattern
   * Packages export SearchParametersRegistry with searchParameters array
   *
   * @returns {Array} - Array of SearchParameter resources from packages
   */
  discoverPackageSearchParameters: function() {
    const packageParams = [];

    if (typeof Package === 'undefined') {
      console.warn('[SearchParametersEngine] Package global not available');
      return packageParams;
    }

    Object.keys(Package).forEach(function(packageName) {
      try {
        const pkg = Package[packageName];
        if (pkg && pkg.SearchParametersRegistry) {
          console.log('[SearchParametersEngine] Discovered SearchParametersRegistry in package:', packageName);

          const registry = pkg.SearchParametersRegistry;

          if (Array.isArray(registry.searchParameters)) {
            registry.searchParameters.forEach(function(sp) {
              if (get(sp, 'resourceType') === 'SearchParameter') {
                packageParams.push(sp);
                console.log('[SearchParametersEngine]   - ' + get(sp, 'id') + ' (' + get(sp, 'code') + ')');
              }
            });
          } else if (typeof registry.getSearchParameters === 'function') {
            // Support async loader pattern (not commonly used)
            console.log('[SearchParametersEngine]   Package uses async loader - will be processed separately');
          }
        }
      } catch (err) {
        console.error('[SearchParametersEngine] Error discovering from package ' + packageName + ':', err);
      }
    });

    console.log('[SearchParametersEngine] Discovered ' + packageParams.length + ' SearchParameters from packages');
    return packageParams;
  },

  // ==========================================================================
  // Compilation
  // ==========================================================================

  /**
   * Load SearchParameter JSON files from Assets
   * @returns {Array} - Array of SearchParameter resources
   */
  loadCoreSearchParameters: async function() {
    const coreParams = [];

    // List of SearchParameter JSON files to load
    const searchParameterFiles = [
      'SearchParameter-patient-address-city.json',
      'SearchParameter-patient-birthdate.json',
      'SearchParameter-patient-family.json',
      'SearchParameter-patient-given.json',
      'SearchParameter-patient-identifier.json',
      'SearchParameter-patient-language.json',
      'SearchParameter-patient-name.json',
      'SearchParameter-patient-organization.json',
      'SearchParameter-patient-telecom.json',
      'SearchParameter-patient-gender.json',
      'SearchParameter-condition-patient.json',
      'SearchParameter-observation-patient.json',
      'SearchParameter-procedure-patient.json',
      'SearchParameter-encounter-patient.json',
      'SearchParameter-medicationrequest-patient.json',
      'SearchParameter-allergyintolerance-patient.json',
      'SearchParameter-appointment-patient.json',
      'SearchParameter-careplan-patient.json',
      'SearchParameter-consent-patient.json',
      'SearchParameter-coverage-patient.json',
      'SearchParameter-device-patient.json',
      'SearchParameter-diagnosticreport-patient.json',
      'SearchParameter-documentreference-patient.json',
      'SearchParameter-imagingstudy-patient.json',
      'SearchParameter-immunization-patient.json',
      'SearchParameter-media-patient.json',
      'SearchParameter-medicationadministration-patient.json',
      'SearchParameter-nutritionorder-patient.json',
      'SearchParameter-questionnaireresponse-patient.json',
      'SearchParameter-researchsubject-patient.json',
      'SearchParameter-servicerequest-patient.json',
      'SearchParameter-supplydelivery-patient.json',
      'SearchParameter-careplan-category.json',
      'SearchParameter-careteam-patient.json',
      'SearchParameter-careteam-status.json',
      'SearchParameter-condition-category.json',
      'SearchParameter-diagnosticreport-category.json'
    ];

    for (const fileName of searchParameterFiles) {
      try {
        const json = JSON.parse(await Assets.getTextAsync('SearchParameters/' + fileName));
        if (get(json, 'resourceType') === 'SearchParameter') {
          coreParams.push(json);
        }
      } catch (err) {
        console.warn('[SearchParametersEngine] Could not load ' + fileName + ':', err.message);
      }
    }

    console.log('[SearchParametersEngine] Loaded ' + coreParams.length + ' core SearchParameters from Assets');
    return coreParams;
  },

  /**
   * Compile all SearchParameters into the lookup table
   * Called at startup when INITIALIZE_SEARCH_PARAMETERS is set
   */
  compile: async function() {
    console.log('[SearchParametersEngine] Compiling search parameters...');

    this._compiledParams = {};
    this._allSearchParams = [];

    // 1. Load core SearchParameters from Assets
    const coreParams = await this.loadCoreSearchParameters();

    // 2. Discover package-provided SearchParameters
    const packageParams = this.discoverPackageSearchParameters();

    // 3. Combine all SearchParameters
    const allParams = [...coreParams, ...packageParams];
    this._allSearchParams = allParams;

    // 4. Compile each SearchParameter into the lookup table
    for (const sp of allParams) {
      const code = get(sp, 'code');
      const type = get(sp, 'type');
      const expression = get(sp, 'expression');
      const baseArray = get(sp, 'base', []);

      if (!code || !expression) {
        console.warn('[SearchParametersEngine] Skipping SearchParameter without code or expression:', get(sp, 'id'));
        continue;
      }

      for (const resourceType of baseArray) {
        const baseField = this.deriveBaseField(resourceType, expression);

        if (!baseField) {
          console.warn('[SearchParametersEngine] Could not derive baseField for ' + get(sp, 'id') + ' on ' + resourceType);
          continue;
        }

        const fieldType = this.detectFieldType(baseField, type, expression);

        if (!this._compiledParams[resourceType]) {
          this._compiledParams[resourceType] = {};
        }

        this._compiledParams[resourceType][code] = {
          type: type,
          baseField: baseField,
          fieldType: fieldType,
          expression: expression,
          target: get(sp, 'target', null),
          multipleOr: get(sp, 'multipleOr', false),
          multipleAnd: get(sp, 'multipleAnd', false),
          comparators: get(sp, 'comparator', null),
          modifiers: get(sp, 'modifier', null),
          id: get(sp, 'id')
        };

        console.log('[SearchParametersEngine] Compiled: ' + resourceType + '.' + code +
          ' -> ' + baseField + ' (' + fieldType + ')');
      }
    }

    // Summary
    const resourceCount = Object.keys(this._compiledParams).length;
    let paramCount = 0;
    Object.values(this._compiledParams).forEach(function(params) {
      paramCount += Object.keys(params).length;
    });

    console.log('[SearchParametersEngine] Compilation complete: ' + paramCount +
      ' parameters for ' + resourceCount + ' resource types');

    this._isCompiled = true;
  },

  // ==========================================================================
  // Lookup
  // ==========================================================================

  /**
   * Lookup a compiled search parameter
   * @param {string} resourceType - e.g., "Patient"
   * @param {string} code - e.g., "identifier"
   * @returns {Object|null} - Compiled param or null
   */
  lookup: function(resourceType, code) {
    if (!this._isCompiled) {
      console.warn('[SearchParametersEngine] Engine not compiled yet');
      return null;
    }

    if (!resourceType || !code) {
      return null;
    }

    const resourceParams = this._compiledParams[resourceType];
    if (!resourceParams) {
      return null;
    }

    return resourceParams[code] || null;
  },

  /**
   * Get all compiled parameters for a resource type
   * @param {string} resourceType - e.g., "Patient"
   * @returns {Object} - Map of code -> compiled param
   */
  getParamsForResource: function(resourceType) {
    return this._compiledParams[resourceType] || {};
  },

  /**
   * Get all loaded SearchParameter resources (for MongoDB insert)
   * @returns {Array} - Array of SearchParameter resources
   */
  getAllSearchParams: function() {
    return this._allSearchParams;
  },

  // ==========================================================================
  // Query Building
  // ==========================================================================

  /**
   * Build MongoDB query for a reference type search
   * @param {string} baseField - e.g., "subject", "patient"
   * @param {string} searchValue - e.g., "Patient/123"
   * @param {Array|null} targetTypes - e.g., ["Patient"]
   * @returns {Object} - MongoDB query
   */
  buildReferenceQuery: function(baseField, searchValue, targetTypes) {
    const fhirBaseUrl = get(Meteor, 'settings.public.fhirUrl', 'http://localhost:3000');
    const fhirPath = get(Meteor, 'settings.private.fhir.rest.endpoint', 'baseR4');
    const targetResourceType = Array.isArray(targetTypes) && targetTypes.length > 0 ? targetTypes[0] : 'Patient';

    const values = searchValue.split(',').map(function(v) { return v.trim(); });
    const patterns = [];

    values.forEach(function(val) {
      let idPart = val;
      if (val.includes('/')) {
        idPart = val.split('/').pop();
      }

      patterns.push(idPart);
      patterns.push(targetResourceType + '/' + idPart);
      patterns.push(fhirBaseUrl + '/' + fhirPath + '/' + targetResourceType + '/' + idPart);
      patterns.push('urn:uuid:' + idPart);
    });

    const query = {};
    query[baseField + '.reference'] = { $in: patterns };
    return query;
  },

  /**
   * Build MongoDB query for a date type search
   * Supports comparison prefixes: eq, ne, gt, lt, ge, le, sa, eb
   *
   * IMPORTANT: FHIR date fields may be stored as:
   * - Strings: "1996-04-07" (FHIR date type like birthDate)
   * - Date objects: Date("1996-04-07T00:00:00Z") (FHIR dateTime)
   *
   * This function handles BOTH by using $or to match either format.
   *
   * @param {string} baseField - e.g., "birthDate", "effectiveDateTime"
   * @param {string} searchValue - e.g., "2020-01-01", "ge2020-01-01"
   * @returns {Object} - MongoDB query
   */
  buildDateQuery: function(baseField, searchValue) {
    if (!searchValue) {
      return {};
    }

    // Check for comparison prefix
    const prefixMatch = searchValue.match(/^(eq|ne|gt|lt|ge|le|sa|eb)(.+)$/);

    let prefix = 'eq';
    let dateStr = searchValue;

    if (prefixMatch) {
      prefix = prefixMatch[1];
      dateStr = prefixMatch[2];
    }

    // Validate date format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS...)
    const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!dateMatch) {
      console.warn('[SearchParametersEngine] Invalid date format:', searchValue);
      return {};
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.warn('[SearchParametersEngine] Invalid date:', searchValue);
      return {};
    }

    // For string comparison (FHIR date type like birthDate)
    const dateStrNormalized = dateMatch[0]; // "YYYY-MM-DD"

    const query = {};

    switch (prefix) {
      case 'gt':
        // Match: string > "YYYY-MM-DD" OR Date > date
        // Use $or to match either string or Date storage format
        query.$or = [
          { $and: [{ [baseField]: { $type: 'string' } }, { [baseField]: { $gt: dateStrNormalized } }] },
          { $and: [{ [baseField]: { $type: 'date' } }, { [baseField]: { $gt: date } }] }
        ];
        break;
      case 'ge':
        query.$or = [
          { $and: [{ [baseField]: { $type: 'string' } }, { [baseField]: { $gte: dateStrNormalized } }] },
          { $and: [{ [baseField]: { $type: 'date' } }, { [baseField]: { $gte: date } }] }
        ];
        break;
      case 'lt':
        query.$or = [
          { $and: [{ [baseField]: { $type: 'string' } }, { [baseField]: { $lt: dateStrNormalized } }] },
          { $and: [{ [baseField]: { $type: 'date' } }, { [baseField]: { $lt: date } }] }
        ];
        break;
      case 'le':
        query.$or = [
          { $and: [{ [baseField]: { $type: 'string' } }, { [baseField]: { $lte: dateStrNormalized } }] },
          { $and: [{ [baseField]: { $type: 'date' } }, { [baseField]: { $lte: date } }] }
        ];
        break;
      case 'ne':
        // For ne, we need: NOT (string equal OR date equal)
        query.$and = [
          { [baseField]: { $ne: dateStrNormalized } },
          { [baseField]: { $ne: date } }
        ];
        break;
      case 'sa': // starts after
        query.$or = [
          { $and: [{ [baseField]: { $type: 'string' } }, { [baseField]: { $gt: dateStrNormalized } }] },
          { $and: [{ [baseField]: { $type: 'date' } }, { [baseField]: { $gt: date } }] }
        ];
        break;
      case 'eb': // ends before
        query.$or = [
          { $and: [{ [baseField]: { $type: 'string' } }, { [baseField]: { $lt: dateStrNormalized } }] },
          { $and: [{ [baseField]: { $type: 'date' } }, { [baseField]: { $lt: date } }] }
        ];
        break;
      case 'eq':
      default:
        // For exact date match:
        // - String: exactly "YYYY-MM-DD"
        // - Date: >= midnight AND < next midnight
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        query.$or = [
          // String exact match
          { [baseField]: dateStrNormalized },
          // Date range match (whole day)
          { $and: [
            { [baseField]: { $gte: date } },
            { [baseField]: { $lt: nextDay } }
          ]}
        ];
        break;
    }

    return query;
  },

  /**
   * Build MongoDB query for a string type search (simple field)
   * @param {string} baseField - e.g., "family", "city"
   * @param {string} searchValue - e.g., "Smith"
   * @returns {Object} - MongoDB query
   */
  buildStringQuery: function(baseField, searchValue) {
    if (!searchValue) {
      return {};
    }

    // Case-insensitive starts-with match (FHIR default for string)
    const query = {};
    query[baseField] = { $regex: '^' + searchValue, $options: 'i' };
    return query;
  },

  /**
   * Build MongoDB query for a token type search on simple code field
   * @param {string} baseField - e.g., "status", "gender"
   * @param {string} searchValue - e.g., "active", "male"
   * @returns {Object} - MongoDB query
   */
  buildCodeQuery: function(baseField, searchValue) {
    if (!searchValue) {
      return {};
    }

    // Handle comma-separated values
    const values = searchValue.split(',').map(function(v) { return v.trim(); });

    if (values.length > 1) {
      const query = {};
      query[baseField] = { $in: values };
      return query;
    }

    // Handle system|code format (system is ignored for simple codes)
    let value = searchValue;
    if (searchValue.includes('|')) {
      value = searchValue.split('|').pop();
    }

    const query = {};
    query[baseField] = value;
    return query;
  },

  /**
   * Build MongoDB query for a search parameter
   * Routes to appropriate type handler based on compiled param info
   *
   * @param {string} resourceType - e.g., "Patient"
   * @param {string} code - e.g., "identifier"
   * @param {string} searchValue - e.g., "MRN|12345"
   * @returns {Object|null} - MongoDB query or null if param not found
   */
  buildMongoQuery: function(resourceType, code, searchValue) {
    if (!this.isEnabled()) {
      console.warn('[SearchParametersEngine] Engine is disabled');
      return null;
    }

    const param = this.lookup(resourceType, code);
    if (!param) {
      process.env.DEBUG && console.warn('[SearchParametersEngine] No compiled param for ' + resourceType + '.' + code);
      return null;
    }

    const { type, baseField, fieldType, target } = param;

    switch (type) {
      case 'token':
        switch (fieldType) {
          case 'Identifier':
            return RestHelpers.buildIdentifierTokenQuery(baseField, searchValue);
          case 'CodeableConcept':
            return RestHelpers.buildCodeableConceptTokenQuery(baseField, searchValue);
          case 'code':
          default:
            return this.buildCodeQuery(baseField, searchValue);
        }

      case 'string':
        switch (fieldType) {
          case 'HumanName':
            return RestHelpers.buildHumanNameStringQuery(baseField, searchValue);
          case 'Address':
            // TODO: Implement Address-specific search
            return this.buildStringQuery(baseField, searchValue);
          default:
            return this.buildStringQuery(baseField, searchValue);
        }

      case 'reference':
        return this.buildReferenceQuery(baseField, searchValue, target);

      case 'date':
        return this.buildDateQuery(baseField, searchValue);

      default:
        console.warn('[SearchParametersEngine] Unsupported search type: ' + type + ' for ' + resourceType + '.' + code);
        return null;
    }
  }
};

export { SearchParametersEngine };
export default SearchParametersEngine;
