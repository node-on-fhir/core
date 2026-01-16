// import { get } from 'lodash';
// import validator from 'validator';

// import BaseModel from '../../BaseModel';
// import { Mongo } from 'meteor/mongo';
// import SimpleSchema from 'simpl-schema';

// // REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// // so please remove references from the following line
// // and replace with import from ../../datatypes/*
// import {  AddressSchema, AnnotationSchema, BaseSchema, ContactPointSchema, CodeableConceptSchema, DomainResourceSchema, IdentifierSchema,  MoneySchema, PeriodSchema, QuantitySchema, ReferenceSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';
// import CodeableReferenceSchema from '../../../datatypes/CodeableReference';

// // if(Package['clinical:autopublish']){
// //   console.log("*****************************************************************************")
// //   console.log("HIPAA WARNING:  Your app has the 'clinical-autopublish' package installed.");
// //   console.log("Any protected health information (PHI) stored in this app should be audited."); 
// //   console.log("Please consider writing secure publish/subscribe functions and uninstalling.");  
// //   console.log("");  
// //   console.log("meteor remove clinical:autopublish");  
// //   console.log("");  
// // }
// // if(Package['autopublish']){
// //   console.log("*****************************************************************************")
// //   console.log("HIPAA WARNING:  DO NOT STORE PROTECTED HEALTH INFORMATION IN THIS APP. ");  
// //   console.log("Your application has the 'autopublish' package installed.  Please uninstall.");
// //   console.log("");  
// //   console.log("meteor remove autopublish");  
// //   console.log("meteor add clinical:autopublish");  
// //   console.log("");  
// // }


// // create the object using our BaseModel
// let ClinicalImpressionResource = BaseModel.extend();

// ClinicalImpressionResources = new Mongo.Collection('ClinicalImpressionResources');

// //Assign a collection so the object knows how to perform CRUD operations
// ClinicalImpressionResource.prototype._collection = ClinicalImpressionResources;



// //Add the transform to the collection since Meteor.users is pre-defined by the accounts package
// ClinicalImpressionResources._transform = function (document) {
//   return new ClinicalImpressionResource(document);
// };

// let ClinicalImpressionResourceSchema = DomainResourceSchema.extend({
//   "resourceType" : {
//     type: String,
//     defaultValue: "ClinicalImpression"
//   },
//   "identifier" : {
//     optional: true,
//     type:  Array
//     },
//   "identifier.$" : {
//     optional: true,
//     type:  IdentifierSchema 
//     },    
//   "extension" : {
//     optional: true,
//     type:  Array
//     },
//   "extension.$" : {
//     optional: true,
//     blackbox: true,
//     type:  Object 
//     },
//   "modifierExtension" : {
//     optional: true,
//     type:  Array
//     },
//   "modifierExtension.$" : {
//     optional: true,
//     blackbox: true,
//     type:  Object 
//     },

//     "status" : {
//         type: Code,
//         allowedValues: [
//             'preparation',
//             'in-progress',
//             'not-done',
//             'on-hold',
//             'stopped',
//             'completed',
//             'entered-in-error',
//             'unknow'
//         ]
//         },    
//     "statusReason" : {
//         optional: true,
//         type: CodeableConceptSchema 
//         },
//     "description" : {
//         optional: true,
//         type: String
//         },
//     "subject" : {
//         optional: true,
//         type: ReferenceSchema
//         },
//     "encounter" : {
//         optional: true,
//         type: ReferenceSchema
//         },
//     "effectivePeriod" : {
//         optional: true,
//         type: PeriodSchema
//         },
//     "effectiveDate" : {
//         optional: true,
//         type: Date
//         },
//     "date" : {
//         optional: true,
//         type: Date
//         },
            


//     "performer" : {
//         optional: true,
//         type: Array
//         },
//     "performer.$" : {
//         optional: true,
//         type: ReferenceSchema 
//         },   
//     "previous" : {
//         optional: true,
//         type: Array
//         },
//     "previous.$" : {
//         optional: true,
//         type: ReferenceSchema 
//         },   
//     "problem" : {
//         optional: true,
//         type: Array
//         },
//     "problem.$" : {
//         optional: true,
//         type: ReferenceSchema 
//         },   
//     "changePattern" : {
//         optional: true,
//         type: CodeableConceptSchema 
//         },                
//     "protocol" : {
//         optional: true,
//         type: String 
//         },                
//     "summary" : {
//         optional: true,
//         type: String 
//         },                
                
//     "finding" : {
//         optional: true,
//         type: Array
//         },
//     "finding.$" : {
//         optional: true,
//         type: Object 
//         },   
//     "finding.$.item" : {
//         optional: true,
//         type: CodeableReferenceSchema 
//         },   
//     "finding.$.basis" : {
//         optional: true,
//         type: String 
//         },   
//     "prognonsisCodeableConcept" : {
//         optional: true,
//         type: Array 
//         },                 
//     "prognonsisCodeableConcept.$" : {
//         optional: true,
//         type: CodeableConceptSchema 
//         },                 
//     "prognonsisReference" : {
//         optional: true,
//         type: Array 
//         },                 
//     "prognonsisReference.$" : {
//         optional: true,
//         type: ReferenceSchema 
//         },                 
//     "supportingInfo" : {
//         optional: true,
//         type: Array 
//         },                 
//     "supportingInfo.$" : {
//         optional: true,
//         type: ReferenceSchema 
//         },                 
//     "note" : {
//         optional: true,
//         type: Array 
//         },                 
//     "note.$" : {
//         optional: true,
//         type: AnnotationSchema 
//         }        
// });

// // ClinicalImpressionResources.attachSchema(ClinicalImpressionResourceSchema);

// export default { ClinicalImpressionResource, ClinicalImpressionResources, ClinicalImpressionResourceSchema };