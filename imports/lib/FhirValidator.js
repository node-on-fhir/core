// imports/lib/FhirValidator.js
// Validates FHIR resources against the staged R4B JSON Schemas.
// Deliberately plain CommonJS with zero Meteor imports: loadable from Meteor
// server code AND from plain `node --test`.

const Ajv = require('ajv');
const schemas = require('./schemas/R4B/JsonSchema/index.js');

// strict:false + validateFormats:false: the staged schemas are generated and
// permissive by design; schema quirks must never crash the server.
const ajv = new Ajv({ strict: false, validateFormats: false, allowUnionTypes: true });

const compiledCache = {};
const customSchemas = {};

// Staged schemas declare draft-06 and use the legacy `id` keyword. AJV 8
// speaks draft-07+; for these generated (flat, $ref-free) files the entire
// migration delta is the two keywords below.
function normalizeSchema(schema) {
  const clone = JSON.parse(JSON.stringify(schema));
  delete clone.id;
  clone.$schema = 'http://json-schema.org/draft-07/schema#';
  return clone;
}

function registerSchema(name, jsonSchema) {
  customSchemas[name] = jsonSchema;
  delete compiledCache[name];
}

function getValidatorFor(resourceType) {
  if (compiledCache[resourceType]) {
    return compiledCache[resourceType];
  }
  const schema = customSchemas[resourceType] || schemas[resourceType];
  if (!schema) {
    return null;
  }
  compiledCache[resourceType] = ajv.compile(normalizeSchema(schema));
  return compiledCache[resourceType];
}

// Validation always runs on a cleaned copy -- never mutate the stored doc,
// and never fail on Mongo/Meteor internals.
function cleanForValidation(resource) {
  const clone = JSON.parse(JSON.stringify(resource));
  delete clone._id;
  delete clone._document;
  return clone;
}

function validateResource(resource) {
  const resourceType = resource ? resource.resourceType : null;
  if (!resourceType) {
    return { valid: false, resourceType: null, errors: [{ instancePath: '', message: 'resource has no resourceType' }] };
  }
  const validator = getValidatorFor(resourceType);
  if (!validator) {
    // Permissive philosophy: unknown types pass, flagged.
    return { valid: true, resourceType: resourceType, errors: [], warnings: ['no schema registered for resourceType ' + resourceType] };
  }
  const valid = validator(cleanForValidation(resource));
  return { valid: valid, resourceType: resourceType, errors: valid ? [] : validator.errors.slice() };
}

function toOperationOutcome(errors, resource) {
  const resourceType = (resource && resource.resourceType) || 'Resource';
  return {
    resourceType: 'OperationOutcome',
    issue: (errors || []).map(function(err) {
      const pathPart = (err.instancePath || '').replace(/\//g, '.');
      return {
        severity: 'error',
        code: 'invariant',
        diagnostics: (err.instancePath || '(root)') + ' ' + err.message,
        expression: [resourceType + pathPart]
      };
    })
  };
}

function validateBundle(bundle) {
  const envelope = validateResource(bundle);
  const entries = (bundle && Array.isArray(bundle.entry) ? bundle.entry : []).map(function(entry, index) {
    const result = validateResource(entry ? entry.resource : null);
    return { index: index, valid: result.valid, resourceType: result.resourceType, errors: result.errors };
  });
  const allEntriesValid = entries.every(function(e) { return e.valid; });
  return { valid: envelope.valid && allEntriesValid, envelope: envelope, entries: entries };
}

module.exports = { validateResource, getValidatorFor, registerSchema, toOperationOutcome, validateBundle };
