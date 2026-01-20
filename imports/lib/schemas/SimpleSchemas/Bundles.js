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

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import { BaseSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';



import { get, has, set } from 'lodash';

// create the object using our BaseModel
let Bundle = BaseModel.extend();

export let Bundles = new Mongo.Collection('Bundles');

//Assign a collection so the object knows how to perform CRUD operations
Bundle.prototype._collection = Bundles;


// if(typeof Bundles === 'undefined'){
//   if(Package['autopublish']){
//     Bundles = new Mongo.Collection('Bundles');
//   } else if(Package['clinical:autopublish']){
//     Bundles = new Mongo.Collection('Bundles');
//   } else if(Package['clinical:desktop-publish']){
//     Bundles = new Mongo.Collection('Bundles');
//   } else {
//     Bundles = new Mongo.Collection('Bundles');
//     // Bundles = new Mongo.Collection('Bundles', {connection: null});
//   }
// }




// if (Meteor.isClient){
//   Meteor.subscribe("Bundles");
// }

// if (Meteor.isServer){
//   Meteor.publish("Bundles", function (argument){
//     if (this.userId) {
//       return Bundles.find();
//     } else {
//       return [];
//     }
//   });
// }

//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Bundles._transform = function (document) {
  return new Bundle(document);
};

let BundleDstu2 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Bundle"
  },
  "type" : {
    optional: true,
    type: Code,
    allowedValues: [  'document' , 'message' , 'transaction' , 'transaction-response' , 'batch' , 'batch-response' , 'history' , 'searchset' , 'collection' ],
    defaultValue: 'searchset'
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
  "total" : {
    optional: true,
    type: Number
  },
  "link" : {
    optional: true,
    type: Array
  },
  "link.$" : {
    optional: true,
    type: Object
  },
  "link.$.relation" : {
    optional: true,
    type: String
  },
  "link.$.url" : {
    optional: true,
    type: String
  },

  "entry" : {
    optional: true,
    type: Array
  },
  "entry.$" : {
    optional: true,
    type: Object
  },

  "entry.$.link" : {
    optional: true,
    type: Array
  },
  "entry.$.link.$" : {
    optional: true,
    type: String 
  },  
  "entry.$.fullUrl" : {
    optional: true,
    type: String
  },
  "entry.$.resource" : {
    optional: true,
    type: Object,
    blackbox: true
  },

  "entry.$.search" : {
    optional: true,
    type: Object
  },

  "entry.$.search.mode" : {
    optional: true,
    type: String
  },
  "entry.$.search.score" : {
    optional: true,
    type: Number
  },

  "entry.$.request" : {
    optional: true,
    type: Object
  },

  "entry.$.request.method" : {
    optional: true,
    type: String
  },
  "entry.$.request.url" : {
    optional: true,
    type: String
  },
  "entry.$.request.ifNoneMatch" : {
    optional: true,
    type: String
  },
  "entry.$.request.ifModifiedSince" : {
    optional: true,
    type: Date
  },
  "entry.$.request.ifMatch" : {
    optional: true,
    type: String
  },
  "entry.$.request.ifNoneExist" : {
    optional: true,
    type: String
  },
  "entry.$.response" : {
    optional: true,
    type: Object
  },
  "entry.$.response.status" : {
    optional: true,
    type: String
  },
  "entry.$.response.location" : {
    optional: true,
    type: String
  },
  "entry.$.response.etag" : {
    optional: true,
    type: String
  },
  "entry.$.response.lastModified" : {
    optional: true,
    type: Date
  },
  "signature" : {
    optional: true,
    type: SignatureSchema
  }
});

let BundleR4 = new SimpleSchema({
  "_id" : {
    type: String,
    optional: true
  },
  "id" : {
    type: String,
    optional: true
  },
  "meta" : {
    type: Object,
    optional: true,
    blackbox: true
  },
  "resourceType" : {
    type: String,
    defaultValue: "Bundle"
  },
  "type" : {
    optional: true,
    type: Code,
    allowedValues: [  'document' , 'message' , 'transaction' , 'transaction-response' , 'batch' , 'batch-response' , 'history' , 'searchset' , 'collection' ],
    defaultValue: 'searchset'
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
  "timestamp" : {
    optional: true,
    type: Date
  },
  "total" : {
    optional: true,
    type: Number
  },
  "link" : {
    optional: true,
    type: Array
  },
  "link.$" : {
    optional: true,
    type: Object
  },
  "link.$.relation" : {
    optional: true,
    type: String
  },
  "link.$.url" : {
    optional: true,
    type: String
  },

  "entry" : {
    optional: true,
    type: Array
  },
  "entry.$" : {
    optional: true,
    type: Object
  },

  "entry.$.link" : {
    optional: true,
    type: Array
  },
  "entry.$.link.$" : {
    optional: true,
    type: String 
  },  
  "entry.$.fullUrl" : {
    optional: true,
    type: String
  },
  "entry.$.resource" : {
    optional: true,
    type: Object,
    blackbox: true
  },

  "entry.$.search" : {
    optional: true,
    type: Object
  },

  "entry.$.search.mode" : {
    optional: true,
    type: String
  },
  "entry.$.search.score" : {
    optional: true,
    type: Number
  },

  "entry.$.request" : {
    optional: true,
    type: Object
  },

  "entry.$.request.method" : {
    optional: true,
    type: String
  },
  "entry.$.request.url" : {
    optional: true,
    type: String
  },
  "entry.$.request.ifNoneMatch" : {
    optional: true,
    type: String
  },
  "entry.$.request.ifModifiedSince" : {
    optional: true,
    type: Date
  },
  "entry.$.request.ifMatch" : {
    optional: true,
    type: String
  },
  "entry.$.request.ifNoneExist" : {
    optional: true,
    type: String
  },
  "entry.$.response" : {
    optional: true,
    type: Object
  },
  "entry.$.response.status" : {
    optional: true,
    type: String
  },
  "entry.$.response.location" : {
    optional: true,
    type: String
  },
  "entry.$.response.etag" : {
    optional: true,
    type: String
  },
  "entry.$.response.lastModified" : {
    optional: true,
    type: Date
  },
  "signature" : {
    optional: true,
    type: SignatureSchema
  }
});

let BundleSchema = BundleR4;

// BaseSchema.extend(BundleSchema);
// DomainResourceSchema.extend(BundleSchema);
// Bundles.attachSchema(BundleSchema);

// TODO:  Review this api call; 
// It has suddenly gotten a bit unwieldy with pagination
Bundle.generate = function(payload, type, total, links){
  var bundle = {
    resourceType: "Bundle",
    type: 'searchset',
    entry: []
  };

  if (type) {
    bundle.type = type;
  }

  // the payload is an array of resource entries
  if (Array.isArray(payload)) {
    if(payload.length > 0){
      bundle.entry = payload;
    } else {
      delete bundle.entry;
    }

    if(total){
      // total can be more than what is in the payload,
      // indicating a multi-part response    
      bundle.total = total;      
    } else {
      // otherwise, if the number of matching records is less than _count or paginationLimit
      // then we just match against the payload length
      bundle.total = payload.length;
    }
    if(links){
      bundle.link = links;
    }
  } else {

    // payload is a single resource; need to create the entry reference
    bundle.entry = [{
      fullUrl: Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.fhirPath', 'fhir-3.0.0/') + get(payload, 'resourceType') + "/" + get(payload, '_id'),
      resource: payload
    }];
    bundle.total = 1;    
  }

  return bundle;
};



export { Bundle, BundleSchema };


