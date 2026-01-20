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
import { BaseSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';


// // create the object using our BaseModel
let ExplanationOfBenefit = BaseModel.extend();



// Create a persistent data store for addresses to be stored.
// HL7.Resources.ExplanationOfBenefits = new Mongo.Collection('HL7.Resources.ExplanationOfBenefits');
export let ExplanationOfBenefits = new Mongo.Collection('ExplanationOfBenefits');

// //Assign a collection so the object knows how to perform CRUD operations
ExplanationOfBenefit.prototype._collection = ExplanationOfBenefits;


// //Add the transform to the collection since Meteor.users is pre-defined by the accounts package
ExplanationOfBenefits._transform = function (document) {
  return new ExplanationOfBenefit(document);
};



// ===================================================

let ExplanationOfBenefitsSchemaR4 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "ExplanationOfBenefit"
  },
  "_id" : {
    optional: true,
    type:  String
    },
  "id" : {
    optional: true,
    type:  String
    },
  "meta" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "text" : {
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
  "modifierExtension" : {
    optional: true,
    type:  Array
    },
  "modifierExtension.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },
  "status" : {
    optional: true,
    allowedValues: ['active', 'cancelled', 'draft', 'entered-in-error'],
    type: String
  },
  "type" : {
    optional: true,
    type:  CodeableConceptSchema
  },
  "subType" : {
    optional: true,
    type:  CodeableConceptSchema
  },
  "use" : {
    optional: true,
    type:  String
  },
  "patient" : {
    optional: true,
    type:  ReferenceSchema
  },
  "billablePeriod" : {
    optional: true,
    type:  PeriodSchema
  },
  "created" : {
    optional: true,
    type:  Date
  },
  "enterer" : {
    optional: true,
    type:  ReferenceSchema
  },
  "insurer" : {
    optional: true,
    type:  ReferenceSchema
  },
  "provider" : {
    optional: true,
    type:  ReferenceSchema
  },
  "priority" : {
    optional: true,
    type:  CodeableConceptSchema
  },
  "fundsReserveRequested" : {
    optional: true,
    type:  CodeableConceptSchema
  },
  "fundsReserve" : {
    optional: true,
    type:  CodeableConceptSchema
  },
  "related" : {
    optional: true,
    type:  Array
  },
  "related.$" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "prescription" : {
    optional: true,
    type:  ReferenceSchema
  },
  "payee" : {
    optional: true,
    type:  Object
  },
  "payee.type" : {
    optional: true,
    type:  CodeableConceptSchema
  },
  "payee.party" : {
    optional: true,
    type:  ReferenceSchema
  },
  "facility" : {
    optional: true,
    type:  ReferenceSchema
  },
  "claim" : {
    optional: true,
    type:  ReferenceSchema
  },
  "claimResponse" : {
    optional: true,
    type:  ReferenceSchema
  },
  "outcome" : {
    optional: true,
    type:  String
  },
  "disposition" : {
    optional: true,
    type:  String
  },
  "preAuthRef" : {
    optional: true,
    type:  Array
  },
  "preAuthRef.$" : {
    optional: true,
    type:  String
  },
  "preAuthRefPeriod" : {
    optional: true,
    type:  Array
  },
  "preAuthRefPeriod.$" : {
    optional: true,
    type:  PeriodSchema
  },
  "careTeam" : {
    optional: true,
    type:  Array
  },
  "careTeam.$" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "supportingInfo" : {
    optional: true,
    type:  Array
  },
  "supportingInfo.$" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "diagnosis" : {
    optional: true,
    type:  Array
  },
  "diagnosis.$" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "procedure" : {
    optional: true,
    type:  Array
  },
  "procedure.$" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "insurance" : {
    optional: true,
    type:  Array
  },
  "insurance.$" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "accident" : {
    optional: true,
    type:  Array
  },
  "accident.$" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "item" : {
    optional: true,
    type:  Array
  },
  "item.$" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "addItem" : {
    optional: true,
    type:  Array
  },
  "addItem.$" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "adjudication" : {
    optional: true,
    type:  Array
  },
  "adjudication.$" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "total" : {
    optional: true,
    type:  Array
  },
  "total.$" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "payment" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "formCode" : {
    optional: true,
    type:  CodeableConceptSchema
  },
  "processNote" : {
    optional: true,
    type:  Array
  },
  "processNote.$" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "benefitPeriod" : {
    optional: true,
    type:  PeriodSchema
  },
  "benefitBalance" : {
    optional: true,
    type:  Array
  },
  "benefitBalance.$" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
});


let ExplanationOfBenefitsSchema = ExplanationOfBenefitsSchemaR4;
// ExplanationOfBenefits.attachSchema(ExplanationOfBenefitsSchema);

export { ExplanationOfBenefitsSchema, ExplanationOfBenefitsSchemaR4 }