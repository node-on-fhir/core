// imports/lib/schemas/SimpleSchemas/EpisodeOfCares.js

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

import { BaseSchema, DomainResourceSchema, IdentifierSchema, ReferenceSchema, ContactPointSchema, AddressSchema, SignatureSchema, CodeableConceptSchema, QuantitySchema, PeriodSchema, RangeSchema, Code } from 'meteor/clinical:hl7-resource-datatypes';


// create the object using our BaseModel
let EpisodeOfCare = BaseModel.extend();


export let EpisodeOfCares = new Mongo.Collection('EpisodeOfCares');

//Assign a collection so the object knows how to perform CRUD operations
EpisodeOfCare.prototype._collection = EpisodeOfCares;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
EpisodeOfCares._transform = function (document) {
  return new EpisodeOfCare(document);
};


let EpisodeOfCareR4 = new SimpleSchema({
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
    defaultValue: "EpisodeOfCare"
  },
  "identifier" : {
    optional: true,
    type: Array
  },
  "identifier.$" : {
    optional: true,
    type: IdentifierSchema
  },
  "extension" : {
    optional: true,
    type: Array
  },
  "extension.$" : {
    optional: true,
    blackbox: true,
    type: Object
  },
  "modifierExtension" : {
    optional: true,
    type: Array
  },
  "modifierExtension.$" : {
    optional: true,
    blackbox: true,
    type: Object
  },
  "status" : {
    type: Code,
    allowedValues: ['planned', 'waitlist', 'active', 'onhold', 'finished', 'cancelled', 'entered-in-error']
  },
  "statusHistory" : {
    optional: true,
    type: Array
  },
  "statusHistory.$" : {
    optional: true,
    blackbox: true,
    type: Object
  },
  "type" : {
    optional: true,
    type: Array
  },
  "type.$" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "diagnosis" : {
    optional: true,
    type: Array
  },
  "diagnosis.$" : {
    optional: true,
    blackbox: true,
    type: Object
  },
  "patient" : {
    type: ReferenceSchema
  },
  "managingOrganization" : {
    optional: true,
    type: ReferenceSchema
  },
  "period" : {
    optional: true,
    type: PeriodSchema
  },
  "referralRequest" : {
    optional: true,
    type: Array
  },
  "referralRequest.$" : {
    optional: true,
    type: ReferenceSchema
  },
  "careManager" : {
    optional: true,
    type: ReferenceSchema
  },
  "team" : {
    optional: true,
    type: Array
  },
  "team.$" : {
    optional: true,
    type: ReferenceSchema
  },
  "account" : {
    optional: true,
    type: Array
  },
  "account.$" : {
    optional: true,
    type: ReferenceSchema
  },
  "contained" : {
    optional: true,
    type: Array
  },
  "contained.$" : {
    optional: true,
    blackbox: true,
    type: Object
  }
});


let EpisodeOfCareSchema = EpisodeOfCareR4;

BaseSchema.extend(EpisodeOfCareSchema);
DomainResourceSchema.extend(EpisodeOfCareSchema);

export default { EpisodeOfCare, EpisodeOfCares, EpisodeOfCareSchema, EpisodeOfCareR4 };
