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
import { BaseSchema, CodingSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, SignatureSchema, CodeableConceptSchema, PeriodSchema } from 'meteor/clinical:hl7-resource-datatypes';


// // create the object using our BaseModel
let Measure = BaseModel.extend();

let Measures = new Mongo.Collection('Measures');

// //Assign a collection so the object knows how to perform CRUD operations
Measure.prototype._collection = Measures;

// Create a persistent data store for addresses to be stored.
// HL7.Resources.Measures = new Mongo.Collection('HL7.Resources.Measures');




// //Add the transform to the collection since Meteor.users is pre-defined by the accounts package
// Measures._transform = function (document) {
//   return new Measure(document);
// };



// ===================================================

let MeasureSchemaR4 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Measure"
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
  "status" : {
    optional: true,
    allowedValues: ['draft', 'active', 'retired', 'unknown'],
    type: String
  },
  "experimental" : {
    optional: true,
    type: Boolean
  },
  "name" : {
    optional: true,
    type:  String
    },
  "title" : {
    optional: true,
    type:  String
    },
  "description" : {
    optional: true,
    type:  String
    },
  "subtitle" : {
    optional: true,
    type:  String
    },
  "version" : {
    optional: true,
    type:  String
    },

  'date' : {
    optional: true,
    type: Date
  },
  "publisher" : {
    optional: true,
    type:  String
    },
  "usage" : {
    optional: true,
    type:  String
    },
  "copyright" : {
    optional: true,
    type:  String
    },

  'approvalDate' : {
      optional: true,
      type: Date
    },
  'lastReviewDate' : {
    optional: true,
    type: Date
  },
  "effectivePeriod" : {
    optional: true,
    type: PeriodSchema
  },
  "topic" : {
    optional: true,
    type: Array
  }, 
  "topic.$" : {
    optional: true,
    type: CodeableConceptSchema
  }, 
  "author" : {
    optional: true,
    type: Array
  },
  "author.$" : {
    optional: true,
    blackbox: true,
    type: Object
  },
  "editor" : {
    optional: true,
    type: Array
  },
  "editor.$" : {
    optional: true,
    blackbox: true,
    type: Object
  },
  "reviewer" : {
    optional: true,
    type: Array
  },
  "reviewer.$" : {
    optional: true,
    blackbox: true,
    type: Object
  },
  "endorser" : {
    optional: true,
    type: Array
  },
  "endorser.$" : {
    optional: true,
    blackbox: true,
    type: Object
  },
  "disclaimer" : {
    optional: true,
    type:  String
    },
  "scoring" : {
    optional: true,
    type: CodeableConceptSchema
  }, 
  "compositeScoring" : {
    optional: true,
    type: CodeableConceptSchema
  }, 
  "type" : {
    optional: true,
    type: Array
  }, 
  "type.$" : {
    optional: true,
    blackbox: true,
    type: CodeableConceptSchema
  }, 
  "riskAdjustment" : {
    optional: true,
    type:  String
    },
  "rateAggregation" : {
    optional: true,
    type:  String
    },
  "rationale" : {
    optional: true,
    type:  String
    },
  "clinicalRecommendationStatement" : {
    optional: true,
    type:  String
    },
  "improvementNotation" : {
    optional: true,
    type:  CodeableConceptSchema
    },
  "definition" : {
    optional: true,
    type: Array
  }, 
  "definition.$" : {
    optional: true,
    type: CodeableConceptSchema
  }, 
  "guidance" : {
    optional: true,
    type:  String
    },
  "group" : {
    optional: true,
    blackbox: true,
    type: Array
  }, 
  "group.$" : {
    optional: true,
    blackbox: true,
    type: Object
  }, 
  "supplementalData" : {
    optional: true,
    blackbox: true,
    type: Array
  }, 
  "supplementalData.$" : {
    optional: true,
    blackbox: true,
    type:  Object
    }
});


// ===================================================

let MeasureSchemaR5 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Measure"
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
  "url" : {
    optional: true,
    type:  String
  },
  "version" : {
    optional: true,
    type:  String
    },
  "versionAlgorithmString" : {
    optional: true,
    type:  String
    },
  "versionAlgorithmCoding" : {
    optional: true,
    type:  CodingSchema
    },
  "name" : {
    optional: true,
    type:  String
    },
  "title" : {
    optional: true,
    type:  String
    },
  "description" : {
    optional: true,
    type:  String
    },
  "subtitle" : {
    optional: true,
    type:  String
    },
  "status" : {
    optional: true,
    allowedValues: ['draft', 'active', 'retired', 'unknown'],
    type: String
  },
  "experimental" : {
    optional: true,
    type: Boolean
  },

  "subjectReference" : {
    optional: true,
    type:  ReferenceSchema
    },
  "subjectCodeableConcept" : {
    optional: true,
    type:  CodeableConceptSchema
    },
  "basis" : {
    optional: true,
    type:  String
    },  
  'date' : {
    optional: true,
    type: Date
  },
  "publisher" : {
    optional: true,
    type:  String
    },
  "contact" : {
    optional: true,
    type: Array
  }, 
  "contact.$" : {
    optional: true,
    type: ContactPointSchema
  }, 
  "usage" : {
    optional: true,
    type:  String
    },
  "useContext" : {
    optional: true,
    type:  Array
    },
  "useContext.$" : {
    optional: true,
    blackbox: true,
    type:  Object
    },
  "jurisdiction" : {
    optional: true,
    type:  Array
    },
  "jurisdiction.$" : {
    optional: true,
    blackbox: true,
    type:  CodeableConceptSchema
    },
  "purpose" : {
    optional: true,
    type:  String
    },
  "usage" : {
    optional: true,
    type:  String
    },
  "copyright" : {
    optional: true,
    type:  String
    },
  "copyrightLabel" : {
    optional: true,
    type:  String
    },
  'approvalDate' : {
      optional: true,
      type: Date
    },
  'lastReviewDate' : {
    optional: true,
    type: Date
  },
  "effectivePeriod" : {
    optional: true,
    type: PeriodSchema
  },
  "topic" : {
    optional: true,
    type: Array
  }, 
  "topic.$" : {
    optional: true,
    type: CodeableConceptSchema
  }, 
  "author" : {
    optional: true,
    type: Array
  },
  "author.$" : {
    optional: true,
    blackbox: true,
    type: Object
  },
  "editor" : {
    optional: true,
    type: Array
  },
  "editor.$" : {
    optional: true,
    blackbox: true,
    type: Object
  },
  "reviewer" : {
    optional: true,
    type: Array
  },
  "reviewer.$" : {
    optional: true,
    blackbox: true,
    type: Object
  },
  "endorser" : {
    optional: true,
    type: Array
  },
  "endorser.$" : {
    optional: true,
    blackbox: true,
    type: Object
  },


  "disclaimer" : {
    optional: true,
    type:  String
    },
  "scoring" : {
    optional: true,
    type: CodeableConceptSchema
  }, 
  "scoringUnit" : {
    optional: true,
    type: CodeableConceptSchema
  }, 
  "compositeScoring" : {
    optional: true,
    type: CodeableConceptSchema
  }, 
  "type" : {
    optional: true,
    type: Array
  }, 
  "type.$" : {
    optional: true,
    blackbox: true,
    type: CodeableConceptSchema
  }, 
  "riskAdjustment" : {
    optional: true,
    type:  String
    },
  "rateAggregation" : {
    optional: true,
    type:  String
    },    
  "rationale" : {
    optional: true,
    type:  String
    },
  "clinicalRecommendationStatement" : {
    optional: true,
    type:  String
    },
  "improvementNotation" : {
    optional: true,
    type:  CodeableConceptSchema
    },


  "term" : {
    optional: true,
    type: Array
  }, 
  "term.$" : {
    optional: true,
    type: Object
  }, 
  "term.$.code" : {
    optional: true,
    type: CodeableConceptSchema
  }, 
  "term.$.definition" : {
    optional: true,
    type: String
  }, 
  "guidance" : {
    optional: true,
    type:  String
    },

  "group" : {
    optional: true,
    blackbox: true,
    type: Array
  }, 
  "group.$" : {
    optional: true,
    blackbox: true,
    type: Object
  }, 
  "group.$.linkId" : {
    optional: true,
    type: String
  }, 
  "group.$.code" : {
    optional: true,
    type: CodeableConceptSchema
  }, 
  "group.$.description" : {
    optional: true,
    type: String
  }, 
  "group.$.criteria" : {
    optional: true,
    type: Object,
    blackbox: true
  }, 
  "group.$.groupDefinition" : {
    optional: true,
    type: ReferenceSchema
  }, 
  "group.$.inputPopulationId" : {
    optional: true,
    type: String
  }, 
  "group.$.aggregateMethod" : {
    optional: true,
    type: CodeableConceptSchema
  }, 
  "stratifier" : {
    optional: true,
    blackbox: true,
    type: Array
  }, 
  "stratifier.$" : {
    optional: true,
    blackbox: true,
    type:  Object
    },
  "stratifier.$.linkId" : {
    optional: true,
    type:  String
    },
  "stratifier.$.code" : {
    optional: true,
    type:  CodeableConceptSchema
    },
  "stratifier.$.description" : {
    optional: true,
    type:  String
    },
  "stratifier.$.criteria" : {
    optional: true,
    type:  Object,
    blackbox: true
    },
  "stratifier.$.groupDefinition" : {
    optional: true,
    type:  ReferenceSchema
    },
  "stratifier.$.component" : {
    optional: true,
    type:  Array
    },
  "stratifier.$.component.$" : {
    optional: true,
    type:  Object,
    blackbox: true
    },
  "stratifier.$.component.$.linkId" : {
    optional: true,
    type:  String
    },
  "stratifier.$.component.$.code" : {
    optional: true,
    type:  CodeableConceptSchema
    },
  "stratifier.$.component.$.description" : {
    optional: true,
    type:  String
    },
  "stratifier.$.component.$.criteria" : {
    optional: true,
    type:  Object,
    blackbox: true
    },
  "stratifier.$.component.$.groupDefinition" : {
    optional: true,
    type:  ReferenceSchema
    },
                        

  "supplementalData" : {
    optional: true,
    blackbox: true,
    type: Array
  }, 
  "supplementalData.$" : {
    optional: true,
    blackbox: true,
    type:  Object
    },

  "supplementalData.$.linkId" : {
    optional: true,
    type:  String
    },
  "supplementalData.$.code" : {
    optional: true,
    type:  CodeableConceptSchema
    },
  "supplementalData.$.usage" : {
    optional: true,
    type:  CodeableConceptSchema
    },
  "supplementalData.$.description" : {
    optional: true,
    type:  String
    },
  "supplementalData.$.criteria" : {
    optional: true,
    type:  Object,
    blackbox: true
    }
});


let MeasureSchema = MeasureSchemaR5;

// Comment out attachSchema to avoid error - following pattern from Devices.js
// Measures.attachSchema(MeasureSchema);

export { MeasureSchema, MeasureSchemaR4, Measure, Measures }