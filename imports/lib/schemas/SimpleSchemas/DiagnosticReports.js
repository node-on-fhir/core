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
import { BaseSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';



// create the object using our BaseModel
let DiagnosticReport = BaseModel.extend();

export let DiagnosticReports = new Mongo.Collection('DiagnosticReports');

//Assign a collection so the object knows how to perform CRUD operations
DiagnosticReport.prototype._collection = DiagnosticReports;

// // // Create a persistent data store for addresses to be stored.
// // // HL7.Resources.Patients = new Mongo.Collection('HL7.Resources.Patients');
// if(typeof DiagnosticReports === 'undefined'){
//   if(Package['clinical:autopublish']){
//     DiagnosticReports = new Mongo.Collection('DiagnosticReports');
//   } else if(Package['clinical:desktop-publish']){    
//     DiagnosticReports = new Mongo.Collection('DiagnosticReports');
//   } else {
//     DiagnosticReports = new Mongo.Collection('DiagnosticReports', {connection: null});
//   }
// }



//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
DiagnosticReports._transform = function (document) {
  return new DiagnosticReport(document);
};


// DSTU2
// https://www.hl7.org/fhir/DSTU2/diagnosticreport.html
let DiagnosticReportDstu2 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "DiagnosticReport"
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
    type: Code,
    allowedValues: ['registered', 'partial', 'final', 'corrected', 'appended', 'cancelled', 'entered-in-error']
  }, 
  "category" : {
    optional: true,
    type: CodeableConceptSchema
  }, // Classification of  type of observation
  "code" : {
    optional: true,
    type: CodeableConceptSchema
  }, // R!  Type of observation (code / type)
  "subject" : {
    optional: true,
    type: ReferenceSchema
  }, // (Patient|Group|Device|Location) Who and/or what this is about
  "encounter" : {
    optional: true,
    type: ReferenceSchema
  }, 
  "effectiveDateTime" : {
    optional: true,
    type: Date
  },
  "effectivePeriod" : {
    optional: true,
    type: PeriodSchema
  },
  "issued" : {
    type: Date
  }, // Date/Time this was made available
  "performer" : {
    type: ReferenceSchema
  }, 
  "specimen" : {
    optional: true,
    type: ReferenceSchema
  }, // Specimens this report is based on
  "result" : {
    optional: true,
    type: Array
  }, // DiagnosticReports - simple, or complex nested groups
  "result.$" : {
    optional: true,
    type: ReferenceSchema
  }, // DiagnosticReports - simple, or complex nested groups

  "imagingStudy" : {
    optional: true,
    type: Array
  }, // Reference to full details of imaging associated with the diagnostic report
  "imagingStudy.$" : {
    optional: true,
    type: ReferenceSchema
  }, // Reference to full details of imaging associated with the diagnostic report
  "image" : {
    optional: true,
    type:  Array
    },
  "image.$" : {
    optional: true,
    type:  Object 
    },
  "image.$.comment" : {
    optional: true,
    type: String
  }, // Comment about the image (e.g. explanation)
  "image.$.link" : {
    type: ReferenceSchema
  }, // R!  Reference to the image source
  "conclusion" : {
    optional: true,
    type: String
  }, // Clinical Interpretation of test results
  "codedDiagnosis" : {
    optional: true,
    type: Array
  }, // Codes for the conclusion
  "codedDiagnosis.$" : {
    optional: true,
    type: CodeableConceptSchema 
  }, // Codes for the conclusion
  "presentedForm" : {
    optional: true,
    type: Array
  }, // Entire report as issued
  "presentedForm.$" : {
    optional: true,
    type: AttachmentSchema 
  } // Entire report as issued
});


let DiagnosticReportStu3 = new SimpleSchema({
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
    defaultValue: "Patient"
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
  "basedOn" : {
    optional: true,
    type: ReferenceSchema
  }, // (Patient|Group|Device|Location) Who and/or what this is about    
  "status" : {
    type: Code,
    allowedValues: ['registered', 'partial', 'preliminary', 'final']
  }, 
  "category" : {
    optional: true,
    type: CodeableConceptSchema
  }, // Classification of  type of observation
  "code" : {
    optional: true,
    type: CodeableConceptSchema
  }, // R!  Type of observation (code / type)
  "subject" : {
    optional: true,
    type: ReferenceSchema
  }, // (Patient|Group|Device|Location) Who and/or what this is about
  "context" : {
    optional: true,
    type: ReferenceSchema
  }, 
  "effectiveDateTime" : {
    optional: true,
    type: Date
  },
  "effectivePeriod" : {
    optional: true,
    type: PeriodSchema
  },
  "issued" : {
    optional: true,
    type: Date
  }, // Date/Time this was made available
  "performer" : {
    optional: true,
    type: Array
  }, 
  "performer.$" : {
    optional: true,
    type: Object
  }, 
  "performer.role" : {
    optional: true,
    type: CodeableConceptSchema
  }, 
  "performer.actor" : {
    type: ReferenceSchema
  }, 
  "specimen" : {
    optional: true,
    type: Array
  }, // Specimens this report is based on
  "specimen.$" : {
    optional: true,
    type: ReferenceSchema
  }, // Specimens this report is based on
  "result" : {
    optional: true,
    type: Array
  }, // DiagnosticReports - simple, or complex nested groups
  "result.$" : {
    optional: true,
    type: ReferenceSchema
  }, // DiagnosticReports - simple, or complex nested groups

  "imagingStudy" : {
    optional: true,
    type: Array
  }, // Reference to full details of imaging associated with the diagnostic report
  "imagingStudy.$" : {
    optional: true,
    type: ReferenceSchema
  }, // Reference to full details of imaging associated with the diagnostic report
  "image" : {
    optional: true,
    type:  Array
    },
  "image.$" : {
    optional: true,
    type:  Object 
    },
  "image.$.comment" : {
    optional: true,
    type: String
  }, // Comment about the image (e.g. explanation)
  "image.$.link" : {
    type: ReferenceSchema
  }, // R!  Reference to the image source
  "conclusion" : {
    optional: true,
    type: String
  }, // Clinical Interpretation of test results
  "codedDiagnosis" : {
    optional: true,
    type: Array
  }, // Codes for the conclusion
  "codedDiagnosis.$" : {
    optional: true,
    type: CodeableConceptSchema 
  }, // Codes for the conclusion
  "presentedForm" : {
    optional: true,
    type: Array
  }, // Entire report as issued
  "presentedForm.$" : {
    optional: true,
    type: AttachmentSchema 
  } // Entire report as issued
});


let DiagnosticReportR4 = new SimpleSchema({
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
    defaultValue: "Patient"
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
  "basedOn" : {
    optional: true,
    type: ReferenceSchema
  }, // (Patient|Group|Device|Location) Who and/or what this is about    
  "status" : {
    type: Code,
    allowedValues: ['registered', 'partial', 'preliminary', 'final']
  }, 
  "category" : {
    optional: true,
    type: Array
  }, // Classification of  type of observation
  "category.$" : {
    optional: true,
    type: CodeableConceptSchema
  }, // Classification of  type of observation
  "code" : {
    optional: true,
    type: CodeableConceptSchema
  }, // R!  Type of observation (code / type)
  "subject" : {
    optional: true,
    type: ReferenceSchema
  }, // (Patient|Group|Device|Location) Who and/or what this is about
  "context" : {
    optional: true,
    type: ReferenceSchema
  }, 
  "effectiveDateTime" : {
    optional: true,
    type: Date
  },
  "effectivePeriod" : {
    optional: true,
    type: PeriodSchema
  },
  "issued" : {
    optional: true,
    type: Date
  }, // Date/Time this was made available
  "performer" : {
    optional: true,
    type: Array
  }, 
  "performer.$" : {
    optional: true,
    type: Object
  }, 
  "performer.role" : {
    optional: true,
    type: CodeableConceptSchema
  }, 
  "performer.actor" : {
    type: ReferenceSchema
  }, 
  "specimen" : {
    optional: true,
    type: Array
  }, // Specimens this report is based on
  "specimen.$" : {
    optional: true,
    type: ReferenceSchema
  }, // Specimens this report is based on
  "result" : {
    optional: true,
    type: Array
  }, // DiagnosticReports - simple, or complex nested groups
  "result.$" : {
    optional: true,
    type: ReferenceSchema
  }, // DiagnosticReports - simple, or complex nested groups

  "imagingStudy" : {
    optional: true,
    type: Array
  }, // Reference to full details of imaging associated with the diagnostic report
  "imagingStudy.$" : {
    optional: true,
    type: ReferenceSchema
  }, // Reference to full details of imaging associated with the diagnostic report
  "image" : {
    optional: true,
    type:  Array
    },
  "image.$" : {
    optional: true,
    type:  Object 
    },
  "image.$.comment" : {
    optional: true,
    type: String
  }, // Comment about the image (e.g. explanation)
  "image.$.link" : {
    type: ReferenceSchema
  }, // R!  Reference to the image source
  "conclusion" : {
    optional: true,
    type: String
  }, // Clinical Interpretation of test results
  "codedDiagnosis" : {
    optional: true,
    type: Array
  }, // Codes for the conclusion
  "codedDiagnosis.$" : {
    optional: true,
    type: CodeableConceptSchema 
  }, // Codes for the conclusion
  "presentedForm" : {
    optional: true,
    type: Array
  }, // Entire report as issued
  "presentedForm.$" : {
    optional: true,
    type: AttachmentSchema 
  } // Entire report as issued
});

let DiagnosticReportSchema = DiagnosticReportR4;

// BaseSchema.extend(DiagnosticReportSchema);
// DomainResourceSchema.extend(DiagnosticReportSchema);
// DiagnosticReports.attachSchema(DiagnosticReportSchema);

export default { DiagnosticReport, DiagnosticReports, DiagnosticReportSchema, DiagnosticReportDstu2, DiagnosticReportStu3 };