// imports/lib/schemas/SimpleSchemas/Bundles.js
// Collection definition for Bundle resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Bundle.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

import { get } from 'lodash';

// create the object using our BaseModel
let Bundle = BaseModel.extend();

export let Bundles = createFhirCollection('Bundle', 'Bundles');

//Assign a collection so the object knows how to perform CRUD operations
Bundle.prototype._collection = Bundles;

//Add the transform to the collection
Bundles._transform = function (document) {
  return new Bundle(document);
};

// TODO:  Review this api call;
// It has suddenly gotten a bit unwieldy with pagination
Bundle.generate = function(payload, type, total, links){
  var bundle = {
    resourceType: "Bundle",
    type: 'searchset',
    entry: []
  };

  if (type) {
    bundle.type = type;
  }

  // the payload is an array of resource entries
  if (Array.isArray(payload)) {
    if(payload.length > 0){
      bundle.entry = payload;
    } else {
      delete bundle.entry;
    }

    if(total){
      // total can be more than what is in the payload,
      // indicating a multi-part response
      bundle.total = total;
    } else {
      // otherwise, if the number of matching records is less than _count or paginationLimit
      // then we just match against the payload length
      bundle.total = payload.length;
    }
    if(links){
      bundle.link = links;
    }
  } else {

    // payload is a single resource; need to create the entry reference
    bundle.entry = [{
      fullUrl: Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.fhirPath', 'fhir-3.0.0/') + get(payload, 'resourceType') + "/" + get(payload, '_id'),
      resource: payload
    }];
    bundle.total = 1;
  }

  return bundle;
};



export { Bundle };
