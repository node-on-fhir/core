import { get } from 'lodash';
import validator from 'validator';

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';


// // create the object using our BaseModel
// // OAuthClient = BaseModel.extend();
// OAuthClient = BaseModel.extend();

// //Assign a collection so the object knows how to perform CRUD operations
// OAuthClient.prototype._collection = OAuthClients;

OAuthClients = new Mongo.Collection('OAuthClients');


// //Add the transform to the collection since Meteor.users is pre-defined by the accounts package
// OAuthClients._transform = function (document) {
//   return new OAuthClient(document);
// };

OAuthClientSchema =  new SimpleSchema({
  "_id" : {
    type: String,
    optional: true
  },
  "software_statement" : {
    type: String,
    optional: true
  },
  "iss" : {
    type: String,
    optional: true
  },
  "sub" : {
    type: String,
    optional: true
  },
  "aud" : {
    type: String,
    optional: true
  },
  "iat" : {
    type: Number,
    optional: true
  },
  "exp" : {
    type: Number,
    optional: true
  },
  "exp" : {
    type: Number,
    optional: true
  },
  "jti" : {
    type: String,
    optional: true
  },
  "client_name" : {
    type: String,
    optional: true
  },
  "client_id" : {
    type: String,
    optional: true
  },
  "client_secret" : {
    type: String,
    optional: true
  },
  "tos_uri" : {
    type: String,
    optional: true
  },
  "token_endpoint_auth_method" : {
    type: String,
    optional: true
  },
  "grant_types" : {
    type: Array,
    optional: true
  },
  "grant_types.$" : {
    type: String,
    optional: true
  },
  "error" : {
    type: String,
    optional: true
  },
  "description" : {
    type: String,
    optional: true
  },
  "created_at" : {
    type: Date,
    optional: true
  },
  "authorization_code": {
    type: String,
    optional: true
  },
  "verified": {
    type: Boolean,
    optional: true
  },
  "created_at": {
    type: Date,
    optional: true
  },
  "redirect_uris": {
    type: Array,
    optional: true
  },
  "redirect_uris.$": {
    type: String,
    optional: true
  },
  "grant_types": {
    type: Array,
    optional: true
  },
  "grant_types.$": {
    type: String,
    optional: true
  },
  "scope": {
    type: String,
    optional: true
  },
  "access_token": {
    type: String,
    optional: true
  },
  "access_token_created_at": {
    type: Date,
    optional: true
  },
  "response_types": {
    type: Array,
    optional: true
  },
  "response_types.$": {
    type: String,
    optional: true
  },
  "jwks_uri": {
    type: String,
    optional: true
  },
  "jwks": {
    type: Object,
    optional: true,
    blackbox: true  // Allow any structure for JWKS object
  },
  "launch_uri": {
    type: String,
    optional: true
  },
  "pkce_enabled": {
    type: Boolean,
    optional: true,
    defaultValue: false
  },
  "pkce_method": {
    type: String,
    optional: true,
    allowedValues: ['S256', 'plain']
  },
  "auth_request_method": {
    type: String,
    optional: true,
    allowedValues: ['GET', 'POST'],
    defaultValue: 'GET'
  },
  // SMART 2.x fields for g(10) certification
  "patient_id": {
    type: String,
    optional: true
  },
  "encounter_id": {
    type: String,
    optional: true
  },
  "launch_type": {
    type: String,
    optional: true,
    allowedValues: ['ehr', 'standalone']
  },
  "launch_context": {
    type: String,
    optional: true
  },
  "code_challenge": {
    type: String,
    optional: true
  },
  "code_challenge_method": {
    type: String,
    optional: true,
    allowedValues: ['S256', 'plain']
  },
  "refresh_token": {
    type: String,
    optional: true
  },
  "requested_scope": {
    type: String,
    optional: true
  },
  "user_id": {
    type: String,
    optional: true
  },
  // Token revocation fields for ONC g(10) 9.3.01 compliance
  "authorization_expires_at": {
    type: Date,
    optional: true
  },
  "revoked_at": {
    type: Date,
    optional: true
  },
  "revoked_by": {
    type: String,
    optional: true
  },
  "session_duration_minutes": {
    type: Number,
    optional: true
  }
});

OAuthClients.attachSchema(OAuthClientSchema);

export default { OAuthClient, OAuthClients, OAuthClientSchema };