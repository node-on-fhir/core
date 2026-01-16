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
  let ServerStat = BaseModel.extend();
  
  export let ServerStats = new Mongo.Collection('ServerStats');
  
  // //Assign a collection so the object knows how to perform CRUD operations
  ServerStat.prototype._collection = ServerStats;
  
  // Create a persistent data store for addresses to be stored.
  // HL7.Resources.ServerStats = new Mongo.Collection('HL7.Resources.ServerStats');
  
  
  
  
  export { ServerStats }