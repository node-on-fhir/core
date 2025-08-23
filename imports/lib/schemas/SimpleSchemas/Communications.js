
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
import { 
  BaseSchema, 
  DomainResourceSchema, 
  IdentifierSchema, 
  ReferenceSchema, 
  ContactPointSchema, 
  AddressSchema, 
  SignatureSchema,
  CodeableConceptSchema,
  AttachmentSchema,
  AnnotationSchema,
  Code
} from 'meteor/clinical:hl7-resource-datatypes';
// import ReferenceSchema from '../../../datatypes/Reference';





// create the object using our BaseModel
let Communication = BaseModel.extend();

export let Communications = new Mongo.Collection('Communications');

//Assign a collection so the object knows how to perform CRUD operations
Communication.prototype._collection = Communications;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Communications._transform = function (document) {
  return new Communication(document);
};







let CommunicationR4 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Communication"
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
  "definition" : {
    optional: true,
    type: Array
  },
  "definition.$" : {
    optional: true,
    type: ReferenceSchema 
  },  
  "basedOn" : {
    optional: true,
    type: Array
  }, 
  "basedOn.$" : {
    optional: true,
    type: ReferenceSchema
  }, 
  "partOf" : {
    optional: true,
    type: Array
  }, 
  "partOf.$" : {
    optional: true,
    type: ReferenceSchema
  }, 
  "status" : {
    optional: false,
    allowedValues: ["registered", "partial", "final", "corrected", "appended", "cancelled", "entered-in-error"],
    type: Code
  }, 
  "notDone" : {
    type: Boolean,
    optional: true,
    defaultValue: false
  },
  "notDoneReason" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "category" : {
    optional: true,
    type: Array
  }, 
  "category.$" : {
    optional: true,
    type: CodeableConceptSchema 
  }, 
  "medium" : {
    optional: true,
    type: Array
  },
  "medium.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },  
  "subject" : {
    optional: true,
    type: ReferenceSchema
  }, // R!  The subject of the communication
  "recipient" : {
    optional: true,
    type: Array
  }, 
  "recipient.$" : {
    optional: true,
    type: ReferenceSchema 
  },   
  "topic" : {
    optional: true,
    type: Array
  }, 
  "topic.$" : {
    optional: true,
    type: ReferenceSchema 
  },   
  "context" : {
    optional: true,
    type: ReferenceSchema
  }, 
  "sent" : {
    optional: true,
    type: Date
  },
  "received" : {
    optional: true,
    type: Date
  },
  "sender" : {
    optional: true,
    type: ReferenceSchema
  },
  "reasonCode" : {
    optional: true,
    type: Array
  }, 
  "reasonCode.$" : {
    optional: true,
    type: CodeableConceptSchema 
  }, 
  "reasonReference" : {
    optional: true,
    type: Array
  }, 
  "reasonReference.$" : {
    optional: true,
    type: ReferenceSchema 
  },   

  "payload" : {
    optional: true,
    type: Array
  },
  "payload.$" : {
    optional: true,
    type: Object
  },
  "payload.$.contentString" : {
      optional: true,
      type: String
  },
  "payload.$.contentAttachment" : {
    optional: true,
    type: AttachmentSchema
  },
  "payload.$.contentReference" : {
    optional: true,
    type: ReferenceSchema
  },
  "note" : {
    optional: true,
    type: Array
  },
  "note.$" : {
    optional: true,
    type: AnnotationSchema 
  }
});


let CommunicationStu3 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Communication"
  },
  "identifier" : {
    optional: true,
    type:  Array
    },
  "identifier.$" : {
    optional: true,
    type:  IdentifierSchema 
    },
  "definition" : {
    optional: true,
    type: Array
  },
  "definition.$" : {
    optional: true,
    type: ReferenceSchema 
  },  
  "basedOn" : {
    optional: true,
    type: ReferenceSchema
  }, 
  "partOf" : {
    optional: true,
    type: ReferenceSchema
  }, // the conversation
  "status" : {
    optional: false,
    type: Code
  }, // R!  registered | partial | final | corrected | appended | cancelled | entered-in-error
  "notDone" : {
    type: Boolean,
    optional: true,
    defaultValue: false
  },
  "notDoneReason" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "category" : {
    optional: true,
    type: Array
  }, 
  "category.$" : {
    optional: true,
    type: CodeableConceptSchema 
  }, 
  "medium" : {
    optional: true,
    type: Array
  },
  "medium.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },  
  "subject" : {
    optional: true,
    type: ReferenceSchema
  }, // R!  The subject of the communication
  "recipient" : {
    optional: true,
    type: Array
  }, 
  "recipient.$" : {
    optional: true,
    type: ReferenceSchema 
  },   
  "topic" : {
    optional: true,
    type: Array
  }, 
  "topic.$" : {
    optional: true,
    type: ReferenceSchema 
  },   
  "context" : {
    optional: true,
    type: ReferenceSchema
  }, 
  "sent" : {
    optional: true,
    type: Date
  },
  "received" : {
    optional: true,
    type: Date
  },
  "sender" : {
    optional: true,
    type: ReferenceSchema
  },
  "reasonCode" : {
    optional: true,
    type: Array
  }, 
  "reasonCode.$" : {
    optional: true,
    type: CodeableConceptSchema 
  }, 
  "reasonReference" : {
    optional: true,
    type: Array
  }, 
  "reasonReference.$" : {
    optional: true,
    type: ReferenceSchema 
  },   

  "payload" : {
    optional: true,
    type: Array
  },
  "payload.$" : {
    optional: true,
    type: Object
  },
  "payload.$.contentString" : {
      optional: true,
      type: String
  },
  "payload.$.contentAttachment" : {
    optional: true,
    type: AttachmentSchema
  },
  "payload.$.contentReference" : {
    optional: true,
    type: ReferenceSchema
  },
  "note" : {
    optional: true,
    type: Array
  },
  "note.$" : {
    optional: true,
    type: AnnotationSchema 
  }
});

let CommunicationSchema = CommunicationR4;

// BaseSchema.extend(CommunicationSchema);
// DomainResourceSchema.extend(CommunicationSchema);

// Communications.attachSchema(CommunicationSchema);


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


export default { Communication, Communications, CommunicationStu3, CommunicationR4, CommunicationSchema };