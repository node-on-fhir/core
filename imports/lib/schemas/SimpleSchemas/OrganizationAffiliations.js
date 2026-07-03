// imports/lib/schemas/SimpleSchemas/OrganizationAffiliations.js
// Collection definition for OrganizationAffiliation resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/OrganizationAffiliation.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let OrganizationAffiliation = BaseModel.extend();

export let OrganizationAffiliations = createFhirCollection('OrganizationAffiliation', 'OrganizationAffiliations');

//Assign a collection so the object knows how to perform CRUD operations
OrganizationAffiliation.prototype._collection = OrganizationAffiliations;

//Add the transform to the collection
OrganizationAffiliations._transform = function (document) {
  return new OrganizationAffiliation(document);
};

export default { OrganizationAffiliation, OrganizationAffiliations };
