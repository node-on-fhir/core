// imports/lib/schemas/SimpleSchemas/Devices.js
// Collection definition for Device resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Device.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let Device = BaseModel.extend();

export let Devices = createFhirCollection('Device', 'Devices');

//Assign a collection so the object knows how to perform CRUD operations
Device.prototype._collection = Devices;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Devices._transform = function (document) {
  return new Device(document);
};

export default { Device, Devices };
