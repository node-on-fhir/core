// /imports/lib/schemas/SimpleSchemas/NutritionOrders.js

import { get } from 'lodash';
import validator from 'validator';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import {  AddressSchema, BaseSchema, ContactPointSchema, CodeableConceptSchema, DomainResourceSchema, IdentifierSchema,  MoneySchema, PeriodSchema, QuantitySchema, ReferenceSchema, SignatureSchema, AnnotationSchema, RatioSchema, TimingSchema } from 'meteor/clinical:hl7-resource-datatypes';


// create the object using our BaseModel
let NutritionOrder = BaseModel.extend();

export let NutritionOrders = new Mongo.Collection('NutritionOrders');

//Assign a collection so the object knows how to perform CRUD operations
NutritionOrder.prototype._collection = NutritionOrders;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
NutritionOrders._transform = function (document) {
  return new NutritionOrder(document);
};

// NutritionOrder.OralDiet Schema
let OralDietSchema = new SimpleSchema({
  "type": {
    optional: true,
    type: Array
  },
  "type.$": {
    optional: true,
    type: CodeableConceptSchema
  },
  "schedule": {
    optional: true,
    type: Array
  },
  "schedule.$": {
    optional: true,
    type: TimingSchema
  },
  "nutrient": {
    optional: true,
    type: Array
  },
  "nutrient.$": {
    optional: true,
    type: Object
  },
  "nutrient.$.modifier": {
    optional: true,
    type: CodeableConceptSchema
  },
  "nutrient.$.amount": {
    optional: true,
    type: QuantitySchema
  },
  "texture": {
    optional: true,
    type: Array
  },
  "texture.$": {
    optional: true,
    type: Object
  },
  "texture.$.modifier": {
    optional: true,
    type: CodeableConceptSchema
  },
  "texture.$.foodType": {
    optional: true,
    type: CodeableConceptSchema
  },
  "fluidConsistencyType": {
    optional: true,
    type: Array
  },
  "fluidConsistencyType.$": {
    optional: true,
    type: CodeableConceptSchema
  },
  "instruction": {
    optional: true,
    type: String
  }
});

// NutritionOrder.Supplement Schema
let SupplementSchema = new SimpleSchema({
  "type": {
    optional: true,
    type: CodeableConceptSchema
  },
  "productName": {
    optional: true,
    type: String
  },
  "schedule": {
    optional: true,
    type: Array
  },
  "schedule.$": {
    optional: true,
    type: TimingSchema
  },
  "quantity": {
    optional: true,
    type: QuantitySchema
  },
  "instruction": {
    optional: true,
    type: String
  }
});

// NutritionOrder.EnteralFormula Schema
let EnteralFormulaSchema = new SimpleSchema({
  "baseFormulaType": {
    optional: true,
    type: CodeableConceptSchema
  },
  "baseFormulaProductName": {
    optional: true,
    type: String
  },
  "additiveType": {
    optional: true,
    type: CodeableConceptSchema
  },
  "additiveProductName": {
    optional: true,
    type: String
  },
  "caloricDensity": {
    optional: true,
    type: QuantitySchema
  },
  "routeofAdministration": {
    optional: true,
    type: CodeableConceptSchema
  },
  "administration": {
    optional: true,
    type: Array
  },
  "administration.$": {
    optional: true,
    type: Object
  },
  "administration.$.schedule": {
    optional: true,
    type: TimingSchema
  },
  "administration.$.quantity": {
    optional: true,
    type: QuantitySchema
  },
  "administration.$.rateQuantity": {
    optional: true,
    type: QuantitySchema
  },
  "administration.$.rateRatio": {
    optional: true,
    type: RatioSchema
  },
  "maxVolumeToDeliver": {
    optional: true,
    type: QuantitySchema
  },
  "administrationInstruction": {
    optional: true,
    type: String
  }
});

let NutritionOrderSchema = new SimpleSchema({
  "resourceType": {
    type: String,
    defaultValue: "NutritionOrder"
  },
  "id": {
    optional: true,
    type: String
  },
  "_id": {
    optional: true,
    type: String
  },
  "meta": {
    optional: true,
    type: Object,
    blackbox: true
  },
  "implicitRules": {
    optional: true,
    type: String
  },
  "language": {
    optional: true,
    type: String
  },
  "text": {
    optional: true,
    type: Object,
    blackbox: true
  },
  "contained": {
    optional: true,
    type: Array
  },
  "contained.$": {
    optional: true,
    type: Object,
    blackbox: true
  },
  "extension": {
    optional: true,
    type: Array
  },
  "extension.$": {
    optional: true,
    type: Object,
    blackbox: true
  },
  "modifierExtension": {
    optional: true,
    type: Array
  },
  "modifierExtension.$": {
    optional: true,
    type: Object,
    blackbox: true
  },
  "identifier": {
    optional: true,
    type: Array
  },
  "identifier.$": {
    optional: true,
    type: IdentifierSchema
  },
  "instantiates": {
    optional: true,
    type: Array
  },
  "instantiates.$": {
    optional: true,
    type: String
  },
  "instantiatesCanonical": {
    optional: true,
    type: Array
  },
  "instantiatesCanonical.$": {
    optional: true,
    type: String
  },
  "instantiatesUri": {
    optional: true,
    type: Array
  },
  "instantiatesUri.$": {
    optional: true,
    type: String
  },
  "status": {
    optional: true,
    type: String,
    allowedValues: ['draft', 'active', 'on-hold', 'revoked', 'completed', 'entered-in-error', 'unknown']
  },
  "intent": {
    optional: true,
    type: String,
    allowedValues: ['proposal', 'plan', 'directive', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option']
  },
  "patient": {
    type: ReferenceSchema
  },
  "encounter": {
    optional: true,
    type: ReferenceSchema
  },
  "dateTime": {
    type: Date
  },
  "orderer": {
    optional: true,
    type: ReferenceSchema
  },
  "allergyIntolerance": {
    optional: true,
    type: Array
  },
  "allergyIntolerance.$": {
    optional: true,
    type: ReferenceSchema
  },
  "foodPreferenceModifier": {
    optional: true,
    type: Array
  },
  "foodPreferenceModifier.$": {
    optional: true,
    type: CodeableConceptSchema
  },
  "excludeFoodModifier": {
    optional: true,
    type: Array
  },
  "excludeFoodModifier.$": {
    optional: true,
    type: CodeableConceptSchema
  },
  "oralDiet": {
    optional: true,
    type: OralDietSchema
  },
  "supplement": {
    optional: true,
    type: Array
  },
  "supplement.$": {
    optional: true,
    type: SupplementSchema
  },
  "enteralFormula": {
    optional: true,
    type: EnteralFormulaSchema
  },
  "note": {
    optional: true,
    type: Array
  },
  "note.$": {
    optional: true,
    type: AnnotationSchema
  }
});

// NutritionOrders.attachSchema(NutritionOrderSchema);

export default { NutritionOrder, NutritionOrders, NutritionOrderSchema };