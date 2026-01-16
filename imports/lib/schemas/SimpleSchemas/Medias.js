// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/lib/schemas/SimpleSchemas/Medias.js

if(Package['clinical:autopublish']){
  console.log("*****************************************************************************")
  console.log("HIPAA WARNING:  Your app has the 'clinical-autopublish' package installed.");
  console.log("Any protected health information (PHI) stored in this app should be audited."); 
  console.log("Please consider writing secure publish/subscribe functions and uninstalling.");  
  console.log("");  
  console.log("meteor remove clinical:autopublish");  
  console.log("");  
}
if(Package['autopublish']){
  console.log("*****************************************************************************")
  console.log("HIPAA WARNING:  DO NOT STORE PROTECTED HEALTH INFORMATION IN THIS APP. ");  
  console.log("Your application has the 'autopublish' package installed.  Please uninstall.");
  console.log("");  
  console.log("meteor remove autopublish");  
  console.log("meteor add clinical:autopublish");  
  console.log("");  
}

import { get } from 'lodash';
import validator from 'validator';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import { BaseSchema, DomainResourceSchema, IdentifierSchema, ReferenceSchema, ContactPointSchema, AddressSchema, SignatureSchema, CodeableConceptSchema, QuantitySchema, PeriodSchema, RangeSchema, Code, AnnotationSchema } from 'meteor/clinical:hl7-resource-datatypes';


// create the object using our BaseModel
let Media = BaseModel.extend();


export let Medias = new Mongo.Collection('Medias');

//Assign a collection so the object knows how to perform CRUD operations
Media.prototype._collection = Medias;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Medias._transform = function (document) {
  return new Media(document);
};


let MediaR4 = new SimpleSchema({
  "_id" : {
    type: String,
    optional: true
  },
  "id" : {
    type: String,
    optional: true
  },
  "meta" : {
    type: Object,
    optional: true,
    blackbox: true
  },
  "resourceType" : {
    type: String,
    defaultValue: "Media"
  },
  "identifier" : {
    optional: true,
    type:  Array
  },
  "identifier.$" : {
    optional: true,
    type:  IdentifierSchema 
  },
  "extension" : {
    optional: true,
    type:  Array
  },
  "extension.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
  },
  "modifierExtension" : {
    optional: true,
    type:  Array
  },
  "modifierExtension.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
  }, 
  "basedOn" : {
    optional: true,
    type: Array
  },
  "basedOn.$" : {
    optional: true,
    type: ReferenceSchema
  },
  "partOf" : {
    optional: true,
    type: Array
  },
  "partOf.$" : {
    optional: true,
    type: ReferenceSchema
  },
  "status" : {
    type: Code,
    allowedValues: ['preparation', 'in-progress', 'not-done', 'on-hold', 'stopped', 'completed', 'entered-in-error', 'unknown'],
    defaultValue: 'completed'
  },
  "type" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "modality" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "view" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "subject" : {
    optional: true,
    type: ReferenceSchema
  },
  "encounter" : {
    optional: true,
    type: ReferenceSchema
  },
  "created" : {
    optional: true,
    type: Date
  },
  "createdDateTime" : {
    optional: true,
    type: Date
  },
  "createdPeriod" : {
    optional: true,
    type: PeriodSchema
  },
  "issued" : {
    optional: true,
    type: Date
  },
  "operator" : {
    optional: true,
    type: Array
  },
  "operator.$" : {
    optional: true,
    type: ReferenceSchema
  },
  "reasonCode" : {
    optional: true,
    type: Array
  },
  "reasonCode.$" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "bodySite" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "deviceName" : {
    optional: true,
    type: String
  },
  "device" : {
    optional: true,
    type: ReferenceSchema
  },
  "height" : {
    optional: true,
    type: Number
  },
  "width" : {
    optional: true,
    type: Number
  },
  "frames" : {
    optional: true,
    type: Number
  },
  "duration" : {
    optional: true,
    type: Number
  },
  "content" : {
    type: Object
  },
  "content.id" : {
    optional: true,
    type: String
  },
  "content.extension" : {
    optional: true,
    type: Array
  },
  "content.extension.$" : {
    optional: true,
    blackbox: true,
    type: Object
  },
  "content.contentType" : {
    optional: true,
    type: String
  },
  "content.language" : {
    optional: true,
    type: Code
  },
  "content.data" : {
    optional: true,
    type: String
  },
  "content.url" : {
    optional: true,
    type: String
  },
  "content.size" : {
    optional: true,
    type: Number
  },
  "content.hash" : {
    optional: true,
    type: String
  },
  "content.title" : {
    optional: true,
    type: String
  },
  "content.creation" : {
    optional: true,
    type: Date
  },
  "note" : {
    optional: true,
    type: Array
  },
  "note.$" : {
    optional: true,
    type: AnnotationSchema
  }
});


let MediaSchema = MediaR4;

// Note: In Meteor v3, we're not using Collection2, so we don't attach schemas
// BaseSchema.extend(MediaSchema);
// DomainResourceSchema.extend(MediaSchema);
// Medias.attachSchema(MediaSchema);

export default { Media, Medias, MediaSchema, MediaR4 };