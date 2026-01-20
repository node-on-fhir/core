import SimpleSchema from 'simpl-schema';
import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';

// create the object using our BaseModel
let Provenance = BaseModel.extend();

export let Provenances = new Mongo.Collection('Provenances');

//Assign a collection so the object knows how to perform CRUD operations
Provenance.prototype._collection = Provenances;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Provenances._transform = function (document) {
  return new Provenance(document);
};


let ProvenanceSchema = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: 'Provenance'
  },
  "target" : { 
	  optional:true,
	  type:  Array
  }, 
  "target.$" : { 
	  optional:true,
    blackbox: true,
	  type:  ReferenceSchema 
  }, 
  "period" : { 
	  optional:true,
	  type:  PeriodSchema 
  }, 
  "recorded" : {
	  optional:true,
    type:  Date
  },
  "policy" : { 
	  optional:true,
	  type:  Array 
  }, 
  "policy.$" : { 
	  optional:true,
	  type:  String 
  }, 
  "location" : { 
	  optional:true,
    type:  ReferenceSchema 
  },
  "reason" : { 
	  optional:true,
	  type:  Array 
  }, 
  "reason.$" : { 
	  optional:true,
	  type:  CodingSchema 
  }, 
  "activity" : { 
	  optional:true,
	  type:  Array 
  }, 
  "activity.$" : { 
	  optional:true,
	  type:  CodingSchema 
  }, 
  "agent" : { 
	  optional:true,
	  type:  Array 
  }, 
  "agent.$" : { 
	  optional:true,
	  type:  Object 
  }, 
  "agent.$.role" : { 
	  optional:true,
	  type:  Array 
  }, 
  "agent.$.role.$" : { 
	  optional:true,
	  type:  CodeableConceptSchema 
  }, 
  "agent.$.whoUri" : {
	  optional:true,
	  type: String
  },
  "agent.$.whoReference" : { 
	  optional:true,
	  type: ReferenceSchema 
  },
  "agent.$.onBehalfOfUri" : {
	  optional:true,
	  type: String
  },
  "agent.$.onBehalfOfReference" : { 
	  optional:true,
	  type: ReferenceSchema 
  },
  "agent.$.relatedAgentType" : { 
	  optional:true,
	  type: CodeableConceptSchema 
  },
  "entity" : { 
	  optional:true,
	  type:  Array 
  }, 
  "entity.$" : { 
	  optional:true,
	  type:  Object 
  }, 

  "entity.$.role" : {
	  optional:true,
	  type: Code
  },
  "entity.$.whatUri" : {
	  optional:true,
	  type: String
  },
  "entity.$.whatReference" : { 
	  optional:true,
	  type:  ReferenceSchema 
  },
  "entity.$.whatIdentifier" : { 
	  optional:true,
	  type:  IdentifierSchema 
  },
  "entity.$.agent" : { 
	  optional:true,
	  type:  Array 
  }, 
  "entity.$.agent.$" : { 
	  optional:true,
	  type:  Object 
  }, 
  "signature" : { 
	  optional:true,
	  type:  Array 
  }, 
  "signature.$" : { 
	  optional:true,
    blackbox: true,
	  type:  Object 
  }
});
// Provenances.attachSchema(ProvenanceSchema);

export { ProvenanceSchema, ProvenanceSchemaR4 }