// /imports/lib/schemas/SimpleSchemas/MessageHeaders.js

import SimpleSchema from 'simpl-schema';
import { get } from 'lodash';
import validator from 'validator';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import { BaseSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, CodeableConceptSchema, CodingSchema, AnnotationSchema } from 'meteor/clinical:hl7-resource-datatypes';


// create the object using our BaseModel
let MessageHeader = BaseModel.extend();

export let MessageHeaders = new Mongo.Collection('MessageHeaders');

//Assign a collection so the object knows how to perform CRUD operations
MessageHeader.prototype._collection = MessageHeaders;



//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
MessageHeaders._transform = function (document) {
  return new MessageHeader(document);
};


let MessageHeaderR4 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "MessageHeader"
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
  // Event[x] - Required (1..1) - Code for the event this message represents
  "eventCoding" : {
    optional: true,
    type: CodingSchema
  },
  "eventUri" : {
    optional: true,
    type: String
  },
  // Destination - Message destination application(s)
  "destination" : {
    optional: true,
    type: Array
  },
  "destination.$" : {
    optional: true,
    type: Object
  },
  "destination.$.name" : {
    optional: true,
    type: String
  },
  "destination.$.target" : {
    optional: true,
    type: ReferenceSchema
  },
  "destination.$.endpoint" : {
    optional: true,
    type: String
  },
  "destination.$.receiver" : {
    optional: true,
    type: ReferenceSchema
  },
  // Sender - Real world sender of the message
  "sender" : {
    optional: true,
    type: ReferenceSchema
  },
  // Source - Required (1..1) - Message source application
  "source" : {
    type: Object
  },
  "source.name" : {
    optional: true,
    type: String
  },
  "source.software" : {
    optional: true,
    type: String
  },
  "source.version" : {
    optional: true,
    type: String
  },
  "source.contact" : {
    optional: true,
    type: ContactPointSchema
  },
  "source.endpoint" : {
    type: String
  },
  // Responsible party (organization or individual)
  "responsible" : {
    optional: true,
    type: ReferenceSchema
  },
  // Reason for event occurrence
  "reason" : {
    optional: true,
    type: CodeableConceptSchema
  },
  // Response to a message
  "response" : {
    optional: true,
    type: Object
  },
  "response.identifier" : {
    type: String
  },
  "response.code" : {
    type: String,
    allowedValues: ['ok', 'transient-error', 'fatal-error']
  },
  "response.details" : {
    optional: true,
    type: ReferenceSchema
  },
  // Focus - The actual content of the message
  "focus" : {
    optional: true,
    type: Array
  },
  "focus.$" : {
    optional: true,
    type: ReferenceSchema
  },
  // Definition of this message
  "definition" : {
    optional: true,
    type: String  // Canonical URL
  },
  // Notes and comments
  "note" : {
    optional: true,
    type: Array
  },
  "note.$" : {
    optional: true,
    type: AnnotationSchema
  }
});


let MessageHeaderSchema = MessageHeaderR4;

BaseSchema.extend(MessageHeaderR4);
DomainResourceSchema.extend(MessageHeaderR4);

// MessageHeaders.attachSchema(MessageHeaderR4);


MessageHeader.prototype.toFhir = function(){
  console.log('MessageHeader.toFhir()');

  return EJSON.stringify(this.name);
}

/**
 * @summary Search the MessageHeaders collection for those sent by a specific userId.
 * @memberOf MessageHeaders
 * @name findMessageHeadersSentByUserId
 * @version 1.2.3
 * @returns array of communications
 * @example
 * ```js
 *  let communications = MessageHeaders.findMessageHeadersSentByUserId(Meteor.userId());
 *  let communication = communications[0];
 * ```
 */

MessageHeaders.findMessageHeadersSentByUserId = function (userId) {
  process.env.TRACE && console.log("MessageHeaders.findMessageHeadersSentByUserId()");
  return MessageHeaders.find({'sender.value': userId});
};

/**
 * @summary Search the MessageHeaders collection for those sent by a specific userId.
 * @memberOf MessageHeaders
 * @name findMessageHeadersSentToUserId
 * @version 1.2.3
 * @returns array of communications
 * @example
 * ```js
 *  let communications = MessageHeaders.findMessageHeadersSentByUserId(Meteor.userId());
 *  let communication = communications[0];
 * ```
 */
MessageHeaders.findMessageHeadersSentToUserId = function (userId) {
  process.env.TRACE && console.log("MessageHeaders.findMessageHeadersSentToUserId()");
  return MessageHeaders.find({'recipient.value': userId});
};


/**
 * @summary Search the MessageHeaders collection for a specific Meteor.userId().
 * @memberOf MessageHeaders
 * @name findMrn
 * @version 1.2.3
 * @returns {Boolean}
 * @example
 * ```js
 *  let communications = MessageHeaders.findMrn('12345').fetch();
 * ```
 */
MessageHeaders.findConversation = function (conversationId, sort=1) {
  process.env.TRACE && console.log("MessageHeaders.findMrn()");  
  return MessageHeaders.find(
    { 'partOf.identifier.value': conversationId}, 
    { 'sort': { 'received': sort } });
};

/**
 * @summary Search the MessageHeaders collection for a specific query.
 * @memberOf MessageHeaders
 */

MessageHeaders.fetchBundle = function (query, parameters, callback) {
  process.env.TRACE && console.log("MessageHeaders.fetchBundle()");  
  var communicationArray = MessageHeaders.find(query, parameters, callback).map(function(communication){
    communication.id = communication._id;
    delete communication._document;
    return communication;
  });

  // console.log("communicationArray", communicationArray);

  var result = Bundle.generate(communicationArray);

  // console.log("result", result.entry[0]);

  return result;
};




// MessageHeaders.prototype.insertUnique = function(record){
//   console.log('MessageHeaders.prototype.insertUnique');

//   if(MessageHeaders.findConversation(record._id)){
//     MessageHeaders.insert(record)    
//   }
// }

MessageHeaders.insertUnique = function (record) {
  console.log("MessageHeaders.insertUnique()");
  console.log("MessageHeaders.findOne(record._id)", MessageHeaders.findOne(record._id));

  if(!MessageHeaders.findOne(record._id)){
    let collectionConfig = {};
    if(Meteor.isClient){
      collectionConfig = { validate: false, filter: false }
    }
    let communicationId = MessageHeaders.insert(record, collectionConfig);    
    console.log('MessageHeader created: ' + communicationId);
    return communicationId;
  }
};


export default { MessageHeader, MessageHeaders, MessageHeaderR4, MessageHeaderSchema };