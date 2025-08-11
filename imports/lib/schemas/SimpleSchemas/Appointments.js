// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/lib/schemas/SimpleSchemas/Appointments.js

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
import { BaseSchema, DomainResourceSchema, IdentifierSchema, ReferenceSchema, ContactPointSchema, AddressSchema, SignatureSchema, CodeableConceptSchema, QuantitySchema, PeriodSchema, RangeSchema, Code, CodeSchema, Period, AnnotationSchema } from 'meteor/clinical:hl7-resource-datatypes';

// create the object using our BaseModel
let Appointment = BaseModel.extend();

export let Appointments = new Mongo.Collection('Appointments');

//Assign a collection so the object knows how to perform CRUD operations
Appointment.prototype._collection = Appointments;

//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Appointments._transform = function (document) {
  return new Appointment(document);
};

// Appointment Participant Schema
let AppointmentParticipantSchema = new SimpleSchema({
  "type" : {
    optional: true,
    type: Array
  },
  "type.$" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "actor" : {
    optional: true,
    type: ReferenceSchema
  },
  "required" : {
    optional: true,
    type: String,
    allowedValues: ['required', 'optional', 'information-only']
  },
  "status" : {
    type: String,
    allowedValues: ['accepted', 'declined', 'tentative', 'needs-action']
  },
  "period" : {
    optional: true,
    type: PeriodSchema
  }
});

// R4 Appointment Schema
let AppointmentSchema = new SimpleSchema({
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
    defaultValue: "Appointment"
  },
  "identifier" : {
    optional: true,
    type: Array
  },
  "identifier.$" : {
    optional: true,
    type: IdentifierSchema
  },
  "extension" : {
    optional: true,
    type: Array
  },
  "extension.$" : {
    optional: true,
    blackbox: true,
    type: Object
  },
  "modifierExtension" : {
    optional: true,
    type: Array
  },
  "modifierExtension.$" : {
    optional: true,
    blackbox: true,
    type: Object
  },
  "status" : {
    type: String,
    allowedValues: ['proposed', 'pending', 'booked', 'arrived', 'fulfilled', 'cancelled', 'noshow', 'entered-in-error', 'checked-in', 'waitlist']
  },
  "cancelationReason" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "serviceCategory" : {
    optional: true,
    type: Array
  },
  "serviceCategory.$" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "serviceType" : {
    optional: true,
    type: Array
  },
  "serviceType.$" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "specialty" : {
    optional: true,
    type: Array
  },
  "specialty.$" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "appointmentType" : {
    optional: true,
    type: CodeableConceptSchema
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
  "priority" : {
    optional: true,
    type: Number
  },
  "description" : {
    optional: true,
    type: String
  },
  "supportingInformation" : {
    optional: true,
    type: Array
  },
  "supportingInformation.$" : {
    optional: true,
    type: ReferenceSchema
  },
  "start" : {
    optional: true,
    type: Date
  },
  "end" : {
    optional: true,
    type: Date
  },
  "minutesDuration" : {
    optional: true,
    type: Number
  },
  "slot" : {
    optional: true,
    type: Array
  },
  "slot.$" : {
    optional: true,
    type: ReferenceSchema
  },
  "created" : {
    optional: true,
    type: Date
  },
  "comment" : {
    optional: true,
    type: String
  },
  "patientInstruction" : {
    optional: true,
    type: String
  },
  "basedOn" : {
    optional: true,
    type: Array
  },
  "basedOn.$" : {
    optional: true,
    type: ReferenceSchema
  },
  "participant" : {
    type: Array
  },
  "participant.$" : {
    type: AppointmentParticipantSchema
  },
  "requestedPeriod" : {
    optional: true,
    type: Array
  },
  "requestedPeriod.$" : {
    optional: true,
    type: PeriodSchema
  },
  "note" : {
    optional: true,
    type: Array
  },
  "note.$" : {
    optional: true,
    type: AnnotationSchema
  }
});

// Note: In Meteor v3, we're not using Collection2, so we don't attach schemas
// Appointments.attachSchema(AppointmentSchema);

// Export schemas
export default { Appointment, Appointments, AppointmentSchema };
export { Appointment, AppointmentSchema };