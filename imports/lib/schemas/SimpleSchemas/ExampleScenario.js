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
let ExampleScenario = BaseModel.extend();


// // Create a persistent data store for addresses to be stored.
// // HL7.Resources.ExampleScenarios = new Mongo.Collection('HL7.Resources.ExampleScenarios');
export let ExampleScenarios = new Mongo.Collection('ExampleScenarios');

//Assign a collection so the object knows how to perform CRUD operations
ExampleScenario.prototype._collection = ExampleScenarios;



//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
ExampleScenarios._transform = function (document) {
  return new ExampleScenario(document);
};

let ExampleScenarioSchema = DomainResourceSchema.extend({
  "resourceType" : {
    type: String,
    defaultValue: "ExampleScenario"
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
  "url" : {
      optional: true,
      type: String
    }, 
  "identifier" : {
    optional: true,
    type:  Array
    },
  "identifier.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },    
  "status" : {
    optional: true,
    type: String
  }, 
  "version" : {
    optional: true,
    type: String
  }, 
  "name" : {
    optional: true,
    type: String
  }, 
  "experimental" : {
    optional: true,
    type: Boolean
  }, 
  "date" : {
    optional: true,
    type: Date
  }, 
  "publisher" : {
    optional: true,
    type: Date
  }, 
  "contact" : {
    optional: true,
    type:  Array
    },
  "contact.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    }, 
  "useContext" : {
    optional: true,
    type:  Array
    },
  "useContext.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    }, 
  "jurisdiction" : {
    optional: true,
    type:  Array
    },
  "jurisdiction.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },   
  "copyright" : {
    optional: true,
    type: String
   }, 
  "purpose" : {
    optional: true,
    type: String
   }, 
   "actor" : {
    optional: true,
    type:  Array
    },
  "actor.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },  
  "instance" : {
    optional: true,
    type:  Array
    },
  "instance.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },  
  "process" : {
    optional: true,
    type:  Array
    },
  "process.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },  
  "process.$.title" : {
    optional: true,
    type:  String
    },  
  "process.$.description" : {
    optional: true,
    type:  String
    },  
  "process.$.preConditions" : {
    optional: true,
    type:  String
    },  
  "process.$.postConditions" : {
    optional: true,
    type:  String
    },  
  "process.$.step" : {
    optional: true,
    blackbox: true,
    type:  Array 
    },  
  "process.$.step.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },  
  "process.$.step.$.process" : {
      optional: true,
      type:  Array 
      },  
  "process.$.step.$.process.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },  
  "process.$.step.$.pause" : {
    optional: true,
    type:  Boolean 
    },  

  "process.$.step.$.operation" : {
      optional: true,
      type:  Array 
      },  
  "process.$.step.$.operation.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },  
  "process.$.step.$.operation.$.number" : {
      optional: true,
      type:  String 
      },  
  "process.$.step.$.operation.$.type" : {
    optional: true,
    type:  String 
    },  
  "process.$.step.$.operation.$.name" : {
    optional: true,
    type:  String 
    },  
  "process.$.step.$.operation.$.initiator" : {
    optional: true,
    type:  String 
    },  
  "process.$.step.$.operation.$.receiver" : {
    optional: true,
    type:  String 
    },  
  "process.$.step.$.operation.$.description" : {
    optional: true,
    type:  String 
    },  
  "process.$.step.$.operation.$.initatorActive" : {
    optional: true,
    type:  Boolean 
    },  
  "process.$.step.$.operation.$.receiverActive" : {
    optional: true,
    type:  Boolean 
    },  

  "process.$.step.$.operation.$.request" : {
    optional: true,
    blackbox: true,
    type:  Object
    },  
  "process.$.step.$.operation.$.response" : {
    optional: true,
    blackbox: true,
    type:  Object
    },  
                    
  "process.$.step.$.alternative" : {
      optional: true,
      type:  Array 
      },  
  "process.$.step.$.alternative.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },  

  "process.$.step.$.alternative.$.title" : {
    optional: true,
    type:  String
    },  
  "process.$.step.$.alternative.$.description" : {
    optional: true,
    type:  String
    }, 
  "process.$.step.$.alternative.$.step" : {
    optional: true,
    type:  Array
    },  
  "process.$.step.$.alternative.$.step.$" : {
    optional: true,
    blackbox: true,
    type:  Object
    }
});


// ExampleScenarios.attachSchema(ExampleScenarioSchema);


export default { ExampleScenario, ExampleScenarios, ExampleScenarioSchema };