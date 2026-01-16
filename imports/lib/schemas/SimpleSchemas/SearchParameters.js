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
let SearchParameter = BaseModel.extend();

export let SearchParameters = new Mongo.Collection('SearchParameters');

// //Assign a collection so the object knows how to perform CRUD operations
SearchParameter.prototype._collection = SearchParameters;

// Create a persistent data store for addresses to be stored.
// HL7.Resources.SearchParameters = new Mongo.Collection('HL7.Resources.SearchParameters');



// //Add the transform to the collection since Meteor.users is pre-defined by the accounts package
// SearchParameters._transform = function (document) {
//   return new SearchParameter(document);
// };



// ===================================================

let SearchParameterSchemaR4 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "SearchParameter"
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
  "code" : {
    optional: true,
    type:  String
  },
  "base" : {
    optional: true,
    type:  Array
  },
  "base.$" : {
    optional: true,
    type:  String
  },
  "type" : {
    optional: true,
    type:  String
  },
  "expression" : {
    optional: true,
    type:  String
  },
  "xpath" : {
    optional: true,
    type:  String
  },
  "xpathUsage" : {
    optional: true,
    type:  String
  },
  "target" : {
    optional: true,
    type:  Array
  },
  "target" : {
    optional: true,
    type:  String
  },
  "multipleOr" : {
    optional: true,
    type:  Boolean
  },
  "multipleAnd" : {
    optional: true,
    type:  Boolean
  },
  "comparator" : {
    optional: true,
    type:  Array
  },
  "comparator" : {
    optional: true,
    type:  String
  },
  "modifier" : {
    optional: true,
    type:  Array
  },
  "modifier" : {
    optional: true,
    type:  String
  },
  "chain" : {
    optional: true,
    type:  Array
  },
  "chain" : {
    optional: true,
    type:  String
  },
  "component" : {
    optional: true,
    type:  Array
  },
  "component" : {
    optional: true,
    blackbox: true,
    type:  Object
  }
});


let SearchParameterSchema = SearchParameterSchemaR4;
// SearchParameters.attachSchema(SearchParameterSchema);

export { SearchParameterSchema, SearchParameterSchemaR4 }