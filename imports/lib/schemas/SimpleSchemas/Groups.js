// imports/lib/schemas/SimpleSchemas/Groups.js

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

// create the object using our BaseModel
let Group = BaseModel.extend();

export let Groups = new Mongo.Collection('Groups');

//Assign a collection so the object knows how to perform CRUD operations
Group.prototype._collection = Groups;

//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Groups._transform = function (document) {
  return new Group(document);
};

let GroupSchema = new SimpleSchema({
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
    defaultValue: "Group"
  },
  "active" : {
    type: Boolean,
    optional: true,
    defaultValue: true
  },
  "type" : {
    type: String,
    optional: true,
    allowedValues: ['person', 'animal', 'practitioner', 'device', 'careteam', 'healthcareservice', 'organization', 'relatedperson', 'specimen']
  },
  "actual" : {
    type: Boolean,
    optional: true,
    defaultValue: true
  },
  "code" : {
    type: Object,
    optional: true,
    blackbox: true
  },
  "name" : {
    type: String,
    optional: true
  },
  "description" : {
    type: String,
    optional: true
  },
  "quantity" : {
    type: Number,
    optional: true
  },
  "managingEntity" : {
    type: Object,
    optional: true,
    blackbox: true
  },
  "characteristic" : {
    type: Array,
    optional: true
  },
  "characteristic.$" : {
    type: Object,
    blackbox: true
  },
  "member" : {
    type: Array,
    optional: true
  },
  "member.$" : {
    type: Object,
    blackbox: true
  },
  "note" : {
    type: Array,
    optional: true
  },
  "note.$" : {
    type: Object,
    blackbox: true
  },
  "identifier" : {
    type: Array,
    optional: true
  },
  "identifier.$" : {
    type: Object,
    blackbox: true
  },
  "extension" : {
    type: Array,
    optional: true
  },
  "extension.$" : {
    type: Object,
    blackbox: true
  }
});

// Groups.attachSchema(GroupSchema);

export default { Group, Groups, GroupSchema };
