// imports/lib/schemas/SimpleSchemas/Groups.js
// Collection definition for Group resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Group.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let Group = BaseModel.extend();

export let Groups = createFhirCollection('Group', 'Groups');

//Assign a collection so the object knows how to perform CRUD operations
Group.prototype._collection = Groups;

//Add the transform to the collection
Groups._transform = function (document) {
  return new Group(document);
};

export default { Group, Groups };
