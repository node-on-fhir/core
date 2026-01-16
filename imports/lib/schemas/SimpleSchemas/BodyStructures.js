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


import { get } from 'lodash';
import validator from 'validator';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import {  AddressSchema, AttachmentSchema, CodeableReferenceSchema, BaseSchema, ContactPointSchema, CodeableConceptSchema, DomainResourceSchema, IdentifierSchema,  MoneySchema, PeriodSchema, QuantitySchema, ReferenceSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';





// create the object using our BaseModel
let BodyStructure = BaseModel.extend();


export let BodyStructures = new Mongo.Collection('BodyStructures');

//Assign a collection so the object knows how to perform CRUD operations
BodyStructure.prototype._collection = BodyStructures;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
BodyStructures._transform = function (document) {
  return new BodyStructure(document);
};

let BodyStructureSchema = DomainResourceSchema.extend({
  "resourceType" : {
    type: String,
    defaultValue: "BodyStructure"
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
  "active" : {
    optional: true,
    type: Boolean
    },
  "morphology" : {
    optional: true,
    type: CodeableConceptSchema 
    },

    "includedStructure" : {
        optional: true,
        type: Array 
        },
    "includedStructure.$" : {
        optional: true,
        type: Object 
        },
    "includedStructure.structure" : {
        optional: true,
        type: CodeableConceptSchema 
        },
    "includedStructure.laterality" : {
        optional: true,
        type: CodeableConceptSchema 
        },
    "includedStructure.spatialReference" : {
        optional: true,
        type: ReferenceSchema 
        },
    "includedStructure.qualifier" : {
        optional: true,
        type: CodeableConceptSchema 
        },
    "includedStructure.bodyLandmarkOrientation" : {
        optional: true,
        type: Array 
        },
    "includedStructure.bodyLandmarkOrientation.$" : {
        optional: true,
        type: Object 
        },
    "includedStructure.bodyLandmarkOrientation.landmarkDescription" : {
        optional: true,
        type: CodeableConceptSchema 
        },
    "includedStructure.bodyLandmarkOrientation.clockFacePosition" : {
        optional: true,
        type: CodeableConceptSchema 
        },
    "includedStructure.bodyLandmarkOrientation.surfaceOrientation" : {
        optional: true,
        type: CodeableConceptSchema 
        },
    "includedStructure.bodyLandmarkOrientation.distanceFromLandmark" : {
        optional: true,
        type: Array 
        },
    "includedStructure.bodyLandmarkOrientation.distanceFromLandmark.$" : {
        optional: true,
        type: Object 
        },
    "includedStructure.bodyLandmarkOrientation.distanceFromLandmark.device" : {
        optional: true,
        blackbox: true,
        type: Object 
        },
    "includedStructure.bodyLandmarkOrientation.distanceFromLandmark.value" : {
        optional: true,
        type: QuantitySchema 
        },
    

    "excludedStructure" : {
        optional: true,
        type: Array 
        },
    "excludedStructure.$" : {
        optional: true,
        type: Object 
        },
    "excludedStructure.structure" : {
        optional: true,
        type: CodeableConceptSchema 
        },
    "excludedStructure.laterality" : {
        optional: true,
        type: CodeableConceptSchema 
        },
    "excludedStructure.spatialReference" : {
        optional: true,
        type: ReferenceSchema 
        },
    "excludedStructure.qualifier" : {
        optional: true,
        type: CodeableConceptSchema 
        },
    "excludedStructure.bodyLandmarkOrientation" : {
        optional: true,
        type: Array 
        },
    "excludedStructure.bodyLandmarkOrientation.$" : {
        optional: true,
        type: Object 
        },
    "excludedStructure.bodyLandmarkOrientation.landmarkDescription" : {
        optional: true,
        type: CodeableConceptSchema 
        },
    "excludedStructure.bodyLandmarkOrientation.clockFacePosition" : {
        optional: true,
        type: CodeableConceptSchema 
        },
    "excludedStructure.bodyLandmarkOrientation.surfaceOrientation" : {
        optional: true,
        type: CodeableConceptSchema 
        },
    "includedStructure.bodyLandmarkOrientation.distanceFromLandmark" : {
        optional: true,
        type: Array 
        },
    "includedStructure.bodyLandmarkOrientation.distanceFromLandmark.$" : {
        optional: true,
        type: Object 
        },
    "includedStructure.bodyLandmarkOrientation.distanceFromLandmark.device" : {
        optional: true,
        blackbox: true,
        type: Object 
        },
    "includedStructure.bodyLandmarkOrientation.distanceFromLandmark.value" : {
        optional: true,
        type: QuantitySchema 
        },

  "patient" : {
    optional: true,
    type: ReferenceSchema
    },
  "description" : {
    optional: true,
    type: String
    },
  "image" : {
        optional: true,
        type: AttachmentSchema
        }        
});

// BodyStructures.attachSchema(BodyStructureSchema);

export default { BodyStructure, BodyStructures, BodyStructureSchema };