// imports/lib/schemas/SimpleSchemas/ExampleScenario.js
// Collection definition for ExampleScenario resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/ExampleScenario.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let ExampleScenario = BaseModel.extend();


// // Create a persistent data store for addresses to be stored.
// // HL7.Resources.ExampleScenarios = new Mongo.Collection('HL7.Resources.ExampleScenarios');
export let ExampleScenarios = createFhirCollection('ExampleScenario', 'ExampleScenarios');

//Assign a collection so the object knows how to perform CRUD operations
ExampleScenario.prototype._collection = ExampleScenarios;



//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
ExampleScenarios._transform = function (document) {
  return new ExampleScenario(document);
};

export default { ExampleScenario, ExampleScenarios };
