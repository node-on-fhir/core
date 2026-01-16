import { get } from 'lodash';
import validator from 'validator';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import {  AddressSchema, BaseSchema, ContactPointSchema, CodeableConceptSchema, DomainResourceSchema, IdentifierSchema,  MoneySchema, PeriodSchema, QuantitySchema, ReferenceSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';


// if(Package['clinical:autopublish']){
//   console.log("*****************************************************************************")
//   console.log("HIPAA WARNING:  Your app has the 'clinical-autopublish' package installed.");
//   console.log("Any protected health information (PHI) stored in this app should be audited."); 
//   console.log("Please consider writing secure publish/subscribe functions and uninstalling.");  
//   console.log("");  
//   console.log("meteor remove clinical:autopublish");  
//   console.log("");  
// }
// if(Package['autopublish']){
//   console.log("*****************************************************************************")
//   console.log("HIPAA WARNING:  DO NOT STORE PROTECTED HEALTH INFORMATION IN THIS APP. ");  
//   console.log("Your application has the 'autopublish' package installed.  Please uninstall.");
//   console.log("");  
//   console.log("meteor remove autopublish");  
//   console.log("meteor add clinical:autopublish");  
//   console.log("");  
// }


export let Libraries = new Mongo.Collection('Libraries');

// create the object using our BaseModel
let Library = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
Library.prototype._collection = Libraries;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Libraries._transform = function (document) {
  return new Library(document);
};

let LibraryR4Schema = new SimpleSchema({
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
  "resourceType": {
    type: String,
    defaultValue: "Library"
  },
  "url": {
    optional: true,
    type: String
  },
  "identifier": {
    optional: true,
    type: Array
  },
  "identifier.$": {
    type: IdentifierSchema
  },
  "version": {
    optional: true,
    type: String
  },
  "name": {
    optional: true,
    type: String
  },
  "title": {
    optional: true,
    type: String
  },
  "subtitle": {
    optional: true,
    type: String
  },
  "status": {
    type: Code,
    allowedValues: ['draft', 'active', 'retired', 'unknown']
  },
  "experimental": {
    optional: true,
    type: Boolean
  },
  "type": {
    type: CodeableConceptSchema
  },
  "subjectCodeableConcept": {
    optional: true,
    type: CodeableConceptSchema
  },
  "subjectReference": {
    optional: true,
    type: ReferenceSchema
  },
  "date": {
    optional: true,
    type: Date
  },
  "publisher": {
    optional: true,
    type: String
  },
  "contact": {
    optional: true,
    type: Array
  },
  "contact.$": {
    // type: ContactDetailSchema
    type: Object,
    blackbox: true
  },
  "description": {
    optional: true,
    type: String
  },
  "useContext": {
    optional: true,
    type: Array
  },
  "useContext.$": {
    // type: UsageContextSchema
    type: Object,
    blackbox: true
  },
  "jurisdiction": {
    optional: true,
    type: Array
  },
  "jurisdiction.$": {
    type: CodeableConceptSchema
  },
  "purpose": {
    optional: true,
    type: String
  },
  "usage": {
    optional: true,
    type: String
  },
  "copyright": {
    optional: true,
    type: String
  },
  "approvalDate": {
    optional: true,
    type: Date
  },
  "lastReviewDate": {
    optional: true,
    type: Date
  },
  "effectivePeriod": {
    optional: true,
    type: PeriodSchema
  },
  "topic": {
    optional: true,
    type: Array
  },
  "topic.$": {
    type: CodeableConceptSchema
  },
  "author": {
    optional: true,
    type: Array
  },
  "author.$": {
    // type: ContactDetailSchema
    type: Object,
    blackbox: true
  },
  "editor": {
    optional: true,
    type: Array
  },
  "editor.$": {
    // type: ContactDetailSchema
    type: Object,
    blackbox: true
  },
  "reviewer": {
    optional: true,
    type: Array
  },
  "reviewer.$": {
    // type: ContactDetailSchema
    type: Object,
    blackbox: true
  },
  "endorser": {
    optional: true,
    type: Array
  },
  "endorser.$": {
    // type: ContactDetailSchema
    type: Object,
    blackbox: true
  },
  "relatedArtifact": {
    optional: true,
    type: Array
  },
  "relatedArtifact.$": {
    // type: RelatedArtifactSchema
    type: Object,
    blackbox: true
  },
  "parameter": {
    optional: true,
    type: Array
  },
  "parameter.$": {
    // type: ParameterDefinitionSchema
    type: Object,
    blackbox: true
  },
  "dataRequirement": {
    optional: true,
    type: Array
  },
  "dataRequirement.$": {
    // type: DataRequirementSchema
    type: Object,
    blackbox: true
  },
  "content": {
    optional: true,
    type: Array
  },
  "content.$": {
    type: AttachmentSchema
  }
});

// Libraries.attachSchema(LibraryR4Schema);

export default { Library, Libraries, LibraryR4Schema };