// imports/lib/schemas/SimpleSchemas/ObservationDefinitions.js
// Collection definition for ObservationDefinition resources (reference ranges).
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

let ObservationDefinition = BaseModel.extend();
let ObservationDefinitions = createFhirCollection('ObservationDefinition', 'ObservationDefinitions');

ObservationDefinition.prototype._collection = ObservationDefinitions;
ObservationDefinitions._transform = function (document) {
  return new ObservationDefinition(document);
};

export default { ObservationDefinition, ObservationDefinitions };
export { ObservationDefinition, ObservationDefinitions };
