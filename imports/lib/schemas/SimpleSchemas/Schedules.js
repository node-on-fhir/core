// imports/lib/schemas/SimpleSchemas/Schedules.js
// Collection definition for Schedule resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Schedule.json.

import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let Schedule = BaseModel.extend();

export let Schedules = createFhirCollection('Schedule', 'Schedules');

//Assign a collection so the object knows how to perform CRUD operations
Schedule.prototype._collection = Schedules;

export default { Schedule, Schedules };
