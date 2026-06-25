// imports/lib/schemas/SimpleSchemas/Citations.js
//
// FHIR R4B Citation — the bibliographic citation source attribute for
// evidence-based Decision Support Interventions (§ 170.315(b)(11)(iv)(A)(1)).

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

export let Citations = new Mongo.Collection('Citations');

let Citation = BaseModel.extend();
Citation.prototype._collection = Citations;
Citations._transform = function (document) {
  return new Citation(document);
};

let CitationR4Schema = new SimpleSchema({
  "_id": { type: String, optional: true },
  "id": { type: String, optional: true },
  "meta": { type: Object, optional: true, blackbox: true },
  "resourceType": { type: String, defaultValue: "Citation" },
  "url": { type: String, optional: true },
  "identifier": { type: Array, optional: true },
  "identifier.$": { type: Object, optional: true, blackbox: true },
  "version": { type: String, optional: true },
  "name": { type: String, optional: true },
  "title": { type: String, optional: true },
  "status": { type: String, optional: true },          // draft | active | retired | unknown
  "date": { type: String, optional: true },
  "publisher": { type: String, optional: true },
  "contact": { type: Array, optional: true },
  "contact.$": { type: Object, optional: true, blackbox: true },
  "description": { type: String, optional: true },
  "summary": { type: Array, optional: true },          // citation text rendering(s)
  "summary.$": { type: Object, optional: true, blackbox: true },
  "citedArtifact": { type: Object, optional: true, blackbox: true },
  "extension": { type: Array, optional: true },
  "extension.$": { type: Object, optional: true, blackbox: true }
});

// Citations.attachSchema(CitationR4Schema);

export default { Citation, Citations, CitationR4Schema };
