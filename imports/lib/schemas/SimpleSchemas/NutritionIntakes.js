import { get } from 'lodash';
import validator from 'validator';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

import FhirSpecification from '../fhir.schema.r5.js';
// console.debug('typeof FhirSpecification', typeof FhirSpecification)

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
// BETTER REFACTOR:  Replace with JsonSchema importer.
import {  AddressSchema, BaseSchema, ContactPointSchema, CodeableConceptSchema, DomainResourceSchema, IdentifierSchema,  MoneySchema, PeriodSchema, QuantitySchema, ReferenceSchema, SignatureSchema, TimingSchema } from 'meteor/clinical:hl7-resource-datatypes';


// import JSONSchema from 'meteor/bshamblen:json-simple-schema';
import JsonToSimpleSchemaParser from '../JsonToSimpleSchemaParser.js'

// var jsonSchemaDoc = JSON.parse($.ajax({
// 	type: 'GET',
// 	url: 'http://example.com/path-to-json-schema-file',
// 	async: false
// }).responseText);



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


// create the object using our BaseModel
let NutritionIntake = BaseModel.extend();

export let NutritionIntakes = new Mongo.Collection('NutritionIntakes');

//Assign a collection so the object knows how to perform CRUD operations
NutritionIntake.prototype._collection = NutritionIntakes;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
NutritionIntakes._transform = function (document) {
  return new NutritionIntake(document);
};



let NutritionIntakeSchemaOriginal = new SimpleSchema({
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
    defaultValue: "NutritionIntake"
  },

  "identifier" : {
    type: Array,
    optional: true,
  },
  "identifier.$" : {
    type: Object,
    optional: true
  },

  "instantiatesCanonical" : {
    type: Array,
    optional: true,
  },
  "instantiatesCanonical.$" : {
    type: String,
    optional: true
  },

  "instantiatesUri" : {
    type: Array,
    optional: true,
  },
  "instantiatesUri.$" : {
    type: String,
    optional: true
  },

  "basedOn" : {
    type: Array,
    optional: true,
  },
  "basedOn.$" : {
    type: ReferenceSchema,
    optional: true
  },
  "partOf" : {
    type: Array,
    optional: true,
  },
  "partOf.$" : {
    type: ReferenceSchema,
    optional: true
  },

  "status" : {
    type: String,
    optional: true,
  },
  "statusReason" : {
    type: Array,
    optional: true,
  },
  "statusReason.$" : {
    type: CodeableConceptSchema,
    optional: true
  },

  "code" : {
    type: CodeableConceptSchema,
    optional: true,
  },
  "subject" : {
    type: ReferenceSchema,
    optional: true,
  },
  "encounter" : {
    type: ReferenceSchema,
    optional: true,
  },
  "occurrenceDateTime" : {
    type: Date,
    optional: true,
  },
  "occurrencePeriod" : {
    type: PeriodSchema,
    optional: true,
  },
  "recorded" : {
    type: Date,
    optional: true,
  },

  "reportedBoolean" : {
    type: Boolean,
    optional: true,
  },
  "reportedReference" : {
    type: ReferenceSchema,
    optional: true,
  },

  "consumedItem" : {
    type: Array,
    optional: true,
  },
  "consumedItem.$" : {
    type: Object,
    optional: true
  },

  "consumedItem.$.type" : {
    type: CodeableConceptSchema,
    optional: true
  },
  "consumedItem.$.nutritionProduct" : {
    type: ReferenceSchema,
    optional: true
  },
  "consumedItem.$.schedule" : {
    type: TimingSchema,
    optional: true
  },
  "consumedItem.$.amount" : {
    type: QuantitySchema,
    optional: true
  },
  "consumedItem.$.rate" : {
    type: QuantitySchema,
    optional: true
  },
  "consumedItem.$.notConsumed" : {
    type: Boolean,
    optional: true
  },
  "consumedItem.$.notConsumedReason" : {
    type: CodeableConceptSchema,
    optional: true
  },




  "ingredientLabel" : {
    type: Array,
    optional: true
  },
  "ingredientLabel.$" : {
    type: Object,
    optional: true
  },
  "ingredientLabel.$.nutrient" : {
    type: ReferenceSchema,
    optional: true
  },
  "ingredientLabel.$.amount" : {
    type: QuantitySchema,
    optional: true
  },

  "performer" : {
    type: Array,
    optional: true
  },
  "performer.$" : {
    type: Object,
    optional: true
  },
  "performer.$.function" : {
    type: CodeableConceptSchema,
    optional: true
  },
  "performer.$.actor" : {
    type: ReferenceSchema,
    optional: true
  },

  "location" : {
    type: ReferenceSchema,
    optional: true
  },
  "derivedFrom" : {
    type: Array,
    optional: true
  },
  "derivedFrom.$" : {
    type: ReferenceSchema,
    optional: true
  },

  "reason" : {
    type: Array,
    optional: true
  },
  "reason.$" : {
    type: ReferenceSchema,
    optional: true
  },

  "note" : {
    type: Array,
    optional: true
  },
  "note.$" : {
    type: Object,
    blackbox: true,
    optional: true
  },
});



// process.env.DEBUG && console.log('FhirSpecification.definitions.NutritionIntakeSchemaOriginal', NutritionIntakeSchemaOriginal);



// let FhirSpecification = JSON.parse(Assets.getText("lib/schemas/fhir.schema.r5.json"));
 

// var FhirSpecification = JSON.parse(FhirSpecificationRaw);

// process.env.DEBUG && console.log(">>>===================================================")

// process.env.DEBUG && console.log('FhirSpecification.definitions', get(FhirSpecification, 'definitions'))
// process.env.DEBUG && console.log('FhirSpecification.definitions.NutritionIntake', get(FhirSpecification, 'definitions.NutritionIntake'))

var fhirJsonSpecification = new JsonToSimpleSchemaParser(FhirSpecification);

// console.log('fhirJsonSpecification', fhirJsonSpecification)


var NutritionIntakeSchema = fhirJsonSpecification.generateSimpleSchema("NutritionIntake");
// process.env.DEBUG && console.log('FhirSpecification.definitions.NutritionIntakeSchema', NutritionIntakeSchema);

// NutritionIntakes.attachSchema(NutritionIntakeSchemaOriginal);



export default { NutritionIntake, NutritionIntakes, NutritionIntakeSchema };