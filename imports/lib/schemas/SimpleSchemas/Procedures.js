// imports/lib/schemas/SimpleSchemas/Procedures.js
// Collection definition for Procedure resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Procedure.json.

import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';


// create the object using our BaseModel
let Procedure = BaseModel.extend();

let Procedures = createFhirCollection('Procedure', 'Procedures');

//Assign a collection so the object knows how to perform CRUD operations
Procedure.prototype._collection = Procedures;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Procedures._transform = function (document) {
  return new Procedure(document);
};

export { Procedure, Procedures };
