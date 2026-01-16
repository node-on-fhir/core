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


import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import { BaseSchema, DomainResourceSchema, CodingSchema, CodeableConceptSchema, ReferenceSchema, IdentifierSchema, PeriodSchema } from 'meteor/clinical:hl7-resource-datatypes';


// import ReferenceSchema from '../../../datatypes/Reference';
// import CodeableConceptSchema from '../../datatypes/CodeableConceptSchema';
// import IdentifierSchema from '../../datatypes/Identifier';
// import AnnotationSchema from '../../datatypes/Annotation';
// import PeriodSchema from '../../datatypes/Period';
// import Code from '../../datatypes/Code';
// import Range from '../../datatypes/Range';





// AuditEvents = new Mongo.Collection('AuditEvents', {connection: null});

// if(Package['clinical:autopublish']){
//   AuditEvents = new Mongo.Collection('AuditEvents');
// }
// if(Package['clinical:desktop-publish']){
//   AuditEvents = new Mongo.Collection('AuditEvents');
// }

export let AuditEvents = new Mongo.Collection('AuditEvents');


// create the object using our BaseModel
let AuditEvent = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
AuditEvent.prototype._collection = AuditEvents;

//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
AuditEvents._transform = function (document) {
  return new AuditEvent(document);
};


let AuditEventSchemaR4 = new SimpleSchema({
  'resourceType' : {
    type: String,
    defaultValue: 'AuditEvent'
  },
  "_id" : {
    optional: true,
    type: String
  },
  "id" : {
    optional: true,
    type: String
  },


  "category" : {
    optional: true,
    type: Array
  },
  "category.$" : {
    optional: true,
    type: CodeableConceptSchema,
  },
  "code" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "action" : {
    optional: true,
    type: String
  },
  "severity" : {
    optional: true,
    type: String 
  },
  "occurredPeriod" : {
    optional: true,
    type: PeriodSchema
  },
  "ocurredDateTime" : {
    optional: true,
    type: Date
  },
  "recorded" : {
    optional: true,
    type: Date
  },

  "outcome" : {
    optional: true,
    type: Array
  },
  "outcome.$" : {
    optional: true,
    type: Object
  },
  "outcome.$.code" : {
    optional: true,
    type: CodingSchema
  },
  "outcome.$.detail" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "authorization" : {
    optional: true,
    type: Array
  },
  "authorization.$" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "baseOn" : {
    optional: true,
    type: ReferenceSchema
  },
  "baseOn" : {
    optional: true,
    type: Array
  },
  "baseOn.$" : {
    optional: true,
    type: ReferenceSchema
  },
  "patient" : {
    optional: true,
    type: ReferenceSchema
  },
  "encounter" : {
    optional: true,
    type: ReferenceSchema
  },
  "agent" : {
    optional: true,
    type: Array
  },
  "agent.$" : {
    optional: true,
    type: Object
  },
  "agent.$.type" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "agent.$.role" : {
    optional: true,
    type: Array
  },
  "agent.$.role.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "agent.$.who" : {
    optional: true,
    type: ReferenceSchema
  },
  "agent.$.requestor" : {
    optional: true,
    type: Boolean
  },
  "agent.$.location" : {
    optional: true,
    type: ReferenceSchema
  },
  "agent.$.policy" : {
    optional: true,
    type: Array
  },
  "agent.$.policy.$" : {
    optional: true,
    type: String 
  },
  "agent.$.networkReference" : {
    optional: true,
    type: ReferenceSchema
  },
  "agent.$.networkUri" : {
    optional: true,
    type: ReferenceSchema
  },
  "agent.$.newtorkString" : {
    optional: true,
    type: ReferenceSchema
  },
  "agent.$.authorization" : {
    optional: true,
    type: Array
  },
  "agent.$.authorization.$" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "source" : {
    optional: true,
    type: Object
  },
  "source.site" : {
    optional: true,
    type: ReferenceSchema
  },
  "source.observer" : {
    optional: true,
    type: ReferenceSchema
  },
  "source.type" : {
    optional: true,
    type: Array
  },
  "source.type.$" : {
    optional: true,
    type: CodingSchema 
  },  


  "entity" : {
    optional: true,
    type: Array
  },
  "entity.$" : {
    optional: true,
    type: Object
  },
  "entity.$.what" : {
    optional: true,
    type: ReferenceSchema
  },
  "entity.$.role" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "entity.$.securityLabel" : {
    optional: true,
    type: Array
  },
  "entity.$.securityLabel" : {
    optional: true,
    type: CodeableConceptSchema
  },  
  "entity.$.query" : {
    optional: true,
    blackbox: true,
    type: Object
  },
  "entity.$.detail" : {
    optional: true,
    type: Array
  },
  "entity.$.detail.$" : {
    optional: true,
    type: Object,
    blackbox: true
  }
  
});

let AuditEventSchemaDstu2 = new SimpleSchema({
  'resourceType' : {
    type: String,
    defaultValue: 'AuditEvent'
  },
  "type" : {
    optional: true,
    type: CodingSchema
  },
  "code" : {
    optional: true,
    type: CodeableConceptSchema,
    blackbox: true
  },
  "subtype" : {
    optional: true,
    type: Array
  },
  "subtype.$" : {
    optional: true,
    type: CodingSchema 
  },
  "action" : {
    optional: true,
    type: String
  },
  "recorded" : {
    optional: true,
    type: Date
  },
  "outcome" : {
    optional: true,
    type: String
  },
  "outcomeDesc" : {
    optional: true,
    type: String
  },
  "purposeOfEvent" : {
    optional: true,
    type: Array
  },
  "purposeOfEvent.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "agent" : {
    optional: true,
    type: Array
  },
  "agent.$" : {
    optional: true,
    type: Object
  },
  "agent.$.role" : {
    optional: true,
    type: Array
  },
  "agent.$.role.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "agent.$.reference" : {
    optional: true,
    type: ReferenceSchema
  },
  "agent.$.userId" : {
    optional: true,
    type: IdentifierSchema
  },
  "agent.$.altId" : {
    optional: true,
    type: String
  },
  "agent.$.who" : {
    optional: true,
    type: ReferenceSchema
  },
  "agent.$.name" : {
    optional: true,
    type: String
  },
  "agent.$.requestor" : {
    optional: true,
    type: Boolean
  },
  "agent.$.location" : {
    optional: true,
    type: ReferenceSchema
  },
  "agent.$.policy" : {
    optional: true,
    type: Array
  },
  "agent.$.policy.$" : {
    optional: true,
    type: String 
  },
  "agent.$.media" : {
    optional: true,
    type: CodingSchema
  },
  "agent.$.network" : {
    optional: true,
    type: Object
  },
  "agent.$.network.address" : {
    optional: true,
    type: String
  },
  "agent.$.network.type" : {
    optional: true,
    type: String
  },
  "agent.$.purposeOfUse" : {
    optional: true,
    type: Array
  },
  "agent.$.purposeOfUse.$" : {
    optional: true,
    type: CodeableConceptSchema
  },  
  "source" : {
    optional: true,
    type: Object
  },
  "source.site" : {
    optional: true,
    type: String
  },
  "source.identifier" : {
    optional: true,
    type: IdentifierSchema
  },
  "source.type" : {
    optional: true,
    type: Array
  },
  "source.type.$" : {
    optional: true,
    type: CodingSchema 
  },  
  "entity" : {
    optional: true,
    type: Array
  },
  "entity.$" : {
    optional: true,
    type: Object
  },
  "entity.$.identifier" : {
    optional: true,
    type: IdentifierSchema
  },
  "entity.$.reference" : {
    optional: true,
    type: ReferenceSchema
  },
  "entity.$.type" : {
    optional: true,
    type: CodingSchema
  },
  "entity.$.role" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "entity.$.lifecycle" : {
    optional: true,
    type: CodingSchema
  },
  "entity.$.securityLabel" : {
    optional: true,
    type: Array
  },
  "entity.$.securityLabel" : {
    optional: true,
    type: CodeableConceptSchema
  },  
  "entity.$.name" : {
    optional: true,
    type: String
  },
  "entity.$.description" : {
    optional: true,
    type: String
  },
  "entity.$.query" : {
    optional: true,
    blackbox: true,
    type: Object
  },
  "entity.$.detail" : {
    optional: true,
    type: Array
  },
  "entity.$.detail.$" : {
    optional: true,
    type: Object
  },
  "entity.$.detail.$.type" : {
    optional: true,
    type: String
  },
  "entity.$.detail.$.value" : {
    optional: true,
    blackbox: true,
    type: Object
  }
});


BaseSchema.extend(AuditEventSchemaR4);
DomainResourceSchema.extend(AuditEventSchemaR4);

// AuditEvents.attachSchema(AuditEventSchemaR4);

let AuditEventSchema = AuditEventSchemaR4;






//==============================================================================


/**
 * @summary The displayed name of the auditEvent.
 * @memberOf AuditEvent
 * @name displayName
 * @version 1.2.3
 * @returns {Boolean}
 * @example
 * ```js
 * ```
 */

AuditEvent.prototype.toString = function () {
  return this._document;
};
AuditEvent.prototype.toFhir = function () {
  if(this._document.resourceType === "AuditEvent"){
    return this._document;
  } else {
    this._document;

// BlockChainEvent { address: '0x59d01dcbcc58224f21ddf5063a1070a37b29f6ec',
//   topics: 
//   [ '0x5e2510585e36c769ee0aa8d684b60b5f6efca424bb7cd9b1bab30f76120789e0',
//     '0x0000000000000000000000000c2b3a8a18a0c021e6b0b41933ab31e39e96903e' ],
//   data: '0x',
//   blockNumber: 3434,
//   transactionIndex: 0,
//   transactionHash: '0x5499113c83c8d4171af10caed59bf23ed906861bd073c4e8c9fb447b7b61891d',
//   blockHash: '0x9bd754b1a7cefc8f1d4412ad962653137ea9e47e1be31841a71abbe6ec406428',
//   logIndex: 0,
//   removed: false,
//   userName: 'Liddel, Alice',
//   timestamp: Thu Apr 06 2017 00:21:54 GMT-0500 (CDT) }

    // this._document.topics
    // this._document.address
    // this._document.data
    // this._document.blockNumber
    // this._document.transactionIndex
    // this._document.transactionHash
    // this._document.blockHash
    // this._document.logIndex
    // this._document.removed
    // this._document.userName
    // this._document.timestamp



    var result = {
      "resourceType": "AuditEvent",
      "type": {
        "system": "http://hl7.org/fhir/audit-event-type",
        "code": "rest",
        "display": "Restful Operation"
      },
      "subtype": [
        {
          "system": "http://hl7.org/fhir/restful-interaction",
          "code": "vread",
          "display": "vread"
        }
      ],
      "action": "R",
      "recorded": "",
      "outcome": "0",
      "agent": [],
      "source": {
        "site": "Blockchain on FHIR",
        "identifier": {
          "value": Meteor.absoluteUrl()
        },
        "type": [
          {
            "system": "http://hl7.org/fhir/security-source-type",
            "code": "3",
            "display": "Web Server"
          }
        ]
      },
      "entity": []
    };

    if(this._document.timestamp){
      result.recorded = this._document.timestamp;
    }
    var newAgent = {
      "userId": {
        "value": ""
      },
      "altId": "",
      "name": "",
      "requestor": true,
      "role": [
        {
          "coding": [
            {
              "system": "http://dicom.nema.org/resources/ontology/DCM",
              "code": "110153",
              "display": "Source Role ID"
            }
          ]
        }
      ],
      "network": {
        "address": "",
        "type": ""
      }
    };

    if(this._document.userName){
      newAgent.name = this._document.userName
    }
    if(this._document.userId){
      newAgent.userId.value = this._document.userId
    }
    if(this._document.blockHash){
      newAgent.altId = this._document.blockHash
    }
    if(this._document.address){
      newAgent.network.address = this._document.address;
      newAgent.network.type = "blockchain";
    }    
    result.agent.push(newAgent);

    return result;
  }
};





//=================================================================

AuditEvents.pulseCheck = function () {
  return "It's alive...";
};
AuditEvents.parseBlockchainResults = function (results) {
  process.env.DEBUG && console.log('results', results);

  results.forEach(function(result, index){
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~')
    var foo = new AuditEvent(result);
    console.log('AuditEvent', foo.toFhir());
  });
  
  return "Parsing some blockchain results...";
};

AuditEvents.fetchBundle = function (query, parameters, callback) {
  var auditEventArray = AuditEvents.find(query, parameters, callback).map(function(auditEvent){
    auditEvent.id = auditEvent._id;
    delete auditEvent._document;
    return auditEvent;
  });

  // console.log("auditEventArray", auditEventArray);

  var result = Bundle.generate(auditEventArray);

  // console.log("result", result.entry[0]);

  return result;
};


/**
 * @summary This function takes a FHIR resource and prepares it for storage in Mongo.
 * @memberOf AuditEvents
 * @name toMongo
 * @version 1.6.0
 * @returns { AuditEvent }
 * @example
 * ```js
 *  let auditEvents = AuditEvents.toMongo('12345').fetch();
 * ```
 */

AuditEvents.toMongo = function (originalAuditEvent) {
  var mongoRecord;

  // if (originalAuditEvent.identifier) {
  //   originalAuditEvent.identifier.forEach(function(identifier){
  //     if (identifier.period) {
  //       if (identifier.period.start) {
  //         var startArray = identifier.period.start.split('-');
  //         identifier.period.start = new Date(startArray[0], startArray[1] - 1, startArray[2]);
  //       }
  //       if (identifier.period.end) {
  //         var endArray = identifier.period.end.split('-');
  //         identifier.period.end = new Date(startArray[0], startArray[1] - 1, startArray[2]);
  //       }
  //     }
  //   });
  // }

  return originalAuditEvent;
};


/**
 * @summary Similar to toMongo(), this function prepares a FHIR record for storage in the Mongo database.  The difference being, that this assumes there is already an existing record.
 * @memberOf AuditEvents
 * @name prepForUpdate
 * @version 1.6.0
 * @returns { Object }
 * @example
 * ```js
 *  let auditEvents = AuditEvents.findMrn('12345').fetch();
 * ```
 */

AuditEvents.prepForUpdate = function (auditEvent) {

  if (auditEvent.name && auditEvent.name[0]) {
    //console.log("auditEvent.name", auditEvent.name);

    auditEvent.name.forEach(function(name){
      name.resourceType = "HumanName";
    });
  }

  if (auditEvent.telecom && auditEvent.telecom[0]) {
    //console.log("auditEvent.telecom", auditEvent.telecom);
    auditEvent.telecom.forEach(function(telecom){
      telecom.resourceType = "ContactPoint";
    });
  }

  if (auditEvent.address && auditEvent.address[0]) {
    //console.log("auditEvent.address", auditEvent.address);
    auditEvent.address.forEach(function(address){
      address.resourceType = "Address";
    });
  }

  if (auditEvent.contact && auditEvent.contact[0]) {
    //console.log("auditEvent.contact", auditEvent.contact);

    auditEvent.contact.forEach(function(contact){
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

  return auditEvent;
};


/**
 * @summary Scrubbing the auditEvent; make sure it conforms to v1.6.0
 * @memberOf AuditEvents
 * @name scrub
 * @version 1.2.3
 * @returns {Boolean}
 * @example
 * ```js
 *  let auditEvents = AuditEvents.findMrn('12345').fetch();
 * ```
 */

AuditEvents.prepForFhirTransfer = function (auditEvent) {
  //console.log("AuditEvents.prepForBundle()");


  // FHIR has complicated and unusual rules about dates in order
  // to support situations where a family member might report on a auditEvent's
  // date of birth, but not know the year of birth; and the other way around
  if (auditEvent.birthDate) {
    auditEvent.birthDate = moment(auditEvent.birthDate).format("YYYY-MM-DD");
  }


  if (auditEvent.name && auditEvent.name[0]) {
    //console.log("auditEvent.name", auditEvent.name);

    auditEvent.name.forEach(function(name){
      delete name.resourceType;
    });
  }

  if (auditEvent.telecom && auditEvent.telecom[0]) {
    //console.log("auditEvent.telecom", auditEvent.telecom);
    auditEvent.telecom.forEach(function(telecom){
      delete telecom.resourceType;
    });
  }

  if (auditEvent.address && auditEvent.address[0]) {
    //console.log("auditEvent.address", auditEvent.address);
    auditEvent.address.forEach(function(address){
      delete address.resourceType;
    });
  }

  if (auditEvent.contact && auditEvent.contact[0]) {
    //console.log("auditEvent.contact", auditEvent.contact);

    auditEvent.contact.forEach(function(contact){

      console.log("contact", contact);


      if (contact.name && contact.name.resourceType) {
        //console.log("auditEvent.contact.name", contact.name);
        delete contact.name.resourceType;
      }

      if (contact.telecom && contact.telecom[0]) {
        contact.telecom.forEach(function(telecom){
          delete telecom.resourceType;
        });
      }

    });
  }

  //console.log("AuditEvents.prepForBundle()", auditEvent);

  return auditEvent;
};

/**
 * @summary The displayed name of the auditEvent.
 * @memberOf AuditEvent
 * @name displayName
 * @version 1.2.3
 * @returns {Boolean}
 * @example
 * ```js
 * ```
 */

AuditEvent.prototype.displayName = function () {
  if (this.name && this.name[0]) {
    return this.name[0].text;
  }
};



//=================================================================

AuditEvents.allow({
  update() { return true; },
  insert() { return true; },
  remove() { return true; }
});

//=================================================================


export default { AuditEvent, AuditEvents, AuditEventSchema };