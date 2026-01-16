import { get } from 'lodash';
import validator from 'validator';



import BaseModel from '../BaseModel';

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import {  AddressSchema, BaseSchema, ContactPointSchema, CodeableConceptSchema, DomainResourceSchema, IdentifierSchema,  MoneySchema, PeriodSchema, QuantitySchema, ReferenceSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';


// create the object using our BaseModel
InboundRequest = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
InboundRequest.prototype._collection = InboundRequests;

InboundRequests = new Mongo.Collection('InboundRequests');


// //Add the transform to the collection since Meteor.users is pre-defined by the accounts package
// InboundRequests._transform = function (document) {
//   return new InboundRequest(document);
// };

// InboundRequestSchema = new SimpleSchema({
//   "_id" : {
//     type: String,
//     optional: true
//   },
//   "software_statement" : {
//     type: String,
//     optional: true
//   },
//   "iss" : {
//     type: String,
//     optional: true
//   },
//   "sub" : {
//     type: String,
//     optional: true
//   },
//   "aud" : {
//     type: String,
//     optional: true
//   },
//   "iat" : {
//     type: Number,
//     optional: true
//   },
//   "exp" : {
//     type: Number,
//     optional: true
//   },
//   "exp" : {
//     type: Number,
//     optional: true
//   },
//   "jti" : {
//     type: String,
//     optional: true
//   },
//   "client_name" : {
//     type: String,
//     optional: true
//   },
//   "tos_uri" : {
//     type: String,
//     optional: true
//   },
//   "token_endpoint_auth_method" : {
//     type: String,
//     optional: true
//   },
//   "grant_types" : {
//     type: Array,
//     optional: true
//   },
//   "grant_types.$" : {
//     type: String,
//     optional: true
//   },
//   "error" : {
//     type: String,
//     optional: true
//   },
//   "description" : {
//     type: String,
//     optional: true
//   },
//   "created_at" : {
//     type: Date,
//     optional: true
//   },
//   "authorization_code": {
//     type: String,
//     optional: true
//   },
//   "verified": {
//     type: Boolean,
//     optional: true
//   },
//   "created_at": {
//     type: Date,
//     optional: true
//   },
//   "redirect_uris": {
//     type: Array,
//     optional: true
//   },
//   "redirect_uris.$": {
//     type: String,
//     optional: true
//   },
//   "grant_types": {
//     type: Array,
//     optional: true
//   },
//   "grant_types.$": {
//     type: String,
//     optional: true
//   },
//   "scope": {
//     type: String,
//     optional: true
//   },
// });

// InboundRequests.attachSchema(InboundRequestSchema);

// export default { InboundRequest, InboundRequests, InboundRequestSchema };

export default { InboundRequest, InboundRequests };