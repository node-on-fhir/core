
// import { Mongo } from 'meteor/mongo';
// import { Meteor } from 'meteor/meteor';
// import { get } from 'lodash';

// import moment from 'moment';
// import SimpleSchema from 'simpl-schema';
// import { BaseSchema, DomainResourceSchema } from 'meteor/clinical:hl7-resource-datatypes';

// OAuthClients = new Mongo.Collection('OAuthClients');

// import OAuthChannel from './OAuthClients.schema.js';
// import UdapChannel from './UdapCertificates.schema.js';

// import base64url from 'base64-url';


// if(Meteor.isClient){
//     Meteor.subscribe('OAuthClients');  
//     Meteor.subscribe('Endpoints');   
// }
// if(Meteor.isServer){
//     Meteor.publish('OAuthClients', function(){
//         return OAuthClients.find();
//     });  
//     Meteor.publish('Endpoints', function(){
//         return Endpoints.find();
//     });  
// }
