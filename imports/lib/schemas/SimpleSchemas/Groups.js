
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
let Group = BaseModel.extend();

export let Groups = new Mongo.Collection('Groups');

//Assign a collection so the object knows how to perform CRUD operations
Group.prototype._collection = Groups;

// // Create a persistent data store for addresses to be stored.
// // HL7.Resources.Patients = new Mongo.Collection('HL7.Resources.Patients');

// if(typeof Groups === 'undefined'){
//   if(Package['clinical:autopublish']){
//     Groups = new Mongo.Collection('Groups');
//   } else if(Package['clinical:desktop-publish']){    
//     Groups = new Mongo.Collection('Groups');
//   } else {
//     Groups = new Mongo.Collection('Groups');
//   }
// }




//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Groups._transform = function (document) {
  return new Group(document);
};



let GroupSchema = new SimpleSchema({
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
    defaultValue: "Group"
  }
});


// BaseSchema.extend(GroupSchema);
// DomainResourceSchema.extend(GroupSchema);

// Groups.attachSchema(GroupSchema);

export default { Group, Groups, GroupSchema };