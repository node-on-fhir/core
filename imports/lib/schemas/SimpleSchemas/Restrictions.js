import { get } from 'lodash';
import validator from 'validator';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import { BaseSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';


import { ConsentSchema } from './Consents';

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
let Restriction = BaseModel.extend();


export let Restrictions = new Mongo.Collection('Restrictions');

//Assign a collection so the object knows how to perform CRUD operations
Restriction.prototype._collection = Restrictions;



//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Restrictions._transform = function (document) {
  return new Restriction(document);
};

let RestrictionSchema = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Restriction"
  }
});

RestrictionSchema.extend(ConsentSchema)

RestrictionSchema.omit('identifier')
RestrictionSchema.omit('patient')
RestrictionSchema.omit('performer')
RestrictionSchema.omit('organization')
RestrictionSchema.omit('source')
RestrictionSchema.omit('policyRule')
RestrictionSchema.omit('verification')
RestrictionSchema.omit('provision.period')
RestrictionSchema.omit('provision.class')
RestrictionSchema.omit('provision.code')
RestrictionSchema.omit('provision.dataPeriod')
RestrictionSchema.omit('provision.data')
RestrictionSchema.omit('provision.provision')

// Restrictions.attachSchema(RestrictionSchema);

export default { Restriction, Restrictions, RestrictionSchema };