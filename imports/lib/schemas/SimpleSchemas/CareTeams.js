import { get } from 'lodash';
import validator from 'validator';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import { BaseSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, CodeableConceptSchema, AddressSchema, ReferenceSchema, PeriodSchema, Annotation } from 'meteor/clinical:hl7-resource-datatypes';


// if(Package['clinical:autopublish']){
//     console.log("*****************************************************************************")
//     console.log("HIPAA WARNING:  Your app has the 'clinical-autopublish' package installed.");
//     console.log("Any protected health information (PHI) stored in this app should be audited."); 
//     console.log("Please consider writing secure publish/subscribe functions and uninstalling.");  
//     console.log("");  
//     console.log("meteor remove clinical:autopublish");  
//     console.log("");  
//   }
//   if(Package['autopublish']){
//     console.log("*****************************************************************************")
//     console.log("HIPAA WARNING:  DO NOT STORE PROTECTED HEALTH INFORMATION IN THIS APP. ");  
//     console.log("Your application has the 'autopublish' package installed.  Please uninstall.");
//     console.log("");  
//     console.log("meteor remove autopublish");  
//     console.log("meteor add clinical:autopublish");  
//     console.log("");  
//   }
  
  
  
  // create the object using our BaseModel
  let CareTeam = BaseModel.extend();

  export let CareTeams = new Mongo.Collection('CareTeams');

  //Assign a collection so the object knows how to perform CRUD operations
  CareTeam.prototype._collection = CareTeams;
  

  
  //Add the transform to the collection since Meteor.users is pre-defined by the accounts package
  CareTeams._transform = function (document) {
    return new CareTeam(document);
  };
  
  
  
  
  let CareTeamR4 = new SimpleSchema({
    "resourceType" : {
      type: String,
      defaultValue: "CareTeam"
    },
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
    "status" : {
        optional: true,
        defaultValue: "active",
        allowedValues: ["proposed", "active", "suspended", "inactive", "entered-in-error"],
        type:  String
      },
    "category" : {
        optional: true,
        type: Array
      },
    "category.$" : {
        optional: true,
        type: CodeableConceptSchema
      },
    "name" : {
      optional: true,
      type: String
      },
    "subject" : {
        optional: true,
        type: ReferenceSchema
      },
    "encounter" : {
        optional: true,
        type: ReferenceSchema
      },
    "period" : {
        optional: true,
        type: PeriodSchema
      },
  

    "participant" : {
        optional: true,
        type: Array
      },
    "participant.$" : {
        optional: true,
        blackbox: true,
        type: Object
      },
    "participant.$.role" : {
        optional: true,
        type: Array
      },
    "participant.$.role.$" : {
        optional: true,
        type: CodeableConceptSchema
      },
    "participant.$.member" : {
        optional: true,
        type: ReferenceSchema
      },
    "participant.$.onBehalfOf" : {
        optional: true,
        type: ReferenceSchema
      },      
    "participant.$.period" : {
        optional: true,
        type: PeriodSchema
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
    "managingOrganization" : {
        optional: true,
        type: Array
      },
    "managingOrganization.$" : {
        optional: true,
        type: ReferenceSchema
      },
      
    "telecom" : {
      optional: true,
      type: Array
      },
    "telecom.$" : {
      optional: true,
      type: ContactPointSchema
      },

    "note" : {
        optional: true,
        type: Array
      },
    "note.$" : {
        optional: true,
        type: Annotation
      }      
  });
  
  
  let CareTeamSchema = CareTeamR4;
  
  BaseSchema.extend(CareTeamSchema);
  DomainResourceSchema.extend(CareTeamSchema);  

  // CareTeams.attachSchema(CareTeamSchema);
  

  
  
  CareTeam.prototype.toFhir = function(){
    console.log('CareTeam.toFhir()');
  
    return EJSON.stringify(this.name);
  }
  
  
  
  
  /**
   * @summary Search the CareTeams collection for a specific Meteor.userId().
   * @memberOf CareTeams
   * @name findMrn
   * @version 1.2.3
   * @returns {Boolean}
   * @example
   * ```js
   *  let patients = CareTeams.findMrn('12345').fetch();
   * ```
   */
  
  CareTeams.fetchBundle = function (query, parameters, callback) {
    process.env.TRACE && console.log("CareTeams.fetchBundle()");  
    var patientArray = CareTeams.find(query, parameters, callback).map(function(patient){
      patient.id = patient._id;
      delete patient._document;
      return patient;
    });
  
    // console.log("patientArray", patientArray);
  
    var result = Bundle.generate(patientArray);
  
    // console.log("result", result.entry[0]);
  
    return result;
  };
  
  
  /**
   * @summary This function takes a FHIR resource and prepares it for storage in Mongo.
   * @memberOf CareTeams
   * @name toMongo
   * @version 1.6.0
   * @returns { CareTeam }
   * @example
   * ```js
   *  let patients = CareTeams.toMongo('12345').fetch();
   * ```
   */
  
  CareTeams.toMongo = function (originalCareTeam) {
    var mongoRecord;
    process.env.TRACE && console.log("CareTeams.toMongo()");  
  
    if (originalCareTeam.identifier) {
      originalCareTeam.identifier.forEach(function(identifier){
        if (identifier.period) {
          if (identifier.period.start) {
            var startArray = identifier.period.start.split('-');
            identifier.period.start = new Date(startArray[0], startArray[1] - 1, startArray[2]);
          }
          if (identifier.period.end) {
            var endArray = identifier.period.end.split('-');
            identifier.period.end = new Date(startArray[0], startArray[1] - 1, startArray[2]);
          }
        }
      });
    }
  
    return originalCareTeam;
  };
  
  
  
  /**
   * @summary This function takes a DTSU2 resource and returns it as STU3.  i.e. it converts from v1.0.2 to v3.0.0
   * @name toMongo
   * @version 3.0.0
   * @returns { CareTeam }
   * @example
   * ```js
   * ```
   */
  CareTeams.toStu3 = function(patientJson){
    if(patientJson){
  
      // quick cast from string to boolean
      if(typeof patientJson.birthDate === "string"){
        patientJson.birthDate = new Date(patientJson.birthDate);
      }
  
      // quick cast from string to boolean
      if(patientJson.deceasedBoolean){
        patientJson.deceasedBoolean = (patientJson.deceasedBoolean == "true") ? true : false;
      }
  
      // STU3 only has a single entry for family name; not an array
      if(patientJson.name && patientJson.name[0] && patientJson.name[0].family && patientJson.name[0].family[0] ){
        patientJson.name[0].family = patientJson.name[0].family[0];      
      }
  
      // make sure the full name is filled out
      if(patientJson.name && patientJson.name[0] && patientJson.name[0].family && !patientJson.name[0].text ){
        patientJson.name[0].text = patientJson.name[0].given[0] + ' ' + patientJson.name[0].family;      
      }
    }
    return patientJson;
  }
  
  
  /**
   * @summary Similar to toMongo(), this function prepares a FHIR record for storage in the Mongo database.  The difference being, that this assumes there is already an existing record.
   * @memberOf CareTeams
   * @name prepForUpdate
   * @version 1.6.0
   * @returns { Object }
   * @example
   * ```js
   *  let patients = CareTeams.findMrn('12345').fetch();
   * ```
   */
  
  CareTeams.prepForUpdate = function (patient) {
    process.env.TRACE && console.log("CareTeams.prepForUpdate()");  
  
    if (patient.name && patient.name[0]) {
      //console.log("patient.name", patient.name);
  
      patient.name.forEach(function(name){
        name.resourceType = "HumanName";
      });
    }
  
    if (patient.telecom && patient.telecom[0]) {
      //console.log("patient.telecom", patient.telecom);
      patient.telecom.forEach(function(telecom){
        telecom.resourceType = "ContactPoint";
      });
    }
  
    if (patient.address && patient.address[0]) {
      //console.log("patient.address", patient.address);
      patient.address.forEach(function(address){
        address.resourceType = "Address";
      });
    }
  
    if (patient.contact && patient.contact[0]) {
      //console.log("patient.contact", patient.contact);
  
      patient.contact.forEach(function(contact){
        if (contact.name) {
          contact.name.resourceType = "HumanName";
        }
  
        if (contact.telecom && contact.telecom[0]) {
          contact.telecom.forEach(function(telecom){
            telecom.resourceType = "ContactPoint";
          });
        }
  
      });
    }
  
    return patient;
  };
  
  
  /**
   * @summary Scrubbing the patient; make sure it conforms to v1.6.0
   * @memberOf CareTeams
   * @name scrub
   * @version 1.2.3
   * @returns {Boolean}
   * @example
   * ```js
   *  let patients = CareTeams.findMrn('12345').fetch();
   * ```
   */
  
  CareTeams.prepForFhirTransfer = function (patient) {
    process.env.TRACE && console.log("CareTeams.prepForFhirTransfer()");  
  
  
    // FHIR has complicated and unusual rules about dates in order
    // to support situations where a family member might report on a patient's
    // date of birth, but not know the year of birth; and the other way around
    if (patient.birthDate) {
      patient.birthDate = moment(patient.birthDate).format("YYYY-MM-DD");
    }
  
  
    if (patient.name && patient.name[0]) {
      //console.log("patient.name", patient.name);
  
      patient.name.forEach(function(name){
        delete name.resourceType;
      });
    }
  
    if (patient.telecom && patient.telecom[0]) {
      //console.log("patient.telecom", patient.telecom);
      patient.telecom.forEach(function(telecom){
        delete telecom.resourceType;
      });
    }
  
    if (patient.address && patient.address[0]) {
      //console.log("patient.address", patient.address);
      patient.address.forEach(function(address){
        delete address.resourceType;
      });
    }
  
    if (patient.contact && patient.contact[0]) {
      //console.log("patient.contact", patient.contact);
  
      patient.contact.forEach(function(contact){
  
        console.log("contact", contact);
  
  
        if (contact.name && contact.name.resourceType) {
          //console.log("patient.contact.name", contact.name);
          delete contact.name.resourceType;
        }
  
        if (contact.telecom && contact.telecom[0]) {
          contact.telecom.forEach(function(telecom){
            delete telecom.resourceType;
          });
        }
  
      });
    }
  
    //console.log("CareTeams.prepForBundle()", patient);
  
    return patient;
  };
  
  /**
   * @summary The displayed name of the patient.
   * @memberOf CareTeam
   * @name displayName
   * @version 1.2.3
   * @returns {Boolean}
   * @example
   * ```js
   * ```
   */
  
  
  
  export { CareTeam, CareTeamSchema };
  