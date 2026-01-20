import SimpleSchema from 'simpl-schema';
import BaseModel from '../../BaseModel';

// create the object using our BaseModel
let Goal = BaseModel.extend();

export let Lists = new Mongo.Collection('Lists');

//Assign a collection so the object knows how to perform CRUD operations
Goal.prototype._collection = Lists;

// // Create a persistent data store for addresses to be stored.
// // HL7.Resources.Patients = new Mongo.Collection('HL7.Resources.Patients');

// if(typeof Lists === 'undefined'){
//   if(Package['clinical:autopublish']){
//     Lists = new Mongo.Collection('Lists');
//   } else if(Package['clinical:desktop-publish']){    
//     Lists = new Mongo.Collection('Lists');
//   } else {
//     Lists = new Mongo.Collection('Lists');
//   }
// }



//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Lists._transform = function (document) {
  return new Goal(document);
};



let ListsR4 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Goal"
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
  "title" :  {
    optional: true,
    type: String
  },
  "code" :  {
    optional: true,
    type: CodeableConceptSchema
  },
  "subject" :  {
    optional: true,
    type: ReferenceSchema
  },
  "source" :  {
    optional: true,
    type: ReferenceSchema
  },
  "encounter" :  {
    optional: true,
    type: ReferenceSchema
  },
  "status" :  {
    optional: true,
    type: Code
  },
  "date" :  {
    optional: true,
    type: Date
  },
  "orderedBy" :  {
    optional: true,
    type: CodeableConceptSchema
  },
  "mode" :  {
    optional: true,
    type: Code
  },
  "note" :  {
    optional: true,
    type: String
  },
  "entry" : {
    optional: true,
    type:  Array
    },
  "entry.$" : {
    optional: true,
    type:  Object 
    },  
  "entry.$.flag" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "entry.$.deleted" : {
    optional: true,
    type: Boolean
  },
  "entry.$.date" : {
    optional: true,
    type: Date
  },
  "entry.$.item" : {
    optional: true,
    type: ReferenceSchema
  },
  "emptyReason" : {
    optional: true,
    type: CodeableConceptSchema
  }
});

let GoalSchema = ListsR4;


// BaseSchema.extend(GoalSchema);
// DomainResourceSchema.extend(GoalSchema);

// Lists.attachSchema(GoalSchema);

export default { Goal, Lists, GoalSchema };