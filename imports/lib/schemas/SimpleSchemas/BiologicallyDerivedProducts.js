// imports/lib/schemas/SimpleSchemas/BiologicallyDerivedProducts.js
// Collection definition for BiologicallyDerivedProduct resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/BiologicallyDerivedProduct.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

let BiologicallyDerivedProduct = BaseModel.extend();

export let BiologicallyDerivedProducts = createFhirCollection('BiologicallyDerivedProduct', 'BiologicallyDerivedProducts');

BiologicallyDerivedProduct.prototype._collection = BiologicallyDerivedProducts;

BiologicallyDerivedProducts._transform = function (document) {
  return new BiologicallyDerivedProduct(document);
};

export default { BiologicallyDerivedProduct, BiologicallyDerivedProducts };
