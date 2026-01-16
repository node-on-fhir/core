import { get } from 'lodash';
import validator from 'validator';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import { AttachmentSchema, BaseSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, SignatureSchema, CodeableConceptSchema, PeriodSchema } from 'meteor/clinical:hl7-resource-datatypes';


// if(Package['clinical:autopublish']){
//   console.log("*****************************************************************************")
//   console.log("HIPAA WARNING:  Your app has the 'clinical-autopublish' package installed.");
//   console.log("Any protected health information (PHI) stored in this app should be audited."); 
//   console.log("Please consider writing secure publish/subscribe functions and uninstalling.");  
//   console.log("");  
//   console.log("meteor remove clinical:autopublish");  
//   console.log("");  
// }
// if(Package['autopublish']){
//   console.log("*****************************************************************************")
//   console.log("HIPAA WARNING:  DO NOT STORE PROTECTED HEALTH INFORMATION IN THIS APP. ");  
//   console.log("Your application has the 'autopublish' package installed.  Please uninstall.");
//   console.log("");  
//   console.log("meteor remove autopublish");  
//   console.log("meteor add clinical:autopublish");  
//   console.log("");  
// }

// create the object using our BaseModel
let HealthcareService = BaseModel.extend();


// // Create a persistent data store for addresses to be stored.
// // HL7.Resources.HealthcareServices = new Mongo.Collection('HL7.Resources.HealthcareServices');
export let HealthcareServices = new Mongo.Collection('HealthcareServices');

//Assign a collection so the object knows how to perform CRUD operations
HealthcareService.prototype._collection = HealthcareServices;



//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
HealthcareServices._transform = function (document) {
  return new HealthcareService(document);
};

let HealthcareServiceSchema = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "HealthcareService"
  },
  "id" : {
    optional: true,
    type:  String 
    },
  "_id" : {
    optional: true,
    type:  String 
    },
  "meta" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "meta.versionId" : {
    optional: true,
    type:  Number
  },
  "text" : {
    optional: true,
    blackbox: true,
    type:  Object
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
  "contained" : {
    optional: true,
    type:  Array
    },
  "contained.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
  },

  "identifier" : {
    optional: true,
    type:  Array
    },
  "identifier.$" : {
    optional: true,
    blackbox: true,
    type:  IdentifierSchema 
  },
  "active" : {
    optional: true,
    type:  Boolean
    },
  "providedBy" : {
    optional: true,
    type:  ReferenceSchema
    },
  "category" : {
      optional: true,
      type:  Array
      },
  "category.$" : {
      optional: true,
      blackbox: true,
      type:  CodeableConceptSchema 
    },
  "type" : {
      optional: true,
      type:  Array
      },
  "type.$" : {
      optional: true,
      blackbox: true,
      type:  CodeableConceptSchema 
    },
  "specialty" : {
      optional: true,
      type:  Array
      },
  "specialty.$" : {
      optional: true,
      blackbox: true,
      type:  CodeableConceptSchema 
    },
  "location" : {
      optional: true,
      type:  Array
      },
  "location.$" : {
      optional: true,
      blackbox: true,
      type:  ReferenceSchema 
    },
  "name" : {
    optional: true,
    type:  String
    },
  "comment" : {
    optional: true,
    type:  String
    },
  "extraDetails" : {
    optional: true,
    type:  String
    },
  "photo" : {
    optional: true,
    type:  AttachmentSchema
    },
  "telecom" : {
    optional: true,
    type:  Array
    },
  "telecom.$" : {
    optional: true,
    type:  ContactPointSchema
    },
  "coverageArea" : {
      optional: true,
      type:  Array
      },
  "coverageArea.$" : {
      optional: true,
      blackbox: true,
      type:  ReferenceSchema 
    },       
  "serviceProvisionCode" : {
      optional: true,
      type:  Array
      },
  "serviceProvisionCode.$" : {
      optional: true,
      blackbox: true,
      type:  CodeableConceptSchema 
    },
  "eligibility" : {
      optional: true,
      type:  Array
      },
  "eligibility.$" : {
      optional: true,
      type:  Object 
    },
  "eligibility.$.code" : {
      optional: true,
      type:  CodeableConceptSchema 
    },
  "eligibility.$.comment" : {
      optional: true,
      type:  String 
    },
  "program" : {
      optional: true,
      type:  Array
      },
  "program.$" : {
      optional: true,
      blackbox: true,
      type:  CodeableConceptSchema 
    },
  "characteristic" : {
      optional: true,
      type:  Array
      },
  "characteristic.$" : {
      optional: true,
      blackbox: true,
      type:  CodeableConceptSchema 
    },
  "communication" : {
      optional: true,
      type:  Array
      },
  "communication.$" : {
      optional: true,
      blackbox: true,
      type:  CodeableConceptSchema 
    },
  "referralMethod" : {
      optional: true,
      type:  Array
      },
  "referralMethod.$" : {
      optional: true,
      blackbox: true,
      type:  CodeableConceptSchema 
    },
  "appointmentRequired" : {
    optional: true,
    type:  Boolean
    },
  "availableTime" : {
      optional: true,
      type:  Array
      },
  "availableTime.$" : {
      optional: true,
      type:  Object 
    },
  "availableTime.$.daysOfWeek" : {
      optional: true,
      type:  Array 
    },
  "availableTime.$.daysOfWeek.$" : {
      optional: true,
      type:  String 
    },
  "availableTime.$.allDay" : {
      optional: true,
      type:  Boolean 
    },
  "availableTime.$.availableStartTime" : {
    optional: true,
    type:  Date 
  },
  "availableTime.$.availableEndTime" : {
    optional: true,
    type:  Date 
  },

  "notAvailable" : {
    optional: true,
    type:  Array
    },
  "notAvailable.$" : {
      optional: true,
      type:  Object 
    },
  "notAvailable.$.description" : {
      optional: true,
      type:  String 
    },
  "notAvailable.$.during" : {
      optional: true,
      type:  PeriodSchema 
    },

  "availabilityExceptions" : {
    optional: true,
    type:  String
    },
  "endpoint" : {
    optional: true,
    type:  Array
    },
  "endpoint.$" : {
      optional: true,
      blackbox: true,
      type:  ReferenceSchema 
    },   
});

BaseSchema.extend(HealthcareServiceSchema);
DomainResourceSchema.extend(HealthcareServiceSchema);

// HealthcareServices.attachSchema(HealthcareServiceSchema);

export default { HealthcareService, HealthcareServices, HealthcareServiceSchema };