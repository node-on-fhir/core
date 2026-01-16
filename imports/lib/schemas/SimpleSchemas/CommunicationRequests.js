
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
import { BaseSchema, AnnotationSchema, DomainResourceSchema, CodeableConceptSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';


// create the object using our BaseModel
let CommunicationRequest = BaseModel.extend();

export let CommunicationRequests = new Mongo.Collection('CommunicationRequests');

//Assign a collection so the object knows how to perform CRUD operations
CommunicationRequest.prototype._collection = CommunicationRequests;

// Create a persistent data store for addresses to be stored.
// HL7.Resources.CommunicationRequests = new Mongo.Collection('HL7.Resources.CommunicationRequests');
// if(typeof CommunicationRequests === 'undefined'){
//   // if(Package['clinical:autopublish']){
//   //   CommunicationRequests = new Mongo.Collection('CommunicationRequests');
//   // } else if(Package['clinical:desktop-publish']){
//   //   CommunicationRequests = new Mongo.Collection('CommunicationRequests');
//   // } else {
//   //   CommunicationRequests = new Mongo.Collection('CommunicationRequests', {connection: null});
//   // }
//   CommunicationRequests = new Mongo.Collection('CommunicationRequests');
// }



//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
CommunicationRequests._transform = function (document) {
  return new CommunicationRequest(document);
};







let CommunicationRequestR4 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "CommunicationRequest"
  },
  "_id" : {
    optional: true,
    type: String
    },
  "id" : {
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

  "basedOn" : {
    optional: true,
    type:  Array
    },
  "basedOn.$" : {
    optional: true,
    type:  ReferenceSchema 
    },
  "replaces" : {
    optional: true,
    type:  Array
    },
  "replaces.$" : {
    optional: true,
    type:  ReferenceSchema 
    },
  "groupIdentifier" : {
    optional: true,
    type:  IdentifierSchema
    },
  "status" : {
    allowedValues: ["draft" , "active" , "on-hold" , "revoked" , "completed" , "entered-in-error" , "unknown"],
    defaultValue: "active",
    type:  String
    },
  "statusReason" : {
    optional: true,
    type:  CodeableConceptSchema
    },
  "category" : {
    optional: true,
    type:  Array
    },
  "category.$" : {
    optional: true,
    type:  CodeableConceptSchema 
    },
  "priority" : {
    optional: true,
    type:  String
    },
  "doNotPerform" : {
    optional: true,
    type:  Boolean
    },
  "medium" : {
    optional: true,
    type:  Array
    },
  "medium.$" : {
    optional: true,
    type: CodeableConceptSchema
    },
  "subject" : {
    optional: true,
    type:  Array
    },
  "subject.$" : {
    optional: true,
    type: ReferenceSchema
    },
  "about" : {
    optional: true,
    type:  Array
    },
  "about.$" : {
    optional: true,
    type: ReferenceSchema
    },
  "encounter" : {
    optional: true,
    type:  ReferenceSchema
    },
  "payload" : {
    optional: true,
    type:  Array
    },
  "payload.$" : {
    optional: true,
    blackbox: true,
    type: Object
    },
  "occurenceDateTime" : {
    optional: true,
    type:  Date
    },
  "occurencePeriod" : {
    optional: true,
    type:  PeriodSchema
    },
  "authoredOn" : {
    optional: true,
    type:  Date
    },
  "requester" : {
    optional: true,
    type:  ReferenceSchema
    },
  "recipient" : {
    optional: true,
    type:  Array
    },
  "recipient.$" : {
    optional: true,
    type: ReferenceSchema
    },
  "sender" : {
    optional: true,
    type:  ReferenceSchema
    },
  "reasonCode" : {
    optional: true,
    type:  Array
    },
  "reasonCode.$" : {
    optional: true,
    type: CodeableConceptSchema
    },
  "reasonReference" : {
    optional: true,
    type:  Array
    },
  "reasonReference.$" : {
    optional: true,
    type: ReferenceSchema
    },
  "node" : {
    optional: true,
    type:  Array
    },
  "node.$" : {
    optional: true,
    type: AnnotationSchema
    }
});


let CommunicationRequestSchema = CommunicationRequestR4;

BaseSchema.extend(CommunicationRequestR4);
DomainResourceSchema.extend(CommunicationRequestR4);

// CommunicationRequests.attachSchema(CommunicationRequestR4);


CommunicationRequest.prototype.toFhir = function(){
  console.log('CommunicationRequest.toFhir()');

  return EJSON.stringify(this.name);
}

/**
 * @summary Search the CommunicationRequests collection for those sent by a specific userId.
 * @memberOf CommunicationRequests
 * @name findCommunicationRequestsSentByUserId
 * @version 1.2.3
 * @returns array of communications
 * @example
 * ```js
 *  let communications = CommunicationRequests.findCommunicationRequestsSentByUserId(Meteor.userId());
 *  let communication = communications[0];
 * ```
 */

CommunicationRequests.findCommunicationRequestsSentByUserId = function (userId) {
  process.env.TRACE && console.log("CommunicationRequests.findCommunicationRequestsSentByUserId()");
  return CommunicationRequests.find({'sender.value': userId});
};

/**
 * @summary Search the CommunicationRequests collection for those sent by a specific userId.
 * @memberOf CommunicationRequests
 * @name findCommunicationRequestsSentToUserId
 * @version 1.2.3
 * @returns array of communications
 * @example
 * ```js
 *  let communications = CommunicationRequests.findCommunicationRequestsSentByUserId(Meteor.userId());
 *  let communication = communications[0];
 * ```
 */
CommunicationRequests.findCommunicationRequestsSentToUserId = function (userId) {
  process.env.TRACE && console.log("CommunicationRequests.findCommunicationRequestsSentToUserId()");
  return CommunicationRequests.find({'recipient.value': userId});
};


/**
 * @summary Search the CommunicationRequests collection for a specific Meteor.userId().
 * @memberOf CommunicationRequests
 * @name findMrn
 * @version 1.2.3
 * @returns {Boolean}
 * @example
 * ```js
 *  let communications = CommunicationRequests.findMrn('12345').fetch();
 * ```
 */
CommunicationRequests.findConversation = function (conversationId, sort=1) {
  process.env.TRACE && console.log("CommunicationRequests.findMrn()");  
  return CommunicationRequests.find(
    { 'partOf.identifier.value': conversationId}, 
    { 'sort': { 'received': sort } });
};

/**
 * @summary Search the CommunicationRequests collection for a specific query.
 * @memberOf CommunicationRequests
 */

CommunicationRequests.fetchBundle = function (query, parameters, callback) {
  process.env.TRACE && console.log("CommunicationRequests.fetchBundle()");  
  var communicationArray = CommunicationRequests.find(query, parameters, callback).map(function(communication){
    communication.id = communication._id;
    delete communication._document;
    return communication;
  });

  // console.log("communicationArray", communicationArray);

  var result = Bundle.generate(communicationArray);

  // console.log("result", result.entry[0]);

  return result;
};




// CommunicationRequests.prototype.insertUnique = function(record){
//   console.log('CommunicationRequests.prototype.insertUnique');

//   if(CommunicationRequests.findConversation(record._id)){
//     CommunicationRequests.insert(record)    
//   }
// }

CommunicationRequests.insertUnique = function (record) {
  console.log("CommunicationRequests.insertUnique()");
  console.log("CommunicationRequests.findOne(record._id)", CommunicationRequests.findOne(record._id));

  if(!CommunicationRequests.findOne(record._id)){
    let collectionConfig = {};
    if(Meteor.isClient){
      collectionConfig = { validate: false, filter: false }
    }
    let communicationId = CommunicationRequests.insert(record, collectionConfig);    
    console.log('CommunicationRequest created: ' + communicationId);
    return communicationId;
  }
};


export { CommunicationRequest, CommunicationRequestStu3, CommunicationRequestR4, CommunicationRequestSchema };