// server/RestHelpers.js
import moment from 'moment';

import { get, has, set, unset, cloneDeep, pullAt, findIndex } from 'lodash';

import * as mongoQuery from 'mongo-query';

import FhirUtilities from '../imports/lib/FhirUtilities.js';
import { Practitioners } from '../imports/lib/schemas/SimpleSchemas/Practitioners';
import { Organizations } from '../imports/lib/schemas/SimpleSchemas/Organizations';
import { validateOutbound, annotateResource } from '/server/lib/OutboundValidation';

const log = Meteor.Logger.for('RestHelpers');

// =============================================================================
// Profile Decorator Discovery
// Discover ProfileDecorators from packages (similar to ProfileSet pattern)
// These are used to apply IG-specific requirements to resources at egress time

let discoveredDecorators = {};

// Discovery runs at module load time after Meteor packages are initialized
Meteor.startup(function() {
  Object.keys(Package).forEach(function(packageName) {
    if (Package[packageName].ProfileDecorators) {
      log.debug('ProfileDecorators discovered from package:', packageName);
      let decorators = Package[packageName].ProfileDecorators;
      Object.keys(decorators).forEach(function(resourceType) {
        if (!discoveredDecorators[resourceType]) {
          discoveredDecorators[resourceType] = [];
        }
        discoveredDecorators[resourceType].push(decorators[resourceType]);
      });
    }
  });

  if (Object.keys(discoveredDecorators).length > 0) {
    log.debug('RestHelpers: Discovered decorators for:', Object.keys(discoveredDecorators).join(', '));
  } else {
    log.debug('RestHelpers: No ProfileDecorators discovered from packages');
  }
});

/**
 * Apply discovered profile decorators to a resource
 * @param {Object} resource - The FHIR resource
 * @param {string} requestedProfile - Optional specific profile URL
 * @returns {Object} - Decorated resource
 */
function applyProfileDecorators(resource, requestedProfile) {
  let resourceType = get(resource, 'resourceType');
  if (!resourceType) {
    return resource;
  }

  let decorators = discoveredDecorators[resourceType];
  if (!decorators || decorators.length === 0) {
    return resource;
  }

  let result = resource;
  for (let decorator of decorators) {
    // If specific profile requested, only apply matching decorator
    if (requestedProfile && decorator.profileUrl !== requestedProfile) {
      continue;
    }

    try {
      if (typeof decorator.decorate === 'function') {
        result = decorator.decorate(result);
        log.debug('RestHelpers: Applied decorator', decorator.profileUrl);
      }
    } catch (err) {
      log.error('RestHelpers: Error applying decorator', err);
    }
  }

  return result;
}

// =============================================================================
// Token Search Helpers for CodeableConcept Fields
// These helpers enable proper FHIR token-type searches on CodeableConcept fields
// by querying the nested coding.code path instead of direct string matching

/**
 * Convert FHIR xpath to MongoDB field path
 * @param {string} xpath - e.g., "f:CarePlan/f:category" or "category"
 * @returns {string} - e.g., "category"
 */
function xpathToMongoPath(xpath) {
  if (!xpath) {
    log.warn('xpathToMongoPath: Empty xpath provided');
    return null;
  }

  // Handle FHIR union expressions like "Patient.name.given | Patient.name.family"
  // Take the first path from the union (they usually point to related fields)
  if (xpath.includes(' | ')) {
    let firstPath = xpath.split(' | ')[0].trim();
    return xpathToMongoPath(firstPath);  // Recursively process
  }

  // Handle FHIRPath expressions like "Patient.identifier" → "identifier"
  // or "Patient.name.given" → "name.given"
  if (xpath.includes('.') && !xpath.includes('f:')) {
    let parts = xpath.split('.');
    // Skip the first part (resource type like "Patient", "CarePlan") and return rest
    if (parts.length > 1) {
      return parts.slice(1).join('.');
    }
  }

  // Handle f:xpath format like "f:CarePlan/f:category" → "category"
  if (xpath.includes('f:') || xpath.includes('/')) {
    let parts = xpath.split('/');
    let lastPart = parts[parts.length - 1];
    if (lastPart.startsWith('f:')) {
      return lastPart.substring(2);
    }
    return lastPart;
  }

  return xpath;
}

/**
 * Check if a field is a CodeableConcept type based on FHIR patterns
 * @param {string} fieldName - The field name from xpath (e.g., "category")
 * @param {string} searchParamCode - The search parameter code (e.g., "category")
 * @returns {boolean}
 */
function isCodeableConceptField(fieldName, searchParamCode) {
  // Known CodeableConcept fields in FHIR R4
  const codeableConceptFields = [
    'category', 'code', 'type', 'specialty', 'role', 'class',
    'clinicalStatus', 'verificationStatus', 'clinical-status', 'verification-status',
    'dischargeDisposition', 'serviceType', 'reasonCode', 'vaccineCode',
    'route', 'site', 'method', 'bodySite', 'reaction', 'substance',
    'interpretation', 'dataAbsentReason', 'severity', 'criticality'
  ];

  // Simple code fields that should NOT use CodeableConcept logic
  const simpleCodeFields = [
    'status', 'intent', 'gender', 'priority', 'use', 'mode',
    'lifecycleStatus', 'active', 'experimental'
  ];

  if (!fieldName) {
    log.warn('isCodeableConceptField: Empty fieldName provided');
    return false;
  }

  let normalizedField = fieldName.toLowerCase().replace(/-/g, '');
  let normalizedCode = (searchParamCode || '').toLowerCase().replace(/-/g, '');

  // First check if it's explicitly a simple code field
  if (simpleCodeFields.some(function(f) {
    return normalizedField === f.toLowerCase() || normalizedCode === f.toLowerCase();
  })) {
    return false;
  }

  // Then check if it matches known CodeableConcept fields
  return codeableConceptFields.some(function(f) {
    return normalizedField === f.toLowerCase() ||
           normalizedCode === f.toLowerCase() ||
           normalizedField.includes(f.toLowerCase());
  });
}

/**
 * Check if a CodeableConcept field is typically an array in FHIR resources
 * Array fields need $elemMatch for proper MongoDB querying
 * @param {string} fieldName - The field name (e.g., "category", "code")
 * @returns {boolean}
 */
function isArrayCodeableConceptField(fieldName) {
  // Fields that are arrays of CodeableConcept in FHIR R4
  // Note: 'type' is NOT included - DocumentReference.type is a single CodeableConcept
  const arrayFields = [
    'category',      // Observation, Condition, DiagnosticReport, DocumentReference, etc.
    'serviceType',   // HealthcareService, Appointment
    'specialty',     // PractitionerRole, HealthcareService
    'classification' // Device
  ];

  if (!fieldName) {
    return false;
  }

  let normalizedField = fieldName.toLowerCase();
  return arrayFields.some(function(f) {
    return normalizedField === f.toLowerCase();
  });
}

/**
 * Build MongoDB query for token search on CodeableConcept field
 * Supports: bare code, system|code, and comma-separated values
 * @param {string} mongoPath - e.g., "category"
 * @param {string} searchValue - e.g., "assess-plan" or "http://system|code"
 * @returns {Object} - MongoDB query object
 */
function buildCodeableConceptTokenQuery(mongoPath, searchValue) {
  if (!mongoPath || !searchValue) {
    log.warn('buildCodeableConceptTokenQuery: Missing mongoPath or searchValue');
    return {};
  }

  // Check if this field is typically an array of CodeableConcepts
  let isArrayField = isArrayCodeableConceptField(mongoPath);

  let searchValues = searchValue.split(',').map(function(v) { return v.trim(); });
  let orConditions = [];

  searchValues.forEach(function(val) {
    if (val.includes('|')) {
      // System|code format
      let pipeIndex = val.indexOf('|');
      let system = val.substring(0, pipeIndex);
      let code = val.substring(pipeIndex + 1);

      if (system && code) {
        // Both system and code specified - match both
        let condition = {};
        if (isArrayField) {
          // For array fields, use $elemMatch on the array itself
          condition[mongoPath] = {
            $elemMatch: {
              'coding.system': system,
              'coding.code': code
            }
          };
        } else {
          // For single CodeableConcept fields, use $elemMatch on the coding array
          condition[mongoPath + '.coding'] = {
            $elemMatch: {
              'system': system,
              'code': code
            }
          };
        }
        orConditions.push(condition);
      } else if (system && !code) {
        // System only (ends with |) - match any code in that system
        let condition = {};
        condition[mongoPath + '.coding.system'] = system;
        orConditions.push(condition);
      } else if (!system && code) {
        // Code only (starts with |) - same as bare code
        orConditions.push(buildCodeOnlyCondition(mongoPath, code, isArrayField));
      }
    } else {
      // Bare code - match coding.code or text
      orConditions.push(buildCodeOnlyCondition(mongoPath, val, isArrayField));
    }
  });

  if (orConditions.length === 0) {
    log.warn('buildCodeableConceptTokenQuery: No conditions generated for', { mongoPath: mongoPath, searchValue: searchValue });
    return {};
  } else if (orConditions.length === 1) {
    return orConditions[0];
  } else {
    return { $or: orConditions };
  }
}

/**
 * Build condition for code-only search (no system specified)
 * Matches either coding.code or text field
 * @param {string} mongoPath - e.g., "category"
 * @param {string} code - e.g., "assess-plan"
 * @param {boolean} isArrayField - true if the field is an array of CodeableConcepts
 * @returns {Object} - MongoDB query condition
 */
function buildCodeOnlyCondition(mongoPath, code, isArrayField) {
  let codingCondition = {};
  let textCondition = {};

  if (isArrayField) {
    // For array fields (like category[]), use $elemMatch on the array
    // to properly match within each CodeableConcept element
    codingCondition[mongoPath] = {
      $elemMatch: {
        'coding.code': code
      }
    };
    // Text match also needs $elemMatch for array fields
    textCondition[mongoPath] = {
      $elemMatch: {
        'text': code
      }
    };
  } else {
    // For single CodeableConcept fields (like code), use dot notation
    codingCondition[mongoPath + '.coding.code'] = code;
    textCondition[mongoPath + '.text'] = code;
  }

  return { $or: [codingCondition, textCondition] };
}

/**
 * Check if a field is an Identifier type
 * @param {string} fieldName - The field name from xpath (e.g., "identifier")
 * @param {string} searchParamCode - The search parameter code
 * @returns {boolean}
 */
function isIdentifierField(fieldName, searchParamCode) {
  const identifierFields = ['identifier'];

  if (!fieldName) {
    return false;
  }

  let normalizedField = fieldName.toLowerCase();
  let normalizedCode = (searchParamCode || '').toLowerCase();

  return identifierFields.includes(normalizedField) || identifierFields.includes(normalizedCode);
}

/**
 * Build MongoDB query for token search on Identifier field
 * Identifier has structure: {system: "...", value: "..."}
 * Supports: bare value, system|value, and comma-separated values
 * @param {string} mongoPath - e.g., "identifier"
 * @param {string} searchValue - e.g., "12345" or "http://system|12345"
 * @returns {Object} - MongoDB query object
 */
function buildIdentifierTokenQuery(mongoPath, searchValue) {
  if (!mongoPath || !searchValue) {
    log.warn('buildIdentifierTokenQuery: Missing mongoPath or searchValue');
    return {};
  }

  let searchValues = searchValue.split(',').map(function(v) { return v.trim(); });
  let orConditions = [];

  searchValues.forEach(function(val) {
    if (val.includes('|')) {
      // System|value format
      let pipeIndex = val.indexOf('|');
      let system = val.substring(0, pipeIndex);
      let value = val.substring(pipeIndex + 1);

      if (system && value) {
        // Both system and value specified - match both using $elemMatch
        let condition = {};
        condition[mongoPath] = {
          $elemMatch: {
            'system': system,
            'value': value
          }
        };
        orConditions.push(condition);
      } else if (system && !value) {
        // System only (ends with |) - match any identifier in that system
        let condition = {};
        condition[mongoPath + '.system'] = system;
        orConditions.push(condition);
      } else if (!system && value) {
        // Value only (starts with |) - match just the value
        let condition = {};
        condition[mongoPath + '.value'] = value;
        orConditions.push(condition);
      }
    } else {
      // Bare value - match just the value field
      let condition = {};
      condition[mongoPath + '.value'] = val;
      orConditions.push(condition);
    }
  });

  if (orConditions.length === 0) {
    log.warn('buildIdentifierTokenQuery: No conditions generated for', { mongoPath: mongoPath, searchValue: searchValue });
    return {};
  } else if (orConditions.length === 1) {
    return orConditions[0];
  } else {
    return { $or: orConditions };
  }
}

/**
 * Check if a field is a HumanName type
 * @param {string} fieldName - The field name (e.g., "name")
 * @param {string} searchParamCode - The search parameter code
 * @returns {boolean}
 */
function isHumanNameField(fieldName, searchParamCode) {
  const humanNameFields = ['name'];

  if (!fieldName) {
    return false;
  }

  let normalizedField = fieldName.toLowerCase();
  let normalizedCode = (searchParamCode || '').toLowerCase();

  return humanNameFields.includes(normalizedField) || humanNameFields.includes(normalizedCode);
}

/**
 * Build MongoDB query for string search on HumanName field
 * Searches family, given, and text fields with case-insensitive regex
 * @param {string} mongoPath - e.g., "name"
 * @param {string} searchValue - e.g., "Koelpin146"
 * @returns {Object} - MongoDB query object
 */
function buildHumanNameStringQuery(mongoPath, searchValue) {
  if (!mongoPath || !searchValue) {
    log.warn('buildHumanNameStringQuery: Missing mongoPath or searchValue');
    return {};
  }

  // Search family, given, and text fields with case-insensitive regex
  let regex = { $regex: searchValue, $options: 'i' };

  return {
    $or: [
      { [mongoPath + '.family']: regex },
      { [mongoPath + '.given']: regex },
      { [mongoPath + '.text']: regex }
    ]
  };
}

/**
 * Build MongoDB query for string search on Address field
 * Searches text, line, city, district, state, postalCode, and country fields
 * FHIR address search should match any part of the address
 * @param {string} mongoPath - e.g., "address"
 * @param {string} searchValue - e.g., "Chicago"
 * @returns {Object} - MongoDB query object
 */
function buildAddressStringQuery(mongoPath, searchValue) {
  if (!mongoPath || !searchValue) {
    log.warn('buildAddressStringQuery: Missing mongoPath or searchValue');
    return {};
  }

  // Search text, line, city, district, state, postalCode, and country fields
  // with case-insensitive regex (FHIR default for string search)
  let regex = { $regex: searchValue, $options: 'i' };

  return {
    $or: [
      { [mongoPath + '.text']: regex },
      { [mongoPath + '.line']: regex },
      { [mongoPath + '.city']: regex },
      { [mongoPath + '.district']: regex },
      { [mongoPath + '.state']: regex },
      { [mongoPath + '.postalCode']: regex },
      { [mongoPath + '.country']: regex }
    ]
  };
}

// =============================================================================

export const RestHelpers = {
    fhirVersion: 'fhir-3.0.0',
    disableOauth: true,
    isDebug: process.env.DEBUG || true,
    isTrace: process.env.TRACE,
    noAuth: false, // Use SafeNoAuth.isEnabled() instead

    // Token search helpers for CodeableConcept and Identifier fields (exported for testing)
    xpathToMongoPath: xpathToMongoPath,
    isCodeableConceptField: isCodeableConceptField,
    buildCodeableConceptTokenQuery: buildCodeableConceptTokenQuery,
    isIdentifierField: isIdentifierField,
    buildIdentifierTokenQuery: buildIdentifierTokenQuery,
    // HumanName search helpers
    isHumanNameField: isHumanNameField,
    buildHumanNameStringQuery: buildHumanNameStringQuery,
    // Address search helpers
    buildAddressStringQuery: buildAddressStringQuery,

    logging: function(req, route){
        if(this.isDebug){
            log.debug(route + get(req, 'params.id'));
        }
        if(this.isTrace){
            log.debug(req);
        }
    },
    setHeaders: function(res){
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("content-type", "application/fhir+json; charset=utf-8");
    },  
    // setOAuthHeaders: function(res){
    //   res.setHeader("Access-Control-Allow-Origin", "*");
    //   res.setHeader("content-type", "application/fhir+json");
    // },  
    setAdditionalHeadersForResponses: function(res){
      res.setHeader("Last-Modified", new Date());
      res.setHeader("ETag", "3.0.0");
    },  
    // this is temporary fix until PR 132 can be merged in
    // https://github.com/stubailo/meteor-rest/pull/132
    sendResult: function (res, options) {
        options = options || {};
      
        // Set status code on response
        res.statusCode = options.code || 200;
      
        // Set response body
        if (options.data !== undefined) {
          var shouldPrettyPrint = (process.env.NODE_ENV === 'development');
          var spacer = shouldPrettyPrint ? 2 : null;
          res.setHeader('Content-type', 'application/fhir+json; charset=utf-8');
          res.write(JSON.stringify(options.data, null, spacer));
        }
      
        // We've already set global headers on response, but if they
        // pass in more here, we set those.
        if (options.headers) {
          //setHeaders(res, options.headers);
          options.headers.forEach(function(value, key){
            res.setHeader(key, value);
          });
        }
      
        // Send the response
        res.end();
    },
    oauthServerCheck: function(req){
      if(typeof OAuthServerConfig !== 'object'){
        // no oAuth server installed; Not Implemented

        res.status(501).json();
        // JsonRoutes.sendResult(res, {
        //   code: 501
        // });  
      }
    },
    returnPostResponseAfterAccessCheck: function(req, res, callback){
      var accessTokenStr = get(req, 'params.access_token') || get(req, 'query.access_token');
      var accessToken = OAuthServerConfig.collections.accessToken.findOne({accessToken: accessTokenStr});
  
      if (accessToken || this.noAuth || this.disableOauth) {
  
        if (accessToken) {
          log.trace('accessToken', accessToken);
          log.trace('accessToken.userId', accessToken.userId);
        }
  
        let filter = RestHelpers.generateFilter(req);
        let pagination = RestHelpers.generatePagination(req);
      
        callback(req, res, filter, pagination);

      } else {
        // Unauthorized
        res.status(401).json();
        // JsonRoutes.sendResult(res, {
        //   code: 401
        // });
      }
    },
    returnGetResponseAfterAccessCheck: function(req, res, callback){
      var accessTokenStr = get(req, 'params.access_token') || get(req, 'query.access_token');
      var accessToken = OAuthServerConfig.collections.accessToken.findOne({accessToken: accessTokenStr});
  
      if (accessToken || this.noAuth || this.disableOauth) {
  
        if (accessToken) {
          log.trace('accessToken', accessToken);
          log.trace('accessToken.userId', accessToken.userId);
        }
      
        let dataPayload = callback(req, res);
  
        if (dataPayload) {
  
          // Success
          res.status(200).json(dataPayload);
          // JsonRoutes.sendResult(res, {
          //   code: 200,
          //   data: dataPayload
          // });
        } else {
          // Gone
          res.status(204).json();
          // JsonRoutes.sendResult(res, {
          //   code: 204
          // });
        }
      } else {
        // Unauthorized
        res.status(401).json();
        // JsonRoutes.sendResult(res, {
        //   code: 401
        // });
      }
    },
    generateFilter: function(req){
      let filter = {};
      if(get(req, 'query.filter')){
        filter = JSON.parse(get(req, 'query.filter'));
      } 
      return filter;
    },
    generatePagination: function(req){
      let sort = {};
      let page = 1;
      let items_per_page = 25;
  
      if(get(req, 'query.page')){
        page = get(req, 'query.page');
      } 
      
      if(get(req, 'query.items_per_page')){
        items_per_page = get(req, 'query.items_per_page');
      } 
    
      if(get(req, 'query.sort')){
        sort[get(req, 'query.sort')] = 1;
      } 
  
      return {
        limit: items_per_page,
        sort: sort,
        skip: (page > 0 ? (page - 1) * items_per_page : 0)
      }
    },
    toMongo: function(originalResource) {

      // when saving to Mongo

      // first we convert dates from on-the-wire HL7 dates to Mongo/Unix Date objects
      if (Array.isArray(originalResource.identifier)) {
        originalResource.identifier.forEach(function(identifier){
          if (identifier.period) {
            if (identifier.period.start) {
              identifier.period.start = new Date(moment(identifier.period.start));
            }
            if (identifier.period.end) {
              identifier.period.end = new Date(moment(identifier.period.end));
            }
          }
        });
      }

      if (get(originalResource, 'date')) {
        originalResource.date = new Date(moment(originalResource.date));
      }
      if (get(originalResource, 'period.start')) {
        originalResource.period.start = new Date(moment(get(originalResource, 'period.start')));
      }
      if (get(originalResource, 'period.end')) {
        originalResource.period.start = new Date(moment(get(originalResource, 'period.start')));
      }

      // // Then we make sure objects have appropriate data type elements attached
      // if (originalResource.telecom && originalResource.telecom[0]) {
      //   originalResource.telecom.forEach(function(telecom){
      //     telecom.resourceType = "ContactPoint";
      //   });
      // }
    
      // if (originalResource.address && !originalResource.address.resourceType) {
      //   originalResource.address.resourceType = "Address";
      // }

      // $near support
      // https://github.com/AudaciousInquiry/fhir-saner/issues/23#issuecomment-604809705
      // but https://covid19-under-fhir.smilecdr.com/baseR4/Location?_id=Loc-Org-7313&near=-66.85|18.03|5000|km doesn't find it.
      if (has(originalResource, 'position')) {

        if(!has(originalResource, '_location')){
          originalResource._location = {
            latitude: get(originalResource, 'position.latitude', null),
            longitude: get(originalResource, 'position.longitude', null)
          }
        }
      }
    
      return originalResource;
    },
    prepForUpdate: function (record) {
      log.trace("RestHelpers.prepForUpdate()");  
    
      if (Array.isArray(record.name)) {
        //console.log("record.name", record.name);    
        record.name.forEach(function(name){
          name.resourceType = "HumanName";
        });
      }
    
      if (Array.isArray(record.telecom)) {
        //console.log("record.telecom", record.telecom);
        record.telecom.forEach(function(telecom){
          telecom.resourceType = "ContactPoint";
        });
      }
    
      if (Array.isArray(record.address)) {
        //console.log("record.address", record.address);
        record.address.forEach(function(address){
          address.resourceType = "Address";
        });
      }
    
      if (Array.isArray(record.contact)) {
        //console.log("record.contact", record.contact);
        record.contact.forEach(function(contact){
          if (contact.name) {
            contact.name.resourceType = "HumanName";
          }
    
          if (contact.telecom && contact.telecom[0]) {
            contact.telecom.forEach(function(telecom){
              telecom.resourceType = "ContactPoint";
            });
          }
    
        });
      }

      if(get(record, 'meta')){
        record.meta.lastUpdated = new Date();
      } else {
        record.meta = {
          lastUpdated: new Date()
        }
      }
    
      return record;
    }, 
    prepForFhirTransfer: function (response) {
      log.trace("RestHelpers.prepForFhirTransfer()");  

      // Can't have undscores and internal references in resources that go over the wire
      // https://www.hl7.org/fhir/json.html#primitive

      if(has(response, '_id')){
        delete response._id;
      }
      if(has(response, '_document')){
        delete response._document;
      }
      if(has(response, '_location')){
        delete response._location;
      }
      if(has(response, 'meta._lastUpdated')){
        delete response.meta._lastUpdated;
      }
      
      // FHIR has complicated and unusual rules about dates in order
      // to support situations where a family member might report on a response's
      // date of birth, but not know the year of birth; and the other way around
      if (has(response, 'birthDate')) {
        response.birthDate = moment(response.birthDate).format("YYYY-MM-DD");
      }

      if (Array.isArray(response.name)) {
        response.name.forEach(function(name){
          delete name.resourceType;
        });
      }

      if (Array.isArray(response.telecom)) {
        //console.log("response.telecom", response.telecom);
        response.telecom.forEach(function(telecom){
          delete telecom.resourceType;
        });
      }

      if (Array.isArray(response.address)) {
        //console.log("response.address", response.address);
        response.address.forEach(function(address){
          delete address.resourceType;
        });
      } else if(has(response, 'address')){        
        delete response.address.resourceType;
      }

      if (Array.isArray(response.contact)) {
        //console.log("response.contact", response.contact);

        response.contact.forEach(function(contact){

          // console.log("contact", contact);

          if (contact.name && contact.name.resourceType) {
            delete contact.name.resourceType;
          }

          if (Array.isArray(contact.telecom)) {
            contact.telecom.forEach(function(telecom){
              delete telecom.resourceType;
            });
          }
          if (get(contact, 'address.resourceType')) {
            delete contact.address.resourceType;
          }

        });
      }

      log.trace("response", response);

      // Normalize urn:uuid: references to standard FHIR format
      // ONC (g)(10) tests expect references in ResourceType/ID format, not urn:uuid:ID
      if (has(response, 'subject.reference')) {
        let subjectRef = get(response, 'subject.reference');
        if (subjectRef && subjectRef.startsWith('urn:uuid:')) {
          let patientId = subjectRef.replace('urn:uuid:', '');
          response.subject.reference = 'Patient/' + patientId;
          log.debug('[prepForFhirTransfer] Normalized subject.reference: ' + subjectRef + ' -> ' + response.subject.reference, { subjectRef: subjectRef, normalizedRef: response.subject.reference });
        }
      }
      if (has(response, 'patient.reference')) {
        let patientRef = get(response, 'patient.reference');
        if (patientRef && patientRef.startsWith('urn:uuid:')) {
          let patientId = patientRef.replace('urn:uuid:', '');
          response.patient.reference = 'Patient/' + patientId;
          log.debug('prepForFhirTransfer Normalized patient.reference:', { patientRef, responsePatientRef: response.patient.reference });
        }
      }

      // Normalize encounter.reference (for Condition resources)
      // ONC (g)(10) test 12.6.07 requires Condition.encounter to resolve to valid Encounter
      if (has(response, 'encounter.reference')) {
        let encounterRef = get(response, 'encounter.reference');
        if (encounterRef && encounterRef.startsWith('urn:uuid:')) {
          let encounterId = encounterRef.replace('urn:uuid:', '');
          response.encounter.reference = 'Encounter/' + encounterId;
          log.debug('[prepForFhirTransfer] Normalized encounter.reference: ' + encounterRef + ' -> ' + response.encounter.reference, { encounterRef: encounterRef, normalizedRef: response.encounter.reference });
        }
      }

      // CareTeam: Normalize participant.member references for Patient participants
      // SNOMED code 116154003 = "Patient" role
      if (Array.isArray(response.participant)) {
        response.participant.forEach(function(participant) {
          if (has(participant, 'member.reference')) {
            let memberRef = get(participant, 'member.reference');
            if (memberRef && memberRef.startsWith('urn:uuid:')) {
              // Check if this participant has a "Patient" role (SNOMED 116154003)
              let isPatientRole = false;
              if (Array.isArray(participant.role)) {
                participant.role.forEach(function(role) {
                  if (Array.isArray(get(role, 'coding'))) {
                    role.coding.forEach(function(coding) {
                      if (get(coding, 'code') === '116154003' ||
                          get(coding, 'display', '').toLowerCase() === 'patient') {
                        isPatientRole = true;
                      }
                    });
                  }
                });
              }
              if (isPatientRole) {
                let patientId = memberRef.replace('urn:uuid:', '');
                participant.member.reference = 'Patient/' + patientId;
                log.debug('[prepForFhirTransfer] Normalized participant.member.reference: ' + memberRef + ' -> ' + participant.member.reference, { memberRef: memberRef, normalizedRef: participant.member.reference });
              }
            }
          }
        });
      }

      // Apply profile decorators (adds IG-specific extensions)
      // This uses the Package Discovery Pattern to find decorators from installed IG packages
      response = applyProfileDecorators(response);

      // Outbound schema validation (strict-out). Policy: settings.private.fhir.schemaValidation.egress.rest
      const outboundCheck = validateOutbound(response, 'rest');
      if (outboundCheck.action === 'annotate') {
        response = annotateResource(response);
      } else if (outboundCheck.action === 'block') {
        log.error('[prepForFhirTransfer] blocking non-conformant ' + (response && response.resourceType) + ' per egress.rest=block');
        return outboundCheck.operationOutcome;
      }

      return response;
    },
    // Helper to resolve conditional references like "Practitioner?identifier=system|value"
    // This is a separate async function to avoid making prepForFhirTransfer async
    // Used for CareTeam participant.member references which Synthea generates as conditional refs
    resolveConditionalReferences: async function(record) {
      log.debug('[resolveConditionalReferences] Called with record:', { resourceType: get(record, 'resourceType'), id: get(record, 'id') });

      if (!record || !Array.isArray(record.participant)) {
        log.debug('[resolveConditionalReferences] No participants array, returning');
        return record;
      }

      log.debug('[resolveConditionalReferences] Processing ' + record.participant.length + ' participants', { participantCount: record.participant.length });

      for (let participant of record.participant) {
        if (has(participant, 'member.reference')) {
          let memberRef = get(participant, 'member.reference');

          // Check if this is a conditional reference: ResourceType?identifier=system|value
          if (memberRef && memberRef.includes('?identifier=')) {
            log.debug('[resolveConditionalReferences] Found conditional reference:', memberRef);
            const conditionalMatch = memberRef.match(/^(\w+)\?identifier=(.+)$/);
            if (conditionalMatch) {
              const [, resourceType, identifierParam] = conditionalMatch;
              log.debug('[resolveConditionalReferences] Parsed - resourceType: ' + resourceType + ' identifierParam: ' + identifierParam, { resourceType: resourceType, identifierParam: identifierParam });

              // Parse system|value format
              const pipeIndex = identifierParam.lastIndexOf('|');
              let system = null;
              let value = identifierParam;
              if (pipeIndex > 0) {
                system = identifierParam.substring(0, pipeIndex);
                value = identifierParam.substring(pipeIndex + 1);
              }
              log.debug('[resolveConditionalReferences] Parsed identifier - system: ' + system + ' value: ' + value, { system: system, value: value });

              // Get the appropriate collection
              let collection = null;
              if (resourceType === 'Practitioner') {
                collection = Practitioners;
              } else if (resourceType === 'Organization') {
                collection = Organizations;
              }

              if (collection) {
                // Build query for identifier lookup
                let query;
                if (system) {
                  query = { 'identifier': { $elemMatch: { 'system': system, 'value': value } } };
                } else {
                  query = { 'identifier.value': value };
                }
                log.debug('[resolveConditionalReferences] Query:', query);

                try {
                  const resource = await collection.findOneAsync(query);
                  log.debug('[resolveConditionalReferences] Lookup result:', resource ? 'Found: ' + resource.id : 'Not found');
                  if (resource && resource.id) {
                    participant.member.reference = resourceType + '/' + resource.id;
                    log.debug('[resolveConditionalReferences] Resolved: ' + memberRef + ' -> ' + participant.member.reference, { memberRef: memberRef, resolvedRef: participant.member.reference });
                  } else {
                    log.warn('[resolveConditionalReferences] No matching resource found for:', memberRef);
                  }
                } catch (err) {
                  log.warn('[resolveConditionalReferences] Lookup failed:', err.message);
                }
              } else {
                log.warn('[resolveConditionalReferences] Unknown resource type in conditional reference:', resourceType);
              }
            }
          }
        }
      }

      return record;
    },
    generateDatabaseQuery: function(query, resourceType){
      return RestHelpers.generateMongoSearchQuery(query, resourceType)
    },
    generateMongoSearchQuery: function(query, resourceType){
      log.debug("RestHelpers.generateMongoSearchQuery.urlQueryString", { query: query, resourceType: resourceType });
    
      var databaseQuery = {};

      if (get(query, 'identifier')) {
        databaseQuery = {$or: []};
        databaseQuery.$or.push({
          'identifier.value': get(query, 'identifier')
        })
        databaseQuery.$or.push({
          'id': get(query, 'identifier')
        })
        databaseQuery.$or.push({
          'identifier': {
            $elemMatch: {
              'value': get(query, 'identifier')
            }
          }
        })
      }
    
      if (get(query, '_id')) {
        // databaseQuery['_id'] = get(query, '_id')

        // this is an idiosyncracy, but is correct to the FHIR spec
        // confirm: Y/n

        if(Array.isArray(databaseQuery.$or)){
          databaseQuery.$or.push({id: get(query, '_id')})
        } else {
          databaseQuery['id'] = get(query, '_id')
        }
      }

      // this seems hot and wild, but useful; monitor accordingly
      if (get(query, 'extension')) {
        // if(Array.isArray(databaseQuery.$or)){
        //   databaseQuery.$or.push({'extension.url': get(query, 'extension')})
        // } else {
          databaseQuery['extension.url'] = get(query, 'extension')
        // }
      }

      // $near support
      // https://github.com/AudaciousInquiry/fhir-saner/issues/23#issuecomment-604809705
      // but https://covid19-under-fhir.smilecdr.com/baseR4/Location?_id=Loc-Org-7313&near=-66.85|18.03|5000|km doesn't find it.
      if (get(query, 'near')) {
        // databaseQuery['_near'] = get(query, '_near')

        let nearParams = get(query, 'near');
        let nearParamsArray = nearParams.split("|");

        let metersMaxDistance = 0;
        if (nearParamsArray[3] === "m"){
          metersMaxDistance = Number(nearParamsArray[2]);
        } else if(nearParamsArray[3] === "km"){
          metersMaxDistance = Number(nearParamsArray[2]) * 1000;
        } else if (nearParamsArray[3] === "mi"){
          metersMaxDistance = Number(nearParamsArray[2]) * 1.60934 * 1000;
        }        

        let locationQuery = { $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(nearParamsArray[1]), Number(nearParamsArray[0])]
          },
          // Convert [mi] to [km] to [m]
          $maxDistance: metersMaxDistance
        }}

        // if(Array.isArray(databaseQuery.$or)){
        //   databaseQuery.$or.push({'_location': locationQuery})
        // } else {
        databaseQuery['_location'] = locationQuery
        // }
      }

      // underscores are important here! 
      // idiosyncracies in the spec and implementation.
      if (get(query, '_lastUpdated')) {
        let lastUpdatedSearchString = get(query, '_lastUpdated');
        // console.log('lastUpdatedSearchString.substring(0,2)', lastUpdatedSearchString.substring(0,2))
        // console.log('lastUpdatedSearchString.substring(2)', lastUpdatedSearchString.substring(2))

        // /Location?_lastUpdated=gt2018-04-20T00:00:00.000Z
        if(['gt'].includes(lastUpdatedSearchString.substring(0,2))){
          databaseQuery['meta.lastUpdated'] = {
            $gt: new Date(lastUpdatedSearchString.substring(2))
          };  

        // /Location?_lastUpdated=ge2018-04-20T00:00:00.000Z
        } else if(['ge'].includes(lastUpdatedSearchString.substring(0,2))){
          databaseQuery['meta.lastUpdated'] = {
            $gte: new Date(lastUpdatedSearchString.substring(2))
          };  
        } else {
        // /Location?_lastUpdated=2018-04-20T00:00:00.000Z
        databaseQuery['meta.lastUpdated'] = {
            $gte: new Date(get(query, '_lastUpdated'))
          };  
        }
      }
  
      if (get(query, 'name')) {
        databaseQuery['name'] = {
          $regex: get(query, 'name'),
          $options: 'i'
        };
      }

      if (get(query, 'code')) {
        databaseQuery['code'] = {
          $regex: get(query, 'code'),
          $options: 'i'
        };
      }
      if (get(query, 'url')) {
        databaseQuery['url'] = {
          $regex: get(query, 'url'),
          $options: 'i'
        };
      }

      if (get(query, 'measure')) {
        databaseQuery['measure'] = {
          $regex: get(query, 'measure'),
          $options: 'i'
        };
      }
      if (get(query, 'reporter')) {
        databaseQuery['reporter.reference'] = {
          $regex: get(query, 'reporter'),
          $options: 'i'
        };
      }
      if (get(query, 'subject')) {
        databaseQuery['subject.reference'] = {
          $regex: get(query, 'subject'),
          $options: 'i'
        };
      }

      // Handle 'patient' search parameter for resources that use patient.reference
      // (AllergyIntolerance, CarePlan, CareTeam, Encounter, Immunization, MedicationRequest, etc.)
      // Uses FhirUtilities.addPatientFilterToQuery() which handles:
      // - patient.reference, subject.reference, for.reference
      // - urn:uuid: format
      // - Regex patterns for absolute URL matches
      if (get(query, 'patient')) {
        let patientValue = get(query, 'patient');
        let patientId = patientValue.replace(/^Patient\//, '');
        Object.assign(databaseQuery, FhirUtilities.addPatientFilterToQuery(patientId, {}));
      }

      

      if (get(query, 'address')) {
        databaseQuery['address.city'] = {
          $regex: get(query, 'address', '')
        };
      }
      if (get(query, 'address-city')) {
        databaseQuery['address.city'] = {
          $regex: get(query, 'address-city')
        };
      }
      if (get(query, 'address-state')) {
        databaseQuery['address.state'] = {
          $regex: get(query, 'address-state')
        };
      }
      if (get(query, 'address-country')) {
        databaseQuery['address.country'] = {
          $regex: get(query, 'address-country')
        };
      }
      if (get(query, 'address-postalcode')) {
        databaseQuery['address.postalCode'] = {
          $regex: get(query, 'address-postalcode')
        };
      }
      if (get(query, 'address-use')) {
        databaseQuery['address.use'] = {
          $regex: get(query, 'address-use')
        };
      }

      let resourceTimeIndex = 'date';

      if(resourceType){
        switch (resourceType) {
          case "Observation":
            resourceTimeIndex = 'effectiveDateTime'
            break;        
        }
      }
    
      if (get(query, 'date')) {
        log.debug('date.slice(0,2)', query.date.slice(0, 2));
        log.debug('get.date.slice(0,2)', get(query, 'date').slice(0, 2));
        log.debug('date.slice(0,2)', get(query, 'date').substring(2));

        // greater than
        if(get(query, 'date').slice(0, 2) === "gt"){
          databaseQuery[resourceTimeIndex] = {
            $gt: new Date(get(query, 'date').substring(2))
          };  

        // greater than or equal
        } else if(get(query, 'date').slice(0, 2) === "ge"){
          databaseQuery[resourceTimeIndex] = {
            $gte: new Date(get(query, 'date').substring(2))
          };  

        // less than
        } else if(get(query, 'date').slice(0, 2) === "lt"){
          databaseQuery[resourceTimeIndex] = {
            $lt: new Date(get(query, 'date').substring(2))
          };  

        // less than or equal
        } else if(get(query, 'date').slice(0, 2) === "le"){
          databaseQuery[resourceTimeIndex] = {
            $lte: new Date(get(query, 'date').substring(2))
          };  
        } else {
          // exact date
          databaseQuery = {$and: [
            {date: {$gte: new Date(moment(get(query, 'date')).format("YYYY-MM-DD"))}},
            {date: {$lte: new Date(moment(get(query, 'date')).add(1, 'day').format("YYYY-MM-DD"))}}
          ]}
        }
      }

      if (get(query, 'period')) {
        log.debug('parsing the period search parameter', get(query, 'period').substring(2));
        if(get(query, 'period').slice(0, 2) === "gt"){
          databaseQuery['period.start'] = {
            $gt: new Date(get(query, 'period').substring(2))
          };  
        } else if(get(query, 'period').slice(0, 2) === "ge"){
          databaseQuery['period.start'] = {
            $gte: new Date(get(query, 'period').substring(2))
          };  
        } else if(get(query, 'period').slice(0, 2) === "lt"){
          databaseQuery['period.end'] = {
            $lt: new Date(get(query, 'period.end').substring(2))
          };  
        } else if(get(query, 'period').slice(0, 2) === "le"){
          databaseQuery['period.end'] = {
            $lte: new Date(get(query, 'period.end').substring(2))
          };  
        } else {
          databaseQuery['period.start'] = new Date(get(query, 'period'))
        }
      } 
    
      log.debug('RestHelpers.generateMongoSearchQuery.jsonQueryObject', databaseQuery);
      return databaseQuery;
    },
    generateMongoSearchOptions: function(query, resourceType){
      let databaseOptions = {
        limit: get(Meteor, 'private.fhir.publicationLimit', 1000)
      }

      if(has(query, '_count')){
        databaseOptions.limit = parseInt(get(query, '_count'))
      }
      if(has(query, '_skip')){
        databaseOptions.skip = parseInt(get(query, '_skip'))
      }

      if(get(Meteor, 'settings.private.accessControl.enableHttpAccessRestrictions')){
        databaseOptions.fields = {
            address: 0
        };
      }

      log.debug('generateMongoSearchOptions().databaseOptions', databaseOptions);
      return databaseOptions;
    },
    parseQueryComponent: function(searchParameter, req, resourceType, expression){
      let queryComponent = {};
    
      if(!expression.includes('extension')){
        // let trimmedExpression = (expression.replace(resourceType + ".", "")).trim();
        let trimmedExpression = get(searchParameter, 'xpath');
    
        let isFuzzy = false;
        if(Array.isArray(searchParameter.modifier)){
          searchParameter.modifier.forEach(function(mod){
            if(mod === "contains"){
              isFuzzy = true;
            }
          })
        }
        
        if(isFuzzy){
          queryComponent[trimmedExpression] = {$regex: get(req.query, get(searchParameter, 'code')), $options: 'i'};
        } else {
          // Handle reference type search parameters
          // Use $in to match multiple possible reference formats (mirrors $everything pattern)
          // FHIR references can be stored as: Patient/123, https://server/Patient/123, or just 123
          let isReferenceType = get(searchParameter, 'type') === 'reference';

          if(isReferenceType){
            let searchValue = get(req.query, get(searchParameter, 'code'));
            let codeComponents = searchValue.split(",");
            let targetResourceType = get(searchParameter, 'target.0', 'Patient');
            let fhirBaseUrl = get(Meteor, 'settings.public.fhirUrl', 'http://localhost:3000');
            let fhirPath = get(Meteor, 'settings.private.fhir.rest.endpoint', 'baseR4');

            // Build $in array with all possible reference formats for each value
            let allPatterns = [];
            codeComponents.forEach(function(val){
              val = val.trim();
              // Extract the ID portion (strip any prefix)
              let idPart = val;
              if(val.includes('/')){
                idPart = val.split('/').pop();
              }

              // Add all possible formats
              allPatterns.push(idPart);                                                        // Just ID
              allPatterns.push(targetResourceType + '/' + idPart);                             // Relative: Patient/123
              allPatterns.push(fhirBaseUrl + '/' + fhirPath + '/' + targetResourceType + '/' + idPart);  // Absolute URL
            });

            queryComponent[trimmedExpression] = { $in: allPatterns };
            log.debug('RestHelpers.parseQueryComponent: Reference search with patterns:', allPatterns);
          } else {
            // Non-reference types - check for token type on CodeableConcept
            let isTokenType = get(searchParameter, 'type') === 'token';
            let searchValue = get(req.query, get(searchParameter, 'code'));
            let searchParamCode = get(searchParameter, 'code');

            if (isTokenType) {
              // The xpath field already contains the MongoDB path - use it directly
              // (xpath is repurposed to store MongoDB-compatible dotted paths, not FHIRPath)
              let mongoPath = trimmedExpression;

              // Extract base field for Identifier/CodeableConcept detection
              // e.g., "identifier.value" → "identifier", "category" → "category"
              let baseField = mongoPath.includes('.') ? mongoPath.split('.')[0] : mongoPath;

              if (baseField && isIdentifierField(baseField, searchParamCode)) {
                // Build Identifier-aware query using base field for $elemMatch
                let identifierQuery = buildIdentifierTokenQuery(baseField, searchValue);
                Object.assign(queryComponent, identifierQuery);
                log.debug('RestHelpers.parseQueryComponent: Token search on Identifier:', { baseField: baseField, searchValue: searchValue, identifierQuery: identifierQuery });
              } else if (baseField && isCodeableConceptField(baseField, searchParamCode)) {
                // Build CodeableConcept-aware query (searches coding.code and text)
                let codeableConceptQuery = buildCodeableConceptTokenQuery(baseField, searchValue);
                Object.assign(queryComponent, codeableConceptQuery);
                log.debug('RestHelpers.parseQueryComponent: Token search on CodeableConcept:', { baseField: baseField, searchValue: searchValue, codeableConceptQuery: codeableConceptQuery });
              } else {
                // Token search on simple code field - use mongoPath directly
                let codeComponents = searchValue.split(",");
                if (Array.isArray(codeComponents) && (codeComponents.length > 1)) {
                  queryComponent[mongoPath] = { $in: codeComponents.map(function(c) { return c.trim(); }) };
                } else {
                  queryComponent[mongoPath] = searchValue;
                }
                log.debug('RestHelpers.parseQueryComponent: Token search on simple field:', { mongoPath: mongoPath, searchValue: searchValue });
              }
            } else {
              // Non-token, non-reference types (string, date, etc.)
              let baseField = trimmedExpression.includes('.') ? trimmedExpression.split('.')[0] : trimmedExpression;

              if (isHumanNameField(baseField, searchParamCode)) {
                // HumanName: search family, given, and text fields
                let humanNameQuery = buildHumanNameStringQuery(baseField, searchValue);
                Object.assign(queryComponent, humanNameQuery);
                log.debug('RestHelpers.parseQueryComponent: String search on HumanName:', { baseField: baseField, searchValue: searchValue, humanNameQuery: humanNameQuery });
              } else {
                // Original logic for simple fields
                let codeComponents = searchValue.split(",");
                if (Array.isArray(codeComponents) && (codeComponents.length > 1)) {
                  queryComponent[trimmedExpression] = { $in: codeComponents.map(function(c) { return c.trim(); }) };
                } else {
                  queryComponent[trimmedExpression] = searchValue;
                }
              }
            }
          }
        }
      }

      return queryComponent;
    },
    fhirPathToMongo: function(searchParameter, queryKey, req){
      let mongoQueryObj = {};
    
      if(typeof searchParameter === "object"){
        let resourceType = get(searchParameter, 'base.0');
  
        // if(get(searchParameter, 'xpath')){        
        //   mongoQueryObj[get(searchParameter, 'xpath')] = req.query[queryKey];
        // } else {
          let expresionString = get(searchParameter, 'expression');
          let expressionArray = expresionString.split('|');
  
          if(Array.isArray(expressionArray)){
            if(expressionArray.length === 1){
              mongoQueryObj = RestHelpers.parseQueryComponent(searchParameter, req, resourceType, expresionString);
            } else if (expressionArray.length > 1){
              
              let componentArray = [];
              expressionArray.forEach(function(expression){
                componentArray.push(RestHelpers.parseQueryComponent(searchParameter, req, resourceType, expression));
              })
              mongoQueryObj = {$or: componentArray }
            }
          }
        // }      
      }
  
      if(process.env.DEBUG){
        log.debug('mongoQueryObj', mongoQueryObj);
      }
      return mongoQueryObj;
    }
  }

export default RestHelpers;