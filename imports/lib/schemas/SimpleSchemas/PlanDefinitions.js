import { get } from 'lodash';
import validator from 'validator';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import {  AddressSchema, BaseSchema, ContactPointSchema, CodeableConceptSchema, CodingSchema, DomainResourceSchema, IdentifierSchema,  MoneySchema, PeriodSchema, QuantitySchema, ReferenceSchema, SignatureSchema, AnnotationSchema } from 'meteor/clinical:hl7-resource-datatypes';


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


export let PlanDefinitions = new Mongo.Collection('PlanDefinitions');

// create the object using our BaseModel
let PlanDefinition = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
PlanDefinition.prototype._collection = PlanDefinitions;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
PlanDefinitions._transform = function (document) {
  return new PlanDefinition(document);
};

let PlanDefinitionR4Schema = new SimpleSchema({
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
    defaultValue: "PlanDefinition"
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
  "type": {
    optional: true,
    type: CodeableConceptSchema
  },
  "status": {
    type: String,
    allowedValues: ['draft', 'active', 'retired', 'unknown']
  },
  "experimental": {
    optional: true,
    type: Boolean
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
  "goal": {
    optional: true,
    type: Array
  },
  "goal.$": {
    type: Object
  },
  "goal.$.category": {
    optional: true,
    type: CodeableConceptSchema
  },
  "goal.$.description": {
    type: CodeableConceptSchema
  },
  "goal.$.priority": {
    optional: true,
    type: CodeableConceptSchema
  },
  "goal.$.start": {
    optional: true,
    type: CodeableConceptSchema
  },
  "goal.$.addresses": {
    optional: true,
    type: Array
  },
  "goal.$.addresses.$": {
    type: CodeableConceptSchema
  },
  "goal.$.documentation": {
    optional: true,
    type: Array
  },
  "goal.$.documentation.$": {
    // type: RelatedArtifactSchema
    type: Object,
    blackbox: true

  },
  "goal.$.target": {
    optional: true,
    type: Array
  },
  "goal.$.target.$": {
    type: Object
  },
  "goal.$.target.$.measure": {
    optional: true,
    type: CodeableConceptSchema
  },
  "goal.$.target.$.detailQuantity": {
    optional: true,
    type: QuantitySchema
  },
  "goal.$.target.$.detailRange": {
    optional: true,
    type: Object,
    blackbox: true
  },
  "goal.$.target.$.detailCodeableConcept": {
    optional: true,
    type: CodeableConceptSchema
  },
  "goal.$.target.$.due": {
    optional: true,
    // type: DurationSchema
    type: Object,
    blackbox: true
  },
  "action": {
    optional: true,
    type: Array
  },
  "action.$": {
    type: Object
  },
  "action.$.prefix": {
    optional: true,
    type: String
  },
  "action.$.title": {
    optional: true,
    type: String
  },
  "action.$.description": {
    optional: true,
    type: String
  },
  "action.$.textEquivalent": {
    optional: true,
    type: String
  },
  "action.$.priority": {
    optional: true,
    type: String,
    allowedValues: ['routine', 'urgent', 'asap', 'stat']
  },
  "action.$.code": {
    optional: true,
    type: Array
  },
  "action.$.code.$": {
    type: CodeableConceptSchema
  },
  "action.$.reason": {
    optional: true,
    type: Array
  },
  "action.$.reason.$": {
    type: CodeableConceptSchema
  },
  "action.$.documentation": {
    optional: true,
    type: Array
  },
  "action.$.documentation.$": {
    // type: RelatedArtifactSchema
    type: Object,
    blackbox: true
  },
  "action.$.goalId": {
    optional: true,
    type: Array
  },
  "action.$.goalId.$": {
    type: String
  },
  "action.$.subjectCodeableConcept": {
    optional: true,
    type: CodeableConceptSchema
  },
  "action.$.subjectReference": {
    optional: true,
    type: ReferenceSchema
  },
  "action.$.trigger": {
    optional: true,
    type: Array
  },
  "action.$.trigger.$": {
    // type: TriggerDefinitionSchema
    type: Object,
    blackbox: true
  },
  "action.$.condition": {
    optional: true,
    type: Array
  },
  "action.$.condition.$": {
    type: Object
  },
  "action.$.condition.$.kind": {
    type: String,
    allowedValues: ['applicability', 'start', 'stop']
  },
  "action.$.condition.$.expression": {
    optional: true,
    // type: ExpressionSchema
    type: Object,
    blackbox: true

  },
  "action.$.input": {
    optional: true,
    type: Array
  },
  "action.$.input.$": {
    // type: DataRequirementSchema
    type: Object,
    blackbox: true

  },
  "action.$.output": {
    optional: true,
    type: Array
  },
  "action.$.output.$": {
    // type: DataRequirementSchema
    type: Object,
    blackbox: true

  },
  "action.$.relatedAction": {
    optional: true,
    type: Array
  },
  "action.$.relatedAction.$": {
    type: Object
  },
  "action.$.relatedAction.$.actionId": {
    type: String
  },
  "action.$.relatedAction.$.relationship": {
    type: String,
    allowedValues: ['before-start', 'before', 'before-end', 'concurrent-with-start', 'concurrent', 'concurrent-with-end', 'after-start', 'after', 'after-end']
  },
  "action.$.relatedAction.$.offsetDuration": {
    optional: true,
    // type: DurationSchema
    type: Object,
    blackbox: true
  },
  "action.$.relatedAction.$.offsetRange": {
    optional: true,
    type: Object,
    blackbox: true
  },
  "action.$.timingDateTime": {
    optional: true,
    type: Date
  },
  "action.$.timingAge": {
    optional: true,
    type: QuantitySchema
  },
  "action.$.timingPeriod": {
    optional: true,
    type: PeriodSchema
  },
  "action.$.timingDuration": {
    optional: true,
    // type: DurationSchema
    type: Object,
    blackbox: true

  },
  "action.$.timingRange": {
    optional: true,
    type: Object,
    blackbox: true
  },
  "action.$.timingTiming": {
    optional: true,
    type: Object,
    blackbox: true
  },
  "action.$.participant": {
    optional: true,
    type: Array
  },
  "action.$.participant.$": {
    type: Object
  },
  "action.$.participant.$.type": {
    type: String,
    allowedValues: ['patient', 'practitioner', 'related-person', 'device']
  },
  "action.$.participant.$.role": {
    optional: true,
    type: CodeableConceptSchema
  },
  "action.$.type": {
    optional: true,
    type: CodeableConceptSchema
  },
  "action.$.groupingBehavior": {
    optional: true,
    type: String,
    allowedValues: ['visual-group', 'logical-group', 'sentence-group']
  },
  "action.$.selectionBehavior": {
    optional: true,
    type: String,
    allowedValues: ['any', 'all', 'all-or-none', 'exactly-one', 'at-most-one', 'one-or-more']
  },
  "action.$.requiredBehavior": {
    optional: true,
    type: String,
    allowedValues: ['must', 'could', 'must-unless-documented']
  },
  "action.$.precheckBehavior": {
    optional: true,
    type: String,
    allowedValues: ['yes', 'no']
  },
  "action.$.cardinalityBehavior": {
    optional: true,
    type: String,
    allowedValues: ['single', 'multiple']
  },
  "action.$.definitionCanonical": {
    optional: true,
    type: String
  },
  "action.$.definitionUri": {
    optional: true,
    type: String
  },
  "action.$.transform": {
    optional: true,
    type: String
  },
  "action.$.dynamicValue": {
    optional: true,
    type: Array
  },
  "action.$.dynamicValue.$": {
    type: Object
  },
  "action.$.dynamicValue.$.path": {
    type: String
  },
  "action.$.dynamicValue.$.expression": {
    // type: ExpressionSchema
    type: Object,
    blackbox: true
  },
  "action.$.action": {
    optional: true,
    type: Array
  },
  "action.$.action.$": {
    type: Object,
    blackbox: true
  }
});

let PlanDefinitionSchema = PlanDefinitionR4Schema;

BaseSchema.extend(PlanDefinitionR4Schema);
DomainResourceSchema.extend(PlanDefinitionR4Schema);

// PlanDefinitions.attachSchema(PlanDefinitionR4Schema);

PlanDefinition.prototype.toFhir = function(){
  console.log('PlanDefinition.toFhir()');

  return EJSON.stringify(this.name);
}

/**
 * @summary The displayed name of the plan definition
 * @memberOf PlanDefinition
 * @name displayName
 * @version 1.2.3
 * @returns {String}
 */
PlanDefinition.prototype.displayName = function () {
  if (this.title) {
    return this.title;
  } else if (this.name) {
    return this.name;
  }
  return '';
};

export default { PlanDefinition, PlanDefinitions, PlanDefinitionR4Schema, PlanDefinitionSchema };