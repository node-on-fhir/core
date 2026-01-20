// import { get } from 'lodash';
// import validator from 'validator';



// import { Mongo } from 'meteor/mongo';
// import SimpleSchema from 'simpl-schema';


// // create the object using our BaseModel
// UdapCertificate = BaseModel.extend();

// //Assign a collection so the object knows how to perform CRUD operations
// UdapCertificate.prototype._collection = UdapCertificates;

// UdapCertificates = new Mongo.Collection('UdapCertificates');


// //Add the transform to the collection since Meteor.users is pre-defined by the accounts package
// UdapCertificates._transform = function (document) {
//   return new UdapCertificate(document);
// };

// UdapCertificateSchema = new SimpleSchema({
//   "_id" : {
//     type: String,
//     optional: true
//   },
//   "resourceType" : {
//     type: String,
//     defaultValue: "UdapCertificate",
//   },
//   "certificateOwner": {
//     type: String,
//   },
//   "certificate": {
//     type: String,
//   },
//   "createdAt": {
//     type: Date
//   }
// });

// UdapCertificates.attachSchema(UdapCertificateSchema);

// export default { UdapCertificate, UdapCertificates, UdapCertificateSchema };