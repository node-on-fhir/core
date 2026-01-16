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
import { CodingSchema, CodeableConceptSchema, BaseSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, SignatureSchema, PeriodSchema } from 'meteor/clinical:hl7-resource-datatypes';


// // create the object using our BaseModel
let StructureDefinition = BaseModel.extend();


export let StructureDefinitions = new Mongo.Collection('StructureDefinitions');

// //Assign a collection so the object knows how to perform CRUD operations
StructureDefinition.prototype._collection = StructureDefinitions;

// //Add the transform to the collection since Meteor.users is pre-defined by the accounts package
// StructureDefinitions._transform = function (document) {
//   return new StructureDefinition(document);
// };



// ===================================================

let StructureDefinitionSchemaR4 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "StructureDefinition"
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

  "url" : {
    optional: true,
    type:  String
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
  "version" : {
    optional: true,
    type:  String
  },
  "name" : {
    optional: true,
    type:  String
  },
  "title" : {
    optional: true,
    type:  String
  },
  "status" : {
    optional: true,
    type:  String
  },
  "experimental" : {
    optional: true,
    type:  Boolean
  },
  "date" : {
    optional: true,
    type:  Date
  },
  "publisher" : {
    optional: true,
    type:  String
  },
  "contact" : {
    optional: true,
    type:  Array
    },
  "contact.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
  },
  "description" : {
    optional: true,
    type:  String
  },
  "useContext" : {
    optional: true,
    type:  Array
    },
  "useContext.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
  },
  "jurisdiction" : {
    optional: true,
    type:  Array
    },
  "jurisdiction.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
  },
  "purpose" : {
    optional: true,
    type:  String
  },
  "copyright" : {
    optional: true,
    type:  String
  },
  "keyword" : {
    optional: true,
    type:  Array
    },
  "keyword.$" : {
    optional: true,
    blackbox: true,
    type:  CodingSchema 
  },
  "fhirVersion" : {
    optional: true,
    type:  String
  },
  "mapping" : {
    optional: true,
    type:  Array
    },
  "mapping.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
  },
  "mapping.$.identity" : {
    optional: true,
    type:  String
  },
  "mapping.$.uri" : {
    optional: true,
    type:  String
  },
  "mapping.$.name" : {
    optional: true,
    type:  String
  },
  "mapping.$.comment" : {
    optional: true,
    type:  String
  },
  "kind" : {
    optional: true,
    type:  String
  },
  "abstract" : {
    optional: true,
    type:  Boolean
  },
  "context" : {
    optional: true,
    type:  Array
    },
  "context.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
  },
  "context.$.type" : {
    optional: true,
    type:  String
  },
  "context.$.expression" : {
    optional: true,
    type:  String
  },
  "contextInvariant" : {
    optional: true,
    type:  Array
    },
  "contextInvariant.$" : {
    optional: true,
    blackbox: true,
    type:  String 
  },
  "type" : {
    optional: true,
    type:  String
  },
  "baseDefinition" : {
    optional: true,
    type:  String
  },
  "derivation" : {
    optional: true,
    type:  String,
    allowedValues: ['specialization', 'constraint']
  },
  "snapshot" : {
    optional: true,
    type:  Object
  },
  "snapshot.element" : {
    optional: true,
    type:  Array
  },
  "snapshot.element.$" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "differential" : {
    optional: true,
    type:  Object
  },
  "differential.element" : {
    optional: true,
    type:  Array
  },
  "differential.element.$" : {
    optional: true,
    blackbox: true,
    type:  Object
  }
});


let StructureDefinitionSchema = StructureDefinitionSchemaR4;
// StructureDefinitions.attachSchema(StructureDefinitionSchema);

export { StructureDefinitionSchema, StructureDefinitionSchemaR4 }