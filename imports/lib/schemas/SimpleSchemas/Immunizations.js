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
import { BaseSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, SignatureSchema, CodeableConceptSchema, QuantitySchema, AnnotationSchema } from 'meteor/clinical:hl7-resource-datatypes';


// create the object using our BaseModel
let Immunization = BaseModel.extend();


// // Create a persistent data store for addresses to be stored.
// // HL7.Resources.Patients = new Mongo.Collection('HL7.Resources.Patients');
export let Immunizations = new Mongo.Collection('Immunizations');

//Assign a collection so the object knows how to perform CRUD operations
Immunization.prototype._collection = Immunizations;





//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Immunizations._transform = function (document) {
  return new Immunization(document);
};



let ImmunizationDstu2 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Immunization"
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
    type: String,
    optional: true,
    allowedValues: ['in-progress', 'on-hold', 'completed', 'entered-in-error', 'stopped']
  },
  "date" : {
    optional: true,
    type: Date
  },
  "vaccineCode" : {
    type: CodeableConceptSchema
  },
  "patient" : {
    type: ReferenceSchema
  },
  "wasNotGiven" : {
    optional: true,
    type: Boolean
  },
  "reported" : {
    optional: true,
    type: Boolean
  },
  "performer" : {
    optional: true,
    type: ReferenceSchema
  },
  "requester" : {
    optional: true,
    type: ReferenceSchema
  },
  "encounter" : {
    optional: true,
    type: ReferenceSchema
  },
  "manufacturer" : {
    optional: true,
    type: ReferenceSchema
  },
  "location" : {
    optional: true,
    type: ReferenceSchema
  },
  "lotNumber" : {
    optional: true,
    type: String
  },
  "expirationDate" : {
    optional: true,
    type: Date
  },
  "site" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "route" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "doseQuantity" : {
    optional: true,
    type: QuantitySchema
  },
  "note" : {
    optional: true,
    type: Array
  },
  "note.$" : {
    optional: true,
    type: AnnotationSchema 
  },
  "explanation" : {
    optional: true,
    type: Object
  },
  "explanation.reason" : {
    optional: true,
    type: Array
  },
  "explanation.reason.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "explanation.reasonNotGiven" : {
    optional: true,
    type: Array
  },
  "explanation.reasonNotGiven.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "reaction" : {
    optional: true,
    type:  Array
    },
  "reaction.$" : {
    optional: true,
    type:  Object 
    },
  "reaction.$.date" : {
    optional: true,
    type: Date
  },
  "reaction.$.detail" : {
    optional: true,
    type: ReferenceSchema
  },
  "reaction.$.reported" : {
    optional: true,
    type: Boolean
  },
  "vaccinationProtocol" : {
    optional: true,
    type:  Array
    },
  "vaccinationProtocol.$" : {
    optional: true,
    type:  Object 
    },  
  "vaccinationProtocol.$.doseSequence" : {
    optional: true,
    type: Number
  },
  "vaccinationProtocol.$.description" : {
    optional: true,
    type: String
  },
  "vaccinationProtocol.$.authority" : {
    optional: true,
    type: ReferenceSchema
  },
  "vaccinationProtocol.$.series" : {
    optional: true,
    type: String
  },
  "vaccinationProtocol.$.seriesDoses" : {
    optional: true,
    type: Number
  },
  "vaccinationProtocol.$.targetDisease" : {
    optional: true,
    type: Array
  },
  "vaccinationProtocol.$.targetDisease.$" : {
    type: CodeableConceptSchema 
  },
  "vaccinationProtocol.$.doseStatus" : {
    type: CodeableConceptSchema
  },
  "vaccinationProtocol.$.doseStatusReason" : {
    optional: true,
    type: CodeableConceptSchema
  }
});



let ImmunizationStu3 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Immunization"
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
    type: String,
    allowedValues: ['completed', 'entered-in-error'],
    defaultValue: 'completed'
  },
  "notGiven" : {
    type: Boolean,
    defaultValue: false
  },
  "vaccineCode" : {
    type: CodeableConceptSchema
  },
  "patient" : {
    type: ReferenceSchema
  },
  "encounter" : {
    optional: true,
    type: ReferenceSchema
  },
  "date" : {
    optional: true,
    type: Date
  },
  "primarySource" : {
    type: Boolean,
    defaultValue: true
  },
  "reportOrigin" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "location" : {
    optional: true,
    type: ReferenceSchema
  },
  "manufacturer" : {
    optional: true,
    type: ReferenceSchema
  },
  "lotNumber" : {
    optional: true,
    type: String
  },
  "expirationDate" : {
    optional: true,
    type: Date
  },
  "site" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "route" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "doseQuantity" : {
    optional: true,
    type: QuantitySchema
  },
  "practitioner" : {
    optional: true,
    type: Array
  },
  "practitioner.$" : {
    optional: true,
    type: Object
  },
  "practitioner.role" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "practitioner.actor" : {
    type: ReferenceSchema
  },
  "note" : {
    optional: true,
    type: Array
  },
  "note.$" : {
    optional: true,
    type: AnnotationSchema 
  },
  "explanation" : {
    optional: true,
    type: Object
  },
  "explanation.reason" : {
    optional: true,
    type: Array
  },
  "explanation.reason.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "explanation.reasonNotGiven" : {
    optional: true,
    type: Array
  },
  "explanation.reasonNotGiven.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "reaction" : {
    optional: true,
    type:  Array
    },
  "reaction.$" : {
    optional: true,
    type:  Object 
    },
  "reaction.$.date" : {
    optional: true,
    type: Date
  },
  "reaction.$.detail" : {
    optional: true,
    type: ReferenceSchema
  },
  "reaction.$.reported" : {
    optional: true,
    type: Boolean
  },
  "vaccinationProtocol" : {
    optional: true,
    type:  Array
    },
  "vaccinationProtocol.$" : {
    optional: true,
    type:  Object 
    },  
  "vaccinationProtocol.$.doseSequence" : {
    optional: true,
    type: Number
  },
  "vaccinationProtocol.$.description" : {
    optional: true,
    type: String
  },
  "vaccinationProtocol.$.authority" : {
    optional: true,
    type: ReferenceSchema
  },
  "vaccinationProtocol.$.series" : {
    optional: true,
    type: String
  },
  "vaccinationProtocol.$.seriesDoses" : {
    optional: true,
    type: Number
  },
  "vaccinationProtocol.$.targetDisease" : {
    optional: true,
    type: Array
  },
  "vaccinationProtocol.$.targetDisease.$" : {
    type: CodeableConceptSchema 
  },
  "vaccinationProtocol.$.doseStatus" : {
    type: CodeableConceptSchema
  },
  "vaccinationProtocol.$.doseStatusReason" : {
    optional: true,
    type: CodeableConceptSchema
  }
});


let ImmunizationR4 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Immunization"
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
    type: String,
    allowedValues: ['completed', 'entered-in-error'],
    defaultValue: 'completed'
  },
  "notGiven" : {
    type: Boolean,
    defaultValue: false
  },
  "vaccineCode" : {
    type: CodeableConceptSchema
  },
  "patient" : {
    type: ReferenceSchema
  },
  "encounter" : {
    optional: true,
    type: ReferenceSchema
  },
  "date" : {
    optional: true,
    type: Date
  },
  "occurrenceDateTime" : {
    optional: true,
    type: Date
  },
  "primarySource" : {
    type: Boolean,
    defaultValue: true
  },
  "reportOrigin" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "location" : {
    optional: true,
    type: ReferenceSchema
  },
  "manufacturer" : {
    optional: true,
    type: ReferenceSchema
  },
  "lotNumber" : {
    optional: true,
    type: String
  },
  "expirationDate" : {
    optional: true,
    type: Date
  },
  "site" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "route" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "doseQuantity" : {
    optional: true,
    type: QuantitySchema
  },
  "practitioner" : {
    optional: true,
    type: Array
  },
  "practitioner.$" : {
    optional: true,
    type: Object
  },
  "practitioner.role" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "practitioner.actor" : {
    type: ReferenceSchema
  },
  "note" : {
    optional: true,
    type: Array
  },
  "note.$" : {
    optional: true,
    type: AnnotationSchema 
  },
  "explanation" : {
    optional: true,
    type: Object
  },
  "explanation.reason" : {
    optional: true,
    type: Array
  },
  "explanation.reason.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "explanation.reasonNotGiven" : {
    optional: true,
    type: Array
  },
  "explanation.reasonNotGiven.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "reaction" : {
    optional: true,
    type:  Array
    },
  "reaction.$" : {
    optional: true,
    type:  Object 
    },
  "reaction.$.date" : {
    optional: true,
    type: Date
  },
  "reaction.$.detail" : {
    optional: true,
    type: ReferenceSchema
  },
  "reaction.$.reported" : {
    optional: true,
    type: Boolean
  },
  "vaccinationProtocol" : {
    optional: true,
    type:  Array
    },
  "vaccinationProtocol.$" : {
    optional: true,
    type:  Object 
    },  
  "vaccinationProtocol.$.doseSequence" : {
    optional: true,
    type: Number
  },
  "vaccinationProtocol.$.description" : {
    optional: true,
    type: String
  },
  "vaccinationProtocol.$.authority" : {
    optional: true,
    type: ReferenceSchema
  },
  "vaccinationProtocol.$.series" : {
    optional: true,
    type: String
  },
  "vaccinationProtocol.$.seriesDoses" : {
    optional: true,
    type: Number
  },
  "vaccinationProtocol.$.targetDisease" : {
    optional: true,
    type: Array
  },
  "vaccinationProtocol.$.targetDisease.$" : {
    type: CodeableConceptSchema 
  },
  "vaccinationProtocol.$.doseStatus" : {
    type: CodeableConceptSchema
  },
  "vaccinationProtocol.$.doseStatusReason" : {
    optional: true,
    type: CodeableConceptSchema
  }
});

let ImmunizationSchema = ImmunizationR4;


// BUG:  the following winds up using a pooled schema
// and attaching required fields to all cursors that are extended
// for example:  Organizations will error on insert, expecting vaccineCode
// BaseSchema.extend(ImmunizationSchema);
// DomainResourceSchema.extend(ImmunizationSchema);

// TRY:
ImmunizationSchema.extend(BaseSchema);
ImmunizationSchema.extend(DomainResourceSchema);

// Immunizations.attachSchema(ImmunizationSchema);

export default { Immunization, Immunizations, ImmunizationSchema, ImmunizationDstu2, ImmunizationStu3, ImmunizationR4 };