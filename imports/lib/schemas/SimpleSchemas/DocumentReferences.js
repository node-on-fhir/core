// imports/lib/schemas/SimpleSchemas/DocumentReferences.js
// Collection definition for DocumentReference resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/DocumentReference.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let DocumentReference = BaseModel.extend();


// Create a persistent data store for addresses to be stored.
// HL7.Resources.Patients = new Mongo.Collection('HL7.Resources.Patients');
export let DocumentReferences = createFhirCollection('DocumentReference', 'DocumentReferences');

//Assign a collection so the object knows how to perform CRUD operations
DocumentReference.prototype._collection = DocumentReferences;

//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
DocumentReferences._transform = function (document) {
  return new DocumentReference(document);
};
