// imports/lib/schemas/SimpleSchemas/Communications.js
// Collection definition for Communication resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Communication.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let Communication = BaseModel.extend();

export let Communications = createFhirCollection('Communication', 'Communications');

//Assign a collection so the object knows how to perform CRUD operations
Communication.prototype._collection = Communications;

//Add the transform to the collection
Communications._transform = function (document) {
  return new Communication(document);
};

// Communication.prototype.toFhir = function(){
//   console.log('Communication.toFhir()');

//   return EJSON.stringify(this.name);
// }

// /**
//  * @summary Search the Communications collection for those sent by a specific userId.
//  * @memberOf Communications
//  * @name findCommunicationsSentByUserId
//  * @version 1.2.3
//  * @returns array of communications
//  * @example
//  * ```js
//  *  let communications = Communications.findCommunicationsSentByUserId(Meteor.userId());
//  *  let communication = communications[0];
//  * ```
//  */

// Communications.findCommunicationsSentByUserId = function (userId) {
//   process.env.TRACE && console.log("Communications.findCommunicationsSentByUserId()");
//   return Communications.find({'sender.value': userId});
// };

// /**
//  * @summary Search the Communications collection for those sent by a specific userId.
//  * @memberOf Communications
//  * @name findCommunicationsSentToUserId
//  * @version 1.2.3
//  * @returns array of communications
//  * @example
//  * ```js
//  *  let communications = Communications.findCommunicationsSentByUserId(Meteor.userId());
//  *  let communication = communications[0];
//  * ```
//  */
// Communications.findCommunicationsSentToUserId = function (userId) {
//   process.env.TRACE && console.log("Communications.findCommunicationsSentToUserId()");
//   return Communications.find({'recipient.value': userId});
// };


// /**
//  * @summary Search the Communications collection for a specific Meteor.userId().
//  * @memberOf Communications
//  * @name findMrn
//  * @version 1.2.3
//  * @returns {Boolean}
//  * @example
//  * ```js
//  *  let communications = Communications.findMrn('12345').fetch();
//  * ```
//  */
// Communications.findConversation = function (conversationId, sort=1) {
//   process.env.TRACE && console.log("Communications.findMrn()");
//   return Communications.find(
//     { 'partOf.identifier.value': conversationId},
//     { 'sort': { 'received': sort } });
// };

// /**
//  * @summary Search the Communications collection for a specific query.
//  * @memberOf Communications
//  */

// Communications.fetchBundle = function (query, parameters, callback) {
//   process.env.TRACE && console.log("Communications.fetchBundle()");
//   var communicationArray = Communications.find(query, parameters, callback).map(function(communication){
//     communication.id = communication._id;
//     delete communication._document;
//     return communication;
//   });

//   // console.log("communicationArray", communicationArray);

//   var result = Bundle.generate(communicationArray);

//   // console.log("result", result.entry[0]);

//   return result;
// };




// // Communications.prototype.insertUnique = function(record){
// //   console.log('Communications.prototype.insertUnique');

// //   if(Communications.findConversation(record._id)){
// //     Communications.insert(record)
// //   }
// // }

// Communications.insertUnique = function (record) {
//   console.log("Communications.insertUnique()");
//   console.log("Communications.findOne(record._id)", Communications.findOne(record._id));

//   if(!Communications.findOne(record._id)){
//     let collectionConfig = {};
//     if(Meteor.isClient){
//       collectionConfig = { validate: false, filter: false }
//     }
//     let communicationId = Communications.insert(record, collectionConfig);
//     console.log('Communication created: ' + communicationId);
//     return communicationId;
//   }
// };


export default { Communication, Communications };
