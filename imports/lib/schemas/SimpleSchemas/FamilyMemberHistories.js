// imports/lib/schemas/SimpleSchemas/FamilyMemberHistories.js
// Collection definition for FamilyMemberHistory resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/FamilyMemberHistory.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

export let FamilyMemberHistories = createFhirCollection('FamilyMemberHistory', 'FamilyMemberHistories');

// create the object using our BaseModel
let FamilyMemberHistory = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
FamilyMemberHistory.prototype._collection = FamilyMemberHistories;

//Add the transform to the collection
FamilyMemberHistories._transform = function (document) {
  return new FamilyMemberHistory(document);
};

export default { FamilyMemberHistory, FamilyMemberHistories };
