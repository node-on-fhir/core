// imports/lib/schemas/SimpleSchemas/MessageHeaders.js
// Collection definition for MessageHeader resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/MessageHeader.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let MessageHeader = BaseModel.extend();

export let MessageHeaders = createFhirCollection('MessageHeader', 'MessageHeaders');

//Assign a collection so the object knows how to perform CRUD operations
MessageHeader.prototype._collection = MessageHeaders;

//Add the transform to the collection
MessageHeaders._transform = function (document) {
  return new MessageHeader(document);
};

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


export default { MessageHeader, MessageHeaders };
