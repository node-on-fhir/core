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
import { BaseSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, SignatureSchema, AttachmentSchema, CodingSchema, QuantitySchema } from 'meteor/clinical:hl7-resource-datatypes';




// create the object using our BaseModel
let QuestionnaireResponse = BaseModel.extend();

export let QuestionnaireResponses = new Mongo.Collection('QuestionnaireResponses');

//Assign a collection so the object knows how to perform CRUD operations
QuestionnaireResponse.prototype._collection = QuestionnaireResponses;




//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
QuestionnaireResponses._transform = function (document) {
  return new QuestionnaireResponse(document);
};



// R4
let QuestionnaireResponseSchema = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "QuestionnaireResponse"
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
    type:  Array
    },
  "basedOn.$" : {
    optional: true,
    type:  ReferenceSchema 
    },
  "partOf" : {
    optional: true,
    type:  Array
    },
  "partOf.$" : {
    optional: true,
    type:  ReferenceSchema 
    },
  "questionnaire" : {
    optional: true,
    type: String 
    },
  "status" : {
    optional: true,
    type: String
    },
  "subject" : {
    optional: true,
    type: ReferenceSchema // Any
    },
  "encounter" : {
    optional: true,
    type: ReferenceSchema //(Encounter)
    },
  "author" : {
    optional: true,
    type: ReferenceSchema // (Device|Practitioner|Patient|RelatedPerson)
    },
  "authored" : {
    optional: true,
    type: Date
    },
  "source" : {
    optional: true,
    type: ReferenceSchema //(Patient|Practitioner|RelatedPerson)
    },
  "item" : {
    optional: true,
    type: Array
    },
  "item.$" : {
    optional: true,
    type: Object
    },
  "item.$.linkId" : {
    optional: true,
    type: String
    },
  "item.$.definition" : {
    optional: true,
    type: String
    },
  "item.$.text" : {
    optional: true,
    type: String
    },
  "item.$.answer" : {
    optional: true,
    type: Array
    },
  "item.$.answer.$" : {
    optional: true,
    type: Object
    },
  "item.$.answer.$.valueBoolean" : {
    optional: true,
    type: Boolean
    },
  "item.$.answer.$.valueDecimal" : {
    optional: true,
    type: Number
    },
  "item.$.answer.$.valueInteger" : {
    optional: true,
    type: Number
    },
  "item.$.answer.$.valueDate" : {
    optional: true,
    type: Date
    },
  "item.$.answer.$.valueDateTime" : {
    optional: true,
    type: Date
    },
  "item.$.answer.$.valueTime" : {
    optional: true,
    type: Date
    },
  "item.$.answer.$.valueString" : {
    optional: true,
    type: String
    },
  "item.$.answer.$.valueUri" : {
    optional: true,
    type: String
    },
  "item.$.answer.$.valueAttachment" : {
    optional: true,
    type: AttachmentSchema
    },
  "item.$.answer.$.valueCoding" : {
    optional: true,
    type: CodingSchema
    },
  "item.$.answer.$.valueQuantity" : {
    optional: true,
    type: QuantitySchema
    },
  "item.$.answer.$.valueReference" : {
    optional: true,
    type: ReferenceSchema
    },
  "item.$.item" : {
    optional: true,
    type: Array
    },
  "item.$.item.$" : {
    optional: true,
    type: Object,
    blackbox: true
    }
});

BaseSchema.extend(QuestionnaireResponseSchema);
DomainResourceSchema.extend(QuestionnaireResponseSchema);

// QuestionnaireResponses.attachSchema(QuestionnaireResponseSchema);

QuestionnaireResponses.insertUnique = function (record) {
  console.log("QuestionnaireResponses.insertUnique()");

  if(!QuestionnaireResponses.findOne(record._id)){    
    let collectionConfig = {};
    if(Meteor.isClient){
      collectionConfig = { validate: false, filter: false }
    }
    let questionnaireResponseId = QuestionnaireResponses.insert(record, collectionConfig);    
    console.log('QuestionnaireResponses created: ' + questionnaireResponseId);
    return questionnaireResponseId;
  }
};



export default { QuestionnaireResponse, QuestionnaireResponses, QuestionnaireResponseSchema };

if (typeof global !== 'undefined') {
  global.QuestionnaireResponses = QuestionnaireResponses;
}