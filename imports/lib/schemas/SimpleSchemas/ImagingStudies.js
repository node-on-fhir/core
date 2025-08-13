// /imports/lib/schemas/SimpleSchemas/ImagingStudies.js

import { get } from 'lodash';
import SimpleSchema from 'simpl-schema';
import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';

// Import FHIR data types from meteor package
import { AnnotationSchema, CodingSchema, CodeableConceptSchema, IdentifierSchema, ReferenceSchema } from 'meteor/clinical:hl7-resource-datatypes';

// Series Schema for nested series data
const SeriesSchema = new SimpleSchema({
  "uid": {
    type: String,
    optional: true
  },
  "number": {
    type: Number,
    optional: true
  },
  "modality": CodingSchema,
  "description": {
    type: String,
    optional: true
  },
  "numberOfInstances": {
    type: Number,
    optional: true
  },
  "endpoint": {
    type: Array,
    optional: true
  },
  "endpoint.$": ReferenceSchema,
  "bodySite": CodingSchema,
  "laterality": CodingSchema,
  "specimen": {
    type: Array,
    optional: true
  },
  "specimen.$": ReferenceSchema,
  "started": {
    type: String,
    optional: true
  },
  "performer": {
    type: Array,
    optional: true
  },
  "performer.$": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "instance": {
    type: Array,
    optional: true
  },
  "instance.$": {
    type: Object,
    optional: true,
    blackbox: true
  }
});

// ImagingStudy Schema
const ImagingStudySchema = new SimpleSchema({
  "_id": {
    type: String,
    optional: true
  },
  "id": {
    type: String,
    optional: true
  },
  "meta": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "implicitRules": {
    type: String,
    optional: true
  },
  "language": {
    type: String,
    optional: true
  },
  "text": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "contained": {
    type: Array,
    optional: true
  },
  "contained.$": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "extension": {
    type: Array,
    optional: true
  },
  "extension.$": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "modifierExtension": {
    type: Array,
    optional: true
  },
  "modifierExtension.$": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "resourceType": {
    type: String,
    allowedValues: ['ImagingStudy'],
    defaultValue: 'ImagingStudy'
  },
  "identifier": {
    type: Array,
    optional: true
  },
  "identifier.$": IdentifierSchema,
  "status": {
    type: String,
    allowedValues: ['registered', 'available', 'cancelled', 'entered-in-error', 'unknown'],
    defaultValue: 'available'
  },
  "modality": {
    type: Array,
    optional: true
  },
  "modality.$": CodingSchema,
  "subject": ReferenceSchema,
  "encounter": {
    type: ReferenceSchema,
    optional: true
  },
  "started": {
    type: String,
    optional: true
  },
  "basedOn": {
    type: Array,
    optional: true
  },
  "basedOn.$": ReferenceSchema,
  "referrer": {
    type: ReferenceSchema,
    optional: true
  },
  "interpreter": {
    type: Array,
    optional: true
  },
  "interpreter.$": ReferenceSchema,
  "endpoint": {
    type: Array,
    optional: true
  },
  "endpoint.$": ReferenceSchema,
  "numberOfSeries": {
    type: Number,
    optional: true
  },
  "numberOfInstances": {
    type: Number,
    optional: true
  },
  "procedureReference": {
    type: ReferenceSchema,
    optional: true
  },
  "procedureCode": {
    type: Array,
    optional: true
  },
  "procedureCode.$": CodeableConceptSchema,
  "location": {
    type: ReferenceSchema,
    optional: true
  },
  "reasonCode": {
    type: Array,
    optional: true
  },
  "reasonCode.$": CodeableConceptSchema,
  "reasonReference": {
    type: Array,
    optional: true
  },
  "reasonReference.$": ReferenceSchema,
  "note": {
    type: Array,
    optional: true
  },
  "note.$": AnnotationSchema,
  "description": {
    type: String,
    optional: true
  },
  "series": {
    type: Array,
    optional: true
  },
  "series.$": SeriesSchema
});

// create the object using our BaseModel
let ImagingStudy = BaseModel.extend();

// Create collection
export let ImagingStudies = new Mongo.Collection('ImagingStudies');

//Assign a collection so the object knows how to perform CRUD operations
ImagingStudy.prototype._collection = ImagingStudies;

// Add the transform to the collection
ImagingStudies._transform = function (document) {
  return new ImagingStudy(document);
};

// Commented out as per Meteor v3 pattern
// ImagingStudies.attachSchema(ImagingStudySchema);

// Export
export default { ImagingStudy, ImagingStudies, ImagingStudySchema };