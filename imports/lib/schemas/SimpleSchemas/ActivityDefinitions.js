
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

import { Code, DosageSchema, ReferenceSchema, CodeableConceptSchema, IdentifierSchema, PeriodSchema } from 'meteor/clinical:hl7-resource-datatypes';

// import ReferenceSchema from '../../../datatypes/Reference';
// import CodeableConceptSchema from '../../datatypes/CodeableConcept';
// import IdentifierSchema from '../../datatypes/Identifier';
// import PeriodSchema from '../../datatypes/Period';
// import Code from '../../datatypes/Code';




// create the object using our BaseModel
let ActivityDefinition = BaseModel.extend();
export let ActivityDefinitions = new Mongo.Collection('ActivityDefinitions');

//Assign a collection so the object knows how to perform CRUD operations
ActivityDefinition.prototype._collection = ActivityDefinitions;

//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
ActivityDefinitions._transform = function (document) {
  return new ActivityDefinition(document);
};



let ActivityDefinitionR4 = new SimpleSchema({
  "_id": {
    type: String,
    optional: true
  },
  "id": {
    type: String,
    optional: true
  },
  "meta": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "resourceType": {
    type: String,
    defaultValue: "ActivityDefinition"
  },
  "url": {
    optional: true,
    type: String
  },
  "identifier": {
    optional: true,
    type: Array
  },
  "identifier.$": {
    type: IdentifierSchema
  },
  "version": {
    optional: true,
    type: String
  },
  "name": {
    optional: true,
    type: String
  },
  "title": {
    optional: true,
    type: String
  },
  "subtitle": {
    optional: true,
    type: String
  },
  "status": {
    type: Code,
    allowedValues: ['draft', 'active', 'retired', 'unknown']
  },
  "experimental": {
    optional: true,
    type: Boolean
  },
  "subject": {
    optional: true,
    type: Object
  },
  "subjectCodeableConcept": {
    optional: true,
    type: CodeableConceptSchema
  },
  "subjectReference": {
    optional: true,
    type: ReferenceSchema
  },
  "date": {
    optional: true,
    type: Date
  },
  "publisher": {
    optional: true,
    type: String
  },
  "contact": {
    optional: true,
    type: Array
  },
  "contact.$": {
    // type: ContactDetailSchema

    type: Object,
    blackbox: true
  },
  "description": {
    optional: true,
    type: String
  },
  "useContext": {
    optional: true,
    type: Array
  },
  "useContext.$": {
    // type: UsageContextSchema
    type: Object,
    blackbox: true
  },
  "jurisdiction": {
    optional: true,
    type: Array
  },
  "jurisdiction.$": {
    type: CodeableConceptSchema
  },
  "purpose": {
    optional: true,
    type: String
  },
  "usage": {
    optional: true,
    type: String
  },
  "copyright": {
    optional: true,
    type: String
  },
  "approvalDate": {
    optional: true,
    type: Date
  },
  "lastReviewDate": {
    optional: true,
    type: Date
  },
  "effectivePeriod": {
    optional: true,
    type: PeriodSchema
  },
  "topic": {
    optional: true,
    type: Array
  },
  "topic.$": {
    type: CodeableConceptSchema
  },
  "author": {
    optional: true,
    type: Array
  },
  "author.$": {
    // type: ContactDetailSchema

    type: Object,
    blackbox: true
  },
  "editor": {
    optional: true,
    type: Array
  },
  "editor.$": {
    // type: ContactDetailSchema

    type: Object,
    blackbox: true
  },
  "reviewer": {
    optional: true,
    type: Array
  },
  "reviewer.$": {
    // type: ContactDetailSchema

    type: Object,
    blackbox: true

  },
  "endorser": {
    optional: true,
    type: Array
  },
  "endorser.$": {
    // type: ContactDetailSchema

    type: Object,
    blackbox: true
  },
  "relatedArtifact": {
    optional: true,
    type: Array
  },
  "relatedArtifact.$": {
    // type: RelatedArtifactSchema
    type: Object,
    blackbox: true
  },
  "library": {
    optional: true,
    type: Array
  },
  "library.$": {
    type: String
  },
  "kind": {
    optional: true,
    type: Code,
    allowedValues: ['ServiceRequest', 'MedicationRequest', 'Task', 'Appointment']
  },
  "profile": {
    optional: true,
    type: String
  },
  "code": {
    optional: true,
    type: CodeableConceptSchema
  },
  "intent": {
    optional: true,
    type: Code,
    allowedValues: ['proposal', 'plan', 'directive', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option']
  },
  "priority": {
    optional: true,
    type: Code,
    allowedValues: ['routine', 'urgent', 'asap', 'stat']
  },
  "doNotPerform": {
    optional: true,
    type: Boolean
  },
  "timing": {
    optional: true,
    type: Object
  },
  "timingTiming": {
    optional: true,
    type: TimingSchema
  },
  "timingDateTime": {
    optional: true,
    type: Date
  },
  "timingAge": {
    optional: true,
    type: QuantitySchema
  },
  "timingPeriod": {
    optional: true,
    type: PeriodSchema
  },
  "timingRange": {
    optional: true,
    type: RangeSchema
  },
  "timingDuration": {
    optional: true,
    // type: DurationSchema

    type: Object,
    blackbox: true
  },
  "location": {
    optional: true,
    type: ReferenceSchema
  },
  "participant": {
    optional: true,
    type: Array
  },
  "participant.$": {
    type: Object
  },
  "participant.$.type": {
    type: Code,
    allowedValues: ['patient', 'practitioner', 'related-person', 'device']
  },
  "participant.$.role": {
    optional: true,
    type: CodeableConceptSchema
  },
  "productReference": {
    optional: true,
    type: ReferenceSchema
  },
  "productCodeableConcept": {
    optional: true,
    type: CodeableConceptSchema
  },
  "quantity": {
    optional: true,
    type: QuantitySchema
  },
  "dosage": {
    optional: true,
    type: Array
  },
  "dosage.$": {
    // type: DosageSchema
    type: Object,
    blackbox: true
  },
  "bodySite": {
    optional: true,
    type: Array
  },
  "bodySite.$": {
    type: CodeableConceptSchema
  },
  "specimenRequirement": {
    optional: true,
    type: Array
  },
  "specimenRequirement.$": {
    type: ReferenceSchema
  },
  "observationRequirement": {
    optional: true,
    type: Array
  },
  "observationRequirement.$": {
    type: ReferenceSchema
  },
  "observationResultRequirement": {
    optional: true,
    type: Array
  },
  "observationResultRequirement.$": {
    type: ReferenceSchema
  },
  "transform": {
    optional: true,
    type: String
  },
  "dynamicValue": {
    optional: true,
    type: Array
  },
  "dynamicValue.$": {
    type: Object
  },
  "dynamicValue.$.path": {
    type: String
  },
  "dynamicValue.$.expression": {
    // type: ExpressionSchema
    type: Object,
    blackbox: true
  }
});

let ActivityDefinitionSchema = ActivityDefinitionR4;

// BaseSchema.extend(ActivityDefinitionSchema);
// DomainResourceSchema.extend(ActivityDefinitionSchema);

// ActivityDefinitions.attachSchema(ActivityDefinitionSchema);

export default { ActivityDefinition, ActivityDefinitions, ActivityDefinitionSchema };