// imports/lib/schemas/SimpleSchemas/MolecularSequences.js

import { get } from 'lodash';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

import BaseModel from '../../BaseModel';
import { DomainResourceSchema, IdentifierSchema, ReferenceSchema } from 'meteor/clinical:hl7-resource-datatypes';

let MolecularSequence = BaseModel.extend();

export let MolecularSequences = new Mongo.Collection('MolecularSequences');

MolecularSequence.prototype._collection = MolecularSequences;

MolecularSequences._transform = function (document) {
  return new MolecularSequence(document);
};

let MolecularSequenceSchema = DomainResourceSchema.extend({
  "resourceType": {
    type: String,
    defaultValue: "MolecularSequence"
  },
  "identifier": {
    optional: true,
    type: Array
  },
  "identifier.$": {
    optional: true,
    type: IdentifierSchema
  },
  "type": {
    optional: true,
    type: String
  },
  "patient": {
    optional: true,
    type: ReferenceSchema
  },
  "specimen": {
    optional: true,
    type: ReferenceSchema
  },
  "device": {
    optional: true,
    type: ReferenceSchema
  },
  "performer": {
    optional: true,
    type: ReferenceSchema
  },
  "coordinateSystem": {
    optional: true,
    type: Number
  },
  "referenceSeq": {
    optional: true,
    blackbox: true,
    type: Object
  },
  "observedSeq": {
    optional: true,
    type: String
  },
  "variant": {
    optional: true,
    type: Array
  },
  "variant.$": {
    optional: true,
    blackbox: true,
    type: Object
  },
  "quality": {
    optional: true,
    type: Array
  },
  "quality.$": {
    optional: true,
    blackbox: true,
    type: Object
  },
  "readCoverage": {
    optional: true,
    type: Number
  },
  "repository": {
    optional: true,
    type: Array
  },
  "repository.$": {
    optional: true,
    blackbox: true,
    type: Object
  },
  "pointer": {
    optional: true,
    type: Array
  },
  "pointer.$": {
    optional: true,
    type: ReferenceSchema
  },
  "structureVariant": {
    optional: true,
    type: Array
  },
  "structureVariant.$": {
    optional: true,
    blackbox: true,
    type: Object
  }
});

export default { MolecularSequence, MolecularSequences, MolecularSequenceSchema };
