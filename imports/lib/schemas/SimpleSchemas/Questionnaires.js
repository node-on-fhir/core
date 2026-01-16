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


import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import { BaseSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, CodeableConceptSchema, PeriodSchema, AddressSchema, ReferenceSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';




// // create the object using our BaseModel
let Questionnaire = BaseModel.extend();

export let Questionnaires = new Mongo.Collection('Questionnaires');

//Assign a collection so the object knows how to perform CRUD operations
Questionnaire.prototype._collection = Questionnaires;

// Create a persistent data store for addresses to be stored.
// HL7.Resources.Patients = new Mongo.Collection('HL7.Resources.Patients');




// //Add the transform to the collection since Meteor.users is pre-defined by the accounts package
// Questionnaires._transform = function (document) {
//   return new Questionnaire(document);
// };



let QuestionnaireSchema = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Questionnaire"
    },
  "_id" : {
    optional: true,
    type: String
    },

  "id" : {
    optional: true,
    type: String
    },
  "meta" : {
      optional: true,
      type: Object,
      blackbox: true
      },
  "text" : {
      optional: true,
      type: Object,
      blackbox: true
      },
  "url" : {
    optional: true,
    type: String
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
  "version" : {
    optional: true,
    type: String
    },
  "status" : {
    optional: true,
    type: String
    },
  "name" : {
    optional: true,
    type: String
    },
  "title" : {
    optional: true,
    type: String
    },
  "date" : {
    optional: true,
    type: Date
    },
  "experimental" : {
    optional: true,
    type: Boolean
    },
  "publisher" : {
    optional: true,
    type: String
    },
  "contact" : {
    optional: true,
    type: Array
    },
  "contact.$" : {
    optional: true,
    type: ContactPointSchema 
    },
  "description" : {
    optional: true,
    type: String
    },
  "purpose" : {
    optional: true,
    type: String
    },
  "copyright" : {
    optional: true,
    type: String
    },
  "approvalDate" : {
    optional: true,
    type: Date
    },
  "lastReviewDate" : {
    optional: true,
    type: Date
    },
  "effectivePeriod" : {
    optional: true,
    type: PeriodSchema
    },
  "jurrisdiction" : {
    optional: true,
    type: Object
    },
  "code" : {
    optional: true,
    type: String
    },
  "item" : {
    optional: true,
    type: Array
    },
  "item.$" : {
    optional: true,
    type: Object,
    blackbox: true
    },
  "item.$.linkId" : {
    optional: true,
    type: String 
    },
  "item.$.definition" : {
    optional: true,
    type: String 
    },
  "item.$.code" : {
    optional: true,
    type: String 
    },
  "item.$.prefix" : {
    optional: true,
    type: String 
    },
  "item.$.text" : {
    optional: true,
    type: String 
    },
  "item.$.type" : {
    optional: true,
    type: String 
    },
  "item.$.enableWhen" : {
    optional: true,
    type: Array 
    },
  "item.$.enableWhen.$" : {
    optional: true,
    blackbox: true,
    type: Object 
    },
  "item.$.required" : {
    optional: true,
    type: Boolean 
    },
  "item.$.repeats" : {
    optional: true,
    type: Boolean 
    },
  "item.$.readOnly" : {
    optional: true,
    type: Boolean 
    },
  "item.$.maxLength" : {
      optional: true,
      type: Number 
      },
  "item.$.answerValueSet" : {
    optional: true,
    blackbox: true,
    type: Object 
    },
  "item.$.answerOption" : {
    optional: true,
    type: Array 
    },
  "item.$.answerOption.$" : {
    optional: true,
    blackbox: true,
    type: Object 
    },  
  "item.$.initial" : {
    optional: true,
    type: Array 
    },
  "item.$.initial.$" : {
    optional: true,
    blackbox: true,
    type: Object 
    },
  "item.$.item" : {
    optional: true,
    type: Array 
    },
  "item.$.item.$" : {
    optional: true,
    blackbox: true,
    type: Object 
    }
});

// BaseSchema.extend(QuestionnaireSchema);
// DomainResourceSchema.extend(QuestionnaireSchema);

// Questionnaires.attachSchema(QuestionnaireSchema);



export default { Questionnaire, Questionnaires, QuestionnaireSchema };

global.Questionnaires = Questionnaires;