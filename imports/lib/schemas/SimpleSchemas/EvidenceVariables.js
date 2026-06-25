// imports/lib/schemas/SimpleSchemas/EvidenceVariables.js
//
// FHIR R4B EvidenceVariable — defines the population/exposure/criteria a
// Decision Support Intervention evaluates against.

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

export let EvidenceVariables = new Mongo.Collection('EvidenceVariables');

let EvidenceVariable = BaseModel.extend();
EvidenceVariable.prototype._collection = EvidenceVariables;
EvidenceVariables._transform = function (document) {
  return new EvidenceVariable(document);
};

let EvidenceVariableR4Schema = new SimpleSchema({
  "_id": { type: String, optional: true },
  "id": { type: String, optional: true },
  "meta": { type: Object, optional: true, blackbox: true },
  "resourceType": { type: String, defaultValue: "EvidenceVariable" },
  "url": { type: String, optional: true },
  "identifier": { type: Array, optional: true },
  "identifier.$": { type: Object, optional: true, blackbox: true },
  "version": { type: String, optional: true },
  "name": { type: String, optional: true },
  "title": { type: String, optional: true },
  "status": { type: String, optional: true },          // draft | active | retired | unknown
  "date": { type: String, optional: true },
  "description": { type: String, optional: true },
  "note": { type: Array, optional: true },
  "note.$": { type: Object, optional: true, blackbox: true },
  "type": { type: String, optional: true },            // dichotomous | continuous | descriptive
  "characteristic": { type: Array, optional: true },
  "characteristic.$": { type: Object, optional: true, blackbox: true },
  "extension": { type: Array, optional: true },
  "extension.$": { type: Object, optional: true, blackbox: true }
});

// EvidenceVariables.attachSchema(EvidenceVariableR4Schema);

export default { EvidenceVariable, EvidenceVariables, EvidenceVariableR4Schema };
