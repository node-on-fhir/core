import SimpleSchema from 'simpl-schema';
import BaseModel from '../../BaseModel';

// create the object using our BaseModel
let DocumentReference = BaseModel.extend();


// Create a persistent data store for addresses to be stored.
// HL7.Resources.Patients = new Mongo.Collection('HL7.Resources.Patients');
export let DocumentReferences = new Mongo.Collection('DocumentReferences');

//Assign a collection so the object knows how to perform CRUD operations
DocumentReference.prototype._collection = DocumentReferences;

//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
DocumentReferences._transform = function (document) {
  return new DocumentReference(document);
};


let DocumentReferenceDstu2 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "DocumentReference"
  },
  "masterIdentifier" : {
    optional: true,
    type: IdentifierSchema
  },
  "identifier" : {
    optional: true,
    type: Array
  },
  "identifier.$" : {
    optional: true,
    type: IdentifierSchema 
  },
  "status" : {
    optional: true,
    type: Code,
    allowedValues: ['current', 'superseded', 'entered-in-error']
  },
  "docStatus" : {
    optional: true,
    type: Code,
    allowedValues: ['preliminary', 'final', 'appended', 'amended', 'entered-in-error']
  },
  "subject" : {
    optional: true,
    type: ReferenceSchema
  },
  "type" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "class" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "author" : {
    optional: true,
    type: Array
  },
  "author.$" : {
    optional: true,
    type: ReferenceSchema 
  },
  "custodian" : {
    optional: true,
    type: ReferenceSchema
  },
  "authenticator" : {
    optional: true,
    type: ReferenceSchema
  },
  "created" : {
    optional: true,
    type: Date
  },
  "indexed" : {
    optional: true,
    type: Date
  },
  "status" : {
    optional: true,
    type: String
  },
  "relatesTo" : {
    optional: true,
    type: Array
  },
  "relatesTo.$" : {
    optional: true,
    type: Object
  },
  "relatesTo.$.code" : {
    optional: true,
    type: String
  },
  "relatesTo.$.target" : {
    optional: true,
    type: ReferenceSchema
  },
  "description" : {
    optional: true,
    type: String
  },
  "securityLabel" : {
    optional: true,
    type: Array
  },
  "securityLabel.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "content" : {
    optional: true,
    type: Array
  },
  "content.$" : {
    optional: true,
    type: Object
  },
  "content.$.attachment" : {
    optional: true,
    type: AttachmentSchema
  },
  "content.$.format" : {
    optional: true,
    type: CodingSchema 
  },
  "context" : {
    optional: true,
    type: Object
  },
  "context.encounter" : {
    optional: true,
    type: ReferenceSchema
  },
  "context.event" : {
    optional: true,
    type: Array
  },
  "context.event.$" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "context.period" : {
    optional: true,
    type: PeriodSchema
  },
  "context.facilityType" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "context.practiceSetting" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "context.sourcePatientInfo" : {
    optional: true,
    type: ReferenceSchema
  },
  "context.related" : {
    optional: true,
    type: Array
  },
  "context.related.$" : {
    optional: true,
    type: Object
  },
  "context.related.$.identifier" : {
    optional: true,
    type: IdentifierSchema
  },
  "context.related.$.ref" : {
    optional: true,
    type: ReferenceSchema
  }

});

let DocumentReferenceR4 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "DocumentReference"
  },
  "masterIdentifier" : {
    optional: true,
    type: IdentifierSchema
  },
  "identifier" : {
    optional: true,
    type: Array
  },
  "identifier.$" : {
    optional: true,
    type: IdentifierSchema 
  },
  "status" : {
    optional: true,
    type: Code,
    allowedValues: ['current', 'superseded', 'entered-in-error']
  },
  "docStatus" : {
    optional: true,
    type: Code,
    allowedValues: ['preliminary', 'final', 'appended', 'amended', 'entered-in-error']
  },
  "subject" : {
    optional: true,
    type: ReferenceSchema
  },
  "type" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "class" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "author" : {
    optional: true,
    type: Array
  },
  "author.$" : {
    optional: true,
    type: ReferenceSchema 
  },
  "custodian" : {
    optional: true,
    type: ReferenceSchema
  },
  "authenticator" : {
    optional: true,
    type: ReferenceSchema
  },
  "created" : {
    optional: true,
    type: Date
  },
  "indexed" : {
    optional: true,
    type: Date
  },
  "status" : {
    optional: true,
    type: String
  },
  "relatesTo" : {
    optional: true,
    type: Array
  },
  "relatesTo.$" : {
    optional: true,
    type: Object
  },
  "relatesTo.$.code" : {
    optional: true,
    type: String
  },
  "relatesTo.$.target" : {
    optional: true,
    type: ReferenceSchema
  },
  "description" : {
    optional: true,
    type: String
  },
  "securityLabel" : {
    optional: true,
    type: Array
  },
  "securityLabel.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "content" : {
    optional: true,
    type: Array
  },
  "content.$" : {
    optional: true,
    type: Object
  },
  "content.$.attachment" : {
    optional: true,
    type: AttachmentSchema
  },
  "content.$.format" : {
    optional: true,
    type: CodingSchema 
  },
  "context" : {
    optional: true,
    type: Object
  },
  "context.encounter" : {
    optional: true,
    type: ReferenceSchema
  },
  "context.event" : {
    optional: true,
    type: Array
  },
  "context.event.$" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "context.period" : {
    optional: true,
    type: PeriodSchema
  },
  "context.facilityType" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "context.practiceSetting" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "context.sourcePatientInfo" : {
    optional: true,
    type: ReferenceSchema
  },
  "context.related" : {
    optional: true,
    type: Array
  },
  "context.related.$" : {
    optional: true,
    type: ReferenceSchema
  }
});


let DocumentReferenceSchema = DocumentReferenceR4;

// DocumentReferences.attachSchema(DocumentReferenceSchema);