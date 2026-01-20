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


export let ArtifactAssessments = new Mongo.Collection('ArtifactAssessments');

// create the object using our BaseModel
let ArtifactAssessment = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
ArtifactAssessment.prototype._collection = ArtifactAssessments;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
ArtifactAssessments._transform = function (document) {
  return new ArtifactAssessment(document);
};

let ArtifactAssessmentR4Schema = new SimpleSchema({
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
    defaultValue: "ArtifactAssessment"
  },
  "identifier": {
    optional: true,
    type: Array
  },
  "identifier.$": {
    optional: true,
    type: IdentifierSchema
  },
  "extension": {
    optional: true,
    type: Array
  },
  "extension.$": {
    optional: true,
    blackbox: true,
    type: Object
  },
  "modifierExtension": {
    optional: true,
    type: Array
  },
  "modifierExtension.$": {
    optional: true,
    blackbox: true,
    type: Object
  },
  "url": {
    type: String,
    optional: true
  },
  "identifier": {
    type: Array,
    optional: true
  },
  "identifier.$": {
    type: IdentifierSchema
  },
  "version": {
    type: String,
    optional: true
  },
  "title": {
    type: String,
    optional: true
  },
  "status": {
    type: Code,
    allowedValues: ['draft', 'active', 'retired', 'unknown']
  },
  "date": {
    type: Date,
    optional: true
  },
  "publisher": {
    type: String,
    optional: true
  },
  "contact": {
    type: Array,
    optional: true
  },
  "contact.$": {
    type: Object,
    blackbox: true
    // type: ContactDetailSchema
  },
  "description": {
    type: String,
    optional: true
  },
  "useContext": {
    type: Array,
    optional: true
  },
  "useContext.$": {
    // type: UsageContextSchema
    type: Object,
    blackbox: true
  },
  "jurisdiction": {
    type: Array,
    optional: true
  },
  "jurisdiction.$": {
    type: CodeableConceptSchema
  },
  "artifact": {
    type: Array,
    optional: true
  },
  "artifact.$": {
    type: String
  },
  "artifactReference": {
    type: Array,
    optional: true
  },
  "artifactReference.$": {
    type: ReferenceSchema
  },
  "workflowStatus": {
    type: CodeableConceptSchema,
    optional: true
  },
  "disposition": {
    type: CodeableConceptSchema,
    optional: true
  },
  "author": {
    type: Array,
    optional: true
  },
  "author.$": {
    type: ReferenceSchema
  },
  "content": {
    type: Array,
    optional: true
  },
  "content.$": {
    type: Object
  },
  "content.$.informationType": {
    type: CodeableConceptSchema,
    optional: true
  },
  "content.$.summary": {
    type: String,
    optional: true
  },
  "content.$.type": {
    type: CodeableConceptSchema,
    optional: true
  },
  "content.$.classifier": {
    type: Array,
    optional: true
  },
  "content.$.classifier.$": {
    type: CodeableConceptSchema
  },
  "content.$.quantity": {
    type: QuantitySchema,
    optional: true
  },
  "content.$.quality": {
    type: Array,
    optional: true
  },
  "content.$.quality.$": {
    type: Object
  },
  "content.$.quality.$.type": {
    type: CodeableConceptSchema
  },
  "content.$.quality.$.score": {
    type: CodeableConceptSchema,
    optional: true
  },
  "content.$.quality.$.rating": {
    type: CodeableConceptSchema,
    optional: true
  },
  "content.$.quality.$.note": {
    type: Array,
    optional: true
  },
  "content.$.quality.$.note.$": {
    type: AnnotationSchema
  },
  "content.$.strengthOfRecommendation": {
    type: Object,
    optional: true
  },
  "content.$.strengthOfRecommendation.type": {
    type: CodeableConceptSchema
  },
  "content.$.strengthOfRecommendation.rating": {
    type: CodeableConceptSchema,
    optional: true
  },
  "content.$.strengthOfRecommendation.note": {
    type: Array,
    optional: true
  },
  "content.$.strengthOfRecommendation.note.$": {
    type: AnnotationSchema
  },
  "content.$.component": {
    type: Array,
    optional: true
  },
  "content.$.component.$": {
    type: Object
  },
  "content.$.component.$.type": {
    type: CodeableConceptSchema
  },
  "content.$.component.$.value": {
    type: Object,
    blackbox: true,
    optional: true
  }
});

// ArtifactAssessments.attachSchema(ArtifactAssessmentR4Schema);

export default { ArtifactAssessment, ArtifactAssessments, ArtifactAssessmentR4Schema };