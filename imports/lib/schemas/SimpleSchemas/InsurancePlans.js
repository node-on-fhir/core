import { get } from 'lodash';
import validator from 'validator';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import {  AddressSchema, HumanNameSchema, BaseSchema, ContactPointSchema, CodeableConceptSchema, DomainResourceSchema, IdentifierSchema,  MoneySchema, PeriodSchema, QuantitySchema, ReferenceSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';
// import HumanNameSchema from '../../../datatypes/HumanName';


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
let InsurancePlan = BaseModel.extend();


// // Create a persistent data store for addresses to be stored.
// // HL7.Resources.InsurancePlans = new Mongo.Collection('HL7.Resources.InsurancePlans');
export let InsurancePlans = new Mongo.Collection('InsurancePlans');

//Assign a collection so the object knows how to perform CRUD operations
InsurancePlan.prototype._collection = InsurancePlans;




//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
InsurancePlans._transform = function (document) {
  return new InsurancePlan(document);
};

let InsurancePlanSchema = DomainResourceSchema.extend({
  "resourceType" : {
    type: String,
    defaultValue: "InsurancePlan"
  },
  "id" : {
    optional: true,
    type:  String 
    },
  "_id" : {
    optional: true,
    type:  String 
    },
  "meta" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "meta.versionId" : {
    optional: true,
    type:  Number
  },
  "text" : {
    optional: true,
    blackbox: true,
    type:  Object
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
  "contained" : {
    optional: true,
    type:  Array
    },
  "contained.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
  },

  "identifier" : {
    optional: true,
    type:  Array
    },
  "identifier.$" : {
    optional: true,
    blackbox: true,
    type:  IdentifierSchema 
    },
  "status" : {
    optional: true,
    type:  String
    },
  "type" : {
    optional: true,
    type:  Array
    },
  "type.$" : {
    optional: true,
    blackbox: true,
    type:  CodeableConceptSchema 
    },   
  "name" : {
    optional: true,
    type:  String
    },
  "alias" : {
    optional: true,
    type:  Array
    },
  "alias.$" : {
    optional: true,
    type:  String 
    },   
  "period" : {
    optional: true,
    type: PeriodSchema
    },   
  "ownedBy" : {
    optional: true,
    type:  ReferenceSchema
    },       
  "administratedBy" : {
    optional: true,
    type:  ReferenceSchema
    },       
  "coverageArea" : {
    optional: true,
    type:  Array
    },
  "coverageArea.$" : {
    optional: true,
    type:  ReferenceSchema 
    },       
  "contact" : {
    optional: true,
    type:  Array
    },
  "contact.$" : {
    optional: true,
    type:  Object 
    },
  "contact.$.purpose" : {
    optional: true,
    type:  CodeableConceptSchema 
    },
  "contact.$.name" : {
    optional: true,
    type:  HumanNameSchema 
    },
  "contact.$.telecom" : {
    optional: true,
    type:  ContactPointSchema 
    },
  "contact.$.address" : {
    optional: true,
    type:  AddressSchema 
    },
  "endpoint" : {
    optional: true,
    type:  Array
    },
  "endpoint.$" : {
    optional: true,
    type:  ReferenceSchema 
    },            
  "network" : {
    optional: true,
    type:  Array
    },
  "network.$" : {
    optional: true,
    type:  ReferenceSchema 
    },  
  "coverage" : {
    optional: true,
    type:  Array
    },
  "coverage.$" : {
    optional: true,
    type:  Object 
    },        
  "coverage.$.type" : {
    optional: true,
    type:  CodeableConceptSchema 
    },        
  "coverage.$.network" : {
    optional: true,
    type:  ReferenceSchema 
    },        
  "coverage.$.benefit" : {
    optional: true,
    type:  Array 
    },        
  "coverage.$.benefit.$" : {
    optional: true,
    type:  Object 
    },        
  "coverage.$.benefit.$.type" : {
    optional: true,
    type:  CodeableConceptSchema 
    },        
  "coverage.$.benefit.$.requirement" : {
    optional: true,
    type:  String 
    },        
  "coverage.$.benefit.$.limit" : {
    optional: true,
    type:  Array 
    },        
  "coverage.$.benefit.$.limit.$" : {
    optional: true,
    type:  Object 
    },        
  "coverage.$.benefit.$.limit.$.value" : {
    optional: true,
    type:  QuantitySchema 
    },        
  "coverage.$.benefit.$.limit.$.code" : {
    optional: true,
    type:  CodeableConceptSchema 
    },        
  "plan" : {
    optional: true,
    type:  Array 
    },        
  "plan.$" : {
    optional: true,
    type:  Object
    },        
  "plan.$.identifier" : {
    optional: true,
    type:  Array
    },        
  "plan.$.identifier.$" : {
    optional: true,
    type:  IdentifierSchema
    },        
  "plan.$.type" : {
    optional: true,
    type:  CodeableConceptSchema
    },        
  "plan.$.coverageArea" : {
    optional: true,
    type:  Array
    },        
  "plan.$.coverageArea.$" : {
    optional: true,
    type:  ReferenceSchema
    },        
  "plan.$.network" : {
    optional: true,
    type:  Array
    },        
  "plan.$.network.$" : {
    optional: true,
    type:  ReferenceSchema
    },        
  "plan.$.generalCost" : {
    optional: true,
    type:  Array
    },        
  "plan.$.generalCost.$" : {
    optional: true,
    type:  Object
    },        
  "plan.$.generalCost.$.type" : {
    optional: true,
    type:  CodeableConceptSchema
    },        
  "plan.$.generalCost.$.groupSize" : {
    optional: true,
    type:  Number
    },        
  "plan.$.generalCost.$.cost" : {
    optional: true,
    type:  MoneySchema
    },        
  "plan.$.generalCost.$.comment" : {
    optional: true,
    type:  String
    },        
  "plan.$.specificCost" : {
    optional: true,
    type:  Array
    },        
  "plan.$.specificCost.$" : {
    optional: true,
    type:  Object
    },        
  "plan.$.specificCost.$.category" : {
    optional: true,
    type:  CodeableConceptSchema
    },        
  "plan.$.specificCost.$.benefit" : {
    optional: true,
    type:  Array
    },        
  "plan.$.specificCost.$.benefit.$" : {
    optional: true,
    type:  Object
    },        
  "plan.$.specificCost.$.benefit.$.type" : {
    optional: true,
    type:  CodeableConceptSchema
    },        
  "plan.$.specificCost.$.benefit.$.cost" : {
    optional: true,
    type:  Array
    },        
  "plan.$.specificCost.$.benefit.$.cost.$" : {
    optional: true,
    type:  Object
    },        
  "plan.$.specificCost.$.benefit.$.cost.$.type" : {
    optional: true,
    type:  CodeableConceptSchema
    },        
  "plan.$.specificCost.$.benefit.$.cost.$.applicability" : {
    optional: true,
    type:  CodeableConceptSchema
    },        
  "plan.$.specificCost.$.benefit.$.cost.$.qualifiers" : {
    optional: true,
    type:  Array
    },        
  "plan.$.specificCost.$.benefit.$.cost.$.qualifiers.$" : {
    optional: true,
    type:  CodeableConceptSchema
    },        
  "plan.$.specificCost.$.benefit.$.cost.$.value" : {
    optional: true,
    type:  QuantitySchema
    }
});

// InsurancePlans.attachSchema(InsurancePlanSchema);

export default { InsurancePlan, InsurancePlans, InsurancePlanSchema };