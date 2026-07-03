// imports/lib/schemas/SimpleSchemas/MolecularSequences.js
// Collection definition for MolecularSequence resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/MolecularSequence.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

let MolecularSequence = BaseModel.extend();

export let MolecularSequences = createFhirCollection('MolecularSequence', 'MolecularSequences');

MolecularSequence.prototype._collection = MolecularSequences;

MolecularSequences._transform = function (document) {
  return new MolecularSequence(document);
};

export default { MolecularSequence, MolecularSequences };
