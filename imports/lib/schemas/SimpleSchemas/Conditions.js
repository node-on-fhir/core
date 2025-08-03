
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
import { BaseSchema, DomainResourceSchema, IdentifierSchema, ReferenceSchema, ContactPointSchema, AddressSchema, SignatureSchema, CodeableConceptSchema, QuantitySchema, PeriodSchema, RangeSchema, Code } from 'meteor/clinical:hl7-resource-datatypes';
// import ReferenceSchema from '../../../datatypes/Reference';


// create the object using our BaseModel
let Condition = BaseModel.extend();


export let Conditions = new Mongo.Collection('Conditions');

//Assign a collection so the object knows how to perform CRUD operations
Condition.prototype._collection = Conditions;





//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Conditions._transform = function (document) {
  return new Condition(document);
};




let ConditionDstu2 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Condition"
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
  "patient" : {
    blackbox: true,
    type: ReferenceSchema
  }, // R!  (Patient) Who has the condition?
  "encounter" : {
    optional: true,
    type: ReferenceSchema
  }, // (Encounter) Encounter when condition first asserted
  "asserter" : {
    optional: true,
    type: ReferenceSchema
  }, // (Practitioner|Patient) Person who asserts this condition
  "dateRecorded" : {
    optional: true,
    type: Date
  }, // When first entered
  "code" : {
    type: CodeableConceptSchema
  }, // R!  Identification of the condition, problem or diagnosis
  "category" : {
    optional: true,
    type: CodeableConceptSchema
  }, // complaint | symptom | finding | diagnosis
  "clinicalStatus" : {
    optional: true,
    type: Code,
    allowedValues: ['active', 'relapse', 'remission', 'resolved']
  }, // 
  "verificationStatus" : {
    type: Code,
    allowedValues: ['provisional', 'differential', 'confirmed', 'refuted', 'entered-in-error', 'unknown']
  }, // R!  
  "severity" : {
    optional: true,
    type: CodeableConceptSchema
  }, // Subjective severity of condition
  "onsetDateTime" : {
    optional: true,
    type: Date
  },
  "onsetQuantity" : {
    optional: true,
    type: QuantitySchema
  }, //(Age)
  "onsetPeriod" : {
    optional: true,
    type: PeriodSchema
  },
  "onsetRange" : {
    optional: true,
    type: RangeSchema
  },
  "onsetString" : {
    optional: true,
    type: String
  },
  // abatement[x]: If/when in resolution/remission. One of these 6:
  "abatementDateTime" : {
    optional: true,
    type: Date
  },
  "abatementQuantity" : {
    optional: true,
    type: QuantitySchema
  }, //(Age)
  "abatementBoolean" : {
    optional: true,
    type: Boolean
  },
  "abatementPeriod" : {
    optional: true,
    type: PeriodSchema
  },
  "abatementRange" : {
    optional: true,
    type: RangeSchema
  },
  "abatementString" : {
    optional: true,
    type: String
  },
  "stage" : {
    optional: true,
    type: Object
  }, 
  "stage.summary" : {
    optional: true,
    type: CodeableConceptSchema
  }, // C? Simple summary (disease specific)
  "stage.assessment" : {
    optional: true,
    type: Array
  }, // (ClinicalImpression|DiagnosticReport|Observation) C? Formal record of assessment
  "stage.assessment.$" : {
    optional: true,
    type: ReferenceSchema 
  }, 
  "evidence" : {
    optional: true,
    type: Array
  }, 
  "evidence.$" : {
    optional: true,
    type: Object
  }, 
  "evidence.$.code" : {
    optional: true,
    type: CodeableConceptSchema
  }, // C? Manifestation/symptom
  "evidence.$.detail" : {
    optional: true,
    type:Array
  }, 
  "evidence.$.detail.$" : {
    optional: true,
    type: ReferenceSchema 
  }, 
  "bodySite" : {
    optional: true,
    type: Array
  }, // Anatomical location, if relevant
  "bodySite.$" : {
    optional: true,
    type: CodeableConceptSchema
  }, // Anatomical location, if relevant
  "notes" : {
    optional: true,
    type: String
  } // Additional information about the Condition
});


let ConditionStu3 = new SimpleSchema({
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
    defaultValue: "Condition"
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
  "clinicalStatus" : {
    optional: true,
    type: Code,
    allowedValues: ['active', 'recurrence', 'inactive', 'remission', 'resolved']
  }, // 
  "verificationStatus" : {
    optional: true,
    type: Code,
    allowedValues: ['provisional', 'differential', 'confirmed', 'refuted', 'entered-in-error', 'unknown']
  }, 
  "category" : {
    optional: true,
    type: Array
  }, 
  "category.$" : {
    optional: true,
    type: CodeableConceptSchema
  }, 
  "severity" : {
    optional: true,
    type: CodeableConceptSchema
  }, // Subjective severity of condition
  "code" : {
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
  "subject" : {
    type: ReferenceSchema
  },
  "asserter" : {
    optional: true,
    type: ReferenceSchema
  },
  "context" : {
    optional: true,
    type: ReferenceSchema
  },
  "onsetDateTime" : {
    optional: true,
    type: Date
  },
  "onsetAge" : {
    optional: true,
    type: QuantitySchema
  }, //(Age)
  "onsetPeriod" : {
    optional: true,
    type: PeriodSchema
  },
  "onsetRange" : {
    optional: true,
    type: RangeSchema
  },
  "onsetString" : {
    optional: true,
    type: String
  },

  // abatement[x]: If/when in resolution/remission. One of these 6:
  "abatementDateTime" : {
    optional: true,
    type: Date
  },
  "abatementAge" : {
    optional: true,
    type: QuantitySchema
  }, //(Age)
  "abatementBoolean" : {
    optional: true,
    type: Boolean
  },
  "abatementPeriod" : {
    optional: true,
    type: PeriodSchema
  },
  "abatementRange" : {
    optional: true,
    type: RangeSchema
  },
  "abatementString" : {
    optional: true,
    type: String
  },
  "stage" : {
    optional: true,
    type: Object
  }, 
  "stage.summary" : {
    optional: true,
    type: CodeableConceptSchema
  }, // C? Simple summary (disease specific)
  "stage.assessment" : {
    optional: true,
    type: Array
  }, // (ClinicalImpression|DiagnosticReport|Observation) C? Formal record of assessment
  "stage.assessment.$" : {
    optional: true,
    type: ReferenceSchema 
  }, 
  "evidence" : {
    optional: true,
    type: Array
  }, 
  "evidence.$" : {
    optional: true,
    type: Object
  }, 
  "evidence.$.code" : {
    optional: true,
    type: CodeableConceptSchema
  }, // C? Manifestation/symptom
  "evidence.$.detail" : {
    optional: true,
    type:Array
  }, 
  "evidence.$.detail.$" : {
    optional: true,
    type: ReferenceSchema 
  }, 
  "notes" : {
    optional: true,
    type: String
  } // Additional information about the Condition
});


let ConditionR4 = new SimpleSchema({
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
    defaultValue: "Condition"
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
  "clinicalStatus" : {
    optional: true,
    type: Code,
    allowedValues: ['active', 'recurrence', 'inactive', 'remission', 'resolved']
  }, // 
  "verificationStatus" : {
    optional: true,
    type: Code,
    allowedValues: ['provisional', 'differential', 'confirmed', 'refuted', 'entered-in-error', 'unknown']
  }, 
  "category" : {
    optional: true,
    type: Array
  }, 
  "category.$" : {
    optional: true,
    type: CodeableConceptSchema
  }, 
  "severity" : {
    optional: true,
    type: CodeableConceptSchema
  }, // Subjective severity of condition
  "code" : {
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
  "subject" : {
    optional: true,
    type: ReferenceSchema
  },
  "asserter" : {
    optional: true,
    type: ReferenceSchema
  },
  "context" : {
    optional: true,
    type: ReferenceSchema
  },
  "onsetDateTime" : {
    optional: true,
    type: Date
  },
  "onsetAge" : {
    optional: true,
    type: QuantitySchema
  }, //(Age)
  "onsetPeriod" : {
    optional: true,
    type: PeriodSchema
  },
  "onsetRange" : {
    optional: true,
    type: RangeSchema
  },
  "onsetString" : {
    optional: true,
    type: String
  },

  // abatement[x]: If/when in resolution/remission. One of these 6:
  "abatementDateTime" : {
    optional: true,
    type: Date
  },
  "abatementAge" : {
    optional: true,
    type: QuantitySchema
  }, //(Age)
  "abatementBoolean" : {
    optional: true,
    type: Boolean
  },
  "abatementPeriod" : {
    optional: true,
    type: PeriodSchema
  },
  "abatementRange" : {
    optional: true,
    type: RangeSchema
  },
  "abatementString" : {
    optional: true,
    type: String
  },
  "stage" : {
    optional: true,
    type: Object
  }, 
  "stage.summary" : {
    optional: true,
    type: CodeableConceptSchema
  }, // C? Simple summary (disease specific)
  "stage.assessment" : {
    optional: true,
    type: Array
  }, // (ClinicalImpression|DiagnosticReport|Observation) C? Formal record of assessment
  "stage.assessment.$" : {
    optional: true,
    type: ReferenceSchema 
  }, 
  "evidence" : {
    optional: true,
    type: Array
  }, 
  "evidence.$" : {
    optional: true,
    type: Object
  }, 
  "evidence.$.code" : {
    optional: true,
    type: CodeableConceptSchema
  }, // C? Manifestation/symptom
  "evidence.$.detail" : {
    optional: true,
    type:Array
  }, 
  "evidence.$.detail.$" : {
    optional: true,
    type: ReferenceSchema 
  }, 
  "notes" : {
    optional: true,
    type: String
  } // Additional information about the Condition
});



let ConditionSchema = ConditionR4;

BaseSchema.extend(ConditionSchema);
DomainResourceSchema.extend(ConditionSchema);
// Conditions.attachSchema(ConditionSchema);

export default { Condition, Conditions, ConditionSchema, ConditionStu3, ConditionDstu2 };