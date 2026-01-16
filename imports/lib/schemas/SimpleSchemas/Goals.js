
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
import { AnnotationSchema, ReferenceSchema, BaseSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';





// create the object using our BaseModel
let Goal = BaseModel.extend();

export let Goals = new Mongo.Collection('Goals');

//Assign a collection so the object knows how to perform CRUD operations
Goal.prototype._collection = Goals;

//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Goals._transform = function (document) {
  return new Goal(document);
};



let GoalSchema = new SimpleSchema({
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
    defaultValue: "Goal"
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
  "description" :  {
    optional: true,
    type: String
  },
  "livecycleStatus" :  {
    optional: true,
    allowedValues: ["proposed", "planned" , "accepted" , "active" , "on-hold" , "completed" , "cancelled" , "entered-in-error" , "rejected"],
    type: Code
  },
  "achievementStatus" :  {
    optional: true,
    allowedValues: ["in-progress" , "improving" , "worsening" , "no-change" , "achieved" , "sustaining" , "not-achieved" , "no-progress" , "not-attainable"],
    type: Code
  },
  "priority" :  {
    optional: true,
    type: CodeableConceptSchema
  },
  "description" :  {
    optional: true,
    type: CodeableConceptSchema
  },
  "subject" :  {
    optional: true,
    type: ReferenceSchema
  },
  "startDate" :  {
    optional: true,
    type: Date
  },
  "startCodeableConcept" :  {
    optional: true,
    type: CodeableConceptSchema
  },

  "target" :  {
    optional: true,
    type: Array
  },
  "target.$" :  {
    optional: true,
    blackbox: true,
    type: Object
  },
  "statusDate" :  {
    optional: true,
    type: Date
  },
  "statusReason" :  {
    optional: true,
    type: String
  },
  "expressedBy" :  {
    optional: true,
    type: ReferenceSchema
  },

  "addresses" :  {
    optional: true,
    type: Array
  },
  "addresses.$" :  {
    optional: true,
    blackbox: true,
    type: Object
  },

  "note" :  {
    optional: true,
    type: Array
  },
  "note.$" :  {
    optional: true,
    blackbox: true,
    type: AnnotationSchema
  },

  "outcomeCode" :  {
    optional: true,
    type: Array
  },
  "outcomeCode.$" :  {
    optional: true,
    blackbox: true,
    type: CodeableConceptSchema
  },
  "outcomeReference" :  {
    optional: true,
    type: Array
  },
  "outcomeReference.$" :  {
    optional: true,
    blackbox: true,
    type: ReferenceSchema
  }
});


// BaseSchema.extend(GoalSchema);
// DomainResourceSchema.extend(GoalSchema);

// Goals.attachSchema(GoalSchema);

export default { Goal, Goals, GoalSchema };