// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/lib/schemas/SimpleSchemas/Locations.js

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

import { BaseSchema, DomainResourceSchema, IdentifierSchema, ReferenceSchema, ContactPointSchema, AddressSchema, SignatureSchema, Code, CodeableConceptSchema, CodingSchema } from 'meteor/clinical:hl7-resource-datatypes';


// create the object using our BaseModel
let Location = BaseModel.extend();


export let Locations = new Mongo.Collection('Locations');

//Assign a collection so the object knows how to perform CRUD operations
Location.prototype._collection = Locations;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Locations._transform = function (document) {
  return new Location(document);
};


let LocationDstu2 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Location"
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
  "status" : {
    optional: true,
    type: Code,
    allowedValues: ['active', 'suspended', 'inactive']
  },
  "name" : {
    optional: true,
    type: String
  },
  "description" : {
    optional: true,
    type: String
  },
  "mode" : {
    optional: true,
    type: Code,
    allowedValues: ['instance', 'kind']
  },
  "type" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "telecom" : {
    optional: true,
    type: Array
  },
  "telecom.$" : {
    optional: true,
    type: ContactPointSchema
  },
  "address" : {
    optional: true,
    type: AddressSchema
  },
  "physicalType" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "position" : {
    optional: true,
    type: Object
  },
  "position.longitude" : {
    optional: true,
    type: Number
  },
  "position.latitude" : {
    optional: true,
    type: Number
  },
  "position.altitude" : {
    optional: true,
    type: Number
  },
  "managingOrganization" : {
    optional: true,
    type: ReferenceSchema
  },
  "partOf" : {
    optional: true,
    type: ReferenceSchema
  }
});


let LocationStu3 = new SimpleSchema({
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
    defaultValue: "Location"
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
  "status" : {
    optional: true,
    type: Code,
    allowedValues: ['active', 'suspended', 'inactive']
  },
  "operationalStatus" : {
    optional: true,
    type: CodingSchema
  },
  "name" : {
    optional: true,
    type: String
  },
  "alias" : {
    optional: true,
    type: Array
  },
  "alias.$" : {
    optional: true,
    type: String
  },
  "description" : {
    optional: true,
    type: String
  },
  "mode" : {
    optional: true,
    type: Code,
    allowedValues: ['instance', 'kind']
  },
  "type" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "telecom" : {
    optional: true,
    type: Array
  },
  "telecom.$" : {
    optional: true,
    type: ContactPointSchema
  },
  "address" : {
    optional: true,
    type: AddressSchema
  },
  "physicalType" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "position" : {
    optional: true,
    type: Object
  },
  "position.longitude" : {
    optional: true,
    type: Number
  },
  "position.latitude" : {
    optional: true,
    type: Number
  },
  "position.altitude" : {
    optional: true,
    type: Number
  },
  "managingOrganization" : {
    optional: true,
    type: ReferenceSchema
  },
  "partOf" : {
    optional: true,
    type: ReferenceSchema
  },
  "endpoint" : {
    optional: true,
    type: Array
  },
  "endpoint.$" : {
    optional: true,
    type: ReferenceSchema
  }
});


let LocationR4 = new SimpleSchema({
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
    defaultValue: "Location"
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
  "status" : {
    optional: true,
    type: Code,
    allowedValues: ['active', 'suspended', 'inactive']
  },
  "operationalStatus" : {
    optional: true,
    type: CodingSchema
  },
  "name" : {
    optional: true,
    type: String
  },
  "alias" : {
    optional: true,
    type: Array
  },
  "alias.$" : {
    optional: true,
    type: String
  },
  "description" : {
    optional: true,
    type: String
  },
  "mode" : {
    optional: true,
    type: Code,
    allowedValues: ['instance', 'kind']
  },
  "type" : {
    optional: true,
    type: Array
  },
  "type.$" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "telecom" : {
    optional: true,
    type: Array
  },
  "telecom.$" : {
    optional: true,
    type: ContactPointSchema
  },
  "address" : {
    optional: true,
    type: AddressSchema
  },
  "physicalType" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "position" : {
    optional: true,
    type: Object
  },
  "position.longitude" : {
    optional: true,
    type: Number
  },
  "position.latitude" : {
    optional: true,
    type: Number
  },
  "position.altitude" : {
    optional: true,
    type: Number
  },
  "managingOrganization" : {
    optional: true,
    type: ReferenceSchema
  },
  "partOf" : {
    optional: true,
    type: ReferenceSchema
  },
  "hoursOfOperation" : {
    optional: true,
    type: Array
  },
  "hoursOfOperation.$" : {
    optional: true,
    type: Object
  },
  "hoursOfOperation.$.daysOfWeek" : {
    optional: true,
    type: Array
  },
  "hoursOfOperation.$.daysOfWeek.$" : {
    optional: true,
    type: Code,
    allowedValues: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  },
  "hoursOfOperation.$.allDay" : {
    optional: true,
    type: Boolean
  },
  "hoursOfOperation.$.openingTime" : {
    optional: true,
    type: String
  },
  "hoursOfOperation.$.closingTime" : {
    optional: true,
    type: String
  },
  "availabilityExceptions" : {
    optional: true,
    type: String
  },
  "endpoint" : {
    optional: true,
    type: Array
  },
  "endpoint.$" : {
    optional: true,
    type: ReferenceSchema
  }
});


let LocationSchema = LocationR4;

export default { Location, Locations, LocationSchema, LocationStu3, LocationDstu2 };