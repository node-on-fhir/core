// imports/lib/schemas/SimpleSchemas/Practitioners.js
// Collection definition for Practitioner resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Practitioner.json.

import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';


// create the object using our BaseModel
let Practitioner = BaseModel.extend();


export let Practitioners = createFhirCollection('Practitioner', 'Practitioners', {
  transform: function (document) {
    return new Practitioner(document);
  }
});

//Assign a collection so the object knows how to perform CRUD operations
Practitioner.prototype._collection = Practitioners;




// Transform is now applied in the collection constructor above


/**
 * @summary The displayed name of the practitioner.
 * @memberOf Practitioner
 * @name displayName
 * @version 1.2.3
 * @returns {Boolean}
 * @example
 * ```js
 * ```
 */

Practitioner.prototype.displayName = function () {
  if (this.name) {
    return this.name.text;
  }
};



/**
 * @summary The displayed Meteor.userId() of the practitioner.
 * @memberOf Practitioner
 * @name userId
 * @version 1.2.3
 * @returns {Boolean}
 * @example
 * ```js
 * ```
 */

Practitioner.prototype.userId = function () {
  var result = null;
  if (this.extension) {
    this.extension.forEach(function(extension){
      if (extension.url === "Meteor.userId()") {
        result = extension.valueString;
      }
    });
  }
  return result;
};



//=================================================================


Practitioners.fetchBundle = function (query, parameters, callback) {
  var practitionerArray = Practitioners.find(query, parameters, callback).map(function(practitioner){
    practitioner.id = practitioner._id;
    delete practitioner._document;
    return practitioner;
  });

  // console.log("practitionerArray", practitionerArray);

  var result = Bundle.generate(practitionerArray);

  // console.log("result", result.entry[0]);

  return result;
};


/**
 * @summary This function takes a FHIR resource and prepares it for storage in Mongo.
 * @memberOf Practitioners
 * @name toMongo
 * @version 1.6.0
 * @returns { Practitioner }
 * @example
 * ```js
 *  let practitioners = Practitioners.toMongo('12345').fetch();
 * ```
 */

Practitioners.toMongo = function (originalPractitioner) {
  var mongoRecord;
  process.env.TRACE && console.log('Practitioners.toMongo', originalPractitioner);


  if (originalPractitioner.identifier) {
    originalPractitioner.identifier.forEach(function(identifier){
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

  if (originalPractitioner.birthDate) {
    var birthdateArray = originalPractitioner.birthDate.split('-');
    originalPractitioner.birthDate = new Date(birthdateArray[0], birthdateArray[1] - 1, birthdateArray[2]);
  }


  return originalPractitioner;
};


/**
 * @summary Similar to toMongo(), this function prepares a FHIR record for storage in the Mongo database.  The difference being, that this assumes there is already an existing record.
 * @memberOf Practitioners
 * @name prepForUpdate
 * @version 1.6.0
 * @returns { Object }
 * @example
 * ```js
 *  let practitioners = Practitioners.findMrn('12345').fetch();
 * ```
 */

Practitioners.prepForUpdate = function (practitioner) {

  if (practitioner.name && practitioner.name[0]) {
    //console.log("practitioner.name", practitioner.name);

    practitioner.name.forEach(function(name){
      name.resourceType = "HumanName";
    });
  }

  if (practitioner.telecom && practitioner.telecom[0]) {
    //console.log("practitioner.telecom", practitioner.telecom);
    practitioner.telecom.forEach(function(telecom){
      telecom.resourceType = "ContactPoint";
    });
  }

  if (practitioner.address && practitioner.address[0]) {
    //console.log("practitioner.address", practitioner.address);
    practitioner.address.forEach(function(address){
      address.resourceType = "Address";
    });
  }

  if (practitioner.contact && practitioner.contact[0]) {
    //console.log("practitioner.contact", practitioner.contact);

    practitioner.contact.forEach(function(contact){
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

  return practitioner;
};


/**
 * @summary Scrubbing the practitioner; make sure it conforms to v1.6.0
 * @memberOf Practitioners
 * @name scrub
 * @version 1.2.3
 * @returns {Boolean}
 * @example
 * ```js
 *  let practitioners = Practitioners.findMrn('12345').fetch();
 * ```
 */

Practitioners.prepForFhirTransfer = function (practitioner) {
  //console.log("Practitioners.prepForBundle()");


  // FHIR has complicated and unusual rules about dates in order
  // to support situations where a family member might report on a practitioner's
  // date of birth, but not know the year of birth; and the other way around
  if (practitioner.birthDate) {
    practitioner.birthDate = moment(practitioner.birthDate).format("YYYY-MM-DD");
  }


  if (practitioner.name && practitioner.name[0]) {
    //console.log("practitioner.name", practitioner.name);

    practitioner.name.forEach(function(name){
      delete name.resourceType;
    });
  }

  if (practitioner.telecom && practitioner.telecom[0]) {
    //console.log("practitioner.telecom", practitioner.telecom);
    practitioner.telecom.forEach(function(telecom){
      delete telecom.resourceType;
    });
  }

  if (practitioner.address && practitioner.address[0]) {
    //console.log("practitioner.address", practitioner.address);
    practitioner.address.forEach(function(address){
      delete address.resourceType;
    });
  }

  if (practitioner.contact && practitioner.contact[0]) {
    //console.log("practitioner.contact", practitioner.contact);

    practitioner.contact.forEach(function(contact){

      console.log("contact", contact);


      if (contact.name && contact.name.resourceType) {
        //console.log("practitioner.contact.name", contact.name);
        delete contact.name.resourceType;
      }

      if (contact.telecom && contact.telecom[0]) {
        contact.telecom.forEach(function(telecom){
          delete telecom.resourceType;
        });
      }

    });
  }

  //console.log("Practitioners.prepForBundle()", practitioner);

  return practitioner;
};

/**
 * @summary The displayed name of the practitioner.
 * @memberOf Practitioner
 * @name displayName
 * @version 1.2.3
 * @returns {Boolean}
 * @example
 * ```js
 * ```
 */

Practitioner.prototype.displayName = function () {
  if (this.name && this.name[0]) {
    return this.name[0].text;
  }
};



export default { Practitioner };
