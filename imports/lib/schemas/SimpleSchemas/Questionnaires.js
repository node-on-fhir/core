// imports/lib/schemas/SimpleSchemas/Questionnaires.js
// Collection definition for Questionnaire resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Questionnaire.json.

import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';


// // create the object using our BaseModel
let Questionnaire = BaseModel.extend();

export let Questionnaires = createFhirCollection('Questionnaire', 'Questionnaires');

//Assign a collection so the object knows how to perform CRUD operations
Questionnaire.prototype._collection = Questionnaires;

// Create a persistent data store for addresses to be stored.
// HL7.Resources.Patients = new Mongo.Collection('HL7.Resources.Patients');




// //Add the transform to the collection since Meteor.users is pre-defined by the accounts package
// Questionnaires._transform = function (document) {
//   return new Questionnaire(document);
// };



export default { Questionnaire, Questionnaires };

global.Questionnaires = Questionnaires;
