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
let Device = BaseModel.extend();

export let Devices = new Mongo.Collection('Devices');

//Assign a collection so the object knows how to perform CRUD operations
Device.prototype._collection = Devices;

// // Create a persistent data store for addresses to be stored.
// // HL7.Resources.Patients = new Mongo.Collection('HL7.Resources.Patients');
// if(typeof Devices === 'undefined'){
//   if(Package['clinical:autopublish']){
//     Devices = new Mongo.Collection('Devices');
//   } else if(Package['clinical:desktop-publish']){    
//     Devices = new Mongo.Collection('Devices');
//   } else {
//     Devices = new Mongo.Collection('Devices', {connection: null});
//   }
// }



//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Devices._transform = function (document) {
  return new Device(document);
};


let DeviceDstu2 = new SimpleSchema({
  'resourceType' : {
    type: String,
    defaultValue: 'Device'
  },
  'identifier' : {
    optional: true,
    type: Array
  }, // Instance id from manufacturer, owner, and others
  'identifier.$' : {
    optional: true,
    type: IdentifierSchema 
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
  'type' : {
    type: CodeableConceptSchema
  }, // R!  What kind of device this is
  'note' : {
    optional: true,
    type: Array
  }, // Device notes and comments
  'note.$' : {
    optional: true,
    type: AnnotationSchema
  }, // Device notes and comments
  'status' : {
    optional: true,
    type: Code
  }, // available | not-available | entered-in-error
  'manufacturer' : {
    optional: true,
    type: String
  }, // Name of device manufacturer
  'model' : {
    optional: true,
    type: String
  }, // Model id assigned by the manufacturer
  'version' : {
    optional: true,
    type: String
  }, // Version number (i.e. software)
  'manufactureDate' : {
    optional: true,
    type: Date
  }, // Manufacture date
  'expiry' : {
    optional: true,
    type: Date
  }, // Date and time of expiry of this device (if applicable)
  'udi' : {
    optional: true,
    type: String
  }, // FDA mandated Unique Device Identifier
  'lotNumber' : {
    optional: true,
    type: String
  }, // Lot number of manufacture
  'owner' : {
    optional: true,
    type: ReferenceSchema
  }, // (Organization) Organization responsible for device
  'location' : {
    optional: true,
    type: ReferenceSchema
  }, // (Location)Where the resource is found
  'patient' : {
    optional: true,
    type: ReferenceSchema
  }, // (Patient) If the resource is affixed to a person
  'contact' : {
    optional: true,
    type: Array
  }, // Details for human/organization for support
  'contact.$' : {
    optional: true,
    type: ContactPointSchema 
  }, // Details for human/organization for support
  'url' : {
    optional: true,
    type: String
  } // Network address to contact device
});


let DeviceStu3 = new SimpleSchema({
  'resourceType' : {
    type: String,
    defaultValue: 'Device'
  },
  'identifier' : {
    optional: true,
    type: Array
  }, // Instance id from manufacturer, owner, and others
  'identifier.$' : {
    optional: true,
    type: IdentifierSchema 
  }, // Instance id from manufacturer, owner, and others
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
  'udi' : {
    optional: true,
    type: Object
  }, // FDA mandated Unique Device Identifier
  'udi.deviceIdentifier' : {
    optional: true,
    type: String
  }, 
  'udi.name' : {
    optional: true,
    type: String
  }, 
  'udi.jurisdiction' : {
    optional: true,
    type: String
  }, 
  'udi.carrierHRF' : {
    optional: true,
    type: String
  }, 
  'udi.carrierAIDC' : {
    optional: true,
    type: String
  }, 
  'udi.issuer' : {
    optional: true,
    type: String
  }, 
  'udi.entryType' : {
    optional: true,
    type: Code
  }, 
  'status' : {
    optional: true,
    type: Code,
    allowedValues: ['active', 'inactive', 'enterred-in-error', 'unknown']
  },
  'type' : {
    optional: true,
    type: CodeableConceptSchema
  },
  'lotNumber' : {
    optional: true,
    type: String
  }, // Lot number of manufacture
  'manufacturer' : {
    optional: true,
    type: String
  }, // Name of device manufacturer
  'manufactureDate' : {
    optional: true,
    type: Date
  }, // Manufacture date
  'expirationDate' : {
    optional: true,
    type: Date
  }, // Manufacture date
  'model' : {
    optional: true,
    type: String
  }, // Model id assigned by the manufacturer
  'version' : {
    optional: true,
    type: String
  }, // Version number (i.e. software)
  'patient' : {
    optional: true,
    type: ReferenceSchema
  }, // (Organization) Organization responsible for device
  'owner' : {
    optional: true,
    type: ReferenceSchema
  }, // (Organization) Organization responsible for device
  'contact' : {
    optional: true,
    type: Array
  }, // Details for human/organization for support
  'contact.$' : {
    optional: true,
    type: ContactPointSchema 
  }, // Details for human/organization for support
  'location' : {
    optional: true,
    type: ReferenceSchema
  }, // (Location)Where the resource is found
  'url' : {
    optional: true,
    type: String
  }, // Network address to contact device
  'note' : {
    optional: true,
    type: Array
  }, // Device notes and comments
  'note.$' : {
    optional: true,
    type: AnnotationSchema
  }, // Device notes and comments
  'safety' : {
    optional: true,
    type: Array
  }, 
  'safety.$' : {
    optional: true,
    type: CodeableConceptSchema
  }, 
});


let DeviceR4 = new SimpleSchema({
  'resourceType' : {
    type: String,
    defaultValue: 'Device'
  },
  'id' : {
    optional: true,
    type: String
  }, 
  '_id' : {
    optional: true,
    type: String
  }, 
  'identifier' : {
    optional: true,
    type: Array
  }, 
  'identifier.$' : {
    optional: true,
    type: IdentifierSchema 
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
  'udiCarrier' : {
      optional: true,
      type: Array
  }, // FDA mandated Unique Device Identifier
  'udiCarrier.$' : {
    optional: true,
    type: Object
  }, // FDA mandated Unique Device Identifier
  'udiCarrier.deviceIdentifier' : {
    optional: true,
    type: String
  }, 
  'udiCarrier.name' : {
    optional: true,
    type: String
  }, 
  'udiCarrier.jurisdiction' : {
    optional: true,
    type: String
  }, 
  'udiCarrier.carrierHRF' : {
    optional: true,
    type: String
  }, 
  'udiCarrier.carrierAIDC' : {
    optional: true,
    type: String
  }, 
  'udiCarrier.issuer' : {
    optional: true,
    type: String
  }, 
  'udiCarrier.entryType' : {
    optional: true,
    type: Code
  }, 
  'status' : {
    optional: true,
    type: Code,
    allowedValues: ['active', 'inactive', 'enterred-in-error', 'unknown']
  },
  'statusReason' : {
    optional: true,
    type: Array
  },
  'statusReason.$' : {
    optional: true,
    type: CodeableConceptSchema
  },
  'type' : {
    optional: true,
    type: CodeableConceptSchema
  },
  'lotNumber' : {
    optional: true,
    type: String
  }, 
  'serialNumber' : {
    optional: true,
    type: String
  }, 
  'deviceName' : {
    optional: true,
    type: Array
  }, 
  'deviceName.$' : {
    optional: true,
    type: Object 
  }, 
  'deviceName.$.name' : {
    type: String 
  }, 
  'deviceName.$.type' : {
    type: String,
    defaultValue: "user-friendly-name",
    allowedValues: ["udi-label-name", "user-friendly-name", "patient-reported-name", "manufacturer-name", "model-name", "other"]
  }, 
  'manufacturer' : {
    optional: true,
    type: String
  }, // Name of device manufacturer
  'manufactureDate' : {
    optional: true,
    type: Date
  }, // Manufacture date
  'expirationDate' : {
    optional: true,
    type: Date
  }, // Manufacture date
  'model' : {
    optional: true,
    type: String
  }, // Model id assigned by the manufacturer
  'version' : {
    optional: true,
    type: String
  }, // Version number (i.e. software)
  'patient' : {
    optional: true,
    type: ReferenceSchema
  }, // (Organization) Organization responsible for device
  'owner' : {
    optional: true,
    type: ReferenceSchema
  }, // (Organization) Organization responsible for device
  'contact' : {
    optional: true,
    type: Array
  }, // Details for human/organization for support
  'contact.$' : {
    optional: true,
    type: ContactPointSchema 
  }, // Details for human/organization for support
  'location' : {
    optional: true,
    type: ReferenceSchema
  }, // (Location)Where the resource is found
  'url' : {
    optional: true,
    type: String
  }, // Network address to contact device
  'note' : {
    optional: true,
    type: Array
  }, // Device notes and comments
  'note.$' : {
    optional: true,
    type: AnnotationSchema
  }, // Device notes and comments
  'safety' : {
    optional: true,
    type: Array
  }, 
  'safety.$' : {
    optional: true,
    type: CodeableConceptSchema
  }, 
});


let DeviceSchema = DeviceR4;

// BaseSchema.extend(DeviceSchema);
// DomainResourceSchema.extend(DeviceSchema);
// Devices.attachSchema(DeviceSchema);

export default { Device, Devices, DeviceSchema, DeviceDstu2, DeviceStu3 };