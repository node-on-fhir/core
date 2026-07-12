// imports/lib/schemas/SimpleSchemas/RiskAssessments.js
// Collection definition for RiskAssessment resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/RiskAssessment.json.

import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';


// create the object using our BaseModel
let RiskAssessment = BaseModel.extend();

export let RiskAssessments = createFhirCollection('RiskAssessment', 'RiskAssessments');


//Assign a collection so the object knows how to perform CRUD operations
RiskAssessment.prototype._collection = RiskAssessments;



//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
RiskAssessments._transform = function (document) {
  return new RiskAssessment(document);
};

export default { RiskAssessment, RiskAssessments };
