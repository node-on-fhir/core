import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import { BaseSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, RatioSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';

// Import Substances from its own module to avoid duplicate collection definition
import { Substances } from './Substances';

// create the object using our BaseModel
let Medication = BaseModel.extend();
let Substance = BaseModel.extend();

export let Medications = new Mongo.Collection('Medications');
// Re-export Substances from its own module (no longer creating duplicate here)
export { Substances };

//Assign a collection so the object knows how to perform CRUD operations
Medication.prototype._collection = Medications;
Substance.prototype._collection = Substances;


// // Create a persistent data store for addresses to be stored.
// // HL7.Resources.Patients = new Mongo.Collection('HL7.Resources.Patients');

// if(typeof Medications === 'undefined'){
//   if(Package['autopublish']){
//     Medications = new Mongo.Collection('Medications');
//     Substances = new Mongo.Collection('Substances');
//   } else if(Package['clinical:autopublish']){    
//     Medications = new Mongo.Collection('Medications');
//     Substances = new Mongo.Collection('Substances');
//   } else if(Package['clinical:desktop-publish']){    
//     Medications = new Mongo.Collection('Medications');
//     Substances = new Mongo.Collection('Substances');
//   } else {
//     Medications = new Mongo.Collection('Medications', {connection: null});
//     Substances = new Mongo.Collection('Substances', {connection: null});
//   }
// }



//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Medications._transform = function (document) {
  return new Medication(document);
};
Substances._transform = function (document) {
  return new Substance(document);
};


let MedicationDstu2 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Medication"
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
  "code" :  {
    optional: true,
    type: CodeableConceptSchema
  },
  "isBrand" :  {
    optional: true,
    type: Boolean
  }, // True if a brand
  "manufacturer" :  {
    optional: true,
    type: ReferenceSchema
  },// (Organization) // Manufacturer of the item
  "product" :  {
    optional: true,
    type: Object
  }, 

  "product.form" :  {
    optional: true,
    type: CodeableConceptSchema
  }, // powder | tablets | carton +
  "product.ingredient" :  {
    type: Array,
    optional: true
  }, 
  "product.ingredient.$" :  {
    type: Object,
    optional: true,
    blackbox: true
  }, 

  "product.batch.$" :  {
    optional: true,
    type: Object
  },

  "product.batch" :  {
    optional: true,
    type: Array
  },
  "product.batch.$.lotNumber" :  {
    optional: true,
    type: String
  },
  "product.batch.$.expirationDate" :  {
    optional: true,
    type: Date
  },
  "package" :  {
    optional: true,
    type: Object
   }, 

  "package.container" :  {
    optional: true,
    type: CodeableConceptSchema
   }, // E.g. box, vial, blister-pack

   "package.content" :  {
    optional: true,
    type: Array
  }, 
   "package.content.$" :  {
    optional: true,
    type: Object
  }, 

  "package.content.$.item" :  {
    optional: true,
    type: ReferenceSchema
  }, //(Medication) }, // R!  A product in the package
  "package.content.$.amount" :  {
    optional: true,
    type: QuantitySchema // (SimpleQuantity)
  }, // Quantity present in the package
  "url": {
    optional: true,
    type: String
  }
});



let MedicationStu3 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Medication"
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
  "code" :  {
    optional: true,
    type: CodeableConceptSchema
  },
  "isBrand" :  {
    optional: true,
    type: Boolean
  }, // True if a brand
  "isOverTheCounter" :  {
    optional: true,
    type: Boolean
  }, // True if a brand
  "manufacturer" :  {
    optional: true,
    type: ReferenceSchema
  },// (Organization) // Manufacturer of the item
  "form" :  {
    optional: true,
    type: CodeableConceptSchema
  }, // powder | tablets | capsule +
  "ingredient" :  {
    optional: true,
    type: Array
  }, 
  "ingredient.$" :  {
    optional: true,
    type: Object
  }, 
  "ingredient.$.itemCodeableConcept" :  {
    optional: true,
    type: CodeableConceptSchema
  }, 
  "ingredient.$.itemReference" :  {
    optional: true,
    type: ReferenceSchema
  }, 
  "ingredient.$.isActive" :  {
    optional: true,
    type: Boolean
  }, 
  "ingredient.$.amount" :  {
    optional: true,
    type: RatioSchema
  },
  "package" :  {
    optional: true,
    type: Object
   }, 

  "package.container" :  {
    optional: true,
    type: CodeableConceptSchema
   }, // E.g. box, vial, blister-pack

   "package.content" :  {
    optional: true,
    type: Array
  }, 
   "package.content.$" :  {
    optional: true,
    type: Object
  }, 
  "package.content.$.itemCodeableConcept" :  {
    optional: true,
    type: CodeableConceptSchema
  }, //(Medication) }, // R!  A product in the package
  "package.content.$.itemReference" :  {
    optional: true,
    type: ReferenceSchema
  }, //(Medication) }, // R!  A product in the package
  "package.content.$.amount" :  {
    optional: true,
    type: QuantitySchema // (SimpleQuantity)
  }, // Quantity present in the package
  "package.batch" :  {
    optional: true,
    type: Array
  }, 
  "package.batch.$" :  {
    optional: true,
    type: Object
  }, 
  "package.batch.$.lotNumber" :  {
    optional: true,
    type: String
  }, 
  "package.batch.$.expirationDate" :  {
    optional: true,
    type: Date
  }, 

  "image": {
    optional: true,
    type: Array
  },
  "image.$": {
    optional: true,
    type: AttachmentSchema
  }
});


let MedicationR4 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Medication"
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
  "code" :  {
    optional: true,
    type: CodeableConceptSchema
  },
  "status" : {
    optional: true,
    type:  String
    },
  "form" :  {
    optional: true,
    type: CodeableConceptSchema
  },
  "amount" :  {
    optional: true,
    type: RatioSchema
  },  
  "manufacturer" :  {
    optional: true,
    type: ReferenceSchema
  },
  "ingredient" :  {
    optional: true,
    type: Array
  },
  "ingredient.$" :  {
    optional: true,
    type: Object
  },
  "ingredient.$.itemCodeableConcept" :  {
    optional: true,
    type: CodeableConceptSchema
  },
  "ingredient.$.itemReference" :  {
    optional: true,
    type: ReferenceSchema
  },
  "ingredient.$.isActive" :  {
    optional: true,
    type: Boolean
  },
  "ingredient.$.strength" :  {
    optional: true,
    type: RatioSchema
  },
  "batch" :  {
    optional: true,
    type: Object
  },
  "batch.lotNumber" :  {
    optional: true,
    type: String
  },
  "batch.expirationDate" :  {
    optional: true,
    type: String
  },
});


let MedicationSchema = MedicationR4;

// BaseSchema.extend(MedicationSchema);
// DomainResourceSchema.extend(MedicationSchema);
// Medications.attachSchema(MedicationSchema);

export default { Medication, Medications, MedicationSchema, MedicationDstu2, MedicationStu3, MedicationR4, Substances, Substance };