// imports/lib/schemas/SimpleSchemas/CommunicationRequests.js
// Collection definition for CommunicationRequest resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/CommunicationRequest.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let CommunicationRequest = BaseModel.extend();

export let CommunicationRequests = createFhirCollection('CommunicationRequest', 'CommunicationRequests');

//Assign a collection so the object knows how to perform CRUD operations
CommunicationRequest.prototype._collection = CommunicationRequests;

//Add the transform to the collection
CommunicationRequests._transform = function (document) {
  return new CommunicationRequest(document);
};

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


export { CommunicationRequest };
