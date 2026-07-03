// imports/lib/schemas/SimpleSchemas/PractitionerRoles.js
// Collection definition for PractitionerRole resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/PractitionerRole.json.

import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';


// create the object using our BaseModel
let PractitionerRole = BaseModel.extend();

export let PractitionerRoles = createFhirCollection('PractitionerRole', 'PractitionerRoles');

//Assign a collection so the object knows how to perform CRUD operations
PractitionerRole.prototype._collection = PractitionerRoles;



//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
PractitionerRoles._transform = function (document) {
  return new PractitionerRole(document);
};

export default { PractitionerRole, PractitionerRoles };
