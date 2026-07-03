// imports/lib/schemas/SimpleSchemas/Appointments.js
// Collection definition for Appointment resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Appointment.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let Appointment = BaseModel.extend();

export let Appointments = createFhirCollection('Appointment', 'Appointments');

//Assign a collection so the object knows how to perform CRUD operations
Appointment.prototype._collection = Appointments;

//Add the transform to the collection
Appointments._transform = function (document) {
  return new Appointment(document);
};

export default { Appointment, Appointments };
export { Appointment };
