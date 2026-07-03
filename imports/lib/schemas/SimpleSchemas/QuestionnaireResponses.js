// imports/lib/schemas/SimpleSchemas/QuestionnaireResponses.js
// Collection definition for QuestionnaireResponse resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/QuestionnaireResponse.json.

import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';


// create the object using our BaseModel
let QuestionnaireResponse = BaseModel.extend();

export let QuestionnaireResponses = createFhirCollection('QuestionnaireResponse', 'QuestionnaireResponses');

//Assign a collection so the object knows how to perform CRUD operations
QuestionnaireResponse.prototype._collection = QuestionnaireResponses;




//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
QuestionnaireResponses._transform = function (document) {
  return new QuestionnaireResponse(document);
};

QuestionnaireResponses.insertUnique = function (record) {
  console.log("QuestionnaireResponses.insertUnique()");

  if(!QuestionnaireResponses.findOne(record._id)){
    let collectionConfig = {};
    if(Meteor.isClient){
      collectionConfig = { validate: false, filter: false }
    }
    let questionnaireResponseId = QuestionnaireResponses.insert(record, collectionConfig);
    console.log('QuestionnaireResponses created: ' + questionnaireResponseId);
    return questionnaireResponseId;
  }
};



export default { QuestionnaireResponse, QuestionnaireResponses };

if (typeof global !== 'undefined') {
  global.QuestionnaireResponses = QuestionnaireResponses;
}
