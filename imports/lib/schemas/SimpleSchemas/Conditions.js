// imports/lib/schemas/SimpleSchemas/Conditions.js
// Collection definition for Condition resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Condition.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let Condition = BaseModel.extend();


export let Conditions = createFhirCollection('Condition', 'Conditions');

//Assign a collection so the object knows how to perform CRUD operations
Condition.prototype._collection = Conditions;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Conditions._transform = function (document) {
  return new Condition(document);
};

export default { Condition, Conditions };
