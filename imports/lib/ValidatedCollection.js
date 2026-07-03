// imports/lib/ValidatedCollection.js
// Drop-in Mongo.Collection factory with opt-in schema validation.
// Permissive by default (honeycomb philosophy: permissive inbound, strict
// outbound). Strict mode applies when: the op passes {validate:true}, the
// collection is in settings.private.fhir.schemaValidation.strictCollections,
// or settings.private.fhir.schemaValidation.validate === true.
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import FhirValidator from './FhirValidator.js';

const INTERCEPTED = ['insertAsync', 'updateAsync', 'upsertAsync'];

function strictModeApplies(collectionName, callOptions) {
  const perOp = get(callOptions, 'validate');
  if (perOp === true) { return true; }
  if (perOp === false) { return false; }
  const config = get(Meteor, 'settings.private.fhir.schemaValidation', {});
  if (get(config, 'validate') === true) { return true; }
  return (get(config, 'strictCollections') || []).includes(collectionName);
}

function assertValid(resourceType, doc) {
  const result = FhirValidator.validateResource(doc);
  if (!result.valid) {
    const outcome = FhirValidator.toOperationOutcome(result.errors, doc);
    console.warn('[ValidatedCollection] ' + resourceType + ' failed schema validation:', result.errors.length, 'issue(s)');
    throw new Meteor.Error('validation-failed', resourceType + ' failed schema validation', JSON.stringify(outcome));
  }
}

function isModifier(updateDoc) {
  return Object.keys(updateDoc || {}).some(function(key) { return key.charAt(0) === '$'; });
}

export function createFhirCollection(resourceType, collectionName, mongoOptions) {
  const collection = new Mongo.Collection(collectionName, mongoOptions);

  const handler = {
    get: function(target, prop) {
      if (prop === 'collection') { return target; }   // escape hatch
      if (prop === 'resourceType') { return resourceType; }

      if (Meteor.isServer && INTERCEPTED.includes(prop)) {
        if (prop === 'insertAsync') {
          return async function(doc, callOptions) {
            if (strictModeApplies(collectionName, callOptions)) {
              assertValid(resourceType, doc);
            }
            return target.insertAsync(doc);
          };
        }
        // updateAsync / upsertAsync
        return async function(selector, updateDoc, callOptions, callback) {
          if (strictModeApplies(collectionName, callOptions)) {
            if (isModifier(updateDoc)) {
              console.warn('[ValidatedCollection] ' + collectionName + ': modifier update not schema-validated (egress validation still applies)');
            } else {
              assertValid(resourceType, updateDoc);
            }
          }
          return target[prop](selector, updateDoc, callOptions, callback);
        };
      }

      const value = target[prop];
      return (typeof value === 'function') ? value.bind(target) : value;
    },
    set: function(target, prop, value) {
      target[prop] = value;   // supports `Wrapped._transform = ...` etc.
      return true;
    }
  };

  return new Proxy(collection, handler);
}
