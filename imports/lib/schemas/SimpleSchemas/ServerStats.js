// imports/lib/schemas/SimpleSchemas/ServerStats.js
// Collection definition for ServerStat resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/ServerStat.json.

import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';


// // create the object using our BaseModel
let ServerStat = BaseModel.extend();

export let ServerStats = createFhirCollection('ServerStat', 'ServerStats');

// //Assign a collection so the object knows how to perform CRUD operations
ServerStat.prototype._collection = ServerStats;

// Create a persistent data store for addresses to be stored.
// HL7.Resources.ServerStats = new Mongo.Collection('HL7.Resources.ServerStats');
