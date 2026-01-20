import SimpleSchema from 'simpl-schema';
import BaseModel from '../../BaseModel';

// create the object using our BaseModel
let DocumentManifest = BaseModel.extend();


// Create a persistent data store for addresses to be stored.
// HL7.Resources.Patients = new Mongo.Collection('HL7.Resources.Patients');
export let DocumentManifests = new Mongo.Collection('DocumentManifests');

//Assign a collection so the object knows how to perform CRUD operations
DocumentManifest.prototype._collection = DocumentManifests;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
DocumentManifests._transform = function (document) {
  return new DocumentManifest(document);
};


let DocumentManifestDstu2 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "DocumentManifest"
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
  "type" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "subject" : {
    optional: true,
    type: ReferenceSchema
  },
  "created" : {
    optional: true,
    type: Date
  },
  "author" : {
    optional: true,
    type: Array
  },
  "author.$" : {
    optional: true,
    type: ReferenceSchema 
  },
  "recipient" : {
    optional: true,
    type: Array
  },
  "recipient.$" : {
    optional: true,
    type: ReferenceSchema 
  },
  "source" : {
    optional: true,
    type: String
  },
  "description" : {
    optional: true,
    type: String
  },
  "content" : {
    optional: true,
    type: Array
  },
  "content.$" : {
    optional: true,
    type: Object
  },
  "related" : {
    optional: true,
    type: Array
  },
  "related.$" : {
    optional: true,
    type: Object
  },
  "related.$.identifier" : {
    optional: true,
    type: IdentifierSchema
  },
  "related.$.ref" : {
    optional: true,
    type: ReferenceSchema
  }
});

let DocumentManifestR4 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "DocumentManifest"
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
  "type" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "subject" : {
    optional: true,
    type: ReferenceSchema
  },
  "created" : {
    optional: true,
    type: Date
  },
  "author" : {
    optional: true,
    type: Array
  },
  "author.$" : {
    optional: true,
    type: ReferenceSchema 
  },
  "recipient" : {
    optional: true,
    type: Array
  },
  "recipient.$" : {
    optional: true,
    type: ReferenceSchema 
  },
  "source" : {
    optional: true,
    type: String
  },
  "description" : {
    optional: true,
    type: String
  },
  "content" : {
    optional: true,
    type: Array
  },
  "content.$" : {
    optional: true,
    type: Object
  },
  "related" : {
    optional: true,
    type: Array
  },
  "related.$" : {
    optional: true,
    type: Object
  },
  "related.$.identifier" : {
    optional: true,
    type: IdentifierSchema
  },
  "related.$.ref" : {
    optional: true,
    type: ReferenceSchema
  }
});


let DocumentManifestSchema = DocumentManifestR4;

// DocumentManifests.attachSchema(DocumentManifestSchema);