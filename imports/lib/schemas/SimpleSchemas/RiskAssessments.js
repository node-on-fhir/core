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
import { CodeableConceptSchema, BaseSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, SignatureSchema, PeriodSchema } from 'meteor/clinical:hl7-resource-datatypes';


// create the object using our BaseModel
let RiskAssessment = BaseModel.extend();

export let RiskAssessments = new Mongo.Collection('RiskAssessments');


//Assign a collection so the object knows how to perform CRUD operations
RiskAssessment.prototype._collection = RiskAssessments;



//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
RiskAssessments._transform = function (document) {
  return new RiskAssessment(document);
};




let RiskAssessmentSchema = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "RiskAssessment"
  },
    "_id" : {
    optional: true,
    type:  String
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
  "text" : {
    optional: true,
    type: String
   },
  "status" : {
    type: Code,
    allowedValues: [ 'registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered-in-error', 'unknown'],
    defaultValue: 'completed'
  },
  "subject" : {
    optional: true,
    type: ReferenceSchema
   }, // Who/what does assessment apply to?
  "occurrenceDateTime" : {
    optional: true,
    type: Date
  }, // When was assessment made?
  "occurrencePeriod" : {
    optional: true,
    type: PeriodSchema
  }, // When was assessment made?
  "condition" : {
    optional: true,
    type: ReferenceSchema
  }, // (Condition) assessed
  "encounter" : {
    optional: true,
    type: ReferenceSchema
  }, // (Encounter) Where was assessment performed?
  "performer" : {
    optional: true,
    type: ReferenceSchema
  }, // (Practitioner|Device) Who did assessment?

  "method" : {
    optional: true,
    type: CodeableConceptSchema
  }, // Evaluation mechanism
  "basis" : {
    optional: true,
    type: Array
  }, // Information used in assessment
  "basis.$" : {
    optional: true,
    type: ReferenceSchema 
  }, // Information used in assessment
  "prediction.$.title" : {
    optional: true,
    type: String
  }, // R!  Possible outcome for the subject
  "prediction" : {
    optional: true,
    type:  Array
    },
  "prediction.$" : {
    optional: true,
    type:  Object 
    },
  "prediction.$.outcome" : {
    optional: true,
    type: CodeableConceptSchema
  }, // R!  Possible outcome for the subject
  "prediction.$.probabilityDecimal" : {
    optional: true,
    type: Number
  },
  "prediction.$.probabilityRange" : {
    optional: true,
    type: RangeSchema
  },
  "prediction.$.probabilityCodeableConcept" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "prediction.$.relativeRisk" : {
    optional: true,
    type: Number
  }, // Relative likelihood
  "prediction.$.whenPeriod" : {
    optional: true,
    type: PeriodSchema
  },
  "prediction.$.whenRange" : {
    optional: true,
    type: RangeSchema
  },
  "prediction.$.rational" : {
    optional: true,
    type: String
  }, // Explanation of prediction
  "mitigation" : {
    optional: true,
    type: String
  }

});

BaseSchema.extend(RiskAssessmentSchema);
DomainResourceSchema.extend(RiskAssessmentSchema);

// RiskAssessments.attachSchema(RiskAssessmentSchema);

export default { RiskAssessment, RiskAssessments, RiskAssessmentSchema };