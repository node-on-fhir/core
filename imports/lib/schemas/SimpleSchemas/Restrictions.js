// imports/lib/schemas/SimpleSchemas/Restrictions.js
// Collection definition for Restriction resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Restriction.json.

import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';


// create the object using our BaseModel
let Restriction = BaseModel.extend();


export let Restrictions = createFhirCollection('Restriction', 'Restrictions');

//Assign a collection so the object knows how to perform CRUD operations
Restriction.prototype._collection = Restrictions;



//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Restrictions._transform = function (document) {
  return new Restriction(document);
};

export default { Restriction, Restrictions };
