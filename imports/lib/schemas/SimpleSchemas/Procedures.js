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
import { BaseSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, SignatureSchema, CodeableConceptSchema, AnnotationSchema, PeriodSchema } from 'meteor/clinical:hl7-resource-datatypes';


// create the object using our BaseModel
let Procedure = BaseModel.extend();

let Procedures = new Mongo.Collection('Procedures');

//Assign a collection so the object knows how to perform CRUD operations
Procedure.prototype._collection = Procedures;







//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Procedures._transform = function (document) {
  return new Procedure(document);
};



let ProcedureDstu2 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Procedure"
  },
  "id" : {
    optional: true,
    type:  String
    },
  "meta" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "text" : {
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
  "subject" : {
    optional: true,
    type: ReferenceSchema
  },
  "status" : {
    type: String,
    allowedValues: [ 'in-progress', 'aborted', 'completed', 'entered-in-error'],
    defaultValue: 'completed'
  },
  "category" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "code" : {
    type: CodeableConceptSchema
  },
  "notPerformed" : {
    optional: true,
    type: Boolean,
    defaultValue: true
  },
  "reasonNotPerformed" : {
    optional: true,
    type: Array
  },
  "reasonNotPerformed.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "bodySite" : {
    optional: true,
    type: Array
  },
  "bodySite.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "reasonCodeableConceptSchema" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "reasonReference" : {
    optional: true,
    type: ReferenceSchema
  },
  "performer" : {
    optional: true,
    type:  Array
    },
  "performer.$" : {
    optional: true,
    type:  Object 
    },  
  "performer.$.actor" : {
    optional: true,
    type: ReferenceSchema
  },
  "performer.$.role" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "performedDateTime" : {
    optional: true,
    type: Date
  },
  "performedPeriod" : {
    optional: true,
    type: PeriodSchema
  },
  "encounter" : {
    optional: true,
    type: ReferenceSchema
  },
  "location" : {
    optional: true,
    type: ReferenceSchema
  },
  "outcome" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "report" : {
    optional: true,
    type: Array
  },
  "report.$" : {
    optional: true,
    type: ReferenceSchema 
  },
  "complication" : {
    optional: true,
    type: Array
  },
  "complication.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "followUp" : {
    optional: true,
    type: Array
  },
  "followUp.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "request" : {
    optional: true,
    type: ReferenceSchema
  },
  "notes" : {
    optional: true,
    type: Array
  },
  "notes.$" : {
    optional: true,
    type: AnnotationSchema 
  },
  "focalDevice" : {
    optional: true,
    type:  Array
    },
  "focalDevice.$" : {
    optional: true,
    type:  Object 
    },  
  "focalDevice.$.action" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "focalDevice.$.manipulated" : {
    optional: true,
    type: ReferenceSchema
  },
  "used" : {
    optional: true,
    type: Array
  },
  "used.$" : {
    optional: true,
    type: ReferenceSchema 
  }
});


let ProcedureStu3 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Procedure"
  },
  "id" : {
    optional: true,
    type:  String
    },
  "meta" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "text" : {
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
    type: ReferenceSchema
  },  
  "status" : {
    type: String,
    allowedValues: [ 'preparation', 'in-progress', 'suspended', 'aborted', 'completed', 'entered-in-error', 'unknown'],
    defaultValue: 'completed'
  },
  "notDone" : {
    optional: true,
    type: Boolean,
    defaultValue: true
  },
  "notDoneReason" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "category" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "code" : {
    type: CodeableConceptSchema
  },
  "subject" : {
    optional: true,
    type: ReferenceSchema
  },
  "encounter" : {
    optional: true,
    type: ReferenceSchema
  },
  "performedDateTime" : {
    optional: true,
    type: Date
  },
  "performedPeriod" : {
    optional: true,
    type: PeriodSchema
  },
  "performer" : {
    optional: true,
    type:  Array
    },
  "performer.$" : {
    optional: true,
    type:  Object 
    },  
  "performer.$.role" : {
      optional: true,
      type: CodeableConceptSchema
    },
  "performer.$.actor" : {
    optional: true,
    type: ReferenceSchema
  },
  "performer.$.onBehalfOf" : {
    optional: true,
    type: ReferenceSchema
  },
  "location" : {
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
  "bodySite" : {
    optional: true,
    type: Array
  },
  "bodySite.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },

  "outcome" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "report" : {
    optional: true,
    type: Array
  },
  "report.$" : {
    optional: true,
    type: ReferenceSchema 
  },
  "complication" : {
    optional: true,
    type: Array
  },
  "complication.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "complicationDetail" : {
    optional: true,
    type: Array
  },
  "complicationDetail.$" : {
    optional: true,
    type: ReferenceSchema 
  },
  "followUp" : {
    optional: true,
    type: Array
  },
  "followUp.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "note" : {
    optional: true,
    type: Array
  },
  "note.$" : {
    optional: true,
    type: AnnotationSchema 
  },
  "focalDevice" : {
    optional: true,
    type:  Array
    },
  "focalDevice.$" : {
    optional: true,
    type:  Object 
    },  
  "focalDevice.$.action" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "focalDevice.$.manipulated" : {
    optional: true,
    type: ReferenceSchema
  },
  "usedReference" : {
    optional: true,
    type: Array
  },
  "usedReference.$" : {
    optional: true,
    type: ReferenceSchema 
  },
  "usedCode" : {
    optional: true,
    type: Array
  },
  "usedCode.$" : {
    optional: true,
    type: CodeableConceptSchema 
  }
});


let ProcedureR4 = new SimpleSchema({
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
    defaultValue: "Procedure"
  },
  "text" : {
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
    type: ReferenceSchema
  },
  "basedOn" : {
    optional: true,
    type: ReferenceSchema
  },
  "partOf" : {
    optional: true,
    type: ReferenceSchema
  },  
  "status" : {
    type: String,
    allowedValues: [ 'preparation', 'in-progress', 'suspended', 'aborted', 'completed', 'entered-in-error', 'unknown'],
    defaultValue: 'completed'
  },
  "notDone" : {
    optional: true,
    type: Boolean,
    defaultValue: true
  },
  "notDoneReason" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "category" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "code" : {
    type: CodeableConceptSchema
  },
  "subject" : {
    optional: true,
    type: ReferenceSchema
  },
  "encounter" : {
    optional: true,
    type: ReferenceSchema
  },
  "performedDateTime" : {
    optional: true,
    type: Date
  },
  "performedPeriod" : {
    optional: true,
    type: PeriodSchema
  },
  "performer" : {
    optional: true,
    type:  Array
    },
  "performer.$" : {
    optional: true,
    type:  Object 
    },  
  "performer.$.role" : {
      optional: true,
      type: CodeableConceptSchema
    },
  "performer.$.actor" : {
    optional: true,
    type: ReferenceSchema
  },
  "performer.$.onBehalfOf" : {
    optional: true,
    type: ReferenceSchema
  },
  "location" : {
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
  "bodySite" : {
    optional: true,
    type: Array
  },
  "bodySite.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },

  "outcome" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "report" : {
    optional: true,
    type: Array
  },
  "report.$" : {
    optional: true,
    type: ReferenceSchema 
  },
  "complication" : {
    optional: true,
    type: Array
  },
  "complication.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "complicationDetail" : {
    optional: true,
    type: Array
  },
  "complicationDetail.$" : {
    optional: true,
    type: ReferenceSchema 
  },
  "followUp" : {
    optional: true,
    type: Array
  },
  "followUp.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "note" : {
    optional: true,
    type: Array
  },
  "note.$" : {
    optional: true,
    type: AnnotationSchema 
  },
  "focalDevice" : {
    optional: true,
    type:  Array
    },
  "focalDevice.$" : {
    optional: true,
    type:  Object 
    },  
  "focalDevice.$.action" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "focalDevice.$.manipulated" : {
    optional: true,
    type: ReferenceSchema
  },
  "usedReference" : {
    optional: true,
    type: Array
  },
  "usedReference.$" : {
    optional: true,
    type: ReferenceSchema 
  },
  "usedCode" : {
    optional: true,
    type: Array
  },
  "usedCode.$" : {
    optional: true,
    type: CodeableConceptSchema 
  }
});

let ProcedureSchema = ProcedureR4;

// BaseSchema.extend(ProcedureSchema);
// DomainResourceSchema.extend(ProcedureSchema);

// Procedures.attachSchema(ProcedureSchema);
// TODO: Collection2 package needs to be installed for attachSchema to work in Meteor v3

export { Procedure, Procedures, ProcedureSchema, ProcedureDstu2, ProcedureStu3, ProcedureR4 };