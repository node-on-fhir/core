// imports/lib/schemas/SimpleSchemas/PlanDefinitions.js
// Collection definition for PlanDefinition resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/PlanDefinition.json.

import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';


export let PlanDefinitions = createFhirCollection('PlanDefinition', 'PlanDefinitions');

// create the object using our BaseModel
let PlanDefinition = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
PlanDefinition.prototype._collection = PlanDefinitions;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
PlanDefinitions._transform = function (document) {
  return new PlanDefinition(document);
};

PlanDefinition.prototype.toFhir = function(){
  console.log('PlanDefinition.toFhir()');

  return EJSON.stringify(this.name);
}

/**
 * @summary The displayed name of the plan definition
 * @memberOf PlanDefinition
 * @name displayName
 * @version 1.2.3
 * @returns {String}
 */
PlanDefinition.prototype.displayName = function () {
  if (this.title) {
    return this.title;
  } else if (this.name) {
    return this.name;
  }
  return '';
};

export default { PlanDefinition, PlanDefinitions };
