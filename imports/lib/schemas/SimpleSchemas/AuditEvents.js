// imports/lib/schemas/SimpleSchemas/AuditEvents.js
// Collection definition for AuditEvent resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/AuditEvent.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

export let AuditEvents = createFhirCollection('AuditEvent', 'AuditEvents');

// create the object using our BaseModel
let AuditEvent = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
AuditEvent.prototype._collection = AuditEvents;

//Add the transform to the collection
AuditEvents._transform = function (document) {
  return new AuditEvent(document);
};

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


export default { AuditEvent, AuditEvents };
