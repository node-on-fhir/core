// imports/lib/schemas/SimpleSchemas/BiologicallyDerivedProducts.js

import { get } from 'lodash';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

import BaseModel from '../../BaseModel';
import { DomainResourceSchema, IdentifierSchema, CodeableConceptSchema, ReferenceSchema, PeriodSchema } from 'meteor/clinical:hl7-resource-datatypes';

let BiologicallyDerivedProduct = BaseModel.extend();

export let BiologicallyDerivedProducts = new Mongo.Collection('BiologicallyDerivedProducts');

BiologicallyDerivedProduct.prototype._collection = BiologicallyDerivedProducts;

BiologicallyDerivedProducts._transform = function (document) {
  return new BiologicallyDerivedProduct(document);
};

let BiologicallyDerivedProductSchema = DomainResourceSchema.extend({
  "resourceType": {
    type: String,
    defaultValue: "BiologicallyDerivedProduct"
  },
  "identifier": {
    optional: true,
    type: Array
  },
  "identifier.$": {
    optional: true,
    type: IdentifierSchema
  },
  "productCategory": {
    optional: true,
    type: String
  },
  "productCode": {
    optional: true,
    type: CodeableConceptSchema
  },
  "status": {
    optional: true,
    type: String
  },
  "request": {
    optional: true,
    type: Array
  },
  "request.$": {
    optional: true,
    type: ReferenceSchema
  },
  "quantity": {
    optional: true,
    type: Number
  },
  "parent": {
    optional: true,
    type: Array
  },
  "parent.$": {
    optional: true,
    type: ReferenceSchema
  },
  "collection": {
    optional: true,
    blackbox: true,
    type: Object
  },
  "processing": {
    optional: true,
    type: Array
  },
  "processing.$": {
    optional: true,
    blackbox: true,
    type: Object
  },
  "manipulation": {
    optional: true,
    blackbox: true,
    type: Object
  },
  "storage": {
    optional: true,
    type: Array
  },
  "storage.$": {
    optional: true,
    blackbox: true,
    type: Object
  }
});

export default { BiologicallyDerivedProduct, BiologicallyDerivedProducts, BiologicallyDerivedProductSchema };
