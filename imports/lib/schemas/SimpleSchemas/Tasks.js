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
import { CodeableConceptSchema, BaseSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, SignatureSchema, PeriodSchema } from 'meteor/clinical:hl7-resource-datatypes';


// // create the object using our BaseModel
let Task = BaseModel.extend();


export let Tasks = new Mongo.Collection('Tasks');

// //Assign a collection so the object knows how to perform CRUD operations
Task.prototype._collection = Tasks;



// //Add the transform to the collection since Meteor.users is pre-defined by the accounts package
// Tasks._transform = function (document) {
//   return new Task(document);
// };



// ===================================================

let TaskSchemaR4 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Task"
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
  "contained" : {
    optional: true,
    type:  Array
    },
  "contained.$" : {
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
    blackbox: true,
    type:  Object 
  },
  "groupIdentifier" : {
    optional: true,
    blackbox: true,
    type:  Object  
  },
  "focus" : {
    optional: true,
    blackbox: true,
    type:  Object  
  },
  "description" : {
    optional: true,
    type: String
  },
  "status" : {
    optional: true,
    allowedValues: ['draft', 'requested', 'received', 'accepted', 'rejected', 'ready', 'cancelled', 'in-progress', 'on-hold', 'failed', 'completed', 'entered-in-error'],
    type: String
  },
  "intent" : {
    optional: true,
    allowedValues: ['unknown', 'proposal', 'plan', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option'],
    type: String    
  },  
  "priority" : {
    optional: true,
    allowedValues: ['routine', 'urgent', 'asap', 'stat'],
    type: String    
  },  
  "code" : {
    optional: true,
    type:  Array
    },
  "code.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
  },
  "for" : {
    optional: true,
    type:  ReferenceSchema  
  },
  "encounter" : {
    optional: true,
    type:  ReferenceSchema  
  },
  "executionPeriod" : {
    optional: true,
    type:  PeriodSchema  
  },
  "authoredOn" : {
    optional: true,
    type:  Date  
  },
  "lastModified" : {
    optional: true,
    type:  Date  
  },
  "requestor" : {
    optional: true,
    type:  ReferenceSchema  
  },
  "owner" : {
    optional: true,
    type:  ReferenceSchema  
  },
  "note" : {
    optional: true,
    type:  Array
    },
  "note.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
  },
  "note.$.text" : {
    optional: true,
    type:  String 
  },
  "relevantHistory" : {
    optional: true,
    type:  Array  
  },
  "relevantHistory.$" : {
    optional: true,
    type:  ReferenceSchema  
  },
  "input" : {
    optional: true,
    type:  Array  
  },
  "input.$" : {
    optional: true,
    blackbox: true,
    type:  Object  
  },
  "output" : {
    optional: true,
    type:  Array  
  },
  "output.$" : {
    optional: true,
    blackbox: true,
    type:  Object  
  },

  "restriction" : {
    optional: true,
    blackbox: true,
    type:  Object 
  },
});


let TaskSchema = TaskSchemaR4;
// Tasks.attachSchema(TaskSchema);

export { TaskSchema, TaskSchemaR4 }